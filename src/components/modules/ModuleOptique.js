'use client'
// fix: getActiveSessionCode pour sync TV
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, sbDelete, sbSelect, getActiveSessionCode, setSharedState, getRoomSharedState, fetchOpenAnswers, clearQuizStarts } from '@/lib/supabase'
import { fetchOnlineParticipantCount } from '@/lib/participantPresence'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { useAutoRevealCorrection, NotAnsweredList } from '@/lib/useAutoRevealCorrection'
import { OPTIQUE_PAGES as PAGES, ORD_COLS, ORD_EXAMPLE, SAISIE_EXERCISES, SAISIE_ROUNDS, OPTIQUE_QUIZ, ENTRAINEMENT_QUESTIONS } from '@/lib/modulesData'
import { TRAINER_AVATARS } from '@/lib/constants'
import { NextPagePreview } from '@/lib/trainerPreview'
import { useIsMobile } from '@/lib/useIsMobile'
import { HeadlightVision } from '@/lib/headlightVision'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'
import { QuestionsGameTrainerPanel } from '@/components/QuestionsGamePanel'

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
    </div>
  )
}

// ── Page troubles visuels ─────────────────────────────────────────
function TroublesPage({ page, trainerAvatar, pName, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [selected, setSelected]         = useState(null)
  const [revealed, setRevealed]         = useState([])

  useEffect(() => {
    setVisibleCount(0)
    setSelected(null)
    setRevealed([])
    setSharedState({ troubles_selected: null, troubles_revealed: [] }).catch(() => {})
    const timers = page.troubles.map((_, i) =>
      setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), 250 + i * 220)
    )
    return () => {
      timers.forEach(clearTimeout)
      setSharedState({ troubles_selected: null }).catch(() => {})
    }
  }, [page.id])

  // Une fois qu'un trouble a été ouvert, il reste acquis (visible avec sa
  // définition sur le diffuseur et le téléphone des formés) même après avoir
  // été refermé — on ne traite qu'un trouble à la fois pour ne pas distraire,
  // mais les 4 restent affichés ensemble une fois tous passés.
  const toggle = (i) => {
    const next = selected === i ? null : i
    setSelected(next)
    setRevealed(prev => {
      const nextRevealed = prev.includes(i) ? prev : [...prev, i]
      setSharedState({ troubles_selected: next, troubles_revealed: nextRevealed }).catch(() => {})
      return nextRevealed
    })
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

    </div>
  )
}

// ── Page 3 : Lire une ordonnance ─────────────────────────────────
function OrdonnancePage({ page, trainerAvatar, pName, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage }) {
  const isMobile = useIsMobile()
  const [revealStep, setRevealStep] = useState(0) // 0=tableau vide, 1=+sphère, 2=+cylindre+axe, 3=+addition
  const [headlightDemo, setHeadlightDemo] = useState(false)
  const [headlightCyl, setHeadlightCyl] = useState(0)
  const [headlightAxe, setHeadlightAxe] = useState(0)
  const syncedRef = useRef(false)

  // Garantit que le code de salle est bien résolu (recherche live en base) avant la
  // toute première écriture partagée — sinon le reset ci-dessous peut cibler la
  // mauvaise salle (ou aucune), laissant l'animation "coincée" affichée sur le
  // diffuseur depuis un essai précédent tant qu'on n'a pas quitté/relancé le module.
  const syncAndWrite = async (data) => {
    if (!syncedRef.current) {
      await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName)
      syncedRef.current = true
    }
    return setSharedState(data)
  }

  useEffect(() => {
    setRevealStep(0)
    setHeadlightDemo(false)
    syncAndWrite({ ordo_playing: true, ordo_reveal_step: 0, ordo_headlight_demo: false }).catch(() => {})
    return () => { setSharedState({ ordo_playing: false, ordo_headlight_demo: false }).catch(() => {}) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id])

  useEffect(() => {
    syncAndWrite({ ordo_reveal_step: revealStep }).catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealStep])

  const handleNextReveal = () => {
    if (revealStep < 3) setRevealStep(r => r + 1)
    else onNext()
  }

  const openHeadlightDemo = () => {
    setHeadlightDemo(true)
    setHeadlightCyl(0)
    setHeadlightAxe(0)
    syncAndWrite({ ordo_headlight_demo: true, ordo_headlight_cyl: 0, ordo_headlight_axe: 0 }).catch(() => {})
  }

  const closeHeadlightDemo = () => {
    setHeadlightDemo(false)
    syncAndWrite({ ordo_headlight_demo: false }).catch(() => {})
  }

  const handleHeadlightCyl = (val) => {
    setHeadlightCyl(val)
    syncAndWrite({ ordo_headlight_cyl: val }).catch(() => {})
  }

  const handleHeadlightAxe = (val) => {
    setHeadlightAxe(val)
    syncAndWrite({ ordo_headlight_axe: val }).catch(() => {})
  }

  // revealStep 0 = tableau vide, 1 = +sphère, 2 = +cylindre+axe, 3 = +addition
  const showCard = (i) => i === 0 ? revealStep >= 1 : revealStep >= 2
  const showTable = true
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 16px 100px' : '16px 48px 100px', gap: 28 }}>

        {/* Titre */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Les bases de l&apos;optique</div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0 }}>{page.titre}</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>{page.sousTitre}</p>
          </div>

          {/* Bouton "expliquer le sens du cylindre et de l'axe" — en flux normal, toujours visible */}
          {revealStep >= 2 && !headlightDemo && (
            <button onClick={openHeadlightDemo} style={{
              background: 'rgba(192,132,252,0.18)', border: '1px solid rgba(192,132,252,0.5)',
              color: '#c084fc', padding: isMobile ? '14px 18px' : '12px 22px', borderRadius: 14,
              fontSize: isMobile ? 14 : 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              width: isMobile ? '100%' : 'auto', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(192,132,252,0.25)',
            }}>
              🔦 {isMobile ? 'Expliquer l’axe' : 'Expliquer le sens du cylindre et de l’axe'}
            </button>
          )}
        </div>

        {/* Phase 1 — 3 cartes colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? 12 : 18 }}>
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
        nextLabel={revealStep === 0 ? 'Sphère →' : revealStep === 1 ? 'Cylindre & Axe →' : revealStep === 2 ? 'Addition →' : 'Suivant →'}
      />

      {headlightDemo && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(3,17,42,0.98)',
          display: 'flex', flexDirection: 'column',
          overflowY: 'auto',
        }}>
          {/* Bandeau info — pas de bouton ici, le bouton fermer est le rond flottant en bas à droite */}
          <div style={{
            flexShrink: 0, position: 'sticky', top: 0, zIndex: 1,
            background: 'rgba(3,17,42,0.98)', borderBottom: '1px solid rgba(255,255,255,0.1)',
            padding: isMobile ? '14px 16px' : '18px 32px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Diffusé en direct sur le diffuseur
            </div>
          </div>

          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 36,
            padding: isMobile ? '32px 20px 40px' : '40px 24px',
          }}>
            <HeadlightVision cyl={headlightCyl} axe={headlightAxe} size={isMobile ? 200 : 260} label="Aperçu formé" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: 480 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#c084fc' }}>Cylindre</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                    {headlightCyl.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <input
                  type="range" min={0} max={4} step={0.25}
                  value={headlightCyl}
                  onChange={e => handleHeadlightCyl(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#c084fc' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fb923c' }}>Axe</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{headlightAxe}°</span>
                </div>
                <input
                  type="range" min={0} max={180} step={5}
                  value={headlightAxe}
                  onChange={e => handleHeadlightAxe(parseInt(e.target.value, 10))}
                  style={{ width: '100%', accentColor: '#fb923c' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bouton flottant "fermer l'animation" — bas droite, en miroir de 💡 idées / ❓ questions (bas gauche) */}
      {headlightDemo && (
        <button
          onClick={closeHeadlightDemo}
          title="Fermer l'animation sur le diffuseur"
          style={{
            position: 'fixed',
            bottom: isMobile ? 90 : 28,
            right: isMobile ? 14 : 28,
            zIndex: 950,
            width: isMobile ? 48 : 52, height: isMobile ? 48 : 52, borderRadius: '50%',
            background: 'linear-gradient(135deg, #dc2626, #ef4444)',
            border: 'none', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, boxShadow: '0 4px 18px rgba(239,68,68,0.5)',
            transition: 'transform .15s, box-shadow .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        >✕</button>
      )}

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
  const [stage, setStage] = useState('r1-entry') // r1-entry | r1-correction | r2-entry | r2-correction
  const [onlineCount, setOnlineCount] = useState(0)
  const [results, setResults] = useState([]) // module_results rows pour le round courant
  const autoAdvancedRef = useRef(new Set()) // évite de redéclencher l'auto-passage à la correction

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  useEffect(() => {
    setSharedState({ saisie_stage: 'r1-entry' }).catch(() => {})
    return () => { setSharedState({ saisie_stage: 'r1-entry' }).catch(() => {}) }
  }, [page.id])

  const round = (stage === 'r2-entry' || stage === 'r2-correction') ? 2 : 1
  const isEntry = stage === 'r1-entry' || stage === 'r2-entry'
  const caseIndexes = (SAISIE_ROUNDS.find(r => r.round === round) || SAISIE_ROUNDS[0]).caseIndexes
  const roundExercises = caseIndexes.map(i => SAISIE_EXERCISES[i])
  const moduleIdRound = `optique-saisie-r${round}`

  const goStage = async (next) => {
    setStage(next)
    // results est encore celui de l'étape qu'on quitte (ex: tout le monde a
    // fini le round 1) — sans ce reset synchrone, l'effet d'auto-passage
    // ci-dessous le voit encore "complet" pour le round 2 avant que le poll
    // n'ait eu le temps de repartir de zéro, et saute directement à la
    // correction du round 2 sans laisser le temps de saisir (incident du 18/08).
    setResults([])
    autoAdvancedRef.current = new Set()
    await setSharedState({ saisie_stage: next }).catch(() => {})
  }

  // Poll participants connectés + résultats du round courant
  useEffect(() => {
    // module_results n'a pas de session_code sur ces lignes (clé d'upsert
    // collaborateur+module_id+week_date) — sans filtre sur la date du jour,
    // on remontait les résultats de toutes les semaines passées, faisant
    // parfois avancer la correction automatiquement avant que les formés
    // présents aient fini (results.length dépassait onlineCount à tort).
    const today = new Date().toISOString().slice(0, 10)
    const poll = async () => {
      try {
        const [n, rows] = await Promise.all([
          fetchOnlineParticipantCount(getActiveSessionCode()),
          sbSelect('module_results', `module_id=eq.${moduleIdRound}&week_date=eq.${today}`),
        ])
        setOnlineCount(n || 0)
        setResults(rows || [])
      } catch { /* best-effort */ }
    }
    poll()
    const t = setInterval(poll, 2500)
    return () => clearInterval(t)
  }, [moduleIdRound])

  // Auto-passage à la correction dès que tout le monde a fini les 3 cas du round
  useEffect(() => {
    if (!isEntry || onlineCount === 0) return
    if (autoAdvancedRef.current.has(stage)) return
    if (results.length >= onlineCount) {
      autoAdvancedRef.current.add(stage)
      goStage(stage === 'r1-entry' ? 'r1-correction' : 'r2-correction')
    }
  }, [results.length, onlineCount, isEntry, stage]) // eslint-disable-line react-hooks/exhaustive-deps

  const wrongCount = results.filter(r => r.score < r.score_total).length
  const perfectCount = results.length - wrongCount

  // ── Phase correction (round 1 ou 2) ──
  if (!isEntry) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · Les bases de l&apos;optique</span>
          </div>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Quitter</button>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28, padding: '20px 48px' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 22px', fontSize: 12, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Correction — Round {round}
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 18, padding: '18px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#4ade80' }}>{perfectCount}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>sans erreur</div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 18, padding: '18px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#f87171' }}>{wrongCount}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>avec au moins une erreur</div>
            </div>
          </div>

          {/* Détail nominatif — visible uniquement côté formateur */}
          <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '32vh', overflowY: 'auto' }}>
            {[...results].sort((a, b) => (a.score < a.score_total ? -1 : 1) - (b.score < b.score_total ? -1 : 1)).map(r => {
              const ok = r.score >= r.score_total
              return (
                <div key={r.collaborateur} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px', borderRadius: 10,
                  background: ok ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{r.collaborateur}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: ok ? '#4ade80' : '#f87171' }}>
                    {ok ? 'Aucune erreur' : `${r.score_total - r.score} cas mal saisi${r.score_total - r.score > 1 ? 's' : ''}`}
                  </span>
                </div>
              )
            })}
            {results.length === 0 && (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Aucune réponse reçue.</div>
            )}
          </div>

          <button
            onClick={() => stage === 'r1-correction' ? goStage('r2-entry') : onNext()}
            style={{
              background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none', color: '#fff',
              padding: '16px 44px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(0,171,233,0.45)',
            }}
          >
            {stage === 'r1-correction' ? 'Round 2 →' : 'Suivant →'}
          </button>
        </div>
      </div>
    )
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
            <span style={{ fontSize: 15 }}>⌨️</span> Exercice pratique · Round {round}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.1, margin: 0 }}>{page.titre}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
            Les participants saisissent les corrections sur leur téléphone — annoncez le cas à traiter.
          </p>
        </div>

        {/* 3 cas exercice */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {roundExercises.map((ex, i) => (
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
                    {eye.add != null && (
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>{fmtAdd(eye.add)}</span>
                    )}
                  </div>
                ))}
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

        {/* Instruction + progression live */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
            borderRadius: 30, padding: '12px 24px',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00abe9', animation: 'optiqueHalo 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
              {results.length} / {onlineCount || '?'} formé{results.length > 1 ? 's' : ''} ont terminé les 3 cas
            </span>
          </div>
          {results.length > 0 && (
            <button
              onClick={() => goStage(stage === 'r1-entry' ? 'r1-correction' : 'r2-correction')}
              style={{
                background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)',
                color: '#fbbf24', padding: '10px 20px', borderRadius: 20,
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Voir la correction maintenant →
            </button>
          )}
        </div>
      </div>

      <TrainerNav onBack={onBack} onPrev={onPrev} onNext={onNext} isFirst={isFirst} isLast={isLast} pageIndex={pageIndex} total={total} quizLaunched={quizLaunched} onLaunchQuiz={onLaunchQuiz} nextPage={nextPage} />
    </div>
  )
}

// ── Entraînement oral (formateur) — délègue au panneau partagé QuestionsGamePanel ──
function EntrainementOralPage({ page, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage, quizLaunched, onLaunchQuiz, pName }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <QuestionsGameTrainerPanel
        pName={pName}
        moduleId="optique"
        sharedKeyPrefix="entrainement"
        questions={ENTRAINEMENT_QUESTIONS}
        header={`Module · Les bases de l'optique — ${pageIndex + 1}/${total}`}
        bottomPadding={100}
      />
      <TrainerNav onBack={onBack} onPrev={onPrev} onNext={onNext} isFirst={isFirst} isLast={isLast} pageIndex={pageIndex} total={total} quizLaunched={quizLaunched} onLaunchQuiz={onLaunchQuiz} nextPage={nextPage} />
    </div>
  )
}


// ── Affichage ordonnance (formateur) ─────────────────────────────
function OrdonnanceDisplay({ ordonnance, hideLabels }) {
  if (!ordonnance) return null
  const { od, og } = ordonnance
  const hasCyl = od.cyl || og.cyl
  const hasAdd = od.add || og.add
  const hdr = { padding: '4px 14px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }
  const cell = { padding: '8px 14px', textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#fff' }
  const lbl = { padding: '8px 16px', textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#a78bfa' }
  return (
    <div style={{
      background: 'rgba(124,58,237,0.08)', border: '2px solid rgba(124,58,237,0.3)',
      borderRadius: 16, padding: '12px 0', marginBottom: 28,
      width: '100%', maxWidth: 620, alignSelf: 'center',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }}>ORDONNANCE</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        {!hideLabels && (
          <thead>
            <tr>
              <th style={{ width: 60 }} />
              <th style={hdr}>Sphère</th>
              {hasCyl && <th style={hdr}>Cylindre</th>}
              {hasCyl && <th style={hdr}>Axe</th>}
              {hasAdd && <th style={hdr}>Addition</th>}
            </tr>
          </thead>
        )}
        <tbody>
          {[{ label: 'OD', data: od }, { label: 'OG', data: og }].map(({ label, data }) => (
            <tr key={label} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={lbl}>{label}</td>
              <td style={cell}>{data.sph || '—'}</td>
              {hasCyl && <td style={cell}>{data.cyl || 'Plan'}</td>}
              {hasCyl && <td style={cell}>{data.axe || '—'}</td>}
              {hasAdd && <td style={hideLabels ? cell : { ...cell, color: '#4ade80' }}>{hideLabels ? `Add ${data.add || '—'}` : (data.add || '—')}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Contrôleur texte libre (questions text-open) ──────────────────
function TextOpenControllerOptique({ quizQ, isLast, onNext, onEnd, onBack }) {
  const [openAnswers, setOpenAnswers] = useState([])
  const [validating, setValidating]   = useState({})
  const [validated, setValidated]     = useState({})
  const autoValidatedRef              = useRef(new Set())

  const q      = OPTIQUE_QUIZ[quizQ]
  const pageId = `optique:${quizQ}`

  useEffect(() => {
    setOpenAnswers([])
    setValidating({})
    setValidated({})
    autoValidatedRef.current = new Set()

    const autoValidate = (deduped) => {
      const kws = q?.autoCorrect
      if (!kws?.length) return
      for (const row of deduped) {
        const name = row.participant_name
        if (autoValidatedRef.current.has(name)) continue
        const text = (row.answer || '').trim().toLowerCase()
        if (kws.some(kw => text.includes(kw.toLowerCase()))) {
          autoValidatedRef.current.add(name)
          setValidating(v => ({ ...v, [name]: true }))
          saveModuleQuizAnswer({ sessionCode: getActiveSessionCode(), moduleId: 'optique', questionIdx: quizQ, collaborateur: name, answerIdx: 0, isCorrect: true })
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
      await saveModuleQuizAnswer({ sessionCode: getActiveSessionCode(), moduleId: 'optique', questionIdx: quizQ, collaborateur: row.participant_name, answerIdx: 0, isCorrect })
      setValidated(v => ({ ...v, [row.participant_name]: isCorrect ? 'correct' : 'wrong' }))
    } catch { /* permet de réessayer */ }
    finally {
      setValidating(v => ({ ...v, [row.participant_name]: false }))
    }
  }

  const handleShowCorrectionForce = async () => {
    await setSharedState({ quiz_show_correction: true }).catch(() => {})
  }

  // Auto-passage à la correction dès que tous les formés connectés ont
  // répondu — le bouton reste bloqué tant que ce n'est pas le cas, avec un
  // lien "Forcer" en secours si le décompte est erroné.
  const { connectedCount, notAnswered } = useAutoRevealCorrection({
    answeredNames: openAnswers.map(row => row.participant_name),
    resetKey: quizQ,
    onReveal: handleShowCorrectionForce,
  })
  const allAnswered = connectedCount > 0 && notAnswered.length === 0

  const handleShowCorrection = async () => {
    if (!allAnswered) return
    await setSharedState({ quiz_show_correction: true }).catch(() => {})
  }

  // Filet de sécurité : si une ancienne réponse (test, répétition, jour
  // précédent sur la même salle) traîne déjà en base pour cette question,
  // le formé tombe direct sur la correction sans avoir pu répondre. Ce
  // bouton efface tout pour cette question précise et repart à zéro.
  const handleResetQuestion = async () => {
    if (!window.confirm('Effacer toutes les réponses de cette question et repartir à zéro ?')) return
    const code = getActiveSessionCode()
    await Promise.all([
      sbDelete('open_answers', `session_code=eq.${encodeURIComponent(code)}&page_id=eq.${encodeURIComponent(pageId)}`),
      sbDelete('quiz_answers', `session_code=eq.${encodeURIComponent(code)}&module_id=eq.optique&question_idx=eq.${quizQ}`),
    ]).catch(() => {})
    setOpenAnswers([])
    setValidated({})
    setValidating({})
    autoValidatedRef.current = new Set()
  }

  // Une réponse texte libre non validée (auto-correction ratée + formateur qui enchaîne
  // trop vite) n'est jamais comptée dans le score final, sans aucun avertissement — un
  // formé qui a bien répondu peut perdre des points en silence. On bloque donc l'avancée
  // tant que des réponses reçues n'ont pas explicitement été validées ✓/✗.
  const pendingCount = openAnswers.filter(row => !validated[row.participant_name]).length
  const confirmSkipPending = () => {
    if (pendingCount === 0) return true
    return window.confirm(
      `${pendingCount} réponse${pendingCount > 1 ? 's' : ''} pas encore validée${pendingCount > 1 ? 's' : ''} ✓/✗.\n\n` +
      `Si vous continuez maintenant, ${pendingCount > 1 ? 'elles compteront' : 'elle comptera'} comme fausse` +
      `${pendingCount > 1 ? 's' : ''} — même si la réponse était juste.\n\nContinuer quand même ?`
    )
  }

  const bg = { minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 40px' }

  return (
    <div style={bg}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Les bases de l&apos;optique — Vue formateur</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {openAnswers.length > 0 && (
            <button onClick={handleResetQuestion} title="Efface les réponses de cette question (utile si un formé tombe direct sur la correction)" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🔄 Réinitialiser la question</button>
          )}
          <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.2)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {OPTIQUE_QUIZ.length}
        </div>
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, maxWidth: 800, margin: '0 auto 12px' }}>{q.question}</div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)', borderRadius: 12, padding: '8px 22px', fontSize: 12, color: 'rgba(0,171,233,0.7)', fontStyle: 'italic' }}>
          Réponse attendue : {q.hint}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, margin: '0 auto', maxHeight: '45vh', overflowY: 'auto', paddingRight: 4 }}>
        {openAnswers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>En attente des réponses des participants…</div>
        ) : openAnswers.map(row => {
          const status = validated[row.participant_name]
          const isValidating = validating[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: status === 'correct' ? 'rgba(34,197,94,0.08)' : status === 'wrong' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === 'correct' ? 'rgba(34,197,94,0.3)' : status === 'wrong' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{row.participant_name}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{row.answer || '—'}</div>
                </div>
                {/* Boutons toujours visibles — modifiables même après une validation automatique */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                  <button onClick={() => handleValidate(row, true)} disabled={isValidating} title="Marquer correct" style={{ background: status === 'correct' ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.15)', border: `1.5px solid ${status === 'correct' ? '#4ade80' : 'rgba(34,197,94,0.4)'}`, color: '#4ade80', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                  <button onClick={() => handleValidate(row, false)} disabled={isValidating} title="Marquer faux" style={{ background: status === 'wrong' ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.15)', border: `1.5px solid ${status === 'wrong' ? '#f87171' : 'rgba(239,68,68,0.4)'}`, color: '#f87171', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <NotAnsweredList notAnswered={notAnswered} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 28, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {pendingCount > 0 && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginRight: 'auto' }}>
            ⚠️ {pendingCount} réponse{pendingCount > 1 ? 's' : ''} pas encore validée{pendingCount > 1 ? 's' : ''}
          </div>
        )}
        {!allAnswered && openAnswers.length > 0 && (
          <button
            onClick={() => { if (window.confirm('Forcer l\'affichage de la correction maintenant ? Les formés qui n\'ont pas encore répondu verront les réponses des autres.')) handleShowCorrectionForce() }}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
          >
            ⚠️ Forcer la correction
          </button>
        )}
        {openAnswers.length > 0 && (
          <button
            onClick={handleShowCorrection}
            disabled={!allAnswered}
            title={!allAnswered ? 'En attente de toutes les réponses — révéler maintenant permettrait à ceux qui n\'ont pas répondu de voir les réponses des autres' : undefined}
            style={{
              background: allAnswered ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${allAnswered ? 'rgba(251,191,36,0.5)' : 'rgba(255,255,255,0.12)'}`,
              color: allAnswered ? '#fbbf24' : 'rgba(255,255,255,0.3)',
              padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700,
              cursor: allAnswered ? 'pointer' : 'default', fontFamily: 'inherit',
            }}
          >
            {allAnswered ? '🎯 Voir la correction' : `⏳ En attente (${openAnswers.length}/${connectedCount || '?'})`}
          </button>
        )}
        {isLast ? (
          <button onClick={() => { if (confirmSkipPending()) onEnd() }} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={async () => { if (!confirmSkipPending()) return; await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false }).catch(() => {}); onNext() }} style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67fa)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Quiz Controller (vue formateur) — switcher de type ──────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const q      = OPTIQUE_QUIZ[quizQ]
  const isLast = quizQ >= OPTIQUE_QUIZ.length - 1
  if (q?.type === 'text-open') {
    return <TextOpenControllerOptique quizQ={quizQ} isLast={isLast} onNext={onNext} onEnd={onEnd} onBack={onBack} />
  }
  return <QuizControllerMCQ quizQ={quizQ} onNext={onNext} onEnd={onEnd} onBack={onBack} />
}

function QuizControllerMCQ({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers]     = useState([])
  const [correctionPhase, setCorrectionPhase] = useState(false)
  const [ordoShown, setOrdoShown]         = useState(false)

  const q      = OPTIQUE_QUIZ[quizQ]
  const isLast = quizQ >= OPTIQUE_QUIZ.length - 1

  // Reset à chaque nouvelle question
  useEffect(() => {
    setCorrectionPhase(false)
    setOrdoShown(false)
    setLiveAnswers([])
  }, [quizQ])

  // Poll réponses live
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

  const handleRevealNow = async () => {
    setCorrectionPhase(true)
    await setSharedState({ quiz_show_correction: true, quiz_ordo_show: false }).catch(() => {})
  }

  const handleToggleOrdo = async () => {
    const next = !ordoShown
    setOrdoShown(next)
    setSharedState({ quiz_ordo_show: next }).catch(() => {})
  }

  const handleNextQ = async () => {
    await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false }).catch(() => {})
    // Vider liveAnswers dans le même batch que correctionPhase=false pour éviter que
    // l'auto-trigger voie les anciennes réponses et re-déclenche quiz_show_correction:true
    setCorrectionPhase(false)
    setLiveAnswers([])
    setOrdoShown(false)
    onNext()
  }

  // Filet de sécurité : efface les réponses de cette question précise
  // (utile si une ancienne réponse d'un test/répétition traîne déjà en base).
  const handleResetQuestion = async () => {
    if (!window.confirm('Effacer toutes les réponses de cette question et repartir à zéro ?')) return
    const code = getActiveSessionCode()
    await sbDelete('quiz_answers', `session_code=eq.${encodeURIComponent(code)}&module_id=eq.optique&question_idx=eq.${quizQ}`).catch(() => {})
    setLiveAnswers([])
  }

  const handleTerminate = async () => {
    await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false }).catch(() => {})
    onBack()
  }

  const handleEnd = async () => {
    await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false }).catch(() => {})
    onEnd()
  }

  const answered       = liveAnswers.length
  const correctArr     = Array.isArray(q.correct) ? q.correct : [q.correct]
  const counts         = (q.options || []).map((_, i) => liveAnswers.filter(r => r.answer_idx === i).length)
  const wrongAnswerers = liveAnswers.filter(r => !r.is_correct)
  const correctCount   = liveAnswers.filter(r => r.is_correct).length

  // Passe automatiquement à la correction dès que tous les formés actuellement
  // connectés ont répondu — comparaison par nom (pas juste un compte) pour ne
  // pas se faire piéger par une vieille réponse traînant en base (voir le
  // commentaire sur handleRevealNow un peu plus haut).
  const { connectedCount, notAnswered } = useAutoRevealCorrection({
    answeredNames: liveAnswers.map(r => r.collaborateur),
    resetKey: quizQ,
    enabled: !correctionPhase,
    onReveal: handleRevealNow,
  })

  const bg = { minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }
  const headerLogo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Les bases de l&apos;optique — Vue formateur</span>
    </div>
  )
  const btnTerminer = (
    <button onClick={handleTerminate} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
      ✕ Terminer
    </button>
  )

  // ── PHASE CORRECTION ─────────────────────────────────────────────
  if (correctionPhase) {
    return (
      <div style={bg}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {headerLogo}
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 20, padding: '6px 20px', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
            ✓ Correction — Q{quizQ + 1} / {OPTIQUE_QUIZ.length}
          </div>
          {btnTerminer}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
          {/* Stats globales */}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 16, padding: '10px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#4ade80' }}>{correctCount}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>bonne{correctCount !== 1 ? 's' : ''} réponse{correctCount !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 16, padding: '10px 28px', textAlign: 'center' }}>
              <div style={{ fontSize: 38, fontWeight: 900, color: '#f87171' }}>{wrongAnswerers.length}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>mauvaise{wrongAnswerers.length !== 1 ? 's' : ''} réponse{wrongAnswerers.length !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Question + ordonnance */}
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.35, maxWidth: 700, alignSelf: 'center' }}>
            {q.question}
          </div>
          <OrdonnanceDisplay ordonnance={q.ordonnance} hideLabels={q.hideLabels} />

          {/* Bonne(s) réponse(s) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'center', maxWidth: 640, width: '100%' }}>
            {correctArr.map(ci => (
              <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 16, padding: '12px 24px' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#052e16', flexShrink: 0 }}>
                  {'ABCD'[ci]}
                </div>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>{q.options[ci]}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.2)', padding: '2px 10px', borderRadius: 20, flexShrink: 0 }}>✓ Bonne réponse</span>
              </div>
            ))}
          </div>

          {/* Qui s'est trompé — confidentiel */}
          {wrongAnswerers.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '14px 20px', maxWidth: 640, alignSelf: 'center', width: '100%' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,100,80,0.7)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
                🔒 Confidentiel — visible uniquement ici
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {wrongAnswerers.map(r => (
                  <div key={r.collaborateur} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
                    <span style={{ color: '#f87171', fontWeight: 600 }}>{r.collaborateur}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>→</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {r.answer_idx != null ? `${'ABCD'[r.answer_idx]} — ${q.options[r.answer_idx]}` : '?'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer boutons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {q.ordonnance ? (
            <button onClick={handleToggleOrdo} style={{ background: ordoShown ? 'rgba(124,58,237,0.25)' : 'rgba(124,58,237,0.1)', border: `1px solid ${ordoShown ? '#a78bfa' : 'rgba(124,58,237,0.4)'}`, color: '#a78bfa', padding: '12px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {ordoShown ? '■ Masquer l\'ordonnance sur TV' : '📋 Réafficher l\'ordonnance sur TV'}
            </button>
          ) : <div />}
          {isLast ? (
            <button onClick={handleEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>
              ✓ Terminer le quiz
            </button>
          ) : (
            <button onClick={handleNextQ} style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67fa)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(124,58,237,0.45)' }}>
              Question suivante →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── PHASE QUESTION (votes en direct) ─────────────────────────────
  return (
    <div style={bg}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        {headerLogo}
        <div style={{ display: 'flex', gap: 10 }}>
          {liveAnswers.length > 0 && (
            <button onClick={handleResetQuestion} title="Efface les réponses de cette question (utile si un formé tombe direct sur la correction)" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>🔄 Réinitialiser</button>
          )}
          {btnTerminer}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {OPTIQUE_QUIZ.length}
        </div>
      </div>

      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: q.ordonnance ? 20 : 36, lineHeight: 1.3, maxWidth: 800, alignSelf: 'center' }}>
        {q.question}
      </div>
      <OrdonnanceDisplay ordonnance={q.ordonnance} hideLabels={q.hideLabels} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        {(q.options || []).map((opt, i) => {
          const count = counts[i]
          const isCorrect = correctArr.includes(i)
          const pct = answered > 0 ? (count / answered) * 100 : 0
          return (
            <div key={i} style={{ background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: OPTION_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{'ABCD'[i]}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt}</span>
                  {isCorrect && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 10px', borderRadius: 20 }}>✓</span>}
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  {count}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 4 }}>vote{count > 1 ? 's' : ''}</span>
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: OPTION_COLORS[i], transition: 'width .5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      <NotAnsweredList notAnswered={notAnswered} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginRight: 6 }}>{answered}</span>
          {connectedCount > 0
            ? <><span style={{ color: 'rgba(255,255,255,0.5)' }}>/ {connectedCount}</span> ont répondu</>
            : 'ont répondu'
          }
        </div>
        <button onClick={handleRevealNow} style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {answered > 0 ? 'Révéler les réponses →' : 'Passer (sans réponse) →'}
        </button>
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
    await setSharedState({ quiz_final_phase: next ? 'rate' : 'recap' }).catch(() => {})
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
export default function ModuleOptique({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [quizLaunched, setQuizLaunched] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [quizFinalPhase, setQuizFinalPhase] = useState(null) // 'podium' | 'rate' | null
  const [showGroupResults, setShowGroupResults] = useState(false)

  const trainerAvatar = TRAINER_AVATARS[(pName || '').toLowerCase()] || TRAINER_AVATARS.kevin

  // Dès que le Lobby s'affiche → on signale le module en attente de lancement
  useEffect(() => {
    sbUpdate('sessions', { active_module: 'optique', module_page: -1 }, `code=eq.${getActiveSessionCode()}`).catch(() => {})
  }, [])

  // Sync Supabase seulement quand le module est lancé
  useEffect(() => {
    if (started) {
      sbUpdate('sessions', { active_module: 'optique', module_page: pageIndex }, `code=eq.${getActiveSessionCode()}`).catch(() => {})
    }
  }, [pageIndex, started])

  const handleBack = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    // Sans ça, quiz_show_correction peut rester bloqué à true si on quitte
    // pendant qu'une correction est affichée — le prochain quiz lancé dans
    // cette salle en hériterait (formés jetés direct sur la correction).
    await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false }).catch(() => {})
    onBack()
  }

  const handleLaunchQuiz = async () => {
    try {
      await sbUpdate('sessions', { active_module: 'optique', module_page: 100 }, `code=eq.${getActiveSessionCode()}`)
      await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: null, quiz_show_correction: false, quiz_ordo_show: false })
      await clearQuizStarts(getActiveSessionCode(), 'optique').catch(() => {})
    } catch { /* best-effort */ }
    setQuizQ(0)
    setQuizLaunched(true)
    setQuizFinalPhase(null)
  }

  // Podium interstitiel toutes les 5 questions supprimé (faisait planter
  // l'appli) — on enchaîne directement les questions, seul le podium final
  // reste (cf. handleEndQuiz). Le classement en temps réel, désormais privé,
  // s'affiche sur le téléphone de chaque formé après chaque correction.
  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await sbUpdate('sessions', { active_module: 'optique', module_page: 100 + next }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(next)
    setSharedState({ quiz_interstitial_q: null }).catch(() => {})
  }

  const handleEndQuiz = async () => {
    try {
      await sbUpdate('sessions', { active_module: 'optique', module_page: 200 }, `code=eq.${getActiveSessionCode()}`)
      await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: 'podium' })
    } catch { /* best-effort */ }
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
    try {
      await setSharedState({ quiz_final_phase: null, quiz_show_correction: false, quiz_ordo_show: false })
      await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    } catch { /* best-effort */ }
    ;(onTerminate ?? onBack)()
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
      {page.type === 'entrainement-oral'  && <EntrainementOralPage  page={page} {...navProps} />}
    </>
  )
}
