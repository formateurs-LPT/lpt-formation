'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { getTrainerAvatarSrc } from '@/lib/constants'
import { fetchOnlineParticipantsList, markParticipantLeft } from '@/lib/participantPresence'
import { setRoomSharedState, getRoomSharedState } from '@/lib/supabase'

const KICK_EXPIRY_MS = 30 * 60 * 1000

function filterKicked(list, fd) {
  if (!fd || !Object.keys(fd).length) return list
  const now = Date.now()
  return list.filter(p => {
    const k = fd[p.name]
    if (!k) return true
    if (k === true) return false
    return now - Number(k) >= KICK_EXPIRY_MS
  })
}

function ParticipantsPanel({ sessionCode, onClose }) {
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(true)
  const [kicking, setKicking] = useState({})
  const intervalRef = useRef(null)

  const refresh = async () => {
    const [list, roomState] = await Promise.all([
      fetchOnlineParticipantsList(sessionCode).catch(() => []),
      getRoomSharedState(sessionCode).catch(() => ({})),
    ])
    setParticipants(filterKicked(list, roomState?.forced_disconnects))
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, 3000)
    return () => clearInterval(intervalRef.current)
  }, [sessionCode])

  const handleKick = async (name) => {
    setKicking(k => ({ ...k, [name]: true }))
    // Retrait immédiat de la liste (optimiste)
    setParticipants(prev => prev.filter(p => p.name !== name))
    await markParticipantLeft(sessionCode, name).catch(() => {})
    // Timestamp : le signal expire au bout de 30 min (assez pour toute la session)
    await setRoomSharedState({ forced_disconnects: { [name]: Date.now() } }, sessionCode).catch(() => {})
    setKicking(k => ({ ...k, [name]: false }))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 56, right: 16, zIndex: 1000,
        background: '#0d1f3c',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        width: 300,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {loading ? '…' : participants.length} formé{participants.length > 1 ? 's' : ''} connecté{participants.length > 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
          >✕</button>
        </div>

        {/* List */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '20px 18px', color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>
              Chargement…
            </div>
          ) : participants.length === 0 ? (
            <div style={{ padding: '20px 18px', color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>
              Aucun formé connecté
            </div>
          ) : participants.map((p) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 18px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{p.name}</span>
              </div>
              <button
                onClick={() => handleKick(p.name)}
                disabled={kicking[p.name]}
                style={{
                  background: kicking[p.name] ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8, padding: '5px 10px',
                  color: '#f87171', fontSize: 11, fontWeight: 700,
                  cursor: kicking[p.name] ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all .15s',
                  opacity: kicking[p.name] ? 0.5 : 1,
                }}
                onMouseEnter={e => { if (!kicking[p.name]) e.currentTarget.style.background = 'rgba(239,68,68,0.22)' }}
                onMouseLeave={e => { e.currentTarget.style.background = kicking[p.name] ? 'rgba(239,68,68,0.05)' : 'rgba(239,68,68,0.1)' }}
              >
                {kicking[p.name] ? '…' : 'Déconnecter'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default function Topbar({ pName, isTrainer, onlineCount, sessionCode, isRoomSession, onLogout, onTVMode }) {
  const [showPanel, setShowPanel] = useState(false)
  const code = (sessionCode || '').trim()
  const avatarSrc = isTrainer ? getTrainerAvatarSrc(pName) : '/assets/logo-lpt-blanc.png'

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
        <div
          className="online"
          onClick={isTrainer ? () => setShowPanel(v => !v) : undefined}
          style={isTrainer ? { cursor: 'pointer', userSelect: 'none' } : {}}
          title={isTrainer ? 'Voir les formés connectés' : undefined}
        >
          <div className="odot"></div>
          <span>{onlineCount} connecté(s)</span>
          {isTrainer && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginLeft: 2 }}>▾</span>}
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

      {showPanel && isTrainer && (
        <ParticipantsPanel
          sessionCode={code}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  )
}
