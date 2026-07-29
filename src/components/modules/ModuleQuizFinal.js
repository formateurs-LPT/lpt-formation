'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState, fetchOpenAnswers } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { QUIZ_FINAL_QUESTIONS } from '@/lib/quizFinalData'

// quiz_final_phase values (same mechanism as ModuleOptique):
// null → TV shows TVGroupResults
// 'podium' → TV shows TVQuizFinalPodium
// 'rate'   → TV shows TVQuizRateReveal

const MODULE_ID = 'quiz-final'
const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

const STYLES = `
  @keyframes finalFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

// ── Contrôleur questions texte libre ─────────────────────────────
function TextOpenController({ quizQ, isLast, onNext, onEnd }) {
  const q = QUIZ_FINAL_QUESTIONS[quizQ]
  const [answers, setAnswers] = useState([])
  const [validations, setValidations] = useState({})

  useEffect(() => {
    setValidations({})
    const code = getActiveSessionCode()
    const poll = async () => {
      const rows = await fetchOpenAnswers(code, `${MODULE_ID}:${quizQ}`)
      setAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  const handleValidate = async (name, isCorrect) => {
    try {
      await saveModuleQuizAnswer({
        sessionCode: getActiveSessionCode(),
        moduleId: MODULE_ID,
        questionIdx: quizQ,
        collaborateur: name,
        answerIdx: 0,
        isCorrect,
      })
      setValidations(v => ({ ...v, [name]: isCorrect }))
    } catch { /* best-effort */ }
  }

  const validatedCount = Object.keys(validations).length
  const correctCount = Object.values(validations).filter(Boolean).length

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz final — Réponse libre</span>
        </div>
        <div style={{
          background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)',
          borderRadius: 16, padding: '5px 18px', fontSize: 12, fontWeight: 700, color: '#c9a227',
        }}>Q{quizQ + 1} / {QUIZ_FINAL_QUESTIONS.length}</div>
      </div>

      {/* Question */}
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10, lineHeight: 1.3 }}>{q.question}</div>

      {/* Hint formateur */}
      <div style={{
        background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
        borderRadius: 12, padding: '10px 16px', marginBottom: 20,
        fontSize: 13, color: '#c9a227', fontStyle: 'italic',
      }}>
        💡 Réponse attendue : {q.hint}
      </div>

      {/* Compteur */}
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 4 }}>{answers.length}</span>
        réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''} &nbsp;·&nbsp;
        <span style={{ color: '#4ade80', fontWeight: 700 }}>{correctCount} ✓</span>&nbsp;&nbsp;
        <span style={{ color: '#ef4444', fontWeight: 700 }}>{validatedCount - correctCount} ✗</span>
      </div>

      {/* Liste des réponses */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', marginBottom: 20 }}>
        {answers.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '40px 0' }}>
            En attente des réponses…
          </div>
        )}
        {answers.map(row => {
          const v = validations[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: v === true ? 'rgba(34,197,94,0.08)' : v === false ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${v === true ? 'rgba(34,197,94,0.3)' : v === false ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12,
              animation: 'finalFadeIn .3s ease',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{row.participant_name}</div>
                <div style={{ fontSize: 15, color: '#fff', fontWeight: 600 }}>{row.answer}</div>
              </div>
              <button onClick={() => handleValidate(row.participant_name, true)} style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: v === true ? '#16a34a' : 'rgba(34,197,94,0.15)',
                fontSize: 18, fontFamily: 'inherit', transition: 'background .2s',
              }}>✓</button>
              <button onClick={() => handleValidate(row.participant_name, false)} style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: v === false ? '#dc2626' : 'rgba(239,68,68,0.15)',
                fontSize: 18, fontFamily: 'inherit', transition: 'background .2s',
              }}>✗</button>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {isLast ? (
          <button onClick={onEnd} style={{
            background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none',
            color: '#fff', padding: '14px 36px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 24px rgba(34,197,94,0.4)',
          }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #c9a227, #e0b830)', border: 'none',
            color: '#fff', padding: '14px 36px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 24px rgba(201,162,39,0.45)',
          }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Quiz Controller (vue formateur) ───────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers] = useState([])
  const q = QUIZ_FINAL_QUESTIONS[quizQ]
  const isLast = quizQ >= QUIZ_FINAL_QUESTIONS.length - 1

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.${MODULE_ID}&question_idx=eq.${quizQ}`
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz final — Vue formateur</span>
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
          background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#c9a227', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>Question {quizQ + 1} / {QUIZ_FINAL_QUESTIONS.length}</div>
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
          const isCorrect = Array.isArray(q.correct) ? q.correct.includes(i) : i === q.correct
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
                  }}>{'ABCD'[i]}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt}</span>
                  {isCorrect && (
                    <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 10px', borderRadius: 20 }}>
                      ✓ Bonne réponse
                    </span>
                  )}
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
            background: 'linear-gradient(135deg, #c9a227, #e0b830)',
            border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 6px 24px rgba(201,162,39,0.45)',
          }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Group Results View ─────────────────────────────────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('podium') // 'podium' | 'rate' | 'recap'

  const showRate = async () => {
    await setSharedState({ quiz_final_phase: 'rate' })
    setPhase('rate')
  }

  const hideRate = async () => {
    await setSharedState({ quiz_final_phase: null })
    setPhase('recap')
  }

  useEffect(() => {
    const fetchAnswers = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.${MODULE_ID}`
      )
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
  }, [])

  const participantCount = [...new Set((answers || []).map(r => r.collaborateur))].length

  const questionStats = QUIZ_FINAL_QUESTIONS.map((q, idx) => {
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz final</span>
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
          background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.35)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#c9a227', letterSpacing: 1.5, textTransform: 'uppercase',
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
        {phase === 'podium' && (
          <button onClick={showRate} style={{
            background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.4)',
            color: '#c9a227', padding: '14px 28px', borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            🎯 Révéler le taux de réussite
          </button>
        )}
        {phase === 'rate' && (
          <button onClick={hideRate} style={{
            background: 'rgba(201,162,39,0.2)', border: '1px solid #c9a227',
            color: '#c9a227', padding: '14px 28px', borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            📊 Afficher les résultats groupe
          </button>
        )}
        {phase === 'recap' && <div />}
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

// ── Lobby ──────────────────────────────────────────────────────────
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
        <div style={{ fontSize: 72, marginBottom: 20 }}>🏆</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Quiz de fin de formation
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
          Le grand quiz final
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
          Trame d&apos;accueil · Troubles visuels · Ordonnances<br />
          Offres · Verre progressif · Remboursements
        </p>
        <button onClick={onStart} style={{
          background: 'linear-gradient(135deg, #c9a227, #e0b830)',
          border: 'none', color: '#fff', padding: '16px 48px',
          borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(201,162,39,0.45)', fontFamily: 'inherit',
        }}>▶ Lancer le quiz</button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>{QUIZ_FINAL_QUESTIONS.length} questions · ~20 minutes</p>
      </div>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────────────
export default function ModuleQuizFinal({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [quizInterstitial, setQuizInterstitial] = useState(false)
  const [showGroupResults, setShowGroupResults] = useState(false)

  useEffect(() => {
    const init = async () => {
      await setSharedState({ quiz_final_phase: null, quiz_show_correction: false }).catch(() => {})
      await sbUpdate('sessions', { active_module: MODULE_ID, module_page: -1 }, `code=eq.${getActiveSessionCode()}`)
    }
    init()
  }, [])

  const handleBack = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`) } catch { /* best-effort */ }
    onBack()
  }

  const handleStart = async () => {
    await setSharedState({ quiz_show_correction: false, quiz_interstitial_q: null, quiz_final_phase: null })
    await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 100 }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(0)
    setStarted(true)
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await setSharedState({ quiz_show_correction: false }).catch(() => {})
    await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 100 + next }, `code=eq.${getActiveSessionCode()}`)
    if (next % 5 === 0 && next < QUIZ_FINAL_QUESTIONS.length) {
      await setSharedState({ quiz_interstitial_q: next }).catch(() => {})
      setQuizInterstitial(true)
    } else {
      await setSharedState({ quiz_interstitial_q: null }).catch(() => {})
    }
    setQuizQ(next)
  }

  const handleContinueInterstitial = async () => {
    setQuizInterstitial(false)
    await setSharedState({ quiz_interstitial_q: null })
  }

  const handleEndQuiz = async () => {
    try {
      await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 200 }, `code=eq.${getActiveSessionCode()}`)
      await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: 'podium' }).catch(() => {})
    } catch { /* best-effort */ }
    setShowGroupResults(true)
  }

  const handleTerminateModule = async () => {
    try {
      await setSharedState({ quiz_final_phase: 'ended' }).catch(() => {})
      await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    } catch { /* best-effort */ }
    onBack()
  }

  if (!started) return (
    <>
      <style>{STYLES}</style>
      <Lobby onStart={handleStart} onBack={handleBack} />
    </>
  )

  if (showGroupResults) return (
    <>
      <style>{STYLES}</style>
      <GroupResultsView onTerminate={handleTerminateModule} />
    </>
  )

  if (quizInterstitial) return (
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
          background: 'linear-gradient(135deg, #c9a227, #e0b830)',
          border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
          fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 24px rgba(201,162,39,0.45)',
        }}>
          Continuer → Q{quizQ + 1}
        </button>
      </div>
    </>
  )

  const isLast = quizQ >= QUIZ_FINAL_QUESTIONS.length - 1
  const isTextOpen = QUIZ_FINAL_QUESTIONS[quizQ]?.type === 'text-open'

  return (
    <>
      <style>{STYLES}</style>
      {isTextOpen ? (
        <TextOpenController quizQ={quizQ} isLast={isLast} onNext={handleNextQuestion} onEnd={handleEndQuiz} />
      ) : (
        <QuizController
          quizQ={quizQ}
          onNext={handleNextQuestion}
          onEnd={handleEndQuiz}
          onBack={handleEndQuiz}
        />
      )}
    </>
  )
}
