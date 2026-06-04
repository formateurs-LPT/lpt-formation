'use client'
import Image from 'next/image'

export default function ModuleOffres({ pName, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={120} height={45} style={{ objectFit: 'contain', marginBottom: 40 }} />

      <div style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>🏷️</div>
        <div style={{
          display: 'inline-block',
          background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)',
          borderRadius: 20, padding: '5px 20px',
          fontSize: 11, fontWeight: 700, color: '#00abe9', letterSpacing: 1.5,
          textTransform: 'uppercase', marginBottom: 16,
        }}>Journée 2 · Module</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 12 }}>Les offres</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 36 }}>
          Ce module est en cours de création.<br />
          Il sera disponible très prochainement.
        </p>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', borderRadius: 12, padding: '12px 28px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}
        >
          ← Retour aux modules
        </button>
      </div>
    </div>
  )
}
