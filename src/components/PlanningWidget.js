'use client'
import { useState, useEffect } from 'react'
import { sbSelect } from '@/lib/supabase'

const TRAINER_COLORS = { Kevin: '#00abe9', Quentin: '#7c3aed', Nadège: '#db2777', Thomas: '#f59e0b', Valentine: '#22c55e', Mateo: '#fb923c', Jonathan: '#14b8a6' }
function trainerColor(name) { return TRAINER_COLORS[name] || '#64748b' }

function isoToday() { return new Date().toISOString().slice(0, 10) }

function fmtDateShort(d) {
  if (!d) return '—'
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

function statusOf(dep) {
  const today = isoToday()
  if (dep.end_date < today) return 'done'
  if (dep.start_date > today) return 'upcoming'
  return 'active'
}

export default function PlanningWidget({ onOpen }) {
  const [deployments, setDeployments] = useState([])

  useEffect(() => {
    sbSelect('planning_deployments', 'order=start_date.asc').then(rows => {
      const today = isoToday()
      const relevant = (rows || [])
        .filter(d => d.end_date >= today)
        .slice(0, 4)
      setDeployments(relevant)
    })
  }, [])

  const activeCount = deployments.filter(d => statusOf(d) === 'active').length

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 18, padding: '18px 20px', boxShadow: '0 1px 2px rgba(16,24,40,0.03)',
      display: 'flex', flexDirection: 'column', gap: 14,
      cursor: 'pointer', transition: 'all .2s',
    }}
      onClick={onOpen}
      onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(0,137,186,0.4)'}
      onMouseLeave={e => e.currentTarget.style.border = '1px solid #e5e7eb'}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📋</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#14161a', letterSpacing: .4 }}>Planning déplacements</span>
        </div>
        {activeCount > 0 && (
          <div style={{
            background: '#dcfce7', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 20, padding: '2px 10px', fontSize: 10, fontWeight: 700, color: '#16a34a',
          }}>{activeCount} en cours</div>
        )}
      </div>

      {/* Déplacements à venir / en cours */}
      {deployments.length === 0 ? (
        <div style={{ fontSize: 12, color: '#9aa1ac', fontStyle: 'italic' }}>Aucun déplacement planifié</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {deployments.map(dep => {
            const c = trainerColor(dep.trainer)
            const st = statusOf(dep)
            return (
              <div key={dep.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: '#f7f8fa', borderRadius: 10,
                padding: '7px 10px',
                borderLeft: `3px solid ${st === 'active' ? c : '#e5e7eb'}`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: c, width: 52, flexShrink: 0 }}>{dep.trainer}</span>
                <span style={{ fontSize: 12, color: '#14161a', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dep.store}</span>
                <span style={{ fontSize: 10, color: '#9aa1ac', flexShrink: 0 }}>{fmtDateShort(dep.start_date)}→{fmtDateShort(dep.end_date)}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* CTA */}
      <div style={{ fontSize: 11, color: '#0089ba', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        Ouvrir le planning <span style={{ fontSize: 10 }}>→</span>
      </div>
    </div>
  )
}
