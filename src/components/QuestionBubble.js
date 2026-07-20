'use client'
import { useState } from 'react'
import { insertOpenAnswer, getRuntimeSessionCode } from '@/lib/supabase'

export default function QuestionBubble({ moduleId, pName }) {
  const [open, setSOpen]  = useState(false)
  const [text, setText]   = useState('')
  const [saving, setSaving] = useState(false)
  const [sent, setSent]   = useState(false)
  const [error, setError] = useState(false)

  const handleSend = async () => {
    if (!text.trim() || saving) return
    setSaving(true)
    setError(false)
    try {
      const code = getRuntimeSessionCode()
      console.log('[QuestionBubble] envoi → sessionCode:', code, 'pageId:', 'mq_' + moduleId)
      await insertOpenAnswer({ sessionCode: code, pageId: 'mq_' + moduleId, participantName: pName || 'Anonyme', answer: text.trim() })
      console.log('[QuestionBubble] insert OK')
      setText('')
      setSent(true)
      setTimeout(() => { setSent(false); setSOpen(false) }, 1600)
    } catch (e) {
      console.warn('[QuestionBubble]', e)
      setError(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* Petite bulle discrète — bottom-left */}
      <button
        onClick={() => setSOpen(true)}
        aria-label="Poser une question"
        style={{
          position: 'fixed', bottom: 68, left: 12, zIndex: 800,
          width: 34, height: 34, borderRadius: '50%',
          background: 'rgba(10,20,50,0.68)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
          opacity: 0.6,
          transition: 'opacity .2s',
        }}
        onTouchStart={e => { e.currentTarget.style.opacity = '1' }}
        onTouchEnd={e => { setTimeout(() => { if (e.currentTarget) e.currentTarget.style.opacity = '0.6' }, 300) }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.6' }}
      >
        {/* Icône bulle de message */}
        <svg width="15" height="14" viewBox="0 0 15 14" fill="none">
          <path d="M1 1h13a.7.7 0 0 1 .7.7v8a.7.7 0 0 1-.7.7H4.5L1 14V1.7A.7.7 0 0 1 1.7 1z"
            stroke="rgba(255,255,255,0.9)" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
          <circle cx="4.8" cy="5.8" r="0.9" fill="rgba(255,255,255,0.9)"/>
          <circle cx="7.5" cy="5.8" r="0.9" fill="rgba(255,255,255,0.9)"/>
          <circle cx="10.2" cy="5.8" r="0.9" fill="rgba(255,255,255,0.9)"/>
        </svg>
      </button>

      {/* Bottom sheet de saisie */}
      {open && (
        <>
          <div
            onClick={() => setSOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)' }}
          />
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
            background: '#101e38', borderRadius: '18px 18px 0 0',
            padding: '18px 16px calc(env(safe-area-inset-bottom, 0px) + 24px)',
            boxShadow: '0 -6px 30px rgba(0,0,0,0.45)',
            fontFamily: 'system-ui, sans-serif',
          }}>
            {/* Barre de handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '0 auto 16px' }}/>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: sent ? '#22c55e' : error ? '#ef4444' : '#fff' }}>
                {sent ? '✓ Question envoyée !' : error ? '✗ Erreur — réessaie' : '❓ Poser une question'}
              </div>
              <button
                onClick={() => setSOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 18, cursor: 'pointer', padding: 4, lineHeight: 1 }}
              >✕</button>
            </div>

            {!sent && (
              <>
                <textarea
                  autoFocus
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Ta question sera transmise au formateur…"
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    borderRadius: 10, padding: '11px 13px', resize: 'none',
                    color: '#fff', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.5,
                    outline: 'none', marginBottom: 12,
                  }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setSOpen(false)}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 10,
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.45)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >Annuler</button>
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || saving}
                    style={{
                      flex: 2, padding: '12px 0', borderRadius: 10,
                      background: (text.trim() && !saving) ? '#00abe9' : 'rgba(255,255,255,0.07)',
                      border: 'none',
                      color: (text.trim() && !saving) ? '#fff' : 'rgba(255,255,255,0.25)',
                      fontSize: 13, fontWeight: 700,
                      cursor: (text.trim() && !saving) ? 'pointer' : 'default',
                      fontFamily: 'inherit', transition: 'background .15s',
                    }}
                  >
                    {saving ? '…' : 'Envoyer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </>
  )
}
