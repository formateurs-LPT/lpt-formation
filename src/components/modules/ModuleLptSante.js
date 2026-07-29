'use client'
import { useState, useEffect, useRef } from 'react'
import { sbUpdate, getActiveSessionCode, setSharedState, getSharedState } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'

const MODULE_ID = 'lpt-sante'
const PAGES = MODULE_DATA[MODULE_ID]?.pages || []

const BUBBLE_COLORS = ['#00abe9', '#4ade80', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']

function PageIntroFormateur({ page }) {
  const [answers, setAnswers] = useState([])

  useEffect(() => {
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
      {/* Header avec logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={56} height={56} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 1.5 }}>LPT Santé · Question ouverte</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>{page.titre}</h2>
        </div>
      </div>

      {/* Réponses */}
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

      {answers.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          {answers.length} réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}

function PagePecFormateur() {
  const [activeScenario, setActiveScenario] = useState(null)
  const [loading, setLoading] = useState(false)

  const scenarios = [
    {
      id: 'test', label: 'Test Suprême', color: '#00abe9', emoji: '🔍',
      steps: [
        "Charger l'AMO (Sécurité Sociale) dans LPT Santé",
        "Charger l'AMC (Mutuelle) dans LPT Santé",
        "Ajouter l'ordonnance du client",
        'Générer le devis — LPT Santé calcule la PEC',
        'Envoyer → réponse immédiate ✅ Accepté ou ❌ Refusé',
      ],
    },
    {
      id: 'fact', label: 'Facturation', color: '#4db85c', emoji: '🧾',
      sub: '1=1 ou Suprême',
      steps: [
        'Charger AMO + AMC client',
        'Aller dans la section Facturation',
        'Saisir le n° de commande (visible sur le téléphone de vente)',
        'LPT Santé envoie la PEC automatiquement',
        'Valider un paiement tiers payant sur le téléphone de vente',
      ],
    },
    {
      id: 'partial', label: 'TP Partiel', color: '#f59e0b', emoji: '⚡',
      sub: 'Sans AMC',
      steps: [
        "Charger l'AMO uniquement (pas d'AMC)",
        'Saisir le n° de commande',
        'LPT Santé envoie à la Sécurité Sociale uniquement',
        'Faire avancer la part AMC au client (CB ou espèces)',
        'Valider la commande sur le téléphone de vente',
      ],
    },
  ]

  useEffect(() => {
    const poll = async () => {
      try {
        const state = await getSharedState()
        setActiveScenario(state?.lpts_pec_scenario ?? null)
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [])

  const select = async (id) => {
    setLoading(true)
    try {
      await setSharedState({ lpts_pec_scenario: id })
      setActiveScenario(id)
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={48} height={48} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 1.5 }}>LPT Santé · Manipulation</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>La prise en charge — choisir le scénario</h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, flex: 1, overflowY: 'auto' }}>
        {scenarios.map((sc) => {
          const isActive = activeScenario === sc.id
          return (
            <button key={sc.id} onClick={() => select(sc.id)} disabled={loading} style={{
              background: isActive ? `${sc.color}12` : 'rgba(255,255,255,0.03)',
              border: `2px solid ${isActive ? sc.color : sc.color + '30'}`,
              borderTop: `4px solid ${sc.color}`,
              borderRadius: 12, padding: '16px', cursor: loading ? 'wait' : 'pointer',
              textAlign: 'left', transition: 'all 0.25s',
              transform: isActive ? 'scale(1.02)' : 'scale(1)',
              boxShadow: isActive ? `0 0 28px ${sc.color}25` : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: sc.color }}>{sc.emoji} {sc.label}</div>
                {isActive && (
                  <div style={{
                    fontSize: 10, fontWeight: 800, color: sc.color,
                    background: `${sc.color}18`, border: `1px solid ${sc.color}55`,
                    borderRadius: 8, padding: '2px 8px', letterSpacing: 0.5,
                  }}>● EN COURS</div>
                )}
              </div>
              {sc.sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 10, fontStyle: 'italic' }}>{sc.sub}</div>}
              <ol style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sc.steps.map((st, j) => (
                  <li key={j} style={{ fontSize: 11, color: isActive ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{st}</li>
                ))}
              </ol>
            </button>
          )
        })}
      </div>
      <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
        Cliquer sur un scénario pour lancer l&apos;animation sur le diffuseur
      </div>
    </div>
  )
}

function PageExplicationFormateur() {
  const points = [
    { icon: '⚡', title: '5 min vs 30 min', desc: 'LPT Santé traite une PEC en 5 minutes là où la concurrence en prend 30+.' },
    { icon: '🏪', title: 'Des dizaines de PEC/jour par magasin', desc: 'Chaque vendeur crée des prises en charge tout au long de la journée, toutes centralisées par LPT Santé.' },
    { icon: '📡', title: 'Télétransmission chaque soir', desc: 'Chaque soir, LPT Santé envoie automatiquement toutes les PEC à la Sécurité Sociale et aux mutuelles.' },
    { icon: '💰', title: 'Remboursement rapide', desc: 'SS et mutuelles remboursent Lunettes Pour Tous directement — le client repart avec ses lunettes sans avancer d\'argent.' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={56} height={56} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 1.5 }}>LPT Santé · Fonctionnement</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.3, margin: 0 }}>Comment ça marche ?</h2>
        </div>
      </div>

      <div style={{ background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)', borderRadius: 14, padding: '12px 18px', marginBottom: 24, fontSize: 13, color: '#00abe9', fontWeight: 600 }}>
        📺 L'animation sur le diffuseur illustre le cycle complet — laissez-la tourner pendant vos explications
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1 }}>
        {points.map((p, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(77,184,92,0.15)',
            borderLeft: '3px solid #4db85c', borderRadius: 12, padding: '14px 18px',
            display: 'flex', alignItems: 'flex-start', gap: 14,
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{p.icon}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{p.title}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ModuleLptSante({ pName, onBack }) {
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
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()) } catch { /* best-effort */ }
    onBack()
  }

  const handleTerminate = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()) } catch { /* best-effort */ }
    ;(onTerminate ?? onBack)()
  }

  if (!started) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 500, padding: '0 24px', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={96} height={96} style={{ objectFit: 'contain', marginBottom: 28 }} />
          <div style={{ background: 'rgba(77,184,92,0.15)', border: '1px solid rgba(77,184,92,0.3)', borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
            Formation · France · Journée 3
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10 }}>LPT Santé</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
            {PAGES.length} page{PAGES.length > 1 ? 's' : ''} · Tiers payant · Remboursements
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={handleBack} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.6)', padding: '14px 28px', borderRadius: 14,
              fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>← Retour</button>
            <button onClick={() => setStarted(true)} style={{
              background: 'linear-gradient(135deg, #2d7a3a, #4db85c)',
              border: 'none', color: '#fff', padding: '14px 40px',
              borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(77,184,92,0.35)', fontFamily: 'inherit',
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={32} height={32} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>LPT Santé</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {PAGES.map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? '#4db85c' : 'rgba(255,255,255,0.2)',
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

      {/* Contenu */}
      <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
        {page?.type === 'lpt-sante-intro'        && <PageIntroFormateur page={page} />}
        {page?.type === 'lpt-sante-explication' && <PageExplicationFormateur />}
        {page?.type === 'lpt-sante-pec'         && <PagePecFormateur />}
      </div>

      {/* Navigation */}
      <div style={{ padding: '12px 32px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
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
              background: 'linear-gradient(135deg, #2d7a3a, #4db85c)',
              border: 'none', color: '#fff', padding: '12px 32px',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(77,184,92,0.35)',
            }}>Terminer le module ✓</button>
          ) : (
            <button onClick={() => setPageIndex(i => Math.min(PAGES.length - 1, i + 1))} style={{
              background: 'linear-gradient(135deg, #2d7a3a, #4db85c)',
              border: 'none', color: '#fff', padding: '12px 32px',
              borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(77,184,92,0.35)',
            }}>Suivant →</button>
          )}
        </div>
      </div>
    </div>
  )
}
