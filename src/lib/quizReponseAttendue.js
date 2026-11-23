// Bonne réponse d'une question « ordonnance-fill », partagée par la TV et
// l'écran formateur. Une simple recopie attend les valeurs de l'ordonnance ;
// une question de calcul (answerOverride, ex. vision de près au Quiz Jour 2)
// attend les valeurs calculées : il faut les afficher, pas « à l'identique ».
const NOMS_CHAMPS = { sph: 'sphère', cyl: 'cylindre', axe: 'axe', add: 'add' }

export function estCalculOrdonnance(q) {
  return !!q?.answerOverride
}

export function reponseOrdonnanceFill(q) {
  if (!estCalculOrdonnance(q)) return 'Les valeurs de l’ordonnance, à l’identique'
  const champs = q.onlyFields || ['sph', 'cyl', 'axe', 'add']
  const oeil = (o) => champs
    .map(f => q.answerOverride[o]?.[f] ?? q.ordonnance?.[o]?.[f])
    .filter(v => v != null && v !== '')
    .join(' ')
  const precision = champs.length === 1 ? ` (${NOMS_CHAMPS[champs[0]]})` : ''
  return `OD ${oeil('od')} · OG ${oeil('og')}${precision}`
}
