'use client'
import { useEffect, useRef } from 'react'
import {
  PRESENCE_HEARTBEAT_MS,
  isSessionEnded,
  isKickActive,
  joinParticipant,
  markParticipantLeft,
  markParticipantLeftBeacon,
  pingParticipant,
  addActiveSeconds,
} from './participantPresence'
import { getRoomSharedState } from './supabase'

// Un tel verrouillé/rangé en poche continue de faire tourner ses timers en
// arrière-plan sur beaucoup de navigateurs mobiles — le heartbeat continue
// donc de tourner même quand le formé a réellement quitté la formation,
// le faisant apparaître "connecté" indéfiniment (fausse le "qui n'a pas
// répondu" pendant les quiz). Au-delà de ce temps en arrière-plan continu,
// on le marque explicitement "parti" (left_at) au lieu de le rafraîchir.
const BACKGROUND_LEFT_MS = 10 * 60 * 1000 // 10 minutes

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
    const startVisible = typeof document !== 'undefined' && document.visibilityState === 'visible'
    let hiddenAt = startVisible ? null : Date.now()
    let visibleSince = startVisible ? Date.now() : null
    let markedLeft = false

    // Cumule le temps réellement passé avec l'onglet au premier plan, flushé à
    // chaque tick de heartbeat — voir addActiveSeconds (signal RELATIF pour le
    // retour de formation, jamais une preuve de ce que fait le formé).
    const flushActiveTime = () => {
      if (visibleSince == null) return
      const now = Date.now()
      const deltaSec = Math.round((now - visibleSince) / 1000)
      visibleSince = now
      if (deltaSec > 0) addActiveSeconds(sessionCode, name, deltaSec)
    }

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
      markedLeft = false
      await joinParticipant(sessionCode, name)
    }

    const ping = async () => {
      if (cancelled || endedRef.current) return
      if (await isSessionEnded(sessionCode)) {
        endedRef.current = true
        onSessionEndedRef.current?.()
        return
      }
      // Le formateur a pu expulser ce participant alors que son onglet était
      // déjà connecté (heartbeat en cours) — sans cette vérification à chaque
      // ping (pas seulement au join initial), le heartbeat continuait à
      // rafraîchir last_seen_at indéfiniment malgré l'expulsion, le faisant
      // réapparaître "connecté" (et donc recompté dans les quiz) alors que le
      // formateur l'avait explicitement déconnecté.
      try {
        const state = await getRoomSharedState(sessionCode)
        if (isKickActive(state?.forced_disconnects?.[name])) {
          hardDisconnect()
          return
        }
      } catch {}
      // En arrière-plan continu depuis trop longtemps : marqué "parti" plutôt
      // que de continuer à rafraîchir last_seen_at (voir BACKGROUND_LEFT_MS).
      if (hiddenAt && Date.now() - hiddenAt > BACKGROUND_LEFT_MS) {
        if (!markedLeft) {
          markedLeft = true
          await markParticipantLeft(sessionCode, name)
        }
        return
      }
      flushActiveTime()
      await pingParticipant(sessionCode, name)
    }

    join()
    const interval = setInterval(ping, PRESENCE_HEARTBEAT_MS)

    // Un tel verrouillé puis rouvert peut rester "hors ligne" côté formateur
    // jusqu'au prochain tick (jusqu'à PRESENCE_HEARTBEAT_MS, potentiellement
    // plus si le setInterval a été suspendu par le navigateur en arrière-plan)
    // sans ce ping immédiat au réveil de l'onglet.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        hiddenAt = null
        visibleSince = Date.now()
        if (markedLeft) join() // redevient présent après avoir été marqué "parti"
        else ping()
      } else {
        flushActiveTime()
        visibleSince = null
        hiddenAt = Date.now()
      }
    }
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
