// Types de questions :
// qcm           : options[], correct (index)
// qcm-multi     : options[], correct (array d'indices), instruction
// text-open     : hint (affiché formateur uniquement)
// ordonnance-fill : ordonnance { od, og } avec sph, cyl, axe, add (null si absent)
// qcm-ordonnance : ordonnance + options[] + correct — ordonnance affichée TV, QCM sur tél
// power-selector : correctPos, correctNeg
export const QUIZ_J1 = [
  // Q1 — texte libre
  {
    type: 'text-open',
    question: 'En quelle année a ouvert le premier magasin LPT ?',
    hint: '2014',
  },
  // Q2 — texte libre
  {
    type: 'text-open',
    question: 'Qui a fondé LPT avec le soutien de Xavier Niel ?',
    hint: 'Paul Morlet',
  },
  // Q3 — texte libre
  {
    type: 'text-open',
    question: 'Quel élément nous différencie totalement de la concurrence ?',
    hint: 'La fabrication sur place en 10 minutes',
  },
  // Q4 — texte libre
  {
    type: 'text-open',
    question: 'Quels sont les 5 points clés qui permettent de remplir la promesse LPT ?',
    hint: 'Examen de vue gratuit · Fabrication sur place · 10 minutes · Prix bas · 0 € reste à charge',
  },
  // Q5 — texte libre
  {
    type: 'text-open',
    question: 'Citez les 4 problèmes de vue et leur définition.',
    hint: 'Myopie (mal de loin) · Hypermétropie (mal de près, force) · Astigmatisme (vision déformée) · Presbytie (liée à l\'âge)',
  },
  // Q6 — qcm multi-sélection (classement après Q5)
  {
    type: 'qcm-multi',
    question: 'Dans la Sphère d\'une ordonnance, quels problèmes de vue peut-on trouver ?',
    options: ['Astigmatisme', 'Hypermétropie', 'Presbytie', 'Myopie'],
    correct: [1, 3],
    instruction: 'Sélectionnez les 2 bonnes réponses (B et D)',
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
      od: { sph: '+2,00', cyl: '-0,50', axe: '90', add: null },
      og: { sph: '+1,75', cyl: '-0,50', axe: '85', add: null },
    },
  },
  // Q9 — remplir ordonnance
  {
    type: 'ordonnance-fill',
    question: 'Saisissez les valeurs de cette ordonnance.',
    ordonnance: {
      od: { sph: '-1,50', cyl: '+0,75', axe: '170', add: null },
      og: { sph: '-2,00', cyl: '+0,50', axe: '165', add: null },
    },
  },
  // Q10 — remplir ordonnance (presbytie, add) — classement après Q10
  {
    type: 'ordonnance-fill',
    question: 'Saisissez les valeurs de cette ordonnance.',
    ordonnance: {
      od: { sph: '+0,50', cyl: null, axe: null, add: '+2,00' },
      og: { sph: '+0,75', cyl: null, axe: null, add: '+2,00' },
    },
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
  },
  // Q13 — qcm + ordonnance TV (presbytie VP)
  {
    type: 'qcm-ordonnance',
    question: 'Quel est le problème de vue de ce client ? (ordonnance VP unifocale)',
    ordonnance: {
      od: { sph: 'Plan', cyl: null, axe: null, add: '+2,50' },
      og: { sph: 'Plan', cyl: null, axe: null, add: '+2,50' },
    },
    options: ['Myopie', 'Astigmatisme', 'Presbytie', 'Hypermétropie'],
    correct: 2,
  },
  // Q14 — sélecteur de puissances
  {
    type: 'power-selector',
    question: 'Quelles sont les puissances maximales fabriquées en 10 minutes chez LPT ?',
    correctPos: '+7,25',
    correctNeg: '-8,00',
  },
  // Q15 — qcm standard — classement après Q15
  {
    question: 'Sur une ordonnance, que signifie "Plan" dans la colonne Sphère ?',
    options: ['La puissance maximale', 'Un traitement antireflet', 'La valeur 0 — aucune correction', 'Un verre plan sans traitement'],
    correct: 2,
  },
  // Q16 — texte libre
  {
    type: 'text-open',
    question: 'Citez 3 matériaux utilisés pour les montures chez LPT.',
    hint: 'Acétate · Métal · Injecté',
  },
  // Q17 — qcm + ordonnance TV
  {
    type: 'qcm-ordonnance',
    question: 'Quels sont les problèmes de vue de ce client ?',
    ordonnance: {
      od: { sph: '-1,00', cyl: '-1,50', axe: '45', add: null },
      og: { sph: '-0,75', cyl: '-1,25', axe: '135', add: null },
    },
    options: ['Myopie + Astigmatisme', 'Hypermétropie + Presbytie', 'Myopie seule', 'Presbytie seule'],
    correct: 0,
  },
  // Q18 — qcm + ordonnance TV
  {
    type: 'qcm-ordonnance',
    question: 'Quels sont les problèmes de vue de ce client ?',
    ordonnance: {
      od: { sph: '+1,25', cyl: '-0,75', axe: '90', add: '+2,00' },
      og: { sph: '+1,00', cyl: '-0,50', axe: '85', add: '+2,00' },
    },
    options: ['Myopie + Astigmatisme', 'Hypermétropie + Astigmatisme + Presbytie', 'Presbytie seule', 'Astigmatisme seul'],
    correct: 1,
  },
  // Q19 — qcm + ordonnance TV (délai)
  {
    type: 'qcm-ordonnance',
    question: 'Quel est le délai de fabrication pour ces lunettes ?',
    ordonnance: {
      od: { sph: '-2,00', cyl: null, axe: null, add: null },
      og: { sph: '-1,75', cyl: null, axe: null, add: null },
    },
    options: ['10 minutes', '9 jours', '24 heures', 'Impossible à fabriquer'],
    correct: 0,
  },
  // Q20 — qcm + ordonnance TV (délai, forte puissance) — classement après Q20
  {
    type: 'qcm-ordonnance',
    question: 'Quel est le délai de fabrication pour ces lunettes ? (stocks jusqu\'à -8,00)',
    ordonnance: {
      od: { sph: '-7,75', cyl: '+1,50', axe: '90', add: null },
      og: { sph: '-7,75', cyl: '+1,50', axe: '90', add: null },
    },
    options: ['10 minutes', '9 jours', 'Impossible à fabriquer', '24 heures'],
    correct: 0,
  },
  // Q21 — vrai/faux
  {
    question: 'Un enfant peut être presbyte.',
    options: ['VRAI', 'FAUX'],
    correct: 1,
  },
]
