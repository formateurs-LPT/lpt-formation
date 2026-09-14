'use client'
import { useState, useEffect, useRef } from 'react'
import {
  pickRandomOrdonnances, formatOrdonnanceDate, formatEyeLine, ORDONNANCE_CATEGORIES,
} from '@/lib/ordonnancesData'

function setsEqual(a, b) {
  if (a.size !== b.size) return false
  for (const x of a) if (!b.has(x)) return false
  return true
}

// Carte "papier" imitant une vraie ordonnance — fond clair volontaire (par
// contraste avec le reste de l'app, en sombre) pour l'effet lecture réelle.
function PrescriptionPaper({ o }) {
  return (
    <div style={{
      background: '#fafaf8', color: '#1a1a1a', borderRadius: 10, padding: '24px 26px',
      fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.7, boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.3 }}>
          CENTRE MEDICAL<br />OPHTALMOLOGIQUE
        </div>
        <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: 12.5 }}>
          {o.prenom.match(/e$/) ? 'Madame' : 'Monsieur'} {o.prenom} {o.nom}<br />
          {o.centre.ville}, {formatOrdonnanceDate(o.dateISO)}
        </div>
      </div>

      <div style={{ marginBottom: 20, fontSize: 12 }}>
        <div style={{ fontWeight: 700 }}>{o.docteur.nom}</div>
        <div style={{ color: '#555' }}>Ophtalmologiste</div>
        <div style={{ color: '#555', marginTop: 4 }}>RPPS : {o.docteur.rpps}</div>
        <div style={{ color: '#555' }}>ADELI : {o.docteur.adeli}</div>
      </div>

      <div style={{ marginBottom: 8, fontWeight: 700 }}>Verres et monture :</div>
      <div style={{ marginBottom: 10 }}>{o.typeVerres}</div>
      <div>Œil droit : {formatEyeLine(o.od, o.order)}</div>
      <div style={{ marginBottom: 20 }}>Œil gauche : {formatEyeLine(o.og, o.order)}</div>

      <div style={{ textAlign: 'right', fontSize: 12, color: '#333', marginBottom: 20 }}>
        <div style={{ fontWeight: 700 }}>{o.docteur.nom}</div>
        <div>N° RPPS : {o.docteur.rpps}</div>
        <div>N° ADELI : {o.docteur.adeli}</div>
      </div>

      <div style={{ borderTop: '1px solid #ddd', paddingTop: 10, fontSize: 10.5, color: '#777' }}>
        {o.centre.nom}<br />
        {o.centre.adresse} · {o.centre.cp} {o.centre.ville}<br />
        Tel : {o.centre.tel}
      </div>
    </div>
  )
}

export default function OrdonnanceExercise({ onClose, onFinish }) {
  const [questions] = useState(() => pickRandomOrdonnances(5))
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(new Set())
  const [validated, setValidated] = useState(false)
  const [results, setResults] = useState([])
  const reportedRef = useRef(false)

  const finished = qIndex >= questions.length
  const current = !finished ? questions[qIndex] : null
  const isCorrect = current && validated ? setsEqual(selected, new Set(current.answers)) : null

  // Note (1-5) attribuée automatiquement selon le nombre de bonnes réponses
  // sur les 5 questions — 0/5 est plancher à 1 (l'échelle de notation n'a pas
  // de 0). Ne se déclenche qu'une fois, à l'arrivée sur l'écran de résultat.
  useEffect(() => {
    if (!finished || reportedRef.current) return
    reportedRef.current = true
    const score = Math.max(1, Math.min(5, results.filter(Boolean).length))
    onFinish?.(score)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  const toggle = (key) => {
    if (validated) return
    setSelected(s => {
      const n = new Set(s)
      n.has(key) ? n.delete(key) : n.add(key)
      return n
    })
  }

  const validate = () => {
    if (!selected.size || validated) return
    setValidated(true)
    setResults(r => [...r, setsEqual(selected, new Set(current.answers))])
  }

  const next = () => {
    setSelected(new Set())
    setValidated(false)
    setQIndex(i => i + 1)
  }

  const scoreCount = results.filter(Boolean).length

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d1f3c', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20,
          padding: '26px 30px', width: '100%', maxWidth: 820, maxHeight: '88vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00abe9', textTransform: 'uppercase', letterSpacing: 1.5 }}>
            🩺 Exercice — Lecture d&apos;ordonnance
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', textTransform: 'none', letterSpacing: 0, marginTop: 4 }}>
              {finished ? 'Résultat' : `Question ${qIndex + 1} / ${questions.length}`}
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', color: 'rgba(255,255,255,0.5)', fontSize: 16, flexShrink: 0,
          }}>✕</button>
        </div>

        {finished ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{scoreCount === questions.length ? '🏆' : scoreCount >= 3 ? '👍' : '📚'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
              {scoreCount} / {questions.length} bonnes réponses
            </div>
            <p style={{ fontSize: 13, color: '#4ade80', fontWeight: 700, marginBottom: 24 }}>
              ✅ Note {Math.max(1, Math.min(5, scoreCount))}/5 attribuée automatiquement à &quot;Lecture ordonnance&quot;.
            </p>
            <button onClick={onClose} style={{
              background: '#00abe9', border: 'none', color: '#fff', padding: '10px 24px',
              borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Fermer</button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 360px', minWidth: 300 }}>
              <PrescriptionPaper o={current} />
            </div>
            <div style={{ flex: '1 1 260px', minWidth: 240 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 14 }}>
                D&apos;après cette ordonnance, le client est :
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {ORDONNANCE_CATEGORIES.map(cat => {
                  const isSelected = selected.has(cat.key)
                  const isAnswer = current.answers.includes(cat.key)
                  let border = 'rgba(255,255,255,0.15)'
                  let bg = 'rgba(255,255,255,0.05)'
                  let color = '#fff'
                  if (validated) {
                    if (isAnswer) { border = '#22c55e'; bg = 'rgba(34,197,94,0.15)'; color = '#4ade80' }
                    else if (isSelected) { border = '#dc2626'; bg = 'rgba(220,38,38,0.15)'; color = '#f87171' }
                  } else if (isSelected) {
                    border = '#00abe9'; bg = 'rgba(0,171,233,0.15)'; color = '#7dd3fc'
                  }
                  return (
                    <button
                      key={cat.key}
                      onClick={() => toggle(cat.key)}
                      disabled={validated}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: bg, border: `1.5px solid ${border}`, color,
                        borderRadius: 10, padding: '11px 16px', fontSize: 14, fontWeight: 700,
                        cursor: validated ? 'default' : 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      }}
                    >
                      {cat.label}
                      {isSelected && <span>{validated ? (isAnswer ? '✅' : '❌') : '✓'}</span>}
                    </button>
                  )
                })}
              </div>

              {!validated ? (
                <button
                  onClick={validate}
                  disabled={!selected.size}
                  style={{
                    width: '100%', padding: '11px', background: selected.size ? '#00abe9' : 'rgba(255,255,255,0.1)',
                    color: selected.size ? '#fff' : 'rgba(255,255,255,0.35)', border: 'none', borderRadius: 10,
                    fontSize: 14, fontWeight: 700, cursor: selected.size ? 'pointer' : 'default', fontFamily: 'inherit',
                  }}
                >Valider</button>
              ) : (
                <>
                  <div style={{
                    padding: '12px 14px', borderRadius: 10, marginBottom: 14, fontSize: 13, lineHeight: 1.5,
                    background: isCorrect ? 'rgba(34,197,94,0.12)' : 'rgba(220,38,38,0.12)',
                    border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.4)' : 'rgba(220,38,38,0.4)'}`,
                    color: isCorrect ? '#4ade80' : '#f87171', fontWeight: 600,
                  }}>
                    {isCorrect ? '✅ Bonne réponse !' : '❌ Ce n\'est pas la bonne réponse. Voit avec ton manager pour comprendre pourquoi.'}
                  </div>
                  <button
                    onClick={next}
                    style={{
                      width: '100%', padding: '11px', background: '#00abe9', border: 'none', color: '#fff',
                      borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >{qIndex + 1 < questions.length ? 'Question suivante →' : 'Voir mon résultat'}</button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
