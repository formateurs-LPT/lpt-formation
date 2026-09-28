'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function Login({ onTrainerLogin, onParticipantJoin }) {
  const [isJoinMode, setIsJoinMode] = useState(false)
  const [role, setRole] = useState(null) // null | 'formateur' | 'collaborateur'
  const [trainerId, setTrainerId] = useState('')
  const [trainerCode, setTrainerCode] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    // Lien "rejoindre" tapé/collé à la main (formés sans lecteur QR) : on saute
    // directement l'écran de choix pour reproduire le comportement d'avant.
    const joinMode = new URLSearchParams(window.location.search).get('join') === '1'
    setIsJoinMode(joinMode)
    if (joinMode) setRole('collaborateur')
  }, [])

  const handleTrainerConnect = () => {
    onTrainerLogin(trainerId, trainerCode)
  }

  const handleJoin = async () => {
    if (joining) return
    setJoining(true)
    try {
      await onParticipantJoin(nom, prenom)
    } finally {
      // Si la connexion a réussi, ce composant a déjà été démonté (changement
      // de vue côté parent) — ce reset ne s'applique donc que sur échec
      // (identifiant inconnu, salle fermée...), pour permettre de réessayer.
      setJoining(false)
    }
  }

  const canJoin = nom.trim() && prenom.trim() && !joining

  return (
    <div id="landing">
      <div className="lcard">
        <div className="lcard-orb"></div>
        <div className="lcard-head">
          <div style={{ margin: '0 auto 18px', position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center' }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={160} height={60} style={{ objectFit: 'contain' }} />
          </div>
          <h1>Formation</h1>
          <p className="lcard-sub">Lunettes Pour Tous</p>
        </div>

        <div className="lcard-body">
          {role === null && (
            <>
              <div className="lcard-section-label">Je suis…</div>
              <button className="rbtn trainer" onClick={() => setRole('formateur')}>
                <span style={{ fontSize: 22 }}>🎓</span>
                <div>Formateur<span className="sub">Connexion avec identifiant et code</span></div>
              </button>
              <button className="rbtn" onClick={() => setRole('collaborateur')}>
                <span style={{ fontSize: 22 }}>🙋</span>
                <div>Collaborateur<span className="sub">Rejoindre une session en formation</span></div>
              </button>
              <Link href="/manager" className="rbtn" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: 22 }}>🏬</span>
                <div>Manager<span className="sub">Suivi de mon équipe en magasin</span></div>
              </Link>
              <Link href="/direction" className="rbtn" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: 22 }}>🧭</span>
                <div>Direction<span className="sub">Directeur retail ou régional</span></div>
              </Link>
            </>
          )}

          {role === 'formateur' && (
            <>
              <button className="lbtn-cancel" style={{ marginBottom: 14 }} onClick={() => { setRole(null); setTrainerId(''); setTrainerCode('') }}>
                ← Retour
              </button>
              <div className="lcard-section-label">Accès formateur</div>
              <div className="trainer-login-panel">
                <input
                  className="finput"
                  type="text"
                  placeholder="Identifiant (Kevin, Quentin…)"
                  value={trainerId}
                  onChange={e => setTrainerId(e.target.value)}
                  autoComplete="off"
                />
                <input
                  className="finput"
                  type="password"
                  placeholder="Code"
                  maxLength={10}
                  value={trainerCode}
                  onChange={e => setTrainerCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleTrainerConnect()}
                  style={{ marginBottom: 0 }}
                />
                <div className="trainer-actions">
                  <button className="lbtn-connect" onClick={handleTrainerConnect}>Se connecter →</button>
                </div>
              </div>
            </>
          )}

          {role === 'collaborateur' && (
            <>
              {!isJoinMode && (
                <button className="lbtn-cancel" style={{ marginBottom: 14 }} onClick={() => setRole(null)}>
                  ← Retour
                </button>
              )}
              <div className="lcard-section-label">Rejoindre une session</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <input
                  className="finput"
                  type="text"
                  placeholder="Nom"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canJoin && handleJoin()}
                  autoComplete="family-name"
                />
                <input
                  className="finput"
                  type="text"
                  placeholder="Prénom"
                  value={prenom}
                  onChange={e => setPrenom(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && canJoin && handleJoin()}
                  autoComplete="given-name"
                />
              </div>
              <button
                className="gbtn"
                style={{
                  width: '100%', marginTop: 10, opacity: (nom.trim() && prenom.trim()) ? 1 : 0.55,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  cursor: canJoin ? 'pointer' : 'default',
                }}
                onClick={handleJoin}
                disabled={!canJoin}
              >
                {joining && (
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'loginSpin .7s linear infinite' }} />
                )}
                {joining ? 'Connexion…' : 'Rejoindre →'}
              </button>
              <style>{`@keyframes loginSpin { to { transform: rotate(360deg); } }`}</style>
              <p className="hint">
                Scannez le QR du formateur ou saisissez nom et prénom (ligne bleue « Connexion : … »)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
