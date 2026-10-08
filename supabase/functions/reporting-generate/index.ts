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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// confidentiel=eq.false : garantie côté serveur (pas seulement côté client)
// qu'un texte confidentiel (potentiellement sensible RH) n'est jamais inclus
// dans ce qui part vers l'API Groq, même en cas de bug côté appelant.
async function fetchNotesSemaine(magasinId: string, formateurId: string, debut: string, fin: string) {
  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const res = await fetch(
    `${url}/rest/v1/notes_terrain?magasin_id=eq.${magasinId}&formateur_id=eq.${formateurId}&date=gte.${debut}&date=lte.${fin}&confidentiel=eq.false&order=date.asc`,
    { headers: { apikey: anon!, Authorization: `Bearer ${anon}` } }
  )
  if (!res.ok) throw new Error(`Lecture des notes échouée (${res.status})`)
  return res.json()
}

const SYSTEM_PROMPT = `Tu structures le reporting hebdomadaire d'un formateur d'opticiens, à partir de notes de terrain brutes.

Tu produis trois choses de nature différente — ne les confonds pas :

1. UNE SYNTHÈSE GLOBALE ("syntheseGlobale") : un court paragraphe (3-5 phrases) qui condense l'ensemble de la semaine dans tes propres mots — tu PEUX ici reformuler, regrouper les idées et donner une vue d'ensemble. Reste factuel, mais la reformulation est autorisée pour ce champ uniquement.

2. LE MOT DE LA FIN ("motDeLaFin") : les notes marquées "mot de la fin : oui" ne vont JAMAIS dans "elements". Corrige-les et rassemble-les dans "motDeLaFin" (texte unique, une note par ligne, ordre chronologique). Aucune reformulation ici, seulement les corrections autorisées (voir règle ci-dessous). S'il n'y a aucune note "mot de la fin", mets motDeLaFin à null.

3. LES ÉLÉMENTS ("elements") : toutes les autres notes, présentées comme un vrai rapport professionnel, lisible par un manager ou un directeur qui n'était pas sur place. Tu PEUX et DOIS reformuler pour que ce soit clair, concis et bien tourné — ce n'est plus une transcription brute. RÈGLE : reste fidèle aux FAITS (aucune information inventée, aucun conseil ou jugement que le formateur n'a pas exprimé, chiffres/exemples/citations/noms propres exacts) — mais la formulation, elle, doit être reformulée proprement, pas recopiée mot à mot.

Pour chaque note, tu peux produire UN SEUL élément, ou PLUSIEURS si la note mélange clairement plusieurs idées distinctes (ex: un constat ET une action à faire dans la même note) — dans ce cas, sépare-les en éléments distincts, ne fusionne jamais deux notes différentes en un seul élément.

Pour chaque élément, détermine :
- noteId : l'id de la note source (peut se répéter si une note est découpée en plusieurs éléments)
- pole : SI la note a un "pole donné", utilise-le tel quel, sans discussion. SINON déduis-le du contenu : CVO = vente, discours client, argumentaire, saisie ; MO-SAV = retrait, ajustage, RAZ, laboratoire, stock, montage ; Magasin = propreté, merchandising, ambiance, organisation générale. En cas de doute, Magasin.
- rubrique : SI la note a une "rubrique donnée", utilise-la telle quelle, sans discussion. SINON déduis-la du contenu : Constaté = une observation ("j'ai vu", "j'ai entendu", "il y a", "on m'a dit") ; Fait = une action déjà réalisée par le formateur ("j'ai repris", "j'ai montré", "j'ai corrigé", "j'ai formé") ; À faire = une recommandation ou suite à donner ("je reviendrai", "il faut", "à revoir", "je formerai"). En cas de doute, Constaté.
- resume : une phrase claire et reformulée (style rapport), qui va à l'essentiel de cet élément
- detail : une version reformulée un peu plus détaillée si utile (contexte, précisions) ; si le résumé dit déjà tout, mets detail à null — pas de détail qui ne fait que répéter le résumé.

Réponds uniquement avec le JSON demandé, rien d'autre.`

const JSON_SCHEMA = {
  name: 'structure_reporting',
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
            resume: { type: 'string' },
            detail: { type: ['string', 'null'] },
          },
          required: ['noteId', 'pole', 'rubrique', 'resume', 'detail'],
          additionalProperties: false,
        },
      },
    },
    required: ['syntheseGlobale', 'motDeLaFin', 'elements'],
    additionalProperties: false,
  },
}

function buildUserContent(notes: any[]) {
  const lines = notes.map((n: any) => {
    const pole = n.pole ? `pole donné: ${n.pole}` : 'pole: non renseigné'
    const rubrique = n.rubrique ? `rubrique donnée: ${n.rubrique}` : 'rubrique: non renseignée'
    const motFin = n.mot_de_la_fin ? ' · mot de la fin : oui' : ''
    return `--- Note id=${n.id} · date=${n.date} · ${pole} · ${rubrique}${motFin} ---\n${n.contenu || '(pas de texte — pièce jointe seule)'}`
  })
  return `Voici les notes de la semaine, dans l'ordre chronologique :\n\n${lines.join('\n\n')}`
}

function validateOutput(data: any, sourceNotes: any[]) {
  if (!data || !Array.isArray(data.elements)) return false
  if (typeof data.syntheseGlobale !== 'string' || !data.syntheseGlobale.trim()) return false
  if (data.motDeLaFin !== null && typeof data.motDeLaFin !== 'string') return false
  const sourceIds = new Set(sourceNotes.map((n: any) => String(n.id)))
  for (const item of data.elements) {
    if (!item.noteId || !sourceIds.has(String(item.noteId))) return false
    if (!POLE_IDS.includes(item.pole)) return false
    if (!RUBRIQUE_IDS.includes(item.rubrique)) return false
    if (typeof item.resume !== 'string' || !item.resume.trim()) return false
    if (item.detail !== null && typeof item.detail !== 'string') return false
  }
  return true
}

const POLE_LABELS: Record<string, string> = { cvo: 'CVO', mo_sav: 'MO/SAV', magasin: 'Magasin' }
const RUBRIQUE_LABELS: Record<string, string> = { constate: 'Constaté', fait: 'Fait', a_faire: 'À faire' }

function assemble(sourceNotes: any[], modelOutput: any) {
  const byId = Object.fromEntries(sourceNotes.map((n: any) => [String(n.id), n]))
  const seenNoteIds = new Set<string>() // pièces jointes affichées une seule fois, sur le 1er élément de la note source

  const byPole: Record<string, Record<string, any[]>> = {}
  for (const item of modelOutput.elements) {
    const src = byId[String(item.noteId)]
    if (!src) continue
    const first = !seenNoteIds.has(String(item.noteId))
    seenNoteIds.add(String(item.noteId))
    const built = {
      resume: item.resume,
      detail: item.detail,
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
    if (!byPole[item.pole][item.rubrique]) byPole[item.pole][item.rubrique] = []
    byPole[item.pole][item.rubrique].push(built)
  }

  const sections = POLE_IDS
    .filter(poleId => byPole[poleId] && Object.values(byPole[poleId]).some(arr => arr.length))
    .map(poleId => ({
      pole: poleId,
      label: POLE_LABELS[poleId],
      rubriques: RUBRIQUE_IDS
        .filter(rubId => byPole[poleId][rubId]?.length)
        .map(rubId => ({ rubrique: rubId, label: RUBRIQUE_LABELS[rubId], items: byPole[poleId][rubId] })),
    }))

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { magasinId, formateurId, semaineDebut, semaineFin } = await req.json()
    if (!magasinId || !formateurId || !semaineDebut || !semaineFin) {
      return json({ error: 'Paramètres manquants.' }, 400)
    }

    const notes = await fetchNotesSemaine(magasinId, formateurId, semaineDebut, semaineFin)
    if (!notes.length) return json({ error: 'Aucune note cette semaine — rien à générer.' }, 200)

    const apiKey = Deno.env.get('GROQ_API_KEY')
    if (!apiKey) return json({ error: "Clé API Groq non configurée côté serveur. Les notes n'ont pas été modifiées." }, 500)

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildUserContent(notes) },
        ],
        response_format: { type: 'json_schema', json_schema: JSON_SCHEMA },
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[reporting-generate] Groq API error', res.status, errText)
      return json({ error: "Génération impossible (API Groq indisponible). Les notes n'ont pas été modifiées." }, 502)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      console.error('[reporting-generate] Réponse Groq inattendue', JSON.stringify(data).slice(0, 500))
      return json({ error: "Réponse inattendue du modèle. Les notes n'ont pas été modifiées." }, 502)
    }

    let parsed: any
    try { parsed = JSON.parse(content) } catch {
      return json({ error: "Structure générée invalide. Les notes n'ont pas été modifiées." }, 502)
    }

    if (!validateOutput(parsed, notes)) {
      return json({ error: "Structure générée invalide. Les notes n'ont pas été modifiées." }, 502)
    }

    return json({ contenuStructure: assemble(notes, parsed) })
  } catch (e) {
    console.error('[reporting-generate]', e)
    return json({ error: "Erreur serveur pendant la génération. Les notes n'ont pas été modifiées." }, 500)
  }
})
