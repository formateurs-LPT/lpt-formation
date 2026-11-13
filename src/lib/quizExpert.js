// Quiz « expert » (Quiz Légende, Tyé un tigre ?) : même circuit que le test
// de positionnement. Le formateur l'ouvre depuis la fiche, le collaborateur le
// passe sur /mes-modules, sans correction pendant le quiz ; la correction
// expliquée arrive à la fin et reste consultable dans « Mes résultats ».
// Questions : { id, theme, q, options, explication }, la bonne réponse est la
// première de `options` (l'ordre est mélangé à l'affichage). Le résultat est
// une ligne de module_resultats avec module_id = type = id du quiz.
import { sbInsert } from '@/lib/supabase'
import { preparerQuestions } from '@/lib/testPositionnement'

export function creerQuizExpert({ id, nom, icone, degrade, description, questions, intro, consigne }) {
  const explication = qid => questions.find(q => q.id === qid)?.explication || ''

  const enregistrer = async (collaborateurId, reponses) => {
    const score = reponses.filter(r => r.correct).length
    const ok = await sbInsert('module_resultats', {
      collaborateur_id: collaborateurId, module_id: id, type: id,
      score, total: reponses.length, reussi: null,
      details: reponses.map(r => {
        const q = questions.find(x => x.id === r.id)
        return { id: r.id, correct: !!r.correct, libelle: q?.q || '', bonne: q?.options[0] || '', choisie: String(r.choisie || '').slice(0, 300) }
      }),
    })
    return ok ? score : null
  }

  const dernier = resultats => (resultats || [])
    .filter(r => r.module_id === id && r.type === id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] || null

  return {
    id, nom, icone, degrade, description, questions,
    total: questions.length,
    preparer: () => preparerQuestions(questions),
    enregistrer,
    intro,
    consigne: consigne || (total => `${total} questions, une seule bonne réponse à chaque fois. Prends le temps de réfléchir : la correction complète t'attend à la fin.`),
    corrige: true,
    dernier,
    explication,
  }
}
