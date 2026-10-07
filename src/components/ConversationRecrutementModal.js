'use client'
import { useState, useEffect, useRef } from 'react'
import { getConversationRecrutement, addMessageRecrutement } from '@/lib/rhApi'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return time
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${time}`
}

/**
 * Conversation RH <-> manager à propos d'un candidat précis, typiquement
 * ouverte quand un entretien est resté sans retour (le manager n'a pas
 * encore tranché) — même table/principe que les chats individuel et de
 * groupe (mots_messages, type='recrutement', candidat_id). Les boutons de
 * décision ne font qu'appeler `onDecided` fourni par le parent (qui reste
 * seul responsable d'apiDeciderEntretien + apiNotifier, comme EntretienCard
 * le fait déjà) — cette modale ne fait qu'ajouter un message de confirmation
 * dans le fil après coup, pour garder une trace.
 */
export default function ConversationRecrutementModal({
  candidatId, candidatNom, auteur, auteurNom,
  showDecisionButtons = false, onDecided, onClose,
}) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [texte, setTexte] = useState('')
  const [sending, setSending] = useState(false)
  const [deciding, setDeciding] = useState(false)
  const listRef = useRef(null)

  const load = async () => {
    setMessages(await getConversationRecrutement(candidatId))
    setLoading(false)
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 2500)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidatId])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const envoyer = async () => {
    const contenu = texte.trim()
    if (!contenu || sending) return
    setSending(true)
    await addMessageRecrutement({ candidatId, auteur, auteurNom, contenu })
    setTexte('')
    await load()
    setSending(false)
  }

  const decider = async (decisionCandidat) => {
    if (deciding) return
    setDeciding(true)
    await onDecided(decisionCandidat)
    await addMessageRecrutement({
      candidatId, auteur, auteurNom,
      contenu: decisionCandidat === 'accepte' ? 'J\'ai validé ce recrutement.' : 'J\'ai refusé cette candidature.',
    })
    await load()
    setDeciding(false)
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,20,30,0.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 520, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a' }}>💬 Échange RH / manager</div>
            {candidatNom && <div style={{ fontSize: 12, color: '#9aa1ac', marginTop: 1 }}>À propos de {candidatNom}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#9aa1ac', cursor: 'pointer' }}>×</button>
        </div>

        {loading ? <p style={{ color: '#6b7280' }}>Chargement…</p> : (
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {messages.length === 0 ? (
              <p style={{ color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Aucun message pour l&apos;instant.</p>
            ) : messages.map(m => {
              const mine = m.auteur === auteur
              return (
                <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  {!mine && <div style={{ fontSize: 10.5, color: '#9aa1ac', marginBottom: 2 }}>{m.auteur_nom || (m.auteur === 'rh' ? 'RH' : 'Manager')}</div>}
                  <div style={{ background: mine ? '#eaf3fd' : '#f5f6f8', borderRadius: 12, padding: '9px 14px' }}>
                    <div style={{ fontSize: 13.5, color: '#14161a', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.contenu}</div>
                    <div style={{ fontSize: 10, color: '#b0b6c0', marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{formatTime(m.created_at)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showDecisionButtons && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12, paddingTop: 12, borderTop: '1px solid #f0f1f3' }}>
            <button
              onClick={() => decider('accepte')} disabled={deciding}
              style={{ flex: 1, padding: '10px 12px', border: 'none', borderRadius: 10, background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: deciding ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >✅ Valider le recrutement</button>
            <button
              onClick={() => decider('refuse')} disabled={deciding}
              style={{ flex: 1, padding: '10px 12px', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, background: 'rgba(239,68,68,0.08)', color: '#ef4444', fontWeight: 700, fontSize: 13, cursor: deciding ? 'default' : 'pointer', fontFamily: 'inherit' }}
            >❌ Refuser la candidature</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={texte} onChange={e => setTexte(e.target.value)} onKeyDown={e => e.key === 'Enter' && envoyer()}
            placeholder="Écrire un message…"
            style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: 'inherit', fontSize: 14 }}
          />
          <button
            onClick={envoyer} disabled={sending || !texte.trim()}
            style={{ padding: '10px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#0089ba,#00abe9)', color: '#fff', fontWeight: 700, cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit' }}
          >Envoyer</button>
        </div>
      </div>
    </div>
  )
}
