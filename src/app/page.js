'use client'
import { useState, useEffect } from 'react'
import Login from '@/components/Login'
import Topbar from '@/components/Topbar'
import Toast, { useToast } from '@/components/Toast'
import Dashboard from '@/components/Dashboard'
import TrainerView from '@/components/TrainerView'
import ParticipantView from '@/components/ParticipantView'
import { sbUpsert, sbUpdate, sbInsert, SESSION_CODE, getTrainerFromDB, ensureSession } from '@/lib/supabase'
import { resolveParticipantName } from '@/lib/participantNames'
import { TRAINER_CANONICAL } from '@/lib/constants'
import { getTrainerCredentials } from '@/lib/env'
import ModuleTypesVerres from '@/components/modules/ModuleTypesVerres'
import ModulePDM from '@/components/modules/ModulePDM'
import ModuleOptique from '@/components/modules/ModuleOptique'
import ModuleOffres from '@/components/modules/ModuleOffres'
import OnboardingView from '@/components/OnboardingView'
import TVView from '@/components/TVView'
import ParticipantModuleView from '@/components/ParticipantModuleView'

export default function Page() {
  const [view, setView] = useState('landing') // landing | dashboard | trainer-session | participant | module-types-verres
  const [pName, setPName] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const [mode, setMode] = useState(() => {
    if (typeof window === 'undefined') return null
    const params = new URLSearchParams(window.location.search)
    const m = params.get('mode')
    return (m === 'tv' || m === 'participant') ? m : null
  })
  const { message, toast } = useToast()

  // Restaurer la session formateur au rechargement de page
  useEffect(() => {
    const savedName = localStorage.getItem('trainer_name')
    if (savedName) {
      setPName(savedName)
      setIsTrainer(true)
      setView('dashboard')
    }
  }, [])

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

    const resolved = await resolveParticipantName(raw)
    if (!resolved.ok) {
      if (resolved.reason === 'no_list') {
        toast('Liste RH indisponible. Le formateur doit importer « Entrées de la semaine » (ou attendre qu\'un collègue se soit déjà connecté).')
      } else {
        toast('Nom non reconnu. Reprenez le prénom et le nom comme sur la liste RH (accents et ordre libres).')
      }
      return
    }

    const canonical = resolved.canonicalName
    setPName(canonical)
    setIsTrainer(false)
    localStorage.setItem('participant_name', canonical)
    try {
      await ensureSession()
      await sbUpsert('participants', {
        session_code: SESSION_CODE,
        name: canonical,
        joined_at: new Date().toISOString(),
      }, 'session_code,name')
    } catch (e) {
      console.warn('Supabase participant upsert failed (non-blocking):', e)
    }
    setView('participant')
  }

  const handleLogout = () => {
    setIsTrainer(false)
    setPName('')
    localStorage.removeItem('trainer_name')
    setView('landing')
  }

  const handleLaunchSession = () => setView('trainer-session')
  const handleLaunchModule = (moduleId) => setView('module-' + moduleId)
  const handleBackToDashboard = () => setView('dashboard')
  const handleBackToModules = () => setView('onboarding-modules')

  if (mode === 'tv') return <TVView />
  if (mode === 'participant') return <ParticipantModuleView />

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
        sessionCode={SESSION_CODE}
        onLogout={handleLogout}
        onTVMode={() => setMode('tv')}
      />
      {view === 'dashboard' && (
        <Dashboard
          pName={pName}
          onLaunchSession={handleLaunchSession}
          onLaunchModule={handleLaunchModule}
          onToast={toast}
          onOnlineCount={setOnlineCount}
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
          onToast={toast}
          onOnlineCount={setOnlineCount}
        />
      )}
      {view === 'onboarding-modules' && (
        <div id="dashboard">
          <OnboardingView
            onBack={handleBackToDashboard}
            onLaunchFormation={handleLaunchSession}
            onLaunchModule={handleLaunchModule}
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
      <Toast message={message} />
    </div>
  )
}
