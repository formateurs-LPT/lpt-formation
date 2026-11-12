'use client'
import { useState, useEffect, useMemo } from 'react'
import qrcode from 'qrcode-generator'
import { getCollaborateurDbId } from '@/lib/notesCollaborateurApi'
import { getCollaborateurById, getMagasinIdBySlug, getOrCreateCollaborateurForEntree } from '@/lib/collaborateursApi'
import {
  MODULE_GROUPES, MODULES, NB_FORMATS, niveauPour, etatModules, statutModule,
  getResultatsModules, creerAccesModules, modulesOuverts, changerOuvertureModule, TEST_POSITIONNEMENT_ID, QUIZ_LEGENDE_ID,
} from '@/lib/modulesApresFormation'
import { TEST_NOM, TOTAL_QUESTIONS, dernierTest, bilanParTheme } from '@/lib/testPositionnement'
import { QUIZ_NOM, QUESTIONS_LEGENDE, dernierQuizLegende, explicationLegende } from '@/lib/quizLegende'

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

// QR code généré sur l'appareil du formateur (jamais via un service externe :
// il peut contenir le code provisoire). Le collaborateur le scanne avec
// l'appareil photo et arrive sur /mes-modules, identifiant prérempli — et
// connecté directement si le code provisoire est inclus.
export function QrConnexion({ login, code, prenom, onFermer }) {
  const svg = useMemo(() => {
    const params = new URLSearchParams({ identifiant: login })
    if (code) params.set('code', code)
    const qr = qrcode(0, 'M')
    qr.addData(`${window.location.origin}/mes-modules/?${params}`)
    qr.make()
    return qr.createSvgTag({ cellSize: 8, margin: 4, scalable: true })
  }, [login, code])

  useEffect(() => {
    const echap = e => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [onFermer])

  return (
    <div onClick={onFermer} role="dialog" aria-modal="true" aria-label={`QR code de connexion à Mes modules pour ${prenom}`} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 22, padding: '26px 22px 20px', width: '100%', maxWidth: 360, textAlign: 'center', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif", color: '#000' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0089ba', marginBottom: 2 }}>{prenom}</div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>Connexion à Mes modules</div>
        <div style={{ fontSize: 15, color: 'rgba(60,60,67,0.6)', marginTop: 6, lineHeight: 1.4 }}>
          {code ? 'À scanner avec l\'appareil photo : il sera connecté directement et choisira son code.' : 'À scanner avec l\'appareil photo : son identifiant sera déjà rempli, il tape son code.'}
        </div>
        <div style={{ margin: '20px auto 16px', width: 'min(260px, 100%)', aspectRatio: '1', padding: 0, background: '#fff', borderRadius: 14, boxShadow: '0 0 0 1px rgba(60,60,67,0.12)' }} dangerouslySetInnerHTML={{ __html: svg }} />
        <div style={{ fontSize: 13, color: 'rgba(60,60,67,0.6)' }}>Identifiant</div>
        <div style={{ fontSize: 17, fontWeight: 600, fontFamily: 'ui-monospace, Menlo, monospace' }}>{login}</div>
        <button onClick={onFermer} style={{ marginTop: 18, width: '100%', minHeight: 48, border: 'none', borderRadius: 12, background: 'rgba(118,118,128,0.12)', color: '#0089ba', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Fermer</button>
      </div>
    </div>
  )
}

function BlocAcces({ collab, onCree }) {
  const [creation, setCreation] = useState(false)
  const [acces, setAcces] = useState(null)
  const [erreur, setErreur] = useState(null)
  const [qrVisible, setQrVisible] = useState(false)

  const generer = async () => {
    setCreation(true); setErreur(null)
    const res = await creerAccesModules(collab)
    setCreation(false)
    if (!res) { setErreur('L\'accès n\'a pas pu être créé. Réessaie dans un instant.'); return }
    setAcces(res)
    setQrVisible(true)
    onCree()
  }

  const boutonQr = (
    <button onClick={() => setQrVisible(true)} className="btn2" style={{ padding: '6px 12px', fontSize: 12 }}>📱 QR code de connexion</button>
  )

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>Accès à « Mes modules »</div>
      {acces ? (
        <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.7 }}>
          <div>Adresse : <strong>/mes-modules</strong></div>
          <div>Identifiant : <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{acces.login}</strong></div>
          <div>Code provisoire : <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 16 }}>{acces.code}</strong></div>
          <div style={{ fontSize: 12, color: 'var(--text-m)', marginTop: 4 }}>Le plus simple : fais-lui scanner le QR code, il sera connecté directement et choisira son propre code à 6 chiffres. Ce code provisoire ne sera plus affiché ensuite.</div>
          <div style={{ marginTop: 8 }}>{boutonQr}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13.5, color: 'var(--text)' }}>
            {collab.login
              ? <>Identifiant : <strong style={{ fontFamily: 'ui-monospace, Menlo, monospace' }}>{collab.login}</strong>{collab.doit_changer_code ? ' · code provisoire pas encore changé' : ' · code personnel choisi'}</>
              : 'Pas encore d\'accès.'}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {collab.login && boutonQr}
            <button onClick={generer} disabled={creation} className="btn2" style={{ padding: '6px 12px', fontSize: 12 }}>
              {creation ? 'Création…' : collab.login ? '🔑 Nouveau code provisoire' : '🔑 Créer son accès'}
            </button>
          </div>
        </div>
      )}
      {erreur && <div style={{ fontSize: 12.5, color: '#f87171', marginTop: 8 }}>{erreur}</div>}
      {qrVisible && (acces?.login || collab.login) && (
        <QrConnexion
          login={acces?.login || collab.login}
          code={acces?.code || null}
          prenom={collab.prenom}
          onFermer={() => setQrVisible(false)}
        />
      )}
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

const NIVEAUX_THEME = {
  'non-maitrise': { label: 'Non maîtrisé', color: '#dc2626', bg: 'rgba(220,38,38,0.10)' },
  'a-revoir': { label: 'À revoir', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
}

// Test de positionnement : ouverture, puis bilan par thème et ouverture en
// un clic des modules qui travaillent les thèmes ratés.
function BlocTest({ collab, resultats, ouverts, enCours, onChangerOuverture }) {
  const [voirErreurs, setVoirErreurs] = useState(false)
  const testOuvert = (collab.modules_ouverts || []).includes(TEST_POSITIONNEMENT_ID)
  const test = dernierTest(resultats)
  const bilan = test ? bilanParTheme(test) : []
  const aRetravailler = bilan.filter(t => t.niveau !== 'maitrise').sort((a, b) => (a.niveau === b.niveau ? 0 : a.niveau === 'non-maitrise' ? -1 : 1))
  const maitrises = bilan.filter(t => t.niveau === 'maitrise')
  const conseilles = [...new Set(aRetravailler.flatMap(t => t.modulesApp.map(m => m.id)))].filter(id => !ouverts.includes(id))
  const erreurs = (test?.details || []).filter(d => !d.correct)

  const bouton = { padding: '6px 12px', fontSize: 12 }
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.6 }}>📝 {TEST_NOM}</div>
        <button
          onClick={() => onChangerOuverture(TEST_POSITIONNEMENT_ID, !testOuvert)} disabled={enCours === TEST_POSITIONNEMENT_ID}
          className="btn2" style={bouton}
        >{testOuvert ? 'Fermer le test' : test ? 'Lui rouvrir le test' : 'Lui ouvrir le test'}</button>
      </div>

      {!test && (
        <div style={{ fontSize: 13.5, color: 'var(--text)', marginTop: 8, lineHeight: 1.5 }}>
          {testOuvert
            ? `Ouvert : il apparaît en haut de son espace « Mes modules ». ${TOTAL_QUESTIONS} questions sur tous les thèmes.`
            : `État des lieux de ses connaissances : ${TOTAL_QUESTIONS} questions sur tous les thèmes de la formation initiale et des modules complémentaires. Le résultat s'affiche ici, avec les modules à lui ouvrir.`}
        </div>
      )}

      {test && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13.5, color: 'var(--text)' }}>
            Passé le {fmtDate(test.created_at)} · <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{test.score}/{test.total}</strong> ({Math.round((test.score / test.total) * 100)} %)
            {testOuvert && <span style={{ color: 'var(--text-m)' }}> · test rouvert, en attente</span>}
          </div>

          {aRetravailler.length > 0 ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>À retravailler ({aRetravailler.length} thème{aRetravailler.length > 1 ? 's' : ''})</div>
                {conseilles.length > 0 && (
                  <button onClick={async () => { for (const id of conseilles) await onChangerOuverture(id, true) }} disabled={!!enCours} className="btn2" style={bouton}>
                    Ouvrir les {conseilles.length} module{conseilles.length > 1 ? 's' : ''} conseillé{conseilles.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {aRetravailler.map(t => {
                  const n = NIVEAUX_THEME[t.niveau]
                  return (
                    <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 10px', borderRadius: 10, background: 'var(--dh-badge-bg)' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{t.nom}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-m)', fontVariantNumeric: 'tabular-nums' }}>
                          {t.justes}/{t.total} bonne{t.justes > 1 ? 's' : ''} réponse{t.justes > 1 ? 's' : ''} · {t.formation === 'initiale' ? 'formation initiale' : 'module complémentaire'}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: n.color, background: n.bg }}>{n.label}</span>
                      {t.modulesApp.length === 0 ? (
                        <span style={{ fontSize: 12, color: 'var(--text-m)' }}>À reprendre en formation</span>
                      ) : t.modulesApp.map(m => (
                        ouverts.includes(m.id)
                          ? <span key={m.id} style={{ fontSize: 12, fontWeight: 700, color: '#0089ba' }}>✓ {m.nom} ouvert</span>
                          : <button key={m.id} onClick={() => onChangerOuverture(m.id, true)} disabled={enCours === m.id} className="btn2" style={bouton}>Ouvrir « {m.nom} »</button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#16a34a' }}>Sans faute : tous les thèmes sont maîtrisés.</div>
          )}

          {maitrises.length > 0 && aRetravailler.length > 0 && (
            <div style={{ fontSize: 12.5, color: 'var(--text-m)', lineHeight: 1.5 }}>
              <strong style={{ color: '#16a34a' }}>Maîtrisés :</strong> {maitrises.map(t => t.nom).join(' · ')}
            </div>
          )}

          {erreurs.length > 0 && (
            <div>
              <button onClick={() => setVoirErreurs(v => !v)} style={{ background: 'none', border: 'none', padding: 0, fontSize: 12.5, fontWeight: 700, color: '#0089ba', cursor: 'pointer', fontFamily: 'inherit' }}>
                {voirErreurs ? 'Masquer ses erreurs' : `Voir ses ${erreurs.length} erreur${erreurs.length > 1 ? 's' : ''}`}
              </button>
              {voirErreurs && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {erreurs.map((d, i) => (
                    <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>
                      <div style={{ fontWeight: 700 }}><span style={{ color: '#ef4444' }}>✗</span> {d.libelle}</div>
                      <div style={{ color: 'var(--text-m)' }}>Sa réponse : {d.choisie || '—'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Quiz Légende : quiz expert, ouvert à la demande (souvent par le manager
// qui trouve les modules trop simples). Score et erreurs corrigées.
function BlocLegende({ collab, resultats, enCours, onChangerOuverture }) {
  const [voirErreurs, setVoirErreurs] = useState(false)
  const ouvert = (collab.modules_ouverts || []).includes(QUIZ_LEGENDE_ID)
  const quiz = dernierQuizLegende(resultats)
  const erreurs = (quiz?.details || []).filter(d => !d.correct)
  const bouton = { padding: '6px 12px', fontSize: 12 }
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-m)', textTransform: 'uppercase', letterSpacing: 0.6 }}>🏆 {QUIZ_NOM}</div>
        <button
          onClick={() => onChangerOuverture(QUIZ_LEGENDE_ID, !ouvert)} disabled={enCours === QUIZ_LEGENDE_ID}
          className="btn2" style={bouton}
        >{ouvert ? 'Fermer le quiz' : quiz ? 'Lui rouvrir le quiz' : 'Lui ouvrir le quiz'}</button>
      </div>

      {!quiz && (
        <div style={{ fontSize: 13.5, color: 'var(--text)', marginTop: 8, lineHeight: 1.5 }}>
          {ouvert
            ? `Ouvert : il apparaît en haut de son espace « Mes modules ». ${QUESTIONS_LEGENDE.length} questions niveau expert.`
            : `Quiz niveau expert : ${QUESTIONS_LEGENDE.length} questions pièges (transposition, délais, cas croisés, troisième paire, remboursement), avec la correction complète à la fin.`}
        </div>
      )}

      {quiz && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13.5, color: 'var(--text)' }}>
            Passé le {fmtDate(quiz.created_at)} · <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{quiz.score}/{quiz.total}</strong> ({Math.round((quiz.score / quiz.total) * 100)} %)
            {ouvert && <span style={{ color: 'var(--text-m)' }}> · quiz rouvert, en attente</span>}
          </div>
          {erreurs.length === 0 ? (
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#16a34a' }}>Sans faute : niveau légende atteint.</div>
          ) : (
            <div>
              <button onClick={() => setVoirErreurs(v => !v)} style={{ background: 'none', border: 'none', padding: 0, fontSize: 12.5, fontWeight: 700, color: '#0089ba', cursor: 'pointer', fontFamily: 'inherit' }}>
                {voirErreurs ? 'Masquer ses erreurs' : `Voir ses ${erreurs.length} erreur${erreurs.length > 1 ? 's' : ''}`}
              </button>
              {voirErreurs && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {erreurs.map((d, i) => (
                    <div key={i} style={{ fontSize: 12.5, lineHeight: 1.5, color: 'var(--text)' }}>
                      <div style={{ fontWeight: 700 }}><span style={{ color: '#ef4444' }}>✗</span> {d.libelle}</div>
                      <div style={{ color: 'var(--text-m)' }}>Sa réponse : {d.choisie || '—'}</div>
                      <div style={{ color: '#16a34a', fontWeight: 600 }}>Bonne réponse : {d.bonne}</div>
                      <div style={{ color: 'var(--text-m)' }}>{explicationLegende(d.id)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ModulesApresFormationSection({ store, collaborateur, creerFicheSiAbsente = false }) {
  const [collab, setCollab] = useState(undefined)
  const [creationFiche, setCreationFiche] = useState(false)
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

  // Test de positionnement en cours : le résultat apparaît dès qu'il est fini.
  const testEnAttente = !!collab?.modules_ouverts?.some(id => id === TEST_POSITIONNEMENT_ID || id === QUIZ_LEGENDE_ID)
  useEffect(() => {
    if (!testEnAttente) return
    const t = setInterval(charger, 15000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testEnAttente])

  // Nouvel entrant pas encore en base (roster fusionné depuis les entrées) :
  // côté manager, on propose de créer sa fiche, comme sur la tuile
  // « Nouveaux collaborateurs ».
  const creerFiche = async () => {
    setCreationFiche(true)
    const magasinId = await getMagasinIdBySlug(store.id)
    const fiche = magasinId && await getOrCreateCollaborateurForEntree(magasinId, collaborateur.prenom, collaborateur.nom)
    setCreationFiche(false)
    if (fiche) charger()
  }

  if (collab === null && creerFicheSiAbsente) {
    return (
      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px' }}>🎓 Modules après-formation</h3>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13.5, color: 'var(--text)' }}>{collaborateur.prenom} n&apos;a pas encore d&apos;espace modules.</div>
          <button onClick={creerFiche} disabled={creationFiche} className="btn2" style={{ padding: '6px 12px', fontSize: 12 }}>
            {creationFiche ? 'Préparation…' : 'Préparer son espace modules'}
          </button>
        </div>
      </div>
    )
  }

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
      <BlocTest collab={collab} resultats={resultats} ouverts={ouverts} enCours={moduleEnCours} onChangerOuverture={changerOuverture} />
      <BlocLegende collab={collab} resultats={resultats} enCours={moduleEnCours} onChangerOuverture={changerOuverture} />
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
