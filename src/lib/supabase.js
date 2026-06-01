const SB_URL = 'https://dofyyckseiilxhlijacy.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZnl5Y2tzZWlpbHhobGlqYWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjU2MjcsImV4cCI6MjA5Mzc0MTYyN30.ENd0dOZvA0ZqQky2LN5M8pK0Amp2SPLuIEHCHWyuI4A'

const sbHeaders = {
  apikey: SB_KEY,
  Authorization: 'Bearer ' + SB_KEY,
  'Content-Type': 'application/json'
}

export async function sbSelect(table, filter = null) {
  let url = `${SB_URL}/rest/v1/${table}?select=*`
  if (filter) url += '&' + filter
  const r = await fetch(url, { headers: sbHeaders })
  return r.ok ? await r.json() : []
}

export async function sbUpsert(table, data, onConflict) {
  let url = `${SB_URL}/rest/v1/${table}`
  if (onConflict) url += '?on_conflict=' + onConflict
  const headers = { ...sbHeaders, Prefer: 'resolution=merge-duplicates,return=representation' }
  const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(data) })
  if (!r.ok) { const err = await r.json().catch(() => ({})); console.error('sbUpsert error', table, r.status, err); return null }
  return await r.json()
}

export async function sbInsert(table, data) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(data)
  })
  if (!r.ok) { console.error('sbInsert error', table, r.status); return null }
  return true
}

export async function sbUpdate(table, data, filter) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { ...sbHeaders, Prefer: 'return=minimal' },
    body: JSON.stringify(data)
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    console.error('[sbUpdate] ERREUR', table, r.status, err, '| data:', data, '| filter:', filter)
  }
  return r.ok
}

export async function sbDelete(table, filter) {
  await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: sbHeaders
  })
}

export const SESSION_CODE = 'LPT2026'

// ── trainer_state : état partagé entre tous les formateurs ─────────
// Clé = SESSION_CODE (partagé) ou nom formateur (personnel)
export async function getSharedState() {
  const rows = await sbSelect('trainer_state', `trainer=eq.${SESSION_CODE}`)
  return rows?.[0]?.state || {}
}

export async function setSharedState(patch) {
  const current = await getSharedState()
  const merged = { ...current, ...patch }
  return sbUpsert('trainer_state', {
    trainer: SESSION_CODE,
    state: merged,
    updated_at: new Date().toISOString(),
  }, 'trainer')
}
