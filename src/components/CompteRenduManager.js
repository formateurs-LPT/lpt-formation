'use client'
import { MODULE_DATA } from '@/lib/modulesData'

// ── Constantes ────────────────────────────────────────────────────

const THEMES_FRANCE   = ['entreprise','types-verres','pdm','optique','offres','verre-progressif','trame-accueil','montures','remboursement-france','parcours-rembourses','lpt-sante']
const THEMES_BELGIQUE = ['entreprise','types-verres','pdm','optique','offres','verre-progressif','trame-accueil','montures','mutuelles-inami']

const APPRECIATION_META = {
  'tres-bon':       { label: 'Très bon potentiel',                                             bg: '#16a34a', light: '#dcfce7', border: '#bbf7d0', icon: '🌟' },
  'accompagnement': { label: 'Aura besoin d\'accompagnement, mais ça ira !',                   bg: '#d97706', light: '#fef3c7', border: '#fde68a', icon: '🤝' },
  'complique':      { label: 'Ça va être compliqué — accompagnement renforcé nécessaire',      bg: '#dc2626', light: '#fee2e2', border: '#fecaca', icon: '⚠️' },
}

const COMMENTAIRE_META = {
  'ras':         { label: 'Rien à signaler', bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
  'peut-mieux':  { label: 'Peut mieux faire', bg: '#fef3c7', color: '#d97706', border: '#fde68a' },
  'attention':   { label: 'Attention', bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
}

function computeRate(assessments) {
  const vals = Object.values(assessments || {}).filter(Boolean)
  if (!vals.length) return null
  const score = vals.reduce((s, v) => s + (v === 'acquis' ? 1 : v === 'en-cours' ? 0.5 : 0), 0)
  return Math.round((score / vals.length) * 100)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Sous-composants ───────────────────────────────────────────────

function SectionHead({ children, accent = '#0f172a' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 3, height: 20, background: accent, borderRadius: 2, flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {children}
      </span>
    </div>
  )
}

function ThemeCol({ title, themes, assessments, color, bg, border, icon }) {
  const items = themes.filter(t => assessments[t] === (title === 'Acquis' ? 'acquis' : title === 'En cours' ? 'en-cours' : 'non-acquis'))
  if (items.length === 0) return null
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{
        background: bg, border: `1.5px solid ${border}`, borderRadius: 14,
        overflow: 'hidden',
      }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 12, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{title}</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color, opacity: 0.7 }}>{items.length}</span>
        </div>
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map(t => {
            const meta = MODULE_DATA[t]
            return (
              <div key={t} style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', lineHeight: 1.3 }}>
                {meta?.label || t}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────

export default function CompteRenduManager({ data }) {
  const {
    collaborateur,
    trainerName,
    weekDate,
    categoryKey,
    assessments = {},
    attitudeStatus,
    attitudeNote,
    comprehensionStatus,
    comprehensionNote,
    appreciation,
  } = data || {}

  const themes = categoryKey === 'belgique' ? THEMES_BELGIQUE : THEMES_FRANCE
  const rate = computeRate(assessments)
  const appMeta = APPRECIATION_META[appreciation]

  const acquis    = themes.filter(t => assessments[t] === 'acquis')
  const enCours   = themes.filter(t => assessments[t] === 'en-cours')
  const nonAcquis = themes.filter(t => assessments[t] === 'non-acquis')
  const nonRenseigne = themes.filter(t => !assessments[t])

  const rateColor = rate === null ? '#64748b' : rate >= 75 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626'

  return (
    <div style={{
      fontFamily: 'DM Sans, system-ui, sans-serif',
      background: '#fff',
      maxWidth: 780,
      margin: '0 auto',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
    }}>

      {/* ── En-tête ── */}
      <div style={{
        background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 60%, #00abe9 150%)',
        padding: '32px 36px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Cercle décoratif */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(0,171,233,0.12)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: 60, width: 140, height: 140, borderRadius: '50%', background: 'rgba(0,171,233,0.07)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,171,233,0.9)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 10 }}>
              Lunettes Pour Tous · Compte rendu de formation
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8, lineHeight: 1.15 }}>
              {collaborateur || '—'}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6 }}>
              {weekDate && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  📅 Formation du {formatDate(weekDate)}
                </span>
              )}
              {trainerName && (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                  👤 Formateur : {trainerName}
                </span>
              )}
            </div>
          </div>

          {/* Badge taux */}
          {rate !== null && (
            <div style={{
              flexShrink: 0, textAlign: 'center',
              background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.15)',
              borderRadius: 16, padding: '14px 20px',
            }}>
              <div style={{ fontSize: 32, fontWeight: 900, color: rate >= 75 ? '#4ade80' : rate >= 50 ? '#fbbf24' : '#f87171', lineHeight: 1 }}>
                {rate}%
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                Acquisition
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Barre de progression ── */}
      {rate !== null && (
        <div style={{ height: 6, background: '#e2e8f0' }}>
          <div style={{ width: `${rate}%`, height: '100%', background: rateColor, transition: 'width .6s' }} />
        </div>
      )}

      <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* ── KPIs ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[
            {
              value: acquis.length > 0 ? `${acquis.length}/${themes.length}` : '—',
              label: 'Thèmes acquis',
              color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0',
            },
            {
              value: enCours.length > 0 ? `${enCours.length}/${themes.length}` : '—',
              label: 'En cours',
              color: '#d97706', bg: '#fef3c7', border: '#fde68a',
            },
            {
              value: nonAcquis.length > 0 ? `${nonAcquis.length}/${themes.length}` : '—',
              label: 'À renforcer',
              color: '#dc2626', bg: '#fee2e2', border: '#fecaca',
            },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: kpi.bg, border: `1.5px solid ${kpi.border}`,
              borderRadius: 14, padding: '16px 18px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 26, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: kpi.color, opacity: 0.75, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{kpi.label}</div>
            </div>
          ))}
        </div>

        {/* ── Thèmes par statut ── */}
        <div>
          <SectionHead accent="#00abe9">Thèmes de formation</SectionHead>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <ThemeCol title="Acquis"    themes={themes} assessments={assessments} color="#16a34a" bg="#f0fdf4" border="#bbf7d0" icon="✓" />
            <ThemeCol title="En cours"  themes={themes} assessments={assessments} color="#d97706" bg="#fffbeb" border="#fde68a" icon="◑" />
            <ThemeCol title="Non acquis" themes={themes} assessments={assessments} color="#dc2626" bg="#fff1f2" border="#fecaca" icon="✗" />
          </div>
          {nonRenseigne.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {nonRenseigne.map(t => (
                <span key={t} style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 20, padding: '4px 12px' }}>
                  {MODULE_DATA[t]?.label || t}
                </span>
              ))}
              <span style={{ fontSize: 11, color: '#94a3b8', alignSelf: 'center' }}>non évalués</span>
            </div>
          )}
        </div>

        {/* ── Observations formateur ── */}
        {(attitudeStatus || comprehensionStatus) && (
          <div>
            <SectionHead accent="#7c3aed">Observations du formateur</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {attitudeStatus && (() => {
                const m = COMMENTAIRE_META[attitudeStatus]
                return (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: attitudeNote ? 10 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Attitude générale</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                        background: m.bg, color: m.color, border: `1px solid ${m.border}`,
                      }}>
                        {m.label}
                      </span>
                    </div>
                    {attitudeNote && (
                      <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>
                        « {attitudeNote} »
                      </p>
                    )}
                  </div>
                )
              })()}
              {comprehensionStatus && (() => {
                const m = COMMENTAIRE_META[comprehensionStatus]
                return (
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: comprehensionNote ? 10 : 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>Compréhension</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, padding: '3px 12px', borderRadius: 20,
                        background: m.bg, color: m.color, border: `1px solid ${m.border}`,
                      }}>
                        {m.label}
                      </span>
                    </div>
                    {comprehensionNote && (
                      <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.7, fontStyle: 'italic' }}>
                        « {comprehensionNote} »
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* ── Appréciation globale ── */}
        {appMeta && (
          <div>
            <SectionHead accent={appMeta.bg}>Appréciation globale du formateur</SectionHead>
            <div style={{
              background: appMeta.bg, borderRadius: 16, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <span style={{ fontSize: 32, flexShrink: 0 }}>{appMeta.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', lineHeight: 1.4 }}>
                {appMeta.label}
              </span>
            </div>
          </div>
        )}

        {/* ── Recommandations manager ── */}
        {(nonAcquis.length > 0 || enCours.length > 0 || acquis.length > 0) && (
          <div>
            <SectionHead accent="#f59e0b">Guide pour le manager</SectionHead>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {nonAcquis.length > 0 && (
                <div style={{ background: '#fff1f2', border: '1.5px solid #fecaca', borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    🔴 À retravailler en priorité
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {nonAcquis.map(t => (
                      <span key={t} style={{ fontSize: 13, fontWeight: 600, color: '#991b1b', background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 20, padding: '4px 12px' }}>
                        {MODULE_DATA[t]?.label || t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {enCours.length > 0 && (
                <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    🟡 À consolider — en cours d'acquisition
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {enCours.map(t => (
                      <span key={t} style={{ fontSize: 13, fontWeight: 600, color: '#92400e', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 20, padding: '4px 12px' }}>
                        {MODULE_DATA[t]?.label || t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {acquis.length > 0 && (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    🟢 Maîtrisé — pas besoin de revenir dessus
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {acquis.map(t => (
                      <span key={t} style={{ fontSize: 13, fontWeight: 600, color: '#166534', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 20, padding: '4px 12px' }}>
                        {MODULE_DATA[t]?.label || t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid #f1f5f9', paddingTop: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
            Document confidentiel · À destination du manager direct<br />
            Généré par LPT Formation · {trainerName}
          </div>
          <div style={{ fontSize: 11, color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Lunettes Pour Tous
          </div>
        </div>

      </div>
    </div>
  )
}
