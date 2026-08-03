'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { fetchOnlineParticipantCount } from '@/lib/participantPresence'
import { NextPagePreview } from '@/lib/trainerPreview'
import { PDMAnimationSVG, PDM_ANIM_STEP_LABELS } from '@/lib/pdmAnimationSvg'
import TrainerAvatar from '@/components/TrainerAvatar'
import { PDM_PAGES as PAGES, PDM_QUIZ } from '@/lib/modulesData'
import { useIsMobile } from '@/lib/useIsMobile'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── Keyframes injectés une seule fois ─────────────────────────────
const STYLES = `
  @keyframes pdmFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-16px) scale(1.04); }
  }
  @keyframes pdmHaloPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.15); }
  }
  @keyframes pdmAvatarPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(245,158,11,0.4); }
    50% { box-shadow: 0 4px 36px rgba(245,158,11,0.9); }
  }
  @keyframes pdmParticleFloat {
    from { transform: translateY(0px); opacity: 0.2; }
    to   { transform: translateY(-14px); opacity: 0.5; }
  }
`

// ── Illustration slide 1 : photo LPTVISION ────────────────────────
function PDMIntroImage({ color, src }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 520, height: 520, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}35 0%, transparent 70%)`,
        animation: 'pdmHaloPulse 3.5s ease-in-out infinite',
      }} />
      <div style={{ animation: 'pdmFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <Image
          src={src || '/assets/lptvision-tangentes.png'}
          alt="LPTVISION"
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

// ── Illustration slides étapes : grand emoji avec glow ────────────
function PDMStepIcon({ emoji, color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {/* Cercle glow */}
      <div style={{
        position: 'absolute', width: 320, height: 320, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 65%)`,
        animation: 'pdmHaloPulse 3.5s ease-in-out infinite',
      }} />
      {/* Cercle fond */}
      <div style={{
        width: 220, height: 220, borderRadius: '50%',
        background: `${color}18`,
        border: `2px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pdmFloat 4s ease-in-out infinite',
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontSize: 120, lineHeight: 1 }}>{emoji}</span>
      </div>
    </div>
  )
}

// ── Page de contenu ───────────────────────────────────────────────
function ContentPage({ page, pName, onPrev, onNext, onBack, isFirst, isLast, pageIndex, total, quizLaunched, onLaunchQuiz, nextPage }) {
  const [entered, setEntered] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  // Determine right-side illustration
  const hasImage = !!page.image
  const hasIcon  = !!page.icon

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
            animation: `pdmParticleFloat ${3 + i * 0.5}s ease-in-out ${i * 0.25}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* Topbar du module */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', position: 'relative', zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · Prises de mesures</span>
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
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .2s', letterSpacing: .3,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          >✕ Quitter</button>
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
          {hasImage
            ? <PDMIntroImage color={page.color} src={page.image} />
            : <PDMStepIcon emoji={page.icon || page.points[0]?.emoji} color={page.color} />
          }
        </div>
      </div>

      {/* Boutons navigation */}
      <div style={{ padding: isMobile ? '0 14px calc(env(safe-area-inset-bottom,0px) + 20px)' : '0 340px 0 48px', position: 'relative', zIndex: 20, flexShrink: 0 }}>
        {!isMobile && <NextPagePreview nextPage={nextPage} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: isMobile ? 0 : 28, gap: isMobile ? 10 : 0 }}>
        <button
          onClick={onPrev}
          style={{
            background: isFirst ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
            padding: isMobile ? '16px 0' : '12px 24px',
            borderRadius: 12, fontSize: isMobile ? 16 : 14, fontWeight: 600,
            cursor: isFirst ? 'default' : 'pointer', transition: 'all .2s',
            fontFamily: 'inherit', flex: isMobile ? 1 : undefined,
          }}
          disabled={isFirst}
        >← Précédent</button>

        {isLast ? (
          quizLaunched ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: isMobile ? 2 : undefined }}>
              <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>✓ Quiz envoyé</span>
              <button onClick={onBack} style={{
                background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)',
                color: '#ff6b6b', padding: isMobile ? '16px 0' : '12px 24px', borderRadius: 12,
                fontSize: isMobile ? 16 : 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                flex: isMobile ? 1 : undefined,
              }}>Terminer →</button>
            </div>
          ) : (
            <button onClick={onLaunchQuiz} style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              border: 'none', color: '#fff',
              padding: isMobile ? '16px 0' : '12px 32px',
              borderRadius: 12, fontSize: isMobile ? 16 : 15, fontWeight: 700,
              cursor: 'pointer', transition: 'all .2s',
              boxShadow: '0 6px 24px rgba(245,158,11,0.5)',
              fontFamily: 'inherit', flex: isMobile ? 2 : undefined, textAlign: 'center',
            }}>🧠 Lancer le quiz →</button>
          )
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #d97706, #f59e0b)',
            border: 'none', color: '#fff',
            padding: isMobile ? '16px 0' : '12px 32px',
            borderRadius: 12, fontSize: isMobile ? 16 : 15, fontWeight: 700,
            cursor: 'pointer', transition: 'all .2s',
            boxShadow: '0 6px 24px rgba(245,158,11,0.5)',
            fontFamily: 'inherit', flex: isMobile ? 2 : undefined, textAlign: 'center',
          }}>Suivant →</button>
        )}
        </div>
      </div>

    </div>
  )
}

// ── Quiz Controller (vue formateur) ──────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers] = useState([])
  const [connectedCount, setConnectedCount] = useState(0)
  const [correctionPhase, setCorrectionPhase] = useState(false)
  const q = PDM_QUIZ[quizQ]
  const isLast = quizQ >= PDM_QUIZ.length - 1

  useEffect(() => {
    setCorrectionPhase(false)
  }, [quizQ])

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.pdm&question_idx=eq.${quizQ}`
      )
      setLiveAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  useEffect(() => {
    const poll = async () => setConnectedCount(await fetchOnlineParticipantCount(getActiveSessionCode()))
    poll()
    const t = setInterval(poll, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!correctionPhase && connectedCount > 0 && liveAnswers.length >= connectedCount) {
      setCorrectionPhase(true)
      setSharedState({ quiz_show_correction: true }).catch(() => {})
    }
  }, [liveAnswers.length, connectedCount, correctionPhase])

  const handleRevealNow = async () => {
    setCorrectionPhase(true)
    await setSharedState({ quiz_show_correction: true }).catch(() => {})
  }

  const handleNextQ = async () => {
    setCorrectionPhase(false)
    await onNext()
  }

  const total = liveAnswers.length
  const counts = q.options.map((_, i) => liveAnswers.filter(r => r.answer_idx === i).length)
  const wrongAnswerers = liveAnswers.filter(r => !r.is_correct)
  const correctCount = liveAnswers.filter(r => r.is_correct).length

  const headerLogo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Prises de mesures — Vue formateur</span>
    </div>
  )
  const btnTerminer = (
    <button onClick={onBack} style={{
      background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)',
      color: '#ff6b6b', padding: '7px 16px', borderRadius: 10,
      fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    }}>✕ Terminer</button>
  )

  if (correctionPhase) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          {headerLogo}
          <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 20, padding: '6px 20px', fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
            ✓ Correction — Q{quizQ + 1} / {PDM_QUIZ.length}
          </div>
          {btnTerminer}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
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

          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.35, maxWidth: 700, alignSelf: 'center' }}>
            {q.question}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 16, padding: '12px 24px', alignSelf: 'center', maxWidth: 640, width: '100%' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#052e16', flexShrink: 0 }}>
              {'ABCD'[q.correct]}
            </div>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#4ade80' }}>{q.options[q.correct]}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.2)', padding: '2px 10px', borderRadius: 20, flexShrink: 0 }}>✓ Bonne réponse</span>
          </div>

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

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {isLast ? (
            <button onClick={onEnd} style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14,
              fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(34,197,94,0.4)',
            }}>✓ Terminer le quiz</button>
          ) : (
            <button onClick={handleNextQ} style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b)',
              border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14,
              fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(245,158,11,0.45)',
            }}>Question suivante →</button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        {headerLogo}
        {btnTerminer}
      </div>

      {/* Badge question */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#fbbf24', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>Question {quizQ + 1} / {PDM_QUIZ.length}</div>
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
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: OPTION_COLORS[i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff',
                  }}>{'ABCD'[i]}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt}</span>
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>
                  {count}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 4 }}>vote{count > 1 ? 's' : ''}</span>
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${pct}%`,
                  background: OPTION_COLORS[i],
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
          {connectedCount > 0
            ? <><span style={{ color: 'rgba(255,255,255,0.5)' }}>/ {connectedCount}</span> ont répondu</>
            : (total !== 1 ? 'participants ont répondu' : 'participant a répondu')
          }
        </div>
        {total > 0 && (
          <button onClick={handleRevealNow} style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)',
            color: '#4ade80', padding: '12px 24px', borderRadius: 12,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Révéler les réponses →</button>
        )}
      </div>
    </div>
  )
}

// ── Page animation PDM (formateur) ───────────────────────────────
const PDM_ANIM_SCRIPTS = [
  "Voila un verre brut, avant taillage. Il est grand et rond.",
  "Ce point est le centre optique du verre — l'endroit ou la qualite est maximale.",
  "Le but des PDM : aligner ce point avec la pupille du client une fois le verre taille.",
  "Notre client porte la monture. Regardez la position de ses pupilles.",
  "On mesure l'ecart pupillaire et la hauteur de montage — deux valeurs essentielles.",
  "Le verre se positionne devant l'oeil. Le point central doit s'aligner avec la pupille.",
  "On trace le contour interieur de la monture sur le verre — c'est le guide de taillage.",
  "Le verre retourne en taillage. Il est decoupe pour ne garder que la forme utile.",
  "Le verre taille s'insere parfaitement. Centre optique face a la pupille.",
]

function PDMAnimationTrainer({ page, pName, pageIndex, total, onPrev, onNext, onBack, nextPage }) {
  const [animStep, setAnimStep] = useState(0)
  const MAX_STEP = 8
  const isMobile = useIsMobile()

  useEffect(() => {
    sbUpdate('sessions', { module_page: 1000 + animStep }, 'code=eq.' + getActiveSessionCode())
  }, [animStep])

  const handleNext = () => {
    if (animStep < MAX_STEP) setAnimStep(s => s + 1)
    else onNext()
  }

  const handlePrev = () => {
    if (animStep > 0) setAnimStep(s => s - 1)
    else onPrev()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Particules deco */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', width: 3, height: 3, borderRadius: '50%',
            background: page.color, opacity: 0.15 + (i % 3) * 0.08,
            left: `${5 + i * 9}%`, top: `${20 + (i % 4) * 20}%`,
            animation: `pdmParticleFloat ${3 + i * 0.5}s ease-in-out ${i * 0.25}s infinite alternate`,
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · Prises de mesures</span>
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
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>&#x2715; Quitter</button>
        </div>
      </div>

      {/* Titre de la page */}
      <div style={{ padding: '0 48px 4px', position: 'relative', zIndex: 5, flexShrink: 0 }}>
        <div style={{
          display: 'inline-block', background: `${page.color}20`,
          border: `1px solid ${page.color}45`, borderRadius: 20,
          padding: '3px 12px', fontSize: 11, fontWeight: 700,
          color: page.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
        }}>Animation</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '4px 0 0', lineHeight: 1.2 }}>
          {page.titre}
        </h2>
      </div>

      {/* Zone SVG */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 40px 0', position: 'relative', zIndex: 5 }}>
        <PDMAnimationSVG animStep={animStep} />
      </div>

      {/* Progression etapes */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 7, padding: '6px 0 2px', position: 'relative', zIndex: 10 }}>
        {Array(MAX_STEP + 1).fill(0).map((_, i) => (
          <div key={i} style={{
            width: i === animStep ? 20 : 6, height: 6, borderRadius: 3,
            background: i <= animStep ? page.color : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s',
          }} />
        ))}
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingBottom: 4, position: 'relative', zIndex: 10 }}>
        {PDM_ANIM_STEP_LABELS[animStep]} &nbsp;·&nbsp; etape {animStep + 1} / {MAX_STEP + 1}
      </div>

      {/* Navigation */}
      <div style={{ padding: isMobile ? '0 14px calc(env(safe-area-inset-bottom,0px) + 20px)' : '4px 340px 0 48px', position: 'relative', zIndex: 20, flexShrink: 0 }}>
        {!isMobile && animStep === MAX_STEP && <NextPagePreview nextPage={nextPage} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: isMobile ? 0 : 28, gap: isMobile ? 10 : 0 }}>
          <button onClick={handlePrev} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: animStep === 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.7)',
            padding: isMobile ? '16px 0' : '11px 22px', borderRadius: 12,
            fontSize: isMobile ? 16 : 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            flex: isMobile ? 1 : undefined,
          }}>
            {animStep === 0 ? '← Precedent' : '← Etape prec.'}
          </button>
          <button onClick={handleNext} style={{
            background: `linear-gradient(135deg, #d97706, ${page.color})`,
            border: 'none', color: '#fff',
            padding: isMobile ? '16px 0' : '11px 30px', borderRadius: 12,
            fontSize: isMobile ? 16 : 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: `0 6px 24px ${page.color}40`,
            flex: isMobile ? 2 : undefined, textAlign: 'center',
          }}>
            {animStep < MAX_STEP
              ? isMobile ? `Suivant (${animStep + 1}/${MAX_STEP})` : `Suivant → (${animStep + 1}/${MAX_STEP})`
              : 'Page suivante →'}
          </button>
        </div>
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

      <div style={{ textAlign: 'center', maxWidth: 500, padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={180} height={68} style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Module de formation
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Prises de mesures · LPTVISION</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
          5 étapes · ~8 minutes
        </p>
        <button onClick={onStart} style={{
          background: 'linear-gradient(135deg, #d97706, #f59e0b)',
          border: 'none', color: '#fff', padding: '16px 48px',
          borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(245,158,11,0.45)', fontFamily: 'inherit',
        }}>▶ Lancer le module</button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>5 pages · ~8 minutes</p>
      </div>
    </div>
  )
}

// ── Group Results View (vue formateur après quiz) ─────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnswers = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.pdm`
      )
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
  }, [])

  const participantNames = [...new Set((answers || []).map(r => r.collaborateur))]
  const participantCount = participantNames.length

  const questionStats = PDM_QUIZ.map((q, idx) => {
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz · Prises de mesures</span>
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
          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: 1.5, textTransform: 'uppercase',
          marginBottom: 12,
        }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d'erreur décroissant</p>
      </div>

      {/* Question cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, alignSelf: 'center', width: '100%' }}>
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
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>d'erreurs</div>
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

      {/* Footer — terminate button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32, gap: 16 }}>
        <button onClick={onTerminate} style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14,
          fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 24px rgba(220,38,38,0.4)',
        }}>✓ Terminer le module</button>
        <div style={{
          fontSize: 13, color: 'rgba(255,255,255,0.45)',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 12, padding: '8px 20px',
        }}>
          💡 C'est le moment de pratiquer avec LPTVISION !
        </div>
      </div>
    </div>
  )
}

// ── Export principal ───────────────────────────────────────────────
export default function ModulePDM({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [quizLaunched, setQuizLaunched] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [showGroupResults, setShowGroupResults] = useState(false)

  const handleLaunchQuiz = async () => {
    await sbUpdate('sessions', { module_page: 100 }, 'code=eq.' + getActiveSessionCode())
    setQuizQ(0)
    setQuizLaunched(true)
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await setSharedState({ quiz_show_correction: false }).catch(() => {})
    await sbUpdate('sessions', { module_page: 100 + next }, 'code=eq.' + getActiveSessionCode())
    setQuizQ(next)
  }

  const handleEndQuiz = async () => {
    await setSharedState({ quiz_show_correction: false }).catch(() => {})
    try { await sbUpdate('sessions', { active_module: 'pdm', module_page: 200 }, 'code=eq.' + getActiveSessionCode()) } catch { /* best-effort */ }
    setShowGroupResults(true)
  }

  const handleTerminateModule = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()) } catch { /* best-effort */ }
    onBack()
  }

  // Write to Supabase when module starts
  useEffect(() => {
    if (started) {
      sbUpdate('sessions', { active_module: 'pdm', module_page: 0 }, 'code=eq.' + getActiveSessionCode()).catch(() => {})
    }
  }, [started])

  // Write to Supabase when page changes (animation page uses 1000+ range)
  useEffect(() => {
    if (started) {
      const p = PAGES[pageIndex]
      const mpValue = p?.type === 'pdm-animation' ? 1000 : pageIndex
      sbUpdate('sessions', { module_page: mpValue }, 'code=eq.' + getActiveSessionCode()).catch(() => {})
    }
  }, [pageIndex, started])

  const handleBack = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()) } catch { /* best-effort */ }
    onBack()
  }

  if (!started) return <Lobby onStart={() => setStarted(true)} onBack={handleBack} />

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

  const currentPage = PAGES[pageIndex]
  const nextPage    = PAGES[pageIndex + 1] ?? null
  const navProps = {
    page: currentPage, pName, pageIndex, total: PAGES.length,
    onPrev: () => setPageIndex(i => Math.max(0, i - 1)),
    onNext: () => setPageIndex(i => i + 1),
    onBack: handleBack, nextPage,
  }

  if (currentPage?.type === 'pdm-animation') {
    return (
      <>
        <style>{STYLES}</style>
        <PDMAnimationTrainer {...navProps} />
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>
      <ContentPage
        {...navProps}
        isFirst={pageIndex === 0}
        isLast={pageIndex === PAGES.length - 1}
        quizLaunched={quizLaunched}
        onLaunchQuiz={handleLaunchQuiz}
      />
    </>
  )
}
