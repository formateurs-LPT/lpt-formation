'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
  sbSelect, sbDelete, getActiveSessionCode, getParticipantSessionCode,
  setSharedState, insertOpenAnswer, fetchOpenAnswers,
} from '@/lib/supabase'
import { saveModuleQuizAnswer } from '@/lib/formationSave'
import { VISION_MULTI_OPTIONS, encodeVisionAnswer, decodeVisionAnswer, sameVisionAnswer } from '@/lib/visionMulti'

/**
 * Panneau "jeu des questions" — partagé entre l'entraînement oral de Bases de
 * l'optique et le mini-jeu Questions autonome. Chaque instance a son propre
 * espace (moduleId pour quiz_answers, sharedKeyPrefix pour les clés de
 * sharedState) pour ne jamais se marcher dessus.
 *
 * Règles :
 * - question texte libre, vrai/faux, ou sélection multiple (problèmes de vue)
 * - pour la sélection multiple, le formateur définit sa propre sélection comme
 *   bonne réponse : les formés ayant sélectionné exactement la même chose sont
 *   validés automatiquement, les autres restent à valider manuellement
 * - la question ne disparaît jamais toute seule : seul le formateur avance
 */

// ── Vue formateur ──────────────────────────────────────────────────
export function QuestionsGameTrainerPanel({ pName, moduleId, sharedKeyPrefix, questions, onExit, header, bottomPadding = 40 }) {
  const [selectedQ, setSelectedQ] = useState(null)
  const [answers, setAnswers] = useState([])
  const [vfCorrect, setVfCorrect] = useState(null)
  const [visionCorrect, setVisionCorrect] = useState([])
  const [choiceCorrect, setChoiceCorrect] = useState(null)
  const [onlineCount, setOnlineCount] = useState(0)
  const [validatedMap, setValidatedMap] = useState({})
  const [customQText, setCustomQText] = useState('')
  const [sendingCustomQ, setSendingCustomQ] = useState(false)
  const code = getActiveSessionCode()
  const pageId = `${moduleId}:entrainement`
  const kQ = `${sharedKeyPrefix}_q`
  const kVf = `${sharedKeyPrefix}_vf_correct`
  const kClear = `${sharedKeyPrefix}_clear_ts`
  const kCustom = `${sharedKeyPrefix}_custom_q_text`

  useEffect(() => {
    setSharedState({ [kQ]: null, [kVf]: null, [kClear]: null, [kCustom]: null }).catch(() => {})
    return () => { setSharedState({ [kQ]: null, [kVf]: null, [kClear]: null, [kCustom]: null }).catch(() => {}) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedQ === null) return
    const poll = async () => {
      const rows = await fetchOpenAnswers(code, pageId)
      const latest = {}
      for (const r of (rows || [])) latest[r.participant_name] = r
      setAnswers(Object.values(latest))
    }
    poll()
    const t = setInterval(poll, 1500)
    return () => clearInterval(t)
  }, [selectedQ, code, pageId])

  useEffect(() => {
    const fetch = async () => {
      const { fetchOnlineParticipantCount } = await import('@/lib/participantPresence')
      const count = await fetchOnlineParticipantCount(code)
      setOnlineCount(count || 0)
    }
    fetch()
    const t = setInterval(fetch, 6000)
    return () => clearInterval(t)
  }, [code])

  const clearAnswers = async () => {
    await sbDelete('open_answers', `session_code=eq.${encodeURIComponent(code)}&page_id=eq.${encodeURIComponent(pageId)}`)
    setAnswers([])
    setValidatedMap({})
  }

  const selectQuestion = async (idx) => {
    await clearAnswers()
    setVfCorrect(null)
    setVisionCorrect([])
    setChoiceCorrect(null)
    setSelectedQ(idx)
    setValidatedMap({})
    await setSharedState({ [kQ]: idx, [kVf]: null, [kClear]: Date.now(), [kCustom]: null })
  }

  // Passer à la question suivante / revenir au choix — jamais automatique, uniquement sur action du formateur
  const handleNextQuestion = async () => {
    await clearAnswers()
    setSelectedQ(null)
    setVfCorrect(null)
    setVisionCorrect([])
    setChoiceCorrect(null)
    await setSharedState({ [kQ]: null, [kVf]: null, [kClear]: Date.now(), [kCustom]: null })
  }

  const sendCustomQ = async () => {
    if (!customQText.trim() || sendingCustomQ) return
    setSendingCustomQ(true)
    try {
      await clearAnswers()
      setVfCorrect(null)
      setVisionCorrect([])
      setChoiceCorrect(null)
      setSelectedQ(-1)
      setValidatedMap({})
      await setSharedState({ [kQ]: -1, [kCustom]: customQText.trim(), [kVf]: null, [kClear]: Date.now() })
    } finally {
      setSendingCustomQ(false)
    }
  }

  const handleVF = async (answer) => {
    const newVf = vfCorrect === answer ? null : answer
    setVfCorrect(newVf)
    await setSharedState({ [kVf]: newVf })
  }

  const toggleVisionCorrect = (opt) => {
    setVisionCorrect(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  }

  const handleChoiceCorrect = (opt) => {
    setChoiceCorrect(prev => prev === opt ? null : opt)
  }

  const questionIdxFor = (q) => q === -1 ? 199 : 100 + q

  const validateResponse = async (participantName, isCorrect) => {
    await saveModuleQuizAnswer({
      sessionCode: code,
      moduleId,
      questionIdx: questionIdxFor(selectedQ),
      collaborateur: participantName,
      answerIdx: 0,
      isCorrect,
    })
    setValidatedMap(v => ({ ...v, [participantName]: isCorrect }))
  }

  // Applique la sélection du formateur : auto-valide tous ceux qui ont exactement la même sélection
  const applyVisionCorrection = async () => {
    if (visionCorrect.length === 0) return
    const toValidate = answers.filter(row => !(row.participant_name in validatedMap))
    for (const row of toValidate) {
      const rowSelection = decodeVisionAnswer(row.answer)
      if (sameVisionAnswer(rowSelection, visionCorrect)) {
        await validateResponse(row.participant_name, true)
      }
    }
  }

  // La réponse du formateur (parmi les options) est considérée juste — auto-valide les formés qui ont choisi pareil
  const applyChoiceCorrection = async () => {
    if (!choiceCorrect) return
    const toValidate = answers.filter(row => !(row.participant_name in validatedMap))
    for (const row of toValidate) {
      if ((row.answer || '').trim() === choiceCorrect) {
        await validateResponse(row.participant_name, true)
      }
    }
  }

  const currentQ = selectedQ === -1
    ? { text: customQText.trim(), type: 'text' }
    : selectedQ !== null ? questions[selectedQ] : null
  const allAnswered = onlineCount > 0 && answers.length >= onlineCount
  const isVF = currentQ?.type === 'vrai-faux'
  const isVisionMulti = currentQ?.type === 'vision-multi'
  const isChoice = currentQ?.type === 'choice'

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #03112a 0%, #0a2a5c 55%, #0d3b7a 100%)', display: 'flex', flexDirection: 'column' }}>
      {/* Topbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={90} height={34} style={{ objectFit: 'contain' }} />
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>{header || 'Jeu des questions'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {selectedQ !== null && (
            <button
              onClick={handleNextQuestion}
              style={{ background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.4)', color: '#00abe9', padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >Question suivante →</button>
          )}
          <button
            onClick={clearAnswers}
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >🗑 Effacer les réponses</button>
          {onExit && (
            <button onClick={onExit}
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.55)', padding: '7px 16px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >✕ Quitter</button>
          )}
        </div>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, display: 'flex', gap: 24, padding: `8px 32px ${bottomPadding}px` }}>
        {/* Colonne gauche — questions */}
        <div style={{ width: 380, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Cliquez pour envoyer une question</div>
          {questions.map((q, i) => {
            const isSelected = selectedQ === i
            return (
              <button key={i} onClick={() => selectQuestion(i)} style={{
                background: isSelected ? 'rgba(0,171,233,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1.5px solid ${isSelected ? 'rgba(0,171,233,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14, padding: '14px 16px',
                textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                    background: isSelected ? '#00abe9' : 'rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: '#fff',
                  }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? '#fff' : 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{q.text}</div>
                    {q.type === 'vrai-faux' && (
                      <div style={{ fontSize: 11, color: isSelected ? 'rgba(0,171,233,0.8)' : 'rgba(255,255,255,0.35)', marginTop: 4, fontWeight: 600 }}>→ Réponse VRAI / FAUX</div>
                    )}
                    {q.type === 'vision-multi' && (
                      <div style={{ fontSize: 11, color: isSelected ? 'rgba(0,171,233,0.8)' : 'rgba(255,255,255,0.35)', marginTop: 4, fontWeight: 600 }}>→ Sélection multiple</div>
                    )}
                    {q.type === 'choice' && (
                      <div style={{ fontSize: 11, color: isSelected ? 'rgba(0,171,233,0.8)' : 'rgba(255,255,255,0.35)', marginTop: 4, fontWeight: 600 }}>→ {q.options.join(' / ')}</div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}

          {/* Séparateur + question libre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5 }}>ou</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <div style={{
            background: selectedQ === -1 ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.03)',
            border: `1.5px solid ${selectedQ === -1 ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 14, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: selectedQ === -1 ? '#a78bfa' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
              ✏️ Question personnalisée
            </div>
            <textarea
              value={customQText}
              onChange={e => setCustomQText(e.target.value)}
              placeholder="Tapez votre question ici…"
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 10, resize: 'none', outline: 'none',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 13, fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box',
              }}
            />
            <button
              onClick={sendCustomQ}
              disabled={!customQText.trim() || sendingCustomQ}
              style={{
                background: customQText.trim() ? 'linear-gradient(135deg, #7c3aed, #9f67fa)' : 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 10, padding: '10px 14px',
                color: '#fff', fontSize: 13, fontWeight: 700,
                cursor: customQText.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit', transition: 'all .15s',
              }}
            >
              {sendingCustomQ ? 'Envoi…' : '📤 Envoyer cette question'}
            </button>
          </div>
        </div>

        {/* Colonne droite — réponses */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          {currentQ === null ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, opacity: 0.4 }}>
              <div style={{ fontSize: 48 }}>🗣️</div>
              <div style={{ fontSize: 16, color: '#fff', fontWeight: 600 }}>Sélectionnez une question</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Les participants verront la question sur leur téléphone</div>
            </div>
          ) : (
            <>
              {/* Question active */}
              <div style={{ background: 'rgba(0,171,233,0.1)', border: '1px solid rgba(0,171,233,0.3)', borderRadius: 16, padding: '16px 20px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Question diffusée</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', lineHeight: 1.4 }}>{currentQ.text}</div>
              </div>

              {/* Boutons VRAI/FAUX formateur */}
              {isVF && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Votre réponse (bonne réponse officielle)</div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {['VRAI', 'FAUX'].map(v => (
                      <button key={v} onClick={() => handleVF(v)} style={{
                        flex: 1, padding: '14px', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                        background: vfCorrect === v ? (v === 'VRAI' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(255,255,255,0.07)',
                        border: `2px solid ${vfCorrect === v ? (v === 'VRAI' ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.15)'}`,
                        color: vfCorrect === v ? (v === 'VRAI' ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.6)',
                      }}>{v}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sélection multiple formateur — problèmes de vue */}
              {isVisionMulti && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Votre sélection (bonne réponse officielle)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 12 }}>
                    {VISION_MULTI_OPTIONS.map(opt => {
                      const sel = visionCorrect.includes(opt)
                      return (
                        <button key={opt} onClick={() => toggleVisionCorrect(opt)} style={{
                          padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          background: sel ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)',
                          border: `2px solid ${sel ? '#4ade80' : 'rgba(255,255,255,0.15)'}`,
                          color: sel ? '#4ade80' : 'rgba(255,255,255,0.6)',
                        }}>{sel ? '✓ ' : ''}{opt}</button>
                      )
                    })}
                  </div>
                  <button
                    onClick={applyVisionCorrection}
                    disabled={visionCorrect.length === 0}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                      cursor: visionCorrect.length === 0 ? 'default' : 'pointer',
                      background: visionCorrect.length === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                      border: 'none', color: visionCorrect.length === 0 ? 'rgba(255,255,255,0.3)' : '#fff',
                    }}
                  >✓ Définir comme bonne réponse</button>
                </div>
              )}

              {/* Choix unique formateur (ex: durée de validité d'ordonnance) */}
              {isChoice && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Votre réponse (bonne réponse officielle)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${currentQ.options.length}, 1fr)`, gap: 10, marginBottom: 12 }}>
                    {currentQ.options.map(opt => {
                      const sel = choiceCorrect === opt
                      return (
                        <button key={opt} onClick={() => handleChoiceCorrect(opt)} style={{
                          padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                          background: sel ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)',
                          border: `2px solid ${sel ? '#4ade80' : 'rgba(255,255,255,0.15)'}`,
                          color: sel ? '#4ade80' : 'rgba(255,255,255,0.6)',
                        }}>{sel ? '✓ ' : ''}{opt}</button>
                      )
                    })}
                  </div>
                  <button
                    onClick={applyChoiceCorrection}
                    disabled={!choiceCorrect}
                    style={{
                      width: '100%', padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                      cursor: !choiceCorrect ? 'default' : 'pointer',
                      background: !choiceCorrect ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #16a34a, #22c55e)',
                      border: 'none', color: !choiceCorrect ? 'rgba(255,255,255,0.3)' : '#fff',
                    }}
                  >✓ Définir comme bonne réponse</button>
                </div>
              )}

              {/* Indicateur "Tous ont répondu" */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  background: allAnswered ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${allAnswered ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 12, padding: '10px 16px',
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: allAnswered ? '#4ade80' : '#f59e0b', animation: allAnswered ? 'none' : 'optiqueHalo 1.2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: allAnswered ? '#4ade80' : 'rgba(255,255,255,0.6)' }}>
                    {answers.length} réponse{answers.length > 1 ? 's' : ''} reçue{answers.length > 1 ? 's' : ''}
                    {onlineCount > 0 && ` / ${onlineCount} participant${onlineCount > 1 ? 's' : ''}`}
                    {allAnswered && ' — Tout le monde a répondu ✓'}
                  </span>
                </div>
                {answers.length > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                    fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
                  }}>
                    <span style={{ color: '#4ade80' }}>{Object.keys(validatedMap).length}</span>
                    <span>/</span>
                    <span>{answers.length}</span>
                    <span style={{ fontSize: 11, fontWeight: 500 }}>validées</span>
                  </div>
                )}
              </div>

              {/* Liste des réponses */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {answers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>En attente des réponses…</div>
                ) : answers.map(row => {
                  const status = validatedMap[row.participant_name]
                  const isValidated = status !== undefined
                  const displayAnswer = isVisionMulti ? decodeVisionAnswer(row.answer).join(', ') || '—' : row.answer
                  return (
                    <div key={row.participant_name} style={{
                      background: isValidated ? (status ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)') : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${isValidated ? (status ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)') : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 12, padding: '12px 16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{row.participant_name}</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{displayAnswer}</div>
                        </div>
                        {!isValidated ? (
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => validateResponse(row.participant_name, true)} style={{
                              width: 36, height: 36, borderRadius: 10, border: '1.5px solid rgba(34,197,94,0.5)', background: 'rgba(34,197,94,0.12)',
                              color: '#4ade80', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                            }}>✓</button>
                            <button onClick={() => validateResponse(row.participant_name, false)} style={{
                              width: 36, height: 36, borderRadius: 10, border: '1.5px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.12)',
                              color: '#f87171', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                            }}>✗</button>
                          </div>
                        ) : (
                          <div style={{
                            flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            background: status ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                            color: status ? '#4ade80' : '#f87171',
                            border: `1px solid ${status ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
                          }}>{status ? '+10 pts ✓' : '0 pt ✗'}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vue formé ─────────────────────────────────────────────────────
export function QuestionsGameParticipantView({ pName, moduleId, questionIdx, vfCorrect, clearTs, customQText, questions }) {
  const [selected, setSelected] = useState([])
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [vfSelected, setVfSelected] = useState(null)
  const [choiceSelected, setChoiceSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [validated, setValidated] = useState(null) // null | true | false
  const pageId = `${moduleId}:entrainement`

  useEffect(() => {
    setText('')
    setSelected([])
    setSubmitted(false)
    setVfSelected(null)
    setChoiceSelected(null)
    setSaveError(false)
    setValidated(null)
  }, [questionIdx, clearTs])

  useEffect(() => {
    if (!submitted || questionIdx == null) return
    const qIdx = questionIdx === -1 ? 199 : 100 + questionIdx
    const poll = async () => {
      const rows = await sbSelect(
        'quiz_answers',
        `session_code=eq.${getParticipantSessionCode()}&module_id=eq.${encodeURIComponent(moduleId)}&question_idx=eq.${qIdx}&collaborateur=eq.${encodeURIComponent((pName || 'Anonyme').trim())}`
      )
      if (rows && rows.length > 0) setValidated(rows[0].is_correct)
    }
    poll()
    const t = setInterval(poll, 2000)
    return () => clearInterval(t)
  }, [submitted, questionIdx, pName, moduleId])

  const q = questionIdx === -1
    ? { text: customQText || '…', type: 'text' }
    : questionIdx != null ? questions[questionIdx] : null

  const submitAnswer = async (answer) => {
    if (submitted || saving) return
    setSaving(true)
    setSaveError(false)
    try {
      const ok = await insertOpenAnswer({
        sessionCode: getParticipantSessionCode(),
        pageId,
        participantName: pName?.trim() || 'Anonyme',
        answer,
      })
      if (ok === false) throw new Error('insert failed')
      setSubmitted(true)
    } catch {
      setSaveError(true)
    } finally {
      setSaving(false)
    }
  }

  const submitText = () => { if (text.trim()) submitAnswer(text.trim()) }
  const submitVF = (answer) => { setVfSelected(answer); submitAnswer(answer) }
  const submitChoice = (answer) => { setChoiceSelected(answer); submitAnswer(answer) }
  const toggleSelect = (opt) => setSelected(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])
  const submitVisionMulti = () => { if (selected.length > 0) submitAnswer(encodeVisionAnswer(selected)) }

  const bg = { minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 20px 40px' }

  if (!q) {
    return (
      <div style={bg}>
        <Image src="/assets/logo-lpt-blanc.png" alt="LPT" width={80} height={30}
          style={{ objectFit: 'contain', opacity: 0.5, marginBottom: 40 }} />
        <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>Jeu des questions</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.7 }}>
          Le formateur va choisir une question.<br />Elle apparaîtra ici — préparez-vous.
        </div>
        <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00abe9', animation: 'waitDot 1.4s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 }}>En attente du formateur…</span>
        </div>
      </div>
    )
  }

  if (submitted && validated !== null) return <ResultBanner isCorrect={validated} />

  if (submitted) {
    return (
      <div style={bg}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>✍️</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 10, textAlign: 'center' }}>Réponse envoyée !</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>En attente de la validation du formateur…</div>
        {q.type === 'vrai-faux' && vfSelected && (
          <div style={{
            marginTop: 24, background: vfSelected === 'VRAI' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${vfSelected === 'VRAI' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            borderRadius: 16, padding: '14px 32px', fontSize: 22, fontWeight: 900,
            color: vfSelected === 'VRAI' ? '#4ade80' : '#f87171',
          }}>{vfSelected}</div>
        )}
        {q.type === 'vision-multi' && selected.length > 0 && (
          <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 320 }}>
            {selected.map(opt => (
              <div key={opt} style={{ background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.4)', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700, color: '#00abe9' }}>{opt}</div>
            ))}
          </div>
        )}
        {q.type === 'choice' && choiceSelected && (
          <div style={{
            marginTop: 24, background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.4)',
            borderRadius: 16, padding: '14px 32px', fontSize: 20, fontWeight: 900, color: '#00abe9',
          }}>{choiceSelected}</div>
        )}
        <div style={{ marginTop: 24, width: 32, height: 32, border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #00abe9', borderRadius: '50%', animation: 'quizSpin 1s linear infinite' }} />
        <style>{`@keyframes quizSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'linear-gradient(160deg, #03112a 0%, #0a2a5c 100%)', padding: '48px 20px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ background: 'rgba(0,171,233,0.15)', border: '1px solid rgba(0,171,233,0.35)', borderRadius: 20, padding: '6px 20px', fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 24 }}>
        Question du formateur
      </div>

      <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textAlign: 'center', lineHeight: 1.3, maxWidth: 340, marginBottom: 32 }}>
        {q.text}
      </div>

      {q.type === 'vrai-faux' ? (
        <div style={{ display: 'flex', gap: 16, width: '100%', maxWidth: 340 }}>
          {['VRAI', 'FAUX'].map(v => (
            <button key={v} onClick={() => submitVF(v)} disabled={saving} style={{
              flex: 1, padding: '22px 0', borderRadius: 18, fontSize: 22, fontWeight: 900,
              cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
              background: v === 'VRAI' ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'linear-gradient(135deg, #dc2626, #ef4444)',
              border: 'none', color: '#fff',
              boxShadow: v === 'VRAI' ? '0 6px 20px rgba(34,197,94,0.35)' : '0 6px 20px rgba(239,68,68,0.35)',
            }}>{v}</button>
          ))}
        </div>
      ) : q.type === 'choice' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 340 }}>
          {q.options.map(opt => (
            <button key={opt} onClick={() => submitChoice(opt)} disabled={saving} style={{
              padding: '18px 0', borderRadius: 16, fontSize: 17, fontWeight: 800,
              cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
              background: 'linear-gradient(135deg, #0070a8, #00abe9)',
              border: 'none', color: '#fff',
              boxShadow: '0 6px 20px rgba(0,171,233,0.35)',
            }}>{opt}</button>
          ))}
        </div>
      ) : q.type === 'vision-multi' ? (
        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {VISION_MULTI_OPTIONS.map(opt => {
              const sel = selected.includes(opt)
              return (
                <button key={opt} onClick={() => toggleSelect(opt)} disabled={saving} style={{
                  padding: '18px 10px', borderRadius: 16, fontSize: 15, fontWeight: 800, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit',
                  background: sel ? 'rgba(0,171,233,0.28)' : 'rgba(255,255,255,0.07)',
                  border: `2px solid ${sel ? '#00abe9' : 'rgba(255,255,255,0.15)'}`,
                  color: sel ? '#00abe9' : 'rgba(255,255,255,0.7)',
                }}>{sel ? '✓ ' : ''}{opt}</button>
              )
            })}
          </div>
          <button onClick={submitVisionMulti} disabled={selected.length === 0 || saving} style={{
            background: selected.length > 0 ? 'linear-gradient(135deg, #0070a8, #00abe9)' : 'rgba(255,255,255,0.08)',
            border: 'none', color: '#fff', padding: '16px', borderRadius: 16,
            fontSize: 16, fontWeight: 700, cursor: selected.length > 0 ? 'pointer' : 'default', fontFamily: 'inherit',
          }}>{saving ? 'Envoi…' : saveError ? '✗ Réessayer' : '✓ Valider ma sélection'}</button>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Votre réponse…"
            rows={4}
            style={{ width: '100%', padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 16, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
          />
          <button onClick={submitText} disabled={!text.trim() || saving} style={{
            background: text.trim() ? 'linear-gradient(135deg, #0070a8, #00abe9)' : 'rgba(255,255,255,0.08)',
            border: 'none', color: '#fff', padding: '16px', borderRadius: 16,
            fontSize: 16, fontWeight: 700, cursor: text.trim() ? 'pointer' : 'default', fontFamily: 'inherit',
          }}>{saving ? 'Envoi…' : saveError ? '✗ Réessayer' : '✓ Envoyer'}</button>
          {saveError && (
            <div style={{ color: '#f87171', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
              Erreur lors de l'envoi. Réessayez.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultBanner({ isCorrect }) {
  return (
    <div style={{
      minHeight: '100dvh',
      background: isCorrect ? 'linear-gradient(160deg, #03112a 0%, #052a14 100%)' : 'linear-gradient(160deg, #03112a 0%, #2a0505 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 20 }}>{isCorrect ? '✅' : '❌'}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
        {isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse'}
      </div>
      <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)' }}>En attente de la prochaine question…</div>
    </div>
  )
}
