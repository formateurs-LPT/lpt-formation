'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, fetchOpenAnswers, setSharedState } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { NextPagePreview } from '@/lib/trainerPreview'
import { MONTURES_QUIZ } from '@/lib/modulesData'
import { useIsMobile } from '@/lib/useIsMobile'

const BUBBLE_COLORS = ['#00abe9', '#4ade80', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']

// ─── Données par matériau ─────────────────────────────────────

const ACETATE_FRAMES = [
  { src: '/assets/montures/acetate/SLPT038-EFO-002.avif', ref: 'SLPT038-EFO' },
  { src: '/assets/montures/acetate/SLPT067-EFO-002.avif', ref: 'SLPT067-EFO' },
  { src: '/assets/montures/acetate/SLPT075-EFOBPL-001.avif', ref: 'SLPT075-EFOBPL' },
]
const ACETATE_INFOS = [
  { icon: '🌿', label: 'Naturel', desc: 'Fibre de bois ou fibre de coton' },
  { icon: '✨', label: 'Premium', desc: 'Large choix de coloris & motifs' },
  { icon: '💎', label: 'Modèle unique', desc: 'Chaque paire diffère selon sa plaque' },
  { icon: '🌡️', label: 'Ajustable à chaud', desc: 'Hypoallergénique — aucun risque allergie' },
  { icon: '💶', label: 'Prix', desc: 'De 30 € à 90 €' },
]
const ACETATE_NOTES = [
  { icon: '🌲', title: "L'origine", text: "Plastique noble — fibre de bois ou fibre de coton, pas du pétrole. Argument premium face au client." },
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
  { icon: '💶', label: 'Prix', desc: 'De 30 € à 90 €' },
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
  { icon: '💶', label: 'Prix', desc: '5 € ou 15 €' },
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
function MonturePage({ meta, onBack, onPrev, onNext, isFirst, isLast, pageIndex, total, nextPage, onTerminate, quizLaunched, onLaunchQuiz, priceRevealed, onRevealPrice }) {
  const isMobile = useIsMobile()
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
      <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', overflow: 'hidden' }}>

        {/* Gauche/haut : montures */}
        <div style={{ flex: isMobile ? '0 0 auto' : '3', padding: isMobile ? '12px 14px' : '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 10 : 16, borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.07)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
          {frames.map((f, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              opacity: step > i ? 1 : 0,
              transform: step > i ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
              transition: 'all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '16px 12px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={f.src} alt={f.ref} style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: isMobile ? 80 : 140 }} />
              </div>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 0.5 }}>{f.ref}</span>
            </div>
          ))}
        </div>

        {/* Droite/bas : titre + infos + notes */}
        <div style={{ flex: isMobile ? '1 1 auto' : '2', padding: isMobile ? '14px 16px' : '20px 24px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

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
      <div style={{ padding: '0 28px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 12 }}>
        <NextPagePreview nextPage={nextPage} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={onPrev} disabled={isFirst} style={{
            background: isFirst ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
            padding: '11px 22px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit',
          }}>← Précédent</button>

          <button onClick={onRevealPrice} style={{
            background: priceRevealed
              ? 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.15))'
              : 'rgba(255,255,255,0.06)',
            border: priceRevealed ? '1px solid rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.15)',
            color: priceRevealed ? '#f59e0b' : 'rgba(255,255,255,0.5)',
            padding: '9px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .25s',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span>💶</span>
            <span>{priceRevealed ? 'Prix affiché sur TV' : 'Révéler le prix'}</span>
          </button>

          {isLast ? (
            quizLaunched ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>Quiz envoyé</span>
                <button onClick={onTerminate} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(34,197,94,0.4)' }}>
                  Terminer
                </button>
              </div>
            ) : (
              <button onClick={onLaunchQuiz} style={{ background: 'linear-gradient(135deg, #7c3aed, #9f67fa)', border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(124,58,237,0.5)' }}>
                Lancer le quiz →
              </button>
            )
          ) : (
            <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 5px 20px ${color}40` }}>
              Suivant →
            </button>
          )}
        </div>
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

// ─── Quiz Controller ──────────────────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [openAnswers, setOpenAnswers] = useState([])
  const [validating, setValidating] = useState({})
  const [validated, setValidated] = useState({})

  const q = MONTURES_QUIZ[quizQ]
  const isLast = quizQ >= MONTURES_QUIZ.length - 1
  const pageId = `montures:${quizQ}`

  useEffect(() => {
    setOpenAnswers([])
    setValidating({})
    setValidated({})
    const poll = async () => {
      const rows = await fetchOpenAnswers(getActiveSessionCode(), pageId)
      setOpenAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [quizQ, pageId])

  const handleValidate = async (row, isCorrect) => {
    if (validating[row.participant_name]) return
    setValidating(v => ({ ...v, [row.participant_name]: true }))
    await saveModuleQuizAnswer({
      moduleId: 'montures',
      questionIdx: quizQ,
      collaborateur: row.participant_name,
      answerIdx: 0,
      isCorrect,
    })
    setValidated(v => ({ ...v, [row.participant_name]: isCorrect ? 'correct' : 'wrong' }))
    setValidating(v => ({ ...v, [row.participant_name]: false }))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Montures — Vue formateur</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.2)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {MONTURES_QUIZ.length}
        </div>
      </div>

      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, maxWidth: 800, margin: '0 auto 14px' }}>
        {q.question}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)', borderRadius: 12, padding: '8px 22px', fontSize: 12, color: 'rgba(0,171,233,0.7)', fontStyle: 'italic' }}>
          Réponse attendue : {q.hint}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, margin: '0 auto', maxHeight: '45vh', overflowY: 'auto', paddingRight: 4 }}>
        {openAnswers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
            En attente des réponses des participants…
          </div>
        ) : openAnswers.map((row, i) => {
          const status = validated[row.participant_name]
          const isValidating = validating[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: status === 'correct' ? 'rgba(34,197,94,0.08)' : status === 'wrong' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === 'correct' ? 'rgba(34,197,94,0.3)' : status === 'wrong' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}22`, border: `2px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}>
                {row.participant_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length], marginBottom: 3 }}>{row.participant_name}</div>
                <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.4 }}>{row.answer}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {status ? (
                  <div style={{ fontSize: 22, fontWeight: 800, color: status === 'correct' ? '#4ade80' : '#f87171' }}>{status === 'correct' ? '✓' : '✗'}</div>
                ) : (
                  <>
                    <button onClick={() => handleValidate(row, true)} disabled={!!isValidating} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'rgba(34,197,94,0.18)', color: '#4ade80', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.5 : 1, fontFamily: 'inherit' }}>✓</button>
                    <button onClick={() => handleValidate(row, false)} disabled={!!isValidating} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.18)', color: '#f87171', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.5 : 1, fontFamily: 'inherit' }}>✗</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {openAnswers.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
          {openAnswers.length} réponse{openAnswers.length > 1 ? 's' : ''} reçue{openAnswers.length > 1 ? 's' : ''}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
        {isLast ? (
          <button onClick={onEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>✓ Voir les résultats</button>
        ) : (
          <button onClick={onNext} style={{ background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none', color: '#fff', padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(0,171,233,0.45)' }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ─── Group Results View ───────────────────────────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnswers = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.montures`
      )
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
  }, [])

  const participantNames = [...new Set((answers || []).map(r => r.collaborateur))]
  const participantCount = participantNames.length

  const questionStats = MONTURES_QUIZ.map((q, idx) => {
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz · Montures</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{participantCount}</span>
          participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d'erreur décroissant</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, alignSelf: 'center', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15, padding: 40 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const priority = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{ background: priority.bg, border: `1px solid ${priority.border}`, borderRadius: 18, padding: '18px 22px' }}>
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
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>d'erreurs</div>
                </div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${stat.pctWrong}%`, background: priority.color, transition: 'width .8s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button onClick={onTerminate} style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(220,38,38,0.4)' }}>✓ Terminer le module</button>
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────
export default function ModuleMontures({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const [page, setPage] = useState(0)
  const [quizLaunched, setQuizLaunched] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [showGroupResults, setShowGroupResults] = useState(false)
  const [priceRevealed, setPriceRevealed] = useState(false)

  const handleStart = async () => {
    await sbUpdate('sessions', { active_module: 'montures', module_page: 0 }, 'code=eq.' + getActiveSessionCode())
    setStarted(true)
  }

  const handleRevealPrice = async () => {
    const next = !priceRevealed
    setPriceRevealed(next)
    await setSharedState({ montures_prix_revealed: next })
  }

  const handleNext = async () => {
    if (page >= TOTAL_PAGES - 1) return
    const next = page + 1
    await sbUpdate('sessions', { active_module: 'montures', module_page: next }, 'code=eq.' + getActiveSessionCode())
    setPriceRevealed(false)
    await setSharedState({ montures_prix_revealed: false })
    setPage(next)
  }

  const handlePrev = async () => {
    if (page <= 0) return
    const prev = page - 1
    await sbUpdate('sessions', { active_module: 'montures', module_page: prev }, 'code=eq.' + getActiveSessionCode())
    setPriceRevealed(false)
    await setSharedState({ montures_prix_revealed: false })
    setPage(prev)
  }

  const handleBack = async () => {
    await setSharedState({ montures_prix_revealed: false })
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode())
    onBack()
  }

  const handleLaunchQuiz = async () => {
    await sbUpdate('sessions', { active_module: 'montures', module_page: 100 }, 'code=eq.' + getActiveSessionCode())
    setQuizQ(0)
    setQuizLaunched(true)
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await sbUpdate('sessions', { active_module: 'montures', module_page: 100 + next }, 'code=eq.' + getActiveSessionCode())
    setQuizQ(next)
  }

  const handleEndQuiz = async () => {
    await sbUpdate('sessions', { active_module: 'montures', module_page: 200 }, 'code=eq.' + getActiveSessionCode())
    setShowGroupResults(true)
  }

  const handleTerminateModule = async () => {
    await setSharedState({ montures_prix_revealed: false })
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode())
    ;(onTerminate ?? onBack)()
  }

  if (!started) return <Lobby onStart={handleStart} onBack={handleBack} />

  if (showGroupResults) return <GroupResultsView onTerminate={handleTerminateModule} />

  if (quizLaunched) {
    return (
      <QuizController
        quizQ={quizQ}
        onNext={handleNextQuestion}
        onEnd={handleEndQuiz}
        onBack={handleEndQuiz}
      />
    )
  }

  const nextMeta = page < TOTAL_PAGES - 1 ? PAGES_META[page + 1] : null
  const nextPage = nextMeta ? { type: `montures-${nextMeta.type}`, color: nextMeta.color, label: nextMeta.title } : null

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
      nextPage={nextPage}
      onTerminate={handleTerminateModule}
      quizLaunched={quizLaunched}
      onLaunchQuiz={handleLaunchQuiz}
      priceRevealed={priceRevealed}
      onRevealPrice={handleRevealPrice}
    />
  )
}
