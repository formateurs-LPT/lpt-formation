'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import {
  SKILL_ITEMS, STATUS_META, SCORE_ORDER, SCORE_LABELS, scoreToStatus, collaborateurFullName,
  formatDateFr, tenureLabel, teamAge, TEAM_LABELS, ITEM_GUIDES,
} from '@/lib/storeFollowupData'
import { sbSelect } from '@/lib/supabase'
import { TRAINING_THEMES } from '@/lib/trainingSlots'
import OrdonnanceExercise from './OrdonnanceExercise'

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
// fond sombre. La section MO/SAV n'étant pas scindée dans notre roster,
// elle reprend un dégradé rouge → orange (MO + SAV).
export const SECTION_COLORS = {
  cvo: {
    bar: '#6fcf8e',
    bg: 'rgba(111,207,142,0.07)',
    border: 'rgba(111,207,142,0.28)',
    hoverBorder: 'rgba(111,207,142,0.55)',
  },
  'mo-sav': {
    bar: 'linear-gradient(180deg, #e8756b, #f0a758)',
    bg: 'linear-gradient(135deg, rgba(232,117,107,0.08), rgba(240,167,88,0.08))',
    border: 'rgba(232,117,107,0.28)',
    hoverBorder: 'rgba(240,167,88,0.55)',
  },
}

// Moyenne des notes (/5) sur tous les items d'une section, notes manquantes
// comptées à 0 — distingue "pas encore audité" (0%) de "en cours partout"
// (progression visible), contrairement à un simple % d'items acquis.
// Extrait en fonction partagée pour que la carte collaborateur ET la
// statistique d'en-tête (taux de maîtrise moyen) utilisent exactement le
// même calcul, sans jamais pouvoir diverger.
export function pctFor(progress, collabId, sectionId) {
  const items = SKILL_ITEMS[sectionId] || []
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
export function StoreHeader({ store, progress, subtitle, right }) {
  const allCollaborateurs = store.sections.flatMap(s => s.collaborateurs)
  const totalHeadcount = allCollaborateurs.length

  const pctValues = store.sections.flatMap(s => s.collaborateurs.map(c => pctFor(progress, c.id, s.id)))
  const avgPct = pctValues.length ? Math.round(pctValues.reduce((a, b) => a + b, 0) / pctValues.length) : 0

  const age = teamAge(allCollaborateurs)

  const stats = [
    { icon: '👥', label: 'Effectif total', value: `${totalHeadcount}`, sub: totalHeadcount > 1 ? 'collaborateurs' : 'collaborateur' },
    { icon: '🎯', label: 'Taux de maîtrise moyen', value: `${avgPct}%`, sub: 'toutes équipes' },
    { icon: age?.icon || '📅', label: 'Ancienneté moyenne', value: age ? age.avgLabel : '—', sub: age ? age.label : 'non renseignée' },
  ]

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {store.photo && (
            <div style={{
              flexShrink: 0, width: 56, height: 56, borderRadius: 14, overflow: 'hidden',
              border: '1.5px solid rgba(255,255,255,0.12)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={store.photo} alt={`Magasin ${store.label}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }} />
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, color: '#e8edf3', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🏬</span> {store.label}
            </h2>
            {subtitle && <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b8099' }}>{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            flex: '1 1 180px', minWidth: 160,
            background: 'linear-gradient(145deg, #0f1923 0%, #162030 55%, #0d2438 100%)',
            border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 9, background: 'rgba(0,171,233,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0,
              }}>{s.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', lineHeight: 1.3 }}>{s.label}</div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BackBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
      color: 'rgba(255,255,255,0.7)', padding: '8px 16px', borderRadius: 10,
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
function CollaborateurCard({ c, sectionId, colors, progress, onSelectCollaborateur, completed }) {
  const pct = pctFor(progress, c.id, sectionId)
  const alt = c.alternant
  const border = alt ? 'rgba(167,139,250,0.4)' : colors.border
  const hoverBorder = alt ? '#a78bfa' : colors.hoverBorder
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
        background: alt ? 'rgba(167,139,250,0.14)' : 'rgba(255,255,255,0.06)',
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
          <div style={{ height: '100%', width: `${pct}%`, background: alt ? '#a78bfa' : colors.bar, transition: 'width .3s' }} />
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
                    completed={completedByCollab[c.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {apprentis.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: '#c4b5fd', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Apprentis
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {apprentis.map(({ collaborateur, sectionId }) => (
              <CollaborateurCard
                key={collaborateur.id} c={collaborateur} sectionId={sectionId}
                colors={SECTION_COLORS[sectionId] || SECTION_COLORS.cvo}
                progress={progress} onSelectCollaborateur={onSelectCollaborateur}
                completed={completedByCollab[collaborateur.id]}
              />
            ))}
          </div>
        </div>
      )}
    </>
  )
}

// ── Écran 2 : détail d'un magasin (sections + collaborateurs) — formateur ──
export function StoreDetail({ store, progress, onSelectCollaborateur, onBack }) {
  return (
    <div className="dash-wrap">
      <BackBtn onClick={onBack}>← Tous les magasins</BackBtn>

      <StoreHeader store={store} progress={progress} subtitle="Sélectionnez un collaborateur pour voir sa fiche de suivi" />

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

export function ItemRow({ item, entry, pastEntries, onSetScore, onSaveNote, onReset }) {
  const [noteOpen, setNoteOpen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [draftNote, setDraftNote] = useState(entry?.note || '')
  const isOrdonnanceExercise = item.id === 'lecture-ordonnance'
  const isTrameAccueil = item.id === 'trame-accueil'
  const guide = ITEM_GUIDES[item.id]
  const history = pastEntries || []

  useEffect(() => { setDraftNote(entry?.note || '') }, [entry?.note])

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
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

export function CollaborateurFiche({ store, sectionId, collaborateur, progress, history, onSetScore, onSaveNote, onReset, onBack }) {
  const items = SKILL_ITEMS[sectionId] || []
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
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {collaborateurFullName(collaborateur)}
            {collaborateur.alternant && (
              <span style={{
                fontSize: 11, fontWeight: 800, color: '#c4b5fd',
                background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)',
                borderRadius: 20, padding: '2px 10px', textTransform: 'uppercase', letterSpacing: 0.5,
              }}>Alternant</span>
            )}
          </h2>
          <p>
            {store.label} · {collaborateur.contrat}
            {collaborateur.entree && ` · Entrée le ${formatDateFr(collaborateur.entree)} (${tenureLabel(collaborateur.entree)})`}
            {' '}· {acquisCount}/{items.length} items acquis
          </p>
        </div>
      </div>

      {Object.entries(categories).map(([category, catItems]) => (
        <div key={category} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{category}</div>
          {catItems.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              entry={progress[`${collaborateur.id}:${item.id}`]}
              pastEntries={history[`${collaborateur.id}:${item.id}`]}
              onSetScore={onSetScore}
              onReset={onReset}
              onSaveNote={onSaveNote}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
