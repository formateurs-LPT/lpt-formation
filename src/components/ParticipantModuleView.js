'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA, ORD_COLS, ORD_EXAMPLE, SAISIE_EXERCISES } from '@/lib/modulesData'
import { PLANNING_JOURS } from '@/lib/planningData'
import { sbUpsert, sbSelect, getParticipantSessionCode, ensureSession, getSharedState, setSharedState, insertOpenAnswer } from '@/lib/supabase'
import { useParticipantPresence } from '@/lib/useParticipantPresence'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { generatePin } from '@/lib/pin'
import { resolveParticipantName } from '@/lib/participantNames'
import { mergeRoomSharedField } from '@/lib/roomSharedState'

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

function SessionEndedScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Session terminée</h3>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>Merci pour ta participation !<br />Tu peux fermer cet onglet.</p>
    </div>
  )
}

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

// Classement en temps réel affiché au participant pendant la correction
function ParticipantQuizRanking({ pName, moduleId, qIdx }) {
  const [ranking, setRanking] = useState([])
  const [myScore, setMyScore] = useState(null)
  const [myRank, setMyRank] = useState(null)

  const refresh = async () => {
    const rows = await sbSelect(
      'quiz_answers',
      `session_code=eq.${getParticipantSessionCode()}&module_id=eq.${moduleId}`
    )
    if (!rows) return
    // Score = nombre de bonnes réponses jusqu'à la question actuelle incluse
    const scores = {}
    rows.filter(r => r.question_idx <= qIdx).forEach(r => {
      if (!scores[r.collaborateur]) scores[r.collaborateur] = 0
      if (r.is_correct) scores[r.collaborateur]++
    })
    const sorted = Object.entries(scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    setRanking(sorted)
    const idx = sorted.findIndex(p => p.name === pName)
    if (idx !== -1) {
      setMyScore(sorted[idx].score)
      setMyRank(idx + 1)
    }
  }

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 2500)
    return () => clearInterval(t)
  }, [pName, moduleId, qIdx])

  const total = qIdx + 1
  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020d1f 0%, #071832 50%, #0a2040 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 24px', color: '#fff',
    }}>
      {/* Mon score */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>
          {myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🏅'}
        </div>
        <div style={{
          background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.35)',
          borderRadius: 20, padding: '6px 22px', display: 'inline-block',
          fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 2, textTransform: 'uppercase',
          marginBottom: 14,
        }}>Ton classement</div>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
          {myRank != null ? `${myRank}${myRank === 1 ? 'er' : 'ème'} sur ${ranking.length}` : '…'}
        </div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)' }}>
          {myScore != null ? `${myScore} bonne${myScore > 1 ? 's' : ''} réponse${myScore > 1 ? 's' : ''} sur ${total} question${total > 1 ? 's' : ''}` : ''}
        </div>
      </div>

      {/* Classement complet */}
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ranking.map((p, i) => {
          const isMe = p.name === pName
          const pct = total > 0 ? (p.score / total) * 100 : 0
          return (
            <div key={p.name} style={{
              background: isMe ? 'rgba(0,171,233,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${isMe ? 'rgba(0,171,233,0.5)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '12px 16px',
              boxShadow: isMe ? '0 0 20px rgba(0,171,233,0.15)' : 'none',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>
                    {i < 3 ? MEDALS[i] : `${i + 1}.`}
                  </span>
                  <span style={{ fontSize: 15, fontWeight: isMe ? 800 : 600, color: isMe ? '#00abe9' : '#fff' }}>
                    {isMe ? 'Toi' : p.name}
                  </span>
                </div>
                <span style={{ fontSize: 18, fontWeight: 800, color: isMe ? '#00abe9' : '#fff' }}>
                  {p.score}<span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 400, marginLeft: 2 }}>pts</span>
                </span>
              </div>
              <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${pct}%`,
                  background: isMe ? '#00abe9' : 'rgba(255,255,255,0.25)',
                  transition: 'width .5s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Réponse résultat partagé ──────────────────────────────────────
function QuizResultScreen({ isCorrect }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: isCorrect
        ? 'linear-gradient(160deg, #03112a 0%, #052a14 100%)'
        : 'linear-gradient(160deg, #03112a 0%, #2a0505 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>{isCorrect ? '✅' : '❌'}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
        {isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
      </div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>En attente de la prochaine question…</div>
    </div>
  )
}

// ── Quiz texte libre ──────────────────────────────────────────────
function QuizTextOpen({ pName, q, qIdx, moduleId }) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validated, setValidated] = useState(null) // null | true | false

  useEffect(() => {
    if (!submitted) return
    const poll = async () => {
      const rows = await sbSelect(
        'quiz_answers',
        `session_code=eq.${getParticipantSessionCode()}&module_id=eq.${encodeURIComponent(moduleId)}&question_idx=eq.${qIdx}&collaborateur=eq.${encodeURIComponent(pName.trim())}`
      )
      if (rows && rows.length > 0) setValidated(rows[0].is_correct)
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [submitted, qIdx, moduleId, pName])

  const handleSubmit = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    await insertOpenAnswer({
      sessionCode: getParticipantSessionCode(),
      pageId: `quiz-j1:${qIdx}`,
      participantName: pName.trim(),
      answer: text.trim(),
    })
    setSaving(false)
    setSubmitted(true)
  }

  if (validated !== null) return <QuizResultScreen isCorrect={validated} />

  if (submitted) {
    return (
      <div style={{
        minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 10 }}>Réponse envoyée !</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>En attente de la validation du formateur…</div>
        <div style={{ marginTop: 24, width: 32, height: 32, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #a78bfa', borderRadius: '50%', animation: 'quizSpin 1s linear infinite' }} />
        <style>{`@keyframes quizSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24,
      }}>Question {qIdx + 1}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'center' }}>
        Regardez la question sur l&apos;écran<br />et tapez votre réponse
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Votre réponse…"
        rows={4}
        style={{
          width: '100%', maxWidth: 400, padding: '16px', borderRadius: 16,
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', fontSize: 16, fontFamily: 'inherit', resize: 'none',
          outline: 'none', marginBottom: 20,
        }}
      />
      <button onClick={handleSubmit} disabled={!text.trim() || saving} style={{
        background: text.trim() ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.08)',
        border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default',
        fontFamily: 'inherit', width: '100%', maxWidth: 400,
      }}>
        {saving ? 'Envoi…' : '✓ Envoyer'}
      </button>
    </div>
  )
}

// ── Quiz multi-sélection ──────────────────────────────────────────
function QuizMultiSelect({ pName, q, qIdx, moduleId }) {
  const [selected, setSelected] = useState([])
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [saving, setSaving] = useState(false)

  const toggle = (i) => {
    if (answered) return
    setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])
  }

  const handleSubmit = async () => {
    if (selected.length === 0 || saving || answered) return
    setSaving(true)
    const correctArr = [...q.correct].sort()
    const selectedSorted = [...selected].sort()
    const ok = JSON.stringify(correctArr) === JSON.stringify(selectedSorted)
    const answerIdx = selectedSorted[0] ?? 0
    await saveModuleQuizAnswer({
      sessionCode: getParticipantSessionCode(),
      moduleId, questionIdx: qIdx,
      collaborateur: pName.trim(),
      answerIdx, isCorrect: ok,
    })
    setIsCorrect(ok)
    setAnswered(true)
    setSaving(false)
  }

  if (answered && isCorrect !== null) return <QuizResultScreen isCorrect={isCorrect} />

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
      }}>Question {qIdx + 1}</div>
      {q.instruction && (
        <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>{q.instruction}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400, marginBottom: 24 }}>
        {q.options.map((opt, i) => {
          const sel = selected.includes(i)
          return (
            <button key={i} onClick={() => toggle(i)} style={{
              background: sel ? `${OPTION_COLORS[i]}cc` : 'rgba(255,255,255,0.06)',
              border: `2px solid ${sel ? OPTION_COLORS[i] : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 16, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 14,
              cursor: 'pointer', fontFamily: 'inherit', width: '100%',
              transition: 'all .15s',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                background: sel ? 'rgba(0,0,0,0.25)' : OPTION_COLORS[i],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#fff',
              }}>{sel ? '✓' : 'ABCD'[i]}</div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', textAlign: 'left' }}>{opt}</span>
            </button>
          )
        })}
      </div>
      <button onClick={handleSubmit} disabled={selected.length === 0 || saving} style={{
        background: selected.length > 0 ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.08)',
        border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'default',
        fontFamily: 'inherit', width: '100%', maxWidth: 400,
      }}>
        {saving ? 'Envoi…' : '✓ Valider ma sélection'}
      </button>
    </div>
  )
}

// ── Quiz remplir ordonnance ──────────────────────────────────────
function genSphOpts() {
  const opts = []
  for (let v = -800; v <= 725; v += 25) {
    if (v === 0) { opts.push('Plan'); continue }
    opts.push(`${v > 0 ? '+' : ''}${(v / 100).toFixed(2).replace('.', ',')}`)
  }
  return opts
}
function genCylOpts() {
  const opts = []
  for (let v = -400; v <= 400; v += 25) {
    if (v === 0) { opts.push('Plan'); continue }
    opts.push(`${v > 0 ? '+' : ''}${(v / 100).toFixed(2).replace('.', ',')}`)
  }
  return opts
}
function genAxeOpts() {
  const opts = []
  for (let v = 5; v <= 180; v += 5) opts.push(`${v}`)
  return opts
}
function genAddOpts() {
  const opts = []
  for (let v = 50; v <= 350; v += 25) opts.push(`+${(v / 100).toFixed(2).replace('.', ',')}`)
  return opts
}
const SPH_OPTS = genSphOpts()
const CYL_OPTS = genCylOpts()
const AXE_OPTS = genAxeOpts()
const ADD_OPTS = genAddOpts()

function OrdoSelect({ value, onChange, options, placeholder }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={{
      flex: 1, padding: '10px 8px', borderRadius: 10,
      background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.2)',
      color: value ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 15, fontWeight: 600,
      fontFamily: 'inherit', outline: 'none', appearance: 'none', textAlign: 'center',
    }}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o} style={{ background: '#0d1f3c', color: '#fff' }}>{o}</option>)}
    </select>
  )
}

function QuizOrdonnanceFill({ pName, q, qIdx, moduleId }) {
  const hasCyl = !!(q.ordonnance.od.cyl || q.ordonnance.og.cyl)
  const hasAdd = !!(q.ordonnance.od.add || q.ordonnance.og.add)

  const [vals, setVals] = useState({
    od_sph: '', od_cyl: '', od_axe: '', od_add: '',
    og_sph: '', og_cyl: '', og_axe: '', og_add: '',
  })
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setVals(prev => ({ ...prev, [k]: v }))

  const allFilled = () => {
    if (!vals.od_sph || !vals.og_sph) return false
    if (hasCyl && (!vals.od_cyl || !vals.od_axe || !vals.og_cyl || !vals.og_axe)) return false
    if (hasAdd && (!vals.od_add || !vals.og_add)) return false
    return true
  }

  const checkCorrect = () => {
    const { od, og } = q.ordonnance
    const match = (entered, expected) => {
      if (!expected) return true
      return entered.trim().replace('.', ',') === expected.trim().replace('.', ',')
    }
    return (
      match(vals.od_sph, od.sph) &&
      match(vals.og_sph, og.sph) &&
      (!hasCyl || (match(vals.od_cyl, od.cyl) && match(vals.od_axe, od.axe) && match(vals.og_cyl, og.cyl) && match(vals.og_axe, og.axe))) &&
      (!hasAdd || (match(vals.od_add, od.add) && match(vals.og_add, og.add)))
    )
  }

  const handleSubmit = async () => {
    if (!allFilled() || saving) return
    setSaving(true)
    const ok = checkCorrect()
    await saveModuleQuizAnswer({
      sessionCode: getParticipantSessionCode(),
      moduleId, questionIdx: qIdx,
      collaborateur: pName.trim(),
      answerIdx: 0, isCorrect: ok,
    })
    setIsCorrect(ok)
    setAnswered(true)
    setSaving(false)
  }

  if (answered && isCorrect !== null) return <QuizResultScreen isCorrect={isCorrect} />

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }
  const labelStyle = { fontSize: 13, fontWeight: 800, color: '#a78bfa', width: 28, flexShrink: 0 }

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20,
      }}>Question {qIdx + 1}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textAlign: 'center' }}>
        Regardez l&apos;ordonnance sur l&apos;écran
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 24, textAlign: 'center' }}>
        {q.question}
      </div>

      {/* Colonnes */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, width: '100%', maxWidth: 400, paddingLeft: 36 }}>
        <div style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Sph</div>
        {hasCyl && <div style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Cyl</div>}
        {hasCyl && <div style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Axe</div>}
        {hasAdd && <div style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' }}>Add</div>}
      </div>

      <div style={{ width: '100%', maxWidth: 400 }}>
        {[{ key: 'od', label: 'OD' }, { key: 'og', label: 'OG' }].map(({ key, label }) => (
          <div key={key} style={rowStyle}>
            <div style={labelStyle}>{label}</div>
            <OrdoSelect value={vals[`${key}_sph`]} onChange={v => set(`${key}_sph`, v)} options={SPH_OPTS} placeholder="—" />
            {hasCyl && <OrdoSelect value={vals[`${key}_cyl`]} onChange={v => set(`${key}_cyl`, v)} options={CYL_OPTS} placeholder="—" />}
            {hasCyl && <OrdoSelect value={vals[`${key}_axe`]} onChange={v => set(`${key}_axe`, v)} options={AXE_OPTS} placeholder="—" />}
            {hasAdd && <OrdoSelect value={vals[`${key}_add`]} onChange={v => set(`${key}_add`, v)} options={ADD_OPTS} placeholder="—" />}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={!allFilled() || saving} style={{
        background: allFilled() ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.08)',
        border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: allFilled() ? 'pointer' : 'default',
        fontFamily: 'inherit', width: '100%', maxWidth: 400, marginTop: 16,
      }}>
        {saving ? 'Envoi…' : '✓ Valider'}
      </button>
    </div>
  )
}

// ── Quiz sélecteur de puissances ─────────────────────────────────
function genPosOpts() {
  const opts = []
  for (let v = 25; v <= 725; v += 25) opts.push(`+${(v / 100).toFixed(2).replace('.', ',')}`)
  return opts
}
function genNegOpts() {
  const opts = []
  for (let v = 25; v <= 800; v += 25) opts.push(`-${(v / 100).toFixed(2).replace('.', ',')}`)
  return opts
}
const POS_OPTS = genPosOpts()
const NEG_OPTS = genNegOpts()

function QuizPowerSelector({ pName, q, qIdx, moduleId }) {
  const [posVal, setPosVal] = useState('')
  const [negVal, setNegVal] = useState('')
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!posVal || !negVal || saving) return
    setSaving(true)
    const ok = posVal === q.correctPos && negVal === q.correctNeg
    await saveModuleQuizAnswer({
      sessionCode: getParticipantSessionCode(),
      moduleId, questionIdx: qIdx,
      collaborateur: pName.trim(),
      answerIdx: 0, isCorrect: ok,
    })
    setIsCorrect(ok)
    setAnswered(true)
    setSaving(false)
  }

  if (answered && isCorrect !== null) return <QuizResultScreen isCorrect={isCorrect} />

  const selectStyle = {
    flex: 1, padding: '14px 10px', borderRadius: 14,
    background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff', fontSize: 20, fontWeight: 800,
    fontFamily: 'inherit', outline: 'none', appearance: 'none', textAlign: 'center',
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24,
      }}>Question {qIdx + 1}</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32, textAlign: 'center' }}>
        Regardez la question sur l&apos;écran<br />et choisissez les valeurs
      </div>

      <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 360, marginBottom: 12 }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Positif max</div>
          <select value={posVal} onChange={e => setPosVal(e.target.value)} style={selectStyle}>
            <option value="">— +</option>
            {POS_OPTS.map(o => <option key={o} value={o} style={{ background: '#0d1f3c' }}>{o}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Négatif max</div>
          <select value={negVal} onChange={e => setNegVal(e.target.value)} style={selectStyle}>
            <option value="">— -</option>
            {NEG_OPTS.map(o => <option key={o} value={o} style={{ background: '#0d1f3c' }}>{o}</option>)}
          </select>
        </div>
      </div>

      <button onClick={handleSubmit} disabled={!posVal || !negVal || saving} style={{
        background: (posVal && negVal) ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.08)',
        border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: (posVal && negVal) ? 'pointer' : 'default',
        fontFamily: 'inherit', width: '100%', maxWidth: 360, marginTop: 16,
      }}>
        {saving ? 'Envoi…' : '✓ Valider'}
      </button>
    </div>
  )
}

// Écran réponse pour UNE question — s'affiche sur le téléphone
// La question est sur la TV, le participant répond ici
// QCM standard (ordonnance sur TV comptent aussi comme qcm-ordonnance)
function QuizQCMAnswer({ pName, q, qIdx, quiz, moduleId }) {
  const [answered, setAnswered] = useState(false)
  const [chosenIdx, setChosenIdx] = useState(null)
  const [lastIsCorrect, setLastIsCorrect] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)

  const handleAnswer = async (optIdx) => {
    if (answered || saving) return
    if (!pName?.trim()) { setSaveError(true); return }
    setSaving(true)
    setSaveError(false)
    const isCorrect = optIdx === q.correct
    try {
      const saved = await saveModuleQuizAnswer({
        sessionCode: getParticipantSessionCode(),
        moduleId, questionIdx: qIdx,
        collaborateur: pName.trim(),
        answerIdx: optIdx, isCorrect,
      })
      if (!saved) { setSaveError(true); setSaving(false); return }
      setLastIsCorrect(isCorrect)
      setAnswered(true)
      setChosenIdx(optIdx)
    } catch (e) { console.error(e); setSaveError(true) }
    setSaving(false)
  }

  if (answered) return <QuizResultScreen isCorrect={lastIsCorrect} />

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px',
        fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24,
      }}>Question {qIdx + 1} / {quiz.length}</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 40, textAlign: 'center' }}>
        Regardez la question sur l&apos;écran<br />et choisissez votre réponse
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, width: '100%', maxWidth: 400 }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)} style={{
            background: OPTION_COLORS[i], border: 'none', borderRadius: 18,
            padding: '22px 24px', display: 'flex', alignItems: 'center', gap: 16,
            cursor: 'pointer', fontFamily: 'inherit', width: '100%',
            boxShadow: `0 6px 24px ${OPTION_COLORS[i]}55`,
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

function QuizAnswerScreen({ pName, qIdx, quiz, moduleId }) {
  const q = quiz[qIdx]
  const type = q?.type || 'qcm'
  if (type === 'text-open') return <QuizTextOpen pName={pName} q={q} qIdx={qIdx} moduleId={moduleId} />
  if (type === 'qcm-multi') return <QuizMultiSelect pName={pName} q={q} qIdx={qIdx} moduleId={moduleId} />
  if (type === 'ordonnance-fill') return <QuizOrdonnanceFill pName={pName} q={q} qIdx={qIdx} moduleId={moduleId} />
  if (type === 'power-selector') return <QuizPowerSelector pName={pName} q={q} qIdx={qIdx} moduleId={moduleId} />
  return <QuizQCMAnswer pName={pName} q={q} qIdx={qIdx} quiz={quiz} moduleId={moduleId} />
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
      const rows = await sbSelect('quiz_answers', `session_code=eq.${getParticipantSessionCode()}&module_id=eq.${moduleId}&collaborateur=eq.${encodeURIComponent(name)}`)
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

        {/* Encart clé */}
        <div style={{
          margin: '28px 20px 20px',
          padding: '20px 24px',
          borderRadius: 16,
          background: 'rgba(0,171,233,0.07)',
          border: '1px solid rgba(0,171,233,0.22)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>⚡</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>À retenir</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Fabrication en 10 minutes
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
function PauseMobile({ page, pageIndex, total, pName }) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    setVisible(false)
    setText('')
    setSent(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await insertOpenAnswer({
        sessionCode: getParticipantSessionCode(),
        pageId: page.id,
        participantName: pName || 'Anonyme',
        answer: text.trim(),
      })
      setText('')
      setSent(true)
      setTimeout(() => setSent(false), 2500)
    } finally {
      setSending(false)
    }
  }

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
        gap: 24, padding: '32px 24px 24px',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {page.icon && (
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(0,171,233,0.15)',
          }}>
            <span style={{ fontSize: 38, lineHeight: 1 }}>{page.icon}</span>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 8 }}>
            {page.titre}
          </div>
          {page.sousTitre && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 400, lineHeight: 1.5 }}>
              {page.sousTitre}
            </div>
          )}
        </div>

        {/* Zone de réponse */}
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
            Votre réponse
          </div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Écrivez votre réponse…"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14, padding: '14px 16px',
              color: '#fff', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.5,
              resize: 'none', outline: 'none',
            }}
            onFocus={e => { e.target.style.borderColor = 'rgba(0,171,233,0.5)' }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            style={{
              marginTop: 10, width: '100%',
              padding: '14px 20px', borderRadius: 14,
              fontFamily: 'inherit', fontSize: 15, fontWeight: 700,
              cursor: (!text.trim() || sending) ? 'default' : 'pointer',
              transition: 'all .2s',
              background: sent
                ? 'rgba(74,222,128,0.15)'
                : (!text.trim() || sending)
                  ? 'rgba(255,255,255,0.07)'
                  : 'linear-gradient(135deg, #0070a0, #0089ba)',
              border: sent ? '1px solid rgba(74,222,128,0.4)' : 'none',
              color: sent ? '#4ade80' : (!text.trim() || sending) ? 'rgba(255,255,255,0.3)' : '#fff',
              boxShadow: (!text.trim() || sending || sent) ? 'none' : '0 4px 16px rgba(0,137,186,0.35)',
            }}
          >
            {sent ? '✓ Envoyée !' : sending ? '…' : 'Envoyer'}
          </button>
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

// ── FAQ Réveil des acquis — saisie participant ───────────────────
const FAQ_JOURNEE_LABELS = { j1: 'Journée 1', j2: 'Journée 2', j3: 'Journée 3' }

export function FAQInputMobile({ journeeId }) {
  const [text, setText]             = useState('')
  const [sending, setSending]       = useState(false)
  const [count, setCount]           = useState(0)  // nb questions envoyées
  const [showNew, setShowNew]       = useState(false)

  const label = FAQ_JOURNEE_LABELS[journeeId] || 'FAQ'

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const key = `faq_${journeeId}_q`
      const state = await getSharedState()
      const current = state?.[key] || []
      const nom    = typeof window !== 'undefined' ? (localStorage.getItem('participant_name') || '') : ''
      const prenom = typeof window !== 'undefined' ? (localStorage.getItem('participant_prenom') || '') : ''
      const author = [prenom, nom].filter(Boolean).join(' ') || 'Anonyme'
      const newQ = { id: Date.now().toString(), text: trimmed, highlighted: false, author }
      await setSharedState({ [key]: [...current, newQ] })
      setText('')
      setCount(c => c + 1)
      setShowNew(false)
    } catch { /* ignore */ }
    setSending(false)
  }

  const submitted = count > 0 && !showNew

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
        Réveil des acquis · {label}
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>
        FAQ anonyme ⚡
      </h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>
        Quelle est la question qui te travaille le plus sur cette journée ?{' '}
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>Ton identité reste anonyme.</span>
      </p>

      {submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
            borderRadius: 16, padding: '20px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 6 }}>
              ✓ Question envoyée anonymement
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>
              {count} question{count > 1 ? 's' : ''} posée{count > 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={() => setShowNew(true)}
            style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#f59e0b', borderRadius: 14, padding: '16px',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >+ Poser une autre question ?</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Écris ta question ici…"
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
              background: text.trim() ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(255,255,255,0.1)',
              border: 'none', borderRadius: 14, padding: '16px',
              fontSize: 16, fontWeight: 700, color: '#fff',
              cursor: text.trim() ? 'pointer' : 'default',
              fontFamily: 'inherit', transition: 'background .2s',
              opacity: sending ? 0.7 : 1,
              boxShadow: text.trim() ? '0 6px 24px rgba(245,158,11,0.35)' : 'none',
            }}
          >
            {sending ? 'Envoi en cours…' : 'Envoyer anonymement →'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Freins à l'achat — saisie libre participant ───────────────────
function FreinsInputMobile({ page, pName }) {
  const [text, setText]               = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [submittedText, setSubmittedText] = useState('')
  const [sending, setSending]         = useState(false)
  const [saveError, setSaveError]     = useState(false)

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    setSaveError(false)
    try {
      const x = Math.floor(Math.random() * 65) + 3
      const y = Math.floor(Math.random() * 38) + 42
      const ok = await mergeRoomSharedField(
        getParticipantSessionCode(),
        'freins_responses',
        pName,
        { text: text.trim(), x, y }
      )
      if (!ok) {
        setSaveError(true)
        return
      }
      setSubmittedText(text.trim())
      setSubmitted(true)
    } catch {
      setSaveError(true)
    } finally {
      setSending(false)
    }
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
          {saveError && (
            <div style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
              borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#fca5a5', textAlign: 'center',
            }}>
              Enregistrement impossible. Réessayez ou prévenez le formateur.
            </div>
          )}
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

// ── Ventes opticien — saisie numérique participant ────────────────
function VentesOpticienMobile({ page, pName }) {
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
      const ok = await mergeRoomSharedField(
        getParticipantSessionCode(),
        'ventes_responses',
        pName,
        { text: value.trim(), x, y }
      )
      if (!ok) return
      setSubmittedValue(value.trim())
      setSubmitted(true)
    } catch { /* ignore */ }
    setSending(false)
  }

  const handleModify = () => { setValue(submittedValue); setSubmitted(false) }

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', display: 'flex', flexDirection: 'column', padding: '52px 24px 40px' }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain', marginBottom: 36 }} />
      <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Question ouverte</div>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.45, marginBottom: 32 }}>{page.titre}</h2>

      {submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 16, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', marginBottom: 8 }}>✓ Réponse envoyée</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>
              {submittedValue} <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>paires / jour</span>
            </div>
          </div>
          <button onClick={handleModify} style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', color: '#a78bfa', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✏️ Modifier ma réponse</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '0 20px', overflow: 'hidden' }}>
            <input
              type="number" inputMode="numeric" pattern="[0-9]*"
              value={value}
              onChange={e => setValue(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 36, fontWeight: 900, padding: '20px 0', fontFamily: 'inherit', WebkitAppearance: 'none', MozAppearance: 'textfield' }}
            />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', paddingLeft: 8, whiteSpace: 'nowrap' }}>paires / jour</span>
          </div>
          <button onClick={handleSend} disabled={!value.trim() || sending} style={{ background: value.trim() ? '#a78bfa' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 14, padding: '16px', fontSize: 16, fontWeight: 700, color: '#fff', cursor: value.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background .2s', opacity: sending ? 0.7 : 1 }}>
            {sending ? 'Envoi en cours…' : 'Envoyer ma réponse →'}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Promesse — saisie libre participant ───────────────────────────
function PromesseInputMobile({ page, pName }) {
  const [text, setText]               = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [submittedText, setSubmittedText] = useState('')
  const [sending, setSending]         = useState(false)
  const accent = '#34d399'

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const x = Math.floor(Math.random() * 65) + 3
      const y = Math.floor(Math.random() * 38) + 42
      const ok = await mergeRoomSharedField(
        getParticipantSessionCode(),
        'promesse_responses',
        pName,
        { text: text.trim(), x, y }
      )
      if (!ok) return
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

      <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
        Question ouverte
      </div>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.45, marginBottom: 32 }}>
        {page.titre}
      </h2>

      {submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: 16, padding: '16px 20px',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: accent, marginBottom: 8 }}>✓ Réponse envoyée</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{submittedText}</div>
          </div>
          <button onClick={handleModify} style={{
            background: 'rgba(52,211,153,0.1)', border: `1px solid rgba(52,211,153,0.3)`,
            color: accent, borderRadius: 14, padding: '14px',
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
              background: text.trim() ? accent : 'rgba(255,255,255,0.1)',
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
      const ok = await mergeRoomSharedField(
        getParticipantSessionCode(),
        'prix_responses',
        pName,
        { text: value.trim(), x, y }
      )
      if (!ok) return
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

function ForceLPTMobile({ page, pageIndex, total }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    setVisible(0)
    const timers = page.items.map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 400 + i * 500)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  return (
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
      <div style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Notre modèle</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 24, lineHeight: 1.3 }}>{page.titre}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {page.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `4px solid ${item.color}`,
            borderRadius: 14, padding: '14px 16px',
            opacity: i < visible ? 1 : 0,
            transform: i < visible ? 'translateX(0)' : 'translateX(-16px)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Progressif : Page cours avec verre 3D ────────────────────────
function ProgressifCoursMobile({ page, pageIndex, total }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [page.id])

  const accent = '#7c3aed'

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0d1d3a 50%, #100820 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '0 0 32px',
    }}>
      {/* Header */}
      <div style={{
        padding: '18px 20px 0',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={64} height={24}
          style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              width: i === pageIndex ? 18 : 4,
              background: i === pageIndex ? accent : 'rgba(255,255,255,0.2)',
              transition: 'all .4s',
            }} />
          ))}
        </div>
      </div>

      {/* Badge module */}
      <div style={{ padding: '14px 20px 0' }}>
        <div style={{
          display: 'inline-block',
          background: `${accent}20`, border: `1px solid ${accent}45`,
          borderRadius: 20, padding: '3px 14px',
          fontSize: 10, fontWeight: 700, color: '#a78bfa',
          textTransform: 'uppercase', letterSpacing: 1.5,
        }}>Le Verre Progressif</div>
      </div>

      {/* Titre */}
      <div style={{
        padding: '10px 20px 0',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 0.5s ease',
      }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
          {page.titre}
        </div>
        {page.sousTitre && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, lineHeight: 1.5 }}>
            {page.sousTitre}
          </div>
        )}
      </div>

      {/* Verre 3D */}
      <div style={{
        flex: '0 0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '10px 0 6px',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ position: 'relative' }}>
          {/* Halo violet */}
          <div style={{
            position: 'absolute', inset: -20, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)',
            animation: 'haloBreath 3.5s ease-in-out infinite',
          }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/verre-prog.png"
            alt="Verre progressif"
            style={{
              width: 220, height: 'auto', display: 'block', position: 'relative', zIndex: 1,
              animation: 'verreFloat 5s ease-in-out infinite',
              filter: 'drop-shadow(0 0 28px rgba(124,58,237,0.55)) drop-shadow(0 10px 20px rgba(0,0,0,0.4))',
            }}
          />
        </div>
      </div>

      {/* Points du cours */}
      {page.points && page.points.length > 0 && (
        <div style={{
          padding: '0 16px',
          display: 'flex', flexDirection: 'column', gap: 6,
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.6s ease 0.3s',
        }}>
          {page.points.map((pt, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>
                {typeof pt === 'object' ? pt.emoji : String(i + 1)}
              </span>
              <div>
                {typeof pt === 'object' ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e2d9ff', lineHeight: 1.3 }}>{pt.titre}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, marginTop: 1 }}>{pt.texte}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500, lineHeight: 1.5 }}>{pt}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bas de page — écoute formateur */}
      <div style={{
        marginTop: 'auto', paddingTop: 20, padding: '20px 20px 0',
        display: 'flex', alignItems: 'center', gap: 8,
        opacity: visible ? 0.7 : 0, transition: 'opacity 0.8s ease 0.5s',
      }}>
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, animation: 'waitDot 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
          Écoutez le formateur et regardez l&apos;écran de diffusion
        </span>
      </div>
    </div>
  )
}

// ── Progressif : verre animé réutilisable (défini hors composant) ──
function ZoneVerreMobile({ size = 190 }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        position: 'absolute', inset: -18, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
        animation: 'haloBreath 3.5s ease-in-out infinite',
      }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/verre-prog.png" alt="Verre progressif" style={{
        width: size, height: 'auto', display: 'block', position: 'relative', zIndex: 1,
        animation: 'verreFloat 5s ease-in-out infinite',
        filter: 'drop-shadow(0 0 24px rgba(124,58,237,0.5)) drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
      }} />
    </div>
  )
}

// ── Progressif : Zone interactif participant ──────────────────────
function ZoneInteractifMobile({ page, pName, progZoneQ, progZoneResponses }) {
  const [selected, setSelected] = useState(null)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    console.log('[ZoneInteractifMobile] 🎯 progZoneQ=', progZoneQ, '— pName=', pName)
    setSelected(null); setSent(false)
  }, [progZoneQ])

  useEffect(() => {
    if (progZoneQ !== null && progZoneQ !== undefined && progZoneResponses?.[pName] !== undefined) {
      setSelected(progZoneResponses[pName])
      setSent(true)
    }
  }, [progZoneResponses, pName, progZoneQ])

  const q = progZoneQ !== null && progZoneQ !== undefined ? page.zoneQuestions?.[progZoneQ] : null
  const COLORS = ['#ef4444', '#3b82f6', '#f59e0b']

  const handleSelect = async (idx) => {
    if (sent) return
    setSelected(idx)
    setSent(true)
    await mergeRoomSharedField(
      getParticipantSessionCode(),
      'prog_zone_responses',
      pName,
      idx
    )
  }

  const bg = 'linear-gradient(160deg, #03112a 0%, #12013a 100%)'

  if (!q) return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 0 }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain', marginBottom: 32, opacity: 0.7 }} />
      <div style={{ marginBottom: 28 }}><ZoneVerreMobile size={210} /></div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
        Identifie les zones
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 240 }}>
        En attente de la question du formateur…
      </div>
      <div style={{ display: 'flex', gap: 5, marginTop: 16 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', animation: `waitDot 1.4s ease-in-out ${i * 0.2}s infinite` }} />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column', padding: '44px 24px 36px' }}>
      {/* Logo + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={28} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '3px 12px', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Q{(progZoneQ || 0) + 1} / {page.zoneQuestions?.length}
        </div>
      </div>

      {/* Verre */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <ZoneVerreMobile size={160} />
      </div>

      {/* Question */}
      <h2 style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 20, textAlign: 'center' }}>{q.question}</h2>

      {/* Réponses ABC */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleSelect(i)} disabled={sent} style={{
            background: sent ? (selected === i ? 'rgba(124,58,237,0.22)' : 'rgba(255,255,255,0.03)') : 'rgba(255,255,255,0.07)',
            border: `2px solid ${sent && selected === i ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 14, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 14,
            cursor: sent ? 'default' : 'pointer', fontFamily: 'inherit',
            transition: 'all .2s',
          }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{'ABC'[i]}</div>
            <span style={{ fontSize: 15, fontWeight: 600, color: sent && selected === i ? '#c4b5fd' : '#fff', textAlign: 'left' }}>{opt}</span>
            {sent && selected === i && <span style={{ marginLeft: 'auto', fontSize: 20 }}>✓</span>}
          </button>
        ))}
      </div>

      {sent && (
        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
          Réponse envoyée — en attente du formateur
        </div>
      )}
    </div>
  )
}

// ── Progressif : Retour terrain participant ───────────────────────
function RetourTerrainMobile({ page, pName }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [sentText, setSentText] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const ok = await mergeRoomSharedField(
        getParticipantSessionCode(),
        'prog_retour_responses',
        pName,
        { text: text.trim() }
      )
      if (!ok) return
      setSentText(text.trim())
      setSent(true)
    } catch { /* ignore */ }
    setSending(false)
  }

  const bg = 'linear-gradient(160deg, #03112a 0%, #12013a 100%)'
  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column', padding: '52px 24px 40px' }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain', marginBottom: 28 }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Retour du terrain · J+14</div>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 8 }}>{page.question}</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Partagez une expérience réelle de vos 2 semaines en magasin</p>

      {sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 16, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 6, textTransform: 'uppercase' }}>Votre réponse</div>
            <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6 }}>{sentText}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Réponse partagée avec le groupe</div>
          <button onClick={() => setSent(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '12px', borderRadius: 12, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Modifier</button>
        </div>
      ) : (
        <>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={page.placeholder || "Décrivez votre expérience…"}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px', fontSize: 15, color: '#fff', lineHeight: 1.6, resize: 'none', height: 160, fontFamily: 'inherit', marginBottom: 16, outline: 'none' }} />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            style={{ background: text.trim() ? 'linear-gradient(135deg, #7c3aed, #9f67fa)' : 'rgba(255,255,255,0.06)', border: 'none', color: text.trim() ? '#fff' : 'rgba(255,255,255,0.3)', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            {sending ? 'Envoi…' : 'Partager avec le groupe →'}
          </button>
        </>
      )}
    </div>
  )
}

// ── Progressif : Jeu d'objections participant ─────────────────────
function JeuObjectionsMobile({ page, pName, progObjectionIdx, progObjectionResponses }) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [sentText, setSentText] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { setText(''); setSent(false); setSentText('') }, [progObjectionIdx])

  useEffect(() => {
    if (progObjectionIdx !== null && progObjectionIdx !== undefined && progObjectionResponses?.[pName]) {
      const r = progObjectionResponses[pName]
      setSentText(r.text || r)
      setSent(true)
    }
  }, [progObjectionResponses, pName, progObjectionIdx])

  const objection = progObjectionIdx !== null && progObjectionIdx !== undefined ? page.objections?.[progObjectionIdx] : null
  const bg = 'linear-gradient(160deg, #03112a 0%, #12013a 100%)'

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const ok = await mergeRoomSharedField(
        getParticipantSessionCode(),
        'prog_objection_responses',
        pName,
        { text: text.trim() }
      )
      if (!ok) return
      setSentText(text.trim())
      setSent(true)
    } catch { /* ignore */ }
    setSending(false)
  }

  if (!objection) return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain', marginBottom: 32 }} />
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Le formateur va choisir une objection…</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: bg, display: 'flex', flexDirection: 'column', padding: '52px 24px 40px' }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain', marginBottom: 28 }} />
      <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Le client dit :</div>
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 16, padding: '16px 20px', marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.4, fontStyle: 'italic' }}>"{objection}"</div>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>Quelle est votre meilleure réponse à cette objection ?</p>

      {sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 16, padding: '16px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 6, textTransform: 'uppercase' }}>Votre réponse</div>
            <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.6 }}>{sentText}</div>
          </div>
          <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>En attente du formateur</div>
          <button onClick={() => setSent(false)} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '12px', borderRadius: 12, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Modifier</button>
        </div>
      ) : (
        <>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Tapez votre meilleure réponse…"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px', fontSize: 15, color: '#fff', lineHeight: 1.6, resize: 'none', height: 140, fontFamily: 'inherit', marginBottom: 16, outline: 'none' }} />
          <button onClick={handleSend} disabled={!text.trim() || sending}
            style={{ background: text.trim() ? 'linear-gradient(135deg, #7c3aed, #9f67fa)' : 'rgba(255,255,255,0.06)', border: 'none', color: text.trim() ? '#fff' : 'rgba(255,255,255,0.3)', padding: '16px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', fontFamily: 'inherit' }}>
            {sending ? 'Envoi…' : 'Envoyer ma réponse →'}
          </button>
        </>
      )}
    </div>
  )
}

function TrameAccueilMobile() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={140} height={52}
        style={{ objectFit: 'contain', marginBottom: 40 }} />
      <div style={{ fontSize: 32, marginBottom: 16 }}>🎧</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
        Formation Journée 2
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 12 }}>
        La trame d'accueil<br />
        <span style={{ color: '#00abe9' }}>Lunettes Pour Tous</span>
      </div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
        Écoutez le formateur.<br />La trame s'affiche sur l'écran.
      </p>
    </div>
  )
}

function ModuleScreen({ page, pageIndex, total, moduleLabel, pName, progZoneQ, progZoneResponses, progObjectionIdx, progObjectionResponses, modelePoint }) {
  const [key, setKey] = useState(0)
  useEffect(() => { setKey(k => k + 1) }, [page.id])

  if (page.type === 'trame-accueil')    return <TrameAccueilMobile />
  if (page.type === 'offres-classique' || page.type === 'offres-1-1') return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #001e40 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={140} height={52} style={{ objectFit: 'contain', marginBottom: 40 }} />
      <div style={{ fontSize: 32, marginBottom: 16 }}>🎧</div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Les offres · Formation Journée 2</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
        {page.type === 'offres-classique' ? 'Le parcours Classique' : 'Le parcours 1=1'}
      </div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Écoutez le formateur.<br />Le contenu s'affiche sur l'écran.</p>
    </div>
  )
  if (page.type === 'troubles-intro')    return <TroublesIntroMobile      page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'troubles-list')    return <TroublesListMobile       page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'correction-scale') return <CorrectionScaleMobile    page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'ordonnance')        return <OrdonnanceMobile         page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'pause')             return <PauseMobile              page={page} pageIndex={pageIndex} total={total} pName={pName} />
  if (page.type === 'parcours-tiers-payant') return <PauseMobile          page={page} pageIndex={pageIndex} total={total} pName={pName} />
  if (page.type === 'tiers-payant-explication') return (
    <div style={{ minHeight: '100vh', background: '#03112a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>📺</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Regardez le grand écran</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280 }}>
        L'animation explique comment fonctionne le tiers payant complet et partiel.
      </p>
      <div style={{ marginTop: 28, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 16, padding: '12px 24px' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Dans les deux cas : 0 € reste à charge 🎉</span>
      </div>
    </div>
  )
  if (page.type === 'saisie-interactive') return <SaisieInteractiveMobile page={page} pageIndex={pageIndex} total={total} />

  // Freins à l'achat — saisie libre
  if (page.type === 'freins') return <FreinsInputMobile page={page} pName={pName || 'Anonyme'} />

  // Prix moyen — saisie numérique
  if (page.type === 'prix') return <PrixInputMobile page={page} pName={pName || 'Anonyme'} />

  // Ventes opticien — saisie numérique
  if (page.type === 'ventes-opticien') {
    return <VentesOpticienMobile page={page} pName={pName || 'Anonyme'} />
  }

  // Promesse — saisie libre
  if (page.type === 'promesse') return <PromesseInputMobile page={page} pName={pName || 'Anonyme'} />

  // Force LPT — liste progressive (écran neutre si vidéo en cours)
  if (page.type === 'force-lpt') {
    if (modelePoint !== null) return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #001e40 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={120} height={45} style={{ objectFit: 'contain', marginBottom: 40 }} />
        <div style={{ fontSize: 32, marginBottom: 16 }}>📺</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Notre modèle · Formation Journée 1</div>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Regardez l&apos;écran.<br />Une vidéo est diffusée.</p>
      </div>
    )
    return <ForceLPTMobile page={page} pageIndex={pageIndex} total={total} />
  }

  // Progressif module types
  const isProgressif = moduleLabel?.includes('Progressif')
  if (page.type === 'cours' && isProgressif)
    return <ProgressifCoursMobile page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'zone-interactif') return <ZoneInteractifMobile page={page} pName={pName || 'Anonyme'} progZoneQ={progZoneQ} progZoneResponses={progZoneResponses} />
  if (page.type === 'prog-retour')     return <RetourTerrainMobile  page={page} pName={pName || 'Anonyme'} />
  if (page.type === 'prog-objections') return <JeuObjectionsMobile  page={page} pName={pName || 'Anonyme'} progObjectionIdx={progObjectionIdx} progObjectionResponses={progObjectionResponses} />

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
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `4px solid ${stat.color}`,
            borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', minWidth: 90 }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500, lineHeight: 1.4 }}>{stat.label}</div>
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
          setDenyMessage('Connectez-vous depuis la page d\'accueil avec votre nom et prénom (liste RH).')
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
              : resolved.reason === 'need_full_name'
                ? 'Saisissez nom et prénom (comme sur la ligne bleue « Connexion : … »).'
                : resolved.reason === 'ambiguous_prenom'
                  ? 'Plusieurs personnes portent ce prénom — précisez aussi votre nom de famille.'
                  : 'Nom non reconnu. Vérifiez nom et prénom comme sur la liste RH.'
          )
          setStatus('denied')
        }
        return
      }

      const sessionRows = await sbSelect(
        'sessions',
        `code=eq.${encodeURIComponent(getParticipantSessionCode())}&limit=1`
      )
      const session = sessionRows?.[0]
      if (session?.status === 'ended') {
        if (!cancelled) {
          setDenyMessage('Cette session est terminée.')
          setStatus('denied')
        }
        return
      }
      if (!canParticipantJoinSession(session, resolved.entry)) {
        if (!cancelled) {
          setDenyMessage(getCategoryJoinDeniedMessage(session, resolved.entry))
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
          session_code: getParticipantSessionCode(),
          name: canonical,
          joined_at: new Date().toISOString(),
          left_at: null,
          last_seen_at: new Date().toISOString(),
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

function ParticipantPlanningScreen({ planningDay }) {
  const jour = PLANNING_JOURS.find(j => j.id === planningDay)
  if (!jour) return <WaitingScreen />

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', display: 'flex', flexDirection: 'column', padding: '32px 20px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ background: `${jour.color}20`, border: `1px solid ${jour.color}50`, borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1 }}>{jour.jour}</div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{jour.label}</div>
        <div style={{ width: 40, height: 3, borderRadius: 2, background: jour.color }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {jour.blocs.map((bloc, i) => {
          const isPause = bloc.titre === 'Pause déjeuner'
          if (isPause) return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.3)' }} />
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                {bloc.horaire && <span style={{ opacity: 0.7, marginRight: 8 }}>{bloc.horaire}</span>}Pause déjeuner
              </div>
              <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.3)' }} />
            </div>
          )
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: `2px solid ${jour.color}`, borderRadius: 14, padding: '16px 16px' }}>
              {bloc.horaire && (
                <div style={{ fontSize: 10, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{bloc.horaire}</div>
              )}
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: bloc.items.length > 0 ? 10 : 0 }}>{bloc.titre}</div>
              {bloc.items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {bloc.items.map((item, j) => (
                    <div key={j} style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      borderLeft: `2px solid ${jour.color}60`,
                      borderRadius: 8, padding: '7px 12px',
                      fontSize: 12, color: 'rgba(255,255,255,0.75)',
                      fontWeight: 500, lineHeight: 1.4,
                    }}>{item}</div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DisconnectChip({ pName, onDisconnect }) {
  const [open, setOpen] = useState(false)
  const prenom = (pName || '').split(' ').pop()

  const handleDisconnect = () => {
    localStorage.removeItem('participant_name')
    localStorage.removeItem('participant_prenom')
    if (onDisconnect) {
      onDisconnect()
    } else {
      window.location.reload()
    }
  }

  return (
    <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20, padding: '6px 14px',
          color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ fontSize: 14 }}>👤</span>
        {prenom}
      </button>
      {open && (
        <button
          onClick={handleDisconnect}
          style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 12, padding: '8px 16px',
            color: '#f87171', fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
          }}
        >
          Se déconnecter
        </button>
      )}
    </div>
  )
}

function ParticipantModuleContent({ forcedModule, forcedPage, pName, sharedStateProp, onDisconnect }) {
  const sessionCode = getParticipantSessionCode()
  const [sessionEnded, setSessionEnded] = useState(false)

  useParticipantPresence({
    sessionCode,
    name: pName,
    enabled: !!sessionCode && !!pName && !sessionEnded,
    onSessionEnded: () => setSessionEnded(true),
  })

  // Déconnexion automatique après 45 min d'inactivité (page en arrière-plan)
  useEffect(() => {
    if (!onDisconnect) return
    const TIMEOUT_MS = 45 * 60 * 1000
    let hiddenAt = null
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt > TIMEOUT_MS) onDisconnect()
        hiddenAt = null
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [onDisconnect])

  // forcedModule = via ParticipantView (polling géré là-bas) → useModuleSync désactivé
  // sans forcedModule = accès direct ?mode=participant → useModuleSync actif
  const sync = useModuleSync({ disabled: forcedModule != null })
  const activeModule  = forcedModule ?? sync.activeModule
  const modulePage    = forcedPage   ?? sync.modulePage
  const sharedState   = sharedStateProp ?? sync.sharedState
  const [planningDay, setPlanningDay]         = useState(null)
  const [tvScreen, setTvScreen]               = useState(null)
  const [progZoneQ, setProgZoneQ]             = useState(null)
  const [progZoneResponses, setProgZoneResponses] = useState({})
  const [progObjectionIdx, setProgObjectionIdx]   = useState(null)
  const [progObjectionResponses, setProgObjectionResponses] = useState({})
  const [modelePoint, setModelePoint]             = useState(null)
  const [faqJournee, setFaqJournee]               = useState(null)

  // ── Hydratation depuis sharedState (fourni par useModuleSync — 1 seul appel Supabase) ──
  useEffect(() => {
    if (!sharedState) { console.log('[ParticipantContent] sharedState null — polling pas encore actif'); return }
    console.log('[ParticipantContent] 📥 sharedState reçu — prog_zone_q=', sharedState.prog_zone_q, 'module=', activeModule)
    setTvScreen(sharedState.tv_screen || null)
    setPlanningDay(sharedState.planning_day || null)
    setProgZoneQ(sharedState.prog_zone_q ?? null)
    setProgZoneResponses(sharedState.prog_zone_responses || {})
    setProgObjectionIdx(sharedState.prog_objection_idx ?? null)
    setProgObjectionResponses(sharedState.prog_objection_responses || {})
    setModelePoint(sharedState.modele_point ?? null)
    setFaqJournee(sharedState.faq_journee || null)
    // Force-disconnect déclenché par le formateur
    // Ignoré si le formé s'est reconnecté après le kick (joined_at > kickTimestamp)
    const kickTimestamp = Number(sharedState.forced_disconnects?.[pName]) || 0
    const joinedAt = Number(typeof window !== 'undefined' && localStorage.getItem('participant_joined_at')) || 0
    const kicked = kickTimestamp > joinedAt && Date.now() - kickTimestamp < 30 * 60 * 1000
    if (pName && kicked) {
      onDisconnect?.()
      return
    }
  }, [sharedState])

  const moduleData = MODULE_DATA[activeModule] || null
  const pages = moduleData?.pages || []
  const quiz = moduleData?.quiz || []

  const isLobby   = !!moduleData && modulePage === -1
  const isResults = !!moduleData && modulePage === 200
  const isQuiz    = !!moduleData && modulePage >= 100 && modulePage < 200
  const qIdx = modulePage - 100
  const page = (!isQuiz && !isResults && !isLobby && moduleData) ? (pages[modulePage] ?? null) : null
  const quizPodiumActive    = !!sharedState?.quiz_podium_active
  const quizShowCorrection  = !!sharedState?.quiz_show_correction

  if (sessionEnded) return <SessionEndedScreen />

  return (
    <>
      <style>{STYLES}</style>
      <DisconnectChip pName={pName} onDisconnect={onDisconnect} />
      {/* Planning prioritaire : écrase tout si le formateur diffuse le planning */}
      {tvScreen === 'planning' && planningDay
        ? <ParticipantPlanningScreen planningDay={planningDay} />
        : isLobby
          ? <ParticipantModuleLobby moduleLabel={moduleData?.label || ''} moduleSub={moduleData?.sub || ''} />
          : isResults
            ? <PersonalResultsScreen key="results" pName={pName} quiz={quiz} moduleId={activeModule} />
            : isQuiz && quizPodiumActive
              ? (
                <div style={{
                  minHeight: '100vh',
                  background: 'linear-gradient(135deg, #020d1f 0%, #071832 50%, #0a2040 100%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  padding: '32px 24px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
                    Classement en cours…
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>
                    La prochaine question arrive dans quelques secondes
                  </div>
                </div>
              )
              : isQuiz && quizShowCorrection
              ? <ParticipantQuizRanking pName={pName} moduleId={activeModule} qIdx={qIdx} />
              : isQuiz
              ? <QuizAnswerScreen key={modulePage} pName={pName} qIdx={qIdx} quiz={quiz} moduleId={activeModule} />
              : page
                ? <ModuleScreen page={page} pageIndex={modulePage} total={pages.length} moduleLabel={moduleData?.label} pName={pName} progZoneQ={progZoneQ} progZoneResponses={progZoneResponses} progObjectionIdx={progObjectionIdx} progObjectionResponses={progObjectionResponses} modelePoint={modelePoint} />
                : faqJournee
                  ? <FAQInputMobile journeeId={faqJournee} />
                  : <WaitingScreen />
      }
    </>
  )
}

export default function ParticipantModuleView({ forcedModule, forcedPage, pName: pNameProp, sharedState, onDisconnect }) {
  // Quand pName est passé explicitement (participant déjà authentifié via la page d'accueil),
  // on bypasse RhParticipantGate — la validation a déjà eu lieu dans handleParticipantJoin.
  if (pNameProp) {
    return (
      <ParticipantModuleContent
        forcedModule={forcedModule}
        forcedPage={forcedPage}
        pName={pNameProp}
        sharedStateProp={sharedState}
        onDisconnect={onDisconnect}
      />
    )
  }

  // Accès direct via ?mode=participant → validation RH obligatoire
  const pNameRaw = typeof window !== 'undefined' ? localStorage.getItem('participant_name') || '' : ''
  return (
    <RhParticipantGate pNameInput={pNameRaw}>
      {canonicalName => (
        <ParticipantModuleContent
          forcedModule={forcedModule}
          forcedPage={forcedPage}
          pName={canonicalName}
          onDisconnect={onDisconnect}
        />
      )}
    </RhParticipantGate>
  )
}
