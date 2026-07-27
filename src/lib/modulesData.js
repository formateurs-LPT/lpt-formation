import { QUIZ_FINAL_QUESTIONS } from '@/lib/quizFinalData'
export { QUIZ_FINAL_QUESTIONS }
import { QUIZ_J1 } from '@/lib/quizJ1Data'
export { QUIZ_J1 }

export const TYPES_VERRES_QUIZ = [
  {
    type: 'text-open',
    question: 'Quel est le délai de fabrication du verre unifocal ?',
    hint: '10 minutes',
  },
  {
    type: 'text-open',
    question: 'Comment s\'appelle le verre progressif de Lunettes Pour Tous ?',
    hint: 'Pulsar Next',
  },
  {
    type: 'text-open',
    question: 'Quel est le fournisseur du verre progressif Pulsar Next ?',
    hint: 'Rodenstock (Allemagne)',
  },
  {
    type: 'text-open',
    question: 'Quel est le délai de fabrication pour un verre progressif Rodenstock ?',
    hint: '9 jours',
  },
  {
    type: 'text-open',
    question: 'Quel est le délai de fabrication pour un verre progressif fabriqué dans notre laboratoire parisien ?',
    hint: '24 à 48 heures',
  },
  {
    type: 'text-open',
    question: 'Combien de zones de vision a un verre progressif ? Citez-les.',
    hint: '3 zones : loin (haut) · intermédiaire (centre) · près (bas)',
  },
  {
    type: 'text-open',
    question: 'Pour quel type de client propose-t-on un verre progressif ?',
    hint: 'Les presbytes — correction de loin ET de près avec une seule paire de lunettes',
  },
]

export const TYPES_VERRES_PAGES = [
  {
    id: 'unifocal',
    type: 'unifocal',
    titre: 'Le Verre Unifocal',
    avatarScript: "Le verre unifocal, c'est la correction la plus simple : une seule correction sur toute la surface. Pas de zone de flou. Il est destine aux clients qui n'ont qu'un seul probleme a corriger, mais aussi aux presbytes qui veulent une paire dediee a une distance precise.",
    color: '#00abe9',
  },
  {
    id: 'progressif',
    type: 'progressif',
    avatarScript: "Le Pulsar Next est notre verre progressif haut de gamme. Il corrige la vision de loin, intermédiaire et de près avec une seule paire de lunettes. Sa zone de flou est réduite au maximum — l'adaptation est plus rapide et le confort nettement supérieur aux progressifs classiques.",
    color: '#7c3aed',
  },
]

export const PDM_PAGES = [
  {
    id: 'pourquoi',
    type: 'pdm-pourquoi',
    titre: 'Pourquoi mesurer ?',
    sousTitre: 'Positionner le centre optique du verre exactement devant les yeux du client.',
    icon: '👁️',
    points: [
      { emoji: '🎯', titre: 'Centrage optique', texte: "Avant de fabriquer les verres, il faut mesurer précisément où se trouvent les yeux du client pour aligner le centre du verre devant sa pupille." },
      { emoji: '😌', titre: 'Confort visuel', texte: "Un verre mal centré provoque fatigue, maux de tête et flou — même avec une correction parfaite." },
      { emoji: '✅', titre: 'Satisfaction garantie', texte: "Une bonne mesure = un client satisfait dès le premier port de ses lunettes." },
    ],
    avatarScript: "Avant de fabriquer les verres, on doit mesurer précisément où se trouvent les yeux du client. Un verre mal centré, même avec la bonne correction, peut provoquer de la fatigue ou du flou. C'est le point de départ de chaque vente réussie.",
    color: '#f59e0b',
  },
  {
    id: 'pdm-animation',
    type: 'pdm-animation',
    titre: 'Du verre brut a la paire parfaite',
    sousTitre: 'Animation pas a pas',
    color: '#f59e0b',
  },
  {
    id: 'outil',
    titre: 'LPTVISION',
    sousTitre: "L'outil intégré LPT — rapide, précis, obligatoire sur chaque vente",
    image: '/assets/lptvision-tangentes.png',
    points: [
      { emoji: '📱', titre: 'App interne LPT', texte: "LPTVISION remplace totalement la prise à la main — plus précise, plus reproductible." },
      { emoji: '🚫', titre: 'Zéro mesure manuelle', texte: "Aucune règle, aucun stylo. L'app est l'unique référence sur chaque vente." },
      { emoji: '⚠️', titre: "Pourquoi c'est crucial", texte: "Une mauvaise mesure = un verre mal taillé = un client insatisfait." },
    ],
    avatarScript: "LPTVISION est notre outil de prise de mesure intégré. Pas de règle, pas de prise à la main. C'est rapide, précis, et obligatoire sur chaque vente. Sans exception.",
    color: '#f59e0b',
  },
  {
    id: 'comment',
    titre: 'Les 3 étapes clés',
    sousTitre: 'Client bien positionné · Monture bien droite · Vous bien en face',
    icon: '📐',
    points: [
      { emoji: '🧍', titre: 'Le client — debout, bien droit', texte: "Position naturelle, regard fixé sur l'objectif de l'app. Pas de tête penchée ni tournée." },
      { emoji: '👓', titre: 'La monture — bien droite', texte: "Branches parallèles au sol, pas de torsion. Ajustez avant de lancer l'app." },
      { emoji: '📏', titre: 'Votre position — 1 mètre, face aux yeux', texte: "L'objectif à hauteur des yeux du client, bien centré. Stable, sans angle." },
    ],
    avatarScript: "Trois règles simples : le client debout, la monture droite, et vous à 1 mètre face à ses yeux. Si une de ces trois conditions n'est pas respectée, la mesure sera faussée. Vérifiez les trois à chaque fois.",
    color: '#f59e0b',
  },
]

export const PDM_QUIZ = [
  {
    question: 'Quelle est la position idéale du client pour la PDM ?',
    options: ['Assis, regard naturel', "Debout, bien droit, regard naturel vers l'objectif", 'Debout mais légèrement penché en avant'],
    correct: 1,
  },
  {
    question: 'Que faut-il vérifier sur la monture avant de lancer LPTVISION ?',
    options: ["Qu'elle est de la bonne couleur", "Qu'elle est bien droite, branches parallèles", "Qu'elle est bien rangée dans l'étui"],
    correct: 1,
  },
  {
    question: 'À quelle distance doit-on se placer pour faire une PDM avec LPTVISION ?',
    options: ['30 cm', 'Environ 1 mètre', '2 mètres ou plus'],
    correct: 1,
  },
]

export const OPTIQUE_PAGES = [
  {
    id: 'troubles-intro',
    type: 'troubles-intro',
    titre: 'Pourquoi porte-t-on des lunettes ?',
    sousTitre: 'Réfléchissez-y…',
    icon: '👁️',
    color: '#00abe9',
  },
  {
    id: 'troubles',
    type: 'troubles-list',
    titre: 'Pourquoi porte-t-on des lunettes ?',
    sousTitre: 'Les 4 principaux troubles visuels',
    icon: '👁️',
    color: '#00abe9',
    troubles: [
      { num: '01', nom: 'Myope',        def: 'Voit bien de près, flou de loin.',                                     color: '#00abe9', video: '/assets/opticien-videos/myopie.mp4' },
      { num: '02', nom: 'Hypermétrope', def: 'Flou à toutes distances, force constamment pour voir net.',             color: '#7c3aed', video: '/assets/opticien-videos/hypermetropie.mp4' },
      { num: '03', nom: 'Astigmate',    def: 'Vision déformée à toutes distances.',                                   color: '#f59e0b', video: '/assets/opticien-videos/astigmate.mp4' },
      { num: '04', nom: 'Presbyte',     def: 'Vision floue de près à partir de 40-45 ans.',                          color: '#22c55e', video: '/assets/opticien-videos/presbytie.mp4' },
    ],
    avatarScript: "On porte des lunettes pour corriger un trouble visuel. Il en existe 4 principaux : myopie, hypermétropie, astigmatisme et presbytie. Chacun affecte la vision différemment — et chacun a sa correction adaptée.",
  },
  {
    id: 'corrections',
    type: 'correction-scale',
    titre: 'Comment fonctionnent les corrections ?',
    sousTitre: 'De 0,00 à ±8,00 — par pas de 0,25 dioptrie',
    icon: '🔢',
    color: '#00abe9',
    avatarScript: "Les corrections sont mesurées en dioptries. On part de 0,00 — le plan, aucune correction nécessaire. Elles évoluent de 0,25 en 0,25 dans les deux sens : négatif pour la myopie, positif pour l'hypermétropie. Plus le chiffre est élevé, plus la correction est forte.",
  },
  {
    id: 'ordonnance',
    type: 'ordonnance',
    titre: 'Lire une ordonnance',
    sousTitre: 'Sphère · Cylindre · Axe — décrypter la prescription',
    icon: '📋',
    color: '#38bdf8',
    avatarScript: "Sur une ordonnance optique, vous trouverez toujours trois colonnes : la Sphère, la correction principale — négative pour les myopes, positive pour les hypermétropes. Le Cylindre, qui corrige l'astigmatisme. L'Axe, qui oriente ce cylindre. Et l'Addition, uniquement présente sur les progressifs.",
  },
  {
    id: 'atelier',
    type: 'pause',
    titre: 'Place à la pratique !',
    sousTitre: 'Travaillons maintenant sur de vraies ordonnances',
    icon: '🔬',
    color: '#00abe9',
  },
  {
    id: 'saisie-ordo',
    type: 'saisie-interactive',
    titre: 'À vous de jouer !',
    sousTitre: 'Saisissez les corrections dans l\'app',
    icon: '⌨️',
    color: '#00abe9',
  },
]

export const OPTIQUE_QUIZ = [
  {
    question: 'Un client voit bien de près mais flou de loin. Quel est son trouble ?',
    options: ['Myope', 'Hypermétrope', 'Presbyte', 'Astigmate'],
    correct: 0,
  },
  {
    question: 'Comment reconnaît-on une hypermétropie sur une ordonnance ?',
    options: ['Signe + dans la sphère', 'Signe - dans la sphère', 'Entre parenthèse', 'Avec un degré'],
    correct: 0,
  },
  {
    question: "Quel est la particularité de la vision de l'astigmatisme ?",
    options: ['Vision flou de loin', 'Vision flou de près', 'Vision déformée', 'Vision flou de loin & de près'],
    correct: 2,
  },
  {
    question: 'A partir de quelle âge apparait généralement la presbytie ?',
    options: ['30-35 ans', '35-40 ans', '40-45 ans', '45-50 ans'],
    correct: 2,
  },
  {
    question: 'De combien en combien évoluent les corrections ?',
    options: ['0,15', '0,25', '0,50', '0,10'],
    correct: 1,
  },
  {
    question: 'Sur une ordonnance, une sphère négative (ex : -2) indique :',
    options: ['Myopie', 'Hypermétropie', 'Presbytie', 'Astigmatisme'],
    correct: 0,
  },
  {
    question: 'A quoi correspond le cylindre ?',
    options: ['Hypermétropie', 'Myopie', 'Presbytie', 'Astigmatisme'],
    correct: 3,
  },
  {
    question: 'A quoi correspond la colonne « Add » ?',
    options: ['La presbytie', "L'astigmatisme", 'La myopie', "L'hypermétropie"],
    correct: 0,
  },
  {
    question: 'Quels sont les problèmes de vue de ce client ?',
    type: 'qcm-ordonnance',
    ordonnance: {
      od: { sph: '-2,25', cyl: '-0,50', axe: '10°' },
      og: { sph: '-1,75', cyl: '-0,75', axe: '15°' },
    },
    options: ['Hypermétrope & Astigmate', 'Astigmate & Presbyte', 'Myope & Presbyte', 'Myope & Astigmate'],
    correct: 3,
  },
  {
    question: 'Un client voit flou à toute distance et force constamment pour voir net. Quel est son trouble ?',
    options: ['Myope & Presbyte', 'Hypermétrope', 'Astigmate & Presbyte', 'Myope'],
    correct: 1,
  },
  {
    question: 'Quels sont les problèmes de vue de ce client ?',
    type: 'qcm-ordonnance',
    ordonnance: {
      od: { sph: '+2,00', cyl: '-1,00', axe: '145°' },
      og: { sph: '+1,75', cyl: '-0,75', axe: '150°' },
    },
    options: ['Myope & Astigmate', 'Myope & Presbyte', 'Hypermétrope & Astigmate', 'Hypermétrope & Myope'],
    correct: 2,
  },
  {
    question: 'Comment appelle-t-on la valeur 0,00 ?',
    options: ['Nulle', 'Plan', 'Inexistant', 'Correction de repos'],
    correct: 1,
  },
  {
    question: "Sur une ordonnance, l'axe du cylindre est exprimé en :",
    options: ['Millimètre', 'Degré', 'Pourcentage'],
    correct: 1,
  },
  {
    question: 'Quels sont les problèmes de vue de ce client ?',
    type: 'qcm-ordonnance',
    ordonnance: {
      od: { sph: '-3,00', cyl: '-1,50', axe: '23°', add: '+2,00' },
      og: { sph: '-2,75', cyl: '-1,25', axe: '30°', add: '+2,00' },
    },
    options: ['Myope, Astigmate & Hypermétrope', 'Hypermétrope, Astigmate & Presbyte', 'Myope, Astigmate & Presbyte', 'Myope, Hypermétrope & Presbyte'],
    correct: 2,
  },
  {
    question: 'Comment reconnaît-on une myopie sur une ordonnance ?',
    options: ['Signe - dans la sphère', 'Signe + dans la sphère', 'Avec un degré', 'Entre parenthèse'],
    correct: 0,
  },
  {
    question: 'Que signifie « ADD » ?',
    options: ['Addition', 'Addiction', 'A Déduire Directement', 'Addict'],
    correct: 0,
  },
  {
    question: "Jusqu'à quelle correction va-t-on en magasin pour la myopie ?",
    options: ['-8,00', '-2,00', '-15,00', '-5,00'],
    correct: 0,
  },
  {
    question: 'En combien de temps peut-on fabriquer une paire de lunettes en magasin ?',
    options: ['9 jours', '1h', '10 minutes', '30 minutes'],
    correct: 2,
  },
  {
    question: "Jusque combien allons-nous en myopie sur commande ?",
    options: ['-8', '-22', '-25', '-15'],
    correct: 1,
  },
  {
    question: "De quoi est toujours accompagné l'axe ?",
    options: ['La sphère', "L'addition", 'Le cylindre'],
    correct: 2,
  },
]

// ── Exercices saisie ordonnance ───────────────────────────────────
// Valeurs en nombres (float). axe en entier.
export const SAISIE_EXERCISES = [
  {
    id: 'ex1', label: 'Cas 1',
    od: { sphere:  1.50, cylindre: -0.50, axe: 180 },
    og: { sphere:  1.00, cylindre: -0.25, axe:  30 },
    add: null,
  },
  {
    id: 'ex2', label: 'Cas 2',
    od: { sphere: -3.00, cylindre: -1.00, axe:  20 },
    og: { sphere: -3.25, cylindre: -1.00, axe: 100 },
    add: null,
  },
  {
    id: 'ex3', label: 'Cas 3',
    od: { sphere:  1.25, cylindre:  0.00, axe:   0 },
    og: { sphere:  1.50, cylindre: -0.25, axe: 150 },
    add: 1.50,
  },
]

// ── Données partagées page 3 ──────────────────────────────────────
export const ORD_COLS = [
  {
    key: 'sphere',
    label: 'Sphère',
    color: '#38bdf8',
    desc: 'Correction de base',
    sub: 'Négatif = myopie  ·  Positif = hypermétropie',
  },
  {
    key: 'cylindre',
    label: 'Cylindre',
    color: '#fb923c',
    desc: "Correction de l'astigmatisme",
    sub: null,
  },
  {
    key: 'axe',
    label: 'Axe',
    color: '#c084fc',
    desc: "Orientation du cylindre",
    sub: 'De 0° à 180°',
  },
]
export const ORD_EXAMPLE = {
  od: { sphere: '−0,75', cylindre: '(−0,25)', axe: '180°' },
  og: { sphere: '−1,00', cylindre: '(−0,50)', axe: '70°'  },
  add: '+2,00',
}

export const OFFRES_PAGES = [
  { id: 'classique',      type: 'offres-classique',     color: '#00abe9' },
  { id: 'un-pour-un',    type: 'offres-1-1',            color: '#c9a227' },
  { id: 'unifocal-11',   type: 'offres-unifocal-11',   color: '#c9a227' },
  { id: 'progressif-11', type: 'offres-progressif-11', color: '#c9a227' },
]

export const OFFRES_QUIZ = [
  {
    question: 'Quel parcours propose un reste à charge de 0€ ET des verres Origine France Garantie ?',
    options: ['Parcours 1=1', 'Parcours Suprême', 'Pack Plan à 95€'],
    correct: 1,
  },
  {
    question: 'Dans le parcours 1=1 sans remboursement, combien coûtent 2 paires de progressifs ?',
    options: ['~157€', '~260€', '~350€'],
    correct: 1,
  },
  {
    question: 'Quel parcours est destiné à un client sans ordonnance qui veut 2 paires sans correction ?',
    options: ['Parcours Classique', 'Parcours 1=1', 'Pack Plan à 95€'],
    correct: 2,
  },
  {
    question: 'Dans le parcours Classique, quel est l\'avantage sur la 2e paire ?',
    options: ['Elle est offerte', 'Elle est à -50%', 'Elle est à -20%'],
    correct: 2,
  },
  {
    question: 'Quelle formule GlassProtect couvre la casse ET la rayure de l\'équipement complet pendant 1 an ?',
    options: ['Basic', 'Silver', 'Gold'],
    correct: 2,
  },
]

export const ENTREPRISE_QUIZ = [
  {
    type: 'text-open',
    question: 'En quelle année Lunettes Pour Tous a-t-il été fondé ?',
    hint: '2014',
    autoCorrect: ['2014'],
  },
  {
    type: 'text-open',
    question: 'Citez les deux fondateurs de Lunettes Pour Tous.',
    hint: 'Paul Morlet & Xavier Niel',
  },
  {
    type: 'text-open',
    question: 'Quelle est la promesse de Lunettes Pour Tous en matière de délai ?',
    hint: '10 minutes',
    autoCorrect: ['10'],
  },
  {
    type: 'text-open',
    question: 'Citez les 5 éléments qui font la force de Lunettes Pour Tous.',
    hint: 'Stocks dans chaque magasin · Machines à la pointe · Volume de ventes conséquent · Propre marque · 0 intermédiaire',
  },
  {
    type: 'text-open',
    question: 'Où se trouve le laboratoire progressif unique au monde de Lunettes Pour Tous ?',
    hint: 'Paris Châtelet',
    autoCorrect: ['paris', 'chatelet', 'châtelet'],
  },
  {
    type: 'text-open',
    question: 'Quel est le délai de fabrication pour un verre complexe (progressif) d\'un client parisien ?',
    hint: 'Dans la journée — (Rappel : pour les unifocaux, le délai est de 10 min à Paris comme partout en France)',
  },
]

export const ENTREPRISE_PAGES = [
  {
    id: 'freins',
    type: 'freins',
    titre: "Quels sont pour vous, les freins à l'achat d'une paire de lunettes ?",
    color: '#00abe9',
  },
  {
    id: 'prix',
    type: 'prix',
    titre: "Combien coûte une paire de lunettes en moyenne ?",
    color: '#f59e0b',
  },
  {
    id: 'ventes-opticien',
    type: 'ventes-opticien',
    titre: 'À votre avis, un opticien traditionnel vend combien de paires par jour ?',
    color: '#a78bfa',
  },
  {
    id: 'naissance',
    type: 'naissance',
    titre: '2014, naissance de Lunettes pour Tous',
    sousTitre: 'Mission claire, rendre la vue accessible à tous',
    color: '#00abe9',
  },
  {
    id: 'chiffres',
    type: 'chiffres',
    titre: "Lunettes pour Tous aujourd'hui",
    color: '#00abe9',
    stats: [
      { value: '33',           label: 'magasins France & Belgique',     color: '#00abe9' },
      { value: '+1 000',       label: 'collaborateurs',                  color: '#f59e0b' },
      { value: 'Des milliers', label: 'de clients équipés chaque jour', color: '#a78bfa' },
      { value: '10 minutes',   label: 'la promesse LPT',                color: '#f472b6' },
    ],
  },
  {
    id: 'promesse',
    type: 'promesse',
    titre: 'Comment nous tenons notre promesse ?',
    color: '#34d399',
  },
  {
    id: 'force-lpt',
    type: 'force-lpt',
    titre: 'Ce qui fait la force de Lunettes Pour Tous',
    color: '#00abe9',
    items: [
      { label: 'Des stocks de verres et montures dans chacun de nos magasins', color: '#00abe9', video: '/assets/video-stock.mp4' },
      { label: 'Des machines à la pointe de la technologie', color: '#4ade80', video: '/assets/V2-machines.mp4' },
      { label: 'Volume de ventes conséquent', color: '#f59e0b', animation: 'counter', counters: [
        { value: 5000, unit: 'paires vendues par jour', sub: 'sur tout le réseau LPT', delay: 0 },
        { value: 1000000, unit: 'paires vendues en 2025', sub: "et ça continue…", delay: 2400 },
      ]},
      { label: 'Notre propre marque', color: '#a78bfa', video: '/assets/D%C3%A9tails%20fabrication%20montures.mp4' },
      { label: '0 intermédiaire', color: '#f472b6', video: null },
    ],
  },
  {
    id: 'labo-progressif',
    type: 'labo-progressif',
    titre: 'Notre laboratoire progressif',
    sousTitre: 'Une exclusivité mondiale — Paris Châtelet',
    color: '#7c3aed',
  },
  {
    id: 'quiz-transition',
    type: 'quiz-transition',
    titre: 'Des questions avant de passer au quiz ?',
    color: '#7c3aed',
  },
]

export const PROGRESSIF_PAGES = [
  {
    id: 'anatomie',
    type: 'cours',
    titre: 'Anatomie du verre progressif',
    sousTitre: 'Trois zones actives · Aberrations latérales',
    image: '/assets/verre-prog.png',
    points: [
      { emoji: '🔭', titre: 'Zone supérieure — Vision de loin', texte: 'Conduite, cinéma, paysages. Vision nette au-delà de 3 mètres. Zone la plus large du verre.' },
      { emoji: '🖥️', titre: 'Zone centrale — Vision intermédiaire', texte: 'Écran, comptoir, bras tendu. De 40 cm à 3 m. Zone de transition fluide entre loin et près.' },
      { emoji: '📖', titre: 'Zone inférieure — Vision de près', texte: 'Lecture, smartphone, écriture. En dessous de 40 cm. Le client regarde naturellement vers le bas.' },
      { emoji: '↔️', titre: 'Zones latérales — Flou inévitable', texte: "Sur les bords du verre, la vision est floue. C'est physique. Apprentissage : tourner la tête, pas les yeux." },
    ],
    avatarScript: "Le progressif a trois zones actives : loin en haut, intermédiaire au centre, près en bas. Les bords latéraux sont flous — c'est inévitable physiquement. L'apprentissage clé : tourner la tête, pas les yeux.",
    color: '#7c3aed',
  },
  {
    id: 'zone-interactif',
    type: 'zone-interactif',
    titre: 'Identifie les zones !',
    sousTitre: 'Le formateur lance chaque question depuis son écran',
    color: '#7c3aed',
    zoneQuestions: [
      { question: 'Où se trouve la zone de vision de LOIN ?', options: ['Zone supérieure', 'Zone centrale', 'Zone inférieure'], correct: 0 },
      { question: 'Où se trouve la zone de vision de PRÈS ?', options: ['Zone supérieure', 'Zone centrale', 'Zone inférieure'], correct: 2 },
      { question: 'Pour lire confortablement, le client regarde…', options: ['Vers le haut', 'Droit devant', 'Vers le bas'], correct: 2 },
    ],
  },
  {
    id: 'presbyterie',
    type: 'cours',
    titre: 'Identifier un client presbyte',
    sousTitre: "Les signaux à reconnaître — avant même d'ouvrir l'ordonnance",
    image: '/assets/verre-prog.png',
    points: [
      { emoji: '📅', titre: 'Âge — premier indicateur', texte: "La presbytie apparaît généralement entre 40 et 45 ans. Dès cette tranche d'âge, pensez progressif." },
      { emoji: '👀', titre: 'Comportement révélateur', texte: "Éloigne les documents pour lire, retire ses lunettes pour voir de près, plisse les yeux, demande plus de lumière." },
      { emoji: '💬', titre: 'La question magique', texte: '"Vous portez vos lunettes pour lire aussi ?" Si non ou difficile → signal fort pour proposer le progressif.' },
      { emoji: '📋', titre: "Sur l'ordonnance — mention Add", texte: 'La mention "Add" confirme la presbytie. Ex: Add +1.50. Plus l\'addition est élevée, plus la presbytie est avancée.' },
    ],
    avatarScript: "Un client presbyte éloigne ses documents pour lire. Dès 40-45 ans, posez la question. Sur l'ordonnance, cherchez la mention 'Add'. C'est votre déclencheur pour proposer le progressif.",
    color: '#7c3aed',
  },
  {
    id: 'retour-terrain',
    type: 'prog-retour',
    titre: 'Retour du terrain',
    sousTitre: 'Partagez une expérience de vos 2 semaines en magasin',
    question: 'Comment as-tu présenté le progressif à un client en magasin ?',
    placeholder: "Ex: J'ai expliqué les zones au client en lui montrant le verre…",
    color: '#7c3aed',
  },
  {
    id: 'arguments-vente',
    type: 'cours',
    titre: 'Vendre le progressif LPT',
    sousTitre: 'Nos arguments · Notre différence · Gestion des objections',
    image: '/assets/verre-prog.png',
    points: [
      { emoji: '🏆', titre: 'Extra-large 180° — notre force', texte: 'Nos progressifs ont des zones de confort plus larges que la moyenne du marché. Adaptation plus facile, moins de flou latéral.' },
      { emoji: '🔒', titre: 'Garantie 100 jours', texte: "L'argument ultime. \"Si vous ne vous adaptez pas en 100 jours, on change.\" Zéro risque pour le client." },
      { emoji: '💰', titre: 'Prix accessible — notre ADN', texte: "Progressif LPT à partir de 30€. La concurrence facture 3 à 10× plus cher. Insistez sur cette rupture de prix." },
      { emoji: '⏱️', titre: 'Fabrication rapide', texte: "Délai de fabrication : quelques heures à une journée en boutique. Argument fort face aux opticiens traditionnels." },
    ],
    avatarScript: "Trois arguments imbattables : nos zones extra-larges, la garantie 100 jours qui enlève toute objection, et un prix accessible sans équivalent sur le marché.",
    color: '#7c3aed',
  },
  {
    id: 'jeu-objections',
    type: 'prog-objections',
    titre: "Jeu d'objections",
    sousTitre: 'Le formateur choisit une objection client — trouvez la meilleure réponse',
    color: '#7c3aed',
    objections: [
      "C'est trop cher, je ne veux pas mettre autant dans des lunettes",
      "J'ai peur de ne pas m'adapter aux progressifs",
      "Mon opticien habituel me fait des progressifs de meilleure qualité",
      "Je préfère avoir deux paires : une pour loin et une pour près",
      "Mon voisin a eu des progressifs et il n'a jamais pu s'y adapter",
    ],
  },
]

export const PROGRESSIF_QUIZ = [
  {
    question: 'Dans quelle zone du verre progressif se trouve la vision de LOIN ?',
    options: ['Zone supérieure', 'Zone centrale', 'Zone inférieure'],
    correct: 0,
  },
  {
    question: 'Quelle est la durée de la garantie adaptation LPT pour les progressifs ?',
    options: ['30 jours', '60 jours', '100 jours'],
    correct: 2,
  },
  {
    question: 'À partir de quel âge la presbytie apparaît-elle généralement ?',
    options: ['35 ans', '40 – 45 ans', '55 ans'],
    correct: 1,
  },
  {
    question: '"Add +1.75" sur une ordonnance signifie :',
    options: ["L'axe de correction astigmate", "L'addition pour la vision de près (presbytie)", "La puissance sphérique totale"],
    correct: 1,
  },
  {
    question: 'Pour lire confortablement avec des progressifs, le client doit :',
    options: ['Regarder droit devant', 'Incliner la tête et regarder vers le bas', "Tourner les yeux vers le bas sans bouger la tête"],
    correct: 1,
  },
  {
    question: "Un client dit \"j'ai peur de ne pas m'adapter\". Votre meilleure réponse ?",
    options: ['Lui proposer deux paires unifocales', 'Rappeler la garantie 100 jours : zéro risque pour lui', "Lui dire que l'adaptation est toujours rapide"],
    correct: 1,
  },
  {
    question: 'Quelle caractéristique différencie le progressif LPT de la concurrence ?',
    options: ["Aucune zone d'aberration latérale", 'Des zones de confort extra-larges 180°', 'Un délai de fabrication de 9 jours'],
    correct: 1,
  },
  {
    question: "Lequel de ces signes N'EST PAS caractéristique de la presbytie ?",
    options: ['Éloigner les documents pour lire', 'Retirer ses lunettes pour voir de près', 'Plisser les yeux en regardant au loin'],
    correct: 2,
  },
]

export const TRAME_ACCUEIL_POINTS = [
  { num: 1, text: 'Bonjour et bienvenue chez Lunettes Pour Tous', color: '#00abe9', emoji: '👋' },
  { num: 2, text: 'Connaissez-vous le concept ?', color: '#7c3aed', emoji: '💡' },
  { num: 3, text: "Ici c'est simple, c'est la possibilité d'avoir ses lunettes de vue en seulement 10 minutes avec ou sans ordonnance.", color: '#f59e0b', emoji: '⏱️' },
  { num: 4, text: "Je vous inscris en examen de vue ? C'est gratuit et sans rendez-vous.", color: '#22c55e', emoji: '✅' },
]

export const TRAME_ACCUEIL_PAGES = [
  { id: 'trame', type: 'trame-accueil' },
]

// ─── SAV — Journée 4 ──────────────────────────────────────────

export const RETRAITS_PAGES = [
  {
    id: 'retraits-brainstorm',
    type: 'sav-brainstorm',
    moduleId: 'retraits',
    color: '#00abe9',
    icon: '💬',
    question: 'Comment faire un retrait de lunettes ?\nQuelles sont les étapes ?',
  },
  {
    id: 'retraits-overview',
    type: 'sav-content',
    color: '#00abe9',
    icon: '📦',
    titre: 'Le Process Retrait',
    sousTitre: 'SAV · Vue d\'ensemble',
    points: [
      { emoji: '📱', titre: 'SMS reçu', desc: '1 SMS par paire avec le numéro de commande' },
      { emoji: '🔍', titre: 'Onglet Commandes', desc: 'N° de commande → téléphone de vente → nom du client' },
      { emoji: '🗂️', titre: 'Étagères retrait', desc: 'Paires classées par ordre alphabétique sur les étagères' },
      { emoji: '👓', titre: 'Essayage', desc: 'Vérifier réglage, confort et adaptation visuelle' },
      { emoji: '✅', titre: 'Signature + Avis', desc: '1 retrait signé par paire · QR code Google' },
    ],
    notesFormateur: [
      { icon: '🗺️', title: 'Vue d\'ensemble', text: 'Présenter les 5 étapes avant d\'entrer dans le détail. Insister que c\'est un process qualité — pas juste une formalité administrative.' },
    ],
  },
  {
    id: 'retraits-sms',
    type: 'sav-content',
    color: '#00abe9',
    icon: '📱',
    titre: '1 — Le SMS de confirmation',
    sousTitre: 'SAV · Retraits · Étape 1',
    showIphone: true,
    points: [
      { emoji: '📲', titre: '1 SMS = 1 paire', desc: 'Chaque paire prête génère un SMS avec son numéro de commande' },
      { emoji: '2️⃣', titre: '2 paires = 2 SMS', desc: 'Un client avec 2 paires reçoit 2 SMS distincts' },
      { emoji: '🔢', titre: 'Numéro de commande', desc: 'Visible dans le SMS — c\'est la clé pour retrouver la paire' },
    ],
    notesFormateur: [
      { icon: '📱', title: 'En pratique', text: 'Montrer un exemple de SMS reçu sur le téléphone de vente. Le numéro de commande est clairement affiché dans le message.' },
      { icon: '⚠️', title: 'Règle clé', text: '2 paires = 2 retraits à effectuer sur le téléphone de vente. Même client, mais 2 opérations distinctes — ne pas les confondre.' },
    ],
  },
  {
    id: 'retraits-recherche',
    type: 'sav-content',
    color: '#4ade80',
    icon: '🔍',
    titre: '2 — Trouver la paire',
    sousTitre: 'SAV · Retraits · Étape 2',
    points: [
      { emoji: '📟', titre: 'Onglet Commandes', desc: 'Entrer le N° de commande dans l\'onglet Commandes du téléphone de vente' },
      { emoji: '👤', titre: 'Nom + Prénom', desc: 'Nom et prénom du client s\'affichent immédiatement' },
      { emoji: '🔤', titre: 'Ordre alphabétique', desc: 'Les paires sont rangées par ordre alphabétique sur les étagères' },
      { emoji: '💻', titre: 'Un seul SMS ?', desc: 'Si le client n\'a reçu qu\'un SMS, vérifier l\'état de la 2ᵉ paire directement dans le Back End sur l\'ordinateur' },
    ],
    notesFormateur: [
      { icon: '🎯', title: 'En pratique', text: 'Montrer le geste complet : saisir le N° → nom visible → aller chercher sur les étagères. Faire faire à chaque formé.' },
      { icon: '📚', title: 'Ordre alphabétique', text: 'A → Z sur le nom de famille. Si le client a un nom composé ou un préfixe, l\'ordre suit ce qui est saisi dans le système.' },
      { icon: '💻', title: 'Back End — vérification 2ᵉ paire', text: 'Si le client n\'a reçu qu\'un seul SMS, ne pas lui dire que la 2ᵉ n\'est pas prête sans vérifier. Ouvrir le Back End sur l\'ordinateur pour voir l\'état exact de la commande.' },
    ],
  },
  {
    id: 'retraits-essayage',
    type: 'sav-content',
    color: '#f59e0b',
    icon: '👓',
    titre: '3 — L\'Essayage',
    sousTitre: 'SAV · Retraits · Étape 3',
    points: [
      { emoji: '📦', titre: 'Sortir la paire', desc: 'Sortir de la boîte, déplier les branches, vérifier que la paire est droite' },
      { emoji: '✅', titre: 'Vérifier le port', desc: 'Suffisamment serrée ? Droite sur le visage ? Ajuster si besoin' },
      { emoji: '👁️', titre: 'Gêne visuelle ?', desc: 'Normal ! Toute nouvelle correction nécessite un temps d\'adaptation — la gêne s\'estompe en portant les lunettes' },
    ],
    notesFormateur: [
      { icon: '💬', title: 'Script client', text: '"Vous allez peut-être trouver ça bizarre au début, c\'est tout à fait normal avec une nouvelle correction. En les portant, votre cerveau va s\'adapter et vous n\'y ferez plus attention."' },
      { icon: '🔧', title: 'Ajustage', text: 'Si la paire est mal réglée, faire l\'ajustage maintenant — ne jamais faire signer avant que le client soit à l\'aise.' },
    ],
  },
  {
    id: 'retraits-signature',
    type: 'sav-content',
    color: '#22c55e',
    icon: '✅',
    titre: '4 — Finaliser le retrait',
    sousTitre: 'SAV · Retraits · Étape 4',
    points: [
      { emoji: '✍️', titre: 'Signature sur le téléphone', desc: 'Faire signer le retrait sur le téléphone de vente — 1 signature par paire' },
      { emoji: '2️⃣', titre: '2 paires = 2 signatures', desc: 'Un client avec 2 paires signe 2 retraits distincts sur le téléphone' },
      { emoji: '⭐', titre: 'Avis Google', desc: 'Proposer le QR code disponible au retrait pour laisser un avis Google' },
    ],
    notesFormateur: [
      { icon: '⭐', title: 'L\'avis Google', text: '"Si vous êtes satisfait, nous avons un QR code pour laisser un avis Google — ça nous aide beaucoup !" Naturel, jamais forcé.' },
      { icon: '✅', title: 'Checklist départ', text: 'Signature(s) faite(s) ? Boîte ? Chiffon ? Avis proposé ? Si 2 paires : 2 retraits bien signés ?' },
    ],
  },
]

export const RETRAITS_QUIZ = [
  { type: 'text-open', question: 'Que reçoit le client quand sa paire de lunettes est prête à être retirée ?', hint: '1 SMS par paire avec le numéro de commande' },
  { type: 'text-open', question: 'Comment retrouve-t-on le nom du client à partir du numéro de commande ?', hint: "On entre le numéro dans l'onglet Commandes du téléphone de vente → nom et prénom apparaissent" },
  { type: 'text-open', question: 'Comment les paires sont-elles classées sur les étagères de retrait ?', hint: 'Par ordre alphabétique (nom de famille)' },
  { type: 'text-open', question: 'Un client arrive avec un seul SMS. Que faites-vous avant de lui dire que la 2ᵉ paire n\'est pas prête ?', hint: 'On vérifie l\'état de la 2ᵉ paire dans le Back End sur l\'ordinateur' },
  { type: 'text-open', question: 'Un client a commandé 2 paires. Combien de SMS reçoit-il ? Combien de retraits effectue-t-on sur le téléphone ?', hint: '2 SMS (1 par paire) · 2 retraits sur le téléphone de vente' },
  { type: 'text-open', question: "Que vérifiez-vous avant de tendre la paire au client lors de l'essayage ?", hint: 'Paire droite, branches bien dépliées, aucun défaut visible' },
  { type: 'text-open', question: "Un client dit que ses nouvelles lunettes lui font bizarre. Que lui répondez-vous ?", hint: "C'est normal avec une nouvelle correction — le cerveau s'adapte, la gêne va s'estomper en portant les lunettes" },
  { type: 'text-open', question: 'Que proposez-vous systématiquement au client après la signature du retrait ?', hint: 'De laisser un avis Google via le QR code disponible au retrait' },
]

export const AJUSTAGES_PAGES = [
  {
    id: 'ajustages-brainstorm',
    type: 'sav-brainstorm',
    moduleId: 'ajustages',
    color: '#a78bfa',
    icon: '💬',
    question: 'À quoi sert un ajustage ?\nComment on fait ?',
  },
  {
    id: 'ajustages-intro',
    type: 'sav-content',
    color: '#a78bfa',
    icon: '🔧',
    titre: 'Les Ajustages',
    sousTitre: 'SAV · Journée 4',
    points: [
      { emoji: '💆', titre: 'Confort quotidien', desc: 'Une paire mal réglée est vite mise au placard — le client ne reviendra pas' },
      { emoji: '👁️', titre: 'Résolution visuelle', desc: 'Un mauvais réglage peut provoquer une gêne visuelle qu\'un simple ajustage corrige sans refabrication' },
      { emoji: '💰', titre: 'Économique', desc: 'Évite à LPT de retailler des verres et au client d\'attendre une refabrication' },
    ],
    notesFormateur: [
      { icon: '💡', title: 'Message clé', text: 'Un ajustage bien fait = client satisfait + pas de coût de refabrication. C\'est un acte professionnel, pas une formalité. Insister sur la valeur ajoutée.' },
    ],
  },
  {
    id: 'ajustages-regles',
    type: 'sav-content',
    color: '#a78bfa',
    icon: '📋',
    titre: 'Les règles à retenir',
    sousTitre: 'SAV · Ajustages',
    points: [
      { emoji: '🔥', titre: 'Acétate → à chaud', desc: 'Chaleur sèche uniquement — ne jamais forcer à froid (risque de casse)' },
      { emoji: '❄️', titre: 'Métal → à froid', desc: 'Plaquettes et branches réglables à froid — liberté de réglage maximale' },
      { emoji: '✅', titre: 'Toujours vérifier', desc: 'Paire droite, bien serrée sans comprimer — confort confirmé par le client' },
    ],
    notesFormateur: [
      { icon: '🛠️', title: 'Pratique live', text: 'Prendre une monture acétate et une monture métal. Montrer les gestes d\'ajustage. Faire pratiquer chaque formé sur une vraie paire sous supervision.' },
      { icon: '⚠️', title: 'Erreur courante', text: 'Forcer une monture acétate à froid — elle peut se casser net. Toujours chauffer (chaleur sèche, pas d\'eau chaude) avant de plier.' },
    ],
  },
]

export const AJUSTAGES_QUIZ = [
  { type: 'text-open', question: 'Pourquoi les ajustages sont-ils essentiels au quotidien pour le client ?', hint: 'Une paire mal réglée génère une gêne et finit au placard — le client ne reviendra pas' },
  { type: 'text-open', question: 'Comment ajuste-t-on une monture en acétate ? Et une monture en métal ?', hint: 'Acétate : à chaud (chaleur sèche) · Métal : à froid (plaquettes et branches réglables)' },
  { type: 'text-open', question: 'En dehors du confort de port, quel autre problème un ajustage peut-il résoudre ?', hint: 'Une gêne visuelle — un mauvais réglage peut créer une gêne vue, un ajustage la corrige sans refabrication' },
  { type: 'text-open', question: 'Quels avantages un bon ajustage représente-t-il — pour LPT et pour le client ?', hint: 'LPT : évite une refabrication coûteuse · Client : problème résolu immédiatement, pas d\'attente' },
]

export const RAZ_PAGES = [
  {
    id: 'raz-brainstorm',
    type: 'sav-brainstorm',
    moduleId: 'raz',
    color: '#f87171',
    icon: '💬',
    question: "C'est quoi une RAZ ?\nPourquoi est-ce qu'on en fait ?\nComment on fait ?",
  },
  {
    id: 'raz-intro',
    type: 'sav-content',
    color: '#f87171',
    icon: '🔄',
    titre: 'Les RAZ — Recommandes',
    sousTitre: 'SAV · Journée 4 · Module 3',
    points: [
      { emoji: '🔄', titre: 'Dernier recours', desc: "Une RAZ = refabriquer un équipement — uniquement quand c'est la seule solution" },
      { emoji: '🔍', titre: 'Identifier le problème', desc: 'Trouver la cause exacte avant de recommander — éviter la RAZ sur la RAZ' },
      { emoji: '📋', titre: 'Process à respecter', desc: 'Des étapes précises pour ne pas créer d\'autres problèmes lors de la refabrication' },
    ],
    notesFormateur: [
      { icon: '🎯', title: 'Objectif du module', text: "Ce module donne le process complet : comment diagnostiquer d'où vient le problème, puis comment saisir la RAZ pas à pas. Insister sur le fait que chaque étape protège le magasin et le client." },
    ],
  },
  {
    id: 'raz-overview',
    type: 'sav-content',
    color: '#f87171',
    icon: '🔍',
    titre: 'Trouver la cause avant de recommander',
    sousTitre: 'SAV · RAZ — Les 4 vérifications',
    points: [
      { emoji: '1️⃣', titre: 'Saisie de la correction', desc: "Comparer l'ordonnance avec le back-end (attention à la transposition)" },
      { emoji: '2️⃣', titre: 'Les verres sur la paire', desc: 'Vérifier au frontofocométre que les verres correspondent au back-end' },
      { emoji: '3️⃣', titre: 'Les prises de mesures', desc: 'Hauteur et écarts — un mauvais centrage peut provoquer une gêne visuelle' },
      { emoji: '4️⃣', titre: "L'ordonnance / examen de vue", desc: 'Si tout est conforme, la base même est peut-être incorrecte' },
    ],
    notesFormateur: [
      { icon: '⚠️', title: 'Ordre des vérifications', text: "Toujours faire les 4 étapes dans l'ordre, même si on pense déjà connaître le problème. Chaque étape est un filet de sécurité. Peu importe le problème trouvé, on vérifie les autres éléments quand même — pour éviter la RAZ sur la RAZ." },
    ],
  },
  {
    id: 'raz-etape1',
    type: 'sav-content',
    color: '#f87171',
    icon: '📋',
    titre: 'Étape 1 — La saisie de la correction',
    sousTitre: "Ouvrir le dossier client → ouvrir l'ordonnance",
    points: [
      { emoji: '👁', titre: 'Comparer ordonnance ↔ back-end', desc: 'Attention : faire la transposition si nécessaire avant de comparer' },
      { emoji: '❌', titre: 'Si différent → problème trouvé', desc: "Le vendeur s'est trompé → le client n'a pas les bonnes corrections sur ses lunettes" },
      { emoji: '✅', titre: 'Si identique → étape suivante', desc: "La saisie est correcte, le problème vient d'ailleurs" },
    ],
    notesFormateur: [
      { icon: '🔄', title: 'La transposition', text: "Si la prescription est en négatif, il faut la transposer avant de comparer avec le back-end. Ex : -2.00 (-0.50 × 90) = -2.50 (+0.50 × 180). C'est l'erreur la plus fréquente en magasin." },
      { icon: '📊', title: 'La cause n°1', text: "L'erreur de saisie est la cause n°1 des RAZ. Prendre le temps de bien former les vendeurs à la saisie correcte dès le départ évite beaucoup de refabrications." },
    ],
  },
  {
    id: 'raz-etape2',
    type: 'sav-content',
    color: '#f87171',
    icon: '🔬',
    titre: 'Étape 2 — Les verres sur la paire',
    sousTitre: 'Vérification avec le frontofocométre',
    points: [
      { emoji: '🔬', titre: 'Mesurer les corrections sur la paire', desc: 'Comparer avec ce qui est dans le back-end — peut-être une erreur au montage' },
      { emoji: '❌', titre: 'Si différent → problème trouvé', desc: 'Les mauvais verres ont été montés — bonne saisie informatique mais mauvaise fabrication' },
      { emoji: '✅', titre: 'Si identique → étape suivante', desc: "Les verres correspondent au back-end, le problème vient d'ailleurs" },
    ],
    notesFormateur: [
      { icon: '🔬', title: 'Utilisation du frontofocométre', text: "Mesurer les deux verres séparément. Comparer sphère, cylindre et axe avec le back-end. Une inversion OD/OG est une erreur classique au montage — à vérifier en priorité." },
    ],
  },
  {
    id: 'raz-etape3',
    type: 'sav-content',
    color: '#f87171',
    icon: '📐',
    titre: 'Étape 3 — Prises de mesures & centrage',
    sousTitre: 'Hauteur et écarts pupillaires',
    points: [
      { emoji: '📏', titre: 'Unifocaux — Centre optique au frontofocométre', desc: "Le centre optique doit se trouver devant la pupille du client quand il porte la paire" },
      { emoji: '🔭', titre: 'Progressifs — Gravures + marqueur + ditest', desc: 'La croix obtenue = point de vision de loin → doit être juste devant la pupille' },
      { emoji: '🔧', titre: 'Si centrage incorrect → ajuster ou refabriquer', desc: "Ajuster la monture si possible — sinon refabrication avec les bonnes mesures" },
    ],
    notesFormateur: [
      { icon: '🎯', title: 'Progressifs : trouver le centre optique', text: "Expliquer oralement : trouver les gravures dans le verre (petits points gravés), marquer au ditest, tracer la croix avec le marqueur. La croix = vision de loin. La montrer sur le diffuseur avec des visuels. (Visuels à ajouter ultérieurement)" },
      { icon: '📐', title: 'Ajustage vs Refabrication', text: "Un léger décalage peut être corrigé en ajustant la monture (changer l'angle, remonter la paire). Si le décalage est trop important ou que la monture ne le permet pas, il faut refabriquer." },
    ],
  },
  {
    id: 'raz-etape4',
    type: 'sav-content',
    color: '#f87171',
    icon: '👁',
    titre: "Étape 4 — L'ordonnance & la règle d'or",
    sousTitre: 'Quand tout est conforme…',
    points: [
      { emoji: '🩺', titre: 'Tout est conforme → envoyer en examen de vue', desc: "Le problème vient sûrement de l'ordonnance — l'opticien trouvera certainement une correction différente" },
      { emoji: '🕶', titre: "Essayer en lunettes d'essai avant de relancer", desc: 'Faire valider la nouvelle correction au client avant toute refabrication' },
      { emoji: '⚠️', titre: "Règle d'or — Tout vérifier systématiquement", desc: "Même quand on a trouvé le problème, contrôler les autres éléments pour éviter la RAZ sur la RAZ" },
    ],
    notesFormateur: [
      { icon: '💬', title: 'Rassurer le client', text: "Ce n'est pas sa faute si sa correction a évolué. L'examen de vue est gratuit chez LPT. Le rassurer sur la prise en charge totale et sur le fait qu'on va tout refaire correctement." },
      { icon: '⚠️', title: "La règle d'or — insister dessus", text: "Même si on a trouvé l'erreur à l'étape 1 (saisie), on vérifie quand même les prises de mesures. On ne veut pas refabriquer et rappeler le client 3 semaines plus tard parce que les hauteurs n'étaient pas bonnes non plus." },
    ],
  },
  {
    id: 'raz-saisie-commentaire',
    type: 'sav-content',
    color: '#f87171',
    icon: '💬',
    titre: 'Saisir la RAZ — Le commentaire',
    sousTitre: 'Dans la commande problématique',
    points: [
      { emoji: '1️⃣', titre: "Ce qu'on recommande", desc: 'Ex : "RAZ verres" quand on recommande des verres seuls' },
      { emoji: '2️⃣', titre: 'Pourquoi on recommande', desc: 'Ex : "Erreur saisie correction" — la raison précise de la RAZ' },
      { emoji: '3️⃣', titre: "Ce qu'on a vérifié + ses initiales", desc: 'Ex : "Prises de mesures ok, corrections validées en lunettes d\'essai — QB"' },
    ],
    notesFormateur: [
      { icon: '📝', title: 'Le commentaire est capital', text: "La supervision vérifie le commentaire avant de donner le code de remise. Un commentaire incomplet ou absent = refus du code. Insister sur la rigueur et la signature avec ses initiales à la fin." },
    ],
  },
  {
    id: 'raz-saisie-litige',
    type: 'sav-content',
    color: '#f87171',
    icon: '📁',
    titre: 'Saisir la RAZ — Déclarer le litige',
    sousTitre: 'Onglet litige — en bas à gauche de la commande',
    points: [
      { emoji: '✔️', titre: 'La paire a-t-elle été fabriquée ?', desc: 'Indiquer l\'état de fabrication de la paire' },
      { emoji: '🎯', titre: 'Quel élément est concerné ?', desc: 'Les deux verres, un seul verre, la monture, toute la paire…' },
      { emoji: '📝', titre: "Nommer l'erreur parmi les choix proposés", desc: 'Ex : "Erreur prise de mesures" quand les mesures sont incorrectes' },
    ],
    notesFormateur: [
      { icon: '📊', title: 'Libellés standardisés', text: "Les noms de litige sont standardisés dans le système pour les statistiques nationales. Bien choisir le bon libellé — ne pas hésiter à demander à un manager si on hésite entre deux options." },
    ],
  },
  {
    id: 'raz-saisie-telephone',
    type: 'sav-content',
    color: '#f87171',
    icon: '📱',
    titre: 'Saisir la RAZ — La recommande téléphone',
    sousTitre: 'Téléphone de vente → onglet Recommande',
    points: [
      { emoji: '🔍', titre: 'Rechercher le numéro de commande', desc: 'Trouver la commande problématique dans le système' },
      { emoji: '✏️', titre: 'Apporter les modifications nécessaires', desc: 'Changer la correction, les mesures, le traitement… selon le problème trouvé' },
      { emoji: '🔗', titre: 'La commande SAV se rattache automatiquement', desc: "Elle apparaît dans \"Commandes liées\" de la commande d'origine sur l'ordinateur" },
    ],
    notesFormateur: [
      { icon: '🔗', title: 'Vérifier le rattachement', text: "Après avoir créé la recommande sur le téléphone, aller sur l'ordinateur vérifier qu'elle apparaît bien dans 'Commandes liées'. C'est à ce moment qu'on va coller le commentaire sur la commande SAV — AVANT d'appeler la supervision." },
    ],
  },
  {
    id: 'raz-saisie-supervision',
    type: 'sav-content',
    color: '#f87171',
    icon: '📞',
    titre: 'Saisir la RAZ — Appeler la supervision',
    sousTitre: "Avant d'appeler : coller le commentaire sur la recommande",
    points: [
      { emoji: '💬', titre: 'Coller le commentaire sur la commande SAV', desc: "Sur l'ordi → aller sur la recommande créée → coller le même commentaire" },
      { emoji: '📞', titre: 'Se présenter + donner le n° de commande', desc: "Prénom + magasin + raison de l'appel → numéro affiché sur l'écran téléphone" },
      { emoji: '0️⃣', titre: 'Saisir le code → 0€ → valider', desc: 'La commande passe à 0€ — valider et gérer la livraison' },
    ],
    notesFormateur: [
      { icon: '⚠️', title: "Commentaire AVANT l'appel", text: "La supervision peut demander à vérifier le commentaire sur la recommande. Toujours le coller AVANT d'appeler, sinon ils peuvent refuser de donner le code." },
      { icon: '📞', title: "Script d'appel", text: "Bonjour, c'est [Prénom] du magasin [Ville]. J'ai une commande SAV à passer à 0€, mon numéro de commande est le [numéro affiché sur le téléphone]." },
    ],
  },
  {
    id: 'raz-livraison',
    type: 'sav-content',
    color: '#f87171',
    icon: '🎯',
    titre: 'Après validation — La livraison',
    sousTitre: 'Deux cas possibles',
    points: [
      { emoji: '⚡', titre: '10 minutes → au laboratoire directement', desc: "Donner la paire au laboratoire pour qu'ils changent les verres sur place" },
      { emoji: '📦', titre: 'Commande → rendre la paire au client', desc: 'SMS à réception des verres → le client repasse → on fait le changement' },
    ],
    notesFormateur: [
      { icon: '⚡', title: '10 minutes', text: "S'assurer que le laboratoire est disponible avant de promettre une livraison rapide au client. Vérifier le stock de verres." },
      { icon: '📦', title: 'Commande', text: "Bien expliquer au client le délai estimé. Vérifier régulièrement la réception et ne pas oublier de contacter le client dès que les verres arrivent." },
    ],
  },
]

export const RAZ_QUIZ = []

export const MONTURES_QUIZ = [
  { type: 'text-open', question: 'Quelle est l\'origine de la matière première de l\'acétate de cellulose ?', hint: 'Pulpe de bois ou fibre de coton (pas du pétrole)' },
  { type: 'text-open', question: 'Comment ajuste-t-on une monture en acétate ? Quel élément ne peut PAS être ajusté ?', hint: 'À chaud (chaleur sèche) — le pont ne peut pas être ajusté en largeur' },
  { type: 'text-open', question: 'Citez un avantage et un inconvénient de la monture en acétate.', hint: 'Avantage : hypoallergénique, coloris variés, premium / Inconvénient : plus lourd que métal & injecté' },
  { type: 'text-open', question: 'Quel est le principal avantage du métal par rapport aux autres matériaux en termes de port ?', hint: 'Plus léger et plus fin — discret sur le visage' },
  { type: 'text-open', question: 'Comment ajuste-t-on une monture en métal ? Quels éléments sont réglables ?', hint: 'À froid — plaquettes et branches réglables' },
  { type: 'text-open', question: 'Quel risque allergique existe avec le métal ? Quelle solution proposons-nous ?', hint: 'Allergie au nickel — modèles en titane (sans nickel) disponibles' },
  { type: 'text-open', question: 'Comment est fabriquée une monture en plastique injecté ? Qu\'est-ce que cela implique pour le design ?', hint: 'Moulée en série dans un moule industriel — couleur uniforme, pas de veinage ni motif dans la masse' },
  { type: 'text-open', question: 'Quel type de client ciblez-vous avec une monture en plastique injecté ? Pourquoi ?', hint: 'Budget serré, enfants, clients qui cassent régulièrement — meilleur rapport qualité/prix de la gamme' },
]

export const MODULE_DATA = {
  'types-verres':     { pages: TYPES_VERRES_PAGES,      quiz: TYPES_VERRES_QUIZ,  label: 'Types de verres',               sub: 'Le verre unifocal' },
  'pdm':              { pages: PDM_PAGES,                quiz: PDM_QUIZ,           label: 'Prises de mesures',             sub: 'Écart pupillaire · Hauteur · LPTVISION' },
  'optique':          { pages: OPTIQUE_PAGES,            quiz: OPTIQUE_QUIZ,       label: "Les bases de l'optique",        sub: 'Troubles visuels · Corrections · Ordonnances' },
  'offres':           { pages: OFFRES_PAGES,              quiz: OFFRES_QUIZ,        label: 'Les offres',                    sub: 'Classique · 1=1 · Parcours LPT' },
  'entreprise':       { pages: ENTREPRISE_PAGES,         quiz: ENTREPRISE_QUIZ,    label: "Présentation de l'entreprise", sub: 'Mission · Histoire · Culture LPT' },
  'verre-progressif': { pages: PROGRESSIF_PAGES,         quiz: PROGRESSIF_QUIZ,    label: 'Le Verre Progressif',          sub: 'Anatomie · Vente · Objections · Quiz J+14' },
  'trame-accueil':    { pages: TRAME_ACCUEIL_PAGES,      quiz: [],                 label: "Trame d'accueil",              sub: 'Bonjour · Concept · Examen de vue' },
  'montures':         { pages: [{ id: 'acetate', type: 'montures-acetate' }, { id: 'metal', type: 'montures-metal' }, { id: 'injecte', type: 'montures-injecte' }], quiz: MONTURES_QUIZ, label: 'Connaissances Montures', sub: 'Acétate · Métal · Injecté' },
  'retraits':         { pages: RETRAITS_PAGES,   quiz: RETRAITS_QUIZ,   label: 'Les Retraits',      sub: 'SMS · Recherche · Essayage · Signature' },
  'ajustages':        { pages: AJUSTAGES_PAGES,  quiz: AJUSTAGES_QUIZ,  label: 'Les Ajustages',     sub: 'Confort · Acétate · Métal · Règles d\'or' },
  'raz':              { pages: RAZ_PAGES,        quiz: RAZ_QUIZ,        label: 'Les RAZ',            sub: 'Recommandes · Process · Dernier recours' },
  'quiz-final':       { pages: [], quiz: QUIZ_FINAL_QUESTIONS, label: 'Quiz de fin de formation', sub: 'Trame · Optique · Offres · Remboursement' },
  'quiz-j1':          { pages: [], quiz: QUIZ_J1, label: 'Quiz Jour 1', sub: 'Entreprise · Optique · Ordonnances · Montures' },
  'mutuelles-inami':  { pages: [
    { id: 'mutuelles-q1', type: 'pause', icon: '🛡️', titre: 'Que savez-vous des mutuelles ?', sousTitre: 'Partagez ce que vous savez déjà' },
    { id: 'mutuelles-reveal', type: 'mutuelles-reveal', titre: 'Les organismes assureurs en Belgique' },
    { id: 'inami-info', type: 'inami-info', titre: 'INAMI' },
    { id: 'partena-offre', type: 'partena-offre', titre: 'PARTENA' },
  ], quiz: [], label: 'Mutuelles et INAMI', sub: 'Remboursements · INAMI · Mutuelles belges' },
  'remboursement-france': { pages: [
    { id: 'rembfr-q1', type: 'pause', icon: '🇫🇷', titre: 'Quelles sont les conditions pour avoir droit au remboursement optique en France ?', sousTitre: 'Partagez ce que vous savez déjà' },
    { id: 'rembfr-conditions', type: 'rembfr-conditions', titre: 'Les conditions de remboursement' },
    { id: 'rembfr-demarche', type: 'rembfr-demarche', titre: 'Quand un client souhaite se faire rembourser je dois donc :' },
    { id: 'rembfr-supreme', type: 'rembfr-supreme', titre: 'Test Supreme' },
  ], quiz: [], label: 'Remboursement optique en France', sub: 'SS · Mutuelle · 100% Santé · Conditions' },
  'parcours-rembourses': { pages: [
    { id: 'parcours-offres', type: 'parcours-rembourses-offres', titre: 'Les offres remboursées' },
    { id: 'parcours-tiers-payant', type: 'parcours-tiers-payant', titre: 'C\'est quoi le tiers payant pour vous ?' },
    { id: 'tiers-payant-explication', type: 'tiers-payant-explication', titre: 'Comment fonctionne le tiers payant ?' },
  ], quiz: [], label: 'Les parcours remboursés', sub: 'Le Suprême · Le 1=1 · 100% Santé' },
  'lpt-sante': { pages: [
    { id: 'lpts-q1', type: 'lpt-sante-intro', titre: 'À quoi ça sert ?' },
    { id: 'lpts-explication', type: 'lpt-sante-explication', titre: 'Comment ça marche ?' },
    { id: 'lpts-pec', type: 'lpt-sante-pec', titre: 'La prise en charge' },
  ], quiz: [], label: 'LPT Santé', sub: 'Tiers payant · Remboursements' },
}

export const MUTUELLES_BELGIQUE = [
  {
    id: 'mc',
    nom: 'Mutualité chrétienne (MC)',
    type: 'Mutuelle',
    complementaire: true,
    montant: "Jusqu'à 120 €",
    frequence: 'Tous les 3 ans (ou 1×/an si Δ dioptrie ≥ 0,5)',
    particularites: "Sans prescription, tout âge, toute dioptrie. Sur base de la facture d'achat. Sous présentation d'une facture uniquement.",
  },
  {
    id: 'solidaris',
    nom: 'Solidaris (socialiste)',
    type: 'Mutuelle',
    complementaire: false,
    montant: '0 €',
    frequence: '/',
    particularites: 'Ne participe que pour son magasin participant (Point De Mire)',
  },
  {
    id: 'partena',
    nom: 'Mutualité Partena',
    type: 'Mutuelle',
    complementaire: true,
    montant: "Jusqu'à 75 €",
    frequence: 'Tous les 2 ans',
    particularites: "Achat chez opticien physique dans l'UE. Prescription non obligatoire si la facture mentionne la dioptrie.",
  },
  {
    id: 'neutre',
    nom: 'Mutualité neutre',
    type: 'Mutuelle',
    complementaire: true,
    montant: "24 à 120 € selon l'âge",
    frequence: 'Tous les 3 ans',
    particularites: "Sous présentation d'une prescription ophtalmologue.",
  },
  {
    id: 'liberale',
    nom: 'Mutualité libérale',
    type: 'Mutuelle',
    complementaire: false,
    montant: null,
    frequence: null,
    particularites: null,
  },
  {
    id: 'caami',
    nom: 'CAAMI',
    type: 'Organisme public',
    complementaire: false,
    montant: 'Aucun',
    frequence: '/',
    particularites: '/',
  },
]
