// Atelier Lipto — enregistrement des simulations dans Supabase (table
// atelier_lipto_projets, cf. supabase/create-atelier-lipto.sql), partagées
// entre les formateurs qui ont accès à l'atelier.
//
// Un seul formateur modifie un projet à la fois : verrou_par / verrou_le,
// renouvelé tant que le projet est ouvert. Un verrou sans nouvelles depuis
// VERROU_MS est considéré comme libéré (onglet fermé, ordinateur en veille).
import { sbSelect, sbUpsertOrThrow, sbUpdate } from '@/lib/supabase'

const TABLE = 'atelier_lipto_projets'
export const VERROU_MS = 60 * 1000

const versProjet = r => ({
  id: r.id, titre: r.titre, auteur: r.auteur, majPar: r.maj_par, statut: r.statut, cases: r.cases || {},
  creeLe: r.cree_le, majLe: r.maj_le, verrouPar: r.verrou_par, verrouLe: r.verrou_le,
})
const versLigne = p => ({
  id: p.id, titre: (p.titre || '').trim().slice(0, 200) || 'Sans titre', auteur: p.auteur, maj_par: p.majPar || p.auteur,
  statut: p.statut, cases: p.cases, cree_le: p.creeLe, maj_le: p.majLe,
})

export async function chargerProjetsEquipe() {
  const lignes = await sbSelect(TABLE, 'supprime=eq.false&order=maj_le.desc')
  return (lignes || []).map(versProjet)
}

export async function enregistrerProjet(projet) {
  await sbUpsertOrThrow(TABLE, versLigne(projet), 'id')
}

// Pas de suppression réelle depuis le navigateur : le projet est masqué
export async function supprimerProjetEquipe(projet) {
  await sbUpsertOrThrow(TABLE, { ...versLigne(projet), supprime: true }, 'id')
}

export const verrouilleParAutre = (projet, moi) =>
  !!projet?.verrouPar && projet.verrouPar !== moi && Date.now() - new Date(projet.verrouLe).getTime() < VERROU_MS

export function prendreVerrou(id, moi) {
  return sbUpdate(TABLE, { verrou_par: moi, verrou_le: new Date().toISOString() }, `id=eq.${encodeURIComponent(id)}`)
}
export function rendreVerrou(id, moi) {
  return sbUpdate(TABLE, { verrou_par: null, verrou_le: null }, `id=eq.${encodeURIComponent(id)}&verrou_par=eq.${encodeURIComponent(moi)}`)
}
