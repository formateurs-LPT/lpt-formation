'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbSelect, getActiveSessionCode, setSharedState } from '@/lib/supabase'

const THEMES = [
  'Un client qui veut du progressif mais n\'en a jamais porté',
  'Un client qui souhaite faire un test de vue pour la première fois',
  'Un client qui dit ne pas avoir besoin de correction',
  'Un client qui rentre avec une ordonnance en main',
  'Un client qui rentre et connaît déjà le concept LPT',
  'Une personne qui rentre et qui est déjà cliente',
  'Un client qui veut une paire à 10 € en 10 minutes',
  'Un client avec une correction de -10 : un vrai défi technique',
  'Un client presbyte qui a des appréhensions sur le verre progressif',
  'Un client qui souhaite une paire solaire à sa vue',
]

const STYLES = `
  @keyframes slotSpin {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.6; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
`

// ── Slot reel ──────────────────────────────────────────────────────
function SlotReel({ items, spinning, result, label, color }) {
  const reelRef = useRef(null)
  const [displayItems, setDisplayItems] = useState([])

  useEffect(() => {
    if (items.length === 0) return
    // Double the list to create infinite scroll illusion
    const repeated = [...items, ...items, ...items, ...items]
    setDisplayItems(repeated)
  }, [items])

  const itemH = 56

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2 }}>
        {label}
      </div>
      <div style={{
        width: 180, height: itemH * 3,
        background: 'rgba(0,0,0,0.4)',
        border: `2px solid ${color}55`,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 0 24px ${color}30, inset 0 0 20px rgba(0,0,0,0.5)`,
      }}>
        {/* Top/bottom fade masks */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', zIndex: 2, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', zIndex: 2, pointerEvents: 'none' }} />
        {/* Center highlight */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: itemH, transform: 'translateY(-50%)',
          border: `1px solid ${color}80`,
          background: `${color}12`,
          zIndex: 1, pointerEvents: 'none',
          borderRadius: 8,
        }} />
        {/* Reel */}
        <div
          ref={reelRef}
          style={{
            display: 'flex', flexDirection: 'column',
            animation: spinning ? `slotSpin ${0.15}s linear infinite` : 'none',
          }}
        >
          {(spinning ? displayItems : (result ? [result, result, result] : displayItems.slice(0, 3))).map((name, i) => (
            <div key={i} style={{
              height: itemH, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff',
              padding: '0 12px', textAlign: 'center',
              lineHeight: 1.2,
            }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Theme reel (wider) ─────────────────────────────────────────────
function ThemeReel({ spinning, result }) {
  const COLOR = '#00abe9'
  const repeated = [...THEMES, ...THEMES, ...THEMES]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2 }}>
        Scénario client
      </div>
      <div style={{
        width: '100%', maxWidth: 640, height: 72,
        background: 'rgba(0,0,0,0.4)',
        border: `2px solid ${COLOR}55`,
        borderRadius: 16, overflow: 'hidden',
        position: 'relative',
        boxShadow: `0 0 24px ${COLOR}30, inset 0 0 20px rgba(0,0,0,0.5)`,
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', zIndex: 2 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 24, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', zIndex: 2 }} />
        <div style={{ animation: spinning ? `slotSpin ${0.12}s linear infinite` : 'none', display: 'flex', flexDirection: 'column' }}>
          {(spinning ? repeated : (result ? [result, result, result] : THEMES.slice(0, 3))).map((t, i) => (
            <div key={i} style={{
              height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 700, color: '#fff',
              padding: '0 24px', textAlign: 'center', lineHeight: 1.3,
            }}>
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────
export default function ModuleMiniJeux({ pName, onBack }) {
  const [participants, setParticipants]   = useState([])
  const [spinning1,    setSpinning1]      = useState(false)
  const [spinning2,    setSpinning2]      = useState(false)
  const [spinningT,    setSpinningT]      = useState(false)
  const [vendeur,      setVendeur]        = useState(null)
  const [client,       setClient]         = useState(null)
  const [theme,        setTheme]          = useState(null)
  const [phase,        setPhase]          = useState('idle') // idle | spinning | revealed

  useEffect(() => {
    sbSelect('participants', `session_code=eq.${getActiveSessionCode()}&order=joined_at.asc`)
      .then(rows => setParticipants((rows || []).map(r => r.name || r.participant_name || r.collaborateur).filter(Boolean)))
  }, [])

  useEffect(() => {
    return () => {
      setSharedState({ minijeu_vendeur: null, minijeu_client: null, minijeu_theme: null, minijeu_phase: 'idle' }).catch(() => {})
    }
  }, [])

  const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

  const launch = async () => {
    if (participants.length < 2) return
    setPhase('spinning')
    setVendeur(null); setClient(null); setTheme(null)
    setSpinning1(true); setSpinning2(true); setSpinningT(true)

    await setSharedState({ minijeu_vendeur: null, minijeu_client: null, minijeu_theme: null, minijeu_phase: 'spinning' }).catch(() => {})

    const [p1, p2] = shuffle(participants)
    const t = THEMES[Math.floor(Math.random() * THEMES.length)]

    // Collaborateurs s'arrêtent après 2.5s
    setTimeout(() => {
      setSpinning1(false); setVendeur(p1)
      setTimeout(() => {
        setSpinning2(false); setClient(p2)
        // Scénario s'arrête après 1s supplémentaire
        setTimeout(() => {
          setSpinningT(false); setTheme(t)
          setPhase('revealed')
          setSharedState({ minijeu_vendeur: p1, minijeu_client: p2, minijeu_theme: t, minijeu_phase: 'revealed' }).catch(() => {})
        }, 1000)
      }, 600)
    }, 2500)
  }

  const reset = async () => {
    setPhase('idle')
    setVendeur(null); setClient(null); setTheme(null)
    setSpinning1(false); setSpinning2(false); setSpinningT(false)
    await setSharedState({ minijeu_vendeur: null, minijeu_client: null, minijeu_theme: null, minijeu_phase: 'idle' }).catch(() => {})
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a0a1a 100%)', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Mini Jeux · Accueil moi si tu peux</span>
          </div>
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 40px', gap: 40 }}>

          {/* Title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>Mini Jeux · Formation</div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>Accueil moi si tu peux 🎰</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
              {participants.length === 0
                ? 'En attente des participants...'
                : `${participants.length} participant${participants.length > 1 ? 's' : ''} connecté${participants.length > 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Slot machines — collaborateurs */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 40 }}>
            <SlotReel
              items={participants}
              spinning={spinning1}
              result={vendeur}
              label="🧑‍💼 Vendeur"
              color="#8b5cf6"
            />

            <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.2)', marginBottom: 24, fontWeight: 900 }}>VS</div>

            <SlotReel
              items={participants}
              spinning={spinning2}
              result={client}
              label="🛍️ Client"
              color="#f59e0b"
            />
          </div>

          {/* Scénario reel */}
          <div style={{ width: '100%', maxWidth: 640 }}>
            <ThemeReel spinning={spinningT} result={theme} />
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {phase !== 'idle' && (
              <button onClick={reset}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '14px 28px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >↺ Rejouer</button>
            )}
            <button
              onClick={launch}
              disabled={participants.length < 2 || phase === 'spinning'}
              style={{
                background: phase === 'spinning'
                  ? 'rgba(139,92,246,0.3)'
                  : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                border: 'none', color: '#fff',
                padding: '16px 48px', borderRadius: 14,
                fontSize: 17, fontWeight: 800, cursor: phase === 'spinning' ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                boxShadow: phase === 'spinning' ? 'none' : '0 8px 32px rgba(139,92,246,0.5)',
                animation: phase === 'spinning' ? 'pulse 0.8s ease-in-out infinite' : 'none',
                transition: 'all .2s',
              }}
            >
              {phase === 'spinning' ? '🎰 En cours...' : '🎰 Lancer la machine !'}
            </button>
          </div>

          {/* Result card */}
          {phase === 'revealed' && vendeur && client && theme && (
            <div style={{
              width: '100%', maxWidth: 640,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20, padding: '28px 32px',
              animation: 'fadeInUp 0.5s ease',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Résumé du tirage</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Vendeur</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{vendeur}</div>
                </div>
                <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 24, fontWeight: 900 }}>↔</div>
                <div>
                  <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Client</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{client}</div>
                </div>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />
              <div style={{ fontSize: 11, color: '#00abe9', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Scénario</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>"{theme}"</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
