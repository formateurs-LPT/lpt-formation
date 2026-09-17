'use client'
import { useState, useEffect } from 'react'
import { getManagerFromDB, getWeeklySharedState, sbSelect, pgInList } from '@/lib/supabase'
import { STORES } from '@/lib/storeFollowupData'
import { mergeEntreesIntoRoster } from '@/lib/storeRosterMerge'
import { matchMagasinKey } from '@/lib/managersData'
import { classifyMagasin } from '@/lib/formationCategories'
import { useStoreFollowupProgress } from '@/lib/useStoreFollowupProgress'
import { SectionsList, CollaborateurFiche, StoreHeader } from '@/components/StoreFollowupShared'

// Page autonome (comme /rapport, /bilan-formation) — aucune dépendance à
// page.js/Dashboard.js, donc aucun risque pour le flux formateur/participant/TV.
const SESSION_KEY = 'manager_session' // { login, magasin, displayName }

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '11px 14px', marginBottom: 12,
  background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
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
    <div id="dashboard" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <form onSubmit={submit} style={{
        background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
        padding: '36px 32px', width: '100%', maxWidth: 360,
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🏬</div>
        <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#fff' }}>Espace manager</h2>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Suivi des compétences de votre équipe</p>
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
          style={inputStyle}
        />
        {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <button type="submit" disabled={loading} style={{
          width: '100%', padding: '11px', background: '#00abe9', color: '#fff', border: 'none',
          borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
        }}>{loading ? 'Connexion…' : 'Se connecter'}</button>
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
