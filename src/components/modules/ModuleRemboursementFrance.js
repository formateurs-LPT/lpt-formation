'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'remboursement-france'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

export default function ModuleRemboursementFrance({ pName, onBack }) {
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
      <div style={{ flex: 1, padding: '40px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ maxWidth: 640, width: '100%', textAlign: 'center' }}>
          {page?.icon && (
            <div style={{ fontSize: 56, marginBottom: 24 }}>{page.icon}</div>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>
            Discussion ouverte · Page {pageIndex + 1}
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 12 }}>
            {page?.titre}
          </h2>
          {page?.sousTitre && (
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>{page.sousTitre}</p>
          )}
          <div style={{
            background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.2)',
            borderRadius: 14, padding: '16px 20px',
            fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6,
          }}>
            💡 Cette question est projetée sur l'écran diffuseur. Laissez les formés répondre à l'oral avant de passer à la suite.
          </div>
        </div>
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
