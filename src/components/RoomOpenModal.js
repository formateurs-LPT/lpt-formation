'use client'
import { useState } from 'react'
import { listFormationCategories } from '@/lib/formationCategories'

const ACCENT = {
  presentiel: '#0089ba',
  visio: '#7c3aed',
  belgique: '#db2777',
}

export default function RoomOpenModal({ trainerName, onConfirm, onCancel, loading }) {
  const categories = listFormationCategories()
  const [selected, setSelected] = useState(categories[0]?.slug || 'presentiel')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'var(--card, #111827)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20, padding: 28, maxWidth: 460, width: '100%',
        boxShadow: '0 24px 64px rgba(0,0,0,0.45)',
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: 20, color: '#fff' }}>Ouvrir ma salle</h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
          Choisissez le type de formation pour {trainerName || 'cette session'}.
          Un code unique sera généré pour le QR.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {categories.map(({ slug, emoji, label, subLabel }) => {
            const accent = ACCENT[slug] || '#0089ba'
            const isOn = selected === slug
            return (
              <button
                key={slug}
                type="button"
                disabled={loading}
                onClick={() => setSelected(slug)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px', borderRadius: 14, cursor: loading ? 'wait' : 'pointer',
                  border: isOn ? `2px solid ${accent}` : '1px solid rgba(255,255,255,0.1)',
                  background: isOn ? `${accent}1f` : 'rgba(255,255,255,0.03)',
                  color: '#fff', textAlign: 'left', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 24 }}>{emoji}</span>
                <span style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
                  {subLabel ? <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{subLabel}</div> : null}
                </span>
                {slug === 'belgique' && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                    color: accent, background: `${accent}22`,
                    borderRadius: 8, padding: '4px 8px',
                  }}>
                    Thomas
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)',
              background: 'transparent', color: '#cbd5e1', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            disabled={loading || !selected}
            style={{
              padding: '10px 20px', borderRadius: 10, border: 'none',
              background: ACCENT[selected] || '#0089ba', color: '#fff', fontWeight: 700,
              cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {loading ? 'Ouverture…' : 'Ouvrir →'}
          </button>
        </div>
      </div>
    </div>
  )
}
