'use client'
import { useState } from 'react'
import { STORES } from '@/lib/storeFollowupData'
import { useStoreFollowupProgress } from '@/lib/useStoreFollowupProgress'
import { StoreDetail, CollaborateurFiche, BackBtn } from '@/components/StoreFollowupShared'
import MesRetoursView from '@/components/MesRetoursView'

// ── Écran 1 : grille des magasins ──────────────────────────────────
// Reste local (jamais exporté vers le module partagé) : un manager n'a accès
// qu'à son propre magasin et ne doit avoir aucun chemin de code, même
// accidentel, vers le sélecteur multi-magasins du formateur.
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
