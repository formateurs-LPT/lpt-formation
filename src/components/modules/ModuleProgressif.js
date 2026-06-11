'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbUpdate, SESSION_CODE, getSharedState, setSharedState } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { PROGRESSIF_PAGES, PROGRESSIF_QUIZ } from '@/lib/modulesData'
const ACCENT = '#7c3aed'
const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── Keyframes ─────────────────────────────────────────────────────
const STYLES = `
  @keyframes progFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-14px) scale(1.03); }
  }
  @keyframes progHalo {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.12); }
  }
  @keyframes progPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(124,58,237,0.4); }
    50% { box-shadow: 0 4px 36px rgba(124,58,237,0.9); }
  }
  @keyframes progParticle {
    from { transform: translateY(0px); opacity: 0.2; }
    to   { transform: translateY(-12px); opacity: 0.5; }
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes zoneGlow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); }
    50% { box-shadow: 0 0 20px 4px rgba(124,58,237,0.4); }
  }
`

// ── Schéma verre progressif — image PNG avec zones overlay ───────
const PROG_ZONES = [
  { key: 'haut',   label: 'LOIN',      color: '#a78bfa', top: '20%' },
  { key: 'milieu', label: 'INTERMÉD.', color: '#4ade80', top: '52%' },
  { key: 'bas',    label: 'PRÈS',      color: '#fbbf24', top: '80%' },
]

function VerreProgressifSchema({ highlight, small }) {
  const w = small ? 150 : 220
  return (
    <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/verre-prog.png"
        alt="Verre progressif"
        style={{ width: w, height: 'auto', display: 'block' }}
      />
      {/* Badges de zone latéraux */}
      {PROG_ZONES.map(z => (
        <div key={z.key} style={{
          position: 'absolute',
          right: small ? -52 : -68,
          top: z.top,
          transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', gap: 5,
          opacity: highlight === null || highlight === undefined ? 0.35 : highlight === z.key ? 1 : 0.12,
          transition: 'opacity 0.4s ease',
          pointerEvents: 'none',
        }}>
          <div style={{ width: small ? 14 : 20, height: 1, background: z.color, opacity: 0.8 }} />
          <div style={{
            background: highlight === z.key ? `${z.color}22` : 'transparent',
            border: `1px solid ${z.color}${highlight === z.key ? '75' : '38'}`,
            borderRadius: 8, padding: small ? '2px 6px' : '2px 8px',
            fontSize: small ? 8 : 9, fontWeight: 800, color: z.color,
            letterSpacing: 0.8, whiteSpace: 'nowrap',
          }}>{z.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Avatar bulle ────────────────────────────────────────────────
function AvatarBubble({ script, trainerAvatar, pName }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 700)
    return () => clearTimeout(t)
  }, [script])
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Formateur'
  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
      padding: '0 28px 28px 0',
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: 'all .5s ease', pointerEvents: 'none',
    }}>
      <div style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderRadius: '18px 18px 4px 18px', padding: '14px 18px', maxWidth: 280, boxShadow: '0 12px 48px rgba(0,0,0,0.25)', fontSize: 13, color: '#0f172a', lineHeight: 1.6, fontWeight: 500, marginBottom: 12 }}>
        {script}
      </div>
      <div style={{ background: 'rgba(10,42,92,0.75)', backdropFilter: 'blur(20px)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '12px 18px 12px 12px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <div style={{ width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0, border: `2.5px solid ${ACCENT}`, boxShadow: `0 0 0 4px rgba(124,58,237,0.2)`, animation: 'progPulse 2.5s ease-in-out infinite' }}>
          <Image src={trainerAvatar} alt={cap(pName)} width={80} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{cap(pName)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Formateur · LPT</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '3px 10px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, animation: 'progHalo 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: .5 }}>EN DIRECT</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shell commun pour les pages formateur ──────────────────────────
function PageShell({ children, pageIndex, total, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #12013a 55%, #0d0a3a 100%)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Particules */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', width: 3, height: 3, borderRadius: '50%', background: ACCENT, opacity: 0.2 + (i % 3) * 0.08, left: `${5 + i * 9}%`, top: `${20 + (i % 4) * 20}%`, animation: `progParticle ${3 + i * 0.5}s ease-in-out ${i * 0.25}s infinite alternate` }} />
        ))}
      </div>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', position: 'relative', zIndex: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · Le Verre Progressif</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? ACCENT : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s', letterSpacing: .3 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Quitter</button>
        </div>
      </div>
      {children}
    </div>
  )
}

// ── Page cours (4 points + verre schéma) ──────────────────────────
function CoursPage({ page, trainerAvatar, pName, onPrev, onNext, onBack, isFirst, isLast, pageIndex, total, quizLaunched, onLaunchQuiz }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => { setEntered(false); const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t) }, [page.id])
  return (
    <PageShell pageIndex={pageIndex} total={total} onBack={onBack}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, padding: '16px 48px 24px', alignItems: 'center', position: 'relative', zIndex: 5 }}>
        <div style={{ opacity: entered ? 1 : 0, transform: entered ? 'translateX(0)' : 'translateX(-28px)', transition: 'all .55s ease' }}>
          <div style={{ display: 'inline-block', background: `${ACCENT}20`, border: `1px solid ${ACCENT}45`, borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>Formation J+14 · LPT</div>
          <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>{page.titre}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontWeight: 400 }}>{page.sousTitre}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {page.points.map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', opacity: entered ? 1 : 0, transform: entered ? 'translateX(0)' : 'translateX(-16px)', transition: `all .45s ease ${0.08 + i * 0.09}s` }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{pt.emoji}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.texte}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: entered ? 1 : 0, transform: entered ? 'scale(1)' : 'scale(0.88)', transition: 'all .65s ease .1s' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: 440, height: 440, borderRadius: '50%', background: `radial-gradient(circle, ${ACCENT}28 0%, transparent 70%)`, animation: 'progHalo 3.5s ease-in-out infinite' }} />
            <div style={{ animation: 'progFloat 4.5s ease-in-out infinite', filter: 'drop-shadow(0 0 28px rgba(124,58,237,0.45))' }}>
              <VerreProgressifSchema />
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 340px 28px 48px', position: 'relative', zIndex: 20, flexShrink: 0 }}>
        <button onClick={onPrev} disabled={isFirst} style={{ background: isFirst ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit' }}>← Précédent</button>
        {isLast ? (
          quizLaunched
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>✓ Quiz envoyé</span><button onClick={onBack} style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)', color: '#ff6b6b', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Terminer →</button></div>
            : <button onClick={onLaunchQuiz} style={{ background: `linear-gradient(135deg, ${ACCENT}, #9f67fa)`, border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px ${ACCENT}50`, fontFamily: 'inherit' }}>🏆 Lancer le quiz final →</button>
        ) : (
          <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${ACCENT}, #9f67fa)`, border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px ${ACCENT}50`, fontFamily: 'inherit' }}>Suivant →</button>
        )}
      </div>
      <AvatarBubble script={page.avatarScript} trainerAvatar={trainerAvatar} pName={pName} />
    </PageShell>
  )
}

// ── Page Zone Interactif (formateur) ─────────────────────────────
function ZoneInteractifPage({ page, trainerAvatar, pName, onPrev, onNext, onBack, isFirst, pageIndex, total }) {
  const [activeQ, setActiveQ] = useState(null) // null | 0 | 1 | 2
  const [responses, setResponses] = useState({})
  const [showCorrect, setShowCorrect] = useState(false)

  // Sync activeQ to trainer_state
  const launchQuestion = async (idx) => {
    setActiveQ(idx)
    setResponses({})
    setShowCorrect(false)
    await setSharedState({ prog_zone_q: idx, prog_zone_responses: {} })
  }

  const revealAnswer = async () => {
    setShowCorrect(true)
    await setSharedState({ prog_zone_show_correct: true })
  }

  const clearQuestion = async () => {
    setActiveQ(null)
    setResponses({})
    setShowCorrect(false)
    await setSharedState({ prog_zone_q: null, prog_zone_responses: {}, prog_zone_show_correct: false })
  }

  // Poll responses
  useEffect(() => {
    if (activeQ === null) return
    const poll = async () => {
      try {
        const state = await getSharedState()
        setResponses(state?.prog_zone_responses || {})
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1200)
    return () => clearInterval(t)
  }, [activeQ])

  const q = activeQ !== null ? page.zoneQuestions[activeQ] : null
  const entries = Object.entries(responses)
  const counts = q ? q.options.map((_, i) => entries.filter(([, v]) => v === i).length) : []
  const total_resp = entries.length

  const zoneHighlight = activeQ === 0 ? 'haut' : activeQ === 1 ? 'bas' : activeQ === 2 ? null : null

  return (
    <PageShell pageIndex={pageIndex} total={total} onBack={onBack}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '20px 48px 24px', alignItems: 'start', position: 'relative', zIndex: 5 }}>
        {/* Gauche: verre + boutons de questions */}
        <div>
          <div style={{ display: 'inline-block', background: `${ACCENT}20`, border: `1px solid ${ACCENT}45`, borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Exercice interactif</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{page.titre}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 24 }}>{page.sousTitre}</p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
            <div style={{ filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.4))' }}>
              <VerreProgressifSchema highlight={zoneHighlight} />
            </div>
          </div>

          {/* Boutons lancer questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {page.zoneQuestions.map((zq, i) => (
              <button key={i} onClick={() => launchQuestion(i)} style={{
                background: activeQ === i ? `${ACCENT}25` : 'rgba(255,255,255,0.06)',
                border: `1px solid ${activeQ === i ? `${ACCENT}70` : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 12, padding: '12px 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', fontFamily: 'inherit', color: '#fff', transition: 'all .2s',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'left' }}>Q{i + 1} — {zq.question}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, background: `${ACCENT}20`, padding: '2px 10px', borderRadius: 20, flexShrink: 0, marginLeft: 12 }}>
                  {activeQ === i ? `${total_resp} réponse${total_resp !== 1 ? 's' : ''}` : 'Lancer'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Droite: résultats live */}
        <div>
          {activeQ !== null && q ? (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 18, padding: '24px 24px' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 20, lineHeight: 1.3 }}>{q.question}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {q.options.map((opt, i) => {
                  const cnt = counts[i]
                  const pct = total_resp > 0 ? (cnt / total_resp) * 100 : 0
                  const isCorrect = i === q.correct
                  return (
                    <div key={i} style={{ background: showCorrect && isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${showCorrect && isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: OPTION_COLORS[i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{'ABC'[i]}</div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{opt}</span>
                          {showCorrect && isCorrect && <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 20 }}>✓ Correct</span>}
                        </div>
                        <span style={{ fontSize: 18, fontWeight: 800, color: showCorrect && isCorrect ? '#4ade80' : '#fff' }}>{cnt}</span>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: showCorrect && isCorrect ? '#4ade80' : OPTION_COLORS[i], transition: 'width .5s ease' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {!showCorrect
                  ? <button onClick={revealAnswer} style={{ flex: 1, background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#4ade80', padding: '10px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>Révéler la réponse</button>
                  : <div style={{ flex: 1, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#4ade80' }}>✓ Réponse révélée</div>
                }
                <button onClick={clearQuestion} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', padding: '10px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}>Effacer</button>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Lance une question<br />pour voir les résultats live</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 48px 28px', position: 'relative', zIndex: 20 }}>
        <button onClick={onPrev} disabled={isFirst} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit' }}>← Précédent</button>
        <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${ACCENT}, #9f67fa)`, border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px ${ACCENT}50`, fontFamily: 'inherit' }}>Suivant →</button>
      </div>
    </PageShell>
  )
}

// ── Page Retour Terrain (formateur) ──────────────────────────────
function RetourTerrainPage({ page, trainerAvatar, pName, onPrev, onNext, onBack, isFirst, pageIndex, total }) {
  const [responses, setResponses] = useState({})

  useEffect(() => {
    const poll = async () => {
      try {
        const state = await getSharedState()
        setResponses(state?.prog_retour_responses || {})
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [])

  const clearResponses = async () => {
    await setSharedState({ prog_retour_responses: {} })
    setResponses({})
  }

  const entries = Object.entries(responses)

  return (
    <PageShell pageIndex={pageIndex} total={total} onBack={onBack}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '20px 48px 24px', alignItems: 'start', position: 'relative', zIndex: 5 }}>
        {/* Gauche: instructions */}
        <div>
          <div style={{ display: 'inline-block', background: `${ACCENT}20`, border: `1px solid ${ACCENT}45`, borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Question libre · Retour J+14</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{page.titre}</h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 32 }}>{page.sousTitre}</p>

          <div style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}35`, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Question envoyée aux participants</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>"{page.question}"</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: entries.length > 0 ? '#4ade80' : 'rgba(255,255,255,0.3)', animation: entries.length > 0 ? 'progHalo 1.5s ease-in-out infinite' : 'none' }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{entries.length}</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>réponse{entries.length !== 1 ? 's' : ''}</span>
            </div>
            {entries.length > 0 && (
              <button onClick={clearResponses} style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', color: '#ff6b6b', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Effacer</button>
            )}
          </div>
        </div>

        {/* Droite: réponses */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {entries.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, opacity: 0.4 }}>
              <div style={{ textAlign: 'center', fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>En attente des réponses…</div>
            </div>
          ) : entries.map(([name, resp]) => (
            <div key={name} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `3px solid ${ACCENT}`, borderRadius: 12, padding: '14px 16px', animation: 'fadeSlideIn 0.3s ease' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{resp.text || resp}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 48px 28px', position: 'relative', zIndex: 20 }}>
        <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Précédent</button>
        <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${ACCENT}, #9f67fa)`, border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px ${ACCENT}50`, fontFamily: 'inherit' }}>Suivant →</button>
      </div>
      <AvatarBubble script={page.avatarScript || "Partagez ce que vous avez vécu en magasin. Chaque expérience est précieuse pour le groupe."} trainerAvatar={trainerAvatar} pName={pName} />
    </PageShell>
  )
}

// ── Page Jeu d'objections (formateur) ────────────────────────────
function JeuObjectionsPage({ page, trainerAvatar, pName, onPrev, onNext, onBack, isFirst, isLast, pageIndex, total, quizLaunched, onLaunchQuiz }) {
  const [activeObj, setActiveObj] = useState(null) // null | 0-4
  const [responses, setResponses] = useState({})
  const [bestAnswer, setBestAnswer] = useState(null)

  const launchObjection = async (idx) => {
    setActiveObj(idx)
    setResponses({})
    setBestAnswer(null)
    await setSharedState({ prog_objection_idx: idx, prog_objection_responses: {}, prog_best_answer: null })
  }

  const highlightBest = async (name) => {
    setBestAnswer(name)
    await setSharedState({ prog_best_answer: name })
  }

  const clearObjection = async () => {
    setActiveObj(null)
    setResponses({})
    setBestAnswer(null)
    await setSharedState({ prog_objection_idx: null, prog_objection_responses: {}, prog_best_answer: null })
  }

  useEffect(() => {
    if (activeObj === null) return
    const poll = async () => {
      try {
        const state = await getSharedState()
        setResponses(state?.prog_objection_responses || {})
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [activeObj])

  const entries = Object.entries(responses)

  return (
    <PageShell pageIndex={pageIndex} total={total} onBack={onBack}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 6fr', gap: 28, padding: '20px 48px 24px', alignItems: 'start', position: 'relative', zIndex: 5 }}>
        {/* Gauche: liste objections */}
        <div>
          <div style={{ display: 'inline-block', background: `${ACCENT}20`, border: `1px solid ${ACCENT}45`, borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Jeu de rôle</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>{page.sousTitre}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {page.objections.map((obj, i) => (
              <button key={i} onClick={() => launchObjection(i)} style={{
                background: activeObj === i ? `${ACCENT}20` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeObj === i ? `${ACCENT}60` : 'rgba(255,255,255,0.1)'}`,
                borderLeft: `3px solid ${activeObj === i ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 12, padding: '12px 16px',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .2s',
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: activeObj === i ? ACCENT : 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>Objection {i + 1}</div>
                <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.4 }}>"{obj}"</div>
              </button>
            ))}
          </div>
        </div>

        {/* Droite: réponses live */}
        <div>
          {activeObj !== null ? (
            <>
              <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '16px 20px', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Client dit :</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>"{page.objections[activeObj]}"</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>{entries.length} réponse{entries.length !== 1 ? 's' : ''}</div>
                <button onClick={clearObjection} style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', color: '#ff6b6b', padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Changer</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 'calc(100vh - 420px)', overflowY: 'auto' }}>
                {entries.length === 0
                  ? <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>En attente des réponses…</div>
                  : entries.map(([name, resp]) => (
                    <div key={name} onClick={() => highlightBest(name)} style={{
                      background: bestAnswer === name ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${bestAnswer === name ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                      borderLeft: `3px solid ${bestAnswer === name ? '#4ade80' : ACCENT}`,
                      borderRadius: 12, padding: '12px 16px', cursor: 'pointer', transition: 'all .2s',
                      animation: 'fadeSlideIn 0.3s ease',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: bestAnswer === name ? '#4ade80' : ACCENT, textTransform: 'uppercase', letterSpacing: 0.5 }}>{name}</span>
                        {bestAnswer === name && <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,0.15)', padding: '2px 8px', borderRadius: 20 }}>⭐ Meilleure réponse</span>}
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.4 }}>{resp.text || resp}</div>
                    </div>
                  ))
                }
              </div>
            </>
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👈</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Choisissez une objection<br />pour lancer le jeu</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 48px 28px', position: 'relative', zIndex: 20 }}>
        <button onClick={onPrev} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Précédent</button>
        {isLast
          ? quizLaunched
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>✓ Quiz envoyé</span><button onClick={onBack} style={{ background: 'rgba(255,80,80,0.15)', border: '1px solid rgba(255,80,80,0.35)', color: '#ff6b6b', padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Terminer →</button></div>
            : <button onClick={onLaunchQuiz} style={{ background: `linear-gradient(135deg, ${ACCENT}, #9f67fa)`, border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px ${ACCENT}50`, fontFamily: 'inherit' }}>🏆 Lancer le quiz final →</button>
          : <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${ACCENT}, #9f67fa)`, border: 'none', color: '#fff', padding: '12px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px ${ACCENT}50`, fontFamily: 'inherit' }}>Suivant →</button>
        }
      </div>
    </PageShell>
  )
}

// ── Quiz Controller ───────────────────────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [liveAnswers, setLiveAnswers] = useState([])
  const q = PROGRESSIF_QUIZ[quizQ]
  const isLast = quizQ >= PROGRESSIF_QUIZ.length - 1

  useEffect(() => {
    const poll = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${SESSION_CODE}&module_id=eq.verre-progressif&question_idx=eq.${quizQ}`
      )
      setLiveAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [quizQ])

  const total = liveAnswers.length
  const counts = q.options.map((_, i) => liveAnswers.filter(r => r.answer_idx === i).length)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #12013a 55%, #0d0a3a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz final · Le Verre Progressif</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ display: 'inline-block', background: `rgba(124,58,237,0.2)`, border: `1px solid rgba(124,58,237,0.4)`, borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {PROGRESSIF_QUIZ.length}
        </div>
      </div>

      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 36, lineHeight: 1.3, maxWidth: 800, alignSelf: 'center' }}>{q.question}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, maxWidth: 720, alignSelf: 'center', width: '100%' }}>
        {q.options.map((opt, i) => {
          const count = counts[i]
          const isCorrect = i === q.correct
          const pct = total > 0 ? (count / total) * 100 : 0
          return (
            <div key={i} style={{ background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 16, padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: OPTION_COLORS[i % 4], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{'ABCD'[i]}</div>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{opt}</span>
                  {isCorrect && <span style={{ fontSize: 11, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 10px', borderRadius: 20 }}>✓ Bonne réponse</span>}
                </div>
                <span style={{ fontSize: 22, fontWeight: 800, color: isCorrect ? '#4ade80' : '#fff' }}>{count}<span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginLeft: 4 }}>vote{count > 1 ? 's' : ''}</span></span>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: isCorrect ? '#4ade80' : OPTION_COLORS[i % 4], transition: 'width .5s ease' }} />
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28 }}>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginRight: 6 }}>{total}</span>
          participant{total !== 1 ? 's' : ''} {total !== 1 ? 'ont' : 'a'} répondu
        </div>
        {isLast
          ? <button onClick={onEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>✓ Terminer le quiz</button>
          : <button onClick={onNext} style={{ background: `linear-gradient(135deg, ${ACCENT}, #9f67fa)`, border: 'none', color: '#fff', padding: '14px 36px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: `0 6px 24px ${ACCENT}45` }}>Question suivante →</button>
        }
      </div>
    </div>
  )
}

// ── Résultats du groupe ───────────────────────────────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTrainerQuizAnswers(`session_code=eq.${SESSION_CODE}&module_id=eq.verre-progressif`)
      .then(rows => { setAnswers(rows || []); setLoading(false) })
  }, [])

  const participants = [...new Set((answers || []).map(r => r.collaborateur))]
  const questionStats = PROGRESSIF_QUIZ.map((q, idx) => {
    const qA = answers.filter(r => r.question_idx === idx)
    const wrong = qA.filter(r => !r.is_correct).length
    const tot = qA.length
    const pct = tot > 0 ? Math.round((wrong / tot) * 100) : 0
    return { idx, question: q.question, pct, tot }
  }).sort((a, b) => b.pct - a.pct)

  const getPriority = pct => {
    if (pct >= 50) return { label: 'À retravailler en priorité', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
    if (pct >= 25) return { label: 'À consolider', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
    return { label: 'Bien maîtrisé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #12013a 55%, #0d0a3a 100%)', display: 'flex', flexDirection: 'column', padding: '24px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan · Le Verre Progressif</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{participants.length}</span>
          participant{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-block', background: `rgba(124,58,237,0.15)`, border: `1px solid rgba(124,58,237,0.35)`, borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#a78bfa', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d'erreur décroissant — {PROGRESSIF_QUIZ.length} questions</p>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 780, alignSelf: 'center', width: '100%' }}>
        {loading
          ? <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: 40 }}>Chargement…</div>
          : questionStats.map(stat => {
            const p = getPriority(stat.pct)
            return (
              <div key={stat.idx} style={{ background: p.bg, border: `1px solid ${p.border}`, borderRadius: 18, padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, marginRight: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{p.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>Q{stat.idx + 1} — {stat.question}</div>
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: p.color, lineHeight: 1, flexShrink: 0 }}>
                    {stat.pct}%<div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>d'erreurs</div>
                  </div>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${stat.pct}%`, background: p.color, transition: 'width .8s ease' }} />
                </div>
              </div>
            )
          })
        }
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button onClick={onTerminate} style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)', border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(220,38,38,0.4)' }}>✓ Terminer le module</button>
      </div>
    </div>
  )
}

// ── Lobby ─────────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #12013a 55%, #0d0a3a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <button onClick={onBack} style={{ position: 'absolute', top: 24, left: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Retour</button>
      <div style={{ textAlign: 'center', maxWidth: 540, padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={180} height={68} style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'inline-block', background: `rgba(124,58,237,0.15)`, border: `1px solid rgba(124,58,237,0.3)`, borderRadius: 20, padding: '4px 16px', fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>Formation J+14</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Le Verre Progressif</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.7 }}>
          Anatomie · Zones interactives · Retour terrain<br />
          Argumentation · Jeu d&apos;objections · Quiz final
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 32 }}>
          {['① Anatomie', '② Zones quiz', '③ Presbytie', '④ Retour terrain', '⑤ Arguments', '⑥ Objections', '⑦ Quiz 8 questions'].map(t => (
            <span key={t} style={{ padding: '4px 12px', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{t}</span>
          ))}
        </div>

        <button onClick={onStart} style={{ background: `linear-gradient(135deg, ${ACCENT}, #9f67fa)`, border: 'none', color: '#fff', padding: '16px 52px', borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 32px ${ACCENT}45`, fontFamily: 'inherit' }}>▶ Lancer le module</button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>6 pages interactives · Quiz final 8 questions</p>
      </div>
    </div>
  )
}

// ── Export principal ───────────────────────────────────────────────
export default function ModuleProgressif({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [quizLaunched, setQuizLaunched] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [showGroupResults, setShowGroupResults] = useState(false)

  const trainerAvatar = pName ? `/assets/avatar_${pName.toLowerCase()}.png` : '/assets/avatar_kevin.png'

  useEffect(() => {
    if (started) sbUpdate('sessions', { active_module: 'verre-progressif', module_page: 0 }, 'code=eq.' + SESSION_CODE)
  }, [started])

  useEffect(() => {
    if (started) sbUpdate('sessions', { module_page: pageIndex }, 'code=eq.' + SESSION_CODE)
  }, [pageIndex, started])

  const handleLaunchQuiz = async () => {
    await sbUpdate('sessions', { module_page: 100 }, 'code=eq.' + SESSION_CODE)
    setQuizQ(0)
    setQuizLaunched(true)
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await sbUpdate('sessions', { module_page: 100 + next }, 'code=eq.' + SESSION_CODE)
    setQuizQ(next)
  }

  const handleEndQuiz = async () => {
    await sbUpdate('sessions', { active_module: 'verre-progressif', module_page: 200 }, 'code=eq.' + SESSION_CODE)
    setShowGroupResults(true)
  }

  const handleTerminate = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + SESSION_CODE)
    await setSharedState({ prog_zone_q: null, prog_zone_responses: {}, prog_retour_responses: {}, prog_objection_idx: null, prog_objection_responses: {}, prog_best_answer: null })
    onBack()
  }

  const handleBack = async () => {
    await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + SESSION_CODE)
    await setSharedState({ prog_zone_q: null, prog_zone_responses: {}, prog_retour_responses: {}, prog_objection_idx: null, prog_objection_responses: {}, prog_best_answer: null })
    onBack()
  }

  if (!started) return <Lobby onStart={() => setStarted(true)} onBack={handleBack} />

  if (showGroupResults) return <><style>{STYLES}</style><GroupResultsView onTerminate={handleTerminate} /></>

  if (quizLaunched) return <><style>{STYLES}</style><QuizController quizQ={quizQ} onNext={handleNextQuestion} onEnd={handleEndQuiz} onBack={handleEndQuiz} /></>

  const page = PROGRESSIF_PAGES[pageIndex]
  const isFirst = pageIndex === 0
  const isLast = pageIndex === PROGRESSIF_PAGES.length - 1
  const navProps = {
    page, trainerAvatar, pName, isFirst, isLast,
    pageIndex, total: PROGRESSIF_PAGES.length,
    onPrev: () => setPageIndex(i => Math.max(0, i - 1)),
    onNext: () => setPageIndex(i => i + 1),
    onBack: handleBack,
    quizLaunched,
    onLaunchQuiz: handleLaunchQuiz,
  }

  return (
    <>
      <style>{STYLES}</style>
      {page.type === 'zone-interactif'  && <ZoneInteractifPage  {...navProps} />}
      {page.type === 'prog-retour'      && <RetourTerrainPage   {...navProps} />}
      {page.type === 'prog-objections'  && <JeuObjectionsPage   {...navProps} />}
      {page.type === 'cours'            && <CoursPage           {...navProps} />}
    </>
  )
}
