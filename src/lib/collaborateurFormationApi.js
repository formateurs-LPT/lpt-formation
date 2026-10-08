// Données du dashboard collaborateur complet (Ma progression / Cours / Exercices).
//
// Comment ajouter du contenu (sans toucher au code d'affichage) :
//   - Un THÈME = un id d'item déjà défini dans SKILL_ITEMS
//     (src/lib/storeFollowupData.js, ex. 'offres', 'lecture-ordonnance').
//     Pour ajouter un thème à un poste, modifier SKILL_ITEMS (fichier dédié
//     à ça, pas celui-ci) — hors périmètre de ce dashboard.
//   - Un COURS : `insert into cours (theme_id, titre, ordre, contenu) values
//     ('offres', 'Les 4 offres LPT', 1, '[{"type":"texte","valeur":"..."},
//     {"type":"image","url":"https://...","legende":"..."}]'::jsonb);`
//   - Un EXERCICE : `insert into exercices (theme_id, titre, ordre) values
//     ('offres', 'QCM Offres', 1) returning id;` puis une ligne
//     `exercice_questions` par question, `type='qcm'`,
//     `data='{"options":["A","B","C"],"correct":1}'::jsonb`.
//   - Voir supabase/create-dashboard-collaborateur.sql pour le schéma complet
//     et supabase/EXEMPLE-contenu-dashboard-collaborateur.sql pour un exemple
//     concret (à lancer uniquement en test).

import { sbSelect, sbUpsert, sbInsert, pgInList } from '@/lib/supabase'
import { pctFor } from '@/components/StoreFollowupShared'
import { getSkillItems, scoreToStatus, todayISO } from '@/lib/storeFollowupData'

// ── Résolution magasin ──────────────────────────────────────────────────────
// store_followup_progress utilise le slug magasin (ex. 'bayonne'), pas l'uuid.
export async function getMagasinSlug(magasinId) {
  if (!magasinId) return null
  const rows = await sbSelect('magasins', `id=eq.${magasinId}&select=slug`)
  return rows?.[0]?.slug || null
}

// ── Ma progression ───────────────────────────────────────────────────────────
// Lecture scopée à CE collaborateur uniquement (store+collaborateur dans le
// filtre), contrairement à useStoreFollowupProgress (vue formateur/manager)
// qui charge tout le magasin — un collaborateur ne doit voir que ses propres
// données. Le calcul (`pctFor`) est en revanche exactement le même import,
// jamais réimplémenté, pour garantir un chiffre identique à celui du manager.
export async function getProgressionCollaborateur({ storeSlug, collaborateurSlug, sectionId, isBelgique }) {
  if (!storeSlug || !collaborateurSlug || !sectionId) {
    return { progress: {}, items: [], pctGlobal: 0, parThemeId: {} }
  }
  const rows = await sbSelect(
    'store_followup_progress',
    `store=eq.${encodeURIComponent(storeSlug)}&collaborateur=eq.${encodeURIComponent(collaborateurSlug)}&order=audit_date.desc`
  )
  const progress = {}
  for (const r of rows || []) {
    const key = `${r.collaborateur}:${r.item_id}`
    // déjà trié desc par audit_date : la première occurrence est la plus récente
    if (!progress[key]) progress[key] = { status: r.status, score: r.score ?? null, note: r.note || '' }
  }
  const items = getSkillItems(sectionId, isBelgique)
  const pctGlobal = pctFor(progress, collaborateurSlug, sectionId, isBelgique)
  const parThemeId = {}
  for (const it of items) {
    const entry = progress[`${collaborateurSlug}:${it.id}`]
    const pct = entry?.score != null ? Math.round((entry.score / 5) * 100) : null
    parThemeId[it.id] = { ...it, pct, score: entry?.score ?? null, note: entry?.note || '', status: entry?.status || null }
  }
  return { progress, items, pctGlobal, parThemeId }
}

// ── Cours ────────────────────────────────────────────────────────────────────
export async function getCoursParTheme(themeIds) {
  if (!themeIds?.length) return {}
  const rows = await sbSelect('cours', `theme_id=in.(${pgInList(themeIds)})&order=ordre.asc`)
  const parTheme = {}
  for (const c of rows || []) {
    if (!parTheme[c.theme_id]) parTheme[c.theme_id] = []
    parTheme[c.theme_id].push(c)
  }
  return parTheme
}

export async function getLecturesCollaborateur(collaborateurId) {
  if (!collaborateurId) return {}
  const rows = await sbSelect('cours_lectures', `collaborateur_id=eq.${collaborateurId}`)
  const parCoursId = {}
  for (const l of rows || []) parCoursId[l.cours_id] = l.lu_at
  return parCoursId
}

export async function marquerCoursLu(coursId, collaborateurId) {
  return sbUpsert('cours_lectures', {
    cours_id: coursId,
    collaborateur_id: collaborateurId,
    lu_at: new Date().toISOString(),
  }, 'cours_id,collaborateur_id')
}

// ── Exercices ────────────────────────────────────────────────────────────────
export async function getExercicesParTheme(themeIds) {
  if (!themeIds?.length) return {}
  const rows = await sbSelect('exercices', `theme_id=in.(${pgInList(themeIds)})&order=ordre.asc`)
  const parTheme = {}
  for (const e of rows || []) {
    if (!parTheme[e.theme_id]) parTheme[e.theme_id] = []
    parTheme[e.theme_id].push(e)
  }
  return parTheme
}

export async function getQuestionsExercice(exerciceId) {
  return sbSelect('exercice_questions', `exercice_id=eq.${exerciceId}&order=ordre.asc`)
}

/** Derniers résultats d'un collaborateur, un par exercice (pour affichage "déjà fait"). */
export async function getResultatsCollaborateur(collaborateurId) {
  if (!collaborateurId) return {}
  const rows = await sbSelect('exercice_resultats', `collaborateur_id=eq.${collaborateurId}&order=completed_at.desc`)
  const parExerciceId = {}
  for (const r of rows || []) {
    if (!parExerciceId[r.exercice_id]) parExerciceId[r.exercice_id] = r // le plus récent (desc)
  }
  return parExerciceId
}

/**
 * Enregistre le résultat d'un exercice (mode 'entrainement' toujours).
 * Si le flag exercices_comptent_dans_maitrise est à 'true', écrit AUSSI dans
 * store_followup_progress (même table/format que useStoreFollowupProgress,
 * jamais modifié ici) pour que le résultat compte réellement dans le taux de
 * maîtrise vu par le manager. Si le flag est 'false' (défaut), rien d'autre
 * n'est écrit : zéro effet sur les dashboards manager/RH/direction/formateur.
 */
export async function soumettreResultatExercice({ exerciceId, collaborateurId, themeId, score, total, storeSlug, collaborateurSlug }) {
  await sbInsert('exercice_resultats', {
    exercice_id: exerciceId,
    collaborateur_id: collaborateurId,
    theme_id: themeId,
    mode: 'entrainement',
    score,
    total,
    completed_at: new Date().toISOString(),
  })

  const comptent = await exercicesComptentDansMaitrise()
  if (comptent && storeSlug && collaborateurSlug && total > 0) {
    const score5 = Math.max(0, Math.min(5, Math.round((score / total) * 5)))
    await sbUpsert('store_followup_progress', {
      store: storeSlug,
      collaborateur: collaborateurSlug,
      item_id: themeId,
      audit_date: todayISO(),
      status: scoreToStatus(score5),
      score: score5,
      note: null,
      updated_by: 'Auto (exercice)',
      updated_at: new Date().toISOString(),
    }, 'store,collaborateur,item_id,audit_date')
  }
}

// ── Paramètre global ─────────────────────────────────────────────────────────
// Lecture seule ici (jamais modifié par le code) — la bascule se fait à la
// main en base, comme sync_entrees_rh_active (voir src/lib/rhApi.js).
export async function exercicesComptentDansMaitrise() {
  const rows = await sbSelect('parametres_app', `cle=eq.exercices_comptent_dans_maitrise`)
  return rows?.[0]?.valeur === 'true'
}
