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

// Index = question_idx (0-based) dans src/lib/quizJ1Data.js (QUIZ_J1, 20 questions)
const QUIZ_J1_THEMES = [
  'entreprise',            // Q1  — année d'ouverture du 1er magasin
  'entreprise',            // Q2  — fondateurs
  'entreprise',            // Q3  — différenciateur (fabrication 10 min)
  'entreprise',            // Q4  — 5 points clés de la promesse LPT
  'optique',               // Q5  — 4 problèmes de vue + définitions
  'optique',               // Q6  — problèmes de vue trouvés dans la Sphère
  'optique',               // Q7  — presbytie (lecture petits caractères)
  'optique',               // Q8  — ordonnance à remplir
  'optique',               // Q9  — ordonnance à remplir
  'optique',               // Q10 — ordonnance à remplir (add, presbytie)
  'optique',               // Q11 — qcm + ordonnance (myopie)
  'optique',               // Q12 — qcm + ordonnance (hypermétropie)
  'optique',               // Q13 — qcm + ordonnance (presbytie VP unifocale)
  'entreprise',            // Q14 — puissance maximale de sphère fabriquée en 10 min
  'optique',               // Q15 — signification de "Plan"
  'montures',              // Q16 — catégories de montures (matière)
  'optique',               // Q17 — qcm + ordonnance (myopie + astigmatisme)
  'optique',               // Q18 — qcm + ordonnance (hypermétropie + astigmatisme + presbytie)
  'entreprise',            // Q19 — délai de fabrication (forte correction)
  'optique',               // Q20 — enfant presbyte (vrai/faux)
]

// Index = question_idx (0-based) dans src/lib/quizFinalData.js (QUIZ_FINAL_QUESTIONS, 34 questions)
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
  'optique',               // 11 — corrections indiquées (qcm-ordonnance)
  'optique',               // 12 — valeur ADD
  'optique',               // 13 — correction indiquée (qcm-ordonnance)
  'offres',                // 14 — offre Classique
  'offres',                // 15 — parcours 1=1
  'offres',                // 16 — Pack Plan
  'offres',                // 17 — parcours Suprême
  'verre-progressif',      // 18 — délai de fabrication verre progressif
  'verre-progressif',      // 19 — trouble visuel recommandé
  'verre-progressif',      // 20 — zones de vision
  'remboursement-france',  // 21 — conditions de remboursement
  'remboursement-france',  // 22 — âge délai renouvellement 2 ans
  'remboursement-france',  // 23 — validité ordonnance (30 ans)
  'remboursement-france',  // 24 — reste à charge après remboursement complet
  'remboursement-france',  // 25 — renouvellement adapté (+16 ans)
  'optique',               // 26 — OG sur ordonnance
  'montures',              // 27 — matière entrée de gamme
  'remboursement-france',  // 28 — CSS remplace quel élément
  'entreprise',            // 29 — 5 éléments de l'accessibilité LPT
  'verre-progressif',      // 30 — garantie adaptation 100 jours
  'optique',               // 31 — reconnaître un presbyte sans ordonnance
  'verre-progressif',      // 32 — arguments de vente verre progressif
  'trame-accueil',         // 33 — trame d'accueil complète
]

const TRANSVERSAL_THEME_MAPS = {
  'quiz-j1': QUIZ_J1_THEMES,
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
