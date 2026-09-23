'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { sbSelect } from '@/lib/supabase'
import {
  getDirectorFromDB, getDirectorRegions, getMagasinsByRegionIds, getAllMagasins, getAllRegions,
  tauxMaitriseMoyen, createDemandeIntervention, isMagasinBelgique,
} from '@/lib/directionApi'
import { getReportingsHebdo } from '@/lib/notesTerrainApi'
import { STORES } from '@/lib/storeFollowupData'
import { mergeEntreesIntoRoster } from '@/lib/storeRosterMerge'
import { getWeeklySharedState } from '@/lib/supabase'
import { useStoreFollowupProgress } from '@/lib/useStoreFollowupProgress'
import { SectionsList, CollaborateurFiche, StoreHeader } from '@/components/StoreFollowupShared'
import DemandesInterventionView from '@/components/DemandesInterventionView'

const SESSION_KEY = 'direction_session' // { login, displayName, role, regions: [{id, nom}] }

// Formateurs Belgique = uniquement Thomas/Jonathan ; ailleurs = tous sauf eux.
const BELGIQUE_ONLY_LOGINS = ['thomas', 'jonathan']

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 12,
  background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
}

// ── Connexion ────────────────────────────────────────────────────────
function DirectionLogin({ onLogin }) {
  const [login, setLogin] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!login.trim() || !code.trim() || loading) return
    setLoading(true)
    setError('')
    const row = await getDirectorFromDB(login.trim().toLowerCase(), code.trim())
    if (!row) { setLoading(false); setError('Identifiant ou code incorrect.'); return }
    const regions = row.role === 'directeur_retail' ? [] : await getDirectorRegions(row.id)
    setLoading(false)
    const session = { id: row.id, login: row.login, displayName: row.display_name, role: row.role, regions }
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
        <div style={{ padding: '36px 36px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={140} height={52} style={{ objectFit: 'contain', margin: '0 auto 20px' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>Réseau</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Espace Direction</h2>
        </div>
        <div style={{ padding: '4px 36px 36px', position: 'relative', zIndex: 1 }}>
          <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Identifiant" autoCapitalize="off" autoCorrect="off" style={inputStyle} />
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Code" type="password" style={{ ...inputStyle, marginBottom: 0 }} />
          {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '9px 12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: 18, padding: '13px', border: 'none', borderRadius: 12,
            fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', color: '#fff', cursor: loading ? 'default' : 'pointer',
            background: loading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #0089ba, #00abe9)',
          }}>{loading ? 'Connexion…' : 'Se connecter →'}</button>
        </div>
      </form>
    </div>
  )
}

const TABS = [
  { id: 'apercu', label: 'Aperçu' },
  { id: 'magasins', label: 'Magasins' },
  { id: 'reportings', label: 'Reportings' },
  { id: 'demandes', label: "Demandes d'intervention" },
]

function TopBar({ title, subtitle, onLogout, onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
      <div>
        {onBack && <button onClick={onBack} className="detail-back" style={{ marginBottom: 6 }}>← Retour</button>}
        <h2 style={{ margin: 0 }}>{title}</h2>
        {subtitle && <p style={{ color: 'var(--text-s)', fontSize: 13, margin: '4px 0 0' }}>{subtitle}</p>}
      </div>
      <button onClick={onLogout} className="btn2">Se déconnecter</button>
    </div>
  )
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12.5, fontWeight: 700,
          background: active === t.id ? 'rgba(0,171,233,0.15)' : 'var(--card)',
          border: `1px solid ${active === t.id ? '#00abe9' : 'var(--border)'}`,
          color: active === t.id ? '#00abe9' : 'var(--text-s)',
        }}>{t.label}</button>
      ))}
    </div>
  )
}

function StatCards({ taux, magasinsCount }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#4ade80', marginBottom: 4 }}>{taux != null ? `${taux}%` : '—'}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-s)' }}>Taux de maîtrise moyen</div>
      </div>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#00abe9', marginBottom: 4 }}>{magasinsCount}</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-s)' }}>Magasins</div>
      </div>
    </div>
  )
}

function ReportingsList({ magasinIds }) {
  const [reportings, setReportings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const all = []
      for (const mId of magasinIds) all.push(...(await getReportingsHebdo(mId)))
      all.sort((a, b) => new Date(b.semaine_debut) - new Date(a.semaine_debut))
      if (!cancelled) { setReportings(all); setLoading(false) }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(magasinIds)])

  const fmtLong = (d) => new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  if (loading) return <p style={{ color: 'var(--text-s)' }}>Chargement…</p>
  if (reportings.length === 0) return <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucun reporting pour l&apos;instant.</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reportings.map(r => (
        <button key={r.id} onClick={() => setSelected(r)} style={{
          textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
          padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Semaine du {fmtLong(r.semaine_debut)}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-s)' }}>{r.auteur} {r.envoye_at ? '· envoyé' : '· non envoyé'}</div>
        </button>
      ))}
      {selected && (
        <div onClick={() => setSelected(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 26, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 14 }}>{selected.auteur} — Semaine du {fmtLong(selected.semaine_debut)}</h3>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 18 }}>{selected.contenu_genere}</div>
            <button onClick={() => setSelected(null)} className="btn2">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Vue magasin côté Direction (réutilise Suivi magasin + bouton demande) ──
function StoreDirectionView({ store: baseStore, session, onBack }) {
  const [entreesData, setEntreesData] = useState([])
  const [sectionId, setSectionId] = useState(null)
  const [collaborateurId, setCollaborateurId] = useState(null)
  const [showDemandeModal, setShowDemandeModal] = useState(false)
  const [trainers, setTrainers] = useState([])
  // Calculé depuis la vraie appartenance en base (magasin_regions), jamais
  // depuis le chemin de navigation emprunté pour arriver sur cette fiche.
  const [isBelgique, setIsBelgique] = useState(false)

  useEffect(() => {
    let cancelled = false
    getWeeklySharedState().then(state => { if (!cancelled) setEntreesData(state?.entrees_data || []) }).catch(() => {})
    sbSelect('trainers', 'select=id,login,display_name,active').then(rows => { if (!cancelled) setTrainers((rows || []).filter(t => t.active)) }).catch(() => {})
    if (baseStore.dbId) isMagasinBelgique(baseStore.dbId).then(v => { if (!cancelled) setIsBelgique(v) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseStore.dbId])

  const { progress, history, saveError, setScore, saveNote, reset } = useStoreFollowupProgress(baseStore.id, session.displayName)
  const store = mergeEntreesIntoRoster(baseStore, entreesData)
  const section = store.sections.find(s => s.id === sectionId) || null
  const collaborateur = section?.collaborateurs.find(c => c.id === collaborateurId) || null

  const formateurOptions = trainers.filter(t => isBelgique ? BELGIQUE_ONLY_LOGINS.includes(t.login) : !BELGIQUE_ONLY_LOGINS.includes(t.login))

  if (collaborateur && section) {
    return (
      <div className="dash-wrap">
        <CollaborateurFiche
          store={store} sectionId={sectionId} collaborateur={collaborateur} progress={progress} history={history}
          onSetScore={(itemId, score) => setScore(collaborateurId, itemId, score)}
          onSaveNote={(itemId, note) => saveNote(collaborateurId, itemId, note)}
          onReset={(itemId) => reset(collaborateurId, itemId)}
          onBack={() => setCollaborateurId(null)}
        />
      </div>
    )
  }

  return (
    <div className="dash-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
        <button className="detail-back" onClick={onBack}>← Magasins</button>
        <button onClick={() => setShowDemandeModal(true)} style={{
          background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.4)', color: '#fbbf24',
          padding: '9px 18px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>🆘 Demander l&apos;intervention d&apos;un formateur</button>
      </div>
      <StoreHeader store={store} progress={progress} subtitle="Vue Direction" />
      <SectionsList store={store} progress={progress} onSelectCollaborateur={(secId, collabId) => { setSectionId(secId); setCollaborateurId(collabId) }} />

      {showDemandeModal && (
        <DemandeInterventionModal
          magasinNom={store.label} magasinDbId={baseStore.dbId}
          formateurOptions={formateurOptions}
          session={session}
          onClose={() => setShowDemandeModal(false)}
        />
      )}
    </div>
  )
}

function DemandeInterventionModal({ magasinDbId, magasinNom, formateurOptions, session, onClose }) {
  const [motif, setMotif] = useState('')
  const [delai, setDelai] = useState('')
  const [actions, setActions] = useState('')
  const [formateurId, setFormateurId] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!magasinDbId) return
    setSaving(true)
    await createDemandeIntervention({
      magasinId: magasinDbId,
      demandeurLogin: session.login,
      demandeurRole: session.role,
      motif, delaiSouhaite: delai, actionsAttendues: actions,
      formateurSouhaiteId: formateurId || null,
    })
    setSaving(false)
    setDone(true)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480 }}>
        {done ? (
          <>
            <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>✅</div>
            <p style={{ color: '#fff', textAlign: 'center', marginBottom: 20 }}>Demande envoyée pour {magasinNom}.</p>
            <button onClick={onClose} className="gbtn" style={{ width: '100%' }}>Fermer</button>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Demander une intervention</h3>
            <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 18 }}>{magasinNom}</p>
            <textarea value={motif} onChange={e => setMotif(e.target.value)} placeholder="Motif" rows={2} className="finput" style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
            <input value={delai} onChange={e => setDelai(e.target.value)} placeholder="Délai souhaité (ex: sous 2 semaines)" className="finput" style={{ width: '100%', boxSizing: 'border-box' }} />
            <textarea value={actions} onChange={e => setActions(e.target.value)} placeholder="Actions attendues" rows={2} className="finput" style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 8 }}>Formateur souhaité</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              <button onClick={() => setFormateurId('')} style={{
                padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: formateurId === '' ? 'rgba(0,171,233,0.2)' : 'rgba(255,255,255,0.06)',
                border: `1px solid ${formateurId === '' ? '#00abe9' : 'rgba(255,255,255,0.15)'}`,
                color: formateurId === '' ? '#00abe9' : 'rgba(255,255,255,0.6)',
              }}>N&apos;importe lequel</button>
              {formateurOptions.map(t => (
                <button key={t.id} onClick={() => setFormateurId(t.id)} style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  background: formateurId === t.id ? 'rgba(0,171,233,0.2)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${formateurId === t.id ? '#00abe9' : 'rgba(255,255,255,0.15)'}`,
                  color: formateurId === t.id ? '#00abe9' : 'rgba(255,255,255,0.6)',
                }}>{t.display_name}</button>
              ))}
            </div>
            <button onClick={submit} disabled={saving} className="gbtn" style={{ width: '100%' }}>{saving ? 'Envoi…' : 'Envoyer la demande'}</button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Liste de magasins cliquable (région ou réseau) ─────────────────────
function MagasinsList({ magasins, onSelect }) {
  if (!magasins.length) return <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucun magasin.</p>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
      {magasins.map(m => (
        <button key={m.id} onClick={() => onSelect(m)} style={{
          textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
          padding: '16px 18px', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{m.nom}</div>
        </button>
      ))}
    </div>
  )
}

// Résout un magasin DB (nom/slug) vers une entrée STORES (roster local) si
// elle existe ; sinon, fiche vide mais navigable (pas encore de roster migré).
function resolveStoreForDirection(magasinDb) {
  const known = STORES.find(s => s.id === magasinDb.slug)
  if (known) return { ...known, dbId: magasinDb.id }
  return { id: magasinDb.slug, label: magasinDb.nom, dbId: magasinDb.id, sections: [{ id: 'equipe', label: 'Équipe', sub: '', collaborateurs: [] }] }
}

// ── Dashboard région (= directeur régional) ────────────────────────────
function RegionDashboard({ session, onLogout }) {
  const [tab, setTab] = useState('apercu')
  const [magasins, setMagasins] = useState([])
  const [taux, setTaux] = useState(null)
  const [selectedMagasin, setSelectedMagasin] = useState(null)

  const regionIds = session.regions.map(r => r.id)
  const isBelgique = session.regions.some(r => r.nom === 'Belgique et Lille')

  useEffect(() => {
    let cancelled = false
    getMagasinsByRegionIds(regionIds).then(async ms => {
      if (cancelled) return
      setMagasins(ms)
      setTaux(await tauxMaitriseMoyen(ms))
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(regionIds)])

  if (selectedMagasin) {
    return (
      <div id="dashboard">
        <StoreDirectionView store={resolveStoreForDirection(selectedMagasin)} session={session} onBack={() => setSelectedMagasin(null)} />
      </div>
    )
  }

  const magasinIds = magasins.map(m => m.id)

  return (
    <div id="dashboard">
      <div className="dash-wrap">
        <TopBar title={`📍 ${session.regions.map(r => r.nom).join(' · ')}`} subtitle={`Bonjour ${session.displayName}`} onLogout={onLogout} />
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'apercu' && (<><StatCards taux={taux} magasinsCount={magasins.length} /><MagasinsList magasins={magasins} onSelect={setSelectedMagasin} /></>)}
        {tab === 'magasins' && <MagasinsList magasins={magasins} onSelect={setSelectedMagasin} />}
        {tab === 'reportings' && <ReportingsList magasinIds={magasinIds} />}
        {tab === 'demandes' && <DemandesInterventionView magasinIds={magasinIds} login={session.login} role={session.role} canManage />}
      </div>
    </div>
  )
}

// ── Dashboard réseau entier (directeur retail) ─────────────────────────
function NetworkDashboard({ session, onLogout }) {
  const [tab, setTab] = useState('apercu')
  const [regions, setRegions] = useState([])
  const [magasins, setMagasins] = useState([])
  const [taux, setTaux] = useState(null)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [selectedMagasin, setSelectedMagasin] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [rs, ms] = await Promise.all([getAllRegions(), getAllMagasins()])
      if (cancelled) return
      const directionRegions = rs.filter(r => ['Sud Ouest', 'Sud Est', 'Belgique et Lille', 'Paris et Est', 'Paris et Ouest'].includes(r.nom))
      setRegions(directionRegions)
      setMagasins(ms)
      setTaux(await tauxMaitriseMoyen(ms))
    })()
    return () => { cancelled = true }
  }, [])

  const magasinIds = magasins.map(m => m.id)

  if (selectedMagasin) {
    return (
      <div id="dashboard">
        <StoreDirectionView store={resolveStoreForDirection(selectedMagasin)} session={session} onBack={() => setSelectedMagasin(null)} />
      </div>
    )
  }

  if (selectedRegion) {
    return (
      <div id="dashboard">
        <div className="dash-wrap">
          <TopBar title={`📍 ${selectedRegion.nom}`} onLogout={onLogout} onBack={() => setSelectedRegion(null)} />
          <RegionMagasinsBlock region={selectedRegion} onSelectMagasin={(m) => setSelectedMagasin(m)} />
        </div>
      </div>
    )
  }

  return (
    <div id="dashboard">
      <div className="dash-wrap">
        <TopBar title="🌐 Réseau — Direction Retail" subtitle={`Bonjour ${session.displayName}`} onLogout={onLogout} />
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
        {tab === 'apercu' && (
          <>
            <StatCards taux={taux} magasinsCount={magasins.length} />
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Régions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {regions.map(r => (
                <button key={r.id} onClick={() => setSelectedRegion(r)} style={{
                  textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14,
                  padding: '18px 20px', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{r.nom}</div>
                </button>
              ))}
            </div>
          </>
        )}
        {tab === 'magasins' && <MagasinsList magasins={magasins} onSelect={setSelectedMagasin} />}
        {tab === 'reportings' && <ReportingsList magasinIds={magasinIds} />}
        {tab === 'demandes' && <DemandesInterventionView login={session.login} role={session.role} canManage />}
      </div>
    </div>
  )
}

function RegionMagasinsBlock({ region, onSelectMagasin }) {
  const [magasins, setMagasins] = useState([])
  useEffect(() => { getMagasinsByRegionIds([region.id]).then(setMagasins) }, [region.id])
  return <MagasinsList magasins={magasins} onSelect={onSelectMagasin} />
}

export default function DirectionPage() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      setSession(raw ? JSON.parse(raw) : null)
    } catch { setSession(null) }
  }, [])

  const onLogout = () => {
    try { localStorage.removeItem(SESSION_KEY) } catch {}
    setSession(null)
  }

  if (session === undefined) return null
  if (!session) return <DirectionLogin onLogin={setSession} />

  return session.role === 'directeur_retail'
    ? <NetworkDashboard session={session} onLogout={onLogout} />
    : <RegionDashboard session={session} onLogout={onLogout} />
}
