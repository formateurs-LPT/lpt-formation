'use client'
import { useState, useRef } from 'react'
import { getSignedUrl, RH_DOCUMENTS_BUCKET } from '@/lib/storageApi'

// Glisser-déposer / consultation / suppression de fichier — partagé entre
// l'espace RH (candidats, dossier documentaire) et l'espace collaborateur
// (dossier RH self-service), bucket privé rh-documents, URLs signées à la demande.

const btnBase = { padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }

export function FileViewButton({ path, label = '📄 Voir' }) {
  const [loading, setLoading] = useState(false)
  const open = async () => {
    setLoading(true)
    const url = await getSignedUrl(path, 3600, RH_DOCUMENTS_BUCKET)
    setLoading(false)
    if (url) window.open(url, '_blank')
  }
  return <button type="button" onClick={open} disabled={loading} style={{ ...btnBase, background: '#f0f9ff', color: '#0089ba' }}>{loading ? '…' : label}</button>
}

/** `path` (fichier déjà stocké, mode "fiche") affiche Voir/Supprimer ;
 * `staged` (fichier choisi localement mais pas encore uploadé, mode
 * "création") affiche juste Supprimer. */
export function FileDropSlot({ label, path, staged, uploading, onFiles, onRemove, accept = '.pdf,.doc,.docx,image/*' }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)
  const attached = !!path || !!staged
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files) }}
      onClick={() => !attached && inputRef.current?.click()}
      style={{
        border: `1.5px dashed ${dragOver ? '#00abe9' : (attached ? '#86efac' : '#cbd5e1')}`,
        borderRadius: 10, padding: '10px 12px', background: dragOver ? '#eaf3fd' : (attached ? '#f0fdf4' : '#fff'),
        cursor: attached ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 40,
      }}
    >
      <div style={{ fontSize: 12.5, color: attached ? '#166534' : '#9aa1ac', fontWeight: 600, minWidth: 0 }}>
        {uploading ? 'Envoi…' : attached ? `✓ ${label} ajouté(e)` : `${label} — glisser-déposer ou cliquer`}
      </div>
      {attached && !uploading && (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          {path && <FileViewButton path={path} />}
          <button type="button" onClick={onRemove} title="Supprimer" style={{ ...btnBase, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}>🗑️</button>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={e => onFiles(e.target.files)} />
    </div>
  )
}
