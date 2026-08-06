'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState, getSharedState } from '@/lib/supabase'
import { MODULE_DATA, MONTAGE_TRAITEMENTS } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'montage'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

const PAGE_TYPE_LABELS = {
  'montage-question': { icon: '🙋', label: 'Question ouverte' },
  'montage-info':      { icon: '💡', label: 'Explication' },
  'montage-upgrade':   { icon: '⬆️', label: 'Animation upgrade' },
  'pause':             { icon: '📢', label: 'Message' },
}

const BUBBLE_COLORS = ['#f59e0b', '#00abe9', '#4ade80', '#a78bfa', '#f472b6', '#34d399']

// ── Vue formateur : question ouverte + révélation sur le diffuseur ──
function MontageQuestionFormateur({ page, revealing, toggleReveal, revealedMap }) {
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
      <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
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

      <div style={{ marginTop: 16, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>Réponses sur le diffuseur</div>
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
            background: revealed ? 'rgba(74,222,128,0.12)' : 'rgba(245,158,11,0.15)',
            border: revealed ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(245,158,11,0.45)',
            color: revealed ? '#4ade80' : '#f59e0b',
          }}
        >
          {revealed ? '✓ Affichées — Masquer' : '👁 Afficher sur le diffuseur'}
        </button>
      </div>
    </div>
  )
}

// ── Vue formateur : pages d'explication (blocs statiques) ───────────
function MontageInfoFormateur({ page }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
        Vue formateur
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        {page.icon && <span style={{ fontSize: 26 }}>{page.icon}</span>}
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{page.titre}</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {(page.blocks || []).map((b, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.18)',
            borderLeft: '3px solid #f59e0b', borderRadius: 12, padding: '14px 18px',
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
          <div style={{ marginTop: 16, padding: '12px 18px', background: 'rgba(0,137,186,0.07)', border: '1px solid rgba(0,137,186,0.2)', borderRadius: 12, fontSize: 13, color: '#00abe9', fontWeight: 600, lineHeight: 1.5 }}>
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

// ── Vue formateur : animation upgrade (gamme de traitements) ────────
function MontageUpgradeFormateur({ orderedIdx, currentIdx, status, foundIdx, onPick, onHave, onMiss, onReset }) {
  if (status === 'picking' || orderedIdx == null) {
    return (
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
          Étape 1 · Que la client a-t-il commandé ?
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 20 }}>L&apos;upgrade, qu&apos;est-ce que c&apos;est ?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {MONTAGE_TRAITEMENTS.map((t, i) => (
            <button key={t.id} onClick={() => onPick(i)} style={{
              textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 12, padding: '14px 18px', fontSize: 15, fontWeight: 700, color: '#fff',
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.12)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)' }}
            >{t.label}</button>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'found' && foundIdx != null) {
    const t = MONTAGE_TRAITEMENTS[foundIdx]
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 16 }}>
        <div style={{ fontSize: 48 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#4ade80', margin: 0 }}>{t?.label}</h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 420 }}>
          Ce client aura {t?.label} en 10 minutes, promesse tenue ! C&apos;est affiché sur le diffuseur.
        </p>
        <button onClick={onReset} style={{
          marginTop: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.6)', padding: '10px 22px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>🔄 Recommencer avec un autre exemple</button>
      </div>
    )
  }

  const current = currentIdx != null ? MONTAGE_TRAITEMENTS[currentIdx] : null
  const isLastTier = currentIdx === MONTAGE_TRAITEMENTS.length - 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>
        Étape 2 · Vous cherchez ce traitement en stock
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{current?.label}</h2>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>
        Commandé par le client : {MONTAGE_TRAITEMENTS[orderedIdx]?.label}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onHave} style={{
          flex: 1, background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none',
          color: '#fff', padding: '18px 0', borderRadius: 14, fontSize: 16, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.35)',
        }}>✅ Je l&apos;ai</button>
        <button onClick={onMiss} disabled={isLastTier} style={{
          flex: 1, background: isLastTier ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #b91c1c, #ef4444)',
          border: isLastTier ? '1px solid rgba(255,255,255,0.1)' : 'none',
          color: isLastTier ? 'rgba(255,255,255,0.25)' : '#fff', padding: '18px 0', borderRadius: 14,
          fontSize: 16, fontWeight: 700, cursor: isLastTier ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
          boxShadow: isLastTier ? 'none' : '0 6px 24px rgba(239,68,68,0.35)',
        }}>❌ Je l&apos;ai pas</button>
      </div>
      {isLastTier && (
        <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          Dernier niveau de la gamme — toujours disponible.
        </div>
      )}
      <button onClick={onReset} style={{
        marginTop: 16, alignSelf: 'flex-start',
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
        fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
      }}>Recommencer</button>
    </div>
  )
}

// ── Vue formateur : messages statiques (type 'pause') ───────────────
function MontagePauseFormateur({ page }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
      <div style={{ maxWidth: 560 }}>
        {page.icon && <div style={{ fontSize: 56, marginBottom: 24 }}>{page.icon}</div>}
        <h2 style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.35, marginBottom: 14 }}>{page.titre}</h2>
        {page.sousTitre && <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{page.sousTitre}</p>}
      </div>
    </div>
  )
}

export default function ModuleMontage({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [revealing, setRevealing] = useState(false)
  const [revealedMap, setRevealedMap] = useState({})
  const [upOrdered, setUpOrdered] = useState(null)
  const [upCurrent, setUpCurrent] = useState(null)
  const [upStatus, setUpStatus]   = useState('picking')
  const [upFound, setUpFound]     = useState(null)
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

  const handleUpPick = async (idx) => {
    setUpOrdered(idx); setUpCurrent(idx); setUpStatus('searching'); setUpFound(null)
    await setSharedState({ montage_up_ordered: idx, montage_up_current: idx, montage_up_status: 'searching', montage_up_found_idx: null })
  }

  const handleUpHave = async () => {
    setUpStatus('found'); setUpFound(upCurrent)
    await setSharedState({ montage_up_status: 'found', montage_up_found_idx: upCurrent })
  }

  const handleUpMiss = async () => {
    if (upCurrent == null || upCurrent >= MONTAGE_TRAITEMENTS.length - 1) return
    const next = upCurrent + 1
    setUpCurrent(next)
    await setSharedState({ montage_up_current: next })
  }

  const handleUpReset = async () => {
    setUpOrdered(null); setUpCurrent(null); setUpStatus('picking'); setUpFound(null)
    await setSharedState({ montage_up_ordered: null, montage_up_current: null, montage_up_status: 'picking', montage_up_found_idx: null })
  }

  const syncAndWrite = async (data) => {
    if (!syncedRef.current) {
      await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName)
      syncedRef.current = true
    }
    sbUpdate('sessions', data, 'code=eq.' + getActiveSessionCode())
  }

  const resetShared = () => {
    const clear = { montage_up_ordered: null, montage_up_current: null, montage_up_status: 'picking', montage_up_found_idx: null }
    for (const p of PAGES) {
      if (p.type === 'montage-question') clear[`montage_revealed__${p.id}`] = false
    }
    return setSharedState(clear)
  }

  useEffect(() => {
    if (!started) return
    resetShared()
    setRevealedMap({})
    setUpOrdered(null); setUpCurrent(null); setUpStatus('picking'); setUpFound(null)
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
          <div style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Formation · Journée SAV
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Le montage</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
            {PAGES.length} pages · Des lunettes en 10 minutes
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleBack} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', padding: '14px 28px', borderRadius: 14,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Retour</button>
            <button onClick={() => setStarted(true)} style={{
              background: 'linear-gradient(135deg, #c9820a, #f59e0b)',
              border: 'none', color: '#fff', padding: '14px 40px',
              borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(245,158,11,0.35)', fontFamily: 'inherit',
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Le montage</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {PAGES.map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? '#f59e0b' : 'rgba(255,255,255,0.2)',
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
          <MontageQuestionFormateur page={page} revealing={revealing} toggleReveal={toggleReveal} revealedMap={revealedMap} />
        ) : page?.type === 'montage-info' ? (
          <MontageInfoFormateur page={page} />
        ) : page?.type === 'montage-upgrade' ? (
          <MontageUpgradeFormateur
            orderedIdx={upOrdered} currentIdx={upCurrent} status={upStatus} foundIdx={upFound}
            onPick={handleUpPick} onHave={handleUpHave} onMiss={handleUpMiss} onReset={handleUpReset}
          />
        ) : (
          <MontagePauseFormateur page={page} />
        )}
      </div>

      {/* Navigation */}
      <div style={{ padding: '12px 32px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
        {nextPage && (() => {
          const info = PAGE_TYPE_LABELS[nextPage.type] ?? { icon: '📄', label: nextPage.type }
          return (
            <div style={{
              marginBottom: 12, background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(245,158,11,0.25)', borderLeft: '3px solid #f59e0b',
              borderRadius: 10, padding: '8px 14px',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{nextPage.icon || info.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nextPage.titre}</div>
                <div style={{ fontSize: 10, color: '#f59e0b', marginTop: 1 }}>{info.label}</div>
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
              background: 'linear-gradient(135deg, #c9820a, #f59e0b)',
              border: 'none', color: '#fff', padding: '12px 32px',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
            }}>Terminer le module ✓</button>
          ) : (
            <button onClick={() => setPageIndex(i => Math.min(PAGES.length - 1, i + 1))} style={{
              background: 'linear-gradient(135deg, #c9820a, #f59e0b)',
              border: 'none', color: '#fff', padding: '12px 32px',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
            }}>Suivant →</button>
          )}
        </div>
      </div>
    </div>
  )
}
