'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import LPTSaleApp from '@/components/LPTSaleApp'
import QuestionBubble from '@/components/QuestionBubble'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA, ORD_COLS, ORD_EXAMPLE, SAISIE_EXERCISES, SAISIE_ROUNDS, ENTRAINEMENT_QUESTIONS } from '@/lib/modulesData'
import { PLANNING_JOURS } from '@/lib/planningData'
import { sbUpsert, sbSelect, sbDelete, getParticipantSessionCode, ensureSession, getSharedState, getRoomSharedState, setRoomSharedState, mutateRoomState, insertOpenAnswer, updateOpenAnswer, setParticipantPage } from '@/lib/supabase'
import { useParticipantPresence } from '@/lib/useParticipantPresence'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { generatePin } from '@/lib/pin'
import { resolveParticipantName, normalizeNameKey } from '@/lib/participantNames'
import { mergeRoomSharedField } from '@/lib/roomSharedState'
import { getLevelInfo, getRankMessage, fetchParticipantRanking } from '@/lib/scoring'
import { canParticipantJoinSession, getCategoryJoinDeniedMessage } from '@/lib/formationCategories'
import { resolveParticipantSessionCode, participantJoinBlockedMessage } from '@/lib/participantSession'
import { QuestionsGameParticipantView } from '@/components/QuestionsGamePanel'

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

function WelcomeScreenFirst({ pName }) {
  const firstName = (pName || '').split(' ')[0] || 'toi'
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60}
        style={{ objectFit: 'contain', marginBottom: 40 }} />
      <div style={{ fontSize: 44, marginBottom: 12 }}>👋</div>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
        Bonjour, {firstName} !
      </h2>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, maxWidth: 300, margin: '0 auto' }}>
        Bienvenue chez <strong style={{ color: '#00abe9' }}>Lunettes Pour Tous</strong>.<br />
        Ta formation commence maintenant.
      </p>
      <div style={{
        marginTop: 32,
        background: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.3)',
        borderRadius: 16, padding: '20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Niveau de départ</div>
        <div style={{ fontSize: 34 }}>🌱</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#6b7280', marginTop: 6 }}>Débutant</div>
      </div>
      <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00abe9', animation: 'waitDot 1.4s ease-in-out infinite' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>En attente du formateur…</span>
      </div>
    </div>
  )
}

function DashboardScreen({ pName, myEntry, ranking }) {
  const firstName = (pName || '').split(' ')[0] || 'toi'
  const points = myEntry?.points ?? 0
  const rank = myEntry?.rank
  const levelInfo = getLevelInfo(points)
  const msg = rank ? getRankMessage(rank) : null
  const MEDALS = ['🥇', '🥈', '🥉']
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '32px 20px 48px', overflowY: 'auto',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={120} height={45}
          style={{ objectFit: 'contain', marginBottom: 18 }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', textAlign: 'center', margin: 0 }}>
          Bonjour, {firstName} 👋
        </h2>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{pName}</div>
      </div>

      {/* Carte niveau + points */}
      <div style={{
        background: levelInfo.levelDef.bg, border: `1px solid ${levelInfo.levelDef.border}`,
        borderRadius: 20, padding: '24px 20px', textAlign: 'center', marginBottom: 16,
      }}>
        <div style={{ fontSize: 42 }}>{levelInfo.levelDef.icon}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: levelInfo.levelDef.color, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {levelInfo.levelDef.name}
        </div>
        <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginTop: 8 }}>{points}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 16 }}>points</div>
        {!levelInfo.isMaxLevel ? (
          <>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 99, overflow: 'hidden', margin: '0 8px' }}>
              <div style={{ width: `${levelInfo.progressPct}%`, height: '100%', background: levelInfo.levelDef.color, borderRadius: 99, transition: 'width 0.6s' }} />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
              Encore {levelInfo.ptsToNext} pts pour le niveau suivant
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: levelInfo.levelDef.color, fontWeight: 700 }}>Niveau maximum atteint !</div>
        )}
      </div>

      {/* Message classement */}
      {msg && (
        <div style={{ textAlign: 'center', fontSize: 14, color: msg.color, fontStyle: 'italic', marginBottom: 16, padding: '0 4px', lineHeight: 1.5 }}>
          {msg.text}
        </div>
      )}

      {/* Ma position */}
      {rank != null && ranking.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16, padding: '24px 16px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>
            Ta position cette semaine
          </div>
          {rank <= 3 ? (
            <div style={{ fontSize: 64, lineHeight: 1, marginBottom: 6 }}>
              {MEDALS[rank - 1]}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, marginBottom: 6 }}>
              <span style={{ fontSize: 58, fontWeight: 900, color: '#00abe9', lineHeight: 1 }}>{rank}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#00abe9' }}>e</span>
            </div>
          )}
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            sur {ranking.length} participant{ranking.length > 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Charge le classement complet (quiz + hors quiz, voir buildParticipantRanking) et
 * expose systématiquement une entrée pour pName (0 pt par défaut si pas encore répondu).
 * Partagé entre l'écran d'accueil formé et le bouton "Mon profil" accessible à tout moment.
 */
function useParticipantRanking(pName, sessionCode, { pollMs = 12000 } = {}) {
  const [loadState, setLoadState] = useState('loading')
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    if (!pName || !sessionCode) return
    let cancelled = false
    const load = async () => {
      try {
        const nameFilter = `session_code=eq.${encodeURIComponent(sessionCode)}&collaborateur=eq.${encodeURIComponent(pName)}&limit=1`
        const nameFilterOA = `session_code=eq.${encodeURIComponent(sessionCode)}&participant_name=eq.${encodeURIComponent(pName)}&limit=1`
        const [quizRows, moduleRows, openRows, withRanks] = await Promise.all([
          sbSelect('quiz_answers', nameFilter),
          sbSelect('module_results', nameFilter),
          sbSelect('open_answers', nameFilterOA),
          fetchParticipantRanking(sessionCode),
        ])
        if (cancelled) return
        const hasAnyActivity = (quizRows?.length || 0) + (moduleRows?.length || 0) + (openRows?.length || 0) > 0
        const final = withRanks.find(r => r.name === pName)
          ? withRanks
          : [...withRanks, { name: pName, correct: 0, points: 0, rank: withRanks.length + 1 }]
        setRanking(final)
        setLoadState(hasAnyActivity ? 'dashboard' : 'welcome')
      } catch {
        if (!cancelled) setLoadState('welcome')
      }
    }
    load()
    const t = setInterval(load, pollMs)
    return () => { cancelled = true; clearInterval(t) }
  }, [pName, sessionCode, pollMs])

  const myEntry = ranking.find(r => r.name === pName)
  return { loadState, ranking, myEntry }
}

function ParticipantDashboard({ pName, sessionCode }) {
  const { loadState, ranking, myEntry } = useParticipantRanking(pName, sessionCode)

  if (loadState === 'loading') return <WaitingScreen />
  if (loadState === 'welcome') return <WelcomeScreenFirst pName={pName} />
  return <DashboardScreen pName={pName} myEntry={myEntry} ranking={ranking} />
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
      <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
        {moduleLabel}
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
    let rows
    try {
      rows = await sbSelect('quiz_answers', `session_code=eq.${getParticipantSessionCode()}&module_id=eq.${moduleId}`)
    } catch { return }
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
      minHeight: '100dvh',
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

// ── Minuteur de question — 1min30 max, au-delà les traîneurs se
// consultaient/cherchaient la réponse au lieu de répondre seuls ───────
const QUIZ_TIME_LIMIT_SEC = 90

function useQuizCountdown({ seconds = QUIZ_TIME_LIMIT_SEC, onExpire, enabled }) {
  const [remaining, setRemaining] = useState(seconds)
  // Ref plutôt que dépendance d'effet : onExpire capture souvent des états
  // qui changent à chaque frappe (texte, sélection...) — on veut toujours
  // appeler la version la plus récente sans redémarrer le minuteur.
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    if (!enabled) { setRemaining(seconds); return }
    let fired = false
    setRemaining(seconds)
    const start = Date.now()
    const t = setInterval(() => {
      const left = Math.max(0, seconds - Math.floor((Date.now() - start) / 1000))
      setRemaining(left)
      if (left <= 0 && !fired) {
        fired = true
        onExpireRef.current?.()
      }
    }, 250)
    return () => clearInterval(t)
  }, [enabled, seconds])

  return remaining
}

function QuizCountdownBadge({ remaining }) {
  const urgent = remaining <= 15
  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: urgent ? 'rgba(239,68,68,0.18)' : 'rgba(255,255,255,0.08)',
      border: `1px solid ${urgent ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
      borderRadius: 20, padding: '5px 12px', marginBottom: 14,
      fontSize: 13, fontWeight: 800, color: urgent ? '#f87171' : 'rgba(255,255,255,0.7)',
      fontVariantNumeric: 'tabular-nums', animation: urgent ? 'quizTimerPulse 1s ease-in-out infinite' : 'none',
    }}>
      ⏱ {mm}:{ss}
      <style>{`@keyframes quizTimerPulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
    </div>
  )
}

// Variante compacte pour les en-têtes clairs (pavé numérique / saisie interactive)
function QuizHeaderTimer({ remaining }) {
  const urgent = remaining <= 15
  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')
  return (
    <div style={{
      background: urgent ? '#dc2626' : 'rgba(0,0,0,0.2)',
      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff',
      fontVariantNumeric: 'tabular-nums', animation: urgent ? 'quizTimerPulse 1s ease-in-out infinite' : 'none',
    }}>
      ⏱ {mm}:{ss}
      <style>{`@keyframes quizTimerPulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
    </div>
  )
}

// ── Anti re-réponse après rafraîchissement ─────────────────────────
// Sans ce contrôle au montage, un formé qui recharge la page pendant une
// question retombe sur un écran vierge et peut répondre une deuxième fois
// (voire changer sa réponse) après avoir déjà vu le résultat. On revérifie
// donc toujours en base avant d'afficher la question.
function QuizChecking() {
  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.15)', borderTop: '3px solid #00abe9', borderRadius: '50%', animation: 'quizSpin 1s linear infinite' }} />
      <style>{`@keyframes quizSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// Questions à réponse directe (QCM, multi-sélection, ordonnance, puissances) :
// une seule ligne quiz_answers par (session, module, question, formé).
function useExistingQuizAnswer({ moduleId, qIdx, pName }) {
  const [checking, setChecking] = useState(true)
  const [existing, setExisting] = useState(null)
  useEffect(() => {
    let cancelled = false
    const name = (pName || '').trim()
    if (!name) { setChecking(false); return }
    ;(async () => {
      try {
        const rows = await sbSelect(
          'quiz_answers',
          `session_code=eq.${getParticipantSessionCode()}&module_id=eq.${encodeURIComponent(moduleId)}&question_idx=eq.${qIdx}&collaborateur=eq.${encodeURIComponent(name)}`
        )
        if (!cancelled && rows && rows.length > 0) setExisting(rows[0])
      } catch { /* best-effort */ } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => { cancelled = true }
  }, [moduleId, qIdx, pName])
  return { checking, existing }
}

// Questions texte libre : la réponse part dans open_answers en attendant la
// validation manuelle du formateur, qui écrit ensuite dans quiz_answers.
function useExistingOpenAnswer({ moduleId, qIdx, pName }) {
  const [checking, setChecking] = useState(true)
  const [validated, setValidated] = useState(null)
  const [wasSubmitted, setWasSubmitted] = useState(false)
  useEffect(() => {
    let cancelled = false
    const name = (pName || '').trim()
    if (!name) { setChecking(false); return }
    ;(async () => {
      try {
        const [qRows, oRows] = await Promise.all([
          sbSelect('quiz_answers', `session_code=eq.${getParticipantSessionCode()}&module_id=eq.${encodeURIComponent(moduleId)}&question_idx=eq.${qIdx}&collaborateur=eq.${encodeURIComponent(name)}`),
          sbSelect('open_answers', `session_code=eq.${getParticipantSessionCode()}&page_id=eq.${encodeURIComponent(`${moduleId}:${qIdx}`)}&participant_name=eq.${encodeURIComponent(name)}`),
        ])
        if (cancelled) return
        if (qRows && qRows.length > 0) setValidated(qRows[0].is_correct)
        else if (oRows && oRows.length > 0) setWasSubmitted(true)
      } catch { /* best-effort */ } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => { cancelled = true }
  }, [moduleId, qIdx, pName])
  return { checking, validated, wasSubmitted }
}

// ── Réponse résultat partagé ──────────────────────────────────────
// Podium interstitiel toutes les 5 questions supprimé (bugs) — à la place,
// chaque formé voit ici, uniquement sur son propre téléphone, son classement
// en temps réel sur ce quiz (classement final toujours affiché à tous en fin
// de module, cf. TVQuizFinalPodium).
function QuizResultScreen({ isCorrect, pName, moduleId }) {
  const [rankInfo, setRankInfo] = useState(null) // { rank, total }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const code = getParticipantSessionCode()
        const rows = await sbSelect('quiz_answers', `session_code=eq.${encodeURIComponent(code)}&module_id=eq.${encodeURIComponent(moduleId)}`)
        // Dédoublonne par formé+question (garde la ligne la plus récente)
        const latest = {}
        for (const r of rows || []) {
          if (!r.collaborateur) continue
          const key = `${r.collaborateur}__${r.question_idx}`
          if (!latest[key] || (r.id ?? 0) > (latest[key].id ?? 0)) latest[key] = r
        }
        const scoreByName = {}
        for (const r of Object.values(latest)) {
          if (!(r.collaborateur in scoreByName)) scoreByName[r.collaborateur] = 0
          if (r.is_correct) scoreByName[r.collaborateur]++
        }
        const sorted = Object.entries(scoreByName)
          .map(([name, score]) => ({ name, score }))
          .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        let rk = 1
        for (let i = 0; i < sorted.length; i++) {
          if (i > 0 && sorted[i].score !== sorted[i - 1].score) rk = i + 1
          sorted[i].rank = rk
        }
        const me = sorted.find(r => normalizeNameKey(r.name) === normalizeNameKey(pName || ''))
        if (!cancelled) setRankInfo(me ? { rank: me.rank, total: sorted.length } : null)
      } catch { /* ignore */ }
    }
    load()
    return () => { cancelled = true }
  }, [isCorrect, pName, moduleId])

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
      {rankInfo && (
        <div style={{
          marginTop: 8, marginBottom: 12,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16, padding: '12px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        }}>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
            Ton classement
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#00abe9' }}>
            {rankInfo.rank}<span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{rankInfo.rank === 1 ? 'er' : 'e'} / {rankInfo.total}</span>
          </div>
        </div>
      )}
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>En attente de la prochaine question…</div>
    </div>
  )
}

// ── Quiz texte libre ──────────────────────────────────────────────
function QuizTextOpen({ pName, q, qIdx, moduleId }) {
  const { checking, validated: existingValidated, wasSubmitted } = useExistingOpenAnswer({ moduleId, qIdx, pName })
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validated, setValidated] = useState(null) // null | true | false
  const effectiveSubmitted = submitted || wasSubmitted
  const effectiveValidated = validated !== null ? validated : existingValidated

  useEffect(() => {
    if (!effectiveSubmitted) return
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
  }, [effectiveSubmitted, qIdx, moduleId, pName])

  const handleSubmit = async (force = false) => {
    if ((!text.trim() && !force) || saving || submitted) return
    setSaving(true)
    try {
      await insertOpenAnswer({
        sessionCode: getParticipantSessionCode(),
        pageId: `${moduleId}:${qIdx}`,
        participantName: pName.trim(),
        answer: text.trim(),
      })
      setSubmitted(true)
    } catch { /* best-effort */ } finally {
      setSaving(false)
    }
  }

  const remaining = useQuizCountdown({ onExpire: () => handleSubmit(true), enabled: !checking && effectiveValidated === null && !effectiveSubmitted })

  if (checking) return <QuizChecking />
  if (effectiveValidated !== null) return <QuizResultScreen isCorrect={effectiveValidated} pName={pName} moduleId={moduleId} />

  if (effectiveSubmitted) {
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
      <QuizCountdownBadge remaining={remaining} />
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
      <button onClick={() => handleSubmit()} disabled={!text.trim() || saving} style={{
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

// ── Quiz texte libre à plusieurs cases (ex: "citez les 5 éléments") ──
function QuizTextOpenMulti({ pName, q, qIdx, moduleId }) {
  const fieldsCount = q.fields || 5
  const { checking, validated: existingValidated, wasSubmitted } = useExistingOpenAnswer({ moduleId, qIdx, pName })
  const [values, setValues] = useState(Array(fieldsCount).fill(''))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validated, setValidated] = useState(null) // null | true | false
  const effectiveSubmitted = submitted || wasSubmitted
  const effectiveValidated = validated !== null ? validated : existingValidated

  useEffect(() => {
    if (!effectiveSubmitted) return
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
  }, [effectiveSubmitted, qIdx, moduleId, pName])

  const setField = (i, val) => setValues(vs => vs.map((v, idx) => idx === i ? val : v))
  const allFilled = values.every(v => v.trim())

  const handleSubmit = async (force = false) => {
    if ((!allFilled && !force) || saving || submitted) return
    setSaving(true)
    try {
      await insertOpenAnswer({
        sessionCode: getParticipantSessionCode(),
        pageId: `${moduleId}:${qIdx}`,
        participantName: pName.trim(),
        answer: values.map(v => v.trim()).join('||'),
      })
      setSubmitted(true)
    } catch { /* best-effort */ } finally {
      setSaving(false)
    }
  }

  const remaining = useQuizCountdown({ onExpire: () => handleSubmit(true), enabled: !checking && effectiveValidated === null && !effectiveSubmitted })

  if (checking) return <QuizChecking />
  if (effectiveValidated !== null) return <QuizResultScreen isCorrect={effectiveValidated} pName={pName} moduleId={moduleId} />

  if (effectiveSubmitted) {
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
      <QuizCountdownBadge remaining={remaining} />
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24,
      }}>Question {qIdx + 1}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, textAlign: 'center' }}>
        Regardez la question sur l&apos;écran<br />et remplissez les {fieldsCount} cases
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 400, marginBottom: 24 }}>
        {values.map((val, i) => (
          <div key={i}>
            {q.fieldLabels?.[i] && (
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{q.fieldLabels[i]}</div>
            )}
            <input
              value={val}
              onChange={e => setField(i, e.target.value)}
              placeholder={q.fieldLabels?.[i] || `Élément ${i + 1}`}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 15, fontFamily: 'inherit', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>
        ))}
      </div>
      <button onClick={() => handleSubmit()} disabled={!allFilled || saving} style={{
        background: allFilled ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.08)',
        border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: allFilled ? 'pointer' : 'default',
        fontFamily: 'inherit', width: '100%', maxWidth: 400,
      }}>
        {saving ? 'Envoi…' : '✓ Envoyer'}
      </button>
    </div>
  )
}

// ── Quiz texte libre — paires (problème / définition) ─────────────
function QuizTextOpenPairs({ pName, q, qIdx, moduleId }) {
  const pairsCount = q.pairs || 4
  const [labelLeft, labelRight] = q.pairLabels || ['Élément', 'Détail']
  const { checking, validated: existingValidated, wasSubmitted } = useExistingOpenAnswer({ moduleId, qIdx, pName })
  const [rows, setRows] = useState(Array.from({ length: pairsCount }, () => ['', '']))
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validated, setValidated] = useState(null)
  const effectiveSubmitted = submitted || wasSubmitted
  const effectiveValidated = validated !== null ? validated : existingValidated

  useEffect(() => {
    if (!effectiveSubmitted) return
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
  }, [effectiveSubmitted, qIdx, moduleId, pName])

  const setCell = (rowIdx, colIdx, val) => setRows(rs => rs.map((r, i) => i === rowIdx ? (colIdx === 0 ? [val, r[1]] : [r[0], val]) : r))
  const allFilled = rows.every(r => r[0].trim() && r[1].trim())

  const handleSubmit = async (force = false) => {
    if ((!allFilled && !force) || saving || submitted) return
    setSaving(true)
    try {
      await insertOpenAnswer({
        sessionCode: getParticipantSessionCode(),
        pageId: `${moduleId}:${qIdx}`,
        participantName: pName.trim(),
        answer: rows.flatMap(r => [r[0].trim(), r[1].trim()]).join('||'),
      })
      setSubmitted(true)
    } catch { /* best-effort */ } finally {
      setSaving(false)
    }
  }

  const remaining = useQuizCountdown({ onExpire: () => handleSubmit(true), enabled: !checking && effectiveValidated === null && !effectiveSubmitted })

  if (checking) return <QuizChecking />
  if (effectiveValidated !== null) return <QuizResultScreen isCorrect={effectiveValidated} pName={pName} moduleId={moduleId} />

  if (effectiveSubmitted) {
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
      <QuizCountdownBadge remaining={remaining} />
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
      }}>Question {qIdx + 1}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20, textAlign: 'center' }}>
        Regardez la question sur l&apos;écran<br />et remplissez les {pairsCount} lignes
      </div>
      <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 420, marginBottom: 6 }}>
        <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{labelLeft}</div>
        <div style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{labelRight}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 420, marginBottom: 24 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <input
              value={r[0]}
              onChange={e => setCell(i, 0, e.target.value)}
              placeholder={`${labelLeft} ${i + 1}`}
              style={{
                flex: 1, padding: '13px 14px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', minWidth: 0,
              }}
            />
            <input
              value={r[1]}
              onChange={e => setCell(i, 1, e.target.value)}
              placeholder={`${labelRight} ${i + 1}`}
              style={{
                flex: 1, padding: '13px 14px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)',
                color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', minWidth: 0,
              }}
            />
          </div>
        ))}
      </div>
      <button onClick={() => handleSubmit()} disabled={!allFilled || saving} style={{
        background: allFilled ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.08)',
        border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: allFilled ? 'pointer' : 'default',
        fontFamily: 'inherit', width: '100%', maxWidth: 400,
      }}>
        {saving ? 'Envoi…' : '✓ Envoyer'}
      </button>
    </div>
  )
}

// ── Quiz multi-sélection ──────────────────────────────────────────
function QuizMultiSelect({ pName, q, qIdx, moduleId }) {
  const { checking, existing } = useExistingQuizAnswer({ moduleId, qIdx, pName })
  const [selected, setSelected] = useState([])
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [saving, setSaving] = useState(false)

  const requiredCount = q?.correct?.length || 2
  const readyToSubmit = selected.length === requiredCount

  const toggle = (i) => {
    if (answered) return
    setSelected(s => s.includes(i) ? s.filter(x => x !== i) : [...s, i])
  }

  const handleSubmit = async (force = false) => {
    if ((!readyToSubmit && !force) || saving || answered) return
    if (!q?.correct) return
    setSaving(true)
    try {
      const correctArr = [...q.correct].sort()
      const selectedSorted = [...selected].sort()
      const ok = JSON.stringify(correctArr) === JSON.stringify(selectedSorted)
      const answerIdx = selectedSorted[0] ?? -1
      await saveModuleQuizAnswer({
        sessionCode: getParticipantSessionCode(),
        moduleId, questionIdx: qIdx,
        collaborateur: pName.trim(),
        answerIdx, isCorrect: ok,
      })
      setIsCorrect(ok)
      setAnswered(true)
    } catch (e) {
      console.error('QuizMultiSelect save error', e)
    } finally {
      setSaving(false)
    }
  }

  const remaining = useQuizCountdown({ onExpire: () => handleSubmit(true), enabled: !checking && !existing && !answered })

  if (checking) return <QuizChecking />
  if (existing) return <QuizResultScreen isCorrect={existing.is_correct} pName={pName} moduleId={moduleId} />
  if (answered && isCorrect !== null) return <QuizResultScreen isCorrect={isCorrect} pName={pName} moduleId={moduleId} />

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <QuizCountdownBadge remaining={remaining} />
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16,
      }}>Question {qIdx + 1}</div>
      {q.instruction && (
        <div style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 24, textAlign: 'center' }}>{q.instruction}</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400, marginBottom: 24 }}>
        {(q?.options || []).map((opt, i) => {
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
      {!readyToSubmit && (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 10, textAlign: 'center' }}>
          Sélectionnez {requiredCount} réponse{requiredCount > 1 ? 's' : ''} ({selected.length} / {requiredCount})
        </div>
      )}
      <button onClick={() => handleSubmit()} disabled={!readyToSubmit || saving} style={{
        background: readyToSubmit ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.08)',
        border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16,
        fontSize: 16, fontWeight: 700, cursor: readyToSubmit ? 'pointer' : 'default',
        fontFamily: 'inherit', width: '100%', maxWidth: 400,
      }}>
        {saving ? 'Envoi…' : '✓ Valider ma sélection'}
      </button>
    </div>
  )
}

// ── Quiz remplir ordonnance (pavé numérique, même design que la saisie interactive) ──
function parseOrdoVal(str) {
  if (!str) return null
  return parseFloat(str.replace(',', '.'))
}

// Même design/système de saisie que la saisie interactive (Bases de l'optique) :
// pavé numérique tap-to-type au lieu de la molette (ValueBox/ValueNumpad,
// définis plus bas dans ce fichier, avant le composant SaisieInteractiveMobile).
function QuizOrdonnanceFill({ pName, q, qIdx, moduleId }) {
  const { checking, existing } = useExistingQuizAnswer({ moduleId, qIdx, pName })
  if (!q?.ordonnance?.od || !q?.ordonnance?.og) return null
  const hasCyl = !!(q.ordonnance.od.cyl || q.ordonnance.og.cyl)

  const initVals = () => ({
    od: { sph: 0, cyl: 0, axe: 0, add: 0 },
    og: { sph: 0, cyl: 0, axe: 0, add: 0 },
  })

  const [vals, setVals] = useState(initVals)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState(null)
  const [saving, setSaving] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [activeField, setActiveField] = useState(null) // null | { eye:'od'|'og', field:'sph'|'cyl'|'axe'|'add' }
  // Le bouton "✓" du pavé numérique se trouve pile à l'endroit où apparaît
  // le bouton "Valider" une fois le pavé refermé — un tap un peu long sur le
  // "✓" du pavé pouvait donc valider la réponse par erreur, avec une seule
  // valeur remplie. On ignore les taps sur "Valider" juste après la
  // fermeture du pavé, le temps que l'utilisateur relâche vraiment.
  const numpadClosedAtRef = useRef(0)

  const setField = (eye, field, val) => {
    if (showResult) return
    setVals(prev => ({ ...prev, [eye]: { ...prev[eye], [field]: val } }))
  }

  const near = (a, b) => Math.abs(a - b) < 0.001

  const verify = async (force = false) => {
    if (saving) return
    if (!force && Date.now() - numpadClosedAtRef.current < 500) return
    const od = q.ordonnance.od
    const og = q.ordonnance.og
    const r = {
      od: {
        sph: near(vals.od.sph, parseOrdoVal(od.sph) ?? 0),
        cyl: !hasCyl || near(vals.od.cyl, parseOrdoVal(od.cyl) ?? 0),
        axe: !hasCyl || Math.round(vals.od.axe) === (parseInt(od.axe) || 0),
        add: near(vals.od.add, parseOrdoVal(od.add) ?? 0),
      },
      og: {
        sph: near(vals.og.sph, parseOrdoVal(og.sph) ?? 0),
        cyl: !hasCyl || near(vals.og.cyl, parseOrdoVal(og.cyl) ?? 0),
        axe: !hasCyl || Math.round(vals.og.axe) === (parseInt(og.axe) || 0),
        add: near(vals.og.add, parseOrdoVal(og.add) ?? 0),
      },
    }
    setResults(r)
    setShowResult(true)
    const fields = [r.od.sph, r.od.cyl, r.od.axe, r.od.add, r.og.sph, r.og.cyl, r.og.axe, r.og.add]
    const perfect = fields.every(Boolean)
    setSaving(true)
    try {
      await saveModuleQuizAnswer({
        sessionCode: getParticipantSessionCode(),
        moduleId, questionIdx: qIdx,
        collaborateur: pName.trim(),
        answerIdx: 0, isCorrect: perfect,
      })
      setIsCorrect(perfect)
      setAnswered(true)
    } catch { /* best-effort */ } finally {
      setSaving(false)
    }
  }

  const remaining = useQuizCountdown({ onExpire: () => verify(true), enabled: !checking && !existing && !answered })

  if (checking) return <QuizChecking />
  if (existing) return <QuizResultScreen isCorrect={existing.is_correct} pName={pName} moduleId={moduleId} />
  if (answered && isCorrect !== null) return <QuizResultScreen isCorrect={isCorrect} pName={pName} moduleId={moduleId} />

  const corrLabel = {
    od: {
      sph: fmtDiop(parseOrdoVal(q.ordonnance.od.sph) ?? 0),
      cyl: hasCyl ? fmtDiop(parseOrdoVal(q.ordonnance.od.cyl) ?? 0) : '',
      axe: hasCyl ? fmtAxe(parseInt(q.ordonnance.od.axe) || 0) : '',
      add: fmtAdd(parseOrdoVal(q.ordonnance.od.add) ?? 0),
    },
    og: {
      sph: fmtDiop(parseOrdoVal(q.ordonnance.og.sph) ?? 0),
      cyl: hasCyl ? fmtDiop(parseOrdoVal(q.ordonnance.og.cyl) ?? 0) : '',
      axe: hasCyl ? fmtAxe(parseInt(q.ordonnance.og.axe) || 0) : '',
      add: fmtAdd(parseOrdoVal(q.ordonnance.og.add) ?? 0),
    },
  }

  const openNumpad = (eye, field) => {
    if (showResult) return
    setActiveField({ eye, field })
  }
  const activeValue = !activeField ? 0 : vals[activeField.eye][activeField.field]
  const eyeLabel = (eye) => eye === 'od' ? 'Œil droit' : 'Œil gauche'
  const numpadConfig = !activeField ? null
    : activeField.field === 'axe' ? { title: `Axe — ${eyeLabel(activeField.eye)} (0° – 180°)`, mode: 'degrees', max: 180 }
    : activeField.field === 'add' ? { title: `Add — ${eyeLabel(activeField.eye)}`, mode: 'diopter-positive', max: 4 }
    : { title: `${activeField.field === 'sph' ? 'Sphère' : 'Cylindre'} — ${eyeLabel(activeField.eye)}`, mode: 'diopter-signed', max: 8 }

  const rows = [
    { key: 'sph', label: 'Sphère',   mode: 'diopter-signed',   show: true },
    { key: 'cyl', label: 'Cylindre', mode: 'diopter-signed',   show: hasCyl },
    { key: 'axe', label: 'Axe',      mode: 'degrees',          show: hasCyl },
    { key: 'add', label: 'Add',      mode: 'diopter-positive', show: true },
  ].filter(r => r.show)

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: APP_BG, display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* Header doré */}
      <div style={{ background: APP_GOLD, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={52} height={18} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', flex: 1, textAlign: 'center' }}>Saisir l&apos;ordonnance</span>
        <QuizHeaderTimer remaining={remaining} />
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>Q{qIdx + 1}</div>
      </div>

      {/* Corps scrollable */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 8px' }}>
        <div style={{ fontSize: 12, color: '#666', fontWeight: 600, textAlign: 'center', marginBottom: 16 }}>
          Regardez l&apos;ordonnance sur l&apos;écran et saisissez les valeurs
        </div>

        {/* En-têtes colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 10, marginBottom: 8 }}>
          <div />
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#666', fontStyle: 'italic' }}>Œil droit</div>
          <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#666', fontStyle: 'italic' }}>Œil gauche</div>
        </div>

        {rows.map(row => (
          <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>{row.label}</div>
            <ValueBox value={vals.od[row.key]} mode={row.mode} locked={showResult} isCorrect={results?.od?.[row.key]} showResult={showResult} correctLabel={corrLabel.od[row.key]} onClick={() => openNumpad('od', row.key)} />
            <ValueBox value={vals.og[row.key]} mode={row.mode} locked={showResult} isCorrect={results?.og?.[row.key]} showResult={showResult} correctLabel={corrLabel.og[row.key]} onClick={() => openNumpad('og', row.key)} />
          </div>
        ))}
      </div>

      {/* Footer — bouton bien séparé de la grille et du pavé numérique (au-dessus,
          en position fixe) pour qu'un tap sur "✓" du pavé ne valide pas par erreur */}
      <div style={{ padding: '40px 14px 36px', background: APP_BG, flexShrink: 0, borderTop: `1px solid ${APP_GOLD}33` }}>
        <button
          onClick={() => verify()}
          disabled={saving}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: saving ? '#ccc' : APP_GOLD,
            border: 'none', color: '#fff',
            fontSize: 16, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
            fontFamily: 'inherit', letterSpacing: 0.5,
          }}
        >
          {saving ? 'Enregistrement…' : '✓ Valider'}
        </button>
      </div>

      {/* Pavé numérique — saisie manuelle du champ actif */}
      {activeField && numpadConfig && (
        <ValueNumpad
          title={numpadConfig.title}
          mode={numpadConfig.mode}
          max={numpadConfig.max}
          currentValue={activeValue}
          onConfirm={v => { setField(activeField.eye, activeField.field, v); setActiveField(null); numpadClosedAtRef.current = Date.now() }}
          onClose={() => { setActiveField(null); numpadClosedAtRef.current = Date.now() }}
        />
      )}
    </div>
  )
}

// ── Quiz sélecteur de puissances (roulettes, comme la saisie d'ordonnance) ──
// Va jusqu'à ±30 (au lieu de ±8) : la vraie limite (7,25 / −8,00) doit être
// trouvée par le formé au milieu d'une plage bien plus large, pas devinée
// parce que la roulette s'arrête pile à la bonne valeur.
const SPH_POS_MAX_VALS = Array.from({ length: 121 }, (_, i) => {
  const v = parseFloat((i * 0.25).toFixed(3))
  return { val: v, label: v > 0.001 ? `+${v.toFixed(2).replace('.', ',')}` : '0,00' }
})
const SPH_NEG_MAX_VALS = Array.from({ length: 121 }, (_, i) => {
  const v = parseFloat((-i * 0.25).toFixed(3))
  return { val: v, label: v < -0.001 ? `−${Math.abs(v).toFixed(2).replace('.', ',')}` : '0,00' }
})

function QuizPowerSelector({ pName, q, qIdx, moduleId }) {
  const { checking, existing } = useExistingQuizAnswer({ moduleId, qIdx, pName })
  const [posIdx, setPosIdx] = useState(0)
  const [negIdx, setNegIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [isCorrect, setIsCorrect] = useState(null)
  const [saving, setSaving] = useState(false)

  const near = (a, b) => Math.abs(a - b) < 0.001

  const handleSubmit = async () => {
    if (saving) return
    setSaving(true)
    const ok = near(SPH_POS_MAX_VALS[posIdx].val, q.correctPosVal) && near(SPH_NEG_MAX_VALS[negIdx].val, q.correctNegVal)
    try {
      await saveModuleQuizAnswer({
        sessionCode: getParticipantSessionCode(),
        moduleId, questionIdx: qIdx,
        collaborateur: pName.trim(),
        answerIdx: 0, isCorrect: ok,
      })
      setIsCorrect(ok)
      setAnswered(true)
    } catch { /* best-effort */ } finally {
      setSaving(false)
    }
  }

  const remaining = useQuizCountdown({ onExpire: handleSubmit, enabled: !checking && !existing && !answered })

  if (checking) return <QuizChecking />
  if (existing) return <QuizResultScreen isCorrect={existing.is_correct} pName={pName} moduleId={moduleId} />
  if (answered && isCorrect !== null) return <QuizResultScreen isCorrect={isCorrect} pName={pName} moduleId={moduleId} />

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: APP_BG, display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>
      {/* Header doré */}
      <div style={{ background: APP_GOLD, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={52} height={18} style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <span style={{ fontSize: 15, fontWeight: 800, color: '#fff', flex: 1, textAlign: 'center' }}>Puissances maximales</span>
        <QuizHeaderTimer remaining={remaining} />
        <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff' }}>Q{qIdx + 1}</div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '28px 20px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: '#666', fontWeight: 600, textAlign: 'center', marginBottom: 28 }}>
          Regardez la question sur l&apos;écran<br />et faites défiler les roulettes
        </div>

        <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 360 }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Positif max</div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${APP_GOLD}88`, overflow: 'hidden' }}>
              <WheelPicker values={SPH_POS_MAX_VALS} selectedIdx={posIdx} onChange={setPosIdx} showResult={false} />
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Négatif max</div>
            <div style={{ background: '#fff', borderRadius: 10, border: `1.5px solid ${APP_GOLD}88`, overflow: 'hidden' }}>
              <WheelPicker values={SPH_NEG_MAX_VALS} selectedIdx={negIdx} onChange={setNegIdx} showResult={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px 36px', background: APP_BG, flexShrink: 0, borderTop: `1px solid ${APP_GOLD}33` }}>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: saving ? '#ccc' : APP_GOLD,
            border: 'none', color: '#fff',
            fontSize: 16, fontWeight: 800, cursor: saving ? 'default' : 'pointer',
            fontFamily: 'inherit', letterSpacing: 0.5,
          }}
        >
          {saving ? 'Enregistrement…' : '✓ Valider'}
        </button>
      </div>
    </div>
  )
}

// Écran réponse pour UNE question — s'affiche sur le téléphone
// La question est sur la TV, le participant répond ici
// QCM standard (ordonnance sur TV comptent aussi comme qcm-ordonnance)
function QuizQCMAnswer({ pName, q, qIdx, quiz, moduleId }) {
  const { checking, existing } = useExistingQuizAnswer({ moduleId, qIdx, pName })
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

  const remaining = useQuizCountdown({ onExpire: () => handleAnswer(-1), enabled: !checking && !existing && !answered })

  if (checking) return <QuizChecking />
  if (existing) return <QuizResultScreen isCorrect={existing.is_correct} pName={pName} moduleId={moduleId} />
  if (answered) return <QuizResultScreen isCorrect={lastIsCorrect} pName={pName} moduleId={moduleId} />

  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <QuizCountdownBadge remaining={remaining} />
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
        {(q?.options || []).map((opt, i) => (
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
  if (type === 'text-open-multi') return <QuizTextOpenMulti pName={pName} q={q} qIdx={qIdx} moduleId={moduleId} />
  if (type === 'text-open-pairs') return <QuizTextOpenPairs pName={pName} q={q} qIdx={qIdx} moduleId={moduleId} />
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
    const name = pName || 'Anonyme'
    let lastCorrect = -1

    // Certaines questions (texte libre) ne sont validées par le formateur qu'après coup —
    // on re-sync tant que l'écran est ouvert pour que le score converge vers le vrai total.
    const sync = async () => {
      let data = []
      try {
        const rows = await sbSelect('quiz_answers', `session_code=eq.${getParticipantSessionCode()}&module_id=eq.${moduleId}&collaborateur=eq.${encodeURIComponent(name)}`)
        data = rows || []
        setAnswers(data)
      } catch { /* best-effort */ } finally {
        setLoading(false)
      }

      const totalCorrect = data.filter(r => r.is_correct).length
      if (totalCorrect === lastCorrect) return
      lastCorrect = totalCorrect

      // Sauvegarde module_results avec le score total réel (upsert pour éviter les doublons)
      // Règle unique de scoring : 10 points par bonne réponse (quiz ou hors quiz)
      const totalQ = quiz.length
      const earnedXP = totalCorrect * 10
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
    sync()
    const t = setInterval(sync, 3000)
    return () => clearInterval(t)
  }, [pName, moduleId, quiz.length])

  const answerMap = {}
  answers.forEach(row => { answerMap[row.question_idx] = row })
  const total = quiz.length
  const correct = answers.filter(r => r.is_correct).length
  const xp = correct * 10

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
          const chosenText = (chosenIdx != null && q.options) ? q.options[chosenIdx] : null
          const correctText = q.options
            ? (Array.isArray(q.correct) ? q.correct.map(i => q.options[i]).filter(Boolean).join(' + ') : q.options[q.correct])
            : (q.hint || null)

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
                  {!chosenText && row && isCorrect !== null && (
                    <div style={{ fontSize: 12, color: isCorrect ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                      {isCorrect ? '✅ Bonne réponse' : '❌ À retravailler'}
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
function OrdonnanceMobile({ page, pageIndex, total, ordoRevealStep }) {
  // Synchronisé avec le diffuseur : 0=tableau vide (juste les titres), 1=+sphère, 2=+cylindre+axe, 3=+addition
  const revealStep = ordoRevealStep ?? 0
  const showCard = (i) => i === 0 ? revealStep >= 1 : revealStep >= 2
  const cellVis = (row, col) => col === 0 ? revealStep >= 1 : revealStep >= 2
  const showAdd = revealStep >= 3

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
              opacity: showCard(i) ? 1 : 0,
              transform: showCard(i) ? 'translateY(0)' : 'translateY(12px)',
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

        {/* Phase 2 — Table (les titres de colonnes sont toujours visibles, seules les valeurs se dévoilent) */}
        <div style={{ marginTop: 8 }}>
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
            opacity: showAdd ? 1 : 0, transform: showAdd ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s ease',
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
function LptSanteIntroMobile({ page, pName }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    setSendError(false)
    try {
      const safeName = (pName || 'Anonyme').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_À-ɏ-]/g, '') || 'Anonyme'
      const key = `oa__${page.id}__${safeName}`
      const result = await setRoomSharedState(
        { [key]: { name: pName || 'Anonyme', answer: text.trim(), ts: Date.now() } },
        getParticipantSessionCode()
      )
      if (result != null) { setText(''); setSent(true) }
      else { setSendError(true); setTimeout(() => setSendError(false), 4000) }
    } finally { setSending(false) }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a1a 65%, #0d3b1a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 1.5 }}>LPT Santé</div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: '24px 24px 32px',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={90} height={90} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 24px rgba(77,184,92,0.4))' }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 6 }}>{page.titre}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>LPT Santé · Qu'est-ce que c'est pour vous ?</div>
        </div>

        {sent ? (
          <div style={{
            width: '100%', maxWidth: 420, padding: '20px 24px', borderRadius: 16,
            background: 'rgba(77,184,92,0.12)', border: '1px solid rgba(77,184,92,0.35)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#4db85c' }}>Réponse envoyée !</div>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 420 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Votre réponse
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Écrivez votre réponse…"
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.07)', border: sendError ? '1.5px solid #ef4444' : '1.5px solid rgba(255,255,255,0.12)',
                borderRadius: 14, padding: '14px 16px', resize: 'none',
                color: '#fff', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.5,
                outline: 'none', marginBottom: 12,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              style={{
                width: '100%', padding: '16px 0', borderRadius: 14,
                background: (text.trim() && !sending) ? 'linear-gradient(135deg, #2d7a3a, #4db85c)' : 'rgba(255,255,255,0.07)',
                border: 'none',
                color: (text.trim() && !sending) ? '#fff' : 'rgba(255,255,255,0.25)',
                fontSize: 15, fontWeight: 700, cursor: (text.trim() && !sending) ? 'pointer' : 'default',
                fontFamily: 'inherit',
                boxShadow: (text.trim() && !sending) ? '0 4px 20px rgba(77,184,92,0.3)' : 'none',
                transition: 'all .2s',
              }}
            >{sending ? '…' : sendError ? 'Erreur — réessayer' : 'Envoyer ma réponse'}</button>
          </div>
        )}
      </div>
    </div>
  )
}

function LptSantePecMobile() {
  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState(0)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  const tabs = [
    {
      label: '🔍 Test Suprême', color: '#00abe9',
      steps: [
        { icon: '🏥', text: 'Charger l\'AMO (Sécu)' },
        { icon: '🛡️', text: 'Charger l\'AMC (Mutuelle)' },
        { icon: '📋', text: 'Ajouter l\'ordonnance' },
        { icon: '⚙️', text: 'Générer le devis' },
        { icon: '📤', text: 'Envoyer → réponse immédiate ✅ ou ❌' },
      ],
    },
    {
      label: '🧾 Facturation', color: '#4db85c', sub: '1=1 ou Suprême',
      steps: [
        { icon: '🏥', text: 'Charger AMO + AMC' },
        { icon: '📂', text: 'Ouvrir Facturation' },
        { icon: '⌨️', text: 'Saisir le n° de commande (visible sur le tél. de vente)' },
        { icon: '📡', text: 'LPT Santé envoie la PEC' },
        { icon: '📱', text: 'Valider sur le téléphone de vente' },
      ],
    },
    {
      label: '⚡ TP Partiel', color: '#f59e0b', sub: 'Sans AMC',
      steps: [
        { icon: '🏥', text: 'Charger AMO uniquement (pas d\'AMC)' },
        { icon: '⌨️', text: 'Saisir le n° de commande' },
        { icon: '📡', text: 'LPT Santé envoie à la Sécu' },
        { icon: '💳', text: 'Le client avance la part AMC' },
        { icon: '📱', text: 'Valider sur le téléphone de vente' },
      ],
    },
  ]
  const active = tabs[tab]

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a1a 65%, #0d3b1a 100%)',
      display: 'flex', flexDirection: 'column', padding: '20px 20px 36px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={32} height={32} style={{ objectFit: 'contain' }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 1.5 }}>Prise en charge</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexShrink: 0 }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex: 1, padding: '7px 4px', borderRadius: 10, fontSize: 10, fontWeight: 800,
            background: i === tab ? `${t.color}20` : 'rgba(255,255,255,0.04)',
            border: `1px solid ${i === tab ? t.color + '60' : 'rgba(255,255,255,0.08)'}`,
            color: i === tab ? t.color : 'rgba(255,255,255,0.3)',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.3s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Steps */}
      <div style={{
        flex: 1, opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {active.sub && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontStyle: 'italic' }}>{active.sub}</div>
        )}
        {active.steps.map((s, i) => (
          <div key={`${tab}-${i}`} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${active.color}20`,
            borderLeft: `3px solid ${active.color}`,
            borderRadius: 12, padding: '12px 14px',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(10px)',
            transition: `all 0.45s cubic-bezier(0.22, 1, 0.36, 1) ${0.05 + i * 0.08}s`,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
              background: `${active.color}20`, border: `1px solid ${active.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>{s.icon}</div>
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: active.color, marginBottom: 2 }}>Étape {i + 1}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{s.text}</div>
            </div>
          </div>
        ))}

        {tab === 2 && (
          <div style={{
            marginTop: 4, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 11, color: '#f59e0b', fontWeight: 600, lineHeight: 1.6,
          }}>
            💡 Même manipulation que la facturation, mais sans charger la mutuelle. LPT Santé gère uniquement la part Sécurité Sociale.
          </div>
        )}
      </div>
    </div>
  )
}

function LptSanteExplicationMobile() {
  const [visible, setVisible] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t) }, [])

  const steps = [
    { icon: '🏪', color: '#00abe9', title: 'Le magasin crée des PEC', desc: 'Chaque vendeur enregistre les prises en charge dans LPT Santé tout au long de la journée.' },
    { icon: '⚡', color: '#4db85c', title: '5 min par prise en charge', desc: 'LPT Santé traite une PEC en 5 min. Chez les autres opticiens, il faut 30 min ou plus.' },
    { icon: '📡', color: '#a78bfa', title: 'Télétransmission chaque soir', desc: 'Chaque soir, LPT Santé envoie toutes les PEC à la Sécurité Sociale et aux mutuelles.' },
    { icon: '💰', color: '#f5c842', title: 'On est remboursés', desc: 'SS et mutuelles paient directement Lunettes Pour Tous — le client ne paie que son reste à charge.' },
  ]

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a1a 65%, #0d3b1a 100%)',
      display: 'flex', flexDirection: 'column', padding: '20px 20px 36px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={36} height={36} style={{ objectFit: 'contain' }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 1.5 }}>LPT Santé</div>
      </div>

      <div style={{
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.25, marginBottom: 6 }}>Comment ça marche ?</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8, lineHeight: 1.6 }}>
          LPT Santé est notre logiciel de tiers payant. Il nous permet de faire des lunettes <em style={{ color: 'rgba(255,255,255,0.65)' }}>plus vite que tout le monde</em>.
        </div>

        {steps.map((s, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `3px solid ${s.color}`, borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(12px)',
            transition: `all 0.5s cubic-bezier(0.22, 1, 0.36, 1) ${0.1 + i * 0.1}s`,
          }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          </div>
        ))}

        <div style={{
          marginTop: 8, background: 'rgba(77,184,92,0.08)', border: '1px solid rgba(77,184,92,0.2)',
          borderRadius: 12, padding: '12px 16px', textAlign: 'center',
          fontSize: 12, color: '#4db85c', fontWeight: 600,
        }}>
          Regardez l'animation sur le grand écran 📺
        </div>
      </div>
    </div>
  )
}

function MontageInfoMobile({ page }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '20px 20px 36px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: 20, flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5 }}>Le montage</div>
      </div>

      <div style={{
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          {page.icon && <span style={{ fontSize: 26 }}>{page.icon}</span>}
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', lineHeight: 1.25 }}>{page.titre}</div>
        </div>

        {(page.blocks || []).map((b, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: '3px solid #f59e0b', borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{b.desc}</div>
            </div>
          </div>
        ))}

        {page.footer && (
          page.footerStrong ? (
            <div style={{ marginTop: 6, textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.16), rgba(245,158,11,0.06))', border: '1.5px solid rgba(245,158,11,0.45)', borderRadius: 14, padding: '18px 16px', fontSize: 17, color: '#fff', fontWeight: 800, lineHeight: 1.4 }}>
              {page.footer}
            </div>
          ) : (
            <div style={{ marginTop: 4, background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.25)', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#00abe9', fontWeight: 700, lineHeight: 1.5 }}>
              {page.footer}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function PauseMobile({ page, pageIndex, total, pName }) {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState(false)

  useEffect(() => {
    setVisible(false)
    setText('')
    setSent(false)
    setSendError(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    setSendError(false)
    try {
      const safeName = (pName || 'Anonyme').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_À-ɏ-]/g, '') || 'Anonyme'
      const key = `oa__${page.id}__${safeName}`
      const result = await setRoomSharedState(
        { [key]: { name: pName || 'Anonyme', answer: text.trim(), ts: Date.now() } },
        getParticipantSessionCode()
      )
      if (result != null) {
        setText('')
        setSent(true)
        setTimeout(() => setSent(false), 2500)
      } else {
        setSendError(true)
        setTimeout(() => setSendError(false), 4000)
      }
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
        gap: 24, padding: '32px 16px 24px',
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

        <div style={{ textAlign: 'center', width: '100%', maxWidth: 340 }}>
          <div style={{
            fontSize: (page.titre || '').length > 28 ? 19 : 22, fontWeight: 900, color: '#fff',
            lineHeight: 1.3, marginBottom: 8, overflowWrap: 'break-word', wordBreak: 'normal',
          }}>
            {page.titre}
          </div>
          {page.sousTitre && (
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 400, lineHeight: 1.5, overflowWrap: 'break-word' }}>
              {page.sousTitre}
            </div>
          )}
        </div>

        {/* Zone de réponse — masquée sur les pages sans question réelle */}
        {!page.noAnswerBox && (
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
                : sendError
                  ? 'rgba(239,68,68,0.15)'
                  : (!text.trim() || sending)
                    ? 'rgba(255,255,255,0.07)'
                    : 'linear-gradient(135deg, #0070a0, #0089ba)',
              border: sent ? '1px solid rgba(74,222,128,0.4)' : sendError ? '1px solid rgba(239,68,68,0.4)' : 'none',
              color: sent ? '#4ade80' : sendError ? '#f87171' : (!text.trim() || sending) ? 'rgba(255,255,255,0.3)' : '#fff',
              boxShadow: (!text.trim() || sending || sent || sendError) ? 'none' : '0 4px 16px rgba(0,137,186,0.35)',
            }}
          >
            {sent ? '✓ Envoyée !' : sendError ? '✗ Erreur — réessayez' : sending ? '…' : 'Envoyer'}
          </button>
        </div>
        )}
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
  const [troublesRevealed, setTroublesRevealed] = useState([])

  // Le formateur présente les 4 troubles un par un sur le diffuseur — le
  // téléphone reste en attente pour ne pas distraire, et n'affiche le récap
  // complet (les 4 noms + définitions) qu'une fois tous révélés.
  useEffect(() => {
    setTroublesRevealed([])
    let cancelled = false
    const poll = async () => {
      try {
        const state = await getSharedState()
        if (!cancelled) setTroublesRevealed(state?.troubles_revealed || [])
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => { cancelled = true; clearInterval(t) }
  }, [page.id])

  const troubles = page.troubles || []
  const allDone = troubles.length > 0 && troublesRevealed.length >= troubles.length

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, #0d3b7a 100%)`,
      display: 'flex', flexDirection: 'column',
      padding: '0 0 24px', overflow: 'hidden',
    }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }`}</style>
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

      {!allDone ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>👁️</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            Regardez l&apos;écran, le formateur vous présente les troubles visuels un par un…
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '20px 16px 0', flex: 1 }}>
          {troubles.map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              background: `${t.color}09`,
              border: `1px solid ${t.color}28`,
              borderLeft: `4px solid ${t.color}`,
              borderRadius: 14, padding: '16px 18px',
              animation: 'fadeInUp 0.5s ease both',
              animationDelay: `${i * 0.12}s`,
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
      )}
    </div>
  )
}

// ── Saisie interactive — vue téléphone (style app LPT) ────────────
const APP_GOLD = '#c8a52a'
const APP_BG   = '#eae7f0'
const APP_DARK = '#2a2840'

// ── WheelPicker (roulette tactile) — utilisé par QuizPowerSelector ──
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

// ── Formatage valeurs saisie interactive / ordonnance (dioptrie, add, degrés) ──
const fmtDiop = (v) => {
  const a = Math.abs(v).toFixed(2).replace('.', ',')
  return v > 0.001 ? `+${a}` : v < -0.001 ? `−${a}` : '0,00'
}
const fmtAdd  = (v) => (v > 0.001 ? `+${v.toFixed(2).replace('.', ',')}` : '0,00')
const fmtAxe  = (v) => `${Math.round(v)}°`

// ── Pavé numérique générique (dioptrie signée, addition positive, ou degrés) ──
// Saisie 100% manuelle pour les dioptries : le formé tape lui-même chiffres,
// virgule et signe (comme sur une vraie ordonnance) — rien n'est inséré
// automatiquement à sa place. S'il ne met pas de signe, la valeur est positive.
function ValueNumpad({ title, mode, currentValue, max, onConfirm, onClose }) {
  const isDeg = mode === 'degrees'
  const isSigned = mode === 'diopter-signed'

  const [degDigits, setDegDigits] = useState(() => String(Math.max(0, Math.round(currentValue))))

  const initRaw = () => {
    if (!currentValue) return ''
    const abs = Math.abs(currentValue)
    const s = Number.isInteger(abs) ? String(abs) : String(abs).replace('.', ',')
    return (currentValue < 0 ? '-' : '') + s
  }
  const [raw, setRaw] = useState(initRaw)

  const addDegDigit = d => setDegDigits(p => { const s = p === '0' ? d : p + d; return parseInt(s) <= 180 ? s : p })
  const addDigit = d => setRaw(r => r + d)
  const addComma = () => setRaw(r => {
    if (r.includes(',')) return r
    return (r === '' || r === '-') ? `${r}0,` : `${r},`
  })
  const toggleSign = () => setRaw(r => r.startsWith('-') ? r.slice(1) : `-${r}`)
  const delChar = () => {
    if (isDeg) { setDegDigits(p => p.length <= 1 ? '0' : p.slice(0, -1)); return }
    setRaw(r => r.slice(0, -1))
  }
  const confirm = () => {
    if (isDeg) { onConfirm(Math.max(0, Math.min(180, parseInt(degDigits) || 0))); return }
    const parsed = parseFloat(raw.replace(',', '.')) || 0
    onConfirm(isSigned ? Math.max(-max, Math.min(max, parsed)) : Math.max(0, Math.min(max, parsed)))
  }

  const display = isDeg ? `${degDigits}°` : (raw === '' || raw === '-' ? `${raw}0` : raw)

  const keyStyle = (k) => ({
    padding: '15px 8px', borderRadius: 12, fontFamily: 'inherit', cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
    background: k === '✓' ? APP_GOLD : (k === '⌫' || k === '-' || k === ',') ? '#e0dcf0' : '#fff',
    border: '1px solid #ddd9ec',
    color: k === '✓' ? '#fff' : APP_DARK,
    fontSize: k === '✓' || k === '⌫' ? 20 : 22, fontWeight: 700,
  })

  const degreeKeys = ['1','2','3','4','5','6','7','8','9','⌫','0','✓']
  const diopterKeys = isSigned
    ? ['1','2','3','4','5','6','7','8','9','-','0',',','⌫','✓']
    : ['1','2','3','4','5','6','7','8','9','0',',','⌫','✓']

  const handleKey = (k) => {
    if (k === '⌫') return delChar()
    if (k === '✓') return confirm()
    if (k === '-') return toggleSign()
    if (k === ',') return addComma()
    return isDeg ? addDegDigit(k) : addDigit(k)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 99 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: APP_BG, borderRadius: '20px 20px 0 0', padding: '18px 18px 40px', boxShadow: '0 -8px 40px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#555' }}>{title}</span>
          <button onPointerDown={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888', padding: '2px 8px' }}>✕</button>
        </div>
        <div style={{ marginBottom: 14, background: '#fff', borderRadius: 12, padding: '12px 20px', fontSize: 30, fontWeight: 800, color: APP_DARK, textAlign: 'center', border: `2px solid ${APP_GOLD}`, fontVariantNumeric: 'tabular-nums' }}>
          {display}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {(isDeg ? degreeKeys : diopterKeys).map((k, i) => (
            <button key={`${k}-${i}`} onPointerDown={() => handleKey(k)} style={keyStyle(k)}>{k}</button>
          ))}
        </div>
      </div>
    </>
  )
}

// ── Case de valeur tappable (remplace le WheelPicker pour la saisie interactive) ──
function ValueBox({ value, mode, locked, isCorrect, showResult, correctLabel, onClick }) {
  const label = mode === 'degrees' ? fmtAxe(value) : mode === 'diopter-positive' ? fmtAdd(value) : fmtDiop(value)
  const bg     = showResult ? (isCorrect ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)') : '#fff'
  const border = showResult ? (isCorrect ? '#22c55e' : '#ef4444') : `${APP_GOLD}88`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <button
        onPointerDown={locked ? undefined : onClick}
        disabled={locked}
        style={{
          width: '100%', minHeight: 56, padding: '14px 8px', borderRadius: 14,
          background: bg, border: `2px solid ${border}`,
          fontSize: 19, fontWeight: 800, color: APP_DARK,
          fontFamily: 'inherit', cursor: locked ? 'default' : 'pointer',
          fontVariantNumeric: 'tabular-nums', WebkitTapHighlightColor: 'transparent',
        }}
      >{label}</button>
      {showResult && !isCorrect && (
        <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 700, textAlign: 'center' }}>✓ {correctLabel}</div>
      )}
    </div>
  )
}

const SAISIE_WRONG_MSG = "Ton client ne verra rien avec les corrections que tu as entrées !"

function SaisieInteractiveMobile({ page, pageIndex, total, pName, moduleId }) {
  // Valeurs brutes (dioptries/degrés) — plus d'indices dans un tableau de
  // molette : la saisie se fait maintenant au clavier numérique (cf. ValueNumpad).
  const initVals = () => ({
    od: { sph: 0, cyl: 0, axe: 0 },
    og: { sph: 0, cyl: 0, axe: 0 },
    add: 0,
  })

  const [stage, setStage] = useState('r1-entry')
  const round = (stage === 'r2-entry' || stage === 'r2-correction' || stage === 'done') ? 2 : 1
  const caseIndexes = (SAISIE_ROUNDS.find(r => r.round === round) || SAISIE_ROUNDS[0]).caseIndexes

  const [localCaseIdx, setLocalCaseIdx] = useState(0)
  const [vals, setVals] = useState(initVals)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState(null)
  const [activeField, setActiveField] = useState(null) // null | { eye:'od'|'og', field:'sph'|'cyl'|'axe' } | { eye:'add' }
  const [roundTally, setRoundTally] = useState({ correct: 0, total: 0 })
  const [roundDone, setRoundDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // Le bouton "✓" du pavé numérique se trouve pile à l'endroit où apparaît
  // le bouton "VÉRIFIER" une fois le pavé refermé — un tap un peu long sur
  // le "✓" du pavé pouvait donc valider par erreur. On ignore les taps sur
  // "VÉRIFIER" juste après la fermeture du pavé.
  const numpadClosedAtRef = useRef(0)

  // Poll l'étape globale pilotée par le formateur (round + correction en cours)
  useEffect(() => {
    let cancelled = false
    const poll = async () => {
      try {
        const state = await getRoomSharedState(getParticipantSessionCode())
        if (!cancelled) setStage(state?.saisie_stage || 'r1-entry')
      } catch { /* best-effort */ }
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  // Nouveau round → on repart de zéro sur les 3 nouveaux cas
  useEffect(() => {
    setLocalCaseIdx(0)
    setVals(initVals())
    setShowResult(false)
    setResults(null)
    setRoundTally({ correct: 0, total: 0 })
    setRoundDone(false)
  }, [round]) // eslint-disable-line react-hooks/exhaustive-deps

  const ex = SAISIE_EXERCISES[caseIndexes[localCaseIdx]]
  const isLastCase = localCaseIdx === caseIndexes.length - 1

  const setEye = (eye, field, val) => {
    if (showResult) return // verrouillé après vérification, aucune modification possible
    setVals(prev => ({ ...prev, [eye]: { ...prev[eye], [field]: val } }))
  }
  const setAdd = val => {
    if (showResult) return
    setVals(prev => ({ ...prev, add: val }))
  }

  const openNumpad = (eye, field) => {
    if (showResult) return
    setActiveField(field ? { eye, field } : { eye })
  }
  const activeValue = !activeField ? 0
    : activeField.eye === 'add' ? vals.add
    : vals[activeField.eye][activeField.field]
  const numpadConfig = !activeField ? null
    : activeField.eye === 'add' ? { title: 'Addition (Add)', mode: 'diopter-positive', max: 4 }
    : activeField.field === 'axe' ? { title: `Axe — ${activeField.eye === 'od' ? 'Œil droit' : 'Œil gauche'} (0° – 180°)`, mode: 'degrees', max: 180 }
    : { title: `${activeField.field === 'sph' ? 'Sphère' : 'Cylindre'} — ${activeField.eye === 'od' ? 'Œil droit' : 'Œil gauche'}`, mode: 'diopter-signed', max: 8 }

  const near = (a, b) => Math.abs(a - b) < 0.001

  const verify = () => {
    if (Date.now() - numpadClosedAtRef.current < 500) return
    const r = {
      od: {
        sph: near(vals.od.sph, ex.od.sphere),
        cyl: near(vals.od.cyl, ex.od.cylindre),
        axe: Math.round(vals.od.axe) === ex.od.axe,
      },
      og: {
        sph: near(vals.og.sph, ex.og.sphere),
        cyl: near(vals.og.cyl, ex.og.cylindre),
        axe: Math.round(vals.og.axe) === ex.og.axe,
      },
      // Une addition saisie alors qu'il n'y en a pas sur le cas est une erreur (comparaison à 0)
      add: near(vals.add, ex.add ?? 0),
    }
    setResults(r)
    setShowResult(true)
  }

  const totalFields = 7 // OD sph/cyl/axe + OG sph/cyl/axe + add (l'add compte toujours, y compris "doit rester à 0")
  const correctCount = results
    ? [results.od.sph, results.od.cyl, results.od.axe,
       results.og.sph, results.og.cyl, results.og.axe, results.add].filter(Boolean).length
    : 0
  const perfect = showResult && correctCount === totalFields

  const handleContinue = async () => {
    if (submitting) return
    // On compte par CAS (juste ou faux), pas par champ
    const newTally = { correct: roundTally.correct + (perfect ? 1 : 0), total: roundTally.total + 1 }
    if (!isLastCase) {
      setRoundTally(newTally)
      setLocalCaseIdx(i => i + 1)
      setVals(initVals())
      setShowResult(false)
      setResults(null)
      return
    }
    setSubmitting(true)
    try {
      const name = (pName || 'Anonyme').trim()
      await sbUpsert('module_results', {
        collaborateur: name,
        pin: generatePin(name),
        week_date: new Date().toISOString().slice(0, 10),
        module_id: `${moduleId || 'optique'}-saisie-r${round}`,
        score: newTally.correct,
        score_total: newTally.total,
        xp: newTally.correct * 10,
        completed_at: new Date().toISOString(),
      }, 'collaborateur,module_id,week_date')
    } catch (e) { console.error('[SaisieInteractive] submit', e) }
    setRoundTally(newTally)
    setRoundDone(true)
    setSubmitting(false)
  }

  // Une fois la réponse vérifiée, le cas reste verrouillé (aucune modification
  // possible, cf. setEye/setAdd) mais on n'enchaîne plus tout seul sur le cas
  // suivant : le formé doit avoir le temps de lire le message et clique
  // lui-même sur "Cas suivant" quand il est prêt.

  // Labels de la bonne réponse (pour feedback)
  const corrLabel = {
    od: { sph: fmtDiop(ex.od.sphere), cyl: fmtDiop(ex.od.cylindre), axe: fmtAxe(ex.od.axe) },
    og: { sph: fmtDiop(ex.og.sphere), cyl: fmtDiop(ex.og.cylindre), axe: fmtAxe(ex.og.axe) },
    add: fmtAdd(ex.add ?? 0),
  }

  // ── Écran d'attente une fois les 3 cas du round envoyés ──
  if (roundDone) {
    return (
      <div style={{ minHeight: '100dvh', background: APP_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', fontFamily: 'inherit' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: APP_DARK, marginBottom: 10 }}>Cas envoyés !</div>
        <div style={{ fontSize: 14, color: '#666' }}>En attente des autres formés…</div>
        <div style={{ marginTop: 24, width: 32, height: 32, border: `3px solid ${APP_GOLD}33`, borderTop: `3px solid ${APP_GOLD}`, borderRadius: '50%', animation: 'saisieSpin 1s linear infinite' }} />
        <style>{`@keyframes saisieSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: APP_BG, display: 'flex', flexDirection: 'column', fontFamily: 'inherit' }}>

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
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 0' }}>

        {/* Progression des 3 cas du round */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#666', marginBottom: 8 }}>
            Round {round} — Cas {localCaseIdx + 1} / {caseIndexes.length}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {caseIndexes.map((globalI, i) => {
              const isDone   = i < localCaseIdx
              const isActive = i === localCaseIdx
              return (
                <div key={globalI} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, textAlign: 'center',
                  border: `2px solid ${isActive ? APP_GOLD : isDone ? '#22c55e' : '#e5e2ef'}`,
                  background: isActive ? APP_GOLD : isDone ? '#f0fdf4' : '#fff',
                  color: isActive ? '#fff' : isDone ? '#16a34a' : '#aaa',
                  fontSize: 12, fontWeight: 700,
                }}>
                  {isDone ? '✓ ' : ''}{SAISIE_EXERCISES[globalI].label}
                </div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Sphère</div>
            <ValueBox value={vals.od.sph} mode="diopter-signed" locked={showResult} isCorrect={results?.od?.sph} showResult={showResult} correctLabel={corrLabel.od.sph} onClick={() => openNumpad('od', 'sph')} />
            <ValueBox value={vals.og.sph} mode="diopter-signed" locked={showResult} isCorrect={results?.og?.sph} showResult={showResult} correctLabel={corrLabel.og.sph} onClick={() => openNumpad('og', 'sph')} />
          </div>

          {/* Cylindre */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Cylindre</div>
            <ValueBox value={vals.od.cyl} mode="diopter-signed" locked={showResult} isCorrect={results?.od?.cyl} showResult={showResult} correctLabel={corrLabel.od.cyl} onClick={() => openNumpad('od', 'cyl')} />
            <ValueBox value={vals.og.cyl} mode="diopter-signed" locked={showResult} isCorrect={results?.og?.cyl} showResult={showResult} correctLabel={corrLabel.og.cyl} onClick={() => openNumpad('og', 'cyl')} />
          </div>

          {/* Axe */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 10, marginBottom: 14, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Axe</div>
            <ValueBox value={vals.od.axe} mode="degrees" locked={showResult} isCorrect={results?.od?.axe} showResult={showResult} correctLabel={corrLabel.od.axe} onClick={() => openNumpad('od', 'axe')} />
            <ValueBox value={vals.og.axe} mode="degrees" locked={showResult} isCorrect={results?.og?.axe} showResult={showResult} correctLabel={corrLabel.og.axe} onClick={() => openNumpad('og', 'axe')} />
          </div>

          {/* Add — toujours modifiable, même quand le cas n'en a pas (une valeur saisie à tort compte faux) ;
              pas d'indice sur la présence ou non d'une addition sur ce cas. */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr 1fr', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#555' }}>Add</div>
            <ValueBox value={vals.add} mode="diopter-positive" locked={showResult} isCorrect={results?.add} showResult={showResult} correctLabel={corrLabel.add} onClick={() => openNumpad('add', null)} />
            <ValueBox value={vals.add} mode="diopter-positive" locked={showResult} isCorrect={results?.add} showResult={showResult} correctLabel={corrLabel.add} onClick={() => openNumpad('add', null)} />
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
            <span style={{ fontSize: 28 }}>{perfect ? '🎉' : '😬'}</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: perfect ? '#16a34a' : '#dc2626' }}>
                {perfect ? "C'est juste !" : "Pas tout à fait !"}
              </div>
              <div style={{ fontSize: 12, color: '#555' }}>
                {perfect ? 'Toutes les corrections sont correctes.' : SAISIE_WRONG_MSG}
              </div>
            </div>
          </div>
        )}
        <div style={{ height: 12 }} />
      </div>

      {/* ── Bouton bas — bien séparé de la grille/du pavé numérique (au-dessus,
          en position fixe) pour qu'un tap sur "✓" du pavé ne valide pas par erreur ── */}
      <div style={{ padding: '40px 14px 36px', background: APP_BG, flexShrink: 0 }}>
        {!showResult ? (
          <button onPointerDown={verify} style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: APP_DARK, border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: 0.5, WebkitTapHighlightColor: 'transparent',
          }}>VÉRIFIER</button>
        ) : (
          <button onPointerDown={handleContinue} disabled={submitting} style={{
            width: '100%', padding: '16px', borderRadius: 12,
            background: perfect ? APP_GOLD : '#6b5fa6', border: 'none', color: '#fff',
            fontSize: 14, fontWeight: 800, fontFamily: 'inherit',
            letterSpacing: 0.5, cursor: submitting ? 'default' : 'pointer',
            opacity: submitting ? 0.7 : 1, WebkitTapHighlightColor: 'transparent',
          }}>
            {submitting ? 'Envoi…' : isLastCase ? "✓ Envoyer mes résultats" : 'Cas suivant →'}
          </button>
        )}
      </div>

      {/* Pavé numérique — saisie manuelle du champ actif */}
      {activeField && numpadConfig && (
        <ValueNumpad
          title={numpadConfig.title}
          mode={numpadConfig.mode}
          max={numpadConfig.max}
          currentValue={activeValue}
          onConfirm={v => {
            if (activeField.eye === 'add') setAdd(v)
            else setEye(activeField.eye, activeField.field, v)
            setActiveField(null)
            numpadClosedAtRef.current = Date.now()
          }}
          onClose={() => { setActiveField(null); numpadClosedAtRef.current = Date.now() }}
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
          {(page.timeline || []).map((item, i) => (
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
          {(page.points || []).map((p, i) => (
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
          {(page.steps || []).map((s, i) => (
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
          {(page.cases || []).map((c, i) => (
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
          {(page.profils || []).map((p, i) => (
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
          {(page.stats || []).map((s, i) => (
            <div key={i} style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 14, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#4ade80', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(page.points || []).map((p, i) => (
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
          {(page.temoignages || []).map((t, i) => (
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
      const nom    = typeof window !== 'undefined' ? (localStorage.getItem('participant_name') || '') : ''
      const prenom = typeof window !== 'undefined' ? (localStorage.getItem('participant_prenom') || '') : ''
      const author = [prenom, nom].filter(Boolean).join(' ') || 'Anonyme'
      const newQ = { id: Date.now().toString(), text: trimmed, highlighted: false, author }
      // Verrou optimiste : plusieurs formés peuvent envoyer une question au même moment,
      // un simple lire-modifier-écrire perdrait silencieusement l'une des questions.
      await mutateRoomState(null, state => ({ [key]: [...(state?.[key] || []), newQ] }))
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
      if (ok) { setSubmittedValue(value.trim()); setSubmitted(true) }
    } catch { /* ignore */ }
    finally { setSending(false) }
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
      if (ok) { setSubmittedText(text.trim()); setSubmitted(true) }
    } catch { /* ignore */ }
    finally { setSending(false) }
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

// ── Montures : matériaux — saisie libre participant ────────────────
function MonturesMateriauxMobile({ page, pName }) {
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
        'montures_materiaux_responses',
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
      if (ok) { setSubmittedValue(value.trim()); setSubmitted(true) }
    } catch { /* ignore */ }
    finally { setSending(false) }
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
    const timers = (page.items || []).map((_, i) =>
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
        {(page.items || []).map((item, i) => (
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
    try {
      await mergeRoomSharedField(getParticipantSessionCode(), 'prog_zone_responses', pName, idx)
      setSent(true)
    } catch { setSent(false); setSelected(null) }
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
        {(q?.options || []).map((opt, i) => (
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
      if (ok) { setSentText(text.trim()); setSent(true) }
    } catch { /* ignore */ }
    finally { setSending(false) }
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
      if (!ok) { setSending(false); return }
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

function SAVBrainstormMobile({ page, moduleId, pName }) {
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const pageId = `${moduleId}:brainstorm`
  const sessionCode = getParticipantSessionCode()

  useEffect(() => {
    const poll = async () => {
      const s = await getSharedState()
      setRevealed(!!s?.brainstorm_revealed)
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [])

  const handleSubmit = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    try {
      if (editing) {
        await updateOpenAnswer({ sessionCode, pageId, participantName: (pName || 'Anonyme').trim(), answer: text.trim() })
      } else {
        await insertOpenAnswer({ sessionCode, pageId, participantName: (pName || 'Anonyme').trim(), answer: text.trim() })
      }
      setSubmitted(true)
      setEditing(false)
    } catch { /* best-effort */ } finally {
      setSaving(false)
    }
  }

  if (submitted && !editing) return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Réponse envoyée !</div>
      {revealed ? (
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Les réponses sont affichées sur l'écran.</div>
      ) : (
        <>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>En attente des autres participants…</div>
          <button
            onClick={() => { setEditing(true) }}
            style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${page.color}60`, color: page.color, padding: '12px 28px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >✏️ Modifier ma réponse</button>
        </>
      )}
      <div style={{ marginTop: 28, width: 32, height: 32, border: '3px solid rgba(255,255,255,0.15)', borderTop: `3px solid ${page.color}`, borderRadius: '50%', animation: 'savSpin 1s linear infinite' }} />
      <style>{`@keyframes savSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', padding: '40px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ display: 'inline-block', background: `${page.color}20`, border: `1px solid ${page.color}40`, borderRadius: 20, padding: '5px 18px', fontSize: 10, fontWeight: 700, color: page.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>
        {editing ? '✏️ Modification' : '💬 Brainstorm'}
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.35, textAlign: 'center', marginBottom: 28, whiteSpace: 'pre-line' }}>{page.question}</div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Tapez votre réponse…"
        rows={5}
        style={{ width: '100%', maxWidth: 420, padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, fontFamily: 'inherit', resize: 'none', outline: 'none', marginBottom: 20 }}
      />
      <button onClick={handleSubmit} disabled={!text.trim() || saving} style={{ background: text.trim() ? `linear-gradient(135deg, ${page.color}, ${page.color}cc)` : 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', padding: '16px 40px', borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', fontFamily: 'inherit', width: '100%', maxWidth: 420, marginBottom: 12 }}>
        {saving ? 'Envoi…' : editing ? '✓ Mettre à jour' : '✓ Envoyer'}
      </button>
      {editing && (
        <button onClick={() => { setEditing(false) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
      )}
    </div>
  )
}

function SAVContentMobile({ page, pageIndex, total }) {
  const { color, icon, titre, sousTitre, points } = page
  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', display: 'flex', flexDirection: 'column', padding: '20px 18px 32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={28} style={{ objectFit: 'contain', opacity: 0.6 }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {Array(total).fill(0).map((_, i) => <div key={i} style={{ height: 4, borderRadius: 2, width: i === pageIndex ? 14 : 4, background: i === pageIndex ? color : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />)}
        </div>
      </div>
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 9, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>{sousTitre}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 20 }}>{titre}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {points.map((pt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${color}70`, borderRadius: 12, padding: '12px 14px' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{pt.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Écran générique « regardez le diffuseur » pour les phases pilotées par un
// module_page hors des pages normales (ex : animation PDM sur plage 1000+).
function WatchDiffuserMobile({ moduleLabel, titre }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, #00abe915 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={110} height={42}
        style={{ objectFit: 'contain', marginBottom: 40 }} />
      <div style={{
        display: 'inline-block',
        background: '#00abe920', border: '1px solid #00abe940',
        borderRadius: 20, padding: '3px 14px',
        fontSize: 10, fontWeight: 700, color: '#00abe9',
        textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
      }}>{moduleLabel || 'Formation LPT'}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
        {titre}
      </div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 300, marginBottom: 36 }}>
        Regardez l&apos;écran de diffusion et suivez le formateur
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
}

function ModuleScreen({ page, pageIndex, total, moduleLabel, moduleId, pName, progZoneQ, progZoneResponses, progObjectionIdx, progObjectionResponses, modelePoint, rembfrRevealed, rembfrDemarcheA, rembfrDemarcheB, entrainementQ, entrainementVfCorrect, entrainementClearTs, entrainementCustomQText, ordoRevealStep }) {
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
  if (page.type === 'ordonnance')        return <OrdonnanceMobile         page={page} pageIndex={pageIndex} total={total} ordoRevealStep={ordoRevealStep} />
  if (page.type === 'pause')             return <PauseMobile              page={page} pageIndex={pageIndex} total={total} pName={pName} />
  if (page.type === 'parcours-tiers-payant') return <PauseMobile          page={page} pageIndex={pageIndex} total={total} pName={pName} />
  if (page.type === 'tiers-payant-explication') return (
    <div style={{ minHeight: '100dvh', background: '#03112a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>📺</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Regardez le grand écran</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280 }}>
        L&apos;animation explique comment fonctionne le tiers payant complet et partiel.
      </p>
      <div style={{ marginTop: 28, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 16, padding: '12px 24px' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#4ade80' }}>Dans les deux cas : 0 € reste à charge 🎉</span>
      </div>
    </div>
  )

  if (page.type === 'rembfr-demarche') return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '28px 20px 40px',
      fontFamily: 'inherit',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={28} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5 }}>Remboursement</div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Ma démarche</div>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 20 }}>
        Quand un client souhaite se faire rembourser je dois :
      </h2>

      {/* Scénario A */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
          padding: '7px 12px', background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.25)', borderRadius: 8,
        }}>
          <span style={{ fontSize: 13 }}>📋</span>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1 }}>Scénario A</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Avec ordonnance valide</div>
          </div>
        </div>
        {[
          "Prendre l'ordonnance, la carte Vitale et la mutuelle.",
          "Aller sur AMELIPRO pour verifier le dernier remboursement.",
          "Faire le Test Supreme (sauf CSS → 1=1 directement).",
          "Retourner voir le client et adapter le discours.",
        ].slice(0, rembfrDemarcheA || 0).map((txt, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8,
            padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,171,233,0.15)', fontSize: 11, fontWeight: 900, color: '#00abe9' }}>{i + 1}</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>{txt}</span>
          </div>
        ))}
        {!rembfrDemarcheA && (
          <div style={{ padding: '12px 14px', background: 'rgba(0,137,186,0.06)', border: '1px dashed rgba(0,137,186,0.25)', borderRadius: 10, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            👀 Le formateur va révéler les étapes une par une…
          </div>
        )}
      </div>

      {/* Scénario B */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
          padding: '7px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8,
        }}>
          <span style={{ fontSize: 13 }}>🚫</span>
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>Scénario B</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Sans ordonnance valide</div>
          </div>
        </div>
        {[
          "Prendre la carte Vitale et verifier la mutuelle.",
          "Aller sur AMELIPRO pour verifier le dernier remboursement.",
          "Si ok → inscrire en examen de vue et obtenir ordonnance via LYLEOO.",
          "Faire le Test Supreme avec l'ordonnance (sauf CSS → 1=1).",
        ].slice(0, rembfrDemarcheB || 0).map((txt, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8,
            padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.15)', fontSize: 11, fontWeight: 900, color: '#f59e0b' }}>{i + 1}</div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>{txt}</span>
          </div>
        ))}
        {!rembfrDemarcheB && (
          <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.06)', border: '1px dashed rgba(245,158,11,0.25)', borderRadius: 10, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
            👀 Le formateur va révéler les étapes une par une…
          </div>
        )}
      </div>

      {/* Note bas */}
      <div style={{
        padding: '12px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Si le client n&apos;a pas droit au remboursement :</strong> proposer l&apos;offre <strong style={{ color: '#fff' }}>1=1</strong> ou <strong style={{ color: '#fff' }}>Classique</strong> a ses frais.
      </div>
    </div>
  )

  if (page.type === 'rembfr-supreme') return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={88} height={34} style={{ objectFit: 'contain', marginBottom: 32, opacity: 0.7 }} />
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(0,137,186,0.15)', border: '1px solid rgba(0,137,186,0.35)',
        borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9',
        textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20,
      }}>
        🏥 LPT Santé · Test Suprême
      </div>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Test Supreme</div>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 260 }}>
        Le formateur révèle les résultats.<br />Regardez l&apos;écran de diffusion.
      </p>
      <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
        <div style={{ padding: '10px 20px', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#4ade80' }}>
          Accepté → Parcours Suprême
        </div>
        <div style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, fontSize: 13, fontWeight: 700, color: '#f87171' }}>
          Refusé → Parcours 1=1
        </div>
      </div>
      <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>
        Dans les deux cas : 2 paires pour 0 € 🎉
      </div>
    </div>
  )
  if (page.type === 'lpt-sante-intro')        return <LptSanteIntroMobile       page={page} pName={pName} />
  if (page.type === 'lpt-sante-explication') return <LptSanteExplicationMobile />
  if (page.type === 'lpt-sante-pec')         return <LptSantePecMobile />
  if (page.type === 'montage-question') return <PauseMobile page={page} pageIndex={pageIndex} total={total} pName={pName} />
  if (page.type === 'montage-info')     return <MontageInfoMobile page={page} />
  if (page.type === 'montage-upgrade') return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #001a3d 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>⬆️</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Regardez le diffuseur</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280 }}>
        Le formateur fait défiler la gamme de traitements en direct sur le grand écran.
      </p>
    </div>
  )
  if (page.type === 'outlet-flow') return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #001a3d 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>{page.icon || '📦'}</div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Regardez le diffuseur</h2>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 280 }}>{page.sousTitre}</p>
    </div>
  )

  if (page.type === 'rembfr-conditions') {
    const revealed = rembfrRevealed || []
    const ordoRevealed = revealed.includes('ordonnance')
    const delaisRevealed = revealed.includes('delais')
    return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #001a3d 100%)', display: 'flex', flexDirection: 'column', padding: '28px 20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={28} style={{ objectFit: 'contain', opacity: 0.7 }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5 }}>Remboursement</div>
        </div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Les 3 conditions</div>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 20 }}>Pour être remboursé, le client doit :</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Condition 1 — toujours visible */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 16 }}>🏥</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#0089ba' }}>01</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Couverture SS + mutuelle / CSS</span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.5 }}>Être couvert par la Sécurité Sociale et une mutuelle complémentaire ou la Complémentaire Santé Solidaire.</p>
          </div>
          {/* Condition 2 — révélée par le formateur */}
          {ordoRevealed && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 16 }}>📋</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#0089ba' }}>02</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Ordonnance en cours de validité</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                {[{ label: 'Moins de 16 ans', duree: '1 an', color: '#f59e0b' }, { label: 'De 16 à 42 ans', duree: '5 ans', color: '#00abe9' }, { label: '43 ans et plus', duree: '3 ans', color: '#a78bfa' }].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: r.color }}>{r.duree}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '8px 10px', background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#c9a227', marginBottom: 3 }}>💡 Pas d'ordonnance valable ? → LYLEOO</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>Disponible en magasin pour les +18 ans. À utiliser uniquement pour débloquer un remboursement.</div>
              </div>
            </div>
          )}
          {/* Condition 3 — révélée par le formateur */}
          {delaisRevealed && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 16 }}>📅</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#0089ba' }}>03</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Délais de renouvellement</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: '8px 10px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 3 }}>Moins de 16 ans</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Tous les ans · <strong style={{ color: '#fff' }}>Sans délai</strong> si changement ≥ 0,50</div>
                </div>
                <div style={{ padding: '8px 10px', background: 'rgba(0,171,233,0.07)', border: '1px solid rgba(0,171,233,0.18)', borderRadius: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', marginBottom: 3 }}>16 ans et plus</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>Tous les <strong style={{ color: '#fff' }}>2 ans</strong> · Anticipé à partir de <strong style={{ color: '#fff' }}>1 an et 1 jour</strong> si changement ≥ 0,50</div>
                </div>
                <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  💻 Vérifiable sur <strong style={{ color: '#00abe9' }}>AMELIPRO</strong> avec le numéro de sécu du patient
                </div>
              </div>
            </div>
          )}
          {/* Indication d'attente si rien n'est encore révélé */}
          {!ordoRevealed && !delaisRevealed && (
            <div style={{ padding: '16px 18px', background: 'rgba(0,137,186,0.06)', border: '1px dashed rgba(0,137,186,0.25)', borderRadius: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>👀</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Le formateur va révéler les conditions une par une…</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (page.type === 'parcours-rembourses-offres') return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #001a3d 100%)', display: 'flex', flexDirection: 'column', padding: '28px 20px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={28} style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5 }}>Parcours remboursés</div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Les offres</div>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 20 }}>Les offres remboursées LPT</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Suprême */}
        <div style={{ background: 'rgba(139,113,134,0.1)', border: '1px solid rgba(139,113,134,0.35)', borderRadius: 14, padding: '18px' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#8B7186', marginBottom: 12 }}>Suprême</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['1 paire achetée, une paire offerte', 'Choix sur tout le magasin (montures et verres)', 'Verres Origine France Garantie', 'Uniquement avec tiers payant complet', 'Non compatible avec la CSS'].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#8B7186', marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
        {/* 1=1 */}
        <div style={{ background: 'rgba(106,173,84,0.08)', border: '1px solid rgba(106,173,84,0.28)', borderRadius: 14, padding: '18px' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#6aad54', marginBottom: 12 }}>1=1 100% Santé</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {['1 paire achetée, une paire offerte', 'Sur tout le magasin (montures et verres au choix)', 'Tarifs 100% Santé : 0 € de reste à charge quelle que soit la mutuelle'].map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6aad54', marginTop: 6, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{p}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.04)', borderLeft: '2px solid #6aad54', borderRadius: '0 8px 8px 0' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', lineHeight: 1.6 }}>Le 100% Santé est un dispositif légal qui garantit des lunettes entièrement remboursées par la Sécu et la mutuelle — sans aucun reste à charge pour le client.</span>
          </div>
        </div>
      </div>
    </div>
  )

  if (page.type === 'saisie-interactive') return <SaisieInteractiveMobile page={page} pageIndex={pageIndex} total={total} pName={pName} moduleId={moduleId} />
  if (page.type === 'entrainement-oral')  return <QuestionsGameParticipantView pName={pName} moduleId="optique" questionIdx={entrainementQ} vfCorrect={entrainementVfCorrect} clearTs={entrainementClearTs} customQText={entrainementCustomQText} questions={ENTRAINEMENT_QUESTIONS} />

  // Freins à l'achat — saisie libre
  if (page.type === 'freins') return <FreinsInputMobile page={page} pName={pName || 'Anonyme'} />

  // Montures : matériaux — saisie libre
  if (page.type === 'montures-materiaux') return <MonturesMateriauxMobile page={page} pName={pName || 'Anonyme'} />

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
        {(page.stats || []).map((stat, i) => (
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

  // SAV modules (Retraits, Ajustages, RAZ)
  if (page.type === 'sav-brainstorm') return <SAVBrainstormMobile page={page} moduleId={moduleId} pName={pName} />
  if (page.type === 'sav-content') return <SAVContentMobile page={page} pageIndex={pageIndex} total={total} />

  // Types de verres — verre progressif
  if (page.type === 'progressif') return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0d1d3a 50%, #100820 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={72} height={28}
        style={{ objectFit: 'contain', opacity: 0.6, marginBottom: 32 }} />
      <div style={{
        display: 'inline-block',
        background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '4px 16px',
        fontSize: 10, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14,
      }}>Types de verres · Journée 1</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 32 }}>
        Le Verre Progressif
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', inset: -30, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          animation: 'haloBreath 3.5s ease-in-out infinite',
        }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/verre-prog.png"
          alt="Verre progressif"
          style={{
            width: 240, height: 'auto', display: 'block', position: 'relative', zIndex: 1,
            animation: 'verreFloat 5s ease-in-out infinite',
            filter: 'drop-shadow(0 0 32px rgba(124,58,237,0.6)) drop-shadow(0 12px 24px rgba(0,0,0,0.5))',
          }}
        />
      </div>
    </div>
  )

  // Par défaut, le tel n'a rien de spécifique à afficher pour cette page (le contenu
  // détaillé — points, animations… — est réservé à l'écran diffuseur). On évite donc
  // toute illustration/avatar décoratifs sans rapport avec le module, et on se contente
  // d'indiquer clairement de suivre le diffuseur et le formateur.
  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, ${page.color || '#00abe9'}15 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={110} height={42}
        style={{ objectFit: 'contain', marginBottom: 40 }} />

      <div key={key} style={{ animation: 'fadeSlideUp .5s ease forwards' }}>
        <div style={{
          display: 'inline-block',
          background: `${page.color || '#00abe9'}20`, border: `1px solid ${page.color || '#00abe9'}40`,
          borderRadius: 20, padding: '3px 14px',
          fontSize: 10, fontWeight: 700, color: page.color || '#00abe9',
          textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
        }}>{moduleLabel || 'Formation LPT'}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 10 }}>
          {page.titre}
        </div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 300, marginBottom: 36 }}>
          Regardez l&apos;écran de diffusion et suivez le formateur
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: page.color || '#00abe9',
            animation: `waitDot 1.4s ease-in-out ${i * 0.25}s infinite`,
          }} />
        ))}
      </div>

      {total > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 32 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              width: i === pageIndex ? 20 : 4,
              background: i === pageIndex ? (page.color || '#00abe9') : 'rgba(255,255,255,0.2)',
              transition: 'all .4s ease',
            }} />
          ))}
        </div>
      )}
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

// Pas de reconnexion automatique : le formé doit toujours ressaisir nom et
// prénom lui-même (pas de lecture du dernier nom connu en localStorage).
function RhParticipantGate({ children }) {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  // Reconnexion auto sur simple rafraîchissement (F5, écran verrouillé...) :
  // sessionStorage survit à un rechargement mais disparaît à la fermeture de
  // l'onglet/l'appli — un formé qui recharge n'a pas à ressaisir son nom, un
  // formé qui ferme et rouvre (autre visiteur sur un tel dédié) si.
  const [submitted, setSubmitted] = useState(() => {
    if (typeof window === 'undefined') return ''
    const stillAlive = sessionStorage.getItem('participant_tab_alive')
    const saved = localStorage.getItem('participant_name')
    return (stillAlive && saved) || ''
  })
  const [status, setStatus] = useState('idle')
  const [canonicalName, setCanonicalName] = useState('')
  const [denyMessage, setDenyMessage] = useState('')

  const canJoin = nom.trim().length > 0 && prenom.trim().length > 0
  const handleJoin = () => { if (canJoin) setSubmitted(`${nom.trim()} ${prenom.trim()}`) }

  useEffect(() => {
    if (!submitted) return
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      const raw = submitted.trim()
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

      // Même logique de résolution/auto-réparation de salle que la connexion
      // classique (écran d'accueil) : un code de salle périmé (raccourci
      // enregistré sur un téléphone dédié, ancienne session...) est purgé et
      // remplacé par la salle ouverte du jour, au lieu de rester bloqué dessus.
      const roomResolved = await resolveParticipantSessionCode(resolved.entry)
      if (!roomResolved.ok) {
        if (!cancelled) {
          setDenyMessage(participantJoinBlockedMessage(roomResolved.reason, roomResolved.message))
          setStatus('denied')
        }
        return
      }
      const session = roomResolved.session
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
        sessionStorage.setItem('participant_tab_alive', '1')
      }
      try {
        await ensureSession(roomResolved.code)
        await sbUpsert('participants', {
          session_code: roomResolved.code,
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
  }, [submitted])

  if (status === 'loading') return <WaitingScreen />
  if (status === 'denied') return <RhAccessDenied message={denyMessage} />
  if (status === 'ok') return children(canonicalName)

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
      <div style={{ width: '100%', maxWidth: 340 }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 18, lineHeight: 1.5 }}>
          Saisissez votre nom et prénom pour rejoindre la formation.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            className="finput"
            type="text"
            placeholder="Nom"
            value={nom}
            onChange={e => setNom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoComplete="family-name"
          />
          <input
            className="finput"
            type="text"
            placeholder="Prénom"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoComplete="given-name"
          />
        </div>
        <button
          className="gbtn"
          style={{ width: '100%', marginTop: 10, opacity: canJoin ? 1 : 0.55 }}
          onClick={handleJoin}
          disabled={!canJoin}
        >
          Rejoindre →
        </button>
      </div>
    </div>
  )
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

function useParticipantFullscreen() {
  const [isFS, setIsFS] = useState(false)
  useEffect(() => {
    const handler = () => setIsFS(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])
  const toggle = () => {
    if (!document.fullscreenElement) {
      const el = document.documentElement
      if (el.requestFullscreen) el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    }
  }
  return { isFS, toggle }
}

function DisconnectChip({ pName, onDisconnect }) {
  const [open, setOpen] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const prenom = (pName || '').split(' ').pop()
  const { isFS, toggle: toggleFS } = useParticipantFullscreen()
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = typeof window !== 'undefined' && (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches)

  const handleFullscreen = () => {
    if (isIOS) { setShowIOSGuide(v => !v); return }
    toggleFS()
  }

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button
            onClick={handleFullscreen}
            style={{
              background: 'rgba(0,137,186,0.2)', border: '1px solid rgba(0,171,233,0.4)',
              borderRadius: 12, padding: '8px 16px',
              color: '#7dd3fc', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              backdropFilter: 'blur(8px)',
              whiteSpace: 'nowrap',
            }}
          >
            {isIOS ? (isStandalone ? '✓ Plein écran' : '⛶ Plein écran') : (isFS ? '⊠ Quitter' : '⛶ Plein écran')}
          </button>
          {showIOSGuide && (
            <div style={{
              background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, padding: '10px 12px',
              fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, maxWidth: 220,
              backdropFilter: 'blur(8px)',
            }}>
              Appuie sur <strong>Partager ⬆️</strong> puis <strong>« Sur l'écran d'accueil »</strong>
            </div>
          )}
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
        </div>
      )}
    </div>
  )
}

function AlertPopup({ message, onDismiss }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 32, fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #1a0a00 0%, #2d1200 100%)',
        border: '2px solid rgba(251,191,36,0.4)',
        borderRadius: 24, padding: '32px 28px', maxWidth: 340, width: '100%',
        textAlign: 'center', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>😠</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.5, marginBottom: 24 }}>
          {message}
        </div>
        <button
          onClick={onDismiss}
          style={{
            background: '#fbbf24', border: 'none', borderRadius: 14,
            padding: '14px 28px', fontSize: 15, fontWeight: 700,
            color: '#1a0a00', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
          }}
        >
          J'y retourne ! 🫡
        </button>
      </div>
    </div>
  )
}

function TestResetButton({ pName }) {
  const [confirm, setConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleReset = async () => {
    setResetting(true)
    const code = getParticipantSessionCode()
    try {
      const name = encodeURIComponent(pName.trim())
      const sc   = encodeURIComponent(code)
      await Promise.all([
        sbDelete('quiz_answers', `session_code=eq.${sc}&collaborateur=eq.${name}`),
        sbDelete('open_answers', `session_code=eq.${sc}&participant_name=eq.${name}`),
      ])
    } catch (e) { console.error('reset test', e) }
    window.location.reload()
  }

  return (
    <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 99999 }}>
      {confirm ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setConfirm(false)} style={{ background: '#374151', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Annuler
          </button>
          <button onClick={handleReset} disabled={resetting} style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            {resetting ? '…' : '✓ Reset'}
          </button>
        </div>
      ) : (
        <button onClick={() => setConfirm(true)} style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          🔄 Reset
        </button>
      )}
    </div>
  )
}

// ── Bouton "Mon profil" — accessible à tout moment (score temps réel, classement, niveau) ──
function ParticipantProfileContent({ pName, sessionCode }) {
  const { loadState, ranking, myEntry } = useParticipantRanking(pName, sessionCode, { pollMs: 6000 })
  if (loadState === 'loading') return <WaitingScreen />
  if (loadState === 'welcome') return <WelcomeScreenFirst pName={pName} />
  return <DashboardScreen pName={pName} myEntry={myEntry} ranking={ranking} />
}

function ParticipantProfileButton({ pName, sessionCode }) {
  const [open, setOpen] = useState(false)
  if (!pName || !sessionCode) return null
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Mon profil"
        style={{
          position: 'fixed', bottom: 14, right: 14, zIndex: 850,
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg, #00abe9, #0089ba)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: '0 4px 18px rgba(0,171,233,0.45)',
        }}
      >👤</button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1500,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            overflowY: 'auto',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ position: 'relative', minHeight: '100dvh' }}>
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', top: 14, right: 14, zIndex: 1600,
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
            <ParticipantProfileContent pName={pName} sessionCode={sessionCode} />
          </div>
        </div>
      )}
    </>
  )
}

function ParticipantModuleContent({ forcedModule, forcedPage, pName, sharedStateProp, onDisconnect }) {
  const sessionCode = getParticipantSessionCode()
  const [sessionEnded, setSessionEnded] = useState(false)
  const [alertMessage, setAlertMessage] = useState(null)
  const seenAlertsRef = useRef(new Set())
  const alertQueueRef = useRef([])

  useEffect(() => {
    if (!pName || !sessionCode) return
    const pageLoadTs = Date.now()
    const safeName = (pName || '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_À-ɏ]/g, '')
    const prefix = `alert__${safeName}__`

    const showNext = () => {
      if (alertQueueRef.current.length > 0) {
        setAlertMessage(alertQueueRef.current.shift())
      }
    }

    const check = async () => {
      const state = await getRoomSharedState(sessionCode).catch(() => ({}))
      const newAlerts = Object.entries(state || {})
        .filter(([k, v]) => k.startsWith(prefix) && v?.ts && v.ts > pageLoadTs && !seenAlertsRef.current.has(k))
        .sort(([, a], [, b]) => a.ts - b.ts)
      for (const [k, v] of newAlerts) {
        seenAlertsRef.current.add(k)
        alertQueueRef.current.push(v.message)
      }
      if (newAlerts.length > 0 && !alertMessage) showNext()
    }
    check()
    const interval = setInterval(check, 5000)
    return () => clearInterval(interval)
  }, [pName, sessionCode])

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
  const [rembfrRevealed, setRembfrRevealed]       = useState([])
  const [rembfrDemarcheA, setRembfrDemarcheA]     = useState(0)
  const [rembfrDemarcheB, setRembfrDemarcheB]     = useState(0)
  const [entrainementQ, setEntrainementQ]           = useState(null)
  const [entrainementVfCorrect, setEntrainementVfCorrect] = useState(null)
  const [entrainementClearTs, setEntrainementClearTs]     = useState(null)
  const [entrainementCustomQText, setEntrainementCustomQText] = useState(null)
  const [ordoRevealStep, setOrdoRevealStep]       = useState(0)

  // ── Hydratation depuis sharedState (fourni par useModuleSync — 1 seul appel Supabase) ──
  useEffect(() => {
    if (!sharedState) return
    setTvScreen(sharedState.tv_screen || null)
    setPlanningDay(sharedState.planning_day || null)
    setProgZoneQ(sharedState.prog_zone_q ?? null)
    setProgZoneResponses(sharedState.prog_zone_responses || {})
    setProgObjectionIdx(sharedState.prog_objection_idx ?? null)
    setProgObjectionResponses(sharedState.prog_objection_responses || {})
    setModelePoint(sharedState.modele_point ?? null)
    setFaqJournee(sharedState.faq_journee || null)
    setRembfrRevealed(sharedState.rembfr_revealed || [])
    setRembfrDemarcheA(sharedState.rembfr_demarche_a ?? 0)
    setRembfrDemarcheB(sharedState.rembfr_demarche_b ?? 0)
    setEntrainementQ(sharedState.entrainement_q ?? null)
    setEntrainementVfCorrect(sharedState.entrainement_vf_correct ?? null)
    setEntrainementClearTs(sharedState.entrainement_clear_ts ?? null)
    setEntrainementCustomQText(sharedState.entrainement_custom_q_text ?? null)
    setOrdoRevealStep(sharedState.ordo_reveal_step ?? 0)
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

  // Heartbeat de présence : signale la page courante + visibilité de l'onglet
  useEffect(() => {
    if (!activeModule || modulePage == null || modulePage < 0 || !pName || !sessionCode) return

    const write = () => {
      setParticipantPage(sessionCode, pName, {
        moduleId: activeModule,
        pageIndex: modulePage,
        ts: Date.now(),
        visible: document.visibilityState === 'visible',
      }).catch(() => {})
    }

    write()
    const interval = setInterval(write, 45000)

    const onVisibility = () => write()
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [activeModule, modulePage, pName, sessionCode])

  const moduleData = MODULE_DATA[activeModule] || null
  const pages = moduleData?.pages || []
  const quiz = moduleData?.quiz || []

  const isLobby   = !!moduleData && modulePage === -1
  const isResults = !!moduleData && modulePage === 200
  const isQuiz    = !!moduleData && modulePage >= 100 && modulePage < 200
  // Animation PDM (« du verre brut à la paire parfaite ») : le formateur pilote un module_page
  // spécial (1000+, hors des bornes du tableau pages) — même plage que côté diffuseur.
  const isPdmAnimation = activeModule === 'pdm' && modulePage >= 1000 && modulePage < 2000
  const qIdx = modulePage - 100
  const page = (!isQuiz && !isResults && !isLobby && !isPdmAnimation && moduleData) ? (pages[modulePage] ?? null) : null
  // Le podium interstitiel (toutes les 5 questions) est piloté par quiz_interstitial_q
  // (même flag que le diffuseur — qui contient l'index de la prochaine question, module_page
  // ayant déjà avancé). Si le formateur a avancé au-delà sans clôturer l'interstitiel, on
  // sort automatiquement (même garde-fou que côté TV) pour ne jamais rester bloqué dessus.
  const interstitialQ = sharedState?.quiz_interstitial_q
  const quizPodiumActive    = interstitialQ != null && !(qIdx > interstitialQ)
  const quizShowCorrection  = !!sharedState?.quiz_show_correction

  if (sessionEnded) return <SessionEndedScreen />

  // ── LPTSale simulator — participants travaillent en autonomie ──
  if (activeModule === 'atelier-pec') return <LPTSaleApp pName={pName} />

  return (
    <>
      <style>{STYLES}</style>
      {alertMessage && (
        <AlertPopup message={alertMessage} onDismiss={() => {
          setAlertMessage(alertQueueRef.current.length > 0 ? alertQueueRef.current.shift() : null)
        }} />
      )}
      <DisconnectChip pName={pName} onDisconnect={onDisconnect} />
      {/* Bouton reset test — visible uniquement pour les comptes test formateur */}
      {['bahougne', 'dupuy', 'duchemin', 'huchet'].some(n => pName?.toLowerCase().includes(n)) && (
        <TestResetButton pName={pName} />
      )}
      {/* Mon profil — score temps réel, classement, niveau — accessible à tout moment */}
      {!sessionEnded && activeModule !== 'atelier-pec' && (
        <ParticipantProfileButton pName={pName} sessionCode={sessionCode} />
      )}
      {/* Bulle question — discrète, visible sur toutes les pages de module */}
      {activeModule && !isLobby && !isResults && !sessionEnded && (
        <QuestionBubble moduleId={activeModule} pName={pName} />
      )}
      {/* Planning prioritaire : écrase tout si le formateur diffuse le planning */}
      {tvScreen === 'planning' && planningDay
        ? <ParticipantPlanningScreen planningDay={planningDay} />
        : isLobby
          ? <ParticipantModuleLobby moduleLabel={moduleData?.label || ''} moduleSub={moduleData?.sub || ''} />
          : isResults
            ? <PersonalResultsScreen key="results" pName={pName} quiz={quiz} moduleId={activeModule} />
            : isQuiz && quizPodiumActive
              ? <ParticipantQuizRanking pName={pName} moduleId={activeModule} qIdx={interstitialQ - 1} />
              : isQuiz && quizShowCorrection && quiz[qIdx]?.type !== 'text-open' && quiz[qIdx]?.type !== 'text-open-multi' && quiz[qIdx]?.type !== 'text-open-pairs'
              ? <ParticipantQuizRanking pName={pName} moduleId={activeModule} qIdx={qIdx} />
              : isQuiz
              ? <QuizAnswerScreen key={modulePage} pName={pName} qIdx={qIdx} quiz={quiz} moduleId={activeModule} />
              : isPdmAnimation
                ? <WatchDiffuserMobile moduleLabel={moduleData?.label} titre="Du verre brut à la paire parfaite" />
                : page
                  ? <ModuleScreen page={page} pageIndex={modulePage} total={pages.length} moduleLabel={moduleData?.label} moduleId={activeModule} pName={pName} progZoneQ={progZoneQ} progZoneResponses={progZoneResponses} progObjectionIdx={progObjectionIdx} progObjectionResponses={progObjectionResponses} modelePoint={modelePoint} rembfrRevealed={rembfrRevealed} rembfrDemarcheA={rembfrDemarcheA} rembfrDemarcheB={rembfrDemarcheB} entrainementQ={entrainementQ} entrainementVfCorrect={entrainementVfCorrect} entrainementClearTs={entrainementClearTs} entrainementCustomQText={entrainementCustomQText} ordoRevealStep={ordoRevealStep} />
                  : faqJournee
                    ? <FAQInputMobile journeeId={faqJournee} />
                    : <ParticipantDashboard pName={pName} sessionCode={sessionCode} />
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

  // Accès direct via ?mode=participant → connexion manuelle obligatoire
  return (
    <RhParticipantGate>
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
