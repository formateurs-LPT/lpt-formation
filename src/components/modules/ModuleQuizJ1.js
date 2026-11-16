'use client'
// Quiz Jour 1 — écran formateur commun (QuizJourneeFormateur.js)
import QuizJourneeFormateur from '@/components/modules/QuizJourneeFormateur'
import { QUIZ_J1 } from '@/lib/quizJ1Data'

export default function ModuleQuizJ1({ pName, onBack }) {
  return (
    <QuizJourneeFormateur
      pName={pName} onBack={onBack}
      moduleId="quiz-j1" quiz={QUIZ_J1} titre="Quiz Jour 1"
      lobbyTitre={<>Les fondamentaux de l&apos;optique</>}
      lobbySous="Entreprise · Optique · Ordonnances · Types de verres · Montures"
    />
  )
}
