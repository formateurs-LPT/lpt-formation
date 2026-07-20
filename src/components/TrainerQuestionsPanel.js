'use client'
import { useState, useEffect, useCallback } from 'react'
import { fetchOpenAnswers, getActiveSessionCode, setSharedState } from '@/lib/supabase'

export default function TrainerQuestionsPanel({ moduleId }) {
  const [open, setOpen]         = useState(false)
  const [questions, setQuestions] = useState([])
  const [tvOn, setTvOn]         = useState(false)

  const load = useCallback(async () => {
    if (!moduleId) return
    try {
      const code = getActiveSessionCode()
      console.log('[TrainerQuestionsPanel] lecture → sessionCode:', code, 'pageId:', 'mq_' + moduleId)
      const rows = await fetchOpenAnswers(code, 'mq_' + moduleId)
      console.log('[TrainerQuestionsPanel] rows:', rows)
      setQuestions(rows || [])
    } catch (e) {
      console.error('[TrainerQuestionsPanel] load error:', e)
    }
  }, [moduleId])

  useEffect(() => {
    load()
    const id = setInterval(load, 6000)
    return () => clearInterval(id)
  }, [load])

  const toggleTv = async () => {
    try {
      if (tvOn) {
        await setSharedState({ tv_screen: null, mq_module: null })
      } else {
        await setSharedState({ tv_screen: 'module_questions', mq_module: moduleId })
      }
      setTvOn(v => !v)
    } catch {}
  }

  const count = questions.length

  return (
    <>
      {/* Bouton flottant — au-dessus de IdeesButton */}
      <button
        onClick={() => { setOpen(true); load() }}
        title="Questions des formés"
        style={{
          position: 'fixed', bottom: 88, right: 28, zIndex: 899,
          width: 52, height: 52, borderRadius: '50%',
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
            width: 400, maxWidth: '88vw', maxHeight: '100vh',
            background: '#0d1f3c', display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
          }}>
            {/* Header */}
            <div style={{ padding: '22px 20px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
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

              {/* Bouton TV */}
              <button
                onClick={toggleTv}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                  background: tvOn ? 'rgba(34,197,94,0.12)' : 'rgba(0,171,233,0.1)',
                  border: `1px solid ${tvOn ? 'rgba(34,197,94,0.35)' : 'rgba(0,171,233,0.3)'}`,
                  color: tvOn ? '#22c55e' : '#00abe9',
                  fontSize: 13, fontWeight: 700, fontFamily: 'inherit', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>{tvOn ? '✓' : '📺'}</span>
                {tvOn
                  ? 'Affiché sur TV (anonyme) — cliquer pour arrêter'
                  : 'Afficher toutes les questions sur TV (anonymes)'}
              </button>
            </div>

            {/* Liste des questions avec noms */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {count === 0 ? (
                <div style={{
                  textAlign: 'center', color: 'rgba(255,255,255,0.2)',
                  fontSize: 14, padding: '40px 0', lineHeight: 1.7,
                }}>
                  Les questions des formés<br/>apparaîtront ici en temps réel
                </div>
              ) : questions.map((q, i) => (
                <div key={q.id || i} style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 10, padding: '12px 14px',
                }}>
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
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55 }}>
                    {q.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
