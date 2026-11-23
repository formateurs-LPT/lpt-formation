'use client'
// Atelier de simulations Lipto (23/11), ouvert depuis le menu du dashboard formateur.
// Barre latérale (projets de l'équipe) · plan de travail (cases reliées, rangées
// automatiquement) · panneau de la case sélectionnée · aperçu jouable.
// Projets enregistrés dans Supabase ; un seul formateur modifie un projet à la fois.
import { useEffect, useMemo, useRef, useState } from 'react'
import Lipto from '@/components/lipto/Lipto'
import { THEMES_TEL } from '@/lib/themeTelephone'
import { liptoSrc } from '@/lib/lipto'
import {
  TYPES_CASE, TYPES_QUESTION, TYPES_AJOUTABLES, LARGEUR_CASE, HAUT_ENTETE, HAUT_SORTIE,
  nouvelleCase, nouveauProjet, problemesCase, estApresChoix, bilanProjet, miseEnPage, hauteurCase, ySortie,
  projetSimulationActuelle, nouvelId,
} from '@/lib/atelierSimulation'
import { chargerProjetsEquipe, enregistrerProjet, supprimerProjetEquipe, verrouilleParAutre, prendreVerrou, rendreVerrou } from '@/lib/atelierSimulationApi'
import AtelierPanneau from './AtelierPanneau'
import AtelierApercu from './AtelierApercu'

const NAVY = '#03112a', BLEU = '#00abe9', TRAIT = '#e3e6ee', DOUX = '#64748b', FOND = '#f5f6fa'
const fr = t => (t || '').replace(/ ([?!:;»])/g, '\u00a0$1').replace(/« /g, '«\u00a0')
function ilYa(iso) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'à l’instant'
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`
  return `le ${new Date(iso).toLocaleDateString('fr-FR')}`
}

// moi : prénom du formateur connecté (auteur des projets, verrou)
export default function AtelierSimulation({ moi, onQuitter }) {
  const [projets, setProjets] = useState([])
  const [charge, setCharge] = useState(false)
  const [projetId, setProjetId] = useState(null)
  const [selection, setSelection] = useState(null)
  const [liaison, setLiaison] = useState(null) // { source, sortie } : on attend un clic sur la case cible
  const [menu, setMenu] = useState(null) // { source, sortie, x, y }
  const [apercu, setApercu] = useState(null) // { depart }
  const [enregistrement, setEnregistrement] = useState('ok') // ok | en-cours | erreur
  const [focus, setFocus] = useState(null) // { id } : la vue se déplace jusqu'à cette case
  const aEnregistrer = useRef(new Set()) // projets modifiés, pas encore envoyés
  const dejaCharge = useRef(false)
  const projetIdRef = useRef(projetId)
  projetIdRef.current = projetId
  const projetsRef = useRef(projets)
  projetsRef.current = projets

  // Chargement, puis toutes les 15 s : les projets des collègues. Ceux qu'on
  // est en train d'enregistrer ne sont pas écrasés.
  useEffect(() => {
    let actif = true
    const charger = async () => {
      const equipe = await chargerProjetsEquipe()
      if (!actif) return
      setProjets(ps => {
        const locaux = new Map(ps.map(p => [p.id, p]))
        return equipe.map(p => aEnregistrer.current.has(p.id) && locaux.has(p.id) ? { ...locaux.get(p.id), verrouPar: p.verrouPar, verrouLe: p.verrouLe } : p)
          .concat(ps.filter(p => aEnregistrer.current.has(p.id) && !equipe.some(e => e.id === p.id)))
      })
      if (!dejaCharge.current) {
        dejaCharge.current = true
        setCharge(true)
        if (equipe[0]) setProjetId(id => id || equipe[0].id)
      }
    }
    charger()
    const t = setInterval(charger, 15000)
    return () => { actif = false; clearInterval(t) }
  }, [])

  // Enregistrement automatique des projets modifiés
  const envoyer = async () => {
    const ids = [...aEnregistrer.current]
    if (!ids.length) return
    setEnregistrement('en-cours')
    try {
      for (const id of ids) {
        const p = projetsRef.current.find(x => x.id === id)
        if (p) await enregistrerProjet(p)
        aEnregistrer.current.delete(id)
        // Projet tout juste créé : le verrou ne pouvait pas être posé avant
        if (p && id === projetIdRef.current && !p.verrouPar) prendreVerrou(id, moi)
      }
      setEnregistrement(aEnregistrer.current.size ? 'en-cours' : 'ok')
    } catch {
      setEnregistrement('erreur')
    }
  }
  const [aEnvoyer, setAEnvoyer] = useState(0)
  useEffect(() => {
    if (!aEnvoyer) return
    const t = setTimeout(envoyer, 700)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aEnvoyer])
  // Nouvel essai automatique après une erreur (réseau coupé…)
  useEffect(() => {
    if (enregistrement !== 'erreur') return
    const t = setTimeout(envoyer, 10000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enregistrement])

  // Verrou : on garde la main sur le projet ouvert tant qu'il est ouvert
  const projetOuvert = projets.find(p => p.id === projetId) || null
  const lectureSeule = verrouilleParAutre(projetOuvert, moi)
  useEffect(() => {
    if (!projetId || lectureSeule) return
    prendreVerrou(projetId, moi)
    const t = setInterval(() => prendreVerrou(projetId, moi), 20000)
    const rendre = () => rendreVerrou(projetId, moi)
    window.addEventListener('pagehide', rendre)
    return () => { clearInterval(t); window.removeEventListener('pagehide', rendre); rendre() }
  }, [projetId, lectureSeule, moi])

  useEffect(() => {
    const touche = e => { if (e.key === 'Escape') { setLiaison(null); setMenu(null) } }
    window.addEventListener('keydown', touche)
    return () => window.removeEventListener('keydown', touche)
  }, [])

  const projet = projets.find(p => p.id === projetId) || null
  const pos = useMemo(() => (projet ? miseEnPage(projet) : {}), [projet])

  const majProjet = (fn) => {
    if (lectureSeule) return
    aEnregistrer.current.add(projetId)
    setProjets(ps => ps.map(p => p.id === projetId ? { ...fn(p), majLe: new Date().toISOString(), majPar: moi } : p))
    setAEnvoyer(n => n + 1)
  }
  const majCases = (fn) => majProjet(p => ({ ...p, cases: fn({ ...p.cases }) }))
  const majCase = (id, patch) => majCases(cs => ({ ...cs, [id]: { ...cs[id], ...patch } }))
  const relier = (source, sortie, cible) => majCases(cs => {
    const suites = [...cs[source].suites]; suites[sortie] = cible
    return { ...cs, [source]: { ...cs[source], suites } }
  })

  const ajouterSuite = (type) => {
    const { source, sortie } = menu
    const c = nouvelleCase(type)
    majCases(cs => {
      const suites = [...cs[source].suites]; suites[sortie] = c.id
      return { ...cs, [c.id]: c, [source]: { ...cs[source], suites } }
    })
    setMenu(null); setSelection(c.id); setFocus({ id: c.id })
  }
  const supprimerCase = (id) => {
    majCases(cs => {
      const suite = {}
      for (const [k, c] of Object.entries(cs)) if (k !== id) suite[k] = { ...c, suites: c.suites.map(s => s === id ? null : s) }
      return suite
    })
    setSelection(null)
  }
  const ajouterScenario = () => {
    const d = nouvelleCase('depart')
    d.nom = `Scénario ${Object.values(projet.cases).filter(c => c.type === 'depart').length + 1}`
    majCases(cs => ({ ...cs, [d.id]: d }))
    setSelection(d.id)
  }
  const creerProjet = (p) => {
    aEnregistrer.current.add(p.id)
    setProjets(ps => [p, ...ps]); setProjetId(p.id); setSelection(null)
    setAEnvoyer(n => n + 1)
  }
  const dupliquer = () => creerProjet({ ...JSON.parse(JSON.stringify(projet)), id: nouvelId(), titre: projet.titre + ' (copie)', auteur: moi, statut: 'brouillon', creeLe: new Date().toISOString() })
  const supprimerProjet = () => {
    if (!window.confirm(`Supprimer « ${projet.titre} » pour toute l’équipe ?`)) return
    const supprime = projet
    aEnregistrer.current.delete(supprime.id)
    const reste = projets.filter(p => p.id !== projetId)
    setProjets(reste); setProjetId(reste[0]?.id || null); setSelection(null)
    supprimerProjetEquipe(supprime).catch(() => {
      window.alert('La suppression n’a pas pu être enregistrée. Vérifie ta connexion.')
      setProjets(ps => [supprime, ...ps])
    })
  }
  const changerStatut = (statut) => {
    if (statut === 'pret') {
      const b = bilanProjet(projet)
      const reste = [b.suitesManquantes && `${b.suitesManquantes} suite(s) à écrire`, b.problemes && `${b.problemes} point(s) à corriger`].filter(Boolean)
      if (reste.length && !window.confirm(`Il reste ${reste.join(' et ')}. Passer quand même en « Prêt » ?`)) return
    }
    majProjet(p => ({ ...p, statut }))
  }

  return (
    // lang + spellCheck : le correcteur d'orthographe du navigateur souligne les
    // fautes dans tous les champs de l'atelier (clic droit pour les suggestions)
    <div lang="fr" spellCheck style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', background: FOND, color: NAVY, overflow: 'hidden' }}>
      <style>{CSS}</style>
      <BarreLaterale
        moi={moi} projets={projets} projetId={projetId}
        onOuvrir={id => { setProjetId(id); setSelection(null); setLiaison(null) }}
        onNouveau={() => creerProjet(nouveauProjet(moi))}
        onImporter={() => creerProjet({ ...projetSimulationActuelle(moi), id: nouvelId() })}
        onQuitter={onQuitter}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {projet ? (
          <>
            {lectureSeule && (
              <div style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a', color: '#92400e', padding: '9px 18px', fontSize: 14, fontWeight: 600 }}>
                🔒 {projet.verrouPar} modifie ce projet en ce moment : tu le vois en lecture seule (tu peux le tester). Il se met à jour tout seul.
              </div>
            )}
            <BarreProjet projet={projet} moi={moi} enregistrement={enregistrement}
              onTitre={titre => majProjet(p => ({ ...p, titre }))} onStatut={changerStatut}
              onTester={() => setApercu({ depart: null })} onScenario={ajouterScenario}
              onDupliquer={dupliquer} onSupprimer={supprimerProjet} />
            <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
              <PlanDeTravail
                projet={projet} pos={pos} selection={selection} liaison={liaison} focus={focus}
                onSelection={id => {
                  if (liaison) {
                    if (projet.cases[id]?.type !== 'depart' && id !== liaison.source) { relier(liaison.source, liaison.sortie, id); setLiaison(null) }
                    return
                  }
                  setSelection(id)
                }}
                onVide={() => { setSelection(null); setMenu(null) }}
                onPlus={(source, sortie, e) => { const r = e.currentTarget.getBoundingClientRect(); setMenu({ source, sortie, x: r.right + 8, y: r.top }) }}
                onDelier={(source, sortie) => relier(source, sortie, null)}
              />
              <div style={{ display: 'flex', pointerEvents: lectureSeule ? 'none' : 'auto', opacity: lectureSeule ? 0.65 : 1 }}>
              <AtelierPanneau
                cas={selection ? projet.cases[selection] : null}
                apresChoix={!!selection && estApresChoix(projet.cases, selection)}
                onMaj={patch => majCase(selection, patch)}
                onSupprimer={() => supprimerCase(selection)}
                onTester={() => setApercu({ depart: selection })}
                onFermer={() => setSelection(null)}
              />
              </div>
            </div>
          </>
        ) : !charge ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: DOUX }}>Chargement des simulations…</div>
        ) : projets.length ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: DOUX, fontSize: 15 }}>Choisis une simulation dans la liste à gauche, ou crée-en une nouvelle.</div>
        ) : (
          <Accueil onNouveau={() => creerProjet(nouveauProjet(moi))} onImporter={() => creerProjet({ ...projetSimulationActuelle(moi), id: nouvelId() })} />
        )}
      </div>

      {menu && (
        <>
          <div onClick={() => setMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'fixed', left: Math.min(menu.x, window.innerWidth - 260), top: Math.min(menu.y, window.innerHeight - 330), zIndex: 41, width: 250, background: '#fff', borderRadius: 14, boxShadow: '0 18px 50px rgba(3,17,42,0.22)', border: `1px solid ${TRAIT}`, padding: 6, animation: 'atApparait .15s ease both' }}>
            <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: DOUX, fontWeight: 700, padding: '8px 10px 6px' }}>Ajouter la suite</div>
            {TYPES_AJOUTABLES.map(t => (
              <button key={t} className="at-ligne-menu" onClick={() => ajouterSuite(t)}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: TYPES_CASE[t].couleur + '1a', display: 'grid', placeItems: 'center' }}>{TYPES_CASE[t].emoji}</span>
                {TYPES_CASE[t].nom}
              </button>
            ))}
            <div style={{ height: 1, background: TRAIT, margin: '4px 6px' }} />
            <button className="at-ligne-menu" onClick={() => { setLiaison({ source: menu.source, sortie: menu.sortie }); setMenu(null) }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#eef2f7', display: 'grid', placeItems: 'center' }}>🔗</span>
              Relier à une case existante
            </button>
          </div>
        </>
      )}

      {liaison && (
        <div style={{ position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 30, background: NAVY, color: '#fff', borderRadius: 999, padding: '10px 14px 10px 20px', fontSize: 14, fontWeight: 600, display: 'flex', gap: 14, alignItems: 'center', boxShadow: '0 10px 30px rgba(3,17,42,0.3)' }}>
          🔗 Clique sur la case à relier
          <button onClick={() => setLiaison(null)} style={{ ...btn, background: 'rgba(255,255,255,0.14)', color: '#fff', border: 'none', padding: '6px 12px' }}>Annuler</button>
        </div>
      )}

      {apercu && projet && (
        <AtelierApercu projet={projet} depart={apercu.depart} onFermer={() => setApercu(null)}
          onEditer={id => { setApercu(null); setSelection(id); setFocus({ id }) }} />
      )}
    </div>
  )
}

function Accueil({ onNouveau, onImporter }) {
  return (
    <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 460 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Lipto pose="reflexion" taille={140} t={THEMES_TEL.clair} /></div>
        <h2 style={{ fontSize: 24, marginTop: 12 }}>Aucune simulation pour l’instant</h2>
        <p style={{ color: DOUX, marginTop: 6, lineHeight: 1.5 }}>Crée une simulation vide, ou repars de la Simulation finale actuelle (ses 3 scénarios, déjà reliés).</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <button onClick={onNouveau} style={btnPlein}>+ Nouvelle simulation</button>
          <button onClick={onImporter} style={btn}>Importer la simulation actuelle</button>
        </div>
      </div>
    </div>
  )
}

// ── Barre latérale gauche : projets de l'équipe ──
function BarreLaterale({ moi, projets, projetId, onOuvrir, onNouveau, onImporter, onQuitter }) {
  const miens = projets.filter(p => p.auteur === moi)
  const equipe = projets.filter(p => p.auteur !== moi)
  const ligne = p => {
    const b = bilanProjet(p)
    const actif = p.id === projetId
    return (
      <button key={p.id} onClick={() => onOuvrir(p.id)} className="at-projet" style={{ background: actif ? '#fff' : 'transparent', boxShadow: actif ? '0 2px 10px rgba(3,17,42,0.08)' : 'none', borderColor: actif ? TRAIT : 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, flexShrink: 0, background: p.statut === 'pret' ? '#16a34a' : '#cbd5e1' }} />
          <span style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titre}</span>
        </div>
        <div style={{ fontSize: 12, color: DOUX, marginTop: 3, paddingLeft: 16 }}>
          {p.auteur !== moi && <>{p.auteur} · </>}{b.nbCases} case{b.nbCases > 1 ? 's' : ''}{b.suitesManquantes ? ` · ${b.suitesManquantes} à écrire` : ''}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, paddingLeft: 16 }}>Modifié {ilYa(p.majLe)}{p.majPar && p.majPar !== p.auteur ? ` par ${p.majPar}` : ''}</div>
      </button>
    )
  }
  return (
    <aside style={{ width: 270, flexShrink: 0, borderRight: `1px solid ${TRAIT}`, background: '#eef0f6', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px 16px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Lipto pose="pouce" taille={48} t={THEMES_TEL.clair} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.1 }}>Atelier Lipto</div>
          <div style={{ fontSize: 12, color: DOUX }}>Création de simulations</div>
        </div>
      </div>
      <div style={{ padding: '0 14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button onClick={onNouveau} style={{ ...btnPlein, width: '100%' }}>+ Nouvelle simulation</button>
        <button onClick={onImporter} style={{ ...btn, width: '100%', fontSize: 13 }}>Importer la simulation actuelle</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px 12px' }}>
        <TitreListe>Mes simulations</TitreListe>
        {miens.length ? miens.map(ligne) : <Vide>Aucune pour l’instant</Vide>}
        <TitreListe>De l’équipe</TitreListe>
        {equipe.length ? equipe.map(ligne) : <Vide>Les simulations de tes collègues apparaîtront ici</Vide>}
      </div>
      <div style={{ borderTop: `1px solid ${TRAIT}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
        <span style={{ width: 30, height: 30, borderRadius: 15, background: NAVY, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{moi[0]}</span>
        <span style={{ flex: 1 }}><b>{moi}</b></span>
        <button onClick={onQuitter} style={{ ...btn, padding: '6px 10px', fontSize: 12 }}>← Dashboard</button>
      </div>
    </aside>
  )
}
const TitreListe = ({ children }) => <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: DOUX, fontWeight: 700, padding: '14px 8px 6px' }}>{children}</div>
const Vide = ({ children }) => <div style={{ fontSize: 12, color: '#94a3b8', padding: '2px 8px 6px' }}>{children}</div>

// ── Barre du haut : titre, statut, test ──
function BarreProjet({ projet, moi, enregistrement, onTitre, onStatut, onTester, onScenario, onDupliquer, onSupprimer }) {
  const b = bilanProjet(projet)
  return (
    <div style={{ height: 62, flexShrink: 0, borderBottom: `1px solid ${TRAIT}`, background: '#fff', display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px' }}>
      <input value={projet.titre} onChange={e => onTitre(e.target.value)} className="at-titre" size={Math.max(8, projet.titre.length)} />
      <div style={{ display: 'flex', background: '#eef0f6', borderRadius: 10, padding: 3 }}>
        {[['brouillon', 'Brouillon'], ['pret', '✓ Prêt']].map(([v, l]) => (
          <button key={v} onClick={() => onStatut(v)} style={{ border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', background: projet.statut === v ? (v === 'pret' ? '#16a34a' : '#fff') : 'transparent', color: projet.statut === v && v === 'pret' ? '#fff' : NAVY, boxShadow: projet.statut === v ? '0 1px 4px rgba(3,17,42,0.12)' : 'none' }}>{l}</button>
        ))}
      </div>
      <div style={{ fontSize: 13, color: DOUX, whiteSpace: 'nowrap' }}>
        {b.nbCases} case{b.nbCases > 1 ? 's' : ''}
        {b.suitesManquantes > 0 && <span style={{ color: '#b45309' }}> · {b.suitesManquantes} suite{b.suitesManquantes > 1 ? 's' : ''} à écrire</span>}
        {b.problemes > 0 && <span style={{ color: '#dc2626' }}> · ⚠ {b.problemes}</span>}
      </div>
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 12, color: enregistrement === 'erreur' ? '#dc2626' : '#94a3b8', fontWeight: enregistrement === 'erreur' ? 700 : 400, whiteSpace: 'nowrap' }}>
        {{ ok: 'Enregistré ✓', 'en-cours': 'Enregistrement…', erreur: '⚠ Non enregistré, nouvel essai…' }[enregistrement]}{projet.auteur !== moi ? ` · projet de ${projet.auteur}` : ''}
      </span>
      <button onClick={onScenario} style={btn}>+ Scénario</button>
      <button onClick={onDupliquer} style={btn} title="Dupliquer le projet">Dupliquer</button>
      <button onClick={onSupprimer} style={{ ...btn, color: '#dc2626' }} title="Supprimer le projet">Supprimer</button>
      <button onClick={onTester} style={btnPlein}>▶ Tester</button>
    </div>
  )
}

// ── Plan de travail : cases + flèches, déplaçable et zoomable ──
function PlanDeTravail({ projet, pos, selection, liaison, focus, onSelection, onVide, onPlus, onDelier }) {
  const [vue, setVue] = useState({ x: 40, y: 32, zoom: 0.75 })
  const zone = useRef(null)
  const glisse = useRef(null)

  useEffect(() => { setVue({ x: 40, y: 32, zoom: 0.75 }) }, [projet.id])

  // Amène une case à l'écran (nouvelle case, retour depuis le test) si elle n'y est pas
  useEffect(() => {
    const p = focus && pos[focus.id]
    if (!p || !zone.current) return
    const r = zone.current.getBoundingClientRect()
    setVue(v => {
      const x = v.x + p.x * v.zoom, y = v.y + p.y * v.zoom
      const visible = x > 20 && y > 20 && x + LARGEUR_CASE * v.zoom < r.width - 20 && y + 120 * v.zoom < r.height - 20
      return visible ? v : { ...v, x: r.width / 2 - (p.x + LARGEUR_CASE / 2) * v.zoom, y: r.height / 3 - p.y * v.zoom }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus])

  // Molette : défilement ; Ctrl + molette (ou pincer sur le pavé tactile) : zoom
  useEffect(() => {
    const el = zone.current
    const molette = e => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        const r = el.getBoundingClientRect()
        const mx = e.clientX - r.left, my = e.clientY - r.top
        setVue(v => {
          const zoom = Math.min(1.6, Math.max(0.3, v.zoom * Math.exp(-e.deltaY * 0.01)))
          return { zoom, x: mx - (mx - v.x) * zoom / v.zoom, y: my - (my - v.y) * zoom / v.zoom }
        })
      } else setVue(v => ({ ...v, x: v.x - e.deltaX, y: v.y - e.deltaY }))
    }
    el.addEventListener('wheel', molette, { passive: false })
    return () => el.removeEventListener('wheel', molette)
  }, [])

  const zoomer = f => setVue(v => {
    const r = zone.current.getBoundingClientRect(), mx = r.width / 2, my = r.height / 2
    const zoom = Math.min(1.6, Math.max(0.3, v.zoom * f))
    return { zoom, x: mx - (mx - v.x) * zoom / v.zoom, y: my - (my - v.y) * zoom / v.zoom }
  })

  const fleches = []
  for (const c of Object.values(projet.cases)) {
    const p = pos[c.id]; if (!p) continue
    c.suites.forEach((s, i) => {
      const t = pos[s]; if (!t) return
      const x1 = p.x + LARGEUR_CASE, y1 = ySortie(p, i), x2 = t.x - 6, y2 = t.y + 43
      const dx = Math.max(60, Math.abs(x2 - x1) / 2)
      const actif = selection === c.id || selection === s
      fleches.push(
        <path key={c.id + i} d={`M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`} fill="none"
          stroke={actif ? TYPES_CASE[c.type].couleur : '#b6bfcf'} strokeWidth={actif ? 2.5 : 2} markerEnd={`url(#${actif ? 'pointe-' + c.type : 'pointe'})`} />
      )
    })
  }

  return (
    <div ref={zone} className="at-plan" style={{ flex: 1, position: 'relative', overflow: 'hidden', cursor: glisse.current ? 'grabbing' : 'grab', backgroundPosition: `${vue.x}px ${vue.y}px`, backgroundSize: `${24 * vue.zoom}px ${24 * vue.zoom}px` }}
      onPointerDown={e => {
        if (e.target.closest('[data-case]') || e.button !== 0) return
        glisse.current = { x: e.clientX, y: e.clientY, vx: vue.x, vy: vue.y, bouge: false }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={e => {
        const g = glisse.current; if (!g) return
        if (Math.abs(e.clientX - g.x) + Math.abs(e.clientY - g.y) > 3) g.bouge = true
        setVue(v => ({ ...v, x: g.vx + e.clientX - g.x, y: g.vy + e.clientY - g.y }))
      }}
      onPointerUp={() => { if (glisse.current && !glisse.current.bouge) onVide(); glisse.current = null }}
      // Un bouton qui prend le focus fait défiler la zone : on le transforme en déplacement de la vue
      onScroll={e => {
        const el = e.currentTarget
        if (!el.scrollLeft && !el.scrollTop) return
        const dx = el.scrollLeft, dy = el.scrollTop
        el.scrollLeft = 0; el.scrollTop = 0
        setVue(v => ({ ...v, x: v.x - dx, y: v.y - dy }))
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${vue.x}px, ${vue.y}px) scale(${vue.zoom})`, transformOrigin: '0 0' }}>
        <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }} width="1" height="1">
          <defs>
            {[['pointe', '#b6bfcf'], ...Object.entries(TYPES_CASE).map(([k, t]) => ['pointe-' + k, t.couleur])].map(([id, c]) => (
              <marker key={id} id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill={c} /></marker>
            ))}
          </defs>
          {fleches}
        </svg>
        {Object.values(projet.cases).map(c => pos[c.id] && (
          <CarteCase key={c.id} c={c} p={pos[c.id]} cases={projet.cases} choisie={selection === c.id}
            cible={!!liaison && c.type !== 'depart' && c.id !== liaison.source}
            onClic={() => onSelection(c.id)} onPlus={(i, e) => onPlus(c.id, i, e)} onDelier={i => onDelier(c.id, i)} />
        ))}
      </div>

      <div style={{ position: 'absolute', right: 16, bottom: 16, display: 'flex', gap: 6, background: '#fff', borderRadius: 12, padding: 5, boxShadow: '0 4px 16px rgba(3,17,42,0.1)', border: `1px solid ${TRAIT}` }}>
        <button style={btnRond} onClick={() => zoomer(1 / 1.2)} aria-label="Dézoomer">−</button>
        <span style={{ fontSize: 12, color: DOUX, alignSelf: 'center', minWidth: 40, textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>{Math.round(vue.zoom * 100)} %</span>
        <button style={btnRond} onClick={() => zoomer(1.2)} aria-label="Zoomer">+</button>
        <button style={{ ...btnRond, width: 'auto', padding: '0 10px', fontSize: 12 }} onClick={() => setVue({ x: 40, y: 32, zoom: 0.75 })}>Recentrer</button>
      </div>
      <div style={{ position: 'absolute', left: 16, bottom: 16, fontSize: 12, color: '#94a3b8' }}>Glisser pour se déplacer · Ctrl + molette pour zoomer</div>
    </div>
  )
}

function CarteCase({ c, p, cases, choisie, cible, onClic, onPlus, onDelier }) {
  const T = TYPES_CASE[c.type]
  const sorties = T.sorties(c)
  const apresChoix = estApresChoix(cases, c.id)
  const problemes = problemesCase(c, apresChoix)
  const apercuTexte = c.type === 'depart' ? null
    : c.type === 'lipto' ? (c.bulle ? fr(`« ${c.bulle} »`) : apresChoix ? 'Lipto dit la réplique choisie' : 'Que dit Lipto ?')
    : c.type === 'question' ? (c.bulle ? fr(`« ${c.bulle} »`) : (c.question || 'Question à écrire'))
    : c.type === 'choix' ? 'Que répond Lipto ? Le formateur choisit.'
    : c.type === 'examen' ? 'Animation, puis salle d’examen'
    : (c.message || 'Fin de la simulation')
  const vignette = c.type === 'lipto' || c.type === 'question' || c.type === 'examen'
  const fond = c.type === 'examen' ? '/assets/magasins/salle-examen.webp' : c.fond
  return (
    <div data-case onClick={e => { e.stopPropagation(); onClic() }} className={'at-carte' + (cible ? ' at-cible' : '')}
      style={{ position: 'absolute', left: p.x, top: p.y, width: LARGEUR_CASE, height: hauteurCase(c), background: '#fff', borderRadius: 14, border: `1.5px solid ${choisie ? T.couleur : TRAIT}`, boxShadow: choisie ? `0 0 0 4px ${T.couleur}26, 0 10px 26px rgba(3,17,42,0.12)` : '0 2px 8px rgba(3,17,42,0.06)', cursor: cible ? 'copy' : 'pointer' }}>
      <div style={{ height: 4, background: T.couleur, borderRadius: '12px 12px 0 0' }} />
      <div style={{ height: HAUT_ENTETE - 4, padding: '9px 12px 0', display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 800, color: T.couleur, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>{T.emoji}</span>{c.type === 'question' ? (TYPES_QUESTION[c.mode]?.nom || 'Question') : T.nom}
            {c.document && <span title="Document affiché">{c.document.genre === 'ticket' ? '🧾' : '📄'}</span>}
            {problemes.length > 0 && <span title={problemes.join(' · ')} style={{ marginLeft: 'auto', color: '#dc2626' }}>⚠</span>}
          </div>
          {c.type === 'depart'
            ? <div style={{ fontSize: 16, fontWeight: 800, marginTop: 6, lineHeight: 1.2 }}>{c.nom}</div>
            : <div className="at-deux-lignes" style={{ fontSize: 13, marginTop: 5, lineHeight: 1.35, color: apercuTexte.startsWith('Que dit') || apercuTexte === 'Question à écrire' ? '#94a3b8' : NAVY }}>{apercuTexte}</div>}
        </div>
        {vignette && (
          <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 10, backgroundImage: `url(${fond})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' }}>
            {c.type !== 'examen' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={liptoSrc(c.pose)} alt="" style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', height: 44 }} />
            )}
          </div>
        )}
      </div>
      {sorties.map((l, i) => {
        const suite = c.suites[i] && cases[c.suites[i]] ? c.suites[i] : null
        return (
          <div key={i} style={{ height: HAUT_SORTIE, display: 'flex', alignItems: 'center', gap: 6, padding: '0 10px 0 12px', borderTop: `1px solid ${TRAIT}`, position: 'relative' }}>
            {suite ? (
              <>
                <span style={{ flex: 1, fontSize: 12, color: DOUX, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.type === 'choix' ? `« ${l} »` : l}</span>
                <button className="at-delier" title="Retirer le lien" onClick={e => { e.stopPropagation(); onDelier(i) }}>×</button>
              </>
            ) : (
              <button className="at-plus" onClick={e => { e.stopPropagation(); onPlus(i, e) }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>+ {c.type === 'choix' ? `« ${l} » → suite` : 'Ajouter la suite'}</span>
              </button>
            )}
            <span style={{ position: 'absolute', right: -6, top: HAUT_SORTIE / 2 - 5, width: 10, height: 10, borderRadius: 5, background: suite ? T.couleur : '#fff', border: `2px solid ${suite ? T.couleur : '#cbd5e1'}` }} />
          </div>
        )
      })}
    </div>
  )
}

export const btn = { border: `1px solid ${TRAIT}`, background: '#fff', color: NAVY, borderRadius: 10, padding: '8px 14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }
export const btnPlein = { ...btn, background: NAVY, color: '#fff', border: `1px solid ${NAVY}` }
const btnRond = { width: 32, height: 32, borderRadius: 8, border: 'none', background: '#f1f3f8', color: NAVY, fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }

const CSS = `
@keyframes atApparait { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
.at-plan { background-color: ${FOND}; background-image: radial-gradient(circle, #d4d9e4 1px, transparent 1.2px); }
.at-carte { transition: box-shadow .15s, border-color .15s; }
.at-carte:hover { box-shadow: 0 8px 22px rgba(3,17,42,0.12) !important; }
.at-cible { outline: 2px dashed ${BLEU}; outline-offset: 4px; }
.at-deux-lignes { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.at-plus { flex: 1; min-width: 0; display: flex; height: 24px; align-items: center; border: 1.5px dashed #cbd5e1; border-radius: 8px; background: #fafbfd; color: ${DOUX}; font-size: 12px; font-weight: 700; cursor: pointer; font-family: inherit; padding: 0 8px; text-align: left; }
.at-plus:hover { border-color: ${BLEU}; color: ${BLEU}; background: #f0fbfe; }
.at-delier { width: 20px; height: 20px; border-radius: 6px; border: none; background: transparent; color: #94a3b8; cursor: pointer; font-size: 15px; line-height: 1; opacity: 0; }
.at-carte:hover .at-delier { opacity: 1; }
.at-delier:hover { background: #fee2e2; color: #dc2626; }
.at-ligne-menu { display: flex; width: 100%; align-items: center; gap: 10px; padding: 7px 10px; border: none; background: none; border-radius: 9px; font-size: 14px; font-weight: 600; color: ${NAVY}; cursor: pointer; font-family: inherit; text-align: left; }
.at-ligne-menu:hover { background: #f1f3f8; }
.at-projet { display: block; width: 100%; text-align: left; border: 1px solid transparent; border-radius: 10px; padding: 9px 10px; margin-bottom: 2px; cursor: pointer; font-family: inherit; color: ${NAVY}; }
.at-projet:hover { background: rgba(255,255,255,0.6) !important; }
.at-titre { font-size: 18px; font-weight: 800; color: ${NAVY}; border: 1px solid transparent; border-radius: 8px; padding: 5px 8px; background: transparent; font-family: inherit; min-width: 120px; max-width: 440px; flex-shrink: 1; }
.at-titre:hover { border-color: ${TRAIT}; }
.at-titre:focus { outline: none; border-color: ${BLEU}; background: #fff; }
`
