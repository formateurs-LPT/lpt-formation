'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbSelect, sbUpdate, sbDelete, getSharedState, parseSessionHistorySummary, getRuntimeSessionCode, SESSION_CODE } from '@/lib/supabase'
import StoreFollowupView from './StoreFollowupView'
import OnboardingView from './OnboardingView'
import OnboardingViewBelgique from './OnboardingViewBelgique'
import EntreesView from './EntreesView'
import RoomOpenModal from './RoomOpenModal'
import { TRAINER_CANONICAL, getTrainerAvatarKey } from '@/lib/constants'
import TrainerAvatar from './TrainerAvatar'
import { TRAINING_THEMES, formatSlotDate, formatHeure, THEME_TO_SKILL_ITEM } from '@/lib/trainingSlots'
import { ItemRow } from '@/components/StoreFollowupShared'
import { useStoreFollowupProgress } from '@/lib/useStoreFollowupProgress'
import { setSharedState } from '@/lib/supabase'
import TrainerShell from './TrainerShell'
import { findActiveRoomForTrainer, getLiveTrainerRoomCode, openOrCreateRoom, trainerLoginFromDisplayName, endActiveRoom } from '@/lib/sessionRoom'
import { isDynamicRoomCode, setTrainerActiveRoomCode } from '@/lib/sessionCode'
import { loadIdeesFromSupabase, deleteIdee, voteIdee, updateIdee, clearAllIdees, addIdee } from '@/components/IdeesButton'
import { MODULE_DATA } from '@/lib/modulesData'
import { getQuizResultats, periodBounds } from '@/lib/collaborateursApi'
import DemandesInterventionView from '@/components/DemandesInterventionView'
import { getFormateurRatings } from '@/lib/formateurRatings'
import TachesView from '@/components/TachesView'
import FutursEntreesView from '@/components/FutursEntreesView'
import { getTaches } from '@/lib/tachesApi'
import { apiGetEntreesRhByWeek } from '@/lib/rhApi'

// Lundi de la semaine en cours / prochaine (même calcul que getMondayStr()
// côté dashboard RH, dupliqué ici car privé à ce fichier-là — heure locale,
// pas UTC, pour ne pas décaler la date selon le fuseau).
function getMondayStr(offsetWeeks = 0) {
  const d = new Date(); const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1) + offsetWeeks * 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
import { getNotificationsNonLues, marquerNotificationsLues } from '@/lib/directionApi'

// Comptes autorisés à voir "Résultats des tests" (script 2) — structure
// volontairement simple pour être modifiable en un instant plus tard.
const ALLOWED_RESULTATS_LOGINS = ['kevin', 'quentin']
import SonnettePanel from './SonnettePanel'
import RetourFormationView from './RetourFormationView'
import AutoEvalView from './AutoEvalView'
import GlobalRatingsView from './GlobalRatingsView'
import PeerQuizTrainer from './PeerQuizGame'
import { readTrainerMode, setTrainerMode, TRAINER_MODE_META } from '@/lib/trainerMode'
import { categorySlugFromZone } from '@/lib/formationCategories'

function TrainerModeToggle({ mode, onChange }) {
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState(null)
  const btnRef = useRef(null)
  const meta = mode ? TRAINER_MODE_META[mode] : null

  // Le bouton vit maintenant dans la bannière d'accueil (overflow:hidden,
  // pour ses cercles décoratifs) — un menu en position:absolute s'y
  // retrouverait rogné. On calcule sa position à l'écran (getBoundingClientRect)
  // et on l'affiche en position:fixed, qui échappe au overflow:hidden du parent.
  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setMenuPos({ top: r.bottom + 6, right: window.innerWidth - r.right })
    }
    setOpen(v => !v)
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        title="Mode de travail — mémorisé jusqu'à ce que tu le changes"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: mode ? 'rgba(0,137,186,0.1)' : '#f3f4f6',
          border: `1px solid ${mode ? 'rgba(0,137,186,0.3)' : '#e5e7eb'}`,
          borderRadius: 20, padding: '6px 12px',
          cursor: 'pointer', fontFamily: 'inherit',
          color: mode ? '#0089ba' : '#6b7280', fontSize: 12, fontWeight: 700,
        }}
      >
        {meta ? `${meta.emoji} ${meta.label}` : '⚙️ Choisir un mode'}
      </button>
      {open && menuPos && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
          <div style={{
            position: 'fixed', top: menuPos.top, right: menuPos.right, zIndex: 9999,
            background: '#fff', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: 6, minWidth: 160,
            boxShadow: '0 8px 24px rgba(16,24,40,0.14)', display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {Object.entries(TRAINER_MODE_META).map(([slug, m]) => (
              <button
                key={slug}
                onClick={() => { onChange(slug); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left',
                  background: mode === slug ? 'rgba(0,137,186,0.1)' : 'transparent',
                  border: 'none', borderRadius: 8, padding: '8px 10px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  color: mode === slug ? '#0089ba' : '#374151', fontSize: 13, fontWeight: 600,
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

// Les sessions se terminent le vendredi soir, les rapports se finalisent le
// lundi matin — le bouton "Clôturer la salle" n'a de sens (et n'est proposé)
// que le lundi à partir de 8h, pour ne pas polluer le reste de la semaine
// pendant que les sessions sont encore en cours (cf. demande Kevin).
function isMondayCloseWindow() {
  const now = new Date()
  return now.getDay() === 1 && now.getHours() >= 8
}

function DashHeader({ pName, activeRoomCode, onOpenTv, onOpenRoom, onOpenPlanning, onEndRoomClick, trainerMode, onTrainerModeChange, onSonnetteClick, sonnettePending, onTacheNotifsClick, tacheNotifsCount }) {
  const rawKey = (pName || '').toLowerCase().split(' ')[0]
  const key = TRAINER_CANONICAL[rawKey] || rawKey
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  const hasRoom = isDynamicRoomCode(activeRoomCode)

  return (
    <div className="dash-hero" style={{ display: 'flex', alignItems: 'center' }}>
      <div className="dash-hero-avatar" style={{ borderRadius: '50%', overflow: 'hidden' }}>
        <TrainerAvatar pName={pName} size={90} />
      </div>
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
        {onOpenPlanning && (
          <button
            onClick={onOpenPlanning}
            title="Planning déplacements"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              flexShrink: 0, transition: 'transform .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px) scale(1.06)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
          >
            <Image
              src="/assets/tgv-lpt.png" alt="Planning déplacements" width={200} height={100}
              style={{ width: 92, height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 3px 6px rgba(0,137,186,0.35))' }}
            />
          </button>
        )}

        {hasRoom ? (
          <>
            <div
              onClick={onOpenRoom}
              title="Reprendre la salle"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: 4,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(0,171,233,0.7)', textTransform: 'uppercase', letterSpacing: 1 }}>Salle active</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#00abe9', fontFamily: 'monospace', letterSpacing: 3, lineHeight: 1.2 }}>{activeRoomCode}</span>
            </div>
            {onEndRoomClick && isMondayCloseWindow() && (
              <button
                onClick={onEndRoomClick}
                title="Archive les résultats de la semaine et ferme la salle"
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
                🔒 Clôturer la salle
              </button>
            )}
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

        {onTacheNotifsClick && tacheNotifsCount > 0 && (
          <button
            onClick={onTacheNotifsClick}
            title="Tâches terminées"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.3)',
              borderRadius: 20, padding: '6px 12px 6px 10px',
              cursor: 'pointer', fontFamily: 'inherit',
              color: '#16a34a', fontSize: 12, fontWeight: 700, transition: 'all .18s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.2)'; e.currentTarget.style.borderColor = 'rgba(22,163,74,0.45)' }}
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(22,163,74,0.12)'; e.currentTarget.style.borderColor = 'rgba(22,163,74,0.3)' }}
          >
            <span style={{ fontSize: 14 }}>🔔</span>
            <span>{tacheNotifsCount}</span>
          </button>
        )}

        {onSonnetteClick && (
          <button
            onClick={onSonnetteClick}
            title="Sonnette d'accueil"
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 6,
              background: sonnettePending > 0 ? 'rgba(251,191,36,0.18)' : '#f3f4f6',
              border: sonnettePending > 0 ? '1px solid rgba(251,191,36,0.45)' : '1px solid #e5e7eb',
              borderRadius: 20, padding: '6px 12px',
              cursor: 'pointer', fontFamily: 'inherit',
              color: sonnettePending > 0 ? '#b45309' : '#6b7280',
              fontSize: 12, fontWeight: 700, transition: 'all .18s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = sonnettePending > 0 ? 'rgba(251,191,36,0.28)' : '#e5e7eb' }}
            onMouseOut={e => { e.currentTarget.style.background = sonnettePending > 0 ? 'rgba(251,191,36,0.18)' : '#f3f4f6' }}
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

  const xpFor = (correct, total) => total > 0 ? Math.round((correct / total) * 100) : 0
  const MODULE_LABELS = { 'types-verres': 'Types de verres' }

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack} style={{ margin: '0 0 8px' }}>← Retour</button>

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

// Marque toutes les inscriptions comme vues POUR CE FORMATEUR (localStorage,
// par appareil) — jamais partagé, pour que Kevin ouvrir la liste n'efface
// pas la notification de Quentin (et inversement).
function inscriptionsLastSeenKey(pName) {
  return `lpt_inscriptions_vu_${getTrainerAvatarKey(pName)}`
}

// Même logique, pour les demandes d'intervention (manager/direction) — badge
// et toast propres à CE formateur, jamais partagés entre Kevin/Quentin/etc.
function demandesInterventionLastSeenKey(pName) {
  return `lpt_demandes_intervention_vu_${getTrainerAvatarKey(pName)}`
}

// Raccourci "Noter" — plutôt que de renvoyer le formateur vers Suivi magasin
// pour chercher le collaborateur, ouvre directement le même ItemRow (trame,
// note, historique, score) sur l'item de compétence relié au thème de la
// formation qu'il vient d'animer.
function NoterModal({ magasin, collaborateurId, collaborateurNom, itemId, itemLabel, pName, onClose }) {
  const { progress, history, saveError, setScore, saveNote, reset } = useStoreFollowupProgress(magasin, pName)
  const key = `${collaborateurId}:${itemId}`
  const item = { id: itemId, label: itemLabel, category: 'Compétences' }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '26px 28px', width: '100%', maxWidth: 520,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5 }}>Noter la compétence</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 4 }}>{collaborateurNom}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, flexShrink: 0,
          }}>✕</button>
        </div>

        {saveError && (
          <div style={{
            background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.4)', color: '#f87171',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14,
          }}>⚠️ Échec de la sauvegarde — réessayez.</div>
        )}

        <ItemRow
          item={item}
          entry={progress[key]}
          pastEntries={history[key]}
          onSetScore={(itId, score) => setScore(collaborateurId, itId, score)}
          onSaveNote={(itId, note) => saveNote(collaborateurId, itId, note)}
          onReset={(itId) => reset(collaborateurId, itId)}
        />
      </div>
    </div>
  )
}

function InscriptionsView({ onBack, pName }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [noterTarget, setNoterTarget] = useState(null)
  const canDelete = getTrainerAvatarKey(pName) === 'kevin'

  const load = () => {
    setLoading(true)
    // Ne montre que les formations pas encore clôturées (bouton "Terminé")
    // — une fois close, elle ne doit plus polluer la liste ni le compteur,
    // peu importe la date de session.
    sbSelect('training_registrations', `completed_at=is.null&order=session_date.asc,session_heure.asc`).then(r => {
      setRows(r || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => {
    load()
    try { localStorage.setItem(inscriptionsLastSeenKey(pName), new Date().toISOString()) } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const themeLabel = (id) => TRAINING_THEMES.find(t => t.id === id)?.label || id

  const deleteRegistration = async (regId, nom) => {
    if (!confirm(`Supprimer l'inscription de ${nom} ?`)) return
    await sbDelete('training_registrations', `id=eq.${regId}`)
    load()
  }

  // Clôture la formation : reprend la dernière note enregistrée sur la
  // compétence liée (via NoterModal) comme "taux de réussite" figé, pour que
  // l'historique reste correct même si la note est modifiée plus tard.
  const markTermine = async (reg, itemId, nom) => {
    let score = null
    if (itemId) {
      const progRows = await sbSelect(
        'store_followup_progress',
        `store=eq.${encodeURIComponent(reg.magasin)}&collaborateur=eq.${encodeURIComponent(reg.collaborateur_id)}&item_id=eq.${encodeURIComponent(itemId)}&order=audit_date.desc`
      )
      score = progRows?.[0]?.score ?? null
    }
    if (score == null && !confirm(`${nom} n'a pas encore été noté(e) sur cette compétence. Clore quand même la formation, sans taux de réussite ?`)) return
    await sbUpdate('training_registrations', { completed_at: new Date().toISOString(), completed_by: pName, score }, `id=eq.${reg.id}`)
    load()
  }

  const groups = {}
  for (const r of rows) {
    const key = `${r.session_date}__${r.session_heure}__${r.theme}__${r.magasin}`
    if (!groups[key]) groups[key] = { ...r, collabs: [] }
    groups[key].collabs.push({ reg: r, id: r.collaborateur_id, nom: r.collaborateur_nom })
  }
  const list = Object.values(groups)

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour</button>
      <div className="dash-header">
        <div>
          <h2>📬 Inscriptions formations</h2>
          <p>Prochaines sessions organisées par les managers, triées par date</p>
        </div>
      </div>
      {loading ? (
        <p style={{ color: 'var(--text-s)' }}>Chargement…</p>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-s)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Aucune inscription pour l&apos;instant</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((g, i) => {
            const itemId = THEME_TO_SKILL_ITEM[g.theme]
            return (
              <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 18px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                  {formatSlotDate(g.session_date)} · {formatHeure(g.session_heure)} — {themeLabel(g.theme)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-s)', marginTop: 2, marginBottom: 8 }}>
                  {g.magasin}{g.registered_by && ` · Inscrit par ${g.registered_by}`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {g.collabs.map(c => (
                    <div key={c.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'var(--bg)', borderRadius: 8, padding: '7px 10px 7px 12px',
                    }}>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{c.nom}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {itemId && (
                          <button
                            onClick={() => setNoterTarget({
                              magasin: g.magasin, collaborateurId: c.id, collaborateurNom: c.nom,
                              itemId, itemLabel: themeLabel(g.theme),
                            })}
                            style={{
                              background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.35)',
                              color: '#0089ba', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700,
                              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                            }}
                          >✓ Noter</button>
                        )}
                        <button
                          onClick={() => markTermine(c.reg, itemId, c.nom)}
                          title="Marquer cette formation comme terminée"
                          style={{
                            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)',
                            color: '#4ade80', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                          }}
                        >✓ Terminé</button>
                        {canDelete && (
                          <button
                            onClick={() => deleteRegistration(c.reg.id, c.nom)}
                            title="Supprimer cette inscription"
                            style={{
                              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                              color: '#f87171', borderRadius: 8, padding: '5px 9px', fontSize: 12, fontWeight: 700,
                              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                            }}
                          >🗑️</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {noterTarget && (
        <NoterModal
          {...noterTarget}
          pName={pName}
          onClose={() => setNoterTarget(null)}
        />
      )}
    </div>
  )
}

const RESULTATS_PERIODS = [
  { id: 'semaine', label: 'Semaine' },
  { id: 'mois', label: 'Mois' },
  { id: 'trimestre', label: 'Trimestre' },
  { id: 'annee', label: 'Année' },
  { id: 'custom', label: 'Dates libres' },
]

// Page "Résultats des tests" — réservée à Kevin/Quentin (ALLOWED_RESULTATS_LOGINS).
// Double vérification volontaire : le lien de nav est déjà caché pour les
// autres comptes, mais le composant se protège aussi lui-même au rendu, au
// cas où cette vue serait atteinte autrement qu'en cliquant la tuile.
function ResultatsTestsView({ onBack, pName }) {
  const allowed = ALLOWED_RESULTATS_LOGINS.includes(getTrainerAvatarKey(pName))
  const [period, setPeriod] = useState('mois')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!allowed) return
    setLoading(true)
    const { from, to } = periodBounds(period, customFrom, customTo)
    getQuizResultats({ from, to }).then(rows => { setResultats(rows); setLoading(false) }).catch(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowed, period, customFrom, customTo])

  if (!allowed) {
    return (
      <div className="dash-wrap">
        <button className="detail-back" onClick={onBack}>← Retour</button>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-s)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Accès non autorisé</div>
        </div>
      </div>
    )
  }

  const total = resultats.length
  const reussis = resultats.filter(r => r.reussite).length
  const tauxReussite = total > 0 ? Math.round((reussis / total) * 100) : 0
  const scores = resultats.map(r => r.score).filter(s => s != null)
  const scoreMoyen = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + Number(b), 0) / scores.length) * 10) / 10 : null

  const fmtDate = (iso) => {
    try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }
    catch { return '—' }
  }

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour</button>
      <div className="dash-header">
        <div>
          <h2>📊 Résultats des tests</h2>
          <p>Tests de sortie des nouveaux entrants, tous magasins</p>
        </div>
      </div>

      {/* Filtre de période */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        {RESULTATS_PERIODS.map(p => (
          <button key={p.id} onClick={() => setPeriod(p.id)} style={{
            padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12.5, fontWeight: 700, transition: 'all .15s',
            background: period === p.id ? 'rgba(0,171,233,0.15)' : 'var(--card)',
            border: `1px solid ${period === p.id ? '#00abe9' : 'var(--border)'}`,
            color: period === p.id ? '#00abe9' : 'var(--text-s)',
          }}>{p.label}</button>
        ))}
        {period === 'custom' && (
          <>
            <input type="date" className="finput" style={{ width: 150, marginBottom: 0 }} value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            <span style={{ color: 'var(--text-m)' }}>→</span>
            <input type="date" className="finput" style={{ width: 150, marginBottom: 0 }} value={customTo} onChange={e => setCustomTo(e.target.value)} />
          </>
        )}
      </div>

      {/* Cartes stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Taux de réussite', value: total > 0 ? `${tauxReussite}%` : '—', color: '#4ade80' },
          { label: 'Tests passés', value: total, color: '#00abe9' },
          { label: 'Score moyen', value: scoreMoyen != null ? scoreMoyen : '—', color: '#a78bfa' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-s)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <p style={{ color: 'var(--text-s)' }}>Chargement…</p>
      ) : resultats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-s)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Aucun résultat sur cette période</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {resultats.map(r => (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 18px',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: r.reussite ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
                color: r.reussite ? '#4ade80' : '#f87171',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
              }}>{(r.prenom?.[0] || '?')}{(r.nom?.[0] || '')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{r.prenom} {r.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--text-s)' }}>{r.magasin} · {fmtDate(r.date_passation)}</div>
              </div>
              {r.score != null && (
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-s)', flexShrink: 0 }}>{r.score}</div>
              )}
              <div style={{
                flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700,
                background: r.reussite ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${r.reussite ? 'rgba(74,222,128,0.35)' : 'rgba(239,68,68,0.35)'}`,
                color: r.reussite ? '#4ade80' : '#f87171',
              }}>{r.reussite ? 'Réussi' : 'Échoué'}</div>
            </div>
          ))}
        </div>
      )}
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

  // Plus récent en premier, à tous les niveaux (modules, pages dans un module,
  // idées dans une page) — sinon l'ordre dépend juste de l'ordre d'insertion
  // (première idée jamais notée sur ce module/page), pas de l'activité récente.
  const mostRecentTs = (idees) => Math.max(...idees.map(i => new Date(i.timestamp).getTime()))
  const sortEntriesByMostRecent = (entries, idsOf) =>
    [...entries].sort(([, a], [, b]) => mostRecentTs(idsOf(b)) - mostRecentTs(idsOf(a)))

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
    const entries = sortEntriesByMostRecent(Object.entries(grouped), pages => Object.values(pages).flat())
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
              {sortEntriesByMostRecent(Object.entries(pages), idees => idees).map(([pageLabel, pageIdees]) => (
                <div key={pageLabel}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                    {pageLabel}
                    <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...pageIdees].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(idee => (
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

function FichesPratiquesPage() {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#14161a' }}>📎 Fiches pratiques</div>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Documents de référence, à consulter ou partager</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '18px 24px' }}>
        {FICHES.map(f => (
          <button
            key={f.label}
            onClick={() => window.open(f.href, '_blank', 'noopener,noreferrer')}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: '#f8fafc', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '12px 14px', cursor: 'pointer',
              transition: 'all .18s', width: '100%', textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = f.color }}
            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e5e7eb' }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: `${f.color}1f`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {f.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.label}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{f.sub}</div>
            </div>
            <span style={{ fontSize: 13, color: f.color, flexShrink: 0 }}>↗</span>
          </button>
        ))}
      </div>
    </div>
  )
}


// Associe chaque activeView existant à la catégorie de sidebar qui doit
// être surlignée quand on s'y trouve. Onboarding (choix/France/Belgique/peer-quiz)
// et Entrées de la semaine n'ont volontairement pas d'entrée ici : déjà
// accessibles depuis le dashboard (bannière / tuile), pas de catégorie dédiée
// à surligner — la sidebar retombe sur "Accueil" par défaut pendant ce parcours.
const VIEW_TO_CATEGORY = {
  home: 'accueil', idees: 'idees',
  sessions: 'sessions',
  'suivi-magasin': 'suivi-terrain',
  inscriptions: 'inscriptions',
  'demandes-intervention': 'demandes',
  'global-ratings': 'evaluations', 'resultats-tests': 'evaluations', 'auto-eval': 'evaluations',
  'retour-formation': 'retour-formation',
  'fiches-pratiques': 'fiches-pratiques',
}

// Vue par défaut quand on clique directement sur une catégorie de la
// sidebar (plutôt que d'arriver dessus via un sous-écran précis).
const CATEGORY_LANDING = {
  accueil: 'home',
  sessions: 'sessions',
  'suivi-terrain': 'suivi-magasin',
  inscriptions: 'inscriptions',
  demandes: 'demandes-intervention',
  evaluations: 'global-ratings',
  'retour-formation': 'retour-formation',
  'fiches-pratiques': 'fiches-pratiques',
  idees: 'idees',
}

// Petit sélecteur d'onglets interne à une catégorie (ex: Entrées ↔
// Inscriptions) — pure présentation, ne connaît rien de la logique des
// vues qu'il bascule.
function TabRow({ tabs, activeView, onSelect }) {
  if (!tabs || tabs.length < 2) return null
  return (
    <div style={{ display: 'flex', gap: 4, marginBottom: 22, borderBottom: '1px solid var(--border)' }}>
      {tabs.map(t => {
        const isActive = (t.match || [t.id]).includes(activeView)
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            style={{
              padding: '9px 16px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 700, background: 'none',
              color: isActive ? '#0089ba' : 'var(--text-s)',
              borderBottom: isActive ? '2px solid #0089ba' : '2px solid transparent',
              marginBottom: -1,
            }}
          >{t.label}</button>
        )
      })}
    </div>
  )
}

// Coquille commune à tous les écrans formateur : sidebar desktop / barre
// d'onglets mobile autour du contenu existant, qui ne change pas d'une
// ligne. Centralise ce qui était avant répété à chaque `return` de
// Dashboard (id="dashboard" + className) pour ne le faire qu'une fois.
function TrainerPage({ activeView, setActiveView, inscriptionsPending, demandesInterventionPending, ideeCount, footerSlot, tabs, children }) {
  return (
    <div id="dashboard" className="manager-light-theme">
      <div className="trainer-shell">
        <TrainerShell
          active={VIEW_TO_CATEGORY[activeView] || 'accueil'}
          onNavigateCategory={(catId) => setActiveView(CATEGORY_LANDING[catId])}
          badges={{ inscriptions: inscriptionsPending, demandes: demandesInterventionPending, idees: ideeCount }}
          footerSlot={footerSlot}
        />
        <div className="trainer-content-wrap">
          <div className="trainer-content">
            <TabRow tabs={tabs} activeView={activeView} onSelect={setActiveView} />
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard({ pName, onLaunchModule, onOpenRoom, onOpenTv, onToast, onOnlineCount, onOpenPlanning, dashboardResume }) {
  // Dashboard "équipe" (tuiles personnelles : entrées, ma note, mes
  // déplacements) vs dashboard de Kevin, qui reste pour l'instant la version
  // complète existante — on commence par l'équipe, le sien viendra ensuite.
  const isTeamDashboard = getTrainerAvatarKey(pName) !== 'kevin'
  // dashboardResume (page.js) : où se replacer quand on remonte juste après
  // un aller-retour module — ce composant se démonte entièrement pendant
  // qu'un module plein écran est affiché, donc son activeView ne survit pas
  // tout seul. Lu une seule fois (valeurs d'init de useState), au moment du
  // montage qui suit justement ce retour.
  const [activeView, setActiveView] = useState(() => dashboardResume?.activeView || 'home') // home | sessions | entrees | modules | onboarding | onboarding-belgique | planning | retour-formation | auto-eval | global-ratings | mes-avis | free-quiz
  // Remonte en haut à chaque sous-écran — sur mobile, le conteneur de
  // défilement (coquille d'app, [data-app-scroll] dans page.js) est partagé
  // entre toutes les vues du Dashboard, donc sans ça la position de scroll
  // du tableau de bord reste collée en arrivant sur "Suivi magasin" etc.
  useEffect(() => {
    document.querySelector('[data-app-scroll]')?.scrollTo(0, 0)
  }, [activeView])
  const [entreeCount, setEntreeCount] = useState(null)
  const [globalAvgRating, setGlobalAvgRating] = useState(null)
  const [allTaches, setAllTaches] = useState([])
  const [tacheNotifs, setTacheNotifs] = useState([])
  const [showTacheNotifs, setShowTacheNotifs] = useState(false)
  const [futursEntrees, setFutursEntrees] = useState([])
  const [sessionCount, setSessionCount] = useState('—')
  const [sessionLast, setSessionLast] = useState('Chargement…')
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [showEndRoomConfirm, setShowEndRoomConfirm] = useState(false)
  const [roomLoading, setRoomLoading] = useState(false)
  const [activeRoomCode, setActiveRoomCode] = useState('')

  const [obDay, setObDay] = useState('1')
  const [obReturnJournee, setObReturnJournee] = useState(() => dashboardResume?.journeeId || null)
  const [obReturnView, setObReturnView] = useState(() => dashboardResume?.activeView || 'onboarding')
  // Retour générique d'un module (pas "Terminer" vers une journée précise) :
  // on avait déjà quitté l'écran de sélection France/Visio/Belgique avant de
  // lancer ce module, pas la peine de la redemander au retour.
  const [obSkipSelect] = useState(() => !!dashboardResume)
  const [ideeCount, setIdeeCount] = useState(0)
  const [inscriptionsCount, setInscriptionsCount] = useState(0)
  const [inscriptionsPending, setInscriptionsPending] = useState(0)
  const inscriptionsToastedRef = useRef(false)
  const [demandesInterventionCount, setDemandesInterventionCount] = useState(0)
  const [demandesInterventionPending, setDemandesInterventionPending] = useState(0)
  const demandesInterventionToastedRef = useRef(false)
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

  // Un mode déjà choisi (sidebar "Choisir un mode") dit déjà tout ce que
  // l'écran France/Belgique + le choix Présentiel/Visio redemanderaient —
  // on saute directement à la bonne liste de collaborateurs. Sans mode
  // choisi, on repasse par le parcours manuel habituel.
  const handleOpenOnboarding = () => {
    if (trainerMode === 'belgique') setActiveView('onboarding-belgique')
    else if (trainerMode === 'paris' || trainerMode === 'province') setActiveView('onboarding')
    else setActiveView('onboarding-choix')
  }
  // Sondage toutes les 30s (même pattern que tâches/notes/futurs entrées) —
  // sinon le compteur ne se met à jour qu'au rechargement de la page.
  useEffect(() => {
    const refresh = () => loadIdeesFromSupabase().then(list => setIdeeCount(list.length)).catch(() => {})
    refresh()
    const t = setInterval(refresh, 30000)
    return () => clearInterval(t)
  }, [])

  // Deux nombres distincts, volontairement découplés :
  // - "pending" = inscriptions pas encore passées (session_date à venir) —
  //   chiffre stable affiché sur la tuile, ne retombe pas à zéro juste parce
  //   qu'on a consulté la liste ; une fois la date dépassée, ça disparaît du
  //   compte tout seul (plus besoin de marquer "fait" à la main).
  // - "unseen" = inscriptions plus récentes que la dernière consultation DE
  //   CE FORMATEUR (horodatage local, cf. inscriptionsLastSeenKey) — pilote
  //   uniquement le halo/toast "nouveau", jamais partagé entre Kevin/Quentin.
  const refreshInscriptionsCount = async (allowToast) => {
    try {
      const rows = await sbSelect('training_registrations', 'select=created_at,completed_at')
      const pending = (rows || []).filter(r => !r.completed_at).length
      setInscriptionsPending(pending)

      let lastSeen = 0
      try { lastSeen = new Date(localStorage.getItem(inscriptionsLastSeenKey(pName)) || 0).getTime() } catch {}
      const unseen = (rows || []).filter(r => new Date(r.created_at).getTime() > lastSeen).length
      setInscriptionsCount(unseen)
      if (allowToast && unseen > 0 && !inscriptionsToastedRef.current) {
        inscriptionsToastedRef.current = true
        onToast?.(`Vous avez reçu ${unseen} nouvelle${unseen > 1 ? 's' : ''} inscription${unseen > 1 ? 's' : ''}`)
      }
    } catch {}
  }

  // Même principe que refreshInscriptionsCount : "pending" = demandes pas
  // encore clôturées (chiffre stable sur la tuile), "unseen" = créées depuis
  // la dernière consultation de CE formateur (pilote le halo + le toast).
  const refreshDemandesInterventionCount = async (allowToast) => {
    try {
      const rows = await sbSelect('demandes_intervention', 'select=created_at,statut')
      const pending = (rows || []).filter(r => r.statut !== 'cloturee').length
      setDemandesInterventionPending(pending)

      let lastSeen = 0
      try { lastSeen = new Date(localStorage.getItem(demandesInterventionLastSeenKey(pName)) || 0).getTime() } catch {}
      const unseen = (rows || []).filter(r => new Date(r.created_at).getTime() > lastSeen).length
      setDemandesInterventionCount(unseen)
      if (allowToast && unseen > 0 && !demandesInterventionToastedRef.current) {
        demandesInterventionToastedRef.current = true
        onToast?.(`Vous avez reçu ${unseen} nouvelle${unseen > 1 ? 's' : ''} demande${unseen > 1 ? 's' : ''} d'intervention`)
      }
    } catch {}
  }

  useEffect(() => {
    loadTileStats()
    refreshActiveRoom()
    refreshInscriptionsCount(true)
    refreshDemandesInterventionCount(true)
    const interval = setInterval(() => {
      loadTileStats()
      refreshActiveRoom()
      refreshInscriptionsCount(false)
      refreshDemandesInterventionCount(false)
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

  // "Créer une salle" amène directement sur le même écran d'onboarding
  // (sidebar) que la bannière "Onboarding LPT" juste en dessous — avant,
  // ces deux boutons menaient à deux endroits différents (l'un vers l'ancien
  // écran plein écran sans sidebar), un doublon confirmé et à unifier.
  const handleOpenRoomClick = async () => {
    const login = trainerLoginFromDisplayName(pName)
    const existing = await findActiveRoomForTrainer(login, pName)
    if (existing?.code) {
      onOpenRoom?.({ code: existing.code, resumed: true })
      handleOpenOnboarding()
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
      handleOpenOnboarding()
    } catch (e) {
      console.error(e)
      onToast?.(`Impossible d'ouvrir la salle — ${e.message || 'erreur inconnue'}`)
    } finally {
      setRoomLoading(false)
    }
  }

  // Archive les résultats quiz/participants de la salle active ET la termine
  // réellement (status 'ended' + code actif vidé) — pour repartir sur une
  // salle neuve au prochain "Créer une salle", plutôt que de reprendre la
  // même. Branché sur l'écran "Modules de formation" de l'onboarding (bouton
  // "Terminer la salle"), à côté du code de salle.
  const handleEndRoomClick = async (roomCodeHint) => {
    const login = trainerLoginFromDisplayName(pName)
    const code = (roomCodeHint || '').trim() || activeRoomCode || await getLiveTrainerRoomCode(login, pName)
    const result = await endActiveRoom(code, { trainerName: pName })
    if (result?.ok) {
      setActiveRoomCode('')
      onToast?.(
        result.archived ? 'Salle terminée et archivée ✓'
          : result.hadData ? 'Salle terminée — archivage impossible pour le moment, données conservées, réessaie plus tard'
          : 'Salle terminée ✓'
      )
      setActiveView('home')
    } else {
      onToast?.('Impossible de terminer la salle')
    }
  }

  // Note personnelle (tuile "Ma note de formation", équipe uniquement) —
  // moyenne des avis des formés dont ce formateur est le dernier éditeur de
  // fiche (cf. src/lib/formateurRatings.js pour la logique de rattachement).
  useEffect(() => {
    if (!isTeamDashboard) return
    const loadMyRating = async () => {
      try {
        const ratings = await getFormateurRatings(pName)
        if (ratings.length) {
          const avg = Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length) * 10) / 10
          setGlobalAvgRating({ avg, count: ratings.length })
        } else {
          setGlobalAvgRating(null)
        }
      } catch (e) {
        console.error('[Dashboard] my rating', e)
      }
    }
    loadMyRating()
    const t = setInterval(loadMyRating, 30000)
    return () => clearInterval(t)
  }, [pName, isTeamDashboard])

  // Tuile "Tâches" (tout le monde) — compteur des tâches qui m'attendent, et
  // notifications "tâche terminée" pour celui qui les a créées (Kevin pour
  // l'instant, mais générique si Quentin crée des tâches plus tard).
  useEffect(() => {
    const loadTaches = async () => {
      try { setAllTaches(await getTaches()) } catch (e) { console.error('[Dashboard] taches', e) }
    }
    const loadTacheNotifs = async () => {
      try {
        const rows = await getNotificationsNonLues(getTrainerAvatarKey(pName))
        setTacheNotifs(rows.filter(n => n.type === 'tache_terminee'))
      } catch (e) { console.error('[Dashboard] tache notifs', e) }
    }
    loadTaches()
    loadTacheNotifs()
    const t = setInterval(() => { loadTaches(); loadTacheNotifs() }, 30000)
    return () => clearInterval(t)
  }, [pName])

  const tachesCount = allTaches.filter(t => t.assignes.includes(pName) && t.statut !== 'termine').length

  // Tuile "Futurs entrées" (tout le monde) — aperçu en direct des entrées RH
  // validées (table entrees_rh, même source que le dashboard RH), semaine en
  // cours + semaine suivante confondues : la RH recrute à cheval sur les
  // deux (jusqu'au vendredi, parfois jusqu'au lundi suivant), donc se
  // limiter à la semaine suivante laissait les validations du jour même
  // invisibles côté formateur. Lecture seule.
  useEffect(() => {
    const loadFutursEntrees = async () => {
      try {
        const [current, next] = await Promise.all([
          apiGetEntreesRhByWeek(getMondayStr(0)),
          apiGetEntreesRhByWeek(getMondayStr(1)),
        ])
        setFutursEntrees([...current, ...next])
      } catch (e) { console.error('[Dashboard] futurs entrées', e) }
    }
    loadFutursEntrees()
    const t = setInterval(loadFutursEntrees, 30000)
    return () => clearInterval(t)
  }, [])

  const handleOpenTacheNotifs = async () => {
    setShowTacheNotifs(true)
    if (tacheNotifs.length) await marquerNotificationsLues(tacheNotifs.map(n => n.id)).catch(() => {})
  }
  const handleCloseTacheNotifs = () => { setShowTacheNotifs(false); setTacheNotifs([]) }

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

  const trainerPageProps = {
    setActiveView, inscriptionsPending, demandesInterventionPending, ideeCount,
  }

  const EVAL_TABS = [
    { id: 'global-ratings', label: 'Note de la formation' },
    ...(ALLOWED_RESULTATS_LOGINS.includes(getTrainerAvatarKey(pName)) ? [{ id: 'resultats-tests', label: 'Résultats des tests' }] : []),
    { id: 'auto-eval', label: 'Auto-évaluation' },
  ]

  if (activeView === 'sessions') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <SessionsHistoryView pName={pName} onBack={() => { setActiveView('home'); loadTileStats() }} onToast={onToast} />
      </TrainerPage>
    )
  }

  if (activeView === 'entrees') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <EntreesView onBack={() => { setActiveView('home'); loadTileStats() }} onToast={onToast} pName={pName} />
      </TrainerPage>
    )
  }

  if (activeView === 'idees') {
    return <TrainerPage activeView={activeView} {...trainerPageProps}><IdeesView onBack={() => setActiveView('home')} pName={pName} /></TrainerPage>
  }

  if (activeView === 'inscriptions') {
    return <TrainerPage activeView={activeView} {...trainerPageProps}><InscriptionsView onBack={() => { setActiveView('home'); refreshInscriptionsCount(false) }} pName={pName} /></TrainerPage>
  }

  if (activeView === 'suivi-magasin') {
    return <TrainerPage activeView={activeView} {...trainerPageProps}><StoreFollowupView pName={pName} onBack={() => setActiveView('home')} /></TrainerPage>
  }

  if (activeView === 'retour-formation') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <RetourFormationView
          onBack={() => setActiveView('home')}
          pName={pName}
        />
      </TrainerPage>
    )
  }

  if (activeView === 'fiches-pratiques') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <FichesPratiquesPage />
      </TrainerPage>
    )
  }

  if (activeView === 'resultats-tests') {
    return <TrainerPage activeView={activeView} tabs={EVAL_TABS} {...trainerPageProps}><ResultatsTestsView onBack={() => setActiveView('home')} pName={pName} /></TrainerPage>
  }

  if (activeView === 'demandes-intervention') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <div className="dash-header">
          <div>
            <h2>🆘 Demandes d&apos;intervention</h2>
            <p>Réseau entier, tous magasins confondus</p>
          </div>
        </div>
        <DemandesInterventionView login={getTrainerAvatarKey(pName)} role="formateur" />
      </TrainerPage>
    )
  }

  if (activeView === 'auto-eval') {
    return (
      <TrainerPage activeView={activeView} tabs={EVAL_TABS} {...trainerPageProps}>
        <AutoEvalView onBack={() => setActiveView('home')} />
      </TrainerPage>
    )
  }

  if (activeView === 'global-ratings') {
    return (
      <TrainerPage activeView={activeView} tabs={EVAL_TABS} {...trainerPageProps}>
        <GlobalRatingsView onBack={() => setActiveView('home')} />
      </TrainerPage>
    )
  }

  if (activeView === 'mes-avis') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <GlobalRatingsView trainerName={pName} onBack={() => setActiveView('home')} />
      </TrainerPage>
    )
  }

  if (activeView === 'taches') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <TachesView pName={pName} />
      </TrainerPage>
    )
  }

  if (activeView === 'futurs-entrees') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <FutursEntreesView entrees={futursEntrees} />
      </TrainerPage>
    )
  }

  if (activeView === 'peer-quiz') {
    return (
      <PeerQuizTrainer
        sessionCode={activeRoomCode}
        onBack={() => setActiveView(obReturnJournee ? obReturnView : 'sessions')}
      />
    )
  }

  if (activeView === 'onboarding-choix') {
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
          <div className="dash-hero" style={{ marginBottom: 32 }}>
            <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
              <div className="dash-hero-label">Formation · Suivi collaborateurs</div>
              <h2 className="dash-hero-title">ONBOARDING</h2>
              <p className="dash-hero-date">Choisissez le programme de formation</p>
            </div>
            <div style={{ width: 56, height: 56, background: 'rgba(0,137,186,.1)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, position: 'relative', zIndex: 1 }}>🚀</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* France */}
            <div
              onClick={() => setActiveView('onboarding')}
              style={{
                background: 'linear-gradient(135deg, #eaf3fd 0%, #dbe9f8 100%)',
                border: '1px solid rgba(0,137,186,0.25)',
                borderRadius: 18, padding: '32px 28px', cursor: 'pointer',
                transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,137,186,0.6)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,137,186,0.25)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 48 }}>🇫🇷</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#14161a', marginBottom: 6 }}>Onboarding France</div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                  Optique · Offres · Prise de mesures · Remboursements
                </div>
              </div>
              <div style={{ marginTop: 'auto', fontSize: 13, fontWeight: 700, color: '#0089ba' }}>Accéder →</div>
            </div>

            {/* Belgique */}
            <div
              onClick={() => setActiveView('onboarding-belgique')}
              style={{
                background: 'linear-gradient(135deg, #fdf6e3 0%, #faecc4 100%)',
                border: '1px solid rgba(201,162,39,0.3)',
                borderRadius: 18, padding: '32px 28px', cursor: 'pointer',
                transition: 'all .2s', display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,162,39,0.3)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ fontSize: 48 }}>🇧🇪</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#14161a', marginBottom: 6 }}>Onboarding Belgique</div>
                <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
                  Mutuelles · INAMI · PARTENA · Spécificités belges
                </div>
              </div>
              <div style={{ marginTop: 'auto', fontSize: 13, fontWeight: 700, color: '#a17d0a' }}>Accéder →</div>
            </div>
          </div>
      </TrainerPage>
    )
  }

  if (activeView === 'onboarding') {
    const returnJournee = obReturnJournee
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <OnboardingView
          pName={pName}
          onBack={() => {
            setObReturnJournee(null)
            // Mode déjà choisi (sidebar) : on n'est jamais passé par l'écran
            // France/Belgique, donc "Retour" doit ramener à l'accueil, pas
            // vers un écran qu'on n'a jamais vu.
            setActiveView((trainerMode === 'paris' || trainerMode === 'province') ? 'home' : 'onboarding-choix')
          }}
          onLaunchModule={onLaunchModule}
          onEndRoom={handleEndRoomClick}
          onLaunchPeerQuiz={() => { setObReturnJournee('journee2'); setObReturnView('onboarding'); setActiveView('peer-quiz') }}
          initialStep={(returnJournee || obSkipSelect) ? 'modules' : 'select'}
          initialJournee={returnJournee}
          initialGroup={(trainerMode === 'paris' || trainerMode === 'province') ? categorySlugFromZone(trainerMode) : null}
        />
      </TrainerPage>
    )
  }

  if (activeView === 'onboarding-belgique') {
    const returnJourneeBelgique = obReturnJournee
    return (
      <TrainerPage activeView={activeView} {...trainerPageProps}>
        <OnboardingViewBelgique
          pName={pName}
          onBack={() => {
            setObReturnJournee(null)
            setActiveView(trainerMode === 'belgique' ? 'home' : 'onboarding-choix')
          }}
          onLaunchModule={(moduleId, journeeId) => onLaunchModule(moduleId, 'onboarding-modules-belgique', journeeId)}
          onEndRoom={handleEndRoomClick}
          onLaunchPeerQuiz={() => { setObReturnJournee('journee2'); setObReturnView('onboarding-belgique'); setActiveView('peer-quiz') }}
          initialJournee={returnJourneeBelgique}
        />
      </TrainerPage>
    )
  }


  return (
    <TrainerPage activeView={activeView} {...trainerPageProps}>
        <DashHeader
          pName={pName}
          activeRoomCode={activeRoomCode}
          onOpenTv={onOpenTv}
          onOpenRoom={handleOpenRoomClick}
          onOpenPlanning={onOpenPlanning}
          onEndRoomClick={() => setShowEndRoomConfirm(true)}
          trainerMode={trainerMode}
          onTrainerModeChange={handleTrainerModeChange}
          onSonnetteClick={() => setShowSonnette(true)}
          sonnettePending={sonnettePending}
          onTacheNotifsClick={handleOpenTacheNotifs}
          tacheNotifsCount={tacheNotifs.length}
        />
        <SonnettePanel
          visible={showSonnette}
          onClose={() => setShowSonnette(false)}
          onPendingChange={setSonnettePending}
          trainerName={pName}
        />
        {showEndRoomConfirm && (
          <ConfirmModal
            title="Clôturer la salle ?"
            message="Les résultats quiz et participants de la salle active vont être archivés dans l'historique, puis la salle sera fermée. Tu repartiras sur une salle neuve au prochain lancement."
            confirmLabel="Oui, clôturer"
            onConfirm={async () => { setShowEndRoomConfirm(false); await handleEndRoomClick() }}
            onCancel={() => setShowEndRoomConfirm(false)}
            danger={false}
          />
        )}
        {showTacheNotifs && (
          <div onClick={handleCloseTacheNotifs} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,20,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(16,24,40,0.25)' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a', marginBottom: 16 }}>🔔 Tâches terminées</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {tacheNotifs.map(n => {
                  const tache = allTaches.find(t => t.id === n.reference_id)
                  return (
                    <div key={n.id} style={{ background: '#f0fdf4', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 12, padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, color: '#14161a', lineHeight: 1.5 }}>
                        {tache ? <><strong>{tache.termine_par}</strong> a terminé la tâche « {tache.titre} »</> : 'Une tâche a été marquée terminée.'}
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={handleCloseTacheNotifs} style={{ width: '100%', padding: '10px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Fermer</button>
            </div>
          </div>
        )}

        {/* OB Banner */}
        <div className="ob-banner" onClick={handleOpenOnboarding}>
          <div className="ob-banner-icon">🚀</div>
          <div className="ob-banner-body">
            <div className="ob-banner-label">Formation · Suivi collaborateurs</div>
            <div className="ob-banner-title">Onboarding LPT</div>
            <div className="ob-banner-sub">France · Belgique — gérez la présence et le suivi de vos collaborateurs</div>
            <div className="ob-day-badge">Jour {obDay}</div>
          </div>
          <div className="ob-banner-arrow">→</div>
        </div>

        {/* Main tiles — uniquement ce qui n'a pas encore d'équivalent dans la
            sidebar (cf. tri demandé par Kevin) : Sessions/Inscriptions/Suivi
            magasin/Résultats des tests/Demandes d'intervention/Note de la
            formation/Retour de formation/Auto-éval vivent déjà dans leur
            catégorie de sidebar, inutile de les dupliquer ici. */}
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

          <div className="dash-tile" onClick={() => setActiveView('futurs-entrees')} style={{ borderColor: 'rgba(132,204,22,0.35)' }}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">🌱</div>
              <span className="dash-tile-link" style={{ color: '#84cc16' }}>Voir →</span>
            </div>
            <div className="dash-tile-count" style={{ color: '#84cc16' }}>{futursEntrees.length}</div>
            <div className="dash-tile-label">Futurs entrées</div>
            <div className="dash-tile-sub">En préparation côté RH</div>
          </div>

          <div className="dash-tile" onClick={() => setActiveView('taches')} style={{ borderColor: tachesCount > 0 ? 'rgba(220,38,38,0.4)' : 'rgba(0,137,186,0.3)' }}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">📌</div>
              <span className="dash-tile-link">Voir →</span>
            </div>
            <div className="dash-tile-count" style={tachesCount > 0 ? { color: '#dc2626' } : undefined}>{tachesCount}</div>
            <div className="dash-tile-label">Tâches</div>
            <div className="dash-tile-sub">{tachesCount > 0 ? `À traiter de ton côté` : 'Rien en attente pour toi'}</div>
          </div>

          {isTeamDashboard && (
            <div className="dash-tile" onClick={() => setActiveView('mes-avis')} style={{ borderColor: 'rgba(245,158,11,0.4)' }}>
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
                  <div className="dash-tile-label">Ma note de formation</div>
                  <div className="dash-tile-sub">{globalAvgRating.count} avis sur tes formés</div>
                </>
              ) : (
                <>
                  <div className="dash-tile-count" style={{ color: '#d97706', fontSize: 20 }}>—</div>
                  <div className="dash-tile-label">Ma note de formation</div>
                  <div className="dash-tile-sub">Aucun avis reçu pour l'instant</div>
                </>
              )}
            </div>
          )}
        </div>

      {roomModalOpen && (
        <RoomOpenModal
          trainerName={pName}
          loading={roomLoading}
          onCancel={() => setRoomModalOpen(false)}
          onConfirm={handleConfirmRoom}
        />
      )}
    </TrainerPage>
  )
}
