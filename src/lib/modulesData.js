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
    id: 'intro',
    titre: 'LPTVISION',
    sousTitre: "L'outil indispensable pour chaque prise de mesure",
    points: [
      { emoji: '📱', titre: 'App interne LPT', texte: "LPTVISION remplace la prise à la main — plus précise, plus rapide." },
      { emoji: '🎯', titre: 'Chaque vente, sans exception', texte: "Aucune mesure à la main. L'app est l'unique référence." },
      { emoji: '⚠️', titre: "Pourquoi c'est crucial", texte: "Une mauvaise mesure = un verre mal taillé = un client insatisfait." },
    ],
    avatarScript: "LPTVISION est notre outil de prise de mesure intégré. Il remplace totalement la prise à la main. C'est rapide, précis, et obligatoire sur chaque vente.",
    color: '#f59e0b',
    image: '/assets/lptvision-tangentes.png',
  },
  {
    id: 'etape1-client',
    titre: 'Étape 1 — Le client',
    sousTitre: 'Une bonne position = une mesure juste',
    points: [
      { emoji: '🧍', titre: 'Position naturelle', texte: "Debout, bien droit." },
      { emoji: '👁️', titre: 'Regard naturel', texte: "Fixe l'objectif de l'app, sans forcer ni tourner la tête." },
      { emoji: '❌', titre: 'À éviter', texte: "Client penché, tête tournée ou regard dévié = mesure erronée." },
    ],
    avatarScript: "Le client doit être debout, bien droit, dans sa position naturelle. Son regard doit fixer l'objectif sans forcer. Un client qui se penche ou tourne la tête fausse immédiatement la mesure.",
    color: '#f59e0b',
  },
  {
    id: 'etape2-monture',
    titre: 'Étape 2 — La monture',
    sousTitre: 'Une monture mal placée = mesures faussées',
    points: [
      { emoji: '👓', titre: 'Bien droite sur le nez', texte: "Branches parallèles au sol, pas de torsion." },
      { emoji: '🔧', titre: 'Ajustez si nécessaire', texte: "Vérifiez et ajustez la monture avant de lancer l'app." },
      { emoji: '❌', titre: 'À éviter', texte: "Monture tordue, penchée ou mal placée sur le nez." },
    ],
    avatarScript: "Avant de mesurer, vérifiez toujours que la monture est bien droite. Branches parallèles, pas de torsion. Si elle est mal positionnée, ajustez-la. C'est une étape que beaucoup oublient.",
    color: '#f59e0b',
  },
  {
    id: 'etape3-position',
    titre: 'Étape 3 — Votre position',
    sousTitre: "Vous êtes l'objectif — soyez bien en face",
    points: [
      { emoji: '📏', titre: 'Environ 1 mètre', texte: "Ni trop loin, ni trop près — la distance idéale pour l'app." },
      { emoji: '🎯', titre: 'Face aux yeux', texte: "L'objectif doit être à la même hauteur que les yeux du client." },
      { emoji: '❌', titre: 'À éviter', texte: "Angle de côté, trop penché, ou distance incorrecte." },
    ],
    avatarScript: "Placez-vous à environ 1 mètre, face au client. L'objectif doit être à la hauteur de ses yeux, bien centré. Pas d'angle, pas de biais. Vous êtes la caméra — soyez stable et en face.",
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
