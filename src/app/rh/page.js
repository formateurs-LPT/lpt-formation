'use client'
import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getTrainerCredentials } from '@/lib/env'
import {
  apiGetEntreesRhByWeek, apiAddEntreeRh, apiUpdateEntreeRh, apiDeleteEntreeRh,
  apiGetDossiersEntree, apiUpsertDocumentEntree,
  apiGetCandidats, apiAddCandidat, apiUpdateCandidat,
  apiAddHistorique, apiGetHistorique,
  apiGetDossiersCandidats, apiUpsertDocumentCandidat,
  apiValiderCandidat, apiSyncFormateur,
} from '@/lib/rhApi'
import { STORES } from '@/lib/storeFollowupData'

const SESSION_KEY = 'rh_session'
const RH_DISPLAY_NAMES = { kevin: 'Kevin Dupuy', quentin: 'Quentin Bahougne' }
const STORE_OPTIONS = STORES.map(s => ({ id: s.id, label: s.label }))

// ── Documents ─────────────────────────────────────────────────────────────────
const DOCS_TOUJOURS = [
  { id: 'piece_identite', label: "Pièce d'identité (recto verso)" },
  { id: 'rib', label: 'RIB' },
  { id: 'secu_vitale', label: 'Attestation sécu sociale ou carte Vitale' },
  { id: 'casier_judiciaire', label: 'Extrait de casier judiciaire' },
]
const DOCS_DOMICILE_PERSO = [{ id: 'justificatif_domicile', label: 'Justificatif de domicile' }]
const DOCS_DOMICILE_HEBERGE = [
  { id: 'identite_hebergeur', label: "Pièce d'identité de l'hébergeur" },
  { id: 'domicile_hebergeur', label: "Justificatif de domicile de l'hébergeur" },
  { id: 'attestation_honneur', label: "Attestation sur l'honneur" },
]
const DOCS_RQTH = [{ id: 'rqth', label: 'Attestation RQTH' }]

function getDocsRequis(entity) {
  const docs = [...DOCS_TOUJOURS]
  if (entity.mode_domicile === 'heberge') docs.push(...DOCS_DOMICILE_HEBERGE)
  else docs.push(...DOCS_DOMICILE_PERSO)
  if (entity.rqth_applicable) docs.push(...DOCS_RQTH)
  return docs
}

function computeStatut(entity, dossiers) {
  const requis = getDocsRequis(entity)
  const remplis = new Set(dossiers.filter(d => d.rempli).map(d => d.type_document))
  const docsOk = requis.every(d => remplis.has(d.id))
  const contactOk = (entity.contact_urgence_nom || '').trim() && (entity.contact_urgence_telephone || '').trim()
  return docsOk && contactOk ? 'complet' : 'incomplet'
}

// ── Pipeline ──────────────────────────────────────────────────────────────────
const PIPELINE = ['a_contacter', 'contacte', 'prise_de_reference', 'entretien_manager']
const STATUT_LABELS = {
  a_contacter: 'À contacter', contacte: 'Contacté',
  prise_de_reference: 'Prise de référence', entretien_manager: 'Entretien manager',
  valide: 'Validé', refuse: 'Refusé',
}
const STATUT_COLORS = {
  a_contacter:        { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
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

// ── Styles ────────────────────────────────────────────────────────────────────
const CSS = {
  input: { width:'100%', boxSizing:'border-box', padding:'10px 12px', background:'#f8fafc', border:'1.5px solid #e2e8f0', borderRadius:8, color:'#1e293b', fontSize:14, fontFamily:'inherit', outline:'none' },
  label: { display:'block', fontSize:11.5, fontWeight:700, color:'#64748b', marginBottom:5, textTransform:'uppercase', letterSpacing:0.5 },
  btn: { padding:'10px 18px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13.5, fontWeight:700, fontFamily:'inherit' },
}
const Field = ({ label, children }) => <div style={{ marginBottom:16 }}><label style={CSS.label}>{label}</label>{children}</div>

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, width = 560, children }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn); return () => document.removeEventListener('keydown', fn)
  }, [onClose])
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(15,25,35,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#fff', borderRadius:16, width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding:'20px 24px 16px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <h3 style={{ margin:0, fontSize:17, fontWeight:700, color:'#0f172a' }}>{title}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:22, color:'#94a3b8', lineHeight:1 }}>×</button>
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

  const toggle = async (typeDoc, currentVal) => {
    const newVal = !currentVal
    setDossiers(prev => prev.map(d => d.type_document === typeDoc ? { ...d, rempli: newVal } : d))
    if (entityType === 'entree') {
      await apiUpsertDocumentEntree(entity.id, typeDoc, newVal)
      const allDocs = await apiGetDossiersEntree(entity.id)
      const newStatut = computeStatut(entity, allDocs)
      await apiUpdateEntreeRh(entity.id, { statut_documents: newStatut })
      onStatutChange?.(entity.id, newStatut); setDossiers(allDocs)
    } else {
      await apiUpsertDocumentCandidat(entity.id, typeDoc, newVal)
      const allDocs = await apiGetDossiersCandidats(entity.id)
      const newStatut = computeStatut(entity, allDocs)
      await apiUpdateCandidat(entity.id, { statut_documents: newStatut })
      onStatutChange?.(entity.id, newStatut); setDossiers(allDocs)
    }
  }

  const docs = getDocsRequis(entity)
  const getDoc = id => dossiers.find(d => d.type_document === id) || { rempli: false }
  const statut = computeStatut(entity, dossiers)

  return (
    <Modal title={`Dossier — ${entity.prenom} ${entity.nom}`} onClose={onClose} width={520}>
      <div style={{ marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{entity.prenom} {entity.nom}</div>
          <div style={{ fontSize:12, color:'#64748b', marginTop:2 }}>{entity.magasin || entity.magasin_vise || '—'} · {entity.poste || entity.poste_vise || '—'}</div>
        </div>
        <StatusBadge statut={statut} />
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'24px 0', color:'#94a3b8' }}>Chargement…</div> : (
        <>
          <div style={{ marginBottom:14 }}>
            {docs.map(doc => {
              const d = getDoc(doc.id)
              return (
                <div key={doc.id} onClick={() => toggle(doc.id, d.rempli)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 14px', marginBottom:6, borderRadius:8, background:d.rempli?'#f0fdf4':'#f8fafc', border:`1.5px solid ${d.rempli?'#86efac':'#e2e8f0'}`, cursor:'pointer' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{ width:18, height:18, borderRadius:4, flexShrink:0, background:d.rempli?'#22c55e':'#fff', border:`2px solid ${d.rempli?'#22c55e':'#cbd5e1'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {d.rempli && <span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:13.5, color:d.rempli?'#166534':'#374151' }}>{doc.label}</span>
                  </div>
                  <span style={{ fontSize:11.5, fontWeight:600, color:d.rempli?'#16a34a':'#94a3b8' }}>{d.rempli ? 'Reçu' : 'En attente'}</span>
                </div>
              )
            })}
          </div>
          <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#0369a1', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Contact urgence</div>
            {entity.contact_urgence_nom || entity.contact_urgence_telephone
              ? <div style={{ fontSize:13.5, color:'#0f172a' }}><span style={{ fontWeight:600 }}>{entity.contact_urgence_nom}</span>{entity.contact_urgence_telephone && <span style={{ color:'#475569' }}> — {entity.contact_urgence_telephone}</span>}</div>
              : <div style={{ fontSize:13, color:'#94a3b8', fontStyle:'italic' }}>Non renseigné</div>}
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
    mode_domicile: initial?.mode_domicile || 'personnel',
    rqth_applicable: initial?.rqth_applicable || false,
    contact_urgence_nom: initial?.contact_urgence_nom || '',
    contact_urgence_telephone: initial?.contact_urgence_telephone || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async e => {
    e.preventDefault()
    if (!form.nom.trim() || !form.prenom.trim() || !form.telephone.trim()) { setError('Nom, prénom et téléphone sont obligatoires.'); return }
    setSaving(true); setError('')
    await onSave({ ...form, nom: form.nom.trim().toUpperCase(), prenom: form.prenom.trim(), cree_par: session.login })
    setSaving(false)
  }

  return (
    <Modal title={isEdit ? 'Modifier le candidat' : 'Ajouter un candidat'} onClose={onClose} width={580}>
      <form onSubmit={submit}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
          <Field label="Nom"><input style={CSS.input} value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="NOM" /></Field>
          <Field label="Prénom"><input style={CSS.input} value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Prénom" /></Field>
        </div>
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
          <Field label="Poste visé"><input style={CSS.input} value={form.poste_vise} onChange={e => set('poste_vise', e.target.value)} placeholder="CVO, Opticien…" /></Field>
        </div>
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
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
        {error && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12, padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>{error}</div>}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button type="button" onClick={onClose} style={{ ...CSS.btn, background:'#f1f5f9', color:'#475569' }}>Annuler</button>
          <button type="submit" disabled={saving} style={{ ...CSS.btn, background:saving?'#94a3b8':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>{saving?'Enregistrement…':isEdit?'Enregistrer':'Ajouter'}</button>
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
      <p style={{ margin:'0 0 16px', fontSize:14, color:'#475569', lineHeight:1.6 }}>
        <strong>{candidat.prenom} {candidat.nom}</strong> passera de <StatutPill statut={candidat.statut} /> à <StatutPill statut={next} />.
      </p>
      <Field label="Note (optionnelle)">
        <textarea style={{ ...CSS.input, height:80, resize:'vertical' }} value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Résultat, remarques…" />
      </Field>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#f1f5f9', color:'#475569' }}>Annuler</button>
        <button disabled={saving} onClick={async () => { setSaving(true); await onConfirm(next, commentaire); setSaving(false) }} style={{ ...CSS.btn, background:saving?'#94a3b8':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>
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
      <p style={{ margin:'0 0 16px', fontSize:14, color:'#475569' }}>
        <strong>{candidat.prenom} {candidat.nom}</strong> sera marqué refusé et sortira de la liste active.
      </p>
      <Field label="Motif (optionnel)">
        <textarea style={{ ...CSS.input, height:70, resize:'vertical' }} value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Motif du refus…" />
      </Field>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#f1f5f9', color:'#475569' }}>Annuler</button>
        <button disabled={saving} onClick={async () => { setSaving(true); await onConfirm(commentaire); setSaving(false) }} style={{ ...CSS.btn, background:saving?'#94a3b8':'#ef4444', color:'#fff' }}>
          {saving ? '…' : 'Confirmer le refus'}
        </button>
      </div>
    </Modal>
  )
}

function ValiderRecrutementModal({ candidat, session, onConfirm, onClose }) {
  const s0 = getMondayStr(0); const s1 = getMondayStr(1)
  const [semaine, setSemaine] = useState(null)
  const [form, setForm] = useState({
    date_entree: s0, heures: '',
    contact_urgence_nom: candidat.contact_urgence_nom || '',
    contact_urgence_telephone: candidat.contact_urgence_telephone || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!semaine) { setError("Sélectionnez la semaine d'entrée."); return }
    setSaving(true); setError('')
    await onConfirm({ semaine, form }); setSaving(false)
  }

  return (
    <Modal title="Valider le recrutement" onClose={onClose} width={520}>
      <div style={{ marginBottom:18, padding:'12px 14px', background:'#f0fdf4', border:'1px solid #86efac', borderRadius:10 }}>
        <div style={{ fontWeight:700, color:'#166534' }}>{candidat.prenom} {candidat.nom}</div>
        <div style={{ fontSize:12.5, color:'#16a34a', marginTop:2 }}>{candidat.magasin || '—'} · {candidat.poste_vise || '—'}</div>
      </div>
      <div style={{ marginBottom:18 }}>
        <div style={{ ...CSS.label, marginBottom:8 }}>Semaine d'entrée <span style={{ color:'#ef4444' }}>*</span></div>
        <div style={{ display:'flex', gap:10 }}>
          {[s0, s1].map(s => (
            <button key={s} type="button" onClick={() => setSemaine(s)} style={{ flex:1, ...CSS.btn, padding:'10px 14px', textAlign:'left', background:semaine===s?'linear-gradient(135deg,#0089ba,#00abe9)':'#f8fafc', color:semaine===s?'#fff':'#475569', border:semaine===s?'none':'1.5px solid #e2e8f0' }}>
              <div style={{ fontWeight:700, fontSize:13 }}>Semaine {getISOWeek(s)}</div>
              <div style={{ fontSize:11, marginTop:2, opacity:0.8 }}>{weekDateRange(s)}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 14px' }}>
        <Field label="Date d'entrée"><input style={CSS.input} type="date" value={form.date_entree} onChange={e => set('date_entree', e.target.value)} /></Field>
        <Field label={`Heures / semaine${!form.heures.trim() ? ' ⚠️' : ''}`}>
          <input style={{ ...CSS.input, borderColor:!form.heures.trim()?'#fbbf24':'#e2e8f0' }} value={form.heures} onChange={e => set('heures', e.target.value)} placeholder="Ex: 35" />
        </Field>
      </div>
      <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:10, padding:'12px 14px', marginBottom:16 }}>
        <div style={{ ...CSS.label, color:'#0369a1', marginBottom:8 }}>Contact urgence</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 12px' }}>
          <input style={CSS.input} value={form.contact_urgence_nom} onChange={e => set('contact_urgence_nom', e.target.value)} placeholder="Nom" />
          <input style={CSS.input} value={form.contact_urgence_telephone} onChange={e => set('contact_urgence_telephone', e.target.value)} placeholder="Téléphone" />
        </div>
      </div>
      {error && <div style={{ color:'#ef4444', fontSize:13, marginBottom:12, padding:'8px 12px', background:'#fef2f2', borderRadius:8 }}>{error}</div>}
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#f1f5f9', color:'#475569' }}>Annuler</button>
        <button disabled={saving} onClick={submit} style={{ ...CSS.btn, background:saving?'#94a3b8':'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff' }}>
          {saving ? 'Validation…' : "Confirmer et créer l'entrée →"}
        </button>
      </div>
    </Modal>
  )
}

function FicheCandidatModal({ candidat: init, session, onClose, onUpdate }) {
  const [candidat, setCandidat] = useState(init)
  const [historique, setHistorique] = useState([])
  const [showDocs, setShowDocs] = useState(false)
  const [showAvancer, setShowAvancer] = useState(false)
  const [showRefuser, setShowRefuser] = useState(false)
  const [showValider, setShowValider] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => { apiGetHistorique(candidat.id).then(setHistorique) }, [candidat.id])

  const push = updated => { setCandidat(updated); onUpdate(updated) }

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
    if (entree) push({ ...candidat, statut: 'valide', entree_id: entree.id })
    setShowValider(false)
  }

  const isActif = !['valide', 'refuse'].includes(candidat.statut)
  const isDecision = candidat.statut === 'entretien_manager'
  const next = nextStatut(candidat.statut)

  return (
    <>
      <Modal title={`${candidat.prenom} ${candidat.nom}`} onClose={onClose} width={560}>
        <div style={{ marginBottom:16, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <StatutPill statut={candidat.statut} />
          {candidat.entree_id && <span style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>✓ Passé en entrée de la semaine</span>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          {[['Téléphone', candidat.telephone], ['Email', candidat.email || '—'], ['Magasin', candidat.magasin || '—'], ['Poste', candidat.poste_vise || '—']].map(([l, v]) => (
            <div key={l} style={{ background:'#f8fafc', borderRadius:8, padding:'8px 12px' }}>
              <div style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:0.5, marginBottom:2 }}>{l}</div>
              <div style={{ fontSize:13.5, color:'#0f172a', fontWeight:500 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
          <button onClick={() => setShowDocs(true)} style={{ ...CSS.btn, padding:'7px 14px', background:'#f0f9ff', color:'#0089ba', fontSize:12.5, display:'flex', alignItems:'center', gap:8 }}>
            Documents <StatusBadge statut={candidat.statut_documents} />
          </button>
          {isActif && <button onClick={() => setShowEdit(true)} style={{ ...CSS.btn, padding:'7px 14px', background:'#f8fafc', color:'#475569', fontSize:12.5, border:'1px solid #e2e8f0' }}>Modifier</button>}
        </div>
        {historique.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Historique</div>
            {historique.map(h => (
              <div key={h.id} style={{ display:'flex', gap:8, padding:'8px 0', borderBottom:'1px solid #f1f5f9', fontSize:12.5, flexWrap:'wrap' }}>
                <span style={{ color:'#94a3b8', flexShrink:0 }}>{new Date(h.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
                <StatutPill statut={h.statut_nouveau} />
                {h.commentaire && <span style={{ color:'#475569', fontStyle:'italic' }}>{h.commentaire}</span>}
              </div>
            ))}
          </div>
        )}
        {isActif && (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', paddingTop:12, borderTop:'1px solid #f1f5f9' }}>
            {isDecision ? (
              <>
                <button onClick={() => setShowValider(true)} style={{ ...CSS.btn, padding:'9px 16px', background:'linear-gradient(135deg,#16a34a,#22c55e)', color:'#fff', fontSize:13 }}>Valider le recrutement →</button>
                <button onClick={() => setShowRefuser(true)} style={{ ...CSS.btn, padding:'9px 16px', background:'#fef2f2', color:'#ef4444', fontSize:13 }}>Refuser</button>
              </>
            ) : next ? (
              <>
                <button onClick={() => setShowAvancer(true)} style={{ ...CSS.btn, padding:'9px 16px', background:'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff', fontSize:13 }}>→ {STATUT_LABELS[next]}</button>
                <button onClick={() => setShowRefuser(true)} style={{ ...CSS.btn, padding:'9px 16px', background:'#fef2f2', color:'#ef4444', fontSize:13 }}>Refuser</button>
              </>
            ) : null}
          </div>
        )}
      </Modal>
      {showDocs && <FicheDocuments entity={candidat} entityType="candidat" onClose={() => setShowDocs(false)} onStatutChange={(_, s) => { const u = {...candidat, statut_documents: s}; setCandidat(u); onUpdate(u) }} />}
      {showAvancer && <AvancerStatutModal candidat={candidat} onConfirm={avancer} onClose={() => setShowAvancer(false)} />}
      {showRefuser && <RefuserModal candidat={candidat} onConfirm={refuser} onClose={() => setShowRefuser(false)} />}
      {showValider && <ValiderRecrutementModal candidat={candidat} session={session} onConfirm={valider} onClose={() => setShowValider(false)} />}
      {showEdit && <CandidatFormModal initial={candidat} session={session} onClose={() => setShowEdit(false)} onSave={async data => { await apiUpdateCandidat(candidat.id, data); const u={...candidat,...data}; setCandidat(u); onUpdate(u); setShowEdit(false) }} />}
    </>
  )
}

function RecrutementView({ session }) {
  const [candidats, setCandidats] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [fiche, setFiche] = useState(null)
  const [showRefuses, setShowRefuses] = useState(false)

  useEffect(() => {
    apiGetCandidats().then(rows => { setCandidats(rows); setLoading(false) })
  }, [])

  const handleAdd = async data => {
    const c = await apiAddCandidat({ ...data, statut: 'a_contacter', statut_documents: 'incomplet' })
    if (c) {
      await apiAddHistorique({ candidat_id: c.id, statut_precedent: null, statut_nouveau: 'a_contacter', commentaire: 'Candidat créé', auteur: session.login })
      setCandidats(prev => [...prev, c])
    }
    setShowAdd(false)
  }

  const handleUpdate = updated => setCandidats(prev => prev.map(c => c.id === updated.id ? updated : c))

  const actifs = candidats.filter(c => !['valide','refuse'].includes(c.statut))
  const refuses = candidats.filter(c => c.statut === 'refuse')
  const valides = candidats.filter(c => c.statut === 'valide')
  const enAttente = candidats.filter(c => c.statut === 'entretien_manager').length

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>{actifs.length}</div>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>en cours</div>
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

      {loading ? <div style={{ textAlign:'center', padding:'48px 0', color:'#94a3b8' }}>Chargement…</div> : (
        <>
          {actifs.length === 0 && !refuses.length && (
            <div style={{ textAlign:'center', padding:'56px 24px', background:'#fff', borderRadius:14, border:'1.5px solid #e2e8f0' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>👥</div>
              <div style={{ fontSize:15, fontWeight:600, color:'#64748b', marginBottom:6 }}>Aucun candidat en cours</div>
              <div style={{ fontSize:13, color:'#94a3b8' }}>Ajoutez un premier candidat pour démarrer le pipeline.</div>
            </div>
          )}
          {PIPELINE.map(statut => {
            const items = actifs.filter(c => c.statut === statut)
            if (!items.length) return null
            return (
              <div key={statut} style={{ marginBottom:20 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <StatutPill statut={statut} />
                  <span style={{ fontSize:12, color:'#94a3b8', fontWeight:600 }}>{items.length} candidat{items.length>1?'s':''}</span>
                </div>
                <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, overflow:'hidden' }}>
                  {items.map((c, i) => (
                    <div key={c.id} onClick={() => setFiche(c)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 16px', borderBottom:i<items.length-1?'1px solid #f1f5f9':'none', cursor:'pointer', gap:12, flexWrap:'wrap' }}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize:12, color:'#64748b', marginTop:1 }}>{c.magasin||'—'} · {c.poste_vise||'—'} · {c.telephone}</div>
                      </div>
                      <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
                        <StatusBadge statut={c.statut_documents} />
                        {statut === 'entretien_manager' && <span style={{ fontSize:11.5, fontWeight:700, color:'#c2410c', background:'#fff7ed', padding:'3px 8px', borderRadius:6, border:'1px solid #fed7aa' }}>Décision</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {refuses.length > 0 && (
            <div style={{ marginTop:8 }}>
              <button onClick={() => setShowRefuses(r => !r)} style={{ ...CSS.btn, padding:'6px 12px', background:'none', color:'#94a3b8', fontSize:12, border:'none' }}>
                {showRefuses?'▲':'▼'} {refuses.length} refusé{refuses.length>1?'s':''}
              </button>
              {showRefuses && (
                <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:12, overflow:'hidden', marginTop:8 }}>
                  {refuses.map((c, i) => (
                    <div key={c.id} onClick={() => setFiche(c)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderBottom:i<refuses.length-1?'1px solid #f1f5f9':'none', cursor:'pointer', opacity:0.65 }}>
                      <div>
                        <div style={{ fontWeight:600, color:'#374151', fontSize:13.5 }}>{c.prenom} {c.nom}</div>
                        <div style={{ fontSize:11.5, color:'#94a3b8' }}>{c.magasin||'—'} · {c.poste_vise||'—'}</div>
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
      {fiche && <FicheCandidatModal candidat={fiche} session={session} onClose={() => setFiche(null)} onUpdate={u => { handleUpdate(u); setFiche(u) }} />}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ENTRÉES DE LA SEMAINE
// ─────────────────────────────────────────────────────────────────────────────

function DeleteConfirm({ entree, onConfirm, onClose }) {
  return (
    <Modal title="Supprimer l'entrée" onClose={onClose} width={420}>
      <p style={{ margin:'0 0 20px', color:'#475569', fontSize:14, lineHeight:1.6 }}>Supprimer <strong>{entree.prenom} {entree.nom}</strong> ({entree.magasin}) ?<br />Action irréversible.</p>
      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={onClose} style={{ ...CSS.btn, background:'#f1f5f9', color:'#475569' }}>Annuler</button>
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
          <Field label="Heures / semaine"><input style={CSS.input} value={form.heures} onChange={e => set('heures', e.target.value)} placeholder="35" /></Field>
          <Field label="Téléphone"><input style={CSS.input} value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 xx xx xx xx" /></Field>
        </div>
        <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
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
          <button type="button" onClick={onClose} style={{ ...CSS.btn, background:'#f1f5f9', color:'#475569' }}>Annuler</button>
          <button type="submit" disabled={saving} style={{ ...CSS.btn, background:saving?'#94a3b8':'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff' }}>{saving?'Enregistrement…':isEdit?'Enregistrer':'Ajouter'}</button>
        </div>
      </form>
    </Modal>
  )
}

function EntreesView({ session }) {
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
  const complet = entrees.filter(e => e.statut_documents==='complet').length

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveWeek(t.id)} style={{ ...CSS.btn, padding:'12px 20px', textAlign:'left', background:activeWeek===t.id?'linear-gradient(135deg,#0089ba,#00abe9)':'#fff', color:activeWeek===t.id?'#fff':'#475569', border:activeWeek===t.id?'none':'1.5px solid #e2e8f0', boxShadow:activeWeek===t.id?'0 4px 14px rgba(0,171,233,0.3)':'none' }}>
            <div style={{ fontSize:13.5, fontWeight:700 }}>{t.label}</div>
            <div style={{ fontSize:11, marginTop:2, opacity:0.8 }}>{t.sub}</div>
          </button>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <div style={{ background:'#fff', border:'1.5px solid #e2e8f0', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:800, color:'#0f172a' }}>{entrees.length}</div>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:600 }}>entrant{entrees.length>1?'s':''}</div>
          </div>
          {entrees.length > 0 && <>
            <div style={{ background:'#dcfce7', border:'1.5px solid #86efac', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#15803d' }}>{complet}</div>
              <div style={{ fontSize:11, color:'#16a34a', fontWeight:600 }}>complet{complet>1?'s':''}</div>
            </div>
            <div style={{ background:'#fff7ed', border:'1.5px solid #fed7aa', borderRadius:10, padding:'10px 16px', textAlign:'center' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'#c2410c' }}>{entrees.length-complet}</div>
              <div style={{ fontSize:11, color:'#ea580c', fontWeight:600 }}>incomplet{entrees.length-complet>1?'s':''}</div>
            </div>
          </>}
        </div>
        <button onClick={() => setShowForm('add')} style={{ ...CSS.btn, padding:'12px 20px', background:'linear-gradient(135deg,#0089ba,#00abe9)', color:'#fff', boxShadow:'0 4px 14px rgba(0,171,233,0.3)', fontSize:14 }}>
          + Ajouter un collaborateur
        </button>
      </div>
      <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid #e2e8f0', overflow:'hidden' }}>
        {loading ? <div style={{ textAlign:'center', padding:'48px 0', color:'#94a3b8' }}>Chargement…</div> :
         !entrees.length ? (
          <div style={{ textAlign:'center', padding:'56px 24px', color:'#94a3b8' }}>
            <div style={{ fontSize:36, marginBottom:12 }}>📋</div>
            <div style={{ fontSize:15, fontWeight:600, color:'#64748b', marginBottom:6 }}>Aucun entrant cette semaine</div>
          </div>
         ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
              <thead>
                <tr style={{ background:'#f8fafc' }}>
                  {['Collaborateur','Magasin','Date entrée','Poste','Heures','Téléphone','Dossier','Actions'].map(h => (
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:0.5, borderBottom:'2px solid #e2e8f0', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entrees.map((e, i) => (
                  <tr key={e.id} onClick={() => setShowFiche(e)} style={{ borderBottom:'1px solid #f1f5f9', background:i%2===0?'#fff':'#fafbfc', cursor:'pointer' }}>
                    <td style={{ padding:'12px 14px', fontWeight:700, color:'#0f172a', whiteSpace:'nowrap' }}>{e.prenom} {e.nom}</td>
                    <td style={{ padding:'12px 14px', color:'#475569' }}>{e.magasin}</td>
                    <td style={{ padding:'12px 14px', color:'#475569', whiteSpace:'nowrap' }}>{e.date_entree?new Date(e.date_entree+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'short'}):'—'}</td>
                    <td style={{ padding:'12px 14px', color:'#475569' }}>{e.poste||'—'}</td>
                    <td style={{ padding:'12px 14px', color:'#475569', whiteSpace:'nowrap' }}>{e.heures?`${e.heures}h`:'—'}</td>
                    <td style={{ padding:'12px 14px', color:'#475569' }}>{e.telephone||'—'}</td>
                    <td style={{ padding:'12px 14px' }} onClick={ev=>{ev.stopPropagation();setShowFiche(e)}}><StatusBadge statut={e.statut_documents} /></td>
                    <td style={{ padding:'12px 14px' }} onClick={ev=>ev.stopPropagation()}>
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => setShowForm(e)} style={{ ...CSS.btn, padding:'5px 10px', background:'#f0f9ff', color:'#0089ba', fontSize:12 }}>Modifier</button>
                        <button onClick={() => setShowDelete(e)} style={{ ...CSS.btn, padding:'5px 10px', background:'#fef2f2', color:'#ef4444', fontSize:12 }}>Suppr.</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
         )}
      </div>
      <div style={{ marginTop:10, fontSize:12, color:'#94a3b8', textAlign:'right' }}>Cliquez sur une ligne pour voir le dossier documentaire.</div>
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

  useEffect(() => {
    const s0 = getMondayStr(0)
    Promise.all([apiGetCandidats(), apiGetEntreesRhByWeek(s0)]).then(([cands, ent]) => {
      setCounts({
        recrutement: cands.filter(c => !['valide','refuse'].includes(c.statut)).length,
        entrees: ent.filter(e => e.statut_documents !== 'complet').length,
      })
    })
  }, [])

  const tabs = [
    { id: 'recrutement', label: 'Recrutement', count: counts.recrutement },
    { id: 'entrees', label: 'Entrées de la semaine', count: counts.entrees },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#f4f7fb', fontFamily:'inherit' }}>
      <div style={{ background:'linear-gradient(90deg,#091520 0%,#0d2538 100%)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'16px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={100} height={38} style={{ objectFit:'contain' }} />
          <div style={{ width:1, height:26, background:'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:2, textTransform:'uppercase' }}>Ressources humaines</div>
            <div style={{ fontSize:15, fontWeight:700, color:'#fff' }}>Bonjour {session.displayName.split(' ')[0]}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, color:'rgba(255,255,255,0.6)', fontSize:12.5, fontWeight:600, padding:'7px 13px', cursor:'pointer', fontFamily:'inherit' }}>Déconnexion</button>
      </div>

      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'flex' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding:'14px 20px', border:'none', background:'none', cursor:'pointer', fontFamily:'inherit', fontSize:14, fontWeight:700, color:activeTab===t.id?'#00abe9':'#64748b', borderBottom:activeTab===t.id?'2px solid #00abe9':'2px solid transparent', display:'flex', alignItems:'center', gap:8 }}>
              {t.label}
              {t.count != null && t.count > 0 && <span style={{ background:activeTab===t.id?'#00abe9':'#e2e8f0', color:activeTab===t.id?'#fff':'#64748b', fontSize:11, fontWeight:700, padding:'1px 7px', borderRadius:10 }}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'24px 20px' }}>
        {activeTab === 'recrutement' ? <RecrutementView session={session} /> : <EntreesView session={session} />}
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
