'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbSelect, sbDelete, getSharedState, insertSessionHistory, parseSessionHistorySummary, getRuntimeSessionCode } from '@/lib/supabase'
import PlanningWidget from './PlanningWidget'
import ShortcutsWidget from './ShortcutsWidget'
import OnboardingView from './OnboardingView'
import OnboardingViewBelgique from './OnboardingViewBelgique'
import EntreesView from './EntreesView'
import RoomOpenModal from './RoomOpenModal'
import { TRAINER_AVATARS, TRAINER_CANONICAL } from '@/lib/constants'
import { PLANNING_JOURS } from '@/lib/planningData'
import { setSharedState } from '@/lib/supabase'
import { findActiveRoomForTrainer, getLiveTrainerRoomCode, openOrCreateRoom, trainerLoginFromDisplayName } from '@/lib/sessionRoom'
import { isDynamicRoomCode } from '@/lib/sessionCode'
import { loadIdeesFromSupabase, deleteIdee, voteIdee, updateIdee, clearAllIdees } from '@/components/IdeesButton'
import SonnettePanel from './SonnettePanel'
import RetourFormationView from './RetourFormationView'


function DashHeader({ pName, onUpdatesClick, activeRoomCode, onOpenTv, onOpenRoom, onSonnetteClick, sonnettePending }) {
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
            {onOpenTv && (
              <button
                onClick={onOpenTv}
                title="Afficher le QR code sur le diffuseur"
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
                  borderRadius: 20, padding: '6px 12px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  color: '#00abe9', fontSize: 12, fontWeight: 700, transition: 'all .18s',
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.25)' }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.15)' }}
              >
                📺 QR
              </button>
            )}
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

function SessionsHistoryView({ onBack, onToast }) {
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

  const handleClearQuiz = async () => {
    await sbDelete('quiz_answers', 'id=gte.0')
    await sbDelete('module_results', 'id=gte.0')
    setQuizResults([])
    setModal(null)
    onToast('Résultats quiz vidés')
  }

  const handleClearHistory = async () => {
    await sbDelete('session_history', 'session_date=gte.2000-01-01')
    setSessions([])
    setModal(null)
    onToast('Historique vidé')
  }

  const handleCloseSession = async () => {
    setModal(null)
    const roomCode = getRuntimeSessionCode('trainer') || SESSION_CODE
    const enc = encodeURIComponent(roomCode)
    const filter = `session_code=eq.${enc}`
    const [participants, answers, quizResults, scenarioResponses, moduleResults] = await Promise.all([
      sbSelect('participants', filter),
      sbSelect('quiz_answers', filter),
      sbSelect('quiz_results', filter),
      sbSelect('scenario_responses', filter),
      sbSelect('module_results', filter),
    ])
    const total =
      (participants?.length || 0) +
      (answers?.length || 0) +
      (quizResults?.length || 0) +
      (scenarioResponses?.length || 0) +
      (moduleResults?.length || 0)
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
      },
      scenarioResponses: scenarioResponses || [],
    })
    await Promise.all([
      sbDelete('participants', filter),
      sbDelete('quiz_answers', filter),
      sbDelete('quiz_results', filter),
      sbDelete('scenario_responses', filter),
      sbDelete('module_results', filter),
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
          message="⚠️ ATTENTION — Tu es sur le point d'effacer définitivement tous les résultats du quiz de la semaine. Cette action est irréversible. Si tu veux garder une trace, clôture d'abord la session."
          confirmLabel="Oui, vider"
          onConfirm={handleClearQuiz}
          onCancel={() => setModal(null)}
          danger
        />
      )}
      {modal === 'history' && (
        <ConfirmModal
          title="Vider l'historique ?"
          message="⚠️ ATTENTION — Tu vas supprimer tout l'historique des sessions enregistrées. Cette action est irréversible et définitive."
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
            <div style={{ background: '#f8fafc', border: '1px dashed var(--border)', borderRadius: 'var(--rs)', padding: '28px', textAlign: 'center', marginBottom: 24 }}>
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
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '14px 18px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
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
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
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
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: '#0a1628', borderRadius: 24,
        border: '1px solid rgba(255,255,255,0.1)',
        width: '100%', maxWidth: 680,
        maxHeight: '90vh', overflowY: 'auto',
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

function AppUpdatesWidget() {
  const [selected, setSelected] = useState(null)
  return (
    <>
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderLeft: '4px solid #a78bfa',
        borderRadius: 'var(--r)', padding: '18px 24px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>⚡</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Mises à jour de l'app</div>
              <div style={{ fontSize: 11, color: 'var(--text-s)' }}>Nouveautés et corrections</div>
            </div>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(167,139,250,0.12)', color: '#7c3aed', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 20, padding: '3px 10px', letterSpacing: 0.5 }}>
            {APP_UPDATES.length} entrée{APP_UPDATES.length > 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {APP_UPDATES.map(u => (
            <div
              key={u.id}
              onClick={() => setSelected(u)}
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
                <span style={{ fontSize: 13, color: 'var(--text-s)' }}>{u.title}</span>
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

      {selected && <AppUpdateModal update={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

// ── Vue Idées ─────────────────────────────────────────────────────
function IdeesView({ onBack, pName }) {
  const [idees, setIdees] = useState([])
  const [loading, setLoading] = useState(true)
  const [subTab, setSubTab] = useState('pending') // 'pending' | 'validated'

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
  const handleDone = async (id) => { await deleteIdee(id); refresh() }

  const pending = idees.filter(i => !i.status || i.status === 'pending')
  const validated = idees.filter(i => i.status === 'validated')

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

  const IdeeCard = ({ idee, validated: isValidated }) => (
    <div style={{
      background: 'var(--bg)', borderRadius: 12,
      border: `1px solid ${isValidated ? 'rgba(74,222,128,0.2)' : 'var(--border)'}`,
      borderLeft: `3px solid ${isValidated ? '#4ade80' : 'rgba(245,158,11,0.5)'}`,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      {/* Texte + meta */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6, marginBottom: 6 }}>
            {idee.text}
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            {idee.auteur && (
              <span style={{ fontSize: 11, color: 'var(--text-s)' }}>👤 {idee.auteur}</span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-s)' }}>🕐 {formatDate(idee.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Row boutons vote + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {!isValidated && (
          <>
            <VoteBtn idee={idee} side="ok" />
            <VoteBtn idee={idee} side="pas_ok" />
            <div style={{ flex: 1 }} />
            <button
              onClick={() => handleValidate(idee.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)',
                color: '#4ade80',
              }}
            >✅ On le fait</button>
            <button
              onClick={() => handleReject(idee.id)}
              style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)',
                color: '#f87171',
              }}
            >❌ On fait pas</button>
          </>
        )}
        {isValidated && (
          <>
            <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>✓ Validée</span>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => handleDone(idee.id)}
              style={{
                padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: 'rgba(0,137,186,0.14)', border: '1px solid rgba(0,137,186,0.4)',
                color: '#00abe9',
              }}
            >✓ C'est fait !</button>
          </>
        )}
      </div>
    </div>
  )

  const renderGrouped = (grouped, isValidated) => {
    const entries = Object.entries(grouped)
    if (entries.length === 0) return (
      <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-s)' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{isValidated ? '🎯' : '💡'}</div>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          {isValidated ? 'Aucune idée validée pour l\'instant' : 'Aucune idée en attente'}
        </div>
        <div style={{ fontSize: 13 }}>
          {isValidated
            ? 'Validez des idées depuis l\'onglet "En attente de vote"'
            : 'Utilisez le bouton 💡 durant les modules pour noter des idées'}
        </div>
      </div>
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {entries.map(([moduleLabel, pages]) => (
          <div key={moduleLabel} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 18px',
              background: isValidated ? 'rgba(74,222,128,0.04)' : 'rgba(245,158,11,0.06)',
              borderBottom: isValidated ? '1px solid rgba(74,222,128,0.12)' : '1px solid rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>{moduleLabel}</span>
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '2px 10px',
                background: isValidated ? 'rgba(74,222,128,0.1)' : 'rgba(245,158,11,0.12)',
                border: isValidated ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(245,158,11,0.25)',
                color: isValidated ? '#4ade80' : '#d97706',
              }}>
                {Object.values(pages).flat().length} idée{Object.values(pages).flat().length > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {Object.entries(pages).map(([pageLabel, pageIdees]) => (
                <div key={pageLabel}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--text-s)',
                    textTransform: 'uppercase', letterSpacing: 0.8,
                    marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                    {pageLabel}
                    <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pageIdees.sort((a, b) => a.timestamp > b.timestamp ? 1 : -1).map(idee => (
                      <IdeeCard key={idee.id} idee={idee} validated={isValidated} />
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
      <button className="detail-back" onClick={onBack}>← Retour au tableau de bord</button>

      <div className="dash-header" style={{ marginBottom: 24 }}>
        <div>
          <h2 style={{ marginBottom: 4 }}>💡 Idées</h2>
          <p style={{ color: 'var(--text-s)', fontSize: 14 }}>
            {pending.length} en attente · {validated.length} validée{validated.length > 1 ? 's' : ''} · <span style={{ opacity: 0.5 }}>sync toutes les 10s</span>
          </p>
        </div>
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

      {/* Sous-onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--card)', borderRadius: 12, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
        {[
          { key: 'pending', label: `💡 En attente de vote`, count: pending.length },
          { key: 'validated', label: `🎯 Validées à réaliser`, count: validated.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            style={{
              padding: '8px 18px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              background: subTab === tab.key ? (tab.key === 'validated' ? 'rgba(74,222,128,0.15)' : 'rgba(245,158,11,0.15)') : 'transparent',
              border: subTab === tab.key ? (tab.key === 'validated' ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(245,158,11,0.35)') : '1px solid transparent',
              color: subTab === tab.key ? (tab.key === 'validated' ? '#4ade80' : '#f59e0b') : 'var(--text-s)',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 800,
                background: subTab === tab.key
                  ? (tab.key === 'validated' ? 'rgba(74,222,128,0.2)' : 'rgba(245,158,11,0.2)')
                  : 'rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '1px 7px',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {subTab === 'pending' && renderGrouped(pendingGrouped, false)}
      {subTab === 'validated' && renderGrouped(validatedGrouped, true)}
    </div>
  )
}

const FICHES = [
  { label: 'Fiche pratique', href: '/fiche-pratique', icon: '📄', color: '#c9a227', sub: 'Synthèse de la formation' },
  { label: 'Fiche accès LPT', href: '/fiche-acces', icon: '🔑', color: '#0089ba', sub: 'Gmail · Slack · LPTBot' },
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
  const [activeView, setActiveView] = useState('home') // home | sessions | entrees | modules | onboarding | onboarding-belgique | planning | retour-formation
  const [entreeCount, setEntreeCount] = useState(null)
  const [sessionCount, setSessionCount] = useState('—')
  const [sessionLast, setSessionLast] = useState('Chargement…')
  const [selectedUpdate, setSelectedUpdate] = useState(null)
  const [roomModalOpen, setRoomModalOpen] = useState(false)
  const [roomLoading, setRoomLoading] = useState(false)
  const [activeRoomCode, setActiveRoomCode] = useState('')

  const [obDay, setObDay] = useState('1')
  const [ideeCount, setIdeeCount] = useState(0)
  const [showSonnette, setShowSonnette] = useState(false)
  const [sonnettePending, setSonnettePending] = useState(0)

  useEffect(() => {
    loadIdeesFromSupabase().then(list => setIdeeCount(list.length)).catch(() => {})
  }, [])

  useEffect(() => {
    loadTileStats()
    refreshActiveRoom()
    const interval = setInterval(() => {
      loadTileStats()
      refreshActiveRoom()
    }, 15000)
    return () => clearInterval(interval)
  }, [pName])

  const refreshActiveRoom = async () => {
    const login = trainerLoginFromDisplayName(pName)
    const code = await getLiveTrainerRoomCode(login, pName)
    setActiveRoomCode(code)
  }

  useEffect(() => {
    const onFocus = () => { refreshActiveRoom() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refreshActiveRoom()
    })
    return () => {
      window.removeEventListener('focus', onFocus)
    }
  }, [pName])

  const handleOpenRoomClick = async () => {
    const login = trainerLoginFromDisplayName(pName)
    const existing = await findActiveRoomForTrainer(login, pName)
    if (existing?.code) {
      onOpenRoom?.({ code: existing.code, resumed: true })
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
        <SessionsHistoryView onBack={() => { setActiveView('home'); loadTileStats() }} onToast={onToast} />
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
    return <IdeesView onBack={() => setActiveView('home')} pName={pName} />
  }

  if (activeView === 'retour-formation') {
    return (
      <RetourFormationView
        onBack={() => setActiveView('home')}
        pName={pName}
      />
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
    return (
      <div id="dashboard">
        <OnboardingView
          pName={pName}
          onBack={() => setActiveView('onboarding-choix')}
          onLaunchFormation={onLaunchSession}
          onLaunchModule={onLaunchModule}
        />
      </div>
    )
  }

  if (activeView === 'onboarding-belgique') {
    return (
      <div id="dashboard">
        <OnboardingViewBelgique
          pName={pName}
          onBack={() => setActiveView('onboarding-choix')}
          onLaunchFormation={onLaunchSession}
          onLaunchModule={(moduleId, journeeId) => onLaunchModule(moduleId, 'onboarding-modules-belgique', journeeId)}
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
                  background: '#fff', border: '1px solid var(--border)',
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
                    return (
                      <div key={i} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderLeft: `3px solid ${jour.color}`, borderRadius: 8, padding: '10px 14px' }}>
                        {bloc.horaire && (
                          <div style={{ fontSize: 10, fontWeight: 700, color: jour.color, marginBottom: 2, letterSpacing: 0.5 }}>{bloc.horaire}</div>
                        )}
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: bloc.items.length > 0 ? 6 : 0 }}>{bloc.titre}</div>
                        {bloc.items.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {bloc.items.map((item, j) => (
                              <div key={j} style={{ fontSize: 11, color: 'var(--text-s)', background: '#fff', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 8px' }}>
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

          <div style={{ marginTop: 16, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '28px 30px', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 12 }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
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
          onUpdatesClick={() => setSelectedUpdate(APP_UPDATES[0])}
          activeRoomCode={activeRoomCode}
          onOpenTv={onOpenTv}
          onOpenRoom={handleOpenRoomClick}
          onSonnetteClick={() => setShowSonnette(true)}
          sonnettePending={sonnettePending}
        />
        <SonnettePanel
          visible={showSonnette}
          onClose={() => setShowSonnette(false)}
          onPendingChange={setSonnettePending}
        />
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
            background: '#fff', border: '1px solid var(--border)',
            borderLeft: '4px solid #00abe9',
            borderRadius: 'var(--r)', padding: '18px 24px',
            cursor: 'pointer', marginBottom: 16, transition: 'all .2s',
          }}
          onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,171,233,.1)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
          onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,171,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00abe9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>4 jours · Onboarding intensif</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Planning formation</div>
              <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 1 }}>Diffusez le programme du jour sur les écrans</div>
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

          <div className="dash-tile" onClick={() => setActiveView('retour-formation')} style={{ borderColor: 'rgba(99,102,241,0.35)' }}>
            <div className="dash-tile-top">
              <div className="dash-tile-icon">📝</div>
              <span className="dash-tile-link" style={{ color: '#818cf8' }}>Accéder →</span>
            </div>
            <div className="dash-tile-count" style={{ color: '#818cf8' }}>{entreeCount ?? '—'}</div>
            <div className="dash-tile-label">Retour de formation</div>
            <div className="dash-tile-sub">Fiches de suivi par collaborateur</div>
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
