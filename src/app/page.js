'use client'
import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Topbar from '@/components/Topbar'
import Toast, { useToast } from '@/components/Toast'
import Dashboard from '@/components/Dashboard'
import TrainerView from '@/components/TrainerView'
import ParticipantView from '@/components/ParticipantView'
import { sbUpsert, sbUpdate, sbInsert, SESSION_CODE, getTrainerFromDB, ensureSession, getRuntimeSessionCode, sbSelect, getActiveSessionCode } from '@/lib/supabase'
import { resolveParticipantName } from '@/lib/participantNames'
import { canParticipantJoinSession, getCategoryJoinDeniedMessage } from '@/lib/formationCategories'
import { TRAINER_CANONICAL } from '@/lib/constants'
import { getTrainerCredentials } from '@/lib/env'
import { captureParticipantRoomFromUrl, captureTvRoomFromUrl, buildTvUrl, isDynamicRoomCode, setParticipantSessionCode, readParticipantSessionCode, getLegacySessionCode } from '@/lib/sessionCode'
import { touchParticipantPresence } from '@/lib/participantPresence'
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
import PlanningPage from '@/components/PlanningPage'
import OnboardingView from '@/components/OnboardingView'
import TVView from '@/components/TVView'
import ParticipantModuleView from '@/components/ParticipantModuleView'

export default function Page() {
  const [view, setView] = useState('landing') // landing | dashboard | trainer-session | participant | module-types-verres
  const [pName, setPName] = useState('')
  const [pPrenom, setPPrenom] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [mode, setMode] = useState(null)
  const [appReady, setAppReady] = useState(false)
  const [displaySessionCode, setDisplaySessionCode] = useState('')
  const { message, toast } = useToast()

  useOnlineCount({
    enabled: appReady && isTrainer && ['dashboard', 'trainer-session', 'onboarding-modules'].includes(view),
    onCount: setOnlineCount,
  })

  const restoreParticipantSession = async () => {
    const savedName = localStorage.getItem('participant_name')
    const sessionCode = readParticipantSessionCode() || getRuntimeSessionCode('participant')
    if (!savedName || !sessionCode) return null

    const rows = await sbSelect('sessions', `code=eq.${encodeURIComponent(sessionCode)}&limit=1`)
    const session = rows?.[0]
    if (session?.status === 'ended') return null

    const resolved = await resolveParticipantName(savedName)
    if (!resolved.ok || !canParticipantJoinSession(session, resolved.entry)) {
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
        const code = await getLiveTrainerRoomCode(trainerLoginFromDisplayName(savedTrainer))
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
      const code = await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName))
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
    try {
      await sbUpsert('sessions', { code: SESSION_CODE, current_step: -1, active_scenario: 0 }, 'code')
      await sbUpdate('sessions', { current_step: -1, active_module: null, module_page: 0 }, 'code=eq.' + SESSION_CODE)
    } catch (e) {
      console.warn('Supabase session init failed (non-blocking):', e)
    }
    setView('dashboard')
  }

  const handleParticipantJoin = async (name) => {
    const raw = name.trim()
    if (!raw) { toast('Entrez votre prénom et nom'); return }

    const sessionCode = getRuntimeSessionCode('participant') || SESSION_CODE
    if (!sessionCode) {
      toast('Application mal configurée (code session manquant). Contactez le formateur.')
      return
    }

    const rows = await sbSelect('sessions', `code=eq.${encodeURIComponent(sessionCode)}&limit=1`)
    const session = rows?.[0]
    if (session?.status === 'ended') {
      toast('Cette session est terminée.')
      return
    }

    const resolved = await resolveParticipantName(raw)
    if (!resolved.ok) {
      if (resolved.reason === 'no_session_code') {
        toast('Application mal configurée (code session manquant). Contactez le formateur.')
      } else if (resolved.reason === 'no_list') {
        toast('Liste RH indisponible. Le formateur doit importer « Entrées de la semaine ».')
      } else {
        toast('Nom non reconnu. Copiez-collez exactement la ligne bleue « Connexion : … » sur Entrées de la semaine.')
      }
      return
    }

    if (!canParticipantJoinSession(session, resolved.entry)) {
      toast(getCategoryJoinDeniedMessage(session, resolved.entry))
      return
    }

    const canonical = resolved.canonicalName
    const prenom = resolved.prenom || raw.split(' ')[0] || ''
    setPName(canonical)
    setPPrenom(prenom)
    setIsTrainer(false)
    localStorage.setItem('participant_name', canonical)
    localStorage.setItem('participant_prenom', prenom)
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

  const handleEndRoom = async (roomCodeHint) => {
    const code = (roomCodeHint || '').trim()
      || (await getLiveTrainerRoomCode(trainerLoginFromDisplayName(pName)))
      || getActiveSessionCode()
    const ok = await endActiveRoom(code)
    if (ok) {
      toast('Salle terminée')
      setDisplaySessionCode(getLegacySessionCode())
      setView('dashboard')
    } else {
      toast('Impossible de terminer la salle')
    }
  }

  const handleOpenTv = () => {
    const code = getActiveSessionCode()
    const path = isDynamicRoomCode(code) ? buildTvUrl(code) : '/?mode=tv'
    const url = `${window.location.origin}${path}`
    const opened = window.open(url, 'lpt-tv-diffusion', 'noopener,noreferrer')
    if (!opened) {
      toast('Autorisez les pop-ups pour ouvrir l\'écran Diffusion')
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
  const handleLaunchModule = (moduleId) => setView('module-' + moduleId)
  const handleBackToDashboard = () => setView('dashboard')
  const handleBackToModules = () => setView('onboarding-modules')
  const handleOpenPlanning = () => setView('planning')

  if (!appReady) {
    return <div style={{ minHeight: '100vh', background: '#03112a' }} aria-busy="true" />
  }

  if (mode === 'tv') return <TVView onExit={handleExitTv} />
  if (mode === 'participant') return <ParticipantModuleView pName={pName || undefined} />

  if (view === 'landing') {
    return (
      <>
        <Login onTrainerLogin={handleTrainerLogin} onParticipantJoin={handleParticipantJoin} />
        <Toast message={message} />
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Topbar
        pName={pName}
        isTrainer={isTrainer}
        onlineCount={onlineCount}
        sessionCode={displaySessionCode || getRuntimeSessionCode('trainer') || SESSION_CODE}
        isRoomSession={isDynamicRoomCode(displaySessionCode || getRuntimeSessionCode('trainer') || SESSION_CODE)}
        onLogout={handleLogout}
        onTVMode={handleOpenTv}
      />
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
            initialStep="modules"
          />
        </div>
      )}
      {view === 'module-types-verres' && (
        <ModuleTypesVerres
          pName={pName}
          onBack={handleBackToModules}
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
        />
      )}
      {view === 'planning' && (
        <PlanningPage
          pName={pName}
          onBack={handleBackToDashboard}
        />
      )}
      <Toast message={message} />
    </div>
  )
}
