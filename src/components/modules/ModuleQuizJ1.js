'use client'
import { useState, useEffect, useRef } from 'react'
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
        display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
        borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9',
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
        background: 'linear-gradient(135deg, #0070a8, #00abe9)',
        border: 'none', color: '#fff', padding: '16px 48px',
        borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 8px 32px rgba(0,171,233,0.35)', fontFamily: 'inherit', marginBottom: 16,
      }}>▶ Lancer le quiz</button>
      <button onClick={onBack} style={{
        background: 'none', border: '1px solid rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.4)', padding: '10px 24px', borderRadius: 12,
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>← Retour</button>
    </div>
  )
}

// ── Aperçu ordonnance (formateur) ────────────────────────────────────
function OrdoPreview({ q }) {
  const ord = q.ordonnance
  if (!ord) return null
  return (
    <div style={{ alignSelf: 'center', textAlign: 'center', marginBottom: 16 }}>
      {q.ordoLabel && (
        <div style={{ fontSize: 14, fontWeight: 700, color: '#4ade80', marginBottom: 6 }}>{q.ordoLabel}</div>
      )}
      <div style={{
        background: 'rgba(0,171,233,0.06)', border: '1px solid rgba(0,171,233,0.2)',
        borderRadius: 12, padding: '12px 28px', display: 'inline-block',
      }}>
        {['od', 'og'].map(eye => {
          const d = ord[eye]
          let right = d.sph || '—'
          if (d.cyl) {
            if (q.cylInParens) right += ` (${d.cyl})  ${d.axe}°`
            else right += `  ${d.cyl}  ${d.axe}°`
          }
          if (d.add) right += `  Add ${d.add}`
          return (
            <div key={eye} style={{ fontSize: 18, color: '#fff', fontFamily: 'monospace', marginBottom: eye === 'od' ? 6 : 0 }}>
              <span style={{ color: '#00abe9', fontWeight: 800, marginRight: 16 }}>{eye.toUpperCase()}</span>
              {right}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Contrôleur questions texte libre ────────────────────────────────
function TextOpenController({ quizQ, isLast, onNext, onEnd }) {
  const q = QUIZ_J1[quizQ]
  const [answers, setAnswers] = useState([])
  const [validations, setValidations] = useState({})
  const autoValidatedRef = useRef(new Set())

  useEffect(() => {
    setValidations({})
    setAnswers([])
    autoValidatedRef.current = new Set()

    const code = getActiveSessionCode()

    const autoValidate = (rows) => {
      if (!q) return
      for (const row of rows) {
        const name = row.participant_name
        if (autoValidatedRef.current.has(name)) continue
        const text = (row.answer || '').trim().toLowerCase()
        const matchOr    = q.autoCorrect?.length     && q.autoCorrect.some(kw => text.includes(kw.toLowerCase()))
        const matchAnd   = q.autoCorrectAll?.length   && q.autoCorrectAll.every(kw => text.includes(kw.toLowerCase()))
        const matchAllOr = q.autoCorrectAllOr?.length && q.autoCorrectAllOr.every(group => group.some(kw => text.includes(kw.toLowerCase())))
        if (matchOr || matchAnd || matchAllOr) {
          autoValidatedRef.current.add(name)
          saveModuleQuizAnswer({
            sessionCode: code,
            moduleId: MODULE_ID,
            questionIdx: quizQ,
            collaborateur: name,
            answerIdx: 0,
            isCorrect: true,
          }).then(() => setValidations(v => ({ ...v, [name]: true }))).catch(() => { autoValidatedRef.current.delete(name) })
        }
      }
    }

    const poll = async () => {
      const rows = await fetchOpenAnswers(code, `quiz-j1:${quizQ}`)
      const latest = {}
      for (const row of rows || []) latest[row.participant_name] = row
      const deduped = Object.values(latest)
      setAnswers(deduped)
      autoValidate(deduped)
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

  const correctCount = Object.values(validations).filter(Boolean).length

  const bg = { minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 40px' }

  return (
    <div style={bg}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz Jour 1 — Vue formateur</span>
        </div>
        <div style={{ background: 'rgba(0,171,233,0.2)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 20px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Q{quizQ + 1} / {QUIZ_J1.length}
        </div>
      </div>

      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, maxWidth: 800, margin: '0 auto 12px' }}>{q.question}</div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)', borderRadius: 12, padding: '8px 22px', fontSize: 12, color: 'rgba(0,171,233,0.8)', fontStyle: 'italic' }}>
          💡 Réponse attendue : {q.hint}
        </div>
      </div>

      {/* Compteur */}
      <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{answers.length}</span>
        réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''}
        &nbsp;·&nbsp;
        <span style={{ color: '#4ade80', fontWeight: 700 }}>{correctCount} ✓</span>
        &nbsp;
        <span style={{ color: '#f87171', fontWeight: 700 }}>{Object.keys(validations).length - correctCount} ✗</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, margin: '0 auto', maxHeight: '45vh', overflowY: 'auto', paddingRight: 4, marginBottom: 24 }}>
        {answers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>En attente des réponses des participants…</div>
        ) : answers.map(row => {
          const status = validations[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: status === true ? 'rgba(34,197,94,0.08)' : status === false ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === true ? 'rgba(34,197,94,0.3)' : status === false ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '14px 18px', animation: 'j1FadeIn .3s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{row.participant_name}</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{row.answer || '—'}</div>
                </div>
                {status === undefined && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => handleValidate(row.participant_name, true)} style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#4ade80', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                    <button onClick={() => handleValidate(row.participant_name, false)} style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
                  </div>
                )}
                {status === true  && <span style={{ fontSize: 22, color: '#4ade80', flexShrink: 0 }}>✓</span>}
                {status === false && <span style={{ fontSize: 22, color: '#f87171', flexShrink: 0 }}>✗</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        {isLast ? (
          <button onClick={onEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={onNext} style={{ background: 'linear-gradient(135deg, #0070a8, #00abe9)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Question suivante →</button>
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

  const hasOptions = !!q.options
  const counts = hasOptions ? q.options.map((_, i) => liveAnswers.filter(r => r.answer_idx === i).length) : []
  const correctIdx = hasOptions && !Array.isArray(q.correct) ? q.correct : null

  const bg = { minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }

  return (
    <div style={bg}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz Jour 1 — Vue formateur</span>
        </div>
        <div style={{ background: 'rgba(0,171,233,0.2)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 20px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Q{quizQ + 1} / {QUIZ_J1.length}
        </div>
      </div>

      {/* Question */}
      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 12, lineHeight: 1.3, maxWidth: 700, alignSelf: 'center', textAlign: 'center' }}>
        {q.question}
      </div>

      {/* Ordonnance preview */}
      {(type === 'qcm-ordonnance' || type === 'ordonnance-fill') && <OrdoPreview q={q} />}

      {/* Barres réponses (QCM) */}
      {hasOptions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, maxWidth: 680, alignSelf: 'center', width: '100%', marginTop: 8 }}>
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
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: OPTION_COLORS[i] || '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{'ABCD'[i]}</div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{opt}</span>
                    {isCorrect && <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 20 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: isCorrect ? '#4ade80' : '#fff' }}>{count}</span>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginRight: 4 }}>{total}</span>
          réponse{total > 1 ? 's' : ''}
        </div>
        {isLast ? (
          <button onClick={onEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={onNext} style={{ background: 'linear-gradient(135deg, #0070a8, #00abe9)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Résultats groupe ────────────────────────────────────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('podium')

  const showRate = async () => { await setSharedState({ quiz_final_phase: 'rate' }); setPhase('rate') }
  const hideRate = async () => { await setSharedState({ quiz_final_phase: null }); setPhase('recap') }

  useEffect(() => {
    const fetch = async () => {
      const rows = await fetchTrainerQuizAnswers(`session_code=eq.${getActiveSessionCode()}&module_id=eq.${MODULE_ID}`)
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 28px' }}>
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
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Points à retravailler</h1>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Trié par taux d&apos;erreur décroissant</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', marginBottom: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 40 }}>Chargement…</div>
        ) : questionStats.map(stat => {
          const p = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: p.color, marginBottom: 2 }}>Q{stat.idx + 1} — {p.label}</div>
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
          <button onClick={showRate} style={{ background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.35)', color: '#00abe9', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            📊 Afficher le taux de réussite
          </button>
        )}
        {phase === 'rate' && (
          <button onClick={hideRate} style={{ background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.35)', color: '#00abe9', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✕ Masquer le taux
          </button>
        )}
        <button onClick={onTerminate} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
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
    const init = async () => {
      await setSharedState({ quiz_final_phase: null, quiz_interstitial_q: null, quiz_show_correction: false }).catch(() => {})
      await sbUpdate('sessions', { active_module: MODULE_ID, module_page: -1 }, `code=eq.${getActiveSessionCode()}`)
    }
    init()
  }, [])

  const handleBack = async () => {
    try {
      await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
      await setSharedState({ quiz_final_phase: null, quiz_interstitial_q: null }).catch(() => {})
    } catch { /* best-effort */ }
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
    if (next % 5 === 0 && next < QUIZ_J1.length) {
      await setSharedState({ quiz_show_correction: false, quiz_interstitial_q: next }).catch(() => {})
      setQuizInterstitial(true)
    } else {
      await setSharedState({ quiz_show_correction: false, quiz_interstitial_q: null }).catch(() => {})
    }
    await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 100 + next }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(next)
  }

  const handleContinueInterstitial = async () => {
    setQuizInterstitial(false)
    await setSharedState({ quiz_interstitial_q: null, quiz_show_correction: false })
  }

  const handleEndQuiz = async () => {
    try {
      await sbUpdate('sessions', { active_module: MODULE_ID, module_page: 200 }, `code=eq.${getActiveSessionCode()}`)
      await setSharedState({ quiz_interstitial_q: null, quiz_final_phase: 'podium' }).catch(() => {})
    } catch { /* best-effort */ }
    setShowGroupResults(true)
  }

  const handleTerminate = async () => {
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
          background: 'linear-gradient(135deg, #0070a8, #00abe9)',
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
