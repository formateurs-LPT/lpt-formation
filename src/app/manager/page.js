'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getManagerFromDB, getWeeklySharedState, sbSelect, pgInList } from '@/lib/supabase'
import { STORES, collaborateurFullName, tenureLabel } from '@/lib/storeFollowupData'
import { mergeEntreesIntoRoster } from '@/lib/storeRosterMerge'
import { matchMagasinKey } from '@/lib/managersData'
import { classifyMagasin } from '@/lib/formationCategories'
import { useStoreFollowupProgress } from '@/lib/useStoreFollowupProgress'
import { CollaborateurProfilePage, computeTeamGroups, pctFor, SECTION_COLORS_LIGHT } from '@/components/StoreFollowupShared'
import TrainingRegistrationTile, { UpcomingRegistrationsPanel } from '@/components/TrainingRegistrationTile'
import {
  getMagasinIdBySlug, getNouveauxCollaborateurs, getCollaborateursEnAttenteValidation,
  declencherTestSortie, validerNouvelEntrant, findCollaborateurByName, getOrCreateCollaborateurForEntree,
  getCollaborateurById, apiMarquerFormationTerminee,
} from '@/lib/collaborateursApi'
import { getReportingsHebdo, updateReportingStructure } from '@/lib/notesTerrainApi'
import DemandesInterventionView, { DemandeInterventionModal } from '@/components/DemandesInterventionView'
import ReportingDetailView from '@/components/ReportingDetailView'
import { isMagasinBelgique, BELGIQUE_ONLY_LOGINS, getNotificationsNonLues, marquerNotificationsLues } from '@/lib/directionApi'
import ManagerSidebar from '@/components/ManagerSidebar'
import { IconVideo, IconMapPin, IconChevronRight, IconClipboard } from '@/components/ManagerIcons'
import {
  apiGetEntretiensByMagasin, apiGetCandidatsByIds, apiAccepterEntretien,
  apiContreProposerEntretien, apiSupprimerEntretien, apiDeciderEntretien, apiNotifier,
} from '@/lib/rhApi'
import { getSignedUrl, RH_DOCUMENTS_BUCKET } from '@/lib/storageApi'

// Page autonome (comme /rapport, /bilan-formation) — aucune dépendance à
// page.js/Dashboard.js, donc aucun risque pour le flux formateur/participant/TV.
const SESSION_KEY = 'manager_session' // { login, magasin, displayName }

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: 12,
  background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
  borderRadius: 10, color: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none',
  transition: 'border-color .2s, background .2s',
}

function ManagerLogin({ onLogin }) {
  const [login, setLogin] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!login.trim() || !code.trim() || loading) return
    setLoading(true)
    setError('')
    const row = await getManagerFromDB(login.trim().toLowerCase(), code.trim())
    setLoading(false)
    if (!row) { setError('Identifiant ou code incorrect.'); return }
    const session = { login: row.login, magasin: row.magasin, displayName: row.display_name }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
    onLogin(session)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      background: 'linear-gradient(160deg,#0f1923 0%,#1a2535 60%,#00abe9 100%)',
    }}>
      <form onSubmit={submit} style={{
        background: 'linear-gradient(175deg,#0099d0 0%,#0d2538 42%,#091520 100%)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, width: '100%', maxWidth: 400,
        boxShadow: '0 28px 80px rgba(0,0,0,0.5)', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 220, height: 220, background: 'rgba(255,255,255,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 260, height: 260, background: 'rgba(0,171,233,0.08)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ padding: '36px 36px 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={140} height={52} style={{ objectFit: 'contain', margin: '0 auto 20px' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 }}>Suivi magasin</div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#fff' }}>Espace manager</h2>
        </div>

        <div style={{ padding: '4px 36px 36px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Connexion</div>
          <input
            value={login}
            onChange={e => setLogin(e.target.value)}
            placeholder="Identifiant"
            autoCapitalize="off"
            autoCorrect="off"
            style={inputStyle}
          />
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Code magasin"
            type="password"
            inputMode="numeric"
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '9px 12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{
            width: '100%', marginTop: 18, padding: '13px', border: 'none', borderRadius: 12,
            fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', color: '#fff',
            cursor: loading ? 'default' : 'pointer', transition: 'all .2s',
            background: loading ? 'rgba(255,255,255,0.15)' : 'linear-gradient(135deg, #0089ba, #00abe9)',
            boxShadow: loading ? 'none' : '0 6px 22px rgba(0,171,233,0.35)',
          }}>{loading ? 'Connexion…' : 'Se connecter →'}</button>
        </div>
      </form>
    </div>
  )
}

// Nouveaux entrants (entrees_data pour ce magasin) avec un lien direct vers
// leur compte rendu de formation déjà envoyé par mail — associés (si
// possible) au collaborateur du nouveau schéma relationnel pour pouvoir
// déclencher leur test de sortie. Un candidat sans rapport pas encore rempli
// est simplement omis, et un collaborateur déjà actif est filtré : cette
// liste n'a vocation qu'à alimenter la carte "À traiter" (ManagerDashboard).
function useNewHiresWithReport(store, entreesData, magasinId) {
  const [reports, setReports] = useState(null) // null = chargement
  const [matches, setMatches] = useState({}) // fullName -> collaborateur (schéma relationnel) | null

  const candidates = store ? (entreesData || []).filter(e => matchMagasinKey(e.magasin) === store.id) : []
  const fullNames = candidates.map(e => e.fullName || `${e.nom} ${e.prenom}`).filter(Boolean)
  const namesKey = fullNames.join('|')

  useEffect(() => {
    let cancelled = false
    if (!fullNames.length) { setReports({}); return }
    sbSelect('formation_reports', `collaborateur=in.(${pgInList(fullNames)})&order=updated_at.desc`).then(rows => {
      if (cancelled) return
      const byName = {}
      for (const r of (rows || [])) if (!byName[r.collaborateur]) byName[r.collaborateur] = r
      setReports(byName)
    }).catch(() => { if (!cancelled) setReports({}) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namesKey])

  // Relie chaque entrée au collaborateur du nouveau schéma relationnel (s'il
  // existe) pour pouvoir déclencher son test de sortie depuis cette tuile.
  useEffect(() => {
    let cancelled = false
    if (!magasinId || !candidates.length) return
    Promise.all(candidates.map(e => findCollaborateurByName(magasinId, e.prenom, e.nom))).then(results => {
      if (cancelled) return
      const byName = {}
      candidates.forEach((e, i) => { byName[e.fullName || `${e.nom} ${e.prenom}`] = results[i] })
      setMatches(byName)
    }).catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [magasinId, namesKey])

  if (reports === null) return []
  return candidates
    .map(e => ({
      entree: e,
      report: reports[e.fullName || `${e.nom} ${e.prenom}`],
      collab: matches[e.fullName || `${e.nom} ${e.prenom}`],
    }))
    .filter(x => x.report && x.collab?.statut !== 'actif')
}

// Ligne compacte réutilisée pour chaque élément de la carte "À traiter" —
// un seul gabarit visuel (icône + titre + méta + action) pour toutes les
// natures d'action (demande d'intervention, test de sortie…), afin d'éviter
// l'empilement de blocs de styles différents d'avant.
function ATraiterRow({ icon, title, meta, pending, actionLabel, onAction, onOpen }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 2px' }}>
      <div onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, cursor: onOpen ? 'pointer' : 'default' }}>
        <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#14161a' }}>{title}</div>
          {meta && <div style={{ fontSize: 11.5, color: '#9aa1ac', marginTop: 1 }}>{meta}</div>}
        </div>
      </div>
      {pending ? (
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#b45309', flexShrink: 0, whiteSpace: 'nowrap' }}>⏳ En cours</span>
      ) : onAction ? (
        <button onClick={onAction} style={{
          flexShrink: 0, whiteSpace: 'nowrap', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          fontSize: 12.5, fontWeight: 700, color: '#0089ba', padding: '6px 4px',
        }}>{actionLabel} →</button>
      ) : null}
    </div>
  )
}

// Carte "À faire" — ne regroupe plus que les tests de sortie à lancer (les
// demandes d'intervention ont leur propre écran dédié dans la sidebar,
// cf. DemandesPage). Invisible dès qu'il n'y a plus rien à traiter : l'app
// ne doit se faire remarquer que quand c'est utile.
function AFaireCard({ magasinId, store, nouveauxEntrants, newHireRows, onDeclencher, onOpenFiche }) {
  // Un candidat "ancien schéma" déjà présent côté nouveau schéma
  // (nouveauxEntrants) ne doit pas apparaître deux fois dans la liste. On
  // déduplique par id ET par nom : le lien entre les deux schémas
  // (findCollaborateurByName) se résout de façon asynchrone et arrive
  // souvent après que `nouveauxEntrants` soit déjà chargé — sans le repli
  // par nom, la même personne apparaît brièvement deux fois le temps que
  // l'id se résolve.
  const norm = (s) => (s || '').trim().toLowerCase()
  const nouveauIds = new Set(nouveauxEntrants.map(c => c.id))
  const nouveauNames = new Set(nouveauxEntrants.map(c => `${norm(c.prenom)}|${norm(c.nom)}`))
  const extraRows = newHireRows.filter(r => {
    if (r.collab && nouveauIds.has(r.collab.id)) return false
    if (nouveauNames.has(`${norm(r.entree.prenom)}|${norm(r.entree.nom)}`)) return false
    return true
  })

  const totalCount = nouveauxEntrants.length + extraRows.length
  if (totalCount === 0) return null

  const categoryKey = classifyMagasin(store.label)

  return (
    <div style={{
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
      padding: '14px 18px 4px', marginBottom: 24, boxShadow: '0 1px 2px rgba(16,24,40,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 2px 10px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#14161a', margin: 0, flex: 1 }}>À faire</h3>
        <span style={{
          background: '#f0f1f3', color: '#374151', fontSize: 11, fontWeight: 800,
          borderRadius: 20, padding: '2px 9px', minWidth: 18, textAlign: 'center',
        }}>{totalCount}</span>
      </div>

      {nouveauxEntrants.map(c => (
        <div key={c.id} style={{ borderTop: '1px solid #f0f1f3' }}>
          <ATraiterRow
            icon="🎓"
            title={`${c.prenom} ${c.nom}`}
            meta={c.poste}
            pending={!!c.test_declenche_at}
            actionLabel="Déclencher le test de sortie"
            onAction={() => onDeclencher(c.id)}
            onOpen={onOpenFiche ? () => onOpenFiche(c.id) : undefined}
          />
        </div>
      ))}

      {extraRows.map(({ entree, report, collab }) => (
        <div key={report.id} style={{ borderTop: '1px solid #f0f1f3' }}>
          <ATraiterRow
            icon="🆕"
            title={`${entree.prenom} ${entree.nom}`}
            meta={
              <a
                href={`/rapport/?c=${encodeURIComponent(report.collaborateur)}&w=${report.week_date}&t=${encodeURIComponent(report.trainer_name)}&cat=${categoryKey}`}
                target="_blank" rel="noopener noreferrer"
                style={{ color: '#0089ba', textDecoration: 'none' }}
              >Voir le compte rendu →</a>
            }
            pending={!!collab?.test_declenche_at}
            actionLabel="Lancer le test de sortie"
            onAction={async () => {
              const c = collab || await getOrCreateCollaborateurForEntree(magasinId, entree.prenom, entree.nom, entree.poste, entree.date_entree)
              if (c) onDeclencher(c.id, c)
            }}
          />
        </div>
      ))}
    </div>
  )
}

// Modale de validation — un nouvel entrant a fini son test, le manager doit
// accuser réception avant qu'il ne rejoigne officiellement l'équipe (statut
// 'actif'). Traite les collaborateurs en attente un par un.
function ValidationNouvelEntrantModal({ collaborateur, onValider }) {
  const [saving, setSaving] = useState(false)
  if (!collaborateur) return null

  const handleOk = async () => {
    setSaving(true)
    await onValider(collaborateur.id)
    setSaving(false)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 20,
        padding: '32px', width: '100%', maxWidth: 440, textAlign: 'center',
        boxShadow: '0 24px 60px rgba(16,24,40,0.2)',
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎉</div>
        <p style={{ fontSize: 15, color: '#14161a', lineHeight: 1.6, marginBottom: 24 }}>
          <strong>{collaborateur.prenom}</strong> vient de finir son test de fin de formation,
          il va être ajouté à la liste de vos collaborateurs.
        </p>
        <button onClick={handleOk} disabled={saving} style={{
          width: '100%', padding: '13px', borderRadius: 12, border: 'none',
          background: '#0089ba', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
          opacity: saving ? 0.6 : 1,
        }}>{saving ? '…' : 'OK'}</button>
      </div>
    </div>
  )
}

// Écran temporaire affiché après déclenchement du test — le test de sortie
// lui-même (contenu, quiz) sera construit dans un prochain script.
function TestEnCoursPage({ collaborateur, onBack }) {
  return (
    <div id="dashboard" className="manager-light-theme" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🚧</div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#14161a', marginBottom: 10 }}>Chantier en cours</h2>
        <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6, marginBottom: 28 }}>
          Le test de sortie de <strong>{collaborateur.prenom}</strong> arrive bientôt. Revenez un peu plus tard.
        </p>
        <button onClick={onBack} style={{
          background: '#fff', border: '1px solid #e5e7eb',
          color: '#374151', padding: '10px 22px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>← Retour</button>
      </div>
    </div>
  )
}

function fmtDateLongFr(isoDate) {
  if (!isoDate) return '—'
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Lecture seule — même requête réutilisable (getReportingsHebdo, filtrable
// par magasin_id) que celle prévue pour DR/directeur retail au script 5 ;
// rien de spécifique au rôle manager n'est codé ici.
function HistoriqueReportingsSection({ reportings, magasinNom }) {
  const [selected, setSelected] = useState(null)
  return (
    <div style={{ marginBottom: 28 }}>
      {reportings.length === 0 ? (
        <p style={{ color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Aucun reporting pour l&apos;instant.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reportings.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} style={{
              textAlign: 'left', background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#14161a' }}>
                Semaine du {fmtDateLongFr(r.semaine_debut)} au {fmtDateLongFr(r.semaine_fin)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11.5, color: '#9aa1ac' }}>{r.auteur}</span>
                <span className={`badge ${r.envoye_at ? 'ok' : 'pending'}`}>{r.envoye_at ? 'Envoyé' : 'Non envoyé'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <ReportingDetailView
          reporting={selected}
          magasinNom={magasinNom}
          onClose={() => setSelected(null)}
          canToggleDone
          onChange={async (next) => {
            setSelected(prev => prev ? { ...prev, contenu_structure: next } : prev)
            await updateReportingStructure(selected.id, next)
          }}
        />
      )}
    </div>
  )
}

function ProgressRing({ pct, size = 56, stroke = 5, color = '#0089ba' }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef0f2" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset .4s' }}
      />
    </svg>
  )
}

// Liste des formateurs éligibles pour une demande d'intervention — même
// logique (actifs, filtrés Belgique) que DemandesInterventionView, dupliquée
// ici en hook minimal pour piloter la modale de création depuis la tuile
// "Intervention terrain" de l'accueil, sans avoir à monter toute la vue
// liste+détail des demandes.
function useTrainerOptions(magasinId) {
  const [trainers, setTrainers] = useState([])
  const [isBelgique, setIsBelgique] = useState(false)

  useEffect(() => {
    if (!magasinId) return
    let cancelled = false
    sbSelect('trainers', 'select=id,login,display_name,active').then(rows => {
      if (!cancelled) setTrainers((rows || []).filter(t => t.active))
    }).catch(() => {})
    isMagasinBelgique(magasinId).then(v => { if (!cancelled) setIsBelgique(v) }).catch(() => {})
    return () => { cancelled = true }
  }, [magasinId])

  return trainers.filter(t => isBelgique ? BELGIQUE_ONLY_LOGINS.includes(t.login) : !BELGIQUE_ONLY_LOGINS.includes(t.login))
}

function StatCard({ icon, iconBg, iconColor, label, value, sub, onClick }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick} style={{
      flex: '1 1 220px', minWidth: 200, textAlign: 'left', fontFamily: 'inherit', cursor: onClick ? 'pointer' : 'default',
      background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '16px 18px',
      display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.03)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: iconBg, color: iconColor, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#14161a', lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#9aa1ac', marginTop: 2 }}>{sub}</div>}
      </div>
      {onClick && <IconChevronRight size={16} style={{ color: '#c7cbd1', flexShrink: 0 }} />}
    </Tag>
  )
}

// Tuile "Intervention terrain" — même modale de création que la Direction
// (DemandeInterventionModal), promue en action rapide de premier plan sur
// l'accueil manager plutôt que cachée dans l'écran Demandes.
function InterventionCTA({ magasinId, magasinNom, session, onCreated }) {
  const [open, setOpen] = useState(false)
  const trainers = useTrainerOptions(magasinId)

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        flex: '1 1 260px', minWidth: 240, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 20px',
        boxShadow: '0 1px 2px rgba(16,24,40,0.03)', display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconMapPin size={19} />
          </div>
          <IconChevronRight size={16} style={{ color: '#c7cbd1' }} />
        </div>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: '#14161a', marginBottom: 3 }}>Intervention terrain</div>
          <div style={{ fontSize: 12.5, color: '#9aa1ac', lineHeight: 1.4 }}>Demander l&apos;intervention d&apos;un formateur directement dans ton magasin.</div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
          background: '#7c3aed', color: '#fff', fontSize: 12.5, fontWeight: 700, padding: '8px 16px', borderRadius: 20,
        }}>Demander une intervention <span>→</span></div>
      </button>
      {open && (
        <DemandeInterventionModal
          magasinDbId={magasinId} magasinNom={magasinNom}
          formateurOptions={trainers}
          demandeurLogin={session.login} demandeurRole="manager"
          onClose={() => setOpen(false)}
          onCreated={onCreated}
        />
      )}
    </>
  )
}

// ── Écran d'accueil — reprend l'essentiel de l'ancienne page unique
// (stats, à faire, actions rapides, aperçu équipe) mais recomposé selon la
// maquette validée par Kevin : photo en vignette à côté de la salutation
// (plus de bannière pleine largeur), anneau de progression, deux tuiles
// d'action côte à côte, aperçu de l'équipe avec barre de progression.
function AccueilPage({
  store, session, progress, firstName, nouveauxEntrants, newHireRows, onDeclencher,
  magasinId, demandesCount, onRefreshDemandes, onNavigate, onOpenFiche,
}) {
  const [trainingRefreshKey, setTrainingRefreshKey] = useState(0)

  const allCollaborateurs = store.sections.flatMap(s => s.collaborateurs)
  const groups = computeTeamGroups(store)
  const breakdown = groups.map(g => `${g.collaborateurs.length} ${g.label}`).join(' · ')

  const pctValues = store.sections.flatMap(s => s.collaborateurs.map(c => pctFor(progress, c.id, s.id)))
  const avgPct = pctValues.length ? Math.round(pctValues.reduce((a, b) => a + b, 0) / pctValues.length) : 0

  return (
    <div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 24, minHeight: 118 }}>
        <div style={{ position: 'relative', zIndex: 1, flex: '0 1 380px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#14161a' }}>Bonjour {firstName} 👋</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>Voici l&apos;essentiel pour ton équipe de {store.label}.</p>
        </div>
        {store.photo && (
          <div style={{ position: 'relative', flex: '1 1 600px', minWidth: 320, height: 118, borderRadius: '0 16px 16px 0', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={store.photo} alt={`Magasin ${store.label}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 55%', display: 'block' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #f5f6f8 0%, rgba(245,246,248,0) 70%)' }} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <StatCard
          icon={<IconClipboard size={20} />} iconBg="#eaf3fd" iconColor="#0089ba"
          label="Collaborateurs" value={allCollaborateurs.length} sub={breakdown || 'aucune équipe'}
        />
        <div style={{
          flex: '1 1 220px', minWidth: 200, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
          padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.03)',
        }}>
          <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
            <ProgressRing pct={avgPct} size={52} stroke={5} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 800, color: '#14161a' }}>{avgPct}%</div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginBottom: 3 }}>Taux de maîtrise moyen</div>
            <div style={{ fontSize: 11.5, color: '#9aa1ac' }}>toutes équipes</div>
          </div>
        </div>
        <StatCard
          icon={<IconClipboard size={20} />} iconBg="#fee2e2" iconColor="#dc2626"
          label="Actions à traiter" value={demandesCount}
          sub={`demande${demandesCount > 1 ? 's' : ''} en attente`}
          onClick={demandesCount > 0 ? () => onNavigate('demandes') : undefined}
        />
      </div>

      <AFaireCard
        magasinId={magasinId} store={store}
        nouveauxEntrants={nouveauxEntrants} newHireRows={newHireRows}
        onDeclencher={onDeclencher} onOpenFiche={onOpenFiche}
      />

      <UpcomingRegistrationsPanel store={store} refreshKey={trainingRefreshKey} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
        <TrainingRegistrationTile
          store={store} session={session} variant="card"
          onRegistered={() => setTrainingRefreshKey(k => k + 1)}
        />
        <InterventionCTA magasinId={magasinId} magasinNom={store.label} session={session} onCreated={onRefreshDemandes} />
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#14161a', margin: 0 }}>Mon équipe</h3>
          <button onClick={() => onNavigate('equipe')} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12.5, fontWeight: 700, color: '#0089ba',
          }}>Voir toute l&apos;équipe →</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {groups.map(g => {
            const colors = SECTION_COLORS_LIGHT[g.id] || SECTION_COLORS_LIGHT['apprenti-alternant']
            const gPct = g.collaborateurs.length
              ? Math.round(g.collaborateurs.reduce((sum, c) => sum + pctFor(progress, c.id, c.__sectionId), 0) / g.collaborateurs.length)
              : 0
            return (
              <button key={g.id} onClick={() => onNavigate('equipe')} style={{
                flex: '1 1 220px', minWidth: 200, textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
                background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '16px 18px',
                boxShadow: '0 1px 2px rgba(16,24,40,0.03)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.solid, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a', flex: 1 }}>{g.label}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280' }}>{gPct}%</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#9aa1ac', marginBottom: 8 }}>{g.collaborateurs.length} collaborateur{g.collaborateurs.length > 1 ? 's' : ''}</div>
                <div style={{ height: 5, background: '#eef0f2', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${gPct}%`, background: '#0089ba', borderRadius: 3 }} />
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PageHeader({ title }) {
  return <h2 style={{ fontSize: 20, fontWeight: 800, color: '#14161a', margin: '0 0 20px' }}>{title}</h2>
}

function initialsFor(c) {
  const a = (c.prenom || '').trim().charAt(0)
  const b = (c.nom || '').trim().charAt(0)
  return (a + b).toUpperCase() || '?'
}

// Liste "Mon équipe" — pastilles CVO/MO-SAV/Apprentis (un seul groupe ouvert
// à la fois, façon accordéon) + recherche par nom, façon maquette. Chaque
// ligne mène à CollaborateurProfilePage (plus à l'ancienne checklist).
function EquipePage({ store, progress, onSelectCollaborateur }) {
  const groups = computeTeamGroups(store)
  const [activeGroupId, setActiveGroupId] = useState(groups[0]?.id || null)
  const [query, setQuery] = useState('')

  const totalCount = groups.reduce((sum, g) => sum + g.collaborateurs.length, 0)
  const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  const searching = query.trim().length > 0
  const searchResults = searching
    ? groups.flatMap(g => g.collaborateurs.filter(c => norm(collaborateurFullName(c)).includes(norm(query))))
    : []

  const Row = ({ c, first }) => {
    const pct = pctFor(progress, c.id, c.__sectionId)
    const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'
    return (
      <button onClick={() => onSelectCollaborateur(c.__sectionId, c.id)} style={{
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
        background: 'none', border: 'none', borderTop: first ? 'none' : '1px solid #f0f1f3', padding: '13px 4px',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', background: '#eef0f2', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#374151',
        }}>{initialsFor(c)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#14161a' }}>{collaborateurFullName(c)}</div>
          {c.entree && <div style={{ fontSize: 11.5, color: '#9aa1ac', marginTop: 1 }}>{tenureLabel(c.entree)} d&apos;ancienneté</div>}
        </div>
        <div style={{ width: 110, height: 6, background: '#eef0f2', borderRadius: 3, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
        </div>
        <div style={{ width: 34, textAlign: 'right', fontSize: 12.5, fontWeight: 700, color: '#14161a', flexShrink: 0 }}>{pct}%</div>
        <IconChevronRight size={15} style={{ color: '#c7cbd1', flexShrink: 0 }} />
      </button>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#14161a' }}>Mon équipe</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#9aa1ac' }}>{totalCount} collaborateur{totalCount > 1 ? 's' : ''} · {store.label}</p>
        </div>
        <input
          value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un collaborateur…"
          style={{
            minWidth: 220, padding: '9px 16px', borderRadius: 20, border: '1px solid #e5e7eb',
            background: '#fff', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#14161a',
          }}
        />
      </div>

      {searching ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '2px 20px', boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }}>
          {searchResults.length === 0 ? (
            <p style={{ color: '#9aa1ac', fontSize: 13, padding: '16px 4px' }}>Aucun résultat pour « {query} ».</p>
          ) : searchResults.map((c, i) => <Row key={c.id} c={c} first={i === 0} />)}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {groups.map(g => (
              <button key={g.id} onClick={() => setActiveGroupId(g.id)} style={{
                padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700,
                background: activeGroupId === g.id ? '#0089ba' : '#fff',
                color: activeGroupId === g.id ? '#fff' : '#14161a',
                border: activeGroupId === g.id ? 'none' : '1px solid #e5e7eb',
                boxShadow: activeGroupId === g.id ? 'none' : '0 1px 2px rgba(16,24,40,0.04)',
              }}>{g.label} <span style={{ opacity: 0.75 }}>{g.collaborateurs.length}</span></button>
            ))}
          </div>

          {groups.map(g => {
            const isOpen = g.id === activeGroupId
            return (
              <div key={g.id} style={{ marginBottom: 12 }}>
                {isOpen ? (
                  <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '2px 20px', boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }}>
                    {g.collaborateurs.map((c, i) => <Row key={c.id} c={c} first={i === 0} />)}
                  </div>
                ) : (
                  <button onClick={() => setActiveGroupId(g.id)} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
                    cursor: 'pointer', fontFamily: 'inherit', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '13px 18px',
                  }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#14161a' }}>{g.label} <span style={{ color: '#9aa1ac', fontWeight: 600 }}>{g.collaborateurs.length}</span></span>
                    <span style={{ fontSize: 13, color: '#9aa1ac' }}>⌄</span>
                  </button>
                )}
              </div>
            )
          })}
        </>
      )}
    </div>
  )
}

function DemandesPage({ magasinId, session, store }) {
  return (
    <div>
      <PageHeader title="Demandes" />
      <DemandesInterventionView
        magasinIds={[magasinId]} login={session.login} role="manager"
        canCreate magasinId={magasinId} magasinNom={store.label}
      />
    </div>
  )
}

// ── Recrutement (entretiens candidat ↔ manager) ──────────────────────────────
function fmtDateTimeMgr(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
const RCSS = {
  input: { width: '100%', boxSizing: 'border-box', padding: '10px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 8, color: '#1e293b', fontSize: 14, fontFamily: 'inherit', outline: 'none' },
  btn: { padding: '8px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, fontFamily: 'inherit' },
}

function CvSignedLinkMgr({ path, label = '📄 CV' }) {
  const [loading, setLoading] = useState(false)
  const open = async () => {
    setLoading(true)
    const url = await getSignedUrl(path, 3600, RH_DOCUMENTS_BUCKET)
    setLoading(false)
    if (url) window.open(url, '_blank')
  }
  return <button onClick={open} disabled={loading} style={{ ...RCSS.btn, background: '#f0f9ff', color: '#0089ba' }}>{loading ? '…' : label}</button>
}

function ContreProposerForm({ onSubmit, onCancel }) {
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('10:00')
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!date || !heure) return
    setSaving(true)
    await onSubmit(new Date(`${date}T${heure}:00`).toISOString(), commentaire)
    setSaving(false)
  }
  return (
    <div style={{ marginTop: 10, padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <input style={RCSS.input} type="date" value={date} onChange={e => setDate(e.target.value)} />
        <input style={RCSS.input} type="time" value={heure} onChange={e => setHeure(e.target.value)} />
      </div>
      <textarea style={{ ...RCSS.input, height: 60, resize: 'vertical', marginBottom: 8 }} placeholder="Commentaire (optionnel)" value={commentaire} onChange={e => setCommentaire(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ ...RCSS.btn, background: '#f1f5f9', color: '#475569' }}>Annuler</button>
        <button onClick={submit} disabled={saving} style={{ ...RCSS.btn, background: saving ? '#94a3b8' : 'linear-gradient(135deg,#0089ba,#00abe9)', color: '#fff' }}>{saving ? '…' : 'Proposer ce créneau'}</button>
      </div>
    </div>
  )
}

function EntretienCard({ entretien, candidat, onChanged }) {
  const [showContrer, setShowContrer] = useState(false)
  const [note, setNote] = useState(entretien.note_entretien || '')
  const [busy, setBusy] = useState(false)

  const accepter = async () => {
    setBusy(true)
    await apiAccepterEntretien(entretien.id)
    await apiNotifier(entretien.demandeur_login, 'entretien_accepte', entretien.id)
    setBusy(false); onChanged()
  }
  const contreProposer = async (dateHeure, commentaire) => {
    await apiContreProposerEntretien(entretien.id, { dateHeureContreProposee: dateHeure, commentaireManager: commentaire })
    await apiNotifier(entretien.demandeur_login, 'entretien_contre_proposition', entretien.id)
    setShowContrer(false); onChanged()
  }
  const supprimer = async () => {
    if (!window.confirm("Supprimer cette demande d'entretien ?")) return
    setBusy(true)
    const etaitNonTraitee = entretien.statut === 'en_attente'
    await apiSupprimerEntretien(entretien.id)
    if (etaitNonTraitee) await apiNotifier(entretien.demandeur_login, 'entretien_supprime_manager', entretien.candidat_id)
    setBusy(false); onChanged()
  }
  const decider = async decisionCandidat => {
    setBusy(true)
    await apiDeciderEntretien(entretien.id, { noteEntretien: note, decisionCandidat })
    await apiNotifier(entretien.demandeur_login, decisionCandidat === 'accepte' ? 'candidat_accepte_manager' : 'candidat_refuse_manager', entretien.candidat_id)
    setBusy(false); onChanged()
  }

  const decision = entretien.decision_candidat

  return (
    <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 14.5 }}>{candidat?.prenom} {candidat?.nom}</div>
          <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>{candidat?.poste_vise || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {candidat?.cv_url && <CvSignedLinkMgr path={candidat.cv_url} label="📄 CV" />}
          {candidat?.lettre_motivation_url && <CvSignedLinkMgr path={candidat.lettre_motivation_url} label="✉️ Lettre" />}
          <button onClick={supprimer} disabled={busy} title="Supprimer la demande" style={{ ...RCSS.btn, background: 'none', color: '#94a3b8', border: '1px solid #e2e8f0' }}>🗑️</button>
        </div>
      </div>

      {decision === 'accepte' ? (
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#166534' }}>
          ✓ Vous avez accepté ce candidat le {fmtDateTimeMgr(entretien.decision_at)}
          {entretien.note_entretien && <div style={{ marginTop: 4, fontStyle: 'italic' }}>« {entretien.note_entretien} »</div>}
        </div>
      ) : decision === 'refuse' ? (
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 13, color: '#b91c1c' }}>
          ✕ Vous avez refusé ce candidat le {fmtDateTimeMgr(entretien.decision_at)}
          {entretien.note_entretien && <div style={{ marginTop: 4, fontStyle: 'italic' }}>« {entretien.note_entretien} »</div>}
        </div>
      ) : entretien.statut === 'en_attente' ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: '#475569' }}>Créneau proposé : <strong>{fmtDateTimeMgr(entretien.date_heure_proposee)}</strong></div>
          {!showContrer ? (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={accepter} disabled={busy} style={{ ...RCSS.btn, background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff' }}>Accepter</button>
              <button onClick={() => setShowContrer(true)} disabled={busy} style={{ ...RCSS.btn, background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>Proposer un autre créneau</button>
            </div>
          ) : (
            <ContreProposerForm onSubmit={contreProposer} onCancel={() => setShowContrer(false)} />
          )}
        </div>
      ) : entretien.statut === 'contre_proposition_en_attente' ? (
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 13, color: '#9a3412' }}>
          Créneau alternatif proposé le {fmtDateTimeMgr(entretien.date_heure_contre_proposee)} — en attente de confirmation RH.
        </div>
      ) : (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>Entretien confirmé le <strong>{fmtDateTimeMgr(entretien.date_heure_proposee)}</strong></div>
          <textarea style={{ ...RCSS.input, height: 70, resize: 'vertical', marginBottom: 8 }} placeholder="Note d'entretien…" value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => decider('accepte')} disabled={busy} style={{ ...RCSS.btn, background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff' }}>Accepter le candidat</button>
            <button onClick={() => decider('refuse')} disabled={busy} style={{ ...RCSS.btn, background: '#fef2f2', color: '#ef4444' }}>Refuser le candidat</button>
          </div>
        </div>
      )}
    </div>
  )
}

function RecrutementPage({ magasinId, onRefresh }) {
  const [entretiens, setEntretiens] = useState([])
  const [candidatsById, setCandidatsById] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const rows = await apiGetEntretiensByMagasin(magasinId)
    const candidats = await apiGetCandidatsByIds([...new Set(rows.map(r => r.candidat_id))])
    setCandidatsById(Object.fromEntries((candidats || []).map(c => [c.id, c])))
    setEntretiens(rows)
    setLoading(false)
  }, [magasinId])

  useEffect(() => { if (magasinId) load() }, [magasinId, load])

  const handleChanged = () => { load(); onRefresh?.() }

  return (
    <div>
      <PageHeader title="Recrutement" />
      {loading ? <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>Chargement…</div> :
       !entretiens.length ? (
        <div style={{ textAlign: 'center', padding: '56px 24px', background: '#fff', borderRadius: 14, border: '1.5px solid #e2e8f0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>Aucune demande d&apos;entretien</div>
        </div>
       ) : entretiens.map(e => (
        <EntretienCard key={e.id} entretien={e} candidat={candidatsById[e.candidat_id]} onChanged={handleChanged} />
      ))}
    </div>
  )
}

function ReportingPage({ reportings, magasinNom }) {
  return (
    <div>
      <PageHeader title="Reporting" />
      <HistoriqueReportingsSection reportings={reportings} magasinNom={magasinNom} />
    </div>
  )
}

// Fiche minimale d'un collaborateur de la table relationnelle `collaborateurs`
// — distincte de CollaborateurProfilePage (qui affiche le roster STORES codé
// en dur, sans lien fiable avec cette table). Ouverte depuis une notification
// (ex. fin de période d'essai) qui référence un id de cette table.
function CollaborateurDbFicheModal({ collaborateurId, onClose }) {
  const [collab, setCollab] = useState(undefined) // undefined = chargement, null = introuvable
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getCollaborateurById(collaborateurId).then(c => { if (!cancelled) setCollab(c) })
    return () => { cancelled = true }
  }, [collaborateurId])

  const finEssai = collab?.date_entree ? new Date(collab.date_entree) : null
  if (finEssai) finEssai.setMonth(finEssai.getMonth() + 2)

  const toggleFormationTerminee = async () => {
    setSaving(true)
    const valeur = !collab.formation_terminee
    await apiMarquerFormationTerminee(collab.id, valeur)
    setCollab({ ...collab, formation_terminee: valeur })
    setSaving(false)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,25,35,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#0f172a' }}>Fiche collaborateur</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94a3b8', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 24 }}>
          {collab === undefined ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>Chargement…</div>
          ) : collab === null ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>Collaborateur introuvable.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{collab.prenom} {collab.nom}</div>
              <div style={{ fontSize: 13.5, color: '#64748b' }}>{collab.poste || 'Poste non renseigné'}</div>
              {collab.date_entree && (
                <div style={{ fontSize: 13, color: '#374151', marginTop: 6 }}>
                  Entrée le {new Date(collab.date_entree + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {finEssai && <> — fin de période d&apos;essai le <strong>{finEssai.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>}
                </div>
              )}
              <div style={{ marginTop: 8, paddingTop: 14, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                  {collab.formation_terminee
                    ? '✓ Formation marquée comme terminée — dashboard complet débloqué.'
                    : "En attente de fin de formation (mode restreint : dossier RH + fiche accès). En attendant le vrai test de sortie, tu peux forcer le déblocage ici."}
                </div>
                <button
                  onClick={toggleFormationTerminee}
                  disabled={saving}
                  style={{
                    padding: '9px 16px', borderRadius: 8, border: 'none', cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
                    fontSize: 13, fontWeight: 700, color: '#fff',
                    background: saving ? '#94a3b8' : (collab.formation_terminee ? 'rgba(239,68,68,0.08)' : 'linear-gradient(135deg,#16a34a,#22c55e)'),
                    ...(collab.formation_terminee ? { color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)' } : {}),
                  }}
                >
                  {saving ? '…' : collab.formation_terminee ? 'Repasser en mode restreint' : 'Marquer la formation comme terminée'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ManagerDashboard({ session, onLogout }) {
  const [entreesData, setEntreesData] = useState([])
  const [activeNav, setActiveNav] = useState('accueil')
  const [sectionId, setSectionId] = useState(null)
  const [collaborateurId, setCollaborateurId] = useState(null)
  const [magasinId, setMagasinId] = useState(null)
  const [nouveauxEntrants, setNouveauxEntrants] = useState([])
  const [enAttenteValidation, setEnAttenteValidation] = useState([])
  const [testEnCoursCollab, setTestEnCoursCollab] = useState(null)
  const [reportings, setReportings] = useState([])
  const [demandesCount, setDemandesCount] = useState(0)
  const [recrutementCount, setRecrutementCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [ficheCollaborateurId, setFicheCollaborateurId] = useState(null)

  // Centre de notifications générique (table `notifications`, déjà utilisée
  // ailleurs) — pour l'instant seul le type 'fin_periode_essai' est enrichi
  // avec un libellé lisible ; les autres types s'affichent en repli minimal.
  const refreshNotifications = async (login) => {
    const rows = await getNotificationsNonLues(login)
    const essaiIds = rows.filter(n => n.type === 'fin_periode_essai').map(n => n.reference_id).filter(Boolean)
    const collabs = essaiIds.length ? await sbSelect('collaborateurs', `id=in.(${essaiIds.join(',')})&select=id,prenom,nom,poste,date_entree`) : []
    const collabById = Object.fromEntries((collabs || []).map(c => [c.id, c]))
    setNotifications(rows.map(n => {
      if (n.type === 'fin_periode_essai') {
        const c = collabById[n.reference_id]
        const fin = c?.date_entree ? new Date(c.date_entree) : null
        if (fin) fin.setMonth(fin.getMonth() + 2)
        const dateLabel = fin ? fin.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '—'
        return {
          id: n.id, collaborateurId: n.reference_id,
          label: c ? `${c.prenom} ${c.nom} arrive en fin de période d'essai le ${dateLabel} — pense à faire le point.` : "Fin de période d'essai à venir",
        }
      }
      return { id: n.id, collaborateurId: null, label: `Notification (${n.type})` }
    }))
  }

  const handleSelectNotification = async (n) => {
    setNotifications(prev => prev.filter(x => x.id !== n.id))
    await marquerNotificationsLues([n.id])
    if (n.collaborateurId) setFicheCollaborateurId(n.collaborateurId)
  }

  useEffect(() => {
    refreshNotifications(session.login)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.login])

  useEffect(() => {
    let cancelled = false
    getWeeklySharedState().then(state => {
      if (!cancelled) setEntreesData(state?.entrees_data || [])
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const refreshNouvelEntrant = async (id) => {
    const [nouveaux, attente] = await Promise.all([
      getNouveauxCollaborateurs(id),
      getCollaborateursEnAttenteValidation(id),
    ])
    setNouveauxEntrants(nouveaux)
    setEnAttenteValidation(attente)
  }

  // Compteur des demandes ouvertes/en cours — remonté ici car partagé entre
  // le badge de la sidebar et la statistique "Actions à traiter" de
  // l'accueil ; `refreshDemandes` est aussi appelé après la création d'une
  // demande depuis la tuile "Intervention terrain".
  const refreshDemandes = async (id) => {
    const rows = await sbSelect('demandes_intervention', `magasin_id=eq.${id}&statut=in.(ouverte,en_cours)&select=id`)
    setDemandesCount(rows?.length || 0)
  }

  // Badge "Recrutement" : demandes d'entretien qui attendent une réponse du
  // manager (les autres statuts n'attendent rien de sa part pour l'instant).
  const refreshRecrutement = async (id) => {
    const rows = await sbSelect('entretiens_recrutement', `magasin_id=eq.${id}&statut=eq.en_attente&select=id`)
    setRecrutementCount(rows?.length || 0)
  }

  useEffect(() => {
    let cancelled = false
    getMagasinIdBySlug(session.magasin).then(id => {
      if (cancelled || !id) return
      setMagasinId(id)
      refreshNouvelEntrant(id)
      refreshDemandes(id)
      refreshRecrutement(id)
      getReportingsHebdo(id).then(r => { if (!cancelled) setReportings(r) })
    }).catch(() => {})
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.magasin])

  const handleDeclencherTest = async (collabId, collabHint) => {
    await declencherTestSortie(collabId)
    const collab = collabHint || nouveauxEntrants.find(c => c.id === collabId)
    setTestEnCoursCollab(collab || null)
    if (magasinId) refreshNouvelEntrant(magasinId)
  }

  const handleValiderEntrant = async (collabId) => {
    await validerNouvelEntrant(collabId)
    if (magasinId) refreshNouvelEntrant(magasinId)
  }

  const { progress, saveError } = useStoreFollowupProgress(session.magasin, session.displayName)

  // Calculés avant tout retour anticipé : useNewHiresWithReport est un hook,
  // il doit s'exécuter à chaque rendu dans le même ordre (store peut être
  // null tant que le magasin n'est pas résolu, géré à l'intérieur du hook).
  const baseStore = STORES.find(s => s.id === session.magasin)
  const store = baseStore ? mergeEntreesIntoRoster(baseStore, entreesData) : null
  const newHireRows = useNewHiresWithReport(store, entreesData, magasinId)

  if (testEnCoursCollab) {
    return <TestEnCoursPage collaborateur={testEnCoursCollab} onBack={() => setTestEnCoursCollab(null)} />
  }

  if (!baseStore) {
    return (
      <div id="dashboard" className="manager-light-theme">
        <div className="dash-wrap">
          <p style={{ color: '#dc2626' }}>Magasin introuvable ({session.magasin}). Contactez votre formateur.</p>
          <button
            onClick={onLogout}
            style={{ marginTop: 12, padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit', background: '#0089ba', color: '#fff' }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    )
  }

  const firstName = (session.displayName || '').split(' ')[0]
  const section = store.sections.find(s => s.id === sectionId) || null
  const collaborateur = section?.collaborateurs.find(c => c.id === collaborateurId) || null
  const showFiche = activeNav === 'equipe' && collaborateur && section

  return (
    <div id="dashboard" className="manager-light-theme">
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <ManagerSidebar
          active={activeNav}
          onNavigate={(id) => { setActiveNav(id); setCollaborateurId(null) }}
          demandesCount={demandesCount}
          recrutementCount={recrutementCount}
          notifications={notifications}
          onSelectNotification={handleSelectNotification}
          firstName={firstName}
          storeLabel={store.label}
          onLogout={onLogout}
        />

        <div style={{ flex: 1, minWidth: 0, padding: '28px 36px 60px', maxWidth: 1120 }}>
          {saveError && (
            <div style={{
              position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 999,
              background: '#dc2626', color: '#fff', padding: '10px 20px', borderRadius: 12,
              fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}>
              ⚠️ Échec de la sauvegarde — la table Supabase existe-t-elle ? Ce changement n&apos;est pas enregistré.
            </div>
          )}

          {showFiche ? (
            <CollaborateurProfilePage
              store={store}
              sectionId={sectionId}
              collaborateur={collaborateur}
              progress={progress}
              session={session}
              onBack={() => setCollaborateurId(null)}
            />
          ) : activeNav === 'equipe' ? (
            <EquipePage
              store={store}
              progress={progress}
              onSelectCollaborateur={(secId, collabId) => { setSectionId(secId); setCollaborateurId(collabId) }}
            />
          ) : activeNav === 'demandes' ? (
            <DemandesPage magasinId={magasinId} session={session} store={store} />
          ) : activeNav === 'recrutement' ? (
            <RecrutementPage magasinId={magasinId} onRefresh={() => refreshRecrutement(magasinId)} />
          ) : activeNav === 'reporting' ? (
            <ReportingPage reportings={reportings} magasinNom={store.label} />
          ) : (
            <AccueilPage
              store={store}
              session={session}
              progress={progress}
              firstName={firstName}
              nouveauxEntrants={nouveauxEntrants}
              newHireRows={newHireRows}
              onDeclencher={handleDeclencherTest}
              magasinId={magasinId}
              demandesCount={demandesCount}
              onRefreshDemandes={() => magasinId && refreshDemandes(magasinId)}
              onNavigate={setActiveNav}
              onOpenFiche={setFicheCollaborateurId}
            />
          )}
        </div>
      </div>

      {enAttenteValidation.length > 0 && (
        <ValidationNouvelEntrantModal collaborateur={enAttenteValidation[0]} onValider={handleValiderEntrant} />
      )}
      {ficheCollaborateurId && (
        <CollaborateurDbFicheModal collaborateurId={ficheCollaborateurId} onClose={() => setFicheCollaborateurId(null)} />
      )}
    </div>
  )
}

export default function ManagerPage() {
  const [session, setSession] = useState(undefined) // undefined = pas encore lu, null = pas connecté

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      setSession(raw ? JSON.parse(raw) : null)
    } catch { setSession(null) }
  }, [])

  if (session === undefined) return null
  if (!session) return <ManagerLogin onLogin={setSession} />
  return <ManagerDashboard session={session} onLogout={() => { try { localStorage.removeItem(SESSION_KEY) } catch {}; setSession(null) }} />
}
