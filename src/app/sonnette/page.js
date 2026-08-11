'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Image from 'next/image'
import { sbUpsert, sbSelect } from '@/lib/supabase'

const DOOR_CODE = '1990A'
const ADDRESS = '42 Boulevard de Sébastopol, 75001 Paris'
const GROUP_GAP_MS = 5 * 60 * 1000
const SONNETTE_STORAGE_KEY = 'sonnette_session'

function accessMessageText(prenom) {
  return `Salut ${prenom} 👋 Tu peux nous rejoindre directement en salle de formation !\n\n📍 ${ADDRESS}\n🔑 Code de la porte : ${DOOR_CODE}\n\nLa salle se trouve au dernier étage, prends l'ascenseur pour nous rejoindre. À tout de suite !`
}

function comingMessageText(prenom, trainerName) {
  return `Salut ${prenom} 👋 Je descends te récupérer dans 5 minutes !${trainerName ? `\n— ${trainerName}` : ''}`
}

function formatBubbleTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return `Aujourd'hui ${time}`
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} ${time}`
}

// ── Bulle façon Messages iOS (mode nuit) ────────────────────────────
function Bubble({ msg, isFirst, isLast }) {
  const mine = msg.from === 'forme'
  const radius = mine
    ? { borderTopLeftRadius: 18, borderBottomLeftRadius: 18, borderTopRightRadius: isFirst ? 18 : 6, borderBottomRightRadius: isLast ? 18 : 6 }
    : { borderTopRightRadius: 18, borderBottomRightRadius: 18, borderTopLeftRadius: isFirst ? 18 : 6, borderBottomLeftRadius: isLast ? 18 : 6 }

  return (
    <div style={{
      display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start',
      marginTop: isFirst ? 10 : 2,
    }}>
      <div style={{
        maxWidth: '78%', padding: '9px 14px', fontSize: 15.5, lineHeight: 1.35,
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        background: mine ? '#0b93f6' : '#26252a',
        color: '#fff',
        ...radius,
      }}>
        {msg.text}
      </div>
    </div>
  )
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 10 }}>
      <div style={{
        background: '#26252a', borderRadius: 18, padding: '12px 16px',
        display: 'flex', gap: 4, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.5)',
            animation: `sonnetteTypingDot 1.2s ${i * 0.18}s infinite ease-in-out`,
          }} />
        ))}
      </div>
      <style>{`@keyframes sonnetteTypingDot { 0%, 60%, 100% { opacity: .3; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-3px); } }`}</style>
    </div>
  )
}

export default function SonnettePage() {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [response, setResponse] = useState(null) // null | 'coming' | 'access'
  const [respondedAt, setRespondedAt] = useState(null)
  const [trainerName, setTrainerName] = useState('')
  const [accessStatus, setAccessStatusState] = useState(null) // null | 'lost' | 'arriving'
  const [accessStatusAt, setAccessStatusAt] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatText, setChatText] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const keyRef = useRef('')
  const createdAtRef = useRef(null)
  const listRef = useRef(null)

  // Retrouve une conversation déjà envoyée si la page est rafraîchie — sinon
  // le formé se retrouve renvoyé au formulaire et doit sonner une deuxième
  // fois pour pouvoir écrire au formateur.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SONNETTE_STORAGE_KEY) || 'null')
      if (saved?.key && saved?.prenom && saved?.nom) {
        keyRef.current = saved.key
        createdAtRef.current = saved.createdAt || null
        setPrenom(saved.prenom)
        setNom(saved.nom)
        setSent(true)
      }
    } catch { /* ignore */ }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prenom.trim() || !nom.trim()) return
    // Ferme le clavier mobile avant de basculer sur l'écran de conversation,
    // sinon le scroll gardé pour garder le champ visible reste appliqué à
    // la nouvelle vue et le formé se retrouve en bas de l'écran.
    document.activeElement?.blur?.()
    setLoading(true)
    setError('')
    const uid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2, 8)
    const key = 'sonnette-' + uid
    const createdAt = new Date().toISOString()
    const result = await sbUpsert('trainer_state', {
      trainer: key,
      state: { prenom: prenom.trim(), nom: nom.trim(), created_at: createdAt },
      updated_at: new Date().toISOString(),
    }, 'trainer')
    if (result != null) {
      keyRef.current = key
      createdAtRef.current = createdAt
      try {
        localStorage.setItem(SONNETTE_STORAGE_KEY, JSON.stringify({
          key, prenom: prenom.trim(), nom: nom.trim(), createdAt,
        }))
      } catch { /* ignore */ }
      setSent(true)
    } else {
      setError('Une erreur est survenue, réessayez.')
    }
    setLoading(false)
  }

  // Filet de sécurité : force la page tout en haut dès le passage à l'écran
  // de conversation, quelle que soit la position de scroll héritée du
  // formulaire (clavier mobile ouvert, etc.)
  useEffect(() => {
    if (sent) window.scrollTo(0, 0)
  }, [sent])

  // Poll la réponse du formateur (donner l'accès / j'arrive dans 5 minutes)
  // et les messages échangés, une fois la notification envoyée.
  useEffect(() => {
    if (!sent || !keyRef.current) return
    let cancelled = false
    const poll = async () => {
      try {
        const rows = await sbSelect('trainer_state', `trainer=eq.${encodeURIComponent(keyRef.current)}`)
        const state = rows?.[0]?.state
        if (cancelled || !state) return
        if (state.response) {
          setResponse(state.response)
          setRespondedAt(state.responded_at || null)
          setTrainerName(state.trainer_name || '')
        }
        if (state.access_status) {
          setAccessStatusState(state.access_status)
          setAccessStatusAt(state.access_status_at || null)
        }
        if (Array.isArray(state.messages)) setMessages(state.messages)
        // Le formateur a cliqué "Récupéré" : la visite est terminée, on
        // repart d'un formulaire vierge si la page est rouverte plus tard.
        if (state.dismissed_at) {
          try { localStorage.removeItem(SONNETTE_STORAGE_KEY) } catch { /* ignore */ }
        }
      } catch { /* best-effort */ }
    }
    poll()
    const t = setInterval(poll, 2500)
    return () => { cancelled = true; clearInterval(t) }
  }, [sent])

  // Relit toujours la ligne juste avant d'écrire dedans (le state est un
  // blob JSON réécrit en entier à chaque fois) pour ne pas écraser une
  // réponse du formateur arrivée entre-temps.
  const patchState = async (patch) => {
    const rows = await sbSelect('trainer_state', `trainer=eq.${encodeURIComponent(keyRef.current)}`)
    const current = rows?.[0]?.state || {}
    const next = { ...current, ...patch }
    await sbUpsert('trainer_state', {
      trainer: keyRef.current,
      state: next,
      updated_at: new Date().toISOString(),
    }, 'trainer')
    return next
  }

  const sendAccessStatus = async (status) => {
    const at = new Date().toISOString()
    setAccessStatusState(status)
    setAccessStatusAt(at)
    try { await patchState({ access_status: status, access_status_at: at }) } catch { /* best-effort */ }
  }

  const sendChat = async () => {
    const text = chatText.trim()
    if (!text || sendingChat) return
    setSendingChat(true)
    try {
      const next = await patchState({
        messages: [...messages, { from: 'forme', text, at: new Date().toISOString() }],
      })
      setMessages(next.messages || [])
      setChatText('')
    } catch { /* best-effort */ } finally {
      setSendingChat(false)
    }
  }

  // Timeline unifiée façon conversation SMS : messages système (arrivée,
  // réponse du formateur, statut d'accès) + messages libres, triés par date.
  const timeline = useMemo(() => {
    const t = []
    if (createdAtRef.current) {
      t.push({ from: 'forme', text: 'Salut, je suis arrivé(e) devant l\'entrée !', at: createdAtRef.current })
    }
    if (response === 'coming') {
      t.push({ from: 'formateur', text: comingMessageText(prenom.trim(), trainerName), at: respondedAt || new Date().toISOString() })
    } else if (response === 'access') {
      t.push({ from: 'formateur', text: accessMessageText(prenom.trim()), at: respondedAt || new Date().toISOString() })
    }
    if (accessStatus === 'lost') {
      t.push({ from: 'forme', text: '❌ Je ne trouve pas l\'entrée', at: accessStatusAt || new Date().toISOString() })
    } else if (accessStatus === 'arriving') {
      t.push({ from: 'forme', text: '✅ J\'ai trouvé, j\'arrive !', at: accessStatusAt || new Date().toISOString() })
    }
    for (const m of messages) t.push(m)
    t.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0))
    return t
  }, [response, respondedAt, accessStatus, accessStatusAt, messages, prenom, trainerName])

  // Scroll interne au fil de conversation uniquement (jamais la page entière) :
  // scrollIntoView remonterait l'ancêtre scrollable le plus proche, qui peut
  // être la fenêtre elle-même sur mobile et faire disparaître l'en-tête.
  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [timeline.length, response, accessStatus])

  if (sent) {
    const subtitle = accessStatus === 'lost'
      ? '❌ Vous ne trouvez pas l\'entrée'
      : accessStatus === 'arriving'
      ? '✅ En route vers la salle'
      : response === 'access'
      ? '🔑 Accès donné'
      : response === 'coming'
      ? '⏱ Arrive dans 5 minutes'
      : 'En attente de réponse...'

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        background: '#000',
      }}>
        {/* Header façon vraie conv iMessage : retour + avatar/nom centrés */}
        <div style={{
          position: 'relative', flexShrink: 0,
          padding: '10px 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: '#000',
        }}>
          <div style={{
            position: 'absolute', left: 12, top: 10,
            fontSize: 17, color: '#0b93f6', display: 'flex', alignItems: 'center', gap: 2,
          }}>
            <svg width={11} height={18} viewBox="0 0 11 18" fill="none">
              <path d="M9.5 1.5 L1.5 9 L9.5 16.5" stroke="#0b93f6" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Messages</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 26 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3a3a3c, #1c1c1e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6,
            }}>
              {(trainerName || 'F')[0].toUpperCase()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
                {trainerName || 'Formateur LPT'}
              </div>
              <svg width={7} height={12} viewBox="0 0 7 12" fill="none">
                <path d="M1 1 L6 6 L1 11" stroke="rgba(255,255,255,0.3)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{subtitle}</div>
          </div>
        </div>

        {/* Fil de conversation */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 100px' }}>
          {timeline.length > 0 && (
            <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>
              {formatBubbleTime(timeline[0].at)}
            </div>
          )}
          {timeline.map((m, i) => {
            const prev = timeline[i - 1]
            const next = timeline[i + 1]
            const gapBefore = prev ? new Date(m.at || 0) - new Date(prev.at || 0) : Infinity
            const isFirst = !prev || prev.from !== m.from || gapBefore > GROUP_GAP_MS
            const isLast = !next || next.from !== m.from
            return (
              <div key={i}>
                {isFirst && i > 0 && gapBefore > GROUP_GAP_MS && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '14px 0 4px' }}>
                    {formatBubbleTime(m.at)}
                  </div>
                )}
                <Bubble msg={m} isFirst={isFirst} isLast={isLast} />
              </div>
            )
          })}

          {/* Quick replies : disponibles une fois l'accès donné */}
          {response === 'access' && !accessStatus && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                onClick={() => sendAccessStatus('lost')}
                style={{
                  padding: '9px 14px', borderRadius: 16, fontSize: 13, fontWeight: 600,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                  color: '#f87171', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ❌ Je ne trouve pas l&apos;entrée
              </button>
              <button
                onClick={() => sendAccessStatus('arriving')}
                style={{
                  padding: '9px 14px', borderRadius: 16, fontSize: 13, fontWeight: 600,
                  background: 'rgba(11,147,246,0.18)', border: '1px solid rgba(11,147,246,0.5)',
                  color: '#5eb8ff', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                ✅ J&apos;ai trouvé, j&apos;arrive
              </button>
            </div>
          )}

          {!response && <TypingBubble />}
        </div>

        {/* Barre de saisie fixe façon Messages */}
        <form
          onSubmit={e => { e.preventDefault(); sendChat() }}
          style={{
            position: 'fixed', left: 0, right: 0, bottom: 0,
            display: 'flex', gap: 8, alignItems: 'center',
            padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <input
            type="text"
            value={chatText}
            onChange={e => setChatText(e.target.value)}
            placeholder="Message"
            style={{
              flex: 1, padding: '10px 16px', borderRadius: 20, fontSize: 15,
              background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={sendingChat || !chatText.trim()}
            aria-label="Envoyer"
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              background: (!chatText.trim() || sendingChat) ? 'rgba(11,147,246,0.3)' : '#0b93f6',
              border: 'none', color: '#fff', cursor: (!chatText.trim() || sendingChat) ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none">
              <path d="M12 19V5M12 5l-6 6M12 5l6 6" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '32px 24px',
    }}>
      <Image
        src="/assets/logo-lpt-blanc.png"
        alt="Lunettes Pour Tous"
        width={120} height={46}
        style={{ objectFit: 'contain', marginBottom: 40 }}
      />

      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '36px 28px', width: '100%', maxWidth: 420,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px', textAlign: 'center' }}>
          Bienvenue !
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '0 0 28px', lineHeight: 1.5 }}>
          Signalez votre arrivée pour que votre formateur descende vous accueillir.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="text"
            placeholder="Votre prénom"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            autoComplete="given-name"
            style={{
              padding: '14px 16px', borderRadius: 12, fontSize: 16,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', outline: 'none', fontFamily: 'inherit',
              WebkitAppearance: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Votre nom de famille"
            value={nom}
            onChange={e => setNom(e.target.value)}
            autoComplete="family-name"
            style={{
              padding: '14px 16px', borderRadius: 12, fontSize: 16,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', outline: 'none', fontFamily: 'inherit',
              WebkitAppearance: 'none',
            }}
          />
          {error && (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0, textAlign: 'center' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !prenom.trim() || !nom.trim()}
            style={{
              marginTop: 8, padding: '16px 0', borderRadius: 14, fontSize: 17, fontWeight: 700,
              background: (!prenom.trim() || !nom.trim() || loading)
                ? 'rgba(0,171,233,0.3)'
                : 'linear-gradient(135deg, #0089ba, #00abe9)',
              border: 'none', color: '#fff',
              cursor: (!prenom.trim() || !nom.trim() || loading) ? 'default' : 'pointer',
              fontFamily: 'inherit', transition: 'all .2s',
              boxShadow: (!prenom.trim() || !nom.trim() || loading)
                ? 'none'
                : '0 4px 20px rgba(0,171,233,0.4)',
            }}
          >
            {loading ? 'Envoi...' : 'Je suis là !'}
          </button>
        </form>
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 24, textAlign: 'center' }}>
        Formation Lunettes Pour Tous · Paris 6e
      </p>
    </div>
  )
}
