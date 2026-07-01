'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { sbSelect, sbInsert, sbDelete } from '@/lib/supabase'

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
}

const TRAINERS = ['Kevin','Quentin','Nadège','Thomas']

const TRAINER_COLORS = { Kevin: '#00abe9', Quentin: '#7c3aed', Nadège: '#db2777', Thomas: '#f59e0b' }

function trainerColor(name) {
  return TRAINER_COLORS[name] || '#64748b'
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
  active:   { label: 'En cours',  bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  color: '#4ade80' },
  upcoming: { label: 'À venir',   bg: 'rgba(0,171,233,0.1)',   border: 'rgba(0,171,233,0.3)',   color: '#00abe9' },
  done:     { label: 'Terminé',   bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
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
    const ok = await sbInsert('planning_deployments', {
      trainer, store, start_date: startDate, end_date: endDate,
    })
    setLoading(false)
    if (ok) onCreated()
    else setError('Erreur lors de la création. Vérifiez les tables Supabase.')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2247 100%)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24,
        padding: '32px', width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Planning</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Nouveau déplacement</div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', width: 36, height: 36, borderRadius: 10, cursor: 'pointer', fontSize: 16, fontFamily: 'inherit' }}>✕</button>
        </div>

        {/* Formateur */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Formateur</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {TRAINERS.map(t => (
              <button key={t} onClick={() => setTrainer(t)} style={{
                flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                fontWeight: 700, fontSize: 14, transition: 'all .15s',
                background: trainer === t ? `${trainerColor(t)}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${trainer === t ? trainerColor(t) : 'rgba(255,255,255,0.1)'}`,
                color: trainer === t ? trainerColor(t) : 'rgba(255,255,255,0.5)',
              }}>{t}</button>
            ))}
          </div>
        </div>

        {/* Période */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Période</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {[['Du', startDate, setStart], ['Au', endDate, setEnd]].map(([label, val, setter]) => (
              <label key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
                <input type="date" value={val} onChange={e => setter(e.target.value)} style={{
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 14,
                  fontFamily: 'inherit', outline: 'none', colorScheme: 'dark',
                }} />
              </label>
            ))}
          </div>
        </div>

        {/* Magasin */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Magasin</div>
          {Object.entries(STORES_BY_ZONE).map(([zone, stores]) => (
            <div key={zone} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{zone}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {stores.map(s => (
                  <button key={s} onClick={() => setStore(s)} style={{
                    padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: 12, fontWeight: 600, transition: 'all .15s',
                    background: store === s ? 'rgba(0,171,233,0.2)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${store === s ? '#00abe9' : 'rgba(255,255,255,0.1)'}`,
                    color: store === s ? '#00abe9' : 'rgba(255,255,255,0.55)',
                  }}>{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px' }}>{error}</div>}

        <button onClick={submit} disabled={!canSubmit || loading} style={{
          width: '100%', padding: '14px', borderRadius: 14, fontFamily: 'inherit',
          fontSize: 15, fontWeight: 700, cursor: canSubmit ? 'pointer' : 'default',
          background: canSubmit ? 'linear-gradient(135deg, #0089ba, #00abe9)' : 'rgba(255,255,255,0.07)',
          border: 'none', color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
          boxShadow: canSubmit ? '0 6px 24px rgba(0,171,233,0.35)' : 'none', transition: 'all .2s',
        }}>{loading ? 'Enregistrement…' : '✓ Créer le déplacement'}</button>
      </div>
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
    await sbDelete('planning_deployments', `id=eq.${dep.id}`)
    onDelete()
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
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{dep.store}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
              {fmtDate(dep.start_date)} → {fmtDate(dep.end_date)}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit', flexShrink: 0 }}>✕</button>
        </div>

        {/* Ajouter une note */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '16px', marginBottom: 20, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Ajouter une note</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
            <input type="date" value={noteDate} onChange={e => setNoteDate(e.target.value)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', borderRadius: 8, padding: '8px 12px', fontSize: 13,
              fontFamily: 'inherit', outline: 'none', colorScheme: 'dark', width: 150, flexShrink: 0,
            }} />
          </div>
          <textarea
            value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Ce que j'ai fait aujourd'hui…"
            rows={3}
            style={{
              width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', borderRadius: 8, padding: '10px 12px', fontSize: 13,
              fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              lineHeight: 1.5,
            }}
          />
          <button onClick={addNote} disabled={!noteText.trim() || saving} style={{
            marginTop: 10, padding: '9px 20px', borderRadius: 10, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, cursor: noteText.trim() ? 'pointer' : 'default',
            background: noteText.trim() ? `linear-gradient(135deg, ${color}cc, ${color})` : 'rgba(255,255,255,0.06)',
            border: 'none', color: noteText.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            transition: 'all .15s',
          }}>{saving ? 'Enregistrement…' : '+ Enregistrer la note'}</button>
        </div>

        {/* Liste des notes */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16 }}>
          {notes.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, padding: '32px 0' }}>Aucune note pour ce déplacement</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {notes.map(n => (
                <div key={n.id} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: `3px solid ${color}`, borderRadius: 12, padding: '12px 16px',
                  position: 'relative',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{fmtDate(n.note_date)}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>{n.content}</div>
                  <button onClick={() => deleteNote(n.id)} style={{
                    position: 'absolute', top: 10, right: 10,
                    background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)',
                    cursor: 'pointer', fontSize: 14, padding: '2px 6px', borderRadius: 6,
                    fontFamily: 'inherit',
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                  >✕</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ display: 'flex', gap: 10, flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 16 }}>
          <button onClick={generatePDF} style={{
            flex: 1, padding: '11px', borderRadius: 12, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)',
            color: '#00abe9',
          }}>📄 Générer le rapport PDF</button>
          <button onClick={deleteDep} disabled={deleting} style={{
            padding: '11px 16px', borderRadius: 12, fontFamily: 'inherit',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171',
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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2 }}>Pôle Formation</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Planning déplacements</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowCreate(true)} style={{
            background: 'linear-gradient(135deg, #0089ba, #00abe9)', border: 'none',
            color: '#fff', padding: '10px 20px', borderRadius: 12, fontSize: 13,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 16px rgba(0,171,233,0.35)',
          }}>+ Nouveau déplacement</button>
          <button onClick={onBack} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.55)', padding: '10px 18px', borderRadius: 12,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.18)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}
          >✕ Fermer</button>
        </div>
      </div>

      {/* Filtres formateurs */}
      <div style={{ display: 'flex', gap: 8, padding: '16px 32px 0', flexShrink: 0 }}>
        {['Tous', ...TRAINERS].map(t => {
          const active = filterTrainer === t
          const c = t === 'Tous' ? '#64748b' : trainerColor(t)
          return (
            <button key={t} onClick={() => setFilter(t)} style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 12, fontWeight: 700, transition: 'all .15s',
              background: active ? `${c}22` : 'rgba(255,255,255,0.04)',
              border: `1px solid ${active ? c : 'rgba(255,255,255,0.1)'}`,
              color: active ? c : 'rgba(255,255,255,0.4)',
            }}>{t}</button>
          )
        })}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
          {filtered.length} déplacement{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 0, overflow: 'hidden', padding: '20px 32px 24px' }}>

        {/* Liste */}
        <div style={{ overflowY: 'auto', paddingRight: selected ? 16 : 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: 60, fontSize: 14 }}>Chargement…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Aucun déplacement</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Créez votre premier déplacement avec le bouton ci-dessus</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(dep => {
                const st = STATUS_STYLE[statusOf(dep)]
                const c = trainerColor(dep.trainer)
                const isSelected = selected?.id === dep.id
                return (
                  <div key={dep.id} onClick={() => setSelected(isSelected ? null : dep)}
                    style={{
                      background: isSelected ? 'rgba(0,171,233,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${isSelected ? 'rgba(0,171,233,0.35)' : 'rgba(255,255,255,0.08)'}`,
                      borderLeft: `4px solid ${c}`,
                      borderRadius: 14, padding: '16px 20px',
                      cursor: 'pointer', transition: 'all .15s',
                      display: 'grid', gridTemplateColumns: '1fr auto',
                      alignItems: 'center', gap: 12,
                    }}
                    onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                    onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{dep.trainer}</span>
                        <div style={{ background: st.bg, border: `1px solid ${st.border}`, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: st.color }}>{st.label}</div>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{dep.store}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{fmtDate(dep.start_date)} → {fmtDate(dep.end_date)}</div>
                    </div>
                    <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)' }}>{isSelected ? '◀' : '▶'}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Détail */}
        {selected && (
          <div style={{
            borderLeft: '1px solid rgba(255,255,255,0.08)', paddingLeft: 24,
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
