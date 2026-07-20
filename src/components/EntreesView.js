'use client'
import { useState, useEffect } from 'react'
import { generatePin } from '@/lib/pin'
import {
  buildEntreesFromParticipants,
  entreeDisplayName,
  renameParticipantIdentity,
  normalizeEntreeList,
} from '@/lib/participantNames'
import { sbInsert, sbUpsert, sbSelect, getSharedState, setSharedState, getActiveSessionCode, insertSessionHistory } from '@/lib/supabase'
import { classifyMagasin } from '@/lib/formationCategories'

function fixSpaced(str) {
  let s = str.trim()
  let prev = ''
  while (prev !== s) { prev = s; s = s.replace(/(\d) (\d)/g, '$1$2') }
  return s
}

function fixPhone(str) {
  if (!str) return ''
  const digits = str.replace(/\D/g, '')
  if (digits.length < 9) return ''
  if (digits.length === 10) return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  if (digits.length >= 11) return '+' + digits.substring(0, digits.length - 9) + ' ' + digits.slice(-9).replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{1})/, '$1 $2 $3 $4 $5')
  return digits
}

function parseRHTable(rawText) {
  const POSTES = [
    'Conseiller Vente Optique','Monteur Optique SAV','Opticien Lunetier',
    'Store Manager','Assistant RH','Employé Logistique Polyvalent'
  ]
  const DATE_RE = /\d{2}\/\d{2}\/\d{2,4}/

  let text = rawText
    .replace(/Contrat\s*/gi, ' ')
    .replace(/Date début\s*/gi, '')
    .replace(/NOM\s+Prénom\s+[\s\S]*?Téléphone\s*/i, '')

  const chunks = text.split(DATE_RE)
  const results = []

  chunks.forEach((chunk, i) => {
    if (i === 0) return
    const rawBefore = chunks[i - 1]
    const after = chunk
    const before = rawBefore.replace(/^[\d\s]{8,}\n/m, '').trim()

    let poste = '', textBeforePoste = before
    for (const p of POSTES) {
      const idx = before.lastIndexOf(p)
      if (idx !== -1) { poste = p; textBeforePoste = before.substring(0, idx).trim(); break }
    }
    if (!poste) {
      const low = before.toLowerCase()
      if (low.includes('opticien')) { poste = 'Opticien Lunetier'; textBeforePoste = before.substring(0, before.toLowerCase().lastIndexOf('opticien')).trim() }
      else if (low.includes('monteur')) { poste = 'Monteur Optique SAV'; textBeforePoste = before.substring(0, before.toLowerCase().lastIndexOf('monteur')).trim() }
      else if (low.includes('conseiller')) { poste = 'Conseiller Vente Optique'; textBeforePoste = before.substring(0, before.toLowerCase().lastIndexOf('conseiller')).trim() }
      else if (low.includes('logistique') || low.includes('employé')) { poste = 'Employé Logistique Polyvalent'; textBeforePoste = before.substring(0, Math.max(before.toLowerCase().lastIndexOf('logistique'), before.toLowerCase().lastIndexOf('employ'))).trim() }
      else if (low.includes('manager')) { poste = 'Store Manager'; textBeforePoste = before.substring(0, before.toLowerCase().lastIndexOf('manager')).trim() }
      else if (low.includes('assistant')) { poste = 'Assistant RH'; textBeforePoste = before.substring(0, before.toLowerCase().lastIndexOf('assistant')).trim() }
    }

    const heuresMatch = textBeforePoste.match(/\s+(\d\s?\d)\s*$/)
    let heures = ''
    if (heuresMatch) {
      heures = fixSpaced(heuresMatch[1])
      textBeforePoste = textBeforePoste.substring(0, textBeforePoste.length - heuresMatch[0].length).trim()
    }

    let magasin = '', nameText = textBeforePoste
    const magMatch = textBeforePoste.match(/(LPT[\s\-]+[\w\s\-\'ÀÂÄÉÈÊËÎÏÔÙÛÜ]+|SUPPLY[\s]+[\w\s\-]+|LUNETTES\s+POUR\s+TOUS)/i)
    if (magMatch) {
      magasin = fixSpaced(magMatch[0].trim()).toUpperCase()
      nameText = textBeforePoste.substring(0, textBeforePoste.indexOf(magMatch[0])).trim()
    }

    const afterLines = after.split('\n').map(l => l.trim())
    let telephone = ''
    for (const al of afterLines.slice(0, 4)) {
      if (al.toLowerCase().includes('déjà')) { telephone = 'déjà chez nous'; break }
      const digits = fixSpaced(al).replace(/\D/g, '')
      if (digits.length >= 9) { telephone = fixPhone(digits); break }
    }

    nameText = nameText.replace(/\n/g, ' ').trim().replace(/^[\d\s]+/, '').trim()
    const words = nameText.split(/\s+/).filter(w => w.length > 0)
    let nom = '', prenom = '', splitIdx = words.length
    for (let j = 1; j < words.length; j++) {
      if (words[j][0] === words[j][0].toUpperCase() && words[j] !== words[j].toUpperCase() && !/^\d/.test(words[j]) && words[j].length > 1) {
        splitIdx = j; break
      }
    }
    nom = words.slice(0, splitIdx).join(' ')
    prenom = words.slice(splitIdx).join(' ')
    if (!prenom && words.length > 1) { prenom = words[words.length - 1]; nom = words.slice(0, -1).join(' ') }

    if (nom && nom !== 'NOM' && nom.length > 1 && !/^\d/.test(nom)) {
      const nomT = nom.trim()
      const prenomT = prenom.trim()
      results.push({
        nom: nomT,
        prenom: prenomT,
        fullName: `${nomT} ${prenomT}`.trim(),
        magasin: magasin || '',
        heures,
        poste,
        telephone,
      })
    }
  })

  return results
}

const CAT_META = {
  paris:    { label: 'Présentiel',     icon: '🏢', color: '#0089ba', bg: '#f0f9ff', border: '#bae6fd' },
  province: { label: 'Visio Province', icon: '💻', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  belgique: { label: 'Présentiel Belgique', icon: '🇧🇪', color: '#db2777', bg: '#fdf2f8', border: '#fbcfe8' },
}

function effectiveCat(c) {
  return c._forceCat || classifyMagasin(c.magasin) || 'province'
}

function CollabCard({ c, editing, onStartEdit, onCancelEdit, onSave, saving, onToggleMode }) {
  const cat = effectiveCat(c)
  const meta = CAT_META[cat] || CAT_META.province
  const fullName = entreeDisplayName(c)
  const pin = generatePin(fullName)
  const [nom, setNom] = useState(c.nom || '')
  const [prenom, setPrenom] = useState(c.prenom || '')

  useEffect(() => {
    if (editing) {
      setNom(c.nom || '')
      setPrenom(c.prenom || '')
    }
  }, [editing, c.nom, c.prenom])

  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: meta.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: meta.color, flexShrink: 0 }}>
        {(c.nom || '?')[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <input
              className="finput"
              style={{ flex: '1 1 120px', fontSize: 13, padding: '8px 10px' }}
              placeholder="Nom"
              value={nom}
              onChange={e => setNom(e.target.value)}
            />
            <input
              className="finput"
              style={{ flex: '1 1 120px', fontSize: 13, padding: '8px 10px' }}
              placeholder="Prénom"
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
            />
            <button type="button" className="btn1" style={{ fontSize: 12, padding: '6px 12px' }} disabled={saving} onClick={() => onSave(nom, prenom)}>
              {saving ? '…' : 'OK'}
            </button>
            <button type="button" className="btn2" style={{ fontSize: 12, padding: '6px 10px' }} disabled={saving} onClick={onCancelEdit}>
              Annuler
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {(c.nom || c.prenom) ? `${c.nom} ${c.prenom}`.trim() : fullName}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 2 }}>{c.magasin} · {c.poste}</div>
            <div style={{ fontSize: 11, color: '#0089ba', marginTop: 6, fontWeight: 600 }}>
              Connexion : {fullName}
            </div>
          </>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
        {/* PIN */}
        <div style={{
          background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8,
          padding: '3px 10px', fontSize: 13, fontWeight: 800,
          color: '#0089ba', letterSpacing: 1,
        }}>🔑 {pin}</div>
        {/* Bascule mode */}
        {!editing && (
          <button
            type="button"
            onClick={onToggleMode}
            title="Changer le mode (présentiel / visio)"
            style={{
              background: meta.bg, border: `1px solid ${meta.border}`,
              borderRadius: 8, padding: '3px 10px',
              fontSize: 11, fontWeight: 700, color: meta.color,
              cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            {meta.icon} {meta.label}
            {c._forceCat && <span style={{ opacity: 0.5, fontSize: 9, marginLeft: 2 }}>✎</span>}
          </button>
        )}
        {c.heures && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-s)' }}>{c.heures}h/sem</div>}
        {c.telephone && <div style={{ fontSize: 11, color: 'var(--text-m)' }}>{c.telephone}</div>}
      </div>
      {!editing && (
        <button
          type="button"
          className="btn2"
          style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0 }}
          onClick={onStartEdit}
          title="Modifier le nom"
        >
          ✏️
        </button>
      )}
    </div>
  )
}

function QuickAddModal({ onClose, onAdd }) {
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [magasin, setMagasin] = useState('')
  const [saving, setSaving] = useState(false)

  const zone = classifyMagasin(magasin)
  const zoneLabel = zone === 'paris' ? '🏢 Présentiel Paris' : zone === 'belgique' ? '🇧🇪 Présentiel Belgique' : '💻 Visio Province'
  const zoneColor = zone === 'paris' ? '#0089ba' : zone === 'belgique' ? '#db2777' : '#7c3aed'
  const hasInput = magasin.trim().length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nomT = nom.trim().toUpperCase()
    const prenomT = prenom.trim()
    const magT = magasin.trim().toUpperCase()
    if (!nomT || !prenomT) return
    setSaving(true)
    await onAdd({ nom: nomT, prenom: prenomT, fullName: `${nomT} ${prenomT}`.trim(), magasin: magT, poste: '', heures: '', telephone: '' })
    setSaving(false)
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 201, background: '#fff', borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
        padding: '28px 32px', width: 380, maxWidth: '90vw',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>➕ Ajout rapide</div>
            <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 2 }}>Ajoute un collaborateur à la liste existante</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-s)', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>Nom</label>
              <input
                className="finput"
                placeholder="DUPONT"
                value={nom}
                onChange={e => setNom(e.target.value)}
                autoFocus
                required
                style={{ width: '100%', fontSize: 14, padding: '10px 12px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>Prénom</label>
              <input
                className="finput"
                placeholder="Jean"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                required
                style={{ width: '100%', fontSize: 14, padding: '10px 12px' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-s)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 5 }}>Magasin</label>
            <input
              className="finput"
              placeholder="LPT Chatelet, LPT Lyon, Namur…"
              value={magasin}
              onChange={e => setMagasin(e.target.value)}
              style={{ width: '100%', fontSize: 14, padding: '10px 12px' }}
            />
          </div>

          {/* Aperçu classification */}
          <div style={{
            background: hasInput ? zoneColor + '12' : '#f5f5f5',
            border: `1.5px solid ${hasInput ? zoneColor + '55' : '#e5e7eb'}`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            transition: 'all .2s',
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: hasInput ? zoneColor : '#d1d5db', flexShrink: 0, transition: 'all .2s' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: hasInput ? zoneColor : 'var(--text-s)' }}>
                {hasInput ? zoneLabel : 'Classification automatique'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-s)', marginTop: 1 }}>
                {hasInput ? 'basé sur le magasin indiqué' : 'saisissez le magasin pour voir la catégorie'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" className="btn2" style={{ flex: 1 }} onClick={onClose} disabled={saving}>Annuler</button>
            <button type="submit" className="btn1" style={{ flex: 2 }} disabled={saving || !nom.trim() || !prenom.trim()}>
              {saving ? 'Ajout…' : '✓ Ajouter le collaborateur'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

function GroupSection({ title, items, editingIndex, savingIndex, onStartEdit, onCancelEdit, onSave, onToggleMode }) {
  if (!items.length) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid #111' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
        <span style={{ fontSize: 13, color: 'var(--text-m)' }}>{items.length} collaborateur{items.length > 1 ? 's' : ''}</span>
      </div>
      {items.map(({ c, index }) => (
        <CollabCard
          key={index}
          c={c}
          editing={editingIndex === index}
          saving={savingIndex === index}
          onStartEdit={() => onStartEdit(index)}
          onCancelEdit={onCancelEdit}
          onSave={(nom, prenom) => onSave(index, nom, prenom)}
          onToggleMode={() => onToggleMode(index)}
        />
      ))}
    </div>
  )
}

function obKeyFromName(name) {
  return (name || '').replace(/"/g, '')
}

export default function EntreesView({ onBack, onToast, pName }) {
  const [pasteText, setPasteText] = useState('')
  const [entrees, setEntrees] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [savingIndex, setSavingIndex] = useState(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const handleQuickAdd = async (newEntry) => {
    const next = [...entrees, newEntry]
    setEntrees(next)
    const synced = await persistEntreesList(next)
    onToast(synced
      ? `✓ ${newEntry.nom} ${newEntry.prenom} ajouté — ${classifyMagasin(newEntry.magasin) === 'paris' ? 'Présentiel Paris' : classifyMagasin(newEntry.magasin) === 'belgique' ? 'Présentiel Belgique' : 'Visio Province'}`
      : `${newEntry.nom} ${newEntry.prenom} ajouté localement (sync échouée)`
    )
    if (!showResults) setShowResults(true)
  }

  const persistEntreesList = async (list, obDataPatch = null) => {
    localStorage.setItem('entrees_data', JSON.stringify(list))
    const patch = { entrees_data: list }
    if (obDataPatch) patch.ob_data = obDataPatch
    return setSharedState(patch)
  }

  const handleSaveCollab = async (index, nom, prenom) => {
    const nomT = (nom || '').trim()
    const prenomT = (prenom || '').trim()
    if (!nomT && !prenomT) {
      onToast('Nom ou prénom requis')
      return
    }
    setSavingIndex(index)
    const old = entrees[index]
    const oldCanonical = entreeDisplayName(old)
    const oldKey = obKeyFromName(oldCanonical)
    const fullName = `${nomT} ${prenomT}`.trim()
    const newKey = obKeyFromName(fullName)

    const next = [...entrees]
    next[index] = {
      ...old,
      nom: nomT,
      prenom: prenomT,
      fullName,
    }
    setEntrees(next)

    let obPatch = null
    try {
      const state = await getSharedState()
      const obData = { ...(state.ob_data || JSON.parse(localStorage.getItem('ob_data') || '{}')) }
      if (oldKey !== newKey && obData[oldKey]) {
        obData[newKey] = obData[oldKey]
        delete obData[oldKey]
        localStorage.setItem('ob_data', JSON.stringify(obData))
        obPatch = obData
      }
    } catch {
      /* ignore */
    }

    const synced = await persistEntreesList(next, obPatch)
    if (synced && oldCanonical !== fullName) {
      await renameParticipantIdentity(oldCanonical, fullName)
    }
    setSavingIndex(null)
    setEditingIndex(null)
    if (synced) {
      onToast(
        oldCanonical !== fullName
          ? `Nom mis à jour. Connexion : « ${fullName} »`
          : 'Nom mis à jour (liste RH synchronisée)'
      )
    } else {
      onToast('Nom mis à jour localement — sync Supabase échouée')
    }
  }

  useEffect(() => {
    const load = async () => {
      // 1. Liste RH dans trainer_state (source de vérité)
      let saved = []
      let rhListDefined = false
      try {
        const state = await getSharedState()
        if (Array.isArray(state.entrees_data)) {
          rhListDefined = true
          saved = state.entrees_data
        }
      } catch {
        const local = JSON.parse(localStorage.getItem('entrees_data') || '[]')
        if (local.length > 0) {
          rhListDefined = true
          saved = local
        }
      }

      // Tableau vide en BDD = liste volontairement vidée → ne pas recharger depuis participants
      if (rhListDefined) {
        if (saved.length > 0) {
          setEntrees(normalizeEntreeList(saved))
          setShowResults(true)
        }
        return
      }

      // 2. Fallback uniquement si import RH jamais fait (pas de clé entrees_data)
      try {
        const rows = await sbSelect('participants', `session_code=eq.${getActiveSessionCode()}&order=joined_at.asc`)
        if (rows && rows.length > 0) {
          const converted = buildEntreesFromParticipants(rows)
          setEntrees(converted)
          setShowResults(true)
          setSharedState({ entrees_data: converted }).catch(console.warn)
        }
      } catch (e) {
        console.warn('Chargement participants échoué', e)
      }
    }
    load()
  }, [])

  const handleParse = () => {
    const text = pasteText.trim()
    if (!text) { onToast('Collez d\'abord le contenu du tableau'); return }
    setLoading(true)
    setTimeout(async () => {
      try {
        const results = parseRHTable(text)
        if (results.length === 0) {
          onToast('Aucun collaborateur détecté. Vérifiez le contenu.')
          setLoading(false)
          return
        }
        setEntrees(results)
        localStorage.setItem('entrees_data', JSON.stringify(results)) // cache local
        const synced = await persistEntreesList(results)
        setShowResults(true)
        if (synced) {
          onToast(`${results.length} collaborateurs importés ✓ (liste enregistrée en BDD)`)
        } else {
          onToast(`${results.length} collaborateurs importés localement — sync Supabase échouée (table trainer_state)`)
        }
      } catch (e) {
        console.error(e)
        onToast('Erreur de lecture. Réessayez.')
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleClear = async () => {
    if (!confirm('Vider la liste des entrées ?')) return
    setEntrees([])
    setShowResults(false)
    setPasteText('')
    localStorage.removeItem('entrees_data')
    const synced = await setSharedState({ entrees_data: [], ob_data: {}, ob_date: null, ob_day: '1' })
    onToast(synced ? 'Liste vidée' : 'Liste vidée localement — sync Supabase échouée (rechargez après correction)')
  }

  const handleCloture = async () => {
    if (!confirm('Clôturer la semaine ? Les données seront archivées dans Supabase et la liste sera vidée.')) return
    try {
      const sharedState = await getSharedState()
      const obData = sharedState.ob_data || JSON.parse(localStorage.getItem('ob_data') || '{}')
      const weekDate = new Date().toISOString().slice(0, 10)

      // Archiver chaque collaborateur
      for (const c of entrees) {
        const fullName = ((c.nom || '') + ' ' + (c.prenom || '')).trim()
        const key = fullName.replace(/"/g, '')
        const pin = generatePin(fullName)
        const d = obData[key] || {}
        await sbInsert('onboarding_sessions', {
          week_date: weekDate,
          collaborateur: fullName,
          pin,
          magasin: c.magasin || '',
          poste: c.poste || '',
          present: !!d.present,
          contrat: !!d.contrat,
        })
      }

      // Ajouter une ligne dans session_history
      await insertSessionHistory({
        sessionCode: getActiveSessionCode,
        sessionDate: weekDate,
        trainerName: pName || localStorage.getItem('trainer_name') || 'Formateur',
        participants: [],
        quizResults: {
          type: 'onboarding_week',
          week_date: weekDate,
          trainer_name: pName || localStorage.getItem('trainer_name') || 'Formateur',
          participant_count: entrees.length,
          notes: `Onboarding semaine du ${weekDate} — ${entrees.length} collaborateurs`,
        },
        scenarioResponses: [],
      })

      // Vider localStorage + Supabase shared state
      localStorage.removeItem('entrees_data')
      localStorage.removeItem('ob_data')
      localStorage.removeItem('ob_date')
      localStorage.removeItem('ob_day')
      await setSharedState({ entrees_data: [], ob_data: {}, ob_date: null, ob_day: '1' })
      setEntrees([])
      setShowResults(false)
      onToast(`✓ Semaine clôturée — ${entrees.length} collaborateurs archivés`)
    } catch (e) {
      console.error(e)
      onToast('Erreur lors de la clôture. Réessayez.')
    }
  }

  const handleToggleMode = async (index) => {
    const c = entrees[index]
    const current = effectiveCat(c)
    // Cycle : paris → province/belgique auto → paris → …
    // Si forcé en paris mais auto = visio : retirer le forcage (revenir à l'auto)
    // Si forcé en visio ou auto = visio : forcer paris
    // Si auto = paris et pas de force : forcer province
    let newForce
    if (current === 'paris') {
      const auto = classifyMagasin(c.magasin)
      newForce = (auto !== 'paris') ? null : 'province' // retirer le forcage si auto est visio, sinon forcer province
    } else {
      newForce = 'paris'
    }
    const next = [...entrees]
    next[index] = { ...c, _forceCat: newForce }
    setEntrees(next)
    await persistEntreesList(next)
    const finalCat = effectiveCat(next[index])
    const label = CAT_META[finalCat]?.label || finalCat
    onToast(`${entreeDisplayName(c)} → ${label}`)
  }

  const paris    = entrees.map((c, i) => ({ c, index: i })).filter(({ c }) => effectiveCat(c) === 'paris')
  const province = entrees.map((c, i) => ({ c, index: i })).filter(({ c }) => effectiveCat(c) === 'province')
  const belgique = entrees.map((c, i) => ({ c, index: i })).filter(({ c }) => effectiveCat(c) === 'belgique')

  const groupProps = {
    editingIndex,
    savingIndex,
    onStartEdit: setEditingIndex,
    onCancelEdit: () => setEditingIndex(null),
    onSave: handleSaveCollab,
    onToggleMode: handleToggleMode,
  }

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour</button>
      <div className="dash-header">
        <div>
          <h2>Entrées de la semaine</h2>
          <p>Dispatch automatique : Présentiel Paris · Visio Province · Présentiel Belgique</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {showResults && (
            <button className="btn1" onClick={() => setShowQuickAdd(true)} style={{ fontSize: 13, fontWeight: 700 }}>
              ➕ Ajout rapide
            </button>
          )}
          {showResults && (
            <button className="btn2" onClick={() => setShowResults(false)} style={{ fontSize: 13 }}>
              ✏️ Modifier
            </button>
          )}
          {showResults && entrees.length > 0 && (
            <button className="btn2" onClick={handleCloture} style={{ color: '#16a34a', borderColor: '#16a34a', fontSize: 13, fontWeight: 700 }}>
              ✓ Clôturer la semaine
            </button>
          )}
          <button className="btn2" onClick={handleClear} style={{ color: '#dc2626', borderColor: '#dc2626', fontSize: 13 }}>
            🗑 Vider
          </button>
        </div>
      </div>

      {/* Paste zone */}
      {!showResults && (
        <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--r)', padding: 24, marginBottom: 16, background: '#fafafa' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>📋 Coller le texte du tableau RH</div>
          <p style={{ fontSize: 12, color: 'var(--text-s)', marginBottom: 12 }}>
            Ouvrez votre image dans Aperçu (Mac) → sélectionnez tout (Cmd+A) → copiez (Cmd+C) → collez ici
          </p>
          <textarea
            style={{ width: '100%', height: 180, padding: 12, border: '1.5px solid var(--border)', borderRadius: 'var(--rs)', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text)', resize: 'vertical', outline: 'none', background: '#fff' }}
            placeholder="Collez ici le contenu copié depuis votre tableau..."
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
          <button className="btn1" style={{ marginTop: 10, width: '100%' }} onClick={handleParse} disabled={loading}>
            {loading ? 'Analyse en cours...' : 'Analyser et dispatcher →'}
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--lpt-l)', borderTopColor: 'var(--lpt)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 14, color: 'var(--text-s)' }}>Analyse du tableau en cours...</div>
        </div>
      )}

      {/* Results */}
      {showResults && entrees.length > 0 && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Présentiel Paris', count: paris.length, color: '#0089ba' },
              { label: 'Visio Province', count: province.length, color: '#7c3aed' },
              { label: 'Présentiel Belgique', count: belgique.length, color: '#db2777' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <GroupSection title="Présentiel Paris" items={paris} {...groupProps} />
          <GroupSection title="Visio Province" items={province} {...groupProps} />
          <GroupSection title="Présentiel Belgique" items={belgique} {...groupProps} />
        </>
      )}

      {showQuickAdd && (
        <QuickAddModal
          onClose={() => setShowQuickAdd(false)}
          onAdd={handleQuickAdd}
        />
      )}
    </div>
  )
}
