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

export const OFFRES_PAGES = [
  { id: 'classique',  type: 'offres-classique', color: '#00abe9' },
  { id: 'un-pour-un', type: 'offres-1-1',       color: '#c9a227' },
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
      { label: 'Des machines à la pointe de la technologie', color: '#4ade80', video: '/assets/V2%20machines.mp4' },
      { label: 'Volume de ventes conséquent', color: '#f59e0b', animation: 'counter', counters: [
        { value: 5000, unit: 'paires vendues par jour', sub: 'sur tout le réseau LPT', delay: 0 },
        { value: 1000000, unit: 'paires vendues en 2025', sub: "et ça continue…", delay: 2400 },
      ]},
      { label: 'Notre propre marque', color: '#a78bfa', video: '/assets/D%C3%A9tails%20fabrication%20montures.mp4' },
      { label: '0 intermédiaire', color: '#f472b6', video: null },
    ],
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

export const MODULE_DATA = {
  'types-verres':     { pages: TYPES_VERRES_PAGES,      quiz: TYPES_VERRES_QUIZ,  label: 'Types de verres',               sub: 'Le verre unifocal' },
  'pdm':              { pages: PDM_PAGES,                quiz: PDM_QUIZ,           label: 'Prises de mesures',             sub: 'Écart pupillaire · Hauteur · LPTVISION' },
  'optique':          { pages: OPTIQUE_PAGES,            quiz: OPTIQUE_QUIZ,       label: "Les bases de l'optique",        sub: 'Troubles visuels · Corrections · Ordonnances' },
  'offres':           { pages: OFFRES_PAGES,              quiz: OFFRES_QUIZ,        label: 'Les offres',                    sub: 'Classique · 1=1 · Parcours LPT' },
  'entreprise':       { pages: ENTREPRISE_PAGES,         quiz: ENTREPRISE_QUIZ,    label: "Présentation de l'entreprise", sub: 'Mission · Histoire · Culture LPT' },
  'verre-progressif': { pages: PROGRESSIF_PAGES,         quiz: PROGRESSIF_QUIZ,    label: 'Le Verre Progressif',          sub: 'Anatomie · Vente · Objections · Quiz J+14' },
  'trame-accueil':    { pages: TRAME_ACCUEIL_PAGES,      quiz: [],                 label: "Trame d'accueil",              sub: 'Bonjour · Concept · Examen de vue' },
  'montures':         { pages: [{ id: 'acetate', type: 'montures-acetate' }, { id: 'metal', type: 'montures-metal' }, { id: 'injecte', type: 'montures-injecte' }], quiz: [], label: 'Connaissances Montures', sub: 'Acétate · Métal · Injecté' },
}
