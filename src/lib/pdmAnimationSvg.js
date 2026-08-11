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

// Bruit deterministe (pas de Math.random, le rendu doit rester identique a chaque render)
function pseudoRand(i) {
  const j = Math.sin(i * 12.9898) * 43758.5453
  return j - Math.floor(j)
}
// Petites meches de texture sur le dessus des cheveux, contenues dans la silhouette
const HAIR_TEX_LINES = Array.from({ length: 13 }, (_, i) => {
  const t = i / 12
  const x = FC.x - 92 + t * 184
  const yBase = 96 - Math.sin(t * Math.PI) * 26
  const len = 14 + pseudoRand(i) * 10
  const bend = (pseudoRand(i + 5) - 0.5) * 6
  return {
    d: `M ${x.toFixed(1)} ${yBase.toFixed(1)} q ${bend.toFixed(1)} ${(len * 0.6).toFixed(1)} ${(bend * 0.4).toFixed(1)} ${len.toFixed(1)}`,
    color: i % 2 ? '#100a05' : '#3a2416',
    opacity: 0.35 + pseudoRand(i) * 0.25,
  }
})
// Sourcil : forme pleine effilee + 2 poils de texture. dir = 1 (gauche) / -1 (droit)
function eyebrowShape(eye, dir) {
  const x0 = eye.x - dir * 22
  const x2 = eye.x - dir * 1
  return {
    base: `M ${x0.toFixed(1)} ${(eye.y - 18).toFixed(1)} Q ${eye.x.toFixed(1)} ${(eye.y - 29).toFixed(1)} ${(eye.x + dir * 22).toFixed(1)} ${(eye.y - 20).toFixed(1)} Q ${x2.toFixed(1)} ${(eye.y - 23).toFixed(1)} ${x0.toFixed(1)} ${(eye.y - 18).toFixed(1)} Z`,
    h1: `M ${(eye.x - dir * 10).toFixed(1)} ${(eye.y - 24).toFixed(1)} l ${dir * 2} -4`,
    h2: `M ${(eye.x + dir * 4).toFixed(1)} ${(eye.y - 25).toFixed(1)} l ${dir * 2} -3.5`,
  }
}
const BROW_L = eyebrowShape(EYE_L, 1)
const BROW_R = eyebrowShape(EYE_R, -1)

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

        {/* ── Personnage : degrades + flous doux pour un rendu illustratif pro ── */}
        <linearGradient id="pdma-skin" x1="20%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%"   stopColor="#f6dcb6" />
          <stop offset="55%"  stopColor="#e7bc8c" />
          <stop offset="100%" stopColor="#c99968" />
        </linearGradient>
        <linearGradient id="pdma-skin-shadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#b98554" stopOpacity="0" />
          <stop offset="100%" stopColor="#96683f" stopOpacity="0.55" />
        </linearGradient>
        <radialGradient id="pdma-forehead-light" cx="50%" cy="20%" r="60%">
          <stop offset="0%"   stopColor="rgba(255,244,224,0.4)" />
          <stop offset="100%" stopColor="rgba(255,244,224,0)" />
        </radialGradient>
        <linearGradient id="pdma-hair" x1="15%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%"   stopColor="#3a2416" />
          <stop offset="55%"  stopColor="#1e1209" />
          <stop offset="100%" stopColor="#100a05" />
        </linearGradient>
        <radialGradient id="pdma-iris" cx="35%" cy="30%" r="75%">
          <stop offset="0%"   stopColor="#8d6a3d" />
          <stop offset="100%" stopColor="#33200f" />
        </radialGradient>
        <linearGradient id="pdma-lip-top" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#9c5c4b" />
          <stop offset="100%" stopColor="#7f4638" />
        </linearGradient>
        <linearGradient id="pdma-lip-bottom" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#bd7461" />
          <stop offset="100%" stopColor="#9c5847" />
        </linearGradient>
        <linearGradient id="pdma-sweater" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#41576f" />
          <stop offset="100%" stopColor="#243244" />
        </linearGradient>
        <linearGradient id="pdma-frame-g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f3cd76" />
          <stop offset="55%"  stopColor="#c9962f" />
          <stop offset="100%" stopColor="#8f6317" />
        </linearGradient>
        <radialGradient id="pdma-lens-tint" cx="35%" cy="30%" r="75%">
          <stop offset="0%"   stopColor="rgba(180,210,255,0.32)" />
          <stop offset="100%" stopColor="rgba(120,170,220,0.1)" />
        </radialGradient>
        <filter id="pdma-soft" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="6"/>
        </filter>
        <filter id="pdma-soft2" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.2"/>
        </filter>
        <filter id="pdma-soft3" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="1.1"/>
        </filter>
      </defs>

      <rect width="900" height="500" rx="16" fill="rgba(3,17,42,0.6)" />

      {/* ── Personnage — buste, rendu illustratif soigne (step 3+) ── */}
      <g opacity={personOpacity} style={{ transition: 'opacity 0.9s ease' }}>

        {/* Ombre au sol (profondeur) */}
        <ellipse cx={FC.x} cy={482} rx={168} ry={13} fill="rgba(0,0,0,0.3)" filter="url(#pdma-soft)"/>

        {/* Epaules / pull */}
        <path
          d={`M ${FC.x - 172} 500 L ${FC.x - 142} 420 Q ${FC.x - 98} 372 ${FC.x - 44} 366
              Q ${FC.x - 40} 400 ${FC.x} 408 Q ${FC.x + 40} 400 ${FC.x + 44} 366
              Q ${FC.x + 98} 372 ${FC.x + 142} 420 L ${FC.x + 172} 500 Z`}
          fill="url(#pdma-sweater)"
        />
        {/* Col */}
        <path
          d={`M ${FC.x - 44} 366 Q ${FC.x} 386 ${FC.x + 44} 366 Q ${FC.x + 38} 400 ${FC.x} 408 Q ${FC.x - 38} 400 ${FC.x - 44} 366 Z`}
          fill="#182430"
        />
        {/* Cou */}
        <path d={`M ${FC.x - 30} 332 L ${FC.x - 27} 393 Q ${FC.x} 407 ${FC.x + 27} 393 L ${FC.x + 30} 332 Z`} fill="url(#pdma-skin)"/>
        <path d={`M ${FC.x - 30} 332 L ${FC.x - 27} 393 Q ${FC.x} 407 ${FC.x + 27} 393 L ${FC.x + 30} 332 Z`} fill="url(#pdma-skin-shadow)" opacity={0.5}/>
        <path d={`M ${FC.x - 24} 336 Q ${FC.x} 348 ${FC.x + 24} 336`} stroke="rgba(0,0,0,0.1)" strokeWidth="2" fill="none" filter="url(#pdma-soft3)"/>

        {/* Oreilles — forme "6" avec helix + creux interieur */}
        <path
          d={`M ${FC.x - 102} ${FC.y - 14} C ${FC.x - 118} ${FC.y - 12} ${FC.x - 124} ${FC.y + 4} ${FC.x - 118} ${FC.y + 20}
              C ${FC.x - 114} ${FC.y + 32} ${FC.x - 104} ${FC.y + 38} ${FC.x - 96} ${FC.y + 36}
              C ${FC.x - 90} ${FC.y + 34} ${FC.x - 88} ${FC.y + 26} ${FC.x - 92} ${FC.y + 20}
              C ${FC.x - 98} ${FC.y + 14} ${FC.x - 100} ${FC.y + 6} ${FC.x - 98} ${FC.y - 2}
              C ${FC.x - 96} ${FC.y - 10} ${FC.x - 98} ${FC.y - 15} ${FC.x - 102} ${FC.y - 14} Z`}
          fill="url(#pdma-skin)"
        />
        <path
          d={`M ${FC.x - 105} ${FC.y - 6} C ${FC.x - 112} ${FC.y - 2} ${FC.x - 113} ${FC.y + 8} ${FC.x - 108} ${FC.y + 16}
              C ${FC.x - 104} ${FC.y + 22} ${FC.x - 98} ${FC.y + 24} ${FC.x - 96} ${FC.y + 21}`}
          fill="none" stroke="rgba(110,68,40,0.4)" strokeWidth="1.6" strokeLinecap="round"
        />
        <path
          d={`M ${FC.x + 102} ${FC.y - 14} C ${FC.x + 118} ${FC.y - 12} ${FC.x + 124} ${FC.y + 4} ${FC.x + 118} ${FC.y + 20}
              C ${FC.x + 114} ${FC.y + 32} ${FC.x + 104} ${FC.y + 38} ${FC.x + 96} ${FC.y + 36}
              C ${FC.x + 90} ${FC.y + 34} ${FC.x + 88} ${FC.y + 26} ${FC.x + 92} ${FC.y + 20}
              C ${FC.x + 98} ${FC.y + 14} ${FC.x + 100} ${FC.y + 6} ${FC.x + 98} ${FC.y - 2}
              C ${FC.x + 96} ${FC.y - 10} ${FC.x + 98} ${FC.y - 15} ${FC.x + 102} ${FC.y - 14} Z`}
          fill="url(#pdma-skin)"
        />
        <path
          d={`M ${FC.x + 105} ${FC.y - 6} C ${FC.x + 112} ${FC.y - 2} ${FC.x + 113} ${FC.y + 8} ${FC.x + 108} ${FC.y + 16}
              C ${FC.x + 104} ${FC.y + 22} ${FC.x + 98} ${FC.y + 24} ${FC.x + 96} ${FC.y + 21}`}
          fill="none" stroke="rgba(110,68,40,0.4)" strokeWidth="1.6" strokeLinecap="round"
        />

        {/* Visage — proportions plus resserrees et adultes */}
        <path
          d={`M ${FC.x} 156
              C ${FC.x + 78} 154 ${FC.x + 106} 192 ${FC.x + 102} 234
              C ${FC.x + 100} 264 ${FC.x + 92} 292 ${FC.x + 58} 328
              C ${FC.x + 40} 350 ${FC.x + 22} 372 ${FC.x} 375
              C ${FC.x - 22} 372 ${FC.x - 40} 350 ${FC.x - 58} 328
              C ${FC.x - 92} 292 ${FC.x - 100} 264 ${FC.x - 102} 234
              C ${FC.x - 106} 192 ${FC.x - 78} 154 ${FC.x} 156 Z`}
          fill="url(#pdma-skin)"
        />
        {/* Ombre laterale — relief du visage */}
        <path
          d={`M ${FC.x + 26} 162
              C ${FC.x + 84} 174 ${FC.x + 102} 204 ${FC.x + 102} 234
              C ${FC.x + 100} 264 ${FC.x + 92} 292 ${FC.x + 58} 328
              C ${FC.x + 42} 348 ${FC.x + 26} 368 ${FC.x + 6} 374
              C ${FC.x + 36} 344 ${FC.x + 54} 290 ${FC.x + 54} 236
              C ${FC.x + 54} 196 ${FC.x + 42} 174 ${FC.x + 26} 162 Z`}
          fill="url(#pdma-skin-shadow)" opacity={0.55}
        />
        <ellipse cx={FC.x - 8} cy={192} rx={52} ry={30} fill="url(#pdma-forehead-light)"/>

        {/* Cheveux — silhouette pleine, coupe courte naturelle */}
        <path
          d={`M ${FC.x - 104} 200
              C ${FC.x - 116} 140 ${FC.x - 98} 88 ${FC.x - 46} 66
              C ${FC.x - 22} 56 ${FC.x + 26} 56 ${FC.x + 50} 67
              C ${FC.x + 100} 89 ${FC.x + 116} 140 ${FC.x + 104} 202
              C ${FC.x + 100} 194 ${FC.x + 93} 190 ${FC.x + 90} 194
              Q ${FC.x + 68} 162 ${FC.x + 40} 172
              Q ${FC.x + 18} 179 ${FC.x - 2} 168
              Q ${FC.x - 22} 178 ${FC.x - 44} 172
              Q ${FC.x - 70} 163 ${FC.x - 92} 195
              C ${FC.x - 96} 191 ${FC.x - 102} 194 ${FC.x - 104} 200 Z`}
          fill="url(#pdma-hair)"
        />
        {/* Meches de texture courtes, contenues dans la masse */}
        {HAIR_TEX_LINES.map((l, i) => (
          <path key={i} d={l.d} stroke={l.color} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity={l.opacity}/>
        ))}
        {/* Reflet */}
        <ellipse cx={FC.x - 24} cy={90} rx={30} ry={12} fill="rgba(255,255,255,0.12)" filter="url(#pdma-soft)" transform={`rotate(-20 ${FC.x - 24} 90)`}/>

        {/* Blush */}
        <ellipse cx={FC.x - 52} cy={FC.y + 46} rx={16} ry={9} fill="rgba(224,110,90,0.13)" filter="url(#pdma-soft)"/>
        <ellipse cx={FC.x + 52} cy={FC.y + 46} rx={16} ry={9} fill="rgba(224,110,90,0.13)" filter="url(#pdma-soft)"/>

        {/* Ombre orbitale (sous l'arcade) */}
        <path d={`M ${EYE_L.x - 19} ${EYE_L.y - 14} Q ${EYE_L.x} ${EYE_L.y - 19} ${EYE_L.x + 19} ${EYE_L.y - 13} Q ${EYE_L.x} ${EYE_L.y - 6} ${EYE_L.x - 19} ${EYE_L.y - 14} Z`} fill="rgba(120,80,50,0.14)" filter="url(#pdma-soft3)"/>
        <path d={`M ${EYE_R.x - 19} ${EYE_R.y - 13} Q ${EYE_R.x} ${EYE_R.y - 19} ${EYE_R.x + 19} ${EYE_R.y - 14} Q ${EYE_R.x} ${EYE_R.y - 6} ${EYE_R.x - 19} ${EYE_R.y - 13} Z`} fill="rgba(120,80,50,0.14)" filter="url(#pdma-soft3)"/>

        {/* Sourcils */}
        <path d={BROW_L.base} fill="#2a1a10"/>
        <path d={BROW_L.h1} stroke="#160d07" strokeWidth="1" strokeLinecap="round" opacity={0.6}/>
        <path d={BROW_L.h2} stroke="#160d07" strokeWidth="1" strokeLinecap="round" opacity={0.6}/>
        <path d={BROW_R.base} fill="#2a1a10"/>
        <path d={BROW_R.h1} stroke="#160d07" strokeWidth="1" strokeLinecap="round" opacity={0.6}/>
        <path d={BROW_R.h2} stroke="#160d07" strokeWidth="1" strokeLinecap="round" opacity={0.6}/>

        {/* Yeux */}
        <path d={`M ${EYE_L.x - 16} ${EYE_L.y + 1} Q ${EYE_L.x} ${EYE_L.y - 9} ${EYE_L.x + 16} ${EYE_L.y + 1} Q ${EYE_L.x} ${EYE_L.y + 8} ${EYE_L.x - 16} ${EYE_L.y + 1} Z`} fill="white"/>
        <path d={`M ${EYE_R.x - 16} ${EYE_R.y + 1} Q ${EYE_R.x} ${EYE_R.y - 9} ${EYE_R.x + 16} ${EYE_R.y + 1} Q ${EYE_R.x} ${EYE_R.y + 8} ${EYE_R.x - 16} ${EYE_R.y + 1} Z`} fill="white"/>
        <circle cx={EYE_L.x + 1} cy={EYE_L.y + 2} r={7} fill="url(#pdma-iris)"/>
        <circle cx={EYE_R.x + 1} cy={EYE_R.y + 2} r={7} fill="url(#pdma-iris)"/>
        <circle cx={EYE_L.x + 1} cy={EYE_L.y + 2} r={3.2} fill="#0a0704"/>
        <circle cx={EYE_R.x + 1} cy={EYE_R.y + 2} r={3.2} fill="#0a0704"/>
        <circle cx={EYE_L.x + 3.5} cy={EYE_L.y - 0.5} r={1.9} fill="rgba(255,255,255,0.95)"/>
        <circle cx={EYE_R.x + 3.5} cy={EYE_R.y - 0.5} r={1.9} fill="rgba(255,255,255,0.95)"/>
        <path d={`M ${EYE_L.x - 16} ${EYE_L.y + 1} Q ${EYE_L.x} ${EYE_L.y - 9} ${EYE_L.x + 16} ${EYE_L.y + 1}`} stroke="#1c1108" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d={`M ${EYE_R.x - 16} ${EYE_R.y + 1} Q ${EYE_R.x} ${EYE_R.y - 9} ${EYE_R.x + 16} ${EYE_R.y + 1}`} stroke="#1c1108" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d={`M ${EYE_L.x - 14} ${EYE_L.y + 4} Q ${EYE_L.x} ${EYE_L.y + 9} ${EYE_L.x + 14} ${EYE_L.y + 4}`} stroke="rgba(70,45,25,0.4)" strokeWidth="1.1" fill="none"/>
        <path d={`M ${EYE_R.x - 14} ${EYE_R.y + 4} Q ${EYE_R.x} ${EYE_R.y + 9} ${EYE_R.x + 14} ${EYE_R.y + 4}`} stroke="rgba(70,45,25,0.4)" strokeWidth="1.1" fill="none"/>
        <path d={`M ${EYE_L.x - 15} ${EYE_L.y - 1} l -4 -2.5`} stroke="#1c1108" strokeWidth="1.2" strokeLinecap="round"/>
        <path d={`M ${EYE_R.x + 15} ${EYE_R.y - 1} l 4 -2.5`} stroke="#1c1108" strokeWidth="1.2" strokeLinecap="round"/>

        {/* Nez */}
        <path d={`M ${FC.x - 4} ${FC.y + 16} Q ${FC.x - 12} ${FC.y + 38} ${FC.x - 14} ${FC.y + 45} Q ${FC.x - 3} ${FC.y + 42} ${FC.x - 4} ${FC.y + 16} Z`} fill="url(#pdma-skin-shadow)" opacity={0.4} filter="url(#pdma-soft2)"/>
        <path d={`M ${FC.x - 14} ${FC.y + 45} Q ${FC.x} ${FC.y + 50} ${FC.x + 11} ${FC.y + 44}`} stroke="#ab7454" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
        <ellipse cx={FC.x - 8} cy={FC.y + 43} rx={1.9} ry={1.2} fill="rgba(110,68,40,0.35)"/>
        <ellipse cx={FC.x + 7} cy={FC.y + 42} rx={1.9} ry={1.2} fill="rgba(110,68,40,0.35)"/>
        <path d={`M ${FC.x - 6} ${FC.y + 20} Q ${FC.x - 9} ${FC.y + 32} ${FC.x - 10} ${FC.y + 38}`} stroke="rgba(255,240,218,0.45)" strokeWidth="1.4" fill="none" strokeLinecap="round"/>

        {/* Bouche */}
        <path d={`M ${FC.x - 16} ${FC.y + 66} Q ${FC.x} ${FC.y + 61} ${FC.x + 16} ${FC.y + 66} Q ${FC.x} ${FC.y + 70} ${FC.x - 16} ${FC.y + 66} Z`} fill="url(#pdma-lip-top)"/>
        <path d={`M ${FC.x - 16} ${FC.y + 67} Q ${FC.x} ${FC.y + 80} ${FC.x + 16} ${FC.y + 67} Q ${FC.x} ${FC.y + 76} ${FC.x - 16} ${FC.y + 67} Z`} fill="url(#pdma-lip-bottom)"/>
        <path d={`M ${FC.x - 16} ${FC.y + 67} Q ${FC.x} ${FC.y + 72} ${FC.x + 16} ${FC.y + 67}`} stroke="#5f3126" strokeWidth="1.3" fill="none" strokeLinecap="round" opacity={0.6}/>
        <path d={`M ${FC.x - 4} ${FC.y + 48} L ${FC.x - 3} ${FC.y + 58}`} stroke="rgba(255,240,218,0.3)" strokeWidth="1.2" fill="none" strokeLinecap="round"/>

        {/* Ombre menton */}
        <ellipse cx={FC.x} cy={FC.y + 112} rx={28} ry={5} fill="rgba(0,0,0,0.08)" filter="url(#pdma-soft2)"/>

        {/* ── Monture lunettes ── */}
        <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={FRAME_RX} ry={FRAME_RY} fill="url(#pdma-lens-tint)"/>
        <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={FRAME_RX} ry={FRAME_RY} fill="url(#pdma-lens-tint)"/>
        <ellipse cx={EYE_L.x} cy={EYE_L.y} rx={FRAME_RX} ry={FRAME_RY} fill="none" stroke="url(#pdma-frame-g)" strokeWidth="4"/>
        <ellipse cx={EYE_R.x} cy={EYE_R.y} rx={FRAME_RX} ry={FRAME_RY} fill="none" stroke="url(#pdma-frame-g)" strokeWidth="4"/>
        {/* Sheen sur le verre droit */}
        <path
          d={`M ${EYE_L.x + FRAME_RX - 10} ${EYE_L.y - 20} Q ${EYE_L.x + FRAME_RX - 2} ${EYE_L.y - 15} ${EYE_L.x + FRAME_RX - 6} ${EYE_L.y - 8}`}
          stroke="rgba(255,255,255,0.55)" strokeWidth="2" fill="none" strokeLinecap="round"
        />
        {/* Pont */}
        <path
          d={`M ${EYE_L.x + FRAME_RX} ${EYE_L.y - 2} C ${FC.x} ${EYE_L.y - 14} ${FC.x} ${EYE_R.y - 14} ${EYE_R.x - FRAME_RX} ${EYE_R.y - 2}`}
          fill="none" stroke="url(#pdma-frame-g)" strokeWidth="4"
        />
        {/* Branche gauche */}
        <path
          d={`M ${EYE_L.x - FRAME_RX} ${EYE_L.y} Q ${FC.x - 108} ${EYE_L.y + 6} ${FC.x - 112} ${EYE_L.y + 22}`}
          fill="none" stroke="url(#pdma-frame-g)" strokeWidth="4" strokeLinecap="round"
        />
        {/* Branche droite */}
        <path
          d={`M ${EYE_R.x + FRAME_RX} ${EYE_R.y} Q ${FC.x + 108} ${EYE_R.y + 6} ${FC.x + 112} ${EYE_R.y + 22}`}
          fill="none" stroke="url(#pdma-frame-g)" strokeWidth="4" strokeLinecap="round"
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
        {/* Hauteur — ligne a gauche du visage, connecteurs pointilles vers l'ovale */}
        <line x1={EYE_L.x - FRAME_RX} y1={EYE_L.y}
              x2={534} y2={EYE_L.y}
              stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
        <line x1={EYE_L.x - FRAME_RX} y1={EYE_L.y + FRAME_RY}
              x2={534} y2={EYE_L.y + FRAME_RY}
              stroke="#22c55e" strokeWidth="1.5" strokeDasharray="4 3" opacity="0.6"/>
        <line x1={534} y1={EYE_L.y} x2={534} y2={EYE_L.y + FRAME_RY} stroke="#22c55e" strokeWidth="2"/>
        <polygon points={`530,${EYE_L.y} 538,${EYE_L.y} 534,${EYE_L.y + 8}`} fill="#22c55e"/>
        <polygon points={`530,${EYE_L.y + FRAME_RY} 538,${EYE_L.y + FRAME_RY} 534,${EYE_L.y + FRAME_RY - 8}`} fill="#22c55e"/>
        <text x={520} y={EYE_L.y + FRAME_RY / 2 + 4} textAnchor="middle" fontSize={11} fill="#22c55e"
          fontFamily="system-ui,sans-serif" fontWeight="700"
          transform={`rotate(-90 520 ${EYE_L.y + FRAME_RY / 2 + 4})`}>
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
