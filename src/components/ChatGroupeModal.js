'use client'
import { useState, useEffect, useRef } from 'react'
import { getChatGroupeMessages, addChatGroupeMessage, notifierChatGroupe } from '@/lib/notesCollaborateurApi'

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  if (d.toDateString() === today.toDateString()) return time
  return `${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ${time}`
}

/**
 * Corps du chat de groupe d'un magasin — réutilise la table et le principe
 * du chat individuel formateur/manager ↔ collaborateur (mots_messages),
 * distingué par type='groupe' + magasin_id. Un seul composant pour les 4
 * profils autorisés à y participer (manager, collaborateur, DR, directeur
 * retail), paramétré par `auteur`/`auteurNom` et l'identifiant pertinent
 * pour ce rôle. Sans chrome (ni modal, ni page) pour pouvoir être monté
 * aussi bien en popup (collaborateur, direction) qu'en page pleine (onglet
 * "Chat magasin" du manager, où c'est l'usage principal).
 */
export function ChatGroupeBody({
  magasinId, auteur, auteurNom, auteurLogin,
  collaborateurId, formateurId, storeManagerId,
  listMaxHeight = '100%',
}) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [texte, setTexte] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  const load = async () => {
    const rows = await getChatGroupeMessages(magasinId)
    setMessages(rows)
    setLoading(false)
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 2500)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magasinId])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length])

  const isMine = m => {
    if (auteur === 'manager') return m.store_manager_id === storeManagerId
    if (auteur === 'collaborateur') return m.collaborateur_id === collaborateurId
    if (auteur === 'formateur') return m.formateur_id === formateurId
    return m.auteur_nom === auteurNom // dr / directeur_retail
  }

  const envoyer = async () => {
    const contenu = texte.trim()
    if (!contenu || sending) return
    setSending(true)
    await addChatGroupeMessage({ magasinId, auteur, auteurNom, collaborateurId, formateurId, storeManagerId, contenu })
    await notifierChatGroupe({ magasinId, auteurLogin })
    setTexte('')
    await load()
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {loading ? <p style={{ color: '#6b7280' }}>Chargement…</p> : (
        <div ref={listRef} style={{ flex: 1, minHeight: 0, maxHeight: listMaxHeight, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          {messages.length === 0 ? (
            <p style={{ color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Aucun message pour l&apos;instant — lance la discussion.</p>
          ) : messages.map(m => {
            const mine = isMine(m)
            return (
              <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {!mine && (
                  <div style={{ fontSize: 10.5, color: '#9aa1ac', marginBottom: 2 }}>{m.auteur_nom || '—'}</div>
                )}
                <div style={{ background: mine ? '#eaf3fd' : '#f5f6f8', borderRadius: 12, padding: '9px 14px' }}>
                  <div style={{ fontSize: 13.5, color: '#14161a', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{m.contenu}</div>
                  <div style={{ fontSize: 10, color: '#b0b6c0', marginTop: 3, textAlign: mine ? 'right' : 'left' }}>{formatTime(m.created_at)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={texte} onChange={e => setTexte(e.target.value)} onKeyDown={e => e.key === 'Enter' && envoyer()}
          placeholder="Écrire au magasin…"
          style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: 'inherit', fontSize: 14 }}
        />
        <button
          onClick={envoyer} disabled={sending || !texte.trim()}
          style={{ padding: '10px 16px', border: 'none', borderRadius: 8, background: 'linear-gradient(135deg,#0089ba,#00abe9)', color: '#fff', fontWeight: 700, cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit' }}
        >Envoyer</button>
      </div>
    </div>
  )
}

/** Version popup (collaborateur, direction) — même corps, chrome modal en plus. */
export default function ChatGroupeModal({ magasinId, magasinNom, onClose, ...bodyProps }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 520, maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a' }}>💬 Chat du magasin</div>
            {magasinNom && <div style={{ fontSize: 12, color: '#9aa1ac', marginTop: 1 }}>{magasinNom}</div>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, color: '#9aa1ac', cursor: 'pointer' }}>×</button>
        </div>
        <ChatGroupeBody magasinId={magasinId} {...bodyProps} />
      </div>
    </div>
  )
}
