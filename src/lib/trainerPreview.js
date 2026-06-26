// Carte "page suivante" — affichée dans la nav du formateur sur tous les modules

export const NEXT_PAGE_LABELS = {
  'troubles-intro':    { label: 'Introduction',        icon: '📖' },
  'troubles-list':     { label: 'Troubles visuels',   icon: '👁️' },
  'troubles-video':    { label: 'Vidéo',              icon: '🎬' },
  'correction-scale':  { label: 'Échelle correction', icon: '📏' },
  'ordonnance':        { label: 'Ordonnance',          icon: '📋' },
  'pause':             { label: 'Pause',               icon: '⏸️' },
  'saisie-interactive':{ label: 'Saisie interactive', icon: '✍️' },
  'cours':             { label: 'Cours',               icon: '📚' },
  'zone-interactif':   { label: 'Zone interactive',   icon: '🙋' },
  'prog-retour':       { label: 'Retour terrain',      icon: '💬' },
  'prog-objections':   { label: 'Objections clients', icon: '🤔' },
  'pdm-pourquoi':      { label: 'Prise de mesures',   icon: '📐' },
  'freins':            { label: 'Question ouverte',   icon: '🙋' },
  'prix':              { label: 'Question ouverte',   icon: '🙋' },
  'ventes-opticien':   { label: 'Question ouverte',   icon: '🙋' },
  'naissance':         { label: 'Présentation LPT',   icon: '🏢' },
  'chiffres':          { label: 'Chiffres clés',      icon: '📊' },
  'promesse':          { label: 'La promesse',         icon: '⚡' },
  'force-lpt':         { label: 'Points clés',        icon: '💡' },
  'offres-classique':  { label: 'Offre Classique',    icon: '👓' },
  'offres-1-1':        { label: 'Offre 1=1',          icon: '👓' },
  'impact':            { label: 'Impact visuel',      icon: '👁️' },
  'probleme':          { label: 'Problème visuel',    icon: '🔍' },
  'machines':          { label: 'Points clés',        icon: '⚙️' },
  'montures-acetate':  { label: 'Matériaux · Acétate',         icon: '🌿' },
  'montures-metal':    { label: 'Matériaux · Métal',           icon: '🪶' },
  'montures-injecte':  { label: 'Matériaux · Plastique injecté', icon: '🏭' },
}

export function NextPagePreview({ nextPage }) {
  if (!nextPage) return null
  const info = NEXT_PAGE_LABELS[nextPage.type] ?? { label: nextPage.type, icon: '📄' }
  const accent = nextPage.color || '#00abe9'
  const title = nextPage.titre || nextPage.question || nextPage.label || '—'
  return (
    <div style={{
      marginBottom: 10,
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent}35`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: 10, padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{info.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </div>
        <div style={{ fontSize: 10, color: accent, marginTop: 1 }}>{info.label}</div>
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>suivant →</div>
    </div>
  )
}
