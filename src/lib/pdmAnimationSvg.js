'use client'
import { useState, useEffect, useRef } from 'react'

// ── Coordonnees SVG ────────────────────────────────────────────────
// Visage centre a droite, bien plus grand que precedemment
const FC       = { x: 685, y: 262 }   // centre du visage
const EYE_L    = { x: 634, y: 256 }
const EYE_R    = { x: 736, y: 256 }
const FRAME_RX = 38
const FRAME_RY = 25
const LENS_R   = 108
const LENS_INIT = { x: 190, y: 310 }
const LENS_EYE  = EYE_L
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

      {/* ── Personnage — tete seule, grand format (step 3+) ── */}
      <g opacity={personOpacity} style={{ transition: 'opacity 0.9s ease' }}>

        {/* Oreilles (derriere le visage) */}
        <ellipse cx={FC.x - 107} cy={FC.y + 8} rx={10} ry={16} fill="#d4a580"/>
        <ellipse cx={FC.x + 107} cy={FC.y + 8} rx={10} ry={16} fill="#d4a580"/>

        {/* ── Cheveux : ellipse sombre derriere, visage peau par-dessus ── */}
        {/* L'ellipse des cheveux est centree plus haut et plus large */}
        <ellipse cx={FC.x} cy={FC.y - 72} rx={124} ry={112} fill="#1c110a"/>

        {/* Visage — peau — couvre la partie basse des cheveux */}
        <ellipse cx={FC.x} cy={FC.y} rx={106} ry={126} fill="#ecc9a6"/>

        {/* Ombre sous les pommettes */}
        <ellipse cx={FC.x - 70} cy={FC.y + 28} rx={28} ry={12} fill="rgba(0,0,0,0.05)"/>
        <ellipse cx={FC.x + 70} cy={FC.y + 28} rx={28} ry={12} fill="rgba(0,0,0,0.05)"/>

        {/* Sourcils — fins et arques */}
        <path
          d={`M ${EYE_L.x - 22} ${EYE_L.y - 24} Q ${EYE_L.x} ${EYE_L.y - 34} ${EYE_L.x + 22} ${EYE_L.y - 26}`}
          stroke="#1c110a" strokeWidth="3" fill="none" strokeLinecap="round"
        />
        <path
          d={`M ${EYE_R.x - 22} ${EYE_R.y - 26} Q ${EYE_R.x} ${EYE_R.y - 34} ${EYE_R.x + 22} ${EYE_R.y - 24}`}
          stroke="#1c110a" strokeWidth="3" fill="none" strokeLinecap="round"
        />

        {/* Yeux — blancs */}
        <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={16} ry={10} fill="white"/>
        <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={16} ry={10} fill="white"/>
        {/* Iris */}
        <circle cx={EYE_L.x} cy={EYE_L.y} r={7} fill="#5a3a20"/>
        <circle cx={EYE_R.x} cy={EYE_R.y} r={7} fill="#5a3a20"/>
        {/* Pupilles */}
        <circle cx={EYE_L.x} cy={EYE_L.y} r={3.5} fill="#080504"/>
        <circle cx={EYE_R.x} cy={EYE_R.y} r={3.5} fill="#080504"/>
        {/* Reflets */}
        <circle cx={EYE_L.x + 3} cy={EYE_L.y - 3} r={2} fill="rgba(255,255,255,0.9)"/>
        <circle cx={EYE_R.x + 3} cy={EYE_R.y - 3} r={2} fill="rgba(255,255,255,0.9)"/>
        {/* Paupiere superieure */}
        <path
          d={`M ${EYE_L.x - 16} ${EYE_L.y} Q ${EYE_L.x} ${EYE_L.y - 11} ${EYE_L.x + 16} ${EYE_L.y}`}
          stroke="#1c110a" strokeWidth="1.8" fill="none"
        />
        <path
          d={`M ${EYE_R.x - 16} ${EYE_R.y} Q ${EYE_R.x} ${EYE_R.y - 11} ${EYE_R.x + 16} ${EYE_R.y}`}
          stroke="#1c110a" strokeWidth="1.8" fill="none"
        />

        {/* Nez */}
        <path
          d={`M ${FC.x} ${FC.y + 22} Q ${FC.x - 8} ${FC.y + 44} ${FC.x - 11} ${FC.y + 50} Q ${FC.x} ${FC.y + 58} ${FC.x + 11} ${FC.y + 50} Q ${FC.x + 8} ${FC.y + 44} ${FC.x} ${FC.y + 22}`}
          fill="rgba(0,0,0,0.055)"
        />
        <path
          d={`M ${FC.x - 11} ${FC.y + 50} Q ${FC.x} ${FC.y + 58} ${FC.x + 11} ${FC.y + 50}`}
          stroke="#b8846a" strokeWidth="1.8" fill="none" strokeLinecap="round"
        />

        {/* Bouche — sourire discret */}
        <path
          d={`M ${FC.x - 20} ${FC.y + 74} Q ${FC.x} ${FC.y + 88} ${FC.x + 20} ${FC.y + 74}`}
          stroke="#a86848" strokeWidth="2.2" fill="none" strokeLinecap="round"
        />

        {/* Ombre sous le menton */}
        <ellipse cx={FC.x} cy={FC.y + 126} rx={42} ry={8} fill="rgba(0,0,0,0.07)"/>

        {/* ── Monture lunettes ── */}
        <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={FRAME_RX} ry={FRAME_RY}
          fill="rgba(147,210,255,0.07)" stroke="#c9a227" strokeWidth="3.2"/>
        <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={FRAME_RX} ry={FRAME_RY}
          fill="rgba(147,210,255,0.07)" stroke="#c9a227" strokeWidth="3.2"/>
        {/* Pont */}
        <path
          d={`M ${EYE_L.x + FRAME_RX} ${EYE_L.y - 4} C ${FC.x} ${EYE_L.y - 20} ${FC.x} ${EYE_R.y - 20} ${EYE_R.x - FRAME_RX} ${EYE_R.y - 4}`}
          fill="none" stroke="#c9a227" strokeWidth="3.2"
        />
        {/* Branche gauche */}
        <path
          d={`M ${EYE_L.x - FRAME_RX} ${EYE_L.y} Q ${FC.x - 108} ${EYE_L.y + 6} ${FC.x - 112} ${EYE_L.y + 22}`}
          fill="none" stroke="#c9a227" strokeWidth="3.2" strokeLinecap="round"
        />
        {/* Branche droite */}
        <path
          d={`M ${EYE_R.x + FRAME_RX} ${EYE_R.y} Q ${FC.x + 108} ${EYE_R.y + 6} ${FC.x + 112} ${EYE_R.y + 22}`}
          fill="none" stroke="#c9a227" strokeWidth="3.2" strokeLinecap="round"
        />
      </g>

      {/* ── Mesures (step 4+) ── */}
      <g opacity={measureOpacity} style={{ transition: 'opacity 0.6s ease' }}>
        {/* Ecart pupillaire */}
        <line x1={EYE_L.x} y1={212} x2={EYE_R.x} y2={212} stroke="#00abe9" strokeWidth="2"/>
        <line x1={EYE_L.x} y1={205} x2={EYE_L.x} y2={219} stroke="#00abe9" strokeWidth="2"/>
        <line x1={EYE_R.x} y1={205} x2={EYE_R.x} y2={219} stroke="#00abe9" strokeWidth="2"/>
        <polygon points={`${EYE_L.x},208 ${EYE_L.x + 14},212 ${EYE_L.x},216`} fill="#00abe9"/>
        <polygon points={`${EYE_R.x},208 ${EYE_R.x - 14},212 ${EYE_R.x},216`} fill="#00abe9"/>
        <text x={FC.x} y={202} textAnchor="middle" fontSize={12} fill="#00abe9"
          fontFamily="system-ui,sans-serif" fontWeight="700">
          Ecart pupillaire
        </text>
        {/* Hauteur */}
        <line x1={566} y1={EYE_L.y} x2={566} y2={EYE_L.y + FRAME_RY} stroke="#22c55e" strokeWidth="2"/>
        <line x1={559} y1={EYE_L.y} x2={573} y2={EYE_L.y} stroke="#22c55e" strokeWidth="2"/>
        <line x1={559} y1={EYE_L.y + FRAME_RY} x2={573} y2={EYE_L.y + FRAME_RY} stroke="#22c55e" strokeWidth="2"/>
        <text x={550} y={EYE_L.y + 9} textAnchor="middle" fontSize={11} fill="#22c55e"
          fontFamily="system-ui,sans-serif" fontWeight="700"
          transform={`rotate(-90 550 ${EYE_L.y + 9})`}>
          Hauteur
        </text>
      </g>

      {/* ── Verre ── */}
      <g style={{ transform: `translate(${lensX}px, ${lensY}px)`, transition: 'transform 1.3s cubic-bezier(0.4,0,0.2,1)' }}>
        <ellipse rx={lensRx} ry={lensRy} fill="url(#pdma-lens-g)" filter="url(#pdma-glow)"/>
        <ellipse rx={lensRx} ry={lensRy} fill="none" stroke="rgba(147,210,255,0.85)" strokeWidth="3"/>
        <ellipse
          rx={lensRx * 0.22} ry={lensRy * 0.52}
          cx={-(lensRx * 0.30)} cy={-(lensRy * 0.25)}
          fill="rgba(255,255,255,0.09)" transform="rotate(-22 0 0)"
        />
        <circle r={9} fill="#f59e0b" opacity={dotOpacity}
          style={{ transition: 'opacity 0.6s' }} filter="url(#pdma-dot)"/>
        <g opacity={dotOpacity} style={{ transition: 'opacity 0.6s' }}>
          <line x1={-24} y1={0} x2={-12} y2={0} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={12}  y1={0} x2={24}  y2={0} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={0} y1={-24} x2={0} y2={-12} stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
          <line x1={0} y1={12}  x2={0} y2={24}  stroke="#f59e0b" strokeWidth="2" opacity="0.7"/>
        </g>
        <ellipse
          rx={FRAME_RX} ry={FRAME_RY}
          fill="none" stroke="#f59e0b" strokeWidth="3.5"
          strokeDasharray={FRAME_PERIM} strokeDashoffset={dashOffset}
          strokeLinecap="round" opacity={contourOpacity}
        />
      </g>

      {/* ── Texte centre optique (step 2) — gauche, au-dessus du verre ── */}
      {showText && (
        <g>
          <rect x={16} y={52} width={445} height={118} rx={14}
            fill="rgba(3,17,42,0.93)" stroke="rgba(245,158,11,0.55)" strokeWidth="1.5"/>
          <text x={238} y={88} textAnchor="middle" fontSize={17} fill="#f59e0b"
            fontFamily="system-ui,sans-serif" fontWeight="800">
            Le centre optique du verre
          </text>
          <text x={238} y={113} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.85)"
            fontFamily="system-ui,sans-serif">
            Ce point est l&#39;endroit ou la qualite optique est maximale.
          </text>
          <text x={238} y={133} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.85)"
            fontFamily="system-ui,sans-serif">
            But des PDM : aligner ce point avec la pupille
          </text>
          <text x={238} y={153} textAnchor="middle" fontSize={13} fill="rgba(255,255,255,0.85)"
            fontFamily="system-ui,sans-serif">
            du client, une fois le verre taille pour la monture.
          </text>
        </g>
      )}

      {/* ── Validation finale (step 8) ── */}
      {animStep >= 8 && (
        <g>
          <rect x={525} y={444} width={336} height={36} rx={18}
            fill="rgba(34,197,94,0.15)" stroke="rgba(34,197,94,0.45)" strokeWidth="1.5"/>
          <text x={693} y={467} textAnchor="middle" fontSize={14} fill="#22c55e"
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
