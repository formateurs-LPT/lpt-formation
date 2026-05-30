'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, SESSION_CODE } from '@/lib/supabase'
import { OPTIQUE_PAGES as PAGES } from '@/lib/modulesData'
import { TRAINER_AVATARS } from '@/lib/constants'

const STYLES = `
  @keyframes optiqueHalo {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(1.12); }
  }
  @keyframes optiqueAvatar {
    0%, 100% { box-shadow: 0 4px 20px rgba(0,171,233,0.35); }
    50%       { box-shadow: 0 4px 36px rgba(0,171,233,0.8); }
  }
`

// ── Avatar formateur ──────────────────────────────────────────────
function AvatarBubble({ script, trainerAvatar, pName }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [script])

  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Formateur'

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
        fontSize: 13, color: '#0f172a', lineHeight: 1.6, fontWeight: 500,
        marginBottom: 12,
      }}>{script}</div>

      <div style={{
        background: 'rgba(10,42,92,0.75)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,171,233,0.3)', borderRadius: 20,
        padding: '12px 18px 12px 12px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0,
          border: '2.5px solid #00abe9',
          boxShadow: '0 0 0 4px rgba(0,171,233,0.2)',
          animation: 'optiqueAvatar 2.5s ease-in-out infinite',
        }}>
          <Image src={trainerAvatar} alt={cap(pName)} width={80} height={80}
            style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{cap(pName)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Formateur · LPT</div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
            background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.3)',
            borderRadius: 20, padding: '3px 10px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00abe9', animation: 'optiqueHalo 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', letterSpacing: .5 }}>EN DIRECT</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page troubles visuels ─────────────────────────────────────────
function TroublesPage({ page, trainerAvatar, pName, onBack, pageIndex, total, onNext, isLast }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    const timers = page.troubles.map((_, i) =>
      setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), 250 + i * 220)
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
            Module · Les bases de l&apos;optique
          </span>
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
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 48px 100px', gap: 28 }}>

        {/* Titre */}
        <div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 11, fontWeight: 700, color: '#00abe9',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12,
          }}>Les bases de l&apos;optique</div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 6, margin: 0 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginTop: 8 }}>
            {page.sousTitre}
          </p>
        </div>

        {/* Liste des troubles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {page.troubles.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 24,
              background: i < visibleCount ? `${t.color}09` : 'transparent',
              border: `1px solid ${i < visibleCount ? t.color + '28' : 'transparent'}`,
              borderLeft: `4px solid ${i < visibleCount ? t.color : 'transparent'}`,
              borderRadius: 16, padding: '20px 28px',
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'translateX(0)' : 'translateX(-28px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              {/* Numéro */}
              <span style={{ fontSize: 12, fontWeight: 800, color: t.color, letterSpacing: 1, minWidth: 26, opacity: 0.75 }}>
                {t.num}
              </span>
              {/* Nom */}
              <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', minWidth: 220, letterSpacing: -0.3 }}>
                {t.nom}
              </span>
              {/* Séparateur */}
              <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              {/* Définition */}
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5, fontWeight: 400 }}>
                {t.def}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Boutons navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        padding: '16px 360px 24px 48px',
        background: 'linear-gradient(0deg, rgba(3,17,42,0.95) 0%, transparent 100%)',
        zIndex: 20,
      }}>
        {isLast ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              Suite du module en construction…
            </span>
            <button onClick={onBack} style={{
              background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)',
              color: '#ff6b6b', padding: '12px 24px', borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Terminer →</button>
          </div>
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #0066a0, #00abe9)',
            border: 'none', color: '#fff',
            padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,171,233,0.45)',
            fontFamily: 'inherit',
          }}>Suivant →</button>
        )}
      </div>

      <AvatarBubble script={page.avatarScript} trainerAvatar={trainerAvatar} pName={pName} />
    </div>
  )
}

// ── Helpers échelle ──────────────────────────────────────────────
const NEG_VALUES = Array.from({ length: 24 }, (_, i) => -((i + 1) * 0.25))
const POS_VALUES = Array.from({ length: 24 }, (_, i) => (i + 1) * 0.25)
const scaleColor = (v) => {
  const a = Math.abs(v)
  if (a <= 1.00) return '#22c55e'
  if (a <= 3.00) return '#f59e0b'
  return '#ef4444'
}
const scaleFmt = (v) => {
  const s = v > 0 ? '+' : ''
  return s + Math.abs(v).toFixed(2).replace('.', ',')
}

// ── Page 2 : Échelle de corrections ──────────────────────────────
function CorrectionScalePage({ page, trainerAvatar, pName, onBack, pageIndex, total, onNext, isLast }) {
  const [steps, setSteps] = useState(0)

  useEffect(() => {
    setSteps(0)
    let s = 0
    const id = setInterval(() => {
      s++
      setSteps(s)
      if (s >= 24) clearInterval(id)
    }, 110)
    return () => clearInterval(id)
  }, [page.id])

  const ROW_H = 22

  const ScaleCol = ({ values, side }) => (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase', letterSpacing: 1,
        textAlign: 'center', marginBottom: 8,
      }}>
        {side === 'neg' ? '← Myopie · Astigmatisme' : 'Hypermétropie · Presbytie →'}
      </div>
      {values.map((v, i) => {
        const visible = steps > i
        const color = scaleColor(v)
        const barPct = Math.abs(v) / 6 * 100
        const showSep = Math.abs(v) === 1.25 || Math.abs(v) === 3.25
        return (
          <div key={i}>
            {showSep && (
              <div style={{ height: 1, background: `${color}35`, margin: '3px 0' }} />
            )}
            <div style={{
              display: 'flex', alignItems: 'center', height: ROW_H, gap: 8,
              opacity: visible ? 1 : 0,
              transition: 'opacity 0.25s ease',
              flexDirection: side === 'neg' ? 'row' : 'row',
            }}>
              {side === 'neg' ? (
                <>
                  <span style={{
                    width: 52, textAlign: 'right', fontSize: 11, color,
                    fontWeight: 600, letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums',
                  }}>{scaleFmt(v)}</span>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0,
                      width: visible ? `${barPct}%` : '0%',
                      background: `linear-gradient(to left, ${color}, ${color}70)`,
                      borderRadius: 2, transition: 'width 0.35s ease',
                    }} />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: visible ? `${barPct}%` : '0%',
                      background: `linear-gradient(to right, ${color}70, ${color})`,
                      borderRadius: 2, transition: 'width 0.35s ease',
                    }} />
                  </div>
                  <span style={{
                    width: 52, textAlign: 'left', fontSize: 11, color,
                    fontWeight: 600, letterSpacing: 0.3, fontVariantNumeric: 'tabular-nums',
                  }}>{scaleFmt(v)}</span>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', flexShrink: 0, position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
            Module · Les bases de l&apos;optique
          </span>
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
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 48px 100px', gap: 16 }}>
        {/* Titre */}
        <div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)',
            borderRadius: 20, padding: '4px 14px',
            fontSize: 11, fontWeight: 700, color: '#00abe9',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
          }}>Les bases de l&apos;optique</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 4 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            {page.sousTitre}
          </p>
        </div>

        {/* Rangée 0,00 Plan */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20,
          height: 48, borderRadius: 14,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
        }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>0,00</span>
          <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Plan</span>
        </div>

        {/* Deux colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: '0 20px', flex: 1 }}>
          <ScaleCol values={NEG_VALUES} side="neg" />
          <div style={{ background: 'rgba(255,255,255,0.07)' }} />
          <ScaleCol values={POS_VALUES} side="pos" />
        </div>

        {/* Légende */}
        <div style={{
          display: 'flex', gap: 24, justifyContent: 'center',
          padding: '10px 20px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10,
        }}>
          <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>● Légère (0,25 → 1,00)</span>
          <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>● Modérée (1,25 → 3,00)</span>
          <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 600 }}>● Forte (3,25 et +)</span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        padding: '16px 360px 24px 48px',
        background: 'linear-gradient(0deg, rgba(3,17,42,0.95) 0%, transparent 100%)',
        zIndex: 20,
      }}>
        {isLast ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              Suite du module en construction…
            </span>
            <button onClick={onBack} style={{
              background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)',
              color: '#ff6b6b', padding: '12px 24px', borderRadius: 12,
              fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Terminer →</button>
          </div>
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #0066a0, #00abe9)',
            border: 'none', color: '#fff',
            padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,171,233,0.45)',
            fontFamily: 'inherit',
          }}>Suivant →</button>
        )}
      </div>

      <AvatarBubble script={page.avatarScript} trainerAvatar={trainerAvatar} pName={pName} />
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function ModuleOptique({ pName, onBack }) {
  const [pageIndex, setPageIndex] = useState(0)

  const trainerAvatar = TRAINER_AVATARS[(pName || '').toLowerCase()] || TRAINER_AVATARS.kevin

  // Sync Supabase à chaque changement de page
  useEffect(() => {
    sbUpdate('sessions', { active_module: 'optique', module_page: pageIndex }, `code=eq.${SESSION_CODE}`)
  }, [pageIndex])

  const handleBack = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${SESSION_CODE}`)
    onBack()
  }

  const page = PAGES[pageIndex]
  const navProps = {
    trainerAvatar,
    pName,
    onBack: handleBack,
    pageIndex,
    total: PAGES.length,
    onNext: () => setPageIndex(i => Math.min(i + 1, PAGES.length - 1)),
    isLast: pageIndex === PAGES.length - 1,
  }

  return (
    <>
      <style>{STYLES}</style>
      {page.type === 'troubles-list'   && <TroublesPage       page={page} {...navProps} />}
      {page.type === 'correction-scale' && <CorrectionScalePage page={page} {...navProps} />}
    </>
  )
}
