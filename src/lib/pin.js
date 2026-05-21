// Génère un PIN 4 chiffres déterministe basé sur le nom complet
// Même nom = même PIN toujours, pas besoin de le stocker
export function generatePin(fullName) {
  const str = (fullName || '').toLowerCase().replace(/\s/g, '')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return String(Math.abs(hash) % 9000 + 1000)
}
