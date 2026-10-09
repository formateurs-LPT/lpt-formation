'use client'
import { useState, useEffect, useRef } from 'react'
import { getSignedUrl } from '@/lib/storageApi'
import { POLES, RUBRIQUES, poleMeta, rubriqueMeta } from '@/lib/poles'
import ConfirmManagerCodeModal from './ConfirmManagerCodeModal'

function fmtDateLong(isoDate) {
  if (!isoDate) return '—'
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isVideoPath(path) {
  return /\.(mp4|mov|webm|m4v)$/i.test(path || '')
}

function Thumb({ path }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let cancelled = false
    getSignedUrl(path).then(u => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [path])
  if (!url) return <div style={{ width: 88, height: 62, borderRadius: 8, background: 'var(--border)' }} />
  return isVideoPath(path) ? (
    <video src={url} controls style={{ width: 88, height: 62, borderRadius: 8, background: '#000', objectFit: 'cover' }} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Photo" style={{ width: 88, height: 62, borderRadius: 8, objectFit: 'cover', cursor: 'pointer' }}
      onClick={() => window.open(url, '_blank', 'noopener,noreferrer')} />
  )
}

function AudioPlayer({ path }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let cancelled = false
    getSignedUrl(path).then(u => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [path])
  if (!url) return null
  return <audio src={url} controls style={{ height: 30, marginTop: 6, maxWidth: '100%' }} />
}

// Les deux fonctions ci-dessous acceptent les deux formes de section : avec
// niveau `themes` (nouveaux reportings, regroupés par thème — cf. edge
// function) ou directement `rubriques` (anciens reportings, affichés tels
// quels — cf. CONTRAINTES de la refonte thèmes).
function rubriqueGroupsOf(section) {
  return section.themes ? section.themes.flatMap(t => t.rubriques) : section.rubriques
}

function countAll(sections) {
  let photos = 0, aFaire = 0
  for (const s of sections) {
    for (const r of rubriqueGroupsOf(s)) {
      for (const it of r.items) photos += it.piecesJointes?.length || 0
      if (r.rubrique === 'a_faire') aFaire += r.items.length
    }
  }
  return { photos, aFaire }
}

function poleTotal(section) {
  return rubriqueGroupsOf(section).reduce((n, r) => n + r.items.length, 0)
}

/** Construit la liste des slides à partir de la structure — un slide titre,
 * un slide synthèse (si présente), un slide par pôle présent, un slide "mot
 * de la fin" (si présent), un slide collaborateurs (si au moins un cité),
 * puis EXACTEMENT le même jeu de slides pour `confidentielStructure` (même
 * format, généré séparément par Groq, cf. edge function) si elle est déjà
 * résolue (fournie directement par le formateur, ou déverrouillée par le
 * manager) — tant qu'elle ne l'est pas, ces slides n'existent simplement pas. */
function buildSlides(structure, confidentielStructure) {
  const slides = [{ type: 'title' }]
  if (structure.syntheseGlobale) slides.push({ type: 'synthese' })
  for (const section of structure.sections) slides.push({ type: 'pole', pole: section.pole })
  if (structure.motDeLaFin) slides.push({ type: 'motdelafin' })
  if (structure.collaborateursCites?.length) slides.push({ type: 'collaborateurs' })
  if (confidentielStructure) {
    if (confidentielStructure.syntheseGlobale) slides.push({ type: 'synthese', confidentiel: true })
    for (const section of confidentielStructure.sections) slides.push({ type: 'pole', pole: section.pole, confidentiel: true })
    if (confidentielStructure.motDeLaFin) slides.push({ type: 'motdelafin', confidentiel: true })
    if (confidentielStructure.collaborateursCites?.length) slides.push({ type: 'collaborateurs', confidentiel: true })
  }
  return slides
}

function fmtDateShort(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) } catch { return '' }
}

function ItemCard({
  item, canEdit, forceOpen, onEdit, onRemove, onMoveUp, onMoveDown,
  onChangePole, onChangeRubrique, onChangeTheme, themeOptions, currentPole, currentRubrique, currentTheme,
  isActionItem, canToggleDone, onToggleDone, confidentiel,
}) {
  const [open, setOpen] = useState(false)
  const [editingText, setEditingText] = useState(false)
  const [resume, setResume] = useState(item.resume)
  const [detail, setDetail] = useState(item.detail || '')
  const showOpen = forceOpen || open

  const saveText = () => {
    onEdit({ resume: resume.trim(), detail: detail.trim() || null })
    setEditingText(false)
  }

  return (
    <div className="print-card" style={{ background: 'var(--card)', border: `1px solid ${confidentiel ? '#fcd9a8' : 'var(--border)'}`, borderRadius: 14, padding: '16px 18px' }}>
      {editingText ? (
        <div>
          <input value={resume} onChange={e => setResume(e.target.value)} className="finput" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 8 }} placeholder="Résumé" />
          <textarea value={detail} onChange={e => setDetail(e.target.value)} rows={3} className="finput" style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', marginBottom: 8, fontFamily: 'inherit' }} placeholder="Détail (laisser vide si identique au résumé)" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveText} className="gbtn" style={{ padding: '5px 14px', fontSize: 12 }}>Enregistrer</button>
            <button onClick={() => { setResume(item.resume); setDetail(item.detail || ''); setEditingText(false) }} className="btn2" style={{ padding: '5px 14px', fontSize: 12 }}>Annuler</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 14.5, color: 'var(--text)', lineHeight: 1.55 }}>{item.resume}</div>
          {item.detail && (
            <>
              {!forceOpen && (
                <button onClick={() => setOpen(o => !o)} className="no-print" style={{
                  background: 'none', border: 'none', color: '#00abe9', fontSize: 12.5, fontWeight: 700,
                  cursor: 'pointer', padding: '7px 0 0', fontFamily: 'inherit',
                }}>{open ? '– Voir moins' : '+ Voir plus'}</button>
              )}
              {showOpen && (
                <div style={{ fontSize: 13.5, color: 'var(--text-s)', lineHeight: 1.6, marginTop: 9, whiteSpace: 'pre-wrap' }}>{item.detail}</div>
              )}
            </>
          )}
        </>
      )}

      {isActionItem && (
        <div className="no-print" style={{ marginTop: 11 }}>
          {canToggleDone ? (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: item.done ? '#4ade80' : 'var(--text-s)' }}>
              <input type="checkbox" checked={!!item.done} onChange={onToggleDone} style={{ accentColor: '#4ade80' }} />
              {item.done ? `Fait${item.doneAt ? ` le ${fmtDateShort(item.doneAt)}` : ''}` : 'Marquer comme fait'}
            </label>
          ) : (
            <span className={`badge ${item.done ? 'ok' : 'pending'}`}>
              {item.done ? `✓ Fait${item.doneAt ? ` le ${fmtDateShort(item.doneAt)}` : ''}` : '⏳ Pas encore fait'}
            </span>
          )}
        </div>
      )}

      {item.audioUrl && <AudioPlayer path={item.audioUrl} />}

      {item.piecesJointes?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 11 }}>
          {item.piecesJointes.map((p, i) => <Thumb key={i} path={p} />)}
        </div>
      )}

      {item.collaborateurs?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 11 }}>
          {item.collaborateurs.map((c, i) => (
            <span key={c.id || i} style={{
              fontSize: 11, fontWeight: 600, color: '#00abe9', padding: '2px 9px', borderRadius: 20,
              background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
            }}>@{c.nom}</span>
          ))}
        </div>
      )}

      {canEdit && !editingText && (
        <div className="no-print" style={{ display: 'flex', gap: 6, marginTop: 13, flexWrap: 'wrap' }}>
          <button onClick={() => setEditingText(true)} className="btn2" style={{ padding: '4px 10px', fontSize: 11 }}>Modifier</button>
          <button onClick={onRemove} className="btn2" style={{ padding: '4px 10px', fontSize: 11, color: '#f87171' }}>Supprimer</button>
          {onMoveUp && <button onClick={onMoveUp} className="btn2" style={{ padding: '4px 10px', fontSize: 11 }}>↑</button>}
          {onMoveDown && <button onClick={onMoveDown} className="btn2" style={{ padding: '4px 10px', fontSize: 11 }}>↓</button>}
          {onChangePole && (
            <select value={currentPole} onChange={e => onChangePole(e.target.value)} className="finput" style={{ marginBottom: 0, padding: '4px 8px', fontSize: 11, width: 'auto' }}>
              {POLES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          )}
          {onChangeRubrique && (
            <select value={currentRubrique} onChange={e => onChangeRubrique(e.target.value)} className="finput" style={{ marginBottom: 0, padding: '4px 8px', fontSize: 11, width: 'auto' }}>
              {RUBRIQUES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          )}
          {onChangeTheme && themeOptions?.filter(t => t.theme !== currentTheme).length > 0 && (
            <select value="" onChange={e => { if (e.target.value) onChangeTheme(e.target.value) }} className="finput" style={{ marginBottom: 0, padding: '4px 8px', fontSize: 11, width: 'auto' }}>
              <option value="" disabled>Déplacer vers le thème…</option>
              {themeOptions.filter(t => t.theme !== currentTheme).map(t => <option key={t.theme} value={t.theme}>{t.label}</option>)}
            </select>
          )}
        </div>
      )}
    </div>
  )
}

/** Une rubrique (Constaté/Fait/À faire) et ses items — partagée entre le
 * rendu par thème (nouveaux reportings) et le rendu à plat (anciens
 * reportings, sans niveau thème). `themeId` est `null` dans ce second cas :
 * l'édition de thème (déplacer/fusionner) n'est alors simplement pas proposée. */
function RubriqueGroup({ rub, poleId, themeId, themeOptions, itemEdit, forceOpen, canToggleDone, onToggleDone, confidentiel }) {
  const rMeta = rubriqueMeta(rub.rubrique)
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
        <span style={{ width: 4, height: 14, borderRadius: 2, background: rMeta.color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{rMeta.label}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rub.items.map((item, i) => (
          <ItemCard
            key={i} item={item} canEdit={!!itemEdit} forceOpen={forceOpen} confidentiel={confidentiel}
            onEdit={itemEdit ? patch => itemEdit.updateItem(poleId, themeId, rub.rubrique, i, patch) : undefined}
            onRemove={itemEdit ? () => itemEdit.removeItem(poleId, themeId, rub.rubrique, i) : undefined}
            onMoveUp={itemEdit && i > 0 ? () => itemEdit.moveItem(poleId, themeId, rub.rubrique, i, -1) : null}
            onMoveDown={itemEdit && i < rub.items.length - 1 ? () => itemEdit.moveItem(poleId, themeId, rub.rubrique, i, 1) : null}
            onChangePole={itemEdit ? (toPole) => itemEdit.changePole(poleId, themeId, rub.rubrique, i, toPole) : null}
            onChangeRubrique={itemEdit ? (toRub) => itemEdit.changeRubrique(poleId, themeId, rub.rubrique, i, toRub) : null}
            onChangeTheme={itemEdit && themeId != null ? (toTheme) => itemEdit.changeTheme(poleId, themeId, rub.rubrique, i, toTheme) : null}
            themeOptions={themeOptions}
            currentPole={poleId}
            currentRubrique={rub.rubrique}
            currentTheme={themeId}
            isActionItem={rub.rubrique === 'a_faire'}
            canToggleDone={canToggleDone}
            onToggleDone={() => onToggleDone?.(poleId, themeId, rub.rubrique, i, confidentiel)}
          />
        ))}
      </div>
    </div>
  )
}

/** Carte d'un thème dans un pôle : titre + nombre de points, avec
 * renommage/fusion avant publication (`itemEdit` non nul). */
function ThemeCard({ theme, section, itemEdit, forceOpen, canToggleDone, onToggleDone, confidentiel }) {
  const [renaming, setRenaming] = useState(false)
  const [label, setLabel] = useState(theme.label)
  const [merging, setMerging] = useState(false)
  const count = theme.rubriques.reduce((n, r) => n + r.items.length, 0)
  const otherThemes = (section.themes || []).filter(t => t.theme !== theme.theme)
  const themeOptions = section.themes?.map(t => ({ theme: t.theme, label: t.label }))

  const saveRename = () => {
    const trimmed = label.trim()
    if (trimmed && trimmed !== theme.label) itemEdit?.renameTheme(section.pole, theme.theme, trimmed)
    setRenaming(false)
  }

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 18px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {renaming ? (
          <>
            <input value={label} onChange={e => setLabel(e.target.value)} className="finput" style={{ marginBottom: 0, fontSize: 15, fontWeight: 700, flex: '1 1 160px' }} autoFocus />
            <button onClick={saveRename} className="gbtn no-print" style={{ padding: '4px 12px', fontSize: 11 }}>OK</button>
            <button onClick={() => { setLabel(theme.label); setRenaming(false) }} className="btn2 no-print" style={{ padding: '4px 12px', fontSize: 11 }}>Annuler</button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--text)', flex: '1 1 auto', minWidth: 0 }}>{theme.label}</span>
            <span style={{ fontSize: 12.5, color: 'var(--text-m)' }}>{count} point{count > 1 ? 's' : ''}</span>
            {itemEdit && (
              <div className="no-print" style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setRenaming(true)} className="btn2" style={{ padding: '4px 10px', fontSize: 11 }}>Renommer</button>
                {otherThemes.length > 0 && (
                  <button onClick={() => setMerging(m => !m)} className="btn2" style={{ padding: '4px 10px', fontSize: 11 }}>Fusionner…</button>
                )}
              </div>
            )}
          </>
        )}
      </div>
      {merging && (
        <div className="no-print" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: 'var(--text-s)' }}>Fusionner avec :</span>
          <select onChange={e => { if (e.target.value) { itemEdit.mergeThemes(section.pole, theme.theme, e.target.value); setMerging(false) } }} defaultValue="" className="finput" style={{ marginBottom: 0, width: 'auto', fontSize: 12, padding: '4px 8px' }}>
            <option value="" disabled>Choisir un thème…</option>
            {otherThemes.map(t => <option key={t.theme} value={t.theme}>{t.label}</option>)}
          </select>
        </div>
      )}
      {theme.rubriques.map(rub => (
        <RubriqueGroup
          key={rub.rubrique} rub={rub} poleId={section.pole} themeId={theme.theme} themeOptions={themeOptions} itemEdit={itemEdit}
          forceOpen={forceOpen} canToggleDone={canToggleDone} onToggleDone={onToggleDone} confidentiel={confidentiel}
        />
      ))}
    </div>
  )
}

/** Contenu d'un slide donné — partagé entre la présentation paginée et
 * l'export PDF (tout empilé). `edit` regroupe les callbacks de mutation,
 * absent (undefined) en lecture seule. */
function SlideContent({ slide, structure, confidentielStructure, reporting, magasinNom, edit, forceOpen, canToggleDone, onToggleDone }) {
  if (slide.type === 'title') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>Reporting hebdomadaire</div>
        <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>{magasinNom || '—'}</div>
        <div style={{ fontSize: 15, color: 'var(--text-s)' }}>
          Semaine du {fmtDateLong(reporting.semaine_debut)} au {fmtDateLong(reporting.semaine_fin)}
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--text-m)', marginTop: 6 }}>{reporting.auteur}</div>
      </div>
    )
  }

  if (slide.type === 'synthese') {
    const src = slide.confidentiel ? confidentielStructure : structure
    const { photos: photoCount, aFaire: aFaireCount } = countAll(src.sections)
    const collabCount = src.collaborateursCites?.length || 0
    return (
      <div style={{ padding: '12px 4px' }}>
        {slide.confidentiel && <ConfidentielBanner />}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>Synthèse de la semaine</div>
        <div style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.65, textAlign: 'center', maxWidth: 620, margin: '0 auto 28px' }}>
          {src.syntheseGlobale}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {src.sections.map(s => (
            <div key={s.pole} style={{
              background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '10px 18px', textAlign: 'center', minWidth: 84,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: poleMeta(s.pole).color }}>{poleTotal(s)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-s)', marginTop: 2 }}>{poleMeta(s.pole).label}</div>
            </div>
          ))}
          {aFaireCount > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 84 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--orange)' }}>{aFaireCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-s)', marginTop: 2 }}>à faire</div>
            </div>
          )}
          {photoCount > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 84 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{photoCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-s)', marginTop: 2 }}>photo{photoCount > 1 ? 's' : ''}</div>
            </div>
          )}
          {collabCount > 0 && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 18px', textAlign: 'center', minWidth: 84 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{collabCount}</div>
              <div style={{ fontSize: 11, color: 'var(--text-s)', marginTop: 2 }}>collaborateur{collabCount > 1 ? 's' : ''}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (slide.type === 'pole') {
    const src = slide.confidentiel ? confidentielStructure : structure
    const section = src.sections.find(s => s.pole === slide.pole)
    const meta = poleMeta(section.pole)
    // En lecture (pas d'édition) sur les items confidentiels dans tous les
    // cas — seul le cochage "fait" est permis (cf. onToggleDone ci-dessous),
    // jamais la réécriture/reclassement, même par le manager.
    const itemEdit = slide.confidentiel ? null : edit
    return (
      <div>
        {slide.confidentiel && <ConfidentielBanner />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22, justifyContent: 'center' }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>{meta.label}</span>
          <span style={{ fontSize: 13, color: 'var(--text-m)' }}>({poleTotal(section)})</span>
        </div>
        {section.themes ? (
          // Nouveaux reportings : regroupés par thème (cf. edge function) —
          // une carte par thème, triée par le code, jamais par le modèle.
          section.themes.map(theme => (
            <ThemeCard
              key={theme.theme} theme={theme} section={section} itemEdit={itemEdit} forceOpen={forceOpen}
              canToggleDone={canToggleDone} onToggleDone={onToggleDone} confidentiel={slide.confidentiel}
            />
          ))
        ) : (
          // Anciens reportings (générés avant la refonte thèmes) : affichés
          // tels quels, à plat par rubrique — jamais d'édition de thème ici.
          section.rubriques.map(rub => (
            <RubriqueGroup
              key={rub.rubrique} rub={rub} poleId={section.pole} themeId={null} themeOptions={null} itemEdit={itemEdit}
              forceOpen={forceOpen} canToggleDone={canToggleDone} onToggleDone={onToggleDone} confidentiel={slide.confidentiel}
            />
          ))
        )}
      </div>
    )
  }

  if (slide.type === 'motdelafin') {
    const src = slide.confidentiel ? confidentielStructure : structure
    return (
      <div style={{ textAlign: 'center', padding: '20px 12px' }}>
        {slide.confidentiel && <ConfidentielBanner />}
        <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18 }}>Mot de la fin</div>
        <div style={{ fontSize: 18, color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 600, margin: '0 auto', whiteSpace: 'pre-wrap' }}>
          « {src.motDeLaFin} »
        </div>
      </div>
    )
  }

  // collaborateurs
  {
    const src = slide.confidentiel ? confidentielStructure : structure
    return (
      <div>
        {slide.confidentiel && <ConfidentielBanner />}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, textAlign: 'center' }}>Collaborateurs cités</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, margin: '0 auto' }}>
          {src.collaborateursCites.map(c => (
            <div key={c.id} style={{
              display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text)',
              padding: '11px 16px', background: 'var(--card)', border: `1px solid ${slide.confidentiel ? '#fcd9a8' : 'var(--border)'}`, borderRadius: 12,
            }}>
              <span>{c.nom}</span>
              <span style={{ color: 'var(--text-s)' }}>{c.count} point{c.count > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

function ConfidentielBanner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 20, justifyContent: 'center' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: 1 }}>
        🔒 Confidentiel — visible uniquement par le manager
      </span>
    </div>
  )
}

/**
 * Export en pile complète (tous les slides, tout déplié) — utilisé pour la
 * capture PDF (html2pdf) : le rendu paginé interactif n'est pas adapté à une
 * capture, il faut tout avoir dans le DOM en même temps.
 */
export function ReportingPrintDocument({ reporting, magasinNom, confidentielStructure }) {
  const structure = reporting?.contenu_structure
  if (!structure || !Array.isArray(structure.sections)) {
    return (
      <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {reporting?.contenu_genere || 'Reporting vide.'}
      </div>
    )
  }
  const slides = buildSlides(structure, confidentielStructure)
  return (
    <div className="print-report-area">
      {slides.map((slide, i) => (
        <div key={i} className="print-section" style={{ marginBottom: 48, paddingBottom: 32, borderBottom: i < slides.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <SlideContent slide={slide} structure={structure} confidentielStructure={confidentielStructure} reporting={reporting} magasinNom={magasinNom} forceOpen />
        </div>
      ))}
    </div>
  )
}

/**
 * Présentation plein écran d'un reporting hebdo, sous forme de slides
 * (une idée par écran : titre, synthèse, un par pôle, mot de la fin,
 * collaborateurs cités) — pensée pour être compréhensible en un coup d'œil
 * par un formateur, un manager, un DR ou un directeur retail. `canEdit`
 * active l'édition (avant ou après publication, selon l'appelant) ;
 * `onPublish` affiche le bouton Publier/Mettre à jour.
 */
export default function ReportingDetailView({
  reporting, magasinNom, canEdit = false, onChange, onClose,
  onPublish, publishing = false, published = false,
  onOpenMail, canToggleDone = false, onDelete,
  // Confidentiel : soit déjà fourni tel quel (brouillon du formateur, ou
  // historique consulté par son auteur — pas de ressaisie nécessaire), soit
  // disponible mais verrouillé (cas manager) — `confidentialAvailable` +
  // `onUnlockConfidential` (async, renvoie la structure ou null) pilotent
  // alors l'affichage d'un bouton de déverrouillage. Le formateur et le
  // collaborateur ne passent jamais ces deux dernières props. Les items
  // confidentiels ne sont jamais éditables (cf. SlideContent), seulement
  // cochables "fait" quand canToggleDone est vrai — persisté via
  // onChangeConfidentiel (manager uniquement, comme confidentialAvailable).
  confidentialStructure = null, confidentialAvailable = false, onUnlockConfidential, onChangeConfidentiel,
}) {
  const structure = reporting?.contenu_structure
  const hasStructure = structure && Array.isArray(structure.sections)
  const [slideIndex, setSlideIndex] = useState(0)
  const [printCapture, setPrintCapture] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [unlockedConfidentiel, setUnlockedConfidentiel] = useState(null)
  const [showUnlockModal, setShowUnlockModal] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState(null)
  const printRef = useRef(null)
  const touchStartX = useRef(null)

  const resolvedConfidentiel = confidentialStructure || unlockedConfidentiel
  const slides = hasStructure ? buildSlides(structure, resolvedConfidentiel) : []
  const clampedIndex = Math.min(slideIndex, Math.max(0, slides.length - 1))

  const handleUnlock = async (code) => {
    setUnlocking(true)
    setUnlockError(null)
    const result = await onUnlockConfidential?.(code)
    setUnlocking(false)
    if (!result) { setUnlockError('Code incorrect.'); return }
    setUnlockedConfidentiel(result)
    setShowUnlockModal(false)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (printCapture) return
      if (e.key === 'ArrowRight') setSlideIndex(i => Math.min(i + 1, slides.length - 1))
      if (e.key === 'ArrowLeft') setSlideIndex(i => Math.max(i - 1, 0))
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, printCapture])

  // Bascule temporairement du rendu paginé vers le document empilé complet
  // (visible, pas hors-écran — un rendu caché donne une capture vide avec
  // html2canvas, cf. RetourFormationView.js) le temps de la capture PDF.
  const handleExportPdf = async () => {
    if (exportingPdf) return
    setExportingPdf(true)
    setPrintCapture(true)
    await new Promise(r => setTimeout(r, 80))
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          filename: `Reporting-${(magasinNom || 'magasin').replace(/\s+/g, '-')}-${reporting.semaine_debut}.pdf`,
          margin: 10,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(printRef.current)
        .save()
    } finally {
      setPrintCapture(false)
      setExportingPdf(false)
    }
  }

  if (!hasStructure) {
    return (
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div onClick={e => e.stopPropagation()} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 18, padding: 26, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 18 }}>
            {reporting?.contenu_genere || 'Reporting vide.'}
          </div>
          <button onClick={onClose} className="btn2">Fermer</button>
        </div>
      </div>
    )
  }

  // L'édition (modifier/déplacer/renommer/fusionner) suppose le niveau
  // `themes` sur chaque section — toujours vrai pour un brouillon fraîchement
  // généré (cf. edge function), jamais pour un ancien reporting publié avant
  // la refonte thèmes. Sur un ancien reporting, on désactive l'édition plutôt
  // que de risquer de planter sur une forme de données qu'elle ne connaît
  // pas : "les anciens reportings restent affichés tels quels".
  const structureEditable = structure.sections.every(s => Array.isArray(s.themes))

  // Reconstruit l'arbre pôle → thème → rubrique en retirant/insérant un seul
  // item, en filtrant les rubriques/thèmes/pôles devenus vides.
  const withItemMoved = (poleId, themeId, rubriqueId, index, mutate) => {
    let extracted = null
    let next = structure.sections.map(s => {
      if (s.pole !== poleId) return s
      return {
        ...s,
        themes: s.themes
          .map(t => {
            if (t.theme !== themeId) return t
            return {
              ...t,
              rubriques: t.rubriques
                .map(r => {
                  if (r.rubrique !== rubriqueId) return r
                  const items = [...r.items]
                  extracted = items[index]
                  items.splice(index, 1)
                  return { ...r, items }
                })
                .filter(r => r.items.length > 0),
            }
          })
          .filter(t => t.rubriques.length > 0),
      }
    }).filter(s => s.themes.length > 0)
    if (!extracted) return
    next = mutate(next, extracted)
    onChange?.({ ...structure, sections: next })
  }

  const insertItem = (list, poleId, themeId, themeLabel, rubriqueId, item) => {
    const poleMetaObj = poleMeta(poleId)
    const rubMetaObj = rubriqueMeta(rubriqueId)
    const existingPole = list.find(s => s.pole === poleId)
    if (!existingPole) {
      return [...list, {
        pole: poleId, label: poleMetaObj.label,
        themes: [{ theme: themeId, label: themeLabel, rubriques: [{ rubrique: rubriqueId, label: rubMetaObj.label, items: [item] }] }],
      }]
    }
    return list.map(s => {
      if (s.pole !== poleId) return s
      const existingTheme = s.themes.find(t => t.theme === themeId)
      if (!existingTheme) {
        return { ...s, themes: [...s.themes, { theme: themeId, label: themeLabel, rubriques: [{ rubrique: rubriqueId, label: rubMetaObj.label, items: [item] }] }] }
      }
      return {
        ...s,
        themes: s.themes.map(t => {
          if (t.theme !== themeId) return t
          const existingRub = t.rubriques.find(r => r.rubrique === rubriqueId)
          if (!existingRub) return { ...t, rubriques: [...t.rubriques, { rubrique: rubriqueId, label: rubMetaObj.label, items: [item] }] }
          return { ...t, rubriques: t.rubriques.map(r => r.rubrique !== rubriqueId ? r : { ...r, items: [...r.items, item] }) }
        }),
      }
    })
  }

  const edit = (!canEdit || !structureEditable) ? null : {
    updateItem: (poleId, themeId, rubriqueId, index, patch) => {
      onChange?.({
        ...structure,
        sections: structure.sections.map(s => s.pole !== poleId ? s : {
          ...s,
          themes: s.themes.map(t => t.theme !== themeId ? t : {
            ...t,
            rubriques: t.rubriques.map(r => r.rubrique !== rubriqueId ? r : {
              ...r, items: r.items.map((it, i) => i === index ? { ...it, ...patch } : it),
            }),
          }),
        }),
      })
    },
    removeItem: (poleId, themeId, rubriqueId, index) => withItemMoved(poleId, themeId, rubriqueId, index, (list) => list),
    moveItem: (poleId, themeId, rubriqueId, index, dir) => {
      const section = structure.sections.find(s => s.pole === poleId)
      const theme = section?.themes.find(t => t.theme === themeId)
      const rub = theme?.rubriques.find(r => r.rubrique === rubriqueId)
      const target = index + dir
      if (!rub || target < 0 || target >= rub.items.length) return
      const items = [...rub.items]
      ;[items[index], items[target]] = [items[target], items[index]]
      onChange?.({
        ...structure,
        sections: structure.sections.map(s => s.pole !== poleId ? s : {
          ...s, themes: s.themes.map(t => t.theme !== themeId ? t : {
            ...t, rubriques: t.rubriques.map(r => r.rubrique !== rubriqueId ? r : { ...r, items }),
          }),
        }),
      })
    },
    changePole: (fromPole, themeId, rubriqueId, index, toPole) => {
      if (fromPole === toPole) return
      const theme = structure.sections.find(s => s.pole === fromPole)?.themes.find(t => t.theme === themeId)
      withItemMoved(fromPole, themeId, rubriqueId, index, (list, item) => insertItem(list, toPole, themeId, theme?.label || themeId, rubriqueId, item))
    },
    changeRubrique: (poleId, themeId, fromRubrique, index, toRubrique) => {
      if (fromRubrique === toRubrique) return
      const theme = structure.sections.find(s => s.pole === poleId)?.themes.find(t => t.theme === themeId)
      withItemMoved(poleId, themeId, fromRubrique, index, (list, item) => insertItem(list, poleId, themeId, theme?.label || themeId, toRubrique, item))
    },
    changeTheme: (poleId, fromTheme, rubriqueId, index, toTheme) => {
      if (fromTheme === toTheme) return
      const targetTheme = structure.sections.find(s => s.pole === poleId)?.themes.find(t => t.theme === toTheme)
      withItemMoved(poleId, fromTheme, rubriqueId, index, (list, item) => insertItem(list, poleId, toTheme, targetTheme?.label || toTheme, rubriqueId, item))
    },
    renameTheme: (poleId, themeId, newLabel) => {
      const trimmed = newLabel.trim()
      if (!trimmed) return
      onChange?.({
        ...structure,
        sections: structure.sections.map(s => s.pole !== poleId ? s : {
          ...s, themes: s.themes.map(t => t.theme !== themeId ? t : { ...t, label: trimmed }),
        }),
      })
    },
    // Fusionne `fromThemeId` dans `intoThemeId` (même pôle) : items réunis
    // rubrique par rubrique, le thème d'origine disparaît.
    mergeThemes: (poleId, fromThemeId, intoThemeId) => {
      if (fromThemeId === intoThemeId) return
      const section = structure.sections.find(s => s.pole === poleId)
      const fromTheme = section?.themes.find(t => t.theme === fromThemeId)
      const intoTheme = section?.themes.find(t => t.theme === intoThemeId)
      if (!fromTheme || !intoTheme) return
      const mergedRubriques = RUBRIQUES.map(rMeta => {
        const a = intoTheme.rubriques.find(r => r.rubrique === rMeta.id)
        const b = fromTheme.rubriques.find(r => r.rubrique === rMeta.id)
        const items = [...(a?.items || []), ...(b?.items || [])]
        return items.length ? { rubrique: rMeta.id, label: rMeta.label, items } : null
      }).filter(Boolean)
      onChange?.({
        ...structure,
        sections: structure.sections.map(s => s.pole !== poleId ? s : {
          ...s,
          themes: s.themes
            .filter(t => t.theme !== fromThemeId)
            .map(t => t.theme !== intoThemeId ? t : { ...t, rubriques: mergedRubriques }),
        }),
      })
    },
  }

  // Coche/décoche un "à faire" comme fait — indépendant de `canEdit` (le
  // manager peut suivre l'avancement sans avoir le droit de réécrire le
  // reporting du formateur) ; persisté immédiatement par le parent via
  // onChange (public) ou onChangeConfidentiel (confidentiel — même geste,
  // destination différente, jamais mélangés). `themeId` vaut `null` sur un
  // ancien reporting sans niveau thème — la mutation redescend alors
  // directement dans `rubriques`, comme avant la refonte.
  const toggleDone = (poleId, themeId, rubriqueId, index, confidentiel) => {
    const toggleItem = (it, i) => i !== index ? it : {
      ...it, done: !it.done, doneAt: !it.done ? new Date().toISOString() : null,
    }
    const applyToSections = (sections) => sections.map(s => {
      if (s.pole !== poleId) return s
      if (themeId != null && s.themes) {
        return {
          ...s,
          themes: s.themes.map(t => t.theme !== themeId ? t : {
            ...t, rubriques: t.rubriques.map(r => r.rubrique !== rubriqueId ? r : { ...r, items: r.items.map(toggleItem) }),
          }),
        }
      }
      return {
        ...s,
        rubriques: s.rubriques.map(r => r.rubrique !== rubriqueId ? r : { ...r, items: r.items.map(toggleItem) }),
      }
    })

    if (confidentiel) {
      if (!resolvedConfidentiel) return
      const next = { ...resolvedConfidentiel, sections: applyToSections(resolvedConfidentiel.sections) }
      setUnlockedConfidentiel(next) // reflète immédiatement à l'écran
      onChangeConfidentiel?.(next) // persistance côté appelant (manager)
      return
    }
    onChange?.({ ...structure, sections: applyToSections(structure.sections) })
  }

  const goTo = (i) => setSlideIndex(Math.max(0, Math.min(i, slides.length - 1)))

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) goTo(clampedIndex + (dx < 0 ? 1 : -1))
    touchStartX.current = null
  }

  return (
    <div className="reporting-light-theme" style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
        borderBottom: '1px solid var(--border)', flexWrap: 'wrap', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontSize: 22, color: 'var(--text-s)', cursor: 'pointer', lineHeight: 1, padding: 4,
        }}>✕</button>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {magasinNom} · {fmtDateLong(reporting.semaine_debut)}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {confidentialAvailable && !resolvedConfidentiel && (
            <button onClick={() => setShowUnlockModal(true)} className="btn2" style={{ fontSize: 12.5, color: '#b45309', borderColor: '#fcd9a8' }}>
              🔒 Voir les infos confidentielles
            </button>
          )}
          {onOpenMail && <button onClick={onOpenMail} className="btn2" style={{ fontSize: 12.5 }}>✉️ Mail</button>}
          <button onClick={handleExportPdf} disabled={exportingPdf} className="btn2" style={{ fontSize: 12.5 }}>{exportingPdf ? 'Export…' : '⬇ PDF'}</button>
          {canEdit && published && onDelete && (
            <button onClick={onDelete} className="btn2" style={{ fontSize: 12.5, color: '#f87171' }}>🗑️ Supprimer</button>
          )}
          {canEdit && onPublish && (
            <button onClick={onPublish} disabled={publishing} className="gbtn" style={{ fontSize: 12.5 }}>
              {publishing ? '…' : published ? '✓ Mettre à jour' : '✓ Publier'}
            </button>
          )}
        </div>
      </div>

      {/* Slide, ou document empilé complet pendant l'export PDF — doit rester
          réellement affiché (pas caché/hors-écran) pour que html2canvas capture
          quelque chose, cf. RetourFormationView.js. */}
      {printCapture ? (
        <div style={{
          flex: 1, overflowY: 'auto', padding: '24px 20px', background: '#ffffff',
          // Fige les tokens de couleur en thème clair pour ce conteneur — sans
          // ça le texte hérite du thème sombre de #dashboard (texte clair sur
          // fond blanc = illisible en PDF).
          '--text': '#111111', '--text-s': '#4a5568', '--text-m': '#8896a5',
          '--border': '#ebebeb', '--card': '#f7f9fb', '--bg': '#ffffff',
        }}>
          <div ref={printRef} style={{ maxWidth: 680, margin: '0 auto' }}>
            <ReportingPrintDocument reporting={reporting} magasinNom={magasinNom} confidentielStructure={resolvedConfidentiel} />
          </div>
        </div>
      ) : (
        <div
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}
        >
          <div key={clampedIndex} className="reporting-slide-fade" style={{ width: '100%', maxWidth: 680 }}>
            <SlideContent slide={slides[clampedIndex]} structure={structure} confidentielStructure={resolvedConfidentiel} reporting={reporting} magasinNom={magasinNom} edit={edit} canToggleDone={canToggleDone} onToggleDone={toggleDone} />
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '14px 18px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={() => goTo(clampedIndex - 1)} disabled={clampedIndex === 0} className="btn2" style={{ padding: '6px 12px', opacity: clampedIndex === 0 ? 0.35 : 1 }}>←</button>
        <div style={{ display: 'flex', gap: 7 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`} style={{
              width: 7, height: 7, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
              background: i === clampedIndex ? '#00abe9' : 'var(--border)',
            }} />
          ))}
        </div>
        <button onClick={() => goTo(clampedIndex + 1)} disabled={clampedIndex === slides.length - 1} className="btn2" style={{ padding: '6px 12px', opacity: clampedIndex === slides.length - 1 ? 0.35 : 1 }}>→</button>
      </div>

      <style>{`
        .reporting-slide-fade { animation: reportingSlideFade .25s ease; }
        @keyframes reportingSlideFade { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .reporting-slide-fade { animation: none; } }
      `}</style>

      {showUnlockModal && (
        <ConfirmManagerCodeModal
          loading={unlocking}
          error={unlockError}
          onCancel={() => { setShowUnlockModal(false); setUnlockError(null) }}
          onConfirm={handleUnlock}
        />
      )}
    </div>
  )
}
