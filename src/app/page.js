'use client'
import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Topbar from '@/components/Topbar'
import Toast, { useToast } from '@/components/Toast'
import Dashboard from '@/components/Dashboard'
import TrainerView from '@/components/TrainerView'
import ParticipantView from '@/components/ParticipantView'
import { sbUpsert, sbUpdate, SESSION_CODE, getTrainerFromDB, ensureSession, getRuntimeSessionCode, getActiveSessionCode, setRoomSharedState, setSharedState } from '@/lib/supabase'
import { resolveParticipantName } from '@/lib/participantNames'
import { resolveParticipantSessionCode, participantJoinBlockedMessage } from '@/lib/participantSession'
import { canParticipantJoinSession, getCategoryJoinDeniedMessage } from '@/lib/formationCategories'
import { TRAINER_CANONICAL } from '@/lib/constants'
import { getTrainerCredentials } from '@/lib/env'
import { captureParticipantRoomFromUrl, captureTvRoomFromUrl, buildTvUrl, isDynamicRoomCode, setParticipantSessionCode, readParticipantSessionCode, getLegacySessionCode } from '@/lib/sessionCode'
import { touchParticipantPresence } from '@/lib/participantPresence'
import { useIsMobile } from '@/lib/useIsMobile'
import { endActiveRoom, getLiveTrainerRoomCode, trainerLoginFromDisplayName } from '@/lib/sessionRoom'
import { useOnlineCount } from '@/lib/useOnlineCount'
import ModuleTypesVerres from '@/components/modules/ModuleTypesVerres'
import ModuleProgressif from '@/components/modules/ModuleProgressif'
import ModulePDM from '@/components/modules/ModulePDM'
import ModuleOptique from '@/components/modules/ModuleOptique'
import ModuleOffres from '@/components/modules/ModuleOffres'
import ModuleEntreprise from '@/components/modules/ModuleEntreprise'
import ModuleTrameAccueil from '@/components/modules/ModuleTrameAccueil'
import ModuleReveilAcquis from '@/components/modules/ModuleReveilAcquis'
import ModuleMontures from '@/components/modules/ModuleMontures'
import ModuleMiniJeux from '@/components/modules/ModuleMiniJeux'
import ModuleQuizFinal from '@/components/modules/ModuleQuizFinal'
import ModuleQuizJ1 from '@/components/modules/ModuleQuizJ1'
import ModuleMutuelles from '@/components/modules/ModuleMutuelles'
import ModuleRemboursementFrance from '@/components/modules/ModuleRemboursementFrance'
import ModuleParcoursRembourses from '@/components/modules/ModuleParcoursRembourses'
import ModuleLptSante from '@/components/modules/ModuleLptSante'
import ModuleAtelierPEC from '@/components/modules/ModuleAtelierPEC'
import ModuleRetraits from '@/components/modules/ModuleRetraits'
import ModuleAjustages from '@/components/modules/ModuleAjustages'
import ModuleRAZ from '@/components/modules/ModuleRAZ'
import IdeesButton from '@/components/IdeesButton'
import TrainerQuestionsPanel from '@/components/TrainerQuestionsPanel'
import PlanningPage from '@/components/PlanningPage'
import OnboardingView from '@/components/OnboardingView'
import OnboardingViewBelgique from '@/components/OnboardingViewBelgique'
import PeerQuizTrainer from '@/components/PeerQuizGame'
import TVView from '@/components/TVView'
import ParticipantModuleView from '@/components/ParticipantModuleView'

export default function Page() {
  const isMobile = useIsMobile(640)
  const [view, setView] = useState('landing') // landing | dashboard | trainer-session | participant | module-types-verres
  const [pName, setPName] = useState('')
  const [pPrenom, setPPrenom] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [mode, setMode] = useState(null)
  const [appReady, setAppReady] = useState(false)
  const [displaySessionCode, setDisplaySessionCode] = useState('')
  const [returnJournee, setReturnJournee] = useState(null)
  const [moduleReturnTo, setModuleReturnTo] = useState('onboarding-modules')
  const [returnJourneeBelgique, setReturnJourneeBelgique] = useState(null)
  const [peerQuizReturnView, setPeerQuizReturnView] = useState('onboarding-modules')
  const { message, toast } = useToast()

  useOnlineCount({
    enabled: appReady && isTrainer && ['dashboard', 'trainer-session', 'onboarding-modules'].includes(view),
    onCount: setOnlineCount,
  })

  const restoreParticipantSession = async () => {
    const savedName = localStorage.getItem('participant_name')
    if (!savedName) return null

    const resolved = await resolveParticipantName(savedName)
    if (!resolved.ok) {
      localStorage.removeItem('participant_name')
      localStorage.removeItem('participant_prenom')
      setParticipantSessionCode('')
      return null
    }

    const roomResolved = await resolveParticipantSessionCode(resolved.entry)
    if (!roomResolved.ok) {
      localStorage.removeItem('participant_name')
      localStorage.removeItem('participant_prenom')
      setParticipantSessionCode('')
      return null
    }

    const sessionCode = roomResolved.code
    const session = roomResolved.session
    if (!canParticipantJoinSession(session, resolved.entry)) {
      localStorage.removeItem('participant_name')
      localStorage.removeItem('participant_prenom')
      setParticipantSessionCode('')
      return null
    }

    try {
      await ensureSession(sessionCode)
      await touchParticipantPresence(sessionCode, savedName)
    } catch (e) {
      console.warn('participant restore failed:', e)
    }

    return {
      name: savedName,
      prenom: localStorage.getItem('participant_prenom') || '',
      sessionCode,
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlMode = params.get('mode')
    const joinFromQr = params.get('join') === '1' || params.get('code')

    const finishBootstrap = async () => {
      let savedTrainer = null

      if (urlMode === 'tv' || urlMode === 'participant') {
        setMode(urlMode)
        if (urlMode === 'participant') {
          const restored = await restoreParticipantSession()
          if (restored) {
            setPName(restored.name)
            setPPrenom(restored.prenom)
            setIsTrainer(false)
            setDisplaySessionCode(restored.sessionCode)
          }
        }
      } else {
        savedTrainer = localStorage.getItem('trainer_name')
        if (savedTrainer) {
          setPName(savedTrainer)
          setIsTrainer(true)
          setView('dashboard')
        } else if (joinFromQr || readParticipantSessionCode()) {
          const restored = await restoreParticipantSession()
          if (restored) {
            setPName(restored.name)
            setPPrenom(restored.prenom)
            setIsTrainer(false)
            setDisplaySessionCode(restored.sessionCode)
            setView('participant')
          }
        }
      }

      captureParticipantRoomFromUrl()
      captureTvRoomFromUrl()
      if (savedTrainer) {
        const code = await getLiveTrainerRoomCode(trainerLoginFromDisplayName(savedTrainer), savedTrainer)
        setDisplaySessionCode(code || getLegacySessionCode())
      } else if (urlMode !== 'participant') {
        setDisplaySessionCode(getRuntimeSessionCode('participant') || getLegacySessionCode())
      }
      setAppReady(true)
    }

    finishBootstrap()
  }, [])

  useEffect(() => {
    if (!appReady || !isTrainer || view === 'landing') return

    let cancelled = false
    const syncTrainerRoom = async () => {
      const code = await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName)
      if (!cancelled) setDisplaySessionCode(code || getLegacySessionCode())
    }
    syncTrainerRoom()
    return () => { cancelled = true }
  }, [view, appReady, isTrainer, pName])

  const handleTrainerLogin = async (id, code) => {
    const idRaw = id.trim().toLowerCase()
    const normalized = TRAINER_CANONICAL[idRaw] || idRaw
    if (!normalized) { toast('Entrez votre identifiant'); return }

    const pin = code.trim()
    // Vérification du PIN via .env (comme avant) — pin_hash en BDD est bcrypt, non vérifiable côté navigateur
    let trainers = {}
    try {
      trainers = getTrainerCredentials()
    } catch {
      toast('Configuration formateur manquante (.env)'); return
    }
    if (!trainers[normalized]) { toast('Identifiant inconnu'); return }
    if (trainers[normalized] !== pin) { toast('Code incorrect'); return }

    const dbTrainer = await getTrainerFromDB(normalized)
    const name = dbTrainer?.display_name
      || normalized.charAt(0).toUpperCase() + normalized.slice(1)
    setPName(name)
    setIsTrainer(true)
    localStorage.setItem('trainer_name', name)
    localStorage.removeItem('participant_name')
    localStorage.removeItem('participant_prenom')
    setParticipantSessionCode('')
    try {
      await sbUpsert('sessions', { code: SESSION_CODE, current_step: -1, active_scenario: 0 }, 'code')
      await sbUpdate('sessions', { current_step: -1, active_module: null, module_page: 0 }, 'code=eq.' + SESSION_CODE)
    } catch (e) {
      console.warn('Supabase session init failed (non-blocking):', e)
    }
    const roomCode = await getLiveTrainerRoomCode(normalized, name)
    setDisplaySessionCode(roomCode || getLegacySessionCode())
    setView('dashboard')
  }

  const handleParticipantJoin = async (nom, prenom) => {
    const nomT = (nom || '').trim()
    const prenomT = (prenom || '').trim()
    if (!nomT || !prenomT) {
      toast('Entrez votre nom et votre prénom')
      return
    }
    const raw = `${nomT} ${prenomT}`

    const resolved = await resolveParticipantName(raw)
    if (!resolved.ok) {
      if (resolved.reason === 'no_session_code') {
        toast('Application mal configurée (code session manquant). Contactez le formateur.')
      } else if (resolved.reason === 'no_list') {
        toast('Liste RH indisponible. Le formateur doit importer « Entrées de la semaine ».')
      } else if (resolved.reason === 'need_full_name') {
        toast('Saisissez nom et prénom (comme sur la ligne bleue « Connexion : … »).')
      } else if (resolved.reason === 'ambiguous_prenom') {
        toast('Plusieurs personnes portent ce prénom — précisez aussi votre nom de famille.')
      } else {
        toast('Nom non reconnu. Vérifiez nom et prénom comme sur « Connexion : … » (Entrées de la semaine).')
      }
      return
    }

    const roomResolved = await resolveParticipantSessionCode(resolved.entry)
    if (!roomResolved.ok) {
      toast(participantJoinBlockedMessage(roomResolved.reason, roomResolved.message))
      return
    }
    if (roomResolved.autoPicked) {
      toast(`Connexion à la salle ${roomResolved.code}`)
    }

    const sessionCode = roomResolved.code
    const session = roomResolved.session
    if (session?.status === 'ended') {
      toast('Cette session est terminée.')
      return
    }

    if (!canParticipantJoinSession(session, resolved.entry)) {
      toast(getCategoryJoinDeniedMessage(session, resolved.entry))
      return
    }

    const canonical = resolved.canonicalName
    const prenomDisplay = resolved.prenom || prenomT || ''
    setPName(canonical)
    setPPrenom(prenomDisplay)
    setIsTrainer(false)
    localStorage.setItem('participant_name', canonical)
    localStorage.setItem('participant_prenom', prenomDisplay)
    localStorage.setItem('participant_joined_at', Date.now().toString())
    setParticipantSessionCode(sessionCode)
    try {
      await ensureSession(sessionCode)
      await sbUpsert('participants', {
        session_code: sessionCode,
        name: canonical,
        joined_at: new Date().toISOString(),
        left_at: null,
        last_seen_at: new Date().toISOString(),
      }, 'session_code,name')
    } catch (e) {
      console.warn('Supabase participant upsert failed (non-blocking):', e)
    }
    setDisplaySessionCode(sessionCode)
    setView('participant')
  }

  const handleLogout = () => {
    setIsTrainer(false)
    setPName('')
    localStorage.removeItem('trainer_name')
    setView('landing')
  }

  const handleParticipantDisconnect = () => {
    localStorage.removeItem('participant_name')
    localStorage.removeItem('participant_prenom')
    setPName('')
    setPPrenom('')
    setView('landing')
    setMode(null)
  }

  const handleEndRoom = async (roomCodeHint) => {
    const code = (roomCodeHint || '').trim()
      || (await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName), pName))
      || getActiveSessionCode()
    const result = await endActiveRoom(code, { trainerName: pName })
    if (result?.ok) {
      toast(result.archived ? 'Salle terminée et archivée ✓' : 'Salle terminée ✓')
      setDisplaySessionCode(getLegacySessionCode())
      setView('dashboard')
    } else {
      toast('Impossible de terminer la salle')
    }
  }

  const handleOpenTv = async () => {
    const code = getActiveSessionCode()
    // Ouvrir la fenêtre en premier (geste utilisateur direct, avant tout await)
    const path = isDynamicRoomCode(code) ? buildTvUrl(code) : '/?mode=tv'
    const url = `${window.location.origin}${path}`
    const opened = window.open(url, 'lpt-tv-diffusion', 'noopener,noreferrer')
    if (!opened) {
      toast('Autorisez les pop-ups pour ouvrir l\'écran Diffusion')
    }
    // Met à jour tv_screen sans toucher active_module
    // (réinitialiser active_module bloquerait le diffuseur si un module est déjà en cours)
    try {
      if (isDynamicRoomCode(code)) {
        await setRoomSharedState({ tv_screen: 'qr' }, code)
      } else {
        await setSharedState({ tv_screen: 'qr' })
      }
    } catch (e) {
      console.warn('tv_screen qr', e)
    }
  }

  const handleExitTv = () => {
    window.history.replaceState(null, '', '/')
    setMode(null)
    const savedName = localStorage.getItem('trainer_name')
    if (savedName) {
      setPName(savedName)
      setIsTrainer(true)
      setView('dashboard')
    }
  }

  useEffect(() => {
    const onPopState = () => {
      const m = new URLSearchParams(window.location.search).get('mode')
      setMode(m === 'tv' || m === 'participant' ? m : null)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const handleLaunchSession = () => setView('trainer-session')

  const handleOpenRoom = ({ code }) => {
    if (code) setDisplaySessionCode(code)
    setView('onboarding-modules')
  }
  const handleLaunchModule = async (moduleId, returnTo = 'onboarding-modules', journeeId = null) => {
    setReturnJournee(null)
    setModuleReturnTo(returnTo)
    setReturnJourneeBelgique(returnTo === 'onboarding-modules-belgique' ? journeeId : null)
    setView('module-' + moduleId)
    // Le réveil des acquis n'est pas un vrai module (pas dans MODULE_DATA) — il est piloté
    // uniquement via faq_journee dans sharedState. Ne jamais écrire active_module=reveil-acquis
    // en base, sinon la TV retourne null (page blanche) car elle ne reconnaît pas ce module.
    if (moduleId === 'reveil-acquis') return
    // Mini-jeux piloté par minijeu_phase dans sharedState (pas dans MODULE_DATA)
    // On efface active_module pour que la TV affiche la roulette via !activeModule
    if (moduleId === 'mini-jeux') {
      try {
        const code = getActiveSessionCode()
        if (isDynamicRoomCode(code)) {
          await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + code)
        } else if (SESSION_CODE) {
          await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + SESSION_CODE)
        }
      } catch {}
      return
    }
    // Affiche le lobby du module sur le diffuseur immediatement
    try {
      const code = getActiveSessionCode()
      if (isDynamicRoomCode(code)) {
        await sbUpdate('sessions', { active_module: moduleId, module_page: -1 }, 'code=eq.' + code)
        await setRoomSharedState({ tv_screen: null }, code)
      } else if (SESSION_CODE) {
        await sbUpdate('sessions', { active_module: moduleId, module_page: -1 }, 'code=eq.' + SESSION_CODE)
        await setSharedState({ tv_screen: null })
      }
    } catch (e) {
      console.warn('handleLaunchModule tv sync', e)
    }
  }

  const tvBackToQr = async () => {
    try {
      const code = getActiveSessionCode()
      if (isDynamicRoomCode(code)) {
        await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + code)
        await setRoomSharedState({ tv_screen: 'qr' }, code)
      } else if (SESSION_CODE) {
        await sbUpdate('sessions', { active_module: null, module_page: 0 }, 'code=eq.' + SESSION_CODE)
        await setSharedState({ tv_screen: 'qr' })
      }
    } catch (e) {
      console.warn('tvBackToQr', e)
    }
  }

  const handleBackToDashboard = () => { setView('dashboard'); tvBackToQr() }
  const handleBackToModules = () => { setView(moduleReturnTo); tvBackToQr() }
  const handleTerminateToJournee1 = () => { setReturnJournee('journee1'); setView('onboarding-modules'); tvBackToQr() }
  const handleTerminateToJournee4 = () => {
    if (moduleReturnTo === 'onboarding-modules-belgique') {
      setReturnJourneeBelgique('journee4')
      setView('onboarding-modules-belgique')
    } else {
      setReturnJournee('journee4')
      setView('onboarding-modules')
    }
    tvBackToQr()
  }
  const handleOpenPlanning = () => setView('planning')

  if (!appReady) {
    return <div style={{ minHeight: '100vh', background: '#03112a' }} aria-busy="true" />
  }

  if (mode === 'tv') return <TVView onExit={handleExitTv} />
  if (mode === 'participant') {
    return <ParticipantModuleView pName={pName || undefined} onDisconnect={handleParticipantDisconnect} />
  }

  if (view === 'landing') {
    return (
      <>
        <Login onTrainerLogin={handleTrainerLogin} onParticipantJoin={handleParticipantJoin} />
        <Toast message={message} />
      </>
    )
  }

  return (
    <div style={isMobile ? { height: '100dvh', overflow: 'hidden', display: 'flex', flexDirection: 'column' } : { minHeight: '100vh' }}>
      <Topbar
        pName={pName}
        isTrainer={isTrainer}
        onlineCount={onlineCount}
        sessionCode={displaySessionCode || getRuntimeSessionCode('trainer') || SESSION_CODE}
        isRoomSession={isDynamicRoomCode(displaySessionCode || getRuntimeSessionCode('trainer') || SESSION_CODE)}
        onLogout={handleLogout}
        onTVMode={handleOpenTv}
        onStartSession={handleLaunchSession}
      />
      <div style={isMobile ? { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', position: 'relative' } : {}}>
      {view === 'dashboard' && (
        <Dashboard
          pName={pName}
          onLaunchSession={handleLaunchSession}
          onLaunchModule={handleLaunchModule}
          onOpenRoom={handleOpenRoom}
          onOpenTv={handleOpenTv}
          onToast={toast}
          onOnlineCount={setOnlineCount}
          onOpenPlanning={handleOpenPlanning}
        />
      )}
      {view === 'trainer-session' && (
        <TrainerView
          pName={pName}
          onBack={handleBackToDashboard}
          onToast={toast}
          onOnlineCount={setOnlineCount}
        />
      )}
      {view === 'participant' && (
        <ParticipantView
          pName={pName}
          pPrenom={pPrenom || localStorage.getItem('participant_prenom') || ''}
          onToast={toast}
          onOnlineCount={setOnlineCount}
          onDisconnect={handleParticipantDisconnect}
        />
      )}
      {view === 'onboarding-modules' && (
        <div id="dashboard">
          <OnboardingView
            pName={pName}
            onBack={handleBackToDashboard}
            onLaunchFormation={handleLaunchSession}
            onLaunchModule={handleLaunchModule}
            onEndRoom={handleEndRoom}
            onLaunchPeerQuiz={() => { setPeerQuizReturnView('onboarding-modules'); setReturnJournee('journee2'); setView('peer-quiz') }}
            initialStep="modules"
            initialJournee={returnJournee}
          />
        </div>
      )}
      {view === 'onboarding-modules-belgique' && (
        <div id="dashboard">
          <OnboardingViewBelgique
            pName={pName}
            onBack={handleBackToDashboard}
            onLaunchFormation={handleLaunchSession}
            onLaunchModule={(moduleId, journeeId) => handleLaunchModule(moduleId, 'onboarding-modules-belgique', journeeId)}
            onLaunchPeerQuiz={() => { setPeerQuizReturnView('onboarding-modules-belgique'); setReturnJourneeBelgique('journee2'); setView('peer-quiz') }}
            initialStep="modules"
            initialJournee={returnJourneeBelgique}
          />
        </div>
      )}
      {view === 'module-types-verres' && (
        <ModuleTypesVerres
          pName={pName}
          onBack={handleBackToModules}
          onTerminate={handleTerminateToJournee1}
        />
      )}
      {view === 'module-pdm' && (
        <ModulePDM
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-optique' && (
        <ModuleOptique
          pName={pName}
          onBack={handleBackToModules}
          onTerminate={handleTerminateToJournee1}
        />
      )}
      {view === 'module-offres' && (
        <ModuleOffres
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-entreprise' && (
        <ModuleEntreprise
          pName={pName}
          onBack={handleBackToModules}
          onTerminate={handleTerminateToJournee1}
        />
      )}
      {view === 'module-verre-progressif' && (
        <ModuleProgressif
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-trame-accueil' && (
        <ModuleTrameAccueil
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-reveil-acquis' && (
        <ModuleReveilAcquis
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-montures' && (
        <ModuleMontures
          pName={pName}
          onBack={handleBackToModules}
          onTerminate={handleTerminateToJournee1}
        />
      )}
      {view === 'module-mini-jeux' && (
        <ModuleMiniJeux
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-quiz-final' && (
        <ModuleQuizFinal
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-quiz-j1' && (
        <ModuleQuizJ1
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-mutuelles-inami' && (
        <ModuleMutuelles
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-remboursement-france' && (
        <ModuleRemboursementFrance
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-parcours-rembourses' && (
        <ModuleParcoursRembourses
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-lpt-sante' && (
        <ModuleLptSante
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-atelier-pec' && (
        <ModuleAtelierPEC
          pName={pName}
          onBack={handleBackToModules}
        />
      )}
      {view === 'module-retraits' && (
        <ModuleRetraits
          pName={pName}
          onBack={handleBackToModules}
          onTerminate={handleTerminateToJournee4}
        />
      )}
      {view === 'module-ajustages' && (
        <ModuleAjustages
          pName={pName}
          onBack={handleBackToModules}
          onTerminate={handleTerminateToJournee4}
        />
      )}
      {view === 'module-raz' && (
        <ModuleRAZ
          pName={pName}
          onBack={handleBackToModules}
          onTerminate={handleTerminateToJournee4}
        />
      )}
      {view === 'peer-quiz' && (
        <PeerQuizTrainer
          sessionCode={getActiveSessionCode()}
          onBack={() => setView(peerQuizReturnView)}
        />
      )}
      {view === 'planning' && (
        <PlanningPage
          pName={pName}
          onBack={handleBackToDashboard}
        />
      )}
      {view.startsWith('module-') && (
        <IdeesButton moduleId={view.slice(7)} pName={pName} />
      )}
      {view.startsWith('module-') && (
        <TrainerQuestionsPanel moduleId={view.slice(7)} />
      )}
      <Toast message={message} />
      </div>
    </div>
  )
}
