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

// Documents entrées
export const apiGetDossiersEntree = (entreeId) => get('dossiers_documents_entrant', `entree_id=eq.${entreeId}`)
export const apiUpsertDocumentEntree = (entreeId, typeDocument, rempli) =>
  upsert('dossiers_documents_entrant', { entree_id: entreeId, type_document: typeDocument, rempli, updated_at: new Date().toISOString() }, 'entree_id,type_document')

// Candidats
export const apiGetCandidats = () => get('candidats', 'order=created_at.asc')
export const apiAddCandidat = (data) => post('candidats', data)
export const apiUpdateCandidat = (id, data) => patch('candidats', `id=eq.${id}`, { ...data, updated_at: new Date().toISOString() })

// Historique
export const apiAddHistorique = (data) => postMin('candidats_historique', data)
export const apiGetHistorique = (candidatId) => get('candidats_historique', `candidat_id=eq.${candidatId}&order=created_at.asc`)

// Documents candidats
export const apiGetDossiersCandidats = (candidatId) => get('dossiers_documents_entrant', `candidat_id=eq.${candidatId}`)
export const apiUpsertDocumentCandidat = (candidatId, typeDocument, rempli) =>
  upsert('dossiers_documents_entrant', { candidat_id: candidatId, type_document: typeDocument, rempli, updated_at: new Date().toISOString() }, 'candidat_id,type_document')

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
  }))
  try {
    await fetch(`${SB_URL}/rest/v1/trainer_state?trainer=eq.__weekly__`, {
      method: 'POST',
      headers: { ...h(), Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ trainer: '__weekly__', state: { entrees_data }, updated_at: new Date().toISOString() }),
    })
  } catch {}
}
