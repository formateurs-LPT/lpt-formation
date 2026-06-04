import { getSessionCode } from './env'

// Lu au build / au démarrage de `next dev` depuis .env.local (NEXT_PUBLIC_*)
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const SESSION_CODE = process.env.NEXT_PUBLIC_SESSION_CODE ?? ''

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

export async function getSharedState() {
  const code = getRuntimeSessionCode()
  if (!code) return {}
  const rows = await sbSelect('trainer_state', `trainer=eq.${encodeURIComponent(code)}`)
  return rows?.[0]?.state || {}
}

export async function setSharedState(patch) {
  const code = getRuntimeSessionCode()
  if (!code) return null
  const current = await getSharedState()
  const merged = { ...current, ...patch }
  return sbUpsert(
    'trainer_state',
    {
      trainer: code,
      state: merged,
      updated_at: new Date().toISOString(),
    },
    'trainer'
  )
}
