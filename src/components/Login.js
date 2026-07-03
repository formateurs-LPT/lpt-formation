'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Login({ onTrainerLogin, onParticipantJoin }) {
  const [showTrainerPanel, setShowTrainerPanel] = useState(false)
  const [isJoinMode, setIsJoinMode] = useState(false)
  const [trainerId, setTrainerId] = useState('')
  const [trainerCode, setTrainerCode] = useState('')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')

  useEffect(() => {
    setIsJoinMode(new URLSearchParams(window.location.search).get('join') === '1')
  }, [])

  const handleTrainerConnect = () => {
    onTrainerLogin(trainerId, trainerCode)
  }

  const handleJoin = () => {
    onParticipantJoin(nom, prenom)
  }

  const canJoin = nom.trim() && prenom.trim()

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
          {!isJoinMode && (
            <>
              <div className="lcard-section-label">Accès formateur</div>
              {!showTrainerPanel ? (
                <button className="rbtn trainer" onClick={() => setShowTrainerPanel(true)}>
                  <span style={{ fontSize: 22 }}>🎓</span>
                  <div>Espace Formateur<span className="sub">Connexion avec identifiant et code</span></div>
                </button>
              ) : (
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
                    <button className="lbtn-cancel" onClick={() => { setShowTrainerPanel(false); setTrainerId(''); setTrainerCode('') }}>Annuler</button>
                  </div>
                </div>
              )}
              <div className="sep"></div>
            </>
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
            style={{ width: '100%', marginTop: 10, opacity: canJoin ? 1 : 0.55 }}
            onClick={handleJoin}
            disabled={!canJoin}
          >
            Rejoindre →
          </button>
          <p className="hint">
            Saisissez nom et prénom comme sur la ligne bleue « Connexion : … » (Entrées de la semaine)
          </p>
        </div>
      </div>
    </div>
  )
}
