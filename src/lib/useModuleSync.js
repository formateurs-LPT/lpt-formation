'use client'
import { useState, useEffect, useRef } from 'react'
import { sbSelect, getSharedState } from '@/lib/supabase'
import { resolveRoomStateCode, isDynamicRoomCode } from '@/lib/sessionCode'

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
const IDLE_MS = 2000    // polling lent  — aucun module en cours

// En mode TV sans ?room= dans l'URL (vidéoprojecteur ouvert manuellement),
// on cherche la salle dynamique ouverte pour lire le bon trainer_state.
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

  const timerRef    = useRef(null)
  const snapshotRef = useRef(null)
  const resolvedCodeRef = useRef('')   // cache du code salle découvert

  useEffect(() => {
    if (disabled) return
    let cancelled = false

    const isTvMode = typeof window !== 'undefined'
      && new URLSearchParams(window.location.search).get('mode') === 'tv'

    const poll = async () => {
      try {
        let sessionCode = resolveRoomStateCode()

        // TV sur appareil séparé sans ?room= → auto-découverte de la salle dynamique
        if (isTvMode && !isDynamicRoomCode(sessionCode)) {
          // On réutilise le code découvert précédemment, ou on cherche à nouveau
          if (resolvedCodeRef.current && isDynamicRoomCode(resolvedCodeRef.current)) {
            sessionCode = resolvedCodeRef.current
          } else {
            sessionCode = await resolveTvSessionCode(sessionCode)
            if (isDynamicRoomCode(sessionCode)) resolvedCodeRef.current = sessionCode
          }
        }

        const [rows, shared] = await Promise.all([
          sbSelect('sessions', 'code=eq.' + encodeURIComponent(sessionCode)),
          getSharedState(sessionCode),
        ])

        if (cancelled) return

        const session = rows?.[0]
        const activeModule = session?.active_module ?? null
        const modulePage   = session?.module_page   ?? 0

        // Si plus aucune session active sur ce code, effacer le cache pour re-chercher
        if (isTvMode && !isDynamicRoomCode(resolveRoomStateCode())) {
          const stillActive = session?.status === 'active' || session?.status === 'waiting'
          if (!stillActive) resolvedCodeRef.current = ''
        }

        const newSnap = `${sessionCode}:${activeModule}:${modulePage}:${JSON.stringify(shared)}`

        if (newSnap !== snapshotRef.current) {
          snapshotRef.current = newSnap
          setState({ activeModule, modulePage, sharedState: shared, loading: false, sessionCode })
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
