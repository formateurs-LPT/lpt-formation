'use client'
import { useState, useEffect } from 'react'

const BLUE      = '#0089ba'
const BLUE_L    = '#00abe9'
const GOLD      = '#c9a227'
const RED_BE    = '#e63946'
const GREEN     = '#22c55e'
const PURPLE    = '#7c3aed'
const BG        = '#03112a'
const BG2       = '#0d1f3c'
const CARD      = 'rgba(255,255,255,0.04)'
const BORDER    = 'rgba(255,255,255,0.1)'
const TEXT      = '#ffffff'
const TEXT_SUB  = 'rgba(255,255,255,0.55)'

/* ── Atoms ──────────────────────────────────────────────── */
function Label({ children, color = BLUE }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color, marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Card({ children, accent = BLUE, style = {} }) {
  return (
    <div style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '18px 22px', ...style,
    }}>{children}</div>
  )
}

function SectionTitle({ children, accent = BLUE, tag }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{ width: 3, height: 28, background: accent, borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT, letterSpacing: 0.3, flex: 1 }}>{children}</h2>
      {tag && (
        <span style={{
          fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5,
          color: accent, background: `${accent}18`, border: `1px solid ${accent}50`,
          borderRadius: 20, padding: '3px 10px', flexShrink: 0,
        }}>{tag}</span>
      )}
    </div>
  )
}

function Tag({ children, color = BLUE }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
      color, background: `${color}18`, border: `1px solid ${color}50`, borderRadius: 20, padding: '3px 10px',
    }}>{children}</span>
  )
}

function Row({ label, value, accent = BLUE, last = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: last ? 'none' : `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 12, color: TEXT_SUB }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: accent }}>{value}</span>
    </div>
  )
}

function Bullet({ items, color = BLUE }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />
          <span style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.55 }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

function QrModal({ url, onClose }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=ffffff&bgcolor=03112a&data=${encodeURIComponent(url)}`
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: 2 }}>Fiche Belgique</div>
        <div style={{ background: '#03112a', borderRadius: 16, padding: 14, border: `2px solid ${GOLD}`, boxShadow: `0 0 40px ${GOLD}30` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR Code Fiche Belgique" width={260} height={260} style={{ display: 'block', borderRadius: 8 }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Fiche récap Belgique</div>
          <div style={{ fontSize: 12, color: TEXT_SUB }}>{url}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`, color: TEXT_SUB, fontSize: 13, fontWeight: 600, padding: '10px 28px', borderRadius: 12, cursor: 'pointer' }}>Fermer</button>
      </div>
    </div>
  )
}

/* ── Page principale ────────────────────────────────────────── */
export default function FicheBelgique() {
  const [showQr, setShowQr] = useState(false)
  const [ficheUrl, setFicheUrl] = useState('')

  useEffect(() => { setFicheUrl(window.location.origin + '/fiche-belgique') }, [])

  return (
    <>
      {showQr && ficheUrl && <QrModal url={ficheUrl} onClose={() => setShowQr(false)} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: ${BG}; color: ${TEXT}; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          body { background: ${BG} !important; color: ${TEXT} !important; margin: 0; }
          .print-page { background: ${BG} !important; padding: 16px !important; }
          .print-section { break-inside: avoid; page-break-inside: avoid; }
          @page { margin: 8mm; background: ${BG}; }
        }
      `}</style>

      <div className="print-page" style={{ minHeight: '100vh', background: BG, padding: '32px 24px 80px' }}>

        {/* ── HEADER ── */}
        <div style={{ maxWidth: 960, margin: '0 auto 36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
              {/* Drapeau belge */}
              <div style={{ display: 'flex', height: 40, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.4)', flexShrink: 0 }}>
                {['#000000', '#FFD700', '#EF0000'].map((c, i) => (
                  <div key={i} style={{ width: 14, background: c }} />
                ))}
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>
                  Lunettes Pour Tous · Belgique
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: -0.5, lineHeight: 1 }}>
                  Formation Onboarding Belgique
                </h1>
              </div>
            </div>
            <p style={{ fontSize: 13, color: TEXT_SUB, maxWidth: 480, lineHeight: 1.6 }}>
              Fiche récapitulative de la formation · 3 journées · 8 modules
            </p>
            {/* Badges journées */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'J1 · Les fondamentaux', color: BLUE_L },
                { label: 'J2 · Offres & Vente', color: GOLD },
                { label: 'J3 · Mesures & Remboursements', color: RED_BE },
              ].map(({ label, color }) => (
                <span key={label} style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}50`, borderRadius: 20, padding: '4px 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button onClick={() => setShowQr(true)} style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}35` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}18` }}>
              ⬜ QR Code
            </button>
            <button onClick={() => window.print()} style={{ background: `${BLUE}18`, border: `1px solid ${BLUE}60`, color: BLUE_L, fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}35` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}18` }}>
              ⬇ Exporter en PDF
            </button>
          </div>
        </div>

        {/* ─── Bande J1 ─────────────────────────────────────────── */}
        <div style={{ maxWidth: 960, margin: '0 auto 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,171,233,0.25)' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: BLUE_L, textTransform: 'uppercase', letterSpacing: 3 }}>Journée 1 · Les Fondamentaux</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,171,233,0.25)' }} />
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── 1. ENTREPRISE ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>1 · L'entreprise</SectionTitle>

            {/* Fondateurs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: '14px 18px', background: `${BLUE}08`, border: `1px solid ${BLUE}25`, borderRadius: 12 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🤝</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 3 }}>Fondée en 2014 par Paul Morlet & Xavier Niel</div>
                <div style={{ fontSize: 12, color: TEXT_SUB }}>Mission : rendre la vue accessible à tous, à prix juste.</div>
              </div>
            </div>

            {/* Chiffres clés */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 22 }}>
              {[
                { label: 'Magasins', value: '33', sub: 'France & Belgique', color: BLUE_L },
                { label: 'Collaborateurs', value: '+1 000', sub: 'au total', color: GOLD },
                { label: 'Paires / jour', value: '5 000', sub: 'sur tout le réseau', color: PURPLE },
                { label: 'Objectif 2025', value: '1 M', sub: 'paires vendues', color: GREEN },
              ].map(({ label, value, sub, color }) => (
                <div key={label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 10, color: TEXT_SUB }}>{sub}</div>
                </div>
              ))}
            </div>

            {/* ⭐ LA PROMESSE — élément central */}
            <div style={{ background: `linear-gradient(135deg, ${BLUE}30 0%, ${BLUE}10 100%)`, border: `2px solid ${BLUE}`, borderRadius: 20, padding: '28px 28px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
              {/* Glow déco */}
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: `${BLUE}15`, pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                {/* Badge 10 min */}
                <div style={{ flexShrink: 0, width: 100, height: 100, borderRadius: 24, background: `linear-gradient(135deg, ${BLUE}, ${BLUE_L})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px ${BLUE}60` }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1 }}>10</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)', letterSpacing: 1.5, textTransform: 'uppercase' }}>min</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: BLUE_L, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 8 }}>Notre promesse — ce qui nous rend uniques</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: TEXT, lineHeight: 1.15, marginBottom: 8 }}>Vos lunettes fabriquées<br />en 10 minutes chrono</div>
                  <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.6 }}>
                    Avec ou sans ordonnance — en magasin, devant vous.<br />
                    <strong style={{ color: BLUE_L }}>Nous sommes les seuls opticiens au monde à proposer ça.</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 4 piliers */}
            <Label color={BLUE}>Comment c'est possible ?</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 22 }}>
              {[
                { icon: '📦', titre: 'Stocks en magasin', desc: 'Verres et montures disponibles immédiatement, aucune commande à attendre.' },
                { icon: '⚙️', titre: 'Investissement continu', desc: 'Nouvelles technologies et machines de pointe intégrées en permanence.' },
                { icon: '🚚', titre: 'Logistique nationale', desc: 'Approvisionnement quotidien depuis notre centre logistique.' },
                { icon: '0️⃣', titre: 'Zéro intermédiaire', desc: 'Notre propre marque, notre propre chaîne de production.' },
              ].map(({ icon, titre, desc }) => (
                <div key={titre} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${BLUE_L}`, borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{titre}</div>
                    <div style={{ fontSize: 11, color: TEXT_SUB, lineHeight: 1.45 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Laboratoire progressif Châtelet */}
            <div style={{ background: `linear-gradient(135deg, ${PURPLE}18 0%, ${PURPLE}08 100%)`, border: `2px solid ${PURPLE}`, borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Photo */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/assets/labo-progressif-chatelet.jpg"
                  alt="Laboratoire progressif Paris Châtelet"
                  style={{ width: '100%', height: 220, objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
                />
                {/* Contenu */}
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
                    <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: 16, background: `${PURPLE}30`, border: `2px solid ${PURPLE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                      🔬
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 9, fontWeight: 800, color: PURPLE, textTransform: 'uppercase', letterSpacing: 2.5, marginBottom: 6 }}>Exclusivité mondiale · Paris Châtelet</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: TEXT, marginBottom: 8 }}>Notre laboratoire progressif unique au monde</div>
                      <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.65, marginBottom: 12 }}>
                        Un laboratoire accessible à la vue des clients, équipé de <strong style={{ color: TEXT }}>machines CoreTBA (MEI)</strong> introuvables dans n'importe quel magasin d'optique au monde.
                        Ces équipements permettent de fabriquer <strong style={{ color: PURPLE }}>480 paires de verres complexes progressifs par jour</strong> — une capacité industrielle, au cœur d'un magasin.
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Tag color={PURPLE}>480 paires progressif / jour</Tag>
                        <Tag color={BLUE_L}>Unique au monde</Tag>
                        <Tag color={GOLD}>Paris Châtelet</Tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. OPTIQUE ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>2 · Les bases de l'optique</SectionTitle>

            {/* 4 troubles */}
            <Label color={BLUE}>Les 4 troubles visuels</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 20 }}>
              {[
                { nom: 'Myopie',         num: '01', symptome: 'Flou de loin',                     correction: 'Sphère (−)',          color: '#e05555' },
                { nom: 'Hypermétropie',  num: '02', symptome: 'Flou partout, effort permanent',   correction: 'Sphère (+)',          color: BLUE_L },
                { nom: 'Astigmatisme',   num: '03', symptome: 'Vision déformée à toutes distances', correction: 'Cylindre + Axe (°)', color: GOLD },
                { nom: 'Presbytie',      num: '04', symptome: 'Flou de près dès 40–45 ans',       correction: 'Addition (Add)',      color: GREEN },
              ].map(({ nom, num, symptome, correction, color }) => (
                <Card key={nom} accent={color} style={{ padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color, opacity: 0.6 }}>{num}</span>
                    <span style={{ fontSize: 14, fontWeight: 800, color }}>{nom}</span>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_SUB, marginBottom: 8, lineHeight: 1.4 }}>{symptome}</div>
                  <Tag color={color}>{correction}</Tag>
                </Card>
              ))}
            </div>

            {/* Ordonnance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card accent={BLUE}>
                <Label color={BLUE}>Lire une ordonnance</Label>
                {[
                  { champ: 'Sphère',   desc: 'Correction principale — (−) myopie · (+) hypermétropie' },
                  { champ: 'Cylindre', desc: 'Correction de l\'astigmatisme' },
                  { champ: 'Axe',      desc: 'Toujours présent avec le cylindre — en degrés (°)' },
                  { champ: 'Add',      desc: 'Addition presbytie — valeur ajoutée à la sphère pour lire' },
                ].map((r, i, arr) => <Row key={i} label={r.desc} value={r.champ} accent={BLUE_L} last={i === arr.length - 1} />)}
              </Card>
              <Card accent={BLUE}>
                <Label color={BLUE}>Repères clés</Label>
                <Row label="Paliers de correction" value="0,25 dioptrie" accent={BLUE_L} />
                <Row label="Sphère en stock magasin" value="−8 à +7,25" accent={BLUE_L} />
                <Row label="Fabrication unifocal" value="⚡ 10 min" accent={GREEN} />
                <Row label="Fabrication progressif" value="9 jours" accent={GOLD} last />
              </Card>
            </div>
          </div>

          {/* ── 3. TYPES DE VERRES ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>3 · Les types de verres</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {/* Unifocal */}
              <Card accent={BLUE_L}>
                <Label color={BLUE_L}>Verre Unifocal</Label>
                <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.65, marginBottom: 12 }}>
                  Une seule correction sur toute la surface. Pas de zone de flou.
                  Idéal pour les clients avec un seul problème à corriger, ou les presbytes qui veulent une paire dédiée.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag color={GREEN}>Fabrication 10 min</Tag>
                  <Tag color={BLUE_L}>Stock en magasin</Tag>
                </div>
              </Card>

              {/* Progressif */}
              <Card accent={PURPLE}>
                <Label color={PURPLE}>Verre Progressif — Pulsar Next (Rodenstock)</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {[
                    { zone: '↑ Haut', usage: 'Vision de loin (> 3 m) — conduite, TV' },
                    { zone: '↔ Centre', usage: 'Vision intermédiaire — écran, comptoir' },
                    { zone: '↓ Bas', usage: 'Vision de près (< 40 cm) — lecture' },
                  ].map(({ zone, usage }, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: PURPLE, minWidth: 60 }}>{zone}</span>
                      <span style={{ fontSize: 11, color: TEXT_SUB }}>{usage}</span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: RED_BE, fontStyle: 'italic', marginBottom: 10 }}>
                  ⚠ Flou latéral inévitable — apprendre à tourner la tête, pas les yeux.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Tag color={GOLD}>Fabrication 9 jours</Tag>
                  <Tag color={GREEN}>Garantie 100 jours</Tag>
                  <Tag color={PURPLE}>Zones extra-larges 180°</Tag>
                </div>
              </Card>
            </div>
          </div>

          {/* ── 4. MONTURES ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>4 · Connaissances Montures</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                {
                  matière: 'Acétate', icon: '🎨', color: '#f472b6',
                  args: ['Grande variété de couleurs et motifs'],
                },
                {
                  matière: 'Métal', icon: '✨', color: BLUE_L,
                  args: ['Monture fine et discrète'],
                },
                {
                  matière: 'Injecté', icon: '⚡', color: GREEN,
                  args: ['Plastique moulé par injection', 'Légères et résistantes', 'Prix d\'entrée de gamme (5/15 €)'],
                },
              ].map(({ matière, icon, color, args }) => (
                <Card key={matière} accent={color} style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color }}>{matière}</span>
                  </div>
                  <Bullet items={args} color={color} />
                </Card>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '12px 16px', background: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: 10, fontSize: 12, color: TEXT_SUB, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🔍</span>
              <span>La journée 1 se termine par une <strong style={{ color: GOLD }}>activité terrain</strong> — découverte des montures avec le formateur (~17h00).</span>
            </div>
          </div>

          {/* ─── Bande J2 ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 1, background: `${GOLD}40` }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: 3 }}>Journée 2 · Offres & Vente</span>
            <div style={{ flex: 1, height: 1, background: `${GOLD}40` }} />
          </div>

          {/* ── 5. TRAME D'ACCUEIL ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={GOLD}>5 · Trame d'accueil</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { num: 1, text: 'Bonjour et bienvenue chez Lunettes Pour Tous', color: BLUE_L, emoji: '👋' },
                { num: 2, text: 'Connaissez-vous le concept ?', color: PURPLE, emoji: '💡' },
                { num: 3, text: "Ici c'est simple, c'est la possibilité d'avoir ses lunettes de vue en seulement 10 minutes avec ou sans ordonnance.", color: GOLD, emoji: '⏱️' },
                { num: 4, text: "Je vous inscris en examen de vue ? C'est gratuit et sans rendez-vous.", color: GREEN, emoji: '✅' },
              ].map(step => (
                <Card key={step.num} accent={step.color} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: `${step.color}20`, border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: step.color }}>{step.num}</div>
                  <div style={{ paddingTop: 4, fontSize: 13, fontWeight: 600, color: TEXT, lineHeight: 1.6 }}>
                    {step.emoji} {step.text}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── 6. LES OFFRES ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={GOLD}>6 · Les offres LPT</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>

              <Card accent={BLUE_L}>
                <Label color={BLUE_L}>Parcours Classique</Label>
                <Row label="Entrée de gamme" value="dès 10 €" accent={BLUE_L} />
                <Row label="2ème paire" value="−20 %" accent={BLUE_L} />
                <Row label="Fabrication" value="⚡ 10 min" accent={GREEN} last />
              </Card>

              <Card accent={GOLD}>
                <Label color={GOLD}>Parcours 1=1</Label>
                <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6, marginBottom: 12 }}>
                  1 paire achetée = <strong style={{ color: GOLD }}>1 paire offerte</strong><br />
                  Éligible tout le magasin · Solaires inclus
                </div>
                <Row label="Unifocal (2 paires)" value="~157 €" accent={GOLD} />
                <Row label="Progressif (2 paires)" value="~260 €" accent={GOLD} last />
              </Card>

              <Card accent={BLUE}>
                <Label color={BLUE}>Pack Plan — 95 €</Label>
                <div style={{ fontSize: 28, fontWeight: 900, color: BLUE_L, marginBottom: 10 }}>95 €</div>
                <Row label="Paires" value="2 paires" accent={BLUE_L} />
                <Row label="Correction" value="Sans correction" accent={BLUE_L} />
                <Row label="Traitements" value="Au choix" accent={BLUE_L} />
                <Row label="Montures" value="Au choix" accent={BLUE_L} last />
              </Card>
            </div>
          </div>

          {/* ─── Bande J3 ─────────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 1, background: `${RED_BE}40` }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: RED_BE, textTransform: 'uppercase', letterSpacing: 3 }}>Journée 3 · Mesures & Remboursements</span>
            <div style={{ flex: 1, height: 1, background: `${RED_BE}40` }} />
          </div>

          {/* ── 7. PDM ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>7 · Prise de mesures</SectionTitle>
            <Card accent={GOLD} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 4 }}>Règle absolue</div>
              <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6 }}>
                <strong style={{ color: TEXT }}>LPTVISION est obligatoire.</strong><br />
                Objectif : aligner le centre optique du verre exactement devant la pupille du client.
              </div>
            </Card>

            <Label color={BLUE}>Les 3 conditions pour une mesure fiable</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { num: '1', label: 'Le client — debout, bien droit', desc: 'Posture naturelle, regard fixé sur l\'objectif de l\'app. Tête non inclinée.' },
                { num: '2', label: 'La monture — bien droite', desc: 'Branches parallèles au sol, aucune torsion. Ajustez avant de lancer l\'app.' },
                { num: '3', label: 'Votre position — à 1 mètre face aux yeux', desc: 'L\'objectif à hauteur des yeux du client. Stable, sans angle.' },
              ].map(step => (
                <Card key={step.num} accent={BLUE} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${BLUE}20`, border: `2px solid ${BLUE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: BLUE_L, flexShrink: 0 }}>{step.num}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{step.label}</div>
                    <div style={{ fontSize: 11, color: TEXT_SUB, marginTop: 2 }}>{step.desc}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── 8. MUTUELLES & INAMI ── Belgian-specific! ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${GOLD}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={GOLD} tag="🇧🇪 Spécifique Belgique">8 · Mutuelles et INAMI</SectionTitle>

            {/* INAMI */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 3, height: 22, background: GOLD, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>INAMI — Institut National d'Assurance Maladie-Invalidité</div>
              </div>
              <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6, marginBottom: 14, padding: '10px 14px', background: `${GOLD}08`, border: `1px solid ${GOLD}25`, borderRadius: 8, fontStyle: 'italic' }}>
                🏛️ Organisme public qui fixe les règles de remboursement optique en Belgique (équivalent de la Sécurité Sociale en France).
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                <Card accent={GOLD} style={{ padding: '14px 18px' }}>
                  <Label color={GOLD}>Seuils de correction</Label>
                  <Bullet items={[
                    '< 18 ans : dès 0,25 dioptrie',
                    '18–64 ans : à partir de ± 6,00 dioptries',
                    '≥ 65 ans : à partir de ± 4,25 dioptries (bifocaux/progressifs)',
                  ]} color={GOLD} />
                </Card>
                <Card accent={GOLD} style={{ padding: '14px 18px' }}>
                  <Label color={GOLD}>Fréquence de remboursement</Label>
                  <Bullet items={[
                    '< 18 ans : tous les 2 ans',
                    '≥ 18 ans : tous les 5 ans',
                    'Exception : changement de dioptrie ≥ 0,5 → droit immédiat',
                  ]} color={GOLD} />
                </Card>
                <Card accent={GOLD} style={{ padding: '14px 18px' }}>
                  <Label color={GOLD}>Documents requis</Label>
                  <Bullet items={[
                    'Annexe 15 — attestation de délivrance signée par l\'opticien',
                    'Prescription ophtalmologue valable (< 6 mois)',
                  ]} color={GOLD} />
                </Card>
              </div>
            </div>

            {/* Mutuelles */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 3, height: 22, background: GOLD, borderRadius: 2, flexShrink: 0 }} />
                <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>Les mutuelles belges</div>
              </div>

              {/* Tableau mutuelles */}
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 12 }}>
                {/* Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', background: `${GOLD}15`, borderBottom: `1px solid ${GOLD}30`, padding: '10px 16px', gap: 8 }}>
                  {['Mutuelle', 'Montant optique', 'Fréquence', 'Particularités'].map((h, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: 1 }}>{h}</div>
                  ))}
                </div>
                {/* Lignes */}
                {[
                  { nom: 'Mutualité Chrétienne (MC)', montant: "Jusqu'à 120 €", freq: "3 ans *", note: "Sans prescription, tout âge, toute dioptrie. Facture suffit." },
                  { nom: 'Partena', montant: "Jusqu'à 75 €", freq: "2 ans", note: "Partenaire LPT ✓ — pas de prescription si dioptrie sur facture.", highlight: true },
                  { nom: 'Mutualité Neutre', montant: "24 à 120 € selon âge", freq: "3 ans", note: "Sous prescription ophtalmo obligatoire." },
                  { nom: 'Solidaris', montant: "0 €", freq: "—", note: "Uniquement dans les magasins partenaires." },
                  { nom: 'Mutualité Libérale', montant: "—", freq: "—", note: "Pas de remboursement optique standard." },
                  { nom: 'CAAMI', montant: "Aucun", freq: "—", note: "Organisme public, pas de couverture optique complémentaire." },
                ].map(({ nom, montant, freq, note, highlight }, i, arr) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr', padding: '10px 16px', gap: 8, background: highlight ? `${GOLD}08` : i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: highlight ? GOLD : TEXT }}>{nom}{highlight && <span style={{ fontSize: 9, marginLeft: 6, color: GREEN, fontWeight: 800, background: `${GREEN}15`, padding: '1px 6px', borderRadius: 10 }}>Partenaire</span>}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: montant === '0 €' || montant === 'Aucun' || montant === '—' ? TEXT_SUB : GREEN }}>{montant}</div>
                    <div style={{ fontSize: 12, color: TEXT_SUB }}>{freq}</div>
                    <div style={{ fontSize: 11, color: TEXT_SUB, lineHeight: 1.4 }}>{note}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                * MC : ou 1 fois/an si variation de dioptrie ≥ 0,5
              </div>
            </div>
          </div>

          {/* ── BONUS : Quiz & Réveil des acquis ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={PURPLE}>En complément — Consolidation des acquis</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { icon: '⚡', titre: 'Réveil des acquis', desc: 'FAQ et quiz de consolidation sur les 3 journées. Disponible à tout moment de la formation.', color: GOLD },
                { icon: '🎮', titre: 'Mini Jeux', desc: '« Accueil-moi si tu peux » — jeu de rôle interactif sur la trame d\'accueil.', color: PURPLE },
                { icon: '🏆', titre: 'Quiz Final', desc: '26 questions couvrant toute la formation — valide les acquis de l\'onboarding.', color: '#c9a227' },
              ].map(({ icon, titre, desc, color }) => (
                <div key={titre} style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 22 }}>{icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color }}>{titre}</span>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_SUB, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: 1 }}>
              LPT FORMATION · BELGIQUE — Document interne — lpt-formation.vercel.app/fiche-belgique
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
