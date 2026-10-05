import { sbSelect, sbInsert, sbInsertReturn, sbUpdate } from './supabase'
import { getTrainerAvatarKey } from './constants'

export const TACHE_STATUTS = [
  { id: 'a_faire', label: 'À faire', color: '#6b7280', bg: '#f3f4f6' },
  { id: 'en_cours', label: 'En cours', color: '#b45309', bg: '#fef3c7' },
  { id: 'termine', label: 'Terminé', color: '#16a34a', bg: '#dcfce7' },
]

export async function getTaches() {
  const rows = await sbSelect('taches_equipe', 'order=created_at.desc')
  return rows || []
}

// mode:
// - 'commune' (défaut) : une seule fiche, un seul statut partagé par tous
//   les assignés — le premier qui la clôture la clôture pour tout le monde.
// - 'individuelle' : même consigne donnée à plusieurs personnes qui
//   l'exécutent chacune de leur côté — on crée une fiche par assigné (même
//   titre/description/created_at, pour pouvoir les regrouper à l'affichage),
//   chacun suit et clôt uniquement la sienne.
export async function createTache({ titre, description, assignes, creePar, mode = 'commune' }) {
  if (mode === 'individuelle' && assignes.length > 1) {
    const createdAt = new Date().toISOString()
    return Promise.all(assignes.map(name => sbInsert('taches_equipe', {
      titre, description: description || null, assignes: [name], cree_par: creePar, statut: 'a_faire', created_at: createdAt,
    })))
  }
  return sbInsertReturn('taches_equipe', {
    titre, description: description || null, assignes, cree_par: creePar, statut: 'a_faire',
  })
}

// Une tâche assignée à plusieurs formateurs n'a qu'un seul statut partagé —
// le premier qui la clôture la clôture pour tout le monde (même logique que
// les fiches de suivi partagées dans RetourFormationView). `actorName` est
// enregistré sur la tâche (termine_par) pour personnaliser la notification
// envoyée au créateur ("Quentin a terminé la tâche...").
export async function updateTacheStatut(tache, statut, actorName) {
  const patch = { statut, updated_at: new Date().toISOString() }
  if (statut === 'termine') patch.termine_par = actorName
  const ok = await sbUpdate('taches_equipe', patch, `id=eq.${tache.id}`)
  if (ok && statut === 'termine' && actorName && getTrainerAvatarKey(actorName) !== getTrainerAvatarKey(tache.cree_par)) {
    await sbInsert('notifications', {
      destinataire_login: getTrainerAvatarKey(tache.cree_par),
      type: 'tache_terminee',
      reference_id: tache.id,
    }).catch(() => {})
  }
  return ok
}
