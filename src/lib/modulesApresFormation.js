// Modules après-formation (/mes-modules) — catalogue, niveaux et accès aux
// résultats (table module_resultats). Les modules eux-mêmes sont des pages
// HTML autonomes servies depuis public/modules-apres-formation/, ouvertes en
// iframe : un petit pont (bridge-avant.js / bridge-apres.js) leur passe l'état
// du collaborateur et renvoie les formats terminés et les tests passés.
// Totalement indépendant de la formation initiale.
import { sbSelect, sbInsert, sbUpdate } from '@/lib/supabase'
import { stripAccents } from '@/lib/collaborateursApi'

export const MODULE_GROUPES = [
  { titre: 'Verres', modules: [
    { id: 'proximite', nom: 'Le verre de proximité', fichier: 'proximite.html' },
    { id: 'clariteens', nom: 'Les verres Clariteens', fichier: 'clariteens.html' },
    { id: 'zenprotect', nom: 'Le verre Zen Protect', fichier: 'zenprotect.html' },
    { id: 'traitements', nom: 'Les traitements de verres', fichier: 'traitements.html' },
  ] },
  { titre: 'Vente', modules: [
    { id: 'progressif', nom: 'Convaincre avec le progressif', fichier: 'progressif.html' },
    { id: 'troisieme-paire', nom: 'La troisième paire', fichier: 'troisieme-paire.html' },
  ] },
  { titre: 'Fabrication et tiers payant', modules: [
    { id: 'transposition', nom: 'La transposition', fichier: 'transposition.html' },
    { id: 'granit', nom: 'Faire un Granit', fichier: 'granit.html' },
  ] },
]

export const MODULES = MODULE_GROUPES.flatMap(g => g.modules)
export const NB_FORMATS = 4

// Niveau selon le nombre de modules acquis (test réussi au moins une fois).
const NIVEAUX = [
  { min: 8, nom: 'Maître', couleur: '#7c3aed' },
  { min: 6, nom: 'Expert', couleur: '#0c8f6b' },
  { min: 3, nom: 'Confirmé', couleur: '#0089ba' },
  { min: 1, nom: 'Apprenti', couleur: '#d97706' },
  { min: 0, nom: 'Débutant', couleur: '#6b7280' },
]

export function niveauPour(nbAcquis) {
  return NIVEAUX.find(n => nbAcquis >= n.min)
}

export function prochainNiveau(nbAcquis) {
  const suivants = NIVEAUX.filter(n => n.min > nbAcquis)
  return suivants.length ? suivants[suivants.length - 1] : null
}

/** État de chaque module, déduit des lignes de module_resultats. */
export function etatModules(resultats) {
  const etats = {}
  for (const m of MODULES) {
    etats[m.id] = { formats: new Set(), tentatives: [], meilleurScore: null, acquis: false, derniereActivite: null }
  }
  for (const r of resultats || []) {
    const e = etats[r.module_id]
    if (!e) continue
    if (!e.derniereActivite || r.created_at > e.derniereActivite) e.derniereActivite = r.created_at
    if (r.type === 'format' && r.format_id) e.formats.add(r.format_id)
    if (r.type === 'test') {
      e.tentatives.push(r)
      if (e.meilleurScore === null || r.score > e.meilleurScore) e.meilleurScore = r.score
      if (r.reussi) e.acquis = true
    }
  }
  for (const e of Object.values(etats)) e.tentatives.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  return etats
}

export function statutModule(etat) {
  if (etat.acquis) return 'acquis'
  if (etat.formats.size || etat.tentatives.length) return 'en-cours'
  return 'a-faire'
}

export async function getResultatsModules(collaborateurId) {
  if (!collaborateurId) return []
  return await sbSelect('module_resultats', `collaborateur_id=eq.${collaborateurId}&order=created_at.asc`) || []
}

export async function enregistrerResultatModule(collaborateurId, message) {
  if (!collaborateurId || !MODULES.some(m => m.id === message.module)) return false
  if (message.type === 'format') {
    if (!['a', 'b', 'c', 'd'].includes(message.format)) return false
    return sbInsert('module_resultats', {
      collaborateur_id: collaborateurId, module_id: message.module, type: 'format', format_id: message.format,
    })
  }
  if (message.type === 'test') {
    const score = Number(message.score)
    if (!Number.isInteger(score) || score < 0 || score > 12) return false
    const details = Array.isArray(message.details)
      ? message.details.slice(0, 12).map(d => ({ libelle: String(d.libelle || '').slice(0, 500), correct: !!d.correct }))
      : null
    return sbInsert('module_resultats', {
      collaborateur_id: collaborateurId, module_id: message.module, type: 'test',
      score, total: 12, reussi: score >= 10, details,
    })
  }
  return false
}

// ── Modules ouverts par le formateur ─────────────────────────────────────
// Colonne collaborateurs.modules_ouverts : le collaborateur ne voit que ces
// modules sur /mes-modules. Ouverture / fermeture une par une, depuis la fiche
// du suivi magasin.

export function modulesOuverts(collaborateur) {
  const ids = Array.isArray(collaborateur?.modules_ouverts) ? collaborateur.modules_ouverts : []
  return MODULES.filter(m => ids.includes(m.id)).map(m => m.id)
}

/** Relit la fiche juste avant d'écrire, pour ne pas écraser une ouverture
 * faite entre-temps depuis un autre écran. Renvoie la nouvelle liste ou null. */
export async function changerOuvertureModule(collaborateurId, moduleId, ouvrir) {
  if (!MODULES.some(m => m.id === moduleId)) return null
  const rows = await sbSelect('collaborateurs', `id=eq.${collaborateurId}&select=modules_ouverts`)
  if (!rows?.length) return null
  const actuels = Array.isArray(rows[0].modules_ouverts) ? rows[0].modules_ouverts : []
  const suivants = ouvrir
    ? [...new Set([...actuels, moduleId])]
    : actuels.filter(id => id !== moduleId)
  const ok = await sbUpdate('collaborateurs', { modules_ouverts: suivants }, `id=eq.${collaborateurId}`)
  return ok ? suivants : null
}

// ── Accès des collaborateurs déjà en magasin ─────────────────────────────
// Même colonnes login/code/doit_changer_code que l'espace collaborateur des
// nouveaux entrants (un seul identifiant par personne). Créé à la demande par
// le formateur depuis la fiche du suivi magasin, jamais en masse.

function genererLoginBase(prenom, nom) {
  const p = stripAccents(prenom || '').toLowerCase().replace(/[^a-z]/g, '')
  const n = stripAccents(nom || '').toLowerCase().replace(/[^a-z]/g, '')
  return (p ? p[0] : '') + n
}

function genererCodeProvisoire() {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return String(100000 + (a[0] % 900000))
}

/** Crée l'accès s'il n'existe pas encore (sinon garde l'identifiant), avec un
 * nouveau code provisoire à changer à la 1re connexion. Renvoie {login, code}. */
export async function creerAccesModules(collaborateur) {
  let login = collaborateur.login
  if (!login) {
    const base = genererLoginBase(collaborateur.prenom, collaborateur.nom) || 'collab'
    login = base
    let suffixe = 1
    while (true) {
      const clash = await sbSelect('collaborateurs', `login=eq.${encodeURIComponent(login)}&select=id`)
      if (!clash?.length) break
      suffixe += 1
      login = base + suffixe
    }
  }
  const code = genererCodeProvisoire()
  const ok = await sbUpdate('collaborateurs', { login, code, doit_changer_code: true }, `id=eq.${collaborateur.id}`)
  return ok ? { login, code } : null
}

// ── Compétences du suivi magasin gagnées grâce aux modules ───────────────
// Un module acquis (test réussi) fait monter les compétences qui lui sont
// liées, jusqu'à 4/5 (« acquis ») : le 5e point reste celui de l'audit en
// magasin. Quand plusieurs modules alimentent la même compétence, chacun en
// apporte une part. Rien n'est écrit dans store_followup_progress : le score
// affiché est le plus haut entre l'audit et les modules.
export const MODULE_COMPETENCES = {
  proximite: ['types-verres'],
  clariteens: ['types-verres'],
  zenprotect: ['types-verres'],
  traitements: ['traitements'],
  progressif: ['verres-progressifs'],
  'troisieme-paire': ['offres'],
  transposition: ['lecture-ordonnance'],
  granit: ['granit'],
}
const SCORE_MAX_MODULES = 4

/** Slugs des collaborateurs du magasin -> modules acquis. */
export async function getModulesAcquisParSlug(magasinId) {
  if (!magasinId) return {}
  const fiches = await sbSelect('collaborateurs', `magasin_id=eq.${magasinId}&select=id,slug`) || []
  if (!fiches.length) return {}
  const reussis = await sbSelect('module_resultats', `collaborateur_id=in.(${fiches.map(f => f.id).join(',')})&type=eq.test&reussi=eq.true&select=collaborateur_id,module_id`) || []
  const slugParId = Object.fromEntries(fiches.map(f => [f.id, f.slug]))
  const acquis = {}
  for (const r of reussis) {
    const slug = slugParId[r.collaborateur_id]
    if (slug) (acquis[slug] ||= new Set()).add(r.module_id)
  }
  return acquis
}

/** Progression d'audit enrichie des compétences gagnées par les modules
 * (même forme : `${slug}:${itemId}` -> { status, score, … }, plus viaModules). */
export function fusionnerProgressionModules(progress, acquisParSlug, scoreToStatus) {
  if (!acquisParSlug || !Object.keys(acquisParSlug).length) return progress
  const modulesParItem = {}
  for (const [moduleId, items] of Object.entries(MODULE_COMPETENCES)) {
    for (const it of items) (modulesParItem[it] ||= []).push(moduleId)
  }
  const fusion = { ...progress }
  for (const [slug, acquis] of Object.entries(acquisParSlug)) {
    for (const [itemId, modules] of Object.entries(modulesParItem)) {
      const nb = modules.filter(m => acquis.has(m)).length
      if (!nb) continue
      const score = Math.round(SCORE_MAX_MODULES * nb / modules.length)
      const key = `${slug}:${itemId}`
      if (score > (progress[key]?.score || 0)) {
        fusion[key] = { ...(progress[key] || { note: '' }), score, status: scoreToStatus(score), viaModules: true }
      }
    }
  }
  return fusion
}

// ── Modules lancés en session par le formateur (visio ou salle) ──────────
// active_module = 'apf-<id>' : chaque formé connecté à la session fait le
// module en autonomie sur son téléphone. Le test est enregistré dans
// module_results (score sur 12), comme les exercices notés : il compte donc
// dans son score de formation.
export const PREFIXE_SESSION = 'apf-'

export function moduleDeSession(activeModule) {
  if (typeof activeModule !== 'string' || !activeModule.startsWith(PREFIXE_SESSION)) return null
  return MODULES.find(m => m.id === activeModule.slice(PREFIXE_SESSION.length)) || null
}

/** URL du module HTML (Vercel sert les .html sans extension en production). */
export function urlModule(module, params = {}) {
  const chemin = process.env.NODE_ENV === 'development' ? module.fichier : `${module.id}/`
  return `/modules-apres-formation/${chemin}?${new URLSearchParams({ m: module.id, ...params })}`
}
