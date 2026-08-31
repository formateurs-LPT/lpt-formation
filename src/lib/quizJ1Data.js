// Types de questions :
// qcm           : options[], correct (index)
// qcm-multi     : options[], correct (array d'indices), instruction
// text-open     : hint (affiché formateur uniquement)
//                 autoCorrect    (OR)  : valide si réponse contient AU MOINS UN mot
//                 autoCorrectAll (AND) : valide si réponse contient TOUS les mots
//                 autoCorrectAllOr     : valide si chaque groupe (tableau) a au moins un match
// ordonnance-fill : ordonnance { od, og } avec sph, cyl, axe, add (null si absent)
//                   hideOrdoLabels : masque les en-têtes Sph/Cyl/Axe
//                   hideNonAddHeaders : masque Sph/Cyl/Axe mais garde Add
//                   cylInParens : affiche le cyl entre parenthèses dans la colonne sph
// qcm-ordonnance : ordonnance + options[] + correct — ordonnance affichée TV, QCM sur tél
//                  hideOrdoLabels, cylInParens, ordoLabel (texte au-dessus de l'ordonnance)
// text-open-multi : fields (nb de cases), fieldLabels (optionnel)
//                   autoCorrectEach : un groupe de mots-clés par case attendue (ordre = ordre des cases)
// text-open-pairs : pairs (nb de lignes), pairLabels [gauche, droite]
//                   answerPairs : [{ keys, defKeys }] — ordre des lignes libre pour le formé,
//                   chaque paire canonique doit être retrouvée sur UNE ligne (keys à gauche, defKeys à droite)
export const QUIZ_J1 = [
  // Q1 — année de création
  {
    type: 'text-open',
    question: 'En quelle année a ouvert le premier magasin Lunettes Pour Tous ?',
    hint: '2014',
    autoCorrect: ['2014'],
  },
  // Q2 — fondateurs
  {
    type: 'text-open',
    question: 'Qui a fondé Lunettes Pour Tous ?',
    hint: 'Paul Morlet et Xavier Niel',
    autoCorrectAll: ['paul morlet', 'xavier niel'],
  },
  // Q3 — différenciateur
  {
    type: 'text-open',
    question: "Quel élément (en dehors du prix) fait que l'offre de lunettes pour tous est unique ?",
    hint: 'La fabrication sur place en 10 minutes',
    autoCorrect: ['10 min', '10min'],
  },
  // Q4 — 5 piliers (5 encadrés) — 2min30 (au lieu des 90s standards, 5 cases à remplir)
  {
    type: 'text-open-multi',
    fields: 5,
    question: 'Quels sont les 5 points clés qui permettent de remplir la promesse Lunettes Pour Tous ?',
    hint: 'Nos stocks · Nos machines · Le volume · Notre propre marque · 0 intermédiaire',
    timeLimitSec: 150,
    autoCorrectEach: [
      ['stock'],
      ['machine'],
      ['volume'],
      ['propre marque', 'marque'],
      ['intermédiaire', 'intermediaire'],
    ],
  },
  // Q5 — 4 problèmes de vue (8 encadrés : problème / définition, par ligne) — 2min30
  {
    type: 'text-open-pairs',
    pairs: 4,
    pairLabels: ['Problème de vue', 'Définition'],
    question: 'Citez les 4 problèmes de vue et leur définition.',
    hint: 'Myope → Flou de loin · Hypermétrope → Flou à toutes distances · Astigmate → Déformé à toutes distances · Presbyte → Flou de près (à partir de 45 ans en moyenne)',
    timeLimitSec: 150,
    answerPairs: [
      { keys: ['myop'], defKeys: ['flou de loin'] },
      { keys: ['hyperm'], defKeys: ['flou à toute', 'flou a toute'] },
      { keys: ['astigm'], defKeys: ['déform', 'deform'] },
      { keys: ['presbyt'], defKeys: ['flou de près', 'flou de pres', 'floue de près', 'floue de pres', 'vision floue'] },
    ],
  },
  // Q6 — qcm multi-sélection
  {
    type: 'qcm-multi',
    question: 'Dans la Sphère, quels problèmes de vue peut-on trouver ?',
    options: ['Astigmatisme', 'Hypermétropie', 'Presbytie', 'Myopie'],
    correct: [1, 3],
    instruction: 'Sélectionnez les 2 bonnes réponses',
  },
  // Q7 — qcm standard
  {
    question: 'Un client voit mal de près et a du mal à lire les petits caractères. Quel est son problème de vue ?',
    options: ['Presbytie', 'Myopie', 'Hypermétropie', 'Astigmatisme'],
    correct: 0,
  },
  // Q8 — remplir ordonnance
  {
    type: 'ordonnance-fill',
    question: 'Saisissez les valeurs de cette ordonnance.',
    ordonnance: {
      od: { sph: '+2,00', cyl: '-0,50', axe: '90',  add: null },
      og: { sph: '+1,75', cyl: '-0,50', axe: '85',  add: null },
    },
    hideOrdoLabels: true,
    cylInParens: true,
  },
  // Q9 — remplir ordonnance
  {
    type: 'ordonnance-fill',
    question: 'Saisissez les valeurs de cette ordonnance.',
    ordonnance: {
      od: { sph: '-1,50', cyl: '+0,75', axe: '170', add: null },
      og: { sph: '-2,00', cyl: '+0,50', axe: '165', add: null },
    },
    hideOrdoLabels: true,
    cylInParens: true,
  },
  // Q10 — remplir ordonnance presbytie (avec add) — classement après Q10
  {
    type: 'ordonnance-fill',
    question: 'Saisissez les valeurs de cette ordonnance.',
    ordonnance: {
      od: { sph: '+0,50', cyl: null, axe: null, add: '+2,00' },
      og: { sph: '+0,75', cyl: null, axe: null, add: '+2,00' },
    },
    hideNonAddHeaders: true,
  },
  // Q11 — qcm + ordonnance TV
  {
    type: 'qcm-ordonnance',
    question: 'Quel est le problème de vue de ce client ?',
    ordonnance: {
      od: { sph: '-3,00', cyl: null, axe: null, add: null },
      og: { sph: '-2,75', cyl: null, axe: null, add: null },
    },
    options: ['Myopie', 'Hypermétropie', 'Presbytie', 'Astigmatisme'],
    correct: 0,
    hideOrdoLabels: true,
  },
  // Q12 — qcm + ordonnance TV
  {
    type: 'qcm-ordonnance',
    question: 'Quel est le problème de vue de ce client ?',
    ordonnance: {
      od: { sph: '+2,50', cyl: null, axe: null, add: null },
      og: { sph: '+2,00', cyl: null, axe: null, add: null },
    },
    options: ['Myopie', 'Hypermétropie', 'Presbytie', 'Astigmatisme'],
    correct: 1,
    hideOrdoLabels: true,
  },
  // Q13 — presbytie VP unifocale affichée en +2,50 sans ADD
  {
    type: 'qcm-ordonnance',
    question: 'Quel est le problème de vue de ce client ?',
    ordonnance: {
      od: { sph: '+2,50', cyl: null, axe: null, add: null },
      og: { sph: '+2,50', cyl: null, axe: null, add: null },
    },
    ordoLabel: '1 paire de lunettes vision de près',
    options: ['Myopie', 'Astigmatisme', 'Presbytie', 'Hypermétropie'],
    correct: 2,
    hideOrdoLabels: true,
  },
  // Q14 — puissance maximale de sphère (roulettes positif/négatif) — classement après Q14 (était Q15)
  {
    type: 'power-selector',
    question: 'Quelle est la puissance maximale de sphère fabriquée en 10 minutes chez Lunettes Pour Tous ? (positif et négatif)',
    hint: '+7,25 (positif) · −8,00 (négatif)',
    correctPosVal: 7.25,
    correctNegVal: -8,
  },
  // Q16 — catégories de montures (3 encadrés, ordre libre)
  {
    type: 'text-open-multi',
    fields: 3,
    question: 'Selon leur matière de fabrication, quelles sont les trois catégories de montures disponibles chez Lunettes Pour Tous ?',
    hint: 'Acétate · Métal · Injecté',
    autoCorrectEach: [
      ['acétate', 'acetate'],
      ['métal', 'metal', 'métallique', 'metallique'],
      ['inject'],
    ],
  },
  // Q17 — qcm + ordonnance TV
  {
    type: 'qcm-ordonnance',
    question: 'Quels sont les problèmes de vue de ce client ?',
    ordonnance: {
      od: { sph: '-1,00', cyl: '-1,50', axe: '45',  add: null },
      og: { sph: '-0,75', cyl: '-1,25', axe: '135', add: null },
    },
    options: ['Myopie + Astigmatisme', 'Hypermétropie + Presbytie', 'Myopie seule', 'Presbytie seule'],
    correct: 0,
    hideOrdoLabels: true,
    cylInParens: true,
  },
  // Q18 — qcm + ordonnance TV (avec add)
  {
    type: 'qcm-ordonnance',
    question: 'Quels sont les problèmes de vue de ce client ?',
    ordonnance: {
      od: { sph: '+1,25', cyl: '-0,75', axe: '90', add: '+2,00' },
      og: { sph: '+1,00', cyl: '-0,50', axe: '85', add: '+2,00' },
    },
    options: ['Myopie + Astigmatisme', 'Hypermétropie + Astigmatisme + Presbytie', 'Presbytie seule', 'Astigmatisme seul'],
    correct: 1,
    hideOrdoLabels: true,
    cylInParens: true,
  },
  // Q19 — délai forte correction sphérique pure (10 min) — classement après Q19 (dernier)
  {
    type: 'qcm-ordonnance',
    question: 'Quel est le délai de fabrication pour ces lunettes ?',
    ordonnance: {
      od: { sph: '-7,75', cyl: null, axe: null, add: null },
      og: { sph: '-8,00', cyl: null, axe: null, add: null },
    },
    options: ['10 minutes', '9 jours', '24 heures', 'Impossible à fabriquer'],
    correct: 0,
    hideOrdoLabels: true,
  },
]
