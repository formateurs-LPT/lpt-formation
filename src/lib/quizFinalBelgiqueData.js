export const QUIZ_FINAL_QUESTIONS_BELGIQUE = [
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
    type: 'text-open',
    question: "Qui sont les fondateurs de Lunettes Pour Tous ?",
    hint: "Paul Morlet & Xavier Niel",
  },
  // ── Le concept ───────────────────────────────────────────────────
  {
    question: "Quel est le délai de fabrication des lunettes unifocales chez Lunettes Pour Tous ?",
    options: ["10 minutes", "24 heures", "3 jours", "9 jours"],
    correct: 0,
  },
  {
    type: 'text-open',
    question: "Dans quelles situations la promesse des 10 minutes ne s'applique-t-elle pas ?",
    hint: "Verres progressifs (fabrication en 9 jours) et fortes corrections nécessitant un verre hors stock (24 à 48h)",
  },
  // ── Troubles visuels ─────────────────────────────────────────────
  {
    type: 'text-open',
    question: "La myopie affecte principalement quelle vision ?",
    hint: "La vision de loin",
  },
  {
    question: "La presbytie est un trouble visuel lié à :",
    options: [
      "Un choc physique sur l'œil",
      "L'âge",
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
    hideLabels: true,
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
      "Deuxième paire offerte, de même qualité que la première",
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
    question: "Le remboursement par l'assurance obligatoire n'est possible qu'avec :",
    options: [
      "Une ordonnance ophtalmologue",
      "Un examen de vue par un opticien",
      "Une ordonnance ophtalmologue datée de moins de 6 mois",
    ],
    correct: 2,
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
    type: 'text-open',
    question: "Un verre progressif possède combien de zones de vision ?",
    hint: "3 — loin, intermédiaire et près",
  },
  // ── Remboursement (Belgique — INAMI / mutuelles) ──────────────────
  {
    question: "Pour bénéficier d'un remboursement optique, il faut :",
    options: [
      "Avoir une mutuelle valable",
      "Avoir plus de 18 ans",
      "Avoir le CPAS",
      "Avoir un Syndicat",
    ],
    correct: 0,
  },
  {
    type: 'text-open',
    question: "Pour l'assurance obligatoire, quelle tranche d'âge faut-il avoir pour que le délai de renouvellement de lunettes soit d'une fois tous les 2 ans ?",
    hint: "Jusqu'à 18 ans",
  },
  {
    question: "Quelle mutuelle rembourse jusqu'à 75 € dans l'assurance complémentaire ?",
    options: ["Chrétienne", "Neutre", "Partenamut", "CAAPAC"],
    correct: 2,
  },
  {
    type: 'text-open',
    question: "Avec Partenamut, à combien revient une paire de lunettes progressive pour un client éligible au tiers payant ?",
    hint: "100 €",
  },
  {
    question: "Le remboursement anticipé pour l'assurance obligatoire est possible :",
    options: [
      "Dès un nouveau changement de correction d'au moins 0,50 de dioptries",
      "Dès un changement de correction d'au moins 0,50 avec ordonnance de moins de 6 mois",
      "Avec une ordonnance de moins de 6 mois uniquement",
      "Dès un changement de correction avec une ordonnance de moins de 6 mois",
    ],
    correct: 1,
  },
  // ── Questions bonus (Q27 → Q30) ──────────────────────────────────
  {
    question: "Qu'est-ce que l'inami ?",
    options: [
      "Celui qui fixe les règles de remboursement optique",
      "Celui qui rembourse les grosses correction",
      "Une mutuelle",
      "Une assurance",
    ],
    correct: 0,
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
    type: 'text-open-multi',
    fields: 5,
    question: "Quels sont les 5 éléments qui nous permettent de faire des lunettes accessibles, en un temps record ?",
    hint: "Zéro intermédiaire · Achat direct fournisseurs · Fabrication sur place · Large choix de montures · Examen de vue gratuit et sans rendez-vous",
    autoCorrectEach: [
      ['intermédiaire', 'intermediaire'],
      ['direct', 'fournisseur'],
      ['fabrication', 'sur place', 'boutique'],
      ['choix', 'montures'],
      ['examen', 'gratuit'],
    ],
  },
  // ── Questions texte libre ─────────────────────────────────────────────
  {
    type: 'text-open',
    question: "Combien de temps dure la garantie adaptation sur les verres progressifs chez Lunettes Pour Tous ?",
    hint: "100 jours (satisfait ou échangé)",
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
    question: "Écrivez la trame d'accueil en entier (pas juste « bonjour » ou « bienvenue »).",
    hint: "Bonjour et bienvenue chez Lunettes Pour Tous, mon prénom est [...]. Avez-vous votre ordonnance ? Êtes-vous venu(e) avec votre mutuelle ? Avez-vous déjà effectué un examen de vue chez nous ?",
    timeLimitSec: 150,
  },
]
