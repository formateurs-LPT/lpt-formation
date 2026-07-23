'use client'
import { useState, useEffect, useRef } from 'react'
import { sbSelect, sbUpsert, sbUpdate, getParticipantSessionCode, ensureSession, getSharedState } from '@/lib/supabase'
import { fetchOnlineParticipantCount } from '@/lib/participantPresence'
import { useParticipantPresence } from '@/lib/useParticipantPresence'
import { saveScenarioResponse } from '@/lib/formationSave'
import { TRAINER_AVATARS } from '@/lib/constants'
import { PLANNING_JOURS } from '@/lib/planningData'
import Image from 'next/image'
import ParticipantModuleView, { FAQInputMobile } from '@/components/ParticipantModuleView'
import { PeerQuizParticipant } from '@/components/PeerQuizGame'
import AutoEvalParticipant from '@/components/AutoEvalParticipant'

const QUIZ10 = [
  { q: 'Quel trouble visuel fait que les verres progressifs sont utiles au quotidien ?', opts: ['La myopie', 'La presbytie', "L'astigmatisme", "L'hypermétropie"], correct: 1, kind: 'standard' },
  { q: 'À partir de quel âge en moyenne peut-on devenir presbyte ?', opts: ['20 ans', '30 ans', '40 ans', '50 ans'], correct: 2, kind: 'standard' },
  { q: 'Ce client est presbyte.', opts: ['Vrai', 'Faux'], correct: 0, kind: 'prescription' },
  { q: 'Pour un presbyte, quel type de verres est le plus adapté ?', opts: ['Unifocal VL/VP', 'Progressif'], correct: 1, kind: 'standard' },
  { q: 'Sélectionnez le schéma correspondant au verre progressif.', opts: ['Schéma 1', 'Schéma 2', 'Schéma 3'], correct: 1, kind: 'lens' },
  { q: "Comment appelle-t-on les zones sur les extrémités du verre ?", opts: ['Zones périphériques', 'Transition', 'Aberrations'], correct: 2, kind: 'standard' },
  { q: "Quel aspect de nos verres chez LPT permet une vision extra-large ?", opts: ["Zones d'aberrations réduites", "Zones d'aberrations importantes"], correct: 0, kind: 'standard' },
  { q: "Quelle est l'étendue du champ de vision extra-large ?", opts: ['90 degrés', '120 degrés', '180 degrés'], correct: 2, kind: 'standard' },
  { q: "Quelle est la durée de garantie sur nos verres progressifs ?", opts: ['10 jours', '100 jours', '30 jours'], correct: 1, kind: 'standard' },
  { q: "En seconde paire, que proposez vous comme type de verre à un client presbyte faisant beaucoup d'ordinateur ?", opts: ['Progressif', 'Unifocal VP', 'Unifocal VL', 'Proximité'], correct: 3, kind: 'standard' },
]

const QUIZ10_FEEDBACK = [
  ['✓ Exact ! Les verres progressifs sont particulièrement utiles pour la presbytie.', '✗ La bonne réponse est : la presbytie.'],
  ['✓ Exact ! La presbytie apparaît en moyenne autour de 40 ans.', '✗ En moyenne, la presbytie apparaît autour de 40 ans.'],
  ['✓ Exact ! Cette ordonnance correspond bien à une vision de près chez un client presbyte.', '✗ La bonne réponse est : vrai.'],
  ['✓ Exact ! Le progressif est le verre le plus adapté pour voir à plusieurs distances.', '✗ La bonne réponse est : progressif.'],
  ['✓ Exact ! Le bon schéma présente VL en haut, VI au milieu et VP en bas.', '✗ Le bon schéma est celui avec VL en haut, VI au milieu et VP en bas.'],
  ["✓ Exact ! Ce sont les zones d'aberration.", "✗ La bonne réponse est : aberrations."],
  ['✓ Exact ! Des zones réduites permettent une vision extra-large.', '✗ La bonne réponse est : zone réduite.'],
  ['✓ Exact ! Le champ de vision extra-large est présenté à 180 degrés.', '✗ La bonne réponse est : 180 degrés.'],
  ['✓ Exact ! La garantie est de 100 jours.', '✗ La bonne réponse est : 100 jours.'],
  ["✓ Exact ! Pour un usage ordinateur important, le verre de proximité est le plus adapté.", '✗ La meilleure réponse est : proximité.'],
]

const LENS_SCHEMAS = [
  { labels: ['VP', 'VI', 'VL'], src: '/assets/lens_schema_1.png' },
  { labels: ['VL', 'VI', 'VP'], src: '/assets/lens_schema_2.png' },
  { labels: ['VI', 'VP', 'VL'], src: '/assets/lens_schema_3.png' },
]

function QuizQuestion({ q, qIdx, prefix, answers, onAnswer }) {
  const answered = answers[qIdx] !== undefined
  const chosen = answers[qIdx]

  return (
    <div className="quiz-q">
      <p className="quiz-qtext">{qIdx + 1}. {q.q}</p>
      {q.kind === 'prescription' && (
        <div style={{ margin: '12px 0 14px', padding: 16, borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 8px 20px rgba(15,23,42,.08)', maxWidth: 480 }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: '.12em', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 }}>Vision de près</div>
          <div style={{ display: 'grid', gap: 8, fontSize: 15, color: '#0f172a', lineHeight: 1.5 }}>
            <div><strong>OD :</strong> +4,50 (-0,50) 80°</div>
            <div><strong>OG :</strong> +5,00 (-0,50) 160°</div>
          </div>
        </div>
      )}
      <div className="quiz-opts" style={q.kind === 'lens' ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 12 } : {}}>
        {q.opts.map((opt, i) => {
          let cls = 'quiz-obtn'
          if (answered) {
            if (i === q.correct) cls += ' correct'
            else if (i === chosen && chosen !== q.correct) cls += ' wrong'
            else cls += ' disabled'
          }
          if (q.kind === 'lens') {
            const schema = LENS_SCHEMAS[i]
            return (
              <button key={i} className={cls + ' lens-choice'} onClick={() => !answered && onAnswer(qIdx, i)}
                style={{ padding: '12px 10px', justifyContent: 'center', minHeight: 'unset', background: '#ffffff' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: '100%' }}>
                  <img src={schema.src} alt={opt} style={{ width: '100%', maxWidth: 205, height: 'auto', objectFit: 'contain' }} />
                  <div style={{ fontSize: 12, color: 'var(--text-m)', fontWeight: 800 }}>{opt}</div>
                </div>
              </button>
            )
          }
          return (
            <button key={i} className={cls} onClick={() => !answered && onAnswer(qIdx, i)}>
              <span className="qletter">{'ABCD'[i]}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {answered && (
        <div className={`quiz-fb show ${chosen === q.correct ? 'ok' : 'ko'}`}>
          {QUIZ10_FEEDBACK[qIdx][chosen === q.correct ? 0 : 1]}
        </div>
      )}
    </div>
  )
}

function QuizView({ pName, mode, sessionCode }) {
  const isFinal = mode === 'final'
  const [answers, setAnswers] = useState({})
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
  const [initialScore, setInitialScore] = useState(null)
  const [closed, setClosed] = useState(false)

  const handleAnswer = async (qIdx, optIdx) => {
    if (answers[qIdx] !== undefined) return
    const isOk = optIdx === QUIZ10[qIdx].correct
    const newAnswers = { ...answers, [qIdx]: optIdx }
    const newScore = score + (isOk ? 1 : 0)
    setAnswers(newAnswers)
    setScore(newScore)

    const saved = await saveScenarioResponse({
      sessionCode,
      scenarioIdx: 20 + qIdx,
      participantName: pName,
      response: QUIZ10[qIdx].opts[optIdx],
    })
    if (!saved) console.error('[QuizView] échec enregistrement Q', qIdx + 1)

    if (Object.keys(newAnswers).length === QUIZ10.length && !done) {
      setDone(true)
      await ensureSession()
      if (!isFinal) {
        await sbUpsert('quiz_results', {
          session_code: sessionCode,
          participant_name: pName,
          score: 0,
          answers: { initial_score: newScore, initial_answers: newAnswers },
          completed_at: new Date().toISOString()
        }, 'session_code,participant_name')
      } else {
        const initData = await sbSelect('quiz_results', `session_code=eq.${sessionCode}&participant_name=eq.${encodeURIComponent(pName)}`)
        const existingAnswers = initData?.[0]?.answers || {}
        const initScore = existingAnswers.initial_score ?? null
        setInitialScore(initScore)
        await sbUpdate('quiz_results', {
          score: newScore,
          answers: {
            ...existingAnswers,
            final_score: newScore,
            final_answers: newAnswers,
            participant_closed: false
          },
          completed_at: new Date().toISOString()
        }, `session_code=eq.${sessionCode}&participant_name=eq.${encodeURIComponent(pName)}`)
      }
    }
  }

  const closeSession = async () => {
    await sbUpdate('quiz_results', {
      answers: {
        final_score: score,
        final_answers: answers,
        participant_closed: true,
        closed_at: new Date().toISOString()
      }
    }, `session_code=eq.${sessionCode}&participant_name=eq.${encodeURIComponent(pName)}`)
    setClosed(true)
  }

  const pct = score / 10
  const msg = pct === 1 ? '🎉 Score parfait !' : pct >= .8 ? '👍 Excellent !' : pct >= .6 ? '💪 Bon travail !' : '📚 Continuez à apprendre !'

  return (
    <div className="pcard">
      <div className="phead">
        <h2>{isFinal ? 'Quiz final' : 'Quiz initial'}</h2>
        <p>{isFinal ? 'Mêmes questions qu\'au début — mesurez votre progression.' : 'Répondez seul — pas de pression, c\'est pour mesurer votre niveau de départ.'}</p>
      </div>
      <div className="pbody">
        {!isFinal && (
          <div style={{ background: 'var(--orange-l)', borderRadius: 'var(--rs)', padding: '12px 14px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
            ⚠️ Répondez sans aide extérieure. Vos réponses seront comparées avec le quiz final.
          </div>
        )}
        <div style={{ display: 'grid', gap: 16 }}>
          {QUIZ10.map((q, i) => (
            <QuizQuestion key={i} q={q} qIdx={i} prefix={isFinal ? 'qf' : 'qi'} answers={answers} onAnswer={handleAnswer} />
          ))}
        </div>
        {done && (
          <div className="score-box show">
            <div className="sbig">{score}/10</div>
            <div className="smsg">{msg}</div>
            {isFinal && typeof initialScore === 'number' && (
              <div className="compare-scores" style={{ display: 'grid', marginTop: 16 }}>
                <div className="cscore before"><div className="cscore-val">{initialScore}/10</div><div className="cscore-label">Score initial</div></div>
                <div className="cscore after"><div className="cscore-val">{score}/10</div><div className="cscore-label">Score final</div></div>
              </div>
            )}
            {isFinal && !closed && (
              <button onClick={closeSession} style={{ marginTop: 22, width: '100%', padding: '14px 18px', border: 'none', borderRadius: 14, background: '#111111', color: 'white', fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                Clôturer ma session
              </button>
            )}
            {isFinal && closed && (
              <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 12, background: '#dcfce7', color: '#166534', fontSize: 13, fontWeight: 700 }}>
                ✓ Session clôturée — vos résultats ont été envoyés au formateur
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function P1Slides({ trainerName, slideNum }) {
  const avatarSrc = TRAINER_AVATARS[(trainerName || '').toLowerCase()] || '/assets/avatar_kevin.png'
  return (
    <div className="pcard">
      <div className="phead participant-head-with-avatar">
        <div className="participant-head-text">
          <h2>Les bases du verre progressif</h2>
          <p>Suivez les slides présentées par votre formateur</p>
          <div className="trainer-head-pill">Formateur en direct</div>
        </div>
        <div className="trainer-head-avatar-wrap">
          <img id="trainer-avatar-img" className="trainer-head-avatar" src={avatarSrc} alt="Formateur" />
        </div>
      </div>
      <div className="pbody">
        <div style={{ position: 'relative', borderRadius: 'var(--rs)', overflow: 'hidden', background: '#0a0f1e' }}>
          <img
            id="p-slide-img"
            src={`/slides/slide${slideNum}.jpg`}
            alt={`Slide ${slideNum}`}
            style={{ width: '100%', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <div id="p-slide-counter" style={{ position: 'absolute', bottom: 10, right: 12, background: 'rgba(0,0,0,.6)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 12 }}>
            {slideNum} / 6
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-s)', marginTop: 12, textAlign: 'center' }}>Le formateur fait défiler les slides — suivez attentivement</p>
      </div>
    </div>
  )
}

function P2Arguments() {
  const args = ["Zones d'aberrations réduites", 'Vision extra large à 180°', 'Offre une vision naturelle au quotidien', 'Adaptation immédiate', 'Garantie Adaptation de 100 jours — satisfait ou échangé']
  return (
    <div className="pcard">
      <div className="phead"><h2>Arguments & Offre LPT</h2><p>Les arguments de vente et notre positionnement</p></div>
      <div className="pbody">
        <div className="section-tag">🏆 Arguments de vente</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {args.map((a, i) => (
            <div key={i} style={{ background: 'var(--lpt-ll)', border: '1px solid #b3e5f8', borderRadius: 'var(--rs)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--lpt)', color: '#fff', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              {a}
            </div>
          ))}
        </div>
        <div className="section-tag">💊 Nos offres</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: '2px solid var(--lpt)', borderRadius: 'var(--r)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lpt)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Offre 100% Santé</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>2 paires à 0€</div>
            <p style={{ fontSize: 13, color: 'var(--text-s)', lineHeight: 1.6 }}>Première paire remboursée intégralement parmi nos 400 montures + verres progressifs nouvelle génération avec tous les traitements inclus. Deuxième paire offerte avec la même qualité, même en solaire.</p>
          </div>
          <div style={{ background: '#fff', border: '2px solid var(--lpt-d)', borderRadius: 'var(--r)', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--lpt-d)', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Offre 1=1</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>2 paires pour ~260€</div>
            <p style={{ fontSize: 13, color: 'var(--text-s)', lineHeight: 1.6 }}>Première paire parmi nos 400 montures + verres progressifs nouvelle génération tous traitements inclus. Deuxième paire avec la même qualité, même en solaire.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function P3Ordonnances({ pName, sessionCode }) {
  const ordos = [
    { n: 1, src: '/ORDO1.png', title: 'Scénario 1', prompt: 'Le client vous dit ne pas vouloir de verres progressifs.', question: 'Que faites-vous ?' },
    { n: 2, src: '/ORDO2.png', title: 'Scénario 2', prompt: "Il s'agit d'une ordonnance pour des verres progressifs, mais le client vous dit ne pas avoir besoin de correction de loin. Il souhaite uniquement une VP.", question: 'Que faites-vous ?' },
    { n: 3, src: '/ORDO3.png', title: 'Scénario 3', prompt: 'Avec cette ordonnance, quels types de verres proposez-vous et dans quelle offre ?', question: '' },
    { n: 4, src: '/ORDO4.png', title: 'Scénario 4', prompt: "Cette ordonnance indique la réalisation d'un VL et d'une VP.", question: 'Quels types de verres proposez-vous et dans quelle offre ?' },
  ]
  const [texts, setTexts] = useState({ 1: '', 2: '', 3: '', 4: '' })
  const [sent, setSent] = useState({ 1: false, 2: false, 3: false, 4: false })

  const submitOrdo = async (n) => {
    const text = texts[n].trim()
    if (!text) return
    const saved = await saveScenarioResponse({
      sessionCode,
      scenarioIdx: n - 1,
      participantName: pName,
      response: text,
    })
    if (saved) setSent(s => ({ ...s, [n]: true }))
    else console.error('[Ordonnances] échec enregistrement scénario', n)
  }

  return (
    <div className="pcard">
      <div className="phead"><h2>Ordonnances pratiques</h2><p>Analysez chaque ordonnance présentée par le formateur</p></div>
      <div className="pbody">
        <div style={{ background: 'var(--orange-l)', borderRadius: 'var(--rs)', padding: '12px 14px', fontSize: 13, color: '#92400e', marginBottom: 18 }}>
          📋 Observez chaque ordonnance puis échangez avec le formateur.
        </div>
        <div style={{ display: 'grid', gap: 22 }}>
          {ordos.map(o => (
            <section key={o.n} style={{ border: '1px solid var(--border)', borderRadius: 16, background: '#fff', overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderBottom: '1px solid var(--border)', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>{o.title}</div>
              <div style={{ padding: '16px 16px 0', background: '#fff' }}>
                <div style={{ padding: '14px 16px', borderRadius: 14, background: '#f6f8fb', border: '1px solid #dfe6ee', color: 'var(--text)', lineHeight: 1.6 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 14 }}>{o.prompt}</p>
                  {o.question && <p style={{ margin: '0 0 6px', fontSize: 14 }}><strong>{o.question}</strong></p>}
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-s)' }}><em>Décrivez votre réponse en quelques lignes.</em></p>
                </div>
              </div>
              <div style={{ padding: 14, display: 'flex', justifyContent: 'center', background: '#fff' }}>
                <div style={{ width: '100%', maxWidth: 560 }}>
                  <img src={o.src} alt={`Ordonnance ${o.n}`} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', boxShadow: '0 8px 20px rgba(15,23,42,.08)', marginBottom: 16 }} />
                  <textarea
                    placeholder="Écrivez votre réponse ici..."
                    value={texts[o.n]}
                    onChange={e => setTexts(t => ({ ...t, [o.n]: e.target.value }))}
                    disabled={sent[o.n]}
                    style={{ width: '100%', minHeight: 140, padding: 14, borderRadius: 14, border: '1px solid #d7dce3', resize: 'vertical', fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5, outline: 'none', boxSizing: 'border-box', background: '#fff', marginBottom: 12 }}
                  />
                  {!sent[o.n] ? (
                    <button onClick={() => submitOrdo(o.n)} style={{ background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 12, padding: '12px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 14, boxShadow: '0 4px 10px rgba(14,165,233,.25)' }}>
                      Envoyer ma réponse
                    </button>
                  ) : (
                    <div style={{ padding: '10px 12px', borderRadius: 12, background: '#dcfce7', color: '#166534', fontSize: 13, fontWeight: 700 }}>
                      ✓ Réponse envoyée au formateur
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

function DisconnectButton({ prenom, onDisconnect }) {
  const [open, setOpen] = useState(false)
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''
  return (
    <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 20, padding: '7px 16px',
          color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', gap: 7,
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <span>👤</span>
        {cap(prenom) || 'Moi'}
      </button>
      {open && (
        <button
          onClick={onDisconnect}
          style={{
            background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.45)',
            borderRadius: 14, padding: '10px 18px',
            color: '#f87171', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          Se déconnecter
        </button>
      )}
    </div>
  )
}

export default function ParticipantView({ pName, pPrenom, onToast, onOnlineCount, onDisconnect }) {
  const sessionCode = getParticipantSessionCode()
  const [curStep, setCurStep] = useState(-2)
  const [curSlide, setCurSlide] = useState(1)
  const [ended, setEnded] = useState(false)
  const pNameRef = useRef(pName)
  useEffect(() => { pNameRef.current = pName }, [pName])

  useParticipantPresence({
    sessionCode,
    name: pName,
    enabled: !!sessionCode && !!pName && !ended,
    onSessionEnded: () => setEnded(true),
  })

  // Déconnexion automatique après 45 min d'inactivité (page en arrière-plan)
  useEffect(() => {
    if (!onDisconnect) return
    const TIMEOUT_MS = 45 * 60 * 1000
    let hiddenAt = null
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt = Date.now()
      } else if (hiddenAt !== null) {
        if (Date.now() - hiddenAt > TIMEOUT_MS) onDisconnect()
        hiddenAt = null
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [onDisconnect])
  const [trainerName, setTrainerName] = useState('kevin')
  const [activeModule, setActiveModule] = useState(null)
  const [modulePage, setModulePage] = useState(0)
  const [tvScreen, setTvScreen] = useState(null)
  const [planningDay, setPlanningDay] = useState(null)
  const [sharedState, setSharedState_] = useState(null)
  const [autoEvalDone, setAutoEvalDone] = useState(false)

  // Quand le formateur ré-envoie le questionnaire à ce formé, réinitialise autoEvalDone pour ré-afficher le formulaire
  useEffect(() => {
    if (!autoEvalDone) return
    const redo = sharedState?.auto_eval_redo_names
    const shouldRedo = Array.isArray(redo) ? redo.includes(pName) : redo === 'all'
    if (shouldRedo) setAutoEvalDone(false)
  }, [sharedState?.auto_eval_redo_names, pName, autoEvalDone])

  // Polling rapide : sans module, zone-interactif, lobby (-1), quiz (100-199) ou résultats (200)
  // → lent (5s) seulement pour les pages statiques d'un module (0-99 hors quiz)
  const isInteractive = !activeModule || activeModule === 'zone-interactif' || modulePage === -1 || modulePage >= 100
  const pollMs = isInteractive ? 1500 : 5000

  useEffect(() => {
    const poll = async () => {
      try {
        const sessions = await sbSelect('sessions', 'code=eq.' + sessionCode)
        if (sessions?.[0]) {
          if (sessions[0].status === 'ended') { setEnded(true); return }
          const step = Number(sessions[0].current_step)
          const slideNum = Number(sessions[0].active_scenario)
          const mod = sessions[0].active_module ?? null
          const modPage = sessions[0].module_page ?? 0
          setActiveModule(mod)
          setModulePage(modPage)
          if (step === -1 && curStep > 0) { setEnded(true); return }
          if (step >= 0 && step !== curStep) setCurStep(step)
          if (step === 1 && slideNum && slideNum !== curSlide) setCurSlide(slideNum)
        }
        const online = await fetchOnlineParticipantCount(sessionCode)
        onOnlineCount(online)
      } catch {}
    }
    poll()
    const interval = setInterval(poll, pollMs)
    return () => clearInterval(interval)
  }, [curStep, curSlide, pollMs, sessionCode, onOnlineCount])

  // Polling sharedState (trainer_state) — même cadence adaptative
  useEffect(() => {
    const pollPlanning = async () => {
      try {
        const state = await getSharedState(sessionCode)
        setTvScreen(state?.tv_screen || null)
        setPlanningDay(state?.planning_day || null)
        setSharedState_(state || null)
        // Force-disconnect déclenché par le formateur
        // Le signal est ignoré si le formé s'est reconnecté après le kick (joined_at > kickTimestamp)
        const curPName = pNameRef.current
        const kickTimestamp = Number(state?.forced_disconnects?.[curPName]) || 0
        const joinedAt = Number(localStorage.getItem('participant_joined_at')) || 0
        const kicked = kickTimestamp > joinedAt && Date.now() - kickTimestamp < 30 * 60 * 1000
        if (curPName && kicked) {
          onDisconnect?.()
          return
        }
      } catch {}
    }
    pollPlanning()
    const t = setInterval(pollPlanning, pollMs)
    return () => clearInterval(t)
  }, [pollMs])

  if (ended) {
    return (
      <div id="pv">
        <div className="pshell">
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Session terminée</h3>
            <p style={{ fontSize: 14, color: 'var(--text-s)' }}>Merci pour ta participation !<br />Tu peux fermer cet onglet.</p>
          </div>
        </div>
      </div>
    )
  }

  const prenom = pPrenom || (typeof window !== 'undefined' && localStorage.getItem('participant_prenom')) || pName?.split(' ')[0] || ''
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''

  const WaitScreen = () => (
    <>
      <style>{`@keyframes waitDotP { 0%,100%{opacity:.2} 50%{opacity:1} }`}</style>
      <div style={{
        minHeight: '100dvh',
        background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
        textAlign: 'center',
      }}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={160} height={60}
          style={{ objectFit: 'contain', marginBottom: 48 }} />

        {prenom ? (
          <>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              Bonjour {cap(prenom)} 👋
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#00abe9', marginBottom: 32 }}>
              Bienvenu chez Lunettes Pour Tous
            </div>
          </>
        ) : null}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.4)',
            animation: 'waitDotP 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
            En attente du formateur…
          </span>
        </div>
      </div>
    </>
  )

  // Planning prioritaire : affiché dès que le formateur diffuse, peu importe l'état
  if (tvScreen === 'planning' && planningDay) {
    const jour = PLANNING_JOURS.find(j => j.id === planningDay)
    if (jour) return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', display: 'flex', flexDirection: 'column', padding: '32px 20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain', opacity: 0.7 }} />
          <div style={{ background: `${jour.color}20`, border: `1px solid ${jour.color}50`, borderRadius: 20, padding: '4px 14px', fontSize: 11, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1 }}>{jour.jour}</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 6 }}>{jour.label}</div>
          <div style={{ width: 40, height: 3, borderRadius: 2, background: jour.color }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
          {jour.blocs.map((bloc, i) => {
            const isPause = bloc.titre === 'Pause déjeuner'
            if (isPause) return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.3)' }} />
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 20, padding: '5px 16px', fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 1, whiteSpace: 'nowrap' }}>
                  {bloc.horaire && <span style={{ opacity: 0.7, marginRight: 8 }}>{bloc.horaire}</span>}Pause déjeuner
                </div>
                <div style={{ flex: 1, height: 1, background: 'rgba(245,158,11,0.3)' }} />
              </div>
            )
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderTop: `2px solid ${jour.color}`, borderRadius: 14, padding: '16px 16px' }}>
                {bloc.horaire && <div style={{ fontSize: 10, fontWeight: 700, color: jour.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{bloc.horaire}</div>}
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: bloc.items.length > 0 ? 10 : 0 }}>{bloc.titre}</div>
                {bloc.items.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {bloc.items.map((item, j) => (
                      <div key={j} style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.09)',
                        borderLeft: `2px solid ${jour.color}60`,
                        borderRadius: 8, padding: '7px 12px',
                        fontSize: 12, color: 'rgba(255,255,255,0.75)',
                        fontWeight: 500, lineHeight: 1.4,
                      }}>{item}</div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const disconnectChip = onDisconnect ? (
    <DisconnectButton prenom={pPrenom || pName?.split(' ').pop() || ''} onDisconnect={onDisconnect} />
  ) : null

  // Si un module est actif, on prend le dessus sur tout le reste
  if (activeModule) return (
    <>
      {disconnectChip}
      <ParticipantModuleView forcedModule={activeModule} forcedPage={modulePage} pName={pName} sharedState={sharedState} onDisconnect={onDisconnect} />
    </>
  )

  // Jeu de questions entre formés — uniquement si le formateur l'a lancé explicitement
  if (sharedState?.tv_screen === 'peer-quiz' && sharedState?.pq_phase) return (
    <PeerQuizParticipant sharedState={sharedState} pName={pName} sessionCode={sessionCode} />
  )

  // Auto-évaluation fin de formation
  if (sharedState?.tv_screen === 'auto-eval' && !autoEvalDone) return (
    <AutoEvalParticipant pName={pName} sharedState={sharedState} sessionCode={sessionCode} onDone={() => setAutoEvalDone(true)} />
  )

  // Si une FAQ est active (réveil des acquis)
  if (sharedState?.faq_journee) return <FAQInputMobile journeeId={sharedState.faq_journee} />

  return (
    <div id="pv">
      {disconnectChip}
      <div className="pshell">
        <WaitScreen />
      </div>
    </div>
  )
}
