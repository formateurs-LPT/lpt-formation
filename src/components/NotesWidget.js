'use client'
import { useState, useEffect, useRef } from 'react'
import { sbSelect, sbInsert, getRuntimeSessionCode, isSupabaseTableAvailable } from '@/lib/supabase'
import TrainerAvatar from './TrainerAvatar'

function formatTimeAgo(date) {
  const d = new Date(date)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return 'À l\'instant'
  if (diff < 3600) return Math.floor(diff / 60) + ' min'
  if (diff < 86400) return Math.floor(diff / 3600) + 'h'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function NotesWidget({ pName }) {
  const [notes, setNotes] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [tableOk, setTableOk] = useState(null)
  const textareaRef = useRef(null)

  const fetchNotes = async () => {
    const code = getRuntimeSessionCode()
    if (!code) return
    const data = await sbSelect(
      'trainer_notes',
      'session_code=eq.' + encodeURIComponent(code) + '&order=created_at.asc'
    )
    if (data) setNotes(data)
  }

  useEffect(() => {
    let interval
    ;(async () => {
      const ok = await isSupabaseTableAvailable('trainer_notes')
      setTableOk(ok)
      if (!ok) return
      fetchNotes()
      interval = setInterval(fetchNotes, 5000)
    })()
    return () => { if (interval) clearInterval(interval) }
  }, [])

  const addNote = async () => {
    const text = input.trim()
    if (!text || sending || tableOk === false) return
    const code = getRuntimeSessionCode()
    if (!code) return
    setSending(true)
    await sbInsert('trainer_notes', {
      session_code: code,
      author: pName || 'Formateur',
      content: text,
      created_at: new Date().toISOString()
    })
    setInput('')
    setSending(false)
    fetchNotes()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addNote()
    }
  }

  const authorKey = (author) => (author || '').toLowerCase().split(' ')[0]

  return (
    <div className="notes-board">
      <div className="notes-board-header">
        <span className="notes-board-title">
          📝 Notes formateurs{' '}
          <span className="notes-board-count">{notes.length > 0 ? `(${notes.length})` : ''}</span>
        </span>
      </div>
      <div id="notes-list">
        {tableOk === false ? (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', padding: '6px 0', lineHeight: 1.5 }}>
            Notes désactivées (table trainer_notes absente en BDD).
          </p>
        ) : notes.length === 0 ? (
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', padding: '6px 0' }}>Aucune note pour l'instant…</p>
        ) : notes.map((note, i) => (
          <div key={note.id || i} className="note-card">
            <TrainerAvatar name={authorKey(note.author)} size={32} />
            <div className="note-body">
              <div className="note-meta">
                <span className="note-author">{note.author}</span>
                <span className="note-time">{formatTimeAgo(note.created_at)}</span>
              </div>
              <div className="note-text">{note.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="note-form" style={{ opacity: tableOk === false ? 0.4 : 1, pointerEvents: tableOk === false ? 'none' : 'auto' }}>
        <textarea
          ref={textareaRef}
          className="note-textarea"
          placeholder="Écrire une note pour l'équipe…"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="note-send" onClick={addNote} disabled={sending || !input.trim()}>
          Envoyer
        </button>
      </div>
    </div>
  )
}
