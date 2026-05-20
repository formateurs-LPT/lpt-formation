'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { TYPES_VERRES_PAGES } from '@/lib/modulesData'

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
  @keyframes waitingPulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 1; }
  }
`

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

function AvatarCard() {
  return (
    <div style={{
      position: 'fixed', bottom: 0, right: 0, zIndex: 50,
      padding: '0 20px 20px 0',
    }}>
      <div style={{
        background: 'rgba(10,42,92,0.85)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,171,233,0.3)', borderRadius: 18,
        padding: '10px 16px 10px 10px',
        display: 'flex', alignItems: 'center', gap: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
          border: '2px solid #00abe9',
          boxShadow: '0 0 0 3px rgba(0,171,233,0.2)',
          animation: 'avatarPulse 2.5s ease-in-out infinite',
        }}>
          <Image src="/assets/avatar_kevin.png" alt="Kevin" width={64} height={64} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Kevin</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Formateur · LPT</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 5,
            background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.3)',
            borderRadius: 20, padding: '2px 8px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00abe9', animation: 'haloPulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#00abe9', letterSpacing: .5 }}>EN DIRECT</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentView({ page, pageIndex, total }) {
  const [entered, setEntered] = useState(false)

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
      {/* Particules */}
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
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>Module · Types de verres</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 8 }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontWeight: 400 }}>
            {page.sousTitre}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {page.points.map((pt, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateX(0)' : 'translateX(-16px)',
                transition: `all .45s ease ${0.08 + i * 0.09}s`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${page.color}18`, border: `1px solid ${page.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{pt.emoji}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{pt.texte}</div>
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

      <AvatarCard />
    </div>
  )
}

function WaitingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <Image src="/assets/logo-lpt.png" alt="LPT" width={200} height={76} style={{ objectFit: 'contain', marginBottom: 40 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00abe9', animation: 'waitingPulse 1.4s ease-in-out infinite' }} />
        <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: 0.5 }}>
          La formation va commencer…
        </span>
      </div>
    </div>
  )
}

export default function ParticipantModuleView() {
  const { activeModule, modulePage } = useModuleSync(1200)

  const page = activeModule === 'types-verres'
    ? (TYPES_VERRES_PAGES[modulePage] || TYPES_VERRES_PAGES[0])
    : null

  return (
    <>
      <style>{STYLES}</style>
      {page
        ? <ContentView page={page} pageIndex={modulePage} total={TYPES_VERRES_PAGES.length} />
        : <WaitingScreen />
      }
    </>
  )
}
