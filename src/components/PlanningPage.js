'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbSelect, sbInsert, sbInsertReturn, sbUpdate, sbDelete } from '@/lib/supabase'
import { getMagasinIdByNom, notifierManagersDeploiement } from '@/lib/planningApi'

// ── Données statiques ─────────────────────────────────────────
const STORES_BY_ZONE = {
  'Zone Paris': [
    'Châtelet','St Lazare','Montparnasse','Italie 2','Commerce',
    'Bastille','Belle épine','Cergy','Créteil',
  ],
  'Nord hors Paris': [
    'Lille','Nantes','Rouen','Rennes','Reims','Strasbourg',
  ],
  'Zone Sud': [
    'Bordeaux','Bègles','Bayonne','Lyon','Toulouse Capitole','Toulouse Blagnac',
    'Montpellier Comédie','Montpellier Odysseum','Nice',
    'Marseille Cannebière','Marseille TDP','Toulon Mayol','Toulon Avenue 83',
  ],
  'Belgique': [
    'Namur','Charleroi','Ixelles','Fripiers','Liège',
  ],
  'Annexes': [
    'Laboratoire Progressif',
  ],
}

const ALL_STORES = Object.values(STORES_BY_ZONE).flat()

const TRAINERS = ['Kevin','Quentin','Nadège','Thomas','Valentine','Mateo','Jonathan','Salomé']

const TRAINER_COLORS = { Kevin: '#0089ba', Quentin: '#7c3aed', Nadège: '#db2777', Thomas: '#f59e0b', Valentine: '#22c55e', Mateo: '#fb923c', Jonathan: '#14b8a6', Salomé: '#4f46e5' }

function trainerColor(name) {
  return TRAINER_COLORS[name] || '#6b7280'
}

function fmtDate(d) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function statusOf(dep) {
  const today = isoToday()
  if (dep.end_date < today) return 'done'
  if (dep.start_date > today) return 'upcoming'
  return 'active'
}

const STATUS_STYLE = {
  active:   { label: 'En cours',  bg: '#dcfce7', border: '#86efac', color: '#16a34a' },
  upcoming: { label: 'À venir',   bg: '#eaf3fd', border: 'rgba(0,137,186,0.3)', color: '#0089ba' },
  done:     { label: 'Terminé',   bg: '#f3f4f6', border: '#e5e7eb', color: '#9aa1ac' },
}

// ── Modal création déplacement ────────────────────────────────
function CreateModal({ onClose, onCreated }) {
  const [trainer, setTrainer]   = useState('')
  const [store, setStore]       = useState('')
  const [startDate, setStart]   = useState('')
  const [endDate, setEnd]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const canSubmit = trainer && store && startDate && endDate && startDate <= endDate

  const submit = async () => {
    if (!canSubmit) return
    setLoading(true)
    const magasinId = await getMagasinIdByNom(store)
    const created = await sbInsertReturn('planning_deployments', {
      trainer, store, start_date: startDate, end_date: endDate, magasin_id: magasinId,
    })
    setLoading(false)
    if (created) {
      await notifierManagersDeploiement(created.id, magasinId)
      onCreated()
    } else setError('Erreur lors de la création. Vérifiez les tables Supabase.')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(15,20,30,0.5)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff',
        border: '1px solid #e5e7eb', borderRadius: 24, boxShadow: '0 20px 60px rgba(16,24,40,.15)',
        padding: '32px', width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Planning</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#14161a' }}>Nouveau déplacement</div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#6b7280', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>✕</button>
        </div>

        {/* Formateur */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Formateur</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {TRAINERS.map(t => (
              <button key={t} onClick={() => setTrainer(t)} style={{
                flex: '1 1 100px', padding: '12px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: 700, fontSize: 14, transition: 'all .15s',
                background: trainer === t ? `${trainerColor(t)}18` : '#f8fafc',
                border: `2px solid ${trainer === t ? trainerColor(t) : '#e5e7eb'}`,
                color: trainer === t ? trainerColor(t) : '#6b7280',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Période */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Période</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[['Du', startDate, setStart], ['Au', endDate, setEnd]].map(([label, val, setter]) => (
              <label key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: '#6b7280' }}>{label}</span>
                <input type="date" value={val} onChange={e => setter(e.target.value)} style={{
                  background: '#fff', border: '1px solid #e5e7eb',
                  color: '#14161a', borderRadius: 10, padding: '10px 14px', fontSize: 14,
                  fontFamily: 'inherit', outline: 'none',
                }} />
              </label>
            ))}
          </div>
        </div>

        {/* Magasin */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Magasin</div>
          {Object.entries(STORES_BY_ZONE).map(([zone, stores]) => (
            <div key={zone} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{zone}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stores.map(s => (
                  <button key={s} onClick={() => setStore(s)} style={{
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 600, transition: 'all .15s',
                    background: store === s ? '#eaf3fd' : '#f8fafc',
                    border: `1px solid ${store === s ? '#0089ba' : '#e5e7eb'}`,
                    color: store === s ? '#0089ba' : '#6b7280',
                  }}>{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 16, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 14px' }}>{error}</div>}

        <button onClick={submit} disabled={!canSubmit || loading} style={{
          width: '100%', padding: '14px', borderRadius: 14, fontFamily: 'inherit',
          fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default',
          background: canSubmit ? 'linear-gradient(135deg, #0089ba, #00abe9)' : '#f3f4f6',
          border: 'none', color: canSubmit ? '#fff' : '#9aa1ac',
          boxShadow: canSubmit ? '0 6px 24px rgba(0,171,233,0.35)' : 'none', transition: 'all .2s',
        }}>{loading ? 'Enregistrement…' : '✓ Créer le déplacement'}</button>
      </div>
    </div>
  )
}

// ── Édition rapide (directement depuis la carte) ──────────────
function EditCardForm({ dep, onCancel, onSaved, onDeleted }) {
  const [trainer, setTrainer] = useState(dep.trainer)
  const [store, setStore]     = useState(dep.store)
  const [startDate, setStart] = useState(dep.start_date)
  const [endDate, setEnd]     = useState(dep.end_date)
  const [saving, setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]     = useState('')

  const canSave = trainer && store && startDate && endDate && startDate <= endDate

  const save = async () => {
    if (!canSave) return
    setSaving(true)
    const magasinId = store === dep.store ? dep.magasin_id : await getMagasinIdByNom(store)
    const ok = await sbUpdate('planning_deployments', {
      trainer, store, start_date: startDate, end_date: endDate, magasin_id: magasinId,
    }, `id=eq.${dep.id}`)
    setSaving(false)
    if (ok) onSaved()
    else setError('Erreur lors de la mise à jour.')
  }

  // Supprimer directement depuis l'édition rapide — avant, seul le panneau
  // détail (ouvert en cliquant ailleurs sur la carte) avait cette option,
  // introuvable pour qui clique sur le crayon en pensant corriger une erreur.
  const remove = async () => {
    if (!confirm('Supprimer ce déplacement et toutes ses notes ?')) return
    setDeleting(true)
    await sbDelete('planning_notes', `deployment_id=eq.${dep.id}`)
    const ok = await sbDelete('planning_deployments', `id=eq.${dep.id}`)
    if (ok) onDeleted()
    else { setDeleting(false); setError('Erreur lors de la suppression.') }
  }

  const inputStyle = {
    width: '100%', background: '#fff', border: '1px solid #e5e7eb',
    color: '#14161a', borderRadius: 8, padding: '8px 10px', fontSize: 12.5,
    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <select value={trainer} onChange={e => setTrainer(e.target.value)} style={inputStyle}>
        {TRAINERS.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={store} onChange={e => setStore(e.target.value)} style={inputStyle}>
        {ALL_STORES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="date" value={startDate} onChange={e => setStart(e.target.value)} style={inputStyle} />
        <input type="date" value={endDate} onChange={e => setEnd(e.target.value)} style={inputStyle} />
      </div>
      {error && <div style={{ color: '#b91c1c', fontSize: 11 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
        <button onClick={save} disabled={!canSave || saving} style={{
          flex: 1, padding: '8px', borderRadius: 8, fontFamily: 'inherit',
          fontSize: 12.5, fontWeight: 700, cursor: canSave ? 'pointer' : 'default',
          background: canSave ? 'linear-gradient(135deg, #0089ba, #00abe9)' : '#f3f4f6',
          border: 'none', color: canSave ? '#fff' : '#9aa1ac',
        }}>{saving ? '…' : '✓ Enregistrer'}</button>
        <button onClick={onCancel} style={{
          padding: '8px 12px', borderRadius: 8, fontFamily: 'inherit',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          background: '#f8fafc', border: '1px solid #e5e7eb',
          color: '#6b7280',
        }}>Annuler</button>
        <button onClick={remove} disabled={deleting} title="Supprimer ce déplacement" style={{
          padding: '8px 12px', borderRadius: 8, fontFamily: 'inherit',
          fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
          background: '#fef2f2', border: '1px solid #fecaca',
          color: '#ef4444', flexShrink: 0,
        }}>{deleting ? '…' : '🗑️'}</button>
      </div>
    </div>
  )
}

// ── Carte déplacement ──────────────────────────────────────────
function DeploymentCard({ dep, isSelected, onClick, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const st = STATUS_STYLE[statusOf(dep)]
  const c = trainerColor(dep.trainer)

  if (editing) {
    return (
      <div style={{
        background: 'rgba(0,137,186,0.05)',
        borderTop: '1px solid rgba(0,137,186,0.25)', borderRight: '1px solid rgba(0,137,186,0.25)',
        borderBottom: '1px solid rgba(0,137,186,0.25)', borderLeft: `4px solid ${c}`,
        borderRadius: 14, padding: '14px 16px',
      }}>
        <EditCardForm dep={dep} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); onSaved() }} onDeleted={onDeleted} />
      </div>
    )
  }

  return (
    <div onClick={onClick}
      style={{
        background: isSelected ? '#eaf3fd' : '#fff',
        borderTop: `1px solid ${isSelected ? '#0089ba' : '#e5e7eb'}`,
        borderRight: `1px solid ${isSelected ? '#0089ba' : '#e5e7eb'}`,
        borderBottom: `1px solid ${isSelected ? '#0089ba' : '#e5e7eb'}`,
        borderLeft: `4px solid ${c}`,
        borderRadius: 14, padding: '16px 18px', position: 'relative',
        cursor: 'pointer', transition: 'all .15s', boxShadow: '0 1px 2px rgba(16,24,40,.03)',
        display: 'flex', flexDirection: 'column', gap: 8, minHeight: 108,
      }}
      onMouseEnter={e => !isSelected && (e.currentTarget.style.background = '#f5f6f8')}
      onMouseLeave={e => !isSelected && (e.currentTarget.style.background = '#fff')}
    >
      <button onClick={e => { e.stopPropagation(); setEditing(true) }} title="Modifier ce déplacement" style={{
        position: 'absolute', top: 10, right: 10,
        background: '#fff', border: '1px solid #e5e7eb',
        color: '#9aa1ac', width: 26, height: 26, borderRadius: 8,
        cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', display: 'flex',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
        onMouseEnter={e => { e.currentTarget.style.color = '#0089ba'; e.currentTarget.style.borderColor = 'rgba(0,137,186,0.4)' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#9aa1ac'; e.currentTarget.style.borderColor = '#e5e7eb' }}
      >✏️</button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 30 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}`, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{dep.trainer}</span>
        <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: st.color }}>{st.label}</div>
      </div>
      <div style={{ fontSize: 17, fontWeight: 800, color: '#14161a', lineHeight: 1.2 }}>{dep.store}</div>
      <div style={{ fontSize: 12, color: '#9aa1ac', marginTop: 'auto' }}>{fmtDate(dep.start_date)} → {fmtDate(dep.end_date)}</div>
    </div>
  )
}

// ── Vue détail déplacement ────────────────────────────────────
function DeploymentDetail({ dep, onDelete, onClose }) {
  const [notes, setNotes]       = useState([])
  const [noteDate, setNoteDate] = useState(isoToday())
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const printRef = useRef(null)
  const color = trainerColor(dep.trainer)
  const status = statusOf(dep)
  const st = STATUS_STYLE[status]

  useEffect(() => {
    loadNotes()
  }, [dep.id])

  const loadNotes = async () => {
    const rows = await sbSelect('planning_notes', `deployment_id=eq.${dep.id}&order=note_date.asc`)
    setNotes(rows || [])
  }

  const addNote = async () => {
    if (!noteText.trim() || !noteDate) return
    setSaving(true)
    await sbInsert('planning_notes', { deployment_id: dep.id, note_date: noteDate, content: noteText.trim() })
    setNoteText('')
    await loadNotes()
    setSaving(false)
  }

  const deleteNote = async (id) => {
    await sbDelete('planning_notes', `id=eq.${id}`)
    await loadNotes()
  }

  const deleteDep = async () => {
    if (!confirm('Supprimer ce déplacement et toutes ses notes ?')) return
    setDeleting(true)
    await sbDelete('planning_notes', `deployment_id=eq.${dep.id}`)
    const ok = await sbDelete('planning_deployments', `id=eq.${dep.id}`)
    if (ok) onDelete()
    else { setDeleting(false); setDeleteError('Erreur lors de la suppression.') }
  }

  const generatePDF = () => {
    window.print()
  }

  return (
    <>
      {/* Zone d'impression cachée */}
      <div id="planning-print" ref={printRef} style={{ display: 'none' }}>
        <style>{`
          @media print {
            body > * { display: none !important; }
            #planning-print { display: block !important; font-family: Arial, sans-serif; color: #000; padding: 32px; }
            #planning-print h1 { font-size: 22px; margin-bottom: 4px; }
            #planning-print .meta { color: #555; font-size: 13px; margin-bottom: 24px; }
            #planning-print .note { border-left: 3px solid #0089ba; padding: 10px 14px; margin-bottom: 12px; background: #f7faff; border-radius: 4px; }
            #planning-print .note-date { font-size: 11px; color: #666; font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
            #planning-print .note-text { font-size: 14px; color: #1a1a2e; line-height: 1.6; }
            #planning-print .footer { margin-top: 32px; font-size: 11px; color: #999; border-top: 1px solid #ddd; padding-top: 12px; }
          }
        `}</style>
        <h1>Rapport de déplacement — {dep.trainer}</h1>
        <div className="meta">
          Magasin : <strong>{dep.store}</strong> &nbsp;|&nbsp; Période : {fmtDate(dep.start_date)} → {fmtDate(dep.end_date)}
        </div>
        {notes.length === 0 ? (
          <p style={{ color: '#888', fontStyle: 'italic' }}>Aucune note enregistrée pour ce déplacement.</p>
        ) : (
          notes.map(n => (
            <div key={n.id} className="note">
              <div className="note-date">{fmtDate(n.note_date)}</div>
              <div className="note-text">{n.content}</div>
            </div>
          ))
        )}
        <div className="footer">Généré le {new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })} · Formation LPT</div>
      </div>

      {/* UI */}
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
              <span style={{ fontSize: 13, fontWeight: 700, color }}>{dep.trainer}</span>
              <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 700, color: st.color }}>{st.label}</div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#14161a', marginBottom: 4 }}>{dep.store}</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              {fmtDate(dep.start_date)} → {fmtDate(dep.end_date)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#6b7280', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
        </div>

        {/* Ajouter une note */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px', marginBottom: 20, flexShrink: 0, boxShadow: '0 1px 2px rgba(16,24,40,.03)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Ajouter une note</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} style={{
              background: '#fff', border: '1px solid #e5e7eb',
              color: '#14161a', borderRadius: 8, padding: '8px 12px', fontSize: 13,
              fontFamily: 'inherit', outline: 'none', width: 150, flexShrink: 0,
            }} />
          </div>
          <textarea
            value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Ce que j'ai fait aujourd'hui…"
            rows={3}
            style={{
              width: '100%', background: '#fff', border: '1px solid #e5e7eb',
              color: '#14161a', borderRadius: 8, padding: '10px 12px', fontSize: 13,
              fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />
          <button onClick={addNote} disabled={!noteText.trim() || saving} style={{
            marginTop: 10, padding: '9px 20px', borderRadius: 10, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, cursor: noteText.trim() ? 'pointer' : 'default',
            background: noteText.trim() ? `linear-gradient(135deg, ${color}cc, ${color})` : '#f3f4f6',
            border: 'none', color: noteText.trim() ? '#fff' : '#9aa1ac',
            transition: 'all .15s',
          }}>{saving ? 'Enregistrement…' : '+ Enregistrer la note'}</button>
        </div>

        {/* Liste des notes */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#9aa1ac', fontSize: 13, padding: '32px 0' }}>Aucune note pour ce déplacement</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notes.map(n => (
                <div key={n.id} style={{
                  background: '#fff', border: '1px solid #e5e7eb',
                  borderLeft: `3px solid ${color}`, borderRadius: 12, padding: '12px 16px',
                  position: 'relative', boxShadow: '0 1px 2px rgba(16,24,40,.03)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{fmtDate(n.note_date)}</div>
                  <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{n.content}</div>
                  <button onClick={() => deleteNote(n.id)} style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'none', border: 'none', color: '#c7cbd1',
                    cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6,
                    fontFamily: 'inherit',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseLeave={e => e.currentTarget.style.color = '#c7cbd1'}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {deleteError && <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 10 }}>{deleteError}</div>}
        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, borderTop: '1px solid #e5e7eb', paddingTop: 16 }}>
          <button onClick={generatePDF} style={{
            flex: 1, padding: '11px', borderRadius: 12, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: '#eaf3fd', border: '1px solid rgba(0,137,186,0.3)',
            color: '#0089ba',
          }}>📄 Générer le rapport PDF</button>
          <button onClick={deleteDep} disabled={deleting} style={{
            padding: '11px 16px', borderRadius: 12, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#ef4444',
          }}>{deleting ? '…' : '🗑️'}</button>
        </div>
      </div>
    </>
  )
}

// ── Page principale ───────────────────────────────────────────
export default function PlanningPage({ pName, onBack }) {
  const [deployments, setDeployments] = useState([])
  const [loading, setLoading]         = useState(true)
  const [showCreate, setShowCreate]   = useState(false)
  const [selected, setSelected]       = useState(null)
  const [filterTrainer, setFilter]    = useState('Tous')

  useEffect(() => { loadDeployments() }, [])

  const loadDeployments = async () => {
    setLoading(true)
    const rows = await sbSelect('planning_deployments', 'order=start_date.desc')
    setDeployments(rows || [])
    setLoading(false)
  }

  const filtered = filterTrainer === 'Tous' ? deployments : deployments.filter(d => d.trainer === filterTrainer)

  const onCreated = () => {
    setShowCreate(false)
    loadDeployments()
  }

  const onDelete = () => {
    setSelected(null)
    loadDeployments()
  }

  const onCardSaved = async () => {
    const rows = await sbSelect('planning_deployments', 'order=start_date.desc')
    setDeployments(rows || [])
    setSelected(prev => prev ? (rows || []).find(r => r.id === prev.id) || null : null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div className="planning-topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0, background: '#fff', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/tgv-lpt.png" alt="LPT" width={200} height={100} style={{ width: 64, height: 'auto', objectFit: 'contain' }} className="planning-topbar-logo" />
          <div className="planning-topbar-sep" style={{ width: 1, height: 20, background: '#e5e7eb' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', textTransform: 'uppercase', letterSpacing: 2 }}>Pôle Formation</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#14161a' }}>Planning déplacements</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowCreate(true)} style={{
            background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none',
            color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,171,233,0.3)',
          }}>+ Nouveau déplacement</button>
          <button onClick={onBack} style={{
            background: '#fff', border: '1px solid #e5e7eb',
            color: '#6b7280', padding: '10px 18px', borderRadius: 12,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecaca' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#e5e7eb' }}
          >✕ Fermer</button>
        </div>
      </div>

      {/* Filtres formateurs */}
      <div className="planning-filters-row" style={{ display: 'flex', gap: 8, padding: '16px 32px 0', flexShrink: 0 }}>
        {['Tous', ...TRAINERS].map(t => {
          const active = filterTrainer === t
          const c = t === 'Tous' ? '#6b7280' : trainerColor(t)
          return (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 700, transition: 'all .15s', flexShrink: 0,
              background: active ? `${c}18` : '#fff',
              border: `1px solid ${active ? c : '#e5e7eb'}`,
              color: active ? c : '#6b7280',
            }}>{t}</button>
          )
        })}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9aa1ac', alignSelf: 'center', flexShrink: 0 }}>
          {filtered.length} déplacement{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Contenu */}
      <div className="planning-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: selected ? 'minmax(320px, 1fr) 420px' : '1fr', gap: 0, overflow: 'hidden', padding: '20px 32px 24px' }}>

        {/* Grille de cartes */}
        <div style={{ overflowY: 'auto', paddingRight: selected ? 16 : 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#9aa1ac', padding: 60, fontSize: 14 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#14161a', marginBottom: 8 }}>Aucun déplacement</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Créez votre premier déplacement avec le bouton ci-dessus</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'start' }}>
              {Object.entries(STATUS_STYLE).map(([statusKey, meta]) => {
                let items = filtered.filter(d => statusOf(d) === statusKey)
                if (statusKey === 'done') {
                  items = [...items].sort((a, b) => (b.end_date || '').localeCompare(a.end_date || '')).slice(0, 5)
                }
                return (
                  <div key={statusKey} style={{
                    background: '#fff', border: '1px solid #e5e7eb',
                    borderRadius: 18, padding: 16, boxShadow: '0 1px 2px rgba(16,24,40,.03)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f0f1f3' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, boxShadow: `0 0 6px ${meta.color}`, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#14161a', textTransform: 'uppercase', letterSpacing: 0.6 }}>{meta.label}</span>
                      <span style={{
                        marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: meta.color,
                        background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 20, padding: '2px 9px',
                      }}>{items.length}</span>
                    </div>
                    {items.length === 0 ? (
                      <div style={{ textAlign: 'center', color: '#9aa1ac', fontSize: 12, padding: '24px 0' }}>Aucun déplacement</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {items.map(dep => (
                          <DeploymentCard
                            key={dep.id}
                            dep={dep}
                            isSelected={selected?.id === dep.id}
                            onClick={() => setSelected(selected?.id === dep.id ? null : dep)}
                            onSaved={onCardSaved}
                            onDeleted={onDelete}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Détail */}
        {selected && (
          <div style={{
            borderLeft: '1px solid #e5e7eb', paddingLeft: 24,
            overflowY: 'auto',
          }}>
            <DeploymentDetail dep={selected} onDelete={onDelete} onClose={() => setSelected(null)} />
          </div>
        )}
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={onCreated} />}
    </div>
  )
}
