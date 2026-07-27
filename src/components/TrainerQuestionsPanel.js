'use client'
import { useState, useEffect, useCallback } from 'react'
import { getSharedState, setSharedState } from '@/lib/supabase'
import { useIsMobile } from '@/lib/useIsMobile'

export default function TrainerQuestionsPanel({ moduleId }) {
  const [open, setOpen]         = useState(false)
  const [questions, setQuestions] = useState([])
  const [tvSingleId, setTvSingleId] = useState(null)
  const [busy, setBusy]         = useState(false)
  const isMobile = useIsMobile()

  const load = useCallback(async () => {
    if (!moduleId) return
    try {
      const state = await getSharedState()
      const prefix = `mq__${moduleId}__`
      const rows = Object.entries(state || {})
        .filter(([k, v]) => k.startsWith(prefix) && v?.answer)
        .map(([k, v]) => ({
          id: k,
          participant_name: v.name || k.split('__')[2]?.replace(/_/g, ' ') || 'Anonyme',
          answer: v.answer,
          created_at: new Date(v.ts || 0).toISOString(),
        }))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      setQuestions(rows)
      // Sync tvSingleId from shared state
      const currentSingle = state?.mq_single_id || null
      setTvSingleId(state?.tv_screen === 'module_questions' ? currentSingle : null)
    } catch (e) {
      console.error('[TrainerQuestionsPanel] load error:', e)
    }
  }, [moduleId])

  useEffect(() => {
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [load])

  const showOnTv = async (q) => {
    setBusy(true)
    try {
      if (tvSingleId === q.id) {
        // Déjà affiché → retirer de la TV
        await setSharedState({ tv_screen: null, mq_module: null, mq_single_id: null })
        setTvSingleId(null)
      } else {
        await setSharedState({ tv_screen: 'module_questions', mq_module: moduleId, mq_single_id: q.id })
        setTvSingleId(q.id)
      }
    } catch {} finally { setBusy(false) }
  }

  const deleteQuestion = async (q) => {
    setBusy(true)
    try {
      const patch = { [q.id]: null }
      // Si cette question était affichée sur TV, on retire aussi
      if (tvSingleId === q.id) {
        patch.tv_screen = null
        patch.mq_module = null
        patch.mq_single_id = null
        setTvSingleId(null)
      }
      await setSharedState(patch)
      setQuestions(prev => prev.filter(x => x.id !== q.id))
    } catch {} finally { setBusy(false) }
  }

  const count = questions.length

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => { setOpen(true); load() }}
        title="Questions des formés"
        style={{
          position: 'fixed',
          bottom: isMobile ? 148 : 88,
          right: isMobile ? undefined : 28,
          left: isMobile ? 14 : undefined,
          zIndex: 899,
          width: isMobile ? 48 : 52, height: isMobile ? 48 : 52, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, boxShadow: '0 4px 18px rgba(59,130,246,0.4)',
          transition: 'transform .15s, box-shadow .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
      >
        ❓
        {count > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px',
            background: '#ef4444', color: '#fff',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #03112a',
          }}>
            {count > 9 ? '9+' : count}
          </div>
        )}
      </button>

      {/* Panel latéral */}
      {open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
          {/* Overlay */}
          <div
            onClick={() => setOpen(false)}
            style={{ flex: 1, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          />
          {/* Panneau */}
          <div style={{
            width: 420, maxWidth: '92vw', maxHeight: '100vh',
            background: '#0d1f3c', display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          }}>
            {/* Header */}
            <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>Questions des formés</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>
                    {count === 0 ? 'Aucune question pour l\'instant'
                      : `${count} question${count > 1 ? 's' : ''} reçue${count > 1 ? 's' : ''}`}
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: 'none',
                    borderRadius: 8, width: 30, height: 30, cursor: 'pointer',
                    color: 'rgba(255,255,255,0.4)', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >✕</button>
              </div>
              {tvSingleId && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                  📺 Une question est affichée sur le diffuseur
                </div>
              )}
            </div>

            {/* Liste des questions avec noms (formateur voit les noms) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {count === 0 ? (
                <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 14, padding: '40px 0', lineHeight: 1.7 }}>
                  Les questions des formés<br/>apparaîtront ici en temps réel
                </div>
              ) : questions.map((q, i) => {
                const isOnTv = tvSingleId === q.id
                return (
                  <div key={q.id || i} style={{
                    background: isOnTv ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isOnTv ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    {/* Nom visible uniquement pour le formateur */}
                    <div style={{
                      fontSize: 10, fontWeight: 700, color: '#00abe9',
                      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 7,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <span>{q.participant_name}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, letterSpacing: 0 }}>
                        {new Date(q.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55, marginBottom: 10 }}>
                      {q.answer}
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => showOnTv(q)}
                        disabled={busy}
                        style={{
                          flex: 1,
                          background: isOnTv ? 'rgba(34,197,94,0.12)' : 'rgba(0,171,233,0.1)',
                          border: `1px solid ${isOnTv ? 'rgba(34,197,94,0.35)' : 'rgba(0,171,233,0.3)'}`,
                          color: isOnTv ? '#22c55e' : '#00abe9',
                          borderRadius: 7, padding: '6px 10px',
                          fontSize: 11, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                          fontFamily: 'inherit', opacity: busy ? 0.6 : 1,
                        }}
                      >
                        {isOnTv ? '✓ Sur TV — retirer' : '📺 Afficher sur TV'}
                      </button>
                      <button
                        onClick={() => deleteQuestion(q)}
                        disabled={busy}
                        style={{
                          background: 'rgba(239,68,68,0.08)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          color: '#f87171',
                          borderRadius: 7, padding: '6px 10px',
                          fontSize: 11, fontWeight: 700, cursor: busy ? 'default' : 'pointer',
                          fontFamily: 'inherit', opacity: busy ? 0.6 : 1,
                        }}
                      >
                        🗑 Supprimer
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
