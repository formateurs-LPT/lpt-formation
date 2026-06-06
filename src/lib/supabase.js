import { getSessionCode } from './env'

// Lu au build / au démarrage de `next dev` depuis .env.local (NEXT_PUBLIC_*)
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const SESSION_CODE = process.env.NEXT_PUBLIC_SESSION_CODE ?? ''

/** Filtre PostgREST pour valeurs avec espaces / accents */
export function pgEq(column, value) {
  const v = String(value ?? '').replace(/"/g, '""')
  return `${column}=eq."${v}"`
}

/** Code session (build Vercel : NEXT_PUBLIC_SESSION_CODE obligatoire) */
export function getRuntimeSessionCode() {
  const raw = process.env.NEXT_PUBLIC_SESSION_CODE ?? ''
  const trimmed = String(raw).trim().replace(/^['"]|['"]$/g, '')
  if (trimmed) return trimmed
  try {
    return getSessionCode()
  } catch {
    return ''
  }
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
export async function ensureSession() {
  const code = getRuntimeSessionCode()
  if (!code) {
    console.error('[ensureSession] NEXT_PUBLIC_SESSION_CODE manquant (rebuild Vercel après ajout env)')
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

export async function getSharedState() {
  const code = getRuntimeSessionCode()
  if (!code) {
    console.error('[getSharedState] NEXT_PUBLIC_SESSION_CODE manquant')
    return {}
  }
  const rows = await sbSelect('trainer_state', `trainer=eq.${encodeURIComponent(code)}`)
  if (!rows?.length) {
    console.warn('[getSharedState] aucune ligne pour trainer=', code)
    return {}
  }
  return parseTrainerStateRow(rows[0])
}

export async function setSharedState(patch) {
  const code = getRuntimeSessionCode()
  if (!code) {
    console.error('[setSharedState] NEXT_PUBLIC_SESSION_CODE manquant — rien enregistré en BDD')
    return null
  }
  const current = await getSharedState()
  const merged = { ...current, ...patch }
  const result = await sbUpsert(
    'trainer_state',
    {
      trainer: code,
      state: merged,
      updated_at: new Date().toISOString(),
    },
    'trainer'
  )
  if (!result) {
    console.error('[setSharedState] échec upsert trainer_state, clé trainer=', code)
  }
  return result
}
