'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState, fetchOpenAnswers, clearQuizStarts } from '@/lib/supabase'
import { MODULE_DATA, MUTUELLES_BELGIQUE, MUTUELLES_INAMI_QUIZ } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { useAutoRevealCorrection, NotAnsweredList } from '@/lib/useAutoRevealCorrection'
import { countVotesPerOption } from '@/lib/quizVotes'
import { QUIZ_OPTION_COLORS as OPTION_COLORS } from '@/lib/constants'

const MODULE_ID = 'mutuelles-inami'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

const PAGE_TYPE_LABELS = {
  'pause':           { icon: '🙋', label: 'Question ouverte' },
  'mutuelles-reveal':{ icon: '🛡️', label: 'Les assureurs' },
  'inami-info':      { icon: '🏥', label: 'INAMI' },
  'partena-offre':   { icon: '⭐', label: 'Partenaire' },
}

// ── Quiz texte libre ────────────────────────────────────────────────
function MutuellesTextOpenController({ quizQ, onNext, onEnd, onBack }) {
  const [openAnswers, setOpenAnswers] = useState([])
  const [validating, setValidating] = useState({})
  const [validated, setValidated] = useState({})
  const autoValidatedRef = useRef(new Set())

  const q = MUTUELLES_INAMI_QUIZ[quizQ]
  const isLast = quizQ >= MUTUELLES_INAMI_QUIZ.length - 1
  const pageId = `${MODULE_ID}:${quizQ}`

  useEffect(() => {
    setOpenAnswers([]); setValidating({}); setValidated({})
    autoValidatedRef.current = new Set()

    const autoValidate = (rows) => {
      const kws = q?.autoCorrect
      if (!kws?.length) return
      for (const row of rows) {
        const name = row.participant_name
        if (autoValidatedRef.current.has(name)) continue
        const text = (row.answer || '').trim().toLowerCase()
        if (kws.some(kw => text.includes(kw.toLowerCase()))) {
          autoValidatedRef.current.add(name)
          setValidating(v => ({ ...v, [name]: true }))
          saveModuleQuizAnswer({ sessionCode: getActiveSessionCode(), moduleId: MODULE_ID, questionIdx: quizQ, collaborateur: name, answerIdx: 0, isCorrect: true })
            .then(() => { setValidated(v => ({ ...v, [name]: 'correct' })); setValidating(v => ({ ...v, [name]: false })) })
            .catch(() => { autoValidatedRef.current.delete(name); setValidating(v => ({ ...v, [name]: false })) })
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
  }, [quizQ, pageId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleValidate = async (row, isCorrect) => {
    if (validating[row.participant_name]) return
    setValidating(v => ({ ...v, [row.participant_name]: true }))
    try {
      await saveModuleQuizAnswer({ sessionCode: getActiveSessionCode(), moduleId: MODULE_ID, questionIdx: quizQ, collaborateur: row.participant_name, answerIdx: 0, isCorrect })
      setValidated(v => ({ ...v, [row.participant_name]: isCorrect ? 'correct' : 'wrong' }))
    } catch { /* best-effort */ } finally {
      setValidating(v => ({ ...v, [row.participant_name]: false }))
    }
  }

  const pendingCount = openAnswers.filter(row => !validated[row.participant_name]).length
  const confirmSkipPending = () => {
    if (pendingCount === 0) return true
    return window.confirm(
      `${pendingCount} réponse${pendingCount > 1 ? 's' : ''} pas encore validée${pendingCount > 1 ? 's' : ''} ✓/✗.\n\n` +
      `Si vous continuez maintenant, ${pendingCount > 1 ? 'elles compteront' : 'elle comptera'} comme fausse` +
      `${pendingCount > 1 ? 's' : ''} — même si la réponse était juste.\n\nContinuer quand même ?`
    )
  }

  const { connectedCount, notAnswered } = useAutoRevealCorrection({
    answeredNames: openAnswers.map(row => row.participant_name),
    resetKey: quizQ,
    onReveal: () => setSharedState({ quiz_show_correction: true }).catch(() => {}),
  })
  const allAnswered = connectedCount > 0 && notAnswered.length === 0

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', padding: '24px 40px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Mutuelles et INAMI</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-block', background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#c9a227', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {MUTUELLES_INAMI_QUIZ.length}
        </div>
      </div>

      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, maxWidth: 800, margin: '0 auto 12px' }}>{q.question}</div>

      {q.hint && (
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ display: 'inline-block', background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: 12, padding: '8px 22px', fontSize: 12, color: 'rgba(201,162,39,0.8)', fontStyle: 'italic' }}>
            Réponse attendue : {q.hint}
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, width: '100%', margin: '0 auto', maxHeight: '40vh', overflowY: 'auto' }}>
        {openAnswers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>En attente des réponses…</div>
        ) : openAnswers.map((row, i) => {
          const status = validated[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: status === 'correct' ? 'rgba(34,197,94,0.08)' : status === 'wrong' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === 'correct' ? 'rgba(34,197,94,0.3)' : status === 'wrong' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: OPTION_COLORS[i % OPTION_COLORS.length], minWidth: 80, flexShrink: 0 }}>{row.participant_name}</span>
              <span style={{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{row.answer}</span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => handleValidate(row, true)} title="Marquer correct" style={{ background: status === 'correct' ? 'rgba(34,197,94,0.4)' : 'rgba(34,197,94,0.15)', border: `1.5px solid ${status === 'correct' ? '#4ade80' : 'rgba(34,197,94,0.35)'}`, color: '#4ade80', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                <button onClick={() => handleValidate(row, false)} title="Marquer faux" style={{ background: status === 'wrong' ? 'rgba(239,68,68,0.4)' : 'rgba(239,68,68,0.12)', border: `1.5px solid ${status === 'wrong' ? '#f87171' : 'rgba(239,68,68,0.35)'}`, color: '#f87171', padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
              </div>
            </div>
          )
        })}
      </div>

      <NotAnsweredList notAnswered={notAnswered} />

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 24 }}>
        {pendingCount > 0 && (
          <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginRight: 'auto' }}>
            ⚠️ {pendingCount} réponse{pendingCount > 1 ? 's' : ''} pas encore validée{pendingCount > 1 ? 's' : ''}
          </div>
        )}
        {!allAnswered && openAnswers.length > 0 && (
          <button
            onClick={() => { if (window.confirm('Forcer l\'affichage de la correction maintenant ? Les formés qui n\'ont pas encore répondu verront les réponses des autres.')) setSharedState({ quiz_show_correction: true }).catch(() => {}) }}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
          >
            ⚠️ Forcer la correction
          </button>
        )}
        {openAnswers.length > 0 && (
          <button
            onClick={() => { if (allAnswered) setSharedState({ quiz_show_correction: true }).catch(() => {}) }}
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
          <button onClick={() => { if (confirmSkipPending()) onEnd() }} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>✓ Terminer le quiz</button>
        ) : (
          <button onClick={async () => { if (!confirmSkipPending()) return; await setSharedState({ quiz_show_correction: false }).catch(() => {}); onNext() }} style={{ background: 'linear-gradient(135deg, #a07818, #c9a227)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(201,162,39,0.4)' }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Quiz QCM (simple et multi-sélection) ───────────────────────────
function MutuellesMCQController({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers] = useState([])
  const q = MUTUELLES_INAMI_QUIZ[quizQ]
  const isLast = quizQ >= MUTUELLES_INAMI_QUIZ.length - 1

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
  const counts = countVotesPerOption(liveAnswers, q.options.length, q.type === 'qcm-multi')

  const { notAnswered } = useAutoRevealCorrection({
    answeredNames: liveAnswers.map(r => r.collaborateur),
    resetKey: quizQ,
    onReveal: () => setSharedState({ quiz_show_correction: true }).catch(() => {}),
  })

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Mutuelles et INAMI</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ display: 'inline-block', background: 'rgba(201,162,39,0.2)', border: '1px solid rgba(201,162,39,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#c9a227', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {MUTUELLES_INAMI_QUIZ.length}
        </div>
      </div>
      {q.instruction && (
        <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>{q.instruction}</div>
      )}
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 36, lineHeight: 1.3, maxWidth: 800, alignSelf: 'center' }}>{q.question}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        {q.options.map((opt, i) => {
          const count = counts[i]
          const isCorrect = Array.isArray(q.correct) ? q.correct.includes(i) : i === q.correct
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={i} style={{ background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: OPTION_COLORS[i % OPTION_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{'ABCDEF'[i]}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt}</span>
                  {isCorrect && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 10px', borderRadius: 20 }}>✓ Bonne réponse</span>}
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: isCorrect ? '#4ade80' : '#fff' }}>
                  {count}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 4 }}>vote{count !== 1 ? 's' : ''}</span>
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: isCorrect ? '#4ade80' : OPTION_COLORS[i % OPTION_COLORS.length], transition: 'width .5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
      <NotAnsweredList notAnswered={notAnswered} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginRight: 6 }}>{total}</span>
          participant{total !== 1 ? 's' : ''} {total !== 1 ? 'ont' : 'a'} répondu
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {total > 0 && (
            <button onClick={() => setSharedState({ quiz_show_correction: true }).catch(() => {})} style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Révéler les réponses →</button>
          )}
          {isLast ? (
            <button onClick={onEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>✓ Terminer le quiz</button>
          ) : (
            <button onClick={async () => { await setSharedState({ quiz_show_correction: false }).catch(() => {}); onNext() }} style={{ background: 'linear-gradient(135deg, #a07818, #c9a227)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(201,162,39,0.4)' }}>Question suivante →</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Bilan du groupe (vue formateur après quiz) ─────────────────────
function MutuellesGroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

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

  const participantNames = [...new Set((answers || []).map(r => r.collaborateur))]
  const participantCount = participantNames.length

  const questionStats = MUTUELLES_INAMI_QUIZ.map((q, idx) => {
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz · Mutuelles et INAMI</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{participantCount}</span>
          participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: 1.5, textTransform: 'uppercase',
          marginBottom: 12,
        }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d&apos;erreur décroissant</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, alignSelf: 'center', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15, padding: 40 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const priority = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{ background: priority.bg, border: `1px solid ${priority.border}`, borderRadius: 18, padding: '18px 22px' }}>
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
                <div style={{ height: '100%', borderRadius: 4, width: `${stat.pctWrong}%`, background: priority.color, transition: 'width .8s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32, gap: 16 }}>
        <button onClick={onTerminate} style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14,
          fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 24px rgba(220,38,38,0.4)',
        }}>✓ Terminer le module</button>
      </div>
    </div>
  )
}

export default function ModuleMutuelles({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [showGroupResults, setShowGroupResults] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [quizQ, setQuizQ] = useState(null)
  const syncedRef = useRef(false)
  const [revealedIds, setRevealedIds] = useState([])
  const [revealing, setRevealing] = useState(false)
  const [inamiRevealed, setInamiRevealed] = useState(false)
  const [inamiRevealing, setInamiRevealing] = useState(false)

  const toggleReveal = async (id) => {
    setRevealing(true)
    try {
      const next = revealedIds.includes(id)
        ? revealedIds.filter(x => x !== id)
        : [...revealedIds, id]
      setRevealedIds(next)
      await setSharedState({ mutuelles_revealed: next })
    } finally {
      setRevealing(false)
    }
  }

  const toggleInami = async () => {
    setInamiRevealing(true)
    try {
      const next = !inamiRevealed
      setInamiRevealed(next)
      await setSharedState({ inami_revealed: next })
    } finally {
      setInamiRevealing(false)
    }
  }

  const [partenaRevealed, setPartenaRevealed] = useState(false)
  const [partenaRevealing, setPartenaRevealing] = useState(false)

  const togglePartena = async () => {
    setPartenaRevealing(true)
    try {
      const next = !partenaRevealed
      setPartenaRevealed(next)
      await setSharedState({ partena_revealed: next })
    } finally {
      setPartenaRevealing(false)
    }
  }

  const syncAndWrite = async (data) => {
    if (!syncedRef.current) {
      await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName)
      syncedRef.current = true
    }
    sbUpdate('sessions', data, 'code=eq.' + getActiveSessionCode())
  }

  useEffect(() => {
    if (!started) return
    setSharedState({ mutuelles_revealed: [], inami_revealed: false, partena_revealed: false })
    syncAndWrite({ active_module: MODULE_ID, module_page: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  useEffect(() => {
    if (started && pageIndex > 0) {
      syncAndWrite({ module_page: pageIndex })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex])

  const handleBack = async () => {
    try { await Promise.all([sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()), setSharedState({ mutuelles_revealed: [], inami_revealed: false, partena_revealed: false })]) } catch { /* best-effort */ }
    onBack()
  }

  // quiz_final_phase inclus : sinon une valeur 'ended' laissée par un quiz
  // précédent dans cette salle ferait sauter le bilan de ce quiz-ci côté TV.
  const resetShared = () => setSharedState({ mutuelles_revealed: [], inami_revealed: false, partena_revealed: false, quiz_show_correction: false, quiz_final_phase: null })

  const handleTerminate = async () => {
    try { await Promise.all([sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()), resetShared()]) } catch { /* best-effort */ }
    onBack()
  }

  const handleStartQuiz = async () => {
    await setSharedState({ quiz_show_correction: false }).catch(() => {})
    await clearQuizStarts(getActiveSessionCode(), MODULE_ID).catch(() => {})
    setQuizQ(0)
    await syncAndWrite({ module_page: 100 })
  }

  const handleNextQ = async () => {
    const next = quizQ + 1
    await setSharedState({ quiz_show_correction: false }).catch(() => {})
    setQuizQ(next)
    await syncAndWrite({ module_page: 100 + next })
  }

  const handleEndQuiz = async () => {
    await setSharedState({ quiz_show_correction: false, quiz_final_phase: null }).catch(() => {})
    await syncAndWrite({ module_page: 200 })
    setShowGroupResults(true)
  }

  const handleTerminateModule = async () => {
    await handleTerminate()
  }

  if (showGroupResults) {
    return <MutuellesGroupResultsView onTerminate={handleTerminateModule} />
  }

  if (started && quizQ !== null) {
    const q = MUTUELLES_INAMI_QUIZ[quizQ]
    if (q?.type === 'text-open') {
      return <MutuellesTextOpenController quizQ={quizQ} onNext={handleNextQ} onEnd={handleEndQuiz} onBack={handleEndQuiz} />
    }
    return <MutuellesMCQController quizQ={quizQ} onNext={handleNextQ} onEnd={handleEndQuiz} onBack={handleEndQuiz} />
  }

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 500, padding: '0 24px', textAlign: 'center' }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
          <div style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Formation · Belgique · Journée 3
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Mutuelles et INAMI</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
            {PAGES.length} page{PAGES.length > 1 ? 's' : ''} · Remboursements · INAMI · Mutuelles belges
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleBack} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', padding: '14px 28px', borderRadius: 14,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Retour</button>
            <button onClick={() => setStarted(true)} style={{
              background: 'linear-gradient(135deg, #a07818, #c9a227)',
              border: 'none', color: '#fff', padding: '14px 40px',
              borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(201,162,39,0.4)', fontFamily: 'inherit',
            }}>▶ Lancer le module</button>
          </div>
        </div>
      </div>
    )
  }

  const page = PAGES[pageIndex]
  const isFirst = pageIndex === 0
  const isLast = pageIndex === PAGES.length - 1
  const nextPage = PAGES[pageIndex + 1] ?? null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Mutuelles et INAMI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {PAGES.map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? '#c9a227' : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {PAGES.length}</span>
          <button onClick={handleBack} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>✕ Quitter</button>
        </div>
      </div>

      {/* Page principale — contenu formateur */}
      {page?.type === 'partena-offre' ? (
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              Vue formateur · Page 4 (dernière)
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>PARTENA</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
              Offre partenaire Lunettes Pour Tous
            </div>

            {/* Offre toujours visible côté formateur */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { montant: '50 €', label: 'Verres unifocaux', icon: '👓' },
                { montant: '100 €', label: 'Verres progressifs', icon: '🔭' },
              ].map(o => (
                <div key={o.label} style={{
                  background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.3)',
                  borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{ fontSize: 26 }}>{o.icon}</span>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#c9a227', lineHeight: 1 }}>{o.montant}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>pour une paire à {o.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {[
                'Avantage disponible une fois tous les 2 ans',
                "Non cumulable avec l'Avantage Partenamut classique (75 € tous les 2 ans sur montures, verres correcteurs ou lentilles, chez l'opticien de son choix)",
                'Pas besoin de prescription ophtalmologique',
              ].map((c, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: '2px solid rgba(201,162,39,0.4)', borderRadius: 8, padding: '10px 14px',
                }}>
                  <span style={{ color: '#c9a227', flexShrink: 0 }}>●</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{c}</span>
                </div>
              ))}
            </div>

            <button
              onClick={togglePartena}
              disabled={partenaRevealing}
              style={{
                background: partenaRevealed ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #a07818, #c9a227)',
                border: partenaRevealed ? '1px solid rgba(239,68,68,0.3)' : 'none',
                color: partenaRevealed ? '#f87171' : '#fff',
                padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: partenaRevealing ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: partenaRevealing ? 0.7 : 1,
              }}
            >
              {partenaRevealed ? '🙈 Masquer l\'offre sur TV' : '👁 Dévoiler l\'offre sur TV'}
            </button>
          </div>
        </div>
      ) : page?.type === 'inami-info' ? (
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {/* Présentation INAMI */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              Vue formateur · Page 2
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>INAMI</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
              Institut National d&apos;Assurance Maladie-Invalidité
            </div>
            <div style={{
              background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.2)',
              borderRadius: 12, padding: '12px 18px',
              fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.6,
              marginBottom: 24,
            }}>
              🏛️ C&apos;est l&apos;organisme public qui gère l&apos;assurance obligatoire soins de santé en Belgique, c&apos;est donc lui qui fixe les règles.
            </div>

            {/* Conditions (toujours visibles côté formateur) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 14, marginBottom: 28 }}>
              {[
                {
                  titre: '👁️ Seuils de correction',
                  items: [
                    '< 18 ans : dès 0,25 dioptrie',
                    '18–64 ans : à partir de ± 6,00 dioptries',
                    '≥ 65 ans : à partir de ± 4,25 dioptries (bifocaux/progressifs)',
                  ],
                },
                {
                  titre: '🔄 Fréquence',
                  items: [
                    '< 18 ans : tous les 2 ans',
                    '≥ 18 ans : tous les 5 ans',
                    'Exception : si Δ dioptrie ≥ 0,5 vs précédente délivrance → droit immédiat',
                  ],
                },
                {
                  titre: '📄 Documents requis',
                  items: [
                    'Attestation de délivrance signée par l\'opticien (Annexe 15)',
                    'Prescription ophtalmologue valable (< 6 mois)',
                  ],
                },
              ].map((section) => (
                <div key={section.titre} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderTop: '2px solid rgba(201,162,39,0.5)', borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#c9a227', marginBottom: 10 }}>{section.titre}</div>
                  <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bouton Dévoiler */}
            <button
              onClick={toggleInami}
              disabled={inamiRevealing}
              style={{
                background: inamiRevealed ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #a07818, #c9a227)',
                border: inamiRevealed ? '1px solid rgba(239,68,68,0.3)' : 'none',
                color: inamiRevealed ? '#f87171' : '#fff',
                padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: inamiRevealing ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: inamiRevealing ? 0.7 : 1,
              }}
            >
              {inamiRevealed ? '🙈 Masquer les conditions sur TV' : '👁 Dévoiler les conditions sur TV'}
            </button>
          </div>
        </div>
      ) : page?.type === 'mutuelles-reveal' ? (
        <div style={{ flex: 1, padding: '28px 40px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
              Vue formateur · Page 3 — Cliquez «&nbsp;Révéler&nbsp;» pour projeter sur TV
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Les organismes assureurs en Belgique</div>
          </div>

          {/* Toutes les mutuelles — révélation individuelle */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 12 }}>
            {MUTUELLES_BELGIQUE.map((m) => {
              const isRevealed = revealedIds.includes(m.id)
              return (
                <div key={m.id} style={{
                  background: isRevealed ? 'rgba(201,162,39,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isRevealed ? 'rgba(201,162,39,0.4)' : 'rgba(255,255,255,0.09)'}`,
                  borderLeft: `3px solid ${isRevealed ? '#c9a227' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 3 }}>{m.nom}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{m.type}</div>
                  </div>

                  {isRevealed && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: m.complementaire ? '#4ade80' : '#f87171' }}>
                        {m.complementaire ? '✓ Assurance complémentaire optique' : '✗ Sans assurance complémentaire optique'}
                      </span>
                      {m.montant && m.montant !== '0 €' && m.montant !== 'Aucun' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px', marginTop: 4 }}>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>Montant</span>
                          <span style={{ fontSize: 13, fontWeight: 800, color: '#c9a227' }}>{m.montant}</span>
                          {m.frequence && m.frequence !== '/' && (
                            <>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>Fréquence</span>
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{m.frequence}</span>
                            </>
                          )}
                          {m.particularites && m.particularites !== '/' && (
                            <>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>Particularités</span>
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{m.particularites}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => toggleReveal(m.id)}
                    disabled={revealing}
                    style={{
                      alignSelf: 'flex-start',
                      background: isRevealed ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #a07818, #c9a227)',
                      border: isRevealed ? '1px solid rgba(239,68,68,0.3)' : 'none',
                      color: isRevealed ? '#f87171' : '#fff',
                      padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: revealing ? 'default' : 'pointer', fontFamily: 'inherit',
                      opacity: revealing ? 0.7 : 1,
                    }}
                  >
                    {isRevealed ? '🙈 Masquer' : '👁 Révéler sur TV'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 48px', gap: 32,
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(201,162,39,0.12)', border: '2px solid rgba(201,162,39,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52,
          }}>
            {page?.icon || '🛡️'}
          </div>

          <div style={{ textAlign: 'center', maxWidth: 640 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(201,162,39,0.15)',
              border: '1px solid rgba(201,162,39,0.3)', borderRadius: 20,
              padding: '4px 16px', fontSize: 11, fontWeight: 700,
              color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20,
            }}>
              Affiché sur TV et téléphones
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
              {page?.titre}
            </h1>
            {page?.sousTitre && (
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                {page.sousTitre}
              </p>
            )}
          </div>

          <div style={{
            background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)',
            borderRadius: 14, padding: '14px 24px',
            fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic',
          }}>
            💬 Laissez les participants s&apos;exprimer, puis passez à la suite
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ padding: '12px 48px 28px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {nextPage && (() => {
          const info = PAGE_TYPE_LABELS[nextPage.type] ?? { icon: '📄', label: nextPage.type }
          return (
            <div style={{
              marginBottom: 12, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(201,162,39,0.25)', borderLeft: '3px solid #c9a227',
              borderRadius: 10, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{nextPage.icon || info.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextPage.titre}</div>
                <div style={{ fontSize: 10, color: '#c9a227', marginTop: 1 }}>{info.label}</div>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>suivant →</div>
            </div>
          )
        })()}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => setPageIndex(i => Math.max(0, i - 1))}
            disabled={isFirst}
            style={{
              background: isFirst ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
              padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
              cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit',
            }}
          >← Précédent</button>

          {isLast ? (
            <button onClick={handleStartQuiz} style={{
              background: 'linear-gradient(135deg, #7c3aed, #9f67f5)',
              border: 'none', color: '#fff',
              padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 6px 24px rgba(124,58,237,0.4)',
              fontFamily: 'inherit',
            }}>▶ Démarrer le quiz</button>
          ) : (
            <button onClick={() => setPageIndex(i => i + 1)} style={{
              background: 'linear-gradient(135deg, #a07818, #c9a227)',
              border: 'none', color: '#fff',
              padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 6px 24px rgba(201,162,39,0.4)',
              fontFamily: 'inherit',
            }}>Suivant →</button>
          )}
        </div>
      </div>
    </div>
  )
}
