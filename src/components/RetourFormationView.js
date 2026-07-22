'use client'
import { useState, useEffect, useCallback } from 'react'
import { sbSelect, sbUpsert, getSharedState } from '@/lib/supabase'
import { classifyMagasin } from '@/lib/formationCategories'
import { MODULE_DATA } from '@/lib/modulesData'

// ── Constantes ────────────────────────────────────────────────────

const THEMES_FRANCE = [
  'entreprise', 'types-verres', 'pdm', 'optique', 'offres',
  'verre-progressif', 'trame-accueil', 'montures',
  'remboursement-france', 'parcours-rembourses', 'lpt-sante',
]
const THEMES_BELGIQUE = [
  'entreprise', 'types-verres', 'pdm', 'optique', 'offres',
  'verre-progressif', 'trame-accueil', 'montures', 'mutuelles-inami',
]

const CATEGORY_META = {
  paris:    { label: 'Île de France', sub: 'Présentiel Paris',     icon: '🏢', color: '#0089ba', rgb: '0,137,186',   themes: THEMES_FRANCE   },
  province: { label: 'Visio Province', sub: 'Formation à distance', icon: '💻', color: '#7c3aed', rgb: '124,58,237',  themes: THEMES_FRANCE   },
  belgique: { label: 'Belgique',       sub: 'Présentiel Belgique',  icon: '🇧🇪', color: '#db2777', rgb: '219,39,119',  themes: THEMES_BELGIQUE },
}

const STATUS_OPTIONS = [
  { key: 'acquis',     label: 'Acquis',      color: '#22c55e', bg: 'rgba(34,197,94,0.18)',   icon: '✓' },
  { key: 'en-cours',   label: 'En cours',    color: '#f59e0b', bg: 'rgba(245,158,11,0.18)',  icon: '◑' },
  { key: 'non-acquis', label: 'Non acquis',  color: '#ef4444', bg: 'rgba(239,68,68,0.18)',   icon: '✗' },
]

function effectiveCat(e) {
  return e._forceCat || classifyMagasin(e.magasin) || 'province'
}

function getWeekDate() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().slice(0, 10)
}

function computeRate(assessments) {
  const vals = Object.values(assessments || {}).filter(Boolean)
  if (!vals.length) return null
  const score = vals.reduce((s, v) => s + (v === 'acquis' ? 1 : v === 'en-cours' ? 0.5 : 0), 0)
  return Math.round((score / vals.length) * 100)
}

function RateCircle({ rate }) {
  if (rate === null) return (
    <div style={{ textAlign: 'center', color: 'var(--text-s)', fontSize: 13 }}>
      Remplissez les thèmes pour calculer le taux
    </div>
  )
  const color = rate >= 75 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 90, height: 90, borderRadius: '50%',
        background: `conic-gradient(${color} ${rate * 3.6}deg, rgba(255,255,255,0.08) 0)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 0 4px rgba(0,0,0,0.3), inset 0 0 0 6px var(--card)`,
      }}>
        <span style={{ fontSize: 22, fontWeight: 800, color }}>{rate}%</span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-s)', fontWeight: 600 }}>Taux d'acquisition global</span>
    </div>
  )
}

// ── Fiche formé ───────────────────────────────────────────────────

function FicheCollab({ entree, categoryKey, trainerName, weekDate }) {
  const [quizData, setQuizData]         = useState([])   // [{moduleId, label, score, total}]
  const [assessments, setAssessments]   = useState({})   // { moduleId: 'acquis'|'en-cours'|'non-acquis'|null }
  const [saving, setSaving]             = useState(false)
  const [loading, setLoading]           = useState(true)
  const themes = CATEGORY_META[categoryKey]?.themes || THEMES_FRANCE
  const name = entree.fullName || `${entree.nom} ${entree.prenom}`.trim()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [moduleRows, reportRow] = await Promise.all([
        sbSelect('module_results', `collaborateur=eq.${encodeURIComponent(name)}`),
        sbSelect('formation_reports', `collaborateur=eq.${encodeURIComponent(name)}&week_date=eq.${weekDate}&trainer_name=eq.${encodeURIComponent(trainerName)}&limit=1`),
      ])

      // Quiz data — group by module_id, keep best score per module
      const byModule = {}
      for (const r of moduleRows || []) {
        const mid = r.module_id || r.module
        if (!mid) continue
        const prev = byModule[mid]
        const sc = r.score ?? 0
        const tot = r.score_total ?? r.total ?? 0
        if (!prev || sc > prev.score) byModule[mid] = { moduleId: mid, label: MODULE_DATA[mid]?.label || mid, score: sc, total: tot }
      }
      setQuizData(Object.values(byModule))

      // Assessments from formation_report
      const snap = reportRow?.[0]?.stats_snapshot || {}
      setAssessments(snap.theme_assessments || {})
    } catch (e) {
      console.error('[RetourFormation] loadData', e)
    } finally {
      setLoading(false)
    }
  }, [name, weekDate, trainerName])

  useEffect(() => { loadData() }, [loadData])

  const setThemeStatus = async (moduleId, status) => {
    const next = { ...assessments, [moduleId]: status === assessments[moduleId] ? null : status }
    setAssessments(next)
    setSaving(true)
    try {
      await sbUpsert(
        'formation_reports',
        {
          collaborateur: name,
          week_date: weekDate,
          trainer_name: trainerName,
          status: 'draft',
          stats_snapshot: { theme_assessments: next },
          updated_at: new Date().toISOString(),
        },
        'collaborateur,week_date,trainer_name'
      )
    } catch (e) {
      console.error('[RetourFormation] save', e)
    } finally {
      setSaving(false)
    }
  }

  const rate = computeRate(assessments)

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-s)' }}>Chargement…</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* Quiz results */}
      <section>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          Résultats aux Quiz
        </h3>
        {quizData.length === 0 ? (
          <div style={{ color: 'var(--text-s)', fontSize: 13, fontStyle: 'italic' }}>
            Aucun résultat de quiz enregistré pour ce collaborateur.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quizData.map(({ moduleId, label, score, total }) => {
              const pct = total > 0 ? Math.round((score / total) * 100) : null
              const barColor = pct === null ? '#555' : pct >= 70 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444'
              return (
                <div key={moduleId} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '10px 14px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: barColor }}>
                      {pct !== null ? `${score}/${total} (${pct}%)` : `${score}/${total}`}
                    </span>
                  </div>
                  {total > 0 && (
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width .4s' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Theme assessments */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Thèmes abordés
          </h3>
          {saving && <span style={{ fontSize: 11, color: 'var(--text-s)' }}>Sauvegarde…</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {themes.map(moduleId => {
            const meta = MODULE_DATA[moduleId]
            if (!meta) return null
            const current = assessments[moduleId] || null
            return (
              <div key={moduleId} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
                borderRadius: 10, padding: '10px 12px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {meta.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-s)' }}>{meta.sub}</div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  {STATUS_OPTIONS.map(opt => {
                    const active = current === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setThemeStatus(moduleId, opt.key)}
                        title={opt.label}
                        style={{
                          padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                          border: active ? `1.5px solid ${opt.color}` : '1px solid var(--border)',
                          background: active ? opt.bg : 'transparent',
                          color: active ? opt.color : 'var(--text-s)',
                          transition: 'all .15s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Global rate */}
      <section style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '24px 20px',
      }}>
        <RateCircle rate={rate} />
      </section>
    </div>
  )
}

// ── Vue liste formés (catégorie choisie) ─────────────────────────

function CollabListView({ entrees, categoryKey, trainerName, onBack }) {
  const [selected, setSelected] = useState(null)
  const weekDate = getWeekDate()
  const catMeta = CATEGORY_META[categoryKey] || {}

  const filtered = entrees.filter(e => effectiveCat(e) === categoryKey)

  useEffect(() => {
    if (filtered.length > 0 && !selected) setSelected(0)
  }, [filtered.length])

  if (filtered.length === 0) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{catMeta.icon}</div>
      <div style={{ color: 'var(--text-s)' }}>Aucun formé dans cette catégorie cette semaine.</div>
      <button className="detail-back" style={{ marginTop: 20 }} onClick={onBack}>← Retour</button>
    </div>
  )

  const selEntry = filtered[selected] || filtered[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="detail-back" onClick={onBack}>← Retour</button>
        <span style={{ fontSize: 22, }}>{catMeta.icon}</span>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 17 }}>{catMeta.label}</div>
          <div style={{ fontSize: 12, color: 'var(--text-s)' }}>{filtered.length} collaborateur{filtered.length > 1 ? 's' : ''} · Semaine du {weekDate}</div>
        </div>
      </div>

      {/* Tabs scrollables */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8,
        borderBottom: '1px solid var(--border)', marginBottom: 20,
        scrollbarWidth: 'thin',
      }}>
        {filtered.map((e, i) => {
          const nm = e.fullName || `${e.nom} ${e.prenom}`.trim()
          const active = i === selected
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 10,
                border: active ? `1.5px solid ${catMeta.color}` : '1px solid var(--border)',
                background: active ? `rgba(${catMeta.rgb},0.15)` : 'var(--card)',
                color: active ? catMeta.color : 'var(--text-m)',
                fontWeight: active ? 700 : 500,
                fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                whiteSpace: 'nowrap',
              }}
            >
              {nm}
            </button>
          )
        })}
      </div>

      {/* Fiche */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selEntry && (
          <FicheCollab
            key={`${selEntry.fullName || selEntry.nom}-${categoryKey}`}
            entree={selEntry}
            categoryKey={categoryKey}
            trainerName={trainerName}
            weekDate={weekDate}
          />
        )}
      </div>
    </div>
  )
}

// ── Sélecteur de catégorie ────────────────────────────────────────

function CategorySelector({ entrees, onSelect }) {
  const counts = {}
  for (const e of entrees) {
    const cat = effectiveCat(e)
    counts[cat] = (counts[cat] || 0) + 1
  }

  return (
    <div>
      <div style={{ marginBottom: 24, color: 'var(--text-s)', fontSize: 14 }}>
        Choisissez la catégorie pour accéder aux fiches de retour.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = counts[key] || 0
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '28px 20px', cursor: 'pointer',
                textAlign: 'center', transition: 'border-color .2s',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}
            >
              <span style={{ fontSize: 36 }}>{meta.icon}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{meta.label}</span>
              <span style={{ fontSize: 12, color: 'var(--text-s)' }}>{meta.sub}</span>
              <span style={{
                marginTop: 4, fontSize: 13, fontWeight: 700,
                color: count ? meta.color : 'var(--text-s)',
                background: count ? `rgba(${meta.rgb},0.12)` : 'transparent',
                border: count ? `1px solid ${meta.color}33` : 'none',
                borderRadius: 20, padding: count ? '2px 10px' : 0,
              }}>
                {count ? `${count} formé${count > 1 ? 's' : ''}` : 'Aucun formé'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Export principal ──────────────────────────────────────────────

export default function RetourFormationView({ onBack, pName }) {
  const [entrees, setEntrees]     = useState([])
  const [category, setCategory]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const trainerName = pName || 'Formateur'

  useEffect(() => {
    const load = async () => {
      try {
        const state = await getSharedState()
        const data = state?.entrees_data || JSON.parse(localStorage.getItem('entrees_data') || '[]')
        setEntrees(data)
      } catch {
        const data = JSON.parse(localStorage.getItem('entrees_data') || '[]')
        setEntrees(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div id="dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        {category ? null : <button className="detail-back" onClick={onBack}>← Tableau de bord</button>}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>Retour de formation</div>
          <div style={{ fontSize: 12, color: 'var(--text-s)' }}>Fiches de suivi des collaborateurs · Semaine du {getWeekDate()}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-s)' }}>Chargement…</div>
        ) : category ? (
          <CollabListView
            entrees={entrees}
            categoryKey={category}
            trainerName={trainerName}
            onBack={() => setCategory(null)}
          />
        ) : (
          <CategorySelector entrees={entrees} onSelect={setCategory} />
        )}
      </div>
    </div>
  )
}
