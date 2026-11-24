'use client'
// Atelier Lipto — aperçu jouable : la simulation telle que le diffuseur la
// montrera, avec les boutons du formateur en dessous. Rien n'est envoyé aux
// téléphones : c'est un test.
import { useEffect, useState } from 'react'
import Lipto from '@/components/lipto/Lipto'
import { THEMES_TEL } from '@/lib/themeTelephone'
import { TYPES_CASE, reglage, nombreFr, qcmMultiple, PD_LIPTO } from '@/lib/atelierSimulation'
import { BackendMini, FrontoMini } from './DocumentsSav'

const NAVY = '#03112a', OR = '#c9a227', VERT = '#4ade80'
const LETTRES = 'ABCDEF'
const SALLE = '/assets/magasins/salle-examen.webp'
// Espaces insécables avant « ? ! : ; » : jamais un « ? » seul à la ligne
const fr = t => (t || '').replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0')

export default function AtelierApercu({ projet, depart, onFermer, onEditer }) {
  const { cases } = projet
  const departs = Object.values(cases).filter(c => c.type === 'depart')
  const [etat, setEtat] = useState({ id: null, etape: 'scene', manque: null })
  const [historique, setHistorique] = useState([])

  // replique : la réplique choisie par le formateur, que Lipto dit à l'écran
  const aller = (id, depuis, garder = true, replique = null) => {
    const c = cases[id]
    if (garder && etat.id) setHistorique(h => [...h, etat])
    if (!c) return setEtat({ id: null, etape: 'scene', manque: depuis, replique })
    if (c.type === 'depart') return aller(c.suites[0], c.id, false)
    setEtat({ id, etape: 'scene', manque: null, replique })
  }

  useEffect(() => {
    if (depart) aller(depart, null, false)
    else if (departs.length === 1) aller(departs[0].id, null, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const touche = e => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [onFermer])

  const c = etat.id ? cases[etat.id] : null
  const correction = etat.etape === 'correction'
  const retour = () => { const h = [...historique]; const p = h.pop(); setHistorique(h); if (p) setEtat(p) }
  const recommencer = () => { setHistorique([]); setEtat({ id: null, etape: 'scene', manque: null }); if (departs.length === 1) aller(departs[0].id, null, false) }

  let contenu, actions
  // Le formateur a choisi une réplique : Lipto la dit sur le diffuseur. Si la
  // case suivante a déjà sa phrase (ou est une question sans phrase, qui la
  // reprend), rien à ajouter ; sinon une scène « Lipto parle » s'intercale.
  const reprendReplique = c && (c.type === 'lipto' || c.type === 'question')
  if (etat.replique && !etat.repliqueVue && !reprendReplique) {
    const r = etat.replique
    contenu = <Scene c={{ type: 'lipto', bulle: r.texte, pose: 'reflexion', fond: r.fond }} correction={false} key={'replique' + historique.length} />
    actions = <Bouton plein onClick={() => setEtat({ ...etat, repliqueVue: true })}>Scène suivante →</Bouton>
  } else if (!c && !etat.manque) {
    contenu = <ChoixScenario departs={departs} onChoix={d => aller(d.id, null, false)} />
    actions = null
  } else if (!c) {
    const source = cases[etat.manque]
    contenu = (
      <Ecran fond="/assets/magasins/magasin-tables.webp">
        <Centre>
          <Lipto pose="reflexion" taille={180} t={THEMES_TEL.clair} />
          <div style={{ fontSize: '2.6cqw', fontWeight: 800, marginTop: '1.5cqw' }}>La suite n’est pas encore écrite</div>
          <div style={{ fontSize: '1.5cqw', opacity: 0.8, marginTop: 6 }}>Ajoute une case après « {source ? TYPES_CASE[source.type].nom : 'cette case'} » dans l’éditeur.</div>
        </Centre>
      </Ecran>
    )
    actions = <>{source && <Bouton plein onClick={() => onEditer(source.id)}>Aller à cette case dans l’éditeur</Bouton>}<Bouton onClick={recommencer}>↺ Recommencer</Bouton></>
  } else if (c.type === 'fin') {
    contenu = (
      <Ecran fond="/assets/magasins/magasin-10-minutes.webp">
        <Centre>
          <Lipto pose="bravo" anim="celebration" confettis taille={200} t={THEMES_TEL.clair} />
          <div style={{ fontSize: '3cqw', fontWeight: 800, marginTop: '1.5cqw' }}>🏁 Fin de la simulation</div>
          {c.message && <div style={{ fontSize: '1.7cqw', opacity: 0.85, marginTop: 8 }}>{c.message}</div>}
        </Centre>
      </Ecran>
    )
    actions = <Bouton plein onClick={recommencer}>↺ Recommencer</Bouton>
  } else if (c.type === 'examen') {
    contenu = <Examen key={etat.id + historique.length} duree={c.duree} />
    actions = <Bouton plein onClick={() => aller(c.suites[0], c.id)}>Lipto revient →</Bouton>
  } else if (c.type === 'choix') {
    const precedente = historique.length ? cases[historique[historique.length - 1].id] : null
    contenu = (
      <Ecran fond={precedente?.fondCorrection || precedente?.fond || '/assets/magasins/magasin-comptoir.webp'}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,17,42,0.72)' }} />
        <div style={{ position: 'absolute', inset: '7cqw 8cqw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '1.2cqw', letterSpacing: 4, textTransform: 'uppercase', color: OR, fontWeight: 800 }}>Écran formateur · choix</div>
          <div style={{ fontSize: '3cqw', fontWeight: 800, margin: '0.6cqw 0 2cqw' }}>Que répond Lipto ?</div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(c.repliques.length, 2)}, 1fr)`, gap: '1.4cqw' }}>
            {c.repliques.map((r, i) => (
              <button key={i} onClick={() => aller(c.suites[i], c.id, true, { texte: r.texte, fond: precedente?.fondCorrection || precedente?.fond || '/assets/magasins/magasin-comptoir.webp' })} className="aa-replique">
                <span style={{ fontSize: '1.1cqw', letterSpacing: 2, textTransform: 'uppercase', color: OR, fontWeight: 800 }}>Réplique {i + 1}</span>
                <span style={{ fontSize: '1.9cqw', fontWeight: 700, lineHeight: 1.3 }}>{fr(`« ${r.texte || '…'} »`)}</span>
              </button>
            ))}
          </div>
        </div>
      </Ecran>
    )
    actions = <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>Clique sur une réplique : Lipto la dira à la scène suivante.</span>
  } else {
    // On répond soi-même pendant le test (comme un collaborateur sur son téléphone)
    const reponse = etat.reponse || null
    const repondu = aRepondu(c, reponse)
    const cAffichee = etat.replique && !c.bulle?.trim() ? { ...c, bulle: etat.replique.texte } : c
    contenu = <Scene c={cAffichee} correction={correction} reponse={reponse} onReponse={rep => setEtat(e => ({ ...e, reponse: rep }))} key={etat.id + etat.etape} />
    actions = c.type === 'question' && !correction
      ? <>
          <Bouton onClick={() => setEtat({ ...etat, reponse: null, etape: 'correction' })}>Voir la correction sans répondre</Bouton>
          <Bouton plein desactive={!repondu} onClick={() => setEtat({ ...etat, etape: 'correction' })}>Valider ma réponse</Bouton>
        </>
      : <Bouton plein onClick={() => aller(c.suites[0], c.id)}>Scène suivante →</Bouton>
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(3,17,42,0.94)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
      <style>{CSS}</style>
      <div style={{ width: 'min(1180px, 94vw, calc((100vh - 150px) * 16 / 9))', display: 'flex', alignItems: 'center', color: '#fff', gap: 12 }}>
        <span style={{ fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: OR, fontWeight: 800 }}>Test · {projet.titre}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>Aperçu du diffuseur · rien n’est envoyé aux téléphones</span>
        <button onClick={onFermer} style={{ ...styleBouton, background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none' }}>Fermer ✕</button>
      </div>
      <div className="aa-cadre">{contenu}</div>
      <div style={{ width: 'min(1180px, 94vw, calc((100vh - 150px) * 16 / 9))', display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
        <Bouton onClick={retour} desactive={!historique.length}>← Retour</Bouton>
        <span style={{ flex: 1 }} />
        {actions}
      </div>
    </div>
  )
}

function Ecran({ fond, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', color: '#fff' }}>
      <div key={fond} style={{ position: 'absolute', inset: '-3%', backgroundImage: `url(${fond})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(3px) saturate(1.1)', animation: 'aaFondu .8s ease both' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(3,17,42,0.1) 0%, rgba(3,17,42,0.3) 45%, rgba(3,17,42,0.82) 70%)' }} />
      {children}
    </div>
  )
}
const Centre = ({ children }) => <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: 'rgba(3,17,42,0.45)' }}>{children}</div>

// Juste / faux / à valider par le formateur (texte sans mots obligatoires)
const sansAccents = t => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')
const variantes = a => a.split('/').map(sansAccents).filter(Boolean)
// Éléments attendus retrouvés dans les cases remplies
function elementsTrouves(c, cases) {
  const remplies = (cases || []).filter(x => x?.trim()).map(sansAccents)
  return reglage(c, 'attendus').filter(a => a.trim()).map(a => ({ texte: a, trouve: variantes(a).some(v => remplies.some(f => f.includes(v))) }))
}
const caseJuste = (c, texte) => reglage(c, 'attendus').some(a => a.trim() && variantes(a).some(v => sansAccents(texte).includes(v)))
// Ordre mélangé, toujours le même pour une case donnée (et jamais déjà dans le bon ordre)
function melange(c) {
  const n = reglage(c, 'etapes').length
  let graine = [...(c.id || 'x')].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7)
  const ordre = [...Array(n).keys()]
  for (let i = n - 1; i > 0; i--) { graine = (graine * 1103515245 + 12345) >>> 0; const j = graine % (i + 1); [ordre[i], ordre[j]] = [ordre[j], ordre[i]] }
  if (n > 1 && ordre.every((x, i) => x === i)) ordre.reverse()
  return ordre
}
// QCM : la ou les réponses cochées (toujours un tableau)
const choixQcm = rep => (Array.isArray(rep?.choix) ? rep.choix : rep?.choix != null ? [rep.choix] : [])
function aRepondu(c, rep) {
  if (!rep) return false
  if (c.mode === 'qcm') return choixQcm(rep).length > 0
  if (c.mode === 'vraifaux') return rep.choix != null
  if (c.mode === 'cases') return (rep.cases || []).some(x => x?.trim())
  if (c.mode === 'ordre') return (rep.ordre || []).length === reglage(c, 'etapes').length
  if (c.mode === 'nombre') return !Number.isNaN(nombreFr(rep.nombre))
  return !!rep.texte?.trim()
}
function verdict(c, reponse) {
  if (!aRepondu(c, reponse)) return null
  if (c.mode === 'qcm') {
    const choix = choixQcm(reponse)
    return c.options.every((o, i) => !!o.juste === choix.includes(i)) ? 'juste' : 'faux'
  }
  if (c.mode === 'vraifaux') return (reponse.choix === 'vrai') === reglage(c, 'vraiFaux') ? 'juste' : 'faux'
  if (c.mode === 'cases') {
    const t = elementsTrouves(c, reponse.cases)
    if (!t.length) return 'a-valider'
    return t.filter(x => x.trouve).length >= reglage(c, 'minimum') ? 'juste' : 'a-valider'
  }
  if (c.mode === 'ordre') return reponse.ordre.every((x, i) => x === i) ? 'juste' : 'faux'
  if (c.mode === 'nombre') {
    const v = nombreFr(reglage(c, 'valeur')), tol = nombreFr(reglage(c, 'tolerance'))
    return Math.abs(nombreFr(reponse.nombre) - v) <= (Number.isNaN(tol) ? 0 : tol) ? 'juste' : 'faux'
  }
  const mots = (c.motsAttendus || '').split(',').map(sansAccents).filter(Boolean)
  if (!mots.length) return 'a-valider'
  return mots.every(m => sansAccents(reponse.texte).includes(m)) ? 'juste' : 'a-valider'
}
const VERDICTS = {
  juste: { texte: '✓ Bonne réponse !', fond: 'rgba(74,222,128,0.22)', bord: VERT },
  faux: { texte: '✗ Ce n’est pas la bonne réponse', fond: 'rgba(248,113,113,0.2)', bord: '#f87171' },
  'a-valider': { texte: '✍️ Le formateur valide cette réponse', fond: 'rgba(201,162,39,0.2)', bord: OR },
}

function Scene({ c, correction, reponse, onReponse }) {
  const v = correction ? verdict(c, reponse) : null
  const question = c.type === 'question'
  const fond = (correction && c.fondCorrection) || c.fond
  const pose = correction ? (c.poseCorrection || 'pouce') : c.pose
  const bulle = correction && c.repliqueCorrection ? c.repliqueCorrection : c.bulle
  const docs = [c.document, c.document2].filter(Boolean)
  const doc = docs.length > 0
  // Fronto seul pendant une question : il est haut, Lipto se met à sa droite
  const apresFronto = question && docs.length === 1 && docs[0].genre === 'fronto'
  return (
    <Ecran fond={fond}>
      <div style={{ position: 'absolute', top: '3cqw', left: '3.5cqw', fontSize: '1.1cqw', letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
        Simulation <span style={{ color: OR }}>· {question ? (correction ? 'Correction' : 'Que répondez-vous ?') : 'Lipto parle'}</span>
      </div>
      {doc && (
        <div style={{ position: 'absolute', left: '3cqw', top: '6cqw', display: 'flex', alignItems: 'flex-start', gap: '1.6cqw', animation: 'aaDoc .7s cubic-bezier(.2,.9,.3,1.2) both' }}>
          {docs.map((x, i) => <div key={i} style={{ width: largeurDoc(x, question, docs.length) }}><DocumentMini d={x} /></div>)}
        </div>
      )}
      <div style={{ position: 'absolute', ...(doc && !question ? { right: '3cqw' } : { left: apresFronto ? '28.5cqw' : '4cqw' }), bottom: '3cqw', display: 'flex', alignItems: 'flex-end', gap: '1cqw', zIndex: 1 }}>
        <div style={{ animation: correction ? 'none' : 'aaEntree 1s cubic-bezier(.25,.8,.3,1) both' }}>
          <LiptoTaille pose={pose} correction={correction} petit={doc} mini={docs.length > 1 || apresFronto} />
        </div>
        {bulle && (
          <div style={{ marginBottom: doc ? '9cqw' : '18cqw', background: '#fff', color: NAVY, borderRadius: '1.6cqw', padding: '1.3cqw 1.7cqw', maxWidth: doc ? '20cqw' : '26cqw', boxShadow: '0 10px 30px rgba(0,0,0,0.25)', animation: `aaBulle .4s cubic-bezier(.2,.9,.3,1.3) ${correction ? 0.1 : 0.8}s both`, position: 'relative' }}>
            <div style={{ fontSize: '0.9cqw', letterSpacing: 2, textTransform: 'uppercase', color: '#7c5cff', fontWeight: 800 }}>Lipto · le client</div>
            <div style={{ fontSize: doc ? '1.6cqw' : '1.9cqw', fontWeight: 700, lineHeight: 1.25, marginTop: 4 }}>{fr(`« ${bulle} »`)}</div>
            <div style={{ position: 'absolute', left: '2.4cqw', bottom: '-1cqw', borderLeft: '1cqw solid transparent', borderRight: '1cqw solid transparent', borderTop: '1.2cqw solid #fff' }} />
          </div>
        )}
      </div>
      {question && (
        <div className="aa-panneau" style={{ position: 'absolute', right: '3cqw', top: '6cqw', bottom: '3cqw', width: '31cqw', display: 'flex', flexDirection: 'column', gap: '0.9cqw', overflowY: 'auto' }}>
          <div style={{ flex: '1 0 0' }} />
          {v && (
            <div style={{ fontSize: '1.5cqw', fontWeight: 800, padding: '0.7cqw 1.1cqw', borderRadius: '0.9cqw', background: VERDICTS[v].fond, border: `1.5px solid ${VERDICTS[v].bord}`, animation: 'aaBulle .35s cubic-bezier(.2,.9,.3,1.3) both' }}>{VERDICTS[v].texte}</div>
          )}
          <div style={{ fontSize: '1.9cqw', fontWeight: 800, lineHeight: 1.25, marginBottom: '0.6cqw' }}>{fr(c.question) || 'Question à écrire'}</div>
          <Reponses c={c} reponse={reponse} onReponse={onReponse} correction={correction} />
          {correction && c.explication && (
            <div style={{ fontSize: '1.1cqw', lineHeight: 1.45, opacity: 0.85, whiteSpace: 'pre-line', marginTop: '0.4cqw', background: 'rgba(3,17,42,0.5)', borderRadius: '0.8cqw', padding: '0.8cqw 1cqw' }}>
              <b style={{ color: OR }}>Écran formateur · </b>{c.explication}
            </div>
          )}
          {!correction && <div style={{ fontSize: '1.1cqw', opacity: 0.6, marginTop: '0.4cqw' }}>⏱ {c.temps < 60 ? `${c.temps} s` : `${Math.floor(c.temps / 60)} min${c.temps % 60 ? ' 30' : ''}`} pour répondre</div>}
          <div style={{ flex: '1 0 0' }} />
        </div>
      )}
    </Ecran>
  )
}

// ── Réponses, selon le type de question ──
const carte = { padding: '1cqw 1.3cqw', borderRadius: '1cqw', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.18)' }
const surtitre = couleur => ({ fontSize: '1cqw', letterSpacing: 2, textTransform: 'uppercase', color: couleur, fontWeight: 800 })

function Option({ i, lettre, texte, choisie, juste, correction, onClick }) {
  const bon = correction && juste, rate = correction && choisie && !juste, eteint = correction && !juste && !choisie
  const bord = bon ? VERT : rate ? '#f87171' : choisie ? OR : 'rgba(255,255,255,0.18)'
  return (
    <button type="button" disabled={correction} onClick={onClick} className={correction ? '' : 'aa-option'}
      style={{ display: 'flex', alignItems: 'center', gap: '1cqw', padding: '0.9cqw 1.1cqw', borderRadius: '1cqw', background: bon ? 'rgba(74,222,128,0.22)' : rate ? 'rgba(248,113,113,0.2)' : choisie ? 'rgba(201,162,39,0.22)' : 'rgba(255,255,255,0.1)', border: `1.5px solid ${bord}`, opacity: eteint ? 0.4 : 1, animation: `aaOption .4s ease ${correction ? 0 : 0.3 + i * 0.08}s both`, transition: 'opacity .3s, background .15s', color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: correction ? 'default' : 'pointer', width: '100%' }}>
      <span style={{ width: '2.4cqw', height: '2.4cqw', borderRadius: '0.7cqw', background: bon ? VERT : rate ? '#f87171' : choisie ? OR : 'rgba(255,255,255,0.16)', color: bon || choisie ? NAVY : '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '1.3cqw', flexShrink: 0 }}>{bon ? '✓' : rate ? '✗' : lettre}</span>
      <span style={{ fontSize: '1.45cqw', fontWeight: 600, lineHeight: 1.3, flex: 1 }}>{fr(texte) || '…'}</span>
      {correction && choisie && <span style={{ fontSize: '1cqw', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.85 }}>Ton choix</span>}
    </button>
  )
}

function Reponses({ c, reponse, onReponse, correction }) {
  if (c.mode === 'qcm') {
    // Plusieurs bonnes réponses : on peut en cocher plusieurs (un clic ajoute ou retire)
    const multiple = qcmMultiple(c), choix = choixQcm(reponse)
    const cliquer = i => onReponse({ choix: multiple ? (choix.includes(i) ? choix.filter(x => x !== i) : [...choix, i].sort()) : [i] })
    return (
      <>
        {multiple && !correction && <div style={{ fontSize: '1.1cqw', fontWeight: 700, color: OR, marginTop: '-0.3cqw' }}>☑ Plusieurs réponses possibles</div>}
        {c.options.map((o, i) => <Option key={i} i={i} lettre={LETTRES[i]} texte={o.texte} choisie={choix.includes(i)} juste={o.juste} correction={correction} onClick={() => cliquer(i)} />)}
      </>
    )
  }
  if (c.mode === 'vraifaux') {
    const bonne = reglage(c, 'vraiFaux') ? 'vrai' : 'faux'
    return [['vrai', 'Vrai'], ['faux', 'Faux']].map(([v, l], i) => <Option key={v} i={i} lettre={v === 'vrai' ? '✓' : '✗'} texte={l} choisie={reponse?.choix === v} juste={bonne === v} correction={correction} onClick={() => onReponse({ choix: v })} />)
  }
  if (c.mode === 'cases') return <ReponsesCases c={c} reponse={reponse} onReponse={onReponse} correction={correction} />
  if (c.mode === 'ordre') return <ReponsesOrdre c={c} reponse={reponse} onReponse={onReponse} correction={correction} />
  if (c.mode === 'nombre') {
    const unite = reglage(c, 'unite'), tol = nombreFr(reglage(c, 'tolerance'))
    return (
      <>
        {!correction ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1cqw' }}>
            <input className="aa-texte" inputMode="decimal" value={reponse?.nombre ?? ''} onChange={e => onReponse({ nombre: e.target.value })} placeholder="Ta réponse" style={{ fontSize: '2.2cqw', fontWeight: 800, width: '18cqw' }} />
            {unite && <span style={{ fontSize: '2.2cqw', fontWeight: 800 }}>{unite}</span>}
          </div>
        ) : (
          <>
            {reponse?.nombre && <div style={carte}><div style={surtitre(OR)}>Ta réponse</div><div style={{ fontSize: '2cqw', fontWeight: 800, marginTop: 4 }}>{reponse.nombre} {unite}</div></div>}
            <div style={{ ...carte, background: 'rgba(74,222,128,0.18)', borderColor: VERT }}>
              <div style={surtitre(VERT)}>Réponse attendue</div>
              <div style={{ fontSize: '2cqw', fontWeight: 800, marginTop: 4 }}>{reglage(c, 'valeur') || '…'} {unite}{tol > 0 ? <span style={{ fontSize: '1.3cqw', opacity: 0.8 }}> (± {reglage(c, 'tolerance')} {unite})</span> : ''}</div>
            </div>
          </>
        )}
      </>
    )
  }
  // Réponse libre
  return (
    <>
      {!correction && <textarea value={reponse?.texte || ''} onChange={e => onReponse({ texte: e.target.value })} placeholder="Écris ta réponse ici…" rows={3} className="aa-texte" />}
      {correction && reponse?.texte?.trim() && (
        <div style={carte}><div style={surtitre(OR)}>Ta réponse</div><div style={{ fontSize: '1.5cqw', fontWeight: 600, marginTop: 4, lineHeight: 1.3, whiteSpace: 'pre-line' }}>{reponse.texte}</div></div>
      )}
      {correction && (
        <div style={{ ...carte, padding: '1.4cqw', background: 'rgba(74,222,128,0.18)', borderColor: VERT }}>
          <div style={surtitre(VERT)}>Réponse attendue</div>
          <div style={{ fontSize: '1.7cqw', fontWeight: 700, marginTop: 4, lineHeight: 1.3 }}>{fr(c.reponseAttendue) || '…'}</div>
        </div>
      )}
    </>
  )
}

function ReponsesCases({ c, reponse, onReponse, correction }) {
  const nb = reglage(c, 'nbCases'), libelles = reglage(c, 'libelles')
  const cases = reponse?.cases || []
  const maj = (i, v) => { const x = [...cases]; x[i] = v; onReponse({ cases: x }) }
  const trouves = elementsTrouves(c, cases)
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: nb > 3 ? '1fr 1fr' : '1fr', gap: '0.7cqw' }}>
        {Array.from({ length: nb }).map((_, i) => {
          const texte = cases[i] || ''
          const ok = correction && texte.trim() && caseJuste(c, texte)
          return (
            <label key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.3cqw' }}>
              <span style={{ fontSize: '0.95cqw', fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.75 }}>{libelles[i] || `Réponse ${i + 1}`}</span>
              {correction
                ? <span style={{ ...carte, padding: '0.5cqw 0.8cqw', fontSize: '1.15cqw', fontWeight: 600, minHeight: '2.3cqw', borderColor: ok ? VERT : 'rgba(255,255,255,0.18)', background: ok ? 'rgba(74,222,128,0.18)' : 'rgba(255,255,255,0.08)' }}>{ok ? '✓ ' : ''}{texte || '—'}</span>
                : <input className="aa-texte" value={texte} onChange={e => maj(i, e.target.value)} style={{ fontSize: '1.25cqw', padding: '0.6cqw 0.9cqw' }} />}
            </label>
          )
        })}
      </div>
      {correction && trouves.length > 0 && (
        <div style={{ ...carte, background: 'rgba(74,222,128,0.12)', borderColor: VERT }}>
          <div style={surtitre(VERT)}>Éléments attendus · {trouves.filter(t => t.trouve).length} / {trouves.length} trouvés ({reglage(c, 'minimum')} suffisent)</div>
          <div style={{ display: 'grid', gridTemplateColumns: trouves.length > 3 ? '1fr 1fr' : '1fr', columnGap: '1cqw' }}>
            {trouves.map((t, i) => <div key={i} style={{ fontSize: '1.15cqw', fontWeight: 600, marginTop: '0.4cqw', opacity: t.trouve ? 1 : 0.65 }}>{t.trouve ? '✓' : '○'} {t.texte.split('/')[0].trim()}</div>)}
          </div>
        </div>
      )}
    </>
  )
}

function ReponsesOrdre({ c, reponse, onReponse, correction }) {
  const etapes = reglage(c, 'etapes')
  const ordre = reponse?.ordre || []
  if (correction) {
    return (
      <div style={{ ...carte, background: 'rgba(74,222,128,0.12)', borderColor: VERT }}>
        <div style={surtitre(VERT)}>Le bon ordre</div>
        {etapes.map((e, i) => {
          const ok = ordre[i] === i, moi = ordre.indexOf(i)
          return (
            <div key={i} style={{ display: 'flex', gap: '0.8cqw', alignItems: 'center', marginTop: '0.6cqw', fontSize: '1.3cqw', fontWeight: 600 }}>
              <span style={{ width: '2.2cqw', height: '2.2cqw', borderRadius: '50%', background: ok ? VERT : '#f87171', color: NAVY, display: 'grid', placeItems: 'center', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1 }}>{fr(e)}</span>
              {!ok && moi >= 0 && <span style={{ fontSize: '1cqw', opacity: 0.75 }}>toi : n°{moi + 1}</span>}
            </div>
          )
        })}
      </div>
    )
  }
  const cliquer = idx => onReponse({ ordre: ordre.includes(idx) ? ordre.filter(x => x !== idx) : [...ordre, idx] })
  return (
    <>
      <div style={{ fontSize: '1.1cqw', opacity: 0.75 }}>Clique sur les étapes dans le bon ordre : 1, 2, 3…</div>
      {melange(c).map((idx, k) => {
        const n = ordre.indexOf(idx)
        return (
          <button key={idx} type="button" onClick={() => cliquer(idx)} className="aa-option"
            style={{ display: 'flex', alignItems: 'center', gap: '1cqw', padding: '0.8cqw 1.1cqw', borderRadius: '1cqw', background: n >= 0 ? 'rgba(201,162,39,0.22)' : 'rgba(255,255,255,0.1)', border: `1.5px solid ${n >= 0 ? OR : 'rgba(255,255,255,0.18)'}`, color: '#fff', fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', width: '100%', animation: `aaOption .4s ease ${0.3 + k * 0.08}s both` }}>
            <span style={{ width: '2.4cqw', height: '2.4cqw', borderRadius: '50%', border: `2px ${n >= 0 ? 'solid' : 'dashed'} ${n >= 0 ? OR : 'rgba(255,255,255,0.5)'}`, background: n >= 0 ? OR : 'transparent', color: NAVY, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '1.3cqw', flexShrink: 0 }}>{n >= 0 ? n + 1 : ''}</span>
            <span style={{ fontSize: '1.4cqw', fontWeight: 600, lineHeight: 1.3 }}>{fr(etapes[idx]) || '…'}</span>
          </button>
        )
      })}
      {ordre.length > 0 && <button type="button" onClick={() => onReponse({ ordre: [] })} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#fff', opacity: 0.7, textDecoration: 'underline', cursor: 'pointer', fontSize: '1.1cqw', fontFamily: 'inherit' }}>Recommencer la numérotation</button>}
    </>
  )
}

// La taille de Lipto suit la largeur du cadre
function LiptoTaille({ pose, correction, petit, mini }) {
  const [taille, setTaille] = useState(300)
  useEffect(() => {
    const maj = () => {
      const w = Math.min(1180, window.innerWidth * 0.94, (window.innerHeight - 150) * 16 / 9)
      setTaille(Math.round(w * (mini ? 0.14 : petit ? 0.2 : 0.29)))
    }
    maj(); window.addEventListener('resize', maj)
    return () => window.removeEventListener('resize', maj)
  }, [petit, mini])
  return <Lipto key={pose + correction} pose={pose} anim={correction ? 'rebond' : 'reflexion'} taille={taille} t={THEMES_TEL.clair} />
}

function Examen({ duree = 4 }) {
  const [fini, setFini] = useState(false)
  useEffect(() => { const t = setTimeout(() => setFini(true), duree * 1000); return () => clearTimeout(t) }, [duree])
  return (
    <Ecran fond={SALLE}>
      <Centre>
        {!fini ? (
          <>
            <div style={{ fontSize: '3cqw' }}>👁️</div>
            <div style={{ fontSize: '2.6cqw', fontWeight: 800, marginTop: '1cqw' }}>Examen de vue en cours…</div>
            <div style={{ width: '30cqw', height: '0.6cqw', background: 'rgba(255,255,255,0.2)', borderRadius: 99, marginTop: '1.6cqw', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: OR, animation: `aaBarre ${duree}s linear both` }} />
            </div>
          </>
        ) : (
          <>
            <Lipto pose="pouce" anim="rebond" taille={200} t={THEMES_TEL.clair} />
            <div style={{ fontSize: '2.4cqw', fontWeight: 800, marginTop: '1cqw' }}>Examen terminé ✓</div>
          </>
        )}
      </Centre>
    </Ecran>
  )
}

function ChoixScenario({ departs, onChoix }) {
  return (
    <Ecran fond="/assets/magasins/magasin-comptoir.webp">
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(3,17,42,0.7)' }} />
      <div style={{ position: 'absolute', inset: '6cqw 7cqw', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ fontSize: '1.2cqw', letterSpacing: 4, textTransform: 'uppercase', color: OR, fontWeight: 800 }}>Écran formateur</div>
        <div style={{ fontSize: '3cqw', fontWeight: 800, margin: '0.5cqw 0 2cqw' }}>Choisis un scénario</div>
        {departs.length === 0 && <div style={{ fontSize: '1.6cqw', opacity: 0.8 }}>Ce projet n’a pas encore de départ 🚩.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.4cqw' }}>
          {departs.map((d, i) => (
            <button key={d.id} onClick={() => onChoix(d)} className="aa-replique">
              <span style={{ fontSize: '1.1cqw', letterSpacing: 2, textTransform: 'uppercase', color: OR, fontWeight: 800 }}>Scénario {i + 1}</span>
              <span style={{ fontSize: '1.8cqw', fontWeight: 700, lineHeight: 1.3 }}>{d.nom}</span>
            </button>
          ))}
        </div>
      </div>
    </Ecran>
  )
}

// Largeur d'un document sur le diffuseur (en % de la largeur de l'écran)
function largeurDoc(d, question, nb) {
  if (d.genre === 'backend') return nb > 1 ? '36cqw' : question ? '58cqw' : '62cqw'
  if (d.genre === 'fronto') return nb > 1 ? '20cqw' : '24cqw'
  return nb > 1 ? '24cqw' : question ? '30cqw' : '34cqw'
}
function DocumentMini({ d }) {
  if (d.genre === 'ticket') return <TicketMini d={d} />
  if (d.genre === 'backend') return <BackendMini d={d} />
  if (d.genre === 'fronto') return <FrontoMini d={d} />
  return <OrdoMini d={d} />
}

function OrdoMini({ d }) {
  const cel = { padding: '0.7cqw 0.4cqw', fontSize: '1.35cqw', fontWeight: 600, textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontVariantNumeric: 'tabular-nums' }
  return (
    <div style={{ background: '#fff', color: '#0f172a', borderRadius: 6, padding: '2cqw 2cqw', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', transform: 'rotate(-1.5deg)', fontFamily: 'Georgia, serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div><div style={{ fontSize: '1.4cqw', fontWeight: 700 }}>Cabinet d’ophtalmologie</div><div style={{ fontSize: '0.9cqw', color: '#64748b' }}>Document fictif de formation</div></div>
        <div style={{ fontSize: '1.05cqw', color: '#334155' }}>{d.date ? `Le ${d.date}` : ''}</div>
      </div>
      <div style={{ marginTop: '1.4cqw', fontSize: '1.2cqw' }}>Patient : <b style={{ letterSpacing: 2 }}>{d.patient}</b></div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1cqw', fontFamily: 'inherit' }}>
        <thead><tr>{['', 'Sphère', 'Cylindre', 'Axe', 'Add.'].map(h => <th key={h} style={{ ...cel, fontSize: '0.85cqw', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>)}</tr></thead>
        <tbody>
          {[['OD', d.od], ['OG', d.og]].map(([o, v]) => (
            <tr key={o}><td style={{ ...cel, fontWeight: 800, color: '#0089ba' }}>{o}</td><td style={cel}>{v.sph}</td><td style={cel}>{v.cyl ? `(${v.cyl})` : ''}</td><td style={cel}>{v.axe ? `${v.axe}°` : ''}</td><td style={cel}>{v.add}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TicketMini({ d }) {
  const ligne = (g, m, dr) => <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1cqw' }}><span>{g}</span><span>{m}</span><span style={{ textAlign: 'right' }}>{dr}</span></div>
  return (
    <div style={{ fontFamily: '"Courier New", monospace', letterSpacing: 1.5, maxWidth: '24cqw', color: '#1f2937', fontSize: '1.3cqw', fontWeight: 600, lineHeight: 1.35, background: 'linear-gradient(180deg, #fff, #f4f6f8)', padding: '2cqw 1.6cqw', borderRadius: '4px 4px 10px 10px', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', transform: 'rotate(1.5deg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>NAME: {d.nom}</span><span>M/F</span></div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{d.date}</span><span>{d.heure}</span></div>
      <div style={{ textAlign: 'right' }}>WD={d.wd}</div>
      <div style={{ marginTop: '1.2cqw' }}>-- FAR --</div>
      {ligne(d.od.sph, 'SPH', d.og.sph)}{ligne(d.od.cyl, 'CYL', d.og.cyl)}{ligne(d.od.axe, 'AXS', d.og.axe)}
      {(d.od.add || d.og.add) && ligne(d.od.add, 'ADD', d.og.add)}
      <div style={{ textAlign: 'center', marginTop: '0.6cqw' }}>PD {PD_LIPTO}</div>
      {d.npd && <div style={{ textAlign: 'center' }}>NPD {d.npd}</div>}
      <div style={{ textAlign: 'center', marginTop: '1.2cqw' }}>{d.magasin?.[0]}</div>
      <div style={{ textAlign: 'center' }}>{d.magasin?.[1]}</div>
    </div>
  )
}

const styleBouton = { border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', borderRadius: 10, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }
function Bouton({ plein, desactive, onClick, children }) {
  return <button disabled={desactive} onClick={onClick} style={{ ...styleBouton, ...(plein ? { background: '#fff', color: NAVY, border: '1px solid #fff' } : {}), opacity: desactive ? 0.35 : 1, cursor: desactive ? 'default' : 'pointer' }}>{children}</button>
}

const CSS = `
.aa-cadre { position: relative; width: min(1180px, 94vw, calc((100vh - 150px) * 16 / 9)); aspect-ratio: 16 / 9; border-radius: 14px; overflow: hidden; background: ${NAVY}; box-shadow: 0 30px 80px rgba(0,0,0,0.5); container-type: inline-size; }
.aa-replique { display: flex; flex-direction: column; gap: 0.6cqw; text-align: left; padding: 1.6cqw 1.8cqw; border-radius: 1.2cqw; border: 1.5px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); color: #fff; cursor: pointer; font-family: inherit; transition: background .15s, border-color .15s, transform .15s; }
.aa-option:hover { background: rgba(255,255,255,0.18) !important; }
.aa-texte { width: 100%; resize: none; border-radius: 1cqw; border: 1.5px solid rgba(255,255,255,0.3); background: rgba(255,255,255,0.95); color: ${NAVY}; font-family: inherit; font-size: 1.5cqw; font-weight: 600; line-height: 1.35; padding: 1cqw 1.2cqw; }
.aa-texte:focus { outline: none; border-color: ${OR}; box-shadow: 0 0 0 3px rgba(201,162,39,0.35); }
.aa-replique:hover { background: rgba(255,255,255,0.16); border-color: ${OR}; transform: translateY(-2px); }
@keyframes aaFondu { from { opacity: 0; } to { opacity: 1; } }
@keyframes aaEntree { 0% { transform: translateX(-60cqw); } 60% { transform: translateX(1cqw); } 80% { transform: translateY(-1cqw); } 100% { transform: none; } }
@keyframes aaBulle { from { opacity: 0; transform: scale(.85) translateY(10px); } to { opacity: 1; transform: none; } }
@keyframes aaOption { from { opacity: 0; transform: translateX(14px); } }
@keyframes aaDoc { from { opacity: 0; transform: translateY(-20cqw) rotate(-10deg); } to { opacity: 1; transform: none; } }
@keyframes aaBarre { from { width: 0; } to { width: 100%; } }
@media (prefers-reduced-motion: reduce) { [style*="aaEntree"] { animation: none !important; } }
`
