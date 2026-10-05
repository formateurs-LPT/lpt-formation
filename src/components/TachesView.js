'use client'
import { useState, useEffect, useCallback } from 'react'
import { getTaches, createTache, updateTacheStatut, TACHE_STATUTS } from '@/lib/tachesApi'
import { getTrainerAvatarKey } from '@/lib/constants'

const ALL_TRAINERS = ['Kevin', 'Quentin', 'Nadège', 'Thomas', 'Valentine', 'Mateo', 'Jonathan', 'Salomé']

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 14px', marginBottom: 10,
  background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10,
  fontSize: 13.5, fontFamily: 'inherit', color: '#14161a', outline: 'none',
}

function CreateTacheModal({ onClose, onCreated, creePar }) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [assignes, setAssignes] = useState([])
  const [mode, setMode] = useState('commune')
  const [saving, setSaving] = useState(false)

  const toggle = (name) => setAssignes(a => a.includes(name) ? a.filter(x => x !== name) : [...a, name])
  const canSubmit = titre.trim() && assignes.length > 0

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    await createTache({ titre: titre.trim(), description: description.trim(), assignes, creePar, mode })
    setSaving(false)
    onCreated()
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,20,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(16,24,40,0.25)' }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#14161a', marginBottom: 16 }}>Nouvelle tâche</div>
        <input value={titre} onChange={e => setTitre(e.target.value)} placeholder="Titre de la tâche" style={inputStyle} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optionnel)" rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', margin: '2px 0 8px' }}>Assigner à</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: assignes.length > 1 ? 16 : 22 }}>
          {ALL_TRAINERS.map(name => {
            const active = assignes.includes(name)
            return (
              <button key={name} onClick={() => toggle(name)} style={{
                padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                border: `1.5px solid ${active ? '#0089ba' : '#e5e7eb'}`,
                background: active ? '#eaf3fd' : '#fff',
                color: active ? '#0089ba' : '#374151',
              }}>{name}</button>
            )
          })}
        </div>
        {assignes.length > 1 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>Type de tâche</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              {[
                { id: 'commune', label: 'Commune' },
                { id: 'individuelle', label: 'Individuelle' },
              ].map(o => {
                const active = mode === o.id
                return (
                  <button key={o.id} onClick={() => setMode(o.id)} style={{
                    flex: 1, padding: '9px 0', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                    border: `1.5px solid ${active ? '#0089ba' : '#e5e7eb'}`,
                    background: active ? '#eaf3fd' : '#fff',
                    color: active ? '#0089ba' : '#374151',
                  }}>{o.label}</button>
                )
              })}
            </div>
            <div style={{ fontSize: 11.5, color: '#9aa1ac' }}>
              {mode === 'commune'
                ? 'Un seul statut partagé : le premier qui la termine la termine pour tout le monde.'
                : 'Chacun suit et termine sa propre fiche, indépendamment des autres.'}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '11px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
          <button onClick={submit} disabled={!canSubmit || saving} style={{
            flex: 1, padding: '11px', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit',
            background: canSubmit ? '#0089ba' : '#c7cbd1', cursor: canSubmit ? 'pointer' : 'default',
          }}>{saving ? '…' : 'Créer'}</button>
        </div>
      </div>
    </div>
  )
}

function TacheCard({ tache, pName, onChangeStatut }) {
  const meta = TACHE_STATUTS.find(s => s.id === tache.statut)
  const canEdit = tache.assignes.includes(pName) || pName === tache.cree_par
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a' }}>{tache.titre}</div>
        <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, background: meta.bg, borderRadius: 20, padding: '3px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}>{meta.label}</span>
      </div>
      {tache.description && <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 10 }}>{tache.description}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: canEdit ? 12 : 0 }}>
        {tache.assignes.map(name => (
          <span key={name} style={{ fontSize: 11, fontWeight: 700, color: '#0089ba', background: '#eaf3fd', borderRadius: 20, padding: '3px 10px' }}>{name}</span>
        ))}
      </div>
      {canEdit && (
        <div style={{ display: 'flex', gap: 6 }}>
          {TACHE_STATUTS.map(s => (
            <button
              key={s.id}
              onClick={() => onChangeStatut(tache, s.id)}
              disabled={s.id === tache.statut}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 8, border: '1px solid #e5e7eb', fontFamily: 'inherit',
                fontSize: 11.5, fontWeight: 700, cursor: s.id === tache.statut ? 'default' : 'pointer',
                background: s.id === tache.statut ? s.bg : '#fff', color: s.id === tache.statut ? s.color : '#9aa1ac',
              }}
            >{s.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// Une tâche "individuelle" assignée à N personnes est stockée comme N
// fiches distinctes (même titre + même created_at, un seul assigné
// chacune — cf. createTache) pour que chaque personne clôture la sienne
// séparément. On les regroupe ici à l'affichage pour éviter d'afficher N
// cartes identiques et pour donner à Kevin une vue d'avancement d'ensemble.
function GroupCard({ rows, pName, onChangeStatut }) {
  const { titre, description } = rows[0]
  const doneCount = rows.filter(r => r.statut === 'termine').length
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 18px', boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a' }}>{titre}</div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#0089ba', background: '#eaf3fd', borderRadius: 20, padding: '3px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}>{doneCount}/{rows.length} terminé{doneCount > 1 ? 's' : ''}</span>
      </div>
      {description && <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5, marginBottom: 12 }}>{description}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(r => {
          const meta = TACHE_STATUTS.find(s => s.id === r.statut)
          const canEdit = r.assignes.includes(pName) || pName === r.cree_par
          return (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#374151', minWidth: 76 }}>{r.assignes[0]}</span>
              {canEdit ? (
                <div style={{ display: 'flex', gap: 4, flex: 1, minWidth: 180 }}>
                  {TACHE_STATUTS.map(s => (
                    <button key={s.id} onClick={() => onChangeStatut(r, s.id)} disabled={s.id === r.statut} style={{
                      flex: 1, padding: '5px 0', borderRadius: 7, border: '1px solid #e5e7eb', fontFamily: 'inherit',
                      fontSize: 10.5, fontWeight: 700, cursor: s.id === r.statut ? 'default' : 'pointer',
                      background: s.id === r.statut ? s.bg : '#fff', color: s.id === r.statut ? s.color : '#9aa1ac',
                    }}>{s.label}</button>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 800, color: meta.color, background: meta.bg, borderRadius: 20, padding: '3px 10px' }}>{meta.label}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TachesView({ pName }) {
  const [taches, setTaches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const isKevin = getTrainerAvatarKey(pName) === 'kevin'

  const load = useCallback(async () => {
    setLoading(true)
    setTaches(await getTaches())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleChangeStatut = async (tache, statut) => {
    setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, statut } : t))
    await updateTacheStatut(tache, statut, pName)
  }

  const mine = taches.filter(t => t.assignes.includes(pName) && t.statut !== 'termine')
  const others = taches.filter(t => !mine.includes(t))

  // Regroupe les fiches "individuelles" (assigné unique, même titre + même
  // created_at) entre elles ; tout le reste (tâches communes, ou fiche
  // individuelle isolée pour ce spectateur) reste affiché tel quel.
  const groupsByKey = {}
  const ungrouped = []
  others.forEach(t => {
    if (t.assignes.length === 1) {
      const key = `${t.titre}__${t.created_at}`
      groupsByKey[key] = groupsByKey[key] || []
      groupsByKey[key].push(t)
    } else {
      ungrouped.push(t)
    }
  })
  const otherGroups = []
  Object.values(groupsByKey).forEach(rows => {
    if (rows.length > 1) otherGroups.push(rows)
    else ungrouped.push(rows[0])
  })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#14161a', margin: 0 }}>📌 Tâches</h2>
        {isKevin && (
          <button onClick={() => setShowCreate(true)} style={{ background: '#0089ba', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>+ Nouvelle tâche</button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#9aa1ac' }}>Chargement…</div>
      ) : taches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #e5e7eb' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📌</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>Aucune tâche pour l&apos;instant</div>
        </div>
      ) : (
        <>
          {mine.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Mes tâches</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {mine.map(t => <TacheCard key={t.id} tache={t} pName={pName} onChangeStatut={handleChangeStatut} />)}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{mine.length > 0 ? 'Toute l\'équipe' : 'Toutes les tâches'}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {otherGroups.map(rows => <GroupCard key={rows[0].id} rows={rows} pName={pName} onChangeStatut={handleChangeStatut} />)}
                {ungrouped.map(t => <TacheCard key={t.id} tache={t} pName={pName} onChangeStatut={handleChangeStatut} />)}
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && (
        <CreateTacheModal onClose={() => setShowCreate(false)} creePar={pName} onCreated={() => { setShowCreate(false); load() }} />
      )}
    </div>
  )
}
