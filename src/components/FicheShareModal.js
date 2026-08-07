'use client'
import { useState, useEffect } from 'react'
import { getWeeklySharedState } from '@/lib/supabase'
import { entreeMatchesCategory, listFormationCategories } from '@/lib/formationCategories'
import { entreeDisplayName, normalizeEntreeList } from '@/lib/participantNames'

const BG2    = '#0d1f3c'
const BLUE_L = '#00abe9'
const GREEN  = '#22c55e'
const BORDER = 'rgba(255,255,255,0.1)'
const TEXT   = '#ffffff'
const SUB    = 'rgba(255,255,255,0.5)'

const GROUP_COLORS = {
  presentiel: '#00abe9',
  visio:      '#7c3aed',
  belgique:   '#e63946',
}

// Remove accents, keep only a-z
function normalizeStr(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

export function buildLptEmail(entree) {
  const prenom = (entree.prenom || '').trim()
  const nom    = (entree.nom    || '').trim()

  if (prenom && nom) {
    const p = normalizeStr(prenom)
    const n = normalizeStr(nom)
    if (!p || !n) return null
    return p[0] + n + '@lunettespourtous.com'
  }

  // Fallback from fullName only
  const full = (entree.fullName || '').trim()
  if (!full) return null
  const parts = full.split(/\s+/)
  if (parts.length < 2) return null
  // RH format is usually "NOM Prénom" (first word in all-caps)
  const firstAllCaps = parts[0].length > 1 && parts[0] === parts[0].toUpperCase()
  const lastName  = firstAllCaps ? parts[0]                : parts.slice(1).join('')
  const firstName = firstAllCaps ? parts.slice(1).join('') : parts[0]
  const p = normalizeStr(firstName)
  const n = normalizeStr(lastName)
  if (!p || !n) return null
  return p[0] + n + '@lunettespourtous.com'
}

// Filtre par poste (ex: fiche SAV → uniquement les Monteur Optique SAV), au lieu du
// filtre par groupe/lieu de formation utilisé pour les autres fiches.
function entreeMatchesPoste(entree, posteFilter) {
  const poste = (entree?.poste || '').trim().toLowerCase()
  if (!poste) return false
  return posteFilter.some(p => poste === p.trim().toLowerCase())
}

export default function FicheShareModal({ ficheUrl, ficheLabel, allowedGroups, posteFilter, emailBody, onClose }) {
  const byPoste = Array.isArray(posteFilter) && posteFilter.length > 0

  const categories = byPoste ? [] : listFormationCategories().filter(
    c => !allowedGroups || allowedGroups.includes(c.slug)
  )

  const [entrees,      setEntrees]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selectedSlug, setSelectedSlug] = useState(categories[0]?.slug || 'presentiel')
  const [sent,         setSent]         = useState(false)

  useEffect(() => {
    getWeeklySharedState()
      .then(state => {
        const raw = Array.isArray(state?.entrees_data) ? state.entrees_data : []
        setEntrees(normalizeEntreeList(raw))
      })
      .catch(() => setEntrees([]))
      .finally(() => setLoading(false))
  }, [])

  const recipients = entrees
    .filter(e => byPoste ? entreeMatchesPoste(e, posteFilter) : entreeMatchesCategory(e, selectedSlug))
    .map(e => ({ name: entreeDisplayName(e), email: buildLptEmail(e) }))
    .filter(r => r.email)

  const selectedMeta = byPoste ? null : categories.find(c => c.slug === selectedSlug)
  const color = byPoste ? GREEN : (GROUP_COLORS[selectedSlug] || BLUE_L)

  const handleSend = () => {
    if (!recipients.length) return
    const bcc     = recipients.map(r => r.email).join(',')
    const subject = encodeURIComponent(`Ta fiche récapitulative de formation — Lunettes Pour Tous`)
    const body    = encodeURIComponent(
      emailBody || `Bonjour,\n\nAprès ces trois jours de formation, il te reste encore plein de choses à découvrir en magasin. Ces trois jours étaient riches en informations, et pour t’aider, voici une fiche récapitulative de la formation. Tu y trouveras l’essentiel des thèmes abordés durant ces trois jours.\n\n➡ ${ficheUrl}\n\nSi tu as la moindre question, n’hésite pas à me contacter sur ce mail.\n\nJe te souhaite une excellente intégration et peut-être à bientôt en magasin !\n\nBonnes ventes à toi !`
    )
    window.open(`mailto:?bcc=${bcc}&subject=${subject}&body=${body}`)
    setSent(true)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: BG2, border: `1px solid ${BORDER}`, borderRadius: 20,
          padding: '28px 30px', width: 520, maxWidth: '100%', maxHeight: '85vh',
          display: 'flex', flexDirection: 'column', gap: 20,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: BLUE_L, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
              Partager la fiche
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: TEXT }}>
              Envoyer par email
            </div>
            <div style={{ fontSize: 12, color: SUB, marginTop: 4 }}>
              Adresse auto : [1ère lettre prénom][nom]@lunettespourtous.com
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: 8,
              width: 32, height: 32, cursor: 'pointer', color: SUB, fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Group selector */}
        {!byPoste && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: SUB, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Choisir le groupe
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {categories.map(cat => {
              const c = GROUP_COLORS[cat.slug] || BLUE_L
              const active = selectedSlug === cat.slug
              const count = entrees.filter(
                e => entreeMatchesCategory(e, cat.slug) && buildLptEmail(e)
              ).length
              return (
                <button
                  key={cat.slug}
                  onClick={() => { setSelectedSlug(cat.slug); setSent(false) }}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                    background: active ? `${c}18` : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${active ? c : 'rgba(255,255,255,0.08)'}`,
                    color: active ? c : SUB,
                    fontWeight: 700, fontSize: 13,
                    transition: 'all .2s',
                  }}
                >
                  <div>{cat.emoji} {cat.shortLabel}</div>
                  <div style={{ fontSize: 10, marginTop: 4, opacity: 0.75 }}>
                    {loading ? '…' : `${count} destinataire${count !== 1 ? 's' : ''}`}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        )}

        {/* Recipient list */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: SUB, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
            Destinataires — {byPoste ? `🔧 ${ficheLabel || 'SAV'}` : `${selectedMeta?.emoji} ${selectedMeta?.label}`}
          </div>
          {loading ? (
            <div style={{ color: SUB, fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              Chargement…
            </div>
          ) : recipients.length === 0 ? (
            <div style={{ color: SUB, fontSize: 13, textAlign: 'center', padding: '20px 0', lineHeight: 1.6 }}>
              Aucun collaborateur trouvé {byPoste ? `pour ce poste (${posteFilter.join(', ')})` : 'pour ce groupe'}.<br />
              <span style={{ fontSize: 11, opacity: 0.6 }}>Vérifiez que la liste RH a bien été importée.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recipients.map((r, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '8px 12px',
                }}>
                  <div style={{ fontSize: 13, color: TEXT, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 11, color, fontFamily: 'monospace', flexShrink: 0, opacity: 0.85 }}>
                    {r.email}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* URL preview */}
        <div style={{
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 11, color: SUB, flexShrink: 0 }}>Lien envoyé :</span>
          <span style={{ fontSize: 11, color: BLUE_L, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ficheUrl}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: SUB, fontWeight: 600, fontSize: 13,
            }}
          >Annuler</button>
          <button
            onClick={handleSend}
            disabled={recipients.length === 0 || loading}
            style={{
              flex: 2, padding: '12px 0', borderRadius: 12,
              cursor: recipients.length === 0 ? 'default' : 'pointer', fontFamily: 'inherit',
              background: sent
                ? `${GREEN}20`
                : (recipients.length === 0 || loading)
                  ? 'rgba(255,255,255,0.05)'
                  : `linear-gradient(135deg, ${color}cc, ${color})`,
              border: sent ? `1px solid ${GREEN}50` : 'none',
              color: sent ? GREEN : (recipients.length === 0 || loading) ? 'rgba(255,255,255,0.25)' : '#fff',
              fontWeight: 800, fontSize: 14, transition: 'all .2s',
            }}
          >
            {sent
              ? `✓ Client mail ouvert (${recipients.length} destinataires)`
              : `📧 Envoyer à ${recipients.length} collaborateur${recipients.length !== 1 ? 's' : ''}`
            }
          </button>
        </div>

        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.5 }}>
          L’email s’ouvrira dans votre client mail (Outlook, Gmail…) avec les destinataires en BCC.<br />
          Vérifiez les adresses puis cliquez Envoyer dans votre client.
        </div>
      </div>
    </div>
  )
}
