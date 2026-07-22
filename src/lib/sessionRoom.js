import { TRAINER_CANONICAL } from './constants'
import { formatDefaultRoomLabel, isValidFormationCategorySlug } from './formationCategories'
import {
  isDynamicRoomCode,
  readTrainerActiveRoomCode,
  setTrainerActiveRoomCode,
  getTvUrlRoomCode,
} from './sessionCode'
import { archiveAndPurgeRoom } from './roomArchive'
import { getTrainerFromDB, sbSelect, sbUpdate, sbUpsert, sbUpsertOrThrow, setRoomSharedState } from './supabase'

const ROOM_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const OPEN_ROOM_STATUSES = new Set(['waiting', 'active'])

function isOpenSession(session) {
  return OPEN_ROOM_STATUSES.has(session?.status)
}

/** Sessions ouvertes — filtre status côté client (évite les filtres PostgREST fragiles). */
async function selectOpenSessions(extraFilter = '') {
  const filter = extraFilter ? `${extraFilter}&order=started_at.desc` : 'order=started_at.desc'
  const rows = await sbSelect('sessions', filter)
  return (rows || []).filter(isOpenSession)
}

function trainerNameKey(trainerLogin, trainerName, trainer) {
  const display = (trainerName || trainer?.display_name || '').trim()
  const fromDisplay = display.toLowerCase().split(/\s+/)[0]
  return fromDisplay || (trainerLogin || '').trim().toLowerCase()
}

export function trainerLoginFromDisplayName(pName) {
  const raw = (pName || '').toLowerCase().split(/\s+/)[0]
  return TRAINER_CANONICAL[raw] || raw
}

export function generateRoomCode(length = 4) {
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += ROOM_CODE_CHARSET[Math.floor(Math.random() * ROOM_CODE_CHARSET.length)]
  }
  return code
}

async function generateUniqueRoomCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateRoomCode(attempt > 6 ? 6 : 4)
    const rows = await sbSelect('sessions', `code=eq.${encodeURIComponent(code)}`)
    if (!rows?.length) return code
  }
  return `${generateRoomCode(4)}${Date.now().toString(36).slice(-2).toUpperCase()}`
}

export async function findActiveRoomForTrainer(trainerLogin, trainerName = '') {
  const login = (trainerLogin || '').trim().toLowerCase()
  if (!login) return null

  const trainer = await getTrainerFromDB(login)
  const nameKey = trainerNameKey(login, trainerName, trainer)

  if (trainer?.id) {
    const byTrainer = await selectOpenSessions(`trainer_id=eq.${trainer.id}`)
    if (byTrainer[0]) return byTrainer[0]
  }

  const openDynamic = (await selectOpenSessions()).filter(s => isDynamicRoomCode(s.code))

  if (nameKey) {
    const byLabel = openDynamic.find(s => (s.label || '').toLowerCase().includes(nameKey))
    if (byLabel) {
      if (trainer?.id && !byLabel.trainer_id) {
        await sbUpdate(
          'sessions',
          { trainer_id: trainer.id, updated_at: new Date().toISOString() },
          `code=eq.${encodeURIComponent(byLabel.code)}`
        )
      }
      return byLabel
    }
  }

  const activeCode = readTrainerActiveRoomCode()
  if (activeCode && isDynamicRoomCode(activeCode)) {
    const byCode = openDynamic.find(s => s.code === activeCode)
    if (byCode) return byCode
    setTrainerActiveRoomCode('')
  }

  return null
}

/** Salle active du formateur — source de vérité = BDD, localStorage synchronisé ensuite. */
export async function getLiveTrainerRoomCode(trainerLogin, trainerName = '') {
  const room = await findActiveRoomForTrainer(trainerLogin, trainerName)
  const code = room?.code || ''
  setTrainerActiveRoomCode(code)
  return code
}

/**
 * Résout quelle salle afficher sur l'écran TV.
 * Priorité localStorage (nouvelle salle) puis ?room= dans l'URL.
 */
export async function resolveTvRoomLiveCode() {
  const urlCode = getTvUrlRoomCode()
  const storedCode = readTrainerActiveRoomCode()
  const candidates = [...new Set([storedCode, urlCode].filter(c => isDynamicRoomCode(c)))]

  if (!candidates.length) {
    return { mode: 'legacy', code: '', live: true }
  }

  for (const code of candidates) {
    const rows = await sbSelect('sessions', `code=eq.${encodeURIComponent(code)}&limit=1`)
    const session = rows?.[0]
    if (isOpenSession(session)) {
      return { mode: 'room', code, live: true }
    }
  }

  return {
    mode: 'room',
    code: urlCode || storedCode || candidates[0],
    live: false,
  }
}

/**
 * Ouvre la salle active du formateur ou en crée une nouvelle.
 * 1 formateur = 1 salle active max.
 */
export async function openOrCreateRoom({
  trainerLogin,
  trainerName,
  categorySlug,
  label,
}) {
  if (!isValidFormationCategorySlug(categorySlug)) {
    throw new Error('Catégorie de salle invalide')
  }

  const existing = await findActiveRoomForTrainer(trainerLogin, trainerName)
  if (existing?.code) {
    setTrainerActiveRoomCode(existing.code)
    await setRoomSharedState({ tv_screen: 'qr' }, existing.code)
    return { code: existing.code, created: false, session: existing }
  }

  const trainer = await getTrainerFromDB(trainerLogin)
  const code = await generateUniqueRoomCode()
  const roomLabel = (label || '').trim() || formatDefaultRoomLabel(categorySlug, trainerName)
  const now = new Date().toISOString()

  const row = {
    code,
    trainer_id: trainer?.id || null,
    room_type: categorySlug,
    label: roomLabel,
    status: 'active',
    current_step: -1,
    active_scenario: 0,
    active_module: null,
    module_page: 0,
    started_at: now,
    updated_at: now,
  }

  // Si certaines colonnes optionnelles (room_type, label, trainer_id, started_at, updated_at)
  // n'existent pas encore en BDD, on retente avec les colonnes de base uniquement.
  let result
  try {
    result = await sbUpsertOrThrow('sessions', row, 'code')
  } catch {
    result = await sbUpsertOrThrow('sessions', {
      code,
      status: 'active',
      current_step: -1,
      active_scenario: 0,
      active_module: null,
      module_page: 0,
    }, 'code')
  }

  setTrainerActiveRoomCode(code)
  await setRoomSharedState({ tv_screen: 'qr' }, code)
  return { code, created: true, session: row }
}

export async function endActiveRoom(code, { trainerName } = {}) {
  const roomCode = (code || readTrainerActiveRoomCode() || '').trim()
  if (!roomCode || !isDynamicRoomCode(roomCode)) return false

  const { archived, hadData } = await archiveAndPurgeRoom(roomCode, { trainerName })

  const now = new Date().toISOString()
  const ok = await sbUpdate(
    'sessions',
    {
      status: 'ended',
      ended_at: now,
      updated_at: now,
      active_module: null,
      module_page: 0,
      current_step: -1,
      active_scenario: 0,
    },
    `code=eq.${encodeURIComponent(roomCode)}`
  )
  if (ok) {
    setTrainerActiveRoomCode('')
  }
  return { ok, archived, hadData }
}
