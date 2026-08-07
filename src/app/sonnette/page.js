'use client'
import { useState } from 'react'
import Image from 'next/image'
import { sbUpsert } from '@/lib/supabase'

export default function SonnettePage() {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!prenom.trim() || !nom.trim()) return
    setLoading(true)
    setError('')
    const uid = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Date.now() + '-' + Math.random().toString(36).slice(2, 8)
    const result = await sbUpsert('trainer_state', {
      trainer: 'sonnette-' + uid,
      state: { prenom: prenom.trim(), nom: nom.trim(), created_at: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    }, 'trainer')
    if (result != null) {
      setSent(true)
    } else {
      setError('Une erreur est survenue, réessayez.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
        padding: 32, textAlign: 'center',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 28,
        }}>
          <svg width={40} height={40} viewBox="0 0 40 40">
            <path d="M 8,20 L 17,29 L 32,12" fill="none" stroke="#22c55e" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 12px' }}>
          Un formateur arrive !
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0 }}>
          Restez devant l&apos;entrée du bâtiment,<br />nous descendons vous accueillir.
        </p>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      padding: '32px 24px',
    }}>
      <Image
        src="/assets/logo-lpt-blanc.png"
        alt="Lunettes Pour Tous"
        width={120} height={46}
        style={{ objectFit: 'contain', marginBottom: 40 }}
      />

      <div style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, padding: '36px 28px', width: '100%', maxWidth: 420,
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: '0 0 6px', textAlign: 'center' }}>
          Bienvenue !
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '0 0 28px', lineHeight: 1.5 }}>
          Signalez votre arrivée pour que votre formateur descende vous accueillir.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input
            type="text"
            placeholder="Votre prénom"
            value={prenom}
            onChange={e => setPrenom(e.target.value)}
            autoComplete="given-name"
            style={{
              padding: '14px 16px', borderRadius: 12, fontSize: 16,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', outline: 'none', fontFamily: 'inherit',
              WebkitAppearance: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Votre nom de famille"
            value={nom}
            onChange={e => setNom(e.target.value)}
            autoComplete="family-name"
            style={{
              padding: '14px 16px', borderRadius: 12, fontSize: 16,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', outline: 'none', fontFamily: 'inherit',
              WebkitAppearance: 'none',
            }}
          />
          {error && (
            <p style={{ color: '#f87171', fontSize: 13, margin: 0, textAlign: 'center' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !prenom.trim() || !nom.trim()}
            style={{
              marginTop: 8, padding: '16px 0', borderRadius: 14, fontSize: 17, fontWeight: 700,
              background: (!prenom.trim() || !nom.trim() || loading)
                ? 'rgba(0,171,233,0.3)'
                : 'linear-gradient(135deg, #0089ba, #00abe9)',
              border: 'none', color: '#fff',
              cursor: (!prenom.trim() || !nom.trim() || loading) ? 'default' : 'pointer',
              fontFamily: 'inherit', transition: 'all .2s',
              boxShadow: (!prenom.trim() || !nom.trim() || loading)
                ? 'none'
                : '0 4px 20px rgba(0,171,233,0.4)',
            }}
          >
            {loading ? 'Envoi...' : 'Je suis là !'}
          </button>
        </form>
      </div>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 24, textAlign: 'center' }}>
        Formation Lunettes Pour Tous · Paris 6e
      </p>
    </div>
  )
}
