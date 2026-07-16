'use client'
import { useState, useEffect, useRef } from 'react'
import { sbSelect, sbUpsert } from '@/lib/supabase'

function playDingDong() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    const note = (freq, start, dur, peak = 0.4) => {
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      osc2.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = freq
      osc2.frequency.value = freq * 1.004
      osc.type = 'sine'
      osc2.type = 'sine'
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(peak, start + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
      osc.start(start); osc.stop(start + dur)
      osc2.start(start); osc2.stop(start + dur)
    }

    const t = ctx.currentTime
    note(880, t, 1.2, 0.5)
    note(587.33, t + 0.55, 1.4, 0.45)
  } catch (e) {
    console.warn('Sonnette audio:', e)
  }
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function SonnettePanel({ visible, onClose, onPendingChange }) {
  const [arrivals, setArrivals] = useState([])
  const [ringing, setRinging] = useState(false)
  const [muted, setMuted] = useState(() => {
    try { return localStorage.getItem('sonnette_muted') === '1' } catch { return false }
  })
  const seenIds = useRef(null)
  const mutedRef = useRef(muted)

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    mutedRef.current = next
    try { localStorage.setItem('sonnette_muted', next ? '1' : '0') } catch {}
  }

  const load = async () => {
    const rows = await sbSelect('trainer_state')
    const pending = (rows || [])
      .filter(r => r.trainer?.startsWith('sonnette-') && !r.state?.dismissed_at)
      .map(r => ({ ...r.state, _key: r.trainer }))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    if (seenIds.current === null) {
      seenIds.current = new Set(pending.map(r => r._key))
    } else {
      const newOnes = pending.filter(r => !seenIds.current.has(r._key))
      if (newOnes.length > 0) {
        if (!mutedRef.current) playDingDong()
        setRinging(true)
        setTimeout(() => setRinging(false), 2500)
        newOnes.forEach(r => seenIds.current.add(r._key))
      }
    }

    setArrivals(pending)
    onPendingChange?.(pending.length)
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 2500)
    return () => clearInterval(t)
  }, [])

  const dismiss = async (key) => {
    const a = arrivals.find(x => x._key === key)
    if (!a) return
    await sbUpsert('trainer_state', {
      trainer: key,
      state: { prenom: a.prenom, nom: a.nom, created_at: a.created_at, dismissed_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, 'trainer')
    setArrivals(prev => {
      const next = prev.filter(x => x._key !== key)
      onPendingChange?.(next.length)
      return next
    })
    seenIds.current?.delete(key)
  }

  const sonnetteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/sonnette`
    : '/sonnette'

  // Component stays mounted (for polling + ringing) even when not visible
  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, width: 420, maxHeight: 'calc(100vh - 40px)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 22px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: ringing ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${ringing ? 'rgba(251,191,36,0.6)' : 'rgba(255,255,255,0.1)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={ringing ? '#fbbf24' : 'rgba(255,255,255,0.5)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={ringing ? '#fbbf24' : 'rgba(255,255,255,0.5)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Sonnette d&apos;accueil</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {arrivals.length > 0
                ? `${arrivals.length} personne${arrivals.length > 1 ? 's' : ''} en attente`
                : 'Aucune arrivee pour le moment'}
            </div>
          </div>
          <button
            onClick={toggleMute}
            title={muted ? 'Reactiver le son' : 'Mettre en sourdine'}
            style={{
              background: muted ? 'rgba(251,191,36,0.12)' : 'rgba(255,255,255,0.06)',
              border: muted ? '1px solid rgba(251,191,36,0.35)' : '1px solid rgba(255,255,255,0.1)',
              color: muted ? '#fbbf24' : 'rgba(255,255,255,0.45)',
              width: 32, height: 32, borderRadius: 8,
              cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s',
            }}
          >
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              {muted ? (
                <>
                  <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                  <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </>
              ) : (
                <>
                  <path d="M11 5L6 9H2v6h4l5 4V5z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.5)', width: 32, height: 32, borderRadius: 8,
              cursor: 'pointer', fontSize: 18, fontFamily: 'inherit', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>

        {/* Share link */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
            Lien a envoyer aux collaborateurs
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, padding: '8px 12px',
          }}>
            <code style={{ flex: 1, fontSize: 12, color: '#00abe9', wordBreak: 'break-all' }}>
              {sonnetteUrl}
            </code>
            <button
              onClick={() => navigator.clipboard?.writeText(sonnetteUrl)}
              style={{
                background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)',
                color: '#00abe9', padding: '5px 11px', borderRadius: 7,
                fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              }}
            >
              Copier
            </button>
          </div>
        </div>

        {/* Arrivals list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 22px 22px' }}>
          {arrivals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              <div style={{ marginBottom: 10 }}>
                <svg width={32} height={32} viewBox="0 0 24 24" fill="none" style={{ opacity: 0.3 }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              En attente d&apos;arrivees...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {arrivals.map(a => (
                <div key={a._key} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: '14px 16px',
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #0089ba, #00abe9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: '#fff', flexShrink: 0,
                  }}>
                    {(a.prenom || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                      {a.prenom} {a.nom}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                      Arrive a {formatTime(a.created_at)}
                    </div>
                  </div>
                  <button
                    onClick={() => dismiss(a._key)}
                    style={{
                      background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                      color: '#4ade80', padding: '8px 14px', borderRadius: 10,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      flexShrink: 0, transition: 'all .15s', whiteSpace: 'nowrap',
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.2)' }}
                    onMouseOut={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.1)' }}
                  >
                    Recupere
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
