import { VISION_MULTI_OPTIONS } from './modulesData'

export { VISION_MULTI_OPTIONS }

/** Encode une sélection (tableau de labels) en chaîne canonique stockable dans open_answers.answer */
export function encodeVisionAnswer(selected) {
  return [...(selected || [])]
    .filter(v => VISION_MULTI_OPTIONS.includes(v))
    .sort()
    .join('|')
}

/** Décode la chaîne canonique en tableau de labels */
export function decodeVisionAnswer(str) {
  return (str || '')
    .split('|')
    .map(s => s.trim())
    .filter(s => VISION_MULTI_OPTIONS.includes(s))
}

/** Deux sélections sont-elles exactement identiques ? */
export function sameVisionAnswer(a, b) {
  const sa = encodeVisionAnswer(a)
  const sb = encodeVisionAnswer(b)
  return sa.length > 0 && sa === sb
}
