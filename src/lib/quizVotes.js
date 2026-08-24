/**
 * Compte les votes par option pour le graphique en barres formateur/diffuseur.
 * Sur une question `qcm-multi`, answer_idx est un bitmask (bit i = option i
 * cochée, voir QuizMultiSelect dans ParticipantModuleView.js) — une seule
 * égalité stricte (`answer_idx === i`) ne comptait alors que le premier choix
 * de chaque participant. Sur les autres types, answer_idx reste un index
 * simple.
 */
export function countVotesPerOption(rows, optionsLength, isMultiSelect) {
  return Array.from({ length: optionsLength }, (_, i) =>
    (rows || []).filter(r => isMultiSelect
      ? ((r.answer_idx ?? 0) & (1 << i)) !== 0
      : r.answer_idx === i
    ).length
  )
}
