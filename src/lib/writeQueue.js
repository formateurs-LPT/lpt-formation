'use client'

// File d'attente de réessai pour les écritures Supabase qui échouent
// (coupure réseau, panne temporaire...) — au lieu de perdre l'info
// silencieusement, elle est mémorisée en localStorage et retentée en
// arrière-plan jusqu'à confirmation d'écriture, ou abandon après trop
// de tentatives (log console pour ne pas boucler indéfiniment sur une
// erreur permanente, ex. données invalides).
//
// Chaque entrée a une clé de déduplication (`dedupKey`) : si une écriture
// plus récente vise la MÊME ligne (même table + mêmes colonnes de conflit/
// filtre), elle remplace l'ancienne en file plutôt que de s'empiler —
// sinon une vieille tentative en attente pourrait un jour "gagner" et
// écraser une donnée plus fraîche déjà enregistrée entre-temps.

const QUEUE_KEY = 'lpt_write_retry_queue'
const MAX_ATTEMPTS = 40
const FLUSH_INTERVAL_MS = 20_000

function readQueue() {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}

function saveQueue(items) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(items)) } catch {}
}

export function writeQueueLength() {
  return readQueue().length
}

export function enqueueWrite(entry) {
  if (typeof window === 'undefined') return
  const q = readQueue().filter(item => !(entry.dedupKey && item.dedupKey === entry.dedupKey))
  q.push({ ...entry, attempts: 0, queuedAt: Date.now() })
  saveQueue(q)
}

let flushing = false

export async function flushWriteQueue(executor) {
  if (flushing || typeof window === 'undefined') return
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return
  const q = readQueue()
  if (!q.length) return
  flushing = true
  try {
    const remaining = []
    for (const item of q) {
      let ok = false
      try { ok = await executor(item) } catch { ok = false }
      if (!ok) {
        item.attempts = (item.attempts || 0) + 1
        if (item.attempts < MAX_ATTEMPTS) remaining.push(item)
        else console.error('[writeQueue] abandon après', MAX_ATTEMPTS, 'tentatives —', item.table, item.kind)
      }
    }
    saveQueue(remaining)
  } finally {
    flushing = false
  }
}

let started = false

export function startWriteQueueLoop(executor) {
  if (started || typeof window === 'undefined') return
  started = true
  flushWriteQueue(executor)
  setInterval(() => flushWriteQueue(executor), FLUSH_INTERVAL_MS)
  window.addEventListener('online', () => flushWriteQueue(executor))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') flushWriteQueue(executor)
  })
}
