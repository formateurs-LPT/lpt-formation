// Simulation finale avec Lipto (19/11) — Lipto joue le client qui entre en
// magasin. Même mécanique que les quiz (réponses sur le téléphone, correction
// automatique, validation formateur, classement), avec une « scène » en plus
// pour le diffuseur (photo de magasin floutée + Lipto + sa bulle).
//
// Le formateur choisit un scénario (index 0 à 2). L'ordre des scènes est
// donné par SIMULATION_SUITE : scénario 1 → scène du concept ; scénarios 2
// et 3 → fin (pour l'instant). L'ancien « Bonjour :) » a été supprimé.

// Ordonnance que Lipto tend au vendeur (fictive, aucune donnée réelle)
export const ORDONNANCE_LIPTO = {
  patient: 'LIPTO',
  date: '03/11/2026',
  od: { sph: '-1,00', cyl: '-0,50', axe: '180', add: '+2,00' },
  og: { sph: '-3,00', cyl: '-0,50', axe: '30', add: '+2,00' },
}

// Ticket de l'examen de vue de Lipto (reproduit d'après un vrai ticket du
// magasin de Bordeaux, 23/11 — seul le nom est fictif)
export const TICKET_LIPTO = {
  nom: 'LIPTO',
  date: '23/11/2026',
  heure: '10:04 am',
  wd: '40cm',
  od: { sph: '+ 0.75', cyl: '+ 0.25', axe: '15°' },
  og: { sph: '+ 0.50', cyl: '0.00', axe: '0°' },
  pd: '64.0',
  magasin: ['LUNETTES POUR TOUS', 'BORDEAUX'],
}

// Répliques de Lipto que le formateur choisit à la correction (Kevin, 19/11)
// suite = index de la scène où Lipto dit la réplique (cf. scènes 4 à 8 en bas)
const R_SANS_ORDO = { id: 'sans-ordo', texte: 'Comment ça se passe ? Je n’ai pas d’ordonnance.', suite: 4 }
const R_ORDO = { id: 'ordo', texte: 'J’ai une ordonnance, la voici !', ordonnance: ORDONNANCE_LIPTO, suite: 5 }
const R_REMBOURSEMENT = { id: 'remboursement', texte: 'Mon dernier remboursement doit dater de deux ans, je crois.', suite: 6 }
const R_S3_SANS_ORDO = { id: 'sans-ordo', texte: 'Très bien ! Je n’ai pas d’ordonnance, comment ça se passe ?', suite: 7 }
const R_SANS_REMBOURSEMENT = { id: 'sans-remboursement', texte: 'Je veux juste des lunettes, sans me faire rembourser.', suite: 8 }

const PRESENTER_CONCEPT = {
  hint: 'Vos lunettes en seulement 10 minutes, avec ou sans ordonnance',
  // Validé automatiquement seulement avec les 10 minutes ET « avec ou sans ordonnance »
  autoCorrectAllOr: [['10 min', '10min', 'dix minutes', '10 minutes'], ['avec ou sans'], ['ordonnance', 'ordo']],
}

function scenario({ id, titre, bulle, image, options, correct, pourquoi, repliqueCorrection, repliques }) {
  return {
    question: `Lipto entre et vous dit : « ${bulle} » Que lui répondez-vous ?`,
    options,
    correct,
    simulation: { id, titre, bulle, image, imageCorrection: '/assets/magasins/magasin-tables.webp', pose: 'bienvenue', pourquoi, repliqueCorrection, repliques },
  }
}

export const SIMULATION_ACCUEIL = [
  // 0 — Scénario 1 (Kevin, 19/11) : bonne réponse C
  scenario({
    id: 'regarde',
    titre: 'Je regarde juste',
    bulle: 'Bonjour, je regarde juste, merci.',
    image: '/assets/magasins/magasin-allee.webp',
    options: [
      'Aucun problème !',
      'Je peux quand même vous renseigner ?',
      'Est-ce que vous connaissez le concept ?',
      'Avez-vous une ordonnance ?',
    ],
    correct: 2,
    pourquoi: [
      'A — On laisse le client seul, sans aucune information.',
      'B — Le client répond presque toujours « non merci ».',
      'C — La question attise sa curiosité : il a envie de savoir.',
      'D — Parler d’ordonnance d’entrée risque de le braquer.',
    ],
    repliqueCorrection: 'Hmm… votre concept ? C’est-à-dire ?',
  }),
  // 1 — Scénario 2 (Kevin, 19/11) : A ou C acceptées
  scenario({
    id: 'renouvellement',
    titre: 'Je viens renouveler mes lunettes',
    bulle: 'Je viens renouveler mes lunettes.',
    image: '/assets/magasins/magasin-comptoir.webp',
    options: [
      'À quand remonte votre dernier remboursement ?',
      'Je vous laisse alors regarder les montures.',
      'Très bien ! Avez-vous une ordonnance ?',
      'Je vais vous inscrire en examen de vue.',
    ],
    correct: [0, 2],
    repliques: [R_ORDO, R_REMBOURSEMENT],
  }),
  // 2 — Scénario 3 (ex-« scénario 4 » des notes de Kevin, 19/11) : le client demande comment on fonctionne →
  // on lui présente directement le concept (texte à compléter)
  {
    type: 'text-open',
    question: 'Lipto entre et vous dit : « Bonjour, comment fonctionnez-vous ? » Complétez : « Notre concept est simple : vous avez la possibilité d’avoir… »',
    ...PRESENTER_CONCEPT,
    simulation: {
      id: 'fonctionnement',
      titre: 'Comment fonctionnez-vous ?',
      bulle: 'Bonjour, comment fonctionnez-vous ?',
      image: '/assets/magasins/magasin-10-minutes.webp',
      imageCorrection: '/assets/magasins/magasin-10-minutes.webp',
      pose: 'bienvenue',
      repliques: [R_S3_SANS_ORDO, R_SANS_REMBOURSEMENT],
    },
  },
  // 3 — Suite du scénario 1 : présenter le concept (texte à compléter)
  {
    type: 'text-open',
    question: 'Lipto : « Non, je ne connais pas votre concept. » Complétez : « Notre concept est simple : vous avez la possibilité d’avoir… »',
    ...PRESENTER_CONCEPT,
    simulation: {
      id: 'concept',
      titre: 'Présenter le concept',
      bulle: 'Non, je ne connais pas votre concept.',
      image: '/assets/magasins/magasin-10-minutes.webp',
      imageCorrection: '/assets/magasins/magasin-10-minutes.webp',
      pose: 'reflexion',
      repliques: [R_SANS_ORDO, R_ORDO],
    },
  },
  // 4 à 8 — Scènes « Lipto répond » choisies par le formateur. Pas encore de
  // question aux collaborateurs (à écrire par Kevin) : Lipto parle sur la TV,
  // les téléphones affichent « regardez l'écran ».
  // 4 — « Je n'ai pas d'ordonnance » : on propose l'examen de vue (Kevin, 19/11)
  questionSansOrdonnance(R_SANS_ORDO),
  // 5 — Lipto tend son ordonnance : la TV la montre 5 s, puis la question
  // de lecture d'ordonnance s'affiche (Kevin, 19/11). Bonne réponse C.
  {
    question: 'Lipto vous tend son ordonnance. Quels sont les problèmes visuels de Lipto ?',
    options: [
      'Myope et astigmate',
      'Hypermétrope, astigmate et presbyte',
      'Myope, astigmate et presbyte',
      'Astigmate et presbyte',
    ],
    correct: 2,
    // Affichée aussi sur le téléphone et l'écran formateur, sous la question
    ordonnance: { od: ORDONNANCE_LIPTO.od, og: ORDONNANCE_LIPTO.og },
    cylInParens: true,
    simulation: {
      id: 'lecture-ordonnance',
      titre: 'Lire l’ordonnance',
      bulle: R_ORDO.texte,
      image: '/assets/magasins/magasin-comptoir.webp',
      imageCorrection: '/assets/magasins/magasin-comptoir.webp',
      pose: 'bienvenue',
      ordonnance: ORDONNANCE_LIPTO,
      ordonnanceIntroSec: 5,
      questionTV: 'Quels sont les problèmes visuels de Lipto\u00a0?',
    },
  },
  sceneReplique(R_REMBOURSEMENT, '/assets/magasins/magasin-comptoir.webp'),
  // 7 — même situation, depuis le scénario 3
  questionSansOrdonnance(R_S3_SANS_ORDO),
  sceneReplique(R_SANS_REMBOURSEMENT, '/assets/magasins/vitrine-montures.webp'),
  // 9 — Lipto part en examen de vue et revient avec son ticket (Kevin, 23/11).
  // Pas encore de question sur le ticket : à écrire par Kevin.
  {
    type: 'scene',
    question: 'Lipto revient de son examen de vue avec son ticket.',
    simulation: {
      id: 'retour-examen',
      titre: 'Examen de vue',
      bulle: 'C’est fait ! Voici mon ticket.',
      image: '/assets/magasins/salle-examen.webp',
      imageCorrection: '/assets/magasins/salle-examen.webp',
      pose: 'bienvenue',
      ticket: TICKET_LIPTO,
      animationExamen: true,
    },
  },
]

// Client sans ordonnance : bonne réponse B (examen de vue gratuit). À la
// correction, Lipto dit « Super, allons-y ! » et on passe en salle d'examen.
function questionSansOrdonnance(r) {
  return {
    question: `Lipto : « ${r.texte} » Que lui répondez-vous ?`,
    options: [
      'Je ne peux rien pour vous, malheureusement.',
      'Je peux vous proposer un examen de vue gratuit.',
      'Revenez avec une ordonnance dans ce cas ?',
    ],
    correct: 1,
    simulation: {
      id: `examen-${r.id}`,
      titre: 'Pas d’ordonnance',
      bulle: r.texte,
      image: '/assets/magasins/magasin-tables.webp',
      imageCorrection: '/assets/magasins/salle-examen.webp',
      pose: 'reflexion',
      repliqueCorrection: 'Super, allons-y !',
      poseCorrection: 'pouce',
    },
  }
}

function sceneReplique(r, image) {
  return {
    type: 'scene',
    question: `Lipto : « ${r.texte} »`,
    simulation: { id: `replique-${r.id}`, titre: 'Lipto répond', bulle: r.texte, image, imageCorrection: image, pose: r.ordonnance ? 'bienvenue' : 'reflexion', ordonnance: r.ordonnance || null },
  }
}

// Scène suivante après chaque scène (absent = fin de la simulation)
// 4 et 7 (pas d'ordonnance → examen de vue) mènent au retour d'examen (9)
export const SIMULATION_SUITE = { 0: 3, 4: 9, 7: 9 }

// Scénarios proposés au formateur au départ, numérotés 1 à 3 (19/11)
export const SIMULATION_SCENARIOS = [
  { idx: 0, numero: 1 },
  { idx: 1, numero: 2 },
  { idx: 2, numero: 3 },
].map(s => ({ ...s, pret: true, ...SIMULATION_ACCUEIL[s.idx].simulation }))
