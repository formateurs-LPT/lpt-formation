'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, fetchOpenAnswers, setSharedState } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { NextPagePreview } from '@/lib/trainerPreview'
import { RETRAITS_PAGES, RETRAITS_QUIZ } from '@/lib/modulesData'

const BUBBLE_COLORS = ['#00abe9', '#4ade80', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']
const TOTAL_PAGES = RETRAITS_PAGES.length

function BrainstormController({ page, onNext, onBack }) {
  const [answers, setAnswers] = useState([])
  const [revealed, setRevealed] = useState(false)
  const pageId = `${page.moduleId}:brainstorm`

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchOpenAnswers(getActiveSessionCode(), pageId)
      setAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [pageId])

  const handleReveal = async () => {
    await setSharedState({ brainstorm_revealed: true })
    setRevealed(true)
  }

  const handleNext = async () => {
    await setSharedState({ brainstorm_revealed: false })
    onNext()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '20px 32px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>SAV · Retraits — Brainstorm</span>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >✕ Quitter</button>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)', borderRadius: 20, padding: '5px 20px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>💬 Brainstorm — Les formés répondent sur leur téléphone</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{page.question}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, alignSelf: 'center', width: '100%' }}>
        {answers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '28px', textAlign: 'center' }}>En attente des réponses…</div>
        ) : answers.map((row, i) => (
          <div key={row.participant_name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderLeft: `3px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}`, borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: `${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}22`, border: `2px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}>{row.participant_name?.charAt(0)?.toUpperCase() || '?'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length], marginBottom: 4 }}>{row.participant_name}</div>
              <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.5 }}>{row.answer}</div>
            </div>
          </div>
        ))}
      </div>
      {answers.length > 0 && <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>{answers.length} réponse{answers.length > 1 ? 's' : ''}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
        {!revealed ? (
          <button onClick={handleReveal} disabled={answers.length === 0} style={{ background: answers.length > 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: answers.length > 0 ? 'pointer' : 'default', fontFamily: 'inherit', opacity: answers.length === 0 ? 0.5 : 1 }}>
            👁 Révéler les réponses sur le diffuseur
          </button>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '10px 20px', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
            ✓ Réponses affichées sur le diffuseur
          </div>
        )}
        <button onClick={handleNext} style={{ background: 'linear-gradient(135deg, #00abe9, #0089ba)', border: 'none', color: '#fff', padding: '13px 32px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 5px 20px rgba(0,171,233,0.4)' }}>
          Passer aux explications →
        </button>
      </div>
    </div>
  )
}

// ─── Page de contenu ──────────────────────────────────────────
function SAVPage({ page, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage, onTerminate, quizLaunched, onLaunchQuiz }) {
  const [notesOpen, setNotesOpen] = useState(true)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [pageIndex])

  const { color, icon, titre, sousTitre, points, notesFormateur } = page

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>SAV · Retraits · {pageIndex + 1}/{total}</span>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >✕ Quitter</button>
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Gauche : titre + points */}
        <div style={{ flex: '3', padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{
            opacity: entered ? 1 : 0, transform: entered ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'all 0.5s ease',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{sousTitre}</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 28 }}>{titre}</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {points.map((pt, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: `3px solid ${color}70`, borderRadius: 12, padding: '12px 16px',
                  opacity: entered ? 1 : 0,
                  transform: entered ? 'translateX(0)' : 'translateX(-12px)',
                  transition: `all 0.4s ease ${0.1 + i * 0.08}s`,
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{pt.emoji}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Droite : notes formateur */}
        <div style={{ flex: '2', padding: '24px 24px', overflowY: 'auto' }}>
          <button onClick={() => setNotesOpen(o => !o)} style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            color: '#f59e0b', fontSize: 11, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: notesOpen ? 14 : 0, padding: 0,
          }}>
            <span>📝</span>
            <span>Notes formateur</span>
            <span style={{ marginLeft: 'auto', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{notesOpen ? '▾' : '▸'}</span>
          </button>

          {notesOpen && notesFormateur && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notesFormateur.map((note, i) => (
                <div key={i} style={{
                  background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                  borderLeft: '3px solid rgba(245,158,11,0.5)', borderRadius: 10, padding: '12px 14px',
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 5 }}>
                    {note.icon} {note.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{note.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '12px 28px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <NextPagePreview nextPage={nextPage} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onPrev} disabled={isFirst} style={{
            background: isFirst ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
            padding: '11px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>← Précédent</button>

          {isLast ? (
            quizLaunched ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>Quiz envoyé</span>
                <button onClick={onTerminate} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Terminer
                </button>
              </div>
            ) : (
              <button onClick={onLaunchQuiz} style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67fa)', border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(124,58,237,0.5)' }}>
                🧠 Lancer le quiz →
              </button>
            )
          ) : (
            <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 5px 20px ${color}40` }}>
              Suivant →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Lobby ────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Retour</button>
      <div style={{ textAlign: 'center', maxWidth: 560, padding: '0 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>📦</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>SAV · Journée 4 · Module 1</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Les Retraits</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
          Process complet du retrait client<br />SMS · Recherche · Essayage · Signature · Avis Google
        </p>
        <button onClick={onStart} style={{ background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none', color: '#fff', padding: '16px 48px', borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,171,233,0.45)', fontFamily: 'inherit' }}>▶ Démarrer</button>
      </div>
    </div>
  )
}

// ─── Quiz Controller ──────────────────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [openAnswers, setOpenAnswers] = useState([])
  const [validating, setValidating] = useState({})
  const [validated, setValidated] = useState({})

  const q = RETRAITS_QUIZ[quizQ]
  const isLast = quizQ >= RETRAITS_QUIZ.length - 1
  const pageId = `retraits:${quizQ}`

  useEffect(() => {
    setOpenAnswers([])
    setValidating({})
    setValidated({})
    const poll = async () => {
      const rows = await fetchOpenAnswers(getActiveSessionCode(), pageId)
      setOpenAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [quizQ, pageId])

  const handleValidate = async (row, isCorrect) => {
    if (validating[row.participant_name]) return
    setValidating(v => ({ ...v, [row.participant_name]: true }))
    try {
      await saveModuleQuizAnswer({ sessionCode: getActiveSessionCode(), moduleId: 'retraits', questionIdx: quizQ, collaborateur: row.participant_name, answerIdx: 0, isCorrect })
      setValidated(v => ({ ...v, [row.participant_name]: isCorrect ? 'correct' : 'wrong' }))
    } catch { /* best-effort */ } finally {
      setValidating(v => ({ ...v, [row.participant_name]: false }))
    }
  }

  const handleShowCorrection = async () => {
    await setSharedState({ quiz_show_correction: true }).catch(() => {})
  }

  // Une réponse non validée n'est jamais comptée dans le score final sans avertissement —
  // on bloque donc l'avancée tant que des réponses reçues n'ont pas été validées ✓/✗.
  const pendingCount = openAnswers.filter(row => !validated[row.participant_name]).length
  const confirmSkipPending = () => {
    if (pendingCount === 0) return true
    return window.confirm(
      `${pendingCount} réponse${pendingCount > 1 ? 's' : ''} pas encore validée${pendingCount > 1 ? 's' : ''} ✓/✗.\n\n` +
      `Si vous continuez maintenant, ${pendingCount > 1 ? 'elles compteront' : 'elle comptera'} comme fausse` +
      `${pendingCount > 1 ? 's' : ''} — même si la réponse était juste.\n\nContinuer quand même ?`
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Retraits — Vue formateur</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.2)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {RETRAITS_QUIZ.length}
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, maxWidth: 800, margin: '0 auto 14px' }}>{q.question}</div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)', borderRadius: 12, padding: '8px 22px', fontSize: 12, color: 'rgba(0,171,233,0.7)', fontStyle: 'italic' }}>
          Réponse attendue : {q.hint}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, margin: '0 auto', maxHeight: '45vh', overflowY: 'auto' }}>
        {openAnswers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>En attente des réponses des participants…</div>
        ) : openAnswers.map((row, i) => {
          const status = validated[row.participant_name]
          const isValidating = validating[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: status === 'correct' ? 'rgba(34,197,94,0.08)' : status === 'wrong' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === 'correct' ? 'rgba(34,197,94,0.3)' : status === 'wrong' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}22`, border: `2px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}>
                {row.participant_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length], marginBottom: 3 }}>{row.participant_name}</div>
                <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.4 }}>{row.answer}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {status ? (
                  <div style={{ fontSize: 22, fontWeight: 800, color: status === 'correct' ? '#4ade80' : '#f87171' }}>{status === 'correct' ? '✓' : '✗'}</div>
                ) : (
                  <>
                    <button onClick={() => handleValidate(row, true)} disabled={!!isValidating} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'rgba(34,197,94,0.18)', color: '#4ade80', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.5 : 1, fontFamily: 'inherit' }}>✓</button>
                    <button onClick={() => handleValidate(row, false)} disabled={!!isValidating} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.18)', color: '#f87171', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.5 : 1, fontFamily: 'inherit' }}>✗</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {openAnswers.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
          {openAnswers.length} réponse{openAnswers.length > 1 ? 's' : ''} reçue{openAnswers.length > 1 ? 's' : ''}
        </div>
      )}
      {pendingCount > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fbbf24', marginTop: 10 }}>
          ⚠️ {pendingCount} réponse{pendingCount > 1 ? 's' : ''} pas encore validée{pendingCount > 1 ? 's' : ''}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 28 }}>
        {openAnswers.length > 0 && (
          <button onClick={handleShowCorrection} style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.5)', color: '#fbbf24', padding: '14px 28px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            🎯 Voir la correction
          </button>
        )}
        {isLast ? (
          <button onClick={() => { if (confirmSkipPending()) onEnd() }} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>✓ Voir les résultats</button>
        ) : (
          <button onClick={() => { if (confirmSkipPending()) onNext() }} style={{ background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none', color: '#fff', padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(0,171,233,0.45)' }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ─── Group Results View ───────────────────────────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const rows = await fetchTrainerQuizAnswers(`session_code=eq.${getActiveSessionCode()}&module_id=eq.retraits`)
      setAnswers(rows || [])
      setLoading(false)
    }
    load()
  }, [])

  const participantCount = [...new Set((answers || []).map(r => r.collaborateur))].length
  const questionStats = RETRAITS_QUIZ.map((q, idx) => {
    const qA = answers.filter(r => r.question_idx === idx)
    const wrong = qA.filter(r => !r.is_correct).length
    const total = qA.length
    const pct = total > 0 ? Math.round((wrong / total) * 100) : 0
    return { idx, question: q.question, pctWrong: pct, total }
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz · Retraits</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{participantCount}</span>participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d'erreur décroissant</p>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, alignSelf: 'center', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const p = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 18, padding: '18px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{p.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: 1 }}>{p.label}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>Q{stat.idx + 1} — {stat.question}</div>
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: p.color, lineHeight: 1, flexShrink: 0 }}>
                  {stat.pctWrong}%
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>d'erreurs</div>
                </div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${stat.pctWrong}%`, background: p.color, transition: 'width .8s ease' }} />
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button onClick={onTerminate} style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(220,38,38,0.4)' }}>✓ Terminer le module</button>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────
export default function ModuleRetraits({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const [page, setPage] = useState(0)
  const [quizLaunched, setQuizLaunched] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [showGroupResults, setShowGroupResults] = useState(false)

  const sc = () => getActiveSessionCode()

  const handleStart = async () => {
    await sbUpdate('sessions', { active_module: 'retraits', module_page: 0 }, 'code=eq.' + sc())
    setStarted(true)
  }
  const handleNext = async () => {
    const next = page + 1
    await sbUpdate('sessions', { active_module: 'retraits', module_page: next }, 'code=eq.' + sc())
    setPage(next)
  }
  const handlePrev = async () => {
    const prev = page - 1
    await sbUpdate('sessions', { active_module: 'retraits', module_page: prev }, 'code=eq.' + sc())
    setPage(prev)
  }
  const handleBack = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + sc()) } catch { /* best-effort */ }
    onBack()
  }
  const handleLaunchQuiz = async () => {
    await setSharedState({ quiz_show_correction: false }).catch(() => {})
    await sbUpdate('sessions', { active_module: 'retraits', module_page: 100 }, 'code=eq.' + sc())
    setQuizQ(0)
    setQuizLaunched(true)
  }
  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await setSharedState({ quiz_show_correction: false }).catch(() => {})
    await sbUpdate('sessions', { active_module: 'retraits', module_page: 100 + next }, 'code=eq.' + sc())
    setQuizQ(next)
  }
  const handleEndQuiz = async () => {
    try { await sbUpdate('sessions', { active_module: 'retraits', module_page: 200 }, 'code=eq.' + sc()) } catch { /* best-effort */ }
    setShowGroupResults(true)
  }
  const handleTerminate = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + sc()) } catch { /* best-effort */ }
    ;(onTerminate ?? onBack)()
  }

  if (!started) return <Lobby onStart={handleStart} onBack={handleBack} />
  if (showGroupResults) return <GroupResultsView onTerminate={handleTerminate} />
  if (quizLaunched) return <QuizController quizQ={quizQ} onNext={handleNextQuestion} onEnd={handleEndQuiz} onBack={handleEndQuiz} />

  const currentPage = RETRAITS_PAGES[page]
  if (currentPage.type === 'sav-brainstorm') return <BrainstormController page={currentPage} onNext={handleNext} onBack={handleBack} />

  const contentStart = 1 // brainstorm is page 0
  const contentTotal = TOTAL_PAGES - 1
  const contentIndex = page - contentStart
  const nextPage = page < TOTAL_PAGES - 1
    ? { type: RETRAITS_PAGES[page + 1].type, color: RETRAITS_PAGES[page + 1].color, label: RETRAITS_PAGES[page + 1].titre }
    : null

  return (
    <SAVPage
      page={currentPage}
      onBack={handleBack}
      onPrev={handlePrev}
      onNext={handleNext}
      isFirst={false}
      isLast={page >= TOTAL_PAGES - 1}
      pageIndex={contentIndex}
      total={contentTotal}
      nextPage={nextPage}
      onTerminate={handleTerminate}
      quizLaunched={quizLaunched}
      onLaunchQuiz={handleLaunchQuiz}
    />
  )
}
