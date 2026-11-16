// Associe chaque question de quiz à un thème du Retour de formation
// (src/components/RetourFormationView.js, CATEGORY_META.themes), pour calculer
// un taux de compréhension par thème basé sur les vraies réponses aux quiz —
// à mettre en regard de l'évaluation manuelle du formateur, pas pour la remplacer.
//
// Les quiz des modules mono-thème (module_id === thème, ex: optique, entreprise,
// montures...) n'ont pas besoin d'être catégorisés question par question : dès
// que leur quiz a des questions, il compte automatiquement pour ce thème — pas
// de modif à faire ici quand on ajoute des questions à un quiz déjà existant.
//
// Les quiz "transversaux" (quiz-j1, quiz-final) mélangent plusieurs thèmes en un
// seul quiz — chaque question y est catégorisée individuellement ci-dessous.
//
// IMPORTANT pour les FUTURS quiz : si un nouveau module mono-thème est créé avec
// un module_id qui correspond à un thème du Retour de formation (voir THEMES_FRANCE
// / THEMES_BELGIQUE dans RetourFormationView.js), l'ajouter à DIRECT_THEME_MODULES
// ci-dessous. Si un nouveau quiz TRANSVERSAL est créé (mélange plusieurs thèmes,
// comme quiz-j1/quiz-final), lui créer sa propre table `..._THEMES` (une entrée
// par question, dans l'ordre du tableau de questions) et l'ajouter à
// TRANSVERSAL_THEME_MAPS ci-dessous.
import { quizJ1OrdrePour } from './quizJ1Data'
import { quizJ2OrdrePour } from './quizJ2Data'

export const DIRECT_THEME_MODULES = new Set([
  'entreprise', 'types-verres', 'pdm', 'optique', 'offres',
  'verre-progressif', 'trame-accueil', 'montures',
  'remboursement-france', 'parcours-rembourses', 'lpt-sante',
  'mutuelles-inami',
])

// Ancien Quiz Jour 1 (18 questions, ordre fixe) — sert encore à classer les
// réponses enregistrées avant la mise en ligne du quiz regroupé.
const QUIZ_J1_THEMES_AVANT_FUSION = [
  'entreprise',            // 0 — année d'ouverture du 1er magasin
  'entreprise',            // 1 — fondateurs
  'entreprise',            // 2 — différenciateur (fabrication 10 min)
  'entreprise',            // 3 — 5 points clés de la promesse LPT
  'optique',               // 4 — 4 problèmes de vue + définitions
  'optique',               // 5 — problèmes de vue trouvés dans la Sphère
  'optique',               // 6 — presbytie (lecture petits caractères)
  'optique',               // 7 — ordonnance à remplir
  'optique',               // 8 — ordonnance à remplir
  'optique',               // 9 — ordonnance à remplir (add, presbytie)
  'optique',               // 10 — qcm + ordonnance (myopie)
  'optique',               // 11 — qcm + ordonnance (hypermétropie)
  'optique',               // 12 — qcm + ordonnance (presbytie VP unifocale)
  'entreprise',            // 13 — puissance maximale de sphère fabriquée en 10 min
  'montures',              // 14 — catégories de montures (matière)
  'optique',               // 15 — qcm + ordonnance (myopie + astigmatisme)
  'optique',               // 16 — qcm + ordonnance (hypermétropie + astigmatisme + presbytie)
  'entreprise',            // 17 — délai de fabrication (forte correction)
]

// Date de mise en ligne du Quiz Jour 1 regroupé et mélangé — À METTRE À JOUR
// le jour du déploiement. Les réponses antérieures suivent l'ancien quiz.
const QUIZ_J1_FUSION_DEPUIS = '2026-11-16T15:47:00Z'

// Index = position dans QUIZ_J1_BASE de src/lib/quizJ1Data.js (ordre NON mélangé, 36 questions).
// Refondu le 16/11 : le Quiz Jour 1 regroupe désormais les quiz des modules
// Entreprise, Optique et Types de verres + l'ancien Quiz Jour 1 — toujours
// vérifier ce nombre contre QUIZ_J1.length après une suppression/ajout.
const QUIZ_J1_THEMES = [
  'entreprise',          // 0 — En quelle année a ouvert le premier magasin Lunettes Pour Tous ? (Ancien Quiz Jour 1 Q1)
  'entreprise',          // 1 — Quel élément (en dehors du prix) fait que l'offre de lunettes pour tou (Ancien Quiz Jour 1 Q3)
  'entreprise',          // 2 — Quels sont les 5 points clés qui permettent de remplir la promesse Lun (Ancien Quiz Jour 1 Q4)
  'entreprise',          // 3 — Où se trouve le laboratoire progressif unique au monde de Lunettes Pou (Module Entreprise Q5)
  'entreprise',          // 4 — Quel est le délai de fabrication pour un verre complexe (progressif) d (Module Entreprise Q6)
  'optique',             // 5 — Citez les 4 problèmes de vue et leur définition. (Ancien Quiz Jour 1 Q5)
  'optique',             // 6 — Un client voit flou de loin. Quel est son trouble ? (Module Optique Q1)
  'optique',             // 7 — Un client force constamment sur ses yeux pour voir net, quand il relâc (Module Optique Q10)
  'optique',             // 8 — Un client voit mal de près et a du mal à lire les petits caractères. Q (Ancien Quiz Jour 1 Q7)
  'optique',             // 9 — Astigmate c'est : (Module Optique Q3)
  'optique',             // 10 — La presbytie apparaît en moyenne à : (Module Optique Q4)
  'optique',             // 11 — Comment reconnaît-on une hypermétropie sur une ordonnance ? (Module Optique Q2)
  'optique',             // 12 — Dans la Sphère, quels problèmes de vue peut-on trouver ? (Ancien Quiz Jour 1 Q6)
  'optique',             // 13 — Les corrections évoluent de combien en combien ? (Module Optique Q5)
  'optique',             // 14 — A quoi correspond le cylindre ? (Module Optique Q7)
  'optique',             // 15 — A quoi correspond l'indication « Add » ? (Module Optique Q8)
  'optique',             // 16 — De quoi est toujours accompagné l'axe ? (Module Optique Q20)
  'optique',             // 17 — Saisissez les valeurs de cette ordonnance. (Ancien Quiz Jour 1 Q8)
  'optique',             // 18 — Saisissez les valeurs de cette ordonnance. (Ancien Quiz Jour 1 Q9)
  'optique',             // 19 — Saisissez les valeurs de cette ordonnance. (Ancien Quiz Jour 1 Q10)
  'optique',             // 20 — Quel est le problème de vue de ce client ? (Ancien Quiz Jour 1 Q11)
  'optique',             // 21 — Quel est le problème de vue de ce client ? (Ancien Quiz Jour 1 Q12)
  'optique',             // 22 — Quel est le problème de vue de ce client ? (Ancien Quiz Jour 1 Q13)
  'optique',             // 23 — Quels sont les problèmes de vue de ce client ? (Module Optique Q9)
  'optique',             // 24 — Quels sont les problèmes de vue de ce client ? (Module Optique Q11)
  'optique',             // 25 — Quels sont les problèmes de vue de ce client ? (Module Optique Q14)
  'optique',             // 26 — Quels sont les problèmes de vue de ce client ? (Module Optique Q19)
  'optique',             // 27 — Quels sont les problèmes de vue de ce client ? (Ancien Quiz Jour 1 Q16)
  'optique',             // 28 — Quels sont les problèmes de vue de ce client ? (Ancien Quiz Jour 1 Q17)
  'entreprise',          // 29 — Quelle est la puissance maximale de sphère fabriquée en 10 minutes che (Ancien Quiz Jour 1 Q14)
  'types-verres',        // 30 — Comment s'appelle le verre progressif de Lunettes Pour Tous ? (Module Types de verres Q2)
  'types-verres',        // 31 — À quel client allons-nous recommander le verre progressif ? (Module Types de verres Q4)
  'types-verres',        // 32 — Combien de zones de vision a un verre progressif ? Citez-les. (Module Types de verres Q6)
  'types-verres',        // 33 — Un client myope et astigmate de 28 ans peut avoir des verres progressi (Module Types de verres Q7)
  'entreprise',          // 34 — Quel est le délai de fabrication pour ces lunettes ? (Ancien Quiz Jour 1 Q18)
  'montures',            // 35 — Selon leur matière de fabrication, quelles sont les trois catégories d (Ancien Quiz Jour 1 Q15)
]

// Index = question_idx (0-based) dans src/lib/quizFinalData.js (QUIZ_FINAL_QUESTIONS, 32 questions).
// Réaligné le 17/08 : les questions "valeur ADD" et "OG sur ordonnance" ont été
// supprimées, ce qui décalait tous les thèmes après leur position — toujours
// vérifier ce nombre contre QUIZ_FINAL_QUESTIONS.length après une suppression/ajout.
const QUIZ_FINAL_THEMES = [
  'trame-accueil',         // 0  — première phrase de la trame d'accueil
  'trame-accueil',         // 1  — proposition systématique en fin de trame
  'entreprise',            // 2  — année de fondation
  'entreprise',            // 3  — fondateurs
  'entreprise',            // 4  — délai de fabrication unifocaux
  'entreprise',            // 5  — promesse 10 min (avec/sans ordonnance)
  'optique',               // 6  — myopie
  'optique',               // 7  — presbytie
  'optique',               // 8  — astigmatisme
  'optique',               // 9  — hypermétropie
  'optique',               // 10 — OD sur ordonnance
  'optique',               // 11 — corrections indiquées (qcm-ordonnance myopie+astig)
  'optique',               // 12 — correction indiquée (qcm-ordonnance hypermétropie)
  'offres',                // 13 — offre Classique
  'offres',                // 14 — parcours 1=1
  'offres',                // 15 — Pack Plan
  'offres',                // 16 — parcours Suprême
  'verre-progressif',      // 17 — délai de fabrication verre progressif
  'verre-progressif',      // 18 — trouble visuel recommandé
  'verre-progressif',      // 19 — zones de vision
  'remboursement-france',  // 20 — conditions de remboursement
  'remboursement-france',  // 21 — âge délai renouvellement 2 ans
  'remboursement-france',  // 22 — validité ordonnance (30 ans)
  'remboursement-france',  // 23 — reste à charge après remboursement complet
  'remboursement-france',  // 24 — renouvellement adapté (+16 ans)
  'montures',              // 25 — matière entrée de gamme
  'remboursement-france',  // 26 — CSS remplace quel élément
  'entreprise',            // 27 — 5 éléments de l'accessibilité LPT
  'verre-progressif',      // 28 — garantie adaptation 100 jours
  'optique',               // 29 — reconnaître un presbyte sans ordonnance
  'verre-progressif',      // 30 — arguments de vente verre progressif
  'trame-accueil',         // 31 — trame d'accueil complète
]

// Index = question_idx (0-based) dans src/lib/quizJ2Data.js (QUIZ_J2, 19 questions).
// Réaligné le 17/08 : la question "2nde paire offerte pack 95€" a été supprimée,
// ce qui décalait tous les thèmes après sa position — toujours vérifier ce
// nombre contre QUIZ_J2.length après une suppression/ajout.
// Mise en ligne du Quiz Jour 2 mélangé chaque semaine — À METTRE À JOUR le
// jour du déploiement. Les réponses antérieures suivent l'ordre fixe.
const QUIZ_J2_MELANGE_DEPUIS = '2026-11-16T16:45:00Z'

// Index = position dans QUIZ_J2_BASE de src/lib/quizJ2Data.js (ordre NON mélangé).
const QUIZ_J2_THEMES = [
  'trame-accueil',         // 0  — case manquante de la trame d'accueil
  'offres',                // 1  — matériaux monture offre 1=1
  'offres',                // 2  — 2nde paire offerte (1=1)
  'offres',                // 3  — prix moyen équipement progressif (1=1)
  'offres',                // 4  — avantages 2nde paire (1=1)
  'verre-progressif',      // 5  — délai fabrication progressifs (1=1)
  'entreprise',            // 6  — délai fabrication unifocaux (1=1)
  'types-verres',          // 7  — traitements Digital Protect Pro
  'verre-progressif',      // 8  — 5 arguments de vente verre progressif
  'offres',                // 9  — composition paire à 10€
  'offres',                // 10 — réduction 2nde paire (offre classique)
  'offres',                // 11 — qu'est-ce que le pack plan
  'montures',              // 12 — matériau montures 5-15€
  'montures',              // 13 — matériau monture conseillé (qcm-ordonnance)
  'verre-progressif',      // 14 — 3 zones de vision du progressif
  'entreprise',            // 15 — âge examen de vue en magasin
  'entreprise',            // 16 — coût de l'examen de vue
  'verre-progressif',      // 17 — conseil verre 2nde paire (couture)
  'optique',               // 18 — calcul vision de près
]

// Index = question_idx (0-based) dans src/lib/quizFinalBelgiqueData.js
// (QUIZ_FINAL_QUESTIONS_BELGIQUE) — copie de QUIZ_FINAL_THEMES où seules les
// 7 questions remplacées par du contenu belge (remboursement INAMI/mutuelles)
// changent de thème ; le reste est identique à la version France.
const QUIZ_FINAL_THEMES_BELGIQUE = [
  'trame-accueil', 'trame-accueil', 'entreprise', 'entreprise', 'entreprise', 'entreprise',
  'optique', 'optique', 'optique', 'optique', 'optique', 'optique', 'optique',
  'offres', 'offres', 'offres',
  'remboursement-belgique',  // 16 — remboursement assurance obligatoire : ordonnance < 6 mois
  'verre-progressif', 'verre-progressif', 'verre-progressif',
  'remboursement-belgique',  // 20 — conditions remboursement optique (mutuelle valable)
  'remboursement-belgique',  // 21 — tranche d'âge renouvellement 2 ans
  'remboursement-belgique',  // 22 — mutuelle qui rembourse jusqu'à 75€
  'remboursement-belgique',  // 23 — offre Partenamut progressif tiers payant
  'remboursement-belgique',  // 24 — remboursement anticipé
  'mutuelles-inami',         // 25 — qu'est-ce que l'INAMI
  'remboursement-france',    // 26 — CSS remplace quel élément (question non modifiée)
  'entreprise', 'verre-progressif', 'optique', 'verre-progressif', 'trame-accueil',
]

const TRANSVERSAL_THEME_MAPS = {
  'quiz-j1': QUIZ_J1_THEMES,
  'quiz-j2': QUIZ_J2_THEMES,
  'quiz-final': QUIZ_FINAL_THEMES,
  'quiz-final-belgique': QUIZ_FINAL_THEMES_BELGIQUE,
}

export const TRANSVERSAL_MODULE_IDS = new Set(Object.keys(TRANSVERSAL_THEME_MAPS))

/**
 * Thème d'une réponse de quiz (module_id + question_idx), ou null si non
 * catégorisable (jeu des questions/entraînement oral en question_idx >= 100,
 * module hors des thèmes du Retour de formation...).
 */
// createdAt : date de la réponse (quiz_answers.created_at). Indispensable pour
// quiz-j1, dont l'ordre des questions change chaque semaine.
export function themeForAnswer(moduleId, questionIdx, createdAt) {
  const qi = questionIdx ?? 0
  if (qi >= 100) return null
  if (moduleId === 'quiz-j1') {
    const date = createdAt ? new Date(createdAt) : new Date()
    if (createdAt && date < new Date(QUIZ_J1_FUSION_DEPUIS)) return QUIZ_J1_THEMES_AVANT_FUSION[qi] || null
    return QUIZ_J1_THEMES[quizJ1OrdrePour(date)[qi]] || null
  }
  if (moduleId === 'quiz-j2') {
    // Mêmes questions qu'avant, seul l'ordre est mélangé depuis QUIZ_J2_MELANGE_DEPUIS
    const date = createdAt ? new Date(createdAt) : new Date()
    if (createdAt && date < new Date(QUIZ_J2_MELANGE_DEPUIS)) return QUIZ_J2_THEMES[qi] || null
    return QUIZ_J2_THEMES[quizJ2OrdrePour(date)[qi]] || null
  }
  const transversal = TRANSVERSAL_THEME_MAPS[moduleId]
  if (transversal) return transversal[qi] || null
  if (DIRECT_THEME_MODULES.has(moduleId)) return moduleId
  return null
}

// Taux de réussite du groupe par famille de questions (quiz transversal) :
// bonnes réponses / (questions de la famille × participants) — même base que
// le taux global (une question sans réponse compte comme ratée). Partagé
// entre l'écran formateur et la TV pour afficher exactement les mêmes chiffres.
export const FAMILLE_LABELS = {
  'entreprise': "L'entreprise", 'optique': "Les bases de l'optique",
  'types-verres': 'Les types de verres', 'montures': 'Les montures',
  'trame-accueil': "La trame d'accueil", 'offres': 'Les offres',
  'verre-progressif': 'Le verre progressif',
}

export function tauxParFamille(rows, quiz, moduleId) {
  const data = (rows || []).filter(r => (r.question_idx ?? 0) < 100)
  const participants = new Set(data.map(r => r.collaborateur)).size
  const familles = {}
  ;(quiz || []).forEach((_, i) => {
    const f = themeForAnswer(moduleId, i)
    if (!f) return
    familles[f] = familles[f] || { questions: 0, bonnes: 0 }
    familles[f].questions += 1
  })
  // Une seule réponse par (formé, question) : la dernière
  const derniere = {}
  for (const r of data) derniere[`${r.collaborateur}__${r.question_idx}`] = r
  for (const r of Object.values(derniere)) {
    const f = themeForAnswer(moduleId, r.question_idx, r.created_at)
    if (f && familles[f] && r.is_correct) familles[f].bonnes += 1
  }
  return Object.entries(familles).map(([id, v]) => ({
    id, label: FAMILLE_LABELS[id] || id, questions: v.questions,
    pct: participants > 0 ? Math.round((v.bonnes / (v.questions * participants)) * 100) : 0,
  }))
}

export function statutFamille(pct) {
  if (pct >= 75) return { icon: '🟢', label: 'Bien maîtrisé' }
  if (pct >= 50) return { icon: '🟡', label: 'À consolider' }
  return { icon: '🔴', label: 'À retravailler' }
}
