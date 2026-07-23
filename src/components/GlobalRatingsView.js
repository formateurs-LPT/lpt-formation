'use client'
import { useState, useEffect, useMemo } from 'react'
import { sbSelect } from '@/lib/supabase'

const RATING_LABELS = ['', 'Insuffisant', 'Passable', 'Bien', 'Très bien', 'Excellent !']
const RATING_COLORS = { 5: '#16a34a', 4: '#22c55e', 3: '#d97706', 2: '#f97316', 1: '#dc2626' }

function Stars({ value, size = 16 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, filter: s <= Math.round(value) ? 'none' : 'grayscale(1) brightness(0.5)' }}>⭐</span>
      ))}
    </span>
  )
}

export default function GlobalRatingsView({ onBack }) {
  const [loading,    setLoading]    = useState(true)
  const [allRatings, setAllRatings] = useState([]) // { name, rating, comment, week_date }
  const [filterStar, setFilterStar] = useState(0)  // 0 = tous

  useEffect(() => {
    sbSelect('formation_reports', 'trainer_name=eq.__auto_eval__')
      .then(data => {
        const list = (data || [])
          .filter(r => r.stats_snapshot?.auto_eval?.rating)
          .map(r => ({
            name:      r.collaborateur,
            rating:    r.stats_snapshot.auto_eval.rating,
            comment:   r.stats_snapshot.auto_eval.rating_comment || null,
            week_date: r.week_date,
          }))
          .sort((a, b) => b.week_date.localeCompare(a.week_date))
        setAllRatings(list)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const avgRating = useMemo(() =>
    allRatings.length
      ? Math.round((allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length) * 10) / 10
      : null,
    [allRatings]
  )

  const distribution = useMemo(() =>
    [5,4,3,2,1].map(star => ({
      star,
      count: allRatings.filter(r => r.rating === star).length,
      pct: allRatings.length ? Math.round((allRatings.filter(r => r.rating === star).length / allRatings.length) * 100) : 0,
    })),
    [allRatings]
  )

  const filtered = useMemo(() =>
    filterStar ? allRatings.filter(r => r.rating === filterStar) : allRatings,
    [allRatings, filterStar]
  )

  const withComments = filtered.filter(r => r.comment)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{
        padding: '18px 24px', background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      }}>
        <button className="detail-back" onClick={onBack}>← Tableau de bord</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>⭐ Avis sur la formation</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Note globale · toutes semaines · tous formateurs
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
        ) : allRatings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: 14 }}>
            Aucun avis reçu pour l'instant.
          </div>
        ) : (
          <>

            {/* Bloc note globale */}
            <div style={{
              background: '#fff', border: '1.5px solid #fde68a',
              borderRadius: 20, padding: '28px 32px', marginBottom: 24,
              boxShadow: '0 4px 20px rgba(245,158,11,0.1)',
              display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
            }}>
              {/* Note centrale */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
                  Note globale
                </div>
                <div style={{ fontSize: 68, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {avgRating?.toFixed(1)}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Stars value={avgRating} size={26} />
                </div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
                  {allRatings.length} avis · {allRatings.filter(r => r.comment).length} commentaire{allRatings.filter(r => r.comment).length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Distribution */}
              <div style={{ flex: 1, minWidth: 200 }}>
                {distribution.map(({ star, count, pct }) => (
                  <button
                    key={star}
                    onClick={() => setFilterStar(filterStar === star ? 0 : star)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px 0', borderRadius: 6,
                      outline: filterStar === star ? `2px solid ${RATING_COLORS[star]}` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, width: 22, textAlign: 'right', flexShrink: 0 }}>{star}</span>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>⭐</span>
                    <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        width: `${pct}%`, height: '100%',
                        background: RATING_COLORS[star],
                        borderRadius: 99, transition: 'width .4s',
                      }} />
                    </div>
                    <span style={{ fontSize: 12, color: '#64748b', fontWeight: 700, width: 24, textAlign: 'right', flexShrink: 0 }}>{count}</span>
                  </button>
                ))}
                {filterStar > 0 && (
                  <button
                    onClick={() => setFilterStar(0)}
                    style={{ marginTop: 4, fontSize: 11, color: '#0089ba', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    ✕ Effacer le filtre
                  </button>
                )}
              </div>
            </div>

            {/* Tous les avis */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
                {filterStar ? `Avis ${filterStar} étoile${filterStar > 1 ? 's' : ''} (${filtered.length})` : `Tous les avis (${filtered.length})`}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((r, i) => (
                  <div key={i} style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: 16, padding: '16px 20px',
                    borderLeft: `4px solid ${RATING_COLORS[r.rating]}`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: r.comment ? 10 : 0, gap: 12 }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{r.name}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 10 }}>sem. {r.week_date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <Stars value={r.rating} size={14} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: RATING_COLORS[r.rating] }}>
                          {RATING_LABELS[r.rating]}
                        </span>
                      </div>
                    </div>
                    {r.comment && (
                      <div style={{
                        fontSize: 14, color: '#475569', lineHeight: 1.7,
                        fontStyle: 'italic', background: '#f8fafc',
                        borderRadius: 10, padding: '10px 14px',
                        border: '1px solid #f1f5f9',
                      }}>
                        « {r.comment} »
                      </div>
                    )}
                    {!r.comment && (
                      <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Pas de commentaire</div>
                    )}
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: '#94a3b8', fontSize: 13 }}>
                  Aucun avis pour ce filtre.
                </div>
              )}
            </div>

          </>
        )}
      </div>
    </div>
  )
}
