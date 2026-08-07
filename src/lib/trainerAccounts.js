// Détection des comptes de test formateur — module sans dépendance (ni sur
// supabase.js ni sur participantNames.js) pour pouvoir être importé aussi bien
// depuis supabase.js que depuis participantNames.js sans import circulaire.

/** Clé de comparaison : mots triés, sans accents (ordre prénom/nom libre) */
export function normalizeNameKey(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[''`\-–—]/g, ' ')
    .replace(/[^a-z\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')
}

export const TEST_ACCOUNT_KEYS = new Set([
  'bahougne quentin',
  'dupuy kevin',
  'duchemin thomas',
  'huchet nadege',
])

export function isTrainerAccount(name) {
  return TEST_ACCOUNT_KEYS.has(normalizeNameKey(name))
}
