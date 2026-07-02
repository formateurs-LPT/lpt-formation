'use client'
import { useEffect } from 'react'
import { getActiveSessionCode } from './supabase'
import { fetchOnlineParticipantCount } from './participantPresence'

const POLL_MS = 5_000

/**
 * Compteur participants connectés (RH + heartbeat) pour le formateur.
 */
export function useOnlineCount({ enabled = true, sessionCode, onCount }) {
  useEffect(() => {
    if (!enabled || !onCount) return

    let cancelled = false
    const code = () => (sessionCode || getActiveSessionCode()).trim()

    const poll = async () => {
      if (cancelled) return
      try {
        const n = await fetchOnlineParticipantCount(code())
        if (!cancelled) onCount(n)
      } catch {
        if (!cancelled) onCount(0)
      }
    }

    poll()
    const interval = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [enabled, sessionCode, onCount])
}
