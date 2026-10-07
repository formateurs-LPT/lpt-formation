'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getCollaborateurFromDB } from '@/lib/collaborateurAuthApi'
import { getReportingsHebdo } from '@/lib/notesTerrainApi'
import { getMotsMessages, addMotMessage } from '@/lib/notesCollaborateurApi'
import { getNotificationsNonLues, marquerNotificationsLues } from '@/lib/directionApi'
import ReportingDetailView from '@/components/ReportingDetailView'

// Page autonome (comme /manager, /direction) — aucune dépendance à
// page.js/Dashboard.js. Accès en lecture aux reportings publiés de son
// magasin + fil de discussion avec le(s) formateur(s) ("mots").
const SESSION_KEY = 'collaborateur_session'

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 12,
  background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  transition: 'border-color .2s, background .2s',
}

function fmtDateLong(isoDate) {
  if (!isoDate) return '—'
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function CollaborateurLogin({ onLogin }) {
  const [login, setLogin] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!login.trim() || !code.trim() || loading) return
    setLoading(true)
    setError('')
    const row = await getCollaborateurFromDB(login.trim().toLowerCase(), code.trim())
    setLoading(false)
    if (!row) { setError('Identifiant ou code incorrect.'); return }
    const session = {
      id: row.id, slug: row.slug, prenom: row.prenom, nom: row.nom,
      magasinId: row.magasin_id, magasinNom: row.magasin?.nom || '—',
    }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
    onLogin(session)
  }

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
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
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>Mon magasin</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Espace collaborateur</h2>
        </div>

        <div style={{ padding: '4px 36px 36px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Connexion</div>
          <input
            value={login} onChange={e => setLogin(e.target.value)}
            placeholder="Identifiant" autoCapitalize="off" autoCorrect="off" style={inputStyle}
          />
          <input
            value={code} onChange={e => setCode(e.target.value)}
            placeholder="Code" type="password" inputMode="numeric" style={{ ...inputStyle, marginBottom: 0 }}
          />
          {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '9px 12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: 18, padding: '13px', border: 'none', borderRadius: 12,
            fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', color: '#fff',
            cursor: loading ? 'default' : 'pointer', transition: 'all .2s',
            background: loading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #0089ba, #00abe9)',
            boxShadow: loading ? 'none' : '0 6px 22px rgba(0,171,233,0.35)',
          }}>{loading ? 'Connexion…' : 'Se connecter →'}</button>
          <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 16, textAlign: 'center' }}>
            Ton identifiant et ton code te sont donnés par ton formateur.
          </p>
        </div>
      </form>
    </div>
  )
}

function ChatMots({ session, onClose }) {
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const load = async () => {
    setMessages(await getMotsMessages(session.id))
    setLoading(false)
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const envoyer = async () => {
    if (!texte.trim()) return
    setSending(true)
    await addMotMessage({ collaborateurId: session.id, auteur: 'collaborateur', contenu: texte.trim() })
    setTexte('')
    await load()
    setSending(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18,
        padding: 24, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>💬 Messages de ton formateur</div>
        {loading ? (
          <p style={{ color: 'var(--text-s)' }}>Chargement…</p>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {messages.length === 0 ? (
              <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucun message pour l&apos;instant.</p>
            ) : messages.map(m => (
              <div key={m.id} style={{
                alignSelf: m.auteur === 'collaborateur' ? 'flex-end' : 'flex-start',
                background: m.auteur === 'collaborateur' ? 'rgba(0,171,233,0.15)' : 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 12, padding: '9px 14px', maxWidth: '85%',
              }}>
                <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.contenu}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={texte} onChange={e => setTexte(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && envoyer()}
            placeholder="Répondre…" className="finput" style={{ flex: 1, marginBottom: 0 }}
          />
          <button onClick={envoyer} disabled={sending || !texte.trim()} className="gbtn">Envoyer</button>
        </div>
        <button onClick={onClose} className="btn2" style={{ marginTop: 12 }}>Fermer</button>
      </div>
    </div>
  )
}

function CollaborateurDashboard({ session, onLogout }) {
  const [reportings, setReportings] = useState([])
  const [selected, setSelected] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [r, notifs] = await Promise.all([
        getReportingsHebdo(session.magasinId),
        getNotificationsNonLues(session.slug),
      ])
      if (cancelled) return
      setReportings(r)
      setNotifCount(notifs.length)
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [session])

  const openChat = async () => {
    setShowChat(true)
    if (notifCount > 0) {
      const notifs = await getNotificationsNonLues(session.slug)
      await marquerNotificationsLues(notifs.map(n => n.id))
      setNotifCount(0)
    }
  }

  return (
    <div id="dashboard">
      <div className="dash-wrap">
        <div className="dash-header">
          <div>
            <h2>{session.magasinNom}</h2>
            <p>Bonjour {session.prenom} 👋</p>
          </div>
          <button onClick={onLogout} className="btn2">Se déconnecter</button>
        </div>

        <button onClick={openChat} className="gbtn" style={{ marginBottom: 24, position: 'relative' }}>
          💬 Messages de mon formateur
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff',
              borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{notifCount}</span>
          )}
        </button>

        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Reportings de mon magasin</h3>
        {loading ? (
          <p style={{ color: 'var(--text-s)' }}>Chargement…</p>
        ) : reportings.length === 0 ? (
          <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucun reporting publié pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reportings.map(r => (
              <button key={r.id} onClick={() => setSelected(r)} style={{
                textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  Semaine du {fmtDateLong(r.semaine_debut)} au {fmtDateLong(r.semaine_fin)}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-s)', marginTop: 2 }}>{r.auteur}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ReportingDetailView reporting={selected} magasinNom={session.magasinNom} onClose={() => setSelected(null)} />
      )}
      {showChat && <ChatMots session={session} onClose={() => setShowChat(false)} />}
    </div>
  )
}

export default function CollaborateurPage() {
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
  if (!session) return <CollaborateurLogin onLogin={setSession} />
  return <CollaborateurDashboard session={session} onLogout={onLogout} />
}
