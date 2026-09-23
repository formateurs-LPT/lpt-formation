// Génère les entrées STORES (storeFollowupData.js) pour les 32 magasins du
// lot 1, à partir des collaborateurs déjà importés en base (garantit que les
// ids collaborateur correspondent exactement aux slugs Supabase — pas de
// re-parsing indépendant du fichier Excel).
//
// Usage : psql ... -> JSON -> ce script -> bloc JS à relire puis coller dans
// src/lib/storeFollowupData.js (voir sortie stdout).
import { readFileSync } from 'node:fs'

const DUMP_FILE = process.argv[2]
if (!DUMP_FILE) { console.error('Usage: node generate-storefollowup-sections.mjs <dump.json>'); process.exit(1) }

const rows = JSON.parse(readFileSync(DUMP_FILE, 'utf8'))

// Groupes cibles, dans l'ordre d'affichage souhaité.
const GROUPS = [
  { id: 'manager',            label: 'MANAGER',            sub: 'Encadrement' },
  { id: 'referent',           label: 'REFERENT',           sub: 'Référents' },
  { id: 'cvo',                label: 'CVO',                sub: 'Vendeurs' },
  { id: 'opto',               label: 'OPTO',               sub: 'Opticiens' },
  { id: 'mo-sav',             label: 'MO/SAV',             sub: 'Monteurs · SAV' },
  { id: 'mo',                 label: 'MO',                 sub: 'Monteurs' },
  { id: 'sav',                label: 'SAV',                sub: 'Service après-vente' },
  { id: 'apprenti-alternant', label: 'APPRENTI/ALTERNANT', sub: 'En formation' },
  { id: 'autre',              label: 'AUTRE',              sub: 'Postes divers' },
  { id: 'non-renseigne',      label: 'NON RENSEIGNÉ',      sub: "Poste non visible cette semaine (absence/congé)" },
]

function stripAccents(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function classify(posteRaw) {
  if (!posteRaw) return 'non-renseigne'
  const tokens = stripAccents(posteRaw).toUpperCase().split(/[^A-Z0-9]+/).filter(Boolean)
  const has = (w) => tokens.includes(w)
  if (has('MANAGER')) return 'manager'
  if (has('REFERENT')) return 'referent'
  if (has('MO') && has('SAV')) return 'mo-sav'
  if (has('SAV')) return 'sav'
  if (has('MO')) return 'mo'
  if (has('CVO')) return 'cvo'
  if (has('OPTO') || has('OPTICIEN')) return 'opto'
  if (has('APPRENTI') || has('ALTERNANT')) return 'apprenti-alternant'
  return 'autre'
}

function jsStr(s) {
  return `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function heuresToContrat(heures) {
  if (!heures) return null
  // "35h00" -> "35h", "35h30" -> "35h30" (garde les minutes si non nulles)
  const m = heures.match(/^(\d{1,2})h(\d{2})$/)
  if (!m) return heures
  const [, h, mm] = m
  return mm === '00' ? `${h}h` : `${h}h${mm}`
}

const byStore = new Map()
for (const r of rows) {
  if (!byStore.has(r.magasin_slug)) byStore.set(r.magasin_slug, { nom: r.magasin_nom, rows: [] })
  byStore.get(r.magasin_slug).rows.push(r)
}

let out = ''
for (const [slug, { nom, rows: storeRows }] of byStore) {
  const byGroup = new Map()
  for (const r of storeRows) {
    const g = classify(r.poste)
    if (!byGroup.has(g)) byGroup.set(g, [])
    byGroup.get(g).push(r)
  }
  out += `  {\n    id: ${jsStr(slug)},\n    label: ${jsStr(nom)},\n    sections: [\n`
  for (const g of GROUPS) {
    const members = byGroup.get(g.id)
    if (!members || !members.length) continue
    out += `      {\n        id: ${jsStr(g.id)},\n        label: ${jsStr(g.label)},\n        sub: ${jsStr(g.sub)},\n        collaborateurs: [\n`
    for (const m of members) {
      const contrat = heuresToContrat(m.heures)
      out += `          { id: ${jsStr(m.collab_slug)}, prenom: ${jsStr(m.prenom)}, nom: ${jsStr(m.nom)}${contrat ? `, contrat: ${jsStr(contrat)}` : ''} },\n`
    }
    out += `        ],\n      },\n`
  }
  out += `    ],\n  },\n`
}

console.log(out)

// Rapport de classification (stderr, pour vérif humaine avant collage).
console.error('--- Répartition par groupe (tous magasins confondus) ---')
const totals = new Map()
for (const r of rows) {
  const g = classify(r.poste)
  totals.set(g, (totals.get(g) || 0) + 1)
}
for (const g of GROUPS) console.error(`${g.label.padEnd(20)} ${totals.get(g.id) || 0}`)
