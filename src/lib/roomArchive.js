import { insertSessionHistory, sbDelete, sbSelect, getRoomSharedState, deleteTrainerStateByKey } from './supabase'

/**
 * Archive les données d'une salle puis purge les tables live + trainer_state.
 * Appelé à la fin de salle (endActiveRoom).
 */
export async function archiveAndPurgeRoom(roomCode, { trainerName } = {}) {
  const code = (roomCode || '').trim()
  if (!code) return { archived: false, hadData: false }

  const enc = encodeURIComponent(code)
  const filter = `session_code=eq.${enc}`

  const [sessionRows, participants, quizResults, quizAnswers, scenarioResponses, moduleResults, roomState] =
    await Promise.all([
      sbSelect('sessions', `code=eq.${enc}&limit=1`),
      sbSelect('participants', filter),
      sbSelect('quiz_results', filter),
      sbSelect('quiz_answers', filter),
      sbSelect('scenario_responses', filter),
      sbSelect('module_results', filter),
      getRoomSharedState(code),
    ])

  const session = sessionRows?.[0]
  const count =
    (participants?.length || 0) +
    (quizResults?.length || 0) +
    (quizAnswers?.length || 0) +
    (scenarioResponses?.length || 0) +
    (moduleResults?.length || 0)
  const hasRelationalData = count > 0

  const hasRoomState = roomState && Object.keys(roomState).length > 0
  const hadData = hasRelationalData || hasRoomState

  let archived = false
  if (hadData) {
    const resolvedTrainer =
      trainerName ||
      session?.label?.replace(/^(Présentiel|Visio)\s*—\s*/i, '') ||
      'Formateur'

    archived = await insertSessionHistory({
      sessionCode: `${code}_${Date.now()}`,
      sessionDate: new Date().toISOString(),
      trainerName: resolvedTrainer,
      participants: participants || [],
      quizResults: {
        type: 'room_archive',
        room_code: code,
        label: session?.label || null,
        room_type: session?.room_type || null,
        ended_at: new Date().toISOString(),
        scores: quizResults || [],
        answers: quizAnswers || [],
        module_results: moduleResults || [],
        room_state: hasRoomState ? roomState : null,
      },
      scenarioResponses: scenarioResponses || [],
    })
  }

  await Promise.all([
    sbDelete('participants', filter),
    sbDelete('quiz_results', filter),
    sbDelete('quiz_answers', filter),
    sbDelete('scenario_responses', filter),
    sbDelete('module_results', filter),
    deleteTrainerStateByKey(code),
  ])

  return { archived: !!archived, hadData }
}
