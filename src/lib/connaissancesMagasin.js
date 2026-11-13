// Taux de connaissance du suivi magasin alimenté par ce que les
// collaborateurs font dans /mes-modules : modules acquis (test réussi), dernier
// test de positionnement et dernier passage de chaque quiz expert (Quiz
// Légende, Tyé un tigre ?). Chaque réponse est rattachée
// à un item de compétence du suivi ; l'item reçoit une note de 1 à 4 (le 5,
// « maîtrise complète, autonome », reste réservé à l'audit du formateur).
// Affichage seulement : rien n'est écrit dans store_followup_progress, et une
// note d'audit plus haute l'emporte toujours.
import { sbSelect } from '@/lib/supabase'
import { getMagasinIdBySlug } from '@/lib/collaborateursApi'
import { MODULE_COMPETENCES, TEST_POSITIONNEMENT_ID } from '@/lib/modulesApresFormation'
import { QUIZ_LEGENDE } from '@/lib/quizLegende'
import { QUIZ_TIGRE } from '@/lib/quizTigre'

// Thème d'une question (test de positionnement / quiz expert) -> items du suivi.
const ITEMS_PAR_THEME = {
  troubles: ['lecture-ordonnance'],
  ordonnance: ['lecture-ordonnance'],
  transposition: ['lecture-ordonnance'],
  'unifocal-progressif': ['types-verres'],
  proximite: ['types-verres'],
  clariteens: ['types-verres'],
  zenprotect: ['types-verres'],
  montures: ['montures'],
  'trame-accueil': ['trame-accueil'],
  decouverte: ['trame-accueil'],
  offres: ['offres'],
  'troisieme-paire': ['offres'],
  'prise-mesures': ['prises-mesures'],
  remboursement: ['tiers-payants'],
  'tiers-payant': ['tiers-payants', 'lpt-sante'],
  traitements: ['traitements'],
  progressif: ['verres-progressifs'],
  granit: ['granit'],
}
const QUIZ_EXPERTS = [QUIZ_LEGENDE, QUIZ_TIGRE]
const THEME_QUESTION = Object.fromEntries(QUIZ_EXPERTS.flatMap(quiz => quiz.questions.map(q => [`${quiz.id}:${q.id}`, q.theme])))
const NOTE_MAX = 4

const plusRecent = (lignes, moduleId) => lignes
  .filter(r => r.module_id === moduleId)
  .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] || null

/** slug du collaborateur -> { itemId: note 1-4 } pour un magasin du suivi. */
export async function getApportsConnaissances(storeSlug) {
  const magasinId = await getMagasinIdBySlug(storeSlug)
  if (!magasinId) return {}
  const fiches = await sbSelect('collaborateurs', `magasin_id=eq.${magasinId}&select=id,slug`) || []
  if (!fiches.length) return {}
  const lignes = await sbSelect('module_resultats', `collaborateur_id=in.(${fiches.map(f => f.id).join(',')})&type=in.(test,positionnement,${QUIZ_EXPERTS.map(q => q.id).join(',')})&select=collaborateur_id,module_id,type,reussi,details,created_at`) || []

  const apports = {}
  for (const f of fiches) {
    const siennes = lignes.filter(r => r.collaborateur_id === f.id)
    if (!siennes.length) continue
    const notes = {}
    const garder = (item, note) => { if (note > (notes[item] || 0)) notes[item] = note }

    // Modules acquis : part des modules de l'item que le collaborateur a acquis.
    const acquis = new Set(siennes.filter(r => r.type === 'test' && r.reussi).map(r => r.module_id))
    const modulesParItem = {}
    for (const [moduleId, items] of Object.entries(MODULE_COMPETENCES)) {
      for (const it of items) (modulesParItem[it] ||= []).push(moduleId)
    }
    for (const [item, modules] of Object.entries(modulesParItem)) {
      const nb = modules.filter(m => acquis.has(m)).length
      if (nb) garder(item, Math.round(NOTE_MAX * nb / modules.length))
    }

    // Tests : bonnes réponses par item, sur le dernier passage de chaque test.
    const parItem = {}
    const compter = (theme, correct) => {
      for (const item of ITEMS_PAR_THEME[theme] || []) {
        const c = (parItem[item] ||= { justes: 0, total: 0 })
        c.total += 1
        if (correct) c.justes += 1
      }
    }
    for (const d of plusRecent(siennes, TEST_POSITIONNEMENT_ID)?.details || []) compter(d.theme, d.correct)
    for (const quiz of QUIZ_EXPERTS) {
      for (const d of plusRecent(siennes, quiz.id)?.details || []) compter(THEME_QUESTION[`${quiz.id}:${d.id}`], d.correct)
    }
    for (const [item, { justes, total }] of Object.entries(parItem)) {
      garder(item, Math.round(1 + (NOTE_MAX - 1) * justes / total))
    }

    if (Object.keys(notes).length) apports[f.slug] = notes
  }
  return apports
}

/** Progression d'audit enrichie des apports (même forme, plus viaModules). */
export function fusionnerConnaissances(progress, apports, scoreToStatus) {
  if (!apports || !Object.keys(apports).length) return progress
  const fusion = { ...progress }
  for (const [slug, notes] of Object.entries(apports)) {
    for (const [item, note] of Object.entries(notes)) {
      const key = `${slug}:${item}`
      if (note > (progress[key]?.score || 0)) {
        fusion[key] = { ...(progress[key] || { note: '' }), score: note, status: scoreToStatus(note), viaModules: true }
      }
    }
  }
  return fusion
}
