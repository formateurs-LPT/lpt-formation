'use client'
import { useState } from 'react'

/**
 * Ressaisie du code manager — demandée avant de révéler un contenu
 * confidentiel (cf. ReportingDetailView). Ne vérifie rien elle-même : le
 * code saisi est juste remonté via onConfirm(code), à l'appelant de le
 * valider (getManagerFromDB) et de réagir à `loading`/`error`.
 */
export default function ConfirmManagerCodeModal({ onConfirm, onCancel, loading = false, error = null }) {
  const [code, setCode] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!code.trim() || loading) return
    onConfirm(code.trim())
  }

  return (
    <div onClick={onCancel} style={{
      position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(15,20,30,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <form onClick={e => e.stopPropagation()} onSubmit={submit} style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 18,
        padding: 26, width: '100%', maxWidth: 380, boxShadow: '0 24px 60px rgba(16,24,40,0.25)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a', marginBottom: 6 }}>🔒 Infos confidentielles</div>
        <p style={{ fontSize: 12.5, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
          Ressaisis ton code manager pour les afficher.
        </p>
        <input
          type="password" inputMode="numeric" autoFocus
          value={code} onChange={e => setCode(e.target.value)}
          placeholder="Code"
          style={{
            width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 12,
            background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10,
            color: '#14161a', fontSize: 14, fontFamily: 'inherit', outline: 'none',
          }}
        />
        {error && (
          <div style={{ color: '#dc2626', fontSize: 12.5, marginBottom: 12, background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 11px' }}>{error}</div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" disabled={loading || !code.trim()} className="gbtn" style={{ flex: 1 }}>
            {loading ? 'Vérification…' : 'Valider'}
          </button>
          <button type="button" onClick={onCancel} className="btn2">Annuler</button>
        </div>
      </form>
    </div>
  )
}
