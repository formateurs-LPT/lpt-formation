'use client'
import { useState } from 'react'

const JOURNEES = [
  {
    id: 'j1',
    numero: 1,
    titre: 'Journée 1',
    sousTitre: 'Les fondamentaux de l\'optique',
    color: '#f59e0b',
    colorDark: '#b45309',
    icon: '🌅',
    modules: [
      { icon: '🏢', label: 'Présentation de l\'entreprise' },
      { icon: '👁️', label: 'Les bases de l\'optique' },
      { icon: '🔬', label: 'Les types de verres' },
    ],
  },
  {
    id: 'j2',
    numero: 2,
    titre: 'Journée 2',
    sousTitre: 'Les offres et la vente',
    color: '#10b981',
    colorDark: '#047857',
    icon: '🤝',
    modules: [
      { icon: '🤝', label: 'Trame d\'accueil' },
      { icon: '🏷️', label: 'Les offres LPT' },
    ],
  },
  {
    id: 'j3',
    numero: 3,
    titre: 'Journée 3',
    sousTitre: 'La prise de mesures',
    color: '#8b5cf6',
    colorDark: '#5b21b6',
    icon: '📐',
    modules: [
      { icon: '📐', label: 'Prise de mesures' },
    ],
  },
]

function JourneeCard({ journee, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, ${journee.color}22, ${journee.color}0d)`
          : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? journee.color + '60' : 'rgba(255,255,255,0.08)'}`,
        borderLeft: `4px solid ${journee.color}`,
        borderRadius: 18,
        padding: '22px 24px',
        cursor: 'pointer',
        transition: 'all .2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: 24,
      }}
    >
      {/* Badge journée */}
      <div style={{
        width: 64, height: 64, borderRadius: 16, flexShrink: 0,
        background: `linear-gradient(135deg, ${journee.color}30, ${journee.color}15)`,
        border: `1px solid ${journee.color}40`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: journee.color, letterSpacing: 1, textTransform: 'uppercase' }}>J.</span>
        <span style={{ fontSize: 26, fontWeight: 900, color: journee.color, lineHeight: 1 }}>{journee.numero}</span>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{journee.titre}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: journee.color,
            background: `${journee.color}18`, border: `1px solid ${journee.color}35`,
            borderRadius: 20, padding: '2px 10px', letterSpacing: 0.5, flexShrink: 0,
          }}>FAQ + Quiz</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>{journee.sousTitre}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {journee.modules.map((m, i) => (
            <span key={i} style={{
              fontSize: 11, color: 'rgba(255,255,255,0.55)',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '3px 10px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>{m.icon}</span> {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Flèche */}
      <div style={{
        fontSize: 20, color: hovered ? journee.color : 'rgba(255,255,255,0.2)',
        transition: 'all .2s',
        transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        flexShrink: 0,
      }}>→</div>
    </div>
  )
}

function PlaceholderView({ journee, onBack }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0d1117',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 24, padding: 40,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: `linear-gradient(135deg, ${journee.color}30, ${journee.color}10)`,
        border: `1px solid ${journee.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
      }}>{journee.icon}</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: journee.color, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Réveil des acquis</div>
        <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{journee.titre}</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)' }}>Le contenu de ce réveil sera ajouté prochainement.</div>
      </div>
      <button onClick={onBack} style={{
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
        color: '#fff', padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>← Retour</button>
    </div>
  )
}

export default function ModuleReveilAcquis({ pName, onBack }) {
  const [selected, setSelected] = useState(null)

  if (selected) {
    const journee = JOURNEES.find(j => j.id === selected)
    return <PlaceholderView journee={journee} onBack={() => setSelected(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117' }}>

      {/* Header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 48px 28px',
      }}>
        {/* Glow décoratif */}
        <div style={{
          position: 'absolute', top: -60, right: 80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Retour aux modules</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Formation LPT · Formateur
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>Réveil des acquis</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              FAQ et quiz de consolidation — choisissez une journée
            </div>
          </div>
        </div>
      </div>

      {/* Liste des journées */}
      <div style={{ padding: '36px 48px', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
          Sélectionnez une journée
        </div>

        {JOURNEES.map(j => (
          <JourneeCard key={j.id} journee={j} onClick={() => setSelected(j.id)} />
        ))}
      </div>
    </div>
  )
}
