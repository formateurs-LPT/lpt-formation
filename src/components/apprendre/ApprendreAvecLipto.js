'use client'
// « Apprendre avec Lipto » (23/11) — les mini-simulations Lipto (menu du
// dashboard formateur), présentées comme un menu de jeu vidéo :
//   1. choix de la formation : France ou Belgique (deux Lipto aux couleurs du pays)
//   2. les simulations de ce pays, en miniatures façon vidéos
//   3. la fiche d'une simulation : mode score (compte pour le rapport de fin
//      de formation) ou mode libre (entraînement, rien n'est enregistré)
// La Simulation finale n'est pas ici : elle aura sa propre tuile.
// integre : affichée dans la page du dashboard (marges du dashboard).
import { useEffect, useState } from 'react'
import { LIPTO_POSES } from '@/lib/lipto'
import LiptoAFK from './LiptoAFK'

const NAVY = '#03112a', OR = '#c9a227', BLEU = '#00abe9', DOUX = '#5b6577', TRAIT = '#e3e6ee'

// pays : formations où la simulation est proposée (Kevin précisera lesquelles
// sont communes et lesquelles sont propres à la France ou à la Belgique)
export const SIMULATIONS_LIPTO = [
  {
    id: 'accueille-moi', titre: 'Accueille-moi si tu peux !', categorie: 'Accueil', pays: ['fr', 'be'],
    description: 'Lipto entre en magasin : à toi de bien l’accueillir.', meta: 'Simulation à écrire', statut: 'preparation',
    vignette: 'accueil',
  },
  {
    id: 'recherche-besoins', titre: 'Recherche des besoins', categorie: 'Vente', pays: ['fr', 'be'],
    description: 'Découvrir les besoins de Lipto avant de lui proposer quoi que ce soit.', meta: 'Simulation à écrire', statut: 'preparation',
    vignette: 'besoins',
  },
  {
    id: 'lipto-vs-prog', titre: 'Lipto VS Prog', categorie: 'Verres', pays: ['fr', 'be'],
    description: 'Argumenter le verre progressif face à un client qui hésite.', meta: 'Simulation à écrire', statut: 'preparation',
    vignette: 'prog',
  },
  {
    id: 'troisieme-paire', titre: 'Vendre une 3e paire à -20 %', categorie: 'Vente', pays: ['fr', 'be'],
    description: 'Lipto a choisi ses deux paires : propose-lui la troisième.', meta: 'Simulation à écrire', statut: 'preparation',
    vignette: 'troisieme',
  },
  {
    id: 'lipto-voit-flou', titre: 'Lipto ne voit pas dans ses lunettes', categorie: 'SAV', pays: ['fr', 'be'],
    description: 'Lipto revient en magasin : avec ses nouvelles lunettes, il voit flou.', meta: 'Simulation à écrire', statut: 'preparation',
    vignette: 'flou',
  },
]
const CATEGORIES = ['Tout', 'Accueil', 'Vente', 'Verres', 'SAV']

export const PAYS = {
  fr: { nom: 'France', formation: 'Formation France', couleurs: ['#1f4fa3', '#ffffff', '#e1393f'], bulle: 'Bonjour !', pose: 'bienvenue' },
  be: { nom: 'Belgique', formation: 'Formation Belgique', couleurs: ['#1d1d1b', '#f7cf2d', '#e1393f'], bulle: 'Salut, une fois !', pose: 'pouce' },
}

export const MODES = {
  score: { nom: 'Mode score', icone: '🏆', texte: 'Les réponses sont notées : le score de chaque collaborateur compte pour le rapport de fin de formation.' },
  libre: { nom: 'Mode libre', icone: '🎮', texte: 'Pour s’entraîner sans pression : rien n’est noté ni enregistré.' },
}

// Pour chaque miniature : son décor, la pose de Lipto et de quel côté il sort de la tuile
const VIGNETTES = {
  accueil: { Decor: VignetteAccueil, pose: 'bienvenue', classe: '' },
  prog: { Decor: VignetteProg, pose: 'encouragement', classe: 'al-lipto-prog' },
  besoins: { Decor: VignetteBesoins, pose: 'reflexion', classe: '' },
  troisieme: { Decor: VignetteTroisieme, pose: 'bravo', classe: 'al-lipto-droite' },
  flou: { Decor: VignetteFlou, pose: 'surpris', classe: 'al-lipto-droite' },
}

// onLancer(simulation, mode, pays) : appelé quand on clique « Jouer »
export default function ApprendreAvecLipto({ onLancer, integre = false }) {
  const [pays, setPays] = useState(null)
  const [fiche, setFiche] = useState(null)
  return (
    <div className={integre ? 'al-integre' : ''} style={{ minHeight: integre ? 0 : '100vh', background: integre ? 'transparent' : '#f5f6fa', color: NAVY }}>
      <style>{CSS}</style>
      {!pays
        ? <ChoixPays onChoix={setPays} />
        : <MenuPays pays={pays} onChangerPays={() => setPays(null)} onFiche={setFiche} />}
      {/* Simulation pas encore prête : Lipto joue à GTA VI (clin d'œil) */}
      {fiche && fiche.statut !== 'disponible' && <LiptoAFK titre={fiche.titre} onFermer={() => setFiche(null)} />}
      {fiche && fiche.statut === 'disponible' && <FicheJeu s={fiche} pays={pays} onFermer={() => setFiche(null)} onLancer={mode => onLancer?.(fiche, mode, pays)} />}
    </div>
  )
}

// ── Écran 1 : France ou Belgique ──
function ChoixPays({ onChoix }) {
  return (
    <div className="al-largeur" style={{ maxWidth: 1240, margin: '0 auto', padding: '36px 32px 40px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 800, color: '#7c5cff' }}>Mini-simulations</div>
        <h1 style={{ fontSize: 42, fontWeight: 800, letterSpacing: -0.8, margin: '6px 0 6px', lineHeight: 1.05 }}>Apprendre avec Lipto</h1>
        <p style={{ fontSize: 17, color: DOUX, margin: 0 }}>Choisis ta formation</p>
      </div>
      <div className="al-pays-grille">
        {Object.entries(PAYS).map(([code, p]) => {
          const n = SIMULATIONS_LIPTO.filter(s => s.pays.includes(code)).length
          return (
            <button key={code} className="al-pays" onClick={() => onChoix(code)}>
              <div className="al-pays-fond" style={{ background: `linear-gradient(120deg, ${p.couleurs[0]} 0 33%, ${p.couleurs[1]} 33% 66%, ${p.couleurs[2]} 66% 100%)` }} />
              <div className="al-pays-voile" />
              <span className="al-pays-bulle">{p.bulle}</span>
              <LiptoPays code={code} />
              <div className="al-pays-bas">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Drapeau code={code} />
                  <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.5 }}>{p.nom}</span>
                </div>
                <div style={{ fontSize: 14, color: DOUX, marginTop: 4 }}>{p.formation} · {n} simulation{n > 1 ? 's' : ''}</div>
                <span className="al-pays-entrer">Entrer ▶</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Lipto aux couleurs du pays : béret et croissant pour la France, cornet de
// frites pour la Belgique (positions calées sur les images des poses)
function LiptoPays({ code }) {
  const p = PAYS[code]
  return (
    <div className="al-pays-lipto">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LIPTO_POSES[p.pose].src} alt={`Lipto, ${p.formation}`} style={{ width: '100%', display: 'block' }} />
      {code === 'fr' ? (
        <>
          <Beret />
          <span className="al-accessoire" style={{ left: '79%', top: '38%', fontSize: '24cqw', transform: 'rotate(-12deg)' }}>🥐</span>
        </>
      ) : (
        <span className="al-accessoire" style={{ left: '-4%', top: '50%', fontSize: '26cqw', transform: 'rotate(-10deg)' }}>🍟</span>
      )}
    </div>
  )
}
function Beret() {
  return (
    <svg viewBox="0 0 200 90" className="al-beret" aria-hidden>
      <ellipse cx="100" cy="58" rx="92" ry="26" fill="#1b2a4a" />
      <ellipse cx="100" cy="46" rx="80" ry="34" fill="#22345c" />
      <ellipse cx="78" cy="34" rx="34" ry="10" fill="#ffffff" opacity="0.12" />
      <path d="M100,13 q3,-12 12,-12" fill="none" stroke="#1b2a4a" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}
function Drapeau({ code, taille = 30 }) {
  const c = PAYS[code].couleurs
  return (
    <svg width={taille} height={taille * 0.68} viewBox="0 0 3 2" style={{ borderRadius: 4, boxShadow: '0 0 0 1px rgba(3,17,42,0.15)', flexShrink: 0 }} aria-label={PAYS[code].nom}>
      <rect width="1" height="2" x="0" fill={c[0]} /><rect width="1" height="2" x="1" fill={c[1]} /><rect width="1" height="2" x="2" fill={c[2]} />
    </svg>
  )
}

// ── Écran 2 : les simulations du pays ──
function MenuPays({ pays, onChangerPays, onFiche }) {
  const [categorie, setCategorie] = useState('Tout')
  const duPays = SIMULATIONS_LIPTO.filter(s => s.pays.includes(pays))
  const liste = duPays.filter(s => categorie === 'Tout' || s.categorie === categorie)
  return (
    <>
      <header className="al-largeur" style={{ maxWidth: 1240, margin: '0 auto', padding: '36px 32px 8px', display: 'flex', alignItems: 'flex-end', gap: 24 }}>
        <div style={{ flex: 1 }}>
          <button onClick={onChangerPays} className="al-retour">
            <Drapeau code={pays} taille={22} /> {PAYS[pays].formation} <span style={{ color: DOUX, fontWeight: 600 }}>· changer</span>
          </button>
          <h1 style={{ fontSize: 40, fontWeight: 800, letterSpacing: -0.8, margin: '12px 0 6px', lineHeight: 1.05 }}>Apprendre avec Lipto</h1>
          <p style={{ fontSize: 16, color: DOUX, maxWidth: 560, margin: 0, lineHeight: 1.5 }}>Des situations du magasin à jouer en équipe : Lipto fait le client, tes collaborateurs répondent sur leur téléphone.</p>
        </div>
        <div style={{ width: 110, flexShrink: 0 }}><LiptoPays code={pays} /></div>
      </header>

      <nav className="al-largeur" style={{ maxWidth: 1240, margin: '0 auto', padding: '18px 32px 0', display: 'flex', gap: 8 }}>
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategorie(c)} className={'al-puce' + (categorie === c ? ' al-actif' : '')}>{c}</button>
        ))}
      </nav>

      <main className="al-grille al-largeur">
        {liste.map(s => <Miniature key={s.id} s={s} onOuvrir={() => onFiche(s)} />)}
        {categorie === 'Tout' && <Bientot />}
      </main>
    </>
  )
}

// ── Écran 3 : la fiche de la simulation, choix du mode ──
function FicheJeu({ s, pays, onFermer, onLancer }) {
  const [mode, setMode] = useState('score')
  const prete = s.statut === 'disponible'
  const V = VIGNETTES[s.vignette]
  useEffect(() => {
    const touche = e => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [onFermer])
  return (
    <div className="al-fiche-fond" onClick={onFermer}>
      <div className="al-fiche" onClick={e => e.stopPropagation()}>
        <button onClick={onFermer} className="al-fiche-x" aria-label="Fermer">×</button>
        <div className="al-scene" style={{ marginTop: 26 }}>
          <div className="al-vignette" style={{ borderRadius: 16 }}><V.Decor /></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={'al-lipto ' + V.classe} src={LIPTO_POSES[V.pose].src} alt="Lipto" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, fontSize: 13, color: '#8a93a3' }}>
          <Drapeau code={pays} taille={20} /> {PAYS[pays].formation} · {s.categorie}
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '4px 0 4px', letterSpacing: -0.3 }}>{s.titre}</h2>
        <p style={{ fontSize: 15, color: DOUX, margin: 0 }}>{s.description}</p>

        <div style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 800, color: '#7c5cff', marginTop: 22 }}>Choisis ton mode</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
          {Object.entries(MODES).map(([code, m]) => (
            <button key={code} onClick={() => setMode(code)} className={'al-mode' + (mode === code ? ' al-mode-actif' : '')}>
              <span style={{ fontSize: 30 }}>{m.icone}</span>
              <span style={{ fontSize: 17, fontWeight: 800 }}>{m.nom}</span>
              <span style={{ fontSize: 13, color: DOUX, lineHeight: 1.4 }}>{m.texte}</span>
            </button>
          ))}
        </div>

        <button className="al-jouer" disabled={!prete} onClick={() => onLancer(mode)}>
          {prete ? `▶ Jouer en ${MODES[mode].nom.toLowerCase()}` : 'En préparation : bientôt jouable'}
        </button>
      </div>
    </div>
  )
}

function Miniature({ s, onOuvrir }) {
  const prete = s.statut === 'disponible'
  const V = VIGNETTES[s.vignette]
  return (
    <button className="al-carte" onClick={onOuvrir}>
      <div className="al-scene">
        <div className="al-vignette">
          <V.Decor />
          {prete && <span className="al-badge" style={{ background: 'rgba(3,17,42,0.85)', color: '#fff' }}>▶ Jouer</span>}
        </div>
        {/* Lipto sort de la tuile */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={'al-lipto ' + V.classe} src={LIPTO_POSES[V.pose].src} alt="Lipto" />
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14, textAlign: 'left' }}>
        <span style={{ width: 40, height: 40, borderRadius: 20, background: '#fff', border: `1px solid ${TRAIT}`, flexShrink: 0, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LIPTO_POSES.reflexion.src} alt="" style={{ height: 34 }} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{s.titre}</div>
          <div style={{ fontSize: 14, color: DOUX, marginTop: 3, lineHeight: 1.4 }}>{s.description}</div>
          <div style={{ fontSize: 13, color: '#8a93a3', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>{s.categorie} · {s.meta}</span>
            {!prete && <span style={{ fontSize: 11, fontWeight: 800, color: '#8a6d12', background: 'rgba(201,162,39,0.16)', borderRadius: 6, padding: '2px 8px' }}>En préparation</span>}
          </div>
        </div>
      </div>
    </button>
  )
}

// ── Miniature « Accueille-moi si tu peux ! » : magasin flouté + gros titre ──
function VignetteAccueil() {
  return (
    <>
      <div className="al-photo" style={{ backgroundImage: 'url(/assets/magasins/magasin-allee.webp)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(3,17,42,0) 25%, rgba(3,17,42,0.55) 60%, rgba(3,17,42,0.8) 100%)' }} />
      <div className="al-texte" style={{ right: '5%', top: '32%', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 'clamp(15px, 1.45vw, 22px)' }}>Accueille-moi</div>
        <div style={{ fontSize: 'clamp(19px, 1.85vw, 28px)', color: OR, marginTop: 4 }}>si tu peux&nbsp;!</div>
      </div>
    </>
  )
}

// ── Miniature « Lipto VS Prog » : affiche de combat, Lipto face au verre ──
function VignetteProg() {
  return (
    <>
      <div className="al-photo" style={{ backgroundImage: 'url(/assets/labo-progressif-chatelet.jpg)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(0,137,186,0.55) 0%, rgba(3,17,42,0.75) 48%, rgba(3,17,42,0.75) 52%, rgba(201,162,39,0.5) 100%)' }} />
      <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 3, background: 'linear-gradient(transparent, rgba(255,255,255,0.7), transparent)', transform: 'skewX(-14deg)' }} />
      <VerreProgressif />
      <div className="al-texte al-vs" style={{ left: '50%', top: '38%', transform: 'translate(-50%, -50%)', fontSize: 'clamp(34px, 3.6vw, 52px)' }}>VS</div>
      <BarreDeVie cote="gauche" nom="Lipto" />
      <BarreDeVie cote="droite" nom="Prog" />
    </>
  )
}

// Verre progressif dessiné : vision de loin en haut, couloir, vision de près
// en bas, zones floues sur les côtés
// ── « Recherche des besoins » : Lipto réfléchit, ses usages en bulles ──
function VignetteBesoins() {
  const bulles = [['📖', '58%', '18%'], ['💻', '76%', '10%'], ['🚗', '88%', '36%'], ['☀️', '66%', '44%']]
  return (
    <>
      <div className="al-photo" style={{ backgroundImage: 'url(/assets/magasins/magasin-tables.webp)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(3,17,42,0.05) 20%, rgba(124,92,255,0.45) 65%, rgba(3,17,42,0.8) 100%)' }} />
      {bulles.map(([e, x, y], i) => (
        <span key={i} className="al-bulle" style={{ left: x, top: y, animationDelay: `${i * 0.4}s` }}>{e}</span>
      ))}
      <div className="al-texte" style={{ right: '5%', bottom: '12%', textAlign: 'right', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 'clamp(15px, 1.45vw, 22px)' }}>Quels sont</div>
        <div style={{ fontSize: 'clamp(19px, 1.85vw, 28px)', color: OR, marginTop: 4 }}>tes besoins&nbsp;?</div>
      </div>
    </>
  )
}

// ── « Vendre une 3e paire à -20 % » : trois paires, la 3e avec l'étiquette ──
function VignetteTroisieme() {
  return (
    <>
      <div className="al-photo" style={{ backgroundImage: 'url(/assets/magasins/vitrine-montures.webp)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(260deg, rgba(3,17,42,0.05) 20%, rgba(3,17,42,0.55) 55%, rgba(3,17,42,0.85) 100%)' }} />
      <div className="al-texte" style={{ left: '5%', top: '12%', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 'clamp(15px, 1.45vw, 22px)' }}>La 3<sup style={{ fontSize: '0.6em' }}>e</sup> paire</div>
      </div>
      <div style={{ position: 'absolute', left: '5%', top: '34%', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Monture couleur="#e8eef6" />
        <Monture couleur="#e8eef6" />
        <Monture couleur={OR} />
      </div>
      <span className="al-etiquette">-20&nbsp;%</span>
    </>
  )
}
function Monture({ couleur }) {
  return (
    <svg viewBox="0 0 120 40" style={{ width: 'clamp(70px, 7vw, 104px)', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.35))' }} aria-hidden>
      <rect x="6" y="8" width="44" height="26" rx="11" fill="rgba(255,255,255,0.18)" stroke={couleur} strokeWidth="5" />
      <rect x="70" y="8" width="44" height="26" rx="11" fill="rgba(255,255,255,0.18)" stroke={couleur} strokeWidth="5" />
      <path d="M50,17 Q60,10 70,17" fill="none" stroke={couleur} strokeWidth="5" />
    </svg>
  )
}

// ── « Lipto ne voit pas dans ses lunettes » : tableau de lettres flou ──
function VignetteFlou() {
  return (
    <>
      <div className="al-photo" style={{ backgroundImage: 'url(/assets/magasins/magasin-comptoir.webp)', filter: 'blur(5px) saturate(1.1)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(260deg, rgba(3,17,42,0.05) 25%, rgba(3,17,42,0.6) 60%, rgba(3,17,42,0.85) 100%)' }} />
      <div className="al-optotype" aria-hidden>
        <div style={{ fontSize: '2.1em', filter: 'blur(1px)' }}>E</div>
        <div style={{ fontSize: '1.4em', filter: 'blur(2px)' }}>F P</div>
        <div style={{ fontSize: '1em', filter: 'blur(3px)' }}>T O Z</div>
      </div>
      <div className="al-texte" style={{ left: '5%', bottom: '12%', whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 'clamp(15px, 1.45vw, 22px)' }}>Je ne vois</div>
        <div style={{ fontSize: 'clamp(19px, 1.85vw, 28px)', color: OR, marginTop: 4 }}>rien&nbsp;!</div>
      </div>
    </>
  )
}

// Barres de vie façon jeu de combat, en bas de la miniature
function BarreDeVie({ cote, nom }) {
  const gauche = cote === 'gauche'
  return (
    <div style={{ position: 'absolute', bottom: '7%', [gauche ? 'left' : 'right']: '4%', width: '42%', display: 'flex', flexDirection: 'column', alignItems: gauche ? 'flex-start' : 'flex-end', gap: 4 }}>
      <span className="al-texte" style={{ position: 'static', fontSize: 'clamp(15px, 1.5vw, 21px)', WebkitTextStroke: '5px #03112a' }}>{nom}</span>
      <div style={{ width: '100%', height: 9, borderRadius: 5, background: 'rgba(3,17,42,0.7)', border: '1.5px solid rgba(255,255,255,0.8)', overflow: 'hidden', display: 'flex', justifyContent: gauche ? 'flex-start' : 'flex-end' }}>
        <div style={{ width: gauche ? '82%' : '64%', background: gauche ? 'linear-gradient(90deg, #4ade80, #c9e86b)' : 'linear-gradient(270deg, #f59e0b, #fbbf24)' }} />
      </div>
    </div>
  )
}

function VerreProgressif() {
  return (
    <svg className="al-verre" viewBox="0 0 200 200" aria-label="Verre progressif">
      <defs>
        <radialGradient id="alVerreFond" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#e8f7ff" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#7cc8ef" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#1f6f9e" stopOpacity="0.85" />
        </radialGradient>
        <pattern id="alFlou" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" fill="rgba(255,255,255,0.05)" />
          <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
        </pattern>
        <clipPath id="alVerreClip"><ellipse cx="100" cy="100" rx="88" ry="80" /></clipPath>
      </defs>
      <ellipse cx="100" cy="100" rx="88" ry="80" fill="url(#alVerreFond)" />
      <g clipPath="url(#alVerreClip)">
        {/* zones floues latérales */}
        <path d="M0,95 C40,95 62,110 70,200 L0,200 Z" fill="url(#alFlou)" />
        <path d="M200,95 C160,95 138,110 130,200 L200,200 Z" fill="url(#alFlou)" />
        {/* couloir de progression */}
        <path d="M70,92 C88,100 90,118 88,140 L112,140 C110,118 112,100 130,92" fill="none" stroke="#fff" strokeWidth="1.6" strokeDasharray="4 4" opacity="0.9" />
      </g>
      <ellipse cx="100" cy="100" rx="88" ry="80" fill="none" stroke="#ffffff" strokeWidth="4" opacity="0.9" />
      <ellipse cx="72" cy="58" rx="30" ry="12" fill="#fff" opacity="0.35" transform="rotate(-20 72 58)" />
      <text x="100" y="62" textAnchor="middle" className="al-zone">LOIN</text>
      <text x="100" y="125" textAnchor="middle" className="al-zone">INTER.</text>
      <text x="100" y="162" textAnchor="middle" className="al-zone">PRÈS</text>
    </svg>
  )
}

function Bientot() {
  return (
    <div className="al-carte al-bientot">
      <div className="al-scene">
        <div className="al-vignette" style={{ background: 'repeating-linear-gradient(135deg, #eef0f6 0 14px, #e6e9f1 14px 28px)', display: 'grid', placeItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LIPTO_POSES.reflexion.src} alt="" style={{ height: '62%', opacity: 0.35, filter: 'grayscale(1)' }} />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#8a93a3' }}>Bientôt</div>
        <div style={{ fontSize: 14, color: '#a0a8b6', marginTop: 3 }}>Une nouvelle simulation en préparation dans l’Atelier Lipto.</div>
      </div>
    </div>
  )
}

const CSS = `
.al-grille { max-width: 1240px; margin: 0 auto; padding: 64px 32px 60px; display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); column-gap: 26px; row-gap: 72px; }
.al-pays-grille { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 28px; margin-top: 70px; max-width: 980px; margin-left: auto; margin-right: auto; }
.al-pays { position: relative; height: 420px; border: none; padding: 0; border-radius: 24px; cursor: pointer; font-family: inherit; color: ${NAVY}; text-align: left; background: #fff; box-shadow: 0 14px 36px rgba(3,17,42,0.14); transition: transform .35s cubic-bezier(.2,.8,.3,1), box-shadow .35s; }
.al-pays-fond { position: absolute; inset: 0 0 38% 0; border-radius: 24px 24px 0 0; opacity: 0.9; }
.al-pays-voile { position: absolute; inset: 0 0 38% 0; border-radius: 24px 24px 0 0; background: linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.55)); }
.al-pays-lipto { position: relative; container-type: inline-size; }
.al-pays .al-pays-lipto { position: absolute; left: 50%; bottom: 30%; width: 58%; transform: translateX(-50%); filter: drop-shadow(0 18px 18px rgba(3,17,42,0.35)); transition: transform .4s cubic-bezier(.2,.8,.3,1.3); }
.al-pays-bas { position: absolute; left: 0; right: 0; bottom: 0; height: 38%; padding: 22px 26px; background: #fff; border-radius: 0 0 24px 24px; }
.al-pays-entrer { position: absolute; right: 22px; bottom: 22px; background: ${NAVY}; color: #fff; font-weight: 800; font-size: 15px; border-radius: 12px; padding: 10px 18px; }
.al-pays-bulle { position: absolute; top: 18px; right: 18px; z-index: 2; background: #fff; border-radius: 16px; padding: 8px 14px; font-weight: 800; font-size: 15px; box-shadow: 0 6px 16px rgba(3,17,42,0.18); }
.al-pays:hover { transform: translateY(-6px); box-shadow: 0 24px 50px rgba(3,17,42,0.2); }
.al-pays:hover .al-pays-lipto { transform: translateX(-50%) translateY(-16px) scale(1.04); }
.al-pays:focus-visible { outline: 3px solid ${BLEU}; outline-offset: 4px; }
.al-accessoire { position: absolute; line-height: 1; pointer-events: none; filter: drop-shadow(0 4px 4px rgba(0,0,0,0.25)); }
.al-beret { position: absolute; left: 13%; top: -5%; width: 56%; transform: rotate(-10deg); filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3)); }
.al-retour { display: inline-flex; align-items: center; gap: 8px; border: 1px solid ${TRAIT}; background: #fff; border-radius: 999px; padding: 6px 14px 6px 8px; font-size: 14px; font-weight: 800; color: ${NAVY}; cursor: pointer; font-family: inherit; }
.al-retour:hover { border-color: ${BLEU}; }
.al-fiche-fond { position: fixed; inset: 0; z-index: 300; background: rgba(3,17,42,0.6); backdrop-filter: blur(4px); display: grid; place-items: center; padding: 20px; animation: alFondu .2s ease both; }
.al-fiche { position: relative; width: min(560px, 100%); max-height: calc(100vh - 40px); overflow-y: auto; background: #fff; border-radius: 22px; padding: 26px 28px 28px; box-shadow: 0 30px 80px rgba(0,0,0,0.4); animation: alMonte .3s cubic-bezier(.2,.9,.3,1.2) both; }
.al-fiche-x { position: absolute; top: 12px; right: 12px; z-index: 3; width: 36px; height: 36px; border-radius: 10px; border: none; background: #f1f3f8; font-size: 22px; color: ${NAVY}; cursor: pointer; }
.al-mode { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; text-align: left; padding: 16px; border-radius: 16px; border: 2px solid ${TRAIT}; background: #fafbfd; cursor: pointer; font-family: inherit; color: ${NAVY}; transition: border-color .15s, background .15s, transform .15s; }
.al-mode:hover { transform: translateY(-2px); }
.al-mode-actif { border-color: #7c5cff; background: #f4f1ff; box-shadow: 0 0 0 4px rgba(124,92,255,0.15); }
.al-jouer { width: 100%; margin-top: 18px; border: none; border-radius: 14px; padding: 15px 18px; font-size: 17px; font-weight: 800; font-family: inherit; cursor: pointer; color: #fff; background: linear-gradient(90deg, #7c5cff, #00abe9); box-shadow: 0 10px 24px rgba(124,92,255,0.35); }
.al-jouer:disabled { cursor: default; background: #e6e9f1; color: #8a93a3; box-shadow: none; }
@keyframes alFondu { from { opacity: 0; } }
@keyframes alMonte { from { opacity: 0; transform: translateY(20px) scale(.97); } }
.al-integre .al-largeur { max-width: none !important; padding-left: 0 !important; padding-right: 0 !important; }
.al-integre header.al-largeur { padding-top: 4px !important; }
.al-carte { display: block; width: 100%; border: none; background: none; padding: 0; cursor: pointer; font-family: inherit; color: ${NAVY}; text-align: left; }
.al-bientot { cursor: default; }
.al-scene { position: relative; perspective: 900px; }
.al-vignette { position: relative; aspect-ratio: 16 / 9; border-radius: 18px; overflow: hidden; background: ${NAVY}; box-shadow: 0 10px 28px rgba(3,17,42,0.16); transform-origin: 50% 100%; transition: transform .35s cubic-bezier(.2,.8,.3,1), box-shadow .35s; }
.al-photo { position: absolute; inset: -6%; background-size: cover; background-position: center; filter: blur(2.5px) saturate(1.1); transform: scale(1.02); transition: transform .6s ease; }
.al-texte { position: absolute; font-weight: 900; text-transform: uppercase; line-height: 1; letter-spacing: -0.5px; color: #fff; -webkit-text-stroke: 7px ${NAVY}; paint-order: stroke fill; text-shadow: 0 6px 18px rgba(0,0,0,0.35); }
.al-vs { display: inline-block; color: ${OR}; font-style: italic; font-size: 1.5em; margin: 0 0.1em; transform: translateY(0.06em); text-shadow: 0 0 18px rgba(201,162,39,0.8), 0 6px 18px rgba(0,0,0,0.4); }
.al-zone { font-size: 11px; font-weight: 800; letter-spacing: 1.5px; fill: #03112a; opacity: 0.75; font-family: inherit; }
.al-verre { position: absolute; right: 7%; bottom: 27%; width: 33%; filter: drop-shadow(0 12px 18px rgba(0,0,0,0.4)); transition: transform .5s cubic-bezier(.2,.8,.3,1); }
.al-badge { position: absolute; right: 12px; top: 12px; font-size: 12px; font-weight: 800; border-radius: 8px; padding: 5px 10px; letter-spacing: 0.3px; }
.al-lipto { position: absolute; left: 2%; bottom: -3%; height: 106%; pointer-events: none; filter: drop-shadow(0 16px 16px rgba(3,17,42,0.4)); transform-origin: 50% 100%; transition: transform .4s cubic-bezier(.2,.8,.3,1.3); }
.al-lipto-prog { left: 6%; bottom: 22%; height: 92%; }
.al-lipto-droite { left: auto; right: 2%; }
.al-bulle { position: absolute; width: 13%; aspect-ratio: 1; border-radius: 50%; background: rgba(255,255,255,0.92); display: grid; place-items: center; font-size: clamp(16px, 1.6vw, 24px); box-shadow: 0 6px 14px rgba(3,17,42,0.3); animation: alFlotte 3.2s ease-in-out infinite; }
.al-etiquette { position: absolute; left: 33%; top: 46%; transform: rotate(-12deg); background: #dc2626; color: #fff; font-weight: 900; font-size: clamp(16px, 1.7vw, 26px); padding: 6px 12px; border-radius: 10px; border: 3px solid #fff; box-shadow: 0 8px 18px rgba(0,0,0,0.35); }
.al-optotype { position: absolute; left: 8%; top: 9%; background: #fff; color: ${NAVY}; border-radius: 8px; padding: 6px 16px 8px; font-weight: 800; text-align: center; line-height: 1.1; font-size: clamp(13px, 1.3vw, 19px); letter-spacing: 3px; box-shadow: 0 8px 18px rgba(0,0,0,0.35); transform: rotate(-4deg); }
@keyframes alFlotte { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
.al-carte:not(.al-bientot):hover .al-vignette { transform: rotateX(6deg) translateY(-4px); box-shadow: 0 22px 40px rgba(3,17,42,0.22); }
.al-carte:not(.al-bientot):hover .al-photo { transform: scale(1.08); }
.al-carte:not(.al-bientot):hover .al-lipto { transform: translateY(-14px) scale(1.06) rotate(-2deg); }
.al-carte:not(.al-bientot):hover .al-verre { transform: rotate(8deg) scale(1.05); }
.al-carte:focus-visible .al-vignette { outline: 3px solid ${BLEU}; outline-offset: 4px; }
.al-puce { border: 1px solid ${TRAIT}; background: #fff; border-radius: 999px; padding: 8px 16px; font-size: 14px; font-weight: 700; color: ${NAVY}; cursor: pointer; font-family: inherit; }
.al-puce.al-actif { background: ${NAVY}; border-color: ${NAVY}; color: #fff; }
@media (prefers-reduced-motion: reduce) { .al-vignette, .al-photo, .al-lipto, .al-verre { transition: none; } .al-bulle { animation: none; } }
`
