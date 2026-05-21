// Génère un PIN 4 chiffres déterministe basé sur le nom complet
// Insensible à l'ordre ET aux caractères spéciaux (tirets, deux-points, etc.)
// "MAISONDIEU– LAFORGE: AURIANE" = "Auriane Maisondieu Laforge" = même PIN
export function generatePin(fullName) {
  const str = (fullName || '')
    .toLowerCase()
    .replace(/[^a-zàâäéèêëîïôùûüç\s]/gi, '') // supprime tirets, deux-points, etc.
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join('')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return String(Math.abs(hash) % 9000 + 1000)
}
