'use client'
import { useState, useEffect } from 'react'

const BLUE = '#0089ba'
const BLUE_LIGHT = '#00abe9'
const GOLD = '#c9a227'
const BORDEAUX = '#9B3626'
const BG = '#03112a'
const BG2 = '#0d1f3c'
const CARD = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.1)'
const TEXT = '#ffffff'
const TEXT_SUB = 'rgba(255,255,255,0.55)'

function Label({ children, color = BLUE }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: 2, color, marginBottom: 10,
    }}>{children}</div>
  )
}

function Card({ children, accent = BLUE, style = {} }) {
  return (
    <div style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderLeft: `4px solid ${accent}`,
      borderRadius: 14,
      padding: '18px 22px',
      ...style,
    }}>{children}</div>
  )
}

function SectionTitle({ children, accent = BLUE }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ width: 3, height: 28, background: accent, borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT, letterSpacing: 0.3 }}>{children}</h2>
    </div>
  )
}

function Tag({ children, color = BLUE }) {
  return (
    <span style={{
      display: 'inline-block',
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
      color, background: `${color}18`, border: `1px solid ${color}50`,
      borderRadius: 20, padding: '3px 10px',
    }}>{children}</span>
  )
}

function TableRow({ label, value, accent = BLUE, last = false }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '11px 0',
      borderBottom: last ? 'none' : `1px solid ${BORDER}`,
    }}>
      <span style={{ fontSize: 13, color: TEXT_SUB }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color: accent }}>{value}</span>
    </div>
  )
}

function QrModal({ url, onClose }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=ffffff&bgcolor=03112a&data=${encodeURIComponent(url)}`
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: BG2, border: `1px solid ${BORDER}`,
          borderRadius: 24, padding: '40px 48px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ fontSize: 10, fontWeight: 700, color: BLUE_LIGHT, textTransform: 'uppercase', letterSpacing: 2 }}>
          Fiche pratique
        </div>
        <div style={{
          background: '#03112a', borderRadius: 16, padding: 14,
          border: `2px solid ${BLUE}`,
          boxShadow: `0 0 40px ${BLUE}30`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR Code Fiche Pratique" width={260} height={260} style={{ display: 'block', borderRadius: 8 }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 6 }}>
            Scannez pour accéder à la fiche
          </div>
          <div style={{ fontSize: 12, color: TEXT_SUB }}>{url}</div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`,
            color: TEXT_SUB, fontSize: 13, fontWeight: 600,
            padding: '10px 28px', borderRadius: 12, cursor: 'pointer',
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  )
}

export default function FichePratique() {
  const [showQr, setShowQr] = useState(false)
  const [ficheUrl, setFicheUrl] = useState('')

  useEffect(() => {
    setFicheUrl(window.location.origin + '/fiche-pratique')
  }, [])

  const handlePrint = () => window.print()

  return (
    <>
      {showQr && ficheUrl && <QrModal url={ficheUrl} onClose={() => setShowQr(false)} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: ${BG}; color: ${TEXT}; }
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; color: #111 !important; }
          .print-page { background: #fff !important; }
          .print-section { break-inside: avoid; }
        }
      `}</style>

      <div className="print-page" style={{ minHeight: '100vh', background: BG, padding: '32px 24px 60px' }}>

        {/* Header */}
        <div style={{ maxWidth: 900, margin: '0 auto 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
              Lunettes Pour Tous
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: -0.5 }}>
              Fiche Pratique
            </h1>
            <div style={{ fontSize: 13, color: TEXT_SUB, marginTop: 4 }}>
              Synthèse de la formation — points essentiels
            </div>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setShowQr(true)}
              style={{
                background: `${GOLD}18`, border: `1px solid ${GOLD}60`,
                color: GOLD, fontSize: 13, fontWeight: 700,
                padding: '10px 20px', borderRadius: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}35` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}18` }}
            >
              ⬜ QR Code
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: `${BLUE}18`, border: `1px solid ${BLUE}60`,
                color: BLUE_LIGHT, fontSize: 13, fontWeight: 700,
                padding: '10px 20px', borderRadius: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all .2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}35` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}18` }}
            >
              ⬇ Exporter en PDF
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── ENTREPRISE ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>L'entreprise</SectionTitle>

            {/* Chiffres clés */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Fondée en', value: '2014' },
                { label: 'Magasins', value: '33' },
                { label: 'Collaborateurs', value: '+1 000' },
                { label: 'Paires / jour (réseau)', value: '5 000' },
                { label: 'Année 2025', value: '1 M de paires vendues' },
              ].map((item, i) => (
                <Card key={i} accent={BLUE} style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, color: TEXT_SUB, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: i === 4 ? 15 : 20, fontWeight: 900, color: BLUE_LIGHT }}>{item.value}</div>
                </Card>
              ))}
            </div>

            {/* Promesse 10 min — mise en avant */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,137,186,0.18) 0%, rgba(0,171,233,0.08) 100%)',
              border: `2px solid ${BLUE}`,
              borderRadius: 16, padding: '22px 28px', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 24,
            }}>
              <div style={{
                flexShrink: 0, width: 80, height: 80, borderRadius: 20,
                background: BLUE, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', lineHeight: 1 }}>10</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>MIN</div>
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: BLUE_LIGHT, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
                  Notre promesse — ce qui nous différencie
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, lineHeight: 1.3 }}>
                  Vos lunettes fabriquées en 10 minutes
                </div>
                <div style={{ fontSize: 13, color: TEXT_SUB, marginTop: 4 }}>
                  Avec ou sans ordonnance
                </div>
              </div>
            </div>

            {/* Ce qui rend la promesse possible */}
            <div style={{ fontSize: 10, fontWeight: 700, color: TEXT_SUB, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
              Ce qui rend cette promesse possible
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '📦', title: 'Stocks en magasin', desc: 'Verres et montures disponibles immédiatement sur place — aucune commande à attendre.' },
                { icon: '⚙️', title: 'Machines à la pointe de la technologie', desc: 'Équipements de taille et montage de verres directement en boutique, précis et rapides.' },
                { icon: '🚚', title: 'Centre logistique national', desc: "Un centre logistique approvisionne chaque magasin quotidiennement pour maintenir les stocks à flot." },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                  background: CARD, border: `1px solid ${BORDER}`,
                  borderLeft: `4px solid ${BLUE_LIGHT}`,
                  borderRadius: 12, padding: '14px 18px',
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── TRAME D'ACCUEIL ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={GOLD}>Trame d'accueil</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { num: 1, text: 'Bonjour et bienvenue chez Lunettes Pour Tous', color: BLUE_LIGHT, emoji: '👋' },
                { num: 2, text: 'Connaissez-vous le concept ?', color: '#7c3aed', emoji: '💡' },
                { num: 3, text: "Ici c'est simple, c'est la possibilité d'avoir ses lunettes de vue en seulement 10 minutes avec ou sans ordonnance.", color: '#f59e0b', emoji: '⏱️' },
                { num: 4, text: "Je vous inscris en examen de vue ? C'est gratuit et sans rendez-vous.", color: '#22c55e', emoji: '✅' },
              ].map(step => (
                <Card key={step.num} accent={step.color} style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    background: `${step.color}20`, border: `2px solid ${step.color}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 900, color: step.color,
                  }}>{step.num}</div>
                  <div style={{ paddingTop: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: TEXT, lineHeight: 1.6 }}>
                      {step.emoji} {step.text}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── OPTIQUE ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>Optique — Les 4 troubles de la vue</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12, marginBottom: 20 }}>
              {[
                { trouble: 'Myopie', symptome: 'Flou de loin', correction: 'Sphère (−)', color: '#e05555' },
                { trouble: 'Hypermétropie', symptome: 'Flou partout, effort constant', correction: 'Sphère (+)', color: BLUE_LIGHT },
                { trouble: 'Astigmatisme', symptome: 'Vision déformée / floue', correction: 'Cylindre + Axe (°)', color: GOLD },
                { trouble: 'Presbytie', symptome: 'Flou de près dès 40–45 ans', correction: 'Addition (Add)', color: '#22c55e' },
              ].map((item, i) => (
                <Card key={i} accent={item.color}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: item.color, marginBottom: 6 }}>{item.trouble}</div>
                  <div style={{ fontSize: 12, color: TEXT_SUB, marginBottom: 8 }}>{item.symptome}</div>
                  <Tag color={item.color}>{item.correction}</Tag>
                </Card>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card accent={BLUE}>
                <Label color={BLUE}>Lire une ordonnance</Label>
                {[
                  { champ: 'Sphère', desc: 'Myopie (−) ou Hypermétropie (+)' },
                  { champ: 'Cylindre', desc: 'Astigmatisme' },
                  { champ: 'Axe', desc: 'Toujours présent avec le Cylindre (en °)' },
                  { champ: 'Add', desc: 'Valeur ajoutée à la sphère pour la vision de près (presbytie)' },
                ].map((row, i, arr) => (
                  <TableRow key={i} label={row.desc} value={row.champ} accent={BLUE_LIGHT} last={i === arr.length - 1} />
                ))}
              </Card>
              <Card accent={BLUE}>
                <Label color={BLUE}>Repères clés</Label>
                <TableRow label="Paliers de correction" value="0,25 dioptrie" accent={BLUE_LIGHT} />
                <TableRow label="Sphère en stock (fabrication 10 min)" value="−8 à +7,25" accent={BLUE_LIGHT} />
                <TableRow label="Fabrication unifocal" value="10 min" accent={BLUE_LIGHT} />
                <TableRow label="Fabrication progressif" value="9 jours" accent={BLUE_LIGHT} last />
              </Card>
            </div>
          </div>

          {/* ── OFFRES ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={GOLD}>Les offres</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14 }}>

              <Card accent={BLUE}>
                <Label color={BLUE}>Parcours Classique</Label>
                <TableRow label="1ère paire" value="dès 10 €" accent={BLUE_LIGHT} />
                <TableRow label="2ème paire" value="−20 %" accent={BLUE_LIGHT} last />
              </Card>

              <Card accent={GOLD}>
                <Label color={GOLD}>Parcours 1=1</Label>
                <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.6, marginBottom: 12 }}>
                  1 paire achetée = <strong style={{ color: GOLD }}>1 paire offerte</strong><br />
                  Éligible tout le magasin · Même en solaire<br />
                  Tous traitements inclus
                </div>
                <TableRow label="Unifocal" value="~157 €" accent={GOLD} />
                <TableRow label="Progressif" value="~260 €" accent={GOLD} last />
              </Card>

              <Card accent={BORDEAUX}>
                <Label color={BORDEAUX}>Parcours Suprême</Label>
                <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.6, marginBottom: 12 }}>
                  1 paire achetée = <strong style={{ color: BORDEAUX }}>1 paire offerte</strong><br />
                  Verres <strong style={{ color: TEXT }}>Origine France</strong> garantie<br />
                  Éligible tout le magasin · Même en solaire
                </div>
                <TableRow label="Condition" value="Tiers payant complet" accent={BORDEAUX} last />
              </Card>

              <Card accent={BLUE_LIGHT}>
                <Label color={BLUE_LIGHT}>Pack Plan</Label>
                <div style={{ fontSize: 24, fontWeight: 900, color: BLUE_LIGHT, marginBottom: 10 }}>95 €</div>
                <TableRow label="Nombre de paires" value="2 paires" accent={BLUE_LIGHT} />
                <TableRow label="Correction" value="Sans correction" accent={BLUE_LIGHT} />
                <TableRow label="Traitements" value="Au choix" accent={BLUE_LIGHT} />
                <TableRow label="Montures" value="Au choix" accent={BLUE_LIGHT} last />
              </Card>

            </div>
          </div>

          {/* ── PROGRESSIF ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>Le verre progressif</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Card accent={BLUE}>
                  <Label color={BLUE}>3 zones de vision</Label>
                  {[
                    { zone: 'Haut', usage: 'Loin (> 3 m)' },
                    { zone: 'Centre', usage: 'Intermédiaire' },
                    { zone: 'Bas', usage: 'Près (< 40 cm)' },
                  ].map((item, i, arr) => (
                    <TableRow key={i} label={item.usage} value={item.zone} accent={BLUE_LIGHT} last={i === arr.length - 1} />
                  ))}
                </Card>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Card accent={GOLD}>
                  <Label color={GOLD}>Signes de presbytie</Label>
                  <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
                    • Éloigne ses documents pour lire<br />
                    • Fatigue visuelle en fin de journée<br />
                    • 40–45 ans → vérifier la présence d'une <strong style={{ color: GOLD }}>Add</strong> sur l'ordonnance
                  </div>
                </Card>
                <Card accent='#22c55e'>
                  <Label color='#22c55e'>Arguments de vente LPT</Label>
                  {[
                    'Zones extra-larges 180°',
                    'Garantie adaptation 100 jours',
                    'Dès 30 €',
                    'Fabrication rapide',
                  ].map((arg, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < 3 ? `1px solid ${BORDER}` : 'none' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: TEXT_SUB }}>{arg}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </div>

          {/* ── PDM ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>Prise de mesures (PDM)</SectionTitle>
            <Card accent={GOLD} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: GOLD, marginBottom: 4 }}>Règle absolue</div>
              <div style={{ fontSize: 13, color: TEXT_SUB }}>
                <strong style={{ color: TEXT }}>LPTVISION est obligatoire.</strong> Aucune mesure manuelle autorisée.<br />
                Objectif : positionner précisément le verre face à la pupille pour une correction parfaite.
              </div>
            </Card>
            <Label color={BLUE}>Les 3 conditions pour une mesure fiable</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { num: '1', label: 'Client debout, droit', desc: 'Posture naturelle, sans forcer' },
                { num: '2', label: 'Monture bien droite', desc: 'Branches parallèles, bien positionnée' },
                { num: '3', label: 'Opticien à 1 mètre', desc: 'Face aux yeux du client' },
              ].map((step) => (
                <Card key={step.num} accent={BLUE} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: `${BLUE}20`, border: `2px solid ${BLUE}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 900, color: BLUE_LIGHT, flexShrink: 0,
                  }}>{step.num}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{step.label}</div>
                    <div style={{ fontSize: 12, color: TEXT_SUB }}>{step.desc}</div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ── REMBOURSEMENT ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent='#22c55e'>Droits au remboursement des lunettes en France</SectionTitle>

            {/* Conditions */}
            <Card accent='#22c55e' style={{ marginBottom: 14 }}>
              <Label color='#22c55e'>Conditions pour être remboursé</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { icon: '📋', text: 'Avoir une ordonnance valable (ophtalmologiste ou renouvellement adapté par un opticien)' },
                  { icon: '⏳', text: "Respecter les délais de renouvellement selon l'âge" },
                  { icon: '🏥', text: 'Avoir une mutuelle ou la CSS (Complémentaire Santé Solidaire)' },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Délais + Renouvellement adapté */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <Card accent={BLUE}>
                <Label color={BLUE}>Délais de renouvellement</Label>
                <TableRow label="Moins de 16 ans" value="1 an" accent={BLUE_LIGHT} />
                <TableRow label="16 ans et +" value="2 ans" accent={BLUE_LIGHT} last />
              </Card>

              <Card accent='#a78bfa'>
                <Label color='#a78bfa'>Renouvellement adapté (par l'opticien)</Label>
                <TableRow label="Moins de 16 ans" value="Sans délai" accent='#a78bfa' />
                <TableRow label="16 ans et + (après 1 an et 1 jour)" value="Possible" accent='#a78bfa' last />
              </Card>
            </div>

            {/* Validité des ordonnances */}
            <Card accent={GOLD} style={{ marginBottom: 14 }}>
              <Label color={GOLD}>Validité des ordonnances</Label>
              <TableRow label="Enfants (moins de 16 ans)" value="1 an" accent={GOLD} />
              <TableRow label="Adultes (16–42 ans)" value="5 ans" accent={GOLD} />
              <TableRow label="Adultes presbytes (42 ans et +)" value="3 ans" accent={GOLD} last />
            </Card>

            {/* Tiers payant */}
            <Card accent={BORDEAUX}>
              <Label color={BORDEAUX}>Tiers payant</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Tiers payant partiel</div>
                  <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.5 }}>
                    La Sécu paie sa part directement à l'opticien. Le client avance uniquement la part de sa mutuelle.
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BORDEAUX, marginBottom: 4 }}>Tiers payant complet ✓</div>
                  <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.5 }}>
                    La Sécu <strong style={{ color: TEXT }}>et</strong> la mutuelle paient directement l'opticien. Le client ne débourse rien. Requis pour le Parcours Suprême.
                  </div>
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10, padding: '12px 16px', textAlign: 'center',
              }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>
                  Chez Lunettes Pour Tous, le reste à charge est de{' '}
                  <span style={{ color: '#22c55e' }}>0 €</span>
                </span>
              </div>
            </Card>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
              LPT FORMATION — Document interne
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
