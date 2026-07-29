'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbUpdate, getActiveSessionCode, setSharedState, fetchOpenAnswers } from '@/lib/supabase'
import { fetchTrainerQuizAnswers } from '@/lib/participantNames'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { NextPagePreview } from '@/lib/trainerPreview'
import TrainerAvatar from '@/components/TrainerAvatar'
import { TYPES_VERRES_PAGES as PAGES, TYPES_VERRES_QUIZ } from '@/lib/modulesData'
import { useIsMobile } from '@/lib/useIsMobile'

const OPTION_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#22c55e']
const BUBBLE_COLORS = ['#00abe9', '#4ade80', '#f59e0b', '#a78bfa', '#f472b6', '#34d399']

// ── Keyframes injectés une seule fois ─────────────────────────────
const STYLES = `
  @keyframes verreFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-16px) scale(1.04); }
  }
  @keyframes haloPulse {
    0%, 100% { opacity: 0.5; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.15); }
  }
  @keyframes avatarPulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(0,171,233,0.4); }
    50% { box-shadow: 0 4px 36px rgba(0,171,233,0.9); }
  }
  @keyframes particleFloat {
    from { transform: translateY(0px); opacity: 0.2; }
    to   { transform: translateY(-14px); opacity: 0.5; }
  }
`

// ── Verre animé (fond transparent) ───────────────────────────────
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

// ── Présentateur (avatar + bulle) ────────────────────────────────
function AvatarBubble({ script, pName }) {
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
      {/* Bulle script */}
      <div style={{
        background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)',
        borderRadius: '18px 18px 4px 18px', padding: '14px 18px',
        maxWidth: 280, boxShadow: '0 12px 48px rgba(0,0,0,0.25)',
        fontSize: 13, color: '#0f172a', lineHeight: 1.6, fontWeight: 500,
        marginBottom: 12,
      }}>
        {script}
      </div>

      {/* Carte présentateur */}
      <div style={{
        background: 'rgba(10,42,92,0.75)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,171,233,0.3)', borderRadius: 20,
        padding: '12px 18px 12px 12px',
        display: 'flex', alignItems: 'center', gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Avatar — futur slot HeyGen */}
        <div style={{
          width: 80, height: 80, borderRadius: 16, overflow: 'hidden', flexShrink: 0,
          border: '2.5px solid #00abe9',
          boxShadow: '0 0 0 4px rgba(0,171,233,0.2)',
          animation: 'avatarPulse 2.5s ease-in-out infinite',
        }}>
          <TrainerAvatar pName={pName} size={80} alt={cap(pName)} />
        </div>
        {/* Nom + rôle */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{cap(pName)}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>Formateur · LPT</div>
          {/* Badge LIVE futur */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6,
            background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.3)',
            borderRadius: 20, padding: '3px 10px',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00abe9', animation: 'haloPulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', letterSpacing: .5 }}>EN DIRECT</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Lens progressif annotée (PNG + labels) ───────────────────────
const PROG_ZONES_TRAINER = [
  { color: '#a78bfa', label: 'Vision de loin',       sub: 'Myopie · Hypermétropie · Astigmatisme' },
  { color: '#4ade80', label: 'Vision intermédiaire', sub: 'De 40 cm a 1,5 m'                      },
  { color: '#fbbf24', label: 'Vision de pres',        sub: 'Presbytie - moins de 40 cm'            },
]

function ProgressifAnnotatedLens({ entered, revealed = 0 }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      opacity: entered ? 1 : 0,
      transform: entered ? 'scale(1)' : 'scale(0.9)',
      transition: 'all .65s ease .1s',
    }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Image
          src="/assets/verre-prog.png"
          alt="Verre progressif"
          width={160}
          height={206}
          style={{ objectFit: 'contain', display: 'block' }}
          priority
        />
        {/* Dots sur le bord droit du verre, un par zone revelee */}
        {PROG_ZONES_TRAINER.map((z, i) => (
          <div key={i} style={{
            position: 'absolute', right: -6,
            top: `${22 + i * 29}%`,
            transform: 'translateY(-50%)',
            width: 8, height: 8, borderRadius: '50%',
            background: z.color,
            opacity: revealed > i ? 1 : 0,
            transition: 'opacity .4s ease',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {PROG_ZONES_TRAINER.map((z, i) => (
          <div key={i} style={{
            opacity: revealed > i ? 1 : 0,
            transform: revealed > i ? 'translateX(0)' : 'translateX(20px)',
            transition: 'opacity .4s ease, transform .4s ease',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: z.color }}>{z.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{z.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page verre progressif ─────────────────────────────────────────
function ContentPageProgressif({ page, pName, onPrev, onNext, onBack, isFirst, isLast, pageIndex, total, quizLaunched, onLaunchQuiz, nextPage, onTerminate }) {
  const isMobile = useIsMobile()
  const [entered, setEntered] = useState(false)
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    setEntered(false)
    setRevealed(0)
    setSharedState({ typesVerresZone: 0 })
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  const reveal = () => {
    if (revealed >= PROG_ZONES_TRAINER.length) return
    const next = revealed + 1
    setRevealed(next)
    setSharedState({ typesVerresZone: next })
  }

  const allRevealed = revealed >= PROG_ZONES_TRAINER.length

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Types de verres</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{
                height: 5, borderRadius: 3, transition: 'all .3s',
                width: i === pageIndex ? 22 : 5,
                background: i === pageIndex ? page.color : 'rgba(255,255,255,0.2)',
              }} />
            ))}
          </div>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.55)', padding: '6px 14px', borderRadius: 8,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Quitter</button>
        </div>
      </div>

      {/* Zone principale — verre gauche, controles droite */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 40, padding: '8px 48px 16px', alignItems: 'center',
      }}>
        {/* Gauche : verre avec zones qui apparaissent */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ProgressifAnnotatedLens entered={entered} revealed={revealed} />
        </div>

        {/* Droite : controles formateur */}
        <div style={{
          opacity: entered ? 1 : 0, transform: entered ? 'translateX(0)' : 'translateX(28px)',
          transition: 'all .55s ease',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 4 }}>
              Verre <span style={{ color: page.color }}>progressif</span>
            </h2>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Pulsar Next · 2 options de fabrication</div>
          </div>

          {/* Checklist zones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {PROG_ZONES_TRAINER.map((z, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                opacity: revealed > i ? 1 : 0.25,
                transition: 'opacity .4s ease',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  background: revealed > i ? z.color : 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#000',
                  transition: 'background .4s ease',
                }}>{revealed > i ? '✓' : i + 1}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: revealed > i ? z.color : 'rgba(255,255,255,0.4)' }}>{z.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{z.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Bouton Révéler */}
          {!allRevealed ? (
            <button onClick={reveal} style={{
              background: `linear-gradient(135deg, ${page.color}, #9f67fa)`,
              border: 'none', color: '#fff',
              padding: '13px 28px', borderRadius: 12, fontSize: 15, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(124,58,237,0.45)',
              alignSelf: 'flex-start',
            }}>
              Révéler → ({revealed}/{PROG_ZONES_TRAINER.length})
            </button>
          ) : (
            <div style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>
              Toutes les zones révélées
            </div>
          )}

          {/* Délais de fabrication */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Délais de fabrication</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#4ade80', marginBottom: 3 }}>24 / 48h</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>Verres origine France<br />Fabriqués à Paris</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '10px 14px' }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24', marginBottom: 3 }}>9 jours</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>Verres Rodenstock<br />Fabriqués en Allemagne</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: isMobile ? '0 14px calc(env(safe-area-inset-bottom,0px) + 20px)' : '0 340px 0 48px', flexShrink: 0 }}>
        {!isMobile && <NextPagePreview nextPage={nextPage} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: isMobile ? 0 : 28, gap: isMobile ? 10 : 0 }}>
          <button onClick={onPrev} disabled={isFirst} style={{
            background: isFirst ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
            padding: isMobile ? '16px 0' : '12px 24px', borderRadius: 12, fontSize: isMobile ? 16 : 14, fontWeight: 600,
            cursor: isFirst ? 'default' : 'pointer', fontFamily: 'inherit', flex: isMobile ? 1 : undefined,
          }}>← Précédent</button>

          {isLast ? (
            quizLaunched ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: isMobile ? 2 : undefined }}>
                <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>Quiz envoyé</span>
                <button onClick={onTerminate} style={{
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none',
                  color: '#fff', padding: isMobile ? '16px 0' : '12px 24px', borderRadius: 12,
                  fontSize: isMobile ? 16 : 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 4px 16px rgba(34,197,94,0.4)', flex: isMobile ? 1 : undefined,
                }}>Terminer</button>
              </div>
            ) : (
              <button onClick={onLaunchQuiz} style={{
                background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
                border: 'none', color: '#fff',
                padding: isMobile ? '16px 0' : '12px 32px', borderRadius: 12, fontSize: isMobile ? 16 : 15, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 6px 24px rgba(124,58,237,0.5)',
                fontFamily: 'inherit', flex: isMobile ? 2 : undefined, textAlign: 'center',
              }}>Lancer le quiz</button>
            )
          ) : (
            <button onClick={onNext} style={{
              background: 'linear-gradient(135deg, #0089ba, #00abe9)',
              border: 'none', color: '#fff',
              padding: isMobile ? '16px 0' : '12px 32px', borderRadius: 12, fontSize: isMobile ? 16 : 15, fontWeight: 700,
              cursor: 'pointer', boxShadow: '0 6px 24px rgba(0,171,233,0.5)',
              fontFamily: 'inherit', flex: isMobile ? 2 : undefined, textAlign: 'center',
            }}>Suivant →</button>
          )}
        </div>
      </div>

      <AvatarBubble script={page.avatarScript} pName={pName} />
    </div>
  )
}

// ── Page de contenu ───────────────────────────────────────────────
function ContentPage({ page, pName, onPrev, onNext, onBack, isFirst, isLast, pageIndex, total, quizLaunched, onLaunchQuiz, nextPage, onTerminate }) {
  const [entered, setEntered] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 60)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative',
    }}>
      {/* Particules déco — pointer-events none, ne bloque rien */}
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

      {/* Topbar du module */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 32px', position: 'relative', zIndex: 10, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · Types de verres</span>
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
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10,
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .2s', letterSpacing: .3,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = 'rgba(255,80,80,0.35)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          >✕ Quitter</button>
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

        {/* Verre droite */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: entered ? 1 : 0, transform: entered ? 'scale(1)' : 'scale(0.88)',
          transition: 'all .65s ease .1s',
        }}>
          <VerreAnime color={page.color} />
        </div>
      </div>

      {/* Boutons navigation */}
      <div style={{ padding: isMobile ? '0 14px calc(env(safe-area-inset-bottom,0px) + 20px)' : '0 340px 0 48px', position: 'relative', zIndex: 20, flexShrink: 0 }}>
        {!isMobile && <NextPagePreview nextPage={nextPage} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: isMobile ? 0 : 28, gap: isMobile ? 10 : 0 }}>
        <button
          onClick={onPrev}
          style={{
            background: isFirst ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
            padding: isMobile ? '16px 0' : '12px 24px', borderRadius: 12, fontSize: isMobile ? 16 : 14, fontWeight: 600,
            cursor: isFirst ? 'default' : 'pointer', transition: 'all .2s',
            fontFamily: 'inherit', flex: isMobile ? 1 : undefined,
          }}
          disabled={isFirst}
        >← Précédent</button>

        {isLast ? (
          quizLaunched ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: isMobile ? 2 : undefined }}>
              <span style={{ color: '#4ade80', fontWeight: 700, fontSize: 13 }}>✓ Quiz envoyé</span>
              <button onClick={onTerminate} style={{
                background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none',
                color: '#fff', padding: isMobile ? '16px 0' : '12px 24px', borderRadius: 12,
                fontSize: isMobile ? 16 : 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 4px 16px rgba(34,197,94,0.4)', flex: isMobile ? 1 : undefined,
              }}>Terminer</button>
            </div>
          ) : (
            <button onClick={onLaunchQuiz} style={{
              background: 'linear-gradient(135deg, #7c3aed, #9f67fa)',
              border: 'none', color: '#fff',
              padding: isMobile ? '16px 0' : '12px 32px', borderRadius: 12, fontSize: isMobile ? 16 : 15, fontWeight: 700,
              cursor: 'pointer', transition: 'all .2s',
              boxShadow: '0 6px 24px rgba(124,58,237,0.5)',
              fontFamily: 'inherit', flex: isMobile ? 2 : undefined, textAlign: 'center',
            }}>🧠 Lancer le quiz →</button>
          )
        ) : (
          <button onClick={onNext} style={{
            background: 'linear-gradient(135deg, #0089ba, #00abe9)',
            border: 'none', color: '#fff',
            padding: isMobile ? '16px 0' : '12px 32px', borderRadius: 12, fontSize: isMobile ? 16 : 15, fontWeight: 700,
            cursor: 'pointer', transition: 'all .2s',
            boxShadow: '0 6px 24px rgba(0,171,233,0.5)',
            fontFamily: 'inherit', flex: isMobile ? 2 : undefined, textAlign: 'center',
          }}>Suivant →</button>
        )}
        </div>
      </div>

      <AvatarBubble script={page.avatarScript} pName={pName} />
    </div>
  )
}

// ── Quiz Controller (vue formateur) ──────────────────────────────
function QuizController({ quizQ, onNext, onEnd, onBack }) {
  const [openAnswers, setOpenAnswers] = useState([])
  const [validating, setValidating] = useState({})
  const [validated, setValidated] = useState({})
  const autoValidatedRef = useRef(new Set())

  const q = TYPES_VERRES_QUIZ[quizQ]
  const isLast = quizQ >= TYPES_VERRES_QUIZ.length - 1
  const pageId = `types-verres:${quizQ}`

  useEffect(() => {
    setOpenAnswers([])
    setValidating({})
    setValidated({})
    autoValidatedRef.current = new Set()
    const poll = async () => {
      const rows = await fetchOpenAnswers(getActiveSessionCode(), pageId)
      setOpenAnswers(rows || [])
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [quizQ, pageId])

  // Auto-validation
  useEffect(() => {
    const kws    = q?.autoCorrect
    const kwsAll = q?.autoCorrectAll
    const kwsNot = q?.autoCorrectNot
    if (!kws?.length && !kwsAll?.length) return
    openAnswers.forEach(row => {
      const name = row.participant_name
      if (autoValidatedRef.current.has(name)) return
      const text = (row.answer || '').trim().toLowerCase()
      const matchOr  = kws?.length    && kws.some(kw  => text.includes(kw.toLowerCase()))
      const matchAnd = kwsAll?.length && kwsAll.every(kw => text.includes(kw.toLowerCase()))
      const blocked  = kwsNot?.length && kwsNot.some(kw => text.includes(kw.toLowerCase()))
      if ((matchOr || matchAnd) && !blocked) {
        autoValidatedRef.current.add(name)
        saveModuleQuizAnswer({ sessionCode: getActiveSessionCode(), moduleId: 'types-verres', questionIdx: quizQ, collaborateur: name, answerIdx: 0, isCorrect: true })
          .then(() => setValidated(v => ({ ...v, [name]: 'correct' })))
          .catch(() => { autoValidatedRef.current.delete(name) })
      }
    })
  }, [openAnswers, q, quizQ])

  const handleValidate = async (row, isCorrect) => {
    if (validating[row.participant_name]) return
    setValidating(v => ({ ...v, [row.participant_name]: true }))
    try {
      await saveModuleQuizAnswer({
        sessionCode: getActiveSessionCode(),
        moduleId: 'types-verres',
        questionIdx: quizQ,
        collaborateur: row.participant_name,
        answerIdx: 0,
        isCorrect,
      })
      setValidated(v => ({ ...v, [row.participant_name]: isCorrect ? 'correct' : 'wrong' }))
    } catch { /* best-effort */ } finally {
      setValidating(v => ({ ...v, [row.participant_name]: false }))
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', padding: '24px clamp(14px, 4vw, 48px) 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Quiz · Types de verres — Vue formateur</span>
        </div>
        <button onClick={onBack} style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)', color: '#ff6b6b', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Terminer</button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.2)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 24px', fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase' }}>
          Question {quizQ + 1} / {TYPES_VERRES_QUIZ.length}
        </div>
      </div>

      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, maxWidth: 800, margin: '0 auto 14px' }}>
        {q.question}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ display: 'inline-block', background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)', borderRadius: 12, padding: '8px 22px', fontSize: 12, color: 'rgba(0,171,233,0.7)', fontStyle: 'italic' }}>
          Réponse attendue : {q.hint}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820, margin: '0 auto', maxHeight: '45vh', overflowY: 'auto', paddingRight: 4 }}>
        {openAnswers.length === 0 ? (
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
            En attente des réponses des participants…
          </div>
        ) : openAnswers.map((row, i) => {
          const status = validated[row.participant_name]
          const isValidating = validating[row.participant_name]
          return (
            <div key={row.participant_name} style={{
              background: status === 'correct' ? 'rgba(34,197,94,0.08)' : status === 'wrong' ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${status === 'correct' ? 'rgba(34,197,94,0.3)' : status === 'wrong' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}22`, border: `2px solid ${BUBBLE_COLORS[i % BUBBLE_COLORS.length]}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length] }}>
                {row.participant_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BUBBLE_COLORS[i % BUBBLE_COLORS.length], marginBottom: 3 }}>{row.participant_name}</div>
                <div style={{ fontSize: 15, color: '#fff', lineHeight: 1.4 }}>{row.answer}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                {status ? (
                  <div style={{ fontSize: 22, fontWeight: 800, color: status === 'correct' ? '#4ade80' : '#f87171' }}>{status === 'correct' ? '✓' : '✗'}</div>
                ) : (
                  <>
                    <button onClick={() => handleValidate(row, true)} disabled={!!isValidating} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'rgba(34,197,94,0.18)', color: '#4ade80', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.5 : 1, fontFamily: 'inherit' }}>✓</button>
                    <button onClick={() => handleValidate(row, false)} disabled={!!isValidating} style={{ width: 38, height: 38, borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.18)', color: '#f87171', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isValidating ? 0.5 : 1, fontFamily: 'inherit' }}>✗</button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {openAnswers.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
          {openAnswers.length} réponse{openAnswers.length > 1 ? 's' : ''} reçue{openAnswers.length > 1 ? 's' : ''}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 28 }}>
        {isLast ? (
          <button onClick={onEnd} style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', border: 'none', color: '#fff', padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(34,197,94,0.4)' }}>✓ Voir les résultats</button>
        ) : (
          <button onClick={onNext} style={{ background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none', color: '#fff', padding: '14px 40px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 24px rgba(0,171,233,0.45)' }}>Question suivante →</button>
        )}
      </div>
    </div>
  )
}

// ── Lobby ─────────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
    }}>
      <button onClick={onBack} style={{
        position: 'absolute', top: 24, left: 24,
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10,
        fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
      }}>← Retour</button>

      <div style={{ textAlign: 'center', maxWidth: 500, padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={180} height={68} style={{ objectFit: 'contain' }} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          Module de formation
        </div>
        <h1 style={{ fontSize: 34, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Le Verre Unifocal</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.6 }}>
          La correction simple, efficace, accessible<br />
          Arguments de vente &amp; positionnement dans l&apos;offre LPT
        </p>
        <button onClick={onStart} style={{
          background: 'linear-gradient(135deg, #0089ba, #00abe9)',
          border: 'none', color: '#fff', padding: '16px 48px',
          borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,171,233,0.45)', fontFamily: 'inherit',
        }}>▶ Lancer le module</button>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>1 page · ~4 minutes</p>
      </div>
    </div>
  )
}

// ── Group Results View (vue formateur après quiz) ─────────────────
function GroupResultsView({ onTerminate }) {
  const [answers, setAnswers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnswers = async () => {
      const rows = await fetchTrainerQuizAnswers(
        `session_code=eq.${getActiveSessionCode()}&module_id=eq.types-verres`
      )
      setAnswers(rows || [])
      setLoading(false)
    }
    fetchAnswers()
  }, [])

  const participantNames = [...new Set((answers || []).map(r => r.collaborateur))]
  const participantCount = participantNames.length

  const questionStats = TYPES_VERRES_QUIZ.map((q, idx) => {
    const qAnswers = answers.filter(r => r.question_idx === idx)
    const wrongCount = qAnswers.filter(r => !r.is_correct).length
    const total = qAnswers.length
    const pctWrong = total > 0 ? Math.round((wrongCount / total) * 100) : 0
    return { idx, question: q.question, pctWrong, total }
  }).sort((a, b) => b.pctWrong - a.pctWrong)

  const getPriority = (pct) => {
    if (pct >= 50) return { icon: '🔴', label: 'À retravailler en priorité', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' }
    if (pct >= 25) return { icon: '🟡', label: 'À consolider', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' }
    return { icon: '🟢', label: 'Bien maîtrisé', color: '#22c55e', bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)' }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', padding: '24px 40px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Bilan du quiz · Types de verres</span>
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginRight: 6 }}>{participantCount}</span>
          participant{participantCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
          borderRadius: 20, padding: '6px 24px',
          fontSize: 12, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5, textTransform: 'uppercase',
          marginBottom: 12,
        }}>Résultats du groupe</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Points à retravailler</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Trié par taux d'erreur décroissant</p>
      </div>

      {/* Question cards */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760, alignSelf: 'center', width: '100%' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 15, padding: 40 }}>Chargement…</div>
        ) : questionStats.map((stat) => {
          const priority = getPriority(stat.pctWrong)
          return (
            <div key={stat.idx} style={{
              background: priority.bg,
              border: `1px solid ${priority.border}`,
              borderRadius: 18, padding: '18px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ flex: 1, marginRight: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{priority.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: priority.color, textTransform: 'uppercase', letterSpacing: 1 }}>{priority.label}</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.4 }}>
                    Q{stat.idx + 1} — {stat.question}
                  </div>
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: priority.color, lineHeight: 1, flexShrink: 0 }}>
                  {stat.pctWrong}%
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>d'erreurs</div>
                </div>
              </div>
              <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${stat.pctWrong}%`,
                  background: priority.color,
                  transition: 'width .8s ease',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer — terminate button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
        <button onClick={onTerminate} style={{
          background: 'linear-gradient(135deg, #dc2626, #ef4444)',
          border: 'none', color: '#fff', padding: '14px 42px', borderRadius: 14,
          fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 24px rgba(220,38,38,0.4)',
        }}>✓ Terminer le module</button>
      </div>
    </div>
  )
}

// ── Export principal ───────────────────────────────────────────────
export default function ModuleTypesVerres({ pName, onBack, onTerminate }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const [quizLaunched, setQuizLaunched] = useState(false)
  const [quizQ, setQuizQ] = useState(0)
  const [showGroupResults, setShowGroupResults] = useState(false)

  const handleLaunchQuiz = async () => {
    await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false })
    await sbUpdate('sessions', { module_page: 100 }, 'code=eq.' + getActiveSessionCode())
    setQuizQ(0)
    setQuizLaunched(true)
  }

  const handleNextQuestion = async () => {
    const next = quizQ + 1
    await setSharedState({ quiz_show_correction: false, quiz_ordo_show: false }).catch(() => {})
    await sbUpdate('sessions', { module_page: 100 + next }, 'code=eq.' + getActiveSessionCode())
    setQuizQ(next)
  }

  const handleEndQuiz = async () => {
    try { await sbUpdate('sessions', { active_module: 'types-verres', module_page: 200 }, 'code=eq.' + getActiveSessionCode()) } catch { /* best-effort */ }
    setShowGroupResults(true)
  }

  const handleTerminateModule = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()) } catch { /* best-effort */ }
    ;(onTerminate ?? onBack)()
  }

  // Write to Supabase when module starts
  useEffect(() => {
    if (started) {
      sbUpdate('sessions', { active_module: 'types-verres', module_page: 0 }, 'code=eq.' + getActiveSessionCode()).catch(() => {})
    }
  }, [started])

  // Write to Supabase when page changes
  useEffect(() => {
    if (started) {
      sbUpdate('sessions', { module_page: pageIndex }, 'code=eq.' + getActiveSessionCode()).catch(() => {})
    }
  }, [pageIndex, started])

  const handleBack = async () => {
    try { await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + getActiveSessionCode()) } catch { /* best-effort */ }
    onBack()
  }

  if (!started) return <Lobby onStart={() => setStarted(true)} onBack={handleBack} />

  if (showGroupResults) {
    return (
      <>
        <style>{STYLES}</style>
        <GroupResultsView onTerminate={handleTerminateModule} />
      </>
    )
  }

  if (quizLaunched) {
    return (
      <>
        <style>{STYLES}</style>
        <QuizController
          quizQ={quizQ}
          onNext={handleNextQuestion}
          onEnd={handleEndQuiz}
          onBack={handleEndQuiz}
        />
      </>
    )
  }

  const currentPage = PAGES[pageIndex]
  const PageComponent = currentPage?.type === 'progressif' ? ContentPageProgressif : ContentPage

  return (
    <>
      <style>{STYLES}</style>
      <PageComponent
        page={currentPage}
        pName={pName}
        pageIndex={pageIndex}
        total={PAGES.length}
        isFirst={pageIndex === 0}
        isLast={pageIndex === PAGES.length - 1}
        onPrev={() => setPageIndex(i => Math.max(0, i - 1))}
        onNext={() => setPageIndex(i => i + 1)}
        onBack={handleBack}
        quizLaunched={quizLaunched}
        onLaunchQuiz={handleLaunchQuiz}
        nextPage={PAGES[pageIndex + 1] ?? null}
        onTerminate={handleTerminateModule}
      />
    </>
  )
}
