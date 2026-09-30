// Liste des documents du dossier RH et calcul du statut complet/incomplet —
// source unique partagée entre l'espace RH (src/app/rh/page.js) et l'espace
// collaborateur (src/app/espace-collaborateur/page.js), pour que les deux
// écrans voient exactement la même chose sans dupliquer la logique.

export const DOCS_TOUJOURS = [
  { id: 'piece_identite', label: "Pièce d'identité (recto verso)" },
  { id: 'rib', label: 'RIB' },
  { id: 'secu_vitale', label: 'Attestation sécu sociale ou carte Vitale' },
  { id: 'casier_judiciaire', label: 'Extrait de casier judiciaire' },
]
export const DOCS_DOMICILE_PERSO = [{ id: 'justificatif_domicile', label: 'Justificatif de domicile' }]
export const DOCS_DOMICILE_HEBERGE = [
  { id: 'identite_hebergeur', label: "Pièce d'identité de l'hébergeur" },
  { id: 'domicile_hebergeur', label: "Justificatif de domicile de l'hébergeur" },
  { id: 'attestation_honneur', label: "Attestation sur l'honneur" },
]
export const DOCS_RQTH = [{ id: 'rqth', label: 'Attestation RQTH' }]

export function getDocsRequis(entity) {
  const docs = [...DOCS_TOUJOURS]
  if (entity.mode_domicile === 'heberge') docs.push(...DOCS_DOMICILE_HEBERGE)
  else docs.push(...DOCS_DOMICILE_PERSO)
  if (entity.rqth_applicable) docs.push(...DOCS_RQTH)
  return docs
}

export function computeStatut(entity, dossiers) {
  const requis = getDocsRequis(entity)
  const remplis = new Set(dossiers.filter(d => d.rempli).map(d => d.type_document))
  const docsOk = requis.every(d => remplis.has(d.id))
  const contactOk = (entity.contact_urgence_nom || '').trim() && (entity.contact_urgence_telephone || '').trim()
  return docsOk && contactOk ? 'complet' : 'incomplet'
}
