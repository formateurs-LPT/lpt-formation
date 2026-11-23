'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { MODULES, NB_FORMATS, etatModules, statutModule, getResultatsAudit, enregistrerResultatAudit } from '@/lib/auditFormateurs'
import { getFormateurId } from '@/lib/notesTerrainApi'

// Audit compétences formateurs : même moteur que les modules après-formation
// (Cours / Entraînement / Test), mais pour les formateurs eux-mêmes — pas
// d'ouverture au cas par cas, tous les modules publiés sont visibles tout de
// suite. Objectif : vérifier qu'un formateur ne dit pas de coquilles sur le
// contenu qu'il présente en salle.

const STATUTS = {
  'acquis': { label: '✓ Acquis', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  'en-cours': { label: 'En cours', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  'a-faire': { label: 'À faire', color: 'var(--text-s)', bg: 'rgba(107,114,128,0.12)' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

function LecteurModule({ module, etat, onFerme, onMessage }) {
  const iframeRef = useRef(null)
  const [src] = useState(() => {
    const p = new URLSearchParams({ m: module.id, faits: [...etat.formats].join(','), acquis: etat.acquis ? '1' : '0' })
    const chemin = process.env.NODE_ENV === 'development' ? module.fichier : `${module.id}/`
    return `/audit-formateurs/${chemin}?${p}`
  })

  useEffect(() => {
    const ecouter = event => {
      if (event.origin !== window.location.origin) return
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = event.data
      if (!data || data.source !== 'lpt-audit-formateur' || data.module !== module.id) return
      onMessage(data)
    }
    window.addEventListener('message', ecouter)
    return () => window.removeEventListener('message', ecouter)
  }, [module.id, onMessage])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onFerme} className="btn2" style={{ padding: '6px 14px' }}>← Fermer</button>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{module.nom}</div>
      </div>
      <iframe ref={iframeRef} src={src} title={module.nom} style={{ flex: 1, width: '100%', border: 0, background: '#f2f4f7' }} />
    </div>
  )
}

export default function AuditFormateursView({ pName }) {
  const [trainerId, setTrainerId] = useState(null)
  const [resultats, setResultats] = useState(null)
  const [moduleOuvert, setModuleOuvert] = useState(null)
  const [alerte, setAlerte] = useState(null)

  const charger = useCallback(async id => {
    const res = await getResultatsAudit(id)
    setResultats(res)
  }, [])

  useEffect(() => {
    getFormateurId(pName).then(id => { setTrainerId(id); if (id) charger(id) })
  }, [pName, charger])

  const surMessage = useCallback(async message => {
    if (!trainerId) return
    const ok = await enregistrerResultatAudit(trainerId, message)
    if (!ok) { setAlerte("⚠️ Le résultat n'a pas pu être enregistré."); return }
    if (message.type === 'test') {
      const reussi = message.score >= 10
      setAlerte(reussi ? `✅ Test réussi : ${message.score}/12, module acquis !` : `Test enregistré : ${message.score}/12`)
    }
    charger(trainerId)
  }, [trainerId, charger])

  if (resultats === null) return <p style={{ color: 'var(--text-s)' }}>Chargement…</p>

  const etats = etatModules(resultats)
  const moduleActif = MODULES.find(m => m.id === moduleOuvert)

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h2>🎯 Audit compétences formateur</h2>
          <p>Le contenu des modules que tu présentes en salle — pour vérifier qu'aucune coquille ne s'est glissée.</p>
        </div>
      </div>
      {alerte && <div style={{ fontSize: 13, color: 'var(--text)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>{alerte}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MODULES.map(m => {
          const etat = etats[m.id]
          const statut = STATUTS[statutModule(etat)]
          const derniere = etat.tentatives[0]
          return (
            <button key={m.id} onClick={() => setModuleOuvert(m.id)} style={{
              textAlign: 'left', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '14px 18px', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{m.nom}</div>
                <div style={{ fontSize: 12, color: 'var(--text-s)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
                  Entraînement {etat.formats.size}/{NB_FORMATS}
                  {' · '}{etat.tentatives.length} test{etat.tentatives.length > 1 ? 's' : ''}
                  {etat.meilleurScore !== null && ` · meilleur ${etat.meilleurScore}/12`}
                  {derniere && ` · ${fmtDate(derniere.created_at)}`}
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: statut.color, background: statut.bg, flexShrink: 0 }}>{statut.label}</span>
            </button>
          )
        })}
      </div>
      {moduleActif && (
        <LecteurModule
          module={moduleActif}
          etat={etats[moduleActif.id]}
          onFerme={() => setModuleOuvert(null)}
          onMessage={surMessage}
        />
      )}
    </div>
  )
}
