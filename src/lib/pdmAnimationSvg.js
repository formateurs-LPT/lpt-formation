'use client'
import { useState, useEffect, useRef } from 'react'

// ── Repères sur la photo réelle (public/assets/pdm-avatar-model.png,
// 1654×951) — calibrés visuellement sur le verre gauche à l'écran (l'œil
// droit du sujet), là où l'animation du verre vient se poser. ────────
const PHOTO_W  = 1654
const PHOTO_H  = 951
const PUPIL_L  = { x: 727, y: 445 } // pupille de l'œil droit du sujet (à gauche à l'écran)
const PUPIL_R  = { x: 929, y: 445 } // pupille de l'autre œil, repère pour l'écart pupillaire
const FRAME_C  = { x: 725, y: 458 } // centre géométrique du verre de la monture sur la photo
const FRAME_R  = 70                 // rayon du verre de la monture sur la photo (cerclage rond)
const LENS_R   = 190                // rayon du verre brut avant découpe
const LENS_INIT = { x: 300, y: 610 }
const FRAME_PERIM = 2 * Math.PI * FRAME_R
// Décalage de la pupille par rapport au centre géométrique de la monture : le
// point optique (le point du verre à faire coïncider avec la pupille) n'est
// pas forcément au centre exact du verre, d'où ce décalage local du repère.
const PUPIL_OFFSET = { x: PUPIL_L.x - FRAME_C.x, y: PUPIL_L.y - FRAME_C.y }

export const PDM_ANIM_STEP_LABELS = [
  'Le verre brut',
  'Centre optique',
  'À quoi ça sert ?',
  'La monture sur le client',
  'Les mesures',
  'Positionnement du verre',
  'Tracé du contour',
  'Taillage du verre',
  'Verre taillé en place',
]

// eslint-disable-next-line react/display-name
export function PDMAnimationSVG({ animStep }) {
  const [lensR, setLensR]           = useState(LENS_R)
  const [dashOffset, setDashOffset] = useState(FRAME_PERIM)
  const cutTimerRef = useRef(null)
  const cutRafRef   = useRef(null)
  const dashRafRef  = useRef(null)

  useEffect(() => {
    clearTimeout(cutTimerRef.current)
    if (cutRafRef.current) cancelAnimationFrame(cutRafRef.current)
    if (animStep === 7) {
      setLensR(LENS_R)
      cutTimerRef.current = setTimeout(() => {
        const start = Date.now()
        const dur = 2200
        const fn = () => {
          const p = Math.min((Date.now() - start) / dur, 1)
          const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p
          setLensR(LENS_R + (FRAME_R - LENS_R) * e)
          if (p < 1) cutRafRef.current = requestAnimationFrame(fn)
        }
        cutRafRef.current = requestAnimationFrame(fn)
      }, 1350)
    } else if (animStep < 7) {
      setLensR(LENS_R)
    } else {
      setLensR(FRAME_R)
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

  const lensX = (animStep >= 5 && animStep !== 7) ? FRAME_C.x : LENS_INIT.x
  const lensY = (animStep >= 5 && animStep !== 7) ? FRAME_C.y : LENS_INIT.y

  const dotOpacity     = animStep >= 1 ? 1 : 0
  const measureOpacity = animStep >= 4 ? 1 : 0
  const contourOpacity = animStep >= 6 && animStep < 8 ? 1 : 0
  const showText       = animStep === 2

  const pdY = PUPIL_L.y - 80 // ligne d'écart pupillaire, au-dessus des yeux
  const hX  = FRAME_C.x - FRAME_R - 105 // ligne de hauteur, à gauche de la monture

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 620, margin: '0 auto', borderRadius: 16, overflow: 'hidden', background: 'rgba(3,17,42,0.6)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/pdm-avatar-model.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
      <svg
        viewBox={`0 0 ${PHOTO_W} ${PHOTO_H}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
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

        {/* ── Mesures (step 4+) ── */}
        <g opacity={measureOpacity} style={{ transition: 'opacity 0.6s ease' }}>
          {/* Ecart pupillaire */}
          <line x1={PUPIL_L.x} y1={pdY} x2={PUPIL_R.x} y2={pdY} stroke="#00abe9" strokeWidth="3"/>
          <line x1={PUPIL_L.x} y1={pdY - 10} x2={PUPIL_L.x} y2={pdY + 10} stroke="#00abe9" strokeWidth="3"/>
          <line x1={PUPIL_R.x} y1={pdY - 10} x2={PUPIL_R.x} y2={pdY + 10} stroke="#00abe9" strokeWidth="3"/>
          <polygon points={`${PUPIL_L.x},${pdY - 5} ${PUPIL_L.x + 22},${pdY} ${PUPIL_L.x},${pdY + 5}`} fill="#00abe9"/>
          <polygon points={`${PUPIL_R.x},${pdY - 5} ${PUPIL_R.x - 22},${pdY} ${PUPIL_R.x},${pdY + 5}`} fill="#00abe9"/>
          <text x={(PUPIL_L.x + PUPIL_R.x) / 2} y={pdY - 16} textAnchor="middle" fontSize={20} fill="#00abe9"
            fontFamily="system-ui,sans-serif" fontWeight="700">
            Écart pupillaire
          </text>
          {/* Hauteur — ligne a gauche de la monture, connecteurs pointilles vers le verre */}
          <line x1={FRAME_C.x - FRAME_R} y1={FRAME_C.y - FRAME_R}
                x2={hX} y2={FRAME_C.y - FRAME_R}
                stroke="#22c55e" strokeWidth="2" strokeDasharray="6 5" opacity="0.7"/>
          <line x1={FRAME_C.x - FRAME_R} y1={FRAME_C.y + FRAME_R}
                x2={hX} y2={FRAME_C.y + FRAME_R}
                stroke="#22c55e" strokeWidth="2" strokeDasharray="6 5" opacity="0.7"/>
          <line x1={hX} y1={FRAME_C.y - FRAME_R} x2={hX} y2={FRAME_C.y + FRAME_R} stroke="#22c55e" strokeWidth="3"/>
          <polygon points={`${hX - 8},${FRAME_C.y - FRAME_R} ${hX + 8},${FRAME_C.y - FRAME_R} ${hX},${FRAME_C.y - FRAME_R + 14}`} fill="#22c55e"/>
          <polygon points={`${hX - 8},${FRAME_C.y + FRAME_R} ${hX + 8},${FRAME_C.y + FRAME_R} ${hX},${FRAME_C.y + FRAME_R - 14}`} fill="#22c55e"/>
          <text x={hX - 22} y={FRAME_C.y + 6} textAnchor="middle" fontSize={18} fill="#22c55e"
            fontFamily="system-ui,sans-serif" fontWeight="700"
            transform={`rotate(-90 ${hX - 22} ${FRAME_C.y + 6})`}>
            Hauteur
          </text>
        </g>

        {/* ── Verre ── */}
        <g style={{ transform: `translate(${lensX}px, ${lensY}px)`, transition: 'transform 1.3s cubic-bezier(0.4,0,0.2,1)' }}>
          <circle r={lensR} fill="url(#pdma-lens-g)" filter="url(#pdma-glow)"/>
          <circle r={lensR} fill="none" stroke="rgba(147,210,255,0.85)" strokeWidth="5"/>
          <ellipse
            rx={lensR * 0.22} ry={lensR * 0.52}
            cx={-(lensR * 0.30)} cy={-(lensR * 0.25)}
            fill="rgba(255,255,255,0.1)" transform="rotate(-22 0 0)"
          />
          {/* Point optique — placé sur la pupille réelle, pas forcément au centre du verre */}
          <g style={{ transform: `translate(${PUPIL_OFFSET.x}px, ${PUPIL_OFFSET.y}px)` }}>
            <circle r={15} fill="#f59e0b" opacity={dotOpacity}
              style={{ transition: 'opacity 0.6s' }} filter="url(#pdma-dot)"/>
            <g opacity={dotOpacity} style={{ transition: 'opacity 0.6s' }}>
              <line x1={-40} y1={0} x2={-20} y2={0} stroke="#f59e0b" strokeWidth="3" opacity="0.7"/>
              <line x1={20}  y1={0} x2={40}  y2={0} stroke="#f59e0b" strokeWidth="3" opacity="0.7"/>
              <line x1={0} y1={-40} x2={0} y2={-20} stroke="#f59e0b" strokeWidth="3" opacity="0.7"/>
              <line x1={0} y1={20}  x2={0} y2={40}  stroke="#f59e0b" strokeWidth="3" opacity="0.7"/>
            </g>
          </g>
          <circle
            r={FRAME_R}
            fill="none" stroke="#f59e0b" strokeWidth="5"
            strokeDasharray={FRAME_PERIM} strokeDashoffset={dashOffset}
            strokeLinecap="round" opacity={contourOpacity}
          />
        </g>

        {/* ── Texte centre optique (step 2) ── */}
        {showText && (
          <g>
            <rect x={30} y={90} width={520} height={190} rx={16}
              fill="rgba(3,17,42,0.93)" stroke="rgba(245,158,11,0.55)" strokeWidth="2"/>
            <text x={290} y={140} textAnchor="middle" fontSize={24} fill="#f59e0b"
              fontFamily="system-ui,sans-serif" fontWeight="800">
              Le centre optique du verre
            </text>
            <text x={290} y={178} textAnchor="middle" fontSize={18} fill="rgba(255,255,255,0.85)"
              fontFamily="system-ui,sans-serif">
              Ce point est l&#39;endroit où la qualité optique est maximale.
            </text>
            <text x={290} y={206} textAnchor="middle" fontSize={18} fill="rgba(255,255,255,0.85)"
              fontFamily="system-ui,sans-serif">
              But des PDM : aligner ce point avec la pupille
            </text>
            <text x={290} y={234} textAnchor="middle" fontSize={18} fill="rgba(255,255,255,0.85)"
              fontFamily="system-ui,sans-serif">
              du client, une fois le verre taillé pour la monture.
            </text>
          </g>
        )}

        {/* ── Validation finale (step 8) ── */}
        {animStep >= 8 && (
          <g>
            <rect x={PHOTO_W / 2 - 310} y={PHOTO_H - 90} width={620} height={56} rx={28}
              fill="rgba(34,197,94,0.18)" stroke="rgba(34,197,94,0.5)" strokeWidth="2"/>
            <text x={PHOTO_W / 2} y={PHOTO_H - 53} textAnchor="middle" fontSize={22} fill="#4ade80"
              fontFamily="system-ui,sans-serif" fontWeight="700">
              ✓ Centre optique aligné avec la pupille
            </text>
          </g>
        )}

        {/* ── Etiquette etape ── */}
        <rect x={30} y={26} width={340} height={46} rx={23}
          fill="rgba(245,158,11,0.18)" stroke="rgba(245,158,11,0.45)" strokeWidth="1.5"/>
        <text x={200} y={56} textAnchor="middle" fontSize={20} fill="#f59e0b"
          fontFamily="system-ui,sans-serif" fontWeight="700">
          {PDM_ANIM_STEP_LABELS[animStep] || ''}
        </text>
      </svg>
    </div>
  )
}
