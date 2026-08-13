'use client'
import { useState, useEffect } from 'react'
import { sbSelect, sbUpdate, sbDelete, insertSessionHistory, getActiveSessionCode } from '@/lib/supabase'
import {
  filterParticipantsInRh,
  loadEntreesList,
  shouldShowAnswerForTrainer,
} from '@/lib/participantNames'
import { useOnlineCount } from '@/lib/useOnlineCount'

const STEP_NAMES = ['Quiz initial', 'Les bases', 'Arguments & Offre', 'Ordonnances', 'Quiz final']
const SLIDE_NOTES = [
  'Slide 1 : Introduction générale. Insistez sur le fait que le progressif corrige myopie, hypermétropie, astigmatisme ET presbytie en un seul verre.',
  'Slide 2 : Zone supérieure — Vision de loin (+150cm). Usages : conduite, cinéma, paysages, sports.',
  'Slide 3 : Zone centrale — Vision intermédiaire (40-150cm). C\'est l\'argument no.1 pour les profils écran. Souvent sous-vendu.',
  'Slide 4 : Zone inférieure — Vision de près (-40cm). Lecture, smartphone, couture, écriture.',
  'Slide 5 : Zones d\'aberration. Inévitables mais RÉDUITES chez LPT. Conseil : tourner la tête, pas les yeux.',
  'Slide 6 : Les 5 arguments de vente. Faites les citer par les participants avant de montrer la slide.',
]

function ParticipantList({ sessionCode }) {
  const [participants, setParticipants] = useState([])
  useEffect(() => {
    const load = async () => {
      try {
        const [data, entrees] = await Promise.all([
          sbSelect('participants', 'session_code=eq.' + sessionCode),
          loadEntreesList(),
        ])
        setParticipants(filterParticipantsInRh(data || [], entrees))
      } catch { /* ignore, réessai au prochain tick */ }
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [sessionCode])

  return (
    <div id="plist">
      {participants.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--text-m)', padding: '4px 6px' }}>En attente...</p>
      ) : participants.map(p => {
        const initials = (p.name || '?').split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || '?'
        return (
          <div key={p.name} className="pchip">
            <div className="pavatar">{initials}</div>
            <div className="pname">{p.name}</div>
            <div className="pstatus">✓</div>
          </div>
        )
      })}
    </div>
  )
}

function ResponseFeed({ sessionCode, scenarioIdx, label }) {
  const [items, setItems] = useState([])
  useEffect(() => {
    const load = async () => {
      try {
        const [data, participants, entrees] = await Promise.all([
          sbSelect('scenario_responses', `session_code=eq.${sessionCode}&scenario_idx=eq.${scenarioIdx}`),
          sbSelect('participants', 'session_code=eq.' + sessionCode),
          loadEntreesList(),
        ])
        const rows = data || []
        setItems(rows.filter(r => shouldShowAnswerForTrainer(r.participant_name, participants, entrees)))
      } catch { /* ignore */ }
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [sessionCode, scenarioIdx])

  if (items.length === 0) return <p style={{ fontSize: 12, color: 'var(--text-m)' }}>En attente...</p>
  return (
    <div className="rfeed">
      {items.map((r, i) => {
        const av = (r.participant_name || '?').split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || '?'
        return (
          <div key={i} className="ritem">
            <div className="ravatar">{av}</div>
            <div>
              <div className="rname">{r.participant_name}</div>
              <div className="rtext">{r.response}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuizResults({ sessionCode }) {
  const [results, setResults] = useState([])
  useEffect(() => {
    const load = async () => {
      try {
        const [data, participants, entrees] = await Promise.all([
          sbSelect('quiz_results', 'session_code=eq.' + sessionCode),
          sbSelect('participants', 'session_code=eq.' + sessionCode),
          loadEntreesList(),
        ])
        const rows = data || []
        setResults(rows.filter(r => shouldShowAnswerForTrainer(r.participant_name, participants, entrees)))
      } catch { /* ignore */ }
    }
    load()
    const interval = setInterval(load, 3000)
    return () => clearInterval(interval)
  }, [sessionCode])

  if (results.length === 0) return <p style={{ fontSize: 12, color: 'var(--text-m)' }}>En attente...</p>
  return (
    <div className="qgrid">
      {results.map(r => {
        const av = (r.participant_name || '?').split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || '?'
        const finalScore = typeof r.answers?.final_score === 'number' ? r.answers.final_score : r.score
        const initial = r.answers?.initial_score ?? '—'
        const cls = finalScore >= 8 ? 'sg' : finalScore >= 6 ? 'sok' : 'sl'
        return (
          <div key={r.participant_name} className="qcard">
            <div className="qavatar">{av}</div>
            <div className="qcname">{r.participant_name}</div>
            <div className={`qcscore ${cls}`}>{finalScore}/10</div>
            <div style={{ fontSize: 10, color: 'var(--text-m)' }}>Avant : {initial}/10</div>
          </div>
        )
      })}
    </div>
  )
}

function SlideViewer({ sessionCode, curSlide, onPrev, onNext }) {
  const totalSlides = 6
  return (
    <div>
      <div className="slide-container">
        <img
          src={`/slides/slide${curSlide}.jpg`}
          alt={`Slide ${curSlide}`}
          style={{ width: '100%', display: 'block', borderRadius: 'var(--r)' }}
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="slide-counter">{curSlide} / {totalSlides}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button className="btn2" id="btn-slide-prev" onClick={onPrev} style={{ opacity: curSlide === 1 ? .3 : 1 }}>← Préc.</button>
        <button className="btn1" id="btn-slide-next" onClick={onNext} style={{ opacity: curSlide === totalSlides ? .3 : 1 }}>Suivant →</button>
      </div>
      <div className="tcard">
        <h3>📝 Notes formateur — Slide {curSlide}</h3>
        <p id="slide-notes" style={{ fontSize: 13, color: 'var(--text-s)', lineHeight: 1.6 }}>{SLIDE_NOTES[curSlide - 1]}</p>
      </div>
    </div>
  )
}

export default function TrainerView({ pName, onBack, onToast, onOnlineCount }) {
  const [curStep, setCurStep] = useState(-1)
  const [curSlide, setCurSlide] = useState(1)
  const [lobbyActive, setLobbyActive] = useState(true)
  const [participantCount, setParticipantCount] = useState(0)

  // Resynchronise depuis la base au montage : sans ça, un formateur qui revient
  // sur cet écran (retour arrière, rafraîchissement) après avoir déjà lancé la
  // formation retombait sur "Prêt à lancer ?" et un re-clic remettait
  // current_step à 0, réinitialisant la progression des formés en cours.
  useEffect(() => {
    let cancelled = false
    sbSelect('sessions', `code=eq.${encodeURIComponent(getActiveSessionCode())}&limit=1`)
      .then(rows => {
        if (cancelled) return
        const step = rows?.[0]?.current_step
        if (typeof step === 'number' && step >= 0) {
          setCurStep(step)
          setLobbyActive(false)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  useOnlineCount({
    enabled: true,
    onCount: (count) => {
      setParticipantCount(count)
      onOnlineCount?.(count)
    },
  })

  const launchFormation = async () => {
    try {
      await sbUpdate('sessions', { current_step: 0 }, 'code=eq.' + getActiveSessionCode())
      setCurStep(0)
      setLobbyActive(false)
      onToast('Formation lancée !')
    } catch {
      onToast('Erreur — impossible de lancer la formation')
    }
  }

  const trainerGo = async (step) => {
    if (step < 0 || step > 4) return
    try {
      await sbUpdate('sessions', { current_step: step, active_scenario: step === 1 ? 1 : 0 }, 'code=eq.' + getActiveSessionCode())
      setCurStep(step)
      if (step === 1) setCurSlide(1)
      onToast(`"${STEP_NAMES[step]}" diffusée`)
    } catch {
      onToast('Erreur de synchronisation — réessayez')
    }
  }

  const nextSlide = async () => {
    if (curSlide < 6) {
      const next = curSlide + 1
      setCurSlide(next)
      await sbUpdate('sessions', { active_scenario: next }, 'code=eq.' + getActiveSessionCode())
    }
  }

  const prevSlide = async () => {
    if (curSlide > 1) {
      const prev = curSlide - 1
      setCurSlide(prev)
      await sbUpdate('sessions', { active_scenario: prev }, 'code=eq.' + getActiveSessionCode())
    }
  }

  const endSession = async () => {
    if (!window.confirm('Terminer et enregistrer la session ?')) return
    try {
      const [participants, quizResults, responses] = await Promise.all([
        sbSelect('participants', 'session_code=eq.' + getActiveSessionCode()),
        sbSelect('quiz_results', 'session_code=eq.' + getActiveSessionCode()),
        sbSelect('scenario_responses', 'session_code=eq.' + getActiveSessionCode()),
      ])
      if (participants?.length || quizResults?.length) {
        await insertSessionHistory({
          sessionCode: getActiveSessionCode() + '_' + Date.now(),
          sessionDate: new Date().toISOString(),
          trainerName: localStorage.getItem('trainer_name') || 'Formateur',
          participants: participants || [],
          quizResults: quizResults || [],
          scenarioResponses: responses || [],
        })
      }
      await Promise.all([
        sbDelete('participants', 'session_code=eq.' + getActiveSessionCode()),
        sbDelete('scenario_responses', 'session_code=eq.' + getActiveSessionCode()),
        sbDelete('quiz_results', 'session_code=eq.' + getActiveSessionCode()),
      ])
      await sbUpdate('sessions', { current_step: -1 }, 'code=eq.' + getActiveSessionCode())
      onToast('Session enregistrée ✓')
      onBack()
    } catch {
      onToast('Erreur lors de la clôture — réessayez')
    }
  }

  return (
    <div id="tv">
      <div className="tlayout">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="stitle">Déroulé</div>
          {STEP_NAMES.map((name, i) => (
            <div
              key={i}
              className={`sitem ${curStep === i ? 'active' : ''}`}
              onClick={() => !lobbyActive && trainerGo(i)}
            >
              <div className="snum">{i + 1}</div>
              <div>
                <div className="slabel">{name}</div>
                <div className="sdur">{['~10 min', '~15 min', '~15 min', '~20 min', '~10 min'][i]}</div>
              </div>
            </div>
          ))}
          <div className="ssep"></div>
          <div className="stitle">Participants</div>
          <ParticipantList sessionCode={getActiveSessionCode()} />
        </div>

        {/* Main */}
        <div className="tmain">
          {/* Lobby */}
          {lobbyActive && (
            <div id="tc-lobby">
              <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center', padding: 40, background: '#111111', borderRadius: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
                <h2 style={{ fontSize: 24, fontWeight: 600, color: '#ffffff', marginBottom: 8 }}>Prêt à lancer la session ?</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>Les participants voient la page d'accueil et attendent votre signal.</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--green-l)', color: 'var(--green-d)', padding: '8px 20px', borderRadius: 20, fontSize: 14, fontWeight: 500, marginBottom: 32 }}>
                  <div className="odot"></div>
                  <span>{participantCount} participant(s) connecté(s)</span>
                </div>
                <br />
                <button className="btn1" style={{ padding: '14px 40px', fontSize: 16, borderRadius: 12 }} onClick={launchFormation}>
                  Lancer la formation →
                </button>
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={onBack}
                    style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,.7)', cursor: 'pointer', padding: '8px 16px', marginTop: 4 }}
                  >
                    ← Retour aux modules
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nav bar when session active */}
          {!lobbyActive && (
            <div className="tnavbar">
              <button
                onClick={onBack}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,.2)', borderRadius: 6, fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,.6)', cursor: 'pointer', padding: '6px 12px', flexShrink: 0 }}
              >
                ⌂ Dashboard
              </button>
              <p style={{ color: '#ffffff' }}>📡 Diffusion : <strong>{curStep >= 0 ? STEP_NAMES[curStep] : '—'}</strong></p>
              <div className="btnrow">
                <button className="btn2" onClick={() => trainerGo(curStep - 1)} style={{ opacity: curStep === 0 ? .3 : 1 }}>← Préc.</button>
                <button className="btn1" onClick={() => curStep === 4 ? endSession() : trainerGo(curStep + 1)}>
                  {curStep === 4 ? 'Fin ✓' : 'Suivant →'}
                </button>
              </div>
            </div>
          )}

          {/* Step 0 — Quiz initial */}
          {!lobbyActive && curStep === 0 && (
            <div>
              <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: 20, fontWeight: 600 }}>Phase 1 — Quiz initial</h2><p style={{ fontSize: 13, color: 'var(--text-s)', marginTop: 4 }}>Les participants répondent seuls. Les réponses s'affichent ici en temps réel.</p></div>
              <div className="tcard"><h3>💡 Note formateur</h3>
                <ul className="notes-list">
                  <li>Ce quiz sert à mesurer le niveau <strong>avant</strong> la formation</li>
                  <li>Ne donnez pas les réponses, ne commentez pas</li>
                  <li>Attendez que tout le monde ait terminé avant de passer à la suite</li>
                </ul>
              </div>
              <div className="tcard"><h3>📊 Réponses en temps réel</h3>
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-m)', marginBottom: 4 }}>Question {i + 1}</div>
                    <ResponseFeed sessionCode={getActiveSessionCode()} scenarioIdx={20 + i} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1 — Les bases (Slides) */}
          {!lobbyActive && curStep === 1 && (
            <div>
              <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: 20, fontWeight: 600 }}>Phase 2 — Les bases du verre progressif</h2><p style={{ fontSize: 13, color: 'var(--text-s)', marginTop: 4 }}>Présentez les slides. Les participants voient la même image sur leur écran.</p></div>
              <SlideViewer sessionCode={getActiveSessionCode()} curSlide={curSlide} onPrev={prevSlide} onNext={nextSlide} />
            </div>
          )}

          {/* Step 2 — Arguments & Offre */}
          {!lobbyActive && curStep === 2 && (
            <div>
              <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: 20, fontWeight: 600 }}>Phase 3 — Arguments & Offre</h2><p style={{ fontSize: 13, color: 'var(--text-s)', marginTop: 4 }}>Les participants voient les arguments et offres LPT sur leur écran.</p></div>
              <div className="tcard"><h3>💡 Note formateur</h3>
                <ul className="notes-list">
                  <li>Faites citer les 5 arguments par les participants AVANT d'afficher</li>
                  <li>Insistez sur la Garantie Adaptation 100 jours</li>
                  <li>Expliquez la différence entre l'offre 100% Santé et l'offre 1=1</li>
                </ul>
              </div>
              <div className="tcard" style={{ marginTop: 14 }}>
                <h3>📊 Réponses scénario</h3>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-m)', marginBottom: 4 }}>Scénario {i + 1}</div>
                    <ResponseFeed sessionCode={getActiveSessionCode()} scenarioIdx={i} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3 — Ordonnances */}
          {!lobbyActive && curStep === 3 && (
            <div>
              <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: 20, fontWeight: 600 }}>Phase 4 — Ordonnances pratiques</h2><p style={{ fontSize: 13, color: 'var(--text-s)', marginTop: 4 }}>Les participants analysent chaque ordonnance et envoient leurs réponses.</p></div>
              <div className="tcard"><h3>💡 Note formateur</h3>
                <ul className="notes-list">
                  <li>Laissez les participants analyser, puis débattez ensemble</li>
                  <li>Chaque ordonnance a un contexte spécifique — lisez l'énoncé</li>
                </ul>
              </div>
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="tcard" style={{ marginTop: 14 }}>
                  <h3>Scénario {n}</h3>
                  <ResponseFeed sessionCode={getActiveSessionCode()} scenarioIdx={n - 1} />
                </div>
              ))}
            </div>
          )}

          {/* Step 4 — Quiz final */}
          {!lobbyActive && curStep === 4 && (
            <div>
              <div style={{ marginBottom: 20 }}><h2 style={{ fontSize: 20, fontWeight: 600 }}>Phase 5 — Quiz final</h2><p style={{ fontSize: 13, color: 'var(--text-s)', marginTop: 4 }}>Les participants répondent au quiz final. Les scores s'affichent ici.</p></div>
              <div className="tcard"><h3>🏆 Résultats en temps réel</h3>
                <QuizResults sessionCode={getActiveSessionCode()} />
              </div>
              <div className="tcard" style={{ marginTop: 14 }}>
                <h3>💡 Note formateur</h3>
                <ul className="notes-list">
                  <li>Attendez que tous aient terminé et clôturé leur session</li>
                  <li>Cliquez sur "Fin ✓" pour terminer et enregistrer la session</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
