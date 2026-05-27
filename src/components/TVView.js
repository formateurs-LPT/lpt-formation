'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { MODULE_DATA } from '@/lib/modulesData'
import { sbSelect, SESSION_CODE } from '@/lib/supabase'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']

// ── Keyframes ─────────────────────────────────────────────────────
const STYLES = `
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
`

// ── Verre animé ───────────────────────────────────────────────────
function VerreAnime({ color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 520, height: 520, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}35 0%, transparent 70%)`,
        animation: 'haloPulse 3.5s ease-in-out infinite',
      }} />
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

// ── TV Quiz Question ──────────────────────────────────────────────
function TVQuizQuestion({ question, qIdx, total, moduleLabel }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 80px', position: 'relative',
    }}>
      {/* Header */}
      <div style={{ position: 'absolute', top: 24, left: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
        gridTemplateColumns: question.options.length === 2 ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24, width: '100%', maxWidth: 1000,
      }}>
        {question.options.map((opt, i) => (
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
      <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <Image
          src={src}
          alt="Module illustration"
          width={480}
          height={480}
          style={{
            objectFit: 'contain',
            borderRadius: 24,
            boxShadow: `0 0 64px ${color}60, 0 24px 48px rgba(0,0,0,0.4)`,
          }}
          priority
        />
      </div>
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

// ── TV Troubles List (type = troubles-list) ───────────────────────
function TVTroublesList({ page, pageIndex, total, moduleLabel }) {
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    setVisibleCount(0)
    const timers = page.troubles.map((_, i) =>
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
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
          {page.troubles.map((t, i) => (
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

// ── TV Content Page (no controls, no avatar) ──────────────────────
function TVContentPage({ page, pageIndex, total, moduleLabel }) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  if (page.type === 'troubles-list') {
    return <TVTroublesList page={page} pageIndex={pageIndex} total={total} moduleLabel={moduleLabel} />
  }

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
          <Image src="/assets/logo-lpt.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
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
            {page.points.map((pt, i) => (
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

// ── Waiting Screen ────────────────────────────────────────────────
const APP_URL = 'https://lpt-formation.vercel.app?join=1'
const QR_URL  = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=ffffff&bgcolor=0a2a5c&data=${encodeURIComponent(APP_URL)}`

function WaitingScreen() {
  const [muted, setMuted] = useState(false)
  const audioRef = useRef(null)

  const toggleMute = () => {
    if (audioRef.current) audioRef.current.muted = !muted
    setMuted(m => !m)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 0,
    }}>
      <Image src="/assets/logo-lpt.png" alt="LPT" width={300} height={114}
        style={{ objectFit: 'contain', marginBottom: 52, animation: 'logoBreathe 3.5s ease-in-out infinite' }} />

      {/* Audio ambiance */}
      <audio ref={audioRef} src="/audio/waiting.mp3" autoPlay loop muted={muted} style={{ display: 'none' }} />

      {/* Bouton mute discret en bas à droite */}
      <button onClick={toggleMute} style={{
        position: 'fixed', bottom: 24, right: 24,
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.4)', borderRadius: 12,
        padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'all .2s',
      }}>
        {muted ? '🔇 Son coupé' : '🔊 Son actif'}
      </button>

      {/* QR + instructions */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 56,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 28, padding: '36px 48px',
      }}>
        {/* QR Code */}
        <div style={{
          background: '#0a2a5c', borderRadius: 18, padding: 12,
          border: '2px solid rgba(0,171,233,0.35)',
          boxShadow: '0 0 40px rgba(0,171,233,0.15)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={QR_URL} alt="QR Code" width={220} height={220}
            style={{ display: 'block', borderRadius: 8 }} />
        </div>

        {/* Texte */}
        <div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#00abe9',
            textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14,
          }}>Rejoindre la formation</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12 }}>
            Scannez ce QR code<br />avec votre téléphone
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 28, lineHeight: 1.6 }}>
            Connectez-vous avec votre prénom et<br />le code de session communiqué<br />par votre formateur.
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

// ── TV Group Results ──────────────────────────────────────────────
function TVGroupResults({ moduleId, moduleLabel, quiz }) {
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
    const fetchAnswers = async () => {
      const rows = await sbSelect('quiz_answers', `session_code=eq.${SESSION_CODE}`)
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
    const interval = setInterval(async () => {
      const rows = await sbSelect('quiz_answers', `session_code=eq.${SESSION_CODE}`)
      setAnswers(rows || [])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

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
      minHeight: '100vh',
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
        <Image src="/assets/logo-lpt.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
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

// ── TV View ───────────────────────────────────────────────────────
export default function TVView() {
  const { activeModule, modulePage, loading } = useModuleSync(1500)

  const moduleData = MODULE_DATA[activeModule] || null
  const isResults = !!moduleData && modulePage === 200
  const isQuiz = !!moduleData && modulePage >= 100 && modulePage < 200

  let page = null
  let quizQuestion = null
  if (moduleData) {
    if (isQuiz) {
      const qIdx = modulePage - 100
      quizQuestion = moduleData.quiz[qIdx] || null
    } else if (!isResults) {
      page = moduleData.pages[modulePage] || moduleData.pages[0]
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      {loading ? (
        <WaitingScreen />
      ) : isResults ? (
        <TVGroupResults moduleId={activeModule} moduleLabel={moduleData?.label || ''} quiz={moduleData?.quiz || []} />
      ) : isQuiz && quizQuestion ? (
        <TVQuizQuestion
          question={quizQuestion}
          qIdx={modulePage - 100}
          total={moduleData.quiz.length}
          moduleLabel={moduleData?.label || ''}
        />
      ) : page ? (
        <TVContentPage
          page={page}
          pageIndex={modulePage}
          total={moduleData.pages.length}
          moduleLabel={moduleData?.label || ''}
        />
      ) : (
        <WaitingScreen />
      )}
    </>
  )
}
