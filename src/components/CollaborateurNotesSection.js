'use client'
import { useState, useEffect } from 'react'
import {
  getFormateurId, getCollaborateurDbId,
  getNotesCollaborateur, addNoteCollaborateur, updateNoteCollaborateur, deleteNoteCollaborateur,
  getRetoursNotes, addRetourNote, deleteRetourNote, getMotsMessages,
} from '@/lib/notesCollaborateurApi'

function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

function NoteRow({ note, canDelete, readOnly, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.contenu)

  const save = async () => {
    if (!text.trim() || text === note.contenu) { setEditing(false); return }
    await onSave(note.id, text.trim())
    setEditing(false)
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9' }}>
          {note.auteurNom} · {fmtDate(note.created_at)}
          {note.editeurNom && (
            <span style={{ color: 'var(--text-m)', fontWeight: 500 }}>
              {' '}· Modifié par {note.editeurNom} le {fmtDate(note.derniere_modification_at)}
            </span>
          )}
        </div>
        {!readOnly && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {!editing && <button onClick={() => setEditing(true)} className="btn2" style={{ padding: '4px 10px', fontSize: 11 }}>Modifier</button>}
            {canDelete && !editing && (
              <button onClick={() => onDelete(note.id)} className="btn2" style={{ padding: '4px 10px', fontSize: 11, color: '#f87171' }}>Supprimer</button>
            )}
          </div>
        )}
      </div>
      {editing ? (
        <div>
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={3} className="finput"
            style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} className="gbtn" style={{ padding: '4px 12px', fontSize: 12 }}>Enregistrer</button>
            <button onClick={() => { setText(note.contenu); setEditing(false) }} className="btn2" style={{ padding: '4px 12px', fontSize: 12 }}>Annuler</button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{note.contenu}</div>
      )}
    </div>
  )
}

// "Mots" pour ce collaborateur — évolution de l'ancien "Retour individuel"
// (mailto:) : les brouillons de la semaine (retours_individuels_notes,
// inchangé) partent automatiquement au collaborateur, avec notif in-app et
// ouverture d'un fil de discussion, quand le formateur publie son reporting
// hebdomadaire (MesRetoursView.js → envoyerMotsMagasin). Rien à envoyer
// manuellement ici — juste écrire et laisser filer.
function MotsModal({ collaborateurId, collaborateurNom, formateurId, onClose }) {
  const [drafts, setDrafts] = useState([])
  const [historique, setHistorique] = useState([])
  const [draftText, setDraftText] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    const [d, h] = await Promise.all([getRetoursNotes(collaborateurId), getMotsMessages(collaborateurId)])
    setDrafts(d)
    setHistorique(h)
    setLoading(false)
  }
  useEffect(() => { load() }, [collaborateurId]) // eslint-disable-line react-hooks/exhaustive-deps

  const addDraft = async () => {
    if (!draftText.trim()) return
    await addRetourNote({ collaborateurId, formateurId, contenu: draftText.trim() })
    setDraftText('')
    await load()
  }

  const removeDraft = async (id) => {
    await deleteRetourNote(id)
    await load()
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18,
        padding: 26, width: '100%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto',
      }}>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4 }}>✏️ Mots pour {collaborateurNom}</h3>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>
          Partent automatiquement à {collaborateurNom} (notif + chat) quand tu publies ton reporting de la semaine.
        </p>

        {loading ? (
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Chargement…</p>
        ) : (
          <>
            {historique.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  Fil de discussion
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 220, overflowY: 'auto' }}>
                  {historique.map(m => (
                    <div key={m.id} style={{
                      alignSelf: m.auteur === 'formateur' ? 'flex-end' : 'flex-start',
                      background: m.auteur === 'formateur' ? 'rgba(0,171,233,0.15)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', maxWidth: '85%',
                    }}>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{m.auteur === 'formateur' ? 'Toi' : collaborateurNom}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.contenu}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Mots en attente (pas encore envoyés)
            </div>
            {drafts.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic', marginBottom: 16 }}>Aucun mot pour l&apos;instant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {drafts.map(d => (
                  <div key={d.id} style={{
                    display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px',
                  }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{d.contenu}</div>
                    <button onClick={() => removeDraft(d.id)} style={{
                      background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, flexShrink: 0, fontFamily: 'inherit',
                    }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              value={draftText} onChange={e => setDraftText(e.target.value)}
              placeholder="Écrire un mot pour ce collaborateur…" rows={2} className="finput"
              style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={addDraft} disabled={!draftText.trim()} className="gbtn">+ Ajouter le mot</button>
              <button onClick={onClose} className="btn2" style={{ marginLeft: 'auto' }}>Fermer</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function CollaborateurNotesSection({ store, collaborateur, pName, role = 'formateur' }) {
  const [collaborateurId, setCollaborateurId] = useState(null)
  const [formateurId, setFormateurId] = useState(null)
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showRetour, setShowRetour] = useState(false)

  const isManager = role === 'manager'

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [cId, fId] = await Promise.all([
        getCollaborateurDbId(store.id, collaborateur.id),
        isManager ? Promise.resolve(null) : getFormateurId(pName),
      ])
      if (cancelled) return
      setCollaborateurId(cId)
      setFormateurId(fId)
      if (cId) setNotes(await getNotesCollaborateur(cId))
      setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id, collaborateur.id, pName])

  const refresh = async () => setNotes(await getNotesCollaborateur(collaborateurId))

  const handleAdd = async () => {
    if (!noteText.trim() || !collaborateurId || !formateurId) return
    setSaving(true)
    await addNoteCollaborateur({ collaborateurId, formateurId, contenu: noteText.trim() })
    setNoteText('')
    await refresh()
    setSaving(false)
  }

  const handleSave = async (id, contenu) => {
    await updateNoteCollaborateur({ id, contenu, editeurId: formateurId })
    await refresh()
  }

  const handleDelete = async (id) => {
    await deleteNoteCollaborateur({ id, requesterId: formateurId })
    await refresh()
  }

  if (loading) return null
  if (!collaborateurId) return null // pas encore migré dans le nouveau schéma relationnel

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>📝 Notes de suivi</h3>
        {!isManager && (
          <button onClick={() => setShowRetour(true)} className="btn2">✏️ Mots pour ce collaborateur</button>
        )}
      </div>

      {!isManager && (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <textarea
            value={noteText} onChange={e => setNoteText(e.target.value)}
            placeholder="Ajouter une note de suivi sur ce collaborateur…" rows={2} className="finput"
            style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'inherit' }}
          />
          <button onClick={handleAdd} disabled={saving || !noteText.trim()} className="gbtn">
            {saving ? 'Enregistrement…' : '+ Ajouter la note'}
          </button>
        </div>
      )}

      {notes.length === 0 ? (
        <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucune note de suivi pour l&apos;instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notes.map(n => (
            <NoteRow
              key={n.id} note={n}
              readOnly={isManager}
              canDelete={n.formateur_id === formateurId}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showRetour && (
        <MotsModal
          collaborateurId={collaborateurId}
          collaborateurNom={`${collaborateur.prenom} ${collaborateur.nom}`}
          formateurId={formateurId}
          onClose={() => setShowRetour(false)}
        />
      )}
    </div>
  )
}
