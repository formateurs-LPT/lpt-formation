'use client'
import { useState, useEffect } from 'react'

export default function FullscreenHint() {
  const [visible, setVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const standalone =
      window.navigator.standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches
    const dismissed = localStorage.getItem('lpt_fs_dismissed')
    const mobile = window.innerWidth < 900

    setIsIOS(ios)
    setIsFullscreen(standalone)

    if (mobile && !standalone && !dismissed) {
      setTimeout(() => setVisible(true), 1500)
    }

    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (document.fullscreenElement) setVisible(false)
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const handleFullscreen = async () => {
    try {
      const el = document.documentElement
      if (el.requestFullscreen) await el.requestFullscreen()
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
      dismiss()
    } catch {}
  }

  const dismiss = () => {
    localStorage.setItem('lpt_fs_dismissed', '1')
    setVisible(false)
  }

  if (!visible || isFullscreen) return null

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 99999,
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 100%)',
      borderTop: '1px solid rgba(0,171,233,0.35)',
      padding: '14px 16px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* Icône */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20,
      }}>
        {isIOS ? '⬆' : '⛶'}
      </div>

      {/* Texte */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
          Passer en plein écran
        </div>
        {isIOS ? (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
            Appuyez sur <span style={{ color: '#00abe9', fontWeight: 600 }}>⬆ Partager</span> en bas de Safari
            → <span style={{ color: '#00abe9', fontWeight: 600 }}>Sur l'écran d'accueil</span>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            L'app s'ouvre sans barre de navigation
          </div>
        )}
      </div>

      {/* Bouton action (Android) ou juste fermeture (iOS) */}
      {!isIOS && (
        <button
          onClick={handleFullscreen}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: '#0089ba', color: '#fff', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          Plein écran
        </button>
      )}

      {/* Fermer */}
      <button
        onClick={dismiss}
        style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: 18, cursor: 'pointer', padding: '4px 6px',
          lineHeight: 1, flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}
