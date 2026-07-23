/**
 * Directeurs Régionaux LPT et leurs territoires
 *
 * Bryan      : Belgique + Lille
 * Sarah      : Île-de-France + Nord France (sauf Lille)
 * Alexandre  : Sud de la France (Lyon compris)
 */

export const DIRECTEURS = {
  bryan: {
    name: 'Bryan',
    fullName: 'Bryan',
    territory: 'Belgique + Lille',
    icon: '🇧🇪',
    color: '#db2777',
  },
  sarah: {
    name: 'Sarah Vaillant',
    fullName: 'Sarah Vaillant',
    territory: 'Île-de-France + Nord France',
    icon: '🗺️',
    color: '#0089ba',
  },
  alexandre: {
    name: 'Alexandre Faye',
    fullName: 'Alexandre Faye',
    territory: 'Sud de la France',
    icon: '☀️',
    color: '#d97706',
  },
}

function norm(s) {
  return (s || '').toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const BRYAN_MAGASINS = [
  'namur', 'liege', 'fripier', 'fripiers', 'ixelles', 'charleroi', 'bruxelles', 'lille',
]

const ALEXANDRE_MAGASINS = [
  'bayonne', 'anglet', 'bordeaux', 'lyon', 'marseille', 'montpellier', 'nice',
  'toulon', 'toulouse', 'blagnac',
]

/**
 * Retourne la clé du DR ('bryan' | 'sarah' | 'alexandre') pour un magasin donné.
 * Si aucun DR correspondant, retourne null.
 */
export function classifyDR(magasin) {
  const m = norm(magasin)
  if (!m) return null
  if (BRYAN_MAGASINS.some(b => m.includes(b))) return 'bryan'
  if (ALEXANDRE_MAGASINS.some(a => m.includes(a))) return 'alexandre'
  // Sarah : IDF + nord (tout le reste)
  return 'sarah'
}
