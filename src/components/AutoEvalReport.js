'use client'
import { useMemo } from 'react'
import { MODULE_DATA } from '@/lib/modulesData'
import { classifyMagasin } from '@/lib/formationCategories'

function Stars({ value, size = 16 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, filter: s <= value ? 'none' : 'grayscale(1) brightness(0.4)' }}>⭐</span>
      ))}
    </span>
  )
}

const CAT_LABELS = {
  presentiel: '🏢 Présentiel · Paris',
  visio:      '💻 Visio · Province',
  belgique:   '🇧🇪 Belgique',
  tous:       '🌐 Toutes catégories',
}

function filterByCategory(entrees, responses, category) {
  const classify = e => classifyMagasin(e.magasin)
  const catMap = {
    presentiel: 'paris',
    visio:      'province',
    belgique:   'belgique',
  }
  const wanted = catMap[category] // undefined = tous

  const names = new Set(
    category === 'tous'
      ? Object.keys(responses)
      : entrees
          .filter(e => classify(e) === wanted)
          .map(e => e.fullName || `${e.nom} ${e.prenom}`.trim())
  )
  return Object.fromEntries(
    Object.entries(responses).filter(([n]) => names.has(n))
  )
}

function toStars(v) {
  if (typeof v === 'number') return v
  if (v === 'maitrise')    return 5
  if (v === 'en-cours')    return 3
  if (v === 'notions')     return 2
  if (v === 'non-compris') return 1
  return 0
}

function starColor(avg) {
  if (avg >= 4) return '#16a34a'
  if (avg >= 3) return '#d97706'
  return '#dc2626'
}

function ThemeStarRow({ label, avgStars, count, accompCount }) {
  if (!count) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Stars value={Math.round(avgStars)} size={13} />
          <span style={{ fontSize: 12, fontWeight: 800, color: starColor(avgStars) }}>{avgStars.toFixed(1)}</span>
          <span style={{ fontSize: 10, color: '#475569' }}>/ 5</span>
          {accompCount > 0 && <span style={{ fontSize: 11, color: '#0089ba', fontWeight: 700 }}>👥 ×{accompCount}</span>}
        </div>
      </div>
      <div style={{ height: 7, borderRadius: 99, overflow: 'hidden', background: '#334155' }}>
        <div style={{ width: `${(avgStars / 5) * 100}%`, background: starColor(avgStars), transition: 'width .4s' }} />
      </div>
    </div>
  )
}

function Quote({ text, name }) {
  return (
    <div style={{
      background: '#253247', border: '1px solid #334155',
      borderRadius: 12, padding: '14px 16px', marginBottom: 10,
    }}>
      <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
        « {text} »
      </div>
      {name && (
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, textAlign: 'right' }}>— {name}</div>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 11, fontWeight: 800, color: '#0089ba',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: 14, paddingBottom: 8,
        borderBottom: '1px solid #334155',
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

export default function AutoEvalReport({ responses, entrees, category, weekDate, onClose }) {
  const filtered = useMemo(() => filterByCategory(entrees, responses, category), [entrees, responses, category])

  const responseList = useMemo(() =>
    Object.entries(filtered).map(([name, snap]) => ({
      name,
      ae: snap?.auto_eval || {},
    })).filter(({ ae }) => Object.keys(ae).length > 0),
    [filtered]
  )

  const themeStats = useMemo(() => {
    const stats = {}
    for (const { ae } of responseList) {
      for (const themeId of (ae.themes_list || [])) {
        if (!stats[themeId]) stats[themeId] = { totalStars: 0, count: 0, accompCount: 0 }
        const s = ae.theme_self_assessments?.[themeId]
        const stars = toStars(s)
        if (stars > 0) {
          stats[themeId].totalStars += stars
          stats[themeId].count++
        }
        if (ae.accompagnement_themes?.includes(themeId)) stats[themeId].accompCount++
      }
    }
    return Object.entries(stats)
      .filter(([, s]) => s.count > 0)
      .map(([themeId, s]) => ({
        themeId,
        label: MODULE_DATA[themeId]?.label || themeId,
        avgStars: s.totalStars / s.count,
        count: s.count,
        accompCount: s.accompCount,
      }))
  }, [responseList])

  const byAvg      = [...themeStats].sort((a, b) => b.avgStars - a.avgStars)
  const byWeakest  = [...themeStats].sort((a, b) => a.avgStars - b.avgStars)
  const byAccomp   = [...themeStats].filter(s => s.accompCount > 0).sort((a, b) => b.accompCount - a.accompCount)

  const suggestions   = responseList.filter(r => r.ae.suggestions).map(r => ({ text: r.ae.suggestions, name: r.name }))
  const appreciations = responseList.filter(r => r.ae.appreciation_formation).map(r => ({ text: r.ae.appreciation_formation, name: r.name }))
  const progres       = responseList.filter(r => r.ae.progres).map(r => ({ text: r.ae.progres, name: r.name }))
  const ratingList    = responseList.filter(r => r.ae.rating).map(r => ({ name: r.name, rating: r.ae.rating, comment: r.ae.rating_comment }))
  const avgRating     = ratingList.length ? Math.round((ratingList.reduce((s, r) => s + r.rating, 0) / ratingList.length) * 10) / 10 : null

  const n = responseList.length

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#0f172a', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: '#1e293b', borderBottom: '1px solid #334155',
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>
            📊 Compte rendu auto-évaluation
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Semaine du {weekDate} · {CAT_LABELS[category] || category} · {n} réponse{n > 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: '#334155', border: 'none', borderRadius: 10,
            color: '#94a3b8', fontSize: 20, width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >×</button>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 20px 60px' }}>

        {n === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b', fontSize: 14 }}>
            Aucune réponse reçue pour cette catégorie.
          </div>
        ) : (
          <>
            {/* KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: avgRating ? 12 : 28 }}>
              {[
                { label: 'Réponses', value: n, color: '#0089ba' },
                {
                  label: 'Thèmes bien notés',
                  value: byAvg.filter(t => t.avgStars >= 4).length + '/' + themeStats.length,
                  color: '#16a34a',
                },
                {
                  label: 'À renforcer',
                  value: byWeakest.filter(t => t.avgStars < 3).length,
                  color: '#dc2626',
                },
              ].map(({ label, value, color }) => (
                <div key={label} style={{
                  background: '#1e293b', border: '1px solid #334155',
                  borderRadius: 14, padding: '16px 18px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Note moyenne */}
            {avgRating && (
              <div style={{
                background: '#1e293b', border: '1px solid #fde68a33',
                borderRadius: 14, padding: '16px 20px', marginBottom: 28,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Note de la formation</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Stars value={Math.round(avgRating)} size={20} />
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#f1f5f9' }}>{avgRating.toFixed(1)}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>/ 5 · {ratingList.length} avis</span>
                  </div>
                </div>
              </div>
            )}

            {/* Thèmes — du mieux noté au moins bien noté */}
            <Section title="Niveau par thème — du mieux noté au moins bien noté">
              {byAvg.map(s => (
                <ThemeStarRow key={s.themeId} label={s.label} avgStars={s.avgStars} count={s.count} accompCount={s.accompCount} />
              ))}
            </Section>

            {/* Thèmes à renforcer */}
            {byWeakest.some(s => s.avgStars < 3) && (
              <Section title="⚠️ Thèmes les moins bien notés">
                {byWeakest.filter(s => s.avgStars < 3).slice(0, 5).map(s => (
                  <div key={s.themeId} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 10, marginBottom: 8,
                    background: '#1e293b', border: '1px solid #334155',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{s.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <Stars value={Math.round(s.avgStars)} size={12} />
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626' }}>{s.avgStars.toFixed(1)}/5</span>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* Accompagnement */}
            {byAccomp.length > 0 && (
              <Section title="👥 Thèmes d'accompagnement les plus demandés">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {byAccomp.map(s => (
                    <div key={s.themeId} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', borderRadius: 20,
                      background: 'rgba(0,137,186,0.15)', border: '1px solid rgba(0,137,186,0.3)',
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#00abe9' }}>{s.label}</span>
                      <span style={{
                        fontSize: 11, fontWeight: 800, color: '#fff',
                        background: '#0089ba', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {s.accompCount}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Avis formation */}
            {ratingList.length > 0 && (
              <Section title={`⭐ Avis formation · ${avgRating?.toFixed(1)}/5 (${ratingList.length} avis)`}>
                {ratingList.map((r, i) => (
                  <div key={i} style={{ background: '#253247', border: '1px solid #334155', borderRadius: 12, padding: '12px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: r.comment ? 8 : 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{r.name}</span>
                      <Stars value={r.rating} size={14} />
                    </div>
                    {r.comment && (
                      <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>« {r.comment} »</div>
                    )}
                  </div>
                ))}
              </Section>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <Section title={`💡 Suggestions (${suggestions.length})`}>
                {suggestions.map((s, i) => <Quote key={i} text={s.text} name={s.name} />)}
              </Section>
            )}

            {/* Appréciation */}
            {appreciations.length > 0 && (
              <Section title={`❤️ Appréciation de la formation (${appreciations.length})`}>
                {appreciations.map((s, i) => <Quote key={i} text={s.text} name={s.name} />)}
              </Section>
            )}

            {/* Progrès */}
            {progres.length > 0 && (
              <Section title={`📈 Progrès perçus (${progres.length})`}>
                {progres.map((s, i) => <Quote key={i} text={s.text} name={s.name} />)}
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
