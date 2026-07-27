'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { useIsMobile } from '@/lib/useIsMobile'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { OFFRES_QUIZ } from '@/lib/modulesData'
import { NextPagePreview } from '@/lib/trainerPreview'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

const STYLES = `
  @keyframes verreFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-12px) scale(1.03); }
  }
  @keyframes haloPulse {
    0%, 100% { opacity: 0.45; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.12); }
  }
`

// ── Verre animé (formateur) ──────────────────────────────────────
function VerreAnime({ color, size = 260 }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <Image
          src="/assets/verre-unifocal-2.png"
          alt="Verre unifocal"
          width={size} height={size}
          style={{ objectFit: 'contain', filter: `drop-shadow(0 0 36px ${color}60) drop-shadow(0 10px 28px rgba(0,0,0,0.28))` }}
          priority
        />
      </div>
    </div>
  )
}

// ── Anneau décoratif ─────────────────────────────────────────────
function Ring({ color, size = 80 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: `${size * 0.14}px solid ${color}`,
      background: 'transparent',
      boxShadow: `0 0 24px ${color}40`,
    }} />
  )
}

const ITEMS_CLASSIQUE = [
  { text: '1 paire achetée', sub: null },
  { text: 'Deuxième paire à -20%', sub: null },
  { text: '10€ en 10 minutes', sub: 'Uniquement dans ce parcours' },
]

const ITEMS_PACK_PLAN = [
  { text: '2 paires de lunettes', sub: null },
  { text: 'Monture au choix', sub: null },
  { text: 'Traitement au choix', sub: null },
  { text: 'Solaire inclus', sub: 'Sauf polarisé' },
]

// ── Page Classique (formateur) ───────────────────────────────────
function CoursClassique({ onNext, onPrev, onBack }) {
  const COLOR = '#00abe9'
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)

  useEffect(() => {
    setSharedState({ offres_classique_step: 0 }).catch(() => {})
    return () => { setSharedState({ offres_classique_step: 0 }).catch(() => {}) }
  }, [])

  const reveal = async () => {
    if (step >= ITEMS_CLASSIQUE.length) return
    const next = step + 1
    setStep(next)
    await setSharedState({ offres_classique_step: next })
  }

  const hide = async () => {
    if (step <= 0) return
    const prev = step - 1
    setStep(prev)
    await setSharedState({ offres_classique_step: prev })
  }

  const allRevealed = step >= ITEMS_CLASSIQUE.length

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001e40 100%)', display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 14px 14px' : '24px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Les offres · 4 / 4</span>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', letterSpacing: .3 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >✕ Quitter</button>
      </div>

      {/* Contenu — même grille 2 colonnes que 1=1 */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 40, alignItems: 'center' }}>
        {/* Gauche */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Ring color={COLOR} size={72} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Les parcours LPT</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>Le parcours</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: COLOR }}>Classique</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `3px solid ${COLOR}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Tarifs</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>Montures</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>5€ à 90€</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>2ème paire</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>-20%</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>Fabrication</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>⚡ 10 min</span>
            </div>
          </div>
        </div>

        {/* Droite : points révélés un par un */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ITEMS_CLASSIQUE.map((item, i) => (
            <div key={i} style={{
              opacity: i < step ? 1 : 0.15,
              transform: i < step ? 'translateX(0)' : 'translateX(12px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderLeft: `3px solid ${i < step ? COLOR : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14, padding: '14px 20px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.text}</div>
              {item.sub && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{item.sub}</div>}
            </div>
          ))}
          {/* Indicateur de progression */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {ITEMS_CLASSIQUE.map((_, i) => (
              <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i < step ? COLOR : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flexShrink: 0 }}>
        <NextPagePreview nextPage={{ type: 'offres-pack-plan', label: 'Pack Plan 95€', color: '#00abe9' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
          <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← 1=1</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={hide} disabled={step === 0} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: step === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', padding: '13px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}>← Masquer</button>
            {allRevealed ? (
              <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${COLOR}, #0090c5)`, border: 'none', color: '#fff', padding: '13px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${COLOR}45` }}>Pack Plan 95€ →</button>
            ) : (
              <button onClick={reveal} style={{ background: `linear-gradient(135deg, ${COLOR}, #0090c5)`, border: 'none', color: '#fff', padding: '13px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${COLOR}45` }}>Révéler →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page Pack Plan 95€ (formateur) ──────────────────────────────
function CoursPackPlan({ onNext, onPrev, onBack }) {
  const COLOR = '#00abe9'
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)

  useEffect(() => {
    setSharedState({ offres_pack_plan_step: 0 }).catch(() => {})
    return () => { setSharedState({ offres_pack_plan_step: 0 }).catch(() => {}) }
  }, [])

  const reveal = async () => {
    if (step >= ITEMS_PACK_PLAN.length) return
    const next = step + 1
    setStep(next)
    await setSharedState({ offres_pack_plan_step: next })
  }

  const hide = async () => {
    if (step <= 0) return
    const prev = step - 1
    setStep(prev)
    await setSharedState({ offres_pack_plan_step: prev })
  }

  const allRevealed = step >= ITEMS_PACK_PLAN.length

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001e40 100%)', display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 14px 14px' : '24px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Les offres · Pack Plan</span>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', letterSpacing: .3 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >✕ Quitter</button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 40, alignItems: 'center' }}>
        {/* Gauche */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Ring color={COLOR} size={72} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Les parcours LPT</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>Pack</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: COLOR }}>Plan 95€</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `3px solid ${COLOR}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Tarif</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>2 paires</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>95€</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>Sans correction</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>✓</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>Solaire</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#4ade80' }}>✓ sauf polarisé</span>
            </div>
          </div>
        </div>

        {/* Droite : points révélés */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ITEMS_PACK_PLAN.map((item, i) => (
            <div key={i} style={{
              opacity: i < step ? 1 : 0.15,
              transform: i < step ? 'translateX(0)' : 'translateX(12px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderLeft: `3px solid ${i < step ? COLOR : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14, padding: '14px 20px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.text}</div>
              {item.sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{item.sub}</div>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {ITEMS_PACK_PLAN.map((_, i) => (
              <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i < step ? COLOR : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <NextPagePreview nextPage={{ type: 'zone-interactif', label: 'Quiz offres', color: '#7c3aed' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
          <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Classique</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={hide} disabled={step === 0} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: step === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', padding: '13px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}>← Masquer</button>
            {allRevealed ? (
              <button onClick={onNext} style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67fa)', border: 'none', color: '#fff', padding: '13px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(124,58,237,0.45)' }}>Lancer le quiz →</button>
            ) : (
              <button onClick={reveal} style={{ background: `linear-gradient(135deg, ${COLOR}, #0090c5)`, border: 'none', color: '#fff', padding: '13px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${COLOR}45` }}>Révéler →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const ITEMS_11 = [
  { text: '1 paire achetée', sub: null },
  { text: 'Deuxième paire offerte', sub: 'de même qualité que la première' },
  { text: 'Éligible sur tout le magasin', sub: 'Monture et verres au choix' },
  { text: 'Même en solaire', sub: null },
]

// ── Page 1=1 (formateur) ─────────────────────────────────────────
// ── Page Unifocal 1=1 (formateur) ────────────────────────────────
const ITEMS_UNIFOCAL_11 = [
  { text: "Sur l'intégralité du magasin", sub: 'Toutes nos montures et verres éligibles' },
  { text: '400 modèles de montures', sub: 'Au choix, sans contrainte' },
  { text: 'Tous les traitements inclus', sub: 'Anti-rayure · Anti-reflets · Anti-salissure · Hydrophobe · Anti-lumière bleue' },
  { text: '⚡ Fabrication en 10 minutes', sub: null },
]

function CoursUnifocal11({ onPrev, onNext, onBack }) {
  const COLOR = '#c9a227'
  const isMobile = useIsMobile()
  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 14px 14px' : '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Les offres · 2 / 4</span>
          </div>
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 40, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <VerreAnime color={COLOR} size={360} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Parcours 1=1 · Verre unifocal</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 24 }}>
              Le verre unifocal<br /><span style={{ color: COLOR }}>dans l'offre 1=1</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ITEMS_UNIFOCAL_11.map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, borderLeft: `3px solid ${COLOR}`, borderRadius: 14, padding: '14px 20px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.text}</div>
                  {item.sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{item.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <NextPagePreview nextPage={{ type: 'offres-progressif-11', label: 'Verre progressif 1=1', color: '#c9a227' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← 1=1</button>
            <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${COLOR}, #b8871a)`, border: 'none', color: '#fff', padding: '13px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${COLOR}45` }}>Verre progressif →</button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Page Progressif 1=1 (formateur) ──────────────────────────────
const ITEMS_PROGRESSIF_11 = [
  { text: "Sur l'intégralité du magasin", sub: 'Toutes nos montures et verres éligibles' },
  { text: '400 modèles de montures', sub: 'Au choix, sans contrainte' },
  { text: 'Tous les traitements inclus', sub: 'Anti-rayure · Anti-reflets · Anti-salissure · Hydrophobe · Anti-lumière bleue' },
  { text: '📅 Fabrication en 9 jours', sub: null },
  { text: "Zones d'aberrations réduites", sub: null },
  { text: 'Vision extra large à 180°', sub: null },
  { text: 'Offre une vision naturelle au quotidien', sub: null },
  { text: 'Adaptation immédiate', sub: null },
  { text: 'Garantie Adaptation — satisfait ou échangé 100 jours', sub: null },
]

function VerreProgAnime({ color, size = 360 }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ animation: 'verreFloat 4.5s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/verre-prog.png"
          alt="Verre progressif"
          style={{ width: size, height: size, objectFit: 'contain', filter: `drop-shadow(0 0 36px ${color}60) drop-shadow(0 10px 28px rgba(0,0,0,0.28))` }}
        />
      </div>
    </div>
  )
}

function CoursProgressif11({ onPrev, onNext, onBack }) {
  const COLOR = '#c9a227'
  const isMobile = useIsMobile()
  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 14px 14px' : '24px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Les offres · 3 / 4</span>
          </div>
          <button onClick={onBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 40, alignItems: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <VerreProgAnime color={COLOR} size={360} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Parcours 1=1 · Verre progressif</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 24 }}>
              Le verre progressif<br /><span style={{ color: COLOR }}>dans l'offre 1=1</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ITEMS_PROGRESSIF_11.map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, borderLeft: `3px solid ${COLOR}`, borderRadius: 14, padding: '14px 20px' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.text}</div>
                  {item.sub && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{item.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ flexShrink: 0 }}>
          <NextPagePreview nextPage={{ type: 'offres-classique', label: 'Parcours Classique', color: '#00abe9' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Unifocal</button>
            <button onClick={onNext} style={{ background: `linear-gradient(135deg, #00abe9, #0090c5)`, border: 'none', color: '#fff', padding: '13px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(0,171,233,0.45)' }}>Parcours Classique →</button>
          </div>
        </div>
      </div>
    </>
  )
}

function Cours11({ onPrev, onNext, onBack }) {
  const COLOR = '#c9a227'
  const isMobile = useIsMobile()
  const [step, setStep] = useState(0)

  const reveal = async () => {
    if (step >= ITEMS_11.length) return
    const next = step + 1
    setStep(next)
    await setSharedState({ offres_11_step: next })
  }

  const hide = async () => {
    if (step <= 0) return
    const prev = step - 1
    setStep(prev)
    await setSharedState({ offres_11_step: prev })
  }

  const allRevealed = step >= ITEMS_11.length

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'flex', flexDirection: 'column', padding: isMobile ? '16px 14px 14px' : '24px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Les offres · 1 / 4</span>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', letterSpacing: .3 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >✕ Quitter</button>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 20 : 40, alignItems: 'center' }}>
        {/* Gauche */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <Ring color={COLOR} size={72} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Les parcours LPT</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>Le parcours</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: COLOR }}>1=1</div>
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `3px solid ${COLOR}`, borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Tarifs</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>Unifocal</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>~157€</span>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)' }}>Progressif</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: COLOR }}>~260€</span>
            </div>
          </div>
        </div>

        {/* Droite : points révélés un par un */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ITEMS_11.map((item, i) => (
            <div key={i} style={{
              opacity: i < step ? 1 : 0.15,
              transform: i < step ? 'translateX(0)' : 'translateX(12px)',
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid rgba(255,255,255,0.1)`,
              borderLeft: `3px solid ${i < step ? COLOR : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 14, padding: '14px 20px',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{item.text}</div>
              {item.sub && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{item.sub}</div>}
            </div>
          ))}
          {/* Indicateur de progression */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            {ITEMS_11.map((_, i) => (
              <div key={i} style={{ height: 3, flex: 1, borderRadius: 2, background: i < step ? COLOR : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flexShrink: 0 }}>
        <NextPagePreview nextPage={{ type: 'offres-unifocal-11', label: 'Verre unifocal 1=1', color: '#c9a227' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
          <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '13px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Précédent</button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={hide} disabled={step === 0} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: step === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', padding: '13px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer', fontFamily: 'inherit' }}>← Masquer</button>
            {allRevealed ? (
              <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${COLOR}, #b8871a)`, border: 'none', color: '#fff', padding: '13px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${COLOR}45` }}>Verre unifocal →</button>
            ) : (
              <button onClick={reveal} style={{ background: `linear-gradient(135deg, ${COLOR}, #b8871a)`, border: 'none', color: '#fff', padding: '13px 36px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${COLOR}45` }}>Révéler →</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Quiz Controller (vue formateur) ──────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers] = useState([])
  const q = OFFRES_QUIZ[quizQ]
  const isLast = quizQ >= OFFRES_QUIZ.length - 1

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.offres&question_idx=eq.${quizQ}`
      )
      setLiveAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  const total = liveAnswers.length
  const counts = q.options.map((_, i) => liveAnswers.filter(r => r.answer_idx === i).length)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Les offres — Vue formateur</span>
        </div>
        <button onClick={onBack} style={{
          background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)',
          color: '#ff6b6b', padding: '7px 16px', borderRadius: 10,
          fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>✕ Terminer</button>
      </div>

      {/* Badge question */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>Question {quizQ + 1} / {OFFRES_QUIZ.length}</div>
      </div>

      {/* Question */}
      <div style={{
        fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center',
        marginBottom: 36, lineHeight: 1.3, maxWidth: 800, alignSelf: 'center',
      }}>{q.question}</div>

      {/* Barres réponses en direct */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        {q.options.map((opt, i) => {
          const count = counts[i]
          const isCorrect = i === q.correct
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={i} style={{
              background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 16, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: OPTION_COLORS[i],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, color: '#fff',
                  }}>{'ABC'[i]}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt}</span>
                  {isCorrect && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 10px', borderRadius: 20 }}>✓ Bonne réponse</span>}
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: isCorrect ? '#4ade80' : '#fff' }}>
                  {count}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 4 }}>vote{count > 1 ? 's' : ''}</span>
                </span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${pct}%`,
                  background: isCorrect ? '#4ade80' : OPTION_COLORS[i],
                  transition: 'width .5s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginRight: 6 }}>{total}</span>
          participant{total !== 1 ? 's' : ''} {total !== 1 ? 'ont' : 'a'} répondu
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {quizQ > 0 && quizQ % 5 === 0 && (
            <button onClick={() => setSharedState({ quiz_podium_skip: Date.now() })} style={{
              background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.5)',
              color: '#fbbf24', padding: '14px 28px', borderRadius: 14,
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>🏆 Passer le podium →</button>
          )}
          {isLast ? (
            <button onClick={onEnd} style={{
              background: 'linear-gradient(135deg, #16a34a, #22c55e)',
              border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14,
              fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(34,197,94,0.4)',
            }}>✓ Terminer le quiz</button>
          ) : (
            <button onClick={onNext} style={{
              background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
              border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14,
              fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(124,58,237,0.45)',
            }}>Question suivante →</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Group Results View (vue formateur après quiz) ─────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const [rateShowing, setRateShowing] = useState(false)

  const toggleRate = async () => {
    const next = !rateShowing
    setRateShowing(next)
    await setSharedState({ quiz_rate_show: next ? Date.now() : false })
  }

  useEffect(() => {
    const fetchAnswers = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.offres`
      )
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
  }, [])

  const participantNames = [...new Set((answers || []).map(r => r.collaborateur))]
  const participantCount = participantNames.length

  const questionStats = OFFRES_QUIZ.map((q, idx) => {
    const qAnswers = answers.filter(r => r.question_idx === idx)
    const wrongCount = qAnswers.filter(r => !r.is_correct).length
    const total = qAnswers.length
    const pctWrong = total > 0 ? Math.round((wrongCount / total) * 100) : 0
    return { idx, question: q.question, pctWrong, total }
  }).sort((a, b) => b.pctWrong - a.pctWrong)

  const getPriority = (pct) => {
    if (pct >= 50) return { icon: '🔴', label: 'À retravailler en priorité', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
    if (pct >= 25) return { icon: '🟡', label: 'À consolider', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
    return { icon: '🟢', label: 'Bien maîtrisé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz · Les offres</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{participantCount}</span>
          participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase',
          marginBottom: 12,
        }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d&apos;erreur décroissant</p>
      </div>

      {/* Question cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, alignSelf: 'center', width: '100%', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15, padding: 40 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const priority = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{
              background: priority.bg,
              border: `1px solid ${priority.border}`,
              borderRadius: 18, padding: '18px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{priority.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: priority.color, textTransform: 'uppercase', letterSpacing: 1 }}>{priority.label}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                    Q{stat.idx + 1} — {stat.question}
                  </div>
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: priority.color, lineHeight: 1, flexShrink: 0 }}>
                  {stat.pctWrong}%
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>d&apos;erreurs</div>
                </div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${stat.pctWrong}%`,
                  background: priority.color,
                  transition: 'width .8s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
        <button onClick={toggleRate} style={{
          background: rateShowing ? 'rgba(0,171,233,0.2)' : 'rgba(0,171,233,0.1)',
          border: `1px solid ${rateShowing ? '#00abe9' : 'rgba(0,171,233,0.4)'}`,
          color: '#00abe9', padding: '14px 28px', borderRadius: 14,
          fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          🎯 {rateShowing ? 'Masquer le taux' : 'Révéler le taux de réussite'}
        </button>
        <button onClick={onTerminate} style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14,
          fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 24px rgba(220,38,38,0.4)',
        }}>✓ Terminer le module</button>
      </div>
    </div>
  )
}

// ── Lobby ─────────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <button onClick={onBack} style={{
        position: 'absolute', top: 24, left: 24,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10,
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>← Retour</button>

      <div style={{ textAlign: 'center', maxWidth: 520, padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={180} height={68} style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Module de formation · Journée 2
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
          Les offres
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
          Suprême · 1=1 · Classique · Pack Plan<br />
          Maîtriser les parcours d&apos;achat et les proposer au bon client
        </p>
        <button onClick={onStart} style={{
          background: 'linear-gradient(135deg, #0089ba, #00abe9)',
          border: 'none', color: '#fff', padding: '16px 48px',
          borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,171,233,0.45)', fontFamily: 'inherit',
        }}>▶ Démarrer le module</button>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function ModuleOffres({ pName, onBack }) {
  // phase: 'lobby' | 'classique' | 'pack-plan' | 'un-pour-un' | 'quiz' | 'results'
  const [phase, setPhase] = useState('lobby')
  const [quizQ, setQuizQ] = useState(0)

  useEffect(() => {
    sbUpdate('sessions', { active_module: 'offres', module_page: -1 }, `code=eq.${getActiveSessionCode()}`)
  }, [])

  const handleBack = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    onBack()
  }

  const goLobby = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: -1 }, `code=eq.${getActiveSessionCode()}`)
    setPhase('lobby')
  }

  const goClassique = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    setPhase('classique')
  }

  const go11 = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 1 }, `code=eq.${getActiveSessionCode()}`)
    await setSharedState({ offres_11_step: 0 })
    setPhase('un-pour-un')
  }

  const goUnifocal11 = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 2 }, `code=eq.${getActiveSessionCode()}`)
    setPhase('unifocal-11')
  }

  const goProgressif11 = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 3 }, `code=eq.${getActiveSessionCode()}`)
    setPhase('progressif-11')
  }

  const goPackPlan = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 4 }, `code=eq.${getActiveSessionCode()}`)
    setPhase('pack-plan')
  }

  const startQuiz = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 100 }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(0)
    setPhase('quiz')
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await sbUpdate('sessions', { active_module: 'offres', module_page: 100 + next }, `code=eq.${getActiveSessionCode()}`)
    setQuizQ(next)
  }

  const handleEndQuiz = async () => {
    await sbUpdate('sessions', { active_module: 'offres', module_page: 200 }, `code=eq.${getActiveSessionCode()}`)
    setPhase('results')
  }

  const handleTerminateModule = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, `code=eq.${getActiveSessionCode()}`)
    onBack()
  }

  if (phase === 'lobby')         return <Lobby onStart={go11} onBack={handleBack} />
  if (phase === 'un-pour-un')    return <Cours11 onPrev={goLobby} onNext={goUnifocal11} onBack={handleBack} />
  if (phase === 'unifocal-11')   return <CoursUnifocal11 onPrev={go11} onNext={goProgressif11} onBack={handleBack} />
  if (phase === 'progressif-11') return <CoursProgressif11 onPrev={goUnifocal11} onNext={goClassique} onBack={handleBack} />
  if (phase === 'classique')     return <CoursClassique onNext={goPackPlan} onPrev={goProgressif11} onBack={handleBack} />
  if (phase === 'pack-plan')     return <CoursPackPlan onNext={startQuiz} onPrev={goClassique} onBack={handleBack} />
  if (phase === 'results')   return <GroupResultsView onTerminate={handleTerminateModule} />

  return (
    <QuizController
      quizQ={quizQ}
      onNext={handleNextQuestion}
      onEnd={handleEndQuiz}
      onBack={handleEndQuiz}
    />
  )
}
