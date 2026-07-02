'use client'
import { useState, useEffect } from 'react'

export default function ZeroInterChain({ compact = false }) {
  const [animStep, setAnimStep] = useState(0)
  const [loopKey, setLoopKey] = useState(0)

  useEffect(() => {
    setAnimStep(0)
    const T = [
      setTimeout(() => setAnimStep(1), 500),
      setTimeout(() => setAnimStep(2), 820),
      setTimeout(() => setAnimStep(3), 1140),
      setTimeout(() => setAnimStep(4), 2350),
      setTimeout(() => setAnimStep(5), 3150),
      setTimeout(() => setLoopKey(k => k + 1), 5800),
    ]
    return () => T.forEach(clearTimeout)
  }, [loopKey])

  const breaking = animStep === 4
  const lpt = animStep >= 5

  const PAD = compact ? 52 : 76
  const ICO = compact ? 22 : 40
  const DOT = compact ? 11 : 20
  const H   = compact ? 140 : 220

  const COLORS = ['#ef4444', '#f97316', '#eab308']

  const segFall = [
    { tx: -58, ty: 140, rot: -22 },
    { tx:   0, ty: 175, rot:   8 },
    { tx:  58, ty: 140, rot:  22 },
  ]

  const dotFall = [
    { tx: -55, ty: -75, rot: -100 },
    { tx:  12, ty: 155, rot:  45  },
    { tx:  60, ty: -55, rot:  125 },
  ]

  const dotX = ['23%', '50%', '77%']

  return (
    <div style={{ width: '100%', position: 'relative', height: H, userSelect: 'none' }}>

      {/* ── Factory ── */}
      <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', textAlign: 'center', width: PAD }}>
        <div style={{ fontSize: ICO }}>🏭</div>
        <div style={{ fontSize: compact ? 7 : 10, color: 'rgba(255,255,255,0.4)', marginTop: 2, fontWeight: 600, lineHeight: 1.2 }}>
          Fournisseur
        </div>
      </div>

      {/* ── Opticien traditionnel (disparaît avec LPT) ── */}
      <div style={{
        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
        textAlign: 'center', width: PAD,
        opacity: lpt ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}>
        <div style={{ fontSize: ICO }}>🏪</div>
        <div style={{ fontSize: compact ? 7 : 10, color: 'rgba(255,255,255,0.35)', marginTop: 2, fontWeight: 600, lineHeight: 1.2 }}>
          Opticien<br />trad.
        </div>
      </div>

      {/* ── LPT (apparaît après break) ── */}
      <div style={{
        position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
        textAlign: 'center', width: PAD,
        opacity: lpt ? 1 : 0,
        transition: 'opacity 0.5s ease 0.35s',
      }}>
        <div style={{ fontSize: ICO }}>🔵</div>
        <div style={{ fontSize: compact ? 7 : 10, color: '#00abe9', marginTop: 2, fontWeight: 700, lineHeight: 1.2 }}>
          LPT
        </div>
      </div>

      {/* ── Zone chaîne ── */}
      <div style={{ position: 'absolute', left: PAD, right: PAD, top: 0, bottom: 0 }}>

        {/* Segments ligne traditionnelle */}
        {[0, 1, 2].map(i => {
          const f = segFall[i]
          const delay = `${i * 0.05}s`
          return (
            <div key={i} style={{
              position: 'absolute',
              top: '50%',
              left: `${i * 33}%`,
              width: i === 1 ? '34%' : '33%',
              height: compact ? 2 : 3,
              background: 'rgba(239,68,68,0.55)',
              transformOrigin: 'center center',
              transform: (lpt || breaking)
                ? `translateY(-50%) translate(${f.tx}px, ${f.ty}px) rotate(${f.rot}deg)`
                : 'translateY(-50%)',
              opacity: lpt || breaking ? 0 : 1,
              transition: breaking
                ? `transform 0.65s ease-in ${delay}, opacity 0.6s ease-in ${delay}`
                : 'none',
            }} />
          )
        })}

        {/* Flèche traditionnelle */}
        <div style={{
          position: 'absolute', top: '50%', right: -2,
          width: 0, height: 0,
          borderTop: `${compact ? 5 : 9}px solid transparent`,
          borderBottom: `${compact ? 5 : 9}px solid transparent`,
          borderLeft: `${compact ? 9 : 15}px solid rgba(239,68,68,0.6)`,
          transform: (lpt || breaking)
            ? 'translateY(-50%) translate(68px, 125px) rotate(22deg)'
            : 'translateY(-50%)',
          opacity: lpt || breaking ? 0 : 1,
          transition: breaking
            ? 'transform 0.65s ease-in 0.04s, opacity 0.6s ease-in 0.04s'
            : 'none',
        }} />

        {/* Points intermédiaires */}
        {dotX.map((x, i) => {
          const f = dotFall[i]
          return (
            <div key={i} style={{ position: 'absolute', left: x, top: '50%', width: 0, height: 0 }}>
              <div style={{
                position: 'absolute',
                width: DOT, height: DOT,
                borderRadius: '50%',
                background: COLORS[i],
                top: -DOT / 2, left: -DOT / 2,
                border: `${compact ? 1.5 : 2.5}px solid rgba(255,255,255,0.7)`,
                boxShadow: `0 0 ${compact ? 7 : 14}px ${COLORS[i]}`,
                transform: (lpt || breaking)
                  ? `translate(${f.tx}px, ${f.ty}px) rotate(${f.rot}deg) scale(0.1)`
                  : 'translate(0,0) rotate(0deg) scale(1)',
                opacity: lpt || breaking ? 0 : animStep > i ? 1 : 0,
                transition: breaking
                  ? `all 0.6s ease-in ${i * 0.04}s`
                  : lpt ? 'none' : 'opacity 0.35s ease',
              }} />
            </div>
          )
        })}

        {/* ── Ligne LPT ── */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0,
          height: compact ? 3 : 4,
          background: 'linear-gradient(90deg, rgba(0,171,233,0.5), rgba(0,171,233,0.88))',
          borderRadius: 2,
          transform: 'translateY(-50%)',
          opacity: lpt ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />

        {/* Flèche LPT */}
        <div style={{
          position: 'absolute', top: '50%', right: -2,
          width: 0, height: 0,
          borderTop: `${compact ? 6 : 11}px solid transparent`,
          borderBottom: `${compact ? 6 : 11}px solid transparent`,
          borderLeft: `${compact ? 10 : 17}px solid rgba(0,171,233,0.88)`,
          transform: 'translateY(-50%)',
          opacity: lpt ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }} />

        {/* Badge DIRECT */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -170%)',
          background: 'rgba(0,171,233,0.12)',
          border: '1px solid rgba(0,171,233,0.38)',
          borderRadius: 20, padding: compact ? '2px 9px' : '5px 18px',
          fontSize: compact ? 8 : 13, fontWeight: 800, color: '#00abe9', letterSpacing: 2,
          opacity: lpt ? 1 : 0,
          transition: 'opacity 0.5s ease 0.25s',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>DIRECT</div>

        {/* Badge Prix réduits */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, 55%)',
          background: 'rgba(74,222,128,0.10)',
          border: '1px solid rgba(74,222,128,0.35)',
          borderRadius: 20, padding: compact ? '2px 9px' : '5px 18px',
          fontSize: compact ? 8 : 13, fontWeight: 800, color: '#4ade80', letterSpacing: 1,
          opacity: lpt ? 1 : 0,
          transition: 'opacity 0.5s ease 0.4s',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>Prix réduits ✓</div>

      </div>
    </div>
  )
}
