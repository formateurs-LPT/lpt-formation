'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'parcours-rembourses'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

const OFFRES = [
  {
    id: 'supreme',
    nom: 'Suprême',
    color: '#b03050',
    colorBg: 'rgba(139,28,46,0.1)',
    colorBorder: 'rgba(139,28,46,0.3)',
    points: [
      '1 paire achetée, une paire offerte',
      'Choix sur tout le magasin (montures et verres)',
      'Verres Origine France Garantie',
      'Uniquement avec tiers payant complet',
    ],
  },
  {
    id: '1=1',
    nom: '1=1',
    color: '#4ade80',
    colorBg: 'rgba(74,222,128,0.08)',
    colorBorder: 'rgba(74,222,128,0.25)',
    points: [
      '1 paire achetée, une paire offerte',
      'Sur tout le magasin (montures et verres au choix)',
      'Tarifs 100% Santé : 0 € de reste à charge quelle que soit la mutuelle',
    ],
  },
]

function PageOffresFormateur({ parcoursRevealed, revealing, toggleOffre, pageIndex }) {
  const revealed = parcoursRevealed || []

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
        Vue formateur · Page {pageIndex + 1}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Les offres remboursées</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {OFFRES.map(o => {
          const isRevealed = revealed.includes(o.id)
          return (
            <div key={o.id} style={{
              background: o.colorBg, border: `1px solid ${o.colorBorder}`,
              borderRadius: 16, padding: '20px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: isRevealed ? 16 : 0 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: o.color }}>{o.nom}</div>
                <button
                  onClick={() => toggleOffre(o.id)}
                  disabled={revealing}
                  style={{
                    padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: revealing ? 'default' : 'pointer', fontFamily: 'inherit',
                    transition: 'all .2s', flexShrink: 0,
                    background: isRevealed ? 'rgba(74,222,128,0.12)' : 'rgba(0,137,186,0.12)',
                    border: isRevealed ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(0,137,186,0.35)',
                    color: isRevealed ? '#4ade80' : '#00abe9',
                  }}
                >
                  {isRevealed ? '✓ Révélé — Masquer' : '👁 Dévoiler'}
                </button>
              </div>
              {isRevealed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {o.points.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: o.color, marginTop: 7, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(0,137,186,0.07)', border: '1px solid rgba(0,137,186,0.18)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
        💡 Utilisez "Dévoiler" pour faire apparaître les critères sur l'écran diffuseur.
      </div>
    </div>
  )
}

export default function ModuleParcoursRembourses({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [parcoursRevealed, setParcoursRevealed] = useState([])
  const [tiersPayantRevealed, setTiersPayantRevealed] = useState(false)
  const [revealing, setRevealing] = useState(false)
  const syncedRef = useRef(false)

  const toggleOffre = async (id) => {
    setRevealing(true)
    try {
      const next = parcoursRevealed.includes(id)
        ? parcoursRevealed.filter(x => x !== id)
        : [...parcoursRevealed, id]
      setParcoursRevealed(next)
      await setSharedState({ parcours_revealed: next })
    } finally {
      setRevealing(false)
    }
  }

  const toggleTiersPayant = async () => {
    setRevealing(true)
    try {
      const next = !tiersPayantRevealed
      setTiersPayantRevealed(next)
      await setSharedState({ tiers_payant_revealed: next })
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
    setSharedState({ parcours_revealed: [], tiers_payant_revealed: false })
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
      setSharedState({ parcours_revealed: [], tiers_payant_revealed: false }),
    ])
    onBack()
  }

  const handleTerminate = async () => {
    await Promise.all([
      sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()),
      setSharedState({ parcours_revealed: [], tiers_payant_revealed: false }),
    ])
    onBack()
  }

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 500, padding: '0 24px', textAlign: 'center' }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
          <div style={{ background: 'rgba(0,137,186,0.15)', border: '1px solid rgba(0,137,186,0.3)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Formation · France · Journée 3
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Les parcours remboursés</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
            {PAGES.length} page{PAGES.length > 1 ? 's' : ''} · Le Suprême · Le 1=1 · 100% Santé
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Les parcours remboursés</span>
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
        {page?.type === 'parcours-rembourses-offres' ? (
          <PageOffresFormateur
            parcoursRevealed={parcoursRevealed}
            revealing={revealing}
            toggleOffre={toggleOffre}
            pageIndex={pageIndex}
          />
        ) : page?.type === 'parcours-tiers-payant' ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
              Vue formateur · Page {pageIndex + 1}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Le tiers payant</h2>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 14, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>🏥 Question ouverte sur le diffuseur</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>« C'est quoi le tiers payant pour vous ? »</div>
            </div>
            <div style={{ background: 'rgba(0,137,186,0.07)', border: '1px solid rgba(0,137,186,0.2)', borderRadius: 14, padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: tiersPayantRevealed ? 16 : 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9' }}>Définition à révéler</div>
                <button
                  onClick={toggleTiersPayant}
                  disabled={revealing}
                  style={{
                    padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    cursor: revealing ? 'default' : 'pointer', fontFamily: 'inherit',
                    transition: 'all .2s', flexShrink: 0,
                    background: tiersPayantRevealed ? 'rgba(74,222,128,0.12)' : 'rgba(0,137,186,0.12)',
                    border: tiersPayantRevealed ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(0,137,186,0.35)',
                    color: tiersPayantRevealed ? '#4ade80' : '#00abe9',
                  }}
                >
                  {tiersPayantRevealed ? '✓ Révélé — Masquer' : '👁 Dévoiler la définition'}
                </button>
              </div>
              {tiersPayantRevealed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontSize: 13, color: '#fff', fontWeight: 600, margin: 0, lineHeight: 1.55 }}>
                    Le tiers payant est un système qui permet au client de <span style={{ color: '#00abe9' }}>ne pas avancer les frais</span>.
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.55 }}>
                    La Sécurité Sociale et la mutuelle règlent directement l'opticien. Le client ne paie que son éventuel reste à charge —{' '}
                    <span style={{ color: '#4ade80', fontWeight: 700 }}>chez nous, ce reste à charge est de 0 €, donc le client ne paie rien.</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : page?.type === 'tiers-payant-explication' ? (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
              Vue formateur · Page {pageIndex + 1}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20 }}>Comment fonctionne le tiers payant ?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#4ade80', marginBottom: 10 }}>✅ Tiers payant complet</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
                  <span>💳 Carte Vitale → règle LPT</span>
                  <span>💳 Mutuelle → règle LPT</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>🧑 Client → 0 € reste à charge</span>
                </div>
              </div>
              <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '18px 20px' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', marginBottom: 10 }}>⚡ Tiers payant partiel</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
                  <span>💳 Vitale + Client → règlent LPT</span>
                  <span>📄 Client envoie facture à la mutuelle</span>
                  <span>💰 Mutuelle rembourse le client</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>🧑 Client → 0 € reste à charge</span>
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(0,137,186,0.07)', border: '1px solid rgba(0,137,186,0.18)', borderRadius: 10, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              💡 L'animation est diffusée en direct sur le grand écran.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', textAlign: 'center' }}>
            <div style={{ maxWidth: 560 }}>
              {page?.icon && <div style={{ fontSize: 56, marginBottom: 24 }}>{page.icon}</div>}
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 12 }}>{page?.titre}</h2>
              {page?.sousTitre && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>{page.sousTitre}</p>}
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
