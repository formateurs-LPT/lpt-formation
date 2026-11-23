// Audit compétences formateurs (/audit-formateurs) — catalogue et résultats
// (table audit_formateurs_resultats). Mêmes règles que modulesApresFormation.js
// (collaborateurs), mais côté formateur : pas d'ouverture au cas par cas —
// tous les formateurs voient tout de suite tous les modules d'audit publiés.
// Le contenu reprend celui des modules d'onboarding, pour vérifier qu'un
// formateur ne dit pas de coquilles en le présentant.
import { sbSelect, sbInsert } from '@/lib/supabase'

export const MODULES = [
  { id: 'entreprise', nom: "Lunettes Pour Tous, l'histoire et la promesse", fichier: 'entreprise.html' },
]

export const NB_FORMATS = 4

/** État de chaque module, déduit des lignes de audit_formateurs_resultats. */
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

export async function getResultatsAudit(trainerId) {
  if (!trainerId) return []
  return await sbSelect('audit_formateurs_resultats', `trainer_id=eq.${trainerId}&order=created_at.asc`) || []
}

export async function enregistrerResultatAudit(trainerId, message) {
  if (!trainerId || !MODULES.some(m => m.id === message.module)) return false
  if (message.type === 'format') {
    if (!['a', 'b', 'c', 'd'].includes(message.format)) return false
    return sbInsert('audit_formateurs_resultats', {
      trainer_id: trainerId, module_id: message.module, type: 'format', format_id: message.format,
    })
  }
  if (message.type === 'test') {
    const score = Number(message.score)
    if (!Number.isInteger(score) || score < 0 || score > 12) return false
    const details = Array.isArray(message.details)
      ? message.details.slice(0, 12).map(d => ({ libelle: String(d.libelle || '').slice(0, 500), correct: !!d.correct }))
      : null
    return sbInsert('audit_formateurs_resultats', {
      trainer_id: trainerId, module_id: message.module, type: 'test',
      score, total: 12, reussi: score >= 10, details,
    })
  }
  return false
}

/** Pour la vue de synthèse (Kevin) : résultats de tous les formateurs actifs. */
export async function getResultatsAuditTousFormateurs() {
  const [trainers, resultats] = await Promise.all([
    sbSelect('trainers', 'select=id,display_name,active&active=eq.true'),
    sbSelect('audit_formateurs_resultats', 'order=created_at.asc'),
  ])
  const parTrainer = {}
  for (const t of trainers || []) parTrainer[t.id] = { trainer: t, resultats: [] }
  for (const r of resultats || []) {
    if (parTrainer[r.trainer_id]) parTrainer[r.trainer_id].resultats.push(r)
  }
  return Object.values(parTrainer).map(({ trainer, resultats }) => ({
    trainer, etats: etatModules(resultats),
  }))
}
