// Cartographie de l'app — un nœud par module/outil réel (pas de détail interne
// des pages). Construit à la main à partir de src/app/page.js, Dashboard.js,
// OnboardingView.js et OnboardingViewBelgique.js, ModuleMiniJeux.js — reflète
// le vrai câblage de navigation à la date de rédaction. À retoucher si un
// module change de journée ou si un nouveau module est ajouté.
//
// kind:    'root' | 'branch' | 'module' | 'quiz' | 'tool' | 'admin' | 'planned'
// hasQuiz: le module contient un quiz interne (badge), distinct de kind:'quiz'
//          qui EST un quiz autonome (Quiz J1/J2/Final).
// flag:    'fr' | 'be' | undefined (undefined = commun aux deux parcours)
// planned: true → visible dans l'app avec un tag "soon" mais ne lance rien
//          encore (Découverte des montures, Merch montures).

const COL = 200
const ROW = 140

export const APP_FLOW_NODES = [
  { id: 'dashboard',           label: 'Dashboard formateur',    kind: 'root',   x: 0,       y: 3 * ROW },
  { id: 'onboarding-france',   label: 'Onboarding France',      kind: 'branch', x: COL,     y: 1 * ROW, flag: 'fr' },
  { id: 'onboarding-belgique', label: 'Onboarding Belgique',    kind: 'branch', x: COL,     y: 3 * ROW, flag: 'be' },
  { id: 'modules-libres',      label: 'Modules (bibliothèque)', kind: 'branch', x: COL,     y: 6 * ROW },
  { id: 'outils-formateur',    label: 'Outils formateur',       kind: 'branch', x: COL,     y: 9 * ROW },

  // ── J1 — commun ──────────────────────────────────────────────────
  { id: 'entreprise',   label: "Présentation de l'entreprise", kind: 'module',  journee: 'J1', hasQuiz: true,  x: 2 * COL, y: 2 * ROW },
  { id: 'optique',      label: "Les bases de l'optique",       kind: 'module',  journee: 'J1', hasQuiz: true,  x: 3 * COL, y: 2 * ROW },
  { id: 'types-verres', label: 'Les types de verres',          kind: 'module',  journee: 'J1', hasQuiz: true,  x: 4 * COL, y: 2 * ROW },
  { id: 'montures',     label: 'Connaissances Montures',       kind: 'module',  journee: 'J1', hasQuiz: false, x: 5 * COL, y: 2 * ROW },
  { id: 'montures-decouverte', label: 'Découverte des montures', kind: 'planned', journee: 'J1', x: 6 * COL, y: 2 * ROW },
  { id: 'quiz-j1',      label: 'Quiz Jour 1',                  kind: 'quiz',    journee: 'J1',                 x: 7 * COL, y: 2 * ROW },

  // ── J2 — commun ──────────────────────────────────────────────────
  { id: 'peer-quiz',     label: 'Jeu de questions (révision)', kind: 'tool',    journee: 'J2', x: 8 * COL,  y: 2 * ROW },
  { id: 'merch-montures', label: 'Merch montures',             kind: 'planned', journee: 'J2', x: 9 * COL,  y: 2 * ROW },
  { id: 'trame-accueil', label: "Trame d'accueil",             kind: 'module',  journee: 'J2', hasQuiz: false, x: 10 * COL, y: 2 * ROW },
  { id: 'offres',        label: 'Les offres',                  kind: 'module',  journee: 'J2', hasQuiz: true,  x: 11 * COL, y: 2 * ROW, note: 'Contenu additionnel "LPT Care" en session Belgique' },
  { id: 'quiz-j2',       label: 'Quiz Jour 2',                 kind: 'quiz',    journee: 'J2',                 x: 12 * COL, y: 2 * ROW },

  // ── J3 — commence commun (PDM), puis diverge ────────────────────
  { id: 'pdm', label: 'Prise de mesures', kind: 'module', journee: 'J3', hasQuiz: true, x: 13 * COL, y: 2 * ROW },

  { id: 'parcours-rembourses',   label: 'Les parcours remboursés',           kind: 'module', journee: 'J3', hasQuiz: false, flag: 'fr', x: 14 * COL, y: 1 * ROW },
  { id: 'remboursement-france',  label: 'Remboursement optique en France',   kind: 'module', journee: 'J3', hasQuiz: true,  flag: 'fr', x: 15 * COL, y: 1 * ROW },
  { id: 'lpt-sante',             label: 'LPT Santé',                         kind: 'module', journee: 'J3', hasQuiz: false, flag: 'fr', x: 16 * COL, y: 1 * ROW },

  { id: 'mutuelles-inami', label: 'Mutuelles et INAMI', kind: 'module', journee: 'J3', hasQuiz: false, flag: 'be', x: 14 * COL, y: 3 * ROW },

  // ── J4 — reconverge, commun ──────────────────────────────────────
  { id: 'retraits',        label: 'Les Retraits',    kind: 'module', journee: 'J4', hasQuiz: true,  x: 17 * COL, y: 2 * ROW },
  { id: 'ajustages',       label: 'Les Ajustages',   kind: 'module', journee: 'J4', hasQuiz: true,  x: 18 * COL, y: 2 * ROW },
  { id: 'raz',             label: 'Les RAZ',         kind: 'module', journee: 'J4', hasQuiz: false, x: 19 * COL, y: 2 * ROW },
  { id: 'montage',         label: 'Le montage',      kind: 'module', journee: 'J4', hasQuiz: false, x: 20 * COL, y: 2 * ROW },
  { id: 'montures-outlet', label: 'Montures Outlet', kind: 'module', journee: 'J4', hasQuiz: false, x: 21 * COL, y: 2 * ROW },

  // ── Outils de session — accessibles depuis l'écran Onboarding, ──
  // pas rattachés à une journée précise.
  { id: 'reveil-acquis', label: 'Réveil des acquis',       kind: 'tool', x: 2 * COL, y: 5 * ROW },
  { id: 'mini-jeux',     label: 'Mini Jeux',               kind: 'tool', x: 3 * COL, y: 5 * ROW },
  { id: 'mj-accueil',      label: 'Accueil moi si tu peux', kind: 'tool', x: 3 * COL, y: 5.8 * ROW, sub: true },
  { id: 'mj-questions-j1', label: 'Questions (Jour 1)',     kind: 'tool', x: 3 * COL, y: 6.5 * ROW, sub: true },
  { id: 'mj-questions-j2', label: 'Questions (Jour 2)',     kind: 'tool', x: 3 * COL, y: 7.2 * ROW, sub: true },
  { id: 'atelier-pec',   label: 'Atelier prise en charge', kind: 'tool', flag: 'fr', x: 4 * COL, y: 5 * ROW },
  { id: 'quiz-final',    label: 'Quiz de fin de formation', kind: 'quiz', x: 5 * COL, y: 5 * ROW },

  // ── Modules (bibliothèque) — accessibles uniquement depuis ce ────
  // tiroir du Dashboard, hors de tout parcours Onboarding.
  { id: 'verre-progressif', label: 'Le Verre Progressif', kind: 'module', hasQuiz: true, isolated: true, x: 6 * COL, y: 5 * ROW },
  { id: 'free-quiz',        label: 'Quiz libre',          kind: 'tool',   isolated: true, x: 7 * COL, y: 5 * ROW },

  // ── Outils formateur — indépendants de toute session en cours ────
  { id: 'planning',         label: 'Planning déplacements',  kind: 'admin', x: 2 * COL, y: 8 * ROW },
  { id: 'idees',            label: 'Idées',                  kind: 'admin', x: 3 * COL, y: 8 * ROW },
  { id: 'entrees',          label: 'Entrées de la semaine',  kind: 'admin', x: 4 * COL, y: 8 * ROW },
  { id: 'retour-formation', label: 'Retour de formation',    kind: 'admin', x: 5 * COL, y: 8 * ROW },
  { id: 'auto-eval',        label: 'Auto-évaluation',        kind: 'admin', x: 2 * COL, y: 9 * ROW },
  { id: 'global-ratings',   label: 'Avis formation',         kind: 'admin', x: 3 * COL, y: 9 * ROW },
  { id: 'pense-bete',       label: 'Pense-bête',             kind: 'admin', x: 4 * COL, y: 9 * ROW },
  { id: 'sonnette',         label: 'Sonnette',                kind: 'admin', x: 5 * COL, y: 9 * ROW },
  { id: 'app-flow',         label: 'App Flow (ici)',          kind: 'admin', x: 6 * COL, y: 9 * ROW },
]

export const APP_FLOW_EDGES = [
  { source: 'dashboard', target: 'onboarding-france' },
  { source: 'dashboard', target: 'onboarding-belgique' },
  { source: 'dashboard', target: 'modules-libres' },
  { source: 'dashboard', target: 'outils-formateur' },

  { source: 'modules-libres', target: 'verre-progressif' },
  { source: 'modules-libres', target: 'free-quiz' },

  { source: 'outils-formateur', target: 'planning' },
  { source: 'outils-formateur', target: 'idees' },
  { source: 'outils-formateur', target: 'entrees' },
  { source: 'outils-formateur', target: 'retour-formation' },
  { source: 'outils-formateur', target: 'auto-eval' },
  { source: 'outils-formateur', target: 'global-ratings' },
  { source: 'outils-formateur', target: 'pense-bete' },
  { source: 'outils-formateur', target: 'sonnette' },
  { source: 'outils-formateur', target: 'app-flow' },

  { source: 'onboarding-france', target: 'entreprise' },
  { source: 'onboarding-belgique', target: 'entreprise' },

  { source: 'entreprise', target: 'optique' },
  { source: 'optique', target: 'types-verres' },
  { source: 'types-verres', target: 'montures' },
  { source: 'montures', target: 'montures-decouverte' },
  { source: 'montures-decouverte', target: 'quiz-j1' },
  { source: 'quiz-j1', target: 'peer-quiz' },
  { source: 'peer-quiz', target: 'merch-montures' },
  { source: 'merch-montures', target: 'trame-accueil' },
  { source: 'trame-accueil', target: 'offres' },
  { source: 'offres', target: 'quiz-j2' },
  { source: 'quiz-j2', target: 'pdm' },

  { source: 'pdm', target: 'parcours-rembourses' },
  { source: 'parcours-rembourses', target: 'remboursement-france' },
  { source: 'remboursement-france', target: 'lpt-sante' },

  { source: 'pdm', target: 'mutuelles-inami' },

  { source: 'lpt-sante', target: 'retraits' },
  { source: 'mutuelles-inami', target: 'retraits' },

  { source: 'retraits', target: 'ajustages' },
  { source: 'ajustages', target: 'raz' },
  { source: 'raz', target: 'montage' },
  { source: 'montage', target: 'montures-outlet' },

  { source: 'onboarding-france', target: 'reveil-acquis' },
  { source: 'onboarding-belgique', target: 'reveil-acquis' },
  { source: 'onboarding-france', target: 'mini-jeux' },
  { source: 'onboarding-belgique', target: 'mini-jeux' },
  { source: 'mini-jeux', target: 'mj-accueil' },
  { source: 'mini-jeux', target: 'mj-questions-j1' },
  { source: 'mini-jeux', target: 'mj-questions-j2' },
  { source: 'onboarding-france', target: 'atelier-pec' },
  { source: 'onboarding-france', target: 'quiz-final' },
  { source: 'onboarding-belgique', target: 'quiz-final' },
]
