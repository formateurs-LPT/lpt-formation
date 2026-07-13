'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'remboursement-france'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

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

export default function ModuleRemboursementFrance({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const syncedRef = useRef(false)
  const [rembfrRevealed, setRembfrRevealed] = useState([])
  const [revealing, setRevealing] = useState(false)

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

  const syncAndWrite = async (data) => {
    if (!syncedRef.current) {
      await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName)
      syncedRef.current = true
    }
    sbUpdate('sessions', data, 'code=eq.' + getActiveSessionCode())
  }

  useEffect(() => {
    if (!started) return
    setSharedState({ rembfr_revealed: [] })
    syncAndWrite({ active_module: MODULE_ID, module_page: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  useEffect(() => {
    if (started && pageIndex > 0) {
      syncAndWrite({ module_page: pageIndex })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex])

  const handleBack = async () => {
    await Promise.all([
      sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()),
      setSharedState({ rembfr_revealed: [] }),
    ])
    onBack()
  }

  const handleTerminate = async () => {
    await Promise.all([
      sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()),
      setSharedState({ rembfr_revealed: [] }),
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
        ) : (
          /* Page pause par défaut */
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center' }}>
            <div style={{ maxWidth: 560 }}>
              {page?.icon && <div style={{ fontSize: 56, marginBottom: 24 }}>{page.icon}</div>}
              <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>
                Discussion ouverte · Page {pageIndex + 1}
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 12 }}>{page?.titre}</h2>
              {page?.sousTitre && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>{page.sousTitre}</p>}
              <div style={{ background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.2)', borderRadius: 14, padding: '14px 18px', fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                💡 Cette question est projetée sur l'écran diffuseur. Laissez les formés répondre à l'oral avant de passer à la suite.
              </div>
            </div>
          </div>
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
