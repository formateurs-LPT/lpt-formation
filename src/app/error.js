'use client'
import { useEffect } from 'react'
import { rechargerSiMiseEnLigne } from '@/lib/rechargementApresMiseEnLigne'

// Écran d'erreur de l'app : après une mise en ligne, recharge tout seul
// (cf. lib/rechargementApresMiseEnLigne.js) ; sinon propose de recharger
// au lieu de la page blanche « Application error ».
export default function Erreur({ error }) {
  useEffect(() => { rechargerSiMiseEnLigne(error) }, [error])
  return (
    <div style={{ minHeight: '100dvh', background: '#03112a', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, textAlign: 'center', fontFamily: 'inherit' }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Oups, l&apos;écran a rencontré un problème</div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>Rien n&apos;est perdu : rechargez la page pour reprendre.</div>
      <button onClick={() => window.location.reload()} style={{ padding: '14px 28px', borderRadius: 10, border: 'none', background: '#fff', color: '#03112a', fontSize: 16, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>Recharger la page</button>
    </div>
  )
}
