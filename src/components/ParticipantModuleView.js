'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { TYPES_VERRES_PAGES, TYPES_VERRES_QUIZ } from '@/lib/modulesData'
import { sbInsert } from '@/lib/supabase'
import { generatePin } from '@/lib/pin'

const STYLES = `
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

function QuizScreen({ pName }) {
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [saving, setSaving] = useState(false)
  const total = TYPES_VERRES_QUIZ.length

  const handleAnswer = (qIdx, optIdx) => {
    if (answers[qIdx] !== undefined || submitted) return
    setAnswers(prev => ({ ...prev, [qIdx]: optIdx }))
  }

  const allAnswered = Object.keys(answers).length === total

  const handleSubmit = async () => {
    if (saving) return
    setSaving(true)
    const s = TYPES_VERRES_QUIZ.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0)
    const xp = Math.round((s / total) * 100)
    setScore(s)
    try {
      await sbInsert('module_results', {
        collaborateur: pName || 'Anonyme',
        pin: generatePin(pName || ''),
        week_date: new Date().toISOString().slice(0, 10),
        module_id: 'types-verres',
        score: s,
        score_total: total,
        xp,
        completed_at: new Date().toISOString(),
      })
    } catch (e) { console.error('Quiz save error:', e) }
    setSubmitted(true)
    setSaving(false)
  }

  const xp = Math.round((score / total) * 100)

  if (submitted) {
    const emoji = score === total ? '🎉' : score >= total / 2 ? '👍' : '📚'
    const msg = score === total ? 'Score parfait !' : score >= total / 2 ? 'Bien joué !' : 'Continue comme ça !'
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{emoji}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
          {score}/{total} bonne{score > 1 ? 's' : ''} réponse{score > 1 ? 's' : ''}
        </div>
        <div style={{
          background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 20, padding: '12px 32px', marginBottom: 28,
          fontSize: 28, fontWeight: 800, color: '#a78bfa',
        }}>+{xp} XP</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7 }}>
          {msg}<br />Résultats envoyés au formateur ✓
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '36px 20px 48px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 20, padding: '4px 18px',
          fontSize: 11, fontWeight: 700, color: '#a78bfa',
          textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
        }}>Quiz · Types de verres</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>
          {Object.keys(answers).length}/{total} répondu{Object.keys(answers).length > 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, flex: 1 }}>
        {TYPES_VERRES_QUIZ.map((q, qIdx) => {
          const answered = answers[qIdx] !== undefined
          const chosen = answers[qIdx]
          return (
            <div key={qIdx}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 16, lineHeight: 1.4 }}>
                {qIdx + 1}. {q.question}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {q.options.map((opt, optIdx) => {
                  const isCorrect = optIdx === q.correct
                  const isChosen = chosen === optIdx
                  let bg = 'rgba(255,255,255,0.06)'
                  let border = '1px solid rgba(255,255,255,0.12)'
                  let color = '#fff'
                  let circleColor = 'rgba(255,255,255,0.15)'
                  if (answered) {
                    if (isCorrect) { bg = 'rgba(34,197,94,0.15)'; border = '1px solid rgba(34,197,94,0.5)'; color = '#4ade80'; circleColor = 'rgba(34,197,94,0.3)' }
                    else if (isChosen) { bg = 'rgba(239,68,68,0.15)'; border = '1px solid rgba(239,68,68,0.4)'; color = '#f87171'; circleColor = 'rgba(239,68,68,0.3)' }
                    else { bg = 'rgba(255,255,255,0.02)'; border = '1px solid rgba(255,255,255,0.05)'; color = 'rgba(255,255,255,0.25)'; circleColor = 'rgba(255,255,255,0.05)' }
                  }
                  return (
                    <button key={optIdx} onClick={() => handleAnswer(qIdx, optIdx)} disabled={answered} style={{
                      background: bg, border, borderRadius: 14,
                      padding: '16px 18px', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: 14,
                      cursor: answered ? 'default' : 'pointer',
                      transition: 'all .15s', fontFamily: 'inherit', width: '100%',
                    }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                        background: circleColor,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 800, color,
                      }}>{'ABCD'[optIdx]}</div>
                      <span style={{ fontSize: 15, fontWeight: 600, color, flex: 1 }}>{opt}</span>
                      {answered && isCorrect && <span style={{ fontSize: 20 }}>✓</span>}
                      {answered && isChosen && !isCorrect && <span style={{ fontSize: 20 }}>✗</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {allAnswered && (
        <button onClick={handleSubmit} disabled={saving} style={{
          marginTop: 36,
          background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
          border: 'none', color: '#fff',
          padding: '18px 32px', borderRadius: 16, fontSize: 17, fontWeight: 700,
          cursor: 'pointer', width: '100%',
          boxShadow: '0 8px 32px rgba(124,58,237,0.45)',
          fontFamily: 'inherit',
          animation: 'fadeSlideUp .4s ease forwards',
        }}>
          {saving ? 'Envoi en cours…' : 'Valider mes réponses →'}
        </button>
      )}
    </div>
  )
}

function ModuleScreen({ page, pageIndex, total }) {
  const [key, setKey] = useState(0)
  useEffect(() => { setKey(k => k + 1) }, [page.id])

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
        }}>Types de verres</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {page.titre}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          {page.sousTitre}
        </div>
      </div>

      {/* Verre qui respire — centré */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Halo */}
        <div style={{
          position: 'absolute',
          width: 320, height: 320, borderRadius: '50%',
          background: `radial-gradient(circle, ${page.color}30 0%, transparent 70%)`,
          animation: 'haloBreath 3.5s ease-in-out infinite',
        }} />
        {/* Image verre */}
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

  const isQuiz = activeModule === 'types-verres' && modulePage === 99
  const page = (!isQuiz && activeModule === 'types-verres')
    ? (TYPES_VERRES_PAGES[modulePage] || TYPES_VERRES_PAGES[0])
    : null

  return (
    <>
      <style>{STYLES}</style>
      {isQuiz
        ? <QuizScreen pName={pName} />
        : page
          ? <ModuleScreen page={page} pageIndex={modulePage} total={TYPES_VERRES_PAGES.length} />
          : <WaitingScreen />
      }
    </>
  )
}
