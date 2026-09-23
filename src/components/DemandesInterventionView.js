'use client'
import { useState, useEffect } from 'react'
import { sbSelect, getTrainerFromDB } from '@/lib/supabase'
import {
  getDemandesIntervention, getMessagesDemande, postMessageDemande, notifierNouveauMessage,
  reouvrirDemande, cloturerDemande, createDemandeIntervention, isMagasinBelgique, BELGIQUE_ONLY_LOGINS,
  accepterDemande,
} from '@/lib/directionApi'

function fmtDateTime(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

const STATUT_META = {
  ouverte: { label: 'Ouverte', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)' },
  en_cours: { label: 'En cours', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.35)' },
  cloturee: { label: 'Clôturée', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)' },
}

/**
 * Formulaire de création d'une demande d'intervention — utilisable aussi bien
 * depuis la vue magasin Direction que depuis le dashboard manager (script 5,
 * étendu pour laisser le manager déclencher lui-même une demande).
 */
export function DemandeInterventionModal({ magasinDbId, magasinNom, formateurOptions, demandeurLogin, demandeurRole, onClose, onCreated }) {
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
      demandeurLogin, demandeurRole,
      motif, delaiSouhaite: delai, actionsAttendues: actions,
      formateurSouhaiteId: formateurId || null,
    })
    setSaving(false)
    setDone(true)
    onCreated?.()
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

// Détail d'une demande + chat de groupe. `canManage` (direction uniquement)
// affiche les boutons de cycle de vie (nouvelle visite / clôturer).
function DemandeDetail({ demande, login, role, canManage, onBack, onUpdated }) {
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  const load = async () => {
    setMessages(await getMessagesDemande(demande.id))
    setLoading(false)
  }
  useEffect(() => { load() }, [demande.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const envoyer = async () => {
    if (!texte.trim()) return
    setSending(true)
    await postMessageDemande({ demandeId: demande.id, auteurLogin: login, auteurRole: role, contenu: texte.trim() })
    await notifierNouveauMessage(demande, login)
    setTexte('')
    await load()
    setSending(false)
  }

  // Le formateur accepte : passe la demande en "en_cours" et poste un message
  // de confirmation dans le chat de groupe (vu par le manager/DR/directeur
  // qui a fait la demande — c'est ce message + le badge de statut qui leur
  // servent d'accusé de réception).
  const accepter = async () => {
    setAccepting(true)
    const trainer = await getTrainerFromDB(login)
    if (trainer?.id) {
      await accepterDemande({ id: demande.id, formateurId: trainer.id })
      await postMessageDemande({
        demandeId: demande.id, auteurLogin: login, auteurRole: role,
        contenu: `✅ ${trainer.display_name} a accepté cette demande et va s'en occuper.`,
      })
      await notifierNouveauMessage(demande, login)
    }
    setAccepting(false)
    onUpdated()
  }

  const st = STATUT_META[demande.statut] || STATUT_META.ouverte

  return (
    <div>
      <button className="detail-back" onClick={onBack}>← Toutes les demandes</button>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{demande.magasinNom}</div>
            <div style={{ fontSize: 12, color: 'var(--text-s)' }}>Demandé par {demande.demandeur_login} · {fmtDateTime(demande.created_at)}</div>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 700, background: st.bg, border: `1px solid ${st.border}`, color: st.color }}>{st.label}</span>
        </div>
        {demande.motif && <p style={{ fontSize: 13.5, color: 'var(--text)', marginBottom: 6 }}><strong>Motif :</strong> {demande.motif}</p>}
        {demande.delai_souhaite && <p style={{ fontSize: 13, color: 'var(--text-s)', marginBottom: 6 }}><strong>Délai souhaité :</strong> {demande.delai_souhaite}</p>}
        {demande.actions_attendues && <p style={{ fontSize: 13, color: 'var(--text-s)', marginBottom: 6 }}><strong>Actions attendues :</strong> {demande.actions_attendues}</p>}
        <p style={{ fontSize: 13, color: 'var(--text-s)' }}><strong>Formateur :</strong> {demande.formateurNom}</p>
        {demande.formateurAccepteNom && (
          <p style={{ fontSize: 12, color: '#38bdf8', marginTop: 6 }}>✅ Acceptée par {demande.formateurAccepteNom} le {fmtDateTime(demande.accepte_at)}</p>
        )}
        {demande.reporting_id && <p style={{ fontSize: 12, color: '#4ade80', marginTop: 6 }}>📎 Reporting rattaché</p>}

        {role === 'formateur' && demande.statut === 'ouverte' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={accepter} disabled={accepting} className="gbtn">{accepting ? 'Confirmation…' : '✅ Accepter la demande'}</button>
          </div>
        )}

        {canManage && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {demande.statut === 'cloturee' ? (
              <button onClick={async () => { await reouvrirDemande(demande.id); onUpdated() }} className="gbtn">↻ Nouvelle visite prochaine</button>
            ) : (
              <button onClick={async () => { await cloturerDemande(demande.id); onUpdated() }} className="btn2">✓ Clôturer</button>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 10 }}>💬 Chat de groupe</div>
      {loading ? (
        <p style={{ color: 'var(--text-s)' }}>Chargement…</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14, maxHeight: 360, overflowY: 'auto' }}>
          {messages.length === 0 ? (
            <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucun message pour l&apos;instant.</p>
          ) : messages.map(m => (
            <div key={m.id} style={{
              alignSelf: m.auteur_login === login ? 'flex-end' : 'flex-start',
              background: m.auteur_login === login ? 'rgba(0,171,233,0.15)' : 'var(--card)',
              border: '1px solid var(--border)', borderRadius: 12, padding: '9px 14px', maxWidth: '80%',
            }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#00abe9', marginBottom: 3 }}>{m.auteur_login}</div>
              <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{m.contenu}</div>
              <div style={{ fontSize: 10, color: 'var(--text-m)', marginTop: 3 }}>{fmtDateTime(m.created_at)}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={texte} onChange={e => setTexte(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && envoyer()}
          placeholder="Écrire un message…" className="finput" style={{ flex: 1, marginBottom: 0 }}
        />
        <button onClick={envoyer} disabled={sending || !texte.trim()} className="gbtn">Envoyer</button>
      </div>
    </div>
  )
}

/**
 * Liste + détail des demandes d'intervention — réutilisée telle quelle par
 * les dashboards formateur, manager, DR et directeur retail (script 5,
 * étape 5.1). `magasinIds` filtre la portée (undefined = réseau entier,
 * utilisé par formateur et directeur retail) ; `canManage` (direction
 * uniquement) affiche les actions de cycle de vie sur le détail.
 */
export default function DemandesInterventionView({ magasinIds, login, role, canManage = false, canCreate = false, magasinId, magasinNom }) {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [trainers, setTrainers] = useState([])
  const [isBelgique, setIsBelgique] = useState(false)

  const load = async () => {
    setLoading(true)
    const rows = await getDemandesIntervention(magasinIds ? { magasinIds } : {})
    setDemandes(rows)
    setLoading(false)
  }
  useEffect(() => { load() }, [JSON.stringify(magasinIds)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!canCreate || !magasinId) return
    let cancelled = false
    sbSelect('trainers', 'select=id,login,display_name,active').then(rows => { if (!cancelled) setTrainers((rows || []).filter(t => t.active)) }).catch(() => {})
    isMagasinBelgique(magasinId).then(v => { if (!cancelled) setIsBelgique(v) }).catch(() => {})
    return () => { cancelled = true }
  }, [canCreate, magasinId])

  const formateurOptions = trainers.filter(t => isBelgique ? BELGIQUE_ONLY_LOGINS.includes(t.login) : !BELGIQUE_ONLY_LOGINS.includes(t.login))

  if (selected) {
    return (
      <DemandeDetail
        demande={demandes.find(d => d.id === selected.id) || selected}
        login={login} role={role} canManage={canManage}
        onBack={() => setSelected(null)}
        onUpdated={async () => { await load(); setSelected(null) }}
      />
    )
  }

  const ouvertes = demandes.filter(d => d.statut !== 'cloturee')
  const cloturees = demandes.filter(d => d.statut === 'cloturee')

  const Card = ({ d }) => {
    const st = STATUT_META[d.statut] || STATUT_META.ouverte
    return (
      <button onClick={() => setSelected(d)} style={{
        textAlign: 'left', width: '100%', background: 'var(--card)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{d.magasinNom}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-s)' }}>{d.motif || 'Sans motif précisé'} · {fmtDateTime(d.created_at)}</div>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, border: `1px solid ${st.border}`, color: st.color, flexShrink: 0 }}>{st.label}</span>
      </button>
    )
  }

  return (
    <div>
      {canCreate && magasinId && (
        <button onClick={() => setShowCreate(true)} className="gbtn" style={{ marginBottom: 16 }}>
          🆘 Nouvelle demande d&apos;intervention
        </button>
      )}
      {loading ? (
        <p style={{ color: 'var(--text-s)' }}>Chargement…</p>
      ) : demandes.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-s)' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Aucune demande d&apos;intervention</div>
        </div>
      ) : (
        <>
          {ouvertes.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', marginBottom: 10 }}>Ouvertes ({ouvertes.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ouvertes.map(d => <Card key={d.id} d={d} />)}
              </div>
            </div>
          )}
          {cloturees.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', marginBottom: 10 }}>Clôturées ({cloturees.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cloturees.map(d => <Card key={d.id} d={d} />)}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <DemandeInterventionModal
          magasinDbId={magasinId} magasinNom={magasinNom}
          formateurOptions={formateurOptions}
          demandeurLogin={login} demandeurRole={role}
          onClose={() => setShowCreate(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
