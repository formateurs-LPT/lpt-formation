'use client'
import { useState, useEffect, useRef } from 'react'
import {
  getMagasinIdBySlug,
} from '@/lib/collaborateursApi'
import {
  getFormateurId, getNotesTerrain, addNoteTerrain, getNotesSemaine,
  getReportingsHebdo, saveReportingHebdo, markReportingEnvoye, currentWeekBounds,
  genererSyntheseSiNecessaire,
} from '@/lib/notesTerrainApi'
import { uploadPieceJointe, getSignedUrl } from '@/lib/storageApi'
import { getDemandesIntervention, rattacherReporting, notifierReportingRattache } from '@/lib/directionApi'

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

export default function MesRetoursView({ store, pName, onBack }) {
  const [magasinId, setMagasinId] = useState(null)
  const [formateurId, setFormateurId] = useState(null)
  const [notes, setNotes] = useState([])
  const [reportings, setReportings] = useState([])
  const [loading, setLoading] = useState(true)

  const [noteText, setNoteText] = useState('')
  const [noteFiles, setNoteFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)

  const [reportingDraft, setReportingDraft] = useState(null) // null = pas encore généré
  const [weekNotesCount, setWeekNotesCount] = useState(0)
  const [savedReporting, setSavedReporting] = useState(null)
  const [showMail, setShowMail] = useState(false)
  const [mailTo, setMailTo] = useState('reporting@lunettespourtous.com')
  const [mailBody, setMailBody] = useState('')
  const [selectedReporting, setSelectedReporting] = useState(null)
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

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [mId, fId] = await Promise.all([getMagasinIdBySlug(store.id), getFormateurId(pName)])
      if (cancelled) return
      setMagasinId(mId)
      setFormateurId(fId)
      if (mId) {
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
    if (!noteText.trim() && noteFiles.length === 0) return
    if (!magasinId || !formateurId) return
    setSaving(true)
    const paths = []
    for (const file of noteFiles) {
      const path = await uploadPieceJointe(file, { magasinId, prefix: 'note' })
      if (path) paths.push(path)
    }
    await addNoteTerrain({
      magasinId, formateurId,
      typeNote: paths.length ? 'media' : 'texte',
      contenu: noteText.trim() || null,
      piecesJointes: paths,
    })
    setNoteText('')
    setNoteFiles([])
    if (fileInputRef.current) fileInputRef.current.value = ''
    await load(magasinId)
    setSaving(false)
  }

  const genererReporting = async () => {
    const weekNotes = await getNotesSemaine(magasinId, formateurId)
    setWeekNotesCount(weekNotes.length)
    if (weekNotes.length === 0) {
      setReportingDraft('')
      return
    }
    // Brouillon simple (concaténation des notes de la semaine) — en attendant
    // le branchement de la génération IA (edge function Claude), le
    // formateur relit et édite avant d'enregistrer. Le bouton "Régénérer"
    // repart de cette même base.
    const lignes = weekNotes.map(n => `- ${fmtDate(n.date)} : ${n.contenu || '(pièce jointe sans texte)'}`)
    setReportingDraft(`Reporting de la semaine :\n\n${lignes.join('\n')}`)
  }

  const enregistrerReporting = async () => {
    if (!reportingDraft?.trim()) return
    const row = await saveReportingHebdo({ formateurId, magasinId, contenuGenere: reportingDraft.trim() })
    setSavedReporting(row)
    if (rattacherDemande && demandeOuverte && row?.id) {
      await rattacherReporting(demandeOuverte.id, row.id)
      await notifierReportingRattache({ ...demandeOuverte, reporting_id: row.id })
    }
    await load(magasinId)
  }

  const ouvrirMail = () => {
    const { debut, fin } = currentWeekBounds()
    const contenu = savedReporting?.contenu_genere || reportingDraft || ''
    setMailBody(
      `Bonjour, voici mon reporting suite à la semaine que j'ai passée sur le shop de ${store.label}.\n\n${contenu}`
    )
    setShowMail(true)
    // eslint-disable-next-line no-unused-vars
    const _unused = fin
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

      {/* Ajouter une note */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
          Ajouter une note
        </div>
        <textarea
          value={noteText} onChange={e => setNoteText(e.target.value)}
          placeholder="Ce que vous avez constaté/fait aujourd'hui sur ce magasin…"
          rows={3}
          className="finput"
          style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', marginBottom: 10 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef} type="file" accept="image/*,video/*" multiple
            onChange={e => setNoteFiles(Array.from(e.target.files || []))}
            style={{ fontSize: 12, color: 'var(--text-s)' }}
          />
          <button onClick={handleAddNote} disabled={saving || (!noteText.trim() && noteFiles.length === 0)} className="gbtn" style={{ marginLeft: 'auto' }}>
            {saving ? 'Enregistrement…' : '+ Ajouter la note'}
          </button>
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
              <div key={n.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', marginBottom: 6 }}>
                  {n.auteur} · {fmtDate(n.date)}
                </div>
                {n.contenu && <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.55, marginBottom: n.pieces_jointes?.length ? 10 : 0 }}>{n.contenu}</div>}
                {n.pieces_jointes?.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {n.pieces_jointes.map((p, i) => <Attachment key={i} path={p} />)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Génération du reporting */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Reporting de la semaine</h3>
          {reportingDraft === null ? (
            <button onClick={genererReporting} className="gbtn">Générer le reporting de la semaine</button>
          ) : (
            <button onClick={genererReporting} className="btn2">↻ Régénérer</button>
          )}
        </div>

        {reportingDraft !== null && (
          weekNotesCount === 0 ? (
            <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucune note cette semaine sur ce magasin — rien à générer.</p>
          ) : (
            <>
              <textarea
                value={reportingDraft} onChange={e => setReportingDraft(e.target.value)}
                rows={8} className="finput"
                style={{ width: '100%', resize: 'vertical', boxSizing: 'border-box', marginBottom: 12, fontFamily: 'inherit' }}
              />
              {demandeOuverte && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-s)', marginBottom: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={rattacherDemande} onChange={e => setRattacherDemande(e.target.checked)} />
                  Rattacher à la demande d&apos;intervention en cours ({demandeOuverte.motif || 'sans motif précisé'})
                </label>
              )}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={enregistrerReporting} className="gbtn">✓ Enregistrer le reporting</button>
                {(savedReporting || reportingDraft) && (
                  <button onClick={ouvrirMail} className="btn2">✉️ Voir le mail</button>
                )}
              </div>
            </>
          )
        )}
      </div>

      {/* Historique des reportings partagé */}
      <div>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Historique des reportings de ce magasin</h3>
        {reportings.length === 0 ? (
          <p style={{ color: 'var(--text-m)', fontSize: 13, fontStyle: 'italic' }}>Aucun reporting envoyé pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reportings.map(r => (
              <button key={r.id} onClick={() => setSelectedReporting(r)} style={{
                textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
                padding: '12px 16px', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  Semaine du {fmtDateLong(r.semaine_debut)} au {fmtDateLong(r.semaine_fin)}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-s)', marginTop: 2 }}>
                  {r.auteur} {r.envoye_at ? `· envoyé le ${fmtDate(r.envoye_at)}` : '· non envoyé'}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Détail d'un reporting */}
      {selectedReporting && (
        <div onClick={() => setSelectedReporting(null)} style={{
          position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18,
            padding: 26, width: '100%', maxWidth: 560, maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', marginBottom: 4 }}>{selectedReporting.auteur}</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 14 }}>
              Semaine du {fmtDateLong(selectedReporting.semaine_debut)} au {fmtDateLong(selectedReporting.semaine_fin)}
            </h3>
            <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 18 }}>
              {selectedReporting.contenu_genere}
            </div>
            <button onClick={() => setSelectedReporting(null)} className="btn2">Fermer</button>
          </div>
        </div>
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
