'use client'
import { useState, useEffect } from 'react'

const PARIS_MAGASINS = ['chatelet','st lazare','saint lazare','montparnasse','italie','commerce','bastille','cergy','creteil','créteil','belle epine','belle épine','paris','st ouen','saint ouen','ouen','beauchamp','odysseum','supply']
const BELGIQUE_MAGASINS = ['namur','liege','liège','fripier','ixelles','charleroi','bruxelles']

function classifyMagasin(magasin) {
  const m = (magasin || '').toLowerCase()
  if (BELGIQUE_MAGASINS.some(b => m.includes(b))) return 'belgique'
  if (PARIS_MAGASINS.some(p => m.includes(p))) return 'paris'
  return 'province'
}

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
  const DATE_RE = /\d{2}\/\d{2}\/\d{4}/

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
      results.push({ nom: nom.trim(), prenom: prenom.trim(), magasin: magasin || '', heures, poste, telephone })
    }
  })

  return results
}

function CollabCard({ c }) {
  const cat = classifyMagasin(c.magasin)
  const colors = { paris: '#0089ba', province: '#7c3aed', belgique: '#db2777' }
  const color = colors[cat] || '#888'
  return (
    <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color, flexShrink: 0 }}>
        {(c.nom || '?')[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{c.nom} {c.prenom}</div>
        <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 2 }}>{c.magasin} · {c.poste}</div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {c.heures && <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-s)' }}>{c.heures}h/sem</div>}
        {c.telephone && <div style={{ fontSize: 11, color: 'var(--text-m)', marginTop: 2 }}>{c.telephone}</div>}
      </div>
    </div>
  )
}

function GroupSection({ title, collabs }) {
  if (!collabs.length) return null
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '2px solid #111' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{title}</h3>
        <span style={{ fontSize: 13, color: 'var(--text-m)' }}>{collabs.length} collaborateur{collabs.length > 1 ? 's' : ''}</span>
      </div>
      {collabs.map((c, i) => <CollabCard key={i} c={c} />)}
    </div>
  )
}

export default function EntreesView({ onBack, onToast }) {
  const [pasteText, setPasteText] = useState('')
  const [entrees, setEntrees] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('entrees_data') || '[]')
    if (saved.length > 0) { setEntrees(saved); setShowResults(true) }
  }, [])

  const handleParse = () => {
    const text = pasteText.trim()
    if (!text) { onToast('Collez d\'abord le contenu du tableau'); return }
    setLoading(true)
    setTimeout(() => {
      try {
        const results = parseRHTable(text)
        if (results.length === 0) {
          onToast('Aucun collaborateur détecté. Vérifiez le contenu.')
          setLoading(false)
          return
        }
        setEntrees(results)
        localStorage.setItem('entrees_data', JSON.stringify(results))
        setShowResults(true)
        onToast(`${results.length} collaborateurs importés ✓`)
      } catch (e) {
        console.error(e)
        onToast('Erreur de lecture. Réessayez.')
      } finally {
        setLoading(false)
      }
    }, 300)
  }

  const handleClear = () => {
    if (!confirm('Vider la liste des entrées ?')) return
    setEntrees([])
    setShowResults(false)
    setPasteText('')
    localStorage.removeItem('entrees_data')
    onToast('Liste vidée')
  }

  const paris = entrees.filter(c => classifyMagasin(c.magasin) === 'paris')
  const province = entrees.filter(c => classifyMagasin(c.magasin) === 'province')
  const belgique = entrees.filter(c => classifyMagasin(c.magasin) === 'belgique')

  return (
    <div className="dash-wrap">
      <button className="detail-back" onClick={onBack}>← Retour</button>
      <div className="dash-header">
        <div>
          <h2>Entrées de la semaine</h2>
          <p>Dispatch automatique : Présentiel Paris · Visio Province · Visio Belgique</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {showResults && (
            <button className="btn2" onClick={() => setShowResults(false)} style={{ fontSize: 13 }}>
              ✏️ Modifier
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
              { label: 'Visio Belgique', count: belgique.length, color: '#db2777' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--rs)', padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.count}</div>
                <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <GroupSection title="Présentiel Paris" collabs={paris} />
          <GroupSection title="Visio Province" collabs={province} />
          <GroupSection title="Visio Belgique" collabs={belgique} />
        </>
      )}
    </div>
  )
}
