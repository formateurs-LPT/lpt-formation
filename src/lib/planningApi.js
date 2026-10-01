import { sbSelect, sbInsert } from './supabase'

// `planning_deployments.store` est un libellé libre choisi dans une liste
// statique (STORES_BY_ZONE, cf. PlanningPage.js) — il coïncide exactement
// avec `magasins.nom`, ce qui permet de retrouver le magasin réel sans
// toucher au format existant du planning.
export async function getMagasinIdByNom(nom) {
  if (!nom) return null
  const rows = await sbSelect('magasins', `nom=eq.${encodeURIComponent(nom)}`)
  return rows?.[0]?.id || null
}

// Prévient le(s) manager(s) du magasin concerné qu'un formateur va passer
// chez eux — déclenché à la création d'un déplacement depuis le planning
// formateur. Réutilise le centre de notifications générique (table
// `notifications`) déjà lu par le dashboard manager (cf. refreshNotifications
// dans src/app/manager/page.js).
export async function notifierManagersDeploiement(deploymentId, magasinId) {
  if (!magasinId) return
  const managers = await sbSelect('store_managers', `magasin_id=eq.${magasinId}&select=login`)
  await Promise.all((managers || []).map(m => sbInsert('notifications', {
    destinataire_login: m.login,
    type: 'planning_deploiement',
    reference_id: deploymentId,
  })))
}
