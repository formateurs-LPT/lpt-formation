// API RH — candidats, historique, documents, validation
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

function h() {
  return { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }
}
async function get(table, filter = '') {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?select=*${filter ? '&' + filter : ''}`, { headers: h() })
    if (!r.ok) return []
    return await r.json()
  } catch { return [] }
}
async function post(table, data) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: 'POST', headers: { ...h(), Prefer: 'return=representation' }, body: JSON.stringify(data),
    })
    if (!r.ok) return null
    const rows = await r.json()
    return Array.isArray(rows) ? (rows[0] ?? null) : (rows ?? null)
  } catch { return null }
}
async function postMin(table, data) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
      method: 'POST', headers: { ...h(), Prefer: 'return=minimal' }, body: JSON.stringify(data),
    })
    return r.ok
  } catch { return false }
}
async function patch(table, filter, data) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, {
      method: 'PATCH', headers: { ...h(), Prefer: 'return=minimal' }, body: JSON.stringify(data),
    })
    return r.ok
  } catch { return false }
}
async function upsert(table, data, onConflict) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?on_conflict=${onConflict}`, {
      method: 'POST', headers: { ...h(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(data),
    })
    return r.ok
  } catch { return false }
}
async function del(table, filter) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/${table}?${filter}`, { method: 'DELETE', headers: h() })
    return r.ok
  } catch { return false }
}

// Entrées RH
export const apiGetEntreesRhByWeek = (w) => get('entrees_rh', `semaine_lundi=eq.${w}&order=created_at.asc`)
export const apiAddEntreeRh = (data) => post('entrees_rh', data)
export const apiUpdateEntreeRh = (id, data) => patch('entrees_rh', `id=eq.${id}`, { ...data, updated_at: new Date().toISOString() })
export const apiDeleteEntreeRh = (id) => del('entrees_rh', `id=eq.${id}`)

// Documents entrées — fichierUrl optionnel : omis pour un simple cochage
// manuel (ne touche pas au fichier déjà attaché), string pour un upload,
// null explicite pour retirer le fichier attaché.
export const apiGetDossiersEntree = (entreeId) => get('dossiers_documents_entrant', `entree_id=eq.${entreeId}`)
export const apiUpsertDocumentEntree = (entreeId, typeDocument, rempli, fichierUrl) =>
  upsert('dossiers_documents_entrant', {
    entree_id: entreeId, type_document: typeDocument, rempli,
    ...(fichierUrl !== undefined ? { fichier_url: fichierUrl } : {}),
    updated_at: new Date().toISOString(),
  }, 'entree_id,type_document')

// Candidats
export const apiGetCandidats = () => get('candidats', 'order=created_at.asc')
export const apiAddCandidat = (data) => post('candidats', data)
export const apiUpdateCandidat = (id, data) => patch('candidats', `id=eq.${id}`, { ...data, updated_at: new Date().toISOString() })
/** Supprime un candidat et nettoie les notifications qui pointaient sur lui
 * ou sur ses entretiens (celles-ci ne sont pas liées par FK — les entretiens
 * eux-mêmes partent en cascade via entretiens_recrutement.candidat_id). */
export async function apiDeleteCandidat(id) {
  const entretiens = await get('entretiens_recrutement', `candidat_id=eq.${id}&select=id`)
  await del('notifications', `reference_id=eq.${id}`)
  for (const e of (entretiens || [])) await del('notifications', `reference_id=eq.${e.id}`)
  return del('candidats', `id=eq.${id}`)
}
export const apiGetCandidatsByIds = (ids) => ids?.length ? get('candidats', `id=in.(${ids.join(',')})`) : Promise.resolve([])

// Archives candidats refusés — détection de doublon à la création
export const apiCheckCandidatArchive = async (slug) => {
  const rows = await get('candidats_archives', `slug=eq.${encodeURIComponent(slug)}&order=date_refus.desc&limit=1`)
  return rows?.[0] || null
}
export const apiArchiverCandidat = (data) => postMin('candidats_archives', data)

// Managers (pour résoudre le destinataire d'une demande d'entretien)
export const apiGetManagerByMagasinId = async (magasinId) => {
  const rows = await get('store_managers', `magasin_id=eq.${magasinId}&active=eq.true&limit=1`)
  return rows?.[0] || null
}

// Notifications (même table que demandes_intervention/reporting/mots)
export const apiNotifier = (destinataireLogin, type, referenceId) =>
  postMin('notifications', { destinataire_login: destinataireLogin, type, reference_id: referenceId })

// Entretiens de recrutement
export const apiGetEntretiensByCandidat = (candidatId) => get('entretiens_recrutement', `candidat_id=eq.${candidatId}&order=created_at.desc`)
export const apiGetEntretiensByMagasin = (magasinId) => get('entretiens_recrutement', `magasin_id=eq.${magasinId}&order=created_at.desc`)

export async function apiCreerEntretien({ candidatId, magasinId, managerId, demandeurLogin, dateHeureProposee }) {
  const row = await post('entretiens_recrutement', {
    candidat_id: candidatId, magasin_id: magasinId, manager_id: managerId,
    demandeur_login: demandeurLogin, date_heure_proposee: dateHeureProposee, statut: 'en_attente',
  })
  return row
}

export const apiAccepterEntretien = (id) =>
  patch('entretiens_recrutement', `id=eq.${id}`, { statut: 'acceptee', updated_at: new Date().toISOString() })

export const apiContreProposerEntretien = (id, { dateHeureContreProposee, commentaireManager }) =>
  patch('entretiens_recrutement', `id=eq.${id}`, {
    statut: 'contre_proposition_en_attente',
    date_heure_contre_proposee: dateHeureContreProposee,
    commentaire_manager: commentaireManager || null,
    updated_at: new Date().toISOString(),
  })

/** La RH confirme le créneau alternatif proposé par le manager : celui-ci
 * devient le créneau retenu, l'entretien passe "acceptée". */
export const apiConfirmerContreProposition = (id, dateHeureContreProposee) =>
  patch('entretiens_recrutement', `id=eq.${id}`, {
    statut: 'acceptee',
    date_heure_proposee: dateHeureContreProposee,
    date_heure_contre_proposee: null,
    updated_at: new Date().toISOString(),
  })

export async function apiSupprimerEntretien(id) {
  await del('notifications', `reference_id=eq.${id}`)
  return del('entretiens_recrutement', `id=eq.${id}`)
}

export const apiDeciderEntretien = (id, { noteEntretien, decisionCandidat }) =>
  patch('entretiens_recrutement', `id=eq.${id}`, {
    note_entretien: noteEntretien || null,
    decision_candidat: decisionCandidat,
    decision_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

// Historique
export const apiAddHistorique = (data) => postMin('candidats_historique', data)
export const apiGetHistorique = (candidatId) => get('candidats_historique', `candidat_id=eq.${candidatId}&order=created_at.asc`)

// Documents candidats
export const apiGetDossiersCandidats = (candidatId) => get('dossiers_documents_entrant', `candidat_id=eq.${candidatId}`)
export const apiUpsertDocumentCandidat = (candidatId, typeDocument, rempli, fichierUrl) =>
  upsert('dossiers_documents_entrant', {
    candidat_id: candidatId, type_document: typeDocument, rempli,
    ...(fichierUrl !== undefined ? { fichier_url: fichierUrl } : {}),
    updated_at: new Date().toISOString(),
  }, 'candidat_id,type_document')

// Validation candidat → entrée
export async function apiValiderCandidat({ candidatId, entreePayload, statutPrecedent, login }) {
  const entree = await post('entrees_rh', entreePayload)
  if (!entree) return null
  await patch('dossiers_documents_entrant', `candidat_id=eq.${candidatId}`, { entree_id: entree.id, candidat_id: null })
  await patch('candidats', `id=eq.${candidatId}`, { statut: 'valide', entree_id: entree.id, updated_at: new Date().toISOString() })
  await postMin('candidats_historique', { candidat_id: candidatId, statut_precedent: statutPrecedent, statut_nouveau: 'valide', commentaire: 'Recrutement validé', auteur: login })
  return entree
}

// ── Feature flag — point de contrôle unique ───────────────────────────────────
// Pour activer la sync : UPDATE parametres_app SET valeur='true' WHERE cle='sync_entrees_rh_active';
// Pour la désactiver  : UPDATE parametres_app SET valeur='false' WHERE cle='sync_entrees_rh_active';
async function isSyncActive() {
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/parametres_app?select=valeur&cle=eq.sync_entrees_rh_active`,
      { headers: h() }
    )
    if (!r.ok) return false
    const rows = await r.json()
    return rows?.[0]?.valeur === 'true'
  } catch { return false }
}

// Sync vers trainer_state (formateur) — gardée par le flag sync_entrees_rh_active
export async function apiSyncFormateur(entrees) {
  if (!(await isSyncActive())) return   // <-- interrupteur unique
  const entrees_data = entrees.map(e => ({
    nom: e.nom, prenom: e.prenom, fullName: `${e.nom} ${e.prenom}`,
    magasin: (e.magasin || '').toUpperCase(), heures: e.heures,
    poste: e.poste, telephone: e.telephone, statut_documents: e.statut_documents,
    date_entree: e.date_entree || null,
  }))
  try {
    await fetch(`${SB_URL}/rest/v1/trainer_state?trainer=eq.__weekly__`, {
      method: 'POST',
      headers: { ...h(), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ trainer: '__weekly__', state: { entrees_data }, updated_at: new Date().toISOString() }),
    })
  } catch {}
}

// Mail de bienvenue (candidat accepté, magasins Île-de-France)
export async function apiGetMagasinInfo(magasinId) {
  // Requête dédiée (pas via get()) : besoin d'un select custom avec embed
  // désambiguïsé (magasins a deux relations vers regions), incompatible avec
  // le select=* fixe du helper générique.
  try {
    const url = `${SB_URL}/rest/v1/magasins?id=eq.${magasinId}&select=type_magasin,regions!magasins_region_id_fkey(nom)`
    const r = await fetch(url, { headers: h() })
    if (!r.ok) return { typeMagasin: 'magasin', regionNom: null }
    const rows = await r.json()
    const row = rows?.[0]
    return { typeMagasin: row?.type_magasin || 'magasin', regionNom: row?.regions?.nom || null }
  } catch { return { typeMagasin: 'magasin', regionNom: null } }
}
export async function apiGetEntree(entreeId) {
  const rows = await get('entrees_rh', `id=eq.${entreeId}`)
  return rows?.[0] || null
}
export const apiMarquerMailBienvenueEnvoye = (candidatId) =>
  patch('candidats', `id=eq.${candidatId}`, { mail_bienvenue_envoye_at: new Date().toISOString() })
