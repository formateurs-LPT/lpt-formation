'use client'

const BLUE = '#0089ba'
const BLUE_LIGHT = '#00abe9'
const GOLD = '#c9a227'
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

export default function FichePratique() {
  const handlePrint = () => window.print()

  return (
    <>
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
          <button
            className="no-print"
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

        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* ── ENTREPRISE ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE}>L'entreprise</SectionTitle>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
              {[
                { label: 'Fondée en', value: '2014' },
                { label: 'Magasins', value: '33' },
                { label: 'Collaborateurs', value: '+1 000' },
                { label: 'Fabrication', value: '10 min' },
                { label: 'Paires / jour (réseau)', value: '5 000' },
                { label: 'Objectif 2025', value: '1 M paires' },
              ].map((item, i) => (
                <Card key={i} accent={BLUE} style={{ padding: '14px 18px' }}>
                  <div style={{ fontSize: 11, color: TEXT_SUB, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: BLUE_LIGHT }}>{item.value}</div>
                </Card>
              ))}
            </div>
            <Card accent={GOLD}>
              <Label color={GOLD}>Différenciation LPT</Label>
              <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
                Zéro intermédiaire · Marque propre · Machines en boutique<br />
                Prix du marché traditionnel : <strong style={{ color: TEXT }}>400–500 €</strong> → LPT bien en dessous
              </div>
            </Card>
          </div>

          {/* ── TRAME D'ACCUEIL ── */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={GOLD}>Trame d'accueil</SectionTitle>
            <Card accent={GOLD}>
              <div style={{ fontSize: 15, fontWeight: 600, color: TEXT, lineHeight: 1.8, fontStyle: 'italic' }}>
                "Bonjour ! Connaissez-vous le concept LPT ?<br />
                Nous fabriquons vos lunettes en 10 minutes, avec ou sans ordonnance.<br />
                L'examen de vue est <strong style={{ color: GOLD }}>gratuit</strong>."
              </div>
            </Card>
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
                  { champ: 'Add', desc: 'Presbytie — valeur ajoutée pour le près' },
                ].map((row, i, arr) => (
                  <TableRow key={i} label={row.desc} value={row.champ} accent={BLUE_LIGHT} last={i === arr.length - 1} />
                ))}
              </Card>
              <Card accent={BLUE}>
                <Label color={BLUE}>Repères clés</Label>
                <TableRow label="Paliers de correction" value="0,25 dioptrie" accent={BLUE_LIGHT} />
                <TableRow label="Myopie en boutique jusqu'à" value="−8" accent={BLUE_LIGHT} />
                <TableRow label="Myopie commande jusqu'à" value="−22" accent={BLUE_LIGHT} />
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
                <TableRow label="2ème paire" value="−20 %" accent={BLUE_LIGHT} />
                <TableRow label="Fabrication" value="⚡ 10 min" accent={BLUE_LIGHT} last />
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

              <Card accent={BLUE_LIGHT}>
                <Label color={BLUE_LIGHT}>Pack Plan</Label>
                <div style={{ fontSize: 24, fontWeight: 900, color: BLUE_LIGHT, marginBottom: 6 }}>95 €</div>
                <div style={{ fontSize: 13, color: TEXT_SUB }}>2 paires · Sans ordonnance</div>
              </Card>

              <Card accent='#22c55e'>
                <Label color='#22c55e'>GlassProtect — Garantie verre</Label>
                {[
                  { label: 'Basic', desc: 'Protection de base' },
                  { label: 'Silver', desc: 'Protection renforcée' },
                  { label: 'Gold', desc: 'Casse + rayure — 1 an ✓' },
                ].map((item, i, arr) => (
                  <TableRow key={i} label={item.desc} value={item.label} accent='#22c55e' last={i === arr.length - 1} />
                ))}
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
                <Card accent='#e05555'>
                  <Label color='#e05555'>Point clé</Label>
                  <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.6 }}>
                    Les côtés sont flous : c'est <strong style={{ color: TEXT }}>inévitable</strong>.<br />
                    Apprendre à <strong style={{ color: '#e05555' }}>tourner la tête</strong>, pas les yeux.
                  </div>
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
                Objectif : centrer parfaitement le verre devant la pupille → confort et efficacité optimaux.
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
