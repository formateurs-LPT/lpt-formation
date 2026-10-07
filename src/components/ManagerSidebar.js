'use client'
import { useState } from 'react'
import Image from 'next/image'
import { IconHome, IconUsers, IconSend, IconBarChart, IconHelpCircle, IconChevronRight, IconUserPlus, IconBell, IconMessageCircle, IconTarget } from './ManagerIcons'
import { TRAINER_CONTACTS } from '@/lib/trainerContacts'

const NAV_ITEMS = [
  { id: 'accueil', label: 'Accueil', Icon: IconHome },
  { id: 'equipe', label: 'Mon équipe', shortLabel: 'Équipe', Icon: IconUsers },
  { id: 'chat', label: 'Chat magasin', shortLabel: 'Chat', Icon: IconMessageCircle },
  { id: 'entrainement', label: "J'entraîne mon équipe", shortLabel: 'Entraîner', Icon: IconTarget },
  { id: 'demandes', label: 'Demandes', Icon: IconSend },
  { id: 'recrutement', label: 'Recrutement', shortLabel: 'Recrut.', Icon: IconUserPlus },
  { id: 'reporting', label: 'Reporting', Icon: IconBarChart },
]

// Centre de notifications générique (table `notifications`, réutilisée telle
// quelle) — jusqu'ici le manager n'avait que des badges spécifiques
// (demandes/recrutement) dérivés directement de leurs tables métier. Partagé
// par les en-têtes desktop et mobile. Rendu en fenêtre centrée (même gabarit
// que la modale "Besoin d'aide ?") plutôt qu'en dropdown ancré au bouton :
// un dropdown de 300px, plus large que la sidebar, débordait sur le contenu
// et se superposait au texte de l'accueil.
export function NotificationBell({ notifications, onSelect }) {
  const [open, setOpen] = useState(false)
  const count = notifications.length
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Notifications"
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff',
          color: '#4b5563', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <IconBell size={16} />
        {count > 0 && (
          <span style={{
            position: 'absolute', top: -5, right: -5, background: '#dc2626', color: '#fff',
            fontSize: 10, fontWeight: 800, borderRadius: 20, padding: '1px 5px', minWidth: 15, textAlign: 'center',
            border: '2px solid #fff',
          }}>{count}</span>
        )}
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,20,30,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 18, width: '100%', maxWidth: 420, maxHeight: '78vh',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(16,24,40,0.25)',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '20px 22px 16px',
              borderBottom: '1px solid #f0f1f3', flexShrink: 0,
            }}>
              <div style={{ fontSize: 15.5, fontWeight: 800, color: '#14161a', flex: 1 }}>Notifications</div>
              {count > 0 && (
                <span style={{
                  background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 800,
                  borderRadius: 20, padding: '2px 9px', minWidth: 18, textAlign: 'center',
                }}>{count}</span>
              )}
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', cursor: 'pointer', fontSize: 20,
                color: '#9aa1ac', lineHeight: 1, padding: 4, flexShrink: 0,
              }}>×</button>
            </div>

            <div style={{ overflowY: 'auto', padding: notifications.length === 0 ? 0 : '8px 10px' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '44px 20px', textAlign: 'center', color: '#9aa1ac' }}>
                  <div style={{ fontSize: 30, marginBottom: 10 }}>🔔</div>
                  <div style={{ fontSize: 13 }}>Aucune notification pour l&apos;instant.</div>
                </div>
              ) : notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => { setOpen(false); onSelect(n) }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left',
                    padding: '13px 12px', borderRadius: 12, border: 'none', background: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f7f8fa' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
                >
                  <span style={{
                    fontSize: 17, flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: '#eaf3fd',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{n.icon || '🔔'}</span>
                  <span style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, paddingTop: 4 }}>{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Navigation du dashboard manager — deux présentations du même menu :
// - Desktop/TV : sidebar verticale fixe.
// - Mobile (<= 860px, cf. globals.css) : petite barre du haut (logo +
//   compte) + barre d'onglets fixée en bas, façon app native, pour que
//   l'ajout à l'écran d'accueil ressemble vraiment à une app plutôt qu'à un
//   site web compressé. Les deux blocs sont toujours dans le DOM, c'est le
//   CSS qui bascule de l'un à l'autre (évite tout flash lié à un calcul JS
//   de largeur d'écran au montage).
export default function ManagerSidebar({
  active, onNavigate, demandesCount, recrutementCount, chatCount, notifications, onSelectNotification,
  firstName, storeLabel, onLogout,
}) {
  const [helpOpen, setHelpOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  return (
    <>
      <div className="manager-sidebar-desktop" style={{
        width: 232, flexShrink: 0, minHeight: '100vh', background: '#fff',
        borderRight: '1px solid #e5e7eb', flexDirection: 'column',
        padding: '20px 16px', position: 'sticky', top: 0, alignSelf: 'flex-start',
      }}>
        {/* Positionnée en absolu plutôt qu'en ligne avec le logo : partager
            la même rangée forçait "Lunettes Pour Tous" à passer sur deux
            lignes une fois la cloche ajoutée. */}
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <NotificationBell notifications={notifications || []} onSelect={onSelectNotification} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 22px' }}>
          <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={20} height={20} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#14161a', flex: 1 }}>Lunettes Pour Tous</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
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
                {id === 'demandes' && demandesCount > 0 && (
                  <span style={{
                    background: '#fee2e2', color: '#dc2626', fontSize: 10.5, fontWeight: 800,
                    borderRadius: 20, padding: '1px 7px', minWidth: 16, textAlign: 'center',
                  }}>{demandesCount}</span>
                )}
                {id === 'recrutement' && recrutementCount > 0 && (
                  <span style={{
                    background: '#fee2e2', color: '#dc2626', fontSize: 10.5, fontWeight: 800,
                    borderRadius: 20, padding: '1px 7px', minWidth: 16, textAlign: 'center',
                  }}>{recrutementCount}</span>
                )}
                {id === 'chat' && chatCount > 0 && (
                  <span style={{
                    background: '#fee2e2', color: '#dc2626', fontSize: 10.5, fontWeight: 800,
                    borderRadius: 20, padding: '1px 7px', minWidth: 16, textAlign: 'center',
                  }}>{chatCount}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => setHelpOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', width: '100%',
              borderRadius: 10, border: '1px solid #e5e7eb', background: '#fafbfc', cursor: 'pointer',
              fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            <IconHelpCircle size={17} style={{ color: '#6b7280', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#14161a' }}>Besoin d&apos;aide ?</div>
              <div style={{ fontSize: 11, color: '#9aa1ac' }}>Contactez l&apos;équipe formation</div>
            </div>
          </button>

          <button
            onClick={() => setLogoutConfirmOpen(true)}
            title="Se déconnecter"
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', width: '100%',
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderRadius: 10, textAlign: 'left',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f5f6f8' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            <div style={{
              flexShrink: 0, width: 32, height: 32, borderRadius: '50%', background: '#0089ba',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff',
            }}>{(firstName || '?').charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#14161a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{firstName}</div>
              <div style={{ fontSize: 11, color: '#9aa1ac' }}>Manager · {storeLabel}</div>
            </div>
            <IconChevronRight size={15} style={{ color: '#c7cbd1', flexShrink: 0 }} />
          </button>
        </div>
      </div>

      {/* Barre du haut mobile — logo + notifications + aide + déconnexion,
          remplace le bloc équivalent de la sidebar desktop. */}
      <div className="manager-topbar-mobile" style={{
        alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={20} height={20} style={{ objectFit: 'contain', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#14161a', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {storeLabel}
        </span>
        <NotificationBell notifications={notifications || []} onSelect={onSelectNotification} />
        <button
          onClick={() => setHelpOpen(true)}
          title="Besoin d'aide ?"
          style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: '#f3f4f6', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', cursor: 'pointer',
          }}
        ><IconHelpCircle size={16} /></button>
        <button
          onClick={() => setLogoutConfirmOpen(true)}
          title="Se déconnecter"
          style={{
            flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: '#0089ba', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, color: '#fff', cursor: 'pointer',
          }}
        >{(firstName || '?').charAt(0).toUpperCase()}</button>
      </div>

      {/* Barre d'onglets mobile — fixée en bas, façon app native. */}
      <nav className="manager-bottomnav-mobile" style={{
        background: '#fff', borderTop: '1px solid #e5e7eb',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        <div style={{ display: 'flex' }}>
          {NAV_ITEMS.map(({ id, label, shortLabel, Icon }) => {
            const isActive = active === id
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                style={{
                  flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  padding: '9px 3px 8px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  color: isActive ? '#0089ba' : '#9aa1ac', position: 'relative',
                }}
              >
                <span style={{ position: 'relative' }}>
                  <Icon size={20} />
                  {id === 'demandes' && demandesCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -7, background: '#dc2626', color: '#fff',
                      fontSize: 9, fontWeight: 800, borderRadius: 20, padding: '1px 4px', minWidth: 13, textAlign: 'center', lineHeight: 1.3,
                    }}>{demandesCount}</span>
                  )}
                  {id === 'recrutement' && recrutementCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -7, background: '#dc2626', color: '#fff',
                      fontSize: 9, fontWeight: 800, borderRadius: 20, padding: '1px 4px', minWidth: 13, textAlign: 'center', lineHeight: 1.3,
                    }}>{recrutementCount}</span>
                  )}
                  {id === 'chat' && chatCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -4, right: -7, background: '#dc2626', color: '#fff',
                      fontSize: 9, fontWeight: 800, borderRadius: 20, padding: '1px 4px', minWidth: 13, textAlign: 'center', lineHeight: 1.3,
                    }}>{chatCount}</span>
                  )}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 700 : 600, maxWidth: '100%',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>{shortLabel || label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {helpOpen && (
        <div
          onClick={() => setHelpOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,20,30,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 360,
              boxShadow: '0 24px 60px rgba(16,24,40,0.25)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a', marginBottom: 4 }}>Besoin d&apos;aide ?</div>
            <p style={{ fontSize: 12.5, color: '#6b7280', margin: '0 0 16px' }}>Contactez directement l&apos;équipe formation.</p>
            {TRAINER_CONTACTS.map(c => (
              <a
                key={c.name} href={`tel:${c.phone}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12,
                  background: '#f7f8fa', border: '1px solid #e5e7eb', textDecoration: 'none', marginBottom: 8,
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#0089ba', color: '#fff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14,
                }}>{c.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#14161a' }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#0089ba', fontWeight: 600 }}>{c.phone}</div>
                </div>
                <span style={{ fontSize: 18 }}>📞</span>
              </a>
            ))}
            <button
              onClick={() => setHelpOpen(false)}
              style={{
                width: '100%', marginTop: 4, padding: '10px', background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >Fermer</button>
          </div>
        </div>
      )}

      {logoutConfirmOpen && (
        <div
          onClick={() => setLogoutConfirmOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,20,30,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 18, padding: 24, width: '100%', maxWidth: 340, textAlign: 'center',
              boxShadow: '0 24px 60px rgba(16,24,40,0.25)',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a', marginBottom: 6 }}>Déconnexion ?</div>
            <p style={{ fontSize: 12.5, color: '#6b7280', margin: '0 0 20px' }}>Tu devras ressaisir ton identifiant et ton code magasin pour te reconnecter.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                style={{
                  flex: 1, padding: '11px', background: '#fff', border: '1px solid #e5e7eb',
                  borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Annuler</button>
              <button
                onClick={onLogout}
                style={{
                  flex: 1, padding: '11px', background: '#dc2626', border: 'none',
                  borderRadius: 10, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
