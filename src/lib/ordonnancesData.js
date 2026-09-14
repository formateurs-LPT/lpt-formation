// Ordonnances fictives pour l'exercice "Lecture ordonnance" (aucun patient,
// médecin, RPPS ou ADELI réel — tout est inventé). Les bonnes réponses ne
// sont jamais saisies à la main : elles sont dérivées des valeurs
// sphère/cylindre/addition par computeAnswers(), pour éviter toute erreur de
// classification humaine sur les 50 profils.

const DOCTEURS = [
  { nom: 'Docteur Laurence FABIEN', rpps: '10500112233', adeli: '339900112' },
  { nom: 'Docteur Claire FONTENELLE', rpps: '10287456123', adeli: '330894512' },
  { nom: 'Docteur Julien MOREAU', rpps: '10394712658', adeli: '331256478' },
  { nom: 'Docteur Nadia BENALI', rpps: '10456123789', adeli: '330678912' },
]

const CENTRES = [
  { nom: 'CENTRE VISION PARC', adresse: '5 rue des Tilleuls', cp: '33200', ville: 'BORDEAUX', tel: '05 56 99 00 11' },
  { nom: 'CENTRE OPHTALMOLOGIQUE SAINT-JEAN', adresse: '14 avenue de la République', cp: '64100', ville: 'BAYONNE', tel: '05 59 42 18 30' },
  { nom: 'CABINET OPHTALMOLOGIQUE DES ARCADES', adresse: '8 place des Arcades', cp: '31000', ville: 'TOULOUSE', tel: '05 61 23 45 67' },
]

const DATES = [
  '2026-09-14', '2026-08-03', '2026-07-22', '2026-06-10', '2026-05-05',
  '2026-04-18', '2026-03-09', '2026-02-16', '2026-01-27', '2026-09-01',
]

const PATIENTS = [
  ['Marie-Noëlle', 'PETREIN'], ['Jean-Pierre', 'ROUSSEAU'], ['Sophie', 'MARCHAND'], ['Nicolas', 'LEFEVRE'],
  ['Isabelle', 'GAUTIER'], ['Thierry', 'ROBIN'], ['Céline', 'MERCIER'], ['Laurent', 'BLANCHARD'],
  ['Nathalie', 'GUERIN'], ['Olivier', 'MULLER'], ['Sandrine', 'FAURE'], ['Vincent', 'ANDRE'],
  ['Christelle', 'LOPEZ'], ['Fabrice', 'BONNET'], ['Valérie', 'DUMONT'], ['Sébastien', 'LAMBERT'],
  ['Aurélie', 'FONTAINE'], ['Grégory', 'ROUSSET'], ['Delphine', 'GIRARD'], ['Mathieu', 'BOYER'],
  ['Emmanuelle', 'DENIS'], ['Julien', 'LECLERC'], ['Karine', 'MOREL'], ['Fabien', 'MEYER'],
  ['Sylvie', 'DUFOUR'], ['Damien', 'VIDAL'], ['Corinne', 'CARON'], ['Yannick', 'PICARD'],
  ['Patricia', 'ROY'], ['Cyril', 'DESCHAMPS'], ['Véronique', 'MASSON'], ['Franck', 'MEUNIER'],
  ['Elodie', 'BRUN'], ['Bruno', 'LEROUX'], ['Sandra', 'COLIN'], ['Guillaume', 'CHEVALIER'],
  ['Anaïs', 'GAILLARD'], ['Rémi', 'HERVE'], ['Pauline', 'BARBIER'], ['David', 'ARNAUD'],
  ['Camille', 'NOEL'], ['Antoine', 'PERRIN'], ['Léa', 'MORIN'], ['Hugo', 'MATHIEU'],
  ['Manon', 'CLEMENT'], ['Alexandre', 'LEGRAND'], ['Chloé', 'GARCIA'], ['Maxime', 'RENARD'],
  ['Justine', 'PASCAL'], ['Thomas', 'SIMON'],
]

// [sphOD, cylOD, axeOD, sphOG, cylOG, axeOG, add]
// add = 0 => pas d'addition (pas de presbytie)
const PROFILES = [
  // Myope pur (8)
  [-0.75, 0, 0, -1.00, 0, 0, 0],
  [-1.50, 0, 0, -1.25, 0, 0, 0],
  [-2.25, 0, 0, -2.50, 0, 0, 0],
  [-3.00, 0, 0, -3.25, 0, 0, 0],
  [-4.50, 0, 0, -4.00, 0, 0, 0],
  [-5.50, 0, 0, -5.75, 0, 0, 0],
  [-6.25, 0, 0, -6.00, 0, 0, 0],
  [-7.50, 0, 0, -8.00, 0, 0, 0],
  // Hypermétrope pur (6)
  [0.75, 0, 0, 1.00, 0, 0, 0],
  [1.50, 0, 0, 1.25, 0, 0, 0],
  [2.00, 0, 0, 2.25, 0, 0, 0],
  [2.75, 0, 0, 2.50, 0, 0, 0],
  [3.50, 0, 0, 3.75, 0, 0, 0],
  [4.50, 0, 0, 4.25, 0, 0, 0],
  // Myope + astigmate (7)
  [-1.00, -0.50, 10, -1.25, -0.75, 170, 0],
  [-2.00, -1.00, 45, -1.75, -1.25, 135, 0],
  [-2.50, -0.75, 90, -2.75, -0.50, 90, 0],
  [-3.25, -1.50, 20, -3.00, -1.25, 160, 0],
  [-4.00, -0.25, 120, -4.25, -0.50, 60, 0],
  [-5.00, -2.00, 75, -4.75, -1.75, 105, 0],
  [-6.50, -1.25, 30, -6.25, -1.00, 150, 0],
  // Hypermétrope + astigmate (5)
  [1.25, -0.50, 15, 1.50, -0.75, 165, 0],
  [2.00, -1.00, 100, 1.75, -1.25, 80, 0],
  [2.50, -0.25, 50, 2.75, -0.50, 130, 0],
  [3.00, -1.50, 175, 3.25, -1.25, 5, 0],
  [3.75, -0.75, 60, 3.50, -1.00, 120, 0],
  // Astigmate pur (4)
  [0, -0.75, 10, 0, -1.00, 170, 0],
  [0, -1.25, 90, 0, -1.50, 90, 0],
  [0, -0.50, 45, 0, -0.75, 135, 0],
  [0, -1.75, 60, 0, -2.00, 120, 0],
  // Myope + presbyte (4)
  [-1.50, 0, 0, -1.75, 0, 0, 1.00],
  [-2.25, 0, 0, -2.00, 0, 0, 1.50],
  [-3.50, 0, 0, -3.25, 0, 0, 2.00],
  [-4.75, 0, 0, -5.00, 0, 0, 2.50],
  // Hypermétrope + presbyte (3)
  [1.00, 0, 0, 1.25, 0, 0, 1.25],
  [2.25, 0, 0, 2.00, 0, 0, 2.00],
  [3.00, 0, 0, 3.25, 0, 0, 2.75],
  // Presbyte pur (4)
  [0, 0, 0, 0, 0, 0, 1.00],
  [0, 0, 0, 0, 0, 0, 1.75],
  [0, 0, 0, 0, 0, 0, 2.25],
  [0, 0, 0, 0, 0, 0, 3.00],
  // Myope + astigmate + presbyte (4)
  [-5.00, -0.25, 105, -5.00, -0.75, 160, 1.50],
  [-2.00, -1.00, 20, -2.25, -1.25, 160, 1.25],
  [-3.75, -0.50, 90, -3.50, -0.75, 90, 2.00],
  [-6.00, -1.50, 45, -5.75, -1.75, 135, 2.50],
  // Hypermétrope + astigmate + presbyte (3)
  [1.75, -0.75, 10, 2.00, -1.00, 170, 1.50],
  [2.50, -0.50, 60, 2.25, -0.25, 120, 2.00],
  [3.25, -1.25, 100, 3.50, -1.00, 80, 2.75],
  // Anisométropie (un œil myope, l'autre hypermétrope) — cas avancés (2)
  [-2.00, 0, 0, 1.50, 0, 0, 0],
  [-1.50, -0.50, 30, 2.00, -0.75, 150, 1.75],
]

// La plupart des ordonnances écrivent "Sphère (Cylindre Axe°)" — quelques-unes
// gardent l'ordre "(Axe° Cylindre) Sphère" de l'ordonnance de référence, pour
// habituer les collaborateurs aux deux présentations qu'ils croiseront en vrai.
const ORDER_OVERRIDES = new Set([14, 18, 23, 27, 42, 46, 49])

function computeAnswers(od, og) {
  const set = new Set()
  if (od.sph < 0 || og.sph < 0) set.add('myope')
  if (od.sph > 0 || og.sph > 0) set.add('hypermetrope')
  if (od.cyl !== 0 || og.cyl !== 0) set.add('astigmate')
  if (od.add > 0 || og.add > 0) set.add('presbyte')
  return [...set]
}

export const ORDONNANCES = PROFILES.map((p, i) => {
  const [sphOD, cylOD, axeOD, sphOG, cylOG, axeOG, add] = p
  const od = { sph: sphOD, cyl: cylOD, axe: axeOD, add }
  const og = { sph: sphOG, cyl: cylOG, axe: axeOG, add }
  const [prenom, nom] = PATIENTS[i]
  const docteur = DOCTEURS[i % DOCTEURS.length]
  const centre = CENTRES[i % CENTRES.length]
  return {
    id: `ord-${i + 1}`,
    prenom, nom,
    dateISO: DATES[i % DATES.length],
    docteur, centre,
    od, og,
    typeVerres: add > 0 ? 'Progressifs' : 'Unifocal',
    answers: computeAnswers(od, og),
    order: ORDER_OVERRIDES.has(i) ? 'cyl-first' : 'sph-first',
  }
})

export const ORDONNANCE_CATEGORIES = [
  { key: 'myope', label: 'Myope' },
  { key: 'hypermetrope', label: 'Hypermétrope' },
  { key: 'astigmate', label: 'Astigmate' },
  { key: 'presbyte', label: 'Presbyte' },
]

export function formatOrdonnanceDate(dateISO) {
  const d = new Date(`${dateISO}T00:00:00`)
  const s = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return `le ${s}`
}

function fmtSigned(v) {
  if (v === 0) return '0.00'
  return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)
}

// order: 'sph-first' (Sphère (Cylindre Axe°) — ordre le plus courant) ou
// 'cyl-first' ((Axe° Cylindre) Sphère — comme l'ordonnance de référence).
export function formatEyeLine(eye, order = 'sph-first') {
  const sph = fmtSigned(eye.sph)
  let line
  if (eye.cyl === 0) {
    line = sph
  } else if (order === 'cyl-first') {
    line = `(${eye.axe}° ${eye.cyl.toFixed(2)}) ${sph}`
  } else {
    line = `${sph} (${eye.cyl.toFixed(2)} ${eye.axe}°)`
  }
  if (eye.add > 0) line += `, Addition ${fmtSigned(eye.add)}`
  return line
}

// Tire n ordonnances au hasard parmi les 50, sans doublon — à appeler
// uniquement côté client (au montage de l'exercice), jamais au niveau module.
export function pickRandomOrdonnances(n = 5) {
  const shuffled = [...ORDONNANCES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n)
}
