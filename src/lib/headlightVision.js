'use client'
import { useId } from 'react'

// Simule visuellement un point lumineux (phare de voiture) vu par un œil astigmate :
// cyl = puissance du cylindre (0 → net, plus la valeur monte plus le point s'étire en ovale)
// axe = orientation de la déformation en degrés (0-180)
export function HeadlightVision({ cyl = 0, axe = 0, size = 220, label, sublabel }) {
  const uid = useId().replace(/:/g, '')
  const cx = size / 2
  const cy = size / 2
  const baseR = size * 0.14
  const stretch = Math.max(0, Math.min(cyl, 4)) * (size * 0.09)
  const rx = baseR + stretch
  const ry = baseR

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <radialGradient id={`hlGlow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffdf0" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#ffe9a8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={size} height={size} rx={20} fill="#03112a" />
        {/* repère pointillé = ce que serait un point parfaitement rond, pour comparaison visuelle */}
        <circle cx={cx} cy={cy} r={baseR} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
        <g transform={`rotate(${axe} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx * 2} ry={ry * 2} fill={`url(#hlGlow-${uid})`} />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fffef2" />
        </g>
      </svg>
      {(label || sublabel) && (
        <div style={{ marginTop: 10 }}>
          {label && <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{label}</div>}
          {sublabel && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{sublabel}</div>}
        </div>
      )}
    </div>
  )
}
