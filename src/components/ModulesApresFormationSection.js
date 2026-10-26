'use client'
import { useState, useEffect } from 'react'
import { getCollaborateurDbId } from '@/lib/notesCollaborateurApi'
import { getCollaborateurById } from '@/lib/collaborateursApi'
import {
  MODULE_GROUPES, MODULES, NB_FORMATS, niveauPour, etatModules, statutModule,
  getResultatsModules, creerAccesModules, modulesOuverts, changerOuvertureModule,
} from '@/lib/modulesApresFormation'

// Fiche collaborateur du suivi magasin (formateur uniquement) : accès à
// /mes-modules, ouverture des modules un par un et résultats. Lecture seule
// sur les résultats ; les seules écritures sont le code d'accès et la liste
// des modules ouverts, à la demande du formateur.

function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

const STATUTS = {
  'acquis': { label: '✓ Acquis', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  'en-cours': { label: 'En cours', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  'a-faire': { label: 'À faire', color: 'var(--text-m)', bg: 'var(--dh-badge-bg)' },
}

function BlocAcces({ collab, onCree }) {
  const [creation, setCreation] = useState(false)
  const [acces, setAcces] = useState(null)
  const [erreur, setErreur] = useState(null)

  const generer = async () => {
    setCreation(true); setErreur(null)
    const res = await creerAccesModules(collab)
    setCreation(false)
    if (!res) { setErreur('L\'accès n\'a pas pu être créé. Réessaie dans un instant.'); return }
    setAcces(res)
    onCree()
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Accès à « Mes modules »</div>
      {acces ? (
        <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.7 }}>
          <div>Adresse : <strong>/mes-modules</strong></div>
          <div>Identifiant : <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{acces.login}</strong></div>
          <div>Code provisoire : <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 16 }}>{acces.code}</strong></div>
          <div style={{ fontSize: 12, color: 'var(--text-m)', marginTop: 4 }}>Donne-lui ces informations : il choisira son propre code à 6 chiffres à la 1re connexion. Ce code provisoire ne sera plus affiché ensuite.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13.5, color: 'var(--text)' }}>
            {collab.login
              ? <>Identifiant : <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{collab.login}</strong>{collab.doit_changer_code ? ' · code provisoire pas encore changé' : ' · code personnel choisi'}</>
              : 'Pas encore d\'accès.'}
          </div>
          <button onClick={generer} disabled={creation} className="btn2" style={{ padding: '6px 12px', fontSize: 12 }}>
            {creation ? 'Création…' : collab.login ? '🔑 Nouveau code provisoire' : '🔑 Créer son accès'}
          </button>
        </div>
      )}
      {erreur && <div style={{ fontSize: 12.5, color: '#f87171', marginTop: 8 }}>{erreur}</div>}
    </div>
  )
}

function InterrupteurOuverture({ ouvert, enCours, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={ouvert}
      onClick={e => { e.stopPropagation(); if (!enCours) onChange(!ouvert) }}
      title={ouvert ? 'Le collaborateur voit ce module. Cliquer pour le fermer.' : 'Le collaborateur ne voit pas ce module. Cliquer pour l\'ouvrir.'}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '5px 10px 5px 6px',
        borderRadius: 20, border: `1px solid ${ouvert ? 'rgba(0,137,186,0.35)' : 'var(--border)'}`,
        background: ouvert ? 'rgba(0,171,233,0.10)' : 'transparent', cursor: enCours ? 'default' : 'pointer',
        fontFamily: 'inherit', opacity: enCours ? 0.6 : 1,
      }}
    >
      <span style={{ width: 30, height: 18, borderRadius: 10, background: ouvert ? '#00abe9' : '#c7cbd1', position: 'relative', transition: 'background .15s' }}>
        <span style={{ position: 'absolute', top: 2, left: ouvert ? 14 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .15s' }} />
      </span>
      <span style={{ fontSize: 11.5, fontWeight: 700, color: ouvert ? '#0089ba' : 'var(--text-m)' }}>{ouvert ? 'Ouvert' : 'Fermé'}</span>
    </button>
  )
}

function LigneModuleFormateur({ module, etat, estOuvert, enCours, onChangerOuverture }) {
  const [ouvert, setOuvert] = useState(false)
  const statut = STATUTS[statutModule(etat)]
  const derniere = etat.tentatives[0]
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={() => etat.tentatives.length && setOuvert(!ouvert)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexWrap: 'wrap', cursor: etat.tentatives.length ? 'pointer' : 'default', textAlign: 'left' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{module.nom}</div>
          <div style={{ fontSize: 12, color: 'var(--text-m)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            Entraînement {etat.formats.size}/{NB_FORMATS}
            {' · '}{etat.tentatives.length} test{etat.tentatives.length > 1 ? 's' : ''}
            {etat.meilleurScore !== null && ` · meilleur ${etat.meilleurScore}/12`}
            {etat.derniereActivite && ` · ${fmtDate(etat.derniereActivite)}`}
          </div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: statut.color, background: statut.bg, flexShrink: 0 }}>{statut.label}</span>
        <InterrupteurOuverture ouvert={estOuvert} enCours={enCours} onChange={onChangerOuverture} />
        {etat.tentatives.length > 0 && <span style={{ color: 'var(--text-m)', flexShrink: 0, transform: ouvert ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>›</span>}
      </div>
      {ouvert && derniere && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: 'var(--text-m)', fontVariantNumeric: 'tabular-nums' }}>
            Tentatives : {etat.tentatives.map(t => `${t.score}/12 (${fmtDate(t.created_at)})`).join(' · ')}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Détail du dernier test — {derniere.score}/12</div>
          {(derniere.details || []).map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>
              <span style={{ fontWeight: 800, color: d.correct ? '#16a34a' : '#ef4444', flexShrink: 0 }}>{d.correct ? '✓' : '✗'}</span>
              <span>{d.libelle}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ModulesApresFormationSection({ store, collaborateur }) {
  const [collab, setCollab] = useState(undefined)
  const [resultats, setResultats] = useState([])
  const [moduleEnCours, setModuleEnCours] = useState(null)
  const [erreurOuverture, setErreurOuverture] = useState(null)

  const changerOuverture = async (moduleId, ouvrir) => {
    setModuleEnCours(moduleId); setErreurOuverture(null)
    const liste = await changerOuvertureModule(collab.id, moduleId, ouvrir)
    setModuleEnCours(null)
    if (!liste) { setErreurOuverture('Le changement n\'a pas pu être enregistré. Réessaie dans un instant.'); return }
    setCollab(c => ({ ...c, modules_ouverts: liste }))
  }

  const charger = async () => {
    const id = await getCollaborateurDbId(store.id, collaborateur.id)
    if (!id) { setCollab(null); return }
    const [fiche, res] = await Promise.all([getCollaborateurById(id), getResultatsModules(id)])
    setCollab(fiche)
    setResultats(res)
  }

  useEffect(() => {
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id, collaborateur.id])

  if (!collab) return null

  const etats = etatModules(resultats)
  const nbAcquis = MODULES.filter(m => etats[m.id].acquis).length
  const niveau = niveauPour(nbAcquis)
  const ouverts = modulesOuverts(collab)

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>🎓 Modules après-formation</h3>
        <div style={{ fontSize: 13, color: 'var(--text-m)', fontVariantNumeric: 'tabular-nums' }}>
          <strong style={{ color: niveau.couleur }}>{niveau.nom}</strong> · {ouverts.length} ouvert{ouverts.length > 1 ? 's' : ''} · {nbAcquis} acquis
        </div>
      </div>
      <BlocAcces collab={collab} onCree={charger} />
      <p style={{ fontSize: 12.5, color: 'var(--text-m)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Le collaborateur ne voit que les modules que tu ouvres pour lui. Ouvre-les au fur et à mesure de ton accompagnement.
      </p>
      {erreurOuverture && <div style={{ fontSize: 12.5, color: '#f87171', marginBottom: 10 }}>{erreurOuverture}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {MODULE_GROUPES.map(groupe => (
          <div key={groupe.titre}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{groupe.titre}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {groupe.modules.map(m => (
                <LigneModuleFormateur
                  key={m.id}
                  module={m}
                  etat={etats[m.id]}
                  estOuvert={ouverts.includes(m.id)}
                  enCours={moduleEnCours === m.id}
                  onChangerOuverture={ouvrir => changerOuverture(m.id, ouvrir)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
