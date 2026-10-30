'use client'
import { useState, useEffect, useCallback } from 'react'
import { sbSelect } from '@/lib/supabase'
import { getOrCreateCollaborateurForEntree } from '@/lib/collaborateursApi'
import { QrConnexion } from '@/components/ModulesApresFormationSection'
import { collaborateurFullName } from '@/lib/storeFollowupData'
import {
  MODULE_GROUPES, MODULES, etatModules, statutModule, modulesOuverts, changerOuvertureModule, creerAccesModules,
} from '@/lib/modulesApresFormation'

// Onglet « Former mes collaborateurs » du manager : le catalogue des modules
// après-formation, et pour chacun l'envoi aux collaborateurs choisis (même
// colonne collaborateurs.modules_ouverts que l'interrupteur de la fiche).
// Un collaborateur du roster sans fiche en base (nouvel entrant) en reçoit
// une au premier envoi, comme sur la tuile « Nouveaux collaborateurs ».

const STATUTS = {
  'acquis': { label: 'Acquis', color: '#15803d', bg: '#dcfce7' },
  'en-cours': { label: 'En cours', color: '#c2410c', bg: '#ffedd5' },
  'a-faire': { label: 'Envoyé', color: '#0089ba', bg: '#eaf3fd' },
}

const carte = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14 }

function Puce({ statut }) {
  const s = STATUTS[statut]
  return <span style={{ fontSize: 11.5, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '2px 9px', whiteSpace: 'nowrap' }}>{s.label}</span>
}

function ModuleCarte({ module, personnes, ouvert, onBasculer, onEnvoyer, onRetirer, onOpenFiche, envoiEnCours }) {
  const [choix, setChoix] = useState(() => new Set())
  const recus = personnes.filter(p => p.ouverts.includes(module.id))
  const acquis = recus.filter(p => p.statuts[module.id] === 'acquis').length
  const aEnvoyer = personnes.filter(p => !p.ouverts.includes(module.id))
  const sections = [...new Set(aEnvoyer.map(p => p.sectionLabel))]

  const cocher = id => setChoix(c => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n })
  const cocherSection = label => setChoix(c => {
    const ids = aEnvoyer.filter(p => p.sectionLabel === label).map(p => p.key)
    const tous = ids.every(id => c.has(id))
    const n = new Set(c)
    ids.forEach(id => (tous ? n.delete(id) : n.add(id)))
    return n
  })
  const envoyer = async () => {
    await onEnvoyer(module, aEnvoyer.filter(p => choix.has(p.key)))
    setChoix(new Set())
  }

  return (
    <div style={{ ...carte, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#14161a' }}>{module.nom}</div>
          <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>
            {recus.length === 0 ? 'Envoyé à personne pour l\'instant' : `Envoyé à ${recus.length} · acquis par ${acquis}`}
          </div>
        </div>
        <button onClick={onBasculer} aria-expanded={ouvert} style={{
          background: ouvert ? '#f3f4f6' : '#0089ba', color: ouvert ? '#14161a' : '#fff', border: 'none', borderRadius: 20,
          padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>{ouvert ? 'Fermer' : 'Envoyer à…'}</button>
      </div>

      {ouvert && (
        <div style={{ borderTop: '1px solid #f0f1f3', padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {aEnvoyer.length > 0 ? (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>À qui l&apos;envoyer ?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sections.map(label => (
                  <div key={label}>
                    <button onClick={() => cocherSection(label)} style={{ background: 'none', border: 'none', padding: '2px 0', fontSize: 12.5, fontWeight: 700, color: '#0089ba', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {label} · tout cocher
                    </button>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {aEnvoyer.filter(p => p.sectionLabel === label).map(p => {
                        const coche = choix.has(p.key)
                        return (
                          <label key={p.key} style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 12px', borderRadius: 20, cursor: 'pointer',
                            border: `1.5px solid ${coche ? '#0089ba' : '#e5e7eb'}`, background: coche ? '#eaf3fd' : '#fff',
                            fontSize: 13, fontWeight: coche ? 700 : 500, color: '#14161a',
                          }}>
                            <input type="checkbox" checked={coche} onChange={() => cocher(p.key)} style={{ accentColor: '#0089ba', margin: 0 }} />
                            {p.nom}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={envoyer} disabled={!choix.size || envoiEnCours} style={{
                marginTop: 14, background: choix.size ? '#14161a' : '#e5e7eb', color: choix.size ? '#fff' : '#9aa1ac', border: 'none',
                borderRadius: 12, padding: '11px 18px', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
                cursor: choix.size && !envoiEnCours ? 'pointer' : 'default',
              }}>
                {envoiEnCours ? 'Envoi…' : choix.size ? `Envoyer à ${choix.size} collaborateur${choix.size > 1 ? 's' : ''}` : 'Coche les collaborateurs'}
              </button>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#6b7280' }}>Toute l&apos;équipe a déjà reçu ce module.</div>
          )}

          {recus.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Déjà envoyé à</div>
              {recus.map(p => (
                <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f6f8', flexWrap: 'wrap' }}>
                  <button onClick={() => onOpenFiche(p.sectionId, p.key)} style={{ flex: 1, minWidth: 140, textAlign: 'left', background: 'none', border: 'none', padding: 0, fontSize: 13.5, fontWeight: 600, color: '#14161a', cursor: 'pointer', fontFamily: 'inherit' }}>{p.nom}</button>
                  {!p.login && <span style={{ fontSize: 12, color: '#b45309' }}>pas encore d&apos;accès</span>}
                  <Puce statut={p.statuts[module.id]} />
                  {p.statuts[module.id] === 'a-faire' && (
                    <button onClick={() => onRetirer(module, p)} disabled={envoiEnCours} style={{ background: 'none', border: 'none', padding: '2px 4px', fontSize: 12, color: '#9aa1ac', cursor: 'pointer', fontFamily: 'inherit' }}>Retirer</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// QR code de connexion d'un collaborateur. Pas encore connecté : accès créé
// ou renouvelé (code provisoire dans le QR, il arrive connecté et choisit son
// code). Déjà connecté : identifiant seul, pour ne pas écraser son code.
async function preparerQr(p, magasinId) {
  if (p.connecte) return { login: p.login, code: null }
  const fiche = p.fiche || await getOrCreateCollaborateurForEntree(magasinId, p.prenom, p.nomFamille)
  return fiche ? await creerAccesModules(fiche) : null
}

/** Roster du magasin enrichi de la fiche en base, de l'accès et des modules. */
export function useEquipeModules(store, magasinId) {
  const [personnes, setPersonnes] = useState(null)
  const charger = useCallback(async () => {
    if (!magasinId || !store) return
    const fiches = await sbSelect('collaborateurs', `magasin_id=eq.${magasinId}&select=id,slug,prenom,nom,login,doit_changer_code,modules_ouverts`) || []
    const ids = fiches.map(f => f.id)
    const resultats = ids.length
      ? await sbSelect('module_resultats', `collaborateur_id=in.(${ids.join(',')})&select=collaborateur_id,module_id,type,format_id,score,reussi,created_at`) || []
      : []
    const parSlug = Object.fromEntries(fiches.map(f => [f.slug, f]))
    setPersonnes(store.sections.flatMap(s => s.collaborateurs.map(c => {
      const fiche = parSlug[c.id] || null
      const etats = etatModules(resultats.filter(r => r.collaborateur_id === fiche?.id))
      return {
        key: c.id, sectionId: s.id, sectionLabel: s.label, prenom: c.prenom, nomFamille: c.nom, nom: collaborateurFullName(c),
        fiche, login: fiche?.login || null, connecte: !!fiche?.login && !fiche.doit_changer_code, ouverts: modulesOuverts(fiche),
        statuts: Object.fromEntries(MODULES.map(m => [m.id, statutModule(etats[m.id])])),
      }
    })))
  }, [magasinId, store])
  useEffect(() => { charger() }, [charger])
  return { personnes, charger }
}

function LigneQr({ p, enCours, onQr }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: '1px solid #f5f6f8' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#14161a' }}>{p.nom}</div>
        <div style={{ fontSize: 12, color: p.connecte ? '#15803d' : '#9aa1ac' }}>
          {p.connecte ? 'Déjà connecté' : p.login ? 'Pas encore connecté' : 'Pas encore d\'accès'} · {p.sectionLabel}
        </div>
      </div>
      <button onClick={() => onQr(p)} disabled={!!enCours} style={{
        border: 'none', borderRadius: 20, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        whiteSpace: 'nowrap', background: '#0089ba', color: '#fff', opacity: enCours && enCours !== p.key ? 0.5 : 1,
      }}>{enCours === p.key ? '…' : 'QR code'}</button>
    </div>
  )
}

function useQr(magasinId, onChange) {
  const [enCours, setEnCours] = useState(null)
  const [qr, setQr] = useState(null)
  const [erreur, setErreur] = useState(null)
  const montrer = async (p) => {
    setEnCours(p.key); setErreur(null)
    const acces = await preparerQr(p, magasinId)
    setEnCours(null)
    if (!acces) { setErreur(`Le QR code de ${p.prenom} n'a pas pu être créé. Réessaie dans un instant.`); return }
    setQr({ ...acces, prenom: p.prenom })
    if (!p.connecte) onChange?.()
  }
  const fenetre = qr && <QrConnexion login={qr.login} code={qr.code} prenom={qr.prenom} onFermer={() => setQr(null)} />
  return { enCours, erreur, montrer, fenetre }
}

// Bloc « Accès à l'app » de l'onglet : les collaborateurs pas encore connectés.
function AccesEquipe({ personnes, magasinId, onChange }) {
  const [voirTous, setVoirTous] = useState(false)
  const { enCours, erreur, montrer, fenetre } = useQr(magasinId, onChange)
  const aConnecter = personnes.filter(p => !p.connecte)
  const liste = voirTous ? aConnecter : aConnecter.slice(0, 6)

  return (
    <div style={{ ...carte, padding: '16px 18px', marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a' }}>Accès à l&apos;app de ton équipe</div>
        <div style={{ fontSize: 13, color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>{personnes.length - aConnecter.length} sur {personnes.length} déjà connectés</div>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
        Montre-lui son QR code : il le scanne avec l&apos;appareil photo et il est connecté, puis il choisit son propre code. Le bouton « QR code de connexion » du menu est toujours à portée de main.
      </p>
      {erreur && <div role="status" style={{ marginTop: 12, fontSize: 13, color: '#991b1b' }}>{erreur}</div>}
      {aConnecter.length === 0 ? (
        <div style={{ marginTop: 12, fontSize: 13.5, fontWeight: 600, color: '#166534' }}>Toute l&apos;équipe est connectée.</div>
      ) : (
        <div style={{ marginTop: 12 }}>
          {liste.map(p => <LigneQr key={p.key} p={p} enCours={enCours} onQr={montrer} />)}
          {aConnecter.length > 6 && (
            <button onClick={() => setVoirTous(v => !v)} style={{ marginTop: 6, background: 'none', border: 'none', padding: '4px 0', fontSize: 13, fontWeight: 700, color: '#0089ba', cursor: 'pointer', fontFamily: 'inherit' }}>
              {voirTous ? 'Réduire' : `Voir les ${aConnecter.length} collaborateurs à connecter`}
            </button>
          )}
        </div>
      )}
      {fenetre}
    </div>
  )
}

// Fenêtre ouverte depuis le bouton « QR code de connexion » du menu, depuis
// n'importe quel écran : on cherche le collaborateur, on affiche son QR.
export function QrEquipeModal({ store, magasinId, onFermer }) {
  const { personnes, charger } = useEquipeModules(store, magasinId)
  const { enCours, erreur, montrer, fenetre } = useQr(magasinId, charger)
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    const echap = e => { if (e.key === 'Escape' && !fenetre) onFermer() }
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [onFermer, fenetre])

  const norm = t => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const filtres = (personnes || [])
    .filter(p => norm(p.nom).includes(norm(recherche.trim())))
    .sort((a, b) => Number(a.connecte) - Number(b.connecte))

  return (
    <div onClick={onFermer} role="dialog" aria-modal="true" aria-label="QR code de connexion" style={{
      position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(15,20,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(16,24,40,0.25)',
      }}>
        <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid #f0f1f3' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#14161a', flex: 1 }}>QR code de connexion</div>
            <button onClick={onFermer} aria-label="Fermer" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#9aa1ac', lineHeight: 1, padding: 4 }}>×</button>
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Choisis le collaborateur : il scanne son QR code avec l&apos;appareil photo.</div>
          <input
            type="search" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un collaborateur…" aria-label="Rechercher un collaborateur"
            style={{ marginTop: 12, width: '100%', boxSizing: 'border-box', padding: '10px 14px', borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 16, fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ overflowY: 'auto', padding: '4px 20px 14px' }}>
          {erreur && <div role="status" style={{ margin: '10px 0', fontSize: 13, color: '#991b1b' }}>{erreur}</div>}
          {!personnes ? (
            <div style={{ padding: '20px 0', fontSize: 13.5, color: '#9aa1ac' }}>Chargement…</div>
          ) : filtres.length === 0 ? (
            <div style={{ padding: '20px 0', fontSize: 13.5, color: '#9aa1ac' }}>Aucun collaborateur trouvé.</div>
          ) : filtres.map(p => <LigneQr key={p.key} p={p} enCours={enCours} onQr={montrer} />)}
        </div>
      </div>
      <div onClick={e => e.stopPropagation()}>{fenetre}</div>
    </div>
  )
}

export default function FormerCollaborateursPage({ store, magasinId, onOpenFiche }) {
  const { personnes, charger } = useEquipeModules(store, magasinId)
  const [moduleOuvert, setModuleOuvert] = useState(null)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [message, setMessage] = useState(null)


  const envoyer = async (module, choisis) => {
    setEnvoiEnCours(true); setMessage(null)
    const echecs = [], sansAcces = []
    for (const p of choisis) {
      const fiche = p.fiche || await getOrCreateCollaborateurForEntree(magasinId, p.prenom, p.nomFamille)
      const ok = fiche && await changerOuvertureModule(fiche.id, module.id, true)
      if (!ok) echecs.push(p.prenom)
      else if (!fiche.login) sansAcces.push(p.prenom)
    }
    await charger()
    setEnvoiEnCours(false)
    const nb = choisis.length - echecs.length
    setMessage({
      ok: !echecs.length,
      texte: [
        nb ? `« ${module.nom} » envoyé à ${nb} collaborateur${nb > 1 ? 's' : ''}.` : '',
        echecs.length ? `Échec pour ${echecs.join(', ')} : réessaie dans un instant.` : '',
        sansAcces.length ? `${sansAcces.join(', ')} ${sansAcces.length > 1 ? 'n\'ont' : 'n\'a'} pas encore d'accès à l'app : montre-lui son QR code (bouton « QR code de connexion » du menu).` : '',
      ].filter(Boolean).join(' '),
    })
  }

  const retirer = async (module, p) => {
    setEnvoiEnCours(true); setMessage(null)
    const ok = await changerOuvertureModule(p.fiche.id, module.id, false)
    await charger()
    setEnvoiEnCours(false)
    if (!ok) setMessage({ ok: false, texte: 'Le retrait n\'a pas pu être enregistré. Réessaie dans un instant.' })
  }

  return (
    <div style={{ maxWidth: 860 }}>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#14161a' }}>Former mes collaborateurs</h1>
      <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280', lineHeight: 1.5 }}>
        Choisis un module et envoie-le aux collaborateurs de ton choix : il apparaît dans leur espace « Mes modules ». Tu suis ensuite leur progression ici et dans leur fiche.
      </p>

      {message && (
        <div role="status" style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 12, fontSize: 13.5, lineHeight: 1.5,
          background: message.ok ? '#f0fdf4' : '#fef2f2', color: message.ok ? '#166534' : '#991b1b',
          border: `1px solid ${message.ok ? '#bbf7d0' : '#fecaca'}`,
        }}>{message.texte}</div>
      )}

      {personnes && <AccesEquipe personnes={personnes} magasinId={magasinId} onChange={charger} />}

      {!personnes ? (
        <div style={{ marginTop: 24, fontSize: 13.5, color: '#9aa1ac' }}>Chargement…</div>
      ) : (
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 22 }}>
          {MODULE_GROUPES.map(groupe => (
            <div key={groupe.titre}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{groupe.titre}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {groupe.modules.map(m => (
                  <ModuleCarte
                    key={m.id}
                    module={m}
                    personnes={personnes}
                    ouvert={moduleOuvert === m.id}
                    onBasculer={() => setModuleOuvert(o => (o === m.id ? null : m.id))}
                    onEnvoyer={envoyer}
                    onRetirer={retirer}
                    onOpenFiche={onOpenFiche}
                    envoiEnCours={envoiEnCours}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
