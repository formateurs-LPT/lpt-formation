'use client'
// Lipto, mascotte LPT — composant réutilisable (quiz, modules, simulation).
// Purement visuel : il ne lit ni n'écrit aucune donnée.
//   <Lipto pose="pouce" anim="celebration" confettis message="Bien joué !" taille={150} t={themeTel} />
// pose : voir LIPTO_POSES (src/lib/lipto.js)
// anim : apparition | reflexion | celebration | rebond | saut | calme
// bulle : 'droite' | 'dessous' | 'gauche' — où se place le message
import { LIPTO_ACTIF, LIPTO_POSES, LIPTO_HUMEURS } from '@/lib/lipto'

// Dimensions des images (px) : les détails des humeurs sont dessinés dans ce repère
const DIMENSIONS = { bienvenue: [376, 478], surpris: [384, 496], reflexion: [357, 501], encouragement: [384, 512] }
const NOIR = '#151515'
const sourcil = (x1, y1, x2, y2, e = 12) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={NOIR} strokeWidth={e} strokeLinecap="round" />
const goutte = (x, y, s = 1) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0,-20 C10,-6 13,4 0,12 C-13,4 -10,-6 0,-20 Z" fill="#9be1ff" stroke="#0ea5e9" strokeWidth="2.5" />
)
const joue = (x, y) => <ellipse cx={x} cy={y} rx="19" ry="10" fill="#ff7a9c" opacity="0.55" />
const coeur = (x, y, s) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0,3 C0,-1 5,-1 5,2 C5,-1 10,-1 10,3 C10,6 5,9 5,11 C5,9 0,6 0,3 Z" fill="#ef4444" />
const paupiere = (cx, cy, r) => (
  <g>
    <path d={`M${cx - r - 2},${cy + 2} A${r + 2} ${r + 2} 0 0 1 ${cx + r + 2},${cy + 2} Z`} fill="#222" />
    <line x1={cx - r} y1={cy + 2} x2={cx + r} y2={cy + 2} stroke={NOIR} strokeWidth="4" strokeLinecap="round" />
  </g>
)
// Détails dessinés par humeur, dans le repère de l'image de base
const DESSINS = {
  heureux: () => <>{joue(122, 200)}{joue(238, 196)}{coeur(292, 70, 2.4)}{coeur(328, 100, 1.7)}</>,
  inquiet: () => <>{sourcil(142, 112, 196, 96)}{sourcil(213, 94, 268, 108)}{goutte(292, 112, 1.3)}</>,
  fache: () => (
    <>
      {sourcil(138, 100, 198, 124, 14)}{sourcil(212, 120, 272, 96, 14)}
      <path transform="translate(310 70) scale(1.7)" d="M-11,-4 Q-4,-4 -4,-11 M4,-11 Q4,-4 11,-4 M11,4 Q4,4 4,11 M-4,11 Q-4,4 -11,4" fill="none" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  timide: () => <>{joue(130, 214)}{joue(240, 210)}</>,
  ferme: () => <>{sourcil(134, 106, 192, 116, 13)}{sourcil(200, 114, 258, 104, 13)}</>,
  saoule: () => (
    <>
      {paupiere(171, 148, 30)}{paupiere(238, 143, 28)}
      <circle cx="262" cy="232" r="9" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
      <circle cx="286" cy="220" r="12" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
      <circle cx="314" cy="204" r="15" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
    </>
  ),
  presse: () => (
    <>
      <g transform="translate(300 70)">
        <rect x="-6" y="-34" width="12" height="9" rx="2" fill="#03112a" />
        <circle r="24" fill="#fff" stroke="#03112a" strokeWidth="6" />
        <line x1="0" y1="0" x2="0" y2="-15" stroke="#e11d48" strokeWidth="4" strokeLinecap="round" />
        <line x1="0" y1="0" x2="10" y2="5" stroke="#03112a" strokeWidth="4" strokeLinecap="round" />
      </g>
      {[[6, 250, 40], [0, 285, 46], [10, 320, 36]].map(([x, y, l], i) => <line key={i} x1={x} y1={y} x2={x + l} y2={y} stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />)}
    </>
  ),
}
const ANIM_HUMEUR = { inquiet: 'tremble', fache: 'secoue', saoule: 'soupir', presse: 'presse', heureux: 'balance' }

const COULEURS_CONFETTIS = ['#c9a227', '#7c5cff', '#00abe9', '#4ade80', '#f472b6']

export default function Lipto({ pose = 'reflexion', anim = 'apparition', message, titre, taille = 120, confettis = false, bulle = 'dessous', t }) {
  if (!LIPTO_ACTIF) return null
  const humeur = LIPTO_HUMEURS[pose] ? pose : null
  const p = LIPTO_POSES[humeur ? LIPTO_HUMEURS[pose].base : pose] || LIPTO_POSES.reflexion
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
      {/* Ombre au sol, sous les pieds : les images ont ~18 % de vide sous les
          chaussures, une ombre tout en bas faisait flotter Lipto au-dessus */}
      <div style={{ position: 'absolute', left: '20%', right: '20%', bottom: taille * 0.165, height: taille * 0.05, borderRadius: '50%', background: sombre ? 'rgba(0,0,0,0.45)' : 'rgba(3,17,42,0.14)', filter: 'blur(3px)' }} />
      {/* Lipto détouré, sans fond. En mode sombre, un léger contour clair :
          il est noir et disparaîtrait sur le fond nuit. */}
      {humeur ? (
        // Humeur : l'image de base dans une boîte à ses proportions exactes, et
        // les détails dessinés par-dessus dans le même repère
        (() => {
          const [iw, ih] = DIMENSIONS[LIPTO_HUMEURS[humeur].base]
          const boiteW = Math.round(taille * 0.78), r = iw / ih
          const [w, h] = r < boiteW / taille ? [taille * r, taille] : [boiteW, boiteW / r]
          return (
            <div className={`lipto-humeur lipto-h-${ANIM_HUMEUR[humeur] || 'aucune'}`} style={{
              position: 'absolute', bottom: 0, left: (boiteW - w) / 2, width: w, height: h,
              filter: humeur === 'fache' ? 'drop-shadow(0 0 10px rgba(225,29,72,0.45))' : sombre ? 'drop-shadow(0 0 1.5px rgba(255,255,255,0.75))' : 'none',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={`Lipto ${LIPTO_HUMEURS[humeur].nom.toLowerCase()}`} draggable={false} style={{ width: '100%', height: '100%', display: 'block' }} />
              <svg viewBox={`0 0 ${iw} ${ih}`} preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden>{DESSINS[humeur]()}</svg>
            </div>
          )
        })()
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.src} alt={p.alt} draggable={false} style={{
          position: 'relative', width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block',
          filter: sombre ? 'drop-shadow(0 0 1.5px rgba(255,255,255,0.75)) drop-shadow(0 0 1px rgba(255,255,255,0.5))' : 'none',
        }} />
      )}
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
.lipto-humeur { transform-origin: 50% 100%; }
.lipto-h-tremble { animation: liptoTremble .35s linear infinite; }
.lipto-h-secoue { animation: liptoSecoue .5s ease-in-out infinite; }
.lipto-h-soupir { animation: liptoSoupir 3.2s ease-in-out infinite; }
.lipto-h-presse { animation: liptoPresse .45s ease-in-out infinite; }
.lipto-h-balance { animation: liptoBalance 2.4s ease-in-out infinite; }
@keyframes liptoTremble { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-1.5px); } 75% { transform: translateX(1.5px); } }
@keyframes liptoSecoue { 0%,100% { transform: rotate(0); } 25% { transform: rotate(-2.5deg); } 75% { transform: rotate(2.5deg); } }
@keyframes liptoSoupir { 0%,100% { transform: translateY(0) scaleY(1); } 50% { transform: translateY(3px) scaleY(.97); } }
@keyframes liptoPresse { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes liptoBalance { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
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
  .lipto-corps, .lipto-accessoire, .lipto-bulle, .lipto-humeur { animation: none !important; }
  .lipto-confetti { display: none; }
}
`
