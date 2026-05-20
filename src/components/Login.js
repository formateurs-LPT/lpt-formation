'use client'
import { useState } from 'react'
import Image from 'next/image'

export default function Login({ onTrainerLogin, onParticipantJoin, onTVMode }) {
  const [showTrainerPanel, setShowTrainerPanel] = useState(false)
  const [showTVPanel, setShowTVPanel] = useState(false)
  const [trainerId, setTrainerId] = useState('')
  const [trainerCode, setTrainerCode] = useState('')
  const [pname, setPname] = useState('')
  const [scode, setScode] = useState('')
  const [tvCode, setTvCode] = useState('')
  const [tvError, setTvError] = useState(false)

  const handleTVConnect = () => {
    if (tvCode.trim().toUpperCase() === 'LPT2026') {
      onTVMode()
    } else {
      setTvError(true)
      setTimeout(() => setTvError(false), 1800)
    }
  }

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
            <Image src="/assets/logo-lpt.png" alt="Lunettes Pour Tous" width={160} height={60} style={{ objectFit: 'contain' }} />
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

          <div className="sep"></div>

          <div className="lcard-section-label">Diffusion</div>
          {!showTVPanel ? (
            <button className="rbtn" onClick={() => setShowTVPanel(true)} style={{ opacity: 0.75 }}>
              <span style={{ fontSize: 22 }}>📺</span>
              <div>Mode TV / Écran salle<span className="sub">Affichage synchronisé pour la télévision</span></div>
            </button>
          ) : (
            <div className="trainer-login-panel">
              <input
                className="finput"
                type="text"
                placeholder="Code de session"
                maxLength={8}
                value={tvCode}
                onChange={e => { setTvCode(e.target.value.toUpperCase()); setTvError(false) }}
                onKeyDown={e => e.key === 'Enter' && handleTVConnect()}
                style={{ borderColor: tvError ? '#ef4444' : undefined }}
                autoComplete="off"
              />
              {tvError && <p style={{ color: '#ef4444', fontSize: 12, marginTop: -8, marginBottom: 8 }}>Code incorrect</p>}
              <div className="trainer-actions">
                <button className="lbtn-connect" onClick={handleTVConnect}>Activer le mode TV →</button>
                <button className="lbtn-cancel" onClick={() => { setShowTVPanel(false); setTvCode('') }}>Annuler</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
