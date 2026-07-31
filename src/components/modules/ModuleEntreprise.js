'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState, getRoomSharedState, fetchOpenAnswers } from '@/lib/supabase'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { ENTREPRISE_PAGES as PAGES, ENTREPRISE_QUIZ } from '@/lib/modulesData'
import ZeroInterChain from '@/components/ZeroInterChain'

const PAUL_AVATAR = '/assets/avatar_paul.png'
const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── Avatar Paul ───────────────────────────────────────────────────
function PaulBubble({ script }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [script])

  if (!script) return null
  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      padding: '0 28px 28px 0',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'all .5s ease', pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        borderRadius: '18px 18px 4px 18px', padding: '14px 18px',
        maxWidth: 280, boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
        marginBottom: 12,
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#0a2a5c', marginBottom: 6 }}>Paul Morlet · Fondateur LPT</div>
        <p style={{ fontSize: 13, color: '#1a1a2e', lineHeight: 1.55, margin: 0 }}>{script}</p>
      </div>
      <div style={{
        width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
        border: '3px solid rgba(0,171,233,0.6)',
        boxShadow: '0 4px 20px rgba(0,171,233,0.4)',
      }}>
        <Image src={PAUL_AVATAR} alt="Paul Morlet" width={64} height={64} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      </div>
    </div>
  )
}

// ── Nav formateur ─────────────────────────────────────────────────
const PAGE_TYPE_LABEL = {
  'naissance':      { label: 'Présentation', icon: '🏢' },
  'chiffres':       { label: 'Chiffres clés', icon: '📊' },
  'ventes-opticien':{ label: 'Question ouverte', icon: '🙋' },
  'promesse':       { label: 'La promesse LPT', icon: '⚡' },
  'force-lpt':      { label: 'Points clés', icon: '💡' },
  'freins':         { label: 'Question ouverte', icon: '🙋' },
  'prix':           { label: 'Question ouverte', icon: '🙋' },
  'video-lpt':      { label: 'Vidéo', icon: '🎬' },
  'impact':         { label: 'Impact visuel', icon: '👁️' },
  'probleme':       { label: 'Problème visuel', icon: '🔍' },
  'machines':           { label: 'Points clés',     icon: '⚙️' },
  'labo-progressif':    { label: 'Labo progressif', icon: '🔬' },
}

function TrainerNav({ onBack, pageIndex, total, onPrev, onNext, isFirst, isLast, nextPage, onTerminate }) {
  const typeInfo = nextPage ? (PAGE_TYPE_LABEL[nextPage.type] ?? { label: nextPage.type, icon: '📄' }) : null
  const accent = nextPage?.color || '#00abe9'
  const nextTitle = nextPage?.titre || nextPage?.question || nextPage?.label || '—'

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
      background: 'rgba(3,17,42,0.95)', backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '10px 20px 14px',
    }}>
      {/* Quitter + preview */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        {nextPage ? (
          <div style={{
            flex: 1, marginRight: 12,
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${accent}35`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: 10, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{typeInfo.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {nextTitle}
              </div>
              <div style={{ fontSize: 10, color: accent, marginTop: 1 }}>{typeInfo.label}</div>
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>suivant →</div>
          </div>
        ) : <div style={{ flex: 1 }} />}

        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.5)', padding: '7px 16px', borderRadius: 10,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          transition: 'all .2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}
        >✕ Quitter</button>
      </div>

      {/* Boutons nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {!isFirst ? (
          <button onClick={onPrev} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.6)', padding: '9px 22px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          >← Précédent</button>
        ) : <div />}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{
              width: i === pageIndex ? 20 : 6, height: 6, borderRadius: 3,
              background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)',
              transition: 'all .3s',
            }} />
          ))}
        </div>

        {isLast ? (
          <button onClick={onTerminate} style={{
            background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
            border: 'none', color: '#fff',
            padding: '9px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(124,58,237,0.45)',
          }}>▶ Démarrer le quiz</button>
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #0089ba, #00abe9)',
            border: 'none', color: '#fff',
            padding: '9px 22px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 24px rgba(0,171,233,0.45)',
          }}>Suivant →</button>
        )}
      </div>
    </div>
  )
}

const BUBBLE_COLORS = ['#00abe9','#4ade80','#f59e0b','#a78bfa','#f472b6','#34d399']

// ── Page interactive : freins à l'achat ───────────────────────────
function FreinsPage({ page, navProps }) {
  const [responses, setResponses] = useState({})
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const state = await getRoomSharedState(getActiveSessionCode())
        setResponses(state?.freins_responses || {})
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [])

  const entries = Object.entries(responses)

  const clearAll = () => {
    setSharedState({ freins_responses: {} }).catch(() => {})
    setResponses({})
  }

  const handleReveal = () => { setRevealed(true); setSharedState({ reveal_freins: true }).catch(() => {}) }
  const clearReveal = () => { setRevealed(false); setSharedState({ reveal_freins: false }).catch(() => {}) }
  const navPropsWithClear = { ...navProps, onNext: () => { clearReveal(); navProps.onNext?.() }, onPrev: () => { clearReveal(); navProps.onPrev?.() }, onTerminate: () => { clearReveal(); navProps.onTerminate?.() } }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      padding: '24px clamp(14px, 4vw, 48px) 100px', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise · Question ouverte</span>
        </div>
        <button onClick={clearAll} style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', borderRadius: 20, padding: '6px 16px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >🗑 Effacer les réponses</button>
      </div>

      {/* Question */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Question ouverte · En direct
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.35, maxWidth: 720 }}>{page.titre}</h1>
      </div>

      {/* Réponses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '48vh', overflowY: 'auto', paddingRight: 4 }}>
        {entries.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '12px 0' }}>
            En attente des réponses des participants…
          </div>
        ) : entries.map(([pName, resp], i) => (
          <div key={pName} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `3px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}`,
            borderRadius: 12, padding: '12px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
            animation: 'chipIn 0.35s ease both',
          }}>
            <span style={{
              fontSize: 12, fontWeight: 700, minWidth: 80, paddingTop: 2,
              color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
            }}>{pName}</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{resp.text}</span>
          </div>
        ))}
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {entries.length} réponse{entries.length > 1 ? 's' : ''} reçue{entries.length > 1 ? 's' : ''}
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        {!revealed ? (
          <button onClick={handleReveal} disabled={entries.length === 0} style={{
            background: entries.length > 0 ? 'linear-gradient(135deg, #00abe9, #0089ba)' : 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: 14, padding: '14px 28px',
            color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: entries.length > 0 ? 'pointer' : 'default',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: entries.length > 0 ? '0 4px 20px rgba(0,171,233,0.35)' : 'none',
          }}>
            📺 Afficher les réponses sur TV
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(0,171,233,0.12)', border: '1.5px solid rgba(0,171,233,0.4)', borderRadius: 14, padding: '12px 22px', color: '#00abe9', fontSize: 14, fontWeight: 700 }}>
              ✅ Réponses affichées sur le diffuseur
            </div>
            <button onClick={clearReveal} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 16px', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Masquer</button>
          </div>
        )}
      </div>

      <TrainerNav {...navPropsWithClear} />
    </div>
  )
}

// ── Page interactive : prix moyen ─────────────────────────────────
function PrixPage({ page, navProps }) {
  const [responses, setResponses] = useState({})
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const state = await getRoomSharedState(getActiveSessionCode())
        setResponses(state?.prix_responses || {})
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [])

  const entries = Object.entries(responses)

  const clearAll = () => {
    setSharedState({ prix_responses: {} }).catch(() => {})
    setResponses({})
  }

  const handleReveal = () => {
    setRevealed(true)
    setSharedState({ reveal_prix: true }).catch(() => {})
  }

  const clearReveal = () => {
    setRevealed(false)
    setSharedState({ reveal_prix: false }).catch(() => {})
  }

  const navPropsWithClear = {
    ...navProps,
    onNext:      () => { clearReveal(); navProps.onNext?.() },
    onPrev:      () => { clearReveal(); navProps.onPrev?.() },
    onTerminate: () => { clearReveal(); navProps.onTerminate?.() },
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      padding: '24px clamp(14px, 4vw, 48px) 100px', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise · Question ouverte</span>
        </div>
        <button onClick={clearAll} style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', borderRadius: 20, padding: '6px 16px',
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >🗑 Effacer les réponses</button>
      </div>

      {/* Question */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Question ouverte · En direct
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.35, maxWidth: 720 }}>{page.titre}</h1>
      </div>

      {/* Réponses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '48vh', overflowY: 'auto', paddingRight: 4 }}>
        {entries.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '12px 0' }}>
            En attente des réponses des participants…
          </div>
        ) : entries.map(([pName, resp], i) => (
          <div key={pName} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `3px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}`,
            borderRadius: 12, padding: '12px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
            animation: 'chipIn 0.35s ease both',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 80, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}>{pName}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{resp.text}</span>
          </div>
        ))}
      </div>

      {entries.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {entries.length} réponse{entries.length > 1 ? 's' : ''} reçue{entries.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Bouton révélation réponse */}
      <div style={{ marginTop: 32 }}>
        {!revealed ? (
          <button onClick={handleReveal} style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none', borderRadius: 14, padding: '14px 28px',
            color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(245,158,11,0.4)',
          }}>
            💡 Dévoiler la réponse sur l&apos;écran diffuseur
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: 'rgba(245,158,11,0.12)', border: '1.5px solid rgba(245,158,11,0.4)',
              borderRadius: 14, padding: '12px 22px',
              color: '#fbbf24', fontSize: 14, fontWeight: 700,
            }}>
              ✅ Réponse affichée sur le diffuseur : <strong>entre 400 et 500 euros</strong>
            </div>
            <button onClick={clearReveal} style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 16px', color: '#f87171',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Masquer</button>
          </div>
        )}
      </div>

      <TrainerNav {...navPropsWithClear} />
    </div>
  )
}

// ── Page interactive : ventes opticien ───────────────────────────
function VentesOpticienPage({ page, navProps }) {
  const [responses, setResponses] = useState({})
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const roomCode = getActiveSessionCode()
    const poll = async () => {
      try {
        const state = await getRoomSharedState(roomCode)
        setResponses(state?.ventes_responses || {})
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [])

  const entries = Object.entries(responses)
  const clearAll = () => {
    setSharedState({ ventes_responses: {} }).catch(() => {})
    setResponses({})
  }

  const handleReveal = () => {
    setRevealed(true)
    setSharedState({ reveal_ventes: true }).catch(() => {})
  }

  const clearReveal = () => {
    setRevealed(false)
    setSharedState({ reveal_ventes: false }).catch(() => {})
  }

  const navPropsWithClear = {
    ...navProps,
    onNext:      () => { clearReveal(); navProps.onNext?.() },
    onPrev:      () => { clearReveal(); navProps.onPrev?.() },
    onTerminate: () => { clearReveal(); navProps.onTerminate?.() },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise · Question ouverte</span>
        </div>
        <button onClick={clearAll} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >🗑 Effacer les réponses</button>
      </div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Question ouverte · En direct</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.35, maxWidth: 720 }}>{page.titre}</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '48vh', overflowY: 'auto' }}>
        {entries.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '12px 0' }}>En attente des réponses des participants…</div>
        ) : entries.map(([pName, resp], i) => (
          <div key={pName} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}`, borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 14, animation: 'chipIn 0.35s ease both' }}>
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 80, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}>{pName}</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{resp.text}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>paires / jour</span>
          </div>
        ))}
      </div>
      {entries.length > 0 && <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{entries.length} réponse{entries.length > 1 ? 's' : ''} reçue{entries.length > 1 ? 's' : ''}</div>}

      {/* Bouton révélation réponse */}
      <div style={{ marginTop: 32 }}>
        {!revealed ? (
          <button onClick={handleReveal} style={{
            background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
            border: 'none', borderRadius: 14, padding: '14px 28px',
            color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 4px 20px rgba(167,139,250,0.4)',
          }}>
            💡 Dévoiler la réponse sur l&apos;écran diffuseur
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              background: 'rgba(167,139,250,0.12)', border: '1.5px solid rgba(167,139,250,0.4)',
              borderRadius: 14, padding: '12px 22px',
              color: '#c4b5fd', fontSize: 14, fontWeight: 700,
            }}>
              ✅ Réponse affichée sur le diffuseur : <strong>entre 3 et 5 paires</strong>
            </div>
            <button onClick={clearReveal} style={{
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '10px 16px', color: '#f87171',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Masquer</button>
          </div>
        )}
      </div>

      <TrainerNav {...navPropsWithClear} />
    </div>
  )
}

// ── Page interactive : promesse ───────────────────────────────────
function PromessePage({ page, navProps }) {
  const [responses, setResponses] = useState({})
  const [revealed, setRevealed] = useState(false)
  const accent = '#34d399'

  useEffect(() => {
    const roomCode = getActiveSessionCode()
    const poll = async () => {
      try {
        const state = await getRoomSharedState(roomCode)
        setResponses(state?.promesse_responses || {})
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [])

  const entries = Object.entries(responses)
  const clearAll = () => {
    setSharedState({ promesse_responses: {} }).catch(() => {})
    setResponses({})
  }

  const handleReveal = () => { setRevealed(true); setSharedState({ reveal_promesse: true }).catch(() => {}) }
  const clearReveal = () => { setRevealed(false); setSharedState({ reveal_promesse: false }).catch(() => {}) }
  const navPropsWithClear = { ...navProps, onNext: () => { clearReveal(); navProps.onNext?.() }, onPrev: () => { clearReveal(); navProps.onPrev?.() }, onTerminate: () => { clearReveal(); navProps.onTerminate?.() } }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise · Question ouverte</span>
        </div>
        <button onClick={clearAll} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
        >🗑 Effacer les réponses</button>
      </div>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Question ouverte · En direct</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.35, maxWidth: 720 }}>{page.titre}</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '48vh', overflowY: 'auto', paddingRight: 4 }}>
        {entries.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '12px 0' }}>En attente des réponses des participants…</div>
        ) : entries.map(([pName, resp], i) => (
          <div key={pName} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}`, borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 14, animation: 'chipIn 0.35s ease both' }}>
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 80, paddingTop: 2, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}>{pName}</span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{resp.text}</span>
          </div>
        ))}
      </div>
      {entries.length > 0 && <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{entries.length} réponse{entries.length > 1 ? 's' : ''} reçue{entries.length > 1 ? 's' : ''}</div>}

      <div style={{ marginTop: 32 }}>
        {!revealed ? (
          <button onClick={handleReveal} disabled={entries.length === 0} style={{
            background: entries.length > 0 ? 'linear-gradient(135deg, #34d399, #059669)' : 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: 14, padding: '14px 28px',
            color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: entries.length > 0 ? 'pointer' : 'default',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: entries.length > 0 ? '0 4px 20px rgba(52,211,153,0.35)' : 'none',
          }}>
            📺 Afficher les réponses sur TV
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: 'rgba(52,211,153,0.12)', border: '1.5px solid rgba(52,211,153,0.4)', borderRadius: 14, padding: '12px 22px', color: '#34d399', fontSize: 14, fontWeight: 700 }}>
              ✅ Réponses affichées sur le diffuseur
            </div>
            <button onClick={clearReveal} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 16px', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Masquer</button>
          </div>
        )}
      </div>

      <TrainerNav {...navPropsWithClear} />
    </div>
  )
}

// ── Force LPT — items cliquables avec reveal vidéo/animation sur TV ─
function ForceLPTTrainer({ page, navProps }) {
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    setSharedState({ modele_point: null }).catch(() => {})
    return () => { setSharedState({ modele_point: null }).catch(() => {}) }
  }, [])

  const toggle = (i) => {
    const next = selected === i ? null : i
    setSelected(next)
    setSharedState({ modele_point: next }).catch(() => {})
  }

  const isZeroInter = selected === 4

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise · Notre modèle</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Les clés de notre modèle</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{page.titre}</h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>
        {selected !== null
          ? isZeroInter ? '▶ Animation diffusée — recliquez pour fermer' : '▶ Vidéo diffusée — recliquez pour fermer'
          : 'Cliquez sur un point pour lancer sur le diffuseur'}
      </p>

      <div style={{ display: 'flex', gap: 36, alignItems: 'flex-start' }}>
        {/* Liste des items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: '0 0 auto', maxWidth: 460 }}>
          {page.items.map((item, i) => (
            <div key={i} onClick={() => toggle(i)} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              background: selected === i ? `${item.color}18` : 'rgba(255,255,255,0.03)',
              border: selected === i ? `1px solid ${item.color}80` : '1px solid rgba(255,255,255,0.08)',
              borderLeft: `4px solid ${item.color}`,
              borderRadius: 16, padding: '18px 24px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              opacity: selected !== null && selected !== i ? 0.4 : 1,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 8px ${item.color}` }} />
              <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', flex: 1 }}>{item.label}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: selected === i ? item.color : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                {selected === i ? '■ Stop' : i === 4 ? '▶ Anim' : (item.video || item.animation) ? '▶' : ''}
              </div>
            </div>
          ))}
        </div>

        {/* Panel animation 0 intermédiaire */}
        {isZeroInter && (
          <div style={{
            flex: 1, minWidth: 0,
            background: 'rgba(244,114,182,0.05)',
            border: '1px solid rgba(244,114,182,0.18)',
            borderRadius: 20, padding: '22px 28px',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(244,114,182,0.7)', textTransform: 'uppercase', letterSpacing: 2 }}>
              Animation en cours sur le diffuseur
            </div>
            <ZeroInterChain compact />
          </div>
        )}
      </div>

      <TrainerNav {...navProps} />
    </div>
  )
}

// ── Page Laboratoire progressif Châtelet ──────────────────────────
function LaboProgressifPage({ navProps }) {
  const [revealed, setRevealed] = useState(false)

  const handleReveal = () => {
    setRevealed(true)
    setSharedState({ reveal_labo: true }).catch(() => {})
  }
  const clearReveal = () => {
    setRevealed(false)
    setSharedState({ reveal_labo: false }).catch(() => {})
  }
  const navPropsWithClear = {
    ...navProps,
    onNext:      () => { clearReveal(); navProps.onNext?.() },
    onPrev:      () => { clearReveal(); navProps.onPrev?.() },
    onTerminate: () => { clearReveal(); navProps.onTerminate?.() },
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0d0520 55%, #150a2e 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise · Laboratoire</span>
      </div>

      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', maxWidth: 1000 }}>
        {/* Photo */}
        <div style={{ flexShrink: 0, width: 300, borderRadius: 18, overflow: 'hidden', border: '2px solid rgba(124,58,237,0.4)', boxShadow: '0 0 32px rgba(124,58,237,0.25)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/labo-progressif-chatelet.jpg" alt="Laboratoire progressif Châtelet" style={{ width: '100%', height: 220, objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }} />
        </div>

        {/* Contenu */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
            🔬 Exclusivité mondiale · Paris Châtelet
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 10, lineHeight: 1.2 }}>Notre laboratoire progressif unique au monde</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 24 }}>
            Accessible à la vue des clients, équipé de <strong style={{ color: '#fff' }}>machines CoreTBA (MEI)</strong> introuvables dans n&apos;importe quel magasin d&apos;optique au monde.
          </p>

          {/* Bouton révélation */}
          {!revealed ? (
            <button onClick={handleReveal} style={{
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              border: 'none', borderRadius: 14, padding: '14px 28px',
              color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
            }}>
              🔬 Révéler les chiffres sur le diffuseur
            </button>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                {[
                  { label: '480 paires / jour', sub: 'capacité du laboratoire', color: '#a78bfa' },
                  { label: 'Dans la journée', sub: 'clients parisiens', color: '#4ade80' },
                  { label: '24 heures', sub: 'tous magasins hors IDF', color: '#00abe9' },
                  { label: '2 sem. à 1 mois', sub: 'autres opticiens', color: '#ef4444' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: `${s.color}15`, border: `1px solid ${s.color}50`,
                    borderRadius: 12, padding: '10px 16px', minWidth: 140,
                  }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: s.color, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: 'rgba(124,58,237,0.15)', border: '1.5px solid rgba(124,58,237,0.4)', borderRadius: 12, padding: '10px 20px', color: '#c4b5fd', fontSize: 13, fontWeight: 700 }}>
                  ✅ Chiffres affichés sur le diffuseur
                </div>
                <button onClick={clearReveal} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 16px', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Masquer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TrainerNav {...navPropsWithClear} />
    </div>
  )
}

// ── Page de transition vers le quiz ──────────────────────────────

function QuizTransitionPage({ navProps }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a0a3d 60%, #0d0a2e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', paddingBottom: 80 }}>
      {/* Halo décoratif */}
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
      {/* Icône */}
      <div style={{ fontSize: 64, marginBottom: 32, position: 'relative', zIndex: 1 }}>🧠</div>
      {/* Titre */}
      <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, maxWidth: 600, marginBottom: 16, position: 'relative', zIndex: 1 }}>
        Des questions avant<br />de passer au quiz ?
      </h1>
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 56, position: 'relative', zIndex: 1 }}>
        Le formateur peut répondre à vos dernières questions.
      </p>
      {/* Bouton Démarrer */}
      <button
        onClick={navProps.onTerminate}
        style={{
          position: 'relative', zIndex: 1,
          background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
          border: 'none', color: '#fff',
          padding: '16px 48px', borderRadius: 16, fontSize: 18, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 8px 32px rgba(124,58,237,0.5)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(124,58,237,0.65)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.5)' }}
      >
        ▶ Démarrer le quiz
      </button>
      <TrainerNav {...navProps} />
    </div>
  )
}

// ── Rendu de page ─────────────────────────────────────────────────

function EntreprisePage({ page, navProps }) {
  const accent = page.color || '#00abe9'

  const PageHeader = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise</span>
      </div>
      {page.videoPlaceholder && (
        <div style={{
          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: 20, padding: '5px 14px',
          fontSize: 11, fontWeight: 700, color: '#fbbf24', letterSpacing: 0.5,
        }}>🎬 {page.videoPlaceholder}</div>
      )}
    </div>
  )

  const PageTitle = () => (
    <div style={{ marginBottom: 36 }}>
      <div style={{
        display: 'inline-block',
        background: `rgba(${accent === '#ef4444' ? '239,68,68' : accent === '#16a34a' ? '22,163,74' : accent === '#7c3aed' ? '124,58,237' : accent === '#f59e0b' ? '245,158,11' : accent === '#db2777' ? '219,39,119' : '0,171,233'},.15)`,
        border: `1px solid ${accent}50`,
        borderRadius: 20, padding: '5px 20px',
        fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14,
      }}>Journée 1 · Présentation</div>
      <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>{page.titre}</h1>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{page.sousTitre}</p>
    </div>
  )

  // ── VENTES OPTICIEN ────────────────────────────────────────────
  if (page.type === 'ventes-opticien') return <VentesOpticienPage page={page} navProps={navProps} />

  // ── PROMESSE ───────────────────────────────────────────────────
  if (page.type === 'promesse') return <PromessePage page={page} navProps={navProps} />

  // ── FORCE LPT ──────────────────────────────────────────────────
  if (page.type === 'force-lpt') return <ForceLPTTrainer page={page} navProps={navProps} />

  // ── LABO PROGRESSIF ────────────────────────────────────────────
  if (page.type === 'labo-progressif') return <LaboProgressifPage navProps={navProps} />
  if (page.type === 'quiz-transition') return <QuizTransitionPage navProps={navProps} />

  // ── CHIFFRES CLÉS ──────────────────────────────────────────────

  if (page.type === 'chiffres') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise · Chiffres clés</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Chiffres clés</div>
      <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 32 }}>{page.titre}</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 700 }}>
        {page.stats.map((stat, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 20,
            background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.08)`,
            borderLeft: `4px solid ${stat.color}`,
            borderRadius: 16, padding: '18px 24px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', minWidth: 130 }}>{stat.value}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <TrainerNav {...navProps} />
    </div>
  )

  // ── VIDÉO LPT ──────────────────────────────────────────────────
  if (page.type === 'video-lpt') return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px clamp(14px, 4vw, 48px) 100px', position: 'relative',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(0,171,233,0.12)', border: '2px solid rgba(0,171,233,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, margin: '0 auto 24px',
          boxShadow: '0 0 32px rgba(0,171,233,0.2)',
        }}>🎬</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Vidéo en cours</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)' }}>Regardez l&apos;écran de diffusion</div>
      </div>
      <TrainerNav {...navProps} />
    </div>
  )

  // ── NAISSANCE ──────────────────────────────────────────────────
  if (page.type === 'naissance') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise</span>
      </div>

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Les origines
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
          {page.titre}
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
          &ldquo;{page.sousTitre}&rdquo;
        </p>
      </div>

      {/* Deux fondateurs côte à côte */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 60, flex: 1 }}>
        {[
          { src: '/assets/photo-Paul.jpg', name: 'Paul Morlet', role: 'Fondateur & CEO', pos: 'center center' },
          { src: '/assets/Photo-Xavier.png', name: 'Xavier Niel', role: 'Co-fondateur & Investisseur', pos: '60% top' },
        ].map((person, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 180, height: 180, borderRadius: '50%', overflow: 'hidden',
              border: '3px solid rgba(0,171,233,0.6)',
              boxShadow: '0 0 0 6px rgba(0,171,233,0.1), 0 12px 40px rgba(0,171,233,0.3)',
            }}>
              <Image src={person.src} alt={person.name} width={180} height={180}
                style={{ objectFit: 'cover', objectPosition: person.pos || 'center center', width: '100%', height: '100%' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{person.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{person.role}</div>
            </div>
          </div>
        ))}
      </div>

      <TrainerNav {...navProps} />
    </div>
  )

  // ── FREINS ─────────────────────────────────────────────────────
  if (page.type === 'freins') return <FreinsPage page={page} navProps={navProps} />

  // ── PRIX ────────────────────────────────────────────────────────
  if (page.type === 'prix') return <PrixPage page={page} navProps={navProps} />

  // ── IMPACT ─────────────────────────────────────────────────────
  if (page.type === 'impact') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', maxWidth: 760 }}>
            <div style={{ fontSize: 56, marginBottom: 24 }}>👁️</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Bienvenue</div>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 16 }}>{page.titre}</h1>
            <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', marginBottom: 48, lineHeight: 1.5 }}>"{page.sousTitre}"</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {page.points.map((p, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 16, padding: '18px 24px', textAlign: 'center', minWidth: 160,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{p.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{p.titre}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{p.texte}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── PROBLÈME ────────────────────────────────────────────────────
  if (page.type === 'probleme') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a0505 55%, #2d0808 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <PageTitle />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 900, margin: '0 auto' }}>
          {page.points.map((p, i) => (
            <div key={i} style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 18, padding: '24px',
            }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{p.emoji}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{p.titre}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.texte}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
            borderRadius: 20, padding: '10px 28px', fontSize: 15, fontWeight: 700, color: '#00abe9', fontStyle: 'italic',
          }}>Et si on pouvait faire autrement ?</div>
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── TIMELINE ────────────────────────────────────────────────────
  if (page.type === 'timeline') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <PageTitle />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'rgba(0,171,233,0.3)', borderRadius: 1 }} />
          {page.timeline.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 28, marginBottom: 28, position: 'relative' }}>
              <div style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: i === page.timeline.length - 1 ? '#00abe9' : 'rgba(0,171,233,0.15)',
                border: `2px solid ${i === page.timeline.length - 1 ? '#00abe9' : 'rgba(0,171,233,0.4)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === page.timeline.length - 1 ? '#fff' : '#00abe9' }} />
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14, padding: '16px 20px', flex: 1,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1, marginBottom: 4 }}>{item.year}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── PILIERS ─────────────────────────────────────────────────────
  if (page.type === 'piliers') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #021a0c 55%, #042a14 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <PageTitle />
        <div style={{ display: 'flex', gap: 20, maxWidth: 960, margin: '0 auto' }}>
          {page.points.map((p, i) => (
            <div key={i} style={{
              flex: 1, background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 20, padding: '32px 24px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>{p.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>{p.titre}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.texte}</div>
            </div>
          ))}
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── ÉTAPES FABRICATION ──────────────────────────────────────────
  if (page.type === 'steps') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a0f02 55%, #2a1a04 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <PageTitle />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, maxWidth: 960, margin: '0 auto' }}>
          {page.steps.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 16, padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>{s.num}</div>
                <span style={{ fontSize: 20 }}>{s.emoji}</span>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{s.titre}</div>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{s.texte}</div>
            </div>
          ))}
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── MACHINES ────────────────────────────────────────────────────
  if (page.type === 'machines') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0d0520 55%, #150a2e 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <PageTitle />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 800, margin: '0 auto' }}>
          {page.points.map((p, i) => (
            <div key={i} style={{
              background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)',
              borderRadius: 18, padding: '24px 28px', display: 'flex', alignItems: 'flex-start', gap: 20,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0,
              }}>{p.emoji}</div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.titre}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.texte}</div>
              </div>
            </div>
          ))}
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── CAS CLIENTS ─────────────────────────────────────────────────
  if (page.type === 'cases') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a0510 55%, #2d0820 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <PageTitle />
        <div style={{ display: 'flex', gap: 18, maxWidth: 1000, margin: '0 auto' }}>
          {page.cases.map((c, i) => (
            <div key={i} style={{
              flex: 1, background: 'rgba(219,39,119,0.06)', border: '1px solid rgba(219,39,119,0.2)',
              borderRadius: 20, padding: '28px 22px',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{c.emoji}</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{c.prenom}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>{c.age} · {c.contexte}</div>
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: 10, padding: '10px 14px', marginBottom: 10,
                fontSize: 12, color: '#f87171', lineHeight: 1.5,
              }}>❌ Sans LPT : {c.sans}</div>
              <div style={{
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 10, padding: '10px 14px',
                fontSize: 12, color: '#4ade80', lineHeight: 1.5,
              }}>✅ Avec LPT : {c.avec}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <div style={{ fontSize: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)' }}>
            "Tu ne vends pas seulement des lunettes. Tu aides les gens à retrouver leur autonomie."
          </div>
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── VISAGES LPT ─────────────────────────────────────────────────
  if (page.type === 'visages') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #031a20 55%, #052a30 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <PageTitle />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 880, margin: '0 auto' }}>
          {page.profils.map((p, i) => (
            <div key={i} style={{
              background: 'rgba(8,145,178,0.07)', border: '1px solid rgba(8,145,178,0.2)',
              borderRadius: 18, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: 'rgba(8,145,178,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0,
              }}>{p.emoji}</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.metier}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{p.message}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <div style={{
            display: 'inline-block', background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)',
            borderRadius: 20, padding: '10px 28px', fontSize: 15, fontWeight: 700, color: '#00abe9', fontStyle: 'italic',
          }}>
            "Peu importe d'où tu viens. Ce qui compte, c'est ce que tu vas construire ici."
          </div>
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── CROISSANCE ──────────────────────────────────────────────────
  if (page.type === 'croissance') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #021a0c 55%, #042a14 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <PageTitle />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, maxWidth: 900, margin: '0 auto 40px' }}>
          {page.stats.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 18, padding: '28px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#4ade80', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 700, margin: '0 auto' }}>
          {page.points.map((p, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{p.titre}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{p.texte}</div>
              </div>
            </div>
          ))}
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── MISSION FINALE ──────────────────────────────────────────────
  if (page.type === 'mission') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
        <PageHeader />
        <div style={{ textAlign: 'center', maxWidth: 800, margin: '40px auto' }}>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', marginBottom: 12 }}>{page.titre}</h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', marginBottom: 48 }}>{page.sousTitre}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 48 }}>
            {page.temoignages.map((t, i) => (
              <div key={i} style={{
                background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.25)',
                borderRadius: 18, padding: '22px 28px',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontStyle: 'italic', marginBottom: 8 }}>{t.quote}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t.context}</div>
              </div>
            ))}
          </div>
          <div style={{
            display: 'inline-block', background: 'linear-gradient(135deg, rgba(0,137,186,0.3), rgba(0,171,233,0.15))',
            border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '14px 32px',
            fontSize: 16, fontWeight: 800, color: '#00abe9',
          }}>
            Tu participes à rendre la vue accessible à tous.
          </div>
        </div>
        <PaulBubble script={page.avatarScript} />
        <TrainerNav {...navProps} />
      </div>
    )
  }

  // ── FALLBACK ────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 100px' }}>
      <PageHeader />
      <PageTitle />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, margin: '0 auto' }}>
        {(page.points || []).map((p, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 16, padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16,
          }}>
            <span style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.titre}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.texte}</div>
            </div>
          </div>
        ))}
      </div>
      <PaulBubble script={page.avatarScript} />
      <TrainerNav {...navProps} />
    </div>
  )
}

// ── Text-Open Controller ──────────────────────────────────────────
function TextOpenController({ quizQ, onNext, onEnd, onBack }) {
  const [openAnswers, setOpenAnswers] = useState([])
  const [validating, setValidating] = useState({})
  const [validated, setValidated] = useState({})
  const autoValidatedRef = useRef(new Set())

  const q = ENTREPRISE_QUIZ[quizQ]
  const isLast = quizQ >= ENTREPRISE_QUIZ.length - 1
  const pageId = `entreprise:${quizQ}`

  useEffect(() => {
    setOpenAnswers([])
    setValidating({})
    setValidated({})
    autoValidatedRef.current = new Set()

    const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

    const autoValidate = (deduped) => {
      const kws      = q?.autoCorrect      // OR : n'importe quel mot suffit
      const kwsAll   = q?.autoCorrectAll   // AND : tous les mots doivent être présents
      const kwsExact = q?.autoCorrectExact // liste blanche de réponses exactes (whole-answer)
      const kwsEach  = q?.autoCorrectEach  // text-open-multi : un groupe de mots-clés par case attendue
      if (!kws?.length && !kwsAll?.length && !kwsExact?.length && !kwsEach?.length) return
      for (const row of deduped) {
        const name = row.participant_name
        if (autoValidatedRef.current.has(name)) continue
        const raw  = (row.answer || '').trim()
        const text = stripAccents(raw.toLowerCase())
        const matchOr    = kws?.length    && kws.some(kw  => text.includes(stripAccents(kw.toLowerCase())))
        const matchAnd   = kwsAll?.length && kwsAll.every(kw => text.includes(stripAccents(kw.toLowerCase())))
        const matchExact = kwsExact?.length && kwsExact.some(kw => text === stripAccents(kw.toLowerCase()))
        const matchEach  = kwsEach?.length && (() => {
          const parts = raw.split('||').map(p => stripAccents(p.trim().toLowerCase())).filter(Boolean)
          return kwsEach.every(group => group.some(kw => parts.some(p => p.includes(stripAccents(kw.toLowerCase())))))
        })()
        if (matchOr || matchAnd || matchExact || matchEach) {
          autoValidatedRef.current.add(name)
          setValidating(v => ({ ...v, [name]: true }))
          saveModuleQuizAnswer({ moduleId: 'entreprise', questionIdx: quizQ, collaborateur: name, answerIdx: 0, isCorrect: true })
            .then(() => {
              setValidated(v => ({ ...v, [name]: 'correct' }))
              setValidating(v => ({ ...v, [name]: false }))
            })
            .catch(() => { autoValidatedRef.current.delete(name) })
        }
      }
    }

    const poll = async () => {
      const rows = await fetchOpenAnswers(getActiveSessionCode(), pageId)
      // Dédupliquer par participant : garder uniquement la dernière réponse
      // (évite qu'une ancienne réponse correcte d'une session précédente déclenche le ✓)
      const latest = {}
      for (const row of rows || []) latest[row.participant_name] = row
      const deduped = Object.values(latest)
      setOpenAnswers(deduped)
      autoValidate(deduped)
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [quizQ, pageId])

  const handleValidate = async (row, isCorrect) => {
    if (validating[row.participant_name]) return
    setValidating(v => ({ ...v, [row.participant_name]: true }))
    try {
      await saveModuleQuizAnswer({
        moduleId: 'entreprise',
        questionIdx: quizQ,
        collaborateur: row.participant_name,
        answerIdx: 0,
        isCorrect,
      })
      setValidated(v => ({ ...v, [row.participant_name]: isCorrect ? 'correct' : 'wrong' }))
    } catch { /* permet de réessayer */ }
    finally {
      setValidating(v => ({ ...v, [row.participant_name]: false }))
    }
  }

  const formatAnswer = (answer) => {
    if (q?.type !== 'text-open-multi') return answer
    return (answer || '').split('||').map(s => s.trim()).filter(Boolean).join(' // ')
  }

  const handleShowCorrection = async () => {
    await setSharedState({ quiz_show_correction: true }).catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Culture d&apos;entreprise — Vue formateur</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>

      {/* Compteur */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.2)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {ENTREPRISE_QUIZ.length}
        </div>
      </div>

      {/* Question */}
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, maxWidth: 800, margin: '0 auto 14px' }}>
        {q.question}
      </div>

      {/* Réponse attendue */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)', borderRadius: 12, padding: '8px 22px', fontSize: 12, color: 'rgba(0,171,233,0.7)', fontStyle: 'italic' }}>
          Réponse attendue : {q.hint}
        </div>
      </div>

      {/* Liste des réponses */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, margin: '0 auto', maxHeight: '45vh', overflowY: 'auto', paddingRight: 4 }}>
        {openAnswers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
            En attente des réponses des participants…
          </div>
        ) : openAnswers.map((row, i) => {
          const status = validated[row.participant_name]
          const isValidating = validating[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: status === 'correct' ? 'rgba(34,197,94,0.08)' : status === 'wrong' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === 'correct' ? 'rgba(34,197,94,0.3)' : status === 'wrong' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: `${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}22`,
                border: `2px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}60`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length],
              }}>
                {row.participant_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length], marginBottom: 3 }}>{row.participant_name}</div>
                <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.4 }}>{formatAnswer(row.answer)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleValidate(row, true)}
                  disabled={!!isValidating}
                  title="Marquer correct"
                  style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: status === 'correct' ? '#16a34a' : 'rgba(34,197,94,0.18)', color: status === 'correct' ? '#fff' : '#4ade80', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.5 : 1, fontFamily: 'inherit', transition: 'background .15s' }}
                >✓</button>
                <button
                  onClick={() => handleValidate(row, false)}
                  disabled={!!isValidating}
                  title="Marquer faux"
                  style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: status === 'wrong' ? '#dc2626' : 'rgba(239,68,68,0.18)', color: status === 'wrong' ? '#fff' : '#f87171', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.5 : 1, fontFamily: 'inherit', transition: 'background .15s' }}
                >✗</button>
              </div>
            </div>
          )
        })}
      </div>

      {openAnswers.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
          {openAnswers.length} réponse{openAnswers.length > 1 ? 's' : ''} reçue{openAnswers.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
        {openAnswers.length > 0 && (
          <button onClick={handleShowCorrection} style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🎯 Voir la correction
          </button>
        )}
        {isLast ? (
          <button onClick={onEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>
            ✓ Voir les résultats
          </button>
        ) : (
          <button onClick={async () => { await setSharedState({ quiz_show_correction: false }).catch(() => {}); onNext() }} style={{ background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none', color: '#fff', padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(0,171,233,0.45)' }}>
            Question suivante →
          </button>
        )}
      </div>
    </div>
  )
}

// ── Quiz Controller ───────────────────────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers] = useState([])
  const q = ENTREPRISE_QUIZ[quizQ]
  const isLast = quizQ >= ENTREPRISE_QUIZ.length - 1

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.entreprise&question_idx=eq.${quizQ}`
      )
      setLiveAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  const total = liveAnswers.length
  const counts = q.options.map((_, i) => liveAnswers.filter(r => r.answer_idx === i).length)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Présentation entreprise — Vue formateur</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {ENTREPRISE_QUIZ.length}
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 36, lineHeight: 1.3, maxWidth: 800, alignSelf: 'center' }}>{q.question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        {q.options.map((opt, i) => {
          const count = counts[i]
          const isCorrect = i === q.correct
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={i} style={{ background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: OPTION_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{'ABC'[i]}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt}</span>
                  {isCorrect && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 10px', borderRadius: 20 }}>✓ Bonne réponse</span>}
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: isCorrect ? '#4ade80' : '#fff' }}>
                  {count}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 4 }}>vote{count > 1 ? 's' : ''}</span>
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: isCorrect ? '#4ade80' : OPTION_COLORS[i], transition: 'width .5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginRight: 6 }}>{total}</span>
          participant{total !== 1 ? 's' : ''} {total !== 1 ? 'ont' : 'a'} répondu
        </div>
        {isLast ? (
          <button onClick={onEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={onNext} style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67fa)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(124,58,237,0.45)' }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Group Results ─────────────────────────────────────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const rows = await fetchTrainerQuizAnswers(`session_code=eq.${getActiveSessionCode()}&module_id=eq.entreprise`)
      setAnswers(rows || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const participantCount = [...new Set(answers.map(r => r.collaborateur))].length

  const questionStats = ENTREPRISE_QUIZ.map((q, idx) => {
    const qAnswers = answers.filter(r => r.question_idx === idx)
    const wrongCount = qAnswers.filter(r => !r.is_correct).length
    const total = qAnswers.length
    const pctWrong = total > 0 ? Math.round((wrongCount / total) * 100) : 0
    return { idx, question: q.question, pctWrong, total }
  }).sort((a, b) => b.pctWrong - a.pctWrong)

  const getPriority = (pct) => {
    if (pct >= 50) return { icon: '🔴', label: 'À retravailler en priorité', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
    if (pct >= 25) return { icon: '🟡', label: 'À consolider', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
    return { icon: '🟢', label: 'Bien maîtrisé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan · Présentation de l&apos;entreprise</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{participantCount}</span>
          participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d&apos;erreur décroissant</p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, alignSelf: 'center', width: '100%', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15, padding: 40 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const priority = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{ background: priority.bg, border: `1px solid ${priority.border}`, borderRadius: 18, padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{priority.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: priority.color, textTransform: 'uppercase', letterSpacing: 1 }}>{priority.label}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>Q{stat.idx + 1} — {stat.question}</div>
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: priority.color, lineHeight: 1, flexShrink: 0 }}>
                  {stat.pctWrong}%
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>d&apos;erreurs</div>
                </div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${stat.pctWrong}%`, background: priority.color, transition: 'width .8s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button onClick={onTerminate} style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(220,38,38,0.4)' }}>✓ Terminer le module</button>
      </div>
    </div>
  )
}

// ── Lobby ─────────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Retour</button>
      <div style={{ textAlign: 'center', maxWidth: 540, padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={180} height={68} style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Module de formation · Journée 1</div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Présentation de l&apos;entreprise</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
          Mission · Histoire · Culture LPT<br />
          Comprendre pourquoi LPT existe et ce que vous y construisez
        </p>
        <button onClick={onStart} style={{ background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none', color: '#fff', padding: '16px 48px', borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,171,233,0.45)', fontFamily: 'inherit' }}>▶ Lancer le module</button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>{PAGES.length} slides · ~25 minutes</p>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function ModuleEntreprise({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [quizMode, setQuizMode] = useState(null) // null | 'quiz' | 'results'
  const [quizQ, setQuizQ] = useState(0)

  useEffect(() => {
    sbUpdate('sessions', { active_module: 'entreprise', module_page: -1 }, `code=eq.${getActiveSessionCode()}`).catch(() => {})
  }, [])

  useEffect(() => {
    if (started && !quizMode) {
      sbUpdate('sessions', { active_module: 'entreprise', module_page: pageIndex }, `code=eq.${getActiveSessionCode()}`).catch(() => {})
    }
  }, [pageIndex, started, quizMode])

  useEffect(() => {
    if (quizMode === 'quiz') {
      sbUpdate('sessions', { active_module: 'entreprise', module_page: 100 + quizQ }, `code=eq.${getActiveSessionCode()}`).catch(() => {})
    }
  }, [quizMode, quizQ])

  const handleBack = async () => {
    try {
      await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    } catch { /* best-effort */ }
    ;(onTerminate ?? onBack)()
  }

  const handleTerminateSlides = async () => {
    try {
      await setSharedState({
        reveal_freins: false, reveal_prix: false, reveal_ventes: false,
        reveal_promesse: false, reveal_labo: false, modele_point: null,
        quiz_show_correction: false,
      })
    } catch { /* best-effort */ }
    setQuizMode('quiz')
    setQuizQ(0)
  }

  const handleEndModule = async () => {
    try {
      await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    } catch { /* best-effort */ }
    ;(onTerminate ?? onBack)()
  }

  if (!started) return <Lobby onStart={() => setStarted(true)} onBack={handleBack} />

  if (quizMode === 'quiz') {
    return (
      <TextOpenController
        quizQ={quizQ}
        onNext={() => setQuizQ(q => q + 1)}
        onEnd={() => {
          setQuizMode('results')
          sbUpdate('sessions', { active_module: 'entreprise', module_page: 200 }, `code=eq.${getActiveSessionCode()}`)
        }}
        onBack={handleEndModule}
      />
    )
  }

  if (quizMode === 'results') {
    return <GroupResultsView onTerminate={handleEndModule} />
  }

  const page = PAGES[pageIndex]
  const navProps = {
    onBack: handleBack,
    pageIndex,
    total: PAGES.length,
    onPrev: () => setPageIndex(i => Math.max(i - 1, 0)),
    onNext: () => setPageIndex(i => Math.min(i + 1, PAGES.length - 1)),
    isFirst: pageIndex === 0,
    isLast: pageIndex === PAGES.length - 1,
    nextPage: PAGES[pageIndex + 1] ?? null,
    onTerminate: handleTerminateSlides,
  }

  return <EntreprisePage page={page} navProps={navProps} />
}
