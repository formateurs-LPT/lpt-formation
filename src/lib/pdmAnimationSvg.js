'use client'
import { useState, useEffect, useRef } from 'react'

// ── Coordonnees SVG ────────────────────────────────────────────────
const EYE_L      = { x: 638, y: 246 }
const EYE_R      = { x: 712, y: 246 }
const FRAME_RX   = 31
const FRAME_RY   = 21
const LENS_R     = 108
const LENS_INIT  = { x: 190, y: 310 }
const LENS_EYE   = EYE_L
// Ramanujan approx of ellipse perimeter
const FRAME_PERIM = Math.PI * (3 * (FRAME_RX + FRAME_RY) - Math.sqrt((3 * FRAME_RX + FRAME_RY) * (FRAME_RX + 3 * FRAME_RY)))

export const PDM_ANIM_STEP_LABELS = [
  'Le verre brut',
  'Centre optique',
  'A quoi ca sert ?',
  'La monture sur le client',
  'Les mesures',
  'Positionnement du verre',
  'Trace du contour',
  'Taillage progressif',
  'Verre taille en place',
]

// eslint-disable-next-line react/display-name
export function PDMAnimationSVG({ animStep }) {
  const [lensRx, setLensRx]         = useState(LENS_R)
  const [lensRy, setLensRy]         = useState(LENS_R)
  const [dashOffset, setDashOffset] = useState(FRAME_PERIM)
  const cutTimerRef = useRef(null)
  const cutRafRef   = useRef(null)
  const dashRafRef  = useRef(null)

  // Taillage progressif (step 7)
  useEffect(() => {
    clearTimeout(cutTimerRef.current)
    if (cutRafRef.current) cancelAnimationFrame(cutRafRef.current)

    if (animStep === 7) {
      setLensRx(LENS_R)
      setLensRy(LENS_R)
      cutTimerRef.current = setTimeout(() => {
        const start = Date.now()
        const dur = 2200
        const fn = () => {
          const p = Math.min((Date.now() - start) / dur, 1)
          const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
          setLensRx(LENS_R + (FRAME_RX - LENS_R) * e)
          setLensRy(LENS_R + (FRAME_RY - LENS_R) * e)
          if (p < 1) cutRafRef.current = requestAnimationFrame(fn)
        }
        cutRafRef.current = requestAnimationFrame(fn)
      }, 1350)
    } else if (animStep < 7) {
      setLensRx(LENS_R)
      setLensRy(LENS_R)
    } else {
      setLensRx(FRAME_RX)
      setLensRy(FRAME_RY)
    }
    return () => {
      clearTimeout(cutTimerRef.current)
      if (cutRafRef.current) cancelAnimationFrame(cutRafRef.current)
    }
  }, [animStep])

  // Trace du contour (step 6)
  useEffect(() => {
    if (dashRafRef.current) cancelAnimationFrame(dashRafRef.current)
    if (animStep === 6) {
      setDashOffset(FRAME_PERIM)
      const start = Date.now()
      const dur = 1600
      const fn = () => {
        const p = Math.min((Date.now() - start) / dur, 1)
        setDashOffset(FRAME_PERIM * (1 - p))
        if (p < 1) dashRafRef.current = requestAnimationFrame(fn)
      }
      dashRafRef.current = requestAnimationFrame(fn)
    } else if (animStep < 6) {
      setDashOffset(FRAME_PERIM)
    } else {
      setDashOffset(0)
    }
    return () => { if (dashRafRef.current) cancelAnimationFrame(dashRafRef.current) }
  }, [animStep])

  // Position du verre : init -> oeil (step 5) -> init (step 7) -> oeil (step 8)
  const lensX = (animStep >= 5 && animStep !== 7) ? LENS_EYE.x : LENS_INIT.x
  const lensY = (animStep >= 5 && animStep !== 7) ? LENS_EYE.y : LENS_INIT.y

  const dotOpacity     = animStep >= 1 ? 1 : 0
  const personOpacity  = animStep >= 3 ? 1 : 0
  const measureOpacity = animStep >= 4 ? 1 : 0
  const contourOpacity = animStep >= 6 && animStep < 8 ? 1 : 0
  const showText       = animStep === 2

  // Centre du visage
  const FC = { x: 675, y: 252 }

  return (
    <svg
      viewBox="0 0 900 500"
      style={{ width: '100%', height: 'auto', maxHeight: 440, display: 'block' }}
    >
      <defs>
        <radialGradient id="pdma-lens-g" cx="40%" cy="35%" r="65%">
          <stop offset="0%"   stopColor="rgba(147,210,255,0.32)" />
          <stop offset="100%" stopColor="rgba(80,160,220,0.07)" />
        </radialGradient>
        <filter id="pdma-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pdma-dot" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="pdma-face-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(0,0,0,0.25)"/>
        </filter>
      </defs>

      <rect width="900" height="500" rx="16" fill="rgba(3,17,42,0.6)" />

      {/* ── Tete professionnelle — tete uniquement (step 3+) ── */}
      <g opacity={personOpacity} style={{ transition: 'opacity 0.9s ease' }}>

        {/* Oreilles (derriere la tete) */}
        <ellipse cx={FC.x - 80} cy={FC.y + 10} rx={9} ry={15} fill="#d6a882"/>
        <ellipse cx={FC.x + 80} cy={FC.y + 10} rx={9} ry={15} fill="#d6a882"/>

        {/* Tete */}
        <ellipse cx={FC.x} cy={FC.y} rx={79} ry={96} fill="#eac9a8" filter="url(#pdma-face-shadow)"/>

        {/* Cheveux — coupe courte professionnelle */}
        <path
          d={`M ${FC.x - 79} ${FC.y + 14}
              Q ${FC.x - 82} ${FC.y - 40}
              Q ${FC.x - 60} ${FC.y - 88}
              Q ${FC.x - 20} ${FC.y - 106}
              Q ${FC.x}     ${FC.y - 108}
              Q ${FC.x + 20} ${FC.y - 106}
              Q ${FC.x + 60} ${FC.y - 88}
              Q ${FC.x + 82} ${FC.y - 40}
              Q ${FC.x + 79} ${FC.y + 14}
              Q ${FC.x + 62} ${FC.y - 28}
              Q ${FC.x}     ${FC.y - 40}
              Q ${FC.x - 62} ${FC.y - 28}
              Z`}
          fill="#1c110a"
        />

        {/* Ombre tempes */}
        <ellipse cx={FC.x - 72} cy={FC.y - 10} rx={10} ry={22} fill="rgba(20,12,6,0.18)"/>
        <ellipse cx={FC.x + 72} cy={FC.y - 10} rx={10} ry={22} fill="rgba(20,12,6,0.18)"/>

        {/* Sourcils — fins et definis */}
        <path d={`M ${EYE_L.x - 18} ${EYE_L.y - 22} Q ${EYE_L.x} ${EYE_L.y - 30} ${EYE_L.x + 18} ${EYE_L.y - 24}`}
          stroke="#1c110a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d={`M ${EYE_R.x - 18} ${EYE_R.y - 24} Q ${EYE_R.x} ${EYE_R.y - 30} ${EYE_R.x + 18} ${EYE_R.y - 22}`}
          stroke="#1c110a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>

        {/* Yeux — blancs */}
        <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={14} ry={9.5} fill="white"/>
        <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={14} ry={9.5} fill="white"/>
        {/* Iris */}
        <circle cx={EYE_L.x} cy={EYE_L.y} r={6.5} fill="#5a3a22"/>
        <circle cx={EYE_R.x} cy={EYE_R.y} r={6.5} fill="#5a3a22"/>
        {/* Pupilles */}
        <circle cx={EYE_L.x} cy={EYE_L.y} r={3} fill="#0a0704"/>
        <circle cx={EYE_R.x} cy={EYE_R.y} r={3} fill="#0a0704"/>
        {/* Reflets */}
        <circle cx={EYE_L.x + 2.5} cy={EYE_L.y - 2.5} r={1.8} fill="rgba(255,255,255,0.9)"/>
        <circle cx={EYE_R.x + 2.5} cy={EYE_R.y - 2.5} r={1.8} fill="rgba(255,255,255,0.9)"/>
        {/* Paupiere superieure */}
        <path d={`M ${EYE_L.x - 14} ${EYE_L.y} Q ${EYE_L.x} ${EYE_L.y - 10} ${EYE_L.x + 14} ${EYE_L.y}`}
          stroke="#1c110a" strokeWidth="1.5" fill="none"/>
        <path d={`M ${EYE_R.x - 14} ${EYE_R.y} Q ${EYE_R.x} ${EYE_R.y - 10} ${EYE_R.x + 14} ${EYE_R.y}`}
          stroke="#1c110a" strokeWidth="1.5" fill="none"/>

        {/* Nez — subtil */}
        <path d={`M ${FC.x} ${FC.y + 28} Q ${FC.x - 7} ${FC.y + 42} ${FC.x - 10} ${FC.y + 46} Q ${FC.x - 6} ${FC.y + 50} ${FC.x} ${FC.y + 48} Q ${FC.x + 6} ${FC.y + 50} ${FC.x + 10} ${FC.y + 46} Q ${FC.x + 7} ${FC.y + 42} ${FC.x} ${FC.y + 28}`}
          fill="rgba(0,0,0,0.06)"/>
        <path d={`M ${FC.x - 10} ${FC.y + 46} Q ${FC.x} ${FC.y + 54} ${FC.x + 10} ${FC.y + 46}`}
          stroke="#c09070" strokeWidth="1.5" fill="none" strokeLinecap="round"/>

        {/* Bouche — sourire discret */}
        <path d={`M ${FC.x - 18} ${FC.y + 68} Q ${FC.x} ${FC.y + 80} ${FC.x + 18} ${FC.y + 68}`}
          stroke="#b07050" strokeWidth="2" fill="none" strokeLinecap="round"/>

        {/* Ombre sous le menton */}
        <ellipse cx={FC.x} cy={FC.y + 96} rx={38} ry={6} fill="rgba(0,0,0,0.08)"/>

        {/* ── Monture lunettes (proportionnee au visage) ── */}
        {/* Verre gauche */}
        <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={FRAME_RX} ry={FRAME_RY}
          fill="rgba(147,210,255,0.07)" stroke="#c9a227" strokeWidth="3"/>
        {/* Verre droit */}
        <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={FRAME_RX} ry={FRAME_RY}
          fill="rgba(147,210,255,0.07)" stroke="#c9a227" strokeWidth="3"/>
        {/* Pont */}
        <path
          d={`M ${EYE_L.x + FRAME_RX} ${EYE_L.y - 3} C ${FC.x} ${EYE_L.y - 18} ${FC.x} ${EYE_R.y - 18} ${EYE_R.x - FRAME_RX} ${EYE_R.y - 3}`}
          fill="none" stroke="#c9a227" strokeWidth="3"
        />
        {/* Branche gauche */}
        <path
          d={`M ${EYE_L.x - FRAME_RX} ${EYE_L.y} Q ${FC.x - 82} ${EYE_L.y + 4} ${FC.x - 83} ${EYE_L.y + 18}`}
          fill="none" stroke="#c9a227" strokeWidth="3" strokeLinecap="round"
        />
        {/* Branche droite */}
        <path
          d={`M ${EYE_R.x + FRAME_RX} ${EYE_R.y} Q ${FC.x + 82} ${EYE_R.y + 4} ${FC.x + 83} ${EYE_R.y + 18}`}
          fill="none" stroke="#c9a227" strokeWidth="3" strokeLinecap="round"
        />
      </g>

      {/* ── Lignes de mesure (step 4+) ── */}
      <g opacity={measureOpacity} style={{ transition: 'opacity 0.6s ease' }}>
        {/* Ecart pupillaire */}
        <line x1={EYE_L.x} y1={208} x2={EYE_R.x} y2={208} stroke="#00abe9" strokeWidth="2"/>
        <line x1={EYE_L.x} y1={201} x2={EYE_L.x} y2={215} stroke="#00abe9" strokeWidth="2"/>
        <line x1={EYE_R.x} y1={201} x2={EYE_R.x} y2={215} stroke="#00abe9" strokeWidth="2"/>
        <polygon points={`${EYE_L.x},204 ${EYE_L.x + 14},208 ${EYE_L.x},212`} fill="#00abe9"/>
        <polygon points={`${EYE_R.x},204 ${EYE_R.x - 14},208 ${EYE_R.x},212`} fill="#00abe9"/>
        <text x={FC.x} y={198} textAnchor="middle" fontSize={12} fill="#00abe9"
          fontFamily="system-ui,sans-serif" fontWeight="700">
          Ecart pupillaire
        </text>
        {/* Hauteur de montage */}
        <line x1={597} y1={EYE_L.y} x2={597} y2={EYE_L.y + FRAME_RY} stroke="#22c55e" strokeWidth="2"/>
        <line x1={590} y1={EYE_L.y} x2={604} y2={EYE_L.y} stroke="#22c55e" strokeWidth="2"/>
        <line x1={590} y1={EYE_L.y + FRAME_RY} x2={604} y2={EYE_L.y + FRAME_RY} stroke="#22c55e" strokeWidth="2"/>
        <text
          x={582}
          y={EYE_L.y + 8}
          textAnchor="middle"
          fontSize={11}
          fill="#22c55e"
          fontFamily="system-ui,sans-serif"
          fontWeight="700"
          transform={`rotate(-90 582 ${EYE_L.y + 8})`}
        >
          Hauteur
        </text>
      </g>

      {/* ── Verre (toujours visible, bouge et se taille) ── */}
      <g style={{ transform: `translate(${lensX}px, ${lensY}px)`, transition: 'transform 1.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <ellipse rx={lensRx} ry={lensRy} fill="url(#pdma-lens-g)" filter="url(#pdma-glow)"/>
        <ellipse rx={lensRx} ry={lensRy} fill="none" stroke="rgba(147,210,255,0.85)" strokeWidth="3"/>
        {/* Reflet interne */}
        <ellipse
          rx={lensRx * 0.22} ry={lensRy * 0.52}
          cx={-(lensRx * 0.30)} cy={-(lensRy * 0.25)}
          fill="rgba(255,255,255,0.09)"
          transform="rotate(-22 0 0)"
        />
        {/* Point central */}
        <circle r={9} fill="#f59e0b" opacity={dotOpacity}
          style={{ transition: 'opacity 0.6s' }} filter="url(#pdma-dot)"/>
        {/* Viseur */}
        <g opacity={dotOpacity} style={{ transition: 'opacity 0.6s' }}>
          <line x1={-24} y1={0} x2={-12} y2={0} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={12}  y1={0} x2={24}  y2={0} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={0} y1={-24} x2={0} y2={-12} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={0} y1={12}  x2={0} y2={24}  stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
        </g>
        {/* Contour monture trace sur le verre (step 6-7) */}
        <ellipse
          rx={FRAME_RX} ry={FRAME_RY}
          fill="none" stroke="#f59e0b" strokeWidth="3.5"
          strokeDasharray={FRAME_PERIM} strokeDashoffset={dashOffset}
          strokeLinecap="round" opacity={contourOpacity}
        />
      </g>

      {/* ── Texte explicatif (step 2) — gauche, au-dessus du verre ── */}
      {showText && (
        <g>
          <rect x={16} y={52} width={440} height={115} rx={14}
            fill="rgba(3,17,42,0.93)" stroke="rgba(245,158,11,0.55)" strokeWidth="1.5"/>
          <text x={236} y={88} textAnchor="middle" fontSize={17} fill="#f59e0b"
            fontFamily="system-ui,sans-serif" fontWeight="800">
            Le centre optique du verre
          </text>
          <text x={236} y={113} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.85)"
            fontFamily="system-ui,sans-serif">
            Ce point est l&#39;endroit ou la qualite optique est maximale.
          </text>
          <text x={236} y={132} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.85)"
            fontFamily="system-ui,sans-serif">
            But des PDM : aligner ce point avec la pupille
          </text>
          <text x={236} y={151} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.85)"
            fontFamily="system-ui,sans-serif">
            du client, une fois le verre taille pour la monture.
          </text>
        </g>
      )}

      {/* ── Validation finale (step 8) ── */}
      {animStep >= 8 && (
        <g>
          <rect x={470} y={444} width={310} height={36} rx={18}
            fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.45)" strokeWidth="1.5"/>
          <text x={625} y={467} textAnchor="middle" fontSize={14} fill="#22c55e"
            fontFamily="system-ui,sans-serif" fontWeight="700">
            ✓ Centre optique aligne avec la pupille
          </text>
        </g>
      )}

      {/* ── Etiquette etape ── */}
      <rect x={20} y={18} width={210} height={28} rx={14}
        fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" strokeWidth="1"/>
      <text x={125} y={36} textAnchor="middle" fontSize={12} fill="#f59e0b"
        fontFamily="system-ui,sans-serif" fontWeight="700">
        {PDM_ANIM_STEP_LABELS[animStep] || ''}
      </text>
    </svg>
  )
}
