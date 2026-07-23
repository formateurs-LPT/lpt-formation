'use client'
import { useState } from 'react'
import { DIRECTEURS } from '@/lib/directeursData'

function getWeekDate() {
  const d = new Date()
  const day = d.getDay()
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  return d.toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function RetourDirecteurView({ onBack }) {
  const weekDate = getWeekDate()
  const [copied, setCopied] = useState(null)

  const getUrl = (drKey) => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/rapport-dr/?dr=${drKey}&w=${weekDate}`
  }

  const handleCopy = (drKey) => {
    const url = getUrl(drKey)
    navigator.clipboard.writeText(url).catch(() => {})
    setCopied(drKey)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleOpen = (drKey) => {
    window.open(getUrl(drKey), '_blank')
  }

  return (
    <div id="dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden', background: '#f8fafc' }}>

      {/* Header */}
      <div style={{
        padding: '18px 24px', background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
      }}>
        <button className="detail-back" onClick={onBack}>← Tableau de bord</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>🗂 Retour Directeurs Régionaux</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Rapports synthétiques · Semaine du {formatDate(weekDate)}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px' }}>

        {/* Explication */}
        <div style={{
          background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 14,
          padding: '16px 20px', marginBottom: 28, display: 'flex', gap: 14, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>ℹ️</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>
              Comment ça fonctionne ?
            </div>
            <div style={{ fontSize: 13, color: '#1d4ed8', lineHeight: 1.65 }}>
              Chaque directeur régional dispose d'un lien personnel. Ce lien affiche uniquement les formés de son réseau
              avec une appréciation globale <strong>Bon / Moyen / Mauvais</strong>. En cas de retour négatif,
              les commentaires du formateur sont accessibles directement dans le rapport.
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: '#3b82f6', fontWeight: 600 }}>
              ⚡ Les appréciations sont renseignées dans la section "Retour de formation".
            </div>
          </div>
        </div>

        {/* Cards DR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(DIRECTEURS).map(([key, dr]) => (
            <div
              key={key}
              style={{
                background: '#fff', border: '1.5px solid #e2e8f0',
                borderRadius: 18, overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              {/* Header DR */}
              <div style={{
                background: `linear-gradient(135deg, ${dr.color}18 0%, ${dr.color}08 100%)`,
                borderBottom: `1px solid ${dr.color}30`,
                padding: '18px 22px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  background: `${dr.color}15`, border: `2px solid ${dr.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {dr.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a' }}>{dr.fullName}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{dr.territory}</div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ padding: '16px 22px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleOpen(key)}
                  style={{
                    padding: '10px 20px', borderRadius: 12, border: 'none',
                    background: '#0f172a', color: '#fff',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 2px 8px rgba(15,23,42,0.18)',
                  }}
                >
                  👁 Voir le rapport
                </button>
                <button
                  onClick={() => handleCopy(key)}
                  style={{
                    padding: '10px 20px', borderRadius: 12,
                    border: `1.5px solid ${copied === key ? '#bbf7d0' : '#e2e8f0'}`,
                    background: copied === key ? '#dcfce7' : '#f8fafc',
                    color: copied === key ? '#16a34a' : '#334155',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all .2s',
                  }}
                >
                  {copied === key ? '✓ Lien copié !' : '🔗 Copier le lien'}
                </button>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <div style={{
                    fontSize: 11, color: '#94a3b8', fontFamily: 'monospace',
                    background: '#f8fafc', border: '1px solid #e2e8f0',
                    borderRadius: 8, padding: '6px 10px',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {typeof window !== 'undefined' ? getUrl(key) : `…/rapport-dr/?dr=${key}&w=${weekDate}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 28, padding: '14px 18px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
          💡 Le lien reste valable toute la semaine. Partagez-le par email ou WhatsApp au directeur concerné.
          Les données s'actualisent en temps réel au fur et à mesure que vous complétez les retours de formation.
        </div>
      </div>
    </div>
  )
}
