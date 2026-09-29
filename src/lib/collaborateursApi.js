// Couche données pour le nouveau schéma relationnel (magasins/collaborateurs
// /quiz_resultats) — flux "nouvel entrant → test de sortie → validation
// manager", indépendant de l'ancien système entrees_data/STORES codé en dur
// dans storeFollowupData.js (script 2, ajout uniquement).
import { sbSelect, sbUpdate, sbInsert } from '@/lib/supabase'

export async function getMagasinIdBySlug(slug) {
  if (!slug) return null
  const rows = await sbSelect('magasins', `slug=eq.${encodeURIComponent(slug)}`)
  return rows?.[0]?.id || null
}

/** Tous les collaborateurs actifs d'un magasin — source du @mention dans les
 * notes terrain (script refonte reporting hebdo). */
export async function getCollaborateursByMagasin(magasinId) {
  if (!magasinId) return []
  const rows = await sbSelect('collaborateurs', `magasin_id=eq.${magasinId}&order=prenom.asc`)
  return rows || []
}

/** Collaborateurs avec statut='nouveau' pour ce magasin — pas encore testés. */
export async function getNouveauxCollaborateurs(magasinId) {
  if (!magasinId) return []
  const rows = await sbSelect(
    'collaborateurs',
    `magasin_id=eq.${magasinId}&statut=eq.nouveau&order=created_at.asc`
  )
  return rows || []
}

/** Collaborateurs ayant fini le test mais pas encore validés par le manager. */
export async function getCollaborateursEnAttenteValidation(magasinId) {
  if (!magasinId) return []
  const rows = await sbSelect(
    'collaborateurs',
    `magasin_id=eq.${magasinId}&test_termine_at=not.is.null&manager_a_valide=eq.false&order=test_termine_at.asc`
  )
  return rows || []
}

export async function declencherTestSortie(collaborateurId) {
  return sbUpdate('collaborateurs', { test_declenche_at: new Date().toISOString() }, `id=eq.${collaborateurId}`)
}

export async function validerNouvelEntrant(collaborateurId) {
  return sbUpdate('collaborateurs', { statut: 'actif', manager_a_valide: true }, `id=eq.${collaborateurId}`)
}

function stripAccents(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}
function slugifyName(prenom, nom) {
  return stripAccents(`${prenom} ${nom}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Relie un nom saisi dans l'ancien système (entrees_data, "NOM Prenom") au
 * collaborateur correspondant du nouveau schéma relationnel, pour brancher
 * le flux test de sortie sur la tuile "Nouveaux collaborateurs" (qui ne vient
 * pas de la table collaborateurs). Tolérant casse/accents ; pas de lien
 * garanti si le collaborateur n'a pas encore été migré dans la table. */
export async function findCollaborateurByName(magasinId, prenom, nom) {
  if (!magasinId || !prenom || !nom) return null
  const slug = slugifyName(prenom, nom)
  const rows = await sbSelect('collaborateurs', `magasin_id=eq.${magasinId}&slug=eq.${encodeURIComponent(slug)}`)
  return rows?.[0] || null
}

/** Comme findCollaborateurByName, mais crée la fiche (statut 'nouveau') si
 * elle n'existe pas encore — pour que le bouton "Lancer le test de sortie"
 * soit toujours disponible sur la tuile "Nouveaux collaborateurs", même
 * avant que quelqu'un n'ait migré la personne dans la table collaborateurs. */
export async function getOrCreateCollaborateurForEntree(magasinId, prenom, nom, poste) {
  const existing = await findCollaborateurByName(magasinId, prenom, nom)
  if (existing) return existing
  const slug = slugifyName(prenom, nom)
  const ok = await sbInsert('collaborateurs', {
    magasin_id: magasinId, slug, prenom, nom, poste: poste || null, statut: 'nouveau',
  })
  if (!ok) return null
  const rows = await sbSelect('collaborateurs', `magasin_id=eq.${magasinId}&slug=eq.${encodeURIComponent(slug)}`)
  return rows?.[0] || null
}

// ── Résultats des tests (page formateur Kevin/Quentin) ──────────────────

/** Bornes de dates pour chaque préréglage de période. */
export function periodBounds(period, customFrom, customTo) {
  const now = new Date()
  const end = new Date(now)
  end.setHours(23, 59, 59, 999)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)

  if (period === 'semaine') {
    const day = start.getDay()
    start.setDate(start.getDate() - ((day + 6) % 7)) // lundi de cette semaine
  } else if (period === 'mois') {
    start.setDate(1)
  } else if (period === 'trimestre') {
    const q = Math.floor(start.getMonth() / 3)
    start.setMonth(q * 3, 1)
  } else if (period === 'annee') {
    start.setMonth(0, 1)
  } else if (period === 'custom') {
    return {
      from: customFrom ? `${customFrom}T00:00:00.000Z` : null,
      to: customTo ? `${customTo}T23:59:59.999Z` : null,
    }
  }
  return { from: start.toISOString(), to: end.toISOString() }
}

/**
 * Résultats de tests sur la période, avec le nom du collaborateur et son
 * magasin déjà résolus (2 requêtes + jointure en mémoire — le volume attendu
 * ne justifie pas une vraie jointure SQL via PostgREST ici).
 */
export async function getQuizResultats({ from, to }) {
  let filter = 'order=date_passation.desc'
  if (from) filter += `&date_passation=gte.${encodeURIComponent(from)}`
  if (to) filter += `&date_passation=lte.${encodeURIComponent(to)}`
  const [resultats, collaborateurs, magasins] = await Promise.all([
    sbSelect('quiz_resultats', filter),
    sbSelect('collaborateurs', 'select=id,prenom,nom,magasin_id'),
    sbSelect('magasins', 'select=id,nom'),
  ])
  const collabById = Object.fromEntries((collaborateurs || []).map(c => [c.id, c]))
  const magasinById = Object.fromEntries((magasins || []).map(m => [m.id, m]))
  return (resultats || []).map(r => {
    const collab = collabById[r.collaborateur_id]
    return {
      ...r,
      prenom: collab?.prenom || '—',
      nom: collab?.nom || '',
      magasin: collab ? (magasinById[collab.magasin_id]?.nom || '—') : '—',
    }
  })
}
