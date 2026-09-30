'use client'

// Petites icônes ligne (style Feather) dessinées à la main — le projet
// n'utilise aucune librairie d'icônes (tout le reste est en emoji), et en
// ajouter une pour 8 pictos serait disproportionné. currentColor permet de
// piloter la couleur (état actif du menu, etc.) via le CSS du parent.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconHome({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  )
}

export function IconUsers({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function IconUserPlus({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M13 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="7" cy="7" r="4" />
      <path d="M20 8v6" />
      <path d="M23 11h-6" />
    </svg>
  )
}

export function IconSend({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

export function IconBarChart({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

export function IconHelpCircle({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export function IconVideo({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

export function IconMapPin({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export function IconChevronRight({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function IconClipboard({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  )
}

export function IconTarget({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  )
}

export function IconBell({ size = 18, ...props }) {
  return (
    <svg width={size} height={size} {...base} {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}
