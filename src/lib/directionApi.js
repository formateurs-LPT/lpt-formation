// Couche données — script 5 (Espace Direction : régions, comptes,
// demandes d'intervention, chat). Même schéma relationnel que les scripts
// précédents (collaborateursApi.js, notesTerrainApi.js).
import { sbSelect, sbInsert, sbUpdate } from '@/lib/supabase'

// ── Auth Direction ────────────────────────────────────────────────────
// Même logique que getManagerFromDB (code comparé côté Postgrest, jamais
// reçu/comparé côté client) — cohérent avec le reste de l'app.
export async function getDirectorFromDB(login, code) {
  try {
    const rows = await sbSelect(
      'store_directors',
      `login=eq.${encodeURIComponent(login)}&code=eq.${encodeURIComponent(code)}&active=eq.true`
    )
    return rows?.[0] || null
  } catch { return null }
}

/** Régions rattachées à ce directeur (1 pour la plupart, 2 pour Sarah Vaillant). */
export async function getDirectorRegions(directorId) {
  const rows = await sbSelect('store_director_regions', `director_id=eq.${directorId}&select=region_id`)
  if (!rows?.length) return []
  const regionIds = rows.map(r => r.region_id)
  const regions = await sbSelect('regions', `id=in.(${regionIds.join(',')})`)
  return regions || []
}

export async function getMagasinsByRegionIds(regionIds) {
  if (!regionIds?.length) return []
  const links = await sbSelect('magasin_regions', `region_id=in.(${regionIds.join(',')})&select=magasin_id`)
  const magasinIds = [...new Set((links || []).map(l => l.magasin_id))]
  if (!magasinIds.length) return []
  return (await sbSelect('magasins', `id=in.(${magasinIds.join(',')})&order=nom.asc`)) || []
}

export async function getAllMagasins() {
  return (await sbSelect('magasins', 'order=nom.asc')) || []
}

export async function getAllRegions() {
  return (await sbSelect('regions', 'order=nom.asc')) || []
}

/** true si ce magasin appartient à la région "Belgique et Lille" — calculé
 * depuis la vraie appartenance en base (magasin_regions), jamais déduit du
 * chemin de navigation emprunté pour l'atteindre. */
export async function isMagasinBelgique(magasinId) {
  if (!magasinId) return false
  const [links, belgiqueRegion] = await Promise.all([
    sbSelect('magasin_regions', `magasin_id=eq.${magasinId}&select=region_id`),
    sbSelect('regions', `nom=eq.${encodeURIComponent('Belgique et Lille')}&select=id`),
  ])
  const belgiqueId = belgiqueRegion?.[0]?.id
  if (!belgiqueId) return false
  return (links || []).some(l => l.region_id === belgiqueId)
}

// ── Taux de maîtrise (réutilise store_followup_progress — ancien système,
// seule source réelle de scores existante ; les magasins sans roster
// encore migré ressortent simplement absents de la moyenne). ───────────
async function tauxMaitriseParMagasinSlug(slug) {
  const rows = await sbSelect('store_followup_progress', `store=eq.${encodeURIComponent(slug)}&order=audit_date.desc`)
  if (!rows?.length) return null
  // Dernière entrée par (collaborateur, item)
  const latest = {}
  for (const r of rows) {
    const key = `${r.collaborateur}:${r.item_id}`
    if (!latest[key]) latest[key] = r
  }
  const entries = Object.values(latest)
  if (!entries.length) return 0
  const acquis = entries.filter(e => e.status === 'acquis').length
  return Math.round((acquis / entries.length) * 100)
}

/** Taux de maîtrise moyen sur une liste de magasins (moyenne des moyennes). */
export async function tauxMaitriseMoyen(magasins) {
  const taux = []
  for (const m of magasins) {
    const t = await tauxMaitriseParMagasinSlug(m.slug)
    if (t != null) taux.push(t)
  }
  if (!taux.length) return null
  return Math.round(taux.reduce((a, b) => a + b, 0) / taux.length)
}

// ── Demandes d'intervention ───────────────────────────────────────────
export async function getDemandesIntervention({ magasinIds } = {}) {
  let filter = 'order=created_at.desc'
  if (magasinIds?.length) filter = `magasin_id=in.(${magasinIds.join(',')})&${filter}`
  const [demandes, magasins, trainers] = await Promise.all([
    sbSelect('demandes_intervention', filter),
    sbSelect('magasins', 'select=id,nom'),
    sbSelect('trainers', 'select=id,display_name'),
  ])
  const magasinById = Object.fromEntries((magasins || []).map(m => [m.id, m.nom]))
  const trainerById = Object.fromEntries((trainers || []).map(t => [t.id, t.display_name]))
  return (demandes || []).map(d => ({
    ...d,
    magasinNom: magasinById[d.magasin_id] || '—',
    formateurNom: d.formateur_souhaite_id ? (trainerById[d.formateur_souhaite_id] || '—') : "N'importe lequel",
  }))
}

export async function getDemande(id) {
  const rows = await sbSelect('demandes_intervention', `id=eq.${id}`)
  return rows?.[0] || null
}

export async function createDemandeIntervention({ magasinId, demandeurLogin, demandeurRole, motif, delaiSouhaite, actionsAttendues, formateurSouhaiteId }) {
  const ok = await sbInsert('demandes_intervention', {
    magasin_id: magasinId,
    demandeur_login: demandeurLogin,
    demandeur_role: demandeurRole,
    motif: motif || null,
    delai_souhaite: delaiSouhaite || null,
    actions_attendues: actionsAttendues || null,
    formateur_souhaite_id: formateurSouhaiteId || null,
    statut: 'ouverte',
  })
  if (!ok) return null
  const rows = await sbSelect(
    'demandes_intervention',
    `magasin_id=eq.${magasinId}&demandeur_login=eq.${encodeURIComponent(demandeurLogin)}&order=created_at.desc&limit=1`
  )
  return rows?.[0] || null
}

export async function reouvrirDemande(id) {
  return sbUpdate('demandes_intervention', { statut: 'ouverte' }, `id=eq.${id}`)
}

export async function cloturerDemande(id) {
  return sbUpdate('demandes_intervention', { statut: 'cloturee' }, `id=eq.${id}`)
}

export async function rattacherReporting(demandeId, reportingId) {
  return sbUpdate('demandes_intervention', { reporting_id: reportingId }, `id=eq.${demandeId}`)
}

// ── Chat de groupe ─────────────────────────────────────────────────────
export async function getMessagesDemande(demandeId) {
  return (await sbSelect('demandes_intervention_messages', `demande_id=eq.${demandeId}&order=created_at.asc`)) || []
}

export async function postMessageDemande({ demandeId, auteurLogin, auteurRole, contenu }) {
  return sbInsert('demandes_intervention_messages', {
    demande_id: demandeId,
    auteur_login: auteurLogin,
    auteur_role: auteurRole,
    contenu,
  })
}

/** Destinataires du "groupe" d'une demande : manager du magasin, DR de la
 * région, directeur(s) retail, le demandeur, et le(s) formateur(s) visé(s)
 * (celui choisi, ou tous si "n'importe lequel"). */
async function getParticipantsDemande(demande) {
  const logins = new Set()
  if (demande.demandeur_login) logins.add(demande.demandeur_login)

  const [managers, magRegions, trainers, directors] = await Promise.all([
    sbSelect('store_managers', `magasin_id=eq.${demande.magasin_id}&select=login`),
    sbSelect('magasin_regions', `magasin_id=eq.${demande.magasin_id}&select=region_id`),
    sbSelect('trainers', 'select=id,login,active'),
    sbSelect('store_directors', 'select=id,login,role,active'),
  ])
  for (const m of (managers || [])) logins.add(m.login)

  if (demande.formateur_souhaite_id) {
    const t = (trainers || []).find(t => t.id === demande.formateur_souhaite_id)
    if (t) logins.add(t.login)
  } else {
    for (const t of (trainers || []).filter(t => t.active)) logins.add(t.login)
  }

  const regionIds = (magRegions || []).map(r => r.region_id)
  const [directorRegions] = await Promise.all([
    regionIds.length ? sbSelect('store_director_regions', `region_id=in.(${regionIds.join(',')})&select=director_id`) : Promise.resolve([]),
  ])
  const regionalDirectorIds = new Set((directorRegions || []).map(r => r.director_id))
  for (const d of (directors || []).filter(d => d.active)) {
    if (d.role === 'directeur_retail' || regionalDirectorIds.has(d.id)) logins.add(d.login)
  }

  return [...logins]
}

export async function notifierNouveauMessage(demande, auteurLogin) {
  const participants = await getParticipantsDemande(demande)
  const dests = participants.filter(l => l !== auteurLogin)
  await Promise.all(dests.map(login => sbInsert('notifications', {
    destinataire_login: login,
    type: 'nouveau_message_demande',
    reference_id: demande.id,
  })))
}

export async function notifierReportingRattache(demande) {
  const participants = await getParticipantsDemande(demande)
  await Promise.all(participants.map(login => sbInsert('notifications', {
    destinataire_login: login,
    type: 'reporting_rattache',
    reference_id: demande.id,
  })))
}

export async function getNotificationsNonLues(login) {
  return (await sbSelect('notifications', `destinataire_login=eq.${encodeURIComponent(login)}&lu=eq.false`)) || []
}

export async function marquerNotificationsLues(ids) {
  if (!ids?.length) return
  await sbUpdate('notifications', { lu: true }, `id=in.(${ids.join(',')})`)
}
