import { getSharedState, sbSelect, getRuntimeSessionCode } from './supabase'

/** Nom affiché / stocké : fullName si présent, sinon « NOM Prénom » (import RH) */
export function entreeDisplayName(c) {
  if (c?.fullName?.trim()) return c.fullName.trim()
  return ((c?.nom || '') + ' ' + (c?.prenom || '')).trim()
}

/** @deprecated alias */
export function rhFullName(c) {
  return entreeDisplayName(c)
}

/** Clé de comparaison : mots triés, sans accents (ordre prénom/nom libre) */
export function normalizeNameKey(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[''`\-–—]/g, ' ')
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
    const canonical = entreeDisplayName(c)
    if (!canonical) continue
    if (normalizeNameKey(canonical) === key) {
      return { canonicalName: canonical, entry: c }
    }
  }
  return null
}

/** Entrées à partir des noms déjà en base (fallback si import RH pas encore lu) */
export function buildEntreesFromParticipants(rows) {
  return (rows || [])
    .map(r => {
      const fullName = (r.name || '').trim()
      if (!fullName) return null
      return {
        nom: '',
        prenom: '',
        fullName,
        magasin: '',
        heures: '',
        poste: '',
        telephone: '',
      }
    })
    .filter(Boolean)
}

export async function loadEntreesList() {
  let entrees = []
  try {
    const state = await getSharedState()
    if (state.entrees_data?.length) entrees = state.entrees_data
  } catch {
    /* ignore */
  }
  if (!entrees.length && typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('entrees_data') || '[]')
      if (local.length) entrees = local
    } catch {
      /* ignore */
    }
  }
  if (!entrees.length) {
    try {
      const rows = await sbSelect(
        'participants',
        `session_code=eq.${getRuntimeSessionCode()}&order=joined_at.asc`
      )
      entrees = buildEntreesFromParticipants(rows)
    } catch {
      /* ignore */
    }
  }
  return entrees
}

/**
 * Résout un nom saisi : liste RH (trainer_state) puis secours table participants.
 */
export async function resolveParticipantName(rawInput) {
  const raw = (rawInput || '').trim()
  if (!raw) return { ok: false, reason: 'empty' }

  const entrees = await loadEntreesList()
  if (!entrees.length) {
    return { ok: false, reason: 'no_list' }
  }

  let match = findRhMatch(raw, entrees)
  if (match) {
    return { ok: true, canonicalName: match.canonicalName }
  }

  try {
    const rows = await sbSelect(
      'participants',
      `session_code=eq.${getRuntimeSessionCode()}&order=joined_at.asc`
    )
    const fromParticipants = buildEntreesFromParticipants(rows)
    match = findRhMatch(raw, fromParticipants)
    if (match) {
      return { ok: true, canonicalName: match.canonicalName }
    }
  } catch {
    /* ignore */
  }

  return { ok: false, reason: 'no_match' }
}

export function filterParticipantsInRh(participants, entrees) {
  if (!entrees?.length) return []
  const rhKeys = new Set(
    entrees.map(c => normalizeNameKey(entreeDisplayName(c))).filter(Boolean)
  )
  return (participants || []).filter(p => rhKeys.has(normalizeNameKey(p.name)))
}

export function connectedRhNameKeys(participants, entrees) {
  return new Set(
    filterParticipantsInRh(participants, entrees).map(p => normalizeNameKey(p.name))
  )
}

/** Lobby / compteur : RH + ligne participants */
export function isInConnectedRhList(name, participants, entrees) {
  return connectedRhNameKeys(participants, entrees).has(normalizeNameKey(name))
}

/** Affichage formateur des réponses : liste RH OU déjà dans participants (pas les deux obligatoires) */
export function shouldShowAnswerForTrainer(collaborateur, participants, entrees) {
  const key = normalizeNameKey(collaborateur)
  if (!key || key === normalizeNameKey('Anonyme')) return false

  if (entrees?.length) {
    const rhKeys = new Set(
      entrees.map(c => normalizeNameKey(entreeDisplayName(c))).filter(Boolean)
    )
    if (rhKeys.has(key)) return true
  }

  const partKeys = new Set(
    (participants || []).map(p => normalizeNameKey(p.name)).filter(Boolean)
  )
  return partKeys.has(key)
}

export async function loadRhGuardContext() {
  const [participants, entrees] = await Promise.all([
    sbSelect('participants', 'session_code=eq.' + getRuntimeSessionCode()),
    loadEntreesList(),
  ])
  return { participants: participants || [], entrees }
}

export function filterAnswersForTrainer(answers, participants, entrees) {
  return (answers || []).filter(a =>
    shouldShowAnswerForTrainer(a.collaborateur, participants, entrees)
  )
}

export async function fetchTrainerQuizAnswers(filter) {
  const [rows, ctx] = await Promise.all([
    sbSelect('quiz_answers', filter),
    loadRhGuardContext(),
  ])
  return filterAnswersForTrainer(rows, ctx.participants, ctx.entrees)
}
