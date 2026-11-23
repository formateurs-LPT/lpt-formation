'use client'
import { useState, useEffect } from 'react'
import { MODULES, statutModule, getResultatsAuditTousFormateurs } from '@/lib/auditFormateurs'

const STATUTS = {
  'acquis': { label: '✓ Acquis', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  'en-cours': { label: 'En cours', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  'a-faire': { label: 'À faire', color: 'var(--text-s)', bg: 'rgba(107,114,128,0.12)' },
}

// Vue de synthèse réservée à Kevin (responsable formation) : où en est chaque
// formateur sur chaque module d'audit. Même donnée que AuditFormateursView,
// vue depuis l'autre bout (par formateur, pas par module).
export default function AuditFormateursReporting() {
  const [lignes, setLignes] = useState(null)

  useEffect(() => { getResultatsAuditTousFormateurs().then(setLignes) }, [])

  if (lignes === null) return <p style={{ color: 'var(--text-s)' }}>Chargement…</p>

  return (
    <div className="dash-wrap">
      <div className="dash-header">
        <div>
          <h2>🎯 Audit compétences — tous les formateurs</h2>
          <p>Vue réservée au responsable formation.</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lignes.map(({ trainer, etats }) => (
          <div key={trainer.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>{trainer.display_name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {MODULES.map(m => {
                const etat = etats[m.id]
                const statut = STATUTS[statutModule(etat)]
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                    <span style={{ flex: 1, color: 'var(--text)' }}>{m.nom}</span>
                    {etat.meilleurScore !== null && <span style={{ color: 'var(--text-s)', fontVariantNumeric: 'tabular-nums' }}>{etat.meilleurScore}/12</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: statut.color, background: statut.bg }}>{statut.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
