'use client'
import { useState } from 'react'
import Image from 'next/image'
import { IconUserPlus, IconClipboard, IconChevronRight } from './ManagerIcons'
import { NotificationBell } from './ManagerSidebar'

const NAV_ITEMS = [
  { id: 'recrutement', label: 'Recrutement', Icon: IconUserPlus },
  { id: 'entrees', label: 'Entrées de la semaine', shortLabel: 'Entrées', Icon: IconClipboard },
]

// Navigation latérale du dashboard RH — même patron que ManagerSidebar
// (largeur, couleurs, état actif/survol, footer identité+déconnexion) pour
// que les deux dashboards se comportent comme un seul produit cohérent.
// Mobile (<=860px, même seuil que Manager) : coquille d'app — barre du haut
// + barre d'onglets en bas, sidebar desktop masquée (cf. .rh-* dans
// globals.css, calquées sur .manager-*).
export default function RhSidebar({ active, onNavigate, counts, firstName, onLogout, notifications, onSelectNotification }) {
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)

  return (
    <>
    <div className="rh-sidebar-desktop" style={{
      width: 232, flexShrink: 0, minHeight: '100vh', background: '#fff',
      borderRight: '1px solid #e5e7eb', flexDirection: 'column',
      padding: '20px 16px', position: 'sticky', top: 0, alignSelf: 'flex-start',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 22px' }}>
        <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={20} height={20} style={{ objectFit: 'contain' }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#14161a', flex: 1 }}>Lunettes Pour Tous</span>
        <NotificationBell notifications={notifications || []} onSelect={onSelectNotification} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = active === id
          const count = counts?.[id]
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
              {count > 0 && (
                <span style={{
                  background: '#fee2e2', color: '#dc2626', fontSize: 10.5, fontWeight: 800,
                  borderRadius: 20, padding: '1px 7px', minWidth: 16, textAlign: 'center',
                }}>{count}</span>
              )}
            </button>
          )
        })}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={onLogout}
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
            <div style={{ fontSize: 11, color: '#9aa1ac' }}>Ressources humaines</div>
          </div>
          <IconChevronRight size={15} style={{ color: '#c7cbd1', flexShrink: 0 }} />
        </button>
      </div>
    </div>

    {/* Barre du haut mobile — logo + déconnexion, remplace le bloc
        équivalent de la sidebar desktop. */}
    <div className="rh-topbar-mobile" style={{
      alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff',
      borderBottom: '1px solid #e5e7eb',
    }}>
      <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={20} height={20} style={{ objectFit: 'contain', flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#14161a', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Ressources humaines
      </span>
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
    <nav className="rh-bottomnav-mobile" style={{
      background: '#fff', borderTop: '1px solid #e5e7eb',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <div style={{ display: 'flex' }}>
        {NAV_ITEMS.map(({ id, label, shortLabel, Icon }) => {
          const isActive = active === id
          const count = counts?.[id]
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
                {count > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -7, background: '#dc2626', color: '#fff',
                    fontSize: 9, fontWeight: 800, borderRadius: 20, padding: '1px 4px', minWidth: 13, textAlign: 'center', lineHeight: 1.3,
                  }}>{count}</span>
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

    {logoutConfirmOpen && (
      <div
        onClick={() => setLogoutConfirmOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,20,30,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}
      >
        <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 20, width: '100%', maxWidth: 320 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a', marginBottom: 16 }}>Se déconnecter de l&apos;espace RH ?</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setLogoutConfirmOpen(false)} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff', color: '#14161a', fontWeight: 600, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>Annuler</button>
            <button onClick={onLogout} style={{ flex: 1, padding: '11px', borderRadius: 10, border: 'none', background: '#0089ba', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}>Se déconnecter</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
