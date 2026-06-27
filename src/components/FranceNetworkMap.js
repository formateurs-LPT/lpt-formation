'use client'
import { useState, useEffect } from 'react'

// ── Données géographiques ─────────────────────────────────────
// viewBox "0 0 430 505" — coordonnées calculées depuis lat/lon réelles
// svgX = (lon + 5.5) / 14 * 420   svgY = (51.5 - lat) / 9.5 * 500

const ZONES = [
  { id: 0, name: 'Paris & Île-de-France', color: '#00abe9', count: 9 },
  { id: 1, name: 'Nord',                  color: '#4ade80', count: 6 },
  { id: 2, name: 'Zone Sud',              color: '#f59e0b', count: 13 },
  { id: 3, name: 'Belgique',              color: '#a78bfa', count: 5 },
]

const STORES = [
  // Zone 0 — Paris & Île-de-France
  { name: 'Châtelet',           x: 238, y: 140, z: 0 },
  { name: 'St Lazare',          x: 233, y: 137, z: 0 },
  { name: 'Montparnasse',       x: 231, y: 143, z: 0 },
  { name: 'Italie 2',           x: 236, y: 146, z: 0 },
  { name: 'Commerce',           x: 229, y: 142, z: 0 },
  { name: 'Bastille',           x: 240, y: 139, z: 0 },
  { name: 'Belle épine',        x: 235, y: 150, z: 0 },
  { name: 'Cergy',              x: 224, y: 129, z: 0 },
  { name: 'Créteil',            x: 242, y: 148, z: 0 },
  // Zone 1 — Nord hors Paris
  { name: 'Lille',              x: 257, y: 46,  z: 1 },
  { name: 'Rouen',              x: 196, y: 110, z: 1 },
  { name: 'Rennes',             x: 115, y: 180, z: 1 },
  { name: 'Nantes',             x: 119, y: 225, z: 1 },
  { name: 'Reims',              x: 284, y: 120, z: 1 },
  { name: 'Strasbourg',         x: 395, y: 154, z: 1 },
  // Zone 2 — Zone Sud
  { name: 'Bordeaux',           x: 148, y: 348, z: 2 },
  { name: 'Bègles',             x: 153, y: 354, z: 2 },
  { name: 'Bayonne',            x: 121, y: 420, z: 2 },
  { name: 'Lyon',               x: 310, y: 303, z: 2 },
  { name: 'Toulouse Capitole',  x: 207, y: 414, z: 2 },
  { name: 'Toulouse Blagnac',   x: 201, y: 409, z: 2 },
  { name: 'Montpellier Comédie',x: 277, y: 413, z: 2 },
  { name: 'Montpellier Odysseum',x:284, y: 418, z: 2 },
  { name: 'Nice',               x: 381, y: 409, z: 2 },
  { name: 'Marseille Cannebière',x: 322, y: 428, z: 2 },
  { name: 'Marseille TDP',      x: 329, y: 432, z: 2 },
  { name: 'Toulon Mayol',       x: 340, y: 437, z: 2 },
  { name: 'Toulon Avenue 83',   x: 347, y: 441, z: 2 },
  // Zone 3 — Belgique
  { name: 'Namur',              x: 311, y: 55,  z: 3 },
  { name: 'Charleroi',          x: 297, y: 62,  z: 3 },
  { name: 'Ixelles',            x: 293, y: 40,  z: 3 },
  { name: 'Fripiers',           x: 289, y: 36,  z: 3 },
  { name: 'Liège',              x: 331, y: 47,  z: 3 },
]

// Contours géographiques précis (calculés depuis lat/lon)
const FRANCE_PATH = [
  'M 218,29',    // Calais
  'L 234,25',    // Dunkerque
  'L 252,57',    // Frontière belge O
  'L 280,48',    // Ardennes
  'L 356,107',   // Luxembourg
  'L 395,154',   // Strasbourg / Rhin
  'L 392,205',   // Bâle / Suisse
  'L 345,277',   // Jura / Genève
  'L 381,419',   // Frontière italienne / Nice
  'L 358,435',   // Côte d\'Azur
  'L 326,442',   // Marseille
  'L 258,488',   // Perpignan / Pyrénées E
  'L 220,460',   // Pyrénées centrales
  'L 165,440',   // Pyrénées centrales
  'L 121,421',   // Bayonne / frontière espagnole
  'L 100,390',   // Côte basque / Landes
  'L 127,327',   // Gironde
  'L 129,280',   // La Rochelle
  'L 98,222',    // Loire / Saint-Nazaire
  'L 64,197',    // Lorient / Bretagne S
  'L 45,184',    // Quimper
  'L 23,182',    // Pointe du Raz
  'L 30,165',    // Brest
  'L 47,148',    // Roscoff / Bretagne N
  'L 105,151',   // Saint-Malo
  'L 116,97',    // Cherbourg / Cotentin
  'L 166,106',   // Le Havre / Normandie
  'L 195,83',    // Dieppe
  'L 218,29 Z',
].join(' ')

const BELGIUM_PATH = [
  'M 234,25',   // Dunkerque
  'L 258,8',    // Côte belge (Ostende)
  'L 294,14',   // Côte belge E (Anvers)
  'L 332,46',   // Liège
  'L 356,107',  // Luxembourg
  'L 280,48',   // Frontière F-B E
  'L 252,57',   // Frontière F-B O
  'L 234,25 Z',
].join(' ')

// ── Composant principal ───────────────────────────────────────
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* SVG Map */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <svg
          viewBox="0 0 430 505"
          style={{ width: '100%', height: '100%', display: 'block' }}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* France métropolitaine */}
          <path
            d={FRANCE_PATH}
            fill="rgba(0,60,140,0.28)"
            stroke="rgba(0,171,233,0.5)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {/* Belgique */}
          <path
            d={BELGIUM_PATH}
            fill="rgba(100,60,200,0.18)"
            stroke="rgba(167,139,250,0.45)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Points magasins */}
          {STORES.map((s, i) => {
            const visible = s.z < visibleZones
            const zone = ZONES[s.z]
            const c = zone.color
            const zoneStores = STORES.filter(st => st.z === s.z)
            const delay = `${zoneStores.indexOf(s) * 0.12}s`

            // Tooltip position — éviter débordement à droite
            const tipX = s.x > 340 ? s.x - 100 : s.x + 8
            const tipWidth = s.name.length * 6 + 16
            const tipY = s.y - 12

            return (
              <g key={i}
                style={{ cursor: 'default' }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {visible && (
                  <>
                    {/* Anneau pulsant (SMIL) */}
                    <circle cx={s.x} cy={s.y} r="4" fill="none" stroke={c} strokeWidth="1.5" opacity="0.7">
                      <animate attributeName="r" values="4;20" dur="2.2s" begin={delay} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.7;0" dur="2.2s" begin={delay} repeatCount="indefinite" />
                    </circle>
                    {/* Deuxième anneau décalé */}
                    <circle cx={s.x} cy={s.y} r="4" fill="none" stroke={c} strokeWidth="1" opacity="0.4">
                      <animate attributeName="r" values="4;20" dur="2.2s" begin={`calc(${delay} + 1.1s)`} repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0" dur="2.2s" begin={`calc(${delay} + 1.1s)`} repeatCount="indefinite" />
                    </circle>
                    {/* Point central */}
                    <circle cx={s.x} cy={s.y} r="4" fill={c} opacity="0.95" />
                    <circle cx={s.x} cy={s.y} r="2" fill="#fff" opacity="0.7" />
                  </>
                )}

                {/* Tooltip au hover */}
                {hovered === i && visible && (
                  <g>
                    <rect
                      x={tipX} y={tipY}
                      width={tipWidth} height={18}
                      rx={4}
                      fill="rgba(3,17,42,0.92)"
                      stroke={c}
                      strokeWidth="0.8"
                    />
                    <text
                      x={tipX + 8} y={tipY + 12}
                      fill="#fff"
                      fontSize={compact ? 8 : 9}
                      fontWeight="600"
                      fontFamily="system-ui, sans-serif"
                    >{s.name}</text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Compteur total (coin sup gauche) */}
          {totalVisible > 0 && (
            <g>
              <rect x="8" y="8" width="72" height="22" rx="6" fill="rgba(0,171,233,0.15)" stroke="rgba(0,171,233,0.35)" strokeWidth="0.8" />
              <text x="44" y="23" textAnchor="middle" fill="#00abe9" fontSize="11" fontWeight="800" fontFamily="system-ui, sans-serif">
                {totalVisible} / 33
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Légende zones */}
      <div style={{
        display: 'flex', gap: compact ? 10 : 18, flexWrap: 'wrap',
        justifyContent: 'center',
        padding: compact ? '8px 0 0' : '12px 0 0',
        flexShrink: 0,
      }}>
        {ZONES.map((z, i) => {
          const revealed = i < visibleZones
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: revealed ? 1 : 0.2,
              transition: 'opacity 0.6s ease',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, boxShadow: revealed ? `0 0 6px ${z.color}` : 'none' }} />
              <span style={{ fontSize: compact ? 10 : 12, color: revealed ? z.color : 'rgba(255,255,255,0.3)', fontWeight: 700 }}>
                {z.name}
              </span>
              <span style={{ fontSize: compact ? 9 : 11, color: 'rgba(255,255,255,0.3)' }}>
                {z.count}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
