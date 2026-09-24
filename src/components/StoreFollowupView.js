'use client'
import { useState } from 'react'
import { STORES, STORE_REGION_GROUPS, STORE_ANNEXES } from '@/lib/storeFollowupData'
import { useStoreFollowupProgress } from '@/lib/useStoreFollowupProgress'
import { StoreDetail, CollaborateurFiche, BackBtn } from '@/components/StoreFollowupShared'
import MesRetoursView from '@/components/MesRetoursView'

function storeInitials(label) {
  const words = label.replace(/\(.*\)/, '').trim().split(/\s+/).filter(Boolean)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return (words[0] || '').slice(0, 2).toUpperCase()
}

function StoreTile({ store, color, onSelect }) {
  const totalCollabs = store.sections.reduce((n, s) => n + s.collaborateurs.length, 0)
  return (
    <button
      onClick={onSelect}
      style={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(155deg, ${color.bg} 0%, rgba(255,255,255,0.03) 65%)`,
        border: `1px solid ${color.border}`, borderRadius: 18, padding: '20px 20px 18px',
        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all .2s',
        minWidth: 200, maxWidth: 260, flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: 14,
        boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.borderColor = color.color
        e.currentTarget.style.boxShadow = `0 10px 28px -8px ${color.color}66`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = color.border
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.2)'
      }}
    >
      <div style={{
        position: 'absolute', top: -22, right: -22, width: 90, height: 90, borderRadius: '50%',
        background: color.color, opacity: 0.12, pointerEvents: 'none',
      }} />
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `${color.color}26`, border: `1.5px solid ${color.color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color: color.color,
      }}>{storeInitials(store.label)}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1.25 }}>{store.label}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>👥</span> {totalCollabs} collaborateur{totalCollabs > 1 ? 's' : ''}
        </div>
      </div>
    </button>
  )
}

function RegionSection({ group, stores, onSelectStore }) {
  const storesById = Object.fromEntries(stores.map(s => [s.id, s]))
  const ordered = group.storeIds.map(id => storesById[id]).filter(Boolean)
  if (!ordered.length) return null
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 20 }}>{group.emoji}</span>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: group.color, letterSpacing: 0.2 }}>{group.label}</h3>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${group.border}, transparent)` }} />
        <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{ordered.length} {group.unitLabel || 'magasin'}{ordered.length > 1 ? 's' : ''}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        {ordered.map(store => (
          <StoreTile key={store.id} store={store} color={group} onSelect={() => onSelectStore(store.id)} />
        ))}
      </div>
    </div>
  )
}

// ── Écran 1 : grille des magasins, groupée par région ──────────────
// Reste local (jamais exporté vers le module partagé) : un manager n'a accès
// qu'à son propre magasin et ne doit avoir aucun chemin de code, même
// accidentel, vers le sélecteur multi-magasins du formateur.
function StoreGrid({ onSelectStore, onBack }) {
  // Le Labo Progressif et Beauchamps sont des annexes (labo/entrepôt), pas
  // des magasins de vente — exclus du décompte réseau.
  const magasinsCount = STORES.filter(s => !STORE_ANNEXES.storeIds.includes(s.id)).length
  return (
    <div className="dash-wrap">
      <BackBtn onClick={onBack}>← Retour au tableau de bord</BackBtn>
      <div className="dash-header">
        <div>
          <h2>🏬 Suivi magasin</h2>
          <p>Suivi de la montée en compétences des collaborateurs, magasin par magasin</p>
        </div>
        <div style={{
          background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.3)',
          borderRadius: 14, padding: '10px 18px', textAlign: 'center', flexShrink: 0,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#00abe9', lineHeight: 1.1 }}>{magasinsCount}</div>
          <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.5)', fontWeight: 600, whiteSpace: 'nowrap' }}>magasins réseau LPT</div>
        </div>
      </div>
      {STORE_REGION_GROUPS.map(group => (
        <RegionSection key={group.id} group={group} stores={STORES} onSelectStore={onSelectStore} />
      ))}
      <RegionSection group={STORE_ANNEXES} stores={STORES} onSelectStore={onSelectStore} />
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function StoreFollowupView({ pName, onBack }) {
  const [storeId, setStoreId] = useState(null)
  const [sectionId, setSectionId] = useState(null)
  const [collaborateurId, setCollaborateurId] = useState(null)
  const [showMesRetours, setShowMesRetours] = useState(false)

  const { progress, history, saveError, setScore, saveNote, reset } = useStoreFollowupProgress(storeId, pName)

  const store = STORES.find(s => s.id === storeId) || null
  const section = store?.sections.find(s => s.id === sectionId) || null
  const collaborateur = section?.collaborateurs.find(c => c.id === collaborateurId) || null

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
          onSetScore={(itemId, score) => setScore(collaborateurId, itemId, score)}
          onSaveNote={(itemId, note) => saveNote(collaborateurId, itemId, note)}
          onReset={(itemId) => reset(collaborateurId, itemId)}
          onBack={() => setCollaborateurId(null)}
          pName={pName}
          role="formateur"
        />
      </div>
    )
  }

  if (store && showMesRetours) {
    return (
      <div id="dashboard">
        <MesRetoursView store={store} pName={pName} onBack={() => setShowMesRetours(false)} />
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
          onOpenMesRetours={() => setShowMesRetours(true)}
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
