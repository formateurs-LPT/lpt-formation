import { TRAINER_CANONICAL } from './constants'
import { formatDefaultRoomLabel, isValidFormationCategorySlug } from './formationCategories'
import {
  readTrainerActiveRoomCode,
  setTrainerActiveRoomCode,
} from './sessionCode'
import { getTrainerFromDB, sbSelect, sbUpdate, sbUpsert } from './supabase'

const ROOM_CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

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

export async function findActiveRoomForTrainer(trainerLogin) {
  const login = (trainerLogin || '').trim().toLowerCase()
  if (!login) return null

  const trainer = await getTrainerFromDB(login)
  if (trainer?.id) {
    const rows = await sbSelect(
      'sessions',
      `trainer_id=eq.${trainer.id}&status=eq.active&order=started_at.desc&limit=1`
    )
    if (rows?.[0]) return rows[0]
  }

  const activeCode = readTrainerActiveRoomCode()
  if (activeCode) {
    const rows = await sbSelect(
      'sessions',
      `code=eq.${encodeURIComponent(activeCode)}&status=eq.active&limit=1`
    )
    if (rows?.[0]) return rows[0]
  }

  return null
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

  const existing = await findActiveRoomForTrainer(trainerLogin)
  if (existing?.code) {
    setTrainerActiveRoomCode(existing.code)
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

  const result = await sbUpsert('sessions', row, 'code')
  if (!result) throw new Error('Impossible de créer la salle en base')

  setTrainerActiveRoomCode(code)
  return { code, created: true, session: row }
}

export async function endActiveRoom(code) {
  const roomCode = (code || readTrainerActiveRoomCode() || '').trim()
  if (!roomCode) return false

  const now = new Date().toISOString()
  const ok = await sbUpdate(
    'sessions',
    { status: 'ended', ended_at: now, updated_at: now },
    `code=eq.${encodeURIComponent(roomCode)}`
  )
  if (ok && readTrainerActiveRoomCode() === roomCode) {
    setTrainerActiveRoomCode('')
  }
  return ok
}
