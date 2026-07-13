'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'parcours-rembourses'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

function PageOffresFormateur({ pageIndex }) {
  const offres = [
    {
      id: 'supreme',
      icon: '👑',
      nom: 'Le Suprême',
      color: '#c9a227',
      colorBg: 'rgba(201,162,39,0.08)',
      colorBorder: 'rgba(201,162,39,0.25)',
      description: 'Notre offre phare — remboursée par la mutuelle selon le contrat du client.',
    },
    {
      id: '1=1',
      icon: '✅',
      nom: 'Le 1=1 · 100% Santé',
      color: '#4ade80',
      colorBg: 'rgba(74,222,128,0.08)',
      colorBorder: 'rgba(74,222,128,0.25)',
      description: 'Offre 100% prise en charge — zéro reste à charge pour le patient assuré.',
    },
  ]

  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
        Vue formateur · Page {pageIndex + 1}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Les offres remboursées</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.5 }}>
        Les deux parcours affichés sur l'écran diffuseur. Développez ensuite avec vos explications.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {offres.map(o => (
          <div key={o.id} style={{
            background: o.colorBg, border: `1px solid ${o.colorBorder}`,
            borderRadius: 16, padding: '20px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 28 }}>{o.icon}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: o.color }}>{o.nom}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>{o.description}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.2)', borderRadius: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
        💡 Le contenu de chaque offre est affiché sur l'écran diffuseur. Animez la discussion à l'oral à partir de ce que les formés voient.
      </div>
    </div>
  )
}

export default function ModuleParcoursRembourses({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const syncedRef = useRef(false)

  const syncAndWrite = async (data) => {
    if (!syncedRef.current) {
      await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName)
      syncedRef.current = true
    }
    sbUpdate('sessions', data, 'code=eq.' + getActiveSessionCode())
  }

  useEffect(() => {
    if (!started) return
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
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode())
    onBack()
  }

  const handleTerminate = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode())
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
          <PageOffresFormateur pageIndex={pageIndex} />
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
