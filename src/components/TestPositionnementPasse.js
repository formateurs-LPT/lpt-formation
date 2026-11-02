'use client'
import { useState } from 'react'
import { preparerTest, enregistrerTestPositionnement, TEST_NOM, TOTAL_QUESTIONS } from '@/lib/testPositionnement'

// Écran plein du test de positionnement côté collaborateur (/mes-modules) :
// une question à la fois, pas de correction pendant le test (c'est un état
// des lieux), le formateur voit le détail par thème dans la fiche.
export default function TestPositionnementPasse({ collaborateurId, prenom, onTermine, onFermer }) {
  const [questions] = useState(() => preparerTest())
  const [etape, setEtape] = useState('intro') // intro | question | envoi | fin | erreur
  const [index, setIndex] = useState(0)
  const [choix, setChoix] = useState(null)
  const [reponses, setReponses] = useState([])
  const [score, setScore] = useState(null)

  const q = questions[index]

  const envoyer = async (toutes) => {
    setEtape('envoi')
    const s = await enregistrerTestPositionnement(collaborateurId, toutes)
    if (s === null) { setEtape('erreur'); return }
    setScore(s)
    setEtape('fin')
    onTermine()
  }

  const valider = () => {
    if (choix === null) return
    const toutes = [...reponses, { id: q.id, theme: q.theme, correct: choix === q.bonneAffichee, choisie: q.affichees[choix] }]
    setReponses(toutes)
    setChoix(null)
    if (index + 1 < questions.length) setIndex(index + 1)
    else envoyer(toutes)
  }

  const conteneur = {
    position: 'fixed', inset: 0, zIndex: 50, background: '#f2f2f7', display: 'flex', flexDirection: 'column',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', 'DM Sans', sans-serif",
    WebkitFontSmoothing: 'antialiased', color: '#000',
    paddingTop: 'max(12px, env(safe-area-inset-top))', paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
  }
  const zone = { width: '100%', maxWidth: 640, margin: '0 auto', padding: '0 16px', boxSizing: 'border-box' }

  if (etape === 'intro') {
    return (
      <div style={conteneur} role="dialog" aria-modal="true" aria-label={TEST_NOM}>
        <div style={{ ...zone, display: 'flex', justifyContent: 'flex-start' }}>
          <button onClick={onFermer} className="mm-lien">Plus tard</button>
        </div>
        <div style={{ ...zone, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, background: 'linear-gradient(180deg, #ffd60a, #ff9f0a)' }} aria-hidden="true">📝</div>
          <h1 className="mm-titre" style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{TEST_NOM}</h1>
          <p style={{ fontSize: 17, color: '#3c3c43', lineHeight: 1.45, margin: 0 }}>
            {prenom ? `${prenom}, ce` : 'Ce'} test fait le point sur tout ce que tu as vu : l&apos;optique, les offres, le remboursement, l&apos;atelier et les verres.
          </p>
          <p style={{ fontSize: 15, color: '#6e6e73', lineHeight: 1.45, margin: 0 }}>
            {TOTAL_QUESTIONS} questions, une réponse à chaque fois. Réponds sans chercher : ce n&apos;est pas un examen, ça sert à choisir avec ton formateur les modules qui t&apos;aideront le plus.
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

  return (
    <div style={conteneur} role="dialog" aria-modal="true" aria-label={TEST_NOM}>
      <div style={{ ...zone, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
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
            <p style={{ fontSize: 16, color: '#3c3c43', lineHeight: 1.45, margin: 0 }}>
              Merci ! Ton formateur va regarder tes résultats avec toi et t&apos;ouvrir les modules qui te seront le plus utiles.
            </p>
            <button onClick={onFermer} className="mm-bouton" style={{ marginTop: 8 }}>Revenir à mes modules</button>
          </>
        )}
      </div>
    </div>
  )
}
