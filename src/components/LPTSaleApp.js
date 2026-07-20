'use client'
import { useState } from 'react'

// ── Couleurs LPTSale ──────────────────────────────────────────────
const BLUE   = '#1aa3cc'   // Vente / sélection active
const ORANGE = '#f59e0b'   // Opto
const RED    = '#e84040'   // SAV
const TEXT   = '#111827'
const SUB    = '#6b7280'
const BORDER = '#e5e7eb'

// ── Données simulées — 10 clients au dispatch ─────────────────────
const ALL_CLIENTS = [
  { id: 1,  nom: 'Maguy Lagarrigue',  type: 'VENTE', vendeur: 'Syntiche DIKEBELA', minutesAgo: 49, lentilles: false, enCours: false },
  { id: 2,  nom: 'Aiyana DAMIANO',    type: 'OPTO',  vendeur: 'Arthur LARCHE',     minutesAgo: 14, lentilles: false, enCours: true  },
  { id: 3,  nom: 'F. Mevi',           type: 'VENTE', vendeur: 'Théo GUARRIGUE',    minutesAgo: 0,  lentilles: false, enCours: false },
  { id: 4,  nom: 'Sara Ben azzouz',   type: 'OPTO',  internet: true, heure: '16:45', lentilles: false, enCours: false },
  { id: 5,  nom: 'Eya Adouni',        type: 'OPTO',  internet: true, heure: '16:30', lentilles: true,  enCours: false },
  { id: 6,  nom: 'Sandra de cazes',   type: 'OPTO',  internet: true, heure: '16:30', lentilles: true,  enCours: false },
  { id: 7,  nom: 'Pierre Durand',     type: 'VENTE', vendeur: 'Marie LECLERC',     minutesAgo: 25, lentilles: false, enCours: false },
  { id: 8,  nom: 'Camille Bernard',   type: 'SAV',   vendeur: 'Tom MARTIN',        minutesAgo: 8,  lentilles: false, enCours: false },
  { id: 9,  nom: 'Julie MOREAU',      type: 'OPTO',  internet: true, heure: '17:00', lentilles: true,  enCours: false },
  { id: 10, nom: 'Marc Petit',        type: 'SAV',   internet: true, heure: '15:45', lentilles: false, enCours: false },
]

function typeColor(type) {
  if (type === 'VENTE') return BLUE
  if (type === 'OPTO')  return ORANGE
  if (type === 'SAV')   return RED
  return '#888'
}

function timeLabel(client) {
  if (client.internet) return `@${client.heure}`
  if (client.minutesAgo === 0) return 'il y a 0 minute(s)'
  return `il y a ${client.minutesAgo} minute(s)`
}

function statusLabel(client) {
  if (client.enCours) return 'Opto en cours'
  if (client.type === 'VENTE') return 'Vente'
  if (client.type === 'OPTO')  return 'Opto'
  if (client.type === 'SAV')   return 'SAV'
  return client.type
}

// ── Icône lentilles (contact lens) ───────────────────────────────
function LentilleIcon() {
  return (
    <svg width="30" height="18" viewBox="0 0 30 18" style={{ display: 'block' }}>
      <path d="M2 9 Q8 1 15 1 Q22 1 28 9 Q22 17 15 17 Q8 17 2 9 Z"
        fill="none" stroke="#aaa" strokeWidth="1.6"/>
      <circle cx="15" cy="9" r="3.5" fill="none" stroke="#aaa" strokeWidth="1.3"/>
    </svg>
  )
}

// ── Logo LPT (inline SVG dark) ────────────────────────────────────
function LPTLogoSale({ size = 50 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <g fill="#1a1a1a">
        <polygon points="50,5 61,19 50,24 39,19"/>
        <polygon points="95,50 81,61 76,50 81,39"/>
        <polygon points="50,95 39,81 50,76 61,81"/>
        <polygon points="5,50 19,39 24,50 19,61"/>
        <path d="M19,19 L44,19 L44,25 L25,25 L25,44 L19,44 Z"/>
        <polygon points="44,19 50,24 44,25"/>
        <polygon points="19,44 24,50 25,44"/>
        <path d="M81,19 L56,19 L56,25 L75,25 L75,44 L81,44 Z"/>
        <polygon points="56,19 50,24 56,25"/>
        <polygon points="81,44 76,50 75,44"/>
        <path d="M81,81 L56,81 L56,75 L75,75 L75,56 L81,56 Z"/>
        <polygon points="56,81 50,76 56,75"/>
        <polygon points="81,56 76,50 75,56"/>
        <path d="M19,81 L44,81 L44,75 L25,75 L25,56 L19,56 Z"/>
        <polygon points="44,81 50,76 44,75"/>
        <polygon points="19,56 24,50 25,56"/>
      </g>
    </svg>
  )
}

// ── Avatar initiales ──────────────────────────────────────────────
function Avatar({ initials = 'TF', size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: BLUE, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 700, letterSpacing: 0.5,
      flexShrink: 0, userSelect: 'none',
    }}>
      {initials}
    </div>
  )
}

// ── Filtre tabs ───────────────────────────────────────────────────
const FILTERS = ['TOUS', 'VENTE', 'SAV', 'OPTO']

function FilterTabs({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px' }}>
      {FILTERS.map(f => {
        const sel = active === f
        return (
          <button
            key={f}
            onClick={() => onChange(f)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 24,
              border: sel ? 'none' : `1.5px solid ${BORDER}`,
              background: sel ? BLUE : '#fff',
              color: sel ? '#fff' : TEXT,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', letterSpacing: 0.3,
              transition: 'all .15s',
            }}
          >
            {f}
          </button>
        )
      })}
    </div>
  )
}

// ── Carte client ──────────────────────────────────────────────────
function ClientCard({ client, onPress }) {
  const color = typeColor(client.type)
  const status = statusLabel(client)
  const time = timeLabel(client)
  const clickable = !client.enCours

  return (
    <div
      onClick={clickable ? () => onPress(client) : undefined}
      style={{
        background: '#fff',
        borderBottom: `1px solid ${BORDER}`,
        borderLeft: `4px solid ${color}`,
        padding: '12px 14px 12px 14px',
        cursor: clickable ? 'pointer' : 'default',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Ligne 1 : nom + temps */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: TEXT, flex: 1, paddingRight: 8 }}>
          {client.nom}
        </span>
        <span style={{ fontSize: 12, color: SUB, flexShrink: 0, marginTop: 2 }}>
          {time}
        </span>
      </div>

      {/* Ligne 2 : statut + icône lentille + chevron */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 14, color: SUB }}>{status}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {client.lentilles && <LentilleIcon />}
          {clickable && (
            <span style={{ color: '#bbb', fontSize: 16, lineHeight: 1 }}>›</span>
          )}
        </div>
      </div>

      {/* Ligne 3 : vendeur / @ */}
      <div style={{ fontSize: 12, color: '#aaa' }}>
        {client.internet ? '@' : `par ${client.vendeur}`}
      </div>
    </div>
  )
}

// ── Menu hamburger (drawer gauche) ────────────────────────────────
const MENU_ITEMS = [
  { icon: '📊', label: 'Statistiques du jour' },
  { icon: '📅', label: 'Planning opticiens' },
  { icon: '⚙️', label: 'Paramètres du magasin' },
  { icon: '👤', label: 'Mon profil' },
  { icon: '🔔', label: 'Notifications' },
  { icon: '🚪', label: 'Déconnexion' },
]

function MenuDrawer({ onClose }) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          zIndex: 100,
        }}
      />
      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '72%', maxWidth: 300,
        background: '#fff', zIndex: 101, display: 'flex', flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
      }}>
        {/* Header drawer */}
        <div style={{
          padding: '48px 20px 20px',
          background: BLUE,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <Avatar initials="TF" size={48} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Vendeur Formation</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>LPT · Mode simulation</div>
          </div>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {MENU_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={onClose}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', background: 'none', border: 'none',
                fontSize: 14, color: TEXT, cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', borderBottom: `1px solid ${BORDER}`,
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px', borderTop: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11, color: '#ccc', textAlign: 'center' }}>
            LPTSale · Simulation formation
          </div>
        </div>
      </div>
    </>
  )
}

// ── Bouton FAB (action rapide) ────────────────────────────────────
function FabMenu({ onClose }) {
  const actions = [
    { label: 'Inscrire un client en vente',   color: BLUE,   icon: '👓' },
    { label: 'Inscrire un client en examen',  color: ORANGE, icon: '👁️' },
    { label: 'Inscrire un client en SAV',     color: RED,    icon: '🔧' },
  ]
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
      <div style={{
        position: 'fixed', bottom: 90, right: 20, zIndex: 91,
        display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
      }}>
        {actions.map((a, i) => (
          <div
            key={i}
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer',
            }}
          >
            <div style={{
              background: '#fff', borderRadius: 8, padding: '8px 14px',
              fontSize: 13, fontWeight: 600, color: TEXT,
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              border: `1px solid ${BORDER}`,
            }}>
              {a.label}
            </div>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              background: a.color, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              flexShrink: 0,
            }}>
              {a.icon}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Écran fiche client (placeholder, à compléter) ─────────────────
function ClientDetailScreen({ client, onBack }) {
  const color = typeColor(client.type)
  return (
    <div style={{ minHeight: '100dvh', background: '#f5f5f5', fontFamily: 'system-ui,sans-serif' }}>
      {/* Header */}
      <div style={{
        background: '#fff', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
        borderBottom: `1px solid ${BORDER}`,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', fontSize: 22,
            color: BLUE, cursor: 'pointer', padding: '0 4px', lineHeight: 1,
          }}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: TEXT }}>{client.nom}</div>
          <div style={{ fontSize: 12, color: SUB }}>{statusLabel(client)}</div>
        </div>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          background: color, flexShrink: 0,
        }}/>
      </div>

      {/* Placeholder contenu */}
      <div style={{
        margin: 20, background: '#fff', borderRadius: 12,
        border: `1px solid ${BORDER}`, padding: '24px 20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 6 }}>
          Fiche client
        </div>
        <div style={{ fontSize: 13, color: SUB, lineHeight: 1.6 }}>
          Partage le prochain écran de l&#39;app<br/>pour que je puisse reproduire<br/>cette page.
        </div>
      </div>

      {/* Infos de base */}
      <div style={{ margin: '0 20px', background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Type de prise en charge</div>
          <div style={{ fontSize: 14, fontWeight: 700, color }}>{statusLabel(client)}</div>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Inscrit</div>
          <div style={{ fontSize: 14, color: TEXT }}>
            {client.internet ? `Rendez-vous internet — ${client.heure}` : `par ${client.vendeur} · ${timeLabel(client)}`}
          </div>
        </div>
        {client.lentilles && (
          <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <LentilleIcon />
            <span style={{ fontSize: 14, color: TEXT }}>Porte des lentilles</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Écran principal Dispatch ──────────────────────────────────────
function DispatchScreen({ pName, onOpenMenu, onSelectClient }) {
  const [filter, setFilter] = useState('TOUS')
  const [showFab, setShowFab] = useState(false)

  const initials = (() => {
    if (!pName) return 'TF'
    const parts = pName.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return pName.slice(0, 2).toUpperCase()
  })()

  const filtered = filter === 'TOUS'
    ? ALL_CLIENTS
    : ALL_CLIENTS.filter(c => c.type === filter)

  return (
    <div style={{
      minHeight: '100dvh', background: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>
      {showFab && <FabMenu onClose={() => setShowFab(false)} />}

      {/* Barre de navigation app */}
      <div style={{
        background: '#fff', padding: '12px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: `1px solid ${BORDER}`,
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Hamburger */}
        <button
          onClick={onOpenMenu}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px', display: 'flex', flexDirection: 'column', gap: 4,
          }}
        >
          <span style={{ display: 'block', width: 22, height: 2, background: TEXT, borderRadius: 1 }}/>
          <span style={{ display: 'block', width: 22, height: 2, background: TEXT, borderRadius: 1 }}/>
          <span style={{ display: 'block', width: 22, height: 2, background: TEXT, borderRadius: 1 }}/>
        </button>

        {/* Logo */}
        <LPTLogoSale size={44} />

        {/* Avatar */}
        <Avatar initials={initials} size={40} />
      </div>

      {/* Titre + compteur */}
      <div style={{ background: '#fff', paddingBottom: 16, borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ textAlign: 'center', padding: '20px 16px 4px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: TEXT, margin: 0 }}>Dispatch</h1>
          <p style={{ fontSize: 14, color: '#aaa', margin: '6px 0 16px' }}>
            {ALL_CLIENTS.length} personne(s) dans le dispatch
          </p>
        </div>
        <FilterTabs active={filter} onChange={setFilter} />
      </div>

      {/* Liste clients */}
      <div style={{ flex: 1, background: '#fff', marginTop: 8 }}>
        {filtered.map(client => (
          <ClientCard
            key={client.id}
            client={client}
            onPress={onSelectClient}
          />
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowFab(v => !v)}
        style={{
          position: 'fixed', bottom: 24, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: BLUE, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(26,163,204,0.45)',
          zIndex: 80,
        }}
      >
        {/* Icône grille (:::) */}
        <svg width="22" height="22" viewBox="0 0 22 22">
          {[3,11,19].map(y => [3,11,19].map(x => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2" fill="#fff"/>
          )))}
        </svg>
      </button>
    </div>
  )
}

// ── Composant principal exporté ────────────────────────────────────
export default function LPTSaleApp({ pName }) {
  const [screen, setScreen]   = useState('dispatch')   // 'dispatch' | 'client' | 'menu'
  const [selected, setSelected] = useState(null)

  if (screen === 'menu') {
    return (
      <>
        <DispatchScreen
          pName={pName}
          onOpenMenu={() => setScreen('menu')}
          onSelectClient={c => { setSelected(c); setScreen('client') }}
        />
        <MenuDrawer onClose={() => setScreen('dispatch')} />
      </>
    )
  }

  if (screen === 'client' && selected) {
    return (
      <ClientDetailScreen
        client={selected}
        onBack={() => { setSelected(null); setScreen('dispatch') }}
      />
    )
  }

  return (
    <DispatchScreen
      pName={pName}
      onOpenMenu={() => setScreen('menu')}
      onSelectClient={c => { setSelected(c); setScreen('client') }}
    />
  )
}
