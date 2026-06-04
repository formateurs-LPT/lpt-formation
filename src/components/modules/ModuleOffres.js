'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, SESSION_CODE } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { OFFRES_QUIZ } from '@/lib/modulesData'
import { TRAINER_AVATARS } from '@/lib/constants'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── Quiz Controller (vue formateur) ──────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers] = useState([])
  const q = OFFRES_QUIZ[quizQ]
  const isLast = quizQ >= OFFRES_QUIZ.length - 1

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${SESSION_CODE}&module_id=eq.offres&question_idx=eq.${quizQ}`
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Les offres — Vue formateur</span>
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
        }}>Question {quizQ + 1} / {OFFRES_QUIZ.length}</div>
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

  useEffect(() => {
    const fetchAnswers = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${SESSION_CODE}&module_id=eq.offres`
      )
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
  }, [])

  const participantNames = [...new Set((answers || []).map(r => r.collaborateur))]
  const participantCount = participantNames.length

  const questionStats = OFFRES_QUIZ.map((q, idx) => {
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz · Les offres</span>
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
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
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
          Module de formation · Journée 2
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
          Les offres
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
          Suprême · 1=1 · Classique · Pack Plan<br />
          Maîtriser les parcours d&apos;achat et les proposer au bon client
        </p>
        <button onClick={onStart} style={{
          background: 'linear-gradient(135deg, #0089ba, #00abe9)',
          border: 'none', color: '#fff', padding: '16px 48px',
          borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,171,233,0.45)', fontFamily: 'inherit',
        }}>▶ Lancer le quiz</button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>5 questions · ~5 minutes</p>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function ModuleOffres({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [showGroupResults, setShowGroupResults] = useState(false)

  // Signale le module en attente dès le Lobby
  useEffect(() => {
    sbUpdate('sessions', { active_module: 'offres', module_page: -1 }, `code=eq.${SESSION_CODE}`)
  }, [])

  const handleBack = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${SESSION_CODE}`)
    onBack()
  }

  const handleStart = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 100 }, `code=eq.${SESSION_CODE}`)
    setQuizQ(0)
    setStarted(true)
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await sbUpdate('sessions', { active_module: 'offres', module_page: 100 + next }, `code=eq.${SESSION_CODE}`)
    setQuizQ(next)
  }

  const handleEndQuiz = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 200 }, `code=eq.${SESSION_CODE}`)
    setShowGroupResults(true)
  }

  const handleTerminateModule = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${SESSION_CODE}`)
    onBack()
  }

  if (!started) return <Lobby onStart={handleStart} onBack={handleBack} />

  if (showGroupResults) return <GroupResultsView onTerminate={handleTerminateModule} />

  return (
    <QuizController
      quizQ={quizQ}
      onNext={handleNextQuestion}
      onEnd={handleEndQuiz}
      onBack={handleEndQuiz}
    />
  )
}
