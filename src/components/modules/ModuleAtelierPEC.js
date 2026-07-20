'use client'

export default function ModuleAtelierPEC({ pName, onBack }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#03112a', color: '#fff',
      fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32,
    }}>
      <div style={{
        fontSize: 48, marginBottom: 8,
      }}>📋</div>
      <div style={{
        fontSize: 10, fontWeight: 700, color: '#f97316', textTransform: 'uppercase',
        letterSpacing: 2, background: 'rgba(249,115,22,0.12)',
        border: '1px solid rgba(249,115,22,0.3)', borderRadius: 20, padding: '4px 14px',
      }}>
        Nouveau module · En cours de construction
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, textAlign: 'center' }}>
        Atelier prise en charge
      </h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
        Le contenu de ce module sera ajouté prochainement.
        Dis-moi où l&#39;intégrer dans le programme et ce qu&#39;il doit contenir.
      </p>
      <button
        onClick={onBack}
        style={{
          marginTop: 16, background: 'rgba(249,115,22,0.12)',
          border: '1px solid rgba(249,115,22,0.35)', color: '#f97316',
          fontSize: 13, fontWeight: 700, padding: '10px 24px',
          borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        ← Retour
      </button>
    </div>
  )
}
