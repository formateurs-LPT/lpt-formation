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

function ManagerDashboard({ session, onLogout }) {
  const [entreesData, setEntreesData] = useState([])
  const [sectionId, setSectionId] = useState(null)
  const [collaborateurId, setCollaborateurId] = useState(null)

  useEffect(() => {
    let cancelled = false
    getWeeklySharedState().then(state => {
      if (!cancelled) setEntreesData(state?.entrees_data || [])
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const { progress, history, saveError, setScore, saveNote, reset } = useStoreFollowupProgress(session.magasin, session.displayName)

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

        <TrainingRegistrationTile store={store} session={session} />

        <NewHiresTile store={store} entreesData={entreesData} />

        <SectionsList
          store={store}
          progress={progress}
          onSelectCollaborateur={(secId, collabId) => { setSectionId(secId); setCollaborateurId(collabId) }}
        />
      </div>
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
