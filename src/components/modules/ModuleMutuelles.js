'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { MODULE_DATA, MUTUELLES_BELGIQUE } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'mutuelles-inami'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

export default function ModuleMutuelles({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const syncedRef = useRef(false)
  const [revealedIds, setRevealedIds] = useState([])
  const [revealing, setRevealing] = useState(false)

  const toggleReveal = async (id) => {
    setRevealing(true)
    try {
      const next = revealedIds.includes(id)
        ? revealedIds.filter(x => x !== id)
        : [...revealedIds, id]
      setRevealedIds(next)
      await setSharedState({ mutuelles_revealed: next })
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
    if (started) {
      syncAndWrite({ active_module: MODULE_ID, module_page: pageIndex })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, pageIndex])

  const handleBack = async () => {
    await Promise.all([
      sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()),
      setSharedState({ mutuelles_revealed: [] }),
    ])
    onBack()
  }

  const handleTerminate = async () => {
    await Promise.all([
      sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()),
      setSharedState({ mutuelles_revealed: [] }),
    ])
    onBack()
  }

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 500, padding: '0 24px', textAlign: 'center' }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
          <div style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Formation · Belgique · Journée 3
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Mutuelles et INAMI</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
            {PAGES.length} page{PAGES.length > 1 ? 's' : ''} · Remboursements · INAMI · Mutuelles belges
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleBack} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', padding: '14px 28px', borderRadius: 14,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Retour</button>
            <button onClick={() => setStarted(true)} style={{
              background: 'linear-gradient(135deg, #a07818, #c9a227)',
              border: 'none', color: '#fff', padding: '14px 40px',
              borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(201,162,39,0.4)', fontFamily: 'inherit',
            }}>▶ Lancer le module</button>
          </div>
        </div>
      </div>
    )
  }

  const page = PAGES[pageIndex]
  const isFirst = pageIndex === 0
  const isLast = pageIndex === PAGES.length - 1

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Mutuelles et INAMI</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {PAGES.map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? '#c9a227' : 'rgba(255,255,255,0.2)',
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

      {/* Page principale — contenu formateur */}
      {page?.type === 'mutuelles-reveal' ? (
        <div style={{ flex: 1, padding: '28px 40px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
              Vue formateur · Cliquez «&nbsp;Révéler&nbsp;» pour projeter sur TV
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Les organismes assureurs en Belgique</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {MUTUELLES_BELGIQUE.map((m) => {
              const isRevealed = revealedIds.includes(m.id)
              return (
                <div key={m.id} style={{
                  background: isRevealed ? 'rgba(201,162,39,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isRevealed ? 'rgba(201,162,39,0.4)' : 'rgba(255,255,255,0.09)'}`,
                  borderLeft: `3px solid ${isRevealed ? '#c9a227' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {/* Nom + type */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 3 }}>{m.nom}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{m.type}</div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px', flexShrink: 0,
                      background: m.complementaire ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${m.complementaire ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.25)'}`,
                      color: m.complementaire ? '#4ade80' : '#f87171',
                    }}>
                      {m.complementaire ? '✓ Optique' : '✗ Pas d\'optique'}
                    </span>
                  </div>

                  {/* Détails si révélé */}
                  {isRevealed && m.montant !== null && (
                    <div style={{
                      background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px',
                      display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px',
                    }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>Montant</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#c9a227' }}>{m.montant}</span>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>Fréquence</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{m.frequence}</span>
                      {m.particularites && m.particularites !== '/' && (
                        <>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.7 }}>Particularités</span>
                          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{m.particularites}</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Bouton Révéler / Masquer */}
                  <button
                    onClick={() => toggleReveal(m.id)}
                    disabled={revealing}
                    style={{
                      alignSelf: 'flex-start',
                      background: isRevealed ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #a07818, #c9a227)',
                      border: isRevealed ? '1px solid rgba(239,68,68,0.3)' : 'none',
                      color: isRevealed ? '#f87171' : '#fff',
                      padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: revealing ? 'default' : 'pointer', fontFamily: 'inherit',
                      opacity: revealing ? 0.7 : 1,
                    }}
                  >
                    {isRevealed ? '🙈 Masquer' : '👁 Révéler sur TV'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 48px', gap: 32,
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(201,162,39,0.12)', border: '2px solid rgba(201,162,39,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52,
          }}>
            {page?.icon || '🛡️'}
          </div>

          <div style={{ textAlign: 'center', maxWidth: 640 }}>
            <div style={{
              display: 'inline-block', background: 'rgba(201,162,39,0.15)',
              border: '1px solid rgba(201,162,39,0.3)', borderRadius: 20,
              padding: '4px 16px', fontSize: 11, fontWeight: 700,
              color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20,
            }}>
              Affiché sur TV et téléphones
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
              {page?.titre}
            </h1>
            {page?.sousTitre && (
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                {page.sousTitre}
              </p>
            )}
          </div>

          <div style={{
            background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)',
            borderRadius: 14, padding: '14px 24px',
            fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic',
          }}>
            💬 Laissez les participants s&apos;exprimer, puis passez à la suite
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 48px 32px',
      }}>
        <button
          onClick={() => setPageIndex(i => Math.max(0, i - 1))}
          disabled={isFirst}
          style={{
            background: isFirst ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
            padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >← Précédent</button>

        {isLast ? (
          <button onClick={handleTerminate} style={{
            background: 'linear-gradient(135deg, #a07818, #c9a227)',
            border: 'none', color: '#fff',
            padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 6px 24px rgba(201,162,39,0.4)',
            fontFamily: 'inherit',
          }}>Terminer le module →</button>
        ) : (
          <button onClick={() => setPageIndex(i => i + 1)} style={{
            background: 'linear-gradient(135deg, #a07818, #c9a227)',
            border: 'none', color: '#fff',
            padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 6px 24px rgba(201,162,39,0.4)',
            fontFamily: 'inherit',
          }}>Suivant →</button>
        )}
      </div>
    </div>
  )
}
