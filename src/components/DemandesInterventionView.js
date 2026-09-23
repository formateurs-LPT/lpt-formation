'use client'
import { useState, useEffect } from 'react'
import {
  getDemandesIntervention, getMessagesDemande, postMessageDemande, notifierNouveauMessage,
  reouvrirDemande, cloturerDemande,
} from '@/lib/directionApi'

function fmtDateTime(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

const STATUT_META = {
  ouverte: { label: 'Ouverte', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)' },
  cloturee: { label: 'Clôturée', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.15)' },
}

// Détail d'une demande + chat de groupe. `canManage` (direction uniquement)
// affiche les boutons de cycle de vie (nouvelle visite / clôturer).
function DemandeDetail({ demande, login, role, canManage, onBack, onUpdated }) {
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

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
        {demande.reporting_id && <p style={{ fontSize: 12, color: '#4ade80', marginTop: 6 }}>📎 Reporting rattaché</p>}

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
export default function DemandesInterventionView({ magasinIds, login, role, canManage = false }) {
  const [demandes, setDemandes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  const load = async () => {
    setLoading(true)
    const rows = await getDemandesIntervention(magasinIds ? { magasinIds } : {})
    setDemandes(rows)
    setLoading(false)
  }
  useEffect(() => { load() }, [JSON.stringify(magasinIds)]) // eslint-disable-line react-hooks/exhaustive-deps

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
    </div>
  )
}
