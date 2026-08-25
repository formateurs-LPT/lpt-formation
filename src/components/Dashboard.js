'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbSelect, sbDelete, getSharedState, insertSessionHistory, parseSessionHistorySummary, getRuntimeSessionCode, SESSION_CODE } from '@/lib/supabase'
import PlanningWidget from './PlanningWidget'
import ShortcutsWidget from './ShortcutsWidget'
import { PenseBeteView, getPenseBeteTasks } from './PenseBeteWidget'
import OnboardingView from './OnboardingView'
import OnboardingViewBelgique from './OnboardingViewBelgique'
import EntreesView from './EntreesView'
import RoomOpenModal from './RoomOpenModal'
import { TRAINER_AVATARS, TRAINER_CANONICAL } from '@/lib/constants'
import { PLANNING_JOURS } from '@/lib/planningData'
import { setSharedState } from '@/lib/supabase'
import { findActiveRoomForTrainer, getLiveTrainerRoomCode, openOrCreateRoom, trainerLoginFromDisplayName, endActiveRoom } from '@/lib/sessionRoom'
import { isDynamicRoomCode, setTrainerActiveRoomCode } from '@/lib/sessionCode'
import { isTrainerAccount } from '@/lib/participantNames'
import { loadIdeesFromSupabase, deleteIdee, voteIdee, updateIdee, clearAllIdees, addIdee } from '@/components/IdeesButton'
import { MODULE_DATA } from '@/lib/modulesData'
import SonnettePanel from './SonnettePanel'
import RetourFormationView from './RetourFormationView'
import AutoEvalView from './AutoEvalView'
import GlobalRatingsView from './GlobalRatingsView'
import PeerQuizTrainer from './PeerQuizGame'
import FreeQuizTrainer from './FreeQuizGame'
import { readTrainerMode, setTrainerMode, TRAINER_MODE_META } from '@/lib/trainerMode'
import { categorySlugFromZone } from '@/lib/formationCategories'

function TrainerModeToggle({ mode, onChange }) {
  const [open, setOpen] = useState(false)
  const meta = mode ? TRAINER_MODE_META[mode] : null

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        title="Mode de travail — mémorisé jusqu'à ce que tu le changes"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: mode ? 'rgba(0,171,233,0.15)' : 'rgba(255,255,255,0.08)',
          border: `1px solid ${mode ? 'rgba(0,171,233,0.35)' : 'rgba(255,255,255,0.2)'}`,
          borderRadius: 20, padding: '6px 12px',
          cursor: 'pointer', fontFamily: 'inherit',
          color: mode ? '#00abe9' : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700,
        }}
      >
        {meta ? `${meta.emoji} ${meta.label}` : '⚙️ Choisir un mode'}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', top: '110%', right: 0, zIndex: 41,
            background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 12, padding: 6, minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {Object.entries(TRAINER_MODE_META).map(([slug, m]) => (
              <button
                key={slug}
                onClick={() => { onChange(slug); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                  background: mode === slug ? 'rgba(0,171,233,0.15)' : 'transparent',
                  border: 'none', borderRadius: 8, padding: '8px 10px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  color: mode === slug ? '#00abe9' : '#e2e8f0', fontSize: 13, fontWeight: 600,
                }}
              >
                {m.emoji} {m.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function DashHeader({ pName, onUpdatesClick, activeRoomCode, onOpenTv, onOpenRoom, onSonnetteClick, sonnettePending, trainerMode, onTrainerModeChange }) {
  const rawKey = (pName || '').toLowerCase().split(' ')[0]
  const key = TRAINER_CANONICAL[rawKey] || rawKey
  const avatarSrc = TRAINER_AVATARS[key] || TRAINER_AVATARS.kevin
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  const hasRoom = isDynamicRoomCode(activeRoomCode)

  return (
    <div className="dash-hero" style={{ display: 'flex', alignItems: 'center' }}>
      <Image src={avatarSrc} alt={pName} width={90} height={90} className="dash-hero-avatar" />
      <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
        <div className="dash-hero-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          Formation · Lunettes Pour Tous
          {key === 'thomas' && (
            <span title="Formateur Belgique" style={{ display: 'inline-flex', borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.4)', flexShrink: 0 }}>
              <span style={{ display: 'block', width: 7, height: 14, background: '#1a1a1a' }} />
              <span style={{ display: 'block', width: 7, height: 14, background: '#FDDA24' }} />
              <span style={{ display: 'block', width: 7, height: 14, background: '#EF3340' }} />
            </span>
          )}
        </div>
        <h2 className="dash-hero-title">Bonjour, {cap(pName)} 👋</h2>
        <p className="dash-hero-date">{cap(today)}</p>
      </div>

      {/* Zone salle active */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, zIndex: 1 }}>
        <TrainerModeToggle mode={trainerMode} onChange={onTrainerModeChange} />
        {hasRoom ? (
          <>
            <div
              onClick={onOpenRoom}
              title="Gérer la salle"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 4,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,171,233,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Salle active</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#00abe9', fontFamily: 'monospace', letterSpacing: 3, lineHeight: 1.2 }}>{activeRoomCode}</span>
            </div>
            <button
              onClick={onOpenRoom}
              title="Reprendre la salle"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
                borderRadius: 20, padding: '6px 12px',
                cursor: 'pointer', fontFamily: 'inherit',
                color: '#00abe9', fontSize: 12, fontWeight: 700, transition: 'all .18s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.2)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.1)' }}
            >
              Reprendre →
            </button>
          </>
        ) : (
          <button
            onClick={onOpenRoom}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)',
              borderRadius: 20, padding: '6px 14px',
              cursor: 'pointer', fontFamily: 'inherit',
              color: '#00abe9', fontSize: 12, fontWeight: 700, transition: 'all .18s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.22)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.12)' }}
          >
            🚪 Créer une salle
          </button>
        )}

        {onUpdatesClick && (
          <button
            onClick={onUpdatesClick}
            title="Mises à jour de l'app"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.35)',
              borderRadius: 20, padding: '6px 12px 6px 10px',
              cursor: 'pointer', fontFamily: 'inherit',
              color: '#c4b5fd', fontSize: 12, fontWeight: 700, transition: 'all .18s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.25)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.15)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.35)' }}
          >
            <span style={{ fontSize: 14 }}>⚡</span>
            <span>{APP_UPDATES.length}</span>
          </button>
        )}

        {onSonnetteClick && (
          <button
            onClick={onSonnetteClick}
            title="Sonnette d'accueil"
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 6,
              background: sonnettePending > 0 ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.07)',
              border: sonnettePending > 0 ? '1px solid rgba(251,191,36,0.45)' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '6px 12px',
              cursor: 'pointer', fontFamily: 'inherit',
              color: sonnettePending > 0 ? '#fbbf24' : 'rgba(255,255,255,0.6)',
              fontSize: 12, fontWeight: 700, transition: 'all .18s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = sonnettePending > 0 ? 'rgba(251,191,36,0.28)' : 'rgba(255,255,255,0.12)' }}
            onMouseOut={e => { e.currentTarget.style.background = sonnettePending > 0 ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.07)' }}
          >
            <svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Sonnette</span>
            {sonnettePending > 0 && (
              <span style={{
                background: '#fbbf24', color: '#1a1000', borderRadius: 10,
                padding: '1px 6px', fontSize: 11, fontWeight: 800, lineHeight: 1.4,
              }}>
                {sonnettePending}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel, danger }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        maxWidth: 420, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 12 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 28 }}>{message}</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #e5e7eb',
            background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
            background: danger ? '#dc2626' : 'var(--lpt)', color: '#fff',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

function SessionsHistoryView({ pName, onBack, onToast }) {
  const [sessions, setSessions] = useState([])
  const [quizResults, setQuizResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // { type: 'quiz'|'history'|'close' }

  const load = async () => {
    setLoading(true)
    const [history, answers] = await Promise.all([
      sbSelect('session_history'),
      sbSelect('quiz_answers'),
    ])
    setSessions(history || [])

    // Grouper les réponses quiz par collaborateur
    const byCollab = {}
    for (const a of (answers || [])) {
      if (!byCollab[a.collaborateur]) {
        byCollab[a.collaborateur] = { collaborateur: a.collaborateur, correct: 0, total: 0, answeredAt: a.created_at }
      }
      byCollab[a.collaborateur].total++
      if (a.is_correct) byCollab[a.collaborateur].correct++
    }
    setQuizResults(Object.values(byCollab))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Limité à la salle/au formateur actif : ces boutons supprimaient auparavant
  // les données de TOUS les formateurs et TOUTES les salles sans distinction —
  // dangereux dès que deux formateurs (Kevin/Quentin) travaillent en parallèle
  // sur la même base.
  const handleClearQuiz = async () => {
    const roomCode = getRuntimeSessionCode('trainer') || SESSION_CODE
    const filter = `session_code=eq.${encodeURIComponent(roomCode)}`
    await sbDelete('quiz_answers', filter)
    await sbDelete('module_results', filter)
    await load()
    setModal(null)
    onToast('Résultats quiz de la salle active vidés')
  }

  const handleClearHistory = async () => {
    const trainer = pName || (typeof window !== 'undefined' ? localStorage.getItem('trainer_name') : '') || ''
    if (!trainer) { onToast('Formateur non identifié'); setModal(null); return }
    await sbDelete('session_history', `trainer_name=eq.${encodeURIComponent(trainer)}`)
    await load()
    setModal(null)
    onToast('Ton historique vidé')
  }

  const handleCloseSession = async () => {
    setModal(null)
    const roomCode = getRuntimeSessionCode('trainer') || SESSION_CODE
    const enc = encodeURIComponent(roomCode)
    const filter = `session_code=eq.${enc}`
    const [participants, answers, quizResults, scenarioResponses, moduleResults, openAnswers] = await Promise.all([
      sbSelect('participants', filter),
      sbSelect('quiz_answers', filter),
      sbSelect('quiz_results', filter),
      sbSelect('scenario_responses', filter),
      sbSelect('module_results', filter),
      sbSelect('open_answers', filter),
    ])
    const total =
      (participants?.length || 0) +
      (answers?.length || 0) +
      (quizResults?.length || 0) +
      (scenarioResponses?.length || 0) +
      (moduleResults?.length || 0) +
      (openAnswers?.length || 0)
    if (total === 0) {
      onToast('Aucune donnée à enregistrer'); return
    }
    await insertSessionHistory({
      sessionCode: roomCode + '_' + Date.now(),
      sessionDate: new Date().toISOString(),
      trainerName: localStorage.getItem('trainer_name') || 'Formateur',
      participants: participants || [],
      quizResults: {
        type: 'room_archive',
        room_code: roomCode,
        scores: quizResults || [],
        answers: answers || [],
        module_results: moduleResults || [],
        open_answers: openAnswers || [],
      },
      scenarioResponses: scenarioResponses || [],
    })
    await Promise.all([
      sbDelete('participants', filter),
      sbDelete('quiz_answers', filter),
      sbDelete('quiz_results', filter),
      sbDelete('scenario_responses', filter),
      sbDelete('module_results', filter),
      sbDelete('open_answers', filter),
    ])
    onToast('Session clôturée ✓')
    load()
  }

  const xpFor = (correct, total) => total > 0 ? Math.round((correct / total) * 100) : 0
  const MODULE_LABELS = { 'types-verres': 'Types de verres' }

  return (
    <div className="dash-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button className="detail-back" onClick={onBack} style={{ margin: 0 }}>← Retour</button>
        <button className="btn1" onClick={() => setModal('close')} style={{ fontSize: 13, padding: '8px 16px' }}>
          🔒 Clôturer la session
        </button>
      </div>

      {modal === 'quiz' && (
        <ConfirmModal
          title="Vider les résultats quiz ?"
          message="⚠️ ATTENTION — Tu es sur le point d'effacer définitivement les résultats quiz de TA salle active uniquement. Cette action est irréversible. Si tu veux garder une trace, clôture d'abord la session."
          confirmLabel="Oui, vider"
          onConfirm={handleClearQuiz}
          onCancel={() => setModal(null)}
          danger
        />
      )}
      {modal === 'history' && (
        <ConfirmModal
          title="Vider l'historique ?"
          message="⚠️ ATTENTION — Tu vas supprimer TON historique des sessions enregistrées (pas celui des autres formateurs). Cette action est irréversible et définitive."
          confirmLabel="Oui, vider"
          onConfirm={handleClearHistory}
          onCancel={() => setModal(null)}
          danger
        />
      )}
      {modal === 'close' && (
        <ConfirmModal
          title="Clôturer la session ?"
          message="Les résultats de la semaine vont être enregistrés dans l'historique, puis la session en cours sera réinitialisée. Bonne action pour fin de semaine ✅"
          confirmLabel="Oui, clôturer"
          onConfirm={handleCloseSession}
          onCancel={() => setModal(null)}
          danger={false}
        />
      )}

      {loading ? (
        <p style={{ color: 'var(--text-m)', fontSize: 14, textAlign: 'center', padding: '40px 20px' }}>Chargement…</p>
      ) : (
        <>
          {/* ── Résultats quiz en direct ── */}
          <div className="dash-header" style={{ marginTop: 8 }}>
            <div>
              <h2>Résultats quiz</h2>
              <p>{quizResults.length} participant{quizResults.length !== 1 ? 's' : ''} — Types de verres</p>
            </div>
            {quizResults.length > 0 && (
              <button className="btn2" onClick={() => setModal('quiz')} style={{ color: '#dc2626', borderColor: '#dc2626', fontSize: 13 }}>
                🗑 Vider
              </button>
            )}
          </div>

          {quizResults.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 'var(--rs)', padding: '28px', textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🧠</div>
              <p style={{ color: 'var(--text-m)', fontSize: 14 }}>Aucun résultat quiz pour l'instant.<br />Lancez le quiz depuis le module Types de verres.</p>
            </div>
          ) : (
            <div style={{ marginBottom: 32 }}>
              {quizResults.map((r, i) => {
                const xp = xpFor(r.correct, r.total)
                const pct = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0
                const color = pct === 100 ? '#16a34a' : pct >= 50 ? '#0089ba' : '#dc2626'
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--rs)', padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${color}15`, border: `2px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, fontWeight: 800, color }}>
                      {r.collaborateur.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{r.collaborateur}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 2 }}>Types de verres · {r.correct}/{r.total} bonne{r.correct > 1 ? 's' : ''} réponse{r.correct > 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color }}>{r.correct}/{r.total}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-m)' }}>Score</div>
                      </div>
                      <div style={{ textAlign: 'center', background: 'var(--lpt-l)', borderRadius: 10, padding: '6px 12px' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--lpt)' }}>{xp}%</div>
                        <div style={{ fontSize: 10, color: 'var(--lpt-d)', fontWeight: 600 }}>Réussite</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Historique des semaines ── */}
          <div className="dash-header">
            <div>
              <h2>Historique des semaines</h2>
              <p>{sessions.length} clôture{sessions.length !== 1 ? 's' : ''} enregistrée{sessions.length !== 1 ? 's' : ''}</p>
            </div>
            {sessions.length > 0 && (
              <button className="btn2" onClick={() => setModal('history')} style={{ color: '#dc2626', borderColor: '#dc2626', fontSize: 13 }}>
                🗑 Vider
              </button>
            )}
          </div>

          {sessions.length === 0 ? (
            <p style={{ color: 'var(--text-m)', fontSize: 14, textAlign: 'center', padding: '20px' }}>Aucune clôture enregistrée.</p>
          ) : (
            <div>
              {[...sessions].reverse().map((s, i) => {
                const date = new Date(s.session_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                const cap = str => str ? str.charAt(0).toUpperCase() + str.slice(1) : ''
                const { notes, count } = parseSessionHistorySummary(s)
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--rs)', padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--lpt-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📅</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{cap(date)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 2 }}>{notes}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lpt)' }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-m)' }}>collaborateur{count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── Changelog data ───────────────────────────────────────────────
const APP_UPDATES = [
  {
    id: '2026-08-20',
    date: '17 → 20 août 2026',
    title: 'Quiz Jour 2 (Q19) corrigé, auto-passage à la correction fiabilisé sur les 13 quiz',
    tag: 'Correctif',
    tagColor: '#22d3ee',
    sections: [
      {
        title: 'Quiz — formés jetés direct sur la correction',
        accent: '#ef4444',
        tag: 'Correctif',
        items: [
          'Le drapeau qui affiche la correction pouvait rester bloqué à "activé" d\'une question — voire d\'un quiz — à l\'autre : un formé retombait alors direct sur la correction sans avoir pu répondre',
          'Remis à zéro systématiquement en changeant de question, en quittant un quiz, ou en le terminant (Quiz Jour 1 & Jour 2)',
          'Bouton "🔄 Réinitialiser" ajouté sur Quiz Jour 2 (déjà présent sur Jour 1) : efface les réponses de la question en cours si une ancienne réponse traîne en base',
        ],
      },
      {
        title: 'Quiz Jour 2 — Q19 invisible côté formateur',
        accent: '#f59e0b',
        tag: 'Correctif',
        items: [
          'L\'ordonnance et le compteur juste/faux ne s\'affichaient jamais côté formateur pour "calcul de la vision de près" — seul le QCM/ordonnance classique était prévu, pas ce type de question à cases à remplir',
        ],
      },
      {
        title: 'Auto-passage à la correction — uniformisé sur les 13 quiz',
        accent: '#10b981',
        tag: 'Amélioration',
        items: [
          'Même mécanique partout désormais : passage automatique à la correction dès que tous les formés réellement connectés (présence active, pas juste "présents dans l\'app") ont répondu',
          'Liste "n\'ont pas encore répondu" visible côté formateur (jamais sur le diffuseur) pour repérer qui bloque',
          'Lien "⚠️ Forcer la correction" toujours disponible en secours si le décompte de connectés est faussé (ex: un collaborateur resté marqué "connecté" sans jamais répondre)',
        ],
      },
    ],
  },
  {
    id: '2026-08-17',
    date: '13 → 17 août 2026',
    title: 'Scoring fiabilisé, retour de formation accéléré, mot de passe K\'Formation, Quiz Jour 2',
    tag: 'Gros récap',
    tagColor: '#fbbf24',
    sections: [
      {
        title: 'Scoring & classement — incidents corrigés',
        accent: '#ef4444',
        tag: 'Fiabilité critique',
        items: [
          'Clôture automatique qui fermait des salles EN COURS D\'UTILISATION (se basait sur la date de création au lieu de la dernière activité réelle) — incident IDF du 13/08',
          'Réponses d\'un formé qui disparaissaient du Retour de formation et du classement quand sa salle avait été recréée — un formé a un compte de points individuel, plus un compte par salle',
          'Temps d\'activité sous-estimé par le même type de défaut de filtrage par salle',
          'Classement (dashboard formé + fiche formateur) basé sur le taux de bonnes réponses plutôt que sur les points bruts — un formé qui a répondu à moins de questions n\'est plus défavorisé',
        ],
      },
      {
        title: 'Correctifs formés en direct',
        accent: '#22d3ee',
        tag: 'Correctif',
        items: [
          'Téléphones dédiés ayant déjà servi à une connexion formateur (test, démo…) : le formé restait bloqué sans que rien ne bouge à l\'écran — corrigé',
          'Formés restant piégés sur l\'écran du jeu des questions après que le formateur ait lancé un autre module directement (sans repasser par "Retour")',
          'Podium interstitiel du Quiz Jour 2 qui faisait planter l\'appli — retiré (comme déjà fait sur le Quiz Jour 1)',
        ],
      },
      {
        title: 'Retour de formation — saisie accélérée',
        accent: '#818cf8',
        tag: 'Nouveauté',
        items: [
          'Suggestion automatique des acquis/non-acquis par thème à partir du taux de quiz (uniquement sur les thèmes jamais évalués manuellement, badge "suggéré à vérifier")',
          'Bouton "Pré-remplir" sur le mot du formateur : génère un brouillon à partir de ce qui est déjà renseigné (thèmes, attitude, participation, compréhension, appréciation)',
          'Nouvel onglet "Notes de la semaine" pour prendre des notes libres au fil des jours, reprises par le "Pré-remplir" en fin de semaine',
          'Bouton "Télécharger PDF" sur la fiche d\'un collaborateur — génère directement un fichier PDF, sans passer par la boîte de dialogue d\'impression',
          'Corrige "Imprimer" qui affichait le rapport en double',
        ],
      },
      {
        title: 'Mot de passe K\'Formation',
        accent: '#f59e0b',
        tag: 'Nouveauté',
        items: [
          'Bouton 🔑 dans la barre du haut (desktop et mobile) : affiche le code de la semaine, sa date de mise à jour, et permet de le modifier — partagé et modifiable par tous les formateurs',
          'Bouton "📺 Diffuseur" pour l\'afficher sur le grand écran — reproduction fidèle du vrai écran de connexion K\'Formation, avec l\'identifiant et le mot de passe de la semaine',
        ],
      },
      {
        title: 'Quiz Jour 2 & Mini Jeux',
        accent: '#10b981',
        tag: 'Nouveauté',
        items: [
          '3e carte "Questions Jour 2" dans Mini Jeux (offres, 1=1, montures, verre progressif, examen de vue)',
          'Ouverture de salle sans re-redemander la catégorie (présentiel/visio/Belgique) à chaque fois — reprend directement ton mode de travail persistant',
          'Mode Belgique pré-sélectionné automatiquement pour Thomas tant qu\'il n\'a jamais choisi de mode lui-même',
        ],
      },
      {
        title: 'Diffuseur',
        accent: '#fb923c',
        tag: 'Amélioration',
        items: [
          'Minuteur de quiz (90s) affiché en overlay sur le diffuseur, comme sur le téléphone du formé',
          'Texte agrandi sur les 3 pages du module Remboursement France — plus lisible au fond de la salle',
        ],
      },
      {
        title: 'Tableau de bord',
        accent: '#a78bfa',
        tag: 'Amélioration',
        items: [
          'La tuile "Mises à jour de l\'app" au milieu du dashboard a été retirée — elle prenait trop de place',
          'La liste complète des mises à jour reste accessible en un clic via l\'éclair ⚡ à côté de ton avatar, en haut',
        ],
      },
    ],
  },
  {
    id: '2026-08-13',
    date: '10 → 13 août 2026',
    title: 'Audit complet de l\'app, retour de formation partagé, dashboard formé refait',
    tag: 'Gros récap',
    tagColor: '#fbbf24',
    sections: [
      {
        title: 'Audit complet — bugs corrigés',
        accent: '#ef4444',
        tag: 'Sécurité & fiabilité',
        items: [
          'Mini-jeu des questions invisible sur les téléphones dédiés (raccourci) — corrigé pour fonctionner comme via le QR code',
          'Lien "compte rendu" pouvant renvoyer une fiche vide au manager quand un autre formateur que celui qui l\'a remplie cliquait sur "Envoyer"',
          'Risque de perte de données à la clôture d\'une salle si l\'archivage réseau échouait — la salle n\'est plus purgée tant que l\'archivage n\'a pas réussi',
          '"Clôturer la session" pouvait planter silencieusement (import manquant)',
          'Boutons "Vider les résultats quiz" / "Vider l\'historique" limités à sa propre salle/historique au lieu de toucher tous les formateurs',
          'Décalage d\'affichage formateur ↔ diffuseur sur certaines corrections d\'ordonnance (Optique, Quiz Final)',
          'Clôture de semaine RH : une erreur de sauvegarde individuelle est détectée au lieu d\'annoncer un succès et de vider la liste à tort',
        ],
      },
      {
        title: 'Connexion des formés',
        accent: '#22d3ee',
        tag: 'Correctif',
        items: [
          'Un rafraîchissement de page ne déconnecte plus les formés — ils retombent directement sur leur écran en cours (fermer complètement l\'app déconnecte toujours, comme prévu)',
          'Détection fiable des formés partis pour de bon (téléphone rangé) — ils n\'apparaissent plus indéfiniment "connectés", ce qui faussait le "qui n\'a pas répondu" pendant les quiz',
          'Clôture automatique d\'une salle oubliée d\'une semaine précédente à l\'ouverture du Dashboard — sans risque, les retours de formation restent accessibles quoi qu\'il arrive',
        ],
      },
      {
        title: 'Retour de formation',
        accent: '#818cf8',
        tag: 'Nouveauté',
        items: [
          'Fiche partagée entre formateurs : un même formé n\'a plus qu\'une seule fiche par semaine, modifiable par n\'importe qui — fini les acquis/non-acquis invisibles d\'un formateur à l\'autre',
          'Taux de compréhension par thème calculé automatiquement à partir des vraies réponses aux quiz, affiché à côté de ton évaluation (jamais à sa place), avec tendance jour par jour',
          'Retour individuel envoyé au formé par mail (en plus du compte rendu manager) : acquis/non-acquis, taux global, message personnalisable, adresse déduite automatiquement',
          'Indicateur d\'activité écran : alerte si un formé est nettement moins actif sur l\'app que la moyenne du groupe — signal relatif à vérifier avec lui, pas une preuve absolue',
        ],
      },
      {
        title: 'Dashboard formé refait',
        accent: '#10b981',
        tag: 'Nouveauté',
        items: [
          'L\'écran d\'attente "Bonjour..." est remplacé par un vrai dashboard : profil (magasin, poste), niveau (10 pts par bonne réponse, palier tous les 50 points), historique des quiz de la semaine',
          'Visible uniquement quand rien n\'est en cours (jamais pendant un module/quiz, pour ne pas détourner l\'attention)',
          'Badges : série de bonnes réponses, Expert par thème, Sans-faute, Increvable',
        ],
      },
      {
        title: 'Dashboard formateur',
        accent: '#fb923c',
        tag: 'Amélioration',
        items: [
          'Mode de travail persistant (présentiel / visio / Belgique) à côté de ton nom — l\'Onboarding France ne redemande plus le groupe à chaque fois',
          'Bouton QR en double retiré (celui de la barre du haut suffit)',
          'Quiz Jour 2 ajouté et intégré au taux de compréhension par thème',
        ],
      },
    ],
  },
  {
    id: '2026-08-10',
    date: '3 → 10 août 2026',
    title: 'Récap de la semaine — sécurité quiz, points fiabilisés, saisie interactive repensée',
    tag: 'Gros récap',
    tagColor: '#fbbf24',
    sections: [
      {
        title: 'Sécurité anti-triche sur les quiz à réponse libre',
        accent: '#ef4444',
        tag: 'Sécurité',
        items: [
          'Sur les 8 modules à questions libres (Bases de l\'optique, Ajustages, Remboursement France, Quiz Jour 1, Types de verres, Entreprise, Retraits, Quiz Final), le bouton "Voir la correction" est bloqué tant que tous les formés connectés n\'ont pas répondu',
          'Avant : il pouvait être cliqué à tout moment et révélait sur le diffuseur le texte des réponses déjà reçues — un formé qui traînait pouvait lire les autres et recopier',
          'Le bouton affiche maintenant un compteur "En attente (3/8)" tant que ce n\'est pas complet',
        ],
      },
      {
        title: 'Comptes formateur en test — traités comme un vrai formé',
        accent: '#22d3ee',
        tag: 'Correctif de fond',
        items: [
          'Un formateur qui teste l\'appli avec son propre compte voit maintenant ses réponses prises en compte partout où c\'est pertinent : classement en direct, vue formateur, écran diffuseur, jeu des questions, ses propres points sur son téléphone',
          'Corrige un bug de fond où la vue formateur en direct interrogeait la mauvaise salle si le navigateur avait déjà servi à se connecter comme formé (code de salle resté en mémoire)',
          'Reste volontairement filtré sur les rapports officiels (retour de formation, note globale, avis) pour ne pas fausser les vraies statistiques des formés',
        ],
      },
      {
        title: 'Points et classement — plusieurs bugs corrigés',
        accent: '#818cf8',
        tag: 'Correctif',
        items: [
          'Formés dont la salle avait déjà été terminée par le formateur : leurs points remontent maintenant depuis l\'archive au lieu d\'afficher 0',
          'Corrige un cumul erroné qui additionnait à tort les points de plusieurs semaines passées au lieu de ne compter que la salle en cours',
          'Corrige des doublons dans les réponses aux quiz qui faussaient les compteurs "bonnes/mauvaises réponses" affichés en fin de question',
          'La saisie interactive (cas pratiques Bases de l\'optique) ne remonte plus les résultats de semaines passées, côté formateur comme sur le diffuseur',
        ],
      },
      {
        title: 'Jeu des questions',
        accent: '#10b981',
        tag: 'Amélioration',
        items: [
          'Le formateur voit maintenant qui n\'a pas encore répondu, en plus de la liste de ceux qui ont répondu',
          'Validation automatique continue : dès que le formateur donne sa réponse (Vrai/Faux, choix, sélection multiple), tout formé ayant répondu exactement pareil est validé automatiquement — modifiable manuellement à tout moment, y compris après coup',
          'Nouvelles options dédiées pour "Ce client voit :" (symptômes : flou de loin, flou à toutes distances, déformé, flou de près) distinctes de "Quels sont les problèmes de vue ?" (troubles)',
          'Sélection multiple, durée de validité d\'ordonnance et nouveau mini-jeu autonome ajoutés en cours de semaine',
        ],
      },
      {
        title: 'Saisie interactive — cas pratiques (Bases de l\'optique)',
        accent: '#fb923c',
        tag: 'Refonte',
        items: [
          'La molette tactile est remplacée par un clavier numérique : le formé saisit lui-même chiffres, virgule et signe (comme sur une vraie ordonnance)',
          'Cases sphère/cylindre/axe/add agrandies pour limiter les erreurs de clic',
          'Plus d\'avancée automatique après validation : le formé clique "Cas suivant" lui-même, le temps de lire le résultat',
          'Retire l\'indice "(aucune)" à côté d\'Add qui donnait la réponse sans effort',
        ],
      },
      {
        title: 'Animation cylindre/axe',
        accent: '#f59e0b',
        tag: 'Design',
        items: [
          'Nouveau visuel façon phare de voiture (au lieu d\'une sphère blanche abstraite) — le fonctionnement et le rapporteur restent identiques',
          'Label inutile "Ce que voit le formé" retiré du diffuseur',
        ],
      },
      {
        title: '4 troubles visuels — Bases de l\'optique',
        accent: '#00abe9',
        tag: 'Amélioration',
        items: [
          'Les 4 troubles sont désormais révélés un par un sur le diffuseur et le téléphone des formés, au lieu d\'apparaître tous en même temps',
        ],
      },
      {
        title: 'Podium & correction en direct',
        accent: '#a78bfa',
        tag: 'Interactif',
        items: [
          'Le podium intermédiaire toutes les 5 questions est supprimé (source de plantages) — seul le podium final reste',
          'Chaque formé voit désormais son classement en temps réel, en privé, sur son téléphone après chaque correction',
        ],
      },
      {
        title: 'Nouveaux modules SAV — Montures Outlet & Le Montage',
        accent: '#f472b6',
        tag: 'Nouveaux modules',
        items: [
          'Module "Montures Outlet" : animation dédiée, bouton de révélation et rythme corrigés',
          'Module "Le Montage" : mention claire du 0€ de reste à charge, animation interactive (remplace l\'ancienne page statique), tous les traitements comparés côte à côte sur le diffuseur, page de conclusion plus percutante',
        ],
      },
      {
        title: 'Retour de formation & rapports',
        accent: '#c084fc',
        tag: 'Amélioration',
        items: [
          'Envoi d\'un lien d\'auto-évaluation à distance pour les formés absents',
          'Sélection des destinataires lors du partage de la fiche pratique SAV',
          'Classement du formé visible dans le compte rendu envoyé au manager',
          'Historique : les variantes de saisie d\'un même magasin (ex. Bayonne) sont regroupées, sans fusionner les villes à plusieurs magasins (Marseille, Toulouse, Montpellier)',
          'Managers retour de formation mis à jour (Toulon Avenue 83, Ixelles) + correction de l\'email de Marie-Julie Cicuto',
        ],
      },
      {
        title: 'Audit complet & corrections diverses',
        accent: '#34d399',
        tag: 'Fiabilité',
        items: [
          'Audit complet du Quiz Final : classement formateur, garde-fous et filtres',
          'Contrôle complet de la Journée 4, fiche récap SAV enrichie',
          'QR code de connexion : ne renvoie plus vers l\'écran de connexion Vercel',
          'Corrige le formé qui restait bloqué quand le formateur quittait un module en cours',
          'Corrige l\'écran formé pendant l\'animation PDM (verre brut → paire parfaite)',
        ],
      },
    ],
  },
  {
    id: '2026-07-31',
    date: '13 → 31 juillet 2026',
    title: 'Récap complet — nouveautés de l\'app pendant tes vacances',
    tag: 'Gros récap',
    tagColor: '#fbbf24',
    sections: [
      {
        title: 'Retour de formation — refonte complète',
        accent: '#818cf8',
        tag: 'Nouveau',
        items: [
          'Nouvel onglet "Retour de formation" sur le dashboard : une fiche de suivi par collaborateur, par semaine',
          'Évaluation des thèmes sur 4 niveaux (Pas compris / Notions / En cours / Maîtrisé) avec calcul automatique du taux d\'acquisition',
          'Commentaires formateur : Attitude générale, Participation (tout nouveau), Compréhension des contenus — chacun avec statut RAS / Peut mieux faire / Attention + note libre',
          'Appréciation globale à 4 niveaux : Très bon élément / Ça va le faire (tout nouveau) / Accompagnement / Compliqué',
          '"Mot du formateur" en texte libre + bouton correcteur d\'orthographe sur toutes les zones de texte du retour',
          'Compte rendu manager visuel avec aperçu, lien partageable, envoi par email (individuel ou "Tout envoyer" groupé par manager) et suivi d\'envoi (date visible)',
          'Onglet "Historique" pour retrouver toutes les formations passées, avec l\'auto-éval du formé en regard',
          'Rapports Directeurs Régionaux (Bryan / Sarah / Alexandre) intégrés directement dans Retour de formation, avec envoi mail pré-rédigé au DR',
          'Les retours et auto-évaluations ne disparaissent plus quand on change de semaine',
        ],
      },
      {
        title: 'Auto-évaluation des formés',
        accent: '#10b981',
        tag: 'Nouveau module',
        items: [
          'Questionnaire de fin de formation rempli par le formé lui-même : niveau par thème en étoiles (1 à 5), thèmes où il souhaite être accompagné, suggestions libres',
          'Avis sur la formation type Google (étoiles + commentaire), moyenne visible sur le dashboard et détail des commentaires',
          'Le formateur lance le questionnaire formé par formé (plus d\'envoi groupé à toute la salle) et peut le renvoyer individuellement ("Renvoyer") avec pré-remplissage des réponses précédentes',
          'Vue formateur : sélecteur de catégorie (Présentiel / Visio / Belgique / Tous), récap individuel par formé, compte rendu de synthèse global exportable',
          'Thèmes affichés dans l\'ordre chronologique de la formation',
        ],
      },
      {
        title: 'Journée 4 — SAV (Retraits, Ajustages, RAZ)',
        accent: '#fb923c',
        tag: 'Nouveaux modules',
        items: [
          '3 modules complets : Les Retraits (SMS, recherche, essayage, signature), Les Ajustages (confort, acétate, métal, règles d\'or), Les RAZ (recommandes, process, dernier recours)',
          'Brainstorm introductif sur chaque module SAV (vue formateur + participant + diffuseur)',
          'Réponses des formés anonymes sur le diffuseur TV',
          'Questions posées par les formés affichables et supprimables individuellement par le formateur',
          'Fiche SAV accessible directement depuis le dashboard',
        ],
      },
      {
        title: 'Nouveaux modules — contenu Journée 3',
        accent: '#00abe9',
        tag: 'Contenu',
        items: [
          'LPT Santé (nouveau module) : animation cycle de prise en charge, scénario Test Suprême / Facturation / Tiers payant partiel piloté par le formateur',
          'Les parcours remboursés (Le Suprême, 1=1, 100% Santé) avec révélations progressives et quiz tiers payant dédié (14 questions)',
          'Remboursement optique en France : conditions de remboursement, Sécu/mutuelle/100% Santé',
          'Mutuelles et INAMI (Belgique) : réponses anonymes, révélation progressive, données à jour',
          'Atelier "prise en charge" — simulation de l\'app de vente en magasin (LPTSale), tuile "Nouveau · Test" sur le dashboard',
          'Entraînement oral sur le module Bases de l\'optique, avec validation formateur en direct',
        ],
      },
      {
        title: 'Quiz — refontes et nouveautés',
        accent: '#a78bfa',
        tag: 'Interactif',
        items: [
          'Quiz Jour 1 entièrement refondu (21 questions, nouveaux types de questions interactives)',
          'Quiz final refondu : 30 questions, ordonnances visuelles, questions à choix multiples, corrections',
          'Quiz culture d\'entreprise (10 questions texte libre, auto-validation, page de transition)',
          'Quiz Optique : refonte de nombreuses questions + lecture d\'ordonnance en texte libre',
          'Quiz Montures et Quiz Types de verres : nouvelles questions texte libre',
          'Quiz tiers payant (14 questions) sur le module parcours remboursés',
          'Quiz "réponses libres" générique disponible dans tous les modules : le formateur pose une question à l\'oral, les formés répondent sur mobile, correction ✓/✗ en direct, avec correcteur orthographique intégré',
        ],
      },
      {
        title: 'Jeux entre formés & mini-jeux',
        accent: '#c084fc',
        tag: 'Interactif',
        items: [
          'Jeu de questions entre formés (peer quiz) en Journée 2 — chacun interroge les autres, révision des acquis',
          'Mini-jeu débrief collectif : observateurs + diffusion TV anonyme',
          'Tirage au sort du vendeur sans répétition (pool tournant) pour les mises en situation',
        ],
      },
      {
        title: 'Diffuseur TV & vie de salle',
        accent: '#f472b6',
        tag: 'Amélioration',
        items: [
          'Bouton QR flottant fiable sur toutes les pages formateur (lit l\'état réel depuis Supabase)',
          'Outil annotation (stylo/gomme) directement sur l\'écran diffuseur',
          'Bulle de questions des formés (FAQ) : anonyme sur TV, gérable question par question côté formateur (mettre en avant / marquer traitée)',
          'Alertes distraction : 8 messages humoristiques aléatoires envoyés aux formés qui décrochent',
          'Suivi de présence des formés en temps réel (détection d\'onglet inactif)',
          'QR code en overlay sur le diffuseur au lieu d\'un écran plein',
        ],
      },
      {
        title: 'Sonnette connectée',
        accent: '#f59e0b',
        tag: 'Nouveau',
        items: [
          'Page d\'arrivée des participants + moniteur formateur en temps réel',
          'Onglet Historique affichant l\'heure d\'arrivée de chaque formé',
          'Bouton sourdine dans le panneau formateur (le réglage reste en mémoire d\'une session à l\'autre)',
        ],
      },
      {
        title: 'Belgique',
        accent: '#f9a8d4',
        tag: 'Contenu',
        items: [
          'Onboarding Belgique indépendant avec sa propre progression par journée',
          'Catégorie Belgique désormais distincte de Visio Province dans les entrées de la semaine',
          'Fiche récap Belgique complète (8 modules, design dark LPT)',
          'Journée 4 terrain Belgique (binôme CVO + MO/SAV retraits et SAV)',
          'Jeu de questions entre formés (peer quiz) ajouté à l\'onboarding belge',
        ],
      },
      {
        title: 'Fiches pratiques & partage',
        accent: '#38bdf8',
        tag: 'Amélioration',
        items: [
          'Fiches pratiques France et Belgique : refonte visuelle identique, export PDF propre en A4 paysage sans coupure au milieu des blocs',
          'Bouton "Partager" : envoi par email aux formés, par groupe, avec texte prédéfini',
          'Thème sombre conservé dans les exports PDF',
        ],
      },
      {
        title: 'Idées',
        accent: '#facc15',
        tag: 'Amélioration',
        items: [
          'Stockage des idées migré vers Supabase — partagé entre tous les formateurs (plus de stockage local par formateur)',
          'Workflow de vote + validation des idées proposées',
          'Nouvel onglet "Idées faites" : une idée validée passe en "fait" au lieu d\'être supprimée',
        ],
      },
      {
        title: 'Mobile, PWA & dashboard',
        accent: '#4ade80',
        tag: 'Confort',
        items: [
          'Ajout de l\'app sur l\'écran d\'accueil iPhone (icône + bannière plein écran, instructions iOS/Android)',
          'Mode portrait plein écran et boutons tactiles repositionnés sur mobile',
          'Dark mode complet sur tout le dashboard (idées, planning, vues secondaires)',
          'Onglet global "Avis formation" multi-semaines sur le dashboard formateur',
        ],
      },
      {
        title: 'Quiz — système de correction généralisé partout',
        accent: '#fbbf24',
        tag: 'Gros chantier',
        items: [
          'Le système "révéler la correction" du quiz Bases de l\'optique (auto-révélation dès que tout le monde a répondu + bouton manuel + stats + liste confidentielle des mauvaises réponses) est maintenant présent sur TOUS les quiz : Offres, PDM, Verre progressif, Types de verres, Montures, Ajustages, Retraits, Quiz J1, Quiz final, Remboursement France / tiers payant',
          'Fonctionne aussi pour les questions à réponse libre (texte), pas seulement les QCM, partout',
          'Sur les questions avec ordonnance/visuel, le formateur peut le rediffuser sur le diffuseur pendant la correction',
          'Nouveaux types de questions réutilisables dans tous les quiz : plusieurs cases à remplir en une fois (ex. "citez les 5 points clés"), et questions "par paires" ligne par ligne (ex. "problème de vue → définition")',
          'Sur les questions à double sélection (qcm-multi), impossible d\'envoyer sa réponse tant que le bon nombre de cases n\'est pas coché, partout',
          'Fix : sur le diffuseur, la bonne réponse ne se surlignait jamais pour les questions à double sélection',
        ],
      },
      {
        title: 'Module Montures',
        accent: '#00abe9',
        tag: 'Nouveau',
        items: [
          'Nouvelle première page : question ouverte "d\'après vous, les montures sont fabriquées avec quels matériaux ?" — réponses des formés diffusées en direct sur TV, même système que Culture d\'entreprise',
          'Suppression du quiz de fin de module',
          'Page injecté : rappel du lien avec les lunettes à 10 € fabriquées en 10 minutes',
        ],
      },
      {
        title: 'Module Types de verres',
        accent: '#7c3aed',
        tag: 'Contenu & fix',
        items: [
          'Délais de fabrication (24/48h France vs 9 jours Rodenstock) affichés sur le diffuseur pour le verre progressif',
          'Questions retravaillées : origine des verres 9 jours, client à recommander en progressif, délai en deux cases (magasins parisiens / autres magasins), vrai-faux presbytie',
          'Fix : page blanche (plantage) au chargement d\'une des questions retravaillées',
          'Fix : bonne réponse corrigée sur la question du client myope/astigmate de 28 ans (Faux, pas Vrai)',
        ],
      },
      {
        title: 'Quiz Jour 1',
        accent: '#a78bfa',
        tag: 'Contenu & fix',
        items: [
          'Question fondateurs : ne valide que si Paul Morlet ET Xavier Niel sont cités ensemble',
          'Question "5 points clés" et "4 problèmes de vue" passées aux nouveaux systèmes à cases multiples / par paires',
          'Question puissances maximales : remplacée par deux roulettes tactiles (positif / négatif) au lieu d\'une réponse texte',
          'Fix : page blanche (plantage) sur ces nouvelles questions',
        ],
      },
      {
        title: 'Bases de l\'optique — page "Lire une ordonnance"',
        accent: '#f472b6',
        tag: 'Fix & nouveau',
        items: [
          'Le téléphone du formé est maintenant parfaitement synchronisé avec le diffuseur (avant, tout apparaissait d\'un coup côté formé sans attendre le formateur)',
          'Bouton "Expliquer le sens du cylindre et de l\'axe" déplacé — il était caché derrière la barre de navigation',
          'Nouveau : un rapporteur (0° à 180°) sur le diffuseur suit en direct l\'axe déplacé par le formateur pendant cette démo',
          'Sens des roulettes de saisie (sphère/cylindre) inversé : le moins en haut, le plus en bas',
        ],
      },
      {
        title: 'Exercice "saisie interactive" (3 cas)',
        accent: '#34d399',
        tag: 'Amélioration',
        items: [
          'Une fois la réponse vérifiée, elle est verrouillée (impossible de la modifier) et l\'exercice passe automatiquement au cas suivant après quelques secondes',
          'Le comptage se fait par cas juste/faux plutôt que par champ, et les messages n\'affichent plus de scores chiffrés',
          'Mise en page corrigée pour que le bouton reste toujours accessible sans avoir à faire défiler l\'écran (risque de modifier une roulette par erreur en descendant)',
        ],
      },
      {
        title: 'Questions ouvertes des modules (hors quiz)',
        accent: '#f59e0b',
        tag: 'Fix',
        items: [
          'Freins à l\'achat, Prix moyen, Promesse, Ventes opticien, Montures/matériaux, Retour terrain et Jeu d\'objections (Verre progressif) : les réponses ne s\'affichent plus automatiquement sur le diffuseur dès que tout le monde a répondu',
          'Il faut désormais que le formateur clique sur "Afficher les réponses sur TV" pour garder la main sur le bon moment de révélation',
        ],
      },
    ],
  },
  {
    id: '2026-07-02',
    date: '2 juillet 2026',
    title: 'Animation 0 intermédiaire · Offres Classique · Mises à jour contenu',
    tag: 'Améliorations',
    tagColor: '#00abe9',
    sections: [
      {
        title: 'Animation « 0 intermédiaire » — refonte complète',
        accent: '#f472b6',
        tag: 'Nouveau',
        items: [
          'L\'animation est maintenant intégrée directement dans la page "Ce qui fait la force de LPT" — plus de page séparée',
          'Le formateur clique sur "0 intermédiaire" dans la liste : un panneau apparaît à côté avec l\'animation en aperçu',
          'Sur le diffuseur : 3 points colorés apparaissent un par un sur la chaîne rouge, puis chaque segment et chaque point s\'envole dans une direction différente',
          'La chaîne LPT bleue (DIRECT · Prix réduits ✓) prend le dessus après le brise',
          'L\'animation boucle automatiquement toutes les ~8 secondes — aucun clic nécessaire',
        ],
      },
      {
        title: 'Offre Classique — synchronisation avec le diffuseur',
        accent: '#00abe9',
        tag: 'Fix',
        items: [
          'Les caractéristiques de l\'offre Classique s\'affichent maintenant progressivement sur le diffuseur au rythme du formateur (comme le 1=1)',
          'Avant ce fix, le diffuseur affichait tout d\'un coup sans attendre le formateur',
          'Mise en page unifiée avec le 1=1 : tarifs à gauche, items à droite avec barre de progression',
          'Les items non encore révélés sont invisibles sur le diffuseur (les collaborateurs ne voient rien en avance)',
        ],
      },
      {
        title: 'Corrections contenu',
        accent: '#4ade80',
        tag: 'Contenu',
        items: [
          'Suppression du badge "Sans remboursement" sur les offres Classique et 1=1 (diffuseur)',
          'Suppression des sous-titres sur les items de l\'offre Classique',
          'Compteur "Volume de ventes" : 2 000 → 5 000 paires vendues par jour',
          'Nouvelle vidéo machines (V2) sur la page "Ce qui fait la force de LPT"',
        ],
      },
    ],
  },
  {
    id: '2026-06-24',
    date: '24 juin 2026',
    title: 'Réveil des acquis & FAQ anonyme',
    tag: 'Nouveau module',
    tagColor: '#f59e0b',
    sections: [
      {
        title: 'Aperçu de la slide suivante',
        accent: '#00abe9',
        tag: 'Navigation',
        items: [
          'Une carte discrète apparaît au-dessus des boutons Précédent / Suivant sur l\'écran formateur',
          'Elle affiche le titre et le type de la prochaine slide — plus besoin de mémoriser l\'ordre',
          'Déployée sur tous les modules : Optique, PDM, Types de verres, Offres, Progressif, Entreprise',
        ],
      },
      {
        title: 'Réveil des acquis',
        accent: '#f59e0b',
        tag: 'Nouveau',
        items: [
          'Nouvelle tuile dédiée dans la grille des modules, aux côtés des Journées 1, 2 et 3',
          'Le formateur choisit la journée à consolider (J1, J2 ou J3) avant de lancer l\'activité',
          'Le QR code de connexion s\'affiche automatiquement sur la TV au clic de la tuile',
        ],
      },
      {
        title: 'FAQ anonyme',
        accent: '#a78bfa',
        tag: 'Interactif',
        roles: [
          { icon: '📱', label: 'Participant', color: '#a78bfa', desc: 'Un champ de saisie apparaît automatiquement sur le téléphone. La question est envoyée anonymement. Un bouton « Poser une autre question ? » permet d\'en ajouter plusieurs à la suite.' },
          { icon: '📺', label: 'Diffuseur (TV)', color: '#a78bfa', desc: 'Les questions s\'affichent en nuage de bulles. Quand le formateur met une question en avant, sa bulle grossit avec un effet lumineux.' },
          { icon: '🎓', label: 'Formateur', color: '#a78bfa', desc: 'Liste des questions dans l\'ordre d\'arrivée. Deux actions : Mettre en avant (met en lumière la bulle sur TV) et Traitée ✓ (supprime la question partout).' },
        ],
      },
      {
        title: 'Corrections & fiabilité',
        accent: '#4ade80',
        tag: 'Fixes',
        items: [
          'Aperçu de slide suivante absent sur le module Bases de l\'optique — chaque sous-composant de page ne transmettait pas la prop au composant de navigation',
          'Participants bloqués sur l\'écran d\'attente lors du FAQ — ParticipantView n\'interceptait pas la FAQ quand aucun module de cours n\'était actif',
          'Délai de synchronisation réduit de 5 s à 1,2 s dès qu\'une session FAQ est ouverte',
        ],
      },
    ],
  },
]

function AppUpdateModal({ update, onClose }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '20px',
      }}
    >
      <div style={{
        background: '#0a1628', borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%', maxWidth: 680,
        margin: '0 auto',
        padding: '40px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>
              Formation LPT · Mise à jour
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>{update.date}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{update.title}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)', width: 36, height: 36, borderRadius: 10,
            fontSize: 18, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {update.sections.map((sec, si) => (
            <div key={si} style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(255,255,255,0.07)`,
              borderLeft: `4px solid ${sec.accent}`,
              borderRadius: 16, padding: '22px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{sec.title}</div>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase',
                  background: sec.accent + '18', color: sec.accent,
                  border: `1px solid ${sec.accent}30`, borderRadius: 20, padding: '3px 10px',
                }}>{sec.tag}</span>
              </div>

              {sec.items && sec.items.map((item, ii) => (
                <div key={ii} style={{ display: 'flex', gap: 12, marginBottom: ii < sec.items.length - 1 ? 10 : 0 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: sec.accent, flexShrink: 0, marginTop: 6 }} />
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55 }}>{item}</div>
                </div>
              ))}

              {sec.roles && sec.roles.map((role, ri) => (
                <div key={ri} style={{
                  display: 'flex', gap: 12, padding: '12px 16px',
                  background: 'rgba(255,255,255,0.03)', borderRadius: 12,
                  marginBottom: ri < sec.roles.length - 1 ? 10 : 0,
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{role.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: role.color, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 }}>{role.label}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{role.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Liste de toutes les mises à jour — ouverte depuis l'éclair ⚡ de la barre du
// haut (plus de tuile dédiée dans le tableau de bord, ça prenait trop de place).
function AppUpdatesListModal({ onClose, onSelect }) {
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '20px',
      }}
    >
      <div style={{
        background: '#0a1628', borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%', maxWidth: 560,
        margin: '0 auto',
        padding: '32px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚡</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Mises à jour de l'app</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Nouveautés et corrections</div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)', width: 32, height: 32, borderRadius: 10,
            fontSize: 16, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {APP_UPDATES.map(u => (
            <div
              key={u.id}
              onClick={() => onSelect(u)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)',
                cursor: 'pointer', transition: 'all .15s',
              }}
              onMouseOver={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.1)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)' }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.05)'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.15)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', minWidth: 90 }}>{u.date}</span>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{u.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: u.tagColor,
                  background: u.tagColor + '18', border: `1px solid ${u.tagColor}30`,
                  borderRadius: 20, padding: '2px 8px', whiteSpace: 'nowrap',
                }}>{u.tag}</span>
                <span style={{ fontSize: 13, color: '#a78bfa', fontWeight: 600 }}>→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Vue Idées ─────────────────────────────────────────────────────
const MODULE_OPTIONS = Object.entries(MODULE_DATA).map(([id, m]) => ({ id, label: m.label }))

function AddIdeeModal({ pName, onClose, onSaved }) {
  const [text, setText] = useState('')
  const [moduleId, setModuleId] = useState('__libre__')
  const [themeLibre, setThemeLibre] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isLibre = moduleId === '__libre__'
  const moduleLabel = isLibre
    ? (themeLibre.trim() || 'Thème libre')
    : (MODULE_DATA[moduleId]?.label || moduleId)
  const canSave = text.trim() && (!isLibre || themeLibre.trim())

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await addIdee({ text, moduleId: isLibre ? 'libre' : moduleId, moduleLabel, auteur: pName || 'Formateur' })
      setSaved(true)
      setTimeout(() => { onSaved(); onClose() }, 800)
    } finally { setSaving(false) }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '28px 32px', width: 520, maxWidth: '94vw', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>💡 Ajouter une idée</div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Sélecteur module */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Module / Thème</div>
          <select
            value={moduleId}
            onChange={e => setModuleId(e.target.value)}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 13,
              fontFamily: 'inherit', outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="__libre__" style={{ background: '#0d1f3c' }}>✏️ Thème libre (à préciser)</option>
            <optgroup label="── Modules ──" style={{ background: '#0d1f3c' }}>
              {MODULE_OPTIONS.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#0d1f3c' }}>{m.label}</option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Champ thème libre */}
        {isLibre && (
          <div style={{ marginBottom: 14 }}>
            <input
              autoFocus
              value={themeLibre}
              onChange={e => setThemeLibre(e.target.value)}
              placeholder="Ex : Accueil téléphonique, suivi client…"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(245,158,11,0.4)',
                borderRadius: 10, padding: '11px 14px', color: '#fff', fontSize: 13,
                fontFamily: 'inherit', outline: 'none',
              }}
            />
          </div>
        )}

        {/* Idée */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Idée</div>
          <textarea
            autoFocus={!isLibre}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Décrivez votre idée…"
            rows={4}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 12, padding: '14px 16px', resize: 'vertical',
              color: '#fff', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.6, outline: 'none',
            }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave() }}
          />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 6 }}>⌘/Ctrl + Entrée pour enregistrer</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            style={{
              background: saved ? 'rgba(74,222,128,0.2)' : canSave ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(255,255,255,0.08)',
              border: saved ? '1px solid rgba(74,222,128,0.4)' : 'none',
              color: saved ? '#4ade80' : canSave ? '#fff' : 'rgba(255,255,255,0.3)',
              padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              cursor: canSave ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'all .2s',
            }}
          >
            {saved ? '✓ Enregistrée !' : saving ? '…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}

function IdeesView({ onBack, pName }) {
  const [idees, setIdees] = useState([])
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState('pending') // 'pending' | 'validated'
  const [showAdd, setShowAdd] = useState(false)

  const refresh = async () => {
    const data = await loadIdeesFromSupabase()
    setIdees(data)
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleVote = async (id, vote) => { await voteIdee(id, pName || 'Formateur', vote); refresh() }
  const handleValidate = async (id) => { await updateIdee(id, { status: 'validated' }); refresh() }
  const handleReject = async (id) => { await deleteIdee(id); refresh() }
  const handleDone = async (id) => { await updateIdee(id, { status: 'done', doneAt: new Date().toISOString() }); refresh() }

  const pending = idees.filter(i => !i.status || i.status === 'pending')
  const validated = idees.filter(i => i.status === 'validated')
  const done = idees.filter(i => i.status === 'done')

  const formatDate = (ts) => {
    try {
      const d = new Date(ts)
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        + ' · ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  const groupByModule = (list) => list.reduce((acc, idee) => {
    const mKey = idee.moduleLabel || idee.moduleId || 'Module inconnu'
    if (!acc[mKey]) acc[mKey] = {}
    const pKey = idee.pageLabel || 'Page inconnue'
    if (!acc[mKey][pKey]) acc[mKey][pKey] = []
    acc[mKey][pKey].push(idee)
    return acc
  }, {})

  const pendingGrouped = groupByModule(pending)
  const validatedGrouped = groupByModule(validated)
  const doneGrouped = groupByModule(done)

  const VoteBtn = ({ idee, side }) => {
    const votes = idee.votes || { ok: [], pas_ok: [] }
    const list = votes[side] || []
    const mine = list.includes(pName || 'Formateur')
    const isOk = side === 'ok'
    return (
      <button
        onClick={() => handleVote(idee.id, side)}
        title={isOk ? 'Je suis OK' : 'Je ne suis pas OK'}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
          background: mine
            ? (isOk ? 'rgba(74,222,128,0.18)' : 'rgba(239,68,68,0.18)')
            : 'rgba(255,255,255,0.06)',
          border: mine
            ? (isOk ? '1px solid rgba(74,222,128,0.45)' : '1px solid rgba(239,68,68,0.45)')
            : '1px solid rgba(255,255,255,0.12)',
          color: mine ? (isOk ? '#4ade80' : '#f87171') : 'var(--text-s)',
        }}
      >
        {isOk ? '👍' : '👎'} {list.length > 0 ? list.length : ''}
        {list.length > 0 && (
          <span style={{ fontSize: 10, opacity: 0.7 }}>({list.join(', ')})</span>
        )}
      </button>
    )
  }

  const IdeeCard = ({ idee, status }) => (
    <div style={{
      background: 'var(--bg)', borderRadius: 12,
      border: `1px solid ${status === 'done' ? 'rgba(0,171,233,0.2)' : status === 'validated' ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`,
      borderLeft: `3px solid ${status === 'done' ? '#00abe9' : status === 'validated' ? '#4ade80' : 'rgba(245,158,11,0.5)'}`,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: status === 'done' ? 'var(--text-s)' : 'var(--text)', lineHeight: 1.6, marginBottom: 6, textDecoration: status === 'done' ? 'line-through' : 'none' }}>
            {idee.text}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {idee.auteur && (
              <span style={{ fontSize: 11, color: 'var(--text-s)' }}>👤 {idee.auteur}</span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-s)' }}>🕐 {formatDate(idee.timestamp)}</span>
            {status === 'done' && idee.doneAt && (
              <span style={{ fontSize: 11, color: '#00abe9', fontWeight: 600 }}>✓ Fait le {formatDate(idee.doneAt)}</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {status === 'pending' && (
          <>
            <VoteBtn idee={idee} side="ok" />
            <VoteBtn idee={idee} side="pas_ok" />
            <div style={{ flex: 1 }} />
            <button onClick={() => handleValidate(idee.id)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80' }}>✅ On le fait</button>
            <button onClick={() => handleReject(idee.id)} style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)', color: '#f87171' }}>❌ On fait pas</button>
          </>
        )}
        {status === 'validated' && (
          <>
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>✓ Validée</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => handleDone(idee.id)} style={{ padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'rgba(0,137,186,0.14)', border: '1px solid rgba(0,137,186,0.4)', color: '#00abe9' }}>✓ C'est fait !</button>
          </>
        )}
        {status === 'done' && (
          <span style={{ fontSize: 11, color: '#00abe9', fontWeight: 600 }}>✅ Réalisée</span>
        )}
      </div>
    </div>
  )

  const renderGrouped = (grouped, status) => {
    const COLORS = {
      pending:   { bg: 'rgba(245,158,11,0.06)',  border: 'rgba(245,158,11,0.15)',  badge: 'rgba(245,158,11,0.12)',  badgeBorder: 'rgba(245,158,11,0.25)',  badgeColor: '#d97706', empty: '💡' },
      validated: { bg: 'rgba(74,222,128,0.04)',  border: 'rgba(74,222,128,0.12)',  badge: 'rgba(74,222,128,0.1)',   badgeBorder: 'rgba(74,222,128,0.25)',   badgeColor: '#4ade80', empty: '🎯' },
      done:      { bg: 'rgba(0,171,233,0.04)',   border: 'rgba(0,171,233,0.12)',   badge: 'rgba(0,171,233,0.1)',    badgeBorder: 'rgba(0,171,233,0.25)',    badgeColor: '#00abe9', empty: '✅' },
    }
    const c = COLORS[status] || COLORS.pending
    const emptyMessages = {
      pending:   { title: 'Aucune idée en attente', sub: 'Utilisez le bouton 💡 durant les modules pour noter des idées' },
      validated: { title: 'Aucune idée validée pour l\'instant', sub: 'Validez des idées depuis l\'onglet "En attente de vote"' },
      done:      { title: 'Aucune idée réalisée pour l\'instant', sub: 'Cliquez sur "C\'est fait !" dans l\'onglet "Validées à réaliser"' },
    }
    const entries = Object.entries(grouped)
    if (entries.length === 0) return (
      <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-s)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{c.empty}</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{emptyMessages[status]?.title}</div>
        <div style={{ fontSize: 13 }}>{emptyMessages[status]?.sub}</div>
      </div>
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {entries.map(([moduleLabel, pages]) => (
          <div key={moduleLabel} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', background: c.bg, borderBottom: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{moduleLabel}</span>
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 10px', background: c.badge, border: `1px solid ${c.badgeBorder}`, color: c.badgeColor }}>
                {Object.values(pages).flat().length} idée{Object.values(pages).flat().length > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(pages).map(([pageLabel, pageIdees]) => (
                <div key={pageLabel}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                    {pageLabel}
                    <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pageIdees.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1).map(idee => (
                      <IdeeCard key={idee.id} idee={idee} status={status} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) return (
    <div className="dash-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ color: 'var(--text-s)', fontSize: 14 }}>Chargement des idées…</div>
    </div>
  )

  return (
    <div className="dash-wrap">
      {showAdd && <AddIdeeModal pName={pName} onClose={() => setShowAdd(false)} onSaved={refresh} />}
      <button className="detail-back" onClick={onBack}>← Retour au tableau de bord</button>

      <div className="dash-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>💡 Idées</h2>
          <p style={{ color: 'var(--text-s)', fontSize: 14 }}>
            {pending.length} en attente · {validated.length} validée{validated.length > 1 ? 's' : ''} · {done.length} réalisée{done.length > 1 ? 's' : ''} · <span style={{ opacity: 0.5 }}>sync toutes les 10s</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              background: 'linear-gradient(135deg, #d97706, #f59e0b)', border: 'none',
              color: '#fff', borderRadius: 10, padding: '8px 18px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(245,158,11,0.35)',
            }}
          >💡 Ajouter une idée</button>
          {idees.length > 0 && (
            <button
              onClick={async () => { if (window.confirm('Supprimer toutes les idées ?')) { await clearAllIdees(); setIdees([]) } }}
              style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', borderRadius: 10, padding: '8px 16px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Tout effacer</button>
          )}
        </div>
      </div>

      {/* Sous-onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--card)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
        {[
          { key: 'pending',   label: '💡 En attente de vote',  count: pending.length,   activeColor: 'rgba(245,158,11,0.15)', activeBorder: 'rgba(245,158,11,0.35)', activeText: '#f59e0b', badgeBg: 'rgba(245,158,11,0.2)' },
          { key: 'validated', label: '🎯 Validées à réaliser', count: validated.length, activeColor: 'rgba(74,222,128,0.15)', activeBorder: 'rgba(74,222,128,0.35)', activeText: '#4ade80', badgeBg: 'rgba(74,222,128,0.2)' },
          { key: 'done',      label: '✅ Idées faites',         count: done.length,      activeColor: 'rgba(0,171,233,0.15)', activeBorder: 'rgba(0,171,233,0.35)', activeText: '#00abe9', badgeBg: 'rgba(0,171,233,0.2)' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            style={{
              padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              background: subTab === tab.key ? tab.activeColor : 'transparent',
              border: subTab === tab.key ? `1px solid ${tab.activeBorder}` : '1px solid transparent',
              color: subTab === tab.key ? tab.activeText : 'var(--text-s)',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, background: subTab === tab.key ? tab.badgeBg : 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '1px 7px' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'pending'   && renderGrouped(pendingGrouped,   'pending')}
      {subTab === 'validated' && renderGrouped(validatedGrouped, 'validated')}
      {subTab === 'done'      && renderGrouped(doneGrouped,      'done')}
    </div>
  )
}

const FICHES = [
  { label: 'Fiche pratique', href: '/fiche-pratique', icon: '📄', color: '#c9a227', sub: 'Synthèse de la formation' },
  { label: 'Fiche SAV', href: '/fiche-sav', icon: '🔧', color: '#f87171', sub: 'Retraits · Ajustages · RAZ' },
  { label: 'Fiche Belgique', href: '/fiche-belgique', icon: '🇧🇪', color: '#e63946', sub: 'Onboarding belge récap' },
  { label: 'Fiche accès LPT', href: '/fiche-acces', icon: '🔑', color: '#0089ba', sub: 'Gmail · Slack · LPTBot' },
  { label: 'Fiche Contrôle Qualité', href: '/fiche-controle-qualite', icon: '🔍', color: '#06b6d4', sub: 'Montures · Verres unifocal & progressif' },
]

function FichesAnnexesWidget() {
  return (
    <div className="dash-tile" style={{ cursor: 'default' }}>
      <div className="dash-tile-top">
        <div className="dash-tile-icon">📎</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.4px' }}>Fiches annexes</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {FICHES.map(f => (
          <button
            key={f.label}
            onClick={() => window.open(f.href, '_blank', 'noopener,noreferrer')}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.07)',
              borderRadius: 10, padding: '9px 12px', cursor: 'pointer',
              transition: 'all .18s', width: '100%', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.10)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.15)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,.07)' }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: 7, flexShrink: 0,
              background: `rgba(${f.color === '#c9a227' ? '201,162,39' : f.color === '#0089ba' ? '0,137,186' : '74,222,128'},0.15)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            }}>
              {f.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.3)', marginTop: 1 }}>{f.sub}</div>
            </div>
            <span style={{ fontSize: 11, color: f.color, flexShrink: 0 }}>↗</span>
          </button>
        ))}
      </div>
    </div>
  )
}


export default function Dashboard({ pName, onLaunchSession, onLaunchModule, onOpenRoom, onOpenTv, onToast, onOnlineCount, onOpenPlanning }) {
  const [activeView, setActiveView] = useState('home') // home | sessions | entrees | modules | onboarding | onboarding-belgique | planning | retour-formation | auto-eval | global-ratings | free-quiz
  const [entreeCount, setEntreeCount] = useState(null)
  const [globalAvgRating, setGlobalAvgRating] = useState(null)
  const [sessionCount, setSessionCount] = useState('—')
  const [sessionLast, setSessionLast] = useState('Chargement…')
  const [selectedUpdate, setSelectedUpdate] = useState(null)
  const [showUpdatesList, setShowUpdatesList] = useState(false)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [roomLoading, setRoomLoading] = useState(false)
  const [activeRoomCode, setActiveRoomCode] = useState('')

  const [obDay, setObDay] = useState('1')
  const [obReturnJournee, setObReturnJournee] = useState(null)
  const [obReturnView, setObReturnView] = useState('onboarding')
  const [ideeCount, setIdeeCount] = useState(0)
  const [penseBeteTodoCount, setPenseBeteTodoCount] = useState(0)
  const [showSonnette, setShowSonnette] = useState(false)
  const [sonnettePending, setSonnettePending] = useState(0)
  const [trainerMode, setTrainerModeState] = useState(null)
  useEffect(() => {
    const saved = readTrainerMode()
    if (saved) {
      setTrainerModeState(saved)
      return
    }
    // Thomas anime exclusivement en Belgique — pré-sélectionné par défaut
    // tant qu'il n'a jamais choisi de mode lui-même.
    const rawKey = (pName || '').toLowerCase().split(' ')[0]
    const key = TRAINER_CANONICAL[rawKey] || rawKey
    if (key === 'thomas') {
      setTrainerMode('belgique')
      setTrainerModeState('belgique')
    }
  }, [pName])
  const handleTrainerModeChange = (slug) => {
    setTrainerMode(slug)
    setTrainerModeState(slug)
  }
  useEffect(() => {
    loadIdeesFromSupabase().then(list => setIdeeCount(list.length)).catch(() => {})
  }, [])

  const refreshPenseBeteCount = () => {
    try { setPenseBeteTodoCount(getPenseBeteTasks(pName).filter(t => !t.done).length) } catch {}
  }
  useEffect(() => { refreshPenseBeteCount() }, [pName])

  useEffect(() => {
    loadTileStats()
    refreshActiveRoom()
    const interval = setInterval(() => {
      loadTileStats()
      refreshActiveRoom()
    }, 15000)
    return () => clearInterval(interval)
  }, [pName])

  // Lundi 00h00 de la semaine de `d` — une salle démarrée avant cette date
  // vient d'une semaine précédente, donc oubliée/abandonnée.
  const startOfWeek = (d) => {
    const day = d.getDay()
    const diff = (day === 0 ? -6 : 1) - day
    const monday = new Date(d)
    monday.setDate(d.getDate() + diff)
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  // Dernière activité RÉELLE d'une salle (dernier passage formé, dernière
  // réponse quiz) — jamais started_at seul : une salle peut être créée il y a
  // plusieurs semaines et rester activement utilisée en continu (le
  // formateur ne la clôture pas systématiquement chaque vendredi). Se fier à
  // started_at a fait fermer une salle IDF en pleine utilisation (incident du
  // 13/08) — plus jamais sans preuve positive d'inactivité.
  const lastRoomActivity = async (code) => {
    const [participants, answers] = await Promise.all([
      sbSelect('participants', `session_code=eq.${encodeURIComponent(code)}&order=last_seen_at.desc&limit=1`),
      sbSelect('quiz_answers', `session_code=eq.${encodeURIComponent(code)}&order=created_at.desc&limit=1`),
    ])
    const dates = [participants?.[0]?.last_seen_at, answers?.[0]?.created_at]
      .filter(Boolean)
      .map(d => new Date(d))
    return dates.length ? new Date(Math.max(...dates)) : null
  }

  const refreshActiveRoom = async () => {
    const login = trainerLoginFromDisplayName(pName)
    const room = await findActiveRoomForTrainer(login, pName)
    const code = room?.code || ''
    setTrainerActiveRoomCode(code)

    // Clôture automatique d'une salle oubliée d'une semaine précédente (ex: pas
    // clôturée le vendredi) — les retours de formation restent accessibles quoi
    // qu'il arrive (indépendants du statut de la salle, cf. formation_reports +
    // repli archive), donc rien n'est perdu à la clôturer sans repasser par le
    // formateur. Ne se déclenche QUE si on a une preuve positive de dernière
    // activité antérieure à cette semaine — sans preuve, on ne touche à rien.
    if (code) {
      const lastActivity = await lastRoomActivity(code)
      if (lastActivity && lastActivity < startOfWeek(new Date())) {
        await endActiveRoom(code, { trainerName: pName })
        setTrainerActiveRoomCode('')
        setActiveRoomCode('')
        onToast?.('Salle de la semaine dernière clôturée automatiquement')
        return
      }
    }
    setActiveRoomCode(code)
  }

  useEffect(() => {
    const onFocus = () => { refreshActiveRoom() }
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshActiveRoom()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [pName])

  const handleOpenRoomClick = async () => {
    const login = trainerLoginFromDisplayName(pName)
    const existing = await findActiveRoomForTrainer(login, pName)
    if (existing?.code) {
      onOpenRoom?.({ code: existing.code, resumed: true })
      return
    }
    // Mode formateur déjà choisi (présentiel/visio/Belgique, persistant) :
    // on ouvre direct la salle sans redemander la catégorie. trainerMode est
    // une ZONE ('paris'/'province'/'belgique', cf. trainerMode.js) — à
    // convertir en categorySlug ('presentiel'/'visio'/'belgique') avant
    // d'appeler handleConfirmRoom, sinon openOrCreateRoom rejette 'paris'/
    // 'province' comme catégorie invalide (incident du 18/08).
    if (trainerMode) {
      handleConfirmRoom(categorySlugFromZone(trainerMode))
      return
    }
    setRoomModalOpen(true)
  }

  const handleConfirmRoom = async (categorySlug) => {
    setRoomLoading(true)
    try {
      const login = trainerLoginFromDisplayName(pName)
      const result = await openOrCreateRoom({
        trainerLogin: login,
        trainerName: pName,
        categorySlug,
      })
      setActiveRoomCode(result.code)
      setRoomModalOpen(false)
      onToast?.(result.created ? `Salle ${result.code} créée` : `Salle ${result.code} reprise`)
      onOpenRoom?.({ code: result.code, resumed: !result.created, created: result.created })
    } catch (e) {
      console.error(e)
      onToast?.(`Impossible d'ouvrir la salle — ${e.message || 'erreur inconnue'}`)
    } finally {
      setRoomLoading(false)
    }
  }

  // Chargement séparé de la note globale (isolé des autres requêtes)
  useEffect(() => {
    const loadGlobalRating = async () => {
      try {
        const data = await sbSelect('formation_reports', 'trainer_name=eq.__auto_eval__')
        const ratings = (data || [])
          .filter(r => !isTrainerAccount(r.collaborateur))
          .map(r => r.stats_snapshot?.auto_eval?.rating)
          .filter(Boolean)
        if (ratings.length) {
          const avg = Math.round((ratings.reduce((s, v) => s + v, 0) / ratings.length) * 10) / 10
          setGlobalAvgRating({ avg, count: ratings.length })
        } else {
          setGlobalAvgRating(null)
        }
      } catch (e) {
        console.error('[Dashboard] global rating', e)
      }
    }
    loadGlobalRating()
    const t = setInterval(loadGlobalRating, 30000)
    return () => clearInterval(t)
  }, [])

  const loadTileStats = async () => {
    try {
      const [state, history, answers] = await Promise.all([
        getSharedState(),
        sbSelect('session_history'),
        sbSelect('quiz_answers'),
      ])
      const entrees = state.entrees_data || JSON.parse(localStorage.getItem('entrees_data') || '[]')
      setEntreeCount(entrees.length || '—')
      setObDay(state.ob_day || localStorage.getItem('ob_day') || '1')
      const sessionLen = history?.length || 0
      const quizParticipants = new Set((answers || []).map(a => a.collaborateur)).size
      const total = sessionLen + quizParticipants
      setSessionCount(total || 0)
      if (sessionLen) {
        const last = history[history.length - 1]
        const d = new Date(last.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        setSessionLast(`Dernière : ${d}`)
      } else if (quizParticipants) {
        setSessionLast(`${quizParticipants} participant${quizParticipants > 1 ? 's' : ''} au quiz`)
      } else {
        setSessionLast('Aucune session enregistrée')
      }
    } catch {}
  }

  if (activeView === 'sessions') {
    return (
      <div id="dashboard">
        <SessionsHistoryView pName={pName} onBack={() => { setActiveView('home'); loadTileStats() }} onToast={onToast} />
      </div>
    )
  }

  if (activeView === 'entrees') {
    return (
      <div id="dashboard">
        <EntreesView onBack={() => { setActiveView('home'); loadTileStats() }} onToast={onToast} pName={pName} />
      </div>
    )
  }

  if (activeView === 'idees') {
    return <div id="dashboard"><IdeesView onBack={() => setActiveView('home')} pName={pName} /></div>
  }

  if (activeView === 'pense-bete') {
    return (
      <div id="dashboard">
        <PenseBeteView pName={pName} onBack={() => { setActiveView('home'); refreshPenseBeteCount() }} />
      </div>
    )
  }

  if (activeView === 'retour-formation') {
    return (
      <RetourFormationView
        onBack={() => setActiveView('home')}
        pName={pName}
      />
    )
  }

  if (activeView === 'auto-eval') {
    return <AutoEvalView onBack={() => setActiveView('home')} />
  }

  if (activeView === 'global-ratings') {
    return (
      <div id="dashboard">
        <GlobalRatingsView onBack={() => setActiveView('home')} />
      </div>
    )
  }

  if (activeView === 'peer-quiz') {
    return (
      <PeerQuizTrainer
        sessionCode={activeRoomCode}
        onBack={() => setActiveView(obReturnJournee ? obReturnView : 'planning')}
      />
    )
  }

  if (activeView === 'free-quiz') {
    return (
      <div id="dashboard">
        <FreeQuizTrainer onBack={() => setActiveView('modules')} />
      </div>
    )
  }

  if (activeView === 'onboarding-choix') {
    return (
      <div id="dashboard">
        <div className="dash-wrap">
          <button className="detail-back" onClick={() => setActiveView('home')}>← Retour au tableau de bord</button>
          <div className="dash-hero" style={{ marginBottom: 32 }}>
            <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
              <div className="dash-hero-label">Formation · Suivi collaborateurs</div>
              <h2 className="dash-hero-title">ONBOARDING</h2>
              <p className="dash-hero-date">Choisissez le programme de formation</p>
            </div>
            <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, position: 'relative', zIndex: 1 }}>🚀</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* France */}
            <div
              onClick={() => setActiveView('onboarding')}
              style={{
                background: 'linear-gradient(135deg, #03112a 0%, #0a2040 100%)',
                border: '1px solid rgba(0,137,186,0.3)',
                borderRadius: 18, padding: '32px 28px', cursor: 'pointer',
                transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,137,186,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,137,186,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 48 }}>🇫🇷</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Onboarding France</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  Optique · Offres · Prise de mesures · Remboursements
                </div>
              </div>
              <div style={{ marginTop: 'auto', fontSize: 13, fontWeight: 700, color: '#00abe9' }}>Accéder →</div>
            </div>

            {/* Belgique */}
            <div
              onClick={() => setActiveView('onboarding-belgique')}
              style={{
                background: 'linear-gradient(135deg, #1a1200 0%, #3a2800 100%)',
                border: '1px solid rgba(201,162,39,0.3)',
                borderRadius: 18, padding: '32px 28px', cursor: 'pointer',
                transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 48 }}>🇧🇪</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Onboarding Belgique</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  Mutuelles · INAMI · PARTENA · Spécificités belges
                </div>
              </div>
              <div style={{ marginTop: 'auto', fontSize: 13, fontWeight: 700, color: '#c9a227' }}>Accéder →</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (activeView === 'onboarding') {
    const returnJournee = obReturnJournee
    return (
      <div id="dashboard">
        <OnboardingView
          pName={pName}
          onBack={() => { setObReturnJournee(null); setActiveView('onboarding-choix') }}
          onLaunchFormation={onLaunchSession}
          onLaunchModule={onLaunchModule}
          onLaunchPeerQuiz={() => { setObReturnJournee('journee2'); setObReturnView('onboarding'); setActiveView('peer-quiz') }}
          initialStep={returnJournee ? 'modules' : 'select'}
          initialJournee={returnJournee}
          initialGroup={(trainerMode === 'paris' || trainerMode === 'province') ? trainerMode : null}
        />
      </div>
    )
  }

  if (activeView === 'onboarding-belgique') {
    const returnJourneeBelgique = obReturnJournee
    return (
      <div id="dashboard">
        <OnboardingViewBelgique
          pName={pName}
          onBack={() => { setObReturnJournee(null); setActiveView('onboarding-choix') }}
          onLaunchFormation={onLaunchSession}
          onLaunchModule={(moduleId, journeeId) => onLaunchModule(moduleId, 'onboarding-modules-belgique', journeeId)}
          onLaunchPeerQuiz={() => { setObReturnJournee('journee2'); setObReturnView('onboarding-belgique'); setActiveView('peer-quiz') }}
          initialStep={returnJourneeBelgique ? 'modules' : 'list'}
          initialJournee={returnJourneeBelgique}
        />
      </div>
    )
  }

  if (activeView === 'planning') {
    return (
      <div id="dashboard">
        <div className="dash-wrap">
          <button className="detail-back" onClick={() => setActiveView('home')}>← Retour au tableau de bord</button>
          <div className="dash-header" style={{ marginBottom: 28 }}>
            <div>
              <h2 style={{ marginBottom: 4 }}>Planning formation</h2>
              <p style={{ color: 'var(--text-s)', fontSize: 14 }}>Cliquez sur un jour pour l&apos;afficher sur le diffuseur et les téléphones</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {PLANNING_JOURS.map(jour => (
              <div
                key={jour.id}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderTop: `4px solid ${jour.color}`,
                  borderRadius: 'var(--r)', padding: '24px 28px',
                  transition: 'all .2s',
                }}
              >
                {/* En-tête jour */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{jour.jour}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>{jour.label}</div>
                  </div>
                </div>

                {/* Blocs programme */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {jour.blocs.map((bloc, i) => {
                    const isPause = bloc.titre === 'Pause déjeuner'
                    if (isPause) return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                        <div style={{ flex: 1, height: 1, background: `${jour.color}40` }} />
                        <div style={{ background: `${jour.color}12`, border: `1px solid ${jour.color}35`, borderRadius: 20, padding: '3px 12px', fontSize: 10, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 0.8, whiteSpace: 'nowrap' }}>
                          {bloc.horaire && <span style={{ opacity: 0.7, marginRight: 6 }}>{bloc.horaire}</span>}Pause déjeuner
                        </div>
                        <div style={{ flex: 1, height: 1, background: `${jour.color}40` }} />
                      </div>
                    )
                    const isQuizBloc = bloc.titre === 'Jeu de questions'
                    return (
                      <div key={i} style={{ background: isQuizBloc ? 'rgba(245,158,11,0.06)' : 'var(--bg)', border: `1px solid ${isQuizBloc ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`, borderLeft: `3px solid ${isQuizBloc ? '#f59e0b' : jour.color}`, borderRadius: 8, padding: '10px 14px' }}>
                        {bloc.horaire && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: isQuizBloc ? '#f59e0b' : jour.color, marginBottom: 2, letterSpacing: 0.5 }}>{bloc.horaire}</div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: bloc.items.length > 0 ? 6 : 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{bloc.titre}</div>
                          {isQuizBloc && (
                            <button
                              onClick={e => { e.stopPropagation(); setActiveView('peer-quiz') }}
                              style={{ flexShrink: 0, background: '#f59e0b', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: 0.3 }}
                            >
                              🎯 Lancer
                            </button>
                          )}
                        </div>
                        {bloc.items.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {bloc.items.map((item, j) => (
                              <div key={j} style={{ fontSize: 11, color: 'var(--text-s)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 5, padding: '3px 8px' }}>
                                {item}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Bouton Diffuser */}
                <button
                  onClick={async () => { await setSharedState({ tv_screen: 'planning', planning_day: jour.id }) }}
                  style={{
                    width: '100%', padding: '12px 0',
                    background: jour.color, border: 'none',
                    borderRadius: 10, cursor: 'pointer',
                    fontSize: 14, fontWeight: 700, color: '#fff',
                    fontFamily: 'inherit', letterSpacing: 0.3,
                    boxShadow: `0 4px 14px ${jour.color}44`,
                    transition: 'opacity .15s',
                  }}
                  onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                  onMouseOut={e => e.currentTarget.style.opacity = '1'}
                >
                  Diffuser sur TV &amp; téléphones
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 'var(--r)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: 'var(--text-s)' }}>Arrêter la diffusion du planning</span>
            <button
              onClick={async () => { await setSharedState({ tv_screen: null, planning_day: null }) }}
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626', borderRadius: 10, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >Arrêter</button>
          </div>
        </div>
      </div>
    )
  }

  if (activeView === 'modules') {
    return (
      <div id="dashboard">
        <div className="dash-wrap">
          <button className="detail-back" onClick={() => setActiveView('home')}>← Retour au tableau de bord</button>
          <div className="dash-header">
            <div><h2>Démarrer une session</h2><p>Choisissez le module de formation à lancer</p></div>
          </div>
          <div
            onClick={() => onLaunchModule('verre-progressif')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--r)', padding: '28px 30px', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 12 }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,.25)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#7c3aed,#9f67fa)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>🔬</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Module J+14 · Formation retour terrain</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Le Verre Progressif</div>
              <div style={{ fontSize: 13, color: 'var(--text-s)', marginBottom: 12 }}>Module interactif complet : anatomie, zones, presbytie, arguments LPT, jeu d'objections et quiz final 8 questions.</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['① Anatomie', '② Zones quiz', '③ Presbytie', '④ Retour terrain', '⑤ Arguments', '⑥ Objections', '⑦ Quiz 8Q'].map(t => (
                  <span key={t} style={{ padding: '3px 10px', background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#7c3aed', fontSize: 14, fontWeight: 600 }}>
              Lancer <span style={{ fontSize: 20 }}>→</span>
            </div>
          </div>
          <div
            onClick={() => setActiveView('free-quiz')}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--r)', padding: '28px 30px', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 12 }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,.25)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>🎯</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Outil pédagogique · Toutes formations</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Quiz libre</div>
              <div style={{ fontSize: 13, color: 'var(--text-s)' }}>Pose une question · les formés répondent · tu valides et commentes en direct.</div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, color: '#6366f1', fontSize: 14, fontWeight: 600 }}>
              Lancer <span style={{ fontSize: 20 }}>→</span>
            </div>
          </div>
          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--r)', padding: 24, textAlign: 'center', color: 'var(--text-m)' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>＋</div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>D'autres modules seront disponibles prochainement</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div id="dashboard">
      <div className="dash-wrap">
        <DashHeader
          pName={pName}
          onUpdatesClick={() => setShowUpdatesList(true)}
          activeRoomCode={activeRoomCode}
          onOpenTv={onOpenTv}
          onOpenRoom={handleOpenRoomClick}
          onSonnetteClick={() => setShowSonnette(true)}
          sonnettePending={sonnettePending}
          trainerMode={trainerMode}
          onTrainerModeChange={handleTrainerModeChange}
        />
        <SonnettePanel
          visible={showSonnette}
          onClose={() => setShowSonnette(false)}
          onPendingChange={setSonnettePending}
          trainerName={pName}
        />
        {showUpdatesList && (
          <AppUpdatesListModal
            onClose={() => setShowUpdatesList(false)}
            onSelect={u => { setShowUpdatesList(false); setSelectedUpdate(u) }}
          />
        )}
        {selectedUpdate && <AppUpdateModal update={selectedUpdate} onClose={() => setSelectedUpdate(null)} />}

        {/* OB Banner */}
        <div className="ob-banner" onClick={() => setActiveView('onboarding-choix')}>
          <div className="ob-banner-icon">🚀</div>
          <div className="ob-banner-body">
            <div className="ob-banner-label">Formation · Suivi collaborateurs</div>
            <div className="ob-banner-title">Onboarding LPT</div>
            <div className="ob-banner-sub">France · Belgique — gérez la présence et le suivi de vos collaborateurs</div>
            <div className="ob-day-badge">Jour {obDay}</div>
          </div>
          <div className="ob-banner-arrow">→</div>
        </div>

        {/* Planning banner */}
        <div
          onClick={() => setActiveView('planning')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #0d1f35 0%, #0a2a40 60%, #004d6e 100%)',
            border: '1px solid rgba(0,171,233,0.18)',
            borderRadius: 'var(--r)', padding: '18px 24px',
            cursor: 'pointer', marginBottom: 16, transition: 'all .2s',
          }}
          onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.borderColor = 'rgba(0,171,233,0.4)' }}
          onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(0,171,233,0.18)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,171,233,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00abe9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,171,233,0.75)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>4 jours · Onboarding intensif</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Planning formation</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>Diffusez le programme du jour sur les écrans</div>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#00abe9' }}>Voir →</div>
        </div>


        {/* Main tiles */}
        <div className="dash-tiles">
          <div className="dash-tile" onClick={() => setActiveView('entrees')}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">📋</div>
              <span className="dash-tile-link">Gérer →</span>
            </div>
            <div className="dash-tile-count">{entreeCount ?? '—'}</div>
            <div className="dash-tile-label">Entrées de la semaine</div>
            <div className="dash-tile-sub">Importer un tableau RH</div>
          </div>

          <div className="dash-tile" onClick={() => setActiveView('sessions')}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">🎓</div>
              <span className="dash-tile-link">Voir tout →</span>
            </div>
            <div className="dash-tile-count">{sessionCount}</div>
            <div className="dash-tile-label">Sessions réalisées</div>
            <div className="dash-tile-sub">{sessionLast}</div>
          </div>

          <div className="dash-tile" onClick={() => setActiveView('idees')}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">💡</div>
              <span className="dash-tile-link">Voir tout →</span>
            </div>
            <div className="dash-tile-count">{ideeCount}</div>
            <div className="dash-tile-label">Idées notées</div>
            <div className="dash-tile-sub">Idées notées durant les formations</div>
          </div>

          <div className="dash-tile" onClick={() => setActiveView('pense-bete')} style={{ borderColor: 'rgba(255,255,255,0.16)' }}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">📌</div>
              <span className="dash-tile-link">Ouvrir →</span>
            </div>
            <div className="dash-tile-count">{penseBeteTodoCount}</div>
            <div className="dash-tile-label">Pense-bête</div>
            <div className="dash-tile-sub">Tâches à faire · privé, pour toi seul</div>
          </div>

          <div className="dash-tile" onClick={() => setActiveView('retour-formation')} style={{ borderColor: 'rgba(99,102,241,0.35)' }}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">📝</div>
              <span className="dash-tile-link" style={{ color: '#818cf8' }}>Accéder →</span>
            </div>
            <div className="dash-tile-count" style={{ color: '#818cf8' }}>{entreeCount ?? '—'}</div>
            <div className="dash-tile-label">Retour de formation</div>
            <div className="dash-tile-sub">Fiches de suivi par collaborateur</div>
          </div>

          <div className="dash-tile" onClick={() => setActiveView('auto-eval')} style={{ borderColor: 'rgba(16,185,129,0.35)' }}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">📋</div>
              <span className="dash-tile-link" style={{ color: '#10b981' }}>Lancer →</span>
            </div>
            <div className="dash-tile-count" style={{ color: '#10b981', fontSize: 22 }}>Auto-éval</div>
            <div className="dash-tile-label">Auto-évaluation</div>
            <div className="dash-tile-sub">Questionnaire fin de formation par le formé</div>
          </div>

          <div className="dash-tile" onClick={() => setActiveView('global-ratings')} style={{ borderColor: 'rgba(245,158,11,0.4)' }}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">⭐</div>
              <span className="dash-tile-link" style={{ color: '#d97706' }}>Voir →</span>
            </div>
            {globalAvgRating ? (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span className="dash-tile-count" style={{ color: '#d97706' }}>{globalAvgRating.avg.toFixed(1)}</span>
                  <span style={{ fontSize: 13, color: '#92400e', fontWeight: 700 }}>/5</span>
                </div>
                <div className="dash-tile-label">Note de la formation</div>
                <div className="dash-tile-sub">{globalAvgRating.count} avis cumulés · tous formateurs</div>
              </>
            ) : (
              <>
                <div className="dash-tile-count" style={{ color: '#d97706', fontSize: 20 }}>—</div>
                <div className="dash-tile-label">Note de la formation</div>
                <div className="dash-tile-sub">Aucun avis reçu pour l'instant</div>
              </>
            )}
          </div>


        </div>

        {/* Planning + Shortcuts + Fiches */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <PlanningWidget onOpen={() => onOpenPlanning()} />
          <ShortcutsWidget />
          <FichesAnnexesWidget />
        </div>

      </div>
      {roomModalOpen && (
        <RoomOpenModal
          trainerName={pName}
          loading={roomLoading}
          onCancel={() => setRoomModalOpen(false)}
          onConfirm={handleConfirmRoom}
        />
      )}
    </div>
  )
}
