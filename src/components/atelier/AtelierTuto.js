'use client'
// Atelier Lipto — tuto de démarrage (27/11) : s'ouvre au milieu de l'écran à la
// première ouverture de l'atelier par un formateur, puis à la demande
// (« Revoir le tuto »). Les pages défilent avec Suivant / Précédent, les
// flèches du clavier ou les points du bas. La notice de droite reste en place.
import { useEffect, useState } from 'react'
import Lipto from '@/components/lipto/Lipto'
import { THEMES_TEL } from '@/lib/themeTelephone'
import { TYPES_CASE, TYPES_AJOUTABLES, TYPES_QUESTION } from '@/lib/atelierSimulation'
import { Avatar } from './AtelierEquipe'

const NAVY = '#03112a', BLEU = '#00abe9', TRAIT = '#e3e6ee', DOUX = '#64748b', FOND = '#f5f6fa'

// Retenu par formateur et par navigateur
const cleTuto = moi => `atelier_lipto_tuto_vu_${(moi || '').toLowerCase()}`
export function tutoDejaVu(moi) {
  try { return localStorage.getItem(cleTuto(moi)) === '1' } catch { return true }
}
function marquerTutoVu(moi) {
  try { localStorage.setItem(cleTuto(moi), '1') } catch {}
}

export default function AtelierTuto({ moi, onFermer }) {
  const [page, setPage] = useState(0)
  const [sens, setSens] = useState(1)
  const pages = PAGES(moi)
  const derniere = page === pages.length - 1
  const aller = n => { if (n < 0 || n >= pages.length) return; setSens(n > page ? 1 : -1); setPage(n) }
  const fermer = () => { marquerTutoVu(moi); onFermer() }

  useEffect(() => {
    const touche = e => {
      if (e.key === 'ArrowRight') aller(page + 1)
      else if (e.key === 'ArrowLeft') aller(page - 1)
      else if (e.key === 'Escape') fermer()
    }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  })

  const p = pages[page]
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(3,17,42,0.55)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', padding: 20, animation: 'tuFondu .25s ease both' }}>
      <style>{CSS}</style>
      <div role="dialog" aria-modal="true" aria-label="Tuto de démarrage de l’Atelier Lipto" style={{ width: 'min(860px, 100%)', maxHeight: 'calc(100vh - 40px)', background: '#fff', borderRadius: 22, boxShadow: '0 30px 80px rgba(3,17,42,0.35)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'tuEntree .35s cubic-bezier(.2,.8,.2,1) both' }}>
        {/* Barre de progression */}
        <div style={{ height: 4, background: '#eef0f6' }}>
          <div style={{ height: '100%', width: `${((page + 1) / pages.length) * 100}%`, background: BLEU, transition: 'width .35s ease' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px 0', fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: DOUX }}>
          <span style={{ flex: 1 }}>Tuto de démarrage · {page + 1} / {pages.length}</span>
          <button onClick={fermer} className="tu-passer">{derniere ? 'Fermer' : 'Passer le tuto'}</button>
        </div>

        <div key={page} className={sens > 0 ? 'tu-page tu-droite' : 'tu-page tu-gauche'} style={{ height: 'min(400px, calc(100vh - 190px))', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.1fr)', gap: 30, padding: '18px 34px 10px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: BLEU, letterSpacing: 1 }}>{p.surtitre}</div>
            <h2 style={{ fontSize: 26, lineHeight: 1.15, fontWeight: 800, margin: '6px 0 12px', color: NAVY }}>{p.titre}</h2>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: '#334155', display: 'flex', flexDirection: 'column', gap: 10 }}>{p.texte}</div>
          </div>
          <div style={{ background: FOND, borderRadius: 18, padding: 18, minHeight: 280, display: 'grid', placeItems: 'center', border: `1px solid ${TRAIT}` }}>
            {p.visuel}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px 20px', borderTop: `1px solid ${TRAIT}`, marginTop: 8 }}>
          <button onClick={() => aller(page - 1)} className="tu-btn" style={{ visibility: page ? 'visible' : 'hidden' }}>← Précédent</button>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 7 }}>
            {pages.map((_, i) => (
              <button key={i} onClick={() => aller(i)} aria-label={`Page ${i + 1}`} className="tu-point" style={{ width: i === page ? 22 : 8, background: i === page ? NAVY : i < page ? '#94a3b8' : '#d5dae4' }} />
            ))}
          </div>
          {derniere
            ? <button onClick={fermer} className="tu-btn tu-plein">C’est parti ! 🚀</button>
            : <button onClick={() => aller(page + 1)} className="tu-btn tu-plein">Suivant →</button>}
        </div>
      </div>
    </div>
  )
}

// ── Les pages ──
const PAGES = moi => [
  {
    surtitre: `Bienvenue ${moi} 👋`,
    titre: 'L’Atelier Lipto, c’est quoi ?',
    texte: <>
      <p>Ici, tu écris les <b>simulations de Lipto</b>, notre client virtuel.</p>
      <p>En formation, Lipto entre en magasin sur le diffuseur, et les collaborateurs lui répondent sur leur téléphone. Toi, tu as écrit ce qu’il dit, ce qu’on lui demande, et comment il réagit.</p>
      <p style={{ color: DOUX }}>Ce tuto prend 2 minutes. Tu peux le revoir quand tu veux.</p>
    </>,
    visuel: (
      <div style={{ textAlign: 'center' }}>
        <Lipto pose="bienvenue" message="Bonjour ! Je viens pour des lunettes…" taille={150} t={THEMES_TEL.clair} />
      </div>
    ),
  },
  {
    surtitre: 'À gauche',
    titre: 'Tes simulations et celles de l’équipe',
    texte: <>
      <p>En haut, <b>tes simulations</b>. En dessous, celles de tes collègues, <b>rangées par formateur</b> : tu vois tout de suite à qui appartient chaque projet.</p>
      <p><Pastille couleur="#16a34a">Prêt</Pastille> : la simulation est terminée. <Pastille couleur="#94a3b8">Brouillon</Pastille> : elle est encore en travaux.</p>
      <p>Pour commencer, clique sur <b>« + Nouvelle simulation »</b>.</p>
    </>,
    visuel: <MaquetteListe moi={moi} />,
  },
  {
    surtitre: 'Le point de départ',
    titre: 'Un scénario commence par 🚩',
    texte: <>
      <p>Une simulation contient un ou plusieurs <b>scénarios</b>. Le formateur choisira lequel lancer en formation.</p>
      <p>Chaque scénario part d’une case <b>Départ</b>. Le bouton <b>« + Scénario »</b>, en haut, en ajoute un nouveau.</p>
    </>,
    visuel: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <MiniCase type="depart" texte="Client qui hésite sur le progressif" />
        <Fleche />
        <MiniCase type="lipto" texte="Bonjour, je regarde juste, merci." />
      </div>
    ),
  },
  {
    surtitre: 'Construire l’histoire',
    titre: 'Ajoute la suite, case par case',
    texte: <>
      <p>Sous chaque case, clique sur <b>« + Ajouter la suite »</b> et choisis ce qui se passe ensuite.</p>
      <p>Pas besoin de ranger : <b>l’arbre se met en ordre tout seul</b>. Pour glisser une case entre deux autres, survole la case et clique sur « Insérer ».</p>
    </>,
    visuel: (
      <div style={{ width: 260, background: '#fff', borderRadius: 14, boxShadow: '0 14px 40px rgba(3,17,42,0.16)', border: `1px solid ${TRAIT}`, padding: 6 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: DOUX, fontWeight: 700, padding: '8px 10px 6px' }}>Ajouter la suite</div>
        {TYPES_AJOUTABLES.map((t, i) => (
          <div key={t} className="tu-ligne" style={{ animationDelay: `${0.1 + i * 0.08}s` }}>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: TYPES_CASE[t].couleur + '1a', display: 'grid', placeItems: 'center' }}>{TYPES_CASE[t].emoji}</span>
            {TYPES_CASE[t].nom}
          </div>
        ))}
      </div>
    ),
  },
  {
    surtitre: 'À droite',
    titre: 'Clique sur une case pour la remplir',
    texte: <>
      <p>Le panneau de droite s’ouvre avec les réglages de la case : <b>la phrase de Lipto</b>, son humeur, le décor, un document à montrer…</p>
      <p>Pour une question, choisis parmi {Object.keys(TYPES_QUESTION).length} types ({Object.values(TYPES_QUESTION).slice(0, 3).map(q => q.nom.toLowerCase()).join(', ')}…) et indique <b>la bonne réponse</b> : elle s’affichera à la correction.</p>
    </>,
    visuel: (
      <div style={{ width: 280, background: '#fff', borderRadius: 14, border: `1px solid ${TRAIT}`, boxShadow: '0 14px 40px rgba(3,17,42,0.12)', overflow: 'hidden' }}>
        <div style={{ padding: '10px 14px', borderBottom: `1px solid ${TRAIT}`, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14 }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: TYPES_CASE.question.couleur + '1a', display: 'grid', placeItems: 'center' }}>{TYPES_CASE.question.emoji}</span>
          {TYPES_CASE.question.nom}
        </div>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MiniChamp titre="Ce que dit Lipto" valeur="J’ai peur de ne pas m’habituer…" />
          <MiniChamp titre="Question aux collaborateurs" valeur="Que lui répondez-vous ?" />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.values(TYPES_QUESTION).slice(0, 3).map((q, i) => (
              <span key={q.nom} style={{ fontSize: 12, fontWeight: 700, borderRadius: 999, padding: '4px 10px', border: `1px solid ${i ? TRAIT : NAVY}`, background: i ? '#fff' : NAVY, color: i ? NAVY : '#fff', display: 'inline-flex', gap: 5 }}><span>{q.icone}</span>{q.nom}</span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    surtitre: 'En formation, c’est toi qui décides',
    titre: 'Le choix du formateur 🎭',
    texte: <>
      <p>Une case <b>Choix du formateur</b> prépare plusieurs répliques de Lipto. En formation, tu choisis celle qui colle à ce qu’ont répondu les collaborateurs.</p>
      <p>Chaque réplique a <b>sa propre suite</b>. Deux chemins peuvent se rejoindre : dans le menu « + », choisis <b>« Relier à une case existante »</b>, puis clique sur la case.</p>
    </>,
    visuel: (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <MiniCase type="choix" texte="Comment réagit Lipto ?" />
        <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Fleche /><MiniCase type="lipto" texte="Ah, ça me rassure !" etroite /></div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}><Fleche /><MiniCase type="lipto" texte="Hmm, pas convaincu…" etroite /></div>
        </div>
      </div>
    ),
  },
  {
    surtitre: 'Avant de lancer',
    titre: 'Vérifie, teste, puis « Prêt »',
    texte: <>
      <p>En haut de l’écran, l’atelier te signale <b>les suites à écrire</b> et <b>les ⚠ à corriger</b> : un clic t’emmène directement à la case.</p>
      <p><b>✍️ Orthographe</b> repère les fautes. <b>▶ Tester</b> joue la simulation comme sur le diffuseur.</p>
      <p>Quand tout est bon, passe-la en <b>« ✓ Prêt »</b>.</p>
    </>,
    visuel: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', width: 300 }}>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${TRAIT}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
          <span style={{ color: '#b45309' }}>2 suites à écrire</span> · <span style={{ color: '#dc2626' }}>⚠ 1</span>
          <span style={{ flex: 1 }} />
          <span style={{ color: '#7c5cff' }}>✍️ 1 faute ?</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', background: '#eef0f6', borderRadius: 10, padding: 3, flex: 1 }}>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, padding: '6px 0' }}>Brouillon</span>
            <span className="tu-pret" style={{ flex: 1, textAlign: 'center', fontSize: 13, fontWeight: 700, padding: '6px 0', borderRadius: 8 }}>✓ Prêt</span>
          </div>
          <span style={{ background: NAVY, color: '#fff', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>▶ Tester</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}><Lipto pose="pouce" taille={90} t={THEMES_TEL.clair} /></div>
      </div>
    ),
  },
  {
    surtitre: 'En équipe',
    titre: 'On travaille à plusieurs',
    texte: <>
      <p><b>Tout s’enregistre tout seul</b>, rien à sauvegarder.</p>
      <p>Une seule personne modifie un projet à la fois : si un collègue est dessus, tu le vois <b>en lecture seule 🔒</b> (tu peux quand même le tester).</p>
      <p>Tu veux partir du travail d’un collègue ? <b>« Dupliquer »</b> t’en fait une copie à ton nom, sans toucher à l’original.</p>
      <p style={{ color: DOUX }}>La notice reste disponible à droite (la flèche ‹ › la déplie), et ce tuto se relance avec <b>« Revoir le tuto »</b>, en bas à gauche.</p>
    </>,
    visuel: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 300 }}>
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: '10px 12px', fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>
          🔒 Thomas modifie ce projet en ce moment : tu le vois en lecture seule.
        </div>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${TRAIT}`, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
          <Avatar nom="Thomas" taille={28} />
          <span style={{ flex: 1 }}>Projet de <b>Thomas</b></span>
          <span style={{ border: `1px solid ${TRAIT}`, borderRadius: 8, padding: '5px 10px', fontWeight: 700 }}>Dupliquer</span>
        </div>
        <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>Enregistré ✓</div>
      </div>
    ),
  },
]

// ── Petites maquettes ──
const Pastille = ({ couleur, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: couleur, background: couleur + '18', borderRadius: 999, padding: '2px 9px', verticalAlign: 1 }}>
    <span style={{ width: 7, height: 7, borderRadius: 4, background: couleur }} />{children}
  </span>
)

const Fleche = () => <div style={{ width: 2, height: 22, background: '#cbd5e1', position: 'relative' }}><span style={{ position: 'absolute', bottom: -4, left: -4, width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '6px solid #cbd5e1' }} /></div>

function MiniCase({ type, texte, etroite }) {
  const T = TYPES_CASE[type]
  return (
    <div className="tu-case" style={{ width: etroite ? 150 : 230, background: '#fff', borderRadius: 12, border: `1px solid ${TRAIT}`, borderTop: `4px solid ${T.couleur}`, boxShadow: '0 6px 18px rgba(3,17,42,0.08)', padding: '8px 11px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.couleur, display: 'flex', gap: 5 }}><span>{T.emoji}</span><span>{T.nom}</span></div>
      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 3, lineHeight: 1.35 }}>{texte}</div>
    </div>
  )
}

const MiniChamp = ({ titre, valeur }) => (
  <div>
    <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{titre}</div>
    <div style={{ border: `1px solid ${TRAIT}`, borderRadius: 8, padding: '6px 9px', fontSize: 13, color: '#334155' }}>{valeur}</div>
  </div>
)

function MaquetteListe({ moi }) {
  const Ligne = ({ titre, pret, info, delai }) => (
    <div className="tu-ligne" style={{ animationDelay: `${delai}s`, display: 'block', padding: '7px 10px', background: '#fff', borderRadius: 10, marginBottom: 4 }}>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{titre}</div>
      <div style={{ fontSize: 11, color: DOUX, marginTop: 2, display: 'flex', gap: 6, alignItems: 'center' }}>
        <Pastille couleur={pret ? '#16a34a' : '#94a3b8'}>{pret ? 'Prêt' : 'Brouillon'}</Pastille>{info}
      </div>
    </div>
  )
  const Groupe = ({ nom, nb, delai }) => (
    <div className="tu-ligne" style={{ animationDelay: `${delai}s`, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 4px 6px', fontSize: 12, fontWeight: 800 }}>
      <Avatar nom={nom} taille={22} />{nom}<span style={{ color: '#94a3b8', fontWeight: 600 }}>{nb}</span>
    </div>
  )
  return (
    <div style={{ width: 250, background: '#eef0f6', borderRadius: 14, padding: '6px 10px 10px', border: `1px solid ${TRAIT}` }}>
      <Groupe nom={moi} nb="· mes simulations" delai={0.05} />
      <Ligne titre="Ma première simulation" info="3 cases" delai={0.15} />
      <Groupe nom="Thomas" nb="2" delai={0.3} />
      <Ligne titre="Accueille-moi si tu peux" pret info="24 cases" delai={0.4} />
      <Ligne titre="Le client pressé" info="8 cases" delai={0.5} />
    </div>
  )
}

const CSS = `
@keyframes tuFondu { from { opacity: 0 } to { opacity: 1 } }
@keyframes tuEntree { from { opacity: 0; transform: translateY(18px) scale(.97) } to { opacity: 1; transform: none } }
@keyframes tuDeDroite { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: none } }
@keyframes tuDeGauche { from { opacity: 0; transform: translateX(-40px) } to { opacity: 1; transform: none } }
@keyframes tuMonte { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@keyframes tuPret { 0%, 45% { background: transparent; color: ${NAVY} } 55%, 100% { background: #16a34a; color: #fff } }
.tu-page.tu-droite { animation: tuDeDroite .35s cubic-bezier(.2,.8,.2,1) both }
.tu-page.tu-gauche { animation: tuDeGauche .35s cubic-bezier(.2,.8,.2,1) both }
.tu-ligne { display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 9px; font-size: 14px; font-weight: 600; color: ${NAVY}; animation: tuMonte .35s ease both }
.tu-case { animation: tuMonte .4s ease both }
.tu-pret { animation: tuPret 2.4s ease infinite alternate }
.tu-btn { border: 1px solid ${TRAIT}; background: #fff; color: ${NAVY}; border-radius: 11px; padding: 10px 18px; font-size: 15px; font-weight: 700; cursor: pointer; font-family: inherit; white-space: nowrap }
.tu-btn:hover { background: #f1f3f8 }
.tu-plein { background: ${NAVY}; color: #fff; border-color: ${NAVY} }
.tu-plein:hover { background: #0b2148 }
.tu-point { height: 8px; border-radius: 4px; border: none; padding: 0; cursor: pointer; transition: width .25s ease, background .25s ease }
.tu-passer { border: none; background: none; color: ${DOUX}; font-size: 13px; font-weight: 700; cursor: pointer; font-family: inherit; letter-spacing: 0; text-transform: none; padding: 4px 6px; border-radius: 7px }
.tu-passer:hover { background: #f1f3f8; color: ${NAVY} }
@media (max-width: 720px) { .tu-page { grid-template-columns: 1fr !important; padding: 14px 18px 6px !important } }
@media (prefers-reduced-motion: reduce) { .tu-page, .tu-ligne, .tu-case, .tu-pret { animation: none !important } }
`
