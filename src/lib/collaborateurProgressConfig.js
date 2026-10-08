// Configuration du dashboard collaborateur (Ma progression / Cours / Exercices)
// — un seul endroit pour les seuils et le mapping poste → section, comme
// demandé, pour rester facilement modifiable sans aller chercher dans
// plusieurs fichiers.
//
// Important : ces seuils sont INDÉPENDANTS de ceux de la vue manager
// (scoreColor/masteryTier dans StoreFollowupShared.js, seuils 70/40) — deux
// cahiers des charges différents, volontairement pas unifiés ici.

// Seuils du % de maîtrise d'un thème (0-100).
export const SEUIL_ACQUIS = 80
export const SEUIL_A_CONSOLIDER = 50

// Statuts possibles pour un thème, dans l'ordre du plus au moins avancé.
export const STATUT_ACQUIS = 'acquis'
export const STATUT_A_CONSOLIDER = 'a_consolider'
export const STATUT_A_TRAVAILLER = 'a_travailler'
export const STATUT_NON_EVALUE = 'non_evalue'

// Vocabulaire positif, sans jargon, sans mot comme "échec"/"raté" — et pas de
// rouge agressif (teintes calmes, cohérentes avec la palette --lpt/--green
// déjà utilisée dans l'app).
export const STATUT_META = {
  [STATUT_ACQUIS]:        { label: 'Acquis',            color: '#15803d', bg: '#dcfce7', border: '#86efac' },
  [STATUT_A_CONSOLIDER]:  { label: 'À consolider',       color: '#b45309', bg: '#fef3c7', border: '#fcd34d' },
  [STATUT_A_TRAVAILLER]:  { label: 'À travailler',       color: '#0369a1', bg: '#eaf3fd', border: '#bae6fd' },
  [STATUT_NON_EVALUE]:    { label: 'Pas encore évalué',  color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' },
}

/** Pourcentage de maîtrise d'un thème (0-100, ou null si jamais évalué) → statut. */
export function statutPourPct(pct) {
  if (pct == null) return STATUT_NON_EVALUE
  if (pct >= SEUIL_ACQUIS) return STATUT_ACQUIS
  if (pct >= SEUIL_A_CONSOLIDER) return STATUT_A_CONSOLIDER
  return STATUT_A_TRAVAILLER
}

// collaborateurs.poste (code court, formulaire RH) → sectionId de
// SKILL_ITEMS (src/lib/storeFollowupData.js). Mapping dédié à ce dashboard,
// distinct de POSTE_TO_SECTION (src/lib/storeRosterMerge.js, qui attend des
// libellés longs type "conseiller vente optique" pour un usage différent :
// fusion du roster legacy côté formateur/manager) — volontairement pas
// unifié, pour ne rien changer au comportement existant de ce fichier.
export const POSTE_VERS_SECTION = {
  'CVO': 'cvo',
  'MO/SAV': 'mo-sav',
  'OPTICIEN': 'opto',
  'STORE MANAGER': 'manager',
  'Alternant': 'apprenti-alternant',
}

/** sectionId SKILL_ITEMS pour un poste donné (collaborateurs.poste), ou null si inconnu. */
export function sectionPourPoste(poste) {
  return POSTE_VERS_SECTION[(poste || '').trim()] || null
}
