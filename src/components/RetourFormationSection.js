'use client'
import { useState, useEffect } from 'react'
import { sbSelect } from '@/lib/supabase'
import { classifyMagasin } from '@/lib/formationCategories'
import { normalizeNameKey } from '@/lib/trainerAccounts'
import { entreeEstDuMagasin } from '@/lib/storeRosterMerge'
import CompteRenduManager from './CompteRenduManager'
import { mergeFormationReports, AutoEvalReadOnly } from './RetourFormationView'

// Retour de formation initiale (formation_reports) affiché dans la fiche du
// suivi magasin. Les retours sont nommés « NOM Prénom » à la main par le
// formateur, souvent avec une autre orthographe que le roster (« SANDRI
// Bastian » / Bastian Sandri Garin, « MOUFFLET-PINSON » / Mouffet-Pinson) :
// on cherche par début de nom, puis on garde ceux du même prénom et du même
// magasin.
const AUTO_EVAL = '__auto_eval__'

const mots = (s) => normalizeNameKey(s).split(' ').filter(Boolean)

function memePersonne(nomRetour, collaborateur) {
  const motsRetour = mots(nomRetour)
  const prenomOk = mots(collaborateur.prenom).every(p => motsRetour.includes(p))
  const nomOk = mots(collaborateur.nom).some(n => n.length >= 3 && motsRetour.some(r => r.slice(0, 4) === n.slice(0, 4)))
  return prenomOk && nomOk
}

async function chargerRetour(store, collaborateur) {
  const debuts = [...new Set(mots(collaborateur.nom).filter(n => n.length >= 3).map(n => n.slice(0, 4)))]
  if (!debuts.length) return null
  const ou = debuts.map(d => `collaborateur.ilike.*${encodeURIComponent(d)}*`).join(',')
  const rows = await sbSelect('formation_reports', `or=(${ou})&order=updated_at.desc&limit=50`).catch(() => []) || []
  const siens = rows.filter(r => memePersonne(r.collaborateur, collaborateur))
  const retours = siens.filter(r => r.trainer_name !== AUTO_EVAL && entreeEstDuMagasin({ magasin: r.stats_snapshot?.magasin }, store))
  if (!retours.length) return null
  const nomRetour = retours[0].collaborateur
  return {
    retour: mergeFormationReports(retours),
    autoEval: siens.find(r => r.trainer_name === AUTO_EVAL && r.collaborateur === nomRetour)?.stats_snapshot || null,
  }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function FenetreRetour({ data, onFermer }) {
  const [onglet, setOnglet] = useState('retour')
  const { retour, autoEval } = data
  const snap = retour.snapshot
  const reportData = {
    collaborateur:       retour.latestRow.collaborateur,
    trainerName:         retour.trainerName,
    weekDate:            retour.weekDate,
    categoryKey:         classifyMagasin(snap.magasin || '') || 'province',
    assessments:         snap.theme_assessments     || {},
    attitudeStatus:      snap.attitude_status       || null,
    attitudeNote:        snap.attitude_note         || '',
    participationStatus: snap.participation_status  || null,
    participationNote:   snap.participation_note    || '',
    comprehensionStatus: snap.comprehension_status  || null,
    comprehensionNote:   snap.comprehension_note    || '',
    appreciation:        snap.appreciation          || null,
    commentaireLibre:    snap.commentaire_libre     || '',
    autoEval:            autoEval?.auto_eval        || null,
    pointsRank:          snap.points_rank           || null,
    pointsRankOf:        snap.points_rank_of        || null,
    totalPoints:         snap.total_points          || 0,
  }

  useEffect(() => {
    const surTouche = (e) => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', surTouche)
    return () => window.removeEventListener('keydown', surTouche)
  }, [onFermer])

  return (
    <div onClick={onFermer} role="dialog" aria-modal="true" aria-label="Retour de formation" style={{
      position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(15,17,21,0.55)',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start', overflowY: 'auto', padding: '24px 12px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 760, background: '#f5f6f8', borderRadius: 16, padding: '18px 16px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#14161a' }}>📝 Retour de formation</div>
            <div style={{ fontSize: 12.5, color: '#6b7280' }}>Par {retour.trainerName} · formation du {formatDate(retour.weekDate)}</div>
          </div>
          <button onClick={onFermer} className="btn2" style={{ padding: '6px 12px', fontSize: 12 }}>Fermer</button>
        </div>
        {autoEval?.auto_eval && (
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#ffffff', borderRadius: 12, padding: 4 }}>
            {[['retour', '📝 Retour formateur'], ['autoeval', '🙋 Auto-évaluation']].map(([cle, label]) => (
              <button key={cle} onClick={() => setOnglet(cle)} style={{
                flex: 1, padding: '9px 12px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
                background: onglet === cle ? '#f5f6f8' : 'transparent', color: onglet === cle ? '#14161a' : '#6b7280',
              }}>{label}</button>
            ))}
          </div>
        )}
        {onglet === 'retour' ? (
          <CompteRenduManager data={reportData} />
        ) : (
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 22px', border: '1px solid #e5e7eb' }}>
            <AutoEvalReadOnly snap={autoEval} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function RetourFormationSection({ store, collaborateur }) {
  const [data, setData] = useState(undefined)
  const [ouvert, setOuvert] = useState(false)

  useEffect(() => {
    let actif = true
    setData(undefined)
    chargerRetour(store, collaborateur).then(d => { if (actif) setData(d) })
    return () => { actif = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.id, collaborateur.id])

  if (!data) return null

  return (
    <div style={{ marginTop: 32 }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', margin: '0 0 14px' }}>📝 Retour de formation</h3>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 13.5, color: 'var(--text)' }}>
          Formation initiale avec <strong>{data.retour.trainerName}</strong>, semaine du {formatDate(data.retour.weekDate)}
        </div>
        <button onClick={() => setOuvert(true)} className="btn2" style={{ padding: '6px 12px', fontSize: 12 }}>Voir le retour</button>
      </div>
      {ouvert && <FenetreRetour data={data} onFermer={() => setOuvert(false)} />}
    </div>
  )
}
