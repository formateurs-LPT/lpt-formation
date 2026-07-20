'use client'
// fix: getActiveSessionCode pour sync TV
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, sbSelect, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { OPTIQUE_PAGES as PAGES, ORD_COLS, ORD_EXAMPLE, SAISIE_EXERCISES, OPTIQUE_QUIZ } from '@/lib/modulesData'
import { TRAINER_AVATARS } from '@/lib/constants'
import { NextPagePreview } from '@/lib/trainerPreview'
import { useIsMobile } from '@/lib/useIsMobile'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

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

// ── NavBar partagée (formateur) ───────────────────────────────────
function TrainerNav({ onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, quizLaunched, onLaunchQuiz, nextLabel, nextPage }) {
  const isMobile = useIsMobile()
  const pad = isMobile ? '10px 14px calc(env(safe-area-inset-bottom,0px) + 16px)' : '10px 360px 16px 48px'
  const btnPrev = isMobile
    ? { flex: 1, padding: '16px 0', fontSize: 16, borderRadius: 12 }
    : { padding: '12px 28px', borderRadius: 12, fontSize: 14 }
  const btnNext = isMobile
    ? { flex: 2, padding: '16px 0', fontSize: 16, borderRadius: 12 }
    : { padding: '12px 32px', borderRadius: 12, fontSize: 15 }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      padding: pad,
      background: 'linear-gradient(0deg, rgba(3,17,42,0.98) 0%, rgba(3,17,42,0.6) 100%)',
      zIndex: 20,
    }}>
      {!isMobile && <NextPagePreview nextPage={nextPage} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: isMobile ? 10 : 0 }}>
      {/* Précédent */}
      {!isFirst ? (
        <button onClick={onPrev} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.6)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          transition: 'all .2s', ...btnPrev,
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        >← Précédent</button>
      ) : <div style={isMobile ? { flex: 1 } : {}} />}

      {/* Suivant / Quiz / Terminer */}
      {isLast ? (
        quizLaunched ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: isMobile ? 2 : undefined }}>
            <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>✓ Quiz envoyé</span>
            <button onClick={onBack} style={{
              background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)',
              color: '#ff6b6b', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              flex: isMobile ? 1 : undefined, ...btnNext,
            }}>Terminer →</button>
          </div>
        ) : (
          <button onClick={onLaunchQuiz} style={{
            background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
            border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 6px 24px rgba(124,58,237,0.5)', fontFamily: 'inherit',
            flex: isMobile ? 2 : undefined, textAlign: 'center', ...btnNext,
          }}>🧠 Lancer le quiz →</button>
        )
      ) : (
        <button onClick={onNext} style={{
          background: 'linear-gradient(135deg, #0066a0, #00abe9)',
          border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(0,171,233,0.45)', fontFamily: 'inherit',
          flex: isMobile ? 2 : undefined, textAlign: 'center', ...btnNext,
        }}>{nextLabel || 'Suivant →'}</button>
      )}
      </div>
    </div>
  )
}

// ── Page 0 : Titre seul — question orale ─────────────────────────
function TroublesIntroPage({ page, trainerAvatar, pName, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage }) {
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
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
      </div>

      {/* Centre */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 32, padding: '40px 48px 120px',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          width: 110, height: 110, borderRadius: '50%',
          background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px rgba(0,171,233,0.15)',
        }}>
          <span style={{ fontSize: 52, lineHeight: 1 }}>{page.icon}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18 }}>
            Les bases de l&apos;optique
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, maxWidth: 600 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginTop: 16, fontStyle: 'italic' }}>
            {page.sousTitre}
          </p>
        </div>
      </div>

      <TrainerNav onBack={onBack} onPrev={onPrev} onNext={onNext} isFirst={isFirst} isLast={isLast} pageIndex={pageIndex} total={total} nextPage={nextPage} />
      <AvatarBubble script="Commencez par poser cette question à vos collaborateurs avant de dévoiler les réponses." trainerAvatar={trainerAvatar} pName={pName} />
    </div>
  )
}

// ── Page troubles visuels ─────────────────────────────────────────
function TroublesPage({ page, trainerAvatar, pName, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [selected, setSelected]         = useState(null)

  useEffect(() => {
    setVisibleCount(0)
    setSelected(null)
    setSharedState({ troubles_selected: null }).catch(() => {})
    const timers = page.troubles.map((_, i) =>
      setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), 250 + i * 220)
    )
    return () => {
      timers.forEach(clearTimeout)
      setSharedState({ troubles_selected: null }).catch(() => {})
    }
  }, [page.id])

  const toggle = (i) => {
    const next = selected === i ? null : i
    setSelected(next)
    setSharedState({ troubles_selected: next }).catch(() => {})
  }

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
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginTop: 8 }}>
            {selected !== null ? '▶ Vidéo diffusée — cliquez à nouveau pour fermer' : 'Cliquez sur un trouble pour lancer la vidéo sur le diffuseur'}
          </p>
        </div>

        {/* Liste des troubles — cliquables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {page.troubles.map((t, i) => (
            <div key={i} onClick={() => i < visibleCount && toggle(i)} style={{
              display: 'flex', alignItems: 'center', gap: 24,
              background: selected === i ? `${t.color}18` : i < visibleCount ? `${t.color}09` : 'transparent',
              border: `1px solid ${selected === i ? t.color + '80' : i < visibleCount ? t.color + '28' : 'transparent'}`,
              borderLeft: `4px solid ${i < visibleCount ? t.color : 'transparent'}`,
              borderRadius: 16, padding: '20px 28px',
              opacity: i < visibleCount ? (selected !== null && selected !== i ? 0.4 : 1) : 0,
              transform: i < visibleCount ? 'translateX(0)' : 'translateX(-28px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
              cursor: i < visibleCount ? 'pointer' : 'default',
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: t.color, letterSpacing: 1, minWidth: 26, opacity: 0.75 }}>
                {t.num}
              </span>
              <span style={{ fontSize: 26, fontWeight: 800, color: '#fff', minWidth: 220, letterSpacing: -0.3 }}>
                {t.nom}
              </span>
              <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <span style={{
                fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, fontWeight: 400, flex: 1,
                opacity: selected === i ? 1 : 0.28,
                transition: 'opacity 0.4s ease',
              }}>
                {t.def}
              </span>
              <div style={{
                fontSize: 12, fontWeight: 700, flexShrink: 0, minWidth: 64, textAlign: 'right',
                color: selected === i ? t.color : 'rgba(255,255,255,0.25)',
                transition: 'color .3s',
              }}>
                {selected === i ? '■ Stop' : '▶ Vidéo'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TrainerNav
        onBack={onBack} onPrev={onPrev} onNext={onNext}
        isFirst={isFirst} isLast={isLast}
        pageIndex={pageIndex} total={total}
        nextPage={nextPage}
      />
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
function CorrectionScalePage({ page, trainerAvatar, pName, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage }) {
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
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
      <TrainerNav onBack={onBack} onPrev={onPrev} onNext={onNext} isFirst={isFirst} isLast={isLast} pageIndex={pageIndex} total={total} nextPage={nextPage} />

      <AvatarBubble script={page.avatarScript} trainerAvatar={trainerAvatar} pName={pName} />
    </div>
  )
}

// ── Page 3 : Lire une ordonnance ─────────────────────────────────
function OrdonnancePage({ page, trainerAvatar, pName, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage }) {
  const [revealStep, setRevealStep] = useState(1) // 1=sphère, 2=cylindre+axe, 3=addition
  const [playing, setPlaying] = useState(false)
  const videoPreviewRef = useRef(null)

  useEffect(() => {
    setRevealStep(1)
    setPlaying(true)
    setSharedState({ ordo_playing: true, ordo_reveal_step: 1 }).catch(() => {})
    return () => { setSharedState({ ordo_playing: false }).catch(() => {}) }
  }, [page.id])

  useEffect(() => {
    setSharedState({ ordo_reveal_step: revealStep }).catch(() => {})
  }, [revealStep])

  useEffect(() => {
    const v = videoPreviewRef.current
    if (!v) return
    v.muted = true
    if (playing) v.play().catch(() => {})
    else v.pause()
  }, [playing])

  const togglePlay = () => {
    const next = !playing
    setPlaying(next)
    setSharedState({ ordo_playing: next }).catch(() => {})
  }

  const handleNextReveal = () => {
    if (revealStep < 3) setRevealStep(r => r + 1)
    else onNext()
  }

  // revealStep 1 = sphère seule, 2 = +cylindre+axe, 3 = +addition
  const showCard = (i) => i === 0 ? revealStep >= 1 : revealStep >= 2
  const showTable = revealStep >= 1
  const showCell = (row, col) => col === 0 ? revealStep >= 1 : revealStep >= 2
  const showAdd = revealStep >= 3

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 48px 100px', gap: 28 }}>

        {/* Titre */}
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Les bases de l&apos;optique</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0 }}>{page.titre}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>{page.sousTitre}</p>
        </div>

        {/* Phase 1 — 3 cartes colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {ORD_COLS.map((col, i) => (
            <div key={col.key} style={{
              background: `${col.color}0d`, border: `1px solid ${col.color}28`,
              borderTop: `3px solid ${col.color}`, borderRadius: 16,
              padding: '22px 22px 18px',
              opacity: showCard(i) ? 1 : 0,
              transform: showCard(i) ? 'translateY(0)' : 'translateY(18px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <div style={{
                display: 'inline-block',
                background: `${col.color}1a`, border: `1px solid ${col.color}40`,
                borderRadius: 20, padding: '3px 12px',
                fontSize: 11, fontWeight: 800, color: col.color,
                textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10,
              }}>{col.label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: col.sub ? 8 : 0 }}>
                {col.desc}
              </div>
              {col.sub && (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{col.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Phase 2 — Table ordonnance */}
        <div style={{
          opacity: showTable ? 1 : 0,
          transform: showTable ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.5s ease',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>
            Exemple d&apos;ordonnance
          </div>

          <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* En-têtes colonnes */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(3, 1fr)', background: 'rgba(255,255,255,0.04)' }}>
              <div />
              {ORD_COLS.map(col => (
                <div key={col.key} style={{ padding: '10px 20px', fontSize: 12, fontWeight: 800, color: col.color, textTransform: 'uppercase', letterSpacing: 1, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* Ligne OD */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>OD</div>
              {ORD_COLS.map((col, ci) => (
                <div key={col.key} style={{
                  padding: '14px 20px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center',
                  opacity: showCell(0, ci) ? 1 : 0, transform: showCell(0, ci) ? 'translateX(0)' : 'translateX(-10px)', transition: 'all 0.35s ease',
                }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.od[col.key]}</span>
                </div>
              ))}
            </div>

            {/* Ligne OG */}
            <div style={{ display: 'grid', gridTemplateColumns: '72px repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '14px 20px', fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>OG</div>
              {ORD_COLS.map((col, ci) => (
                <div key={col.key} style={{
                  padding: '14px 20px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center',
                  opacity: showCell(1, ci) ? 1 : 0, transform: showCell(1, ci) ? 'translateX(0)' : 'translateX(-10px)', transition: 'all 0.35s ease',
                }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.og[col.key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Addition */}
          <div style={{
            marginTop: 14, display: 'flex', alignItems: 'center', gap: 20,
            padding: '14px 22px',
            background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 14,
            opacity: showAdd ? 1 : 0, transform: showAdd ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s ease',
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1.5 }}>Addition</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.add}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>Correction presbytie</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <TrainerNav
        onBack={onBack} onPrev={onPrev} onNext={handleNextReveal}
        isFirst={isFirst} isLast={isLast} pageIndex={pageIndex} total={total} nextPage={nextPage}
        nextLabel={revealStep === 1 ? 'Cylindre & Axe →' : revealStep === 2 ? 'Addition →' : 'Suivant →'}
      />

      {/* Bulle avatar opticien ordonnance */}
      <div style={{
        position: 'fixed', bottom: 80, right: 28, zIndex: 50,
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      }}>
        <div style={{
          background: 'rgba(10,42,92,0.85)', backdropFilter: 'blur(20px)',
          border: `1px solid ${playing ? 'rgba(34,197,94,0.4)' : 'rgba(0,171,233,0.3)'}`,
          borderRadius: 20, padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 14,
          boxShadow: `0 8px 32px ${playing ? 'rgba(34,197,94,0.3)' : 'rgba(0,0,0,0.4)'}`,
          transition: 'border-color .3s, box-shadow .3s',
        }}>
          {/* Miniature vidéo (muet) */}
          <div style={{
            width: 72, height: 72, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
            border: `2px solid ${playing ? 'rgba(34,197,94,0.6)' : 'rgba(0,171,233,0.4)'}`,
          }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoPreviewRef}
              src="/assets/LectureOrdoAudioOK.mp4"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              preload="auto"
              muted
            />
          </div>
          {/* Infos + bouton */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Opticien</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Lecture ordonnance</div>
            <button
              onClick={togglePlay}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: playing ? 'rgba(34,197,94,0.2)' : 'rgba(0,171,233,0.2)',
                border: `1px solid ${playing ? 'rgba(34,197,94,0.5)' : 'rgba(0,171,233,0.5)'}`,
                borderRadius: 20, padding: '5px 12px',
                fontSize: 12, fontWeight: 700,
                color: playing ? '#4ade80' : '#00abe9',
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s',
              }}
            >
              {playing ? '⏸ Pause' : '▶ Lecture'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page 4 : Pause atelier pratique ──────────────────────────────
function PausePage({ page, trainerAvatar, pName, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage }) {
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
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
      </div>

      {/* Centre */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 28, padding: '40px 48px 120px',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* Icône */}
        <div style={{
          width: 120, height: 120, borderRadius: '50%',
          background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 60px rgba(0,171,233,0.15)',
        }}>
          <span style={{ fontSize: 56, lineHeight: 1 }}>{page.icon}</span>
        </div>

        {/* Texte */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 14 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', fontWeight: 400, maxWidth: 500 }}>
            {page.sousTitre}
          </p>
        </div>

        {/* Pill "en cours" */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
          borderRadius: 30, padding: '12px 24px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00abe9', animation: 'optiqueHalo 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>En cours avec le formateur…</span>
        </div>
      </div>

      {/* Navigation */}
      <TrainerNav onBack={onBack} onPrev={onPrev} onNext={onNext} isFirst={isFirst} isLast={isLast} pageIndex={pageIndex} total={total} nextPage={nextPage} />
    </div>
  )
}

// ── Helpers saisie ────────────────────────────────────────────────
const fmtSph = (v) => {
  if (Math.abs(v) < 0.001) return '0,00'
  const abs = Math.abs(v).toFixed(2).replace('.', ',')
  return v > 0 ? `+${abs}` : `−${abs}`
}
const fmtCyl = (v) => {
  if (Math.abs(v) < 0.001) return null
  const abs = Math.abs(v).toFixed(2).replace('.', ',')
  return `(−${abs})`
}
const fmtAdd = (v) => v != null ? `Add +${v.toFixed(2).replace('.', ',')}` : null

function PrescLine({ eye }) {
  const parts = [fmtSph(eye.sphere)]
  const cyl = fmtCyl(eye.cylindre)
  if (cyl) { parts.push(cyl); parts.push(`${eye.axe}°`) }
  return <span>{parts.join(' ')}</span>
}

// ── Page 5 : Saisie interactive (vue formateur) ───────────────────
function SaisieInteractivePage({ page, trainerAvatar, pName, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage, quizLaunched, onLaunchQuiz }) {
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
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
      </div>

      {/* Corps */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 48px 100px', gap: 24,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* Titre */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            <span style={{ fontSize: 15 }}>⌨️</span> Exercice pratique
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0 }}>{page.titre}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
            Les participants saisissent les corrections sur leur téléphone — annoncez le cas à traiter.
          </p>
        </div>

        {/* 3 cas exercice */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {SAISIE_EXERCISES.map((ex, i) => (
            <div key={ex.id} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20, padding: '24px 24px 20px', display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {/* Badge cas */}
              <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)', borderRadius: 16, padding: '4px 14px', fontSize: 12, fontWeight: 800, color: '#00abe9' }}>
                {ex.label}
              </div>

              {/* Valeurs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['OD', ex.od], ['OG', ex.og]].map(([label, eye]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', minWidth: 24 }}>{label}</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                      <PrescLine eye={eye} />
                    </span>
                  </div>
                ))}
                {ex.add != null && (
                  <div style={{ marginTop: 4, fontSize: 14, fontWeight: 600, color: '#4ade80' }}>
                    {fmtAdd(ex.add)}
                  </div>
                )}
              </div>

              {/* Grille recap */}
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(255,255,255,0.04)' }}>
                  {['Sphère', 'Cylindre', 'Axe'].map(h => (
                    <div key={h} style={{ padding: '6px 10px', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, borderRight: '1px solid rgba(255,255,255,0.06)' }}>{h}</div>
                  ))}
                </div>
                {[['OD', ex.od], ['OG', ex.og]].map(([label, eye]) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    {[fmtSph(eye.sphere), Math.abs(eye.cylindre) < 0.001 ? '—' : fmtCyl(eye.cylindre), eye.axe === 0 && Math.abs(eye.cylindre) < 0.001 ? '—' : `${eye.axe}°`].map((v, ci) => (
                      <div key={ci} style={{ padding: '8px 10px', fontSize: 13, fontWeight: 700, color: '#fff', borderRight: '1px solid rgba(255,255,255,0.06)', fontVariantNumeric: 'tabular-nums' }}>{v}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Instruction */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10, alignSelf: 'flex-start',
          background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
          borderRadius: 30, padding: '12px 24px',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00abe9', animation: 'optiqueHalo 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Les participants saisissent en ce moment sur leur téléphone</span>
        </div>
      </div>

      <TrainerNav onBack={onBack} onPrev={onPrev} onNext={onNext} isFirst={isFirst} isLast={isLast} pageIndex={pageIndex} total={total} quizLaunched={quizLaunched} onLaunchQuiz={onLaunchQuiz} nextPage={nextPage} />
    </div>
  )
}

// ── Quiz Controller (vue formateur) ──────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers] = useState([])
  const q = OPTIQUE_QUIZ[quizQ]
  const isLast = quizQ >= OPTIQUE_QUIZ.length - 1

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.optique&question_idx=eq.${quizQ}`
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Les bases de l&apos;optique — Vue formateur</span>
        </div>
        <button onClick={onBack} style={{
          background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)',
          color: '#ff6b6b', padding: '7px 16px', borderRadius: 10,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>✕ Terminer</button>
      </div>

      {/* Badge question */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>Question {quizQ + 1} / {OPTIQUE_QUIZ.length}</div>
      </div>

      {/* Question */}
      <div style={{
        fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center',
        marginBottom: 36, lineHeight: 1.3, maxWidth: 800, alignSelf: 'center',
      }}>{q.question}</div>

      {/* Barres réponses en direct */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        {q.options.map((opt, i) => {
          const count = counts[i]
          const isCorrect = i === q.correct
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={i} style={{
              background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 16, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: OPTION_COLORS[i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff',
                  }}>{'ABC'[i]}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt}</span>
                  {isCorrect && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 10px', borderRadius: 20 }}>✓ Bonne réponse</span>}
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: isCorrect ? '#4ade80' : '#fff' }}>
                  {count}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 4 }}>vote{count > 1 ? 's' : ''}</span>
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

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginRight: 6 }}>{total}</span>
          participant{total !== 1 ? 's' : ''} {total !== 1 ? 'ont' : 'a'} répondu
        </div>
        {isLast ? (
          <button onClick={onEnd} style={{
            background: 'linear-gradient(135deg, #16a34a, #22c55e)',
            border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 24px rgba(34,197,94,0.4)',
          }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
            border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 24px rgba(124,58,237,0.45)',
          }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Group Results View (vue formateur après quiz) ─────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [rateShowing, setRateShowing] = useState(false)

  const toggleRate = async () => {
    const next = !rateShowing
    setRateShowing(next)
    await setSharedState({ quiz_rate_show: next ? Date.now() : false })
  }

  useEffect(() => {
    const fetchAnswers = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.optique`
      )
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
  }, [])

  const participantNames = [...new Set((answers || []).map(r => r.collaborateur))]
  const participantCount = participantNames.length

  const questionStats = OPTIQUE_QUIZ.map((q, idx) => {
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz · Les bases de l&apos;optique</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{participantCount}</span>
          participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase',
          marginBottom: 12,
        }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d&apos;erreur décroissant</p>
      </div>

      {/* Question cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, alignSelf: 'center', width: '100%', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15, padding: 40 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const priority = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{
              background: priority.bg,
              border: `1px solid ${priority.border}`,
              borderRadius: 18, padding: '18px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{priority.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: priority.color, textTransform: 'uppercase', letterSpacing: 1 }}>{priority.label}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                    Q{stat.idx + 1} — {stat.question}
                  </div>
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: priority.color, lineHeight: 1, flexShrink: 0 }}>
                  {stat.pctWrong}%
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>d&apos;erreurs</div>
                </div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${stat.pctWrong}%`,
                  background: priority.color,
                  transition: 'width .8s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
        <button onClick={toggleRate} style={{
          background: rateShowing ? 'rgba(0,171,233,0.2)' : 'rgba(0,171,233,0.1)',
          border: `1px solid ${rateShowing ? '#00abe9' : 'rgba(0,171,233,0.4)'}`,
          color: '#00abe9', padding: '14px 28px', borderRadius: 14,
          fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          🎯 {rateShowing ? 'Masquer le taux' : 'Révéler le taux de réussite'}
        </button>
        <button onClick={onTerminate} style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14,
          fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 24px rgba(220,38,38,0.4)',
        }}>✓ Terminer le module</button>
      </div>
    </div>
  )
}

// ── Lobby ─────────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <button onClick={onBack} style={{
        position: 'absolute', top: 24, left: 24,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10,
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>← Retour</button>

      <div style={{ textAlign: 'center', maxWidth: 520, padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={180} height={68} style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Module de formation
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
          Les bases de l&apos;optique
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
          Troubles visuels · Corrections · Ordonnances<br />
          Comprendre et expliquer la prescription à vos clients
        </p>
        <button onClick={onStart} style={{
          background: 'linear-gradient(135deg, #0089ba, #00abe9)',
          border: 'none', color: '#fff', padding: '16px 48px',
          borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,171,233,0.45)', fontFamily: 'inherit',
        }}>▶ Lancer le module</button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>6 pages · ~20 minutes</p>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function ModuleOptique({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [quizLaunched, setQuizLaunched] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [quizInterstitial, setQuizInterstitial] = useState(false)
  const [quizFinalPhase, setQuizFinalPhase] = useState(null) // 'podium' | 'rate' | null
  const [showGroupResults, setShowGroupResults] = useState(false)

  const trainerAvatar = TRAINER_AVATARS[(pName || '').toLowerCase()] || TRAINER_AVATARS.kevin

  // Dès que le Lobby s'affiche → on signale le module en attente de lancement
  useEffect(() => {
    sbUpdate('sessions', { active_module: 'optique', module_page: -1 }, `code=eq.${getActiveSessionCode()}`)
  }, [])

  // Sync Supabase seulement quand le module est lancé
  useEffect(() => {
    if (started) {
      sbUpdate('sessions', { active_module: 'optique', module_page: pageIndex }, `code=eq.${getActiveSessionCode()}`)
    }
  }, [pageIndex, started])

  const handleBack = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    onBack()
  }

  const handleLaunchQuiz = async () => {
    await sbUpdate('sessions', { active_module: 'optique', module_page: 100 }, `code=eq.${getActiveSessionCode()}`)
    await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: null })
    setQuizQ(0)
    setQuizLaunched(true)
    setQuizFinalPhase(null)
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await sbUpdate('sessions', { active_module: 'optique', module_page: 100 + next }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(next)
    if (next % 5 === 0 && next < OPTIQUE_QUIZ.length) {
      setQuizInterstitial(true)
      setSharedState({ quiz_interstitial_q: next }).catch(() => {})
    }
  }

  const handleContinueInterstitial = async () => {
    setQuizInterstitial(false)
    await setSharedState({ quiz_interstitial_q: null })
  }

  const handleEndQuiz = async () => {
    await sbUpdate('sessions', { active_module: 'optique', module_page: 200 }, `code=eq.${getActiveSessionCode()}`)
    await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: 'podium' })
    setQuizFinalPhase('podium')
  }

  const handleShowRate = async () => {
    await setSharedState({ quiz_final_phase: 'rate' })
    setQuizFinalPhase('rate')
  }

  const handleShowRecap = async () => {
    await setSharedState({ quiz_final_phase: 'recap' })
    setQuizFinalPhase(null)
    setShowGroupResults(true)
  }

  const handleTerminateModule = async () => {
    await setSharedState({ quiz_final_phase: null })
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    onBack()
  }

  if (!started) return (
    <>
      <style>{STYLES}</style>
      <Lobby onStart={() => setStarted(true)} onBack={handleBack} />
    </>
  )

  if (quizFinalPhase === 'podium') {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
        }}>
          <img src="/assets/troph%C3%A9-quiz.png" alt="Trophée" style={{ width: 120, height: 120, objectFit: 'contain' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Podium final affiché sur le diffuseur
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              Commentez le classement avec le groupe…
            </div>
          </div>
          <button onClick={handleShowRate} style={{
            background: 'linear-gradient(135deg, #0089ba, #00abe9)',
            border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
            fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 24px rgba(0,171,233,0.45)',
          }}>
            Afficher le taux de réussite →
          </button>
        </div>
      </>
    )
  }

  if (quizFinalPhase === 'rate') {
    return (
      <>
        <style>{STYLES}</style>
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
        }}>
          <div style={{ fontSize: 72 }}>📊</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Taux de réussite affiché sur le diffuseur
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
              Commentez les résultats avec le groupe…
            </div>
          </div>
          <button onClick={handleShowRecap} style={{
            background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
            border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
            fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 24px rgba(124,58,237,0.45)',
          }}>
            Faire apparaître le récap →
          </button>
        </div>
      </>
    )
  }

  if (showGroupResults) {
    return (
      <>
        <style>{STYLES}</style>
        <GroupResultsView onTerminate={handleTerminateModule} />
      </>
    )
  }

  if (quizLaunched) {
    if (quizInterstitial) {
      return (
        <>
          <style>{STYLES}</style>
          <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32,
          }}>
            <div style={{ fontSize: 64 }}>🏆</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
                Podium après {quizQ} questions
              </div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>
                Le classement est affiché sur le diffuseur
              </div>
            </div>
            <button onClick={handleContinueInterstitial} style={{
              background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
              border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
              fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(124,58,237,0.45)',
            }}>
              Continuer → Q{quizQ + 1}
            </button>
          </div>
        </>
      )
    }
    return (
      <>
        <style>{STYLES}</style>
        <QuizController
          quizQ={quizQ}
          onNext={handleNextQuestion}
          onEnd={handleEndQuiz}
          onBack={handleEndQuiz}
        />
      </>
    )
  }

  const page = PAGES[pageIndex]
  const navProps = {
    trainerAvatar,
    pName,
    onBack: handleBack,
    pageIndex,
    total: PAGES.length,
    onPrev: () => setPageIndex(i => Math.max(i - 1, 0)),
    onNext: () => setPageIndex(i => Math.min(i + 1, PAGES.length - 1)),
    isFirst: pageIndex === 0,
    isLast: pageIndex === PAGES.length - 1,
    quizLaunched,
    onLaunchQuiz: handleLaunchQuiz,
    nextPage: PAGES[pageIndex + 1] ?? null,
  }

  return (
    <>
      <style>{STYLES}</style>
      {page.type === 'troubles-intro'    && <TroublesIntroPage      page={page} {...navProps} />}
      {page.type === 'troubles-list'    && <TroublesPage           page={page} {...navProps} />}
      {page.type === 'correction-scale' && <CorrectionScalePage    page={page} {...navProps} />}
      {page.type === 'ordonnance'        && <OrdonnancePage         page={page} {...navProps} />}
      {page.type === 'pause'             && <PausePage              page={page} {...navProps} />}
      {page.type === 'saisie-interactive' && <SaisieInteractivePage page={page} {...navProps} />}
    </>
  )
}
