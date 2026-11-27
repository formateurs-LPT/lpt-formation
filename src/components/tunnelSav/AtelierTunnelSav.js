'use client'
// Atelier tunnel SAV (27/11) : plein écran, réservé à Kevin et Quentin
// (cf. peutUtiliserTunnelSav). L'éditeur est du JavaScript sans React
// (editeurTunnelSav.js) : on lui donne un conteneur vide et les adaptateurs
// Supabase, et on le démonte proprement en quittant la vue.
import { useEffect, useRef } from 'react'
import { monterEditeur } from './editeurTunnelSav'
import { creerBackend } from '@/lib/tunnelSavApi'

export default function AtelierTunnelSav({ moi, cleFormateur, onQuitter }) {
  const racine = useRef(null)
  const quitter = useRef(onQuitter)
  quitter.current = onQuitter

  useEffect(() => {
    const backend = creerBackend({ moi, cleFormateur })
    const demonter = monterEditeur(racine.current, { use: backend.use, onQuitter: () => quitter.current && quitter.current() })
    return () => { demonter(); backend.fermer() }
  }, [moi, cleFormateur])

  return <div className="tsav" ref={racine} />
}
