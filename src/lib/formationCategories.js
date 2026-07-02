/**
 * Registre des catégories de formation (salles + filtre participant).
 *
 * Ajouter une catégorie :
 *   1. Entrée dans FORMATION_CATEGORIES (slug, label, order, emoji…)
 *   2. (Optionnel) Règle dans MAGASIN_ZONE_DEFAULT_CATEGORY si déduction par magasin
 *   3. sessions.room_type utilise le même slug en BDD
 *   4. entrees_data.formation_category peut forcer le slug par collaborateur
 *
 * Aucun if (paris) / if (visio) ailleurs : tout passe par ce fichier.
 */

const PARIS_MAGASINS = [
  'chatelet', 'st lazare', 'saint lazare', 'montparnasse', 'italie', 'commerce',
  'bastille', 'cergy', 'creteil', 'créteil', 'belle epine', 'belle épine', 'paris',
  'st ouen', 'saint ouen', 'ouen', 'beauchamp', 'odysseum', 'supply',
]
const BELGIQUE_MAGASINS = ['namur', 'liege', 'liège', 'fripier', 'ixelles', 'charleroi', 'bruxelles']

/** @type {Record<string, { label: string, shortLabel: string, subLabel?: string, order: number, emoji: string }>} */
export const FORMATION_CATEGORIES = {
  presentiel: {
    label: 'Présentiel · Paris',
    shortLabel: 'Présentiel',
    subLabel: 'Paris',
    order: 1,
    emoji: '🏢',
  },
  visio: {
    label: 'Visio · Province & Belgique',
    shortLabel: 'Visio',
    subLabel: 'Province · Belgique',
    order: 2,
    emoji: '💻',
  },
}

/** Zone magasin RH → catégorie par défaut (si entree.formation_category absent) */
const MAGASIN_ZONE_DEFAULT_CATEGORY = {
  paris: 'presentiel',
  province: 'visio',
  belgique: 'visio',
}

const SLUG_RE = /^[a-z][a-z0-9_]{0,31}$/

export function isValidFormationCategorySlug(slug) {
  const s = (slug || '').trim()
  return Boolean(s && SLUG_RE.test(s) && s in FORMATION_CATEGORIES)
}

export function classifyMagasin(magasin) {
  const m = (magasin || '').toLowerCase()
  if (BELGIQUE_MAGASINS.some(b => m.includes(b))) return 'belgique'
  if (PARIS_MAGASINS.some(p => m.includes(p))) return 'paris'
  return 'province'
}

/**
 * Catégorie d’un collaborateur RH.
 * Priorité : formation_category explicite → repli magasin.
 */
export function resolveCategoryFromEntree(entree) {
  const explicit = (entree?.formation_category || '').trim()
  if (isValidFormationCategorySlug(explicit)) return explicit

  const zone = classifyMagasin(entree?.magasin)
  return MAGASIN_ZONE_DEFAULT_CATEGORY[zone] || null
}

/** Liste triée pour UI (création salle, onboarding, liste participant) */
export function listFormationCategories() {
  return Object.entries(FORMATION_CATEGORIES)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([slug, meta]) => ({ slug, ...meta }))
}

export function getCategoryMeta(slug) {
  return FORMATION_CATEGORIES[slug] || null
}

export function getCategoryLabel(slug) {
  return getCategoryMeta(slug)?.label || slug || ''
}

export function getCategoryDisplayTitle(slug) {
  const meta = getCategoryMeta(slug)
  if (!meta) return slug || ''
  return `${meta.emoji} ${meta.label}`
}

export function formatDefaultRoomLabel(categorySlug, trainerName) {
  const meta = getCategoryMeta(categorySlug)
  const who = (trainerName || '').trim()
  if (!meta) return who || categorySlug
  return who ? `${meta.shortLabel} — ${who}` : meta.label
}

/** Comptage par catégorie (onboarding, stats) */
export function countEntreesByCategory(entrees) {
  const counts = Object.fromEntries(
    Object.keys(FORMATION_CATEGORIES).map(slug => [slug, 0])
  )
  for (const e of entrees || []) {
    const cat = resolveCategoryFromEntree(e)
    if (cat && cat in counts) counts[cat] += 1
  }
  return counts
}

/**
 * Filtre onboarding / liste participant.
 * Sans magasin ni formation_category → visible dans tous les groupes (legacy).
 */
export function entreeMatchesCategory(entree, categorySlug) {
  if (!isValidFormationCategorySlug(categorySlug)) return false

  const hasMagasin = !!(entree?.magasin || '').trim()
  const hasExplicit = !!(entree?.formation_category || '').trim()
  if (!hasMagasin && !hasExplicit) return true

  return resolveCategoryFromEntree(entree) === categorySlug
}

export function sessionMatchesEntree(session, entree) {
  const cat = resolveCategoryFromEntree(entree)
  if (!cat || !session?.room_type) return false
  return session.room_type === cat
}

const OPEN_ROOM_STATUSES = new Set(['waiting', 'active'])

/** Salles ouvertes compatibles avec un collaborateur */
export function filterOpenSessionsForEntree(sessions, entree) {
  return (sessions || []).filter(
    s => OPEN_ROOM_STATUSES.has(s?.status) && sessionMatchesEntree(s, entree)
  )
}

/** Message si aucune salle ouverte pour la catégorie */
export function noRoomMessageForEntree(entree) {
  const cat = resolveCategoryFromEntree(entree)
  const label = getCategoryLabel(cat) || 'cette catégorie'
  return `Aucune salle ${label} n'est ouverte pour le moment.`
}
