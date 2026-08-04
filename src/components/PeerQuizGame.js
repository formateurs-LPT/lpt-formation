'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { setSharedState, getSharedState } from '@/lib/supabase'
import { fetchOnlineParticipantsList } from '@/lib/participantPresence'

// ── Utilitaires ───────────────────────────────────────────────────

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function initials(name) {
  return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

// ── TV — Écran diffuseur ─────────────────────────────────────────

export function TVPeerQuizScreen({ sharedState }) {
  const phase     = sharedState?.pq_phase
  const asker     = sharedState?.pq_asker
  const designated = sharedState?.pq_designated
  const question  = sharedState?.pq_question_text
  const history   = sharedState?.pq_history || []

  const base = {
    minHeight: '100dvh', background: 'linear-gradient(135deg, #03112a 0%, #0a0a24 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 60, gap: 40,
  }

  if (phase === 'collecting') return (
    <div style={base}>
      <div style={{ fontSize: 80, marginBottom: 8 }}>📝</div>
      <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', textAlign: 'center', lineHeight: 1.15 }}>
        Notez vos questions<br />sur votre téléphone !
      </div>
      <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
        Le formateur lancera le jeu quand tout le monde sera prêt
      </div>
    </div>
  )

  if (phase === 'playing') {
    // Asker choosing — no designated yet
    if (!designated) return (
      <div style={base}>
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
          Jeu de questions
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 38, fontWeight: 900, color: '#fff',
            boxShadow: '0 0 0 6px rgba(99,102,241,0.2)',
          }}>
            {initials(asker)}
          </div>
          <div style={{ fontSize: 36, fontWeight: 800, color: '#fff' }}>{asker}</div>
        </div>
        <div style={{ fontSize: 28, color: '#6366f1', fontWeight: 700 }}>
          choisit qui questionner…
        </div>
        {history.length > 0 && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            {history.map(n => (
              <div key={n} style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 20, padding: '6px 16px', fontSize: 14, color: 'rgba(255,255,255,0.4)',
                textDecoration: 'line-through',
              }}>✓ {n}</div>
            ))}
          </div>
        )}
      </div>
    )

    // Designated but no question yet
    if (designated && !question) return (
      <div style={base}>
        <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase' }}>
          Question en cours
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '2px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#6366f1' }}>{initials(asker)}</div>
            <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{asker}</div>
          </div>
          <div style={{ fontSize: 40, color: '#6366f1' }}>→</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, color: '#fff', boxShadow: '0 0 0 8px rgba(245,158,11,0.2)' }}>{initials(designated)}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: '#fff' }}>{designated}</div>
          </div>
        </div>
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
          Sélection de la question…
        </div>
      </div>
    )

    // Full question revealed
    if (question) return (
      <div style={base}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 900, color: '#fff', boxShadow: '0 0 0 8px rgba(245,158,11,0.18)' }}>{initials(designated)}</div>
          <div style={{ fontSize: 42, fontWeight: 900, color: '#fff' }}>{designated}</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 24, padding: '40px 60px',
          maxWidth: 900, textAlign: 'center',
          fontSize: 38, fontWeight: 700, color: '#fff', lineHeight: 1.4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
        }}>
          {question}
        </div>
        <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.35)', fontStyle: 'italic' }}>
          Posée par {asker} · Réponds à l'oral !
        </div>
      </div>
    )
  }

  return null
}

// ── Participant — Vue mobile ──────────────────────────────────────

export function PeerQuizParticipant({ sharedState, pName, sessionCode }) {
  const [input, setInput]               = useState('')
  const [myQuestions, setMyQuestions]   = useState([]) // [{id, text, used}]
  const [participants, setParticipants] = useState([])
  const [selTarget, setSelTarget]       = useState(null)
  const [selQId, setSelQId]             = useState(null)
  const [editId, setEditId]             = useState(null)
  const [editText, setEditText]         = useState('')
  const [saving, setSaving]             = useState(false)
  const inputRef = useRef(null)

  const phase       = sharedState?.pq_phase
  const asker       = sharedState?.pq_asker
  const designated  = sharedState?.pq_designated
  const question    = sharedState?.pq_question_text
  const history     = sharedState?.pq_history || []
  const editReq     = sharedState?.pq_edit_request

  const isAsker      = asker === pName
  const isDesignated = designated === pName
  const myEditReq    = editReq?.author === pName

  // Sync my questions from shared state
  useEffect(() => {
    const qs = sharedState?.[`pq_q_${pName}`] || []
    setMyQuestions(qs)
  }, [sharedState, pName])

  // Load participants list
  useEffect(() => {
    if (phase !== 'playing') return
    const load = async () => {
      try {
        const rows = await fetchOnlineParticipantsList(sessionCode)
        setParticipants((rows || []).map(r => r.name || r.participant_name).filter(Boolean))
      } catch {}
    }
    load()
  }, [phase, sessionCode])

  const saveQuestions = useCallback(async (qs) => {
    setSaving(true)
    try {
      await setSharedState({ [`pq_q_${pName}`]: qs })
    } catch (e) { console.error(e) }
    setSaving(false)
  }, [pName])

  const addQuestion = async () => {
    const text = input.trim()
    if (!text) return
    const next = [...myQuestions, { id: genId(), text, used: false }]
    setMyQuestions(next)
    setInput('')
    await saveQuestions(next)
    inputRef.current?.focus()
  }

  const deleteQuestion = async (id) => {
    const next = myQuestions.filter(q => q.id !== id)
    setMyQuestions(next)
    await saveQuestions(next)
  }

  const submitTurn = async () => {
    if (!selTarget || !selQId) return
    const ownQs = sharedState?.[`pq_q_${pName}`] || []
    const q = ownQs.find(q => q.id === selQId)
    if (!q) return
    setSaving(true)
    try {
      await setSharedState({
        pq_designated: selTarget,
        pq_question_id: selQId,
        pq_question_text: q.text,
      })
      setSelTarget(null)
      setSelQId(null)
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const saveEdit = async () => {
    const text = editText.trim()
    if (!text || !editId) return
    setSaving(true)
    try {
      const next = myQuestions.map(q => q.id === editId ? { ...q, text } : q)
      setMyQuestions(next)
      await setSharedState({
        [`pq_q_${pName}`]: next,
        pq_question_text: editId === sharedState?.pq_question_id ? text : sharedState?.pq_question_text,
        pq_edit_request: null,
      })
      setEditId(null)
      setEditText('')
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const STYLE = {
    wrapper: {
      minHeight: '100dvh', background: '#0a0f1e',
      display: 'flex', flexDirection: 'column', padding: '24px 20px 40px',
      fontFamily: 'DM Sans, sans-serif', color: '#fff',
    },
    card: {
      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 16, padding: '16px 16px',
    },
  }

  // ── Edit request from trainer ────────────────────────────────────
  if (myEditReq) {
    const q = myQuestions.find(q => q.id === editReq.id)
    if (editId !== editReq.id && q) { setEditId(editReq.id); setEditText(q.text) }
    return (
      <div style={STYLE.wrapper}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✏️</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>Le formateur te demande</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)' }}>de modifier ta question</div>
        </div>
        <div style={STYLE.card}>
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            rows={3}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', fontSize: 16, resize: 'none', outline: 'none', fontFamily: 'DM Sans, sans-serif' }}
            autoFocus
          />
        </div>
        <button
          onClick={saveEdit}
          disabled={saving || !editText.trim()}
          style={{ marginTop: 16, width: '100%', padding: '16px', borderRadius: 14, background: '#6366f1', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', opacity: (!editText.trim() || saving) ? 0.5 : 1 }}
        >
          {saving ? 'Sauvegarde…' : 'Enregistrer la modification'}
        </button>
      </div>
    )
  }

  // ── Phase collecting ─────────────────────────────────────────────
  if (phase === 'collecting') return (
    <div style={STYLE.wrapper}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>📝 Tes questions</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
        Écris toutes les questions que tu as préparées
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addQuestion() } }}
          placeholder="Tapez votre question…"
          style={{
            flex: 1, padding: '14px 16px', borderRadius: 12,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 15, fontFamily: 'DM Sans, sans-serif', outline: 'none',
          }}
        />
        <button
          onClick={addQuestion}
          disabled={!input.trim() || saving}
          style={{ padding: '14px 18px', borderRadius: 12, background: '#6366f1', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', opacity: !input.trim() ? 0.4 : 1 }}
        >+</button>
      </div>

      {myQuestions.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14, marginTop: 20 }}>
          Aucune question encore — sois le premier à en écrire !
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {myQuestions.map((q, i) => (
            <div key={q.id} style={{ ...STYLE.card, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}>{q.text}</div>
              <button
                onClick={() => deleteQuestion(q.id)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 18, cursor: 'pointer', padding: 4, flexShrink: 0 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 24, textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
        {myQuestions.length} question{myQuestions.length !== 1 ? 's' : ''} · En attente du formateur
      </div>
    </div>
  )

  // ── Phase playing ─────────────────────────────────────────────────
  if (phase === 'playing') {
    const available = participants.filter(p => p !== pName && !history.includes(p))
    const unusedQs  = myQuestions.filter(q => !q.used)

    // Je suis le désigné
    if (isDesignated) return (
      <div style={{ ...STYLE.wrapper, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 60, marginBottom: 16 }}>🎯</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', marginBottom: 8 }}>Tu es désigné(e) !</div>
        <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32 }}>
          {asker} te pose une question
        </div>
        {question && (
          <div style={{ ...STYLE.card, maxWidth: 380, textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#fff', lineHeight: 1.5, padding: '24px 24px' }}>
            {question}
          </div>
        )}
        <div style={{ marginTop: 24, fontSize: 15, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
          Réponds à l'oral · Le formateur donnera la suite
        </div>
      </div>
    )

    // Je suis le poseur ET j'ai déjà soumis (designated set mais ce n'est pas moi qui l'ai changé)
    if (isAsker && designated && !isDesignated) return (
      <div style={{ ...STYLE.wrapper, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Question posée !</div>
        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 24 }}>
          Tu as désigné <strong style={{ color: '#f59e0b' }}>{designated}</strong>
        </div>
        <div style={{ ...STYLE.card, maxWidth: 340, fontSize: 16, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: 1.5 }}>
          "{question}"
        </div>
        <div style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          En attente de la validation du formateur…
        </div>
      </div>
    )

    // C'est mon tour de poser une question
    const myOwnQs = sharedState?.[`pq_q_${pName}`] || []
    const unusedOwnQs = myOwnQs.filter(q => !q.used)

    if (isAsker && !designated) return (
      <div style={STYLE.wrapper}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#6366f1', marginBottom: 4 }}>🎯 C'est ton tour !</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
          Choisis qui tu veux questionner, puis l'une de <strong style={{ color: '#fff' }}>tes propres questions</strong>
        </div>

        {/* Select target */}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          1 — Qui questionnes-tu ?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {participants.filter(p => p !== pName).map(p => {
            const greyed = history.includes(p)
            const sel = selTarget === p
            return (
              <button
                key={p}
                onClick={() => !greyed && setSelTarget(sel ? null : p)}
                disabled={greyed}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderRadius: 12, cursor: greyed ? 'default' : 'pointer',
                  background: sel ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  border: sel ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.1)',
                  opacity: greyed ? 0.35 : 1, textAlign: 'left', width: '100%',
                  transition: 'all .15s',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: sel ? '#6366f1' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {initials(p)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{p}</div>
                  {greyed && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Déjà questionné ce tour</div>}
                </div>
                {sel && <span style={{ color: '#6366f1', fontSize: 18 }}>✓</span>}
              </button>
            )
          })}
        </div>

        {/* Select question — uniquement parmi ses propres questions */}
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
          2 — Laquelle de tes questions poses-tu ?
        </div>
        {myOwnQs.length === 0 ? (
          <div style={{ ...STYLE.card, color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic' }}>
            Tu n'as pas écrit de questions lors de la phase de collecte.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {myOwnQs.map(q => {
              const used = q.used
              const sel = selQId === q.id
              return (
                <button
                  key={q.id}
                  onClick={() => !used && setSelQId(sel ? null : q.id)}
                  disabled={used}
                  style={{
                    padding: '14px 16px', borderRadius: 12, textAlign: 'left',
                    cursor: used ? 'default' : 'pointer',
                    background: sel ? 'rgba(99,102,241,0.18)' : used ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                    border: sel ? '1.5px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                    color: used ? 'rgba(255,255,255,0.25)' : sel ? '#fff' : 'rgba(255,255,255,0.8)',
                    fontSize: 14, lineHeight: 1.5, transition: 'all .15s', width: '100%',
                    textDecoration: used ? 'line-through' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                >
                  {used && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>✓ déjà posée</span>}
                  <span>{q.text}</span>
                  {sel && !used && <span style={{ color: '#6366f1', fontSize: 16, marginLeft: 'auto', flexShrink: 0 }}>✓</span>}
                </button>
              )
            })}
          </div>
        )}

        <button
          onClick={submitTurn}
          disabled={!selTarget || !selQId || saving || unusedOwnQs.length === 0}
          style={{
            width: '100%', padding: '16px', borderRadius: 14,
            background: selTarget && selQId ? '#6366f1' : 'rgba(99,102,241,0.3)',
            border: 'none', color: '#fff', fontSize: 16, fontWeight: 700,
            cursor: selTarget && selQId ? 'pointer' : 'default',
            transition: 'background .2s',
          }}
        >
          {saving ? 'Envoi…' : 'Poser la question →'}
        </button>
      </div>
    )

    // Spectateur — attente
    return (
      <div style={{ ...STYLE.wrapper, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>👀</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
          {designated ? `${designated} répond à l'oral` : `${asker} choisit sa question…`}
        </div>
        {question && (
          <div style={{ ...STYLE.card, maxWidth: 340, fontSize: 15, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: 1.5, marginTop: 16 }}>
            "{question}"
          </div>
        )}
        <div style={{ marginTop: 16, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Regarde l'écran diffuseur</div>
      </div>
    )
  }

  // Phase null — en attente du début
  return (
    <div style={{ ...STYLE.wrapper, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>En attente du formateur…</div>
    </div>
  )
}

// ── Formateur — Panneau de contrôle ─────────────────────────────

export default function PeerQuizTrainer({ sessionCode, onBack }) {
  const [sharedSt, setSharedSt] = useState(null)
  const [participants, setParticipants] = useState([])
  const [answerCorrect, setAnswerCorrect] = useState(null) // null | true | false

  const load = useCallback(async () => {
    try {
      const [rows, state] = await Promise.all([
        fetchOnlineParticipantsList(sessionCode),
        getSharedState(sessionCode),
      ])
      setParticipants((rows || []).map(r => r.name || r.participant_name).filter(Boolean))
      setSharedSt(state)
    } catch (e) { console.error('[PeerQuiz]', e) }
  }, [sessionCode])

  useEffect(() => {
    load()
    const iv = setInterval(load, 2000)
    return () => clearInterval(iv)
  }, [load])

  // On ne considère le jeu actif que si le formateur l'a explicitement lancé (tv_screen=peer-quiz)
  const phase      = sharedSt?.tv_screen === 'peer-quiz' ? sharedSt?.pq_phase : null
  const asker      = sharedSt?.pq_asker
  const designated = sharedSt?.pq_designated
  const qText      = sharedSt?.pq_question_text
  const qId        = sharedSt?.pq_question_id
  const history    = sharedSt?.pq_history || []
  const editReq    = sharedSt?.pq_edit_request

  // All questions per participant
  const allQuestions = {}
  for (const p of participants) {
    const qs = sharedSt?.[`pq_q_${p}`] || []
    allQuestions[p] = qs
  }
  const totalQ   = Object.values(allQuestions).reduce((s, qs) => s + qs.length, 0)
  const remainQ  = Object.values(allQuestions).reduce((s, qs) => s + qs.filter(q => !q.used).length, 0)
  const playersWithQ = participants.filter(p => (allQuestions[p] || []).length > 0)

  const startCollecting = async () => {
    await setSharedState({ tv_screen: 'peer-quiz', pq_phase: 'collecting', pq_asker: null, pq_designated: null, pq_question_id: null, pq_question_text: null, pq_history: [], pq_answer_correct: null, pq_edit_request: null }).catch(() => {})
    setAnswerCorrect(null)
  }

  const startGame = async () => {
    if (playersWithQ.length < 2) return
    const askerPick = playersWithQ[Math.floor(Math.random() * playersWithQ.length)]
    await setSharedState({ pq_phase: 'playing', pq_asker: askerPick, pq_designated: null, pq_question_id: null, pq_question_text: null, pq_history: [], pq_answer_correct: null, pq_edit_request: null }).catch(() => {})
    setAnswerCorrect(null)
  }

  const handleNext = async () => {
    if (!designated) return
    try {
      // Mark question as used + record result
      if (asker && qId) {
        const qs = (sharedSt?.[`pq_q_${asker}`] || []).map(q =>
          q.id === qId ? { ...q, used: true, askedTo: designated, correct: answerCorrect } : q
        )
        await setSharedState({ [`pq_q_${asker}`]: qs })
      }
      const newHistory = [...history, designated]
      const allDone = participants.every(p => newHistory.includes(p))
      await setSharedState({
        pq_asker: designated,
        pq_designated: null,
        pq_question_id: null,
        pq_question_text: null,
        pq_history: allDone ? [] : newHistory,
        pq_answer_correct: answerCorrect,
        pq_edit_request: null,
      })
    } catch { /* best-effort */ }
    setAnswerCorrect(null)
  }

  const skipTurn = async () => {
    const withQ = participants.filter(p =>
      p !== asker && (allQuestions[p] || []).filter(q => !q.used).length > 0
    )
    const fromHistory = withQ.filter(p => history.includes(p))
    const pool = fromHistory.length > 0 ? fromHistory : withQ
    if (pool.length === 0) return
    const newAsker = pool[Math.floor(Math.random() * pool.length)]
    await setSharedState({
      pq_asker: newAsker,
      pq_designated: null,
      pq_question_id: null,
      pq_question_text: null,
      pq_edit_request: null,
    }).catch(() => {})
  }

  const requestEdit = async () => {
    if (!asker || !qId) return
    await setSharedState({ pq_edit_request: { author: asker, id: qId } }).catch(() => {})
  }

  const cancelEdit = async () => {
    await setSharedState({ pq_edit_request: null }).catch(() => {})
  }

  const stopGame = async () => {
    await setSharedState({ tv_screen: null, pq_phase: null, pq_asker: null, pq_designated: null, pq_question_id: null, pq_question_text: null, pq_history: [], pq_answer_correct: null, pq_edit_request: null }).catch(() => {})
    setAnswerCorrect(null)
  }

  const S = {
    wrap:   { minHeight: '100dvh', background: '#0d1117', color: '#e6edf3', fontFamily: 'DM Sans, sans-serif', display: 'flex', flexDirection: 'column' },
    hdr:    { display: 'flex', alignItems: 'center', gap: 14, padding: '18px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 },
    body:   { flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 24 },
    card:   { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '18px 20px' },
    label:  { fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 },
    btn1:   { padding: '12px 24px', borderRadius: 10, background: '#6366f1', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' },
    btn2:   { padding: '12px 24px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#e6edf3', fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  }

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.hdr}>
        <button onClick={onBack} style={{ ...S.btn2, padding: '8px 14px', fontSize: 12 }}>← Retour</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🎯 Jeu de questions</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            {participants.length} participant{participants.length !== 1 ? 's' : ''} · {totalQ} questions · {remainQ} restantes
          </div>
        </div>
        {phase && (
          <button onClick={stopGame} style={{ ...S.btn2, padding: '8px 14px', fontSize: 12, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}>
            Arrêter le jeu
          </button>
        )}
      </div>

      <div style={S.body}>

        {/* ── Pas de phase ── */}
        {!phase && (
          <div style={{ maxWidth: 560, margin: '40px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🎯</div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Jeu de questions entre formés</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 36 }}>
              Chaque formé note ses questions, puis les formés s'interrogent<br />
              à tour de rôle jusqu'à ce que tout le monde soit passé.
            </div>
            <button onClick={startCollecting} style={{ ...S.btn1, padding: '16px 40px', fontSize: 16, borderRadius: 14 }}>
              Démarrer la collecte de questions →
            </button>
          </div>
        )}

        {/* ── Phase collecte ── */}
        {phase === 'collecting' && (
          <>
            <div style={S.card}>
              <div style={S.label}>Participants & questions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {participants.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>En attente de participants…</div>
                ) : participants.map(p => {
                  const qs = allQuestions[p] || []
                  return (
                    <div key={p} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#6366f1', flexShrink: 0 }}>
                          {initials(p)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{p}</span>
                        <span style={{ fontSize: 12, color: qs.length > 0 ? '#22c55e' : 'rgba(255,255,255,0.3)', marginLeft: 'auto', fontWeight: 700 }}>
                          {qs.length} question{qs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {qs.length > 0 && (
                        <div style={{ paddingLeft: 42, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {qs.map(q => (
                            <div key={q.id} style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', padding: '5px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, borderLeft: '2px solid rgba(99,102,241,0.4)' }}>
                              {q.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={startGame}
                disabled={playersWithQ.length < 2}
                style={{ ...S.btn1, padding: '16px 40px', fontSize: 16, borderRadius: 14, opacity: playersWithQ.length < 2 ? 0.4 : 1 }}
              >
                {playersWithQ.length < 2
                  ? `Attente de questions (${playersWithQ.length}/2 minimum)`
                  : `Lancer le jeu avec ${playersWithQ.length} participants →`
                }
              </button>
            </div>
          </>
        )}

        {/* ── Phase jeu ── */}
        {phase === 'playing' && (
          <>
            {/* État actuel */}
            <div style={{ ...S.card, borderColor: 'rgba(99,102,241,0.3)' }}>
              <div style={S.label}>Tour en cours</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(99,102,241,0.25)', border: '1.5px solid #6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{initials(asker)}</div>
                  <span style={{ fontWeight: 700, color: '#6366f1' }}>{asker}</span>
                </div>
                {designated && (
                  <>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>→</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(245,158,11,0.2)', border: '1.5px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{initials(designated)}</div>
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>{designated}</span>
                    </div>
                  </>
                )}
              </div>

              {qText ? (
                <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', fontSize: 15, color: '#fff', fontStyle: 'italic', lineHeight: 1.6, marginBottom: 16 }}>
                  "{qText}"
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                  {!designated ? `${asker} choisit…` : `${asker} choisit une question…`}
                </div>
              )}

              {/* Alerte si l'asker n'a plus de questions */}
              {!designated && asker && (allQuestions[asker] || []).filter(q => !q.used).length === 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 2 }}>
                      {asker} n'a plus de questions disponibles
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                      Passez le tour — un autre formé (déjà passé, avec des questions restantes) sera tiré au sort
                    </div>
                  </div>
                  <button
                    onClick={skipTurn}
                    style={{ flexShrink: 0, padding: '9px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Passer →
                  </button>
                </div>
              )}

              {/* Edit request state */}
              {editReq && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
                  <span>✏️</span>
                  <span style={{ flex: 1, color: '#f59e0b' }}>Demande de modification envoyée à {editReq.author}…</span>
                  <button onClick={cancelEdit} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 12 }}>Annuler</button>
                </div>
              )}

              {/* Controls when question is displayed */}
              {designated && qText && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={S.label}>Réponse de {designated}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setAnswerCorrect(answerCorrect === true ? null : true)}
                        style={{ flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, border: '1.5px solid', borderColor: answerCorrect === true ? '#22c55e' : 'rgba(34,197,94,0.3)', background: answerCorrect === true ? 'rgba(34,197,94,0.2)' : 'transparent', color: answerCorrect === true ? '#22c55e' : 'rgba(255,255,255,0.5)' }}
                      >
                        ✓ Bonne réponse
                      </button>
                      <button
                        onClick={() => setAnswerCorrect(answerCorrect === false ? null : false)}
                        style={{ flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, border: '1.5px solid', borderColor: answerCorrect === false ? '#ef4444' : 'rgba(239,68,68,0.3)', background: answerCorrect === false ? 'rgba(239,68,68,0.2)' : 'transparent', color: answerCorrect === false ? '#ef4444' : 'rgba(255,255,255,0.5)' }}
                      >
                        ✗ Mauvaise réponse
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {!editReq && (
                      <button onClick={requestEdit} style={{ ...S.btn2, fontSize: 13, padding: '10px 16px' }}>
                        ✏️ Modifier la question
                      </button>
                    )}
                    <button onClick={handleNext} style={{ ...S.btn1, flex: 1, fontSize: 15 }}>
                      Suivant → (tour de {designated})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tour recap */}
            {participants.length > 0 && (
              <div style={S.card}>
                <div style={S.label}>Tour actuel — {history.length}/{participants.length} passé{history.length !== 1 ? 's' : ''}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {participants.map(p => {
                    const done = history.includes(p)
                    const active = p === designated || p === asker
                    return (
                      <div key={p} style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                        background: done ? 'rgba(34,197,94,0.12)' : active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : active ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.1)'}`,
                        color: done ? '#22c55e' : active ? '#818cf8' : 'rgba(255,255,255,0.5)',
                        textDecoration: done ? 'none' : 'none',
                      }}>
                        {done ? '✓ ' : active && p === asker ? '🎤 ' : active ? '🎯 ' : ''}{p}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* All questions overview */}
            <div style={S.card}>
              <div style={S.label}>Questions par formé ({remainQ} restantes sur {totalQ})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {participants.map(p => {
                  const qs = allQuestions[p] || []
                  if (!qs.length) return null
                  return (
                    <div key={p}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                        {p} <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({qs.filter(q => !q.used).length} restante{qs.filter(q => !q.used).length !== 1 ? 's' : ''})</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {qs.map(q => (
                          <div key={q.id} style={{
                            padding: '7px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.5,
                            background: q.used ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            color: q.used ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.75)',
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}>
                            {q.used && (
                              <span style={{ fontSize: 10, color: q.correct ? '#22c55e' : q.correct === false ? '#ef4444' : 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
                                {q.correct ? '✓' : q.correct === false ? '✗' : '✓'}
                              </span>
                            )}
                            <span style={{ textDecoration: q.used ? 'line-through' : 'none', flex: 1 }}>{q.text}</span>
                            {q.used && q.askedTo && (
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>→ {q.askedTo}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
