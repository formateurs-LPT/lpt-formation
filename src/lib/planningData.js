export const PLANNING_JOURS = [
  {
    id: 'mardi',
    label: 'Mardi',
    jour: 'Jour 1',
    color: '#00abe9',
    blocs: [
      {
        horaire: '10h – 11h',
        titre: 'Culture LPT',
        items: [
          'Avatar Paul — Histoire & vision',
          "L'accessibilité des lunettes",
          'Visite magasin & produits',
        ],
      },
      {
        horaire: '',
        titre: "Bases de l'optique",
        items: [
          'Avatar Opticien — Défauts visuels',
          "Fondamentaux de l'optique",
          'Quiz interactifs',
        ],
      },
    ],
  },
  {
    id: 'mercredi',
    label: 'Mercredi',
    jour: 'Jour 2',
    color: '#4ade80',
    blocs: [
      {
        horaire: '09h00',
        titre: 'Réveil des acquis',
        items: ['Quiz sur les notions J-1'],
      },
      {
        horaire: '10h – 11h',
        titre: 'Parcours commercial',
        items: [
          "Trame d'accueil",
          'Concept LPT',
          'Offres : Suptime, 1+1, Classique, Pack 360',
        ],
      },
      {
        horaire: '',
        titre: 'Immersion terrain',
        items: ['Observation en magasin', 'Mise en pratique'],
      },
    ],
  },
  {
    id: 'jeudi',
    label: 'Jeudi',
    jour: 'Jour 3',
    color: '#f59e0b',
    blocs: [
      {
        horaire: '09h30 – 12h',
        titre: 'Acquis & Tiers payant',
        items: [
          'Quiz de validation',
          "Maîtrise trame d'accueil",
          'Mutuelles & parcours client',
        ],
      },
      {
        horaire: '14h – 16h',
        titre: 'Ventes & Mesures',
        items: [
          'App de vente',
          'Parcours client complet',
          'Centrage optique & mesures',
        ],
      },
    ],
  },
  {
    id: 'vendredi',
    label: 'Vendredi',
    jour: 'Jour 4',
    color: '#f472b6',
    blocs: [
      {
        horaire: 'Matin',
        titre: 'SAV & Cas pratiques',
        items: ['Gestion des SAV', 'Cas pratiques'],
      },
      {
        horaire: 'Après-midi',
        titre: 'Montage & Clôture',
        items: [
          'Atelier montage',
          'Parcours fabrication',
          "Clôture de l'Onboarding",
        ],
      },
    ],
  },
]
