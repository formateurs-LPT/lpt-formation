'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { getTrainerAvatarSrc } from '@/lib/constants'
import { fetchOnlineParticipantsList, markParticipantLeft } from '@/lib/participantPresence'
import { setRoomSharedState, getRoomSharedState, sbSelect, getSharedState, setSharedState } from '@/lib/supabase'
import { useIsMobile } from '@/lib/useIsMobile'

function useFullscreen() {
  const [isFS, setIsFS] = useState(false)
  useEffect(() => {
    const handler = () => setIsFS(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [])
  const toggle = () => {
    if (!document.fullscreenElement) {
      const el = document.documentElement
      if (el.requestFullscreen) el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    } else {
      if (document.exitFullscreen) document.exitFullscreen()
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen()
    }
  }
  return { isFS, toggle }
}

function FullscreenButton({ style }) {
  const [showGuide, setShowGuide] = useState(false)
  const { isFS, toggle } = useFullscreen()
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isStandalone = typeof window !== 'undefined' && (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches)

  const handleClick = () => {
    if (isIOS) { if (!isStandalone) setShowGuide(v => !v); return }
    toggle()
  }

  return (
    <>
      <button
        onClick={handleClick}
        title={isFS ? 'Quitter le plein écran' : 'Plein écran'}
        style={{
          background: 'rgba(0,137,186,0.08)', border: '1px solid rgba(0,137,186,0.3)',
          borderRadius: 10, padding: '11px 14px',
          color: '#0089ba', fontSize: 18, cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          width: '100%',
          ...style,
        }}
      >
        {isIOS ? (isStandalone ? '✓ Plein écran actif' : '⛶ Plein écran') : (isFS ? '⊠ Quitter plein écran' : '⛶ Plein écran')}
      </button>
      {showGuide && (
        <div style={{
          background: '#fff8e7', border: '1px solid #f59e0b',
          borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#92400e', lineHeight: 1.5,
        }}>
          Sur iPhone/iPad, appuie sur le bouton <strong>Partager</strong> (⬆️) puis <strong>« Sur l'écran d'accueil »</strong> pour utiliser l'app en plein écran.
        </div>
      )}
    </>
  )
}

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

const PAGE_STALE_MS = 2 * 60 * 1000 // données périmées si pas de heartbeat depuis 2 min (heartbeat toutes les 45s)

function ParticipantsPanel({ sessionCode, onClose }) {
  const [participants, setParticipants] = useState([])
  const [participantPages, setParticipantPages] = useState({})
  const [trainerModule, setTrainerModule] = useState(null)
  const [trainerPage, setTrainerPage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [kicking, setKicking] = useState({})
  const [sending, setSending] = useState({})
  const [alertHistory, setAlertHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const intervalRef = useRef(null)

  const refresh = async () => {
    const [list, roomState, sessionRows] = await Promise.all([
      fetchOnlineParticipantsList(sessionCode).catch(() => []),
      getRoomSharedState(sessionCode).catch(() => ({})),
      sbSelect('sessions', `code=eq.${encodeURIComponent(sessionCode)}`).catch(() => []),
    ])
    const session = sessionRows?.[0]
    setParticipants(filterKicked(list, roomState?.forced_disconnects))
    setParticipantPages(roomState?.participant_pages || {})
    setTrainerModule(session?.active_module || null)
    setTrainerPage(session?.module_page ?? null)
    setLoading(false)
  }

  const ALERT_MESSAGES = [
    'Ah te voilà ! 👀 Tu étais passé où ?',
    'Je te vois… 👁️👁️',
    'Hop hop hop ! Reste concentré jusqu\'à 18h, après promis tu pourras aller sur les réseaux 😄',
    'Pas de Instagram ou TikTok pendant la formation ! Les réseaux peuvent attendre 😅',
    'On t\'a retrouvé ! 🕵️ Reviens parmi nous !',
    'Psst… la formation c\'est par ici ! 👇',
    'Tu manques quelque chose d\'important là ! 🎯',
    'Les likes peuvent attendre, la formation non ! 😜',
  ]

  const handleSendAlert = async (participantName) => {
    setSending(s => ({ ...s, [participantName]: true }))
    const safeName = participantName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_À-ɏ]/g, '')
    const ts = Date.now()
    const message = ALERT_MESSAGES[Math.floor(Math.random() * ALERT_MESSAGES.length)]
    await setRoomSharedState(
      { [`alert__${safeName}__${ts}`]: { message, ts } },
      sessionCode
    ).catch(() => {})
    setAlertHistory(h => [{ target: participantName, message, ts }, ...h])
    setTimeout(() => setSending(s => ({ ...s, [participantName]: false })), 800)
  }

  useEffect(() => {
    refresh()
    intervalRef.current = setInterval(refresh, 3000)
    return () => clearInterval(intervalRef.current)
  }, [sessionCode])

  const handleKick = async (name) => {
    setKicking(k => ({ ...k, [name]: true }))
    setParticipants(prev => prev.filter(p => p.name !== name))
    await markParticipantLeft(sessionCode, name).catch(() => {})
    await setRoomSharedState({ forced_disconnects: { [name]: Date.now() } }, sessionCode).catch(() => {})
    setKicking(k => ({ ...k, [name]: false }))
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />
      <div style={{
        position: 'fixed', top: 'calc(56px + env(safe-area-inset-top, 0px))', right: 16, zIndex: 1000,
        background: '#0d1f3c',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        width: 300,
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                {loading ? '…' : participants.length} formé{participants.length > 1 ? 's' : ''} connecté{participants.length > 1 ? 's' : ''}
              </span>
            </div>
            {trainerModule && !loading && (() => {
              const onPageCount = participants.filter(p => {
                const pp = participantPages[p.name]
                return pp && (Date.now() - (pp.ts || 0)) < PAGE_STALE_MS
                  && pp.visible !== false
                  && pp.moduleId === trainerModule
                  && pp.pageIndex === trainerPage
              }).length
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: onPageCount === participants.length && participants.length > 0 ? '#22c55e' : '#f59e0b' }} />
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    {onPageCount}/{participants.length} sur votre page
                  </span>
                </div>
              )
            })()}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 4,
            }}
          >✕</button>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ padding: '20px 18px', color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>
              Chargement…
            </div>
          ) : participants.length === 0 ? (
            <div style={{ padding: '20px 18px', color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center' }}>
              Aucun formé connecté
            </div>
          ) : participants.map((p) => {
            const pp = participantPages[p.name]
            const fresh = pp && (Date.now() - (pp.ts || 0)) < PAGE_STALE_MS
            const tabVisible = fresh && pp.visible !== false
            const sameModule = fresh && trainerModule && pp.moduleId === trainerModule && pp.pageIndex === trainerPage
            const onPage = sameModule && tabVisible
            const dotColor = !fresh ? 'rgba(255,255,255,0.2)' : onPage ? '#22c55e' : '#f59e0b'
            const pageLabel = !fresh
              ? 'Page non détectée'
              : !tabVisible
                ? 'Hors de la formation'
                : sameModule
                  ? 'Sur votre page ✓'
                  : 'Pas sur votre page'
            return (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} title="Connecté" />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, transition: 'background .3s' }} title={pageLabel} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', display: 'block' }}>{p.name}</span>
                    <span style={{ fontSize: 10, color: onPage ? '#4ade80' : !fresh ? 'rgba(255,255,255,0.3)' : '#fbbf24', fontWeight: 500, fontStyle: !tabVisible && fresh ? 'italic' : 'normal' }}>
                      {pageLabel}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  {!onPage && fresh && (
                    <button
                      onClick={() => handleSendAlert(p.name)}
                      disabled={sending[p.name]}
                      title="Envoyer une alerte"
                      style={{
                        background: sending[p.name] ? 'rgba(251,191,36,0.3)' : 'rgba(251,191,36,0.12)',
                        border: '1px solid rgba(251,191,36,0.4)',
                        borderRadius: 8, padding: '5px 8px',
                        color: '#fbbf24', fontSize: 14,
                        cursor: sending[p.name] ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit', transition: 'all .15s',
                        opacity: sending[p.name] ? 0.5 : 1,
                      }}
                    >
                      {sending[p.name] ? '✓' : '😠'}
                    </button>
                  )}
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
                  >
                    {kicking[p.name] ? '…' : 'Déco'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Historique alertes */}
        {alertHistory.length > 0 && (
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '8px 0 4px' }}>
            <button
              onClick={() => setShowHistory(h => !h)}
              style={{
                background: 'none', border: 'none', width: '100%',
                padding: '6px 18px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
              }}
            >
              <span>😠 Alertes envoyées ({alertHistory.length})</span>
              <span>{showHistory ? '▲' : '▼'}</span>
            </button>
            {showHistory && alertHistory.map((a, i) => (
              <div key={i} style={{
                padding: '5px 18px 7px',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: '#fbbf24', fontWeight: 600 }}>{a.target}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                    {new Date(a.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {a.message && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4, fontStyle: 'italic' }}>
                    "{a.message}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/* Menu hamburger mobile — panneau qui descend depuis le haut */
function MobileMenu({ pName, isTrainer, onlineCount, sessionCode, isRoomSession, onStartSession, onTVMode, onLogout, onClose, onShowParticipants, onQr, qrActive, qrBusy }) {
  const code = (sessionCode || '').trim()
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.3)' }} />
      <div style={{
        position: 'fixed', top: 'calc(58px + env(safe-area-inset-top, 0px))', left: 0, right: 0, zIndex: 999,
        background: '#fff',
        borderBottom: '1px solid #ebebeb',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        padding: '12px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {/* Code salle */}
        {isRoomSession ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(0,137,186,0.06)', borderRadius: 10, border: '1px solid rgba(0,137,186,0.2)' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, color: '#0089ba' }}>Salle active</span>
            <span style={{ color: '#0089ba', fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2, fontSize: 14 }}>{code}</span>
          </div>
        ) : (
          <div style={{ padding: '8px 12px', background: '#f5f5f5', borderRadius: 10, fontSize: 13, color: '#888' }}>
            Legacy · {code || '—'}
          </div>
        )}

        {/* Formés connectés */}
        {isTrainer && (
          <button
            onClick={() => { onClose(); onShowParticipants() }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 10,
              background: '#f8f9fa', border: '1px solid #e5e7eb',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{onlineCount} formé(s) connecté(s)</span>
            </div>
            <span style={{ fontSize: 12, color: '#0089ba', fontWeight: 600 }}>Voir →</span>
          </button>
        )}

        {/* Boutons d'action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isTrainer && onStartSession && (
            <button onClick={() => { onClose(); onStartSession() }} style={{
              width: '100%', padding: '13px 16px', borderRadius: 10,
              background: '#0089ba', border: 'none', color: '#fff',
              fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              ▶ Démarrer la session
            </button>
          )}
          {isTrainer && onTVMode && (
            <button onClick={() => { onClose(); onTVMode() }} style={{
              width: '100%', padding: '13px 16px', borderRadius: 10,
              background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.3)',
              color: '#0089ba', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              📺 Mode Diffusion
            </button>
          )}
          {isTrainer && onQr && (
            <button onClick={() => { onClose(); onQr() }} disabled={qrBusy} style={{
              width: '100%', padding: '13px 16px', borderRadius: 10,
              background: qrActive ? 'rgba(0,137,186,0.18)' : 'rgba(0,137,186,0.08)',
              border: qrActive ? '1px solid #0089ba' : '1px solid rgba(0,137,186,0.3)',
              color: '#0089ba', fontSize: 15, fontWeight: 600,
              cursor: qrBusy ? 'wait' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: qrBusy ? 0.6 : 1,
            }}>
              {qrBusy ? '⏳' : '📱'} {qrActive ? 'Masquer QR diffuseur' : 'Afficher QR diffuseur'}
            </button>
          )}
          <FullscreenButton />
          <button onClick={() => { onClose(); onLogout() }} style={{
            width: '100%', padding: '13px 16px', borderRadius: 10,
            background: 'transparent', border: '1px solid #d1d5db',
            color: '#6b7280', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Déconnexion
          </button>
        </div>
      </div>
    </>
  )
}

export default function Topbar({ pName, isTrainer, onlineCount, sessionCode, isRoomSession, onLogout, onTVMode, onStartSession }) {
  const [showPanel, setShowPanel] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [qrActive, setQrActive] = useState(false)
  const [qrBusy, setQrBusy] = useState(false)
  const isMobile = useIsMobile(640)
  const code = (sessionCode || '').trim()
  const avatarSrc = isTrainer ? getTrainerAvatarSrc(pName) : '/assets/logo-lpt-blanc.png'

  // Initialise qrActive depuis l'état réel au montage
  useEffect(() => {
    if (!isTrainer) return
    getSharedState().then(s => {
      setQrActive(!!s?.tv_qr_overlay)
    }).catch(() => {})
  }, [isTrainer])

  const toggleQR = useCallback(async () => {
    if (qrBusy) return
    setQrBusy(true)
    try {
      const state = await getSharedState()
      const overlay = !!state?.tv_qr_overlay
      await setSharedState({ tv_qr_overlay: !overlay })
      setQrActive(!overlay)
    } catch (e) {
      console.error('toggleQR error', e)
    } finally {
      setQrBusy(false)
    }
  }, [qrBusy])

  if (isMobile) {
    return (
      <>
        <div className="topbar" style={{ justifyContent: 'space-between' }}>
          {/* Gauche : logo */}
          <div className="tlogo">
            <Image src={avatarSrc} alt={pName || 'LPT'} width={28} height={28} style={{ borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>LPT</span>
          </div>

          {/* Centre : formés connectés */}
          <div
            onClick={isTrainer ? () => setShowPanel(v => !v) : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: isTrainer ? 'pointer' : 'default' }}
          >
            <div className="odot" />
            <span style={{ fontSize: 12, color: '#555', fontWeight: 500 }}>{onlineCount}</span>
            {isTrainer && <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.3)' }}>▾</span>}
          </div>

          {/* Droite : QR rapide + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isTrainer && (
              <button
                onClick={toggleQR}
                disabled={qrBusy}
                title={qrActive ? 'Masquer QR' : 'QR diffuseur'}
                style={{
                  background: qrActive ? '#0089ba' : 'rgba(0,137,186,0.1)',
                  border: `1px solid ${qrActive ? '#0089ba' : 'rgba(0,137,186,0.3)'}`,
                  borderRadius: 8, padding: '6px 9px',
                  cursor: qrBusy ? 'wait' : 'pointer',
                  color: qrActive ? '#fff' : '#0089ba', fontSize: 16, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .2s', opacity: qrBusy ? 0.6 : 1,
                }}
              >
                {qrBusy ? '⏳' : '📱'}
              </button>
            )}
            <button
              onClick={() => setShowMenu(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '6px 8px', borderRadius: 8,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}
            >
              <span style={{ display: 'block', width: 20, height: 2, background: '#333', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 20, height: 2, background: '#333', borderRadius: 2 }} />
              <span style={{ display: 'block', width: 20, height: 2, background: '#333', borderRadius: 2 }} />
            </button>
          </div>
        </div>

        {showMenu && (
          <MobileMenu
            pName={pName}
            isTrainer={isTrainer}
            onlineCount={onlineCount}
            sessionCode={code}
            isRoomSession={isRoomSession}
            onStartSession={onStartSession}
            onTVMode={onTVMode}
            onLogout={onLogout}
            onClose={() => setShowMenu(false)}
            onShowParticipants={() => setShowPanel(true)}
            onQr={isTrainer ? toggleQR : undefined}
            qrActive={qrActive}
            qrBusy={qrBusy}
          />
        )}

        {showPanel && isTrainer && (
          <ParticipantsPanel
            sessionCode={code}
            onClose={() => setShowPanel(false)}
          />
        )}
      </>
    )
  }

  /* Layout desktop — inchangé */
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
          <span style={{ color: '#888' }} title="Mode legacy — cliquez sur « Créer une salle » pour une salle dédiée">
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
        {isTrainer && onStartSession && (
          <button onClick={onStartSession} style={{
            background: '#0089ba', border: 'none', color: '#fff',
            fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#00abe9'}
          onMouseLeave={e => e.currentTarget.style.background = '#0089ba'}
          >
            ▶ Démarrer
          </button>
        )}
        {isTrainer && onTVMode && (
          <button onClick={onTVMode} style={{
            background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.3)',
            color: '#0089ba', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.18)'; e.currentTarget.style.borderColor = '#00abe9' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,171,233,0.08)'; e.currentTarget.style.borderColor = 'rgba(0,171,233,0.3)' }}
          >
            📺 Diffusion
          </button>
        )}
        {isTrainer && (
          <button
            onClick={toggleQR}
            disabled={qrBusy}
            title={qrActive ? 'Masquer le QR code du diffuseur' : 'Afficher le QR code sur le diffuseur'}
            style={{
              background: qrActive ? 'rgba(0,137,186,0.18)' : 'rgba(0,137,186,0.08)',
              border: qrActive ? '1px solid #0089ba' : '1px solid rgba(0,137,186,0.3)',
              color: '#0089ba', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
              cursor: qrBusy ? 'wait' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all .2s',
              opacity: qrBusy ? 0.6 : 1,
            }}
          >
            {qrBusy ? '⏳' : '📱'} {qrActive ? 'Masquer QR' : 'QR diffuseur'}
          </button>
        )}
        {isTrainer && (
          <button onClick={onLogout} style={{
            background: 'transparent', border: '1px solid #d1d5db',
            color: '#6b7280', fontSize: 12, padding: '5px 12px', borderRadius: 20, cursor: 'pointer',
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
