import { VISION_MULTI_OPTIONS } from './modulesData'

export { VISION_MULTI_OPTIONS }

/**
 * Options paramétrables (2e argument) pour couvrir les différentes questions
 * à choix multiples du jeu des questions — ex: symptômes ("Ce client voit :")
 * vs troubles ("Quels sont les problèmes de vue ?") — sans quoi une option
 * hors de la liste par défaut serait silencieusement filtrée.
 */

/** Encode une sélection (tableau de labels) en chaîne canonique stockable dans open_answers.answer */
export function encodeVisionAnswer(selected, options = VISION_MULTI_OPTIONS) {
  return [...(selected || [])]
    .filter(v => options.includes(v))
    .sort()
    .join('|')
}

/** Décode la chaîne canonique en tableau de labels */
export function decodeVisionAnswer(str, options = VISION_MULTI_OPTIONS) {
  return (str || '')
    .split('|')
    .map(s => s.trim())
    .filter(s => options.includes(s))
}

/** Deux sélections sont-elles exactement identiques ? */
export function sameVisionAnswer(a, b, options = VISION_MULTI_OPTIONS) {
  const sa = encodeVisionAnswer(a, options)
  const sb = encodeVisionAnswer(b, options)
  return sa.length > 0 && sa === sb
}
