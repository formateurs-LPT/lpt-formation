'use client'
// Clin d'œil (23/11) : quand on clique sur une simulation « En préparation »,
// Lipto n'est pas disponible… il joue à GTA VI. Parodie : couleurs et esprit
// du jeu seulement, aucun logo ni élément officiel.
import { useEffect } from 'react'
import { LIPTO_POSES } from '@/lib/lipto'

export default function LiptoAFK({ titre, onFermer }) {
  useEffect(() => {
    const touche = e => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [onFermer])
  return (
    <div className="afk-fond" onClick={onFermer}>
      <style>{CSS}</style>
      <div className="afk-fenetre" onClick={e => e.stopPropagation()} role="dialog" aria-label="Simulation en préparation">
        {/* Coucher de soleil, soleil rétro rayé, palmiers */}
        <div className="afk-soleil" />
        <Palmier x="-14px" h={250} /><Palmier x="80%" h={290} flip /><Palmier x="64%" h={180} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 50%, rgba(20,0,40,0.8))' }} />

        {/* Argent et étoiles de recherche */}
        <div style={{ position: 'absolute', left: 26, top: 22, color: '#fff' }}>
          <div className="afk-texte" style={{ fontSize: 20, color: '#7CFC9A' }}>$ 0 000 001</div>
          <div style={{ fontSize: 20, letterSpacing: 4, textShadow: '0 2px 6px rgba(0,0,0,0.5)' }}>★★★★★</div>
        </div>
        <div style={{ position: 'absolute', right: 30, top: 16, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <span className="afk-titre" style={{ fontSize: 58 }}>LIPTO</span>
          <span className="afk-titre afk-vi" style={{ fontSize: 82 }}>VI</span>
        </div>

        {/* Bandeau de mission */}
        <div className="afk-bandeau">
          <div style={{ transform: 'skewY(3deg)', paddingLeft: '34%' }}>
            <div className="afk-titre afk-rose" style={{ fontSize: 54 }}>LIPTO EST AFK</div>
            <div className="afk-texte" style={{ fontSize: 20, color: '#ffd36b', marginTop: 2 }}>Mission en cours : finir GTA VI</div>
          </div>
        </div>

        <div style={{ position: 'absolute', left: 22, bottom: 18, zIndex: 2 }}><LiptoCool largeur={190} /></div>

        <div style={{ position: 'absolute', right: 30, bottom: 26, width: 360, textAlign: 'right', color: '#fff' }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
            {titre ? <>« {titre} » n’est pas encore prête. </> : 'Cette simulation n’est pas encore prête. '}Lipto a pris quelques jours… à Vice City 🌴
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 4, marginTop: 14, overflow: 'hidden' }}><div className="afk-barre" /></div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2, marginTop: 6, opacity: 0.85 }}>CHARGEMENT DE LA SIMULATION…</div>
          <button className="afk-bouton" onClick={onFermer} autoFocus>Respawn au menu</button>
        </div>
      </div>
    </div>
  )
}

// Lipto en vacances : lunettes de soleil et manette, dessinées sur la pose « bienvenue »
function LiptoCool({ largeur }) {
  return (
    <div style={{ position: 'relative', width: largeur, aspectRatio: '376 / 478', filter: 'drop-shadow(0 18px 20px rgba(0,0,0,0.45))' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LIPTO_POSES.bienvenue.src} alt="Lipto en vacances" style={{ width: '100%', height: '100%', display: 'block' }} />
      <svg viewBox="0 0 376 478" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden>
        <defs>
          <linearGradient id="afkVerre" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff4fa3" /><stop offset="0.55" stopColor="#7b2ff7" /><stop offset="1" stopColor="#14002b" />
          </linearGradient>
        </defs>
        <rect x="108" y="128" width="78" height="52" rx="18" fill="url(#afkVerre)" stroke="#111" strokeWidth="6" />
        <rect x="190" y="124" width="72" height="52" rx="18" fill="url(#afkVerre)" stroke="#111" strokeWidth="6" />
        <path d="M184,146 Q188,138 192,146" fill="none" stroke="#111" strokeWidth="6" />
        <path d="M118,140 L140,140" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
        <path d="M200,136 L220,136" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
        <g transform="translate(330 250) rotate(-14)">
          <rect x="-42" y="-20" width="84" height="40" rx="20" fill="#1f1f2e" stroke="#ff4fa3" strokeWidth="3" />
          <rect x="-28" y="-4" width="16" height="6" rx="2" fill="#fff" /><rect x="-23" y="-9" width="6" height="16" rx="2" fill="#fff" />
          <circle cx="20" cy="-5" r="5" fill="#22d3ee" /><circle cx="30" cy="5" r="5" fill="#f59e0b" />
        </g>
      </svg>
    </div>
  )
}

function Palmier({ x, h, flip }) {
  return (
    <svg viewBox="0 0 100 200" style={{ position: 'absolute', bottom: 0, left: x, height: h, transform: flip ? 'scaleX(-1)' : 'none' }} aria-hidden>
      <path d="M52,200 C50,150 46,110 54,62" fill="none" stroke="#1a0b2e" strokeWidth="7" strokeLinecap="round" />
      {[[-40, -6], [-20, -26], [10, -32], [36, -14], [44, 10], [-44, 16]].map(([dx, dy], i) => (
        <path key={i} d={`M54,62 Q${54 + dx * 0.5},${62 + dy - 14} ${54 + dx},${62 + dy + 6}`} fill="none" stroke="#1a0b2e" strokeWidth="9" strokeLinecap="round" />
      ))}
    </svg>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&display=swap');
.afk-fond { position: fixed; inset: 0; z-index: 320; background: rgba(20,0,40,0.55); backdrop-filter: blur(4px); display: grid; place-items: center; padding: 20px; animation: afkFondu .2s ease both; }
.afk-fenetre { position: relative; width: min(780px, 100%); height: 470px; border-radius: 22px; overflow: hidden; background: linear-gradient(180deg, #2a0a4a 0%, #7b2ff7 26%, #ff4fa3 52%, #ff8a3d 72%, #ffc46b 86%, #2a0a4a 100%); box-shadow: 0 30px 80px rgba(20,0,40,0.5); animation: afkArrive .45s cubic-bezier(.2,.9,.3,1.2) both; }
.afk-soleil { position: absolute; left: 50%; top: 44%; width: 290px; height: 290px; transform: translate(-50%, -50%); border-radius: 50%; background: repeating-linear-gradient(180deg, #ffe08a 0 18px, transparent 18px 26px); opacity: 0.5; -webkit-mask-image: linear-gradient(180deg, #000 40%, transparent 100%); mask-image: linear-gradient(180deg, #000 40%, transparent 100%); }
.afk-bandeau { position: absolute; left: 0; right: 0; top: 33%; background: rgba(0,0,0,0.72); padding: 12px 30px 16px; transform: skewY(-3deg); }
.afk-titre { font-family: 'Anton', Impact, sans-serif; line-height: 0.9; letter-spacing: 1px; background: linear-gradient(180deg, #fff6d6 0%, #ffd36b 35%, #ff7a59 65%, #ff3cac 100%); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-stroke: 2px rgba(40,0,60,0.55); filter: drop-shadow(0 5px 0 rgba(40,0,60,0.55)) drop-shadow(0 10px 18px rgba(0,0,0,0.35)); }
.afk-vi { background: linear-gradient(180deg, #ffe7a0 0%, #ff9a4d 40%, #ff3cac 75%, #b026ff 100%); -webkit-background-clip: text; background-clip: text; }
.afk-rose { background: linear-gradient(90deg, #ff4fa3, #ffd36b); -webkit-background-clip: text; background-clip: text; -webkit-text-stroke: 0; filter: drop-shadow(0 4px 0 rgba(0,0,0,0.6)); }
.afk-texte { font-family: 'Bebas Neue', 'Anton', sans-serif; letter-spacing: 1.5px; text-shadow: 0 3px 0 rgba(40,0,60,0.6), 0 6px 14px rgba(0,0,0,0.4); }
.afk-barre { height: 100%; width: 12%; background: linear-gradient(90deg, #ff4fa3, #ffd36b); animation: afkCharge 4s ease-in-out infinite; }
.afk-bouton { margin-top: 12px; border: none; border-radius: 999px; padding: 11px 22px; font-family: 'Bebas Neue', sans-serif; font-size: 20px; letter-spacing: 1.5px; color: #14002b; background: linear-gradient(90deg, #ffd36b, #ff7a59, #ff4fa3); cursor: pointer; box-shadow: 0 8px 20px rgba(255,79,163,0.4); }
.afk-bouton:focus-visible { outline: 3px solid #fff; outline-offset: 3px; }
@keyframes afkCharge { 0% { width: 4%; } 70% { width: 92%; } 100% { width: 97%; } }
@keyframes afkFondu { from { opacity: 0; } }
@keyframes afkArrive { from { opacity: 0; transform: scale(.9) rotate(-1deg); } }
@media (prefers-reduced-motion: reduce) { .afk-fenetre, .afk-barre { animation: none; } }
`
