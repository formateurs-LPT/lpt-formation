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
export const DIRECT_THEME_MODULES = new Set([
  'entreprise', 'types-verres', 'pdm', 'optique', 'offres',
  'verre-progressif', 'trame-accueil', 'montures',
  'remboursement-france', 'parcours-rembourses', 'lpt-sante',
  'mutuelles-inami',
])

// Index = question_idx (0-based) dans src/lib/quizJ1Data.js (QUIZ_J1, 18 questions).
// Réaligné le 17/08 : 2 questions ("Plan", "enfant presbyte vrai/faux") ont été
// supprimées du quiz, ce qui décalait tous les thèmes après leur position —
// toujours vérifier ce nombre contre QUIZ_J1.length après une suppression/ajout.
const QUIZ_J1_THEMES = [
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

const TRANSVERSAL_THEME_MAPS = {
  'quiz-j1': QUIZ_J1_THEMES,
  'quiz-j2': QUIZ_J2_THEMES,
  'quiz-final': QUIZ_FINAL_THEMES,
}

export const TRANSVERSAL_MODULE_IDS = new Set(Object.keys(TRANSVERSAL_THEME_MAPS))

/**
 * Thème d'une réponse de quiz (module_id + question_idx), ou null si non
 * catégorisable (jeu des questions/entraînement oral en question_idx >= 100,
 * module hors des thèmes du Retour de formation...).
 */
export function themeForAnswer(moduleId, questionIdx) {
  const qi = questionIdx ?? 0
  if (qi >= 100) return null
  const transversal = TRANSVERSAL_THEME_MAPS[moduleId]
  if (transversal) return transversal[qi] || null
  if (DIRECT_THEME_MODULES.has(moduleId)) return moduleId
  return null
}
