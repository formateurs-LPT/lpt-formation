'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { sbSelect } from '@/lib/supabase'
import { apiGetCollaborateurByLogin, apiChangerCode, getCollaborateurById } from '@/lib/collaborateursApi'
import {
  MODULE_GROUPES, MODULES, NB_FORMATS, niveauPour, prochainNiveau,
  etatModules, statutModule, getResultatsModules, enregistrerResultatModule, modulesOuverts,
} from '@/lib/modulesApresFormation'

// Page autonome (comme /espace-collaborateur) — modules après-formation pour
// les collaborateurs déjà en magasin. Aucune dépendance à la formation
// initiale (page.js / Dashboard.js) : seules les tables collaborateurs,
// magasins et module_resultats sont lues ou écrites.
const SESSION_KEY = 'mes_modules_session'


// Réglages de mouvement et de matière (inspirés des principes de design
// d'Apple) : retour visuel dès le toucher, feuille du module qui entre et sort
// par le bas avec une courbe sans rebond, barres translucides, typographie
// resserrée sur les grands titres, et variantes sans mouvement/transparence.
const COURBE_RESSORT = 'cubic-bezier(0.32, 0.72, 0, 1)'
const STYLES = `
  .mm-pressable { transition: transform 100ms ease-out, box-shadow 160ms ease-out, background-color 160ms ease-out; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
  .mm-pressable:active { transform: scale(0.97); }
  .mm-ligne:active { background: #f8fafc; }
  .mm-pressable:focus-visible { outline: 2px solid #00abe9; outline-offset: 2px; }
  .mm-champ:focus { border-color: rgba(0,171,233,0.9) !important; background: rgba(255,255,255,0.11) !important; }

  .mm-titre { letter-spacing: -0.02em; line-height: 1.15; }

  .mm-ios {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', 'DM Sans', sans-serif;
    background: #f2f2f7; color: #000; -webkit-font-smoothing: antialiased;
  }
  .mm-grand-titre { font-size: 34px; font-weight: 700; letter-spacing: -0.022em; line-height: 1.12; margin: 0; }
  .mm-section-titre { font-size: 13px; font-weight: 400; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.01em; padding: 0 16px 7px; }
  .mm-groupe { background: #fff; border-radius: 12px; overflow: hidden; }
  .mm-rangee {
    position: relative; display: flex; align-items: center; gap: 12px; width: 100%;
    padding: 10px 14px; min-height: 60px; background: #fff; border: none; text-align: left;
    font-family: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    transition: background-color 120ms ease-out;
  }
  .mm-rangee:active { background: #e5e5ea; transition: none; }
  .mm-rangee:focus-visible { outline: 2px solid #0089ba; outline-offset: -2px; }
  .mm-rangee + .mm-rangee::before {
    content: ''; position: absolute; top: 0; right: 0; left: 60px; height: 1px;
    background: rgba(60,60,67,0.18); transform: scaleY(0.5); transform-origin: 0 0;
  }
  .mm-icone {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 18px;
    box-shadow: inset 0 0 0 0.5px rgba(0,0,0,0.06);
  }
  .mm-lien { background: none; border: none; padding: 6px 2px; font: inherit; font-size: 17px; color: #0089ba; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: opacity 120ms ease-out; }
  .mm-lien:active { opacity: 0.4; transition: none; }
  .mm-anneau { transition: stroke-dashoffset 900ms ${COURBE_RESSORT}; }
  .mm-titre-compact { font-size: 17px; font-weight: 600; letter-spacing: -0.02em; opacity: 0; transform: translateY(4px); transition: opacity 200ms ease-out, transform 260ms ${COURBE_RESSORT}; }
  .mm-titre-compact.visible { opacity: 1; transform: none; }
  .mm-barre-haut .mm-filet { position: absolute; left: 0; right: 0; bottom: 0; height: 0.5px; background: rgba(60,60,67,0.29); opacity: 0; transition: opacity 200ms ease-out; }
  .mm-barre-haut.defile .mm-filet { opacity: 1; }
  .mm-roue { width: 22px; height: 22px; border-radius: 50%; border: 2.5px solid rgba(60,60,67,0.18); border-top-color: rgba(60,60,67,0.6); animation: mm-tourne 0.9s linear infinite; }
  @keyframes mm-tourne { to { transform: rotate(360deg); } }
  .mm-surtitre { letter-spacing: 0.06em; text-transform: uppercase; }

  .mm-barre-haut {
    position: sticky; top: 0; z-index: 10;
    background: rgba(242,242,247,0.8);
    -webkit-backdrop-filter: blur(20px) saturate(180%); backdrop-filter: blur(20px) saturate(180%);
  }

  .mm-fond { transition: transform 420ms ${COURBE_RESSORT}, filter 420ms ${COURBE_RESSORT}; transform-origin: 50% 0; }
  .mm-fond.recule { transform: scale(0.93) translateY(env(safe-area-inset-top, 0px)); filter: brightness(0.8); border-radius: 12px; overflow: hidden; }
  .mm-voile { position: fixed; inset: 0; z-index: 49; background: rgba(9,15,25,0.35); opacity: 0; transition: opacity 420ms ${COURBE_RESSORT}; pointer-events: none; }
  .mm-voile.visible { opacity: 1; }

  .mm-feuille {
    position: fixed; left: 0; right: 0; bottom: 0; top: calc(env(safe-area-inset-top, 0px) + 10px);
    z-index: 50; display: flex; flex-direction: column; background: #f2f2f7;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif; -webkit-font-smoothing: antialiased;
    border-radius: 12px 12px 0 0; overflow: hidden;
    transform: translate3d(0, 100%, 0); will-change: transform;
    transition: transform 420ms ${COURBE_RESSORT};
    box-shadow: 0 -12px 40px rgba(9,15,25,0.18);
  }
  .mm-feuille.ouverte { transform: translate3d(0, 0, 0); }
  .mm-feuille.glisse { transition: none; }
  .mm-feuille-entete {
    position: relative; z-index: 1; touch-action: none; cursor: grab;
    background: rgba(249,249,249,0.86);
    -webkit-backdrop-filter: blur(20px) saturate(180%); backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(17,21,27,0.06);
  }
  .mm-feuille-entete:active { cursor: grabbing; }
  .mm-poignee { width: 36px; height: 5px; border-radius: 3px; background: rgba(60,60,67,0.3); margin: 0 auto 2px; }

  .mm-ecran-accueil {
    min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: max(32px, env(safe-area-inset-top)) 20px max(32px, env(safe-area-inset-bottom));
  }
  .mm-icone-app {
    width: 84px; height: 84px; border-radius: 19px; background: #fff; display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06); margin: 0 auto 22px;
  }
  .mm-champs { background: #fff; border-radius: 12px; overflow: hidden; }
  .mm-champ-ios {
    display: block; width: 100%; box-sizing: border-box; border: none; outline: none; background: #fff;
    padding: 14px 16px; font: inherit; font-size: 17px; color: #000; letter-spacing: -0.01em;
  }
  .mm-champ-ios::placeholder { color: rgba(60,60,67,0.3); }
  .mm-champ-ios + .mm-champ-ios {
    background-image: linear-gradient(rgba(60,60,67,0.2), rgba(60,60,67,0.2));
    background-size: calc(100% - 16px) 1px; background-position: 16px 0; background-repeat: no-repeat;
  }
  .mm-champ-ios:focus { background-color: #fafafc; }
  .mm-bouton {
    width: 100%; min-height: 50px; border: none; border-radius: 12px; background: #0089ba; color: #fff;
    font: inherit; font-size: 17px; font-weight: 600; letter-spacing: -0.02em; cursor: pointer;
    transition: transform 100ms ease-out, opacity 120ms ease-out; -webkit-tap-highlight-color: transparent;
  }
  .mm-bouton:active { transform: scale(0.97); opacity: 0.8; }
  .mm-bouton:disabled { opacity: 0.45; cursor: default; transform: none; }
  .mm-bouton:focus-visible { outline: 2px solid #0089ba; outline-offset: 3px; }
  .mm-pied-formulaire { font-size: 13px; color: #6e6e73; line-height: 1.4; padding: 8px 16px 0; }
  .mm-erreur { font-size: 13px; color: #d70015; padding: 8px 16px 0; }

  .mm-toast {
    position: fixed; left: 50%; z-index: 60; bottom: max(20px, env(safe-area-inset-bottom));
    max-width: calc(100% - 32px); padding: 12px 18px; border-radius: 14px;
    color: #fff; font-size: 15px; font-weight: 600; letter-spacing: -0.01em;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif;
    background: rgba(28,28,30,0.82);
    -webkit-backdrop-filter: blur(20px) saturate(180%); backdrop-filter: blur(20px) saturate(180%);
    box-shadow: 0 12px 32px rgba(0,0,0,0.25);
    transform: translate3d(-50%, 0, 0) scale(1); opacity: 1;
    transition: transform 380ms ${COURBE_RESSORT}, opacity 240ms ease-out;
  }
  .mm-toast.cache { transform: translate3d(-50%, 24px, 0) scale(0.96); opacity: 0; }

  @media (prefers-reduced-motion: reduce) {
    .mm-pressable, .mm-pressable:active, .mm-bouton:active { transform: none; }
    .mm-fond, .mm-fond.recule { transform: none; transition: filter 200ms ease; }
    .mm-feuille { transform: none; opacity: 0; transition: opacity 200ms ease; }
    .mm-feuille.ouverte { opacity: 1; }
    .mm-progression, .mm-anneau { transition: none; }
    .mm-titre-compact { transform: none; }
    .mm-roue { animation-duration: 2.4s; }
    .mm-toast, .mm-toast.cache { transform: translate3d(-50%, 0, 0); transition: opacity 200ms ease; }
  }
  @media (prefers-reduced-transparency: reduce) {
    .mm-barre-haut, .mm-feuille-entete { background: #fff; -webkit-backdrop-filter: none; backdrop-filter: none; }
    .mm-toast { background: #14161a; -webkit-backdrop-filter: none; backdrop-filter: none; }
  }
`

function sauverSession(session) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
}

// ── Connexion ─────────────────────────────────────────────────────────────
function Connexion({ onLogin, depuisQr }) {
  const [login, setLogin] = useState(depuisQr?.identifiant || '')
  const [code, setCode] = useState('')
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(false)
  const codeRef = useRef(null)

  const seConnecter = useCallback(async (identifiant, codeSaisi) => {
    if (!identifiant.trim() || !codeSaisi.trim()) return
    setChargement(true); setErreur('')
    const row = await apiGetCollaborateurByLogin(identifiant.trim().toLowerCase(), codeSaisi.trim())
    if (!row) {
      setChargement(false)
      setErreur(depuisQr?.code ? 'Ce QR code n\'est plus valable. Demande à ton formateur d\'en afficher un nouveau.' : 'Identifiant ou code incorrect.')
      return
    }
    const magasins = await sbSelect('magasins', `id=eq.${row.magasin_id}&select=id,nom`)
    setChargement(false)
    const session = {
      id: row.id, prenom: row.prenom, nom: row.nom, poste: row.poste,
      magasinNom: magasins?.[0]?.nom || '—', doitChangerCode: row.doit_changer_code,
    }
    sauverSession(session)
    onLogin(session)
  }, [onLogin, depuisQr])

  // QR code du formateur : connexion directe s'il contient le code provisoire,
  // sinon identifiant prérempli et curseur dans le champ du code.
  useEffect(() => {
    if (depuisQr?.identifiant && depuisQr?.code) seConnecter(depuisQr.identifiant, depuisQr.code)
    else if (depuisQr?.identifiant) codeRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = e => {
    e.preventDefault()
    if (!chargement) seConnecter(login, code)
  }

  return (
    <main className="mm-ios mm-ecran-accueil">
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 400 }} noValidate>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div className="mm-icone-app">
            <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={60} height={40} style={{ objectFit: 'contain' }} />
          </div>
          <h1 className="mm-grand-titre">Mes modules</h1>
          <p style={{ fontSize: 15, color: '#6e6e73', margin: '8px 0 0', lineHeight: 1.4 }}>Tes formations après la formation, à ton rythme.</p>
        </div>
        <div className="mm-champs">
          <label htmlFor="mm-login" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Identifiant</label>
          <input id="mm-login" className="mm-champ-ios" value={login} onChange={e => setLogin(e.target.value)} placeholder="Identifiant" autoCapitalize="off" autoCorrect="off" spellCheck={false} autoComplete="username" enterKeyHint="next" />
          <label htmlFor="mm-code" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Code</label>
          <input id="mm-code" ref={codeRef} className="mm-champ-ios" value={code} onChange={e => setCode(e.target.value)} placeholder="Code" type="password" autoComplete="current-password" enterKeyHint="go" />
        </div>
        {erreur
          ? <div role="alert" className="mm-erreur">{erreur}</div>
          : <div className="mm-pied-formulaire">Ton manager ou ton formateur t&apos;a donné ton identifiant et ton code provisoire.</div>}
        <button type="submit" disabled={chargement || !login.trim() || !code.trim()} className="mm-bouton" style={{ marginTop: 24 }}>
          {chargement ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </main>
  )
}

// ── Choix du code personnel (1re connexion) ──────────────────────────────
function ChangerCode({ session, onChanged }) {
  const [code1, setCode1] = useState('')
  const [code2, setCode2] = useState('')
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code1)) { setErreur('Le code doit contenir exactement 6 chiffres.'); return }
    if (code1 !== code2) { setErreur('Les deux codes ne correspondent pas.'); return }
    setEnregistrement(true); setErreur('')
    const ok = await apiChangerCode(session.id, code1)
    setEnregistrement(false)
    if (!ok) { setErreur('Le code n\'a pas pu être enregistré. Vérifie ta connexion et réessaie.'); return }
    const maj = { ...session, doitChangerCode: false }
    sauverSession(maj)
    onChanged(maj)
  }

  return (
    <main className="mm-ios mm-ecran-accueil">
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 400 }} noValidate>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div className="mm-icone-app" style={{ background: 'linear-gradient(180deg, #4aa3ff, #0a84ff)' }}>
            <svg width="38" height="38" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2.5" fill="#fff" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </div>
          <h1 className="mm-grand-titre" style={{ fontSize: 28 }}>Ton code personnel</h1>
          <p style={{ fontSize: 15, color: '#6e6e73', margin: '8px 0 0', lineHeight: 1.4 }}>Choisis 6 chiffres à garder pour tes prochaines connexions.</p>
        </div>
        <div className="mm-champs">
          <input id="mm-code1" className="mm-champ-ios" aria-label="Nouveau code" value={code1} onChange={e => setCode1(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Nouveau code" type="password" inputMode="numeric" autoComplete="new-password" enterKeyHint="next" />
          <input id="mm-code2" className="mm-champ-ios" aria-label="Confirme le code" value={code2} onChange={e => setCode2(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Confirme le code" type="password" inputMode="numeric" autoComplete="new-password" enterKeyHint="done" />
        </div>
        {erreur
          ? <div role="alert" className="mm-erreur">{erreur}</div>
          : <div className="mm-pied-formulaire">{code1.length}/6 chiffres</div>}
        <button type="submit" disabled={enregistrement || code1.length !== 6 || code2.length !== 6} className="mm-bouton" style={{ marginTop: 24 }}>
          {enregistrement ? 'Enregistrement…' : 'Valider mon code'}
        </button>
      </form>
    </main>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────
const STATUTS = {
  'acquis': { label: 'Acquis', color: '#248a3d' },
  'en-cours': { label: 'En cours', color: '#c93400' },
  'a-faire': { label: 'À faire', color: '#8e8e93' },
}

// Icône de chaque module, façon Réglages iOS : un pictogramme sur un carré
// arrondi coloré (couleurs système iOS).
const ICONES = {
  'proximite': ['👓', '#5e5ce6', '#7d7aff'],
  'clariteens': ['🧒', '#30b0c7', '#5ac8de'],
  'zenprotect': ['💻', '#30d158', '#5fe07d'],
  'traitements': ['✨', '#0a84ff', '#4aa3ff'],
  'progressif': ['🔭', '#bf5af2', '#d084f5'],
  'troisieme-paire': ['🛍️', '#ff9f0a', '#ffb840'],
  'transposition': ['🔁', '#ff375f', '#ff6482'],
  'granit': ['🧾', '#ff453a', '#ff6f66'],
}

function IconeModule({ id }) {
  const [glyphe, c1, c2] = ICONES[id] || ['📘', '#8e8e93', '#aeaeb2']
  return (
    <span className="mm-icone" aria-hidden="true" style={{ background: `linear-gradient(180deg, ${c2}, ${c1})` }}>
      <span style={{ filter: 'saturate(0.9)' }}>{glyphe}</span>
    </span>
  )
}

function CarteNiveau({ nbAcquis, nbOuverts }) {
  const niveau = niveauPour(nbAcquis)
  const suivant = prochainNiveau(nbAcquis)
  const ratio = nbOuverts ? nbAcquis / nbOuverts : 0
  // L'anneau part de 0 puis se remplit jusqu'à la valeur : on voit le progrès.
  const [affiche, setAffiche] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setAffiche(ratio))
    return () => cancelAnimationFrame(id)
  }, [ratio])
  const rayon = 30
  const circonference = 2 * Math.PI * rayon
  return (
    <div className="mm-groupe" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, marginBottom: 28 }}>
      <div style={{ position: 'relative', width: 76, height: 76, flexShrink: 0 }}>
        <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="38" cy="38" r={rayon} fill="none" stroke="#e5e5ea" strokeWidth="8" />
          <circle
            className="mm-anneau" cx="38" cy="38" r={rayon} fill="none" stroke={niveau.couleur} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circonference} strokeDashoffset={circonference * (1 - affiche)}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
          {nbAcquis}<span style={{ color: '#8e8e93', fontWeight: 500 }}>/{nbOuverts}</span>
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#6e6e73' }}>Mon niveau</div>
        <div className="mm-titre" style={{ fontSize: 22, fontWeight: 700, color: niveau.couleur, marginTop: 1 }}>{niveau.nom}</div>
        <div style={{ fontSize: 13, color: '#6e6e73', lineHeight: 1.4, marginTop: 4 }}>
          {suivant
            ? `Encore ${suivant.min - nbAcquis} module${suivant.min - nbAcquis > 1 ? 's' : ''} acquis pour passer ${suivant.nom}.`
            : 'Niveau maximum atteint, bravo !'}
        </div>
      </div>
    </div>
  )
}

function LigneModule({ module, etat, onOuvrir }) {
  const statut = STATUTS[statutModule(etat)]
  return (
    <button onClick={onOuvrir} className="mm-rangee">
      <IconeModule id={module.id} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, color: '#000', letterSpacing: '-0.01em', lineHeight: 1.25 }}>{module.nom}</div>
        <div style={{ fontSize: 13, color: '#8e8e93', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          Entraînement {etat.formats.size}/{NB_FORMATS}
          {etat.meilleurScore !== null && ` · Test ${etat.meilleurScore}/12`}
        </div>
      </div>
      <span style={{ fontSize: 15, color: statut.color, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        {statut.label === 'Acquis' && (
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#34c759" /><path d="M4.6 8.3l2.2 2.2 4.6-4.8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        )}
        {statut.label}
      </span>
      <svg width="8" height="13" viewBox="0 0 8 13" aria-hidden="true" style={{ flexShrink: 0 }}><path d="M1.5 1.5l5 5-5 5" fill="none" stroke="#c4c4c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  )
}

// Projection de l'élan (même formule que le défilement d'iOS) : où la
// feuille s'arrêterait si on la lâchait avec cette vitesse.
function projeterElan(vitesse, deceleration = 0.998) {
  return (vitesse / 1000) * deceleration / (1 - deceleration)
}
// Résistance progressive quand on tire la feuille au-delà du haut.
function elastique(depassement, dimension, constante = 0.55) {
  return (depassement * dimension * constante) / (dimension + constante * Math.abs(depassement))
}

function LecteurModule({ module, etat, onFerme, onMessage, onVisibilite }) {
  const iframeRef = useRef(null)
  const feuilleRef = useRef(null)
  const glisseRef = useRef(null)
  const [ouverte, setOuverte] = useState(false)
  // L'URL est figée à l'ouverture : la mettre à jour rechargerait le module en
  // plein exercice. L'état initial vient de la base (bridge-avant.js).
  const [src] = useState(() => {
    const p = new URLSearchParams({ m: module.id, faits: [...etat.formats].join(','), acquis: etat.acquis ? '1' : '0' })
    // En production, Vercel sert les .html sans extension (granit.html →
    // /granit/) ; `next dev` ne sert que le chemin exact du fichier.
    const chemin = process.env.NODE_ENV === 'development' ? module.fichier : `${module.id}/`
    return `/modules-apres-formation/${chemin}?${p}`
  })

  // Entrée : on laisse le navigateur peindre la feuille hors écran, puis on
  // la fait monter (sinon la transition ne joue pas).
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setOuverte(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  useEffect(() => { onVisibilite(ouverte) }, [ouverte, onVisibilite])

  // Sortie par le même chemin que l'entrée, puis démontage.
  const fermer = useCallback(() => {
    const el = feuilleRef.current
    if (el) { el.classList.remove('glisse'); el.style.transform = '' }
    setOuverte(false)
    const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(onFerme, reduit ? 200 : 420)
  }, [onFerme])

  useEffect(() => {
    const ecouter = event => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = event.data
      if (!data || data.source !== 'lpt-module' || data.module !== module.id) return
      onMessage(data)
    }
    window.addEventListener('message', ecouter)
    return () => window.removeEventListener('message', ecouter)
  }, [module.id, onMessage])

  // Glisser l'en-tête vers le bas pour fermer : la feuille suit le doigt 1:1,
  // puis l'élan décide (fermer ou revenir), pas seulement la position.
  const surPointerDown = e => {
    if (e.target.closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    glisseRef.current = { y0: e.clientY, dy: 0, historique: [{ y: e.clientY, t: e.timeStamp }], engage: false }
  }
  const surPointerMove = e => {
    const g = glisseRef.current
    if (!g) return
    let dy = e.clientY - g.y0
    if (!g.engage) {
      if (Math.abs(dy) < 10) return
      g.engage = true
      feuilleRef.current.classList.add('glisse')
    }
    if (dy < 0) dy = elastique(dy, window.innerHeight)
    g.dy = dy
    g.historique.push({ y: e.clientY, t: e.timeStamp })
    if (g.historique.length > 6) g.historique.shift()
    feuilleRef.current.style.transform = `translate3d(0, ${dy}px, 0)`
  }
  const surPointerUp = () => {
    const g = glisseRef.current
    glisseRef.current = null
    if (!g?.engage) return
    const premier = g.historique[0]
    const dernier = g.historique[g.historique.length - 1]
    const duree = Math.max(1, dernier.t - premier.t)
    const vitesse = ((dernier.y - premier.y) / duree) * 1000 // px/s
    const arrivee = g.dy + projeterElan(vitesse)
    const el = feuilleRef.current
    el.classList.remove('glisse')
    if (arrivee > window.innerHeight * 0.35 && vitesse > -50) {
      // Ferme en partant de la position actuelle, dans le sens du geste.
      el.style.transform = ''
      fermer()
    } else {
      el.style.transform = ''
    }
  }

  return (
    <div ref={feuilleRef} className={`mm-feuille${ouverte ? ' ouverte' : ''}`} role="dialog" aria-modal="true" aria-label={module.nom}>
      <div
        className="mm-feuille-entete"
        onPointerDown={surPointerDown}
        onPointerMove={surPointerMove}
        onPointerUp={surPointerUp}
        onPointerCancel={surPointerUp}
        style={{ padding: '6px 16px 8px' }}
      >
        <div className="mm-poignee" aria-hidden="true" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 8 }}>
          <button onClick={fermer} className="mm-lien" aria-label="Fermer le module et revenir à mes modules" style={{ justifySelf: 'start' }}>Fermer</button>
          <div style={{ fontSize: 17, fontWeight: 600, color: '#000', letterSpacing: '-0.02em', maxWidth: '60vw', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{module.nom}</div>
          <span />
        </div>
      </div>
      <iframe ref={iframeRef} src={src} title={module.nom} style={{ flex: 1, width: '100%', border: 0, display: 'block', background: '#f2f2f7' }} />
    </div>
  )
}

function Dashboard({ session, onLogout }) {
  const [resultats, setResultats] = useState(null)
  const [ouverts, setOuverts] = useState([])
  const [moduleOuvert, setModuleOuvert] = useState(null)
  const [feuilleVisible, setFeuilleVisible] = useState(false)
  const [alerte, setAlerte] = useState(null)
  const [alerteVisible, setAlerteVisible] = useState(false)
  const minuteurAlerte = useRef(null)

  // Le message entre et sort par le même chemin (bas de l'écran).
  const montrerAlerte = useCallback((texte, duree) => {
    clearTimeout(minuteurAlerte.current)
    setAlerte(texte)
    requestAnimationFrame(() => setAlerteVisible(true))
    minuteurAlerte.current = setTimeout(() => {
      setAlerteVisible(false)
      minuteurAlerte.current = setTimeout(() => setAlerte(null), 400)
    }, duree)
  }, [])
  useEffect(() => () => clearTimeout(minuteurAlerte.current), [])

  const charger = useCallback(async () => {
    const [fiche, res] = await Promise.all([getCollaborateurById(session.id), getResultatsModules(session.id)])
    setOuverts(modulesOuverts(fiche))
    setResultats(res)
  }, [session.id])

  useEffect(() => { charger() }, [charger])

  // Le formateur ouvre les modules depuis sa fiche, souvent pendant que le
  // collaborateur a la page ouverte : on rafraîchit régulièrement la liste
  // (hors module en cours, pour ne jamais recharger un exercice).
  useEffect(() => {
    if (moduleOuvert) return
    const rafraichir = () => { if (document.visibilityState === 'visible') charger() }
    const t = setInterval(rafraichir, 20000)
    document.addEventListener('visibilitychange', rafraichir)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', rafraichir) }
  }, [moduleOuvert, charger])

  const surMessage = useCallback(async message => {
    const ok = await enregistrerResultatModule(session.id, message)
    if (!ok) {
      montrerAlerte('⚠️ Ton résultat n\'a pas pu être enregistré. Préviens ton formateur.', 6000)
      return
    }
    if (message.type === 'test') {
      const reussi = message.score >= 10
      // Vibration courte seulement pour un vrai succès (si le téléphone le permet).
      if (reussi) { try { navigator.vibrate?.(18) } catch {} }
      montrerAlerte(reussi ? `✅ Test réussi : ${message.score}/12, module acquis !` : `Test enregistré : ${message.score}/12`, 4000)
    }
    charger()
  }, [session.id, charger, montrerAlerte])

  const surFermetureModule = useCallback(() => { setModuleOuvert(null); charger() }, [charger])

  // Grand titre façon iOS : quand il passe sous la barre du haut, son nom
  // apparaît en petit dans la barre et un filet la sépare du contenu.
  const grandTitreRef = useRef(null)
  const [titreCompact, setTitreCompact] = useState(false)
  useEffect(() => {
    const el = grandTitreRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([entree]) => setTitreCompact(!entree.isIntersecting), { rootMargin: '-56px 0px 0px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const etats = etatModules(resultats || [])
  const nbAcquis = ouverts.filter(id => etats[id]?.acquis).length
  const moduleActif = MODULES.find(m => m.id === moduleOuvert && ouverts.includes(m.id))
  const groupesVisibles = MODULE_GROUPES
    .map(g => ({ ...g, modules: g.modules.filter(m => ouverts.includes(m.id)) }))
    .filter(g => g.modules.length)

  return (
    <>
    <div className={`mm-ios mm-fond${feuilleVisible ? ' recule' : ''}`} aria-hidden={feuilleVisible || undefined} style={{ minHeight: '100dvh' }}>
      <div className={`mm-barre-haut${titreCompact ? ' defile' : ''}`} style={{ padding: '6px 16px', paddingTop: 'max(6px, env(safe-area-inset-top))' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', minHeight: 44 }}>
          <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={84} height={30} style={{ objectFit: 'contain', objectPosition: 'left' }} />
          <div className={`mm-titre-compact${titreCompact ? ' visible' : ''}`} aria-hidden="true">Mes modules</div>
          <button onClick={onLogout} className="mm-lien" style={{ justifySelf: 'end' }}>Déconnexion</button>
        </div>
        <div className="mm-filet" aria-hidden="true" />
      </div>
      <div style={{ padding: '14px 16px 48px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ padding: '0 4px', marginBottom: 20 }}>
            <h1 ref={grandTitreRef} className="mm-grand-titre">Mes modules</h1>
            <div style={{ fontSize: 15, color: '#6e6e73', marginTop: 4 }}>
              Bonjour {session.prenom} 👋 · {session.poste ? `${session.poste} · ` : ''}{session.magasinNom}
            </div>
          </div>

          {resultats === null ? (
            <div role="status" aria-label="Chargement" style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><div className="mm-roue" /></div>
          ) : ouverts.length === 0 ? (
            <div className="mm-groupe" style={{ textAlign: 'center', padding: '36px 24px' }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, background: 'linear-gradient(180deg, #4aa3ff, #0a84ff)' }}>🎓</div>
              <div className="mm-titre" style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Tes modules arrivent bientôt</div>
              <div style={{ fontSize: 15, color: '#6e6e73', lineHeight: 1.45 }}>Ton formateur va t&apos;ouvrir tes premiers modules. Ils apparaîtront ici automatiquement.</div>
            </div>
          ) : (
            <>
              <CarteNiveau nbAcquis={nbAcquis} nbOuverts={ouverts.length} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {groupesVisibles.map(groupe => (
                  <section key={groupe.titre}>
                    <div className="mm-section-titre">{groupe.titre}</div>
                    <div className="mm-groupe">
                      {groupe.modules.map(m => (
                        <LigneModule key={m.id} module={m} etat={etats[m.id]} onOuvrir={() => setModuleOuvert(m.id)} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              <p style={{ fontSize: 13, color: '#6e6e73', margin: '10px 16px 0', lineHeight: 1.4 }}>
                Chaque module : un cours, des exercices d&apos;entraînement, puis un test. Il faut 10/12 au test pour l&apos;acquérir.
              </p>
            </>
          )}
        </div>
      </div>
    </div>

      {/* Le fond recule et s'assombrit sous la feuille : on comprend qu'on est
          « dans » le module et qu'on y reviendra en le refermant. */}
      <div className={`mm-voile${feuilleVisible ? ' visible' : ''}`} aria-hidden="true" />
      {moduleActif && resultats !== null && (
        <LecteurModule
          key={moduleActif.id}
          module={moduleActif}
          etat={etats[moduleActif.id]}
          onFerme={surFermetureModule}
          onMessage={surMessage}
          onVisibilite={setFeuilleVisible}
        />
      )}

      {alerte && (
        <div role="status" className={`mm-toast${alerteVisible ? '' : ' cache'}`}>
          {alerte}
        </div>
      )}
    </>
  )
}

export default function MesModulesPage() {
  const [session, setSession] = useState(undefined)
  const [depuisQr, setDepuisQr] = useState(null)

  // Raccourci « Sur l'écran d'accueil » : sans ça, le téléphone reprend le
  // manifeste général de l'app et le raccourci s'ouvre sur l'accueil (choix
  // manager / formateur / collaborateur…) au lieu de /mes-modules.
  useEffect(() => {
    const lien = document.querySelector('link[rel="manifest"]')
    const titre = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    const couleur = document.querySelector('meta[name="theme-color"]')
    const avant = { lien: lien?.getAttribute('href'), titre: titre?.getAttribute('content'), couleur: couleur?.getAttribute('content') }
    lien?.setAttribute('href', '/manifest-mes-modules.json')
    titre?.setAttribute('content', 'Mes modules')
    couleur?.setAttribute('content', '#f2f2f7')
    return () => {
      if (avant.lien) lien?.setAttribute('href', avant.lien)
      if (avant.titre) titre?.setAttribute('content', avant.titre)
      if (avant.couleur) couleur?.setAttribute('content', avant.couleur)
    }
  }, [])

  // Safari iOS n'applique :active (retour visuel au toucher) que si la page
  // écoute les touchers.
  useEffect(() => {
    const rien = () => {}
    document.addEventListener('touchstart', rien, { passive: true })
    return () => document.removeEventListener('touchstart', rien)
  }, [])

  useEffect(() => {
    let annule = false
    ;(async () => {
      // QR code de connexion affiché par le formateur : on lit l'identifiant
      // (et le code provisoire), puis on les retire aussitôt de l'adresse.
      const params = new URLSearchParams(window.location.search)
      const qr = params.get('identifiant') ? { identifiant: params.get('identifiant'), code: params.get('code') || null } : null
      if (qr) {
        try { window.history.replaceState(null, '', window.location.pathname) } catch {}
        // Téléphone déjà connecté avec quelqu'un d'autre : on repart de zéro.
        try { localStorage.removeItem(SESSION_KEY) } catch {}
        setDepuisQr(qr)
        setSession(null)
        return
      }
      let brut = null
      try { brut = localStorage.getItem(SESSION_KEY) } catch {}
      if (!brut) { if (!annule) setSession(null); return }
      let enCache = null
      try { enCache = JSON.parse(brut) } catch {}
      if (!enCache?.id) { if (!annule) setSession(null); return }
      // Revérifie à chaque chargement : un code régénéré par le formateur
      // redemande le choix d'un code personnel.
      const frais = await getCollaborateurById(enCache.id)
      if (annule) return
      if (!frais) { setSession(enCache); return }
      const maj = { ...enCache, doitChangerCode: frais.doit_changer_code }
      sauverSession(maj)
      setSession(maj)
    })()
    return () => { annule = true }
  }, [])

  const onLogout = () => {
    try { localStorage.removeItem(SESSION_KEY) } catch {}
    setSession(null)
  }

  if (session === undefined) return null
  let ecran
  if (!session) ecran = <Connexion onLogin={setSession} depuisQr={depuisQr} />
  else if (session.doitChangerCode) ecran = <ChangerCode session={session} onChanged={setSession} />
  else ecran = <Dashboard session={session} onLogout={onLogout} />
  return (
    <>
      <style>{STYLES}</style>
      {ecran}
    </>
  )
}
