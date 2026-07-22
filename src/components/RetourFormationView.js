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
  { key: 'acquis',     label: 'Acquis',     color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', icon: '✓' },
  { key: 'en-cours',   label: 'En cours',   color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: '◑' },
  { key: 'non-acquis', label: 'Non acquis', color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: '✗' },
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

function RateBar({ rate }) {
  if (rate === null) return (
    <div style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
      Remplissez les thèmes ci-dessus pour calculer le taux d'acquisition
    </div>
  )
  const color = rate >= 75 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626'
  const label = rate >= 75 ? 'Bonne acquisition' : rate >= 50 ? 'Acquisition partielle' : 'À renforcer'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Taux d'acquisition global</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color }}>{rate}%</span>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
        </div>
      </div>
      <div style={{ height: 10, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .5s' }} />
      </div>
    </div>
  )
}

// ── Fiche formé ───────────────────────────────────────────────────

const APPRECIATIONS = [
  { key: 'tres-bon',       label: 'Je pense que ça peut être un très bon élément',          solidBg: '#16a34a' },
  { key: 'accompagnement', label: "Aura vraiment besoin d'accompagnement mais ça ira !",    solidBg: '#d97706' },
  { key: 'complique',      label: 'Je pense que ça va être très compliqué',                 solidBg: '#dc2626' },
]

const COMMENTAIRE_OPTS = [
  { key: 'ras',            label: 'Rien à signaler', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  { key: 'peut-mieux',    label: 'Peut mieux faire', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { key: 'attention',     label: 'Attention',         color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
]

function FicheCollab({ entree, categoryKey, trainerName, weekDate }) {
  const [quizData, setQuizData]                 = useState([])
  const [assessments, setAssessments]           = useState({})
  const [attitudeStatus, setAttitudeStatus]     = useState(null)
  const [attitudeNote, setAttitudeNote]         = useState('')
  const [comprehensionStatus, setComprehensionStatus] = useState(null)
  const [comprehensionNote, setComprehensionNote]     = useState('')
  const [appreciation, setAppreciation]         = useState(null)
  const [saving, setSaving]                     = useState(false)
  const [loading, setLoading]                   = useState(true)
  const themes = CATEGORY_META[categoryKey]?.themes || THEMES_FRANCE
  const name = entree.fullName || `${entree.nom} ${entree.prenom}`.trim()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [moduleRows, reportRow] = await Promise.all([
        sbSelect('module_results', `collaborateur=eq.${encodeURIComponent(name)}`),
        sbSelect('formation_reports', `collaborateur=eq.${encodeURIComponent(name)}&week_date=eq.${weekDate}&trainer_name=eq.${encodeURIComponent(trainerName)}&limit=1`),
      ])
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
      const snap = reportRow?.[0]?.stats_snapshot || {}
      setAssessments(snap.theme_assessments || {})
      setAttitudeStatus(snap.attitude_status || null)
      setAttitudeNote(snap.attitude_note || '')
      setComprehensionStatus(snap.comprehension_status || null)
      setComprehensionNote(snap.comprehension_note || '')
      setAppreciation(snap.appreciation || null)
    } catch (e) {
      console.error('[RetourFormation] loadData', e)
    } finally {
      setLoading(false)
    }
  }, [name, weekDate, trainerName])

  useEffect(() => { loadData() }, [loadData])

  const buildSnap = (overrides = {}) => ({
    theme_assessments: assessments,
    attitude_status: attitudeStatus,
    attitude_note: attitudeNote,
    comprehension_status: comprehensionStatus,
    comprehension_note: comprehensionNote,
    appreciation,
    ...overrides,
  })

  const saveSnapshot = async (patch) => {
    setSaving(true)
    try {
      await sbUpsert(
        'formation_reports',
        {
          collaborateur: name,
          week_date: weekDate,
          trainer_name: trainerName,
          status: 'draft',
          stats_snapshot: patch,
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

  const setThemeStatus = async (moduleId, status) => {
    const next = { ...assessments, [moduleId]: status === assessments[moduleId] ? null : status }
    setAssessments(next)
    await saveSnapshot(buildSnap({ theme_assessments: next }))
  }

  const handleAttitudeStatus = async (key) => {
    const next = attitudeStatus === key ? null : key
    const note = next === 'ras' ? '' : attitudeNote
    setAttitudeStatus(next)
    if (next === 'ras') setAttitudeNote('')
    await saveSnapshot(buildSnap({ attitude_status: next, attitude_note: note }))
  }

  const handleAttitudeNote = async (val) => {
    setAttitudeNote(val)
    await saveSnapshot(buildSnap({ attitude_note: val }))
  }

  const handleComprehensionStatus = async (key) => {
    const next = comprehensionStatus === key ? null : key
    const note = next === 'ras' ? '' : comprehensionNote
    setComprehensionStatus(next)
    if (next === 'ras') setComprehensionNote('')
    await saveSnapshot(buildSnap({ comprehension_status: next, comprehension_note: note }))
  }

  const handleComprehensionNote = async (val) => {
    setComprehensionNote(val)
    await saveSnapshot(buildSnap({ comprehension_note: val }))
  }

  const toggleAppreciation = async (key) => {
    const next = appreciation === key ? null : key
    setAppreciation(next)
    await saveSnapshot(buildSnap({ appreciation: next }))
  }

  const rate = computeRate(assessments)

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>

      {/* Quiz results */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Résultats aux Quiz
          </span>
        </div>
        <div style={{ padding: '12px 18px' }}>
          {quizData.length === 0 ? (
            <div style={{ color: '#94a3b8', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
              Aucun résultat de quiz enregistré pour ce collaborateur.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quizData.map(({ moduleId, label, score, total }) => {
                const pct = total > 0 ? Math.round((score / total) * 100) : null
                const barColor = pct === null ? '#cbd5e1' : pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                const badgeBg  = pct === null ? '#f1f5f9' : pct >= 70 ? '#dcfce7' : pct >= 50 ? '#fef3c7' : '#fee2e2'
                return (
                  <div key={moduleId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{label}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: barColor,
                        background: badgeBg, borderRadius: 20, padding: '2px 10px',
                      }}>
                        {pct !== null ? `${score}/${total} — ${pct}%` : `${score}/${total}`}
                      </span>
                    </div>
                    {total > 0 && (
                      <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99, transition: 'width .4s' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Theme assessments */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Thèmes abordés
          </span>
          {saving && (
            <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Sauvegarde…</span>
          )}
        </div>
        <div style={{ padding: '8px 0' }}>
          {themes.map((moduleId, idx) => {
            const meta = MODULE_DATA[moduleId]
            if (!meta) return null
            const current = assessments[moduleId] || null
            const activeSt = STATUS_OPTIONS.find(o => o.key === current)
            return (
              <div
                key={moduleId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 18px',
                  borderBottom: idx < themes.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: activeSt ? `${activeSt.bg}66` : '#fff',
                  transition: 'background .15s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{meta.label}</div>
                  {meta.sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{meta.sub}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {STATUS_OPTIONS.map(opt => {
                    const active = current === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setThemeStatus(moduleId, opt.key)}
                        title={opt.label}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                          border: `1.5px solid ${active ? opt.border : '#e2e8f0'}`,
                          background: active ? opt.bg : '#fff',
                          color: active ? opt.color : '#94a3b8',
                          boxShadow: active ? `0 1px 3px ${opt.border}` : 'none',
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
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 22px' }}>
        <RateBar rate={rate} />
      </section>

      {/* Commentaires */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Commentaires du formateur
          </span>
          {saving && <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Sauvegarde…</span>}
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Attitude */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Attitude générale</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {COMMENTAIRE_OPTS.map(opt => {
                const active = attitudeStatus === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAttitudeStatus(opt.key)}
                    style={{
                      flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all .15s',
                      border: `1.5px solid ${active ? opt.border : '#e2e8f0'}`,
                      background: active ? opt.bg : '#fff',
                      color: active ? opt.color : '#94a3b8',
                      boxShadow: active ? `0 1px 4px ${opt.border}` : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {attitudeStatus && attitudeStatus !== 'ras' && (
              <textarea
                value={attitudeNote}
                onChange={e => setAttitudeNote(e.target.value)}
                onBlur={e => handleAttitudeNote(e.target.value)}
                placeholder="Précisez ce que vous avez observé…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: '#f8fafc',
                  fontSize: 13, color: '#1e293b', resize: 'vertical',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#94a3b8' }}
                onBlurCapture={e => { e.target.style.borderColor = '#e2e8f0' }}
              />
            )}
          </div>

          {/* Compréhension */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Compréhension des contenus</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {COMMENTAIRE_OPTS.map(opt => {
                const active = comprehensionStatus === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleComprehensionStatus(opt.key)}
                    style={{
                      flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all .15s',
                      border: `1.5px solid ${active ? opt.border : '#e2e8f0'}`,
                      background: active ? opt.bg : '#fff',
                      color: active ? opt.color : '#94a3b8',
                      boxShadow: active ? `0 1px 4px ${opt.border}` : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {comprehensionStatus && comprehensionStatus !== 'ras' && (
              <textarea
                value={comprehensionNote}
                onChange={e => setComprehensionNote(e.target.value)}
                onBlur={e => handleComprehensionNote(e.target.value)}
                placeholder="Précisez ce que vous avez observé…"
                rows={3}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: '#f8fafc',
                  fontSize: 13, color: '#1e293b', resize: 'vertical',
                  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => { e.target.style.borderColor = '#94a3b8' }}
                onBlurCapture={e => { e.target.style.borderColor = '#e2e8f0' }}
              />
            )}
          </div>

        </div>
      </section>

      {/* Appréciation globale */}
      <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Appréciation globale
          </span>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', gap: 10 }}>
          {APPRECIATIONS.map(opt => {
            const active = appreciation === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => toggleAppreciation(opt.key)}
                style={{
                  flex: 1, padding: '16px 8px', borderRadius: 14, cursor: 'pointer',
                  border: `2px solid ${active ? opt.solidBg : '#e2e8f0'}`,
                  background: active ? opt.solidBg : '#fff',
                  color: active ? '#fff' : '#94a3b8',
                  fontWeight: active ? 700 : 500, fontSize: 12,
                  lineHeight: 1.4, textAlign: 'center', transition: 'all .18s',
                  boxShadow: active ? `0 4px 14px ${opt.solidBg}55` : 'none',
                  fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
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
      <div style={{ color: '#94a3b8', fontSize: 14 }}>Aucun formé dans cette catégorie cette semaine.</div>
      <button className="detail-back" style={{ marginTop: 20 }} onClick={onBack}>← Retour</button>
    </div>
  )

  const selEntry = filtered[selected] || filtered[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button className="detail-back" onClick={onBack}>← Retour</button>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `rgba(${catMeta.rgb},0.1)`, border: `1px solid rgba(${catMeta.rgb},0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>
          {catMeta.icon}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>{catMeta.label}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {filtered.length} collaborateur{filtered.length > 1 ? 's' : ''} · Semaine du {weekDate}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
        marginBottom: 18, scrollbarWidth: 'none',
      }}>
        {filtered.map((e, i) => {
          const nm = e.fullName || `${e.nom} ${e.prenom}`.trim()
          const active = i === selected
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                flexShrink: 0, padding: '8px 18px', borderRadius: 99,
                border: active ? `2px solid ${catMeta.color}` : '1.5px solid #e2e8f0',
                background: active ? catMeta.color : '#fff',
                color: active ? '#fff' : '#475569',
                fontWeight: active ? 700 : 500,
                fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                whiteSpace: 'nowrap', boxShadow: active ? `0 2px 8px rgba(${catMeta.rgb},0.25)` : 'none',
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
      <div style={{ marginBottom: 20, color: '#64748b', fontSize: 14 }}>
        Choisissez la catégorie pour accéder aux fiches de retour de formation.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = counts[key] || 0
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                background: '#fff',
                border: '1.5px solid #e2e8f0',
                borderTop: `4px solid ${meta.color}`,
                borderRadius: 14, padding: '24px 18px', cursor: 'pointer',
                textAlign: 'left', transition: 'all .18s',
                display: 'flex', flexDirection: 'column', gap: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: 28, marginBottom: 2 }}>{meta.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{meta.label}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{meta.sub}</span>
              <div style={{ marginTop: 6 }}>
                {count > 0 ? (
                  <span style={{
                    display: 'inline-block', fontSize: 12, fontWeight: 700,
                    color: meta.color, background: `rgba(${meta.rgb},0.1)`,
                    border: `1px solid rgba(${meta.rgb},0.25)`,
                    borderRadius: 20, padding: '3px 10px',
                  }}>
                    {count} formé{count > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#cbd5e1' }}>Aucun formé</span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Export principal ──────────────────────────────────────────────

export default function RetourFormationView({ onBack, pName }) {
  const [entrees, setEntrees]   = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading]   = useState(true)
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
    <div id="dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px', background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      }}>
        {!category && (
          <button className="detail-back" onClick={onBack}>← Tableau de bord</button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>📝 Retour de formation</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Fiches de suivi · Semaine du {getWeekDate()}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
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
