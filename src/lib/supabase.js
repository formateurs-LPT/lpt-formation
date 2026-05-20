const SB_URL = 'https://hkbcvtqkxtayrmysufhe.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrYmN2dHFreHRheXJteXN1ZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2MzI2MDIsImV4cCI6MjA2MjIwODYwMn0.t6GxBPYHl8F9QQkjXCFsQPFCkNcjNGFpWFQTTrpXRaQ'

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
  return r.ok
}

export async function sbDelete(table, filter) {
  await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
    method: 'DELETE',
    headers: sbHeaders
  })
}

export const SESSION_CODE = 'LPT2026'
