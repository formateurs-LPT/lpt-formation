// Suivi magasin — roster et items de compétence par magasin.
// Données saisies à la main (feuille fournie par Kevin), à étendre magasin
// par magasin. La progression réelle (statut/notes par collaborateur) vit
// dans Supabase (table store_followup_progress) — jamais ici.

import { TRAME_ACCUEIL_POINTS } from './modulesData'

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
          { id: 'lola-sallaberry',        prenom: 'Lola',       nom: 'Sallaberry',         contrat: '24h', entree: '2025-09-02' },
          { id: 'nizar-el-sabbagh',       prenom: 'Nizar',      nom: 'El Sabbagh',         contrat: '24h', entree: '2026-09-08' },
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
  // Magasin fictif — bac à sable pour tester le dashboard manager sans
  // toucher aux vraies données Bayonne. Aucune photo (le header gère déjà
  // l'absence de photo). Noms, contrats et anciennetés volontairement variés
  // (courts/longs, récents/anciens) pour éprouver l'affichage.
  {
    id: 'magasin-test',
    label: 'Magasin Test',
    sections: [
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'camille-lefebvre',        prenom: 'Camille',     nom: 'Lefebvre',           contrat: '35h', entree: '2026-09-10' },
          { id: 'hugo-tanguy-lecomte',      prenom: 'Hugo',        nom: 'Tanguy-Lecomte',     contrat: '35h', entree: '2026-08-20' },
          { id: 'ines-abdellaoui',          prenom: 'Inès',        nom: 'Abdellaoui',         contrat: '24h', entree: '2026-07-15' },
          { id: 'maxence-ferreira-silva',   prenom: 'Maxence',     nom: 'Ferreira-Silva',     contrat: '35h', entree: '2026-03-16' },
          { id: 'zoe-rousseau',             prenom: 'Zoé',         nom: 'Rousseau',           contrat: '24h', entree: '2025-09-16' },
          { id: 'nathanael-kouassi',        prenom: 'Nathanaël',   nom: 'Kouassi',            contrat: '35h', entree: '2024-09-16' },
          { id: 'lisa-marie-vasseur',       prenom: 'Lisa-Marie',  nom: 'Vasseur',            contrat: '35h', entree: '2023-09-16' },
          { id: 'rayan-el-amrani',          prenom: 'Rayan',       nom: 'El Amrani',          contrat: '24h', entree: '2021-09-16' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'elodie-chevallier',       prenom: 'Élodie',      nom: 'Chevallier',         contrat: '35h', entree: '2026-08-16' },
          { id: 'theo-da-costa',           prenom: 'Théo',        nom: 'Da Costa',           contrat: '35h', entree: '2026-05-16' },
          { id: 'manon-pires-goncalves',   prenom: 'Manon',       nom: 'Pires-Gonçalves',    contrat: '35h', entree: '2025-09-16' },
          { id: 'yanis-boucherit',         prenom: 'Yanis',       nom: 'Boucherit',          contrat: '35h', entree: '2024-09-16' },
          { id: 'aurelie-lemoine',         prenom: 'Aurélie',     nom: 'Lemoine',            contrat: '35h', entree: '2022-09-16' },
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
    { id: 'verres-progressifs', label: 'Verres progressifs',           category: 'Compétences' },
    { id: 'prises-mesures',     label: 'Prises de mesures',            category: 'Compétences' },
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
    { id: 'verres-progressifs', label: 'Verres progressifs',                 category: 'Compétences' },
    { id: 'prises-mesures',  label: 'Prises de mesures',                     category: 'Compétences' },
    { id: 'backend-mosav',   label: 'Backend',                               category: 'Compétences' },
  ],
}

// Trame d'audit par item — la question à poser / consigne pour le formateur
// ou le manager, affichée dans une fenêtre au clic sur l'item. Fournie par
// Kevin pour la partie CVO ; la partie MO/SAV sera complétée plus tard (les
// items sans entrée ici affichent un message "pas encore rédigée").
//
// Quand c'est possible, le "bloc" de contenu reprend le vrai contenu des
// modules de formation (mêmes textes que ce que voit un formé), affiché en
// un bloc statique — pas de reveal progressif, juste un repère visuel pour
// le formateur/manager pendant l'audit. `missingNote` signale quand une
// partie du contenu demandé n'existe encore dans aucun module.
export const ITEM_GUIDES = {
  // 'lecture-ordonnance' n'utilise plus ce format : voir OrdonnanceExercise.js
  // (exercice interactif de lecture d'ordonnances, pas une simple trame).
  'trame-accueil': {
    instruction: "Le CVO répond point par point (le collaborateur ou toi-même saisit sa réponse). Valide une fois les 4 réponses données, puis affiche la trame pour corriger à l'oral avec lui.",
    steps: TRAME_ACCUEIL_POINTS.map(p => ({ num: p.num, emoji: p.emoji, color: p.color, text: p.text })),
  },
  'offres': {
    instruction: 'Faire présenter chacune des 4 offres par le CVO — contenu repris des modules Offres et Parcours remboursés.',
    questions: [
      'Peux-tu me citer les 4 offres proposées en magasin ?',
      "Quelle est la particularité de l'offre Suprême ?",
      "Dans quel cas conseillerais-tu l'offre 1=1 plutôt que la Classique ?",
      'Qu\'est-ce qui différencie le Pack Plan des autres offres ?',
    ],
    sections: [
      {
        label: 'Suprême', color: '#8B7186',
        bullets: [
          '1 paire achetée, une paire offerte',
          'Choix sur tout le magasin (montures et verres)',
          'Verres Origine France Garantie',
          'Uniquement avec tiers payant complet',
          'Non compatible avec la CSS',
        ],
      },
      {
        label: '1=1', color: '#6aad54',
        bullets: [
          '1 paire achetée',
          'Deuxième paire offerte — de même qualité que la première',
          'Éligible sur tout le magasin — monture et verres au choix',
          'Même en solaire',
        ],
      },
      {
        label: 'Classique', color: '#00abe9',
        bullets: [
          '1 paire achetée',
          'Deuxième paire à -20 %',
          '10 € en 10 minutes — uniquement dans ce parcours',
        ],
      },
      {
        label: 'Pack Plan', color: '#00abe9',
        bullets: [
          '2 paires de lunettes',
          'Monture au choix',
          'Traitement au choix',
          'Solaire inclus — sauf polarisé',
        ],
      },
    ],
  },
  'types-verres': {
    instruction: 'Faire nommer et décrire chaque type de verre — contenu repris du module Types de verres.',
    questions: [
      'Quels types de verres peux-tu me citer ?',
      'Quelle est la différence entre un verre unifocal et un verre progressif ?',
      'À qui proposerais-tu un verre progressif Pulsar Next ?',
    ],
    sections: [
      {
        label: 'Unifocal', color: '#00abe9',
        bullets: ["Correction la plus simple : une seule correction sur toute la surface, pas de zone de flou. Pour un seul problème à corriger, ou pour une paire dédiée à une distance précise chez un presbyte."],
      },
      {
        label: 'Progressif (Pulsar Next)', color: '#7c3aed',
        bullets: ['Verre progressif haut de gamme. Corrige la vision de loin, intermédiaire et de près en une seule paire. Zone de flou réduite au maximum, adaptation plus rapide, confort supérieur aux progressifs classiques.'],
      },
    ],
    missingNote: "Proximité, Clariteens et ZenProtect n'ont pas encore de fiche dans le module Types de verres — à compléter.",
  },
  'traitements': {
    instruction: 'Faire nommer les traitements et ce que chacun comprend.',
    questions: [
      'Quels traitements peux-tu proposer sur les verres ?',
      'Que comprend le traitement Premium par rapport au Basic ?',
      'Quels traitements solaires connais-tu ?',
    ],
    optionGroups: [
      { label: 'Traitements verres', options: ['Basic — anti-rayure', 'Premium — anti-rayure, anti-reflet, anti-salissures, hydrophobe', 'Digital Protect Pro — + anti-lumière bleue'] },
      { label: 'Traitements solaires', options: ['UV Protect cat. 3', 'Polarisé', 'Transition'] },
    ],
    missingNote: "Pas de module dédié aux traitements dans l'app pour l'instant — contenu basé sur ta description, pas sur une vraie slide.",
  },
  'montures': {
    instruction: 'Faire nommer les 3 matériaux de montures — contenu repris du module Connaissances Montures.',
    questions: [
      'Quels sont les 3 matériaux de montures que l\'on retrouve en magasin ?',
      "Quel est l'avantage de l'acétate de cellulose ?",
      'Pourquoi proposer une monture en plastique injecté à un client avec un petit budget ?',
    ],
    sections: [
      {
        label: 'Acétate de cellulose', color: '#00abe9',
        bullets: ['Naturel — fibre de bois ou fibre de coton', 'Premium — large choix de coloris & motifs', 'Modèle unique — chaque paire diffère selon sa plaque', 'Ajustable à chaud — hypoallergénique', 'Prix : de 30 € à 90 €'],
      },
      {
        label: 'Métal', color: '#94a3b8',
        bullets: ['Léger & fin — discret sur le visage', 'Résistant — alliage métallique et revêtement anti-allergique', 'Ajustable facilement — plaquettes et branches réglables', 'Prix : de 30 € à 90 €'],
      },
      {
        label: 'Plastique injecté', color: '#4ade80',
        bullets: ['Moulé à chaud — injecté en série dans un moule industriel', 'Léger & résistant — très bonne durabilité au quotidien', 'Accessible — meilleur rapport qualité/prix de la gamme', 'Prix : 5 € ou 15 €'],
      },
    ],
  },
  'tiers-payants': {
    instruction: "Le formateur fait tout à l'oral et navigue sur le backend.",
    questions: [
      "Comment vérifies-tu les droits d'un client au tiers payant ?",
      "Que fais-tu si le tiers payant du client n'apparaît pas dans le backend ?",
    ],
  },
  'verres-progressifs': {
    instruction: 'Faire réciter ce que le collaborateur a retenu de la formation visio Verres progressifs — contenu repris du module Types de verres.',
    questions: [
      'Quelle est la différence entre un verre progressif et un verre unifocal ?',
      'Quels sont les avantages du Pulsar Next par rapport à un progressif classique ?',
      'À qui proposerais-tu un verre progressif Pulsar Next ?',
    ],
    sections: [
      {
        label: 'Progressif (Pulsar Next)', color: '#7c3aed',
        bullets: ['Verre progressif haut de gamme. Corrige la vision de loin, intermédiaire et de près en une seule paire. Zone de flou réduite au maximum, adaptation plus rapide, confort supérieur aux progressifs classiques.'],
      },
    ],
  },
  'prises-mesures': {
    instruction: 'Faire réciter ce que le collaborateur a retenu de la formation visio Prises de mesures.',
    questions: [
      'Quelles mesures dois-tu prendre pour équiper un client de verres progressifs ?',
      'Comment vérifies-tu qu\'une monture est bien ajustée avant la prise de mesures ?',
    ],
    missingNote: "Pas de module dédié aux prises de mesures dans l'app pour l'instant — à compléter avec le contenu réel de la formation visio.",
  },
  'backend-cvo': {
    instruction: 'Le formateur navigue sur le backend.',
    questions: [
      'Montre-moi comment tu crées une nouvelle commande dans le backend.',
      "Comment retrouves-tu le dossier d'un client déjà venu en magasin ?",
    ],
  },
  'parcours-telephone': {
    instruction: 'Le formateur doit analyser pendant la vente.',
    questions: [
      'Comment démarres-tu un appel avec un client qui souhaite prendre rendez-vous ?',
      'Que dis-tu à un client qui appelle uniquement pour connaître les prix ?',
    ],
  },
  'lpt-vision': {
    instruction: "En parler pendant l'audit en montrant les propres PDM du CVO en question. Discuter de ce qui est bien ou moins bien et comment améliorer — éventuellement le suivre sur le terrain.",
    questions: [
      'Peux-tu me montrer tes derniers PDM sur LPT VISION ?',
      'Qu\'est-ce qui explique tes résultats sur les dernières semaines ?',
    ],
  },
  'lpt-sante': {
    instruction: 'Suivi et analyse sur le terrain.',
    questions: [
      'Comment utilises-tu LPT SANTÉ au quotidien ?',
      'Peux-tu me montrer un dossier santé que tu as suivi récemment ?',
    ],
  },
  'slack': {
    instruction: 'Vérifier sur le terrain si le CVO utilise bien Slack Tiers Payant quand le moment se présente.',
    questions: [
      'Dans quel cas utilises-tu le canal Slack Tiers Payant ?',
      'Peux-tu me montrer un message que tu as envoyé récemment sur ce canal ?',
    ],
  },
  'granit': {
    instruction: 'Lui demander de parler du process Granit et analyser sa réponse.',
    questions: [
      'Peux-tu m\'expliquer le process Granit ?',
      'Dans quelle situation utilises-tu Granit ?',
    ],
  },
}

export const STATUS_META = {
  non_acquis: { label: 'Non acquis', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  en_cours:   { label: 'En cours',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  acquis:     { label: 'Acquis',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
}

// ── Notation par item (1 à 5) ────────────────────────────────────
// Le formateur/manager attribue une note à l'issue de l'échange sur un item ;
// le statut (non acquis / en cours / acquis) en découle automatiquement, il
// n'est plus modifiable directement — ça évite de cliquer "Acquis" sans
// vraiment avoir creusé le sujet, et rend l'historique parlant (progression
// des notes d'une visite à l'autre plutôt qu'un simple statut répété).
export const SCORE_ORDER = [1, 2, 3, 4, 5]

export const SCORE_LABELS = {
  1: 'Ne sait pas répondre',
  2: 'Confus, réponses erronées',
  3: 'Partiel, hésite encore',
  4: 'Maîtrise, quelques imprécisions',
  5: 'Maîtrise complète, autonome',
}

export function scoreToStatus(score) {
  if (score == null) return null
  if (score <= 2) return 'non_acquis'
  if (score === 3) return 'en_cours'
  return 'acquis'
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

// ── Historique d'audits ──────────────────────────────────────────
// Un audit par jour (pas par clic) : plusieurs modifications le même jour
// affinent l'évaluation du jour, mais un nouveau jour crée une nouvelle
// entrée d'historique — rien n'est jamais écrasé d'une visite à l'autre.
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

