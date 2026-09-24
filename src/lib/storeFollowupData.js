// Suivi magasin — roster et items de compétence par magasin.
// Données saisies à la main (feuille fournie par Kevin), à étendre magasin
// par magasin. La progression réelle (statut/notes par collaborateur) vit
// dans Supabase (table store_followup_progress) — jamais ici.

import { TRAME_ACCUEIL_POINTS } from './modulesData'

export const STORES = [
  {
    id: 'bayonne',
    label: 'Bayonne',
    photo: '/assets/store-bayonne.jpg',
    sections: [
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'anne-laure-miquel',      prenom: 'Anne Laure', nom: 'Miquel',            contrat: '35h', entree: '2026-07-26' },
          { id: 'annette-henry',          prenom: 'Annette',    nom: 'Henry',              contrat: '35h', entree: '2026-04-07' },
          { id: 'nadege-tixier-lamaison', prenom: 'Nadège',     nom: 'Tixier-Lamaison',    contrat: '35h', entree: '2026-08-04' },
          { id: 'soraia-gomes-da-silva',  prenom: 'Soraia',     nom: 'Gomes Da Silva',     contrat: '35h', entree: '2026-08-25' },
          { id: 'priscillia-brunet',      prenom: 'Priscillia', nom: 'Brunet',             contrat: '24h', entree: '2026-08-25' },
          { id: 'dylan-dabadie',          prenom: 'Dylan',      nom: 'Dabadie',            contrat: '24h', entree: '2026-09-01' },
          { id: 'dorian-mouffet-pinson',  prenom: 'Dorian',     nom: 'Mouffet-Pinson',     contrat: '24h', entree: '2026-08-11' },
          { id: 'leonie-dubois',          prenom: 'Léonie',     nom: 'Dubois',             contrat: '35h', entree: '2026-07-15' },
          { id: 'lola-sallaberry',        prenom: 'Lola',       nom: 'Sallaberry',         contrat: '35h', entree: '2025-09-02', alternant: true },
          { id: 'nizar-el-sabbagh',       prenom: 'Nizar',      nom: 'El Sabbagh',         contrat: '35h', entree: '2026-09-08', alternant: true },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'violette-renaud', prenom: 'Violette', nom: 'Renaud',   contrat: '35h', entree: '2026-07-21' },
          { id: 'yamina-saidi',    prenom: 'Yamina',   nom: 'Saidi',    contrat: '35h', entree: '2026-08-11' },
          { id: 'penda-salifou',   prenom: 'Penda',    nom: 'Salifou',  contrat: '35h', entree: '2026-08-25' },
          { id: 'lea-froustey',    prenom: 'Léa',       nom: 'Froustey', contrat: '35h', entree: '2024-09-24' },
          { id: 'marianne-caliot', prenom: 'Marianne', nom: 'Caliot',   contrat: '35h', entree: '2023-08-01' },
        ],
      },
    ],
  },
  {
    id: 'toulon-avenue-83',
    label: 'Toulon Avenue 83',
    sections: [
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'arthur-moyon',   prenom: 'Arthur',  nom: 'Moyon',   contrat: '24h' },
          { id: 'esteban-salinas', prenom: 'Esteban', nom: 'Salinas', contrat: '39h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'dylan-lelievre',       prenom: 'Dylan',     nom: 'Lelièvre',      contrat: '35h' },
          { id: 'jade-amara',           prenom: 'Jade',      nom: 'Amara',         contrat: '35h' },
          { id: 'noa-giaya',            prenom: 'Noa',       nom: 'Giaya',         contrat: '35h' },
          { id: 'vanille-cappelle',     prenom: 'Vanille',   nom: 'Cappelle',      contrat: '35h' },
          { id: 'luna-amagat',          prenom: 'Luna',      nom: 'Amagat',        contrat: '35h' },
          { id: 'ornella-chaix',        prenom: 'Ornella',   nom: 'Chaix',         contrat: '35h' },
          { id: 'maily-michee',         prenom: 'Maïly',     nom: 'Michée',        contrat: '35h30' },
          { id: 'hortense-de-lambert',  prenom: 'Hortense',  nom: 'De Lambert',    contrat: '35h' },
          { id: 'thaiss-windenberger',  prenom: 'Thaïss',    nom: 'Windenberger',  contrat: '28h' },
          { id: 'juliette-pheulpin',    prenom: 'Juliette',  nom: 'Pheulpin',      contrat: '28h' },
          { id: 'thomas-benhallal',     prenom: 'Thomas',    nom: 'Benhallal',     contrat: '24h' },
          { id: 'melina-lecoq',         prenom: 'Melina',    nom: 'Lecoq',         contrat: '24h' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'leia-brun-gauthier',   prenom: 'Leia',      nom: 'Brun-Gauthier', contrat: '35h' },
          { id: 'yannis-adeler',        prenom: 'Yannis',    nom: 'Adeler',        contrat: '35h' },
          { id: 'joshua-meziane-mana',  prenom: 'Joshua',    nom: 'Meziane Mana',  contrat: '35h' },
          { id: 'terry-emery',          prenom: 'Terry',     nom: 'Emery',         contrat: '35h' },
          { id: 'maelle-isch',          prenom: 'Maelle',    nom: 'Isch',          contrat: '35h' },
          { id: 'lilou-parcilie',       prenom: 'Lilou',     nom: 'Parcilie',      contrat: '35h' },
          { id: 'ilona-pendu',          prenom: 'Ilona',     nom: 'Pendu',         contrat: '35h' },
          { id: 'damien-vasseur',       prenom: 'Damien',    nom: 'Vasseur',       contrat: '35h' },
          { id: 'kassandra-smith',      prenom: 'Kassandra', nom: 'Smith',         contrat: '28h' },
          { id: 'noemie-vernale',       prenom: 'Noëmie',    nom: 'Vernale',       contrat: '24h' },
          { id: 'amine-el-attar',       prenom: 'Amine',     nom: 'El Attar',      contrat: '35h' },
        ],
      },
    ],
  },
  // Lot 1 — import Skello (semaine 39, 2026), 32 magasins.
  // Postes normalisés depuis la colonne "Poste" brute du fichier source
  // (43 valeurs distinctes à l'origine, regroupées en catégories propres) —
  // voir scripts/generate-storefollowup-sections.mjs pour la logique de
  // classification et scripts/import-effectifs-lot1.mjs pour l'import Supabase.
  {
    id: 'bastille',
    label: 'Bastille',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'amadou-barry', prenom: 'Amadou', nom: 'Barry', contrat: '41h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'loann-tyson', prenom: 'Loann', nom: 'Tyson', contrat: '35h' },
          { id: 'laura-kartout', prenom: 'Laura', nom: 'Kartout', contrat: '35h' },
          { id: 'romain-nerriere', prenom: 'Romain', nom: 'Nerriere', contrat: '35h' },
          { id: 'abla-etoh', prenom: 'Abla', nom: 'Etoh', contrat: '35h' },
          { id: 'orlanda-katala', prenom: 'Orlanda', nom: 'Katala', contrat: '25h' },
          { id: 'mathieu-guyodo', prenom: 'Mathieu', nom: 'Guyodo', contrat: '24h' },
          { id: 'olivier-abiti', prenom: 'Olivier', nom: 'Abiti', contrat: '24h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'chaima-charfeddine', prenom: 'Chaima', nom: 'Charfeddine', contrat: '39h' },
          { id: 'khadija-debievre', prenom: 'Khadija', nom: 'Debievre', contrat: '39h' },
          { id: 'ikram-charef', prenom: 'Ikram', nom: 'Charef', contrat: '35h' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'diamantine-mendy', prenom: 'Diamantine', nom: 'Mendy', contrat: '35h' },
          { id: 'sarah-renard', prenom: 'Sarah', nom: 'Renard', contrat: '28h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'paola-mokio', prenom: 'Paola', nom: 'Mokio', contrat: '35h' },
          { id: 'elody-bottereau', prenom: 'Elody', nom: 'Bottereau', contrat: '35h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'joseph-pagal', prenom: 'Joseph', nom: 'Pagal', contrat: '35h' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'faustine-pujolle', prenom: 'Faustine', nom: 'Pujolle', contrat: '35h' },
          { id: 'kouta-tandjigora', prenom: 'Kouta', nom: 'Tandjigora', contrat: '35h' },
        ],
      },
    ],
  },
  {
    id: 'beauchamps-labo-entrepot',
    label: 'Beauchamps (labo-entrepôt)',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'reda-lammari', prenom: 'Reda', nom: 'Lammari' },
        ],
      },
      {
        id: 'autre',
        label: 'AUTRE',
        sub: 'Postes divers',
        collaborateurs: [
          { id: 'yoni-guignery', prenom: 'Yoni', nom: 'Guignery' },
          { id: 'ebrahim-el-aasri', prenom: 'Ebrahim', nom: 'El Aasri' },
          { id: 'mathieu-ledda', prenom: 'Mathieu', nom: 'Ledda' },
          { id: 'olivier-lesage', prenom: 'Olivier', nom: 'Lesage' },
          { id: 'stephane-da-cunha-dias', prenom: 'Stéphane', nom: 'Da Cunha Dias', contrat: '42h' },
          { id: 'alexandre-natario', prenom: 'Alexandre', nom: 'Natario', contrat: '40h' },
          { id: 'michael-traore', prenom: 'Michaël', nom: 'Traoré', contrat: '39h' },
          { id: 'fyona-viciana', prenom: 'Fyona', nom: 'Viciana', contrat: '35h' },
          { id: 'soleiman-doppia', prenom: 'Soleïman', nom: 'Doppia', contrat: '35h' },
          { id: 'nicolas-neron-rousset', prenom: 'Nicolas', nom: 'Neron-Rousset', contrat: '35h' },
          { id: 'yannice-thudor', prenom: 'Yannice', nom: 'Thudor', contrat: '35h' },
          { id: 'jeremy-tita-farinella', prenom: 'Jérémy', nom: 'Tita-Farinella', contrat: '35h' },
          { id: 'soukaina-bouziane', prenom: 'Soukaina', nom: 'Bouziane', contrat: '35h' },
          { id: 'frederic-arthenay', prenom: 'Frédéric', nom: 'Arthenay', contrat: '35h' },
          { id: 'sasha-goncalves', prenom: 'Sasha', nom: 'Goncalves', contrat: '35h' },
          { id: 'tuline-demirov', prenom: 'Tuline', nom: 'Demirov', contrat: '35h' },
          { id: 'natural-reversac', prenom: 'Natural', nom: 'Reversac', contrat: '35h' },
          { id: 'hillary-delta', prenom: 'Hillary', nom: 'Delta', contrat: '28h' },
          { id: 'youness-fatene', prenom: 'Youness', nom: 'Fatene' },
          { id: 'warren-ramilson', prenom: 'Warren', nom: 'Ramilson' },
          { id: 'alexis-nairi', prenom: 'Alexis', nom: 'Nairi' },
          { id: 'amayes-ikououbel', prenom: 'Amayes', nom: 'Ikououbel' },
          { id: 'yohan-jolo', prenom: 'Yohan', nom: 'Jolo' },
          { id: 'florian-hoareau', prenom: 'Florian', nom: 'Hoareau' },
          { id: 'lea-lantz', prenom: 'Léa', nom: 'Lantz' },
          { id: 'vincent-bachelin', prenom: 'Vincent', nom: 'Bachelin' },
          { id: 'alex-vieira', prenom: 'Alex', nom: 'Vieira' },
          { id: 'flavien-lantez', prenom: 'Flavien', nom: 'Lantez' },
          { id: 'amine-khouila', prenom: 'Amine', nom: 'Khouila' },
          { id: 'kyllian-obam-ngo-o', prenom: 'Kyllian', nom: 'Obam Ngo\'o' },
          { id: 'tom-ollivier', prenom: 'Tom', nom: 'Ollivier' },
          { id: 'fatoumata-baradji', prenom: 'Fatoumata', nom: 'Baradji' },
          { id: 'katia-belhadi', prenom: 'Katia', nom: 'Belhadi' },
          { id: 'sofiane-otmani', prenom: 'Sofiane', nom: 'Otmani' },
          { id: 'kevin-rambert', prenom: 'Kevin', nom: 'Rambert' },
          { id: 'keenan-baniakina', prenom: 'Keenan', nom: 'Baniakina' },
          { id: 'oumar-kane', prenom: 'Oumar', nom: 'Kane' },
          { id: 'gabrielle-hebert', prenom: 'Gabrielle', nom: 'Hebert' },
          { id: 'katell-magri-kerlogot', prenom: 'Katell', nom: 'Magri-Kerlogot' },
          { id: 'abdel-malik-benyamina', prenom: 'Abdel-Malik', nom: 'Benyamina' },
          { id: 'thomas-beheregaray', prenom: 'Thomas', nom: 'Behéregaray' },
          { id: 'mohamed-berrandou', prenom: 'Mohamed', nom: 'Berrandou' },
          { id: 'eleanore-mancle', prenom: 'Eléanore', nom: 'Manclé' },
          { id: 'cyril-gianfredi', prenom: 'Cyril', nom: 'Gianfredi' },
          { id: 'youcef-merabtene', prenom: 'Youcef', nom: 'Merabtene' },
          { id: 'bounama-faye', prenom: 'Bounama', nom: 'Faye' },
          { id: 'florian-agnus', prenom: 'Florian', nom: 'Agnus' },
          { id: 'emmanuel-ogyifase-brabi', prenom: 'Emmanuel', nom: 'Ogyifase Brabi' },
          { id: 'morgan-seris', prenom: 'Morgan', nom: 'Seris' },
          { id: 'emmanuel-siberan-toto', prenom: 'Emmanuel', nom: 'Siberan--Toto' },
          { id: 'jessica-soares', prenom: 'Jessica', nom: 'Soares' },
          { id: 'xavier-tenob', prenom: 'Xavier', nom: 'Tenob' },
          { id: 'sacha-vignes', prenom: 'Sacha', nom: 'Vignes' },
          { id: 'zakaria-lakhnaijar', prenom: 'Zakaria', nom: 'Lakhnaijar' },
          { id: 'william-mabanza', prenom: 'William', nom: 'Mabanza' },
          { id: 'eloise-hauguel', prenom: 'Eloïse', nom: 'Hauguel' },
          { id: 'jeff-guede-gaoue', prenom: 'Jeff', nom: 'Guede Gaoue' },
          { id: 'kevin-bonvent', prenom: 'Kévin', nom: 'Bonvent' },
          { id: 'ismael-niakate', prenom: 'Ismaël', nom: 'Niakate' },
          { id: 'mamadou-drame', prenom: 'Mamadou', nom: 'Drame' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'bessem-aissa', prenom: 'Bessem', nom: 'Aissa' },
          { id: 'mylene-ballant', prenom: 'Mylène', nom: 'Ballant' },
          { id: 'mohammed-seba', prenom: 'Mohammed', nom: 'Seba' },
          { id: 'smail-bouremma', prenom: 'Smail', nom: 'Bouremma' },
        ],
      },
    ],
  },
  {
    id: 'begles',
    label: 'Bègles',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'victoria-ducrocq', prenom: 'Victoria', nom: 'Ducrocq', contrat: '39h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'lucien-joseph', prenom: 'Lucien', nom: 'Joseph', contrat: '39h' },
          { id: 'claudy-genevieve', prenom: 'Claudy', nom: 'Genevieve', contrat: '36h' },
          { id: 'amelia-rosa', prenom: 'Amélia', nom: 'Rosa', contrat: '35h' },
          { id: 'yanis-benbrahim', prenom: 'Yanis', nom: 'Benbrahim', contrat: '35h' },
          { id: 'sasha-corbinaud', prenom: 'Sasha', nom: 'Corbinaud', contrat: '35h' },
          { id: 'nina-brown', prenom: 'Nina', nom: 'Brown', contrat: '35h' },
          { id: 'lucas-escapit', prenom: 'Lucas', nom: 'Escapit', contrat: '35h' },
          { id: 'chloe-florance', prenom: 'Chloé', nom: 'Florance', contrat: '35h' },
          { id: 'hatice-koseo', prenom: 'Hatice', nom: 'Koseo', contrat: '24h' },
          { id: 'juliette-mignoni', prenom: 'Juliette', nom: 'Mignoni', contrat: '24h' },
          { id: 'morgan-fabes', prenom: 'Morgan', nom: 'Fabes', contrat: '24h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'chaimaa-kibach', prenom: 'Chaimaa', nom: 'Kibach', contrat: '35h' },
          { id: 'camille-philippine', prenom: 'Camille', nom: 'Philippine', contrat: '35h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'vanessa-pelat', prenom: 'Vanessa', nom: 'Pelat', contrat: '39h' },
          { id: 'manon-pauly', prenom: 'Manon', nom: 'Pauly', contrat: '35h' },
          { id: 'simon-spadotto', prenom: 'Simon', nom: 'Spadotto', contrat: '35h' },
          { id: 'lucas-algeo', prenom: 'Lucas', nom: 'Algeo', contrat: '35h' },
          { id: 'mael-lanoire', prenom: 'Maël', nom: 'Lanoire', contrat: '35h' },
          { id: 'jade-struzik', prenom: 'Jade', nom: 'Struzik', contrat: '28h' },
          { id: 'anaelle-nganemben', prenom: 'Anaëlle', nom: 'Nganemben', contrat: '24h' },
          { id: 'aleks-aleksiev', prenom: 'Aleks', nom: 'Aleksiev', contrat: '18h' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'celia-d-huy', prenom: 'Célia', nom: 'D\'Huy', contrat: '35h' },
          { id: 'jade-bendejacq', prenom: 'Jade', nom: 'Bendejacq', contrat: '35h' },
          { id: 'eleonore-burau-maury', prenom: 'Eléonore', nom: 'Burau-Maury', contrat: '35h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'tiavina-rakoto-endor', prenom: 'Tiavina', nom: 'Rakoto Endor', contrat: '08h' },
        ],
      },
    ],
  },
  {
    id: 'belle-epine',
    label: 'Belle épine',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'nicolas-robert', prenom: 'Nicolas', nom: 'Robert' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'simon-pierre-moselle', prenom: 'Simon-Pierre', nom: 'Moselle' },
          { id: 'karim-paridans', prenom: 'Karim', nom: 'Paridans' },
          { id: 'billie-le-ray', prenom: 'Billie', nom: 'Le Ray' },
          { id: 'samuel-miranda', prenom: 'Samuel', nom: 'Miranda' },
          { id: 'samy-diab', prenom: 'Samy', nom: 'Diab' },
          { id: 'abou-soufiane-benhenni', prenom: 'Abou-Soufiane', nom: 'Benhenni' },
          { id: 'celine-reghdi', prenom: 'Céline', nom: 'Reghdi' },
          { id: 'dounia-chadli', prenom: 'Dounia', nom: 'Chadli' },
          { id: 'melanie-meltz', prenom: 'Mélanie', nom: 'Meltz' },
          { id: 'camelia-mavinga-mbemba', prenom: 'Camélia', nom: 'Mavinga Mbemba' },
          { id: 'dalia-seker', prenom: 'Dalia', nom: 'Seker' },
          { id: 'mona-faymany', prenom: 'Mona', nom: 'Faymany' },
          { id: 'alyssia-arbaoui', prenom: 'Alyssia', nom: 'Arbaoui' },
          { id: 'ines-belaksir', prenom: 'Ines', nom: 'Belaksir' },
          { id: 'lidia-henni', prenom: 'Lidia', nom: 'Henni' },
          { id: 'christian-wadol-badiatila', prenom: 'Christian', nom: 'Wadol Badiatila' },
          { id: 'adam-bouhaddi', prenom: 'Adam', nom: 'Bouhaddi' },
          { id: 'fatoumata-sacko', prenom: 'Fatoumata', nom: 'Sacko' },
          { id: 'dia-josiane-sanou', prenom: 'Dia', nom: 'Josiane Sanou' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'raymond-velmans', prenom: 'Raymond', nom: 'Velmans' },
          { id: 'lorry-bernier', prenom: 'Lorry', nom: 'Bernier' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'aya-skarfa', prenom: 'Aya', nom: 'Skarfa' },
          { id: 'deniz-guler', prenom: 'Déniz', nom: 'Güler' },
          { id: 'ekambi-dylan-prince-jason-lobe', prenom: 'Ekambi', nom: 'Dylan Prince Jason Lobe' },
          { id: 'oceane-perugien', prenom: 'Océane', nom: 'Perugien' },
          { id: 'axel-basileu', prenom: 'Axel', nom: 'Basileu' },
          { id: 'alexandre-cortez-das-neves', prenom: 'Alexandre', nom: 'Cortez Das Neves' },
          { id: 'nainikka-janatharan', prenom: 'Nainikka', nom: 'Janatharan' },
          { id: 'zalan-genevaux', prenom: 'Zalan', nom: 'Genevaux' },
          { id: 'marine-defosse', prenom: 'Marine', nom: 'Defosse' },
          { id: 'serena-okoko', prenom: 'Séréna', nom: 'Okoko' },
        ],
      },
      {
        id: 'autre',
        label: 'AUTRE',
        sub: 'Postes divers',
        collaborateurs: [
          { id: 'owen-mipoko', prenom: 'Owen', nom: 'Mipoko' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'angele-gilbert', prenom: 'Angèle', nom: 'Gilbert' },
          { id: 'abou-fany', prenom: 'Abou', nom: 'Fany' },
        ],
      },
    ],
  },
  {
    id: 'bordeaux',
    label: 'Bordeaux',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'myriam-oufrassi', prenom: 'Myriam', nom: 'Oufrassi' },
          { id: 'fanny-merlaud', prenom: 'Fanny', nom: 'Merlaud' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'murat-aydemir', prenom: 'Murat', nom: 'Aydemir' },
          { id: 'maxence-guigui', prenom: 'Maxence', nom: 'Guigui' },
          { id: 'martin-dupuy', prenom: 'Martin', nom: 'Dupuy' },
          { id: 'manon-pecourneau', prenom: 'Manon', nom: 'Pecourneau' },
          { id: 'arthur-larche', prenom: 'Arthur', nom: 'Larche' },
          { id: 'leeloo-aoued', prenom: 'Leeloo', nom: 'Aoued' },
          { id: 'melvin-ekoh-mba', prenom: 'Melvin', nom: 'Ekoh Mba' },
          { id: 'arthur-cassou', prenom: 'Arthur', nom: 'Cassou' },
          { id: 'nolwenn-kuffel', prenom: 'Nolwenn', nom: 'Kuffel' },
          { id: 'theo-garrigue', prenom: 'Théo', nom: 'Garrigue' },
          { id: 'jules-gomme', prenom: 'Jules', nom: 'Gomme' },
          { id: 'manon-lalande', prenom: 'Manon', nom: 'Lalande' },
          { id: 'paola-baloty', prenom: 'Paola', nom: 'Baloty' },
          { id: 'eva-mizrahi', prenom: 'Eva', nom: 'Mizrahi' },
          { id: 'nina-piraveau', prenom: 'Nina', nom: 'Piraveau' },
          { id: 'matteo-defemme', prenom: 'Mattéo', nom: 'Defemme' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'vincent-morin', prenom: 'Vincent', nom: 'Morin' },
          { id: 'marie-naslin', prenom: 'Marie', nom: 'Naslin' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'coline-valette', prenom: 'Coline', nom: 'Valette' },
          { id: 'milan-birioukoff', prenom: 'Milan', nom: 'Birioukoff' },
          { id: 'ionut-adrian-mititelu', prenom: 'Ionut-Adrian', nom: 'Mititelu' },
          { id: 'stella-lusimana', prenom: 'Stella', nom: 'Lusimana' },
          { id: 'noemie-mahano', prenom: 'Noémie', nom: 'Mahano' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'stephane-gueredrat', prenom: 'Stéphane', nom: 'Gueredrat' },
          { id: 'floriane-jarrier', prenom: 'Floriane', nom: 'Jarrier' },
          { id: 'charlotte-girault', prenom: 'Charlotte', nom: 'Girault' },
          { id: 'apolline-kieffer', prenom: 'Apolline', nom: 'Kieffer' },
          { id: 'auriane-maisondieulaforge', prenom: 'Auriane', nom: 'Maisondieulaforge' },
          { id: 'ludvyne-nwompaza-essongue', prenom: 'Ludvyne', nom: 'Nwompaza Essongue' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'baptiste-dachary', prenom: 'Baptiste', nom: 'Dachary' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'valentina-castaing', prenom: 'Valentina', nom: 'Castaing' },
          { id: 'benedicte-dufour', prenom: 'Bénédicte', nom: 'Dufour' },
        ],
      },
    ],
  },
  {
    id: 'cergy',
    label: 'Cergy',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'soufiane-mammeri', prenom: 'Soufiane', nom: 'Mammeri' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'fatiha-hamaoui', prenom: 'Fatiha', nom: 'Hamaoui' },
          { id: 'terence-ba', prenom: 'Térence', nom: 'Ba' },
          { id: 'eddy-delouis', prenom: 'Eddy', nom: 'Delouis' },
          { id: 'imane-hadjam', prenom: 'Imane', nom: 'Hadjam' },
          { id: 'noemie-koffi', prenom: 'Noémie', nom: 'Koffi' },
          { id: 'erostrate-ngoubili', prenom: 'Erostrate', nom: 'Ngoubili' },
          { id: 'yasmine-djibode-akplogan', prenom: 'Yasmine', nom: 'Djibode Akplogan' },
          { id: 'pierrick-turbe', prenom: 'Pierrick', nom: 'Turbé' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'isabelle-michaux', prenom: 'Isabelle', nom: 'Michaux' },
          { id: 'jaad-evarne', prenom: 'Jaad', nom: 'Evarne' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'prexille-kereine-bantsimba', prenom: 'Prexille', nom: 'Kereine Bantsimba' },
          { id: 'regis-reggie-orieux', prenom: 'Regis', nom: 'Reggie Orieux' },
          { id: 'eleane-chiffoleau', prenom: 'Eléane', nom: 'Chiffoleau' },
          { id: 'soraya-allem', prenom: 'Soraya', nom: 'Allem' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'lucie-delhaye', prenom: 'Lucie', nom: 'Delhaye' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'amal-asari', prenom: 'Amal', nom: 'Asari' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'adil-ait-chadi', prenom: 'Adil', nom: 'Ait-Chadi' },
          { id: 'ibrahim-oualy', prenom: 'Ibrahim', nom: 'Oualy' },
        ],
      },
    ],
  },
  {
    id: 'charleroi',
    label: 'Charleroi',
    sections: [
      {
        id: 'referent',
        label: 'REFERENT',
        sub: 'Référents',
        collaborateurs: [
          { id: 'thibault-dierickx', prenom: 'Thibault', nom: 'Dierickx' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'aya-hamadi', prenom: 'Aya', nom: 'Hamadi' },
          { id: 'sofiane-serra', prenom: 'Sofiane', nom: 'Serra' },
          { id: 'selena-amorino', prenom: 'Séléna', nom: 'Amorino' },
          { id: 'jeremy-bazzana', prenom: 'Jérémy', nom: 'Bazzana' },
          { id: 'herve-durant', prenom: 'Hervé', nom: 'Durant' },
          { id: 'celine-bernard', prenom: 'Céline', nom: 'Bernard' },
          { id: 'theo-riviere', prenom: 'Théo', nom: 'Riviere' },
          { id: 'steeve-kameni', prenom: 'Steeve', nom: 'Kameni' },
          { id: 'tchelsy-wanielista', prenom: 'Tchelsy', nom: 'Wanielista' },
          { id: 'jimy-hugoo', prenom: 'Jimy', nom: 'Hugoo' },
          { id: 'chiara-manunta', prenom: 'Chiara', nom: 'Manunta' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'noemie-strizzolo', prenom: 'Noémie', nom: 'Strizzolo' },
          { id: 'naim-saddik', prenom: 'Naïm', nom: 'Saddik' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'lucy-williot', prenom: 'Lucy', nom: 'Williot' },
          { id: 'emile-velghe', prenom: 'Emile', nom: 'Velghe' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'nicolas-tourpe', prenom: 'Nicolas', nom: 'Tourpe' },
          { id: 'oceane-hauquier', prenom: 'Océane', nom: 'Hauquier' },
          { id: 'serena-perfetto', prenom: 'Serena', nom: 'Perfetto' },
          { id: 'egidio-quelina', prenom: 'Egidio', nom: 'Quelina' },
        ],
      },
      {
        id: 'autre',
        label: 'AUTRE',
        sub: 'Postes divers',
        collaborateurs: [
          { id: 'rabie-selmani', prenom: 'Rabie', nom: 'Selmani' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'tiffany-spinette', prenom: 'Tiffany', nom: 'Spinette' },
        ],
      },
    ],
  },
  {
    id: 'chatelet',
    label: 'Châtelet',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'mickael-boggi', prenom: 'Mickael', nom: 'Boggi' },
          { id: 'romain-maeseele', prenom: 'Romain', nom: 'Maeseele' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'chaima-bouderhem', prenom: 'Chaima', nom: 'Bouderhem' },
          { id: 'ines-boudrika', prenom: 'Ines', nom: 'Boudrika' },
          { id: 'nabila-bounouar', prenom: 'Nabila', nom: 'Bounouar' },
          { id: 'mylene-da-silva-teixeira', prenom: 'Mylène', nom: 'Da Silva Teixeira' },
          { id: 'nicolas-delaunay', prenom: 'Nicolas', nom: 'Delaunay' },
          { id: 'leo-devin', prenom: 'Léo', nom: 'Devin' },
          { id: 'ilies-adjal', prenom: 'Ilies', nom: 'Adjal' },
          { id: 'kadiatou-diallo', prenom: 'Kadiatou', nom: 'Diallo' },
          { id: 'ndeupeu-djigal', prenom: 'Ndeupeu', nom: 'Djigal' },
          { id: 'cedric-dos-reis', prenom: 'Cédric', nom: 'Dos Reis' },
          { id: 'avi-gafsou', prenom: 'Avi', nom: 'Gafsou' },
          { id: 'wilson-irana', prenom: 'Wilson', nom: 'Irana' },
          { id: 'vincent-labat', prenom: 'Vincent', nom: 'Labat' },
          { id: 'denzel-lihau-makaba', prenom: 'Dënzel', nom: 'Lihau Makaba' },
          { id: 'erwin-luzolo', prenom: 'Erwin', nom: 'Luzolo' },
          { id: 'mav-mavoula', prenom: 'Mav', nom: 'Mavoula' },
          { id: 'yacine-mohamed', prenom: 'Yacine', nom: 'Mohamed' },
          { id: 'alexandre-mounier', prenom: 'Alexandre', nom: 'Mounier' },
          { id: 'guillaume-prevot', prenom: 'Guillaume', nom: 'Prevot' },
          { id: 'tete-bright-cyrus-tete-ezou', prenom: 'Tete', nom: 'Bright-Cyrus Tete-Ezou' },
          { id: 'marjolijn-zhang', prenom: 'Marjolijn', nom: 'Zhang' },
          { id: 'melissa-maugalem', prenom: 'Mélissa', nom: 'Maugalem' },
          { id: 'sarah-harbaoui', prenom: 'Sarah', nom: 'Harbaoui' },
          { id: 'dikra-damis', prenom: 'Dikra', nom: 'Damis' },
          { id: 'jeremy-landauer', prenom: 'Jérémy', nom: 'Landauer' },
          { id: 'ines-tahraoui', prenom: 'Inès', nom: 'Tahraoui' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'vanessa-ye', prenom: 'Vanessa', nom: 'Ye' },
          { id: 'aziz-cherif', prenom: 'Aziz', nom: 'Cherif' },
          { id: 'm-hamed-laouedj', prenom: 'M\'Hamed', nom: 'Laouedj' },
          { id: 'leonard-cheyo', prenom: 'Léonard', nom: 'Cheyo' },
          { id: 'pierre-le-bescond', prenom: 'Pierre', nom: 'Le Bescond' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'sarah-mohamed-seghir', prenom: 'Sarah', nom: 'Mohamed Seghir' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'come-thevenot', prenom: 'Côme', nom: 'Thevenot' },
          { id: 'gabriel-raimbault', prenom: 'Gabriel', nom: 'Raimbault' },
          { id: 'charline-san-juan', prenom: 'Charline', nom: 'San Juan' },
          { id: 'nicolas-palamede', prenom: 'Nicolas', nom: 'Palamede' },
          { id: 'kanitha-long', prenom: 'Kanitha', nom: 'Long' },
          { id: 'ludiana-ndong', prenom: 'Ludiana', nom: 'Ndong' },
          { id: 'accere-bouzimbou', prenom: 'Acçere', nom: 'Bouzimbou' },
          { id: 'michael-rottier', prenom: 'Michaël', nom: 'Rottier' },
          { id: 'sean-thomas', prenom: 'Sean', nom: 'Thomas' },
          { id: 'apolline-jarry', prenom: 'Apolline', nom: 'Jarry' },
          { id: 'kwami-irvin-guy-akouete', prenom: 'Kwami', nom: 'Irvin Guy Akouete' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'lois-philippot', prenom: 'Loïs', nom: 'Philippot' },
          { id: 'victor-muler', prenom: 'Victor', nom: 'Muler' },
          { id: 'clarisse-michel', prenom: 'Clarisse', nom: 'Michel' },
          { id: 'anastasie-robuchon-lee', prenom: 'Anastasie', nom: 'Robuchon Lee' },
          { id: 'deniro-doh', prenom: 'Deniro', nom: 'Doh' },
          { id: 'cavinshe-calistus-ravin', prenom: 'Cavinshe', nom: 'Calistus Ravin' },
          { id: 'hanane-maskri', prenom: 'Hanane', nom: 'Maskri' },
          { id: 'nathan-brezephin', prenom: 'Nathan', nom: 'Brezephin' },
          { id: 'megan-lavoie', prenom: 'Megan', nom: 'Lavoie' },
          { id: 'noemie-adolle', prenom: 'Noémie', nom: 'Adolle' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'camille-vilfeu', prenom: 'Camille', nom: 'Vilfeu' },
        ],
      },
      {
        id: 'autre',
        label: 'AUTRE',
        sub: 'Postes divers',
        collaborateurs: [
          { id: 'lena-da-fonseca', prenom: 'Léna', nom: 'Da Fonseca' },
          { id: 'linda-bourenane', prenom: 'Linda', nom: 'Bourenane' },
          { id: 'oceanne-brice-andre', prenom: 'Océanne-Brice', nom: 'André' },
          { id: 'anthony-okoko', prenom: 'Anthony', nom: 'Okoko' },
          { id: 'hoel-yvert', prenom: 'Hoel', nom: 'Yvert' },
          { id: 'faycal-hamzaoui', prenom: 'Faycal', nom: 'Hamzaoui' },
          { id: 'geoffrey-perier', prenom: 'Geoffrey', nom: 'Perier' },
          { id: 'nihail-satouri', prenom: 'Nihail', nom: 'Satouri' },
          { id: 'meddy-gouda', prenom: 'Meddy', nom: 'Gouda' },
          { id: 'myriam-merabet', prenom: 'Myriam', nom: 'Merabet' },
          { id: 'joana-gomes', prenom: 'Joana', nom: 'Gomes' },
          { id: 'celly-kane', prenom: 'Celly', nom: 'Kane' },
          { id: 'nour-otmane', prenom: 'Nour', nom: 'Otmane' },
          { id: 'linda-kanza', prenom: 'Linda', nom: 'Kanza' },
          { id: 'melvin-pasquin', prenom: 'Melvin', nom: 'Pasquin' },
          { id: 'thesnim-lihiou', prenom: 'Thesnim', nom: 'Lihiou' },
          { id: 'diane-betombo', prenom: 'Diane', nom: 'Betombo' },
          { id: 'sofia-pires', prenom: 'Sofia', nom: 'Pires' },
          { id: 'aida-guillabert', prenom: 'Aida', nom: 'Guillabert' },
          { id: 'adelaide-robuchon-lee', prenom: 'Adelaïde', nom: 'Robuchon Lee' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'oceane-bouzignac', prenom: 'Océane', nom: 'Bouzignac' },
          { id: 'moussa-tirera', prenom: 'Moussa', nom: 'Tirera' },
          { id: 'karil-zheng', prenom: 'Karil', nom: 'Zheng' },
          { id: 'antonino-bernardo-mota', prenom: 'Antonino', nom: 'Bernardo Mota' },
          { id: 'dustyn-nuno-vilhena', prenom: 'Dustyn', nom: 'Nuno Vilhena' },
        ],
      },
    ],
  },
  {
    id: 'commerce',
    label: 'Commerce',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'steve-maillard', prenom: 'Steve', nom: 'Maillard' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'luna-nyamugusha', prenom: 'Luna', nom: 'Nyamugusha' },
          { id: 'lydia-mahroug', prenom: 'Lydia', nom: 'Mahroug' },
          { id: 'romain-nahmias', prenom: 'Romain', nom: 'Nahmias' },
          { id: 'essolizam-walla', prenom: 'Essolizam', nom: 'Walla' },
          { id: 'anna-shakhkulyan', prenom: 'Anna', nom: 'Shakhkulyan' },
          { id: 'anais-de-sousa-ferreira', prenom: 'Anaïs', nom: 'De Sousa Ferreira' },
          { id: 'yann-missout', prenom: 'Yann', nom: 'Missout' },
          { id: 'maria-tahiri', prenom: 'Maria', nom: 'Tahiri' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'doriane-da-costa', prenom: 'Doriane', nom: 'Da Costa' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'elroy-ondze', prenom: 'Elroy', nom: 'Ondze' },
          { id: 'axelle-moutachawik', prenom: 'Axelle', nom: 'Moutachawik' },
          { id: 'shadi-bouriel', prenom: 'Shadi', nom: 'Bouriel' },
          { id: 'dayana-raingeval', prenom: 'Dayana', nom: 'Raingeval' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'christophe-porra', prenom: 'Christophe', nom: 'Porra' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'dodou-sanokho', prenom: 'Dodou', nom: 'Sanokho' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'lea-soraya-bessa', prenom: 'Lea', nom: 'Soraya Bessa' },
        ],
      },
    ],
  },
  {
    id: 'creteil',
    label: 'Créteil',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'tracy-siangany', prenom: 'Tracy', nom: 'Siangany' },
          { id: 'toufik-boukriche', prenom: 'Toufik', nom: 'Boukriche' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'benjy-mavos-kabi', prenom: 'Benjy', nom: 'Mavos Kabi' },
          { id: 'nael-gerse', prenom: 'Naël', nom: 'Gersé' },
          { id: 'zahe-kalissa', prenom: 'Zahe', nom: 'Kalissa' },
          { id: 'keiza-nadege-deston', prenom: 'Keïza', nom: 'Nadège Deston' },
          { id: 'idriss-boulakhras', prenom: 'Idriss', nom: 'Boulakhras' },
          { id: 'soukeyna-diop', prenom: 'Soukeyna', nom: 'Diop' },
          { id: 'mehdi-rossetto', prenom: 'Mehdi', nom: 'Rossetto' },
          { id: 'ewen-champion', prenom: 'Ewen', nom: 'Champion' },
          { id: 'eddine-ouaoua', prenom: 'Eddine', nom: 'Ouaoua' },
          { id: 'yohann-dago-kouame', prenom: 'Yohann', nom: 'Dago Kouame' },
          { id: 'bilal-marzak', prenom: 'Bilal', nom: 'Marzak' },
          { id: 'emmanuel-mbuata-ndudi', prenom: 'Emmanuel', nom: 'Mbuata Ndudi' },
          { id: 'zaky-benatek', prenom: 'Zaky', nom: 'Benatek' },
          { id: 'zyad-aissaoui', prenom: 'Zyad', nom: 'Aissaoui' },
          { id: 'riad-saddad', prenom: 'Riad', nom: 'Saddad' },
          { id: 'issac-ismael-soumahoro', prenom: 'Issac-Ismaël', nom: 'Soumahoro' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'tarik-mammeri', prenom: 'Tarik', nom: 'Mammeri' },
          { id: 'yahia-aribi', prenom: 'Yahia', nom: 'Aribi' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'yann-agnan', prenom: 'Yann', nom: 'Agnan' },
          { id: 'laura-verger', prenom: 'Laura', nom: 'Verger' },
          { id: 'edna-delgado', prenom: 'Edna', nom: 'Delgado' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'crystal-his', prenom: 'Crystal', nom: 'His' },
          { id: 'jimmy-belhache', prenom: 'Jimmy', nom: 'Belhache' },
          { id: 'melore-diomande', prenom: 'Mélore', nom: 'Diomande' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'nick-boumbard', prenom: 'Nick', nom: 'Boumbard' },
          { id: 'meriem-ben-gatta', prenom: 'Meriem', nom: 'Ben Gatta' },
          { id: 'raissa-abdallah', prenom: 'Raïssa', nom: 'Abdallah' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'deborah-cohen', prenom: 'Deborah', nom: 'Cohen' },
          { id: 'amalia-marquet', prenom: 'Amália', nom: 'Marquet' },
          { id: 'idris-ouriri', prenom: 'Idris', nom: 'Ouriri' },
          { id: 'joel-niankoury', prenom: 'Joël', nom: 'Niankoury' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'clara-laudo', prenom: 'Clara', nom: 'Laudo' },
          { id: 'drucila-salomon', prenom: 'Drucila', nom: 'Salomon' },
          { id: 'romaissa-chahinda-salama', prenom: 'Romaissa', nom: 'Chahinda Salama' },
          { id: 'oceane-hibert', prenom: 'Océane', nom: 'Hibert' },
          { id: 'yoan-beffrey', prenom: 'Yoan', nom: 'Beffrey' },
        ],
      },
    ],
  },
  {
    id: 'fripiers',
    label: 'Fripiers',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'gwen-tate-ferreira-dos-s', prenom: 'Gwen', nom: 'Tate Ferreira Dos S.' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'larah-barette', prenom: 'Larah', nom: 'Barette' },
          { id: 'michael-ben-tahar', prenom: 'Michael', nom: 'Ben Tahar' },
          { id: 'christian-ferreira-moneli', prenom: 'Christian', nom: 'Ferreira Moneli' },
          { id: 'mora-irakoze', prenom: 'Mora', nom: 'Irakoze' },
          { id: 'jessica-mihigo', prenom: 'Jessica', nom: 'Mihigo' },
          { id: 'owen-bovesse', prenom: 'Owen', nom: 'Bovesse' },
          { id: 'marie-helene-yamedjeu', prenom: 'Marie-Hélène', nom: 'Yamedjeu' },
          { id: 'dounia-huysse', prenom: 'Dounia', nom: 'Huysse' },
          { id: 'younes-otman', prenom: 'Younes', nom: 'Otman' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'zaria-nkunzurwanda', prenom: 'Zaria', nom: 'Nkunzurwanda' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'naike-d-almeida-anani', prenom: 'Naïke', nom: 'D\'Almeida Anani' },
          { id: 'ana-carolina-martins-faria', prenom: 'Ana', nom: 'Carolina Martins Faria' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'maiwenn-claus', prenom: 'Maïwenn', nom: 'Claus' },
          { id: 'abdoul-aziz-kasse', prenom: 'Abdoul', nom: 'Aziz Kasse' },
          { id: 'kevin-lemarchand', prenom: 'Kevin', nom: 'Lemarchand' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'amin-nouach', prenom: 'Amin', nom: 'Nouach' },
          { id: 'eva-burel', prenom: 'Eva', nom: 'Burel' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'aljban-nuhiji', prenom: 'Aljban', nom: 'Nuhiji' },
          { id: 'samia-chekkaf', prenom: 'Samia', nom: 'Chekkaf' },
          { id: 'johan-goossens', prenom: 'Johan', nom: 'Goossens' },
          { id: 'erwan-brahimi', prenom: 'Erwan', nom: 'Brahimi' },
          { id: 'alycia-hoyoux', prenom: 'Alycia', nom: 'Hoyoux' },
        ],
      },
    ],
  },
  {
    id: 'italie-2',
    label: 'Italie 2',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'vincent-smadja', prenom: 'Vincent', nom: 'Smadja' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'dylan-kone', prenom: 'Dylan', nom: 'Kone' },
          { id: 'kamelia-seker', prenom: 'Kamelia', nom: 'Seker' },
          { id: 'dylan-gontran', prenom: 'Dylan', nom: 'Gontran' },
          { id: 'sarata-kouyate', prenom: 'Sarata', nom: 'Kouyate' },
          { id: 'virginie-ayivor', prenom: 'Virginie', nom: 'Ayivor' },
          { id: 'badis-cherifi', prenom: 'Badis', nom: 'Cherifi' },
          { id: 'madison-sodji', prenom: 'Madison', nom: 'Sodji' },
          { id: 'marwann-guesnel', prenom: 'Marwann', nom: 'Guesnel' },
          { id: 'tomas-goncalves', prenom: 'Tomas', nom: 'Goncalves' },
          { id: 'marie-elisabeth-nle-ewotti', prenom: 'Marie', nom: 'Elisabeth Nle Ewotti' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'anais-sahraoui', prenom: 'Anaïs', nom: 'Sahraoui' },
          { id: 'nam-ton-that', prenom: 'Nam', nom: 'Ton That' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'aylan-oumaouche', prenom: 'Aylan', nom: 'Oumaouche' },
          { id: 'michele-crisci', prenom: 'Michele', nom: 'Crisci' },
          { id: 'hugo-azzi', prenom: 'Hugo', nom: 'Azzi' },
          { id: 'jessica-kunganzi', prenom: 'Jessica', nom: 'Kunganzi' },
          { id: 'zohra-lammari', prenom: 'Zohra', nom: 'Lammari' },
          { id: 'cassidy-lehacaut-felix', prenom: 'Cassidy', nom: 'Lehacaut Felix' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'mateo-matoute', prenom: 'Mateo', nom: 'Matoute' },
          { id: 'sitan-kone', prenom: 'Sitan', nom: 'Kone' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'marion-thomas', prenom: 'Marion', nom: 'Thomas' },
          { id: 'vyctoria-de-luca', prenom: 'Vyctoria', nom: 'De Luca' },
          { id: 'yaya-ndiaye', prenom: 'Yaya', nom: 'Ndiaye' },
          { id: 'yamadou-sissoko', prenom: 'Yamadou', nom: 'Sissoko' },
          { id: 'jennifer-erazo', prenom: 'Jennifer', nom: 'Erazo' },
        ],
      },
    ],
  },
  {
    id: 'ixelles',
    label: 'Ixelles',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'hammed-molade', prenom: 'Hammed', nom: 'Molade' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'deborah-bours', prenom: 'Deborah', nom: 'Bours' },
          { id: 'tatiana-goncalves-dos-santo', prenom: 'Tatiana', nom: 'Goncalves Dos Santo' },
          { id: 'luigi-chiodo', prenom: 'Luigi', nom: 'Chiodo' },
          { id: 'ambre-debuyst', prenom: 'Ambre', nom: 'Debuyst' },
          { id: 'nicole-simons', prenom: 'Nicole', nom: 'Simons' },
          { id: 'fatima-fadoui', prenom: 'Fatima', nom: 'Fadoui' },
          { id: 'eve-thevenin', prenom: 'Eve', nom: 'Thevenin' },
          { id: 'jeremy-hallard', prenom: 'Jeremy', nom: 'Hallard' },
          { id: 'melanie-cochaux', prenom: 'Mélanie', nom: 'Cochaux' },
          { id: 'margaux-debouck', prenom: 'Margaux', nom: 'Debouck' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'luca-budroni', prenom: 'Luca', nom: 'Budroni' },
          { id: 'hajar-oudghiri-hassani', prenom: 'Hajar', nom: 'Oudghiri Hassani' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'simeon-atanasov', prenom: 'Simeon', nom: 'Atanasov' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'valentin-planche', prenom: 'Valentin', nom: 'Planche' },
          { id: 'loic-duverneuil', prenom: 'Loïc', nom: 'Duverneuil' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'samira-guimaraes', prenom: 'Samira', nom: 'Guimaraes' },
          { id: 'alexandre-lechien', prenom: 'Alexandre', nom: 'Lechien' },
        ],
      },
    ],
  },
  {
    id: 'liege',
    label: 'Liège',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'marie-koutsoudakis', prenom: 'Marie', nom: 'Koutsoudakis' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'mael-karabal', prenom: 'Maël', nom: 'Karabal' },
          { id: 'salvatore-sidari', prenom: 'Salvatore', nom: 'Sidari' },
          { id: 'abdellah-hamid', prenom: 'Abdellah', nom: 'Hamid' },
          { id: 'theo-feuillet', prenom: 'Théo', nom: 'Feuillet' },
          { id: 'judith-kombe', prenom: 'Judith', nom: 'Kombe' },
          { id: 'antoine-docquier', prenom: 'Antoine', nom: 'Docquier' },
          { id: 'melanie-mesquita', prenom: 'Mélanie', nom: 'Mesquita' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'franck-mayanda-mindo', prenom: 'Franck', nom: 'Mayanda Mindo' },
          { id: 'samael-close', prenom: 'Samaël', nom: 'Close' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'shanna-broncard', prenom: 'Shanna', nom: 'Broncard' },
          { id: 'celine-scholinckx', prenom: 'Céline', nom: 'Scholinckx' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'marie-beauduin', prenom: 'Marie', nom: 'Beauduin' },
          { id: 'ararat-danielyan', prenom: 'Ararat', nom: 'Danielyan' },
          { id: 'lucia-alvarez-lopez', prenom: 'Lucia', nom: 'Alvarez Lopez' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'gabrielle-deroubaix', prenom: 'Gabrielle', nom: 'Deroubaix' },
          { id: 'helena-lebichot', prenom: 'Helena', nom: 'Lebichot' },
          { id: 'alizee-vanhaelen', prenom: 'Alizée', nom: 'Vanhaelen' },
        ],
      },
    ],
  },
  {
    id: 'lille',
    label: 'Lille',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'lea-havet', prenom: 'Léa', nom: 'Havet' },
          { id: 'julien-macalou', prenom: 'Julien', nom: 'Macalou' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'maxence-lemaire-calesse', prenom: 'Maxence', nom: 'Lemaire--Calesse' },
          { id: 'assia-mamou', prenom: 'Assia', nom: 'Mamou' },
          { id: 'syane-morey', prenom: 'Syane', nom: 'Morey' },
          { id: 'la-joie-kikesa', prenom: 'La', nom: 'Joie Kikesa' },
          { id: 'joudi-sweidan', prenom: 'Joudi', nom: 'Sweidan' },
          { id: 'camille-lebrun', prenom: 'Camille', nom: 'Lebrun' },
          { id: 'lindsay-hennecart', prenom: 'Lindsay', nom: 'Hennecart' },
          { id: 'giuseppe-fuggiano', prenom: 'Giuseppe', nom: 'Fuggiano' },
          { id: 'mylena-trenel', prenom: 'Myléna', nom: 'Trenel' },
          { id: 'meline-leleu', prenom: 'Méline', nom: 'Leleu' },
          { id: 'ugo-delaunay', prenom: 'Ugo', nom: 'Delaunay' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'valentin-perek', prenom: 'Valentin', nom: 'Perek' },
          { id: 'arthur-trannoy', prenom: 'Arthur', nom: 'Trannoy' },
          { id: 'yamine-bara', prenom: 'Yamine', nom: 'Bara' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'ilyasse-afak', prenom: 'Ilyasse', nom: 'Afak' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'maxime-berger', prenom: 'Maxime', nom: 'Berger' },
          { id: 'olivier-vanachte', prenom: 'Olivier', nom: 'Vanachte' },
          { id: 'florian-duquenoy', prenom: 'Florian', nom: 'Duquenoy' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'lea-courtecuisse', prenom: 'Léa', nom: 'Courtecuisse' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'melike-cinar', prenom: 'Melike', nom: 'Cinar' },
          { id: 'meline-dujardin', prenom: 'Méline', nom: 'Dujardin' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'alexandre-flamand', prenom: 'Alexandre', nom: 'Flamand' },
        ],
      },
    ],
  },
  {
    id: 'lyon',
    label: 'Lyon',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'magdalena-lefebvre', prenom: 'Magdalena', nom: 'Lefebvre' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'zina-boutra', prenom: 'Zina', nom: 'Boutra' },
          { id: 'xavier-monteagudo', prenom: 'Xavier', nom: 'Monteagudo' },
          { id: 'laura-brunet', prenom: 'Laura', nom: 'Brunet' },
          { id: 'aurelie-garcia', prenom: 'Aurélie', nom: 'Garcia' },
          { id: 'quentin-payet', prenom: 'Quentin', nom: 'Payet' },
          { id: 'renaud-zanelli', prenom: 'Renaud', nom: 'Zanelli' },
          { id: 'aya-ould-bachir', prenom: 'Aya', nom: 'Ould-Bachir' },
          { id: 'lucas-moratto', prenom: 'Lucas', nom: 'Moratto' },
          { id: 'souleima-semmache', prenom: 'Souleima', nom: 'Semmache' },
          { id: 'yohann-burgun', prenom: 'Yohann', nom: 'Burgun' },
          { id: 'melina-bauthamy', prenom: 'Mélina', nom: 'Bauthamy' },
          { id: 'alexia-benigno', prenom: 'Alexia', nom: 'Benigno' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'mathieu-gonin', prenom: 'Mathieu', nom: 'Gonin' },
          { id: 'shabana-hirdjee-djina', prenom: 'Shabana', nom: 'Hirdjee Djina' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'walid-mezrai', prenom: 'Walid', nom: 'Mezrai' },
          { id: 'eliot-bertrand', prenom: 'Éliot', nom: 'Bertrand' },
          { id: 'martial-biankarto', prenom: 'Martial', nom: 'Biankarto' },
          { id: 'hicham-jbara', prenom: 'Hicham', nom: 'Jbara' },
          { id: 'samir-ben-amor', prenom: 'Samir', nom: 'Ben Amor' },
          { id: 'esteban-petton', prenom: 'Esteban', nom: 'Petton' },
          { id: 'luna-barcelo', prenom: 'Luna', nom: 'Barcelo' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'kevin-tembouret', prenom: 'Kévin', nom: 'Tembouret' },
          { id: 'adel-savimpi', prenom: 'Adel', nom: 'Savimpi' },
        ],
      },
    ],
  },
  {
    id: 'marseille-cannebiere',
    label: 'Marseille Cannebière',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'fadjli-hakim', prenom: 'Fadjli', nom: 'Hakim' },
          { id: 'sophie-katsuraki', prenom: 'Sophie', nom: 'Katsuraki' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'baptiste-munoz', prenom: 'Baptiste', nom: 'Munoz' },
          { id: 'joey-ghironi', prenom: 'Joey', nom: 'Ghironi' },
          { id: 'ahlam-hamama', prenom: 'Ahlam', nom: 'Hamama' },
          { id: 'helia-lunardon', prenom: 'Hélia', nom: 'Lunardon' },
          { id: 'shadi-flanders', prenom: 'Shadi', nom: 'Flanders' },
          { id: 'chaimae-bouhamdi', prenom: 'Chaimae', nom: 'Bouhamdi' },
          { id: 'sid-ahmed-mehdi-abdelhakim', prenom: 'Sid', nom: 'Ahmed Mehdi Abdelhakim' },
          { id: 'sasha-said', prenom: 'Sasha', nom: 'Said' },
          { id: 'iman-m-houmada', prenom: 'Iman', nom: 'M\'Houmada' },
          { id: 'elie-griosel', prenom: 'Elie', nom: 'Griosel' },
          { id: 'ayah-ragheb', prenom: 'Ayah', nom: 'Ragheb' },
          { id: 'farah-bouchia', prenom: 'Farah', nom: 'Bouchia' },
          { id: 'iliona-buyse', prenom: 'Iliona', nom: 'Buyse' },
          { id: 'chirine-boualem', prenom: 'Chirine', nom: 'Boualem' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'patti-baron', prenom: 'Patti', nom: 'Baron' },
          { id: 'chamberline-samo-tchenkoua', prenom: 'Chamberline', nom: 'Samo Tchenkoua' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'yann-clement', prenom: 'Yann', nom: 'Clement' },
          { id: 'younes-guediri', prenom: 'Younes', nom: 'Guediri' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'anthony-delemar', prenom: 'Anthony', nom: 'Delemar' },
          { id: 'choukourani-ali-islame', prenom: 'Choukourani', nom: 'Ali Islame' },
          { id: 'chiraz-audibert', prenom: 'Chiraz', nom: 'Audibert' },
          { id: 'guillaume-soudani', prenom: 'Guillaume', nom: 'Soudani' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'amel-benahmed', prenom: 'Amel', nom: 'Benahmed' },
          { id: 'sarah-hadjeb', prenom: 'Sarah', nom: 'Hadjeb' },
          { id: 'kylian-coronado', prenom: 'Kylian', nom: 'Coronado' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'anthony-pascal', prenom: 'Anthony', nom: 'Pascal' },
          { id: 'samantha-mezo', prenom: 'Samantha', nom: 'Mezö' },
        ],
      },
    ],
  },
  {
    id: 'marseille-tdp',
    label: 'Marseille TDP',
    sections: [
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'yoann-coronado', prenom: 'Yoann', nom: 'Coronado' },
          { id: 'dylan-lelievre', prenom: 'Dylan', nom: 'Lelièvre' },
          { id: 'charlotte-alberti', prenom: 'Charlotte', nom: 'Alberti' },
          { id: 'sabry-rezoug', prenom: 'Sabry', nom: 'Rezoug' },
          { id: 'leah-le-breton', prenom: 'Léah', nom: 'Le Breton' },
          { id: 'sila-karaagac', prenom: 'Sila', nom: 'Karaagac' },
          { id: 'nahimi-gueroui', prenom: 'Nahimi', nom: 'Gueroui' },
          { id: 'mely-bianca-kaou-kemajou', prenom: 'Mely', nom: 'Bianca Kaou Kemajou' },
          { id: 'mohamed-nazim-abad', prenom: 'Mohamed-Nazim', nom: 'Abad' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'leticia-hadjeb', prenom: 'Leticia', nom: 'Hadjeb' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'lou-lhermet-domange', prenom: 'Lou', nom: 'Lhermet--Domange' },
          { id: 'sophie-valero', prenom: 'Sophie', nom: 'Valero' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'julie-tortora', prenom: 'Julie', nom: 'Tortora' },
          { id: 'lola-giraud-ferriere', prenom: 'Lola', nom: 'Giraud-Ferriere' },
          { id: 'melissa-garnero', prenom: 'Melissa', nom: 'Garnero' },
          { id: 'sami-guerrouzi', prenom: 'Sami', nom: 'Guerrouzi' },
          { id: 'belkacem-belaidi', prenom: 'Belkacem', nom: 'Belaidi' },
          { id: 'kenza-tabet-aoul', prenom: 'Kenza', nom: 'Tabet-Aoul' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'enolha-quilichini', prenom: 'Enolha', nom: 'Quilichini' },
          { id: 'lotfi-mohelleb', prenom: 'Lotfi', nom: 'Mohelleb' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'yacine-lalaoui', prenom: 'Yacine', nom: 'Lalaoui' },
          { id: 'nassim-araria', prenom: 'Nassim', nom: 'Araria' },
          { id: 'maelle-audry-bauer', prenom: 'Maelle', nom: 'Audry-Bauer' },
          { id: 'roberto-petrucci', prenom: 'Roberto', nom: 'Petrucci' },
          { id: 'athenais-florant', prenom: 'Athénaïs', nom: 'Florant' },
          { id: 'tea-questroy', prenom: 'Tea', nom: 'Questroy' },
        ],
      },
    ],
  },
  {
    id: 'montparnasse',
    label: 'Montparnasse',
    sections: [
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'julianne-saraga', prenom: 'Julianne', nom: 'Saraga' },
          { id: 'andrea-grujic', prenom: 'Andréa', nom: 'Grujic' },
          { id: 'julien-koshsorour', prenom: 'Julien', nom: 'Koshsorour' },
          { id: 'melissa-meliksetian', prenom: 'Mélissa', nom: 'Meliksetian' },
          { id: 'mohamed-anas-mohomed-niyaz', prenom: 'Mohamed', nom: 'Anas Mohomed Niyaz' },
          { id: 'jeremie-le-henaff', prenom: 'Jérémie', nom: 'Le Henaff' },
          { id: 'youma-fofana', prenom: 'Youma', nom: 'Fofana' },
          { id: 'florence-beckel', prenom: 'Florence', nom: 'Beckel' },
          { id: 'clara-lemarchand', prenom: 'Clara', nom: 'Lemarchand' },
          { id: 'quentin-poigt', prenom: 'Quentin', nom: 'Poigt' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'lucas-moiret', prenom: 'Lucas', nom: 'Moiret' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'melina-el-gabteni', prenom: 'Melina', nom: 'El Gabteni' },
          { id: 'kellya-moreira-de-brito', prenom: 'Kellya', nom: 'Moreira De Brito' },
          { id: 'liliana-da-silva-lages', prenom: 'Liliana', nom: 'Da Silva Lages' },
          { id: 'manuel-allori', prenom: 'Manuel', nom: 'Allori' },
          { id: 'jihad-fattah', prenom: 'Jihad', nom: 'Fattah' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'clemence-ducasse', prenom: 'Clémence', nom: 'Ducasse' },
        ],
      },
    ],
  },
  {
    id: 'montpellier-comedie',
    label: 'Montpellier Comédie',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'maya-ben-yfa-gresland', prenom: 'Maya', nom: 'Ben Yfa-Gresland', contrat: '39h' },
        ],
      },
      {
        id: 'referent',
        label: 'REFERENT',
        sub: 'Référents',
        collaborateurs: [
          { id: 'wassim-messaadia', prenom: 'Wassim', nom: 'Messaadia', contrat: '39h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'romain-vongnarath', prenom: 'Romain', nom: 'Vongnarath', contrat: '35h' },
          { id: 'mathieu-cuvelier', prenom: 'Mathieu', nom: 'Cuvelier', contrat: '35h' },
          { id: 'manon-malherbe', prenom: 'Manon', nom: 'Malherbe', contrat: '35h' },
          { id: 'etfor-flavien-pembele', prenom: 'Etfor-Flavien', nom: 'Pembele', contrat: '35h' },
          { id: 'sullyvan-bardin', prenom: 'Sullyvan', nom: 'Bardin', contrat: '35h' },
          { id: 'guven-tuncer', prenom: 'Güven', nom: 'Tuncer', contrat: '35h' },
          { id: 'agathe-hermignies', prenom: 'Agathe', nom: 'Hermignies', contrat: '35h' },
          { id: 'carla-frejaville-ruiz', prenom: 'Carla', nom: 'Frejaville-Ruiz', contrat: '28h' },
          { id: 'fabien-meriais', prenom: 'Fabien', nom: 'Mériais', contrat: '24h' },
          { id: 'lucile-ribery', prenom: 'Lucile', nom: 'Ribery', contrat: '24h' },
          { id: 'clara-courtey', prenom: 'Clara', nom: 'Courtey', contrat: '24h' },
          { id: 'malak-sedira', prenom: 'Malak', nom: 'Sedira', contrat: '24h' },
          { id: 'masseo-soltani', prenom: 'Masseo', nom: 'Soltani', contrat: '23h55' },
          { id: 'kevin-soufflet', prenom: 'Kévin', nom: 'Soufflet', contrat: '18h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'cecile-ozcelik', prenom: 'Cécile', nom: 'Ozcelik', contrat: '39h' },
          { id: 'matthias-maurin', prenom: 'Matthias', nom: 'Maurin', contrat: '39h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'loubna-rode', prenom: 'Loubna', nom: 'Rode', contrat: '35h' },
          { id: 'cyrielle-vila-llorens', prenom: 'Cyrielle', nom: 'Vila Llorens', contrat: '35h' },
          { id: 'lea-mallou-noya', prenom: 'Léa', nom: 'Mallou Noya', contrat: '35h' },
          { id: 'salome-tardieu-paugam', prenom: 'Salomé', nom: 'Tardieu--Paugam', contrat: '35h' },
          { id: 'thibaud-herbert', prenom: 'Thibaud', nom: 'Herbert', contrat: '35h' },
          { id: 'fanny-bres', prenom: 'Fanny', nom: 'Bres', contrat: '35h' },
          { id: 'melissa-lux', prenom: 'Mélissa', nom: 'Lux', contrat: '28h' },
          { id: 'ornella-choulet', prenom: 'Ornella', nom: 'Choulet', contrat: '24h' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'gladys-di-meglio', prenom: 'Gladys', nom: 'Di Meglio', contrat: '35h' },
          { id: 'sarah-azelmat', prenom: 'Sarah', nom: 'Azelmat', contrat: '35h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'thomas-moisy', prenom: 'Thomas', nom: 'Moisy', contrat: '35h' },
        ],
      },
    ],
  },
  {
    id: 'montpellier-odysseum',
    label: 'Montpellier Odysseum',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'akim-vandevoir', prenom: 'Akim', nom: 'Vandevoir', contrat: '39h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'matteo-monirith-norodom', prenom: 'Matteo', nom: 'Monirith Norodom', contrat: '35h' },
          { id: 'prune-carbonneau', prenom: 'Prune', nom: 'Carbonneau', contrat: '35h' },
          { id: 'baptiste-huault-lare', prenom: 'Baptiste', nom: 'Huault-Laré', contrat: '35h' },
          { id: 'william-batoul', prenom: 'William', nom: 'Batoul', contrat: '35h' },
          { id: 'dylan-busseret', prenom: 'Dylan', nom: 'Busseret', contrat: '35h' },
          { id: 'mathieu-cavaignac', prenom: 'Mathieu', nom: 'Cavaignac', contrat: '35h' },
          { id: 'zoe-bajja', prenom: 'Zoé', nom: 'Bajja', contrat: '24h' },
          { id: 'camille-magot', prenom: 'Camille', nom: 'Magot', contrat: '24h' },
          { id: 'marvin-ekue', prenom: 'Marvin', nom: 'Ekue', contrat: '24h' },
          { id: 'patricio-aramayo', prenom: 'Patricio', nom: 'Aramayo', contrat: '24h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'stanislas-candela-mahecha', prenom: 'Stanislas', nom: 'Candela Mahecha', contrat: '38h45' },
          { id: 'cecile-ozcelik', prenom: 'Cécile', nom: 'Ozcelik', contrat: '39h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'clement-reboul', prenom: 'Clément', nom: 'Reboul', contrat: '35h' },
          { id: 'manon-marpaux', prenom: 'Manon', nom: 'Marpaux', contrat: '35h' },
          { id: 'capucine-massoptier', prenom: 'Capucine', nom: 'Massoptier', contrat: '35h' },
          { id: 'yael-longo', prenom: 'Yael', nom: 'Longo', contrat: '35h' },
          { id: 'oceane-fari', prenom: 'Océane', nom: 'Fari', contrat: '35h' },
          { id: 'arnaud-casier', prenom: 'Arnaud', nom: 'Casier', contrat: '25h' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'hajar-jbari', prenom: 'Hajar', nom: 'Jbari', contrat: '35h' },
          { id: 'lateecha-calogine', prenom: 'Lateecha', nom: 'Calogine', contrat: '35h' },
          { id: 'ramatou-diallo', prenom: 'Ramatou', nom: 'Diallo', contrat: '35h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'maelyne-de-oliveira', prenom: 'Maëlyne', nom: 'De Oliveira', contrat: '39h' },
        ],
      },
    ],
  },
  {
    id: 'namur',
    label: 'Namur',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'hammed-molade', prenom: 'Hammed', nom: 'Molade' },
          { id: 'matteo-febbrariello', prenom: 'Matteo', nom: 'Febbrariello' },
        ],
      },
      {
        id: 'referent',
        label: 'REFERENT',
        sub: 'Référents',
        collaborateurs: [
          { id: 'molina-detilleux', prenom: 'Molina', nom: 'Detilleux' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'brendon-smeets', prenom: 'Brendon', nom: 'Smeets' },
          { id: 'melina-nicolay', prenom: 'Mélina', nom: 'Nicolay' },
          { id: 'selena-georges', prenom: 'Séléna', nom: 'Georges' },
          { id: 'alexia-thomas', prenom: 'Alexia', nom: 'Thomas' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'sarah-peeters', prenom: 'Sarah', nom: 'Peeters' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'samuel-dufaux', prenom: 'Samuel', nom: 'Dufaux' },
          { id: 'maeliss-de-carne-de-carnava', prenom: 'Maëliss', nom: 'De Carné De Carnava' },
          { id: 'luca-chassagne', prenom: 'Luca', nom: 'Chassagne' },
        ],
      },
    ],
  },
  {
    id: 'nantes',
    label: 'Nantes',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'sophie-courbebaisse', prenom: 'Sophie', nom: 'Courbebaisse', contrat: '39h10' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'shanaelle-lative', prenom: 'Shanaëlle', nom: 'Lative', contrat: '35h20' },
          { id: 'lea-etiembre', prenom: 'Léa', nom: 'Etiembre', contrat: '35h' },
          { id: 'lina-khodja', prenom: 'Lina', nom: 'Khodja', contrat: '35h' },
          { id: 'anatole-poublon', prenom: 'Anatole', nom: 'Poublon', contrat: '35h' },
          { id: 'antonella-dreux', prenom: 'Antonella', nom: 'Dreux', contrat: '24h' },
          { id: 'roukia-ibrahima', prenom: 'Roukia', nom: 'Ibrahima', contrat: '24h' },
          { id: 'louis-gingueneau', prenom: 'Louis', nom: 'Gingueneau', contrat: '24h' },
          { id: 'sofia-boulouane', prenom: 'Sofia', nom: 'Boulouane', contrat: '19h41' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'jalna-jackono', prenom: 'Jalna', nom: 'Jackono', contrat: '39h05' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'clement-belibi', prenom: 'Clément', nom: 'Bélibi', contrat: '39h' },
          { id: 'amanda-ferrandez', prenom: 'Amanda', nom: 'Ferrandez', contrat: '35h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'emilie-defrasne', prenom: 'Emilie', nom: 'Defrasne', contrat: '39h' },
          { id: 'mehdi-galopin', prenom: 'Mehdi', nom: 'Galopin', contrat: '35h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'wenceslas-bachelart', prenom: 'Wenceslas', nom: 'Bachelart', contrat: '35h20' },
          { id: 'matisse-ansel', prenom: 'Matisse', nom: 'Ansel', contrat: '35h10' },
          { id: 'lyza-pot', prenom: 'Lyza', nom: 'Pot', contrat: '35h' },
          { id: 'jemima-saint-jean', prenom: 'Jemima', nom: 'Saint-Jean', contrat: '08h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'melodie-levacher', prenom: 'Mélodie', nom: 'Levacher', contrat: '39h' },
          { id: 'melissa-gross', prenom: 'Mélissa', nom: 'Gross', contrat: '35h' },
          { id: 'maxime-marcon', prenom: 'Maxime', nom: 'Marcon', contrat: '24h' },
        ],
      },
    ],
  },
  {
    id: 'nice',
    label: 'Nice',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'david-voisin', prenom: 'David', nom: 'Voisin', contrat: '39h' },
          { id: 'vichay-rivard', prenom: 'Vichay', nom: 'Rivard', contrat: '39h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'sebastien-oliver', prenom: 'Sébastien', nom: 'Oliver', contrat: '35h' },
          { id: 'iliass-gouli', prenom: 'Iliass', nom: 'Gouli', contrat: '35h' },
          { id: 'enzo-livolsi-seri', prenom: 'Enzo', nom: 'Livolsi--Seri', contrat: '35h' },
          { id: 'vincent-heck', prenom: 'Vincent', nom: 'Heck', contrat: '35h' },
          { id: 'reno-priemen', prenom: 'Reno', nom: 'Priemen', contrat: '35h' },
          { id: 'melissa-rupert', prenom: 'Mélissa', nom: 'Rupert', contrat: '35h' },
          { id: 'laura-garcia', prenom: 'Laura', nom: 'Garcia', contrat: '35h' },
          { id: 'ernest-preira', prenom: 'Ernest', nom: 'Preira', contrat: '35h' },
          { id: 'yanis-maaouia', prenom: 'Yanis', nom: 'Maaouia', contrat: '25h' },
          { id: 'mateo-rostamy-dashty', prenom: 'Matéo', nom: 'Rostamy-Dashty', contrat: '24h' },
          { id: 'tom-reghin', prenom: 'Tom', nom: 'Reghin', contrat: '24h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'laurent-montagono', prenom: 'Laurent', nom: 'Montagono', contrat: '35h' },
          { id: 'riad-fekih', prenom: 'Riad', nom: 'Fekih', contrat: '35h' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'melyssandre-soliman', prenom: 'Melyssandre', nom: 'Soliman', contrat: '35h' },
          { id: 'elma-budimlic', prenom: 'Elma', nom: 'Budimlic', contrat: '35h' },
          { id: 'nathalie-despagne', prenom: 'Nathalie', nom: 'Despagne', contrat: '35h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'olivia-russo', prenom: 'Olivia', nom: 'Russo', contrat: '35h' },
          { id: 'madeleine-heitz', prenom: 'Madeleine', nom: 'Heitz', contrat: '24h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'maxime-sauviat', prenom: 'Maxime', nom: 'Sauviat', contrat: '35h' },
          { id: 'sonia-le-mestre', prenom: 'Sonia', nom: 'Le Mestre', contrat: '24h' },
          { id: 'claudia-alejandra-crowe', prenom: 'Claudia', nom: 'Alejandra Crowe', contrat: '24h' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'clarisse-barrie', prenom: 'Clarisse', nom: 'Barrie', contrat: '35h' },
          { id: 'loulwa-toutayo', prenom: 'Loulwa', nom: 'Toutayo', contrat: '35h' },
          { id: 'lisa-turco', prenom: 'Lisa', nom: 'Turco', contrat: '35h' },
          { id: 'esther-mazzone', prenom: 'Esther', nom: 'Mazzone', contrat: '35h' },
          { id: 'erna-boura', prenom: 'Erna', nom: 'Boura', contrat: '35h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'anaelle-faglin', prenom: 'Anaëlle', nom: 'Faglin', contrat: '24h' },
          { id: 'caroline-abrivard', prenom: 'Caroline', nom: 'Abrivard', contrat: '18h' },
        ],
      },
    ],
  },
  {
    id: 'reims',
    label: 'Reims',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'lucie-le-berre-charton', prenom: 'Lucie', nom: 'Le Berre Charton', contrat: '39h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'jeremie-martin', prenom: 'Jérémie', nom: 'Martin', contrat: '39h' },
          { id: 'lena-cointe', prenom: 'Léna', nom: 'Cointe', contrat: '35h35' },
          { id: 'audrey-pouzergues', prenom: 'Audrey', nom: 'Pouzergues', contrat: '35h' },
          { id: 'erin-gratton', prenom: 'Erin', nom: 'Gratton', contrat: '35h' },
          { id: 'madison-joyez', prenom: 'Madison', nom: 'Joyez', contrat: '35h' },
          { id: 'loic-bernard', prenom: 'Loïc', nom: 'Bernard', contrat: '30h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'matthieu-marsaux', prenom: 'Matthieu', nom: 'Marsaux', contrat: '39h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'vincent-bazin', prenom: 'Vincent', nom: 'Bazin', contrat: '35h' },
          { id: 'felix-robinet', prenom: 'Félix', nom: 'Robinet', contrat: '35h' },
          { id: 'oceane-gossier', prenom: 'Océane', nom: 'Gossier', contrat: '35h' },
          { id: 'orane-petelot', prenom: 'Orane', nom: 'Petelot', contrat: '35h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'sacha-de-antoni', prenom: 'Sacha', nom: 'De Antoni', contrat: '24h' },
        ],
      },
    ],
  },
  {
    id: 'rennes',
    label: 'Rennes',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'thi-huong-pham', prenom: 'Thi', nom: 'Huong Pham', contrat: '39h15' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'alexandre-martin', prenom: 'Alexandre', nom: 'Martin', contrat: '35h' },
          { id: 'marine-lemiere', prenom: 'Marine', nom: 'Lemière', contrat: '35h' },
          { id: 'yanis-miranda-rodrigues', prenom: 'Yanis', nom: 'Miranda Rodrigues', contrat: '35h' },
          { id: 'naweed-shahin', prenom: 'Naweed', nom: 'Shahin', contrat: '34h54' },
          { id: 'alice-ninou-christi-mendy', prenom: 'Alice', nom: 'Ninou Christi Mendy', contrat: '28h' },
          { id: 'swanne-fremond', prenom: 'Swanne', nom: 'Frémond', contrat: '24h' },
          { id: 'cyrielle-fantina', prenom: 'Cyrielle', nom: 'Fantina', contrat: '24h' },
          { id: 'mohamed-malik-ahmed-sugue', prenom: 'Mohamed-Malik', nom: 'Ahmed Sugue', contrat: '24h' },
          { id: 'ngo-tiz-huy', prenom: 'Ngo-Tiz', nom: 'Huy', contrat: '18h' },
          { id: 'sarah-ndjoye', prenom: 'Sarah', nom: 'Ndjoye', contrat: '18h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'romain-rebindaine', prenom: 'Romain', nom: 'Rebindaine', contrat: '35h' },
          { id: 'felicien-tiennot', prenom: 'Félicien', nom: 'Tiennot', contrat: '35h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'maele-boudet', prenom: 'Maële', nom: 'Boudet', contrat: '35h' },
          { id: 'anthony-launay', prenom: 'Anthony', nom: 'Launay', contrat: '32h' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'lisa-kermaidic', prenom: 'Lisa', nom: 'Kermaidic', contrat: '35h' },
          { id: 'albane-galissaire', prenom: 'Albane', nom: 'Galissaire', contrat: '35h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'andy-even', prenom: 'Andy', nom: 'Even', contrat: '35h' },
          { id: 'manjaka-karen-ratsirahonana', prenom: 'Manjaka', nom: 'Karen Ratsirahonana', contrat: '18h' },
          { id: 'sandra-guillet', prenom: 'Sandra', nom: 'Guillet', contrat: '00h' },
        ],
      },
    ],
  },
  {
    id: 'rouen',
    label: 'Rouen',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'aline-thurin', prenom: 'Aline', nom: 'Thurin', contrat: '39h30' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'audrey-mathieu', prenom: 'Audrey', nom: 'Mathieu', contrat: '39h' },
          { id: 'etaine-coquentin', prenom: 'Etaine', nom: 'Coquentin', contrat: '35h' },
          { id: 'leonor-hebert', prenom: 'Léonor', nom: 'Hebert', contrat: '35h' },
          { id: 'morgan-taing', prenom: 'Morgan', nom: 'Taing', contrat: '35h' },
          { id: 'tiffany-bredel', prenom: 'Tiffany', nom: 'Bredel', contrat: '35h' },
          { id: 'antonin-delafosse', prenom: 'Antonin', nom: 'Delafosse', contrat: '34h59' },
          { id: 'louis-amand-berset', prenom: 'Louis', nom: 'Amand--Berset', contrat: '08h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'aurelie-sourisseau', prenom: 'Aurélie', nom: 'Sourisseau', contrat: '39h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'shelly-coquet', prenom: 'Shelly', nom: 'Coquet', contrat: '35h' },
          { id: 'paule-sikaping', prenom: 'Paule', nom: 'Sikaping', contrat: '35h' },
        ],
      },
    ],
  },
  {
    id: 'st-lazare',
    label: 'St Lazare',
    sections: [
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'alexandra-guiraud', prenom: 'Alexandra', nom: 'Guiraud', contrat: '35h' },
          { id: 'steeve-niat', prenom: 'Steeve', nom: 'Niat', contrat: '35h' },
          { id: 'karim-choli', prenom: 'Karim', nom: 'Choli', contrat: '35h' },
          { id: 'jessica-saada', prenom: 'Jessica', nom: 'Saada', contrat: '35h' },
          { id: 'mehdi-maurer', prenom: 'Mehdi', nom: 'Maurer', contrat: '35h' },
          { id: 'sofia-ben-ali', prenom: 'Sofia', nom: 'Ben Ali', contrat: '35h' },
          { id: 'michel-sangon', prenom: 'Michel', nom: 'Sangon', contrat: '35h' },
          { id: 'lilian-herve', prenom: 'Lilian', nom: 'Herve', contrat: '35h' },
          { id: 'joaquim-briant', prenom: 'Joaquim', nom: 'Briant', contrat: '35h' },
          { id: 'mouna-darai', prenom: 'Mouna', nom: 'Darai', contrat: '34h53' },
          { id: 'seydina-ba', prenom: 'Seydina', nom: 'Ba', contrat: '34h50' },
          { id: 'anissa-bourkha', prenom: 'Anissa', nom: 'Bourkha', contrat: '30h' },
          { id: 'grace-beyoko', prenom: 'Grace', nom: 'Beyoko', contrat: '24h15' },
          { id: 'louise-teissie', prenom: 'Louise', nom: 'Teissie', contrat: '24h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'sarah-natacha-gounou-ngoupeyou', prenom: 'Sarah', nom: 'Natacha Gounou Ngoupeyou', contrat: '40h24' },
          { id: 'farah-oueslati', prenom: 'Farah', nom: 'Oueslati', contrat: '40h' },
          { id: 'n-namou-diaby', prenom: 'N\'Namou', nom: 'Diaby', contrat: '40h' },
        ],
      },
      {
        id: 'mo-sav',
        label: 'MO/SAV',
        sub: 'Monteurs · SAV',
        collaborateurs: [
          { id: 'stanley-andre-auger', prenom: 'Stanley', nom: 'Andre-Auger', contrat: '36h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'sonia-berdouk', prenom: 'Sonia', nom: 'Berdouk', contrat: '39h09' },
          { id: 'fabio-lombardo', prenom: 'Fabio', nom: 'Lombardo', contrat: '36h' },
          { id: 'el-hadji-n-diaye', prenom: 'El-Hadji', nom: 'N\'Diaye', contrat: '35h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'pierre-minar', prenom: 'Pierre', nom: 'Minar', contrat: '36h11' },
          { id: 'warren-brelin', prenom: 'Warren', nom: 'Brelin', contrat: '36h05' },
          { id: 'milian-andre', prenom: 'Milian', nom: 'Andre', contrat: '36h' },
          { id: 'enzo-marion', prenom: 'Enzo', nom: 'Marion', contrat: '29h' },
          { id: 'rujita-lamiia-graur', prenom: 'Rujita-Lamiia', nom: 'Graur', contrat: '27h10' },
          { id: 'brandon-ramparsah', prenom: 'Brandon', nom: 'Ramparsah', contrat: '25h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'wissam-tayebi', prenom: 'Wissam', nom: 'Tayebi', contrat: '24h' },
        ],
      },
    ],
  },
  {
    id: 'strasbourg',
    label: 'Strasbourg',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'nathanael-perez', prenom: 'Nathanaël', nom: 'Perez', contrat: '39h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'marine-batt', prenom: 'Marine', nom: 'Batt', contrat: '35h' },
          { id: 'walid-benmohamed', prenom: 'Walid', nom: 'Benmohamed', contrat: '35h' },
          { id: 'sarah-bouchefa', prenom: 'Sarah', nom: 'Bouchefa', contrat: '35h' },
          { id: 'rouzanna-aroutunyan', prenom: 'Rouzanna', nom: 'Aroutunyan', contrat: '24h' },
          { id: 'antoine-biache', prenom: 'Antoine', nom: 'Biache', contrat: '24h' },
          { id: 'yassine-ferrari', prenom: 'Yassine', nom: 'Ferrari', contrat: '22h45' },
          { id: 'anatoly-tarasov', prenom: 'Anatoly', nom: 'Tarasov', contrat: '18h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'caroline-muller', prenom: 'Caroline', nom: 'Muller', contrat: '39h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'joshua-marschal', prenom: 'Joshua', nom: 'Marschal', contrat: '30h' },
          { id: 'monia-lakehal', prenom: 'Monia', nom: 'Lakehal', contrat: '30h' },
          { id: 'helene-koukhtine', prenom: 'Hélène', nom: 'Koukhtine', contrat: '24h' },
          { id: 'neyla-ghmimat', prenom: 'Neyla', nom: 'Ghmimat', contrat: '18h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'maxime-delannoye', prenom: 'Maxime', nom: 'Delannoye', contrat: '34h58' },
        ],
      },
    ],
  },
  {
    id: 'toulon-mayol',
    label: 'Toulon Mayol',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'thibaud-pontone', prenom: 'Thibaud', nom: 'Pontone', contrat: '39h' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'chloe-da-costa', prenom: 'Chloé', nom: 'Da Costa', contrat: '35h' },
          { id: 'aydan-angot', prenom: 'Aydan', nom: 'Angot', contrat: '35h' },
          { id: 'hugo-perez', prenom: 'Hugo', nom: 'Perez', contrat: '35h' },
          { id: 'charlene-verhee', prenom: 'Charlène', nom: 'Verhee', contrat: '35h' },
          { id: 'alexandre-michelet', prenom: 'Alexandre', nom: 'Michelet', contrat: '35h' },
          { id: 'noemie-bolla', prenom: 'Noémie', nom: 'Bolla', contrat: '35h' },
          { id: 'ambre-felix', prenom: 'Ambre', nom: 'Felix', contrat: '35h' },
          { id: 'suzanne-le-boucher', prenom: 'Suzanne', nom: 'Le Boucher', contrat: '24h' },
          { id: 'marine-vauchey', prenom: 'Marine', nom: 'Vauchey', contrat: '24h' },
          { id: 'gilda-tauotaha', prenom: 'Gilda', nom: 'Tauotaha', contrat: '24h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'henri-bourely', prenom: 'Henri', nom: 'Bourely', contrat: '39h' },
          { id: 'marine-rodriguez', prenom: 'Marine', nom: 'Rodriguez', contrat: '39h' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'emma-le-bolu', prenom: 'Emma', nom: 'Le Bolu', contrat: '35h' },
          { id: 'mathieu-lecomte', prenom: 'Mathieu', nom: 'Lecomte', contrat: '35h' },
          { id: 'audrey-erades', prenom: 'Audrey', nom: 'Erades', contrat: '35h' },
          { id: 'mary-lou-msika', prenom: 'Mary-Lou', nom: 'Msika', contrat: '24h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'celia-lachkar', prenom: 'Célia', nom: 'Lachkar', contrat: '35h30' },
          { id: 'sarah-cherni', prenom: 'Sarah', nom: 'Cherni', contrat: '35h' },
          { id: 'lea-julien-portier', prenom: 'Léa', nom: 'Julien-Portier', contrat: '35h' },
        ],
      },
      {
        id: 'apprenti-alternant',
        label: 'APPRENTI/ALTERNANT',
        sub: 'En formation',
        collaborateurs: [
          { id: 'ethan-arruabarrena', prenom: 'Ethan', nom: 'Arruabarrena', contrat: '35h' },
          { id: 'kyara-moal', prenom: 'Kyara', nom: 'Moal', contrat: '35h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'remy-ramanoelina-boutonn', prenom: 'Rémy', nom: 'Ramanoelina Boutonn', contrat: '35h' },
        ],
      },
    ],
  },
  {
    id: 'toulouse-blagnac',
    label: 'Toulouse Blagnac',
    sections: [
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'aubin-rozon', prenom: 'Aubin', nom: 'Rozon', contrat: '35h' },
          { id: 'elycia-jonchere', prenom: 'Elycia', nom: 'Jonchere', contrat: '35h' },
          { id: 'raja-hanane', prenom: 'Raja', nom: 'Hanane', contrat: '35h' },
          { id: 'lucas-derouet', prenom: 'Lucas', nom: 'Derouet', contrat: '35h' },
          { id: 'alexio-rotaru', prenom: 'Alexio', nom: 'Rotaru', contrat: '24h' },
          { id: 'manon-godek', prenom: 'Manon', nom: 'Godek', contrat: '24h' },
          { id: 'flora-raffin', prenom: 'Flora', nom: 'Raffin', contrat: '24h' },
          { id: 'chloe-crampette', prenom: 'Chloé', nom: 'Crampette', contrat: '24h' },
          { id: 'nyhad-chadli', prenom: 'Nyhad', nom: 'Chadli', contrat: '24h' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'guillaume-lemaire', prenom: 'Guillaume', nom: 'Lemaire', contrat: '39h' },
          { id: 'prisca-durand', prenom: 'Prisca', nom: 'Durand', contrat: '39h' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'victor-boulanger', prenom: 'Victor', nom: 'Boulanger', contrat: '35h' },
          { id: 'nina-serin', prenom: 'Nina', nom: 'Serin', contrat: '35h' },
          { id: 'luna-hoppe', prenom: 'Luna', nom: 'Hoppe', contrat: '35h' },
          { id: 'carla-cascabel', prenom: 'Carla', nom: 'Cascabel', contrat: '35h' },
          { id: 'diandra-lake', prenom: 'Diandra', nom: 'Lake', contrat: '35h' },
          { id: 'ellie-aouiche', prenom: 'Ellie', nom: 'Aouiche', contrat: '35h' },
          { id: 'rose-annibali', prenom: 'Rose', nom: 'Annibali', contrat: '24h' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'natacha-bacquet', prenom: 'Natacha', nom: 'Bacquet', contrat: '35h' },
          { id: 'justine-bonaccorsi', prenom: 'Justine', nom: 'Bonaccorsi' },
        ],
      },
    ],
  },
  {
    id: 'toulouse-capitole',
    label: 'Toulouse Capitole',
    sections: [
      {
        id: 'manager',
        label: 'MANAGER',
        sub: 'Encadrement',
        collaborateurs: [
          { id: 'marie-julie-cicuto', prenom: 'Marie-Julie', nom: 'Cicuto' },
        ],
      },
      {
        id: 'cvo',
        label: 'CVO',
        sub: 'Vendeurs',
        collaborateurs: [
          { id: 'nathan-fraize', prenom: 'Nathan', nom: 'Fraize' },
          { id: 'damien-regis', prenom: 'Damien', nom: 'Régis' },
          { id: 'helel-sakji', prenom: 'Hélel', nom: 'Sakji' },
          { id: 'camilia-houssni', prenom: 'Camilia', nom: 'Houssni' },
          { id: 'benjamin-doumenc', prenom: 'Benjamin', nom: 'Doumenc' },
          { id: 'massissilia-sadoune', prenom: 'Massissilia', nom: 'Sadoune' },
          { id: 'vincent-palleau', prenom: 'Vincent', nom: 'Palleau' },
          { id: 'noah-camara', prenom: 'Noah', nom: 'Camara' },
          { id: 'abdellah-nassiri', prenom: 'Abdellah', nom: 'Nassiri' },
          { id: 'victoria-bal', prenom: 'Victoria', nom: 'Bal' },
          { id: 'maxence-sieries', prenom: 'Maxence', nom: 'Sieries' },
          { id: 'marjorie-laher', prenom: 'Marjorie', nom: 'Laher' },
          { id: 'amandine-nicolas', prenom: 'Amandine', nom: 'Nicolas' },
          { id: 'sarah-tourrette-zougani', prenom: 'Sarah', nom: 'Tourrette-Zougani' },
          { id: 'lori-shane-dirian', prenom: 'Lori', nom: 'Shane Dirian' },
          { id: 'farah-ahmed', prenom: 'Farah', nom: 'Ahmed' },
          { id: 'jeanne-pothier', prenom: 'Jeanne', nom: 'Pothier' },
          { id: 'iness-esamani-payares', prenom: 'Iness', nom: 'Esamani--Payares' },
        ],
      },
      {
        id: 'opto',
        label: 'OPTO',
        sub: 'Opticiens',
        collaborateurs: [
          { id: 'pauline-giacomello', prenom: 'Pauline', nom: 'Giacomello' },
          { id: 'lilou-rouen', prenom: 'Lilou', nom: 'Rouen' },
          { id: 'pierre-rajaona', prenom: 'Pierre', nom: 'Rajaona' },
        ],
      },
      {
        id: 'mo',
        label: 'MO',
        sub: 'Monteurs',
        collaborateurs: [
          { id: 'jean-manuel-baubant', prenom: 'Jean-Manuel', nom: 'Baubant' },
          { id: 'anais-antunes', prenom: 'Anaïs', nom: 'Antunes' },
          { id: 'lucile-mazenc', prenom: 'Lucile', nom: 'Mazenc' },
          { id: 'anais-malidor', prenom: 'Anaïs', nom: 'Malidor' },
          { id: 'aliciane-boulfroy', prenom: 'Aliciane', nom: 'Boulfroy' },
          { id: 'leidy-menendez', prenom: 'Leidy', nom: 'Menendez' },
        ],
      },
      {
        id: 'sav',
        label: 'SAV',
        sub: 'Service après-vente',
        collaborateurs: [
          { id: 'nathan-perrin', prenom: 'Nathan', nom: 'Perrin' },
          { id: 'paul-fontaine', prenom: 'Paul', nom: 'Fontaine' },
          { id: 'margot-zeller', prenom: 'Margot', nom: 'Zeller' },
          { id: 'timothe-le-guillou', prenom: 'Timothé', nom: 'Le Guillou' },
          { id: 'marie-payet', prenom: 'Marie', nom: 'Payet' },
          { id: 'joan-feliz-pena', prenom: 'Joan', nom: 'Feliz Pena' },
          { id: 'ismahene-bouktir', prenom: 'Ismahene', nom: 'Bouktir' },
        ],
      },
      {
        id: 'autre',
        label: 'AUTRE',
        sub: 'Postes divers',
        collaborateurs: [
          { id: 'miriam-haddada', prenom: 'Miriam', nom: 'Haddada' },
        ],
      },
      {
        id: 'non-renseigne',
        label: 'NON RENSEIGNÉ',
        sub: 'Poste non visible cette semaine (absence/congé)',
        collaborateurs: [
          { id: 'khyen-ka-durieux', prenom: 'Khyen', nom: 'Ka Durieux' },
          { id: 'antoine-perez', prenom: 'Antoine', nom: 'Perez' },
          { id: 'sourigno-mysaysysongkham', prenom: 'Sourigno', nom: 'Mysaysysongkham' },
          { id: 'thais-naejus', prenom: 'Thais', nom: 'Naejus' },
        ],
      },
    ],
  },

  // Laboratoire de fabrication des verres progressifs — annexe du magasin
  // Paris Châtelet, pas un magasin de vente. Aucun collaborateur pour
  // l'instant (liste à venir), et pas encore d'items de compétence tant que
  // les étapes du process de montage n'ont pas été détaillées.
  {
    id: 'laboratoire-progressif',
    label: 'Laboratoire Progressif',
    photo: '/assets/labo-progressif-chatelet.jpg',
    annexeDe: 'Paris Châtelet',
    sections: [
      {
        id: 'labo',
        label: 'Laboratoire',
        sub: 'Montage verres progressifs',
        collaborateurs: [],
      },
    ],
  },
]

// Regroupement des magasins par région pour l'écran "Suivi magasin" (grille
// formateur) — répartition donnée par Kevin, distincte du découpage Direction
// (regions/magasin_regions en base, utilisé pour les tableaux de bord
// direction/DR). Purement un habillage d'affichage ici, aucun lien DB.
export const STORE_REGION_GROUPS = [
  {
    id: 'belgique', label: 'Belgique', emoji: '🇧🇪',
    color: '#f5b942', bg: 'rgba(245,185,66,0.08)', border: 'rgba(245,185,66,0.35)',
    storeIds: ['charleroi', 'namur', 'ixelles', 'fripiers', 'liege'],
  },
  {
    id: 'nord', label: 'Région Nord (Paris compris)', emoji: '🌆',
    color: '#00abe9', bg: 'rgba(0,171,233,0.08)', border: 'rgba(0,171,233,0.35)',
    storeIds: [
      'nantes', 'lille', 'reims', 'rouen', 'strasbourg', 'rennes',
      'creteil', 'belle-epine', 'cergy', 'bastille', 'chatelet', 'commerce', 'italie-2', 'montparnasse', 'st-lazare',
    ],
  },
  {
    id: 'sud', label: 'Région Sud', emoji: '☀️',
    color: '#fb7185', bg: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.35)',
    storeIds: [
      'bordeaux', 'begles', 'bayonne', 'nice', 'lyon', 'toulon-mayol', 'toulon-avenue-83',
      'marseille-tdp', 'marseille-cannebiere', 'montpellier-comedie', 'montpellier-odysseum',
      'toulouse-blagnac', 'toulouse-capitole',
    ],
  },
]

// Annexes hors région (labo, entrepôt) — affichées à part sur la grille.
// Ne comptent PAS comme des magasins de vente (ni dans le total réseau, ni
// dans le libellé de cette section).
export const STORE_ANNEXES = {
  label: 'Annexes', emoji: '🧪', unitLabel: 'annexe',
  color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.35)',
  storeIds: ['laboratoire-progressif', 'beauchamps-labo-entrepot'],
}

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
    { id: 'verres-progressifs', label: 'Verres progressifs',           category: 'Compétences' },
    { id: 'prises-mesures',     label: 'Prises de mesures',            category: 'Compétences' },
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
    { id: 'verres-progressifs', label: 'Verres progressifs',                 category: 'Compétences' },
    { id: 'prises-mesures',  label: 'Prises de mesures',                     category: 'Compétences' },
    { id: 'backend-mosav',   label: 'Backend',                               category: 'Compétences' },
  ],
  // À détailler une fois les étapes du process de montage fournies par Kevin.
  labo: [],
  // Idem — items de compétence à détailler plus tard (lot 1, nouveaux groupes).
  opto: [],
  mo: [],
  sav: [],
  manager: [],
  referent: [],
  'apprenti-alternant': [],
  autre: [],
  'non-renseigne': [],
}

// Trame d'audit par item — la question à poser / consigne pour le formateur
// ou le manager, affichée dans une fenêtre au clic sur l'item. Fournie par
// Kevin pour la partie CVO ; la partie MO/SAV sera complétée plus tard (les
// items sans entrée ici affichent un message "pas encore rédigée").
//
// Quand c'est possible, le "bloc" de contenu reprend le vrai contenu des
// modules de formation (mêmes textes que ce que voit un formé), affiché en
// un bloc statique — pas de reveal progressif, juste un repère visuel pour
// le formateur/manager pendant l'audit. `missingNote` signale quand une
// partie du contenu demandé n'existe encore dans aucun module.
export const ITEM_GUIDES = {
  // 'lecture-ordonnance' n'utilise plus ce format : voir OrdonnanceExercise.js
  // (exercice interactif de lecture d'ordonnances, pas une simple trame).
  'trame-accueil': {
    instruction: "Le CVO répond point par point (le collaborateur ou toi-même saisit sa réponse). Valide une fois les 4 réponses données, puis affiche la trame pour corriger à l'oral avec lui.",
    steps: TRAME_ACCUEIL_POINTS.map(p => ({ num: p.num, emoji: p.emoji, color: p.color, text: p.text })),
  },
  'offres': {
    instruction: 'Faire présenter chacune des 4 offres par le CVO — contenu repris des modules Offres et Parcours remboursés.',
    questions: [
      'Peux-tu me citer les 4 offres proposées en magasin ?',
      "Quelle est la particularité de l'offre Suprême ?",
      "Dans quel cas conseillerais-tu l'offre 1=1 plutôt que la Classique ?",
      'Qu\'est-ce qui différencie le Pack Plan des autres offres ?',
    ],
    sections: [
      {
        label: 'Suprême', color: '#8B7186',
        bullets: [
          '1 paire achetée, une paire offerte',
          'Choix sur tout le magasin (montures et verres)',
          'Verres Origine France Garantie',
          'Uniquement avec tiers payant complet',
          'Non compatible avec la CSS',
        ],
      },
      {
        label: '1=1', color: '#6aad54',
        bullets: [
          '1 paire achetée',
          'Deuxième paire offerte — de même qualité que la première',
          'Éligible sur tout le magasin — monture et verres au choix',
          'Même en solaire',
        ],
      },
      {
        label: 'Classique', color: '#00abe9',
        bullets: [
          '1 paire achetée',
          'Deuxième paire à -20 %',
          '10 € en 10 minutes — uniquement dans ce parcours',
        ],
      },
      {
        label: 'Pack Plan', color: '#00abe9',
        bullets: [
          '2 paires de lunettes',
          'Monture au choix',
          'Traitement au choix',
          'Solaire inclus — sauf polarisé',
        ],
      },
    ],
  },
  'types-verres': {
    instruction: 'Faire nommer et décrire chaque type de verre — contenu repris du module Types de verres.',
    questions: [
      'Quels types de verres peux-tu me citer ?',
      'Quelle est la différence entre un verre unifocal et un verre progressif ?',
      'À qui proposerais-tu un verre progressif Pulsar Next ?',
    ],
    sections: [
      {
        label: 'Unifocal', color: '#00abe9',
        bullets: ["Correction la plus simple : une seule correction sur toute la surface, pas de zone de flou. Pour un seul problème à corriger, ou pour une paire dédiée à une distance précise chez un presbyte."],
      },
      {
        label: 'Progressif (Pulsar Next)', color: '#7c3aed',
        bullets: ['Verre progressif haut de gamme. Corrige la vision de loin, intermédiaire et de près en une seule paire. Zone de flou réduite au maximum, adaptation plus rapide, confort supérieur aux progressifs classiques.'],
      },
    ],
    missingNote: "Proximité, Clariteens et ZenProtect n'ont pas encore de fiche dans le module Types de verres — à compléter.",
  },
  'traitements': {
    instruction: 'Faire nommer les traitements et ce que chacun comprend.',
    questions: [
      'Quels traitements peux-tu proposer sur les verres ?',
      'Que comprend le traitement Premium par rapport au Basic ?',
      'Quels traitements solaires connais-tu ?',
    ],
    optionGroups: [
      { label: 'Traitements verres', options: ['Basic — anti-rayure', 'Premium — anti-rayure, anti-reflet, anti-salissures, hydrophobe', 'Digital Protect Pro — + anti-lumière bleue'] },
      { label: 'Traitements solaires', options: ['UV Protect cat. 3', 'Polarisé', 'Transition'] },
    ],
    missingNote: "Pas de module dédié aux traitements dans l'app pour l'instant — contenu basé sur ta description, pas sur une vraie slide.",
  },
  'montures': {
    instruction: 'Faire nommer les 3 matériaux de montures — contenu repris du module Connaissances Montures.',
    questions: [
      'Quels sont les 3 matériaux de montures que l\'on retrouve en magasin ?',
      "Quel est l'avantage de l'acétate de cellulose ?",
      'Pourquoi proposer une monture en plastique injecté à un client avec un petit budget ?',
    ],
    sections: [
      {
        label: 'Acétate de cellulose', color: '#00abe9',
        bullets: ['Naturel — fibre de bois ou fibre de coton', 'Premium — large choix de coloris & motifs', 'Modèle unique — chaque paire diffère selon sa plaque', 'Ajustable à chaud — hypoallergénique', 'Prix : de 30 € à 90 €'],
      },
      {
        label: 'Métal', color: '#94a3b8',
        bullets: ['Léger & fin — discret sur le visage', 'Résistant — alliage métallique et revêtement anti-allergique', 'Ajustable facilement — plaquettes et branches réglables', 'Prix : de 30 € à 90 €'],
      },
      {
        label: 'Plastique injecté', color: '#4ade80',
        bullets: ['Moulé à chaud — injecté en série dans un moule industriel', 'Léger & résistant — très bonne durabilité au quotidien', 'Accessible — meilleur rapport qualité/prix de la gamme', 'Prix : 5 € ou 15 €'],
      },
    ],
  },
  'tiers-payants': {
    instruction: "Le formateur fait tout à l'oral et navigue sur le backend.",
    questions: [
      "Comment vérifies-tu les droits d'un client au tiers payant ?",
      "Que fais-tu si le tiers payant du client n'apparaît pas dans le backend ?",
    ],
  },
  'verres-progressifs': {
    instruction: 'Faire réciter ce que le collaborateur a retenu de la formation visio Verres progressifs — contenu repris du module Types de verres.',
    questions: [
      'Quelle est la différence entre un verre progressif et un verre unifocal ?',
      'Quels sont les avantages du Pulsar Next par rapport à un progressif classique ?',
      'À qui proposerais-tu un verre progressif Pulsar Next ?',
    ],
    sections: [
      {
        label: 'Progressif (Pulsar Next)', color: '#7c3aed',
        bullets: ['Verre progressif haut de gamme. Corrige la vision de loin, intermédiaire et de près en une seule paire. Zone de flou réduite au maximum, adaptation plus rapide, confort supérieur aux progressifs classiques.'],
      },
    ],
  },
  'prises-mesures': {
    instruction: 'Faire réciter ce que le collaborateur a retenu de la formation visio Prises de mesures.',
    questions: [
      'Quelles mesures dois-tu prendre pour équiper un client de verres progressifs ?',
      'Comment vérifies-tu qu\'une monture est bien ajustée avant la prise de mesures ?',
    ],
    missingNote: "Pas de module dédié aux prises de mesures dans l'app pour l'instant — à compléter avec le contenu réel de la formation visio.",
  },
  'backend-cvo': {
    instruction: 'Le formateur navigue sur le backend.',
    questions: [
      'Montre-moi comment tu crées une nouvelle commande dans le backend.',
      "Comment retrouves-tu le dossier d'un client déjà venu en magasin ?",
    ],
  },
  'parcours-telephone': {
    instruction: 'Le formateur doit analyser pendant la vente.',
    questions: [
      'Comment démarres-tu un appel avec un client qui souhaite prendre rendez-vous ?',
      'Que dis-tu à un client qui appelle uniquement pour connaître les prix ?',
    ],
  },
  'lpt-vision': {
    instruction: "En parler pendant l'audit en montrant les propres PDM du CVO en question. Discuter de ce qui est bien ou moins bien et comment améliorer — éventuellement le suivre sur le terrain.",
    questions: [
      'Peux-tu me montrer tes derniers PDM sur LPT VISION ?',
      'Qu\'est-ce qui explique tes résultats sur les dernières semaines ?',
    ],
  },
  'lpt-sante': {
    instruction: 'Suivi et analyse sur le terrain.',
    questions: [
      'Comment utilises-tu LPT SANTÉ au quotidien ?',
      'Peux-tu me montrer un dossier santé que tu as suivi récemment ?',
    ],
  },
  'slack': {
    instruction: 'Vérifier sur le terrain si le CVO utilise bien Slack Tiers Payant quand le moment se présente.',
    questions: [
      'Dans quel cas utilises-tu le canal Slack Tiers Payant ?',
      'Peux-tu me montrer un message que tu as envoyé récemment sur ce canal ?',
    ],
  },
  'granit': {
    instruction: 'Lui demander de parler du process Granit et analyser sa réponse.',
    questions: [
      'Peux-tu m\'expliquer le process Granit ?',
      'Dans quelle situation utilises-tu Granit ?',
    ],
  },
}

export const STATUS_META = {
  non_acquis: { label: 'Non acquis', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  en_cours:   { label: 'En cours',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  acquis:     { label: 'Acquis',     color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
}

// ── Notation par item (1 à 5) ────────────────────────────────────
// Le formateur/manager attribue une note à l'issue de l'échange sur un item ;
// le statut (non acquis / en cours / acquis) en découle automatiquement, il
// n'est plus modifiable directement — ça évite de cliquer "Acquis" sans
// vraiment avoir creusé le sujet, et rend l'historique parlant (progression
// des notes d'une visite à l'autre plutôt qu'un simple statut répété).
export const SCORE_ORDER = [1, 2, 3, 4, 5]

export const SCORE_LABELS = {
  1: 'Ne sait pas répondre',
  2: 'Confus, réponses erronées',
  3: 'Partiel, hésite encore',
  4: 'Maîtrise, quelques imprécisions',
  5: 'Maîtrise complète, autonome',
}

export function scoreToStatus(score) {
  if (score == null) return null
  if (score <= 2) return 'non_acquis'
  if (score === 3) return 'en_cours'
  return 'acquis'
}

export function collaborateurFullName(c) {
  return `${c.prenom} ${c.nom}`
}

export function formatDateFr(isoDate) {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}

function monthsSince(isoDate) {
  const start = new Date(isoDate)
  const now = new Date()
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  if (now.getDate() < start.getDate()) months -= 1
  return Math.max(months, 0)
}

function formatMonths(months) {
  if (months < 1) return "< 1 mois"
  const rounded = Math.round(months)
  if (rounded < 12) return `${rounded} mois`
  const years = Math.floor(rounded / 12)
  const rem = rounded % 12
  return rem === 0 ? `${years} an${years > 1 ? 's' : ''}` : `${years} an${years > 1 ? 's' : ''} ${rem} mois`
}

// Ancienneté en mois/années, à partir d'une date d'entrée ISO (YYYY-MM-DD).
export function tenureLabel(isoDate) {
  if (!isoDate) return null
  return formatMonths(monthsSince(isoDate))
}

// ── Estimation de l'âge d'une équipe (indicateur formateur/responsable) ──
export const TEAM_LABELS = {
  cvo: 'Équipe vente', 'mo-sav': 'Équipe support', labo: 'Équipe laboratoire', opto: 'Équipe optique',
  mo: 'Équipe montage', sav: 'Équipe SAV', manager: 'Encadrement', referent: 'Référents',
  'apprenti-alternant': 'Équipe en formation', autre: 'Autres postes', 'non-renseigne': 'Poste non renseigné',
}

const TEAM_AGE_TIERS = [
  { max: 6,        label: 'Jeune équipe',         icon: '🌱', color: '#00abe9' },
  { max: 18,       label: 'Équipe équilibrée',    icon: '⚖️', color: '#f59e0b' },
  { max: Infinity, label: 'Équipe expérimentée',  icon: '🏆', color: '#22c55e' },
]

// Moyenne simple de l'ancienneté (en mois) des collaborateurs d'une section
// qui ont une date d'entrée renseignée. Retourne null si aucune donnée.
export function teamAge(collaborateurs) {
  const months = (collaborateurs || []).filter(c => c.entree).map(c => monthsSince(c.entree))
  if (!months.length) return null
  const avg = months.reduce((a, b) => a + b, 0) / months.length
  const tier = TEAM_AGE_TIERS.find(t => avg < t.max) || TEAM_AGE_TIERS[TEAM_AGE_TIERS.length - 1]
  return { avgMonths: avg, avgLabel: formatMonths(avg), ...tier }
}

// ── Historique d'audits ──────────────────────────────────────────
// Un audit par jour (pas par clic) : plusieurs modifications le même jour
// affinent l'évaluation du jour, mais un nouveau jour crée une nouvelle
// entrée d'historique — rien n'est jamais écrasé d'une visite à l'autre.
export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

