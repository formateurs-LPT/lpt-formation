'use client'
import { useEffect, useRef } from 'react'
import {
  PRESENCE_HEARTBEAT_MS,
  isSessionEnded,
  joinParticipant,
  markParticipantLeftBeacon,
  pingParticipant,
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
  // Ref pour éviter que onSessionEnded (nouvelle fonction à chaque rendu) ne relance l'effet
  const onSessionEndedRef = useRef(onSessionEnded)
  useEffect(() => { onSessionEndedRef.current = onSessionEnded }, [onSessionEnded])

  useEffect(() => {
    if (!enabled || !sessionCode || !name) return

    let cancelled = false
    endedRef.current = false

    const join = async () => {
      if (cancelled || endedRef.current) return
      if (await isSessionEnded(sessionCode)) {
        endedRef.current = true
        onSessionEndedRef.current?.()
        return
      }
      // Premier appel : upsert complet (reset left_at, autorise reconnexion)
      await joinParticipant(sessionCode, name)
    }

    const ping = async () => {
      if (cancelled || endedRef.current) return
      if (await isSessionEnded(sessionCode)) {
        endedRef.current = true
        onSessionEndedRef.current?.()
        return
      }
      // Heartbeat : met à jour last_seen_at uniquement, ne reset pas left_at
      await pingParticipant(sessionCode, name)
    }

    join()
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
  }, [sessionCode, name, enabled]) // onSessionEnded retiré des deps — géré via ref
}
