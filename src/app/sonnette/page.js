'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpsert, sbSelect } from '@/lib/supabase'

const DOOR_CODE = '1990A'

function StatusIcon({ kind }) {
  if (kind === 'access') {
    return (
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(0,171,233,0.15)', border: '2px solid rgba(0,171,233,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
      }}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none">
          <circle cx="7" cy="15" r="4" stroke="#00abe9" strokeWidth={2} />
          <path d="M10 12 L21 1 M17 4 L20 7 M14 7 L16 9" stroke="#00abe9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  if (kind === 'coming') {
    return (
      <div style={{
        width: 80, height: 80, borderRadius: '50%',
        background: 'rgba(251,191,36,0.15)', border: '2px solid rgba(251,191,36,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 28,
      }}>
        <svg width={38} height={38} viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#fbbf24" strokeWidth={2} />
          <path d="M12 7v5l3.5 2" stroke="#fbbf24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  return (
    <div style={{
      width: 80, height: 80, borderRadius: '50%',
      background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 28,
    }}>
      <svg width={40} height={40} viewBox="0 0 40 40">
        <path d="M 8,20 L 17,29 L 32,12" fill="none" stroke="#22c55e" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

// ── Petit chat formé ↔ formateur — utile à tout moment (introuvable,
// question, retard...), pas seulement une fois l'accès donné. ──────
function ChatBox({ messages, chatText, setChatText, onSend, sending }) {
  const endRef = useRef(null)
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'nearest' }) }, [messages.length])

  return (
    <div style={{
      width: '100%', maxWidth: 380, marginTop: 28,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, padding: '14px 14px 12px', textAlign: 'left',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        💬 Un souci, une question ?
      </div>
      {messages.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', marginBottom: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.from === 'forme' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '80%', padding: '8px 12px', borderRadius: 12,
                fontSize: 13, lineHeight: 1.4, whiteSpace: 'pre-wrap',
                background: m.from === 'forme' ? 'rgba(0,171,233,0.2)' : 'rgba(255,255,255,0.08)',
                color: m.from === 'forme' ? '#fff' : 'rgba(255,255,255,0.85)',
                borderBottomRightRadius: m.from === 'forme' ? 4 : 12,
                borderBottomLeftRadius: m.from === 'forme' ? 12 : 4,
              }}>
                {m.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}
      <form
        onSubmit={e => { e.preventDefault(); onSend() }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input
          type="text"
          value={chatText}
          onChange={e => setChatText(e.target.value)}
          placeholder="Écrire un message..."
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10, fontSize: 14,
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button
          type="submit"
          disabled={sending || !chatText.trim()}
          style={{
            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: (!chatText.trim() || sending) ? 'rgba(0,171,233,0.15)' : 'rgba(0,171,233,0.9)',
            border: 'none', color: '#fff', cursor: (!chatText.trim() || sending) ? 'default' : 'pointer',
            fontFamily: 'inherit', flexShrink: 0,
          }}
        >
          Envoyer
        </button>
      </form>
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
  const [trainerName, setTrainerName] = useState('')
  const [accessStatus, setAccessStatusState] = useState(null) // null | 'lost' | 'arriving'
  const [messages, setMessages] = useState([])
  const [chatText, setChatText] = useState('')
  const [sendingChat, setSendingChat] = useState(false)
  const keyRef = useRef('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prenom.trim() || !nom.trim()) return
    setLoading(true)
    setError('')
    const uid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2, 8)
    const key = 'sonnette-' + uid
    const result = await sbUpsert('trainer_state', {
      trainer: key,
      state: { prenom: prenom.trim(), nom: nom.trim(), created_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, 'trainer')
    if (result != null) {
      keyRef.current = key
      setSent(true)
    } else {
      setError('Une erreur est survenue, réessayez.')
    }
    setLoading(false)
  }

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
          setTrainerName(state.trainer_name || '')
        }
        if (state.access_status) setAccessStatusState(state.access_status)
        if (Array.isArray(state.messages)) setMessages(state.messages)
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
    setAccessStatusState(status)
    try { await patchState({ access_status: status, access_status_at: new Date().toISOString() }) } catch { /* best-effort */ }
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

  if (sent) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
        padding: '32px 24px', textAlign: 'center',
      }}>
        <StatusIcon kind={response} />

        {response === 'access' ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
              Accès à la salle
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0, maxWidth: 380 }}>
              Salut {prenom.trim()}, tu peux nous rejoindre directement en salle de formation,
              le code de la porte est : <strong style={{ color: '#00abe9' }}>{DOOR_CODE}</strong>.
              <br /><br />
              La salle de formation se trouve au dernier étage, prends l&apos;ascenseur pour nous rejoindre.
              <br /><br />
              À tout de suite !
            </p>

            {accessStatus === 'arriving' ? (
              <div style={{ marginTop: 24, fontSize: 14, color: '#4ade80', fontWeight: 700 }}>
                ✅ Le formateur a été prévenu, à tout de suite !
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginTop: 24, width: '100%', maxWidth: 380 }}>
                <button
                  onClick={() => sendAccessStatus('lost')}
                  style={{
                    flex: 1, padding: '13px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    background: accessStatus === 'lost' ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.4)', color: '#f87171',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ❌ Je ne trouve pas l&apos;entrée
                </button>
                <button
                  onClick={() => sendAccessStatus('arriving')}
                  style={{
                    flex: 1, padding: '13px 10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
                    color: '#4ade80', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✅ J&apos;ai trouvé, j&apos;arrive
                </button>
              </div>
            )}
            {accessStatus === 'lost' && (
              <div style={{ marginTop: 14, fontSize: 13, color: '#f87171' }}>
                Le formateur est prévenu — écris-lui ci-dessous où tu te trouves si besoin.
              </div>
            )}
          </>
        ) : response === 'coming' ? (
          <>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
              On arrive !
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0, maxWidth: 380 }}>
              Salut {prenom.trim()}, je descends te récupérer dans 5 minutes !
            </p>
            {trainerName && (
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 14 }}>— {trainerName}</p>
            )}
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
              C&apos;est envoyé !
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
              Un instant, le formateur va vous répondre.<br />Restez devant l&apos;entrée du bâtiment.
            </p>
          </>
        )}

        <ChatBox
          messages={messages}
          chatText={chatText}
          setChatText={setChatText}
          onSend={sendChat}
          sending={sendingChat}
        />
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
