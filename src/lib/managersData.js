/**
 * Association magasin → manager
 * Clé = nom du magasin en minuscules (tel que stocké dans entrees_data.magasin)
 * Remplis les champs name et email pour chaque magasin.
 */
export const MANAGERS = {
  // Île-de-France
  'chatelet':      { name: '', email: '' },
  'st lazare':     { name: '', email: '' },
  'saint lazare':  { name: '', email: '' },
  'montparnasse':  { name: '', email: '' },
  'italie':        { name: '', email: '' },
  'commerce':      { name: '', email: '' },
  'bastille':      { name: '', email: '' },
  'cergy':         { name: '', email: '' },
  'creteil':       { name: '', email: '' },
  'créteil':       { name: '', email: '' },
  'belle epine':   { name: '', email: '' },
  'belle épine':   { name: '', email: '' },
  'st ouen':       { name: '', email: '' },
  'saint ouen':    { name: '', email: '' },
  'beauchamp':     { name: '', email: '' },
  'odysseum':      { name: '', email: '' },
  // Belgique
  'namur':         { name: '', email: '' },
  'liege':         { name: '', email: '' },
  'liège':         { name: '', email: '' },
  'ixelles':       { name: '', email: '' },
  'charleroi':     { name: '', email: '' },
  'bruxelles':     { name: '', email: '' },
  // Ajoute ici les autres magasins si besoin
}

/**
 * Retrouve le manager d'un magasin.
 * @param {string} magasin - nom brut du magasin
 * @returns {{ name: string, email: string } | null}
 */
export function getManager(magasin) {
  if (!magasin) return null
  const key = magasin.toLowerCase().trim()
  return MANAGERS[key] || null
}
