'use client'
import Image from 'next/image'

export default function Topbar({ pName, isTrainer, onlineCount, sessionCode, onLogout }) {
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
