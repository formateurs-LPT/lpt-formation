'use client'
import { useState } from 'react'
import Login from '@/components/Login'
import Topbar from '@/components/Topbar'
import Toast, { useToast } from '@/components/Toast'
import Dashboard from '@/components/Dashboard'
import TrainerView from '@/components/TrainerView'
import ParticipantView from '@/components/ParticipantView'
import { sbUpsert, sbUpdate, SESSION_CODE } from '@/lib/supabase'
import { TRAINERS, TRAINER_CANONICAL } from '@/lib/constants'
import ModuleTypesVerres from '@/components/modules/ModuleTypesVerres'

export default function Page() {
  const [view, setView] = useState('landing') // landing | dashboard | trainer-session | participant | module-types-verres
  const [pName, setPName] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)
  const [onlineCount, setOnlineCount] = useState(0)
  const { message, toast } = useToast()

  const handleTrainerLogin = async (id, code) => {
    const idRaw = id.trim().toLowerCase()
    const normalized = TRAINER_CANONICAL[idRaw] || idRaw
    if (!normalized) { toast('Entrez votre identifiant'); return }
    if (!TRAINERS[normalized]) { toast('Identifiant inconnu'); return }
    if (TRAINERS[normalized] !== code.trim()) { toast('Code incorrect'); return }
    const name = normalized.charAt(0).toUpperCase() + normalized.slice(1)
    setPName(name)
    setIsTrainer(true)
    try {
      await sbUpsert('sessions', { code: SESSION_CODE, current_step: -1, active_scenario: 0 }, 'code')
      await sbUpdate('sessions', { current_step: -1 }, 'code=eq.' + SESSION_CODE)
    } catch (e) {
      console.warn('Supabase session init failed (non-blocking):', e)
    }
    setView('dashboard')
  }

  const handleParticipantJoin = async (name, code) => {
    if (!name.trim()) { toast('Entrez votre prénom et nom'); return }
    if (code.trim().toUpperCase() !== SESSION_CODE) { toast('Code de session incorrect'); return }
    setPName(name.trim())
    setIsTrainer(false)
    try {
      await sbUpsert('participants', { session_code: SESSION_CODE, name: name.trim() }, 'session_code,name')
    } catch (e) {
      console.warn('Supabase participant upsert failed (non-blocking):', e)
    }
    setView('participant')
  }

  const handleLogout = () => {
    setIsTrainer(false)
    setPName('')
    setView('landing')
  }

  const handleLaunchSession = () => setView('trainer-session')
  const handleLaunchModule = (moduleId) => setView('module-' + moduleId)
  const handleBackToDashboard = () => setView('dashboard')

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
      {view === 'module-types-verres' && (
        <ModuleTypesVerres
          pName={pName}
          onBack={handleBackToDashboard}
        />
      )}
      <Toast message={message} />
    </div>
  )
}
