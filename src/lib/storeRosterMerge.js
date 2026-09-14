import { matchMagasinKey } from './managersData'
import { normalizeNameKey } from './trainerAccounts'

// Seuls les postes correspondant à un des deux sets d'items de compétence
// (cvo / mo-sav) sont fusionnés automatiquement — les autres rôles (Store
// Manager, Assistant RH, Employé Logistique Polyvalent) et les entrées sans
// poste renseigné (fréquent sur l'ajout manuel dans l'outil Entrées) restent
// hors du suivi de compétences, faute d'items définis pour eux. Ils restent
// ajoutables à la main comme aujourd'hui dans storeFollowupData.js.
const POSTE_TO_SECTION = {
  'conseiller vente optique': 'cvo',
  'opticien lunetier': 'cvo',
  'monteur optique sav': 'mo-sav',
}

function classifyPoste(poste) {
  return POSTE_TO_SECTION[(poste || '').trim().toLowerCase()] || null
}

// entrees_data.heures est saisi librement ("35", "35h"…) — normalise pour un
// affichage cohérent avec le roster codé en dur (toujours suffixé "h").
function formatContrat(heures) {
  const h = (heures || '').trim()
  if (!h) return ''
  return /^\d+$/.test(h) ? `${h}h` : h
}

// Slug lisible (ordre prénom-nom préservé) — distinct de normalizeNameKey qui
// trie les mots alphabétiquement et sert uniquement à la comparaison/dédup.
function slugify(prenom, nom) {
  return `${prenom || ''} ${nom || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Fusionne les entrées d'entrees_data correspondant à ce magasin dans son
 * roster — sans muter `store` ni `entreesData`, appelable à chaque render.
 * @param {object} store  un élément de STORES (storeFollowupData.js)
 * @param {object[]} entreesData  entrees_data brut (getWeeklySharedState())
 */
export function mergeEntreesIntoRoster(store, entreesData) {
  const existingKeys = new Set(
    store.sections.flatMap(s => s.collaborateurs.map(c => normalizeNameKey(`${c.prenom} ${c.nom}`)))
  )
  const additions = {}

  for (const e of entreesData || []) {
    if (matchMagasinKey(e.magasin) !== store.id) continue
    const sectionId = classifyPoste(e.poste)
    if (!sectionId) continue
    const key = normalizeNameKey(e.fullName || `${e.nom} ${e.prenom}`)
    if (!key || existingKeys.has(key)) continue
    existingKeys.add(key)
    const id = slugify(e.prenom, e.nom)
    if (!id) continue
    ;(additions[sectionId] ||= []).push({
      id, prenom: e.prenom, nom: e.nom, contrat: formatContrat(e.heures), entree: null,
    })
  }

  return {
    ...store,
    sections: store.sections.map(s => (
      additions[s.id]
        ? { ...s, collaborateurs: [...s.collaborateurs, ...additions[s.id]] }
        : s
    )),
  }
}
