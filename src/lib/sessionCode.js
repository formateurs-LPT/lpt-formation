export const STORAGE_TRAINER_ROOM = 'lpt_active_room_code'
export const STORAGE_PARTICIPANT_ROOM = 'lpt_participant_session_code'

/** Code legacy (.env) — coexistence tant que multi-salles en test */
export function getLegacySessionCode() {
  const raw = process.env.NEXT_PUBLIC_SESSION_CODE ?? ''
  const trimmed = String(raw).trim().replace(/^['"]|['"]$/g, '')
  return trimmed || 'LPT2026'
}

export function readTrainerActiveRoomCode() {
  if (typeof window === 'undefined') return ''
  return (localStorage.getItem(STORAGE_TRAINER_ROOM) || '').trim()
}

export function setTrainerActiveRoomCode(code) {
  if (typeof window === 'undefined') return
  const c = (code || '').trim()
  if (c) localStorage.setItem(STORAGE_TRAINER_ROOM, c)
  else localStorage.removeItem(STORAGE_TRAINER_ROOM)
}

export function readParticipantSessionCode() {
  if (typeof window === 'undefined') return ''
  return (localStorage.getItem(STORAGE_PARTICIPANT_ROOM) || '').trim()
}

export function setParticipantSessionCode(code) {
  if (typeof window === 'undefined') return
  const c = (code || '').trim()
  if (c) localStorage.setItem(STORAGE_PARTICIPANT_ROOM, c)
  else localStorage.removeItem(STORAGE_PARTICIPANT_ROOM)
}

/** Priorité : salle active localStorage → fallback LPT2026 / .env */
export function resolveSessionCode(role = 'any') {
  if (typeof window !== 'undefined') {
    if (role === 'participant' || role === 'any') {
      const participant = readParticipantSessionCode()
      if (participant) return participant
    }
    if (role === 'trainer' || role === 'any') {
      const trainer = readTrainerActiveRoomCode()
      if (trainer) return trainer
    }
  }
  return getLegacySessionCode()
}

export function buildJoinUrl(code, baseUrl = 'https://lpt-formation.vercel.app') {
  const room = (code || '').trim()
  const url = new URL(baseUrl)
  url.searchParams.set('join', '1')
  if (room) url.searchParams.set('code', room)
  return url.toString()
}

/** Lit ?code= dans l’URL participant et le mémorise */
export function captureParticipantRoomFromUrl() {
  if (typeof window === 'undefined') return ''
  const code = new URLSearchParams(window.location.search).get('code')?.trim()
  if (code) setParticipantSessionCode(code)
  return code || ''
}
