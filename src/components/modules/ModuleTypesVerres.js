'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

// ── Contenu des pages du module ───────────────────────────────────
const PAGES = [
  {
    id: 'unifocal',
    titre: 'Le Verre Unifocal',
    sousTitre: 'La correction simple, efficace, accessible',
    points: [
      { emoji: '🎯', titre: 'Une seule correction', texte: 'Corrige un seul défaut visuel : myopie, hypermétropie ou astigmatisme.' },
      { emoji: '👁️', titre: 'Pour qui ?', texte: 'Clients non presbytes, ou presbytes souhaitant des verres dédiés à une seule distance (lecture ou écran).' },
      { emoji: '💡', titre: 'Avantage clé', texte: 'Vision nette sur toute la surface du verre — sans zone de flou.' },
      { emoji: '💰', titre: 'Dans notre offre', texte: 'Proposé en 100% Santé (0€) ou en offre 1=1. Idéal pour une première paire.' },
    ],
    avatarScript: "Le verre unifocal, c'est le verre le plus courant. Il corrige un seul défaut visuel — myopie, hypermétropie ou astigmatisme. Toute la surface est homogène : pas de zone de flou, une vision nette partout.",
    color: '#00abe9',
  },
  {
    id: 'progressif',
    titre: 'Le Verre Progressif',
    sousTitre: 'Trois zones, une liberté totale',
    points: [
      { emoji: '🔭', titre: 'Vision de loin', texte: 'Zone supérieure — conduite, cinéma, paysages. Nette à plus de 150 cm.' },
      { emoji: '💻', titre: 'Vision intermédiaire', texte: 'Zone centrale — écran, comptoir, rayon. De 40 cm à 150 cm.' },
      { emoji: '📖', titre: 'Vision de près', texte: 'Zone inférieure — lecture, smartphone, écriture. Moins de 40 cm.' },
      { emoji: '🏆', titre: 'Argument différenciant', texte: 'Extra-large 180° avec aberrations réduites. Garantie adaptation 100 jours.' },
    ],
    avatarScript: "Le progressif, c'est notre produit phare. Trois zones en un seul verre : loin, intermédiaire, près. Pas besoin de changer de lunettes. Et notre garantie adaptation 100 jours enlève toute objection.",
    color: '#7c3aed',
  },
  {
    id: 'antireflet',
    titre: "Le Traitement Antireflet",
    sousTitre: 'Pas un verre, un must-have',
    points: [
      { emoji: '✨', titre: 'Réduction des reflets', texte: 'Élimine les reflets parasites des écrans, phares, néons. Vision plus confortable.' },
      { emoji: '🛡️', titre: 'Protection UV', texte: 'Filtre les UV et la lumière bleue nocive selon les traitements.' },
      { emoji: '🧹', titre: 'Facilité d\'entretien', texte: 'Traitement anti-salissure intégré. Verre plus facile à nettoyer au quotidien.' },
      { emoji: '💬', titre: 'Argument client', texte: '"Vos yeux méritent ce qu\'il y a de mieux — l\'antireflet, c\'est pour vous, pas pour votre verre."' },
    ],
    avatarScript: "L'antireflet c'est systématique. Chaque client devant un écran — et ils y sont tous — a besoin de ça. Ne proposez jamais un verre sans antireflet. C'est votre devoir de conseil.",
    color: '#0d9488',
  },
]

// ── Composant verre animé ─────────────────────────────────────────
function VerreAnime({ color }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Halo lumineux derrière */}
      <div style={{
        position: 'absolute',
        width: 340, height: 340,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        animation: 'haloPulse 3s ease-in-out infinite',
      }} />
      {/* Image du verre */}
      <div style={{ animation: 'verreFloat 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <Image
          src="/assets/verre-unifocal.png"
          alt="Verre optique"
          width={380}
          height={380}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 0 40px rgba(0,171,233,0.5))' }}
          priority
        />
      </div>
    </div>
  )
}

// ── Bulle avatar formateur ────────────────────────────────────────
function AvatarBubble({ script, trainerAvatar }) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800)
    return () => clearTimeout(t)
  }, [script])

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10,
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: 'all .5s ease',
    }}>
      {/* Bulle de dialogue */}
      <div style={{
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderRadius: '18px 18px 4px 18px', padding: '14px 18px',
        maxWidth: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        fontSize: 13, color: '#1a1a2e', lineHeight: 1.5, fontWeight: 500,
      }}>
        {script}
      </div>
      {/* Avatar */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        border: '3px solid #00abe9',
        overflow: 'hidden', flexShrink: 0,
        boxShadow: '0 4px 20px rgba(0,171,233,0.4)',
        animation: 'avatarPulse 2s ease-in-out infinite',
      }}>
        <Image src={trainerAvatar || '/assets/avatar_kevin.png'} alt="Formateur" width={56} height={56} style={{ objectFit: 'cover' }} />
      </div>
    </div>
  )
}

// ── Page de contenu ───────────────────────────────────────────────
function ContentPage({ page, trainerAvatar, onPrev, onNext, isFirst, isLast, pageIndex, total }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    setEntered(false)
    const t = setTimeout(() => setEntered(true), 50)
    return () => clearTimeout(t)
  }, [page.id])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 50%, #0d3b7a 100%)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Particules déco */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 3, height: 3, borderRadius: '50%',
            background: '#00abe9',
            opacity: 0.3 + (i % 4) * 0.15,
            left: `${8 + i * 8}%`,
            top: `${15 + (i % 5) * 18}%`,
            animation: `particleFloat ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite alternate`,
          }} />
        ))}
      </div>

      {/* Barre de navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 32px', position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt.png" alt="LPT" width={100} height={38} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Module · Types de verres</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{pageIndex + 1} / {total}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array(total).fill(0).map((_, i) => (
              <div key={i} style={{
                width: i === pageIndex ? 20 : 6, height: 6, borderRadius: 3,
                background: i === pageIndex ? '#00abe9' : 'rgba(255,255,255,0.2)',
                transition: 'all .3s',
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 40, padding: '20px 48px 40px', alignItems: 'center',
      }}>
        {/* Colonne gauche — texte */}
        <div style={{
          opacity: entered ? 1 : 0, transform: entered ? 'translateX(0)' : 'translateX(-30px)',
          transition: 'all .6s ease',
        }}>
          <div style={{
            display: 'inline-block', background: `${page.color}25`,
            border: `1px solid ${page.color}50`, borderRadius: 20,
            padding: '4px 14px', fontSize: 11, fontWeight: 700,
            color: page.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
          }}>
            Formation LPT
          </div>
          <h1 style={{
            fontSize: 42, fontWeight: 800, color: '#ffffff',
            lineHeight: 1.1, marginBottom: 8,
          }}>
            {page.titre}
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 36, fontWeight: 400 }}>
            {page.sousTitre}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {page.points.map((pt, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, alignItems: 'flex-start',
                opacity: entered ? 1 : 0,
                transform: entered ? 'translateX(0)' : 'translateX(-20px)',
                transition: `all .5s ease ${0.1 + i * 0.1}s`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: `${page.color}20`, border: `1px solid ${page.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {pt.emoji}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{pt.titre}</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{pt.texte}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite — verre */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: entered ? 1 : 0, transform: entered ? 'scale(1)' : 'scale(0.9)',
          transition: 'all .7s ease .1s',
        }}>
          <VerreAnime color={page.color} />
        </div>
      </div>

      {/* Boutons navigation */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 48px 32px', position: 'relative', zIndex: 10,
      }}>
        <button
          onClick={onPrev}
          disabled={isFirst}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
            color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
            padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 600,
            cursor: isFirst ? 'not-allowed' : 'pointer', transition: 'all .2s',
          }}
        >← Précédent</button>

        <button
          onClick={onNext}
          style={{
            background: isLast ? '#22c55e' : '#00abe9',
            border: 'none', color: '#fff',
            padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700,
            cursor: 'pointer', transition: 'all .2s',
            boxShadow: `0 4px 20px ${isLast ? '#22c55e' : '#00abe9'}60`,
          }}
        >{isLast ? '✓ Terminer le module' : 'Suivant →'}</button>
      </div>

      {/* Avatar bulle */}
      <AvatarBubble script={page.avatarScript} trainerAvatar={trainerAvatar} />
    </div>
  )
}

// ── Lobby ─────────────────────────────────────────────────────────
function Lobby({ onStart, onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 50%, #0d3b7a 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 520, padding: '0 24px' }}>
        <button onClick={onBack} style={{
          position: 'absolute', top: 24, left: 24,
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10,
          fontSize: 13, cursor: 'pointer',
        }}>← Retour</button>

        <div style={{ fontSize: 64, marginBottom: 24 }}>👁️</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 12 }}>
          Module de formation
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          Types de verres
        </h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 40, lineHeight: 1.6 }}>
          Unifocal · Progressif · Antireflet<br />
          Présentez chaque verre avec ses arguments de vente
        </p>

        <button onClick={onStart} style={{
          background: 'linear-gradient(135deg, #0089ba, #00abe9)',
          border: 'none', color: '#fff', padding: '16px 48px',
          borderRadius: 16, fontSize: 18, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0,171,233,0.4)',
          transition: 'all .2s',
        }}>
          ▶ Lancer le module
        </button>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 20 }}>
          3 pages · ~10 minutes
        </p>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────
export default function ModuleTypesVerres({ pName, onBack }) {
  const [started, setStarted] = useState(false)
  const [pageIndex, setPageIndex] = useState(0)
  const trainerAvatar = pName
    ? `/assets/avatar_${pName.toLowerCase()}.png`
    : '/assets/avatar_kevin.png'

  if (!started) return <Lobby onStart={() => setStarted(true)} onBack={onBack} />

  const page = PAGES[pageIndex]
  return (
    <>
      <style>{`
        @keyframes verreFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-14px) scale(1.03); }
        }
        @keyframes haloPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        @keyframes avatarPulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,171,233,0.4); }
          50% { box-shadow: 0 4px 32px rgba(0,171,233,0.8); }
        }
        @keyframes particleFloat {
          from { transform: translateY(0px); opacity: 0.3; }
          to { transform: translateY(-12px); opacity: 0.6; }
        }
      `}</style>
      <ContentPage
        page={page}
        trainerAvatar={trainerAvatar}
        pageIndex={pageIndex}
        total={PAGES.length}
        isFirst={pageIndex === 0}
        isLast={pageIndex === PAGES.length - 1}
        onPrev={() => setPageIndex(i => Math.max(0, i - 1))}
        onNext={() => {
          if (pageIndex < PAGES.length - 1) setPageIndex(i => i + 1)
          else onBack()
        }}
      />
    </>
  )
}
