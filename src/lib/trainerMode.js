// Mode de travail persistant du formateur (présentiel Paris / visio Province /
// Belgique) — mémorisé jusqu'à changement manuel, pour ne plus avoir à
// rechoisir son groupe à chaque entrée dans l'Onboarding.
const KEY = 'trainer_current_mode'

export function readTrainerMode() {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(KEY)
  return (v === 'paris' || v === 'province' || v === 'belgique') ? v : null
}

export function setTrainerMode(slug) {
  if (typeof window === 'undefined') return
  if (slug === 'paris' || slug === 'province' || slug === 'belgique') {
    localStorage.setItem(KEY, slug)
  } else {
    localStorage.removeItem(KEY)
  }
}

export const TRAINER_MODE_META = {
  paris:    { emoji: '🏢', label: 'Présentiel' },
  province: { emoji: '💻', label: 'Visio' },
  belgique: { emoji: '🇧🇪', label: 'Belgique' },
}
