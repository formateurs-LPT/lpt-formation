'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA, ORD_COLS, ORD_EXAMPLE } from '@/lib/modulesData'
import { sbSelect, SESSION_CODE } from '@/lib/supabase'

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
        <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
function TVOrdonnance({ page, pageIndex, total, moduleLabel }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    const T = [400, 1000, 1600, 2800, 3200, 3500, 3800, 4200, 4500, 4800, 5300]
    const timers = T.map((t, i) => setTimeout(() => setStep(s => Math.max(s, i + 1)), t))
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  const show = (n) => step >= n
  const cellVis = (row, col) => show(row === 0 ? 5 + col : 8 + col)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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

// ── TV Content Page (no controls, no avatar) ──────────────────────
function TVContentPage({ page, pageIndex, total, moduleLabel }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  if (page.type === 'troubles-intro')   return <TVTroublesIntro   page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'troubles-list')    return <TVTroublesList    page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'correction-scale') return <TVCorrectionScale  page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'ordonnance')        return <TVOrdonnance        page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'pause')             return <TVPause             page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />

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
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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

// ── Waiting Screen ────────────────────────────────────────────────
const APP_URL = 'https://lpt-formation.vercel.app?join=1'
const QR_URL  = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=ffffff&bgcolor=0a2a5c&data=${encodeURIComponent(APP_URL)}`

function WaitingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      <Image src="/assets/logo-lpt.png" alt="LPT" width={300} height={114}
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
        <Image src="/assets/logo-lpt.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
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

// ── TV View ───────────────────────────────────────────────────────
export default function TVView() {
  const { activeModule, modulePage, loading } = useModuleSync(1500)

  const moduleData = MODULE_DATA[activeModule] || null
  const isResults = !!moduleData && modulePage === 200
  const isQuiz = !!moduleData && modulePage >= 100 && modulePage < 200

  let page = null
  let quizQuestion = null
  if (moduleData) {
    if (isQuiz) {
      const qIdx = modulePage - 100
      quizQuestion = moduleData.quiz[qIdx] || null
    } else if (!isResults) {
      page = moduleData.pages[modulePage] ?? null
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      {loading ? (
        <WaitingScreen />
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
        />
      ) : (
        <WaitingScreen />
      )}
    </>
  )
}
