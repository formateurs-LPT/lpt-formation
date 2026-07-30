'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { sbSelect } from '@/lib/supabase'
import { DIRECTEURS, classifyDR } from '@/lib/directeursData'

function getWeekDate() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function computeRate(assessments) {
  const vals = Object.values(assessments || {}).filter(Boolean)
  if (!vals.length) return null
  const score = vals.reduce((s, v) => s + (v === 'maitrise' ? 1 : v === 'en-cours' ? 0.667 : v === 'notions' ? 0.333 : 0), 0)
  return Math.round((score / vals.length) * 100)
}

function getVerdict(snap) {
  if (!snap) return null
  const app = snap.appreciation
  if (app === 'tres-bon') return 'bon'
  if (app === 'accompagnement') return 'moyen'
  if (app === 'complique') return 'mauvais'
  // Fallback sur le taux d'acquisition
  const rate = computeRate(snap.theme_assessments)
  if (rate === null) return null
  if (rate >= 75) return 'bon'
  if (rate >= 45) return 'moyen'
  return 'mauvais'
}

const VERDICT_META = {
  bon:     { label: 'Bon',   bg: '#dcfce7', border: '#bbf7d0', color: '#16a34a', dot: '#22c55e', icon: '✓' },
  moyen:   { label: 'Moyen', bg: '#fef3c7', border: '#fde68a', color: '#d97706', dot: '#fbbf24', icon: '◑' },
  mauvais: { label: 'Mauvais', bg: '#fee2e2', border: '#fecaca', color: '#dc2626', dot: '#f87171', icon: '⚠' },
}

function TraineeCard({ row }) {
  const [open, setOpen] = useState(false)
  const snap = row.stats_snapshot || {}
  const verdict = getVerdict(snap)
  const meta = verdict ? VERDICT_META[verdict] : null
  const hasComments = snap.commentaire_libre || snap.attitude_note || snap.participation_note || snap.comprehension_note
  const magasin = snap.magasin || '—'
  const isMauvais = verdict === 'mauvais'
  const isMoyen   = verdict === 'moyen'
  const canExpand = (isMauvais || isMoyen) && hasComments

  const expandBorderColor  = isMauvais ? '#fecaca' : '#fde68a'
  const expandBg           = isMauvais ? '#fff5f5' : '#fffbeb'
  const expandTitleColor   = isMauvais ? '#dc2626' : '#d97706'
  const expandTitleLabel   = isMauvais ? '⚠ Commentaires du formateur' : '📝 Commentaires du formateur'
  const expandNoteBorder   = isMauvais ? '#fecaca' : '#fde68a'

  return (
    <div style={{
      background: '#fff',
      border: `1.5px solid ${meta ? meta.border : '#e2e8f0'}`,
      borderRadius: 14,
      overflow: 'hidden',
      transition: 'border-color .2s',
    }}>
      <div
        onClick={() => canExpand && setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px 20px',
          cursor: canExpand ? 'pointer' : 'default',
        }}
      >
        <div style={{
          width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
          background: meta?.dot || '#cbd5e1',
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
            {row.collaborateur}
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{magasin}</div>
        </div>

        {meta ? (
          <div style={{
            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800,
            background: meta.bg, color: meta.color, border: `1px solid ${meta.border}`,
            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>{meta.icon}</span> {meta.label}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic', flexShrink: 0 }}>
            Non évalué
          </div>
        )}

        {canExpand && (
          <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0, marginLeft: 4 }}>
            {open ? '▲' : '▼'}
          </span>
        )}
      </div>

      {canExpand && open && (
        <div style={{
          borderTop: `1px solid ${expandBorderColor}`,
          background: expandBg,
          padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: expandTitleColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            {expandTitleLabel}
          </div>
          {snap.commentaire_libre && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Commentaire général</div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7, background: '#fff', border: `1px solid ${expandNoteBorder}`, borderRadius: 10, padding: '10px 14px', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                « {snap.commentaire_libre} »
              </div>
            </div>
          )}
          {snap.attitude_note && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Attitude / comportement</div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7, background: '#fff', border: `1px solid ${expandNoteBorder}`, borderRadius: 10, padding: '10px 14px', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                « {snap.attitude_note} »
              </div>
            </div>
          )}
          {snap.participation_note && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Participation</div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7, background: '#fff', border: `1px solid ${expandNoteBorder}`, borderRadius: 10, padding: '10px 14px', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                « {snap.participation_note} »
              </div>
            </div>
          )}
          {snap.comprehension_note && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Compréhension / acquisition</div>
              <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7, background: '#fff', border: `1px solid ${expandNoteBorder}`, borderRadius: 10, padding: '10px 14px', fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
                « {snap.comprehension_note} »
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function RapportDRContent() {
  const params = useSearchParams()
  const drKey    = params.get('dr') || ''
  const weekDate = params.get('w') || getWeekDate()

  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const dr = DIRECTEURS[drKey]

  useEffect(() => {
    if (!dr) { setError('Directeur régional introuvable.'); setLoading(false); return }
    const load = async () => {
      try {
        const data = await sbSelect('formation_reports', `week_date=eq.${weekDate}`)
        const filtered = (data || []).filter(r => {
          const magasin = r.stats_snapshot?.magasin || ''
          return classifyDR(magasin) === drKey
        })
        filtered.sort((a, b) => a.collaborateur.localeCompare(b.collaborateur))
        setRows(filtered)
      } catch (e) {
        setError('Erreur lors du chargement.')
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [drKey, weekDate, dr])

  if (!dr) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Lien invalide</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Directeur régional non reconnu.</div>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center', padding: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 14, color: '#64748b' }}>{error}</div>
      </div>
    </div>
  )

  const total   = rows.length
  const bons    = rows.filter(r => getVerdict(r.stats_snapshot) === 'bon').length
  const moyens  = rows.filter(r => getVerdict(r.stats_snapshot) === 'moyen').length
  const mauvais = rows.filter(r => getVerdict(r.stats_snapshot) === 'mauvais').length

  return (
    <div style={{ minHeight: '100dvh', background: '#f8fafc', fontFamily: 'DM Sans, system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 60%, #00abe9 150%)',
        padding: '32px 28px 28px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(0,171,233,0.1)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,171,233,0.8)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>
            Lunettes Pour Tous · Rapport Directeur Régional
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4, lineHeight: 1.2 }}>
            {dr.icon} {dr.fullName}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>
            {dr.territory} · Formation du {formatDate(weekDate)}
          </div>

          {/* KPIs synthétiques */}
          {!loading && total > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { label: 'Bon',     count: bons,    bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.3)',  color: '#4ade80' },
                { label: 'Moyen',   count: moyens,  bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.3)', color: '#fbbf24' },
                { label: 'Mauvais', count: mauvais, bg: 'rgba(248,113,113,0.15)',border: 'rgba(248,113,113,0.3)',color: '#f87171' },
              ].map(k => (
                <div key={k.label} style={{
                  background: k.bg, border: `1px solid ${k.border}`,
                  borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 80,
                }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.count}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: k.color, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ padding: '24px 20px', maxWidth: 640, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>
            Chargement…
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>📭</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Aucun formé pour votre réseau</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Aucun rapport disponible pour la semaine du {formatDate(weekDate)} dans votre territoire.
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
              {total} formé{total > 1 ? 's' : ''} · {formatDate(weekDate)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {rows.map(r => (
                <TraineeCard key={r.collaborateur + r.week_date} row={r} />
              ))}
            </div>
            <div style={{ marginTop: 32, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
              Si tu as des questions, tu peux me contacter, n'hésite pas !
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function RapportDRPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
      </div>
    }>
      <RapportDRContent />
    </Suspense>
  )
}
