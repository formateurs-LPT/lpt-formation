'use client'
import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { RouletteView, RulesView } from './ModuleMiniJeux'

// Variante manager du jeu "Accueil moi si tu peux" (dashboard formateur) —
// mêmes règles et même animation de tirage, mais sans salle/QR : le manager
// tape à la main les prénoms de l'équipe présente plutôt que de dépendre de
// formés connectés en session (concept qui n'existe pas côté manager). Pas
// de synchronisation TV non plus, pour la même raison.
const THEMES = [
  'Un client qui veut du progressif mais n\'en a jamais porté',
  'Un client qui souhaite faire un test de vue pour la première fois',
  'Un client qui dit ne pas avoir besoin de correction',
  'Un client qui rentre avec une ordonnance en main',
  'Un client qui rentre et connaît déjà le concept LPT',
  'Une personne qui rentre et qui est déjà cliente',
  'Un client qui veut une paire à 10 € en 10 minutes',
  'Un client avec une correction de -10 : un vrai défi technique',
  'Un client presbyte qui a des appréhensions sur le verre progressif',
  'Un client qui souhaite une paire solaire à sa vue',
]

const STYLES = `
  @keyframes slotScroll { from { transform: translateY(0); } to { transform: translateY(-33.333%); } }
  @keyframes resultBounce { 0% { transform: scale(0.82); opacity: 0; } 65% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
  @keyframes mjFadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes mjPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
`

export default function ModuleMiniJeuxManager({ onBack }) {
  const [view, setView] = useState('rules') // rules | game
  const [participants, setParticipants] = useState([])
  const [excluded, setExcluded] = useState(new Set())
  const [phase, setPhase] = useState('idle')
  const [vendeur, setVendeur] = useState(null)
  const [client, setClient] = useState(null)
  const [theme, setTheme] = useState(null)
  const [reel1State, setReel1] = useState('idle')
  const [reel2State, setReel2] = useState('idle')
  const [reelTState, setReelT] = useState('idle')
  const vendeurPoolRef = useRef([])
  const clientPoolRef = useRef([])

  const activeParticipants = participants.filter(p => !excluded.has(p))

  const handleAddName = (name) => {
    setParticipants(prev => (prev.includes(name) ? prev : [...prev, name]))
  }

  const handleToggle = (name) => {
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const BRAKE_MS = 800
  const stopReel = useCallback((setFn, onDone) => {
    setFn('brake')
    setTimeout(() => { setFn('done'); onDone?.() }, BRAKE_MS)
  }, [])

  const handleEnterGame = () => {
    const active = participants.filter(p => !excluded.has(p))
    if (active.length < 2) return
    setView('game')
    setPhase('idle')
    vendeurPoolRef.current = [...active]
    clientPoolRef.current = [...active]
  }

  const handleLaunch = useCallback(() => {
    const active = participants.filter(p => !excluded.has(p))
    if (active.length < 2) return

    let pool = vendeurPoolRef.current.filter(p => active.includes(p))
    if (pool.length === 0) pool = [...active]
    const vendeurIdx = Math.floor(Math.random() * pool.length)
    const p1 = pool[vendeurIdx]
    vendeurPoolRef.current = pool.filter((_, i) => i !== vendeurIdx)

    let clientPool = clientPoolRef.current.filter(p => active.includes(p) && p !== p1)
    if (clientPool.length === 0) {
      clientPoolRef.current = [...active]
      clientPool = active.filter(p => p !== p1)
    }
    const clientIdx = Math.floor(Math.random() * clientPool.length)
    const p2 = clientPool[clientIdx]
    clientPoolRef.current = clientPoolRef.current.filter(p => p !== p2)
    const t = THEMES[Math.floor(Math.random() * THEMES.length)]

    setPhase('spinning')
    setReel1('spin'); setReel2('spin'); setReelT('spin')
    setVendeur(null); setClient(null); setTheme(null)

    setTimeout(() => {
      stopReel(setReel1, () => {
        setVendeur(p1)
        setPhase('vendeur')
        setTimeout(() => {
          stopReel(setReel2, () => {
            setClient(p2)
            setPhase('client')
            setTimeout(() => {
              stopReel(setReelT, () => {
                setTheme(t)
                setPhase('revealed')
              })
            }, 300)
          })
        }, 300)
      })
    }, 1500)
  }, [participants, excluded, stopReel])

  const handleDebrief = () => setPhase('debrief')

  const handleTerminer = useCallback(() => {
    setPhase('idle')
    setReel1('idle'); setReel2('idle'); setReelT('idle')
    setVendeur(null); setClient(null); setTheme(null)
    setTimeout(() => handleLaunch(), 80)
  }, [handleLaunch])

  const handleBack = () => {
    if (view === 'game') {
      setView('rules')
      setPhase('idle'); setReel1('idle'); setReel2('idle'); setReelT('idle')
    } else {
      onBack()
    }
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a0a1a 100%)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30} style={{ objectFit: 'contain' }} />
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)' }}>Mini Jeux · Accueil moi si tu peux</span>
          </div>
          <button
            onClick={handleBack}
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.5)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,0.15)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          >
            {view === 'rules' ? '✕ Quitter' : '← Retour'}
          </button>
        </div>

        <div style={{ flex: 1 }}>
          {view === 'rules' && (
            <RulesView
              participants={participants}
              excluded={excluded}
              onToggle={handleToggle}
              onStart={handleEnterGame}
              onAddName={handleAddName}
            />
          )}
          {view === 'game' && (
            <RouletteView
              participants={activeParticipants}
              phase={phase}
              vendeur={vendeur}
              client={client}
              theme={theme}
              reel1State={reel1State}
              reel2State={reel2State}
              reelTState={reelTState}
              onLaunch={handleLaunch}
              onDebrief={handleDebrief}
              onTerminer={handleTerminer}
            />
          )}
        </div>
      </div>
    </>
  )
}
