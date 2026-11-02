// Test de positionnement : état des lieux des connaissances d'un collaborateur
// déjà en magasin, sur tous les thèmes de la formation initiale et des
// modules complémentaires. Le formateur l'ouvre depuis la fiche (comme un
// module), le collaborateur le passe sur /mes-modules, et le résultat donne
// les thèmes à retravailler avec les modules à lui ouvrir.
//
// Les questions reprennent des contenus déjà validés dans les modules (aucun
// des points encore « à trancher » de la relecture). Une bonne réponse par
// question : la première de `options` (l'ordre est mélangé à l'affichage).
import { sbInsert } from '@/lib/supabase'
import { MODULES, TEST_POSITIONNEMENT_ID } from '@/lib/modulesApresFormation'

export const TEST_ID = TEST_POSITIONNEMENT_ID
export const TEST_NOM = 'Test de positionnement'

// modules : les modules complémentaires de l'app qui travaillent ce thème.
export const THEMES = [
  { id: 'entreprise', nom: 'LPT et la promesse 10 minutes', formation: 'initiale', modules: [] },
  { id: 'troubles', nom: 'Les troubles de la vue', formation: 'initiale', modules: [] },
  { id: 'ordonnance', nom: 'Lire une ordonnance', formation: 'initiale', modules: ['transposition'] },
  { id: 'unifocal-progressif', nom: 'Unifocal ou progressif', formation: 'initiale', modules: ['progressif'] },
  { id: 'montures', nom: 'Les matières de montures', formation: 'initiale', modules: [] },
  { id: 'trame-accueil', nom: 'La trame d\'accueil', formation: 'initiale', modules: [] },
  { id: 'offres', nom: 'Les offres LPT', formation: 'initiale', modules: ['troisieme-paire'] },
  { id: 'prise-mesures', nom: 'La prise de mesures', formation: 'initiale', modules: [] },
  { id: 'remboursement', nom: 'Le remboursement', formation: 'initiale', modules: ['granit'] },
  { id: 'tiers-payant', nom: 'Le tiers payant et LPT Santé', formation: 'initiale', modules: ['granit'] },
  { id: 'retraits', nom: 'Les retraits', formation: 'initiale', modules: [] },
  { id: 'ajustages', nom: 'Les ajustages', formation: 'initiale', modules: [] },
  { id: 'raz', nom: 'Les RAZ', formation: 'initiale', modules: [] },
  { id: 'montage', nom: 'Le montage en 10 minutes', formation: 'initiale', modules: [] },
  { id: 'outlet', nom: 'Les montures outlet', formation: 'initiale', modules: [] },
  { id: 'proximite', nom: 'Le verre de proximité', formation: 'complementaire', modules: ['proximite'] },
  { id: 'clariteens', nom: 'Les verres Clariteens', formation: 'complementaire', modules: ['clariteens'] },
  { id: 'zenprotect', nom: 'Le verre Zen Protect', formation: 'complementaire', modules: ['zenprotect'] },
  { id: 'traitements', nom: 'Les traitements de verres', formation: 'complementaire', modules: ['traitements'] },
  { id: 'progressif', nom: 'Convaincre avec le progressif', formation: 'complementaire', modules: ['progressif'] },
  { id: 'troisieme-paire', nom: 'La troisième paire', formation: 'complementaire', modules: ['troisieme-paire'] },
  { id: 'transposition', nom: 'La transposition', formation: 'complementaire', modules: ['transposition'] },
  { id: 'granit', nom: 'Faire un Granit', formation: 'complementaire', modules: ['granit'] },
]

export const QUESTIONS = [
  // ── Formation initiale ──
  { id: 'e1', theme: 'entreprise', q: 'Quelle est la promesse de Lunettes Pour Tous ?', options: ['Des lunettes de vue prêtes en 10 minutes, avec ou sans ordonnance', 'Des lunettes livrées à domicile en 48 heures', 'Des lunettes sur mesure en une semaine'] },
  { id: 'e2', theme: 'entreprise', q: 'D\'où viennent nos prix bas ?', options: ['De notre modèle : stocks, volume, notre propre marque et zéro intermédiaire', 'De verres de moins bonne qualité', 'De promotions toute l\'année'] },
  { id: 't1', theme: 'troubles', q: 'Un client voit bien de près mais flou de loin. De quel trouble s\'agit-il ?', options: ['La myopie', 'La presbytie', 'L\'astigmatisme'] },
  { id: 't2', theme: 'troubles', q: 'Un client de 48 ans éloigne son téléphone pour lire ses messages. À quoi pense-t-on ?', options: ['À la presbytie', 'À la myopie', 'À l\'astigmatisme'] },
  { id: 'o1', theme: 'ordonnance', q: 'Sur une ordonnance, que signifie « Add » ?', options: ['L\'addition : le client est presbyte', 'L\'axe du cylindre', 'L\'astigmatisme'] },
  { id: 'o2', theme: 'ordonnance', q: 'Sphère −3,00 et Add +1,50 : quelle est la vision de près ?', options: ['−1,50', '−4,50', '+1,50'] },
  { id: 'u1', theme: 'unifocal-progressif', q: 'Un client de 30 ans, myope, lit sans difficulté. Quel verre lui proposer ?', options: ['Un verre unifocal', 'Un verre progressif', 'Un verre de proximité'] },
  { id: 'm1', theme: 'montures', q: 'Un enfant casse souvent ses lunettes et ses parents ont un petit budget. Quelle matière conseiller ?', options: ['L\'injecté', 'L\'acétate', 'Le métal très fin'] },
  { id: 'm2', theme: 'montures', q: 'Une cliente est allergique au nickel. Quelle matière évite-t-on ?', options: ['Le métal', 'L\'acétate', 'L\'injecté'] },
  { id: 'a1', theme: 'trame-accueil', q: 'Un client entre dans le magasin. Que fait-on en premier ?', options: ['On l\'accueille : « Bonjour et bienvenue chez Lunettes Pour Tous »', 'On lui demande son ordonnance', 'On le laisse regarder les montures'] },
  { id: 'of1', theme: 'offres', q: 'Dans l\'offre 1=1, la deuxième paire est…', options: ['Offerte, de même qualité, tous traitements compris', 'À −50 %', 'Forcément une paire solaire'] },
  { id: 'of2', theme: 'offres', q: 'Un client a la Complémentaire Santé Solidaire (CSS) et une ordonnance valable. Quel parcours ?', options: ['Le 1=1 100 % Santé', 'Le Suprême', 'Le parcours classique'] },
  { id: 'p1', theme: 'prise-mesures', q: 'Que mesure-t-on avec LPTVISION ?', options: ['L\'écart pupillaire et la hauteur', 'La correction du client', 'La taille de la monture'] },
  { id: 'p2', theme: 'prise-mesures', q: 'Quel est le bon réflexe avant de prendre les mesures ?', options: ['Ajuster la monture choisie, client debout et bien droit', 'Prendre les mesures, puis ajuster la monture', 'Reprendre les mesures de son ancien opticien'] },
  { id: 'r1', theme: 'remboursement', q: 'Pour un client de 50 ans, combien de temps une ordonnance est-elle valable ?', options: ['3 ans', '5 ans', '1 an'] },
  { id: 'r2', theme: 'remboursement', q: 'Pour un adulte, quand peut-on renouveler des lunettes remboursées ?', options: ['Tous les 2 ans, ou dès 1 an et 1 jour si la correction a changé d\'au moins 0,50', 'Chaque année, sans condition', 'Tous les 5 ans'] },
  { id: 'tp1', theme: 'tiers-payant', q: 'Dans LPT Santé, que désigne l\'AMC ?', options: ['La mutuelle', 'La Sécurité sociale', 'La carte Vitale'] },
  { id: 're1', theme: 'retraits', q: 'Un client vient chercher ses 2 paires. Combien de retraits signe-t-il ?', options: ['2 : un retrait signé par paire', '1 seul pour les deux paires', 'Aucun, la signature n\'est pas nécessaire'] },
  { id: 'aj1', theme: 'ajustages', q: 'Comment ajuste-t-on une monture en acétate ?', options: ['À chaud, avec une chaleur sèche', 'À froid, en pliant doucement', 'En la trempant dans l\'eau chaude'] },
  { id: 'rz1', theme: 'raz', q: 'Un client a une gêne avec ses nouvelles lunettes. Avant de lancer une RAZ…', options: ['On fait toutes les vérifications : saisie, mesures, ajustement, ordonnance', 'On refait les verres tout de suite', 'On lui conseille d\'attendre que ça passe'] },
  { id: 'mo1', theme: 'montage', q: 'Le verre commandé n\'est pas en stock avec ce traitement, mais le niveau supérieur l\'est. Que fait le monteur ?', options: ['Il monte le niveau supérieur, offert, en 10 minutes', 'Il commande le verre et fait revenir le client', 'Il monte un niveau inférieur'] },
  { id: 'ou1', theme: 'outlet', q: 'Une commande apparaît dans l\'onglet « Montures Outlet ». Que fait-on ?', options: ['On déstocke la monture et on la range dans le bac outlet avec le bon de fabrication', 'On attend l\'arrivée des verres pour chercher la monture', 'On laisse la monture en rayon tant qu\'il en reste plusieurs'] },
  // ── Modules complémentaires ──
  { id: 'px1', theme: 'proximite', q: 'Le verre de proximité corrige…', options: ['L\'intermédiaire et le près', 'Le loin, l\'intermédiaire et le près', 'Uniquement le loin'] },
  { id: 'px2', theme: 'proximite', q: 'Qui est le meilleur candidat pour un verre de proximité ?', options: ['Une secrétaire presbyte qui alterne écran et dossiers papier', 'Un chauffeur-livreur qui veut une seule paire pour tout', 'Un jeune de 24 ans sans presbytie'] },
  { id: 'c1', theme: 'clariteens', q: 'À quoi servent les verres Clariteens ?', options: ['À freiner la myopie de l\'enfant', 'À guérir la myopie', 'À corriger la presbytie'] },
  { id: 'c2', theme: 'clariteens', q: 'Un parent parle de Stellest ou de MiYOSMART. Chez nous, c\'est…', options: ['Les Clariteens', 'Le Zen Protect', 'Le Pulsar Next'] },
  { id: 'z1', theme: 'zenprotect', q: 'Le Zen Protect, c\'est…', options: ['Un verre unifocal anti-fatigue, avec une zone de soutien en bas du verre', 'Un verre progressif', 'Un verre solaire'] },
  { id: 'z2', theme: 'zenprotect', q: 'Quel client est un bon profil Zen Protect ?', options: ['Un client non presbyte, sur écran toute la journée, les yeux fatigués le soir', 'Un client presbyte qui n\'arrive plus à lire', 'Un enfant dont la myopie augmente'] },
  { id: 'tr1', theme: 'traitements', q: 'Qu\'est-ce qui distingue le Digital Protect Pro du Premium ?', options: ['L\'anti-lumière bleue', 'L\'anti-rayures', 'L\'anti-reflets'] },
  { id: 'tr2', theme: 'traitements', q: 'Dans l\'offre 1=1, quel verre blanc propose-t-on ?', options: ['Le Digital Protect Pro, sans supplément', 'Le Basic', 'Le Premium, avec un supplément'] },
  { id: 'pr1', theme: 'progressif', q: 'Combien de temps dure la garantie adaptation sur nos progressifs ?', options: ['100 jours', '30 jours', '1 an'] },
  { id: 'pr2', theme: 'progressif', q: 'Un client hésite à passer au progressif. Quel est le bon réflexe ?', options: ['Lui poser des questions sur son quotidien et répondre à sa crainte', 'Lui réciter tous les arguments', 'Lui expliquer qu\'il faut du temps pour s\'adapter'] },
  { id: 'tq1', theme: 'troisieme-paire', q: 'Après un 1=1, quelle remise a la troisième paire en parcours classique ?', options: ['20 %', '50 %', 'Elle est offerte'] },
  { id: 'tq2', theme: 'troisieme-paire', q: 'Quand propose-t-on la troisième paire ?', options: ['Une fois les deux paires du 1=1 choisies, en partant d\'un besoin du client', 'Dès l\'arrivée du client, avant l\'essayage', 'Seulement si le client la demande'] },
  { id: 'x1', theme: 'transposition', q: 'Quand on transpose un cylindre négatif en positif, le cylindre…', options: ['Garde sa valeur : seul le signe change', 'Double de valeur', 'Disparaît'] },
  { id: 'x2', theme: 'transposition', q: 'L\'axe d\'origine est 100°. Quel est le nouvel axe après transposition ?', options: ['10°', '190°', '100°'] },
  { id: 'g1', theme: 'granit', q: 'LPT Santé répond « non réalisable ». Que fait-on ?', options: ['Un Granit', 'On passe directement en 1=1 100 % Santé', 'On abandonne le remboursement'] },
  { id: 'g2', theme: 'granit', q: 'Que faut-il envoyer pour lancer un Granit ?', options: ['3 photos nettes : ordonnance, carte de mutuelle et écran LPT Santé', 'Seulement la carte de mutuelle', 'Rien, on appelle la mutuelle'] },
]

export const TOTAL_QUESTIONS = QUESTIONS.length

/** Questions dans un ordre mélangé, options mélangées (index de la bonne réponse suivi). */
export function preparerTest() {
  const melanger = a => {
    const t = a.slice()
    for (let i = t.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [t[i], t[j]] = [t[j], t[i]] }
    return t
  }
  return melanger(QUESTIONS).map(q => {
    const ordre = melanger(q.options.map((_, i) => i))
    return { ...q, affichees: ordre.map(i => q.options[i]), bonneAffichee: ordre.indexOf(0) }
  })
}

/** Enregistre le test terminé. reponses : [{ id, theme, correct, choisie }]. */
export async function enregistrerTestPositionnement(collaborateurId, reponses) {
  const score = reponses.filter(r => r.correct).length
  const ok = await sbInsert('module_resultats', {
    collaborateur_id: collaborateurId, module_id: TEST_ID, type: 'positionnement',
    score, total: reponses.length, reussi: null,
    details: reponses.map(r => ({
      id: r.id, theme: r.theme, correct: !!r.correct,
      libelle: QUESTIONS.find(q => q.id === r.id)?.q || '', choisie: String(r.choisie || '').slice(0, 300),
    })),
  })
  return ok ? score : null
}

/** Dernier test passé, parmi les lignes de module_resultats du collaborateur. */
export function dernierTest(resultats) {
  const tests = (resultats || []).filter(r => r.module_id === TEST_ID && r.type === 'positionnement')
  return tests.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0] || null
}

/** Bilan par thème : maîtrisé (tout juste), à revoir (une partie fausse),
 * non maîtrisé (tout faux), avec les modules de l'app qui le travaillent. */
export function bilanParTheme(test) {
  const parTheme = {}
  for (const d of test?.details || []) {
    const t = (parTheme[d.theme] ||= { justes: 0, total: 0, erreurs: [] })
    t.total += 1
    if (d.correct) t.justes += 1
    else t.erreurs.push(d)
  }
  return THEMES.filter(t => parTheme[t.id]).map(t => {
    const r = parTheme[t.id]
    const niveau = r.justes === r.total ? 'maitrise' : r.justes === 0 ? 'non-maitrise' : 'a-revoir'
    return { ...t, ...r, niveau, modulesApp: t.modules.map(id => MODULES.find(m => m.id === id)).filter(Boolean) }
  })
}
