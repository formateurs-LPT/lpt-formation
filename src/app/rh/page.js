'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { getTrainerCredentials } from '@/lib/env'
import {
  apiGetEntreesRhByWeek, apiAddEntreeRh, apiUpdateEntreeRh, apiDeleteEntreeRh,
  apiGetDossiersEntree, apiUpsertDocumentEntree,
  apiGetCandidats, apiAddCandidat, apiUpdateCandidat, apiDeleteCandidat,
  apiAddHistorique, apiGetHistorique,
  apiGetDossiersCandidats, apiUpsertDocumentCandidat,
  apiValiderCandidat, apiSyncFormateur,
  apiCheckCandidatArchive, apiArchiverCandidat,
  apiGetManagerByMagasinId, apiNotifier,
  apiGetEntretiensByCandidat, apiCreerEntretien, apiContreProposerEntretien,
  apiConfirmerContreProposition, apiSupprimerEntretien,
  apiGetMagasinInfo, apiGetEntree, apiMarquerMailBienvenueEnvoye, apiMarquerAccesEnvoye,
  apiGetEntretiensActifs, apiMarquerStatutContrat,
} from '@/lib/rhApi'
import { STORES, STORE_REGION_GROUPS } from '@/lib/storeFollowupData'
import { getMagasinIdBySlug, slugifyName, stripAccents, creerCompteCollaborateur, findCollaborateurByName } from '@/lib/collaborateursApi'
import { uploadPieceJointe, getSignedUrl, RH_DOCUMENTS_BUCKET, FICHIER_CONSTANT_PRESENTATION, uploadFichierConstant } from '@/lib/storageApi'
import { getDocsRequis, computeStatut } from '@/lib/dossierDocuments'
import { FileViewButton, FileDropSlot } from '@/components/FileDropSlot'
import RhSidebar from '@/components/RhSidebar'

const SESSION_KEY = 'rh_session'
const RH_DISPLAY_NAMES = { kevin: 'Kevin Dupuy', quentin: 'Quentin Bahougne' }
const STORE_OPTIONS = STORES.map(s => ({ id: s.id, label: s.label }))
const POSTE_OPTIONS = ['CVO', 'MO/SAV', 'OPTICIEN', 'STORE MANAGER', 'Alternant']
const HEURES_SUGGESTIONS = ['35', '24', '28', '18', '8']

// ── Documents (liste + calcul de statut partagés avec l'espace collaborateur) ──
// ── Pipeline ──────────────────────────────────────────────────────────────────
// 'a_contacter' n'est plus utilisé (contact toujours fait avant création de
// la fiche) — gardé dans STATUT_LABELS/STATUT_COLORS pour l'historique/anciennes fiches.
// 'entretien_manager' n'est plus une étape à avancer manuellement : la
// planification réelle se fait via "Planifier un entretien" (entretiens_recrutement) ;
// gardé aussi dans STATUT_LABELS/STATUT_COLORS pour l'historique.
const PIPELINE = ['contacte', 'prise_de_reference']
const STATUT_LABELS = {
  a_contacter: 'À contacter', contacte: 'Contacté',
  prise_de_reference: 'Prise de référence', entretien_manager: 'Entretien manager',
  valide: 'Validé', refuse: 'Refusé',
}
const STATUT_COLORS = {
  a_contacter:        { bg: '#f0f1f3', color: '#6b7280', border: '#e5e7eb' },
  contacte:           { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  prise_de_reference: { bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  entretien_manager:  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  valide:             { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  refuse:             { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
}
const nextStatut = s => { const i = PIPELINE.indexOf(s); return i >= 0 && i < PIPELINE.length - 1 ? PIPELINE[i + 1] : null }

// ── Semaines ──────────────────────────────────────────────────────────────────
function toLocalDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function getMondayStr(offsetWeeks = 0) {
  const d = new Date(); const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1) + offsetWeeks * 7)
  return toLocalDateStr(d)
}
/** Lundi de la semaine contenant une date donnée (yyyy-mm-dd) — pour dériver
 * semaine_lundi à partir d'une date d'entrée exacte plutôt qu'un choix manuel. */
function mondayOfDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00'); const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  return toLocalDateStr(d)
}
/** "mardi 21/07/2026" */
function formatDateLettresJour(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  const jour = d.toLocaleDateString('fr-FR', { weekday: 'long' })
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${jour} ${dd}/${mm}/${d.getFullYear()}`
}
function getISOWeek(mondayStr) {
  const d = new Date(mondayStr + 'T12:00:00')
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  return Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7)
}
function weekDateRange(mondayStr) {
  const d = new Date(mondayStr + 'T12:00:00'); const v = new Date(d); v.setDate(d.getDate() + 4)
  const fmt = x => x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  return `${fmt(d)} – ${fmt(v)}`
}

// ── Entretiens de recrutement ───────────────────────────────────────────────
function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
/** Déduit le magasin (id relationnel) et le manager destinataire à partir du
 * libellé de magasin saisi sur la fiche candidat (même logique que
 * session.magasin ailleurs dans l'app : STORES.id === magasins.slug). */
async function resolveManagerForCandidat(magasinLabel) {
  const store = STORES.find(s => s.label === magasinLabel)
  if (!store) return { magasinId: null, manager: null }
  const magasinId = await getMagasinIdBySlug(store.id)
  if (!magasinId) return { magasinId: null, manager: null }
  const manager = await apiGetManagerByMagasinId(magasinId)
  return { magasinId, manager }
}
/** Région (Nord/Sud/Belgique, cf. STORE_REGION_GROUPS déjà utilisé par
 * l'écran "Suivi magasin") du magasin porté par un candidat/une entrée. */
function magasinRegionId(magasinLabel) {
  const store = STORES.find(s => s.label === magasinLabel)
  if (!store) return null
  return STORE_REGION_GROUPS.find(g => g.storeIds.includes(store.id))?.id || null
}
const REGION_FILTERS = [{ id: 'tous', label: 'Toutes régions', emoji: '🗺️' }, ...STORE_REGION_GROUPS]

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = {
  input: { width:'100%', boxSizing:'border-box', padding:'10px 12px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:8, color:'#14161a', fontSize:14, fontFamily:'inherit', outline:'none' },
  label: { display:'block', fontSize:11.5, fontWeight:700, color:'#6b7280', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 },
  btn: { padding:'10px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13.5, fontWeight:700, fontFamily:'inherit' },
}
const Field = ({ label, children }) => <div style={{ marginBottom:16 }}><label style={CSS.label}>{label}</label>{children}</div>
const PageHeader = ({ title }) => <h2 style={{ fontSize:20, fontWeight:800, color:'#14161a', margin:'0 0 20px' }}>{title}</h2>

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, width = 560, children }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn); return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(15,25,35,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f0f1f3', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#14161a' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#9aa1ac', lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────
function StatusBadge({ statut }) {
  const ok = statut === 'complet'
  return <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:20, fontSize:11.5, fontWeight:700, background:ok?'#dcfce7':'#fff7ed', color:ok?'#15803d':'#c2410c', border:`1px solid ${ok?'#86efac':'#fed7aa'}` }}>{ok ? '✓ Complet' : '○ Incomplet'}</span>
}
function StatutPill({ statut }) {
  const c = STATUT_COLORS[statut] || STATUT_COLORS.a_contacter
  return <span style={{ display:'inline-flex', padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:700, background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>{STATUT_LABELS[statut] || statut}</span>
}

// Résumé lisible de l'entretien le plus récent d'un candidat, affiché
// directement sur chaque ligne de la liste recrutement — avant, il fallait
// rouvrir chaque fiche une par une pour savoir si un manager avait répondu.
function entretienBadgeMeta(entretien) {
  if (!entretien) return null
  if (entretien.decision_candidat === 'accepte') return { label: '✓ Manager OK — à valider', bg: '#dcfce7', color: '#15803d', border: '#86efac' }
  if (entretien.decision_candidat === 'refuse') return { label: '✕ Manager a refusé', bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' }
  if (entretien.statut === 'contre_proposition_en_attente') return { label: '🔁 Contre-proposition', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }
  return { label: '⏳ En attente manager', bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' }
}
function EntretienBadge({ entretien }) {
  const meta = entretienBadgeMeta(entretien)
  if (!meta) return null
  return <span style={{ fontSize:11.5, fontWeight:700, color:meta.color, background:meta.bg, padding:'3px 8px', borderRadius:6, border:`1px solid ${meta.border}` }}>{meta.label}</span>
}

// Ligne "document requis" du dossier RH — coche manuelle tant qu'aucun
// fichier n'est attaché ; glisser-déposer (ou clic) pour attacher un
// fichier, ce qui coche automatiquement "Reçu" ; Voir/Supprimer une fois attaché.
function DocumentDropRow({ label, rempli, path, uploading, onToggle, onFiles, onRemove }) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)
  const hasFile = !!path
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files) }}
      style={{
        display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', marginBottom:6, borderRadius:8, gap:10,
        background:dragOver ? '#eaf3fd' : (rempli ? '#f0fdf4' : '#fff'),
        border:`1.5px dashed ${dragOver ? '#00abe9' : (rempli ? '#86efac' : '#e5e7eb')}`,
      }}
    >
      <div onClick={() => !hasFile && onToggle()} style={{ display:'flex', alignItems:'center', gap:10, cursor:hasFile ? 'default' : 'pointer', minWidth:0, flex:1 }}>
        <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, background:rempli?'#22c55e':'#fff', border:`2px solid ${rempli?'#22c55e':'#cbd5e1'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          {rempli && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
        </div>
        <span style={{ fontSize:13.5, color:rempli?'#166534':'#374151' }}>{label}</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
        {uploading ? (
          <span style={{ fontSize:11.5, color:'#9aa1ac' }}>Envoi…</span>
        ) : hasFile ? (
          <>
            <FileViewButton path={path} />
            <button type="button" onClick={onRemove} title="Supprimer" style={{ ...CSS.btn, padding:'5px 9px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:12 }}>🗑️</button>
          </>
        ) : (
          <label style={{ fontSize:11.5, fontWeight:600, color:'#0089ba', cursor:'pointer' }} onClick={e => e.stopPropagation()}>
            📎 Joindre
            <input ref={inputRef} type="file" accept=".pdf,.doc,.docx,image/*" style={{ display:'none' }} onChange={e => onFiles(e.target.files)} />
          </label>
        )}
      </div>
    </div>
  )
}

// ── Fiche documents (entree ou candidat) ──────────────────────────────────────
function FicheDocuments({ entity, entityType, onClose, onStatutChange }) {
  const [dossiers, setDossiers] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const rows = entityType === 'entree' ? await apiGetDossiersEntree(entity.id) : await apiGetDossiersCandidats(entity.id)
    setDossiers(rows); setLoading(false)
  }, [entity.id, entityType])

  useEffect(() => { load() }, [load])

  const [uploadingDoc, setUploadingDoc] = useState(null) // type_document en cours d'envoi

  // rempli obligatoire ; fichierUrl optionnel — undefined = ne touche pas au
  // fichier déjà attaché (cochage manuel), string|null = attache/retire un fichier.
  const applyChange = async (typeDoc, rempli, fichierUrl) => {
    setDossiers(prev => prev.map(d => d.type_document === typeDoc
      ? { ...d, rempli, ...(fichierUrl !== undefined ? { fichier_url: fichierUrl } : {}) }
      : d))
    const upsertFn = entityType === 'entree' ? apiUpsertDocumentEntree : apiUpsertDocumentCandidat
    const getFn = entityType === 'entree' ? apiGetDossiersEntree : apiGetDossiersCandidats
    const updateFn = entityType === 'entree' ? apiUpdateEntreeRh : apiUpdateCandidat
    await upsertFn(entity.id, typeDoc, rempli, fichierUrl)
    const allDocs = await getFn(entity.id)
    const newStatut = computeStatut(entity, allDocs)
    await updateFn(entity.id, { statut_documents: newStatut })
    onStatutChange?.(entity.id, newStatut); setDossiers(allDocs)
  }

  const toggle = (typeDoc, currentVal) => applyChange(typeDoc, !currentVal)

  const uploadDoc = async (typeDoc, files) => {
    const file = files?.[0]
    if (!file) return
    setUploadingDoc(typeDoc)
    const path = await uploadPieceJointe(file, { prefix: typeDoc, bucket: RH_DOCUMENTS_BUCKET })
    setUploadingDoc(null)
    if (path) await applyChange(typeDoc, true, path)
  }

  const removeDoc = typeDoc => applyChange(typeDoc, false, null)

  const docs = getDocsRequis(entity)
  const getDoc = id => dossiers.find(d => d.type_document === id) || { rempli: false, fichier_url: null }
  const statut = computeStatut(entity, dossiers)

  return (
    <Modal title={`Dossier — ${entity.prenom} ${entity.nom}`} onClose={onClose} width={520}>
      <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#14161a' }}>{entity.prenom} {entity.nom}</div>
          <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{entity.magasin || entity.magasin_vise || '—'} · {entity.poste || entity.poste_vise || '—'}</div>
        </div>
        <StatusBadge statut={statut} />
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'24px 0', color:'#9aa1ac' }}>Chargement…</div> : (
        <>
          <div style={{ marginBottom:14 }}>
            {docs.map(doc => {
              const d = getDoc(doc.id)
              return (
                <DocumentDropRow
                  key={doc.id}
                  label={doc.label}
                  rempli={d.rempli}
                  path={d.fichier_url}
                  uploading={uploadingDoc === doc.id}
                  onToggle={() => toggle(doc.id, d.rempli)}
                  onFiles={files => uploadDoc(doc.id, files)}
                  onRemove={() => removeDoc(doc.id)}
                />
              )
            })}
          </div>
          <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Contact urgence</div>
            {entity.contact_urgence_nom || entity.contact_urgence_telephone
              ? <div style={{ fontSize:13.5, color:'#14161a' }}><span style={{ fontWeight:600 }}>{entity.contact_urgence_nom}</span>{entity.contact_urgence_telephone && <span style={{ color:'#6b7280' }}> — {entity.contact_urgence_telephone}</span>}</div>
              : <div style={{ fontSize:13, color:'#9aa1ac', fontStyle:'italic' }}>Non renseigné</div>}
          </div>
        </>
      )}
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RECRUTEMENT
// ─────────────────────────────────────────────────────────────────────────────

function CandidatFormModal({ initial, session, onSave, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    nom: initial?.nom || '', prenom: initial?.prenom || '',
    telephone: initial?.telephone || '', email: initial?.email || '',
    magasin: initial?.magasin || '', poste_vise: initial?.poste_vise || '',
    heures_envisagees: initial?.heures_envisagees || '',
    mode_domicile: initial?.mode_domicile || 'personnel',
    rqth_applicable: initial?.rqth_applicable || false,
    contact_urgence_nom: initial?.contact_urgence_nom || '',
    contact_urgence_telephone: initial?.contact_urgence_telephone || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [cvFile, setCvFile] = useState(null)
  const [cvRemoved, setCvRemoved] = useState(false)
  const [lettreFile, setLettreFile] = useState(null)
  const [lettreRemoved, setLettreRemoved] = useState(false)
  const [archiveWarning, setArchiveWarning] = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const checkArchive = async () => {
    if (isEdit || !form.nom.trim() || !form.prenom.trim()) return
    const match = await apiCheckCandidatArchive(slugifyName(form.prenom, form.nom))
    setArchiveWarning(match)
  }

  const submit = async e => {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim() || !form.telephone.trim()) { setError('Nom, prénom et téléphone sont obligatoires.'); return }
    setSaving(true); setError('')
    let cv_url = cvRemoved ? null : (initial?.cv_url || null)
    if (cvFile) {
      const path = await uploadPieceJointe(cvFile, { prefix: 'cv', bucket: RH_DOCUMENTS_BUCKET })
      if (path) cv_url = path
    }
    let lettre_motivation_url = lettreRemoved ? null : (initial?.lettre_motivation_url || null)
    if (lettreFile) {
      const path = await uploadPieceJointe(lettreFile, { prefix: 'lettre', bucket: RH_DOCUMENTS_BUCKET })
      if (path) lettre_motivation_url = path
    }
    await onSave({ ...form, cv_url, lettre_motivation_url, nom: form.nom.trim().toUpperCase(), prenom: form.prenom.trim(), cree_par: session.login })
    setSaving(false)
  }

  return (
    <Modal title={isEdit ? 'Modifier le candidat' : 'Ajouter un candidat'} onClose={onClose} width={580}>
      <form onSubmit={submit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <Field label="Nom"><input style={CSS.input} value={form.nom} onChange={e => set('nom', e.target.value)} onBlur={checkArchive} placeholder="NOM" /></Field>
          <Field label="Prénom"><input style={CSS.input} value={form.prenom} onChange={e => set('prenom', e.target.value)} onBlur={checkArchive} placeholder="Prénom" /></Field>
        </div>
        {archiveWarning && (
          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'10px 14px', marginBottom:14, fontSize:13, color:'#9a3412' }}>
            ⚠️ Ce candidat a déjà été refusé le {new Date(archiveWarning.date_refus).toLocaleDateString('fr-FR')}
            {archiveWarning.motif ? <> — <em>{archiveWarning.motif}</em></> : null}
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <Field label="Téléphone"><input style={CSS.input} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 xx xx xx xx" /></Field>
          <Field label="Email (optionnel)"><input style={CSS.input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" /></Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <Field label="Magasin visé">
            <select style={CSS.input} value={form.magasin} onChange={e => set('magasin', e.target.value)}>
              <option value="">— Pas encore su —</option>
              {STORE_OPTIONS.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Poste visé">
            <select style={CSS.input} value={form.poste_vise} onChange={e => set('poste_vise', e.target.value)}>
              <option value="">— Choisir —</option>
              {POSTE_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
        </div>
        {isEdit && (
          <div style={{ marginBottom:16 }}>
            <Field label="Heures envisagées (contrat)">
              <input style={{ ...CSS.input, maxWidth:200 }} list="heures-suggestions-candidat" value={form.heures_envisagees} onChange={e => set('heures_envisagees', e.target.value)} placeholder="Ex: 35" />
              <datalist id="heures-suggestions-candidat">{HEURES_SUGGESTIONS.map(h => <option key={h} value={h} />)}</datalist>
            </Field>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <FileDropSlot
            label="CV — requis pour l'entretien"
            path={!cvFile && !cvRemoved ? (initial?.cv_url || null) : null}
            staged={!!cvFile}
            onFiles={files => { const f = files?.[0]; if (f) { setCvFile(f); setCvRemoved(false) } }}
            onRemove={() => { setCvFile(null); setCvRemoved(true) }}
          />
          <FileDropSlot
            label="Lettre de motivation (optionnelle)"
            path={!lettreFile && !lettreRemoved ? (initial?.lettre_motivation_url || null) : null}
            staged={!!lettreFile}
            onFiles={files => { const f = files?.[0]; if (f) { setLettreFile(f); setLettreRemoved(false) } }}
            onRemove={() => { setLettreFile(null); setLettreRemoved(true) }}
          />
        </div>
        {isEdit && (
          <>
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
              <div style={{ ...CSS.label, marginBottom:8 }}>Domicile</div>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
                {['personnel','heberge'].map(v => (
                  <label key={v} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13.5, fontWeight:form.mode_domicile===v?700:400 }}>
                    <input type="radio" name="md_c" checked={form.mode_domicile===v} onChange={() => set('mode_domicile', v)} />{v==='personnel'?'Personnel':'Hébergé'}
                  </label>
                ))}
                <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13.5 }}>
                  <input type="checkbox" checked={form.rqth_applicable} onChange={e => set('rqth_applicable', e.target.checked)} />RQTH
                </label>
              </div>
            </div>
            <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px', marginBottom:18 }}>
              <div style={{ ...CSS.label, color:'#0369a1', marginBottom:8 }}>Contact urgence</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
                <input style={CSS.input} value={form.contact_urgence_nom} onChange={e => set('contact_urgence_nom', e.target.value)} placeholder="Nom" />
                <input style={CSS.input} value={form.contact_urgence_telephone} onChange={e => set('contact_urgence_telephone', e.target.value)} placeholder="Téléphone" />
              </div>
            </div>
          </>
        )}
        {error && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12, padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button type="button" onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
          <button type="submit" disabled={saving} style={{ ...CSS.btn, background:saving?'#9aa1ac':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>{saving?'Enregistrement…':isEdit?'Enregistrer':'Ajouter'}</button>
        </div>
      </form>
    </Modal>
  )
}

function AvancerStatutModal({ candidat, onConfirm, onClose }) {
  const next = nextStatut(candidat.statut)
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  if (!next) return null
  return (
    <Modal title={`Passer à "${STATUT_LABELS[next]}"`} onClose={onClose} width={440}>
      <p style={{ margin:'0 0 16px', fontSize:14, color:'#6b7280', lineHeight:1.6 }}>
        <strong>{candidat.prenom} {candidat.nom}</strong> passera de <StatutPill statut={candidat.statut} /> à <StatutPill statut={next} />.
      </p>
      <Field label="Note (optionnelle)">
        <textarea style={{ ...CSS.input, height:80, resize:'vertical' }} value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Résultat, remarques…" />
      </Field>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
        <button disabled={saving} onClick={async () => { setSaving(true); await onConfirm(next, commentaire); setSaving(false) }} style={{ ...CSS.btn, background:saving?'#9aa1ac':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>
          {saving ? '…' : `Passer à "${STATUT_LABELS[next]}"`}
        </button>
      </div>
    </Modal>
  )
}

function RefuserModal({ candidat, onConfirm, onClose }) {
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  return (
    <Modal title="Refuser le candidat" onClose={onClose} width={420}>
      <p style={{ margin:'0 0 16px', fontSize:14, color:'#6b7280' }}>
        <strong>{candidat.prenom} {candidat.nom}</strong> sera marqué refusé et sortira de la liste active.
      </p>
      <Field label="Motif (optionnel)">
        <textarea style={{ ...CSS.input, height:70, resize:'vertical' }} value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Motif du refus…" />
      </Field>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
        <button disabled={saving} onClick={async () => { setSaving(true); await onConfirm(commentaire); setSaving(false) }} style={{ ...CSS.btn, background:saving?'#9aa1ac':'#ef4444', color:'#fff' }}>
          {saving ? '…' : 'Confirmer le refus'}
        </button>
      </div>
    </Modal>
  )
}

function ValiderRecrutementModal({ candidat, session, onConfirm, onClose }) {
  const s1 = getMondayStr(1) // dernier lundi couvert par l'onglet "Semaine suivante"
  const [form, setForm] = useState({
    date_entree: '', heures: candidat.heures_envisagees || '',
    contact_urgence_nom: candidat.contact_urgence_nom || '',
    contact_urgence_telephone: candidat.contact_urgence_telephone || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const semaine = form.date_entree ? mondayOfDate(form.date_entree) : null
  const horsFenetre = semaine && semaine > s1 // au-delà de la semaine suivante

  const submit = async () => {
    if (!form.date_entree) { setError("Sélectionnez la date d'entrée exacte."); return }
    setSaving(true); setError('')
    await onConfirm({ semaine, form }); setSaving(false)
  }

  return (
    <Modal title="Ajouter aux entrées" onClose={onClose} width={520}>
      <div style={{ marginBottom:18, padding:'12px 14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10 }}>
        <div style={{ fontWeight:700, color:'#166534' }}>{candidat.prenom} {candidat.nom}</div>
        <div style={{ fontSize:12.5, color:'#16a34a', marginTop:2 }}>{candidat.magasin || '—'} · {candidat.poste_vise || '—'}</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
        <Field label="Date d'entrée exacte">
          <input style={CSS.input} type="date" value={form.date_entree} onChange={e => set('date_entree', e.target.value)} />
        </Field>
        <Field label={`Heures / semaine${!form.heures.trim() ? ' ⚠️' : ''}`}>
          <input style={{ ...CSS.input, borderColor:!form.heures.trim()?'#fbbf24':'#e5e7eb' }} list="heures-suggestions-valider" value={form.heures} onChange={e => set('heures', e.target.value)} placeholder="Ex: 35" />
          <datalist id="heures-suggestions-valider">{HEURES_SUGGESTIONS.map(h => <option key={h} value={h} />)}</datalist>
        </Field>
      </div>
      {semaine && (
        <div style={{ marginBottom:16, padding:'10px 14px', borderRadius:10, fontSize:12.5, background:horsFenetre?'#eff6ff':'#f0f9ff', border:`1px solid ${horsFenetre?'#bfdbfe':'#bae6fd'}`, color:horsFenetre?'#1d4ed8':'#0369a1' }}>
          {horsFenetre
            ? `Cette date sera visible dans les entrées à partir de la semaine du ${weekDateRange(semaine)} (semaine ${getISOWeek(semaine)}).`
            : `Apparaîtra dans "Entrées de la semaine" — semaine ${getISOWeek(semaine)} (${weekDateRange(semaine)}).`}
        </div>
      )}
      <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
        <div style={{ ...CSS.label, color:'#0369a1', marginBottom:8 }}>Contact urgence</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
          <input style={CSS.input} value={form.contact_urgence_nom} onChange={e => set('contact_urgence_nom', e.target.value)} placeholder="Nom" />
          <input style={CSS.input} value={form.contact_urgence_telephone} onChange={e => set('contact_urgence_telephone', e.target.value)} placeholder="Téléphone" />
        </div>
      </div>
      {error && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12, padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>{error}</div>}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
        <button disabled={saving} onClick={submit} style={{ ...CSS.btn, background:saving?'#9aa1ac':'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff' }}>
          {saving ? 'Validation…' : "Confirmer et créer l'entrée →"}
        </button>
      </div>
    </Modal>
  )
}

// FileViewButton/FileDropSlot : voir src/components/FileDropSlot.js (partagé
// avec l'espace collaborateur, dossier RH self-service).

// ── Planification d'entretien ────────────────────────────────────────────────
function EntretienPlanifierModal({ candidat, session, onClose, onCreated }) {
  const [resolving, setResolving] = useState(true)
  const [magasinId, setMagasinId] = useState(null)
  const [manager, setManager] = useState(null)
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('10:00')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    resolveManagerForCandidat(candidat.magasin).then(res => {
      if (cancelled) return
      setMagasinId(res.magasinId); setManager(res.manager); setResolving(false)
    })
    return () => { cancelled = true }
  }, [candidat.magasin])

  const submit = async () => {
    if (!date || !heure) { setError('Choisissez une date et une heure.'); return }
    if (!magasinId) { setError('Magasin introuvable — impossible de planifier.'); return }
    setSaving(true); setError('')
    const dateHeureProposee = new Date(`${date}T${heure}:00`).toISOString()
    const entretien = await apiCreerEntretien({
      candidatId: candidat.id, magasinId, managerId: manager?.id || null,
      demandeurLogin: session.login, dateHeureProposee,
    })
    if (entretien && manager?.login) await apiNotifier(manager.login, 'demande_entretien', entretien.id)
    setSaving(false)
    if (entretien) onCreated(entretien); else setError("Échec de la création de l'entretien.")
  }

  return (
    <Modal title="Planifier un entretien" onClose={onClose} width={440}>
      <div style={{ marginBottom:16, padding:'12px 14px', background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10 }}>
        <div style={{ fontWeight:700, color:'#0369a1' }}>{candidat.prenom} {candidat.nom}</div>
        <div style={{ fontSize:12.5, color:'#0369a1', marginTop:2 }}>{candidat.magasin || '—'} · {candidat.poste_vise || '—'}</div>
      </div>
      <Field label="Manager destinataire">
        <input style={{ ...CSS.input, background:'#f0f1f3', color:'#6b7280' }} readOnly
          value={resolving ? 'Recherche…' : (manager?.display_name || 'Aucun manager trouvé pour ce magasin')} />
      </Field>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
        <Field label="Date"><input style={CSS.input} type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
        <Field label="Heure"><input style={CSS.input} type="time" value={heure} onChange={e => setHeure(e.target.value)} /></Field>
      </div>
      {error && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12, padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>{error}</div>}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
        <button disabled={saving || resolving} onClick={submit} style={{ ...CSS.btn, background:saving?'#9aa1ac':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>
          {saving ? 'Envoi…' : 'Envoyer la demande →'}
        </button>
      </div>
    </Modal>
  )
}

function EntretienStatusCard({ entretien, onConfirmerContreProposition, onSupprimer, deleting }) {
  const decision = entretien.decision_candidat
  if (decision === 'accepte') {
    return (
      <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
        <div style={{ fontWeight:700, color:'#166534', fontSize:13.5 }}>✓ Candidat accepté par le manager</div>
        <div style={{ fontSize:12, color:'#16a34a', marginTop:2 }}>Entretien du {fmtDateTime(entretien.date_heure_proposee)} · décision le {fmtDateTime(entretien.decision_at)}</div>
        {entretien.note_entretien && <div style={{ fontSize:12.5, color:'#166534', marginTop:6, fontStyle:'italic' }}>« {entretien.note_entretien} »</div>}
      </div>
    )
  }
  if (decision === 'refuse') {
    return (
      <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
        <div style={{ fontWeight:700, color:'#b91c1c', fontSize:13.5 }}>✕ Candidat refusé par le manager</div>
        <div style={{ fontSize:12, color:'#dc2626', marginTop:2 }}>Entretien du {fmtDateTime(entretien.date_heure_proposee)} · décision le {fmtDateTime(entretien.decision_at)}</div>
        {entretien.note_entretien && <div style={{ fontSize:12.5, color:'#b91c1c', marginTop:6, fontStyle:'italic' }}>« {entretien.note_entretien} »</div>}
      </div>
    )
  }
  if (entretien.statut === 'contre_proposition_en_attente') {
    return (
      <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
        <div style={{ fontWeight:700, color:'#c2410c', fontSize:13.5 }}>Le manager propose un autre créneau</div>
        <div style={{ fontSize:13, color:'#9a3412', marginTop:4 }}>{fmtDateTime(entretien.date_heure_contre_proposee)}</div>
        {entretien.commentaire_manager && <div style={{ fontSize:12.5, color:'#9a3412', marginTop:4, fontStyle:'italic' }}>« {entretien.commentaire_manager} »</div>}
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          <button onClick={onConfirmerContreProposition} style={{ ...CSS.btn, padding:'7px 12px', background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff', fontSize:12.5 }}>Confirmer ce créneau</button>
          <button onClick={onSupprimer} disabled={deleting} style={{ ...CSS.btn, padding:'7px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:12.5 }}>{deleting ? '…' : 'Supprimer la demande'}</button>
        </div>
      </div>
    )
  }
  const label = entretien.statut === 'acceptee'
    ? `Entretien confirmé le ${fmtDateTime(entretien.date_heure_proposee)} — en attente de la décision du manager`
    : `En attente de réponse du manager · créneau proposé le ${fmtDateTime(entretien.date_heure_proposee)}`
  return (
    <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
      <div style={{ fontSize:13, color:'#0369a1', fontWeight:600 }}>{label}</div>
      <button onClick={onSupprimer} disabled={deleting} style={{ ...CSS.btn, padding:'6px 12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:12, marginTop:10 }}>{deleting ? '…' : 'Supprimer la demande'}</button>
    </div>
  )
}

// ── Mail de bienvenue (candidat accepté, magasins Île-de-France) ────────────
// Composition mailto pré-remplie éditable + traçage du clic "Envoyer", même
// principe que le mail de reporting hebdomadaire (MesRetoursView.js) : on ne
// peut pas savoir si l'email part réellement, seulement que la RH a cliqué.
function MailBienvenueModal({ candidat, entree, magasinInfo, collaborateur, onClose, onSent }) {
  const dateEntreeLettres = formatDateLettresJour(entree.date_entree)
  const nomMagasin = (candidat.magasin || '').replace(/\s*\(.*$/, '')
  const prefixeMagasin = magasinInfo.typeMagasin === 'entrepot' ? `notre entrepôt de ${nomMagasin}` : `notre magasin de ${nomMagasin}`
  const estIdf = magasinInfo.regionNom === 'Zone Paris' || magasinInfo.typeMagasin === 'entrepot'
  const lieuFormation = estIdf
    ? `Vous débuterez votre formation à partir de 10h à l'adresse 42 boulevard Sébastopol 75003 Paris (6ème étage).`
    : `Vous débuterez votre formation en visio depuis votre magasin, à partir de 10h.`

  const corpsInitial = `Bonjour ${candidat.prenom},

Comme échangé avec vous, nous sommes ravis de vous proposer de nous rejoindre en tant que ${candidat.poste_vise || ''} - CDI Temps plein ${entree.heures || ''}h sur ${prefixeMagasin}.

${lieuFormation}

Date d'entrée prévue : le ${dateEntreeLettres}.

Avant cela, je vous invite à vous connecter sur votre nouvel espace Lunettes Pour Tous. Dessus, vous pourrez ajouter les documents dont nous avons besoin afin de rédiger votre contrat.

Voici le lien pour vous connecter : https://lpt-formation.vercel.app/espace-collaborateur

Identifiant : ${collaborateur?.login || '—'}
Mot de passe : LPTSHOP (il vous sera demandé d'en choisir un nouveau à 6 chiffres dès la première connexion)
${estIdf ? `
La formation ayant lieu dans nos nouveaux locaux encore en travaux, il n'y a pas d'interphone en bas.
Voici donc un lien pour prévenir les formateurs de votre arrivée :
https://lpt-formation.vercel.app/sonnette
` : ''}
Prochaines étapes :
- Réception et signature du contrat de travail : contrat envoyé via Yousign ou Docusign d'ici lundi, à signer à réception.

Tu retrouveras tes accès (mail pro, Slack, codes vendeurs…) directement dans ton espace, sur la fiche accès.

Vous trouverez en pièce jointe une présentation complète de notre entreprise, nos produits et nos valeurs, ainsi qu'une vidéo pour vous plonger dans votre future aventure chez nous :
https://youtu.be/T-4wQCsmf7s

Pour toute question, je reste disponible.

Belle journée à vous, et bienvenue parmi nous.

Bien à toi`

  const [mailTo, setMailTo] = useState(candidat.email || '')
  const [body, setBody] = useState(corpsInitial)
  const [presentationUrl, setPresentationUrl] = useState(null)
  const [uploadingPresentation, setUploadingPresentation] = useState(false)

  useEffect(() => {
    let cancelled = false
    getSignedUrl(FICHIER_CONSTANT_PRESENTATION, 3600, RH_DOCUMENTS_BUCKET).then(u => { if (!cancelled) setPresentationUrl(u) })
    return () => { cancelled = true }
  }, [])

  const uploadPresentation = async files => {
    const file = files?.[0]
    if (!file) return
    setUploadingPresentation(true)
    const ok = await uploadFichierConstant(file)
    if (ok) setPresentationUrl(await getSignedUrl(FICHIER_CONSTANT_PRESENTATION, 3600, RH_DOCUMENTS_BUCKET))
    setUploadingPresentation(false)
  }

  const envoyer = async () => {
    const subject = encodeURIComponent('Bienvenue chez Lunettes pour tous')
    window.location.href = `mailto:${mailTo}?subject=${subject}&body=${encodeURIComponent(body)}`
    await onSent()
    onClose()
  }

  return (
    <Modal title="Mail de bienvenue" onClose={onClose} width={640}>
      <Field label="Destinataire"><input style={CSS.input} value={mailTo} onChange={e => setMailTo(e.target.value)} /></Field>
      <Field label="Corps du mail">
        <textarea style={{ ...CSS.input, height:380, resize:'vertical', fontFamily:'inherit', whiteSpace:'pre-wrap' }} value={body} onChange={e => setBody(e.target.value)} />
      </Field>
      <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px', marginBottom:18 }}>
        <div style={{ ...CSS.label, color:'#0369a1', marginBottom:8 }}>Pièce jointe — à ajouter toi-même dans ton client mail (mailto ne le permet pas)</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          {presentationUrl ? (
            <a href={presentationUrl} target="_blank" rel="noopener noreferrer" style={{ ...CSS.btn, textDecoration:'none', padding:'6px 12px', background:'#fff', border:'1px solid #e5e7eb', color:'#0089ba', fontSize:12.5 }}>📄 Télécharger la présentation entreprise</a>
          ) : (
            <span style={{ fontSize:12.5, color:'#9aa1ac' }}>Aucune présentation mise en ligne pour l&apos;instant.</span>
          )}
          <label style={{ ...CSS.btn, padding:'6px 12px', background:'#fff', border:'1px solid #e5e7eb', color:'#6b7280', fontSize:12, cursor:'pointer' }}>
            {uploadingPresentation ? 'Envoi…' : (presentationUrl ? 'Remplacer le fichier' : 'Mettre en ligne le fichier')}
            <input type="file" style={{ display:'none' }} onChange={e => uploadPresentation(e.target.files)} disabled={uploadingPresentation} />
          </label>
        </div>
      </div>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
        <button onClick={envoyer} disabled={!mailTo.trim()} style={{ ...CSS.btn, background:!mailTo.trim()?'#cbd5e1':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>Envoyer →</button>
      </div>
    </Modal>
  )
}

function MailBienvenueSection({ candidat, decisionCandidat, onSent }) {
  const [magasinInfo, setMagasinInfo] = useState(null)
  const [entree, setEntree] = useState(null)
  const [collaborateur, setCollaborateur] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (decisionCandidat !== 'accepte') return
    let cancelled = false
    resolveManagerForCandidat(candidat.magasin).then(async ({ magasinId }) => {
      if (cancelled || !magasinId) return
      const info = await apiGetMagasinInfo(magasinId)
      if (!cancelled) setMagasinInfo(info)
      const c = await findCollaborateurByName(magasinId, candidat.prenom, candidat.nom)
      if (!cancelled) setCollaborateur(c)
    })
    return () => { cancelled = true }
    // candidat.entree_id : le compte collaborateur (et son login) n'est créé
    // qu'à la validation — sans cette dépendance, une fiche ouverte AVANT de
    // valider garde un `collaborateur` figé à null (pas encore trouvé) même
    // après la validation, et le mail part sans identifiant.
  }, [candidat.magasin, candidat.prenom, candidat.nom, candidat.entree_id, decisionCandidat])

  useEffect(() => {
    if (decisionCandidat !== 'accepte' || !candidat.entree_id) return
    let cancelled = false
    apiGetEntree(candidat.entree_id).then(e => { if (!cancelled) setEntree(e) })
    return () => { cancelled = true }
  }, [candidat.entree_id, decisionCandidat])

  if (decisionCandidat !== 'accepte') return null
  if (!magasinInfo) return null // résolution région/type en cours

  // Beauchamps/Laboratoire Progressif n'ont pas de région renseignée en base
  // (ce sont des annexes hors grille régionale) — un entrepôt est toujours
  // traité comme Île-de-France, conformément à l'exemple donné (Beauchamps).
  // TEMPORAIRE (demande Quentin, phase de test) : ouvert à tous les magasins.
  // Pour revenir à la restriction IDF, remettre :
  // const estIdf = magasinInfo.regionNom === 'Zone Paris' || magasinInfo.typeMagasin === 'entrepot'
  const estIdf = true

  if (!estIdf) {
    return (
      <div style={{ fontSize:12, color:'#9aa1ac', fontStyle:'italic', marginBottom:16 }}>
        Mail de bienvenue automatique : bientôt disponible pour cette région.
      </div>
    )
  }

  const emailManquant = !candidat.email?.trim()
  const dateManquante = !candidat.entree_id || !entree?.date_entree
  const compteManquant = !dateManquante && !collaborateur?.login
  const disabled = emailManquant || dateManquante || compteManquant

  return (
    <div style={{ marginBottom:16 }}>
      <button
        onClick={() => !disabled && setShowModal(true)}
        disabled={disabled}
        title={emailManquant ? "Renseigne l'email du candidat pour pouvoir envoyer ce mail" : dateManquante ? "Valide d'abord le recrutement (date d'entrée) pour pouvoir envoyer ce mail" : compteManquant ? "Le compte espace collaborateur n'a pas été retrouvé — réessaie dans quelques secondes" : undefined}
        style={{ ...CSS.btn, padding:'9px 16px', fontSize:13, color:'#fff', cursor:disabled?'not-allowed':'pointer', background:disabled?'#cbd5e1':'linear-gradient(135deg,#0089ba,#00abe9)' }}
      >
        ✉️ Envoyer le mail de bienvenue
      </button>
      {disabled && (
        <div style={{ fontSize:11.5, color:'#9aa1ac', marginTop:6 }}>
          {emailManquant ? "Renseigne l'email du candidat pour pouvoir envoyer ce mail." : dateManquante ? "Valide d'abord le recrutement (date d'entrée) pour pouvoir envoyer ce mail." : "Le compte espace collaborateur n'a pas été retrouvé — recharge la fiche et réessaie."}
        </div>
      )}
      {candidat.mail_bienvenue_envoye_at && (
        <div style={{ fontSize:11.5, color:'#16a34a', marginTop:6 }}>
          ✓ Mail de bienvenue envoyé le {new Date(candidat.mail_bienvenue_envoye_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
        </div>
      )}
      {showModal && (
        <MailBienvenueModal
          candidat={candidat} entree={entree} magasinInfo={magasinInfo} collaborateur={collaborateur}
          onClose={() => setShowModal(false)}
          onSent={onSent}
        />
      )}
    </div>
  )
}

// ── Accès à l'espace collaborateur (login + LPTSHOP) — mail distinct du mail
// de bienvenue Île-de-France ci-dessus, ouvert à TOUS les magasins, envoyé
// une fois le compte créé (juste après validation du recrutement). ─────────
function AccesEspaceModal({ candidat, collaborateur, onClose, onSent }) {
  const corpsInitial = `Bonjour ${candidat.prenom},

Bienvenue chez Lunettes Pour Tous ! Ton espace collaborateur est prêt.

Identifiant : ${collaborateur.login}
Mot de passe temporaire : LPTSHOP

Connecte-toi ici : https://lpt-formation.vercel.app/espace-collaborateur
Dès ta première connexion, il te sera demandé de choisir un nouveau code personnel à 6 chiffres.

Première étape : remplis ton dossier RH directement depuis ton espace (pièce d'identité, RIB, attestation de sécurité sociale ou carte Vitale, extrait de casier judiciaire, justificatif de domicile, attestation RQTH si besoin) — tu peux le faire en plusieurs fois, à ton rythme.

À très vite !`

  const [mailTo, setMailTo] = useState(candidat.email || '')
  const [body, setBody] = useState(corpsInitial)

  const envoyer = async () => {
    const subject = encodeURIComponent('Bienvenue chez Lunettes pour tous — tes accès')
    window.location.href = `mailto:${mailTo}?subject=${subject}&body=${encodeURIComponent(body)}`
    await onSent()
    onClose()
  }

  return (
    <Modal title="Accès à l'espace collaborateur" onClose={onClose} width={600}>
      <Field label="Destinataire"><input style={CSS.input} value={mailTo} onChange={e => setMailTo(e.target.value)} /></Field>
      <Field label="Corps du mail">
        <textarea style={{ ...CSS.input, height:280, resize:'vertical', fontFamily:'inherit', whiteSpace:'pre-wrap' }} value={body} onChange={e => setBody(e.target.value)} />
      </Field>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
        <button onClick={envoyer} disabled={!mailTo.trim()} style={{ ...CSS.btn, background:!mailTo.trim()?'#cbd5e1':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>Envoyer →</button>
      </div>
    </Modal>
  )
}

function AccesEspaceSection({ candidat, magasinLabel, onSent }) {
  const [collaborateur, setCollaborateur] = useState(undefined) // undefined = chargement
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (candidat.statut !== 'valide') return
    let cancelled = false
    resolveManagerForCandidat(magasinLabel).then(async ({ magasinId }) => {
      if (cancelled) return
      if (!magasinId) { setCollaborateur(null); return }
      const c = await findCollaborateurByName(magasinId, candidat.prenom, candidat.nom)
      if (!cancelled) setCollaborateur(c)
    })
    return () => { cancelled = true }
  }, [candidat.statut, candidat.prenom, candidat.nom, magasinLabel])

  if (candidat.statut !== 'valide') return null
  if (collaborateur === undefined) return null
  if (!collaborateur?.login) return null // compte pas encore résolu (garde-fou, ne devrait pas arriver)

  const emailManquant = !candidat.email?.trim()

  return (
    <div style={{ marginBottom:16 }}>
      <button
        onClick={() => !emailManquant && setShowModal(true)}
        disabled={emailManquant}
        title={emailManquant ? "Renseigne l'email du candidat pour pouvoir envoyer ce mail" : undefined}
        style={{ ...CSS.btn, padding:'9px 16px', fontSize:13, color:'#fff', cursor:emailManquant?'not-allowed':'pointer', background:emailManquant?'#cbd5e1':'linear-gradient(135deg,#0089ba,#00abe9)' }}
      >
        🔑 Envoyer les accès à l&apos;espace
      </button>
      {emailManquant && (
        <div style={{ fontSize:11.5, color:'#9aa1ac', marginTop:6 }}>Renseigne l&apos;email du candidat pour pouvoir envoyer ce mail.</div>
      )}
      {candidat.acces_espace_envoye_at && (
        <div style={{ fontSize:11.5, color:'#16a34a', marginTop:6 }}>
          ✓ Accès envoyés le {new Date(candidat.acces_espace_envoye_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
        </div>
      )}
      {showModal && <AccesEspaceModal candidat={candidat} collaborateur={collaborateur} onClose={() => setShowModal(false)} onSent={onSent} />}
    </div>
  )
}

// ── Statut du contrat (Docusign) — piloté à la main par la RH, jamais déduit
// de la complétude du dossier documentaire : ce sont deux processus
// indépendants qui peuvent se désynchroniser (contrat envoyé avant que les
// documents soient complets, ou inversement). Visible par le collaborateur
// depuis son espace bridé une fois défini.
const STATUT_CONTRAT_OPTIONS = [
  { value: 'en_attente_pieces', label: 'En attente de pièces', color: '#c2410c', bg: '#fff7ed', border: '#fed7aa' },
  { value: 'envoye_signature', label: 'Envoyé pour signature', color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd' },
  { value: 'signe', label: 'Signé', color: '#15803d', bg: '#dcfce7', border: '#86efac' },
]

function StatutContratSection({ candidat }) {
  const [entree, setEntree] = useState(undefined) // undefined = chargement
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!candidat.entree_id) { setEntree(null); return }
    let cancelled = false
    apiGetEntree(candidat.entree_id).then(e => { if (!cancelled) setEntree(e) })
    return () => { cancelled = true }
  }, [candidat.entree_id])

  if (candidat.statut !== 'valide' || !candidat.entree_id || entree === undefined) return null

  const setStatut = async statut => {
    setSaving(true)
    await apiMarquerStatutContrat(candidat.entree_id, statut)
    setEntree(e => ({ ...e, statut_contrat: statut }))
    setSaving(false)
  }

  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontSize:11, fontWeight:700, color:'#9aa1ac', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Statut du contrat</div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {STATUT_CONTRAT_OPTIONS.map(opt => {
          const active = entree?.statut_contrat === opt.value
          return (
            <button
              key={opt.value}
              onClick={() => !saving && setStatut(opt.value)}
              disabled={saving}
              style={{
                ...CSS.btn, padding:'7px 12px', fontSize:12.5, fontWeight:700, cursor:saving?'default':'pointer',
                background: active ? opt.bg : '#fff', color: active ? opt.color : '#6b7280',
                border: `1.5px solid ${active ? opt.border : '#e5e7eb'}`,
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FicheCandidatModal({ candidat: init, session, onClose, onUpdate, onDeleted }) {
  const [candidat, setCandidat] = useState(init)
  const [historique, setHistorique] = useState([])
  const [showDocs, setShowDocs] = useState(false)
  const [showAvancer, setShowAvancer] = useState(false)
  const [showRefuser, setShowRefuser] = useState(false)
  const [showValider, setShowValider] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [entretiens, setEntretiens] = useState([])
  const [showPlanifier, setShowPlanifier] = useState(false)
  const [planifyBlockedMsg, setPlanifyBlockedMsg] = useState('')
  const [deletingEntretien, setDeletingEntretien] = useState(false)
  const [showDeleteCandidat, setShowDeleteCandidat] = useState(false)
  const [deletingCandidat, setDeletingCandidat] = useState(false)
  const [uploadingCv, setUploadingCv] = useState(false)
  const [uploadingLettre, setUploadingLettre] = useState(false)

  useEffect(() => { apiGetHistorique(candidat.id).then(setHistorique) }, [candidat.id])
  useEffect(() => { apiGetEntretiensByCandidat(candidat.id).then(setEntretiens) }, [candidat.id])

  const push = updated => { setCandidat(updated); onUpdate(updated) }
  const entretien = entretiens[0] || null // le plus récent (order=created_at.desc)

  const marquerMailBienvenueEnvoye = async () => {
    await apiMarquerMailBienvenueEnvoye(candidat.id)
    push({ ...candidat, mail_bienvenue_envoye_at: new Date().toISOString() })
  }

  const marquerAccesEnvoye = async () => {
    await apiMarquerAccesEnvoye(candidat.id)
    push({ ...candidat, acces_espace_envoye_at: new Date().toISOString() })
  }

  const uploadCandidatFile = async (files, field, setUploading) => {
    const file = files?.[0]
    if (!file) return
    setUploading(true)
    const path = await uploadPieceJointe(file, { prefix: field === 'cv_url' ? 'cv' : 'lettre', bucket: RH_DOCUMENTS_BUCKET })
    if (path) { await apiUpdateCandidat(candidat.id, { [field]: path }); push({ ...candidat, [field]: path }) }
    setUploading(false)
  }
  const removeCandidatFile = async field => {
    await apiUpdateCandidat(candidat.id, { [field]: null })
    push({ ...candidat, [field]: null })
  }

  const handlePlanifierClick = () => {
    if (!candidat.cv_url) { setPlanifyBlockedMsg('Ajoute le CV du candidat avant de planifier l’entretien.'); return }
    setPlanifyBlockedMsg(''); setShowPlanifier(true)
  }

  const supprimerEntretien = async () => {
    if (!entretien) return
    setDeletingEntretien(true)
    await apiSupprimerEntretien(entretien.id)
    setEntretiens(await apiGetEntretiensByCandidat(candidat.id))
    setDeletingEntretien(false)
  }

  const confirmerContreProposition = async () => {
    if (!entretien) return
    await apiConfirmerContreProposition(entretien.id, entretien.date_heure_contre_proposee)
    if (entretien.manager_id) {
      const managers = await apiGetManagerByMagasinId(entretien.magasin_id)
      if (managers?.login) await apiNotifier(managers.login, 'entretien_confirme', entretien.id)
    }
    setEntretiens(await apiGetEntretiensByCandidat(candidat.id))
  }

  const supprimerCandidat = async () => {
    setDeletingCandidat(true)
    const estRefuse = candidat.statut === 'refuse' || entretien?.decision_candidat === 'refuse'
    if (estRefuse) {
      await apiArchiverCandidat({
        nom: candidat.nom, prenom: candidat.prenom,
        slug: slugifyName(candidat.prenom, candidat.nom),
        motif: entretien?.note_entretien || null,
        archive_par_login: session.login,
      })
    }
    await apiDeleteCandidat(candidat.id)
    setDeletingCandidat(false)
    onDeleted(candidat.id)
  }

  const avancer = async (next, commentaire) => {
    await apiAddHistorique({ candidat_id: candidat.id, statut_precedent: candidat.statut, statut_nouveau: next, commentaire: commentaire || null, auteur: session.login })
    await apiUpdateCandidat(candidat.id, { statut: next })
    push({ ...candidat, statut: next })
    setHistorique(await apiGetHistorique(candidat.id))
    setShowAvancer(false)
  }

  const refuser = async (commentaire) => {
    await apiAddHistorique({ candidat_id: candidat.id, statut_precedent: candidat.statut, statut_nouveau: 'refuse', commentaire: commentaire || null, auteur: session.login })
    await apiUpdateCandidat(candidat.id, { statut: 'refuse' })
    push({ ...candidat, statut: 'refuse' }); setShowRefuser(false)
  }

  const valider = async ({ semaine, form }) => {
    const entree = await apiValiderCandidat({
      candidatId: candidat.id,
      entreePayload: {
        nom: candidat.nom, prenom: candidat.prenom, magasin: candidat.magasin || '',
        poste: candidat.poste_vise || '', telephone: candidat.telephone || '',
        date_entree: form.date_entree, heures: form.heures,
        semaine_lundi: semaine, cree_par: session.login,
        mode_domicile: candidat.mode_domicile, rqth_applicable: candidat.rqth_applicable,
        contact_urgence_nom: form.contact_urgence_nom, contact_urgence_telephone: form.contact_urgence_telephone,
        statut_documents: candidat.statut_documents,
      },
      statutPrecedent: candidat.statut, login: session.login,
    })
    if (entree) {
      push({ ...candidat, statut: 'valide', entree_id: entree.id })
      // Création automatique du compte espace collaborateur — la RH n'a
      // rien à faire de plus pour ça, seulement pour envoyer le mail d'accès.
      const { magasinId } = await resolveManagerForCandidat(candidat.magasin)
      if (magasinId) {
        await creerCompteCollaborateur({
          magasinId, prenom: candidat.prenom, nom: candidat.nom,
          poste: candidat.poste_vise, dateEntree: form.date_entree, entreeId: entree.id,
        })
      }
    }
    setShowValider(false)
  }

  const isActif = !['valide', 'refuse'].includes(candidat.statut)
  // Dès qu'un entretien est planifié, la fiche bascule sur le suivi
  // entretien/décision — plus besoin de l'ancienne étape manuelle "→ Entretien manager".
  const isDecision = !!entretien
  const next = nextStatut(candidat.statut)
  // Dossier documentaire débloqué seulement après un retour positif du
  // manager à l'entretien (decision_candidat = 'accepte') — avant ça, la RH
  // n'a pas à collecter pièce d'identité/RIB/etc. pour quelqu'un pas encore retenu.
  const documentsUnlocked = entretien?.decision_candidat === 'accepte'
  // La RH peut ajouter aux entrées dès l'acceptation du manager, sans
  // attendre un dossier 100% complet — celui-ci reste modifiable une fois
  // le collaborateur passé côté "Entrées de la semaine".
  const peutValider = documentsUnlocked

  return (
    <>
      <Modal title={`${candidat.prenom} ${candidat.nom}`} onClose={onClose} width={560}>
        <div style={{ marginBottom:16, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <StatutPill statut={candidat.statut} />
          {candidat.entree_id && <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>✓ Passé en entrée de la semaine</span>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {[['Téléphone', candidat.telephone], ['Email', candidat.email || '—'], ['Magasin', candidat.magasin || '—'], ['Poste', candidat.poste_vise || '—'], ['Heures envisagées', candidat.heures_envisagees ? `${candidat.heures_envisagees}h` : '—']].map(([l, v]) => (
            <div key={l} style={{ background:'#fff', borderRadius:8, padding:'8px 12px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#9aa1ac', textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:13.5, color:'#14161a', fontWeight:500 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
          {documentsUnlocked && (
            <button onClick={() => setShowDocs(true)} style={{ ...CSS.btn, padding:'7px 14px', background:'#f0f9ff', color:'#0089ba', fontSize:12.5, display:'flex', alignItems:'center', gap:8 }}>
              Documents <StatusBadge statut={candidat.statut_documents} />
            </button>
          )}
          {isActif && <button onClick={() => setShowEdit(true)} style={{ ...CSS.btn, padding:'7px 14px', background:'#fff', color:'#6b7280', fontSize:12.5, border:'1px solid #e5e7eb' }}>Modifier</button>}
        </div>
        {!documentsUnlocked && isActif && (
          <div style={{ fontSize:12, color:'#9aa1ac', fontStyle:'italic', marginBottom:14 }}>
            Les documents seront à ajouter après un retour positif de l&apos;entretien.
          </div>
        )}
        <MailBienvenueSection
          candidat={candidat}
          decisionCandidat={entretien?.decision_candidat}
          onSent={marquerMailBienvenueEnvoye}
        />
        <AccesEspaceSection
          candidat={candidat}
          magasinLabel={candidat.magasin}
          onSent={marquerAccesEnvoye}
        />
        <StatutContratSection candidat={candidat} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
          <FileDropSlot
            label="CV"
            path={candidat.cv_url}
            uploading={uploadingCv}
            onFiles={files => uploadCandidatFile(files, 'cv_url', setUploadingCv)}
            onRemove={() => removeCandidatFile('cv_url')}
          />
          <FileDropSlot
            label="Lettre de motivation"
            path={candidat.lettre_motivation_url}
            uploading={uploadingLettre}
            onFiles={files => uploadCandidatFile(files, 'lettre_motivation_url', setUploadingLettre)}
            onRemove={() => removeCandidatFile('lettre_motivation_url')}
          />
        </div>

        {entretien ? (
          <EntretienStatusCard
            entretien={entretien}
            deleting={deletingEntretien}
            onConfirmerContreProposition={confirmerContreProposition}
            onSupprimer={supprimerEntretien}
          />
        ) : isActif && (
          <div style={{ marginBottom:16 }}>
            <button onClick={handlePlanifierClick} style={{ ...CSS.btn, padding:'9px 16px', background:'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff', fontSize:13 }}>
              📅 Planifier un entretien avec le manager
            </button>
            {planifyBlockedMsg && <div style={{ color:'#c2410c', fontSize:12.5, marginTop:8, padding:'8px 12px', background:'#fff7ed', borderRadius:8, border:'1px solid #fed7aa' }}>{planifyBlockedMsg}</div>}
          </div>
        )}

        {historique.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#9aa1ac', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Historique</div>
            {historique.map(h => (
              <div key={h.id} style={{ display:'flex', gap:8, padding:'8px 0', borderBottom:'1px solid #f0f1f3', fontSize:12.5, flexWrap:'wrap' }}>
                <span style={{ color:'#9aa1ac', flexShrink:0 }}>{new Date(h.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                <StatutPill statut={h.statut_nouveau} />
                {h.commentaire && <span style={{ color:'#6b7280', fontStyle:'italic' }}>{h.commentaire}</span>}
              </div>
            ))}
          </div>
        )}
        {isActif && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', paddingTop:12, borderTop:'1px solid #f0f1f3' }}>
            {isDecision ? (
              <>
                <div>
                  <button
                    onClick={() => peutValider && setShowValider(true)}
                    disabled={!peutValider}
                    title={!peutValider ? "En attente d'un retour positif du manager à l'entretien" : undefined}
                    style={{ ...CSS.btn, padding:'9px 16px', fontSize:13, color:'#fff', cursor:peutValider?'pointer':'not-allowed', background:peutValider?'linear-gradient(135deg,#16a34a,#22c55e)':'#cbd5e1' }}
                  >
                    Valider et ajouter aux entrées →
                  </button>
                  {!peutValider && (
                    <div style={{ fontSize:11.5, color:'#9aa1ac', marginTop:6 }}>
                      En attente d&apos;un retour positif du manager à l&apos;entretien.
                    </div>
                  )}
                </div>
                <button onClick={() => setShowRefuser(true)} style={{ ...CSS.btn, padding:'9px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:13, alignSelf:'flex-start' }}>Refuser</button>
              </>
            ) : (
              <>
                {next && <button onClick={() => setShowAvancer(true)} style={{ ...CSS.btn, padding:'9px 16px', background:'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff', fontSize:13 }}>→ {STATUT_LABELS[next]}</button>}
                <button onClick={() => setShowRefuser(true)} style={{ ...CSS.btn, padding:'9px 16px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:13 }}>Refuser</button>
              </>
            )}
          </div>
        )}
        <div style={{ paddingTop:12, marginTop:12, borderTop:'1px solid #f0f1f3' }}>
          <button onClick={() => setShowDeleteCandidat(true)} style={{ ...CSS.btn, padding:'7px 12px', background:'none', color:'#9aa1ac', fontSize:12, border:'1px solid #e5e7eb' }}>🗑️ Supprimer ce candidat</button>
        </div>
      </Modal>
      {showDocs && <FicheDocuments entity={candidat} entityType="candidat" onClose={() => setShowDocs(false)} onStatutChange={(_, s) => { const u = {...candidat, statut_documents: s}; setCandidat(u); onUpdate(u) }} />}
      {showAvancer && <AvancerStatutModal candidat={candidat} onConfirm={avancer} onClose={() => setShowAvancer(false)} />}
      {showRefuser && <RefuserModal candidat={candidat} onConfirm={refuser} onClose={() => setShowRefuser(false)} />}
      {showValider && <ValiderRecrutementModal candidat={candidat} session={session} onConfirm={valider} onClose={() => setShowValider(false)} />}
      {showEdit && <CandidatFormModal initial={candidat} session={session} onClose={() => setShowEdit(false)} onSave={async data => { await apiUpdateCandidat(candidat.id, data); const u={...candidat,...data}; setCandidat(u); onUpdate(u); setShowEdit(false) }} />}
      {showPlanifier && (
        <EntretienPlanifierModal
          candidat={candidat} session={session}
          onClose={() => setShowPlanifier(false)}
          onCreated={async () => { setShowPlanifier(false); setEntretiens(await apiGetEntretiensByCandidat(candidat.id)) }}
        />
      )}
      {showDeleteCandidat && (
        <Modal title="Supprimer le candidat" onClose={() => setShowDeleteCandidat(false)} width={420}>
          <p style={{ margin:'0 0 20px', color:'#6b7280', fontSize:14, lineHeight:1.6 }}>
            Supprimer <strong>{candidat.prenom} {candidat.nom}</strong> ?<br />Action irréversible.
            {(candidat.statut === 'refuse' || entretien?.decision_candidat === 'refuse') && (
              <><br /><span style={{ color:'#c2410c' }}>Ce candidat sera archivé (nom, prénom, motif) pour être détecté en cas de nouvelle candidature.</span></>
            )}
          </p>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setShowDeleteCandidat(false)} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
            <button onClick={supprimerCandidat} disabled={deletingCandidat} style={{ ...CSS.btn, background:deletingCandidat?'#9aa1ac':'#ef4444', color:'#fff' }}>{deletingCandidat ? '…' : 'Supprimer'}</button>
          </div>
        </Modal>
      )}
    </>
  )
}

function RecrutementView({ session, regionFilter }) {
  const [candidats, setCandidats] = useState([])
  const [entretiens, setEntretiens] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [fiche, setFiche] = useState(null)
  const [showRefuses, setShowRefuses] = useState(false)
  const [showValides, setShowValides] = useState(false)
  const [search, setSearch] = useState('')

  const reloadEntretiens = () => apiGetEntretiensActifs().then(setEntretiens)

  useEffect(() => {
    Promise.all([apiGetCandidats(), apiGetEntretiensActifs()]).then(([cands, ents]) => {
      setCandidats(cands); setEntretiens(ents); setLoading(false)
    })
  }, [])

  // Le plus récent par candidat (entretiens déjà triés created_at.desc) —
  // affiché directement sur chaque ligne au lieu d'avoir à rouvrir la fiche.
  const entretienByCandidatId = {}
  for (const e of entretiens) {
    if (!entretienByCandidatId[e.candidat_id]) entretienByCandidatId[e.candidat_id] = e
  }

  const handleAdd = async data => {
    // La prise de contact a nécessairement déjà eu lieu au moment où la RH
    // saisit la fiche (échange préalable) — pas de statut "à contacter" en
    // doublon à faire avancer manuellement juste après création.
    const c = await apiAddCandidat({ ...data, statut: 'contacte', statut_documents: 'incomplet' })
    if (c) {
      await apiAddHistorique({ candidat_id: c.id, statut_precedent: null, statut_nouveau: 'contacte', commentaire: 'Candidat créé', auteur: session.login })
      setCandidats(prev => [...prev, c])
    }
    setShowAdd(false)
  }

  const handleUpdate = updated => setCandidats(prev => prev.map(c => c.id === updated.id ? updated : c))
  const handleDeleted = id => { setCandidats(prev => prev.filter(c => c.id !== id)); setFiche(null) }

  const searchNorm = stripAccents(search.trim()).toLowerCase()
  const visibles = candidats.filter(c => {
    if (regionFilter && regionFilter !== 'tous' && magasinRegionId(c.magasin) !== regionFilter) return false
    if (searchNorm && !stripAccents(`${c.prenom} ${c.nom}`).toLowerCase().includes(searchNorm)) return false
    return true
  })

  const actifs = visibles.filter(c => !['valide','refuse'].includes(c.statut))
  const refuses = visibles.filter(c => c.statut === 'refuse')
  const valides = visibles.filter(c => c.statut === 'valide')
  // Vraie décision requise : le manager a rendu son verdict, la balle est
  // dans le camp RH (remplace l'ancien statut 'entretien_manager', retiré du
  // pipeline actif et donc plus jamais attribué — ce compteur affichait 0).
  const enAttente = actifs.filter(c => {
    const d = entretienByCandidatId[c.id]?.decision_candidat
    return d === 'accepte' || d === 'refuse'
  }).length

  return (
    <div>
      <PageHeader title="Recrutement" />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#14161a' }}>{actifs.length}</div>
            <div style={{ fontSize:11, color:'#6b7280', fontWeight:600 }}>en cours</div>
          </div>
          {enAttente > 0 && <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#c2410c' }}>{enAttente}</div>
            <div style={{ fontSize:11, color:'#ea580c', fontWeight:600 }}>décision requise</div>
          </div>}
          {valides.length > 0 && <div style={{ background:'#dcfce7', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#15803d' }}>{valides.length}</div>
            <div style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>validé{valides.length>1?'s':''}</div>
          </div>}
        </div>
        <button onClick={() => setShowAdd(true)} style={{ ...CSS.btn, padding:'12px 20px', background:'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff', boxShadow:'0 4px 14px rgba(0,171,233,0.3)', fontSize:14 }}>
          + Ajouter un candidat
        </button>
      </div>

      <div style={{ position:'relative', marginBottom:20, maxWidth:340 }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9aa1ac', fontSize:14 }}>🔍</span>
        <input
          style={{ ...CSS.input, paddingLeft:34 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un candidat (nom, prénom)…"
        />
      </div>

      {loading ? <div style={{ textAlign:'center', padding:'48px 0', color:'#9aa1ac' }}>Chargement…</div> : (
        <>
          {actifs.length === 0 && !refuses.length && (
            <div style={{ textAlign:'center', padding:'56px 24px', background:'#fff', borderRadius:16, border:'1px solid #e5e7eb', boxShadow:'0 1px 2px rgba(16,24,40,0.03)' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>👥</div>
              <div style={{ fontSize:15, fontWeight:600, color:'#6b7280', marginBottom:6 }}>
                {candidats.length === 0 ? 'Aucun candidat en cours' : 'Aucun candidat ne correspond au filtre'}
              </div>
              <div style={{ fontSize:13, color:'#9aa1ac' }}>
                {candidats.length === 0 ? 'Ajoutez un premier candidat pour démarrer le pipeline.' : 'Essayez une autre région ou un autre nom.'}
              </div>
            </div>
          )}
          {PIPELINE.map(statut => {
            const items = actifs.filter(c => c.statut === statut)
            if (!items.length) return null
            return (
              <div key={statut} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <StatutPill statut={statut} />
                  <span style={{ fontSize:12, color:'#9aa1ac', fontWeight:600 }}>{items.length} candidat{items.length>1?'s':''}</span>
                </div>
                <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 2px rgba(16,24,40,0.03)' }}>
                  {items.map((c, i) => (
                    <div key={c.id} onClick={() => setFiche(c)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:i<items.length-1?'1px solid #f0f1f3':'none', cursor:'pointer', gap:12, flexWrap:'wrap' }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:700, color:'#14161a', fontSize:14 }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize:12, color:'#6b7280', marginTop:1 }}>{c.magasin||'—'} · {c.poste_vise||'—'} · {c.telephone}</div>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                        <StatusBadge statut={c.statut_documents} />
                        <EntretienBadge entretien={entretienByCandidatId[c.id]} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {valides.length > 0 && (
            <div style={{ marginTop:8 }}>
              <button onClick={() => setShowValides(v => !v)} style={{ ...CSS.btn, padding:'6px 12px', background:'none', color:'#9aa1ac', fontSize:12, border:'none' }}>
                {showValides?'▲':'▼'} {valides.length} validé{valides.length>1?'s':''}
              </button>
              {showValides && (
                <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', marginTop:8, boxShadow:'0 1px 2px rgba(16,24,40,0.03)' }}>
                  {valides.map((c, i) => (
                    <div key={c.id} onClick={() => setFiche(c)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom:i<valides.length-1?'1px solid #f0f1f3':'none', cursor:'pointer' }}>
                      <div>
                        <div style={{ fontWeight:600, color:'#14161a', fontSize:13.5 }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize:11.5, color:'#9aa1ac' }}>{c.magasin||'—'} · {c.poste_vise||'—'}</div>
                      </div>
                      <StatutPill statut="valide" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {refuses.length > 0 && (
            <div style={{ marginTop:8 }}>
              <button onClick={() => setShowRefuses(r => !r)} style={{ ...CSS.btn, padding:'6px 12px', background:'none', color:'#9aa1ac', fontSize:12, border:'none' }}>
                {showRefuses?'▲':'▼'} {refuses.length} refusé{refuses.length>1?'s':''}
              </button>
              {showRefuses && (
                <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', marginTop:8, boxShadow:'0 1px 2px rgba(16,24,40,0.03)' }}>
                  {refuses.map((c, i) => (
                    <div key={c.id} onClick={() => setFiche(c)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom:i<refuses.length-1?'1px solid #f0f1f3':'none', cursor:'pointer', opacity:0.65 }}>
                      <div>
                        <div style={{ fontWeight:600, color:'#374151', fontSize:13.5 }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize:11.5, color:'#9aa1ac' }}>{c.magasin||'—'} · {c.poste_vise||'—'}</div>
                      </div>
                      <StatutPill statut="refuse" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {showAdd && <CandidatFormModal session={session} onSave={handleAdd} onClose={() => setShowAdd(false)} />}
      {fiche && <FicheCandidatModal candidat={fiche} session={session} onClose={() => { setFiche(null); reloadEntretiens() }} onUpdate={u => { handleUpdate(u); setFiche(u) }} onDeleted={handleDeleted} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRÉES DE LA SEMAINE
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirm({ entree, onConfirm, onClose }) {
  return (
    <Modal title="Supprimer l'entrée" onClose={onClose} width={420}>
      <p style={{ margin:'0 0 20px', color:'#6b7280', fontSize:14, lineHeight:1.6 }}>Supprimer <strong>{entree.prenom} {entree.nom}</strong> ({entree.magasin}) ?<br />Action irréversible.</p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
        <button onClick={onConfirm} style={{ ...CSS.btn, background:'#ef4444', color:'#fff' }}>Supprimer</button>
      </div>
    </Modal>
  )
}

function EntreeForm({ initial, semaineLundi, session, onSave, onClose }) {
  const isEdit = !!initial?.id
  const [form, setForm] = useState({
    nom: initial?.nom||'', prenom: initial?.prenom||'', magasin: initial?.magasin||'',
    date_entree: initial?.date_entree||semaineLundi, poste: initial?.poste||'',
    heures: initial?.heures||'', telephone: initial?.telephone||'',
    mode_domicile: initial?.mode_domicile||'personnel', rqth_applicable: initial?.rqth_applicable||false,
    contact_urgence_nom: initial?.contact_urgence_nom||'', contact_urgence_telephone: initial?.contact_urgence_telephone||'',
  })
  const [saving, setSaving] = useState(false); const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    if (!form.nom.trim()||!form.prenom.trim()||!form.magasin||!form.date_entree) { setError("Nom, prénom, magasin et date d'entrée sont obligatoires."); return }
    setSaving(true); setError('')
    await onSave({ ...form, nom: form.nom.trim().toUpperCase(), prenom: form.prenom.trim(), semaine_lundi: semaineLundi, cree_par: session.login, statut_documents: initial?.statut_documents||'incomplet' })
    setSaving(false)
  }

  return (
    <Modal title={isEdit?'Modifier le collaborateur':'Ajouter un collaborateur'} onClose={onClose} width={600}>
      <form onSubmit={submit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <Field label="Nom"><input style={CSS.input} value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="NOM" /></Field>
          <Field label="Prénom"><input style={CSS.input} value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom" /></Field>
        </div>
        <Field label="Magasin">
          <select style={CSS.input} value={form.magasin} onChange={e => set('magasin', e.target.value)}>
            <option value="">— Choisir —</option>
            {STORE_OPTIONS.map(s => <option key={s.id} value={s.label}>{s.label}</option>)}
          </select>
        </Field>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <Field label="Date d'entrée"><input style={CSS.input} type="date" value={form.date_entree} onChange={e => set('date_entree', e.target.value)} /></Field>
          <Field label="Poste"><input style={CSS.input} value={form.poste} onChange={e => set('poste', e.target.value)} placeholder="CVO, Opticien…" /></Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <Field label="Heures / semaine">
            <input style={CSS.input} list="heures-suggestions-entree" value={form.heures} onChange={e => set('heures', e.target.value)} placeholder="35" />
            <datalist id="heures-suggestions-entree">{HEURES_SUGGESTIONS.map(h => <option key={h} value={h} />)}</datalist>
          </Field>
          <Field label="Téléphone"><input style={CSS.input} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 xx xx xx xx" /></Field>
        </div>
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
          <div style={{ ...CSS.label, marginBottom:8 }}>Domicile</div>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            {['personnel','heberge'].map(v => (
              <label key={v} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13.5, fontWeight:form.mode_domicile===v?700:400 }}>
                <input type="radio" name="md_e" checked={form.mode_domicile===v} onChange={() => set('mode_domicile', v)} />{v==='personnel'?'Personnel':'Hébergé'}
              </label>
            ))}
            <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13.5 }}>
              <input type="checkbox" checked={form.rqth_applicable} onChange={e => set('rqth_applicable', e.target.checked)} />RQTH
            </label>
          </div>
        </div>
        <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px', marginBottom:18 }}>
          <div style={{ ...CSS.label, color:'#0369a1', marginBottom:8 }}>Contact urgence</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
            <input style={CSS.input} value={form.contact_urgence_nom} onChange={e => set('contact_urgence_nom', e.target.value)} placeholder="Nom" />
            <input style={CSS.input} value={form.contact_urgence_telephone} onChange={e => set('contact_urgence_telephone', e.target.value)} placeholder="Téléphone" />
          </div>
        </div>
        {error && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12, padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button type="button" onClick={onClose} style={{ ...CSS.btn, background:'#fff', border:'1px solid #e5e7eb', color:'#374151' }}>Annuler</button>
          <button type="submit" disabled={saving} style={{ ...CSS.btn, background:saving?'#9aa1ac':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>{saving?'Enregistrement…':isEdit?'Enregistrer':'Ajouter'}</button>
        </div>
      </form>
    </Modal>
  )
}

function EntreesView({ session, regionFilter }) {
  const [activeWeek, setActiveWeek] = useState('current')
  const [entrees, setEntrees] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(null)
  const [showFiche, setShowFiche] = useState(null)
  const [showDelete, setShowDelete] = useState(null)

  const s0 = getMondayStr(0); const s1 = getMondayStr(1)
  const semaineLundi = activeWeek === 'current' ? s0 : s1

  const load = useCallback(async () => {
    setLoading(true); setEntrees(await apiGetEntreesRhByWeek(semaineLundi)); setLoading(false)
  }, [semaineLundi])

  useEffect(() => { load() }, [load])

  const sync = rows => { if (activeWeek === 'current') apiSyncFormateur(rows).catch(() => {}) }

  const handleSave = async payload => {
    if (payload.id) await apiUpdateEntreeRh(payload.id, payload)
    else await apiAddEntreeRh(payload)
    const refreshed = await apiGetEntreesRhByWeek(semaineLundi)
    setEntrees(refreshed); sync(refreshed); setShowForm(null)
  }

  const handleDelete = async () => {
    await apiDeleteEntreeRh(showDelete.id)
    const refreshed = await apiGetEntreesRhByWeek(semaineLundi)
    setEntrees(refreshed); sync(refreshed); setShowDelete(null)
  }

  const handleStatutChange = (id, statut) => {
    setEntrees(prev => { const u = prev.map(e => e.id===id?{...e,statut_documents:statut}:e); sync(u); return u })
  }

  const tabs = [
    { id:'current', label:`Semaine ${getISOWeek(s0)}`, sub:weekDateRange(s0) },
    { id:'next',    label:`Semaine ${getISOWeek(s1)}`, sub:weekDateRange(s1) },
  ]
  // Filtre région purement d'affichage — `entrees` (données brutes, non
  // filtrées) reste la source utilisée par `sync` pour trainer_state.
  const visibleEntrees = (!regionFilter || regionFilter === 'tous')
    ? entrees
    : entrees.filter(e => magasinRegionId(e.magasin) === regionFilter)
  const complet = visibleEntrees.filter(e => e.statut_documents==='complet').length

  return (
    <div>
      <PageHeader title="Entrées de la semaine" />
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveWeek(t.id)} style={{ ...CSS.btn, padding:'12px 20px', textAlign:'left', background:activeWeek===t.id?'linear-gradient(135deg,#0089ba,#00abe9)':'#fff', color:activeWeek===t.id?'#fff':'#6b7280', border:activeWeek===t.id?'none':'1px solid #e5e7eb', boxShadow:activeWeek===t.id?'0 4px 14px rgba(0,171,233,0.3)':'none' }}>
            <div style={{ fontSize:13.5, fontWeight:700 }}>{t.label}</div>
            <div style={{ fontSize:11, marginTop:2, opacity:0.8 }}>{t.sub}</div>
          </button>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#14161a' }}>{visibleEntrees.length}</div>
            <div style={{ fontSize:11, color:'#6b7280', fontWeight:600 }}>entrant{visibleEntrees.length>1?'s':''}</div>
          </div>
          {visibleEntrees.length > 0 && <>
            <div style={{ background:'#dcfce7', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#15803d' }}>{complet}</div>
              <div style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>complet{complet>1?'s':''}</div>
            </div>
            <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#c2410c' }}>{visibleEntrees.length-complet}</div>
              <div style={{ fontSize:11, color:'#ea580c', fontWeight:600 }}>incomplet{visibleEntrees.length-complet>1?'s':''}</div>
            </div>
          </>}
        </div>
        <button onClick={() => setShowForm('add')} style={{ ...CSS.btn, padding:'12px 20px', background:'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff', boxShadow:'0 4px 14px rgba(0,171,233,0.3)', fontSize:14 }}>
          + Ajouter un collaborateur
        </button>
      </div>
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #e5e7eb', overflow:'hidden', boxShadow:'0 1px 2px rgba(16,24,40,0.03)' }}>
        {loading ? <div style={{ textAlign:'center', padding:'48px 0', color:'#9aa1ac' }}>Chargement…</div> :
         !visibleEntrees.length ? (
          <div style={{ textAlign:'center', padding:'56px 24px', color:'#9aa1ac' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
            <div style={{ fontSize:15, fontWeight:600, color:'#6b7280', marginBottom:6 }}>{entrees.length === 0 ? 'Aucun entrant cette semaine' : 'Aucun entrant dans cette région'}</div>
          </div>
         ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
              <thead>
                <tr style={{ background:'#fff' }}>
                  {['Collaborateur','Magasin','Date entrée','Poste','Heures','Téléphone','Dossier','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#6b7280', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'2px solid #e5e7eb', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleEntrees.map((e, i) => (
                  <tr
                    key={e.id} onClick={() => setShowFiche(e)}
                    style={{ borderBottom:'1px solid #f0f1f3', background:i%2===0?'#fff':'#fafbfc', cursor:'pointer', transition:'background .12s' }}
                    onMouseEnter={ev => { ev.currentTarget.style.background = '#f5f6f8' }}
                    onMouseLeave={ev => { ev.currentTarget.style.background = i%2===0?'#fff':'#fafbfc' }}
                  >
                    <td style={{ padding:'12px 14px', fontWeight:700, color:'#14161a', whiteSpace:'nowrap' }}>{e.prenom} {e.nom}</td>
                    <td style={{ padding:'12px 14px', color:'#6b7280' }}>{e.magasin}</td>
                    <td style={{ padding:'12px 14px', color:'#6b7280', whiteSpace:'nowrap' }}>{e.date_entree?new Date(e.date_entree+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}):'—'}</td>
                    <td style={{ padding:'12px 14px', color:'#6b7280' }}>{e.poste||'—'}</td>
                    <td style={{ padding:'12px 14px', color:'#6b7280', whiteSpace:'nowrap' }}>{e.heures?`${e.heures}h`:'—'}</td>
                    <td style={{ padding:'12px 14px', color:'#6b7280' }}>{e.telephone||'—'}</td>
                    <td style={{ padding:'12px 14px' }} onClick={ev=>{ev.stopPropagation();setShowFiche(e)}}><StatusBadge statut={e.statut_documents} /></td>
                    <td style={{ padding:'12px 14px' }} onClick={ev=>ev.stopPropagation()}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => setShowForm(e)} style={{ ...CSS.btn, padding:'5px 10px', background:'#f0f9ff', color:'#0089ba', fontSize:12 }}>Modifier</button>
                        <button onClick={() => setShowDelete(e)} style={{ ...CSS.btn, padding:'5px 10px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:12 }}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         )}
      </div>
      <div style={{ marginTop:10, fontSize:12, color:'#9aa1ac', textAlign:'right' }}>Cliquez sur une ligne pour voir le dossier documentaire.</div>
      {showForm && <EntreeForm initial={showForm==='add'?null:showForm} semaineLundi={semaineLundi} session={session} onSave={handleSave} onClose={() => setShowForm(null)} />}
      {showFiche && <FicheDocuments entity={showFiche} entityType="entree" onClose={() => setShowFiche(null)} onStatutChange={handleStatutChange} />}
      {showDelete && <DeleteConfirm entree={showDelete} onConfirm={handleDelete} onClose={() => setShowDelete(null)} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

function RhDashboard({ session, onLogout }) {
  const [activeTab, setActiveTab] = useState('recrutement')
  const [counts, setCounts] = useState({ recrutement: null, entrees: null })
  const [regionFilter, setRegionFilter] = useState('tous')

  useEffect(() => {
    const s0 = getMondayStr(0)
    Promise.all([apiGetCandidats(), apiGetEntreesRhByWeek(s0)]).then(([cands, ent]) => {
      setCounts({
        recrutement: cands.filter(c => !['valide','refuse'].includes(c.statut)).length,
        entrees: ent.filter(e => e.statut_documents !== 'complet').length,
      })
    })
  }, [])

  const firstName = (session.displayName || '').split(' ')[0]

  return (
    <div style={{ minHeight:'100vh', background:'#f5f6f8', fontFamily:'inherit' }}>
      <div style={{ display:'flex', alignItems:'flex-start' }}>
        <RhSidebar active={activeTab} onNavigate={setActiveTab} counts={counts} firstName={firstName} onLogout={onLogout} />

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ padding:'20px 24px 0', display:'flex', gap:8, flexWrap:'wrap' }}>
            {REGION_FILTERS.map(r => (
              <button
                key={r.id}
                onClick={() => setRegionFilter(r.id)}
                style={{
                  ...CSS.btn, padding:'7px 14px', fontSize:12.5, display:'flex', alignItems:'center', gap:6,
                  background: regionFilter === r.id ? (r.color ? r.bg : '#eaf3fd') : '#fff',
                  color: regionFilter === r.id ? (r.color || '#0089ba') : '#6b7280',
                  border: `1.5px solid ${regionFilter === r.id ? (r.border || '#00abe9') : '#e5e7eb'}`,
                }}
              >
                <span>{r.emoji}</span>{r.label}
              </button>
            ))}
          </div>

          <div style={{ padding:'20px 28px 40px', maxWidth:1120 }}>
            {activeTab === 'recrutement'
              ? <RecrutementView session={session} regionFilter={regionFilter} />
              : <EntreesView session={session} regionFilter={regionFilter} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────

const inputStyle = { width:'100%', boxSizing:'border-box', padding:'12px 14px', marginBottom:12, background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:10, color:'#fff', fontSize:14, fontFamily:'inherit', outline:'none' }

function RhLogin({ onLogin }) {
  const [login, setLogin] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async e => {
    e.preventDefault()
    if (!login.trim()||!code.trim()||loading) return
    setLoading(true); setError('')
    const loginNorm = login.trim().toLowerCase()
    let creds = {}; try { creds = getTrainerCredentials() } catch {}
    const valid = creds[loginNorm] && String(creds[loginNorm]) === code.trim()
    setLoading(false)
    if (!valid) { setError('Identifiant ou code incorrect.'); return }
    const session = { login: loginNorm, displayName: RH_DISPLAY_NAMES[loginNorm] || loginNorm }
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)) } catch {}
    onLogin(session)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:24, background:'linear-gradient(160deg,#0f1923 0%,#1a2535 60%,#00abe9 100%)' }}>
      <form onSubmit={submit} style={{ background:'linear-gradient(175deg,#0099d0 0%,#0d2538 42%,#091520 100%)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:22, width:'100%', maxWidth:400, boxShadow:'0 28px 80px rgba(0,0,0,0.5)', overflow:'hidden', position:'relative' }}>
        <div style={{ position:'absolute', top:-70, right:-70, width:220, height:220, background:'rgba(255,255,255,0.05)', borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ padding:'36px 36px 24px', textAlign:'center', position:'relative', zIndex:1 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="Lunettes Pour Tous" width={140} height={52} style={{ objectFit:'contain', margin:'0 auto 20px' }} />
          <div style={{ fontSize:11, fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:2.5, textTransform:'uppercase', marginBottom:6 }}>Ressources humaines</div>
          <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#fff' }}>Espace RH</h2>
        </div>
        <div style={{ padding:'4px 36px 36px', position:'relative', zIndex:1 }}>
          <input value={login} onChange={e => setLogin(e.target.value)} placeholder="Identifiant" autoCapitalize="off" autoCorrect="off" style={inputStyle} />
          <input value={code} onChange={e => setCode(e.target.value)} placeholder="Code" type="password" style={{ ...inputStyle, marginBottom:0 }} />
          {error && <div style={{ color:'#f87171', fontSize:13, marginTop:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:10, padding:'9px 12px' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', marginTop:18, padding:'13px', border:'none', borderRadius:12, fontSize:14.5, fontWeight:700, fontFamily:'inherit', color:'#fff', cursor:loading?'default':'pointer', background:loading?'rgba(255,255,255,0.15)':'linear-gradient(135deg, #0089ba, #00abe9)' }}>
            {loading ? 'Connexion…' : 'Se connecter →'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function RhPage() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try { const s = localStorage.getItem(SESSION_KEY); if (s) setSession(JSON.parse(s)) } catch {}
    setReady(true)
  }, [])

  const handleLogout = () => { try { localStorage.removeItem(SESSION_KEY) } catch {}; setSession(null) }

  if (!ready) return null
  if (!session) return <RhLogin onLogin={setSession} />
  return <RhDashboard session={session} onLogout={handleLogout} />
}
