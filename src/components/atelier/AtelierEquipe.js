'use client'
// Atelier Lipto — qui est qui (27/11) : avatar et couleur de chaque formateur,
// pour voir d'un coup d'œil à qui appartient une simulation.
import { getTrainerAvatarKey, getTrainerAvatarSrc } from '@/lib/constants'

// Mêmes couleurs que le planning
const COULEURS = { kevin: '#0089ba', quentin: '#7c3aed', nadege: '#db2777', thomas: '#f59e0b', valentine: '#22c55e', mateo: '#fb923c', jonathan: '#14b8a6', salome: '#4f46e5', paul: '#0f766e' }
export const couleurFormateur = nom => COULEURS[getTrainerAvatarKey(nom)] || '#64748b'

export function Avatar({ nom, taille = 26 }) {
  const src = getTrainerAvatarSrc(nom)
  const couleur = couleurFormateur(nom)
  return (
    <span title={nom} style={{ width: taille, height: taille, borderRadius: taille / 2, flexShrink: 0, background: couleur, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: Math.round(taille * 0.45), overflow: 'hidden', boxShadow: `0 0 0 2px #fff, 0 0 0 3px ${couleur}55` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (nom || '?')[0].toUpperCase()}
    </span>
  )
}
