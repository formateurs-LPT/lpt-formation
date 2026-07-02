'use client'
import { useState, useEffect, useRef } from 'react'
import { sbSelect, getSharedState, getActiveSessionCode, getParticipantSessionCode } from '@/lib/supabase'

function resolveSyncSessionCode() {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const isParticipantMode =
      params.get('mode') === 'participant' ||
      Boolean(localStorage.getItem('participant_name'))
    if (isParticipantMode) return getParticipantSessionCode()
  }
  return getActiveSessionCode()
}

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
const SLOW_MS = 2800    // polling moyen — module actif mais stable
const IDLE_MS = 5000    // polling lent  — aucun module en cours
const SLOW_AFTER = 4    // nb de polls sans changement avant de ralentir

export function useModuleSync({ disabled = false } = {}) {
  const [state, setState] = useState({
    activeModule: null,
    modulePage: 0,
    sharedState: null,
    loading: true,
  })

  const timerRef    = useRef(null)
  const snapshotRef = useRef(null)
  const stableRef   = useRef(0)   // compteur de polls sans changement

  useEffect(() => {
    if (disabled) return
    let cancelled = false

    const poll = async () => {
      try {
        // ── Lecture session + trainer_state en parallèle ──────────
        const sessionCode = resolveSyncSessionCode()
        const [rows, shared] = await Promise.all([
          sbSelect('sessions', 'code=eq.' + encodeURIComponent(sessionCode)),
          getSharedState(),
        ])

        if (cancelled) return

        const session = rows?.[0]
        const activeModule = session?.active_module ?? null
        const modulePage   = session?.module_page   ?? 0

        // ── Détection de changement ───────────────────────────────
        const newSnap = `${activeModule}:${modulePage}:${JSON.stringify(shared)}`

        if (newSnap !== snapshotRef.current) {
          snapshotRef.current = newSnap
          stableRef.current = 0
          console.log('[useModuleSync] 🔄 changement détecté — module=', activeModule, 'page=', modulePage, 'prog_zone_q=', shared?.prog_zone_q)
          setState({ activeModule, modulePage, sharedState: shared, loading: false })
        } else {
          stableRef.current += 1
        }

        // ── Calcul du prochain intervalle ─────────────────────────
        // Quand un module est actif on reste toujours à BASE_MS :
        // les exercices interactifs (zones, objections) ont besoin
        // d'une réactivité max pour que les questions arrivent vite
        // sur les téléphones. La lenteur SLOW_MS ne s'applique que
        // si aucun module n'est en cours.
        let next
        if (!activeModule && !shared?.faq_journee) {
          next = IDLE_MS   // rien d'actif → 5 s
        } else {
          next = BASE_MS   // module actif ou FAQ actif → toujours 1.2 s
        }

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
  }, [])

  return state
}
