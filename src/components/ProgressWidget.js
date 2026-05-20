'use client'
import { useState, useEffect } from 'react'
import { PROG_MODULES } from '@/lib/constants'

export default function ProgressWidget() {
  const [done, setDone] = useState([])

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('prog_modules') || '[]')
    setDone(saved)
  }, [])

  const toggle = (id) => {
    const next = done.includes(id) ? done.filter(x => x !== id) : [...done, id]
    setDone(next)
    localStorage.setItem('prog_modules', JSON.stringify(next))
  }

  const pct = Math.round((done.length / PROG_MODULES.length) * 100)

  return (
    <div className="dash-tile" style={{ cursor: 'default' }}>
      <div className="dash-tile-top">
        <div className="dash-tile-icon">📈</div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.4px' }}>Progression</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>Jour 1 / 2</span>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#00abe9' }}>{done.length} / {PROG_MODULES.length}</span>
      </div>
      <div className="prog-bar-outer">
        <div className="prog-bar-inner" style={{ width: pct + '%' }}></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {PROG_MODULES.map(m => (
          <div key={m.id} onClick={() => toggle(m.id)} style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.04)'
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: `2px solid ${done.includes(m.id) ? '#00abe9' : 'rgba(255,255,255,.2)'}`,
              background: done.includes(m.id) ? '#00abe9' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {done.includes(m.id) && <span style={{ fontSize: 10, color: '#fff' }}>✓</span>}
            </div>
            <span style={{ fontSize: 12, color: done.includes(m.id) ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.7)', textDecoration: done.includes(m.id) ? 'line-through' : 'none' }}>
              {m.label}
            </span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,.2)', marginLeft: 'auto' }}>J{m.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
