'use client'
import { useState, useEffect, useRef } from 'react'
import { fetchOnlineParticipantsList } from '@/lib/participantPresence'
import { getActiveSessionCode } from '@/lib/supabase'
import { normalizeNameKey } from '@/lib/participantNames'

/**
 * Auto-révèle la correction d'une question de quiz dès que tous les formés
 * CONNECTÉS ont répondu — évite d'avoir à cliquer manuellement "Voir la
 * correction" à chaque question, sur tous les quiz de la même façon.
 *
 * "Connecté" = présence réelle (heartbeat récent, cf. participantPresence.js),
 * pas juste "existe dans l'app" — un collaborateur absent ce jour-là mais
 * resté dans la liste RH n'entre jamais dans le compte tant qu'il n'a pas de
 * présence active. Un seul déclenchement par question (resetté via resetKey,
 * typiquement l'index de question).
 *
 * Le bouton "Voir la correction" existant reste TOUJOURS cliquable
 * manuellement (jamais désactivé par ce hook) : c'est le filet de sécurité
 * si le décompte de connectés est erroné (collaborateur "connecté" qui ne
 * répondra jamais) — le formateur n'est jamais bloqué.
 */
export function useAutoRevealCorrection({ answeredNames, resetKey, enabled = true, onReveal }) {
  const [onlineNames, setOnlineNames] = useState([])
  const revealedRef = useRef(false)

  useEffect(() => {
    revealedRef.current = false
  }, [resetKey])

  useEffect(() => {
    const code = getActiveSessionCode()
    const poll = async () => {
      const list = await fetchOnlineParticipantsList(code)
      setOnlineNames((list || []).map(p => p.name).filter(Boolean))
    }
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [])

  const answeredKeys = new Set((answeredNames || []).map(normalizeNameKey))
  const notAnswered = onlineNames.filter(n => !answeredKeys.has(normalizeNameKey(n)))
  const connectedCount = onlineNames.length

  useEffect(() => {
    if (!enabled || revealedRef.current) return
    if (connectedCount > 0 && notAnswered.length === 0 && (answeredNames || []).length > 0) {
      revealedRef.current = true
      onReveal()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, connectedCount, notAnswered.length, (answeredNames || []).length])

  return { connectedCount, notAnswered }
}

/** Liste "qui n'a pas encore répondu" — visible uniquement côté formateur, jamais sur le diffuseur. */
export function NotAnsweredList({ notAnswered }) {
  if (!notAnswered?.length) return null
  return (
    <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '12px 16px', marginTop: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
        ⏳ N&apos;ont pas encore répondu ({notAnswered.length})
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {notAnswered.map(name => (
          <span key={name} style={{ background: 'rgba(245,158,11,0.14)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#fbbf24' }}>{name}</span>
        ))}
      </div>
    </div>
  )
}
