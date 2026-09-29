'use client'
import Image from 'next/image'
import { IconHome, IconUsers, IconSend, IconBarChart, IconHelpCircle, IconChevronRight, IconUserPlus } from './ManagerIcons'

const NAV_ITEMS = [
  { id: 'accueil', label: 'Accueil', Icon: IconHome },
  { id: 'equipe', label: 'Mon équipe', Icon: IconUsers },
  { id: 'demandes', label: 'Demandes', Icon: IconSend },
  { id: 'recrutement', label: 'Recrutement', Icon: IconUserPlus },
  { id: 'reporting', label: 'Reporting', Icon: IconBarChart },
]

// Navigation latérale du dashboard manager — remplace le long scroll unique
// par de vrais écrans séparés (Accueil / Mon équipe / Demandes / Recrutement /
// Reporting), à l'image d'un vrai produit SaaS plutôt que d'une simple page magasin.
export default function ManagerSidebar({ active, onNavigate, demandesCount, recrutementCount, firstName, storeLabel, onLogout }) {
  return (
    <div style={{
      width: 232, flexShrink: 0, minHeight: '100vh', background: '#fff',
      borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column',
      padding: '20px 16px', position: 'sticky', top: 0, alignSelf: 'flex-start',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 22px' }}>
        <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={20} height={20} style={{ objectFit: 'contain' }} />
        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#14161a' }}>Lunettes Pour Tous</span>
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
            </button>
          )
        })}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
          borderRadius: 10, border: '1px solid #e5e7eb', background: '#fafbfc',
        }}>
          <IconHelpCircle size={17} style={{ color: '#6b7280', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#14161a' }}>Besoin d&apos;aide ?</div>
            <div style={{ fontSize: 11, color: '#9aa1ac' }}>Contactez l&apos;équipe formation</div>
          </div>
        </div>

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
            <div style={{ fontSize: 11, color: '#9aa1ac' }}>Manager · {storeLabel}</div>
          </div>
          <IconChevronRight size={15} style={{ color: '#c7cbd1', flexShrink: 0 }} />
        </button>
      </div>
    </div>
  )
}
