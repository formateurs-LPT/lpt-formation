import {
  ensureSession,
  getRuntimeSessionCode,
  sbUpsert,
  sbInsert,
  sbDelete,
} from './supabase'

/**
 * L'upsert PostgREST échoue silencieusement (sbUpsert renvoie null) s'il
 * manque la contrainte unique correspondante côté base. Insérer en repli
 * dans ce cas créait une NOUVELLE ligne à chaque réponse (y compris un
 * changement de réponse à la même question), ce qui gonflait le compte de
 * bonnes/mauvaises réponses affiché en fin de quiz (ex: 30 réponses pour 8
 * formés). On supprime d'abord toute ligne existante pour cette clé avant
 * d'insérer, pour ne jamais dupliquer même sans contrainte unique en base.
 */
async function upsertNoDuplicate(table, payload, onConflict, filter) {
  const ok = await sbUpsert(table, payload, onConflict)
  if (ok) return true
  await sbDelete(table, filter)
  return sbInsert(table, payload)
}

/** Enregistre une réponse quiz / ordonnance (formation classique) */
export async function saveScenarioResponse({
  sessionCode,
  scenarioIdx,
  participantName,
  response,
}) {
  const code = sessionCode || getRuntimeSessionCode()
  const name = (participantName || '').trim()
  if (!code || !name) {
    console.error('[saveScenarioResponse] session ou nom manquant', { code, name })
    return false
  }
  if (!(await ensureSession(code))) return false

  const payload = {
    session_code: code,
    scenario_idx: scenarioIdx,
    participant_name: name,
    response: String(response ?? ''),
  }
  return upsertNoDuplicate(
    'scenario_responses',
    payload,
    'session_code,scenario_idx,participant_name',
    `session_code=eq.${encodeURIComponent(code)}&scenario_idx=eq.${scenarioIdx}&participant_name=eq.${encodeURIComponent(name)}`
  )
}

/** Enregistre une réponse quiz module (PDM, optique, types-verres) */
export async function saveModuleQuizAnswer({
  sessionCode,
  moduleId,
  questionIdx,
  collaborateur,
  answerIdx,
  isCorrect,
}) {
  const code = sessionCode || getRuntimeSessionCode()
  const name = (collaborateur || '').trim()
  if (!code || !name || moduleId == null) {
    console.error('[saveModuleQuizAnswer] données manquantes', { code, name, moduleId })
    return false
  }
  if (!(await ensureSession(code))) return false

  const payload = {
    session_code: code,
    module_id: moduleId,
    question_idx: questionIdx,
    collaborateur: name,
    answer_idx: answerIdx,
    is_correct: !!isCorrect,
  }
  return upsertNoDuplicate(
    'quiz_answers',
    payload,
    'session_code,module_id,question_idx,collaborateur',
    `session_code=eq.${encodeURIComponent(code)}&module_id=eq.${encodeURIComponent(moduleId)}&question_idx=eq.${questionIdx}&collaborateur=eq.${encodeURIComponent(name)}`
  )
}
