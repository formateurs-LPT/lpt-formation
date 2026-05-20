'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { TYPES_VERRES_PAGES } from '@/lib/modulesData'

const STYLES = `
  @keyframes lensFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-12px) scale(1.03); }
  }
  @keyframes lensHalo {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.85; transform: scale(1.18); }
  }
  @keyframes avatarGlow {
    0%, 100% { box-shadow: 0 2px 16px rgba(0,171,233,0.35); }
    50% { box-shadow: 0 2px 28px rgba(0,171,233,0.8); }
  }
  @keyframes titleFadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`

function AnimatedLens({ color, size = 300 }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <div style={{
        position: 'absolute',
        width: size * 1.3, height: size * 1.3,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        animation: 'lensHalo 3.5s ease-in-out infinite',
      }} />
      <div style={{ animation: 'lensFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <Image
          src="/assets/verre-unifocal-2.png"
          alt="Verre optique"
          width={size}
          height={size}
          style={{
            objectFit: 'contain',
            filter: `drop-shadow(0 0 40px ${color}80) drop-shadow(0 16px 32px rgba(0,0,0,0.4))`,
          }}
          priority
        />
      </div>
    </div>
  )
}

function TrainerAvatarCard() {
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 16, zIndex: 50,
      background: 'rgba(10,42,92,0.8)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(0,171,233,0.3)', borderRadius: 16,
      padding: '10px 14px 10px 10px',
      display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
        border: '2px solid #00abe9',
        animation: 'avatarGlow 2.5s ease-in-out infinite',
      }}>
        <Image src="/assets/avatar_kevin.png" alt="Formateur" width={52} height={52} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Kevin</div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Formateur · LPT</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00abe9', animation: 'lensHalo 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: '#00abe9', letterSpacing: 0.5 }}>EN DIRECT</span>
        </div>
      </div>
    </div>
  )
}

function NoModuleScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '0 24px',
    }}>
      <Image src="/assets/logo-lpt.png" alt="LPT" width={160} height={60} style={{ objectFit: 'contain', marginBottom: 32 }} />
      <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', fontWeight: 400, textAlign: 'center', lineHeight: 1.6 }}>
        La formation va commencer…
      </p>
    </div>
  )
}

export default function ParticipantModuleView() {
  const { activeModule, modulePage, loading } = useModuleSync(1500)
  const [titleKey, setTitleKey] = useState(0)

  let page = null
  if (activeModule === 'types-verres') {
    page = TYPES_VERRES_PAGES[modulePage] || TYPES_VERRES_PAGES[0]
  }

  // Re-trigger title animation when page changes
  useEffect(() => {
    setTitleKey(k => k + 1)
  }, [modulePage, activeModule])

  if (loading || !page) {
    return (
      <>
        <style>{STYLES}</style>
        <NoModuleScreen />
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{
        minHeight: '100vh',
        background: `linear-gradient(160deg, #03112a 0%, #0a2a5c 60%, ${page.color}18 100%)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', position: 'relative', overflow: 'hidden',
        padding: '80px 24px 100px',
      }}>
        {/* Title at top */}
        <div key={titleKey} style={{
          position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center',
          animation: 'titleFadeIn 0.5s ease forwards',
          zIndex: 10,
        }}>
          <div style={{
            display: 'inline-block', background: `${page.color}20`,
            border: `1px solid ${page.color}40`, borderRadius: 20,
            padding: '4px 16px', fontSize: 11, fontWeight: 700,
            color: page.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
          }}>
            Types de verres
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            {page.titre}
          </div>
        </div>

        {/* Animated lens centered */}
        <AnimatedLens color={page.color} size={300} />

        {/* Trainer avatar fixed bottom-right */}
        <TrainerAvatarCard />
      </div>
    </>
  )
}
