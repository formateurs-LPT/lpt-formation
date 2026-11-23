'use client'
// Atelier Lipto — panneau de droite : on remplit la case sélectionnée.
import { useEffect, useState } from 'react'
import Lipto from '@/components/lipto/Lipto'
import { THEMES_TEL } from '@/lib/themeTelephone'
import { LIPTO_POSES } from '@/lib/lipto'
import { TYPES_CASE, FONDS, POSES, NOMS_POSES, problemesCase, documentVide, TESTS_DE_VUE } from '@/lib/atelierSimulation'

const NAVY = '#03112a', BLEU = '#00abe9', TRAIT = '#e3e6ee', DOUX = '#64748b'
const LETTRES = 'ABCDEF'

export default function AtelierPanneau({ cas: c, apresChoix, onMaj, onSupprimer, onTester, onFermer }) {
  if (!c) return <Aide />
  const T = TYPES_CASE[c.type]
  const problemes = problemesCase(c, apresChoix)
  return (
    <aside style={{ width: 380, flexShrink: 0, borderLeft: `1px solid ${TRAIT}`, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{CSS}</style>
      <div style={{ padding: '14px 18px', borderBottom: `1px solid ${TRAIT}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: T.couleur + '1a', display: 'grid', placeItems: 'center', fontSize: 17 }}>{T.emoji}</span>
        <div style={{ flex: 1, fontWeight: 800, fontSize: 16 }}>{T.nom}</div>
        <button onClick={onFermer} className="ap-x" aria-label="Fermer">×</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {problemes.length > 0 && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 10, padding: '8px 12px', fontSize: 13 }}>⚠ {problemes.join(' · ')}</div>
        )}

        {c.type === 'depart' && (
          <Champ titre="Nom du scénario" aide="Ce que le formateur voit quand il choisit le scénario.">
            <input className="ap-champ" value={c.nom} onChange={e => onMaj({ nom: e.target.value })} />
          </Champ>
        )}

        {(c.type === 'lipto' || c.type === 'question') && (
          <>
            <Champ titre="Ce que dit Lipto" aide={apresChoix
              ? 'Cette case suit un choix du formateur : laissée vide, Lipto dit la réplique choisie.'
              : c.type === 'question' ? 'Facultatif : la phrase du client avant la question.' : null}>
              <textarea className="ap-champ" rows={3} value={c.bulle} placeholder="Bonjour, je regarde juste, merci." onChange={e => onMaj({ bulle: e.target.value })} />
            </Champ>
            <Champ titre="Attitude de Lipto"><ChoixPose valeur={c.pose} onChoix={pose => onMaj({ pose })} /></Champ>
            <Champ titre="Décor"><ChoixFond valeur={c.fond} onChoix={fond => onMaj({ fond })} /></Champ>
            <Document doc={c.document} onMaj={document => onMaj({ document })} />
          </>
        )}

        {c.type === 'question' && <Question c={c} onMaj={onMaj} />}

        {c.type === 'choix' && (
          <Champ titre="Répliques possibles de Lipto" aide="Après la correction, le formateur choisit ce que Lipto répond. Chaque réplique mène à sa propre suite.">
            {c.repliques.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                <textarea className="ap-champ" rows={2} value={r.texte} placeholder={`Réplique ${i + 1}`}
                  onChange={e => onMaj({ repliques: c.repliques.map((x, j) => j === i ? { texte: e.target.value } : x) })} />
                {c.repliques.length > 1 && <button className="ap-x" title="Retirer" onClick={() => onMaj({ repliques: c.repliques.filter((_, j) => j !== i), suites: c.suites.filter((_, j) => j !== i) })}>×</button>}
              </div>
            ))}
            {c.repliques.length < 4 && <button className="ap-ajout" onClick={() => onMaj({ repliques: [...c.repliques, { texte: '' }], suites: [...c.suites, null] })}>+ Ajouter une réplique</button>}
          </Champ>
        )}

        {c.type === 'examen' && (
          <>
            <p style={{ fontSize: 14, color: DOUX, lineHeight: 1.5, margin: 0 }}>Le décor passe en salle d’examen et une barre « Examen de vue en cours… » s’affiche, puis Lipto revient.</p>
            <Champ titre="Durée de l’animation">
              <div style={{ display: 'flex', gap: 6 }}>
                {[3, 4, 6, 8].map(s => <button key={s} className={'ap-puce' + (c.duree === s ? ' ap-actif' : '')} onClick={() => onMaj({ duree: s })}>{s} s</button>)}
              </div>
            </Champ>
          </>
        )}

        {c.type === 'fin' && (
          <Champ titre="Message de fin" aide="Facultatif.">
            <textarea className="ap-champ" rows={3} value={c.message} placeholder="Bravo, Lipto repart avec ses lunettes !" onChange={e => onMaj({ message: e.target.value })} />
          </Champ>
        )}
      </div>
      <div style={{ padding: '12px 18px', borderTop: `1px solid ${TRAIT}`, display: 'flex', gap: 8 }}>
        <button onClick={onTester} style={{ ...bouton, flex: 1, background: NAVY, color: '#fff', borderColor: NAVY }}>▶ Tester à partir d’ici</button>
        <button onClick={() => { if (window.confirm('Supprimer cette case ? Les flèches qui y mènent seront retirées.')) onSupprimer() }} style={{ ...bouton, color: '#dc2626' }}>Supprimer</button>
      </div>
    </aside>
  )
}

function Question({ c, onMaj }) {
  const majOption = (i, patch) => onMaj({ options: c.options.map((o, j) => j === i ? { ...o, ...patch } : o) })
  return (
    <>
      <div style={{ height: 1, background: TRAIT }} />
      <Champ titre="Type de question">
        <div style={{ display: 'flex', gap: 6 }}>
          {[['qcm', 'Choix multiple'], ['texte', 'Texte à compléter']].map(([v, l]) => <button key={v} className={'ap-puce' + (c.mode === v ? ' ap-actif' : '')} onClick={() => onMaj({ mode: v })}>{l}</button>)}
        </div>
      </Champ>
      <Champ titre="Question posée aux collaborateurs">
        <textarea className="ap-champ" rows={2} value={c.question} placeholder="Que lui répondez-vous ?" onChange={e => onMaj({ question: e.target.value })} />
      </Champ>
      {c.mode === 'qcm' ? (
        <Champ titre="Réponses" aide="Coche la ou les bonnes réponses.">
          {c.options.map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
              <button onClick={() => majOption(i, { juste: !o.juste })} title={o.juste ? 'Bonne réponse' : 'Marquer comme bonne réponse'}
                style={{ width: 32, height: 32, flexShrink: 0, borderRadius: 8, border: `1.5px solid ${o.juste ? '#16a34a' : TRAIT}`, background: o.juste ? '#16a34a' : '#fff', color: o.juste ? '#fff' : DOUX, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
                {o.juste ? '✓' : LETTRES[i]}
              </button>
              <input className="ap-champ" value={o.texte} placeholder={`Réponse ${LETTRES[i]}`} onChange={e => majOption(i, { texte: e.target.value })} />
              {c.options.length > 2 && <button className="ap-x" title="Retirer" onClick={() => onMaj({ options: c.options.filter((_, j) => j !== i) })}>×</button>}
            </div>
          ))}
          {c.options.length < 6 && <button className="ap-ajout" onClick={() => onMaj({ options: [...c.options, { texte: '', juste: false }] })}>+ Ajouter une réponse</button>}
        </Champ>
      ) : (
        <>
          <Champ titre="Réponse attendue" aide="Affichée à la correction.">
            <textarea className="ap-champ" rows={2} value={c.reponseAttendue} onChange={e => onMaj({ reponseAttendue: e.target.value })} />
          </Champ>
          <Champ titre="Mots obligatoires" aide="Séparés par des virgules. Une réponse qui les contient tous est validée automatiquement ; sinon le formateur valide.">
            <input className="ap-champ" value={c.motsAttendus} placeholder="10 minutes, avec ou sans, ordonnance" onChange={e => onMaj({ motsAttendus: e.target.value })} />
          </Champ>
        </>
      )}
      <Champ titre="Temps pour répondre">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[30, 45, 60, 90, 120].map(s => <button key={s} className={'ap-puce' + (c.temps === s ? ' ap-actif' : '')} onClick={() => onMaj({ temps: s })}>{{ 30: '30 s', 45: '45 s', 60: '1 min', 90: '1 min 30', 120: '2 min' }[s]}</button>)}
        </div>
      </Champ>
      <div style={{ height: 1, background: TRAIT }} />
      <div style={{ fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800, color: '#16a34a' }}>À la correction</div>
      <Champ titre="Lipto réagit" aide="Facultatif : sa phrase quand la bonne réponse s’affiche.">
        <input className="ap-champ" value={c.repliqueCorrection} placeholder="Hmm… votre concept ? C’est-à-dire ?" onChange={e => onMaj({ repliqueCorrection: e.target.value })} />
      </Champ>
      <Champ titre="Attitude à la correction"><ChoixPose valeur={c.poseCorrection} onChoix={poseCorrection => onMaj({ poseCorrection })} /></Champ>
      <Champ titre="Décor à la correction" aide="Facultatif : par exemple la salle d’examen quand on y emmène Lipto.">
        <ChoixFond valeur={c.fondCorrection} onChoix={fondCorrection => onMaj({ fondCorrection: fondCorrection === c.fondCorrection ? '' : fondCorrection })} />
      </Champ>
      <Champ titre="Explication pour le formateur" aide="Pourquoi chaque réponse est bonne ou mauvaise. Visible à la correction.">
        <textarea className="ap-champ" rows={4} value={c.explication} onChange={e => onMaj({ explication: e.target.value })} />
      </Champ>
    </>
  )
}

function Document({ doc, onMaj }) {
  const genre = doc?.genre || null
  const champ = (oeil, cle, largeur = 60) => (
    <input className="ap-champ ap-mini" style={{ width: largeur }} value={doc[oeil][cle] || ''} onChange={e => onMaj({ ...doc, [oeil]: { ...doc[oeil], [cle]: e.target.value } })} />
  )
  const cles = ['sph', 'cyl', 'axe', 'add']
  return (
    <Champ titre="Document montré par Lipto">
      <div style={{ display: 'flex', gap: 6 }}>
        {[[null, 'Aucun'], ['ordonnance', '📄 Ordonnance'], ['ticket', '🧾 Ticket d’examen']].map(([g, l]) => (
          <button key={l} className={'ap-puce' + (genre === g ? ' ap-actif' : '')} onClick={() => onMaj(g ? (genre === g ? doc : { genre: g, ...documentVide(g) }) : null)}>{l}</button>
        ))}
      </div>
      {genre === 'ticket' && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: DOUX, marginBottom: 6 }}>Tests de vue prêts à l’emploi</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TESTS_DE_VUE.map(t => (
              <button key={t.id} className="ap-test" onClick={() => onMaj({ genre: 'ticket', ...JSON.parse(JSON.stringify(t.ticket)) })}>
                <span>🧾 {t.nom}</span><span style={{ fontSize: 11, color: DOUX, fontWeight: 600 }}>{t.info}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {genre && (
        <div style={{ marginTop: 10, background: '#f8f9fc', border: `1px solid ${TRAIT}`, borderRadius: 10, padding: 10 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <label style={{ fontSize: 12, color: DOUX, flex: 1 }}>Date<input className="ap-champ ap-mini" value={doc.date} placeholder="03/11/2026" onChange={e => onMaj({ ...doc, date: e.target.value })} /></label>
            {genre === 'ticket' && <label style={{ fontSize: 12, color: DOUX, width: 70 }}>PD<input className="ap-champ ap-mini" value={doc.pd || ''} onChange={e => onMaj({ ...doc, pd: e.target.value })} /></label>}
            {genre === 'ticket' && <label style={{ fontSize: 12, color: DOUX, width: 70 }} title="Écart de près">NPD<input className="ap-champ ap-mini" value={doc.npd || ''} onChange={e => onMaj({ ...doc, npd: e.target.value })} /></label>}
          </div>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead><tr><th />{cles.map(k => <th key={k} style={{ fontSize: 11, color: DOUX, fontWeight: 700, textAlign: 'left', paddingBottom: 4 }}>{{ sph: 'Sphère', cyl: 'Cylindre', axe: 'Axe', add: 'Add.' }[k]}</th>)}</tr></thead>
            <tbody>
              {['od', 'og'].map(o => (
                <tr key={o}><td style={{ fontWeight: 800, fontSize: 13, color: '#0089ba', paddingRight: 6 }}>{o.toUpperCase()}</td>{cles.map(k => <td key={k} style={{ paddingRight: 4, paddingBottom: 4 }}>{champ(o, k, '100%')}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Document fictif : aucun vrai nom ni vraie donnée.</div>
        </div>
      )}
    </Champ>
  )
}

function ChoixPose({ valeur, onChoix }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
      {POSES.map(p => (
        <button key={p} onClick={() => onChoix(p)} className={'ap-tuile' + (valeur === p ? ' ap-actif' : '')} title={NOMS_POSES[p]}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LIPTO_POSES[p].src} alt="" style={{ height: 46, objectFit: 'contain' }} />
          <span style={{ fontSize: 10, color: DOUX }}>{NOMS_POSES[p]}</span>
        </button>
      ))}
    </div>
  )
}

function ChoixFond({ valeur, onChoix }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {FONDS.map(f => (
        <button key={f.src} onClick={() => onChoix(f.src)} className={'ap-tuile ap-fond' + (valeur === f.src ? ' ap-actif' : '')}
          style={{ backgroundImage: `linear-gradient(transparent 50%, rgba(3,17,42,0.7)), url(${f.src})` }}>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 700 }}>{f.nom}</span>
        </button>
      ))}
    </div>
  )
}

function Champ({ titre, aide, children }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 800, marginBottom: aide ? 2 : 7 }}>{titre}</div>
      {aide && <div style={{ fontSize: 12, color: DOUX, marginBottom: 7, lineHeight: 1.4 }}>{aide}</div>}
      {children}
    </div>
  )
}

// Notice repliable (23/11) : une flèche la réduit en fine colonne pour
// laisser plus de place au plan de travail. Choix retenu dans ce navigateur.
const CLE_AIDE = 'atelier_lipto_aide_repliee'
function Aide() {
  const [repliee, setRepliee] = useState(false)
  useEffect(() => { try { setRepliee(localStorage.getItem(CLE_AIDE) === '1') } catch {} }, [])
  const basculer = v => { setRepliee(v); try { localStorage.setItem(CLE_AIDE, v ? '1' : '0') } catch {} }
  if (repliee) {
    return (
      <aside style={{ width: 44, flexShrink: 0, borderLeft: `1px solid ${TRAIT}`, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 14 }}>
        <style>{CSS}</style>
        <button onClick={() => basculer(false)} className="ap-fleche" title="Afficher la notice" aria-label="Afficher la notice">‹</button>
        <button onClick={() => basculer(false)} style={{ marginTop: 14, border: 'none', background: 'none', cursor: 'pointer', writingMode: 'vertical-rl', fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: DOUX, fontFamily: 'inherit', padding: 0 }}>Comment ça marche ?</button>
      </aside>
    )
  }
  const etape = (n, t, d) => (
    <div style={{ display: 'flex', gap: 12 }}>
      <span style={{ width: 26, height: 26, borderRadius: 13, background: NAVY, color: '#fff', fontSize: 13, fontWeight: 800, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{n}</span>
      <div><div style={{ fontWeight: 800, fontSize: 14 }}>{t}</div><div style={{ fontSize: 13, color: DOUX, lineHeight: 1.45, marginTop: 2 }}>{d}</div></div>
    </div>
  )
  return (
    <aside style={{ width: 380, flexShrink: 0, borderLeft: `1px solid ${TRAIT}`, background: '#fff', padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto' }}>
      <style>{CSS}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Lipto pose="conseil" taille={70} t={THEMES_TEL.clair} />
        <div style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>Comment ça marche ?</div>
        <button onClick={() => basculer(true)} className="ap-fleche" title="Réduire la notice" aria-label="Réduire la notice">›</button>
      </div>
      {etape(1, 'Pars d’un départ 🚩', 'Chaque départ est un scénario que le formateur pourra lancer en formation.')}
      {etape(2, 'Clique sur « + Ajouter la suite »', 'Choisis ce qui se passe ensuite : Lipto parle, une question, le choix du formateur, l’examen de vue ou la fin. L’arbre se range tout seul.')}
      {etape(3, 'Clique sur une case pour la remplir', 'Ses réglages s’ouvrent ici : phrase de Lipto, décor, réponses, document…')}
      {etape(4, 'Deux chemins, une même suite ?', 'Dans le menu « + », choisis « Relier à une case existante » puis clique sur la case.')}
      {etape(5, 'Teste avec ▶', 'Joue la simulation comme sur le diffuseur, avant de la passer en « Prêt ».')}
      <div style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {Object.entries(TYPES_CASE).map(([k, t]) => (
          <span key={k} style={{ fontSize: 12, fontWeight: 700, color: t.couleur, background: t.couleur + '14', borderRadius: 999, padding: '4px 10px' }}>{t.emoji} {t.nom}</span>
        ))}
      </div>
    </aside>
  )
}

const bouton = { border: `1px solid ${TRAIT}`, background: '#fff', color: NAVY, borderRadius: 10, padding: '9px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }

const CSS = `
.ap-champ { width: 100%; border: 1px solid ${TRAIT}; border-radius: 9px; padding: 8px 10px; font-size: 14px; font-family: inherit; color: ${NAVY}; background: #fff; resize: vertical; line-height: 1.4; }
.ap-champ:focus { outline: none; border-color: ${BLEU}; box-shadow: 0 0 0 3px ${BLEU}22; }
.ap-mini { padding: 5px 7px; font-size: 13px; margin-top: 2px; font-variant-numeric: tabular-nums; }
.ap-fleche { width: 30px; height: 30px; flex-shrink: 0; border: 1px solid ${TRAIT}; background: #fff; border-radius: 8px; font-size: 20px; line-height: 1; color: ${DOUX}; cursor: pointer; font-family: inherit; display: grid; place-items: center; padding-bottom: 2px; }
.ap-fleche:hover { background: #f1f3f8; color: ${NAVY}; }
.ap-test { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; border: 1px solid ${TRAIT}; background: #fff; border-radius: 10px; padding: 7px 11px; font-size: 13px; font-weight: 700; color: ${NAVY}; cursor: pointer; font-family: inherit; }
.ap-test:hover { border-color: ${BLEU}; background: #f0fbfe; }
.ap-x { width: 30px; height: 30px; flex-shrink: 0; border: none; background: transparent; border-radius: 8px; font-size: 18px; color: #94a3b8; cursor: pointer; }
.ap-x:hover { background: #f1f3f8; color: ${NAVY}; }
.ap-ajout { border: 1.5px dashed #cbd5e1; background: #fafbfd; border-radius: 9px; padding: 7px 12px; width: 100%; font-size: 13px; font-weight: 700; color: ${DOUX}; cursor: pointer; font-family: inherit; }
.ap-ajout:hover { border-color: ${BLEU}; color: ${BLEU}; }
.ap-puce { border: 1px solid ${TRAIT}; background: #fff; border-radius: 999px; padding: 6px 12px; font-size: 13px; font-weight: 700; color: ${NAVY}; cursor: pointer; font-family: inherit; white-space: nowrap; }
.ap-puce.ap-actif { background: ${NAVY}; color: #fff; border-color: ${NAVY}; }
.ap-tuile { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 2px; border: 1.5px solid ${TRAIT}; background: #fafbfd; border-radius: 10px; padding: 6px 2px 4px; cursor: pointer; font-family: inherit; }
.ap-tuile.ap-actif { border-color: ${BLEU}; background: #f0fbfe; box-shadow: 0 0 0 3px ${BLEU}22; }
.ap-fond { height: 62px; background-size: cover; background-position: center; justify-content: flex-end; }
.ap-fond.ap-actif { border-width: 2.5px; }
`
