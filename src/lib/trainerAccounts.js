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
  'chanu valentine',
  'dimanche jonathan',
])

/**
 * Prénom réel de chaque compte de test — l'appli demande de saisir "nom et
 * prénom" (donc souvent nom de famille en premier), donc deviner le prénom
 * comme "premier mot saisi" affichait "Bonjour Bahougne" au lieu de
 * "Bonjour Quentin". Ces comptes sont en nombre fixe et connu, autant fixer
 * le bon prénom plutôt que deviner selon l'ordre de saisie.
 */
const TEST_ACCOUNT_PRENOMS = {
  'bahougne quentin': 'Quentin',
  'dupuy kevin': 'Kevin',
  'duchemin thomas': 'Thomas',
  'huchet nadege': 'Nadège',
  'chanu valentine': 'Valentine',
  'dimanche jonathan': 'Jonathan',
}

export function trainerAccountPrenom(name) {
  return TEST_ACCOUNT_PRENOMS[normalizeNameKey(name)] || ''
}

/**
 * Un nom saisi avec une variante (espace en trop, mention ajoutée type
 * "(formateur)"…) ne matchait pas l'égalité stricte de l'ancien filtre et le
 * compte de test repassait dans les notes des formés. On vérifie désormais
 * que les mots du prénom+nom sont tous présents, peu importe le reste.
 */
export function isTrainerAccount(name) {
  const words = new Set(normalizeNameKey(name).split(' ').filter(Boolean))
  for (const key of TEST_ACCOUNT_KEYS) {
    if (key.split(' ').every(w => words.has(w))) return true
  }
  return false
}
