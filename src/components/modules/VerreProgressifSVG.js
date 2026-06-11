'use client'

// ─────────────────────────────────────────────────────────────────
//  Verre progressif — rendu SVG inspiré d'un verre ophtalmique 3D
//  highlight: 'haut' | 'milieu' | 'bas' | null
// ─────────────────────────────────────────────────────────────────

// Forme principale du verre (ovale légèrement organique, 300×382)
const P_LENS =
  'M148,16 C208,11 276,72 280,178 C284,284 228,366 150,368 ' +
  'C72,368 16,282 18,178 C20,76 88,21 148,16 Z'

// Tranche du verre (décalée +5/+7, légèrement plus grande → rebord visible)
const P_RIM =
  'M152,23 C213,18 278,78 282,184 C286,288 230,370 150,374 ' +
  'C70,374 14,286 16,184 C18,82 91,28 152,23 Z'

// Corridor central (zone nette au centre — technique even-odd pour le maillage)
const P_CORRIDOR =
  'M116,16 C105,92 100,152 116,192 C100,232 105,292 104,368 ' +
  'L196,368 C195,292 200,232 184,192 C200,152 195,92 184,16 Z'

export default function VerreProgressifSVG({
  highlight = null,
  width = 260,
  height = 336,
  id = 'vps',
  animate = false,
}) {
  const loinFill  = highlight === 'haut'   ? 'rgba(124,58,237,0.58)'  : 'rgba(124,58,237,0.10)'
  const interFill = highlight === 'milieu' ? 'rgba(74,222,128,0.58)'  : 'rgba(74,222,128,0.07)'
  const presFill  = highlight === 'bas'    ? 'rgba(245,158,11,0.58)'  : 'rgba(245,158,11,0.10)'

  const loinLbl  = highlight === 'haut'   ? '#fff' : 'rgba(167,139,250,0.9)'
  const interLbl = highlight === 'milieu' ? '#fff' : 'rgba(74,222,128,0.82)'
  const presLbl  = highlight === 'bas'    ? '#fff' : 'rgba(245,158,11,0.9)'

  return (
    <svg
      viewBox="0 0 300 385"
      width={width}
      height={height}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        {/* ── Clip sur le contour principal ── */}
        <clipPath id={`${id}-clip`}>
          <path d={P_LENS} />
        </clipPath>

        {/* ── Maillage numérique (zones latérales / aberrations) ── */}
        <pattern id={`${id}-g`} x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0 L0 0 0 16" fill="none" stroke="rgba(0,100,255,0.45)" strokeWidth="0.65"/>
        </pattern>

        {/* ── Corps du verre : dégradé sombre profond ── */}
        <radialGradient id={`${id}-body`} cx="36%" cy="28%" r="70%">
          <stop offset="0%"   stopColor="#1a2f55" stopOpacity="0.80"/>
          <stop offset="42%"  stopColor="#08121e" stopOpacity="0.93"/>
          <stop offset="80%"  stopColor="#030c14" stopOpacity="0.97"/>
          <stop offset="100%" stopColor="#010608" stopOpacity="1.00"/>
        </radialGradient>

        {/* ── Tranche / rebord visible en bas ── */}
        <linearGradient id={`${id}-rim`} x1="0%" y1="0%" x2="20%" y2="100%">
          <stop offset="0%"   stopColor="rgba(70,100,160,0.22)"/>
          <stop offset="50%"  stopColor="rgba(50, 75,130,0.45)"/>
          <stop offset="100%" stopColor="rgba(30, 50,100,0.30)"/>
        </linearGradient>

        {/* ── Courbure de surface (gradient multi-couche simulant le relief) ── */}
        <radialGradient id={`${id}-curv`} cx="26%" cy="20%" r="58%">
          <stop offset="0%"   stopColor="rgba(160,200,255,0.20)"/>
          <stop offset="28%"  stopColor="rgba(80,130,220,0.10)"/>
          <stop offset="65%"  stopColor="rgba(20,50,120,0.04)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>

        {/* ── Halo spéculaire principal (tache brillante haut-gauche) ── */}
        <radialGradient id={`${id}-spec`} cx="29%" cy="22%" r="28%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.30)"/>
          <stop offset="45%"  stopColor="rgba(255,255,255,0.10)"/>
          <stop offset="100%" stopColor="rgba(255,255,255,0)"/>
        </radialGradient>

        {/* ── Reflet secondaire bas-droite ── */}
        <radialGradient id={`${id}-spec2`} cx="78%" cy="80%" r="22%">
          <stop offset="0%"   stopColor="rgba(140,160,220,0.12)"/>
          <stop offset="100%" stopColor="rgba(0,0,0,0)"/>
        </radialGradient>

        {/* ── Liseré haut : dégradé horizontal → effet bord arrondi ── */}
        <linearGradient id={`${id}-edge`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(160,190,255,0)"/>
          <stop offset="22%"  stopColor="rgba(190,215,255,0.60)"/>
          <stop offset="50%"  stopColor="rgba(210,230,255,0.70)"/>
          <stop offset="78%"  stopColor="rgba(160,190,255,0.55)"/>
          <stop offset="100%" stopColor="rgba(100,140,220,0)"/>
        </linearGradient>

        {/* ── Halo violet périphérique ── */}
        <filter id={`${id}-glow`} x="-25%" y="-12%" width="150%" height="124%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="b"/>
          <feFlood floodColor="#7c3aed" floodOpacity="0.45" result="c"/>
          <feComposite in="c" in2="b" operator="in" result="s"/>
          <feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

        {/* ── Flou doux (ombre portée + reflet) ── */}
        <filter id={`${id}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="10"/>
        </filter>
        <filter id={`${id}-blur2`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5"/>
        </filter>

        {/* ── Déformation du maillage pour effet surface courbée ── */}
        <filter id={`${id}-warp`} x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.006" numOctaves="2" seed="3" result="turb"/>
          <feDisplacementMap in="SourceGraphic" in2="turb" scale="5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>

      {/* ══ 0. Ombre portée sous le verre ══ */}
      <ellipse
        cx="150" cy="378" rx="112" ry="10"
        fill="rgba(0,0,30,0.55)"
        filter={`url(#${id}-blur)`}
      />

      {/* ══ 1. Tranche / rebord (décalé = effet épaisseur 3D) ══ */}
      <path d={P_RIM} fill={`url(#${id}-rim)`} />

      {/* ══ 2. Corps principal sombre ══ */}
      <path d={P_LENS} fill={`url(#${id}-body)`} />

      {/* ══ 3. Maillage numérique bleu sur zones latérales uniquement ══ */}
      {/*  even-odd : LENS - CORRIDOR = côtés seulement   */}
      <path
        d={`${P_LENS} ${P_CORRIDOR}`}
        fill={`url(#${id}-g)`}
        fillRule="evenodd"
        clipPath={`url(#${id}-clip)`}
        filter={`url(#${id}-warp)`}
        opacity="0.90"
      />

      {/* ══ 4. Overlays colorés des 3 zones (avec transition) ══ */}
      <rect x="0"  y="16"  width="300" height="144"
        fill={loinFill}  clipPath={`url(#${id}-clip)`}
        style={{ transition: 'fill 0.4s ease' }}
      />
      <rect x="0"  y="160" width="300" height="84"
        fill={interFill} clipPath={`url(#${id}-clip)`}
        style={{ transition: 'fill 0.4s ease' }}
      />
      <rect x="0"  y="244" width="300" height="124"
        fill={presFill}  clipPath={`url(#${id}-clip)`}
        style={{ transition: 'fill 0.4s ease' }}
      />

      {/* ══ 5. Lignes de séparation en S pointillées ══ */}
      <path
        d="M 20,152 Q 84,132 150,150 Q 216,168 280,150"
        fill="none" stroke="rgba(255,255,255,0.60)"
        strokeWidth="1.7" strokeDasharray="5,3.2"
        clipPath={`url(#${id}-clip)`}
      />
      <path
        d="M 22,250 Q 86,232 150,250 Q 214,268 278,252"
        fill="none" stroke="rgba(255,255,255,0.60)"
        strokeWidth="1.7" strokeDasharray="5,3.2"
        clipPath={`url(#${id}-clip)`}
      />

      {/* ══ 6. Courbure surface (dégradé de relief) ══ */}
      <path d={P_LENS} fill={`url(#${id}-curv)`} />

      {/* ══ 7. Reflet secondaire bas-droite ══ */}
      <path d={P_LENS} fill={`url(#${id}-spec2)`} />

      {/* ══ 8. Halo spéculaire principal (flou large) ══ */}
      <ellipse
        cx="88" cy="85" rx="78" ry="52"
        fill="white" opacity="0.13"
        filter={`url(#${id}-blur2)`}
        clipPath={`url(#${id}-clip)`}
      />

      {/* ══ 9. Tache spéculaire nette ══ */}
      <path d={P_LENS} fill={`url(#${id}-spec)`} />

      {/* ══ 10. Liseré supérieur brillant (arête du verre) ══ */}
      <path
        d="M 78,40 Q 148,18 222,40"
        fill="none"
        stroke={`url(#${id}-edge)`}
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* ══ 11. Contour avec halo violet ══ */}
      <path
        d={P_LENS}
        fill="none"
        stroke="rgba(124,58,237,0.65)"
        strokeWidth="1.4"
        filter={`url(#${id}-glow)`}
      />

      {/* ══ 12. Labels de zones ══ */}
      <text x="150" y="94" textAnchor="middle"
        fontSize="13" fontWeight="800" letterSpacing="3.5"
        fontFamily="system-ui,sans-serif"
        fill={loinLbl}
        style={{ transition: 'fill 0.4s ease' }}
      >LOIN</text>

      <text x="150" y="206" textAnchor="middle"
        fontSize="9" fontWeight="700" letterSpacing="2"
        fontFamily="system-ui,sans-serif"
        fill={interLbl}
        style={{ transition: 'fill 0.4s ease' }}
      >INTERMÉD.</text>

      <text x="150" y="306" textAnchor="middle"
        fontSize="13" fontWeight="800" letterSpacing="3.5"
        fontFamily="system-ui,sans-serif"
        fill={presLbl}
        style={{ transition: 'fill 0.4s ease' }}
      >PRÈS</text>

      {/* Labels "FLOU" latéraux */}
      <text x="46"  y="198" textAnchor="middle"
        fontSize="7" fontWeight="700" letterSpacing="0.8"
        fontFamily="system-ui,sans-serif"
        fill="rgba(80,150,255,0.55)"
      >FLOU</text>
      <text x="254" y="198" textAnchor="middle"
        fontSize="7" fontWeight="700" letterSpacing="0.8"
        fontFamily="system-ui,sans-serif"
        fill="rgba(80,150,255,0.55)"
      >FLOU</text>
    </svg>
  )
}
