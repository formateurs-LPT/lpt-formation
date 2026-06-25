'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, SESSION_CODE } from '@/lib/supabase'

// ─── Données par matériau ─────────────────────────────────────

const ACETATE_FRAMES = [
  { src: '/assets/montures/acetate/SLPT038-EFO-002.avif', ref: 'SLPT038-EFO' },
  { src: '/assets/montures/acetate/SLPT067-EFO-002.avif', ref: 'SLPT067-EFO' },
  { src: '/assets/montures/acetate/SLPT075-EFOBPL-001.avif', ref: 'SLPT075-EFOBPL' },
]
const ACETATE_INFOS = [
  { icon: '🌿', label: 'Naturel', desc: 'Pulpe de bois ou fibre de coton' },
  { icon: '✨', label: 'Premium', desc: 'Large choix de coloris & motifs' },
  { icon: '💎', label: 'Modèle unique', desc: 'Chaque paire diffère selon sa plaque' },
  { icon: '🌡️', label: 'Ajustable à chaud', desc: 'Hypoallergénique — aucun risque allergie' },
]
const ACETATE_NOTES = [
  { icon: '🌲', title: "L'origine", text: "Plastique noble — pulpe de bois ou fibre de coton, pas du pétrole. Argument premium face au client." },
  { icon: '🔲', title: 'La plaque', text: "Découpée dans la masse. Montrer une plaque si dispo en magasin. Chaque paire est légèrement unique." },
  { icon: '🔥', title: 'Ajustable à chaud', text: "On chauffe doucement (chaleur sèche), puis on plie. Le pont est en une seule pièce : non ajustable en largeur." },
  { icon: '⚖️', title: 'À mentionner si besoin', text: "Plus lourd que métal & injecté · Pont non ajustable en largeur." },
]

const METAL_FRAMES = [
  { src: '/assets/montures/metal/LPT502L-KM-002.avif', ref: 'LPT502L-KM' },
  { src: '/assets/montures/metal/LPT523-GUN-002.avif', ref: 'LPT523-GUN' },
  { src: '/assets/montures/metal/SLPT068-OOM-002.avif', ref: 'SLPT068-OOM' },
]
const METAL_INFOS = [
  { icon: '🪶', label: 'Léger & fin', desc: 'Discret sur le visage' },
  { icon: '🛡️', label: 'Résistant', desc: 'Alliage métallique et revêtement anti-allergique' },
  { icon: '🔧', label: 'Ajustable facilement', desc: 'Plaquettes et branches réglables' },
]
const METAL_NOTES = [
  { icon: '⚗️', title: "L'alliage", text: "Pas de l'acier pur — un alliage travaillé (souvent nickel, titane ou inox). Plus fin que l'acétate, d'où la légèreté." },
  { icon: '🔧', title: 'Ajustable facilement', text: "Les plaquettes et branches se règlent à froid. C'est l'atout N°1 pour l'adaptation au visage — argument fort en vente." },
  { icon: '⚠️', title: 'Allergie nickel', text: "À mentionner si le client est sensible. On a des modèles sans nickel (titane). Revêtement anti-allergique sur la plupart." },
  { icon: '💧', title: 'Oxydation', text: "Peut apparaître avec transpiration acide. Recommander l'entretien régulier à l'eau claire. Moins adapté aux grosses corrections (cerclage fin)." },
]

const INJECTE_FRAMES = [
  { src: '/assets/montures/injecte/WF01-BM-002.avif',  ref: 'WF01-BM' },
  { src: '/assets/montures/injecte/WF02-GMV-002.avif', ref: 'WF02-GMV' },
  { src: '/assets/montures/injecte/WF04-BU-002.avif',  ref: 'WF04-BU' },
]
const INJECTE_INFOS = [
  { icon: '🏭', label: 'Moulé à chaud', desc: 'Injecté en série dans un moule industriel' },
  { icon: '🪶', label: 'Léger & résistant', desc: 'Très bonne durabilité au quotidien' },
  { icon: '💚', label: 'Accessible', desc: 'Meilleur rapport qualité / prix de la gamme' },
]
const INJECTE_NOTES = [
  { icon: '🏭', title: 'Le procédé', text: "Injecté dans un moule = production en série. C'est ce qui le rend accessible. Moins noble que l'acétate mais très pratique." },
  { icon: '🎨', title: 'Moins de motifs', text: "Pas découpé dans une plaque — couleur uniforme, pas de veinage ni motif dans la masse. Moins de personnalisation." },
  { icon: '❄️', title: 'Ajustable à froid', text: "Les branches se règlent mais avec moins de liberté que le métal. Pas de plaquettes réglables sur la plupart des modèles." },
  { icon: '🎯', title: 'Cible client', text: "Budget serré, enfants, personnes qui changent souvent ou cassent régulièrement. Argument : rapport qualité/prix imbattable." },
]

// ─── Config pages ──────────────────────────────────────────────
const PAGES_META = [
  { type: 'acetate', title: 'Acétate',          subtitle: 'de cellulose',       color: '#00abe9', frames: ACETATE_FRAMES, infos: ACETATE_INFOS, notes: ACETATE_NOTES },
  { type: 'metal',   title: 'Métal',             subtitle: 'alliage métallique', color: '#94a3b8', frames: METAL_FRAMES,   infos: METAL_INFOS,   notes: METAL_NOTES },
  { type: 'injecte', title: 'Plastique injecté', subtitle: 'moulé industriel',   color: '#4ade80', frames: INJECTE_FRAMES, infos: INJECTE_INFOS, notes: INJECTE_NOTES },
]
const TOTAL_PAGES = PAGES_META.length

// ─── Composant page générique (formateur) ────────────────────
function MonturePage({ meta, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total }) {
  const [step, setStep] = useState(0)
  const [notesOpen, setNotesOpen] = useState(true)
  const { title, subtitle, color, frames, infos, notes } = meta

  useEffect(() => {
    setStep(0)
    const timers = [300, 700, 1100, 1700].map((t, i) => setTimeout(() => setStep(i + 1), t))
    return () => timers.forEach(clearTimeout)
  }, [pageIndex])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Matériaux · {pageIndex + 1}/{total}</span>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', letterSpacing: .3 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >✕ Quitter</button>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '3fr 2fr', overflow: 'hidden' }}>

        {/* Gauche : montures */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          {frames.map((f, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              opacity: step > i ? 1 : 0,
              transform: step > i ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
              transition: 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={f.src} alt={f.ref} style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: 140 }} />
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 0.5 }}>{f.ref}</span>
            </div>
          ))}
        </div>

        {/* Droite : titre + infos + notes */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

          {/* Titre */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
              Matériaux · Journée 1
            </div>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 2 }}>{title}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{subtitle}</div>
          </div>

          {/* Infos clés */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
            {infos.map((info, i) => (
              <div key={i} style={{
                opacity: step > 3 ? 1 : 0,
                transform: step > 3 ? 'translateX(0)' : 'translateX(16px)',
                transition: `all 0.45s ease ${i * 0.1}s`,
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${color}70`, borderRadius: 10, padding: '9px 14px',
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{info.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 1 }}>{info.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{info.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Notes formateur */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
            <button onClick={() => setNotesOpen(o => !o)} style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: '#f59e0b', fontSize: 11, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: notesOpen ? 12 : 0, padding: 0,
            }}>
              <span>📝</span>
              <span>Notes formateur — à dire à l'oral</span>
              <span style={{ marginLeft: 'auto', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{notesOpen ? '▾' : '▸'}</span>
            </button>

            {notesOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map((note, i) => (
                  <div key={i} style={{
                    background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                    borderLeft: '3px solid rgba(245,158,11,0.5)', borderRadius: 10, padding: '10px 14px',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                      {note.icon} {note.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{note.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 28px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onPrev} disabled={isFirst} style={{
          background: isFirst ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
          padding: '11px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600,
          cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit',
        }}>← Précédent</button>

        {isLast ? (
          <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)', color: '#ff6b6b', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Terminer →
          </button>
        ) : (
          <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 5px 20px ${color}40` }}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Lobby ────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  const mats = [
    { label: 'Acétate', color: '#00abe9', done: true },
    { label: 'Métal',   color: '#94a3b8', done: true },
    { label: 'Injecté', color: '#4ade80', done: true },
  ]
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <button onClick={onBack} style={{
        position: 'absolute', top: 24, left: 24,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10,
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>← Retour</button>

      <div style={{ textAlign: 'center', maxWidth: 560, padding: '0 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>👓</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Module · Journée 1 · Fin de journée
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>
          Connaissances Montures
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
          Découverte des matériaux et des montures LPT
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 36 }}>
          {mats.map((m, i) => (
            <span key={i} style={{
              padding: '4px 16px', borderRadius: 20,
              background: m.done ? `${m.color}18` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${m.done ? m.color + '50' : 'rgba(255,255,255,0.1)'}`,
              color: m.done ? m.color : 'rgba(255,255,255,0.25)',
              fontSize: 12, fontWeight: 700,
            }}>{m.label}</span>
          ))}
        </div>
        <button onClick={onStart} style={{
          background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none', color: '#fff',
          padding: '16px 48px', borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,171,233,0.45)', fontFamily: 'inherit',
        }}>▶ Démarrer</button>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────
export default function ModuleMontures({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [page, setPage] = useState(0)

  const handleStart = async () => {
    await sbUpdate('sessions', { active_module: 'montures', module_page: 0 }, 'code=eq.' + SESSION_CODE)
    setStarted(true)
  }

  const handleNext = async () => {
    if (page >= TOTAL_PAGES - 1) return
    const next = page + 1
    await sbUpdate('sessions', { active_module: 'montures', module_page: next }, 'code=eq.' + SESSION_CODE)
    setPage(next)
  }

  const handlePrev = async () => {
    if (page <= 0) return
    const prev = page - 1
    await sbUpdate('sessions', { active_module: 'montures', module_page: prev }, 'code=eq.' + SESSION_CODE)
    setPage(prev)
  }

  const handleBack = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + SESSION_CODE)
    onBack()
  }

  if (!started) return <Lobby onStart={handleStart} onBack={handleBack} />

  return (
    <MonturePage
      meta={PAGES_META[page]}
      onBack={handleBack}
      onPrev={handlePrev}
      onNext={handleNext}
      isFirst={page === 0}
      isLast={page >= TOTAL_PAGES - 1}
      pageIndex={page}
      total={TOTAL_PAGES}
    />
  )
}
