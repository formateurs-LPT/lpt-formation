'use client'
import { useState, useEffect, useMemo } from 'react'
import { sbSelect, sbUpsert } from '@/lib/supabase'
import {
  STORES, SKILL_ITEMS, STATUS_META, STATUS_ORDER, nextStatus, collaborateurFullName,
  formatDateFr, tenureLabel,
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

// ── Écran 2 : détail d'un magasin (sections + collaborateurs) ──────
function StoreDetail({ store, progress, onSelectCollaborateur, onBack }) {
  const pctFor = (collabId, sectionId) => {
    const items = SKILL_ITEMS[sectionId] || []
    if (!items.length) return 0
    const acquis = items.filter(it => progress[`${collabId}:${it.id}`]?.status === 'acquis').length
    return Math.round((acquis / items.length) * 100)
  }

  return (
    <div className="dash-wrap">
      <BackBtn onClick={onBack}>← Tous les magasins</BackBtn>

      <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
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
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>{pct}% acquis</div>
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
function ItemRow({ item, entry, onCycleStatus, onSaveNote }) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [draftNote, setDraftNote] = useState(entry?.note || '')
  const status = entry?.status || 'non_acquis'
  const meta = STATUS_META[status]

  useEffect(() => { setDraftNote(entry?.note || '') }, [entry?.note])

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 1, fontSize: 14, color: '#fff', fontWeight: 600 }}>{item.label}</span>
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
        <button
          onClick={() => onCycleStatus(item.id)}
          style={{
            background: meta.bg, border: `1.5px solid ${meta.color}`, color: meta.color,
            borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', minWidth: 100, flexShrink: 0,
          }}
        >{meta.label}</button>
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
    </div>
  )
}

function CollaborateurFiche({ store, sectionId, collaborateur, progress, onCycleStatus, onSaveNote, onBack }) {
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
              onCycleStatus={onCycleStatus}
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
  const [progress, setProgress] = useState({}) // `${collaborateurId}:${itemId}` -> { status, note }
  const [saveError, setSaveError] = useState(false)

  const store = STORES.find(s => s.id === storeId) || null
  const section = store?.sections.find(s => s.id === sectionId) || null
  const collaborateur = section?.collaborateurs.find(c => c.id === collaborateurId) || null

  useEffect(() => {
    if (!storeId) return
    let cancelled = false
    sbSelect('store_followup_progress', `store=eq.${encodeURIComponent(storeId)}`).then(rows => {
      if (cancelled) return
      const map = {}
      for (const r of (rows || [])) {
        map[`${r.collaborateur}:${r.item_id}`] = { status: r.status, note: r.note || '' }
      }
      setProgress(map)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [storeId])

  const persist = async (collabId, itemId, patch) => {
    const key = `${collabId}:${itemId}`
    const current = progress[key] || { status: 'non_acquis', note: '' }
    const next = { ...current, ...patch }
    setProgress(p => ({ ...p, [key]: next }))
    const result = await sbUpsert('store_followup_progress', {
      store: storeId,
      collaborateur: collabId,
      item_id: itemId,
      status: next.status,
      note: next.note || null,
      updated_by: pName || null,
      updated_at: new Date().toISOString(),
    }, 'store,collaborateur,item_id')
    setSaveError(result === null)
  }

  const handleCycleStatus = (itemId) => {
    const key = `${collaborateurId}:${itemId}`
    const current = progress[key]?.status || 'non_acquis'
    persist(collaborateurId, itemId, { status: nextStatus(current) })
  }

  const handleSaveNote = (itemId, note) => {
    persist(collaborateurId, itemId, { note })
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
          onCycleStatus={handleCycleStatus}
          onSaveNote={handleSaveNote}
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
