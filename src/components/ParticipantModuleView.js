'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA, ORD_COLS, ORD_EXAMPLE, SAISIE_EXERCISES } from '@/lib/modulesData'
import { sbUpsert, sbSelect, SESSION_CODE, ensureSession, getSharedState, setSharedState } from '@/lib/supabase'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { generatePin } from '@/lib/pin'
import { resolveParticipantName } from '@/lib/participantNames'

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
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60}
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

function ParticipantModuleLobby({ moduleLabel, moduleSub }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={140} height={52}
        style={{ objectFit: 'contain', marginBottom: 40 }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
        Module de formation
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
        {moduleLabel}
      </div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 40, lineHeight: 1.6 }}>
        {moduleSub}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#00abe9',
          animation: 'waitDot 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          Démarrage imminent…
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
  const [saveError, setSaveError] = useState(false)

  const handleAnswer = async (optIdx) => {
    if (answered || saving) return
    if (!pName?.trim()) {
      setSaveError(true)
      return
    }
    setSaving(true)
    setSaveError(false)
    const isCorrect = optIdx === q.correct
    try {
      const saved = await saveModuleQuizAnswer({
        sessionCode: SESSION_CODE,
        moduleId,
        questionIdx: qIdx,
        collaborateur: pName.trim(),
        answerIdx: optIdx,
        isCorrect,
      })
      if (!saved) {
        setSaveError(true)
        setSaving(false)
        return
      }
      setAnswered(true)
      setChosenIdx(optIdx)
    } catch (e) {
      console.error(e)
      setSaveError(true)
    }
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

      {saveError && (
        <div style={{
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
          borderRadius: 12, padding: '12px 16px', marginBottom: 20, maxWidth: 400,
          fontSize: 14, color: '#fca5a5', textAlign: 'center',
        }}>
          Enregistrement impossible. Rechargez la page ou prévenez le formateur.
        </div>
      )}

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
      const rows = await sbSelect('quiz_answers', `session_code=eq.${SESSION_CODE}&module_id=eq.${moduleId}&collaborateur=eq.${encodeURIComponent(name)}`)
      const data = rows || []
      setAnswers(data)
      setLoading(false)

      // Sauvegarde module_results avec le score total réel (upsert pour éviter les doublons)
      const totalCorrect = data.filter(r => r.is_correct).length
      const totalQ = quiz.length
      const earnedXP = totalCorrect * 50
      try {
        await sbUpsert('module_results', {
          collaborateur: name,
          pin: generatePin(name),
          week_date: new Date().toISOString().slice(0, 10),
          module_id: moduleId,
          score: totalCorrect,
          score_total: totalQ,
          xp: earnedXP,
          completed_at: new Date().toISOString(),
        }, 'collaborateur,module_id,week_date')
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
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={64} height={24} style={{ objectFit: 'contain', opacity: 0.7 }} />
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
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={64} height={24} style={{ objectFit: 'contain', opacity: 0.7 }} />
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
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>Correction presbytie</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pause atelier — vue téléphone ────────────────────────────────
function PauseMobile({ page, pageIndex, total }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={64} height={24} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, width: i === pageIndex ? 18 : 4, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)', transition: 'all .4s' }} />
          ))}
        </div>
      </div>

      {/* Centre */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: '40px 24px',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%',
          background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(0,171,233,0.15)',
        }}>
          <span style={{ fontSize: 44, lineHeight: 1 }}>{page.icon}</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
            {page.titre}
          </div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: 400, lineHeight: 1.5 }}>
            {page.sousTitre}
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
          borderRadius: 30, padding: '10px 20px',
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#00abe9', animation: 'waitDot 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>En cours avec le formateur…</span>
        </div>
      </div>
    </div>
  )
}

// ── Troubles intro — vue téléphone ───────────────────────────────
function TroublesIntroMobile({ page, pageIndex, total }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={64} height={24} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, width: i === pageIndex ? 18 : 4, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)', transition: 'all .4s' }} />
          ))}
        </div>
      </div>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: '40px 24px',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          width: 88, height: 88, borderRadius: '50%',
          background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(0,171,233,0.15)',
        }}>
          <span style={{ fontSize: 42, lineHeight: 1 }}>{page.icon}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Les bases de l&apos;optique
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
            {page.titre}
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 12, fontStyle: 'italic' }}>
            {page.sousTitre}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Troubles list — vue téléphone ────────────────────────────────
function TroublesListMobile({ page, pageIndex, total, moduleLabel }) {
  const [visibleCount, setVisibleCount] = useState(0)
  const [troublesPhase, setTroublesPhase] = useState(1)
  const [defVisible, setDefVisible] = useState(0)

  // Anime les lignes à l'arrivée
  useEffect(() => {
    setVisibleCount(0)
    const timers = page.troubles.map((_, i) =>
      setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), 250 + i * 220)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  // Poll troubles_phase depuis trainer_state
  useEffect(() => {
    const poll = async () => {
      try {
        const state = await getSharedState()
        setTroublesPhase(state?.troubles_phase || 1)
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [])

  // Stagger des définitions quand phase 2
  useEffect(() => {
    if (troublesPhase !== 2) { setDefVisible(0); return }
    const timers = page.troubles.map((_, i) =>
      setTimeout(() => setDefVisible(c => Math.max(c, i + 1)), 500 + i * 900)
    )
    return () => timers.forEach(clearTimeout)
  }, [troublesPhase])

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, #0d3b7a 100%)`,
      display: 'flex', flexDirection: 'column',
      padding: '0 0 24px', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={64} height={24} style={{ objectFit: 'contain', opacity: 0.7 }} />
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
              <div style={{
                fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5, fontWeight: 400,
                opacity: troublesPhase === 2 && i < defVisible ? 1 : 0,
                transform: troublesPhase === 2 && i < defVisible ? 'translateY(0)' : 'translateY(4px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
                minHeight: 18,
              }}>
                {t.def}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Saisie interactive — vue téléphone (style app LPT) ────────────
const APP_GOLD = '#c8a52a'
const APP_BG   = '#eae7f0'
const APP_DARK = '#2a2840'

// ── Tableaux de valeurs (ordonnés : drag-up = négatif/moins, drag-down = positif/plus) ──
const SPH_VALS = Array.from({ length: 65 }, (_, i) => {
  const v = parseFloat((8 - i * 0.25).toFixed(3))
  const a = Math.abs(v).toFixed(2).replace('.', ',')
  return { val: v, label: v > 0.001 ? `+${a}` : v < -0.001 ? `−${a}` : '0,00' }
})
const CYL_VALS = Array.from({ length: 65 }, (_, i) => {
  const v = parseFloat((8 - i * 0.25).toFixed(3))
  const a = Math.abs(v).toFixed(2).replace('.', ',')
  return { val: v, label: v > 0.001 ? `+${a}` : v < -0.001 ? `−${a}` : '0,00' }
})
const AXE_VALS = Array.from({ length: 181 }, (_, i) => ({ val: i, label: `${i}°` }))
const ADD_VALS = Array.from({ length: 17 }, (_, i) => {
  const v = parseFloat((i * 0.25).toFixed(3))
  return { val: v, label: v > 0.001 ? `+${v.toFixed(2).replace('.', ',')}` : '0,00' }
})

// Index "zéro" dans chaque tableau
const SPH_ZERO = 32   // 8 - 32*0.25 = 0.00
const CYL_ZERO = 32   // 8 - 32*0.25 = 0.00
const AXE_ZERO = 0    // 0°
const ADD_ZERO = 0    // 0.00

const findSphIdx = v => Math.max(0, Math.min(64, Math.round((8 - v) / 0.25)))
const findCylIdx = v => Math.max(0, Math.min(64, Math.round((8 - v) / 0.25)))
const findAxeIdx = v => Math.max(0, Math.min(180, Math.round(v)))

// ── WheelPicker (roulette tactile) ────────────────────────────────
// circular=true : le tableau boucle sur lui-même (0° ↔ 180°)
function WheelPicker({ values, selectedIdx, onChange, showResult, isCorrect, correctLabel, circular = false }) {
  const ITEM_H = 38
  const H = ITEM_H * 3
  const CENTER = ITEM_H

  // Pour le mode circulaire, on préfixe/suffixe quelques items pour que
  // le défilement au-delà des bords affiche les valeurs enroulées
  const PAD = circular ? 3 : 0
  const padded = circular
    ? [...values.slice(-PAD), ...values, ...values.slice(0, PAD)]
    : values
  const paddedSelected = selectedIdx + PAD

  const [offset, setOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef(null)
  const offsetRef = useRef(0)
  const dragRef = useRef({ active: false, startY: 0, lastY: 0, lastT: 0, vel: 0 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onStart = (e) => {
      const y = e.touches ? e.touches[0].clientY : e.clientY
      dragRef.current = { active: true, startY: y, lastY: y, lastT: Date.now(), vel: 0 }
      setIsDragging(true)
    }

    const onMove = (e) => {
      if (!dragRef.current.active) return
      if (e.cancelable) e.preventDefault()
      const y = e.touches ? e.touches[0].clientY : e.clientY
      const now = Date.now()
      const dt = now - dragRef.current.lastT
      if (dt > 0) dragRef.current.vel = (y - dragRef.current.lastY) / dt
      dragRef.current.lastY = y
      dragRef.current.lastT = now
      offsetRef.current = y - dragRef.current.startY
      setOffset(offsetRef.current)
    }

    const onEnd = () => {
      if (!dragRef.current.active) return
      dragRef.current.active = false
      setIsDragging(false)

      const momentum = dragRef.current.vel * 90
      const total = offsetRef.current + momentum
      const delta = -Math.round(total / ITEM_H)

      let newIdx
      if (circular) {
        newIdx = ((selectedIdx + delta) % values.length + values.length) % values.length
      } else {
        newIdx = Math.max(0, Math.min(values.length - 1, selectedIdx + delta))
      }

      // Chemin le plus court pour l'animation (évite le saut visuel)
      let diff = selectedIdx - newIdx
      if (circular) {
        if (diff >  values.length / 2) diff -= values.length
        if (diff < -values.length / 2) diff += values.length
      }
      offsetRef.current = diff * ITEM_H
      setOffset(diff * ITEM_H)

      onChange(newIdx)
      requestAnimationFrame(() => { offsetRef.current = 0; setOffset(0) })
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove',  onMove,  { passive: false })
    el.addEventListener('touchend',   onEnd)
    el.addEventListener('mousedown',  onStart)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onEnd)

    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove',  onMove)
      el.removeEventListener('touchend',   onEnd)
      el.removeEventListener('mousedown',  onStart)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onEnd)
    }
  }, [selectedIdx, onChange, values.length, circular])

  const translateY = CENTER - paddedSelected * ITEM_H + offset
  const bandBg     = showResult ? (isCorrect ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.15)') : 'rgba(200,165,42,0.13)'
  const bandBorder = showResult ? (isCorrect ? '#22c55e' : '#ef4444') : 'rgba(200,165,42,0.45)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div ref={containerRef} style={{ width: '100%', height: H, overflow: 'hidden', position: 'relative', cursor: 'grab', userSelect: 'none', touchAction: 'none' }}>
        {/* Bande centrale */}
        <div style={{
          position: 'absolute', top: CENTER, left: 0, right: 0, height: ITEM_H,
          background: bandBg, borderTop: `1.5px solid ${bandBorder}`, borderBottom: `1.5px solid ${bandBorder}`,
          zIndex: 1, pointerEvents: 'none',
        }} />

        {/* Items (padded pour le circulaire) */}
        <div style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}>
          {padded.map((item, i) => {
            const dist = Math.abs(i - paddedSelected)
            return (
              <div key={i} style={{
                height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: dist === 0 ? 15 : 11,
                fontWeight: dist === 0 ? 700 : 400,
                color: dist === 0 ? APP_DARK : '#bbb',
                fontVariantNumeric: 'tabular-nums',
                pointerEvents: 'none',
                transition: 'font-size 0.15s, color 0.15s',
              }}>
                {item.label}
              </div>
            )
          })}
        </div>

        {/* Fondu haut */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: CENTER, background: 'linear-gradient(to bottom, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.2) 100%)', pointerEvents: 'none', zIndex: 2 }} />
        {/* Fondu bas */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: CENTER, background: 'linear-gradient(to top, rgba(255,255,255,0.97) 0%, rgba(255,255,255,0.2) 100%)', pointerEvents: 'none', zIndex: 2 }} />
      </div>

      {/* Bonne réponse si incorrect */}
      {showResult && !isCorrect && (
        <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textAlign: 'center' }}>
          ✓ {correctLabel}
        </div>
      )}
    </div>
  )
}

// ── Pavé numérique axe ────────────────────────────────────────────
function AxeNumpad({ currentValue, onConfirm, onClose }) {
  const [digits, setDigits] = useState(String(currentValue))
  const add = d => { const s = digits === '0' ? d : digits + d; if (parseInt(s) <= 180) setDigits(s) }
  const del = () => setDigits(p => p.length <= 1 ? '0' : p.slice(0, -1))
  const ok  = () => onConfirm(Math.max(0, Math.min(180, parseInt(digits) || 0)))

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: APP_BG, borderRadius: '20px 20px 0 0', padding: '18px 18px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#555' }}>Axe (0° – 180°)</span>
          <button onPointerDown={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', padding: '2px 8px' }}>✕</button>
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: '12px 20px', fontSize: 34, fontWeight: 800, color: APP_DARK, textAlign: 'center', marginBottom: 14, border: `2px solid ${APP_GOLD}`, fontVariantNumeric: 'tabular-nums' }}>
          {digits}°
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {['1','2','3','4','5','6','7','8','9','⌫','0','✓'].map(k => (
            <button key={k} onPointerDown={() => { if (k==='⌫') del(); else if (k==='✓') ok(); else add(k) }}
              style={{ padding: '15px 8px', borderRadius: 12, background: k==='✓' ? APP_GOLD : k==='⌫' ? '#e0dcf0' : '#fff', border: '1px solid #ddd9ec', color: k==='✓' ? '#fff' : APP_DARK, fontSize: k==='✓'||k==='⌫' ? 20 : 22, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent' }}
            >{k}</button>
          ))}
        </div>
      </div>
    </>
  )
}


function SaisieInteractiveMobile({ page, pageIndex, total }) {
  const initIdx = () => ({
    od: { sph: SPH_ZERO, cyl: CYL_ZERO, axe: AXE_ZERO },
    og: { sph: SPH_ZERO, cyl: CYL_ZERO, axe: AXE_ZERO },
    add: ADD_ZERO,
  })

  const [caseIdx, setCaseIdx] = useState(0)
  const [idx, setIdx] = useState(initIdx)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState(null)
  const [numpadEye, setNumpadEye] = useState(null) // null | 'od' | 'og'
  const [completed, setCompleted] = useState([false, false, false])

  const ex = SAISIE_EXERCISES[caseIdx]

  const resetAll = () => { setIdx(initIdx()); setShowResult(false); setResults(null) }
  const handleCaseChange = i => {
    const isUnlocked = i === 0 || completed[i - 1]
    if (!isUnlocked) return
    setCaseIdx(i); resetAll()
  }
  const goToNextCase = () => {
    const next = caseIdx + 1
    if (next < SAISIE_EXERCISES.length) { setCaseIdx(next); resetAll() }
  }

  const setEye = (eye, field, val) => {
    setIdx(prev => ({ ...prev, [eye]: { ...prev[eye], [field]: val } }))
    if (showResult) { setShowResult(false); setResults(null) }
  }
  const setAdd = val => {
    setIdx(prev => ({ ...prev, add: val }))
    if (showResult) { setShowResult(false); setResults(null) }
  }

  const near = (a, b) => Math.abs(a - b) < 0.001

  const verify = () => {
    const r = {
      od: {
        sph: near(SPH_VALS[idx.od.sph].val, ex.od.sphere),
        cyl: near(CYL_VALS[idx.od.cyl].val, ex.od.cylindre),
        axe: AXE_VALS[idx.od.axe].val === ex.od.axe,
      },
      og: {
        sph: near(SPH_VALS[idx.og.sph].val, ex.og.sphere),
        cyl: near(CYL_VALS[idx.og.cyl].val, ex.og.cylindre),
        axe: AXE_VALS[idx.og.axe].val === ex.og.axe,
      },
      add: near(ADD_VALS[idx.add].val, ex.add ?? 0),
    }
    setResults(r)
    setShowResult(true)
    const fields = [r.od.sph, r.od.cyl, r.od.axe, r.og.sph, r.og.cyl, r.og.axe, ...(ex.add != null ? [r.add] : [])]
    if (fields.every(Boolean)) {
      setCompleted(prev => prev.map((c, i) => i === caseIdx ? true : c))
    }
  }

  const hasAdd = ex.add != null
  const totalFields = hasAdd ? 7 : 6
  const correctCount = results
    ? [results.od.sph, results.od.cyl, results.od.axe,
       results.og.sph, results.og.cyl, results.og.axe,
       ...(hasAdd ? [results.add] : [])].filter(Boolean).length
    : 0
  const perfect = showResult && correctCount === totalFields

  // Labels de la bonne réponse (pour feedback)
  const corrLabel = {
    od: { sph: SPH_VALS[findSphIdx(ex.od.sphere)]?.label || '', cyl: CYL_VALS[findCylIdx(ex.od.cylindre)]?.label || '', axe: `${ex.od.axe}°` },
    og: { sph: SPH_VALS[findSphIdx(ex.og.sphere)]?.label || '', cyl: CYL_VALS[findCylIdx(ex.og.cylindre)]?.label || '', axe: `${ex.og.axe}°` },
    add: ADD_VALS[Math.round((ex.add ?? 0) / 0.25)]?.label || '',
  }

  return (
    <div style={{ minHeight: '100dvh', background: APP_BG, display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>

      {/* ── Header doré ── */}
      <div style={{ background: APP_GOLD, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={56} height={20} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', flex: 1, textAlign: 'center' }}>Ajouter l&apos;ordonnance</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 3, borderRadius: 2, width: i === pageIndex ? 14 : 3, background: i === pageIndex ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all .4s' }} />
          ))}
        </div>
      </div>

      {/* ── Corps scrollable ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>

        {/* Sélecteur de cas */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8 }}>Quel cas traitez-vous ?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {SAISIE_EXERCISES.map((e, i) => {
              const isUnlocked = i === 0 || completed[i - 1]
              const isDone     = completed[i]
              const isActive   = i === caseIdx
              return (
                <button key={e.id} onPointerDown={() => handleCaseChange(i)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10,
                  border: `2px solid ${isActive ? APP_GOLD : isDone ? '#22c55e' : isUnlocked ? '#ccc9de' : '#e5e2ef'}`,
                  background: isActive ? APP_GOLD : isDone ? '#f0fdf4' : '#fff',
                  color: isActive ? '#fff' : isDone ? '#16a34a' : isUnlocked ? '#555' : '#ccc',
                  fontSize: 12, fontWeight: 700, cursor: isUnlocked ? 'pointer' : 'default',
                  fontFamily: 'inherit', WebkitTapHighlightColor: 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  {isDone && !isActive ? '✓ ' : ''}{e.label}{!isUnlocked ? ' 🔒' : ''}
                </button>
              )
            })}
          </div>
        </div>

        {/* Label Corrections */}
        <div style={{ fontSize: 13, fontWeight: 800, color: APP_DARK, marginBottom: 12 }}>Corrections*</div>

        {/* Tableau OD / OG — même schéma que l'app LPT */}
        <div>

          {/* En-têtes colonnes */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div />
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#666', fontStyle: 'italic' }}>Œil droit</div>
            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#666', fontStyle: 'italic' }}>Œil gauche</div>
          </div>

          {/* Sphère */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Sphère</div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${APP_GOLD}88`, overflow: 'hidden' }}>
              <WheelPicker values={SPH_VALS} selectedIdx={idx.od.sph} onChange={v => setEye('od', 'sph', v)} showResult={showResult} isCorrect={results?.od?.sph} correctLabel={corrLabel.od.sph} />
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${APP_GOLD}88`, overflow: 'hidden' }}>
              <WheelPicker values={SPH_VALS} selectedIdx={idx.og.sph} onChange={v => setEye('og', 'sph', v)} showResult={showResult} isCorrect={results?.og?.sph} correctLabel={corrLabel.og.sph} />
            </div>
          </div>

          {/* Cylindre */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Cylindre</div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${APP_GOLD}88`, overflow: 'hidden' }}>
              <WheelPicker values={CYL_VALS} selectedIdx={idx.od.cyl} onChange={v => setEye('od', 'cyl', v)} showResult={showResult} isCorrect={results?.od?.cyl} correctLabel={corrLabel.od.cyl} />
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${APP_GOLD}88`, overflow: 'hidden' }}>
              <WheelPicker values={CYL_VALS} selectedIdx={idx.og.cyl} onChange={v => setEye('og', 'cyl', v)} showResult={showResult} isCorrect={results?.og?.cyl} correctLabel={corrLabel.og.cyl} />
            </div>
          </div>

          {/* Axe */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#555', paddingTop: 36 }}>Axe</div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${APP_GOLD}88`, overflow: 'hidden' }}>
              <WheelPicker values={AXE_VALS} selectedIdx={idx.od.axe} onChange={v => setEye('od', 'axe', v)} showResult={showResult} isCorrect={results?.od?.axe} correctLabel={corrLabel.od.axe} circular />
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${APP_GOLD}88`, overflow: 'hidden' }}>
              <WheelPicker values={AXE_VALS} selectedIdx={idx.og.axe} onChange={v => setEye('og', 'axe', v)} showResult={showResult} isCorrect={results?.og?.axe} correctLabel={corrLabel.og.axe} circular />
            </div>
          </div>

          {/* Add */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: hasAdd ? '#555' : '#aaa' }}>Add</div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${hasAdd ? APP_GOLD + '88' : '#ddd9ec'}`, overflow: 'hidden', opacity: hasAdd ? 1 : 0.4 }}>
              <WheelPicker values={ADD_VALS} selectedIdx={idx.add} onChange={hasAdd ? setAdd : () => {}} showResult={showResult && hasAdd} isCorrect={results?.add} correctLabel={corrLabel.add} />
            </div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${hasAdd ? APP_GOLD + '88' : '#ddd9ec'}`, overflow: 'hidden', opacity: hasAdd ? 1 : 0.4 }}>
              <WheelPicker values={ADD_VALS} selectedIdx={idx.add} onChange={hasAdd ? setAdd : () => {}} showResult={showResult && hasAdd} isCorrect={results?.add} correctLabel={corrLabel.add} />
            </div>
          </div>
        </div>

        {/* Bannière résultat */}
        {showResult && (
          <div style={{
            borderRadius: 14, padding: '14px 18px', marginBottom: 12,
            background: perfect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.07)',
            border: `1px solid ${perfect ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.3)'}`,
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span style={{ fontSize: 28 }}>{perfect ? '🎉' : '💡'}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: perfect ? '#16a34a' : '#dc2626' }}>
                {perfect ? 'Parfait !' : `${correctCount} / ${totalFields}`}
              </div>
              <div style={{ fontSize: 12, color: '#555' }}>
                {perfect ? 'Toutes les corrections sont correctes !' : 'Cases en rouge → bonne valeur affichée.'}
              </div>
            </div>
          </div>
        )}
        <div style={{ height: 12 }} />
      </div>

      {/* ── Bouton bas ── */}
      <div style={{ padding: '12px 14px 36px', background: APP_BG, flexShrink: 0 }}>
        {!showResult && (
          <button onPointerDown={verify} style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: APP_DARK, border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: 0.5, WebkitTapHighlightColor: 'transparent',
          }}>VÉRIFIER</button>
        )}
        {showResult && !perfect && (
          <button onPointerDown={resetAll} style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: '#6b5fa6', border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: 0.5, WebkitTapHighlightColor: 'transparent',
          }}>↩ RÉESSAYER</button>
        )}
        {showResult && perfect && caseIdx < SAISIE_EXERCISES.length - 1 && (
          <button onPointerDown={goToNextCase} style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: APP_GOLD, border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: 0.5, WebkitTapHighlightColor: 'transparent',
          }}>CAS {caseIdx + 2} →</button>
        )}
        {showResult && perfect && caseIdx === SAISIE_EXERCISES.length - 1 && (
          <div style={{
            width: '100%', padding: '16px', borderRadius: 12, boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #16a34a, #22c55e)', textAlign: 'center',
            fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: 0.5,
          }}>🎉 EXERCICE TERMINÉ !</div>
        )}
      </div>

      {/* Pavé numérique axe */}
      {numpadEye && (
        <AxeNumpad
          currentValue={AXE_VALS[idx[numpadEye].axe].val}
          onConfirm={v => { setEye(numpadEye, 'axe', findAxeIdx(v)); setNumpadEye(null) }}
          onClose={() => setNumpadEye(null)}
        />
      )}
    </div>
  )
}

function EntreprisePageMobile({ page, pageIndex, total }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => { setEntered(false); const t = setTimeout(() => setEntered(true), 80); return () => clearTimeout(t) }, [page.id])
  const accent = page.color || '#00abe9'

  const Header = () => (
    <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={56} height={22} style={{ objectFit: 'contain', opacity: 0.7 }} />
      <div style={{ display: 'flex', gap: 5 }}>
        {Array(total).fill(0).map((_, i) => (
          <div key={i} style={{ height: 4, borderRadius: 2, width: i === pageIndex ? 16 : 4, background: i === pageIndex ? accent : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
        ))}
      </div>
    </div>
  )

  const base = {
    minHeight: '100dvh',
    background: `linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, ${accent}15 100%)`,
    display: 'flex', flexDirection: 'column',
    opacity: entered ? 1 : 0, transition: 'opacity .4s ease',
  }

  // Timeline
  if (page.type === 'timeline') return (
    <div style={base}>
      <Header />
      <div style={{ padding: '16px 20px 32px', flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{page.sousTitre}</div>
        <div style={{ position: 'relative', paddingLeft: 20 }}>
          <div style={{ position: 'absolute', left: 7, top: 0, bottom: 0, width: 2, background: 'rgba(0,171,233,0.3)' }} />
          {page.timeline.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 18, position: 'relative' }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: i === page.timeline.length - 1 ? '#00abe9' : 'rgba(0,171,233,0.4)', border: '2px solid #00abe9', flexShrink: 0, marginTop: 3 }} />
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', marginBottom: 2 }}>{item.year}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Piliers (3 cards)
  if (page.type === 'piliers') return (
    <div style={base}>
      <Header />
      <div style={{ padding: '16px 20px 32px', flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{page.sousTitre}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {page.points.map((p, i) => (
            <div key={i} style={{ background: `${accent}12`, border: `1px solid ${accent}35`, borderRadius: 16, padding: '20px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontSize: 32 }}>{p.emoji}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{p.titre}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{p.texte}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Steps
  if (page.type === 'steps') return (
    <div style={base}>
      <Header />
      <div style={{ padding: '16px 20px 32px', flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{page.sousTitre}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {page.steps.map((s, i) => (
            <div key={i} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{s.num}</div>
              <span style={{ fontSize: 18 }}>{s.emoji}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.titre}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{s.texte}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Cases (❌/✅)
  if (page.type === 'cases') return (
    <div style={base}>
      <Header />
      <div style={{ padding: '16px 20px 32px', flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{page.sousTitre}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {page.cases.map((c, i) => (
            <div key={i} style={{ background: 'rgba(219,39,119,0.06)', border: '1px solid rgba(219,39,119,0.2)', borderRadius: 16, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{c.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{c.prenom}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{c.age} · {c.contexte}</div>
                </div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 8, fontSize: 12, color: '#f87171' }}>❌ {c.sans}</div>
              <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#4ade80' }}>✅ {c.avec}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Visages
  if (page.type === 'visages') return (
    <div style={base}>
      <Header />
      <div style={{ padding: '16px 20px 32px', flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{page.sousTitre}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {page.profils.map((p, i) => (
            <div key={i} style={{ background: 'rgba(8,145,178,0.07)', border: '1px solid rgba(8,145,178,0.2)', borderRadius: 12, padding: '14px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(8,145,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{p.emoji}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{p.metier}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>{p.message}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Croissance
  if (page.type === 'croissance') return (
    <div style={base}>
      <Header />
      <div style={{ padding: '16px 20px 32px', flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{page.sousTitre}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          {page.stats.map((s, i) => (
            <div key={i} style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#4ade80', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {page.points.map((p, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{p.emoji}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{p.titre}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{p.texte}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // Mission
  if (page.type === 'mission') return (
    <div style={base}>
      <Header />
      <div style={{ padding: '16px 20px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>{page.sousTitre}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {page.temoignages.map((t, i) => (
            <div key={i} style={{ background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.25)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontStyle: 'italic', marginBottom: 4 }}>{t.quote}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.context}</div>
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)', borderRadius: 12, padding: '14px 16px', fontSize: 13, fontWeight: 700, color: '#00abe9', textAlign: 'center' }}>
          Tu participes à rendre la vue accessible à tous. 👁️
        </div>
      </div>
    </div>
  )

  // Fallback pour impact, probleme, machines (generic points works great)
  return (
    <div style={base}>
      <Header />
      <div style={{ padding: '16px 20px 12px' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{page.titre}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{page.sousTitre}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 20px 32px' }}>
        {(page.points || []).map((p, i) => (
          <div key={i} style={{ background: `${accent}10`, border: `1px solid ${accent}25`, borderRadius: 14, padding: '16px', display: 'flex', alignItems: 'flex-start', gap: 12,
            opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(12px)',
            transition: `all .4s ease ${i * 0.08}s`,
          }}>
            <span style={{ fontSize: 26, flexShrink: 0 }}>{p.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{p.titre}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{p.texte}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Freins à l'achat — saisie libre participant ───────────────────
function FreinsInputMobile({ page, pName }) {
  const [text, setText]               = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [submittedText, setSubmittedText] = useState('')
  const [sending, setSending]         = useState(false)

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const x = Math.floor(Math.random() * 65) + 3   // 3 → 68 % (largeur écran)
      const y = Math.floor(Math.random() * 38) + 42  // 42 → 80 % (sous la question)
      const state = await getSharedState()
      const current = state?.freins_responses || {}
      await setSharedState({ freins_responses: { ...current, [pName]: { text: text.trim(), x, y } } })
      setSubmittedText(text.trim())
      setSubmitted(true)
    } catch { /* ignore */ }
    setSending(false)
  }

  const handleModify = () => {
    setText(submittedText)
    setSubmitted(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '52px 24px 40px',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38}
        style={{ objectFit: 'contain', marginBottom: 36 }} />

      <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
        Question ouverte
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.45, marginBottom: 32 }}>
        {page.titre}
      </h2>

      {submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: 16, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>✓ Réponse envoyée</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{submittedText}</div>
          </div>
          <button onClick={handleModify} style={{
            background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.3)',
            color: '#00abe9', borderRadius: 14, padding: '14px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>✏️ Modifier ma réponse</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Tapez votre réponse ici…"
            rows={5}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '16px', color: '#fff', fontSize: 16,
              fontFamily: 'inherit', resize: 'none', outline: 'none', lineHeight: 1.5,
              WebkitAppearance: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              background: text.trim() ? '#00abe9' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 14, padding: '16px',
              fontSize: 16, fontWeight: 700, color: '#fff',
              cursor: text.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'background .2s',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Envoi en cours…' : 'Envoyer ma réponse →'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Prix moyen — saisie numérique participant ─────────────────────
function PrixInputMobile({ page, pName }) {
  const [value, setValue]              = useState('')
  const [submitted, setSubmitted]      = useState(false)
  const [submittedValue, setSubmittedValue] = useState('')
  const [sending, setSending]          = useState(false)

  const handleSend = async () => {
    if (!value.trim() || sending) return
    setSending(true)
    try {
      const x = Math.floor(Math.random() * 65) + 3
      const y = Math.floor(Math.random() * 38) + 42
      const state = await getSharedState()
      const current = state?.prix_responses || {}
      await setSharedState({ prix_responses: { ...current, [pName]: { text: value.trim(), x, y } } })
      setSubmittedValue(value.trim())
      setSubmitted(true)
    } catch { /* ignore */ }
    setSending(false)
  }

  const handleModify = () => {
    setValue(submittedValue)
    setSubmitted(false)
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '52px 24px 40px',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38}
        style={{ objectFit: 'contain', marginBottom: 36 }} />

      <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
        Question ouverte
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.45, marginBottom: 32 }}>
        {page.titre}
      </h2>

      {submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: 16, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>✓ Réponse envoyée</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {submittedValue} <span style={{ color: '#f59e0b' }}>€</span>
            </div>
          </div>
          <button onClick={handleModify} style={{
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b', borderRadius: 14, padding: '14px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>✏️ Modifier ma réponse</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Champ numérique avec € */}
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 16, padding: '0 20px', overflow: 'hidden',
          }}>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              value={value}
              onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#fff', fontSize: 36, fontWeight: 900, padding: '20px 0',
                fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums',
                WebkitAppearance: 'none', MozAppearance: 'textfield',
              }}
            />
            <span style={{ fontSize: 36, fontWeight: 900, color: '#f59e0b', paddingLeft: 8 }}>€</span>
          </div>
          <button
            onClick={handleSend}
            disabled={!value.trim() || sending}
            style={{
              background: value.trim() ? '#f59e0b' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 14, padding: '16px',
              fontSize: 16, fontWeight: 700, color: '#fff',
              cursor: value.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'background .2s',
              opacity: sending ? 0.7 : 1,
            }}
          >
            {sending ? 'Envoi en cours…' : 'Envoyer ma réponse →'}
          </button>
        </div>
      )}
    </div>
  )
}

function ModuleScreen({ page, pageIndex, total, moduleLabel, pName }) {
  const [key, setKey] = useState(0)
  useEffect(() => { setKey(k => k + 1) }, [page.id])

  if (page.type === 'troubles-intro')    return <TroublesIntroMobile      page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'troubles-list')    return <TroublesListMobile       page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'correction-scale') return <CorrectionScaleMobile    page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'ordonnance')        return <OrdonnanceMobile         page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'pause')             return <PauseMobile              page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'saisie-interactive') return <SaisieInteractiveMobile page={page} pageIndex={pageIndex} total={total} />

  // Freins à l'achat — saisie libre
  if (page.type === 'freins') return <FreinsInputMobile page={page} pName={pName || 'Anonyme'} />

  // Prix moyen — saisie numérique
  if (page.type === 'prix') return <PrixInputMobile page={page} pName={pName || 'Anonyme'} />

  // Chiffres clés LPT
  if (page.type === 'chiffres') return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '32px 20px 40px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, width: i === pageIndex ? 16 : 4, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Chiffres clés</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 24, lineHeight: 1.3 }}>{page.titre}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {page.stats.map((stat, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: `${stat.color}0d`, border: `1px solid ${stat.color}30`,
            borderLeft: `4px solid ${stat.color}`,
            borderRadius: 14, padding: '14px 16px',
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{stat.emoji}</span>
            <div style={{ fontSize: 20, fontWeight: 900, color: stat.color, minWidth: 90 }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.4 }}>{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )

  // Vidéo LPT — écran passif
  if (page.type === 'video-lpt') return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={110} height={42}
        style={{ objectFit: 'contain', marginBottom: 44 }} />
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(0,171,233,0.12)', border: '2px solid rgba(0,171,233,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 34, marginBottom: 24,
        boxShadow: '0 0 32px rgba(0,171,233,0.15)',
      }}>🎬</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
        Vidéo en cours
      </div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280, marginBottom: 36 }}>
        Regardez l&apos;écran de diffusion
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#00abe9',
            animation: `waitDot 1.4s ease-in-out ${i * 0.25}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )

  // Naissance LPT — écran passif
  if (page.type === 'naissance') return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={110} height={42}
        style={{ objectFit: 'contain', marginBottom: 44 }} />
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(0,171,233,0.12)', border: '2px solid rgba(0,171,233,0.25)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 34, marginBottom: 24,
        boxShadow: '0 0 32px rgba(0,171,233,0.15)',
      }}>👂</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
        Le formateur parle
      </div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280, marginBottom: 36 }}>
        Écoutez et regardez l&apos;écran de diffusion
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: '#00abe9',
            animation: `waitDot 1.4s ease-in-out ${i * 0.25}s infinite`,
          }} />
        ))}
      </div>
    </div>
  )

  // Entreprise module types
  if (['impact','probleme','timeline','piliers','steps','machines','cases','visages','croissance','mission'].includes(page.type))
    return <EntreprisePageMobile page={page} pageIndex={pageIndex} total={total} />

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
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={28}
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

function RhAccessDenied({ message }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Accès refusé</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', maxWidth: 360, lineHeight: 1.6 }}>{message}</p>
      <a href="/" style={{
        marginTop: 28, background: '#00abe9', color: '#fff', padding: '12px 24px',
        borderRadius: 12, fontSize: 14, fontWeight: 600, textDecoration: 'none',
      }}>Retour à l&apos;accueil</a>
    </div>
  )
}

function RhParticipantGate({ pNameInput, children }) {
  const [status, setStatus] = useState('loading')
  const [canonicalName, setCanonicalName] = useState('')
  const [denyMessage, setDenyMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const raw = (pNameInput || '').trim()
      if (!raw) {
        if (!cancelled) {
          setDenyMessage('Connectez-vous depuis la page d\'accueil avec votre prénom et nom (liste RH).')
          setStatus('denied')
        }
        return
      }
      const resolved = await resolveParticipantName(raw)
      if (!resolved.ok) {
        if (!cancelled) {
          setDenyMessage(
            resolved.reason === 'no_list'
              ? 'Liste RH indisponible. Le formateur doit importer « Entrées de la semaine ».'
              : 'Nom non reconnu. Reprenez le prénom et le nom comme sur la liste RH.'
          )
          setStatus('denied')
        }
        return
      }
      const canonical = resolved.canonicalName
      if (typeof window !== 'undefined') {
        localStorage.setItem('participant_name', canonical)
      }
      try {
        await ensureSession()
        await sbUpsert('participants', {
          session_code: SESSION_CODE,
          name: canonical,
          joined_at: new Date().toISOString(),
        }, 'session_code,name')
      } catch (e) {
        console.warn('participant upsert (module QR)', e)
      }
      if (!cancelled) {
        setCanonicalName(canonical)
        setStatus('ok')
      }
    })()
    return () => { cancelled = true }
  }, [pNameInput])

  if (status === 'loading') return <WaitingScreen />
  if (status === 'denied') return <RhAccessDenied message={denyMessage} />
  return children(canonicalName)
}

function ParticipantModuleContent({ forcedModule, forcedPage, pName }) {
  const sync = useModuleSync(forcedModule != null ? 99999 : 1200)
  const activeModule = forcedModule ?? sync.activeModule
  const modulePage   = forcedPage  ?? sync.modulePage

  const moduleData = MODULE_DATA[activeModule] || null
  const pages = moduleData?.pages || []
  const quiz = moduleData?.quiz || []

  const isLobby   = !!moduleData && modulePage === -1
  const isResults = !!moduleData && modulePage === 200
  const isQuiz    = !!moduleData && modulePage >= 100 && modulePage < 200
  const qIdx = modulePage - 100
  const page = (!isQuiz && !isResults && !isLobby && moduleData) ? (pages[modulePage] ?? null) : null

  return (
    <>
      <style>{STYLES}</style>
      {isLobby
        ? <ParticipantModuleLobby moduleLabel={moduleData?.label || ''} moduleSub={moduleData?.sub || ''} />
        : isResults
          ? <PersonalResultsScreen key="results" pName={pName} quiz={quiz} moduleId={activeModule} />
          : isQuiz
            ? <QuizAnswerScreen key={modulePage} pName={pName} qIdx={qIdx} quiz={quiz} moduleId={activeModule} />
            : page
              ? <ModuleScreen page={page} pageIndex={modulePage} total={pages.length} moduleLabel={moduleData?.label} pName={pName} />
              : <WaitingScreen />
      }
    </>
  )
}

export default function ParticipantModuleView({ forcedModule, forcedPage, pName: pNameProp }) {
  const pNameRaw = pNameProp || (typeof window !== 'undefined' ? localStorage.getItem('participant_name') || '' : '')
  return (
    <RhParticipantGate pNameInput={pNameRaw}>
      {canonicalName => (
        <ParticipantModuleContent
          forcedModule={forcedModule}
          forcedPage={forcedPage}
          pName={canonicalName}
        />
      )}
    </RhParticipantGate>
  )
}
