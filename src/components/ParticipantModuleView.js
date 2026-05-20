'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useModuleSync } from '@/lib/useModuleSync'
import { TYPES_VERRES_PAGES } from '@/lib/modulesData'

const STYLES = `
  @keyframes verreFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-18px) scale(1.05); }
  }
  @keyframes haloBreath {
    0%, 100% { opacity: 0.3; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.2); }
  }
  @keyframes avatarGlow {
    0%, 100% { box-shadow: 0 0 0 3px rgba(0,171,233,0.2), 0 4px 20px rgba(0,171,233,0.3); }
    50% { box-shadow: 0 0 0 4px rgba(0,171,233,0.4), 0 4px 32px rgba(0,171,233,0.6); }
  }
  @keyframes waitDot {
    0%, 100% { opacity: 0.2; }
    50% { opacity: 1; }
  }
  @keyframes fadeSlideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`

function WaitingScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
    }}>
      <Image src="/assets/logo-lpt.png" alt="LPT" width={160} height={60}
        style={{ objectFit: 'contain', marginBottom: 48 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', background: '#00abe9',
          animation: 'waitDot 1.4s ease-in-out infinite',
        }} />
        <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
          La formation va commencer…
        </span>
      </div>
    </div>
  )
}

function ModuleScreen({ page, pageIndex, total }) {
  const [key, setKey] = useState(0)
  useEffect(() => { setKey(k => k + 1) }, [page.id])

  return (
    <div style={{
      minHeight: '100dvh',
      background: `linear-gradient(160deg, #03112a 0%, #0a2a5c 65%, ${page.color}15 100%)`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '100px 24px 120px',
    }}>

      {/* Indicateur page en haut */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '20px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Image src="/assets/logo-lpt.png" alt="LPT" width={72} height={28}
          style={{ objectFit: 'contain', opacity: 0.7 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {Array(total).fill(0).map((_, i) => (
            <div key={i} style={{
              height: 4, borderRadius: 2,
              width: i === pageIndex ? 20 : 4,
              background: i === pageIndex ? page.color : 'rgba(255,255,255,0.2)',
              transition: 'all .4s ease',
            }} />
          ))}
        </div>
      </div>

      {/* Titre animé */}
      <div key={key} style={{
        textAlign: 'center', marginBottom: 40,
        animation: 'fadeSlideUp .5s ease forwards',
      }}>
        <div style={{
          display: 'inline-block',
          background: `${page.color}20`, border: `1px solid ${page.color}40`,
          borderRadius: 20, padding: '3px 14px',
          fontSize: 10, fontWeight: 700, color: page.color,
          textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
        }}>Types de verres</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          {page.titre}
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>
          {page.sousTitre}
        </div>
      </div>

      {/* Verre qui respire — centré */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Halo */}
        <div style={{
          position: 'absolute',
          width: 320, height: 320, borderRadius: '50%',
          background: `radial-gradient(circle, ${page.color}30 0%, transparent 70%)`,
          animation: 'haloBreath 3.5s ease-in-out infinite',
        }} />
        {/* Image verre */}
        <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
          <Image
            src="/assets/verre-unifocal-2.png"
            alt="Verre"
            width={260}
            height={260}
            style={{
              objectFit: 'contain',
              filter: `drop-shadow(0 0 40px ${page.color}80) drop-shadow(0 16px 32px rgba(0,0,0,0.4))`,
            }}
            priority
          />
        </div>
      </div>

      {/* Avatar formateur — bas de l'écran */}
      <div style={{
        position: 'absolute', bottom: 24, right: 20,
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(10,42,92,0.85)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0,171,233,0.25)', borderRadius: 16,
        padding: '8px 14px 8px 8px',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
          animation: 'avatarGlow 2.5s ease-in-out infinite',
        }}>
          <Image src="/assets/avatar_kevin.png" alt="Kevin"
            width={44} height={44} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Kevin</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>Formateur · LPT</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00abe9', animation: 'haloBreath 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: 8, fontWeight: 700, color: '#00abe9', letterSpacing: .5 }}>EN DIRECT</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ParticipantModuleView({ forcedModule, forcedPage }) {
  const sync = useModuleSync(forcedModule != null ? 99999 : 1200)
  const activeModule = forcedModule ?? sync.activeModule
  const modulePage   = forcedPage  ?? sync.modulePage

  const page = activeModule === 'types-verres'
    ? (TYPES_VERRES_PAGES[modulePage] || TYPES_VERRES_PAGES[0])
    : null

  return (
    <>
      <style>{STYLES}</style>
      {page
        ? <ModuleScreen page={page} pageIndex={modulePage} total={TYPES_VERRES_PAGES.length} />
        : <WaitingScreen />
      }
    </>
  )
}
