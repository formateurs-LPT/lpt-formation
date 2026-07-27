'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { sbSelect, getSharedState } from '@/lib/supabase'
import { resolveRoomStateCode, isDynamicRoomCode } from '@/lib/sessionCode'

// ─────────────────────────────────────────────────────────────────
//  useModuleSync — synchronisation TV / participant
//
//  Stratégie :
//  • Module actif  → polling 400ms   (quasi temps réel)
//  • Idle          → polling 1000ms
//  • Tab redevient visible → poll immédiat
//  • Pas de snapshotRef : setState à chaque poll (simple et fiable)
// ─────────────────────────────────────────────────────────────────

const ACTIVE_MS = 400
const IDLE_MS   = 1000

async function resolveTvSessionCode(legacyCode) {
  try {
    const rows = await sbSelect('sessions', 'order=updated_at.desc&limit=10')
    const active = (rows || []).find(r =>
      isDynamicRoomCode(r.code) && (r.status === 'active' || r.status === 'waiting')
    )
    if (active?.code) return active.code
  } catch {}
  return legacyCode
}

export function useModuleSync({ disabled = false } = {}) {
  const [state, setState] = useState({
    activeModule: null,
    modulePage: 0,
    sharedState: null,
    loading: true,
    sessionCode: '',
  })

  const timerRef       = useRef(null)
  const resolvedRef    = useRef('')   // code salle découvert par auto-discovery
  const cancelledRef   = useRef(false)
  const isPollingRef   = useRef(false) // évite les polls simultanés

  const doPoll = useCallback(async () => {
    if (isPollingRef.current || cancelledRef.current) return
    isPollingRef.current = true

    try {
      const isTvMode = typeof window !== 'undefined'
        && new URLSearchParams(window.location.search).get('mode') === 'tv'

      let sessionCode = resolveRoomStateCode()

      // TV sur appareil séparé sans ?room= → auto-découverte
      if (isTvMode && !isDynamicRoomCode(sessionCode)) {
        if (resolvedRef.current && isDynamicRoomCode(resolvedRef.current)) {
          sessionCode = resolvedRef.current
        } else {
          sessionCode = await resolveTvSessionCode(sessionCode)
          if (isDynamicRoomCode(sessionCode)) resolvedRef.current = sessionCode
        }
      }

      if (cancelledRef.current) return

      const [rows, shared] = await Promise.all([
        sbSelect('sessions', 'code=eq.' + encodeURIComponent(sessionCode)),
        getSharedState(sessionCode),
      ])

      if (cancelledRef.current) return

      const session    = rows?.[0]
      const activeModule = session?.active_module ?? null
      const modulePage   = session?.module_page   ?? 0

      // Si la session devient inactive, réinitialiser l'auto-discovery
      if (isTvMode && !isDynamicRoomCode(resolveRoomStateCode())) {
        const stillActive = session?.status === 'active' || session?.status === 'waiting'
        if (!stillActive) resolvedRef.current = ''
      }

      // Toujours mettre à jour l'état — pas de snapshot : simple et fiable
      setState({ activeModule, modulePage, sharedState: shared, loading: false, sessionCode })

      const next = (!activeModule && !shared?.faq_journee) ? IDLE_MS : ACTIVE_MS
      if (!cancelledRef.current) {
        timerRef.current = setTimeout(doPoll, next)
      }
    } catch (e) {
      console.error('[useModuleSync]', e)
      if (!cancelledRef.current) {
        timerRef.current = setTimeout(doPoll, IDLE_MS)
      }
    } finally {
      isPollingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (disabled) return

    cancelledRef.current = false
    doPoll()

    // Poll immédiat quand l'onglet redevient visible (formateur change de fenêtre puis revient)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(timerRef.current)
        doPoll()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelledRef.current = true
      clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [disabled, doPoll])

  return state
}
