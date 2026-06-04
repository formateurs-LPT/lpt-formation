import { getSharedState, sbSelect, SESSION_CODE } from './supabase'

/** Nom affiché / stocké : « NOM Prénom » comme dans Entrées RH */
export function rhFullName(c) {
  return ((c.nom || '') + ' ' + (c.prenom || '')).trim()
}

/** Clé de comparaison : mots triés, sans accents ni ponctuation (ordre prénom/nom libre) */
export function normalizeNameKey(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(' ')
}

export function findRhMatch(inputName, entrees) {
  const key = normalizeNameKey(inputName)
  if (!key || !entrees?.length) return null
  for (const c of entrees) {
    const canonical = rhFullName(c)
    if (!canonical) continue
    if (normalizeNameKey(canonical) === key) {
      return { canonicalName: canonical, entry: c }
    }
  }
  return null
}

export function filterParticipantsInRh(participants, entrees) {
  if (!entrees?.length) return []
  const rhKeys = new Set(entrees.map(c => normalizeNameKey(rhFullName(c))).filter(Boolean))
  return (participants || []).filter(p => rhKeys.has(normalizeNameKey(p.name)))
}

/** Noms connectés ET présents dans la liste RH (clés normalisées) */
export function connectedRhNameKeys(participants, entrees) {
  return new Set(
    filterParticipantsInRh(participants, entrees).map(p => normalizeNameKey(p.name))
  )
}

export function isInConnectedRhList(name, participants, entrees) {
  return connectedRhNameKeys(participants, entrees).has(normalizeNameKey(name))
}

export async function loadEntreesList() {
  try {
    const state = await getSharedState()
    if (state.entrees_data?.length) return state.entrees_data
  } catch {
    /* ignore */
  }
  if (typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('entrees_data') || '[]')
      if (local.length) return local
    } catch {
      /* ignore */
    }
  }
  return []
}

export async function loadRhGuardContext() {
  const [participants, entrees] = await Promise.all([
    sbSelect('participants', 'session_code=eq.' + SESSION_CODE),
    loadEntreesList(),
  ])
  return { participants: participants || [], entrees }
}

export function filterAnswersForTrainer(answers, participants, entrees) {
  return (answers || []).filter(a =>
    isInConnectedRhList(a.collaborateur, participants, entrees)
  )
}

/** Réponses quiz modules / TV : uniquement collaborateurs RH connectés */
export async function fetchTrainerQuizAnswers(filter) {
  const [rows, ctx] = await Promise.all([
    sbSelect('quiz_answers', filter),
    loadRhGuardContext(),
  ])
  return filterAnswersForTrainer(rows, ctx.participants, ctx.entrees)
}
