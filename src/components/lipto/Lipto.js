'use client'
// Lipto, mascotte LPT — composant réutilisable (quiz, modules, simulation).
// Purement visuel : il ne lit ni n'écrit aucune donnée.
//   <Lipto pose="pouce" anim="celebration" confettis message="Bien joué !" taille={150} t={themeTel} />
// pose : voir LIPTO_POSES (src/lib/lipto.js)
// anim : apparition | reflexion | celebration | rebond | saut | calme
// bulle : 'droite' | 'dessous' | 'gauche' — où se place le message
import { LIPTO_ACTIF, LIPTO_POSES } from '@/lib/lipto'

const COULEURS_CONFETTIS = ['#c9a227', '#7c5cff', '#00abe9', '#4ade80', '#f472b6']

export default function Lipto({ pose = 'reflexion', anim = 'apparition', message, titre, taille = 120, confettis = false, bulle = 'dessous', t }) {
  if (!LIPTO_ACTIF) return null
  const p = LIPTO_POSES[pose] || LIPTO_POSES.reflexion
  const sombre = t?.mode === 'sombre'
  const fondBulle = sombre ? 'rgba(255,255,255,0.08)' : '#ffffff'
  const texteBulle = t?.texte || '#03112a'
  const bordBulle = sombre ? 'rgba(255,255,255,0.16)' : 'rgba(3,17,42,0.1)'
  const horizontal = bulle === 'droite' || bulle === 'gauche'

  const medaillon = (
    <div className={`lipto-corps lipto-${anim}`} style={{ position: 'relative', width: Math.round(taille * 0.78), height: taille, flexShrink: 0 }}>
      {/* Mode sombre : halo doux derrière Lipto (pas une bulle), sinon son corps
          noir se perd dans le fond nuit */}
      {sombre && <div style={{ position: 'absolute', left: '-25%', right: '-25%', top: '0%', bottom: '8%', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,255,255,0.20), rgba(201,162,39,0.08) 60%, transparent)' }} />}
      {/* Ombre au sol */}
      <div style={{ position: 'absolute', left: '22%', right: '22%', bottom: -2, height: taille * 0.06, borderRadius: '50%', background: sombre ? 'rgba(0,0,0,0.45)' : 'rgba(3,17,42,0.14)', filter: 'blur(3px)' }} />
      {/* Lipto détouré, sans fond. En mode sombre, un léger contour clair :
          il est noir et disparaîtrait sur le fond nuit. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt={p.alt} draggable={false} style={{
        position: 'relative', width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block',
        filter: sombre ? 'drop-shadow(0 0 1.5px rgba(255,255,255,0.75)) drop-shadow(0 0 1px rgba(255,255,255,0.5))' : 'none',
      }} />
      {p.accessoire && (
        <span className="lipto-accessoire" style={{ position: 'absolute', right: -taille * 0.06, top: -taille * 0.06, fontSize: taille * 0.34, lineHeight: 1 }}>{p.accessoire}</span>
      )}
      {confettis && (
        <div aria-hidden style={{ position: 'absolute', inset: -taille * 0.35, pointerEvents: 'none' }}>
          {Array.from({ length: 18 }).map((_, i) => {
            const angle = (i / 18) * Math.PI * 2
            const dist = taille * (0.75 + (i % 3) * 0.15)
            return (
              <span key={i} className="lipto-confetti" style={{
                position: 'absolute', left: '50%', top: '50%', width: 7, height: i % 2 ? 7 : 11, borderRadius: i % 3 ? 2 : '50%',
                background: COULEURS_CONFETTIS[i % COULEURS_CONFETTIS.length],
                // Arrondi : sinon le calcul serveur et navigateur diffère au dernier chiffre
                '--dx': `${Math.round(Math.cos(angle) * dist)}px`, '--dy': `${Math.round(Math.sin(angle) * dist)}px`, '--rot': `${i * 47}deg`,
                animationDelay: `${0.15 + (i % 4) * 0.04}s`,
              }} />
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: horizontal ? (bulle === 'gauche' ? 'row-reverse' : 'row') : 'column', alignItems: 'center', gap: horizontal ? 12 : 14 }}>
      <style>{LIPTO_CSS}</style>
      {medaillon}
      {(message || titre) && (
        <div className="lipto-bulle" style={{
          position: 'relative', background: fondBulle, color: texteBulle, border: `1px solid ${bordBulle}`,
          borderRadius: 16, padding: '10px 16px', maxWidth: 280, textAlign: horizontal ? 'left' : 'center',
          boxShadow: sombre ? 'none' : '0 4px 16px rgba(3,17,42,0.08)',
        }}>
          {titre && <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{titre}</div>}
          {message && <div style={{ fontSize: titre ? 14 : 15, fontWeight: titre ? 400 : 600, lineHeight: 1.4, marginTop: titre ? 4 : 0, opacity: titre ? 0.8 : 1 }}>{message}</div>}
        </div>
      )}
    </div>
  )
}

const LIPTO_CSS = `
.lipto-corps { transform-origin: 50% 90%; }
.lipto-apparition { animation: liptoEntre .5s cubic-bezier(.2,.9,.3,1.3) both; }
.lipto-reflexion { animation: liptoEntre .5s cubic-bezier(.2,.9,.3,1.3) both, liptoPense 3s ease-in-out .6s infinite; }
.lipto-celebration { animation: liptoEntre .4s cubic-bezier(.2,.9,.3,1.3) both, liptoFete .7s ease-in-out .45s 2; }
.lipto-rebond { animation: liptoEntre .4s ease-out both, liptoRebond .8s cubic-bezier(.3,1.6,.5,1) .4s 1; }
.lipto-saut { animation: liptoEntre .4s cubic-bezier(.2,.9,.3,1.3) both, liptoSaut .9s cubic-bezier(.3,0,.3,1) .45s 3; }
.lipto-calme { animation: liptoEntre .8s ease-out both, liptoRespire 4s ease-in-out .9s infinite; }
.lipto-accessoire { animation: liptoBrille 1.6s ease-in-out .6s infinite; }
.lipto-bulle { animation: liptoBulle .45s ease-out .25s both; }
.lipto-confetti { opacity: 0; animation: liptoConfetti 1.1s cubic-bezier(.15,.7,.3,1) both; }
@keyframes liptoEntre { from { opacity: 0; transform: translateY(16px) scale(.85); } to { opacity: 1; transform: none; } }
@keyframes liptoPense { 0%,100% { transform: rotate(0); } 30% { transform: rotate(-4deg); } 60% { transform: rotate(3deg); } }
@keyframes liptoFete { 0%,100% { transform: scale(1) rotate(0); } 30% { transform: scale(1.08) rotate(-5deg); } 60% { transform: scale(1.08) rotate(5deg); } }
@keyframes liptoRebond { 0% { transform: translateY(0); } 30% { transform: translateY(-14px) scaleY(1.04); } 60% { transform: translateY(0) scaleY(.96); } 100% { transform: none; } }
@keyframes liptoSaut { 0%,100% { transform: translateY(0); } 40% { transform: translateY(-22px) rotate(-3deg); } 55% { transform: translateY(-22px) rotate(3deg); } 85% { transform: translateY(0) scaleY(.94); } }
@keyframes liptoRespire { 0%,100% { transform: scale(1); } 50% { transform: scale(1.03); } }
@keyframes liptoBrille { 0%,100% { transform: rotate(-8deg) scale(1); } 50% { transform: rotate(8deg) scale(1.12); } }
@keyframes liptoBulle { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes liptoConfetti { 0% { opacity: 1; transform: translate(-50%,-50%) rotate(0); } 80% { opacity: 1; } 100% { opacity: 0; transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 30px)) rotate(var(--rot)); } }
@media (prefers-reduced-motion: reduce) {
  .lipto-corps, .lipto-accessoire, .lipto-bulle { animation: none !important; }
  .lipto-confetti { display: none; }
}
`
