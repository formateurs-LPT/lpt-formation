'use client'

// ── Chemin du verre (ovale organique) ────────────────────────────
const LENS = "M150,20 C218,15 282,80 282,185 C282,282 222,362 150,362 C78,362 18,282 18,185 C18,80 82,15 150,20 Z"

// ── Corridor central (zone nette) — even-odd trick pour le grid ──
// Le grid = LENS - CORRIDOR → uniquement sur les côtés (aberrations)
const CORRIDOR = "M115,20 C104,96 98,154 114,195 C98,236 104,294 103,362 L197,362 C196,294 202,236 186,195 C202,154 196,96 185,20 Z"

export default function VerreProgressifSVG({ highlight = null, width = 260, height = 330, id = 'vps' }) {
  const loinColor  = highlight === 'haut'   ? 'rgba(124,58,237,0.55)' : 'rgba(124,58,237,0.13)'
  const interColor = highlight === 'milieu' ? 'rgba(74,222,128,0.55)' : 'rgba(74,222,128,0.09)'
  const presColor  = highlight === 'bas'    ? 'rgba(245,158,11,0.55)' : 'rgba(245,158,11,0.13)'

  const loinLabel  = highlight === 'haut'   ? '#fff' : 'rgba(167,139,250,0.85)'
  const interLabel = highlight === 'milieu' ? '#fff' : 'rgba(74,222,128,0.75)'
  const presLabel  = highlight === 'bas'    ? '#fff' : 'rgba(245,158,11,0.85)'

  return (
    <svg
      viewBox="0 0 300 382"
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* Clip sur la forme du verre */}
        <clipPath id={`${id}-c`}>
          <path d={LENS} />
        </clipPath>

        {/* Maillage bleu digital (zone latérales / aberrations) */}
        <pattern id={`${id}-g`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M18 0 L0 0 0 18" fill="none" stroke="rgba(0,110,230,0.38)" strokeWidth="0.7" />
        </pattern>

        {/* Fond verre sombre + légère lueur interne */}
        <radialGradient id={`${id}-bg`} cx="38%" cy="30%" r="68%">
          <stop offset="0%"   stopColor="#1c2c50" stopOpacity="0.78" />
          <stop offset="65%"  stopColor="#06101f" stopOpacity="0.93" />
          <stop offset="100%" stopColor="#020710" stopOpacity="0.99" />
        </radialGradient>

        {/* Reflet surface (coin supérieur gauche) */}
        <linearGradient id={`${id}-rl`} x1="0%" y1="0%" x2="65%" y2="40%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
          <stop offset="55%"  stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Halo violet autour du verre */}
        <filter id={`${id}-glow`} x="-20%" y="-10%" width="140%" height="120%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feFlood floodColor="#7c3aed" floodOpacity="0.35" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* ── 1. Fond sombre (corps du verre) ─── */}
      <path d={LENS} fill={`url(#${id}-bg)`} />

      {/* ── 2. Maillage bleu uniquement sur les zones latérales ─── */}
      {/* even-odd : LENS - CORRIDOR = côtés seulement */}
      <path
        d={`${LENS} ${CORRIDOR}`}
        fill={`url(#${id}-g)`}
        fillRule="evenodd"
        clipPath={`url(#${id}-c)`}
        opacity="0.9"
      />

      {/* ── 3. Overlays colorés des 3 zones (clippés au verre) ─── */}
      <rect x="0"   y="20"  width="300" height="143" fill={loinColor}  clipPath={`url(#${id}-c)`} style={{ transition: 'fill 0.35s ease' }} />
      <rect x="0"   y="163" width="300" height="82"  fill={interColor} clipPath={`url(#${id}-c)`} style={{ transition: 'fill 0.35s ease' }} />
      <rect x="0"   y="245" width="300" height="117" fill={presColor}  clipPath={`url(#${id}-c)`} style={{ transition: 'fill 0.35s ease' }} />

      {/* ── 4. Lignes séparatrices en pointillés (courbes en S) ─── */}
      <path
        d="M 22,152 Q 86,133 150,150 Q 214,167 278,150"
        fill="none" stroke="rgba(255,255,255,0.60)"
        strokeWidth="1.8" strokeDasharray="5,3"
        clipPath={`url(#${id}-c)`}
      />
      <path
        d="M 25,250 Q 88,233 150,250 Q 212,267 275,252"
        fill="none" stroke="rgba(255,255,255,0.60)"
        strokeWidth="1.8" strokeDasharray="5,3"
        clipPath={`url(#${id}-c)`}
      />

      {/* ── 5. Reflet de surface (brillance haut-gauche) ─── */}
      <path d={LENS} fill={`url(#${id}-rl)`} />

      {/* ── 6. Contour du verre + halo violet ─── */}
      <path
        d={LENS}
        fill="none"
        stroke="rgba(124,58,237,0.55)"
        strokeWidth="2"
        filter={`url(#${id}-glow)`}
      />

      {/* ── 7. Labels zones ─── */}
      <text x="150" y="93"  textAnchor="middle"
        fontSize="14" fontWeight="800" letterSpacing="3"
        fontFamily="system-ui,sans-serif"
        fill={loinLabel}
        style={{ transition: 'fill 0.35s ease' }}
      >LOIN</text>

      <text x="150" y="207" textAnchor="middle"
        fontSize="9.5" fontWeight="700" letterSpacing="2"
        fontFamily="system-ui,sans-serif"
        fill={interLabel}
        style={{ transition: 'fill 0.35s ease' }}
      >INTERMÉD.</text>

      <text x="150" y="308" textAnchor="middle"
        fontSize="14" fontWeight="800" letterSpacing="3"
        fontFamily="system-ui,sans-serif"
        fill={presLabel}
        style={{ transition: 'fill 0.35s ease' }}
      >PRÈS</text>

      {/* Labels "FLOU" sur les côtés */}
      <text x="50"  y="196" textAnchor="middle"
        fontSize="7.5" fontWeight="700" letterSpacing="1"
        fontFamily="system-ui,sans-serif"
        fill="rgba(80,140,255,0.55)"
      >FLOU</text>
      <text x="250" y="196" textAnchor="middle"
        fontSize="7.5" fontWeight="700" letterSpacing="1"
        fontFamily="system-ui,sans-serif"
        fill="rgba(80,140,255,0.55)"
      >FLOU</text>
    </svg>
  )
}
