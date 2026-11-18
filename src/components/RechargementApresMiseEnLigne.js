'use client'
import { useEffect } from 'react'
import { rechargerSiMiseEnLigne } from '@/lib/rechargementApresMiseEnLigne'

// Écoute les erreurs de chargement non rattrapées (cf. lib/rechargementApresMiseEnLigne.js)
export default function RechargementApresMiseEnLigne() {
  useEffect(() => {
    const surErreur = (e) => rechargerSiMiseEnLigne(e?.error || e?.message)
    const surRejet = (e) => rechargerSiMiseEnLigne(e?.reason)
    window.addEventListener('error', surErreur)
    window.addEventListener('unhandledrejection', surRejet)
    return () => {
      window.removeEventListener('error', surErreur)
      window.removeEventListener('unhandledrejection', surRejet)
    }
  }, [])
  return null
}
