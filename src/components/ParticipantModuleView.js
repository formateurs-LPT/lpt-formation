'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA, ORD_COLS, ORD_EXAMPLE } from '@/lib/modulesData'
import { sbInsert, sbSelect, SESSION_CODE } from '@/lib/supabase'
import { generatePin } from '@/lib/pin'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

const STYLES = `
  @keyframes chipIn {
    from { opacity: 0; transform: translateX(-4px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .frise-chips { -ms-overflow-style: none; scrollbar-width: none; }
  .frise-chips::-webkit-scrollbar { display: none; }
  @keyframes verreFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-18px) scale(1.05); }
  }
  @keyframes haloBreath {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.2); }
  }
  @keyframes avatarGlow {
    0%, 100% { box-shadow: 0 0 0 3px rgba(0,171,233,0.2), 0 4px 20px rgba(0,171,233,0.3); }
    50% { box-shadow: 0 0 0 4px rgba(0,171,233,0.4), 0 4px 32px rgba(0,171,233,0.6); }
  }
  @keyframes waitDot {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

function WaitingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
    }}>
      <Image src="/assets/logo-lpt.png" alt="LPT" width={160} height={60}
        style={{ objectFit: 'contain', marginBottom: 48 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#00abe9',
          animation: 'waitDot 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          La formation va commencer…
        </span>
      </div>
    </div>
  )
}

// Écran réponse pour UNE question — s'affiche sur le téléphone
// La question est sur la TV, le participant répond ici
function QuizAnswerScreen({ pName, qIdx, quiz, moduleId }) {
  const q = quiz[qIdx]
  const [answered, setAnswered] = useState(false)
  const [chosenIdx, setChosenIdx] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAnswer = async (optIdx) => {
    if (answered || saving) return
    setSaving(true)
    setAnswered(true)
    setChosenIdx(optIdx)
    const isCorrect = optIdx === q.correct
    try {
      await sbInsert('quiz_answers', {
        session_code: SESSION_CODE,
        collaborateur: pName || 'Anonyme',
        question_idx: qIdx,
        answer_idx: optIdx,
        is_correct: isCorrect,
        module_id: moduleId,
      })
      // module_results est sauvegardé dans PersonalResultsScreen avec le score total
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  if (answered) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Réponse enregistrée !</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>En attente de la prochaine question…</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '48px 20px 40px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Badge */}
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px',
        fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24,
      }}>Question {qIdx + 1} / {quiz.length}</div>

      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 40, textAlign: 'center' }}>
        Regardez la question sur l'écran<br />et choisissez votre réponse
      </div>

      {/* Boutons réponse — gros et tactiles */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 400 }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)} style={{
            background: OPTION_COLORS[i],
            border: 'none', borderRadius: 18,
            padding: '22px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', fontFamily: 'inherit', width: '100%',
            boxShadow: `0 6px 24px ${OPTION_COLORS[i]}55`,
            transition: 'transform .1s, opacity .1s',
            active: { transform: 'scale(0.97)' },
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(0,0,0,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 800, color: '#fff',
            }}>{'ABCD'[i]}</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#fff', textAlign: 'left' }}>{opt}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function PersonalResultsScreen({ pName, quiz, moduleId }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [displayedScore, setDisplayedScore] = useState(0)
  const [displayedXP, setDisplayedXP] = useState(0)
  const [cardsVisible, setCardsVisible] = useState(false)

  useEffect(() => {
    const fetchAnswers = async () => {
      const name = pName || 'Anonyme'
      const rows = await sbSelect('quiz_answers', `session_code=eq.${SESSION_CODE}&collaborateur=eq.${encodeURIComponent(name)}`)
      const data = rows || []
      setAnswers(data)
      setLoading(false)

      // Sauvegarde module_results avec le score total réel
      const totalCorrect = data.filter(r => r.is_correct).length
      const totalQ = quiz.length
      const earnedXP = totalCorrect * 50
      try {
        await sbInsert('module_results', {
          collaborateur: name,
          pin: generatePin(name),
          week_date: new Date().toISOString().slice(0, 10),
          module_id: moduleId,
          score: totalCorrect,
          score_total: totalQ,
          xp: earnedXP,
          completed_at: new Date().toISOString(),
        })
      } catch (e) { console.error(e) }
    }
    fetchAnswers()
  }, [pName])

  const answerMap = {}
  answers.forEach(row => { answerMap[row.question_idx] = row })
  const total = quiz.length
  const correct = answers.filter(r => r.is_correct).length
  const xp = correct * 50

  // Animate score
  useEffect(() => {
    if (loading) return
    setDisplayedScore(0)
    const delay = setTimeout(() => {
      let current = 0
      const timer = setInterval(() => {
        current += 1
        setDisplayedScore(current)
        if (current >= correct) clearInterval(timer)
      }, 300)
      return () => clearInterval(timer)
    }, 600)
    return () => clearTimeout(delay)
  }, [loading, correct])

  // Animate XP
  useEffect(() => {
    if (loading) return
    setDisplayedXP(0)
    const delay = setTimeout(() => {
      let current = 0
      const timer = setInterval(() => {
        current = Math.min(current + 5, xp)
        setDisplayedXP(current)
        if (current >= xp) clearInterval(timer)
      }, 20)
      return () => clearInterval(timer)
    }, 800)
    return () => clearTimeout(delay)
  }, [loading, xp])

  // Staggered cards reveal
  useEffect(() => {
    if (loading) return
    const delay = setTimeout(() => setCardsVisible(true), 400)
    return () => clearTimeout(delay)
  }, [loading])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '40px 20px 60px',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Header label */}
      <div style={{
        background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
        borderRadius: 20, padding: '6px 20px',
        fontSize: 11, fontWeight: 700, color: '#00abe9',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 28,
      }}>Résultats du quiz</div>

      {/* Big score */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
          {displayedScore}<span style={{ fontSize: 32, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>/{total}</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>bonne{correct !== 1 ? 's' : ''} réponse{correct !== 1 ? 's' : ''}</div>
      </div>

      {/* XP badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '8px 20px', marginBottom: 36,
      }}>
        <span style={{ fontSize: 20, fontWeight: 900, color: '#a78bfa' }}>+{displayedXP} XP</span>
      </div>

      {/* Question cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 420 }}>
        {quiz.map((q, idx) => {
          const row = answerMap[idx]
          const isCorrect = row ? row.is_correct : null
          const chosenIdx = row ? row.answer_idx : null
          const chosenText = chosenIdx != null ? q.options[chosenIdx] : null
          const correctText = q.options[q.correct]

          return (
            <div key={idx} style={{
              background: isCorrect ? 'rgba(34,197,94,0.08)' : isCorrect === false ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.3)' : isCorrect === false ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 18, padding: '16px 18px',
              opacity: cardsVisible ? 1 : 0,
              animation: cardsVisible ? `fadeSlideUp .4s ease ${idx * 0.1}s both` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: isCorrect === false ? 10 : 0 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isCorrect ? 'rgba(34,197,94,0.2)' : isCorrect === false ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                }}>Q{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.4, marginBottom: 4 }}>
                    {q.question}
                  </div>
                  {chosenText && (
                    <div style={{ fontSize: 12, color: isCorrect ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                      {isCorrect ? '✅' : '❌'} {chosenText}
                    </div>
                  )}
                  {!row && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>— Sans réponse</div>
                  )}
                </div>
              </div>
              {isCorrect === false && (
                <div style={{
                  background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 10, padding: '8px 12px',
                  fontSize: 12, color: '#4ade80', fontWeight: 600,
                }}>
                  Bonne réponse : {correctText}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Correction scale — vue téléphone — frise ──────────────────────
const MOB_NEG   = Array.from({ length: 32 }, (_, i) => (i + 1) * 0.25) // −0,25 → −8,00
const MOB_POS   = Array.from({ length: 29 }, (_, i) => (i + 1) * 0.25) // +0,25 → +7,25
const mobFmt    = (v) => v.toFixed(2).replace('.', ',')
const MOB_PLAN_W = 68 // colonne Plan fixe
const MOB_ROW_H  = 40 // hauteur rangée chips

function CorrectionScaleMobile({ page, pageIndex, total }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    let s = 0; let tid
    const next = () => {
      s++
      if (s > MOB_NEG.length) return
      setStep(s)
      tid = setTimeout(next, 90)
    }
    tid = setTimeout(next, 500)
    return () => clearTimeout(tid)
  }, [page.id])

  const negVisible = MOB_NEG.slice(0, step)
  const posVisible = MOB_POS.slice(0, step)
  const mobChip = {
    padding: '7px 11px', borderRadius: 8, flexShrink: 0,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    animation: 'chipIn 0.2s ease',
    fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
    fontVariantNumeric: 'tabular-nums',
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/assets/logo-lpt.png" alt="LPT" width={64} height={24} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, width: i === pageIndex ? 18 : 4, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)', transition: 'all .4s' }} />
          ))}
        </div>
      </div>

      {/* Titre */}
      <div style={{ padding: '14px 20px 10px' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{page.sousTitre}</div>
      </div>

      {/* Frise */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 16px 32px' }}>

        {/* Négatifs */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ width: MOB_PLAN_W, flexShrink: 0 }} />
          <div className="frise-chips" style={{ flex: 1, minWidth: 0, overflowX: 'scroll', touchAction: 'pan-x' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, padding: '3px 0', width: 'max-content' }}>
              {negVisible.map((v, i) => <div key={i} style={mobChip}>−{mobFmt(v)}</div>)}
            </div>
          </div>
        </div>

        {/* Axe Plan */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: MOB_PLAN_W, flexShrink: 0, paddingRight: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#00abe9', lineHeight: 1 }}>Plan</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>0,00</div>
          </div>
          <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.22)', borderRadius: 1 }} />
        </div>

        {/* Positifs */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 10 }}>
          <div style={{ width: MOB_PLAN_W, flexShrink: 0 }} />
          <div className="frise-chips" style={{ flex: 1, minWidth: 0, overflowX: 'scroll', touchAction: 'pan-x' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 4, padding: '3px 0', width: 'max-content' }}>
              {posVisible.map((v, i) => <div key={i} style={mobChip}>+{mobFmt(v)}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Ordonnance — vue téléphone ────────────────────────────────────
function OrdonnanceMobile({ page, pageIndex, total }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    const T = [400, 1000, 1600, 2800, 3200, 3500, 3800, 4200, 4500, 4800, 5300]
    const timers = T.map((t, i) => setTimeout(() => setStep(s => Math.max(s, i + 1)), t))
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  const show = (n) => step >= n
  const cellVis = (row, col) => show(row === 0 ? 5 + col : 8 + col)

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Image src="/assets/logo-lpt.png" alt="LPT" width={64} height={24} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, width: i === pageIndex ? 18 : 4, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)', transition: 'all .4s' }} />
          ))}
        </div>
      </div>

      {/* Titre */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{page.sousTitre}</div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, padding: '16px 16px 32px', display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>

        {/* Phase 1 — 3 cartes empilées */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ORD_COLS.map((col, i) => (
            <div key={col.key} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: `${col.color}0d`, border: `1px solid ${col.color}25`,
              borderLeft: `4px solid ${col.color}`, borderRadius: 14,
              padding: '14px 16px',
              opacity: show(i + 1) ? 1 : 0,
              transform: show(i + 1) ? 'translateY(0)' : 'translateY(12px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <div style={{ minWidth: 64, flexShrink: 0, fontSize: 10, fontWeight: 800, color: col.color, textTransform: 'uppercase', letterSpacing: 1 }}>
                {col.label}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{col.desc}</div>
                {col.sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{col.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Phase 2 — Table */}
        <div style={{
          opacity: show(4) ? 1 : 0,
          transform: show(4) ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.5s ease',
          marginTop: 8,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Exemple d&apos;ordonnance
          </div>

          <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* En-têtes */}
            <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(3, 1fr)', background: 'rgba(255,255,255,0.04)' }}>
              <div />
              {ORD_COLS.map(col => (
                <div key={col.key} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 800, color: col.color, textTransform: 'uppercase', letterSpacing: 0.5, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* OD */}
            <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ padding: '12px 10px', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>OD</div>
              {ORD_COLS.map((col, ci) => (
                <div key={col.key} style={{
                  padding: '12px 10px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center',
                  opacity: cellVis(0, ci) ? 1 : 0, transform: cellVis(0, ci) ? 'translateX(0)' : 'translateX(-8px)', transition: 'all 0.35s ease',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.od[col.key]}</span>
                </div>
              ))}
            </div>

            {/* OG */}
            <div style={{ display: 'grid', gridTemplateColumns: '44px repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '12px 10px', fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>OG</div>
              {ORD_COLS.map((col, ci) => (
                <div key={col.key} style={{
                  padding: '12px 10px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center',
                  opacity: cellVis(1, ci) ? 1 : 0, transform: cellVis(1, ci) ? 'translateX(0)' : 'translateX(-8px)', transition: 'all 0.35s ease',
                }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.og[col.key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Addition */}
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12,
            opacity: show(11) ? 1 : 0, transform: show(11) ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s ease',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1.5 }}>Addition</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.add}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>Presbytie · progressif</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Troubles list — vue téléphone ────────────────────────────────
function TroublesListMobile({ page, pageIndex, total, moduleLabel }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    const timers = page.troubles.map((_, i) =>
      setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), 250 + i * 220)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, #0d3b7a 100%)`,
      display: 'flex', flexDirection: 'column',
      padding: '0 0 24px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/assets/logo-lpt.png" alt="LPT" width={64} height={24} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              width: i === pageIndex ? 18 : 4,
              background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)',
              transition: 'all .4s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Titre */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
          borderRadius: 20, padding: '3px 12px',
          fontSize: 10, fontWeight: 700, color: '#00abe9',
          textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10,
        }}>{moduleLabel || 'Les bases de l\'optique'}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{page.titre}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{page.sousTitre}</div>
      </div>

      {/* Liste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 16px 0', flex: 1 }}>
        {page.troubles.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: 14,
            background: i < visibleCount ? `${t.color}09` : 'transparent',
            border: `1px solid ${i < visibleCount ? t.color + '28' : 'transparent'}`,
            borderLeft: `4px solid ${i < visibleCount ? t.color : 'transparent'}`,
            borderRadius: 14, padding: '16px 18px',
            opacity: i < visibleCount ? 1 : 0,
            transform: i < visibleCount ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: t.color, letterSpacing: 1, opacity: 0.7, paddingTop: 3, minWidth: 20 }}>
              {t.num}
            </span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: -0.3, marginBottom: 4 }}>
                {t.nom}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, fontWeight: 400 }}>
                {t.def}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ModuleScreen({ page, pageIndex, total, moduleLabel }) {
  const [key, setKey] = useState(0)
  useEffect(() => { setKey(k => k + 1) }, [page.id])

  if (page.type === 'troubles-list')    return <TroublesListMobile    page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'correction-scale') return <CorrectionScaleMobile  page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'ordonnance')        return <OrdonnanceMobile        page={page} pageIndex={pageIndex} total={total} />

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, ${page.color}15 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '100px 24px 120px',
    }}>

      {/* Indicateur page en haut */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Image src="/assets/logo-lpt.png" alt="LPT" width={72} height={28}
          style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              width: i === pageIndex ? 20 : 4,
              background: i === pageIndex ? page.color : 'rgba(255,255,255,0.2)',
              transition: 'all .4s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Titre animé */}
      <div key={key} style={{
        textAlign: 'center', marginBottom: 40,
        animation: 'fadeSlideUp .5s ease forwards',
      }}>
        <div style={{
          display: 'inline-block',
          background: `${page.color}20`, border: `1px solid ${page.color}40`,
          borderRadius: 20, padding: '3px 14px',
          fontSize: 10, fontWeight: 700, color: page.color,
          textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
        }}>{moduleLabel || 'Formation LPT'}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {page.titre}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          {page.sousTitre}
        </div>
      </div>

      {/* Illustration — centré */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Halo */}
        <div style={{
          position: 'absolute',
          width: 320, height: 320, borderRadius: '50%',
          background: `radial-gradient(circle, ${page.color}30 0%, transparent 70%)`,
          animation: 'haloBreath 3.5s ease-in-out infinite',
        }} />
        {page.image ? (
          /* Photo module */
          <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
            <Image
              src={page.image}
              alt="Illustration"
              width={260}
              height={260}
              style={{
                objectFit: 'contain',
                borderRadius: 20,
                boxShadow: `0 0 40px ${page.color}60, 0 16px 32px rgba(0,0,0,0.4)`,
              }}
              priority
            />
          </div>
        ) : page.icon ? (
          /* Emoji module */
          <div style={{
            width: 220, height: 220, borderRadius: '50%',
            background: `${page.color}18`, border: `2px solid ${page.color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'verreFloat 4s ease-in-out infinite',
            position: 'relative', zIndex: 1,
          }}>
            <span style={{ fontSize: 100, lineHeight: 1 }}>{page.icon}</span>
          </div>
        ) : (
          /* Verre par défaut */
          <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
            <Image
              src="/assets/verre-unifocal-2.png"
              alt="Verre"
              width={260}
              height={260}
              style={{
                objectFit: 'contain',
                filter: `drop-shadow(0 0 40px ${page.color}80) drop-shadow(0 16px 32px rgba(0,0,0,0.4))`,
              }}
              priority
            />
          </div>
        )}
      </div>

      {/* Avatar formateur — bas de l'écran */}
      <div style={{
        position: 'absolute', bottom: 24, right: 20,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(10,42,92,0.85)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,171,233,0.25)', borderRadius: 16,
        padding: '8px 14px 8px 8px',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
          animation: 'avatarGlow 2.5s ease-in-out infinite',
        }}>
          <Image src="/assets/avatar_kevin.png" alt="Kevin"
            width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Kevin</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Formateur · LPT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00abe9', animation: 'haloBreath 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 8, fontWeight: 700, color: '#00abe9', letterSpacing: .5 }}>EN DIRECT</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ParticipantModuleView({ forcedModule, forcedPage, pName: pNameProp }) {
  const sync = useModuleSync(forcedModule != null ? 99999 : 1200)
  const activeModule = forcedModule ?? sync.activeModule
  const modulePage   = forcedPage  ?? sync.modulePage

  // Récupère le nom depuis le prop ou le localStorage (connexion via QR)
  const pName = pNameProp || (typeof window !== 'undefined' ? localStorage.getItem('participant_name') || '' : '')

  const moduleData = MODULE_DATA[activeModule] || null
  const pages = moduleData?.pages || []
  const quiz = moduleData?.quiz || []

  const isResults = !!moduleData && modulePage === 200
  const isQuiz = !!moduleData && modulePage >= 100 && modulePage < 200
  const qIdx = modulePage - 100
  const page = (!isQuiz && !isResults && moduleData) ? (pages[modulePage] ?? null) : null

  return (
    <>
      <style>{STYLES}</style>
      {isResults
        ? <PersonalResultsScreen key="results" pName={pName} quiz={quiz} moduleId={activeModule} />
        : isQuiz
          ? <QuizAnswerScreen key={modulePage} pName={pName} qIdx={qIdx} quiz={quiz} moduleId={activeModule} />
          : page
            ? <ModuleScreen page={page} pageIndex={modulePage} total={pages.length} moduleLabel={moduleData?.label} />
            : <WaitingScreen />
      }
    </>
  )
}
