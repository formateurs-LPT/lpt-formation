// Atelier de simulations Lipto (23/11).
// Un projet = un ensemble de cases reliées entre elles (un arbre, avec des
// chemins qui peuvent se rejoindre). Chaque « départ » est un scénario que le
// formateur peut lancer.
//
// Les projets sont enregistrés dans Supabase et partagés entre les formateurs
// qui ont accès à l'atelier (cf. atelierSimulationApi.js).
import { ORDONNANCE_LIPTO, TICKET_LIPTO } from '@/lib/simulationAccueilData'
import { getTrainerAvatarKey } from '@/lib/constants'

export const TYPES_CASE = {
  depart: { nom: 'Départ du scénario', emoji: '🚩', couleur: '#03112a', sorties: () => ['Lipto entre'] },
  lipto: { nom: 'Lipto parle', emoji: '🗨️', couleur: '#7c5cff', sorties: () => ['Ensuite'] },
  question: { nom: 'Question aux collaborateurs', emoji: '❓', couleur: '#00abe9', sorties: () => ['Après la correction'] },
  choix: { nom: 'Choix du formateur', emoji: '🎭', couleur: '#c9a227', sorties: c => (c.repliques || []).map((r, i) => r.texte || `Réplique ${i + 1}`) },
  examen: { nom: 'Examen de vue', emoji: '👁️', couleur: '#16a34a', sorties: () => ['Lipto revient'] },
  fin: { nom: 'Fin', emoji: '🏁', couleur: '#64748b', sorties: () => [] },
}
// Ordre proposé dans le menu « + Ajouter la suite »
export const TYPES_AJOUTABLES = ['lipto', 'question', 'choix', 'examen', 'fin']

export const FONDS = [
  { src: '/assets/magasins/magasin-allee.webp', nom: 'Allée' },
  { src: '/assets/magasins/magasin-comptoir.webp', nom: 'Comptoir' },
  { src: '/assets/magasins/magasin-tables.webp', nom: 'Tables' },
  { src: '/assets/magasins/magasin-10-minutes.webp', nom: '10 minutes' },
  { src: '/assets/magasins/vitrine-montures.webp', nom: 'Vitrine' },
  { src: '/assets/magasins/salle-examen.webp', nom: 'Salle d’examen' },
]
export const POSES = ['bienvenue', 'reflexion', 'pouce', 'bravo', 'surpris', 'encouragement', 'neutre', 'trophee']
export const NOMS_POSES = { bienvenue: 'Bonjour', reflexion: 'Réfléchit', pouce: 'Pouce', bravo: 'Bravo', surpris: 'Surpris', encouragement: 'Encourage', neutre: 'Attend', trophee: 'Trophée' }

export const nouvelId = () => 'c' + Math.random().toString(36).slice(2, 9)

const VIDE_ORDO = { patient: 'LIPTO', date: '', od: { sph: '', cyl: '', axe: '', add: '' }, og: { sph: '', cyl: '', axe: '', add: '' } }
const VIDE_TICKET = { ...TICKET_LIPTO, date: '', heure: '', od: { sph: '', cyl: '', axe: '', add: '' }, og: { sph: '', cyl: '', axe: '', add: '' }, pd: '', npd: '' }

// Tests de vue prêts à l'emploi : vrais tickets du magasin de Bordeaux,
// seul le nom est fictif (LIPTO). Un clic les recopie dans la case.
export const TESTS_DE_VUE = [
  { id: 'ticket-lipto', nom: 'Sans addition', info: '23/11 · 10:04', ticket: { ...TICKET_LIPTO, od: { ...TICKET_LIPTO.od, add: '' }, og: { ...TICKET_LIPTO.og, add: '' }, npd: '' } },
  {
    id: 'ticket-addition', nom: 'Avec addition (+2,00)', info: '23/11 · 10:06',
    ticket: {
      nom: 'LIPTO', date: '23/11/2026', heure: '10:06 am', wd: '40cm',
      od: { sph: '+ 1.50', cyl: '+ 0.50', axe: '40°', add: '+ 2.00' },
      og: { sph: '+ 1.50', cyl: '+ 0.25', axe: '180°', add: '+ 2.00' },
      pd: '64.0', npd: '60.0', magasin: ['LUNETTES POUR TOUS', 'BORDEAUX'],
    },
  },
]
export const documentVide = genre => JSON.parse(JSON.stringify(genre === 'ticket' ? VIDE_TICKET : VIDE_ORDO))

export function nouvelleCase(type) {
  const base = { id: nouvelId(), type, suites: [] }
  if (type === 'depart') return { ...base, nom: 'Nouveau scénario', suites: [null] }
  if (type === 'lipto') return { ...base, bulle: '', pose: 'reflexion', fond: FONDS[1].src, document: null, suites: [null] }
  if (type === 'question') return {
    ...base, mode: 'qcm', bulle: '', pose: 'reflexion', fond: FONDS[1].src, document: null,
    question: '', options: [{ texte: '', juste: false }, { texte: '', juste: false }, { texte: '', juste: false }],
    reponseAttendue: '', motsAttendus: '', temps: 60,
    repliqueCorrection: '', poseCorrection: 'pouce', fondCorrection: '', explication: '', suites: [null],
  }
  if (type === 'choix') return { ...base, repliques: [{ texte: '' }, { texte: '' }], suites: [null, null] }
  if (type === 'examen') return { ...base, duree: 4, suites: [null] }
  return { ...base, message: '' }
}

export function nouveauProjet(auteur) {
  const depart = nouvelleCase('depart')
  depart.nom = 'Scénario 1'
  const maintenant = new Date().toISOString()
  return { id: nouvelId(), titre: 'Nouvelle simulation', auteur, creeLe: maintenant, majLe: maintenant, majPar: auteur, statut: 'brouillon', cases: { [depart.id]: depart } }
}

// ── Problèmes à régler avant de passer un projet en « Prêt » ──
// Case placée juste après un choix du formateur : sans phrase à elle, Lipto
// y dit la réplique choisie
export const estApresChoix = (cases, id) => Object.values(cases).some(x => x.type === 'choix' && x.suites.includes(id))

export function problemesCase(c, apresChoix = false) {
  const p = []
  if (c.type === 'lipto' && !c.bulle?.trim() && !apresChoix) p.push('Lipto ne dit rien')
  if (c.type === 'question') {
    if (!c.question?.trim()) p.push('Question vide')
    if (c.mode === 'qcm') {
      if (c.options.some(o => !o.texte.trim())) p.push('Réponse vide')
      if (!c.options.some(o => o.juste)) p.push('Aucune bonne réponse')
    } else if (!c.reponseAttendue?.trim()) p.push('Réponse attendue vide')
  }
  if (c.type === 'choix' && c.repliques.some(r => !r.texte.trim())) p.push('Réplique vide')
  return p
}
export function bilanProjet(projet) {
  const cases = Object.values(projet.cases)
  const suitesManquantes = cases.reduce((n, c) => n + c.suites.filter(s => !s || !projet.cases[s]).length, 0)
  const problemes = cases.reduce((n, c) => n + problemesCase(c, estApresChoix(projet.cases, c.id)).length, 0)
  return { nbCases: cases.length, suitesManquantes, problemes }
}

// ── Mise en page automatique de l'arbre (de gauche à droite) ──
export const LARGEUR_CASE = 270
export const HAUT_ENTETE = 86
export const HAUT_SORTIE = 34
const ECART_COLONNE = 120, ECART_LIGNE = 26, ECART_SCENARIO = 70

export const hauteurCase = c => HAUT_ENTETE + Math.max(c.suites.length, 0) * HAUT_SORTIE + 10
export const ySortie = (pos, i) => pos.y + HAUT_ENTETE + i * HAUT_SORTIE + HAUT_SORTIE / 2

export function miseEnPage(projet) {
  const { cases } = projet
  const pos = {}
  const placer = (id, prof, y) => {
    const c = cases[id]
    if (!c || pos[id]) return 0
    const h = hauteurCase(c)
    pos[id] = { x: prof * (LARGEUR_CASE + ECART_COLONNE), y }
    let hEnfants = 0
    for (const s of c.suites) {
      if (!s || pos[s] || !cases[s]) continue
      if (hEnfants) hEnfants += ECART_LIGNE
      hEnfants += placer(s, prof + 1, y + hEnfants)
    }
    // La case se centre sur ses suites
    if (hEnfants > h) pos[id].y = y + (hEnfants - h) / 2
    return Math.max(h, hEnfants)
  }
  let y = 0
  const departs = Object.values(cases).filter(c => c.type === 'depart')
  for (const d of departs) y += placer(d.id, 0, y) + ECART_SCENARIO
  // Cases qui ne sont reliées à rien : rangées en bas
  for (const c of Object.values(cases)) {
    if (!pos[c.id]) y += placer(c.id, 1, y) + ECART_LIGNE
  }
  return pos
}

// ── Accès (23/11) : Kevin et Thomas seulement pour l'instant ──
// Les autres formateurs voient l'atelier dans le menu, avec un message.
// Quentin sera sans doute ajouté bientôt : sur demande de Kevin uniquement.
export const ACCES_ATELIER = ['kevin', 'thomas']
export const peutUtiliserAtelier = pName => ACCES_ATELIER.includes(getTrainerAvatarKey(pName))

// ── Import de la Simulation finale actuelle (simulationAccueilData.js) ──
export function projetSimulationActuelle(auteur) {
  const c = {}
  const ajoute = obj => { c[obj.id] = obj; return obj.id }
  const q = (o) => ({ ...nouvelleCase('question'), ...o })
  const qcm = (textes, justes) => textes.map((texte, i) => ({ texte, juste: justes.includes(i) }))

  const ticket = ajoute({ ...nouvelleCase('lipto'), id: 'ticket', bulle: 'C’est fait ! Voici mon ticket.', pose: 'bienvenue', fond: FONDS[5].src, document: { genre: 'ticket', ...TICKET_LIPTO } })
  const examen = ajoute({ ...nouvelleCase('examen'), id: 'examen', suites: [ticket] })
  const sansOrdo = (id, texte) => ajoute(q({
    id, bulle: texte, pose: 'reflexion', fond: FONDS[2].src, question: 'Que lui répondez-vous ?',
    options: qcm(['Je ne peux rien pour vous, malheureusement.', 'Je peux vous proposer un examen de vue gratuit.', 'Revenez avec une ordonnance dans ce cas ?'], [1]),
    repliqueCorrection: 'Super, allons-y !', poseCorrection: 'pouce', fondCorrection: FONDS[5].src, suites: [examen],
  }))
  const lectureOrdo = ajoute(q({
    id: 'lecture-ordo', bulle: 'J’ai une ordonnance, la voici !', pose: 'bienvenue', fond: FONDS[1].src,
    document: { genre: 'ordonnance', ...ORDONNANCE_LIPTO }, question: 'Quels sont les problèmes visuels de Lipto ?',
    options: qcm(['Myope et astigmate', 'Hypermétrope, astigmate et presbyte', 'Myope, astigmate et presbyte', 'Astigmate et presbyte'], [2]),
  }))
  const remboursement = ajoute({ ...nouvelleCase('lipto'), id: 'remboursement', bulle: 'Mon dernier remboursement doit dater de deux ans, je crois.', fond: FONDS[1].src })
  const sansRemb = ajoute({ ...nouvelleCase('lipto'), id: 'sans-remb', bulle: 'Je veux juste des lunettes, sans me faire rembourser.', fond: FONDS[4].src })
  const concept = (id, bulle, question, repliques) => {
    const choix = ajoute({ ...nouvelleCase('choix'), id: id + '-choix', repliques: repliques.map(([texte]) => ({ texte })), suites: repliques.map(([, s]) => s) })
    return ajoute(q({
      id, mode: 'texte', bulle, pose: 'reflexion', fond: FONDS[3].src, question,
      reponseAttendue: 'Vos lunettes en seulement 10 minutes, avec ou sans ordonnance', motsAttendus: '10 minutes, avec ou sans, ordonnance', temps: 90, suites: [choix],
    }))
  }
  const trame = 'Complétez : « Notre concept est simple : vous avez la possibilité d’avoir… »'

  const s1Concept = concept('s1-concept', 'Non, je ne connais pas votre concept.', trame, [
    ['Comment ça se passe ? Je n’ai pas d’ordonnance.', sansOrdo('s1-sans-ordo', 'Comment ça se passe ? Je n’ai pas d’ordonnance.')],
    ['J’ai une ordonnance, la voici !', lectureOrdo],
  ])
  const s1 = ajoute(q({
    id: 's1', bulle: 'Bonjour, je regarde juste, merci.', pose: 'bienvenue', fond: FONDS[0].src, question: 'Que lui répondez-vous ?',
    options: qcm(['Aucun problème !', 'Je peux quand même vous renseigner ?', 'Est-ce que vous connaissez le concept ?', 'Avez-vous une ordonnance ?'], [2]),
    repliqueCorrection: 'Hmm… votre concept ? C’est-à-dire ?', fondCorrection: FONDS[2].src,
    explication: 'A — On laisse le client seul, sans aucune information.\nB — Le client répond presque toujours « non merci ».\nC — La question attise sa curiosité : il a envie de savoir.\nD — Parler d’ordonnance d’entrée risque de le braquer.',
    suites: [s1Concept],
  }))
  const s2Choix = ajoute({ ...nouvelleCase('choix'), id: 's2-choix', repliques: [{ texte: 'J’ai une ordonnance, la voici !' }, { texte: 'Mon dernier remboursement doit dater de deux ans, je crois.' }], suites: [lectureOrdo, remboursement] })
  const s2 = ajoute(q({
    id: 's2', bulle: 'Je viens renouveler mes lunettes.', pose: 'bienvenue', fond: FONDS[1].src, question: 'Que lui répondez-vous ?',
    options: qcm(['À quand remonte votre dernier remboursement ?', 'Je vous laisse alors regarder les montures.', 'Très bien ! Avez-vous une ordonnance ?', 'Je vais vous inscrire en examen de vue.'], [0, 2]),
    suites: [s2Choix],
  }))
  const s3 = concept('s3', 'Bonjour, comment fonctionnez-vous ?', trame, [
    ['Très bien ! Je n’ai pas d’ordonnance, comment ça se passe ?', sansOrdo('s3-sans-ordo', 'Très bien ! Je n’ai pas d’ordonnance, comment ça se passe ?')],
    ['Je veux juste des lunettes, sans me faire rembourser.', sansRemb],
  ])
  c[s3].pose = 'bienvenue'

  const departs = [['Scénario 1 · Je regarde juste', s1], ['Scénario 2 · Renouveler mes lunettes', s2], ['Scénario 3 · Comment fonctionnez-vous ?', s3]]
  const avecDeparts = {}
  departs.forEach(([nom, s], i) => { const id = 'depart-' + (i + 1); avecDeparts[id] = { id, type: 'depart', nom, suites: [s] } })
  const maintenant = new Date().toISOString()
  return { id: nouvelId(), titre: 'Simulation finale (version actuelle)', auteur, creeLe: maintenant, majLe: maintenant, majPar: auteur, statut: 'brouillon', cases: { ...avecDeparts, ...c } }
}
