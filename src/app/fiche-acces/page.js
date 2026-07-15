'use client'
import { useState, useEffect } from 'react'

const BLUE = '#0089ba'
const BLUE_LIGHT = '#00abe9'
const GOLD = '#c9a227'
const GREEN = '#22c55e'
const PURPLE = '#8b5cf6'
const BG = '#03112a'
const BG2 = '#0d1f3c'
const CARD = 'rgba(255,255,255,0.04)'
const BORDER = 'rgba(255,255,255,0.1)'
const TEXT = '#ffffff'
const TEXT_SUB = 'rgba(255,255,255,0.55)'

function SectionTitle({ children, accent = BLUE }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
      <div style={{ width: 3, height: 28, background: accent, borderRadius: 2, flexShrink: 0 }} />
      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: TEXT, letterSpacing: 0.3 }}>{children}</h2>
    </div>
  )
}

function Step({ num, title, children, accent = BLUE, last = false }) {
  return (
    <div style={{ display: 'flex', gap: 18, paddingBottom: last ? 0 : 28, position: 'relative' }}>
      {/* Ligne verticale */}
      {!last && (
        <div style={{
          position: 'absolute', left: 19, top: 42, bottom: 0, width: 2,
          background: `${accent}30`,
        }} />
      )}
      {/* Numéro */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
        background: `${accent}20`, border: `2px solid ${accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 800, color: accent, lineHeight: 1,
      }}>{num}</div>
      {/* Contenu */}
      <div style={{ flex: 1, paddingTop: 8 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: TEXT_SUB, lineHeight: 1.65 }}>{children}</div>
      </div>
    </div>
  )
}

function Chip({ children, color = BLUE }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 12, fontWeight: 700,
      color, background: `${color}18`, border: `1px solid ${color}50`,
      borderRadius: 8, padding: '4px 12px', margin: '2px 4px 2px 0',
      letterSpacing: 0.3,
    }}>{children}</span>
  )
}

function Code({ children }) {
  return (
    <code style={{
      display: 'inline-block',
      fontSize: 13, fontWeight: 700, fontFamily: 'monospace',
      color: BLUE_LIGHT, background: 'rgba(0,171,233,0.12)',
      border: '1px solid rgba(0,171,233,0.3)',
      borderRadius: 6, padding: '2px 10px',
    }}>{children}</code>
  )
}

function InfoBox({ children, accent = GOLD }) {
  return (
    <div style={{
      background: `${accent}10`, border: `1px solid ${accent}40`,
      borderRadius: 12, padding: '14px 18px',
      fontSize: 13, color: TEXT_SUB, lineHeight: 1.65, marginTop: 10,
    }}>{children}</div>
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
          Fiche accès LPT
        </div>
        <div style={{
          background: '#03112a', borderRadius: 16, padding: 14,
          border: `2px solid ${BLUE}`,
          boxShadow: `0 0 40px ${BLUE}30`,
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR Code Fiche Accès" width={260} height={260} style={{ display: 'block', borderRadius: 8 }} />
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

export default function FicheAcces() {
  const [showQr, setShowQr] = useState(false)
  const [ficheUrl, setFicheUrl] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)

  useEffect(() => {
    setFicheUrl(window.location.origin + '/fiche-acces')
    setIsTrainer(!!localStorage.getItem('trainer_name'))
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
        <div style={{ maxWidth: 760, margin: '0 auto 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: BLUE, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>
              Lunettes Pour Tous
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: TEXT, letterSpacing: -0.5 }}>
              Créer mes accès LPT
            </h1>
            <div style={{ fontSize: 13, color: TEXT_SUB, marginTop: 4 }}>
              Gmail · Slack · LPTBot
            </div>
          </div>
          <div className="no-print" style={{ display: 'flex', gap: 10 }}>
            {isTrainer && (
              <button
                onClick={() => setShowQr(true)}
                style={{
                  background: `${GOLD}18`, border: `1px solid ${GOLD}60`,
                  color: GOLD, fontSize: 13, fontWeight: 700,
                  padding: '10px 20px', borderRadius: 12,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${GOLD}35` }}
                onMouseLeave={e => { e.currentTarget.style.background = `${GOLD}18` }}
              >
                ⬜ QR Code
              </button>
            )}
            <button
              onClick={handlePrint}
              style={{
                background: `${BLUE}18`, border: `1px solid ${BLUE}60`,
                color: BLUE_LIGHT, fontSize: 13, fontWeight: 700,
                padding: '10px 20px', borderRadius: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${BLUE}35` }}
              onMouseLeave={e => { e.currentTarget.style.background = `${BLUE}18` }}
            >
              ⬇ Télécharger en PDF
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* ── SECTION 1 : Gmail ── */}
          <div className="print-section" style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderLeft: `4px solid ${BLUE}`,
            borderRadius: 16, padding: '24px 28px',
          }}>
            <SectionTitle accent={BLUE}>
              <span style={{ fontSize: 20, marginRight: 6 }}>📧</span> Accès Gmail Lunettes Pour Tous
            </SectionTitle>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: TEXT_SUB, marginBottom: 12, lineHeight: 1.6 }}>
                Votre adresse mail professionnelle est votre identifiant sur tous les outils LPT.
              </div>

              {/* Format de l'adresse */}
              <div style={{
                background: `${BLUE}10`, border: `1px solid ${BLUE}35`,
                borderRadius: 12, padding: '16px 20px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: BLUE_LIGHT, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 10 }}>
                  Format de votre adresse
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  <Chip color={BLUE_LIGHT}>1ère lettre du prénom</Chip>
                  <span style={{ color: TEXT_SUB, fontSize: 14 }}>+</span>
                  <Chip color={BLUE_LIGHT}>nom de famille</Chip>
                  <span style={{ color: TEXT_SUB, fontSize: 14 }}>@lunettespourtous.com</span>
                </div>
                <div style={{ marginTop: 12, fontSize: 13, color: TEXT_SUB }}>
                  Exemple : <Code>qbahougne@lunettespourtous.com</Code>
                </div>
              </div>
            </div>

            <Step num={1} title="Ouvrir Gmail" accent={BLUE}>
              Rendez-vous sur <Code>gmail.com</Code> depuis votre téléphone ou ordinateur.
            </Step>

            <Step num={2} title='Cliquer sur "Ajouter un compte"' accent={BLUE}>
              En haut à droite, appuyez sur votre photo de profil (ou sur l&apos;icône utilisateur), puis sélectionnez
              {' '}<strong style={{ color: TEXT }}>Ajouter un compte</strong>.
            </Step>

            <Step num={3} title="Saisir vos identifiants LPT" accent={BLUE}>
              <div>Adresse mail : <Code>[1ère lettre prénom][nom]@lunettespourtous.com</Code></div>
              <div style={{ marginTop: 8 }}>
                Mot de passe temporaire : <Code>bonjour</Code> + votre prénom
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  Exemple : <Code>bonjourquentin</Code>
                </div>
              </div>
            </Step>

            <Step num={4} title="Choisir votre propre mot de passe" accent={BLUE} last>
              Gmail vous demandera de remplacer le mot de passe temporaire. Choisissez-en un
              {' '}<strong style={{ color: TEXT }}>personnel et sécurisé</strong> que vous seul connaîtrez.
              <InfoBox accent={BLUE}>
                💡 Notez-le quelque part ! Votre mot de passe Gmail vous servira à vous connecter à Slack et
                à d&apos;autres outils LPT.
              </InfoBox>
            </Step>
          </div>

          {/* ── SECTION 2 : Slack ── */}
          <div className="print-section" style={{
            background: CARD, border: `1px solid ${BORDER}`,
            borderLeft: `4px solid ${PURPLE}`,
            borderRadius: 16, padding: '24px 28px',
          }}>
            <SectionTitle accent={PURPLE}>
              <span style={{ fontSize: 20, marginRight: 6 }}>💬</span> Installation de Slack
            </SectionTitle>

            <div style={{ marginBottom: 20, fontSize: 12, color: TEXT_SUB, lineHeight: 1.6 }}>
              Slack est l&apos;outil de communication interne LPT. Il vous permet de rester en contact
              avec votre équipe et de recevoir vos informations de connexion chaque semaine.
            </div>

            <Step num={1} title="Installer l'application Slack" accent={PURPLE}>
              Téléchargez <strong style={{ color: TEXT }}>Slack</strong> sur votre téléphone (App Store ou Google Play)
              ou rendez-vous sur <Code>slack.com</Code> depuis votre ordinateur.
            </Step>

            <Step num={2} title="Se connecter avec Google (compte LPT)" accent={PURPLE}>
              Au moment de la connexion, choisissez <strong style={{ color: TEXT }}>Continuer avec Google</strong>{' '}
              et sélectionnez votre adresse <Code>@lunettespourtous.com</Code> que vous venez de créer.
            </Step>

            <Step num={3} title="Rejoindre le canal Lunettes Pour Tous" accent={PURPLE}>
              Une fois connecté(e), rejoignez le premier canal affiché qui porte
              {' '}<strong style={{ color: TEXT }}>le logo Lunettes Pour Tous</strong>.
              C&apos;est l&apos;espace de communication principal de votre enseigne.
            </Step>

            <Step num={4} title='Trouver "LPTBot" et ouvrir la conversation' accent={PURPLE}>
              Dans la barre de recherche Slack, tapez <Code>lptbot</Code> et sélectionnez
              le <strong style={{ color: PURPLE }}>LPTBot violet</strong>. Ouvrez la conversation.
              <InfoBox accent={PURPLE}>
                Il n&apos;y a rien à faire dans la conversation — il suffit de l&apos;ouvrir,
                puis de quitter. LPTBot apparaîtra automatiquement tout en bas de votre accueil Slack.
              </InfoBox>
            </Step>

            <Step num={5} title="C'est prêt !" accent={GREEN} last>
              Chaque <strong style={{ color: GREEN }}>lundi matin</strong>, LPTBot vous enverra automatiquement
              votre <strong style={{ color: TEXT }}>mot de passe de la semaine</strong> pour accéder au back-end.
              <InfoBox accent={GREEN}>
                🔑 Pensez à consulter Slack le lundi pour récupérer votre mot de passe avant de commencer votre journée.
              </InfoBox>
            </Step>
          </div>

          {/* ── Récap visuel ── */}
          <div className="print-section" style={{
            background: `${GOLD}08`, border: `1px solid ${GOLD}30`,
            borderRadius: 16, padding: '20px 24px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 }}>
              Récapitulatif
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '📧', label: 'Mail LPT', value: '[1ère lettre prénom][nom]@lunettespourtous.com', color: BLUE_LIGHT },
                { icon: '🔑', label: 'Mot de passe temporaire', value: '"bonjour" + votre prénom', color: BLUE_LIGHT },
                { icon: '💬', label: 'Slack', value: 'Connexion Google avec le mail LPT', color: PURPLE },
                { icon: '🤖', label: 'LPTBot', value: 'Mot de passe back-end tous les lundis', color: GREEN },
              ].map((row, i, arr) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  paddingBottom: i < arr.length - 1 ? 12 : 0,
                  borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none',
                }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{row.icon}</span>
                  <span style={{ fontSize: 13, color: TEXT_SUB, flex: '0 0 200px' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
