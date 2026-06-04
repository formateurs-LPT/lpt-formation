import {
  ensureSession,
  getRuntimeSessionCode,
  sbUpsert,
  sbInsert,
} from './supabase'

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
  if (!(await ensureSession())) return false

  const payload = {
    session_code: code,
    scenario_idx: scenarioIdx,
    participant_name: name,
    response: String(response ?? ''),
  }
  let ok = await sbUpsert(
    'scenario_responses',
    payload,
    'session_code,scenario_idx,participant_name'
  )
  if (!ok) {
    ok = await sbInsert('scenario_responses', payload)
  }
  return !!ok
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
  if (!(await ensureSession())) return false

  const payload = {
    session_code: code,
    module_id: moduleId,
    question_idx: questionIdx,
    collaborateur: name,
    answer_idx: answerIdx,
    is_correct: !!isCorrect,
  }
  let ok = await sbUpsert(
    'quiz_answers',
    payload,
    'session_code,module_id,question_idx,collaborateur'
  )
  if (!ok) {
    ok = await sbInsert('quiz_answers', payload)
  }
  return !!ok
}
