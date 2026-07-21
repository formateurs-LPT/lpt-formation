import { getSessionCode } from './env'
import { resolveSessionCode, resolveRoomStateCode, getLegacySessionCode } from './sessionCode'

// Lu au build / au démarrage de `next dev` depuis .env.local (NEXT_PUBLIC_*)
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const SESSION_CODE = process.env.NEXT_PUBLIC_SESSION_CODE ?? ''

/** Clé trainer_state pour la liste RH globale */
export const TRAINER_STATE_WEEKLY_KEY = '__weekly__'

/** Champs stockés sur __weekly__ (pas par salle) */
const WEEKLY_STATE_KEYS = new Set(['entrees_data', 'ob_data', 'ob_date', 'ob_day', 'lpt_idees'])

/** Filtre PostgREST pour valeurs avec espaces / accents */
export function pgEq(column, value) {
  // Les guillemets et espaces dans l'URL doivent être encodés pour iOS Safari
  const v = String(value ?? '').replace(/"/g, '""')
  return `${column}=eq.${encodeURIComponent('"' + v + '"')}`
}

/**
 * Code session effectif : salle active (localStorage) puis fallback .env / LPT2026.
 * @param {'any'|'trainer'|'participant'} role
 */
export function getRuntimeSessionCode(role = 'any') {
  const resolved = resolveSessionCode(role)
  if (resolved) return resolved

  const raw = process.env.NEXT_PUBLIC_SESSION_CODE ?? ''
  const trimmed = String(raw).trim().replace(/^['"]|['"]$/g, '')
  if (trimmed) return trimmed
  try {
    return getSessionCode()
  } catch {
    return getLegacySessionCode()
  }
}

/** Code session formateur / modules / TV (salle active ou legacy) */
export function getActiveSessionCode() {
  return getRuntimeSessionCode('trainer') || SESSION_CODE || getLegacySessionCode()
}

/** Code session participant (QR ou liste salles) */
export function getParticipantSessionCode() {
  return getRuntimeSessionCode('participant') || getActiveSessionCode()
}

function assertSupabaseConfigured() {
  if (!SB_URL || !SB_KEY) {
    throw new Error(
      'Supabase non configuré : créez .env.local (npm run setup), puis redémarrez complètement npm run dev.'
    )
  }
}

function sbHeaders() {
  assertSupabaseConfigured()
  return {
    apikey: SB_KEY,
    Authorization: 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json',
  }
}

export async function sbSelect(table, filter = null) {
  let url = `${SB_URL}/rest/v1/${table}?select=*`
  if (filter) url += '&' + filter
  const r = await fetch(url, { headers: sbHeaders() })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    const msg = String(err?.message || err?.hint || '')
    const missingTable = r.status === 404 && /could not find the table/i.test(msg)
    if (missingTable) {
      console.warn('[sbSelect] table absente:', table)
      return []
    }
    console.error('[sbSelect]', table, r.status, err?.message || err?.code || err)
    return []
  }
  return await r.json()
}

/** false si la table n'existe pas (404 schema cache) */
export async function isSupabaseTableAvailable(table) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?select=*&limit=0`, { headers: sbHeaders() })
  if (r.ok) return true
  const err = await r.json().catch(() => ({}))
  return !(r.status === 404 && /could not find the table/i.test(String(err?.message || '')))
}

export async function sbUpsert(table, data, onConflict) {
  let url = `${SB_URL}/rest/v1/${table}`
  if (onConflict) url += '?on_conflict=' + onConflict
  const headers = { ...sbHeaders(), Prefer: 'resolution=merge-duplicates,return=representation' }
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    console.error(
      'sbUpsert error',
      table,
      r.status,
      err?.message || err?.hint || err?.details || err?.code || err
    )
    return null
  }
  return await r.json()
}

export async function sbInsert(table, data) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    console.error('sbInsert error', table, r.status, err?.message || err?.hint || err?.details || err)
  }
  return r.ok
}

function parseJsonField(value, fallback) {
  if (value == null) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

/** Schéma prod session_history : session_code, session_date, trainer_name, participants/quiz_results/scenario_responses (jsonb) */
export async function insertSessionHistory({
  sessionCode,
  sessionDate,
  trainerName,
  participants = [],
  quizResults = [],
  scenarioResponses = [],
}) {
  const row = {
    session_code: sessionCode,
    session_date: String(sessionDate || '').slice(0, 10),
    participants,
    quiz_results: quizResults,
    scenario_responses: scenarioResponses,
  }
  if (trainerName) row.trainer_name = trainerName
  return sbInsert('session_history', row)
}

export function parseSessionHistorySummary(row) {
  const quizResults = parseJsonField(row?.quiz_results, [])
  if (quizResults?.type === 'onboarding_week') {
    return {
      notes: quizResults.notes || '—',
      count: quizResults.participant_count ?? 0,
    }
  }

  if (quizResults?.type === 'room_archive') {
    const count = Array.isArray(participants) ? participants.length : 0
    const label = quizResults.label || quizResults.room_code || 'Salle'
    return {
      notes: `${label}${count ? ` · ${count} participant${count > 1 ? 's' : ''}` : ''}`,
      count,
    }
  }

  const participants = parseJsonField(row?.participants, [])
  const count = Array.isArray(participants) ? participants.length : 0
  const trainer = row?.trainer_name?.trim()
  return {
    notes: trainer
      ? `Session — ${trainer}${count ? ` · ${count} participant${count > 1 ? 's' : ''}` : ''}`
      : count
        ? `Session — ${count} participant${count > 1 ? 's' : ''}`
        : '—',
    count,
  }
}

/** Garantit une ligne sessions (FK participants / quiz_answers) */
export async function ensureSession(sessionCode) {
  const code = (sessionCode || getRuntimeSessionCode()).trim()
  if (!code) {
    console.error('[ensureSession] code session manquant')
    return false
  }
  const result = await sbUpsert(
    'sessions',
    { code, current_step: -1, active_scenario: 0, status: 'active' },
    'code'
  )
  return result != null
}

export async function sbUpdate(table, data, filter) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { ...sbHeaders(), Prefer: 'return=minimal' },
    body: JSON.stringify(data),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    console.error('[sbUpdate]', table, r.status, err?.message || err?.code || err)
  }
  return r.ok
}

export async function sbDelete(table, filter) {
  await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: sbHeaders(),
  })
}

// ── Trainer auth depuis la table Supabase ─────────────────────────
export async function getTrainerFromDB(login) {
  try {
    const rows = await sbSelect('trainers', `login=eq.${encodeURIComponent(login)}&active=eq.true`)
    return rows?.[0] || null
  } catch { return null }
}

function parseTrainerStateRow(row) {
  let state = row?.state ?? {}
  if (typeof state === 'string') {
    try {
      state = JSON.parse(state)
    } catch {
      state = {}
    }
  }
  return state && typeof state === 'object' ? state : {}
}

function pickWeeklyFields(state) {
  const out = {}
  for (const key of WEEKLY_STATE_KEYS) {
    if (state?.[key] !== undefined) out[key] = state[key]
  }
  return out
}

async function fetchTrainerStateByKey(trainerKey) {
  if (!trainerKey) return {}
  const rows = await sbSelect('trainer_state', `trainer=eq.${encodeURIComponent(trainerKey)}`)
  if (!rows?.length) return {}
  return parseTrainerStateRow(rows[0])
}

async function upsertTrainerStateByKey(trainerKey, patch) {
  if (!trainerKey) return null
  const current = await fetchTrainerStateByKey(trainerKey)
  const merged = { ...current, ...patch }
  return sbUpsert(
    'trainer_state',
    {
      trainer: trainerKey,
      state: merged,
      updated_at: new Date().toISOString(),
    },
    'trainer'
  )
}

/** Liste RH + onboarding (clé __weekly__, repli LPT2026 pour champs manquants) */
export async function getWeeklySharedState() {
  const weeklyRaw = await fetchTrainerStateByKey(TRAINER_STATE_WEEKLY_KEY)
  const weekly = pickWeeklyFields(weeklyRaw)

  const legacyCode = getLegacySessionCode()
  if (!legacyCode || legacyCode === TRAINER_STATE_WEEKLY_KEY) {
    return weekly
  }

  const legacy = pickWeeklyFields(await fetchTrainerStateByKey(legacyCode))
  const merged = { ...legacy, ...weekly }
  for (const key of WEEKLY_STATE_KEYS) {
    const wVal = weekly[key]
    const lVal = legacy[key]
    const weeklyEmpty =
      wVal == null ||
      (key === 'entrees_data' && (!Array.isArray(wVal) || wVal.length === 0)) ||
      (key === 'ob_data' && (typeof wVal !== 'object' || !Object.keys(wVal).length))
    if (weeklyEmpty && lVal != null) merged[key] = lVal
  }
  return pickWeeklyFields(merged)
}

/** TV, modules, quiz sync — état par salle */
export async function getRoomSharedState(roomCode) {
  const code = (roomCode || resolveRoomStateCode()).trim()
  if (!code) return {}
  return fetchTrainerStateByKey(code)
}

/** Fusion room + RH (compatibilité app existante) */
export async function getSharedState(roomCode) {
  const code = (roomCode || resolveRoomStateCode()).trim()
  const [weekly, room] = await Promise.all([
    getWeeklySharedState(),
    getRoomSharedState(code),
  ])
  return { ...room, ...weekly }
}

export async function setWeeklySharedState(patch) {
  if (!patch || typeof patch !== 'object') return null
  console.log('[setWeeklySharedState] ✏️', patch)
  const result = await upsertTrainerStateByKey(TRAINER_STATE_WEEKLY_KEY, patch)
  if (!result) console.error('[setWeeklySharedState] ❌ échec __weekly__')
  return result
}

export async function setRoomSharedState(patch, roomCode) {
  if (!patch || typeof patch !== 'object') return null
  const code = (roomCode || resolveRoomStateCode()).trim()
  if (!code) {
    console.error('[setRoomSharedState] code salle manquant')
    return null
  }
  console.log('[setRoomSharedState] ✏️', code, patch)
  const result = await upsertTrainerStateByKey(code, patch)
  if (!result) console.error('[setRoomSharedState] ❌ échec', code)
  return result
}

// ── Réponses libres aux questions ouvertes ────────────────────────
export async function insertOpenAnswer({
  sessionCode,
  pageId,
  participantName,
  answer,
  moduleId = null,
  questionIdx = null,
  questionPrompt = null,
}) {
  return sbInsert('open_answers', {
    session_code: sessionCode,
    page_id: pageId,
    participant_name: participantName || 'Anonyme',
    answer: answer.trim(),
    module_id: moduleId,
    question_idx: questionIdx,
    question_prompt: questionPrompt,
  })
}

export async function fetchOpenAnswers(sessionCode, pageId) {
  return sbSelect(
    'open_answers',
    `session_code=eq.${encodeURIComponent(sessionCode)}&page_id=eq.${encodeURIComponent(pageId)}&order=created_at.asc&limit=50`
  )
}

export async function fetchOpenAnswersForSession(sessionCode) {
  return sbSelect(
    'open_answers',
    `session_code=eq.${encodeURIComponent(sessionCode)}&order=created_at.asc`
  )
}

/** Notation formateur : juste / faux (+ commentaire optionnel) */
export async function gradeOpenAnswer(id, { isCorrect, gradedBy, trainerComment = null }) {
  if (!id) return null
  return sbUpdate(
    'open_answers',
    {
      is_correct: !!isCorrect,
      graded_by: gradedBy || null,
      graded_at: new Date().toISOString(),
      trainer_comment: trainerComment,
    },
    `id=eq.${id}`
  )
}

export async function clearOpenAnswers(sessionCode, pageId) {
  await sbDelete(
    'open_answers',
    `session_code=eq.${encodeURIComponent(sessionCode)}&page_id=eq.${encodeURIComponent(pageId)}`
  )
}

// ── Stats collab + fiches fin de formation ────────────────────────
export async function upsertCollaboratorStats(row) {
  if (!row?.collaborateur || !row?.week_date) return null
  return sbUpsert(
    'collaborator_stats',
    { ...row, updated_at: new Date().toISOString() },
    'collaborateur,week_date'
  )
}

export async function fetchCollaboratorStats(collaborateur, weekDate) {
  const name = encodeURIComponent(collaborateur)
  const week = encodeURIComponent(weekDate)
  const rows = await sbSelect(
    'collaborator_stats',
    `collaborateur=eq.${name}&week_date=eq.${week}&limit=1`
  )
  return rows?.[0] || null
}

export async function upsertFormationReport(row) {
  if (!row?.collaborateur || !row?.week_date || !row?.trainer_name) return null
  return sbUpsert(
    'formation_reports',
    { ...row, updated_at: new Date().toISOString() },
    'collaborateur,week_date,trainer_name'
  )
}

export async function fetchFormationReport(collaborateur, weekDate, trainerName) {
  let filter = `collaborateur=eq.${encodeURIComponent(collaborateur)}&week_date=eq.${encodeURIComponent(weekDate)}`
  if (trainerName) filter += `&trainer_name=eq.${encodeURIComponent(trainerName)}`
  const rows = await sbSelect('formation_reports', `${filter}&limit=1`)
  return rows?.[0] || null
}

export async function deleteTrainerStateByKey(trainerKey) {
  const key = (trainerKey || '').trim()
  if (!key) return false
  await sbDelete('trainer_state', `trainer=eq.${encodeURIComponent(key)}`)
  return true
}

export async function setSharedState(patch) {
  if (!patch || typeof patch !== 'object') return null

  const weeklyPatch = {}
  const roomPatch = {}
  for (const [key, value] of Object.entries(patch)) {
    if (WEEKLY_STATE_KEYS.has(key)) weeklyPatch[key] = value
    else roomPatch[key] = value
  }

  let lastResult = null
  if (Object.keys(weeklyPatch).length) {
    lastResult = await setWeeklySharedState(weeklyPatch)
  }
  if (Object.keys(roomPatch).length) {
    lastResult = await setRoomSharedState(roomPatch)
  }
  return lastResult
}

/** Écrit la page courante d'un formé sans écraser celles des autres. */
export async function setParticipantPage(sessionCode, participantName, pageData) {
  const code = (sessionCode || resolveRoomStateCode()).trim()
  if (!code || !participantName) return
  const current = await fetchTrainerStateByKey(code)
  const pages = { ...(current?.participant_pages || {}), [participantName]: pageData }
  return sbUpsert(
    'trainer_state',
    { trainer: code, state: { ...current, participant_pages: pages }, updated_at: new Date().toISOString() },
    'trainer'
  )
}
