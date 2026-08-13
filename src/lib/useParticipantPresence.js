'use client'
import { useEffect, useRef } from 'react'
import {
  PRESENCE_HEARTBEAT_MS,
  isSessionEnded,
  joinParticipant,
  markParticipantLeftBeacon,
  pingParticipant,
} from './participantPresence'
import { getRoomSharedState } from './supabase'

const KICK_EXPIRY_MS = 30 * 60 * 1000 // 30 minutes

function isKickActive(kickValue) {
  if (!kickValue) return false
  if (kickValue === true) return true // ancienne valeur booléenne
  return Date.now() - Number(kickValue) < KICK_EXPIRY_MS
}

function hardDisconnect() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('participant_name')
  localStorage.removeItem('participant_prenom')
  window.location.reload()
}

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
      // Vérifie si le formateur a expulsé ce participant avant de rejoindre
      try {
        const state = await getRoomSharedState(sessionCode)
        if (isKickActive(state?.forced_disconnects?.[name])) {
          hardDisconnect()
          return
        }
      } catch {}
      await joinParticipant(sessionCode, name)
    }

    const ping = async () => {
      if (cancelled || endedRef.current) return
      if (await isSessionEnded(sessionCode)) {
        endedRef.current = true
        onSessionEndedRef.current?.()
        return
      }
      await pingParticipant(sessionCode, name)
    }

    join()
    const interval = setInterval(ping, PRESENCE_HEARTBEAT_MS)

    // Un tel verrouillé puis rouvert peut rester "hors ligne" côté formateur
    // jusqu'au prochain tick (jusqu'à PRESENCE_HEARTBEAT_MS, potentiellement
    // plus si le setInterval a été suspendu par le navigateur en arrière-plan)
    // sans ce ping immédiat au réveil de l'onglet.
    const onVisible = () => { if (document.visibilityState === 'visible') ping() }
    document.addEventListener('visibilitychange', onVisible)

    const onLeave = () => {
      if (!endedRef.current) markParticipantLeftBeacon(sessionCode, name)
    }
    window.addEventListener('pagehide', onLeave)
    window.addEventListener('beforeunload', onLeave)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('pagehide', onLeave)
      window.removeEventListener('beforeunload', onLeave)
      if (!endedRef.current) markParticipantLeftBeacon(sessionCode, name)
    }
  }, [sessionCode, name, enabled])
}
