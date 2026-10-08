'use client'
import { useState } from 'react'

// Joue une question QCM (une ou plusieurs bonnes réponses). Réutilise les
// classes .quiz-* déjà définies dans globals.css (mêmes composants visuels
// que les quiz de session live), pour rester dans la même famille visuelle
// sans dupliquer de style.
//
// Types d'exercice pris en charge ici : 'qcm' (une bonne réponse),
// 'qcm-multi' (plusieurs bonnes réponses, data.correct = tableau d'indices).
// D'autres types ('vrai-faux', 'association', 'reponse-libre',
// 'mise-en-situation') pourront être ajoutés plus tard : voir ExerciceRunner
// dans ExercicesView.js, qui aiguille déjà sur `question.type` — il suffira
// d'y ajouter un nouveau composant de lecture, sans toucher QcmPlayer.
export default function QcmPlayer({ question, onResult }) {
  const [selected, setSelected] = useState([])
  const [validated, setValidated] = useState(false)
  const isMulti = question.type === 'qcm-multi'
  const options = question.data?.options || []
  const correctIndices = isMulti ? (question.data?.correct || []) : [question.data?.correct]

  const toggle = (idx) => {
    if (validated) return
    if (isMulti) setSelected(s => s.includes(idx) ? s.filter(x => x !== idx) : [...s, idx])
    else setSelected([idx])
  }

  const valider = () => {
    const isCorrect = isMulti
      ? selected.length === correctIndices.length && selected.every(i => correctIndices.includes(i))
      : selected[0] === correctIndices[0]
    setValidated(true)
    onResult(isCorrect)
  }

  const lettre = i => String.fromCharCode(65 + i)

  return (
    <div className="quiz-q">
      {isMulti && !validated && (
        <div style={{ fontSize: 12, color: 'var(--text-m)', marginBottom: 10, fontStyle: 'italic' }}>Plusieurs réponses possibles</div>
      )}
      <div className="quiz-qtext">{question.enonce}</div>
      <div className="quiz-opts">
        {options.map((opt, i) => {
          const isSelected = selected.includes(i)
          const isCorrectOpt = correctIndices.includes(i)
          let cls = 'quiz-obtn'
          if (validated) {
            if (isCorrectOpt) cls += ' correct'
            else if (isSelected) cls += ' wrong'
            else cls += ' disabled'
          }
          return (
            <button key={i} type="button" className={cls} onClick={() => toggle(i)} disabled={validated}>
              <span className="qletter" style={isSelected && !validated ? { background: 'var(--lpt)', borderColor: 'var(--lpt)', color: '#fff' } : undefined}>{lettre(i)}</span>
              {opt}
            </button>
          )
        })}
      </div>
      {!validated ? (
        <button
          onClick={valider}
          disabled={selected.length === 0}
          style={{
            marginTop: 14, width: '100%', minHeight: 44, padding: '12px', borderRadius: 10, border: 'none',
            background: selected.length === 0 ? '#e5e7eb' : 'linear-gradient(135deg,#0089ba,#00abe9)',
            color: selected.length === 0 ? '#9aa1ac' : '#fff', fontWeight: 700, fontSize: 14,
            cursor: selected.length === 0 ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >Valider ma réponse</button>
      ) : (
        question.explication && (
          <div className={`quiz-fb show ${correctIndices.length === selected.length && selected.every(i => correctIndices.includes(i)) ? 'ok' : 'ko'}`}>
            {question.explication}
          </div>
        )
      )}
    </div>
  )
}
