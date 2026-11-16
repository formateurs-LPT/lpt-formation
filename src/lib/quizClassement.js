import { sbSelect, getRoomSharedState } from './supabase'

// Classement des quiz (podium TV, classement formateur, position sur le
// téléphone) — UNE seule règle partout :
//   1. le plus de bonnes réponses ;
//   2. à score égal, le temps de réponse moyen le plus court ;
//   3. en dernier recours seulement, l'ordre alphabétique.
// Avant, les ex æquo étaient départagés par ordre alphabétique : deux formés
// avec le même score pouvaient finir 1er et 2e uniquement à cause de leur nom.
//
// Temps de réponse d'une question = heure de la réponse − heure d'affichage de
// la question (quiz_starts, posé par le chrono). Une question sans réponse
// compte pour la durée maximale du chrono, pour ne pas avantager celui qui ne
// répond pas. L'heure de réponse est celle où le FORMÉ a envoyé : pour les
// questions à texte libre, la ligne quiz_answers est créée au moment où le
// formateur valide, donc on prend l'heure d'envoi dans open_answers.

const LIMITE_PAR_DEFAUT_SEC = 120

/** Données de chronométrage d'un quiz pour une salle (à charger une fois). */
export async function chargerChronoQuiz(sessionCode, moduleId) {
  const [etat, ouvertes] = await Promise.all([
    getRoomSharedState(sessionCode).catch(() => ({})),
    sbSelect('open_answers', `session_code=eq.${encodeURIComponent(sessionCode)}&page_id=like.${encodeURIComponent(`${moduleId}:`)}*&select=page_id,participant_name,created_at`).catch(() => []),
  ])
  return { starts: etat?.quiz_starts || {}, ouvertes: ouvertes || [] }
}

const cleNom = (n) => String(n || '').trim().toLowerCase()

/**
 * rows      : lignes quiz_answers du module (déjà filtrées sur les questions voulues)
 * chrono    : résultat de chargerChronoQuiz (facultatif — sans lui, départage alphabétique)
 * limiteSec : durée max d'une question (chrono)
 * Retourne [{ name, score, tempsMoyen }] trié, tempsMoyen en secondes (null si inconnu).
 */
export function classerQuiz(rows, { moduleId, chrono, limiteSec = LIMITE_PAR_DEFAUT_SEC } = {}) {
  // Une seule ligne par (formé, question) : la plus récente
  const derniere = {}
  for (const r of rows || []) {
    if (!r.collaborateur) continue
    const k = `${r.collaborateur}__${r.question_idx}`
    if (!derniere[k] || (r.id ?? 0) > (derniere[k].id ?? 0)) derniere[k] = r
  }
  const lignes = Object.values(derniere)
  const questions = [...new Set(lignes.map(r => r.question_idx))]

  // Heure d'envoi des réponses libres : 1re soumission par (formé, question)
  const envoiLibre = {}
  for (const o of chrono?.ouvertes || []) {
    const qi = Number(String(o.page_id).split(':').pop())
    const k = `${cleNom(o.participant_name)}__${qi}`
    const t = Date.parse(o.created_at)
    if (!Number.isNaN(t) && (!(k in envoiLibre) || t < envoiLibre[k])) envoiLibre[k] = t
  }

  const parNom = {}
  for (const r of lignes) {
    const p = parNom[r.collaborateur] || (parNom[r.collaborateur] = { name: r.collaborateur, score: 0, temps: {} })
    if (r.is_correct) p.score++
    const debut = Number(chrono?.starts?.[`${moduleId}:${r.question_idx}`])
    const fin = envoiLibre[`${cleNom(r.collaborateur)}__${r.question_idx}`] ?? Date.parse(r.created_at)
    if (debut && !Number.isNaN(fin)) {
      p.temps[r.question_idx] = Math.min(limiteSec, Math.max(0, (fin - debut) / 1000))
    }
  }

  // Seules les questions chronométrées comptent pour le temps
  const chronometrees = questions.filter(qi => chrono?.starts?.[`${moduleId}:${qi}`])
  return Object.values(parNom).map(p => {
    let tempsMoyen = null
    if (chronometrees.length) {
      const total = chronometrees.reduce((s, qi) => s + (p.temps[qi] ?? limiteSec), 0)
      tempsMoyen = total / chronometrees.length
    }
    return { name: p.name, score: p.score, tempsMoyen }
  }).sort((a, b) =>
    b.score - a.score
    || (a.tempsMoyen ?? Infinity) - (b.tempsMoyen ?? Infinity)
    || a.name.localeCompare(b.name)
  )
}

/** « 12,4 s » — affichage du temps moyen sous le nom au podium. */
export function formaterTempsMoyen(sec) {
  if (sec == null) return ''
  return `${sec.toFixed(1).replace('.', ',')} s`
}
