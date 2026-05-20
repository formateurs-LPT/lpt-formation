'use client'
import Image from 'next/image'

export default function Topbar({ pName, isTrainer, onlineCount, sessionCode, onLogout, onTVMode }) {
  return (
    <div className="topbar">
      <div className="tlogo">
        <Image src="/assets/avatar_kevin.png" alt="LPT" width={28} height={28} style={{ borderRadius: '50%' }} />
        LPT Formation
      </div>
      <div style={{ fontSize: 13, color: '#888' }}>{sessionCode}</div>
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
