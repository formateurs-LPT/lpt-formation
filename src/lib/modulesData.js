export const TYPES_VERRES_QUIZ = [
  {
    question: 'Quel est le délai de fabrication du verre unifocal ?',
    options: ['9 jours', '10 minutes'],
    correct: 1,
  },
  {
    question: 'Où est la vision de près sur le verre progressif ?',
    options: ['En bas du verre', 'Au centre du verre', 'En haut du verre'],
    correct: 0,
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
  {
    id: 'progressif',
    titre: 'Le Verre Progressif',
    sousTitre: 'Trois zones, une liberté totale',
    points: [
      { emoji: '🔭', titre: 'Vision de loin', texte: 'Zone supérieure — conduite, cinéma, paysages. Nette à plus de 150 cm.' },
      { emoji: '💻', titre: 'Vision intermédiaire', texte: 'Zone centrale — écran, comptoir, rayon. De 40 cm à 150 cm.' },
      { emoji: '📖', titre: 'Vision de près', texte: 'Zone inférieure — lecture, smartphone, écriture. Moins de 40 cm.' },
      { emoji: '🏆', titre: 'Argument différenciant', texte: 'Extra-large 180° avec aberrations réduites. Garantie adaptation 100 jours.' },
    ],
    avatarScript: "Le progressif, c'est notre produit phare. Trois zones en un seul verre : loin, intermédiaire, près. Pas besoin de changer de lunettes. La garantie 100 jours enlève toute objection client.",
    color: '#7c3aed',
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

export const MODULE_DATA = {
  'types-verres': { pages: TYPES_VERRES_PAGES, quiz: TYPES_VERRES_QUIZ, label: 'Types de verres' },
  'pdm':          { pages: PDM_PAGES,          quiz: PDM_QUIZ,          label: 'Prises de mesures' },
  'optique':      { pages: OPTIQUE_PAGES,      quiz: OPTIQUE_QUIZ,      label: "Les bases de l'optique" },
  'offres':       { pages: [],                 quiz: OFFRES_QUIZ,       label: 'Les offres' },
  'entreprise':   { pages: ENTREPRISE_PAGES,   quiz: ENTREPRISE_QUIZ,   label: "Présentation de l'entreprise" },
}

export const ENTREPRISE_QUIZ = [
  {
    question: "En quelle année a ouvert le 1er magasin Lunettes Pour Tous ?",
    options: ['2010', '2012', '2014'],
    correct: 2,
  },
  {
    question: "Quel est le délai de fabrication pour 90% des clients LPT ?",
    options: ['10 minutes', '24 heures', '3 jours'],
    correct: 0,
  },
  {
    question: "Combien LPT compte-t-il de magasins en 2025 ?",
    options: ['18 magasins', '32 magasins', '45 magasins'],
    correct: 1,
  },
  {
    question: "Quelle est la fourchette de prix des montures LPT ?",
    options: ['50€ à 200€', '5€ à 90€', '30€ à 150€'],
    correct: 1,
  },
  {
    question: "Quelle est la mission fondatrice de LPT ?",
    options: ["Vendre le maximum de lunettes", "Rendre la vue accessible à tous", "Être le leader mondial de l'optique"],
    correct: 1,
  },
]

export const ENTREPRISE_PAGES = [
  {
    id: 'bienvenue',
    type: 'impact',
    titre: 'Bienvenue chez Lunettes Pour Tous',
    sousTitre: "Vous ne rejoignez pas une entreprise. Vous rejoignez une mission.",
    color: '#00abe9',
    videoPlaceholder: "Vidéo d'ouverture — magasins, équipes, clients",
    points: [
      { emoji: '🎯', titre: 'La mission', texte: "Rendre la vue accessible à tous — depuis 2014." },
      { emoji: '👥', titre: '+1000 collaborateurs', texte: "Une équipe soudée autour d'une conviction : voir correctement ne devrait jamais être un luxe." },
      { emoji: '🏪', titre: '32 magasins', texte: "27 en France · 5 en Belgique · et l'aventure continue." },
    ],
    avatarScript: "Bienvenue chez Lunettes Pour Tous. Je m'appelle Paul Morlet, co-fondateur. Aujourd'hui, vous ne rejoignez pas simplement une entreprise. Vous rejoignez une mission : rendre la vue accessible à tous.",
  },
  {
    id: 'probleme',
    type: 'probleme',
    titre: 'Le problème que LPT est venu résoudre',
    sousTitre: "En 2014, l'optique traditionnelle avait un vrai problème.",
    color: '#ef4444',
    points: [
      { emoji: '💸', titre: 'Prix inaccessibles', texte: "Une paire correctrice coûtait en moyenne 400 à 600€. Des centaines de milliers de personnes renonçaient à s'équiper." },
      { emoji: '⏳', titre: 'Délais importants', texte: "10 jours à 3 semaines d'attente en moyenne. Une attente incompréhensible." },
      { emoji: '🔄', titre: 'Parcours complexe', texte: "Ordonnance, opticien, labo, retrait… Un circuit trop long, trop opaque." },
      { emoji: '❌', titre: 'Accès inégal', texte: "Les personnes modestes avaient souvent des lunettes inadaptées — ou pas de lunettes du tout." },
    ],
    avatarScript: "Avant LPT, l'optique était inaccessible. Une paire correctrice coûtait facilement 400 à 600 euros. Les délais dépassaient les 10 jours. Et beaucoup de gens renonçaient simplement à voir correctement. Et si on pouvait faire autrement ?",
  },
  {
    id: 'naissance',
    type: 'timeline',
    titre: 'La naissance de LPT',
    sousTitre: "En 2014, une idée simple : voir correctement ne devrait jamais être un luxe.",
    color: '#00abe9',
    timeline: [
      { year: '2014', label: '1er magasin Paris', detail: "Promesse : lunettes en 10 minutes." },
      { year: '2015–2021', label: 'Déploiement national', detail: "Lyon, Bordeaux, Marseille, Lille, Toulouse…" },
      { year: '2022', label: 'Ouverture en Belgique', detail: "Bruxelles, Liège." },
      { year: '2023–2024', label: 'Atelier Paris · OFG', detail: "Certification Origine France Garantie." },
      { year: '2025', label: '32 magasins · +1000 collab.', detail: "L'aventure continue." },
    ],
    points: [
      { emoji: '🏪', titre: '2014 — 1er magasin', texte: "Paris — lunettes en 10 minutes." },
      { emoji: '🇫🇷', titre: '2015–2021 — Déploiement', texte: "Lyon, Bordeaux, Marseille, Lille…" },
      { emoji: '🇧🇪', titre: '2022 — Belgique', texte: "Bruxelles, Liège." },
      { emoji: '🚀', titre: '2025 — Aujourd\'hui', texte: "32 magasins · +1000 collaborateurs." },
    ],
    avatarScript: "En 2014, nous nous sommes posé une question simple : pourquoi attendre 10 jours pour voir correctement ? Le premier magasin ouvre à Paris. La réponse des clients est immédiate. Aujourd'hui : 32 magasins, plus de 1000 collaborateurs, et on ne s'arrête pas là.",
  },
  {
    id: 'piliers',
    type: 'piliers',
    titre: 'Notre modèle — 3 piliers différenciants',
    sousTitre: "Ce qui rend LPT unique dans le secteur de l'optique.",
    color: '#16a34a',
    points: [
      { emoji: '💰', titre: 'Prix', texte: "Montures de 5€ à 90€ — bien en dessous du marché traditionnel. Aucun intermédiaire, circuit direct." },
      { emoji: '⚡', titre: 'Délai 10 min', texte: "Pour 90% des clients — verres en stock, machines en magasin, zéro attente." },
      { emoji: '🤝', titre: 'Inclusion', texte: "Tous traitements inclus · Partenaire toutes mutuelles · 100% Santé disponible." },
    ],
    avatarScript: "Notre modèle repose sur trois piliers. Le prix d'abord : montures à partir de 5€. La rapidité : 10 minutes pour 90% de nos clients. Et l'inclusion : tous traitements inclus, partenaires de toutes les mutuelles. Ces trois piliers, c'est notre ADN.",
  },
  {
    id: 'fabrication',
    type: 'steps',
    titre: 'Des lunettes en 10 minutes — comment ?',
    sousTitre: "Ce n'est pas de la magie. C'est de la technologie et du savoir-faire.",
    color: '#f59e0b',
    videoPlaceholder: 'Vidéo immersive Inside La Fabrique à venir',
    steps: [
      { num: 1, emoji: '📋', titre: 'Commande', texte: "Validation sur LPT Santé — monture + correction saisies." },
      { num: 2, emoji: '🔍', titre: 'Sélection du verre', texte: "Le bon verre en stock est identifié et sorti." },
      { num: 3, emoji: '⚙️', titre: 'Taillage MEI', texte: "La machine MEI taille le verre à la forme exacte de la monture." },
      { num: 4, emoji: '🔧', titre: 'Montage', texte: "Le monteur assemble verre et monture avec précision." },
      { num: 5, emoji: '🔬', titre: 'Contrôle qualité', texte: "La correction est vérifiée au frontofocométre." },
      { num: 6, emoji: '🎁', titre: 'Livraison client', texte: "Le client repart équipé — 10 minutes chrono." },
    ],
    points: [
      { emoji: '⚙️', titre: 'Commande → Sélection', texte: "Validation LPT Santé · bon verre identifié en stock." },
      { emoji: '🔧', titre: 'Taillage → Montage', texte: "Machine MEI · assemblage par le monteur." },
      { emoji: '✅', titre: 'Contrôle → Livraison', texte: "Frontofocométre · client équipé en 10 min chrono." },
    ],
    avatarScript: "Voilà comment on tient la promesse des 10 minutes. Commande validée sur LPT Santé, verre sélectionné en stock, taillage par la MEI, montage, contrôle au frontofocométre, et le client repart. Six étapes, dix minutes. C'est notre force.",
  },
  {
    id: 'machines',
    type: 'machines',
    titre: 'Les machines qui font la différence',
    sousTitre: "Notre technologie est notre fierté — et votre meilleur argument.",
    color: '#7c3aed',
    videoPlaceholder: 'Mini vidéos machines à venir (MEI, LPTVISION, frontofocométre)',
    points: [
      { emoji: '⚙️', titre: 'La MEI', texte: "Meuleuse de précision — taille les verres à la forme exacte de la monture en quelques secondes, au dixième de mm." },
      { emoji: '📱', titre: 'LPTVISION', texte: "Notre app de prise de mesures intégrée — remplace la prise à la main, plus précise, plus reproductible, obligatoire sur chaque vente." },
      { emoji: '🔭', titre: 'Le frontofocométre', texte: "Contrôle la correction du verre monté — garantit la conformité à l'ordonnance avant remise au client." },
    ],
    avatarScript: "Nos machines sont ce qui nous permet de tenir notre promesse. La MEI taille avec une précision au dixième de millimètre. LPTVISION supprime les erreurs de mesure. Et le frontofocométre garantit que chaque verre est parfaitement conforme. Ce n'est pas de la magie — c'est de la technologie.",
  },
  {
    id: 'impact-client',
    type: 'cases',
    titre: 'Ce que tu apportes au client',
    sousTitre: "Tu ne vends pas seulement des lunettes. Tu aides les gens à retrouver leur autonomie.",
    color: '#db2777',
    cases: [
      { emoji: '🎓', prenom: 'Léa', age: '22 ans', contexte: "Étudiante, budget limité.", sans: "Elle renonçait à ses lunettes depuis 2 ans.", avec: "LPT lui permet de s'équiper à 0€ en 100% Santé." },
      { emoji: '👴', prenom: 'Michel', age: '58 ans', contexte: "Presbyte, ne peut plus lire correctement.", sans: "Sans LPT, un progressif était hors de budget.", avec: "LPT lui offre un progressif nouvelle génération avec remboursement mutuelle." },
      { emoji: '👓', prenom: 'Sophie', age: '35 ans', contexte: "A cassé ses lunettes ce matin.", sans: "Elle avait une réunion importante à 14h.", avec: "Chez LPT, elle repart équipée en 10 minutes — à temps." },
    ],
    points: [
      { emoji: '🎓', titre: 'Léa — étudiante', texte: "Renonçait à ses lunettes depuis 2 ans. LPT : 0€ en 100% Santé." },
      { emoji: '👴', titre: 'Michel — presbyte', texte: "Progressif inaccessible ailleurs. LPT : progressif remboursé mutuelle." },
      { emoji: '👓', titre: 'Sophie — urgence', texte: "Lunettes cassées le matin. LPT : équipée en 10 min, à temps pour sa réunion." },
    ],
    avatarScript: "Chaque client qui entre a une histoire. Léa qui ne voyait plus correctement depuis 2 ans faute de budget. Michel qui ne peut plus lire. Sophie dont les lunettes ont cassé ce matin. Sans LPT, leur quotidien est diminué. Avec vous, il change. C'est ça, votre métier.",
  },
  {
    id: 'visages',
    type: 'visages',
    titre: 'Les visages de LPT',
    sousTitre: "Peu importe d'où tu viens. Ce qui compte, c'est ce que tu vas construire ici.",
    color: '#0891b2',
    profils: [
      { emoji: '🛍️', metier: 'Retail', message: "Le contact client, la gestion de l'achalandage, le conseil produit — tout s'applique." },
      { emoji: '🍽️', metier: 'Restauration', message: "Service, rapidité, gestion du stress sous pression — des compétences de terrain qui paient." },
      { emoji: '👕', metier: 'Textile / Mode', message: "Vente, image produit, argumentation — une transition naturelle vers l'optique." },
      { emoji: '🎓', metier: 'Étudiant / Reconversion', message: "La formation LPT donne toutes les clés — zéro prérequis en optique nécessaire." },
    ],
    points: [
      { emoji: '🛍️', titre: 'Retail & Restauration', texte: "Contact client, service, rapidité — des compétences directement transférables." },
      { emoji: '🎓', titre: 'Toutes formations', texte: "La formation LPT donne toutes les clés. Zéro prérequis en optique nécessaire." },
      { emoji: '💬', titre: 'Paul Morlet', texte: "\"Peu importe ton parcours. Ce qui compte, c'est ton envie de bien faire.\"" },
    ],
    avatarScript: "Chez LPT, nos équipes viennent de partout. Du retail, de la restauration, du textile, d'études diverses. Moi-même j'étais électricien avant de créer LPT. Ce qui compte, ce n'est pas d'où tu viens. C'est ton envie de bien faire et ce que tu vas construire ici.",
  },
  {
    id: 'croissance',
    type: 'croissance',
    titre: "L'aventure ne fait que commencer",
    sousTitre: "10 ans de croissance · Une ambition intacte.",
    color: '#16a34a',
    stats: [
      { value: '2014', label: 'Fondation' },
      { value: '32', label: 'Magasins' },
      { value: '+1000', label: 'Collaborateurs' },
      { value: '2 pays', label: 'France · Belgique' },
    ],
    points: [
      { emoji: '📈', titre: '10 ans de croissance', texte: "De 1 à 32 magasins. De 0 à +1000 collaborateurs." },
      { emoji: '🌍', titre: 'Présence internationale', texte: "27 magasins en France · 5 en Belgique · d'autres marchés en vue." },
      { emoji: '🔮', titre: 'Projets futurs', texte: "Nouvelles ouvertures, nouvelles technologies. L'aventure ne fait que commencer." },
    ],
    avatarScript: "En 10 ans, LPT est passé d'une idée à 32 magasins et plus de 1000 collaborateurs. Ce n'est pas seulement une réussite commerciale. C'est la preuve que notre mission répond à un vrai besoin. Et vous arrivez au bon moment — l'aventure ne fait que commencer.",
  },
  {
    id: 'mission-finale',
    type: 'mission',
    titre: 'Ta mission commence aujourd\'hui',
    sousTitre: "Tu participes à rendre la vue accessible à tous.",
    color: '#00abe9',
    temoignages: [
      { quote: '"Je peux conduire ce soir."', context: 'Un client presbyte équipé de progressifs' },
      { quote: '"Je peux travailler demain."', context: 'Un salarié dont les lunettes étaient cassées' },
      { quote: '"Je peux lire à nouveau."', context: "Un retraité équipé grâce au 100% Santé" },
    ],
    points: [
      { emoji: '🚗', titre: '"Je peux conduire ce soir."', texte: 'Un client presbyte équipé de progressifs grâce à toi.' },
      { emoji: '💼', titre: '"Je peux travailler demain."', texte: 'Un salarié dont les lunettes étaient cassées — équipé en 10 min.' },
      { emoji: '📖', titre: '"Je peux lire à nouveau."', texte: 'Un retraité équipé grâce au 100% Santé à 0€.' },
    ],
    avatarScript: "Je peux conduire ce soir. Je peux travailler demain. Je peux lire à nouveau. Ce sont les mots de vos futurs clients. Chaque jour, vous allez transformer des vies. Tu ne rejoins pas seulement une entreprise. Tu participes à rendre la vue accessible à tous. Bienvenue dans la famille LPT.",
  },
]
