import { sbSelect } from './supabase'
import { isTrainerAccount } from './participantNames'

// Les avis (`formation_reports` où trainer_name='__auto_eval__') ne portent
// pas le nom du formateur — seule la fiche de suivi du même collaborateur
// (une autre ligne) le porte. On détermine donc le formateur "propriétaire"
// d'un formé comme celui qui a modifié sa fiche en dernier (même logique que
// mergeFormationReports dans RetourFormationView.js : la fiche est partagée,
// n'importe quel formateur peut écrire dessus, trainer_name reflète juste le
// dernier éditeur).
export async function getFormateurRatings(trainerName) {
  if (!trainerName) return []
  const [ownerRows, ratingRows] = await Promise.all([
    sbSelect('formation_reports', 'trainer_name=neq.__auto_eval__&select=collaborateur,trainer_name,updated_at&order=updated_at.desc'),
    sbSelect('formation_reports', 'trainer_name=eq.__auto_eval__'),
  ])

  const latestTrainerByCollab = {}
  for (const row of (ownerRows || [])) {
    if (!(row.collaborateur in latestTrainerByCollab)) latestTrainerByCollab[row.collaborateur] = row.trainer_name
  }

  return (ratingRows || [])
    .filter(r => r.stats_snapshot?.auto_eval?.rating && !isTrainerAccount(r.collaborateur) && latestTrainerByCollab[r.collaborateur] === trainerName)
    .map(r => ({
      name: r.collaborateur,
      rating: r.stats_snapshot.auto_eval.rating,
      comment: r.stats_snapshot.auto_eval.rating_comment || null,
      week_date: r.week_date,
    }))
    .sort((a, b) => b.week_date.localeCompare(a.week_date))
}
