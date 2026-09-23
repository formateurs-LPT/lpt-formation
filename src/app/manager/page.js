'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getManagerFromDB, getWeeklySharedState, sbSelect, pgInList } from '@/lib/supabase'
import { STORES } from '@/lib/storeFollowupData'
import { mergeEntreesIntoRoster } from '@/lib/storeRosterMerge'
import { matchMagasinKey } from '@/lib/managersData'
import { classifyMagasin } from '@/lib/formationCategories'
import { useStoreFollowupProgress } from '@/lib/useStoreFollowupProgress'
import { SectionsList, CollaborateurFiche, StoreHeader } from '@/components/StoreFollowupShared'
import TrainingRegistrationTile from '@/components/TrainingRegistrationTile'
import {
  getMagasinIdBySlug, getNouveauxCollaborateurs, getCollaborateursEnAttenteValidation,
  declencherTestSortie, validerNouvelEntrant,
} from '@/lib/collaborateursApi'
import { getReportingsHebdo } from '@/lib/notesTerrainApi'
import DemandesInterventionView from '@/components/DemandesInterventionView'

// Page autonome (comme /rapport, /bilan-formation) — aucune dépendance à
// page.js/Dashboard.js, donc aucun risque pour le flux formateur/participant/TV.
const SESSION_KEY = 'manager_session' // { login, magasin, displayName }

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 12,
  background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  transition: 'border-color .2s, background .2s',
}

function ManagerLogin({ onLogin }) {
  const [login, setLogin] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!login.trim() || !code.trim() || loading) return
    setLoading(true)
    setError('')
    const row = await getManagerFromDB(login.trim().toLowerCase(), code.trim())
    setLoading(false)
    if (!row) { setError('Identifiant ou code incorrect.'); return }
    const session = { login: row.login, magasin: row.magasin, displayName: row.display_name }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
    onLogin(session)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'linear-gradient(160deg,#0f1923 0%,#1a2535 60%,#00abe9 100%)',
    }}>
      <form onSubmit={submit} style={{
        background: 'linear-gradient(175deg,#0099d0 0%,#0d2538 42%,#091520 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, width: '100%', maxWidth: 400,
        boxShadow: '0 28px 80px rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 260, height: 260, background: 'rgba(0,171,233,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ padding: '36px 36px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={140} height={52} style={{ objectFit: 'contain', margin: '0 auto 20px' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>Suivi magasin</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Espace manager</h2>
        </div>

        <div style={{ padding: '4px 36px 36px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Connexion</div>
          <input
            value={login}
            onChange={e => setLogin(e.target.value)}
            placeholder="Identifiant"
            autoCapitalize="off"
            autoCorrect="off"
            style={inputStyle}
          />
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Code magasin"
            type="password"
            inputMode="numeric"
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '9px 12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: 18, padding: '13px', border: 'none', borderRadius: 12,
            fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', color: '#fff',
            cursor: loading ? 'default' : 'pointer', transition: 'all .2s',
            background: loading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #0089ba, #00abe9)',
            boxShadow: loading ? 'none' : '0 6px 22px rgba(0,171,233,0.35)',
          }}>{loading ? 'Connexion…' : 'Se connecter →'}</button>
        </div>
      </form>
    </div>
  )
}

// Nouveaux entrants (entrees_data pour ce magasin) avec un lien direct vers
// leur compte rendu de formation déjà envoyé par mail — un candidat sans
// rapport pas encore rempli est simplement omis de la tuile.
function NewHiresTile({ store, entreesData }) {
  const [reports, setReports] = useState(null) // null = chargement

  const candidates = (entreesData || []).filter(e => matchMagasinKey(e.magasin) === store.id)
  const fullNames = candidates.map(e => e.fullName || `${e.nom} ${e.prenom}`).filter(Boolean)
  const namesKey = fullNames.join('|')

  useEffect(() => {
    let cancelled = false
    if (!fullNames.length) { setReports({}); return }
    sbSelect('formation_reports', `collaborateur=in.(${pgInList(fullNames)})&order=updated_at.desc`).then(rows => {
      if (cancelled) return
      const byName = {}
      for (const r of (rows || [])) if (!byName[r.collaborateur]) byName[r.collaborateur] = r
      setReports(byName)
    }).catch(() => { if (!cancelled) setReports({}) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey])

  if (reports === null) return null
  const withReport = candidates
    .map(e => ({ entree: e, report: reports[e.fullName || `${e.nom} ${e.prenom}`] }))
    .filter(x => x.report)

  if (!withReport.length) return null

  const categoryKey = classifyMagasin(store.label)

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>🆕 Nouveaux collaborateurs</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {withReport.map(({ entree, report }) => (
          <a
            key={report.id}
            href={`/rapport/?c=${encodeURIComponent(report.collaborateur)}&w=${report.week_date}&t=${encodeURIComponent(report.trainer_name)}&cat=${categoryKey}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', background: 'rgba(0,171,233,0.08)', border: '1px solid rgba(0,171,233,0.3)',
              borderRadius: 14, padding: '14px 18px', minWidth: 200, textDecoration: 'none',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{entree.prenom} {entree.nom}</div>
            <div style={{ fontSize: 11, color: '#7dd3fc' }}>📋 Voir le compte rendu →</div>
          </a>
        ))}
      </div>
    </div>
  )
}

// ── Nouvel entrant → test de sortie (nouveau schéma collaborateurs) ──────
// Distinct de NewHiresTile ci-dessus (qui vient de l'ancien système
// entrees_data + comptes rendus de formation) : ici on pilote le statut
// 'nouveau' → déclenchement du test → validation manager, sur la nouvelle
// table `collaborateurs`.
function NouvelEntrantSection({ collaborateurs, onDeclencher }) {
  if (!collaborateurs.length) return null
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>🎓 Nouveaux entrants — test de sortie</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {collaborateurs.map(c => (
          <div key={c.id} style={{
            background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.35)',
            borderRadius: 16, padding: '16px 20px', minWidth: 240, flex: '1 1 260px',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{c.prenom} {c.nom}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>{c.poste}</div>
            {c.test_declenche_at ? (
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fbbf24' }}>⏳ Test en cours…</div>
            ) : (
              <button onClick={() => onDeclencher(c.id)} style={{
                width: '100%', padding: '10px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>Déclencher le test de sortie</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// Modale de validation — un nouvel entrant a fini son test, le manager doit
// accuser réception avant qu'il ne rejoigne officiellement l'équipe (statut
// 'actif'). Traite les collaborateurs en attente un par un.
function ValidationNouvelEntrantModal({ collaborateur, onValider }) {
  const [saving, setSaving] = useState(false)
  if (!collaborateur) return null

  const handleOk = async () => {
    setSaving(true)
    await onValider(collaborateur.id)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
        padding: '32px', width: '100%', maxWidth: 440, textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
        <p style={{ fontSize: 15, color: '#fff', lineHeight: 1.6, marginBottom: 24 }}>
          <strong>{collaborateur.prenom}</strong> vient de finir son test de fin de formation,
          il va être ajouté à la liste de vos collaborateurs.
        </p>
        <button onClick={handleOk} disabled={saving} style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #0089ba, #00abe9)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
          opacity: saving ? 0.6 : 1,
        }}>{saving ? '…' : 'OK'}</button>
      </div>
    </div>
  )
}

// Écran temporaire affiché après déclenchement du test — le test de sortie
// lui-même (contenu, quiz) sera construit dans un prochain script.
function TestEnCoursPage({ collaborateur, onBack }) {
  return (
    <div id="dashboard" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Chantier en cours</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginBottom: 28 }}>
          Le test de sortie de <strong>{collaborateur.prenom}</strong> arrive bientôt. Revenez un peu plus tard.
        </p>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
          color: 'rgba(255,255,255,0.75)', padding: '10px 22px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>← Retour</button>
      </div>
    </div>
  )
}

function fmtDateLongFr(isoDate) {
  if (!isoDate) return '—'
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Lecture seule — même requête réutilisable (getReportingsHebdo, filtrable
// par magasin_id) que celle prévue pour DR/directeur retail au script 5 ;
// rien de spécifique au rôle manager n'est codé ici.
function HistoriqueReportingsSection({ reportings }) {
  const [selected, setSelected] = useState(null)
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 14px' }}>📊 Historique des reportings</h3>
      {reportings.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontStyle: 'italic' }}>Aucun reporting pour l&apos;instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reportings.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} style={{
              textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                Semaine du {fmtDateLongFr(r.semaine_debut)} au {fmtDateLongFr(r.semaine_fin)}
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                {r.auteur} {r.envoye_at ? '· envoyé' : '· non envoyé'}
              </div>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18,
            padding: 26, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', marginBottom: 4 }}>{selected.auteur}</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 14 }}>
              Semaine du {fmtDateLongFr(selected.semaine_debut)} au {fmtDateLongFr(selected.semaine_fin)}
            </h3>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 18 }}>
              {selected.contenu_genere}
            </div>
            <button onClick={() => setSelected(null)} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.75)', padding: '9px 18px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

function ManagerDashboard({ session, onLogout }) {
  const [entreesData, setEntreesData] = useState([])
  const [sectionId, setSectionId] = useState(null)
  const [collaborateurId, setCollaborateurId] = useState(null)
  const [magasinId, setMagasinId] = useState(null)
  const [nouveauxEntrants, setNouveauxEntrants] = useState([])
  const [enAttenteValidation, setEnAttenteValidation] = useState([])
  const [testEnCoursCollab, setTestEnCoursCollab] = useState(null)
  const [reportings, setReportings] = useState([])

  useEffect(() => {
    let cancelled = false
    getWeeklySharedState().then(state => {
      if (!cancelled) setEntreesData(state?.entrees_data || [])
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const refreshNouvelEntrant = async (id) => {
    const [nouveaux, attente] = await Promise.all([
      getNouveauxCollaborateurs(id),
      getCollaborateursEnAttenteValidation(id),
    ])
    setNouveauxEntrants(nouveaux)
    setEnAttenteValidation(attente)
  }

  useEffect(() => {
    let cancelled = false
    getMagasinIdBySlug(session.magasin).then(id => {
      if (cancelled || !id) return
      setMagasinId(id)
      refreshNouvelEntrant(id)
      getReportingsHebdo(id).then(r => { if (!cancelled) setReportings(r) })
    }).catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.magasin])

  const handleDeclencherTest = async (collabId) => {
    await declencherTestSortie(collabId)
    const collab = nouveauxEntrants.find(c => c.id === collabId)
    setTestEnCoursCollab(collab || null)
    if (magasinId) refreshNouvelEntrant(magasinId)
  }

  const handleValiderEntrant = async (collabId) => {
    await validerNouvelEntrant(collabId)
    if (magasinId) refreshNouvelEntrant(magasinId)
  }

  const { progress, history, saveError, setScore, saveNote, reset } = useStoreFollowupProgress(session.magasin, session.displayName)

  if (testEnCoursCollab) {
    return <TestEnCoursPage collaborateur={testEnCoursCollab} onBack={() => setTestEnCoursCollab(null)} />
  }

  const baseStore = STORES.find(s => s.id === session.magasin)
  if (!baseStore) {
    return (
      <div id="dashboard">
        <div className="dash-wrap">
          <p style={{ color: '#f87171' }}>Magasin introuvable ({session.magasin}). Contactez votre formateur.</p>
        </div>
      </div>
    )
  }

  const store = mergeEntreesIntoRoster(baseStore, entreesData)
  const firstName = (session.displayName || '').split(' ')[0]
  const section = store.sections.find(s => s.id === sectionId) || null
  const collaborateur = section?.collaborateurs.find(c => c.id === collaborateurId) || null

  if (collaborateur && section) {
    return (
      <div id="dashboard">
        {saveError && (
          <div style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
            background: '#dc2626', color: '#fff', padding: '10px 20px', borderRadius: 12,
            fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            ⚠️ Échec de la sauvegarde — la table Supabase existe-t-elle ? Ce changement n&apos;est pas enregistré.
          </div>
        )}
        <CollaborateurFiche
          store={store}
          sectionId={sectionId}
          collaborateur={collaborateur}
          progress={progress}
          history={history}
          onSetScore={(itemId, score) => setScore(collaborateurId, itemId, score)}
          onSaveNote={(itemId, note) => saveNote(collaborateurId, itemId, note)}
          onReset={(itemId) => reset(collaborateurId, itemId)}
          onBack={() => setCollaborateurId(null)}
          role="manager"
        />
      </div>
    )
  }

  return (
    <div id="dashboard">
      <div className="dash-wrap">
        <StoreHeader
          store={store}
          progress={progress}
          subtitle={`Bonjour ${firstName} 👋`}
          right={
            <button onClick={onLogout} style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: 10,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', height: 'fit-content', flexShrink: 0,
            }}>Se déconnecter</button>
          }
        />

        {magasinId && (
          <div style={{
            background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 16, padding: '18px 20px', marginBottom: 4,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              🆘 Demandes d&apos;intervention
            </h3>
            <DemandesInterventionView
              magasinIds={[magasinId]} login={session.login} role="manager"
              canCreate magasinId={magasinId} magasinNom={store.label}
            />
          </div>
        )}

        <TrainingRegistrationTile store={store} session={session} />

        <NouvelEntrantSection collaborateurs={nouveauxEntrants} onDeclencher={handleDeclencherTest} />

        <NewHiresTile store={store} entreesData={entreesData} />

        <SectionsList
          store={store}
          progress={progress}
          onSelectCollaborateur={(secId, collabId) => { setSectionId(secId); setCollaborateurId(collabId) }}
        />

        <HistoriqueReportingsSection reportings={reportings} />
      </div>

      {enAttenteValidation.length > 0 && (
        <ValidationNouvelEntrantModal collaborateur={enAttenteValidation[0]} onValider={handleValiderEntrant} />
      )}
    </div>
  )
}

export default function ManagerPage() {
  const [session, setSession] = useState(undefined) // undefined = pas encore lu, null = pas connecté

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      setSession(raw ? JSON.parse(raw) : null)
    } catch { setSession(null) }
  }, [])

  if (session === undefined) return null
  if (!session) return <ManagerLogin onLogin={setSession} />
  return <ManagerDashboard session={session} onLogout={() => { try { localStorage.removeItem(SESSION_KEY) } catch {}; setSession(null) }} />
}
