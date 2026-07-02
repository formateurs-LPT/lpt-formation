'use client'
import Image from 'next/image'
import { TRAINER_AVATARS, TRAINER_CANONICAL } from '@/lib/constants'

function trainerAvatarSrc(pName) {
  const rawKey = (pName || '').toLowerCase().split(/\s+/)[0]
  const key = TRAINER_CANONICAL[rawKey] || rawKey
  return TRAINER_AVATARS[key] || TRAINER_AVATARS.kevin
}

export default function Topbar({ pName, isTrainer, onlineCount, sessionCode, isRoomSession, onLogout, onTVMode }) {
  const code = (sessionCode || '').trim()
  const avatarSrc = isTrainer ? trainerAvatarSrc(pName) : '/assets/logo-lpt-blanc.png'

  return (
    <div className="topbar">
      <div className="tlogo">
        <Image src={avatarSrc} alt={pName || 'LPT'} width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} />
        LPT Formation
      </div>
      <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
        {isRoomSession ? (
          <>
            <span style={{
              fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6,
              color: '#0089ba', background: 'rgba(0,137,186,0.12)', border: '1px solid rgba(0,137,186,0.35)',
              borderRadius: 20, padding: '3px 10px',
            }}>
              Salle active
            </span>
            <span style={{ color: '#0089ba', fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2 }}>
              {code}
            </span>
          </>
        ) : (
          <span style={{ color: '#888' }} title="Mode legacy — ouvrez « Ma salle » pour une salle dédiée">
            Legacy · {code || '—'}
          </span>
        )}
      </div>
      <div className="tright">
        <div className="online">
          <div className="odot"></div>
          <span>{onlineCount} connecté(s)</span>
        </div>
        <div className={`brole ${isTrainer ? 'trainer' : 'participant'}`}>
          {isTrainer ? 'Formateur' : pName?.split(' ')[0]}
        </div>
        {isTrainer && onTVMode && (
          <button onClick={onTVMode} style={{
            background: 'rgba(0,171,233,0.08)',
            border: '1px solid rgba(0,171,233,0.3)',
            color: '#0089ba',
            fontSize: 12, fontWeight: 600,
            padding: '5px 12px',
            borderRadius: 20,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.18)'; e.currentTarget.style.borderColor = '#00abe9' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,171,233,0.3)' }}
          >
            📺 Diffusion
          </button>
        )}
        {isTrainer && (
          <button onClick={onLogout} style={{
            background: 'transparent',
            border: '1px solid #d1d5db',
            color: '#6b7280',
            fontSize: 12,
            padding: '5px 12px',
            borderRadius: 20,
            cursor: 'pointer'
          }}>
            Déconnexion
          </button>
        )}
      </div>
    </div>
  )
}
