'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { sbSelect } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import {
  CATEGORY_META,
  STATUS_OPTIONS,
  mergeFormationReports,
  fetchArchiveIndex,
  fetchModuleAndQuizRows,
} from '@/components/RetourFormationView'

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100dvh', background: '#03112a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 16 }}>📋</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Chargement de ton bilan…</div>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#03112a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Bilan introuvable</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{message}</div>
      </div>
    </div>
  )
}

function BilanContent() {
  const params = useSearchParams()
  const collaborateur = params.get('c') || ''
  const weekDate = params.get('w') || ''
  const categoryKey = params.get('cat') || 'province'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assessments, setAssessments] = useState({})
  const [globalRate, setGlobalRate] = useState(null)
  const [globalCounts, setGlobalCounts] = useState({ correct: 0, total: 0 })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!collaborateur) {
      setError('Lien invalide — paramètres manquants.')
      setLoading(false)
      return
    }
    const load = async () => {
      try {
        const archiveIndexPromise = fetchArchiveIndex()
        const [reportRows, { answerRows }] = await Promise.all([
          sbSelect('formation_reports', `collaborateur=eq.${encodeURIComponent(collaborateur)}&trainer_name=neq.__auto_eval__&order=updated_at.desc&limit=30`),
          fetchModuleAndQuizRows(collaborateur, archiveIndexPromise),
        ])
        const merged = mergeFormationReports(reportRows)
        setAssessments(merged?.snapshot?.theme_assessments || {})
        setMessage(merged?.snapshot?.message_formateur_forme || '')

        // Taux global — quiz de module ET jeu des questions confondus, comme demandé
        const total = (answerRows || []).length
        const correct = (answerRows || []).filter(r => r.is_correct).length
        setGlobalCounts({ correct, total })
        setGlobalRate(total ? Math.round((correct / total) * 100) : null)
      } catch (e) {
        console.error('[Bilan] load error', e)
        setError('Impossible de charger ton bilan. Vérifie ta connexion.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [collaborateur, weekDate])

  if (loading) return <LoadingScreen />
  if (error) return <ErrorScreen message={error} />

  const themes = CATEGORY_META[categoryKey]?.themes || CATEGORY_META.province.themes
  const firstName = collaborateur.split(' ')[0]
  const rateColor = globalRate === null ? '#64748b' : globalRate >= 70 ? '#16a34a' : globalRate >= 40 ? '#d97706' : '#dc2626'

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', padding: '32px 20px 56px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={130} height={48} style={{ objectFit: 'contain', marginBottom: 18 }} />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'center', margin: 0 }}>
            Ton bilan de formation
          </h1>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{collaborateur}</div>
        </div>

        {/* Taux global */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 20, padding: '22px 20px', textAlign: 'center', marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Taux de bonnes réponses — quiz &amp; questions
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, color: rateColor }}>
            {globalRate === null ? '—' : `${globalRate}%`}
          </div>
          {globalCounts.total > 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>
              {globalCounts.correct}/{globalCounts.total} bonnes réponses
            </div>
          )}
        </div>

        {/* Message du formateur */}
        {message && (
          <div style={{
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 16, padding: '18px 20px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Message de ton formateur
            </div>
            <div style={{ fontSize: 14, color: '#e9e4ff', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message}</div>
          </div>
        )}

        {/* Thèmes abordés */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Thèmes abordés durant la formation
            </span>
          </div>
          {themes.map((themeId, idx) => {
            const meta = MODULE_DATA[themeId]
            if (!meta) return null
            const status = assessments[themeId]
            const opt = STATUS_OPTIONS.find(o => o.key === status)
            return (
              <div key={themeId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '12px 18px',
                borderBottom: idx < themes.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}>
                <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{meta.label}</span>
                {opt ? (
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: opt.color,
                    background: `${opt.color}22`, border: `1px solid ${opt.color}55`,
                    borderRadius: 20, padding: '3px 10px', whiteSpace: 'nowrap',
                  }}>
                    {opt.icon} {opt.label}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>—</span>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 24, lineHeight: 1.6 }}>
          Les points non maîtrisés ne sont pas un reproche — c'est simplement ce sur quoi continuer à progresser.
        </div>
      </div>
    </div>
  )
}

export default function BilanFormationPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <BilanContent />
    </Suspense>
  )
}
