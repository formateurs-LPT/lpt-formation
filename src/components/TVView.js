'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA, ORD_COLS, ORD_EXAMPLE, SAISIE_EXERCISES, SAISIE_ROUNDS, TRAME_ACCUEIL_POINTS, MUTUELLES_BELGIQUE, MONTAGE_TRAITEMENTS } from '@/lib/modulesData'
import { PLANNING_JOURS } from '@/lib/planningData'
import { sbSelect, SESSION_CODE, fetchOpenAnswers, getSharedState, getRoomSharedState, setRoomSharedState, getWeeklySharedState } from '@/lib/supabase'
import { fetchOnlineParticipantsList } from '@/lib/participantPresence'
import { buildQrImageUrl, getLegacySessionCode, getTvDisplayRoomCode } from '@/lib/sessionCode'
import ZeroInterChain from '@/components/ZeroInterChain'
import { PDMAnimationSVG } from '@/lib/pdmAnimationSvg'
import { HeadlightVision } from '@/lib/headlightVision'
import { TVPeerQuizScreen } from '@/components/PeerQuizGame'
import { TVFreeQuizScreen } from '@/components/FreeQuizGame'
import { useQuizCountdown, QUIZ_TIME_LIMIT_SEC } from '@/components/ParticipantModuleView'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── Affichage anonyme des questions formés (TV) ───────────────────
function TVModuleQuestionsView({ sessionCode, moduleId, moduleLabel, singleId }) {
  const [questions, setQuestions] = useState([])

  useEffect(() => {
    if (!sessionCode || !moduleId) return
    const load = async () => {
      try {
        const state = await getRoomSharedState(sessionCode)
        const prefix = `mq__${moduleId}__`
        const rows = Object.entries(state || {})
          .filter(([k, v]) => k.startsWith(prefix) && v?.answer)
          .map(([k, v]) => ({ id: k, answer: v.answer, ts: v.ts || 0 }))
          .sort((a, b) => a.ts - b.ts)
        setQuestions(rows)
      } catch {}
    }
    load()
    const id = setInterval(load, 4000)
    return () => clearInterval(id)
  }, [sessionCode, moduleId])

  const displayed = singleId ? questions.filter(q => q.id === singleId) : questions

  if (singleId) {
    const q = displayed[0]
    return (
      <div style={{
        height: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #071832 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '60px 100px', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box', color: '#fff',
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 32 }}>
          {moduleLabel || 'Module en cours'} · Question
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,171,233,0.3)',
          borderLeft: '6px solid #00abe9', borderRadius: 20, padding: '48px 56px',
          maxWidth: 900, width: '100%',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>
            {q ? q.answer : '…'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #071832 100%)',
      display: 'flex', flexDirection: 'column', padding: '48px 60px',
      fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box',
      color: '#fff', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            {moduleLabel || 'Module en cours'}
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>Vos questions</h2>
        </div>
        <div style={{ background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)', borderRadius: 20, padding: '8px 20px', fontSize: 14, fontWeight: 700, color: '#00abe9' }}>
          {displayed.length} question{displayed.length !== 1 ? 's' : ''}
        </div>
      </div>

      {displayed.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 52 }}>❓</div>
          <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)' }}>En attente de questions…</div>
        </div>
      ) : (
        <div style={{
          flex: 1, display: 'grid', overflow: 'hidden',
          gridTemplateColumns: displayed.length <= 3 ? '1fr' : 'repeat(2, 1fr)',
          gap: 16, alignContent: 'start',
          overflowY: displayed.length > 6 ? 'auto' : 'hidden',
        }}>
          {displayed.map((q, i) => (
            <div key={q.id || i} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
              borderLeft: '4px solid #00abe9', borderRadius: 14, padding: '20px 24px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Question {i + 1}
              </div>
              <div style={{ fontSize: displayed.length <= 4 ? 20 : 16, color: '#fff', lineHeight: 1.55, fontWeight: 500 }}>
                {q.answer}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Question d'un formé diffusée en overlay — au-dessus de n'importe quel écran
 * (module actif ou pas), contrairement à TVModuleQuestionsView qui ne
 * s'affichait QUE quand aucun module n'était en cours (!activeModule). Un
 * formateur cliquant sur "Afficher sur TV" pendant un module ne voyait donc
 * jamais rien apparaître sur le diffuseur (incident du 18/08).
 */
function TVQuestionOverlay({ sessionCode, singleId }) {
  const [answer, setAnswer] = useState(null)
  useEffect(() => {
    if (!sessionCode || !singleId) return
    let cancelled = false
    const load = async () => {
      try {
        const state = await getRoomSharedState(sessionCode)
        if (!cancelled) setAnswer(state?.[singleId]?.answer || null)
      } catch {}
    }
    load()
    const id = setInterval(load, 4000)
    return () => { cancelled = true; clearInterval(id) }
  }, [sessionCode, singleId])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 850,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 60, pointerEvents: 'none',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 100%)',
        border: '2px solid rgba(0,171,233,0.4)', borderLeft: '8px solid #00abe9',
        borderRadius: 24, padding: '48px 56px', maxWidth: 900, width: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          ❓ Question d&apos;un formé
        </div>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>
          {answer || '…'}
        </div>
      </div>
    </div>
  )
}

// ── Keyframes ─────────────────────────────────────────────────────
const STYLES = `
  html, body { overflow: hidden !important; height: 100% !important; margin: 0; }

  @keyframes trameSlideIn {
    from { opacity: 0; transform: translateX(-24px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes verreFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-16px) scale(1.04); }
  }
  @keyframes haloPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.15); }
  }
  @keyframes particleFloat {
    from { transform: translateY(0px); opacity: 0.2; }
    to   { transform: translateY(-14px); opacity: 0.5; }
  }
  @keyframes waitingPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
  @keyframes logoBreathe {
    0%, 100% { opacity: 0.85; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.06); }
  }
  @keyframes chipIn {
    from { opacity: 0; transform: translateX(-6px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .frise-chips { -ms-overflow-style: none; scrollbar-width: none; }
  .frise-chips::-webkit-scrollbar { display: none; }
  @keyframes bubbleIn {
    from { opacity: 0; transform: scale(0.6) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(100%); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes podiumRise {
    from { transform: scaleY(0); transform-origin: bottom; }
    to   { transform: scaleY(1); transform-origin: bottom; }
  }
  @keyframes podiumFadeIn {
    from { opacity: 0; transform: translateY(-18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes starPulse {
    0%, 100% { opacity: 0.25; transform: scale(0.8); }
    50%       { opacity: 0.9;  transform: scale(1.3); }
  }
  @keyframes trophyFloat {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes slotScroll {
    from { transform: translateY(0); }
    to   { transform: translateY(-33.333%); }
  }
  @keyframes slotBrake {
    from { transform: translateY(0); }
    to   { transform: translateY(-33.333%); }
  }
  @keyframes resultBounce {
    0%   { transform: scale(0.82); opacity: 0; }
    65%  { transform: scale(1.06); opacity: 1; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes mjFadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes mjPulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.45; }
  }
  @keyframes cardFallAway {
    0%   { transform: translateY(0) rotate(0deg);   opacity: 1; }
    100% { transform: translateY(340px) rotate(24deg); opacity: 0; }
  }
  @keyframes cardPopIn {
    0%   { transform: scale(0.85); opacity: 0; }
    100% { transform: scale(1);    opacity: 1; }
  }
  @keyframes successPop {
    0%   { transform: scale(0.8); opacity: 0; }
    60%  { transform: scale(1.05); opacity: 1; }
    100% { transform: scale(1);   opacity: 1; }
  }
`

// ── Verre animé ───────────────────────────────────────────────────
function VerreAnime({ color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <Image
          src="/assets/verre-unifocal-2.png"
          alt="Verre optique"
          width={560}
          height={560}
          style={{ objectFit: 'contain', filter: `drop-shadow(0 0 64px ${color}90) drop-shadow(0 24px 48px rgba(0,0,0,0.35))` }}
          priority
        />
      </div>
    </div>
  )
}

// ── TV Quiz — helpers ────────────────────────────────────────────────
function TVQuizHeader({ qIdx, total, moduleLabel }) {
  return (
    <>
      <div style={{ position: 'absolute', top: 24, left: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Quiz · {moduleLabel}</span>
      </div>
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '8px 28px', marginBottom: 36,
        fontSize: 14, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 2,
      }}>Question {qIdx + 1} / {total}</div>
    </>
  )
}

function TVQuizFooter() {
  return (
    <div style={{
      position: 'absolute', bottom: 32,
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.2)',
      borderRadius: 20, padding: '10px 24px',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.4s ease-in-out infinite' }} />
      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Répondez depuis votre téléphone</span>
    </div>
  )
}

function TVOrdonnanceDisplay({ ordonnance, hideLabels, cylInParens, hideNonAddHeaders, topLabel }) {
  if (!ordonnance) return null
  const { od, og } = ordonnance
  const hasCyl = od.cyl || og.cyl
  const hasAdd = od.add || og.add
  const cellStyle = { padding: '8px 16px', textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#fff' }
  const headerStyle = { padding: '6px 16px', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1 }
  const labelStyle = { padding: '8px 20px', textAlign: 'right', fontSize: 16, fontWeight: 800, color: '#a78bfa' }

  const eyes = [{ label: 'OD', data: od }, { label: 'OG', data: og }]

  return (
    <div style={{
      background: 'rgba(124,58,237,0.08)', border: '2px solid rgba(124,58,237,0.3)',
      borderRadius: 20, padding: '16px 0', marginBottom: 36,
      width: '100%', maxWidth: 720, alignSelf: 'center',
    }}>
      {topLabel && (
        <div style={{ fontSize: 16, fontWeight: 700, color: '#4ade80', textAlign: 'center', marginBottom: 6 }}>{topLabel}</div>
      )}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: 12 }}>ORDONNANCE</div>

      {cylInParens && hasCyl ? (
        /* Mode compact : sph (cyl) axe — colonnes fixes groupées au centre
           (un <table> classique laissait l'axe s'étirer loin à droite, la
           colonne sph(cyl) prenant toute la place restante). */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {eyes.map(({ label, data }) => (
            <div key={label} style={{
              display: 'grid',
              gridTemplateColumns: hasAdd ? '70px 1fr 1fr 1fr' : '70px 1fr 1fr',
              alignItems: 'center', width: '100%', maxWidth: 460,
              borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4px 0',
            }}>
              <div style={labelStyle}>{label}</div>
              <div style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                {data.sph || '—'}
                {data.cyl && <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}> ({data.cyl})</span>}
              </div>
              <div style={{ ...cellStyle, fontSize: 18, color: 'rgba(255,255,255,0.7)' }}>{data.axe ? `${data.axe}°` : '—'}</div>
              {hasAdd && <div style={cellStyle}>{data.add ? `Add ${data.add}` : '—'}</div>}
            </div>
          ))}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {!hideLabels && (
            <thead>
              <tr>
                <th style={{ width: 80 }}></th>
                {!hideNonAddHeaders && <th style={headerStyle}>Sphère</th>}
                {!hideNonAddHeaders && hasCyl && <th style={headerStyle}>Cylindre</th>}
                {!hideNonAddHeaders && hasCyl && <th style={headerStyle}>Axe</th>}
                {hideNonAddHeaders && <th style={headerStyle}></th>}
                {hasAdd && <th style={headerStyle}>Add</th>}
              </tr>
            </thead>
          )}
          <tbody>
            {eyes.map(({ label, data }) => (
              <tr key={label} style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <td style={labelStyle}>{label}</td>
                <td style={cellStyle}>{data.sph || '—'}</td>
                {hasCyl && <td style={cellStyle}>{data.cyl || 'Plan'}</td>}
                {hasCyl && <td style={cellStyle}>{data.axe || '—'}</td>}
                {hasAdd && <td style={cellStyle}>{hideLabels ? `Add ${data.add || '—'}` : (data.add || '—')}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// ── TV texte libre ──────────────────────────────────────────────────
function TVQuizTextOpen({ question, qIdx, total, moduleLabel, sessionCode, moduleId }) {
  const [answers, setAnswers] = useState([])
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    if (!sessionCode) return
    const poll = async () => {
      try {
        const [answerRows, pRows] = await Promise.all([
          fetchOpenAnswers(sessionCode, `${moduleId}:${qIdx}`),
          sbSelect('participants', `session_code=eq.${encodeURIComponent(sessionCode)}`),
        ])
        setAnswers(answerRows || [])
        setParticipantCount((pRows || []).length)
      } catch { /* erreur réseau, réessai au prochain tick */ }
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [sessionCode, qIdx, moduleId])

  const allAnswered = participantCount > 0 && answers.length >= participantCount

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px', position: 'relative',
    }}>
      <TVQuizHeader qIdx={qIdx} total={total} moduleLabel={moduleLabel} />
      <h1 style={{ fontSize: 52, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: question.ordonnance ? 24 : 40, maxWidth: 1000 }}>
        {question.question}
      </h1>
      {question.ordonnance && (
        <TVOrdonnanceDisplay ordonnance={question.ordonnance} hideLabels={question.hideOrdoLabels || question.hideLabels} cylInParens={question.cylInParens} hideNonAddHeaders={question.hideNonAddHeaders} topLabel={question.ordoLabel} />
      )}
      {!allAnswered ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)',
            borderRadius: 16, padding: '14px 32px',
            fontSize: 18, color: 'rgba(255,255,255,0.6)', fontWeight: 500,
          }}>
            ✍️ Saisissez votre réponse depuis votre téléphone
          </div>
          {answers.length > 0 && (
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
              {answers.length}
              <span style={{ fontSize: 15, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginLeft: 8 }}>
                / {participantCount > 0 ? participantCount : '?'} réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
          {answers.length > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {answers.map((_, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length] }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, maxWidth: 1000, justifyContent: 'center' }}>
          {/* Anonyme : seul le formateur voit qui a répondu quoi (sur son propre écran) */}
          {answers.slice(0, 10).map((a, i) => (
            <div key={a.participant_name || i} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, padding: '10px 20px',
              fontSize: 16, color: 'rgba(255,255,255,0.8)',
            }}>
              {question?.type === 'text-open-multi' ? (a.answer || '').split('||').map(s => s.trim()).filter(Boolean).join(' // ') : a.answer}
            </div>
          ))}
        </div>
      )}
      <TVQuizFooter />
    </div>
  )
}

// ── TV trame d'accueil à compléter (Quiz Jour 2 · Q1) ────────────────
function TVQuizTrameFill({ question, qIdx, total, moduleLabel }) {
  const points = question.tramePoints || []
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px', position: 'relative',
    }}>
      <TVQuizHeader qIdx={qIdx} total={total} moduleLabel={moduleLabel} />
      <h1 style={{ fontSize: 42, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 36, maxWidth: 900 }}>
        {question.question}
      </h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 760, marginBottom: 8 }}>
        {points.map(pt => {
          const blank = !pt.text
          return (
            <div key={pt.num} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: `${pt.color}18`, border: `2px solid ${pt.color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 900, color: pt.color,
              }}>{pt.num}</div>
              <div style={{
                flex: 1, borderLeft: `4px solid ${pt.color}`,
                background: blank ? 'rgba(255,255,255,0.03)' : `${pt.color}08`,
                border: `1px solid ${blank ? 'rgba(255,255,255,0.15)' : pt.color + '22'}`,
                borderRadius: 14, padding: '16px 22px',
                borderStyle: blank ? 'dashed' : 'solid',
              }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: blank ? 'rgba(255,255,255,0.35)' : '#fff', lineHeight: 1.5, fontStyle: blank ? 'italic' : 'normal' }}>
                  {blank ? '? À vous de compléter…' : pt.text}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <TVQuizFooter />
    </div>
  )
}

// ── TV remplir ordonnance ────────────────────────────────────────────
function TVQuizOrdonnanceFill({ question, qIdx, total, moduleLabel }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px', position: 'relative',
    }}>
      <TVQuizHeader qIdx={qIdx} total={total} moduleLabel={moduleLabel} />
      <h1 style={{ fontSize: 46, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 40, maxWidth: 900 }}>
        {question.question}
      </h1>
      <TVOrdonnanceDisplay ordonnance={question.ordonnance} hideLabels={question.hideOrdoLabels || question.hideLabels} cylInParens={question.cylInParens} hideNonAddHeaders={question.hideNonAddHeaders} topLabel={question.ordoLabel} />
      <div style={{
        background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)',
        borderRadius: 16, padding: '12px 28px',
        fontSize: 16, color: 'rgba(255,255,255,0.6)', fontWeight: 500,
      }}>
        📱 Saisissez les valeurs sur votre téléphone
      </div>
      <TVQuizFooter />
    </div>
  )
}

// ── TV QCM avec ordonnance ───────────────────────────────────────────
function TVQuizOrdonnanceQCM({ question, qIdx, total, moduleLabel }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 80px', position: 'relative',
    }}>
      <TVQuizHeader qIdx={qIdx} total={total} moduleLabel={moduleLabel} />
      <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 28, maxWidth: 900 }}>
        {question.question}
      </h1>
      <TVOrdonnanceDisplay ordonnance={question.ordonnance} hideLabels={question.hideOrdoLabels || question.hideLabels} cylInParens={question.cylInParens} hideNonAddHeaders={question.hideNonAddHeaders} topLabel={question.ordoLabel} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: (question.options?.length ?? 0) >= 3 ? 'repeat(2, 1fr)' : '1fr 1fr',
        gap: 18, width: '100%', maxWidth: 760,
      }}>
        {(question.options || []).map((opt, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 20, padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: OPTION_COLORS[i],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 800, color: '#fff',
            }}>{'ABCD'[i]}</div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{opt}</span>
          </div>
        ))}
      </div>
      <TVQuizFooter />
    </div>
  )
}

// ── TV sélecteur puissances ──────────────────────────────────────────
function TVQuizPowerSel({ question, qIdx, total, moduleLabel }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 80px', position: 'relative',
    }}>
      <TVQuizHeader qIdx={qIdx} total={total} moduleLabel={moduleLabel} />
      <h1 style={{ fontSize: 48, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 48, maxWidth: 900 }}>
        {question.question}
      </h1>
      <div style={{ display: 'flex', gap: 40, marginBottom: 40 }}>
        {[{ label: 'Positif max', color: '#4ade80' }, { label: 'Négatif max', color: '#60a5fa' }].map(({ label, color }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.06)', border: `2px solid ${color}40`,
            borderRadius: 20, padding: '24px 40px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{label}</div>
            <div style={{
              width: 120, height: 56, background: 'rgba(255,255,255,0.08)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: 'rgba(255,255,255,0.3)',
            }}>▾ Sélectionnez</div>
          </div>
        ))}
      </div>
      <TVQuizFooter />
    </div>
  )
}

// ── TV QCM multi-sélection ───────────────────────────────────────────
function TVQuizMultiQuestion({ question, qIdx, total, moduleLabel }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 80px', position: 'relative',
    }}>
      <TVQuizHeader qIdx={qIdx} total={total} moduleLabel={moduleLabel} />
      <h1 style={{ fontSize: 50, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.2, marginBottom: 16, maxWidth: 1000 }}>
        {question.question}
      </h1>
      {question.instruction && (
        <div style={{ fontSize: 18, color: '#f59e0b', fontWeight: 600, marginBottom: 40 }}>{question.instruction}</div>
      )}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24, width: '100%', maxWidth: 1000,
      }}>
        {(question.options || []).map((opt, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 24, padding: '28px 32px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: OPTION_COLORS[i],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff',
            }}>{'ABCD'[i]}</div>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>{opt}</span>
          </div>
        ))}
      </div>
      <TVQuizFooter />
    </div>
  )
}

// Minuteur affiché sur le diffuseur pendant une question — même compte à
// rebours (90s) que celui du téléphone du formé (useQuizCountdown, partagé
// depuis ParticipantModuleView.js). Overlay fixe indépendant du type de
// question, pour ne pas avoir à le recaser dans chaque écran TVQuiz*.
// `key={qIdx}` côté appelant force le redémarrage à chaque nouvelle question.
function TVQuizTimerOverlay({ moduleId, qIdx, sessionCode, seconds }) {
  const remaining = useQuizCountdown({ enabled: true, moduleId, qIdx, sessionCode, seconds })
  const urgent = remaining <= 15
  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')
  return (
    <div style={{
      position: 'fixed', top: '50%', right: 32, transform: 'translateY(-50%)', zIndex: 200,
      display: 'flex', alignItems: 'center', gap: 16,
      background: urgent ? 'rgba(239,68,68,0.25)' : 'rgba(3,17,42,0.85)',
      border: `3px solid ${urgent ? '#f87171' : 'rgba(0,171,233,0.5)'}`,
      borderRadius: 32, padding: '14px 40px',
      fontSize: 52, fontWeight: 900, color: urgent ? '#f87171' : '#fff',
      fontVariantNumeric: 'tabular-nums',
      boxShadow: urgent ? '0 0 50px rgba(239,68,68,0.4)' : '0 8px 40px rgba(0,0,0,0.5)',
      animation: urgent ? 'tvQuizTimerPulse 1s ease-in-out infinite' : 'none',
    }}>
      ⏱ {mm}:{ss}
      <style>{`@keyframes tvQuizTimerPulse { 0%,100% { opacity: 1; } 50% { opacity: .5; } }`}</style>
    </div>
  )
}

// ── TV Quiz Question ──────────────────────────────────────────────
function TVQuizQuestion({ question, qIdx, total, moduleLabel, sessionCode, moduleId }) {
  const type = question.type || 'qcm'
  const timer = <TVQuizTimerOverlay key={`quiz-timer-${moduleId}-${qIdx}`} moduleId={moduleId} qIdx={qIdx} sessionCode={sessionCode} seconds={question.timeLimitSec || QUIZ_TIME_LIMIT_SEC} />

  if (type === 'text-open' && question.tramePoints) {
    return <>{timer}<TVQuizTrameFill question={question} qIdx={qIdx} total={total} moduleLabel={moduleLabel} /></>
  }
  if (type === 'text-open' || type === 'text-open-multi' || type === 'text-open-pairs') {
    return <>{timer}<TVQuizTextOpen question={question} qIdx={qIdx} total={total} moduleLabel={moduleLabel} sessionCode={sessionCode} moduleId={moduleId} /></>
  }
  if (type === 'ordonnance-fill') {
    return <>{timer}<TVQuizOrdonnanceFill question={question} qIdx={qIdx} total={total} moduleLabel={moduleLabel} /></>
  }
  if (type === 'qcm-ordonnance') {
    return <>{timer}<TVQuizOrdonnanceQCM question={question} qIdx={qIdx} total={total} moduleLabel={moduleLabel} /></>
  }
  if (type === 'power-selector') {
    return <>{timer}<TVQuizPowerSel question={question} qIdx={qIdx} total={total} moduleLabel={moduleLabel} /></>
  }
  if (type === 'qcm-multi') {
    return <>{timer}<TVQuizMultiQuestion question={question} qIdx={qIdx} total={total} moduleLabel={moduleLabel} /></>
  }

  return (
    <>
    {timer}
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 80px', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 24, left: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Quiz · {moduleLabel}</span>
      </div>

      {/* Badge question */}
      <div style={{
        background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
        borderRadius: 20, padding: '8px 28px', marginBottom: 36,
        fontSize: 14, fontWeight: 700, color: '#a78bfa',
        textTransform: 'uppercase', letterSpacing: 2,
      }}>Question {qIdx + 1} / {total}</div>

      {/* Question */}
      <h1 style={{
        fontSize: 54, fontWeight: 800, color: '#fff', textAlign: 'center',
        lineHeight: 1.2, marginBottom: 64, maxWidth: 1000,
      }}>{question.question}</h1>

      {/* Réponses */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: (question.options?.length ?? 0) === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24, width: '100%', maxWidth: 1000,
      }}>
        {(question.options || []).map((opt, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 24, padding: '28px 32px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              background: OPTION_COLORS[i],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 800, color: '#fff',
            }}>{'ABCD'[i]}</div>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{opt}</span>
          </div>
        ))}
      </div>

      {/* Instruction bas */}
      <div style={{
        position: 'absolute', bottom: 32,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.2)',
        borderRadius: 20, padding: '10px 24px',
      }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.4s ease-in-out infinite' }} />
        <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Répondez depuis votre téléphone</span>
      </div>
    </div>
    </>
  )
}

// ── TV Image Visual (photo avec halo animé) ───────────────────────
function TVImageVisual({ src, color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 560, height: 560, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}35 0%, transparent 70%)`,
        animation: 'haloPulse 3.5s ease-in-out infinite',
      }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Module illustration"
        style={{
          width: 420, height: 'auto',
          animation: 'verreFloat 4s ease-in-out infinite',
          position: 'relative', zIndex: 1,
          filter: `drop-shadow(0 0 48px ${color}80) drop-shadow(0 20px 40px rgba(0,0,0,0.45))`,
        }}
      />
    </div>
  )
}

// ── TV Emoji Visual (grand emoji avec glow) ───────────────────────
function TVEmojiVisual({ emoji, color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 460, height: 460, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 65%)`,
        animation: 'haloPulse 3.5s ease-in-out infinite',
      }} />
      <div style={{
        width: 320, height: 320, borderRadius: '50%',
        background: `${color}18`, border: `2px solid ${color}35`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'verreFloat 4s ease-in-out infinite',
        position: 'relative', zIndex: 1,
      }}>
        <span style={{ fontSize: 160, lineHeight: 1 }}>{emoji}</span>
      </div>
    </div>
  )
}

// ── TV Correction Scale (type = correction-scale) — frise ──────────
const TV_NEG    = Array.from({ length: 32 }, (_, i) => (i + 1) * 0.25) // −0,25 → −8,00
const TV_POS    = Array.from({ length: 29 }, (_, i) => (i + 1) * 0.25) // +0,25 → +7,25
const tvFmt     = (v) => v.toFixed(2).replace('.', ',')
const TV_PLAN_W = 110 // colonne Plan fixe
const TV_ROW_H  = 54  // hauteur rangée chips

function TVCorrectionScale({ page, pageIndex, total, moduleLabel }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    let s = 0; let tid
    const next = () => {
      s++
      if (s > TV_NEG.length) return
      setStep(s)
      tid = setTimeout(next, 90)
    }
    tid = setTimeout(next, 500)
    return () => clearTimeout(tid)
  }, [page.id])

  const negVisible = TV_NEG.slice(0, step)
  const posVisible = TV_POS.slice(0, step)
  const tvChip = {
    padding: '10px 16px', borderRadius: 9, flexShrink: 0,
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
    animation: 'chipIn 0.2s ease',
    fontSize: 17, fontWeight: 500, color: 'rgba(255,255,255,0.85)',
    fontVariantNumeric: 'tabular-nums',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px 48px', gap: 0 }}>
        {/* Titre */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>{page.sousTitre}</p>
        </div>

        {/* Frise — négatifs */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ width: TV_PLAN_W, flexShrink: 0 }} />
          <div className="frise-chips" style={{ flex: 1, minWidth: 0, overflowX: 'scroll', touchAction: 'pan-x' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, padding: '6px 0', width: 'max-content' }}>
              {negVisible.map((v, i) => <div key={i} style={tvChip}>−{tvFmt(v)}</div>)}
            </div>
          </div>
        </div>

        {/* Frise — axe Plan */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: TV_PLAN_W, flexShrink: 0, paddingRight: 20 }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#00abe9', lineHeight: 1 }}>Plan</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>0,00</div>
          </div>
          <div style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.22)', borderRadius: 1 }} />
        </div>

        {/* Frise — positifs */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 14 }}>
          <div style={{ width: TV_PLAN_W, flexShrink: 0 }} />
          <div className="frise-chips" style={{ flex: 1, minWidth: 0, overflowX: 'scroll', touchAction: 'pan-x' }}>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 6, padding: '6px 0', width: 'max-content' }}>
              {posVisible.map((v, i) => <div key={i} style={tvChip}>+{tvFmt(v)}</div>)}
            </div>
          </div>
        </div>

        {/* Encart clé */}
        <div style={{
          marginTop: 48,
          padding: '32px 48px',
          borderRadius: 22,
          background: 'rgba(0,171,233,0.07)',
          border: '1px solid rgba(0,171,233,0.22)',
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <span style={{ fontSize: 44, lineHeight: 1, flexShrink: 0 }}>⚡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>À retenir</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              Fabrication en 10 minutes
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TV Ordonnance (type = ordonnance) ────────────────────────────
// ── Rapporteur d'axe — suit en direct le curseur du formateur ─────────
// Convention optique : 0° à gauche, 180° à droite (en passant par le haut, 90° au sommet).
function AxisProtractor({ axe = 0 }) {
  const cx = 200, cy = 190, R = 150
  const rad = (axe * Math.PI) / 180
  const needleX = cx - R * Math.cos(rad)
  const needleY = cy - R * Math.sin(rad)
  const ticks = Array.from({ length: 19 }, (_, i) => i * 10) // 0°, 10°, 20°, … 180°

  return (
    <svg width={400} height={220} viewBox="0 0 400 220">
      {/* Arc du rapporteur — demi-cercle supérieur */}
      <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 0 ${cx + R} ${cy}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={2} />
      {/* Ligne de base */}
      <line x1={cx - R - 8} y1={cy} x2={cx + R + 8} y2={cy} stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} />
      {/* Graduations tous les 10° */}
      {ticks.map(t => {
        const r = (t * Math.PI) / 180
        const x1 = cx - (R - 8) * Math.cos(r), y1 = cy - (R - 8) * Math.sin(r)
        const x2 = cx - (R + 8) * Math.cos(r), y2 = cy - (R + 8) * Math.sin(r)
        const lx = cx - (R + 28) * Math.cos(r), ly = cy - (R + 28) * Math.sin(r)
        return (
          <g key={t}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.45)" strokeWidth={2} />
            <text x={lx} y={ly} fill="rgba(255,255,255,0.6)" fontSize={14} fontWeight={700} textAnchor="middle" dominantBaseline="middle">{t}°</text>
          </g>
        )
      })}
      {/* Aiguille */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#fb923c" strokeWidth={4} strokeLinecap="round" style={{ transition: 'x2 0.15s linear, y2 0.15s linear' }} />
      <circle cx={cx} cy={cy} r={7} fill="#fb923c" />
    </svg>
  )
}

function TVOrdonnance({ page, pageIndex, total, moduleLabel, ordoPlaying, ordoRevealStep, audioUnlocked, ordoHeadlightDemo, ordoHeadlightCyl, ordoHeadlightAxe }) {
  const videoRef = useRef(null)

  // Contrôle play/pause — attend que l'audio soit débloqué
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (ordoPlaying && audioUnlocked) {
      v.play().catch(() => {})
    } else if (!ordoPlaying) {
      v.pause()
    }
  }, [ordoPlaying, audioUnlocked])

  // Visibilité pilotée par le formateur (revealStep sync via sharedState)
  // revealStep : 0 = tableau vide, 1 = +sphère, 2 = +cylindre/axe, 3 = +addition
  const showCard = (i) => i === 0 ? ordoRevealStep >= 1 : ordoRevealStep >= 2
  const showTable = true
  const showCell = (col) => col === 0 ? ordoRevealStep >= 1 : ordoRevealStep >= 2
  const showAdd = ordoRevealStep >= 3

  if (ordoHeadlightDemo) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40,
        padding: '40px 60px',
      }}>
        <div style={{ position: 'absolute', top: 32, left: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{
          display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)',
          borderRadius: 20, padding: '5px 18px', fontSize: 13, fontWeight: 700, color: '#00abe9',
          textTransform: 'uppercase', letterSpacing: 1.5,
        }}>Pourquoi cylindre et axe vont ensemble</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 64 }}>
          <HeadlightVision cyl={ordoHeadlightCyl || 0} axe={ordoHeadlightAxe || 0} size={340} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '18px 28px', minWidth: 200 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c084fc', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Cylindre</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {(ordoHeadlightCyl || 0).toFixed(2).replace('.', ',')}
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16, padding: '14px 20px 4px', minWidth: 440, textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#fb923c', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Axe</div>
              <AxisProtractor axe={ordoHeadlightAxe || 0} />
              <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', marginTop: -8 }}>
                {ordoHeadlightAxe || 0}°
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Zone principale — marge droite pour laisser place à la carte avatar */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 340px 48px 56px', gap: 32 }}>

        {/* Titre */}
        <div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>{page.sousTitre}</p>
        </div>

        {/* Phase 1 — 3 cartes */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {ORD_COLS.map((col, i) => (
            <div key={col.key} style={{
              background: `${col.color}0d`, border: `1px solid ${col.color}28`,
              borderTop: `4px solid ${col.color}`, borderRadius: 18,
              padding: '28px 28px 22px',
              opacity: showCard(i) ? 1 : 0,
              transform: showCard(i) ? 'translateY(0)' : 'translateY(20px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <div style={{
                display: 'inline-block',
                background: `${col.color}1a`, border: `1px solid ${col.color}40`,
                borderRadius: 20, padding: '4px 14px',
                fontSize: 12, fontWeight: 800, color: col.color,
                textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12,
              }}>{col.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.3, marginBottom: col.sub ? 10 : 0 }}>
                {col.desc}
              </div>
              {col.sub && (
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{col.sub}</div>
              )}
            </div>
          ))}
        </div>

        {/* Phase 2 — Table ordonnance */}
        <div style={{
          opacity: showTable ? 1 : 0,
          transform: showTable ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.5s ease',
          flex: 1,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
            Exemple d&apos;ordonnance
          </div>

          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* En-têtes */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(3, 1fr)', background: 'rgba(255,255,255,0.04)' }}>
              <div />
              {ORD_COLS.map(col => (
                <div key={col.key} style={{ padding: '14px 28px', fontSize: 14, fontWeight: 800, color: col.color, textTransform: 'uppercase', letterSpacing: 1, borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* Ligne OD */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ padding: '20px 28px', fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>OD</div>
              {ORD_COLS.map((col, ci) => (
                <div key={col.key} style={{
                  padding: '20px 28px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center',
                  opacity: showCell(ci) ? 1 : 0, transform: showCell(ci) ? 'translateX(0)' : 'translateX(-12px)', transition: 'all 0.35s ease',
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.od[col.key]}</span>
                </div>
              ))}
            </div>

            {/* Ligne OG */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px repeat(3, 1fr)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ padding: '20px 28px', fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center' }}>OG</div>
              {ORD_COLS.map((col, ci) => (
                <div key={col.key} style={{
                  padding: '20px 28px', borderLeft: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center',
                  opacity: showCell(ci) ? 1 : 0, transform: showCell(ci) ? 'translateX(0)' : 'translateX(-12px)', transition: 'all 0.35s ease',
                }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: col.color, fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.og[col.key]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Addition */}
          <div style={{
            marginTop: 18, display: 'flex', alignItems: 'center', gap: 24,
            padding: '18px 28px',
            background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 18,
            opacity: showAdd ? 1 : 0, transform: showAdd ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.4s ease',
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1.5 }}>Addition</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>{ORD_EXAMPLE.add}</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginLeft: 4 }}>Correction presbytie</div>
          </div>
        </div>
      </div>

      {/* Carte avatar opticien — layout horizontal identique au formateur, sans bouton */}
      <div style={{ position: 'absolute', bottom: 32, right: 36, zIndex: 10 }}>
        <div style={{
          background: 'rgba(10,42,92,0.88)', backdropFilter: 'blur(20px)',
          border: `1px solid ${ordoPlaying ? 'rgba(34,197,94,0.4)' : 'rgba(0,171,233,0.3)'}`,
          borderRadius: 20, padding: '14px 20px 14px 14px',
          display: 'flex', alignItems: 'center', gap: 18,
          boxShadow: `0 8px 40px ${ordoPlaying ? 'rgba(34,197,94,0.3)' : 'rgba(0,0,0,0.45)'}`,
          transition: 'border-color .3s, box-shadow .3s',
        }}>
          {/* Avatar à gauche */}
          <div style={{
            width: 110, height: 110, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
            border: `2px solid ${ordoPlaying ? 'rgba(34,197,94,0.6)' : 'rgba(0,171,233,0.4)'}`,
            transition: 'border-color .3s',
          }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={videoRef}
              src="/assets/LectureOrdoAudioOK.mp4"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              playsInline
              preload="auto"
            />
          </div>
          {/* Texte à droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Opticien</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Lecture ordonnance</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── TV Pause (type = pause) ───────────────────────────────────────
function OpenAnswersFeed({ sessionCode, pageId, revealed = false }) {
  const [answers, setAnswers] = useState([])
  const [participantCount, setParticipantCount] = useState(0)
  const [knownIds, setKnownIds] = useState(new Set())

  useEffect(() => {
    if (!sessionCode || !pageId) return
    const poll = async () => {
      try {
        const [state, pRows] = await Promise.all([
          getRoomSharedState(sessionCode),
          fetchOnlineParticipantsList(sessionCode),
        ])
        const prefix = `oa__${pageId}__`
        const rows = Object.entries(state || {})
          .filter(([k, v]) => k.startsWith(prefix) && v?.answer)
          .map(([k, v]) => ({
            id: k,
            participant_name: v.name || k.slice(prefix.length).replace(/_/g, ' '),
            answer: v.answer,
            ts: v.ts || 0,
          }))
          .sort((a, b) => a.ts - b.ts)
        setAnswers(rows.slice(-8))
        setParticipantCount((pRows || []).length)
        setKnownIds(prev => {
          const next = new Set(prev)
          rows.forEach(r => next.add(r.id))
          return next
        })
      } catch {}
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [sessionCode, pageId])

  const allAnswered = participantCount > 0 && answers.length >= participantCount
  const shouldShow = allAnswered || revealed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: shouldShow ? '#22c55e' : '#00abe9', animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: shouldShow ? '#22c55e' : '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          {allAnswered ? 'Tout le monde a répondu' : revealed ? 'Réponses affichées par le formateur' : 'En attente des réponses'}
        </span>
        {participantCount > 0 && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>{answers.length}/{participantCount}</span>
        )}
      </div>

      {!shouldShow ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12,
          color: 'rgba(255,255,255,0.2)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32 }}>💬</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.3)' }}>Les réponses s'afficheront quand tout le monde aura répondu</div>
          {answers.length > 0 && participantCount > 0 && (
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {answers.length}
              <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>/ {participantCount} réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''}</span>
            </div>
          )}
          {answers.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {answers.map((_, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length] }} />)}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
          {answers.map((a, i) => (
            <div key={a.id} style={{
              background: 'rgba(0,137,186,0.08)',
              border: '1px solid rgba(0,137,186,0.2)',
              borderRadius: 14, padding: '12px 16px',
              animation: 'fadeSlideUp .4s ease both',
              animationDelay: `${i * 0.05}s`,
            }}>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>
                {a.answer}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── LPT Santé · Prise en charge (page 3) ────────────────────────────────────
const LPTS_PEC_STYLES = `
  @keyframes lptp-appear { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
  @keyframes lptp-slide  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
  @keyframes lptp-pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(77,184,92,0)} 50%{box-shadow:0 0 0 10px rgba(77,184,92,0)} }
  @keyframes lptp-cursor { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes lptp-send   { 0%{transform:translate(0,0);opacity:1} 70%{transform:translate(28px,-16px);opacity:1} 100%{transform:translate(56px,-32px);opacity:0} }
`

const LPTS_PEC_PHASES = [
  {
    id: 'test',
    label: 'Test Suprême', color: '#00abe9', emoji: '🔍',
    steps: [
      { label: 'Charger AMO (Sécurité Sociale)', duration: 2400 },
      { label: 'Charger AMC (Mutuelle)', duration: 2400 },
      { label: "Ajouter l'ordonnance client", duration: 2400 },
      { label: 'LPT Santé génère le devis', duration: 2600 },
      { label: 'Envoyer la demande', duration: 2000 },
      { label: 'Réponse immédiate ✅ ou ❌', duration: 4800 },
    ],
  },
  {
    id: 'fact',
    label: 'Facturation', color: '#4db85c', emoji: '🧾',
    sub: '1=1 ou Suprême',
    steps: [
      { label: 'Charger AMO + AMC client', duration: 2400 },
      { label: 'Ouvrir section Facturation', duration: 1800 },
      { label: 'Saisir le n° de commande', duration: 2600 },
      { label: 'LPT Santé envoie la PEC', duration: 2400 },
      { label: 'Valider un paiement tiers payant sur le téléphone de vente', duration: 2800 },
    ],
  },
  {
    id: 'partial',
    label: 'Tiers Payant Partiel', color: '#f59e0b', emoji: '⚡',
    sub: 'Sans AMC',
    steps: [
      { label: "Charger AMO uniquement (pas d'AMC)", duration: 2400 },
      { label: 'Saisir le n° de commande', duration: 2600 },
      { label: 'LPT Santé envoie à la Sécurité Sociale', duration: 2400 },
      { label: 'Faire avancer la part AMC au client', duration: 2800 },
      { label: 'Valider la commande sur le téléphone de vente', duration: 2400 },
    ],
  },
]

function LptpFieldRow({ label, icon, state, value, color, isTyping = false, isNA = false }) {
  const isEmpty = state === 'empty' || state === 'hidden'
  const isActive = state === 'active'
  const isDone = state === 'done'
  return (
    <div style={{
      borderRadius: 10,
      background: isDone ? 'rgba(77,184,92,0.07)' : isActive ? `${color}10` : 'rgba(255,255,255,0.03)',
      border: `1px solid ${isDone ? 'rgba(77,184,92,0.25)' : isActive ? color + '45' : 'rgba(255,255,255,0.07)'}`,
      padding: '9px 14px', transition: 'all 0.45s',
      animation: isActive ? 'lptp-appear 0.35s ease' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2,
          color: isDone ? '#4db85c' : isActive ? color : 'rgba(255,255,255,0.28)' }}>
          {label}
        </span>
        {isDone && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#4db85c' }}>✓</span>}
        {isNA && <span style={{ marginLeft: 'auto', fontSize: 9, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>non requis</span>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, fontFamily: 'monospace',
        color: isEmpty || isNA ? 'rgba(255,255,255,0.12)' : '#fff',
        borderBottom: isActive ? `1px solid ${color}` : '1px solid transparent',
        paddingBottom: 1,
      }}>
        {isEmpty ? '──────────────' : isNA ? 'N/A (tiers payant partiel)' : isActive && isTyping
          ? <span>{value}<span style={{ animation: 'lptp-cursor 0.8s step-end infinite' }}>│</span></span>
          : value}
      </div>
    </div>
  )
}

function LptpMockScreen({ phaseIdx, stepIdx, resultOk }) {
  const isTest = phaseIdx === 0
  const isFact = phaseIdx === 1
  const isPartial = phaseIdx === 2
  const s = stepIdx
  const color = LPTS_PEC_PHASES[phaseIdx].color

  // Field states
  const amo    = s>0 ? 'done' : s===0 ? 'active' : 'empty'
  const amc    = isTest    ? (s>1?'done':s===1?'active':'empty')
               : isFact    ? (s>0?'done':s===0?'active':'empty')
               :              'na'
  const ordo   = isTest    ? (s>2?'done':s===2?'active':'empty') : 'hidden'
  const devis  = isTest    ? (s>3?'done':s===3?'active':'empty') : 'hidden'
  const cmd    = isTest    ? 'hidden'
               : isFact    ? (s>=1?(s===2?'active':s>2?'done':'empty'):'hidden')
               :              (s===1?'active':s>1?'done':'empty')
  const send   = isTest    ? (s===4?'active':s>4?'done':'empty')
               : isFact    ? (s===3?'active':s>3?'done':'empty')
               :              (s===2?'active':s>2?'done':'empty')
  const avance = isPartial ? (s===3?'active':s>3?'done':'hidden') : 'hidden'
  const valid  = (!isTest) ? (s===4?'active':s>4?'done':'hidden') : 'hidden'
  const result = isTest && s===5 ? 'active' : 'hidden'

  return (
    <div style={{
      width: '100%', maxWidth: 480, background: '#0b1a0d',
      border: '1px solid rgba(77,184,92,0.18)', borderRadius: 14,
      overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.55)',
      position: 'relative',
    }}>
      {/* Window chrome */}
      <div style={{ background: 'linear-gradient(135deg,#142418,#0c1a10)', padding: '10px 14px',
        borderBottom: '1px solid rgba(77,184,92,0.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#ff5f57','#febc2e','#28c840'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2, flex: 1, marginLeft: 8 }}>
          {[{ label: 'Test Suprême', active: isTest }, { label: 'Facturation', active: isFact || isPartial }].map((t, i) => (
            <div key={i} style={{
              padding: '3px 12px', borderRadius: '5px 5px 0 0', fontSize: 10, fontWeight: 700,
              background: t.active ? 'rgba(77,184,92,0.12)' : 'transparent',
              color: t.active ? '#4db85c' : 'rgba(255,255,255,0.22)',
              transition: 'all 0.4s',
            }}>{t.label}</div>
          ))}
          {isPartial && (
            <div style={{ padding: '3px 10px', borderRadius: '5px 5px 0 0', fontSize: 10, fontWeight: 700, color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}>
              ⚡ TP Partiel
            </div>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" width={18} height={18} style={{ objectFit: 'contain', opacity: 0.6 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* AMO */}
        <LptpFieldRow label="AMO · Sécurité Sociale" icon="🏥" state={amo} value="1 77 04 94 123 456 78" color={color} />

        {/* AMC */}
        {amc !== 'hidden' && (
          <LptpFieldRow label="AMC · Mutuelle" icon="🛡️" state={amc} value="Almerys · 98532001" color={color} isNA={amc === 'na'} />
        )}

        {/* Ordonnance (test only) */}
        {ordo !== 'hidden' && (
          <LptpFieldRow label="Ordonnance" icon="📋" state={ordo} value="OD -1.75 sph / OG -2.00 sph" color={color} />
        )}

        {/* N° Commande */}
        {cmd !== 'hidden' && (
          <LptpFieldRow label="N° de commande" icon="⌨️" state={cmd} value="8126722" color={color} isTyping />
        )}

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {devis !== 'hidden' && (
              <div style={{
                flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, textAlign: 'center',
                background: devis === 'active' ? 'rgba(0,171,233,0.15)' : devis === 'done' ? 'rgba(77,184,92,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${devis === 'active' ? '#00abe980' : devis === 'done' ? 'rgba(77,184,92,0.25)' : 'rgba(255,255,255,0.07)'}`,
                color: devis === 'active' ? '#00abe9' : devis === 'done' ? '#4db85c' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.4s',
              }}>
                {devis === 'active' ? '⚙️ Génération devis…' : devis === 'done' ? '✓ Devis prêt' : '⚙️ Générer devis'}
              </div>
            )}
            <div style={{
              flex: 1, padding: '9px 0', borderRadius: 8, fontSize: 11, fontWeight: 700, textAlign: 'center',
              background: send === 'active' ? `${color}20` : send === 'done' ? 'rgba(77,184,92,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${send === 'active' ? color + '70' : send === 'done' ? 'rgba(77,184,92,0.25)' : 'rgba(255,255,255,0.07)'}`,
              color: send === 'active' ? color : send === 'done' ? '#4db85c' : 'rgba(255,255,255,0.25)',
              transition: 'all 0.4s',
              animation: send === 'active' ? 'lptp-pulse 1.2s ease-in-out infinite' : 'none',
            }}>
              {send === 'active' ? '📤 Envoi en cours…' : send === 'done' ? '✓ Envoyé' : '📤 Envoyer'}
            </div>
          </div>

          {/* Facturation tab indicator */}
          {isFact && s >= 1 && s < 3 && (
            <div style={{ fontSize: 10, color: '#4db85c', fontWeight: 700, textAlign: 'center', padding: '4px 0', animation: 'lptp-slide 0.3s ease' }}>
              📂 Section Facturation active
            </div>
          )}

          {/* Avance AMC */}
          {avance !== 'hidden' && avance !== 'empty' && (
            <div style={{
              padding: '9px 12px', borderRadius: 9,
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              fontSize: 11, fontWeight: 600, color: '#f59e0b',
              animation: 'lptp-slide 0.35s ease',
            }}>
              💳 Le client règle la part AMC en CB / espèces
            </div>
          )}

          {/* Validation téléphone */}
          {valid !== 'hidden' && (
            <div style={{
              padding: '9px 12px', borderRadius: 9, textAlign: 'center',
              background: valid === 'done' ? 'rgba(77,184,92,0.1)' : 'rgba(0,171,233,0.08)',
              border: `1px solid ${valid === 'done' ? 'rgba(77,184,92,0.3)' : 'rgba(0,171,233,0.25)'}`,
              fontSize: 11, fontWeight: 700,
              color: valid === 'done' ? '#4db85c' : '#00abe9',
              animation: valid === 'active' ? 'lptp-appear 0.35s ease' : 'none',
            }}>
              {valid === 'done' ? '✅ Commande validée !' : '📱 En attente — valider sur le téléphone de vente'}
            </div>
          )}

          {/* Test Suprême result — popup overlay */}
          {result === 'active' && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 14, animation: 'lptp-appear 0.35s ease', zIndex: 10,
            }}>
              {resultOk ? (
                <div style={{
                  background: '#fff', borderRadius: 16, padding: '20px 22px 16px',
                  maxWidth: 270, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/logo-lpt-sante.png" width={60} height={60} style={{ objectFit: 'contain', display: 'block' }} />
                    <div style={{ position: 'absolute', top: -8, left: -4, display: 'flex', gap: 2 }}>
                      <span style={{ background: '#aaa', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 4px' }}>1.01</span>
                      <span style={{ background: '#e6a817', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 4px' }}>91</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 8, lineHeight: 1.2 }}>Remboursements enregistrés</div>
                  <div style={{ fontSize: 12, color: '#444', lineHeight: 1.5, marginBottom: 14 }}>Vous pouvez maintenant créer une commande Suprême.</div>
                  <div style={{ background: '#2a5080', borderRadius: 10, padding: '10px 0', fontSize: 13, fontWeight: 600, color: '#fff' }}>OK</div>
                </div>
              ) : (
                <div style={{
                  background: '#fff', borderRadius: 16, padding: '20px 22px 16px',
                  maxWidth: 280, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}>
                  <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
                    <svg width={60} height={60} viewBox="0 0 72 72" style={{ position: 'absolute', top: -16, left: -16 }}>
                      <polygon points="36,4 68,64 4,64" fill="#f5c842" stroke="white" strokeWidth="3" strokeLinejoin="round"/>
                      <text x="36" y="54" textAnchor="middle" fontSize="30" fontWeight="900" fill="white">!</text>
                    </svg>
                    <div style={{ marginTop: 8, marginLeft: 8 }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/assets/logo-lpt-sante.png" width={50} height={50} style={{ objectFit: 'contain', display: 'block' }} />
                        <div style={{ position: 'absolute', top: -8, left: -4, display: 'flex', gap: 2 }}>
                          <span style={{ background: '#aaa', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 4px' }}>1.01</span>
                          <span style={{ background: '#e6a817', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 4, padding: '1px 4px' }}>95</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 8, lineHeight: 1.2 }}>L&apos;envoi de devis OptoAMC a échoué</div>
                  <div style={{ fontSize: 11, color: '#444', lineHeight: 1.5, marginBottom: 14 }}>Erreur OptoAMC. Le remboursement est trop faible pour réaliser cette commande Suprême</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 600, color: '#2a5080', border: '1px solid #e0e0e0', background: '#f5f5f5' }}>Annuler</div>
                    <div style={{ flex: 1.5, background: '#2a5080', borderRadius: 10, padding: '10px 0', fontSize: 12, fontWeight: 700, color: '#fff' }}>Envoyer une PEC</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TVLptSantePec({ scenario }) {
  const phaseIdx = scenario === 'test' ? 0 : scenario === 'fact' ? 1 : scenario === 'partial' ? 2 : null
  const [stepIdx, setStepIdx] = useState(0)
  const [resultOk, setResultOk] = useState(true)
  const [loopKey, setLoopKey] = useState(0)

  useEffect(() => {
    setStepIdx(0)
    setResultOk(true)
    setLoopKey(k => k + 1)
  }, [scenario])

  useEffect(() => {
    if (phaseIdx === null) return
    const phase = LPTS_PEC_PHASES[phaseIdx]
    const step = phase.steps[stepIdx]
    // stepIdx may be out-of-bounds for the new phase during scenario switch —
    // the sibling useEffect([scenario]) will reset it; just bail out safely here.
    if (!step) return
    let altTimer

    if (phaseIdx === 0 && stepIdx === 5) {
      altTimer = setInterval(() => setResultOk(v => !v), 2200)
    }

    const t = setTimeout(() => {
      if (stepIdx < phase.steps.length - 1) {
        setStepIdx(s => s + 1)
      } else {
        setStepIdx(0)
        setResultOk(true)
        setLoopKey(k => k + 1)
      }
    }, step.duration)

    return () => { clearTimeout(t); if (altTimer) clearInterval(altTimer) }
  }, [phaseIdx, stepIdx, loopKey])

  if (phaseIdx === null) {
    return (
      <div style={{
        minHeight: '100vh', overflow: 'hidden',
        background: 'linear-gradient(160deg, #020d1a 0%, #010e05 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
      }}>
        <style>{LPTS_PEC_STYLES}</style>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" width={64} height={64} style={{ objectFit: 'contain', opacity: 0.35 }} />
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.28)', fontWeight: 600, textAlign: 'center' }}>
          Le formateur va sélectionner un scénario
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          {LPTS_PEC_PHASES.map((p) => (
            <div key={p.id} style={{
              padding: '6px 16px', borderRadius: 16, fontSize: 12, fontWeight: 700,
              background: `${p.color}08`, border: `1px solid ${p.color}20`, color: `${p.color}50`,
            }}>
              {p.emoji} {p.label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const phase = LPTS_PEC_PHASES[phaseIdx]

  return (
    <div style={{
      minHeight: '100vh', overflow: 'hidden',
      background: 'linear-gradient(160deg, #020d1a 0%, #010e05 100%)',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      <style>{LPTS_PEC_STYLES}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-lpt-sante.png" width={26} height={26} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>LPT Santé · Prise en charge</span>
        </div>
        <div style={{
          padding: '6px 18px', borderRadius: 16, fontSize: 12, fontWeight: 800,
          background: `${phase.color}18`, border: `1px solid ${phase.color}55`, color: phase.color,
        }}>
          {phase.emoji} {phase.label}
        </div>
      </div>

      {/* Main: mock screen left, steps right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', flex: 1, minHeight: 0 }}>
        {/* Left: Mock LPT Santé */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px 24px 32px' }}>
          <LptpMockScreen phaseIdx={phaseIdx} stepIdx={stepIdx} resultOk={resultOk} />
        </div>

        {/* Right: Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px 32px 24px 12px', gap: 8 }}>
          {phase.sub && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontWeight: 600 }}>
              {phase.sub}
            </div>
          )}

          {phase.steps.map((step, i) => (
            <div key={`${phaseIdx}-${i}-${loopKey}`} style={{
              display: 'flex', alignItems: 'flex-start', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              background: i === stepIdx ? `${phase.color}10` : i < stepIdx ? 'rgba(255,255,255,0.025)' : 'transparent',
              border: `1px solid ${i === stepIdx ? phase.color + '38' : i < stepIdx ? 'rgba(255,255,255,0.05)' : 'transparent'}`,
              opacity: i > stepIdx ? 0.38 : 1,
              transition: 'all 0.4s',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                background: i < stepIdx ? '#4db85c' : i === stepIdx ? phase.color : 'rgba(255,255,255,0.07)',
                color: '#fff', transition: 'all 0.3s',
                animation: i === stepIdx ? 'lptp-pulse 1.6s ease-in-out infinite' : 'none',
              }}>
                {i < stepIdx ? '✓' : i + 1}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{
                  fontSize: 13, lineHeight: 1.45,
                  fontWeight: i === stepIdx ? 700 : 400,
                  color: i < stepIdx ? 'rgba(255,255,255,0.4)' : '#fff',
                }}>
                  {step.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const LPTS_ANIM_STYLES = `
  @keyframes lpts-v-walk {
    0%   { transform: translateX(-50vw); opacity:0; }
    8%   { opacity:1; }
    42%  { transform: translateX(0); opacity:1; }
    65%  { transform: translateX(0); opacity:1; }
    80%  { transform: translateX(8px); opacity:0; }
    100% { transform: translateX(8px); opacity:0; }
  }
  @keyframes lpts-v-pec {
    0%   { transform: translateX(0) scale(0.7); opacity:0; }
    42%  { transform: translateX(0) scale(0.7); opacity:0; }
    52%  { transform: translateX(0) scale(1);   opacity:1; }
    80%  { transform: translateX(22vw) scale(0.95); opacity:1; }
    90%  { transform: translateX(22vw) scale(0.8);  opacity:0; }
    100% { transform: translateX(22vw) scale(0.8);  opacity:0; }
  }
  @keyframes lpts-relay {
    0%   { transform: translate(0,0) scale(0.8); opacity:0; }
    7%   { opacity:1; }
    72%  { opacity:1; transform: translate(var(--rx),var(--ry)) scale(0.95); }
    85%  { opacity:0; transform: translate(var(--rx),var(--ry)) scale(0.8); }
    100% { opacity:0; transform: translate(var(--rx),var(--ry)) scale(0.8); }
  }
  @keyframes lpts-float {
    0%,100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  @keyframes lpts-badge-pop {
    0%  { transform: scale(1); }
    30% { transform: scale(1.35); }
    60% { transform: scale(0.92); }
    100%{ transform: scale(1); }
  }
  @keyframes lpts-pulse-blue { 0%,100%{opacity:0.7} 50%{opacity:1} }
  @keyframes lpts-imac-glow {
    0%,100%{ box-shadow:0 0 22px rgba(0,100,255,0.32),0 8px 32px rgba(0,0,0,0.4); }
    50%    { box-shadow:0 0 48px rgba(0,130,255,0.62),0 8px 32px rgba(0,0,0,0.4); }
  }
`

const VENDOR_CLIENTS = ['🧑','👱','🧔','👧','👨','🧓']
const VENDOR_PEC_CYCLE = '7s'
const RELAY_DUR = '3s'

function TVLptSanteExplication() {
  const [phase, setPhase] = useState(0) // 0=day, 1=circuit
  const [pecCount, setPecCount] = useState(0)
  const [loopKey, setLoopKey] = useState(0)

  useEffect(() => {
    let count = 0
    const DAY = 12000, CIRCUIT = 9000
    const iv = setInterval(() => { count++; setPecCount(count) }, 1100)
    const t1 = setTimeout(() => { clearInterval(iv); setPhase(1) }, DAY)
    const t2 = setTimeout(() => { setPhase(0); setPecCount(0); setLoopKey(k => k + 1) }, DAY + CIRCUIT)
    return () => { clearInterval(iv); clearTimeout(t1); clearTimeout(t2) }
  }, [loopKey])

  const isDay = phase === 0
  const isCircuit = phase === 1

  // Circuit relay chips: LPT → SS → Mutuelle → € → LPT (triangular loop)
  const relayChips = isCircuit ? [
    // LPT Santé → SS (center → top-right)
    { key:'a0', top:'46%', left:'49%', rx:'24vw', ry:'-16vh', type:'pec', delay:'0s'   },
    { key:'a1', top:'48%', left:'49%', rx:'24vw', ry:'-14vh', type:'pec', delay:'0.7s' },
    { key:'a2', top:'50%', left:'49%', rx:'24vw', ry:'-17vh', type:'pec', delay:'1.4s' },
    // SS → Mutuelle (top-right → bottom-right)
    { key:'b0', top:'32%', left:'79%', rx:'0',    ry:'24vh',  type:'pec', delay:'0.8s' },
    { key:'b1', top:'30%', left:'81%', rx:'0',    ry:'26vh',  type:'pec', delay:'1.5s' },
    { key:'b2', top:'34%', left:'80%', rx:'0',    ry:'23vh',  type:'pec', delay:'2.2s' },
    // Mutuelle → LPT as € (bottom-right → center)
    { key:'c0', top:'68%', left:'80%', rx:'-24vw',ry:'-16vh', type:'eur', delay:'1.6s' },
    { key:'c1', top:'70%', left:'80%', rx:'-24vw',ry:'-14vh', type:'eur', delay:'2.3s' },
    { key:'c2', top:'66%', left:'80%', rx:'-24vw',ry:'-17vh', type:'eur', delay:'3.0s' },
  ] : []

  return (
    <div style={{
      position:'relative', minHeight:'100vh', overflow:'hidden',
      background: isDay
        ? 'linear-gradient(160deg,#03112a 0%,#061e10 100%)'
        : 'linear-gradient(160deg,#010a1a 0%,#030d05 100%)',
      transition:'background 1.5s ease',
      fontFamily:'system-ui,-apple-system,sans-serif',
    }}>
      <style>{LPTS_ANIM_STYLES}</style>

      {/* Topbar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 32px', position:'relative', zIndex:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit:'contain' }} />
          <div style={{ width:1, height:20, background:'rgba(255,255,255,0.15)' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={22} height={22} style={{ objectFit:'contain' }} />
          <span style={{ fontSize:12, color:'rgba(255,255,255,0.4)' }}>LPT Santé · Comment ça marche ?</span>
        </div>
        <div style={{
          padding:'5px 16px', borderRadius:20, fontSize:12, fontWeight:800,
          background: isDay?'rgba(77,184,92,0.15)':'rgba(0,171,233,0.15)',
          border:`1px solid ${isDay?'rgba(77,184,92,0.4)':'rgba(0,171,233,0.4)'}`,
          color: isDay?'#4db85c':'#00abe9',
          transition:'all 0.8s',
          animation: isCircuit?'lpts-pulse-blue 1s ease infinite':'none',
        }}>
          {isDay?'☀️ Journée — collecte des PEC':'🔄 Circuit de remboursement'}
        </div>
      </div>

      {/* Relay chips — circuit phase, absolute on root */}
      {relayChips.map(c => (
        <div key={`${c.key}-${loopKey}`} style={{
          position:'absolute', top:c.top, left:c.left, zIndex:30, pointerEvents:'none',
          background: c.type==='eur'
            ? 'linear-gradient(135deg,#b7860b,#f5c842)'
            : 'linear-gradient(135deg,#2d7a3a,#4db85c)',
          borderRadius:6, padding:'4px 9px',
          fontSize:c.type==='eur'?12:10, fontWeight:900, color:'#fff',
          boxShadow: c.type==='eur'?'0 2px 8px rgba(245,200,66,0.55)':'0 2px 8px rgba(77,184,92,0.5)',
          '--rx':c.rx, '--ry':c.ry,
          animation:`lpts-relay ${RELAY_DUR} ${c.delay} linear infinite`,
        }}>
          {c.type==='eur'?'€€':'PEC'}
        </div>
      ))}

      {/* 3-column scene */}
      <div style={{ display:'grid', gridTemplateColumns:'28% 44% 28%', height:'calc(100vh - 62px)' }}>

        {/* ── LEFT: Single big vendor ── */}
        <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', top:'8%', left:0, right:0, textAlign:'center',
            fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>
            🏪 Magasin LPT
          </div>

          {/* Walking clients (staggered into vendor) */}
          {isDay && VENDOR_CLIENTS.slice(0,3).map((emoji, i) => (
            <div key={i} style={{
              position:'absolute', left:'8%', top:`${36+i*10}%`,
              fontSize:22, userSelect:'none',
              animation:`lpts-v-walk ${VENDOR_PEC_CYCLE} ${['0s','-2.33s','-4.66s'][i]} linear infinite`,
            }}>{emoji}</div>
          ))}

          {/* Big vendor */}
          <div style={{ textAlign:'center', position:'relative', zIndex:2 }}>
            <div style={{ fontSize:58, animation:'lpts-float 3s ease-in-out infinite', userSelect:'none' }}>🧑‍💼</div>
            <div style={{ fontSize:10, color:'#4db85c', fontWeight:800, marginTop:4, letterSpacing:1 }}>VENDEUR</div>
          </div>

          {/* PEC chips flying from vendor to center */}
          {isDay && [0,1,2].map(i => (
            <div key={`vpec-${i}-${loopKey}`} style={{
              position:'absolute', right:'6%', top:`${44+i*5}%`,
              background:'linear-gradient(135deg,#2d7a3a,#4db85c)',
              borderRadius:5, padding:'3px 7px', fontSize:9, fontWeight:800, color:'#fff',
              boxShadow:'0 2px 8px rgba(77,184,92,0.4)', pointerEvents:'none', zIndex:5,
              animation:`lpts-v-pec ${VENDOR_PEC_CYCLE} ${['0s','-2.33s','-4.66s'][i]} linear infinite`,
            }}>PEC</div>
          ))}

          {/* Bottom stat */}
          <div style={{ position:'absolute', bottom:'7%', left:0, right:0, textAlign:'center' }}>
            <div style={{ fontSize:15, fontWeight:800, color:'#4db85c' }}>⚡ 5 min</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.3)' }}>par prise en charge</div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.15)', marginTop:2 }}>vs 30+ min ailleurs</div>
          </div>
        </div>

        {/* ── CENTER: iMac LPT Santé ── */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>

          {/* iMac */}
          <div style={{ animation:'lpts-float 3s ease-in-out infinite', display:'flex', flexDirection:'column', alignItems:'center' }}>
            {/* Screen */}
            <div style={{
              width:250, height:186,
              background: isDay?'#080f1a':'#050e1c',
              border:`9px solid ${isDay?'#0055cc':'#00abe9'}`,
              borderRadius:'16px 16px 4px 4px',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              position:'relative',
              animation: isDay?'lpts-imac-glow 2.5s ease-in-out infinite':'lpts-pulse-blue 1s ease infinite',
              transition:'border-color 0.8s, background 0.8s',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo-lpt-sante.png" width={88} height={88} style={{
                objectFit:'contain',
                filter:`drop-shadow(0 0 22px ${isDay?'rgba(77,184,92,0.5)':'rgba(0,171,233,0.8)'})`,
                transition:'filter 0.8s',
              }} />
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)', marginTop:6, fontWeight:700 }}>LPT Santé</div>
              {/* PEC counter badge */}
              {isDay && pecCount > 0 && (
                <div style={{
                  position:'absolute', top:-13, right:-13,
                  background:'linear-gradient(135deg,#2d7a3a,#4db85c)',
                  borderRadius:20, minWidth:34, height:34, padding:'0 7px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:15, fontWeight:900, color:'#fff',
                  boxShadow:'0 3px 10px rgba(0,0,0,0.4)',
                  animation:'lpts-badge-pop 0.25s ease',
                }}>{pecCount}</div>
              )}
              {/* € badge during circuit */}
              {isCircuit && (
                <div style={{
                  position:'absolute', top:-13, right:-13,
                  background:'#f5c842', borderRadius:20, minWidth:34, height:34, padding:'0 7px',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14, fontWeight:900, color:'#1a1000',
                  boxShadow:'0 3px 10px rgba(245,200,66,0.4)',
                  animation:'lpts-badge-pop 0.5s ease 2s both',
                }}>€€</div>
              )}
            </div>
            {/* Chin */}
            <div style={{
              width:250, height:28, borderRadius:'0 0 8px 8px',
              background: isDay?'#0044bb':'#00359e',
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'background 0.8s',
            }}>
              <div style={{ width:50, height:3, borderRadius:2, background:'rgba(0,0,0,0.28)' }} />
            </div>
            {/* Neck */}
            <div style={{ width:24, height:52, background:'#00359e', transition:'background 0.8s' }} />
            {/* Base */}
            <div style={{ width:110, height:8, background:'#002e88', borderRadius:4, transition:'background 0.8s' }} />
          </div>

          {/* PEC storage grid (day only) */}
          {isDay && pecCount > 0 && (
            <div style={{
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(77,184,92,0.15)',
              borderRadius:8, padding:'6px 10px', display:'flex', flexWrap:'wrap', gap:3, width:144,
            }}>
              {Array(Math.min(pecCount,18)).fill(0).map((_,i) => (
                <div key={i} style={{
                  width:14, height:14, borderRadius:3,
                  background:'linear-gradient(135deg,#2d7a3a,#4db85c)',
                  animation:'lpts-badge-pop 0.2s ease',
                }} />
              ))}
            </div>
          )}

          <div style={{ textAlign:'center', fontSize:11, color:'rgba(255,255,255,0.32)' }}>
            {isDay?'Collecte les PEC toute la journée':'🔄 Remboursements en circuit…'}
          </div>
        </div>

        {/* ── RIGHT: SS → Mutuelle (chain with arrow) ── */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, padding:'0 16px' }}>
          {/* SS */}
          <div style={{
            width:'100%',
            background: isCircuit?'rgba(0,171,233,0.08)':'rgba(239,68,68,0.07)',
            border:`1px solid ${isCircuit?'rgba(0,171,233,0.45)':'rgba(239,68,68,0.3)'}`,
            borderRadius:16, padding:'18px 14px', textAlign:'center', transition:'all 0.6s',
          }}>
            <div style={{ fontSize:38, marginBottom:6 }}>🏥</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:3 }}>Sécurité Sociale</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>
              {isCircuit?'Reçoit et transfère la PEC':'En attente des PEC'}
            </div>
          </div>

          {/* Connector arrow SS → Mutuelle */}
          <div style={{
            display:'flex', flexDirection:'column', alignItems:'center', gap:2,
            opacity: isCircuit?1:0.25, transition:'opacity 0.6s',
          }}>
            <div style={{ width:2, height:14, background:'rgba(0,171,233,0.5)', borderRadius:2 }} />
            <div style={{ fontSize:16, color:'#00abe9', lineHeight:1, animation:isCircuit?'lpts-pulse-blue 1s ease infinite':'none' }}>▼</div>
            <div style={{ width:2, height:14, background:'rgba(0,171,233,0.5)', borderRadius:2 }} />
          </div>

          {/* Mutuelle */}
          <div style={{
            width:'100%',
            background: isCircuit?'rgba(245,200,66,0.08)':'rgba(0,171,233,0.07)',
            border:`1px solid ${isCircuit?'rgba(245,200,66,0.5)':'rgba(0,171,233,0.3)'}`,
            borderRadius:16, padding:'18px 14px', textAlign:'center', transition:'all 0.6s',
          }}>
            <div style={{ fontSize:38, marginBottom:6 }}>🛡️</div>
            <div style={{ fontSize:13, fontWeight:800, color:'#fff', marginBottom:3 }}>Mutuelle</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)' }}>
              {isCircuit?'Rembourse LPT Santé en €':'En attente des PEC'}
            </div>
            {isCircuit && (
              <div style={{ marginTop:8, fontSize:18, fontWeight:900, color:'#f5c842', animation:'lpts-badge-pop 0.5s ease' }}>€€€</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TVLptSanteIntro({ page, sessionCode }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a1a 55%, #0d3b1a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={28} height={28} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>LPT Santé</span>
        </div>
      </div>

      {/* Corps : logo + question | réponses */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '3fr 2fr',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* Gauche : logo + question */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 32, padding: '40px 56px',
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={140} height={140} style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(77,184,92,0.4))' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>LPT Santé</div>
            <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
              {page.titre}
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>
              Répondez sur votre téléphone
            </p>
          </div>
        </div>

        {/* Droite : réponses anonymes */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
          <OpenAnswersFeed sessionCode={sessionCode} pageId={page.id} />
        </div>
      </div>
    </div>
  )
}

function TVPause({ page, pageIndex, total, moduleLabel, sessionCode }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Corps : question (+ réponses si la page en collecte) */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: page.noAnswerBox ? '1fr' : '3fr 2fr',
        gap: 0, padding: '0 0 0 0',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* Question */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 28, padding: '40px 48px',
          borderRight: page.noAnswerBox ? 'none' : '1px solid rgba(255,255,255,0.07)',
        }}>
          {page.icon && (
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 60px rgba(0,171,233,0.18)',
            }}>
              <span style={{ fontSize: 60, lineHeight: 1 }}>{page.icon}</span>
            </div>
          )}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
              {page.titre}
            </h1>
            {page.sousTitre && (
              <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', fontWeight: 400, maxWidth: 700 }}>
                {page.sousTitre}
              </p>
            )}
          </div>
        </div>

        {/* Réponses — seulement pour les pages qui en collectent */}
        {!page.noAnswerBox && (
          <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
            <OpenAnswersFeed sessionCode={sessionCode} pageId={page.id} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── TV Troubles Intro (type = troubles-intro) ─────────────────────
function TVTroublesIntro({ page, pageIndex, total, moduleLabel }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 36,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <div style={{
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(0,171,233,0.1)', border: '2px solid rgba(0,171,233,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 80px rgba(0,171,233,0.15)',
        }}>
          <span style={{ fontSize: 80, lineHeight: 1 }}>{page.icon}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '5px 18px', fontSize: 12, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 22 }}>
            Les bases de l&apos;optique
          </div>
          <h1 style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1.15, maxWidth: 800 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)', marginTop: 18, fontStyle: 'italic' }}>
            {page.sousTitre}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── TV Troubles List (type = troubles-list) ───────────────────────
function TVTroublesList({ page, pageIndex, total, moduleLabel }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    const timers = (page.troubles || []).map((_, i) =>
      setTimeout(() => setVisibleCount(c => Math.max(c, i + 1)), 300 + i * 280)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', position: 'relative', zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 64px 48px', gap: 32 }}>
        {/* Titre */}
        <div>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)',
            borderRadius: 20, padding: '4px 16px',
            fontSize: 12, fontWeight: 700, color: '#00abe9',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
          }}>Formation LPT</div>
          <h1 style={{ fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 6 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            {page.sousTitre}
          </p>
        </div>

        {/* Liste */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
          {(page.troubles || []).map((t, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 32,
              background: i < visibleCount ? `${t.color}09` : 'transparent',
              border: `1px solid ${i < visibleCount ? t.color + '28' : 'transparent'}`,
              borderLeft: `5px solid ${i < visibleCount ? t.color : 'transparent'}`,
              borderRadius: 18, padding: '24px 36px',
              opacity: i < visibleCount ? 1 : 0,
              transform: i < visibleCount ? 'translateX(0)' : 'translateX(-40px)',
              transition: 'all 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: t.color, letterSpacing: 1, minWidth: 28, opacity: 0.7 }}>
                {t.num}
              </span>
              <span style={{ fontSize: 36, fontWeight: 800, color: '#fff', minWidth: 300, letterSpacing: -0.5 }}>
                {t.nom}
              </span>
              <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.58)', lineHeight: 1.5, fontWeight: 400 }}>
                {t.def}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Helpers saisie TV ─────────────────────────────────────────────
const tvFmtSph = (v) => {
  if (Math.abs(v) < 0.001) return '0,00'
  const abs = Math.abs(v).toFixed(2).replace('.', ',')
  return v > 0 ? `+${abs}` : `−${abs}`
}
const tvFmtCyl = (v) => {
  if (Math.abs(v) < 0.001) return null
  const abs = Math.abs(v).toFixed(2).replace('.', ',')
  return `(−${abs})`
}

function TVPrescLine({ eye }) {
  const parts = [tvFmtSph(eye.sphere)]
  const cyl = tvFmtCyl(eye.cylindre)
  if (cyl) { parts.push(cyl); parts.push(`${eye.axe}°`) }
  return <span>{parts.join(' ')}</span>
}

// ── TV Saisie Interactive — phase correction (round 1 ou 2) ───────
function TVSaisieCorrection({ moduleLabel, round, sessionCode }) {
  const [results, setResults] = useState([])

  useEffect(() => {
    // module_results n'a pas de session_code sur ces lignes (clé d'upsert
    // collaborateur+module_id+week_date) — sans filtre sur la date du jour,
    // cet écran remontait les résultats de TOUTES les semaines/salles/
    // formateurs ayant déjà fait cet exercice, pas seulement la session en cours.
    const today = new Date().toISOString().slice(0, 10)
    const poll = async () => {
      const rows = await sbSelect('module_results', `module_id=eq.optique-saisie-r${round}&week_date=eq.${today}`)
      setResults(rows || [])
    }
    poll()
    const t = setInterval(poll, 2500)
    return () => clearInterval(t)
  }, [round, sessionCode])

  const wrongCount = results.filter(r => r.score < r.score_total).length
  const perfectCount = results.length - wrongCount

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
      <div style={{ position: 'absolute', top: 28, left: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
      </div>
      <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 14, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5 }}>
        Correction — Round {round}
      </div>
      <div style={{ display: 'flex', gap: 40 }}>
        <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 20, padding: '24px 48px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#4ade80' }}>{perfectCount}</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 6 }}>formé{perfectCount > 1 ? 's' : ''} sans erreur</div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 20, padding: '24px 48px', textAlign: 'center' }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: '#f87171' }}>{wrongCount}</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 6 }}>formé{wrongCount > 1 ? 's' : ''} avec au moins une erreur</div>
        </div>
      </div>
    </div>
  )
}

// ── TV Saisie Interactive (type = saisie-interactive) ─────────────
function TVSaisieInteractive({ page, pageIndex, total, moduleLabel, saisieStage, sessionCode }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  const round = (saisieStage === 'r2-entry' || saisieStage === 'r2-correction') ? 2 : 1
  const isCorrection = saisieStage === 'r1-correction' || saisieStage === 'r2-correction'
  const caseIndexes = (SAISIE_ROUNDS.find(r => r.round === round) || SAISIE_ROUNDS[0]).caseIndexes
  const roundExercises = caseIndexes.map(i => SAISIE_EXERCISES[i])

  if (isCorrection) {
    return <TVSaisieCorrection moduleLabel={moduleLabel} round={round} sessionCode={sessionCode} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Corps */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 56px 40px', gap: 28,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        {/* Badge */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)', borderRadius: 20, padding: '5px 18px', fontSize: 13, fontWeight: 700, color: '#00abe9' }}>
            ⌨️&nbsp; Exercice pratique · Round {round}
          </div>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginTop: 10, marginBottom: 4 }}>{page.titre}</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>Saisissez ces corrections depuis votre téléphone</p>
        </div>

        {/* 3 cas côte à côte */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, flex: 1 }}>
          {roundExercises.map((ex, i) => (
            <div key={ex.id} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderTop: '4px solid #00abe9', borderRadius: 20, padding: '28px 28px 24px',
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2 }}>{ex.label}</div>

              {/* Lignes OD / OG */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['OD', ex.od], ['OG', ex.og]].map(([label, eye]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.4)', minWidth: 28 }}>{label}</span>
                    <span style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                      <TVPrescLine eye={eye} />
                    </span>
                  </div>
                ))}
                {ex.add != null && (
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#4ade80', marginTop: 4 }}>
                    Add +{ex.add.toFixed(2).replace('.', ',')}
                  </div>
                )}
              </div>

              {/* Grille détail */}
              <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 1fr', background: 'rgba(255,255,255,0.04)' }}>
                  <div />
                  {['Sphère', 'Cyl.', 'Axe'].map(h => (
                    <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>{h}</div>
                  ))}
                </div>
                {[['OD', ex.od], ['OG', ex.og]].map(([label, eye]) => (
                  <div key={label} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 1fr 1fr', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center' }}>{label}</div>
                    <div style={{ padding: '10px 12px', fontSize: 16, fontWeight: 700, color: '#38bdf8', borderLeft: '1px solid rgba(255,255,255,0.06)', fontVariantNumeric: 'tabular-nums' }}>{tvFmtSph(eye.sphere)}</div>
                    <div style={{ padding: '10px 12px', fontSize: 16, fontWeight: 700, color: '#fb923c', borderLeft: '1px solid rgba(255,255,255,0.06)', fontVariantNumeric: 'tabular-nums' }}>{Math.abs(eye.cylindre) < 0.001 ? '—' : tvFmtCyl(eye.cylindre)}</div>
                    <div style={{ padding: '10px 12px', fontSize: 16, fontWeight: 700, color: '#c084fc', borderLeft: '1px solid rgba(255,255,255,0.06)', fontVariantNumeric: 'tabular-nums' }}>{eye.axe === 0 && Math.abs(eye.cylindre) < 0.001 ? '—' : `${eye.axe}°`}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pill bas */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12, alignSelf: 'center',
          background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
          borderRadius: 40, padding: '14px 32px',
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>📱 Saisissez les corrections sur votre téléphone</span>
        </div>
      </div>
    </div>
  )
}

// ── TV Entraînement oral (type = entrainement-oral) ──────────────
function TVEntrainementOral({ page, pageIndex, total, moduleLabel }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, transition: 'all .3s', width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Corps centré */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <div style={{ fontSize: 80 }}>🗣️</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center', marginBottom: 14 }}>Questions orales</div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, maxWidth: 820, margin: '0 auto 16px' }}>
            Répondez sur votre téléphone
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Le formateur vous pose des questions — saisissez votre réponse</p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)', borderRadius: 40, padding: '16px 36px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>📱 Regardez votre téléphone</span>
        </div>
      </div>
    </div>
  )
}

// ── TV Mini-jeu Questions ──────────────────────────────────────────
function TVMiniJeuQuestions() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 32px', flexShrink: 0 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
        <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Mini Jeux · Questions</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <div style={{ fontSize: 80 }}>🗣️</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center', marginBottom: 14 }}>Jeu des questions</div>
          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, maxWidth: 820, margin: '0 auto 16px' }}>
            Répondez sur votre téléphone
          </h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Le formateur vous pose des questions — saisissez votre réponse</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)', borderRadius: 40, padding: '16px 36px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>📱 Regardez votre téléphone</span>
        </div>
      </div>
    </div>
  )
}

// ── TV Entreprise : freins à l'achat ─────────────────────────────
const TV_BUBBLE_COLORS = ['rgba(0,171,233,0.9)','rgba(74,222,128,0.9)','rgba(245,158,11,0.9)','rgba(167,139,250,0.9)','rgba(244,114,182,0.9)','rgba(52,211,153,0.9)']

// ── Décalages "bazard" déterministes (12 positions, cycle) ────────
// marginTop : décale chaque bulle vers le bas différemment → lignes brisées
// rotation  : angle naturel, jamais parallèle
// borderRadius : formes légèrement différentes
const B_MT = [0, 18, 6, 28, 12, 22, 4, 32, 10, 24, 2, 16]     // marginTop px
const B_ROT = [-5, 3, -2, 6, -4, 1, -7, 4, -1, 5, -3, 7]       // rotation deg
const B_RAD = [20, 26, 18, 28, 22, 16, 24, 20, 26, 18, 22, 16]  // borderRadius px

// ── Composant partagé : layout TV pour questions libres ───────────
function TVBubbleScreen({ page, pageIndex, total, accent, children, waiting, revealBanner, answerCount = 0, participantCount = 0 }) {
  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      position: 'relative',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Présentation de l&apos;entreprise</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 22 : 5, background: i === pageIndex ? accent : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>

      {/* Question */}
      <div style={{ textAlign: 'center', padding: '10px 120px 0', flexShrink: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Question ouverte
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {page.titre}
        </h1>
      </div>

      {/* Zone bulles — alignItems flex-start permet les décalages marginTop */}
      <div style={{
        flex: 1,
        display: 'flex', flexWrap: 'wrap',
        columnGap: 16, rowGap: 40,
        justifyContent: 'center', alignItems: 'flex-start', alignContent: 'flex-start',
        padding: '28px 60px 16px',
        overflow: 'hidden',
      }}>
        {waiting ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 40 }}>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' }}>
              En attente des réponses…
            </div>
            {participantCount > 0 && (
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
                {answerCount}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                  / {participantCount} réponse{answerCount > 1 ? 's' : ''} reçue{answerCount > 1 ? 's' : ''}
                </span>
              </div>
            )}
            {answerCount > 0 && (
              <div style={{ display: 'flex', gap: 8 }}>
                {Array.from({ length: answerCount }).map((_, i) => (
                  <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length] }} />
                ))}
              </div>
            )}
          </div>
        ) : children}
      </div>
      {revealBanner}
    </div>
  )
}

function TVEntrepriseFreins({ page, pageIndex, total, freinsResponses, revealFreins, sessionCode }) {
  const entries = Object.entries(freinsResponses || {})
  const accent = '#00abe9'
  const [participantCount, setParticipantCount] = useState(0)
  useEffect(() => {
    if (!sessionCode) return
    const poll = () => sbSelect('participants', `session_code=eq.${encodeURIComponent(sessionCode)}`).then(r => setParticipantCount((r || []).length)).catch(() => {})
    poll(); const t = setInterval(poll, 5000); return () => clearInterval(t)
  }, [sessionCode])
  const shouldShow = !!revealFreins

  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent={accent} waiting={!shouldShow} answerCount={entries.length} participantCount={participantCount}>
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          background: 'rgba(5,20,55,0.88)',
          border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: B_RAD[i % 12],
          padding: '14px 22px',
          maxWidth: 300,
          fontSize: 17, fontWeight: 600, color: '#fff', lineHeight: 1.45,
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}30`,
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: `${i * 0.07}s`,
          marginTop: B_MT[i % 12],
          transform: `rotate(${B_ROT[i % 12]}deg)`,
        }}>
          {resp.text}
        </div>
      ))}
    </TVBubbleScreen>
  )
}

// ── TV Entreprise : prix moyen ────────────────────────────────────
function TVEntreprisePrix({ page, pageIndex, total, prixResponses, revealPrix, sessionCode }) {
  const entries = Object.entries(prixResponses || {})
  const accent = '#f59e0b'
  const [participantCount, setParticipantCount] = useState(0)
  useEffect(() => {
    if (!sessionCode) return
    const poll = () => sbSelect('participants', `session_code=eq.${encodeURIComponent(sessionCode)}`).then(r => setParticipantCount((r || []).length)).catch(() => {})
    poll(); const t = setInterval(poll, 5000); return () => clearInterval(t)
  }, [sessionCode])
  const shouldShow = !!revealPrix

  const prixBanner = revealPrix ? (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(135deg, rgba(245,158,11,0.97), rgba(217,119,6,0.97))',
      backdropFilter: 'blur(16px)',
      padding: '28px 48px',
      display: 'flex', alignItems: 'center', gap: 20,
      animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <span style={{ fontSize: 36 }}>💡</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>La bonne réponse</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>entre 400 et 500 euros</div>
      </div>
    </div>
  ) : null

  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent={accent} waiting={!shouldShow} answerCount={entries.length} participantCount={participantCount} revealBanner={prixBanner}>
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          background: 'rgba(5,20,55,0.88)',
          border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: B_RAD[i % 12],
          padding: '16px 28px',
          backdropFilter: 'blur(16px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.5)`,
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: `${i * 0.07}s`,
          marginTop: B_MT[i % 12],
          transform: `rotate(${B_ROT[i % 12]}deg)`,
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{resp.text}</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: accent }}>€</span>
        </div>
      ))}
    </TVBubbleScreen>
  )
}

function TVEntreprisePromesse({ page, pageIndex, total, promesseResponses, revealPromesse, sessionCode }) {
  const entries = Object.entries(promesseResponses || {})
  const accent = '#34d399'
  const [participantCount, setParticipantCount] = useState(0)
  useEffect(() => {
    if (!sessionCode) return
    const poll = () => sbSelect('participants', `session_code=eq.${encodeURIComponent(sessionCode)}`).then(r => setParticipantCount((r || []).length)).catch(() => {})
    poll(); const t = setInterval(poll, 5000); return () => clearInterval(t)
  }, [sessionCode])
  const shouldShow = !!revealPromesse

  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent={accent} waiting={!shouldShow} answerCount={entries.length} participantCount={participantCount}>
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          background: 'rgba(5,20,55,0.88)',
          border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: B_RAD[i % 12], padding: '14px 22px', maxWidth: 300,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: `${i * 0.07}s`,
          marginTop: B_MT[i % 12],
          transform: `rotate(${B_ROT[i % 12]}deg)`,
        }}>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>{resp.text}</span>
        </div>
      ))}
    </TVBubbleScreen>
  )
}

function TVEntrepriseVentesOpticien({ page, pageIndex, total, ventesResponses, revealVentes, sessionCode }) {
  const entries = Object.entries(ventesResponses || {})
  const accent = '#a78bfa'
  const [participantCount, setParticipantCount] = useState(0)
  useEffect(() => {
    if (!sessionCode) return
    const poll = () => sbSelect('participants', `session_code=eq.${encodeURIComponent(sessionCode)}`).then(r => setParticipantCount((r || []).length)).catch(() => {})
    poll(); const t = setInterval(poll, 5000); return () => clearInterval(t)
  }, [sessionCode])
  const shouldShow = !!revealVentes

  const ventesBanner = revealVentes ? (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: 'linear-gradient(135deg, rgba(124,58,237,0.97), rgba(109,40,217,0.97))',
      backdropFilter: 'blur(16px)',
      padding: '28px 48px',
      display: 'flex', alignItems: 'center', gap: 20,
      animation: 'slideUp 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <span style={{ fontSize: 36 }}>💡</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>La bonne réponse</div>
        <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1 }}>entre 3 et 5 paires</div>
      </div>
    </div>
  ) : null

  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent={accent} waiting={!shouldShow} answerCount={entries.length} participantCount={participantCount} revealBanner={ventesBanner}>
      {entries.map(([pName, resp], i) => (
        <div key={pName} style={{
          background: 'rgba(5,20,55,0.88)', border: `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
          borderRadius: B_RAD[i % 12], padding: '16px 28px', backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          animationDelay: `${i * 0.07}s`,
          marginTop: B_MT[i % 12],
          transform: `rotate(${B_ROT[i % 12]}deg)`,
          display: 'flex', alignItems: 'baseline', gap: 6,
        }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{resp.text}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: accent }}>paires</span>
        </div>
      ))}
    </TVBubbleScreen>
  )
}

// ── TV Entreprise helpers ─────────────────────────────────────────
function TVEntrepriseShell({ page, pageIndex, total, children }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => { setEntered(false); const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t) }, [page.id])
  const accent = page.color || '#00abe9'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Présentation de l&apos;entreprise</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 22 : 5, background: i === pageIndex ? accent : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0 48px 32px', opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(20px)', transition: 'all .5s ease' }}>
        {children}
      </div>
    </div>
  )
}

function TVVideoLPT({ audioUnlocked }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.muted = !audioUnlocked
    v.play().catch(() => {})
    return () => { v.pause() }
  }, [audioUnlocked])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <video
        ref={videoRef}
        src="/assets/Pr%C3%A9sentation%20LPT.mp4"
        playsInline
        style={{ width: '100%', height: '100vh', objectFit: 'contain' }}
      />
    </div>
  )
}

function TVEntrepriseChiffres({ page, pageIndex, total }) {
  const [visible, setVisible] = useState(0)
  useEffect(() => {
    setVisible(0)
    const timers = (page.stats || []).map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 600 + i * 700)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id])

  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Chiffres clés
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{page.titre}</h1>
      </div>

      {/* Grille de tuiles */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', flex: 1, alignContent: 'center' }}>
        {(page.stats || []).map((stat, i) => (
          <div key={i} style={{
            width: 'calc(33% - 14px)', minWidth: 200, maxWidth: 280,
            background: 'rgba(255,255,255,0.04)',
            border: `2px solid ${stat.color}55`,
            borderRadius: 20, padding: '32px 28px',
            textAlign: 'center',
            opacity: i < visible ? 1 : 0,
            transform: i < visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 10 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', fontWeight: 500, lineHeight: 1.4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function SingleCounter({ value, unit, sub, color, active, delay = 0, fontSize = 100 }) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    if (!active) { setCount(0); setStarted(false); return }
    const t = setTimeout(() => {
      setStarted(true)
      setCount(0)
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0
      const interval = setInterval(() => {
        current += increment
        if (current >= value) { setCount(value); clearInterval(interval) }
        else setCount(Math.floor(current))
      }, duration / steps)
    }, delay)
    return () => clearTimeout(t)
  }, [active, value, delay])

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      padding: '28px 32px',
      background: `radial-gradient(ellipse at center, ${color}10 0%, transparent 70%)`,
      border: `1px solid ${color}25`, borderRadius: 20,
      opacity: active && !started ? 0 : 1,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
        <span style={{ fontSize: fontSize * 0.22, fontWeight: 800, color, marginTop: fontSize * 0.12 }}>+</span>
        <span style={{ fontSize, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: `0 0 50px ${color}55` }}>
          {count.toLocaleString('fr-FR')}
        </span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{unit}</div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 30, padding: '6px 20px' }}>{sub}</div>
    </div>
  )
}

function CounterAnimation({ counters, color, active }) {
  if (!counters) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '24px 16px' }}>
      {counters.map((c, i) => (
        <SingleCounter key={i} value={c.value} unit={c.unit} sub={c.sub} color={color} active={active} delay={c.delay} fontSize={i === 0 ? 90 : 72} />
      ))}
    </div>
  )
}

function TVEntrepriseForceLPT({ page, pageIndex, total, modelePoint, audioUnlocked }) {
  const [visible, setVisible] = useState(0)
  const videoRef = useRef(null)

  // Auto-reveal animation quand aucun point sélectionné
  useEffect(() => {
    if (modelePoint !== null) return
    setVisible(0)
    const timers = (page.items || []).map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 600 + i * 700)
    )
    return () => timers.forEach(clearTimeout)
  }, [page.id, modelePoint])

  // Lecture vidéo synchronisée avec audioUnlocked
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (modelePoint !== null) {
      v.muted = !audioUnlocked
      v.play().catch(() => {})
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [modelePoint, audioUnlocked])

  const selectedItem = modelePoint !== null ? (page.items || [])[modelePoint] : null

  // ── Mode vidéo : point sélectionné ──
  if (selectedItem) {
    return (
      <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
        <div style={{ display: 'grid', gridTemplateColumns: '38% 62%', gap: 48, flex: 1, alignItems: 'center' }}>
          {/* Gauche — point sélectionné */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2 }}>
              Les clés de notre modèle
            </div>
            <div style={{
              background: `${selectedItem.color}15`,
              border: `2px solid ${selectedItem.color}60`,
              borderLeft: `6px solid ${selectedItem.color}`,
              borderRadius: 20, padding: '28px 32px',
            }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: selectedItem.color, marginBottom: 16, boxShadow: `0 0 16px ${selectedItem.color}` }} />
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
                {selectedItem.label}
              </div>
            </div>
            {/* Autres points en petit */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(page.items || []).map((item, i) => i !== modelePoint && (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.3 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Droite — vidéo ou animation */}
          <div style={{ borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 60px rgba(0,0,0,0.6)', background: selectedItem.video ? '#000' : 'transparent' }}>
            {selectedItem.video ? (
              <video
                ref={videoRef}
                src={selectedItem.video}
                preload="none"
                loop
                playsInline
                muted={!audioUnlocked}
                style={{ width: '100%', display: 'block', maxHeight: '65vh', objectFit: 'contain' }}
              />
            ) : selectedItem.animation === 'counter' ? (
              <CounterAnimation
                counters={selectedItem.counters}
                color={selectedItem.color}
                active={modelePoint !== null}
              />
            ) : (
              <div style={{ padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <ZeroInterChain compact={false} />
              </div>
            )}
          </div>
        </div>
      </TVEntrepriseShell>
    )
  }

  // ── Mode normal : grille des 5 points ──
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Les clés de notre modèle
        </div>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{page.titre}</h1>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center', flex: 1, alignContent: 'center' }}>
        {(page.items || []).map((item, i) => (
          <div key={i} style={{
            width: 'calc(33% - 14px)', minWidth: 220, maxWidth: 300,
            background: 'rgba(255,255,255,0.04)',
            border: `2px solid ${item.color}55`,
            borderRadius: 20, padding: '32px 28px',
            textAlign: 'center',
            opacity: i < visible ? 1 : 0,
            transform: i < visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, margin: '0 auto 16px', boxShadow: `0 0 12px ${item.color}` }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}


function TVEntrepriseNaissance({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: 48, paddingTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
          Présentation de l&apos;entreprise
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 14 }}>
          {page.titre}
        </h1>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
          &ldquo;{page.sousTitre}&rdquo;
        </p>
      </div>

      {/* Deux fondateurs côte à côte */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 80 }}>
        {/* Paul Morlet */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 220, height: 220, borderRadius: '50%', overflow: 'hidden',
            border: '4px solid rgba(0,171,233,0.6)',
            boxShadow: '0 0 0 8px rgba(0,171,233,0.12), 0 16px 48px rgba(0,171,233,0.35)',
          }}>
            <Image src="/assets/photo-Paul.jpg" alt="Paul Morlet" width={220} height={220}
              style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Paul Morlet</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Fondateur &amp; CEO</div>
          </div>
        </div>

        {/* Séparateur & */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 88 }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: 'rgba(255,255,255,0.3)',
          }}>&amp;</div>
        </div>

        {/* Xavier Niel */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 220, height: 220, borderRadius: '50%', overflow: 'hidden',
            border: '4px solid rgba(0,171,233,0.6)',
            boxShadow: '0 0 0 8px rgba(0,171,233,0.12), 0 16px 48px rgba(0,171,233,0.35)',
          }}>
            <Image src="/assets/Photo-Xavier.png" alt="Xavier Niel" width={220} height={220}
              style={{ objectFit: 'cover', objectPosition: '60% top', width: '100%', height: '100%' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Xavier Niel</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Co-fondateur &amp; Investisseur</div>
          </div>
        </div>
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntreprisePoints({ page, pageIndex, total }) {
  const accent = page.color || '#00abe9'
  const emoji = page.type === 'impact' ? '👁️' : page.type === 'probleme' ? '🔍' : '⚙️'
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>
        {/* Gauche — titre + points */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Journée 1 · Présentation</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.2 }}>{page.titre}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>{page.sousTitre}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {(page.points || []).map((pt, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${accent}18`, border: `1px solid ${accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>{pt.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.texte}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Droite — grand emoji décoratif */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 220, height: 220, borderRadius: '50%',
            background: `${accent}15`, border: `2px solid ${accent}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 100,
            boxShadow: `0 0 80px ${accent}25`,
          }}>{emoji}</div>
        </div>
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseTimeline({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Journée 1 · Présentation</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1, justifyContent: 'center' }}>
        {(page.timeline || []).map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 100, flexShrink: 0, textAlign: 'right', fontSize: 13, fontWeight: 800, color: '#00abe9' }}>{item.year}</div>
            <div style={{ width: 14, height: 14, borderRadius: '50%', background: i === page.timeline.length - 1 ? '#00abe9' : 'rgba(0,171,233,0.4)', border: '2px solid #00abe9', flexShrink: 0 }} />
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 20px', flex: 1 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginRight: 12 }}>{item.label}</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{item.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntreprisePiliers({ page, pageIndex, total }) {
  const accent = page.color || '#16a34a'
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'flex', gap: 24, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {(page.points || []).map((p, i) => (
          <div key={i} style={{ flex: 1, background: `${accent}12`, border: `1px solid ${accent}35`, borderRadius: 24, padding: '36px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>{p.emoji}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 12 }}>{p.titre}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{p.texte}</div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseSteps({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, flex: 1 }}>
        {(page.steps || []).map((s, i) => (
          <div key={i} style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 18, padding: '22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{s.num}</div>
              <span style={{ fontSize: 20 }}>{s.emoji}</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.titre}</div>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{s.texte}</div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseCases({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'flex', gap: 20, flex: 1, alignItems: 'center' }}>
        {(page.cases || []).map((c, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(219,39,119,0.06)', border: '1px solid rgba(219,39,119,0.2)', borderRadius: 20, padding: '24px 20px' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>{c.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{c.prenom}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{c.age} · {c.contexte}</div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#f87171', lineHeight: 1.4 }}>❌ {c.sans}</div>
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#4ade80', lineHeight: 1.4 }}>✅ {c.avec}</div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseVisages({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, flex: 1 }}>
        {(page.profils || []).map((p, i) => (
          <div key={i} style={{ background: 'rgba(8,145,178,0.07)', border: '1px solid rgba(8,145,178,0.2)', borderRadius: 18, padding: '22px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(8,145,178,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{p.emoji}</div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 6 }}>{p.metier}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{p.message}</div>
            </div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseCroissance({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>{page.sousTitre}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {(page.stats || []).map((s, i) => (
          <div key={i} style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: 18, padding: '24px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: '#4ade80', lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {(page.points || []).map((p, i) => (
          <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>{p.emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.titre}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{p.texte}</div>
            </div>
          </div>
        ))}
      </div>
    </TVEntrepriseShell>
  )
}

function TVEntrepriseMission({ page, pageIndex, total }) {
  return (
    <TVEntrepriseShell page={page} pageIndex={pageIndex} total={total}>
      <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 860, margin: '0 auto', width: '100%' }}>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{page.titre}</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>{page.sousTitre}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
          {(page.temoignages || []).map((t, i) => (
            <div key={i} style={{ background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.25)', borderRadius: 16, padding: '20px 28px', textAlign: 'left' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontStyle: 'italic', marginBottom: 6 }}>{t.quote}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{t.context}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#00abe9', fontStyle: 'italic' }}>Tu participes à rendre la vue accessible à tous.</div>
      </div>
    </TVEntrepriseShell>
  )
}

// ── TV Labo Progressif Châtelet ──────────────────────────────────
function TVLaboProgressif({ page, pageIndex, total, revealLabo }) {
  const STATS = [
    { value: '480 paires / jour', sub: 'capacité du laboratoire', color: '#a78bfa', border: 'rgba(167,139,250,0.5)' },
    { value: 'Dans la journée',   sub: 'clients parisiens',       color: '#4ade80', border: 'rgba(74,222,128,0.5)' },
    { value: '24 heures',         sub: 'tous magasins hors IDF',  color: '#00abe9', border: 'rgba(0,171,233,0.5)' },
    { value: '2 sem. à 1 mois',   sub: 'autres opticiens',        color: '#ef4444', border: 'rgba(239,68,68,0.5)' },
  ]
  return (
    <div style={{ height: '100vh', position: 'relative', overflow: 'hidden', background: '#020c1f' }}>
      {/* Photo plein écran */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/labo-progressif-chatelet.jpg"
        alt="Laboratoire progressif Châtelet"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 40%',
          filter: revealLabo ? 'brightness(0.25) saturate(1.2)' : 'brightness(0.5)',
          transition: 'filter 1.2s ease',
        }}
      />
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(2,12,31,0.97) 0%, rgba(2,12,31,0.5) 50%, rgba(2,12,31,0.1) 100%)',
      }} />
      {/* Compteur page */}
      <div style={{ position: 'absolute', top: 32, right: 44, fontSize: 12, color: 'rgba(255,255,255,0.25)', fontWeight: 600, zIndex: 2 }}>
        {pageIndex + 1} / {total}
      </div>
      {/* Contenu */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 72px 64px' }}>
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.55)',
          borderRadius: 20, padding: '6px 22px', marginBottom: 22,
          fontSize: 12, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 2,
        }}>🔬 Exclusivité mondiale · Paris Châtelet</div>
        <h1 style={{ fontSize: 52, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 14, maxWidth: 900 }}>
          Notre laboratoire progressif<br />unique au monde
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.5)', marginBottom: revealLabo ? 40 : 0, fontStyle: 'italic', maxWidth: 700, lineHeight: 1.5 }}>
          Accessible à la vue des clients — équipé de machines introuvables dans n&apos;importe quel magasin d&apos;optique au monde.
        </p>
        {revealLabo && (
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'podiumFadeIn .6s ease both' }}>
            {STATS.map((s, i) => (
              <div key={i} style={{
                background: 'rgba(2,12,31,0.75)', backdropFilter: 'blur(12px)',
                border: `1.5px solid ${s.border}`,
                borderRadius: 16, padding: '18px 26px', minWidth: 180,
                animation: `podiumFadeIn .5s ease ${i * 0.12}s both`,
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 8 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── TV Progressif : schéma verre PNG avec zones overlay ──────────
const TV_PROG_ZONES = [
  { key: 'haut',   label: 'LOIN',      color: '#a78bfa', top: '19%' },
  { key: 'milieu', label: 'INTERMÉD.', color: '#4ade80', top: '52%' },
  { key: 'bas',    label: 'PRÈS',      color: '#fbbf24', top: '80%' },
]

function TVVerreProgressifSchema({ highlight }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Halo respirant derrière l'image */}
      <div style={{
        position: 'absolute', inset: -32, borderRadius: '50%', zIndex: 0,
        background: 'radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 68%)',
        animation: 'haloPulse 3.8s ease-in-out infinite',
      }} />
      {/* Image principale avec float */}
      <div style={{ animation: 'verreFloat 4.5s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/verre-prog.png"
          alt="Verre progressif"
          style={{
            width: 300,
            height: 'auto',
            display: 'block',
            filter: 'drop-shadow(0 0 36px rgba(124,58,237,0.65)) drop-shadow(0 20px 48px rgba(0,0,0,0.55))',
          }}
        />
      </div>
      {/* Badges zones */}
      {TV_PROG_ZONES.map(z => (
        <div key={z.key} style={{
          position: 'absolute', zIndex: 2,
          right: -92,
          top: z.top,
          transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', gap: 6,
          opacity: highlight === null || highlight === undefined ? 0.38 : highlight === z.key ? 1 : 0.14,
          transition: 'opacity 0.45s ease',
          pointerEvents: 'none',
        }}>
          <div style={{ width: 24, height: 1, background: z.color, opacity: 0.85 }} />
          <div style={{
            background: highlight === z.key ? `${z.color}22` : 'transparent',
            border: `1px solid ${z.color}${highlight === z.key ? '80' : '38'}`,
            borderRadius: 10, padding: '3px 10px',
            fontSize: 11, fontWeight: 800, color: z.color, letterSpacing: 1,
            whiteSpace: 'nowrap',
            boxShadow: highlight === z.key ? `0 0 12px ${z.color}45` : 'none',
          }}>{z.label}</div>
        </div>
      ))}
    </div>
  )
}

const OPT_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── TV Progressif : anatomie lunette avec révélation des zones ───
const TV_PA_ZONE_COLORS = { haut: '#a78bfa', milieu: '#4ade80', bas: '#fbbf24' }
const TV_PA_POINT_ZONE  = { 0: 'haut', 1: 'milieu', 2: 'bas' }

function TVProgressifAnatomie({ page, pageIndex, total, progAnatomieReveal }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 100)
    return () => clearTimeout(t)
  }, [page.id])

  const revealed = Array.isArray(progAnatomieReveal) ? progAnatomieReveal : []

  // Lens geometry (SVG viewBox "0 0 560 480")
  const cx = 240, cy = 238, rx = 200, ry = 178
  const lT = cy - ry         // 60
  const lB = cy + ry         // 416
  const lL = cx - rx         // 40
  const lR = cx + rx         // 440
  const lH = 2 * ry          // 356
  const hB = lT + lH * 0.38  // 195.3
  const mB = hB + lH * 0.28  // 295.0
  const hY = (lT + hB) / 2   // 127.6
  const mY = (hB + mB) / 2   // 245.1
  const bY = (mB + lB) / 2   // 355.5

  const ZONES = [
    { key: 'haut',   color: '#a78bfa', label: 'LOIN',      zy: hY, yStart: lT, yEnd: hB },
    { key: 'milieu', color: '#4ade80', label: 'INTERMÉD.', zy: mY, yStart: hB, yEnd: mB },
    { key: 'bas',    color: '#fbbf24', label: 'PRÈS',      zy: bY, yStart: mB, yEnd: lB },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>
      {/* ── Gauche : lunette SVG ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        opacity: entered ? 1 : 0,
        transform: entered ? 'scale(1)' : 'scale(0.88)',
        transition: 'all .7s ease .1s',
      }}>
        {/* Halo respirant */}
        <div style={{
          position: 'absolute', width: 680, height: 680, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 68%)',
          animation: 'haloPulse 3.8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        <div style={{ animation: 'verreFloat 5s ease-in-out infinite', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 0 44px rgba(124,58,237,0.55)) drop-shadow(0 24px 56px rgba(0,0,0,0.55))' }}>
          <svg viewBox="0 0 560 480" width={500} height={429} style={{ overflow: 'visible' }}>
            <defs>
              <clipPath id="tv-pa-lens">
                <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
              </clipPath>
              <radialGradient id="tv-pa-sclera" cx="38%" cy="35%">
                <stop offset="0%" stopColor="#f5f0eb" />
                <stop offset="100%" stopColor="#d4ccc0" />
              </radialGradient>
              <radialGradient id="tv-pa-iris" cx="35%" cy="30%">
                <stop offset="0%" stopColor="#8aae78" />
                <stop offset="60%" stopColor="#52794a" />
                <stop offset="100%" stopColor="#3c5834" />
              </radialGradient>
            </defs>

            {/* Zone tints clipped to lens */}
            {ZONES.map(z => (
              <rect key={z.key}
                x={lL} y={z.yStart} width={2 * rx} height={z.yEnd - z.yStart}
                clipPath="url(#tv-pa-lens)"
                fill={z.color}
                opacity={revealed.includes(z.key) ? 0.3 : 0}
                style={{ transition: 'opacity 0.55s ease' }}
              />
            ))}

            {/* Eye inside the lens */}
            <g clipPath="url(#tv-pa-lens)">
              <ellipse cx={cx} cy={196} rx={118} ry={70} fill="url(#tv-pa-sclera)" />
              <circle  cx={cx} cy={196} r={52}   fill="url(#tv-pa-iris)" />
              <circle  cx={cx} cy={196} r={23}   fill="#14100c" />
              <circle  cx={cx + 18} cy={180} r={10} fill="rgba(255,255,255,0.88)" />
              <circle  cx={cx - 14} cy={210} r={5}  fill="rgba(255,255,255,0.28)" />
            </g>

            {/* Subtle zone dividers */}
            <g clipPath="url(#tv-pa-lens)" opacity={0.18}>
              <line x1={lL} y1={hB} x2={lR} y2={hB} stroke="white" strokeWidth="1.5" strokeDasharray="8,5" />
              <line x1={lL} y1={mB} x2={lR} y2={mB} stroke="white" strokeWidth="1.5" strokeDasharray="8,5" />
            </g>

            {/* Glass tint */}
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="rgba(160,210,255,0.04)" />

            {/* Frame */}
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#94a3b8" strokeWidth={11} />
            <ellipse cx={cx} cy={cy} rx={rx - 1} ry={ry - 1} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth={1.5} />

            {/* Temple arm (right) */}
            <path d={`M ${lR - 4} ${lT + 95} C ${lR + 28} ${lT + 84}, ${lR + 60} ${lT + 76}, ${lR + 118} ${lT + 52}`}
              fill="none" stroke="#94a3b8" strokeWidth={8} strokeLinecap="round" />
            <path d={`M ${lR - 4} ${lT + 95} C ${lR + 28} ${lT + 84}, ${lR + 60} ${lT + 76}, ${lR + 118} ${lT + 52}`}
              fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={2} strokeLinecap="round" />

            {/* Nosepad (left) */}
            <path d={`M ${lL + 6} ${cy + 18} C ${lL - 14} ${cy + 34}, ${lL - 14} ${cy + 52}, ${lL + 4} ${cy + 62}`}
              fill="none" stroke="#94a3b8" strokeWidth={6} strokeLinecap="round" />

            {/* Zone badges */}
            {ZONES.map(z => {
              const active  = revealed.includes(z.key)
              const opacity = revealed.length === 0 ? 0.4 : active ? 1 : 0.13
              return (
                <g key={z.key} opacity={opacity} style={{ transition: 'opacity 0.5s ease' }}>
                  <line x1={lR} y1={z.zy} x2={lR + 18} y2={z.zy} stroke={z.color} strokeWidth="1.5" />
                  <rect x={lR + 20} y={z.zy - 14} width={88} height={28} rx={10}
                    fill={active ? `${z.color}22` : 'transparent'}
                    stroke={`${z.color}${active ? '90' : '48'}`} strokeWidth="1.5" />
                  <text x={lR + 30} y={z.zy + 5} fontSize="13" fontWeight="800" fill={z.color} letterSpacing="1.2">{z.label}</text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      {/* ── Droite : titre + points ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 60px',
        opacity: entered ? 1 : 0,
        transform: entered ? 'translateX(0)' : 'translateX(28px)',
        transition: 'all .6s ease .05s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Le Verre Progressif</span>
        </div>

        <div style={{ display: 'inline-block', background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.45)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
          Formation J+14 · LPT
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 6 }}>{page.titre}</h1>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.42)', marginBottom: 28 }}>{page.sousTitre}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(page.points || []).map((pt, i) => {
            const zKey  = TV_PA_POINT_ZONE[i]
            const zColor = zKey && revealed.includes(zKey) ? TV_PA_ZONE_COLORS[zKey] : null
            return (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateX(0)' : 'translateX(20px)',
                transition: `all .5s ease ${0.12 + i * 0.1}s`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: zColor ? `${zColor}25` : 'rgba(124,58,237,0.15)',
                  border: `1.5px solid ${zColor ? zColor + '65' : 'rgba(124,58,237,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  transition: 'all 0.5s ease',
                  boxShadow: zColor ? `0 0 14px ${zColor}38` : 'none',
                }}>{pt.emoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: zColor || '#fff', marginBottom: 2, transition: 'color 0.5s ease' }}>{pt.titre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>{pt.texte}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── TV Progressif : zone interactif ──────────────────────────────
function TVProgressifZoneInteractif({ page, pageIndex, total, progZoneQ, progZoneResponses, progZoneShowCorrect }) {
  const q = progZoneQ !== null && progZoneQ !== undefined ? page.zoneQuestions[progZoneQ] : null
  const entries = Object.entries(progZoneResponses || {})
  const totalR = entries.length
  const counts = q ? q.options.map((_, i) => entries.filter(([, v]) => v === i).length) : []

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #12013a 55%, #0d0a3a 100%)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
    }}>
      {/* ── Gauche : verre plein écran sans labels ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
      }}>
        {/* Halo */}
        <div style={{
          position: 'absolute', width: 680, height: 680, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 68%)',
          animation: 'haloPulse 3.8s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/verre-prog.png"
          alt="Verre progressif"
          style={{
            width: 520, height: 'auto',
            animation: 'verreFloat 4.5s ease-in-out infinite',
            position: 'relative', zIndex: 1,
            filter: 'drop-shadow(0 0 56px rgba(124,58,237,0.7)) drop-shadow(0 24px 56px rgba(0,0,0,0.6))',
          }}
        />
      </div>

      {/* ── Droite : question + résultats ── */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '48px 60px',
      }}>
        {/* Header logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Identifie les zones</span>
        </div>

        {q ? (
          <>
            <div style={{
              display: 'inline-block', background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.45)', borderRadius: 20,
              padding: '6px 20px', fontSize: 12, fontWeight: 700, color: '#a78bfa',
              textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24, alignSelf: 'flex-start',
            }}>
              Question {(progZoneQ || 0) + 1} / {page.zoneQuestions.length}
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 40, lineHeight: 1.15 }}>
              {q.question}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {q.options.map((opt, i) => {
                const cnt = counts[i]
                const pct = totalR > 0 ? (cnt / totalR) * 100 : 0
                const isCorrect = i === q.correct
                const highlight = progZoneShowCorrect && isCorrect
                return (
                  <div key={i} style={{
                    background: highlight ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${highlight ? 'rgba(34,197,94,0.45)' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 18, padding: '18px 24px',
                    transition: 'all .4s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: '50%', background: OPT_COLORS[i],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 18, fontWeight: 900, color: '#fff', flexShrink: 0,
                        }}>{'ABC'[i]}</div>
                        <span style={{ fontSize: 20, fontWeight: 600, color: highlight ? '#4ade80' : '#fff' }}>{opt}</span>
                        {highlight && <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '3px 14px', borderRadius: 20 }}>✓ Correct</span>}
                      </div>
                      <span style={{ fontSize: 32, fontWeight: 900, color: highlight ? '#4ade80' : '#fff', minWidth: 40, textAlign: 'right' }}>{cnt}</span>
                    </div>
                    <div style={{ height: 10, background: 'rgba(255,255,255,0.08)', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 5, width: `${pct}%`, background: highlight ? '#4ade80' : OPT_COLORS[i], transition: 'width .5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 28, fontSize: 16, color: 'rgba(255,255,255,0.35)' }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginRight: 10 }}>{totalR}</span>
              réponse{totalR !== 1 ? 's' : ''}
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.45, textAlign: 'center' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 22, color: '#fff', fontWeight: 600, marginBottom: 8 }}>Identifie les zones</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>Le formateur va lancer une question…</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TV Progressif : retour terrain (bulles) ───────────────────────
function TVProgressifRetourTerrain({ page, pageIndex, total, progRetourResponses, progRetourRevealed, sessionCode }) {
  const entries = Object.entries(progRetourResponses || {})
  const [participantCount, setParticipantCount] = useState(0)
  useEffect(() => {
    if (!sessionCode) return
    const poll = () => sbSelect('participants', `session_code=eq.${encodeURIComponent(sessionCode)}`).then(r => setParticipantCount((r || []).length)).catch(() => {})
    poll(); const t = setInterval(poll, 5000); return () => clearInterval(t)
  }, [sessionCode])
  return (
    <TVBubbleScreen page={page} pageIndex={pageIndex} total={total} accent="#7c3aed"
      waiting={!progRetourRevealed} answerCount={entries.length} participantCount={participantCount}
      moduleLabel="Le Verre Progressif"
    >
      {entries.map(([name, resp], idx) => (
        <div key={name} style={{
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 20, padding: '14px 18px', maxWidth: 280,
          marginTop: B_MT[idx % B_MT.length], transform: `rotate(${B_ROT[idx % B_ROT.length]}deg)`,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{name}</div>
          <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>{resp.text || resp}</div>
        </div>
      ))}
    </TVBubbleScreen>
  )
}

// ── TV Progressif : jeu d'objections ────────────────────────────
function TVProgressifJeuObjections({ page, pageIndex, total, progObjectionIdx, progObjectionResponses, progObjectionRevealed, progBestAnswer, sessionCode }) {
  const objection = progObjectionIdx !== null && progObjectionIdx !== undefined ? page.objections[progObjectionIdx] : null
  const entries = Object.entries(progObjectionResponses || {})
  const [participantCount, setParticipantCount] = useState(0)
  useEffect(() => {
    if (!sessionCode) return
    const poll = () => sbSelect('participants', `session_code=eq.${encodeURIComponent(sessionCode)}`).then(r => setParticipantCount((r || []).length)).catch(() => {})
    poll(); const t = setInterval(poll, 5000); return () => clearInterval(t)
  }, [sessionCode])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #12013a 55%, #0d0a3a 100%)', display: 'flex', flexDirection: 'column', padding: '32px 56px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Le Verre Progressif · Jeu d'objections</span>
        </div>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
      </div>

      {objection ? (
        <>
          {/* Objection */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '24px 32px', marginBottom: 32, maxWidth: 900, alignSelf: 'center', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Le client dit :</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.3, fontStyle: 'italic' }}>"{objection}"</div>
          </div>

          {/* Réponses */}
          {!progObjectionRevealed ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: 0.8 }}>
              <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>En attente des réponses sur les téléphones…</div>
              {participantCount > 0 && (
                <div style={{ fontSize: 26, fontWeight: 700, color: '#fff' }}>
                  {entries.length}
                  <span style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>/ {participantCount} réponse{entries.length > 1 ? 's' : ''} reçue{entries.length > 1 ? 's' : ''}</span>
                </div>
              )}
              {entries.length > 0 && (
                <div style={{ display: 'flex', gap: 10 }}>
                  {entries.map((_, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length] }} />)}
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start', padding: '8px 0', columnGap: 20, rowGap: 44 }}>
              {entries.map(([name, resp], idx) => (
                <div key={name} style={{
                  background: progBestAnswer === name ? 'rgba(34,197,94,0.15)' : 'rgba(124,58,237,0.12)',
                  border: `1px solid ${progBestAnswer === name ? 'rgba(34,197,94,0.5)' : 'rgba(124,58,237,0.3)'}`,
                  borderRadius: 20, padding: '14px 18px', maxWidth: 300,
                  marginTop: B_MT[idx % B_MT.length], transform: `rotate(${B_ROT[idx % B_ROT.length]}deg)`,
                  transition: 'all 0.4s ease',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: progBestAnswer === name ? '#4ade80' : '#a78bfa', textTransform: 'uppercase', letterSpacing: 0.5 }}>{name}</span>
                    {progBestAnswer === name && <span style={{ fontSize: 10, color: '#4ade80', fontWeight: 700 }}>⭐</span>}
                  </div>
                  <div style={{ fontSize: 14, color: '#fff', lineHeight: 1.5, fontWeight: 500 }}>{resp.text || resp}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)' }}>Le formateur va choisir une objection…</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── TV PDM : Pourquoi mesurer ─────────────────────────────────────
function TVPdmPourquoi({ pageIndex, total }) {
  const C = '#00abe9'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001e40 100%)', display: 'grid', gridTemplateColumns: '38% 62%' }}>

      {/* ── Gauche : texte ── */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 52px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>
          Prise de mesures · {pageIndex + 1} / {total}
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
          Pourquoi faire une<br /><span style={{ color: C }}>prise de mesures ?</span>
        </div>
        <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 44 }}>
          Positionner le centre optique du verre exactement devant la pupille du client.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {[
            { n: 1, label: 'Centrage optique', desc: "Aligner le centre du verre devant la pupille." },
            { n: 2, label: 'Confort visuel', desc: "Un verre mal centré provoque fatigue et flou." },
            { n: 3, label: 'Satisfaction garantie', desc: "Bonne mesure = client satisfait dès le 1er port." },
          ].map(pt => (
            <div key={pt.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${C}20`, border: `1px solid ${C}50`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: C }}>{pt.n}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{pt.label}</div>
                <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>{pt.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Droite : photo réelle + annotations SVG overlay ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 48px' }}>
        {/* Conteneur relatif pour superposer le SVG sur la photo */}
        <div style={{ position: 'relative', width: '100%' }}>
          {/* Photo de la monture tortoiseshell 1313×473px */}
          <img
            src="/assets/LPT003-EFO-001.avif"
            alt="Monture LPT — prise de mesures"
            style={{ width: '100%', display: 'block' }}
          />
          {/* SVG overlay — viewBox calé sur les dimensions réelles 1313×473 */}
          <svg
            viewBox="0 0 1313 473"
            preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          >
            {/* Axe de symétrie central */}
            <line x1="656" y1="20" x2="656" y2="453" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="10 6" />

            {/* Croix pupille gauche */}
            <line x1="410" y1="182" x2="410" y2="218" stroke="#e53535" strokeWidth="4" />
            <line x1="392" y1="200" x2="428" y2="200" stroke="#e53535" strokeWidth="4" />

            {/* Croix pupille droite */}
            <line x1="903" y1="182" x2="903" y2="218" stroke="#e53535" strokeWidth="4" />
            <line x1="885" y1="200" x2="921" y2="200" stroke="#e53535" strokeWidth="4" />

            {/* EP gauche : CX(656) → pupille gauche(410) */}
            <line x1="656" y1="168" x2="410" y2="168" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 6" />
            <line x1="656" y1="152" x2="656" y2="184" stroke="#fff" strokeWidth="2.5" />
            <line x1="410" y1="152" x2="410" y2="184" stroke="#fff" strokeWidth="2.5" />
            <polygon points="426,162 440,168 426,174" fill="#fff" />
            <polygon points="641,162 627,168 641,174" fill="#fff" />
            <text x="533" y="148" textAnchor="middle" fill={C} fontSize="32" fontWeight="bold" fontStyle="italic" fontFamily="system-ui,sans-serif">EP</text>

            {/* EP droite : CX(656) → pupille droite(903) */}
            <line x1="656" y1="168" x2="903" y2="168" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 6" />
            <line x1="903" y1="152" x2="903" y2="184" stroke="#fff" strokeWidth="2.5" />
            <polygon points="887,162 873,168 887,174" fill="#fff" />
            <polygon points="671,162 685,168 671,174" fill="#fff" />
            <text x="780" y="148" textAnchor="middle" fill={C} fontSize="32" fontWeight="bold" fontStyle="italic" fontFamily="system-ui,sans-serif">EP</text>

            {/* H gauche : pupille → bas verre */}
            <line x1="410" y1="220" x2="410" y2="395" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 6" />
            <line x1="396" y1="395" x2="424" y2="395" stroke="#fff" strokeWidth="2.5" />
            <polygon points="404,236 410,222 416,236" fill="#fff" />
            <polygon points="404,379 410,393 416,379" fill="#fff" />
            <text x="358" y="315" textAnchor="middle" fill={C} fontSize="32" fontWeight="bold" fontStyle="italic" fontFamily="system-ui,sans-serif">H</text>

            {/* H droite : pupille → bas verre */}
            <line x1="903" y1="220" x2="903" y2="395" stroke="#fff" strokeWidth="2.5" strokeDasharray="10 6" />
            <line x1="889" y1="395" x2="917" y2="395" stroke="#fff" strokeWidth="2.5" />
            <polygon points="897,236 903,222 909,236" fill="#fff" />
            <polygon points="897,379 903,393 909,379" fill="#fff" />
            <text x="955" y="315" textAnchor="middle" fill={C} fontSize="32" fontWeight="bold" fontStyle="italic" fontFamily="system-ui,sans-serif">H</text>
          </svg>
        </div>

        {/* Légende */}
        <div style={{ display: 'flex', gap: 48, marginTop: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="36" height="4" style={{ flexShrink: 0 }}><line x1="0" y1="2" x2="36" y2="2" stroke={C} strokeWidth="2.5" strokeDasharray="9 5" /></svg>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>EP — Écart pupillaire</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="4" height="36" style={{ flexShrink: 0 }}><line x1="2" y1="0" x2="2" y2="36" stroke={C} strokeWidth="2.5" strokeDasharray="9 5" /></svg>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>H — Hauteur</span>
          </div>
        </div>
      </div>

    </div>
  )
}

// ── TV PDM : Animation ──────────────────────────────────────────
function TVPdmAnimation({ step }) {
  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '24px 44px', flexShrink: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-blanc.png" alt="LPT" style={{ height: 30, objectFit: 'contain' }} />
        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontWeight: 500 }}>Prises de mesures · LPTVISION</span>
        <div style={{ flex: 1 }} />
        {/* Progression */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {Array(9).fill(0).map((_, i) => (
            <div key={i} style={{
              width: i === step ? 22 : 6, height: 6, borderRadius: 3,
              background: i <= step ? '#f59e0b' : 'rgba(255,255,255,0.15)',
              transition: 'all 0.4s',
            }} />
          ))}
        </div>
      </div>
      {/* SVG Animation */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 60px 60px' }}>
        <PDMAnimationSVG animStep={step} />
      </div>
    </div>
  )
}

// ── TV Offres : Classique ─────────────────────────────────────────
const TV_ITEMS_CLASSIQUE = [
  { label: '1 paire achetée', sub: null },
  { label: 'Deuxième paire à -20%', sub: null },
  { label: '10€ en 10 minutes', sub: 'Uniquement dans ce parcours' },
]

function TVOffresClassique({ step = 0 }) {
  const COLOR = '#00abe9'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001e40 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Gauche */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: `14px solid ${COLOR}`, boxShadow: `0 0 40px ${COLOR}50`, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Les parcours LPT</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>Le parcours</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: COLOR, lineHeight: 1 }}>Classique</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${COLOR}`, borderRadius: 16, padding: '24px 28px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>Tarifs</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Montures</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>5€ à 90€</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>2ème paire</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>-20%</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Fabrication</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>⚡ 10 min</span>
          </div>
        </div>
      </div>
      {/* Droite */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', gap: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Ce qui est inclus</div>
        {TV_ITEMS_CLASSIQUE.map((item, i) => (
          <div key={i} style={{
            opacity: i < step ? 1 : 0,
            transform: i < step ? 'translateX(0)' : 'translateX(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderLeft: `4px solid ${COLOR}`,
            borderRadius: 16, padding: '22px 28px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{item.label}</div>
            {item.sub && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{item.sub}</div>}
          </div>
        ))}
        {/* Barre de progression */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {TV_ITEMS_CLASSIQUE.map((_, i) => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < step ? COLOR : 'rgba(255,255,255,0.1)', transition: 'background 0.4s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TV Offres : 1=1 ───────────────────────────────────────────────
const TV_ITEMS_11 = [
  { label: '1 paire achetée', sub: null },
  { label: 'Deuxième paire offerte', sub: 'de même qualité que la première' },
  { label: 'Éligible sur tout le magasin', sub: 'Monture et verres au choix' },
  { label: 'Même en solaire', sub: null },
]

function TVOffres11({ step = 0 }) {
  const COLOR = '#c9a227'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Gauche */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: `14px solid ${COLOR}`, boxShadow: `0 0 40px ${COLOR}50`, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Les parcours LPT</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>Le parcours</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: COLOR, lineHeight: 1 }}>1=1</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${COLOR}`, borderRadius: 16, padding: '24px 28px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>Tarifs</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Unifocal</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>~157€</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Progressif</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLOR }}>~260€</span>
          </div>
        </div>
      </div>
      {/* Droite : points révélés progressivement */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', gap: 18 }}>
        {TV_ITEMS_11.map((item, i) => (
          <div key={i} style={{
            opacity: i < step ? 1 : 0,
            transform: i < step ? 'translateX(0)' : 'translateX(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderLeft: `4px solid ${i < step ? COLOR : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 18, padding: '20px 28px',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{item.label}</div>
            {item.sub && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{item.sub}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TV Offres : Verre unifocal dans le 1=1 ───────────────────────
const TV_ITEMS_UNIFOCAL_11 = [
  { label: "Sur l'intégralité du magasin", sub: 'Toutes nos montures et verres éligibles' },
  { label: '400 modèles de montures', sub: 'Au choix, sans contrainte' },
  { label: 'Tous les traitements inclus', sub: 'Anti-rayure · Anti-reflets · Anti-salissure · Hydrophobe · Anti-lumière bleue' },
  { label: '⚡ Fabrication en 10 minutes', sub: null },
]

function TVOffresUnifocal11() {
  const COLOR = '#c9a227'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '60px 40px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <VerreAnime color={COLOR} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Parcours 1=1 · Verre unifocal</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 40 }}>
          Le verre unifocal<br /><span style={{ color: COLOR }}>dans l&apos;offre 1=1</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {TV_ITEMS_UNIFOCAL_11.map((item, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${COLOR}`, borderRadius: 18, padding: '20px 28px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{item.label}</div>
              {item.sub && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{item.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TV Offres : Verre progressif dans le 1=1 ─────────────────────
const TV_OFFRE_PROGRESSIF_11 = [
  { label: "Sur l'intégralité du magasin", sub: 'Toutes nos montures et verres éligibles' },
  { label: '400 modèles de montures', sub: 'Au choix, sans contrainte' },
  { label: 'Tous les traitements inclus', sub: 'Anti-rayure · Anti-reflets · Anti-salissure · Hydrophobe · Anti-lumière bleue' },
  { label: '📅 Fabrication en 9 jours', sub: null },
]
const TV_ARGS_PROGRESSIF_11 = [
  { label: "Zones d'aberrations réduites" },
  { label: 'Vision extra large à 180°' },
  { label: 'Offre une vision naturelle au quotidien' },
  { label: 'Adaptation immédiate' },
  { label: 'Garantie Adaptation — satisfait ou échangé 100 jours' },
]

// Explosion en une fois, jouée au montage (donc au moment précis où le
// formateur clique sur "Révéler →" côté ModuleOffres.js, qui fait passer
// `revealed` de false à true et monte ce composant) — particules + anneau de
// choc partant du centre de l'écran, en CSS pur (transform+opacity uniquement,
// donc animable, respecte prefers-reduced-motion via peu d'insistance visuelle).
function TVExplosionBurst({ color = '#c9a227', count = 22 }) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.15
    const dist = 220 + (i % 4) * 70
    return { angle, dist, delay: (i % 5) * 0.02, big: i % 3 === 0 }
  })
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 300 }}>
      {particles.map((p, i) => {
        const tx = Math.cos(p.angle) * p.dist
        const ty = Math.sin(p.angle) * p.dist
        const size = p.big ? 14 : 8
        return (
          <div key={i} style={{
            position: 'absolute', width: size, height: size, borderRadius: '50%',
            background: i % 2 === 0 ? color : '#fff',
            boxShadow: `0 0 16px ${i % 2 === 0 ? color : '#fff'}`,
            '--tx': `${tx}px`, '--ty': `${ty}px`,
            animation: `offresProgExplosionParticle .75s ease-out ${p.delay}s forwards`,
          }} />
        )
      })}
      <div style={{ position: 'absolute', width: 60, height: 60, borderRadius: '50%', border: `4px solid ${color}`, animation: 'offresProgExplosionRing .6s ease-out forwards' }} />
      <div style={{ position: 'absolute', width: 60, height: 60, borderRadius: '50%', background: '#fff', animation: 'offresProgExplosionFlash .35s ease-out forwards' }} />
      <style>{`
        @keyframes offresProgExplosionParticle {
          0%   { transform: translate(0,0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) scale(0.2); opacity: 0; }
        }
        @keyframes offresProgExplosionRing {
          0%   { transform: scale(0.4); opacity: 1; }
          100% { transform: scale(11); opacity: 0; }
        }
        @keyframes offresProgExplosionFlash {
          0%   { transform: scale(0.3); opacity: 0.9; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

function TVOffresProgressif11({ revealed }) {
  const COLOR = '#c9a227'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a1200 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {revealed && <TVExplosionBurst key="burst" color={COLOR} />}
      {/* Gauche : le verre progressif, en plus gros — les arguments ne sont
          plus affichés ici en permanence, ils prennent la place de la colonne
          de droite une fois révélés (voir plus bas). */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 32px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ animation: 'verreFloat 4.5s ease-in-out infinite', pointerEvents: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/verre-prog.png"
            alt="Verre progressif"
            style={{ width: 540, height: 540, objectFit: 'contain', filter: `drop-shadow(0 0 64px ${COLOR}80) drop-shadow(0 20px 44px rgba(0,0,0,0.4))` }}
          />
        </div>
      </div>

      {/* Droite : "ce que comprend l'offre" au départ, puis les arguments de
          vente en gros une fois que le formateur a cliqué sur Révéler. */}
      {!revealed ? (
        <div key="included" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 52px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Parcours 1=1 · Verre progressif</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 36 }}>
            Le verre progressif<br /><span style={{ color: COLOR }}>dans l&apos;offre 1=1</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {TV_OFFRE_PROGRESSIF_11.map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `5px solid ${COLOR}`, borderRadius: 16, padding: '20px 26px' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{item.label}</div>
                {item.sub && <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginTop: 5 }}>{item.sub}</div>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div key="args" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '56px 52px', animation: 'successPop .5s cubic-bezier(0.22,1,0.36,1)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>Pourquoi le proposer</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {TV_ARGS_PROGRESSIF_11.map((item, i) => (
              <div key={i} style={{
                background: `${COLOR}18`, border: `1.5px solid ${COLOR}55`, borderRadius: 18,
                padding: '22px 28px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.25 }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── TV Offres : Pack Plan 95€ ─────────────────────────────────────
const TV_ITEMS_PACK_PLAN = [
  { label: '2 paires de lunettes', sub: null },
  { label: 'Monture au choix', sub: null },
  { label: 'Traitement au choix', sub: null },
  { label: 'Solaire inclus', sub: 'Sauf polarisé' },
]

function TVOffresPackPlan({ step = 0 }) {
  const COLOR = '#00abe9'
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001e40 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Gauche */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', border: `14px solid ${COLOR}`, boxShadow: `0 0 40px ${COLOR}50`, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Les parcours LPT</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1 }}>Pack</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: COLOR, lineHeight: 1 }}>Plan 95€</div>
          </div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: `4px solid ${COLOR}`, borderRadius: 16, padding: '24px 28px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 }}>Tarif</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>2 paires</span>
            <span style={{ fontSize: 40, fontWeight: 900, color: COLOR }}>95€</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Sans correction</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#4ade80' }}>✓</span>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 16 }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)' }}>Solaire</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#4ade80' }}>✓ sauf polarisé</span>
          </div>
        </div>
      </div>
      {/* Droite */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', gap: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Ce qui est inclus</div>
        {TV_ITEMS_PACK_PLAN.map((item, i) => (
          <div key={i} style={{
            opacity: i < step ? 1 : 0,
            transform: i < step ? 'translateX(0)' : 'translateX(16px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderLeft: `4px solid ${COLOR}`,
            borderRadius: 16, padding: '22px 28px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{item.label}</div>
            {item.sub && <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{item.sub}</div>}
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {TV_ITEMS_PACK_PLAN.map((_, i) => (
            <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < step ? COLOR : 'rgba(255,255,255,0.1)', transition: 'background 0.4s' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TV Mini Jeu : écran règles ────────────────────────────────────
const TV_RULES_ACCUEIL = [
  { icon: '🎰', text: 'La machine désigne aléatoirement un Vendeur et un Client parmi les participants connectés' },
  { icon: '🎭', text: 'Le Vendeur réalise l\'accueil complet selon la trame LPT — de l\'entrée à la découverte du besoin' },
  { icon: '⏱️', text: 'Durée du jeu de rôle : 3 à 5 minutes en conditions réelles' },
  { icon: '👁️', text: 'Le groupe observe en silence et prend mentalement des notes' },
  { icon: '💬', text: 'Debriefing collectif et feedback à chaud à la fin du jeu de rôle' },
]

function TVMiniJeuRules() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, #03112a 50%, #0a0a1a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '64px 120px', gap: 48,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 14 }}>
          Mini Jeux · Accueil moi si tu peux 🎰
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>Règles du jeu</div>
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)' }}>Jeu de rôle — trame d'accueil LPT</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 860 }}>
        {TV_RULES_ACCUEIL.map((rule, i) => (
          <div key={i} style={{
            display: 'flex', gap: 22, alignItems: 'center',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, padding: '20px 28px',
            animation: `mjFadeUp 0.4s ease ${i * 0.08}s both`,
          }}>
            <span style={{ fontSize: 30, flexShrink: 0 }}>{rule.icon}</span>
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{rule.text}</div>
          </div>
        ))}
      </div>
      <div style={{ opacity: 0.2, animation: 'mjPulse 2s ease-in-out infinite' }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
      </div>
    </div>
  )
}

// ── TV Mini Jeu : roulette (spinning + revealed) ──────────────────
function TVSlotReel({ items, reelState, result, label, color }) {
  const ITEM_H = 96
  const repeated = [...items, ...items, ...items]
  const spinDuration = `${((items.length * ITEM_H) / 580).toFixed(2)}s`
  const brakeDuration = '0.85s'
  const isDone  = reelState === 'done'
  const isBrake = reelState === 'brake'
  const isSpin  = reelState === 'spin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2 }}>{label}</div>
      <div style={{
        width: 280, height: ITEM_H * 3,
        background: 'rgba(0,0,0,0.5)',
        border: `2px solid ${isDone ? color : color + '44'}`,
        borderRadius: 24, overflow: 'hidden', position: 'relative',
        boxShadow: isDone ? `0 0 50px ${color}55` : `0 0 20px ${color}18`,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>
        {isDone ? (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${color}22 0%, #050d1e 100%)`,
            animation: 'resultBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', padding: '0 20px', textAlign: 'center', lineHeight: 1.2 }}>
              {result}
            </div>
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to bottom, rgba(0,0,0,0.92), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H, background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0,
              height: ITEM_H, transform: 'translateY(-50%)',
              border: `1px solid ${color}44`, background: `${color}08`,
              zIndex: 1, pointerEvents: 'none', borderRadius: 12,
            }} />
            <div style={{
              display: 'flex', flexDirection: 'column',
              animation:
                isSpin  ? `slotScroll ${spinDuration} linear infinite` :
                isBrake ? `slotBrake ${brakeDuration} ease-out 1 forwards` :
                'none',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}>
              {repeated.map((name, i) => (
                <div key={i} style={{
                  height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.78)',
                  padding: '0 18px', textAlign: 'center', lineHeight: 1.2,
                }}>
                  {name}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const TV_THEMES = [
  'Un client qui veut du progressif mais n\'en a jamais porté',
  'Un client qui souhaite faire un test de vue pour la première fois',
  'Un client qui dit ne pas avoir besoin de correction',
  'Un client qui rentre avec une ordonnance en main',
  'Un client qui rentre et connaît déjà le concept LPT',
  'Une personne qui rentre et qui est déjà cliente',
  'Un client qui veut une paire à 10 € en 10 minutes',
  'Un client avec une correction de -10 : un vrai défi technique',
  'Un client presbyte qui a des appréhensions sur le verre progressif',
  'Un client qui souhaite une paire solaire à sa vue',
]

function TVThemeReel({ reelState, result }) {
  const COLOR = '#00abe9'
  const ITEM_H = 90
  const repeated = [...TV_THEMES, ...TV_THEMES, ...TV_THEMES]
  const spinDuration = `${((TV_THEMES.length * ITEM_H) / 580).toFixed(2)}s`
  const brakeDuration = '0.85s'

  const isDone  = reelState === 'done'
  const isBrake = reelState === 'brake'
  const isSpin  = reelState === 'spin'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 2 }}>Scénario client</div>
      <div style={{
        width: '100%', maxWidth: 860, height: ITEM_H,
        background: 'rgba(0,0,0,0.5)',
        border: `2px solid ${isDone ? COLOR : COLOR + '44'}`,
        borderRadius: 20, overflow: 'hidden', position: 'relative',
        boxShadow: isDone ? `0 0 40px ${COLOR}50` : `0 0 16px ${COLOR}18`,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>
        {isDone ? (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `radial-gradient(ellipse at center, ${COLOR}1a 0%, #050d1e 100%)`,
            animation: 'resultBounce 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            padding: '0 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{result}</div>
          </div>
        ) : (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to bottom, rgba(0,0,0,0.88), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, background: 'linear-gradient(to top, rgba(0,0,0,0.88), transparent)', zIndex: 2, pointerEvents: 'none' }} />
            <div style={{
              display: 'flex', flexDirection: 'column',
              animation:
                isSpin  ? `slotScroll ${spinDuration} linear infinite` :
                isBrake ? `slotBrake ${brakeDuration} ease-out 1 forwards` :
                'none',
              willChange: 'transform',
              backfaceVisibility: 'hidden',
            }}>
              {repeated.map((t, i) => (
                <div key={i} style={{
                  height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                  padding: '0 32px', textAlign: 'center', lineHeight: 1.35,
                }}>
                  {t}
                </div>
              ))}
            </div>
          </>

        )}
      </div>
    </div>
  )
}

function TVMiniJeuGame({ mjPhase, vendeur, client, theme }) {
  const [participants, setParticipants] = useState([])
  const [reel1, setReel1] = useState('idle')
  const [reel2, setReel2] = useState('idle')
  const [reelT, setReelT] = useState('idle')
  const prevPhaseRef = useRef('idle')

  useEffect(() => {
    const sc = typeof window !== 'undefined'
      ? (localStorage.getItem('participant_session_code') || localStorage.getItem('lpt_session_code') || 'LPT2026')
      : 'LPT2026'
    import('@/lib/participantPresence').then(({ fetchOnlineParticipantsList }) => {
      fetchOnlineParticipantsList(sc)
        .then(rows => {
          const names = (rows || []).map(r => r.name || r.participant_name || r.collaborateur).filter(Boolean)
          setParticipants(names.length ? names : ['Participant 1', 'Participant 2', 'Participant 3'])
        })
    })
  }, [])

  const PHASE_ORDER = ['spinning', 'vendeur', 'client', 'revealed']
  const phaseIdx = (p) => PHASE_ORDER.indexOf(p)

  useEffect(() => {
    const prev = prevPhaseRef.current
    prevPhaseRef.current = mjPhase

    const brake = (setFn, onDone) => {
      setFn('brake')
      setTimeout(() => { setFn('done'); onDone?.() }, 850)
    }

    if (mjPhase === 'game_ready') {
      setReel1('idle'); setReel2('idle'); setReelT('idle')
    }

    if (mjPhase === 'spinning' && prev !== 'spinning') {
      setReel1('spin'); setReel2('spin'); setReelT('spin')
    }

    if (mjPhase === 'vendeur' && phaseIdx(prev) < phaseIdx('vendeur')) {
      brake(setReel1, null)
    }

    if (mjPhase === 'client' && phaseIdx(prev) < phaseIdx('client')) {
      if (phaseIdx(prev) < phaseIdx('vendeur')) setReel1('done')
      brake(setReel2, null)
    }

    if (mjPhase === 'revealed' && phaseIdx(prev) < phaseIdx('revealed')) {
      if (phaseIdx(prev) < phaseIdx('vendeur')) setReel1('done')
      if (phaseIdx(prev) < phaseIdx('client'))  setReel2('done')
      brake(setReelT, null)
    }
  }, [mjPhase])

  const fallback = ['—', '—', '—', '—', '—', '—', '—', '—']
  const reelItems = participants.length >= 2 ? participants : fallback

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, #03112a 50%, #0a0a1a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 52, padding: '64px 80px',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3 }}>
        Mini Jeux · Accueil moi si tu peux 🎰
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 72 }}>
        <TVSlotReel items={reelItems} reelState={reel1} result={vendeur} label="🧑‍💼 Vendeur" color="#8b5cf6" />
        <div style={{ fontSize: 44, color: 'rgba(255,255,255,0.14)', fontWeight: 900 }}>VS</div>
        <TVSlotReel items={reelItems} reelState={reel2} result={client}  label="🛍️ Client"  color="#f59e0b" />
      </div>
      <div style={{ width: '100%', maxWidth: 860 }}>
        <TVThemeReel reelState={reelT} result={theme} />
      </div>
      <div style={{ opacity: 0.18 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
      </div>
    </div>
  )
}

function TVMiniJeuDebrief({ sharedState }) {
  const vendeur = sharedState?.minijeu_vendeur
  const client  = sharedState?.minijeu_client
  const theme   = sharedState?.minijeu_theme

  const obs = Object.entries(sharedState || {})
    .filter(([k, v]) => k.startsWith('mj_obs__') && typeof v === 'string' && v)
    .sort(([a], [b]) => Number(a.split('__')[1]) - Number(b.split('__')[1]))
    .map(([, v]) => v)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 30% 20%, #1a0a3a 0%, #03112a 50%, #0a0a1a 100%)',
      padding: '60px 80px',
      display: 'flex', flexDirection: 'column', gap: 36,
    }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>
          Mini Jeux · Accueil moi si tu peux 🎰 · Débrief collectif
        </div>
        {vendeur && client && (
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 10, padding: '8px 20px' }}>
              <span style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginRight: 10 }}>Vendeur</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{vendeur}</span>
            </div>
            <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.15)' }}>↔</div>
            <div style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '8px 20px' }}>
              <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginRight: 10 }}>Client</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{client}</span>
            </div>
            {theme && (
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', flex: 1, minWidth: 200 }}>
                « {theme} »
              </div>
            )}
          </div>
        )}
      </div>

      {/* Observations */}
      {obs.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.25)', animation: 'mjPulse 1.5s ease-in-out infinite' }}>
            En attente des remarques des observateurs…
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2 }}>
            {obs.length} remarque{obs.length > 1 ? 's' : ''} des observateurs
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {obs.map((text, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.11)',
                  borderRadius: 16, padding: '22px 26px',
                  animation: 'mjFadeUp 0.4s ease both',
                  animationDelay: `${i * 0.07}s`,
                }}
              >
                <div style={{ fontSize: 18, color: '#fff', lineHeight: 1.65 }}>{text}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── TV Content Page (no controls, no avatar) ──────────────────────
// ── TV Trame d'accueil ────────────────────────────────────────────
function TVTrameAccueil({ step }) {
  const visible = (i) => step !== null && step !== undefined && i <= step

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      {/* Gauche : titre */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ marginBottom: 32 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={140} height={52} style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 18 }}>Formation Journée 2</div>
        <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 0 }}>
          La trame d'accueil<br />
          <span style={{ color: '#00abe9' }}>Lunettes Pour Tous</span>
        </h1>
        <div style={{ display: 'flex', gap: 6, marginTop: 32 }}>
          {TRAME_ACCUEIL_POINTS.map((pt, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, flex: 1, background: visible(i) ? pt.color : 'rgba(255,255,255,0.1)', transition: 'background 0.5s ease' }} />
          ))}
        </div>
      </div>

      {/* Droite : points révélés */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 56px', gap: 20 }}>
        {TRAME_ACCUEIL_POINTS.map((pt, i) => (
          <div key={pt.num} style={{
            display: 'flex', alignItems: 'flex-start', gap: 22,
            opacity: visible(i) ? 1 : 0,
            transform: visible(i) ? 'translateX(0)' : 'translateX(-24px)',
            transition: 'all 0.55s cubic-bezier(0.22,1,0.36,1)',
          }}>
            <div style={{
              width: 58, height: 58, borderRadius: 16, flexShrink: 0,
              background: `${pt.color}18`, border: `2px solid ${pt.color}55`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, color: pt.color,
            }}>{pt.num}</div>
            <div style={{
              flex: 1, borderLeft: `4px solid ${pt.color}`,
              background: `${pt.color}08`, border: `1px solid ${pt.color}22`,
              borderRadius: 16, padding: '16px 22px',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1.5 }}>{pt.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TV Montures — données ─────────────────────────────────────
const TV_MONTURES_DATA = {
  'montures-acetate': {
    title: 'Acétate', subtitle: 'de cellulose', color: '#00abe9',
    frames: [
      { src: '/assets/montures/acetate/SLPT038-EFO-002.avif', ref: 'SLPT038-EFO' },
      { src: '/assets/montures/acetate/SLPT067-EFO-002.avif', ref: 'SLPT067-EFO' },
      { src: '/assets/montures/acetate/SLPT075-EFOBPL-001.avif', ref: 'SLPT075-EFOBPL' },
    ],
    infos: [
      { icon: '🌿', label: 'Naturel', desc: 'Fibre de bois ou fibre de coton' },
      { icon: '✨', label: 'Premium', desc: 'Large choix de coloris & motifs' },
      { icon: '💎', label: 'Modèle unique', desc: 'Chaque paire diffère selon sa plaque' },
      { icon: '🌡️', label: 'Ajustable à chaud', desc: 'Hypoallergénique' },
      { icon: '💶', label: 'Prix', desc: 'De 30 € à 90 €' },
    ],
  },
  'montures-metal': {
    title: 'Métal', subtitle: 'alliage métallique', color: '#94a3b8',
    frames: [
      { src: '/assets/montures/metal/LPT502L-KM-002.avif', ref: 'LPT502L-KM' },
      { src: '/assets/montures/metal/LPT523-GUN-002.avif', ref: 'LPT523-GUN' },
      { src: '/assets/montures/metal/SLPT068-OOM-002.avif', ref: 'SLPT068-OOM' },
    ],
    infos: [
      { icon: '🪶', label: 'Léger & fin', desc: 'Discret sur le visage' },
      { icon: '🛡️', label: 'Résistant', desc: 'Alliage métallique et revêtement anti-allergique' },
      { icon: '🔧', label: 'Ajustable facilement', desc: 'Plaquettes et branches réglables' },
      { icon: '💶', label: 'Prix', desc: 'De 30 € à 90 €' },
    ],
  },
  'montures-injecte': {
    title: 'Plastique injecté', subtitle: 'moulé industriel', color: '#4ade80',
    frames: [
      { src: '/assets/montures/injecte/WF01-BM-002.avif',  ref: 'WF01-BM' },
      { src: '/assets/montures/injecte/WF02-GMV-002.avif', ref: 'WF02-GMV' },
      { src: '/assets/montures/injecte/WF04-BU-002.avif',  ref: 'WF04-BU' },
    ],
    infos: [
      { icon: '🏭', label: 'Moulé à chaud', desc: 'Injecté en série dans un moule industriel' },
      { icon: '🪶', label: 'Léger & résistant', desc: 'Très bonne durabilité au quotidien' },
      { icon: '💚', label: 'Accessible', desc: 'Meilleur rapport qualité / prix de la gamme' },
      { icon: '💶', label: 'Prix', desc: '5 € ou 15 €' },
    ],
  },
}

function TVSAVBrainstorm({ page, sessionCode, brainstormRevealed }) {
  const [answers, setAnswers] = useState([])
  const [participantCount, setParticipantCount] = useState(0)
  const pageId = `${page.moduleId}:brainstorm`

  useEffect(() => {
    setAnswers([])
    const poll = async () => {
      try {
        const [rows, pRows] = await Promise.all([
          fetchOpenAnswers(sessionCode, pageId),
          sbSelect('participants', `session_code=eq.${encodeURIComponent(sessionCode)}`),
        ])
        setAnswers(rows || [])
        setParticipantCount((pRows || []).length)
      } catch { /* erreur réseau, réessai au prochain tick */ }
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [pageId, sessionCode])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '48px 72px' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ display: 'inline-block', background: `${page.color}20`, border: `1px solid ${page.color}50`, borderRadius: 24, padding: '6px 24px', fontSize: 13, fontWeight: 700, color: page.color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>💬 Brainstorm</div>
        <div style={{ fontSize: 48, fontWeight: 900, color: '#fff', lineHeight: 1.2, whiteSpace: 'pre-line' }}>{page.question}</div>
      </div>
      {!brainstormRevealed ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <div style={{ fontSize: 64 }}>📱</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
            {participantCount > 0
              ? `${answers.length} / ${participantCount} réponse${answers.length > 1 ? 's' : ''} reçue${answers.length > 1 ? 's' : ''}`
              : answers.length === 0 ? 'En attente des réponses…' : `${answers.length} réponse${answers.length > 1 ? 's' : ''} reçue${answers.length > 1 ? 's' : ''}`}
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
            Le formateur révèlera les réponses au bon moment
          </div>
          {answers.length > 0 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              {answers.map((_, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length] }} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, alignContent: 'start', overflowY: 'auto' }}>
          {answers.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>📱</div>
              <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>Aucune réponse reçue.</div>
            </div>
          ) : answers.map((row, i) => (
            <div key={row.participant_name || i} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderLeft: `4px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
              borderRadius: 16, padding: '18px 22px',
              animation: 'fadeInUp .4s ease forwards',
            }}>
              <div style={{ fontSize: 18, color: '#fff', lineHeight: 1.5 }}>{row.answer}</div>
            </div>
          ))}
        </div>
      )}
      {brainstormRevealed && answers.length > 0 && <div style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>{answers.length} réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''}</div>}
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}

function IPhoneSMS() {
  return (
    <div style={{ position: 'relative', width: 260, height: 530, flexShrink: 0 }}>
      {/* Coque iPhone */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(145deg, #3a3a3c, #1c1c1e)',
        borderRadius: 46, border: '1px solid #555',
        boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
      }} />
      {/* Boutons latéraux gauche */}
      <div style={{ position: 'absolute', left: -3, top: 100, width: 3, height: 32, background: '#3a3a3c', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: -3, top: 145, width: 3, height: 52, background: '#3a3a3c', borderRadius: '3px 0 0 3px' }} />
      <div style={{ position: 'absolute', left: -3, top: 210, width: 3, height: 52, background: '#3a3a3c', borderRadius: '3px 0 0 3px' }} />
      {/* Bouton power droite */}
      <div style={{ position: 'absolute', right: -3, top: 155, width: 3, height: 70, background: '#3a3a3c', borderRadius: '0 3px 3px 0' }} />
      {/* Écran */}
      <div style={{
        position: 'absolute', inset: 8,
        background: '#000', borderRadius: 38,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
      }}>
        {/* Dynamic Island */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 12, paddingBottom: 4, flexShrink: 0 }}>
          <div style={{ width: 88, height: 28, background: '#000', border: '2px solid #1a1a1a', borderRadius: 20, boxShadow: '0 0 0 1px #333' }} />
        </div>
        {/* Status bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 18px 6px', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>09:04</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="3" width="3" height="7" fill="white" rx="1"/><rect x="4" y="2" width="3" height="8" fill="white" rx="1"/><rect x="8" y="0" width="3" height="10" fill="white" rx="1"/><rect x="12" y="0" width="2" height="10" fill="rgba(255,255,255,0.3)" rx="1"/></svg>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#fff' }}>5G</span>
            <div style={{ width: 22, height: 11, border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 3, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
              <div style={{ width: '75%', height: 6, background: '#4ade80', borderRadius: 1 }} />
              <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 3, height: 5, background: 'rgba(255,255,255,0.4)', borderRadius: '0 1px 1px 0' }} />
            </div>
          </div>
        </div>
        {/* SMS header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '6px 14px 8px', borderBottom: '1px solid #222', flexShrink: 0 }}>
          <div style={{ fontSize: 18, color: '#0a84ff', marginRight: 6 }}>‹</div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #5e5ce6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#fff', fontWeight: 700, margin: '0 auto 2px' }}>L</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>Lunettes Pour Tous</div>
          </div>
          <div style={{ width: 26 }} />
        </div>
        {/* Messages */}
        <div style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: 8, overflowY: 'hidden' }}>
          <div style={{ textAlign: 'center', fontSize: 9, color: '#8e8e93', marginBottom: 4 }}>sam. 20 juin à 16:07</div>
          {/* SMS 1 */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ maxWidth: '82%', background: '#2c2c2e', borderRadius: '16px 16px 16px 4px', padding: '8px 11px' }}>
              <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.45 }}>
                Lunettes Pour Tous.<br />Votre commande <span style={{ fontWeight: 700 }}>#7987948</span> est prête au magasin de Charleroi !
              </div>
            </div>
          </div>
          {/* SMS 2 */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ maxWidth: '82%', background: '#2c2c2e', borderRadius: '4px 16px 16px 4px', padding: '8px 11px' }}>
              <div style={{ fontSize: 12, color: '#fff', lineHeight: 1.45 }}>
                Lunettes Pour Tous.<br />Votre commande <span style={{ fontWeight: 700 }}>#7987972</span> est prête au magasin de Charleroi !
              </div>
            </div>
          </div>
        </div>
        {/* Input bar */}
        <div style={{ padding: '8px 10px 12px', display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #222', flexShrink: 0 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', border: '1.5px solid #555', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#555', flexShrink: 0 }}>+</div>
          <div style={{ flex: 1, height: 28, background: '#1c1c1e', borderRadius: 14, border: '1px solid #3a3a3c' }} />
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>↑</div>
        </div>
      </div>
    </div>
  )
}

function TVSAVContent({ page, pageIndex, total, moduleLabel }) {
  const { color, icon, titre, sousTitre, points, showIphone } = page
  const [step, setStep] = useState(0)
  useEffect(() => {
    setStep(0)
    const timers = (points || []).map((_, i) => setTimeout(() => setStep(i + 1), 400 + i * 300))
    return () => timers.forEach(clearTimeout)
  }, [pageIndex, points])
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '40px 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 36 }}>
        <div>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>{sousTitre}</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1.1, maxWidth: 800 }}>{titre}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {Array(total).fill(0).map((_, i) => <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 20 : 5, background: i === pageIndex ? color : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />)}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 48, flex: 1, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'center' }}>
          {(points || []).map((pt, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 20,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderLeft: `4px solid ${color}80`, borderRadius: 16, padding: '18px 24px',
              opacity: step > i ? 1 : 0, transform: step > i ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'all 0.4s ease',
            }}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{pt.emoji}</span>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{pt.titre}</div>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{pt.desc}</div>
              </div>
            </div>
          ))}
        </div>
        {showIphone && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-start' }}>
            <IPhoneSMS />
          </div>
        )}
      </div>
      <div style={{ textAlign: 'right', marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.2)', fontWeight: 600 }}>{moduleLabel}</div>
    </div>
  )
}

const MONTURES_PRIX = {
  'montures-injecte': '5 € ou 15 €',
  'montures-acetate': "jusqu'à 90 €",
  'montures-metal':   "jusqu'à 90 €",
}

function TVMontures({ type, pageIndex, total, moduleLabel, priceRevealed }) {
  const data = TV_MONTURES_DATA[type]
  const { title, subtitle, color, frames, infos } = data
  const [step, setStep] = useState(0)
  const baseInfos = infos.filter(i => i.label !== 'Prix')
  const priceText = MONTURES_PRIX[type] || ''

  useEffect(() => {
    setStep(0)
    const timers = [300, 700, 1100, 1700].map((t, i) => setTimeout(() => setStep(i + 1), t))
    return () => timers.forEach(clearTimeout)
  }, [pageIndex])

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 24 : 5, background: i === pageIndex ? color : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '5fr 2fr' }}>
        {/* Gauche : 3 montures */}
        <div style={{ padding: '28px 40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32 }}>
          {frames.map((f, i) => (
            <div key={i} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
              opacity: step > i ? 1 : 0,
              transform: step > i ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.95)',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: '28px 24px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={f.src} alt={f.ref} style={{ width: '100%', height: 'auto', objectFit: 'contain', maxHeight: 220 }} />
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: 0.5 }}>{f.ref}</span>
            </div>
          ))}
        </div>

        {/* Droite : titre + infos */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', padding: '36px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
            Matériaux · Journée 1
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 4 }}>{title}</div>
          <div style={{ fontSize: 16, fontWeight: 400, color: 'rgba(255,255,255,0.35)', marginBottom: 28 }}>{subtitle}</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {baseInfos.map((info, i) => (
              <div key={i} style={{
                opacity: step > 3 ? 1 : 0,
                transform: step > 3 ? 'translateX(0)' : 'translateX(24px)',
                transition: `all 0.5s ease ${i * 0.12}s`,
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: `3px solid ${color}70`, borderRadius: 12, padding: '10px 14px',
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{info.icon}</span>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{info.label}</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{info.desc}</div>
                </div>
              </div>
            ))}

            {priceRevealed && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))',
                border: '1px solid rgba(245,158,11,0.5)',
                borderLeft: '3px solid #f59e0b',
                borderRadius: 12, padding: '14px 18px',
                animation: 'fadeInUp 0.4s ease',
              }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>💶</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Prix</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{priceText}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  )
}

// ── TV INAMI Info ─────────────────────────────────────────────────
function TVInamiInfo({ inamiRevealed }) {
  const CONDITIONS = [
    {
      titre: 'Seuils de correction',
      icon: '👁️',
      items: [
        { label: 'Moins de 18 ans', detail: 'Intervention dès 0,25 dioptrie' },
        { label: '18 à 64 ans', detail: 'Intervention à partir de ± 6,00 dioptries' },
        { label: '65 ans et plus', detail: 'À partir de ± 4,25 dioptries pour les verres bifocaux ou progressifs' },
      ],
    },
    {
      titre: 'Fréquence de renouvellement',
      icon: '🔄',
      items: [
        { label: 'Moins de 18 ans', detail: 'Un nouveau droit tous les 2 ans' },
        { label: '18 ans et plus', detail: 'Un nouveau droit tous les 5 ans' },
        { label: 'Exception', detail: 'Si la nouvelle prescription diffère d\'au moins 0,5 dioptrie par rapport à la précédente délivrance, un nouveau droit s\'ouvre immédiatement, sans attendre le délai standard' },
      ],
    },
    {
      titre: 'Documents requis',
      icon: '📄',
      items: [
        { label: 'Attestation', detail: 'Une attestation de délivrance signée, établie par l\'opticien (le fameux document "Annexe 15")' },
        { label: 'Prescription', detail: 'Une prescription d\'ophtalmologue valable, datée de moins de 6 mois' },
      ],
    },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '44px 64px',
    }}>
      {/* Header INAMI */}
      <div style={{ marginBottom: inamiRevealed ? 28 : 0, flex: inamiRevealed ? 0 : 1, display: 'flex', flexDirection: 'column', justifyContent: inamiRevealed ? 'flex-start' : 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{
            background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.35)',
            borderRadius: 20, padding: '5px 18px',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Mutuelles et INAMI · Belgique
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 20 }}>
          <div style={{ fontSize: inamiRevealed ? 64 : 96, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -2 }}>
            INAMI
          </div>
          <div style={{ paddingBottom: inamiRevealed ? 8 : 14 }}>
            <div style={{ fontSize: inamiRevealed ? 16 : 22, fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              Institut National d&apos;Assurance
            </div>
            <div style={{ fontSize: inamiRevealed ? 16 : 22, fontWeight: 300, color: 'rgba(255,255,255,0.5)', letterSpacing: 1 }}>
              Maladie-Invalidité
            </div>
          </div>
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'flex-start', gap: 14,
          background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.25)',
          borderRadius: 14, padding: '14px 20px', maxWidth: 720,
        }}>
          <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>🏛️</span>
          <p style={{ fontSize: inamiRevealed ? 14 : 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            C&apos;est l&apos;organisme public qui gère l&apos;assurance obligatoire soins de santé en Belgique,
            c&apos;est donc lui qui fixe les règles.
          </p>
        </div>
      </div>

      {/* Conditions révélées */}
      {inamiRevealed && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, flex: 1 }}>
          {CONDITIONS.map((section) => (
            <div key={section.titre} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
              borderTop: '2px solid rgba(201,162,39,0.6)',
              borderRadius: 14, padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {section.titre}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.items.map((item, i) => (
                  <div key={i} style={{
                    background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 14px',
                    borderLeft: '2px solid rgba(201,162,39,0.4)',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55 }}>
                      {item.detail}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!inamiRevealed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 32 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.25)',
            animation: 'waitingPulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
            Le formateur va vous présenter les conditions de remboursement…
          </span>
        </div>
      )}
    </div>
  )
}

// ── TV Partena Offre ──────────────────────────────────────────────
function TVPartenaOffre({ partenaRevealed }) {
  const OFFRE = [
    { montant: '50 €', label: 'Verres unifocaux', icon: '👓' },
    { montant: '100 €', label: 'Verres progressifs', icon: '🔭' },
  ]
  const CONDITIONS = [
    'Avantage disponible une fois tous les 2 ans',
    "Non cumulable avec l'Avantage Partenamut classique (75 € tous les 2 ans sur montures, verres correcteurs ou lentilles de contact, chez l'opticien de son choix)",
    "Pas besoin de prescription ophtalmologique",
  ]

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '44px 64px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: partenaRevealed ? 32 : 0, flex: partenaRevealed ? 0 : 1, display: 'flex', flexDirection: 'column', justifyContent: partenaRevealed ? 'flex-start' : 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.35)', borderRadius: 20, padding: '5px 18px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Partenariat · Lunettes Pour Tous Belgique
            </span>
          </div>
        </div>

        <div style={{ fontSize: partenaRevealed ? 64 : 96, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -2, marginBottom: 16 }}>
          PARTENA
        </div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.25)',
          borderRadius: 14, padding: '12px 20px', maxWidth: 600,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>🤝</span>
          <p style={{ fontSize: partenaRevealed ? 14 : 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            Mutualité Partena — Offre partenaire Lunettes Pour Tous
          </p>
        </div>
      </div>

      {/* Offre révélée */}
      {partenaRevealed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
          {/* Montants */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {OFFRE.map((o) => (
              <div key={o.label} style={{
                background: 'rgba(201,162,39,0.1)', border: '1px solid rgba(201,162,39,0.35)',
                borderRadius: 16, padding: '24px 28px',
                display: 'flex', alignItems: 'center', gap: 20,
              }}>
                <span style={{ fontSize: 36, flexShrink: 0 }}>{o.icon}</span>
                <div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#c9a227', lineHeight: 1, letterSpacing: -1 }}>{o.montant}</div>
                  <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>pour une paire à {o.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Conditions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {CONDITIONS.map((c, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 14,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderLeft: '3px solid rgba(201,162,39,0.4)',
                borderRadius: 12, padding: '12px 18px',
              }}>
                <span style={{ fontSize: 14, color: '#c9a227', flexShrink: 0, marginTop: 1 }}>●</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!partenaRevealed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 32 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', animation: 'waitingPulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
            Le formateur va vous présenter l&apos;offre partenaire…
          </span>
        </div>
      )}
    </div>
  )
}

// ── TV Remboursement France — Conditions ─────────────────────────
function TVTiersPayant({ tiersPayantRevealed, answersRevealed, sessionCode, pageId }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#03112a',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 2, padding: '28px 60px 0' }}>
        Les parcours remboursés
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 0 }}>
        {/* Question + définition */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 56px', gap: 32,
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}>
          <h1 style={{
            fontSize: tiersPayantRevealed ? 34 : 48,
            fontWeight: 900, color: '#fff', textAlign: 'center',
            lineHeight: 1.2, transition: 'font-size .4s ease',
          }}>
            C'est quoi le tiers payant pour vous ?
          </h1>

          {tiersPayantRevealed && (
            <div style={{
              width: '100%',
              background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.25)',
              borderRadius: 20, padding: '28px 36px',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
                Définition
              </div>
              <p style={{ fontSize: 20, color: '#fff', fontWeight: 600, lineHeight: 1.55, margin: 0 }}>
                Le tiers payant est un système qui permet au client de{' '}
                <span style={{ color: '#00abe9' }}>ne pas avancer les frais</span>.
              </p>
              <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginTop: 14, marginBottom: 0 }}>
                La Sécurité Sociale et la mutuelle règlent directement l'opticien.
                Le client ne paie que son éventuel reste à charge —{' '}
                <span style={{ color: '#4ade80', fontWeight: 700 }}>chez nous, ce reste à charge est de 0 €, donc le client ne paie rien.</span>
              </p>
            </div>
          )}
        </div>

        {/* Réponses */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
          <OpenAnswersFeed sessionCode={sessionCode} pageId={pageId} revealed={answersRevealed} />
        </div>
      </div>
    </div>
  )
}

// ── TV Le montage — question ouverte (révélation manuelle formateur) ──
function TVMontageQuestion({ page, sessionCode }) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    setRevealed(false)
    const key = `montage_revealed__${page.id}`
    const poll = async () => {
      try {
        const state = await getRoomSharedState(sessionCode)
        setRevealed(!!state?.[key])
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [page.id, sessionCode])

  return (
    <div style={{ minHeight: '100vh', background: '#03112a', display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, padding: '28px 60px 0' }}>
        Le montage
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 0 }}>
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '40px 56px', gap: 32,
          borderRight: '1px solid rgba(255,255,255,0.07)',
        }}>
          {page.icon && (
            <div style={{
              width: 110, height: 110, borderRadius: '50%',
              background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 50px rgba(245,158,11,0.18)',
            }}>
              <span style={{ fontSize: 52, lineHeight: 1 }}>{page.icon}</span>
            </div>
          )}
          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.25 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }}>Répondez sur votre téléphone</p>
        </div>
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column' }}>
          <OpenAnswersFeed sessionCode={sessionCode} pageId={page.id} revealed={revealed} />
        </div>
      </div>
    </div>
  )
}

// ── TV Le montage — pages d'explication (blocs statiques) ───────────
function TVMontageInfo({ page }) {
  return (
    <div style={{ background: '#03112a', minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '40px 64px', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        {page.icon && <span style={{ fontSize: 44 }}>{page.icon}</span>}
        <h1 style={{ fontSize: 38, fontWeight: 900, color: '#fff', margin: 0 }}>{page.titre}</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
        {(page.blocks || []).map((b, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,158,11,0.2)',
            borderLeft: '4px solid #f59e0b', borderRadius: 16, padding: '20px 26px',
            display: 'flex', alignItems: 'flex-start', gap: 18,
          }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>{b.icon}</span>
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{b.title}</div>
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{b.desc}</div>
            </div>
          </div>
        ))}
      </div>
      {page.footer && (
        page.footerStrong ? (
          <div style={{
            marginTop: 32, maxWidth: 900, padding: '26px 36px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(245,158,11,0.05))',
            border: '2px solid rgba(245,158,11,0.5)', borderRadius: 20,
            fontSize: 28, color: '#fff', fontWeight: 900, lineHeight: 1.4,
            boxShadow: '0 0 50px rgba(245,158,11,0.15)',
          }}>
            {page.footer}
          </div>
        ) : (
          <div style={{ marginTop: 24, maxWidth: 900, padding: '16px 24px', background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.25)', borderRadius: 14, fontSize: 16, color: '#00abe9', fontWeight: 700, lineHeight: 1.5 }}>
            {page.footer}
          </div>
        )
      )}
    </div>
  )
}

// ── TV Montures Outlet — schéma animé Rodenstock → Centre logistique → Magasin ──
function OutletLensesEnvelope() {
  return (
    <div style={{
      width: 50, height: 38, borderRadius: 5,
      background: 'linear-gradient(135deg, #f1f5f9, #cbd5e1)',
      border: '1px solid rgba(255,255,255,0.4)',
      position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 0,
        borderLeft: '25px solid transparent', borderRight: '25px solid transparent',
        borderTop: '19px solid #94a3b8',
      }} />
      <span style={{ fontSize: 16, zIndex: 1 }}>👓</span>
    </div>
  )
}

function OutletLptBox() {
  return (
    <div style={{
      width: 56, height: 42, borderRadius: 8,
      background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
    }}>
      <Image src="/assets/logo-lpt.png" alt="LPT" width={40} height={16} style={{ objectFit: 'contain' }} />
    </div>
  )
}

function TVOutletFlow({ variant, titre }) {
  const isOutlet = variant === 'outlet'
  const [phase, setPhase] = useState(0)
  const [loopKey, setLoopKey] = useState(0)

  useEffect(() => {
    setPhase(0)
    const T = [
      setTimeout(() => setPhase(1), 1800),
      setTimeout(() => setPhase(2), 3800),
      setTimeout(() => setPhase(3), 6300),
      setTimeout(() => setPhase(4), 8800),
      setTimeout(() => setPhase(5), 10800),
      setTimeout(() => setLoopKey(k => k + 1), 14200),
    ]
    return () => T.forEach(clearTimeout)
  }, [variant, loopKey])

  const pkgLeft = phase <= 2 ? '50%' : phase <= 3 ? '50%' : '91%'
  const startLeft = phase === 0 ? '9%' : pkgLeft
  const showBox = !isOutlet && phase >= 3
  const accent = isOutlet ? '#f59e0b' : '#4ade80'

  const labels = isOutlet ? [
    'Rodenstock envoie les verres',
    'Les verres sont en transit vers le centre logistique',
    'Le centre logistique reçoit les verres — seuls',
    "Il n'a plus la monture en stock ❌",
    'Il nous envoie les verres seuls, sans monture',
    'Nous recevons les verres — la monture est déjà chez nous 👓',
  ] : [
    'Rodenstock envoie les verres',
    'Les verres sont en transit vers le centre logistique',
    'Le centre logistique reçoit les verres — seuls',
    'Il les monte sur la monture, déjà en stock chez eux',
    'Il nous envoie la paire complète',
    'Nous recevons la paire, prête à remettre ✅',
  ]
  const pkgLabel = labels[phase]

  const NODE = { textAlign: 'center', width: 150 }

  return (
    <div style={{ minHeight: '100vh', background: '#03112a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', gap: 8 }}>
      {titre && <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', margin: '0 0 8px', textAlign: 'center' }}>{titre}</h1>}

      <div style={{ position: 'relative', width: '100%', maxWidth: 1100, height: 260 }}>
        {/* Ligne de connexion */}
        <div style={{ position: 'absolute', top: 60, left: '9%', right: '9%', height: 3, background: 'rgba(255,255,255,0.12)', borderRadius: 2 }} />

        {/* Nœud Rodenstock */}
        <div style={{ position: 'absolute', top: 0, left: '9%', transform: 'translateX(-50%)', ...NODE }}>
          <div style={{ fontSize: 44 }}>🏭</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>Rodenstock</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Fournisseur</div>
        </div>

        {/* Nœud Centre logistique */}
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', ...NODE }}>
          <div style={{ fontSize: 44 }}>🏢</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>Centre logistique</div>
          <div style={{
            marginTop: 6, display: 'inline-block', padding: '3px 12px', borderRadius: 20,
            fontSize: 11, fontWeight: 700,
            background: isOutlet ? 'rgba(245,158,11,0.15)' : 'rgba(74,222,128,0.15)',
            border: `1px solid ${isOutlet ? 'rgba(245,158,11,0.4)' : 'rgba(74,222,128,0.4)'}`,
            color: isOutlet ? '#f59e0b' : '#4ade80',
          }}>{isOutlet ? '❌ Monture épuisée' : '✅ Monture en stock'}</div>
        </div>

        {/* Nœud Magasin */}
        <div style={{ position: 'absolute', top: 0, left: '91%', transform: 'translateX(-50%)', ...NODE }}>
          <div style={{ fontSize: 44 }}>🏬</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>Magasin</div>
          {isOutlet && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>👓 Monture déjà ici</div>
          )}
        </div>

        {/* Colis animé — enveloppe (verres) ou boîte LPT blanche (paire complète) */}
        <div style={{
          position: 'absolute', top: 38, left: startLeft, transform: 'translate(-50%, 0)',
          transition: 'left 1.9s cubic-bezier(0.65,0,0.35,1)',
        }}>
          <div key={showBox ? 'box' : 'env'} style={{ animation: 'cardPopIn .4s ease' }}>
            {showBox ? <OutletLptBox /> : <OutletLensesEnvelope />}
          </div>
        </div>

        {/* Label d'étape */}
        <div style={{ position: 'absolute', top: 170, left: 0, right: 0, textAlign: 'center' }}>
          <div key={pkgLabel} style={{
            display: 'inline-block', animation: 'cardPopIn .35s ease',
            background: `${accent}12`, border: `1px solid ${accent}45`,
            borderRadius: 20, padding: '10px 24px', fontSize: 15, fontWeight: 700, color: '#fff',
          }}>{pkgLabel}</div>
        </div>
      </div>
    </div>
  )
}

// ── TV Le montage — animation de l'upgrade (gamme de traitements) ───
function TVMontageUpgrade({ sessionCode }) {
  const [orderedIdx, setOrderedIdx] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(null)
  const [status, setStatus]         = useState('picking')
  const [foundIdx, setFoundIdx]     = useState(null)
  const [removedSet, setRemovedSet] = useState(() => new Set())
  const [fallingSet, setFallingSet] = useState(() => new Set())
  const prevCurrentRef = useRef(null)
  const prevOrderedRef = useRef(null)
  const introDoneRef   = useRef(false)

  useEffect(() => {
    const poll = async () => {
      try {
        const state = await getRoomSharedState(sessionCode)
        const ordered = state?.montage_up_ordered ?? null
        const current = state?.montage_up_current ?? null
        setStatus(state?.montage_up_status || 'picking')
        setFoundIdx(state?.montage_up_found_idx ?? null)
        setOrderedIdx(ordered)

        // Reset (bouton « Recommencer ») : on oublie l'exemple précédent pour que le
        // choix suivant — même identique — rejoue bien la cascade d'intro.
        if (ordered == null) {
          prevOrderedRef.current = null
          prevCurrentRef.current = null
          introDoneRef.current = false
          setCurrentIdx(null)
          setRemovedSet(new Set())
          setFallingSet(new Set())
          return
        }

        // Nouvel exemple : tous les traitements apparaissent, puis ceux en dessous
        // du choix du client tombent aussitôt (cascade automatique, sans clic)
        if (ordered != null && prevOrderedRef.current !== ordered) {
          prevOrderedRef.current = ordered
          prevCurrentRef.current = ordered
          introDoneRef.current = ordered === 0
          setRemovedSet(new Set())
          setFallingSet(new Set())
          setCurrentIdx(ordered)
          if (ordered > 0) {
            const below = new Set(Array.from({ length: ordered }, (_, i) => i))
            setTimeout(() => {
              setFallingSet(below)
              setTimeout(() => {
                setRemovedSet(r => new Set([...r, ...below]))
                setFallingSet(new Set())
                introDoneRef.current = true
              }, 650 + ordered * 70)
            }, 150)
          }
          return
        }

        // Progression normale (« je l'ai pas ») une fois l'intro terminée
        if (introDoneRef.current && prevCurrentRef.current != null && current != null && current > prevCurrentRef.current) {
          const leaving = prevCurrentRef.current
          setFallingSet(f => new Set([...f, leaving]))
          setTimeout(() => {
            setRemovedSet(r => new Set([...r, leaving]))
            setFallingSet(f => { const n = new Set(f); n.delete(leaving); return n })
          }, 650)
        }
        prevCurrentRef.current = current
        setCurrentIdx(current)
      } catch { /* ignore */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [sessionCode])

  if (status === 'picking' || orderedIdx == null) {
    return (
      <div style={{ minHeight: '100vh', background: '#03112a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <div style={{ fontSize: 56 }}>⬆️</div>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: '#fff', textAlign: 'center' }}>L&apos;upgrade, qu&apos;est-ce que c&apos;est ?</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 20, padding: '10px 24px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'waitingPulse 1.4s ease-in-out infinite' }} />
          <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>En attente du choix du formateur…</span>
        </div>
      </div>
    )
  }

  if (status === 'found' && foundIdx != null) {
    const t = MONTAGE_TRAITEMENTS[foundIdx]
    return (
      <div style={{ minHeight: '100vh', background: '#03112a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
        <div style={{
          animation: 'successPop .5s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
          background: 'rgba(34,197,94,0.08)', border: '2px solid rgba(34,197,94,0.4)',
          borderRadius: 28, padding: '48px 64px', maxWidth: 720, textAlign: 'center',
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(34,197,94,0.15)', border: '3px solid #4ade80',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
          }}>✅</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 2 }}>Traitement trouvé</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: 0 }}>{t?.label}</h1>
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.75)', fontWeight: 600, lineHeight: 1.5, margin: 0 }}>
            Le client aura le traitement <span style={{ color: '#4ade80' }}>{t?.label}</span> en 10 minutes, promesse tenue !
          </p>
        </div>
      </div>
    )
  }

  const orderedLabel = MONTAGE_TRAITEMENTS[orderedIdx]?.label
  const cards = MONTAGE_TRAITEMENTS
    .map((t, idx) => ({ ...t, idx }))
    .filter(c => !removedSet.has(c.idx))

  return (
    <div style={{ minHeight: '100vh', background: '#03112a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', gap: 32, overflow: 'hidden' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 2 }}>
        Le client a commandé : <span style={{ color: '#f59e0b' }}>{orderedLabel}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap', maxWidth: 1300 }}>
        {cards.map(c => {
          const isCurrent = c.idx === currentIdx
          const isFalling = fallingSet.has(c.idx)
          return (
            <div key={c.id} style={{
              animation: isFalling
                ? `cardFallAway .65s cubic-bezier(0.4,0,0.8,0.4) ${c.idx * 70}ms forwards`
                : 'cardPopIn .4s cubic-bezier(0.22,1,0.36,1)',
              background: isCurrent ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
              border: isCurrent ? '2.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: isCurrent ? 24 : 16,
              padding: isCurrent ? '40px 48px' : '20px 24px',
              textAlign: 'center',
              boxShadow: isCurrent ? '0 0 50px rgba(245,158,11,0.22)' : 'none',
              transition: 'all .4s cubic-bezier(0.22,1,0.36,1)',
              opacity: isCurrent ? 1 : 0.4,
            }}>
              {isCurrent && (
                <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Traitement à trouver</div>
              )}
              <div style={{ fontSize: isCurrent ? 32 : 15, fontWeight: isCurrent ? 900 : 700, color: isCurrent ? '#fff' : 'rgba(255,255,255,0.55)' }}>
                {c.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TVParcoursOffres({ parcoursRevealed }) {
  const revealed = parcoursRevealed || []

  const offres = [
    {
      id: 'supreme',
      nom: 'Suprême',
      color: '#8B7186',
      colorBg: 'rgba(139,113,134,0.1)',
      colorBorder: 'rgba(139,113,134,0.35)',
      points: [
        '1 paire achetée, une paire offerte',
        'Choix sur tout le magasin (montures et verres)',
        'Verres Origine France Garantie',
        'Uniquement avec tiers payant complet',
        'Non compatible avec la CSS',
      ],
    },
    {
      id: '1=1',
      nom: '1=1 100% Santé',
      color: '#6aad54',
      colorBg: 'rgba(106,173,84,0.07)',
      colorBorder: 'rgba(106,173,84,0.3)',
      points: [
        '1 paire achetée, une paire offerte',
        'Sur tout le magasin (montures et verres au choix)',
        'Tarifs 100% Santé : 0 € de reste à charge quelle que soit la mutuelle',
      ],
      note: '💡 Le 100% Santé est un dispositif légal qui garantit des lunettes entièrement remboursées par la Sécu et la mutuelle — sans aucun reste à charge pour le client.',
    },
  ]

  return (
    <div style={{
      minHeight: '100vh', background: '#03112a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 60px', boxSizing: 'border-box',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 40 }}>
        Les parcours remboursés
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, width: '100%', maxWidth: 1060 }}>
        {offres.map(o => {
          const isRevealed = revealed.includes(o.id)
          return (
            <div key={o.id} style={{
              background: o.colorBg,
              border: `2px solid ${o.colorBorder}`,
              borderRadius: 28, padding: '44px 40px',
              display: 'flex', flexDirection: 'column',
              minHeight: 260,
              transition: 'all .4s ease',
            }}>
              <div style={{ fontSize: 52, fontWeight: 900, color: o.color, letterSpacing: -1, marginBottom: isRevealed ? 28 : 0 }}>
                {o.nom}
              </div>
              {isRevealed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {o.points.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: o.color, marginTop: 8, flexShrink: 0 }} />
                      <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{p}</span>
                    </div>
                  ))}
                  {o.note && (
                    <div style={{ marginTop: 6, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderLeft: `3px solid ${o.color}`, borderRadius: '0 10px 10px 0' }}>
                      <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: 1.55 }}>{o.note}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TV : Démarche remboursement ───────────────────────────────────
const AMELIPRO_URL = 'https://authps-espacepro.ameli.fr/oauth2/authorize?response_type=code&scope=openid%20profile%20infosps%20email&client_id=csm-cen-prod_ameliprotransverse-connexionadmin_1_amtrx_i1_csm-cen-prod%2Fameliprotransverse-connexionadmin_1%2Famtrx_i1&state=AjMjWnxZwchYEjmuwYdOF2ogOMc&redirect_uri=https%3A%2F%2Fespacepro.ameli.fr%2Fpage-accueil-ihm%2Fredirect_uri&nonce=lbfIe0l3pfPl3Jg_NqJOPNZ_8ZLrL1VJFulngzVD6gY'

function TVRembFrDemarche({ stepA, stepB, onAmeliProClick }) {
  const STEPS_A = [
    "Prendre l'ordonnance, la carte Vitale et la mutuelle du client.",
    null, // amelipro
    "Faire le Test Suprême si mutuelle autre que CSS — sinon 1=1 directement.",
    "Retourner voir le client et adapter le discours.",
  ]
  const STEPS_B = [
    "Prendre la carte Vitale et verifier la mutuelle.",
    null, // amelipro
    "Si AMELIPRO ok → inscrire en examen de vue et obtenir ordonnance via LYLEOO.",
    "Faire le Test Suprême avec l'ordonnance obtenue — sauf si CSS → 1=1.",
  ]

  const AmeliTV = ({ isVisible }) => (
    <a
      href={AMELIPRO_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onAmeliProClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, verticalAlign: 'middle',
        padding: '10px 18px', borderRadius: 14,
        background: 'rgba(0,137,186,0.15)',
        border: '2px solid rgba(0,137,186,0.6)',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'all .2s',
        pointerEvents: 'auto',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo-amelipro.svg" alt="AMELIPRO" width={52} height={52} style={{ objectFit: 'contain' }} />
      <span style={{ fontSize: 16, fontWeight: 700, color: '#00abe9' }}>
        Cliquer pour ouvrir →
      </span>
    </a>
  )
  const SupremeTV = () => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, verticalAlign: 'middle' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={28} height={28} style={{ objectFit: 'contain' }} />
      <span style={{ fontSize: 16, fontWeight: 800, color: '#4ade80' }}>Test Suprême</span>
    </span>
  )

  const renderStep = (txt, index, revealed, isB) => {
    const isAmeliPro = txt === null
    const isSupreme = !isB
      ? index === 2
      : index === 3
    const label = index + 1
    const vis = index < revealed

    return (
      <div key={index} style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(12px)',
        transition: `opacity .4s ${index * 0.1}s, transform .4s ${index * 0.1}s`,
        background: vis ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
        border: vis ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.04)',
        borderRadius: 12, padding: '12px 16px',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: vis ? 'rgba(0,171,233,0.2)' : 'rgba(255,255,255,0.06)',
          fontSize: 16, fontWeight: 900, color: vis ? '#00abe9' : 'rgba(255,255,255,0.2)',
        }}>{label}</div>
        <div style={{ fontSize: 18, color: vis ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)', lineHeight: 1.5, transition: 'all .3s' }}>
          {isAmeliPro ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span>Aller a l&apos;ordinateur sur <strong>AMELIPRO</strong> pour vérifier la date du dernier remboursement.</span>
              <div><AmeliTV isVisible={vis} /></div>
            </div>
          ) : isSupreme ? (
            <span>{txt} <SupremeTV /></span>
          ) : txt}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '40px 56px', fontFamily: 'inherit',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Remboursement optique · France
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 900, color: '#fff', margin: 0 }}>
          Quand un client souhaite se faire rembourser je dois donc :
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, flex: 1 }}>
        {/* Scénario A */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            padding: '10px 16px', background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.25)', borderRadius: 10,
          }}>
            <span style={{ fontSize: 22 }}>📋</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1 }}>Scénario A</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>Avec ordonnance valide</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STEPS_A.map((txt, i) => renderStep(txt, i, stepA, false))}
          </div>
        </div>

        {/* Scénario B */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            padding: '10px 16px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10,
          }}>
            <span style={{ fontSize: 22 }}>🚫</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1 }}>Scénario B</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>Sans ordonnance valide</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {STEPS_B.map((txt, i) => renderStep(txt, i, stepB, true))}
          </div>
        </div>
      </div>

      {/* Note bas */}
      <div style={{
        marginTop: 28, padding: '14px 20px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, textAlign: 'center',
      }}>
        <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Si après vérification le client n&apos;a pas droit au remboursement :</strong>
        {' '}proposer l&apos;offre <strong style={{ color: '#fff' }}>1=1</strong> ou <strong style={{ color: '#fff' }}>Classique</strong> sans remboursement, à ses frais.
      </div>
    </div>
  )
}

// ── TV : Test Suprême ─────────────────────────────────────────────
function TVRembFrSupreme({ supremeStep }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '48px 72px', fontFamily: 'inherit',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={64} height={64} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#4db85c', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
            LPT Santé
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -0.5 }}>Test Suprême</h1>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 28, width: '100%', maxWidth: 1000 }}>
        {/* Accepte */}
        <div style={{
          flex: 1,
          opacity: supremeStep >= 1 ? 1 : 0.15,
          transform: supremeStep >= 1 ? 'scale(1)' : 'scale(0.96)',
          transition: 'all .5s',
          background: supremeStep >= 1 ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)',
          border: supremeStep >= 1 ? '1.5px solid rgba(74,222,128,0.28)' : '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
        }}>
          <div style={{
            alignSelf: 'flex-start', padding: '5px 18px', borderRadius: 20,
            background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
            fontSize: 16, fontWeight: 900, color: '#4ade80', letterSpacing: 1,
          }}>ACCEPTE ✓</div>
          {/* Popup mockup */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '22px 22px 16px',
            width: '100%', maxWidth: 290, textAlign: 'center',
            boxShadow: '0 6px 32px rgba(0,0,0,0.4)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
              <img src="/assets/logo-lpt-sante.png" alt="" width={60} height={60} style={{ objectFit: 'contain', display: 'block' }} />
              <div style={{ position: 'absolute', top: -8, left: -4, display: 'flex', gap: 2 }}>
                <span style={{ background: '#aaa', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>1.01</span>
                <span style={{ background: '#e6a817', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>91</span>
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 8, lineHeight: 1.2 }}>
              Remboursements enregistrés
            </div>
            <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: 16 }}>
              Vous pouvez maintenant créer une commande Suprême.
            </div>
            <div style={{ background: '#2a5080', borderRadius: 10, padding: '10px 0', fontSize: 14, fontWeight: 600, color: '#fff' }}>OK</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 12, width: '100%',
          }}>
            <span style={{ fontSize: 26 }}>🎉</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>Parcours Supreme</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>Client repart avec 2 paires pour 0 €</div>
            </div>
          </div>
        </div>

        {/* Refuse */}
        <div style={{
          flex: 1,
          opacity: supremeStep >= 2 ? 1 : 0.15,
          transform: supremeStep >= 2 ? 'scale(1)' : 'scale(0.96)',
          transition: 'all .5s .12s',
          background: supremeStep >= 2 ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
          border: supremeStep >= 2 ? '1.5px solid rgba(239,68,68,0.28)' : '1px solid rgba(255,255,255,0.07)',
          borderRadius: 20, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center',
        }}>
          <div style={{
            alignSelf: 'flex-start', padding: '5px 18px', borderRadius: 20,
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 16, fontWeight: 900, color: '#f87171', letterSpacing: 1,
          }}>REFUSE ✗</div>
          {/* Popup mockup */}
          <div style={{
            background: '#fff', borderRadius: 16, padding: '22px 22px 16px',
            width: '100%', maxWidth: 290, textAlign: 'center',
            boxShadow: '0 6px 32px rgba(0,0,0,0.4)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14, marginTop: 8 }}>
              <svg width={48} height={48} viewBox="0 0 48 48" style={{ position: 'absolute', top: -18, left: -16 }}>
                <polygon points="24,2 46,44 2,44" fill="#f5c842" strokeLinejoin="round"/>
                <text x="24" y="38" textAnchor="middle" fontSize="22" fontWeight="900" fill="white">!</text>
              </svg>
              <div style={{ marginLeft: 8 }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src="/assets/logo-lpt-sante.png" alt="" width={50} height={50} style={{ objectFit: 'contain', display: 'block' }} />
                  <div style={{ position: 'absolute', top: -8, left: -4, display: 'flex', gap: 2 }}>
                    <span style={{ background: '#aaa', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>1.01</span>
                    <span style={{ background: '#e6a817', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>95</span>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 8, lineHeight: 1.2 }}>
              L&apos;envoi de devis OptoAMC a échoué
            </div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5, marginBottom: 14 }}>
              Erreur OptoAMC. Le remboursement est trop faible pour réaliser cette commande Suprême
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 600, color: '#2a5080', background: '#f0f0f0' }}>Annuler</div>
              <div style={{ flex: 1.4, background: '#2a5080', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 700, color: '#fff' }}>Envoyer une PEC</div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, width: '100%',
          }}>
            <span style={{ fontSize: 26 }}>🎉</span>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171' }}>Parcours 1=1</div>
              <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>Client repart avec 2 paires pour 0 €</div>
            </div>
          </div>
        </div>
      </div>

      {/* Note Slack */}
      <div style={{
        marginTop: 28, padding: '14px 22px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 14, fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
        maxWidth: 820, textAlign: 'center',
      }}>
        <strong style={{ color: 'rgba(255,255,255,0.7)' }}>Message d&apos;erreur incompréhensible ?</strong>
        {' '}Demandez aux collègues — sinon, photo sur{' '}
        <strong style={{ color: '#fff' }}>#tiers-payant</strong> Slack en identifiant{' '}
        <strong style={{ color: '#fff' }}>@NathanVision</strong>. Le BOT répond en quelques secondes.
      </div>
    </div>
  )
}

function TVRembFrConditions({ rembfrRevealed }) {
  const revealed = rembfrRevealed || []
  const ordoRevealed = revealed.includes('ordonnance')
  const delaisRevealed = revealed.includes('delais')

  const BG = '#03112a'
  const CARD = '#0d1f3c'
  const BLUE = '#0089ba'
  const BLUE_L = '#00abe9'

  const LockDots = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 20 }}>
      <div style={{ fontSize: 22, opacity: 0.3 }}>🔒</div>
      {[1,2,3].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', animation: `pulse ${0.9 + i * 0.2}s ease-in-out infinite alternate` }} />
      ))}
    </div>
  )

  const conditions = [
    {
      id: 'couverture',
      num: '01',
      titre: 'Être couvert par la Sécurité Sociale',
      detail: 'et une mutuelle complémentaire ou la Complémentaire Santé Solidaire (CSS)',
      alwaysVisible: true,
      content: (
        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,137,186,0.1)', borderRadius: 10, border: '1px solid rgba(0,137,186,0.2)' }}>
            <span style={{ fontSize: 20 }}>🏥</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Sécurité Sociale</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Remboursement de base</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,137,186,0.1)', borderRadius: 10, border: '1px solid rgba(0,137,186,0.2)' }}>
            <span style={{ fontSize: 20 }}>🤝</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Mutuelle / CSS</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Complète le remboursement SS</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ordonnance',
      num: '02',
      titre: 'Avoir une ordonnance en cours de validité',
      detail: 'La durée de validité dépend de l\'âge du patient',
      alwaysVisible: false,
      content: ordoRevealed ? (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Moins de 16 ans', duree: '1 an', color: '#f59e0b' },
            { label: 'De 16 à 42 ans', duree: '5 ans', color: BLUE_L },
            { label: '43 ans et plus', duree: '3 ans', color: '#a78bfa' },
          ].map(row => (
            <div key={row.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{row.label}</span>
              <span style={{ fontSize: 19, fontWeight: 900, color: row.color }}>{row.duree}</span>
            </div>
          ))}
          {/* LYLEOO */}
          <div style={{
            marginTop: 4, padding: '11px 14px',
            background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.25)',
            borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#c9a227', marginBottom: 3 }}>
                Pas d'ordonnance valable ? → LYLEOO
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                Pour les +18 ans uniquement · Uniquement pour débloquer un remboursement ·
                Après vérification de tous les autres critères
              </div>
            </div>
          </div>
        </div>
      ) : <LockDots />,
    },
    {
      id: 'delais',
      num: '03',
      titre: 'Respecter les délais de renouvellement',
      detail: 'Des règles différentes selon l\'âge',
      alwaysVisible: false,
      content: delaisRevealed ? (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Moins de 16 ans */}
          <div style={{ padding: '12px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Moins de 16 ans</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              Renouvellement <strong style={{ color: '#fff' }}>tous les ans</strong> sans condition<br />
              Renouvellement <strong style={{ color: '#fff' }}>sans délai</strong> si changement de correction ≥ 0,50
            </div>
          </div>
          {/* Plus de 16 ans */}
          <div style={{ padding: '12px 14px', background: `rgba(0,171,233,0.07)`, border: `1px solid rgba(0,171,233,0.2)`, borderRadius: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: BLUE_L, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>16 ans et plus</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
              Renouvellement <strong style={{ color: '#fff' }}>tous les 2 ans</strong><br />
              Anticipé après <strong style={{ color: '#fff' }}>1 an et 1 jour</strong> si changement ≥ 0,50
            </div>
          </div>
          {/* AMELIPRO */}
          <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>💻</span>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
              Date du dernier remboursement vérifiable sur <strong style={{ color: BLUE_L }}>AMELIPRO</strong> via le numéro de sécurité sociale du patient
            </div>
          </div>
        </div>
      ) : <LockDots />,
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${BG} 0%, #001a3d 100%)`,
      display: 'flex', flexDirection: 'column',
      padding: '40px 48px',
      fontFamily: 'inherit',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Remboursement optique · France
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', margin: 0, letterSpacing: -0.5 }}>
          Les conditions de remboursement
        </h1>
      </div>

      {/* 3 cartes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, flex: 1 }}>
        {conditions.map(c => (
          <div key={c.id} style={{
            background: CARD, border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: 18, padding: '22px 18px',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Numéro */}
            <div style={{
              fontSize: 13, fontWeight: 900, color: BLUE, letterSpacing: 2,
              marginBottom: 12,
            }}>{c.num}</div>
            {/* Titre */}
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 6 }}>
              {c.titre}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.45, marginBottom: 4 }}>
              {c.detail}
            </div>
            {/* Contenu */}
            <div style={{ flex: 1 }}>{c.content}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TV Mutuelles Reveal ───────────────────────────────────────────
function TVMutuellesReveal({ mutuellesRevealed }) {
  const revealed = mutuellesRevealed || []
  const revealedMutuelles = MUTUELLES_BELGIQUE.filter(m => revealed.includes(m.id))

  if (revealedMutuelles.length === 0) {
    return (
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center',
          background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)',
          borderRadius: 20, padding: '4px 16px',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            Mutuelles et INAMI · Belgique
          </span>
        </div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#fff' }}>Les organismes assureurs</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', animation: `waitingPulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    )
  }

  const cols = revealedMutuelles.length <= 2 ? revealedMutuelles.length : revealedMutuelles.length <= 4 ? 2 : 3

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #001a3d 100%)',
      display: 'flex', flexDirection: 'column', padding: '32px 52px', gap: 20,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center',
            background: 'rgba(201,162,39,0.15)', border: '1px solid rgba(201,162,39,0.3)',
            borderRadius: 20, padding: '4px 16px', marginBottom: 10,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a227', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              Mutuelles et INAMI · Belgique
            </span>
          </div>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
            Les organismes assureurs reconnus
          </div>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          {revealedMutuelles.length} / {MUTUELLES_BELGIQUE.length} dévoilé{revealedMutuelles.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Cartes révélées */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, flex: 1 }}>
        {revealedMutuelles.map((m) => (
          <div key={m.id} style={{
            background: 'linear-gradient(160deg, rgba(201,162,39,0.12) 0%, rgba(201,162,39,0.04) 100%)',
            border: '1px solid rgba(201,162,39,0.4)',
            borderRadius: 18, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            animation: 'fadeSlideUp .4s ease both',
          }}>
            <div style={{ height: 5, background: 'linear-gradient(90deg, #a07818, #c9a227)' }} />

            <div style={{ padding: '22px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Nom */}
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 4 }}>
                  {m.nom}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {m.type}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

              {/* Badge optique ou non — affiché à la révélation */}
              {m.complementaire ? (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                  borderRadius: 10, padding: '7px 12px', alignSelf: 'flex-start',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#4ade80' }}>Assurance complémentaire optique</span>
                </div>
              ) : (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 10, padding: '7px 12px', alignSelf: 'flex-start',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171' }}>Sans assurance complémentaire optique</span>
                </div>
              )}

              {/* Détails si disponibles */}
              {m.montant && m.montant !== '0 €' && m.montant !== 'Aucun' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <div style={{
                    background: 'rgba(201,162,39,0.12)', border: '1px solid rgba(201,162,39,0.3)',
                    borderRadius: 12, padding: '12px 16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Montant</span>
                    <span style={{ fontSize: 24, fontWeight: 900, color: '#c9a227', letterSpacing: -0.5 }}>{m.montant}</span>
                  </div>
                  {m.frequence && m.frequence !== '/' && (
                    <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Fréquence</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45 }}>{m.frequence}</div>
                    </div>
                  )}
                  {m.particularites && m.particularites !== '/' && (
                    <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: 10, padding: '10px 14px', flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Particularités</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{m.particularites}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Helpers SVG réutilisables (tiers payant explication) ──────────────
// Rendu façon "illustration pro" : cartes façon vraie carte bancaire/vitale
// (dégradé, puce détaillée, reflet), badge LPT avec icône lunettes vectorielle
// (au lieu de l'emoji, rendu inconsistant selon les appareils), personnage
// en silhouette vectorielle, pièces et facture avec relief/dégradé.
function tpCardChip(chipGradId) {
  return (
    <g transform="translate(13,13)">
      <rect width="26" height="19" rx="3.5" fill={`url(#${chipGradId})`} />
      <line x1="0" y1="6.5" x2="26" y2="6.5" stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" />
      <line x1="0" y1="13" x2="26" y2="13" stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" />
      <line x1="9" y1="0" x2="9" y2="19" stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" />
      <line x1="17.5" y1="0" x2="17.5" y2="19" stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" />
    </g>
  )
}

function tpCard({ w, h, cardGradId, chipGradId, label, sub }) {
  return (
    <>
      <rect width={w} height={h} rx={12} fill={`url(#${cardGradId})`} />
      <rect width={w} height={h} rx={12} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      <ellipse cx={w - 20} cy={8} rx={w * 0.4} ry={h * 0.36} fill="rgba(255,255,255,0.08)" />
      {tpCardChip(chipGradId)}
      <text x={13} y={h - 22} fontSize="7.5" fill="rgba(255,255,255,0.6)" fontWeight="700" letterSpacing="1.4">{label}</text>
      <text x={13} y={h - 9} fontSize="12.5" fill="#fff" fontWeight="800">{sub}</text>
      <circle cx={w - 16} cy={h - 15} r={11} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.3" />
      <circle cx={w - 22} cy={h - 15} r={11} fill="none" stroke="rgba(255,255,255,0.13)" strokeWidth="1.3" />
    </>
  )
}

function tpLptBadge({ r, ringGradId }) {
  return (
    <>
      <circle r={r} fill={`url(#${ringGradId})`} />
      <circle r={r} fill="none" stroke="#00abe9" strokeWidth="2.6" />
      <circle r={r + 7} fill="none" stroke="#00abe9" strokeWidth="1.3" opacity="0.22">
        <animate attributeName="r" values={`${r + 4};${r + 10};${r + 4}`} dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.22;0;0.22" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <g transform={`translate(0,${-r * 0.18})`}>
        <ellipse cx={-r * 0.29} cy={0} rx={r * 0.26} ry={r * 0.19} fill="none" stroke="#00abe9" strokeWidth="2.6" />
        <ellipse cx={r * 0.29} cy={0} rx={r * 0.26} ry={r * 0.19} fill="none" stroke="#00abe9" strokeWidth="2.6" />
        <path d={`M ${-r * 0.03} -2 Q 0 -7 ${r * 0.03} -2`} fill="none" stroke="#00abe9" strokeWidth="2.6" />
        <path d={`M ${-r * 0.55} -3 Q ${-r * 0.68} -1 ${-r * 0.71} 4`} fill="none" stroke="#00abe9" strokeWidth="2.6" strokeLinecap="round" />
        <path d={`M ${r * 0.55} -3 Q ${r * 0.68} -1 ${r * 0.71} 4`} fill="none" stroke="#00abe9" strokeWidth="2.6" strokeLinecap="round" />
      </g>
      <text y={r * 0.62} textAnchor="middle" fontSize={r * 0.24} fill="#00abe9" fontWeight="900" letterSpacing="2.5">LPT</text>
    </>
  )
}

function tpPerson({ r, fill }) {
  return (
    <>
      <circle cy={-r * 0.28} r={r * 0.42} fill={fill} />
      <path d={`M ${-r * 0.62} ${r * 0.82} Q ${-r * 0.62} ${r * 0.1} 0 ${r * 0.1} Q ${r * 0.62} ${r * 0.1} ${r * 0.62} ${r * 0.82} Z`} fill={fill} />
    </>
  )
}

function tpCoinVisual({ gradId, textFill }) {
  return (
    <>
      <circle r="11.5" fill={`url(#${gradId})`} stroke="rgba(0,0,0,0.19)" strokeWidth="1" />
      <circle r="8.8" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.9" />
      <text y="4" textAnchor="middle" fontSize="11.5" fontWeight="900" fill={textFill}>€</text>
      <ellipse cx="-3.6" cy="-4.4" rx="3" ry="1.8" fill="rgba(255,255,255,0.55)" />
    </>
  )
}

function tpFactureVisual({ gradId }) {
  return (
    <>
      <rect x="-10" y="-12.5" width="20" height="25" rx="2.5" fill={`url(#${gradId})`} stroke="#a5640a" strokeWidth="0.7" />
      <rect x="-10" y="-12.5" width="20" height="7" rx="2.5" fill="rgba(255,255,255,0.22)" />
      <line x1="-5.5" y1="-1" x2="5.5" y2="-1" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="-5.5" y1="3.5" x2="5.5" y2="3.5" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="-5.5" y1="8" x2="0.5" y2="8" stroke="rgba(255,255,255,0.75)" strokeWidth="1.4" strokeLinecap="round" />
    </>
  )
}

function tpMovingCoins(pathId, gradId, textFill, dur, offsets) {
  return offsets.map((d, i) => (
    <g key={`${pathId}-${i}`}>
      <animateMotion dur={`${dur}s`} begin={`${d}s`} repeatCount="indefinite">
        <mpath href={`#${pathId}`} />
      </animateMotion>
      {tpCoinVisual({ gradId, textFill })}
    </g>
  ))
}

function tpMovingFactures(pathId, gradId, dur, offsets) {
  return offsets.map((d, i) => (
    <g key={`${pathId}-f${i}`}>
      <animateMotion dur={`${dur}s`} begin={`${d}s`} repeatCount="indefinite">
        <mpath href={`#${pathId}`} />
      </animateMotion>
      {tpFactureVisual({ gradId })}
    </g>
  ))
}

function TVTiersPayantExplication() {
  return (
    <div style={{
      background: '#03112a', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      padding: '28px 40px', gap: 18,
      fontFamily: 'inherit',
    }}>
      {/* Titre */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
          Parcours remboursés
        </div>
        <h2 style={{ fontSize: 30, fontWeight: 900, color: '#fff', margin: 0 }}>
          Comment fonctionne le tiers payant ?
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6, marginBottom: 0 }}>
          Dans les deux cas — reste à charge 0 pour le client
        </p>
      </div>

      {/* Deux diagrammes côte à côte */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1 }}>

        {/* ═══ TIERS PAYANT COMPLET ═══ */}
        <div style={{ background: 'rgba(74,222,128,0.04)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 20, overflow: 'hidden' }}>
          <svg viewBox="0 0 540 340" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="tp-vg-c" x1="10%" y1="0%" x2="95%" y2="100%">
                <stop offset="0%" stopColor="#5cb86a" /><stop offset="55%" stopColor="#2f8a45" /><stop offset="100%" stopColor="#1c5e30" />
              </linearGradient>
              <linearGradient id="tp-mg-c" x1="10%" y1="0%" x2="95%" y2="100%">
                <stop offset="0%" stopColor="#3d8bd8" /><stop offset="55%" stopColor="#1a5fb4" /><stop offset="100%" stopColor="#0c3d80" />
              </linearGradient>
              <linearGradient id="tp-chip-c" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffe9a8" /><stop offset="50%" stopColor="#e0b64f" /><stop offset="100%" stopColor="#a5791f" />
              </linearGradient>
              <radialGradient id="tp-lpt-ring-c" cx="50%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#123a6b" /><stop offset="100%" stopColor="#0a2447" />
              </radialGradient>
              <radialGradient id="tp-coin-gold-c" cx="32%" cy="28%" r="75%">
                <stop offset="0%" stopColor="#fff2c4" /><stop offset="55%" stopColor="#e8b93d" /><stop offset="100%" stopColor="#a5791f" />
              </radialGradient>
              <filter id="tp-shadow-c" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
              </filter>
              <marker id="tp-aw-c" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 9 3.5, 0 7" fill="#c9a227" opacity="0.55" />
              </marker>
              {/* Vitale centre (146,96) → LPT gauche (228,158) */}
              <path id="tp-pvc" d="M 146 96 C 196 96 222 145 228 158" />
              {/* Mutuelle centre (146,256) → LPT gauche (228,158) */}
              <path id="tp-pmc" d="M 146 256 C 196 256 222 170 228 158" />
            </defs>

            {/* Titre panneau */}
            <circle cx="24" cy="24" r="7" fill="#4ade80" />
            <text x="38" y="29" fontSize="15" fontWeight="800" fill="#4ade80">Tiers payant complet</text>

            {/* Carte Vitale — translate(12,52) */}
            <g transform="translate(12,52)" filter="url(#tp-shadow-c)">
              {tpCard({ w: 134, h: 82, cardGradId: 'tp-vg-c', chipGradId: 'tp-chip-c', label: 'CARTE VITALE', sub: 'Sécurité Sociale' })}
            </g>

            {/* Carte Mutuelle — translate(12,212) */}
            <g transform="translate(12,212)" filter="url(#tp-shadow-c)">
              {tpCard({ w: 134, h: 82, cardGradId: 'tp-mg-c', chipGradId: 'tp-chip-c', label: 'MUTUELLE', sub: 'Complémentaire' })}
            </g>

            {/* LPT — centre abs (276,158), rayon 50 */}
            <g transform="translate(276,158)" filter="url(#tp-shadow-c)">
              {tpLptBadge({ r: 50, ringGradId: 'tp-lpt-ring-c' })}
            </g>

            {/* Client = 0 — translate(446,240) */}
            <g transform="translate(446,240)" filter="url(#tp-shadow-c)">
              {tpPerson({ r: 30, fill: '#9fb4c9' })}
              <text y="46" textAnchor="middle" fontSize="10.5" fill="rgba(255,255,255,0.55)" fontWeight="600">Client</text>
              <rect x="-38" y="52" width="76" height="26" rx="13" fill="rgba(74,222,128,0.16)" stroke="rgba(74,222,128,0.5)" strokeWidth="1.3" />
              <text y="70" textAnchor="middle" fontSize="13" fill="#4ade80" fontWeight="900">0 €</text>
            </g>

            {/* Legende */}
            <text x="270" y="326" textAnchor="middle" fontSize="10.5" fill="rgba(255,255,255,0.28)" fontStyle="italic">
              La Vitale et la mutuelle règlent directement LPT
            </text>

            {/* Fleches */}
            <use href="#tp-pvc" fill="none" stroke="#c9a227" strokeWidth="1.6" strokeOpacity="0.16" markerEnd="url(#tp-aw-c)" />
            <use href="#tp-pmc" fill="none" stroke="#c9a227" strokeWidth="1.6" strokeOpacity="0.16" markerEnd="url(#tp-aw-c)" />

            {/* Pieces animees — ralenties pour rester lisibles */}
            {tpMovingCoins('tp-pvc', 'tp-coin-gold-c', '#5c3f0d', 3.6, [0, 1.2, 2.4])}
            {tpMovingCoins('tp-pmc', 'tp-coin-gold-c', '#5c3f0d', 3.6, [0.6, 1.8, 3.0])}
          </svg>
        </div>

        {/* ═══ TIERS PAYANT PARTIEL ═══ */}
        <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 20, overflow: 'hidden' }}>
          {/*
            Layout (viewBox 520x370) :
              Vitale     (12,44)  → centre (79,83)
              Client     (12,268) bloc détaillé, UN SEUL client
              LPT circle (256,130) rayon 48
              Mutuelle   (356,196) → centre (423,235)

            Flux :
              1. Vitale → LPT  (euros or)
              2. Client → LPT  (euros or — avance les frais)
              3. Client → Mutuelle (factures orange)
              4. Mutuelle → Client (euros verts — remboursement)
          */}
          <svg viewBox="0 0 520 370" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <linearGradient id="tp-vg-p" x1="10%" y1="0%" x2="95%" y2="100%">
                <stop offset="0%" stopColor="#5cb86a" /><stop offset="55%" stopColor="#2f8a45" /><stop offset="100%" stopColor="#1c5e30" />
              </linearGradient>
              <linearGradient id="tp-mg-p" x1="10%" y1="0%" x2="95%" y2="100%">
                <stop offset="0%" stopColor="#3d8bd8" /><stop offset="55%" stopColor="#1a5fb4" /><stop offset="100%" stopColor="#0c3d80" />
              </linearGradient>
              <linearGradient id="tp-chip-p" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffe9a8" /><stop offset="50%" stopColor="#e0b64f" /><stop offset="100%" stopColor="#a5791f" />
              </linearGradient>
              <radialGradient id="tp-lpt-ring-p" cx="50%" cy="35%" r="70%">
                <stop offset="0%" stopColor="#123a6b" /><stop offset="100%" stopColor="#0a2447" />
              </radialGradient>
              <radialGradient id="tp-coin-gold-p" cx="32%" cy="28%" r="75%">
                <stop offset="0%" stopColor="#fff2c4" /><stop offset="55%" stopColor="#e8b93d" /><stop offset="100%" stopColor="#a5791f" />
              </radialGradient>
              <radialGradient id="tp-coin-green-p" cx="32%" cy="28%" r="75%">
                <stop offset="0%" stopColor="#c8f7d4" /><stop offset="55%" stopColor="#4ade80" /><stop offset="100%" stopColor="#1f8f4f" />
              </radialGradient>
              <linearGradient id="tp-facture-p" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffc978" /><stop offset="100%" stopColor="#e08a1f" />
              </linearGradient>
              <filter id="tp-shadow-p" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity="0.35" />
              </filter>
              <marker id="tp-aw-p-gold" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 9 3.5, 0 7" fill="#c9a227" opacity="0.55" />
              </marker>
              <marker id="tp-aw-p-orange" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 9 3.5, 0 7" fill="#f59e0b" opacity="0.65" />
              </marker>
              <marker id="tp-aw-p-green" markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
                <polygon points="0 0, 9 3.5, 0 7" fill="#4ade80" opacity="0.65" />
              </marker>
              {/* 1. Vitale droite (146,84) → LPT gauche (210,130) */}
              <path id="tp-pvp" d="M 142 84 C 188 84 205 118 210 130" />
              {/* 2. Client droite (96,260) → LPT bas-gauche (222,155) */}
              <path id="tp-pcp" d="M 96 258 C 162 258 198 150 210 140" />
              {/* 3. Client droite (96,272) → Mutuelle gauche (356,242) */}
              <path id="tp-pfp" d="M 96 272 C 192 278 288 265 356 245" />
              {/* 4. Mutuelle bas (423,278) → Client haut-droite (88,238) */}
              <path id="tp-prp" d="M 420 278 C 420 338 130 342 84 248" />
            </defs>

            {/* Titre panneau */}
            <circle cx="24" cy="24" r="7" fill="#f59e0b" />
            <text x="38" y="29" fontSize="15" fontWeight="800" fill="#f59e0b">Tiers payant partiel</text>

            {/* Carte Vitale — translate(12,44) */}
            <g transform="translate(12,44)" filter="url(#tp-shadow-p)">
              {tpCard({ w: 134, h: 78, cardGradId: 'tp-vg-p', chipGradId: 'tp-chip-p', label: 'CARTE VITALE', sub: 'Sécurité Sociale' })}
            </g>

            {/* Client UNIQUE — translate(54,268), bloc détaillé */}
            <g transform="translate(54,268)" filter="url(#tp-shadow-p)">
              <rect x="-44" y="-58" width="88" height="116" rx="18" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <g transform="translate(0,-26)">{tpPerson({ r: 20, fill: '#9fb4c9' })}</g>
              <text y="1" textAnchor="middle" fontSize="11.5" fill="rgba(255,255,255,0.6)" fontWeight="700">Client</text>
              <line x1="-30" y1="12" x2="30" y2="12" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              <text y="30" textAnchor="middle" fontSize="9.5" fill="#f59e0b" fontWeight="700">↑ avance les frais</text>
              <text y="46" textAnchor="middle" fontSize="9.5" fill="#4ade80" fontWeight="700">↓ se fait rembourser</text>
            </g>

            {/* LPT — centre abs (256,130), rayon 48 */}
            <g transform="translate(256,130)" filter="url(#tp-shadow-p)">
              {tpLptBadge({ r: 48, ringGradId: 'tp-lpt-ring-p' })}
            </g>

            {/* Mutuelle — translate(356,196) */}
            <g transform="translate(356,196)" filter="url(#tp-shadow-p)">
              {tpCard({ w: 134, h: 78, cardGradId: 'tp-mg-p', chipGradId: 'tp-chip-p', label: 'MUTUELLE', sub: 'Complémentaire' })}
            </g>

            {/* Label "facture" au milieu du chemin 3 */}
            <text x="228" y="256" textAnchor="middle" fontSize="9.5" fill="#f59e0b" opacity="0.85" fontWeight="700">facture</text>

            {/* Label "remboursement" au milieu du chemin 4 */}
            <text x="262" y="354" textAnchor="middle" fontSize="9.5" fill="#4ade80" opacity="0.85" fontWeight="700">remboursement</text>

            {/* Fleches */}
            <use href="#tp-pvp" fill="none" stroke="#c9a227" strokeWidth="1.6" strokeOpacity="0.16" markerEnd="url(#tp-aw-p-gold)" />
            <use href="#tp-pcp" fill="none" stroke="#c9a227" strokeWidth="1.6" strokeOpacity="0.16" markerEnd="url(#tp-aw-p-gold)" />
            <use href="#tp-pfp" fill="none" stroke="#f59e0b" strokeWidth="1.3" strokeOpacity="0.2" strokeDasharray="6 4" markerEnd="url(#tp-aw-p-orange)" />
            <use href="#tp-prp" fill="none" stroke="#4ade80" strokeWidth="1.6" strokeOpacity="0.2" markerEnd="url(#tp-aw-p-green)" />

            {/* 1. Vitale → LPT : euros or */}
            {tpMovingCoins('tp-pvp', 'tp-coin-gold-p', '#5c3f0d', 3.6, [0, 1.2, 2.4])}
            {/* 2. Client → LPT : euros or */}
            {tpMovingCoins('tp-pcp', 'tp-coin-gold-p', '#5c3f0d', 3.6, [0.6, 1.8, 3.0])}
            {/* 3. Client → Mutuelle : factures orange — ralenties pour rester lisibles */}
            {tpMovingFactures('tp-pfp', 'tp-facture-p', 5.2, [0, 2.6])}
            {/* 4. Mutuelle → Client : euros verts */}
            {tpMovingCoins('tp-prp', 'tp-coin-green-p', '#0e4a28', 4.4, [0, 2.2])}
          </svg>
        </div>

      </div>

      {/* Note LPT Santé */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', background: 'rgba(77,184,92,0.07)', border: '1px solid rgba(77,184,92,0.22)', borderRadius: 16, marginTop: 4 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-lpt-sante.png" alt="LPT Santé" width={48} height={48} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#4db85c', marginBottom: 4 }}>LPT Santé — logiciel de tiers payant</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
            Pour réaliser le tiers payant, nous utilisons <strong style={{ color: '#fff' }}>LPT Santé</strong>. Ce logiciel est disponible sur <strong style={{ color: '#fff' }}>tous les ordinateurs de vente</strong>.
          </div>
        </div>
      </div>

    </div>
  )
}

// ── TV : Page verre unifocal (Types de verres) ───────────────────
function TVTypesVerresUnifocal({ pageIndex, total }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 100)
    return () => clearTimeout(t)
  }, [])

  const COLOR = '#00abe9'

  const blocks = [
    {
      label: 'Ce que c\'est',
      text: 'Une correction identique sur toute la surface du verre. Pas de zone de flou, vision nette partout.',
    },
    {
      label: 'Pour qui',
      text: 'Clients non presbytes (un seul défaut à corriger, quelle que soit la distance). Également pour les clients presbytes qui souhaitent une paire dédiée à une seule distance — vision de loin ou vision de près.',
    },
    {
      label: 'Fabrication',
      text: '10 minutes en stock, de -8 à +7,25 avec un maximum de 3 de cylindre. Disponible dans tous les traitements en 10 min (sauf polarisé).',
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Le verre unifocal</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{
              height: 5, borderRadius: 3, transition: 'all .3s',
              width: i === pageIndex ? 22 : 5,
              background: i === pageIndex ? COLOR : 'rgba(255,255,255,0.2)',
            }} />
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.4fr',
        gap: 64, padding: '16px 72px 40px', alignItems: 'center',
      }}>
        {/* Verre unifocal */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: entered ? 1 : 0, transform: entered ? 'scale(1)' : 'scale(0.9)',
          transition: 'all .8s ease',
        }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -50, borderRadius: '50%',
              background: `radial-gradient(circle, ${COLOR}22 0%, transparent 68%)`,
              pointerEvents: 'none',
            }} />
            <Image
              src="/assets/verre-unifocal-2.png"
              alt="Verre unifocal"
              width={300}
              height={300}
              style={{ objectFit: 'contain', display: 'block', position: 'relative', zIndex: 1 }}
              priority
            />
          </div>
        </div>

        {/* Blocs info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <h1 style={{
            fontSize: 44, fontWeight: 800, color: '#fff', lineHeight: 1.1,
            opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(-16px)',
            transition: 'all .6s ease',
          }}>
            Le verre <span style={{ color: COLOR }}>unifocal</span>
          </h1>

          {blocks.map((b, i) => (
            <div key={i} style={{
              display: 'flex', gap: 18, alignItems: 'flex-start',
              opacity: entered ? 1 : 0,
              transform: entered ? 'translateX(0)' : 'translateX(32px)',
              transition: `all .55s ease ${0.1 + i * 0.12}s`,
            }}>
              <div style={{ width: 3, borderRadius: 2, background: COLOR, flexShrink: 0, alignSelf: 'stretch', minHeight: 40 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLOR, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>{b.label}</div>
                <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{b.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── TV : Page verre progressif (Types de verres) ─────────────────
const TV_TYPES_VERRES_ZONES = [
  { color: '#a78bfa', label: 'Vision de loin',       sub: 'Au loin — rue, voiture, horizon',    icon: 'loin'   },
  { color: '#4ade80', label: 'Vision intermédiaire', sub: "Écran d'ordinateur — 40 cm à 1,5 m",  icon: 'milieu' },
  { color: '#fbbf24', label: 'Vision de près',        sub: 'Téléphone, lecture — moins de 40 cm', icon: 'pres'  },
]

// Lens 1536x1024 px source, displayed at 650x433 (exact 1.5 ratio, fills perfectly)
// Oval: cx=325 cy=217 rx=218 ry=164  top=53 bot=381
const _PG_CY = 217, _PG_RY = 164, _PG_TOP = 53, _PG_BOT = 381
const _PG_GEO = [0.22, 0.52, 0.80].map(f => {
  const y  = Math.round(_PG_TOP + (_PG_BOT - _PG_TOP) * f)
  const dy = y - _PG_CY
  const s  = Math.sqrt(Math.max(0, 1 - (dy / _PG_RY) ** 2))
  return { y, rx: Math.round(325 + 218 * s), lx: Math.round(325 - 218 * s) }
})
// loin  : y=125 rx=506 lx=144
// milieu: y=224 rx=543 lx=107
// pres  : y=315 rx=500 lx=150

function ProgZoneIcon({ type, color, active }) {
  const c = active ? color : 'rgba(255,255,255,0.2)'
  if (type === 'loin') return (
    <svg width={46} height={46} viewBox="-23 -23 46 46">
      <line x1={-17} y1={9} x2={17} y2={9} stroke={c} strokeWidth={1.5} opacity={0.7} />
      <polyline points="-17,9 -6,-9 2,-1 9,-15 17,9" fill="none" stroke={c} strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={13} cy={-17} r={2.8} fill={c} opacity={0.9} />
    </svg>
  )
  if (type === 'milieu') return (
    <svg width={46} height={46} viewBox="-23 -23 46 46">
      <rect x={-18} y={-14} width={36} height={24} rx={3} fill="none" stroke={c} strokeWidth={1.8} />
      <line x1={-11} y1={-7} x2={9} y2={-7} stroke={c} strokeWidth={1} opacity={0.45} />
      <line x1={-11} y1={-1} x2={4} y2={-1} stroke={c} strokeWidth={1} opacity={0.3} />
      <path d="M0,10 L0,18 M-7,18 L7,18" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />
    </svg>
  )
  return (
    <svg width={46} height={46} viewBox="-12 -24 24 48">
      <rect x={-9} y={-21} width={18} height={42} rx={3.5} fill="none" stroke={c} strokeWidth={1.8} />
      <line x1={-3.5} y1={-18} x2={3.5} y2={-18} stroke={c} strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
      <circle cx={0} cy={14} r={2.5} fill="none" stroke={c} strokeWidth={1.5} opacity={0.7} />
    </svg>
  )
}

function TVTypesVerresProgressif({ pageIndex, total }) {
  const [entered,  setEntered]  = useState(false)
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const poll = async () => {
      try {
        const s = await getSharedState()
        setRevealed(Number(s?.typesVerresZone) || 0)
      } catch { /* best-effort */ }
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [])

  const LW = 520, LH = 347
  const GAP = 50

  const geo = _PG_GEO
  const zs  = TV_TYPES_VERRES_ZONES
  const CARD_X = LW + GAP

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 40px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>Verre progressif Pulsar Next</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Rodenstock · Allemagne</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{
              height: 5, borderRadius: 3, transition: 'all .3s',
              width: i === pageIndex ? 22 : 5,
              background: i === pageIndex ? '#7c3aed' : 'rgba(255,255,255,0.2)',
            }} />
          ))}
        </div>
      </div>

      {/* Phrase */}
      <div style={{ padding: '0 40px 6px', flexShrink: 0, opacity: entered ? 1 : 0, transition: 'opacity .6s ease .15s' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)',
          borderRadius: 10, padding: '7px 18px',
        }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            Pensé pour les presbytes — une seule paire pour voir à toutes les distances.
          </span>
        </div>
      </div>

      {/* Contenu principal : oeil · verre · scenarios */}
      <div style={{
        flex: '1 1 auto', minHeight: 0, display: 'flex', alignItems: 'center',
        padding: '4px 40px', gap: GAP,
        opacity: entered ? 1 : 0, transition: 'opacity .8s ease .2s',
      }}>

        {/* Verre progressif */}
        <div style={{ position: 'relative', width: LW, flexShrink: 0 }}>
          <Image src="/assets/verre-prog.png" alt="Verre progressif"
            width={LW} height={LH}
            style={{ objectFit: 'contain', display: 'block' }}
            priority
          />
          <svg style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none' }}
               width={LW} height={LH}>
            {/* Marqueurs zones (reveles par formateur) */}
            {zs.map((z, i) => (
              <g key={i} opacity={revealed > i ? 1 : 0} style={{ transition: 'opacity 0.5s ease' }}>
                <circle cx={geo[i].rx} cy={geo[i].y} r={12} fill={z.color} opacity={0.14} />
                <circle cx={geo[i].rx} cy={geo[i].y} r={5.5} fill={z.color} />
                <line x1={geo[i].rx + 12} y1={geo[i].y} x2={CARD_X - 14} y2={geo[i].y}
                  stroke={z.color} strokeWidth={1.5} strokeDasharray="5 4" opacity={0.6} />
              </g>
            ))}
          </svg>
        </div>

        {/* Cartes scenario, alignees sur les Y des zones */}
        <div style={{ flex: 1, position: 'relative', height: LH, alignSelf: 'center' }}>
          {zs.map((z, i) => {
            const isRevealed = revealed > i
            const active = i === revealed - 1
            return (
              <div key={i} style={{
                position: 'absolute', top: geo[i].y, left: 0, right: 0,
                transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', gap: 18,
                padding: '16px 20px', borderRadius: 16,
                background: active ? `${z.color}12` : 'rgba(255,255,255,0.02)',
                boxShadow: active ? `inset 3px 0 0 ${z.color}` : 'none',
                border: `1px solid ${active ? z.color + '38' : 'rgba(255,255,255,0.05)'}`,
                opacity: isRevealed ? 1 : (active ? 0.6 : 0.18),
                transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
              }}>
                <ProgZoneIcon type={z.icon} color={z.color} active={active} />
                <div>
                  <div style={{
                    fontSize: 24, fontWeight: 800, lineHeight: 1.15,
                    color: active ? '#fff' : 'rgba(255,255,255,0.38)',
                    transition: 'color 0.5s ease',
                  }}>{z.label}</div>
                  <div style={{
                    fontSize: 13, marginTop: 5, fontWeight: 500,
                    color: active ? z.color : 'rgba(255,255,255,0.18)',
                    transition: 'color 0.5s ease',
                  }}>{z.sub}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Délais de fabrication */}
      <div style={{ padding: '4px 40px 18px', flexShrink: 0, opacity: entered ? 1 : 0, transition: 'opacity .8s ease .3s' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Délais de fabrication</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 14, padding: '10px 20px' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#4ade80', marginBottom: 2 }}>24 / 48h</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.35 }}>Verres origine France — Fabriqués à Paris</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '10px 20px' }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#fbbf24', marginBottom: 2 }}>9 jours</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.35 }}>Verres Rodenstock — Fabriqués en Allemagne</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TVContentPage({ page, pageIndex, total, moduleLabel, troublesPhase, opticienPlaying, troublesSelected, troublesRevealed, audioUnlocked, ordoPlaying, ordoRevealStep, ordoHeadlightDemo, ordoHeadlightCyl, ordoHeadlightAxe, saisieStage, freinsResponses, revealFreins, prixResponses, ventesResponses, promesseResponses, revealPromesse, progZoneQ, progZoneResponses, progZoneShowCorrect, progRetourResponses, progRetourRevealed, progObjectionIdx, progObjectionResponses, progObjectionRevealed, progBestAnswer, progAnatomieReveal, trameStep, offres11Step, offresClassiqueStep, offresPackPlanStep, offresProg11Revealed, modelePoint, revealPrix, revealVentes, revealLabo, mutuellesRevealed, inamiRevealed, partenaRevealed, rembfrRevealed, rembfrDemarcheA, rembfrDemarcheB, rembfrSupreme, parcoursRevealed, tiersPayantRevealed, tiersPayantAnswersRevealed, lptsPecScenario, brainstormRevealed, monturesPrixRevealed, monturesMateriauxResponses, revealMonturesMateriaux, sessionCode, onAmeliProClick }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  if (page.type === 'mutuelles-reveal')   return <TVMutuellesReveal mutuellesRevealed={mutuellesRevealed} />
  if (page.type === 'inami-info')         return <TVInamiInfo inamiRevealed={inamiRevealed} />
  if (page.type === 'partena-offre')      return <TVPartenaOffre partenaRevealed={partenaRevealed} />
  if (page.type === 'rembfr-conditions')  return <TVRembFrConditions rembfrRevealed={rembfrRevealed} />
  if (page.type === 'rembfr-demarche')    return <TVRembFrDemarche stepA={rembfrDemarcheA} stepB={rembfrDemarcheB} onAmeliProClick={onAmeliProClick} />
  if (page.type === 'rembfr-supreme')     return <TVRembFrSupreme supremeStep={rembfrSupreme} />
  if (page.type === 'parcours-rembourses-offres') return <TVParcoursOffres parcoursRevealed={parcoursRevealed} />
  if (page.type === 'parcours-tiers-payant')      return <TVTiersPayant tiersPayantRevealed={tiersPayantRevealed} answersRevealed={tiersPayantAnswersRevealed} sessionCode={sessionCode} pageId={page.id} />
  if (page.type === 'tiers-payant-explication')   return <TVTiersPayantExplication />
  if (page.type === 'lpt-sante-intro')        return <TVLptSanteIntro        page={page} sessionCode={sessionCode} />
  if (page.type === 'lpt-sante-explication') return <TVLptSanteExplication />
  if (page.type === 'lpt-sante-pec')         return <TVLptSantePec scenario={lptsPecScenario} />
  if (page.type === 'montage-question')  return <TVMontageQuestion page={page} sessionCode={sessionCode} />
  if (page.type === 'montage-info')      return <TVMontageInfo page={page} />
  if (page.type === 'montage-upgrade')   return <TVMontageUpgrade sessionCode={sessionCode} />
  if (page.type === 'outlet-flow')       return <TVOutletFlow variant={page.variant} titre={page.titre} />
  if (page.type === 'pause')             return <TVPause              page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} sessionCode={sessionCode} />
  if (page.type === 'troubles-intro')    return <TVTroublesIntro      page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'troubles-list')     return <TVTroublesListVideo  page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} troublesSelected={troublesSelected} troublesRevealed={troublesRevealed} audioUnlocked={audioUnlocked} />
  if (page.type === 'trame-accueil')    return <TVTrameAccueil step={trameStep} />
  if (page.type === 'montures-acetate') return <TVMontures type="montures-acetate" pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} priceRevealed={monturesPrixRevealed} />
  if (page.type === 'montures-metal')   return <TVMontures type="montures-metal"   pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} priceRevealed={monturesPrixRevealed} />
  if (page.type === 'montures-injecte') return <TVMontures type="montures-injecte" pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} priceRevealed={monturesPrixRevealed} />
  if (page.type === 'sav-brainstorm') return <TVSAVBrainstorm page={page} sessionCode={sessionCode} brainstormRevealed={brainstormRevealed} />
  if (page.type === 'sav-content') return <TVSAVContent page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'pdm-pourquoi')     return <TVPdmPourquoi pageIndex={pageIndex} total={total} />
  if (page.type === 'offres-classique')   return <TVOffresClassique step={offresClassiqueStep} />
  if (page.type === 'offres-1-1')         return <TVOffres11 step={offres11Step} />
  if (page.type === 'offres-unifocal-11')   return <TVOffresUnifocal11 />
  if (page.type === 'offres-progressif-11') return <TVOffresProgressif11 revealed={offresProg11Revealed} />
  if (page.type === 'offres-pack-plan')   return <TVOffresPackPlan step={offresPackPlanStep} />
  if (page.type === 'correction-scale') return <TVCorrectionScale    page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  if (page.type === 'ordonnance')        return <TVOrdonnance         page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} ordoPlaying={ordoPlaying} ordoRevealStep={ordoRevealStep} audioUnlocked={audioUnlocked} ordoHeadlightDemo={ordoHeadlightDemo} ordoHeadlightCyl={ordoHeadlightCyl} ordoHeadlightAxe={ordoHeadlightAxe} />
  if (page.type === 'saisie-interactive') return <TVSaisieInteractive page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} saisieStage={saisieStage} sessionCode={sessionCode} />
  if (page.type === 'entrainement-oral')  return <TVEntrainementOral  page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />

  // Entreprise module types — tous dispatchés pour éviter le VerreAnime
  if (page.type === 'labo-progressif') return <TVLaboProgressif page={page} pageIndex={pageIndex} total={total} revealLabo={revealLabo} />
  if (page.type === 'quiz-transition') return (
    <div style={{ height: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #1a0a3d 60%, #0d0a2e 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ fontSize: 80, marginBottom: 40, position: 'relative', zIndex: 1 }}>🧠</div>
      <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, maxWidth: 800, marginBottom: 20, position: 'relative', zIndex: 1 }}>
        Des questions avant<br />de passer au quiz ?
      </h1>
      <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        Le formateur peut répondre à vos dernières questions.
      </p>
    </div>
  )
  if (page.type === 'freins')     return <TVEntrepriseFreins   page={page} pageIndex={pageIndex} total={total} freinsResponses={freinsResponses} revealFreins={revealFreins} sessionCode={sessionCode} />
  if (page.type === 'montures-materiaux') return <TVEntrepriseFreins page={page} pageIndex={pageIndex} total={total} freinsResponses={monturesMateriauxResponses} revealFreins={revealMonturesMateriaux} sessionCode={sessionCode} />
  if (page.type === 'prix')       return <TVEntreprisePrix     page={page} pageIndex={pageIndex} total={total} prixResponses={prixResponses} revealPrix={revealPrix} sessionCode={sessionCode} />
  if (page.type === 'video-lpt')  return <TVVideoLPT audioUnlocked={audioUnlocked} />
  if (page.type === 'ventes-opticien') return <TVEntrepriseVentesOpticien page={page} pageIndex={pageIndex} total={total} ventesResponses={ventesResponses} revealVentes={revealVentes} sessionCode={sessionCode} />
  if (page.type === 'promesse')        return <TVEntreprisePromesse       page={page} pageIndex={pageIndex} total={total} promesseResponses={promesseResponses} revealPromesse={revealPromesse} sessionCode={sessionCode} />
  if (page.type === 'chiffres')           return <TVEntrepriseChiffres   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'force-lpt') return <TVEntrepriseForceLPT  page={page} pageIndex={pageIndex} total={total} modelePoint={modelePoint} audioUnlocked={audioUnlocked} />
  if (page.type === 'naissance')  return <TVEntrepriseNaissance page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'impact')     return <TVEntreprisePoints   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'probleme')   return <TVEntreprisePoints   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'machines')   return <TVEntreprisePoints   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'timeline')   return <TVEntrepriseTimeline  page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'piliers')    return <TVEntreprisePiliers   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'steps')      return <TVEntrepriseSteps     page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'cases')      return <TVEntrepriseCases     page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'visages')    return <TVEntrepriseVisages   page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'croissance') return <TVEntrepriseCroissance page={page} pageIndex={pageIndex} total={total} />
  if (page.type === 'mission')    return <TVEntrepriseMission   page={page} pageIndex={pageIndex} total={total} />

  // Progressif module types
  if (page.type === 'progressif-anatomie') return <TVProgressifAnatomie      page={page} pageIndex={pageIndex} total={total} progAnatomieReveal={progAnatomieReveal} />
  if (page.type === 'zone-interactif')     return <TVProgressifZoneInteractif page={page} pageIndex={pageIndex} total={total} progZoneQ={progZoneQ} progZoneResponses={progZoneResponses} progZoneShowCorrect={progZoneShowCorrect} />
  if (page.type === 'prog-retour')         return <TVProgressifRetourTerrain  page={page} pageIndex={pageIndex} total={total} progRetourResponses={progRetourResponses} progRetourRevealed={progRetourRevealed} sessionCode={sessionCode} />
  if (page.type === 'prog-objections')     return <TVProgressifJeuObjections  page={page} pageIndex={pageIndex} total={total} progObjectionIdx={progObjectionIdx} progObjectionResponses={progObjectionResponses} progObjectionRevealed={progObjectionRevealed} progBestAnswer={progBestAnswer} sessionCode={sessionCode} />

  // Types de verres
  if (page.type === 'unifocal')  return <TVTypesVerresUnifocal  pageIndex={pageIndex} total={total} />
  if (page.type === 'progressif') return <TVTypesVerresProgressif pageIndex={pageIndex} total={total} />

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Particules déco */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(10)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute', width: 3, height: 3, borderRadius: '50%',
            background: page.color, opacity: 0.25 + (i % 3) * 0.1,
            left: `${5 + i * 9}%`, top: `${20 + (i % 4) * 20}%`,
            animation: `particleFloat ${3 + i * 0.5}s ease-in-out ${i * 0.25}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', position: 'relative', zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? page.color : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 40, padding: '16px 48px 24px', alignItems: 'center', position: 'relative', zIndex: 5,
      }}>
        {/* Texte gauche */}
        <div style={{
          opacity: entered ? 1 : 0, transform: entered ? 'translateX(0)' : 'translateX(-28px)',
          transition: 'all .55s ease',
        }}>
          <div style={{
            display: 'inline-block', background: `${page.color}20`,
            border: `1px solid ${page.color}45`, borderRadius: 20,
            padding: '4px 14px', fontSize: 11, fontWeight: 700,
            color: page.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14,
          }}>Formation LPT</div>

          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28, fontWeight: 400 }}>
            {page.sousTitre}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(page.points || []).map((pt, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateX(0)' : 'translateX(-16px)',
                transition: `all .45s ease ${0.08 + i * 0.09}s`,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: `${page.color}18`, border: `1px solid ${page.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                }}>{pt.emoji}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.texte}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Illustration droite */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: entered ? 1 : 0, transform: entered ? 'scale(1)' : 'scale(0.88)',
          transition: 'all .65s ease .1s',
        }}>
          {page.image ? (
            <TVImageVisual src={page.image} color={page.color} />
          ) : page.icon ? (
            <TVEmojiVisual emoji={page.icon} color={page.color} />
          ) : (
            <VerreAnime color={page.color} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── TV Module Lobby ───────────────────────────────────────────────
function TVModuleLobby({ moduleLabel, moduleSub }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 700, padding: '0 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={220} height={84}
            style={{ objectFit: 'contain', animation: 'logoBreathe 3.5s ease-in-out infinite' }} />
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', lineHeight: 1.15 }}>
          {moduleLabel}
        </h1>
      </div>
    </div>
  )
}

// ── Écran planning (diffusion TV) ─────────────────────────────────
function TVPlanningScreen({ planningDay }) {
  const jour = PLANNING_JOURS.find(j => j.id === planningDay)
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    setVisible(0)
    if (!jour) return
    const timers = jour.blocs.map((_, i) =>
      setTimeout(() => setVisible(v => Math.max(v, i + 1)), 400 + i * 500)
    )
    return () => timers.forEach(clearTimeout)
  }, [planningDay])

  if (!jour) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={120} height={46} style={{ objectFit: 'contain', marginBottom: 24 }} />
        <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>Sélectionnez un jour depuis le tableau de bord</div>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', padding: '36px 60px 48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>Planning Onboarding</span>
        </div>
        <div style={{ background: `${jour.color}20`, border: `1px solid ${jour.color}50`, borderRadius: 20, padding: '6px 20px', fontSize: 12, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1 }}>
          {jour.jour}
        </div>
      </div>

      {/* Titre */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ fontSize: 46, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 6 }}>{jour.label}</div>
        <div style={{ width: 60, height: 4, borderRadius: 2, background: jour.color }} />
      </div>

      {/* Blocs */}
      <div style={{ display: 'flex', gap: 20, flex: 1, alignItems: 'stretch' }}>
        {jour.blocs.map((bloc, i) => {
          const isPause = bloc.titre === 'Pause déjeuner'

          if (isPause) return (
            <div key={i} style={{
              flex: '0 0 88px',
              background: 'rgba(245,158,11,0.07)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderTop: '3px solid #f59e0b',
              borderRadius: 16,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 10,
              opacity: i < visible ? 1 : 0,
              transform: i < visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              <div style={{ width: 28, height: 2, borderRadius: 1, background: 'rgba(245,158,11,0.4)' }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, textAlign: 'center', lineHeight: 1.4 }}>
                Pause<br />déjeuner
              </div>
              {bloc.horaire && <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.55)', textAlign: 'center' }}>{bloc.horaire}</div>}
              <div style={{ width: 28, height: 2, borderRadius: 1, background: 'rgba(245,158,11,0.4)' }} />
            </div>
          )

          return (
            <div key={i} style={{
              flex: 1,
              background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`,
              borderTop: `3px solid ${jour.color}`,
              borderRadius: 16, padding: '22px 20px',
              opacity: i < visible ? 1 : 0,
              transform: i < visible ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
              {bloc.horaire && (
                <div style={{ fontSize: 11, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{bloc.horaire}</div>
              )}
              <div style={{ fontSize: 19, fontWeight: 800, color: '#fff', marginBottom: 14, lineHeight: 1.2 }}>{bloc.titre}</div>
              {bloc.items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {bloc.items.map((item, j) => (
                    <div key={j} style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderLeft: `3px solid ${jour.color}60`,
                      borderRadius: 10, padding: '9px 14px',
                      fontSize: 14, color: 'rgba(255,255,255,0.8)',
                      fontWeight: 500, lineHeight: 1.4,
                    }}>{item}</div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── TV FAQ Réveil des acquis ──────────────────────────────────────
const FAQ_JOURNEE_META = {
  j1: { label: 'Journée 1', sousTitre: 'Les fondamentaux de l\'optique', color: '#f59e0b', icon: '🌅' },
  j2: { label: 'Journée 2', sousTitre: 'Les offres et la vente',         color: '#10b981', icon: '🤝' },
  j3: { label: 'Journée 3', sousTitre: 'La prise de mesures',            color: '#8b5cf6', icon: '📐' },
}

// Thèmes cumulatifs par journée (j2 = j1+j2, j3 = j1+j2+j3)
const FAQ_THEMES = {
  j1: [
    { icon: '🏢', label: "Présentation de l'entreprise", items: ["Histoire & vision LPT", "L'accessibilité des lunettes", "Visite magasin & produits"] },
    { icon: '👁️', label: "Les bases de l'optique",       items: ["Pourquoi porte-on des lunettes", "Les troubles visuels", "Lecture d'une ordonnance"] },
    { icon: '🔬', label: "Les types de verres",           items: ["Le verre unifocal", "Unifocal vs progressif"] },
  ],
  j2: [
    { icon: '🏢', label: "Présentation de l'entreprise", items: ["Histoire & vision LPT", "L'accessibilité des lunettes"] },
    { icon: '👁️', label: "Les bases de l'optique",       items: ["Troubles visuels", "Corrections", "Ordonnances"] },
    { icon: '🔬', label: "Les types de verres",           items: ["Verre unifocal", "Verre progressif"] },
    { icon: '🤝', label: "Trame d'accueil",               items: ["Présentation du concept aux clients"] },
    { icon: '🏷️', label: "Les offres LPT",               items: ["Parcours classique", "Parcours 1+1", "Immersion magasin"] },
  ],
  j3: [
    { icon: '🏢', label: "Présentation de l'entreprise", items: [] },
    { icon: '👁️', label: "Les bases de l'optique",       items: ["Troubles visuels", "Ordonnances"] },
    { icon: '🏷️', label: "Les offres LPT",               items: ["Parcours classique", "1+1", "Suprême", "Tiers payant"] },
    { icon: '🤝', label: "Trame d'accueil",               items: ["Accueil client", "Simulation vente"] },
    { icon: '📐', label: "Prise de mesures",              items: ["Écart pupillaire", "Hauteur", "LPTVISION", "Téléphone"] },
  ],
}

function TVFAQView({ journeeId, questions }) {
  const meta   = FAQ_JOURNEE_META[journeeId] || FAQ_JOURNEE_META.j1
  const themes = FAQ_THEMES[journeeId] || FAQ_THEMES.j1
  const accent = meta.color

  return (
    <div style={{
      height: '100vh', overflow: 'hidden',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 36px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Réveil des acquis</span>
        </div>
        <div style={{
          background: `${accent}18`, border: `1px solid ${accent}40`,
          borderRadius: 20, padding: '6px 16px',
          fontSize: 12, fontWeight: 700, color: accent, letterSpacing: 0.5,
        }}>{meta.icon} {meta.label}</div>
      </div>

      {/* Corps : colonne thèmes | colonne questions */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden' }}>

        {/* ── Colonne gauche : thèmes abordés ── */}
        <div style={{
          width: 340, flexShrink: 0,
          display: 'flex', flexDirection: 'column',
          background: 'rgba(0,0,0,0.25)',
          borderRight: `2px solid ${accent}40`,
          overflowY: 'auto',
          padding: '16px 0 16px',
        }}>
          {/* Header thèmes */}
          <div style={{
            padding: '0 20px 14px 24px',
            borderBottom: `1px solid ${accent}30`,
            marginBottom: 14,
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 2 }}>
              Thèmes abordés
            </div>
          </div>

          {/* Cards thèmes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px 0 20px' }}>
            {themes.map((theme, i) => (
              <div key={i} style={{
                background: `${accent}14`,
                border: `1px solid ${accent}35`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: 10,
                padding: '11px 14px',
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: theme.items.length ? 7 : 0 }}>
                  {theme.icon} {theme.label}
                </div>
                {theme.items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {theme.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', paddingLeft: 6, lineHeight: 1.5 }}>
                        · {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Aide participation */}
          <div style={{ margin: '18px 16px 0 20px', padding: '12px 14px', background: `${accent}18`, border: `1px solid ${accent}40`, borderRadius: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 4 }}>💬 Comment participer ?</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>
              Posez vos questions sur votre téléphone de manière anonyme
            </div>
          </div>
        </div>

        {/* ── Colonne droite : titre + bulles questions ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 16 }}>
          {/* Titre */}
          <div style={{ textAlign: 'center', padding: '14px 40px 14px', flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
              FAQ anonyme · {meta.label}
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 2 }}>
              Questions des participants
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{meta.sousTitre}</p>
          </div>

          {/* Zone bulles */}
          <div style={{
            flex: 1,
            display: 'flex', flexWrap: 'wrap',
            columnGap: 16, rowGap: 24,
            justifyContent: 'center', alignItems: 'flex-start', alignContent: 'flex-start',
            padding: '8px 40px 16px',
            overflow: 'hidden',
          }}>
            {questions.length === 0 ? (
              <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', marginTop: 40 }}>
                En attente des questions…
              </div>
            ) : questions.map((q, i) => (
              <div key={q.id} style={{
                background: q.highlighted
                  ? `linear-gradient(135deg, ${accent}22, ${accent}0d)`
                  : 'rgba(5,20,55,0.88)',
                border: q.highlighted
                  ? `2px solid ${accent}`
                  : `1.5px solid ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}`,
                borderRadius: B_RAD[i % 12],
                padding: q.highlighted ? '18px 28px' : '12px 20px',
                maxWidth: q.highlighted ? 420 : 280,
                fontSize: q.highlighted ? 20 : 15,
                fontWeight: q.highlighted ? 700 : 600,
                color: '#fff', lineHeight: 1.45,
                backdropFilter: 'blur(16px)',
                boxShadow: q.highlighted
                  ? `0 0 50px ${accent}50, 0 0 100px ${accent}20, 0 8px 32px rgba(0,0,0,0.5)`
                  : `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${TV_BUBBLE_COLORS[i % TV_BUBBLE_COLORS.length]}30`,
                animation: 'bubbleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                animationDelay: `${i * 0.07}s`,
                marginTop: q.highlighted ? 0 : B_MT[i % 12],
                transform: q.highlighted
                  ? 'scale(1.06) rotate(0deg)'
                  : `scale(1) rotate(${B_ROT[i % 12]}deg)`,
                transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                zIndex: q.highlighted ? 10 : 1,
                position: 'relative',
              }}>
                {q.highlighted && (
                  <div style={{ fontSize: 10, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                    ★ En cours de traitement
                  </div>
                )}
                {q.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function TVQrOverlay({ roomCode }) {
  const [qrUrl, setQrUrl] = useState('')
  useEffect(() => {
    const code = (roomCode || getTvDisplayRoomCode() || getLegacySessionCode()).trim()
    setQrUrl(buildQrImageUrl(code))
  }, [roomCode])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 100%)',
        border: '2px solid rgba(0,171,233,0.4)',
        borderRadius: 32, padding: '48px 56px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 80px rgba(0,171,233,0.1)',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 3 }}>
          Rejoindre la formation
        </div>
        <div style={{
          background: '#03112a', borderRadius: 20, padding: 16,
          border: '2px solid rgba(0,171,233,0.4)',
          boxShadow: '0 0 60px rgba(0,171,233,0.2)',
        }}>
          {qrUrl
            /* eslint-disable-next-line @next/next/no-img-element */
            ? <img src={qrUrl} alt="QR Code" width={260} height={260} style={{ display: 'block', borderRadius: 10 }} />
            : <div style={{ width: 260, height: 260, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }} />
          }
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Scannez pour rejoindre
          </div>
          {roomCode && (
            <div style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: 4, color: 'rgba(0,171,233,0.85)', fontWeight: 700 }}>
              {roomCode}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const KFORMATION_IDENTIFIANT = 'kformation'

/**
 * Mot de passe K'Formation de la semaine, affiché/masqué sur le diffuseur
 * depuis l'écran formateur (même mécanique que TVQrOverlay). Relit la valeur
 * en direct pendant que l'overlay est affiché : si le formateur modifie le
 * mot de passe pendant qu'il est affiché, le diffuseur se met à jour tout seul.
 */
function TVKPasswordOverlay() {
  const [password, setPassword] = useState('')
  useEffect(() => {
    let cancelled = false
    const load = () => {
      getWeeklySharedState().then(s => {
        if (!cancelled) setPassword(s?.kformation_password || '')
      }).catch(() => {})
    }
    load()
    const interval = setInterval(load, 5000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      pointerEvents: 'none',
    }}>
      <div style={{ position: 'relative', width: 340, height: 692, flexShrink: 0 }}>
        {/* Coque iPhone */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(145deg, #3a3a3c, #1c1c1e)',
          borderRadius: 60, border: '1px solid #555',
          boxShadow: '0 30px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)',
        }} />
        <div style={{ position: 'absolute', left: -4, top: 130, width: 4, height: 42, background: '#3a3a3c', borderRadius: '4px 0 0 4px' }} />
        <div style={{ position: 'absolute', left: -4, top: 189, width: 4, height: 68, background: '#3a3a3c', borderRadius: '4px 0 0 4px' }} />
        <div style={{ position: 'absolute', left: -4, top: 273, width: 4, height: 68, background: '#3a3a3c', borderRadius: '4px 0 0 4px' }} />
        <div style={{ position: 'absolute', right: -4, top: 202, width: 4, height: 91, background: '#3a3a3c', borderRadius: '0 4px 4px 0' }} />
        {/* Écran — reproduit l'écran de connexion réel de l'appli Lunettes Pour Tous */}
        <div style={{
          position: 'absolute', inset: 10,
          background: '#efece7', borderRadius: 50,
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.035) 0 1px, transparent 1px 22px), ' +
            'repeating-linear-gradient(90deg, rgba(0,0,0,0.02) 0 1px, transparent 1px 44px)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Dynamic Island */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 16, paddingBottom: 5, flexShrink: 0 }}>
            <div style={{ width: 114, height: 36, background: '#000', border: '2px solid #1a1a1a', borderRadius: 26, boxShadow: '0 0 0 1px #333' }} />
          </div>
          {/* Status bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px 8px', flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>09:04</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="18" height="13" viewBox="0 0 14 10"><rect x="0" y="3" width="3" height="7" fill="#111" rx="1"/><rect x="4" y="2" width="3" height="8" fill="#111" rx="1"/><rect x="8" y="0" width="3" height="10" fill="#111" rx="1"/><rect x="12" y="0" width="2" height="10" fill="rgba(0,0,0,0.3)" rx="1"/></svg>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>5G</span>
              <div style={{ width: 28, height: 14, border: '1.5px solid rgba(0,0,0,0.5)', borderRadius: 4, position: 'relative', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                <div style={{ width: '75%', height: 8, background: '#16a34a', borderRadius: 1 }} />
                <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 4, height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: '0 1px 1px 0' }} />
              </div>
            </div>
          </div>
          {/* Contenu — écran de connexion K'Formation */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 13, padding: '0 28px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={68} height={68} style={{ objectFit: 'contain', marginBottom: 5 }} />
            <div style={{ fontSize: 17, fontWeight: 800, color: '#111', letterSpacing: 2 }}>LUNETTES POUR TOUS</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111', marginTop: 8 }}>Bienvenue !</div>
            <div style={{ fontSize: 13.5, color: '#8a8a8a', textAlign: 'center', lineHeight: 1.5, marginBottom: 8 }}>
              Connectez-vous pour accéder à l&apos;application de vente Lunettes Pour Tous
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 13 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, paddingLeft: 2 }}>Identifiant</div>
                <div style={{
                  padding: '16px 18px', background: '#fff', borderRadius: 14,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  fontSize: 24, color: '#222', fontWeight: 700,
                }}>
                  {KFORMATION_IDENTIFIANT}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8a8a8a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5, paddingLeft: 2 }}>Mot de passe</div>
                <div style={{
                  padding: '16px 18px', background: '#fff', borderRadius: 14,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 34, color: '#111', fontWeight: 800, letterSpacing: 3, fontVariantNumeric: 'tabular-nums' }}>
                    {password || '------'}
                  </span>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </div>
              </div>
            </div>
            <button style={{
              width: '100%', marginTop: 8, padding: '17px 0', borderRadius: 14,
              background: '#3ba7d6', border: 'none',
              fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: 0.6,
            }}>
              SE CONNECTER
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function WelcomeScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 60%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Halo décoratif derrière le logo */}
      <div style={{
        position: 'absolute',
        width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,171,233,0.12) 0%, transparent 70%)',
        animation: 'haloPulse 4s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Image
        src="/assets/logo-lpt-blanc.png"
        alt="Lunettes Pour Tous"
        width={400}
        height={152}
        style={{
          objectFit: 'contain',
          animation: 'logoBreathe 3.5s ease-in-out infinite',
          position: 'relative', zIndex: 1,
        }}
        priority
      />

      {/* Séparateur */}
      <div style={{
        width: 48, height: 2,
        background: 'linear-gradient(90deg, transparent, rgba(0,171,233,0.6), transparent)',
        margin: '40px 0 36px',
        borderRadius: 2,
      }} />

      {/* Texte */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          fontSize: 22, fontWeight: 500,
          color: 'rgba(255,255,255,0.45)',
          letterSpacing: 8, textTransform: 'uppercase',
        }}>Bienvenue chez</div>
        <div style={{
          fontSize: 72, fontWeight: 800,
          color: '#ffffff',
          letterSpacing: 2, textAlign: 'center',
          lineHeight: 1.05,
        }}>Lunettes Pour Tous</div>
      </div>
    </div>
  )
}

function WaitingScreen({ roomCode }) {
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => {
    const code = (roomCode || getTvDisplayRoomCode() || getLegacySessionCode()).trim()
    setQrUrl(buildQrImageUrl(code))
  }, [roomCode])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={300} height={114}
        style={{ objectFit: 'contain', marginBottom: 52, animation: 'logoBreathe 3.5s ease-in-out infinite' }} />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 56,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28, padding: '36px 48px',
      }}>
        <div style={{
          background: '#0a2a5c', borderRadius: 18, padding: 12,
          border: '2px solid rgba(0,171,233,0.35)',
          boxShadow: '0 0 40px rgba(0,171,233,0.15)',
        }}>
          {qrUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrUrl} alt="QR Code" width={220} height={220}
              style={{ display: 'block', borderRadius: 8 }} />
          ) : (
            <div style={{ width: 220, height: 220, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }} />
          )}
        </div>

        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#00abe9',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14,
          }}>Rejoindre la formation</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
            Scannez ce QR code<br />avec votre téléphone
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
            Connectez-vous avec votre nom et prénom<br />comme sur la liste RH.
            {roomCode && (
              <>
                <br />
                <span style={{ fontFamily: 'monospace', letterSpacing: 3, color: 'rgba(0,171,233,0.85)' }}>{roomCode}</span>
              </>
            )}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.25)',
            borderRadius: 20, padding: '8px 18px',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', background: '#00abe9',
              animation: 'waitingPulse 1.4s ease-in-out infinite',
            }} />
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
              En attente du formateur…
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── LPT Trophy SVG ───────────────────────────────────────────────
function LPTTrophy({ size = 160 }) {
  const lR = size * 0.215
  const lY = size * 0.30
  const lX = size * 0.30
  const rX = size * 0.70
  const cx = size * 0.50
  const sW = size * 0.08
  const sH = size * 0.20
  const sX = cx - sW / 2
  const sY = lY + lR + size * 0.04
  const bW = size * 0.58
  const bH = size * 0.08
  const bX = cx - bW / 2
  const bY = sY + sH
  return (
    <svg viewBox={`0 0 ${size} ${size * 1.15}`} width={size} height={size * 1.15} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tgBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8"/>
          <stop offset="100%" stopColor="#00abe9"/>
        </linearGradient>
        <linearGradient id="tgGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a"/>
          <stop offset="100%" stopColor="#f59e0b"/>
        </linearGradient>
        <filter id="tgl">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Handles */}
      <path d={`M ${lX - lR * 0.7} ${lY - lR * 0.5} Q ${size * 0.03} ${lY} ${sX} ${sY + sH * 0.1}`}
        fill="none" stroke="url(#tgBlue)" strokeWidth={size * 0.03} strokeLinecap="round" filter="url(#tgl)"/>
      <path d={`M ${rX + lR * 0.7} ${lY - lR * 0.5} Q ${size * 0.97} ${lY} ${sX + sW} ${sY + sH * 0.1}`}
        fill="none" stroke="url(#tgBlue)" strokeWidth={size * 0.03} strokeLinecap="round" filter="url(#tgl)"/>
      {/* Lenses */}
      <circle cx={lX} cy={lY} r={lR} fill="rgba(0,171,233,0.07)"
        stroke="url(#tgBlue)" strokeWidth={size * 0.05} filter="url(#tgl)"/>
      <circle cx={rX} cy={lY} r={lR} fill="rgba(0,171,233,0.07)"
        stroke="url(#tgBlue)" strokeWidth={size * 0.05} filter="url(#tgl)"/>
      {/* Bridge */}
      <line x1={lX + lR} y1={lY} x2={rX - lR} y2={lY}
        stroke="url(#tgBlue)" strokeWidth={size * 0.03} strokeLinecap="round" filter="url(#tgl)"/>
      {/* Stem */}
      <rect x={sX} y={sY} width={sW} height={sH} fill="url(#tgBlue)" rx={3}/>
      {/* Base */}
      <rect x={bX} y={bY} width={bW} height={bH} fill="url(#tgGold)" rx={5}/>
      <rect x={bX + bW * 0.05} y={bY + bH * 0.15} width={bW * 0.9} height={bH * 0.28}
        fill="rgba(255,255,255,0.22)" rx={2}/>
    </svg>
  )
}

/**
 * Un upsert manqué côté écriture pouvait laisser plusieurs lignes
 * quiz_answers pour le même formé + question (voir formationSave.js). On
 * dédoublonne ici par sécurité pour l'affichage (garde la ligne la plus
 * récente par collaborateur, via id auto-incrémenté) : sans ça, le total de
 * réponses dépassait le nombre réel de formés à l'écran de correction.
 */
function dedupeLatestByCollaborateur(rows) {
  const byName = {}
  for (const r of rows || []) {
    const key = r.collaborateur
    if (!key) continue
    if (!byName[key] || (r.id ?? 0) > (byName[key].id ?? 0)) byName[key] = r
  }
  return Object.values(byName)
}

/** Même dédoublonnage, mais sur un lot mêlant plusieurs questions (une clé collaborateur+question). */
function dedupeLatestByCollaborateurAndQuestion(rows) {
  const byKey = {}
  for (const r of rows || []) {
    if (!r.collaborateur) continue
    const key = `${r.collaborateur}__${r.question_idx}`
    if (!byKey[key] || (r.id ?? 0) > (byKey[key].id ?? 0)) byKey[key] = r
  }
  return Object.values(byKey)
}

// ── TV Quiz Correction (débrief après chaque question) ───────────
function TVQuizCorrection({ question, qIdx, total, moduleLabel, sessionCode, moduleId, showOrdo }) {
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    const filter = `session_code=eq.${sessionCode || SESSION_CODE}&question_idx=eq.${qIdx}${moduleId ? `&module_id=eq.${moduleId}` : ''}`
    const load = () => sbSelect('quiz_answers', filter)
      .then(rows => setAnswers(dedupeLatestByCollaborateur(rows || [])))
      .catch(() => {})
    load()
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [qIdx, sessionCode, moduleId])

  if (!question) return null
  const total_answers = answers.length
  const correct_count = answers.filter(r => r.is_correct).length
  const wrong_count   = total_answers - correct_count
  const counts = question.options ? question.options.map((_, i) => answers.filter(r => r.answer_idx === i).length) : []
  const showOrdonnance = question.ordonnance && (showOrdo || question.type === 'ordonnance-fill' || question.type === 'qcm-ordonnance')

  const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '32px 60px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={36} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{moduleLabel}</span>
        </div>
        <div style={{
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: 20, padding: '6px 22px',
          fontSize: 13, fontWeight: 700, color: '#4ade80', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>✓ Correction — Question {qIdx + 1} / {total}</div>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 28 }}>
        <div style={{
          background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)',
          borderRadius: 18, padding: '14px 36px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#4ade80' }}>{correct_count}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>bonne{correct_count > 1 ? 's' : ''} réponse{correct_count > 1 ? 's' : ''}</div>
        </div>
        <div style={{
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: 18, padding: '14px 36px', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#f87171' }}>{wrong_count}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>mauvaise{wrong_count > 1 ? 's' : ''} réponse{wrong_count > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Question */}
      <div style={{
        fontSize: 22, fontWeight: 800, color: '#fff', textAlign: 'center',
        marginBottom: 16, lineHeight: 1.35, maxWidth: 860, alignSelf: 'center',
      }}>{question.question}</div>

      {/* Ordonnance — ré-affichée si le formateur le demande (ou déjà visible pour une saisie d'ordonnance) */}
      {showOrdonnance && (
        <TVOrdonnanceDisplay ordonnance={question.ordonnance} hideLabels={question.hideOrdoLabels || question.hideLabels} cylInParens={question.cylInParens} hideNonAddHeaders={question.hideNonAddHeaders} topLabel={question.ordoLabel} />
      )}

      {/* Options */}
      {question.options && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800, alignSelf: 'center', width: '100%' }}>
          {question.options.map((opt, i) => {
            const isCorrect = Array.isArray(question.correct) ? question.correct.includes(i) : i === question.correct
            const count = counts[i]
            const pct = total_answers > 0 ? (count / total_answers) * 100 : 0
            return (
              <div key={i} style={{
                background: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isCorrect ? '#4ade80' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16, padding: '12px 18px',
                boxShadow: isCorrect ? '0 0 24px rgba(74,222,128,0.2)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: isCorrect ? '#4ade80' : OPTION_COLORS[i],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 800, color: isCorrect ? '#052e16' : '#fff',
                    }}>{'ABCD'[i]}</div>
                    <span style={{ fontSize: 16, fontWeight: isCorrect ? 800 : 500, color: isCorrect ? '#4ade80' : '#fff' }}>{opt}</span>
                    {isCorrect && <span style={{ fontSize: 12, color: '#4ade80', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '2px 12px', borderRadius: 20 }}>✓ Bonne réponse</span>}
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 800, color: isCorrect ? '#4ade80' : 'rgba(255,255,255,0.6)' }}>
                    {count} <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>vote{count > 1 ? 's' : ''}</span>
                  </span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${pct}%`,
                    background: isCorrect ? '#4ade80' : OPTION_COLORS[i],
                    transition: 'width .5s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Puissances max (power-selector) — pas d'options, on affiche juste la bonne réponse */}
      {!question.options && question.type === 'power-selector' && (
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 16, padding: '14px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Positif max</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>+{question.correctPosVal?.toFixed(2).replace('.', ',')}</div>
          </div>
          <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 16, padding: '14px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Négatif max</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: '#fff' }}>−{Math.abs(question.correctNegVal ?? 0).toFixed(2).replace('.', ',')}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── TV Correction — questions texte libre (réponses validées par le formateur) ──
function TVOpenCorrection({ question, qIdx, total, moduleLabel, sessionCode, moduleId }) {
  const [answers, setAnswers] = useState([])

  useEffect(() => {
    const load = async () => {
      const qa = await sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}&question_idx=eq.${qIdx}${moduleId ? `&module_id=eq.${moduleId}` : ''}`)
      setAnswers(dedupeLatestByCollaborateur(qa || []))
    }
    load()
    const t = setInterval(load, 2000)
    return () => clearInterval(t)
  }, [qIdx, sessionCode, moduleId])

  const correctCount = answers.filter(r => r.is_correct).length
  const wrongRows = answers.filter(r => !r.is_correct)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '32px 60px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={36} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{moduleLabel}</span>
        </div>
        <div style={{
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)',
          borderRadius: 20, padding: '6px 22px',
          fontSize: 13, fontWeight: 700, color: '#4ade80', letterSpacing: 1.5, textTransform: 'uppercase',
        }}>✓ Correction — Question {qIdx + 1} / {total}</div>
      </div>

      {/* Stats globales */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 24 }}>
        <div style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 18, padding: '14px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#4ade80' }}>{correctCount}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>bonne{correctCount > 1 ? 's' : ''} réponse{correctCount > 1 ? 's' : ''}</div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 18, padding: '14px 36px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: '#f87171' }}>{wrongRows.length}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: 4 }}>mauvaise{wrongRows.length > 1 ? 's' : ''} réponse{wrongRows.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Question */}
      <div style={{
        fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.55)', textAlign: 'center',
        marginBottom: 14, lineHeight: 1.35, maxWidth: 900, alignSelf: 'center',
      }}>{question?.question}</div>

      {/* Bonne réponse en grand */}
      <div style={{
        background: 'rgba(34,197,94,0.1)', border: '2px solid #4ade80', borderRadius: 20,
        padding: '18px 32px', margin: '0 auto 24px', maxWidth: 900, textAlign: 'center',
        boxShadow: '0 0 32px rgba(74,222,128,0.2)',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>✓ Bonne réponse</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1.35 }}>{question?.hint}</div>
      </div>

      {/* Les mauvaises réponses ne sont jamais détaillées sur le diffuseur — le
          formateur seul les voit sur son écran (ModuleOptique.js / ModuleQuizJ2.js).
          Ici juste un message neutre, sans contenu ni identité. */}
      {wrongRows.length === 0 && (
        <div style={{ textAlign: 'center', color: '#4ade80', fontSize: 18, fontWeight: 700, marginTop: 16 }}>
          🎉 Tout le monde a bon !
        </div>
      )}
    </div>
  )
}

// ── Phrases d'humour podium (top 5 uniquement) ───────────────────
const PHRASES_P1 = [
  "[Prénom] voit tout et répond juste — même son opticien prend des notes.",
  "Correction parfaite, score parfait. [Prénom] n'a clairement pas besoin de lunettes pour voir les bonnes réponses.",
  "[Prénom] : vision 10/10, sans ordonnance. Le reste de l'équipe peut prendre rendez-vous.",
  "[Prénom] a tout bon. On se demande même s'il n'avait pas les réponses avant.",
  "[Prénom] écrase la concurrence. Quelqu'un a vérifié qu'il ne triche pas avec des lunettes à caméra ?",
  "Respect [Prénom]. On parle de toi dans la salle de pause depuis 10 minutes.",
]
const PHRASES_P2 = [
  "[Prénom] était si proche… une dioptrie de plus et c'était l'or.",
  "L'argent c'est élégant [Prénom] — mais la prochaine fois, vise la première marche.",
  "[Prénom] voit bien… mais pas aussi loin que le premier.",
  "[Prénom] : deuxième. C'est la place des gens intelligents qui laissent les autres gagner par politesse.",
  "[Prénom] aurait pu gagner… mais il a sûrement été distrait par une belle monture.",
  "Deuxième [Prénom] — t'inquiète, le premier a sûrement triché.",
]
const PHRASES_P3 = [
  "[Prénom] est sur le podium. C'est déjà mieux que de regarder depuis le fond du magasin.",
  "Bronze pour [Prénom] — en optique on dirait que la mise au point est presque parfaite.",
  "[Prénom] sur la troisième marche — là où les vrais professionnels se posent.",
  "[Prénom] : troisième. C'est le nombre de zones d'un verre progressif, c'est forcément un signe.",
  "Podium assuré pour [Prénom]. Maintenant il faut juste travailler les deux premières marches.",
]
const PHRASES_P45 = [
  "[Prénom] : juste en dehors du podium. Comme un verre sans traitement — presque parfait.",
  "[Prénom] a frôlé la médaille. On sent que l'adaptation est en cours.",
  "Si près, si loin [Prénom]… un peu comme essayer des lunettes sans les essayer vraiment.",
  "[Prénom] : premier des non-médaillés. C'est une médaille en soi… presque.",
  "[Prénom] a manqué le podium d'un souffle. Ou d'une question. On va dire d'un souffle.",
]
const PHRASES_TOP5 = [...PHRASES_P1, ...PHRASES_P2, ...PHRASES_P3, ...PHRASES_P45]

function pickPhrase(pool, firstName) {
  const raw = pool[Math.floor(Math.random() * pool.length)]
  return raw.replace(/\[Prénom\]/g, firstName)
}

// ── TV Quiz Podium interstitiel (toutes les 5 questions) ──────────
function TVQuizPodium({ qIdx, onDone, sessionCode, skipSignal, moduleId }) {
  const [top3, setTop3] = useState([])
  const phraseRef = useRef(null)

  useEffect(() => {
    sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}${moduleId ? `&module_id=eq.${moduleId}` : ''}`).then(rows => {
      const grouped = {}
      const deduped = dedupeLatestByCollaborateurAndQuestion((rows || []).filter(r => r.question_idx < qIdx))
      deduped.forEach(r => {
        if (!grouped[r.collaborateur]) grouped[r.collaborateur] = 0
        if (r.is_correct) grouped[r.collaborateur]++
      })
      const sorted = Object.entries(grouped)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, 3)
      setTop3(sorted)
      if (sorted[0]) {
        const firstName = sorted[0].name.split(' ').pop()
        phraseRef.current = pickPhrase(PHRASES_TOP5, firstName)
      }
    }).catch(() => {})
  }, [qIdx, sessionCode, moduleId])

  useEffect(() => {
    if (skipSignal) onDone()
  }, [skipSignal, onDone])

  const slots = [top3[1], top3[0], top3[2]]
  const stepH = [180, 240, 150]
  const medals = ['🥈', '🥇', '🥉']
  const ranks = [2, 1, 3]
  const cols = [
    { fill: 'rgba(148,163,184,0.2)', border: '#94a3b8', score: '#cbd5e1' },
    { fill: 'rgba(251,191,36,0.2)',  border: '#fbbf24', score: '#fde68a' },
    { fill: 'rgba(180,83,9,0.2)',    border: '#d97706', score: '#fcd34d' },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020d1f 0%, #071832 50%, #0a2040 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 60px', position: 'relative', overflow: 'hidden',
    }}>
      {[...Array(14)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 4 + (i % 3) * 2, height: 4 + (i % 3) * 2, borderRadius: '50%',
          background: ['#fbbf24','#00abe9','#a78bfa'][i % 3],
          left: `${4 + i * 7}%`, top: `${8 + (i * 11) % 72}%`, opacity: 0.28,
          animation: `starPulse ${1.8 + (i % 4) * 0.4}s ease-in-out infinite`,
          animationDelay: `${i * 0.18}s`,
        }} />
      ))}

      <div style={{
        background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.35)',
        borderRadius: 20, padding: '7px 24px', marginBottom: 20,
        fontSize: 13, fontWeight: 700, color: '#00abe9', letterSpacing: 2, textTransform: 'uppercase',
      }}>⚡ Bilan après {qIdx} question{qIdx > 1 ? 's' : ''}</div>

      <div style={{
        animation: 'trophyFloat 3s ease-in-out infinite',
        filter: 'drop-shadow(0 0 24px rgba(251,191,36,0.5))',
        marginBottom: 8,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/troph%C3%A9-quiz.png" alt="Trophée" width={110} height={110} style={{ objectFit: 'contain', display: 'block' }} />
      </div>

      <h2 style={{
        fontSize: 52, fontWeight: 900, color: '#fff', marginBottom: 44, textAlign: 'center',
        animation: 'podiumFadeIn 0.6s ease forwards',
      }}>Classement</h2>

      {top3.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
          {slots.map((player, i) => {
            if (!player) return <div key={i} style={{ width: 200, height: stepH[i] }} />
            const c = cols[i]
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  textAlign: 'center', marginBottom: 12,
                  animation: `podiumFadeIn 0.5s ease forwards`,
                  animationDelay: `${i * 0.15 + 0.3}s`, opacity: 0,
                }}>
                  <div style={{ fontSize: 32, marginBottom: 4 }}>{medals[i]}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', maxWidth: 190, lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: 44, fontWeight: 900, color: c.score, lineHeight: 1.1, marginTop: 4 }}>
                    {player.score}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    /{qIdx} correct{player.score > 1 ? 'es' : 'e'}
                  </div>
                </div>
                <div style={{
                  width: 200, height: stepH[i],
                  background: c.fill, border: `2px solid ${c.border}`,
                  borderBottom: 'none', borderRadius: '14px 14px 0 0',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 20,
                  boxShadow: `0 0 40px ${c.border}30`,
                  animation: `podiumRise 0.7s ease forwards`,
                  animationDelay: `${i * 0.15}s`,
                }}>
                  <div style={{ fontSize: 48, fontWeight: 900, color: c.border, opacity: 0.55 }}>
                    #{ranks[i]}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {phraseRef.current && (
        <div style={{
          maxWidth: 680, textAlign: 'center', marginTop: 32, marginBottom: 8,
          fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.75)',
          fontStyle: 'italic', lineHeight: 1.5,
          animation: 'podiumFadeIn 0.8s ease 0.6s forwards', opacity: 0,
        }}>
          💬 {phraseRef.current}
        </div>
      )}

      <div style={{
        width: 630, height: 8,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        marginTop: 28, marginBottom: 20,
      }} />

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
        En attente du formateur…
      </div>
    </div>
  )
}

// ── TV Quiz Final Podium ──────────────────────────────────────────
function TVQuizFinalPodium({ quiz, sessionCode, moduleId = 'quiz-final' }) {
  const [top3, setTop3] = useState([])
  const [ready, setReady] = useState(false)
  const phraseRef = useRef(null)

  useEffect(() => {
    sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}&module_id=eq.${moduleId}`).then(rows => {
      const grouped = {}
      const deduped = dedupeLatestByCollaborateurAndQuestion(rows || [])
      deduped.forEach(r => {
        if (!grouped[r.collaborateur]) grouped[r.collaborateur] = 0
        if (r.is_correct) grouped[r.collaborateur]++
      })
      const sorted = Object.entries(grouped)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .slice(0, 3)
      setTop3(sorted)
      if (sorted[0]) {
        const firstName = sorted[0].name.split(' ').pop()
        phraseRef.current = pickPhrase(PHRASES_P1, firstName)
      }
      setTimeout(() => setReady(true), 400)
    }).catch(() => { setTimeout(() => setReady(true), 400) })
  }, [sessionCode, moduleId])

  const slots = [top3[1], top3[0], top3[2]]
  const stepH = [220, 300, 170]
  const medals = ['🥈', '🥇', '🥉']
  const ranks = [2, 1, 3]
  const cols = [
    { fill: 'rgba(148,163,184,0.18)', border: '#94a3b8', score: '#cbd5e1', bg: 'rgba(148,163,184,0.07)' },
    { fill: 'rgba(251,191,36,0.18)',  border: '#fbbf24', score: '#fde68a', bg: 'rgba(251,191,36,0.07)'  },
    { fill: 'rgba(180,83,9,0.18)',    border: '#d97706', score: '#fcd34d', bg: 'rgba(180,83,9,0.07)'    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 25%, #0e2547 0%, #020d1f 70%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '28px 60px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Rayons dorés */}
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((deg, i) => (
        <div key={i} style={{
          position: 'absolute', top: '22%', left: '50%',
          width: 1.5, height: '85%',
          background: 'linear-gradient(180deg, rgba(251,191,36,0.12) 0%, transparent 100%)',
          transform: `rotate(${deg}deg)`, transformOrigin: 'top center',
        }} />
      ))}
      {/* Particules */}
      {[...Array(18)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: 3 + (i % 4), height: 3 + (i % 4), borderRadius: '50%',
          background: ['#fbbf24','#00abe9','#a78bfa','#34d399'][i % 4],
          left: `${3 + i * 5.5}%`, top: `${5 + (i * 13) % 80}%`, opacity: 0.3,
          animation: `starPulse ${1.5 + (i % 5) * 0.35}s ease-in-out infinite`,
          animationDelay: `${i * 0.12}s`,
        }} />
      ))}

      <div style={{ position: 'absolute', top: 28, left: 40 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
      </div>

      {/* Trophée */}
      <div style={{
        animation: 'trophyFloat 3s ease-in-out infinite',
        filter: 'drop-shadow(0 0 40px rgba(251,191,36,0.6))',
        marginBottom: 4,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/troph%C3%A9-quiz.png" alt="Trophée champion" width={150} height={150} style={{ objectFit: 'contain', display: 'block' }} />
      </div>

      <h1 style={{
        fontSize: 64, fontWeight: 900, color: '#fff', marginBottom: 6, textAlign: 'center',
        animation: 'podiumFadeIn 0.7s ease 0.2s forwards', opacity: 0,
        textShadow: '0 0 40px rgba(251,191,36,0.45)',
      }}>Podium final !</h1>
      <p style={{
        fontSize: 19, color: 'rgba(255,255,255,0.45)', marginBottom: 36, fontWeight: 500,
        animation: 'podiumFadeIn 0.7s ease 0.35s forwards', opacity: 0,
      }}>🎉 Bravo à tous les participants !</p>

      {/* Podium */}
      {ready && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 16 }}>
          {slots.map((player, i) => {
            if (!player) return <div key={i} style={{ width: 240, height: stepH[i] }} />
            const c = cols[i]
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  background: c.bg, border: `1px solid ${c.border}50`,
                  borderRadius: 20, padding: '16px 20px', marginBottom: 14,
                  textAlign: 'center', width: 240,
                  animation: `podiumFadeIn 0.6s ease forwards`,
                  animationDelay: `${i * 0.2 + 0.4}s`, opacity: 0,
                  boxShadow: `0 0 32px ${c.border}20`,
                }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>{medals[i]}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.2, wordBreak: 'break-word' }}>
                    {player.name}
                  </div>
                  <div style={{ fontSize: 58, fontWeight: 900, color: c.score, lineHeight: 1, marginTop: 8 }}>
                    {player.score}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                    /{quiz.length} bonne{player.score > 1 ? 's' : ''} réponse{player.score > 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{
                  width: 240, height: stepH[i],
                  background: c.fill, border: `2px solid ${c.border}`,
                  borderBottom: 'none', borderRadius: '16px 16px 0 0',
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 24,
                  boxShadow: `0 0 55px ${c.border}22`,
                  animation: `podiumRise 0.9s ease forwards`,
                  animationDelay: `${i * 0.2}s`,
                }}>
                  <div style={{ fontSize: 62, fontWeight: 900, color: c.border, opacity: 0.45 }}>
                    #{ranks[i]}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {phraseRef.current && (
        <div style={{
          maxWidth: 720, textAlign: 'center', marginTop: 28, marginBottom: 4,
          fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
          fontStyle: 'italic', lineHeight: 1.5,
          animation: 'podiumFadeIn 0.8s ease 0.8s forwards', opacity: 0,
        }}>
          💬 {phraseRef.current}
        </div>
      )}

      <div style={{
        width: 760, height: 10,
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
        marginTop: 28, marginBottom: 8,
      }} />

      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', fontWeight: 500, marginTop: 8 }}>
        En attente du formateur…
      </div>
    </div>
  )
}

// ── TV Quiz Rate Reveal ───────────────────────────────────────────
function TVQuizRateReveal({ sessionCode, moduleId, moduleLabel, quiz }) {
  const [rate, setRate]       = useState(null)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    sbSelect('quiz_answers', `session_code=eq.${sessionCode || SESSION_CODE}&module_id=eq.${moduleId}`)
      .then(rows => {
        const data             = rows || []
        const correct          = data.filter(r => r.is_correct).length
        const participants     = new Set(data.map(r => r.collaborateur)).size
        const totalQ           = (quiz || []).length
        const totalPossible    = totalQ * participants
        const pct              = totalPossible > 0 ? Math.round((correct / totalPossible) * 100) : 0
        setTimeout(() => setRate(pct), 700)
      }).catch(() => { setTimeout(() => setRate(0), 700) })
  }, [sessionCode, moduleId])

  useEffect(() => {
    if (rate === null) return
    let current = 0
    const steps    = 80
    const interval = 2000 / steps
    const t = setInterval(() => {
      current = Math.min(current + rate / steps, rate)
      setDisplay(Math.round(current))
      if (current >= rate) clearInterval(t)
    }, interval)
    return () => clearInterval(t)
  }, [rate])

  const R  = 210
  const C  = 2 * Math.PI * R
  const pct = rate !== null ? display : 0
  const dashoffset = C * (1 - pct / 100)
  const arcColor = pct >= 75 ? '#22c55e' : pct >= 50 ? '#00abe9' : '#f59e0b'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 35%, #021a3a 0%, #010d1f 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 52 }}>
        Taux de réussite — {moduleLabel}
      </div>

      <div style={{ position: 'relative', width: 500, height: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="500" height="500" viewBox="0 0 500 500" style={{ position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <filter id="rateGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="10" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx="250" cy="250" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="24" />
          {/* Inner subtle ring */}
          <circle cx="250" cy="250" r={R - 35} fill="none" stroke={`${arcColor}10`} strokeWidth="50" />
          {/* Progress arc */}
          <circle
            cx="250" cy="250" r={R}
            fill="none"
            stroke={arcColor}
            strokeWidth="24"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={dashoffset}
            transform="rotate(-90 250 250)"
            filter="url(#rateGlow)"
            style={{ transition: `stroke-dashoffset ${2000 / 80}ms linear, stroke 0.4s ease` }}
          />
        </svg>
        {/* Texte centré */}
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: 110, fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: -4 }}>
            {display}
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, color: arcColor, marginTop: -8 }}>%</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)', marginTop: 10, fontWeight: 500 }}>
            de bonnes réponses
          </div>
        </div>
      </div>

      {rate !== null && (
        <div style={{
          marginTop: 36, fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
          textAlign: 'center', maxWidth: 600, lineHeight: 1.5,
          opacity: 1, animation: 'fadeInUp 0.6s ease both',
          fontStyle: 'italic',
        }}>
          {pct >= 80
            ? "L'optique n'a plus de secrets pour cette équipe — même les astigmates voient clair maintenant."
            : pct >= 60
              ? "Pas mal du tout ! Il reste quelques dioptries à peaufiner, mais les bases sont solides."
              : "On retient l'essentiel... et on revoit les ordonnances — c'est exactement pour ça qu'on est là !"}
        </div>
      )}

      <div style={{ display: 'flex', gap: 28, marginTop: 40 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain', opacity: 0.4 }} />
      </div>
    </div>
  )
}

// ── TV Group Results ──────────────────────────────────────────────
function TVGroupResults({ moduleId, moduleLabel, quiz, sessionCode }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)
  const audioRef = useRef(null)
  const [muted, setMuted] = useState(true)

  const toggleMute = () => {
    const newMuted = !muted
    if (audioRef.current) {
      audioRef.current.muted = newMuted
      if (!newMuted && audioRef.current.paused) {
        audioRef.current.play().catch(() => {})
      }
    }
    setMuted(newMuted)
  }

  useEffect(() => {
    const code = sessionCode || SESSION_CODE
    const query = `session_code=eq.${code}&module_id=eq.${moduleId}`
    const fetchAnswers = async () => {
      try {
        const rows = await sbSelect('quiz_answers', query)
        setAnswers(dedupeLatestByCollaborateurAndQuestion(rows || []))
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    fetchAnswers()
    const interval = setInterval(async () => {
      try {
        const rows = await sbSelect('quiz_answers', query)
        setAnswers(dedupeLatestByCollaborateurAndQuestion(rows || []))
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [moduleId, sessionCode])

  const participantCount = [...new Set((answers || []).map(r => r.collaborateur))].length

  const questionStats = (quiz || []).map((q, idx) => {
    const qAnswers = answers.filter(r => r.question_idx === idx)
    const wrongCount = qAnswers.filter(r => !r.is_correct).length
    const totalAnswers = qAnswers.length
    const pctWrong = totalAnswers > 0 ? Math.round((wrongCount / totalAnswers) * 100) : 0
    return { idx, question: q.question, pctWrong, totalAnswers }
  }).sort((a, b) => b.pctWrong - a.pctWrong)

  const getPriority = (pct) => {
    if (pct >= 50) return { icon: '🔴', label: 'À retravailler en priorité', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' }
    if (pct >= 25) return { icon: '🟡', label: 'À consolider', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' }
    return { icon: '🟢', label: 'Bien maîtrisé', color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)' }
  }

  return (
    <div style={{
      height: '100vh', overflowY: 'auto',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '32px 64px 48px', position: 'relative',
    }}>
      <audio ref={audioRef} src="/audio/prettyjohn1-no-copyright-music-498106.mp3" autoPlay loop muted style={{ display: 'none' }} />
      <button onClick={toggleMute} style={{
        position: 'fixed', bottom: 24, right: 24,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.4)', borderRadius: 12,
        padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>
        {muted ? '🔇 Son coupé' : '🔊 Son actif'}
      </button>

      {/* Logo top-left */}
      <div style={{ position: 'absolute', top: 28, left: 40 }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 40, paddingTop: 16 }}>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: '#fff', marginBottom: 12 }}>Bilan du quiz</h1>
        <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Points à retravailler en priorité</p>
      </div>

      {/* Question cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, maxWidth: 1100, alignSelf: 'center', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 20, padding: 60 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const priority = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{
              background: priority.bg,
              border: `1px solid ${priority.border}`,
              borderRadius: 24, padding: '24px 36px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ flex: 1, marginRight: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 24 }}>{priority.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: priority.color, textTransform: 'uppercase', letterSpacing: 1.2 }}>{priority.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>
                    Q{stat.idx + 1} — {stat.question}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 64, fontWeight: 900, color: priority.color, lineHeight: 1 }}>{stat.pctWrong}%</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>d'erreurs</div>
                </div>
              </div>
              <div style={{ height: 12, background: 'rgba(255,255,255,0.08)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6,
                  width: `${stat.pctWrong}%`,
                  background: priority.color,
                  transition: 'width 1s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Participant count bottom */}
      <div style={{ textAlign: 'center', marginTop: 32, fontSize: 18, color: 'rgba(255,255,255,0.4)' }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', marginRight: 8 }}>{participantCount}</span>
        participant{participantCount !== 1 ? 's' : ''} ont répondu
      </div>
    </div>
  )
}

// ── TV Troubles List avec avatar opticien ────────────────────────
function TVTroublesListVideo({ page, pageIndex, total, moduleLabel, troublesSelected, troublesRevealed = [], audioUnlocked }) {
  const [entered, setEntered] = useState(false)
  const videoRef = useRef(null)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (troublesSelected !== null && audioUnlocked) {
      v.play().catch(() => {})
    } else if (troublesSelected === null) {
      v.pause()
      v.currentTime = 0
    }
  }, [troublesSelected, audioUnlocked])

  const sel = troublesSelected !== null ? (page.troubles || [])[troublesSelected] : null

  // ── Mode focus : un trouble sélectionné ──
  if (sel) {
    return (
      <div style={{
        height: '100vh',
        background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Module · {moduleLabel}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2 }}>
            Les bases de l&apos;optique
          </div>
        </div>

        {/* Contenu pleine largeur */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '28px 80px 80px', gap: 28,
          background: `linear-gradient(160deg, ${sel.color}0a, transparent)`,
        }}>
          <div style={{
            background: `${sel.color}14`,
            border: `2px solid ${sel.color}55`,
            borderLeft: `6px solid ${sel.color}`,
            borderRadius: 24, padding: '36px 44px', maxWidth: 900,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: sel.color, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
              {sel.num} — Trouble visuel
            </div>
            <div style={{ fontSize: 64, fontWeight: 900, color: '#fff', lineHeight: 1.05, marginBottom: 20 }}>
              {sel.nom}
            </div>
            <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
              {sel.def}
            </div>
          </div>

          {sel.visionDemo === 'astigmate' && (
            <div style={{
              display: 'flex', gap: 48, alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 24, padding: '24px 40px', maxWidth: 900,
            }}>
              <HeadlightVision cyl={0} axe={0} size={180} label="Vision normale" sublabel="Point net" />
              <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.25)' }}>→</div>
              <HeadlightVision cyl={3} axe={30} size={180} label="Vision astigmate" sublabel="Point déformé en ovale" />
            </div>
          )}

          <div style={{ display: 'flex', gap: 28 }}>
            {(page.troubles || []).map((t, i) => {
              if (i === troublesSelected) return null
              const done = troublesRevealed.includes(i)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: done ? 0.75 : 0.22 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: done ? t.color : 'rgba(255,255,255,0.3)', flexShrink: 0 }} />
                  <div style={{ fontSize: 16, color: done ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    {done ? t.nom : '?'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Avatar — petit, bas à droite */}
        <div style={{
          position: 'absolute', bottom: 28, right: 36,
          width: 150, height: 150, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0,
          border: `2px solid ${sel.color}70`,
          boxShadow: `0 0 0 4px ${sel.color}18, 0 8px 32px rgba(0,0,0,0.5)`,
        }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={videoRef}
            key={sel.video}
            src={sel.video}
            preload="auto"
            playsInline
            muted={!audioUnlocked}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
          />
        </div>
      </div>
    )
  }

  // ── Mode liste : aucun trouble sélectionné ──
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      <style>{`@keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:none; } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Module · {moduleLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{ height: 5, borderRadius: 3, width: i === pageIndex ? 22 : 5, background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)', transition: 'all .3s' }} />
          ))}
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 48px 32px', gap: 20,
        opacity: entered ? 1 : 0, transform: entered ? 'translateY(0)' : 'translateY(16px)', transition: 'all .5s ease',
      }}>
        <div>
          <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.28)', borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Les bases de l&apos;optique</div>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{page.titre}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>{page.sousTitre}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          {(page.troubles || []).map((t, i) => {
            const done = troublesRevealed.includes(i)
            if (!done) {
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 28,
                  background: 'rgba(255,255,255,0.02)', border: '1.5px dashed rgba(255,255,255,0.14)',
                  borderRadius: 16, padding: '22px 32px', transition: 'all .4s ease',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: 1, minWidth: 28 }}>{t.num}</span>
                  <span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.22)', fontStyle: 'italic' }}>À découvrir…</span>
                </div>
              )
            }
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 28,
                background: `${t.color}09`, border: `1px solid ${t.color}28`,
                borderLeft: `5px solid ${t.color}`,
                borderRadius: 16, padding: '22px 32px',
                animation: 'fadeInUp 0.5s ease both',
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: t.color, letterSpacing: 1, minWidth: 28, opacity: 0.75 }}>{t.num}</span>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: -0.3, minWidth: 260 }}>{t.nom}</span>
                <div style={{ width: 1, height: 26, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
                <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, flex: 1 }}>{t.def}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Bouton plein écran ────────────────────────────────────────────
function FullscreenButton() {
  const [isFs, setIsFs] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isFs ? 'Quitter le plein écran' : 'Plein écran'}
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 10000,
        background: hovered ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 10, padding: '8px 12px',
        color: '#fff', fontSize: 18, cursor: 'pointer',
        backdropFilter: 'blur(8px)',
        transition: 'all .2s',
        lineHeight: 1,
      }}
    >
      {isFs ? '⊠' : '⛶'}
    </button>
  )
}

// ── Annotation canvas (stylo / gomme formateur) ───────────────────
function TVAnnotationCanvas() {
  const canvasRef = useRef(null)
  const [mode, setMode] = useState('off') // 'off' | 'pen' | 'eraser'
  const drawing = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      const img = canvas.toDataURL()
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      const image = new window.Image()
      image.onload = () => canvas.getContext('2d')?.drawImage(image, 0, 0)
      image.src = img
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = (e) => {
    if (mode === 'off') return
    drawing.current = true
    canvasRef.current.setPointerCapture(e.pointerId)
    lastPos.current = getPos(e)
    if (mode === 'pen') {
      const ctx = canvasRef.current.getContext('2d')
      ctx.beginPath()
      ctx.arc(lastPos.current.x, lastPos.current.y, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#ef4444'
      ctx.fill()
    }
  }

  const onPointerMove = (e) => {
    if (!drawing.current || mode === 'off') return
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    if (mode === 'pen') {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    } else if (mode === 'eraser') {
      ctx.clearRect(pos.x - 24, pos.y - 24, 48, 48)
    }
    lastPos.current = pos
  }

  const onPointerUp = () => { drawing.current = false }

  const clearAll = () => {
    const c = canvasRef.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
  }

  const isPen = mode === 'pen'
  const isEraser = mode === 'eraser'

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          pointerEvents: mode === 'off' ? 'none' : 'all',
          cursor: mode === 'pen' ? 'crosshair' : mode === 'eraser' ? 'cell' : 'default',
          touchAction: 'none',
        }}
      />
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', gap: 8,
        background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 16, padding: '8px 12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.55)',
      }}>
        <button
          onClick={() => setMode(m => m === 'pen' ? 'off' : 'pen')}
          title={isPen ? 'Désactiver le stylo' : 'Stylo annotation'}
          style={{
            background: isPen ? '#ef4444' : 'rgba(255,255,255,0.12)',
            border: `1px solid ${isPen ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10, width: 40, height: 40, cursor: 'pointer',
            fontSize: 18, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s, border .2s',
          }}
        >✏️</button>
        <button
          onClick={() => setMode(m => m === 'eraser' ? 'off' : 'eraser')}
          title={isEraser ? 'Désactiver la gomme' : 'Gomme'}
          style={{
            background: isEraser ? '#f59e0b' : 'rgba(255,255,255,0.12)',
            border: `1px solid ${isEraser ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 10, width: 40, height: 40, cursor: 'pointer',
            fontSize: 18, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s, border .2s',
          }}
        >⬜</button>
        <button
          onClick={clearAll}
          title="Tout effacer"
          style={{
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10, width: 40, height: 40, cursor: 'pointer',
            fontSize: 18, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >🗑️</button>
      </div>
    </>
  )
}

// ── TV View ───────────────────────────────────────────────────────
export default function TVView() {
  const { activeModule, modulePage, sharedState, loading, sessionCode } = useModuleSync()
  const [tvScreen, setTvScreen]               = useState(null)
  const [troublesPhase, setTroublesPhase]       = useState(1)
  const [opticienPlaying, setOpticienPlaying]   = useState(false)
  const [troublesSelected, setTroublesSelected] = useState(null)
  const [troublesRevealed, setTroublesRevealed] = useState([])
  const [ordoPlaying, setOrdoPlaying]         = useState(false)
  const [ordoRevealStep, setOrdoRevealStep]   = useState(0)
  const [ordoHeadlightDemo, setOrdoHeadlightDemo] = useState(false)
  const [ordoHeadlightCyl, setOrdoHeadlightCyl]   = useState(0)
  const [ordoHeadlightAxe, setOrdoHeadlightAxe]   = useState(0)
  const [saisieStage, setSaisieStage]             = useState('r1-entry')
  const [audioUnlocked, setAudioUnlocked]     = useState(false)
  const [freinsResponses, setFreinsResponses]           = useState({})
  const [revealFreins, setRevealFreins]                 = useState(false)
  const [prixResponses, setPrixResponses]               = useState({})
  const [revealPrix, setRevealPrix]                     = useState(false)
  const [ventesResponses, setVentesResponses]           = useState({})
  const [revealVentes, setRevealVentes]                 = useState(false)
  const [revealLabo, setRevealLabo]                     = useState(false)
  const [promesseResponses, setPromesseResponses]       = useState({})
  const [revealPromesse, setRevealPromesse]             = useState(false)
  const [planningDay, setPlanningDay]                   = useState(null)
  // Trame d'accueil
  const [trameStep, setTrameStep]                       = useState(null)
  // Offres 1=1
  const [offres11Step, setOffres11Step]                 = useState(0)
  const [offresClassiqueStep, setOffresClassiqueStep]   = useState(0)
  const [offresPackPlanStep, setOffresPackPlanStep]     = useState(0)
  const [offresProg11Revealed, setOffresProg11Revealed] = useState(false)
  // Force LPT — point sélectionné par le formateur
  const [modelePoint, setModelePoint]                   = useState(null)
  // FAQ Réveil des acquis
  const [faqJournee, setFaqJournee]                     = useState(null)
  const [faqQuestions, setFaqQuestions]                 = useState([])
  // Progressif interactive state
  const [progZoneQ, setProgZoneQ]                       = useState(null)
  const [progZoneResponses, setProgZoneResponses]       = useState({})
  const [progZoneShowCorrect, setProgZoneShowCorrect]   = useState(false)
  const [progRetourResponses, setProgRetourResponses]   = useState({})
  const [progRetourRevealed, setProgRetourRevealed]     = useState(false)
  const [progObjectionIdx, setProgObjectionIdx]         = useState(null)
  const [progObjectionResponses, setProgObjectionResponses] = useState({})
  const [progObjectionRevealed, setProgObjectionRevealed] = useState(false)
  const [progBestAnswer, setProgBestAnswer]             = useState(null)
  const [progAnatomieReveal, setProgAnatomieReveal]     = useState([])

  // Mutuelles Belgique
  const [mutuellesRevealed, setMutuellesRevealed]         = useState([])
  const [inamiRevealed, setInamiRevealed]                 = useState(false)
  const [partenaRevealed, setPartenaRevealed]             = useState(false)
  const [rembfrRevealed, setRembfrRevealed]               = useState([])
  const [rembfrDemarcheA, setRembfrDemarcheA]             = useState(0)
  const [rembfrDemarcheB, setRembfrDemarcheB]             = useState(0)
  const [rembfrSupreme, setRembfrSupreme]                 = useState(0)
  const [lptsPecScenario, setLptsPecScenario]             = useState(null)
  const [parcoursRevealed, setParcoursRevealed]           = useState([])
  const [tiersPayantRevealed, setTiersPayantRevealed]     = useState(false)
  const [tiersPayantAnswersRevealed, setTiersPayantAnswersRevealed] = useState(false)
  const [brainstormRevealed, setBrainstormRevealed]       = useState(false)
  const [monturesPrixRevealed, setMonturesPrixRevealed]   = useState(false)
  const [monturesMateriauxResponses, setMonturesMateriauxResponses] = useState({})
  const [revealMonturesMateriaux, setRevealMonturesMateriaux]       = useState(false)

  const handleAmeliProClick = async () => {
    try { await setRoomSharedState({ rembfr_amelipro_clicked: true }, sessionCode) } catch {}
  }

  // Quiz podium
  const [quizInterstitialPhase, setQuizInterstitialPhase] = useState(false)
  const [finalPodiumPhase, setFinalPodiumPhase]           = useState(false)
  const [rateRevealPhase,  setRateRevealPhase]            = useState(false)
  const [finalEndedPhase,  setFinalEndedPhase]            = useState(false)

  // ── Hydratation depuis sharedState (fourni par useModuleSync — 1 seul appel Supabase) ──
  useEffect(() => {
    if (!sharedState) return
    setTvScreen(sharedState.tv_screen || null)
    setTrameStep(sharedState.trame_step ?? null)
    setOffres11Step(sharedState.offres_11_step ?? 0)
    setOffresClassiqueStep(sharedState.offres_classique_step ?? 0)
    setOffresPackPlanStep(sharedState.offres_pack_plan_step ?? 0)
    setOffresProg11Revealed(!!sharedState.offres_prog11_revealed)
    setModelePoint(sharedState.modele_point ?? null)
    setTroublesPhase(sharedState.troubles_phase || 1)
    setOpticienPlaying(!!sharedState.opticien_playing)
    setTroublesSelected(sharedState.troubles_selected ?? null)
    setTroublesRevealed(sharedState.troubles_revealed || [])
    setOrdoPlaying(!!sharedState.ordo_playing)
    setOrdoRevealStep(sharedState.ordo_reveal_step ?? 0)
    setOrdoHeadlightDemo(!!sharedState.ordo_headlight_demo)
    setOrdoHeadlightCyl(sharedState.ordo_headlight_cyl ?? 0)
    setOrdoHeadlightAxe(sharedState.ordo_headlight_axe ?? 0)
    setSaisieStage(sharedState.saisie_stage || 'r1-entry')
    setFreinsResponses(sharedState.freins_responses || {})
    setRevealFreins(!!sharedState.reveal_freins)
    setPrixResponses(sharedState.prix_responses || {})
    setRevealPrix(!!sharedState.reveal_prix)
    setVentesResponses(sharedState.ventes_responses || {})
    setRevealVentes(!!sharedState.reveal_ventes)
    setRevealLabo(!!sharedState.reveal_labo)
    setPromesseResponses(sharedState.promesse_responses || {})
    setRevealPromesse(!!sharedState.reveal_promesse)
    setPlanningDay(sharedState.planning_day || null)
    setProgZoneQ(sharedState.prog_zone_q ?? null)
    setProgZoneResponses(sharedState.prog_zone_responses || {})
    setProgZoneShowCorrect(!!sharedState.prog_zone_show_correct)
    setProgRetourResponses(sharedState.prog_retour_responses || {})
    setProgRetourRevealed(!!sharedState.prog_retour_revealed)
    setProgObjectionIdx(sharedState.prog_objection_idx ?? null)
    setProgObjectionResponses(sharedState.prog_objection_responses || {})
    setProgObjectionRevealed(!!sharedState.prog_objection_revealed)
    setProgBestAnswer(sharedState.prog_best_answer || null)
    setProgAnatomieReveal(sharedState.prog_anatomie_reveal || [])
    const fj = sharedState.faq_journee || null
    setFaqJournee(fj)
    setFaqQuestions(fj ? (sharedState[`faq_${fj}_q`] || []) : [])
    setMutuellesRevealed(sharedState.mutuelles_revealed || [])
    setInamiRevealed(!!sharedState.inami_revealed)
    setPartenaRevealed(!!sharedState.partena_revealed)
    setRembfrRevealed(sharedState.rembfr_revealed || [])
    setRembfrDemarcheA(sharedState.rembfr_demarche_a ?? 0)
    setRembfrDemarcheB(sharedState.rembfr_demarche_b ?? 0)
    setRembfrSupreme(sharedState.rembfr_supreme ?? 0)
    setLptsPecScenario(sharedState.lpts_pec_scenario ?? null)
    setParcoursRevealed(sharedState.parcours_revealed || [])
    setTiersPayantRevealed(!!sharedState.tiers_payant_revealed)
    setTiersPayantAnswersRevealed(!!sharedState.tiers_payant_answers_revealed)
    setBrainstormRevealed(!!sharedState.brainstorm_revealed)
    setMonturesPrixRevealed(!!sharedState.montures_prix_revealed)
    setMonturesMateriauxResponses(sharedState.montures_materiaux_responses || {})
    setRevealMonturesMateriaux(!!sharedState.reveal_montures_materiaux)
  }, [sharedState])

  const moduleData = MODULE_DATA[activeModule] || null
  const isLobby        = !!moduleData && modulePage === -1
  const isResults      = !!moduleData && modulePage === 200
  const isQuiz         = !!moduleData && modulePage >= 100 && modulePage < 200
  const isPdmAnimation = activeModule === 'pdm' && modulePage >= 1000 && modulePage < 2000
  const pdmAnimStep    = isPdmAnimation ? modulePage - 1000 : 0

  // Podium interstitiel piloté par quiz_interstitial_q dans sharedState
  useEffect(() => {
    const interstitialQ = sharedState?.quiz_interstitial_q
    // Si le formateur a avancé au-delà du point d'interstitiel sans le fermer, sortir automatiquement
    if (interstitialQ && modulePage != null && (modulePage - 100) > interstitialQ) {
      setQuizInterstitialPhase(false)
    } else if (interstitialQ) {
      setQuizInterstitialPhase(true)
    } else {
      setQuizInterstitialPhase(false)
    }
  }, [sharedState?.quiz_interstitial_q, modulePage])

  // Podium final — piloté par quiz_final_phase dans sharedState (formateur contrôle l'ordre)
  useEffect(() => {
    const phase = sharedState?.quiz_final_phase
    setFinalPodiumPhase(phase === 'podium')
    setRateRevealPhase(phase === 'rate')
    setFinalEndedPhase(phase === 'ended')
  }, [sharedState?.quiz_final_phase])

  let page = null
  let quizQuestion = null
  if (moduleData) {
    if (isQuiz) {
      const qIdx = modulePage - 100
      quizQuestion = moduleData.quiz[qIdx] || null
    } else if (!isResults && !isLobby) {
      page = moduleData.pages[modulePage] ?? null
    }
  }

  // Atelier prise en charge (LPTSaleApp) : simulateur en autonomie sur le téléphone,
  // pas de contenu dédié à diffuser — ne jamais déclencher le rechargement ci-dessous.
  if (!loading && activeModule === 'atelier-pec') {
    return (
      <>
        <style>{STYLES}</style>
        <FullscreenButton />
        <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={200} height={76} style={{ objectFit: 'contain', animation: 'logoBreathe 3.5s ease-in-out infinite' }} />
          <h1 style={{ fontSize: 44, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.2, maxWidth: 820, margin: 0 }}>
            Atelier prise en charge
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Les formés s&apos;entraînent en autonomie sur leur téléphone</p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)', borderRadius: 40, padding: '14px 32px' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>📱 LPT Sale</span>
          </div>
        </div>
      </>
    )
  }

  // Module actif mais inconnu du JS courant → rechargement pour obtenir le dernier bundle
  // 'reveil-acquis' n'est pas dans MODULE_DATA (géré via faq_journee) — ne jamais return null
  if (!loading && activeModule && !moduleData && activeModule !== 'reveil-acquis') {
    if (typeof window !== 'undefined') {
      const key = `tv_reload_for_${activeModule}`
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
      }
    }
    // Après le reload, si toujours inconnu : fallback propre plutôt que page blanche
    return (
      <>
        <style>{STYLES}</style>
        <FullscreenButton />
        <div style={{ height: '100dvh', overflow: 'hidden', position: 'relative' }}>
          <WelcomeScreen />
        </div>
      </>
    )
  }

  // Jeu de questions entre formés — uniquement si le formateur l'a activé explicitement
  if (!loading && !activeModule && sharedState?.tv_screen === 'peer-quiz') {
    return (
      <>
        <style>{STYLES}</style>
        <FullscreenButton />
        <TVPeerQuizScreen sharedState={sharedState} />
        {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
        {sharedState?.tv_screen === 'module_questions' && sharedState?.mq_single_id && <TVQuestionOverlay sessionCode={sessionCode} singleId={sharedState.mq_single_id} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
        <TVAnnotationCanvas key="peer-quiz" />
      </>
    )
  }

  // Quiz réponses libres — le formateur pose une question, les formés répondent sur leur téléphone
  if (!loading && !activeModule && sharedState?.tv_screen === 'free-quiz') {
    return (
      <>
        <style>{STYLES}</style>
        <FullscreenButton />
        <TVFreeQuizScreen sharedState={sharedState} />
        {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
        {sharedState?.tv_screen === 'module_questions' && sharedState?.mq_single_id && <TVQuestionOverlay sessionCode={sessionCode} singleId={sharedState.mq_single_id} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
        <TVAnnotationCanvas key="free-quiz" />
      </>
    )
  }

  // Mini jeu actif — seulement si aucun module n'est en cours
  const mjPhase = sharedState?.minijeu_phase
  if (!loading && (!activeModule || activeModule === 'mini-jeux') && mjPhase && mjPhase !== 'idle') {
    if (mjPhase === 'rules') {
      return (
        <>
          <style>{STYLES}</style>
          <FullscreenButton />
          <TVMiniJeuRules />
          {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
          {sharedState?.tv_screen === 'module_questions' && sharedState?.mq_single_id && <TVQuestionOverlay sessionCode={sessionCode} singleId={sharedState.mq_single_id} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
        </>
      )
    }
    if (mjPhase === 'debrief') {
      return (
        <>
          <style>{STYLES}</style>
          <FullscreenButton />
          <TVMiniJeuDebrief sharedState={sharedState} />
          {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
          {sharedState?.tv_screen === 'module_questions' && sharedState?.mq_single_id && <TVQuestionOverlay sessionCode={sessionCode} singleId={sharedState.mq_single_id} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
        </>
      )
    }
    if (['game_ready', 'spinning', 'vendeur', 'client', 'revealed'].includes(mjPhase)) {
      return (
        <>
          <style>{STYLES}</style>
          <FullscreenButton />
          <TVMiniJeuGame
            mjPhase={mjPhase}
            vendeur={sharedState.minijeu_vendeur}
            client={sharedState.minijeu_client}
            theme={sharedState.minijeu_theme}
          />
          {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
          {sharedState?.tv_screen === 'module_questions' && sharedState?.mq_single_id && <TVQuestionOverlay sessionCode={sessionCode} singleId={sharedState.mq_single_id} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
        </>
      )
    }
    if (mjPhase === 'questions') {
      return (
        <>
          <style>{STYLES}</style>
          <FullscreenButton />
          <TVMiniJeuQuestions />
          {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
          {sharedState?.tv_screen === 'module_questions' && sharedState?.mq_single_id && <TVQuestionOverlay sessionCode={sessionCode} singleId={sharedState.mq_single_id} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
        </>
      )
    }
  }

  // tv_screen=module_questions — affichage anonyme des questions formés
  if (!loading && !activeModule && tvScreen === 'module_questions') {
    return (
      <>
        <style>{STYLES}</style>
        <FullscreenButton />
        <TVModuleQuestionsView
          sessionCode={sessionCode}
          moduleId={sharedState?.mq_module || activeModule || ''}
          moduleLabel={moduleData?.label || ''}
          singleId={sharedState?.mq_single_id || null}
        />
        {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
        <TVAnnotationCanvas key="module-questions" />
      </>
    )
  }

  // Pas de module actif (ou reveil-acquis qui n'est pas un vrai module) → FAQ, planning ou écran LPT
  if (!loading && (!activeModule || activeModule === 'reveil-acquis') && !isLobby) {
    return (
      <>
        <style>{STYLES}</style>
        <FullscreenButton />
        <div style={{ height: '100dvh', overflow: 'hidden', position: 'relative' }}>
          {faqJournee
            ? <TVFAQView journeeId={faqJournee} questions={faqQuestions} />
            : tvScreen === 'planning'
              ? <TVPlanningScreen planningDay={planningDay} />
              : <WelcomeScreen />
          }
        </div>
        {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
        {sharedState?.tv_screen === 'module_questions' && sharedState?.mq_single_id && <TVQuestionOverlay sessionCode={sessionCode} singleId={sharedState.mq_single_id} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
        <TVAnnotationCanvas key="no-module" />
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>

      <FullscreenButton />

      {/* Bouton d'activation du son — à cliquer une fois au démarrage de la TV */}
      {!audioUnlocked && (
        <div
          onClick={() => setAudioUnlocked(true)}
          style={{
            position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
            zIndex: 999, cursor: 'pointer',
            background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 24, padding: '10px 22px',
            display: 'flex', alignItems: 'center', gap: 8,
            color: '#fff', fontSize: 14, fontWeight: 600,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}
        >
          <span>🔊</span>
          <span>Activer le son</span>
        </div>
      )}

      <div style={{ height: '100dvh', overflow: 'hidden', position: 'relative', background: '#020d1f' }}>
        {loading ? (
          <WelcomeScreen />
        ) : isLobby ? (
          <TVModuleLobby moduleLabel={moduleData?.label || ''} moduleSub={moduleData?.sub || ''} />
        ) : isResults ? (
          finalEndedPhase
            ? <WelcomeScreen />
            : finalPodiumPhase
              ? <TVQuizFinalPodium quiz={moduleData?.quiz || []} sessionCode={sessionCode} moduleId={activeModule} />
              : rateRevealPhase
                ? <TVQuizRateReveal sessionCode={sessionCode} moduleId={activeModule} moduleLabel={moduleData?.label || ''} quiz={moduleData?.quiz || []} />
                : <TVGroupResults moduleId={activeModule} moduleLabel={moduleData?.label || ''} quiz={moduleData?.quiz || []} sessionCode={sessionCode} />
        ) : isQuiz && quizQuestion ? (
          quizInterstitialPhase
            ? <TVQuizPodium qIdx={modulePage - 100} onDone={() => setQuizInterstitialPhase(false)} sessionCode={sessionCode} skipSignal={sharedState?.quiz_podium_skip} moduleId={activeModule} />
            : sharedState?.quiz_show_correction && (quizQuestion?.type === 'text-open' || quizQuestion?.type === 'text-open-multi' || quizQuestion?.type === 'text-open-pairs')
              ? <TVOpenCorrection
                  question={quizQuestion}
                  qIdx={modulePage - 100}
                  total={moduleData.quiz.length}
                  moduleLabel={moduleData?.label || ''}
                  sessionCode={sessionCode}
                  moduleId={activeModule}
                  pageId={`${activeModule}:${modulePage - 100}`}
                />
              : sharedState?.quiz_show_correction && quizQuestion?.type !== 'text-open' && quizQuestion?.type !== 'text-open-multi' && quizQuestion?.type !== 'text-open-pairs'
                ? <TVQuizCorrection
                    question={quizQuestion}
                    qIdx={modulePage - 100}
                    total={moduleData.quiz.length}
                    moduleLabel={moduleData?.label || ''}
                    sessionCode={sessionCode}
                    moduleId={activeModule}
                    showOrdo={!!sharedState?.quiz_ordo_show}
                  />
                : <TVQuizQuestion
                    question={quizQuestion}
                    qIdx={modulePage - 100}
                    total={moduleData.quiz.length}
                    moduleLabel={moduleData?.label || ''}
                    sessionCode={sessionCode}
                    moduleId={activeModule}
                  />
        ) : isPdmAnimation ? (
          <TVPdmAnimation step={pdmAnimStep} />
        ) : page ? (
          <TVContentPage
            page={page}
            pageIndex={modulePage}
            total={moduleData.pages.length}
            moduleLabel={moduleData?.label || ''}
            troublesPhase={troublesPhase}
            opticienPlaying={opticienPlaying}
            troublesSelected={troublesSelected}
            troublesRevealed={troublesRevealed}
            ordoPlaying={ordoPlaying}
            ordoRevealStep={ordoRevealStep}
            ordoHeadlightDemo={ordoHeadlightDemo}
            ordoHeadlightCyl={ordoHeadlightCyl}
            ordoHeadlightAxe={ordoHeadlightAxe}
            saisieStage={saisieStage}
            audioUnlocked={audioUnlocked}
            freinsResponses={freinsResponses}
            revealFreins={revealFreins}
            prixResponses={prixResponses}
            revealPrix={revealPrix}
            ventesResponses={ventesResponses}
            revealVentes={revealVentes}
            revealLabo={revealLabo}
            promesseResponses={promesseResponses}
            revealPromesse={revealPromesse}
            progZoneQ={progZoneQ}
            progZoneResponses={progZoneResponses}
            progZoneShowCorrect={progZoneShowCorrect}
            progRetourResponses={progRetourResponses}
            progRetourRevealed={progRetourRevealed}
            progObjectionIdx={progObjectionIdx}
            progObjectionResponses={progObjectionResponses}
            progObjectionRevealed={progObjectionRevealed}
            progBestAnswer={progBestAnswer}
            progAnatomieReveal={progAnatomieReveal}
            trameStep={trameStep}
            offres11Step={offres11Step}
            offresClassiqueStep={offresClassiqueStep}
            offresPackPlanStep={offresPackPlanStep}
            offresProg11Revealed={offresProg11Revealed}
            modelePoint={modelePoint}
            mutuellesRevealed={mutuellesRevealed}
            inamiRevealed={inamiRevealed}
            partenaRevealed={partenaRevealed}
            rembfrRevealed={rembfrRevealed}
            rembfrDemarcheA={rembfrDemarcheA}
            rembfrDemarcheB={rembfrDemarcheB}
            rembfrSupreme={rembfrSupreme}
            parcoursRevealed={parcoursRevealed}
            tiersPayantRevealed={tiersPayantRevealed}
            tiersPayantAnswersRevealed={tiersPayantAnswersRevealed}
            lptsPecScenario={lptsPecScenario}
            brainstormRevealed={brainstormRevealed}
            monturesPrixRevealed={monturesPrixRevealed}
            monturesMateriauxResponses={monturesMateriauxResponses}
            revealMonturesMateriaux={revealMonturesMateriaux}
            sessionCode={sessionCode}
            onAmeliProClick={handleAmeliProClick}
          />
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {sharedState?.tv_qr_overlay && <TVQrOverlay roomCode={sessionCode} />}
      {sharedState?.tv_screen === 'module_questions' && sharedState?.mq_single_id && <TVQuestionOverlay sessionCode={sessionCode} singleId={sharedState.mq_single_id} />}
        {sharedState?.tv_kpassword_overlay && <TVKPasswordOverlay />}
      <TVAnnotationCanvas key={`module-${activeModule}`} />
    </>
  )
}
