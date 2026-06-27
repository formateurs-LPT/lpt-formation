'use client'
import { useState, useEffect } from 'react'

const ZONES = [
  { id: 0, name: 'Paris & Île-de-France', color: '#00abe9', count: 9 },
  { id: 1, name: 'Nord',                  color: '#4ade80', count: 6 },
  { id: 2, name: 'Zone Sud',              color: '#f59e0b', count: 13 },
  { id: 3, name: 'Belgique',              color: '#a78bfa', count: 5 },
]

const STORES = [
  { name: 'Châtelet',             x: 238, y: 140, z: 0 },
  { name: 'St Lazare',            x: 233, y: 137, z: 0 },
  { name: 'Montparnasse',         x: 231, y: 143, z: 0 },
  { name: 'Italie 2',             x: 236, y: 146, z: 0 },
  { name: 'Commerce',             x: 229, y: 142, z: 0 },
  { name: 'Bastille',             x: 240, y: 139, z: 0 },
  { name: 'Belle épine',          x: 235, y: 150, z: 0 },
  { name: 'Cergy',                x: 224, y: 129, z: 0 },
  { name: 'Créteil',              x: 242, y: 148, z: 0 },
  { name: 'Lille',                x: 257, y: 46,  z: 1 },
  { name: 'Rouen',                x: 196, y: 110, z: 1 },
  { name: 'Rennes',               x: 115, y: 180, z: 1 },
  { name: 'Nantes',               x: 119, y: 225, z: 1 },
  { name: 'Reims',                x: 284, y: 120, z: 1 },
  { name: 'Strasbourg',           x: 395, y: 154, z: 1 },
  { name: 'Bordeaux',             x: 148, y: 348, z: 2 },
  { name: 'Bègles',               x: 153, y: 354, z: 2 },
  { name: 'Bayonne',              x: 121, y: 420, z: 2 },
  { name: 'Lyon',                 x: 310, y: 303, z: 2 },
  { name: 'Toulouse Capitole',    x: 207, y: 414, z: 2 },
  { name: 'Toulouse Blagnac',     x: 201, y: 409, z: 2 },
  { name: 'Montpellier Comédie',  x: 277, y: 413, z: 2 },
  { name: 'Montpellier Odysseum', x: 284, y: 418, z: 2 },
  { name: 'Nice',                 x: 381, y: 409, z: 2 },
  { name: 'Marseille Cannebière', x: 322, y: 428, z: 2 },
  { name: 'Marseille TDP',        x: 329, y: 432, z: 2 },
  { name: 'Toulon Mayol',         x: 340, y: 437, z: 2 },
  { name: 'Toulon Avenue 83',     x: 347, y: 441, z: 2 },
  { name: 'Namur',                x: 311, y: 55,  z: 3 },
  { name: 'Charleroi',            x: 297, y: 62,  z: 3 },
  { name: 'Ixelles',              x: 293, y: 40,  z: 3 },
  { name: 'Fripiers',             x: 289, y: 36,  z: 3 },
  { name: 'Liège',                x: 331, y: 47,  z: 3 },
]

const FRANCE_PATH = 'M218,29 L234,25 L252,57 L280,48 L356,107 L395,154 L392,205 L345,277 L381,419 L358,435 L326,442 L258,488 L220,460 L165,440 L121,421 L100,390 L127,327 L129,280 L98,222 L64,197 L45,184 L23,182 L30,165 L47,148 L105,151 L116,97 L166,106 L195,83 L218,29 Z'
const BELGIUM_PATH = 'M234,25 L258,8 L294,14 L332,46 L356,107 L280,48 L252,57 L234,25 Z'

export default function FranceNetworkMap({ compact = false, resetKey = 0 }) {
  const [visibleZones, setVisibleZones] = useState(0)
  const [hovered, setHovered]           = useState(null)

  useEffect(() => {
    setVisibleZones(0)
    const timers = [
      setTimeout(() => setVisibleZones(1), 700),
      setTimeout(() => setVisibleZones(2), 2200),
      setTimeout(() => setVisibleZones(3), 3800),
      setTimeout(() => setVisibleZones(4), 5200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [resetKey])

  const totalVisible = STORES.filter(s => s.z < visibleZones).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', alignItems: 'center' }}>
      {/* Carte SVG — hauteur principale */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <svg
          viewBox="0 0 430 505"
          style={{ height: '100%', width: 'auto', maxWidth: '100%', display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Grille pointillée subtile pour la texture océan */}
            <pattern id="fnm-dots" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="11" cy="11" r="0.7" fill="rgba(0,171,233,0.10)" />
            </pattern>

            {/* Hachurage diagonal pour la texture territoire */}
            <pattern id="fnm-hatch" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(0,150,220,0.07)" strokeWidth="3" />
            </pattern>

            {/* Gradient radial — France */}
            <radialGradient id="fnm-franceGrad" cx="50%" cy="45%" r="55%">
              <stop offset="0%"   stopColor="rgba(0,100,200,0.42)" />
              <stop offset="100%" stopColor="rgba(0,40,100,0.18)" />
            </radialGradient>

            {/* Gradient radial — Belgique */}
            <radialGradient id="fnm-belgiqueGrad" cx="50%" cy="50%" r="70%">
              <stop offset="0%"   stopColor="rgba(100,60,220,0.38)" />
              <stop offset="100%" stopColor="rgba(60,30,140,0.14)" />
            </radialGradient>

            {/* Filtre lueur pour les bordures */}
            <filter id="fnm-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Lueur douce pour les points */}
            <filter id="fnm-dotglow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Fond pointillé texturé (océan) */}
          <rect width="430" height="505" fill="url(#fnm-dots)" rx="6" />

          {/* ── France ── */}
          {/* Halo externe */}
          <path d={FRANCE_PATH} fill="none" stroke="rgba(0,171,233,0.18)" strokeWidth="8" strokeLinejoin="round" />
          {/* Remplissage gradient */}
          <path d={FRANCE_PATH} fill="url(#fnm-franceGrad)" strokeLinejoin="round" />
          {/* Texture hachurage */}
          <path d={FRANCE_PATH} fill="url(#fnm-hatch)" strokeLinejoin="round" />
          {/* Bordure nette */}
          <path d={FRANCE_PATH} fill="none" stroke="rgba(0,171,233,0.65)" strokeWidth="1.6" strokeLinejoin="round" filter="url(#fnm-glow)" />

          {/* ── Belgique ── */}
          <path d={BELGIUM_PATH} fill="none" stroke="rgba(167,139,250,0.15)" strokeWidth="6" strokeLinejoin="round" />
          <path d={BELGIUM_PATH} fill="url(#fnm-belgiqueGrad)" strokeLinejoin="round" />
          <path d={BELGIUM_PATH} fill="url(#fnm-hatch)" strokeLinejoin="round" />
          <path d={BELGIUM_PATH} fill="none" stroke="rgba(167,139,250,0.55)" strokeWidth="1.3" strokeLinejoin="round" />

          {/* ── Points magasins ── */}
          {STORES.map((s, i) => {
            const visible = s.z < visibleZones
            const zone    = ZONES[s.z]
            const c       = zone.color
            const zStores = STORES.filter(st => st.z === s.z)
            const delay   = `${zStores.indexOf(s) * 0.12}s`
            const tipRight = s.x > 320
            const tipX     = tipRight ? s.x - (s.name.length * 5.5 + 16) : s.x + 8
            const tipW     = s.name.length * 5.5 + 16

            return (
              <g key={i}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {visible && (
                  <>
                    {/* Anneau pulsant 1 */}
                    <circle cx={s.x} cy={s.y} r="4" fill="none" stroke={c} strokeWidth="1.4" opacity="0.65">
                      <animate attributeName="r"       values="4;18"   dur="2.4s" begin={delay} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.65;0" dur="2.4s" begin={delay} repeatCount="indefinite" />
                    </circle>
                    {/* Anneau pulsant 2 (décalé) */}
                    <circle cx={s.x} cy={s.y} r="4" fill="none" stroke={c} strokeWidth="0.9" opacity="0.35">
                      <animate attributeName="r"       values="4;18"   dur="2.4s" begin={`${parseFloat(delay) + 1.2}s`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.35;0" dur="2.4s" begin={`${parseFloat(delay) + 1.2}s`} repeatCount="indefinite" />
                    </circle>
                    {/* Point central */}
                    <circle cx={s.x} cy={s.y} r="4.2" fill={c} filter="url(#fnm-dotglow)" opacity="0.9" />
                    <circle cx={s.x} cy={s.y} r="2"   fill="#fff" opacity="0.85" />
                  </>
                )}

                {/* Tooltip hover */}
                {hovered === i && visible && (
                  <g>
                    <rect x={tipX} y={s.y - 13} width={tipW} height={17} rx={4}
                      fill="rgba(3,12,32,0.93)" stroke={c} strokeWidth="0.8" />
                    <text x={tipX + 8} y={s.y - 2}
                      fill="#fff" fontSize={compact ? 7.5 : 8.5}
                      fontWeight="600" fontFamily="system-ui,sans-serif"
                    >{s.name}</text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Compteur (coin sup gauche) */}
          {totalVisible > 0 && (
            <g>
              <rect x="8" y="8" width="68" height="20" rx="5"
                fill="rgba(0,171,233,0.13)" stroke="rgba(0,171,233,0.30)" strokeWidth="0.7" />
              <text x="42" y="22" textAnchor="middle" fill="#00abe9"
                fontSize="10" fontWeight="800" fontFamily="system-ui,sans-serif">
                {totalVisible} / 33
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Légende */}
      <div style={{
        display: 'flex', gap: compact ? 12 : 20, flexWrap: 'wrap',
        justifyContent: 'center',
        padding: compact ? '6px 0 0' : '10px 0 0',
        flexShrink: 0,
      }}>
        {ZONES.map((z, i) => {
          const revealed = i < visibleZones
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, opacity: revealed ? 1 : 0.2, transition: 'opacity 0.6s ease' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: z.color, boxShadow: revealed ? `0 0 5px ${z.color}` : 'none' }} />
              <span style={{ fontSize: compact ? 9 : 11, color: revealed ? z.color : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>{z.name}</span>
              <span style={{ fontSize: compact ? 8 : 10, color: 'rgba(255,255,255,0.3)' }}>{z.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
