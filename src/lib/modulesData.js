export const TYPES_VERRES_QUIZ = [
  {
    question: 'Quel est le délai de fabrication du verre unifocal ?',
    options: ['9 jours', '10 minutes'],
    correct: 1,
  },
]

export const TYPES_VERRES_PAGES = [
  {
    id: 'unifocal',
    titre: 'Le Verre Unifocal',
    sousTitre: 'La correction simple, efficace, accessible',
    points: [
      { emoji: '🎯', titre: 'Une seule correction', texte: 'Corrige un seul défaut visuel : myopie, hypermétropie ou astigmatisme.' },
      { emoji: '👁️', titre: 'Pour qui ?', texte: 'Clients non presbytes, ou presbytes souhaitant des verres dédiés à une seule distance (lecture ou écran).' },
      { emoji: '💡', titre: 'Avantage clé', texte: 'Vision nette sur toute la surface du verre — sans zone de flou.' },
      { emoji: '💰', titre: 'Dans notre offre', texte: 'Proposé en 100% Santé (0€) ou en offre 1=1. Idéal pour une première paire.' },
    ],
    avatarScript: "Le verre unifocal corrige un seul défaut visuel. Toute la surface est homogène : pas de zone de flou, une vision nette partout. C'est le verre le plus courant, idéal pour une première paire.",
    color: '#00abe9',
  },
]

export const PDM_PAGES = [
  {
    id: 'pourquoi',
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
      { num: '01', nom: 'Myope',        def: 'Voit bien de près, flou de loin.',                                     color: '#00abe9' },
      { num: '02', nom: 'Hypermétrope', def: 'Flou à toutes distances, force constamment pour voir net.',             color: '#7c3aed' },
      { num: '03', nom: 'Astigmate',    def: 'Vision déformée à toutes distances.',                                   color: '#f59e0b' },
      { num: '04', nom: 'Presbyte',     def: 'Vision floue de près à partir de 40-45 ans.',                          color: '#22c55e' },
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
    options: ['Hypermétropie', 'Presbytie', 'Myopie'],
    correct: 2,
  },
  {
    question: 'Comment reconnaît-on une hypermétropie sur une ordonnance ?',
    options: ['La sphère est négative', 'La sphère est positive', 'Il y a toujours une addition'],
    correct: 1,
  },
  {
    question: "Quelle est la particularité de la vision de l'astigmate ?",
    options: ['Flou uniquement de loin', 'Flou uniquement de près', 'Vision déformée à toutes les distances'],
    correct: 2,
  },
  {
    question: 'À partir de quel âge apparaît généralement la presbytie ?',
    options: ['30-35 ans', '40-45 ans', '55-60 ans'],
    correct: 1,
  },
  {
    question: 'De combien évolue une correction entre chaque cran en optique ?',
    options: ['0,50 dioptrie', '0,25 dioptrie', '1,00 dioptrie'],
    correct: 1,
  },
  {
    question: 'Sur une ordonnance, une sphère négative (ex : −2,00) indique…',
    options: ['Une myopie', 'Une hypermétropie', 'Un astigmatisme'],
    correct: 0,
  },
  {
    question: 'À quoi correspond la colonne "Cylindre" sur une ordonnance ?',
    options: ['La correction de la presbytie', 'La correction de base de la vision', "La correction de l'astigmatisme"],
    correct: 2,
  },
  {
    question: "Dans quelle plage se situe la valeur de l'Axe sur une ordonnance ?",
    options: ['De 0° à 90°', 'De 0° à 180°', 'De 0° à 360°'],
    correct: 1,
  },
  {
    question: 'La colonne "Addition" sur une ordonnance concerne…',
    options: ['Tous les clients avec cylindre', 'Uniquement les presbytes', 'Les myopes forts uniquement'],
    correct: 1,
  },
  {
    question: 'OD : Sph −3,00 / Cyl −1,00 / Axe 20° — Quels sont les troubles visuels de cette correction ?',
    options: ['Myopie uniquement', 'Myopie + Astigmatisme', 'Hypermétropie + Astigmatisme'],
    correct: 1,
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

export const ENTREPRISE_QUIZ = []

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
      { value: '32',           label: 'magasins en France',             color: '#00abe9' },
      { value: 'France & Belgique', label: 'présence géographique',     color: '#4ade80' },
      { value: '+1 000',       label: 'collaborateurs',                  color: '#f59e0b' },
      { value: 'Des milliers', label: 'de clients équipés chaque jour', color: '#a78bfa' },
      { value: '10 minutes',   label: 'la promesse LPT',                color: '#f472b6' },
    ],
  },
  {
    id: 'ventes-opticien',
    type: 'ventes-opticien',
    titre: 'À votre avis, un opticien traditionnel vend combien de paires par jour ?',
    color: '#a78bfa',
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
      { label: 'Des stocks de verres et montures dans chacun de nos magasins', color: '#00abe9' },
      { label: 'Des machines à la pointe de la technologie', color: '#4ade80' },
      { label: 'Volume de ventes conséquent', color: '#f59e0b' },
      { label: 'Notre propre marque', color: '#a78bfa' },
      { label: '0 intermédiaire', color: '#f472b6' },
    ],
  },
]

export const MODULE_DATA = {
  'types-verres': { pages: TYPES_VERRES_PAGES, quiz: TYPES_VERRES_QUIZ, label: 'Types de verres',               sub: 'Le verre unifocal' },
  'pdm':          { pages: PDM_PAGES,          quiz: PDM_QUIZ,          label: 'Prises de mesures',             sub: 'Écart pupillaire · Hauteur · LPTVISION' },
  'optique':      { pages: OPTIQUE_PAGES,      quiz: OPTIQUE_QUIZ,      label: "Les bases de l'optique",        sub: 'Troubles visuels · Corrections · Ordonnances' },
  'offres':       { pages: [],                 quiz: OFFRES_QUIZ,       label: 'Les offres',                    sub: '100% Santé · Offres LPT · Mutuelles' },
  'entreprise':   { pages: ENTREPRISE_PAGES,   quiz: ENTREPRISE_QUIZ,   label: "Présentation de l'entreprise", sub: 'Mission · Histoire · Culture LPT' },
}
