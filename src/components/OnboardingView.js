'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TRAINER_AVATARS } from '@/lib/constants'
import { generatePin } from '@/lib/pin'

const PARIS_MAGASINS = ['chatelet','st lazare','saint lazare','montparnasse','italie','commerce','bastille','cergy','creteil','créteil','belle epine','belle épine','paris','st ouen','saint ouen','ouen','beauchamp','odysseum','supply']
const BELGIQUE_MAGASINS = ['namur','liege','liège','fripier','ixelles','charleroi','bruxelles']

function classifyMagasin(magasin) {
  const m = (magasin || '').toLowerCase()
  if (BELGIQUE_MAGASINS.some(b => m.includes(b))) return 'belgique'
  if (PARIS_MAGASINS.some(p => m.includes(p))) return 'paris'
  return 'province'
}

const JOURNEES = (onLaunchModule) => [
  {
    id: 'journee1',
    titre: 'Journée 1',
    modules: [
      {
        visual: 'avatar', src: '/assets/avatar_paul.png',
        label: "Présentation de l'entreprise",
        sub: 'Paul Morlet — Histoire, valeurs et missions de LPT',
        soon: true,
      },
      {
        visual: 'emoji', icon: '👁️',
        label: "Les bases de l'optique",
        sub: 'Lecture d\'ordonnance — Décoder une prescription optique',
        onClick: () => onLaunchModule('optique'),
      },
      {
        visual: 'image', src: '/assets/verre-unifocal-2.png',
        label: 'Les types de verres',
        sub: 'Unifocaux, progressifs, antireflets et traitements',
        onClick: () => onLaunchModule('types-verres'),
      },
    ],
  },
]

// ── Step 1 : Choix du groupe ──────────────────────────────────────
function GroupSelect({ onSelect, onBack }) {
  const [counts, setCounts] = useState({ paris: 0, visio: 0 })

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('entrees_data') || '[]')
    const paris = data.filter(e => classifyMagasin(e.magasin) === 'paris').length
    const visio = data.filter(e => ['province', 'belgique'].includes(classifyMagasin(e.magasin))).length
    setCounts({ paris, visio })
  }, [])

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour</button>
      <div className="dash-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div className="dash-hero-label">Formation · Suivi collaborateurs</div>
          <h2 className="dash-hero-title">ONBOARDING</h2>
          <p className="dash-hero-date">Choisissez le groupe que vous accompagnez aujourd'hui</p>
        </div>
        <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, position: 'relative', zIndex: 1 }}>🚀</div>
      </div>

      <div className="ob-group-grid">
        <div className="ob-group-card" onClick={() => onSelect('presentiel')}>
          <div className="ob-group-card-icon">🏢</div>
          <div className="ob-group-card-title">Présentiel</div>
          <div className="ob-group-card-sub">Paris</div>
          <div className="ob-group-card-count">{counts.paris} collaborateur{counts.paris !== 1 ? 's' : ''}</div>
        </div>
        <div className="ob-group-card" onClick={() => onSelect('visio')}>
          <div className="ob-group-card-icon">💻</div>
          <div className="ob-group-card-title">Visio</div>
          <div className="ob-group-card-sub">Province · Belgique</div>
          <div className="ob-group-card-count">{counts.visio} collaborateur{counts.visio !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>
  )
}

// ── Step 2 : Liste présence ───────────────────────────────────────
function CollabList({ group, onNext, onBack }) {
  const [collabs, setCollabs] = useState([])
  const [checks, setChecks] = useState({})

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('entrees_data') || '[]')
    const filtered = group === 'presentiel'
      ? data.filter(e => classifyMagasin(e.magasin) === 'paris')
      : data.filter(e => ['province', 'belgique'].includes(classifyMagasin(e.magasin)))
    setCollabs(filtered)
    const saved = JSON.parse(localStorage.getItem('ob_data') || '{}')
    setChecks(saved)
  }, [group])

  const toggle = (key, field) => {
    const updated = {
      ...checks,
      [key]: { ...(checks[key] || {}), [field]: !(checks[key]?.[field]) }
    }
    setChecks(updated)
    localStorage.setItem('ob_data', JSON.stringify(updated))
    // marque la date du 1er onboarding
    if (!localStorage.getItem('ob_date')) {
      localStorage.setItem('ob_date', new Date().toDateString())
      localStorage.setItem('ob_day', '1')
    }
  }

  const title = group === 'presentiel' ? '🏢 Présentiel · Paris' : '💻 Visio · Province & Belgique'

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour</button>
      <div className="dash-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div className="dash-hero-label">ONBOARDING · Suivi présence</div>
          <h2 className="dash-hero-title">{title}</h2>
          <p className="dash-hero-date">Cochez la présence, la signature du contrat et laissez un commentaire par collaborateur</p>
        </div>
        <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, position: 'relative', zIndex: 1 }}>👥</div>
      </div>

      <div className="ob-collab-list">
        {collabs.length === 0 ? (
          <p style={{ color: 'var(--text-m)', fontSize: 14, textAlign: 'center', padding: '40px 20px' }}>
            Aucun collaborateur dans ce groupe.<br />
            Importez d'abord le tableau RH depuis "Entrées de la semaine".
          </p>
        ) : collabs.map((c, i) => {
          const fullName = ((c.nom || '') + ' ' + (c.prenom || '')).trim() || 'Collaborateur ' + (i + 1)
          const key = fullName.replace(/"/g, '')
          const d = checks[key] || {}
          const pin = generatePin(fullName)
          return (
            <div key={key} className="ob-collab-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div className="ob-collab-name">{fullName}</div>
                <div style={{
                  background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8,
                  padding: '2px 9px', fontSize: 12, fontWeight: 800,
                  color: '#0089ba', letterSpacing: 1, flexShrink: 0,
                }}>🔑 {pin}</div>
              </div>
              <div className="ob-collab-checks">
                <label className="ob-collab-check">
                  <input type="checkbox" checked={!!d.present} onChange={() => toggle(key, 'present')} />
                  Présent
                </label>
                <label className="ob-collab-check">
                  <input type="checkbox" checked={!!d.contrat} onChange={() => toggle(key, 'contrat')} />
                  Contrat signé
                </label>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn1" onClick={onNext}>Démarrer la session →</button>
      </div>
    </div>
  )
}

// ── Step 3a : Modules d'une journée ──────────────────────────────
function JourneeModules({ journee, onBack, onLaunchModule }) {
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour aux journées</button>
      <div className="dash-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div className="dash-hero-label">Formation · Lunettes Pour Tous</div>
          <h2 className="dash-hero-title">{journee.titre}</h2>
          <p className="dash-hero-date">{cap(dateStr)}</p>
        </div>
        <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, position: 'relative', zIndex: 1 }}>🎓</div>
      </div>

      <div className="dash-tiles" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {journee.modules.map((mod, i) => (
          <div
            key={i}
            className="dash-tile"
            onClick={mod.soon ? undefined : mod.onClick}
            style={{ cursor: mod.soon ? 'default' : 'pointer', opacity: mod.soon ? 0.75 : 1 }}
          >
            <div className="dash-tile-top">
              {mod.visual === 'avatar' && (
                <Image src={mod.src} alt="" width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              )}
              {mod.visual === 'emoji' && (
                <div className="dash-tile-icon">{mod.icon}</div>
              )}
              {mod.visual === 'image' && (
                <Image src={mod.src} alt="" width={38} height={38} style={{ objectFit: 'contain', flexShrink: 0 }} />
              )}
              {mod.soon && (
                <span style={{
                  fontSize: 10, fontWeight: 700, color: '#f59e0b',
                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                  borderRadius: 20, padding: '2px 8px', letterSpacing: 0.5,
                }}>Bientôt</span>
              )}
            </div>
            <div className="dash-tile-label" style={{ marginTop: 12 }}>{mod.label}</div>
            <div className="dash-tile-sub">{mod.sub}</div>
            {!mod.soon && (
              <div style={{ fontSize: 11, color: '#00abe9', marginTop: 8, fontWeight: 600 }}>Lancer →</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 3 : Sélection de la journée ─────────────────────────────
function SessionModules({ onBack, onLaunchFormation, onLaunchModule }) {
  const [selectedJournee, setSelectedJournee] = useState(null)
  const journees = JOURNEES(onLaunchModule)
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''

  if (selectedJournee) {
    const journee = journees.find(j => j.id === selectedJournee)
    return <JourneeModules journee={journee} onBack={() => setSelectedJournee(null)} onLaunchModule={onLaunchModule} />
  }

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour à la liste</button>
      <div className="dash-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div className="dash-hero-label">Formation · Lunettes Pour Tous</div>
          <h2 className="dash-hero-title">Modules de formation</h2>
          <p className="dash-hero-date">{cap(dateStr)}</p>
        </div>
        <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, position: 'relative', zIndex: 1 }}>🎓</div>
      </div>

      <div className="dash-tiles" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {journees.map((j) => (
          <div key={j.id} className="dash-tile" onClick={() => setSelectedJournee(j.id)} style={{ cursor: 'pointer' }}>
            <div className="dash-tile-top">
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: '#00abe9',
              }}>1</div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 500 }}>
                {j.modules.length} modules
              </span>
            </div>
            <div className="dash-tile-label" style={{ marginTop: 12 }}>{j.titre}</div>
            <div className="dash-tile-sub">Les fondamentaux de l'optique</div>
            <div style={{ fontSize: 11, color: '#00abe9', marginTop: 8, fontWeight: 600 }}>Voir les modules →</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function OnboardingView({ onBack, onLaunchFormation, onLaunchModule, initialStep = 'select' }) {
  const [step, setStep] = useState(initialStep) // select | list | modules
  const [group, setGroup] = useState(null)

  const handleSelectGroup = (g) => {
    setGroup(g)
    setStep('list')
  }

  if (step === 'select') return <GroupSelect onSelect={handleSelectGroup} onBack={onBack} />
  if (step === 'list') return <CollabList group={group} onNext={() => setStep('modules')} onBack={() => setStep('select')} />
  if (step === 'modules') return <SessionModules onBack={() => setStep('list')} onLaunchFormation={onLaunchFormation} onLaunchModule={onLaunchModule} />
  return null
}
