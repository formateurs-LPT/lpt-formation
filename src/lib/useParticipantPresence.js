'use client'
import { useEffect, useRef } from 'react'
import {
  PRESENCE_HEARTBEAT_MS,
  isSessionEnded,
  markParticipantLeftBeacon,
  touchParticipantPresence,
} from './participantPresence'

/**
 * Heartbeat + left_at pour un participant connecté.
 * @param {{ sessionCode: string, name: string, enabled?: boolean, onSessionEnded?: () => void }} opts
 */
export function useParticipantPresence({
  sessionCode,
  name,
  enabled = true,
  onSessionEnded,
}) {
  const endedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !sessionCode || !name) return

    let cancelled = false
    endedRef.current = false

    const ping = async () => {
      if (cancelled || endedRef.current) return
      if (await isSessionEnded(sessionCode)) {
        endedRef.current = true
        onSessionEnded?.()
        return
      }
      await touchParticipantPresence(sessionCode, name)
    }

    ping()
    const interval = setInterval(ping, PRESENCE_HEARTBEAT_MS)

    const onLeave = () => {
      if (!endedRef.current) markParticipantLeftBeacon(sessionCode, name)
    }
    window.addEventListener('pagehide', onLeave)
    window.addEventListener('beforeunload', onLeave)

    return () => {
      cancelled = true
      clearInterval(interval)
      window.removeEventListener('pagehide', onLeave)
      window.removeEventListener('beforeunload', onLeave)
      if (!endedRef.current) markParticipantLeftBeacon(sessionCode, name)
    }
  }, [sessionCode, name, enabled, onSessionEnded])
}
