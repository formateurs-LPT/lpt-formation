// Couche données — script 4 (notes collaborateur collaboratives + retour
// individuel). Même schéma relationnel que collaborateursApi.js/notesTerrainApi.js.
import { sbSelect, sbInsert, sbUpdate, sbDelete } from '@/lib/supabase'
import { getMagasinIdBySlug } from '@/lib/collaborateursApi'

export { getFormateurId } from '@/lib/notesTerrainApi'

function stripAccents(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Convention login/mail de l'entreprise : 1ère lettre du prénom + nom, sans accents/espaces. */
export function deriveEmail(prenom, nom) {
  const firstLetter = stripAccents(prenom).trim().toLowerCase().charAt(0)
  const nomClean = stripAccents(nom).trim().toLowerCase().replace(/[^a-z]/g, '')
  if (!firstLetter || !nomClean) return null
  return `${firstLetter}${nomClean}@lunettespourtous.com`
}

/** Résout l'id réel (uuid) d'un collaborateur à partir du slug magasin + slug collaborateur
 *  utilisés côté ancien système (storeFollowupData.js). */
export async function getCollaborateurDbId(magasinSlug, collaborateurSlug) {
  const magasinId = await getMagasinIdBySlug(magasinSlug)
  if (!magasinId) return null
  const rows = await sbSelect('collaborateurs', `magasin_id=eq.${magasinId}&slug=eq.${encodeURIComponent(collaborateurSlug)}&select=id`)
  return rows?.[0]?.id || null
}

/** Destinataires du retour individuel : le collaborateur + le(s) manager(s) actif(s) de son magasin. */
export async function getCollaborateurEmails(collaborateurId) {
  const rows = await sbSelect('collaborateurs', `id=eq.${collaborateurId}&select=prenom,nom,magasin_id`)
  const collab = rows?.[0]
  if (!collab) return { collaborateurEmail: null, managerEmails: [] }
  const collaborateurEmail = deriveEmail(collab.prenom, collab.nom)
  const managers = await sbSelect('store_managers', `magasin_id=eq.${collab.magasin_id}&active=eq.true&select=display_name`)
  const managerEmails = (managers || [])
    .map(m => {
      const [prenom, ...rest] = (m.display_name || '').trim().split(/\s+/)
      return deriveEmail(prenom, rest.join(' '))
    })
    .filter(Boolean)
  return { collaborateurEmail, managerEmails }
}

/** Notes de suivi d'un collaborateur, tous formateurs, éditables par tous, avec auteur/éditeur résolus. */
export async function getNotesCollaborateur(collaborateurId) {
  if (!collaborateurId) return []
  const rows = await sbSelect('notes_collaborateur', `collaborateur_id=eq.${collaborateurId}&order=created_at.desc`)
  if (!rows?.length) return []
  const ids = [...new Set(rows.flatMap(r => [r.formateur_id, r.dernier_editeur_id]).filter(Boolean))]
  const trainers = ids.length ? await sbSelect('trainers', `id=in.(${ids.join(',')})&select=id,display_name`) : []
  const nameById = Object.fromEntries((trainers || []).map(t => [t.id, t.display_name]))
  return rows.map(r => ({
    ...r,
    auteurNom: nameById[r.formateur_id] || 'Formateur',
    editeurNom: r.dernier_editeur_id ? (nameById[r.dernier_editeur_id] || 'Formateur') : null,
  }))
}

export async function addNoteCollaborateur({ collaborateurId, formateurId, contenu }) {
  return sbInsert('notes_collaborateur', { collaborateur_id: collaborateurId, formateur_id: formateurId, contenu })
}

/** Modification ouverte à tout formateur — trace qui a modifié et quand. */
export async function updateNoteCollaborateur({ id, contenu, editeurId }) {
  return sbUpdate('notes_collaborateur', {
    contenu, dernier_editeur_id: editeurId, derniere_modification_at: new Date().toISOString(),
  }, `id=eq.${id}`)
}

/** Suppression réservée à l'auteur original — filtre sur formateur_id en plus de l'id. */
export async function deleteNoteCollaborateur({ id, requesterId }) {
  return sbDelete('notes_collaborateur', `id=eq.${id}&formateur_id=eq.${requesterId}`)
}

/** Brouillons du retour individuel en cours (vidés à l'envoi). */
export async function getRetoursNotes(collaborateurId) {
  if (!collaborateurId) return []
  const rows = await sbSelect('retours_individuels_notes', `collaborateur_id=eq.${collaborateurId}&order=created_at.asc`)
  return rows || []
}

export async function addRetourNote({ collaborateurId, formateurId, contenu }) {
  return sbInsert('retours_individuels_notes', { collaborateur_id: collaborateurId, formateur_id: formateurId, contenu })
}

export async function deleteRetourNote(id) {
  return sbDelete('retours_individuels_notes', `id=eq.${id}`)
}

/** Historique des retours déjà envoyés à ce collaborateur. */
export async function getRetoursEnvoyes(collaborateurId) {
  if (!collaborateurId) return []
  const rows = await sbSelect('retours_individuels_envoyes', `collaborateur_id=eq.${collaborateurId}&order=envoye_at.desc`)
  return rows || []
}

/** Archive le retour final envoyé et vide les brouillons de la semaine. */
export async function envoyerRetourIndividuel({ collaborateurId, formateurId, contenuFinal }) {
  const ok = await sbInsert('retours_individuels_envoyes', {
    collaborateur_id: collaborateurId, formateur_id: formateurId, contenu_final: contenuFinal,
  })
  if (ok) await sbDelete('retours_individuels_notes', `collaborateur_id=eq.${collaborateurId}`)
  return ok
}
