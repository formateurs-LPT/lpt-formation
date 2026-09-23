// Script ponctuel — import des effectifs magasins depuis un export Skello
// (fichier .xlsx, un onglet par magasin + un onglet "Lecture" à ignorer).
// Génère un fichier SQL (jamais commité — contient des données personnelles)
// à exécuter manuellement via .claude-scripts/psql-connect.sh.
//
// Réutilisable pour les prochains lots : changer SOURCE_FILE et STORE_MAP.
import ExcelJS from 'exceljs'
import { randomUUID } from 'node:crypto'
import { writeFileSync } from 'node:fs'

const SOURCE_FILE = new URL('../data/effectifs-magasins-lot1.xlsx', import.meta.url)
const OUTPUT_FILE = new URL('../data/generated-import-effectifs-lot1.sql', import.meta.url)

// Onglets à ignorer complètement (documentation, ou magasin déjà en base).
const SKIP_SHEETS = new Set(['Lecture', 'Bayonne'])

// Correspondance onglet -> slug déjà existant en base (vérifié à la main
// contre `select nom, slug from magasins` — la plupart des magasins du
// réseau ont été pré-créés en amont, vides, avant ce script). `null` =
// magasin réellement nouveau, à créer.
const STORE_MAP = {
  'Bastille': 'bastille',
  'Béglès': 'begles',
  'Belle Épine': 'belle-epine',
  'Bordeaux': 'bordeaux',
  'Bruxelles - Fripiers': 'fripiers',
  'Bruxelles - Ixelles': 'ixelles',
  'Cergy': 'cergy',
  'Charleroi': 'charleroi',
  'Chatelet': 'chatelet',
  'Commerce': 'commerce',
  'Créteil': 'creteil',
  'Italie 2': 'italie-2',
  'Liège': 'liege',
  'Lille': 'lille',
  'Lyon': 'lyon',
  'Marseille Cannebière': 'marseille-cannebiere',
  'Marseille Terrasses': 'marseille-tdp',
  'Montparnasse': 'montparnasse',
  'Montpellier Comédie': 'montpellier-comedie',
  'Montpellier Odysséum': 'montpellier-odysseum',
  'Namur': 'namur',
  'Nantes': 'nantes',
  'Nice': 'nice',
  'Reims': 'reims',
  'Rennes': 'rennes',
  'Rouen': 'rouen',
  'Saint-Lazare': 'st-lazare',
  'Strasbourg': 'strasbourg',
  'Toulon Mayol': 'toulon-mayol',
  'Toulouse Blagnac': 'toulouse-blagnac',
  'Toulouse Capitole': 'toulouse-capitole',
  'Beauchamps (labo-entrepôt)': null, // nouveau magasin, pas encore en base
}

// Régions (Paris et Est + Paris et Ouest) pour les magasins réellement
// nouveaux — les 31 magasins déjà existants ont déjà leur magasin_regions
// correct, on n'y touche pas.
const REGION_IDS = {
  'Paris et Est': 'e3685640-4483-49a7-9ab8-0780b1ff27b9',
  'Paris et Ouest': '01920d1a-a066-4779-956e-4c2f6f837765',
}
const NEW_STORE_REGIONS = {
  'Beauchamps (labo-entrepôt)': ['Paris et Est', 'Paris et Ouest'],
}

function stripAccents(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function slugify(s) {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Découpage prénom/nom : 1er mot = prénom, reste = nom. Le fichier source ne
// distingue pas prénom composé et nom composé (une seule colonne "Nom") —
// cette règle est la seule exploitable automatiquement. Sans conséquence sur
// l'affichage (toujours reconstruit en `${prenom} ${nom}`) ni sur les emails
// dérivés (basés sur la 1ère lettre du prénom uniquement).
function splitName(fullName) {
  const parts = (fullName || '').trim().split(/\s+/)
  return { prenom: parts[0] || '', nom: parts.slice(1).join(' ') || '—' }
}

function normalizePoste(raw) {
  const v = (raw || '').toString().trim()
  if (!v || v === '?') return null
  return v
}

const HEURES_RE = /^\d{1,2}h\d{2}$/
function normalizeHeures(raw) {
  const v = (raw || '').toString().trim()
  if (!v || !HEURES_RE.test(v)) return null
  return v
}

function sqlStr(v) {
  if (v === null || v === undefined) return 'NULL'
  return `'${String(v).replace(/'/g, "''")}'`
}

function findHeaderRow(sheet) {
  for (let r = 1; r <= 10; r++) {
    const row = sheet.getRow(r)
    if (row.getCell(1).value === 'Poste' && row.getCell(2).value === 'Nom') return r
  }
  return null
}

async function main() {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(SOURCE_FILE)

  const sql = []
  const report = []
  const seenSlugsByMagasin = new Map() // magasinKey -> Set(slugs) pour dédoublonner défensivement

  sql.push('-- Généré par scripts/import-effectifs-lot1.mjs — NE PAS COMMIT (données personnelles).')
  sql.push('begin;')

  for (const sheetName of wb.worksheets.map(w => w.name)) {
    if (SKIP_SHEETS.has(sheetName)) continue
    if (!(sheetName in STORE_MAP)) {
      report.push(`⚠️  Onglet "${sheetName}" absent de STORE_MAP — ignoré, à traiter manuellement.`)
      continue
    }

    const sheet = wb.getWorksheet(sheetName)
    const headerRow = findHeaderRow(sheet)
    if (!headerRow) {
      report.push(`⚠️  Onglet "${sheetName}" : en-tête "Poste/Nom" introuvable — ignoré.`)
      continue
    }

    const existingSlug = STORE_MAP[sheetName]
    let magasinIdSql // fragment SQL référençant l'id du magasin (subquery ou uuid littéral)
    let magasinIdForDedup = existingSlug || sheetName

    if (existingSlug) {
      magasinIdSql = `(select id from magasins where slug=${sqlStr(existingSlug)})`
    } else {
      // Magasin réellement nouveau (ex: Beauchamps).
      const newId = randomUUID()
      const slug = slugify(sheetName)
      sql.push(`insert into magasins (id, nom, slug) values (${sqlStr(newId)}, ${sqlStr(sheetName)}, ${sqlStr(slug)});`)
      for (const regionName of (NEW_STORE_REGIONS[sheetName] || [])) {
        sql.push(`insert into magasin_regions (magasin_id, region_id) values (${sqlStr(newId)}, ${sqlStr(REGION_IDS[regionName])});`)
      }
      magasinIdSql = sqlStr(newId)
      magasinIdForDedup = newId
    }

    if (!seenSlugsByMagasin.has(magasinIdForDedup)) seenSlugsByMagasin.set(magasinIdForDedup, new Set())
    const seenSlugs = seenSlugsByMagasin.get(magasinIdForDedup)

    let count = 0
    let posteNullCount = 0
    let heuresNullCount = 0
    const values = []

    for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      const posteRaw = row.getCell(1).value
      const nomRaw = row.getCell(2).value
      const heuresRaw = row.getCell(3).value
      if (!posteRaw && !nomRaw) continue

      const { prenom, nom } = splitName(String(nomRaw || ''))
      let slug = slugify(`${prenom} ${nom}`)
      if (seenSlugs.has(slug)) {
        let i = 2
        while (seenSlugs.has(`${slug}-${i}`)) i++
        slug = `${slug}-${i}`
      }
      seenSlugs.add(slug)

      const poste = normalizePoste(posteRaw)
      if (poste === null) posteNullCount++
      const heures = normalizeHeures(heuresRaw)
      if (heures === null) heuresNullCount++

      values.push(`(${magasinIdSql}, ${sqlStr(slug)}, ${sqlStr(prenom)}, ${sqlStr(nom)}, ${sqlStr(poste)}, ${sqlStr(heures)})`)
      count++
    }

    if (values.length) {
      sql.push(`insert into collaborateurs (magasin_id, slug, prenom, nom, poste, heures) values`)
      sql.push(values.join(',\n') + ';')
    }

    report.push(`${sheetName.padEnd(28)} → ${(existingSlug || 'NOUVEAU').padEnd(20)} ${String(count).padStart(3)} collaborateurs (poste null: ${posteNullCount}, heures null: ${heuresNullCount})`)
  }

  sql.push('commit;')

  writeFileSync(OUTPUT_FILE, sql.join('\n') + '\n', 'utf8')
  console.log(report.join('\n'))
  console.log('\nSQL généré :', OUTPUT_FILE.pathname)
}

main().catch(e => { console.error(e); process.exit(1) })
