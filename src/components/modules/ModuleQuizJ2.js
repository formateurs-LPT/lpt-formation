'use client'
// Quiz Jour 2 — écran formateur commun (QuizJourneeFormateur.js), même style
// et même déroulé que le Quiz Jour 1 (16/11).
import QuizJourneeFormateur from '@/components/modules/QuizJourneeFormateur'
import { QUIZ_J2 } from '@/lib/quizJ2Data'

export default function ModuleQuizJ2({ pName, onBack }) {
  return (
    <QuizJourneeFormateur
      pName={pName} onBack={onBack}
      moduleId="quiz-j2" quiz={QUIZ_J2} titre="Quiz Jour 2"
      lobbyTitre="Les offres et la vente"
      lobbySous={<>Trame d&apos;accueil · Offre 1=1 · Offre Classique · Pack Plan · Ordonnances</>}
    />
  )
}
