// Edge Function : génération du reporting hebdo structuré via l'API Groq
// (palier gratuit, modèles open-source hébergés). Clé gardée côté serveur
// (secret Supabase `GROQ_API_KEY`), jamais exposée au client. Re-fetch les
// notes côté serveur (le client ne fournit qu'un magasinId/formateurId/plage
// de dates, pas les notes elles-mêmes) pour éviter toute manipulation du
// contenu envoyé au modèle.
//
// Refonte 2 : taxonomie pole (CVO/MO-SAV/Magasin) x rubrique
// (Constaté/Fait/À faire), remplace l'ancien pôle unique avec "Conclusion"
// mêlée aux autres — "Conclusion" devient le flag mot_de_la_fin (séparé du
// classement pole/rubrique). Une note peut aussi être découpée en plusieurs
// éléments si elle contient à la fois un constat et une action.
//
// Refonte 3 : les notes confidentielles (manager uniquement) passent
// maintenant elles aussi par Groq — même structuration/orthographe que le
// public — mais via un DEUXIÈME appel API totalement séparé, sur un lot de
// notes qui ne contient QUE les notes confidentielles. Le modèle ne voit
// donc JAMAIS public et confidentiel dans le même contexte : aucune chance
// qu'une synthèse publique fasse référence à un contenu confidentiel, par
// construction (pas seulement par consigne de prompt).
//
// Refonte 4 : regroupement par THÈME, pas par ordre de saisie. Principe :
// « le modèle étiquette, le code assemble ». Deux appels Groq successifs par
// lot (public ou confidentiel, toujours séparés comme en Refonte 3) :
//   - Appel 1 (découpage) : chaque note est découpée en éléments atomiques,
//     chacun avec un thème brut (`themeRaw`) proposé librement. Les mots du
//     formateur ne sont plus reformulés « façon rapport » : seules les
//     fautes d'orthographe/grammaire/accents/ponctuation sont corrigées.
//   - Contrôle de couverture (code, pas le modèle) : chaque note source doit
//     se retrouver dans au moins un élément, avec un recouvrement de mots
//     suffisant. En cas d'échec : un seul retry de l'appel 1, puis, si ça
//     persiste, un élément de secours est fabriqué directement depuis le
//     texte brut de la note (sans IA), placé dans « Autres points » — on ne
//     perd jamais de contenu par construction du code.
//   - Appel 2 (fusion des thèmes) : reçoit uniquement les libellés de thème
//     bruts (jamais le texte des notes) et les regroupe sous un même titre
//     canonique par pôle, en respectant les thèmes déjà fixés manuellement
//     par le formateur (champ `theme` sur la note, prioritaire).
//   - Assemblage final 100% déterministe (code) : limite de 8 thèmes par
//     pôle, thèmes à un seul élément rattachés à « Autres points » (toujours
//     en dernier), tri des thèmes par nb d'« à faire » puis nb total, et à
//     l'intérieur d'un thème : rubriques Constaté → Fait → À faire puis
//     ordre chronologique.
//
// Déploiement : `supabase functions deploy reporting-generate`
// Secret requis : `supabase secrets set GROQ_API_KEY=gsk_...`
// (clé gratuite, sans carte bancaire : https://console.groq.com/keys)
// SUPABASE_URL et SUPABASE_ANON_KEY sont injectés automatiquement par la
// plateforme — pas besoin de les définir en secret.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const POLE_IDS = ['cvo', 'mo_sav', 'magasin']
const RUBRIQUE_IDS = ['constate', 'fait', 'a_faire']
const GROQ_MODEL = 'openai/gpt-oss-120b'

const MAX_THEMES_PAR_POLE = 8
const AUTRES_POINTS_LABEL = 'Autres points'
// Seuil de recouvrement de mots (texte source vs. texte généré) sous lequel
// une note est considérée comme perdue/tronquée. Volontairement permissif
// (une correction orthographique change des caractères, pas le sens) : ce
// n'est pas une comparaison exacte, juste un filet de sécurité anti-perte.
const COVERAGE_THRESHOLD = 0.5

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// Fetch unique, sans filtre confidentiel — le tri public/confidentiel se
// fait juste après, côté serveur, avant la moindre mise en forme d'appel à
// Groq (cf. handler principal). Pas de `select=` explicite : toutes les
// colonnes (dont `theme`) sont renvoyées par défaut par PostgREST.
async function fetchNotesSemaine(magasinId: string, formateurId: string, debut: string, fin: string) {
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const res = await fetch(
    `${url}/rest/v1/notes_terrain?magasin_id=eq.${magasinId}&formateur_id=eq.${formateurId}&date=gte.${debut}&date=lte.${fin}&order=date.asc`,
    { headers: { apikey: anon!, Authorization: `Bearer ${anon}` } }
  )
  if (!res.ok) throw new Error(`Lecture des notes échouée (${res.status})`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Normalisation / recouvrement de mots — utilisé uniquement pour le contrôle
// de couverture (détecter une perte de contenu), jamais pour la génération.
// ---------------------------------------------------------------------------

function normalizeTokens(s: string): Set<string> {
  const stripped = (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
  return new Set(stripped.split(' ').filter(t => t.length >= 2))
}

function overlapRatio(sourceText: string, targetText: string): number {
  const src = normalizeTokens(sourceText)
  if (src.size === 0) return 1
  const tgt = normalizeTokens(targetText)
  let hits = 0
  for (const t of src) if (tgt.has(t)) hits++
  return hits / src.size
}

function slugify(s: string): string {
  const base = (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return base || 'theme'
}

// ---------------------------------------------------------------------------
// Appel 1 — découpage atomique en éléments (pole, rubrique, thème brut)
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT_PASS1 = `Tu structures le reporting hebdomadaire d'un formateur d'opticiens, à partir de notes de terrain brutes. Tu ne rédiges pas un rapport : tu ÉTIQUETTES chaque note. C'est le code, ensuite, qui regroupe et met en forme — pas toi.

RÈGLE D'ORTHOGRAPHE, SANS EXCEPTION : tout texte que tu produis doit être rédigé dans un français impeccable — aucune faute d'orthographe, de conjugaison ou de grammaire tolérée, même si la note source en contient.

Tu produis trois choses de nature différente — ne les confonds pas :

1. UNE SYNTHÈSE GLOBALE ("syntheseGlobale") : un court paragraphe (3-5 phrases) qui condense l'ensemble de la semaine dans tes propres mots — tu PEUX ici reformuler, regrouper les idées et donner une vue d'ensemble. Reste factuel, mais la reformulation est autorisée pour ce champ uniquement.

2. LE MOT DE LA FIN ("motDeLaFin") : les notes marquées "mot de la fin : oui" ne vont JAMAIS dans "elements". Rassemble-les dans "motDeLaFin" (texte unique, une note par ligne, ordre chronologique), en corrigeant uniquement l'orthographe/la grammaire — ZÉRO reformulation du style ou du sens. S'il n'y a aucune note "mot de la fin", mets motDeLaFin à null.

3. LES ÉLÉMENTS ("elements") : toutes les autres notes, découpées en éléments atomiques (une idée = un élément). ZÉRO REFORMULATION DES MOTS DU FORMATEUR : les seules corrections autorisées sont l'orthographe, la grammaire, les accents et la ponctuation. Tu gardes les phrases du formateur telles qu'il les a écrites — tu ne les rends pas "plus pro", tu ne les raccourcis pas, tu ne les développes pas. Si une note mélange clairement plusieurs idées distinctes (ex: un constat ET une action à faire), sépare-les en éléments distincts, chacun gardant le texte exact qui le concerne — mais ne fusionne jamais deux notes différentes en un seul élément, et ne perds aucune phrase.

Pour chaque élément, détermine :
- noteId : l'id de la note source (peut se répéter si une note est découpée en plusieurs éléments)
- pole : SI la note a un "pole donné", utilise-le tel quel, sans discussion. SINON déduis-le du contenu : CVO = vente, discours client, argumentaire, saisie ; MO-SAV = retrait, ajustage, RAZ, laboratoire, stock, montage ; Magasin = propreté, merchandising, ambiance, organisation générale. En cas de doute, Magasin.
- rubrique : SI la note a une "rubrique donnée", utilise-la telle quelle, sans discussion. SINON déduis-la du contenu : Constaté = une observation ("j'ai vu", "j'ai entendu", "il y a", "on m'a dit") ; Fait = une action déjà réalisée par le formateur ("j'ai repris", "j'ai montré", "j'ai corrigé", "j'ai formé") ; À faire = une recommandation ou suite à donner ("je reviendrai", "il faut", "à revoir", "je formerai") — "À faire" désigne une consigne que le manager devra pouvoir cocher une fois traitée, formule-la comme une action claire et actionnable, mais SANS changer les mots du formateur au-delà des corrections autorisées.
- themeRaw : le sujet réel dont parle cet élément, en 5 mots maximum, une seule ligne (ex: "SMS de paire prête", "Casiers Outlet", "Propreté du magasin"). SI la note a un "thème donné", reprends-le tel quel comme themeRaw. Un même sujet évoqué dans plusieurs notes différentes doit recevoir le même themeRaw autant que possible (même si une fusion plus fine est faite après, par un autre traitement) ; ne mélange jamais deux sujets différents dans un seul themeRaw.
- resume : le texte de cet élément, mot pour mot (hors corrections autorisées) — l'idée centrale de cette note ou de ce morceau de note.
- detail : s'il reste, dans la MÊME note, du texte verbatim (corrigé) qui complète ce même élément sans faire doublon avec resume, mets-le ici ; sinon null. Jamais une reformulation "plus détaillée" — seulement du texte additionnel réellement présent dans la note.

Réponds uniquement avec le JSON demandé, rien d'autre.`

const JSON_SCHEMA_PASS1 = {
  name: 'decoupage_reporting',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      syntheseGlobale: { type: 'string' },
      motDeLaFin: { type: ['string', 'null'] },
      elements: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            noteId: { type: 'string' },
            pole: { type: 'string', enum: POLE_IDS },
            rubrique: { type: 'string', enum: RUBRIQUE_IDS },
            themeRaw: { type: 'string' },
            resume: { type: 'string' },
            detail: { type: ['string', 'null'] },
          },
          required: ['noteId', 'pole', 'rubrique', 'themeRaw', 'resume', 'detail'],
          additionalProperties: false,
        },
      },
    },
    required: ['syntheseGlobale', 'motDeLaFin', 'elements'],
    additionalProperties: false,
  },
}

function buildUserContentPass1(notes: any[]) {
  const lines = notes.map((n: any) => {
    const pole = n.pole ? `pole donné: ${n.pole}` : 'pole: non renseigné'
    const rubrique = n.rubrique ? `rubrique donnée: ${n.rubrique}` : 'rubrique: non renseignée'
    const theme = n.theme ? ` · thème donné: ${n.theme}` : ''
    const motFin = n.mot_de_la_fin ? ' · mot de la fin : oui' : ''
    return `--- Note id=${n.id} · date=${n.date} · ${pole} · ${rubrique}${theme}${motFin} ---\n${n.contenu || '(pas de texte — pièce jointe seule)'}`
  })
  return `Voici les notes de la semaine (l'ordre d'écriture ci-dessous n'a aucune importance pour le classement) :\n\n${lines.join('\n\n')}`
}

function validatePass1Output(data: any, sourceNotes: any[]) {
  if (!data || !Array.isArray(data.elements)) return false
  if (typeof data.syntheseGlobale !== 'string' || !data.syntheseGlobale.trim()) return false
  if (data.motDeLaFin !== null && typeof data.motDeLaFin !== 'string') return false
  const sourceIds = new Set(sourceNotes.map((n: any) => String(n.id)))
  for (const item of data.elements) {
    if (!item.noteId || !sourceIds.has(String(item.noteId))) return false
    if (!POLE_IDS.includes(item.pole)) return false
    if (!RUBRIQUE_IDS.includes(item.rubrique)) return false
    if (typeof item.themeRaw !== 'string' || !item.themeRaw.trim()) return false
    if (typeof item.resume !== 'string' || !item.resume.trim()) return false
    if (item.detail !== null && typeof item.detail !== 'string') return false
  }
  return true
}

async function callPass1(notes: any[], apiKey: string) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_PASS1 },
        { role: 'user', content: buildUserContentPass1(notes) },
      ],
      response_format: { type: 'json_schema', json_schema: JSON_SCHEMA_PASS1 },
      // Texte gardé verbatim (zéro reformulation) : la sortie peut être plus
      // longue qu'avant (plus de notes, plusieurs éléments par note). Sans
      // ce paramètre explicite, le défaut du modèle peut tronquer la
      // génération en plein JSON → échec de validation côté Groq.
      max_tokens: 8000,
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('[reporting-generate] Groq API error (découpage)', res.status, errText)
    throw new Error("Génération impossible (API Groq indisponible). Les notes n'ont pas été modifiées.")
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    console.error('[reporting-generate] Réponse Groq inattendue (découpage)', JSON.stringify(data).slice(0, 500))
    throw new Error("Réponse inattendue du modèle. Les notes n'ont pas été modifiées.")
  }

  let parsed: any
  try { parsed = JSON.parse(content) } catch {
    throw new Error("Structure générée invalide. Les notes n'ont pas été modifiées.")
  }

  if (!validatePass1Output(parsed, notes)) {
    throw new Error("Structure générée invalide. Les notes n'ont pas été modifiées.")
  }

  return parsed as { syntheseGlobale: string; motDeLaFin: string | null; elements: any[] }
}

// Contrôle de couverture : renvoie les ids des notes source dont le texte ne
// se retrouve pas suffisamment (ou pas du tout) dans le résultat généré.
function findFailingNotes(notes: any[], elements: any[], motDeLaFin: string | null): string[] {
  const failing: string[] = []
  for (const note of notes) {
    const id = String(note.id)
    if (note.mot_de_la_fin) {
      if (!note.contenu?.trim()) continue
      if (overlapRatio(note.contenu, motDeLaFin || '') < COVERAGE_THRESHOLD) failing.push(id)
      continue
    }
    const own = elements.filter((e: any) => String(e.noteId) === id)
    const hasContent = Boolean(note.contenu?.trim()) || Boolean(note.pieces_jointes?.length) || Boolean(note.audio_url)
    if (!hasContent) continue
    if (!own.length) { failing.push(id); continue }
    if (note.contenu?.trim()) {
      const combined = own.map((e: any) => `${e.resume} ${e.detail || ''}`).join(' ')
      if (overlapRatio(note.contenu, combined) < COVERAGE_THRESHOLD) failing.push(id)
    }
  }
  return failing
}

// ---------------------------------------------------------------------------
// Appel 2 — fusion des thèmes bruts en titres canoniques, par pôle
// ---------------------------------------------------------------------------

const POLE_LABELS: Record<string, string> = { cvo: 'CVO', mo_sav: 'MO/SAV', magasin: 'Magasin' }
const RUBRIQUE_LABELS: Record<string, string> = { constate: 'Constaté', fait: 'Fait', a_faire: 'À faire' }

const SYSTEM_PROMPT_PASS2 = `Tu reçois, pôle par pôle, une liste de titres de thème bruts (proposés indépendamment pour chaque élément d'un reporting) et éventuellement une liste de thèmes déjà fixés par le formateur.

Ta tâche : regrouper les thèmes bruts qui désignent le même sujet réel sous un même titre canonique, même si leur formulation diffère (ex: "Outlet" et "montures en attente dans les casiers" désignent le même sujet et doivent fusionner).

Règles strictes :
- Jamais plus de 8 thèmes canoniques par pôle.
- Si des thèmes fixés sont fournis pour un pôle, reprends-les tels quels comme titre canonique (ne les renomme JAMAIS) et rattache-y les thèmes bruts qui parlent du même sujet. Ne crée jamais un thème canonique différent pour un sujet déjà couvert par un thème fixé.
- Chaque thème brut listé doit apparaître dans exactement un cluster.
- Un titre canonique fait 5 mots maximum et tient sur une seule ligne.
- Si le même sujet réel apparaît dans les listes de PLUSIEURS pôles différents (ex: un même problème de rangement évoqué à la fois côté Magasin et côté MO-SAV), utilise EXACTEMENT le même titre canonique dans chaque pôle concerné, pour que le lecteur reconnaisse immédiatement qu'il s'agit du même sujet même si le classement par pôle les sépare physiquement dans le document.

Réponds uniquement avec le JSON demandé, rien d'autre.`

const JSON_SCHEMA_PASS2 = {
  name: 'fusion_themes',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      poles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pole: { type: 'string', enum: POLE_IDS },
            clusters: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  canonicalTitle: { type: 'string' },
                  rawThemes: { type: 'array', items: { type: 'string' } },
                },
                required: ['canonicalTitle', 'rawThemes'],
                additionalProperties: false,
              },
            },
          },
          required: ['pole', 'clusters'],
          additionalProperties: false,
        },
      },
    },
    required: ['poles'],
    additionalProperties: false,
  },
}

type PoleThemeInfo = { fixed: Set<string>; raw: Map<string, string> }

function buildUserContentPass2(polesToCluster: [string, PoleThemeInfo][]) {
  const blocks = polesToCluster.map(([pole, { fixed, raw }]) => {
    const fixedLines = fixed.size
      ? `Thèmes déjà fixés pour ce pôle (ne jamais les renommer, tu peux y rattacher un thème brut proche mais n'en crée pas un autre pour le même sujet) :\n${[...fixed].map(t => `- ${t}`).join('\n')}`
      : 'Aucun thème fixé pour ce pôle.'
    const rawLines = [...raw.entries()].map(([t, example]) => `- "${t}" (exemple : ${example})`).join('\n')
    return `### Pôle ${POLE_LABELS[pole]}\n${fixedLines}\n\nThèmes bruts à regrouper :\n${rawLines}`
  })
  return blocks.join('\n\n')
}

// Un seul essai d'appel à Groq pour la fusion des thèmes — renvoie `null` en
// cas d'échec (réseau, HTTP, parsing), jamais ne lève.
async function callPass2Once(polesToCluster: [string, PoleThemeInfo][], apiKey: string) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT_PASS2 },
          { role: 'user', content: buildUserContentPass2(polesToCluster) },
        ],
        response_format: { type: 'json_schema', json_schema: JSON_SCHEMA_PASS2 },
        max_tokens: 2000,
      }),
    })
    if (!res.ok) {
      console.error('[reporting-generate] Groq API error (fusion thèmes)', res.status, await res.text().catch(() => ''))
      return null
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    const parsed = content ? JSON.parse(content) : null
    return Array.isArray(parsed?.poles) ? parsed.poles : null
  } catch (e) {
    console.error('[reporting-generate] Échec fusion thèmes', e)
    return null
  }
}

// Fusionne les thèmes bruts d'un même pôle sous des titres canoniques.
// Jamais appelée sur du texte de note — seulement sur des libellés de thème
// — donc aucun risque de perte de contenu à cette étape. Un échec de l'appel
// (réseau, modèle, limite de débit) est relancé une fois ; s'il persiste,
// repli silencieux : chaque thème brut devient son propre thème canonique
// (le code gère ensuite les thèmes à un seul élément via le rattachement à
// "Autres points").
async function clusterThemes(elements: any[], apiKey: string): Promise<Record<string, Record<string, string>>> {
  const byPole: Record<string, PoleThemeInfo> = {}
  for (const el of elements) {
    if (el.fixedTheme) continue
    if (!byPole[el.pole]) byPole[el.pole] = { fixed: new Set(), raw: new Map() }
    if (!byPole[el.pole].raw.has(el.themeRaw)) byPole[el.pole].raw.set(el.themeRaw, el.resume)
  }
  for (const el of elements) {
    if (el.fixedTheme && el.fixedTheme !== AUTRES_POINTS_LABEL) {
      if (!byPole[el.pole]) byPole[el.pole] = { fixed: new Set(), raw: new Map() }
      byPole[el.pole].fixed.add(el.fixedTheme)
    }
  }

  const polesToCluster = Object.entries(byPole).filter(([, v]) => v.raw.size > 0)
  if (!polesToCluster.length) return {}

  const map: Record<string, Record<string, string>> = {}
  const poles = (await callPass2Once(polesToCluster, apiKey)) || (await callPass2Once(polesToCluster, apiKey))
  if (poles) {
    for (const poleEntry of poles) {
      if (!POLE_IDS.includes(poleEntry.pole) || !Array.isArray(poleEntry.clusters)) continue
      map[poleEntry.pole] = {}
      for (const cluster of poleEntry.clusters) {
        if (!cluster.canonicalTitle || !Array.isArray(cluster.rawThemes)) continue
        for (const raw of cluster.rawThemes) map[poleEntry.pole][raw] = cluster.canonicalTitle
      }
    }
  }

  // Réparation : tout themeRaw envoyé mais absent de la réponse (échec API,
  // oubli du modèle) devient son propre thème canonique.
  for (const [pole, { raw }] of polesToCluster) {
    if (!map[pole]) map[pole] = {}
    for (const rawTheme of raw.keys()) {
      if (!map[pole][rawTheme]) map[pole][rawTheme] = rawTheme
    }
  }
  return map
}

// ---------------------------------------------------------------------------
// Assemblage final — 100% déterministe, aucune décision de tri laissée au modèle
// ---------------------------------------------------------------------------

function mergeThemeInto(themesForPole: Record<string, Record<string, any[]>>, fromLabel: string, intoLabel: string) {
  if (!themesForPole[intoLabel]) themesForPole[intoLabel] = {}
  for (const rubId of RUBRIQUE_IDS) {
    if (!themesForPole[fromLabel][rubId]?.length) continue
    if (!themesForPole[intoLabel][rubId]) themesForPole[intoLabel][rubId] = []
    themesForPole[intoLabel][rubId].push(...themesForPole[fromLabel][rubId])
  }
  delete themesForPole[fromLabel]
}

function assemble(sourceNotes: any[], modelOutput: { syntheseGlobale: string; motDeLaFin: string | null; elements: any[] }) {
  const byId = Object.fromEntries(sourceNotes.map((n: any) => [String(n.id), n]))
  const seenNoteIds = new Set<string>() // pièces jointes affichées une seule fois, sur le 1er élément de la note source

  // pole -> thème -> rubrique -> items[]
  const byPole: Record<string, Record<string, Record<string, any[]>>> = {}

  for (const item of modelOutput.elements) {
    const src = byId[String(item.noteId)]
    if (!src) continue
    const first = !seenNoteIds.has(String(item.noteId))
    seenNoteIds.add(String(item.noteId))
    const themeLabel = item.theme || AUTRES_POINTS_LABEL
    const built = {
      resume: item.resume,
      detail: item.detail,
      date: src.date,
      collaborateurs: src.collaborateurs_cites || [],
      piecesJointes: first ? (src.pieces_jointes || []) : [],
      audioUrl: first ? (src.audio_url || null) : null,
      // Suivi persistant des "à faire" — coché par le manager, vérifiable au
      // prochain passage par un formateur ou un directeur. N'existe qu'à la
      // création ; une régénération ultérieure repart à false (une nouvelle
      // génération = un nouveau brouillon, le suivi ne s'applique qu'une fois publié).
      done: false,
      doneAt: null,
    }
    if (!byPole[item.pole]) byPole[item.pole] = {}
    if (!byPole[item.pole][themeLabel]) byPole[item.pole][themeLabel] = {}
    if (!byPole[item.pole][themeLabel][item.rubrique]) byPole[item.pole][themeLabel][item.rubrique] = []
    byPole[item.pole][themeLabel][item.rubrique].push(built)
  }

  const countTotal = (rubriques: Record<string, any[]>) =>
    RUBRIQUE_IDS.reduce((sum, r) => sum + (rubriques[r]?.length || 0), 0)

  const sections = POLE_IDS
    .filter(poleId => byPole[poleId] && Object.keys(byPole[poleId]).length)
    .map(poleId => {
      const themesForPole = byPole[poleId]
      let themeLabels = Object.keys(themesForPole).filter(t => t !== AUTRES_POINTS_LABEL)

      // Limite de 8 thèmes par pôle : au-delà, les plus petits rejoignent "Autres points".
      if (themeLabels.length > MAX_THEMES_PAR_POLE) {
        themeLabels.sort((a, b) => countTotal(themesForPole[b]) - countTotal(themesForPole[a]))
        const overflow = themeLabels.slice(MAX_THEMES_PAR_POLE)
        themeLabels = themeLabels.slice(0, MAX_THEMES_PAR_POLE)
        for (const label of overflow) mergeThemeInto(themesForPole, label, AUTRES_POINTS_LABEL)
      }

      // Thème à un seul élément : rattaché à "Autres points".
      themeLabels = themeLabels.filter(label => {
        if (countTotal(themesForPole[label]) === 1) {
          mergeThemeInto(themesForPole, label, AUTRES_POINTS_LABEL)
          return false
        }
        return true
      })

      // Tri : plus de "à faire" d'abord, puis plus d'éléments au total. "Autres
      // points" (s'il existe) est toujours placé en dernier, hors de ce tri.
      themeLabels.sort((a, b) => {
        const aFaireA = themesForPole[a]['a_faire']?.length || 0
        const aFaireB = themesForPole[b]['a_faire']?.length || 0
        if (aFaireB !== aFaireA) return aFaireB - aFaireA
        return countTotal(themesForPole[b]) - countTotal(themesForPole[a])
      })
      if (themesForPole[AUTRES_POINTS_LABEL]) themeLabels.push(AUTRES_POINTS_LABEL)

      const themes = themeLabels.map(label => {
        const rubriquesPourTheme = themesForPole[label]
        const rubriques = RUBRIQUE_IDS
          .filter(rubId => rubriquesPourTheme[rubId]?.length)
          .map(rubId => ({
            rubrique: rubId,
            label: RUBRIQUE_LABELS[rubId],
            // Seul endroit où la date influence encore l'ordre : à l'intérieur
            // d'une rubrique, jamais entre thèmes.
            items: [...rubriquesPourTheme[rubId]].sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))),
          }))
        return {
          theme: label === AUTRES_POINTS_LABEL ? 'autres-points' : slugify(label),
          label,
          count: countTotal(rubriquesPourTheme),
          rubriques,
        }
      })

      return { pole: poleId, label: POLE_LABELS[poleId], themes }
    })

  const collabCounts: Record<string, { id: string; nom: string; count: number }> = {}
  for (const n of sourceNotes) {
    for (const c of (n.collaborateurs_cites || [])) {
      if (!collabCounts[c.id]) collabCounts[c.id] = { id: c.id, nom: c.nom, count: 0 }
      collabCounts[c.id].count++
    }
  }

  return {
    syntheseGlobale: modelOutput.syntheseGlobale,
    sections,
    motDeLaFin: modelOutput.motDeLaFin || null,
    collaborateursCites: Object.values(collabCounts),
  }
}

// ---------------------------------------------------------------------------
// Orchestration — découpage + contrôle de couverture (+ retry/repli) + fusion
// des thèmes + assemblage, pour UN lot de notes donné (public OU confidentiel,
// jamais les deux mélangés, cf. en-tête de fichier).
// ---------------------------------------------------------------------------

async function genererStructureAvecThemes(notes: any[], apiKey: string) {
  const notesById = Object.fromEntries(notes.map((n: any) => [String(n.id), n]))

  let pass1 = await callPass1(notes, apiKey)
  let failing = findFailingNotes(notes, pass1.elements, pass1.motDeLaFin)
  if (failing.length) {
    console.warn('[reporting-generate] Couverture incomplète, relance du découpage', failing)
    pass1 = await callPass1(notes, apiKey)
    failing = findFailingNotes(notes, pass1.elements, pass1.motDeLaFin)
    if (failing.length) {
      console.warn('[reporting-generate] Couverture toujours incomplète après relance, repli sans IA', failing)
    }
  }

  const elements: any[] = pass1.elements.filter((e: any) => !failing.includes(String(e.noteId)))
  let motDeLaFin = pass1.motDeLaFin

  for (const noteId of failing) {
    const note = notesById[noteId]
    if (!note) continue
    if (note.mot_de_la_fin) {
      motDeLaFin = motDeLaFin ? `${motDeLaFin}\n${note.contenu}` : note.contenu
      continue
    }
    // Élément de secours fabriqué directement depuis le texte brut de la
    // note, sans passer par le modèle : garantit qu'aucun contenu n'est
    // perdu, même si le modèle échoue deux fois de suite sur cette note.
    elements.push({
      noteId,
      pole: note.pole || 'magasin',
      rubrique: note.rubrique || 'constate',
      themeRaw: AUTRES_POINTS_LABEL,
      resume: note.contenu || '(pièce jointe sans texte)',
      detail: null,
      fixedTheme: AUTRES_POINTS_LABEL,
    })
  }

  // Thème manuel du formateur sur la note : prioritaire, jamais soumis à la
  // fusion par le modèle.
  for (const el of elements) {
    if (el.fixedTheme) continue
    const note = notesById[String(el.noteId)]
    if (note?.theme && note.theme.trim()) el.fixedTheme = note.theme.trim()
  }

  const clusterMap = await clusterThemes(elements, apiKey)
  for (const el of elements) {
    el.theme = el.fixedTheme || clusterMap[el.pole]?.[el.themeRaw] || el.themeRaw
  }

  return assemble(notes, { syntheseGlobale: pass1.syntheseGlobale, motDeLaFin, elements })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { magasinId, formateurId, semaineDebut, semaineFin } = await req.json()
    if (!magasinId || !formateurId || !semaineDebut || !semaineFin) {
      return json({ error: 'Paramètres manquants.' }, 400)
    }

    const allNotes = await fetchNotesSemaine(magasinId, formateurId, semaineDebut, semaineFin)
    const publicNotes = allNotes.filter((n: any) => !n.confidentiel)
    const confidentialNotes = allNotes.filter((n: any) => n.confidentiel)
    if (!publicNotes.length && !confidentialNotes.length) {
      return json({ error: 'Aucune note cette semaine — rien à générer.' }, 200)
    }

    const apiKey = Deno.env.get('GROQ_API_KEY')
    if (!apiKey) return json({ error: "Clé API Groq non configurée côté serveur. Les notes n'ont pas été modifiées." }, 500)

    // Deux circuits indépendants : le modèle ne voit jamais confidentiel et
    // public dans le même contexte, donc ne peut structurellement pas faire
    // fuiter l'un dans l'autre.
    const contenuStructure = publicNotes.length
      ? await genererStructureAvecThemes(publicNotes, apiKey)
      : { syntheseGlobale: '', sections: [], motDeLaFin: null, collaborateursCites: [] }

    const confidentielStructure = confidentialNotes.length
      ? await genererStructureAvecThemes(confidentialNotes, apiKey)
      : null

    return json({ contenuStructure, confidentielStructure })
  } catch (e) {
    console.error('[reporting-generate]', e)
    const message = e instanceof Error ? e.message : "Erreur serveur pendant la génération. Les notes n'ont pas été modifiées."
    return json({ error: message }, 500)
  }
})
