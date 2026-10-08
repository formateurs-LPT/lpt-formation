'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import {
  STATUS_META, SCORE_ORDER, SCORE_LABELS, scoreToStatus, collaborateurFullName,
  formatDateFr, tenureLabel, teamAge, TEAM_LABELS, ITEM_GUIDES, getSkillItems, isBelgiqueStore,
} from '@/lib/storeFollowupData'
import { sbSelect } from '@/lib/supabase'
import { TRAINING_THEMES } from '@/lib/trainingSlots'
import OrdonnanceExercise from './OrdonnanceExercise'
import CollaborateurNotesSection from './CollaborateurNotesSection'
import { RegistrationModal } from './TrainingRegistrationTile'

function trainingThemeLabel(id) {
  return TRAINING_THEMES.find(t => t.id === id)?.label || id
}

// UI partagée entre la vue formateur (StoreFollowupView) et la vue manager
// (/manager) — un seul et même rendu du suivi de compétences, quel que soit
// le rôle qui l'utilise. Le sélecteur multi-magasins (StoreGrid) reste lui
// dans StoreFollowupView.js : un manager n'a aucun chemin de code vers les
// autres magasins que le sien.

// Couleurs alignées sur le logiciel de planning (CVO vert, MO rouge, SAV
// jaune/orange) — adaptées en tons pastel/sourds pour rester lisibles sur
// fond sombre. Une entrée par sectionId utilisé dans storeFollowupData.js
// (tous magasins confondus, y compris le lot 1) pour que le code couleur
// soit homogène partout — plus aucune section ne doit retomber sur le vert
// CVO par défaut faute d'entrée dédiée.
// `text` = couleur solide utilisable comme `color` CSS (titres, libellés) —
// distincte de `bar`, qui peut être un dégradé (valide en `background`, pas
// en `color` : un texte avec `color: linear-gradient(...)` ne s'affiche pas,
// il retombe sur le noir par défaut, invisible sur fond sombre).
export const SECTION_COLORS = {
  cvo: {
    bar: '#6fcf8e',
    text: '#6fcf8e',
    bg: 'rgba(111,207,142,0.07)',
    border: 'rgba(111,207,142,0.28)',
    hoverBorder: 'rgba(111,207,142,0.55)',
  },
  'mo-sav': {
    bar: 'linear-gradient(180deg, #e8756b, #f0a758)',
    text: '#f87171',
    bg: 'linear-gradient(135deg, rgba(232,117,107,0.08), rgba(240,167,88,0.08))',
    border: 'rgba(232,117,107,0.28)',
    hoverBorder: 'rgba(240,167,88,0.55)',
  },
  mo: {
    bar: '#e8756b',
    text: '#e8756b',
    bg: 'rgba(232,117,107,0.07)',
    border: 'rgba(232,117,107,0.28)',
    hoverBorder: 'rgba(232,117,107,0.55)',
  },
  sav: {
    bar: '#f0a758',
    text: '#f0a758',
    bg: 'rgba(240,167,88,0.07)',
    border: 'rgba(240,167,88,0.28)',
    hoverBorder: 'rgba(240,167,88,0.55)',
  },
  opto: {
    bar: '#00abe9',
    text: '#00abe9',
    bg: 'rgba(0,171,233,0.07)',
    border: 'rgba(0,171,233,0.28)',
    hoverBorder: 'rgba(0,171,233,0.55)',
  },
  // Référence unique pour "Apprentis" — reprise à l'identique par
  // CollaborateurCard pour les alternants marqués `c.alternant` (Bayonne)
  // et par les sections `apprenti-alternant` (lot 1), pour un rendu homogène.
  'apprenti-alternant': {
    bar: '#a78bfa',
    text: '#a78bfa',
    bg: 'rgba(167,139,250,0.07)',
    border: 'rgba(167,139,250,0.28)',
    hoverBorder: 'rgba(167,139,250,0.55)',
  },
  manager: {
    bar: '#fbbf24',
    text: '#fbbf24',
    bg: 'rgba(251,191,36,0.07)',
    border: 'rgba(251,191,36,0.28)',
    hoverBorder: 'rgba(251,191,36,0.55)',
  },
  referent: {
    bar: '#22d3ee',
    text: '#22d3ee',
    bg: 'rgba(34,211,238,0.07)',
    border: 'rgba(34,211,238,0.28)',
    hoverBorder: 'rgba(34,211,238,0.55)',
  },
  'monteur-prog': {
    bar: '#f59e0b',
    text: '#f59e0b',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.28)',
    hoverBorder: 'rgba(245,158,11,0.55)',
  },
  'operateur-prog': {
    bar: '#14b8a6',
    text: '#14b8a6',
    bg: 'rgba(20,184,166,0.07)',
    border: 'rgba(20,184,166,0.28)',
    hoverBorder: 'rgba(20,184,166,0.55)',
  },
  autre: {
    bar: '#94a3b8',
    text: '#94a3b8',
    bg: 'rgba(148,163,184,0.07)',
    border: 'rgba(148,163,184,0.28)',
    hoverBorder: 'rgba(148,163,184,0.55)',
  },
  'non-renseigne': {
    bar: '#64748b',
    text: '#64748b',
    bg: 'rgba(100,116,139,0.06)',
    border: 'rgba(100,116,139,0.22)',
    hoverBorder: 'rgba(100,116,139,0.4)',
  },
  labo: {
    bar: '#a78bfa',
    text: '#a78bfa',
    bg: 'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.28)',
    hoverBorder: 'rgba(167,139,250,0.55)',
  },
}

// Même code couleur par métier que SECTION_COLORS, mais recalibré pour un
// fond clair (dashboard manager, DA alignée sur SUPER10 Academy) : textes
// plus saturés/foncés pour rester lisibles sur blanc, `solid` ajouté pour
// les avatars ronds (texte blanc dessus, donc besoin d'un aplat franc plutôt
// que d'une teinte pastel).
export const SECTION_COLORS_LIGHT = {
  cvo: { text: '#16a34a', solid: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.25)', hoverBorder: 'rgba(34,197,94,0.5)' },
  'mo-sav': { text: '#dc2626', solid: '#ef4444', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.22)', hoverBorder: 'rgba(239,68,68,0.45)' },
  mo: { text: '#dc2626', solid: '#ef4444', bg: 'rgba(239,68,68,0.07)', border: 'rgba(239,68,68,0.22)', hoverBorder: 'rgba(239,68,68,0.45)' },
  sav: { text: '#d97706', solid: '#f59e0b', bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', hoverBorder: 'rgba(217,119,6,0.5)' },
  opto: { text: '#0284c7', solid: '#0ea5e9', bg: 'rgba(2,132,199,0.08)', border: 'rgba(2,132,199,0.25)', hoverBorder: 'rgba(2,132,199,0.5)' },
  'apprenti-alternant': { text: '#7c3aed', solid: '#8b5cf6', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', hoverBorder: 'rgba(124,58,237,0.5)' },
  manager: { text: '#b45309', solid: '#f59e0b', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.3)', hoverBorder: 'rgba(251,191,36,0.55)' },
  referent: { text: '#0891b2', solid: '#22d3ee', bg: 'rgba(34,211,238,0.08)', border: 'rgba(34,211,238,0.25)', hoverBorder: 'rgba(34,211,238,0.5)' },
  'monteur-prog': { text: '#b45309', solid: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', hoverBorder: 'rgba(245,158,11,0.5)' },
  'operateur-prog': { text: '#0d9488', solid: '#14b8a6', bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.25)', hoverBorder: 'rgba(20,184,166,0.5)' },
  autre: { text: '#64748b', solid: '#94a3b8', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.22)', hoverBorder: 'rgba(100,116,139,0.4)' },
  'non-renseigne': { text: '#64748b', solid: '#94a3b8', bg: 'rgba(100,116,139,0.06)', border: 'rgba(100,116,139,0.18)', hoverBorder: 'rgba(100,116,139,0.35)' },
  labo: { text: '#7c3aed', solid: '#8b5cf6', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.25)', hoverBorder: 'rgba(124,58,237,0.5)' },
}

// Moyenne des notes (/5) sur tous les items d'une section, notes manquantes
// comptées à 0 — distingue "pas encore audité" (0%) de "en cours partout"
// (progression visible), contrairement à un simple % d'items acquis.
// Extrait en fonction partagée pour que la carte collaborateur ET la
// statistique d'en-tête (taux de maîtrise moyen) utilisent exactement le
// même calcul, sans jamais pouvoir diverger.
export function pctFor(progress, collabId, sectionId, isBelgique = false) {
  const items = getSkillItems(sectionId, isBelgique)
  if (!items.length) return 0
  const total = items.reduce((sum, it) => sum + (progress[`${collabId}:${it.id}`]?.score || 0), 0)
  return Math.round((total / (items.length * 5)) * 100)
}

function initials(c) {
  const a = (c.prenom || '').trim().charAt(0)
  const b = (c.nom || '').trim().charAt(0)
  return (a + b).toUpperCase() || '?'
}

// ── En-tête magasin partagé : photo + nom + 3 statistiques ──────────
// Utilisé à l'identique par la vue formateur (StoreDetail) et la vue manager
// (/manager) pour garantir la même charte visuelle. `subtitle` et `right`
// permettent à chaque page d'injecter son propre contenu (salutation,
// bouton déconnexion, consigne...) sans dupliquer la structure commune.
// `hero` (utilisé uniquement par le dashboard manager) remplace la petite
// vignette par une bannière pleine largeur avec la photo en fond — le
// formateur/direction gardent le format compact d'origine par défaut.
export function StoreHeader({ store, progress, subtitle, right, hero = false }) {
  const allCollaborateurs = store.sections.flatMap(s => s.collaborateurs)
  const totalHeadcount = allCollaborateurs.length

  const isBelgique = isBelgiqueStore(store.id)
  const pctValues = store.sections.flatMap(s => s.collaborateurs.map(c => pctFor(progress, c.id, s.id, isBelgique)))
  const avgPct = pctValues.length ? Math.round(pctValues.reduce((a, b) => a + b, 0) / pctValues.length) : 0

  const age = teamAge(allCollaborateurs)

  const stats = [
    { icon: '👥', label: 'Effectif total', value: `${totalHeadcount}`, sub: totalHeadcount > 1 ? 'collaborateurs' : 'collaborateur' },
    { icon: '🎯', label: 'Taux de maîtrise moyen', value: `${avgPct}%`, sub: 'toutes équipes' },
    { icon: age?.icon || '📅', label: 'Ancienneté moyenne', value: age ? age.avgLabel : '—', sub: age ? age.label : 'non renseignée' },
  ]

  return (
    <div style={{ marginBottom: 28 }}>
      {hero && store.photo ? (
        <div style={{
          position: 'relative', height: 208, borderRadius: 20, overflow: 'hidden',
          marginBottom: 20, boxShadow: '0 10px 30px rgba(16,24,40,0.14)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={store.photo} alt={`Magasin ${store.label}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 35%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(10,14,20,0.93) 0%, rgba(10,14,20,0.5) 48%, rgba(10,14,20,0.05) 100%)',
          }} />
          {right && <div style={{ position: 'absolute', top: 18, right: 18 }}>{right}</div>}
          <div style={{ position: 'absolute', left: 26, right: 26, bottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 27, fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>
              {store.label}
            </h2>
            {subtitle && <p style={{ margin: '5px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{subtitle}</p>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {store.photo && (
              <div style={{
                flexShrink: 0, width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
                border: '1.5px solid var(--dh-photo-border)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.photo} alt={`Magasin ${store.label}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
              </div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: 'var(--dh-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🏬</span> {store.label}
              </h2>
              {subtitle && <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--dh-subtitle)' }}>{subtitle}</p>}
            </div>
          </div>
          {right}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            flex: '1 1 180px', minWidth: 160,
            background: 'var(--dh-stat-bg)',
            border: '1px solid var(--dh-stat-border)', borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, background: 'var(--dh-icon-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
              }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--dh-text-soft)', lineHeight: 1.3 }}>{s.label}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--dh-text)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--dh-text-faint)', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BackBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--dh-btn-bg)', border: '1px solid var(--dh-btn-border)',
      color: 'var(--dh-btn-text)', padding: '8px 16px', borderRadius: 10,
      fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20,
    }}>{children}</button>
  )
}

// Indicateur pour formateurs/responsables : âge moyen d'une équipe
// (ancienneté moyenne), affiché en haut à droite de la page magasin.
export function TeamAgeBadge({ sectionId, collaborateurs }) {
  const age = teamAge(collaborateurs)
  if (!age) return null
  return (
    <div style={{
      background: `${age.color}12`, border: `1px solid ${age.color}45`,
      borderRadius: 14, padding: '10px 16px', minWidth: 168,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
        {TEAM_LABELS[sectionId] || sectionId}
      </div>
      <div style={{ fontSize: 13, fontWeight: 800, color: age.color, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{age.icon}</span> {age.label}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>Ancienneté moy. {age.avgLabel}</div>
    </div>
  )
}

// Tuile collaborateur (avatar + nom + contrat/ancienneté + barre de
// progression) — utilisée à la fois dans les sections CVO/MO-SAV normales
// et dans le groupe "Apprentis" à part, d'où l'usage explicite de
// sectionId plutôt que de le déduire d'un contexte de section.
function CollaborateurCard({ c, sectionId, colors, progress, onSelectCollaborateur, completed, isBelgique = false }) {
  const pct = pctFor(progress, c.id, sectionId, isBelgique)
  const alt = c.alternant
  const apprentiColors = SECTION_COLORS['apprenti-alternant']
  const border = alt ? apprentiColors.border : colors.border
  const hoverBorder = alt ? apprentiColors.hoverBorder : colors.hoverBorder
  return (
    <button
      onClick={() => onSelectCollaborateur(sectionId, c.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.03)', border: `1px solid ${border}`,
        borderRadius: 14, padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
        flex: '1 1 260px', minWidth: 240, maxWidth: 340, textAlign: 'left', transition: 'all .18s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = hoverBorder; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = border; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
    >
      <div style={{
        flexShrink: 0, width: 40, height: 40, borderRadius: '50%',
        background: alt ? apprentiColors.bg : 'rgba(255,255,255,0.06)',
        border: `1.5px solid ${hoverBorder}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color: '#fff',
      }}>{initials(c)}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {collaborateurFullName(c)}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {c.contrat}{c.entree && ` · ${tenureLabel(c.entree)} d'ancienneté`}
        </div>
        {completed && (
          <div style={{ fontSize: 10, color: '#4ade80', marginBottom: 6, lineHeight: 1.4 }}>
            ✅ {trainingThemeLabel(completed.theme)} · {formatDateFr(completed.session_date)}
            {completed.score != null && ` · ${Math.round(completed.score / 5 * 100)}%`}
          </div>
        )}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: alt ? apprentiColors.bar : colors.bar, transition: 'width .3s' }} />
        </div>
      </div>

      <div style={{ flexShrink: 0, fontSize: 13, fontWeight: 800, color: '#fff', minWidth: 34, textAlign: 'right' }}>
        {pct}%
      </div>
    </button>
  )
}

// Grille des sections (CVO / MO-SAV) + tuiles collaborateurs avec barre de
// progression — le cœur réutilisable, indépendant du header qui l'entoure
// (le formateur et le manager ont chacun leur propre header). Les
// apprentis/alternants sont sortis de leur section d'origine et regroupés
// sous un titre "Apprentis" à part, pour bien les distinguer visuellement —
// leur sectionId réel (cvo/mo-sav) est conservé pour la fiche détail
// (compétences affichées) et le calcul de progression.
export function SectionsList({ store, progress, onSelectCollaborateur }) {
  const isBelgique = isBelgiqueStore(store.id)
  const apprentis = store.sections.flatMap(section =>
    (section.collaborateurs || [])
      .filter(c => c.alternant)
      .map(c => ({ collaborateur: c, sectionId: section.id }))
  )

  // Dernière formation visio complémentaire clôturée par collaborateur —
  // affichée comme historique sur sa tuile (une seule requête pour tout le
  // magasin, indépendante du reste du suivi de compétences).
  const [completedByCollab, setCompletedByCollab] = useState({})
  useEffect(() => {
    let cancelled = false
    sbSelect('training_registrations', `magasin=eq.${encodeURIComponent(store.id)}&completed_at=not.is.null&order=completed_at.desc`)
      .then(rows => {
        if (cancelled) return
        const map = {}
        for (const r of (rows || [])) {
          if (!map[r.collaborateur_id]) map[r.collaborateur_id] = r
        }
        setCompletedByCollab(map)
      }).catch(() => {})
    return () => { cancelled = true }
  }, [store.id])

  return (
    <>
      {store.sections.map(section => {
        const colors = SECTION_COLORS[section.id] || SECTION_COLORS.cvo
        const collaborateurs = (section.collaborateurs || []).filter(c => !c.alternant)
        // Section entièrement composée d'apprentis : déjà affichée plus bas.
        if (section.collaborateurs.length > 0 && collaborateurs.length === 0) return null
        const isEmpty = collaborateurs.length === 0
        return (
          <div key={section.id} style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {section.label} · {section.sub}
            </h3>
            {isEmpty ? (
              <div style={{
                border: '1.5px dashed rgba(255,255,255,0.12)', borderRadius: 14, padding: '18px 20px',
                fontSize: 13, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic',
              }}>
                Aucun collaborateur dans cette équipe pour le moment.
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {collaborateurs.map(c => (
                  <CollaborateurCard
                    key={c.id} c={c} sectionId={section.id} colors={colors}
                    progress={progress} onSelectCollaborateur={onSelectCollaborateur}
                    completed={completedByCollab[c.id]} isBelgique={isBelgique}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {apprentis.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: SECTION_COLORS['apprenti-alternant'].text, margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Apprentis
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {apprentis.map(({ collaborateur, sectionId }) => (
              <CollaborateurCard
                key={collaborateur.id} c={collaborateur} sectionId={sectionId}
                colors={SECTION_COLORS[sectionId] || SECTION_COLORS.cvo}
                progress={progress} onSelectCollaborateur={onSelectCollaborateur}
                completed={completedByCollab[collaborateur.id]} isBelgique={isBelgique}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// Regroupement "Apprentis à part" (alternant) partagé entre SectionsList
// (formateur), ManagerTeamView et la page d'accueil manager (aperçu +
// répartition par équipe) — un seul endroit qui décide qui va dans quel
// groupe, pour que les effectifs affichés ne puissent jamais diverger.
export function computeTeamGroups(store) {
  const apprentis = store.sections.flatMap(section =>
    (section.collaborateurs || [])
      .filter(c => c.alternant)
      .map(c => ({ ...c, __sectionId: section.id }))
  )

  const groups = []
  for (const section of store.sections) {
    const collaborateurs = (section.collaborateurs || []).filter(c => !c.alternant)
    if (!collaborateurs.length) continue
    groups.push({ id: section.id, label: section.label, collaborateurs: collaborateurs.map(c => ({ ...c, __sectionId: section.id })) })
  }
  if (apprentis.length) groups.push({ id: 'apprentis', label: 'Apprentis', collaborateurs: apprentis })
  return groups
}

// ── Vue manager simplifiée : tuiles par équipe → liste de prénoms ──────
// Contrairement à SectionsList (formateur), pas de taux de maîtrise, pas de
// badge formation complémentaire sur cette vue — juste de quoi identifier
// rapidement qui est dans quelle équipe et ouvrir sa fiche. Même
// regroupement "Apprentis à part" (alternant) que SectionsList, pour rester
// cohérent visuellement avec la vue formateur.
export function ManagerTeamView({ store, onSelectCollaborateur }) {
  const [activeGroup, setActiveGroup] = useState(null)
  const groups = computeTeamGroups(store)

  if (!groups.length) {
    return <p style={{ color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Aucun collaborateur pour ce magasin.</p>
  }

  // Palette volontairement en retrait : un métier se reconnaît à un simple
  // point de couleur (comme un tag), jamais à toute une carte teintée — sur
  // fond clair, une carte pleinement colorée par section "flashe" et nuit au
  // rendu sobre/pro recherché pour ce dashboard.
  if (activeGroup) {
    const colors = SECTION_COLORS_LIGHT[activeGroup.id] || SECTION_COLORS_LIGHT['apprenti-alternant']
    return (
      <div>
        <BackBtn onClick={() => setActiveGroup(null)}>← Équipes</BackBtn>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.solid, flexShrink: 0 }} />
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#14161a', margin: 0 }}>{activeGroup.label}</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {activeGroup.collaborateurs.map(c => (
            <button
              key={c.id}
              onClick={() => onSelectCollaborateur(c.__sectionId, c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: '#fff', border: '1px solid #e5e7eb',
                borderRadius: 14, padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
                flex: '1 1 220px', minWidth: 200, maxWidth: 300, textAlign: 'left', transition: 'all .15s',
                boxShadow: '0 1px 2px rgba(16,24,40,0.03)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7cbd1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,24,40,0.07)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(16,24,40,0.03)' }}
            >
              <div style={{
                flexShrink: 0, width: 38, height: 38, borderRadius: '50%',
                background: '#eef0f2',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800, color: '#374151',
              }}>{(c.prenom || '?').charAt(0).toUpperCase()}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#14161a' }}>{c.prenom}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {groups.map(g => {
        const colors = SECTION_COLORS_LIGHT[g.id] || SECTION_COLORS_LIGHT['apprenti-alternant']
        return (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g)}
            style={{
              flex: '1 1 200px', minWidth: 180, maxWidth: 260, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
              background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 20px',
              boxShadow: '0 1px 2px rgba(16,24,40,0.03)', transition: 'all .15s',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c7cbd1'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(16,24,40,0.08)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(16,24,40,0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: colors.solid, flexShrink: 0 }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: '#14161a' }}>{g.label}</div>
              </div>
              <div style={{ fontSize: 12, color: '#9aa1ac' }}>{g.collaborateurs.length} collaborateur{g.collaborateurs.length > 1 ? 's' : ''}</div>
            </div>
            <span style={{ fontSize: 16, color: '#c7cbd1' }}>›</span>
          </button>
        )
      })}
    </div>
  )
}

function scoreColor(pct) {
  if (pct >= 70) return '#22c55e'
  if (pct >= 40) return '#f59e0b'
  return '#ef4444'
}

function masteryTier(pct) {
  if (pct >= 70) return { label: 'Bonne progression', bg: '#dcfce7', color: '#15803d' }
  if (pct >= 40) return { label: 'Progression en cours', bg: '#fef3c7', color: '#b45309' }
  return { label: 'Démarrage', bg: '#f3f4f6', color: '#4b5563' }
}

const THEME_EMOJI = { 'tiers-payant': '💳', 'verres-progressifs': '👓', 'prises-mesures': '📏' }

export function MasteryRing({ pct, size = 74, stroke = 7, color = '#0089ba' }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(100, Math.max(0, pct)) / 100) * circumference
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#eef0f2" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
      />
    </svg>
  )
}

// ── Page profil manager — remplace la fiche "checklist à cocher" (celle-ci
// reste utilisée telle quelle par le formateur/direction via CollaborateurFiche,
// dont ni le code ni le rôle qu'il joue ailleurs ne sont touchés) par une
// vraie présentation lisible pour un manager : anneau de maîtrise globale,
// compétences réelles (mêmes données que la checklist, juste présentées en
// barres) et parcours de formation basé sur les inscriptions
// `training_registrations` réellement terminées — aucune donnée inventée.
export function CollaborateurProfilePage({ store, sectionId, collaborateur, progress, session, onBack, role = 'manager' }) {
  const [trainingRows, setTrainingRows] = useState(null)
  const [formModalOpen, setFormModalOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    sbSelect('training_registrations', `collaborateur_id=eq.${collaborateur.id}&completed_at=not.is.null&order=completed_at.desc`)
      .then(rows => { if (!cancelled) setTrainingRows(rows || []) })
      .catch(() => { if (!cancelled) setTrainingRows([]) })
    return () => { cancelled = true }
  }, [collaborateur.id])

  const items = getSkillItems(sectionId, isBelgiqueStore(store.id))
  const categories = {}
  for (const it of items) {
    if (!categories[it.category]) categories[it.category] = []
    categories[it.category].push(it)
  }
  const acquisCount = items.filter(it => progress[`${collaborateur.id}:${it.id}`]?.status === 'acquis').length
  const avgPct = items.length
    ? Math.round((items.reduce((sum, it) => sum + (progress[`${collaborateur.id}:${it.id}`]?.score || 0), 0) / (items.length * 5)) * 100)
    : 0
  const tier = masteryTier(avgPct)
  const sectionColors = SECTION_COLORS_LIGHT[sectionId] || SECTION_COLORS_LIGHT['apprenti-alternant']
  const sectionLabel = store.sections.find(s => s.id === sectionId)?.label || ''

  return (
    <div>
      <BackBtn onClick={onBack}>← Mon équipe</BackBtn>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: sectionColors.solid, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 25, fontWeight: 800, color: '#fff',
          }}>{initials(collaborateur)}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: sectionColors.text, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{sectionLabel}</div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#14161a' }}>{collaborateurFullName(collaborateur)}</h1>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Magasin de {store.label}</div>
          </div>
        </div>
        <button onClick={() => setFormModalOpen(true)} style={{
          background: '#0089ba', color: '#fff', border: 'none', borderRadius: 20, padding: '11px 20px',
          fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>Former ce collaborateur →</button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 22, fontSize: 12.5, color: '#6b7280' }}>
        {collaborateur.entree && (
          <>
            <span>🕐 {tenureLabel(collaborateur.entree)} d&apos;ancienneté</span>
            <span>Entrée le {formatDateFr(collaborateur.entree)}</span>
          </>
        )}
        {collaborateur.contrat && <span>{collaborateur.contrat}</span>}
        <span>📍 {store.label}</span>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap',
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px 22px', marginBottom: 28,
        boxShadow: '0 1px 2px rgba(16,24,40,0.03)',
      }}>
        <div style={{ position: 'relative', width: 74, height: 74, flexShrink: 0 }}>
          <MasteryRing pct={avgPct} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800, color: '#14161a' }}>{avgPct}%</div>
        </div>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#14161a', marginBottom: 3 }}>Taux de maîtrise global</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
            ↗ +{avgPct} pts <span style={{ color: '#9aa1ac', fontWeight: 500 }}>depuis son arrivée</span>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', background: tier.bg, color: tier.color, borderRadius: 12, padding: '10px 18px' }}>
          <div style={{ fontSize: 12.5, fontWeight: 700 }}>{tier.label}</div>
          <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, opacity: 0.85 }}>{acquisCount}/{items.length} compétences acquises</div>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#14161a', margin: '0 0 14px' }}>Compétences</h3>
        {Object.entries(categories).map(([category, catItems]) => (
          <div key={category} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9aa1ac', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>{category}</div>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '4px 20px', boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }}>
              {catItems.map((item, i) => {
                const score = progress[`${collaborateur.id}:${item.id}`]?.score || 0
                const pct = Math.round((score / 5) * 100)
                const color = scoreColor(pct)
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
                    borderTop: i > 0 ? '1px solid #f0f1f3' : 'none',
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <div className="skill-row-label" style={{ fontSize: 13.5, fontWeight: 600, color: '#14161a', width: 200, flexShrink: 0 }}>{item.label}</div>
                    <div style={{ flex: 1, height: 6, background: '#eef0f2', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: '#14161a', width: 36, textAlign: 'right', flexShrink: 0 }}>{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: '#14161a', margin: '0 0 16px' }}>Parcours de formation</h3>
        {trainingRows === null ? (
          <p style={{ color: '#9aa1ac', fontSize: 13 }}>Chargement…</p>
        ) : trainingRows.length === 0 ? (
          <p style={{ color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Aucune formation complémentaire terminée pour l&apos;instant.</p>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '4px 20px', boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }}>
            {trainingRows.map((r, i) => (
              <div key={r.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0',
                borderTop: i > 0 ? '1px solid #f0f1f3' : 'none',
              }}>
                <div style={{ fontSize: 11.5, color: '#9aa1ac', width: 96, flexShrink: 0 }}>{formatDateFr((r.completed_at || '').slice(0, 10))}</div>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: '#eaf3fd', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{THEME_EMOJI[r.theme] || '🎓'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: '#14161a' }}>{trainingThemeLabel(r.theme)}</div>
                </div>
                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 11px', flexShrink: 0 }}>Terminée</span>
                {r.score != null && <span style={{ fontSize: 12.5, fontWeight: 700, color: '#14161a', width: 36, textAlign: 'right', flexShrink: 0 }}>{Math.round((r.score / 5) * 100)}%</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <CollaborateurNotesSection store={store} collaborateur={collaborateur} pName={session?.displayName} role={role} />

      {formModalOpen && (
        <RegistrationModal
          store={store}
          session={session}
          preselectedIds={[collaborateur.id]}
          onClose={() => setFormModalOpen(false)}
          onRegistered={() => {}}
        />
      )}
    </div>
  )
}

// Bannière dédiée au Laboratoire Progressif (annexe Paris Châtelet, pas un
// magasin de vente) — reprend le traitement "photo plein cadre assombrie +
// dégradé" déjà utilisé pour ce même labo sur le diffuseur TV (module
// Présentation entreprise), pour une DA plus moderne qu'une simple carte.
function LaboProgressifBanner({ store }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', height: 320, borderRadius: 24,
      marginBottom: 28, border: '1px solid rgba(167,139,250,0.25)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
    }}>
      {store.photo && (
        <Image
          src={store.photo} alt={store.label} fill priority
          style={{ objectFit: 'cover', objectPosition: 'center 40%', filter: 'brightness(0.45) saturate(1.1)' }}
        />
      )}
      {/* Dégradé de lisibilité, du bas (opaque) vers le haut (transparent) */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(8,6,15,0.97) 0%, rgba(8,6,15,0.65) 45%, rgba(20,10,35,0.15) 100%)',
      }} />
      {/* Halo violet en haut à gauche, pour rappeler l'accent du reste de l'app */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(circle at 12% 0%, rgba(124,58,237,0.35), transparent 55%)',
      }} />
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 40px 32px' }}>
        <div style={{ width: 44, height: 4, borderRadius: 2, marginBottom: 18, background: 'linear-gradient(90deg, #1e3a8a 0%, #1e3a8a 33%, #fff 33%, #fff 66%, #dc2626 66%)' }} />
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          background: 'rgba(124,58,237,0.22)', border: '1px solid rgba(167,139,250,0.5)',
          borderRadius: 20, padding: '5px 18px', marginBottom: 14,
          fontSize: 11, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 2,
        }}>
          Annexe · {store.annexeDe || 'Paris Châtelet'}
        </div>
        <h2 style={{ fontSize: 34, fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.1 }}>
          {store.label}
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0, maxWidth: 520 }}>
          Fabrication interne des verres progressifs — OFG le jour même pour Paris, 24/48h pour le reste de la France et la Belgique.
        </p>
      </div>
    </div>
  )
}

// Couleurs formateur — mêmes valeurs que Planning déplacements
// (src/components/PlanningPage.js), pour reconnaître un formateur d'un coup
// d'œil quel que soit l'écran où on le croise.
const LABO_TRAINER_COLORS = { Kevin: '#00abe9', Quentin: '#7c3aed', Nadège: '#db2777', Thomas: '#f59e0b', Valentine: '#22c55e', Matteo: '#fb923c', Jonathan: '#14b8a6' }
function laboTrainerColor(name) { return LABO_TRAINER_COLORS[name] || '#64748b' }

function laboFmtDateShort(d) {
  if (!d) return '—'
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

const LABO_STATUS_COLS = [
  { key: 'active',   label: 'En cours', color: '#4ade80' },
  { key: 'upcoming', label: 'Prévu',    color: '#00abe9' },
  { key: 'done',     label: 'Passé',    color: 'rgba(255,255,255,0.4)' },
]

// Tuile "Formateurs sur site" — même logique de statut que Planning
// déplacements (src/components/PlanningPage.js), mais filtrée sur ce seul
// magasin/annexe et condensée en 3 colonnes, pour rester lisible imbriquée
// dans la fiche Suivi magasin plutôt que dans l'écran plein page dédié.
function LaboPlanningTile({ magasin }) {
  const [deployments, setDeployments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    sbSelect('planning_deployments', `store=eq.${encodeURIComponent(magasin)}&order=start_date.desc`)
      .then(rows => { if (!cancelled) { setDeployments(rows || []); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [magasin])

  const today = new Date().toISOString().slice(0, 10)
  const statusOf = (dep) => (dep.end_date < today ? 'done' : dep.start_date > today ? 'upcoming' : 'active')

  const groups = { active: [], upcoming: [], done: [] }
  for (const dep of deployments) groups[statusOf(dep)].push(dep)

  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: '#fff', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        👷 Formateurs sur site
      </h3>
      {loading ? (
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Chargement…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {LABO_STATUS_COLS.map(col => (
            <div key={col.key} style={{
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>{col.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: col.color }}>{groups[col.key].length}</span>
              </div>
              {groups[col.key].length === 0 ? (
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>Aucun</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {groups[col.key].map(dep => {
                    const c = laboTrainerColor(dep.trainer)
                    return (
                      <div key={dep.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5,
                        borderLeft: `3px solid ${c}`, paddingLeft: 8,
                      }}>
                        <span style={{ fontWeight: 700, color: c }}>{dep.trainer}</span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                          {laboFmtDateShort(dep.start_date)} → {laboFmtDateShort(dep.end_date)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Écran 2 : détail d'un magasin (sections + collaborateurs) — formateur ──
// `onOpenMesRetours` est optionnel et n'est fourni que par la vue formateur
// (StoreFollowupView.js) — la vue manager (app/manager/page.js) ne le passe
// pas, donc rien ne change pour elle (script 3, étape 2.1 : ajout sans
// toucher au reste de la page).
export function StoreDetail({ store, progress, onSelectCollaborateur, onBack, onOpenMesRetours }) {
  const isLabo = store.id === 'laboratoire-progressif'
  return (
    <div className="dash-wrap">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <BackBtn onClick={onBack}>← Tous les magasins</BackBtn>
        {onOpenMesRetours && (
          <button onClick={onOpenMesRetours} style={{
            background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.3)',
            color: '#00abe9', padding: '8px 16px', borderRadius: 10, fontSize: 12.5,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>📓 Mes retours</button>
        )}
      </div>

      {isLabo ? (
        <>
          <LaboProgressifBanner store={store} />
          <LaboPlanningTile magasin={store.label} />
        </>
      ) : (
        <StoreHeader store={store} progress={progress} subtitle="Sélectionnez un collaborateur pour voir sa fiche de suivi" />
      )}

      <SectionsList store={store} progress={progress} onSelectCollaborateur={onSelectCollaborateur} />
    </div>
  )
}

// ── Écran 3 : fiche d'un collaborateur ──────────────────────────────
// Fenêtre "trame d'audit" — question à poser / consigne pour l'item, avec
// les réponses attendues quand il y en a (offres, verres, traitements…).
export function GuideModal({ item, guide, onClose }) {
  // guide.steps (trame d'accueil) : le collaborateur remplit sa réponse
  // point par point (texte libre, non enregistré — sert uniquement le temps
  // de la correction). Aucun bouton de réponse visible pendant la saisie —
  // il faut valider d'abord (pour éviter la tentation de regarder avant
  // d'avoir répondu), la trame ne se révèle qu'ensuite, sur clic du
  // formateur/manager, pour corriger à l'oral avec le collaborateur.
  const [answers, setAnswers] = useState({})
  const [validated, setValidated] = useState(false)
  const [revealed, setRevealed] = useState(false)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '28px 32px', width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            📋 Trame d&apos;audit
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', textTransform: 'none', letterSpacing: 0, marginTop: 4 }}>{item.label}</div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, flexShrink: 0,
          }}>✕</button>
        </div>

        {guide ? (
          <>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 20 }}>
              {guide.instruction}
            </p>

            {/* Questions à poser à l'oral par le manager/formateur — le
                contenu qui suit (sections/optionGroups) sert de référence
                pour corriger les réponses du collaborateur. */}
            {guide.questions && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                  🗣️ Questions à poser
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {guide.questions.map((q, i) => (
                    <div key={i} style={{
                      background: 'rgba(0,171,233,0.06)', border: '1px solid rgba(0,171,233,0.2)',
                      borderRadius: 10, padding: '9px 14px', fontSize: 13, color: '#fff', lineHeight: 1.5,
                    }}>{q}</div>
                  ))}
                </div>
              </div>
            )}

            {/* Script séquentiel (ex: Trame d'accueil) — le collaborateur
                répond point par point, sans pouvoir consulter la réponse
                avant d'avoir validé (pas de bouton de révélation visible
                pendant la saisie). */}
            {guide.steps && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                  {guide.steps.map(s => (
                    <div key={s.num} style={{
                      background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}40`,
                      borderLeft: `3px solid ${s.color}`, borderRadius: 12, padding: '12px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{s.emoji}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', flex: 1 }}>Point {s.num}</span>
                      </div>
                      <textarea
                        value={answers[s.num] || ''}
                        onChange={e => setAnswers(a => ({ ...a, [s.num]: e.target.value }))}
                        placeholder="Ce que répond le collaborateur…"
                        rows={2}
                        disabled={validated}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: validated ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px',
                          color: validated ? 'rgba(255,255,255,0.6)' : '#fff', fontSize: 13,
                          fontFamily: 'inherit', resize: 'vertical', outline: 'none',
                        }}
                      />
                      {revealed && (
                        <div style={{
                          fontSize: 13, color: '#4ade80', lineHeight: 1.5, marginTop: 8,
                          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                          borderRadius: 8, padding: '8px 12px',
                        }}>✅ {s.text}</div>
                      )}
                    </div>
                  ))}
                </div>

                {!validated && (
                  <button
                    onClick={() => setValidated(true)}
                    style={{
                      width: '100%', padding: '11px', background: '#00abe9', border: 'none', color: '#fff',
                      borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      marginBottom: 20,
                    }}
                  >Valider</button>
                )}
                {validated && !revealed && (
                  <button
                    onClick={() => setRevealed(true)}
                    style={{
                      width: '100%', padding: '11px', background: 'rgba(34,197,94,0.15)',
                      border: '1px solid rgba(34,197,94,0.5)', color: '#4ade80',
                      borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      marginBottom: 20,
                    }}
                  >👁 Voir les réponses</button>
                )}
              </>
            )}

            {/* Blocs par catégorie (ex: les 4 offres, les 3 matériaux) — contenu réel du module */}
            {guide.sections && guide.sections.map(section => (
              <div key={section.label} style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'inline-block', fontSize: 12, fontWeight: 800, color: section.color,
                  background: `${section.color}18`, border: `1px solid ${section.color}45`,
                  borderRadius: 8, padding: '3px 10px', marginBottom: 8,
                }}>{section.label}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {section.bullets.map((b, i) => (
                    <div key={i} style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: `3px solid ${section.color}`, borderRadius: 10, padding: '9px 14px',
                      fontSize: 13, color: '#fff', lineHeight: 1.5,
                    }}>{b}</div>
                  ))}
                </div>
              </div>
            ))}

            {/* Pastilles simples (quand il n'y a pas encore de vrai contenu module) */}
            {guide.options && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {guide.options.map(o => (
                  <span key={o} style={{
                    background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.3)',
                    borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#7dd3fc',
                  }}>{o}</span>
                ))}
              </div>
            )}
            {guide.optionGroups && guide.optionGroups.map(group => (
              <div key={group.label} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{group.label}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {group.options.map(o => (
                    <span key={o} style={{
                      background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.3)',
                      borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 600, color: '#7dd3fc',
                    }}>{o}</span>
                  ))}
                </div>
              </div>
            ))}

            {guide.missingNote && (
              <div style={{
                marginTop: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: 10, padding: '10px 14px', fontSize: 12, color: '#fbbf24', lineHeight: 1.5,
              }}>
                ⚠️ {guide.missingNote}
              </div>
            )}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic', margin: 0 }}>
            Trame pas encore rédigée pour cet item.
          </p>
        )}
      </div>
    </div>
  )
}

// Confirmation avant une action irréversible (reset d'un item).
export function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
          padding: '24px 28px', width: '100%', maxWidth: 400,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{title}</div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, marginBottom: 20 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: 10,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Annuler</button>
          <button onClick={onConfirm} style={{
            background: 'rgba(220,38,38,0.15)', border: '1px solid #dc2626',
            color: '#f87171', padding: '8px 16px', borderRadius: 10,
            fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>Réinitialiser</button>
        </div>
      </div>
    </div>
  )
}

// Sélecteur de note 1-5 : la note pilote le statut, on ne peut plus le
// changer directement (évite un "Acquis" cliqué sans avoir vraiment évalué).
export function ScorePicker({ score, onSetScore }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const status = scoreToStatus(score)
  const meta = status ? STATUS_META[status] : null

  useEffect(() => {
    if (!open) return
    const onDocClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: meta ? meta.bg : 'rgba(255,255,255,0.06)',
          border: `1.5px solid ${meta ? meta.color : 'rgba(255,255,255,0.18)'}`,
          color: meta ? meta.color : 'rgba(255,255,255,0.4)',
          borderRadius: 20, padding: '6px 16px', fontSize: 12, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit', minWidth: 130,
        }}
      >{meta ? `${meta.label} · ${score}/5` : 'Non évalué'}</button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', right: 0, zIndex: 50, minWidth: 260,
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12,
          padding: 8, display: 'flex', flexDirection: 'column', gap: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
        }}>
          {SCORE_ORDER.map(n => {
            const m = STATUS_META[scoreToStatus(n)]
            const selected = score === n
            return (
              <button
                key={n}
                onClick={() => { onSetScore(n); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                  background: selected ? `${m.color}22` : 'transparent',
                  border: `1px solid ${selected ? m.color : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 8, padding: '7px 10px', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontWeight: 800, color: m.color, fontSize: 13, width: 14, flexShrink: 0 }}>{n}</span>
                <span style={{ fontSize: 12, color: '#fff' }}>{SCORE_LABELS[n]}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function ItemRow({ item, entry, pastEntries, onSetScore, onSaveNote, onReset, readOnly = false }) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [draftNote, setDraftNote] = useState(entry?.note || '')

  // Vue manager : ni exercice, ni notation, ni historique modifiable — juste
  // le statut de l'item et la note existante en lecture seule. Le manager
  // n'a pas vocation à mener l'audit lui-même (c'est le rôle du formateur).
  if (readOnly) {
    const meta = STATUS_META[scoreToStatus(entry?.score)]
    return (
      <div style={{
        background: 'var(--dh-row-bg)', border: '1px solid var(--dh-row-border)', borderRadius: 12,
        padding: '12px 16px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, color: 'var(--dh-text)', fontWeight: 600 }}>{item.label}</span>
          {entry?.note && <div style={{ fontSize: 12, color: 'var(--dh-text-note)', marginTop: 4, lineHeight: 1.5 }}>{entry.note}</div>}
        </div>
        <span style={{
          fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 20, flexShrink: 0,
          color: meta?.color || 'var(--dh-text-faint)', background: meta?.bg || 'var(--dh-badge-bg)',
        }}>{meta?.label || 'Non évalué'}</span>
      </div>
    )
  }
  const isOrdonnanceExercise = item.id === 'lecture-ordonnance'
  const isTrameAccueil = item.id === 'trame-accueil'
  const guide = ITEM_GUIDES[item.id]
  const history = pastEntries || []

  useEffect(() => { setDraftNote(entry?.note || '') }, [entry?.note])

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
      <div className="item-row-main" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="item-row-label" style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{item.label}</span>
          {entry?.score != null && (
            <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2, fontWeight: 600 }}>
              ✅ Réalisé le {formatDateFr(entry.audit_date)}
            </div>
          )}
        </div>
        <button
          onClick={() => setGuideOpen(true)}
          title={isOrdonnanceExercise ? "Lancer l'exercice" : isTrameAccueil ? "Voir la trame d'audit" : "Lancer l'exercice"}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: (guide || isOrdonnanceExercise) ? 'rgba(0,171,233,0.15)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + ((guide || isOrdonnanceExercise) ? 'rgba(0,171,233,0.4)' : 'rgba(255,255,255,0.12)'),
            color: (guide || isOrdonnanceExercise) ? '#00abe9' : 'rgba(255,255,255,0.4)',
            borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}
        >{isOrdonnanceExercise ? '🩺 Exercice' : isTrameAccueil ? '📋 Trame' : '🎯 Lancer l\'exercice'}</button>
        {guideOpen && (
          isOrdonnanceExercise
            ? <OrdonnanceExercise onClose={() => setGuideOpen(false)} onFinish={(score) => onSetScore(item.id, score)} />
            : <GuideModal item={item} guide={guide} onClose={() => setGuideOpen(false)} />
        )}
        {history.length > 0 && (
          <button
            onClick={() => setHistoryOpen(v => !v)}
            title="Historique des audits précédents"
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: historyOpen ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.06)',
              border: '1px solid ' + (historyOpen ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.12)'),
              color: '#c4b5fd', borderRadius: 8, padding: '7px 10px', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}
          >🕐 {history.length}</button>
        )}
        <button
          onClick={() => setNoteOpen(v => !v)}
          title="Note"
          style={{
            background: entry?.note ? 'rgba(0,171,233,0.15)' : 'rgba(255,255,255,0.06)',
            border: '1px solid ' + (entry?.note ? 'rgba(0,171,233,0.4)' : 'rgba(255,255,255,0.12)'),
            color: entry?.note ? '#00abe9' : 'rgba(255,255,255,0.4)',
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 14, flexShrink: 0,
          }}
        >📝</button>
        {(entry?.score != null || entry?.note) && (
          <button
            onClick={() => setConfirmResetOpen(true)}
            title="Réinitialiser cet item"
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.4)', borderRadius: 8, width: 32, height: 32,
              cursor: 'pointer', fontSize: 14, flexShrink: 0,
            }}
          >↺</button>
        )}
        {confirmResetOpen && (
          <ConfirmModal
            title="Réinitialiser cet item ?"
            message={`Êtes-vous sûr de vouloir revenir à zéro pour "${item.label}" ? La note, le statut, la note libre et tout l'historique de cet item seront définitivement supprimés.`}
            onCancel={() => setConfirmResetOpen(false)}
            onConfirm={() => { setConfirmResetOpen(false); onReset(item.id) }}
          />
        )}
        <ScorePicker score={entry?.score} onSetScore={(n) => onSetScore(item.id, n)} />
      </div>
      {noteOpen && (
        <div style={{ marginTop: 10 }}>
          <textarea
            value={draftNote}
            onChange={e => setDraftNote(e.target.value)}
            onBlur={() => onSaveNote(item.id, draftNote)}
            placeholder="Observation, point à retravailler…"
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '8px 12px',
              color: '#fff', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none',
            }}
          />
        </div>
      )}
      {historyOpen && history.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {history.map(h => {
            const hMeta = STATUS_META[h.status] || STATUS_META.non_acquis
            return (
              <div key={h.audit_date} style={{
                background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.18)',
                borderRadius: 10, padding: '8px 12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: h.note ? 4 : 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{formatDateFr(h.audit_date)}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: hMeta.color }}>{hMeta.label}{h.score != null && ` · ${h.score}/5`}</span>
                  {h.updated_by && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>· {h.updated_by}</span>}
                </div>
                {h.note && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{h.note}</div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CollaborateurFiche({ store, sectionId, collaborateur, progress, history, onSetScore, onSaveNote, onReset, onBack, pName, role = 'formateur' }) {
  const items = getSkillItems(sectionId, isBelgiqueStore(store.id))
  const categories = useMemo(() => {
    const groups = {}
    for (const it of items) {
      if (!groups[it.category]) groups[it.category] = []
      groups[it.category].push(it)
    }
    return groups
  }, [items])

  const acquisCount = items.filter(it => progress[`${collaborateur.id}:${it.id}`]?.status === 'acquis').length

  return (
    <div className="dash-wrap">
      <BackBtn onClick={onBack}>← {store.label}</BackBtn>
      <div className="dash-header">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--dh-text)' }}>
            {collaborateurFullName(collaborateur)}
            {collaborateur.alternant && (
              <span style={{
                fontSize: 11, fontWeight: 800, color: '#c4b5fd',
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)',
                borderRadius: 20, padding: '2px 10px', textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Alternant</span>
            )}
          </h2>
          <p style={{ color: 'var(--dh-subtitle)' }}>
            {store.label} · {collaborateur.contrat}
            {collaborateur.entree && ` · Entrée le ${formatDateFr(collaborateur.entree)} (${tenureLabel(collaborateur.entree)})`}
            {' '}· {acquisCount}/{items.length} items acquis
          </p>
        </div>
      </div>

      {Object.entries(categories).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--dh-text-soft)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{category}</div>
          {catItems.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              entry={progress[`${collaborateur.id}:${item.id}`]}
              pastEntries={history[`${collaborateur.id}:${item.id}`]}
              onSetScore={onSetScore}
              onReset={onReset}
              onSaveNote={onSaveNote}
              readOnly={role === 'manager'}
            />
          ))}
        </div>
      ))}

      <CollaborateurNotesSection store={store} collaborateur={collaborateur} pName={pName} role={role} />
    </div>
  )
}
