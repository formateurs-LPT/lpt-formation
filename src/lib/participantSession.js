import { sbSelect } from './supabase'
import {
  captureParticipantRoomFromUrl,
  isDynamicRoomCode,
  readParticipantSessionCode,
  setParticipantSessionCode,
} from './sessionCode'
import { filterOpenSessionsForEntree, noRoomMessageForEntree } from './formationCategories'

const OPEN_STATUSES = new Set(['waiting', 'active'])

/**
 * Code salle pour un collaborateur : URL / QR / localStorage, sinon salle ouverte compatible.
 * N'utilise plus LPT2026 par défaut si cette session est terminée.
 */
export async function resolveParticipantSessionCode(entree) {
  captureParticipantRoomFromUrl()

  const urlCode = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('code')?.trim()
    : ''
  let code = readParticipantSessionCode() || urlCode
  if (urlCode) setParticipantSessionCode(urlCode)

  if (code) {
    const rows = await sbSelect('sessions', `code=eq.${encodeURIComponent(code)}&limit=1`)
    const session = rows?.[0]
    if (session && OPEN_STATUSES.has(session.status)) {
      return { ok: true, code, session }
    }
    setParticipantSessionCode('')
    code = ''
  }

  const rows = await sbSelect('sessions', 'order=started_at.desc')
  // Compte test : rejoint n'importe quelle session ouverte sans filtre catégorie
  const open = entree?._isTest
    ? (rows || []).filter(s => OPEN_STATUSES.has(s?.status))
    : filterOpenSessionsForEntree(rows, entree)
  if (!open.length) {
    return {
      ok: false,
      reason: 'no_room',
      message: noRoomMessageForEntree(entree),
    }
  }

  const picked = open[0]
  setParticipantSessionCode(picked.code)
  return {
    ok: true,
    code: picked.code,
    session: picked,
    autoPicked: open.length > 1,
  }
}

export function participantJoinBlockedMessage(reason, fallbackMessage) {
  if (reason === 'no_room') return fallbackMessage || 'Aucune salle ouverte. Scannez le QR affiché par le formateur.'
  if (reason === 'ended_stale') {
    return isDynamicRoomCode(readParticipantSessionCode())
      ? 'Cette salle est terminée. Scannez le nouveau QR du formateur.'
      : 'Scannez le QR code affiché par le formateur pour rejoindre la salle.'
  }
  return 'Aucune salle active. Scannez le QR du formateur ou demandez le code salle.'
}
