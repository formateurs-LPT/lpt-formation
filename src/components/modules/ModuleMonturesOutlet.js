'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState, getSharedState } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'montures-outlet'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []
const ACCENT = '#7c3aed'

const PAGE_TYPE_LABELS = {
  'montage-question': { icon: '🙋', label: 'Question ouverte' },
  'outlet-flow':       { icon: '🔀', label: 'Animation' },
  'montage-info':      { icon: '💡', label: 'Explication' },
}

const BUBBLE_COLORS = ['#7c3aed', '#00abe9', '#4ade80', '#f59e0b', '#f472b6', '#34d399']

// ── Vue formateur : question ouverte + révélation sur le diffuseur ──
function OutletQuestionFormateur({ page, revealing, toggleReveal, revealedMap }) {
  const [answers, setAnswers] = useState([])
  const revealKey = `montage_revealed__${page.id}`
  const revealed = !!revealedMap[revealKey]

  useEffect(() => {
    setAnswers([])
    const poll = async () => {
      try {
        const state = await getSharedState()
        const prefix = `oa__${page.id}__`
        const rows = Object.entries(state || {})
          .filter(([k, v]) => k.startsWith(prefix) && v?.answer)
          .map(([k, v]) => ({
            id: k,
            participant_name: v.name || k.slice(prefix.length).replace(/_/g, ' '),
            answer: v.answer,
            ts: v.ts || 0,
          }))
          .sort((a, b) => a.ts - b.ts)
        setAnswers(rows)
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [page.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
        Question ouverte · Réponses en direct
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 20 }}>{page.titre}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
        {answers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '12px 0' }}>
            En attente des réponses des participants…
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

      <div style={{ marginTop: 16, background: `${ACCENT}12`, border: `1px solid ${ACCENT}35`, borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>Réponses sur le diffuseur</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {answers.length} réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''} — masquées tant que vous ne les révélez pas.
          </div>
        </div>
        <button
          onClick={() => toggleReveal(revealKey, revealed)}
          disabled={revealing}
          style={{
            padding: '10px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            cursor: revealing ? 'default' : 'pointer', fontFamily: 'inherit',
            transition: 'all .2s', flexShrink: 0,
            background: revealed ? 'rgba(74,222,128,0.12)' : `${ACCENT}20`,
            border: revealed ? '1px solid rgba(74,222,128,0.35)' : `1px solid ${ACCENT}60`,
            color: revealed ? '#4ade80' : ACCENT,
          }}
        >
          {revealed ? '✓ Affichées — Masquer' : '👁 Afficher sur le diffuseur'}
        </button>
      </div>
    </div>
  )
}

// ── Vue formateur : pages d'explication (blocs statiques) ───────────
function OutletInfoFormateur({ page }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
        Vue formateur
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        {page.icon && <span style={{ fontSize: 26 }}>{page.icon}</span>}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{page.titre}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(page.blocks || []).map((b, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${ACCENT}30`,
            borderLeft: `3px solid ${ACCENT}`, borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{b.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{b.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {page.footer && (
        page.footerStrong ? (
          <div style={{ marginTop: 18, padding: '18px 22px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(245,158,11,0.05))', border: '1.5px solid rgba(245,158,11,0.45)', borderRadius: 14, fontSize: 16, color: '#fff', fontWeight: 800 }}>
            {page.footer}
          </div>
        ) : (
          <div style={{ marginTop: 16, padding: '12px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, fontSize: 13, color: '#f87171', fontWeight: 600, lineHeight: 1.5 }}>
            ⚠️ {page.footer}
          </div>
        )
      )}

      <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
        💬 Ce contenu s&apos;affiche automatiquement sur le diffuseur et le téléphone des formés.
      </div>
    </div>
  )
}

// ── Vue formateur : pages animées (schéma Rodenstock → Centre → Magasin) ──
function OutletFlowFormateur({ page }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
      <div style={{ maxWidth: 560 }}>
        {page.icon && <div style={{ fontSize: 56, marginBottom: 24 }}>{page.icon}</div>}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 14 }}>{page.titre}</h2>
        {page.sousTitre && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 24 }}>{page.sousTitre}</p>}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: `${ACCENT}15`, border: `1px solid ${ACCENT}40`, borderRadius: 30, padding: '10px 22px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT, animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>Animation diffusée en boucle sur le grand écran</span>
        </div>
      </div>
      <style>{`@keyframes waitingPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
    </div>
  )
}

export default function ModuleMonturesOutlet({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [revealing, setRevealing] = useState(false)
  const [revealedMap, setRevealedMap] = useState({})
  const syncedRef = useRef(false)

  const toggleReveal = async (key, currentlyRevealed) => {
    setRevealing(true)
    try {
      const next = !currentlyRevealed
      setRevealedMap(m => ({ ...m, [key]: next }))
      await setSharedState({ [key]: next })
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

  const resetShared = async () => {
    const clear = {}
    for (const p of PAGES) {
      if (p.type === 'montage-question') clear[`montage_revealed__${p.id}`] = false
    }
    // Efface aussi les anciennes réponses (clés oa__<pageId>__<nom>) pour qu'un
    // relancement du module dans la même session ne réaffiche pas les réponses précédentes
    try {
      const state = await getSharedState()
      for (const p of PAGES) {
        if (p.type !== 'montage-question') continue
        const prefix = `oa__${p.id}__`
        for (const k of Object.keys(state || {})) {
          if (k.startsWith(prefix)) clear[k] = null
        }
      }
    } catch { /* best-effort */ }
    return setSharedState(clear)
  }

  useEffect(() => {
    if (!started) return
    resetShared()
    setRevealedMap({})
    syncAndWrite({ active_module: MODULE_ID, module_page: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started])

  // Synchronise chaque changement de page — y compris un retour à la page 0
  // (pageIndex ne change pas au moment du lancement, donc pas de double écriture
  // avec l'effet ci-dessus : celui-ci ne se déclenche que sur une vraie navigation).
  useEffect(() => {
    if (!started) return
    syncAndWrite({ module_page: pageIndex })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex])

  const handleBack = async () => {
    try { await Promise.all([sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()), resetShared()]) } catch { /* best-effort */ }
    onBack()
  }

  const handleTerminate = async () => {
    try { await Promise.all([sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()), resetShared()]) } catch { /* best-effort */ }
    ;(onTerminate ?? onBack)()
  }

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 500, padding: '0 24px', textAlign: 'center' }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
          <div style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}55`, borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Formation · Journée SAV
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Montures Outlet</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
            {PAGES.length} pages · Anticiper les ruptures de stock monture
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleBack} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', padding: '14px 28px', borderRadius: 14,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Retour</button>
            <button onClick={() => setStarted(true)} style={{
              background: `linear-gradient(135deg, #5b21b6, ${ACCENT})`,
              border: 'none', color: '#fff', padding: '14px 40px',
              borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 8px 32px ${ACCENT}55`, fontFamily: 'inherit',
            }}>▶ Lancer le module</button>
          </div>
        </div>
      </div>
    )
  }

  const page = PAGES[pageIndex]
  const isLast = pageIndex === PAGES.length - 1
  const nextPage = PAGES[pageIndex + 1] ?? null

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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Montures Outlet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {PAGES.map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? ACCENT : 'rgba(255,255,255,0.2)',
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
        {page?.type === 'montage-question' ? (
          <OutletQuestionFormateur page={page} revealing={revealing} toggleReveal={toggleReveal} revealedMap={revealedMap} />
        ) : page?.type === 'montage-info' ? (
          <OutletInfoFormateur page={page} />
        ) : page?.type === 'outlet-flow' ? (
          <OutletFlowFormateur page={page} />
        ) : null}
      </div>

      {/* Navigation */}
      <div style={{ padding: '12px 32px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {nextPage && (() => {
          const info = PAGE_TYPE_LABELS[nextPage.type] ?? { icon: '📄', label: nextPage.type }
          return (
            <div style={{
              marginBottom: 12, background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${ACCENT}40`, borderLeft: `3px solid ${ACCENT}`,
              borderRadius: 10, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{nextPage.icon || info.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextPage.titre}</div>
                <div style={{ fontSize: 10, color: ACCENT, marginTop: 1 }}>{info.label}</div>
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>suivant →</div>
            </div>
          )
        })()}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
              background: `linear-gradient(135deg, #5b21b6, ${ACCENT})`,
              border: 'none', color: '#fff', padding: '12px 32px',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 4px 16px ${ACCENT}55`,
            }}>Terminer le module ✓</button>
          ) : (
            <button onClick={() => setPageIndex(i => Math.min(PAGES.length - 1, i + 1))} style={{
              background: `linear-gradient(135deg, #5b21b6, ${ACCENT})`,
              border: 'none', color: '#fff', padding: '12px 32px',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 4px 16px ${ACCENT}55`,
            }}>Suivant →</button>
          )}
        </div>
      </div>
    </div>
  )
}
