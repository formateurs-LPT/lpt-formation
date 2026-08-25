'use client'
import { useState, useEffect, useRef } from 'react'
import { TRAINER_CANONICAL } from '@/lib/constants'

function storageKey(pName) {
  const rawKey = (pName || '').toLowerCase().split(' ')[0]
  const key = TRAINER_CANONICAL[rawKey] || rawKey || 'formateur'
  return `lpt_pense_bete_${key}`
}

export default function PenseBeteWidget({ pName }) {
  const key = storageKey(pName)
  const [tasks, setTasks] = useState([])
  const [draft, setDraft] = useState('')
  const loaded = useRef(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      setTasks(raw ? JSON.parse(raw) : [])
    } catch {
      setTasks([])
    }
    loaded.current = true
  }, [key])

  useEffect(() => {
    if (!loaded.current) return
    try { localStorage.setItem(key, JSON.stringify(tasks)) } catch {}
  }, [tasks, key])

  const addTask = () => {
    const text = draft.trim()
    if (!text) return
    setTasks(t => [...t, { id: Date.now(), text, done: false }])
    setDraft('')
  }

  const toggleTask = id => setTasks(t => t.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const removeTask = id => setTasks(t => t.filter(x => x.id !== id))

  const todo = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)
  const ordered = [...todo, ...done]

  return (
    <div className="dash-tile" style={{ cursor: 'default' }}>
      <div className="dash-tile-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="dash-tile-icon">📌</div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.4px' }}>Pense-bête</span>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.35)',
          border: '1px dashed rgba(255,255,255,.2)', borderRadius: 20,
          padding: '3px 8px', letterSpacing: '.3px',
        }}>
          Privé
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTask()}
          placeholder="Ajouter une tâche…"
          style={{
            flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 10, padding: '9px 12px', fontSize: 13, color: '#fff', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={addTask}
          disabled={!draft.trim()}
          style={{
            width: 36, height: 36, flexShrink: 0, borderRadius: 10, border: 'none',
            background: draft.trim() ? 'rgba(0,171,233,.85)' : 'rgba(255,255,255,.06)',
            color: '#fff', fontSize: 18, fontWeight: 700, lineHeight: 1,
            cursor: draft.trim() ? 'pointer' : 'default', transition: 'background .18s',
          }}
        >
          +
        </button>
      </div>

      {ordered.length === 0 ? (
        <div style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,.3)', textAlign: 'center', padding: '18px 0' }}>
          Rien à faire pour l'instant ✨
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, maxHeight: 230, overflowY: 'auto', paddingRight: 2 }}>
          {ordered.map(t => (
            <div
              key={t.id}
              className="pb-row"
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
                borderRadius: 9, padding: '8px 10px',
              }}
            >
              <button
                onClick={() => toggleTask(t.id)}
                title={t.done ? 'Marquer à faire' : 'Marquer fait'}
                style={{
                  width: 18, height: 18, flexShrink: 0, borderRadius: '50%', cursor: 'pointer',
                  border: t.done ? 'none' : '1.5px solid rgba(255,255,255,.3)',
                  background: t.done ? '#22c55e' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                }}
              >
                {t.done && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
              <span style={{
                flex: 1, fontSize: 13, lineHeight: 1.3, wordBreak: 'break-word',
                color: t.done ? 'rgba(255,255,255,.35)' : '#fff',
                textDecoration: t.done ? 'line-through' : 'none',
              }}>
                {t.text}
              </span>
              <button
                onClick={() => removeTask(t.id)}
                className="pb-del"
                title="Supprimer"
                style={{
                  width: 20, height: 20, flexShrink: 0, borderRadius: 6, border: 'none',
                  background: 'transparent', color: 'rgba(255,255,255,.25)', fontSize: 15,
                  cursor: 'pointer', lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {done.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.3)' }}>
          {done.length} fait{done.length > 1 ? 'es' : 'e'} · {todo.length} à faire
        </div>
      )}

      <style>{`
        .pb-del{opacity:0}
        .pb-row:hover .pb-del{opacity:1}
        .pb-del:hover{color:#f87171 !important}
      `}</style>
    </div>
  )
}
