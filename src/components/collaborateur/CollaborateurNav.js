'use client'

// Navigation à 3 sections du dashboard collaborateur complet (Ma progression
// / Cours / Exercices). Onglets en haut sur ordinateur ; sur mobile, barre
// fixée en bas (pouce), dans l'esprit de .manager-bottomnav-mobile /
// .rh-bottomnav-mobile (globals.css) mais en `position:sticky` plutôt qu'une
// coquille d'app complète : cette page défile normalement (pas besoin de
// réarchitecturer EspaceComplet, qui fonctionne déjà bien tel quel).

const SECTIONS = [
  { id: 'progression', label: 'Ma progression', emoji: '📊' },
  { id: 'cours', label: 'Cours', emoji: '📖' },
  { id: 'exercices', label: 'Exercices', emoji: '✅' },
]

export default function CollaborateurNav({ active, onChange }) {
  return (
    <nav className="collab-nav" aria-label="Navigation du dashboard">
      {SECTIONS.map(s => {
        const isActive = active === s.id
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className="collab-nav-btn"
            style={{
              background: isActive ? '#eaf3fd' : 'transparent',
              color: isActive ? '#0089ba' : '#6b7280',
              fontWeight: isActive ? 700 : 600,
            }}
          >
            <span className="collab-nav-emoji">{s.emoji}</span>
            <span className="collab-nav-label">{s.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
