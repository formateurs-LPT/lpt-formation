/**
 * Association magasin → manager(s)
 * Clé = nom du magasin en minuscules (tel que saisi dans entrees_data.magasin)
 * Plusieurs clés peuvent pointer vers le même magasin (variantes d'orthographe).
 * Chaque valeur est un tableau — si deux managers, les deux reçoivent le mail.
 * Email : première lettre du prénom + nom de famille (sans accents, sans espaces) @lunettespourtous.com
 */
export const MANAGERS = {

  // ── Île-de-France ─────────────────────────────────────────────────
  'paris': [
    { name: 'Mickael BOGGI', email: 'mboggi@lunettespourtous.com' },
    { name: 'Romain MAESEELE', email: 'rmaeseele@lunettespourtous.com' },
  ],
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
    { name: 'Maryline BABIN',  email: 'mbabin@lunettespourtous.com' },
    { name: 'Charlotte DENY',  email: 'cdeny@lunettespourtous.com'  },
  ],
  'anglet': [
    { name: 'Maryline BABIN',  email: 'mbabin@lunettespourtous.com' },
    { name: 'Charlotte DENY',  email: 'cdeny@lunettespourtous.com'  },
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
    { name: 'Mathias DARMON', email: 'mdarmon@lunettespourtous.com' },
  ],
  'toulon 83': [
    { name: 'Mathias DARMON', email: 'mdarmon@lunettespourtous.com' },
  ],
  'toulon avenue 83': [
    { name: 'Mathias DARMON', email: 'mdarmon@lunettespourtous.com' },
  ],
  'avenue 83': [
    { name: 'Mathias DARMON', email: 'mdarmon@lunettespourtous.com' },
  ],
  'la valette': [
    { name: 'Mathias DARMON', email: 'mdarmon@lunettespourtous.com' },
  ],
  'toulon mayol': [
    { name: 'Thibaud PONTONE', email: 'tpontone@lunettespourtous.com' },
    { name: 'Henri BOURELY',  email: 'hbourely@lunettespourtous.com' },
  ],
  'mayol': [
    { name: 'Thibaud PONTONE', email: 'tpontone@lunettespourtous.com' },
    { name: 'Henri BOURELY',  email: 'hbourely@lunettespourtous.com' },
  ],
  'toulouse blagnac': [
    { name: 'Maxime BOUSQUET', email: 'mbousquet@lunettespourtous.com' },
  ],
  'blagnac': [
    { name: 'Maxime BOUSQUET', email: 'mbousquet@lunettespourtous.com' },
  ],
  'toulouse': [
    { name: 'Marie-Julie CICUTO', email: 'mjcicuto@lunettespourtous.com' },
  ],
  'toulouse capitole': [
    { name: 'Marie-Julie CICUTO', email: 'mjcicuto@lunettespourtous.com' },
  ],
  'capitole': [
    { name: 'Marie-Julie CICUTO', email: 'mjcicuto@lunettespourtous.com' },
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
  'ixelles': [
    { name: 'Bryan SABBAH', email: 'bsabbah@lunettespourtous.com' },
  ],
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

/** Supprime accents + met en minuscules pour comparaisons robustes */
function norm(s) {
  return (s || '').toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Retrouve la clé MANAGERS correspondant à un magasin.
 * Stratégie : correspondance exacte normalisée, puis partielle (input contient la clé),
 * en préférant la clé la plus longue (plus spécifique) en cas d'ambiguïté — c'est ce qui
 * permet de distinguer les villes à plusieurs magasins (ex: "toulouse blagnac" gagne sur
 * "toulouse" dès que le mot "blagnac" est présent) sans jamais fusionner deux magasins
 * différents d'une même ville.
 */
function matchMagasinKey(magasin) {
  if (!magasin) return null
  const n = norm(magasin)

  const exact = Object.keys(MANAGERS).find(k => norm(k) === n)
  if (exact) return exact

  const partial = Object.keys(MANAGERS)
    .filter(k => n.includes(norm(k)))
    .sort((a, b) => b.length - a.length)
  return partial[0] || null
}

/**
 * Retrouve la liste des managers d'un magasin.
 * @param {string} magasin
 * @returns {{ name: string, email: string }[]}
 */
export function getManagers(magasin) {
  const key = matchMagasinKey(magasin)
  return key ? MANAGERS[key] : []
}

/** Libellés d'affichage propres pour les clés MANAGERS à plusieurs mots. */
const CANONICAL_LABELS = {
  'bordeaux sainte catherine': 'Bordeaux Sainte Catherine',
  'bordeaux bègles':           'Bordeaux Bègles',
  'marseille canebière':       'Marseille Canebière',
  'marseille terrasses':       'Marseille Terrasses du Port',
  'terrasses du port':         'Marseille Terrasses du Port',
  'montpellier comédie':       'Montpellier Comédie',
  'montpellier odysseum':      'Montpellier Odysseum',
  'toulon avenue 83':          'Toulon Avenue 83',
  'toulon mayol':              'Toulon Mayol',
  'toulouse capitole':         'Toulouse Capitole',
  'toulouse blagnac':          'Toulouse Blagnac',
  'bruxelles fripiers':        'Bruxelles Fripiers',
}

function titleCase(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Regroupe les variantes de saisie d'un même magasin sous un nom canonique
 * (ex: "Bayonne" et "Bayonne 35 apprenti" → "Bayonne") — utilisé dans
 * l'historique des retours de formation pour éviter les doublons de tuiles.
 * Réutilise la même correspondance que getManagers, donc les villes à
 * plusieurs magasins (Marseille, Toulouse, Montpellier…) restent bien
 * séparées puisqu'elles ont des clés distinctes.
 * Si aucune clé connue ne correspond, renvoie le magasin tel quel plutôt
 * que de risquer un mauvais regroupement.
 */
export function canonicalMagasinLabel(magasin) {
  if (!magasin) return magasin
  const key = matchMagasinKey(magasin)
  if (!key) return magasin
  return CANONICAL_LABELS[key] || titleCase(key)
}
