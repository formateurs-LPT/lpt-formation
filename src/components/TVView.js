'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA, ORD_COLS, ORD_EXAMPLE, SAISIE_EXERCISES, TRAME_ACCUEIL_POINTS, MUTUELLES_BELGIQUE } from '@/lib/modulesData'
import { PLANNING_JOURS } from '@/lib/planningData'
import { sbSelect, SESSION_CODE } from '@/lib/supabase'
import { buildQrImageUrl, getLegacySessionCode, getTvDisplayRoomCode } from '@/lib/sessionCode'
import ZeroInterChain from '@/components/ZeroInterChain'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── Keyframes ─────────────────────────────────────────────────────
const STYLES = `
  html, body { overflow: hidden !important; height: 100% !important; margin: 0; }

  @keyframes trameSlideIn {
    from { opacity: 0; transform: translateX(-24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes verreFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-16px) scale(1.04); }
  }
  @keyframes haloPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.15); }
  }
  @keyframes particleFloat {
    from { transform: translateY(0px); opacity: 0.2; }
    to   { transform: translateY(-14px); opacity: 0.5; }
  }
  @keyframes waitingPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  @keyframes logoBreathe {
    0%, 100% { opacity: 0.85; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.06); }
  }
  @keyframes chipIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .frise-chips { -ms-overflow-style: none; scrollbar-width: none; }
  .frise-chips::-webkit-scrollbar { display: none; }
  @keyframes bubbleIn {
    from { opacity: 0; transform: scale(0.6) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(100%); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes podiumRise {
    from { transform: scaleY(0); transform-origin: bottom; }
    to   { transform: scaleY(1); transform-origin: bottom; }
  }
  @keyframes podiumFadeIn {
    from { opacity: 0; transform: translateY(-18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes starPulse {
    0%, 100% { opacity: 0.25; transform: scale(0.8); }
    50%       { opacity: 0.9;  transform: scale(1.3); }
  }
  @keyframes trophyFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes slotScroll {
    from { transform: translateY(0); }
    to   { transform: translateY(-33.333%); }
  }
  @keyframes slotBrake {
    from { transform: translateY(0); }
    to   { transform: translateY(-33.333%); }
  }
  @keyframes resultBounce {
    0%   { transform: scale(0.82); opacity: 0; }
    65%  { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes mjFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mjPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.45; }
  }
`

// ── Verre animé ───────────────────────────────────────────────────
function VerreAnime({ color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <Image
          src="/assets/verre-unifocal-2.png"
          alt="Verre optique"
          width={560}
          height={560}
          style={{ objectFit: 'contain', filter: `drop-shadow(0 0 64px ${color}90) drop-shadow(0 24px 48px rgba(0,0,0,0.35))` }}
          priority
        />
      </div>
    </div>
  )
}

// ── TV Quiz Question ──────────────────────────────────────────────
function TVQuizQuestion({ question, qIdx, total, moduleLabel }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 80px', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 24, left: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Quiz · {moduleLabel}</span>
      </div>

      {/* Badge question */}
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '8px 28px', marginBottom: 36,
        fontSize: 14, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 2,
      }}>Question {qIdx + 1} / {total}</div>

      {/* Question */}
      <h1 style={{
        fontSize: 54, fontWeight: 800, color: '#fff', textAlign: 'center',
        lineHeight: 1.2, marginBottom: 64, maxWidth: 1000,
      }}>{question.question}</h1>

      {/* Réponses */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: question.options.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24, width: '100%', maxWidth: 1000,
      }}>
        {question.options.map((opt, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 24, padding: '28px 32px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              background: OPTION_COLORS[i],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#fff',
            }}>{'ABCD'[i]}</div>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{opt}</span>
          </div>
        ))}
      </div>

      {/* Instruction bas */}
      <div style={{
        position: 'absolute', bottom: 32,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.2)',
        borderRadius: 20, padding: '10px 24px',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.4s ease-in-out infinite' }} />
        <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Répondez depuis votre téléphone</span>
      </div>
    </div>
  )
}

// ── TV Image Visual (photo avec halo animé) ───────────────────────
function TVImageVisual({ src, color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 560, height: 560, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}35 0%, transparent 70%)`,
        animation: 'haloPulse 3.5s ease-in-out infinite',
      }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Module illustration"
        style={{
          width: 420, height: 'auto',
          animation: 'verreFloat 4s ease-in-out infinite',
          position: 'relative', zIndex: 1,
          filter: `drop-shadow(0 0 48px ${color}80) drop-shadow(0 20px 40px rgba(0,0,0,0.45))`,
        }}
      />
    </div>
  )
}

// ── TV Emoji Visual (grand emoji avec glow) ───────────────────────
function TVEmojiVisual({ emoji, color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 460, height: 460, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 65%)`,
        animation: 'haloPulse 3.5s ease-in-out infinite',
      }} />
      <div style={{
        width: 320, height: 320, borderRadius: '50%',
        background: `${color}18`, border: `2px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'verreFloat 4s ease-in-out infinite',
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontSize: 160, lineHeight: 1 }}>{emoji}</span>
      </div>
    </div>
  )
}

// ── TV Correction Scale (type = correction-scale) — frise ──────────
const TV_NEG    = Array.from({ length: 32 }, (_, i) => (i + 1) * 0.25) // −0,25 → −8,00
const TV_POS    = Array.from({ length: 29 }, (_, i) => (i + 1) * 0.25) // +0,25 → +7,25
const tvFmt     = (v) => v.toFixed(2).replace('.', ',')
const TV_PLAN_W = 110 // colonne Plan fixe
const TV_ROW_H  = 54  // hauteur rangée chips

function TVCorrectionScale({ page, pageIndex, total, moduleLabel }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    let s = 0; let tid
    const next = () => {
      s++
      if (s > TV_NEG.length) return
      setStep(s)
      tid = setTimeout(next, 90)
    }
    tid = setTimeout(next, 500)
    return () => clearTimeout(tid)
  }, [page.id])

  const negVisible = TV_NEG.slice(0, step)
  const posVisible = TV_POS.slice(0, step)
  const tvChip = {
    padding: '10px 16px', borderRadius: 9, flexShrink: 0,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    animation: 'chipIn 0.2s ease',
    fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
    fontVariantNumeric: 'tabular-nums',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px 48px', gap: 0 }}>
        {/* Titre */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{page.sousTitre}</p>
        </div>

        {/* Frise — négatifs */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ width: TV_PLAN_W, flexShrink: 0 }} />
          <div className="frise-chips" style={{ flex: 1, minWidth: 0, overflowX: 'scroll', touchAction: 'pan-x' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, padding: '6px 0', width: 'max-content' }}>
              {negVisible.map((v, i) => <div key={i} style={tvChip}>−{tvFmt(v)}</div>)}
            </div>
          </div>
        </div>

        {/* Frise — axe Plan */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: TV_PLAN_W, flexShrink: 0, paddingRight: 20 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#00abe9', lineHeight: 1 }}>Plan</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>0,00</div>
          </div>
          <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.22)', borderRadius: 1 }} />
        </div>

        {/* Frise — positifs */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
          <div style={{ width: TV_PLAN_W, flexShrink: 0 }} />
          <div className="frise-chips" style={{ flex: 1, minWidth: 0, overflowX: 'scroll', touchAction: 'pan-x' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, padding: '6px 0', width: 'max-content' }}>
              {posVisible.map((v, i) => <div key={i} style={tvChip}>+{tvFmt(v)}</div>)}
            </div>
          </div>
        </div>

        {/* Encart clé */}
        <div style={{
          marginTop: 48,
          padding: '32px 48px',
          borderRadius: 22,
          background: 'rgba(0,171,233,0.07)',
          border: '1px solid rgba(0,171,233,0.22)',
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <span style={{ fontSize: 44, lineHeight: 1, flexShrink: 0 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>À retenir</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Fabrication en 10 minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TV Ordonnance (type = ordonnance) ────────────────────────────
function TVOrdonnance({ page, pageIndex, total, moduleLabel, ordoPlaying, ordoRevealStep, audioUnlocked }) {
  const videoRef = useRef(null)

  // Contrôle play/pause — attend que l'audio soit débloqué
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (ordoPlaying && audioUnlocked) {
      v.play().catch(() => {})
    } else if (!ordoPlaying) {
      v.pause()
    }
  }, [ordoPlaying, audioUnlocked])

  // Visibilité pilotée par le formateur (revealStep sync via sharedState)
  const showCard = (i) => i === 0 ? ordoRevealStep >= 1 : ordoRevealStep >= 2
  const showTable = ordoRevealStep >= 1
  const showCell = (col) => col === 0 ? ordoRevealStep >= 1 : ordoRevealStep >= 2
  const showAdd = ordoRevealStep >= 3

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Zone principale — marge droite pour laisser place à la carte avatar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 340px 48px 56px', gap: 32 }}>

        {/* Titre */}
        <div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>{page.sousTitre}</p>
        </div>

        {/* Phase 1 — 3 cartes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {ORD_COLS.map((col, i) => (
            <div key={col.key} style={{
              background: `${col.color}0d`, border: `1px solid ${col.color}28`,
              borderTop: `4px solid ${col.color}`, borderRadius: 18,
              padding: '28px 28px 22px',
              opacity: showCard(i) ? 1 : 0,
              transform: showCard(i) ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <div style={{
                display: 'inline-block',
                background: `${col.color}1a`, border: `1px solid ${col.color}40`,
                borderRadius: 20, padding: '4px 14px',
                fontSize: 12, fontWeight: 800, color: col.color,
                textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
              }}>{col.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: col.sub ? 10 : 0 }}>
                {col.desc}
              </div>
              {col.sub && (
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{col.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Phase 2 — Table ordonnance */}
        <div style={{
          opacity: showTable ? 1 : 0,
          transform: showTable ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.5s ease',
          flex: 1,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
            Exemple d&apos;ordonnance
          </div>

          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* En-têtes */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(3, 1fr)', background: 'rgba(255,255,255,0.04)' }}>
              <div />
              {ORD_COLS.map(col => (
                <div key={col.key} style={{ padding: '14px 28px', fontSize: 14, fontWeight: 800, color: col.color, textTransform: 'uppercase', letterSpacing: 1, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* Ligne OD */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ padding: '20px 28px', fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>OD</div>
              {ORD_COLS.map((col, ci) => (
                <div key={col.key} style={{
                  padding: '20px 28px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center',
                  opacity: showCell(ci) ? 1 : 0, transform: showCell(ci) ? 'translateX(0)' : 'translateX(-12px)', transition: 'all 0.35s ease',
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.od[col.key]}</span>
                </div>
              ))}
            </div>

            {/* Ligne OG */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '20px 28px', fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>OG</div>
              {ORD_COLS.map((col, ci) => (
                <div key={col.key} style={{
                  padding: '20px 28px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center',
                  opacity: showCell(ci) ? 1 : 0, transform: showCell(ci) ? 'translateX(0)' : 'translateX(-12px)', transition: 'all 0.35s ease',
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.og[col.key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Addition */}
          <div style={{
            marginTop: 18, display: 'flex', alignItems: 'center', gap: 24,
            padding: '18px 28px',
            background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 18,
            opacity: showAdd ? 1 : 0, transform: showAdd ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s ease',
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1.5 }}>Addition</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.add}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>Correction presbytie</div>
          </div>
        </div>
      </div>

      {/* Carte avatar opticien — layout horizontal identique au formateur, sans bouton */}
      <div style={{ position: 'absolute', bottom: 32, right: 36, zIndex: 10 }}>
        <div style={{
          background: 'rgba(10,42,92,0.88)', backdropFilter: 'blur(20px)',
          border: `1px solid ${ordoPlaying ? 'rgba(34,197,94,0.4)' : 'rgba(0,171,233,0.3)'}`,
          borderRadius: 20, padding: '14px 20px 14px 14px',
          display: 'flex', alignItems: 'center', gap: 18,
          boxShadow: `0 8px 40px ${ordoPlaying ? 'rgba(34,197,94,0.3)' : 'rgba(0,0,0,0.45)'}`,
          transition: 'border-color .3s, box-shadow .3s',
        }}>
          {/* Avatar à gauche */}
          <div style={{
            width: 110, height: 110, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
            border: `2px solid ${ordoPlaying ? 'rgba(34,197,94,0.6)' : 'rgba(0,171,233,0.4)'}`,
            transition: 'border-color .3s',
          }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              src="/assets/LectureOrdoAudioOK.mp4"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              preload="auto"
            />
          </div>
          {/* Texte à droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Opticien</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Lecture ordonnance</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TV Pause (type = pause) ───────────────────────────────────────
function TVPause({ page, pageIndex, total, moduleLabel }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Centre */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 36,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 80px rgba(0,171,233,0.18)',
        }}>
          <span style={{ fontSize: 80, lineHeight: 1 }}>{page.icon}</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 18 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
            {page.sousTitre}
          </p>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
          borderRadius: 40, padding: '16px 32px',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>En cours avec le formateur…</span>
        </div>
      </div>
    </div>
  )
}

// ── TV Troubles Intro (type = troubles-intro) ─────────────────────
function TVTroublesIntro({ page, pageIndex, total, moduleLabel }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 36,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 80px rgba(0,171,233,0.15)',
        }}>
          <span style={{ fontSize: 80, lineHeight: 1 }}>{page.icon}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '5px 18px', fontSize: 12, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 22 }}>
            Les bases de l&apos;optique
          </div>
          <h1 style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1.15, maxWidth: 800 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', marginTop: 18, fontStyle: 'italic' }}>
            {page.sousTitre}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── TV Troubles List (type = troubles-list) ───────────────────────
function TVTroublesList({ page, pageIndex, total, moduleLabel }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    const timers = page.troubles.map((_, i) =>
      setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), 300 + i * 280)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', position: 'relative', zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 64px 48px', gap: 32 }}>
        {/* Titre */}
        <div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)',
            borderRadius: 20, padding: '4px 16px',
            fontSize: 12, fontWeight: 700, color: '#00abe9',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
          }}>Formation LPT</div>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 6 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            {page.sousTitre}
          </p>
        </div>

        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
          {page.troubles.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 32,
              background: i < visibleCount ? `${t.color}09` : 'transparent',
              border: `1px solid ${i < visibleCount ? t.color + '28' : 'transparent'}`,
              borderLeft: `5px solid ${i < visibleCount ? t.color : 'transparent'}`,
              borderRadius: 18, padding: '24px 36px',
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'all 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.color, letterSpacing: 1, minWidth: 28, opacity: 0.7 }}>
                {t.num}
              </span>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', minWidth: 300, letterSpacing: -0.5 }}>
                {t.nom}
              </span>
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5, fontWeight: 400 }}>
                {t.def}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Helpers saisie TV ─────────────────────────────────────────────
const tvFmtSph = (v) => {
  if (Math.abs(v) < 0.001) return '0,00'
  const abs = Math.abs(v).toFixed(2).replace('.', ',')
  return v > 0 ? `+${abs}` : `−${abs}`
}
const tvFmtCyl = (v) => {
  if (Math.abs(v) < 0.001) return null
  const abs = Math.abs(v).toFixed(2).replace('.', ',')
  return `(−${abs})`
}

function TVPrescLine({ eye }) {
  const parts = [tvFmtSph(eye.sphere)]
  const cyl = tvFmtCyl(eye.cylindre)
  if (cyl) { parts.push(cyl); parts.push(`${eye.axe}°`) }
  return <span>{parts.join(' ')}</span>
}

// ── TV Saisie Interactive (type = saisie-interactive) ─────────────
function TVSaisieInteractive({ page, pageIndex, total, moduleLabel }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 56px 40px', gap: 28,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* Badge */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)', borderRadius: 20, padding: '5px 18px', fontSize: 13, fontWeight: 700, color: '#00abe9' }}>
            ⌨️&nbsp; Exercice pratique
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginTop: 10, marginBottom: 4 }}>{page.titre}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>Saisissez ces corrections depuis votre téléphone</p>
        </div>

        {/* 3 cas côte à côte */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, flex: 1 }}>
          {SAISIE_EXERCISES.map((ex, i) => (
            <div key={ex.id} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderTop: '4px solid #00abe9', borderRadius: 20, padding: '28px 28px 24px',
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2 }}>{ex.label}</div>

              {/* Lignes OD / OG */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['OD', ex.od], ['OG', ex.og]].map(([label, eye]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.4)', minWidth: 28 }}>{label}</span>
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                      <TVPrescLine eye={eye} />
                    </span>
                  </div>
                ))}
                {ex.add != null && (
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80', marginTop: 4 }}>
                    Add +{ex.add.toFixed(2).replace('.', ',')}
                  </div>
                )}
              </div>

              {/* Grille détail */}
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 1fr', background: 'rgba(255,255,255,0.04)' }}>
                  <div />
                  {['Sphère', 'Cyl.', 'Axe'].map(h => (
                    <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>{h}</div>
                  ))}
                </div>
                {[['OD', ex.od], ['OG', ex.og]].map(([label, eye]) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>{label}</div>
                    <div style={{ padding: '10px 12px', fontSize: 16, fontWeight: 700, color: '#38bdf8', borderLeft: '1px solid rgba(255,255,255,0.06)', fontVariantNumeric: 'tabular-nums' }}>{tvFmtSph(eye.sphere)}</div>
                    <div style={{ padding: '10px 12px', fontSize: 16, fontWeight: 700, color: '#fb923c', borderLeft: '1px solid rgba(255,255,255,0.06)', fontVariantNumeric: 'tabular-nums' }}>{Math.abs(eye.cylindre) < 0.001 ? '—' : tvFmtCyl(eye.cylindre)}</div>
                    <div style={{ padding: '10px 12px', fontSize: 16, fontWeight: 700, color: '#c084fc', borderLeft: '1px solid rgba(255,255,255,0.06)', fontVariantNumeric: 'tabular-nums' }}>{eye.axe === 0 && Math.abs(eye.cylindre) < 0.001 ? '—' : `${eye.axe}°`}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pill bas */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12, alignSelf: 'center',
          background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
          borderRadius: 40, padding: '14px 32px',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>📱 Saisissez les corrections sur votre téléphone</span>
        </div>
      </div>
    </div>
  )
}

// ── TV Entreprise : freins à l'achat ─────────────────────────────
const TV_BUBBLE_COLORS = ['rgba(0,171,233,0.9)','rgba(74,222,128,0.9)','rgba(245,158,11,0.9)','rgba(167,139,250,0.9)','rgba(244,114,182,0.9)','rgba(52,211,153,0.9)']

// ── Décalages "bazard" déterministes (12 positions, cycle) ────────
// marginTop : décale chaque bulle vers le bas différemment → lignes brisées
// rotation  : angle naturel, jamais parallèle
// borderRadius : formes légèrement différentes
const B_MT = [0, 18, 6, 28, 12, 22, 4, 32, 10, 24, 2, 16]     // marginTop px
const B_ROT = [-5, 3, -2, 6, -4, 1, -7, 4, -1, 5, -3, 7]       // rotation deg
const B_RAD = [20, 26, 18, 28, 22, 16, 24, 20, 26, 18, 22, 16]  // borderRadius px

// ── Composant partagé : layout TV pour questions libres ───────────
function TVBubbleScreen({ page, pageIndex, total, accent, children, waiting, revealBanner }) {
  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Présentation de l&apos;entreprise</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 22 : 5, background: i === pageIndex ? accent : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ textAlign: 'center', padding: '10px 120px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Question ouverte
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {page.titre}
        </h1>
      </div>

      {/* Zone bulles — alignItems flex-start permet les décalages marginTop */}
      <div style={{
        flex: 1,
        display: 'flex', flexWrap: 'wrap',
        columnGap: 16, rowGap: 40,
        justifyContent: 'center', alignItems: 'flex-start', alignContent: 'flex-start',
        padding: '28px 60px 16px',
        overflow: 'hidden',
      }}>
        {waiting ? (
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic', marginTop: 40 }}>
            En attente des réponses…
          </div>
        ) : children}
      </div>
      {revealBanner}
    </div>
  )
}

function TVEntrepriseFreins({ page, pageIndex, total, freinsResponses }) {
  const entries = Object.entries(freinsResponses || {})
  const accent = '#00abe9'

  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent={accent} waiting={entries.length === 0}>
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          background: 'rgba(5,20,55,0.88)',
          border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: B_RAD[i % 12],
          padding: '14px 22px',
          maxWidth: 300,
          fontSize: 17, fontWeight: 600, color: '#fff', lineHeight: 1.45,
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}30`,
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: `${i * 0.07}s`,
          marginTop: B_MT[i % 12],
          transform: `rotate(${B_ROT[i % 12]}deg)`,
        }}>
          {resp.text}
        </div>
      ))}
    </TVBubbleScreen>
  )
}

// ── TV Entreprise : prix moyen ────────────────────────────────────
function TVEntreprisePrix({ page, pageIndex, total, prixResponses, revealPrix }) {
  const entries = Object.entries(prixResponses || {})
  const accent = '#f59e0b'

  const prixBanner = revealPrix ? (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(135deg, rgba(245,158,11,0.97), rgba(217,119,6,0.97))',
      backdropFilter: 'blur(16px)',
      padding: '28px 48px',
      display: 'flex', alignItems: 'center', gap: 20,
      animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <span style={{ fontSize: 36 }}>💡</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>La bonne réponse</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>entre 400 et 500 euros</div>
      </div>
    </div>
  ) : null

  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent={accent} waiting={entries.length === 0} revealBanner={prixBanner}>
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          background: 'rgba(5,20,55,0.88)',
          border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: B_RAD[i % 12],
          padding: '16px 28px',
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: `${i * 0.07}s`,
          marginTop: B_MT[i % 12],
          transform: `rotate(${B_ROT[i % 12]}deg)`,
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{resp.text}</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: accent }}>€</span>
        </div>
      ))}
    </TVBubbleScreen>
  )
}

function TVEntreprisePromesse({ page, pageIndex, total, promesseResponses }) {
  const entries = Object.entries(promesseResponses || {})
  const accent = '#34d399'

  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent={accent} waiting={entries.length === 0}>
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          background: 'rgba(5,20,55,0.88)',
          border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: B_RAD[i % 12], padding: '14px 22px', maxWidth: 300,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: `${i * 0.07}s`,
          marginTop: B_MT[i % 12],
          transform: `rotate(${B_ROT[i % 12]}deg)`,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{resp.text}</span>
        </div>
      ))}
    </TVBubbleScreen>
  )
}

function TVEntrepriseVentesOpticien({ page, pageIndex, total, ventesResponses, revealVentes }) {
  const entries = Object.entries(ventesResponses || {})
  const accent = '#a78bfa'

  const ventesBanner = revealVentes ? (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(135deg, rgba(124,58,237,0.97), rgba(109,40,217,0.97))',
      backdropFilter: 'blur(16px)',
      padding: '28px 48px',
      display: 'flex', alignItems: 'center', gap: 20,
      animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <span style={{ fontSize: 36 }}>💡</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>La bonne réponse</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>entre 3 et 5 paires</div>
      </div>
    </div>
  ) : null

  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent={accent} waiting={entries.length === 0} revealBanner={ventesBanner}>
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          background: 'rgba(5,20,55,0.88)', border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: B_RAD[i % 12], padding: '16px 28px', backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: `${i * 0.07}s`,
          marginTop: B_MT[i % 12],
          transform: `rotate(${B_ROT[i % 12]}deg)`,
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{resp.text}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: accent }}>paires</span>
        </div>
      ))}
    </TVBubbleScreen>
  )
}

// ── TV Entreprise helpers ─────────────────────────────────────────
function TVEntrepriseShell({ page, pageIndex, total, children }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => { setEntered(false); const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t) }, [page.id])
  const accent = page.color || '#00abe9'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 22 : 5, background: i === pageIndex ? accent : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 48px 32px', opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(20px)', transition: 'all .5s ease' }}>
        {children}
      </div>
    </div>
  )
}

function TVVideoLPT({ audioUnlocked }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !audioUnlocked
    v.play().catch(() => {})
    return () => { v.pause() }
  }, [audioUnlocked])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        ref={videoRef}
        src="/assets/Pr%C3%A9sentation%20LPT.mp4"
        playsInline
        style={{ width: '100%', height: '100vh', objectFit: 'contain' }}
      />
    </div>
  )
}

function TVEntrepriseChiffres({ page, pageIndex, total }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    setVisible(0)
    const timers = page.stats.map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 600 + i * 700)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Chiffres clés
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{page.titre}</h1>
      </div>

      {/* Grille de tuiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', flex: 1, alignContent: 'center' }}>
        {page.stats.map((stat, i) => (
          <div key={i} style={{
            width: 'calc(33% - 14px)', minWidth: 200, maxWidth: 280,
            background: 'rgba(255,255,255,0.04)',
            border: `2px solid ${stat.color}55`,
            borderRadius: 20, padding: '32px 28px',
            textAlign: 'center',
            opacity: i < visible ? 1 : 0,
            transform: i < visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 10 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500, lineHeight: 1.4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function SingleCounter({ value, unit, sub, color, active, delay = 0, fontSize = 100 }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (!active) { setCount(0); setStarted(false); return }
    const t = setTimeout(() => {
      setStarted(true)
      setCount(0)
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0
      const interval = setInterval(() => {
        current += increment
        if (current >= value) { setCount(value); clearInterval(interval) }
        else setCount(Math.floor(current))
      }, duration / steps)
    }, delay)
    return () => clearTimeout(t)
  }, [active, value, delay])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '28px 32px',
      background: `radial-gradient(ellipse at center, ${color}10 0%, transparent 70%)`,
      border: `1px solid ${color}25`, borderRadius: 20,
      opacity: active && !started ? 0 : 1,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
        <span style={{ fontSize: fontSize * 0.22, fontWeight: 800, color, marginTop: fontSize * 0.12 }}>+</span>
        <span style={{ fontSize, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 50px ${color}55` }}>
          {count.toLocaleString('fr-FR')}
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{unit}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 30, padding: '6px 20px' }}>{sub}</div>
    </div>
  )
}

function CounterAnimation({ counters, color, active }) {
  if (!counters) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 16px' }}>
      {counters.map((c, i) => (
        <SingleCounter key={i} value={c.value} unit={c.unit} sub={c.sub} color={color} active={active} delay={c.delay} fontSize={i === 0 ? 90 : 72} />
      ))}
    </div>
  )
}

function TVEntrepriseForceLPT({ page, pageIndex, total, modelePoint, audioUnlocked }) {
  const [visible, setVisible] = useState(0)
  const videoRef = useRef(null)

  // Auto-reveal animation quand aucun point sélectionné
  useEffect(() => {
    if (modelePoint !== null) return
    setVisible(0)
    const timers = page.items.map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 600 + i * 700)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id, modelePoint])

  // Lecture vidéo synchronisée avec audioUnlocked
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (modelePoint !== null) {
      v.muted = !audioUnlocked
      v.play().catch(() => {})
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [modelePoint, audioUnlocked])

  const selectedItem = modelePoint !== null ? page.items[modelePoint] : null

  // ── Mode vidéo : point sélectionné ──
  if (selectedItem) {
    return (
      <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
        <div style={{ display: 'grid', gridTemplateColumns: '38% 62%', gap: 48, flex: 1, alignItems: 'center' }}>
          {/* Gauche — point sélectionné */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2 }}>
              Les clés de notre modèle
            </div>
            <div style={{
              background: `${selectedItem.color}15`,
              border: `2px solid ${selectedItem.color}60`,
              borderLeft: `6px solid ${selectedItem.color}`,
              borderRadius: 20, padding: '28px 32px',
            }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedItem.color, marginBottom: 16, boxShadow: `0 0 16px ${selectedItem.color}` }} />
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
                {selectedItem.label}
              </div>
            </div>
            {/* Autres points en petit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {page.items.map((item, i) => i !== modelePoint && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Droite — vidéo ou animation */}
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.6)', background: selectedItem.video ? '#000' : 'transparent' }}>
            {selectedItem.video ? (
              <video
                ref={videoRef}
                src={selectedItem.video}
                preload="none"
                loop
                playsInline
                muted={!audioUnlocked}
                style={{ width: '100%', display: 'block', maxHeight: '65vh', objectFit: 'contain' }}
              />
            ) : selectedItem.animation === 'counter' ? (
              <CounterAnimation
                counters={selectedItem.counters}
                color={selectedItem.color}
                active={modelePoint !== null}
              />
            ) : (
              <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <ZeroInterChain compact={false} />
              </div>
            )}
          </div>
        </div>
      </TVEntrepriseShell>
    )
  }

  // ── Mode normal : grille des 5 points ──
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Les clés de notre modèle
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{page.titre}</h1>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', flex: 1, alignContent: 'center' }}>
        {page.items.map((item, i) => (
          <div key={i} style={{
            width: 'calc(33% - 14px)', minWidth: 220, maxWidth: 300,
            background: 'rgba(255,255,255,0.04)',
            border: `2px solid ${item.color}55`,
            borderRadius: 20, padding: '32px 28px',
            textAlign: 'center',
            opacity: i < visible ? 1 : 0,
            transform: i < visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, margin: '0 auto 16px', boxShadow: `0 0 12px ${item.color}` }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}


function TVEntrepriseNaissance({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 48, paddingTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
          Présentation de l&apos;entreprise
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
          {page.titre}
        </h1>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
          &ldquo;{page.sousTitre}&rdquo;
        </p>
      </div>

      {/* Deux fondateurs côte à côte */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 80 }}>
        {/* Paul Morlet */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 220, height: 220, borderRadius: '50%', overflow: 'hidden',
            border: '4px solid rgba(0,171,233,0.6)',
            boxShadow: '0 0 0 8px rgba(0,171,233,0.12), 0 16px 48px rgba(0,171,233,0.35)',
          }}>
            <Image src="/assets/photo-Paul.jpg" alt="Paul Morlet" width={220} height={220}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Paul Morlet</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Fondateur &amp; CEO</div>
          </div>
        </div>

        {/* Séparateur & */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 88 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'rgba(255,255,255,0.3)',
          }}>&amp;</div>
        </div>

        {/* Xavier Niel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 220, height: 220, borderRadius: '50%', overflow: 'hidden',
            border: '4px solid rgba(0,171,233,0.6)',
            boxShadow: '0 0 0 8px rgba(0,171,233,0.12), 0 16px 48px rgba(0,171,233,0.35)',
          }}>
            <Image src="/assets/Photo-Xavier.png" alt="Xavier Niel" width={220} height={220}
              style={{ objectFit: 'cover', objectPosition: '60% top', width: '100%', height: '100%' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Xavier Niel</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Co-fondateur &amp; Investisseur</div>
          </div>
        </div>
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntreprisePoints({ page, pageIndex, total }) {
  const accent = page.color || '#00abe9'
  const emoji = page.type === 'impact' ? '👁️' : page.type === 'probleme' ? '🔍' : '⚙️'
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
        {/* Gauche — titre + points */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Journée 1 · Présentation</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>{page.titre}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>{page.sousTitre}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(page.points || []).map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${accent}18`, border: `1px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{pt.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.texte}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Droite — grand emoji décoratif */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 220, height: 220, borderRadius: '50%',
            background: `${accent}15`, border: `2px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 100,
            boxShadow: `0 0 80px ${accent}25`,
          }}>{emoji}</div>
        </div>
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseTimeline({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Journée 1 · Présentation</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'center' }}>
        {page.timeline.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 100, flexShrink: 0, textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#00abe9' }}>{item.year}</div>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: i === page.timeline.length - 1 ? '#00abe9' : 'rgba(0,171,233,0.4)', border: '2px solid #00abe9', flexShrink: 0 }} />
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginRight: 12 }}>{item.label}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntreprisePiliers({ page, pageIndex, total }) {
  const accent = page.color || '#16a34a'
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'flex', gap: 24, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {page.points.map((p, i) => (
          <div key={i} style={{ flex: 1, background: `${accent}12`, border: `1px solid ${accent}35`, borderRadius: 24, padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{p.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>{p.titre}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.texte}</div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseSteps({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, flex: 1 }}>
        {page.steps.map((s, i) => (
          <div key={i} style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 18, padding: '22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{s.num}</div>
              <span style={{ fontSize: 20 }}>{s.emoji}</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.titre}</div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{s.texte}</div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseCases({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'flex', gap: 20, flex: 1, alignItems: 'center' }}>
        {page.cases.map((c, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(219,39,119,0.06)', border: '1px solid rgba(219,39,119,0.2)', borderRadius: 20, padding: '24px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{c.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{c.prenom}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{c.age} · {c.contexte}</div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#f87171', lineHeight: 1.4 }}>❌ {c.sans}</div>
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#4ade80', lineHeight: 1.4 }}>✅ {c.avec}</div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseVisages({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
        {page.profils.map((p, i) => (
          <div key={i} style={{ background: 'rgba(8,145,178,0.07)', border: '1px solid rgba(8,145,178,0.2)', borderRadius: 18, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(8,145,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{p.emoji}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.metier}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{p.message}</div>
            </div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseCroissance({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {page.stats.map((s, i) => (
          <div key={i} style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 18, padding: '24px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#4ade80', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {page.points.map((p, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{p.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.titre}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{p.texte}</div>
            </div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseMission({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 860, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{page.titre}</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>{page.sousTitre}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
          {page.temoignages.map((t, i) => (
            <div key={i} style={{ background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.25)', borderRadius: 16, padding: '20px 28px', textAlign: 'left' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontStyle: 'italic', marginBottom: 6 }}>{t.quote}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t.context}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#00abe9', fontStyle: 'italic' }}>Tu participes à rendre la vue accessible à tous.</div>
      </div>
    </TVEntrepriseShell>
  )
}

// ── TV Progressif : schéma verre PNG avec zones overlay ──────────
const TV_PROG_ZONES = [
  { key: 'haut',   label: 'LOIN',      color: '#a78bfa', top: '19%' },
  { key: 'milieu', label: 'INTERMÉD.', color: '#4ade80', top: '52%' },
  { key: 'bas',    label: 'PRÈS',      color: '#fbbf24', top: '80%' },
]

function TVVerreProgressifSchema({ highlight }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Halo respirant derrière l'image */}
      <div style={{
        position: 'absolute', inset: -32, borderRadius: '50%', zIndex: 0,
        background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 68%)',
        animation: 'haloPulse 3.8s ease-in-out infinite',
      }} />
      {/* Image principale avec float */}
      <div style={{ animation: 'verreFloat 4.5s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/verre-prog.png"
          alt="Verre progressif"
          style={{
            width: 300,
            height: 'auto',
            display: 'block',
            filter: 'drop-shadow(0 0 36px rgba(124,58,237,0.65)) drop-shadow(0 20px 48px rgba(0,0,0,0.55))',
          }}
        />
      </div>
      {/* Badges zones */}
      {TV_PROG_ZONES.map(z => (
        <div key={z.key} style={{
          position: 'absolute', zIndex: 2,
          right: -92,
          top: z.top,
          transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: highlight === null || highlight === undefined ? 0.38 : highlight === z.key ? 1 : 0.14,
          transition: 'opacity 0.45s ease',
          pointerEvents: 'none',
        }}>
          <div style={{ width: 24, height: 1, background: z.color, opacity: 0.85 }} />
          <div style={{
            background: highlight === z.key ? `${z.color}22` : 'transparent',
            border: `1px solid ${z.color}${highlight === z.key ? '80' : '38'}`,
            borderRadius: 10, padding: '3px 10px',
            fontSize: 11, fontWeight: 800, color: z.color, letterSpacing: 1,
            whiteSpace: 'nowrap',
            boxShadow: highlight === z.key ? `0 0 12px ${z.color}45` : 'none',
          }}>{z.label}</div>
        </div>
      ))}
    </div>
  )
}

const OPT_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── TV Progressif : zone interactif ──────────────────────────────
function TVProgressifZoneInteractif({ page, pageIndex, total, progZoneQ, progZoneResponses, progZoneShowCorrect }) {
  const q = progZoneQ !== null && progZoneQ !== undefined ? page.zoneQuestions[progZoneQ] : null
  const entries = Object.entries(progZoneResponses || {})
  const totalR = entries.length
  const counts = q ? q.options.map((_, i) => entries.filter(([, v]) => v === i).length) : []

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #12013a 55%, #0d0a3a 100%)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>
      {/* ── Gauche : verre plein écran sans labels ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
      }}>
        {/* Halo */}
        <div style={{
          position: 'absolute', width: 680, height: 680, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 68%)',
          animation: 'haloPulse 3.8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/verre-prog.png"
          alt="Verre progressif"
          style={{
            width: 520, height: 'auto',
            animation: 'verreFloat 4.5s ease-in-out infinite',
            position: 'relative', zIndex: 1,
            filter: 'drop-shadow(0 0 56px rgba(124,58,237,0.7)) drop-shadow(0 24px 56px rgba(0,0,0,0.6))',
          }}
        />
      </div>

      {/* ── Droite : question + résultats ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 60px',
      }}>
        {/* Header logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Identifie les zones</span>
        </div>

        {q ? (
          <>
            <div style={{
              display: 'inline-block', background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.45)', borderRadius: 20,
              padding: '6px 20px', fontSize: 12, fontWeight: 700, color: '#a78bfa',
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24, alignSelf: 'flex-start',
            }}>
              Question {(progZoneQ || 0) + 1} / {page.zoneQuestions.length}
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 40, lineHeight: 1.15 }}>
              {q.question}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {q.options.map((opt, i) => {
                const cnt = counts[i]
                const pct = totalR > 0 ? (cnt / totalR) * 100 : 0
                const isCorrect = i === q.correct
                const highlight = progZoneShowCorrect && isCorrect
                return (
                  <div key={i} style={{
                    background: highlight ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${highlight ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 18, padding: '18px 24px',
                    transition: 'all .4s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', background: OPT_COLORS[i],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0,
                        }}>{'ABC'[i]}</div>
                        <span style={{ fontSize: 20, fontWeight: 600, color: highlight ? '#4ade80' : '#fff' }}>{opt}</span>
                        {highlight && <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '3px 14px', borderRadius: 20 }}>✓ Correct</span>}
                      </div>
                      <span style={{ fontSize: 32, fontWeight: 900, color: highlight ? '#4ade80' : '#fff', minWidth: 40, textAlign: 'right' }}>{cnt}</span>
                    </div>
                    <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 5, width: `${pct}%`, background: highlight ? '#4ade80' : OPT_COLORS[i], transition: 'width .5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 28, fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginRight: 10 }}>{totalR}</span>
              réponse{totalR !== 1 ? 's' : ''}
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.45, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 22, color: '#fff', fontWeight: 600, marginBottom: 8 }}>Identifie les zones</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>Le formateur va lancer une question…</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TV Progressif : retour terrain (bulles) ───────────────────────
function TVProgressifRetourTerrain({ page, pageIndex, total, progRetourResponses }) {
  const entries = Object.entries(progRetourResponses || {})
  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent="#7c3aed"
      waiting={entries.length === 0}
      moduleLabel="Le Verre Progressif"
    >
      {entries.map(([name, resp], idx) => (
        <div key={name} style={{
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 20, padding: '14px 18px', maxWidth: 280,
          marginTop: B_MT[idx % B_MT.length], transform: `rotate(${B_ROT[idx % B_ROT.length]}deg)`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{name}</div>
          <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>{resp.text || resp}</div>
        </div>
      ))}
    </TVBubbleScreen>
  )
}

// ── TV Progressif : jeu d'objections ────────────────────────────
function TVProgressifJeuObjections({ page, pageIndex, total, progObjectionIdx, progObjectionResponses, progBestAnswer }) {
  const objection = progObjectionIdx !== null && progObjectionIdx !== undefined ? page.objections[progObjectionIdx] : null
  const entries = Object.entries(progObjectionResponses || {})

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #12013a 55%, #0d0a3a 100%)', display: 'flex', flexDirection: 'column', padding: '32px 56px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Le Verre Progressif · Jeu d'objections</span>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
      </div>

      {objection ? (
        <>
          {/* Objection */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '24px 32px', marginBottom: 32, maxWidth: 900, alignSelf: 'center', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Le client dit :</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.3, fontStyle: 'italic' }}>"{objection}"</div>
          </div>

          {/* Réponses */}
          {entries.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>En attente des réponses sur les téléphones…</div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', padding: '8px 0', columnGap: 20, rowGap: 44 }}>
              {entries.map(([name, resp], idx) => (
                <div key={name} style={{
                  background: progBestAnswer === name ? 'rgba(34,197,94,0.15)' : 'rgba(124,58,237,0.12)',
                  border: `1px solid ${progBestAnswer === name ? 'rgba(34,197,94,0.5)' : 'rgba(124,58,237,0.3)'}`,
                  borderRadius: 20, padding: '14px 18px', maxWidth: 300,
                  marginTop: B_MT[idx % B_MT.length], transform: `rotate(${B_ROT[idx % B_ROT.length]}deg)`,
                  transition: 'all 0.4s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: progBestAnswer === name ? '#4ade80' : '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.5 }}>{name}</span>
                    {progBestAnswer === name && <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>⭐</span>}
                  </div>
                  <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>{resp.text || resp}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>Le formateur va choisir une objection…</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── TV PDM : Pourquoi mesurer ─────────────────────────────────────
function TVPdmPourquoi({ pageIndex, total }) {
  const C = '#00abe9'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001e40 100%)', display: 'grid', gridTemplateColumns: '38% 62%' }}>

      {/* ── Gauche : texte ── */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 52px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>
          Prise de mesures · {pageIndex + 1} / {total}
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
          Pourquoi faire une<br /><span style={{ color: C }}>prise de mesures ?</span>
        </div>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 44 }}>
          Positionner le centre optique du verre exactement devant la pupille du client.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { n: 1, label: 'Centrage optique', desc: "Aligner le centre du verre devant la pupille." },
            { n: 2, label: 'Confort visuel', desc: "Un verre mal centré provoque fatigue et flou." },
            { n: 3, label: 'Satisfaction garantie', desc: "Bonne mesure = client satisfait dès le 1er port." },
          ].map(pt => (
            <div key={pt.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${C}20`, border: `1px solid ${C}50`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: C }}>{pt.n}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{pt.label}</div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{pt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Droite : photo réelle + annotations SVG overlay ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        {/* Conteneur relatif pour superposer le SVG sur la photo */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Photo de la monture tortoiseshell 1313×473px */}
          <img
            src="/assets/LPT003-EFO-001.avif"
            alt="Monture LPT — prise de mesures"
            style={{ width: '100%', display: 'block' }}
          />
          {/* SVG overlay — viewBox calé sur les dimensions réelles 1313×473 */}
          <svg
            viewBox="0 0 1313 473"
            preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          >
            {/* Axe de symétrie central */}
            <line x1="656" y1="20" x2="656" y2="453" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10 6" />

            {/* Croix pupille gauche */}
            <line x1="410" y1="182" x2="410" y2="218" stroke="#e53535" strokeWidth="4" />
            <line x1="392" y1="200" x2="428" y2="200" stroke="#e53535" strokeWidth="4" />

            {/* Croix pupille droite */}
            <line x1="903" y1="182" x2="903" y2="218" stroke="#e53535" strokeWidth="4" />
            <line x1="885" y1="200" x2="921" y2="200" stroke="#e53535" strokeWidth="4" />

            {/* EP gauche : CX(656) → pupille gauche(410) */}
            <line x1="656" y1="168" x2="410" y2="168" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 6" />
            <line x1="656" y1="152" x2="656" y2="184" stroke="#fff" strokeWidth="2.5" />
            <line x1="410" y1="152" x2="410" y2="184" stroke="#fff" strokeWidth="2.5" />
            <polygon points="426,162 440,168 426,174" fill="#fff" />
            <polygon points="641,162 627,168 641,174" fill="#fff" />
            <text x="533" y="148" textAnchor="middle" fill={C} fontSize="32" fontWeight="bold" fontStyle="italic" fontFamily="system-ui,sans-serif">EP</text>

            {/* EP droite : CX(656) → pupille droite(903) */}
            <line x1="656" y1="168" x2="903" y2="168" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 6" />
            <line x1="903" y1="152" x2="903" y2="184" stroke="#fff" strokeWidth="2.5" />
            <polygon points="887,162 873,168 887,174" fill="#fff" />
            <polygon points="671,162 685,168 671,174" fill="#fff" />
            <text x="780" y="148" textAnchor="middle" fill={C} fontSize="32" fontWeight="bold" fontStyle="italic" fontFamily="system-ui,sans-serif">EP</text>

            {/* H gauche : pupille → bas verre */}
            <line x1="410" y1="220" x2="410" y2="395" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 6" />
            <line x1="396" y1="395" x2="424" y2="395" stroke="#fff" strokeWidth="2.5" />
            <polygon points="404,236 410,222 416,236" fill="#fff" />
            <polygon points="404,379 410,393 416,379" fill="#fff" />
            <text x="358" y="315" textAnchor="middle" fill={C} fontSize="32" fontWeight="bold" fontStyle="italic" fontFamily="system-ui,sans-serif">H</text>

            {/* H droite : pupille → bas verre */}
            <line x1="903" y1="220" x2="903" y2="395" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 6" />
            <line x1="889" y1="395" x2="917" y2="395" stroke="#fff" strokeWidth="2.5" />
            <polygon points="897,236 903,222 909,236" fill="#fff" />
            <polygon points="897,379 903,393 909,379" fill="#fff" />
            <text x="955" y="315" textAnchor="middle" fill={C} fontSize="32" fontWeight="bold" fontStyle="italic" fontFamily="system-ui,sans-serif">H</text>
          </svg>
        </div>

        {/* Légende */}
        <div style={{ display: 'flex', gap: 48, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="36" height="4" style={{ flexShrink: 0 }}><line x1="0" y1="2" x2="36" y2="2" stroke={C} strokeWidth="2.5" strokeDasharray="9 5" /></svg>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>EP — Écart pupillaire</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="4" height="36" style={{ flexShrink: 0 }}><line x1="2" y1="0" x2="2" y2="36" stroke={C} strokeWidth="2.5" strokeDasharray="9 5" /></svg>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>H — Hauteur</span>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── TV Offres : Classique ─────────────────────────────────────────
const TV_ITEMS_CLASSIQUE = [
  { label: '1 paire achetée', sub: null },
  { label: 'Deuxième paire à -20%', sub: null },
  { label: '10€ en 10 minutes', sub: null },
]

function TVOffresClassique({ step = 0 }) {
  const COLOR = '#00abe9'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001e40 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Gauche */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: `14px solid ${COLOR}`, boxShadow: `0 0 40px ${COLOR}50`, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Les parcours LPT</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>Le parcours</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: COLOR, lineHeight: 1 }}>Classique</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${COLOR}`, borderRadius: 16, padding: '24px 28px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>Tarifs</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Entrée de gamme</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>dès 10€</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>2ème paire</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>-20%</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Fabrication</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>⚡ 10 min</span>
          </div>
        </div>
      </div>
      {/* Droite */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', gap: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Ce qui est inclus</div>
        {TV_ITEMS_CLASSIQUE.map((item, i) => (
          <div key={i} style={{
            opacity: i < step ? 1 : 0,
            transform: i < step ? 'translateX(0)' : 'translateX(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderLeft: `4px solid ${COLOR}`,
            borderRadius: 16, padding: '22px 28px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{item.label}</div>
          </div>
        ))}
        {/* Barre de progression */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {TV_ITEMS_CLASSIQUE.map((_, i) => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < step ? COLOR : 'rgba(255,255,255,0.1)', transition: 'background 0.4s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TV Offres : 1=1 ───────────────────────────────────────────────
const TV_ITEMS_11 = [
  { label: '1 paire achetée', sub: null },
  { label: 'Deuxième paire offerte', sub: 'de même qualité que la première' },
  { label: 'Éligible sur tout le magasin', sub: 'Monture et verres au choix' },
  { label: 'Même en solaire', sub: null },
]

function TVOffres11({ step = 0 }) {
  const COLOR = '#c9a227'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Gauche */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: `14px solid ${COLOR}`, boxShadow: `0 0 40px ${COLOR}50`, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Les parcours LPT</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>Le parcours</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: COLOR, lineHeight: 1 }}>1=1</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${COLOR}`, borderRadius: 16, padding: '24px 28px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>Tarifs</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Unifocal</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>~157€</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Progressif</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>~260€</span>
          </div>
        </div>
      </div>
      {/* Droite : points révélés progressivement */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', gap: 18 }}>
        {TV_ITEMS_11.map((item, i) => (
          <div key={i} style={{
            opacity: i < step ? 1 : 0,
            transform: i < step ? 'translateX(0)' : 'translateX(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderLeft: `4px solid ${i < step ? COLOR : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 18, padding: '20px 28px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{item.label}</div>
            {item.sub && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{item.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TV Offres : Verre unifocal dans le 1=1 ───────────────────────
const TV_ITEMS_UNIFOCAL_11 = [
  { label: "Sur l'intégralité du magasin", sub: 'Toutes nos montures et verres éligibles' },
  { label: '400 modèles de montures', sub: 'Au choix, sans contrainte' },
  { label: 'Tous les traitements inclus', sub: 'Anti-rayure · Anti-reflets · Anti-salissure · Hydrophobe · Anti-lumière bleue' },
  { label: '⚡ Fabrication en 10 minutes', sub: null },
]

function TVOffresUnifocal11() {
  const COLOR = '#c9a227'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 40px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <VerreAnime color={COLOR} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Parcours 1=1 · Verre unifocal</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 40 }}>
          Le verre unifocal<br /><span style={{ color: COLOR }}>dans l&apos;offre 1=1</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {TV_ITEMS_UNIFOCAL_11.map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${COLOR}`, borderRadius: 18, padding: '20px 28px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{item.label}</div>
              {item.sub && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TV Offres : Verre progressif dans le 1=1 ─────────────────────
const TV_OFFRE_PROGRESSIF_11 = [
  { label: "Sur l'intégralité du magasin", sub: 'Toutes nos montures et verres éligibles' },
  { label: '400 modèles de montures', sub: 'Au choix, sans contrainte' },
  { label: 'Tous les traitements inclus', sub: 'Anti-rayure · Anti-reflets · Anti-salissure · Hydrophobe · Anti-lumière bleue' },
  { label: '📅 Fabrication en 9 jours', sub: null },
]
const TV_ARGS_PROGRESSIF_11 = [
  { label: "Zones d'aberrations réduites" },
  { label: 'Vision extra large à 180°' },
  { label: 'Offre une vision naturelle au quotidien' },
  { label: 'Adaptation immédiate' },
  { label: 'Garantie Adaptation — satisfait ou échangé 100 jours' },
]

function TVOffresProgressif11() {
  const COLOR = '#c9a227'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Gauche : verre + arguments de vente */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', borderRight: '1px solid rgba(255,255,255,0.07)', gap: 28 }}>
        <div style={{ animation: 'verreFloat 4.5s ease-in-out infinite', pointerEvents: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/verre-prog.png"
            alt="Verre progressif"
            style={{ width: 420, height: 420, objectFit: 'contain', filter: `drop-shadow(0 0 48px ${COLOR}70) drop-shadow(0 16px 32px rgba(0,0,0,0.35))` }}
          />
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {TV_ARGS_PROGRESSIF_11.map((item, i) => (
            <div key={i} style={{ background: `${COLOR}12`, border: `1px solid ${COLOR}40`, borderRadius: 12, padding: '11px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLOR }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Droite : titre + caractéristiques de l'offre */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '50px 48px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Parcours 1=1 · Verre progressif</div>
        <div style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 32 }}>
          Le verre progressif<br /><span style={{ color: COLOR }}>dans l&apos;offre 1=1</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {TV_OFFRE_PROGRESSIF_11.map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${COLOR}`, borderRadius: 14, padding: '16px 22px' }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{item.label}</div>
              {item.sub && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TV Mini Jeu : écran règles ────────────────────────────────────
const TV_RULES_ACCUEIL = [
  { icon: '🎰', text: 'La machine désigne aléatoirement un Vendeur et un Client parmi les participants connectés' },
  { icon: '🎭', text: 'Le Vendeur réalise l\'accueil complet selon la trame LPT — de l\'entrée à la découverte du besoin' },
  { icon: '⏱️', text: 'Durée du jeu de rôle : 3 à 5 minutes en conditions réelles' },
  { icon: '👁️', text: 'Le groupe observe en silence et prend mentalement des notes' },
  { icon: '💬', text: 'Debriefing collectif et feedback à chaud à la fin du jeu de rôle' },
]

function TVMiniJeuRules() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, #03112a 50%, #0a0a1a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 120px', gap: 48,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 14 }}>
          Mini Jeux · Accueil moi si tu peux 🎰
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>Règles du jeu</div>
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>Jeu de rôle — trame d'accueil LPT</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 860 }}>
        {TV_RULES_ACCUEIL.map((rule, i) => (
          <div key={i} style={{
            display: 'flex', gap: 22, alignItems: 'center',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, padding: '20px 28px',
            animation: `mjFadeUp 0.4s ease ${i * 0.08}s both`,
          }}>
            <span style={{ fontSize: 30, flexShrink: 0 }}>{rule.icon}</span>
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{rule.text}</div>
          </div>
        ))}
      </div>
      <div style={{ opacity: 0.2, animation: 'mjPulse 2s ease-in-out infinite' }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
      </div>
    </div>
  )
}

// ── TV Mini Jeu : roulette (spinning + revealed) ──────────────────
function TVSlotReel({ items, reelState, result, label, color }) {
  const ITEM_H = 96
  const repeated = [...items, ...items, ...items]
  const spinDuration = `${((items.length * ITEM_H) / 580).toFixed(2)}s`
  const brakeDuration = '0.85s'
  const isDone  = reelState === 'done'
  const isBrake = reelState === 'brake'
  const isSpin  = reelState === 'spin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{
        width: 280, height: ITEM_H * 3,
        background: 'rgba(0,0,0,0.5)',
        border: `2px solid ${isDone ? color : color + '44'}`,
        borderRadius: 24, overflow: 'hidden', position: 'relative',
        boxShadow: isDone ? `0 0 50px ${color}55` : `0 0 20px ${color}18`,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>
        {isDone ? (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${color}22 0%, #050d1e 100%)`,
            animation: 'resultBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', padding: '0 20px', textAlign: 'center', lineHeight: 1.2 }}>
              {result}
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom, rgba(0,0,0,0.92), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0,
              height: ITEM_H, transform: 'translateY(-50%)',
              border: `1px solid ${color}44`, background: `${color}08`,
              zIndex: 1, pointerEvents: 'none', borderRadius: 12,
            }} />
            <div style={{
              display: 'flex', flexDirection: 'column',
              animation:
                isSpin  ? `slotScroll ${spinDuration} linear infinite` :
                isBrake ? `slotBrake ${brakeDuration} ease-out 1 forwards` :
                'none',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}>
              {repeated.map((name, i) => (
                <div key={i} style={{
                  height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.78)',
                  padding: '0 18px', textAlign: 'center', lineHeight: 1.2,
                }}>
                  {name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const TV_THEMES = [
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

function TVThemeReel({ reelState, result }) {
  const COLOR = '#00abe9'
  const ITEM_H = 90
  const repeated = [...TV_THEMES, ...TV_THEMES, ...TV_THEMES]
  const spinDuration = `${((TV_THEMES.length * ITEM_H) / 580).toFixed(2)}s`
  const brakeDuration = '0.85s'

  const isDone  = reelState === 'done'
  const isBrake = reelState === 'brake'
  const isSpin  = reelState === 'spin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2 }}>Scénario client</div>
      <div style={{
        width: '100%', maxWidth: 860, height: ITEM_H,
        background: 'rgba(0,0,0,0.5)',
        border: `2px solid ${isDone ? COLOR : COLOR + '44'}`,
        borderRadius: 20, overflow: 'hidden', position: 'relative',
        boxShadow: isDone ? `0 0 40px ${COLOR}50` : `0 0 16px ${COLOR}18`,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>
        {isDone ? (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${COLOR}1a 0%, #050d1e 100%)`,
            animation: 'resultBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            padding: '0 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{result}</div>
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to bottom, rgba(0,0,0,0.88), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to top, rgba(0,0,0,0.88), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{
              display: 'flex', flexDirection: 'column',
              animation:
                isSpin  ? `slotScroll ${spinDuration} linear infinite` :
                isBrake ? `slotBrake ${brakeDuration} ease-out 1 forwards` :
                'none',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}>
              {repeated.map((t, i) => (
                <div key={i} style={{
                  height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                  padding: '0 32px', textAlign: 'center', lineHeight: 1.35,
                }}>
                  {t}
                </div>
              ))}
            </div>
          </>

        )}
      </div>
    </div>
  )
}

function TVMiniJeuGame({ mjPhase, vendeur, client, theme }) {
  const [participants, setParticipants] = useState([])
  const [reel1, setReel1] = useState('idle')
  const [reel2, setReel2] = useState('idle')
  const [reelT, setReelT] = useState('idle')
  const prevPhaseRef = useRef('idle')

  useEffect(() => {
    const sc = typeof window !== 'undefined'
      ? (localStorage.getItem('participant_session_code') || localStorage.getItem('lpt_session_code') || 'LPT2026')
      : 'LPT2026'
    import('@/lib/supabase').then(({ sbSelect }) => {
      sbSelect('participants', `session_code=eq.${sc}&order=joined_at.asc`)
        .then(rows => {
          const names = (rows || []).map(r => r.name || r.participant_name || r.collaborateur).filter(Boolean)
          setParticipants(names.length ? names : ['Participant 1', 'Participant 2', 'Participant 3'])
        })
    })
  }, [])

  const PHASE_ORDER = ['spinning', 'vendeur', 'client', 'revealed']
  const phaseIdx = (p) => PHASE_ORDER.indexOf(p)

  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = mjPhase

    const brake = (setFn, onDone) => {
      setFn('brake')
      setTimeout(() => { setFn('done'); onDone?.() }, 850)
    }

    if (mjPhase === 'game_ready') {
      setReel1('idle'); setReel2('idle'); setReelT('idle')
    }

    if (mjPhase === 'spinning' && prev !== 'spinning') {
      setReel1('spin'); setReel2('spin'); setReelT('spin')
    }

    if (mjPhase === 'vendeur' && phaseIdx(prev) < phaseIdx('vendeur')) {
      brake(setReel1, null)
    }

    if (mjPhase === 'client' && phaseIdx(prev) < phaseIdx('client')) {
      if (phaseIdx(prev) < phaseIdx('vendeur')) setReel1('done')
      brake(setReel2, null)
    }

    if (mjPhase === 'revealed' && phaseIdx(prev) < phaseIdx('revealed')) {
      if (phaseIdx(prev) < phaseIdx('vendeur')) setReel1('done')
      if (phaseIdx(prev) < phaseIdx('client'))  setReel2('done')
      brake(setReelT, null)
    }
  }, [mjPhase])

  const fallback = ['—', '—', '—', '—', '—', '—', '—', '—']
  const reelItems = participants.length >= 2 ? participants : fallback

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, #03112a 50%, #0a0a1a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 52, padding: '64px 80px',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3 }}>
        Mini Jeux · Accueil moi si tu peux 🎰
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 72 }}>
        <TVSlotReel items={reelItems} reelState={reel1} result={vendeur} label="🧑‍💼 Vendeur" color="#8b5cf6" />
        <div style={{ fontSize: 44, color: 'rgba(255,255,255,0.14)', fontWeight: 900 }}>VS</div>
        <TVSlotReel items={reelItems} reelState={reel2} result={client}  label="🛍️ Client"  color="#f59e0b" />
      </div>
      <div style={{ width: '100%', maxWidth: 860 }}>
        <TVThemeReel reelState={reelT} result={theme} />
      </div>
      <div style={{ opacity: 0.18 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
      </div>
    </div>
  )
}

// ── TV Content Page (no controls, no avatar) ──────────────────────
// ── TV Trame d'accueil ────────────────────────────────────────────
function TVTrameAccueil({ step }) {
  const visible = (i) => step !== null && step !== undefined && i <= step

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Gauche : titre */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ marginBottom: 32 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={140} height={52} style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>Formation Journée 2</div>
        <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 0 }}>
          La trame d'accueil<br />
          <span style={{ color: '#00abe9' }}>Lunettes Pour Tous</span>
        </h1>
        <div style={{ display: 'flex', gap: 6, marginTop: 32 }}>
          {TRAME_ACCUEIL_POINTS.map((pt, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, flex: 1, background: visible(i) ? pt.color : 'rgba(255,255,255,0.1)', transition: 'background 0.5s ease' }} />
          ))}
        </div>
      </div>

      {/* Droite : points révélés */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', gap: 20 }}>
        {TRAME_ACCUEIL_POINTS.map((pt, i) => (
          <div key={pt.num} style={{
            display: 'flex', alignItems: 'flex-start', gap: 22,
            opacity: visible(i) ? 1 : 0,
            transform: visible(i) ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'all 0.55s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16, flexShrink: 0,
              background: `${pt.color}18`, border: `2px solid ${pt.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, color: pt.color,
            }}>{pt.num}</div>
            <div style={{
              flex: 1, borderLeft: `4px solid ${pt.color}`,
              background: `${pt.color}08`, border: `1px solid ${pt.color}22`,
              borderRadius: 16, padding: '16px 22px',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{pt.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TV Montures — données ─────────────────────────────────────
const TV_MONTURES_DATA = {
  'montures-acetate': {
    title: 'Acétate', subtitle: 'de cellulose', color: '#00abe9',
    frames: [
      { src: '/assets/montures/acetate/SLPT038-EFO-002.avif', ref: 'SLPT038-EFO' },
      { src: '/assets/montures/acetate/SLPT067-EFO-002.avif', ref: 'SLPT067-EFO' },
      { src: '/assets/montures/acetate/SLPT075-EFOBPL-001.avif', ref: 'SLPT075-EFOBPL' },
    ],
    infos: [
      { icon: '🌿', label: 'Naturel', desc: 'Pulpe de bois ou fibre de coton' },
      { icon: '✨', label: 'Premium', desc: 'Large choix de coloris & motifs' },
      { icon: '💎', label: 'Modèle unique', desc: 'Chaque paire diffère selon sa plaque' },
      { icon: '🌡️', label: 'Ajustable à chaud', desc: 'Hypoallergénique' },
    ],
  },
  'montures-metal': {
    title: 'Métal', subtitle: 'alliage métallique', color: '#94a3b8',
    frames: [
      { src: '/assets/montures/metal/LPT502L-KM-002.avif', ref: 'LPT502L-KM' },
      { src: '/assets/montures/metal/LPT523-GUN-002.avif', ref: 'LPT523-GUN' },
      { src: '/assets/montures/metal/SLPT068-OOM-002.avif', ref: 'SLPT068-OOM' },
    ],
    infos: [
      { icon: '🪶', label: 'Léger & fin', desc: 'Discret sur le visage' },
      { icon: '🛡️', label: 'Résistant', desc: 'Alliage métallique et revêtement anti-allergique' },
      { icon: '🔧', label: 'Ajustable facilement', desc: 'Plaquettes et branches réglables' },
    ],
  },
  'montures-injecte': {
    title: 'Plastique injecté', subtitle: 'moulé industriel', color: '#4ade80',
    frames: [
      { src: '/assets/montures/injecte/WF01-BM-002.avif',  ref: 'WF01-BM' },
      { src: '/assets/montures/injecte/WF02-GMV-002.avif', ref: 'WF02-GMV' },
      { src: '/assets/montures/injecte/WF04-BU-002.avif',  ref: 'WF04-BU' },
    ],
    infos: [
      { icon: '🏭', label: 'Moulé à chaud', desc: 'Injecté en série dans un moule industriel' },
      { icon: '🪶', label: 'Léger & résistant', desc: 'Très bonne durabilité au quotidien' },
      { icon: '💚', label: 'Accessible', desc: 'Meilleur rapport qualité / prix de la gamme' },
    ],
  },
}

function TVMontures({ type, pageIndex, total, moduleLabel }) {
  const data = TV_MONTURES_DATA[type]
  const { title, subtitle, color, frames, infos } = data
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    const timers = [300, 700, 1100, 1700].map((t, i) => setTimeout(() => setStep(i + 1), t))
    return () => timers.forEach(clearTimeout)
  }, [pageIndex])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 24 : 5, background: i === pageIndex ? color : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 2fr' }}>
        {/* Gauche : 3 montures */}
        <div style={{ padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          {frames.map((f, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              opacity: step > i ? 1 : 0,
              transform: step > i ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '28px 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={f.src} alt={f.ref} style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: 220 }} />
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 0.5 }}>{f.ref}</span>
            </div>
          ))}
        </div>

        {/* Droite : titre + infos */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Matériaux · Journée 1
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>{subtitle}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {infos.map((info, i) => (
              <div key={i} style={{
                opacity: step > 3 ? 1 : 0,
                transform: step > 3 ? 'translateX(0)' : 'translateX(24px)',
                transition: `all 0.5s ease ${i * 0.12}s`,
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${color}70`, borderRadius: 12, padding: '10px 14px',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{info.icon}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{info.label}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{info.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TV INAMI Info ─────────────────────────────────────────────────
function TVInamiInfo({ inamiRevealed }) {
  const CONDITIONS = [
    {
      titre: 'Seuils de correction',
      icon: '👁️',
      items: [
        { label: 'Moins de 18 ans', detail: 'Intervention dès 0,25 dioptrie' },
        { label: '18 à 64 ans', detail: 'Intervention à partir de ± 6,00 dioptries' },
        { label: '65 ans et plus', detail: 'À partir de ± 4,25 dioptries pour les verres bifocaux ou progressifs' },
      ],
    },
    {
      titre: 'Fréquence de renouvellement',
      icon: '🔄',
      items: [
        { label: 'Moins de 18 ans', detail: 'Un nouveau droit tous les 2 ans' },
        { label: '18 ans et plus', detail: 'Un nouveau droit tous les 5 ans' },
        { label: 'Exception', detail: 'Si la nouvelle prescription diffère d\'au moins 0,5 dioptrie par rapport à la précédente délivrance, un nouveau droit s\'ouvre immédiatement, sans attendre le délai standard' },
      ],
    },
    {
      titre: 'Documents requis',
      icon: '📄',
      items: [
        { label: 'Attestation', detail: 'Une attestation de délivrance signée, établie par l\'opticien (le fameux document "Annexe 15")' },
        { label: 'Prescription', detail: 'Une prescription d\'ophtalmologue valable, datée de moins de 6 mois' },
      ],
    },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '44px 64px',
    }}>
      {/* Header INAMI */}
      <div style={{ marginBottom: inamiRevealed ? 28 : 0, flex: inamiRevealed ? 0 : 1, display: 'flex', flexDirection: 'column', justifyContent: inamiRevealed ? 'flex-start' : 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.35)',
            borderRadius: 20, padding: '5px 18px',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Mutuelles et INAMI · Belgique
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 20 }}>
          <div style={{ fontSize: inamiRevealed ? 64 : 96, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
            INAMI
          </div>
          <div style={{ paddingBottom: inamiRevealed ? 8 : 14 }}>
            <div style={{ fontSize: inamiRevealed ? 16 : 22, fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              Institut National d&apos;Assurance
            </div>
            <div style={{ fontSize: inamiRevealed ? 16 : 22, fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              Maladie-Invalidité
            </div>
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'flex-start', gap: 14,
          background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.25)',
          borderRadius: 14, padding: '14px 20px', maxWidth: 720,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>🏛️</span>
          <p style={{ fontSize: inamiRevealed ? 14 : 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            C&apos;est l&apos;organisme public qui gère l&apos;assurance obligatoire soins de santé en Belgique,
            c&apos;est donc lui qui fixe les règles.
          </p>
        </div>
      </div>

      {/* Conditions révélées */}
      {inamiRevealed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, flex: 1 }}>
          {CONDITIONS.map((section) => (
            <div key={section.titre} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderTop: '2px solid rgba(201,162,39,0.6)',
              borderRadius: 14, padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {section.titre}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 14px',
                    borderLeft: '2px solid rgba(201,162,39,0.4)',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!inamiRevealed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 32 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.25)',
            animation: 'waitingPulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
            Le formateur va vous présenter les conditions de remboursement…
          </span>
        </div>
      )}
    </div>
  )
}

// ── TV Partena Offre ──────────────────────────────────────────────
function TVPartenaOffre({ partenaRevealed }) {
  const OFFRE = [
    { montant: '50 €', label: 'Verres unifocaux', icon: '👓' },
    { montant: '100 €', label: 'Verres progressifs', icon: '🔭' },
  ]
  const CONDITIONS = [
    'Avantage disponible une fois tous les 2 ans',
    "Non cumulable avec l'Avantage Partenamut classique (75 € tous les 2 ans sur montures, verres correcteurs ou lentilles de contact, chez l'opticien de son choix)",
    "Pas besoin de prescription ophtalmologique",
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '44px 64px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: partenaRevealed ? 32 : 0, flex: partenaRevealed ? 0 : 1, display: 'flex', flexDirection: 'column', justifyContent: partenaRevealed ? 'flex-start' : 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.35)', borderRadius: 20, padding: '5px 18px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Partenariat · Lunettes Pour Tous Belgique
            </span>
          </div>
        </div>

        <div style={{ fontSize: partenaRevealed ? 64 : 96, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -2, marginBottom: 16 }}>
          PARTENA
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.25)',
          borderRadius: 14, padding: '12px 20px', maxWidth: 600,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🤝</span>
          <p style={{ fontSize: partenaRevealed ? 14 : 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            Mutualité Partena — Offre partenaire Lunettes Pour Tous
          </p>
        </div>
      </div>

      {/* Offre révélée */}
      {partenaRevealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          {/* Montants */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {OFFRE.map((o) => (
              <div key={o.label} style={{
                background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.35)',
                borderRadius: 16, padding: '24px 28px',
                display: 'flex', alignItems: 'center', gap: 20,
              }}>
                <span style={{ fontSize: 36, flexShrink: 0 }}>{o.icon}</span>
                <div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#c9a227', lineHeight: 1, letterSpacing: -1 }}>{o.montant}</div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>pour une paire à {o.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Conditions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CONDITIONS.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: '3px solid rgba(201,162,39,0.4)',
                borderRadius: 12, padding: '12px 18px',
              }}>
                <span style={{ fontSize: 14, color: '#c9a227', flexShrink: 0, marginTop: 1 }}>●</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!partenaRevealed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 32 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', animation: 'waitingPulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
            Le formateur va vous présenter l&apos;offre partenaire…
          </span>
        </div>
      )}
    </div>
  )
}

// ── TV Remboursement France — Conditions ─────────────────────────
function TVParcoursOffres() {
  const BG = '#03112a'
  const CARD = '#0d1f3c'

  const offres = [
    {
      id: 'supreme',
      icon: '👑',
      nom: 'Le Suprême',
      tag: 'Remboursé par la mutuelle',
      color: '#c9a227',
      colorBg: 'rgba(201,162,39,0.08)',
      colorBorder: 'rgba(201,162,39,0.3)',
      points: [
        'Large choix de montures et verres premium',
        'Remboursement selon le contrat mutuelle du client',
        'Reste à charge selon le niveau de garantie',
      ],
    },
    {
      id: '1=1',
      icon: '✅',
      nom: 'Le 1=1',
      tag: '100% Santé — Zéro reste à charge',
      color: '#4ade80',
      colorBg: 'rgba(74,222,128,0.08)',
      colorBorder: 'rgba(74,222,128,0.3)',
      points: [
        'Sélection de montures au tarif de responsabilité',
        'Verres avec équipements essentiels inclus',
        'Pris en charge à 100% par la SS + mutuelle',
      ],
    },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: BG,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 60px', boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
        Les parcours remboursés
      </div>
      <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: 48, lineHeight: 1.15 }}>
        Deux offres, <span style={{ color: '#00abe9' }}>deux parcours</span>
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, width: '100%', maxWidth: 1000 }}>
        {offres.map(o => (
          <div key={o.id} style={{
            background: o.colorBg,
            border: `2px solid ${o.colorBorder}`,
            borderRadius: 24, padding: '40px 36px',
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, flexShrink: 0,
              }}>{o.icon}</div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 900, color: o.color, lineHeight: 1.1 }}>{o.nom}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontWeight: 500 }}>{o.tag}</div>
              </div>
            </div>
            <div style={{ width: '100%', height: 1, background: `${o.colorBorder}` }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {o.points.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: o.color, marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TVRembFrConditions({ rembfrRevealed }) {
  const revealed = rembfrRevealed || []
  const ordoRevealed = revealed.includes('ordonnance')
  const delaisRevealed = revealed.includes('delais')

  const BG = '#03112a'
  const CARD = '#0d1f3c'
  const BLUE = '#0089ba'
  const BLUE_L = '#00abe9'

  const LockDots = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
      <div style={{ fontSize: 22, opacity: 0.3 }}>🔒</div>
      {[1,2,3].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', animation: `pulse ${0.9 + i * 0.2}s ease-in-out infinite alternate` }} />
      ))}
    </div>
  )

  const conditions = [
    {
      id: 'couverture',
      num: '01',
      titre: 'Être couvert par la Sécurité Sociale',
      detail: 'et une mutuelle complémentaire ou la Complémentaire Santé Solidaire (CSS)',
      alwaysVisible: true,
      content: (
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,137,186,0.1)', borderRadius: 10, border: '1px solid rgba(0,137,186,0.2)' }}>
            <span style={{ fontSize: 18 }}>🏥</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Sécurité Sociale</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Remboursement de base</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,137,186,0.1)', borderRadius: 10, border: '1px solid rgba(0,137,186,0.2)' }}>
            <span style={{ fontSize: 18 }}>🤝</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Mutuelle / CSS</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Complète le remboursement SS</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ordonnance',
      num: '02',
      titre: 'Avoir une ordonnance en cours de validité',
      detail: 'La durée de validité dépend de l\'âge du patient',
      alwaysVisible: false,
      content: ordoRevealed ? (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Moins de 16 ans', duree: '1 an', color: '#f59e0b' },
            { label: 'De 16 à 42 ans', duree: '5 ans', color: BLUE_L },
            { label: '43 ans et plus', duree: '3 ans', color: '#a78bfa' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: row.color }}>{row.duree}</span>
            </div>
          ))}
          {/* LYLEOO */}
          <div style={{
            marginTop: 4, padding: '11px 14px',
            background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.25)',
            borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#c9a227', marginBottom: 3 }}>
                Pas d'ordonnance valable ? → LYLEOO
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                Pour les +18 ans uniquement · Uniquement pour débloquer un remboursement ·
                Après vérification de tous les autres critères
              </div>
            </div>
          </div>
        </div>
      ) : <LockDots />,
    },
    {
      id: 'delais',
      num: '03',
      titre: 'Respecter les délais de renouvellement',
      detail: 'Des règles différentes selon l\'âge',
      alwaysVisible: false,
      content: delaisRevealed ? (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Moins de 16 ans */}
          <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Moins de 16 ans</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              Renouvellement <strong style={{ color: '#fff' }}>tous les ans</strong> sans condition<br />
              Renouvellement <strong style={{ color: '#fff' }}>sans délai</strong> si changement de correction ≥ 0,50
            </div>
          </div>
          {/* Plus de 16 ans */}
          <div style={{ padding: '12px 14px', background: `rgba(0,171,233,0.07)`, border: `1px solid rgba(0,171,233,0.2)`, borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: BLUE_L, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>16 ans et plus</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              Renouvellement <strong style={{ color: '#fff' }}>tous les 2 ans</strong><br />
              Anticipé après <strong style={{ color: '#fff' }}>1 an et 1 jour</strong> si changement ≥ 0,50
            </div>
          </div>
          {/* AMELIPRO */}
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>💻</span>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              Date du dernier remboursement vérifiable sur <strong style={{ color: BLUE_L }}>AMELIPRO</strong> via le numéro de sécurité sociale du patient
            </div>
          </div>
        </div>
      ) : <LockDots />,
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${BG} 0%, #001a3d 100%)`,
      display: 'flex', flexDirection: 'column',
      padding: '40px 48px',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Remboursement optique · France
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
          Les conditions de remboursement
        </h1>
      </div>

      {/* 3 cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, flex: 1 }}>
        {conditions.map(c => (
          <div key={c.id} style={{
            background: CARD, border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: 18, padding: '24px 22px',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Numéro */}
            <div style={{
              fontSize: 11, fontWeight: 900, color: BLUE, letterSpacing: 2,
              marginBottom: 12,
            }}>{c.num}</div>
            {/* Titre */}
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 6 }}>
              {c.titre}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 4 }}>
              {c.detail}
            </div>
            {/* Contenu */}
            <div style={{ flex: 1 }}>{c.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TV Mutuelles Reveal ───────────────────────────────────────────
function TVMutuellesReveal({ mutuellesRevealed }) {
  const revealed = mutuellesRevealed || []
  const avecOptique = MUTUELLES_BELGIQUE.filter(m => m.complementaire)
  const sansOptique = MUTUELLES_BELGIQUE.filter(m => !m.complementaire)

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '32px 52px', gap: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)',
            borderRadius: 20, padding: '4px 16px', marginBottom: 10,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Mutuelles et INAMI · Belgique
            </span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            Les organismes assureurs reconnus
          </div>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#4ade80' }}>{avecOptique.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}>avec optique</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#f87171' }}>{sansOptique.length}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}>sans optique</div>
          </div>
        </div>
      </div>

      {/* Cartes avec optique — 3 colonnes, pleine hauteur */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, flex: 1 }}>
        {avecOptique.map((m) => {
          const isRevealed = revealed.includes(m.id)
          return (
            <div key={m.id} style={{
              background: isRevealed
                ? 'linear-gradient(160deg, rgba(201,162,39,0.12) 0%, rgba(201,162,39,0.04) 100%)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isRevealed ? 'rgba(201,162,39,0.4)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 18, overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
              transition: 'all .4s ease',
            }}>
              {/* Barre top colorée */}
              <div style={{
                height: 5,
                background: isRevealed
                  ? 'linear-gradient(90deg, #a07818, #c9a227)'
                  : 'rgba(255,255,255,0.07)',
              }} />

              <div style={{ padding: '22px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Nom */}
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 4 }}>
                    {m.nom}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {m.type}
                  </div>
                </div>

                {/* Badge optique */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: 10, padding: '8px 14px', alignSelf: 'flex-start',
                }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>Assurance complémentaire optique</span>
                </div>

                {/* Séparateur */}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

                {/* Zone détails / attente */}
                {isRevealed && m.montant ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                    {/* Montant mis en valeur */}
                    <div style={{
                      background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)',
                      borderRadius: 12, padding: '14px 18px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Montant</span>
                      <span style={{ fontSize: 26, fontWeight: 900, color: '#c9a227', letterSpacing: -0.5 }}>{m.montant}</span>
                    </div>
                    {/* Fréquence */}
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Fréquence</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>{m.frequence}</div>
                    </div>
                    {/* Particularités */}
                    {m.particularites && m.particularites !== '/' && (
                      <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '12px 14px', flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Particularités</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{m.particularites}</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '20px 0' }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: '50%',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22,
                    }}>🔒</div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', marginBottom: 8 }}>
                        En attente de révélation
                      </div>
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: 'rgba(255,255,255,0.15)',
                            animation: `waitingPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Section sans optique — 3 mini-cartes côte à côte */}
      <div style={{
        background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)',
        borderRadius: 14, padding: '16px 20px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
          ✗ Sans assurance complémentaire optique
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {sansOptique.map(m => (
            <div key={m.id} style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 10, padding: '12px 16px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)', lineHeight: 1.3 }}>{m.nom}</div>
              <div style={{ fontSize: 10, color: 'rgba(239,68,68,0.6)', marginTop: 2 }}>{m.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function TVContentPage({ page, pageIndex, total, moduleLabel, troublesPhase, opticienPlaying, troublesSelected, audioUnlocked, ordoPlaying, ordoRevealStep, freinsResponses, prixResponses, ventesResponses, promesseResponses, progZoneQ, progZoneResponses, progZoneShowCorrect, progRetourResponses, progObjectionIdx, progObjectionResponses, progBestAnswer, trameStep, offres11Step, offresClassiqueStep, modelePoint, revealPrix, revealVentes, mutuellesRevealed, inamiRevealed, partenaRevealed, rembfrRevealed }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  if (page.type === 'mutuelles-reveal')   return <TVMutuellesReveal mutuellesRevealed={mutuellesRevealed} />
  if (page.type === 'inami-info')         return <TVInamiInfo inamiRevealed={inamiRevealed} />
  if (page.type === 'partena-offre')      return <TVPartenaOffre partenaRevealed={partenaRevealed} />
  if (page.type === 'rembfr-conditions')  return <TVRembFrConditions rembfrRevealed={rembfrRevealed} />
  if (page.type === 'parcours-rembourses-offres') return <TVParcoursOffres />
  if (page.type === 'troubles-intro')    return <TVTroublesIntro      page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'troubles-list')     return <TVTroublesListVideo  page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} troublesSelected={troublesSelected} audioUnlocked={audioUnlocked} />
  if (page.type === 'trame-accueil')    return <TVTrameAccueil step={trameStep} />
  if (page.type === 'montures-acetate') return <TVMontures type="montures-acetate" pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'montures-metal')   return <TVMontures type="montures-metal"   pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'montures-injecte') return <TVMontures type="montures-injecte" pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'pdm-pourquoi')     return <TVPdmPourquoi pageIndex={pageIndex} total={total} />
  if (page.type === 'offres-classique')   return <TVOffresClassique step={offresClassiqueStep} />
  if (page.type === 'offres-1-1')         return <TVOffres11 step={offres11Step} />
  if (page.type === 'offres-unifocal-11')   return <TVOffresUnifocal11 />
  if (page.type === 'offres-progressif-11') return <TVOffresProgressif11 />
  if (page.type === 'correction-scale') return <TVCorrectionScale    page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'ordonnance')        return <TVOrdonnance         page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} ordoPlaying={ordoPlaying} ordoRevealStep={ordoRevealStep} audioUnlocked={audioUnlocked} />
  if (page.type === 'pause')             return <TVPause              page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'saisie-interactive') return <TVSaisieInteractive page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />

  // Entreprise module types — tous dispatchés pour éviter le VerreAnime
  if (page.type === 'freins')     return <TVEntrepriseFreins   page={page} pageIndex={pageIndex} total={total} freinsResponses={freinsResponses} />
  if (page.type === 'prix')       return <TVEntreprisePrix     page={page} pageIndex={pageIndex} total={total} prixResponses={prixResponses} revealPrix={revealPrix} />
  if (page.type === 'video-lpt')  return <TVVideoLPT audioUnlocked={audioUnlocked} />
  if (page.type === 'ventes-opticien') return <TVEntrepriseVentesOpticien page={page} pageIndex={pageIndex} total={total} ventesResponses={ventesResponses} revealVentes={revealVentes} />
  if (page.type === 'promesse')        return <TVEntreprisePromesse       page={page} pageIndex={pageIndex} total={total} promesseResponses={promesseResponses} />
  if (page.type === 'chiffres')           return <TVEntrepriseChiffres   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'force-lpt') return <TVEntrepriseForceLPT  page={page} pageIndex={pageIndex} total={total} modelePoint={modelePoint} audioUnlocked={audioUnlocked} />
  if (page.type === 'naissance')  return <TVEntrepriseNaissance page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'impact')     return <TVEntreprisePoints   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'probleme')   return <TVEntreprisePoints   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'machines')   return <TVEntreprisePoints   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'timeline')   return <TVEntrepriseTimeline  page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'piliers')    return <TVEntreprisePiliers   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'steps')      return <TVEntrepriseSteps     page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'cases')      return <TVEntrepriseCases     page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'visages')    return <TVEntrepriseVisages   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'croissance') return <TVEntrepriseCroissance page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'mission')    return <TVEntrepriseMission   page={page} pageIndex={pageIndex} total={total} />

  // Progressif module types
  if (page.type === 'zone-interactif') return <TVProgressifZoneInteractif page={page} pageIndex={pageIndex} total={total} progZoneQ={progZoneQ} progZoneResponses={progZoneResponses} progZoneShowCorrect={progZoneShowCorrect} />
  if (page.type === 'prog-retour')     return <TVProgressifRetourTerrain  page={page} pageIndex={pageIndex} total={total} progRetourResponses={progRetourResponses} />
  if (page.type === 'prog-objections') return <TVProgressifJeuObjections  page={page} pageIndex={pageIndex} total={total} progObjectionIdx={progObjectionIdx} progObjectionResponses={progObjectionResponses} progBestAnswer={progBestAnswer} />

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Particules déco */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', width: 3, height: 3, borderRadius: '50%',
            background: page.color, opacity: 0.25 + (i % 3) * 0.1,
            left: `${5 + i * 9}%`, top: `${20 + (i % 4) * 20}%`,
            animation: `particleFloat ${3 + i * 0.5}s ease-in-out ${i * 0.25}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', position: 'relative', zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? page.color : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 40, padding: '16px 48px 24px', alignItems: 'center', position: 'relative', zIndex: 5,
      }}>
        {/* Texte gauche */}
        <div style={{
          opacity: entered ? 1 : 0, transform: entered ? 'translateX(0)' : 'translateX(-28px)',
          transition: 'all .55s ease',
        }}>
          <div style={{
            display: 'inline-block', background: `${page.color}20`,
            border: `1px solid ${page.color}45`, borderRadius: 20,
            padding: '4px 14px', fontSize: 11, fontWeight: 700,
            color: page.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
          }}>Formation LPT</div>

          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontWeight: 400 }}>
            {page.sousTitre}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {page.points.map((pt, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateX(0)' : 'translateX(-16px)',
                transition: `all .45s ease ${0.08 + i * 0.09}s`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${page.color}18`, border: `1px solid ${page.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                }}>{pt.emoji}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.texte}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration droite */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: entered ? 1 : 0, transform: entered ? 'scale(1)' : 'scale(0.88)',
          transition: 'all .65s ease .1s',
        }}>
          {page.image ? (
            <TVImageVisual src={page.image} color={page.color} />
          ) : page.icon ? (
            <TVEmojiVisual emoji={page.icon} color={page.color} />
          ) : (
            <VerreAnime color={page.color} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── TV Module Lobby ───────────────────────────────────────────────
function TVModuleLobby({ moduleLabel, moduleSub }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 700, padding: '0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={220} height={84}
            style={{ objectFit: 'contain', animation: 'logoBreathe 3.5s ease-in-out infinite' }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
          Module de formation
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 18 }}>
          {moduleLabel}
        </h1>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)', marginBottom: 52, lineHeight: 1.6 }}>
          {moduleSub}
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.25)',
          borderRadius: 40, padding: '16px 32px',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.4s ease-in-out infinite' }} />
          <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Le formateur va lancer le module…</span>
        </div>
      </div>
    </div>
  )
}

// ── Écran planning (diffusion TV) ─────────────────────────────────
function TVPlanningScreen({ planningDay }) {
  const jour = PLANNING_JOURS.find(j => j.id === planningDay)
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    setVisible(0)
    if (!jour) return
    const timers = jour.blocs.map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 400 + i * 500)
    )
    return () => timers.forEach(clearTimeout)
  }, [planningDay])

  if (!jour) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={120} height={46} style={{ objectFit: 'contain', marginBottom: 24 }} />
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>Sélectionnez un jour depuis le tableau de bord</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '36px 60px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>Planning Onboarding</span>
        </div>
        <div style={{ background: `${jour.color}20`, border: `1px solid ${jour.color}50`, borderRadius: 20, padding: '6px 20px', fontSize: 12, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1 }}>
          {jour.jour}
        </div>
      </div>

      {/* Titre */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 6 }}>{jour.label}</div>
        <div style={{ width: 60, height: 4, borderRadius: 2, background: jour.color }} />
      </div>

      {/* Blocs */}
      <div style={{ display: 'flex', gap: 20, flex: 1, alignItems: 'stretch' }}>
        {jour.blocs.map((bloc, i) => {
          const isPause = bloc.titre === 'Pause déjeuner'

          if (isPause) return (
            <div key={i} style={{
              flex: '0 0 88px',
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderTop: '3px solid #f59e0b',
              borderRadius: 16,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: i < visible ? 1 : 0,
              transform: i < visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <div style={{ width: 28, height: 2, borderRadius: 1, background: 'rgba(245,158,11,0.4)' }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', lineHeight: 1.4 }}>
                Pause<br />déjeuner
              </div>
              {bloc.horaire && <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.55)', textAlign: 'center' }}>{bloc.horaire}</div>}
              <div style={{ width: 28, height: 2, borderRadius: 1, background: 'rgba(245,158,11,0.4)' }} />
            </div>
          )

          return (
            <div key={i} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`,
              borderTop: `3px solid ${jour.color}`,
              borderRadius: 16, padding: '22px 20px',
              opacity: i < visible ? 1 : 0,
              transform: i < visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              {bloc.horaire && (
                <div style={{ fontSize: 11, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{bloc.horaire}</div>
              )}
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 14, lineHeight: 1.2 }}>{bloc.titre}</div>
              {bloc.items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bloc.items.map((item, j) => (
                    <div key={j} style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderLeft: `3px solid ${jour.color}60`,
                      borderRadius: 10, padding: '9px 14px',
                      fontSize: 14, color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500, lineHeight: 1.4,
                    }}>{item}</div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TV FAQ Réveil des acquis ──────────────────────────────────────
const FAQ_JOURNEE_META = {
  j1: { label: 'Journée 1', sousTitre: 'Les fondamentaux de l\'optique', color: '#f59e0b', icon: '🌅' },
  j2: { label: 'Journée 2', sousTitre: 'Les offres et la vente',         color: '#10b981', icon: '🤝' },
  j3: { label: 'Journée 3', sousTitre: 'La prise de mesures',            color: '#8b5cf6', icon: '📐' },
}

// Thèmes cumulatifs par journée (j2 = j1+j2, j3 = j1+j2+j3)
const FAQ_THEMES = {
  j1: [
    { icon: '🏢', label: "Présentation de l'entreprise", items: ["Histoire & vision LPT", "L'accessibilité des lunettes", "Visite magasin & produits"] },
    { icon: '👁️', label: "Les bases de l'optique",       items: ["Pourquoi porte-on des lunettes", "Les troubles visuels", "Lecture d'une ordonnance"] },
    { icon: '🔬', label: "Les types de verres",           items: ["Le verre unifocal", "Unifocal vs progressif"] },
  ],
  j2: [
    { icon: '🏢', label: "Présentation de l'entreprise", items: ["Histoire & vision LPT", "L'accessibilité des lunettes"] },
    { icon: '👁️', label: "Les bases de l'optique",       items: ["Troubles visuels", "Corrections", "Ordonnances"] },
    { icon: '🔬', label: "Les types de verres",           items: ["Verre unifocal", "Verre progressif"] },
    { icon: '🤝', label: "Trame d'accueil",               items: ["Présentation du concept aux clients"] },
    { icon: '🏷️', label: "Les offres LPT",               items: ["Parcours classique", "Parcours 1+1", "Immersion magasin"] },
  ],
  j3: [
    { icon: '🏢', label: "Présentation de l'entreprise", items: [] },
    { icon: '👁️', label: "Les bases de l'optique",       items: ["Troubles visuels", "Ordonnances"] },
    { icon: '🏷️', label: "Les offres LPT",               items: ["Parcours classique", "1+1", "Suprême", "Tiers payant"] },
    { icon: '🤝', label: "Trame d'accueil",               items: ["Accueil client", "Simulation vente"] },
    { icon: '📐', label: "Prise de mesures",              items: ["Écart pupillaire", "Hauteur", "LPTVISION", "Téléphone"] },
  ],
}

function TVFAQView({ journeeId, questions }) {
  const meta   = FAQ_JOURNEE_META[journeeId] || FAQ_JOURNEE_META.j1
  const themes = FAQ_THEMES[journeeId] || FAQ_THEMES.j1
  const accent = meta.color

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Réveil des acquis</span>
        </div>
        <div style={{
          background: `${accent}18`, border: `1px solid ${accent}40`,
          borderRadius: 20, padding: '6px 16px',
          fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 0.5,
        }}>{meta.icon} {meta.label}</div>
      </div>

      {/* Corps : colonne thèmes | colonne questions */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>

        {/* ── Colonne gauche : thèmes abordés ── */}
        <div style={{
          width: 340, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: 'rgba(0,0,0,0.25)',
          borderRight: `2px solid ${accent}40`,
          overflowY: 'auto',
          padding: '16px 0 16px',
        }}>
          {/* Header thèmes */}
          <div style={{
            padding: '0 20px 14px 24px',
            borderBottom: `1px solid ${accent}30`,
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 2 }}>
              Thèmes abordés
            </div>
          </div>

          {/* Cards thèmes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px 0 20px' }}>
            {themes.map((theme, i) => (
              <div key={i} style={{
                background: `${accent}14`,
                border: `1px solid ${accent}35`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: 10,
                padding: '11px 14px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: theme.items.length ? 7 : 0 }}>
                  {theme.icon} {theme.label}
                </div>
                {theme.items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {theme.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingLeft: 6, lineHeight: 1.5 }}>
                        · {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Aide participation */}
          <div style={{ margin: '18px 16px 0 20px', padding: '12px 14px', background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 4 }}>💬 Comment participer ?</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Posez vos questions sur votre téléphone de manière anonyme
            </div>
          </div>
        </div>

        {/* ── Colonne droite : titre + bulles questions ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 16 }}>
          {/* Titre */}
          <div style={{ textAlign: 'center', padding: '14px 40px 14px', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
              FAQ anonyme · {meta.label}
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 2 }}>
              Questions des participants
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{meta.sousTitre}</p>
          </div>

          {/* Zone bulles */}
          <div style={{
            flex: 1,
            display: 'flex', flexWrap: 'wrap',
            columnGap: 16, rowGap: 24,
            justifyContent: 'center', alignItems: 'flex-start', alignContent: 'flex-start',
            padding: '8px 40px 16px',
            overflow: 'hidden',
          }}>
            {questions.length === 0 ? (
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', marginTop: 40 }}>
                En attente des questions…
              </div>
            ) : questions.map((q, i) => (
              <div key={q.id} style={{
                background: q.highlighted
                  ? `linear-gradient(135deg, ${accent}22, ${accent}0d)`
                  : 'rgba(5,20,55,0.88)',
                border: q.highlighted
                  ? `2px solid ${accent}`
                  : `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
                borderRadius: B_RAD[i % 12],
                padding: q.highlighted ? '18px 28px' : '12px 20px',
                maxWidth: q.highlighted ? 420 : 280,
                fontSize: q.highlighted ? 20 : 15,
                fontWeight: q.highlighted ? 700 : 600,
                color: '#fff', lineHeight: 1.45,
                backdropFilter: 'blur(16px)',
                boxShadow: q.highlighted
                  ? `0 0 50px ${accent}50, 0 0 100px ${accent}20, 0 8px 32px rgba(0,0,0,0.5)`
                  : `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}30`,
                animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                animationDelay: `${i * 0.07}s`,
                marginTop: q.highlighted ? 0 : B_MT[i % 12],
                transform: q.highlighted
                  ? 'scale(1.06) rotate(0deg)'
                  : `scale(1) rotate(${B_ROT[i % 12]}deg)`,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: q.highlighted ? 10 : 1,
                position: 'relative',
              }}>
                {q.highlighted && (
                  <div style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                    ★ En cours de traitement
                  </div>
                )}
                {q.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function WelcomeScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 60%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Halo décoratif derrière le logo */}
      <div style={{
        position: 'absolute',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,171,233,0.12) 0%, transparent 70%)',
        animation: 'haloPulse 4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Image
        src="/assets/logo-lpt-blanc.png"
        alt="Lunettes Pour Tous"
        width={400}
        height={152}
        style={{
          objectFit: 'contain',
          animation: 'logoBreathe 3.5s ease-in-out infinite',
          position: 'relative', zIndex: 1,
        }}
        priority
      />

      {/* Séparateur */}
      <div style={{
        width: 48, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(0,171,233,0.6), transparent)',
        margin: '40px 0 36px',
        borderRadius: 2,
      }} />

      {/* Texte */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          fontSize: 22, fontWeight: 500,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: 8, textTransform: 'uppercase',
        }}>Bienvenue chez</div>
        <div style={{
          fontSize: 72, fontWeight: 800,
          color: '#ffffff',
          letterSpacing: 2, textAlign: 'center',
          lineHeight: 1.05,
        }}>Lunettes Pour Tous</div>
      </div>
    </div>
  )
}

function WaitingScreen({ roomCode }) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    const code = (roomCode || getTvDisplayRoomCode() || getLegacySessionCode()).trim()
    setQrUrl(buildQrImageUrl(code))
  }, [roomCode])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={300} height={114}
        style={{ objectFit: 'contain', marginBottom: 52, animation: 'logoBreathe 3.5s ease-in-out infinite' }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 56,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28, padding: '36px 48px',
      }}>
        <div style={{
          background: '#0a2a5c', borderRadius: 18, padding: 12,
          border: '2px solid rgba(0,171,233,0.35)',
          boxShadow: '0 0 40px rgba(0,171,233,0.15)',
        }}>
          {qrUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrUrl} alt="QR Code" width={220} height={220}
              style={{ display: 'block', borderRadius: 8 }} />
          ) : (
            <div style={{ width: 220, height: 220, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
          )}
        </div>

        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#00abe9',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14,
          }}>Rejoindre la formation</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
            Scannez ce QR code<br />avec votre téléphone
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
            Connectez-vous avec votre nom et prénom<br />comme sur la liste RH.
            {roomCode && (
              <>
                <br />
                <span style={{ fontFamily: 'monospace', letterSpacing: 3, color: 'rgba(0,171,233,0.85)' }}>{roomCode}</span>
              </>
            )}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.25)',
            borderRadius: 20, padding: '8px 18px',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#00abe9',
              animation: 'waitingPulse 1.4s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              En attente du formateur…
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── LPT Trophy SVG ───────────────────────────────────────────────
function LPTTrophy({ size = 160 }) {
  const lR = size * 0.215
  const lY = size * 0.30
  const lX = size * 0.30
  const rX = size * 0.70
  const cx = size * 0.50
  const sW = size * 0.08
  const sH = size * 0.20
  const sX = cx - sW / 2
  const sY = lY + lR + size * 0.04
  const bW = size * 0.58
  const bH = size * 0.08
  const bX = cx - bW / 2
  const bY = sY + sH
  return (
    <svg viewBox={`0 0 ${size} ${size * 1.15}`} width={size} height={size * 1.15} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tgBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#00abe9"/>
        </linearGradient>
        <linearGradient id="tgGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
        <filter id="tgl">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Handles */}
      <path d={`M ${lX - lR * 0.7} ${lY - lR * 0.5} Q ${size * 0.03} ${lY} ${sX} ${sY + sH * 0.1}`}
        fill="none" stroke="url(#tgBlue)" strokeWidth={size * 0.03} strokeLinecap="round" filter="url(#tgl)"/>
      <path d={`M ${rX + lR * 0.7} ${lY - lR * 0.5} Q ${size * 0.97} ${lY} ${sX + sW} ${sY + sH * 0.1}`}
        fill="none" stroke="url(#tgBlue)" strokeWidth={size * 0.03} strokeLinecap="round" filter="url(#tgl)"/>
      {/* Lenses */}
      <circle cx={lX} cy={lY} r={lR} fill="rgba(0,171,233,0.07)"
        stroke="url(#tgBlue)" strokeWidth={size * 0.05} filter="url(#tgl)"/>
      <circle cx={rX} cy={lY} r={lR} fill="rgba(0,171,233,0.07)"
        stroke="url(#tgBlue)" strokeWidth={size * 0.05} filter="url(#tgl)"/>
      {/* Bridge */}
      <line x1={lX + lR} y1={lY} x2={rX - lR} y2={lY}
        stroke="url(#tgBlue)" strokeWidth={size * 0.03} strokeLinecap="round" filter="url(#tgl)"/>
      {/* Stem */}
      <rect x={sX} y={sY} width={sW} height={sH} fill="url(#tgBlue)" rx={3}/>
      {/* Base */}
      <rect x={bX} y={bY} width={bW} height={bH} fill="url(#tgGold)" rx={5}/>
      <rect x={bX + bW * 0.05} y={bY + bH * 0.15} width={bW * 0.9} height={bH * 0.28}
        fill="rgba(255,255,255,0.22)" rx={2}/>
    </svg>
  )
}

// ── TV Quiz Correction (débrief après chaque question) ───────────
function TVQuizCorrection({ question, qIdx, total, moduleLabel, sessionCode }) {
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}&question_idx=eq.${qIdx}`)
      .then(rows => setAnswers(rows || []))
    const t = setInterval(() => {
      sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}&question_idx=eq.${qIdx}`)
        .then(rows => setAnswers(rows || []))
    }, 2000)
    return () => clearInterval(t)
  }, [qIdx, sessionCode])

  const total_answers = answers.length
  const correct_count = answers.filter(r => r.is_correct).length
  const wrong_count   = total_answers - correct_count
  const counts = question.options.map((_, i) => answers.filter(r => r.answer_idx === i).length)

  const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '32px 60px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={36} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{moduleLabel}</span>
        </div>
        <div style={{
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: 20, padding: '6px 22px',
          fontSize: 13, fontWeight: 700, color: '#4ade80', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>✓ Correction — Question {qIdx + 1} / {total}</div>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 28 }}>
        <div style={{
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)',
          borderRadius: 18, padding: '14px 36px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#4ade80' }}>{correct_count}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>bonne{correct_count > 1 ? 's' : ''} réponse{correct_count > 1 ? 's' : ''}</div>
        </div>
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: 18, padding: '14px 36px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#f87171' }}>{wrong_count}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>mauvaise{wrong_count > 1 ? 's' : ''} réponse{wrong_count > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Question */}
      <div style={{
        fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center',
        marginBottom: 24, lineHeight: 1.35, maxWidth: 860, alignSelf: 'center',
      }}>{question.question}</div>

      {/* Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800, alignSelf: 'center', width: '100%' }}>
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correct
          const count = counts[i]
          const pct = total_answers > 0 ? (count / total_answers) * 100 : 0
          return (
            <div key={i} style={{
              background: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
              border: `2px solid ${isCorrect ? '#4ade80' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 16, padding: '12px 18px',
              boxShadow: isCorrect ? '0 0 24px rgba(74,222,128,0.2)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: isCorrect ? '#4ade80' : OPTION_COLORS[i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 800, color: isCorrect ? '#052e16' : '#fff',
                  }}>{'ABCD'[i]}</div>
                  <span style={{ fontSize: 16, fontWeight: isCorrect ? 800 : 500, color: isCorrect ? '#4ade80' : '#fff' }}>{opt}</span>
                  {isCorrect && <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 12px', borderRadius: 20 }}>✓ Bonne réponse</span>}
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: isCorrect ? '#4ade80' : 'rgba(255,255,255,0.6)' }}>
                  {count} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>vote{count > 1 ? 's' : ''}</span>
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${pct}%`,
                  background: isCorrect ? '#4ade80' : OPTION_COLORS[i],
                  transition: 'width .5s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Phrases d'humour podium (top 5 uniquement) ───────────────────
const PHRASES_P1 = [
  "[Prénom] voit tout et répond juste — même son opticien prend des notes.",
  "Correction parfaite, score parfait. [Prénom] n'a clairement pas besoin de lunettes pour voir les bonnes réponses.",
  "[Prénom] : vision 10/10, sans ordonnance. Le reste de l'équipe peut prendre rendez-vous.",
  "[Prénom] a tout bon. On se demande même s'il n'avait pas les réponses avant.",
  "[Prénom] écrase la concurrence. Quelqu'un a vérifié qu'il ne triche pas avec des lunettes à caméra ?",
  "Respect [Prénom]. On parle de toi dans la salle de pause depuis 10 minutes.",
]
const PHRASES_P2 = [
  "[Prénom] était si proche… une dioptrie de plus et c'était l'or.",
  "L'argent c'est élégant [Prénom] — mais la prochaine fois, vise la première marche.",
  "[Prénom] voit bien… mais pas aussi loin que le premier.",
  "[Prénom] : deuxième. C'est la place des gens intelligents qui laissent les autres gagner par politesse.",
  "[Prénom] aurait pu gagner… mais il a sûrement été distrait par une belle monture.",
  "Deuxième [Prénom] — t'inquiète, le premier a sûrement triché.",
]
const PHRASES_P3 = [
  "[Prénom] est sur le podium. C'est déjà mieux que de regarder depuis le fond du magasin.",
  "Bronze pour [Prénom] — en optique on dirait que la mise au point est presque parfaite.",
  "[Prénom] sur la troisième marche — là où les vrais professionnels se posent.",
  "[Prénom] : troisième. C'est le nombre de zones d'un verre progressif, c'est forcément un signe.",
  "Podium assuré pour [Prénom]. Maintenant il faut juste travailler les deux premières marches.",
]
const PHRASES_P45 = [
  "[Prénom] : juste en dehors du podium. Comme un verre sans traitement — presque parfait.",
  "[Prénom] a frôlé la médaille. On sent que l'adaptation est en cours.",
  "Si près, si loin [Prénom]… un peu comme essayer des lunettes sans les essayer vraiment.",
  "[Prénom] : premier des non-médaillés. C'est une médaille en soi… presque.",
  "[Prénom] a manqué le podium d'un souffle. Ou d'une question. On va dire d'un souffle.",
]
const PHRASES_TOP5 = [...PHRASES_P1, ...PHRASES_P2, ...PHRASES_P3, ...PHRASES_P45]

function pickPhrase(pool, firstName) {
  const raw = pool[Math.floor(Math.random() * pool.length)]
  return raw.replace(/\[Prénom\]/g, firstName)
}

// ── TV Quiz Podium interstitiel (toutes les 5 questions) ──────────
function TVQuizPodium({ qIdx, onDone, sessionCode, skipSignal }) {
  const [top3, setTop3] = useState([])
  const phraseRef = useRef(null)

  useEffect(() => {
    sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}`).then(rows => {
      const grouped = {}
      ;(rows || []).filter(r => r.question_idx < qIdx).forEach(r => {
        if (!grouped[r.collaborateur]) grouped[r.collaborateur] = 0
        if (r.is_correct) grouped[r.collaborateur]++
      })
      const sorted = Object.entries(grouped)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, 3)
      setTop3(sorted)
      if (sorted[0]) {
        const firstName = sorted[0].name.split(' ').pop()
        phraseRef.current = pickPhrase(PHRASES_TOP5, firstName)
      }
    })
  }, [qIdx])

  useEffect(() => {
    if (skipSignal) onDone()
  }, [skipSignal, onDone])

  const slots = [top3[1], top3[0], top3[2]]
  const stepH = [180, 240, 150]
  const medals = ['🥈', '🥇', '🥉']
  const ranks = [2, 1, 3]
  const cols = [
    { fill: 'rgba(148,163,184,0.2)', border: '#94a3b8', score: '#cbd5e1' },
    { fill: 'rgba(251,191,36,0.2)',  border: '#fbbf24', score: '#fde68a' },
    { fill: 'rgba(180,83,9,0.2)',    border: '#d97706', score: '#fcd34d' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020d1f 0%, #071832 50%, #0a2040 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 60px', position: 'relative', overflow: 'hidden',
    }}>
      {[...Array(14)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, borderRadius: '50%',
          background: ['#fbbf24','#00abe9','#a78bfa'][i % 3],
          left: `${4 + i * 7}%`, top: `${8 + (i * 11) % 72}%`, opacity: 0.28,
          animation: `starPulse ${1.8 + (i % 4) * 0.4}s ease-in-out infinite`,
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}

      <div style={{
        background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.35)',
        borderRadius: 20, padding: '7px 24px', marginBottom: 20,
        fontSize: 13, fontWeight: 700, color: '#00abe9', letterSpacing: 2, textTransform: 'uppercase',
      }}>⚡ Bilan après {qIdx} question{qIdx > 1 ? 's' : ''}</div>

      <div style={{
        animation: 'trophyFloat 3s ease-in-out infinite',
        filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.5))',
        marginBottom: 8,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/troph%C3%A9-quiz.png" alt="Trophée" width={110} height={110} style={{ objectFit: 'contain', display: 'block' }} />
      </div>

      <h2 style={{
        fontSize: 52, fontWeight: 900, color: '#fff', marginBottom: 44, textAlign: 'center',
        animation: 'podiumFadeIn 0.6s ease forwards',
      }}>Classement</h2>

      {top3.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
          {slots.map((player, i) => {
            if (!player) return <div key={i} style={{ width: 200, height: stepH[i] }} />
            const c = cols[i]
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  textAlign: 'center', marginBottom: 12,
                  animation: `podiumFadeIn 0.5s ease forwards`,
                  animationDelay: `${i * 0.15 + 0.3}s`, opacity: 0,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{medals[i]}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', maxWidth: 190, lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 900, color: c.score, lineHeight: 1.1, marginTop: 4 }}>
                    {player.score}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    /{qIdx} correct{player.score > 1 ? 'es' : 'e'}
                  </div>
                </div>
                <div style={{
                  width: 200, height: stepH[i],
                  background: c.fill, border: `2px solid ${c.border}`,
                  borderBottom: 'none', borderRadius: '14px 14px 0 0',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 20,
                  boxShadow: `0 0 40px ${c.border}30`,
                  animation: `podiumRise 0.7s ease forwards`,
                  animationDelay: `${i * 0.15}s`,
                }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: c.border, opacity: 0.55 }}>
                    #{ranks[i]}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {phraseRef.current && (
        <div style={{
          maxWidth: 680, textAlign: 'center', marginTop: 32, marginBottom: 8,
          fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
          fontStyle: 'italic', lineHeight: 1.5,
          animation: 'podiumFadeIn 0.8s ease 0.6s forwards', opacity: 0,
        }}>
          💬 {phraseRef.current}
        </div>
      )}

      <div style={{
        width: 630, height: 8,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        marginTop: 28, marginBottom: 20,
      }} />

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
        En attente du formateur…
      </div>
    </div>
  )
}

// ── TV Quiz Final Podium ──────────────────────────────────────────
function TVQuizFinalPodium({ quiz, sessionCode }) {
  const [top3, setTop3] = useState([])
  const [ready, setReady] = useState(false)
  const phraseRef = useRef(null)

  useEffect(() => {
    sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}`).then(rows => {
      const grouped = {}
      ;(rows || []).forEach(r => {
        if (!grouped[r.collaborateur]) grouped[r.collaborateur] = 0
        if (r.is_correct) grouped[r.collaborateur]++
      })
      const sorted = Object.entries(grouped)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, 3)
      setTop3(sorted)
      if (sorted[0]) {
        const firstName = sorted[0].name.split(' ').pop()
        phraseRef.current = pickPhrase(PHRASES_P1, firstName)
      }
      setTimeout(() => setReady(true), 400)
    })
  }, [])

  const slots = [top3[1], top3[0], top3[2]]
  const stepH = [220, 300, 170]
  const medals = ['🥈', '🥇', '🥉']
  const ranks = [2, 1, 3]
  const cols = [
    { fill: 'rgba(148,163,184,0.18)', border: '#94a3b8', score: '#cbd5e1', bg: 'rgba(148,163,184,0.07)' },
    { fill: 'rgba(251,191,36,0.18)',  border: '#fbbf24', score: '#fde68a', bg: 'rgba(251,191,36,0.07)'  },
    { fill: 'rgba(180,83,9,0.18)',    border: '#d97706', score: '#fcd34d', bg: 'rgba(180,83,9,0.07)'    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 25%, #0e2547 0%, #020d1f 70%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '28px 60px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Rayons dorés */}
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg, i) => (
        <div key={i} style={{
          position: 'absolute', top: '22%', left: '50%',
          width: 1.5, height: '85%',
          background: 'linear-gradient(180deg, rgba(251,191,36,0.12) 0%, transparent 100%)',
          transform: `rotate(${deg}deg)`, transformOrigin: 'top center',
        }} />
      ))}
      {/* Particules */}
      {[...Array(18)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 3 + (i % 4), height: 3 + (i % 4), borderRadius: '50%',
          background: ['#fbbf24','#00abe9','#a78bfa','#34d399'][i % 4],
          left: `${3 + i * 5.5}%`, top: `${5 + (i * 13) % 80}%`, opacity: 0.3,
          animation: `starPulse ${1.5 + (i % 5) * 0.35}s ease-in-out infinite`,
          animationDelay: `${i * 0.12}s`,
        }} />
      ))}

      <div style={{ position: 'absolute', top: 28, left: 40 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
      </div>

      {/* Trophée */}
      <div style={{
        animation: 'trophyFloat 3s ease-in-out infinite',
        filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.6))',
        marginBottom: 4,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/troph%C3%A9-quiz.png" alt="Trophée champion" width={150} height={150} style={{ objectFit: 'contain', display: 'block' }} />
      </div>

      <h1 style={{
        fontSize: 64, fontWeight: 900, color: '#fff', marginBottom: 6, textAlign: 'center',
        animation: 'podiumFadeIn 0.7s ease 0.2s forwards', opacity: 0,
        textShadow: '0 0 40px rgba(251,191,36,0.45)',
      }}>Podium final !</h1>
      <p style={{
        fontSize: 19, color: 'rgba(255,255,255,0.45)', marginBottom: 36, fontWeight: 500,
        animation: 'podiumFadeIn 0.7s ease 0.35s forwards', opacity: 0,
      }}>🎉 Bravo à tous les participants !</p>

      {/* Podium */}
      {ready && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16 }}>
          {slots.map((player, i) => {
            if (!player) return <div key={i} style={{ width: 240, height: stepH[i] }} />
            const c = cols[i]
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  background: c.bg, border: `1px solid ${c.border}50`,
                  borderRadius: 20, padding: '16px 20px', marginBottom: 14,
                  textAlign: 'center', width: 240,
                  animation: `podiumFadeIn 0.6s ease forwards`,
                  animationDelay: `${i * 0.2 + 0.4}s`, opacity: 0,
                  boxShadow: `0 0 32px ${c.border}20`,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{medals[i]}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: 58, fontWeight: 900, color: c.score, lineHeight: 1, marginTop: 8 }}>
                    {player.score}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    /{quiz.length} bonne{player.score > 1 ? 's' : ''} réponse{player.score > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{
                  width: 240, height: stepH[i],
                  background: c.fill, border: `2px solid ${c.border}`,
                  borderBottom: 'none', borderRadius: '16px 16px 0 0',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 24,
                  boxShadow: `0 0 55px ${c.border}22`,
                  animation: `podiumRise 0.9s ease forwards`,
                  animationDelay: `${i * 0.2}s`,
                }}>
                  <div style={{ fontSize: 62, fontWeight: 900, color: c.border, opacity: 0.45 }}>
                    #{ranks[i]}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {phraseRef.current && (
        <div style={{
          maxWidth: 720, textAlign: 'center', marginTop: 28, marginBottom: 4,
          fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
          fontStyle: 'italic', lineHeight: 1.5,
          animation: 'podiumFadeIn 0.8s ease 0.8s forwards', opacity: 0,
        }}>
          💬 {phraseRef.current}
        </div>
      )}

      <div style={{
        width: 760, height: 10,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        marginTop: 28, marginBottom: 8,
      }} />

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: 8 }}>
        En attente du formateur…
      </div>
    </div>
  )
}

// ── TV Quiz Rate Reveal ───────────────────────────────────────────
function TVQuizRateReveal({ sessionCode, moduleId, moduleLabel, quiz }) {
  const [rate, setRate]       = useState(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}&module_id=eq.${moduleId}`)
      .then(rows => {
        const data             = rows || []
        const correct          = data.filter(r => r.is_correct).length
        const participants     = new Set(data.map(r => r.collaborateur)).size
        const totalQ           = (quiz || []).length
        const totalPossible    = totalQ * participants
        const pct              = totalPossible > 0 ? Math.round((correct / totalPossible) * 100) : 0
        setTimeout(() => setRate(pct), 700)
      })
  }, [sessionCode, moduleId])

  useEffect(() => {
    if (rate === null) return
    let current = 0
    const steps    = 80
    const interval = 2000 / steps
    const t = setInterval(() => {
      current = Math.min(current + rate / steps, rate)
      setDisplay(Math.round(current))
      if (current >= rate) clearInterval(t)
    }, interval)
    return () => clearInterval(t)
  }, [rate])

  const R  = 210
  const C  = 2 * Math.PI * R
  const pct = rate !== null ? display : 0
  const dashoffset = C * (1 - pct / 100)
  const arcColor = pct >= 75 ? '#22c55e' : pct >= 50 ? '#00abe9' : '#f59e0b'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 35%, #021a3a 0%, #010d1f 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 52 }}>
        Taux de réussite — {moduleLabel}
      </div>

      <div style={{ position: 'relative', width: 500, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="500" height="500" viewBox="0 0 500 500" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <filter id="rateGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx="250" cy="250" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="24" />
          {/* Inner subtle ring */}
          <circle cx="250" cy="250" r={R - 35} fill="none" stroke={`${arcColor}10`} strokeWidth="50" />
          {/* Progress arc */}
          <circle
            cx="250" cy="250" r={R}
            fill="none"
            stroke={arcColor}
            strokeWidth="24"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 250 250)"
            filter="url(#rateGlow)"
            style={{ transition: `stroke-dashoffset ${2000 / 80}ms linear, stroke 0.4s ease` }}
          />
        </svg>
        {/* Texte centré */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 110, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -4 }}>
            {display}
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, color: arcColor, marginTop: -8 }}>%</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginTop: 10, fontWeight: 500 }}>
            de bonnes réponses
          </div>
        </div>
      </div>

      {rate !== null && (
        <div style={{
          marginTop: 36, fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
          textAlign: 'center', maxWidth: 600, lineHeight: 1.5,
          opacity: 1, animation: 'fadeInUp 0.6s ease both',
          fontStyle: 'italic',
        }}>
          {pct >= 80
            ? "L'optique n'a plus de secrets pour cette équipe — même les astigmates voient clair maintenant."
            : pct >= 60
              ? "Pas mal du tout ! Il reste quelques dioptries à peaufiner, mais les bases sont solides."
              : "On retient l'essentiel... et on revoit les ordonnances — c'est exactement pour ça qu'on est là !"}
        </div>
      )}

      <div style={{ display: 'flex', gap: 28, marginTop: 40 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain', opacity: 0.4 }} />
      </div>
    </div>
  )
}

// ── TV Group Results ──────────────────────────────────────────────
function TVGroupResults({ moduleId, moduleLabel, quiz, sessionCode }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(true)

  const toggleMute = () => {
    const newMuted = !muted
    if (audioRef.current) {
      audioRef.current.muted = newMuted
      if (!newMuted && audioRef.current.paused) {
        audioRef.current.play().catch(() => {})
      }
    }
    setMuted(newMuted)
  }

  useEffect(() => {
    const code = sessionCode || SESSION_CODE
    const query = `session_code=eq.${code}&module_id=eq.${moduleId}`
    const fetchAnswers = async () => {
      const rows = await sbSelect('quiz_answers', query)
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
    const interval = setInterval(async () => {
      const rows = await sbSelect('quiz_answers', query)
      setAnswers(rows || [])
    }, 3000)
    return () => clearInterval(interval)
  }, [moduleId, sessionCode])

  const participantCount = [...new Set((answers || []).map(r => r.collaborateur))].length

  const questionStats = (quiz || []).map((q, idx) => {
    const qAnswers = answers.filter(r => r.question_idx === idx)
    const wrongCount = qAnswers.filter(r => !r.is_correct).length
    const totalAnswers = qAnswers.length
    const pctWrong = totalAnswers > 0 ? Math.round((wrongCount / totalAnswers) * 100) : 0
    return { idx, question: q.question, pctWrong, totalAnswers }
  }).sort((a, b) => b.pctWrong - a.pctWrong)

  const getPriority = (pct) => {
    if (pct >= 50) return { icon: '🔴', label: 'À retravailler en priorité', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' }
    if (pct >= 25) return { icon: '🟡', label: 'À consolider', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' }
    return { icon: '🟢', label: 'Bien maîtrisé', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)' }
  }

  return (
    <div style={{
      height: '100vh', overflowY: 'auto',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '32px 64px 48px', position: 'relative',
    }}>
      <audio ref={audioRef} src="/audio/prettyjohn1-no-copyright-music-498106.mp3" autoPlay loop muted style={{ display: 'none' }} />
      <button onClick={toggleMute} style={{
        position: 'fixed', bottom: 24, right: 24,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.4)', borderRadius: 12,
        padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        {muted ? '🔇 Son coupé' : '🔊 Son actif'}
      </button>

      {/* Logo top-left */}
      <div style={{ position: 'absolute', top: 28, left: 40 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 40, paddingTop: 16 }}>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Bilan du quiz</h1>
        <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Points à retravailler en priorité</p>
      </div>

      {/* Question cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 20, padding: 60 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const priority = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{
              background: priority.bg,
              border: `1px solid ${priority.border}`,
              borderRadius: 24, padding: '24px 36px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ flex: 1, marginRight: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 24 }}>{priority.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: priority.color, textTransform: 'uppercase', letterSpacing: 1.2 }}>{priority.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                    Q{stat.idx + 1} — {stat.question}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 64, fontWeight: 900, color: priority.color, lineHeight: 1 }}>{stat.pctWrong}%</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>d'erreurs</div>
                </div>
              </div>
              <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6,
                  width: `${stat.pctWrong}%`,
                  background: priority.color,
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Participant count bottom */}
      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginRight: 8 }}>{participantCount}</span>
        participant{participantCount !== 1 ? 's' : ''} ont répondu
      </div>
    </div>
  )
}

// ── TV Troubles List avec avatar opticien ────────────────────────
function TVTroublesListVideo({ page, pageIndex, total, moduleLabel, troublesSelected, audioUnlocked }) {
  const [entered, setEntered] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (troublesSelected !== null && audioUnlocked) {
      v.play().catch(() => {})
    } else if (troublesSelected === null) {
      v.pause()
      v.currentTime = 0
    }
  }, [troublesSelected, audioUnlocked])

  const sel = troublesSelected !== null ? page.troubles[troublesSelected] : null

  // ── Mode focus : un trouble sélectionné ──
  if (sel) {
    return (
      <div style={{
        height: '100vh',
        background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Module · {moduleLabel}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2 }}>
            Les bases de l&apos;optique
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '38% 62%', overflow: 'hidden' }}>
          {/* Gauche — définition */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '28px 36px', gap: 20,
            background: `linear-gradient(160deg, ${sel.color}0a, transparent)`,
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{
              background: `${sel.color}14`,
              border: `2px solid ${sel.color}55`,
              borderLeft: `6px solid ${sel.color}`,
              borderRadius: 20, padding: '24px 28px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: sel.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
                {sel.num} — Trouble visuel
              </div>
              <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 18 }}>
                {sel.nom}
              </div>
              <div style={{ fontSize: 19, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                {sel.def}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {page.troubles.map((t, i) => i !== troublesSelected && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.22 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{t.nom}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Droite — bulle opticien */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${sel.color}12 0%, transparent 70%)`,
            position: 'relative',
          }}>
            {/* Halo derrière la bulle */}
            <div style={{
              position: 'absolute',
              width: 440, height: 440, borderRadius: '50%',
              background: `radial-gradient(circle, ${sel.color}22 0%, transparent 70%)`,
              filter: 'blur(32px)',
            }} />
            {/* Bulle vidéo */}
            <div style={{
              width: 400, height: 400, borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              border: `3px solid ${sel.color}80`,
              boxShadow: `0 0 0 6px ${sel.color}18, 0 0 60px ${sel.color}40`,
              position: 'relative', zIndex: 1,
            }}>
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoRef}
                key={sel.video}
                src={sel.video}
                preload="auto"
                playsInline
                muted={!audioUnlocked}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Mode liste : aucun trouble sélectionné ──
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 48px 32px', gap: 20,
        opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(16px)', transition: 'all .5s ease',
      }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Les bases de l&apos;optique</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{page.sousTitre}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {page.troubles.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 28,
              background: `${t.color}09`, border: `1px solid ${t.color}28`,
              borderLeft: `5px solid ${t.color}`,
              borderRadius: 16, padding: '22px 32px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.color, letterSpacing: 1, minWidth: 28, opacity: 0.75 }}>{t.num}</span>
              <span style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -0.3 }}>{t.nom}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Bouton plein écran ────────────────────────────────────────────
function FullscreenButton() {
  const [isFs, setIsFs] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isFs ? 'Quitter le plein écran' : 'Plein écran'}
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 1000,
        background: hovered ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 10, padding: '8px 12px',
        color: '#fff', fontSize: 18, cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all .2s',
        lineHeight: 1,
      }}
    >
      {isFs ? '⊠' : '⛶'}
    </button>
  )
}

// ── TV View ───────────────────────────────────────────────────────
export default function TVView() {
  const { activeModule, modulePage, sharedState, loading, sessionCode } = useModuleSync()
  const [tvScreen, setTvScreen]               = useState(null)
  const [troublesPhase, setTroublesPhase]       = useState(1)
  const [opticienPlaying, setOpticienPlaying]   = useState(false)
  const [troublesSelected, setTroublesSelected] = useState(null)
  const [ordoPlaying, setOrdoPlaying]         = useState(false)
  const [ordoRevealStep, setOrdoRevealStep]   = useState(1)
  const [audioUnlocked, setAudioUnlocked]     = useState(false)
  const [freinsResponses, setFreinsResponses]           = useState({})
  const [prixResponses, setPrixResponses]               = useState({})
  const [revealPrix, setRevealPrix]                     = useState(false)
  const [ventesResponses, setVentesResponses]           = useState({})
  const [revealVentes, setRevealVentes]                 = useState(false)
  const [promesseResponses, setPromesseResponses]       = useState({})
  const [planningDay, setPlanningDay]                   = useState(null)
  // Trame d'accueil
  const [trameStep, setTrameStep]                       = useState(null)
  // Offres 1=1
  const [offres11Step, setOffres11Step]                 = useState(0)
  const [offresClassiqueStep, setOffresClassiqueStep]   = useState(0)
  // Force LPT — point sélectionné par le formateur
  const [modelePoint, setModelePoint]                   = useState(null)
  // FAQ Réveil des acquis
  const [faqJournee, setFaqJournee]                     = useState(null)
  const [faqQuestions, setFaqQuestions]                 = useState([])
  // Progressif interactive state
  const [progZoneQ, setProgZoneQ]                       = useState(null)
  const [progZoneResponses, setProgZoneResponses]       = useState({})
  const [progZoneShowCorrect, setProgZoneShowCorrect]   = useState(false)
  const [progRetourResponses, setProgRetourResponses]   = useState({})
  const [progObjectionIdx, setProgObjectionIdx]         = useState(null)
  const [progObjectionResponses, setProgObjectionResponses] = useState({})
  const [progBestAnswer, setProgBestAnswer]             = useState(null)

  // Mutuelles Belgique
  const [mutuellesRevealed, setMutuellesRevealed]         = useState([])
  const [inamiRevealed, setInamiRevealed]                 = useState(false)
  const [partenaRevealed, setPartenaRevealed]             = useState(false)
  const [rembfrRevealed, setRembfrRevealed]               = useState([])

  // Quiz podium
  const [quizInterstitialPhase, setQuizInterstitialPhase] = useState(false)
  const [finalPodiumPhase, setFinalPodiumPhase]           = useState(false)
  const [rateRevealPhase,  setRateRevealPhase]            = useState(false)
  const [finalEndedPhase,  setFinalEndedPhase]            = useState(false)

  // ── Hydratation depuis sharedState (fourni par useModuleSync — 1 seul appel Supabase) ──
  useEffect(() => {
    if (!sharedState) return
    setTvScreen(sharedState.tv_screen || null)
    setTrameStep(sharedState.trame_step ?? null)
    setOffres11Step(sharedState.offres_11_step ?? 0)
    setOffresClassiqueStep(sharedState.offres_classique_step ?? 0)
    setModelePoint(sharedState.modele_point ?? null)
    setTroublesPhase(sharedState.troubles_phase || 1)
    setOpticienPlaying(!!sharedState.opticien_playing)
    setTroublesSelected(sharedState.troubles_selected ?? null)
    setOrdoPlaying(!!sharedState.ordo_playing)
    setOrdoRevealStep(sharedState.ordo_reveal_step ?? 1)
    setFreinsResponses(sharedState.freins_responses || {})
    setPrixResponses(sharedState.prix_responses || {})
    setRevealPrix(!!sharedState.reveal_prix)
    setVentesResponses(sharedState.ventes_responses || {})
    setRevealVentes(!!sharedState.reveal_ventes)
    setPromesseResponses(sharedState.promesse_responses || {})
    setPlanningDay(sharedState.planning_day || null)
    setProgZoneQ(sharedState.prog_zone_q ?? null)
    setProgZoneResponses(sharedState.prog_zone_responses || {})
    setProgZoneShowCorrect(!!sharedState.prog_zone_show_correct)
    setProgRetourResponses(sharedState.prog_retour_responses || {})
    setProgObjectionIdx(sharedState.prog_objection_idx ?? null)
    setProgObjectionResponses(sharedState.prog_objection_responses || {})
    setProgBestAnswer(sharedState.prog_best_answer || null)
    const fj = sharedState.faq_journee || null
    setFaqJournee(fj)
    setFaqQuestions(fj ? (sharedState[`faq_${fj}_q`] || []) : [])
    setMutuellesRevealed(sharedState.mutuelles_revealed || [])
    setInamiRevealed(!!sharedState.inami_revealed)
    setPartenaRevealed(!!sharedState.partena_revealed)
    setRembfrRevealed(sharedState.rembfr_revealed || [])
  }, [sharedState])

  const moduleData = MODULE_DATA[activeModule] || null
  const isLobby   = !!moduleData && modulePage === -1
  const isResults = !!moduleData && modulePage === 200
  const isQuiz    = !!moduleData && modulePage >= 100 && modulePage < 200

  // Podium interstitiel piloté par quiz_interstitial_q dans sharedState
  useEffect(() => {
    if (sharedState?.quiz_interstitial_q) setQuizInterstitialPhase(true)
    else setQuizInterstitialPhase(false)
  }, [sharedState?.quiz_interstitial_q])

  // Podium final — piloté par quiz_final_phase dans sharedState (formateur contrôle l'ordre)
  useEffect(() => {
    const phase = sharedState?.quiz_final_phase
    setFinalPodiumPhase(phase === 'podium')
    setRateRevealPhase(phase === 'rate')
    setFinalEndedPhase(phase === 'ended')
  }, [sharedState?.quiz_final_phase])

  let page = null
  let quizQuestion = null
  if (moduleData) {
    if (isQuiz) {
      const qIdx = modulePage - 100
      quizQuestion = moduleData.quiz[qIdx] || null
    } else if (!isResults && !isLobby) {
      page = moduleData.pages[modulePage] ?? null
    }
  }

  // Module actif mais inconnu du JS courant → rechargement pour obtenir le dernier bundle
  if (!loading && activeModule && !moduleData) {
    if (typeof window !== 'undefined') {
      const key = `tv_reload_for_${activeModule}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
      }
    }
    return null
  }

  // Mini jeu actif — seulement si aucun module n'est en cours
  const mjPhase = sharedState?.minijeu_phase
  if (!loading && !activeModule && mjPhase && mjPhase !== 'idle') {
    if (mjPhase === 'rules') {
      return (
        <>
          <style>{STYLES}</style>
          <FullscreenButton />
          <TVMiniJeuRules />
        </>
      )
    }
    if (['game_ready', 'spinning', 'vendeur', 'client', 'revealed'].includes(mjPhase)) {
      return (
        <>
          <style>{STYLES}</style>
          <FullscreenButton />
          <TVMiniJeuGame
            mjPhase={mjPhase}
            vendeur={sharedState.minijeu_vendeur}
            client={sharedState.minijeu_client}
            theme={sharedState.minijeu_theme}
          />
        </>
      )
    }
  }

  // Pas de module actif → écran selon tv_screen ou FAQ
  if (!loading && !activeModule && !isLobby) {
    return (
      <>
        <style>{STYLES}</style>
        <FullscreenButton />
        <div style={{ height: '100dvh', overflow: 'hidden', position: 'relative' }}>
          {faqJournee
            ? <TVFAQView journeeId={faqJournee} questions={faqQuestions} />
            : tvScreen === 'planning'
              ? <TVPlanningScreen planningDay={planningDay} />
              : tvScreen === 'qr'
                ? <WaitingScreen roomCode={sessionCode} />
                : <WelcomeScreen />
          }
        </div>
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>

      <FullscreenButton />

      {/* Bouton d'activation du son — à cliquer une fois au démarrage de la TV */}
      {!audioUnlocked && (
        <div
          onClick={() => setAudioUnlocked(true)}
          style={{
            position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 999, cursor: 'pointer',
            background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 24, padding: '10px 22px',
            display: 'flex', alignItems: 'center', gap: 8,
            color: '#fff', fontSize: 14, fontWeight: 600,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <span>🔊</span>
          <span>Activer le son</span>
        </div>
      )}

      <div style={{ height: '100dvh', overflow: 'hidden', position: 'relative' }}>
        {loading ? (
          <WelcomeScreen />
        ) : isLobby ? (
          <TVModuleLobby moduleLabel={moduleData?.label || ''} moduleSub={moduleData?.sub || ''} />
        ) : isResults ? (
          finalEndedPhase
            ? <WelcomeScreen />
            : finalPodiumPhase
              ? <TVQuizFinalPodium quiz={moduleData?.quiz || []} sessionCode={sessionCode} />
              : rateRevealPhase
                ? <TVQuizRateReveal sessionCode={sessionCode} moduleId={activeModule} moduleLabel={moduleData?.label || ''} quiz={moduleData?.quiz || []} />
                : <TVGroupResults moduleId={activeModule} moduleLabel={moduleData?.label || ''} quiz={moduleData?.quiz || []} sessionCode={sessionCode} />
        ) : isQuiz && quizQuestion ? (
          quizInterstitialPhase
            ? <TVQuizPodium qIdx={modulePage - 100} onDone={() => setQuizInterstitialPhase(false)} sessionCode={sessionCode} skipSignal={sharedState?.quiz_podium_skip} />
            : sharedState?.quiz_show_correction
              ? <TVQuizCorrection
                  question={quizQuestion}
                  qIdx={modulePage - 100}
                  total={moduleData.quiz.length}
                  moduleLabel={moduleData?.label || ''}
                  sessionCode={sessionCode}
                />
              : <TVQuizQuestion
                  question={quizQuestion}
                  qIdx={modulePage - 100}
                  total={moduleData.quiz.length}
                  moduleLabel={moduleData?.label || ''}
                />
        ) : page ? (
          <TVContentPage
            page={page}
            pageIndex={modulePage}
            total={moduleData.pages.length}
            moduleLabel={moduleData?.label || ''}
            troublesPhase={troublesPhase}
            opticienPlaying={opticienPlaying}
            troublesSelected={troublesSelected}
            ordoPlaying={ordoPlaying}
            ordoRevealStep={ordoRevealStep}
            audioUnlocked={audioUnlocked}
            freinsResponses={freinsResponses}
            prixResponses={prixResponses}
            revealPrix={revealPrix}
            ventesResponses={ventesResponses}
            revealVentes={revealVentes}
            promesseResponses={promesseResponses}
            progZoneQ={progZoneQ}
            progZoneResponses={progZoneResponses}
            progZoneShowCorrect={progZoneShowCorrect}
            progRetourResponses={progRetourResponses}
            progObjectionIdx={progObjectionIdx}
            progObjectionResponses={progObjectionResponses}
            progBestAnswer={progBestAnswer}
            trameStep={trameStep}
            offres11Step={offres11Step}
            offresClassiqueStep={offresClassiqueStep}
            modelePoint={modelePoint}
            mutuellesRevealed={mutuellesRevealed}
            inamiRevealed={inamiRevealed}
            partenaRevealed={partenaRevealed}
            rembfrRevealed={rembfrRevealed}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>
    </>
  )
}
