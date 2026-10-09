'use client'
import { useState, useEffect, useRef } from 'react'
import {
  getMagasinIdBySlug, getCollaborateursByMagasin,
} from '@/lib/collaborateursApi'
import {
  getFormateurId, getNotesTerrain, addNoteTerrain,
  getReportingsHebdo, saveReportingHebdo, markReportingEnvoye, currentWeekBounds,
  genererSyntheseSiNecessaire, updateNoteTerrain, deleteNoteTerrain,
  genererReportingStructure, updateReportingStructure, deleteReportingHebdo,
  saveReportingConfidentiel, getReportingConfidentiel,
} from '@/lib/notesTerrainApi'
import { uploadPieceJointe, getSignedUrl } from '@/lib/storageApi'
import { getDemandesIntervention, rattacherReporting, notifierReportingRattache } from '@/lib/directionApi'
import { envoyerMotsMagasin } from '@/lib/notesCollaborateurApi'
import { POLES, RUBRIQUES, poleMeta, rubriqueMeta, structureToPlainText } from '@/lib/poles'
import CollaborateurMentionPicker from './CollaborateurMentionPicker'
import VoiceNoteRecorder from './VoiceNoteRecorder'
import ReportingDetailView from './ReportingDetailView'

function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '—' }
}

function fmtDateLong(isoDate) {
  if (!isoDate) return '—'
  const s = new Date(`${isoDate}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  return s
}

/** Nombre total d'items dans une structure — même format pour
 * contenuStructure et confidentielStructure. Accepte les deux formes
 * (sections/themes/rubriques/items pour les nouveaux reportings par thème,
 * sections/rubriques/items pour les anciens). */
function countItems(structure) {
  if (!structure?.sections) return 0
  return structure.sections.reduce((n, s) => {
    const rubriqueGroups = s.themes ? s.themes.flatMap(t => t.rubriques) : s.rubriques
    return n + rubriqueGroups.reduce((m, r) => m + r.items.length, 0)
  }, 0)
}

function isVideoPath(path) {
  return /\.(mp4|mov|webm|m4v)$/i.test(path || '')
}

// Pièce jointe : résout son URL signée à l'affichage (bucket privé).
function Attachment({ path }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let cancelled = false
    getSignedUrl(path).then(u => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [path])

  if (!url) return <div style={{ fontSize: 11, color: 'var(--text-m)' }}>Chargement…</div>
  return isVideoPath(path) ? (
    <video src={url} controls style={{ width: 160, height: 110, borderRadius: 10, background: '#000', objectFit: 'cover' }} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="Pièce jointe" style={{ width: 160, height: 110, borderRadius: 10, objectFit: 'cover' }} />
  )
}

// Note de terrain — modification ouverte à tout formateur, suppression
// réservée à l'auteur original (même politique que les notes de suivi
// collaborateur, script 4).
function NoteTerrainRow({ note, canDelete, onSave, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.contenu || '')

  const save = async () => {
    if (!text.trim() || text === note.contenu) { setEditing(false); return }
    await onSave(note.id, text.trim())
    setEditing(false)
  }

  const pm = note.pole ? poleMeta(note.pole) : null
  const rm = note.rubrique ? rubriqueMeta(note.rubrique) : null

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9' }}>{note.auteur} · {fmtDate(note.date)}</div>
          {pm && (
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
              color: pm.color, border: `1px solid ${pm.color}`, background: 'transparent',
            }}>{pm.label}</span>
          )}
          {rm && (
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
              color: rm.color, border: `1px solid ${rm.color}`, background: 'transparent',
            }}>{rm.label}</span>
          )}
          {note.mot_de_la_fin && (
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
              color: '#c4b5fd', border: '1px solid #c4b5fd', background: 'transparent',
            }}>Mot de la fin</span>
          )}
          {note.confidentiel && (
            <span style={{
              fontSize: 10.5, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
              color: '#b45309', border: '1px solid #fcd9a8', background: 'transparent',
            }}>🔒 Confidentiel</span>
          )}
        </div>
        {!editing && (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)} className="btn2" style={{ padding: '4px 10px', fontSize: 11 }}>Modifier</button>
            {canDelete && (
              <button onClick={() => onDelete(note.id)} className="btn2" style={{ padding: '4px 10px', fontSize: 11, color: '#f87171' }}>Supprimer</button>
            )}
          </div>
        )}
      </div>
      {editing ? (
        <div>
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={3} className="finput"
            style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8, fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} className="gbtn" style={{ padding: '4px 12px', fontSize: 12 }}>Enregistrer</button>
            <button onClick={() => { setText(note.contenu || ''); setEditing(false) }} className="btn2" style={{ padding: '4px 12px', fontSize: 12 }}>Annuler</button>
          </div>
        </div>
      ) : (
        note.contenu && <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55, marginBottom: (note.pieces_jointes?.length || note.audio_url) ? 10 : 0 }}>{note.contenu}</div>
      )}
      {!editing && note.audio_url && (
        <AudioAttachment path={note.audio_url} />
      )}
      {!editing && note.pieces_jointes?.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: note.collaborateurs_cites?.length ? 10 : 0 }}>
          {note.pieces_jointes.map((p, i) => <Attachment key={i} path={p} />)}
        </div>
      )}
      {!editing && note.collaborateurs_cites?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {note.collaborateurs_cites.map((c, i) => (
            <span key={c.id || i} style={{
              fontSize: 11, fontWeight: 600, color: '#00abe9', padding: '2px 9px', borderRadius: 20,
              background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.25)',
            }}>@{c.nom}</span>
          ))}
        </div>
      )}
    </div>
  )
}

function AudioAttachment({ path }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let cancelled = false
    getSignedUrl(path).then(u => { if (!cancelled) setUrl(u) })
    return () => { cancelled = true }
  }, [path])
  if (!url) return <div style={{ fontSize: 11, color: 'var(--text-m)', marginBottom: 10 }}>Chargement du vocal…</div>
  return <audio src={url} controls style={{ height: 32, marginBottom: 10, maxWidth: '100%' }} />
}

export default function MesRetoursView({ store, pName, onBack }) {
  const [magasinId, setMagasinId] = useState(null)
  const [formateurId, setFormateurId] = useState(null)
  const [notes, setNotes] = useState([])
  const [reportings, setReportings] = useState([])
  const [loading, setLoading] = useState(true)

  const [noteText, setNoteText] = useState('')
  const [noteFiles, setNoteFiles] = useState([])
  const [notePole, setNotePole] = useState(null)
  const [noteRubrique, setNoteRubrique] = useState(null)
  const [noteTheme, setNoteTheme] = useState('')
  const [noteMotDeLaFin, setNoteMotDeLaFin] = useState(false)
  const [noteCollaborateurs, setNoteCollaborateurs] = useState([])
  const [noteAudioBlob, setNoteAudioBlob] = useState(null)
  const [voiceRecorderKey, setVoiceRecorderKey] = useState(0)
  const [collaborateurs, setCollaborateurs] = useState([])
  const [saving, setSaving] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const fileInputRef = useRef(null)

  // Tuile confidentielle — volontairement minimale (texte seul, pas de
  // pôle/rubrique/mention/pièce jointe), vu la sensibilité du contenu.
  const [noteTextConfidentiel, setNoteTextConfidentiel] = useState('')
  const [savingConfidentiel, setSavingConfidentiel] = useState(false)

  const [draftStructure, setDraftStructure] = useState(null) // null = pas encore généré
  const [draftConfidentiel, setDraftConfidentiel] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const lastGeneratedRef = useRef(null) // snapshot JSON du dernier résultat généré (détecte les édits manuelles)
  const [savedReporting, setSavedReporting] = useState(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [showMail, setShowMail] = useState(false)
  const [mailTo, setMailTo] = useState('reporting@lunettespourtous.com')
  const [mailBody, setMailBody] = useState('')
  const [selectedReporting, setSelectedReporting] = useState(null)
  const [selectedConfidentiel, setSelectedConfidentiel] = useState(null)
  const [updatingSelected, setUpdatingSelected] = useState(false)
  const [demandeOuverte, setDemandeOuverte] = useState(null) // demande d'intervention ouverte sur ce magasin, si existe
  const [rattacherDemande, setRattacherDemande] = useState(false)

  const load = async (mId) => {
    const [n, r, demandes] = await Promise.all([
      getNotesTerrain(mId), getReportingsHebdo(mId), getDemandesIntervention({ magasinIds: [mId] }),
    ])
    setNotes(n)
    setReportings(r)
    setDemandeOuverte(demandes.find(d => d.statut !== 'cloturee') || null)
  }

  const handleSaveNote = async (id, contenu) => {
    await updateNoteTerrain({ id, contenu })
    await load(magasinId)
  }

  const handleDeleteNote = async (id) => {
    await deleteNoteTerrain({ id, requesterId: formateurId })
    await load(magasinId)
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [mId, fId] = await Promise.all([getMagasinIdBySlug(store.id), getFormateurId(pName)])
      if (cancelled) return
      setMagasinId(mId)
      setFormateurId(fId)
      if (mId) {
        getCollaborateursByMagasin(mId).then(rows => { if (!cancelled) setCollaborateurs(rows) })
        // Synthèse hebdo auto (tous formateurs) — pour l'instant réservée au
        // Labo Progressif, seul magasin où plusieurs formateurs peuvent se
        // succéder dans la même semaine sans repasser par le même "Mes
        // retours" individuel.
        if (store.id === 'laboratoire-progressif') await genererSyntheseSiNecessaire(mId)
        await load(mId)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id, pName])

  const handleAddNote = async () => {
    if (!noteText.trim() && noteFiles.length === 0 && !noteAudioBlob) return
    if (!magasinId || !formateurId) return
    setSaving(true)
    const paths = []
    for (const file of noteFiles) {
      const path = await uploadPieceJointe(file, { magasinId, prefix: 'note' })
      if (path) paths.push(path)
    }
    let audioPath = null
    if (noteAudioBlob) {
      const audioFile = new File([noteAudioBlob], `vocal.${(noteAudioBlob.type.split('/')[1] || 'webm').split(';')[0]}`, { type: noteAudioBlob.type })
      audioPath = await uploadPieceJointe(audioFile, { magasinId, prefix: 'audio' })
    }
    await addNoteTerrain({
      magasinId, formateurId,
      typeNote: audioPath ? 'vocale' : (paths.length ? 'media' : 'texte'),
      contenu: noteText.trim() || null,
      audioUrl: audioPath,
      piecesJointes: paths,
      pole: notePole,
      rubrique: noteRubrique,
      theme: noteTheme,
      collaborateursCites: noteCollaborateurs,
      motDeLaFin: noteMotDeLaFin,
      confidentiel: false,
    })
    setNoteText('')
    setNoteFiles([])
    setNotePole(null)
    setNoteRubrique(null)
    setNoteTheme('')
    setNoteMotDeLaFin(false)
    setNoteCollaborateurs([])
    setNoteAudioBlob(null)
    setVoiceRecorderKey(k => k + 1)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await load(magasinId)
    setSaving(false)
  }

  // Tuile confidentielle — texte seul, jamais passé par l'IA (cf.
  // reporting-generate/index.ts, filtre confidentiel=eq.false côté serveur).
  const handleAddNoteConfidentiel = async () => {
    if (!noteTextConfidentiel.trim() || !magasinId || !formateurId) return
    setSavingConfidentiel(true)
    await addNoteTerrain({
      magasinId, formateurId, typeNote: 'texte',
      contenu: noteTextConfidentiel.trim(), confidentiel: true,
    })
    setNoteTextConfidentiel('')
    await load(magasinId)
    setSavingConfidentiel(false)
  }

  const genererReporting = async () => {
    setGenerateError(null)
    setGenerating(true)
    const { debut, fin } = currentWeekBounds()
    const result = await genererReportingStructure({ magasinId, formateurId, semaineDebut: debut, semaineFin: fin })
    setGenerating(false)
    if (!result.ok) { setGenerateError(result.error); return }
    setDraftStructure(result.contenuStructure)
    lastGeneratedRef.current = JSON.stringify(result.contenuStructure)
    setDraftConfidentiel(result.confidentielStructure)
  }

  const regenererReporting = async () => {
    const edited = draftStructure && JSON.stringify(draftStructure) !== lastGeneratedRef.current
    if (edited && !window.confirm('Des modifications manuelles seront perdues en régénérant. Continuer ?')) return
    await genererReporting()
  }

  const publierReporting = async () => {
    if (!draftStructure) return
    setPublishing(true)
    const contenuGenere = structureToPlainText(draftStructure)
    let row
    if (savedReporting?.id) {
      await updateReportingStructure(savedReporting.id, draftStructure)
      row = { ...savedReporting, contenu_structure: draftStructure, contenu_genere: contenuGenere }
    } else {
      row = await saveReportingHebdo({ formateurId, magasinId, contenuGenere, contenuStructure: draftStructure })
    }
    setSavedReporting(row)
    if (countItems(draftConfidentiel) > 0 && row?.id) {
      await saveReportingConfidentiel({ reportingId: row.id, contenuStructure: draftConfidentiel })
    }
    if (rattacherDemande && demandeOuverte && row?.id) {
      await rattacherReporting(demandeOuverte.id, row.id)
      await notifierReportingRattache({ ...demandeOuverte, reporting_id: row.id })
    }
    // Chaque collaborateur ayant des mots en attente (CollaborateurNotesSection.js)
    // les reçoit maintenant : notif + fil de discussion, plus rien à envoyer à la main.
    await envoyerMotsMagasin({ magasinId, formateurId })
    await load(magasinId)
    setPublishing(false)
  }

  // Modification d'un reporting déjà publié, consulté depuis l'historique —
  // réservée à son auteur (vérifié par le parent avant d'exposer ce handler).
  const handleUpdateSelectedReporting = async () => {
    if (!selectedReporting) return
    setUpdatingSelected(true)
    await updateReportingStructure(selectedReporting.id, selectedReporting.contenu_structure)
    await load(magasinId)
    setUpdatingSelected(false)
  }

  const handleDeleteSelectedReporting = async () => {
    if (!selectedReporting || !window.confirm('Supprimer ce reporting définitivement ?')) return
    await deleteReportingHebdo({ id: selectedReporting.id, formateurId })
    setSelectedReporting(null)
    setSelectedConfidentiel(null)
    await load(magasinId)
  }

  // Les formateurs voient le confidentiel de leur historique sans ressaisie —
  // ce sont les auteurs de ce contenu (même niveau de confiance que les
  // notes_terrain brutes, déjà partagées entre tous les formateurs). Seul le
  // manager passe par la ressaisie de code (cf. HistoriqueReportingsSection).
  const openReporting = async (r) => {
    setSelectedReporting(r)
    setSelectedConfidentiel(await getReportingConfidentiel(r.id))
  }

  const ouvrirMail = () => {
    const contenu = structureToPlainText(draftStructure) || savedReporting?.contenu_genere || ''
    setMailBody(
      `Bonjour, voici mon reporting suite à la semaine que j'ai passée sur le shop de ${store.label}.\n\n${contenu}`
    )
    setShowMail(true)
  }

  const envoyerMail = async () => {
    const { debut, fin } = currentWeekBounds()
    const subject = encodeURIComponent(`Reporting semaine du ${fmtDateLong(debut)} au ${fmtDateLong(fin)} – ${store.label}`)
    const body = encodeURIComponent(mailBody)
    window.location.href = `mailto:${mailTo}?subject=${subject}&body=${body}`
    if (savedReporting?.id) await markReportingEnvoye(savedReporting.id)
    setShowMail(false)
  }

  if (loading) return <div className="dash-wrap"><p style={{ color: 'var(--text-s)' }}>Chargement…</p></div>

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← {store.label}</button>
      <div className="dash-header">
        <div>
          <h2>📓 Mes retours</h2>
          <p>Notes terrain et reporting hebdo — {store.label}, partagés entre tous les formateurs</p>
        </div>
      </div>

      <div className="reporting-light-theme" style={{ borderRadius: 18, padding: 20, marginBottom: 8 }}>

      {/* Deux tuiles sobres — commentaires publics / confidentiels (manager
          uniquement, cf. plan). Options avancées (pôle/rubrique/mention/pièce
          jointe/vocal) repliées par défaut, disponibles via "+ options". */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
        <div className="reporting-tile">
          <div className="reporting-tile-label">💬 Commentaires</div>
          <CollaborateurMentionPicker
            value={noteText}
            onChange={setNoteText}
            collaborateurs={collaborateurs}
            cited={noteCollaborateurs}
            onCitedChange={setNoteCollaborateurs}
            placeholder="Ce que vous avez constaté/fait aujourd'hui sur ce magasin… (tapez @ pour citer un collaborateur)"
            rows={3}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setShowOptions(o => !o)} className="btn2" style={{ fontSize: 12 }}>
              {showOptions ? '– Options' : '+ Options (pôle, rubrique, photo, vocal…)'}
            </button>
            <button onClick={handleAddNote} disabled={saving || (!noteText.trim() && noteFiles.length === 0 && !noteAudioBlob)} className="gbtn" style={{ marginLeft: 'auto' }}>
              {saving ? 'Enregistrement…' : '+ Ajouter'}
            </button>
          </div>

          {showOptions && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {POLES.map(p => (
                  <button
                    key={p.id} type="button" onClick={() => setNotePole(notePole === p.id ? null : p.id)}
                    style={{
                      padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      background: notePole === p.id ? `color-mix(in srgb, ${p.color} 18%, transparent)` : 'transparent',
                      border: `1px solid ${notePole === p.id ? p.color : 'var(--border)'}`,
                      color: notePole === p.id ? p.color : 'var(--text-s)',
                    }}
                  >{p.label}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {RUBRIQUES.map(r => (
                  <button
                    key={r.id} type="button" onClick={() => setNoteRubrique(noteRubrique === r.id ? null : r.id)}
                    style={{
                      padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      background: noteRubrique === r.id ? `color-mix(in srgb, ${r.color} 18%, transparent)` : 'transparent',
                      border: `1px solid ${noteRubrique === r.id ? r.color : 'var(--border)'}`,
                      color: noteRubrique === r.id ? r.color : 'var(--text-s)',
                    }}
                  >{r.label}</button>
                ))}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', cursor: 'pointer',
                  fontSize: 12, color: noteMotDeLaFin ? '#c4b5fd' : 'var(--text-s)', fontWeight: 700,
                }}>
                  <input type="checkbox" checked={noteMotDeLaFin} onChange={e => setNoteMotDeLaFin(e.target.checked)} style={{ accentColor: '#c4b5fd' }} />
                  Mot de la fin
                </label>
              </div>
              <input
                value={noteTheme} onChange={e => setNoteTheme(e.target.value)} className="finput"
                placeholder="Thème (optionnel) — ex: SMS de paire prête, Casiers Outlet…"
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <input
                  ref={fileInputRef} type="file" accept="image/*,video/*" multiple
                  onChange={e => setNoteFiles(Array.from(e.target.files || []))}
                  style={{ fontSize: 12, color: 'var(--text-s)' }}
                />
                <VoiceNoteRecorder
                  key={voiceRecorderKey}
                  onRecorded={setNoteAudioBlob}
                  onClear={() => setNoteAudioBlob(null)}
                  onTranscript={text => setNoteText(prev => prev.trim() ? `${prev.trim()} ${text}` : text)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="reporting-tile reporting-tile-confidentiel">
          <div className="reporting-tile-label">🔒 Commentaires confidentiels</div>
          <p style={{ fontSize: 11.5, color: 'var(--text-m)', marginTop: -4, marginBottom: 10 }}>
            Visibles uniquement par le manager dans le reporting final (ex. un point RH sensible) — jamais par les collaborateurs, jamais traités par une IA.
          </p>
          <textarea
            value={noteTextConfidentiel} onChange={e => setNoteTextConfidentiel(e.target.value)} rows={3} className="finput"
            placeholder="Note confidentielle, réservée au manager…"
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: 10 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleAddNoteConfidentiel} disabled={savingConfidentiel || !noteTextConfidentiel.trim()} className="gbtn">
              {savingConfidentiel ? 'Enregistrement…' : '+ Ajouter'}
            </button>
          </div>
        </div>
      </div>

      {/* Historique des notes */}
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Historique des notes</h3>
        {notes.length === 0 ? (
          <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucune note pour ce magasin pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notes.map(n => (
              <NoteTerrainRow
                key={n.id} note={n}
                canDelete={n.formateur_id === formateurId}
                onSave={handleSaveNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        )}
      </div>

      {/* Génération du reporting */}
      <div className="reporting-tile" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Reporting de la semaine</h3>
          {draftStructure === null ? (
            <button onClick={genererReporting} disabled={generating} className="gbtn">
              {generating ? 'Génération…' : 'Générer le reporting de la semaine'}
            </button>
          ) : (
            <button onClick={regenererReporting} disabled={generating} className="btn2">{generating ? 'Génération…' : '↻ Régénérer'}</button>
          )}
        </div>

        {generateError && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>{generateError}</p>
        )}

        {draftStructure && (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-s)', marginBottom: 14 }}>
              ✓ Reporting généré — {countItems(draftStructure)} point(s)
              {countItems(draftConfidentiel) > 0 ? ` + ${countItems(draftConfidentiel)} confidentiel(s)` : ''}.
              {savedReporting?.id ? ' Déjà publié — tu peux continuer à le modifier.' : ' Vérifie-le avant de publier.'}
            </p>
            {demandeOuverte && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-s)', marginBottom: 14, cursor: 'pointer' }}>
                <input type="checkbox" checked={rattacherDemande} onChange={e => setRattacherDemande(e.target.checked)} />
                Rattacher à la demande d&apos;intervention en cours ({demandeOuverte.motif || 'sans motif précisé'})
              </label>
            )}
            <button onClick={() => setPreviewOpen(true)} className="gbtn">👁️ Aperçu</button>
          </>
        )}
      </div>

      {previewOpen && draftStructure && (
        <ReportingDetailView
          reporting={{
            id: savedReporting?.id, contenu_structure: draftStructure,
            semaine_debut: currentWeekBounds().debut, semaine_fin: currentWeekBounds().fin, auteur: pName,
          }}
          magasinNom={store.label}
          canEdit
          onChange={setDraftStructure}
          onClose={() => setPreviewOpen(false)}
          onPublish={publierReporting}
          publishing={publishing}
          published={!!savedReporting?.id}
          onOpenMail={ouvrirMail}
          confidentialStructure={draftConfidentiel}
        />
      )}

      {/* Historique des reportings partagé */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Historique des reportings de ce magasin</h3>
        {reportings.length === 0 ? (
          <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucun reporting envoyé pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reportings.map(r => (
              <button key={r.id} onClick={() => openReporting(r)} className="reporting-tile" style={{
                textAlign: 'left', padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  Semaine du {fmtDateLong(r.semaine_debut)} au {fmtDateLong(r.semaine_fin)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-s)' }}>{r.auteur}</span>
                  <span className={`badge ${r.envoye_at ? 'ok' : 'pending'}`}>{r.envoye_at ? `Envoyé le ${fmtDate(r.envoye_at)}` : 'Non envoyé'}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      </div>

      {/* Détail d'un reporting déjà publié — modifiable par son auteur uniquement */}
      {selectedReporting && (
        <ReportingDetailView
          reporting={selectedReporting}
          magasinNom={store.label}
          canEdit={selectedReporting.formateur_id === formateurId}
          onChange={next => setSelectedReporting(prev => prev ? { ...prev, contenu_structure: next } : prev)}
          onClose={() => { setSelectedReporting(null); setSelectedConfidentiel(null) }}
          onPublish={selectedReporting.formateur_id === formateurId ? handleUpdateSelectedReporting : undefined}
          onDelete={selectedReporting.formateur_id === formateurId ? handleDeleteSelectedReporting : undefined}
          publishing={updatingSelected}
          published
          confidentialStructure={selectedConfidentiel}
        />
      )}

      {/* Mail */}
      {showMail && (
        <div onClick={() => setShowMail(false)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18,
            padding: 26, width: '100%', maxWidth: 560,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 16 }}>✉️ Voir le mail</h3>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Destinataire(s)</label>
            <input
              value={mailTo} onChange={e => setMailTo(e.target.value)}
              className="finput" style={{ width: '100%', boxSizing: 'border-box', marginBottom: 14 }}
            />
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4 }}>Message</label>
            <textarea
              value={mailBody} onChange={e => setMailBody(e.target.value)}
              rows={10} className="finput"
              style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', marginBottom: 16, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={envoyerMail} className="gbtn" style={{ flex: 1 }}>Envoyer</button>
              <button onClick={() => setShowMail(false)} className="btn2">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
