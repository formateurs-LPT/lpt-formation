'use client'
import { useState, useEffect } from 'react'
import FicheShareModal from '@/components/FicheShareModal'
import { PUBLIC_ORIGIN } from '@/lib/sessionCode'

const BLUE_L  = '#00abe9'
const GOLD    = '#f59e0b'
const GREEN   = '#22c55e'
const PURPLE  = '#a78bfa'
const VIOLET  = '#7c3aed'
const RED     = '#f87171'
const BG      = '#03112a'
const BG2     = '#0d1f3c'
const CARD    = 'rgba(255,255,255,0.04)'
const BORDER  = 'rgba(255,255,255,0.1)'
const TEXT    = '#ffffff'
const TEXT_SUB = 'rgba(255,255,255,0.55)'

/* ── Atoms ──────────────────────────────────────────────── */
function Label({ children, color = BLUE_L }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color, marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Card({ children, accent = BLUE_L, style = {} }) {
  return (
    <div className="print-card" style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '18px 22px', ...style,
    }}>{children}</div>
  )
}

function SectionTitle({ children, accent = BLUE_L, tag }) {
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

function Tag({ children, color = BLUE_L }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
      color, background: `${color}18`, border: `1px solid ${color}50`, borderRadius: 20, padding: '3px 10px',
    }}>{children}</span>
  )
}

function Row({ label, value, accent = BLUE_L, last = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: last ? 'none' : `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 12, color: TEXT_SUB }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: accent }}>{value}</span>
    </div>
  )
}

function Bullet({ items, color = BLUE_L }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 6 }} />
          <span style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.55 }}>{item}</span>
        </div>
      ))}
    </div>
  )
}

function StepBadge({ num, color }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: `${color}20`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color }}>
      {num}
    </div>
  )
}

function BandDivider({ label, color }) {
  return (
    <div className="print-band" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, marginBottom: 4 }}>
      <div style={{ flex: 1, height: 1, background: `${color}40` }} />
      <span style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: 3 }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: `${color}40` }} />
    </div>
  )
}

function QrModal({ url, onClose }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=ffffff&bgcolor=03112a&data=${encodeURIComponent(url)}`
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: 2 }}>Fiche SAV</div>
        <div style={{ background: '#03112a', borderRadius: 16, padding: 14, border: `2px solid ${RED}`, boxShadow: `0 0 40px ${RED}30` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR Code Fiche SAV" width={260} height={260} style={{ display: 'block', borderRadius: 8 }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Fiche SAV</div>
          <div style={{ fontSize: 12, color: TEXT_SUB }}>{url}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`, color: TEXT_SUB, fontSize: 13, fontWeight: 600, padding: '10px 28px', borderRadius: 12, cursor: 'pointer' }}>Fermer</button>
      </div>
    </div>
  )
}

/* ── Page principale ────────────────────────────────────────── */
export default function FicheSAV() {
  const [showQr, setShowQr] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [ficheUrl, setFicheUrl] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)

  useEffect(() => {
    setFicheUrl(PUBLIC_ORIGIN + '/fiche-sav')
    setIsTrainer(!!localStorage.getItem('trainer_name'))
  }, [])

  return (
    <>
      {showQr && ficheUrl && <QrModal url={ficheUrl} onClose={() => setShowQr(false)} />}
      {showShare && ficheUrl && (
        <FicheShareModal
          ficheUrl={ficheUrl}
          ficheLabel="SAV"
          posteFilter={['Monteur Optique SAV']}
          emailBody={`Bonjour,\n\nAprès cette journée dédiée au SAV, voici une fiche récapitulative des retraits, ajustages, RAZ, du montage et des montures outlet. Tu y trouveras l’essentiel des points vus ensemble.\n\n➡ ${ficheUrl}\n\nSi tu as la moindre question, n’hésite pas à me contacter sur ce mail.\n\nBonnes ventes à toi !`}
          onClose={() => setShowShare(false)}
        />
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: ${BG}; color: ${TEXT}; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .no-print { display: none !important; }
          html, body { background: ${BG} !important; color: ${TEXT} !important; margin: 0; }
          .print-page { background: ${BG} !important; padding: 6px 0 0 !important; min-height: 0 !important; }
          .print-section { break-inside: auto; page-break-inside: auto; }
          .print-card { break-inside: avoid !important; page-break-inside: avoid !important; }
          .print-band { break-before: page !important; page-break-before: always !important; margin-top: 0 !important; }
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>

      <div className="print-page" style={{ minHeight: '100vh', background: BG, padding: '32px 24px 80px' }}>

        {/* ── HEADER ── */}
        <div style={{ maxWidth: 960, margin: '0 auto 36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: RED, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
              Lunettes Pour Tous · SAV
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: -0.5, lineHeight: 1, marginBottom: 8 }}>
              Fiche SAV — Journée 4
            </h1>
            <p style={{ fontSize: 13, color: TEXT_SUB, maxWidth: 480, lineHeight: 1.6 }}>
              Retraits · Ajustages · RAZ · Montage · Montures Outlet — applicable en France et en Belgique
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Retraits', color: BLUE_L },
                { label: 'Ajustages', color: PURPLE },
                { label: 'RAZ · Recommandes', color: RED },
                { label: 'Le Montage', color: GOLD },
                { label: 'Montures Outlet', color: VIOLET },
              ].map(({ label, color }) => (
                <span key={label} style={{ fontSize: 10, fontWeight: 700, color, background: `${color}18`, border: `1px solid ${color}50`, borderRadius: 20, padding: '4px 12px', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            {isTrainer && (
              <>
                <button onClick={() => setShowQr(true)} style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}35` }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}18` }}>
                  ⬜ QR Code
                </button>
                <button onClick={() => setShowShare(true)} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)' }}>
                  📧 Envoyer aux SAV
                </button>
              </>
            )}
            <button onClick={() => window.print()} style={{ background: `${RED}18`, border: `1px solid ${RED}60`, color: RED, fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              onMouseEnter={e => { e.currentTarget.style.background = `${RED}35` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${RED}18` }}>
              ⬇ Exporter en PDF
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ══════════════════════════════════════════════════════
              SECTION 1 — RETRAITS
          ══════════════════════════════════════════════════════ */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE_L}>1 · Les Retraits</SectionTitle>

            {/* Vue d'ensemble */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
              {[
                { num: 1, label: 'SMS reçu', color: BLUE_L },
                { num: 2, label: 'Trouver la paire', color: GREEN },
                { num: 3, label: 'Essayage', color: GOLD },
                { num: 4, label: 'Signature + Avis', color: GREEN },
              ].map(({ num, label, color }) => (
                <div key={num} style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${color}10`, border: `1px solid ${color}40`, borderRadius: 30, padding: '6px 14px' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${color}25`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color, flexShrink: 0 }}>{num}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>

              {/* Étape 1 — SMS */}
              <Card accent={BLUE_L}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="1" color={BLUE_L} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Le SMS</div>
                    <div style={{ fontSize: 10, color: TEXT_SUB }}>Onglet Commandes</div>
                  </div>
                </div>
                <Bullet color={BLUE_L} items={[
                  '1 SMS = 1 paire prête (numéro de commande inclus)',
                  '2 paires = 2 SMS distincts → 2 retraits à faire',
                  'Saisir le N° dans Commandes → nom du client s\'affiche',
                ]} />
              </Card>

              {/* Étape 2 — Trouver */}
              <Card accent={GREEN}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="2" color={GREEN} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Trouver la paire</div>
                    <div style={{ fontSize: 10, color: TEXT_SUB }}>Étagères retrait</div>
                  </div>
                </div>
                <Bullet color={GREEN} items={[
                  'Paires classées par ordre alphabétique (nom de famille)',
                  '1 seul SMS reçu → vérifier l\'état de la 2ᵉ paire dans le Back End avant d\'informer le client',
                ]} />
              </Card>

              {/* Étape 3 — Essayage */}
              <Card accent={GOLD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="3" color={GOLD} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Essayage</div>
                    <div style={{ fontSize: 10, color: TEXT_SUB }}>Confort + Vision</div>
                  </div>
                </div>
                <Bullet color={GOLD} items={[
                  'Sortir la paire, vérifier qu\'elle est droite et sans défaut',
                  'Vérifier le port : bien serrée, droite sur le visage',
                  'Gêne visuelle = normale — le cerveau s\'adapte en portant',
                ]} />
                <div style={{ marginTop: 10, background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 8, padding: '8px 12px', fontSize: 11, color: GOLD, fontStyle: 'italic', lineHeight: 1.5 }}>
                  "C'est normal avec une nouvelle correction — en les portant, votre cerveau va s'adapter."
                </div>
              </Card>

              {/* Étape 4 — Signature */}
              <Card accent={GREEN}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="4" color={GREEN} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Signature + Avis</div>
                    <div style={{ fontSize: 10, color: TEXT_SUB }}>Finalisation</div>
                  </div>
                </div>
                <Bullet color={GREEN} items={[
                  'Faire signer sur le téléphone de vente — 1 signature par paire',
                  '2 paires = 2 retraits signés séparément',
                  'Proposer le QR code pour un avis Google',
                ]} />
              </Card>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 2 — AJUSTAGES
          ══════════════════════════════════════════════════════ */}
          <BandDivider label="Ajustages" color={PURPLE} />
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={PURPLE}>2 · Les Ajustages</SectionTitle>

            {/* Pourquoi */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
              {[
                { icon: '💆', titre: 'Confort quotidien', desc: 'Une paire mal réglée finit au placard — le client ne revient pas', color: PURPLE },
                { icon: '👁️', titre: 'Gêne visuelle', desc: 'Un mauvais réglage peut créer une gêne visuelle — un ajustage la corrige sans RAZ', color: BLUE_L },
                { icon: '💰', titre: 'Économique', desc: 'Évite une refabrication coûteuse pour LPT et une attente pour le client', color: GREEN },
              ].map(({ icon, titre, desc, color }) => (
                <div key={titre} className="print-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${color}`, borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{titre}</div>
                    <div style={{ fontSize: 11, color: TEXT_SUB, lineHeight: 1.45 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Règles matériaux */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <Card accent={GOLD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>🔥</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: GOLD }}>Acétate → à chaud</div>
                    <div style={{ fontSize: 11, color: TEXT_SUB }}>Chaleur sèche uniquement</div>
                  </div>
                </div>
                <Bullet color={GOLD} items={[
                  'Chauffer doucement (chaleur sèche — pas d\'eau)',
                  'Plier délicatement une fois ramolli',
                  'Ne jamais forcer à froid → risque de casse',
                  'Le pont est en une seule pièce → non ajustable en largeur',
                ]} />
              </Card>
              <Card accent={BLUE_L}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>❄️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: BLUE_L }}>Métal → à froid</div>
                    <div style={{ fontSize: 11, color: TEXT_SUB }}>Plaquettes et branches</div>
                  </div>
                </div>
                <Bullet color={BLUE_L} items={[
                  'Plaquettes de nez : réglables à froid (pince)',
                  'Branches : pliables à froid pour ajuster l\'angle',
                  'Plus de liberté que l\'acétate — réglage fin possible',
                  'Toujours valider le confort avec le client après',
                ]} />
              </Card>
            </div>

            {/* Règle d'or */}
            <div className="print-card" style={{ background: `${PURPLE}10`, border: `1px solid ${PURPLE}40`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>✅</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: PURPLE, marginBottom: 4 }}>Toujours valider avec le client</div>
                <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.55 }}>
                  Après chaque ajustage : faire essayer la paire et demander explicitement si la gêne a disparu. Ne jamais supposer que c'est bon — un client qui repart sans confirmer peut revenir la semaine suivante.
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 3 — RAZ
          ══════════════════════════════════════════════════════ */}
          <BandDivider label="RAZ · Recommandes" color={RED} />
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={RED}>3 · Les RAZ — Recommandes</SectionTitle>

            {/* Définition */}
            <Card accent={RED} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.65 }}>
                <strong style={{ color: TEXT }}>Une RAZ = refabriquer un équipement.</strong> C'est le dernier recours, uniquement quand c'est la seule solution.
                Toujours trouver la cause exacte avant de recommander — pour éviter la RAZ sur la RAZ.
              </div>
            </Card>

            {/* Les 4 vérifications */}
            <Label color={RED}>Les 4 vérifications — dans l'ordre</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {[
                {
                  num: 1, color: RED,
                  titre: 'Saisie de correction + vérif fronto',
                  points: ['Comparer l\'ordonnance avec le back-end (attention à la transposition)', 'Vérifier les verres au frontofocomètre — sphère, cylindre, axe', 'Si différent → problème trouvé. Si identique → étape suivante'],
                },
                {
                  num: 2, color: GOLD,
                  titre: 'PDM — Prises de mesures',
                  points: ['Unifocaux : centre optique au frontofocomètre face à la pupille', 'Progressifs : gravures → marqueur → ditest → la croix = vision de loin', 'Si centrage incorrect → tenter l\'ajustement avant de lancer la RAZ'],
                },
                {
                  num: 3, color: PURPLE,
                  titre: 'Ajustement',
                  points: ['Modifier l\'angle, l\'inclinaison, la position pour corriger le centrage', 'Faire essayer et valider avec le client', 'Si l\'ajustement ne suffit pas → RAZ avec les bonnes mesures'],
                },
                {
                  num: 4, color: BLUE_L,
                  titre: 'Ordonnance / Examen de vue',
                  points: ['Tout est conforme → envoyer en examen de vue gratuit', 'L\'opticien trouvera peut-être une correction différente', 'Faire essayer en lunettes d\'essai avant de relancer la fabrication'],
                },
              ].map(({ num, color, titre, points }) => (
                <div key={num} className="print-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: CARD, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${color}`, borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${color}20`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color }}>{num}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 8 }}>{titre}</div>
                    <Bullet color={color} items={points} />
                  </div>
                </div>
              ))}
            </div>

            {/* Règle d'or */}
            <div className="print-card" style={{ background: `${RED}10`, border: `1px solid ${RED}40`, borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6 }}>
                <strong style={{ color: RED }}>Règle d'or — Même quand on a trouvé le problème, vérifier les autres étapes.</strong><br />
                Éviter de refabriquer et rappeler le client 3 semaines plus tard parce qu'un autre point n'était pas bon.
              </div>
            </div>

            {/* Process saisie */}
            <Label color={RED}>Process de saisie RAZ — dans l'ordre</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
              {[
                {
                  step: 'A', color: RED,
                  titre: 'Le commentaire',
                  desc: 'Sur la commande d\'origine : ce qu\'on recommande + pourquoi + ce qu\'on a vérifié + initiales',
                },
                {
                  step: 'B', color: GOLD,
                  titre: 'Déclarer le litige',
                  desc: 'Onglet litige → paire fabriquée ? → élément concerné → nommer l\'erreur parmi les choix',
                },
                {
                  step: 'C', color: PURPLE,
                  titre: 'La recommande',
                  desc: 'Téléphone de vente → onglet Recommande → N° de commande → apporter les modifications',
                },
                {
                  step: 'D', color: BLUE_L,
                  titre: 'Appel supervision',
                  desc: 'Coller le commentaire sur la commande SAV d\'abord → appeler → donner le N° → saisir le code 0 €',
                },
                {
                  step: 'E', color: GREEN,
                  titre: 'Livraison',
                  desc: '10 min au labo sur place · ou commande → SMS au client à réception',
                },
              ].map(({ step, color, titre, desc }) => (
                <div key={step} className="print-card" style={{ background: CARD, border: `1px solid ${BORDER}`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color, flexShrink: 0 }}>{step}</div>
                    <span style={{ fontSize: 12, fontWeight: 800, color }}>{titre}</span>
                  </div>
                  <div style={{ fontSize: 11, color: TEXT_SUB, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Rappel commentaire */}
            <div style={{ marginTop: 14, background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, marginBottom: 4 }}>📝 Structure du commentaire</div>
              <div style={{ fontSize: 11, color: TEXT_SUB, lineHeight: 1.6 }}>
                <span style={{ color: TEXT }}>1. Ce qu'on recommande</span> (ex : "RAZ verres") · <span style={{ color: TEXT }}>2. Pourquoi</span> (ex : "Erreur saisie correction") · <span style={{ color: TEXT }}>3. Ce qu'on a vérifié</span> (ex : "PDM ok, correction validée en lunettes d'essai") · <strong style={{ color: GOLD }}>initiales</strong>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 4 — LE MONTAGE
          ══════════════════════════════════════════════════════ */}
          <BandDivider label="Le Montage" color={GOLD} />
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={GOLD}>4 · Le Montage — Des lunettes en 10 minutes</SectionTitle>

            <Card accent={GOLD} style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.65 }}>
                <strong style={{ color: TEXT }}>Des lunettes en 10 minutes, c'est notre concept.</strong> Vous avez les outils, le stock et les solutions
                nécessaires pour tenir cette promesse. En dehors de deux cas précis, chaque paire doit impérativement être fabriquée en 10 minutes.
              </div>
            </Card>

            {/* Les deux vraies raisons */}
            <Label color={GOLD}>Les deux seules vraies raisons de dépasser 10 minutes</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 18 }}>
              <Card accent={GOLD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>🔷</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Des verres progressifs</div>
                </div>
                <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.5 }}>Leur fabrication demande un temps incompressible.</div>
              </Card>
              <Card accent={GOLD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>📦</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Des verres unifocaux hors stock</div>
                </div>
                <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.5 }}>La correction du client dépasse la limite de nos stocks.</div>
              </Card>
            </div>

            {/* Les moyens */}
            <Label color={GOLD}>Les moyens à votre disposition</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 18 }}>
              {[
                { icon: '📚', titre: 'Un stock conséquent', desc: 'Toutes corrections et tous traitements compris.' },
                { icon: '⬆️', titre: 'L\'upgrade', desc: 'Offrir le traitement supérieur si le verre commandé n\'est pas en stock.' },
              ].map(({ icon, titre, desc }) => (
                <div key={titre} className="print-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${GOLD}`, borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{titre}</div>
                    <div style={{ fontSize: 11, color: TEXT_SUB, lineHeight: 1.45 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Upgrade détaillé */}
            <Card accent={GOLD} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: GOLD, marginBottom: 8 }}>⬆️ L'upgrade, qu'est-ce que c'est ?</div>
              <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6, marginBottom: 10 }}>
                Quand un client a commandé des verres que vous n'avez pas en stock, offrez-lui le traitement au-dessus. S'il n'est pas non plus en stock, offrez celui encore au-dessus.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {['Basic', 'Premium', 'Digital Protect Pro', 'Digital Protect Pro 1.67 (aminci)', 'Suprême Digital Protect Pro'].map((label, i, arr) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Tag color={GOLD}>{label}</Tag>
                    {i < arr.length - 1 && <span style={{ color: TEXT_SUB, fontSize: 12 }}>→</span>}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: TEXT_SUB, fontStyle: 'italic', lineHeight: 1.55 }}>
                Exemple : commande de verres Basic indisponibles → offrez le Digital Protect Pro. La promesse est tenue, le client est ravi de l'upgrade.
              </div>
            </Card>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 5 — MONTURES OUTLET
          ══════════════════════════════════════════════════════ */}
          <BandDivider label="Montures Outlet" color={VIOLET} />
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={VIOLET}>5 · Montures Outlet — Anticiper les ruptures de stock</SectionTitle>

            {/* Fonctionnement normal vs outlet */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginBottom: 18 }}>
              <Card accent={GREEN}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Fonctionnement normal</div>
                </div>
                <Bullet color={GREEN} items={[
                  'Le centre logistique a la monture en stock',
                  'Il reçoit les verres et monte la paire',
                  'Il nous envoie la paire complète, prête à remettre',
                ]} />
              </Card>
              <Card accent={VIOLET}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>📤</span>
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>La monture outlet</div>
                </div>
                <Bullet color={VIOLET} items={[
                  'Le centre logistique n\'a plus la monture en stock',
                  'Il nous envoie les verres seuls',
                  'La monture, elle, est déjà chez nous en magasin',
                ]} />
              </Card>
            </div>

            {/* Le risque */}
            <Label color={VIOLET}>Le risque à éviter</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, marginBottom: 18 }}>
              {[
                { icon: '🕐', titre: 'Le temps qui passe', desc: 'Entre la commande et la réception des verres, la monture continue de se vendre en magasin.' },
                { icon: '❌', titre: 'La dernière monture vendue', desc: 'Si on écoule le dernier exemplaire avant l\'arrivée des verres, plus de monture pour les monter.' },
                { icon: '📵', titre: 'Introuvable ailleurs', desc: 'Le centre logistique ne l\'a pas non plus — il faut appeler tous les magasins un par un.' },
              ].map(({ icon, titre, desc }) => (
                <div key={titre} className="print-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: CARD, border: `1px solid ${BORDER}`, borderLeft: `3px solid ${RED}`, borderRadius: 10, padding: '12px 14px' }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{titre}</div>
                    <div style={{ fontSize: 11, color: TEXT_SUB, lineHeight: 1.45 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="print-card" style={{ background: `${RED}10`, border: `1px solid ${RED}40`, borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>⚠️</span>
              <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6 }}>
                <strong style={{ color: RED }}>Délais rallongés, appels à tous les magasins, client mécontent — à éviter absolument.</strong>
              </div>
            </div>

            {/* La solution */}
            <Label color={VIOLET}>La solution — l'onglet Montures Outlet</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { num: 1, color: VIOLET, titre: 'Surveiller chaque jour', desc: 'Dans le dashboard monteur, l\'onglet « Montures Outlet » liste les commandes concernées — à vérifier tous les jours.' },
                { num: 2, color: GOLD, titre: 'Déstocker immédiatement', desc: 'Dès qu\'une commande apparaît, prendre la monture dans le stock magasin et la déstocker.' },
                { num: 3, color: GREEN, titre: 'Mettre de côté', desc: 'La ranger dans le bac prévu, avec le bon de fabrication de la commande concernée.' },
              ].map(({ num, color, titre, desc }) => (
                <div key={num} className="print-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: CARD, border: `1px solid ${BORDER}`, borderLeft: `4px solid ${color}`, borderRadius: 14, padding: '14px 18px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: `${color}20`, border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color }}>{num}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 4 }}>{titre}</div>
                    <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Résultat */}
            <div style={{ marginTop: 18, background: `${VIOLET}12`, border: `1px solid ${VIOLET}45`, borderRadius: 14, padding: '16px 22px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: TEXT }}>
                Résultat : quand les verres arrivent, il ne reste qu'à se servir dans le bac outlet. Plus d'attente inutile pour le client.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: 1 }}>
              LPT FORMATION · SAV — Document interne · France & Belgique — lpt-formation.vercel.app/fiche-sav
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
