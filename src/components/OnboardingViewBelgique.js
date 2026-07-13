'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { TRAINER_AVATARS } from '@/lib/constants'
import { generatePin } from '@/lib/pin'
import { getSharedState, setSharedState, setRoomSharedState, sbUpsert, sbSelect, getActiveSessionCode } from '@/lib/supabase'
import {
  listFormationCategories,
} from '@/lib/formationCategories'
import { getLegacySessionCode, isDynamicRoomCode } from '@/lib/sessionCode'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'
import ConfirmModal from '@/components/ConfirmModal'

const JOURNEES_BELGIQUE = (onLaunchModule) => [
  {
    id: 'journee1',
    numero: 1,
    titre: 'Journée 1',
    sub: 'Les fondamentaux de l\'optique',
    modules: [
      {
        visual: 'avatar', src: '/assets/avatar_paul.png',
        label: "Présentation de l'entreprise",
        sub: 'Paul Morlet — Histoire, valeurs et missions de LPT',
        onClick: () => onLaunchModule('entreprise'),
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
      {
        visual: 'emoji', icon: '👓',
        label: 'Connaissances Montures',
        sub: 'Acétate · Métal · Injecté — fin de journée',
        onClick: () => onLaunchModule('montures'),
      },
      {
        visual: 'emoji', icon: '🔍',
        label: 'Découverte des montures',
        sub: 'Activité terrain — ~17h00',
        soon: true,
      },
    ],
  },
  {
    id: 'journee2',
    numero: 2,
    titre: 'Journée 2',
    sub: 'Les offres et la vente',
    modules: [
      {
        visual: 'emoji', icon: '🪟',
        label: 'Merch montures',
        sub: 'Merchandising — avant l\'accueil (matin)',
        soon: true,
      },
      {
        visual: 'emoji', icon: '🤝',
        label: "Trame d'accueil",
        sub: 'Bonjour · Concept LPT · Examen de vue — 4 points clés',
        onClick: () => onLaunchModule('trame-accueil'),
      },
      {
        visual: 'emoji', icon: '🏷️',
        label: 'Les offres',
        sub: 'Découverte des offres LPT et argumentation commerciale',
        onClick: () => onLaunchModule('offres'),
      },
    ],
  },
  {
    id: 'journee3',
    numero: 3,
    titre: 'Journée 3',
    sub: 'La prise de mesures',
    modules: [
      {
        visual: 'image', src: '/assets/LPT003-EFO-001.avif',
        label: 'Prise de mesures',
        sub: 'Écart pupillaire · Hauteur · LPTVISION',
        onClick: () => onLaunchModule('pdm'),
      },
    ],
  },
]

// ── Step 1 : Liste présence ───────────────────────────────────────
function CollabListBelgique({ onNext, onBack }) {
  const [collabs, setCollabs] = useState([])
  const [checks, setChecks] = useState({})

  useEffect(() => {
    const load = async () => {
      let data = []
      let obData = {}
      try {
        const state = await getSharedState()
        data = state.entrees_data || JSON.parse(localStorage.getItem('entrees_data') || '[]')
        obData = state.ob_data || JSON.parse(localStorage.getItem('ob_data') || '{}')
      } catch {
        data = JSON.parse(localStorage.getItem('entrees_data') || '[]')
        obData = JSON.parse(localStorage.getItem('ob_data') || '{}')
      }

      // Fallback : charger depuis participants Supabase si entrees_data vide
      if (data.length === 0) {
        try {
          const rows = await sbSelect('participants', `session_code=eq.${getActiveSessionCode()}&order=joined_at.asc`)
          if (rows && rows.length > 0) {
            data = rows.map(r => {
              const parts = (r.name || '').trim().split(/\s+/)
              return { nom: parts.slice(1).join(' ') || '', prenom: parts[0] || '', magasin: '', heures: '', poste: '', telephone: '' }
            })
          }
        } catch (e) { console.warn('participants fallback échoué', e) }
      }

      setCollabs(data)
      setChecks(obData)
    }
    load()
  }, [])

  // Calcule le lundi de la semaine courante (clé week_date)
  const getWeekDate = () => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().slice(0, 10)
  }

  const toggle = async (key, field, collab) => {
    const updated = {
      ...checks,
      [key]: { ...(checks[key] || {}), [field]: !(checks[key]?.[field]) }
    }
    setChecks(updated)
    localStorage.setItem('ob_data', JSON.stringify(updated))
    const patch = { ob_data: updated }
    // marque la date du 1er onboarding
    const state = await getSharedState().catch(() => ({}))
    if (!state.ob_date) {
      const today = new Date().toDateString()
      localStorage.setItem('ob_date', today)
      localStorage.setItem('ob_day', '1')
      patch.ob_date = today
      patch.ob_day = '1'
    }
    setSharedState(patch).catch(console.warn)

    // Écriture dans la table onboarding_sessions
    const d = updated[key] || {}
    sbUpsert('onboarding_sessions', {
      week_date: getWeekDate(),
      collaborateur: key,
      pin: generatePin(key),
      magasin: collab?.magasin || '',
      poste: collab?.poste || '',
      present: !!d.present,
      contrat: !!d.contrat,
    }, 'collaborateur,week_date').catch(console.warn)
  }

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour</button>
      <div className="dash-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div className="dash-hero-label">ONBOARDING BELGIQUE · Suivi présence</div>
          <h2 className="dash-hero-title">Tous les collaborateurs</h2>
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
                  <input type="checkbox" checked={!!d.present} onChange={() => toggle(key, 'present', c)} />
                  Présent
                </label>
                <label className="ob-collab-check">
                  <input type="checkbox" checked={!!d.contrat} onChange={() => toggle(key, 'contrat', c)} />
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
function JourneeModulesBelgique({ journee, onBack, onLaunchModule }) {
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour aux journées</button>
      <div className="dash-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div className="dash-hero-label">Formation · Lunettes Pour Tous Belgique</div>
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
function SessionModulesBelgique({ pName, onBack, onLaunchFormation, onLaunchModule, onEndRoom, initialJournee = null }) {
  const [selectedJournee, setSelectedJournee] = useState(initialJournee)
  const journees = JOURNEES_BELGIQUE(onLaunchModule)
  const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : ''
  const [roomCode, setRoomCode] = useState('')
  const [endConfirmOpen, setEndConfirmOpen] = useState(false)
  const [endingRoom, setEndingRoom] = useState(false)
  const categories = listFormationCategories()

  useEffect(() => {
    let cancelled = false
    const syncRoom = async () => {
      const code = await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName)
      if (!cancelled) setRoomCode(code || getLegacySessionCode())
    }
    syncRoom()
    const interval = setInterval(syncRoom, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [pName])
  const isRoomSession = isDynamicRoomCode(roomCode)

  const showQrOnTv = async () => {
    const code = (isDynamicRoomCode(roomCode) ? roomCode : null) || getActiveSessionCode()
    try {
      if (isDynamicRoomCode(code)) {
        await setRoomSharedState({ tv_screen: 'qr' }, code)
      } else {
        await setSharedState({ tv_screen: 'qr' })
      }
    } catch (e) {
      console.warn('[showQrOnTv]', e)
    }
  }

  const handleConfirmEndRoom = async () => {
    if (!onEndRoom) return
    setEndingRoom(true)
    try {
      await onEndRoom(roomCode)
      setEndConfirmOpen(false)
    } finally {
      setEndingRoom(false)
    }
  }

  const openJournee = (journeeId) => {
    setSelectedJournee(journeeId)
    showQrOnTv()
  }

  if (selectedJournee) {
    const journee = journees.find(j => j.id === selectedJournee)
    return <JourneeModulesBelgique journee={journee} onBack={() => setSelectedJournee(null)} onLaunchModule={onLaunchModule} />
  }

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour à la liste</button>
      <div className="dash-hero" style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
          <div className="dash-hero-label">Formation · Lunettes Pour Tous Belgique</div>
          <h2 className="dash-hero-title">Modules de formation</h2>
          <p className="dash-hero-date">{cap(dateStr)}</p>
          {isRoomSession && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14, alignItems: 'center' }}>
              <span style={{
                fontSize: 13, fontWeight: 700, color: '#00abe9',
                background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)',
                borderRadius: 20, padding: '6px 14px', letterSpacing: 2, fontFamily: 'monospace',
              }}>
                Salle {roomCode}
              </span>
              <button
                type="button"
                onClick={showQrOnTv}
                style={{
                  fontSize: 12, fontWeight: 700, color: '#fff',
                  background: '#0089ba', border: 'none', borderRadius: 20,
                  padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Réafficher le QR sur TV
              </button>
              {onEndRoom && isRoomSession && (
                <button
                  type="button"
                  onClick={() => setEndConfirmOpen(true)}
                  style={{
                    fontSize: 12, fontWeight: 700, color: '#fecaca',
                    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)',
                    borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Terminer la salle
                </button>
              )}
            </div>
          )}
        </div>
        <div style={{ width: 56, height: 56, background: 'rgba(255,255,255,.08)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, position: 'relative', zIndex: 1 }}>🎓</div>
      </div>

      <div className="dash-tiles" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {journees.map((j) => (
          <div key={j.id} className="dash-tile" onClick={() => openJournee(j.id)} style={{ cursor: 'pointer' }}>
            <div className="dash-tile-top">
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: '#00abe9',
              }}>{j.numero}</div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', fontWeight: 500 }}>
                {j.modules.length} module{j.modules.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="dash-tile-label" style={{ marginTop: 12 }}>{j.titre}</div>
            <div className="dash-tile-sub">{j.sub}</div>
            <div style={{ fontSize: 11, color: '#00abe9', marginTop: 8, fontWeight: 600 }}>Voir les modules →</div>
          </div>
        ))}

        {/* Tuile Réveil des acquis */}
        <div className="dash-tile" onClick={() => { showQrOnTv(); onLaunchModule('reveil-acquis') }} style={{ cursor: 'pointer', borderColor: 'rgba(245,158,11,0.25)' }}>
          <div className="dash-tile-top">
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>⚡</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '2px 8px', letterSpacing: 0.5 }}>
              3 journées
            </span>
          </div>
          <div className="dash-tile-label" style={{ marginTop: 12 }}>Réveil des acquis</div>
          <div className="dash-tile-sub">FAQ et quiz de consolidation</div>
          <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 8, fontWeight: 600 }}>Voir les révéils →</div>
        </div>

        {/* Tuile Mini Jeux */}
        <div className="dash-tile" onClick={() => { setSharedState({ tv_screen: null }).catch(() => {}); onLaunchModule('mini-jeux') }} style={{ cursor: 'pointer', borderColor: 'rgba(139,92,246,0.25)' }}>
          <div className="dash-tile-top">
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🎮</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 20, padding: '2px 8px', letterSpacing: 0.5 }}>
              Nouveau
            </span>
          </div>
          <div className="dash-tile-label" style={{ marginTop: 12 }}>Mini Jeux</div>
          <div className="dash-tile-sub">Accueil moi si tu peux</div>
          <div style={{ fontSize: 11, color: '#8b5cf6', marginTop: 8, fontWeight: 600 }}>Lancer le jeu →</div>
        </div>

        <div className="dash-tile" onClick={() => onLaunchModule('quiz-final')} style={{ cursor: 'pointer', borderColor: 'rgba(201,162,39,0.35)' }}>
          <div className="dash-tile-top">
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🏆</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#c9a227', background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)', borderRadius: 20, padding: '2px 8px', letterSpacing: 0.5 }}>
              26 questions
            </span>
          </div>
          <div className="dash-tile-label" style={{ marginTop: 12 }}>Quiz Final</div>
          <div className="dash-tile-sub">Toute la formation en un quiz</div>
          <div style={{ fontSize: 11, color: '#c9a227', marginTop: 8, fontWeight: 600 }}>Lancer le quiz →</div>
        </div>
      </div>

      {endConfirmOpen && (
        <ConfirmModal
          title="Terminer la salle ?"
          message="Les participants ne pourront plus rejoindre cette salle. Cette action est définitive."
          confirmLabel="Oui, terminer"
          onConfirm={handleConfirmEndRoom}
          onCancel={() => !endingRoom && setEndConfirmOpen(false)}
          danger
          loading={endingRoom}
        />
      )}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function OnboardingViewBelgique({ pName, onBack, onLaunchFormation, onLaunchModule, onEndRoom, initialStep = 'list', initialJournee = null }) {
  const [step, setStep] = useState(initialStep) // list | modules

  if (step === 'list') return <CollabListBelgique onNext={() => setStep('modules')} onBack={onBack} />
  if (step === 'modules') return <SessionModulesBelgique pName={pName} onBack={() => setStep('list')} onLaunchFormation={onLaunchFormation} onLaunchModule={onLaunchModule} onEndRoom={onEndRoom} initialJournee={initialJournee} />
  return null
}
