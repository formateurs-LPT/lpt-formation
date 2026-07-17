'use client'
import { useState, useEffect, useRef } from 'react'

// ── Coordonnées SVG ───────────────────────────────────────────────
const EYE_L      = { x: 575, y: 210 }
const EYE_R      = { x: 665, y: 210 }
const FRAME_RX   = 42
const FRAME_RY   = 28
const LENS_R     = 108
const LENS_INIT  = { x: 185, y: 258 }
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
  const [lensRx, setLensRx]           = useState(LENS_R)
  const [lensRy, setLensRy]           = useState(LENS_R)
  const [dashOffset, setDashOffset]   = useState(FRAME_PERIM)
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

  // Position du verre : init → oeil (step 5) → init (step 7) → oeil (step 8)
  const lensX = (animStep >= 5 && animStep !== 7) ? LENS_EYE.x : LENS_INIT.x
  const lensY = (animStep >= 5 && animStep !== 7) ? LENS_EYE.y : LENS_INIT.y

  const dotOpacity     = animStep >= 1 ? 1 : 0
  const personOpacity  = animStep >= 3 ? 1 : 0
  const measureOpacity = animStep >= 4 ? 1 : 0
  const contourOpacity = animStep >= 6 && animStep < 8 ? 1 : 0
  const showText       = animStep === 2

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
      </defs>

      <rect width="900" height="500" rx="16" fill="rgba(3,17,42,0.6)" />

      {/* ── Personnage + monture (step 3+) ── */}
      <g opacity={personOpacity} style={{ transition: 'opacity 0.9s ease' }}>
        {/* Corps */}
        <rect x={562} y={290} width={116} height={96} rx={18} fill="#0a2a5c"/>
        {/* Cou */}
        <rect x={606} y={262} width={28} height={32} rx={7} fill="#f5c5a0"/>
        {/* Tete */}
        <ellipse cx={620} cy={200} rx={63} ry={73} fill="#f5c5a0"/>
        {/* Cheveux */}
        <ellipse cx={620} cy={150} rx={63} ry={47} fill="#4a2c0a"/>
        <ellipse cx={620} cy={167} rx={63} ry={33} fill="#f5c5a0"/>
        {/* Oreilles */}
        <ellipse cx={558} cy={208} rx={10} ry={15} fill="#f0b890"/>
        <ellipse cx={682} cy={208} rx={10} ry={15} fill="#f0b890"/>
        {/* Sourcils */}
        <path d="M 557 194 Q 573 188 589 192" stroke="#4a2c0a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <path d="M 651 192 Q 667 188 683 194" stroke="#4a2c0a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Blancs des yeux */}
        <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={14} ry={10} fill="#fff"/>
        <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={14} ry={10} fill="#fff"/>
        {/* Pupilles */}
        <circle cx={EYE_L.x} cy={EYE_L.y} r={5} fill="#1a0a30"/>
        <circle cx={EYE_R.x} cy={EYE_R.y} r={5} fill="#1a0a30"/>
        {/* Reflet pupille */}
        <circle cx={EYE_L.x + 2} cy={EYE_L.y - 2} r={1.5} fill="rgba(255,255,255,0.85)"/>
        <circle cx={EYE_R.x + 2} cy={EYE_R.y - 2} r={1.5} fill="rgba(255,255,255,0.85)"/>
        {/* Nez */}
        <ellipse cx={620} cy={229} rx={9} ry={6} fill="rgba(0,0,0,0.07)"/>
        {/* Sourire */}
        <path d="M 607 245 Q 620 258 633 245" stroke="#c4814a" strokeWidth="2" fill="none" strokeLinecap="round"/>
        {/* Monture : oeil gauche */}
        <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={FRAME_RX} ry={FRAME_RY} fill="rgba(147,210,255,0.06)" stroke="#c9a227" strokeWidth="3.5"/>
        {/* Monture : oeil droit */}
        <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={FRAME_RX} ry={FRAME_RY} fill="rgba(147,210,255,0.06)" stroke="#c9a227" strokeWidth="3.5"/>
        {/* Pont */}
        <path
          d={`M ${EYE_L.x + FRAME_RX} ${EYE_L.y - 3} C 620 ${EYE_L.y - 16} 620 ${EYE_R.y - 16} ${EYE_R.x - FRAME_RX} ${EYE_R.y - 3}`}
          fill="none" stroke="#c9a227" strokeWidth="3.5"
        />
        {/* Branches */}
        <line x1={EYE_L.x - FRAME_RX} y1={EYE_L.y} x2={558} y2={217} stroke="#c9a227" strokeWidth="3.5" strokeLinecap="round"/>
        <line x1={EYE_R.x + FRAME_RX} y1={EYE_R.y} x2={682} y2={217} stroke="#c9a227" strokeWidth="3.5" strokeLinecap="round"/>
      </g>

      {/* ── Lignes de mesure (step 4+) ── */}
      <g opacity={measureOpacity} style={{ transition: 'opacity 0.6s ease' }}>
        {/* Ecart pupillaire */}
        <line x1={EYE_L.x} y1={172} x2={EYE_R.x} y2={172} stroke="#00abe9" strokeWidth="2"/>
        <line x1={EYE_L.x} y1={165} x2={EYE_L.x} y2={179} stroke="#00abe9" strokeWidth="2"/>
        <line x1={EYE_R.x} y1={165} x2={EYE_R.x} y2={179} stroke="#00abe9" strokeWidth="2"/>
        <polygon points={`${EYE_L.x},168 ${EYE_L.x + 14},172 ${EYE_L.x},176`} fill="#00abe9"/>
        <polygon points={`${EYE_R.x},168 ${EYE_R.x - 14},172 ${EYE_R.x},176`} fill="#00abe9"/>
        <text x={620} y={162} textAnchor="middle" fontSize={12} fill="#00abe9" fontFamily="system-ui,sans-serif" fontWeight="700">
          Ecart pupillaire
        </text>
        {/* Hauteur de montage */}
        <line x1={543} y1={EYE_L.y} x2={543} y2={EYE_L.y + FRAME_RY} stroke="#22c55e" strokeWidth="2"/>
        <line x1={536} y1={EYE_L.y} x2={550} y2={EYE_L.y} stroke="#22c55e" strokeWidth="2"/>
        <line x1={536} y1={EYE_L.y + FRAME_RY} x2={550} y2={EYE_L.y + FRAME_RY} stroke="#22c55e" strokeWidth="2"/>
        <text
          x={526}
          y={EYE_L.y + 8}
          textAnchor="middle"
          fontSize={11}
          fill="#22c55e"
          fontFamily="system-ui,sans-serif"
          fontWeight="700"
          transform={`rotate(-90 526 ${EYE_L.y + 8})`}
        >
          Hauteur
        </text>
      </g>

      {/* ── Verre (toujours visible, bouge et se taille) ── */}
      <g style={{ transform: `translate(${lensX}px, ${lensY}px)`, transition: 'transform 1.3s cubic-bezier(0.4,0,0.2,1)' }}>
        {/* Corps du verre */}
        <ellipse rx={lensRx} ry={lensRy} fill="url(#pdma-lens-g)" filter="url(#pdma-glow)"/>
        <ellipse rx={lensRx} ry={lensRy} fill="none" stroke="rgba(147,210,255,0.85)" strokeWidth="3"/>
        {/* Reflet interne */}
        <ellipse
          rx={lensRx * 0.22}
          ry={lensRy * 0.52}
          cx={-(lensRx * 0.30)}
          cy={-(lensRy * 0.25)}
          fill="rgba(255,255,255,0.09)"
          transform="rotate(-22 0 0)"
        />
        {/* Point central */}
        <circle
          r={9}
          fill="#f59e0b"
          opacity={dotOpacity}
          style={{ transition: 'opacity 0.6s' }}
          filter="url(#pdma-dot)"
        />
        {/* Viseur */}
        <g opacity={dotOpacity} style={{ transition: 'opacity 0.6s' }}>
          <line x1={-24} y1={0} x2={-12} y2={0} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={12}  y1={0} x2={24}  y2={0} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={0} y1={-24} x2={0} y2={-12} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={0} y1={12}  x2={0} y2={24}  stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
        </g>
        {/* Contour de la monture trace sur le verre (step 6-7) */}
        <ellipse
          rx={FRAME_RX}
          ry={FRAME_RY}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="3.5"
          strokeDasharray={FRAME_PERIM}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          opacity={contourOpacity}
        />
      </g>

      {/* ── Texte explicatif (step 2) ── */}
      {showText && (
        <g>
          <rect x={60} y={112} width={775} height={148} rx={16} fill="rgba(3,17,42,0.92)" stroke="rgba(245,158,11,0.55)" strokeWidth="1.5"/>
          <text x={450} y={154} textAnchor="middle" fontSize={19} fill="#f59e0b" fontFamily="system-ui,sans-serif" fontWeight="800">
            Le centre optique du verre
          </text>
          <text x={450} y={185} textAnchor="middle" fontSize={14} fill="rgba(255,255,255,0.85)" fontFamily="system-ui,sans-serif">
            Ce point est l&#39;endroit ou la qualite optique du verre est maximale.
          </text>
          <text x={450} y={209} textAnchor="middle" fontSize={14} fill="rgba(255,255,255,0.85)" fontFamily="system-ui,sans-serif">
            Objectif des prises de mesures : aligner ce point
          </text>
          <text x={450} y={233} textAnchor="middle" fontSize={14} fill="rgba(255,255,255,0.85)" fontFamily="system-ui,sans-serif">
            avec la pupille du client, une fois le verre taille pour la monture.
          </text>
        </g>
      )}

      {/* ── Validation finale (step 8) ── */}
      {animStep >= 8 && (
        <g>
          <rect x={295} y={444} width={310} height={36} rx={18} fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.45)" strokeWidth="1.5"/>
          <text x={450} y={467} textAnchor="middle" fontSize={14} fill="#22c55e" fontFamily="system-ui,sans-serif" fontWeight="700">
            ✓ Centre optique aligne avec la pupille
          </text>
        </g>
      )}

      {/* ── Etiquette etape ── */}
      <rect x={20} y={20} width={210} height={30} rx={15} fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.4)" strokeWidth="1"/>
      <text x={125} y={39} textAnchor="middle" fontSize={12} fill="#f59e0b" fontFamily="system-ui,sans-serif" fontWeight="700">
        {PDM_ANIM_STEP_LABELS[animStep] || ''}
      </text>
    </svg>
  )
}
