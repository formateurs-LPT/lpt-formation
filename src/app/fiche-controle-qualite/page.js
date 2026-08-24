'use client'
import { useState, useEffect } from 'react'
import FicheShareModal from '@/components/FicheShareModal'
import { PUBLIC_ORIGIN } from '@/lib/sessionCode'

const TEAL    = '#06b6d4'
const BLUE_L  = '#00abe9'
const GOLD    = '#f59e0b'
const GREEN   = '#22c55e'
const PURPLE  = '#a78bfa'
const RED     = '#f87171'
const BG      = '#03112a'
const BG2     = '#0d1f3c'
const CARD    = 'rgba(255,255,255,0.04)'
const BORDER  = 'rgba(255,255,255,0.1)'
const TEXT    = '#ffffff'
const TEXT_SUB = 'rgba(255,255,255,0.55)'

/* ── Atoms ──────────────────────────────────────────────── */
function Label({ children, color = TEAL }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color, marginBottom: 10 }}>
      {children}
    </div>
  )
}

function Card({ children, accent = TEAL, style = {} }) {
  return (
    <div className="print-card" style={{
      background: CARD, border: `1px solid ${BORDER}`,
      borderLeft: `4px solid ${accent}`, borderRadius: 14, padding: '18px 22px', ...style,
    }}>{children}</div>
  )
}

function SectionTitle({ children, accent = TEAL, tag }) {
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

function Tag({ children, color = TEAL }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
      color, background: `${color}18`, border: `1px solid ${color}50`, borderRadius: 20, padding: '3px 10px',
    }}>{children}</span>
  )
}

function Bullet({ items, color = TEAL }) {
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

function AlertCard({ accent, icon, title, children }) {
  return (
    <div className="print-card" style={{
      background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
      border: `2px solid ${accent}`, borderRadius: 16, padding: '18px 22px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <div style={{ fontSize: 13, fontWeight: 800, color: accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</div>
      </div>
      {children}
    </div>
  )
}

function QrModal({ url, onClose }) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=ffffff&bgcolor=03112a&data=${encodeURIComponent(url)}`
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 24, padding: '40px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 2 }}>Fiche Contrôle Qualité</div>
        <div style={{ background: '#03112a', borderRadius: 16, padding: 14, border: `2px solid ${TEAL}`, boxShadow: `0 0 40px ${TEAL}30` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR Code Fiche Contrôle Qualité" width={260} height={260} style={{ display: 'block', borderRadius: 8 }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Fiche Contrôle Qualité</div>
          <div style={{ fontSize: 12, color: TEXT_SUB }}>{url}</div>
        </div>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${BORDER}`, color: TEXT_SUB, fontSize: 13, fontWeight: 600, padding: '10px 28px', borderRadius: 12, cursor: 'pointer' }}>Fermer</button>
      </div>
    </div>
  )
}

/* ── Page principale ────────────────────────────────────────── */
export default function FicheControleQualite() {
  const [showQr,    setShowQr]    = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [ficheUrl,  setFicheUrl]  = useState('')
  const [isTrainer, setIsTrainer] = useState(false)

  useEffect(() => {
    setFicheUrl(PUBLIC_ORIGIN + '/fiche-controle-qualite')
    setIsTrainer(!!localStorage.getItem('trainer_name'))
  }, [])

  return (
    <>
      {showQr && ficheUrl && <QrModal url={ficheUrl} onClose={() => setShowQr(false)} />}
      {showShare && ficheUrl && (
        <FicheShareModal
          ficheUrl={ficheUrl}
          ficheLabel="Contrôle Qualité"
          posteFilter={['Contrôle Qualité']}
          emailBody={`Bonjour,\n\nVoici la fiche récapitulative des points de contrôle qualité à vérifier sur les montures et les verres (unifocaux et progressifs) avant validation d'une commande.\n\n➡ ${ficheUrl}\n\nSi tu as la moindre question, n'hésite pas à me contacter sur ce mail.\n\nBonne journée à toi !`}
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
          /* globals.css cache tout par défaut pour l'export "rapport" (.print-report-area) —
             sans ceci, cette fiche s'imprime en pages vides (fond sombre, aucun contenu). */
          .print-page, .print-page * { visibility: visible !important; }
          .print-page { background: ${BG} !important; padding: 6px 0 0 !important; min-height: 0 !important; }
          .print-section { break-inside: auto; page-break-inside: auto; }
          .print-card { break-inside: avoid !important; page-break-inside: avoid !important; }
          .print-band { break-before: page !important; page-break-before: always !important; margin-top: 0 !important; }
          .print-frame-img { height: 140px !important; }
          @page { size: A4 landscape; margin: 12mm; }
        }
      `}</style>

      <div className="print-page" style={{ minHeight: '100vh', background: BG, padding: '32px 24px 80px' }}>

        {/* ── HEADER ── */}
        <div style={{ maxWidth: 960, margin: '0 auto 36px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>
              Lunettes Pour Tous · Centre de fabrication
            </div>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: TEXT, letterSpacing: -0.5, lineHeight: 1, marginBottom: 8 }}>
              Fiche Contrôle Qualité
            </h1>
            <p style={{ fontSize: 13, color: TEXT_SUB, maxWidth: 520, lineHeight: 1.6 }}>
              Vérification par échantillonnage des montures et des verres (unifocal · progressif) en sortie de chaîne de production
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: 'Contrôle Monture', color: BLUE_L },
                { label: 'Verres Unifocal', color: GOLD },
                { label: 'Verres Progressif', color: PURPLE },
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
                <button onClick={() => setShowQr(true)} style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}60`, color: GOLD, fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}35` }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}18` }}>
                  ⬜ QR Code
                </button>
                <button onClick={() => setShowShare(true)} style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.12)' }}>
                  📧 Envoyer au contrôle qualité
                </button>
              </>
            )}
            <button onClick={() => window.print()} style={{ background: `${TEAL}18`, border: `1px solid ${TEAL}60`, color: TEAL, fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = `${TEAL}35` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${TEAL}18` }}>
              ⬇ Exporter en PDF
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ══════════════════════════════════════════════════════
              SECTION 0 — CONTEXTE DU POSTE
          ══════════════════════════════════════════════════════ */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={TEAL}>Le poste — pourquoi ce contrôle</SectionTitle>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px', background: `${TEAL}08`, border: `1px solid ${TEAL}25`, borderRadius: 14 }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>🔍</div>
              <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.7 }}>
                Plusieurs collaborateurs taillent les verres sur nos machines et les montent sur les montures — certaines commandes arrivent
                déjà taillées directement. Le <strong style={{ color: TEXT }}>contrôleur qualité</strong> prélève des <strong style={{ color: TEAL }}>échantillons au hasard</strong> parmi
                les équipements sortis de la chaîne de production et vérifie leur conformité avant validation, sur la monture comme sur les verres.
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 1 — CONTRÔLE MONTURE
          ══════════════════════════════════════════════════════ */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={BLUE_L}>1 · Contrôle Monture</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
              <Card accent={BLUE_L}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="1" color={BLUE_L} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Conformité à la commande</div>
                </div>
                <Bullet color={BLUE_L} items={[
                  'Ouvrir la commande dans le backend',
                  'Vérifier la référence de la monture',
                  'Comparer le visuel monture ↔ commande',
                ]} />
              </Card>

              <Card accent={GREEN}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="2" color={GREEN} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>État global</div>
                </div>
                <Bullet color={GREEN} items={[
                  'Monture non tordue',
                  'Pas de trace d\'abîmure ni d\'écaillage',
                  'Visserie en bon état et bien serrée',
                ]} />
              </Card>
            </div>

            <AlertCard accent={RED} icon="⚠️" title="Piège — même forme, couleurs différentes">
              <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6 }}>
                Certaines références partagent exactement la même forme mais existent en <strong style={{ color: TEXT }}>plusieurs coloris</strong>.
                Toujours vérifier la <strong style={{ color: RED }}>référence couleur précise</strong> dans le backend — pas seulement la forme de la monture.
              </div>
            </AlertCard>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 2 — VERRES UNIFOCAL
          ══════════════════════════════════════════════════════ */}
          <BandDivider label="Contrôle Verres" color={GOLD} />
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={GOLD}>2 · Verres Unifocal</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
              <Card accent={GOLD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="1" color={GOLD} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Bon de fabrication</div>
                </div>
                <Bullet color={GOLD} items={[
                  'Récupérer le bon de fabrication depuis le backend',
                ]} />
              </Card>

              <Card accent={GOLD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="2" color={GOLD} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Vérification au frontofocomètre</div>
                </div>
                <Bullet color={GOLD} items={[
                  'Les corrections mesurées correspondent au bon de fabrication',
                  'Pas d\'inversion entre les deux verres',
                ]} />
              </Card>

              <Card accent={GOLD}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="3" color={GOLD} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Traitement du verre</div>
                </div>
                <Bullet color={GOLD} items={[
                  'Comparer au traitement choisi par le vendeur dans le backend',
                  'Si solaire : bien vérifier que la couleur correspond',
                ]} />
              </Card>
            </div>

            <AlertCard accent={RED} icon="🔴" title="Risque d'inversion — montures à cerclage rond">
              <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.6, marginBottom: 14 }}>
                Sur les montures à <strong style={{ color: TEXT }}>cerclage rond</strong> (ex. références <strong style={{ color: RED }}>SLPT030-ECJ</strong> et <strong style={{ color: RED }}>LPT514-TRVK</strong>),
                l'inversion des verres OD/OG arrive vite. Ouvrir le backend et vérifier les corrections œil par œil — et vérifier également
                qu'il n'y a pas eu d'inversion dès <strong style={{ color: TEXT }}>l'encodage de la vente</strong>.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { src: '/assets/controle-qualite-monture-slpt030-ecj.jpg', ref: 'SLPT030-ECJ' },
                  { src: '/assets/controle-qualite-monture-lpt514-trvk.jpg', ref: 'LPT514-TRVK' },
                ].map(m => (
                  <div key={m.ref} style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${RED}30`, borderRadius: 12, overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="print-frame-img" src={m.src} alt={`Monture ${m.ref} — cerclage rond`} style={{ width: '100%', height: 160, objectFit: 'contain', background: '#fff', display: 'block' }} />
                    <div style={{ padding: '8px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: RED }}>{m.ref}</div>
                  </div>
                ))}
              </div>
            </AlertCard>
          </div>

          {/* ══════════════════════════════════════════════════════
              SECTION 3 — VERRES PROGRESSIF
          ══════════════════════════════════════════════════════ */}
          <div className="print-section" style={{ background: BG2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 26px' }}>
            <SectionTitle accent={PURPLE}>3 · Verres Progressif</SectionTitle>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 16 }}>
              <Card accent={PURPLE}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="1" color={PURPLE} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Bon de fabrication + frontofocomètre</div>
                </div>
                <Bullet color={PURPLE} items={[
                  'Même vérification que pour l\'unifocal : corrections conformes, pas d\'inversion OD/OG',
                  'Vérifier aussi l\'encodage de la vente en cas de doute',
                ]} />
              </Card>

              <Card accent={PURPLE}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <StepBadge num="2" color={PURPLE} />
                  <div style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>Traitement du verre</div>
                </div>
                <Bullet color={PURPLE} items={[
                  'Comparer au traitement choisi par le vendeur dans le backend',
                  'Si solaire : bien vérifier que la couleur correspond',
                ]} />
              </Card>
            </div>

            <AlertCard accent={PURPLE} icon="🎯" title="Vérifier la rotation du verre — cerclage rond">
              <div style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.65, marginBottom: 14 }}>
                Sur une monture à cerclage rond, pendant le clipsage, le verre progressif peut se retrouver positionné dans le <strong style={{ color: TEXT }}>mauvais axe</strong> (tourné).
                Contrairement à l'unifocal, cette rotation ne se détecte pas forcément au frontofocomètre seul — il faut vérifier visuellement l'alignement des gravures.
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${PURPLE}30`, borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: PURPLE, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Méthode</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { num: '1', text: 'Marquer au feutre la gravure de chaque côté du verre — côté nasal ET côté temporal' },
                    { num: '2', text: 'Faire de même sur les deux verres (OD et OG)' },
                    { num: '3', text: 'Vérifier que tous les points marqués sont bien alignés entre eux' },
                  ].map(s => (
                    <div key={s.num} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: `${PURPLE}25`, border: `1.5px solid ${PURPLE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, color: PURPLE, marginTop: 1 }}>{s.num}</div>
                      <span style={{ fontSize: 12, color: TEXT_SUB, lineHeight: 1.5 }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${PURPLE}30`, borderRadius: 12, overflow: 'hidden' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="print-frame-img" src="/assets/controle-qualite-gravures-progressif.jpg" alt="Pointage des gravures nasale et temporale sur un verre progressif" style={{ width: '100%', height: 260, objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
                <div style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, color: TEXT_SUB }}>
                  Points marqués côté nasal et temporal sur chaque verre — à vérifier alignés une fois la monture montée
                </div>
              </div>
            </AlertCard>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', paddingTop: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: 1 }}>
              LPT FORMATION · CONTRÔLE QUALITÉ — Document interne — lpt-formation.vercel.app/fiche-controle-qualite
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
