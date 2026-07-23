'use client'
import { useState } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode } from '@/lib/supabase'
import { RAZ_PAGES } from '@/lib/modulesData'

function Lobby({ onStart, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Retour</button>
      <div style={{ textAlign: 'center', maxWidth: 560, padding: '0 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>🔄</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>SAV · Journée 4 · Module 3</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Les RAZ — Recommandes</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 16, lineHeight: 1.6 }}>
          Refabrication d'équipements · Process · Dernier recours
        </p>
        <div style={{ display: 'inline-block', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '10px 20px', fontSize: 13, color: '#f59e0b', marginBottom: 28 }}>
          🚧 Contenu détaillé à venir lors de la prochaine session
        </div>
        <br />
        <button onClick={onStart} style={{ background: 'linear-gradient(135deg, #b91c1c, #ef4444)', border: 'none', color: '#fff', padding: '16px 48px', borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(239,68,68,0.35)', fontFamily: 'inherit' }}>▶ Introduction</button>
      </div>
    </div>
  )
}

function IntroPage({ page, onBack, onTerminate }) {
  const [notesOpen, setNotesOpen] = useState(true)
  const { color, icon, titre, sousTitre, points, notesFormateur } = page

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>SAV · RAZ · Introduction</span>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >✕ Quitter</button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: '3', padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>{sousTitre}</div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 28 }}>{titre}</h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {points.map((pt, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: `3px solid ${color}70`, borderRadius: 12, padding: '12px 16px' }}>
                <span style={{ fontSize: 22, flexShrink: 0, marginTop: 1 }}>{pt.emoji}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20 }}>🚧</span>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>Le process détaillé des RAZ sera présenté lors de la prochaine session de formation.</div>
          </div>
        </div>

        <div style={{ flex: '2', padding: '24px 24px', overflowY: 'auto' }}>
          <button onClick={() => setNotesOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#f59e0b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: notesOpen ? 14 : 0, padding: 0 }}>
            <span>📝</span><span>Notes formateur</span>
            <span style={{ marginLeft: 'auto', fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{notesOpen ? '▾' : '▸'}</span>
          </button>
          {notesOpen && notesFormateur && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notesFormateur.map((note, i) => (
                <div key={i} style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderLeft: '3px solid rgba(245,158,11,0.5)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', marginBottom: 5 }}>{note.icon} {note.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{note.text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 28px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={onTerminate} style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          ✓ Terminer le module
        </button>
      </div>
    </div>
  )
}

export default function ModuleRAZ({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const sc = () => getActiveSessionCode()

  const handleStart = async () => { await sbUpdate('sessions', { active_module: 'raz', module_page: 0 }, 'code=eq.' + sc()); setStarted(true) }
  const handleBack = async () => { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + sc()); onBack() }
  const handleTerminate = async () => { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + sc()); ;(onTerminate ?? onBack)() }

  if (!started) return <Lobby onStart={handleStart} onBack={handleBack} />
  return <IntroPage page={RAZ_PAGES[0]} onBack={handleBack} onTerminate={handleTerminate} />
}
