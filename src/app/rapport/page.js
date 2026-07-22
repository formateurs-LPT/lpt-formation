'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { sbSelect } from '@/lib/supabase'
import CompteRenduManager from '@/components/CompteRenduManager'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100dvh', background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>Chargement du compte rendu…</div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div style={{
      minHeight: '100dvh', background: '#f8fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
          Compte rendu introuvable
        </div>
        <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{message}</div>
      </div>
    </div>
  )
}

function RapportContent() {
  const params = useSearchParams()
  const collaborateur = params.get('c') || ''
  const weekDate      = params.get('w') || ''
  const trainerName   = params.get('t') || ''
  const categoryKey   = params.get('cat') || 'province'

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    if (!collaborateur || !weekDate || !trainerName) {
      setError('Lien invalide — paramètres manquants.')
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        const rows = await sbSelect(
          'formation_reports',
          `collaborateur=eq.${encodeURIComponent(collaborateur)}&week_date=eq.${weekDate}&trainer_name=eq.${encodeURIComponent(trainerName)}&limit=1`
        )
        const snap = rows?.[0]?.stats_snapshot || {}
        setData({
          collaborateur,
          trainerName,
          weekDate,
          categoryKey,
          assessments:         snap.theme_assessments     || {},
          attitudeStatus:      snap.attitude_status       || null,
          attitudeNote:        snap.attitude_note         || '',
          comprehensionStatus: snap.comprehension_status  || null,
          comprehensionNote:   snap.comprehension_note    || '',
          appreciation:        snap.appreciation          || null,
        })
      } catch (e) {
        console.error('[Rapport] load error', e)
        setError('Impossible de charger le compte rendu. Vérifie ta connexion.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [collaborateur, weekDate, trainerName, categoryKey])

  if (loading) return <LoadingScreen />
  if (error)   return <ErrorScreen message={error} />

  return (
    <div style={{ minHeight: '100dvh', background: '#f1f5f9', padding: '24px 16px 48px' }}>

      {/* Bandeau manager */}
      <div style={{
        maxWidth: 780, margin: '0 auto 20px',
        background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.2)',
        borderRadius: 12, padding: '10px 18px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 16 }}>📋</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#0089ba' }}>
          Compte rendu de formation — Document confidentiel à destination du manager
        </span>
      </div>

      <CompteRenduManager data={data} />

      {/* Bouton imprimer */}
      <div style={{ maxWidth: 780, margin: '20px auto 0', textAlign: 'center' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '12px 28px', borderRadius: 12,
            background: '#0f172a', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          🖨️ Imprimer / Enregistrer en PDF
        </button>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          button { display: none !important; }
          div[style*="rgba(0,171,233"] { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default function RapportPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <RapportContent />
    </Suspense>
  )
}
