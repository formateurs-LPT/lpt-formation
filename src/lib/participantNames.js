import {
  getSharedState,
  sbSelect,
  sbDelete,
  sbUpdate,
  sbUpsert,
  pgEq,
  getRuntimeSessionCode,
  ensureSession,
} from './supabase'

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

export function normalizeEntreeEntry(c) {
  const nom = (c?.nom || '').trim()
  const prenom = (c?.prenom || '').trim()
  const fullName = (c?.fullName || '').trim() || `${nom} ${prenom}`.trim()
  if (!fullName) return c
  return { ...c, nom, prenom, fullName }
}

export function normalizeEntreeList(list) {
  return (list || []).map(normalizeEntreeEntry).filter(c => entreeDisplayName(c))
}

/** Liste RH pour l’écran Entrées (BDD + cache local + repli participants) */
export async function loadEntreesList() {
  let entrees = await loadEntreesFromTrainerState()
  if (!entrees.length && typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('entrees_data') || '[]')
      if (local.length) entrees = normalizeEntreeList(local)
    } catch {
      /* ignore */
    }
  }
  if (!entrees.length) {
    try {
      const rows = await sbSelect(
        'participants',
        `session_code=eq.${encodeURIComponent(getRuntimeSessionCode())}&order=joined_at.asc`
      )
      entrees = buildEntreesFromParticipants(rows)
    } catch {
      /* ignore */
    }
  }
  return entrees
}

/** Liste RH pour la connexion : priorité Supabase (évite un cache local obsolète) */
export async function loadEntreesFromTrainerState() {
  try {
    const state = await getSharedState()
    if (state.entrees_data?.length) return normalizeEntreeList(state.entrees_data)
  } catch {
    /* ignore */
  }
  return []
}

/** Après renommage RH : aligner participants + réponses déjà enregistrées */
export async function renameParticipantIdentity(oldCanonical, newCanonical) {
  const code = getRuntimeSessionCode()
  const oldName = (oldCanonical || '').trim()
  const newName = (newCanonical || '').trim()
  if (!code || !oldName || !newName) return false
  if (normalizeNameKey(oldName) === normalizeNameKey(newName)) return true
  if (!(await ensureSession())) return false

  await sbDelete(
    'participants',
    `session_code=eq.${encodeURIComponent(code)}&${pgEq('name', oldName)}`
  )
  await sbUpsert(
    'participants',
    {
      session_code: code,
      name: newName,
      joined_at: new Date().toISOString(),
    },
    'session_code,name'
  )

  const sessionFilter = `session_code=eq.${encodeURIComponent(code)}`
  await sbUpdate(
    'scenario_responses',
    { participant_name: newName },
    `${sessionFilter}&${pgEq('participant_name', oldName)}`
  )
  await sbUpdate(
    'quiz_results',
    { participant_name: newName },
    `${sessionFilter}&${pgEq('participant_name', oldName)}`
  )
  await sbUpdate(
    'quiz_answers',
    { collaborateur: newName },
    `${sessionFilter}&${pgEq('collaborateur', oldName)}`
  )
  await sbUpdate('module_results', { collaborateur: newName }, pgEq('collaborateur', oldName))

  return true
}

/**
 * Résout un nom saisi : liste RH (trainer_state) puis secours table participants.
 */
export async function resolveParticipantName(rawInput) {
  const raw = (rawInput || '').trim()
  if (!raw) return { ok: false, reason: 'empty' }

  let entrees = await loadEntreesFromTrainerState()
  if (!entrees.length && typeof window !== 'undefined') {
    try {
      const local = JSON.parse(localStorage.getItem('entrees_data') || '[]')
      if (local.length) entrees = normalizeEntreeList(local)
    } catch {
      /* ignore */
    }
  }
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
