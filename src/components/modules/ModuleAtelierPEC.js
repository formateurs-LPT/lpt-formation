'use client'
import { useEffect } from 'react'
import { setSharedState } from '@/lib/supabase'

export default function ModuleAtelierPEC({ pName, onBack }) {
  // Déclenche l'affichage de LPTSaleApp sur les téléphones des formés
  useEffect(() => {
    setSharedState({ active_module: 'atelier-pec', module_page: 0 }).catch(() => {})
  }, [])

  return (
    <div style={{
      minHeight: '100vh', background: '#03112a', color: '#fff',
      fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column',
      padding: 24, gap: 20,
    }}>
      <button
        onClick={onBack}
        style={{
          alignSelf: 'flex-start', background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)',
          fontSize: 13, fontWeight: 600, padding: '8px 16px',
          borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        ← Retour
      </button>

      <div style={{ maxWidth: 560, margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 12 }}>

        {/* Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#f97316',
            background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
            borderRadius: 20, padding: '4px 14px', letterSpacing: 1.5,
          }}>
            MODULE SIMULATION
          </div>
        </div>

        {/* Titre */}
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: -0.5 }}>
            L&#39;app de vente LPTSale
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', margin: '8px 0 0', lineHeight: 1.6 }}>
            Les formés ont maintenant LPTSale sur leur téléphone.<br/>
            Ils peuvent manipuler l&#39;app comme en magasin.
          </p>
        </div>

        {/* Statut live */}
        <div style={{
          background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 14, padding: '16px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', background: '#22c55e',
            boxShadow: '0 0 0 3px rgba(34,197,94,0.3)',
            flexShrink: 0, animation: 'pulse 2s infinite',
          }}/>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>
              Simulation en cours
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              Chaque formé est sur l&#39;écran Dispatch de LPTSale
            </div>
          </div>
        </div>

        {/* Contenu dispatch simulé */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '18px 20px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 14 }}>
            Dispatch simulé — 10 clients
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Vente', count: 3, color: '#1aa3cc' },
              { label: 'Opto', count: 5, color: '#f59e0b' },
              { label: 'SAV',  count: 2, color: '#e84040' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{
                flex: 1, textAlign: 'center', padding: '12px 8px',
                background: `${color}12`, border: `1px solid ${color}30`,
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color }}>{count}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions formateur */}
        <div style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 14, padding: '18px 20px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
            Guide formateur
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Demandez aux formés d\'identifier les clients Vente, Opto et SAV',
              'Faites-leur utiliser les filtres TOUS / VENTE / SAV / OPTO',
              'Demandez-leur de cliquer sur un client pour accéder à sa fiche',
              'Expliquez le menu ≡ (hamburger) et le bouton d\'inscription rapide',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', background: 'rgba(249,115,22,0.15)',
                  border: '1px solid rgba(249,115,22,0.3)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#f97316', marginTop: 1,
                }}>{i + 1}</div>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </div>
  )
}
