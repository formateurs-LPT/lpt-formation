'use client'
import { IconHome, IconMapPin, IconSend, IconStar, IconMessageCircle, IconClipboard, IconHelpCircle, IconBarChart, IconBell } from './ManagerIcons'

// Le détail de quelle activeView appartient à quelle catégorie (et quelle vue
// sert de "porte d'entrée" par défaut) vit dans Dashboard.js, pas ici : ce
// composant ne connaît que la présentation, pas les ~20 écrans internes du
// formateur. Onboarding et Entrées de la semaine n'ont volontairement pas de
// catégorie dédiée : déjà accessibles depuis le dashboard (bannière / tuile),
// pas la peine de les dupliquer ici (cf. tri demandé par Kevin).
export const TRAINER_CATEGORIES = [
  { id: 'accueil', label: 'Accueil', Icon: IconHome },
  { id: 'sessions', label: 'Sessions réalisées', Icon: IconBarChart },
  { id: 'suivi-terrain', label: 'Suivi terrain', Icon: IconMapPin },
  { id: 'inscriptions', label: 'Inscriptions formations', Icon: IconBell },
  { id: 'demandes', label: "Demandes d'intervention", Icon: IconSend },
  { id: 'evaluations', label: 'Évaluations & notes', Icon: IconStar },
  { id: 'retour-formation', label: 'Retour formation', Icon: IconMessageCircle },
  { id: 'fiches-pratiques', label: 'Fiches pratiques', Icon: IconClipboard },
  { id: 'idees', label: 'Idées & remontées', Icon: IconHelpCircle },
]

// Pas de topbar mobile ici, contrairement à ManagerSidebar : le <Topbar>
// commun (src/components/Topbar.js) couvre déjà ce rôle pour toutes les
// vues formateur (logo, connectés, démarrer, diffusion, déconnexion) — en
// ajouter un second ferait doublon. Seule la barre d'onglets du bas est
// nouvelle sur mobile.
export default function TrainerShell({ active, onNavigateCategory, badges = {}, footerSlot }) {
  return (
    <>
      <div className="trainer-sidebar-desktop" style={{
        width: 220, flexShrink: 0, minHeight: '100%', background: '#fff',
        borderRight: '1px solid #e5e7eb', flexDirection: 'column',
        padding: '20px 14px', position: 'sticky', top: 0, alignSelf: 'flex-start',
      }}>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {TRAINER_CATEGORIES.map(({ id, label, Icon }) => {
            const isActive = active === id
            const badge = badges[id]
            return (
              <button
                key={id}
                onClick={() => onNavigateCategory(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', width: '100%',
                  padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: isActive ? '#eaf3fd' : 'transparent',
                  color: isActive ? '#0089ba' : '#4b5563',
                  fontSize: 13.5, fontWeight: isActive ? 700 : 600, transition: 'background .15s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f5f6f8' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{label}</span>
                {badge > 0 && (
                  <span style={{
                    background: '#fee2e2', color: '#dc2626', fontSize: 10.5, fontWeight: 800,
                    borderRadius: 20, padding: '1px 7px', minWidth: 16, textAlign: 'center',
                  }}>{badge}</span>
                )}
              </button>
            )
          })}
        </nav>
        {footerSlot && <div style={{ marginTop: 10 }}>{footerSlot}</div>}
      </div>

      <nav className="trainer-bottomnav-mobile" style={{
        background: '#fff', borderTop: '1px solid #e5e7eb',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{ display: 'flex' }}>
          {TRAINER_CATEGORIES.map(({ id, label, Icon }) => {
            const isActive = active === id
            const badge = badges[id]
            return (
              <button
                key={id}
                onClick={() => onNavigateCategory(id)}
                style={{
                  flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '9px 3px 8px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  color: isActive ? '#0089ba' : '#9aa1ac', position: 'relative',
                }}
              >
                <span style={{ position: 'relative' }}>
                  <Icon size={20} />
                  {badge > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -7, background: '#dc2626', color: '#fff',
                      fontSize: 9, fontWeight: 800, borderRadius: 20, padding: '1px 4px', minWidth: 13, textAlign: 'center', lineHeight: 1.3,
                    }}>{badge}</span>
                  )}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 600, maxWidth: '100%',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
