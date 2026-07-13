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
  const [inamiRevealed, setInamiRevealed] = useState(false)
  const [inamiRevealing, setInamiRevealing] = useState(false)

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

  const toggleInami = async () => {
    setInamiRevealing(true)
    try {
      const next = !inamiRevealed
      setInamiRevealed(next)
      await setSharedState({ inami_revealed: next })
    } finally {
      setInamiRevealing(false)
    }
  }

  const [partenaRevealed, setPartenaRevealed] = useState(false)
  const [partenaRevealing, setPartenaRevealing] = useState(false)

  const togglePartena = async () => {
    setPartenaRevealing(true)
    try {
      const next = !partenaRevealed
      setPartenaRevealed(next)
      await setSharedState({ partena_revealed: next })
    } finally {
      setPartenaRevealing(false)
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
      setSharedState({ mutuelles_revealed: [], inami_revealed: false, partena_revealed: false }),
    ])
    onBack()
  }

  const handleTerminate = async () => {
    await Promise.all([
      sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()),
      setSharedState({ mutuelles_revealed: [], inami_revealed: false, partena_revealed: false }),
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
      {page?.type === 'partena-offre' ? (
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              Vue formateur · Page 4 (dernière)
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>PARTENA</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
              Offre partenaire Lunettes Pour Tous
            </div>

            {/* Offre toujours visible côté formateur */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {[
                { montant: '50 €', label: 'Verres unifocaux', icon: '👓' },
                { montant: '100 €', label: 'Verres progressifs', icon: '🔭' },
              ].map(o => (
                <div key={o.label} style={{
                  background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.3)',
                  borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                }}>
                  <span style={{ fontSize: 26 }}>{o.icon}</span>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#c9a227', lineHeight: 1 }}>{o.montant}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>pour une paire à {o.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {[
                'Avantage disponible une fois tous les 2 ans',
                "Non cumulable avec l'Avantage Partenamut classique (75 € tous les 2 ans sur montures, verres correcteurs ou lentilles, chez l'opticien de son choix)",
                'Pas besoin de prescription ophtalmologique',
              ].map((c, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: '2px solid rgba(201,162,39,0.4)', borderRadius: 8, padding: '10px 14px',
                }}>
                  <span style={{ color: '#c9a227', flexShrink: 0 }}>●</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{c}</span>
                </div>
              ))}
            </div>

            <button
              onClick={togglePartena}
              disabled={partenaRevealing}
              style={{
                background: partenaRevealed ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #a07818, #c9a227)',
                border: partenaRevealed ? '1px solid rgba(239,68,68,0.3)' : 'none',
                color: partenaRevealed ? '#f87171' : '#fff',
                padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: partenaRevealing ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: partenaRevealing ? 0.7 : 1,
              }}
            >
              {partenaRevealed ? '🙈 Masquer l\'offre sur TV' : '👁 Dévoiler l\'offre sur TV'}
            </button>
          </div>
        </div>
      ) : page?.type === 'inami-info' ? (
        <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
          {/* Présentation INAMI */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
              Vue formateur · Page 3
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: -1, marginBottom: 6 }}>INAMI</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
              Institut National d&apos;Assurance Maladie-Invalidité
            </div>
            <div style={{
              background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.2)',
              borderRadius: 12, padding: '12px 18px',
              fontSize: 13, color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: 1.6,
              marginBottom: 24,
            }}>
              🏛️ C&apos;est l&apos;organisme public qui gère l&apos;assurance obligatoire soins de santé en Belgique, c&apos;est donc lui qui fixe les règles.
            </div>

            {/* Conditions (toujours visibles côté formateur) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
              {[
                {
                  titre: '👁️ Seuils de correction',
                  items: [
                    '< 18 ans : dès 0,25 dioptrie',
                    '18–64 ans : à partir de ± 6,00 dioptries',
                    '≥ 65 ans : à partir de ± 4,25 dioptries (bifocaux/progressifs)',
                  ],
                },
                {
                  titre: '🔄 Fréquence',
                  items: [
                    '< 18 ans : tous les 2 ans',
                    '≥ 18 ans : tous les 5 ans',
                    'Exception : si Δ dioptrie ≥ 0,5 vs précédente délivrance → droit immédiat',
                  ],
                },
                {
                  titre: '📄 Documents requis',
                  items: [
                    'Attestation de délivrance signée par l\'opticien (Annexe 15)',
                    'Prescription ophtalmologue valable (< 6 mois)',
                  ],
                },
              ].map((section) => (
                <div key={section.titre} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderTop: '2px solid rgba(201,162,39,0.5)', borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#c9a227', marginBottom: 10 }}>{section.titre}</div>
                  <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {section.items.map((item, i) => (
                      <li key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bouton Dévoiler */}
            <button
              onClick={toggleInami}
              disabled={inamiRevealing}
              style={{
                background: inamiRevealed ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg, #a07818, #c9a227)',
                border: inamiRevealed ? '1px solid rgba(239,68,68,0.3)' : 'none',
                color: inamiRevealed ? '#f87171' : '#fff',
                padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: inamiRevealing ? 'default' : 'pointer', fontFamily: 'inherit',
                opacity: inamiRevealing ? 0.7 : 1,
              }}
            >
              {inamiRevealed ? '🙈 Masquer les conditions sur TV' : '👁 Dévoiler les conditions sur TV'}
            </button>
          </div>
        </div>
      ) : page?.type === 'mutuelles-reveal' ? (
        <div style={{ flex: 1, padding: '28px 40px', overflowY: 'auto' }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
              Vue formateur · Cliquez «&nbsp;Révéler&nbsp;» pour projeter sur TV
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Les organismes assureurs en Belgique</div>
          </div>

          {/* Cartes individuelles — avec optique */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            {MUTUELLES_BELGIQUE.filter(m => m.complementaire).map((m) => {
              const isRevealed = revealedIds.includes(m.id)
              return (
                <div key={m.id} style={{
                  background: isRevealed ? 'rgba(201,162,39,0.08)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isRevealed ? 'rgba(201,162,39,0.4)' : 'rgba(255,255,255,0.09)'}`,
                  borderLeft: `3px solid ${isRevealed ? '#c9a227' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: 3 }}>{m.nom}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{m.type}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '2px 8px', flexShrink: 0, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' }}>
                      ✓ Optique
                    </span>
                  </div>

                  {isRevealed && m.montant !== null && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 12px', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 10px' }}>
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

          {/* Carte groupée — sans optique */}
          <div style={{
            background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
            borderLeft: '3px solid rgba(239,68,68,0.45)', borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <span style={{ fontSize: 9, fontWeight: 700, borderRadius: 20, padding: '3px 10px', flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>
              ✗ Pas de complémentaire optique
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MUTUELLES_BELGIQUE.filter(m => !m.complementaire).map(m => (
                <span key={m.id} style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 12px' }}>
                  {m.nom}
                </span>
              ))}
            </div>
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
