'use client'
import { useState } from 'react'
import Image from 'next/image'

export default function Login({ onTrainerLogin, onParticipantJoin }) {
  const [showTrainerPanel, setShowTrainerPanel] = useState(false)
  const isJoinMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('join') === '1'
  const [trainerId, setTrainerId] = useState('')
  const [trainerCode, setTrainerCode] = useState('')
  const [pname, setPname] = useState('')
  const [scode, setScode] = useState('')

  const handleTrainerConnect = () => {
    onTrainerLogin(trainerId, trainerCode)
  }

  const handleJoin = () => {
    onParticipantJoin(pname, scode)
  }

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
          <input
            className="finput"
            type="text"
            placeholder="Votre prénom et nom"
            value={pname}
            onChange={e => setPname(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
          />
          <button className="gbtn" style={{ width: '100%', marginTop: 4 }} onClick={handleJoin}>Rejoindre →</button>
          <p className="hint">Entrez votre prénom et nom pour rejoindre la session</p>
        </div>
      </div>
    </div>
  )
}
