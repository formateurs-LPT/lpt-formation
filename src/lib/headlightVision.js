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
  const housingR = size * 0.42

  return (
    <div style={{ textAlign: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          <radialGradient id={`hlGlow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffdf0" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#ffe9a8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffe9a8" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`hlBulb-${uid}`} cx="42%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fff6d8" />
            <stop offset="100%" stopColor="#ffdd80" />
          </radialGradient>
          <radialGradient id={`hlHousing-${uid}`} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#4b5a70" />
            <stop offset="70%" stopColor="#232c3a" />
            <stop offset="100%" stopColor="#11151d" />
          </radialGradient>
          <linearGradient id={`hlRim-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b98ac" />
            <stop offset="50%" stopColor="#2b3444" />
            <stop offset="100%" stopColor="#8b98ac" />
          </linearGradient>
        </defs>

        <rect width={size} height={size} rx={20} fill="#03112a" />

        {/* Bol du phare — bezel + réflecteur, pour que ce soit immédiatement lisible comme un phare */}
        <circle cx={cx} cy={cy} r={housingR} fill={`url(#hlHousing-${uid})`} stroke={`url(#hlRim-${uid})`} strokeWidth={size * 0.02} />
        {[0.86, 0.66, 0.46].map((f, i) => (
          <circle key={i} cx={cx} cy={cy} r={housingR * f} fill="none" stroke="rgba(180,200,225,0.18)" strokeWidth={1.5} />
        ))}
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2
          const r1 = housingR * 0.32
          const r2 = housingR * 0.9
          return (
            <line key={i}
              x1={cx + Math.cos(a) * r1} y1={cy + Math.sin(a) * r1}
              x2={cx + Math.cos(a) * r2} y2={cy + Math.sin(a) * r2}
              stroke="rgba(180,200,225,0.10)" strokeWidth={1}
            />
          )
        })}

        {/* repère pointillé = ce que serait un point parfaitement rond, pour comparaison visuelle */}
        <circle cx={cx} cy={cy} r={baseR} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Ampoule — s'étire en ovale et pivote selon cyl/axe (logique inchangée) */}
        <g transform={`rotate(${axe} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx={rx * 2} ry={ry * 2} fill={`url(#hlGlow-${uid})`} />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#hlBulb-${uid})`} stroke="#fff" strokeWidth={0.5} strokeOpacity={0.5} />
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
