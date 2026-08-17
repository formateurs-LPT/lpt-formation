// Types de questions : voir src/lib/quizJ1Data.js pour la légende complète
// (qcm, qcm-ordonnance, text-open, text-open-multi, autoCorrect…)
//
// Champs spécifiques Quiz Jour 2 :
// - tramePoints (Q1 uniquement) : reprend le visuel du module "Trame d'accueil".
//   Un point avec text: null est affiché comme case vierge à compléter par le formé.
// - numeric (text-open) : affiche un pavé numérique sur le téléphone au lieu du clavier texte.
// - ordonnance sur un text-open : affiche la correction (OD/OG) côté TV, réponse libre côté formé.
export const QUIZ_J2 = [
  // Q1 — trame d'accueil, case 3 à compléter
  {
    type: 'text-open',
    question: "Remplissez le texte manquant pour compléter la trame d'accueil.",
    hint: "Ici c'est simple, c'est la possibilité d'avoir ses lunettes de vue en seulement 10 minutes avec ou sans ordonnance.",
    tramePoints: [
      { num: 1, text: 'Bonjour et bienvenue chez Lunettes Pour Tous', color: '#00abe9', emoji: '👋' },
      { num: 2, text: 'Connaissez-vous le concept ?', color: '#7c3aed', emoji: '💡' },
      { num: 3, text: null, color: '#f59e0b', emoji: '⏱️' },
      { num: 4, text: "Je vous inscris en examen de vue ? C'est gratuit et sans rendez-vous.", color: '#22c55e', emoji: '✅' },
    ],
  },
  // Q2 — matériaux monture offre 1=1
  {
    type: 'text-open',
    question: "Dans l'offre 1=1, quels matériaux de monture les clients peuvent-ils choisir ?",
  },
  // Q3 — 2nde paire offerte 1=1 (vrai/faux)
  {
    question: "Dans l'offre 1=1, la seconde paire est offerte.",
    options: ['Vrai', 'Faux'],
    correct: 0,
  },
  // Q4 — prix moyen équipement progressif 1=1 (pavé numérique)
  {
    type: 'text-open',
    numeric: true,
    question: "Combien coûte en moyenne un équipement progressif dans l'offre 1=1 ?",
  },
  // Q5 — avantages 2nde paire 1=1
  {
    type: 'text-open',
    question: "Citez les avantages de la seconde paire dans l'offre 1=1. Donnez-en au moins 2.",
  },
  // Q6 — délai fabrication progressifs 1=1 (auto, override possible)
  {
    type: 'text-open',
    question: "Dans l'offre 1=1, quel est le délai de fabrication pour des verres progressifs ?",
    hint: '9 jours (9j / neuf jours acceptés)',
    autoCorrect: ['9j', '9 jours', 'neuf jours'],
  },
  // Q7 — délai fabrication unifocaux 1=1 (auto, override possible)
  {
    type: 'text-open',
    question: "Dans l'offre 1=1, quel est le délai de fabrication pour des verres unifocaux ?",
    hint: '10 minutes (10 min / 10m / dix minutes acceptés)',
    autoCorrect: ['10 min', '10 minutes', '10m', 'dix minutes'],
  },
  // Q8 — traitements verre Digital Protect Pro (5 cases)
  {
    type: 'text-open-multi',
    fields: 5,
    question: 'Citez tous les traitements que l\'on peut retrouver dans notre verre Digital Protect Pro.',
  },
  // Q9 — 5 arguments de vente verre progressif — 2min30
  {
    type: 'text-open-multi',
    fields: 5,
    question: 'Donnez les 5 arguments de vente du verre progressif.',
    timeLimitSec: 150,
  },
  // Q10 — composition paire à 10€
  {
    type: 'text-open',
    question: "De quoi est composée une paire à 10€ ? (Quelle monture et quel traitement de verre ?)",
  },
  // Q11 — réduction 2nde paire offre classique
  {
    question: "À combien s'élève la réduction sur la seconde paire sur l'offre classique ?",
    options: ['-50%', '-20%', '-10%', '-5%'],
    correct: 1,
  },
  // Q13 — qu'est-ce que le pack plan
  {
    question: "Qu'est-ce que le pack plan ?",
    options: [
      '2 paires sans correction pour 100€',
      '2 paires avec correction pour 95€',
      '2 paires sans correction pour 95€',
      '2 paires progressives sans correction pour 100€',
    ],
    correct: 2,
  },
  // Q14 — matériau montures 5-15€
  {
    type: 'text-open',
    question: 'Avec quel matériau sont fabriquées les montures comprises entre 5 et 15€ ?',
  },
  // Q15 — correction + matériau monture conseillé (qcm-ordonnance)
  {
    type: 'qcm-ordonnance',
    question: 'Un client arrive avec cette correction. Quel matériau de monture allez-vous privilégier ?',
    ordonnance: {
      od: { sph: '-9,50', cyl: '+0,50', axe: '10', add: null },
      og: { sph: '-9,00', cyl: '+0,25', axe: '85', add: null },
    },
    hideOrdoLabels: true,
    cylInParens: true,
    options: ['Injecté', 'Acétate', 'Métal'],
    correct: 1,
  },
  // Q16 — 3 zones de vision du progressif
  {
    type: 'text-open',
    question: 'Quelles sont les trois zones de vision composant le verre progressif ?',
    hint: 'Loin · Intermédiaire · Près',
  },
  // Q17 — âge examen de vue en magasin
  {
    question: 'À partir de quel âge puis-je faire mon examen de vue en magasin ?',
    options: ['16 ans', '19 ans', '15 ans', '14 ans'],
    correct: 0,
  },
  // Q18 — coût examen de vue
  {
    type: 'text-open',
    question: "Combien coûte l'examen de vue ?",
    hint: 'Gratuit (0€)',
  },
  // Q19 — correction + conseil verre 2nde paire (couture)
  {
    type: 'text-open',
    question: "Une cliente rentre avec cette correction. Elle vient d'acheter des verres progressifs en 1=1. Elle fait de la couture : quel type de verre allez-vous lui conseiller en seconde paire ?",
    ordonnance: {
      od: { sph: '+0,25', cyl: '+1,00', axe: '15', add: '+1,50' },
      og: { sph: '+1,00', cyl: '+0,25', axe: '180', add: '+1,50' },
    },
    hideOrdoLabels: true,
    cylInParens: true,
  },
  // Q20 — calcul vision de près : le formé saisit uniquement la sphère de
  // près (= sphère + add) pour chaque œil, même mécanique que la saisie de
  // correction (onlyFields réduit le formulaire à la sphère seule,
  // answerOverride fournit la valeur calculée attendue plutôt que la
  // sphère brute de l'ordonnance).
  {
    type: 'ordonnance-fill',
    question: 'Calculez la vision de près de cette correction (indiquez uniquement la sphère).',
    ordonnance: {
      od: { sph: '+0,75', cyl: '+1,00', axe: '85', add: '+2,25' },
      og: { sph: '+0,25', cyl: '+0,25', axe: '125', add: '+2,25' },
    },
    hideOrdoLabels: true,
    cylInParens: true,
    onlyFields: ['sph'],
    answerOverride: {
      od: { sph: '+3,00' },
      og: { sph: '+2,50' },
    },
  },
]
