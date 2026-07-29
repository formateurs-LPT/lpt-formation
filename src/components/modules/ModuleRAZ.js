'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, fetchOpenAnswers, setSharedState } from '@/lib/supabase'
import { RAZ_PAGES } from '@/lib/modulesData'

const BUBBLE_COLORS = ['#00abe9', '#4ade80', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']

function BrainstormController({ page, onNext, onBack }) {
  const [answers, setAnswers] = useState([])
  const [revealed, setRevealed] = useState(false)
  const pageId = `${page.moduleId}:brainstorm`

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchOpenAnswers(getActiveSessionCode(), pageId)
      setAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [pageId])

  const handleReveal = async () => {
    await setSharedState({ brainstorm_revealed: true })
    setRevealed(true)
  }

  const handleNext = async () => {
    await setSharedState({ brainstorm_revealed: false })
    onNext()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '20px 32px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>SAV · RAZ — Brainstorm</span>
        </div>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
        >✕ Quitter</button>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-block', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 20, padding: '5px 20px', fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>💬 Brainstorm — Les formés répondent sur leur téléphone</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.3, whiteSpace: 'pre-line' }}>{page.question}</div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, alignSelf: 'center', width: '100%' }}>
        {answers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '28px', textAlign: 'center' }}>En attente des réponses…</div>
        ) : answers.map((row, i) => (
          <div key={row.participant_name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderLeft: `3px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}`, borderRadius: 14, padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: `${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}22`, border: `2px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}>{row.participant_name?.charAt(0)?.toUpperCase() || '?'}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length], marginBottom: 4 }}>{row.participant_name}</div>
              <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.5 }}>{row.answer}</div>
            </div>
          </div>
        ))}
      </div>
      {answers.length > 0 && <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>{answers.length} réponse{answers.length > 1 ? 's' : ''}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
        {!revealed ? (
          <button onClick={handleReveal} disabled={answers.length === 0} style={{ background: answers.length > 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', padding: '13px 28px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: answers.length > 0 ? 'pointer' : 'default', fontFamily: 'inherit', opacity: answers.length === 0 ? 0.5 : 1 }}>
            👁 Révéler les réponses sur le diffuseur
          </button>
        ) : (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12, padding: '10px 20px', fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>
            ✓ Réponses affichées sur le diffuseur
          </div>
        )}
        <button onClick={handleNext} style={{ background: 'linear-gradient(135deg, #b91c1c, #f87171)', border: 'none', color: '#fff', padding: '13px 32px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 5px 20px rgba(248,113,113,0.4)' }}>
          Passer aux explications →
        </button>
      </div>
    </div>
  )
}

function Lobby({ onStart, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Retour</button>
      <div style={{ textAlign: 'center', maxWidth: 560, padding: '0 24px' }}>
        <div style={{ fontSize: 56, marginBottom: 24 }}>🔄</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>SAV · Journée 4 · Module 3</div>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Les RAZ — Recommandes</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
          Les 4 vérifications · La saisie · L'appel supervision
        </p>
        <button onClick={onStart} style={{ background: 'linear-gradient(135deg, #b91c1c, #ef4444)', border: 'none', color: '#fff', padding: '16px 48px', borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 8px 32px rgba(239,68,68,0.35)', fontFamily: 'inherit' }}>▶ Commencer</button>
      </div>
    </div>
  )
}

function ContentPage({ page, pageIdx, totalPages, onBack, onNext, onTerminate }) {
  const [notesOpen, setNotesOpen] = useState(true)
  const { color, icon, titre, sousTitre, points, notesFormateur } = page
  const isLast = pageIdx === totalPages - 1

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>SAV · RAZ · {pageIdx + 1}/{totalPages}</span>
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
          <div style={{ marginTop: 20, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Array(totalPages).fill(0).map((_, i) => (
              <div key={i} style={{ height: 4, borderRadius: 2, width: i === pageIdx ? 20 : 6, background: i === pageIdx ? '#f87171' : 'rgba(255,255,255,0.15)', transition: 'all .3s' }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 28px 16px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'flex-end' }}>
        {isLast ? (
          <button onClick={onTerminate} style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✓ Terminer le module
          </button>
        ) : (
          <button onClick={onNext} style={{ background: 'linear-gradient(135deg, #b91c1c, #ef4444)', border: 'none', color: '#fff', padding: '11px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  )
}

export default function ModuleRAZ({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const [page, setPage] = useState(0)
  const sc = () => getActiveSessionCode()

  const handleStart = async () => { await sbUpdate('sessions', { active_module: 'raz', module_page: 0 }, 'code=eq.' + sc()); setStarted(true) }
  const handleNext = async () => { const n = page + 1; await sbUpdate('sessions', { active_module: 'raz', module_page: n }, 'code=eq.' + sc()); setPage(n) }
  const handleBack = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + sc()) } catch { /* best-effort */ }
    onBack()
  }
  const handleTerminate = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + sc()) } catch { /* best-effort */ }
    ;(onTerminate ?? onBack)()
  }

  if (!started) return <Lobby onStart={handleStart} onBack={handleBack} />
  const currentPage = RAZ_PAGES[page]
  const contentPages = RAZ_PAGES.filter(p => p.type === 'sav-content')
  const contentPageIdx = contentPages.findIndex(p => p.id === currentPage.id)
  if (currentPage.type === 'sav-brainstorm') return <BrainstormController page={currentPage} onNext={handleNext} onBack={handleBack} />
  return <ContentPage page={currentPage} pageIdx={contentPageIdx} totalPages={contentPages.length} onBack={handleBack} onNext={handleNext} onTerminate={handleTerminate} />
}
