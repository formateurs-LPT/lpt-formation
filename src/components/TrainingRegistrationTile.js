'use client'
import { useState, useEffect } from 'react'
import { sbSelect, sbInsert } from '@/lib/supabase'
import {
  TRAINING_THEMES, TRAINING_HOURS, SLOT_CAPACITY,
  getUpcomingMondays, formatHeure,
} from '@/lib/trainingSlots'
import { collaborateurFullName } from '@/lib/storeFollowupData'
import { IconVideo, IconChevronRight } from './ManagerIcons'

export function RegistrationModal({ store, session, onClose, onRegistered, preselectedIds }) {
  const [mondays] = useState(() => getUpcomingMondays(8))
  const allCollabs = store.sections.flatMap(s => s.collaborateurs)

  const [theme, setTheme] = useState(null)
  const [selected, setSelected] = useState(() => new Set(preselectedIds || []))
  const [dateISO, setDateISO] = useState(null)
  const [heure, setHeure] = useState(null)
  const [slotCounts, setSlotCounts] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggleCollab = (id) => setSelected(s => {
    const n = new Set(s)
    n.has(id) ? n.delete(id) : n.add(id)
    return n
  })

  // Compte les inscriptions déjà prises sur chaque heure de la date choisie
  // (tous magasins confondus — calendrier partagé) pour afficher les places
  // restantes et bloquer les créneaux pleins.
  useEffect(() => {
    if (!dateISO) { setSlotCounts({}); return }
    let cancelled = false
    sbSelect('training_registrations', `session_date=eq.${dateISO}`).then(rows => {
      if (cancelled) return
      const counts = {}
      for (const r of (rows || [])) counts[r.session_heure] = (counts[r.session_heure] || 0) + 1
      setSlotCounts(counts)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [dateISO])

  const remainingFor = (h) => SLOT_CAPACITY - (slotCounts[h] || 0)
  const nbSelected = selected.size
  const heureOk = heure && remainingFor(heure) >= nbSelected
  const canValidate = !!theme && nbSelected > 0 && !!dateISO && heureOk && !saving

  const handleValidate = async () => {
    if (!canValidate) return
    setSaving(true)
    setError('')
    const collabs = allCollabs.filter(c => selected.has(c.id))
    let failCount = 0
    for (const c of collabs) {
      const ok = await sbInsert('training_registrations', {
        magasin: store.id,
        collaborateur_id: c.id,
        collaborateur_nom: collaborateurFullName(c),
        theme,
        session_date: dateISO,
        session_heure: heure,
        registered_by: session.displayName || null,
      })
      if (!ok) failCount++
    }
    setSaving(false)
    if (failCount > 0) {
      setError(`${failCount} inscription${failCount > 1 ? 's ont' : ' a'} échoué — réessayez.`)
      return
    }
    onRegistered()
    onClose()
  }

  const sectionTitle = (text) => (
    <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{text}</div>
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15,20,30,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
          padding: '28px 32px', width: '100%', maxWidth: 640, maxHeight: '86vh', overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(16,24,40,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 1.5 }}>Nouvelle inscription</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#14161a', marginTop: 4 }}>{store.label}</div>
          </div>
          <button onClick={onClose} style={{
            background: '#f3f4f6', border: 'none', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', color: '#6b7280', fontSize: 16, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Thème */}
        <div style={{ marginBottom: 22 }}>
          {sectionTitle('Thème de la formation')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TRAINING_THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} style={{
                background: theme === t.id ? 'rgba(0,137,186,0.12)' : '#f7f8fa',
                border: `1.5px solid ${theme === t.id ? '#0089ba' : '#e5e7eb'}`,
                color: theme === t.id ? '#0369a1' : '#14161a',
                borderRadius: 20, padding: '8px 18px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{t.label}</button>
            ))}
          </div>
        </div>

        {/* Collaborateurs */}
        <div style={{ marginBottom: 22 }}>
          {sectionTitle(`Collaborateurs${nbSelected ? ` · ${nbSelected} sélectionné${nbSelected > 1 ? 's' : ''}` : ''}`)}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
            {allCollabs.map(c => {
              const isSel = selected.has(c.id)
              return (
                <button key={c.id} onClick={() => toggleCollab(c.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  background: isSel ? 'rgba(0,137,186,0.08)' : '#f7f8fa',
                  border: `1px solid ${isSel ? 'rgba(0,137,186,0.4)' : '#e5e7eb'}`,
                  borderRadius: 10, padding: '9px 14px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `1.5px solid ${isSel ? '#0089ba' : '#c7cbd1'}`,
                    background: isSel ? '#0089ba' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff',
                  }}>{isSel ? '✓' : ''}</span>
                  <span style={{ fontSize: 13, color: '#14161a', fontWeight: 600 }}>{collaborateurFullName(c)}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Jour */}
        <div style={{ marginBottom: 22 }}>
          {sectionTitle('Jour')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {mondays.map(m => (
              <button key={m.dateISO} onClick={() => { setDateISO(m.dateISO); setHeure(null) }} style={{
                background: dateISO === m.dateISO ? 'rgba(0,137,186,0.12)' : '#f7f8fa',
                border: `1.5px solid ${dateISO === m.dateISO ? '#0089ba' : '#e5e7eb'}`,
                color: dateISO === m.dateISO ? '#0369a1' : '#14161a',
                borderRadius: 10, padding: '8px 14px', fontSize: 12.5, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}>{m.label}</button>
            ))}
          </div>
        </div>

        {/* Heure */}
        {dateISO && (
          <div style={{ marginBottom: 24 }}>
            {sectionTitle('Heure')}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {TRAINING_HOURS.map(h => {
                const remaining = remainingFor(h)
                const full = remaining <= 0
                const insufficient = !full && remaining < nbSelected && nbSelected > 0
                const isSel = heure === h
                return (
                  <button
                    key={h}
                    disabled={full}
                    onClick={() => setHeure(h)}
                    style={{
                      background: isSel ? 'rgba(0,137,186,0.12)' : full ? '#f3f4f6' : '#f7f8fa',
                      border: `1.5px solid ${isSel ? '#0089ba' : insufficient ? 'rgba(217,119,6,0.5)' : '#e5e7eb'}`,
                      color: full ? '#c2c6cc' : isSel ? '#0369a1' : '#14161a',
                      borderRadius: 10, padding: '10px 8px', fontSize: 13, fontWeight: 700,
                      cursor: full ? 'default' : 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}
                  >
                    {formatHeure(h)}
                    <span style={{ fontSize: 10, fontWeight: 600, color: full ? '#dc2626' : insufficient ? '#b45309' : '#9aa1ac' }}>
                      {full ? 'Complet' : `${remaining}/${SLOT_CAPACITY} places`}
                    </span>
                  </button>
                )
              })}
            </div>
            {insufficientMsg(heure, remainingFor, nbSelected)}
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid rgba(220,38,38,0.35)', color: '#b91c1c',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>⚠️ {error}</div>
        )}

        <button
          onClick={handleValidate}
          disabled={!canValidate}
          style={{
            width: '100%', padding: '13px', border: 'none', borderRadius: 24,
            background: canValidate ? '#0089ba' : '#eef0f2',
            color: canValidate ? '#fff' : '#b0b5bc',
            fontSize: 15, fontWeight: 700, cursor: canValidate ? 'pointer' : 'default', fontFamily: 'inherit',
          }}
        >{saving ? 'Inscription en cours…' : 'Valider l’inscription'}</button>
      </div>
    </div>
  )
}

function insufficientMsg(heure, remainingFor, nbSelected) {
  if (!heure || nbSelected === 0) return null
  const remaining = remainingFor(heure)
  if (remaining >= nbSelected) return null
  return (
    <div style={{ fontSize: 12, color: '#b45309', marginTop: 8 }}>
      ⚠️ Seulement {remaining} place{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''} sur ce créneau pour {nbSelected} collaborateur{nbSelected > 1 ? 's' : ''} sélectionné{nbSelected > 1 ? 's' : ''}.
    </div>
  )
}

export function UpcomingRegistrationsPanel({ store, refreshKey }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    sbSelect(
      'training_registrations',
      `magasin=eq.${encodeURIComponent(store.id)}&completed_at=is.null&order=session_date.asc,session_heure.asc`
    ).then(r => { if (!cancelled) { setRows(r || []); setLoading(false) } }).catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [store.id, refreshKey])

  if (loading || rows.length === 0) return null

  const themeLabel = (id) => TRAINING_THEMES.find(t => t.id === id)?.label || id

  // Regroupe par créneau (date + heure + thème) pour lister les collaborateurs ensemble.
  const groups = {}
  for (const r of rows) {
    const key = `${r.session_date}__${r.session_heure}__${r.theme}`
    if (!groups[key]) groups[key] = { date: r.session_date, heure: r.session_heure, theme: r.theme, noms: [] }
    groups[key].noms.push(r.collaborateur_nom)
  }
  const list = Object.values(groups)

  return (
    <div style={{
      background: '#fff', border: '1px solid #bfe3fa',
      borderRadius: 16, padding: '18px 22px', marginBottom: 20,
      boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#14161a', marginBottom: 12 }}>📋 Formations à venir</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((g, i) => (
          <div key={i} style={{
            background: '#f7fbff', borderRadius: 10, padding: '10px 14px',
            fontSize: 13, color: '#14161a', lineHeight: 1.5,
          }}>
            <strong>{new Date(`${g.date}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {formatHeure(g.heure)}</strong>
            {' — '}{themeLabel(g.theme)}
            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{g.noms.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// `variant="row"` (par défaut) reprend la ligne horizontale d'origine, avec
// son propre panneau "Formations à venir" intégré. `variant="card"` (utilisé
// par la nouvelle page d'accueil manager, à côté de la tuile "Intervention
// terrain") ne rend que le déclencheur au format carte — le panneau est
// alors affiché séparément par le parent (même donnée, refreshKey remonté
// via `onRegistered`) pour ne pas casser la mise en page en 2 colonnes.
export default function TrainingRegistrationTile({ store, session, variant = 'row', onRegistered }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleRegistered = () => {
    setRefreshKey(k => k + 1)
    onRegistered?.()
  }

  return (
    <>
      {variant === 'row' && <UpcomingRegistrationsPanel store={store} refreshKey={refreshKey} />}

      {variant === 'card' ? (
        <button onClick={() => setModalOpen(true)} style={{
          flex: '1 1 260px', minWidth: 240, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 20px',
          boxShadow: '0 1px 2px rgba(16,24,40,0.03)', display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eaf3fd', color: '#0089ba', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconVideo size={19} />
            </div>
            <IconChevronRight size={16} style={{ color: '#c7cbd1' }} />
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a', marginBottom: 3 }}>Formation complémentaire</div>
            <div style={{ fontSize: 12.5, color: '#9aa1ac', lineHeight: 1.4 }}>Inscrire un ou plusieurs collaborateurs à une visio de formation.</div>
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
            background: '#0089ba', color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '8px 16px', borderRadius: 20,
          }}>Faire une demande <span>→</span></div>
        </button>
      ) : (
        <button
          onClick={() => setModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
            background: '#fff',
            border: '1px solid #e5e7eb', borderRadius: 16, padding: '16px 20px',
            marginBottom: 20, transition: 'all .15s', boxShadow: '0 1px 2px rgba(16,24,40,0.03)',
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#c7cbd1'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(16,24,40,0.07)' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(16,24,40,0.03)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: '#f0f1f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>📅</div>
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>
                Formations complémentaires
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#14161a' }}>Inscrire un collaborateur</div>
              <div style={{ fontSize: 12, color: '#9aa1ac', marginTop: 2 }}>
                Tiers payant · Verres progressifs · Prises de mesures
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
            fontSize: 13, fontWeight: 700, color: '#0089ba', whiteSpace: 'nowrap',
          }}>
            Inscrire <span style={{ fontSize: 15 }}>→</span>
          </div>
        </button>
      )}

      {modalOpen && (
        <RegistrationModal
          store={store}
          session={session}
          onClose={() => setModalOpen(false)}
          onRegistered={handleRegistered}
        />
      )}
    </>
  )
}
