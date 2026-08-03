'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { TRAME_ACCUEIL_POINTS } from '@/lib/modulesData'

const STYLES = `
  @keyframes trameSlideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`

function TramePoint({ pt, visible }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 20,
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateX(0)' : 'translateX(-20px)',
      transition: 'all 0.5s ease',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, flexShrink: 0,
        background: `${pt.color}18`,
        border: `2px solid ${pt.color}55`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, fontWeight: 900, color: pt.color,
      }}>{pt.num}</div>
      <div style={{
        flex: 1,
        background: `${pt.color}08`,
        border: `1px solid ${pt.color}22`,
        borderLeft: `3px solid ${pt.color}`,
        borderRadius: 14,
        padding: '14px 20px',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{pt.text}</div>
      </div>
    </div>
  )
}

export default function ModuleTrameAccueil({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [step, setStep] = useState(-1) // -1 = aucun point affiché

  useEffect(() => {
    if (started) {
      sbUpdate('sessions', { active_module: 'trame-accueil', module_page: 0 }, 'code=eq.' + getActiveSessionCode())
      setSharedState({ trame_step: null }).catch(() => {})
    }
  }, [started])

  const handleNext = async () => {
    const next = step + 1
    if (next >= TRAME_ACCUEIL_POINTS.length) return
    setStep(next)
    await setSharedState({ trame_step: next })
  }

  const handlePrev = async () => {
    const prev = step - 1
    setStep(prev)
    await setSharedState({ trame_step: prev < 0 ? null : prev })
  }

  const handleTerminate = async () => {
    try {
      await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode())
      await setSharedState({ trame_step: null }).catch(() => {})
    } catch { /* best-effort */ }
    onBack()
  }

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 500, padding: '0 24px' }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
          <div style={{ background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.3)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Formation · Journée 2</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10, textAlign: 'center' }}>Trame d'accueil</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.7, textAlign: 'center' }}>
            Présentez la trame d'accueil LPT point par point.<br />
            Le formateur pilote l'affichage sur le diffuseur.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            {TRAME_ACCUEIL_POINTS.map(pt => (
              <span key={pt.num} style={{ padding: '3px 12px', background: `${pt.color}15`, border: `1px solid ${pt.color}40`, color: pt.color, borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                {pt.emoji} Point {pt.num}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Retour</button>
            <button onClick={() => setStarted(true)} style={{ background: 'linear-gradient(135deg, #00abe9, #0090c5)', border: 'none', color: '#fff', padding: '12px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(0,171,233,0.35)' }}>▶ Lancer le module</button>
          </div>
        </div>
      </div>
    )
  }

  const isFirst = step <= -1
  const isLast = step >= TRAME_ACCUEIL_POINTS.length - 1

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · Trame d'accueil</span>
          </div>
          <button onClick={handleTerminate}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', letterSpacing: .3 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>

        {/* Contenu : même layout que la TV */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
          {/* Gauche : titre */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 48px', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>Formation Journée 2</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
              La trame d'accueil<br />
              <span style={{ color: '#00abe9' }}>Lunettes Pour Tous</span>
            </h1>
            <div style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {step < 0 ? 'Cliquez sur Suivant pour commencer' : `${step + 1} / ${TRAME_ACCUEIL_POINTS.length} points affichés`}
            </div>

            {/* Indicateur de progression */}
            <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
              {TRAME_ACCUEIL_POINTS.map((pt, i) => (
                <div key={i} style={{ height: 4, borderRadius: 2, flex: 1, background: i <= step ? pt.color : 'rgba(255,255,255,0.12)', transition: 'background 0.4s ease' }} />
              ))}
            </div>
          </div>

          {/* Droite : points révélés */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 48px', gap: 16 }}>
            {TRAME_ACCUEIL_POINTS.map((pt, i) => (
              <TramePoint key={pt.num} pt={pt} visible={i <= step} />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 48px 28px', flexShrink: 0 }}>
          <button onClick={handlePrev} disabled={isFirst} style={{
            background: isFirst ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
            padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>← Précédent</button>

          {isLast ? (
            <button onClick={handleTerminate} style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)', color: '#ff6b6b', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              Terminer →
            </button>
          ) : (
            <button onClick={handleNext} style={{ background: 'linear-gradient(135deg, #00abe9, #0090c5)', border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(0,171,233,0.35)' }}>
              Suivant →
            </button>
          )}
        </div>
      </div>
    </>
  )
}
