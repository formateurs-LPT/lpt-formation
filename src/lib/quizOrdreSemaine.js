// Ordre des questions des quiz de journée, mélangé chaque semaine (lundi →
// dimanche). Calculé à partir de la date, sans rien stocker : formateur, TV
// et téléphones obtiennent le même ordre, et le bilan par thème retrouve la
// question d'origine grâce à la date de la réponse (cf. quizThemeMap.js).
function semaineIso(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const jour = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - jour)
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return d.getUTCFullYear() * 100 + Math.ceil(((d - debutAnnee) / 86400000 + 1) / 7)
}

// Générateur pseudo-aléatoire déterministe (mulberry32) : même graine → même suite.
function aleatoire(graine) {
  let a = graine >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ordre[position] = index de la question dans le tableau de base.
// sel : décale la graine pour qu'un autre quiz n'ait pas le même ordre
// (0 pour le Quiz Jour 1, qui garde l'ordre déjà utilisé).
export function ordrePourSemaine(nbQuestions, date = new Date(), sel = 0) {
  const rand = aleatoire(semaineIso(new Date(date)) + sel)
  const ordre = Array.from({ length: nbQuestions }, (_, i) => i)
  for (let i = ordre.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[ordre[i], ordre[j]] = [ordre[j], ordre[i]]
  }
  return ordre
}
