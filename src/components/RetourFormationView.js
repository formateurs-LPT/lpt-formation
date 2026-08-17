'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { sbSelect, sbUpsert, getSharedState } from '@/lib/supabase'
import { getLevelInfo } from '@/lib/scoring'
import { classifyMagasin } from '@/lib/formationCategories'
import { MODULE_DATA } from '@/lib/modulesData'
import CompteRenduManager from './CompteRenduManager'
import { BilanFormationContent } from '@/app/bilan-formation/page'
import { getManagers, canonicalMagasinLabel } from '@/lib/managersData'
import { DIRECTEURS } from '@/lib/directeursData'
import { PUBLIC_ORIGIN } from '@/lib/sessionCode'
import { themeForAnswer, DIRECT_THEME_MODULES, TRANSVERSAL_MODULE_IDS } from '@/lib/quizThemeMap'
import { extractPrenom } from '@/lib/participantNames'

// ── Constantes ────────────────────────────────────────────────────

const THEMES_FRANCE = [
  'entreprise', 'types-verres', 'pdm', 'optique', 'offres',
  'verre-progressif', 'trame-accueil', 'montures',
  'remboursement-france', 'parcours-rembourses', 'lpt-sante',
]
const THEMES_BELGIQUE = [
  'entreprise', 'types-verres', 'pdm', 'optique', 'offres',
  'verre-progressif', 'trame-accueil', 'montures', 'mutuelles-inami',
]

export const CATEGORY_META = {
  paris:    { label: 'Île de France', sub: 'Présentiel Paris',     icon: '🏢', color: '#0089ba', rgb: '0,137,186',   themes: THEMES_FRANCE   },
  province: { label: 'Visio Province', sub: 'Formation à distance', icon: '💻', color: '#7c3aed', rgb: '124,58,237',  themes: THEMES_FRANCE   },
  belgique: { label: 'Belgique',       sub: 'Présentiel Belgique',  icon: '🇧🇪', color: '#db2777', rgb: '219,39,119',  themes: THEMES_BELGIQUE },
}

export const STATUS_OPTIONS = [
  { key: 'maitrise',    label: 'Maîtrisé',        color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0', icon: '✓' },
  { key: 'en-cours',    label: 'En cours',         color: '#d97706', bg: '#fef3c7', border: '#fde68a', icon: '◑' },
  { key: 'notions',     label: 'Quelques notions', color: '#f97316', bg: '#fff7ed', border: '#fed7aa', icon: '◔' },
  { key: 'non-compris', label: 'Pas compris',      color: '#dc2626', bg: '#fee2e2', border: '#fecaca', icon: '✗' },
]

function toStars(v) {
  if (typeof v === 'number') return v
  if (v === 'maitrise')    return 5
  if (v === 'en-cours')    return 3
  if (v === 'notions')     return 2
  if (v === 'non-compris') return 1
  return 0
}

function starsDisplay(v) {
  const n = toStars(v)
  if (!n) return null
  return [1,2,3,4,5].map(s => s <= n ? '⭐' : '☆').join('')
}

/** Extrait le prénom depuis "Prénom NOM" (les mots tout-caps = nom de famille) */
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m}min`
}

/** Adresse mail LPT : 1ère lettre du prénom + nom de famille, sans accents/espaces */
function buildLptEmail(prenom, nom) {
  const clean = s => (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // retire les accents
    .replace(/[^a-zA-Z-]/g, '').toLowerCase()
  const p = clean(prenom)
  const n = clean(nom)
  if (!p || !n) return ''
  return `${p[0]}${n}@lunettespourtous.com`
}

function effectiveCat(e) {
  return e._forceCat || classifyMagasin(e.magasin) || 'province'
}

function getWeekDate() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().slice(0, 10)
}

/**
 * Index des salles déjà terminées, tous formateurs confondus. Quand une salle
 * est clôturée (endActiveRoom → archiveAndPurgeRoom), ses données sont copiées
 * dans session_history.quiz_results (JSONB) PUIS supprimées des tables live
 * (participants, quiz_answers, module_results…). Sans cet index, un formé dont
 * la salle a été terminée retombe à 0 point alors que ses résultats existent
 * bel et bien — juste déplacés dans l'archive.
 * On ne filtre volontairement PAS par trainer_name : ce champ est une
 * correspondance exacte et sensible à la casse, et ne reflète pas forcément
 * qui consulte le retour de formation (passage de main Kevin/Quentin en
 * cours de semaine, variante de casse du nom…) — un mauvais match rendait
 * une salle entière invisible. Chaque formé n'y retrouve de toute façon que
 * SES points, filtrés par collaborateur juste en dessous.
 * Par formé, on regroupe les salles archivées à moins de 6 jours de sa salle
 * la plus récente (au lieu de ne garder QUE la plus récente) : le présentiel
 * se joue souvent sur plusieurs jours avec parfois un passage de main
 * formateur en cours de semaine (nouvelle salle recréée) — ne garder que la
 * toute dernière salle perdait les points des jours précédents. Au-delà de
 * cette fenêtre, on ignore : sinon quelqu'un passé par plusieurs salles à
 * plusieurs SEMAINES d'écart verrait ses points s'additionner à tort et
 * grimper artificiellement devant les autres (incident Nadège).
 * Un seul fetch, partagé entre tous les formés (voir appelants).
 */
export async function fetchArchiveIndex() {
  const rows = await sbSelect(
    'session_history',
    'order=session_date.desc'
  ).catch(() => [])
  const roomsByName = {}
  for (const row of rows || []) {
    const qr = row.quiz_results
    if (!qr || typeof qr !== 'object') continue
    const modRows = qr.module_results || []
    const ansRows = qr.answers || []
    const activeTime = qr.room_state?.active_time || {}
    const date = row.session_date ? new Date(row.session_date).getTime() : 0
    const namesInRoom = new Set([
      ...modRows.map(m => m.collaborateur).filter(Boolean),
      ...ansRows.map(a => a.collaborateur).filter(Boolean),
      ...Object.keys(activeTime),
    ])
    for (const n of namesInRoom) {
      ;(roomsByName[n] ||= []).push({
        date,
        moduleRows: modRows.filter(m => m.collaborateur === n),
        answerRows: ansRows.filter(a => a.collaborateur === n),
        activeSeconds: activeTime[n] || 0,
      })
    }
  }

  const WINDOW_MS = 6 * 24 * 60 * 60 * 1000
  const moduleByName = {}
  const answerByName = {}
  const activeSecondsByName = {}
  for (const [name, entries] of Object.entries(roomsByName)) {
    entries.sort((a, b) => b.date - a.date)
    const mostRecent = entries[0].date
    const kept = entries.filter(e => mostRecent - e.date <= WINDOW_MS)
    moduleByName[name] = kept.flatMap(e => e.moduleRows)
    answerByName[name] = kept.flatMap(e => e.answerRows)
    activeSecondsByName[name] = kept.reduce((s, e) => s + (e.activeSeconds || 0), 0)
  }
  return { moduleByName, answerByName, activeSecondsByName }
}

/**
 * Temps d'activité écran (onglet au premier plan) d'un formé, cette semaine —
 * signal RELATIF à comparer à la moyenne du groupe (voir addActiveSeconds).
 * Plus aucun filtre par salle : somme le temps de TOUTES ses salles (live +
 * archive, toujours fusionnées) — même principe que fetchModuleAndQuizRows.
 */
export async function fetchActiveSeconds(name, archiveIndexPromise) {
  const participantRows = await sbSelect(
    'participants',
    `name=eq.${encodeURIComponent(name)}`
  ).catch(() => [])
  const codes = [...new Set((participantRows || []).map(p => p.session_code).filter(Boolean))]

  const [stateRows, archiveIndex] = await Promise.all([
    codes.length
      ? sbSelect('trainer_state', `trainer=in.(${codes.map(c => encodeURIComponent(c)).join(',')})`).catch(() => [])
      : Promise.resolve([]),
    archiveIndexPromise,
  ])
  const liveSeconds = (stateRows || []).reduce((sum, row) => {
    let state = row.state
    if (typeof state === 'string') { try { state = JSON.parse(state) } catch { state = {} } }
    return sum + (state?.active_time?.[name] || 0)
  }, 0)

  return liveSeconds + (archiveIndex?.activeSecondsByName?.[name] || 0)
}

/**
 * Résultats quiz d'un formé — plus aucun filtre par salle : on prend TOUTES
 * ses réponses (live + archive fusionnées), peu importe dans quelle salle
 * elles ont été données. Avant, un scope par session_code (via la table
 * participants) faisait disparaître à tort les réponses données dans une
 * salle recréée après une clôture manuelle (incident IDF du 13/08) — un
 * formé a un compte de points individuel, pas un compte par salle.
 * L'archive (salles déjà closes, cf. fetchArchiveIndex) reste limitée à
 * une fenêtre de 6 jours autour de l'activité la plus récente pour éviter
 * qu'un passage plusieurs SEMAINES plus tôt ne gonfle artificiellement le
 * score (incident Nadège) — mais n'est plus ignorée dès qu'une donnée live
 * existe : les deux sont toujours fusionnées.
 */
export async function fetchModuleAndQuizRows(name, archiveIndexPromise) {
  const [moduleRows, answerRows, archiveIndex] = await Promise.all([
    sbSelect('module_results', `collaborateur=eq.${encodeURIComponent(name)}`),
    sbSelect('quiz_answers',   `collaborateur=eq.${encodeURIComponent(name)}`),
    archiveIndexPromise,
  ])

  return {
    moduleRows: [...(moduleRows || []), ...(archiveIndex?.moduleByName?.[name] || [])],
    answerRows: [...(answerRows || []), ...(archiveIndex?.answerByName?.[name] || [])],
  }
}

// Même formule que CompteRenduManager.js (le compte rendu réellement envoyé au
// manager) — la barre affichée pendant la saisie doit annoncer le même taux.
// Petite tendance jour par jour du taux de bonnes réponses sur un thème —
// un jour = une barre, plus foncé/vert = meilleur taux ce jour-là. N'est
// affiché que s'il y a au moins 2 jours de données (sinon rien à comparer).
function ThemeTrendSparkline({ byDay }) {
  const days = Object.keys(byDay || {}).sort()
  if (days.length < 2) return null
  const BAR_W = 7
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 20 }} title="Tendance jour par jour">
      {days.map(day => {
        const { correct, total } = byDay[day]
        const rate = total ? correct / total : 0
        const color = rate >= 0.7 ? '#16a34a' : rate >= 0.4 ? '#d97706' : '#dc2626'
        const h = Math.max(3, Math.round(rate * 20))
        const label = new Date(day).toLocaleDateString('fr-FR', { weekday: 'short' })
        return (
          <div
            key={day}
            title={`${label} — ${correct}/${total} (${Math.round(rate * 100)}%)`}
            style={{ width: BAR_W, height: h, borderRadius: 2, background: color }}
          />
        )
      })}
    </div>
  )
}

function computeRate(assessments) {
  const vals = Object.values(assessments || {}).filter(Boolean)
  if (!vals.length) return null
  const score = vals.reduce((s, v) => s + (v === 'maitrise' ? 1 : v === 'en-cours' ? 0.667 : v === 'notions' ? 0.333 : 0), 0)
  return Math.round((score / vals.length) * 100)
}

/** Statut acquis/non-acquis suggéré à partir du taux de bonnes réponses aux quiz du thème */
function suggestStatusFromRate(rate) {
  if (rate >= 85) return 'maitrise'
  if (rate >= 60) return 'en-cours'
  if (rate >= 35) return 'notions'
  return 'non-compris'
}

function joinFr(list) {
  if (list.length === 0) return ''
  if (list.length === 1) return list[0]
  return `${list.slice(0, -1).join(', ')} et ${list[list.length - 1]}`
}

/**
 * Génère un brouillon de "mot du formateur" à partir de ce qui est déjà
 * renseigné dans la fiche (thèmes, attitude/participation/compréhension,
 * appréciation) — aucune IA, juste un assemblage déterministe et gratuit,
 * toujours modifiable ensuite par le formateur.
 */
function buildDraftComment({ prenom, themes, assessments, attitudeStatus, attitudeNote, participationStatus, participationNote, comprehensionStatus, comprehensionNote, appreciation, globalRate, notesSemaine }) {
  const p = prenom || 'Le/La formé(e)'
  const labelsFor = status => themes.filter(t => assessments[t] === status).map(t => MODULE_DATA[t]?.label || t)
  const sentences = []

  const maitrise   = labelsFor('maitrise')
  const enCours    = labelsFor('en-cours')
  const notions    = labelsFor('notions')
  const nonCompris = labelsFor('non-compris')

  if (maitrise.length)   sentences.push(`${p} maîtrise ${joinFr(maitrise)}.`)
  if (enCours.length)    sentences.push(`${p} est encore en cours d'acquisition sur ${joinFr(enCours)}.`)
  if (notions.length)    sentences.push(`${p} a quelques notions sur ${joinFr(notions)}, à consolider.`)
  if (nonCompris.length) sentences.push(`${p} n'a pas encore acquis ${joinFr(nonCompris)}, à retravailler en priorité.`)

  if (globalRate !== null && globalRate !== undefined) {
    sentences.push(`Taux global de bonnes réponses aux quiz : ${globalRate}%.`)
  }

  if (attitudeStatus && attitudeStatus !== 'ras') {
    const label = COMMENTAIRE_OPTS.find(o => o.key === attitudeStatus)?.label?.toLowerCase()
    sentences.push(`Attitude générale jugée « ${label} »${attitudeNote ? ` : ${attitudeNote}` : '.'}`)
  }
  if (participationStatus && participationStatus !== 'ras') {
    const label = COMMENTAIRE_OPTS.find(o => o.key === participationStatus)?.label?.toLowerCase()
    sentences.push(`Participation jugée « ${label} »${participationNote ? ` : ${participationNote}` : '.'}`)
  }
  if (comprehensionStatus && comprehensionStatus !== 'ras') {
    const label = COMMENTAIRE_OPTS.find(o => o.key === comprehensionStatus)?.label?.toLowerCase()
    sentences.push(`Compréhension des contenus jugée « ${label} »${comprehensionNote ? ` : ${comprehensionNote}` : '.'}`)
  }

  const appMeta = APPRECIATIONS.find(o => o.key === appreciation)
  if (appMeta) sentences.push(appMeta.label + '.')

  const draft = sentences.join(' ')
  // Notes prises au fil de la semaine par le formateur : reprises telles
  // quelles (aucune IA), en paragraphe séparé pour rester lisibles même si
  // ce sont des remarques en vrac jour par jour.
  if (notesSemaine && notesSemaine.trim()) {
    return [draft, notesSemaine.trim()].filter(Boolean).join('\n\n')
  }
  return draft
}

function CorrectButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        padding: '5px 12px', borderRadius: 8, border: '1px solid #334155',
        background: loading ? '#1e293b' : '#0f172a',
        color: loading ? '#475569' : '#818cf8',
        fontSize: 11, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
        transition: 'all .15s',
      }}
    >
      {loading ? '⏳ Correction…' : '✦ Corriger'}
    </button>
  )
}

function RateBar({ rate }) {
  if (rate === null) return (
    <div style={{ fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
      Remplissez les thèmes ci-dessus pour calculer le taux d'acquisition
    </div>
  )
  const color = rate >= 75 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626'
  const label = rate >= 75 ? 'Bonne acquisition' : rate >= 50 ? 'Acquisition partielle' : 'À renforcer'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>Taux d'acquisition global</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontSize: 28, fontWeight: 800, color }}>{rate}%</span>
          <span style={{ fontSize: 12, fontWeight: 600, color }}>{label}</span>
        </div>
      </div>
      <div style={{ height: 10, background: '#334155', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 99, transition: 'width .5s' }} />
      </div>
    </div>
  )
}

// ── Fiche formé ───────────────────────────────────────────────────

const APPRECIATIONS = [
  { key: 'tres-bon',        label: 'Je pense que ça peut être un très bon élément',          solidBg: '#16a34a' },
  { key: 'ca-va-le-faire',  label: 'Je pense que ça va le faire',                            solidBg: '#84cc16' },
  { key: 'accompagnement',  label: "Aura vraiment besoin d'accompagnement mais ça ira !",    solidBg: '#d97706' },
  { key: 'complique',       label: 'Je pense que ça va être très compliqué',                 solidBg: '#dc2626' },
]

const COMMENTAIRE_OPTS = [
  { key: 'ras',            label: 'Rien à signaler', color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' },
  { key: 'peut-mieux',    label: 'Peut mieux faire', color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { key: 'attention',     label: 'Attention',         color: '#dc2626', bg: '#fee2e2', border: '#fecaca' },
]

/**
 * Fusionne plusieurs lignes `formation_reports` d'un même formé (fiche partagée
 * entre formateurs, plusieurs lignes possibles si chaque formateur a sauvegardé
 * sous son propre trainer_name avant/pendant la bascule vers la fiche partagée).
 * Les champs simples viennent de la ligne la plus récente, MAIS les acquis/non
 * acquis par thème sont fusionnés thème par thème (le dernier à avoir noté CE
 * thème gagne) plutôt que remplacés en bloc — sinon un formateur qui sauvegarde
 * ne serait-ce qu'une seule case efface silencieusement tous les acquis déjà
 * notés par un collègue sur les autres thèmes (incident du 12/08 : fiches
 * remplies par Quentin vidées par une sauvegarde plus récente mais partielle).
 */
export function mergeFormationReports(rows) {
  if (!rows?.length) return null
  const chronological = [...rows].sort((a, b) => new Date(a.updated_at || 0) - new Date(b.updated_at || 0))
  const latest = rows.reduce((a, b) => new Date(a.updated_at || 0) > new Date(b.updated_at || 0) ? a : b)
  const snapshot = {}
  const themeAssessments = {}
  for (const row of chronological) {
    const snap = row.stats_snapshot || {}
    const { theme_assessments, ...rest } = snap
    Object.assign(snapshot, rest)
    for (const [theme, val] of Object.entries(theme_assessments || {})) {
      if (val != null) themeAssessments[theme] = val
    }
  }
  snapshot.theme_assessments = themeAssessments
  return { snapshot, trainerName: latest.trainer_name, weekDate: latest.week_date, latestRow: latest }
}

function FicheCollab({ entree, categoryKey, trainerName, weekDate, rank, rankOf, pointsRank, totalPoints = 0, pointsRankOf, myActiveSeconds = 0, groupAvgActiveSeconds = 0 }) {
  const [quizData, setQuizData]                 = useState([])
  // Taux de compréhension par thème calculé depuis les vraies réponses aux quiz
  // — { theme: { correct, total } } — affiché à côté de l'évaluation manuelle
  // du formateur, jamais à sa place (le formateur reste seul décisionnaire).
  const [themeQuizStats, setThemeQuizStats]     = useState({})
  const [themeQuizByDay, setThemeQuizByDay]     = useState({}) // { theme: { 'YYYY-MM-DD': {correct, total} } } — tendance
  const [assessments, setAssessments]           = useState({})
  // Thèmes dont le statut vient d'être suggéré automatiquement (taux de quiz)
  // et pas encore confirmé/modifié par le formateur — juste pour l'affichage.
  const [autoSuggestedThemes, setAutoSuggestedThemes] = useState(() => new Set())
  const [attitudeStatus, setAttitudeStatus]     = useState(null)
  const [attitudeNote, setAttitudeNote]         = useState('')
  const [participationStatus, setParticipationStatus] = useState(null)
  const [participationNote, setParticipationNote]     = useState('')
  const [comprehensionStatus, setComprehensionStatus] = useState(null)
  const [comprehensionNote, setComprehensionNote]     = useState('')
  const [appreciation, setAppreciation]         = useState(null)
  const [commentaireLibre, setCommentaireLibre] = useState('')
  const [autoEval, setAutoEval]                 = useState(null)
  const [saving, setSaving]                     = useState(false)
  const [loading, setLoading]                   = useState(true)
  const [correcting, setCorrecting]             = useState(null) // 'attitude' | 'participation' | 'comprehension' | 'commentaire'
  const [mailSentAt, setMailSentAt]             = useState(null)
  const [messageFormé, setMessageFormé]         = useState('')
  const [mailFormeSentAt, setMailFormeSentAt]   = useState(null)
  const [showFormePreview, setShowFormePreview] = useState(false)
  const [activeTab, setActiveTab]               = useState('retour') // 'retour' | 'notes'
  const [notesSemaine, setNotesSemaine]         = useState('')
  const [globalRate, setGlobalRate]             = useState(null)
  const [globalCounts, setGlobalCounts]         = useState({ correct: 0, total: 0 })
  // week_date du dernier enregistrement trouvé — peut différer de weekDate si la session a eu lieu une semaine précédente
  const [saveWeekDate, setSaveWeekDate]         = useState(weekDate)
  // Fiche partagée entre formateurs : trainer_name de la ligne existante (celui qui
  // l'a créée ou modifiée en dernier). On continue d'écrire dessus quel que soit le
  // formateur connecté, plutôt que de forker une ligne par formateur — sinon Kevin
  // et Quentin auraient chacun leur propre fiche invisible l'un de l'autre.
  const [ownerName, setOwnerName]               = useState(trainerName)
  const [lastEditor, setLastEditor]             = useState(null)
  const themes = CATEGORY_META[categoryKey]?.themes || THEMES_FRANCE
  const name = entree.fullName || `${entree.nom} ${entree.prenom}`.trim()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const archiveIndexPromise = fetchArchiveIndex()
      const [{ moduleRows, answerRows }, reportRow, autoEvalRow] = await Promise.all([
        fetchModuleAndQuizRows(name, archiveIndexPromise),
        // Charge les rapports récents de ce formé, tous formateurs confondus
        // (fiche partagée), quelle que soit la semaine — fusionnés ensuite par
        // mergeFormationReports pour ne jamais perdre un thème déjà noté
        sbSelect('formation_reports', `collaborateur=eq.${encodeURIComponent(name)}&trainer_name=neq.__auto_eval__&order=updated_at.desc&limit=30`),
        // Auto-évaluation la plus récente de ce formé (indépendante du formateur)
        sbSelect('formation_reports', `collaborateur=eq.${encodeURIComponent(name)}&trainer_name=eq.__auto_eval__&order=updated_at.desc&limit=1`),
      ])
      const byModule = {}
      for (const r of moduleRows || []) {
        const mid = r.module_id || r.module
        if (!mid) continue
        const sc = r.score ?? 0
        const tot = r.score_total ?? r.total ?? 0
        if (!byModule[mid] || sc > byModule[mid].score) byModule[mid] = { moduleId: mid, label: MODULE_DATA[mid]?.label || mid, score: sc, total: tot }
      }
      // Vrai quiz (question_idx < 100 — le "jeu des questions"/entraînement oral
      // réutilise le même module_id mais avec question_idx >= 100, traité séparément
      // juste après) : toujours calculé depuis quiz_answers, jamais ignoré au
      // prétexte qu'un module_results existe déjà — une ancienne ligne (module déjà
      // fait un jour précédent) bloquait sinon les réponses du jour (incident IDF
      // du 13/08). On garde la source la plus complète des deux.
      const qaByModule = {}
      for (const r of answerRows || []) {
        const mid = r.module_id
        if (!mid || (r.question_idx ?? 0) >= 100) continue
        if (!qaByModule[mid]) qaByModule[mid] = {}
        qaByModule[mid][r.question_idx] = r.is_correct // dernière réponse par question gagne
      }
      for (const [mid, qMap] of Object.entries(qaByModule)) {
        const correct = Object.values(qMap).filter(Boolean).length
        const total = MODULE_DATA[mid]?.quiz?.length || Object.keys(qMap).length
        if (total > 0 && (!byModule[mid] || total >= byModule[mid].total)) {
          byModule[mid] = { moduleId: mid, label: MODULE_DATA[mid]?.label || mid, score: correct, total }
        }
      }
      // Jeu des questions / entraînement oral (question_idx >= 100) : toujours
      // compté EN PLUS, même quand le vrai quiz du module a déjà un score —
      // sinon ces bonnes réponses, bien réelles, disparaissaient en silence.
      const gameByModule = {}
      for (const r of answerRows || []) {
        const mid = r.module_id
        if (!mid || (r.question_idx ?? 0) < 100) continue
        if (!gameByModule[mid]) gameByModule[mid] = {}
        gameByModule[mid][r.question_idx] = r.is_correct
      }
      for (const [mid, qMap] of Object.entries(gameByModule)) {
        const correct = Object.values(qMap).filter(Boolean).length
        if (correct === 0) continue
        byModule[`${mid}__jeu`] = {
          moduleId: `${mid}__jeu`,
          label: `${MODULE_DATA[mid]?.label || mid} — Jeu des questions`,
          score: correct,
          total: Object.keys(qMap).length,
        }
      }
      setQuizData(Object.values(byModule))

      // Taux global (quiz + jeu des questions confondus) — même calcul que la
      // page /bilan-formation, pour que l'aperçu formateur soit fidèle
      const totalAns = (answerRows || []).length
      const correctAns = (answerRows || []).filter(r => r.is_correct).length
      setGlobalCounts({ correct: correctAns, total: totalAns })
      setGlobalRate(totalAns ? Math.round((correctAns / totalAns) * 100) : null)

      // Taux de compréhension par thème (basé sur les vraies réponses aux quiz)
      const themeStats = {}
      const addToTheme = (theme, correct, total) => {
        if (!theme || !total) return
        if (!themeStats[theme]) themeStats[theme] = { correct: 0, total: 0 }
        themeStats[theme].correct += correct
        themeStats[theme].total += total
      }
      // Modules mono-thème : leur score déjà calculé (byModule) EST le score du thème
      for (const [mid, m] of Object.entries(byModule)) {
        if (DIRECT_THEME_MODULES.has(mid)) addToTheme(mid, m.score, m.total)
      }
      // Quiz transversaux (quiz-j1, quiz-final) : question par question, chacune
      // vers son propre thème — une seule réponse par question (upsert en base)
      const transversalByQuestion = {}
      for (const r of answerRows || []) {
        if (!TRANSVERSAL_MODULE_IDS.has(r.module_id) || (r.question_idx ?? 0) >= 100) continue
        transversalByQuestion[`${r.module_id}:${r.question_idx}`] = r
      }
      for (const r of Object.values(transversalByQuestion)) {
        addToTheme(themeForAnswer(r.module_id, r.question_idx), r.is_correct ? 1 : 0, 1)
      }
      setThemeQuizStats(themeStats)

      // Tendance jour par jour : une seule réponse par question (created_at posé
      // à la 1ère soumission, cf. commentaire schema), donc chaque ligne de
      // quiz_answers date bien le jour où CETTE question a été traitée.
      const themeOf = (mid, qi) => DIRECT_THEME_MODULES.has(mid) ? mid : themeForAnswer(mid, qi)
      const byDay = {}
      for (const r of answerRows || []) {
        const qi = r.question_idx ?? 0
        if (qi >= 100 || !r.created_at) continue
        const theme = themeOf(r.module_id, qi)
        if (!theme) continue
        const day = r.created_at.slice(0, 10)
        if (!byDay[theme]) byDay[theme] = {}
        if (!byDay[theme][day]) byDay[theme][day] = { correct: 0, total: 0 }
        byDay[theme][day].total += 1
        if (r.is_correct) byDay[theme][day].correct += 1
      }
      setThemeQuizByDay(byDay)

      const found = mergeFormationReports(reportRow)
      if (found) {
        // Conserve la week_date d'origine pour sauvegarder sur le bon enregistrement
        setSaveWeekDate(found.weekDate || weekDate)
      }
      setOwnerName(found?.trainerName || trainerName)
      const snap = found?.snapshot || {}
      setLastEditor(snap.last_editor || found?.trainerName || null)
      const ownerForSave = found?.trainerName || trainerName
      const weekDateForSave = found?.weekDate || weekDate

      // Suggestion automatique et gratuite des acquis/non-acquis à partir du
      // taux de quiz par thème, uniquement pour les thèmes jamais évalués par
      // un formateur (on ne touche jamais à une évaluation déjà posée) et avec
      // au moins 2 réponses (pas de suggestion sur un coup de chance/malchance
      // isolé). Le formateur corrige ensuite d'un clic si besoin.
      const existingAssessments = snap.theme_assessments || {}
      const suggested = {}
      for (const theme of themes) {
        if (existingAssessments[theme]) continue
        const qs = themeStats[theme]
        if (!qs || qs.total < 2) continue
        suggested[theme] = suggestStatusFromRate(Math.round((qs.correct / qs.total) * 100))
      }
      setAssessments({ ...suggested, ...existingAssessments })
      setAutoSuggestedThemes(new Set(Object.keys(suggested)))
      if (Object.keys(suggested).length > 0) {
        // Écrit directement à partir de `snap` (valeurs fraîchement chargées),
        // jamais via buildSnap()/l'état React ici : au tout premier passage de
        // loadData pour ce formé, attitudeStatus/commentaireLibre/etc. dans le
        // state n'ont pas encore été mis à jour (setState est asynchrone) —
        // passer par buildSnap() aurait écrasé les vraies données déjà en base
        // avec ces valeurs par défaut vides (même classe de bug que l'incident
        // « fiche partagée » du 13/08).
        sbUpsert(
          'formation_reports',
          {
            collaborateur: name,
            trainer_name: ownerForSave,
            week_date: weekDateForSave,
            status: 'draft',
            stats_snapshot: {
              theme_assessments: { ...suggested, ...existingAssessments },
              attitude_status: snap.attitude_status || null,
              attitude_note: snap.attitude_note || '',
              participation_status: snap.participation_status || null,
              participation_note: snap.participation_note || '',
              comprehension_status: snap.comprehension_status || null,
              comprehension_note: snap.comprehension_note || '',
              appreciation: snap.appreciation || null,
              commentaire_libre: snap.commentaire_libre || '',
              magasin: entree.magasin || '',
              mail_sent_at: snap.mail_sent_at || null,
              message_formateur_forme: snap.message_formateur_forme || '',
              mail_forme_sent_at: snap.mail_forme_sent_at || null,
              notes_semaine: snap.notes_semaine || '',
              points_rank: pointsRank ?? null,
              points_rank_of: pointsRankOf ?? null,
              total_points: totalPoints ?? 0,
              last_editor: trainerName,
            },
            updated_at: new Date().toISOString(),
          },
          'collaborateur,week_date,trainer_name'
        ).catch(() => {})
      }
      setAttitudeStatus(snap.attitude_status || null)
      setAttitudeNote(snap.attitude_note || '')
      setParticipationStatus(snap.participation_status || null)
      setParticipationNote(snap.participation_note || '')
      setComprehensionStatus(snap.comprehension_status || null)
      setComprehensionNote(snap.comprehension_note || '')
      setAppreciation(snap.appreciation || null)
      setCommentaireLibre(snap.commentaire_libre || '')
      setMailSentAt(snap.mail_sent_at || null)
      setMessageFormé(snap.message_formateur_forme || '')
      setMailFormeSentAt(snap.mail_forme_sent_at || null)
      setNotesSemaine(snap.notes_semaine || '')
      setAutoEval(autoEvalRow?.[0]?.stats_snapshot?.auto_eval || null)
    } catch (e) {
      console.error('[RetourFormation] loadData', e)
    } finally {
      setLoading(false)
    }
  }, [name, trainerName, weekDate])

  useEffect(() => { loadData() }, [loadData])

  const buildSnap = (overrides = {}) => ({
    theme_assessments: assessments,
    attitude_status: attitudeStatus,
    attitude_note: attitudeNote,
    participation_status: participationStatus,
    participation_note: participationNote,
    comprehension_status: comprehensionStatus,
    comprehension_note: comprehensionNote,
    appreciation,
    commentaire_libre: commentaireLibre,
    magasin: entree.magasin || '',
    mail_sent_at: mailSentAt,
    message_formateur_forme: messageFormé,
    mail_forme_sent_at: mailFormeSentAt,
    notes_semaine: notesSemaine,
    // Classement figé au moment de l'envoi (le stats_snapshot remplace tout à
    // chaque sauvegarde, donc on le reporte par défaut pour ne pas l'écraser
    // après un envoi si le formateur retouche la fiche ensuite)
    points_rank: pointsRank ?? null,
    points_rank_of: pointsRankOf ?? null,
    total_points: totalPoints ?? 0,
    ...overrides,
  })

  const saveSnapshot = async (patch) => {
    setSaving(true)
    try {
      setLastEditor(trainerName)
      await sbUpsert(
        'formation_reports',
        {
          collaborateur: name,
          week_date: saveWeekDate,
          trainer_name: ownerName,
          status: 'draft',
          stats_snapshot: { ...patch, last_editor: trainerName },
          updated_at: new Date().toISOString(),
        },
        'collaborateur,week_date,trainer_name'
      )
    } catch (e) {
      console.error('[RetourFormation] save', e)
    } finally {
      setSaving(false)
    }
  }

  const setThemeStatus = async (moduleId, status) => {
    const next = { ...assessments, [moduleId]: status === assessments[moduleId] ? null : status }
    setAssessments(next)
    if (autoSuggestedThemes.has(moduleId)) {
      const nextSuggested = new Set(autoSuggestedThemes)
      nextSuggested.delete(moduleId)
      setAutoSuggestedThemes(nextSuggested)
    }
    await saveSnapshot(buildSnap({ theme_assessments: next }))
  }

  const handleAttitudeStatus = async (key) => {
    const next = attitudeStatus === key ? null : key
    const note = next === 'ras' ? '' : attitudeNote
    setAttitudeStatus(next)
    if (next === 'ras') setAttitudeNote('')
    await saveSnapshot(buildSnap({ attitude_status: next, attitude_note: note }))
  }

  const handleAttitudeNote = async (val) => {
    setAttitudeNote(val)
    await saveSnapshot(buildSnap({ attitude_note: val }))
  }

  const handleParticipationStatus = async (key) => {
    const next = participationStatus === key ? null : key
    const note = next === 'ras' ? '' : participationNote
    setParticipationStatus(next)
    if (next === 'ras') setParticipationNote('')
    await saveSnapshot(buildSnap({ participation_status: next, participation_note: note }))
  }

  const handleParticipationNote = async (val) => {
    setParticipationNote(val)
    await saveSnapshot(buildSnap({ participation_note: val }))
  }

  const handleComprehensionStatus = async (key) => {
    const next = comprehensionStatus === key ? null : key
    const note = next === 'ras' ? '' : comprehensionNote
    setComprehensionStatus(next)
    if (next === 'ras') setComprehensionNote('')
    await saveSnapshot(buildSnap({ comprehension_status: next, comprehension_note: note }))
  }

  const handleComprehensionNote = async (val) => {
    setComprehensionNote(val)
    await saveSnapshot(buildSnap({ comprehension_note: val }))
  }

  const toggleAppreciation = async (key) => {
    const next = appreciation === key ? null : key
    setAppreciation(next)
    await saveSnapshot(buildSnap({ appreciation: next }))
  }

  const rate = computeRate(assessments)
  const [showReport, setShowReport] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const reportRef = useRef(null)
  const pendingDownloadRef = useRef(false)

  // Génère un vrai fichier PDF téléchargeable (pas de boîte de dialogue
  // d'impression) à partir du rapport une fois affiché normalement dans la
  // modale — un rendu hors-écran donnait une capture vide avec html2canvas.
  useEffect(() => {
    if (!showReport || !pendingDownloadRef.current) return
    pendingDownloadRef.current = false
    const t = setTimeout(async () => {
      try {
        const html2pdf = (await import('html2pdf.js')).default
        await html2pdf()
          .set({
            filename: `Compte-rendu-${name.replace(/\s+/g, '-')}.pdf`,
            margin: 10,
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          })
          .from(reportRef.current)
          .save()
      } catch (e) {
        console.error('Génération PDF échouée', e)
      } finally {
        setDownloadingPdf(false)
        setShowReport(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [showReport, name])

  const handleDownloadPdf = () => {
    if (downloadingPdf) return
    setDownloadingPdf(true)
    pendingDownloadRef.current = true
    setShowReport(true)
  }

  const reportData = {
    collaborateur: name,
    trainerName,
    weekDate: saveWeekDate,
    categoryKey,
    assessments,
    attitudeStatus,
    attitudeNote,
    participationStatus,
    participationNote,
    comprehensionStatus,
    comprehensionNote,
    appreciation,
    commentaireLibre,
    autoEval,
    pointsRank,
    pointsRankOf,
    totalPoints,
  }

  const reportUrl = typeof window !== 'undefined'
    ? `${PUBLIC_ORIGIN}/rapport/?c=${encodeURIComponent(name)}&w=${saveWeekDate}&t=${encodeURIComponent(ownerName)}&cat=${categoryKey}`
    : ''

  const copyLink = () => {
    if (!reportUrl) return
    navigator.clipboard.writeText(reportUrl).catch(() => {})
  }

  const managers = getManagers(entree.magasin)

  // Retour envoyé au formé lui-même — distinct du compte rendu manager.
  const bilanUrl = typeof window !== 'undefined'
    ? `${PUBLIC_ORIGIN}/bilan-formation/?c=${encodeURIComponent(name)}&w=${saveWeekDate}&t=${encodeURIComponent(ownerName)}&cat=${categoryKey}`
    : ''
  const fichePratiqueUrl = `${PUBLIC_ORIGIN}/fiche-pratique/`
  const formeEmail = buildLptEmail(entree.prenom, entree.nom)
  const formePrenom = extractPrenom(entree.prenom || name) || name.split(' ')[0]

  const buildFormeMailto = () => {
    const subject = encodeURIComponent('Ton retour de formation')
    const messageBloc = messageFormé.trim() ? `\n${messageFormé.trim()}\n` : ''
    const body = encodeURIComponent(
      `Salut ${formePrenom},\n\n` +
      `Voici mon retour suite à la formation. Les points non maîtrisés ne sont pas un reproche, c'est simplement des points à travailler, et c'est parfaitement normal en sortie de formation — pas d'inquiétude !\n` +
      `${messageBloc}\n` +
      `Tu trouveras dans ce mail :\n` +
      `- Ta fiche récapitulative de la formation, qui reprend dans les grandes lignes les thèmes abordés : ${bilanUrl}\n` +
      `- La fiche pratique à garder sous la main : ${fichePratiqueUrl}\n\n` +
      `Si tu as des questions, n'hésite pas, tu peux répondre à ce mail pour me demander.\n\n` +
      `Bonnes ventes à toi !\n\n` +
      `${trainerName}\n` +
      `Formateur — Lunettes Pour Tous`
    )
    return `mailto:${formeEmail}?subject=${subject}&body=${body}`
  }

  const handleSendToForme = async () => {
    if (!formeEmail) return
    window.location.href = buildFormeMailto()
    const now = new Date().toISOString()
    setMailFormeSentAt(now)
    await saveSnapshot(buildSnap({ mail_forme_sent_at: now }))
  }

  const correctWithLT = async (text) => {
    const params = new URLSearchParams({ text, language: 'fr' })
    const res = await fetch('https://api.languagetool.org/v2/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await res.json()
    const matches = (data.matches || []).filter(m => m.replacements?.length)
    if (!matches.length) return null
    const sorted = [...matches].sort((a, b) => b.offset - a.offset)
    let corrected = text
    for (const m of sorted) {
      corrected = corrected.slice(0, m.offset) + m.replacements[0].value + corrected.slice(m.offset + m.length)
    }
    return corrected
  }

  const handleCorrectAttitude = async () => {
    if (!attitudeNote.trim() || correcting) return
    setCorrecting('attitude')
    try {
      const corrected = await correctWithLT(attitudeNote)
      if (corrected) await handleAttitudeNote(corrected)
    } catch (e) { console.error('Correction échouée', e) } finally { setCorrecting(null) }
  }

  const handleCorrectParticipation = async () => {
    if (!participationNote.trim() || correcting) return
    setCorrecting('participation')
    try {
      const corrected = await correctWithLT(participationNote)
      if (corrected) await handleParticipationNote(corrected)
    } catch (e) { console.error('Correction échouée', e) } finally { setCorrecting(null) }
  }

  const handleCorrectComprehension = async () => {
    if (!comprehensionNote.trim() || correcting) return
    setCorrecting('comprehension')
    try {
      const corrected = await correctWithLT(comprehensionNote)
      if (corrected) await handleComprehensionNote(corrected)
    } catch (e) { console.error('Correction échouée', e) } finally { setCorrecting(null) }
  }

  const handleCorrectCommentaire = async () => {
    if (!commentaireLibre.trim() || correcting) return
    setCorrecting('commentaire')
    try {
      const corrected = await correctWithLT(commentaireLibre)
      if (corrected) {
        setCommentaireLibre(corrected)
        await saveSnapshot(buildSnap({ commentaire_libre: corrected }))
      }
    } catch (e) { console.error('Correction échouée', e) } finally { setCorrecting(null) }
  }

  const handlePrefillComment = async () => {
    const draft = buildDraftComment({
      prenom: entree.prenom || name.split(' ')[0],
      themes, assessments,
      attitudeStatus, attitudeNote,
      participationStatus, participationNote,
      comprehensionStatus, comprehensionNote,
      appreciation,
      globalRate,
      notesSemaine,
    })
    if (!draft) return
    if (commentaireLibre.trim() && !window.confirm('Remplacer le texte actuel par un résumé généré à partir de la fiche ?')) return
    setCommentaireLibre(draft)
    await saveSnapshot(buildSnap({ commentaire_libre: draft }))
  }

  const sendToManager = () => {
    if (!managers.length || !reportUrl) return
    const emails  = managers.map(m => m.email).join(',')
    const prenom  = entree.prenom || name.split(' ')[0]
    const greeting = managers.length > 1
      ? managers.map(m => extractPrenom(m.name)).join(' et ')
      : extractPrenom(managers[0].name)
    const isPlural = managers.length > 1
    const subject = encodeURIComponent(`Retour formation ${prenom}`)
    const body = encodeURIComponent(
      `Hello ${greeting},\n\n` +
      `Voici le lien pour accéder au compte rendu de ${prenom} :\n\n` +
      `${reportUrl}\n\n` +
      (isPlural
        ? `Si vous avez des questions ou si vous voulez qu'on échange à son sujet, je suis bien sûr disponible, n'hésitez pas !\n\n` +
          `Bonne journée à vous.\n\n`
        : `Si tu as des questions ou si tu veux qu'on échange à son sujet, je suis bien sûr disponible, n'hésite pas !\n\n` +
          `Bonne journée à toi.\n\n`
      ) +
      `${trainerName}\n` +
      `Formateur — Lunettes Pour Tous`
    )
    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`
    const now = new Date().toISOString()
    setMailSentAt(now)
    saveSnapshot(buildSnap({ mail_sent_at: now })).catch(() => {})
  }

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
  )

  return (
    <>
    {/* Modal compte rendu */}
    {showReport && (
      <div
        onClick={e => { if (e.target === e.currentTarget) setShowReport(false) }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          overflowY: 'auto', padding: '24px 16px 48px',
        }}
      >
        {/* Barre d'actions */}
        <div style={{
          maxWidth: 780, margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <button
            onClick={() => setShowReport(false)}
            style={{
              padding: '8px 18px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ← Fermer
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={copyLink}
              style={{
                padding: '8px 18px', borderRadius: 20, border: '1px solid rgba(0,171,233,0.5)',
                background: 'rgba(0,171,233,0.15)', color: '#00abe9',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🔗 Copier le lien manager
            </button>
            <button
              onClick={() => window.print()}
              style={{
                padding: '8px 18px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🖨️ Imprimer
            </button>
          </div>
        </div>
        <div ref={reportRef} className="print-report-area">
          <CompteRenduManager data={reportData} />
        </div>
      </div>
    )}

    {/* Aperçu du bilan envoyé au formé — exactement ce qu'il verra en ouvrant le lien */}
    {showFormePreview && (
      <div
        onClick={e => { if (e.target === e.currentTarget) setShowFormePreview(false) }}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          overflowY: 'auto', padding: '24px 16px 48px',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto 16px' }}>
          <button
            onClick={() => setShowFormePreview(false)}
            style={{
              padding: '8px 18px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.3)',
              background: 'rgba(255,255,255,0.12)', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            ← Fermer
          </button>
        </div>
        <BilanFormationContent
          collaborateur={name}
          categoryKey={categoryKey}
          assessments={assessments}
          message={messageFormé}
          globalRate={globalRate}
          globalCounts={globalCounts}
        />
      </div>
    )}

    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 32 }}>

      {/* Nom + classements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>{name}</div>
            {lastEditor && lastEditor !== trainerName && (
              <span style={{ fontSize: 11, color: '#818cf8', fontWeight: 600 }}>
                🔄 dernière saisie par {lastEditor}
              </span>
            )}
          </div>
          {rank && rankOf && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: rank === 1 ? 'rgba(22,163,74,0.15)' : 'rgba(100,116,139,0.15)',
              border: `1px solid ${rank === 1 ? 'rgba(22,163,74,0.3)' : '#334155'}`,
              borderRadius: 20, padding: '4px 12px',
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: rank === 1 ? '#16a34a' : '#94a3b8' }}>
                {rank}{ordFR(rank)}
              </span>
              <span style={{ fontSize: 11, color: '#64748b' }}>du groupe sur {rankOf}</span>
            </div>
          )}
        </div>

        {/* Alerte activité écran — signal RELATIF au groupe uniquement, jamais
            une preuve absolue de ce que fait le formé (voir échange du 13/08) */}
        {groupAvgActiveSeconds >= 300 && myActiveSeconds > 0 && myActiveSeconds < groupAvgActiveSeconds * 0.6 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.35)',
            borderRadius: 12, padding: '10px 14px',
          }}>
            <span style={{ fontSize: 18 }}>📱</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                Activité écran nettement en dessous du groupe
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                {formatDuration(myActiveSeconds)} sur l'app cette semaine, contre {formatDuration(groupAvgActiveSeconds)} en moyenne dans le groupe
              </div>
            </div>
          </div>
        )}

        {/* Bande points / niveau / classement points */}
        {(() => {
          const lvl = getLevelInfo(totalPoints)
          return (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: lvl.levelDef.bg, border: `1px solid ${lvl.levelDef.border}`,
              borderRadius: 12, padding: '10px 14px',
            }}>
              <span style={{ fontSize: 22 }}>{lvl.levelDef.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: lvl.levelDef.color, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  {lvl.levelDef.name}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>
                  {totalPoints} pts
                </div>
              </div>
              {pointsRank && pointsRankOf && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2,
                  background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 10px',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    {pointsRank}{ordFR(pointsRank)}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                    classement pts / {pointsRankOf}
                  </span>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setActiveTab('retour')}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            border: `1.5px solid ${activeTab === 'retour' ? '#0089ba' : '#334155'}`,
            background: activeTab === 'retour' ? 'rgba(0,137,186,0.15)' : '#1e293b',
            color: activeTab === 'retour' ? '#00abe9' : '#64748b',
          }}
        >
          📋 Retour de formation
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
            border: `1.5px solid ${activeTab === 'notes' ? '#7c3aed' : '#334155'}`,
            background: activeTab === 'notes' ? 'rgba(124,58,237,0.15)' : '#1e293b',
            color: activeTab === 'notes' ? '#a78bfa' : '#64748b',
          }}
        >
          📝 Notes de la semaine {notesSemaine.trim() && '•'}
        </button>
      </div>

      {activeTab === 'notes' ? (
        <section style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', background: '#162032', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Notes prises pendant la semaine
            </span>
            {saving && <span style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>Sauvegarde…</span>}
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
              Notes libres à prendre au fil de la semaine sur ce formé (une remarque après un module, un point à ne pas oublier…).
              Elles ne sont visibles que par les formateurs et sont reprises automatiquement par le bouton
              "🪄 Pré-remplir" du "Mot du formateur" dans l'onglet Retour de formation.
            </div>
            <textarea
              value={notesSemaine}
              onChange={e => setNotesSemaine(e.target.value)}
              onBlur={async e => {
                const val = e.target.value
                setNotesSemaine(val)
                await saveSnapshot(buildSnap({ notes_semaine: val }))
              }}
              placeholder="Ex : Lundi — un peu perdu sur les verres progressifs, à revoir. Mercredi — bonne participation à l'oral…"
              rows={10}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10,
                border: '1.5px solid #334155', background: '#0f172a',
                fontSize: 13, color: '#f1f5f9', resize: 'vertical',
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
              }}
              onFocus={e => { e.target.style.borderColor = '#475569' }}
              onBlurCapture={e => { e.target.style.borderColor = '#334155' }}
            />
          </div>
        </section>
      ) : (
      <>

      {/* Quiz results */}
      <section style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', background: '#162032' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Résultats aux Quiz
          </span>
        </div>
        <div style={{ padding: '12px 18px' }}>
          {quizData.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic', padding: '8px 0' }}>
              Aucun résultat de quiz enregistré pour ce collaborateur.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quizData.map(({ moduleId, label, score, total }) => {
                const pct = total > 0 ? Math.round((score / total) * 100) : null
                const barColor = pct === null ? '#475569' : pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                const badgeBg  = pct === null ? '#334155' : pct >= 70 ? '#14532d' : pct >= 50 ? '#78350f' : '#7f1d1d'
                const badgeColor = pct === null ? '#94a3b8' : barColor
                return (
                  <div key={moduleId}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{label}</span>
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: badgeColor,
                        background: badgeBg, borderRadius: 20, padding: '2px 10px',
                      }}>
                        {pct !== null ? `${score}/${total} — ${pct}%` : `${score}/${total}`}
                      </span>
                    </div>
                    {total > 0 && (
                      <div style={{ height: 6, background: '#334155', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 99, transition: 'width .4s' }} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Theme assessments */}
      <section style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', background: '#162032', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Thèmes abordés
          </span>
          {saving && (
            <span style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>Sauvegarde…</span>
          )}
        </div>
        <div style={{ padding: '8px 0' }}>
          {themes.map((moduleId, idx) => {
            const meta = MODULE_DATA[moduleId]
            if (!meta) return null
            const current = assessments[moduleId] || null
            const activeSt = STATUS_OPTIONS.find(o => o.key === current)
            const qStats = themeQuizStats[moduleId]
            const qRate = qStats?.total ? Math.round((qStats.correct / qStats.total) * 100) : null
            const qColor = qRate === null ? null : qRate >= 70 ? '#16a34a' : qRate >= 40 ? '#d97706' : '#dc2626'
            const isSuggested = autoSuggestedThemes.has(moduleId)
            return (
              <div
                key={moduleId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 18px',
                  borderBottom: idx < themes.length - 1 ? '1px solid #334155' : 'none',
                  background: activeSt ? `${activeSt.color}18` : 'transparent',
                  boxShadow: isSuggested ? `inset 3px 0 0 ${activeSt?.color || '#475569'}` : 'none',
                  transition: 'background .15s',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>{meta.label}</div>
                  {meta.sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{meta.sub}</div>}
                  {isSuggested && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#818cf8', marginTop: 3 }}>
                      🤖 suggéré via le taux de quiz — à vérifier
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                  {STATUS_OPTIONS.map(opt => {
                    const active = current === opt.key
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setThemeStatus(moduleId, opt.key)}
                        title={opt.label}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                          border: `1.5px solid ${active ? opt.border : '#334155'}`,
                          background: active ? opt.bg : '#253247',
                          color: active ? opt.color : '#64748b',
                          boxShadow: active ? `0 1px 3px ${opt.border}` : 'none',
                        }}
                      >
                        {opt.icon} {opt.label}
                      </button>
                    )
                  })}
                </div>
                <ThemeTrendSparkline byDay={themeQuizByDay[moduleId]} />
                <div
                  title="Taux de bonnes réponses aux quiz sur ce thème — calculé automatiquement à partir des réponses du formé, indépendant de ton évaluation ci-contre"
                  style={{
                    flexShrink: 0, minWidth: 64, textAlign: 'right',
                    fontSize: 11, fontWeight: 700,
                    color: qRate === null ? '#475569' : qColor,
                  }}
                >
                  {qRate !== null ? `📊 ${qStats.correct}/${qStats.total} (${qRate}%)` : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Global rate */}
      <section style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: '20px 22px' }}>
        <RateBar rate={rate} />
      </section>

      {/* Commentaires */}
      <section style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', background: '#162032', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Commentaires du formateur
          </span>
          {saving && <span style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>Sauvegarde…</span>}
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Attitude */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>Attitude générale</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {COMMENTAIRE_OPTS.map(opt => {
                const active = attitudeStatus === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAttitudeStatus(opt.key)}
                    style={{
                      flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all .15s',
                      border: `1.5px solid ${active ? opt.border : '#334155'}`,
                      background: active ? opt.bg : '#253247',
                      color: active ? opt.color : '#64748b',
                      boxShadow: active ? `0 1px 4px ${opt.border}` : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {attitudeStatus && attitudeStatus !== 'ras' && (
              <>
                <textarea
                  value={attitudeNote}
                  onChange={e => setAttitudeNote(e.target.value)}
                  onBlur={e => handleAttitudeNote(e.target.value)}
                  placeholder="Précisez ce que vous avez observé…"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid #334155', background: '#0f172a',
                    fontSize: 13, color: '#f1f5f9', resize: 'vertical',
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#475569' }}
                  onBlurCapture={e => { e.target.style.borderColor = '#334155' }}
                />
                {attitudeNote.trim() && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <CorrectButton onClick={handleCorrectAttitude} loading={correcting === 'attitude'} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Participation */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>Participation</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {COMMENTAIRE_OPTS.map(opt => {
                const active = participationStatus === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleParticipationStatus(opt.key)}
                    style={{
                      flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all .15s',
                      border: `1.5px solid ${active ? opt.border : '#334155'}`,
                      background: active ? opt.bg : '#253247',
                      color: active ? opt.color : '#64748b',
                      boxShadow: active ? `0 1px 4px ${opt.border}` : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {participationStatus && participationStatus !== 'ras' && (
              <>
                <textarea
                  value={participationNote}
                  onChange={e => setParticipationNote(e.target.value)}
                  onBlur={e => handleParticipationNote(e.target.value)}
                  placeholder="Précisez ce que vous avez observé…"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid #334155', background: '#0f172a',
                    fontSize: 13, color: '#f1f5f9', resize: 'vertical',
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#475569' }}
                  onBlurCapture={e => { e.target.style.borderColor = '#334155' }}
                />
                {participationNote.trim() && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <CorrectButton onClick={handleCorrectParticipation} loading={correcting === 'participation'} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Compréhension */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 10 }}>Compréhension des contenus</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {COMMENTAIRE_OPTS.map(opt => {
                const active = comprehensionStatus === opt.key
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleComprehensionStatus(opt.key)}
                    style={{
                      flex: 1, padding: '9px 6px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', transition: 'all .15s',
                      border: `1.5px solid ${active ? opt.border : '#334155'}`,
                      background: active ? opt.bg : '#253247',
                      color: active ? opt.color : '#64748b',
                      boxShadow: active ? `0 1px 4px ${opt.border}` : 'none',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {comprehensionStatus && comprehensionStatus !== 'ras' && (
              <>
                <textarea
                  value={comprehensionNote}
                  onChange={e => setComprehensionNote(e.target.value)}
                  onBlur={e => handleComprehensionNote(e.target.value)}
                  placeholder="Précisez ce que vous avez observé…"
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 10,
                    border: '1.5px solid #334155', background: '#0f172a',
                    fontSize: 13, color: '#f1f5f9', resize: 'vertical',
                    fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#475569' }}
                  onBlurCapture={e => { e.target.style.borderColor = '#334155' }}
                />
                {comprehensionNote.trim() && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                    <CorrectButton onClick={handleCorrectComprehension} loading={correcting === 'comprehension'} />
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </section>

      {/* Appréciation globale */}
      <section style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', background: '#162032' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Appréciation globale
          </span>
        </div>
        <div style={{ padding: '14px 18px', display: 'flex', gap: 10 }}>
          {APPRECIATIONS.map(opt => {
            const active = appreciation === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => toggleAppreciation(opt.key)}
                style={{
                  flex: 1, padding: '16px 8px', borderRadius: 14, cursor: 'pointer',
                  border: `2px solid ${active ? opt.solidBg : '#334155'}`,
                  background: active ? opt.solidBg : '#253247',
                  color: active ? '#fff' : '#64748b',
                  fontWeight: active ? 700 : 500, fontSize: 12,
                  lineHeight: 1.4, textAlign: 'center', transition: 'all .18s',
                  boxShadow: active ? `0 4px 14px ${opt.solidBg}55` : 'none',
                  fontFamily: 'inherit',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Commentaire libre formateur */}
      <section style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', background: '#162032', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Mot du formateur
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {saving && <span style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>Sauvegarde…</span>}
            <button
              onClick={handlePrefillComment}
              title="Génère un brouillon à partir des thèmes, de l'attitude, de la participation, de la compréhension, de l'appréciation et des notes de la semaine déjà renseignées"
              style={{
                padding: '5px 12px', borderRadius: 8, border: '1px solid #334155',
                background: '#0f172a', color: '#818cf8',
                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              🪄 Pré-remplir
            </button>
            {commentaireLibre.trim() && (
              <CorrectButton onClick={handleCorrectCommentaire} loading={correcting === 'commentaire'} />
            )}
          </div>
        </div>
        <div style={{ padding: '14px 18px' }}>
          <textarea
            value={commentaireLibre}
            onChange={e => setCommentaireLibre(e.target.value)}
            onBlur={async e => {
              const val = e.target.value
              setCommentaireLibre(val)
              await saveSnapshot(buildSnap({ commentaire_libre: val }))
            }}
            placeholder="Ajoutez un mot personnalisé sur ce collaborateur — il apparaîtra dans le compte rendu envoyé au manager…"
            rows={4}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid #334155', background: '#0f172a',
              fontSize: 13, color: '#f1f5f9', resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
            }}
            onFocus={e => { e.target.style.borderColor = '#475569' }}
            onBlurCapture={e => { e.target.style.borderColor = '#334155' }}
          />
        </div>
      </section>

      {/* Boutons actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowReport(true)}
          style={{
            flex: 1, padding: '14px 16px', borderRadius: 14,
            background: '#334155', color: '#f1f5f9', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span>👁</span> Aperçu compte rendu
        </button>

        <button
          onClick={handleDownloadPdf}
          disabled={downloadingPdf}
          style={{
            flex: 1, padding: '14px 16px', borderRadius: 14,
            background: '#334155', color: '#f1f5f9', border: 'none',
            fontSize: 13, fontWeight: 700, cursor: downloadingPdf ? 'default' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            opacity: downloadingPdf ? 0.6 : 1,
          }}
        >
          <span>📄</span> {downloadingPdf ? 'Génération…' : 'Télécharger PDF'}
        </button>

        {managers.length > 0 ? (
          mailSentAt ? (
            <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'stretch' }}>
              <div style={{
                flex: 1, padding: '12px 16px', borderRadius: 14,
                background: '#14532d33', border: '1.5px solid #16a34a66',
                fontSize: 13, color: '#4ade80', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                ✉️ Envoyé le {new Date(mailSentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </div>
              <button
                onClick={sendToManager}
                style={{
                  flexShrink: 0, padding: '12px 16px', borderRadius: 14,
                  background: '#1e293b', border: '1.5px solid #334155',
                  fontSize: 12, color: '#64748b', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Renvoyer
              </button>
            </div>
          ) : (
            <button
              onClick={sendToManager}
              style={{
                flex: 1, padding: '14px 16px', borderRadius: 14,
                background: '#0089ba', color: '#fff', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 14px rgba(0,137,186,0.25)',
              }}
            >
              <span>✉️</span> {managers.length > 1 ? 'Envoyer aux managers' : 'Envoyer au manager'}
            </button>
          )
        ) : (
          <div style={{
            flex: 1, padding: '14px 16px', borderRadius: 14,
            background: '#1e293b', border: '1.5px dashed #334155',
            fontSize: 12, color: '#475569', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            ✉️ Manager non renseigné
          </div>
        )}
      </div>

      {/* Retour au formé lui-même — distinct du compte rendu manager */}
      <section style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #334155', background: '#162032' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Retour au formé
          </span>
        </div>
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            Un mail personnel à {name.split(' ')[0]} avec ses acquis/non-acquis, son taux global de bonnes réponses,
            et ton message ci-dessous — distinct du compte rendu envoyé au manager.
          </div>
          <textarea
            value={messageFormé}
            onChange={e => setMessageFormé(e.target.value)}
            onBlur={() => saveSnapshot(buildSnap({ message_formateur_forme: messageFormé }))}
            placeholder="Un mot pour le rassurer, le conseiller ou l'encourager (optionnel)…"
            rows={3}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 10,
              border: '1.5px solid #334155', background: '#0f172a',
              fontSize: 13, color: '#f1f5f9', resize: 'vertical',
              fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', lineHeight: 1.6,
            }}
          />
          <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
            <button
              onClick={() => setShowFormePreview(true)}
              style={{
                flexShrink: 0, padding: '14px 16px', borderRadius: 14,
                background: '#334155', color: '#f1f5f9', border: 'none',
                fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <span>👁</span> Aperçu
            </button>
            {!formeEmail ? (
              <div style={{
                flex: 1, padding: '14px 16px', borderRadius: 14,
                background: '#1e293b', border: '1.5px dashed #334155',
                fontSize: 12, color: '#475569', fontWeight: 500, textAlign: 'center',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                Nom/prénom manquants pour déduire l'adresse mail
              </div>
            ) : mailFormeSentAt ? (
              <>
                <div style={{
                  flex: 1, padding: '12px 16px', borderRadius: 14,
                  background: '#14532d33', border: '1.5px solid #16a34a66',
                  fontSize: 13, color: '#4ade80', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  ✉️ Envoyé le {new Date(mailFormeSentAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
                <button
                  onClick={handleSendToForme}
                  style={{
                    flexShrink: 0, padding: '12px 16px', borderRadius: 14,
                    background: '#1e293b', border: '1.5px solid #334155',
                    fontSize: 12, color: '#64748b', fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Renvoyer
                </button>
              </>
            ) : (
              <button
                onClick={handleSendToForme}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 14,
                  background: '#7c3aed', color: '#fff', border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 4px 14px rgba(124,58,237,0.25)',
                }}
              >
                <span>✉️</span> Envoyer au formé ({formeEmail})
              </button>
            )}
          </div>
        </div>
      </section>

      </>
      )}

    </div>
    </>
  )
}

// ── Vue liste formés (catégorie choisie) ─────────────────────────

function ordFR(n) { return n === 1 ? 'er' : 'e' }

function CollabListView({ entrees, categoryKey, trainerName, onBack }) {
  const [selected, setSelected]       = useState(null)
  const [showSendAll, setShowSendAll] = useState(false)
  const [sentKeys, setSentKeys]       = useState(new Set())
  const [ranks, setRanks]             = useState({}) // { name: rankNumber }
  const [rankOf, setRankOf]           = useState(0)  // total de formés classés
  const [pointsRanks, setPointsRanks]   = useState({}) // { name: rankNumber } basé sur les points quiz
  const [pointsTotals, setPointsTotals] = useState({}) // { name: totalPoints }
  const [pointsRankOf, setPointsRankOf] = useState(0)
  const [mailSentMap, setMailSentMap] = useState({}) // { name: dateISO }
  const [weekDateMap, setWeekDateMap] = useState({}) // { name: week_date du dernier rapport }
  const [reportSnapMap, setReportSnapMap] = useState({}) // { name: stats_snapshot complet } — pour fusionner sans écraser
  const [reportOwnerMap, setReportOwnerMap] = useState({}) // { name: vrai trainer_name en base de sa fiche partagée }
  const [activeSecondsMap, setActiveSecondsMap] = useState({}) // { name: secondes d'activité écran cette semaine }
  const [activeSecondsAvg, setActiveSecondsAvg] = useState(0) // moyenne du groupe
  const [groupThemeStats, setGroupThemeStats] = useState({}) // { theme: { correct, total } } — agrégé sur tout le groupe
  const [showWeakThemes, setShowWeakThemes] = useState(true)
  const weekDate = getWeekDate()
  const catMeta  = CATEGORY_META[categoryKey] || {}

  const filtered = entrees.filter(e => effectiveCat(e) === categoryKey)

  useEffect(() => {
    if (filtered.length === 0) return
    const names = filtered.map(e => e.fullName || `${e.nom} ${e.prenom}`.trim())

    const computeRanks = async () => {
      // Charge tous les rapports (fiches partagées entre formateurs), triés du
      // plus récent au plus ancien — un formé peut avoir été rempli par un
      // autre formateur que celui actuellement connecté
      const reportsRows = await sbSelect('formation_reports', `trainer_name=neq.__auto_eval__&order=updated_at.desc`)

      // Regroupe par formé puis fusionne (mergeFormationReports) — jamais un
      // simple "premier rencontré = le bon", sinon une sauvegarde partielle plus
      // récente d'un formateur masque les acquis déjà notés par un collègue
      const rowsByCollab = {}
      for (const r of (reportsRows || [])) {
        (rowsByCollab[r.collaborateur] ||= []).push(r)
      }
      const reportMap = {}
      const sentMap   = {}
      const wdMap     = {}
      const ownerMap  = {}
      for (const [collab, rows] of Object.entries(rowsByCollab)) {
        const merged = mergeFormationReports(rows)
        if (!merged) continue
        reportMap[collab] = merged.snapshot
        wdMap[collab]     = merged.weekDate || weekDate
        ownerMap[collab]  = merged.trainerName
        if (merged.snapshot?.mail_sent_at) sentMap[collab] = merged.snapshot.mail_sent_at
      }
      setMailSentMap(sentMap)
      setWeekDateMap(wdMap)
      setReportOwnerMap(ownerMap)
      setReportSnapMap(reportMap)

      // Résultats quiz — un fetch par formé, résolu sur SES vraies salles jouées
      // (voir fetchModuleAndQuizRows) plutôt que sur la salle active du formateur
      // ou une semaine calendaire devinée — les deux ont fait disparaître à tort
      // des points bien réels. L'index d'archive n'est chargé qu'une fois et
      // partagé entre tous les formés (une seule requête session_history).
      const archiveIndexPromise = fetchArchiveIndex()
      const perName = await Promise.all(names.map(n => fetchModuleAndQuizRows(n, archiveIndexPromise)))
      const quizArrays   = perName.map(p => p.moduleRows)
      const answerArrays = perName.map(p => p.answerRows)

      // Temps d'activité écran — signal relatif au groupe (voir addActiveSeconds)
      const activeSecondsArr = await Promise.all(names.map(n => fetchActiveSeconds(n, archiveIndexPromise)))
      const activeMap = {}
      names.forEach((n, i) => { activeMap[n] = activeSecondsArr[i] })
      const activeValues = Object.values(activeMap).filter(v => v > 0)
      setActiveSecondsMap(activeMap)
      setActiveSecondsAvg(activeValues.length ? activeValues.reduce((a, b) => a + b, 0) / activeValues.length : 0)

      // Construit byModule pour un formé en combinant module_results + quiz_answers
      const buildByModule = (modRows, ansRows) => {
        const byModule = {}
        for (const r of (modRows || [])) {
          const mid = r.module_id || r.module
          if (!mid) continue
          const sc = r.score ?? 0
          const tot = r.score_total ?? r.total ?? 0
          if (!byModule[mid] || sc > byModule[mid].score) byModule[mid] = { score: sc, total: tot }
        }
        // Vrai quiz (question_idx < 100 — le "jeu des questions"/entraînement oral
        // réutilise le même module_id mais avec question_idx >= 100, traité
        // séparément ci-dessous) : toujours calculé depuis quiz_answers, jamais
        // ignoré au prétexte qu'un module_results existe déjà (incident IDF du
        // 13/08) — on garde la source la plus complète des deux.
        const qaByModule = {}
        for (const r of (ansRows || [])) {
          const mid = r.module_id
          if (!mid || (r.question_idx ?? 0) >= 100) continue
          if (!qaByModule[mid]) qaByModule[mid] = {}
          qaByModule[mid][r.question_idx] = r.is_correct
        }
        for (const [mid, qMap] of Object.entries(qaByModule)) {
          const correct = Object.values(qMap).filter(Boolean).length
          const total = MODULE_DATA[mid]?.quiz?.length || Object.keys(qMap).length
          if (total > 0 && (!byModule[mid] || total >= byModule[mid].total)) {
            byModule[mid] = { score: correct, total }
          }
        }
        // Jeu des questions / entraînement oral (question_idx >= 100) : toujours
        // compté EN PLUS, même quand le vrai quiz du module a déjà un score —
        // sinon ces bonnes réponses, bien réelles, disparaissaient en silence
        // (et avec elles, les points correspondants — 10 par bonne réponse).
        const gameByModule = {}
        for (const r of (ansRows || [])) {
          const mid = r.module_id
          if (!mid || (r.question_idx ?? 0) < 100) continue
          if (!gameByModule[mid]) gameByModule[mid] = {}
          gameByModule[mid][r.question_idx] = r.is_correct
        }
        for (const [mid, qMap] of Object.entries(gameByModule)) {
          const correct = Object.values(qMap).filter(Boolean).length
          if (correct === 0) continue
          byModule[`${mid}__jeu`] = { score: correct, total: Object.keys(qMap).length }
        }
        return byModule
      }

      // Classement basé sur le TAUX de bonnes réponses (pas le nombre brut de
      // points) — même règle que le classement affiché au formé sur son propre
      // dashboard (voir buildParticipantRanking dans src/lib/scoring.js) : un
      // formé qui a répondu à moins de questions ne doit pas être défavorisé
      // face à un formé qui en a fait plus mais avec un taux plus faible.
      const scores = names.map((name, i) => ({
        name,
        byModule: buildByModule(quizArrays[i], answerArrays[i]),
      }))

      // Points faibles du groupe — agrège le taux de réussite par thème sur
      // TOUS les formés de la catégorie, même calcul que themeQuizStats dans
      // FicheCollab (thèmes mono-module directs + quiz transversaux question
      // par question) mais additionné sur tout le groupe au lieu d'un seul
      // formé, pour repérer en un coup d'œil ce qui mérite d'être repris en
      // clôture de session plutôt que d'avoir à ouvrir chaque fiche.
      const groupThemeTotals = {}
      const addGroupTheme = (theme, correct, total) => {
        if (!theme || !total) return
        if (!groupThemeTotals[theme]) groupThemeTotals[theme] = { correct: 0, total: 0 }
        groupThemeTotals[theme].correct += correct
        groupThemeTotals[theme].total += total
      }
      scores.forEach(({ byModule: bm }, i) => {
        for (const [mid, m] of Object.entries(bm)) {
          if (DIRECT_THEME_MODULES.has(mid)) addGroupTheme(mid, m.score, m.total)
        }
        const transversalByQuestion = {}
        for (const r of (answerArrays[i] || [])) {
          if (!TRANSVERSAL_MODULE_IDS.has(r.module_id) || (r.question_idx ?? 0) >= 100) continue
          transversalByQuestion[`${r.module_id}:${r.question_idx}`] = r
        }
        for (const r of Object.values(transversalByQuestion)) {
          addGroupTheme(themeForAnswer(r.module_id, r.question_idx), r.is_correct ? 1 : 0, 1)
        }
      })
      setGroupThemeStats(groupThemeTotals)

      const rateScores = scores.map(({ name, byModule: bm }) => {
        const vals = Object.values(bm)
        const correct = vals.reduce((s, m) => s + (m.score || 0), 0)
        const total = vals.reduce((s, m) => s + (m.total || 0), 0)
        return { name, points: correct * 10, total, rate: total ? correct / total : 0 }
      })
      const sortedByRate = [...rateScores].sort((a, b) => b.rate - a.rate || b.total - a.total)
      const ptsRankMap = {}
      const ptsTotMap = {}
      let pr = 1
      for (let i = 0; i < sortedByRate.length; i++) {
        if (i > 0 && sortedByRate[i].rate !== sortedByRate[i - 1].rate) pr = i + 1
        ptsTotMap[sortedByRate[i].name] = sortedByRate[i].points
        if (sortedByRate[i].total > 0) ptsRankMap[sortedByRate[i].name] = pr
      }
      setPointsRanks(ptsRankMap)
      setPointsTotals(ptsTotMap)
      setPointsRankOf(Object.keys(ptsRankMap).length)

      setRanks(ptsRankMap)
      setRankOf(Object.keys(ptsRankMap).length)
    }

    computeRanks()
  }, [filtered.length, weekDate, trainerName])

  // Regroupe les formés par manager (un même manager peut avoir plusieurs formés)
  const sendAllGroups = useMemo(() => {
    const byKey = {}
    for (const entree of filtered) {
      const mgrs = getManagers(entree.magasin)
      if (!mgrs.length) continue
      const emailKey = mgrs.map(m => m.email).sort().join(',')
      if (!byKey[emailKey]) byKey[emailKey] = { managers: mgrs, entrees: [], emailKey }
      byKey[emailKey].entrees.push(entree)
    }
    return Object.values(byKey)
  }, [filtered])

  const noManagerEntrees = useMemo(
    () => filtered.filter(e => !getManagers(e.magasin).length),
    [filtered]
  )

  // Trié du taux le plus faible au plus fort — seuil minimum de réponses pour
  // ne pas remonter un thème sur une poignée de questions non représentative
  // (même logique que la suggestion automatique d'acquis dans FicheCollab).
  const weakThemes = useMemo(() => {
    return Object.entries(groupThemeStats)
      .map(([theme, s]) => ({ theme, correct: s.correct, total: s.total, rate: s.total ? s.correct / s.total : 0 }))
      .filter(t => t.total >= 3)
      .sort((a, b) => a.rate - b.rate)
  }, [groupThemeStats])

  const buildGroupMailto = (group) => {
    const emails   = group.managers.map(m => m.email).join(',')
    const getPrenom = e => e.prenom || (e.fullName || `${e.nom} ${e.prenom}`).trim().split(' ')[0]
    const prenoms  = group.entrees.map(getPrenom)
    const subject  = encodeURIComponent(`Retour formation ${prenoms.join(', ')}`)

    const links = group.entrees.map(e => {
      const name = e.fullName || `${e.nom} ${e.prenom}`.trim()
      const wd   = weekDateMap[name] || weekDate
      // Fiche partagée : le lien pointe vers le vrai propriétaire en base de la
      // fiche de CE formé, pas forcément le formateur qui clique sur "Envoyer"
      // — sinon le manager peut recevoir un lien vers une fiche vide.
      const owner = reportOwnerMap[name] || trainerName
      const url  = `${PUBLIC_ORIGIN}/rapport/?c=${encodeURIComponent(name)}&w=${wd}&t=${encodeURIComponent(owner)}&cat=${categoryKey}`
      return prenoms.length === 1 ? url : `${getPrenom(e)} : ${url}`
    }).join('\n')

    const plural = prenoms.length > 1
    const mgrGreeting = group.managers.length > 1
      ? group.managers.map(m => extractPrenom(m.name)).join(' et ')
      : extractPrenom(group.managers[0].name)
    const body = encodeURIComponent(
      `Hello ${mgrGreeting},\n\n` +
      (plural
        ? `Voici les liens pour accéder aux comptes rendus de ${prenoms.join(' et ')} :\n\n`
        : `Voici le lien pour accéder au compte rendu de ${prenoms[0]} :\n\n`) +
      `${links}\n\n` +
      `Si tu as des questions ou si tu veux qu'on échange à ${plural ? 'leur' : 'son'} sujet, je suis bien sûr disponible, n'hésite pas !\n\n` +
      `Bonne journée à toi.\n\n` +
      `${trainerName}\n` +
      `Formateur — Lunettes Pour Tous`
    )
    return `mailto:${emails}?subject=${subject}&body=${body}`
  }

  const handleSendGroup = (group) => {
    window.location.href = buildGroupMailto(group)
    setSentKeys(prev => new Set([...prev, group.emailKey]))
    const now = new Date().toISOString()
    setMailSentMap(prev => {
      const next = { ...prev }
      for (const e of group.entrees) next[e.fullName || `${e.nom} ${e.prenom}`.trim()] = now
      return next
    })
    // Persiste mail_sent_at en base sans écraser le reste du retour déjà enregistré
    // Relit le stats_snapshot juste avant l'envoi (reportSnapMap peut être périmé si le
    // retour a été modifié depuis le chargement de la liste) pour ne pas écraser une saisie récente
    Promise.all(group.entrees.map(async (e) => {
      const nm = e.fullName || `${e.nom} ${e.prenom}`.trim()
      const wd = weekDateMap[nm] || weekDate
      // Fiche partagée : on relit et fusionne les lignes récentes tous formateurs
      // confondus (mergeFormationReports) et on continue d'écrire sur la plus
      // récente, au lieu de forker une ligne sous le nom du formateur qui clique
      // sur "Envoyer" — ou d'écraser les acquis notés par un collègue
      const freshRows = await sbSelect(
        'formation_reports',
        `collaborateur=eq.${encodeURIComponent(nm)}&week_date=eq.${encodeURIComponent(wd)}&trainer_name=neq.__auto_eval__&order=updated_at.desc&limit=30`
      )
      const merged = mergeFormationReports(freshRows)
      const owner = merged?.trainerName || trainerName
      const snap = merged?.snapshot || reportSnapMap[nm] || {}
      return sbUpsert(
        'formation_reports',
        {
          collaborateur: nm,
          week_date: wd,
          trainer_name: owner,
          status: 'draft',
          stats_snapshot: {
            ...snap,
            mail_sent_at: now,
            points_rank: pointsRanks[nm] ?? snap.points_rank ?? null,
            points_rank_of: pointsRankOf || snap.points_rank_of || null,
            total_points: pointsTotals[nm] ?? snap.total_points ?? 0,
          },
          updated_at: now,
        },
        'collaborateur,week_date,trainer_name'
      )
    })).catch(e => console.error('[RetourFormation] handleSendGroup', e))
  }

  useEffect(() => {
    if (filtered.length > 0 && !selected) setSelected(0)
  }, [filtered.length])

  if (filtered.length === 0) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{catMeta.icon}</div>
      <div style={{ color: '#94a3b8', fontSize: 14 }}>Aucun formé dans cette catégorie cette semaine.</div>
      <button className="detail-back" style={{ marginTop: 20 }} onClick={onBack}>← Retour</button>
    </div>
  )

  const selEntry = filtered[selected] || filtered[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Modale "Tout envoyer" */}
      {showSendAll && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowSendAll(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px 16px',
          }}
        >
          <div style={{
            background: '#1e293b', borderRadius: 20, width: '100%', maxWidth: 480,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden',
          }}>
            {/* Header modale */}
            <div style={{
              padding: '20px 24px 16px',
              borderBottom: '1px solid #334155',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>
                  ✉️ Envoyer tous les comptes rendus
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Cliquez sur chaque bouton pour ouvrir le mail pré-rempli
                </div>
              </div>
              <button
                onClick={() => setShowSendAll(false)}
                style={{
                  background: '#334155', border: 'none', borderRadius: 8,
                  width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#94a3b8',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >×</button>
            </div>

            {/* Liste des groupes */}
            <div style={{ padding: '12px 16px', maxHeight: '60vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sendAllGroups.length === 0 && (
                <div style={{ padding: '20px 0', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                  Aucun manager renseigné pour les formés de cette session.
                </div>
              )}
              {sendAllGroups.map(group => {
                const sent = sentKeys.has(group.emailKey)
                  || group.entrees.every(e => mailSentMap[e.fullName || `${e.nom} ${e.prenom}`.trim()])
                const getPrenom = e => e.prenom || (e.fullName || `${e.nom} ${e.prenom}`).trim().split(' ')[0]
                const prenoms = group.entrees.map(getPrenom)
                return (
                  <div
                    key={group.emailKey}
                    style={{
                      background: sent ? '#14532d33' : '#253247',
                      border: `1.5px solid ${sent ? '#16a34a55' : '#334155'}`,
                      borderRadius: 14, padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
                        {group.managers.map(m => m.name).join(' & ')}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {prenoms.join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendGroup(group)}
                      style={{
                        flexShrink: 0, padding: '8px 16px', borderRadius: 10,
                        border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                        fontFamily: 'inherit', transition: 'all .15s',
                        background: sent ? '#16a34a' : '#0089ba',
                        color: '#fff',
                        boxShadow: sent
                          ? '0 2px 8px rgba(22,163,74,0.3)'
                          : '0 2px 8px rgba(0,137,186,0.3)',
                      }}
                    >
                      {sent ? '✓ Ouvert' : '✉️ Envoyer'}
                    </button>
                  </div>
                )
              })}

              {/* Formés sans manager connu */}
              {noManagerEntrees.length > 0 && (
                <div style={{
                  background: '#78350f22', border: '1.5px solid #78350f66',
                  borderRadius: 14, padding: '12px 16px',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24', marginBottom: 4 }}>
                    Manager non renseigné
                  </div>
                  <div style={{ fontSize: 12, color: '#d97706' }}>
                    {noManagerEntrees.map(e => e.prenom || (e.fullName || `${e.nom} ${e.prenom}`).trim().split(' ')[0]).join(', ')}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '12px 16px 16px', borderTop: '1px solid #334155' }}>
              <button
                onClick={() => setShowSendAll(false)}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  background: '#334155', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, color: '#94a3b8', fontFamily: 'inherit',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <button className="detail-back" onClick={onBack}>← Retour</button>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `rgba(${catMeta.rgb},0.1)`, border: `1px solid rgba(${catMeta.rgb},0.2)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
        }}>
          {catMeta.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 16 }}>{catMeta.label}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {filtered.length} collaborateur{filtered.length > 1 ? 's' : ''} · Semaine du {weekDate}
          </div>
        </div>
        {sendAllGroups.length > 0 && (
          <button
            onClick={() => { setSentKeys(new Set()); setShowSendAll(true) }}
            style={{
              flexShrink: 0, padding: '9px 16px', borderRadius: 12,
              background: '#0089ba', color: '#fff', border: 'none',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 3px 10px rgba(0,137,186,0.25)',
            }}
          >
            ✉️ Tout envoyer
          </button>
        )}
      </div>

      {/* Points faibles du groupe — agrégé sur tous les formés de la catégorie,
          pour repérer en un coup d'œil ce qui mérite d'être repris en clôture
          de session sans avoir à ouvrir chaque fiche une par une. */}
      {weakThemes.length > 0 && (
        <div style={{
          background: '#1e293b', border: '1px solid #334155', borderRadius: 14,
          overflow: 'hidden', marginBottom: 18,
        }}>
          <div
            onClick={() => setShowWeakThemes(v => !v)}
            style={{
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', userSelect: 'none',
            }}
          >
            <span style={{ fontSize: 16 }}>🎯</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', flex: 1 }}>
              Points faibles du groupe
            </span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {weakThemes.length} thème{weakThemes.length > 1 ? 's' : ''} · trié du plus faible au plus fort
            </span>
            <span style={{ fontSize: 11, color: '#64748b', transform: showWeakThemes ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>▾</span>
          </div>
          {showWeakThemes && (
            <div style={{ padding: '4px 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weakThemes.map(t => {
                const pct = Math.round(t.rate * 100)
                const color = pct >= 70 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626'
                const label = MODULE_DATA[t.theme]?.label || t.theme
                return (
                  <div key={t.theme} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 150, flexShrink: 0, fontSize: 12.5, color: '#cbd5e1', fontWeight: 600 }}>{label}</div>
                    <div style={{ flex: 1, height: 8, background: '#334155', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .5s ease' }} />
                    </div>
                    <div style={{ width: 90, flexShrink: 0, textAlign: 'right', fontSize: 12, fontWeight: 700, color }}>
                      {pct}% <span style={{ color: '#475569', fontWeight: 500 }}>({t.correct}/{t.total})</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2,
        marginBottom: 18, scrollbarWidth: 'none',
      }}>
        {filtered.map((e, i) => {
          const nm = e.fullName || `${e.nom} ${e.prenom}`.trim()
          const active = i === selected
          const rank = ranks[nm]
          const sent = !!mailSentMap[nm]
          return (
            <button
              key={i}
              onClick={() => setSelected(i)}
              style={{
                flexShrink: 0, padding: '7px 18px', borderRadius: 99,
                border: active ? `2px solid ${catMeta.color}` : sent ? '1.5px solid #16a34a55' : '1.5px solid #334155',
                background: active ? catMeta.color : sent ? '#14532d22' : '#253247',
                color: active ? '#fff' : sent ? '#4ade80' : '#64748b',
                fontWeight: active ? 700 : 500,
                fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                whiteSpace: 'nowrap', boxShadow: active ? `0 2px 8px rgba(${catMeta.rgb},0.25)` : 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
              }}
            >
              <span>{sent && !active ? '✉️ ' : ''}{nm}</span>
              {rank && (
                <span style={{ fontSize: 10, fontWeight: 600, opacity: active ? 0.85 : 0.6 }}>
                  {rank}{ordFR(rank)}/{rankOf}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Fiche */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {selEntry && (
          <FicheCollab
            key={`${selEntry.fullName || selEntry.nom}-${categoryKey}`}
            entree={selEntry}
            categoryKey={categoryKey}
            trainerName={trainerName}
            weekDate={weekDate}
            rank={ranks[selEntry.fullName || `${selEntry.nom} ${selEntry.prenom}`.trim()]}
            rankOf={rankOf}
            pointsRank={pointsRanks[selEntry.fullName || `${selEntry.nom} ${selEntry.prenom}`.trim()]}
            totalPoints={pointsTotals[selEntry.fullName || `${selEntry.nom} ${selEntry.prenom}`.trim()] ?? 0}
            pointsRankOf={pointsRankOf}
            myActiveSeconds={activeSecondsMap[selEntry.fullName || `${selEntry.nom} ${selEntry.prenom}`.trim()] ?? 0}
            groupAvgActiveSeconds={activeSecondsAvg}
          />
        )}
      </div>
    </div>
  )
}

// ── Sélecteur de catégorie ────────────────────────────────────────

function CategorySelector({ entrees, onSelect }) {
  const counts = {}
  for (const e of entrees) {
    const cat = effectiveCat(e)
    counts[cat] = (counts[cat] || 0) + 1
  }

  // Le rapport DR se base sur la liste "Entrées" actuelle (jamais vidée
  // toute seule au changement de semaine calendaire — seulement à la
  // clôture explicite), pas sur une semaine précise : pas de paramètre de
  // date nécessaire, le lien reflète toujours ce qui est dans la liste en ce moment.
  const getDrUrl = (drKey) => {
    if (typeof window === 'undefined') return ''
    return `${PUBLIC_ORIGIN}/rapport-dr/?dr=${drKey}`
  }

  const handleMailDR = (drKey) => {
    const dr = DIRECTEURS[drKey]
    const prenom = dr.name.split(' ')[0]
    const url = getDrUrl(drKey)
    const subject = encodeURIComponent(`Retour formation — semaine en cours`)
    const body = encodeURIComponent(
      `Salut ${prenom} !\n\nVoici le retour global des entrées de la semaine sur ton réseau.\n\n${url}\n\nSi tu as des questions n'hésite pas !\n\nBonne journée à toi.`
    )
    window.location.href = `mailto:${dr.email || ''}?subject=${subject}&body=${body}`
  }

  return (
    <div>
      <div style={{ marginBottom: 20, color: '#64748b', fontSize: 14 }}>
        Choisissez la catégorie pour accéder aux fiches de retour de formation.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const count = counts[key] || 0
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                background: '#1e293b',
                border: '1.5px solid #334155',
                borderTop: `4px solid ${meta.color}`,
                borderRadius: 14, padding: '24px 18px', cursor: 'pointer',
                textAlign: 'left', transition: 'all .18s',
                display: 'flex', flexDirection: 'column', gap: 6,
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }}
              onMouseOver={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseOut={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: 28, marginBottom: 2 }}>{meta.icon}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{meta.label}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>{meta.sub}</span>
              <div style={{ marginTop: 6 }}>
                {count > 0 ? (
                  <span style={{
                    display: 'inline-block', fontSize: 12, fontWeight: 700,
                    color: meta.color, background: `rgba(${meta.rgb},0.15)`,
                    border: `1px solid rgba(${meta.rgb},0.3)`,
                    borderRadius: 20, padding: '3px 10px',
                  }}>
                    {count} formé{count > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, color: '#475569' }}>Aucun formé</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── Rapports Directeurs Régionaux ── */}
      <div style={{ marginTop: 32, borderTop: '1px solid #334155', paddingTop: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>
          Rapports Directeurs Régionaux
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(DIRECTEURS).map(([key, dr]) => (
            <div
              key={key}
              style={{
                background: '#1e293b', border: '1px solid #334155',
                borderLeft: `3px solid ${dr.color}`,
                borderRadius: 12, padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{dr.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{dr.fullName}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{dr.territory}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => window.open(getDrUrl(key), '_blank')}
                  style={{
                    padding: '6px 12px', borderRadius: 8, border: '1px solid #475569',
                    background: 'transparent', color: '#94a3b8',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  👁 Voir
                </button>
                <button
                  onClick={() => handleMailDR(key)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: dr.color,
                    color: '#fff', fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ✉️ Envoyer au DR
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
          Les rapports DR affichent tous les formés de leur réseau actuellement dans la liste « Entrées »
          (même non encore évalués), avec l&apos;appréciation choisie ci-dessus quand elle existe
          (« très bon élément » à « ça va être compliqué »).
        </div>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Historique : auto-éval (lecture seule) ───────────────────────

const HIST_APPR_META = {
  'tres-bon':       { label: '🌟 Très bon potentiel', color: '#4ade80' },
  'ca-va-le-faire': { label: '👍 Ça va le faire',      color: '#a3e635' },
  'accompagnement': { label: '🤝 Accompagnement',     color: '#fbbf24' },
  'complique':      { label: '⚠️ Compliqué',          color: '#f87171' },
}

function AutoEvalReadOnly({ snap }) {
  const ae     = snap?.auto_eval || {}
  const themes = ae.themes_list || []
  const asmts  = ae.theme_self_assessments || {}
  const accomp = ae.accompagnement_themes || []

  if (!themes.length && !ae.progres && !ae.rating) {
    return (
      <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '28px 0' }}>
        Aucune auto-évaluation disponible pour ce formé.
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {themes.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>Auto-évaluation des thèmes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {themes.map(t => {
              const s = asmts[t]
              const stars = starsDisplay(s)
              return (
                <div key={t} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 500 }}>{MODULE_DATA[t]?.label || t}</span>
                  {stars
                    ? <span style={{ fontSize: 13, letterSpacing: 1 }}>{stars}</span>
                    : <span style={{ fontSize: 11, color: '#475569' }}>—</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}
      {accomp.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Accompagnement souhaité</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {accomp.map(t => (
              <span key={t} style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: 'rgba(0,171,233,0.12)', color: '#38bdf8', border: '1px solid rgba(0,171,233,0.25)' }}>
                {MODULE_DATA[t]?.label || t}
              </span>
            ))}
          </div>
        </div>
      )}
      {[
        { key: 'progres',               label: 'Progrès perçus' },
        { key: 'appreciation_formation', label: 'Appréciation de la formation' },
        { key: 'suggestions',           label: 'Suggestions' },
      ].map(({ key, label }) => ae[key] ? (
        <div key={key}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, background: '#0f172a', borderRadius: 10, padding: '10px 14px', border: '1px solid #334155', whiteSpace: 'pre-wrap' }}>{ae[key]}</div>
        </div>
      ) : null)}
      {ae.rating && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Avis formation</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{'⭐'.repeat(ae.rating)}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: ae.rating >= 4 ? '#4ade80' : ae.rating === 3 ? '#fbbf24' : '#f87171' }}>
              {['','Insuffisant','Passable','Bien','Très bien','Excellent !'][ae.rating]}
            </span>
          </div>
          {ae.rating_comment && (
            <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.7, background: '#0f172a', borderRadius: 10, padding: '10px 14px', border: '1px solid #334155', fontStyle: 'italic', marginTop: 8, whiteSpace: 'pre-wrap' }}>
              « {ae.rating_comment} »
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Historique : fiche formé (retour + auto-éval) ─────────────────

function HistoriqueFiche({ record, autoEvalSnap, onBack }) {
  const [tab, setTab] = useState('retour')
  const snap     = record.stats_snapshot || {}
  const magasin  = snap.magasin || '—'
  const catKey   = classifyMagasin(magasin) || 'province'
  const hasAE    = !!(autoEvalSnap?.auto_eval)

  const reportData = {
    collaborateur:      record.collaborateur,
    trainerName:        record.trainer_name,
    weekDate:           record.week_date,
    categoryKey:        catKey,
    assessments:        snap.theme_assessments     || {},
    attitudeStatus:     snap.attitude_status       || null,
    attitudeNote:       snap.attitude_note         || '',
    participationStatus: snap.participation_status || null,
    participationNote:  snap.participation_note    || '',
    comprehensionStatus: snap.comprehension_status || null,
    comprehensionNote:  snap.comprehension_note    || '',
    appreciation:       snap.appreciation          || null,
    commentaireLibre:   snap.commentaire_libre     || '',
    autoEval:           autoEvalSnap?.auto_eval     || null,
    pointsRank:         snap.points_rank            || null,
    pointsRankOf:       snap.points_rank_of         || null,
    totalPoints:        snap.total_points           || 0,
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="detail-back" onClick={onBack}>← Retour</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{record.collaborateur}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{magasin} · Formation du {formatDate(record.week_date)}</div>
        </div>
      </div>

      {hasAE && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#1e293b', borderRadius: 12, padding: 4 }}>
          {[['retour', '📝 Retour formateur'], ['autoval', '🙋 Auto-évaluation']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: '9px 16px', borderRadius: 9, border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              background: tab === key ? '#0f172a' : 'transparent',
              color: tab === key ? '#f1f5f9' : '#64748b',
              transition: 'all .15s',
            }}>{label}</button>
          ))}
        </div>
      )}

      {tab === 'retour' ? (
        <CompteRenduManager data={reportData} />
      ) : (
        <div style={{ background: '#1e293b', borderRadius: 16, padding: '20px 22px', border: '1px solid #334155' }}>
          <AutoEvalReadOnly snap={autoEvalSnap} />
        </div>
      )}
    </div>
  )
}

// ── Historique : liste des formés d'un magasin ───────────────────

function HistoriqueCollabList({ records, magasin, autoEvals, onSelect, onBack }) {
  const sorted = [...records].sort((a, b) => (b.week_date || '').localeCompare(a.week_date || ''))
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="detail-back" onClick={onBack}>← Magasins</button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#f1f5f9' }}>{magasin}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{records.length} formé{records.length !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(r => {
          const appr    = r.stats_snapshot?.appreciation
          const apprMeta = HIST_APPR_META[appr]
          const hasAE   = !!autoEvals[r.collaborateur]?.auto_eval
          return (
            <button key={r.collaborateur + r.week_date} onClick={() => onSelect(r)} style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: 14,
              padding: '14px 18px', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 14, width: '100%', fontFamily: 'inherit',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#475569'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0f172a', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#94a3b8', flexShrink: 0 }}>
                {r.collaborateur?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{r.collaborateur}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>Formation du {formatDate(r.week_date)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                {apprMeta && <span style={{ fontSize: 11, fontWeight: 700, color: apprMeta.color }}>{apprMeta.label}</span>}
                {hasAE && <span style={{ fontSize: 10, color: '#94a3b8', background: '#0f172a', borderRadius: 8, padding: '2px 8px' }}>Auto-éval ✓</span>}
              </div>
              <span style={{ color: '#475569', fontSize: 18 }}>›</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Historique : vue principale ────────────────────────────────────

function HistoriqueView({ trainerName }) {
  const [loading, setLoading]                   = useState(true)
  const [records, setRecords]                   = useState([])   // plus récent par formé
  const [autoEvals, setAutoEvals]               = useState({})   // collab → snap
  const [search, setSearch]                     = useState('')
  const [selectedMagasin, setSelectedMagasin]   = useState(null)
  const [selectedRecord, setSelectedRecord]     = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [recs, evals] = await Promise.all([
          // Historique partagé entre formateurs : plus de filtre sur trainer_name
          sbSelect('formation_reports', `trainer_name=neq.__auto_eval__&order=updated_at.desc`),
          sbSelect('formation_reports', `trainer_name=eq.__auto_eval__&order=updated_at.desc`),
        ])
        // Regroupe par formé puis fusionne (mergeFormationReports) — sinon la
        // ligne la plus récente d'un formateur peut masquer les acquis notés
        // par un collègue sur d'autres thèmes
        const rowsByCollab = {}
        for (const r of (recs || [])) {
          (rowsByCollab[r.collaborateur] ||= []).push(r)
        }
        const mergedRecords = Object.values(rowsByCollab).map(rows => {
          const merged = mergeFormationReports(rows)
          return { ...merged.latestRow, stats_snapshot: merged.snapshot, trainer_name: merged.trainerName, week_date: merged.weekDate }
        })
        setRecords(mergedRecords)
        // Plus récent auto-eval par formé
        const em = {}
        for (const r of (evals || [])) if (!em[r.collaborateur]) em[r.collaborateur] = r.stats_snapshot
        setAutoEvals(em)
      } catch (e) { console.error('[Historique] load', e) }
      finally { setLoading(false) }
    }
    load()
  }, [trainerName])

  const byMagasin = useMemo(() => {
    const map = {}
    for (const r of records) {
      const raw = r.stats_snapshot?.magasin
      const m = raw ? canonicalMagasinLabel(raw) : 'Magasin non renseigné'
      if (!map[m]) map[m] = []
      map[m].push(r)
    }
    return map
  }, [records])

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return records.filter(r => r.collaborateur.toLowerCase().includes(q))
  }, [search, records])

  if (loading) return <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>Chargement de l'historique…</div>

  if (selectedRecord) {
    return <HistoriqueFiche record={selectedRecord} autoEvalSnap={autoEvals[selectedRecord.collaborateur]} onBack={() => setSelectedRecord(null)} />
  }

  if (selectedMagasin && !search) {
    return <HistoriqueCollabList records={byMagasin[selectedMagasin] || []} magasin={selectedMagasin} autoEvals={autoEvals} onSelect={r => setSelectedRecord(r)} onBack={() => setSelectedMagasin(null)} />
  }

  const magasins = Object.entries(byMagasin).sort((a, b) => b[1].length - a[1].length)

  return (
    <div>
      {/* Recherche */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un formé par nom ou prénom…"
          style={{ width: '100%', boxSizing: 'border-box', background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '12px 42px 12px 42px', fontSize: 14, color: '#f1f5f9', fontFamily: 'inherit', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#475569'}
          onBlur={e => e.target.style.borderColor = '#334155'}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
        )}
      </div>

      {search ? (
        /* Résultats de recherche */
        <div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
            {searchResults.length} résultat{searchResults.length !== 1 ? 's' : ''} pour « {search} »
          </div>
          {searchResults.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#475569', fontSize: 14 }}>Aucun formé trouvé.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {searchResults.map(r => {
                const apprMeta = HIST_APPR_META[r.stats_snapshot?.appreciation]
                return (
                  <button key={r.collaborateur} onClick={() => setSelectedRecord(r)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 14, padding: '14px 18px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14, width: '100%', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#475569'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#0f172a', border: '2px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#94a3b8', flexShrink: 0 }}>{r.collaborateur?.charAt(0)?.toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>{r.collaborateur}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{r.stats_snapshot?.magasin || '—'} · Formation du {formatDate(r.week_date)}</div>
                    </div>
                    {apprMeta && <span style={{ fontSize: 11, fontWeight: 700, color: apprMeta.color, flexShrink: 0 }}>{apprMeta.label}</span>}
                    <span style={{ color: '#475569', fontSize: 18 }}>›</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Grille des magasins */
        magasins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#475569', fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
            <div style={{ fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Aucun historique disponible</div>
            <div style={{ fontSize: 12 }}>Les retours de formation apparaîtront ici au fil des semaines.</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
              {records.length} formé{records.length !== 1 ? 's' : ''} · {magasins.length} magasin{magasins.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {magasins.map(([mag, collabs]) => (
                <button key={mag} onClick={() => setSelectedMagasin(mag)} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 16, padding: '18px 20px', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#475569'; e.currentTarget.style.background = '#243249' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.background = '#1e293b' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>🏪</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', marginBottom: 4, lineHeight: 1.3 }}>{mag}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{collabs.length} formé{collabs.length !== 1 ? 's' : ''}</div>
                </button>
              ))}
            </div>
          </>
        )
      )}
    </div>
  )
}

// ── Export principal ──────────────────────────────────────────────

export default function RetourFormationView({ onBack, pName }) {
  const [entrees, setEntrees]   = useState([])
  const [category, setCategory] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('semaine') // 'semaine' | 'historique'
  const trainerName = pName || 'Formateur'

  useEffect(() => {
    const load = async () => {
      try {
        const state = await getSharedState()
        const data = state?.entrees_data || JSON.parse(localStorage.getItem('entrees_data') || '[]')
        setEntrees(data)
      } catch {
        const data = JSON.parse(localStorage.getItem('entrees_data') || '[]')
        setEntrees(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div id="dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#0f172a' }}>
      {/* Header */}
      <div style={{
        padding: '18px 24px', background: '#1e293b',
        borderBottom: '1px solid #334155',
        display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      }}>
        {(tab === 'semaine' ? !category : true) && (
          <button className="detail-back" onClick={onBack}>← Tableau de bord</button>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>📝 Retour de formation</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            {tab === 'semaine' ? `Fiches de suivi · Semaine du ${getWeekDate()}` : 'Historique des formations'}
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', background: '#1e293b', borderBottom: '1px solid #334155', flexShrink: 0, padding: '0 24px' }}>
        {[['semaine', '📋 Semaine en cours'], ['historique', '📚 Historique']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); if (key === 'semaine') setCategory(null) }} style={{
            padding: '10px 20px', background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === key ? '#00abe9' : 'transparent'}`,
            color: tab === key ? '#00abe9' : '#64748b',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .15s',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px' }}>
        {tab === 'historique' ? (
          <HistoriqueView trainerName={trainerName} />
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', fontSize: 14 }}>Chargement…</div>
        ) : category ? (
          <CollabListView entrees={entrees} categoryKey={category} trainerName={trainerName} onBack={() => setCategory(null)} />
        ) : (
          <CategorySelector entrees={entrees} onSelect={setCategory} />
        )}
      </div>
    </div>
  )
}
