'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { sbSelect, sbUpsert, sbDelete } from '@/lib/supabase'
import {
  STORES, SKILL_ITEMS, STATUS_META, SCORE_ORDER, SCORE_LABELS, scoreToStatus, collaborateurFullName,
  formatDateFr, tenureLabel, teamAge, TEAM_LABELS, ITEM_GUIDES, todayISO,
} from '@/lib/storeFollowupData'

// Couleurs alignées sur le logiciel de planning (CVO vert, MO rouge, SAV
// jaune/orange) — adaptées en tons pastel/sourds pour rester lisibles sur
// fond sombre. La section MO/SAV n'étant pas scindée dans notre roster,
// elle reprend un dégradé rouge → orange (MO + SAV).
const SECTION_COLORS = {
  cvo: {
    bar: '#6fcf8e',
    bg: 'rgba(111,207,142,0.07)',
    border: 'rgba(111,207,142,0.28)',
    hoverBorder: 'rgba(111,207,142,0.55)',
  },
  'mo-sav': {
    bar: 'linear-gradient(180deg, #e8756b, #f0a758)',
    bg: 'linear-gradient(135deg, rgba(232,117,107,0.08), rgba(240,167,88,0.08))',
    border: 'rgba(232,117,107,0.28)',
    hoverBorder: 'rgba(240,167,88,0.55)',
  },
}

function BackBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
      color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: 10,
      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20,
    }}>{children}</button>
  )
}

function allItemsForStore(store) {
  return store.sections.flatMap(s => (SKILL_ITEMS[s.id] || []).map(item => ({ ...item, sectionId: s.id })))
}

// ── Écran 1 : grille des magasins ──────────────────────────────────
function StoreGrid({ onSelectStore, onBack }) {
  return (
    <div className="dash-wrap">
      <BackBtn onClick={onBack}>← Retour au tableau de bord</BackBtn>
      <div className="dash-header">
        <div>
          <h2>🏬 Suivi magasin</h2>
          <p>Suivi de la montée en compétences des collaborateurs, magasin par magasin</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {STORES.map(store => {
          const totalCollabs = store.sections.reduce((n, s) => n + s.collaborateurs.length, 0)
          return (
            <button
              key={store.id}
              onClick={() => onSelectStore(store.id)}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 18, padding: '22px 32px', cursor: 'pointer', fontFamily: 'inherit',
                minWidth: 220, textAlign: 'left', transition: 'all .18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#00abe9'; e.currentTarget.style.background = 'rgba(0,171,233,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>{store.label}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{totalCollabs} collaborateur{totalCollabs > 1 ? 's' : ''}</div>
            </button>
          )
        })}
        <div style={{
          border: '2px dashed rgba(255,255,255,0.15)', borderRadius: 18, padding: '22px 32px',
          minWidth: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center',
        }}>
          + D&apos;autres magasins à venir
        </div>
      </div>
    </div>
  )
}

// Indicateur pour formateurs/responsables : âge moyen d'une équipe
// (ancienneté moyenne), affiché en haut à droite de la page magasin.
function TeamAgeBadge({ sectionId, collaborateurs }) {
  const age = teamAge(collaborateurs)
  if (!age) return null
  return (
    <div style={{
      background: `${age.color}12`, border: `1px solid ${age.color}45`,
      borderRadius: 14, padding: '10px 16px', minWidth: 168,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {TEAM_LABELS[sectionId] || sectionId}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: age.color, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{age.icon}</span> {age.label}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Ancienneté moy. {age.avgLabel}</div>
    </div>
  )
}

// ── Écran 2 : détail d'un magasin (sections + collaborateurs) ──────
function StoreDetail({ store, progress, onSelectCollaborateur, onBack }) {
  // Moyenne des notes (/5) sur tous les items, notes manquantes comptées à 0 —
  // distingue "pas encore audité" (0%) de "en cours partout" (progression
  // visible), contrairement à un simple % d'items acquis.
  const pctFor = (collabId, sectionId) => {
    const items = SKILL_ITEMS[sectionId] || []
    if (!items.length) return 0
    const total = items.reduce((sum, it) => sum + (progress[`${collabId}:${it.id}`]?.score || 0), 0)
    return Math.round((total / (items.length * 5)) * 100)
  }

  return (
    <div className="dash-wrap">
      <BackBtn onClick={onBack}>← Tous les magasins</BackBtn>

      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', marginBottom: 32, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          {store.photo && (
            <div style={{
              flexShrink: 0, width: 300, borderRadius: 18, overflow: 'hidden',
              border: '2px solid rgba(34,197,94,0.4)', boxShadow: '0 0 32px rgba(34,197,94,0.2)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.photo} alt={`Magasin ${store.label}`} style={{ width: '100%', height: 220, objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: '#e8edf3' }}>🏬 {store.label}</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b8099' }}>Sélectionnez un collaborateur pour voir sa fiche de suivi</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignSelf: 'flex-start' }}>
          {store.sections.map(section => (
            <TeamAgeBadge key={section.id} sectionId={section.id} collaborateurs={section.collaborateurs} />
          ))}
        </div>
      </div>

      {store.sections.map(section => (
        <div key={section.id} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: 0 }}>{section.label}</h3>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{section.sub}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {section.collaborateurs.map(c => {
              const pct = pctFor(c.id, section.id)
              const colors = SECTION_COLORS[section.id] || SECTION_COLORS.cvo
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCollaborateur(section.id, c.id)}
                  style={{
                    position: 'relative', overflow: 'hidden',
                    background: colors.bg, border: `1px solid ${colors.border}`,
                    borderRadius: 14, padding: '16px 20px 16px 24px', cursor: 'pointer', fontFamily: 'inherit',
                    minWidth: 200, textAlign: 'left', transition: 'all .18s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = colors.hoverBorder }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border }}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: colors.bar }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 3 }}>{collaborateurFullName(c)}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                    {c.contrat}{c.entree && ` · ${tenureLabel(c.entree)} d'ancienneté`}
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#22c55e' : '#00abe9', transition: 'width .3s' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>{pct}% de maîtrise</div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Écran 3 : fiche d'un collaborateur ──────────────────────────────
// Fenêtre "trame d'audit" — question à poser / consigne pour l'item, avec
// les réponses attendues quand il y en a (offres, verres, traitements…).
function GuideModal({ item, guide, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '28px 32px', width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            📋 Trame d&apos;audit
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', textTransform: 'none', letterSpacing: 0, marginTop: 4 }}>{item.label}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, flexShrink: 0,
          }}>✕</button>
        </div>

        {guide ? (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 20 }}>
              {guide.instruction}
            </p>

            {/* Script séquentiel (ex: Trame d'accueil) — contenu réel du module */}
            {guide.steps && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {guide.steps.map(s => (
                  <div key={s.num} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}40`,
                    borderLeft: `3px solid ${s.color}`, borderRadius: 12, padding: '12px 16px',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{s.emoji}</span>
                    <span style={{ fontSize: 14, color: '#fff', lineHeight: 1.5 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Blocs par catégorie (ex: les 4 offres, les 3 matériaux) — contenu réel du module */}
            {guide.sections && guide.sections.map(section => (
              <div key={section.label} style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'inline-block', fontSize: 12, fontWeight: 800, color: section.color,
                  background: `${section.color}18`, border: `1px solid ${section.color}45`,
                  borderRadius: 8, padding: '3px 10px', marginBottom: 8,
                }}>{section.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {section.bullets.map((b, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: `3px solid ${section.color}`, borderRadius: 10, padding: '9px 14px',
                      fontSize: 13, color: '#fff', lineHeight: 1.5,
                    }}>{b}</div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pastilles simples (quand il n'y a pas encore de vrai contenu module) */}
            {guide.options && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {guide.options.map(o => (
                  <span key={o} style={{
                    background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.3)',
                    borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#7dd3fc',
                  }}>{o}</span>
                ))}
              </div>
            )}
            {guide.optionGroups && guide.optionGroups.map(group => (
              <div key={group.label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {group.options.map(o => (
                    <span key={o} style={{
                      background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.3)',
                      borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#7dd3fc',
                    }}>{o}</span>
                  ))}
                </div>
              </div>
            ))}

            {guide.missingNote && (
              <div style={{
                marginTop: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fbbf24', lineHeight: 1.5,
              }}>
                ⚠️ {guide.missingNote}
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', margin: 0 }}>
            Trame pas encore rédigée pour cet item.
          </p>
        )}
      </div>
    </div>
  )
}

// Confirmation avant une action irréversible (reset d'un item).
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
          padding: '24px 28px', width: '100%', maxWidth: 400,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{title}</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            background: 'rgba(220,38,38,0.15)', border: '1px solid #dc2626',
            color: '#f87171', padding: '8px 16px', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Réinitialiser</button>
        </div>
      </div>
    </div>
  )
}

// Sélecteur de note 1-5 : la note pilote le statut, on ne peut plus le
// changer directement (évite un "Acquis" cliqué sans avoir vraiment évalué).
function ScorePicker({ score, onSetScore }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const status = scoreToStatus(score)
  const meta = status ? STATUS_META[status] : null

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: meta ? meta.bg : 'rgba(255,255,255,0.06)',
          border: `1.5px solid ${meta ? meta.color : 'rgba(255,255,255,0.18)'}`,
          color: meta ? meta.color : 'rgba(255,255,255,0.4)',
          borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', minWidth: 130,
        }}
      >{meta ? `${meta.label} · ${score}/5` : 'Non évalué'}</button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 50, minWidth: 260,
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
          padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        }}>
          {SCORE_ORDER.map(n => {
            const m = STATUS_META[scoreToStatus(n)]
            const selected = score === n
            return (
              <button
                key={n}
                onClick={() => { onSetScore(n); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  background: selected ? `${m.color}22` : 'transparent',
                  border: `1px solid ${selected ? m.color : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontWeight: 800, color: m.color, fontSize: 13, width: 14, flexShrink: 0 }}>{n}</span>
                <span style={{ fontSize: 12, color: '#fff' }}>{SCORE_LABELS[n]}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ItemRow({ item, entry, pastEntries, onSetScore, onSaveNote, onReset }) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [draftNote, setDraftNote] = useState(entry?.note || '')
  const guide = ITEM_GUIDES[item.id]
  const history = pastEntries || []

  useEffect(() => { setDraftNote(entry?.note || '') }, [entry?.note])

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{item.label}</span>
          {entry?.score != null && (
            <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2, fontWeight: 600 }}>
              ✅ Réalisé le {formatDateFr(entry.audit_date)}
            </div>
          )}
        </div>
        <button
          onClick={() => setGuideOpen(true)}
          title="Voir la trame d'audit"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: guide ? 'rgba(0,171,233,0.15)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (guide ? 'rgba(0,171,233,0.4)' : 'rgba(255,255,255,0.12)'),
            color: guide ? '#00abe9' : 'rgba(255,255,255,0.4)',
            borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}
        >📋 Trame</button>
        {guideOpen && <GuideModal item={item} guide={guide} onClose={() => setGuideOpen(false)} />}
        {history.length > 0 && (
          <button
            onClick={() => setHistoryOpen(v => !v)}
            title="Historique des audits précédents"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: historyOpen ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.06)',
              border: '1px solid ' + (historyOpen ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.12)'),
              color: '#c4b5fd', borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}
          >🕐 {history.length}</button>
        )}
        <button
          onClick={() => setNoteOpen(v => !v)}
          title="Note"
          style={{
            background: entry?.note ? 'rgba(0,171,233,0.15)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (entry?.note ? 'rgba(0,171,233,0.4)' : 'rgba(255,255,255,0.12)'),
            color: entry?.note ? '#00abe9' : 'rgba(255,255,255,0.4)',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, flexShrink: 0,
          }}
        >📝</button>
        {(entry?.score != null || entry?.note) && (
          <button
            onClick={() => setConfirmResetOpen(true)}
            title="Réinitialiser cet item"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.4)', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: 14, flexShrink: 0,
            }}
          >↺</button>
        )}
        {confirmResetOpen && (
          <ConfirmModal
            title="Réinitialiser cet item ?"
            message={`Êtes-vous sûr de vouloir revenir à zéro pour "${item.label}" ? La note, le statut, la note libre et tout l'historique de cet item seront définitivement supprimés.`}
            onCancel={() => setConfirmResetOpen(false)}
            onConfirm={() => { setConfirmResetOpen(false); onReset(item.id) }}
          />
        )}
        <ScorePicker score={entry?.score} onSetScore={(n) => onSetScore(item.id, n)} />
      </div>
      {noteOpen && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={draftNote}
            onChange={e => setDraftNote(e.target.value)}
            onBlur={() => onSaveNote(item.id, draftNote)}
            placeholder="Observation, point à retravailler…"
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px',
              color: '#fff', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
            }}
          />
        </div>
      )}
      {historyOpen && history.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.map(h => {
            const hMeta = STATUS_META[h.status] || STATUS_META.non_acquis
            return (
              <div key={h.audit_date} style={{
                background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.18)',
                borderRadius: 10, padding: '8px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: h.note ? 4 : 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{formatDateFr(h.audit_date)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: hMeta.color }}>{hMeta.label}{h.score != null && ` · ${h.score}/5`}</span>
                  {h.updated_by && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {h.updated_by}</span>}
                </div>
                {h.note && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{h.note}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CollaborateurFiche({ store, sectionId, collaborateur, progress, history, onSetScore, onSaveNote, onReset, onBack }) {
  const items = SKILL_ITEMS[sectionId] || []
  const categories = useMemo(() => {
    const groups = {}
    for (const it of items) {
      if (!groups[it.category]) groups[it.category] = []
      groups[it.category].push(it)
    }
    return groups
  }, [items])

  const acquisCount = items.filter(it => progress[`${collaborateur.id}:${it.id}`]?.status === 'acquis').length

  return (
    <div className="dash-wrap">
      <BackBtn onClick={onBack}>← {store.label}</BackBtn>
      <div className="dash-header">
        <div>
          <h2>{collaborateurFullName(collaborateur)}</h2>
          <p>
            {store.label} · {collaborateur.contrat}
            {collaborateur.entree && ` · Entrée le ${formatDateFr(collaborateur.entree)} (${tenureLabel(collaborateur.entree)})`}
            {' '}· {acquisCount}/{items.length} items acquis
          </p>
        </div>
      </div>

      {Object.entries(categories).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{category}</div>
          {catItems.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              entry={progress[`${collaborateur.id}:${item.id}`]}
              pastEntries={history[`${collaborateur.id}:${item.id}`]}
              onSetScore={onSetScore}
              onReset={onReset}
              onSaveNote={onSaveNote}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function StoreFollowupView({ pName, onBack }) {
  const [storeId, setStoreId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [collaborateurId, setCollaborateurId] = useState(null)
  // progress : `${collaborateurId}:${itemId}` -> entrée la plus récente (celle
  // affichée/éditée). history : même clé -> entrées plus anciennes (audits
  // précédents), jamais écrasées.
  const [progress, setProgress] = useState({})
  const [history, setHistory] = useState({})
  const [saveError, setSaveError] = useState(false)

  const store = STORES.find(s => s.id === storeId) || null
  const section = store?.sections.find(s => s.id === sectionId) || null
  const collaborateur = section?.collaborateurs.find(c => c.id === collaborateurId) || null

  useEffect(() => {
    if (!storeId) return
    let cancelled = false
    sbSelect('store_followup_progress', `store=eq.${encodeURIComponent(storeId)}&order=audit_date.desc`).then(rows => {
      if (cancelled) return
      const byKey = {}
      for (const r of (rows || [])) {
        const key = `${r.collaborateur}:${r.item_id}`
        if (!byKey[key]) byKey[key] = []
        byKey[key].push(r)
      }
      const map = {}
      const hist = {}
      for (const [key, entries] of Object.entries(byKey)) {
        const [latest, ...rest] = entries
        map[key] = { status: latest.status, score: latest.score ?? null, note: latest.note || '', audit_date: latest.audit_date }
        hist[key] = rest
      }
      setProgress(map)
      setHistory(hist)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [storeId])

  const persist = async (collabId, itemId, patch) => {
    const key = `${collabId}:${itemId}`
    const current = progress[key] || { status: 'non_acquis', score: null, note: '' }
    const today = todayISO()
    const next = { ...current, ...patch, audit_date: today }

    // Si la dernière valeur connue datait d'un jour précédent, elle bascule
    // dans l'historique local (visible immédiatement, sans recharger).
    if (current.audit_date && current.audit_date !== today) {
      setHistory(h => ({ ...h, [key]: [current, ...(h[key] || [])] }))
    }
    setProgress(p => ({ ...p, [key]: next }))

    const result = await sbUpsert('store_followup_progress', {
      store: storeId,
      collaborateur: collabId,
      item_id: itemId,
      audit_date: today,
      status: next.status,
      score: next.score ?? null,
      note: next.note || null,
      updated_by: pName || null,
      updated_at: new Date().toISOString(),
    }, 'store,collaborateur,item_id,audit_date')
    setSaveError(result === null)
  }

  // La note (1-5) pilote seule le statut — pas de modification directe.
  const handleSetScore = (itemId, score) => {
    persist(collaborateurId, itemId, { score, status: scoreToStatus(score) })
  }

  const handleSaveNote = (itemId, note) => {
    persist(collaborateurId, itemId, { note })
  }

  // Supprime définitivement toute trace de cet item (note, statut, historique)
  // pour ce collaborateur — utile pour annuler un test ou une erreur de saisie.
  const handleReset = async (itemId) => {
    const key = `${collaborateurId}:${itemId}`
    setProgress(p => { const n = { ...p }; delete n[key]; return n })
    setHistory(h => { const n = { ...h }; delete n[key]; return n })
    const ok = await sbDelete(
      'store_followup_progress',
      `store=eq.${encodeURIComponent(storeId)}&collaborateur=eq.${encodeURIComponent(collaborateurId)}&item_id=eq.${encodeURIComponent(itemId)}`
    )
    setSaveError(!ok)
  }

  if (collaborateur && section && store) {
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
          onSetScore={handleSetScore}
          onSaveNote={handleSaveNote}
          onReset={handleReset}
          onBack={() => setCollaborateurId(null)}
        />
      </div>
    )
  }

  if (store) {
    return (
      <div id="dashboard">
        <StoreDetail
          store={store}
          progress={progress}
          onSelectCollaborateur={(secId, collabId) => { setSectionId(secId); setCollaborateurId(collabId) }}
          onBack={() => { setStoreId(null); setSectionId(null) }}
        />
      </div>
    )
  }

  return (
    <div id="dashboard">
      <StoreGrid onSelectStore={setStoreId} onBack={onBack} />
    </div>
  )
}
