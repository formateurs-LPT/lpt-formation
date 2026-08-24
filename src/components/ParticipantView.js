'use client'
import { useState, useEffect, useRef } from 'react'
import { sbSelect, getParticipantSessionCode, getSharedState } from '@/lib/supabase'
import { fetchOnlineParticipantCount } from '@/lib/participantPresence'
import { useParticipantPresence } from '@/lib/useParticipantPresence'
import { PLANNING_JOURS } from '@/lib/planningData'
import Image from 'next/image'
import ParticipantModuleView, { FAQInputMobile, MiniJeuObserverView, ParticipantDashboard } from '@/components/ParticipantModuleView'
import { PeerQuizParticipant } from '@/components/PeerQuizGame'
import { FreeQuizParticipant } from '@/components/FreeQuizGame'
import AutoEvalParticipant from '@/components/AutoEvalParticipant'
import { QuestionsGameParticipantView } from '@/components/QuestionsGamePanel'
import { extractPrenom } from '@/lib/participantNames'
import { ENTRAINEMENT_QUESTIONS, ENTRAINEMENT_QUESTIONS_J2 } from '@/lib/modulesData'

function DisconnectButton({ prenom, onDisconnect }) {
  const [open, setOpen] = useState(false)
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : ''
  return (
    <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 20, padding: '10px 16px', minHeight: 40,
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
    // Le téléphone se verrouille/l'onglet passe en arrière-plan → iOS/Android
    // suspendent les setInterval. Sans ce re-poll immédiat au réveil, le
    // formé reste figé sur l'ancienne page tant que l'intervalle ne reprend
    // pas de lui-même (des minutes, parfois jamais sur iOS).
    const onVisible = () => { if (document.visibilityState === 'visible') poll() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [curStep, curSlide, pollMs, sessionCode, onOnlineCount])

  // Polling sharedState (trainer_state) — même cadence adaptative
  useEffect(() => {
    const pollPlanning = async () => {
      try {
        const state = await getSharedState(sessionCode)
        setTvScreen(state?.tv_screen || null)
        setPlanningDay(state?.planning_day || null)
        setSharedState_(state || null)
        // Force-disconnect déclenché par le formateur — dure toute la salle en
        // cours (pas d'expiration à 30 min, voir isKickActive dans
        // participantPresence.js). Le signal est ignoré uniquement si le formé
        // s'est reconnecté volontairement après le kick (joined_at > kickTimestamp).
        const curPName = pNameRef.current
        const kickTimestamp = Number(state?.forced_disconnects?.[curPName]) || 0
        const joinedAt = Number(localStorage.getItem('participant_joined_at')) || 0
        const kicked = kickTimestamp > joinedAt
        if (curPName && kicked) {
          onDisconnect?.()
          return
        }
      } catch {}
    }
    pollPlanning()
    const t = setInterval(pollPlanning, pollMs)
    const onVisible = () => { if (document.visibilityState === 'visible') pollPlanning() }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
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
    <DisconnectButton prenom={pPrenom || extractPrenom(pName) || ''} onDisconnect={onDisconnect} />
  ) : null

  // Si un module est actif, on prend le dessus sur tout le reste
  if (activeModule) return (
    <>
      {disconnectChip}
      <ParticipantModuleView forcedModule={activeModule} forcedPage={modulePage} pName={pName} sharedState={sharedState} onDisconnect={onDisconnect} />
    </>
  )

  // Mini-jeu "Questions" — même mécanique que l'entraînement oral de Bases de l'optique
  if (sharedState?.minijeu_game === 'questions') return (
    <>
      {disconnectChip}
      <QuestionsGameParticipantView
        pName={pName}
        moduleId="minijeu-questions"
        questionIdx={sharedState?.mjq_q}
        vfCorrect={sharedState?.mjq_vf_correct}
        clearTs={sharedState?.mjq_clear_ts}
        customQText={sharedState?.mjq_custom_q_text}
        questions={ENTRAINEMENT_QUESTIONS}
      />
    </>
  )

  // Mini-jeu "Questions Jour 2" — même mécanique, contenu Jour 2
  if (sharedState?.minijeu_game === 'questions-j2') return (
    <>
      {disconnectChip}
      <QuestionsGameParticipantView
        pName={pName}
        moduleId="minijeu-questions-j2"
        questionIdx={sharedState?.mjq2_q}
        vfCorrect={sharedState?.mjq2_vf_correct}
        clearTs={sharedState?.mjq2_clear_ts}
        customQText={sharedState?.mjq2_custom_q_text}
        questions={ENTRAINEMENT_QUESTIONS_J2}
      />
    </>
  )

  // Mini-jeu observer — les observateurs peuvent noter des remarques pendant le jeu de rôle
  if (sharedState?.minijeu_game && ['revealed', 'debrief'].includes(sharedState?.minijeu_phase)) {
    const isObserver = pName !== sharedState?.minijeu_vendeur && pName !== sharedState?.minijeu_client
    if (isObserver) return (
      <>
        {disconnectChip}
        <MiniJeuObserverView sharedState={sharedState} />
      </>
    )
  }

  // Jeu de questions entre formés — uniquement si le formateur l'a lancé explicitement
  if (sharedState?.tv_screen === 'peer-quiz' && sharedState?.pq_phase) return (
    <PeerQuizParticipant sharedState={sharedState} pName={pName} sessionCode={sessionCode} />
  )

  // Quiz réponses libres — le formateur pose une question, le formé répond sur son téléphone
  if (sharedState?.free_quiz_active && sharedState?.free_quiz_prompt) return (
    <FreeQuizParticipant sharedState={sharedState} pName={pName} />
  )

  // Auto-évaluation fin de formation
  if (sharedState?.tv_screen === 'auto-eval') {
    const autoEvalLaunched = Array.isArray(sharedState?.auto_eval_names)
      ? sharedState.auto_eval_names.includes(pName)
      : false
    if (autoEvalLaunched && !autoEvalDone) return (
      <AutoEvalParticipant pName={pName} sharedState={sharedState} sessionCode={sessionCode} onDone={() => setAutoEvalDone(true)} />
    )
    if (!autoEvalLaunched) return (
      <div style={{ minHeight: '100dvh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📋</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10 }}>Auto-évaluation</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Le formateur va vous envoyer le questionnaire dans quelques instants…
        </div>
      </div>
    )
  }

  // Si une FAQ est active (réveil des acquis)
  if (sharedState?.faq_journee) return <FAQInputMobile journeeId={sharedState.faq_journee} />

  return (
    <div id="pv">
      {disconnectChip}
      <div className="pshell">
        <ParticipantDashboard pName={pName} sessionCode={sessionCode} />
      </div>
    </div>
  )
}
