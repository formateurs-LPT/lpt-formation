// Couche données — script 3 (suivi terrain : notes quotidiennes + reporting
// hebdo partagé). Même schéma relationnel que collaborateursApi.js.
import { sbSelect, sbInsert, sbUpdate, sbDelete, getTrainerFromDB } from '@/lib/supabase'
import { getTrainerAvatarKey } from '@/lib/constants'

/** Résout le pName affiché en session vers l'id trainers (uuid) réel. */
export async function getFormateurId(pName) {
  const row = await getTrainerFromDB(getTrainerAvatarKey(pName))
  return row?.id || null
}

/** Notes terrain d'un magasin, tous formateurs, avec le nom de l'auteur résolu. */
export async function getNotesTerrain(magasinId) {
  if (!magasinId) return []
  const [notes, trainers] = await Promise.all([
    sbSelect('notes_terrain', `magasin_id=eq.${magasinId}&order=date.desc,created_at.desc`),
    sbSelect('trainers', 'select=id,display_name'),
  ])
  const nameById = Object.fromEntries((trainers || []).map(t => [t.id, t.display_name]))
  return (notes || []).map(n => ({ ...n, auteur: nameById[n.formateur_id] || 'Formateur' }))
}

export async function addNoteTerrain({ magasinId, formateurId, typeNote = 'texte', contenu, audioUrl, piecesJointes, pole, rubrique, theme, collaborateursCites, motDeLaFin, confidentiel }) {
  return sbInsert('notes_terrain', {
    magasin_id: magasinId,
    formateur_id: formateurId,
    type_note: typeNote,
    contenu: contenu || null,
    audio_url: audioUrl || null,
    pieces_jointes: piecesJointes || [],
    pole: pole || null,
    rubrique: rubrique || null,
    theme: theme?.trim() || null,
    collaborateurs_cites: collaborateursCites?.length ? collaborateursCites : null,
    mot_de_la_fin: !!motDeLaFin,
    confidentiel: !!confidentiel,
  })
}

/** Modification ouverte à tout formateur — même politique que les notes de
 * suivi collaborateur (script 4). */
export async function updateNoteTerrain({ id, contenu }) {
  return sbUpdate('notes_terrain', { contenu }, `id=eq.${id}`)
}

/** Suppression réservée à l'auteur original — filtre sur formateur_id en
 * plus de l'id, même politique que les notes de suivi collaborateur. */
export async function deleteNoteTerrain({ id, requesterId }) {
  return sbDelete('notes_terrain', `id=eq.${id}&formateur_id=eq.${requesterId}`)
}

/** Lundi 00h00 de la semaine de `d` (comme le reste de l'app). */
export function startOfWeek(d = new Date()) {
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  const start = new Date(d)
  start.setDate(d.getDate() + diff)
  start.setHours(0, 0, 0, 0)
  return start
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function currentWeekBounds() {
  const start = startOfWeek()
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { debut: toISODate(start), fin: toISODate(end) }
}

/** Notes de CE formateur, sur ce magasin, pour la semaine en cours — base de
 * la génération du reporting (script 3, étape 3). */
export async function getNotesSemaine(magasinId, formateurId) {
  if (!magasinId || !formateurId) return []
  const { debut, fin } = currentWeekBounds()
  const rows = await sbSelect(
    'notes_terrain',
    `magasin_id=eq.${magasinId}&formateur_id=eq.${formateurId}&date=gte.${debut}&date=lte.${fin}&order=date.asc`
  )
  return rows || []
}

/** Reportings hebdo d'un magasin, tous formateurs — réutilisable telle
 * quelle pour manager/DR/directeur retail (script 5), filtrable par magasin_id.
 * `formateur_id` null = synthèse hebdo auto-générée (tous formateurs confondus,
 * cf. genererSyntheseSiNecessaire), pas le reporting d'un formateur en particulier. */
export async function getReportingsHebdo(magasinId) {
  if (!magasinId) return []
  const [reportings, trainers] = await Promise.all([
    sbSelect('reportings_hebdo', `magasin_id=eq.${magasinId}&order=semaine_debut.desc`),
    sbSelect('trainers', 'select=id,display_name'),
  ])
  const nameById = Object.fromEntries((trainers || []).map(t => [t.id, t.display_name]))
  return (reportings || []).map(r => ({
    ...r,
    auteur: r.formateur_id ? (nameById[r.formateur_id] || 'Formateur') : '🧩 Synthèse d\'équipe',
  }))
}

/** Notes de TOUS les formateurs sur ce magasin, pour la semaine en cours —
 * base de la synthèse hebdo auto-générée (contrairement à getNotesSemaine,
 * qui ne prend que celles d'un formateur donné). */
export async function getNotesSemaineTousFormateurs(magasinId) {
  if (!magasinId) return []
  const { debut, fin } = currentWeekBounds()
  const [notes, trainers] = await Promise.all([
    sbSelect('notes_terrain', `magasin_id=eq.${magasinId}&date=gte.${debut}&date=lte.${fin}&order=date.asc`),
    sbSelect('trainers', 'select=id,display_name'),
  ])
  const nameById = Object.fromEntries((trainers || []).map(t => [t.id, t.display_name]))
  return (notes || []).map(n => ({ ...n, auteur: nameById[n.formateur_id] || 'Formateur' }))
}

/** Vendredi 18h00 de la semaine en cours (même semaine que currentWeekBounds). */
function fridayEveningThisWeek() {
  const { debut } = currentWeekBounds()
  const friday = new Date(`${debut}T00:00:00`)
  friday.setDate(friday.getDate() + 4)
  friday.setHours(18, 0, 0, 0)
  return friday
}

/**
 * Génère la synthèse hebdo (tous formateurs confondus) pour un magasin,
 * une seule fois par semaine, à partir du moment où on est vendredi 18h ou
 * après. Pas de vrai cron serveur (export statique, pas d'edge function
 * déployée) : le check se fait côté client, à l'ouverture de "Mes retours"
 * — la génération arrive donc dès la première visite après vendredi 18h,
 * pas pile à l'heure, mais avant que "le prochain formateur" ne la consulte.
 * Idempotent : si une synthèse existe déjà pour cette semaine, ne fait rien.
 */
export async function genererSyntheseSiNecessaire(magasinId) {
  if (!magasinId) return null
  if (new Date() < fridayEveningThisWeek()) return null

  const { debut, fin } = currentWeekBounds()
  const existing = await sbSelect(
    'reportings_hebdo',
    `magasin_id=eq.${magasinId}&semaine_debut=eq.${debut}&formateur_id=is.null`
  )
  if (existing?.length) return existing[0]

  const notes = await getNotesSemaineTousFormateurs(magasinId)
  if (!notes.length) return null

  const lignes = notes.map(n => `- ${n.date} (${n.auteur}) : ${n.contenu || '(pièce jointe sans texte)'}`)
  const contenuGenere = `Synthèse de la semaine du ${debut} au ${fin} :\n\n${lignes.join('\n')}`

  const ok = await sbInsert('reportings_hebdo', {
    formateur_id: null, magasin_id: magasinId, semaine_debut: debut, semaine_fin: fin, contenu_genere: contenuGenere,
  })
  if (!ok) return null
  const rows = await sbSelect(
    'reportings_hebdo',
    `magasin_id=eq.${magasinId}&semaine_debut=eq.${debut}&formateur_id=is.null&order=created_at.desc&limit=1`
  )
  return rows?.[0] || null
}

// sbInsert répond en `return=minimal` (juste true/false, pas la ligne créée)
// — on rappelle juste après pour récupérer l'id réel, nécessaire ensuite
// pour marquer envoye_at au moment de l'envoi du mail.
export async function saveReportingHebdo({ formateurId, magasinId, contenuGenere, contenuStructure }) {
  const { debut, fin } = currentWeekBounds()
  const ok = await sbInsert('reportings_hebdo', {
    formateur_id: formateurId,
    magasin_id: magasinId,
    semaine_debut: debut,
    semaine_fin: fin,
    contenu_genere: contenuGenere,
    contenu_structure: contenuStructure || null,
  })
  if (!ok) return null
  const rows = await sbSelect(
    'reportings_hebdo',
    `formateur_id=eq.${formateurId}&magasin_id=eq.${magasinId}&semaine_debut=eq.${debut}&order=created_at.desc&limit=1`
  )
  return rows?.[0] || null
}

/** Republie un reporting déjà enregistré (après édition manuelle en Étape 3
 * de la refonte : modifier/supprimer/réordonner un point avant publication). */
export async function updateReportingStructure(reportingId, contenuStructure) {
  return sbUpdate('reportings_hebdo', { contenu_structure: contenuStructure }, `id=eq.${reportingId}`)
}

// ── Commentaires confidentiels (manager uniquement) ──────────────────────────
// Passent par Groq comme le public (même structuration pole/rubrique, même
// garantie d'orthographe, items "à faire" cochables), mais via un appel API
// séparé qui ne reçoit QUE les notes confidentielles (cf.
// reporting-generate/index.ts) — le modèle ne voit jamais confidentiel et
// public ensemble. Stockées dans une table séparée de reportings_hebdo (pas
// un champ dans contenu_structure) — c'est cette séparation de table, et le
// fait qu'AUCUNE route collaborateur n'importe jamais
// getReportingConfidentiel/hasReportingConfidentiel, qui garantit que ce
// contenu ne transite jamais vers une session collaborateur. À n'appeler que
// depuis du code manager.

/** Enregistre (ou met à jour) le contenu confidentiel d'un reporting publié. */
export async function saveReportingConfidentiel({ reportingId, contenuStructure }) {
  const existing = await sbSelect('reportings_hebdo_confidentiel', `reporting_id=eq.${reportingId}&select=id`)
  if (existing?.length) {
    return sbUpdate('reportings_hebdo_confidentiel', { contenu_structure: contenuStructure }, `id=eq.${existing[0].id}`)
  }
  return sbInsert('reportings_hebdo_confidentiel', { reporting_id: reportingId, contenu_structure: contenuStructure })
}

/** Republie le contenu confidentiel après édition (cochage d'un "à faire"
 * par le manager) — même principe que updateReportingStructure côté public. */
export async function updateReportingConfidentielStructure(reportingId, contenuStructure) {
  const existing = await sbSelect('reportings_hebdo_confidentiel', `reporting_id=eq.${reportingId}&select=id`)
  if (!existing?.length) return saveReportingConfidentiel({ reportingId, contenuStructure })
  return sbUpdate('reportings_hebdo_confidentiel', { contenu_structure: contenuStructure }, `id=eq.${existing[0].id}`)
}

/** Existence seule (pas le contenu) — utilisée pour décider d'afficher le
 * bouton "Voir les infos confidentielles", sans charger le texte sensible
 * tant que le manager n'a pas ressaisi son code. */
export async function hasReportingConfidentiel(reportingId) {
  const rows = await sbSelect('reportings_hebdo_confidentiel', `reporting_id=eq.${reportingId}&select=id`)
  return !!rows?.length
}

/** Contenu confidentiel — à n'appeler qu'après ressaisie du code manager. */
export async function getReportingConfidentiel(reportingId) {
  const rows = await sbSelect('reportings_hebdo_confidentiel', `reporting_id=eq.${reportingId}`)
  return rows?.[0]?.contenu_structure || null
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Appelle l'edge function reporting-generate (clé Groq gardée côté serveur,
 * jamais exposée au client). Retourne { ok:true, contenuStructure,
 * confidentielStructure } ou { ok:false, error }. `confidentielStructure`
 * est `null` si aucune note confidentielle cette semaine — même format que
 * contenuStructure (sections/rubriques/items), généré par un appel Groq
 * séparé qui ne voit jamais les notes publiques (cf. edge function).
 * N'écrit rien en base elle-même — c'est à l'appelant de saveReportingHebdo
 * / saveReportingConfidentiel ensuite. En cas d'échec, les notes sources ne
 * sont jamais touchées (la fonction ne fait que lire).
 */
export async function genererReportingStructure({ magasinId, formateurId, semaineDebut, semaineFin }) {
  try {
    const res = await fetch(`${SB_URL}/functions/v1/reporting-generate`, {
      method: 'POST',
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ magasinId, formateurId, semaineDebut, semaineFin }),
    })
    const data = await res.json().catch(() => null)
    if (!res.ok || !data || data.error) {
      return { ok: false, error: data?.error || `Génération indisponible (${res.status}).` }
    }
    if (!data.contenuStructure) return { ok: false, error: 'Aucune note cette semaine — rien à générer.' }
    return { ok: true, contenuStructure: data.contenuStructure, confidentielStructure: data.confidentielStructure || null }
  } catch {
    return { ok: false, error: 'Génération impossible — vérifiez la connexion. Les notes sont intactes.' }
  }
}

export async function markReportingEnvoye(reportingId) {
  return sbUpdate('reportings_hebdo', { envoye_at: new Date().toISOString() }, `id=eq.${reportingId}`)
}

/** Suppression réservée à l'auteur — filtre sur formateur_id en plus de
 * l'id, même politique que les notes de terrain. */
export async function deleteReportingHebdo({ id, formateurId }) {
  return sbDelete('reportings_hebdo', `id=eq.${id}&formateur_id=eq.${formateurId}`)
}
