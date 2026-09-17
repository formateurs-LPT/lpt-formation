'use client'
import { useState, useEffect } from 'react'
import { sbSelect, sbInsert } from '@/lib/supabase'
import {
  TRAINING_THEMES, TRAINING_HOURS, SLOT_CAPACITY,
  getUpcomingMondays, formatHeure, todayISODateLocal,
} from '@/lib/trainingSlots'
import { collaborateurFullName } from '@/lib/storeFollowupData'

function RegistrationModal({ store, session, onClose, onRegistered }) {
  const [mondays] = useState(() => getUpcomingMondays(8))
  const allCollabs = store.sections.flatMap(s => s.collaborateurs)

  const [theme, setTheme] = useState(null)
  const [selected, setSelected] = useState(new Set())
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
    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{text}</div>
  )

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '28px 32px', width: '100%', maxWidth: 640, maxHeight: '86vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5 }}>Nouvelle inscription</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginTop: 4 }}>{store.label}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, flexShrink: 0,
          }}>✕</button>
        </div>

        {/* Thème */}
        <div style={{ marginBottom: 22 }}>
          {sectionTitle('Thème de la formation')}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TRAINING_THEMES.map(t => (
              <button key={t.id} onClick={() => setTheme(t.id)} style={{
                background: theme === t.id ? 'rgba(0,171,233,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${theme === t.id ? '#00abe9' : 'rgba(255,255,255,0.15)'}`,
                color: theme === t.id ? '#7dd3fc' : '#fff',
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
                  background: isSel ? 'rgba(0,171,233,0.12)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isSel ? 'rgba(0,171,233,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 10, padding: '9px 14px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    border: `1.5px solid ${isSel ? '#00abe9' : 'rgba(255,255,255,0.3)'}`,
                    background: isSel ? '#00abe9' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff',
                  }}>{isSel ? '✓' : ''}</span>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{collaborateurFullName(c)}</span>
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
                background: dateISO === m.dateISO ? 'rgba(0,171,233,0.18)' : 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${dateISO === m.dateISO ? '#00abe9' : 'rgba(255,255,255,0.15)'}`,
                color: dateISO === m.dateISO ? '#7dd3fc' : '#fff',
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
                      background: isSel ? 'rgba(0,171,233,0.18)' : full ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                      border: `1.5px solid ${isSel ? '#00abe9' : insufficient ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.15)'}`,
                      color: full ? 'rgba(255,255,255,0.25)' : isSel ? '#7dd3fc' : '#fff',
                      borderRadius: 10, padding: '10px 8px', fontSize: 13, fontWeight: 700,
                      cursor: full ? 'default' : 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    }}
                  >
                    {formatHeure(h)}
                    <span style={{ fontSize: 10, fontWeight: 600, color: full ? '#f87171' : insufficient ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>
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
            background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.4)', color: '#f87171',
            borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16,
          }}>⚠️ {error}</div>
        )}

        <button
          onClick={handleValidate}
          disabled={!canValidate}
          style={{
            width: '100%', padding: '13px', border: 'none', borderRadius: 12,
            background: canValidate ? '#00abe9' : 'rgba(255,255,255,0.08)',
            color: canValidate ? '#fff' : 'rgba(255,255,255,0.3)',
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
    <div style={{ fontSize: 12, color: '#fbbf24', marginTop: 8 }}>
      ⚠️ Seulement {remaining} place{remaining > 1 ? 's' : ''} restante{remaining > 1 ? 's' : ''} sur ce créneau pour {nbSelected} collaborateur{nbSelected > 1 ? 's' : ''} sélectionné{nbSelected > 1 ? 's' : ''}.
    </div>
  )
}

function UpcomingRegistrationsPanel({ store, refreshKey }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    sbSelect(
      'training_registrations',
      `magasin=eq.${encodeURIComponent(store.id)}&session_date=gte.${todayISODateLocal()}&order=session_date.asc,session_heure.asc`
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
      background: 'rgba(0,171,233,0.06)', border: '1px solid rgba(0,171,233,0.25)',
      borderRadius: 16, padding: '18px 22px', marginBottom: 20,
    }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12 }}>📋 Formations à venir</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {list.map((g, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px',
            fontSize: 13, color: '#fff', lineHeight: 1.5,
          }}>
            <strong>{new Date(`${g.date}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {formatHeure(g.heure)}</strong>
            {' — '}{themeLabel(g.theme)}
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{g.noms.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TrainingRegistrationTile({ store, session }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <>
      <UpcomingRegistrationsPanel store={store} refreshKey={refreshKey} />
      <button
        onClick={() => setModalOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
          background: 'rgba(0,171,233,0.08)', border: '1.5px solid rgba(0,171,233,0.3)',
          borderRadius: 16, padding: '16px 20px', cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 20,
        }}
      >
        <span style={{ fontSize: 24 }}>📅</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Inscrire en formation</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Tiers payant, verres progressifs, prises de mesures…</div>
        </div>
      </button>
      {modalOpen && (
        <RegistrationModal
          store={store}
          session={session}
          onClose={() => setModalOpen(false)}
          onRegistered={() => setRefreshKey(k => k + 1)}
        />
      )}
    </>
  )
}
