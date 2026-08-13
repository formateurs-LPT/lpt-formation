import { sbSelect } from './supabase'

// Règle unique de scoring : 10 points par bonne réponse, que ce soit dans un quiz de
// module (quiz_answers), une question ouverte notée par le formateur — jeu des
// questions, entraînement oral… (open_answers), ou un exercice noté type saisie
// interactive (module_results).
export const POINTS_PER_CORRECT = 10

/**
 * Construit le classement à partir des 3 sources de bonnes réponses de l'app.
 * Chaque source est dédupliquée pour qu'une même question ne rapporte des points
 * qu'une seule fois, même en cas de renvoi/upsert multiple.
 */
export function buildParticipantRanking({ quizAnswers = [], openAnswers = [], moduleResults = [] } = {}) {
  const correctByName = {}
  const bump = (name) => {
    const n = (name || '').trim()
    if (!n) return
    correctByName[n] = (correctByName[n] || 0) + 1
  }

  // Quiz de module — une bonne réponse par (module, question) et par formé
  const seenQuiz = new Set()
  for (const r of quizAnswers) {
    if (!r?.is_correct) continue
    const key = `${r.collaborateur}|${r.module_id}|${r.question_idx}`
    if (seenQuiz.has(key)) continue
    seenQuiz.add(key)
    bump(r.collaborateur)
  }

  // Questions ouvertes notées hors quiz (jeu des questions, entraînement oral…) —
  // une bonne réponse par page_id et par formé (on garde la note la plus récente).
  const latestOpenByKey = {}
  for (const r of openAnswers) {
    if (r?.is_correct == null || !r?.participant_name) continue
    const key = `${r.participant_name}|${r.page_id}`
    const prev = latestOpenByKey[key]
    if (!prev || new Date(r.created_at || 0) > new Date(prev.created_at || 0)) latestOpenByKey[key] = r
  }
  for (const r of Object.values(latestOpenByKey)) {
    if (r.is_correct) bump(r.participant_name)
  }

  // Exercices notés (ex: saisie interactive) — score = nb de bonnes réponses/cas,
  // on ignore le champ xp stocké pour ne pas hériter d'un éventuel mauvais multiplicateur.
  // Une ligne par (collaborateur, module_id, semaine) : on garde le meilleur score
  // par module plutôt que la première ligne rencontrée (ordre non garanti).
  const bestModuleScore = {}
  for (const r of moduleResults) {
    if (!r?.collaborateur || !r?.module_id) continue
    const key = `${r.collaborateur}|${r.module_id}`
    const sc = r.score || 0
    if (bestModuleScore[key] === undefined || sc > bestModuleScore[key]) bestModuleScore[key] = sc
  }
  for (const [key, sc] of Object.entries(bestModuleScore)) {
    const n = key.split('|')[0].trim()
    if (!n) continue
    correctByName[n] = (correctByName[n] || 0) + sc
  }

  const rows = Object.entries(correctByName)
    .map(([name, correct]) => ({ name, correct, points: correct * POINTS_PER_CORRECT }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))

  let rk = 1
  return rows.map((entry, i) => {
    if (i > 0 && entry.points !== rows[i - 1].points) rk = i + 1
    return { ...entry, rank: rk }
  })
}

/**
 * Charge les 3 sources de bonnes réponses et construit le classement.
 * `sessionCode` sert UNIQUEMENT à déterminer le groupe de formés à classer
 * (qui est/a été dans cette salle) — le score de CHACUN prend ensuite en
 * compte TOUTES ses réponses, peu importe la salle où elles ont été données
 * (un formé a un compte de points individuel, pas un compte par salle —
 * scoper le score lui-même par session_code faisait disparaître des points
 * bien réels dès qu'une salle était recréée, incident IDF du 13/08).
 */
export async function fetchParticipantRanking(sessionCode) {
  const code = (sessionCode || '').trim()
  if (!code) return []
  const participantRows = await sbSelect('participants', `session_code=eq.${encodeURIComponent(code)}`)
  const names = [...new Set((participantRows || []).map(p => p.name).filter(Boolean))]
  if (!names.length) return []

  const perName = await Promise.all(names.map(async (n) => {
    const nameFilter = `collaborateur=eq.${encodeURIComponent(n)}`
    const [quizAnswers, openAnswers, moduleResults] = await Promise.all([
      sbSelect('quiz_answers', nameFilter),
      sbSelect('open_answers', `participant_name=eq.${encodeURIComponent(n)}&is_correct=not.is.null`),
      sbSelect('module_results', nameFilter),
    ])
    return { quizAnswers: quizAnswers || [], openAnswers: openAnswers || [], moduleResults: moduleResults || [] }
  }))

  return buildParticipantRanking({
    quizAnswers: perName.flatMap(p => p.quizAnswers),
    openAnswers: perName.flatMap(p => p.openAnswers),
    moduleResults: perName.flatMap(p => p.moduleResults),
  })
}

export const LEVELS = [
  { name: 'Débutant',  icon: '🌱', color: '#6b7280', bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)' },
  { name: 'Apprenti',  icon: '⭐', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.35)' },
  { name: 'Confirmé',  icon: '🔥', color: '#f97316', bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.35)' },
  { name: 'Expert',    icon: '💎', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.35)' },
  { name: 'Maître',    icon: '🏅', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.35)' },
  { name: 'Légende',   icon: '👑', color: '#eab308', bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.35)'  },
]

// Palier plat provisoire : un niveau tous les POINTS_PER_LEVEL points — simple
// exprès en attendant assez de recul pour ajuster la courbe (cf. Quentin, 13/08).
export const POINTS_PER_LEVEL = 50

export function getLevelInfo(points) {
  const level = Math.min(LEVELS.length - 1, Math.floor(Math.max(0, points) / POINTS_PER_LEVEL))
  const isMaxLevel = level >= LEVELS.length - 1
  const accumulated = level * POINTS_PER_LEVEL
  const progressInLevel = points - accumulated
  return {
    level,
    levelDef: LEVELS[level],
    progressInLevel,
    ptsForLevel: POINTS_PER_LEVEL,
    ptsToNext: isMaxLevel ? 0 : Math.max(0, POINTS_PER_LEVEL - progressInLevel),
    progressPct: isMaxLevel ? 100 : Math.min(100, (progressInLevel / POINTS_PER_LEVEL) * 100),
    isMaxLevel,
  }
}

export function getRankMessage(rank) {
  if (rank === 1) return { text: '🏆 Tu domines le classement ! Impressionnant.', color: '#fbbf24' }
  if (rank === 2) return { text: '🥈 Très proche du sommet ! La 1ère place est à portée.', color: '#94a3b8' }
  if (rank === 3) return { text: '🥉 Sur le podium ! Continue sur ta lancée.', color: '#cd7f32' }
  if (rank === 4) return { text: '4ème… le podium est juste là ! T\'as pas envie de les rejoindre ? 😏', color: '#00abe9' }
  return { text: '💪 Continue ! Chaque bonne réponse te rapproche du sommet.', color: 'rgba(255,255,255,0.55)' }
}
