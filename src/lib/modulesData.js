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
    sousTitre: 'Avant de fabriquer les verres, il est essentiel de réaliser une prise de mesure afin de positionner précisément le centre optique du verre devant les yeux du client, pour garantir une vision confortable, nette et naturelle au quotidien.',
    icon: '👁️',
    points: [
      { emoji: '🎯', titre: 'Centrage optique', texte: "Chaque client a des yeux positionnés différemment — la mesure permet d'aligner le centre du verre exactement devant la pupille." },
      { emoji: '😌', titre: 'Confort visuel', texte: "Un verre mal centré provoque fatigue, maux de tête et flou — même avec une bonne correction optique." },
      { emoji: '✅', titre: 'Satisfaction garantie', texte: "Une prise de mesure précise = un client satisfait dès le premier port de ses lunettes." },
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

export const MODULE_DATA = {
  'types-verres': { pages: TYPES_VERRES_PAGES, quiz: TYPES_VERRES_QUIZ, label: 'Types de verres' },
  'pdm': { pages: PDM_PAGES, quiz: PDM_QUIZ, label: 'Prises de mesures' },
}
