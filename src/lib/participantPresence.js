import {
  filterParticipantsInRh,
  loadEntreesList,
} from './participantNames'
import { pgEq, sbSelect, sbUpdate, sbUpsert } from './supabase'

/** Intervalle heartbeat navigateur */
export const PRESENCE_HEARTBEAT_MS = 45_000

/** Au-delà : considéré hors ligne (si left_at null) */
export const PRESENCE_STALE_MS = 90_000

export function isParticipantRowOnline(row, now = Date.now()) {
  if (!row) return false
  if (row.left_at) return false
  const seen = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0
  if (!seen) return true
  return now - seen <= PRESENCE_STALE_MS
}

export function filterOnlineParticipants(rows, entrees) {
  const inRh = entrees?.length
    ? filterParticipantsInRh(rows || [], entrees)
    : (rows || [])
  return inRh.filter(isParticipantRowOnline)
}

export async function touchParticipantPresence(sessionCode, name) {
  const code = (sessionCode || '').trim()
  const participantName = (name || '').trim()
  if (!code || !participantName) return false

  const now = new Date().toISOString()
  const result = await sbUpsert(
    'participants',
    {
      session_code: code,
      name: participantName,
      left_at: null,
      last_seen_at: now,
    },
    'session_code,name'
  )
  return result != null
}

export async function markParticipantLeft(sessionCode, name) {
  const code = (sessionCode || '').trim()
  const participantName = (name || '').trim()
  if (!code || !participantName) return

  await sbUpdate(
    'participants',
    { left_at: new Date().toISOString() },
    `session_code=eq.${encodeURIComponent(code)}&${pgEq('name', participantName)}`
  )
}

/** PATCH keepalive pour fermeture d'onglet */
export function markParticipantLeftBeacon(sessionCode, name) {
  const code = (sessionCode || '').trim()
  const participantName = (name || '').trim()
  if (!code || !participantName || typeof window === 'undefined') return

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return

  const filter = `session_code=eq.${encodeURIComponent(code)}&${pgEq('name', participantName)}`
  fetch(`${url}/rest/v1/participants?${filter}`, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ left_at: new Date().toISOString() }),
    keepalive: true,
  }).catch(() => {})
}

export async function fetchOnlineParticipantCount(sessionCode) {
  const code = (sessionCode || '').trim()
  if (!code) return 0

  const [rows, entrees] = await Promise.all([
    sbSelect('participants', `session_code=eq.${encodeURIComponent(code)}`),
    loadEntreesList(),
  ])
  return filterOnlineParticipants(rows || [], entrees).length
}

export async function fetchOnlineParticipantsList(sessionCode) {
  const code = (sessionCode || '').trim()
  if (!code) return []

  const [rows, entrees] = await Promise.all([
    sbSelect('participants', `session_code=eq.${encodeURIComponent(code)}`),
    loadEntreesList(),
  ])
  return filterOnlineParticipants(rows || [], entrees)
}

export async function isSessionEnded(sessionCode) {
  const code = (sessionCode || '').trim()
  if (!code) return false
  const rows = await sbSelect('sessions', `code=eq.${encodeURIComponent(code)}&limit=1`)
  return rows?.[0]?.status === 'ended'
}
