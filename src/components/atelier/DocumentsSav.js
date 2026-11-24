// Documents SAV de l'Atelier Lipto (23/11, demande de Thomas) : le relevé du
// back-end (photo de la monture, vue « correction » ou « mesures ») et l'écran
// du frontofocomètre (paire du client). Dessinés en SVG : tout grandit avec le
// diffuseur. Les valeurs sont celles saisies dans l'atelier, « — » si vide.
import { nombreFr } from '@/lib/atelierSimulation'

const TEAL = '#1789a3', ENCRE = '#0f172a', GRIS = '#64748b'
const MONTURE = '/assets/sav/monture-face.webp' // 945 × 340
// Repères dans la photo : centre des verres, pont, bas des verres
const OD_X = 243, OG_X = 700, PONT_X = 472, CENTRE_Y = 170, BAS_Y = 323

const val = v => (String(v ?? '').trim() || '—')
const axe = v => { const t = String(v ?? '').trim(); return !t ? '—' : /°$/.test(t) ? t : t + '°' }
const mm = v => { const t = String(v ?? '').trim(); return !t ? '—' : /^[\d.,\s]+$/.test(t) ? `${t.replace('.', ',')} mm` : t }

export function BackendMini({ d }) {
  return d.vue === 'mesures' ? <BackendMesures d={d} /> : <BackendCorrection d={d} />
}

function Entete({ y }) {
  return (
    <g fontSize="24" fontWeight="800" fill={ENCRE} textAnchor="middle" letterSpacing="1">
      <text x={OD_X} y={y}>OD · ŒIL DROIT</text>
      <text x={PONT_X} y={y} fontSize="17" fontWeight="500" fill={GRIS}>VUE DE FACE</text>
      <text x={OG_X} y={y}>OG · ŒIL GAUCHE</text>
    </g>
  )
}

function Carte({ viewBox, children }) {
  return (
    <svg viewBox={viewBox} style={{ width: '100%', display: 'block', background: '#fff', borderRadius: '0.8cqw', boxShadow: '0 20px 50px rgba(0,0,0,0.35)', fontFamily: 'inherit' }}>
      {children}
    </svg>
  )
}

function BackendCorrection({ d }) {
  const oeil = (x, o) => (
    <g key={x} textAnchor="middle">
      <rect x={x - 165} y={CENTRE_Y + 8} width="330" height="92" rx="12" fill="rgba(255,255,255,0.88)" />
      {[['SPHÈRE', val(o.sph)], ['CYLINDRE', val(o.cyl)], ['AXE', axe(o.axe)]].map(([l, v], i) => (
        <g key={l}>
          <text x={x + (i - 1) * 110} y={CENTRE_Y + 38} fontSize="17" fill={GRIS}>{l}</text>
          <text x={x + (i - 1) * 110} y={CENTRE_Y + 80} fontSize="31" fontWeight="800" fill={ENCRE}>{v}</text>
        </g>
      ))}
    </g>
  )
  return (
    <Carte viewBox="-20 -70 985 425">
      <Entete y={-28} />
      <image href={MONTURE} x="0" y="0" width="945" height="340" />
      {oeil(OD_X, d.od)}{oeil(OG_X, d.og)}
    </Carte>
  )
}

function BackendMesures({ d }) {
  const eOD = nombreFr(d.od.ecart), eOG = nombreFr(d.og.ecart)
  const bino = Number.isNaN(eOD) || Number.isNaN(eOG) ? '—' : `${String(Math.round((eOD + eOG) * 10) / 10).replace('.', ',')} mm`
  const fleche = (x1, y1, x2, y2) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={TEAL} strokeWidth="3" markerStart="url(#bk-pointe)" markerEnd="url(#bk-pointe)" />
  const pointille = (x1, y1, x2, y2) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={TEAL} strokeWidth="2" strokeDasharray="6 6" opacity="0.8" />
  const mire = x => (
    <g key={'m' + x} stroke={TEAL} strokeWidth="3" fill="none">
      <circle cx={x} cy={CENTRE_Y} r="11" /><line x1={x - 18} y1={CENTRE_Y} x2={x + 18} y2={CENTRE_Y} /><line x1={x} y1={CENTRE_Y - 18} x2={x} y2={CENTRE_Y + 18} />
    </g>
  )
  const etiquette = (x, y, titre, valeur) => (
    <g textAnchor="middle">
      <text x={x} y={y} fontSize={titre.length > 10 ? 17 : 22} fill={GRIS}>{titre}</text>
      <text x={x} y={y + 44} fontSize="42" fontWeight="800" fill={TEAL}>{valeur}</text>
    </g>
  )
  return (
    <Carte viewBox="-225 -190 1395 600">
      <defs>
        <marker id="bk-pointe" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill={TEAL} />
        </marker>
      </defs>
      <Entete y={-150} />
      {etiquette(OD_X + (PONT_X - OD_X) / 2, -100, 'ÉCART MONOCULAIRE', mm(d.od.ecart))}
      {etiquette(PONT_X + (OG_X - PONT_X) / 2, -100, 'ÉCART MONOCULAIRE', mm(d.og.ecart))}
      <image href={MONTURE} x="0" y="0" width="945" height="340" />
      {fleche(OD_X, -40, PONT_X, -40)}{fleche(PONT_X, -40, OG_X, -40)}
      {pointille(PONT_X, -40, PONT_X, 380)}
      {pointille(OD_X, -40, OD_X, 10)}{pointille(OG_X, -40, OG_X, 10)}
      {/* Hauteurs : du centre du verre au bas du verre */}
      {pointille(-70, CENTRE_Y, OD_X, CENTRE_Y)}{pointille(-70, BAS_Y, OD_X, BAS_Y)}
      {pointille(OG_X, CENTRE_Y, 1015, CENTRE_Y)}{pointille(OG_X, BAS_Y, 1015, BAS_Y)}
      {fleche(-70, CENTRE_Y, -70, BAS_Y)}{fleche(1015, CENTRE_Y, 1015, BAS_Y)}
      {etiquette(-145, 225, 'HAUTEUR', mm(d.od.hauteur))}
      {etiquette(1090, 225, 'HAUTEUR', mm(d.og.hauteur))}
      {mire(OD_X)}{mire(OG_X)}
      <text x={PONT_X} y="390" textAnchor="middle" fontSize="26" fill={GRIS}>Écart binoculaire : <tspan fontWeight="800" fill={ENCRE}>{bino}</tspan></text>
    </Carte>
  )
}

// Écran du fronto : l'œil mesuré (D ou G) en grand, les deux yeux en bas
export function FrontoMini({ d }) {
  const mesure = d.oeil === 'og' ? d.og : d.od
  const CX = 282, CY = 400, R = 212
  const graduations = Array.from({ length: 36 }, (_, i) => {
    const a = (i * 10) * Math.PI / 180, long = i % 3 === 0
    const r1 = long ? R - 34 : R - 18
    return <line key={i} x1={CX + Math.cos(a) * r1} y1={CY - Math.sin(a) * r1} x2={CX + Math.cos(a) * R} y2={CY - Math.sin(a) * R} stroke="#1f2937" strokeWidth={long ? 4 : 3} />
  })
  const reperes = [0, 30, 60, 90, 120, 150, 180].map(deg => {
    const a = deg * Math.PI / 180
    return <text key={deg} x={CX + Math.cos(a) * 140} y={CY - Math.sin(a) * 140 + 8} fontSize="22" fill="#334155" textAnchor="middle">{deg}</text>
  })
  const bouton = (x, y, actif, lettre, couleur) => (
    <g>
      <rect x={x} y={y} width="95" height="95" rx="12" fill={actif ? '#3dbf45' : '#eef1f5'} />
      <text x={x + 47.5} y={y + 69} textAnchor="middle" fontSize="62" fontWeight="800" fill={actif ? '#0f3d12' : couleur}>{lettre}</text>
    </g>
  )
  const ligneBas = (y, libelle, g, dr, encadre) => (
    <g fontSize="34" fontWeight="800" fill="#1f2937" textAnchor="middle">
      {encadre && <rect x="316" y={y - 36} width="214" height="47" rx="6" fill="#f5f8fb" />}
      <text x="276" y={y}>{g}</text><text x="423" y={y}>{libelle}</text><text x="569" y={y}>{dr}</text>
    </g>
  )
  const grand = (lettre, valeur, y) => (
    <g>
      {lettre && <text x="608" y={y} fontSize="30" fill="#334155">{lettre}</text>}
      <text x="778" y={y} fontSize="46" fill="#0f172a" textAnchor="end">{valeur}</text>
    </g>
  )
  const v = x => (String(x ?? '').trim() || '—')
  return (
    <svg viewBox="0 -80 846 1190" style={{ width: '100%', display: 'block', fontFamily: 'Arial, Helvetica, sans-serif', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.35))' }}>
      <text x="0" y="-30" fontSize="34" fontWeight="800" letterSpacing="5" fill="#fff">ÉCRAN DU FRONTO · PAIRE DU CLIENT</text>
      <rect x="0" y="0" width="846" height="1105" rx="70" fill="#454a52" />
      <rect x="34" y="40" width="778" height="1020" rx="40" fill="#2e3136" />
      <rect x="56" y="62" width="734" height="976" rx="20" fill="#dbeaf5" />
      {/* Bandeau du haut */}
      <rect x="56" y="62" width="734" height="84" fill="#c6dcec" />
      <circle cx="118" cy="104" r="25" fill="none" stroke="#333" strokeWidth="4" />
      <rect x="175" y="62" width="146" height="84" fill="#a8d89c" />
      <text x="248" y="122" fontSize="50" fontWeight="800" textAnchor="middle" fill="#111">41</text>
      <text x="400" y="122" fontSize="46" textAnchor="middle" fill="#777">0.25</text>
      <text x="541" y="122" fontSize="44" fontWeight="800" textAnchor="middle" fill="#777">C-</text>
      <text x="688" y="122" fontSize="44" textAnchor="middle" fill="#b8a020">→ +</text>
      {/* Cadran */}
      {graduations}{reperes}
      <line x1="68" y1={CY} x2="497" y2={CY} stroke="#111" strokeWidth="3" />
      <line x1={CX} y1="176" x2={CX} y2="628" stroke="#111" strokeWidth="3" />
      <circle cx={CX} cy={CY} r="26" fill="none" stroke="#111" strokeWidth="6" />
      {/* Œil mesuré, en grand */}
      {grand('S', v(mesure.sph), 235)}{grand('C', v(mesure.cyl), 292)}{grand('A', v(mesure.axe), 342)}
      {grand('', '0.00', 398)}{grand('', '0.00', 450)}
      {/* Les deux yeux */}
      <rect x="175" y="638" width="496" height="382" rx="20" fill="#c8d3de" />
      {ligneBas(688, 'SPH', v(d.og.sph), v(d.od.sph))}
      {ligneBas(744, 'CYL', v(d.og.cyl), v(d.od.cyl))}
      {ligneBas(801, 'AXIS', v(d.og.axe), v(d.od.axe))}
      {ligneBas(856, 'PRISM1', '***', '***', true)}
      {ligneBas(913, 'PRISM2', '***', '***', true)}
      {bouton(68, 649, d.oeil === 'og', 'G', '#d9542b')}
      <rect x="68" y="762" width="95" height="95" rx="12" fill="#eef1f5" />
      <path d="M115.5 788 L146 834 L85 834 z" fill="#111" />
      {bouton(682, 649, d.oeil !== 'og', 'D', '#0f3d12')}
      <rect x="682" y="762" width="95" height="95" rx="12" fill="#d3d9e0" />
      <text x="729.5" y="800" fontSize="26" textAnchor="middle" fill="#64748b">Eye</text>
      <text x="729.5" y="833" fontSize="26" textAnchor="middle" fill="#64748b">Ca</text>
      <rect x="338" y="1055" width="170" height="38" rx="10" fill="#2d7fc1" />
    </svg>
  )
}
