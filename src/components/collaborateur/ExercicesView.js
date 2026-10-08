'use client'
import { useState, useEffect } from 'react'
import { getSkillItems, isBelgiqueStore } from '@/lib/storeFollowupData'
import { sectionPourPoste } from '@/lib/collaborateurProgressConfig'
import {
  getMagasinSlug, getExercicesParTheme, getQuestionsExercice,
  getResultatsCollaborateur, soumettreResultatExercice,
} from '@/lib/collaborateurFormationApi'
import QcmPlayer from './QcmPlayer'

const cardStyle = { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, boxShadow: '0 1px 2px rgba(16,24,40,0.03)' }

// Aiguillage par type de question — pour ajouter un nouveau type d'exercice
// (vrai-faux, association, réponse libre, mise en situation...), ajouter un
// cas ici et le composant de lecture correspondant, sans toucher au reste.
function QuestionRunner({ question, onResult }) {
  if (question.type === 'qcm' || question.type === 'qcm-multi') {
    return <QcmPlayer question={question} onResult={onResult} />
  }
  return (
    <div className="quiz-q">
      <div className="quiz-qtext">{question.enonce}</div>
      <div style={{ fontSize: 13, color: '#9aa1ac', fontStyle: 'italic', marginTop: 8 }}>Ce type d&apos;exercice n&apos;est pas encore disponible.</div>
      <button onClick={() => onResult(true)} style={{ marginTop: 12, padding: '10px 16px', minHeight: 44, borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', color: '#14161a', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Passer</button>
    </div>
  )
}

function ExerciceRunner({ exercice, session, storeSlug, onBack, onTermine }) {
  const [questions, setQuestions] = useState(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lastResult, setLastResult] = useState(null) // null | true | false (réponse donnée, en attente de "Suivant")
  const [fini, setFini] = useState(false)

  useEffect(() => {
    let cancelled = false
    getQuestionsExercice(exercice.id).then(rows => { if (!cancelled) setQuestions(rows || []) })
    return () => { cancelled = true }
  }, [exercice.id])

  if (!questions) return <div style={{ color: '#9aa1ac', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Chargement…</div>

  if (questions.length === 0) {
    return (
      <div>
        <button onClick={onBack} className="detail-back" style={{ marginBottom: 16 }}>← Exercices</button>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px', color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Bientôt disponible</div>
      </div>
    )
  }

  if (fini) {
    const total = questions.length
    const pct = Math.round((score / total) * 100)
    return (
      <div>
        <div style={{ ...cardStyle, textAlign: 'center', padding: '36px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#14161a', marginBottom: 4 }}>{score}/{total}</div>
          <div style={{ fontSize: 13.5, color: '#6b7280', marginBottom: 24 }}>{pct}% de bonnes réponses — entraînement enregistré</div>
          <button onClick={onTermine} style={{ padding: '12px 24px', minHeight: 44, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0089ba,#00abe9)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>Retour aux exercices</button>
        </div>
      </div>
    )
  }

  const question = questions[index]
  const estDerniere = index === questions.length - 1

  const handleResult = (isCorrect) => {
    setLastResult(isCorrect)
    if (isCorrect) setScore(s => s + 1)
  }

  const suivant = async () => {
    if (estDerniere) {
      const finalScore = score // score déjà incrémenté par handleResult avant ce clic
      setFini(true)
      await soumettreResultatExercice({
        exerciceId: exercice.id,
        collaborateurId: session.id,
        themeId: exercice.theme_id,
        score: finalScore,
        total: questions.length,
        storeSlug,
        collaborateurSlug: session.slug,
      })
    } else {
      setIndex(i => i + 1)
      setLastResult(null)
    }
  }

  return (
    <div>
      <button onClick={onBack} className="detail-back" style={{ marginBottom: 12 }}>← Exercices</button>
      <div style={{ fontSize: 12, color: '#9aa1ac', marginBottom: 10 }}>Question {index + 1} / {questions.length}</div>
      <QuestionRunner key={question.id} question={question} onResult={handleResult} />
      {lastResult !== null && (
        <button onClick={suivant} style={{ marginTop: 14, width: '100%', minHeight: 44, padding: '12px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#0089ba,#00abe9)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          {estDerniere ? 'Voir mon score' : 'Question suivante →'}
        </button>
      )}
    </div>
  )
}

export default function ExercicesView({ session, initialThemeId, onConsumedInitialTheme }) {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [exercicesParTheme, setExercicesParTheme] = useState({})
  const [resultats, setResultats] = useState({})
  const [storeSlug, setStoreSlug] = useState(null)
  const [openExercice, setOpenExercice] = useState(null)
  const [filtreThemeId, setFiltreThemeId] = useState(initialThemeId || null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const sectionId = sectionPourPoste(session.poste)
      if (!sectionId) { if (!cancelled) { setItems([]); setLoading(false) } return }
      const slug = await getMagasinSlug(session.magasinId)
      const isBelgique = slug ? isBelgiqueStore(slug) : false
      const skillItems = getSkillItems(sectionId, isBelgique)
      const [exercices, res] = await Promise.all([
        getExercicesParTheme(skillItems.map(it => it.id)),
        getResultatsCollaborateur(session.id),
      ])
      if (!cancelled) { setItems(skillItems); setExercicesParTheme(exercices); setResultats(res); setStoreSlug(slug); setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [session.poste, session.magasinId, session.id])

  const reloadResultats = async () => {
    const res = await getResultatsCollaborateur(session.id)
    setResultats(res)
  }

  if (loading) return <div style={{ color: '#9aa1ac', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Chargement…</div>

  if (openExercice) {
    return (
      <ExerciceRunner
        exercice={openExercice}
        session={session}
        storeSlug={storeSlug}
        onBack={() => setOpenExercice(null)}
        onTermine={() => { setOpenExercice(null); reloadResultats() }}
      />
    )
  }

  if (items.length === 0) {
    return (
      <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#14161a' }}>Bientôt disponible</div>
      </div>
    )
  }

  const themesAffiches = filtreThemeId ? items.filter(it => it.id === filtreThemeId) : items

  return (
    <div>
      {filtreThemeId && (
        <button
          onClick={() => { setFiltreThemeId(null); onConsumedInitialTheme?.() }}
          className="detail-back"
          style={{ marginBottom: 16 }}
        >← Tous les thèmes</button>
      )}
      {themesAffiches.map(theme => {
        const exercicesTheme = exercicesParTheme[theme.id] || []
        return (
          <div key={theme.id} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#14161a', marginBottom: 10 }}>{theme.label}</div>
            {exercicesTheme.length === 0 ? (
              <div style={{ ...cardStyle, padding: '16px 18px', color: '#9aa1ac', fontSize: 13, fontStyle: 'italic' }}>Bientôt disponible</div>
            ) : (
              exercicesTheme.map(ex => {
                const dernier = resultats[ex.id]
                return (
                  <button
                    key={ex.id}
                    onClick={() => setOpenExercice(ex)}
                    style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8, padding: '14px 18px' }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#14161a' }}>{ex.titre}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {dernier && <span style={{ fontSize: 11, fontWeight: 700, color: '#0369a1', background: '#eaf3fd', padding: '3px 9px', borderRadius: 20 }}>{dernier.score}/{dernier.total}</span>}
                      <span style={{ color: '#c7cbd1', fontSize: 18 }}>›</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )
      })}
    </div>
  )
}
