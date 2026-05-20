'use client'
import { useState } from 'react'
import Image from 'next/image'

export default function Login({ onTrainerLogin, onParticipantJoin }) {
  const [showTrainerPanel, setShowTrainerPanel] = useState(false)
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
          <div style={{ width: 72, height: 72, margin: '0 auto 18px', position: 'relative', zIndex: 1 }}>
            <Image src="/assets/avatar_kevin.png" alt="LPT" width={72} height={72} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <h1>Formation</h1>
          <p className="lcard-sub">Lunettes Pour Tous</p>
        </div>

        <div className="lcard-body">
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

          <div className="lcard-section-label">Rejoindre une session</div>
          <input
            className="finput"
            type="text"
            placeholder="Votre prénom et nom"
            value={pname}
            onChange={e => setPname(e.target.value)}
          />
          <div className="join-row">
            <input
              className="finput code-input"
              type="text"
              placeholder="CODE"
              maxLength={8}
              value={scode}
              onChange={e => setScode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button className="gbtn" onClick={handleJoin}>Rejoindre →</button>
          </div>
          <p className="hint">Le code de session est communiqué par votre formateur</p>
        </div>
      </div>
    </div>
  )
}
