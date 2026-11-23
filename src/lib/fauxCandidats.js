// Faux candidats et salle « Test » (19/11) — pour faire de vraies simulations
// de formation (téléphone, TV, écran formateur) sans toucher aux vraies données.
//
// - Visibles et utilisables uniquement par Kevin et Quentin.
// - Ils ne peuvent rejoindre QUE les salles de type « test », et les vrais
//   collaborateurs ne peuvent jamais rejoindre une salle test.
// - Ils ne laissent aucune trace durable : pas de résultats de module ni de
//   bilan de formation (garde-fou dans supabase.js), et une salle test fermée
//   n'est pas archivée dans l'historique (roomArchive.js).
//
// Module sans dépendance : importé par supabase.js, participantNames.js…

export const SALLE_TEST = 'test'

export const FAUX_CANDIDATS = [
  { nom: 'Test', prenom: 'Camille', magasin: 'Magasin test', poste: 'Conseiller de vente', formation_category: SALLE_TEST },
  { nom: 'Test', prenom: 'Hugo', magasin: 'Magasin test', poste: 'Opticien', formation_category: SALLE_TEST },
]

const cle = (nom) => String(nom || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean).sort().join(' ')

const CLES = new Map(FAUX_CANDIDATS.map(c => [cle(`${c.nom} ${c.prenom}`), c]))

/** Fiche du faux candidat correspondant à ce nom (ordre nom/prénom libre), sinon null */
export function fauxCandidat(nom) {
  return CLES.get(cle(nom)) || null
}

export function estFauxCandidat(nom) {
  return CLES.has(cle(nom))
}

/** Nom affiché / enregistré, comme pour un vrai candidat (« Prénom Nom ») */
export function nomFauxCandidat(c) {
  return `${c.prenom} ${c.nom}`
}

/** Seuls Kevin et Quentin voient les faux candidats et la salle test */
export function peutUtiliserSalleTest(nomFormateur) {
  const premier = String(nomFormateur || '').trim().split(/\s+/)[0].toLowerCase()
  return premier === 'kevin' || premier === 'quentin'
}
