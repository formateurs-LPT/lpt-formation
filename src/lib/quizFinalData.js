export const QUIZ_FINAL_QUESTIONS = [
  // ── Trame d'accueil ──────────────────────────────────────────────
  {
    question: "Quelle est la première phrase de la trame d'accueil chez LPT ?",
    options: [
      "Bonjour et bienvenue chez Lunettes Pour Tous",
      "Bonjour, vous avez votre ordonnance ?",
      "Bonjour, comment puis-je vous aider ?",
    ],
    correct: 0,
  },
  {
    question: "En fin de trame d'accueil, que propose-t-on systématiquement au client ?",
    options: [
      "Une remise sur les montures",
      "L'examen de vue gratuit et sans rendez-vous",
      "Un rendez-vous payant avec un opticien",
    ],
    correct: 1,
  },
  // ── L'entreprise ─────────────────────────────────────────────────
  {
    question: "En quelle année l'entreprise LPT a-t-elle été fondée ?",
    options: ["2010", "2018", "2014"],
    correct: 2,
  },
  {
    question: "Qui sont les fondateurs de LPT ?",
    options: [
      "Paul Morlet & Xavier Niel",
      "Pierre Dupont & Xavier Niel",
      "Paul Morlet & Bernard Arnault",
    ],
    correct: 0,
  },
  // ── Le concept ───────────────────────────────────────────────────
  {
    question: "Quel est le délai de fabrication des lunettes unifocales chez LPT ?",
    options: ["10 minutes", "24 heures", "9 jours"],
    correct: 0,
  },
  {
    question: "La promesse des 10 minutes est valable :",
    options: [
      "Seulement avec ordonnance",
      "Seulement sans ordonnance",
      "Avec ou sans ordonnance",
    ],
    correct: 2,
  },
  // ── Troubles visuels ─────────────────────────────────────────────
  {
    question: "La myopie affecte principalement :",
    options: [
      "La vision de loin",
      "La vision de près",
      "La perception des couleurs",
    ],
    correct: 0,
  },
  {
    question: "La presbytie est un trouble visuel lié à :",
    options: ["Un choc physique", "L'âge", "Une infection oculaire"],
    correct: 1,
  },
  {
    question: "L'astigmatisme provoque :",
    options: [
      "Une vision floue uniquement de loin",
      "Une vision déformée de loin et de près",
      "Une vision floue uniquement de près",
    ],
    correct: 1,
  },
  {
    question: "L'hypermétropie correspond à :",
    options: [
      "Voir flou à toutes distances — l'œil doit accommoder en permanence",
      "Voir flou uniquement de loin",
      "Ne pas distinguer les couleurs",
    ],
    correct: 0,
  },
  // ── Lecture d'ordonnance ─────────────────────────────────────────
  {
    question: "Sur une ordonnance, OD désigne :",
    options: ["L'oeil gauche", "L'oeil droit", "Les deux yeux"],
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
    options: ["Astigmatisme", "Hypermétropie", "Myopie"],
    correct: 1,
  },
  // ── Les offres ───────────────────────────────────────────────────
  {
    question: "Dans l'offre Classique, la première paire commence à :",
    options: ["10 euros", "1 euro", "29 euros"],
    correct: 0,
  },
  {
    question: "Le parcours 1=1, c'est :",
    options: [
      "Une paire à -50%",
      "Deux paires identiques offertes",
      "Première paire payante, deuxième paire gratuite (même niveau)",
    ],
    correct: 2,
  },
  {
    question: "Le Pack Plan, c'est :",
    options: [
      "2 paires sans correction, monture et traitement au choix pour 95 euros",
      "2 paires avec correction pour 95 euros",
      "4 paires au prix de 2",
    ],
    correct: 0,
  },
  {
    question: "Le parcours Supreme est possible :",
    options: [
      "Sans conditions particulières",
      "Uniquement en tiers payant complet",
      "Uniquement avec une ordonnance récente",
    ],
    correct: 1,
  },
  // ── Verre progressif ─────────────────────────────────────────────
  {
    type: 'qcm-multi',
    question: "Quel est le délai de fabrication d'un verre progressif chez LPT ?",
    instruction: "⚠ Sélectionne 2 bonnes réponses",
    options: ["10 minutes", "9 jours", "24 à 48 heures"],
    correct: [1, 2],
  },
  {
    question: "Le verre progressif est recommandé pour quel trouble visuel ?",
    options: ["La myopie simple", "La presbytie", "L'astigmatisme uniquement"],
    correct: 1,
  },
  {
    question: "Un verre progressif possède combien de zones de vision ?",
    options: ["1", "2", "3"],
    correct: 2,
  },
  // ── Remboursement ────────────────────────────────────────────────
  {
    question: "Pour bénéficier d'un remboursement optique, il faut :",
    options: [
      "Avoir une ordonnance valable ET une mutuelle ou la CSS",
      "Seulement avoir une mutuelle",
      "Seulement avoir une ordonnance valable",
    ],
    correct: 0,
  },
  {
    question: "A partir de quel âge le délai de renouvellement de lunettes passe à 2 ans ?",
    options: ["16 ans", "10 ans", "18 ans"],
    correct: 0,
  },
  {
    question: "Combien de temps est valable une ordonnance pour une personne de 30 ans ?",
    options: ["1 an", "3 ans", "5 ans"],
    correct: 2,
  },
  {
    question: "Chez LPT, le reste à charge après remboursement est de :",
    options: ["Variable selon la mutuelle", "50 euros", "0 euro"],
    correct: 2,
  },
  {
    question: "Le renouvellement adapté pour un patient de plus de 16 ans est possible :",
    options: ["Après 2 ans", "Après 1 an et 1 jour", "Sans délai"],
    correct: 1,
  },
  // ── Questions bonus (Q27 → Q30) ──────────────────────────────────
  {
    question: "Que signifie OG sur une ordonnance ?",
    options: ["Optique Globale", "Oeil Gauche", "Objectif Général"],
    correct: 1,
  },
  {
    question: "Parmi ces matières de montures, laquelle est l'entrée de gamme la plus abordable ?",
    options: ["Acétate", "Métal", "Injecté"],
    correct: 2,
  },
  {
    question: "La CSS (Complémentaire Santé Solidaire) remplace quel élément du remboursement ?",
    options: ["La Sécurité Sociale", "La mutuelle", "L'ordonnance"],
    correct: 1,
  },
  {
    question: "Comment LPT peut-il proposer des prix aussi bas que des lunettes à 10 € ?",
    options: [
      "Des verres de moindre qualité",
      "Zéro intermédiaire — achat direct fournisseurs et fabrication sur place",
      "Des subventions de l'État",
    ],
    correct: 1,
  },
]
