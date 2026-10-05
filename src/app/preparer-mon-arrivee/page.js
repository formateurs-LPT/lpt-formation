'use client'
import Image from 'next/image'
import Link from 'next/link'

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }

// Fiches à venir — contenu ajouté séparément par la suite (vidéos, histoire,
// fondateurs...). On pose la structure maintenant pour qu'elle soit prête à
// être remplie, sur le même principe que les tuiles "Bientôt disponible" du
// dashboard collaborateur complet.
const RUBRIQUES = [
  { emoji: '🎬', titre: 'Vidéo de présentation', sousTitre: 'Qui nous sommes, en quelques minutes' },
  { emoji: '🏛️', titre: 'Notre histoire', sousTitre: 'Depuis quand on existe, comment on a grandi' },
  { emoji: '👤', titre: 'Nos fondateurs', sousTitre: 'Qui a créé Lunettes Pour Tous, et pourquoi' },
  { emoji: '👓', titre: 'Notre mission', sousTitre: 'Ce qu’on fait, et pour qui' },
]

function RubriqueCard({ emoji, titre, sousTitre }) {
  return (
    <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 20px' }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a', marginBottom: 4 }}>{titre}</div>
      <div style={{ fontSize: 12.5, color: '#9aa1ac' }}>{sousTitre}</div>
      <div style={{
        marginTop: 10, display: 'inline-block', fontSize: 11, fontWeight: 700, color: '#9aa1ac',
        background: '#f0f1f3', borderRadius: 20, padding: '3px 10px',
      }}>Bientôt disponible</div>
    </div>
  )
}

export default function PreparerMonArriveePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f6f8' }}>
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '20px 20px', display: 'flex', justifyContent: 'center' }}>
        <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={168} height={62} style={{ objectFit: 'contain' }} />
      </div>

      <div style={{ padding: '28px 20px 60px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <Link href="/espace-collaborateur" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0089ba', textDecoration: 'none', marginBottom: 20 }}>
            ← Retour à mon espace
          </Link>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#14161a', margin: '0 0 10px' }}>
            Préparer mon arrivée chez Lunettes Pour Tous
          </h1>
          <div style={{ ...cardStyle, marginBottom: 24, background: '#eaf3fd', border: '1px solid #bae0f7' }}>
            <div style={{ fontSize: 13.5, color: '#0369a1', lineHeight: 1.6 }}>
              Avant ton premier jour, retrouve ici de quoi mieux connaître l&apos;entreprise que tu rejoins : des vidéos de présentation, notre histoire, qui l&apos;a fondée, et ce qu&apos;on fait au quotidien. De quoi arriver le jour J avec les bases sur Lunettes Pour Tous.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            {RUBRIQUES.map(r => <RubriqueCard key={r.titre} {...r} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
