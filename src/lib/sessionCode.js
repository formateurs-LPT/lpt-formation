export const STORAGE_TRAINER_ROOM = 'lpt_active_room_code'
export const STORAGE_PARTICIPANT_ROOM = 'lpt_participant_session_code'

/**
 * Domaine public stable de l'appli — à utiliser pour TOUT lien/QR destiné à
 * quelqu'un d'autre que le formateur sur son propre appareil (formés, managers,
 * clients…). Ne jamais utiliser window.location.origin pour ces liens : si le
 * formateur consulte l'appli depuis une URL de preview/déploiement Vercel, ces
 * URLs sont protégées par l'authentification Vercel et le destinataire tombe
 * sur l'écran de connexion Vercel au lieu de l'appli.
 */
export const PUBLIC_ORIGIN = 'https://lpt-formation.vercel.app'

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

/**
 * Code salle pour sync trainer_state + sessions (participant, TV, formateur).
 * Même logique que useModuleSync — une seule source de vérité.
 */
export function resolveRoomStateCode() {
  if (typeof window === 'undefined') {
    return getLegacySessionCode()
  }
  const params = new URLSearchParams(window.location.search)
  const mode = params.get('mode')

  // TV diffusion (priorité absolue)
  if (mode === 'tv') {
    const stored = readTrainerActiveRoomCode()
    const urlCode = getTvUrlRoomCode()
    if (stored && isDynamicRoomCode(stored)) return stored
    if (urlCode && isDynamicRoomCode(urlCode)) return urlCode
  }

  // Formateur connecté → salle active formateur (pas le code participant résiduel)
  if (localStorage.getItem('trainer_name')) {
    return readTrainerActiveRoomCode() || getLegacySessionCode()
  }

  // Participant
  if (mode === 'participant' || localStorage.getItem('participant_name')) {
    return readParticipantSessionCode() || getLegacySessionCode()
  }

  const trainer = readTrainerActiveRoomCode()
  if (trainer) return trainer

  return getLegacySessionCode()
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

/**
 * Image QR (api.qrserver.com) pointant vers l’URL de join avec code salle.
 * Pointe toujours vers le domaine de production (jamais window.location.origin) :
 * si le formateur affiche le diffuseur depuis une URL de preview Vercel
 * (déploiement de branche, URL par commit…), cette URL est protégée par
 * Vercel (authentification SSO) et les formés scannant le QR tombaient sur
 * l'écran de connexion Vercel au lieu de l'appli.
 */
export function buildQrImageUrl(roomCode, baseUrl) {
  const origin = (baseUrl || '').trim() || 'https://lpt-formation.vercel.app'
  const joinUrl = buildJoinUrl(roomCode, origin)
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=ffffff&bgcolor=0a2a5c&data=${encodeURIComponent(joinUrl)}`
}

/** Lit ?code= dans l’URL participant et le mémorise */
export function captureParticipantRoomFromUrl() {
  if (typeof window === 'undefined') return ''
  const code = new URLSearchParams(window.location.search).get('code')?.trim()
  if (code) setParticipantSessionCode(code)
  return code || ''
}

/** Mode TV : lit ?mode=tv&room=XXXX (ne modifie plus le localStorage). */
export function captureTvRoomFromUrl() {
  return getTvUrlRoomCode()
}

/** True si le code est une salle dynamique (pas le legacy LPT2026 / .env) */
export function isDynamicRoomCode(code) {
  const c = (code || '').trim()
  if (!c) return false
  return c !== getLegacySessionCode()
}

export function isActiveDynamicRoom() {
  return isDynamicRoomCode(readTrainerActiveRoomCode())
}

export function buildTvUrl(code, basePath = '/') {
  const room = (code || '').trim()
  const root = basePath.endsWith('/') ? basePath : `${basePath}/`
  if (!room || !isDynamicRoomCode(room)) return `${root}?mode=tv`
  return `${root}?mode=tv&room=${encodeURIComponent(room)}`
}

/** Code salle dans l’URL TV (?mode=tv&room=…) — lecture seule */
export function getTvUrlRoomCode() {
  if (typeof window === 'undefined') return ''
  const params = new URLSearchParams(window.location.search)
  if (params.get('mode') !== 'tv') return ''
  return params.get('room')?.trim() || ''
}

/** Code salle affiché sur l'écran TV (?room= prioritaire, sans réécrire le localStorage). */
export function getTvDisplayRoomCode() {
  const fromUrl = getTvUrlRoomCode()
  if (fromUrl) return fromUrl
  return readTrainerActiveRoomCode()
}
