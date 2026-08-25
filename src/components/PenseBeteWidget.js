'use client'
import { useState, useEffect, useRef } from 'react'
import { TRAINER_CANONICAL } from '@/lib/constants'

function storageKey(pName) {
  const rawKey = (pName || '').toLowerCase().split(' ')[0]
  const key = TRAINER_CANONICAL[rawKey] || rawKey || 'formateur'
  return `lpt_pense_bete_${key}`
}

export function getPenseBeteTasks(pName) {
  try {
    const raw = localStorage.getItem(storageKey(pName))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function usePenseBeteTasks(pName) {
  const key = storageKey(pName)
  const [tasks, setTasks] = useState([])
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

  const addTask = text => {
    const t = text.trim()
    if (!t) return
    setTasks(list => [...list, { id: Date.now(), text: t, done: false }])
  }
  const toggleTask = id => setTasks(list => list.map(x => x.id === id ? { ...x, done: !x.done } : x))
  const removeTask = id => setTasks(list => list.filter(x => x.id !== id))
  const editTask = (id, text) => setTasks(list => list.map(x => x.id === id ? { ...x, text } : x))

  return { tasks, addTask, toggleTask, removeTask, editTask }
}

function TaskRow({ task, onToggle, onRemove }) {
  return (
    <div
      className="pb-row"
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.06)',
        borderRadius: 10, padding: '10px 12px',
      }}
    >
      <button
        onClick={() => onToggle(task.id)}
        title={task.done ? 'Marquer à faire' : 'Marquer fait'}
        style={{
          width: 20, height: 20, flexShrink: 0, borderRadius: '50%', cursor: 'pointer',
          border: task.done ? 'none' : '1.5px solid rgba(255,255,255,.3)',
          background: task.done ? '#22c55e' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}
      >
        {task.done && (
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span style={{
        flex: 1, fontSize: 14, lineHeight: 1.4, wordBreak: 'break-word',
        color: task.done ? 'rgba(255,255,255,.35)' : '#fff',
        textDecoration: task.done ? 'line-through' : 'none',
      }}>
        {task.text}
      </span>
      <button
        onClick={() => onRemove(task.id)}
        className="pb-del"
        title="Supprimer"
        style={{
          width: 22, height: 22, flexShrink: 0, borderRadius: 6, border: 'none',
          background: 'transparent', color: 'rgba(255,255,255,.3)', fontSize: 16,
          cursor: 'pointer', lineHeight: 1,
        }}
      >
        ×
      </button>
      <style>{`.pb-del{opacity:0} .pb-row:hover .pb-del{opacity:1} .pb-del:hover{color:#f87171 !important}`}</style>
    </div>
  )
}

// ── Grand écran dédié (tuile → vue plein écran) ─────────────────────
export function PenseBeteView({ pName, onBack }) {
  const { tasks, addTask, toggleTask, removeTask } = usePenseBeteTasks(pName)
  const [draft, setDraft] = useState('')

  const todo = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  const submit = () => {
    if (!draft.trim()) return
    addTask(draft)
    setDraft('')
  }

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour au tableau de bord</button>

      <div className="dash-header">
        <div>
          <h2>📌 Pense-bête</h2>
          <p>Organise tes tâches — stocké sur cet appareil, visible uniquement par toi</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Ajouter une tâche…"
          autoFocus
          style={{
            flex: 1, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 12, padding: '14px 16px', fontSize: 15, color: '#fff', outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          style={{
            padding: '0 22px', flexShrink: 0, borderRadius: 12, border: 'none',
            background: draft.trim() ? 'var(--lpt)' : 'rgba(255,255,255,.06)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: draft.trim() ? 'pointer' : 'default', transition: 'background .18s',
          }}
        >
          + Ajouter
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="pb-columns">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>À faire</span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#00abe9', background: 'rgba(0,171,233,.15)',
              borderRadius: 20, padding: '1px 9px',
            }}>
              {todo.length}
            </span>
          </div>
          {todo.length === 0 ? (
            <div style={{
              border: '1px dashed rgba(255,255,255,.12)', borderRadius: 12, padding: '28px 16px',
              textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.3)',
            }}>
              Rien en attente ✨
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todo.map(t => <TaskRow key={t.id} task={t} onToggle={toggleTask} onRemove={removeTask} />)}
            </div>
          )}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Terminées</span>
            <span style={{
              fontSize: 12, fontWeight: 700, color: '#4ade80', background: 'rgba(34,197,94,.15)',
              borderRadius: 20, padding: '1px 9px',
            }}>
              {done.length}
            </span>
          </div>
          {done.length === 0 ? (
            <div style={{
              border: '1px dashed rgba(255,255,255,.12)', borderRadius: 12, padding: '28px 16px',
              textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,.3)',
            }}>
              Aucune tâche terminée pour l'instant
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {done.map(t => <TaskRow key={t.id} task={t} onToggle={toggleTask} onRemove={removeTask} />)}
            </div>
          )}
        </div>
      </div>

      <style>{`@media(max-width:700px){.pb-columns{grid-template-columns:1fr !important}}`}</style>
    </div>
  )
}
