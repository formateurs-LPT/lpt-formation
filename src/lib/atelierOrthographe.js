// Correcteur maison de l'Atelier Lipto (24/11) : rien ne sort de l'app.
// - Orthographe : dictionnaire français (Hunspell, public/dico, licence MPL)
//   lu par nspell, chargé seulement quand on ouvre le correcteur (~2 s).
// - Grammaire : des règles pour les fautes qu'on voit dans les simulations
//   (je + verbe en -t, a/à, sur/sûr, traits d'union, infinitif/participe…).
// Chaque faute : { id, chemin, champ, texte, debut, fin, message, suggestions }

// Mots du métier ou de l'app absents du dictionnaire
const MOTS_MAISON = new Set(`lipto lpt alma rodenstock unifocal unifocaux unifocale unifocales frontofocomètre fronto
back-end backend inami pulsar clariteens ditest ok sav cvo mo vl vp od og pd npd add sph cyl axe express
amétropie amétropies anti-rayure anti-rayures antireflet anti-reflet aminci amincis basic premium
hm hmm hmmm mmh euh`.split(/\s+/))
const ELISIONS = new Set(['l', 'd', 'j', 'm', 't', 's', 'n', 'c', 'qu', 'jusqu', 'lorsqu', 'puisqu', 'quoiqu'])
const LETTRES = 'A-Za-zÀ-ÖØ-öø-ÿŒœÇç'
const RE_MOT = new RegExp(`[${LETTRES}]+(?:['’-][${LETTRES}]+)*`, 'g')

// ── Textes affichés d'une simulation (les champs laissés par un autre mode ne comptent pas)
export function textesProjet(projet) {
  const out = []
  const ajoute = (c, chemin, champ, texte) => { if (typeof texte === 'string' && texte.trim()) out.push({ id: c.id, chemin, champ, texte }) }
  for (const c of Object.values(projet.cases)) {
    ajoute(c, ['nom'], 'Nom du scénario', c.type === 'depart' ? c.nom : '')
    ajoute(c, ['bulle'], 'Lipto dit', c.bulle)
    ajoute(c, ['message'], 'Message de fin', c.type === 'fin' ? c.message : '')
    ajoute(c, ['question'], c.mode === 'vraifaux' ? 'Affirmation' : 'Question', c.type === 'question' ? c.question : '')
    ajoute(c, ['repliqueCorrection'], 'Réplique après correction', c.repliqueCorrection)
    ajoute(c, ['explication'], 'Explication', c.explication)
    if (c.type === 'question' && c.mode === 'texte') ajoute(c, ['reponseAttendue'], 'Réponse attendue', c.reponseAttendue)
    if (c.type === 'question' && c.mode === 'qcm') (c.options || []).forEach((o, i) => ajoute(c, ['options', i, 'texte'], `Réponse ${'ABCDEFGH'[i]}`, o.texte))
    if (c.type === 'question' && c.mode === 'ordre') (c.etapes || []).forEach((e, i) => ajoute(c, ['etapes', i], `Étape ${i + 1}`, e))
    if (c.type === 'question' && c.mode === 'cases') (c.attendus || []).forEach((e, i) => ajoute(c, ['attendus', i], `Élément attendu ${i + 1}`, e))
    if (c.type === 'choix') (c.repliques || []).forEach((r, i) => ajoute(c, ['repliques', i, 'texte'], `Réplique ${i + 1}`, r.texte))
  }
  return out
}

// Remplace [debut, fin[ dans le champ désigné par chemin ; renvoie le patch de la case
export function corrigerCase(c, chemin, debut, fin, remplacement) {
  const copie = JSON.parse(JSON.stringify(c))
  let parent = copie
  for (const k of chemin.slice(0, -1)) parent = parent[k]
  const cle = chemin[chemin.length - 1]
  const t = parent[cle]
  parent[cle] = t.slice(0, debut) + remplacement + t.slice(fin)
  return { [chemin[0]]: copie[chemin[0]] }
}

// ── Dictionnaire
let promesseDico = null
export function chargerDico() {
  if (!promesseDico) {
    promesseDico = (async () => {
      const [{ default: nspell }, aff, dic] = await Promise.all([
        import('nspell'),
        fetch('/dico/fr.aff').then(r => r.text()),
        fetch('/dico/fr.dic').then(r => r.text()),
      ])
      return nspell(aff, dic)
    })()
    promesseDico.catch(() => { promesseDico = null })
  }
  return promesseDico
}

const existe = (dico, mot) => MOTS_MAISON.has(mot.toLowerCase()) || dico.correct(mot) || dico.correct(mot.toLowerCase())

function motConnu(dico, mot) {
  if (existe(dico, mot)) return true
  // l'offre, qu'avec, s'habituer : on vérifie le mot sans l'élision
  const [avant, ...reste] = mot.split(/['’]/)
  if (reste.length && ELISIONS.has(avant.toLowerCase())) return motConnu(dico, reste.join("'"))
  // faites-vous, rappelez-moi, c'est-à-dire : chaque morceau doit exister
  if (/-/.test(mot)) return mot.split('-').every(m => m && motConnu(dico, m))
  return false
}

// ── Règles de grammaire. Chaque règle renvoie des fautes { debut, fin, message, suggestions }
const SUJETS = new Set(['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'ne', "n'", 'qui', 'ça', 'cela'])
const JE_T = { inscrit: 'inscris', fait: 'fais', doit: 'dois', peut: 'peux', veut: 'veux', dit: 'dis', met: 'mets', prend: 'prends', vient: 'viens', voit: 'vois', sait: 'sais', écrit: 'écris', permet: 'permets', rend: 'rends', attend: 'attends', répond: 'réponds', comprend: 'comprends', entend: 'entends', vend: 'vends', part: 'pars', sort: 'sors', sert: 'sers', finit: 'finis', choisit: 'choisis', reçoit: 'reçois', conduit: 'conduis' }
const PRONOMS_COMPL = "(?:(?:vous|te|lui|les|le|la|leur|en|y|ne|me)\\s+|[lmt]['’])?"
const L = `[${LETTRES}]`
// \b ne voit pas les lettres accentuées (« conseillé » suivi d'un espace) : bornes maison
const FIN = `(?![${LETTRES}])`
const avecCasse = (modele, mot) => modele[0] === modele[0].toUpperCase() ? mot[0].toUpperCase() + mot.slice(1) : mot

function regles(texte, dico) {
  const f = []
  const ajoute = (debut, fin, message, suggestions) => f.push({ debut, fin, message, suggestions })
  const chaque = (re, fn) => { for (const m of texte.matchAll(re)) fn(m) }
  const motAvant = i => (texte.slice(0, i).match(new RegExp(`(${L}+['’]?)\\s*$`)) || [])[1]?.toLowerCase()

  // je inscrit → je inscris ; je portes → je porte
  chaque(new RegExp(`\\b[Jj]e\\s+${PRONOMS_COMPL}(${L}+)\\b`, 'g'), m => {
    const v = m[1], debut = m.index + m[0].length - v.length
    if (JE_T[v]) ajoute(debut, debut + v.length, `Avec « je », on écrit « ${JE_T[v]} ».`, [JE_T[v]])
    else if (/[^l]es$/.test(v) && !['les', 'des', 'mes', 'tes', 'ses', 'ces'].includes(v) && /e$/.test(v.slice(0, -1)) && existe(dico, v.slice(0, -1)))
      ajoute(debut, debut + v.length, 'Avec « je », pas de « s » à la fin du verbe.', [v.slice(0, -1)])
  })
  // Ca → Ça ; A combien (début de phrase) → À combien
  chaque(/\b(Ca|ca)\b/g, m => ajoute(m.index, m.index + 2, 'Il manque la cédille.', [m[1] === 'Ca' ? 'Ça' : 'ça']))
  chaque(/(^|[.!?…]\s+|\n)(A)(?=\s+\p{L})/gu, m => { const d = m.index + m[1].length; ajoute(d, d + 1, 'En début de phrase, la préposition s’écrit « À ».', ['À']) })
  // bien sur / je suis sur que → sûr
  chaque(/\b([Bb]ien) (sur)\b(?!\s+(?:le|la|les|l['’]|un|une|des|ce|cette|votre|vos|notre|nos|mon|ma|mes|son|sa|ses)\b)/g, m => { const d = m.index + m[1].length + 1; ajoute(d, d + 3, 'Au sens de « certain », on écrit « sûr ».', ['sûr']) })
  chaque(/\b(suis|es|est|sommes|êtes|sont|soyez|sois) (sur)(?=\s+(?:que|qu['’]|de|d['’]|et)\b|\s*[,.!?])/g, m => { const d = m.index + m[1].length + 1; ajoute(d, d + 3, 'Au sens de « certain », on écrit « sûr ».', ['sûr']) })
  // rappelez moi → rappelez-moi (impératif) ; Pouvez vous → Pouvez-vous (question)
  chaque(new RegExp(`\\b(${L}+(?:ez|ons|e|s)) (moi|toi|nous|lui|leur)\\b`, 'g'), m => {
    const verbe = m[1].toLowerCase(), av = motAvant(m.index)
    const imperatifs = ['dis', 'fais', 'dites', 'faites', 'donne', 'excuse', 'laisse', 'montre', 'rappelle', 'attends', 'écoute', 'regarde', 'explique']
    if (!(/(ez|ons)$/.test(verbe) || imperatifs.includes(verbe)) || ['chez', 'assez', 'nez', 'rez', 'dons', 'bons', 'sons', 'mons', 'tons', 'ons'].includes(verbe)) return
    if (av && (SUJETS.has(av) || /^(vous|nous|me|te|se|ne|y|en|pour|à|de|avec|chez|sans|et|ou|que)$/.test(av))) return
    ajoute(m.index, m.index + m[0].length, 'Verbe à l’impératif : trait d’union avant le pronom.', [`${m[1]}-${m[2]}`])
  })
  chaque(new RegExp(`(^|[.!?…]\\s+|\\n)(${L}+(?:ez|ons)) (vous|nous)\\b`, 'g'), m => {
    const d = m.index + m[1].length
    ajoute(d, d + m[2].length + 1 + m[3].length, 'Question : trait d’union entre le verbe et le pronom.', [`${m[2]}-${m[3]}`])
  })
  chaque(new RegExp(`(${L})- (${L})`, 'g'), m => ajoute(m.index + 1, m.index + 3, 'Espace en trop après le trait d’union.', ['-']))
  // se que → ce que
  chaque(/\b([Ss]e) (que|qu['’]|qui|dont)\b/g, m => ajoute(m.index, m.index + 2, '« ce que » (ce qui, ce dont), pas « se ».', [avecCasse(m[1], 'ce')]))
  // aucuns suppléments → aucun supplément
  chaque(/(^|[^'’])\b([Aa]ucun(e?)s)\b/g, m => { const d = m.index + m[1].length; ajoute(d, d + m[2].length, '« Aucun » reste au singulier.', [m[2].slice(0, -1)]) })
  // un. examen : point au milieu d'une phrase
  chaque(new RegExp(`(${L}+)\\. (\\p{Ll})`, 'gu'), m => {
    if (['ex', 'etc', 'env', 'cf', 'p', 'av', 'bd', 'st', 'mr', 'mme'].includes(m[1].toLowerCase())) return
    const d = m.index + m[1].length
    ajoute(d, d + 1, 'Point au milieu de la phrase ?', [''])
  })
  // le le, la la… (sauf nous nous / vous vous)
  chaque(new RegExp(`\\b(${L}+) \\1\\b`, 'gi'), m => {
    if (['nous', 'vous'].includes(m[1].toLowerCase())) return
    ajoute(m.index, m.index + m[0].length, 'Mot répété.', [m[1]])
  })
  // le meilleur conseillé → conseiller (le nom)
  chaque(/\b(un|le|du|au|votre|notre|mon|ton|son|ce|meilleur|bon|vrai)\s+(conseillé)(e?s?)(?![\p{L}])/giu, m => {
    const d = m.index + m[0].length - m[2].length - m[3].length
    const fin = { '': 'conseiller', s: 'conseillers', e: 'conseillère', es: 'conseillères' }[m[3]]
    ajoute(d, d + m[2].length + m[3].length, 'Le métier s’écrit « conseiller ».', [fin])
  })
  // je peux récupéré / pour acheté → infinitif
  chaque(new RegExp(`\\b(pour|sans|peux|peut|pouvez|pouvons|peuvent|dois|doit|devez|devons|doivent|veux|veut|voulez|voulons|veulent|faut|vais|vas|va|allez|allons|vont|aller|souhaite|souhaitez|pourriez|pourrait|devriez|voudriez|voudrais|faire)\\s+${PRONOMS_COMPL}(${L}+?)(é|ée|és|ées)${FIN}`, 'gi'), m => {
    const radical = m[2], mot = radical + m[3], d = m.index + m[0].length - mot.length
    if (existe(dico, radical + 'er')) ajoute(d, d + mot.length, 'Après ce mot, le verbe est à l’infinitif (-er).', [radical + 'er'])
  })
  // j'ai manger / il est arriver → participe
  chaque(new RegExp(`\\b(ai|as|a|avons|avez|ont|avait|avais|aviez|suis|es|est|sommes|êtes|sont|été)\\s+(?:(?:pas|déjà|bien|jamais|toujours|vraiment|aussi)\\s+)?(${L}+)er\\b`, 'gi'), m => {
    const radical = m[2], mot = radical + 'er', d = m.index + m[0].length - mot.length
    if (m[1].toLowerCase() === 'a' && !SUJETS.has(motAvant(m.index) || '')) return
    if (radical.length > 2 && existe(dico, radical + 'é') && !existe(dico, mot + 's')) ajoute(d, d + mot.length, 'Après « avoir » ou « être », le participe passé (-é).', [radical + 'é'])
  })
  // les progressifs sont fabriqué → fabriqués
  chaque(new RegExp(`\\b(sont|étaient|seront|soient|ont été|sont été) (${L}+é)${FIN}`, 'gi'), m => {
    const mot = m[2], d = m.index + m[0].length - mot.length
    if (existe(dico, mot.slice(0, -1) + 'er')) ajoute(d, d + mot.length, 'Sujet au pluriel : le participe s’accorde.', [mot + 's', mot + 'es'])
  })
  // ma vue à changé → a changé
  chaque(new RegExp(`(^|\\s)(à) (${L}+?)(é|ée|és|ées)${FIN}`, 'g'), m => {
    const radical = m[3]
    if (['côt', 'volont', 'moiti', 'gr', 'piti', 'priorit', 'proximit', 'satiét', 'ét', 'propret', 'beaut', 'qualit', 'quantit', 'vérit', 'liberté'].includes(radical.toLowerCase())) return
    if (motAvant(m.index + m[1].length) === 'tout') return
    if (existe(dico, radical + 'er')) { const d = m.index + m[1].length; ajoute(d, d + 1, 'Devant un participe passé, c’est le verbe « a » (sans accent).', ['a']) }
  })
  // difficile a s'habituer / le concept a Lipto → à
  chaque(new RegExp(`(\\S+)\\s+(a)\\s+(${L}+(?:['’]${L}+)?)`, 'g'), m => {
    const av = m[1].toLowerCase().replace(/[^\p{L}'’]/gu, ''), apres = m[3]
    if (!av || SUJETS.has(av) || /[A-ZÀ-Ö]/.test(m[1][0])) return
    const d = m.index + m[0].length - apres.length - 2
    const infinitif = /^(s['’])?\p{L}+(er|ir)$/u.test(apres) && existe(dico, apres.replace(/^s['’]/, ''))
    const nomPropre = /^[A-ZÀ-Ö]/.test(apres)
    if (/^s['’]/.test(apres) || infinitif || nomPropre) ajoute(d, d + 1, '« a » (verbe avoir) ou « à » (préposition) ? Ici, sûrement « à ».', ['à'])
  })
  // les progressif → les progressifs (le mot juste après le déterminant)
  chaque(new RegExp(`\\b(les|des|ces|mes|tes|ses|nos|vos|leurs|plusieurs|deux|trois|quatre|cinq|quelques|certains|certaines|nombreux|nombreuses) (${L}+)\\b`, 'gi'), m => {
    const det = m[1].toLowerCase(), mot = m[2]
    if (/[sxz]$/i.test(mot) || mot.length < 3) return
    if (['plus', 'moins', 'très', 'trop', 'bien', 'peu', 'tout', 'toujours', 'jamais', 'déjà', 'encore', 'aussi', 'leur', 'lui', 'avec', 'pour', 'dans', 'sans', 'entre', 'chez', 'sur', 'sous', 'vers', 'après', 'avant', 'pendant', 'depuis', 'comme', 'mais', 'donc', 'car', 'quand', 'que', 'qui', 'dont', 'où'].includes(mot.toLowerCase())) return
    if (det === 'les' && SUJETS.has(motAvant(m.index) || '')) return // « je les porte »
    if (existe(dico, mot) && existe(dico, mot + 's')) { const d = m.index + m[1].length + 1; ajoute(d, d + mot.length, 'Après ce mot, le nom est au pluriel ?', [mot + 's']) }
  })
  // Espaces doublés
  chaque(/\S( {2,})(?=\S)/g, m => ajoute(m.index + 1, m.index + 1 + m[1].length, 'Espace en trop.', [' ']))
  return f
}

// ── Orthographe des mots (dictionnaire)
function fautesMots(texte, dico) {
  const f = []
  for (const m of texte.matchAll(RE_MOT)) {
    const mot = m[0]
    if (mot.length < 2 || /\d$/.test(texte.slice(0, m.index))) continue // 1ere, 10min
    if (mot === mot.toUpperCase() && mot.length > 1) continue // sigles : LPT, OD, CVO
    const debutPhrase = /(^|[.!?…:]\s*|\n\s*|[«"]\s*)$/.test(texte.slice(0, m.index))
    if (!debutPhrase && /^\p{Lu}/u.test(mot)) continue // nom propre en milieu de phrase
    if (motConnu(dico, mot)) continue
    const suggestions = dico.suggest(mot).slice(0, 3)
    f.push({ debut: m.index, fin: m.index + mot.length, message: suggestions.length ? 'Mot inconnu du dictionnaire.' : 'Mot inconnu du dictionnaire (aucune suggestion).', suggestions })
  }
  return f
}

// Toutes les fautes d'un projet, dans l'ordre des cases, sans doublon de position
export function verifierProjet(projet, dico, ignores = new Set()) {
  const res = []
  for (const t of textesProjet(projet)) {
    const vues = []
    const trouvees = [...regles(t.texte, dico), ...fautesMots(t.texte, dico)].sort((a, b) => a.debut - b.debut)
    for (const x of trouvees) {
      if (vues.some(v => x.debut < v.fin && v.debut < x.fin)) continue
      const extrait = t.texte.slice(x.debut, x.fin)
      if (ignores.has(extrait.toLowerCase())) continue
      vues.push(x)
      res.push({ ...t, ...x, extrait, cle: `${t.id}|${t.chemin.join('.')}|${x.debut}` })
    }
  }
  return res
}
