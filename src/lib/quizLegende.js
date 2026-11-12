// Quiz Légende : quiz « niveau expert » demandé par les managers qui trouvent
// les modules trop simples. Même circuit que le test de positionnement : le
// formateur l'ouvre depuis la fiche, le collaborateur le passe sur
// /mes-modules. Questions piégeuses (calculs, cas croisés, exceptions) et
// réponses courtes sans indice ; l'explication n'arrive que dans le récap de
// fin. Une bonne réponse par question : la première de `options`.
import { sbInsert } from '@/lib/supabase'
import { QUIZ_LEGENDE_ID } from '@/lib/modulesApresFormation'
import { preparerQuestions } from '@/lib/testPositionnement'

export const QUIZ_NOM = 'Quiz Légende'

export const QUESTIONS_LEGENDE = [
  // ── Ordonnance et transposition ──
  { id: 'l1', q: 'OD : −5,50 (−2,75) 170°. Le verre est-il fabricable en 10 minutes ?', options: ['Non', 'Oui', 'Oui, en aminci 1.74'],
    explication: 'Non. Transposée en cylindre positif : −5,50 + (−2,75) = −8,25. La sphère passe sous la limite de −8,00.' },
  { id: 'l2', q: 'OD : +9,00 (−2,00) 45°. Le verre est-il fabricable en 10 minutes ?', options: ['Oui', 'Non', 'Seulement après un nouvel examen de vue'],
    explication: 'Oui. Transposée : +9,00 + (−2,00) = +7,00, cylindre +2,00, axe 135°. La sphère rentre sous +7,25 et le cylindre reste sous 3,00.' },
  { id: 'l3', q: 'OD : −2,00 (−3,25) 10°. Le verre est-il fabricable en 10 minutes ?', options: ['Non', 'Oui', 'Oui, une fois transposée'],
    explication: 'Non. Le cylindre (3,25) dépasse déjà 3,00, et sa valeur ne change pas en transposant : inutile de faire le calcul.' },
  { id: 'l4', q: 'Axe d\'origine : 90°. Après transposition, l\'axe devient…', options: ['180°', '0°', '90°', '270°'],
    explication: '180°. Axe inférieur ou égal à 90° : on ajoute 90°. On n\'enlève 90° qu\'au-dessus de 90°.' },
  { id: 'l5', q: 'Transpose : +1,25 (−1,25) 15°.', options: ['0,00 (+1,25) 105°', '+1,25 (+1,25) 105°', '0,00 (−1,25) 105°', '+2,50 (+1,25) 15°'],
    explication: 'Sphère : +1,25 + (−1,25) = 0,00. Cylindre : le − devient + → +1,25. Axe : 15 + 90 = 105°.' },
  { id: 'l6', q: 'Ordonnance : +1,00 (−0,50) 90°, Add +2,00. Quelle est la vision de près ?', options: ['+3,00 (−0,50) 90°', '+3,00 (+1,50) 90°', '+1,00 (+1,50) 90°', '+2,00 (−0,50) 90°'],
    explication: 'L\'addition s\'ajoute à la sphère seulement : +1,00 + 2,00 = +3,00. Le cylindre et l\'axe ne bougent pas.' },
  // ── Verres, traitements et délais ──
  { id: 'l7', q: 'Lequel de ces verres n\'est pas prêt en 10 minutes ?', options: ['Polarisé à la vue', 'Transition à la vue', 'Polarisé en plan', 'Clariteens'],
    explication: 'Le polarisé à la vue demande 9 jours. Le Transition (avec ou sans correction), le polarisé en plan et les Clariteens sont prêts en 10 minutes.' },
  { id: 'l8', q: 'Une cliente part demain et veut des solaires à sa vue, verres bleus. Que lui propose-t-on ?', options: ['UV Protect gris ou brun, à sa vue', 'UV Protect bleu, à sa vue', 'Polarisé bleu, à sa vue', 'Rien : pas de solaires à la vue'],
    explication: 'À la vue, l\'UV Protect et le polarisé existent seulement en gris ou en brun ; les couleurs, c\'est en plan. L\'UV Protect à la vue est prêt en 10 minutes, le polarisé à la vue en 9 jours.' },
  { id: 'l9', q: 'Dans le back-end, notre verre Transition s\'appelle…', options: ['Solarisation', 'Photochromic', 'Premium UV', 'Digital Protect Pro Sun'],
    explication: 'Transition sur le téléphone de vente, Solarisation dans le back-end : c\'est le même verre.' },
  { id: 'l10', q: 'Une cliente forte myope veut le verre le plus fin possible. Que fait le vendeur ?', options: ['Rien de particulier', 'Il sélectionne le 1.74', 'Il sélectionne le 1.67', 'Il ajoute un supplément aminci'],
    explication: 'Le logiciel choisit automatiquement l\'aminci adapté à la correction (1.5, 1.6, 1.67 ou 1.74). Le vendeur ne sélectionne rien.' },
  { id: 'l11', q: 'Dans quel cas part-on sur un verre Basic ?', options: ['Paire à 10 €, ou pas de budget pour le 1=1', 'Petite correction', 'Deuxième paire du 1=1', 'Verres pour enfant'],
    explication: 'Dans le 1=1, tous les traitements sont compris sur les deux paires : on part toujours sur le Digital Protect Pro. Le Basic, c\'est seulement la paire à 10 € ou un client sans budget pour le 1=1.' },
  // ── Progressif, proximité, Zen Protect, Clariteens ──
  { id: 'l12', q: 'Un client de 44 ans, Add +0,75 sur l\'ordonnance, a les yeux fatigués sur écran le soir. Le Zen Protect est-il le bon verre ?', options: ['Non', 'Oui', 'Oui, en deuxième paire'],
    explication: 'Non. L\'Add montre qu\'il est presbyte, et le Zen Protect ne corrige pas la presbytie : on part sur un progressif ou un verre de proximité.' },
  { id: 'l13', q: 'Un violoniste presbyte, qui conduit tous les jours, vient pour un 1=1. Quelle combinaison ?', options: ['Progressif + proximité', 'Deux verres de proximité', 'Zen Protect + progressif', 'Progressif + paire à 10 € de loin'],
    explication: 'Le progressif pour tout le quotidien, conduite comprise. La proximité (intermédiaire + près) pour la partition et les mains. La proximité ne corrige pas le loin, et elle entre dans le 1=1.' },
  { id: 'l14', q: 'En 1=1, un client veut ses deux progressifs en option Express. Quel supplément ?', options: ['+150 €', 'Aucun', '+90 €', '+180 €'],
    explication: 'En 1=1, l\'option Express coûte +90 € pour une paire et +150 € pour les deux.' },
  { id: 'l15', q: 'Dans le parcours Suprême, lequel demande un supplément ?', options: ['Aucun des trois', 'Les Clariteens', 'Le Zen Protect', 'L\'option Express'],
    explication: 'Clariteens, Zen Protect et option Express sont tous compris dans le Suprême, sans supplément.' },
  { id: 'l16', q: 'Pulsar Next sans option, ou option Express : où et en combien de temps ?', options: ['Pulsar Next : Rodenstock, 9 jours · Express : labo de Paris, 24/48 h', 'Les deux : labo de Paris, 24/48 h', 'Pulsar Next : 10 minutes · Express : 9 jours', 'Les deux : Rodenstock, 9 jours'],
    explication: 'Le Pulsar Next est fabriqué par Rodenstock, en Allemagne, en 9 jours. L\'option Express (Origine France Garantie) est fabriquée dans notre labo de Paris, livrée en 24/48 h.' },
  { id: 'l17', q: 'Un enfant de 8 ans en Clariteens ne porte ses lunettes que pour lire le tableau. Que dit-on aux parents ?', options: ['Qu\'il doit les porter toute la journée', 'Que c\'est suffisant', 'Qu\'il doit les porter uniquement sur écran', 'Qu\'il vaut mieux passer au Zen Protect'],
    explication: 'L\'effet freinateur demande au moins 12 heures de port par jour, du lever au coucher. Avec un port aussi court, il est très réduit.' },
  { id: 'l18', q: 'Sur un verre Clariteens, où sont placées les microlentilles ?', options: ['Autour de la zone centrale', 'Au centre du verre', 'En bas du verre', 'Sur toute la face avant, bien visibles'],
    explication: 'Autour de la zone centrale, qui corrige la myopie comme un verre classique. Elles sont invisibles à l\'œil nu.' },
  // ── Troisième paire et offres ──
  { id: 'l19', q: 'Un 1=1 est intégralement pris en charge. Le client ajoute la paire à 10 € en unifocal de près. Combien paie-t-il au total ?', options: ['8 €', '0 €', '10 €', '18 €'],
    explication: 'Ses deux paires du 1=1 lui reviennent à 0 €. La paire à 10 € prise en troisième paire a 20 % de remise : 8 €.' },
  { id: 'l20', q: 'Laquelle de ces troisièmes paires est possible avec la remise ?', options: ['Une solaire en plan, monture + verres, pour sa fille', 'Une paire à la vue de sa femme', 'Une solaire prémontée', 'Une paire à une autre correction que la sienne'],
    explication: 'La troisième paire est à la correction du client ou en plan ; en plan, elle peut être pour quelqu\'un d\'autre. Jamais à la vue d\'une autre personne, et un prémonté compte comme une simple monture : pas de remise.' },
  { id: 'l21', q: 'Jusqu\'à quand la remise de troisième paire est-elle valable ?', options: ['Jusqu\'au retrait de la paire principale', 'Le jour de la vente uniquement', '30 jours', 'Jusqu\'au paiement'],
    explication: 'Jusqu\'au retrait de la paire principale, souvent le jour même en unifocal : d\'où l\'intérêt de la proposer le jour de la vente.' },
  // ── Remboursement et Granit ──
  { id: 'l22', q: 'LPT Santé répond « remboursement trop faible ». Que fait-on ?', options: ['1=1 100 % Santé', 'Un Granit', 'Suprême quand même', 'On rappelle la mutuelle'],
    explication: 'La mutuelle a déjà répondu : le Suprême n\'est pas pris en charge pour ce forfait. Granit n\'y changera rien. Granit, c\'est pour « non réalisable ».' },
  { id: 'l23', q: 'Granit répond « Remb. accordé sous le tarif plancher — Classe B ». Que fait-on ?', options: ['1=1 100 % Santé', 'Suprême', 'On relance un Granit', 'On demande à Granit la classe A'],
    explication: 'Accordé sous le tarif plancher, c\'est trop faible pour le Suprême : on passe en 1=1 100 % Santé.' },
]

/** Enregistre le quiz terminé. reponses : [{ id, correct, choisie }]. */
async function enregistrerQuizLegende(collaborateurId, reponses) {
  const score = reponses.filter(r => r.correct).length
  const ok = await sbInsert('module_resultats', {
    collaborateur_id: collaborateurId, module_id: QUIZ_LEGENDE_ID, type: 'legende',
    score, total: reponses.length, reussi: null,
    details: reponses.map(r => {
      const q = QUESTIONS_LEGENDE.find(x => x.id === r.id)
      return { id: r.id, correct: !!r.correct, libelle: q?.q || '', bonne: q?.options[0] || '', choisie: String(r.choisie || '').slice(0, 300) }
    }),
  })
  return ok ? score : null
}

/** Dernier quiz passé, parmi les lignes de module_resultats du collaborateur. */
export function dernierQuizLegende(resultats) {
  const quiz = (resultats || []).filter(r => r.module_id === QUIZ_LEGENDE_ID && r.type === 'legende')
  return quiz.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] || null
}

export const explicationLegende = id => QUESTIONS_LEGENDE.find(q => q.id === id)?.explication || ''

export const QUIZ_LEGENDE = {
  id: QUIZ_LEGENDE_ID,
  nom: QUIZ_NOM,
  icone: '🏆',
  degrade: 'linear-gradient(180deg, #bf5af2, #5e5ce6)',
  total: QUESTIONS_LEGENDE.length,
  preparer: () => preparerQuestions(QUESTIONS_LEGENDE),
  enregistrer: enregistrerQuizLegende,
  intro: prenom => `${prenom ? `${prenom}, ce` : 'Ce'} quiz est réservé aux experts : calculs, cas pièges et exceptions sur tout ce que tu connais.`,
  consigne: total => `${total} questions, une seule bonne réponse à chaque fois. Prends le temps de réfléchir : la correction complète t'attend à la fin.`,
  corrige: true,
}
