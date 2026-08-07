'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { getWeeklySharedState } from '@/lib/supabase'
import AutoEvalParticipant from '@/components/AutoEvalParticipant'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Chargement…</div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          Lien invalide
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{message}</div>
      </div>
    </div>
  )
}

function ThanksScreen({ pName }) {
  return (
    <div style={{
      minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 52, marginBottom: 18 }}>✅</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 10 }}>
          Merci {pName ? pName.split(' ')[0] : ''} !
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>
          Ton auto-évaluation a bien été envoyée à ton formateur. Tu peux fermer cette page.
        </div>
      </div>
    </div>
  )
}

function AutoEvalContent() {
  const params = useSearchParams()
  const collaborateur = params.get('c') || ''

  const [entrees, setEntrees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [done, setDone]       = useState(false)

  useEffect(() => {
    if (!collaborateur) {
      setError('Ce lien ne précise pas de destinataire — demande à ton formateur de te renvoyer le lien.')
      setLoading(false)
      return
    }
    getWeeklySharedState()
      .then(state => setEntrees(Array.isArray(state?.entrees_data) ? state.entrees_data : []))
      .catch(() => setEntrees([]))
      .finally(() => setLoading(false))
  }, [collaborateur])

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen message={error} />
  if (done)    return <ThanksScreen pName={collaborateur} />

  return (
    <AutoEvalParticipant
      pName={collaborateur}
      sharedState={{ entrees_data: entrees }}
      sessionCode=""
      onDone={() => setDone(true)}
    />
  )
}

export default function AutoEvalPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AutoEvalContent />
    </Suspense>
  )
}
