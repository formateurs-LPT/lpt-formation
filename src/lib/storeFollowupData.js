// Suivi magasin — roster et items de compétence par magasin.
// Données saisies à la main (feuille fournie par Kevin), à étendre magasin
// par magasin. La progression réelle (statut/notes par collaborateur) vit
// dans Supabase (table store_followup_progress) — jamais ici.

export const STORES = [
  {
    id: 'bayonne',
    label: 'Bayonne',
    sections: [
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'anne-laure-miquel',      prenom: 'Anne Laure', nom: 'Miquel',            contrat: '35h' },
          { id: 'annette-henry',          prenom: 'Annette',    nom: 'Henry',              contrat: '35h' },
          { id: 'nadege-tixier-lamaison', prenom: 'Nadège',     nom: 'Tixier-Lamaison',    contrat: '35h' },
          { id: 'soraia-gomes-da-silva',  prenom: 'Soraia',     nom: 'Gomes Da Silva',     contrat: '35h' },
          { id: 'priscillia-brunet',      prenom: 'Priscillia', nom: 'Brunet',             contrat: '24h' },
          { id: 'dylan-dabadie',          prenom: 'Dylan',      nom: 'Dabadie',            contrat: '24h' },
          { id: 'dorian-mouffet-pinson',  prenom: 'Dorian',     nom: 'Mouffet-Pinson',     contrat: '24h' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'violette-renaud', prenom: 'Violette', nom: 'Renaud',   contrat: '35h' },
          { id: 'yamina-saidi',    prenom: 'Yamina',   nom: 'Saidi',    contrat: '35h' },
          { id: 'penda-salifou',   prenom: 'Penda',    nom: 'Salifou',  contrat: '35h' },
          { id: 'lea-froustey',    prenom: 'Léa',       nom: 'Froustey', contrat: '35h' },
          { id: 'marianne-caliot', prenom: 'Marianne', nom: 'Caliot',   contrat: '35h' },
        ],
      },
    ],
  },
]

// Items de suivi par section — regroupés par catégorie pour l'affichage.
// "Grands titres" fournis par Kevin, à détailler plus finement plus tard.
export const SKILL_ITEMS = {
  cvo: [
    { id: 'lecture-ordonnance', label: 'Lecture ordonnance',           category: 'Compétences' },
    { id: 'trame-accueil',      label: "Trame d'accueil",              category: 'Compétences' },
    { id: 'offres',             label: 'Offres',                       category: 'Compétences' },
    { id: 'types-verres',       label: 'Types de verres',              category: 'Compétences' },
    { id: 'traitements',        label: 'Traitements',                  category: 'Compétences' },
    { id: 'montures',           label: 'Montures',                     category: 'Compétences' },
    { id: 'tiers-payants',      label: 'Tiers payants compréhension',  category: 'Compétences' },
    { id: 'backend-cvo',        label: 'Backend',                      category: 'Compétences' },
    { id: 'parcours-telephone', label: 'Parcours téléphone',           category: 'Maîtrise des outils' },
    { id: 'lpt-vision',         label: 'LPT VISION',                   category: 'Maîtrise des outils' },
    { id: 'lpt-sante',          label: 'LPT SANTÉ',                    category: 'Maîtrise des outils' },
    { id: 'slack',              label: 'Slack',                        category: 'Maîtrise des outils' },
    { id: 'granit',             label: 'Granit',                       category: 'Maîtrise des outils' },
  ],
  'mo-sav': [
    { id: 'machines',        label: 'Maitrise et connaissance des machines', category: 'Compétences' },
    { id: 'etapes-montage',  label: 'Étapes de montage',                     category: 'Compétences' },
    { id: 'outlet',          label: 'Outlet',                                category: 'Compétences' },
    { id: 'upgrade',         label: 'Upgrade',                               category: 'Compétences' },
    { id: 'retrait',         label: 'Réaliser un retrait',                   category: 'Compétences' },
    { id: 'raz',             label: 'RAZ',                                   category: 'Compétences' },
    { id: 'suivi-commande',  label: 'Statut suivi de commande',              category: 'Compétences' },
    { id: 'reglage-monture', label: 'Réglage monture',                       category: 'Compétences' },
    { id: 'backend-mosav',   label: 'Backend',                               category: 'Compétences' },
  ],
}

export const STATUS_ORDER = ['non_acquis', 'en_cours', 'acquis']

export const STATUS_META = {
  non_acquis: { label: 'Non acquis', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  en_cours:   { label: 'En cours',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  acquis:     { label: 'Acquis',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
}

export function nextStatus(status) {
  const i = STATUS_ORDER.indexOf(status)
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length]
}

export function collaborateurFullName(c) {
  return `${c.prenom} ${c.nom}`
}
