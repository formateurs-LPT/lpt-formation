'use client'
import { useState, useEffect, useRef } from 'react'
import { sbSelect, getSharedState } from '@/lib/supabase'
import { resolveRoomStateCode } from '@/lib/sessionCode'

// ─────────────────────────────────────────────────────────────────
//  useModuleSync — synchronisation TV / participant
//
//  Stratégie de polling adaptatif :
//  • Aucun module actif  → intervalle lent (IDLE_MS)
//  • Module actif        → intervalle rapide (BASE_MS)
//  • Rien n'a changé depuis N polls → on ralentit progressivement
//  • Un changement détecté          → on revient à BASE_MS immédiatement
// ─────────────────────────────────────────────────────────────────

const BASE_MS = 1200    // polling rapide — module actif avec changements
const IDLE_MS = 5000    // polling lent  — aucun module en cours

export function useModuleSync({ disabled = false } = {}) {
  const [state, setState] = useState({
    activeModule: null,
    modulePage: 0,
    sharedState: null,
    loading: true,
    sessionCode: '',
  })

  const timerRef    = useRef(null)
  const snapshotRef = useRef(null)
  const stableRef   = useRef(0)

  useEffect(() => {
    if (disabled) return
    let cancelled = false

    const poll = async () => {
      try {
        const sessionCode = resolveRoomStateCode()
        const [rows, shared] = await Promise.all([
          sbSelect('sessions', 'code=eq.' + encodeURIComponent(sessionCode)),
          getSharedState(sessionCode),
        ])

        if (cancelled) return

        const session = rows?.[0]
        const activeModule = session?.active_module ?? null
        const modulePage   = session?.module_page   ?? 0

        const newSnap = `${sessionCode}:${activeModule}:${modulePage}:${JSON.stringify(shared)}`

        if (newSnap !== snapshotRef.current) {
          snapshotRef.current = newSnap
          stableRef.current = 0
          setState({ activeModule, modulePage, sharedState: shared, loading: false, sessionCode })
        } else {
          stableRef.current += 1
        }

        const next = (!activeModule && !shared?.faq_journee) ? IDLE_MS : BASE_MS

        if (!cancelled) {
          timerRef.current = setTimeout(poll, next)
        }

      } catch (e) {
        if (!cancelled) {
          setState(s => ({ ...s, loading: false }))
          console.error('[useModuleSync]', e)
          timerRef.current = setTimeout(poll, IDLE_MS)
        }
      }
    }

    poll()

    return () => {
      cancelled = true
      clearTimeout(timerRef.current)
    }
  }, [disabled])

  return state
}
