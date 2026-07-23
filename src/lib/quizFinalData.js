export const QUIZ_FINAL_QUESTIONS = [
  // ── Trame d'accueil ──────────────────────────────────────────────
  {
    question: "Quelle est la première phrase de la trame d'accueil chez Lunettes Pour Tous ?",
    options: [
      "Bonjour et bienvenue chez Lunettes Pour Tous",
      "Bonjour, vous avez votre ordonnance ?",
      "Bonjour, comment puis-je vous aider ?",
      "Bonjour, avez-vous déjà visité notre boutique ?",
    ],
    correct: 0,
  },
  {
    question: "En fin de trame d'accueil, que propose-t-on systématiquement au client ?",
    options: [
      "Une remise sur les montures",
      "L'examen de vue gratuit et sans rendez-vous",
      "Un rendez-vous payant avec un opticien",
      "Un essai de montures en boutique",
    ],
    correct: 1,
  },
  // ── L'entreprise ─────────────────────────────────────────────────
  {
    question: "En quelle année l'entreprise Lunettes Pour Tous a-t-elle été fondée ?",
    options: ["2010", "2016", "2018", "2014"],
    correct: 3,
  },
  {
    question: "Qui sont les fondateurs de Lunettes Pour Tous ?",
    options: [
      "Paul Morlet & Xavier Niel",
      "Pierre Dupont & Xavier Niel",
      "Paul Morlet & Bernard Arnault",
      "Xavier Niel & Arnaud Montebourg",
    ],
    correct: 0,
  },
  // ── Le concept ───────────────────────────────────────────────────
  {
    question: "Quel est le délai de fabrication des lunettes unifocales chez Lunettes Pour Tous ?",
    options: ["10 minutes", "24 heures", "3 jours", "9 jours"],
    correct: 0,
  },
  {
    question: "La promesse des 10 minutes est valable :",
    options: [
      "Seulement avec ordonnance",
      "Seulement sans ordonnance",
      "Uniquement pour les unifocaux sans correction forte",
      "Avec ou sans ordonnance",
    ],
    correct: 3,
  },
  // ── Troubles visuels ─────────────────────────────────────────────
  {
    question: "La myopie affecte principalement :",
    options: [
      "La vision de loin",
      "La vision de près",
      "La perception des couleurs",
      "La vision nocturne uniquement",
    ],
    correct: 0,
  },
  {
    question: "La presbytie est un trouble visuel lié à :",
    options: [
      "Un choc physique sur l'œil",
      "L'âge — le cristallin perd de sa souplesse",
      "Une infection oculaire",
      "Une carence en vitamine A",
    ],
    correct: 1,
  },
  {
    question: "L'astigmatisme provoque :",
    options: [
      "Une vision floue uniquement de loin",
      "Une vision déformée de loin et de près",
      "Une vision floue uniquement de près",
      "Une sensibilité accrue à la lumière",
    ],
    correct: 1,
  },
  {
    question: "L'hypermétropie correspond à :",
    options: [
      "Voir flou à toutes distances — l'œil doit accommoder en permanence",
      "Voir flou uniquement de loin",
      "Voir flou uniquement de près après 40 ans",
      "Ne pas distinguer les couleurs",
    ],
    correct: 0,
  },
  // ── Lecture d'ordonnance ─────────────────────────────────────────
  {
    question: "Sur une ordonnance, OD désigne :",
    options: [
      "L'oeil gauche",
      "L'oeil droit",
      "Les deux yeux",
      "La distance de lecture recommandée",
    ],
    correct: 1,
  },
  {
    type: 'qcm-ordonnance',
    question: "Quelles corrections sont indiquées sur cette ordonnance ?",
    ordonnance: {
      od: { sph: '-2,50', cyl: '-0,75', axe: '170°' },
      og: { sph: '-2,00', cyl: '-0,50', axe: '010°' },
    },
    options: [
      "Myopie + Astigmatisme",
      "Hypermétropie + Astigmatisme",
      "Presbytie + Myopie",
      "Presbytie seule",
    ],
    correct: 0,
  },
  {
    question: "Sur une ordonnance, la valeur ADD correspond à :",
    options: [
      "L'axe de l'astigmatisme",
      "La correction de la myopie",
      "La valeur ajoutée pour la vision de près (presbytie)",
      "La puissance totale du verre",
    ],
    correct: 2,
  },
  {
    type: 'qcm-ordonnance',
    question: "Quelle correction est indiquée sur cette ordonnance ?",
    ordonnance: {
      od: { sph: '+1,50' },
      og: { sph: '+1,25' },
    },
    options: ["Myopie", "Astigmatisme", "Hypermétropie", "Presbytie"],
    correct: 2,
  },
  // ── Les offres ───────────────────────────────────────────────────
  {
    question: "Dans l'offre Classique, la première paire commence à :",
    options: ["1 euro", "10 euros", "29 euros", "49 euros"],
    correct: 1,
  },
  {
    question: "Le parcours 1=1, c'est :",
    options: [
      "Une paire à -50 % du tarif normal",
      "Deuxième paire identique offerte sans conditions",
      "Deuxième paire offerte au même niveau de gamme",
      "Deux paires au prix d'une, verres uniquement",
    ],
    correct: 2,
  },
  {
    question: "Le Pack Plan, c'est :",
    options: [
      "2 paires sans correction, monture et traitement au choix pour 95 €",
      "2 paires avec correction pour 95 €",
      "1 paire avec correction premium pour 95 €",
      "4 paires au prix de 2 pour 95 €",
    ],
    correct: 0,
  },
  {
    question: "Le parcours Suprême est possible :",
    options: [
      "Sans conditions particulières, éligible à tous",
      "Uniquement en tiers payant complet",
      "Uniquement avec une ordonnance de moins de 6 mois",
      "Uniquement pour les clients de plus de 18 ans",
    ],
    correct: 1,
  },
  // ── Verre progressif ─────────────────────────────────────────────
  {
    type: 'qcm-multi',
    question: "Quel est le délai de fabrication d'un verre progressif chez Lunettes Pour Tous ?",
    instruction: "⚠ Sélectionne 2 bonnes réponses",
    options: ["10 minutes", "9 jours", "24 à 48 heures", "6 mois"],
    correct: [1, 2],
  },
  {
    question: "Le verre progressif est recommandé pour quel trouble visuel ?",
    options: [
      "La myopie simple",
      "La presbytie",
      "L'astigmatisme fort uniquement",
      "L'hypermétropie légère",
    ],
    correct: 1,
  },
  {
    question: "Un verre progressif possède combien de zones de vision ?",
    options: ["1 — une zone unique", "2 — loin et près", "3 — loin, intermédiaire et près", "4 — loin, intermédiaire, près et nocturne"],
    correct: 2,
  },
  // ── Remboursement ────────────────────────────────────────────────
  {
    question: "Pour bénéficier d'un remboursement optique, il faut :",
    options: [
      "Avoir une ordonnance valable ET une mutuelle ou la CSS",
      "Seulement avoir une mutuelle à jour",
      "Seulement avoir une ordonnance valable",
      "Avoir plus de 18 ans et une carte Vitale",
    ],
    correct: 0,
  },
  {
    question: "A partir de quel âge le délai de renouvellement de lunettes passe à 2 ans ?",
    options: ["10 ans", "14 ans", "16 ans", "18 ans"],
    correct: 2,
  },
  {
    question: "Combien de temps est valable une ordonnance pour une personne de 30 ans ?",
    options: ["1 an", "2 ans", "3 ans", "5 ans"],
    correct: 3,
  },
  {
    question: "Chez Lunettes Pour Tous, le reste à charge après remboursement complet est de :",
    options: ["Variable selon la mutuelle", "50 euros maximum", "100 euros maximum", "0 euro"],
    correct: 3,
  },
  {
    question: "Le renouvellement adapté pour un patient de plus de 16 ans est possible :",
    options: [
      "Sans délai, dès la première ordonnance",
      "Après 18 mois",
      "Après 1 an et 1 jour",
      "Après 2 ans",
    ],
    correct: 2,
  },
  // ── Questions bonus (Q27 → Q30) ──────────────────────────────────
  {
    question: "Que signifie OG sur une ordonnance ?",
    options: ["Optique Globale", "Objectif Général", "Oeil Gauche", "Oculaire Gauche"],
    correct: 2,
  },
  {
    question: "Parmi ces matières de montures, laquelle est l'entrée de gamme la plus abordable ?",
    options: ["Titane", "Acétate", "Métal", "Injecté"],
    correct: 3,
  },
  {
    question: "La CSS (Complémentaire Santé Solidaire) remplace quel élément du remboursement ?",
    options: [
      "La Sécurité Sociale",
      "La mutuelle complémentaire",
      "L'ordonnance de l'ophtalmologiste",
      "L'attestation de délivrance",
    ],
    correct: 1,
  },
  {
    question: "Comment Lunettes Pour Tous peut-il proposer des lunettes à partir de 10 € ?",
    options: [
      "Des verres de moindre qualité importés",
      "Des subventions de l'État",
      "Un réseau de production exclusivement en Asie",
      "Zéro intermédiaire — achat direct fournisseurs et fabrication sur place",
    ],
    correct: 3,
  },
  // ── Questions texte libre ─────────────────────────────────────────────
  {
    type: 'text-open',
    question: "Qui a fondé Lunettes Pour Tous ?",
    hint: "Paul Morlet & Xavier Niel (en 2014)",
  },
  {
    type: 'text-open',
    question: "Quels sont les 5 éléments qui nous permettent de faire des lunettes accessibles, en un temps record ?",
    hint: "Zéro intermédiaire, achat direct fournisseurs, fabrication sur place, large choix de montures, examen de vue gratuit et sans rendez-vous",
  },
  {
    type: 'text-open',
    question: "Donnez moi un élément qui me permet de reconnaître un presbyte sans ordonnance, sans lui parler.",
    hint: "Le client tient son téléphone / un document à bout de bras pour lire, ou porte des lunettes de lecture sur le nez",
  },
  {
    type: 'text-open',
    question: "Citez moi 2 arguments que nous devons mettre en avant pour vendre des verres progressifs à un client réticent.",
    hint: "Garantie adaptation 100 jours, large champ de vision 180°, zones de flou réduites, vision naturelle, fabrication en boutique (9 jours), financement possible",
  },
  {
    type: 'text-open',
    question: "Écrivez la trame d'accueil",
    hint: "Bonjour et bienvenue chez Lunettes Pour Tous, mon prénom est [...]. Avez-vous votre ordonnance ? Êtes-vous venu(e) avec votre mutuelle ? Avez-vous déjà effectué un examen de vue chez nous ?",
  },
]
