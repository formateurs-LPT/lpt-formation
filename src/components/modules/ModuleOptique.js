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
  @keyframes chipIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .frise-chips { -ms-overflow-style: none; scrollbar-width: none; }
  .frise-chips::-webkit-scrollbar { display: none; }
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

// ── Frise des corrections ─────────────────────────────────────────
const FRISE_NEG = Array.from({ length: 32 }, (_, i) => (i + 1) * 0.25) // −0,25 → −8,00
const FRISE_POS = Array.from({ length: 29 }, (_, i) => (i + 1) * 0.25) // +0,25 → +7,25
const fFmt = (v) => v.toFixed(2).replace('.', ',')
const OPT_PLAN_W = 96  // largeur colonne Plan (fixe, ne scrolle pas)
const OPT_ROW_H  = 46  // hauteur fixe des rangées de chips

// ── Page 2 : Frise horizontale ±8,00 ─────────────────────────────
function CorrectionScalePage({ page, trainerAvatar, pName, onBack, pageIndex, total, onNext, isLast }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    let s = 0; let tid
    const next = () => {
      s++
      if (s > FRISE_NEG.length) return
      setStep(s)
      tid = setTimeout(next, 90)
    }
    tid = setTimeout(next, 500)
    return () => clearTimeout(tid)
  }, [page.id])

  const negVisible = FRISE_NEG.slice(0, step)
  const posVisible = FRISE_POS.slice(0, step)
  const optChip = {
    padding: '8px 13px', borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    animation: 'chipIn 0.2s ease',
    fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
    fontVariantNumeric: 'tabular-nums',
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · Les bases de l&apos;optique</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 48px 100px' }}>

        {/* Titre */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Les bases de l&apos;optique</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 4 }}>{page.titre}</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{page.sousTitre}</p>
        </div>

        {/* Frise — négatifs */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ width: OPT_PLAN_W, flexShrink: 0 }} />
          <div className="frise-chips" style={{ flex: 1, minWidth: 0, overflowX: 'scroll', touchAction: 'pan-x' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 5, padding: '4px 0', width: 'max-content' }}>
              {negVisible.map((v, i) => <div key={i} style={optChip}>−{fFmt(v)}</div>)}
            </div>
          </div>
        </div>

        {/* Frise — axe Plan */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: OPT_PLAN_W, flexShrink: 0, paddingRight: 18 }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#00abe9', lineHeight: 1 }}>Plan</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>0,00</div>
          </div>
          <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.22)', borderRadius: 1 }} />
        </div>

        {/* Frise — positifs */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
          <div style={{ width: OPT_PLAN_W, flexShrink: 0 }} />
          <div className="frise-chips" style={{ flex: 1, minWidth: 0, overflowX: 'scroll', touchAction: 'pan-x' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 5, padding: '4px 0', width: 'max-content' }}>
              {posVisible.map((v, i) => <div key={i} style={optChip}>+{fFmt(v)}</div>)}
            </div>
          </div>
        </div>

        {/* Encart clé */}
        <div style={{
          marginTop: 40,
          padding: '28px 40px',
          borderRadius: 20,
          background: 'rgba(0,171,233,0.07)',
          border: '1px solid rgba(0,171,233,0.22)',
          display: 'flex', alignItems: 'center', gap: 24,
        }}>
          <span style={{ fontSize: 36, lineHeight: 1, flexShrink: 0 }}>⚡</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>À retenir</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Fabrication en 10 minutes
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '16px 360px 24px 48px', background: 'linear-gradient(0deg, rgba(3,17,42,0.95) 0%, transparent 100%)', zIndex: 20 }}>
        {isLast ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>Suite du module en construction…</span>
            <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)', color: '#ff6b6b', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Terminer →</button>
          </div>
        ) : (
          <button onClick={onNext} style={{ background: 'linear-gradient(135deg, #0066a0, #00abe9)', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,171,233,0.45)', fontFamily: 'inherit' }}>Suivant →</button>
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
