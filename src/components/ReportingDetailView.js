'use client'
import { useState, useEffect, useRef } from 'react'
import { getSignedUrl } from '@/lib/storageApi'
import { POLES, RUBRIQUES, poleMeta, rubriqueMeta } from '@/lib/poles'

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

function countAll(sections) {
  let photos = 0, aFaire = 0
  for (const s of sections) {
    for (const r of s.rubriques) {
      for (const it of r.items) photos += it.piecesJointes?.length || 0
      if (r.rubrique === 'a_faire') aFaire += r.items.length
    }
  }
  return { photos, aFaire }
}

function poleTotal(section) {
  return section.rubriques.reduce((n, r) => n + r.items.length, 0)
}

/** Construit la liste des slides à partir de la structure — un slide titre,
 * un slide synthèse (si présente), un slide par pôle présent, un slide "mot
 * de la fin" (si présent), un slide collaborateurs (si au moins un cité). */
function buildSlides(structure) {
  const slides = [{ type: 'title' }]
  if (structure.syntheseGlobale) slides.push({ type: 'synthese' })
  for (const section of structure.sections) slides.push({ type: 'pole', pole: section.pole })
  if (structure.motDeLaFin) slides.push({ type: 'motdelafin' })
  if (structure.collaborateursCites?.length) slides.push({ type: 'collaborateurs' })
  return slides
}

function fmtDateShort(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) } catch { return '' }
}

function ItemCard({
  item, canEdit, forceOpen, onEdit, onRemove, onMoveUp, onMoveDown,
  onChangePole, onChangeRubrique, currentPole, currentRubrique,
  isActionItem, canToggleDone, onToggleDone,
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
    <div className="print-card" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px' }}>
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
        </div>
      )}
    </div>
  )
}

/** Contenu d'un slide donné — partagé entre la présentation paginée et
 * l'export PDF (tout empilé). `edit` regroupe les callbacks de mutation,
 * absent (undefined) en lecture seule. */
function SlideContent({ slide, structure, reporting, magasinNom, edit, forceOpen, canToggleDone, onToggleDone }) {
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
    const { photos: photoCount, aFaire: aFaireCount } = countAll(structure.sections)
    const collabCount = structure.collaborateursCites?.length || 0
    return (
      <div style={{ padding: '12px 4px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>Synthèse de la semaine</div>
        <div style={{ fontSize: 17, color: 'var(--text)', lineHeight: 1.65, textAlign: 'center', maxWidth: 620, margin: '0 auto 28px' }}>
          {structure.syntheseGlobale}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {structure.sections.map(s => (
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
    const section = structure.sections.find(s => s.pole === slide.pole)
    const meta = poleMeta(section.pole)
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 22, justifyContent: 'center' }}>
          <span style={{ width: 11, height: 11, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
          <span style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)' }}>{meta.label}</span>
          <span style={{ fontSize: 13, color: 'var(--text-m)' }}>({poleTotal(section)})</span>
        </div>
        {section.rubriques.map(rub => {
          const rMeta = rubriqueMeta(rub.rubrique)
          return (
            <div key={rub.rubrique} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <span style={{ width: 4, height: 14, borderRadius: 2, background: rMeta.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{rMeta.label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {rub.items.map((item, i) => (
                  <ItemCard
                    key={i} item={item} canEdit={!!edit} forceOpen={forceOpen}
                    onEdit={edit ? patch => edit.updateItem(section.pole, rub.rubrique, i, patch) : undefined}
                    onRemove={edit ? () => edit.removeItem(section.pole, rub.rubrique, i) : undefined}
                    onMoveUp={edit && i > 0 ? () => edit.moveItem(section.pole, rub.rubrique, i, -1) : null}
                    onMoveDown={edit && i < rub.items.length - 1 ? () => edit.moveItem(section.pole, rub.rubrique, i, 1) : null}
                    onChangePole={edit ? (toPole) => edit.changePole(section.pole, rub.rubrique, i, toPole) : null}
                    onChangeRubrique={edit ? (toRub) => edit.changeRubrique(section.pole, rub.rubrique, i, toRub) : null}
                    currentPole={section.pole}
                    currentRubrique={rub.rubrique}
                    isActionItem={rub.rubrique === 'a_faire'}
                    canToggleDone={canToggleDone}
                    onToggleDone={() => onToggleDone?.(section.pole, rub.rubrique, i)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (slide.type === 'motdelafin') {
    return (
      <div style={{ textAlign: 'center', padding: '20px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18 }}>Mot de la fin</div>
        <div style={{ fontSize: 18, color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic', maxWidth: 600, margin: '0 auto', whiteSpace: 'pre-wrap' }}>
          « {structure.motDeLaFin} »
        </div>
      </div>
    )
  }

  // collaborateurs
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, textAlign: 'center' }}>Collaborateurs cités</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 420, margin: '0 auto' }}>
        {structure.collaborateursCites.map(c => (
          <div key={c.id} style={{
            display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text)',
            padding: '11px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
          }}>
            <span>{c.nom}</span>
            <span style={{ color: 'var(--text-s)' }}>{c.count} point{c.count > 1 ? 's' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Export en pile complète (tous les slides, tout déplié) — utilisé pour la
 * capture PDF (html2pdf) : le rendu paginé interactif n'est pas adapté à une
 * capture, il faut tout avoir dans le DOM en même temps.
 */
export function ReportingPrintDocument({ reporting, magasinNom }) {
  const structure = reporting?.contenu_structure
  if (!structure || !Array.isArray(structure.sections)) {
    return (
      <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
        {reporting?.contenu_genere || 'Reporting vide.'}
      </div>
    )
  }
  const slides = buildSlides(structure)
  return (
    <div className="print-report-area">
      {slides.map((slide, i) => (
        <div key={i} className="print-section" style={{ marginBottom: 48, paddingBottom: 32, borderBottom: i < slides.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <SlideContent slide={slide} structure={structure} reporting={reporting} magasinNom={magasinNom} forceOpen />
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
  onOpenMail, canToggleDone = false,
}) {
  const structure = reporting?.contenu_structure
  const hasStructure = structure && Array.isArray(structure.sections)
  const [slideIndex, setSlideIndex] = useState(0)
  const [printCapture, setPrintCapture] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const printRef = useRef(null)
  const touchStartX = useRef(null)

  const slides = hasStructure ? buildSlides(structure) : []
  const clampedIndex = Math.min(slideIndex, Math.max(0, slides.length - 1))

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

  // Reconstruit l'arbre pôle → rubrique en retirant/insérant un seul item,
  // en filtrant les rubriques et pôles devenus vides.
  const withItemMoved = (poleId, rubriqueId, index, mutate) => {
    let extracted = null
    let next = structure.sections.map(s => {
      if (s.pole !== poleId) return s
      return {
        ...s,
        rubriques: s.rubriques
          .map(r => {
            if (r.rubrique !== rubriqueId) return r
            const items = [...r.items]
            extracted = items[index]
            items.splice(index, 1)
            return { ...r, items }
          })
          .filter(r => r.items.length > 0),
      }
    }).filter(s => s.rubriques.length > 0)
    if (!extracted) return
    next = mutate(next, extracted)
    onChange?.({ ...structure, sections: next })
  }

  const insertItem = (list, poleId, rubriqueId, item) => {
    const poleMetaObj = poleMeta(poleId)
    const rubMetaObj = rubriqueMeta(rubriqueId)
    const existingPole = list.find(s => s.pole === poleId)
    if (!existingPole) {
      return [...list, { pole: poleId, label: poleMetaObj.label, rubriques: [{ rubrique: rubriqueId, label: rubMetaObj.label, items: [item] }] }]
    }
    return list.map(s => {
      if (s.pole !== poleId) return s
      const existingRub = s.rubriques.find(r => r.rubrique === rubriqueId)
      if (!existingRub) return { ...s, rubriques: [...s.rubriques, { rubrique: rubriqueId, label: rubMetaObj.label, items: [item] }] }
      return { ...s, rubriques: s.rubriques.map(r => r.rubrique !== rubriqueId ? r : { ...r, items: [...r.items, item] }) }
    })
  }

  const edit = !canEdit ? null : {
    updateItem: (poleId, rubriqueId, index, patch) => {
      onChange?.({
        ...structure,
        sections: structure.sections.map(s => s.pole !== poleId ? s : {
          ...s,
          rubriques: s.rubriques.map(r => r.rubrique !== rubriqueId ? r : {
            ...r, items: r.items.map((it, i) => i === index ? { ...it, ...patch } : it),
          }),
        }),
      })
    },
    removeItem: (poleId, rubriqueId, index) => withItemMoved(poleId, rubriqueId, index, (list) => list),
    moveItem: (poleId, rubriqueId, index, dir) => {
      const section = structure.sections.find(s => s.pole === poleId)
      const rub = section?.rubriques.find(r => r.rubrique === rubriqueId)
      const target = index + dir
      if (!rub || target < 0 || target >= rub.items.length) return
      const items = [...rub.items]
      ;[items[index], items[target]] = [items[target], items[index]]
      onChange?.({
        ...structure,
        sections: structure.sections.map(s => s.pole !== poleId ? s : {
          ...s, rubriques: s.rubriques.map(r => r.rubrique !== rubriqueId ? r : { ...r, items }),
        }),
      })
    },
    changePole: (fromPole, rubriqueId, index, toPole) => {
      if (fromPole === toPole) return
      withItemMoved(fromPole, rubriqueId, index, (list, item) => insertItem(list, toPole, rubriqueId, item))
    },
    changeRubrique: (poleId, fromRubrique, index, toRubrique) => {
      if (fromRubrique === toRubrique) return
      withItemMoved(poleId, fromRubrique, index, (list, item) => insertItem(list, poleId, toRubrique, item))
    },
  }

  // Coche/décoche un "à faire" comme fait — indépendant de `canEdit` (le
  // manager peut suivre l'avancement sans avoir le droit de réécrire le
  // reporting du formateur) ; persisté immédiatement par le parent via onChange.
  const toggleDone = (poleId, rubriqueId, index) => {
    onChange?.({
      ...structure,
      sections: structure.sections.map(s => s.pole !== poleId ? s : {
        ...s,
        rubriques: s.rubriques.map(r => r.rubrique !== rubriqueId ? r : {
          ...r, items: r.items.map((it, i) => i !== index ? it : {
            ...it, done: !it.done, doneAt: !it.done ? new Date().toISOString() : null,
          }),
        }),
      }),
    })
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
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
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
          {onOpenMail && <button onClick={onOpenMail} className="btn2" style={{ fontSize: 12.5 }}>✉️ Mail</button>}
          <button onClick={handleExportPdf} disabled={exportingPdf} className="btn2" style={{ fontSize: 12.5 }}>{exportingPdf ? 'Export…' : '⬇ PDF'}</button>
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
            <ReportingPrintDocument reporting={reporting} magasinNom={magasinNom} />
          </div>
        </div>
      ) : (
        <div
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          style={{ flex: 1, overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}
        >
          <div key={clampedIndex} className="reporting-slide-fade" style={{ width: '100%', maxWidth: 680 }}>
            <SlideContent slide={slides[clampedIndex]} structure={structure} reporting={reporting} magasinNom={magasinNom} edit={edit} canToggleDone={canToggleDone} onToggleDone={toggleDone} />
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
    </div>
  )
}
