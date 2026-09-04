// Suivi magasin — roster et items de compétence par magasin.
// Données saisies à la main (feuille fournie par Kevin), à étendre magasin
// par magasin. La progression réelle (statut/notes par collaborateur) vit
// dans Supabase (table store_followup_progress) — jamais ici.

export const STORES = [
  {
    id: 'bayonne',
    label: 'Bayonne',
    photo: '/assets/store-bayonne.jpg',
    sections: [
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'anne-laure-miquel',      prenom: 'Anne Laure', nom: 'Miquel',            contrat: '35h', entree: '2026-07-26' },
          { id: 'annette-henry',          prenom: 'Annette',    nom: 'Henry',              contrat: '35h', entree: '2026-04-07' },
          { id: 'nadege-tixier-lamaison', prenom: 'Nadège',     nom: 'Tixier-Lamaison',    contrat: '35h', entree: '2026-08-04' },
          { id: 'soraia-gomes-da-silva',  prenom: 'Soraia',     nom: 'Gomes Da Silva',     contrat: '35h', entree: '2026-08-25' },
          { id: 'priscillia-brunet',      prenom: 'Priscillia', nom: 'Brunet',             contrat: '24h', entree: '2026-08-25' },
          { id: 'dylan-dabadie',          prenom: 'Dylan',      nom: 'Dabadie',            contrat: '24h', entree: '2026-09-01' },
          { id: 'dorian-mouffet-pinson',  prenom: 'Dorian',     nom: 'Mouffet-Pinson',     contrat: '24h', entree: '2026-08-11' },
          { id: 'leonie-dubois',          prenom: 'Léonie',     nom: 'Dubois',             contrat: '35h', entree: '2026-07-15' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'violette-renaud', prenom: 'Violette', nom: 'Renaud',   contrat: '35h', entree: '2026-07-21' },
          { id: 'yamina-saidi',    prenom: 'Yamina',   nom: 'Saidi',    contrat: '35h', entree: '2026-08-11' },
          { id: 'penda-salifou',   prenom: 'Penda',    nom: 'Salifou',  contrat: '35h', entree: '2026-08-25' },
          { id: 'lea-froustey',    prenom: 'Léa',       nom: 'Froustey', contrat: '35h', entree: '2024-09-24' },
          { id: 'marianne-caliot', prenom: 'Marianne', nom: 'Caliot',   contrat: '35h', entree: '2023-08-01' },
        ],
      },
    ],
  },
]

// Items de suivi par section — regroupés par catégorie pour l'affichage.
// "Grands titres" fournis par Kevin, à détailler plus finement plus tard.
export const SKILL_ITEMS = {
  cvo: [
    { id: 'lecture-ordonnance', label: 'Lecture ordonnance',           category: 'Compétences' },
    { id: 'trame-accueil',      label: "Trame d'accueil",              category: 'Compétences' },
    { id: 'offres',             label: 'Offres',                       category: 'Compétences' },
    { id: 'types-verres',       label: 'Types de verres',              category: 'Compétences' },
    { id: 'traitements',        label: 'Traitements',                  category: 'Compétences' },
    { id: 'montures',           label: 'Montures',                     category: 'Compétences' },
    { id: 'tiers-payants',      label: 'Tiers payants compréhension',  category: 'Compétences' },
    { id: 'backend-cvo',        label: 'Backend',                      category: 'Compétences' },
    { id: 'parcours-telephone', label: 'Parcours téléphone',           category: 'Maîtrise des outils' },
    { id: 'lpt-vision',         label: 'LPT VISION',                   category: 'Maîtrise des outils' },
    { id: 'lpt-sante',          label: 'LPT SANTÉ',                    category: 'Maîtrise des outils' },
    { id: 'slack',              label: 'Slack',                        category: 'Maîtrise des outils' },
    { id: 'granit',             label: 'Granit',                       category: 'Maîtrise des outils' },
  ],
  'mo-sav': [
    { id: 'machines',        label: 'Maitrise et connaissance des machines', category: 'Compétences' },
    { id: 'etapes-montage',  label: 'Étapes de montage',                     category: 'Compétences' },
    { id: 'outlet',          label: 'Outlet',                                category: 'Compétences' },
    { id: 'upgrade',         label: 'Upgrade',                               category: 'Compétences' },
    { id: 'retrait',         label: 'Réaliser un retrait',                   category: 'Compétences' },
    { id: 'raz',             label: 'RAZ',                                   category: 'Compétences' },
    { id: 'suivi-commande',  label: 'Statut suivi de commande',              category: 'Compétences' },
    { id: 'reglage-monture', label: 'Réglage monture',                       category: 'Compétences' },
    { id: 'backend-mosav',   label: 'Backend',                               category: 'Compétences' },
  ],
}

// Trame d'audit par item — la question à poser / consigne pour le formateur
// ou le manager, affichée dans une fenêtre au clic sur l'item. Fournie par
// Kevin pour la partie CVO ; la partie MO/SAV sera complétée plus tard (les
// items sans entrée ici affichent un message "pas encore rédigée").
export const ITEM_GUIDES = {
  'lecture-ordonnance': {
    instruction: "Demander au formateur d'ouvrir le backend afin de faire lire une suite d'ordonnances, pour s'assurer que le CVO sait lire et comprendre les ordonnances.",
  },
  'trame-accueil': {
    instruction: "Comme pour le module Trame d'accueil, faire apparaître la trame devant le formateur et la faire « réciter » au CVO.",
  },
  'offres': {
    instruction: "Afficher les 4 offres devant le formateur et demander au CVO de les présenter.",
    options: ['1=1 (avec ou sans remboursement)', 'Suprême', 'Classique', 'Pack Plan'],
  },
  'types-verres': {
    instruction: 'Faire nommer chaque type de verre.',
    options: ['Unifocal', 'Progressifs', 'Proximité', 'Clariteens', 'ZenProtect'],
  },
  'traitements': {
    instruction: 'Faire nommer les traitements et ce que chacun comprend.',
    optionGroups: [
      { label: 'Traitements verres', options: ['Basic — anti-rayure', 'Premium — anti-rayure, anti-reflet, anti-salissures, hydrophobe', 'Digital Protect Pro — + anti-lumière bleue'] },
      { label: 'Traitements solaires', options: ['UV Protect cat. 3', 'Polarisé', 'Transition'] },
    ],
  },
  'montures': {
    instruction: 'Faire nommer les 3 matériaux de montures.',
    options: ['Plastique injecté', 'Acétate de cellulose', 'Métal'],
  },
  'tiers-payants': {
    instruction: "Le formateur fait tout à l'oral et navigue sur le backend.",
  },
  'backend-cvo': {
    instruction: 'Le formateur navigue sur le backend.',
  },
  'parcours-telephone': {
    instruction: 'Le formateur doit analyser pendant la vente.',
  },
  'lpt-vision': {
    instruction: "En parler pendant l'audit en montrant les propres PDM du CVO en question. Discuter de ce qui est bien ou moins bien et comment améliorer — éventuellement le suivre sur le terrain.",
  },
  'lpt-sante': {
    instruction: 'Suivi et analyse sur le terrain.',
  },
  'slack': {
    instruction: 'Vérifier sur le terrain si le CVO utilise bien Slack Tiers Payant quand le moment se présente.',
  },
  'granit': {
    instruction: 'Lui demander de parler du process Granit et analyser sa réponse.',
  },
}

export const STATUS_ORDER = ['non_acquis', 'en_cours', 'acquis']

export const STATUS_META = {
  non_acquis: { label: 'Non acquis', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  en_cours:   { label: 'En cours',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  acquis:     { label: 'Acquis',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
}

export function nextStatus(status) {
  const i = STATUS_ORDER.indexOf(status)
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length]
}

export function collaborateurFullName(c) {
  return `${c.prenom} ${c.nom}`
}

export function formatDateFr(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function monthsSince(isoDate) {
  const start = new Date(isoDate)
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  return Math.max(months, 0)
}

function formatMonths(months) {
  if (months < 1) return "< 1 mois"
  const rounded = Math.round(months)
  if (rounded < 12) return `${rounded} mois`
  const years = Math.floor(rounded / 12)
  const rem = rounded % 12
  return rem === 0 ? `${years} an${years > 1 ? 's' : ''}` : `${years} an${years > 1 ? 's' : ''} ${rem} mois`
}

// Ancienneté en mois/années, à partir d'une date d'entrée ISO (YYYY-MM-DD).
export function tenureLabel(isoDate) {
  if (!isoDate) return null
  return formatMonths(monthsSince(isoDate))
}

// ── Estimation de l'âge d'une équipe (indicateur formateur/responsable) ──
export const TEAM_LABELS = { cvo: 'Équipe vente', 'mo-sav': 'Équipe support' }

const TEAM_AGE_TIERS = [
  { max: 6,        label: 'Jeune équipe',         icon: '🌱', color: '#00abe9' },
  { max: 18,       label: 'Équipe équilibrée',    icon: '⚖️', color: '#f59e0b' },
  { max: Infinity, label: 'Équipe expérimentée',  icon: '🏆', color: '#22c55e' },
]

// Moyenne simple de l'ancienneté (en mois) des collaborateurs d'une section
// qui ont une date d'entrée renseignée. Retourne null si aucune donnée.
export function teamAge(collaborateurs) {
  const months = (collaborateurs || []).filter(c => c.entree).map(c => monthsSince(c.entree))
  if (!months.length) return null
  const avg = months.reduce((a, b) => a + b, 0) / months.length
  const tier = TEAM_AGE_TIERS.find(t => avg < t.max) || TEAM_AGE_TIERS[TEAM_AGE_TIERS.length - 1]
  return { avgMonths: avg, avgLabel: formatMonths(avg), ...tier }
}
