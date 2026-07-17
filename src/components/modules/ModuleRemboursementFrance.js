'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState, fetchOpenAnswers } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'remboursement-france'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

const BUBBLE_COLORS = ['#00abe9', '#4ade80', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']

// ── Logos ─────────────────────────────────────────────────────────
function AmeliproBadge() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo-amelipro.svg" alt="AMELIPRO" width={48} height={48} style={{ objectFit: 'contain' }} />
    </span>
  )
}

function LptSanteBadge({ size = 36 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={size} height={size} style={{ objectFit: 'contain' }} />
    </span>
  )
}

// ── Popup LPT Santé (mockups fidèles aux screenshots) ────────────
function SupremeAcceptePopup() {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '28px 28px 20px',
      maxWidth: 320, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={72} height={72} style={{ objectFit: 'contain', display: 'block' }} />
        <div style={{ position: 'absolute', top: -8, left: -4, display: 'flex', gap: 2 }}>
          <span style={{ background: '#aaa', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 5px' }}>1.01</span>
          <span style={{ background: '#e6a817', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 5px' }}>91</span>
        </div>
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: '#111', marginBottom: 10, lineHeight: 1.2 }}>
        Remboursements enregistres
      </div>
      <div style={{ fontSize: 15, color: '#444', lineHeight: 1.5, marginBottom: 22 }}>
        Vous pouvez maintenant creer une commande Supreme.
      </div>
      <div style={{
        background: '#2a5080', borderRadius: 12, padding: '14px 0',
        fontSize: 17, fontWeight: 600, color: '#fff', letterSpacing: 0.3,
      }}>OK</div>
    </div>
  )
}

function SupremeRefusePopup() {
  return (
    <div style={{
      background: '#fff', borderRadius: 18, padding: '28px 28px 20px',
      maxWidth: 340, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.35)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 18 }}>
        {/* Warning triangle */}
        <svg width={72} height={72} viewBox="0 0 72 72" style={{ position: 'absolute', top: -20, left: -20 }}>
          <polygon points="36,4 68,64 4,64" fill="#f5c842" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
          <text x="36" y="54" textAnchor="middle" fontSize="30" fontWeight="900" fill="white">!</text>
        </svg>
        <div style={{ marginTop: 10, marginLeft: 10 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={60} height={60} style={{ objectFit: 'contain', display: 'block' }} />
            <div style={{ position: 'absolute', top: -8, left: -4, display: 'flex', gap: 2 }}>
              <span style={{ background: '#aaa', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 5px' }}>1.01</span>
              <span style={{ background: '#e6a817', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 4, padding: '1px 5px' }}>95</span>
            </div>
          </div>
        </div>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 10, lineHeight: 1.2 }}>
        L&apos;envoi de devis OptoAMC a echoue
      </div>
      <div style={{ fontSize: 14, color: '#444', lineHeight: 1.5, marginBottom: 22 }}>
        Erreur OptoAMC. Le remboursement est trop faible pour realiser cette commande Supreme
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{
          flex: 1, borderRadius: 12, padding: '13px 0',
          fontSize: 15, fontWeight: 600, color: '#2a5080',
          border: '1px solid #e0e0e0', background: '#f5f5f5',
        }}>Annuler</div>
        <div style={{
          flex: 1.5, background: '#2a5080', borderRadius: 12, padding: '13px 0',
          fontSize: 15, fontWeight: 700, color: '#fff',
        }}>Envoyer une PEC</div>
      </div>
    </div>
  )
}

// ── Vue formateur page 1 : Réponses en direct ────────────────────
function PageQ1Formateur({ page }) {
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    const poll = async () => {
      try {
        const rows = await fetchOpenAnswers(getActiveSessionCode(), page.id)
        if (Array.isArray(rows)) setAnswers(rows)
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [page.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
        Question ouverte · Reponses en direct
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 24 }}>{page.titre}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
        {answers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '12px 0' }}>
            En attente des reponses des participants…
          </div>
        ) : answers.map((row, i) => (
          <div key={row.id || i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderLeft: `3px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}`,
            borderRadius: 12, padding: '12px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, minWidth: 90, paddingTop: 2, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length], flexShrink: 0 }}>
              {row.participant_name}
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{row.answer}</span>
          </div>
        ))}
      </div>

      {answers.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {answers.length} reponse{answers.length > 1 ? 's' : ''} recue{answers.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

// ── Vue formateur page 2 : Conditions ────────────────────────────
function PageConditionsFormateur({ rembfrRevealed, revealing, toggleCondition, pageIndex }) {
  const revealed = rembfrRevealed || []

  const RevealBtn = ({ id, label }) => {
    const isRevealed = revealed.includes(id)
    return (
      <button
        onClick={() => toggleCondition(id)}
        disabled={revealing}
        style={{
          padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          cursor: revealing ? 'default' : 'pointer', fontFamily: 'inherit',
          transition: 'all .2s',
          background: isRevealed ? 'rgba(74,222,128,0.12)' : 'rgba(0,137,186,0.12)',
          border: isRevealed ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(0,137,186,0.35)',
          color: isRevealed ? '#4ade80' : '#00abe9',
        }}
      >
        {isRevealed ? '✓ Révélé — Masquer' : `👁 Révéler ${label}`}
      </button>
    )
  }

  const conditions = [
    {
      id: 'couverture',
      num: '01',
      icon: '🏥',
      titre: 'Couverture SS + mutuelle / CSS',
      desc: 'Être couvert par la Sécurité Sociale et une mutuelle complémentaire ou la Complémentaire Santé Solidaire.',
      hasReveal: false,
      note: 'Ce critère est affiché d\'emblée sur le diffuseur, rien à révéler.',
    },
    {
      id: 'ordonnance',
      num: '02',
      icon: '📋',
      titre: 'Ordonnance en cours de validité',
      desc: 'La validité dépend de l\'âge du patient.',
      hasReveal: true,
      revealLabel: 'les durées de validité',
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          {[
            { label: 'Moins de 16 ans', duree: '1 an', color: '#f59e0b' },
            { label: 'De 16 à 42 ans',  duree: '5 ans', color: '#00abe9' },
            { label: '43 ans et plus',  duree: '3 ans', color: '#a78bfa' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>{r.label}</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: r.color }}>{r.duree}</span>
            </div>
          ))}
          {/* LYLEOO */}
          <div style={{ marginTop: 4, padding: '10px 12px', background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.25)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#c9a227', marginBottom: 4 }}>💡 Pas d'ordonnance valable ? → LYLEOO</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              Service disponible <strong style={{ color: '#fff' }}>en magasin pour les +18 ans</strong>.<br />
              À utiliser <strong style={{ color: '#fff' }}>uniquement pour débloquer un remboursement</strong> — service payé par LPT.<br />
              Toujours vérifier les autres critères <strong style={{ color: '#fff' }}>avant</strong> de lancer LYLEOO. Si pas de remboursement possible, pas besoin d'ordonnance.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'delais',
      num: '03',
      icon: '📅',
      titre: 'Délais de renouvellement',
      desc: 'Règles différentes selon l\'âge, avec possibilité de renouvellement anticipé.',
      hasReveal: true,
      revealLabel: 'les délais',
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <div style={{ padding: '10px 12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Moins de 16 ans</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
              Renouvellement <strong style={{ color: '#fff' }}>tous les ans</strong> sans condition<br />
              <strong style={{ color: '#fff' }}>Sans délai</strong> si changement ≥ 0,50 (renouvellement adapté)
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: 'rgba(0,171,233,0.07)', border: '1px solid rgba(0,171,233,0.18)', borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', marginBottom: 4 }}>16 ans et plus</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>
              Renouvellement <strong style={{ color: '#fff' }}>tous les 2 ans</strong><br />
              Anticipé à partir de <strong style={{ color: '#fff' }}>1 an et 1 jour</strong> si changement ≥ 0,50
            </div>
          </div>
          <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>💻</span>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>
              Date du dernier remboursement vérifiable sur <strong style={{ color: '#00abe9' }}>AMELIPRO</strong> — numéro de sécu du patient
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
        Vue formateur · Page {pageIndex + 1}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Les conditions de remboursement</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {conditions.map(c => (
          <div key={c.id} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 14, padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0089ba' }}>{c.num}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{c.titre}</span>
                </div>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>{c.desc}</p>
              </div>
              {c.hasReveal ? (
                <RevealBtn id={c.id} label={c.revealLabel} />
              ) : (
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic', textAlign: 'right', maxWidth: 160 }}>
                  {c.note}
                </div>
              )}
            </div>
            {c.detail}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Vue formateur page 3 : Démarche ──────────────────────────────
const DEMARCHE_STEPS_A = [
  { id: 'a1', label: '1', text: "Prendre l'ordonnance du client, sa carte Vitale et sa mutuelle." },
  { id: 'a2', label: '2', text: null, hasAmeliPro: true },
  { id: 'a3', label: '3', text: "Faire un test supreme si mon client possede une mutuelle autre que la CSS.", hasSante: true, note: 'Si CSS → passer directement en 1=1.' },
  { id: 'a4', label: '4', text: "Retourner voir mon client et adapter mon discours aux reponses obtenues." },
]

const DEMARCHE_STEPS_B = [
  { id: 'b1', label: '1', text: "Prendre la carte Vitale et verifier si le client a bien une mutuelle." },
  { id: 'b2', label: '2', text: null, hasAmeliPro: true },
  { id: 'b3', label: '3', text: "Si AMELIPRO ok → inscrire le client en examen de vue et obtenir une ordonnance via LYLEOO." },
  { id: 'b4', label: '4', text: "Une fois l'ordonnance obtenue, retourner a l'ordinateur pour faire le test supreme.", hasSante: true, note: 'Sauf si CSS → 1=1 directement.' },
]

function PageDemarcheFormateur({ stepA, stepB, onRevealA, onRevealB }) {
  const RevBtn = ({ onClick, label, active }) => (
    <button onClick={onClick} style={{
      background: active ? 'rgba(74,222,128,0.12)' : 'rgba(0,137,186,0.12)',
      border: active ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(0,137,186,0.35)',
      color: active ? '#4ade80' : '#00abe9',
      padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
      cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
    }}>{active ? '✓ Cache' : `+ Etape ${label}`}</button>
  )

  const StepRow = ({ step, revealed, onToggle }) => (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      background: revealed ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.03)',
      border: revealed ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '12px 16px', transition: 'all .2s',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: revealed ? 'rgba(74,222,128,0.15)' : 'rgba(0,137,186,0.15)',
        fontSize: 12, fontWeight: 900,
        color: revealed ? '#4ade80' : '#00abe9',
      }}>{step.label}</div>
      <div style={{ flex: 1, fontSize: 13, color: revealed ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)', lineHeight: 1.5, transition: 'all .2s' }}>
        {step.hasAmeliPro ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span>Aller a l&apos;ordinateur et me rendre sur <strong>AMELIPRO</strong> pour voir de quand date le dernier remboursement.</span>
            <div><AmeliproBadge /></div>
          </div>
        ) : step.hasSante ? (
          <span>{step.text} <LptSanteBadge /></span>
        ) : step.text}
        {step.note && revealed && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>{step.note}</div>
        )}
      </div>
      <button onClick={onToggle} style={{
        flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 14, color: revealed ? '#4ade80' : 'rgba(255,255,255,0.2)',
        padding: '2px 6px',
      }}>{revealed ? '✓' : '👁'}</button>
    </div>
  )

  return (
    <div style={{ display: 'flex', gap: 24, height: '100%' }}>
      {/* Scenario A */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
          padding: '10px 14px', background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.25)', borderRadius: 10,
        }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1 }}>Scenario A</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Client avec ordonnance valide</div>
          </div>
        </div>
        {DEMARCHE_STEPS_A.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            revealed={i < stepA}
            onToggle={() => onRevealA(i < stepA ? i : i + 1)}
          />
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {stepA < DEMARCHE_STEPS_A.length && (
            <RevBtn onClick={() => onRevealA(stepA + 1)} label={stepA + 1} active={false} />
          )}
          {stepA > 0 && (
            <RevBtn onClick={() => onRevealA(stepA - 1)} label={stepA} active={true} />
          )}
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: 1, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

      {/* Scenario B */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
          padding: '10px 14px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10,
        }}>
          <span style={{ fontSize: 16 }}>🚫</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>Scenario B</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Client sans ordonnance valide</div>
          </div>
        </div>
        {DEMARCHE_STEPS_B.map((step, i) => (
          <StepRow
            key={step.id}
            step={step}
            revealed={i < stepB}
            onToggle={() => onRevealB(i < stepB ? i : i + 1)}
          />
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {stepB < DEMARCHE_STEPS_B.length && (
            <RevBtn onClick={() => onRevealB(stepB + 1)} label={stepB + 1} active={false} />
          )}
          {stepB > 0 && (
            <RevBtn onClick={() => onRevealB(stepB - 1)} label={stepB} active={true} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vue formateur page 4 : Test Supreme ──────────────────────────
function PageSupremeFormateur({ supremeStep, onReveal }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <LptSanteBadge size={44} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5 }}>Test Supreme</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>Resultats possibles</h2>
        </div>
      </div>

      {/* Deux colonnes */}
      <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>

        {/* Accepté */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 14,
          background: supremeStep >= 1 ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.03)',
          border: supremeStep >= 1 ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '20px', transition: 'all .35s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800,
              background: supremeStep >= 1 ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.07)',
              color: supremeStep >= 1 ? '#4ade80' : 'rgba(255,255,255,0.25)',
            }}>ACCEPTE ✓</div>
            {supremeStep < 1 && (
              <button onClick={() => onReveal(1)} style={{
                background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                color: '#4ade80', padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Reveler</button>
            )}
          </div>
          {supremeStep >= 1 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <SupremeAcceptePopup />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 18 }}>🎉</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>Parcours Supreme → 2 paires 0 €</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Refusé */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', gap: 14,
          background: supremeStep >= 2 ? 'rgba(239,68,68,0.05)' : 'rgba(255,255,255,0.03)',
          border: supremeStep >= 2 ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: '20px', transition: 'all .35s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{
              padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800,
              background: supremeStep >= 2 ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.07)',
              color: supremeStep >= 2 ? '#f87171' : 'rgba(255,255,255,0.25)',
            }}>REFUSE ✗</div>
            {supremeStep === 1 && (
              <button onClick={() => onReveal(2)} style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171', padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>Reveler</button>
            )}
          </div>
          {supremeStep >= 2 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <SupremeRefusePopup />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10,
              }}>
                <span style={{ fontSize: 18 }}>🎉</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>Parcours 1=1 → 2 paires 0 €</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Note Slack */}
      <div style={{
        flexShrink: 0,
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6,
      }}>
        <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Message d&apos;erreur incomprehensible ?</strong> Demandez aux collegues. Si personne ne sait : photo sur le canal <strong style={{ color: '#fff' }}>#tiers-payant</strong> Slack + <strong style={{ color: '#fff' }}>@NathanVision</strong> → reponse en quelques secondes.
      </div>

      {supremeStep > 0 && (
        <button onClick={() => onReveal(supremeStep - 1)} style={{
          alignSelf: 'flex-start', flexShrink: 0,
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.4)', padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>← Masquer</button>
      )}
    </div>
  )
}

export default function ModuleRemboursementFrance({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const syncedRef = useRef(false)
  const [rembfrRevealed, setRembfrRevealed] = useState([])
  const [revealing, setRevealing] = useState(false)
  const [demarcheA, setDemarcheA] = useState(0)
  const [demarcheB, setDemarcheB] = useState(0)
  const [supremeStep, setSupremeStep] = useState(0)

  const toggleCondition = async (id) => {
    setRevealing(true)
    try {
      const next = rembfrRevealed.includes(id)
        ? rembfrRevealed.filter(x => x !== id)
        : [...rembfrRevealed, id]
      setRembfrRevealed(next)
      await setSharedState({ rembfr_revealed: next })
    } finally {
      setRevealing(false)
    }
  }

  const handleDemarcheA = async (val) => {
    setDemarcheA(val)
    await setSharedState({ rembfr_demarche_a: val })
  }

  const handleDemarcheB = async (val) => {
    setDemarcheB(val)
    await setSharedState({ rembfr_demarche_b: val })
  }

  const handleSupreme = async (val) => {
    setSupremeStep(val)
    await setSharedState({ rembfr_supreme: val })
  }

  const syncAndWrite = async (data) => {
    if (!syncedRef.current) {
      await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName)
      syncedRef.current = true
    }
    sbUpdate('sessions', data, 'code=eq.' + getActiveSessionCode())
  }

  useEffect(() => {
    if (!started) return
    setSharedState({ rembfr_revealed: [], rembfr_demarche_a: 0, rembfr_demarche_b: 0, rembfr_supreme: 0 })
    syncAndWrite({ active_module: MODULE_ID, module_page: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  useEffect(() => {
    if (started && pageIndex > 0) {
      syncAndWrite({ module_page: pageIndex })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex])

  const resetShared = () => setSharedState({ rembfr_revealed: [], rembfr_demarche_a: 0, rembfr_demarche_b: 0, rembfr_supreme: 0 })

  const handleBack = async () => {
    await Promise.all([
      sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()),
      resetShared(),
    ])
    onBack()
  }

  const handleTerminate = async () => {
    await Promise.all([
      sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()),
      resetShared(),
    ])
    onBack()
  }

  // ── Écran de démarrage ───────────────────────────────────────────
  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 500, padding: '0 24px', textAlign: 'center' }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
          <div style={{ background: 'rgba(0,137,186,0.15)', border: '1px solid rgba(0,137,186,0.3)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Formation · France · Journée 3
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Remboursement optique en France</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
            {PAGES.length} page{PAGES.length > 1 ? 's' : ''} · SS · Mutuelle · 100% Santé · Conditions
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleBack} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', padding: '14px 28px', borderRadius: 14,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Retour</button>
            <button onClick={() => setStarted(true)} style={{
              background: 'linear-gradient(135deg, #0070a0, #0089ba)',
              border: 'none', color: '#fff', padding: '14px 40px',
              borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(0,137,186,0.4)', fontFamily: 'inherit',
            }}>▶ Lancer le module</button>
          </div>
        </div>
      </div>
    )
  }

  const page = PAGES[pageIndex]
  const isLast = pageIndex === PAGES.length - 1

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Remboursement optique en France</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {PAGES.map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? '#0089ba' : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {PAGES.length}</span>
          <button onClick={handleBack} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>✕ Quitter</button>
        </div>
      </div>

      {/* Contenu formateur */}
      <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {page?.type === 'rembfr-conditions' ? (
          <PageConditionsFormateur
            rembfrRevealed={rembfrRevealed}
            revealing={revealing}
            toggleCondition={toggleCondition}
            pageIndex={pageIndex}
          />
        ) : page?.type === 'rembfr-demarche' ? (
          <PageDemarcheFormateur
            stepA={demarcheA}
            stepB={demarcheB}
            onRevealA={handleDemarcheA}
            onRevealB={handleDemarcheB}
          />
        ) : page?.type === 'rembfr-supreme' ? (
          <PageSupremeFormateur
            supremeStep={supremeStep}
            onReveal={handleSupreme}
          />
        ) : (
          /* Page pause : reponses en direct */
          <PageQ1Formateur page={page} />
        )}
      </div>

      {/* Navigation */}
      <div style={{
        padding: '20px 32px', borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
      }}>
        <button
          onClick={() => setPageIndex(i => Math.max(0, i - 1))}
          disabled={pageIndex === 0}
          style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: pageIndex === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
            padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: pageIndex === 0 ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >← Précédent</button>

        {isLast ? (
          <button onClick={handleTerminate} style={{
            background: 'linear-gradient(135deg, #0070a0, #0089ba)',
            border: 'none', color: '#fff', padding: '12px 32px',
            borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,137,186,0.35)',
          }}>Terminer le module ✓</button>
        ) : (
          <button onClick={() => setPageIndex(i => Math.min(PAGES.length - 1, i + 1))} style={{
            background: 'linear-gradient(135deg, #0070a0, #0089ba)',
            border: 'none', color: '#fff', padding: '12px 32px',
            borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,137,186,0.35)',
          }}>Suivant →</button>
        )}
      </div>
    </div>
  )
}
