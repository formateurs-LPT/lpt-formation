'use client'
// Après une mise en ligne, une page ouverte avant tourne encore avec
// l'ancienne version : dès qu'elle a besoin d'un morceau de l'app pas encore
// chargé, ce morceau n'existe plus sur le serveur et l'écran plantait
// (Mateo puis Valentine, 18/11, en pleine formation). On recharge alors la
// page une fois, toute seule — l'état de la salle est en base, rien n'est perdu.
const CLE = 'lpt_rechargement_maj'

export function estErreurDeMiseEnLigne(erreur) {
  const texte = `${erreur?.name || ''} ${erreur?.message || erreur || ''}`
  return /ChunkLoadError|Loading chunk|Failed to load chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(texte)
}

// Recharge au plus une fois par minute, pour ne jamais boucler.
export function rechargerSiMiseEnLigne(erreur) {
  if (typeof window === 'undefined' || !estErreurDeMiseEnLigne(erreur)) return false
  try {
    const dernier = Number(sessionStorage.getItem(CLE) || 0)
    if (Date.now() - dernier < 60000) return false
    sessionStorage.setItem(CLE, String(Date.now()))
  } catch { /* stockage indisponible : on recharge quand même */ }
  window.location.reload()
  return true
}
