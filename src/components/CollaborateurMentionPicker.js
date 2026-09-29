'use client'
import { useState, useRef } from 'react'

function collabLabel(c) {
  return `${c.prenom || ''} ${c.nom || ''}`.trim()
}

/**
 * Textarea avec @mention de collaborateurs — en tapant "@", propose la liste
 * des collaborateurs du magasin, insère "@Prénom Nom " au clic et ajoute
 * l'entrée aux pastilles citées (collaborateurs_cites). Multi-mentions
 * possibles dans le même texte.
 */
export default function CollaborateurMentionPicker({
  value, onChange, collaborateurs = [], cited = [], onCitedChange, placeholder, rows = 3,
}) {
  const [query, setQuery] = useState(null) // null = pas de menu ouvert
  const [mentionStart, setMentionStart] = useState(null)
  const textareaRef = useRef(null)

  const handleChange = (e) => {
    const text = e.target.value
    const cursor = e.target.selectionStart
    onChange(text)

    const before = text.slice(0, cursor)
    const at = before.lastIndexOf('@')
    if (at === -1 || /\s/.test(before.slice(at + 1))) {
      setQuery(null)
      setMentionStart(null)
      return
    }
    setQuery(before.slice(at + 1))
    setMentionStart(at)
  }

  const pick = (c) => {
    const text = value
    const cursor = textareaRef.current?.selectionStart ?? text.length
    const before = text.slice(0, mentionStart)
    const after = text.slice(cursor)
    const inserted = `@${collabLabel(c)} `
    onChange(`${before}${inserted}${after}`)
    setQuery(null)
    setMentionStart(null)
    if (!cited.some(x => x.id === c.id)) onCitedChange([...cited, { id: c.id, nom: collabLabel(c) }])
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  const removeCited = (id) => onCitedChange(cited.filter(c => c.id !== id))

  const matches = query === null ? [] : collaborateurs
    .filter(c => collabLabel(c).toLowerCase().includes(query.toLowerCase()))
    .slice(0, 6)

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        className="finput"
        style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', marginBottom: cited.length ? 8 : 10 }}
      />
      {query !== null && matches.length > 0 && (
        <div style={{
          position: 'absolute', zIndex: 20, top: '100%', left: 0, marginTop: -6,
          background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.25)', overflow: 'hidden', minWidth: 200,
        }}>
          {matches.map(c => (
            <button key={c.id} onClick={() => pick(c)} type="button" style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '8px 14px',
              background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, color: 'var(--text)',
            }}>{collabLabel(c)}</button>
          ))}
        </div>
      )}
      {cited.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {cited.map(c => (
            <span key={c.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px',
              borderRadius: 20, fontSize: 11.5, fontWeight: 600, color: '#00abe9',
              background: 'rgba(0,171,233,0.12)', border: '1px solid rgba(0,171,233,0.3)',
            }}>
              @{c.nom}
              <button onClick={() => removeCited(c.id)} type="button" style={{
                background: 'none', border: 'none', color: 'inherit', cursor: 'pointer',
                fontSize: 13, lineHeight: 1, padding: 0,
              }}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
