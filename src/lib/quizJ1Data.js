import { ordrePourSemaine } from './quizOrdreSemaine'
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
//                   schemaVerre : cases placées sur un schéma de verre progressif (téléphone)
//                   autoCorrectOrdered : la case n doit correspondre au groupe n (sinon ordre libre)
//                   autoCorrectEach : un groupe de mots-clés par case attendue (ordre = ordre des cases)
// text-open-pairs : pairs (nb de lignes), pairLabels [gauche, droite]
//                   answerPairs : [{ keys, defKeys }] — ordre des lignes libre pour le formé,
//                   chaque paire canonique doit être retrouvée sur UNE ligne (keys à gauche, defKeys à droite)
// Quiz Jour 1 « tout-en-un » : un seul quiz de fin de journée qui remplace les
// quiz de fin de module (Entreprise, Optique, Types de verres) + l'ancien Quiz
// Jour 1. Retours de Kevin (16/11) : doublons retirés, questions regroupées
// (fondation, myopie/hypermétropie, nom/origine du progressif), questions ADD,
// axe en degrés et sphère nulle retirées, zones du progressif sur schéma.
// L'ordre de passage est mélangé chaque semaine (voir quizJ1OrdrePour en bas).
export const QUIZ_J1_BASE = [
  // ══ Présentation de l'entreprise ══
  // Entreprise — fondation (ex-Q1 + Q2 regroupées)
  {
    type: 'text-open-multi',
    fields: 3,
    fieldLabels: ['Année', 'Fondateur', 'Fondateur'],
    question: 'En quelle année et par qui Lunettes Pour Tous a-t-il été fondé ?',
    hint: '2014 · Paul Morlet & Xavier Niel',
    autoCorrectEach: [['2014'], ['morlet', 'paul'], ['niel', 'xavier']],
  },
  // Entreprise — la promesse des 10 minutes
  {
    type: 'text-open',
    question: 'En combien de temps Lunettes Pour Tous fabrique-t-il vos lunettes en magasin ?',
    hint: '10 minutes',
    autoCorrect: ['10 min', '10min', 'dix min'],
  },
  // Q1 — Ancien Quiz Jour 1 Q4
  {
    type: 'text-open-multi',
    fields: 5,
    question: 'Quels sont les 5 points clés qui permettent de remplir la promesse Lunettes Pour Tous ?',
    hint: 'Nos stocks · Nos machines · Le volume · Notre propre marque · 0 intermédiaire',
    timeLimitSec: 180, // 3 minutes (retour du test du 17/11)
    autoCorrectEach: [
      ['stock'],
      ['machine'],
      ['volume'],
      ['propre marque', 'marque'],
      ['intermédiaire', 'intermediaire'],
    ],
  },
  // Q2 — Module Entreprise Q5
  {
    type: 'text-open',
    question: 'Où se trouve le laboratoire progressif de Lunettes Pour Tous ?',
    hint: 'Paris Châtelet',
    // Liste blanche de réponses exactes (accents/casse normalisés) — évite qu'un autre
    // magasin parisien (ex: "Paris Beauchamps") soit validé automatiquement à tort.
    autoCorrectExact: ['paris chatelet', 'chatelet', 'paris', 'dans paris'],
  },
  // Q3 — Module Entreprise Q6
  {
    type: 'text-open-multi',
    fields: 2,
    fieldLabels: ['Client parisien', 'Client en province'],
    question: 'Quels sont les délais de fabrication des verres complexes (progressifs) pour un client parisien et pour un client en province ?',
    // Délais du laboratoire progressif, validés par Kevin (17/11)
    hint: 'Client parisien : dans la journée · Client en province : 24/48 h',
    autoCorrectOrdered: true,
    autoCorrectEach: [['journée', 'journee', 'jour même', 'jour meme'], ['24', '48']],
  },

  // ══ Les bases de l'optique : les troubles visuels ══
  // Q4 — Ancien Quiz Jour 1 Q5
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
  // Q5 — Module Optique Q1
  {
    question: 'Un client voit flou de loin. Quel est son trouble ?',
    options: ['Myope', 'Hypermétrope', 'Presbyte', 'Astigmate'],
    correct: 0,
  },
  // Q6 — Module Optique Q10
  {
    question: 'Un client force constamment sur ses yeux pour voir net, quand il relâche il voit flou à toutes les distances, quel est son problème de vue ?',
    options: ['Myope & Presbyte', 'Hypermétrope', 'Astigmate & Presbyte', 'Myope'],
    correct: 1,
  },
  // Q7 — Module Optique Q3
  {
    question: "Astigmate c'est :",
    options: ['Vision floue de loin', 'Vision floue de près', 'Vision déformée', 'Vision floue de loin & de près'],
    correct: 2,
  },

  // ══ Les bases de l'optique : lire une ordonnance ══
  // Optique — reconnaître myopie et hypermétropie (ex-Q13 + Q14 regroupées)
  {
    question: 'Sur une ordonnance, comment reconnaît-on une myopie et une hypermétropie ?',
    options: [
      'Myopie : signe + dans la sphère · Hypermétropie : signe - dans la sphère',
      'Myopie : signe - dans la sphère · Hypermétropie : signe + dans la sphère',
      'Myopie : avec un degré · Hypermétropie : entre parenthèses',
      'Les deux : signe + dans la sphère',
    ],
    correct: 1,
  },
  // Q8 — Module Optique Q5
  {
    type: 'text-open',
    question: 'Les corrections évoluent de combien en combien ?',
    hint: 'de 0,25 en 0,25',
    autoCorrect: ['0,25', '0.25'],
  },
  // Q9 — Module Optique Q7
  {
    question: 'A quoi correspond le cylindre ?',
    options: ['Hypermétropie', 'Myopie', 'Presbytie', 'Astigmatisme'],
    correct: 3,
  },
  // Q10 — Module Optique Q8
  {
    question: 'A quoi correspond l\'indication « Add » ?',
    options: ['La presbytie', "L'astigmatisme", 'La myopie', "L'hypermétropie"],
    correct: 0,
  },
  // Q11 — Module Optique Q20
  {
    question: "De quoi est toujours accompagné l'axe ?",
    options: ['La sphère', "L'addition", 'Le cylindre'],
    correct: 2,
  },

  // ══ Les bases de l'optique : saisir une ordonnance ══
  // Q12 — Ancien Quiz Jour 1 Q8
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
  // Q13 — Ancien Quiz Jour 1 Q10
  {
    type: 'ordonnance-fill',
    question: 'Saisissez les valeurs de cette ordonnance.',
    ordonnance: {
      od: { sph: '+0,50', cyl: null, axe: null, add: '+2,00' },
      og: { sph: '+0,75', cyl: null, axe: null, add: '+2,00' },
    },
    hideNonAddHeaders: true,
  },
  // Q14 — Ancien Quiz Jour 1 Q13
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
  // Q15 — Module Optique Q9
  {
    question: 'Quels sont les problèmes de vue de ce client ?',
    type: 'qcm-ordonnance',
    hideOrdoLabels: true,
    ordonnance: {
      od: { sph: '-2,25', cyl: '-0,50', axe: '10' },
      og: { sph: '-1,75', cyl: '-0,75', axe: '15' },
    },
    options: ['Hypermétrope & Astigmate', 'Astigmate & Presbyte', 'Myope & Presbyte', 'Myope & Astigmate'],
    correct: 3,
    cylInParens: true,
  },
  // Q16 — Module Optique Q14
  {
    question: 'Quels sont les problèmes de vue de ce client ?',
    type: 'qcm-ordonnance',
    hideOrdoLabels: true,
    ordonnance: {
      od: { sph: '-3,00', cyl: '-1,50', axe: '23', add: '+2,00' },
      og: { sph: '-2,75', cyl: '-1,25', axe: '30', add: '+2,00' },
    },
    options: ['Myope, Astigmate & Hypermétrope', 'Hypermétrope, Astigmate & Presbyte', 'Myope, Astigmate & Presbyte', 'Myope, Hypermétrope & Presbyte'],
    correct: 2,
    cylInParens: true,
  },
  // Q17 — Module Optique Q19
  {
    question: 'Quels sont les problèmes de vue de ce client ?',
    type: 'qcm-ordonnance',
    hideOrdoLabels: true,
    ordonnance: {
      od: { sph: '+1,50', cyl: '-0,50', axe: '90', add: '+1,50' },
      og: { sph: '+1,25', cyl: '-0,25', axe: '80', add: '+1,50' },
    },
    options: ['Myope & Presbyte', 'Hypermétrope, Astigmate & Presbyte', 'Astigmate & Presbyte', 'Hypermétrope & Presbyte'],
    correct: 1,
    cylInParens: true,
  },

  // ══ Fabrication en magasin ══
  // Q18 — Ancien Quiz Jour 1 Q14
  {
    type: 'power-selector',
    question: 'Quelle est la puissance maximale de sphère fabriquée en 10 minutes chez Lunettes Pour Tous ? (positif et négatif)',
    hint: '+7,25 (positif) · −8,00 (négatif)',
    correctPosVal: 7.25,
    correctNegVal: -8,
  },

  // ══ Les types de verres ══
  // Types de verres — nom et origine du progressif (ex-Q36 + Q37 regroupées)
  {
    type: 'text-open-multi',
    fields: 2,
    fieldLabels: ['Nom du verre', 'Fabricant (pays)'],
    question: 'Comment s\'appelle notre verre progressif livré en 9 jours, et d\'où vient-il ?',
    hint: 'Pulsar Next · Rodenstock (Allemagne)',
    autoCorrectEach: [['pulsar'], ['rodenstock', 'allemagne']],
  },
  // Types de verres — à qui conseiller le progressif
  {
    type: 'text-open',
    question: 'Pour quel type de problème visuel allons-nous conseiller le verre progressif ?',
    hint: 'La presbytie — correction de loin ET de près avec une seule paire de lunettes',
    autoCorrect: ['presbyt'],
    autoCorrectNot: ['non presbyte', 'pas presbyte'],
  },
  // Types de verres — les 3 zones du progressif, à placer sur un schéma de verre
  {
    type: 'text-open-multi',
    fields: 3,
    schemaVerre: true,
    fieldLabels: ['Zone du haut', 'Zone du milieu', 'Zone du bas'],
    question: 'Voici un verre progressif : à quelle vision correspond chacune de ses 3 zones ?',
    hint: 'Haut : vision de loin · Milieu : vision intermédiaire · Bas : vision de près',
    autoCorrectOrdered: true,
    autoCorrectEach: [['loin'], ['intermédiaire', 'intermediaire', 'inter'], ['près', 'pres']],
  },
  // Q19 — Module Types de verres Q7
  {
    question: 'Un client myope et astigmate de 28 ans peut avoir des verres progressifs.',
    options: ['Vrai', 'Faux'],
    correct: 1,
  },
  // Q20 — Ancien Quiz Jour 1 Q18
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

  // ══ Connaissances montures (questions de Kevin, 18/11) ══
  // Montures — les 3 matériaux (3 cases de haut en bas, ordre libre)
  {
    type: 'text-open-multi',
    fields: 3,
    question: 'Citez les 3 matériaux de nos montures.',
    hint: 'Injecté · Acétate de cellulose · Métal',
    autoCorrectEach: [
      ['inject'],
      ['acétate', 'acetate'],
      ['métal', 'metal', 'métallique', 'metallique'],
    ],
  },
  // Montures — fourchette de prix
  {
    type: 'text-open',
    question: 'Les prix de nos montures sont compris entre :',
    hint: '5 € et 90 €',
    autoCorrectAll: ['5', '90'],
  },
  // Montures — matériau de 5 à 15 €
  {
    type: 'text-open',
    question: 'Quel matériau de monture est compris entre 5 € et 15 € ?',
    hint: 'Le plastique injecté',
    autoCorrect: ['inject'],
  },
  // Montures — adaptables en solaire
  {
    question: 'Quelles sont nos montures adaptables en solaire ?',
    options: ['Acétate', 'Métal', 'Injecté', 'Toutes nos montures'],
    correct: 3,
  },

]

// ── Chrono : 2 minutes pour toutes les questions du Quiz Jour 1 ─────────
// (lu par le téléphone et la TV via q.timeLimitSec — sinon 90 s par défaut)
export const QUIZ_J1_CHRONO_SEC = 120
// (une question qui a plus de temps le garde : 3 min pour les 5 points clés)
for (const q of QUIZ_J1_BASE) q.timeLimitSec = Math.max(q.timeLimitSec || 0, QUIZ_J1_CHRONO_SEC)

// ── Ordre mélangé, renouvelé chaque semaine (cf. quizOrdreSemaine.js) ──
export function quizJ1OrdrePour(date = new Date()) {
  return ordrePourSemaine(QUIZ_J1_BASE.length, date, 0)
}

export const QUIZ_J1 = quizJ1OrdrePour().map(i => QUIZ_J1_BASE[i])
