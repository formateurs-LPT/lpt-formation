import { getRoomSharedState, setRoomSharedState } from './supabase'

/**
 * Fusionne une réponse participant dans un champ objet de trainer_state (freins_responses, etc.)
 * Toujours passer le code salle explicite pour éviter les écritures sur LPT2026 / mauvaise salle.
 */
export async function mergeRoomSharedField(roomCode, field, participantName, value) {
  const code = (roomCode || '').trim()
  const key = (field || '').trim()
  const name = (participantName || '').trim()
  if (!code || !key || !name) {
    console.error('[mergeRoomSharedField] paramètres manquants', { code, key, name })
    return false
  }

  const room = await getRoomSharedState(code)
  const current = room?.[key] && typeof room[key] === 'object' && !Array.isArray(room[key])
    ? room[key]
    : {}
  const next = { ...current, [name]: value }
  const result = await setRoomSharedState({ [key]: next }, code)
  return result != null
}
