// Créneaux des formations visio complémentaires — grille fixe pour l'instant
// (tous les lundis à venir × 10h-17h), calendrier unique partagé par tous les
// magasins. Pas d'interface d'administration en v1 : pour fermer/ajouter un
// créneau il faudra modifier ce fichier.

export const TRAINING_THEMES = [
  { id: 'tiers-payant', label: 'Tiers payant' },
  { id: 'verres-progressifs', label: 'Verres progressifs' },
  { id: 'prises-mesures', label: 'Prises de mesures' },
]

export const TRAINING_HOURS = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export const SLOT_CAPACITY = 10

export function formatSlotDate(dateISO) {
  const d = new Date(`${dateISO}T00:00:00`)
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Format YYYY-MM-DD en date LOCALE — toISOString() convertit en UTC et peut
// décaler d'un jour selon le fuseau (ex: minuit en France = la veille en UTC).
function toLocalISODate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Les n prochains lundis, à partir du prochain (aujourd'hui exclu, même si
// on est déjà lundi — évite d'inscrire quelqu'un le jour même).
export function getUpcomingMondays(n = 8) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() // 0 = dimanche, 1 = lundi, ...
  d.setDate(d.getDate() + ((8 - day) % 7 || 7))

  const mondays = []
  for (let i = 0; i < n; i++) {
    const dateISO = toLocalISODate(d)
    mondays.push({ dateISO, label: formatSlotDate(dateISO) })
    d.setDate(d.getDate() + 7)
  }
  return mondays
}

export function formatHeure(heure) {
  return heure.replace(':00', 'h').replace(/^0/, '')
}

// Date du jour en LOCAL (pas todayISO() de storeFollowupData.js, qui utilise
// toISOString() et peut décaler d'un jour selon le fuseau près de minuit).
export function todayISODateLocal() {
  return toLocalISODate(new Date())
}
