'use client'
import { useState } from 'react'

// Couleurs exactes du screenshot
const BLUE   = '#1aa3cc'   // bordure Vente + filtre actif
const ORANGE = '#f59e0b'   // bordure Opto
const RED    = '#e84040'   // bordure SAV
const TEXT   = '#111111'
const GRAY   = '#888888'   // status text
const GRAY_LIGHT = '#bbbbbb'  // vendeur / @ text
const BORDER_COLOR = '#e0e0e0'

function typeColor(type) {
  if (type === 'VENTE') return BLUE
  if (type === 'OPTO')  return ORANGE
  if (type === 'SAV')   return RED
  return '#888'
}

function statusLabel(c) {
  if (c.enCours) return 'Opto en cours'
  if (c.type === 'VENTE') return 'Vente'
  if (c.type === 'OPTO')  return 'Opto'
  return 'SAV'
}

function timeLabel(c) {
  if (c.internet) return `@${c.heure}`
  return `il y a ${c.minutesAgo} minute(s)`
}

// Données simulées — réplique exacte du dispatch
const ALL_CLIENTS = [
  { id:1,  nom:'Maguy Lagarrigue', type:'VENTE', vendeur:'Syntiche DIKEBELA', minutesAgo:49, lentilles:false, enCours:false },
  { id:2,  nom:'Aiyana DAMIANO',   type:'OPTO',  vendeur:'Arthur LARCHE',     minutesAgo:14, lentilles:false, enCours:true  },
  { id:3,  nom:'F. Mevi',          type:'VENTE', vendeur:'Théo GUARRIGUE',    minutesAgo:0,  lentilles:false, enCours:false },
  { id:4,  nom:'Sara Ben azzouz',  type:'OPTO',  internet:true, heure:'16:45', lentilles:false, enCours:false },
  { id:5,  nom:'Eya Adouni',       type:'OPTO',  internet:true, heure:'16:30', lentilles:true,  enCours:false },
  { id:6,  nom:'Sandra de cazes',  type:'OPTO',  internet:true, heure:'16:30', lentilles:true,  enCours:false },
  { id:7,  nom:'Pierre Durand',    type:'VENTE', vendeur:'Marie LECLERC',     minutesAgo:25, lentilles:false, enCours:false },
  { id:8,  nom:'Camille Bernard',  type:'SAV',   vendeur:'Tom MARTIN',        minutesAgo:8,  lentilles:false, enCours:false },
  { id:9,  nom:'Julie MOREAU',     type:'OPTO',  internet:true, heure:'17:00', lentilles:true,  enCours:false },
  { id:10, nom:'Marc Petit',       type:'SAV',   internet:true, heure:'15:45', lentilles:false, enCours:false },
]

// Icône lentilles — 2 feuilles/ovales imbriquées comme dans le screenshot
function LentilleIcon() {
  return (
    <svg width="34" height="20" viewBox="0 0 34 20" style={{ display:'block', flexShrink:0 }}>
      {/* Forme contact lens : ovale avec courbe intérieure */}
      <path d="M2 10 Q9 1 17 1 Q25 1 32 10 Q25 19 17 19 Q9 19 2 10Z"
        fill="none" stroke="#bbb" strokeWidth="1.6"/>
      <path d="M7 10 Q12 5 17 5 Q22 5 27 10 Q22 15 17 15 Q12 15 7 10Z"
        fill="none" stroke="#bbb" strokeWidth="1.2"/>
    </svg>
  )
}

// Logo LPT geometrique — réplique du SVG existant en sombre
function LPTLogoSale({ size = 48 }) {
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

// Avatar — cercle bleu avec initiales (comme "TG" dans le screenshot)
function Avatar({ initials = 'TF' }) {
  return (
    <div style={{
      width:42, height:42, borderRadius:'50%',
      background: BLUE, color:'#fff',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:15, fontWeight:700, letterSpacing:0.5,
      flexShrink:0, userSelect:'none',
    }}>
      {initials}
    </div>
  )
}

// Hamburger ≡ — 3 lignes comme dans le screenshot
function Hamburger({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background:'none', border:'none', cursor:'pointer', padding:'4px 2px', flexShrink:0 }}
    >
      <svg width="24" height="18" viewBox="0 0 24 18">
        <rect y="0"  width="24" height="2.5" rx="1.2" fill={TEXT}/>
        <rect y="7"  width="24" height="2.5" rx="1.2" fill={TEXT}/>
        <rect y="14" width="24" height="2.5" rx="1.2" fill={TEXT}/>
      </svg>
    </button>
  )
}

// Carte client — réplique exacte du screenshot
function ClientCard({ client, onPress }) {
  const color   = typeColor(client.type)
  const status  = statusLabel(client)
  const time    = timeLabel(client)
  const showChevron = !client.enCours

  return (
    <div
      onClick={showChevron ? () => onPress(client) : undefined}
      style={{
        display:'flex',
        borderBottom:`1px solid ${BORDER_COLOR}`,
        cursor: showChevron ? 'pointer' : 'default',
        background:'#fff',
        userSelect:'none',
      }}
    >
      {/* Bande colorée gauche */}
      <div style={{ width:4, flexShrink:0, background:color }} />

      {/* Contenu */}
      <div style={{ flex:1, padding:'12px 14px 10px 14px', minWidth:0 }}>

        {/* Ligne 1 : nom + temps */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:3 }}>
          <span style={{ fontSize:16, fontWeight:700, color:TEXT, flex:1, paddingRight:8, lineHeight:1.3 }}>
            {client.nom}
          </span>
          <span style={{ fontSize:12, color:GRAY, flexShrink:0, paddingTop:2 }}>
            {time}
          </span>
        </div>

        {/* Ligne 2 : statut + icône lentilles + chevron */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:3 }}>
          <span style={{ fontSize:14, color:GRAY }}>{status}</span>
          <div style={{ display:'flex', alignItems:'center', gap:4, flexShrink:0 }}>
            {client.lentilles && <LentilleIcon />}
            {showChevron && (
              <span style={{ fontSize:20, color:'#ccc', lineHeight:1, fontWeight:300 }}>›</span>
            )}
          </div>
        </div>

        {/* Ligne 3 : vendeur ou @ */}
        <div style={{ fontSize:12, color:GRAY_LIGHT }}>
          {client.internet ? '@' : `par ${client.vendeur}`}
        </div>
      </div>
    </div>
  )
}

// Filtres — 4 pills comme dans le screenshot
const FILTERS = ['TOUS', 'VENTE', 'SAV', 'OPTO']

// Menu hamburger — drawer depuis la gauche
function MenuDrawer({ onClose }) {
  const items = [
    { icon:'📊', label:'Statistiques du jour' },
    { icon:'📅', label:'Planning opticiens' },
    { icon:'⚙️', label:'Paramètres' },
    { icon:'👤', label:'Mon profil' },
    { icon:'🚪', label:'Déconnexion' },
  ]
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:200 }} />
      <div style={{
        position:'fixed', top:0, left:0, bottom:0, width:'75%', maxWidth:300,
        background:'#fff', zIndex:201, display:'flex', flexDirection:'column',
        boxShadow:'4px 0 20px rgba(0,0,0,0.2)',
      }}>
        {/* En-tête drawer */}
        <div style={{ background:BLUE, padding:'52px 20px 20px', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:52, height:52, borderRadius:'50%', background:'rgba(255,255,255,0.25)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, fontWeight:700, color:'#fff',
          }}>TF</div>
          <div>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Vendeur Formation</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', marginTop:2 }}>Simulation LPTSale</div>
          </div>
        </div>
        {/* Items */}
        <div style={{ flex:1 }}>
          {items.map((item, i) => (
            <div
              key={i}
              onClick={onClose}
              style={{
                display:'flex', alignItems:'center', gap:16,
                padding:'15px 20px', borderBottom:`1px solid ${BORDER_COLOR}`,
                cursor:'pointer', fontSize:14, color:TEXT,
              }}
            >
              <span style={{ fontSize:18, width:26, textAlign:'center' }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// FAB actions (inscription rapide)
function FabActions({ onClose }) {
  const actions = [
    { label:'Inscrire en vente',   color:BLUE,   icon:'👓' },
    { label:'Inscrire en examen',  color:ORANGE, icon:'👁️' },
    { label:'Inscrire en SAV',     color:RED,    icon:'🔧' },
  ]
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, zIndex:99 }} />
      <div style={{ position:'fixed', bottom:88, right:16, zIndex:100, display:'flex', flexDirection:'column', gap:10, alignItems:'flex-end' }}>
        {actions.map((a,i) => (
          <div key={i} onClick={onClose} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <div style={{
              background:'#fff', borderRadius:6, padding:'7px 12px',
              fontSize:13, fontWeight:600, color:TEXT,
              boxShadow:'0 2px 10px rgba(0,0,0,0.15)',
            }}>{a.label}</div>
            <div style={{
              width:38, height:38, borderRadius:'50%', background:a.color,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:16,
              boxShadow:'0 2px 8px rgba(0,0,0,0.2)', flexShrink:0,
            }}>{a.icon}</div>
          </div>
        ))}
      </div>
    </>
  )
}

// Écran fiche client (placeholder)
function ClientDetailScreen({ client, onBack }) {
  const color = typeColor(client.type)
  return (
    <div style={{ minHeight:'100dvh', background:'#fff', fontFamily:'system-ui,sans-serif' }}>
      <div style={{
        background:'#fff', padding:'14px 16px', position:'sticky', top:0, zIndex:10,
        borderBottom:`1px solid ${BORDER_COLOR}`,
        display:'flex', alignItems:'center', gap:12,
      }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:BLUE, fontSize:26, lineHeight:1, padding:'0 4px', fontWeight:300 }}>
          ‹
        </button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:700, color:TEXT }}>{client.nom}</div>
          <div style={{ fontSize:12, color:GRAY }}>{statusLabel(client)}</div>
        </div>
        <div style={{ width:12, height:12, borderRadius:'50%', background:color }}/>
      </div>
      <div style={{ padding:'24px 16px', textAlign:'center', color:GRAY }}>
        <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
        <div style={{ fontSize:15, fontWeight:600, color:TEXT, marginBottom:8 }}>Fiche client</div>
        <div style={{ fontSize:13, lineHeight:1.6 }}>
          Partage le prochain écran de l&#39;app<br/>pour que je puisse le reproduire.
        </div>
      </div>
    </div>
  )
}

// ── Écran principal Dispatch — réplique exacte du screenshot ──────
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
    <div style={{ minHeight:'100dvh', background:'#fff', fontFamily:'system-ui,-apple-system,sans-serif' }}>

      {showFab && <FabActions onClose={() => setShowFab(false)} />}

      {/* ── Barre de navigation ── */}
      <div style={{
        position:'sticky', top:0, zIndex:10,
        background:'#fff', borderBottom:`1px solid ${BORDER_COLOR}`,
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'13px 16px',
      }}>
        <Hamburger onClick={onOpenMenu} />
        <LPTLogoSale size={46} />
        <Avatar initials={initials} />
      </div>

      {/* ── Titre + sous-titre ── */}
      <div style={{ textAlign:'center', padding:'22px 16px 0' }}>
        <h1 style={{ fontSize:30, fontWeight:900, color:TEXT, margin:0, letterSpacing:-0.5 }}>
          Dispatch
        </h1>
        <p style={{ fontSize:14, color:'#aaaaaa', margin:'6px 0 0' }}>
          {ALL_CLIENTS.length} personne(s) dans le dispatch
        </p>
      </div>

      {/* ── Filtres ── */}
      <div style={{ display:'flex', gap:8, padding:'16px 16px 0' }}>
        {FILTERS.map(f => {
          const active = filter === f
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                flex:1, height:40, borderRadius:24,
                border: active ? 'none' : `1.5px solid #d0d0d0`,
                background: active ? BLUE : '#fff',
                color: active ? '#fff' : TEXT,
                fontSize:13, fontWeight:700,
                cursor:'pointer', fontFamily:'inherit',
                letterSpacing:0.3,
              }}
            >
              {f}
            </button>
          )
        })}
      </div>

      {/* ── Liste clients ── */}
      <div style={{ marginTop:16, borderTop:`1px solid ${BORDER_COLOR}` }}>
        {filtered.map(client => (
          <ClientCard key={client.id} client={client} onPress={onSelectClient} />
        ))}
      </div>

      {/* ── FAB bleu (bouton grille) ── */}
      <button
        onClick={() => setShowFab(v => !v)}
        style={{
          position:'fixed', bottom:28, right:20,
          width:58, height:58, borderRadius:'50%',
          background:BLUE, border:'none', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 4px 18px rgba(26,163,204,0.5)',
          zIndex:80,
        }}
      >
        {/* Icône ::: grille 3x3 */}
        <svg width="24" height="24" viewBox="0 0 24 24">
          {[4,12,20].flatMap(y => [4,12,20].map(x => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="2.2" fill="#fff"/>
          )))}
        </svg>
      </button>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function LPTSaleApp({ pName }) {
  const [screen, setScreen]     = useState('dispatch')
  const [selected, setSelected] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleSelectClient = (client) => {
    setSelected(client)
    setScreen('client')
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
    <>
      <DispatchScreen
        pName={pName}
        onOpenMenu={() => setMenuOpen(true)}
        onSelectClient={handleSelectClient}
      />
      {menuOpen && <MenuDrawer onClose={() => setMenuOpen(false)} />}
    </>
  )
}
