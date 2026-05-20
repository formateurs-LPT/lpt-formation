'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbSelect, SESSION_CODE } from '@/lib/supabase'
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

export default function Dashboard({ pName, onLaunchSession, onToast, onOnlineCount }) {
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
      const history = await sbSelect('session_history')
      setSessionCount(history?.length || 0)
      if (history?.length) {
        const last = history[history.length - 1]
        const d = new Date(last.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
        setSessionLast(`Dernière : ${d}`)
      } else {
        setSessionLast('Aucune session enregistrée')
      }
    } catch {}
  }

  const obDay = typeof window !== 'undefined' ? (localStorage.getItem('ob_day') || '1') : '1'

  if (activeView === 'entrees') {
    return (
      <div id="dashboard">
        <EntreesView onBack={() => setActiveView('home')} onToast={onToast} />
      </div>
    )
  }

  if (activeView === 'onboarding') {
    return (
      <div id="dashboard">
        <OnboardingView
          onBack={() => setActiveView('home')}
          onLaunchFormation={onLaunchSession}
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
