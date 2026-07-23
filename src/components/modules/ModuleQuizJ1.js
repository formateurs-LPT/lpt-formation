'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { fetchOpenAnswers } from '@/lib/supabase'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { QUIZ_J1 } from '@/lib/quizJ1Data'

const MODULE_ID = 'quiz-j1'
const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

const STYLES = `
  @keyframes j1FadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

// ── Lobby ────────────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain', marginBottom: 32 }} />
      <div style={{
        display: 'inline-block', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)',
        borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16,
      }}>Quiz Jour 1</div>
      <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
        Les fondamentaux de l&apos;optique
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
        Entreprise · Optique · Ordonnances · Montures<br />
        {QUIZ_J1.length} questions · Classements toutes les 5 questions
      </p>
      <button onClick={onStart} style={{
        background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
        border: 'none', color: '#fff', padding: '16px 48px',
        borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(124,58,237,0.45)', fontFamily: 'inherit', marginBottom: 16,
      }}>▶ Lancer le quiz</button>
      <button onClick={onBack} style={{
        background: 'none', border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.4)', padding: '10px 24px', borderRadius: 12,
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>← Retour</button>
    </div>
  )
}

// ── Contrôleur questions texte libre ────────────────────────────────
function TextOpenController({ quizQ, isLast, onNext, onEnd }) {
  const q = QUIZ_J1[quizQ]
  const [answers, setAnswers] = useState([])
  const [validations, setValidations] = useState({}) // { name: true|false }

  useEffect(() => {
    setValidations({})
    const code = getActiveSessionCode()
    const poll = async () => {
      const rows = await fetchOpenAnswers(code, `quiz-j1:${quizQ}`)
      setAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  const handleValidate = async (name, isCorrect) => {
    await saveModuleQuizAnswer({
      sessionCode: getActiveSessionCode(),
      moduleId: MODULE_ID,
      questionIdx: quizQ,
      collaborateur: name,
      answerIdx: 0,
      isCorrect,
    })
    setValidations(v => ({ ...v, [name]: isCorrect }))
  }

  const validatedCount = Object.keys(validations).length
  const correctCount = Object.values(validations).filter(Boolean).length

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 28px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={26} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Quiz J1 — Réponse libre</span>
        </div>
        <div style={{
          background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 16, padding: '5px 18px', fontSize: 12, fontWeight: 700, color: '#a78bfa',
        }}>Q{quizQ + 1} / {QUIZ_J1.length}</div>
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
        <span style={{ color: '#4ade80', fontWeight: 700 }}>{correctCount} ✓</span>&nbsp; &nbsp;
        <span style={{ color: '#ef4444', fontWeight: 700 }}>{validatedCount - correctCount} ✗</span>
      </div>

      {/* Liste des réponses */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', marginBottom: 20 }}>
        {answers.length === 0 && (
          <div style={{
            textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: '40px 0',
          }}>En attente des réponses…</div>
        )}
        {answers.map(row => {
          const v = validations[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: v === true ? 'rgba(34,197,94,0.08)' : v === false ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${v === true ? 'rgba(34,197,94,0.3)' : v === false ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 12, animation: 'j1FadeIn .3s ease',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>{row.participant_name}</div>
                <div style={{ fontSize: 15, color: '#fff', fontWeight: 600 }}>{row.answer}</div>
              </div>
              <button onClick={() => handleValidate(row.participant_name, true)} style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: v === true ? '#16a34a' : 'rgba(34,197,94,0.15)',
                fontSize: 18, fontFamily: 'inherit',
                transition: 'background .2s',
              }}>✓</button>
              <button onClick={() => handleValidate(row.participant_name, false)} style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: v === false ? '#dc2626' : 'rgba(239,68,68,0.15)',
                fontSize: 18, fontFamily: 'inherit',
                transition: 'background .2s',
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
            color: '#fff', padding: '14px 32px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none',
            color: '#fff', padding: '14px 32px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Contrôleur questions standard (QCM, ordonnance, power) ──────────
function StandardController({ quizQ, isLast, onNext, onEnd }) {
  const q = QUIZ_J1[quizQ]
  const type = q.type || 'qcm'
  const [liveAnswers, setLiveAnswers] = useState([])

  useEffect(() => {
    const code = getActiveSessionCode()
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${code}&module_id=eq.${MODULE_ID}&question_idx=eq.${quizQ}`
      )
      setLiveAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  const total = liveAnswers.length
  const correctCount = liveAnswers.filter(r => r.is_correct).length

  // Pour les types avec options discrètes (qcm, qcm-multi, qcm-ordonnance)
  const hasOptions = !!q.options
  const counts = hasOptions ? q.options.map((_, i) => liveAnswers.filter(r => r.answer_idx === i).length) : []
  const correctIdx = hasOptions && !Array.isArray(q.correct) ? q.correct : null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 28px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={26} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Quiz J1 — Vue formateur</span>
        </div>
        <div style={{
          background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 16, padding: '5px 18px', fontSize: 12, fontWeight: 700, color: '#a78bfa',
        }}>Q{quizQ + 1} / {QUIZ_J1.length}</div>
      </div>

      {/* Question */}
      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.3, maxWidth: 700, alignSelf: 'center', textAlign: 'center' }}>
        {q.question}
      </div>

      {/* Ordonnance preview (si applicable) */}
      {(type === 'qcm-ordonnance' || type === 'ordonnance-fill') && q.ordonnance && (
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '12px 20px', marginBottom: 16, alignSelf: 'center',
          fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.7)',
        }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ color: '#a78bfa', fontWeight: 700 }}>OD</span>&nbsp;
            Sph {q.ordonnance.od.sph}{q.ordonnance.od.cyl ? ` · Cyl ${q.ordonnance.od.cyl} · Axe ${q.ordonnance.od.axe}` : ''}
            {q.ordonnance.od.add ? ` · Add ${q.ordonnance.od.add}` : ''}
          </div>
          <div>
            <span style={{ color: '#a78bfa', fontWeight: 700 }}>OG</span>&nbsp;
            Sph {q.ordonnance.og.sph}{q.ordonnance.og.cyl ? ` · Cyl ${q.ordonnance.og.cyl} · Axe ${q.ordonnance.og.axe}` : ''}
            {q.ordonnance.og.add ? ` · Add ${q.ordonnance.og.add}` : ''}
          </div>
        </div>
      )}

      {/* Power selector hint */}
      {type === 'power-selector' && (
        <div style={{
          background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.3)',
          borderRadius: 12, padding: '10px 16px', marginBottom: 16, alignSelf: 'center',
          fontSize: 13, color: '#c9a227',
        }}>
          ✓ Réponse : Positif {q.correctPos} / Négatif {q.correctNeg}
        </div>
      )}

      {/* Barres réponses (QCM) */}
      {hasOptions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, maxWidth: 680, alignSelf: 'center', width: '100%', marginTop: 12 }}>
          {q.options.map((opt, i) => {
            const count = counts[i] || 0
            const isCorrect = Array.isArray(q.correct) ? q.correct.includes(i) : i === correctIdx
            const pct = total > 0 ? (count / total) * 100 : 0
            return (
              <div key={i} style={{
                background: isCorrect ? 'rgba(34,197,94,0.07)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '12px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: OPTION_COLORS[i] || '#666',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                    }}>{'ABCD'[i]}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{opt}</span>
                    {isCorrect && (
                      <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 20 }}>✓</span>
                    )}
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: isCorrect ? '#4ade80' : '#fff' }}>
                    {count}
                  </span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3 }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: isCorrect ? '#4ade80' : OPTION_COLORS[i] || '#666', transition: 'width .5s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Compteur fill/power */}
      {!hasOptions && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{ display: 'flex', gap: 32 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#4ade80' }}>{correctCount}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>CORRECT{correctCount > 1 ? 'S' : ''}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#ef4444' }}>{total - correctCount}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>INCORRECT{total - correctCount > 1 ? 'S' : ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginRight: 4 }}>{total}</span>
          réponse{total > 1 ? 's' : ''}
        </div>
        {isLast ? (
          <button onClick={onEnd} style={{
            background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none',
            color: '#fff', padding: '14px 32px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none',
            color: '#fff', padding: '14px 32px', borderRadius: 14,
            fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Résultats groupe ────────────────────────────────────────────────
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
    const fetch = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.${MODULE_ID}`
      )
      setAnswers(rows || [])
      setLoading(false)
    }
    fetch()
  }, [])

  const participants = [...new Set((answers || []).map(r => r.collaborateur))]
  const questionStats = QUIZ_J1.map((q, idx) => {
    const qAnswers = answers.filter(r => r.question_idx === idx)
    const wrongCount = qAnswers.filter(r => !r.is_correct).length
    const total = qAnswers.length
    const pctWrong = total > 0 ? Math.round((wrongCount / total) * 100) : 0
    return { idx, question: q.question, pctWrong, total }
  }).sort((a, b) => b.pctWrong - a.pctWrong)

  const getPriority = (pct) => {
    if (pct >= 50) return { icon: '🔴', label: 'À retravailler', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
    if (pct >= 25) return { icon: '🟡', label: 'À consolider', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
    return { icon: '🟢', label: 'Bien maîtrisé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 28px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={26} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Bilan — Quiz Jour 1</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginRight: 4 }}>{participants.length}</span>participant{participants.length > 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Points à retravailler</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Trié par taux d&apos;erreur décroissant</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', marginBottom: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>Chargement…</div>
        ) : questionStats.map(stat => {
          const p = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{
              background: p.bg, border: `1px solid ${p.border}`, borderRadius: 14, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 2 }}>
                  Q{stat.idx + 1} — {p.label}
                </div>
                <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>{stat.question}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: p.color, flexShrink: 0 }}>
                {stat.pctWrong}%
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>erreurs</div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        {phase === 'podium' && (
          <button onClick={showRate} style={{
            background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.4)',
            color: '#c9a227', padding: '12px 28px', borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>📊 Afficher le taux de réussite</button>
        )}
        {phase === 'rate' && (
          <button onClick={hideRate} style={{
            background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.4)',
            color: '#c9a227', padding: '12px 28px', borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>✕ Masquer le taux</button>
        )}
        <button onClick={onTerminate} style={{
          background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)',
          color: '#ff6b6b', padding: '12px 28px', borderRadius: 12,
          fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>✕ Terminer</button>
      </div>
    </div>
  )
}

// ── Composant principal ──────────────────────────────────────────────
export default function ModuleQuizJ1({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [quizInterstitial, setQuizInterstitial] = useState(false)
  const [showGroupResults, setShowGroupResults] = useState(false)

  useEffect(() => {
    sbUpdate('sessions', { active_module: MODULE_ID, module_page: -1 }, `code=eq.${getActiveSessionCode()}`)
    setSharedState({ quiz_final_phase: null, quiz_interstitial_q: null })
  }, [])

  const handleBack = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    await setSharedState({ quiz_final_phase: null, quiz_interstitial_q: null })
    onBack()
  }

  const handleStart = async () => {
    await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 100 }, `code=eq.${getActiveSessionCode()}`)
    await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: null })
    setQuizQ(0)
    setStarted(true)
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 100 + next }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(next)
    // Classement toutes les 5 questions (après Q5, Q10, Q15, Q20)
    if (next % 5 === 0 && next < QUIZ_J1.length) {
      setQuizInterstitial(true)
      setSharedState({ quiz_interstitial_q: next }).catch(() => {})
    } else {
      setSharedState({ quiz_interstitial_q: null }).catch(() => {})
    }
  }

  const handleContinueInterstitial = async () => {
    setQuizInterstitial(false)
    await setSharedState({ quiz_interstitial_q: null })
  }

  const handleEndQuiz = async () => {
    await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 200 }, `code=eq.${getActiveSessionCode()}`)
    await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: 'podium' })
    setShowGroupResults(true)
  }

  const handleTerminate = async () => {
    await setSharedState({ quiz_final_phase: 'ended' })
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
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
      <GroupResultsView onTerminate={handleTerminate} />
    </>
  )

  if (quizInterstitial) return (
    <>
      <style>{STYLES}</style>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
      }}>
        <div style={{ fontSize: 60 }}>🏆</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Classement après {quizQ} questions
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>
            Le podium s&apos;affiche sur le grand écran
          </div>
        </div>
        <button onClick={handleContinueInterstitial} style={{
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          border: 'none', color: '#fff', padding: '16px 36px', borderRadius: 14,
          fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Continuer → Q{quizQ + 1}
        </button>
      </div>
    </>
  )

  const q = QUIZ_J1[quizQ]
  const type = q?.type || 'qcm'
  const isLast = quizQ >= QUIZ_J1.length - 1

  return (
    <>
      <style>{STYLES}</style>
      {type === 'text-open' ? (
        <TextOpenController quizQ={quizQ} isLast={isLast} onNext={handleNextQuestion} onEnd={handleEndQuiz} />
      ) : (
        <StandardController quizQ={quizQ} isLast={isLast} onNext={handleNextQuestion} onEnd={handleEndQuiz} />
      )}
    </>
  )
}
