'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbSelect, sbInsert, sbDelete, SESSION_CODE } from '@/lib/supabase'
import WeatherWidget from './WeatherWidget'
import ShortcutsWidget from './ShortcutsWidget'
import NotesWidget from './NotesWidget'
import OnboardingView from './OnboardingView'
import EntreesView from './EntreesView'
import { TRAINER_AVATARS } from '@/lib/constants'

const NEWS_ITEMS = [
  '📚 Formation Verre Progressif — Module complet',
  '🎯 Objectif : maîtriser les arguments de vente',
  '💡 3 zones : Vision de loin · Vision intermédiaire · Vision de près',
  '🔬 Zones d\'aberrations réduites = Vision extra-large à 180°',
  '💊 Garantie Adaptation 100 jours — satisfait ou échangé',
  '🏆 Offre 100% Santé : 2 paires à 0€',
  '⭐ Offre 1=1 : 2 paires pour ~260€',
  '📋 Quiz initial → Formation → Quiz final',
]

function NewsTicker() {
  const doubled = [...NEWS_ITEMS, ...NEWS_ITEMS]
  return (
    <div className="news-ticker">
      <div className="news-ticker-track running">
        {doubled.map((item, i) => (
          <span key={i} className="news-item">
            <span className="news-item-dot"></span>
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function DashHeader({ pName }) {
  const key = (pName || '').toLowerCase()
  const avatarSrc = TRAINER_AVATARS[key] || '/assets/avatar_kevin.png'
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

  return (
    <div className="dash-hero">
      <Image
        src={avatarSrc}
        alt={pName}
        width={90}
        height={90}
        className="dash-hero-avatar"
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="dash-hero-label">Formation · Lunettes Pour Tous</div>
        <h2 className="dash-hero-title">Bonjour, {cap(pName)} 👋</h2>
        <p className="dash-hero-date">{cap(today)}</p>
      </div>
    </div>
  )
}

function SessionsHistoryView({ onBack, onToast }) {
  const [sessions, setSessions] = useState([])
  const [quizResults, setQuizResults] = useState([])
  const [loading, setLoading] = useState(true)

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
    if (!confirm('Vider les résultats du quiz ?')) return
    await sbDelete('quiz_answers', 'id=gte.0')
    await sbDelete('module_results', 'id=gte.0')
    setQuizResults([])
    onToast('Résultats quiz vidés')
  }

  const handleClearHistory = async () => {
    if (!confirm('Vider l\'historique des sessions ?')) return
    await sbDelete('session_history', 'session_date=gte.2000-01-01')
    setSessions([])
    onToast('Historique vidé')
  }

  const handleCloseSession = async () => {
    if (!confirm('Clôturer la session et enregistrer les résultats ?')) return
    const [participants, answers] = await Promise.all([
      sbSelect('participants', 'session_code=eq.' + SESSION_CODE),
      sbSelect('quiz_answers', 'session_code=eq.' + SESSION_CODE),
    ])
    if ((participants?.length || 0) + (answers?.length || 0) === 0) {
      onToast('Aucune donnée à enregistrer'); return
    }
    await sbInsert('session_history', {
      session_code: SESSION_CODE + '_' + Date.now(),
      session_date: new Date().toISOString(),
      participants: JSON.stringify(participants || []),
      quiz_results: JSON.stringify(answers || []),
      scenario_responses: '[]',
    })
    await Promise.all([
      sbDelete('participants', 'session_code=eq.' + SESSION_CODE),
      sbDelete('quiz_answers', 'session_code=eq.' + SESSION_CODE),
      sbDelete('module_results', 'id=gte.0'),
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
        <button className="btn1" onClick={handleCloseSession} style={{ fontSize: 13, padding: '8px 16px' }}>
          🔒 Clôturer la session
        </button>
      </div>

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
              <button className="btn2" onClick={handleClearQuiz} style={{ color: '#dc2626', borderColor: '#dc2626', fontSize: 13 }}>
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
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--lpt)' }}>+{xp}</div>
                        <div style={{ fontSize: 10, color: 'var(--lpt-d)', fontWeight: 600 }}>XP</div>
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
              <button className="btn2" onClick={handleClearHistory} style={{ color: '#dc2626', borderColor: '#dc2626', fontSize: 13 }}>
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
                return (
                  <div key={i} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--lpt-l)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📅</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{cap(date)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 2 }}>{s.notes || '—'}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--lpt)' }}>{s.participant_count}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-m)' }}>collaborateur{s.participant_count !== 1 ? 's' : ''}</div>
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

export default function Dashboard({ pName, onLaunchSession, onLaunchModule, onToast, onOnlineCount }) {
  const [activeView, setActiveView] = useState('home') // home | sessions | entrees | modules | onboarding
  const [entreeCount, setEntreeCount] = useState(null)
  const [sessionCount, setSessionCount] = useState('—')
  const [sessionLast, setSessionLast] = useState('Chargement…')

  useEffect(() => {
    loadTileStats()
  }, [])

  const loadTileStats = async () => {
    try {
      const entrees = JSON.parse(localStorage.getItem('entrees_data') || '[]')
      setEntreeCount(entrees.length || '—')
      const [history, answers] = await Promise.all([
        sbSelect('session_history'),
        sbSelect('quiz_answers'),
      ])
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

  const obDay = typeof window !== 'undefined' ? (localStorage.getItem('ob_day') || '1') : '1'

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
        <EntreesView onBack={() => { setActiveView('home'); loadTileStats() }} onToast={onToast} />
      </div>
    )
  }

  if (activeView === 'onboarding') {
    return (
      <div id="dashboard">
        <OnboardingView
          onBack={() => { setActiveView('home'); loadTileStats() }}
          onLaunchFormation={onLaunchSession}
          onLaunchModule={onLaunchModule}
        />
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
            onClick={onLaunchSession}
            style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '28px 30px', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 24, marginBottom: 12 }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--lpt)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,171,233,.12)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg,#0089ba,#00abe9)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, flexShrink: 0 }}>🎓</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--lpt)', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 6 }}>Module disponible</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Formation — Le Verre Progressif</div>
              <div style={{ fontSize: 13, color: 'var(--text-s)', marginBottom: 12 }}>Module complet de formation à la vente et à la compréhension du verre progressif.</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['① Quiz initial', '② Les bases', '③ Arguments & Offre', '④ Ordonnances', '⑤ Quiz final'].map(t => (
                  <span key={t} style={{ padding: '3px 10px', background: 'var(--lpt-l)', color: 'var(--lpt-dd)', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{t}</span>
                ))}
              </div>
            </div>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--lpt)', fontSize: 14, fontWeight: 600 }}>
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
        <DashHeader pName={pName} />
        <NewsTicker />

        {/* OB Banner */}
        <div className="ob-banner" onClick={() => setActiveView('onboarding')}>
          <div className="ob-banner-icon">🚀</div>
          <div className="ob-banner-body">
            <div className="ob-banner-label">Formation · Suivi collaborateurs</div>
            <div className="ob-banner-title">Onboarding LPT</div>
            <div className="ob-banner-sub">Gérez la présence et le suivi de vos collaborateurs</div>
            <div className="ob-day-badge">Jour {obDay}</div>
          </div>
          <div className="ob-banner-arrow">→</div>
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

          <div className="dash-tile dash-tile-cta" onClick={() => setActiveView('modules')}>
            <div className="dash-tile-cta-icon">▶</div>
            <div className="dash-tile-label">Démarrer une session</div>
            <div className="dash-tile-sub">Lancer une nouvelle formation</div>
          </div>
        </div>

        {/* Weather + Progress */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <WeatherWidget pName={pName} onToast={onToast} />
          <ShortcutsWidget />
        </div>

        {/* Notes board */}
        <NotesWidget pName={pName} />
      </div>
    </div>
  )
}
