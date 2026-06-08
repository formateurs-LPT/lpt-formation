'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA, ORD_COLS, ORD_EXAMPLE, SAISIE_EXERCISES } from '@/lib/modulesData'
import { sbSelect, SESSION_CODE, getSharedState, setSharedState } from '@/lib/supabase'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── Keyframes ─────────────────────────────────────────────────────
const STYLES = `
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
`

// ── Verre animé ───────────────────────────────────────────────────
function VerreAnime({ color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 520, height: 520, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}35 0%, transparent 70%)`,
        animation: 'haloPulse 3.5s ease-in-out infinite',
      }} />
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
      <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <Image
          src={src}
          alt="Module illustration"
          width={480}
          height={480}
          style={{
            objectFit: 'contain',
            borderRadius: 24,
            boxShadow: `0 0 64px ${color}60, 0 24px 48px rgba(0,0,0,0.4)`,
          }}
          priority
        />
      </div>
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
            <div style={{ fontSize: 20, fontWeight: 800, color: '#00abe9', lineHeight: 1 }}>Plan</div>
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
function TVOrdonnance({ page, pageIndex, total, moduleLabel, ordoPlaying, audioUnlocked }) {
  const [step, setStep] = useState(0)
  const videoRef = useRef(null)

  useEffect(() => {
    setStep(0)
    const T = [400, 1000, 1600, 2800, 3200, 3500, 3800, 4200, 4500, 4800, 5300]
    const timers = T.map((t, i) => setTimeout(() => setStep(s => Math.max(s, i + 1)), t))
    return () => timers.forEach(clearTimeout)
  }, [page.id])

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

  const show = (n) => step >= n
  const cellVis = (row, col) => show(row === 0 ? 5 + col : 8 + col)

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

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 56px 48px', gap: 32 }}>

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
              opacity: show(i + 1) ? 1 : 0,
              transform: show(i + 1) ? 'translateY(0)' : 'translateY(20px)',
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
          opacity: show(4) ? 1 : 0,
          transform: show(4) ? 'translateY(0)' : 'translateY(16px)',
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
                  opacity: cellVis(0, ci) ? 1 : 0, transform: cellVis(0, ci) ? 'translateX(0)' : 'translateX(-12px)', transition: 'all 0.35s ease',
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
                  opacity: cellVis(1, ci) ? 1 : 0, transform: cellVis(1, ci) ? 'translateX(0)' : 'translateX(-12px)', transition: 'all 0.35s ease',
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
            opacity: show(11) ? 1 : 0, transform: show(11) ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s ease',
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1.5 }}>Addition</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.add}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>Correction presbytie</div>
          </div>
        </div>
      </div>

      {/* Cercle avatar opticien — en dehors de toute div à opacité variable */}
      <div style={{ position: 'absolute', bottom: 28, right: 28, zIndex: 10 }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%', overflow: 'hidden',
          border: `4px solid ${ordoPlaying ? 'rgba(34,197,94,0.7)' : 'rgba(0,171,233,0.5)'}`,
          boxShadow: `0 8px 48px ${ordoPlaying ? 'rgba(34,197,94,0.4)' : 'rgba(0,171,233,0.3)'}`,
          background: '#03112a',
          transition: 'border-color .3s, box-shadow .3s',
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

function TVEntrepriseFreins({ page, pageIndex, total, freinsResponses }) {
  const entries = Object.entries(freinsResponses || {})

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Présentation de l&apos;entreprise</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ textAlign: 'center', padding: '28px 160px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>
          Question ouverte
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>
          {page.titre}
        </h1>
        {entries.length === 0 && (
          <div style={{ marginTop: 28, fontSize: 16, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
            En attente des réponses…
          </div>
        )}
      </div>

      {/* Bulles anonymes flottantes */}
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          position: 'absolute',
          left: `${resp.x}%`,
          top: `${resp.y}%`,
          maxWidth: 300,
          background: 'rgba(5,20,55,0.88)',
          border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: 22,
          padding: '14px 22px',
          fontSize: 17,
          fontWeight: 600,
          color: '#fff',
          lineHeight: 1.45,
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}30`,
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          zIndex: 5,
        }}>
          {resp.text}
        </div>
      ))}
    </div>
  )
}

// ── TV Entreprise : prix moyen ────────────────────────────────────
function TVEntreprisePrix({ page, pageIndex, total, prixResponses }) {
  const entries = Object.entries(prixResponses || {})

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Présentation de l&apos;entreprise</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#f59e0b' : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ textAlign: 'center', padding: '28px 160px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>
          Question ouverte
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>
          {page.titre}
        </h1>
        {entries.length === 0 && (
          <div style={{ marginTop: 28, fontSize: 16, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
            En attente des réponses…
          </div>
        )}
      </div>

      {/* Bulles anonymes */}
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          position: 'absolute',
          left: `${resp.x}%`,
          top: `${resp.y}%`,
          background: 'rgba(5,20,55,0.88)',
          border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: 22,
          padding: '14px 24px',
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          zIndex: 5,
          display: 'flex', alignItems: 'baseline', gap: 4,
        }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>{resp.text}</span>
        </div>
      ))}
    </div>
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
            background: `${stat.color}12`,
            border: `2px solid ${stat.color}40`,
            borderRadius: 20, padding: '28px 24px',
            textAlign: 'center',
            opacity: i < visible ? 1 : 0,
            transform: i < visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            boxShadow: i < visible ? `0 8px 32px ${stat.color}20` : 'none',
          }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{stat.emoji}</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: stat.color, lineHeight: 1.1, marginBottom: 8 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500, lineHeight: 1.4 }}>
              {stat.label}
            </div>
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

// ── TV Content Page (no controls, no avatar) ──────────────────────
function TVContentPage({ page, pageIndex, total, moduleLabel, troublesPhase, opticienPlaying, audioUnlocked, ordoPlaying, freinsResponses, prixResponses }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  if (page.type === 'troubles-intro')    return <TVTroublesIntro      page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'troubles-list')     return <TVTroublesListVideo  page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} troublesPhase={troublesPhase} opticienPlaying={opticienPlaying} audioUnlocked={audioUnlocked} />
  if (page.type === 'correction-scale') return <TVCorrectionScale    page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'ordonnance')        return <TVOrdonnance         page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} ordoPlaying={ordoPlaying} audioUnlocked={audioUnlocked} />
  if (page.type === 'pause')             return <TVPause              page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'saisie-interactive') return <TVSaisieInteractive page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />

  // Entreprise module types — tous dispatchés pour éviter le VerreAnime
  if (page.type === 'freins')     return <TVEntrepriseFreins   page={page} pageIndex={pageIndex} total={total} freinsResponses={freinsResponses} />
  if (page.type === 'prix')       return <TVEntreprisePrix     page={page} pageIndex={pageIndex} total={total} prixResponses={prixResponses} />
  if (page.type === 'video-lpt')  return <TVVideoLPT audioUnlocked={audioUnlocked} />
  if (page.type === 'chiffres')   return <TVEntrepriseChiffres  page={page} pageIndex={pageIndex} total={total} />
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

// ── Waiting Screen ────────────────────────────────────────────────
const APP_URL = 'https://lpt-formation.vercel.app?join=1'
// ── Écran de bienvenue (avant le QR) ──────────────────────────────
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

const QR_URL  = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=ffffff&bgcolor=0a2a5c&data=${encodeURIComponent(APP_URL)}`

function WaitingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={300} height={114}
        style={{ objectFit: 'contain', marginBottom: 52, animation: 'logoBreathe 3.5s ease-in-out infinite' }} />

      {/* QR + instructions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 56,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28, padding: '36px 48px',
      }}>
        {/* QR Code */}
        <div style={{
          background: '#0a2a5c', borderRadius: 18, padding: 12,
          border: '2px solid rgba(0,171,233,0.35)',
          boxShadow: '0 0 40px rgba(0,171,233,0.15)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={QR_URL} alt="QR Code" width={220} height={220}
            style={{ display: 'block', borderRadius: 8 }} />
        </div>

        {/* Texte */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#00abe9',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14,
          }}>Rejoindre la formation</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
            Scannez ce QR code<br />avec votre téléphone
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
            Connectez-vous avec votre prénom et<br />le code de session communiqué<br />par votre formateur.
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

// ── TV Group Results ──────────────────────────────────────────────
function TVGroupResults({ moduleId, moduleLabel, quiz }) {
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
    const fetchAnswers = async () => {
      const rows = await sbSelect('quiz_answers', `session_code=eq.${SESSION_CODE}`)
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
    const interval = setInterval(async () => {
      const rows = await sbSelect('quiz_answers', `session_code=eq.${SESSION_CODE}`)
      setAnswers(rows || [])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

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
      minHeight: '100vh',
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
function TVTroublesListVideo({ page, pageIndex, total, moduleLabel, troublesPhase, opticienPlaying, audioUnlocked }) {
  const [entered, setEntered]   = useState(false)
  const [defVisible, setDefVisible] = useState(0)
  const videoRef = useRef(null)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  // Stagger des définitions quand phase 2
  useEffect(() => {
    if (troublesPhase !== 2) { setDefVisible(0); return }
    const timers = page.troubles.map((_, i) =>
      setTimeout(() => setDefVisible(c => Math.max(c, i + 1)), 500 + i * 900)
    )
    return () => timers.forEach(clearTimeout)
  }, [troublesPhase])

  // Contrôle play/pause — attend que l'audio soit débloqué (clic overlay)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (opticienPlaying && audioUnlocked) {
      v.play().catch(() => {})
    } else if (!opticienPlaying) {
      v.pause()
    }
  }, [opticienPlaying, audioUnlocked])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
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

      {/* Zone principale */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 48px 32px', gap: 20,
        opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(16px)', transition: 'all .5s ease',
      }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Les bases de l&apos;optique</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{page.sousTitre}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {page.troubles.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 24,
              background: `${t.color}09`, border: `1px solid ${t.color}28`,
              borderLeft: `4px solid ${t.color}`,
              borderRadius: 16, padding: '18px 28px',
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: t.color, letterSpacing: 1, minWidth: 26, opacity: 0.75 }}>{t.num}</span>
              <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', minWidth: 240, letterSpacing: -0.3 }}>{t.nom}</span>
              <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <span style={{
                fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5,
                opacity: troublesPhase === 2 && i < defVisible ? 1 : 0,
                transform: troublesPhase === 2 && i < defVisible ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                minHeight: 24,
              }}>{t.def}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Cercle avatar opticien */}
      <div style={{ position: 'absolute', bottom: 28, right: 28, zIndex: 10 }}>
        <div style={{
          width: 200, height: 200, borderRadius: '50%', overflow: 'hidden',
          border: `4px solid ${opticienPlaying ? 'rgba(34,197,94,0.7)' : 'rgba(0,171,233,0.5)'}`,
          boxShadow: `0 8px 48px ${opticienPlaying ? 'rgba(34,197,94,0.4)' : 'rgba(0,171,233,0.3)'}`,
          background: '#03112a',
          transition: 'border-color .3s, box-shadow .3s',
        }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            src="/assets/Problèmes_de_vue_Audio_OK.mp4"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            playsInline
            preload="auto"
          />
        </div>
      </div>
    </div>
  )
}

// ── TV View ───────────────────────────────────────────────────────
export default function TVView() {
  const { activeModule, modulePage, loading } = useModuleSync(1500)
  const [tvScreen, setTvScreen]               = useState(null)
  const [troublesPhase, setTroublesPhase]     = useState(1)
  const [opticienPlaying, setOpticienPlaying] = useState(false)
  const [ordoPlaying, setOrdoPlaying]         = useState(false)
  const [audioUnlocked, setAudioUnlocked]     = useState(false)
  const [freinsResponses, setFreinsResponses] = useState({})
  const [prixResponses, setPrixResponses]     = useState({})

  // À l'ouverture de la TV : remet tv_screen à null pour toujours afficher la bienvenue
  useEffect(() => {
    getSharedState().then(state => {
      if (state?.tv_screen) {
        setSharedState({ tv_screen: null }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    const poll = async () => {
      try {
        const state = await getSharedState()
        setTvScreen(state?.tv_screen || null)
        setTroublesPhase(state?.troubles_phase || 1)
        setOpticienPlaying(!!state?.opticien_playing)
        setOrdoPlaying(!!state?.ordo_playing)
        setFreinsResponses(state?.freins_responses || {})
        setPrixResponses(state?.prix_responses || {})
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [])

  const moduleData = MODULE_DATA[activeModule] || null
  const isLobby   = !!moduleData && modulePage === -1
  const isResults = !!moduleData && modulePage === 200
  const isQuiz    = !!moduleData && modulePage >= 100 && modulePage < 200

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

  // Pas de module actif → écran selon tv_screen
  if (!loading && !activeModule && !isLobby) {
    return (
      <>
        <style>{STYLES}</style>
        {tvScreen === 'qr' ? <WaitingScreen /> : <WelcomeScreen />}
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>

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

      {loading ? (
        <WelcomeScreen />
      ) : isLobby ? (
        <TVModuleLobby moduleLabel={moduleData?.label || ''} moduleSub={moduleData?.sub || ''} />
      ) : isResults ? (
        <TVGroupResults moduleId={activeModule} moduleLabel={moduleData?.label || ''} quiz={moduleData?.quiz || []} />
      ) : isQuiz && quizQuestion ? (
        <TVQuizQuestion
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
          ordoPlaying={ordoPlaying}
          audioUnlocked={audioUnlocked}
          freinsResponses={freinsResponses}
          prixResponses={prixResponses}
        />
      ) : (
        <WelcomeScreen />
      )}
    </>
  )
}
