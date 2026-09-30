'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { sbSelect } from '@/lib/supabase'
import { apiGetCollaborateurByLogin, apiChangerCode, getCollaborateurById } from '@/lib/collaborateursApi'
import { apiGetEntree, apiGetDossiersEntree, apiUpsertDocumentEntree } from '@/lib/rhApi'
import { getDocsRequis, computeStatut } from '@/lib/dossierDocuments'
import { uploadPieceJointe, RH_DOCUMENTS_BUCKET } from '@/lib/storageApi'
import { FileDropSlot } from '@/components/FileDropSlot'
import { getMotsMessages, addMotMessage } from '@/lib/notesCollaborateurApi'

// Page autonome (comme /manager, /rh, /collaborateur) — espace du nouvel
// entrant validé par la RH : dossier RH self-service + fiche accès tant que
// la formation n'est pas terminée, puis dashboard complet (S'entraîner/Se
// tester/Demander de l'aide) une fois formation_terminee=true.
const SESSION_KEY = 'espace_collaborateur_session'

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 12,
  background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
}

// ── Connexion ─────────────────────────────────────────────────────────────
function EspaceLogin({ onLogin }) {
  const [login, setLogin] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!login.trim() || !code.trim() || loading) return
    setLoading(true); setError('')
    const row = await apiGetCollaborateurByLogin(login.trim().toLowerCase(), code.trim())
    if (!row) { setLoading(false); setError('Identifiant ou code incorrect.'); return }
    const magasins = await sbSelect('magasins', `id=eq.${row.magasin_id}&select=id,nom`)
    setLoading(false)
    const session = {
      id: row.id, prenom: row.prenom, nom: row.nom, poste: row.poste,
      magasinId: row.magasin_id, magasinNom: magasins?.[0]?.nom || '—',
      entreeId: row.entree_id, doitChangerCode: row.doit_changer_code, formationTerminee: row.formation_terminee,
    }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
    onLogin(session)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(160deg,#0f1923 0%,#1a2535 60%,#00abe9 100%)' }}>
      <form onSubmit={submit} style={{ background: 'linear-gradient(175deg,#0099d0 0%,#0d2538 42%,#091520 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, width: '100%', maxWidth: 400, boxShadow: '0 28px 80px rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ padding: '36px 36px 24px', textAlign: 'center' }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={140} height={52} style={{ objectFit: 'contain', margin: '0 auto 20px' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>Mon intégration</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Espace collaborateur</h2>
        </div>
        <div style={{ padding: '4px 36px 36px' }}>
          <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Identifiant" autoCapitalize="off" autoCorrect="off" style={inputStyle} />
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Code" type="password" style={{ ...inputStyle, marginBottom: 0 }} />
          {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '9px 12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 18, padding: '13px', border: 'none', borderRadius: 12, fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', color: '#fff', cursor: loading ? 'default' : 'pointer', background: loading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #0089ba, #00abe9)' }}>
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>
          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 16, textAlign: 'center' }}>
            Ton identifiant et ton code temporaire t&apos;ont été envoyés par mail.
          </p>
        </div>
      </form>
    </div>
  )
}

// ── Changement de code obligatoire (1ère connexion) ──────────────────────
function ChangerCodeScreen({ session, onChanged }) {
  const [code1, setCode1] = useState('')
  const [code2, setCode2] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!/^\d{6}$/.test(code1)) { setError('Le code doit contenir exactement 6 chiffres.'); return }
    if (code1 !== code2) { setError('Les deux codes ne correspondent pas.'); return }
    setSaving(true); setError('')
    await apiChangerCode(session.id, code1)
    setSaving(false)
    const updated = { ...session, doitChangerCode: false }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(updated)) } catch {}
    onChanged(updated)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'linear-gradient(160deg,#0f1923 0%,#1a2535 60%,#00abe9 100%)' }}>
      <form onSubmit={submit} style={{ background: 'linear-gradient(175deg,#0099d0 0%,#0d2538 42%,#091520 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, width: '100%', maxWidth: 400, boxShadow: '0 28px 80px rgba(0,0,0,0.5)', padding: '36px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6, textAlign: 'center' }}>1ère connexion</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#fff', textAlign: 'center' }}>Choisis ton code personnel</h2>
        <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 20 }}>Un code à 6 chiffres, à garder pour tes prochaines connexions.</p>
        <input value={code1} onChange={e => setCode1(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Nouveau code (6 chiffres)" type="password" inputMode="numeric" style={inputStyle} />
        <input value={code2} onChange={e => setCode2(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Confirme le code" type="password" inputMode="numeric" style={{ ...inputStyle, marginBottom: 0 }} />
        {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '9px 12px' }}>{error}</div>}
        <button type="submit" disabled={saving} style={{ width: '100%', marginTop: 18, padding: '13px', border: 'none', borderRadius: 12, fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', color: '#fff', cursor: saving ? 'default' : 'pointer', background: saving ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #0089ba, #00abe9)' }}>
          {saving ? 'Enregistrement…' : 'Valider mon code →'}
        </button>
      </form>
    </div>
  )
}

// ── Dossier RH self-service (mode restreint) ─────────────────────────────
function DossierRhCard({ session }) {
  const [entree, setEntree] = useState(undefined)
  const [dossiers, setDossiers] = useState([])
  const [uploadingDoc, setUploadingDoc] = useState(null)

  const load = async () => {
    if (!session.entreeId) { setEntree(null); return }
    const [e, d] = await Promise.all([apiGetEntree(session.entreeId), apiGetDossiersEntree(session.entreeId)])
    setEntree(e); setDossiers(d)
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (entree === undefined) return <div style={{ color: '#9aa1ac', fontSize: 13 }}>Chargement…</div>
  if (!entree) return <div style={{ color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Ton dossier n&apos;est pas encore rattaché — reviens un peu plus tard.</div>

  const getDoc = id => dossiers.find(d => d.type_document === id) || { rempli: false, fichier_url: null }
  const docs = getDocsRequis(entree)
  const statut = computeStatut(entree, dossiers)

  const uploadDoc = async (typeDoc, files) => {
    const file = files?.[0]
    if (!file) return
    setUploadingDoc(typeDoc)
    const path = await uploadPieceJointe(file, { prefix: typeDoc, bucket: RH_DOCUMENTS_BUCKET })
    if (path) {
      await apiUpsertDocumentEntree(session.entreeId, typeDoc, true, path)
      await load()
    }
    setUploadingDoc(null)
  }
  const removeDoc = async typeDoc => {
    await apiUpsertDocumentEntree(session.entreeId, typeDoc, false, null)
    await load()
  }
  const toggleDoc = async (typeDoc, current) => {
    await apiUpsertDocumentEntree(session.entreeId, typeDoc, !current)
    await load()
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: '#6b7280' }}>Documents attendus pour ton contrat</div>
        <span style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: statut === 'complet' ? '#dcfce7' : '#fff7ed', color: statut === 'complet' ? '#15803d' : '#c2410c' }}>
          {statut === 'complet' ? '✓ Complet' : '○ Incomplet'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {docs.map(doc => {
          const d = getDoc(doc.id)
          return (
            <FileDropSlot
              key={doc.id}
              label={doc.label}
              path={d.fichier_url}
              uploading={uploadingDoc === doc.id}
              onFiles={files => uploadDoc(doc.id, files)}
              onRemove={() => removeDoc(doc.id)}
            />
          )
        })}
      </div>
      {!entree.contact_urgence_nom && (
        <p style={{ fontSize: 11.5, color: '#9aa1ac', marginTop: 10, fontStyle: 'italic' }}>
          La personne à contacter en cas d&apos;urgence sera ajoutée par ta RH.
        </p>
      )}
    </div>
  )
}

// ── Demander de l'aide (réutilise le fil "mots" existant) ────────────────
function AideModal({ session, onClose }) {
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = async () => { setMessages(await getMotsMessages(session.id)); setLoading(false) }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const envoyer = async () => {
    if (!texte.trim()) return
    setSending(true)
    await addMotMessage({ collaborateurId: session.id, auteur: 'collaborateur', contenu: texte.trim() })
    setTexte(''); await load(); setSending(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a', marginBottom: 14 }}>🆘 Demander de l&apos;aide</div>
        {loading ? <p style={{ color: '#6b7280' }}>Chargement…</p> : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {messages.length === 0 ? (
              <p style={{ color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Écris ton message, ton formateur te répondra ici.</p>
            ) : messages.map(m => (
              <div key={m.id} style={{ alignSelf: m.auteur === 'collaborateur' ? 'flex-end' : 'flex-start', background: m.auteur === 'collaborateur' ? '#eaf3fd' : '#f5f6f8', borderRadius: 12, padding: '9px 14px', maxWidth: '85%' }}>
                <div style={{ fontSize: 13.5, color: '#14161a', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.contenu}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={texte} onChange={e => setTexte(e.target.value)} onKeyDown={e => e.key === 'Enter' && envoyer()} placeholder="Ton message…" style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: 'inherit', fontSize: 14 }} />
          <button onClick={envoyer} disabled={sending || !texte.trim()} style={{ padding: '10px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#0089ba,#00abe9)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Envoyer</button>
        </div>
        <button onClick={onClose} style={{ marginTop: 12, padding: '9px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer' }}>Fermer</button>
      </div>
    </div>
  )
}

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }

function EspaceHeader({ session, onLogout }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#14161a' }}>Bonjour {session.prenom} 👋</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{session.poste || '—'} · {session.magasinNom}</div>
      </div>
      <button onClick={onLogout} style={{ padding: '8px 14px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', color: '#6b7280', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>Se déconnecter</button>
    </div>
  )
}

// ── Mode restreint ────────────────────────────────────────────────────────
function EspaceRestreint({ session, onLogout }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', padding: '28px 20px 60px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <EspaceHeader session={session} onLogout={onLogout} />
        <div style={{ ...cardStyle, marginBottom: 16, background: '#eaf3fd', border: '1px solid #bae0f7' }}>
          <div style={{ fontSize: 13.5, color: '#0369a1', lineHeight: 1.6 }}>
            Bienvenue dans l&apos;équipe ! Première étape de ton intégration : remplis ton dossier RH ci-dessous, à ton rythme. Ta formation démarrera bientôt.
          </div>
        </div>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a', marginBottom: 14 }}>📋 Mon dossier RH</div>
          <DossierRhCard session={session} />
        </div>
        <Link href="/fiche-acces" style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a' }}>🔑 Fiche accès</div>
            <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>Mail pro, Slack…</div>
          </div>
          <span style={{ color: '#9aa1ac' }}>→</span>
        </Link>
      </div>
    </div>
  )
}

// ── Dashboard complet (formation terminée) ────────────────────────────────
function ChantierCard({ emoji, titre, sousTitre }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 20px' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a', marginBottom: 4 }}>{titre}</div>
      <div style={{ fontSize: 12.5, color: '#9aa1ac' }}>{sousTitre}</div>
    </div>
  )
}

function EspaceComplet({ session, onLogout }) {
  const [showAide, setShowAide] = useState(false)
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8', padding: '28px 20px 60px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <EspaceHeader session={session} onLogout={onLogout} />
        <div style={{ ...cardStyle, marginBottom: 16, background: '#f0fdf4', border: '1px solid #86efac' }}>
          <div style={{ fontSize: 13.5, color: '#166534' }}>✓ Formation terminée — bienvenue dans ton espace complet !</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
          <ChantierCard emoji="🏋️" titre="S'entraîner" sousTitre="Bientôt disponible" />
          <ChantierCard emoji="✅" titre="Se tester" sousTitre="Bientôt disponible" />
          <button onClick={() => setShowAide(true)} style={{ ...cardStyle, textAlign: 'center', padding: '28px 20px', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>🆘</div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a', marginBottom: 4 }}>Demander de l&apos;aide</div>
            <div style={{ fontSize: 12.5, color: '#9aa1ac' }}>Écrire à mon formateur</div>
          </button>
        </div>
        <Link href="/fiche-acces" style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a' }}>🔑 Fiche accès</div>
            <div style={{ fontSize: 12.5, color: '#6b7280', marginTop: 2 }}>Mail pro, Slack…</div>
          </div>
          <span style={{ color: '#9aa1ac' }}>→</span>
        </Link>
      </div>
      {showAide && <AideModal session={session} onClose={() => setShowAide(false)} />}
    </div>
  )
}

export default function EspaceCollaborateurPage() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let raw = null
      try { raw = localStorage.getItem(SESSION_KEY) } catch {}
      if (!raw) { if (!cancelled) setSession(null); return }
      const cached = JSON.parse(raw)
      // Revérifie formation_terminee/doit_changer_code à chaque chargement de
      // page — un simple rafraîchissement doit suffire à voir la bascule
      // vers le dashboard complet, sans dépendre d'une session en cache figée.
      const fresh = await getCollaborateurById(cached.id)
      if (cancelled) return
      if (!fresh) { setSession(cached); return }
      const updated = { ...cached, doitChangerCode: fresh.doit_changer_code, formationTerminee: fresh.formation_terminee, entreeId: fresh.entree_id }
      try { localStorage.setItem(SESSION_KEY, JSON.stringify(updated)) } catch {}
      setSession(updated)
    })()
    return () => { cancelled = true }
  }, [])

  const onLogout = () => {
    try { localStorage.removeItem(SESSION_KEY) } catch {}
    setSession(null)
  }

  if (session === undefined) return null
  if (!session) return <EspaceLogin onLogin={setSession} />
  if (session.doitChangerCode) return <ChangerCodeScreen session={session} onChanged={setSession} />
  return session.formationTerminee
    ? <EspaceComplet session={session} onLogout={onLogout} />
    : <EspaceRestreint session={session} onLogout={onLogout} />
}
