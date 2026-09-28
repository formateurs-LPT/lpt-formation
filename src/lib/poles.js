// Pôles et rubriques du reporting hebdomadaire — listes définies ici
// uniquement, pour être modifiables à un seul endroit. Le pôle est
// volontairement indépendant de la normalisation MO/SAV des postes
// collaborateurs (StoreFollowupShared.js).
export const POLES = [
  { id: 'cvo', label: 'CVO', color: 'var(--green)' },
  { id: 'mo_sav', label: 'MO/SAV', color: 'var(--orange)' },
  { id: 'magasin', label: 'Magasin', color: 'var(--lpt)' },
]

export const RUBRIQUES = [
  { id: 'constate', label: 'Constaté', color: 'var(--lpt)' },
  { id: 'fait', label: 'Fait', color: 'var(--green)' },
  { id: 'a_faire', label: 'À faire', color: 'var(--orange)' },
]

export function poleMeta(poleId) {
  return POLES.find(p => p.id === poleId) || POLES.find(p => p.id === 'magasin')
}

export function rubriqueMeta(rubriqueId) {
  return RUBRIQUES.find(r => r.id === rubriqueId) || RUBRIQUES.find(r => r.id === 'constate')
}

/** Texte simple (synthèse, puis par pôle → par rubrique, une ligne par
 * point) — utilisé pour `contenu_genere` (rétrocompatibilité) et pour le
 * corps du mail (même structure, en clair). */
export function structureToPlainText(structure) {
  if (!structure) return ''
  const parts = []
  if (structure.syntheseGlobale) parts.push(structure.syntheseGlobale)
  for (const s of (structure.sections || [])) {
    const poleLabel = poleMeta(s.pole).label
    const rubriquesTexte = (s.rubriques || []).map(r => {
      const rubriqueLabel = rubriqueMeta(r.rubrique).label
      const lignes = r.items.map(it => `- ${it.resume}`)
      return `${rubriqueLabel} :\n${lignes.join('\n')}`
    })
    parts.push(`${poleLabel} :\n${rubriquesTexte.join('\n\n')}`)
  }
  if (structure.motDeLaFin) parts.push(`Mot de la fin :\n${structure.motDeLaFin}`)
  return parts.join('\n\n')
}
