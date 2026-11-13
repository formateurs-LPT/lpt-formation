'use client'
import { useState } from 'react'
import { QUIZ_POSITIONNEMENT } from '@/lib/testPositionnement'

// Écran plein d'un quiz côté collaborateur (/mes-modules) : test de
// positionnement ou Quiz Légende. Une question à la fois, pas de correction
// pendant le quiz ; le Quiz Légende (quiz.corrige) affiche la correction
// complète à la fin, le formateur voit le détail dans la fiche.
const conteneur = {
  position: 'fixed', inset: 0, zIndex: 50, background: '#f2f2f7', display: 'flex', flexDirection: 'column',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', 'DM Sans', sans-serif",
  WebkitFontSmoothing: 'antialiased', color: '#000',
  paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
}
const zone = { width: '100%', maxWidth: 640, margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }

export default function TestPositionnementPasse({ quiz = QUIZ_POSITIONNEMENT, collaborateurId, prenom, onTermine, onFermer }) {
  const TEST_NOM = quiz.nom
  const [questions] = useState(() => quiz.preparer())
  const [etape, setEtape] = useState('intro') // intro | question | envoi | fin | erreur
  const [index, setIndex] = useState(0)
  const [choix, setChoix] = useState(null)
  const [reponses, setReponses] = useState([])
  const [score, setScore] = useState(null)

  const q = questions[index]

  const envoyer = async (toutes) => {
    setEtape('envoi')
    const s = await quiz.enregistrer(collaborateurId, toutes)
    if (s === null) { setEtape('erreur'); return }
    setScore(s)
    setEtape('fin')
    onTermine()
  }

  const valider = () => {
    if (choix === null) return
    const toutes = [...reponses, { id: q.id, theme: q.theme, correct: choix === q.bonneAffichee, choisie: q.affichees[choix], libelle: q.q, bonne: q.options[0] }]
    setReponses(toutes)
    setChoix(null)
    if (index + 1 < questions.length) setIndex(index + 1)
    else envoyer(toutes)
  }

  if (etape === 'intro') {
    return (
      <div style={conteneur} role="dialog" aria-modal="true" aria-label={TEST_NOM}>
        <div style={{ ...zone, display: 'flex', justifyContent: 'flex-start' }}>
          <button onClick={onFermer} className="mm-lien">Plus tard</button>
        </div>
        <div style={{ ...zone, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, background: quiz.degrade }} aria-hidden="true">{quiz.icone}</div>
          <h1 className="mm-titre" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{TEST_NOM}</h1>
          <p style={{ fontSize: 17, color: '#3c3c43', lineHeight: 1.45, margin: 0 }}>
            {quiz.intro(prenom)}
          </p>
          <p style={{ fontSize: 15, color: '#6e6e73', lineHeight: 1.45, margin: 0 }}>
            {quiz.consigne(quiz.total)}
          </p>
        </div>
        <div style={zone}>
          <button onClick={() => setEtape('question')} className="mm-bouton">Commencer</button>
        </div>
      </div>
    )
  }

  if (etape === 'question') {
    return (
      <div style={conteneur} role="dialog" aria-modal="true" aria-label={TEST_NOM}>
        <div style={zone}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', fontSize: 15, color: '#6e6e73', fontVariantNumeric: 'tabular-nums' }}>
            <span>{TEST_NOM}</span>
            <span>{index + 1} / {questions.length}</span>
          </div>
          <div style={{ height: 4, borderRadius: 2, background: '#e5e5ea', marginTop: 8, overflow: 'hidden' }} aria-hidden="true">
            <div style={{ height: '100%', width: `${(index / questions.length) * 100}%`, background: '#0089ba', borderRadius: 2, transition: 'width 300ms ease-out' }} />
          </div>
        </div>
        <div style={{ ...zone, flex: 1, overflowY: 'auto', paddingTop: 22 }}>
          <h2 className="mm-titre" style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, margin: '0 0 18px' }}>{q.q}</h2>
          <div role="radiogroup" aria-label="Réponses" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {q.affichees.map((texte, i) => {
              const coche = choix === i
              return (
                <button
                  key={i} role="radio" aria-checked={coche} onClick={() => setChoix(i)}
                  style={{
                    textAlign: 'left', padding: '14px 16px', borderRadius: 12, fontFamily: 'inherit', fontSize: 17, lineHeight: 1.35,
                    letterSpacing: '-0.01em', cursor: 'pointer', color: '#000', WebkitTapHighlightColor: 'transparent',
                    background: coche ? '#e5f3fa' : '#fff', border: `2px solid ${coche ? '#0089ba' : 'transparent'}`,
                  }}
                >{texte}</button>
              )
            })}
          </div>
        </div>
        <div style={{ ...zone, paddingTop: 12 }}>
          <button onClick={valider} disabled={choix === null} className="mm-bouton">
            {index + 1 < questions.length ? 'Question suivante' : 'Terminer le test'}
          </button>
        </div>
      </div>
    )
  }

  const correctionVisible = etape === 'fin' && quiz.corrige
  return (
    <div style={conteneur} role="dialog" aria-modal="true" aria-label={TEST_NOM}>
      <div style={{ ...zone, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: correctionVisible ? 'flex-start' : 'center', gap: 14, textAlign: 'center', overflowY: 'auto', paddingTop: correctionVisible ? 24 : 0, paddingBottom: 8 }}>
        {etape === 'envoi' && (
          <div role="status" aria-label="Enregistrement" style={{ display: 'flex', justifyContent: 'center' }}><div className="mm-roue" /></div>
        )}
        {etape === 'erreur' && (
          <>
            <h1 className="mm-titre" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>Ton test n&apos;a pas pu être enregistré</h1>
            <p style={{ fontSize: 16, color: '#6e6e73', margin: 0 }}>Vérifie ta connexion, puis réessaie : tes réponses sont gardées.</p>
            <button onClick={() => envoyer(reponses)} className="mm-bouton" style={{ marginTop: 8 }}>Réessayer</button>
          </>
        )}
        {etape === 'fin' && (
          <>
            <div style={{ fontSize: 44 }} aria-hidden="true">🎉</div>
            <h1 className="mm-titre" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>Test terminé !</h1>
            <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {score}<span style={{ color: '#8e8e93', fontSize: 24 }}> / {questions.length}</span>
            </div>
            {quiz.corrige ? (
              <Correction reponses={reponses} explication={quiz.explication} />
            ) : (
              <p style={{ fontSize: 16, color: '#3c3c43', lineHeight: 1.45, margin: 0 }}>
                Merci ! Ton formateur va regarder tes résultats avec toi et t&apos;ouvrir les modules qui te seront le plus utiles.
              </p>
            )}
            <button onClick={onFermer} className="mm-bouton" style={{ marginTop: 8 }}>Revenir à mes modules</button>
          </>
        )}
      </div>
    </div>
  )
}

// Correction : les erreurs d'abord, chacune avec la bonne réponse et
// l'explication quand le quiz en a une, puis les bonnes réponses.
function Correction({ reponses, explication }) {
  const triees = [...reponses.filter(r => !r.correct), ...reponses.filter(r => r.correct)]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', marginTop: 6 }}>
      <div className="mm-section-titre" style={{ margin: '4px 4px 0' }}>Correction</div>
      {triees.map(r => (
        <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: '#000' }}>
            <span style={{ color: r.correct ? '#34c759' : '#ff3b30', marginRight: 6 }} aria-label={r.correct ? 'Juste' : 'Faux'}>{r.correct ? '✓' : '✗'}</span>
            {r.libelle}
          </div>
          {!r.correct && <div style={{ fontSize: 14, color: '#ff3b30', marginTop: 6 }}>Ta réponse : {r.choisie}</div>}
          {r.bonne && <div style={{ fontSize: 14, color: '#1d7a33', marginTop: r.correct ? 6 : 2, fontWeight: 600 }}>Bonne réponse : {r.bonne}</div>}
          {explication?.(r.id) && <div style={{ fontSize: 14, color: '#3c3c43', marginTop: 6, lineHeight: 1.45 }}>{explication(r.id)}</div>}
        </div>
      ))}
    </div>
  )
}

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }
  catch { return '' }
}

// Résultat d'un quiz déjà passé, consultable par le collaborateur depuis
// « Mes résultats » : score, thèmes (test de positionnement) et correction.
export function ResultatQuiz({ quiz, resultat, onFermer }) {
  const reponses = (resultat.details || []).map(d => ({ ...d, bonne: d.bonne || quiz.bonne?.(d.id) || '' }))
  const themes = quiz.bilan ? quiz.bilan(resultat) : []
  const aRevoir = themes.filter(t => t.niveau !== 'maitrise')
  const maitrises = themes.filter(t => t.niveau === 'maitrise')
  return (
    <div style={conteneur} role="dialog" aria-modal="true" aria-label={`Résultat — ${quiz.nom}`}>
      <div style={{ ...zone, display: 'flex', justifyContent: 'flex-start' }}>
        <button onClick={onFermer} className="mm-lien">‹ Mes modules</button>
      </div>
      <div style={{ ...zone, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16, paddingBottom: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, background: quiz.degrade }} aria-hidden="true">{quiz.icone}</div>
          <h1 className="mm-titre" style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>{quiz.nom}</h1>
          <div style={{ fontSize: 15, color: '#6e6e73', marginTop: 4 }}>Passé le {fmtDate(resultat.created_at)}</div>
          <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', marginTop: 8 }}>
            {resultat.score}<span style={{ color: '#8e8e93', fontSize: 24 }}> / {resultat.total}</span>
          </div>
        </div>
        {themes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aRevoir.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>À retravailler</div>
                <div style={{ fontSize: 14, color: '#3c3c43', marginTop: 4, lineHeight: 1.5 }}>{aRevoir.map(t => t.nom).join(' · ')}</div>
              </div>
            )}
            {maitrises.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1d7a33' }}>Maîtrisés</div>
                <div style={{ fontSize: 14, color: '#3c3c43', marginTop: 4, lineHeight: 1.5 }}>{maitrises.map(t => t.nom).join(' · ')}</div>
              </div>
            )}
          </div>
        )}
        <Correction reponses={reponses} explication={quiz.explication} />
      </div>
    </div>
  )
}
