// Lipto, la mascotte LPT (19/11) — table des poses et réactions.
// Images : public/assets/lipto/, poses officielles sur fond transparent
// (reçues le 19/11). Seule « conseil » est encore provisoire (découpée dans la
// planche de concept, trous du logo blancs) : utilisée hors quiz uniquement.

// Interrupteur général : false = Lipto disparaît partout, rien d'autre ne change.
export const LIPTO_ACTIF = true

const V = '?v=4' // à incrémenter quand on remplace une image (cache navigateur)
export const LIPTO_POSES = {
  reflexion: { src: `/assets/lipto/reflexion.webp${V}`, alt: 'Lipto réfléchit, main sous le menton' },
  neutre: { src: `/assets/lipto/attente-correction.webp${V}`, alt: 'Lipto attend la correction' },
  pouce: { src: `/assets/lipto/bonne-reponse.webp${V}`, alt: 'Lipto lève le pouce' },
  bravo: { src: `/assets/lipto/celebration.webp${V}`, alt: 'Lipto célèbre, bras levés' },
  surpris: { src: `/assets/lipto/mauvaise-reponse.webp${V}`, alt: 'Lipto est surpris' },
  encouragement: { src: `/assets/lipto/encouragement.webp${V}`, alt: 'Lipto encourage, poing levé' },
  trophee: { src: `/assets/lipto/trophee.webp${V}`, alt: 'Lipto brandit un trophée' },
  bienvenue: { src: `/assets/lipto/bienvenue.webp${V}`, alt: 'Lipto dit bonjour' },
  // Mêmes images, noms pratiques pour les modules et la simulation
  point: { src: `/assets/lipto/attente-correction.webp${V}`, alt: 'Lipto fait le point' },
  attention: { src: `/assets/lipto/mauvaise-reponse.webp${V}`, alt: 'Lipto prévient' },
  conseil: { src: `/assets/lipto/conseil.webp${V}`, alt: 'Lipto donne un conseil' }, // provisoire
}

// Humeurs de client (23/11) : composées à partir d'une pose existante + des
// détails dessinés par-dessus (sourcils, goutte, joues…, cf. Lipto.js).
// En attendant de vraies poses dessinées pour chaque humeur.
export const LIPTO_HUMEURS = {
  heureux: { nom: 'Heureux', base: 'bienvenue' },
  inquiet: { nom: 'Inquiet', base: 'surpris' },
  fache: { nom: 'Fâché', base: 'surpris' },
  timide: { nom: 'Timide', base: 'reflexion' },
  ferme: { nom: 'Ferme', base: 'encouragement' },
  saoule: { nom: 'Soûlé', base: 'surpris' },
  presse: { nom: 'Pressé', base: 'bienvenue' },
}
// Image d'une pose ou d'une humeur (une humeur utilise l'image de sa pose de base)
export const liptoSrc = pose => (LIPTO_POSES[LIPTO_HUMEURS[pose]?.base || pose] || LIPTO_POSES.reflexion).src

// Réaction de fin de quiz. Ces seuils ne servent QU'À Lipto : ils ne
// changent pas les seuils officiels de réussite.
export function liptoFinDeQuiz(pct) {
  if (pct >= 90) return { pose: 'trophee', anim: 'saut', confettis: true, titre: 'Incroyable !', message: 'Tu maîtrises le sujet. Bravo, champion !' }
  if (pct >= 70) return { pose: 'bravo', anim: 'celebration', confettis: false, titre: 'Très beau score !', message: 'Encore un petit effort et c’est parfait.' }
  if (pct >= 50) return { pose: 'encouragement', anim: 'rebond', confettis: false, titre: 'C’est en bonne voie !', message: 'Les bases sont là, on continue comme ça.' }
  return { pose: 'reflexion', anim: 'calme', confettis: false, titre: 'On révise ensemble ?', message: 'Pas de panique : relis les points clés, ça va venir.' }
}

// Accueil du téléphone : Lipto en petit à côté des XP, humeur selon le
// niveau (getLevelInfo, 1 niveau tous les 50 XP). Jamais de confettis ici.
// À partir de Confirmé : clin d'œil + pouce, en attendant la pose
// « bras croisés, l'air de dire pas mal » (à remplacer dès qu'on a le PNG).
export function liptoPourNiveau(niveau) {
  if (niveau <= 0) return 'reflexion'
  if (niveau === 1) return 'encouragement'
  return 'pouce'
}

// Réaction après une question
export const LIPTO_REACTIONS = {
  question: { pose: 'reflexion', anim: 'reflexion' },
  attente: { pose: 'neutre', anim: 'apparition', message: 'Réponse enregistrée' },
  juste: { pose: 'pouce', anim: 'celebration', confettis: true, message: 'Bien joué !' },
  faux: { pose: 'surpris', anim: 'rebond', message: 'Pas grave, tu la retiendras pour la prochaine fois !' },
  finEnAttente: { pose: 'neutre', anim: 'apparition', message: 'Le formateur termine la correction…' },
}
