'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { sbSelect, getSharedState, setSharedState } from '@/lib/supabase'
import { MODULE_DATA } from '@/lib/modulesData'
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

  const submittedCount = Object.keys(responses).length
  const totalCount     = entrees.length
  const catMeta        = CATEGORIES.find(c => c.key === selectedCategory) || CATEGORIES[3]

  return (
    <>
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
                  {entrees.length > 0 ? entrees.map((e, i) => {
                    const name = e.fullName || `${e.nom} ${e.prenom}`.trim()
                    const done = !!responses[name]
                    const open = expanded === name
                    return (
                      <div key={i} style={{ borderBottom: i < entrees.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
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
                            <span style={{ fontSize: 13, color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
                          )}
                        </div>
                        {open && done && (
                          <div style={{ borderTop: '1px solid #f1f5f9' }}>
                            <ResponseDetail snap={responses[name]} />
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

          {/* Réponses hors-liste */}
          {Object.keys(responses).filter(n => !entrees.some(e => (e.fullName || `${e.nom} ${e.prenom}`.trim()) === n)).length > 0 && (
            <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Autres réponses reçues
                </span>
              </div>
              {Object.keys(responses)
                .filter(n => !entrees.some(e => (e.fullName || `${e.nom} ${e.prenom}`.trim()) === n))
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
                          <ResponseDetail snap={responses[name]} />
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
