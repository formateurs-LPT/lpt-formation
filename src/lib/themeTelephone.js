'use client'
// Thème des écrans quiz du téléphone du formé (18/11) : mode sombre (même
// univers que la TV) ou mode clair (lisible en pleine lumière, en magasin).
// Par défaut : mode clair ; le bouton ☀️/🌙 permet de basculer, et le choix
// est mémorisé sur le téléphone pour les quiz suivants.
import { useSyncExternalStore } from 'react'

const CLE = 'lpt_theme_tel'

export const THEMES_TEL = {
  sombre: {
    mode: 'sombre',
    fond: '#03112a', texte: '#ffffff', doux: 'rgba(255,255,255,0.58)', tresDoux: 'rgba(255,255,255,0.38)',
    trait: 'rgba(255,255,255,0.12)', champ: 'rgba(255,255,255,0.06)', champBord: 'rgba(255,255,255,0.2)',
    carte: 'transparent', ombre: 'none', accent: '#c9a227',
    bouton: '#ffffff', boutonTexte: '#03112a', boutonOff: 'rgba(255,255,255,0.08)', boutonOffTexte: 'rgba(255,255,255,0.35)',
    vert: '#4ade80', rouge: '#f87171', orange: '#fb923c', titreSerif: false,
  },
  clair: {
    mode: 'clair',
    fond: '#f6f4ef', texte: '#03112a', doux: 'rgba(3,17,42,0.62)', tresDoux: 'rgba(3,17,42,0.42)',
    trait: 'rgba(3,17,42,0.1)', champ: '#ffffff', champBord: 'rgba(3,17,42,0.16)',
    carte: '#ffffff', ombre: '0 2px 10px rgba(3,17,42,0.06)', accent: '#a8861a',
    bouton: '#03112a', boutonTexte: '#ffffff', boutonOff: 'rgba(3,17,42,0.08)', boutonOffTexte: 'rgba(3,17,42,0.35)',
    vert: '#16a34a', rouge: '#dc2626', orange: '#ea580c', titreSerif: true,
  },
}

const ecouteurs = new Set()

function lireChoix() {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(CLE) } catch { return null }
}

// Mode clair par défaut pour tout le téléphone du collaborateur (19/11, choix
// de Kevin) ; le bouton ☀️/🌙 permet toujours de passer en sombre.
function modeSysteme() {
  return 'clair'
}

function modeActuel() {
  const choix = lireChoix()
  return choix === 'clair' || choix === 'sombre' ? choix : modeSysteme()
}

function abonner(cb) {
  ecouteurs.add(cb)
  const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null
  mq?.addEventListener?.('change', cb)
  return () => { ecouteurs.delete(cb); mq?.removeEventListener?.('change', cb) }
}

export function basculerThemeTel() {
  const suivant = modeActuel() === 'clair' ? 'sombre' : 'clair'
  try { localStorage.setItem(CLE, suivant) } catch { /* navigation privée : choix non mémorisé */ }
  ecouteurs.forEach(cb => cb())
}

export function useThemeTel() {
  const mode = useSyncExternalStore(abonner, modeActuel, () => 'clair')
  return THEMES_TEL[mode] || THEMES_TEL.sombre
}
