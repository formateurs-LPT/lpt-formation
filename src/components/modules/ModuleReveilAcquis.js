'use client'
import { useState, useEffect } from 'react'
import { getSharedState, setSharedState, mutateRoomState } from '@/lib/supabase'

const JOURNEES = [
  {
    id: 'j1',
    numero: 1,
    titre: 'Journée 1',
    sousTitre: 'Les fondamentaux de l\'optique',
    color: '#f59e0b',
    icon: '🌅',
    modules: [
      { icon: '🏢', label: 'Présentation de l\'entreprise' },
      { icon: '👁️', label: 'Les bases de l\'optique' },
      { icon: '🔬', label: 'Les types de verres' },
    ],
  },
  {
    id: 'j2',
    numero: 2,
    titre: 'Journée 2',
    sousTitre: 'Les offres et la vente',
    color: '#10b981',
    icon: '🤝',
    modules: [
      { icon: '🤝', label: 'Trame d\'accueil' },
      { icon: '🏷️', label: 'Les offres LPT' },
    ],
  },
  {
    id: 'j3',
    numero: 3,
    titre: 'Journée 3',
    sousTitre: 'La prise de mesures',
    color: '#8b5cf6',
    icon: '📐',
    modules: [
      { icon: '📐', label: 'Prise de mesures' },
    ],
  },
]

// ── FAQ Trainer View ──────────────────────────────────────────────
function FAQTrainerView({ journee, onBack }) {
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const key = `faq_${journee.id}_q`

  // Activate FAQ on mount, cleanup on unmount
  useEffect(() => {
    setSharedState({ faq_journee: journee.id, tv_screen: null }).catch(() => {})
    return () => {
      setSharedState({ faq_journee: null, [key]: [] }).catch(() => {})
    }
  }, [journee.id, key])

  // Poll questions
  useEffect(() => {
    const load = async () => {
      const state = await getSharedState()
      setQuestions(state?.[key] || [])
    }
    load()
    const interval = setInterval(load, 1500)
    return () => clearInterval(interval)
  }, [key])

  const handleHighlight = async (id) => {
    setLoading(true)
    try {
      let updated = []
      // Verrou optimiste : un autre formateur ou un formé qui envoie une question
      // en même temps ne doit pas voir sa modification écrasée silencieusement.
      await mutateRoomState(null, state => {
        const qs = state?.[key] || []
        const isAlreadyHighlighted = qs.find(q => q.id === id)?.highlighted
        updated = qs.map(q => ({
          ...q,
          highlighted: q.id === id ? !isAlreadyHighlighted : false,
        }))
        return { [key]: updated }
      })
      setQuestions(updated)
    } finally {
      setLoading(false)
    }
  }

  const handleTreat = async (id) => {
    setLoading(true)
    try {
      let updated = []
      await mutateRoomState(null, state => {
        const qs = state?.[key] || []
        updated = qs.filter(q => q.id !== id)
        return { [key]: updated }
      })
      setQuestions(updated)
    } finally {
      setLoading(false)
    }
  }

  const accent = journee.color

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 48px 20px',
      }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Retour</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 50, height: 50, borderRadius: 14, flexShrink: 0,
            background: `${accent}20`, border: `1px solid ${accent}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>{journee.icon}</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
              Réveil des acquis
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{journee.titre} — FAQ</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', background: '#4ade80',
              boxShadow: '0 0 8px #4ade80',
            }} />
            <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 600 }}>
              {questions.length} question{questions.length !== 1 ? 's' : ''} reçue{questions.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Question list */}
      <div style={{ flex: 1, padding: '28px 48px', maxWidth: 800 }}>

        {questions.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 16, padding: '60px 0', textAlign: 'center',
          }}>
            <div style={{ fontSize: 40 }}>💬</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>
              En attente des questions des participants…
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
              Les questions apparaîtront ici dès qu'elles seront soumises
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Questions dans l'ordre de réception
            </div>
            {questions.map((q, i) => (
              <div key={q.id} style={{
                background: q.highlighted ? `${accent}10` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${q.highlighted ? accent + '60' : 'rgba(255,255,255,0.08)'}`,
                borderLeft: `3px solid ${q.highlighted ? accent : 'rgba(255,255,255,0.12)'}`,
                borderRadius: 14, padding: '16px 20px',
                display: 'flex', alignItems: 'flex-start', gap: 16,
                transition: 'all .25s ease',
              }}>
                {/* Numéro */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: q.highlighted ? `${accent}25` : 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: q.highlighted ? accent : 'rgba(255,255,255,0.35)',
                  marginTop: 1,
                }}>{i + 1}</div>

                {/* Texte + auteur */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: q.highlighted ? '#fff' : 'rgba(255,255,255,0.8)', lineHeight: 1.5, fontWeight: q.highlighted ? 600 : 400 }}>
                    {q.text}
                  </div>
                  {q.author && (
                    <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '3px 10px' }}>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>👤</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{q.author}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleHighlight(q.id)}
                    disabled={loading}
                    style={{
                      background: q.highlighted ? `${accent}25` : 'rgba(255,255,255,0.07)',
                      border: `1px solid ${q.highlighted ? accent + '50' : 'rgba(255,255,255,0.12)'}`,
                      color: q.highlighted ? accent : 'rgba(255,255,255,0.5)',
                      padding: '8px 14px', borderRadius: 10,
                      fontSize: 12, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                      fontFamily: 'inherit', transition: 'all .2s', whiteSpace: 'nowrap',
                    }}
                  >
                    {q.highlighted ? '★ En avant' : '☆ Mettre en avant'}
                  </button>
                  <button
                    onClick={() => handleTreat(q.id)}
                    disabled={loading}
                    style={{
                      background: 'rgba(74,222,128,0.08)',
                      border: '1px solid rgba(74,222,128,0.25)',
                      color: '#4ade80',
                      padding: '8px 14px', borderRadius: 10,
                      fontSize: 12, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
                      fontFamily: 'inherit', transition: 'all .2s',
                    }}
                  >✓ Traitée</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Journée card (selection screen) ──────────────────────────────
function JourneeCard({ journee, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? `${journee.color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? journee.color + '55' : 'rgba(255,255,255,0.08)'}`,
        borderLeft: `4px solid ${journee.color}`,
        borderRadius: 18, padding: '22px 24px',
        cursor: 'pointer', transition: 'all .2s ease',
        display: 'flex', alignItems: 'center', gap: 24,
      }}
    >
      <div style={{
        width: 64, height: 64, borderRadius: 16, flexShrink: 0,
        background: `${journee.color}25`,
        border: `1px solid ${journee.color}40`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: journee.color, letterSpacing: 1, textTransform: 'uppercase' }}>J.</span>
        <span style={{ fontSize: 26, fontWeight: 900, color: journee.color, lineHeight: 1 }}>{journee.numero}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{journee.titre}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: journee.color,
            background: `${journee.color}18`, border: `1px solid ${journee.color}35`,
            borderRadius: 20, padding: '2px 10px', letterSpacing: 0.5,
          }}>FAQ</span>
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 12 }}>{journee.sousTitre}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {journee.modules.map((m, i) => (
            <span key={i} style={{
              fontSize: 11, color: 'rgba(255,255,255,0.55)',
              background: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: '3px 10px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>{m.icon}</span> {m.label}
            </span>
          ))}
        </div>
      </div>
      <div style={{
        fontSize: 20, color: hovered ? journee.color : 'rgba(255,255,255,0.2)',
        transition: 'all .2s', transform: hovered ? 'translateX(4px)' : 'translateX(0)',
        flexShrink: 0,
      }}>→</div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────
export default function ModuleReveilAcquis({ pName, onBack }) {
  const [selected, setSelected] = useState(null)

  if (selected) {
    const journee = JOURNEES.find(j => j.id === selected)
    return <FAQTrainerView journee={journee} onBack={() => setSelected(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117' }}>
      {/* Header */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(135deg, #1a1f2e 0%, #0d1117 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 48px 28px',
      }}>
        <div style={{
          position: 'absolute', top: -60, right: 80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.6)', padding: '8px 16px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6,
        }}>← Retour aux modules</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16, flexShrink: 0,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.25), rgba(245,158,11,0.08))',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>⚡</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
              Formation LPT · Formateur
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>Réveil des acquis</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              FAQ anonyme — choisissez une journée
            </div>
          </div>
        </div>
      </div>

      {/* Liste des journées */}
      <div style={{ padding: '36px 48px', maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
          Sélectionnez une journée
        </div>
        {JOURNEES.map(j => (
          <JourneeCard key={j.id} journee={j} onClick={() => setSelected(j.id)} />
        ))}
      </div>
    </div>
  )
}
