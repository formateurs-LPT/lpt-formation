'use client'
import { useState, useEffect } from 'react'
import {
  sbSelect, setSharedState, getSharedState,
  gradeOpenAnswer, insertOpenAnswer, getParticipantSessionCode,
} from '@/lib/supabase'

// ── TV — Écran diffuseur ──────────────────────────────────────────

export function TVFreeQuizScreen({ sharedState }) {
  const prompt = sharedState?.free_quiz_prompt
  const pageId = sharedState?.free_quiz_page_id
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    if (!pageId) return
    const poll = async () => {
      const data = await sbSelect(
        'open_answers',
        `page_id=eq.${encodeURIComponent(pageId)}&order=created_at.asc&limit=60`
      )
      setAnswers(data || [])
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [pageId])

  const graded  = answers.filter(a => a.is_correct !== null && a.is_correct !== undefined)
  const correct = graded.filter(a => a.is_correct === true)

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #061830 100%)',
      display: 'flex', flexDirection: 'column', padding: '48px 60px',
      fontFamily: 'inherit', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
        <div style={{
          background: '#0089ba', color: '#fff', fontSize: 11, fontWeight: 800,
          textTransform: 'uppercase', letterSpacing: '0.12em',
          padding: '6px 18px', borderRadius: 20, flexShrink: 0,
        }}>
          🎯 Quiz — Réponses libres
        </div>
        {answers.length > 0 && (
          <>
            <div style={{ height: 20, width: 1, background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>
              {answers.length} réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''}
            </div>
            {graded.length > 0 && (
              <div style={{ fontSize: 14, color: '#22c55e', fontWeight: 700 }}>
                · {correct.length}/{graded.length} correcte{graded.length > 1 ? 's' : ''}
              </div>
            )}
          </>
        )}
      </div>

      {/* Question */}
      <div style={{
        background: 'rgba(0,137,186,0.12)', border: '1.5px solid rgba(0,137,186,0.35)',
        borderRadius: 20, padding: '28px 36px', marginBottom: 36, flexShrink: 0,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
          Question
        </div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>
          {prompt || '—'}
        </div>
      </div>

      {/* Réponses */}
      {answers.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 48, opacity: 0.3 }}>💬</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 600 }}>En attente des réponses…</div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(3, Math.ceil(answers.length / 3))}, 1fr)`,
          gap: 14, flex: 1, alignContent: 'start', overflow: 'hidden',
        }}>
          {answers.map(a => {
            const isGraded  = a.is_correct !== null && a.is_correct !== undefined
            const isCorrect = a.is_correct === true
            return (
              <div key={a.id} style={{
                background: isGraded
                  ? (isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(248,113,113,0.1)')
                  : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${isGraded ? (isCorrect ? 'rgba(34,197,94,0.45)' : 'rgba(248,113,113,0.45)') : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 16, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isGraded ? (isCorrect ? '#22c55e' : '#f87171') : '#00abe9', letterSpacing: '0.02em' }}>
                    {a.participant_name}
                  </div>
                  <div style={{ fontSize: 18 }}>
                    {isGraded ? (isCorrect ? '✅' : '❌') : '⏳'}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                  {a.answer}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Participant — Saisie réponse sur mobile ───────────────────────

export function FreeQuizParticipant({ sharedState, pName }) {
  const prompt = sharedState?.free_quiz_prompt
  const pageId = sharedState?.free_quiz_page_id

  const [answer,    setAnswer]    = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [sending,   setSending]   = useState(false)
  const [grade,     setGrade]     = useState(null) // null | true | false

  // Reset si nouvelle question
  useEffect(() => {
    setAnswer('')
    setSubmitted(false)
    setGrade(null)
  }, [pageId])

  // Poll pour le résultat une fois la réponse envoyée
  useEffect(() => {
    if (!submitted || grade !== null || !pageId || !pName) return
    const poll = async () => {
      const rows = await sbSelect(
        'open_answers',
        `page_id=eq.${encodeURIComponent(pageId)}&participant_name=eq.${encodeURIComponent(pName)}&order=created_at.desc&limit=1`
      )
      const row = rows?.[0]
      if (row && row.is_correct !== null && row.is_correct !== undefined) {
        setGrade(row.is_correct)
      }
    }
    poll()
    const t = setInterval(poll, 2500)
    return () => clearInterval(t)
  }, [submitted, grade, pageId, pName])

  const handleSubmit = async () => {
    const trimmed = answer.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const sessionCode = getParticipantSessionCode() || ''
      await insertOpenAnswer({
        sessionCode,
        pageId,
        participantName: pName,
        answer: trimmed,
        questionPrompt: prompt,
      })
      setSubmitted(true)
    } catch { /* ignore */ }
    setSending(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '44px 22px 40px',
    }}>
      {/* Badge */}
      <div style={{ fontSize: 10, fontWeight: 800, color: '#00abe9', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 24 }}>
        🎯 Quiz — Réponse libre
      </div>

      {/* Question */}
      <div style={{
        background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.25)',
        borderRadius: 18, padding: '20px 22px', marginBottom: 28,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Question
        </div>
        <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', lineHeight: 1.5 }}>
          {prompt}
        </div>
      </div>

      {!submitted ? (
        <>
          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Écris ta réponse ici…"
            rows={5}
            style={{
              width: '100%', padding: '14px 16px', borderRadius: 16,
              border: '1.5px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.07)',
              fontSize: 15, color: '#fff', resize: 'none',
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              lineHeight: 1.6, marginBottom: 16, transition: 'border-color .15s',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,171,233,0.6)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
          />
          <button
            onClick={handleSubmit}
            disabled={!answer.trim() || sending}
            style={{
              width: '100%', padding: '18px', borderRadius: 18,
              background: answer.trim() ? '#00abe9' : 'rgba(0,171,233,0.25)',
              color: '#fff', fontWeight: 800, fontSize: 16,
              border: 'none', cursor: answer.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'all .15s',
              boxShadow: answer.trim() ? '0 4px 20px rgba(0,171,233,0.35)' : 'none',
            }}
          >
            {sending ? 'Envoi…' : 'Envoyer ma réponse →'}
          </button>
        </>
      ) : grade === null ? (
        <div style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 20, padding: '36px 24px', textAlign: 'center', flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Réponse envoyée !</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, marginBottom: 24 }}>
            Le formateur va valider ta réponse…
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 10, height: 10, borderRadius: '50%',
                background: '#00abe9', opacity: 0.5 + i * 0.15,
                animation: `fqpulse ${1 + i * 0.35}s ease-in-out infinite alternate`,
              }} />
            ))}
          </div>
          <style>{`@keyframes fqpulse { from { transform: scale(1); } to { transform: scale(1.5); opacity: 1; } }`}</style>
        </div>
      ) : (
        <div style={{
          background: grade ? 'rgba(34,197,94,0.12)' : 'rgba(248,113,113,0.1)',
          border: `2px solid ${grade ? 'rgba(34,197,94,0.4)' : 'rgba(248,113,113,0.4)'}`,
          borderRadius: 24, padding: '40px 24px', textAlign: 'center', flex: 1,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>{grade ? '🎉' : '💪'}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: grade ? '#22c55e' : '#f87171', marginBottom: 10 }}>
            {grade ? 'Bonne réponse !' : 'Pas tout à fait…'}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            {grade
              ? 'Excellent travail, continue comme ça !'
              : 'Le formateur t\'expliquera la bonne réponse.'}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Trainer — Interface formateur ─────────────────────────────────

export default function FreeQuizTrainer({ onBack }) {
  const [prompt,   setPrompt]   = useState('')
  const [hint,     setHint]     = useState('')
  const [active,   setActive]   = useState(false)
  const [pageId,   setPageId]   = useState(null)
  const [answers,  setAnswers]  = useState([])
  const [grading,  setGrading]  = useState(null)
  const [launching, setLaunching] = useState(false)
  const [stopping,  setStopping]  = useState(false)

  // Au montage : reprend un quiz déjà actif si le formateur revient
  useEffect(() => {
    getSharedState().then(state => {
      if (state?.free_quiz_active && state?.free_quiz_page_id) {
        setActive(true)
        setPageId(state.free_quiz_page_id)
        setPrompt(state.free_quiz_prompt || '')
        setHint(state.free_quiz_hint || '')
      }
    }).catch(() => {})
  }, [])

  // Poll les réponses en temps réel
  useEffect(() => {
    if (!active || !pageId) return
    const poll = async () => {
      const data = await sbSelect(
        'open_answers',
        `page_id=eq.${encodeURIComponent(pageId)}&order=created_at.asc&limit=60`
      )
      setAnswers(data || [])
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [active, pageId])

  const handleLaunch = async () => {
    if (!prompt.trim()) return
    setLaunching(true)
    const pid = `fq_${Date.now()}`
    await setSharedState({
      tv_screen: 'free-quiz',
      free_quiz_active: true,
      free_quiz_prompt: prompt.trim(),
      free_quiz_hint: hint.trim() || null,
      free_quiz_page_id: pid,
    })
    setPageId(pid)
    setActive(true)
    setAnswers([])
    setLaunching(false)
  }

  const handleStop = async () => {
    setStopping(true)
    await setSharedState({
      tv_screen: null,
      free_quiz_active: false,
      free_quiz_prompt: null,
      free_quiz_hint: null,
      free_quiz_page_id: null,
    })
    setActive(false)
    setPageId(null)
    setStopping(false)
  }

  const handleNewQuestion = async () => {
    setStopping(true)
    await setSharedState({
      tv_screen: null,
      free_quiz_active: false,
      free_quiz_prompt: null,
      free_quiz_hint: null,
      free_quiz_page_id: null,
    })
    setActive(false)
    setPageId(null)
    setPrompt('')
    setHint('')
    setAnswers([])
    setStopping(false)
  }

  const handleGrade = async (answer, isCorrect) => {
    setGrading(answer.id)
    await gradeOpenAnswer(answer.id, { isCorrect, gradedBy: 'trainer' })
    setAnswers(prev => prev.map(a => a.id === answer.id ? { ...a, is_correct: isCorrect } : a))
    setGrading(null)
  }

  const graded       = answers.filter(a => a.is_correct !== null && a.is_correct !== undefined)
  const correctCount = graded.filter(a => a.is_correct === true).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{
        padding: '18px 24px', background: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      }}>
        <button className="detail-back" onClick={onBack}>← Tableau de bord</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>🎯 Quiz — Réponses libres</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Pose une question · les formés répondent sur leur téléphone · tu valides en direct
          </div>
        </div>
        {active && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 0 3px rgba(22,163,74,0.2)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>Quiz en cours</span>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {!active ? (
          /* ── Phase 1 : Création de la question ── */
          <div style={{ maxWidth: 580, margin: '0 auto' }}>
            <div style={{
              background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: 20, padding: '28px 28px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 22 }}>
                Nouvelle question
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
                  Question posée aux formés
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="Ex : Qu'est-ce que l'indice de réfraction ?"
                  rows={3}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
                    resize: 'none', fontFamily: 'inherit', outline: 'none',
                    boxSizing: 'border-box', lineHeight: 1.6, transition: 'border-color .15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0089ba' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
                />
              </div>

              <div style={{ marginBottom: 26 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: 8 }}>
                  Réponse attendue <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#94a3b8' }}>(indice visible uniquement par toi)</span>
                </label>
                <input
                  value={hint}
                  onChange={e => setHint(e.target.value)}
                  placeholder="Ex : 1.5 = standard, 1.67 = mince, 1.74 = ultra-mince"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 12,
                    border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b',
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0089ba' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
                />
              </div>

              <button
                onClick={handleLaunch}
                disabled={!prompt.trim() || launching}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14,
                  background: prompt.trim() ? '#0f172a' : '#f1f5f9',
                  color: prompt.trim() ? '#fff' : '#94a3b8',
                  fontWeight: 800, fontSize: 15, border: 'none',
                  cursor: prompt.trim() ? 'pointer' : 'default',
                  fontFamily: 'inherit', transition: 'all .15s',
                  boxShadow: prompt.trim() ? '0 4px 16px rgba(15,23,42,0.18)' : 'none',
                }}
              >
                {launching ? 'Lancement…' : '🚀 Lancer la question'}
              </button>
            </div>
          </div>
        ) : (
          /* ── Phase 2 : Quiz actif — correction en direct ── */
          <>
            {/* Question active + indice */}
            <div style={{
              background: '#fff', border: '1.5px solid #bae6fd',
              borderRadius: 16, padding: '18px 22px', marginBottom: 20,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Question en cours
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.5 }}>
                {prompt}
              </div>
              {hint && (
                <div style={{
                  fontSize: 13, color: '#0369a1', background: '#f0f9ff',
                  borderRadius: 10, padding: '8px 12px', marginTop: 12,
                  border: '1px solid #bae6fd',
                }}>
                  💡 {hint}
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Réponses reçues', value: answers.length,  color: '#0089ba' },
                { label: 'Validées',         value: graded.length,   color: '#d97706' },
                { label: 'Correctes',        value: correctCount,    color: '#16a34a' },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, background: '#fff', border: '1px solid #e2e8f0',
                  borderRadius: 14, padding: '14px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Réponses + boutons ✓/✗ */}
            {answers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '52px 0', color: '#94a3b8', fontSize: 14 }}>
                En attente des réponses…
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {answers.map(a => {
                  const isGraded     = a.is_correct !== null && a.is_correct !== undefined
                  const isGradingThis = grading === a.id
                  return (
                    <div key={a.id} style={{
                      background: '#fff',
                      border: `1px solid ${isGraded ? (a.is_correct ? '#bbf7d0' : '#fecaca') : '#e2e8f0'}`,
                      borderLeft: `4px solid ${isGraded ? (a.is_correct ? '#16a34a' : '#dc2626') : '#cbd5e1'}`,
                      borderRadius: 14, padding: '14px 18px',
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#1e293b', marginBottom: 6 }}>
                          {a.participant_name}
                        </div>
                        <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                          {a.answer}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                        {isGraded ? (
                          <>
                            <div style={{ fontSize: 22 }}>{a.is_correct ? '✅' : '❌'}</div>
                            <button
                              onClick={() => handleGrade(a, !a.is_correct)}
                              disabled={isGradingThis}
                              title="Changer la correction"
                              style={{
                                fontSize: 11, padding: '4px 10px', borderRadius: 8,
                                background: '#f8fafc', border: '1px solid #e2e8f0',
                                color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
                              }}
                            >
                              Changer
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleGrade(a, true)}
                              disabled={!!grading}
                              title="Correct"
                              style={{
                                width: 42, height: 42, borderRadius: 12, fontSize: 20, fontWeight: 700,
                                background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.35)',
                                color: '#16a34a', cursor: grading ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all .1s',
                              }}
                            >
                              {isGradingThis ? '…' : '✓'}
                            </button>
                            <button
                              onClick={() => handleGrade(a, false)}
                              disabled={!!grading}
                              title="Incorrect"
                              style={{
                                width: 42, height: 42, borderRadius: 12, fontSize: 20, fontWeight: 700,
                                background: 'rgba(220,38,38,0.1)', border: '2px solid rgba(220,38,38,0.3)',
                                color: '#dc2626', cursor: grading ? 'wait' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all .1s',
                              }}
                            >
                              {isGradingThis ? '…' : '✗'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleNewQuestion}
                disabled={stopping}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: '#fff', border: '1.5px solid #e2e8f0',
                  color: '#0f172a', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                🔄 Nouvelle question
              </button>
              <button
                onClick={handleStop}
                disabled={stopping}
                style={{
                  flex: 1, padding: '14px', borderRadius: 14,
                  background: 'rgba(220,38,38,0.07)', border: '1.5px solid rgba(220,38,38,0.3)',
                  color: '#dc2626', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {stopping ? '…' : '✕ Terminer le quiz'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
