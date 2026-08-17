import { sbSelect } from './supabase'
import { MODULE_DATA } from './modulesData'

// Règle unique de scoring : 10 points par bonne réponse, que ce soit dans un quiz de
// module (quiz_answers), une question ouverte notée par le formateur — jeu des
// questions, entraînement oral… (open_answers), ou un exercice noté type saisie
// interactive (module_results).
export const POINTS_PER_CORRECT = 10

/**
 * Construit le classement à partir des 3 sources de bonnes réponses de l'app.
 * Chaque source est dédupliquée pour qu'une même question ne rapporte des points
 * qu'une seule fois, même en cas de renvoi/upsert multiple.
 * Classement basé sur le TAUX de bonnes réponses (pas le nombre brut de points) :
 * un formé qui a répondu à moins de questions ne doit pas être défavorisé face à
 * un formé qui en a fait plus mais avec un taux de réussite plus faible.
 */
export function buildParticipantRanking({ quizAnswers = [], openAnswers = [], moduleResults = [] } = {}) {
  const statsByName = {} // { name: { correct, total } }
  const bump = (name, isCorrect, weight = 1) => {
    const n = (name || '').trim()
    if (!n) return
    if (!statsByName[n]) statsByName[n] = { correct: 0, total: 0 }
    statsByName[n].total += weight
    if (isCorrect) statsByName[n].correct += weight
  }

  // Quiz de module — le taux doit porter sur TOUTES les questions du quiz
  // auquel le formé a participé, pas seulement celles auxquelles il a
  // répondu : sinon 1 bonne réponse sur 1 question tentée (dans un quiz qui
  // en compte 10) affichait 100% au lieu du 10% réel (incident du 18/08).
  // Le "jeu des questions"/entraînement oral, qui réutilise quiz_answers
  // avec question_idx >= 100, n'a pas de total fixe (nombre de questions
  // orales variable) — traité comme les questions ouvertes, 1:1.
  const seenQuiz = new Set()
  const quizCorrectByNameModule = {} // { `${name}|${moduleId}`: nbBonnesRéponses } — idx < 100 uniquement
  // "collaborateur|module_id" déjà couvert par quiz_answers (idx < 100) — sert à
  // exclure ces modules du décompte module_results plus bas : le dashboard formé
  // (PersonalResultsScreen) enregistre aussi un résumé module_results à la fin
  // d'un quiz classique, en plus des réponses détaillées déjà comptées ici —
  // sans cette exclusion, chaque bonne réponse de quiz était comptée deux fois.
  const quizModulePairs = new Set()
  for (const r of quizAnswers) {
    if (!r?.collaborateur || !r?.module_id) continue
    const qi = r.question_idx ?? 0
    const key = `${r.collaborateur}|${r.module_id}|${qi}`
    if (seenQuiz.has(key)) continue
    seenQuiz.add(key)
    if (qi >= 100) {
      bump(r.collaborateur, !!r.is_correct)
      continue
    }
    const gKey = `${r.collaborateur}|${r.module_id}`
    quizModulePairs.add(gKey)
    quizCorrectByNameModule[gKey] = (quizCorrectByNameModule[gKey] || 0) + (r.is_correct ? 1 : 0)
  }
  for (const [key, correctCount] of Object.entries(quizCorrectByNameModule)) {
    const sep = key.lastIndexOf('|')
    const name = key.slice(0, sep)
    const moduleId = key.slice(sep + 1)
    const quizLen = MODULE_DATA[moduleId]?.quiz?.length
    if (!quizLen) continue // module/quiz inconnu — on ignore plutôt que de fausser le taux
    if (!statsByName[name]) statsByName[name] = { correct: 0, total: 0 }
    statsByName[name].correct += correctCount
    statsByName[name].total += quizLen
  }

  // Questions ouvertes notées hors quiz (jeu des questions, entraînement oral…) —
  // une réponse comptée par page_id et par formé (on garde la note la plus récente).
  const latestOpenByKey = {}
  for (const r of openAnswers) {
    if (r?.is_correct == null || !r?.participant_name) continue
    const key = `${r.participant_name}|${r.page_id}`
    const prev = latestOpenByKey[key]
    if (!prev || new Date(r.created_at || 0) > new Date(prev.created_at || 0)) latestOpenByKey[key] = r
  }
  for (const r of Object.values(latestOpenByKey)) {
    bump(r.participant_name, !!r.is_correct)
  }

  // Exercices notés (ex: saisie interactive) — score/total connus directement.
  // Une ligne par (collaborateur, module_id, semaine) : on garde le total le plus
  // élevé par module plutôt que la première ligne rencontrée (ordre non garanti).
  // Exclut les module_id déjà couverts par quiz_answers : le dashboard formé
  // (PersonalResultsScreen) enregistre aussi un résumé module_results à la fin
  // d'un quiz classique, en plus des réponses détaillées — sans cette exclusion,
  // chaque bonne réponse de quiz était comptée deux fois (quiz_answers + résumé).
  const bestModule = {}
  for (const r of moduleResults) {
    if (!r?.collaborateur || !r?.module_id) continue
    const key = `${r.collaborateur}|${r.module_id}`
    if (quizModulePairs.has(key)) continue
    const score = r.score || 0
    const total = r.score_total ?? r.total ?? score
    if (!bestModule[key] || total > bestModule[key].total) bestModule[key] = { score, total }
  }
  for (const [key, { score, total }] of Object.entries(bestModule)) {
    const n = key.split('|')[0].trim()
    if (!n || !total) continue
    if (!statsByName[n]) statsByName[n] = { correct: 0, total: 0 }
    statsByName[n].correct += score
    statsByName[n].total += total
  }

  const rows = Object.entries(statsByName)
    .map(([name, s]) => ({
      name,
      correct: s.correct,
      total: s.total,
      points: s.correct * POINTS_PER_CORRECT,
      rate: s.total ? s.correct / s.total : 0,
    }))
    // Classé par taux de réussite d'abord, nombre de réponses en départage
    // (à taux égal, celui qui a répondu à plus de questions passe devant)
    .sort((a, b) => b.rate - a.rate || b.total - a.total || a.name.localeCompare(b.name))

  let rk = 1
  return rows.map((entry, i) => {
    if (i > 0 && entry.rate !== rows[i - 1].rate) rk = i + 1
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
