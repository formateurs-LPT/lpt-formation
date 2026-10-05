'use client'
import { useState, useEffect, useCallback } from 'react'
import { getTaches, createTache, updateTacheStatut, TACHE_STATUTS } from '@/lib/tachesApi'
import { getTrainerAvatarKey } from '@/lib/constants'

const ALL_TRAINERS = ['Kevin', 'Quentin', 'Nadège', 'Thomas', 'Valentine', 'Mateo', 'Jonathan']

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '10px 14px', marginBottom: 10,
  background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10,
  fontSize: 13.5, fontFamily: 'inherit', color: '#14161a', outline: 'none',
}

function CreateTacheModal({ onClose, onCreated, creePar }) {
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [assignes, setAssignes] = useState([])
  const [saving, setSaving] = useState(false)

  const toggle = (name) => setAssignes(a => a.includes(name) ? a.filter(x => x !== name) : [...a, name])
  const canSubmit = titre.trim() && assignes.length > 0

  const submit = async () => {
    if (!canSubmit) return
    setSaving(true)
    await createTache({ titre: titre.trim(), description: description.trim(), assignes, creePar })
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
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
                {others.map(t => <TacheCard key={t.id} tache={t} pName={pName} onChangeStatut={handleChangeStatut} />)}
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
