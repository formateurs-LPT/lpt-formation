'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { TYPES_VERRES_PAGES, TYPES_VERRES_QUIZ } from '@/lib/modulesData'
import { sbInsert, SESSION_CODE } from '@/lib/supabase'
import { generatePin } from '@/lib/pin'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

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

// Écran réponse pour UNE question — s'affiche sur le téléphone
// La question est sur la TV, le participant répond ici
const SB_URL = 'https://dofyyckseiilxhlijacy.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvZnl5Y2tzZWlpbHhobGlqYWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjU2MjcsImV4cCI6MjA5Mzc0MTYyN30.ENd0dOZvA0ZqQky2LN5M8pK0Amp2SPLuIEHCHWyuI4A'

async function debugInsert(table, data) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SB_KEY,
      Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(data),
  })
  let body = ''
  try { body = await r.text() } catch (_) {}
  return { ok: r.ok, status: r.status, body }
}

function QuizAnswerScreen({ pName, qIdx }) {
  const q = TYPES_VERRES_QUIZ[qIdx]
  const [answered, setAnswered] = useState(false)
  const [chosenIdx, setChosenIdx] = useState(null)
  const [saving, setSaving] = useState(false)
  const [debugInfo, setDebugInfo] = useState(null)

  const handleAnswer = async (optIdx) => {
    if (answered || saving) return
    setSaving(true)
    setAnswered(true)
    setChosenIdx(optIdx)
    const isCorrect = optIdx === q.correct

    const payload = {
      session_code: SESSION_CODE,
      collaborateur: pName || 'Anonyme',
      question_idx: qIdx,
      answer_idx: optIdx,
      is_correct: isCorrect,
    }

    const res = await debugInsert('quiz_answers', payload)
    setDebugInfo({ ...res, payload: JSON.stringify(payload) })

    if (res.ok && qIdx === TYPES_VERRES_QUIZ.length - 1) {
      await debugInsert('module_results', {
        collaborateur: pName || 'Anonyme',
        pin: generatePin(pName || ''),
        week_date: new Date().toISOString().slice(0, 10),
        module_id: 'types-verres',
        score: isCorrect ? 1 : 0,
        score_total: 1,
        xp: isCorrect ? 100 : 0,
        completed_at: new Date().toISOString(),
      })
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
        <div style={{ fontSize: 64, marginBottom: 20 }}>{debugInfo?.ok ? '✅' : '❌'}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          {debugInfo?.ok ? 'Réponse enregistrée !' : 'Erreur sauvegarde'}
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
          {debugInfo?.ok ? 'En attente de la prochaine question…' : 'Voir détail ci-dessous'}
        </div>
        {debugInfo && (
          <div style={{
            background: debugInfo.ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${debugInfo.ok ? '#22c55e' : '#ef4444'}`,
            borderRadius: 12, padding: '14px 16px',
            width: '100%', maxWidth: 400, textAlign: 'left',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: debugInfo.ok ? '#22c55e' : '#ef4444', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Debug — HTTP {debugInfo.status}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.6 }}>
              <div><b style={{color:'rgba(255,255,255,0.8)'}}>Payload:</b> {debugInfo.payload}</div>
              {debugInfo.body && <div style={{marginTop:6}}><b style={{color:'rgba(255,255,255,0.8)'}}>Réponse:</b> {debugInfo.body}</div>}
            </div>
          </div>
        )}
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
      }}>Question {qIdx + 1} / {TYPES_VERRES_QUIZ.length}</div>

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

  const isQuiz = activeModule === 'types-verres' && modulePage >= 100
  const qIdx = modulePage - 100
  const page = (!isQuiz && activeModule === 'types-verres')
    ? (TYPES_VERRES_PAGES[modulePage] || TYPES_VERRES_PAGES[0])
    : null

  return (
    <>
      <style>{STYLES}</style>
      {isQuiz
        ? <QuizAnswerScreen key={modulePage} pName={pName} qIdx={qIdx} />
        : page
          ? <ModuleScreen page={page} pageIndex={modulePage} total={TYPES_VERRES_PAGES.length} />
          : <WaitingScreen />
      }
    </>
  )
}
