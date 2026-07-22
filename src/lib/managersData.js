/**
 * Association magasin → manager(s)
 * Clé = nom du magasin en minuscules (tel que saisi dans entrees_data.magasin)
 * Plusieurs clés peuvent pointer vers le même magasin (variantes d'orthographe).
 * Chaque valeur est un tableau — si deux managers, les deux reçoivent le mail.
 * Email : première lettre du prénom + nom de famille (sans accents, sans espaces) @lunettespourtous.com
 */
export const MANAGERS = {

  // ── Île-de-France ─────────────────────────────────────────────────
  'montparnasse': [
    { name: 'Victor LEJON', email: 'vlejon@lunettespourtous.com' },
  ],
  'saint lazare': [
    { name: 'Yssoufe SANGARÉ', email: 'ysangare@lunettespourtous.com' },
  ],
  'st lazare': [
    { name: 'Yssoufe SANGARÉ', email: 'ysangare@lunettespourtous.com' },
  ],
  'bastille': [
    { name: 'Amadou BARRY', email: 'abarry@lunettespourtous.com' },
  ],
  'faubourg': [
    { name: 'Amadou BARRY', email: 'abarry@lunettespourtous.com' },
  ],
  'italie': [
    { name: 'Vincent SMADJA', email: 'vsmadja@lunettespourtous.com' },
  ],
  'commerce': [
    { name: 'Steve MAILLARD', email: 'smaillard@lunettespourtous.com' },
  ],
  'creteil': [
    { name: 'Toufik BOUKRICHE', email: 'tboukriche@lunettespourtous.com' },
    { name: 'Tracy SIANGANY',   email: 'tsiangany@lunettespourtous.com' },
  ],
  'créteil': [
    { name: 'Toufik BOUKRICHE', email: 'tboukriche@lunettespourtous.com' },
    { name: 'Tracy SIANGANY',   email: 'tsiangany@lunettespourtous.com' },
  ],
  'belle epine': [
    { name: 'Nicolas ROBERT', email: 'nrobert@lunettespourtous.com' },
  ],
  'belle épine': [
    { name: 'Nicolas ROBERT', email: 'nrobert@lunettespourtous.com' },
  ],
  'cergy': [
    { name: 'Soufiane MAMMERI', email: 'smammeri@lunettespourtous.com' },
  ],

  // ── Province ──────────────────────────────────────────────────────
  'bayonne': [
    { name: 'Maryline BABIN', email: 'mbabin@lunettespourtous.com' },
  ],
  'anglet': [
    { name: 'Maryline BABIN', email: 'mbabin@lunettespourtous.com' },
  ],
  'bordeaux': [
    { name: 'Fanny MERLAUD',    email: 'fmerlaud@lunettespourtous.com' },
    { name: 'Myriam OUFRASSI',  email: 'moufrassi@lunettespourtous.com' },
  ],
  'bordeaux sainte catherine': [
    { name: 'Fanny MERLAUD',    email: 'fmerlaud@lunettespourtous.com' },
    { name: 'Myriam OUFRASSI',  email: 'moufrassi@lunettespourtous.com' },
  ],
  'bordeaux ste catherine': [
    { name: 'Fanny MERLAUD',    email: 'fmerlaud@lunettespourtous.com' },
    { name: 'Myriam OUFRASSI',  email: 'moufrassi@lunettespourtous.com' },
  ],
  'sainte catherine': [
    { name: 'Fanny MERLAUD',    email: 'fmerlaud@lunettespourtous.com' },
    { name: 'Myriam OUFRASSI',  email: 'moufrassi@lunettespourtous.com' },
  ],
  'bordeaux bègles': [
    { name: 'Victoria DUCROCQ VELAY', email: 'vducrocqvelay@lunettespourtous.com' },
  ],
  'bordeaux begles': [
    { name: 'Victoria DUCROCQ VELAY', email: 'vducrocqvelay@lunettespourtous.com' },
  ],
  'bègles': [
    { name: 'Victoria DUCROCQ VELAY', email: 'vducrocqvelay@lunettespourtous.com' },
  ],
  'begles': [
    { name: 'Victoria DUCROCQ VELAY', email: 'vducrocqvelay@lunettespourtous.com' },
  ],
  'lille': [
    { name: 'Julien MACALOU', email: 'jmacalou@lunettespourtous.com' },
  ],
  'lyon': [
    { name: 'Magdalena LEFEBVRE', email: 'mlefebvre@lunettespourtous.com' },
  ],
  'marseille': [
    { name: 'Fadji HAKIM', email: 'fhakim@lunettespourtous.com' },
  ],
  'marseille canebière': [
    { name: 'Fadji HAKIM', email: 'fhakim@lunettespourtous.com' },
  ],
  'marseille la canebière': [
    { name: 'Fadji HAKIM', email: 'fhakim@lunettespourtous.com' },
  ],
  'la canebière': [
    { name: 'Fadji HAKIM', email: 'fhakim@lunettespourtous.com' },
  ],
  'marseille terrasses': [
    { name: 'Mathias DARMON', email: 'mdarmon@lunettespourtous.com' },
  ],
  'terrasses du port': [
    { name: 'Mathias DARMON', email: 'mdarmon@lunettespourtous.com' },
  ],
  'terrasses': [
    { name: 'Mathias DARMON', email: 'mdarmon@lunettespourtous.com' },
  ],
  'montpellier': [
    { name: 'Maya GRESLAND', email: 'mgresland@lunettespourtous.com' },
  ],
  'montpellier comédie': [
    { name: 'Maya GRESLAND', email: 'mgresland@lunettespourtous.com' },
  ],
  'montpellier comedie': [
    { name: 'Maya GRESLAND', email: 'mgresland@lunettespourtous.com' },
  ],
  'comédie': [
    { name: 'Maya GRESLAND', email: 'mgresland@lunettespourtous.com' },
  ],
  'comedie': [
    { name: 'Maya GRESLAND', email: 'mgresland@lunettespourtous.com' },
  ],
  'montpellier odysseum': [
    { name: 'Akim VANDEVOIR', email: 'avandevoir@lunettespourtous.com' },
  ],
  'odysseum': [
    { name: 'Akim VANDEVOIR', email: 'avandevoir@lunettespourtous.com' },
  ],
  'nantes': [
    { name: 'Sophie COURBEBAISSE', email: 'scourbebaisse@lunettespourtous.com' },
  ],
  'nice': [
    { name: 'David VOISIN',  email: 'dvoisin@lunettespourtous.com' },
    { name: 'Vichay RIVARD', email: 'vrivard@lunettespourtous.com' },
  ],
  'reims': [
    { name: 'Lucie LE BERRE', email: 'lleberre@lunettespourtous.com' },
  ],
  'rennes': [
    { name: 'Thi Huong PHAM', email: 'tpham@lunettespourtous.com' },
  ],
  'rouen': [
    { name: 'Aline THURIN', email: 'athurin@lunettespourtous.com' },
  ],
  'strasbourg': [
    { name: 'Nathanael PEREZ', email: 'nperez@lunettespourtous.com' },
  ],
  'toulon': [
    { name: 'Manon DEMORE', email: 'mdemore@lunettespourtous.com' },
  ],
  'toulon 83': [
    { name: 'Manon DEMORE', email: 'mdemore@lunettespourtous.com' },
  ],
  'la valette': [
    { name: 'Manon DEMORE', email: 'mdemore@lunettespourtous.com' },
  ],
  'toulon mayol': [
    { name: 'Thibaud PONTONE', email: 'tpontone@lunettespourtous.com' },
  ],
  'mayol': [
    { name: 'Thibaud PONTONE', email: 'tpontone@lunettespourtous.com' },
  ],
  'toulouse blagnac': [
    { name: 'Maxime BOUSQUET', email: 'mbousquet@lunettespourtous.com' },
  ],
  'blagnac': [
    { name: 'Maxime BOUSQUET', email: 'mbousquet@lunettespourtous.com' },
  ],
  'toulouse': [
    { name: 'Marie-Julie CICUTO', email: 'mcicuto@lunettespourtous.com' },
  ],
  'toulouse capitole': [
    { name: 'Marie-Julie CICUTO', email: 'mcicuto@lunettespourtous.com' },
  ],
  'capitole': [
    { name: 'Marie-Julie CICUTO', email: 'mcicuto@lunettespourtous.com' },
  ],

  // ── Belgique ──────────────────────────────────────────────────────
  'fripier': [
    { name: 'Gwen TATE FERREIRA DOS SANTOS', email: 'gtateferreiradossantos@lunettespourtous.com' },
  ],
  'fripiers': [
    { name: 'Gwen TATE FERREIRA DOS SANTOS', email: 'gtateferreiradossantos@lunettespourtous.com' },
  ],
  'bruxelles fripiers': [
    { name: 'Gwen TATE FERREIRA DOS SANTOS', email: 'gtateferreiradossantos@lunettespourtous.com' },
  ],
  // ixelles : pas de manager actuellement
  'charleroi': [
    { name: 'Maxime DOUMONT', email: 'mdoumont@lunettespourtous.com' },
  ],
  'liege': [
    { name: 'Marie KOUTSOUDAKIS', email: 'mkoutsoudakis@lunettespourtous.com' },
  ],
  'liège': [
    { name: 'Marie KOUTSOUDAKIS', email: 'mkoutsoudakis@lunettespourtous.com' },
  ],
  'namur': [
    { name: 'Matteo FEBBRARIELLO', email: 'mfebbrariello@lunettespourtous.com' },
  ],
}

/**
 * Retrouve la liste des managers d'un magasin.
 * @param {string} magasin
 * @returns {{ name: string, email: string }[]}
 */
export function getManagers(magasin) {
  if (!magasin) return []
  const key = magasin.toLowerCase().trim()
  return MANAGERS[key] || []
}
