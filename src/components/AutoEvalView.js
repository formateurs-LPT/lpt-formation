'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { sbSelect, getSharedState, setSharedState } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
import { classifyMagasin } from '@/lib/formationCategories'
import AutoEvalReport from './AutoEvalReport'

function getWeekDate() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().slice(0, 10)
}

const STATUS_LABELS = { 'acquis': 'Acquis', 'en-cours': 'En cours', 'non-acquis': 'Non acquis' }
const STATUS_COLORS = { 'acquis': '#16a34a', 'en-cours': '#d97706', 'non-acquis': '#dc2626' }
const STATUS_BG    = { 'acquis': '#dcfce7', 'en-cours': '#fef3c7', 'non-acquis': '#fee2e2' }

function Stars({ value, size = 16 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ fontSize: size, filter: s <= value ? 'none' : 'grayscale(1) brightness(0.5)' }}>⭐</span>
      ))}
    </span>
  )
}

const CATEGORIES = [
  { key: 'presentiel', label: 'Présentiel', sub: 'Paris & IDF', icon: '🏢', color: '#0089ba' },
  { key: 'visio',      label: 'Visio',      sub: 'Province',    icon: '💻', color: '#7c3aed' },
  { key: 'belgique',   label: 'Belgique',   sub: '',            icon: '🇧🇪', color: '#db2777' },
  { key: 'tous',       label: 'Tous',       sub: 'Tout le monde', icon: '🌐', color: '#64748b' },
]

function ResponseDetail({ snap }) {
  const ae = snap?.auto_eval || {}
  const themes = ae.themes_list || []
  const assessments = ae.theme_self_assessments || {}
  const accomp = ae.accompagnement_themes || []

  return (
    <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

      {themes.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Auto-évaluation des thèmes
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {themes.map(t => {
              const meta = MODULE_DATA[t]
              const status = assessments[t]
              return (
                <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{meta?.label || t}</span>
                  {status ? (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      color: STATUS_COLORS[status], background: STATUS_BG[status],
                    }}>
                      {STATUS_LABELS[status]}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: '#cbd5e1', fontStyle: 'italic' }}>—</span>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {[
        { key: 'progres',               label: 'Progrès perçus',               value: ae.progres },
        { key: 'appreciation_formation', label: 'Appréciation de la formation', value: ae.appreciation_formation },
        { key: 'suggestions',           label: 'Suggestions',                  value: ae.suggestions },
      ].map(({ key, label, value }) => value ? (
        <section key={key}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            {label}
          </div>
          <div style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.7, background: '#f8fafc', borderRadius: 10, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
            {value}
          </div>
        </section>
      ) : null)}

      {accomp.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Thèmes d'accompagnement souhaités
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {accomp.map(t => (
              <span key={t} style={{
                padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: 'rgba(0,171,233,0.1)', color: '#0089ba',
                border: '1px solid rgba(0,171,233,0.25)',
              }}>
                {MODULE_DATA[t]?.label || t}
              </span>
            ))}
          </div>
        </section>
      )}

      {ae.rating && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Avis formation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: ae.rating_comment ? 10 : 0 }}>
            <Stars value={ae.rating} size={18} />
            <span style={{ fontSize: 13, fontWeight: 700, color: ae.rating >= 4 ? '#16a34a' : ae.rating === 3 ? '#d97706' : '#dc2626' }}>
              {['','Insuffisant','Passable','Bien','Très bien','Excellent !'][ae.rating]}
            </span>
          </div>
          {ae.rating_comment && (
            <div style={{ fontSize: 13, color: '#1e293b', lineHeight: 1.7, background: '#f8fafc', borderRadius: 10, padding: '10px 14px', border: '1px solid #f1f5f9', fontStyle: 'italic' }}>
              « {ae.rating_comment} »
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function ParticipantRecapModal({ name, snap, onClose }) {
  const ae = snap?.auto_eval || {}
  const themes    = ae.themes_list || []
  const assessments = ae.theme_self_assessments || {}
  const accomp    = ae.accompagnement_themes || []

  const acquis    = themes.filter(t => assessments[t] === 'acquis')
  const enCours   = themes.filter(t => assessments[t] === 'en-cours')
  const nonAcquis = themes.filter(t => assessments[t] === 'non-acquis')

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 24, width: 580, maxWidth: '100%', maxHeight: '88vh', overflow: 'auto', boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}
      >
        {/* Header sombre */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', padding: '24px 28px', borderRadius: '24px 24px 0 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: ae.rating || acquis.length || enCours.length || nonAcquis.length ? 20 : 0 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>
                Récap auto-évaluation
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{name}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              {ae.rating && (
                <div style={{ textAlign: 'center' }}>
                  <Stars value={ae.rating} size={18} />
                  <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4, color: ae.rating >= 4 ? '#22c55e' : ae.rating === 3 ? '#f59e0b' : '#f87171' }}>
                    {['','Insuffisant','Passable','Bien','Très bien','Excellent !'][ae.rating]}
                  </div>
                </div>
              )}
              <button
                onClick={onClose}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, width: 34, height: 34, cursor: 'pointer', fontSize: 15, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >✕</button>
            </div>
          </div>
          {/* Stats strip */}
          {(acquis.length + enCours.length + nonAcquis.length) > 0 && (
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { count: acquis.length,    label: 'Acquis',     color: '#22c55e', bg: 'rgba(34,197,94,0.18)' },
                { count: enCours.length,   label: 'En cours',   color: '#f59e0b', bg: 'rgba(245,158,11,0.18)' },
                { count: nonAcquis.length, label: 'Non acquis', color: '#f87171', bg: 'rgba(248,113,113,0.18)' },
              ].filter(g => g.count > 0).map(({ count, label, color, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 12, padding: '10px 16px', textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color, opacity: 0.85, marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Corps */}
        <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Thèmes non acquis en premier */}
          {[
            { key: 'non-acquis', list: nonAcquis, label: 'Non acquis',  color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: '✗' },
            { key: 'en-cours',   list: enCours,   label: 'En cours',    color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: '◑' },
            { key: 'acquis',     list: acquis,     label: 'Acquis',      color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', icon: '✓' },
          ].filter(g => g.list.length > 0).map(g => (
            <section key={g.key}>
              <div style={{ fontSize: 11, fontWeight: 800, color: g.color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>{g.icon}</span> {g.label} ({g.list.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {g.list.map(t => (
                  <span key={t} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: g.bg, color: g.color, border: `1px solid ${g.border}` }}>
                    {MODULE_DATA[t]?.label || t}
                  </span>
                ))}
              </div>
            </section>
          ))}

          {/* Accompagnement */}
          {accomp.length > 0 && (
            <section style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 14, padding: '16px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                👥 Accompagnement souhaité ({accomp.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {accomp.map(t => (
                  <span key={t} style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: 'rgba(0,137,186,0.12)', color: '#0089ba', border: '1px solid rgba(0,137,186,0.3)' }}>
                    {MODULE_DATA[t]?.label || t}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Suggestions */}
          {ae.suggestions && (
            <section>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                💡 Suggestions
              </div>
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 14, padding: '14px 18px', fontSize: 14, color: '#1e293b', lineHeight: 1.7, fontStyle: 'italic' }}>
                « {ae.suggestions} »
              </div>
            </section>
          )}

          {/* Commentaire note */}
          {ae.rating_comment && (
            <section>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                ⭐ Commentaire
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '14px 18px', fontSize: 14, color: '#1e293b', lineHeight: 1.7, fontStyle: 'italic' }}>
                « {ae.rating_comment} »
              </div>
            </section>
          )}

          {!ae.suggestions && !ae.rating_comment && accomp.length === 0 && acquis.length === 0 && enCours.length === 0 && nonAcquis.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 13 }}>Aucune donnée disponible.</div>
          )}

        </div>
      </div>
    </div>
  )
}

export default function AutoEvalView({ onBack }) {
  const weekDate = getWeekDate()
  const [isActive,        setIsActive]        = useState(false)
  const [entrees,         setEntrees]         = useState([])
  const [responses,       setResponses]       = useState({})
  const [expanded,        setExpanded]        = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [toggling,        setToggling]        = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('tous')
  const [showReport,      setShowReport]      = useState(false)
  const [showComments,    setShowComments]    = useState(false)
  const [showRecap,       setShowRecap]       = useState(null) // nom du participant ou null
  const [redoing,         setRedoing]         = useState(null) // nom ou 'all' en cours
  const firstLoad = useRef(true)

  const load = useCallback(async () => {
    try {
      const [state, reports] = await Promise.all([
        getSharedState(),
        sbSelect('formation_reports', `week_date=eq.${weekDate}&trainer_name=eq.__auto_eval__`),
      ])
      setIsActive(state?.tv_screen === 'auto-eval')
      setEntrees(state?.entrees_data || [])
      // Read saved category only on first load so the UI selector isn't overridden on polls
      if (firstLoad.current && state?.auto_eval_category) {
        setSelectedCategory(state.auto_eval_category)
        firstLoad.current = false
      }
      const byCollab = {}
      for (const r of (reports || [])) byCollab[r.collaborateur] = r.stats_snapshot
      setResponses(byCollab)
    } catch (e) {
      console.error('[AutoEvalView] load', e)
    } finally {
      setLoading(false)
      firstLoad.current = false
    }
  }, [weekDate])

  useEffect(() => {
    load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [load])

  const launch = async () => {
    setToggling(true)
    await setSharedState({ tv_screen: 'auto-eval', auto_eval_category: selectedCategory })
    setIsActive(true)
    setToggling(false)
  }

  const stop = async () => {
    setToggling(true)
    await setSharedState({ tv_screen: null })
    setIsActive(false)
    setToggling(false)
  }

  const catMeta = CATEGORIES.find(c => c.key === selectedCategory) || CATEGORIES[3]

  // Reset l'item ouvert si on change de catégorie
  useEffect(() => { setExpanded(null) }, [selectedCategory])

  // Correspondance catégorie UI → valeur classifyMagasin
  const CAT_CLASSIFY = { presentiel: 'paris', visio: 'province', belgique: 'belgique' }

  // Formés filtrés par catégorie sélectionnée
  const filteredEntrees = useMemo(() => {
    if (selectedCategory === 'tous') return entrees
    const want = CAT_CLASSIFY[selectedCategory]
    return entrees.filter(e => classifyMagasin(e.magasin) === want)
  }, [entrees, selectedCategory])

  // Noms des formés filtrés (pour filtrer les réponses)
  const filteredNameSet = useMemo(() =>
    new Set(filteredEntrees.map(e => e.fullName || `${e.nom} ${e.prenom}`.trim())),
    [filteredEntrees]
  )

  // Réponses filtrées : uniquement les participants de la catégorie
  const filteredResponses = useMemo(() => {
    if (selectedCategory === 'tous') return responses
    return Object.fromEntries(
      Object.entries(responses).filter(([name]) => filteredNameSet.has(name))
    )
  }, [responses, selectedCategory, filteredNameSet])

  const submittedCount = Object.keys(filteredResponses).length
  const totalCount     = filteredEntrees.length

  const ratingList = useMemo(() =>
    Object.entries(filteredResponses)
      .map(([name, snap]) => ({ name, rating: snap?.auto_eval?.rating, comment: snap?.auto_eval?.rating_comment }))
      .filter(r => r.rating),
    [filteredResponses]
  )
  const avgRating = ratingList.length
    ? Math.round((ratingList.reduce((s, r) => s + r.rating, 0) / ratingList.length) * 10) / 10
    : null

  const handleRedo = async (name) => {
    setRedoing(name)
    try {
      const current = (await import('@/lib/supabase').then(m => m.getSharedState()))?.auto_eval_redo_names
      const existing = Array.isArray(current) ? current : []
      const next = existing.includes(name) ? existing : [...existing, name]
      await setSharedState({ auto_eval_redo_names: next, tv_screen: 'auto-eval' })
      await load()
    } finally { setRedoing(null) }
  }

  return (
    <>
      {showRecap && (
        <ParticipantRecapModal
          name={showRecap}
          snap={filteredResponses[showRecap] || responses[showRecap]}
          onClose={() => setShowRecap(null)}
        />
      )}

      {showReport && (
        <AutoEvalReport
          responses={responses}
          entrees={entrees}
          category={selectedCategory}
          weekDate={weekDate}
          onClose={() => setShowReport(false)}
        />
      )}

      <div id="dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#f8fafc' }}>

        {/* Header */}
        <div style={{
          padding: '18px 24px', background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
        }}>
          <button className="detail-back" onClick={onBack}>← Tableau de bord</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>📋 Auto-évaluation</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Questionnaire fin de formation · Semaine du {weekDate}
            </div>
          </div>
          {submittedCount > 0 && (
            <button
              onClick={() => setShowReport(true)}
              style={{
                padding: '10px 16px', borderRadius: 12, border: 'none',
                background: '#0f172a', color: '#fff',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 7,
                flexShrink: 0,
              }}
            >
              📊 Compte rendu
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>

          {/* Bloc lancer/stopper */}
          <section style={{
            background: '#fff', border: `1.5px solid ${isActive ? '#bbf7d0' : '#e2e8f0'}`,
            borderRadius: 16, padding: '20px 22px', marginBottom: 22,
            transition: 'border-color .2s',
          }}>
            {isActive ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 0 3px #dcfce7' }} />
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#16a34a' }}>Module actif</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                      background: catMeta.color + '18', color: catMeta.color,
                      border: `1px solid ${catMeta.color}40`,
                    }}>
                      {catMeta.icon} {catMeta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Les formés voient le questionnaire sur leur téléphone
                  </div>
                </div>
                <button
                  onClick={stop}
                  disabled={toggling}
                  style={{
                    padding: '10px 20px', borderRadius: 12, border: '1.5px solid #fecaca',
                    background: '#fee2e2', color: '#dc2626', fontWeight: 700, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  }}
                >
                  Terminer ✕
                </button>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                  Lancer l'auto-évaluation
                </div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 18 }}>
                  Choisissez le groupe à évaluer, puis lancez le questionnaire.
                </div>

                {/* Sélecteur de catégorie */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                  {CATEGORIES.map(cat => {
                    const active = selectedCategory === cat.key
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key)}
                        style={{
                          padding: '12px 8px', borderRadius: 12, cursor: 'pointer',
                          fontFamily: 'inherit', textAlign: 'center',
                          border: active ? `2px solid ${cat.color}` : '1.5px solid #e2e8f0',
                          background: active ? cat.color + '12' : '#f8fafc',
                          transition: 'all .15s',
                          outline: 'none',
                        }}
                      >
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{cat.icon}</div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: active ? cat.color : '#334155' }}>
                          {cat.label}
                        </div>
                        {cat.sub && (
                          <div style={{ fontSize: 10, color: active ? cat.color + 'cc' : '#94a3b8', marginTop: 2 }}>
                            {cat.sub}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={launch}
                    disabled={toggling}
                    style={{
                      padding: '12px 28px', borderRadius: 14, border: 'none',
                      background: '#0f172a', color: '#fff', fontWeight: 800, fontSize: 14,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 14px rgba(15,23,42,0.2)',
                    }}
                  >
                    🚀 Lancer · {catMeta.icon} {catMeta.label}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Progression */}
          {(totalCount > 0 || submittedCount > 0) && (
            <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: 22 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Réponses reçues
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                  {submittedCount} / {totalCount || '?'}
                </span>
              </div>

              {totalCount > 0 && (
                <div style={{ padding: '10px 18px 0', background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
                    <div style={{
                      width: `${Math.round((submittedCount / totalCount) * 100)}%`,
                      height: '100%', background: '#16a34a', borderRadius: 99, transition: 'width .4s',
                    }} />
                  </div>
                </div>
              )}

              {loading ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
              ) : (
                <div>
                  {filteredEntrees.length > 0 ? filteredEntrees.map((e, i) => {
                    const name = e.fullName || `${e.nom} ${e.prenom}`.trim()
                    const done = !!filteredResponses[name]
                    const open = expanded === name
                    return (
                      <div key={i} style={{ borderBottom: i < filteredEntrees.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                        <div
                          onClick={() => done && setExpanded(open ? null : name)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 18px',
                            cursor: done ? 'pointer' : 'default',
                            background: open ? '#f8fafc' : '#fff',
                            transition: 'background .1s',
                          }}
                        >
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                            background: done ? '#dcfce7' : '#f1f5f9',
                            border: `1.5px solid ${done ? '#bbf7d0' : '#e2e8f0'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14,
                          }}>
                            {done ? '✓' : '○'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{name}</div>
                            {done && (
                              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>A répondu · Cliquer pour voir les réponses</div>
                            )}
                          </div>
                          {done && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <button
                                onClick={e => { e.stopPropagation(); setShowRecap(name) }}
                                style={{
                                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                                  background: 'rgba(0,137,186,0.1)', border: '1px solid rgba(0,137,186,0.3)',
                                  color: '#0089ba', cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1.4,
                                }}
                              >
                                📋 Récap
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); handleRedo(name) }}
                                disabled={redoing !== null}
                                title="Renvoyer le questionnaire à ce formé"
                                style={{
                                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 8,
                                  background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                                  color: '#d97706', cursor: redoing ? 'wait' : 'pointer', fontFamily: 'inherit',
                                  lineHeight: 1.4,
                                }}
                              >
                                {redoing === name ? '…' : 'Renvoyer'}
                              </button>
                              <span style={{ fontSize: 13, color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
                            </div>
                          )}
                        </div>
                        {open && done && (
                          <div style={{ borderTop: '1px solid #f1f5f9' }}>
                            <ResponseDetail snap={filteredResponses[name]} />
                          </div>
                        )}
                      </div>
                    )
                  }) : (
                    <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      Aucun formé enregistré cette semaine.
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Widget note moyenne */}
          {avgRating !== null && (
            <section
              onClick={() => setShowComments(true)}
              style={{
                background: '#fff', border: '1.5px solid #fde68a',
                borderRadius: 16, padding: '18px 22px', marginBottom: 22,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 20,
                transition: 'box-shadow .15s',
                boxShadow: '0 2px 12px rgba(245,158,11,0.1)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 24px rgba(245,158,11,0.22)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(245,158,11,0.1)' }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Note de la formation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Stars value={Math.round(avgRating)} size={22} />
                  <span style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{avgRating.toFixed(1)}</span>
                  <span style={{ fontSize: 13, color: '#64748b' }}>/ 5 · {ratingList.length} avis</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>
                Voir les commentaires →
              </div>
            </section>
          )}

          {/* Modal commentaires */}
          {showComments && (
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
              onClick={() => setShowComments(false)}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{ background: '#fff', borderRadius: 20, padding: '24px 26px', width: 520, maxWidth: '100%', maxHeight: '80vh', overflow: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>⭐ Avis formation</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                      Moyenne : <strong>{avgRating?.toFixed(1)}/5</strong> · {ratingList.length} avis
                    </div>
                  </div>
                  <button onClick={() => setShowComments(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {ratingList.map((r, i) => (
                    <div key={i} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: r.comment ? 8 : 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{r.name}</span>
                        <Stars value={r.rating} size={15} />
                      </div>
                      {r.comment && (
                        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, fontStyle: 'italic' }}>« {r.comment} »</div>
                      )}
                    </div>
                  ))}
                  {ratingList.every(r => !r.comment) && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '12px 0' }}>Aucun commentaire laissé.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Réponses hors-liste (uniquement pour "Tous" — quand catégorie spécifique, on ne sait pas classer les inconnus) */}
          {selectedCategory === 'tous' && Object.keys(filteredResponses).filter(n => !filteredEntrees.some(e => (e.fullName || `${e.nom} ${e.prenom}`.trim()) === n)).length > 0 && (
            <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Autres réponses reçues
                </span>
              </div>
              {Object.keys(filteredResponses)
                .filter(n => !filteredEntrees.some(e => (e.fullName || `${e.nom} ${e.prenom}`.trim()) === n))
                .map((name, i, arr) => {
                  const open = expanded === name
                  return (
                    <div key={name} style={{ borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <div
                        onClick={() => setExpanded(open ? null : name)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', cursor: 'pointer' }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#dcfce7', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✓</div>
                        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{name}</div>
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
                      </div>
                      {open && (
                        <div style={{ borderTop: '1px solid #f1f5f9' }}>
                          <ResponseDetail snap={filteredResponses[name]} />
                        </div>
                      )}
                    </div>
                  )
                })
              }
            </section>
          )}

        </div>
      </div>
    </>
  )
}
