'use client'
// Simulation d'accueil avec Lipto (19/11) — même moteur que les quiz J1/J2
// (QuizJourneeFormateur), en mode simulation : le formateur choisit le
// scénario, puis « Scène suivante » mène à la scène du concept.
import QuizJourneeFormateur from '@/components/modules/QuizJourneeFormateur'
import { SIMULATION_ACCUEIL, SIMULATION_SCENARIOS, SIMULATION_SUITE } from '@/lib/simulationAccueilData'

const sceneSuivante = (idx) => SIMULATION_SUITE[idx] ?? null

export default function ModuleSimulationAccueil({ pName, onBack }) {
  return (
    <QuizJourneeFormateur
      pName={pName} onBack={onBack}
      moduleId="simulation-accueil" quiz={SIMULATION_ACCUEIL} titre="Simulation finale"
      lobbyTitre="Lipto entre en magasin"
      lobbySous="Les collaborateurs répondent sur leur téléphone, vous commentez à l’oral."
      scenarios={SIMULATION_SCENARIOS}
      sceneSuivante={sceneSuivante}
    />
  )
}
