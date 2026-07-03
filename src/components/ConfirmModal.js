'use client'

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
  danger = false,
  loading = false,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '32px 28px',
          maxWidth: 420, width: '100%', textAlign: 'center',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 12 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 28 }}>{message}</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #e5e7eb',
              background: '#f9fafb', color: '#374151', fontWeight: 600, fontSize: 14,
              cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{
              flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
              background: danger ? '#dc2626' : 'var(--lpt, #0089ba)', color: '#fff',
              fontWeight: 700, fontSize: 14,
              cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
