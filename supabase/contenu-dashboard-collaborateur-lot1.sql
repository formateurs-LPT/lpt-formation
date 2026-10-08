-- Dashboard collaborateur — Lot 1 de contenu reel (7 themes)
-- Source : contenu DEJA VALIDE et utilise en formation live (quizJ1Data.js,
-- quizJ2Data.js, quizFinalData.js) -- aucune information inventee, juste
-- reformatee pour le format cours/exercice async. Couvre les themes communs
-- a CVO et CVO-Belgique (sauf tiers-payants, France uniquement).
--
-- Themes NON couverts ici (aucune source fiable disponible dans l'app pour
-- l'instant, a completer avec Quentin/l'equipe formation) : traitements,
-- prises-mesures, backend-cvo, parcours-telephone, lpt-vision, lpt-sante,
-- lpt-care, slack, granit, et tous les themes MO/SAV (machines,
-- etapes-montage, outlet, upgrade, retrait, raz, suivi-commande,
-- reglage-monture, backend-mosav).

-- Lecture ordonnance
insert into public.cours (theme_id, titre, ordre, contenu) values (
  'lecture-ordonnance',
  'Lire une ordonnance',
  1,
  '[
    {"type":"texte","valeur":"Sur une ordonnance : OD = oeil droit, OG = oeil gauche."},
    {"type":"texte","valeur":"Les 4 troubles de vue principaux. Myope : flou de loin. Hypermetrope : flou a toutes distances (l oeil accommode en permanence). Astigmate : vision deformee a toutes distances. Presbyte : flou de pres (a partir de 45 ans en moyenne)."},
    {"type":"texte","valeur":"Repere simple pour reconnaitre un presbyte sans lui parler : il tient son telephone ou un document a bout de bras pour lire, ou porte des lunettes de lecture sur le nez."}
  ]'::jsonb
);
with new_exercice as (
  insert into public.exercices (theme_id, titre, ordre)
  values ('lecture-ordonnance', 'QCM Lecture ordonnance', 1)
  returning id
)
insert into public.exercice_questions (exercice_id, ordre, type, enonce, data, explication)
select id, 1, 'qcm',
  'Sur une ordonnance, OD designe :',
  '{"options":["L oeil gauche","L oeil droit","Les deux yeux","La distance de lecture recommandee"],"correct":1}'::jsonb,
  'OD = Oeil Droit, OG = Oeil Gauche.'
from new_exercice
union all
select id, 2, 'qcm',
  'Quel trouble visuel correspond a une vision floue uniquement de loin ?',
  '{"options":["Myopie","Hypermetropie","Astigmatisme","Presbytie"],"correct":0}'::jsonb,
  'La myopie affecte principalement la vision de loin.'
from new_exercice;

-- Trame d accueil
insert into public.cours (theme_id, titre, ordre, contenu) values (
  'trame-accueil',
  'La trame d accueil',
  1,
  '[
    {"type":"texte","valeur":"1. Bonjour et bienvenue chez Lunettes Pour Tous, mon prenom est [...]. 2. Connaissez-vous le concept ? 3. Presentation de la promesse 10 minutes (avec ou sans ordonnance). 4. Je vous inscris en examen de vue ? C est gratuit et sans rendez-vous."},
    {"type":"texte","valeur":"Le point cle a ne jamais oublier en fin de trame : proposer systematiquement l examen de vue gratuit et sans rendez-vous."}
  ]'::jsonb
);
with new_exercice as (
  insert into public.exercices (theme_id, titre, ordre)
  values ('trame-accueil', 'QCM Trame d accueil', 1)
  returning id
)
insert into public.exercice_questions (exercice_id, ordre, type, enonce, data, explication)
select id, 1, 'qcm',
  'Quelle est la premiere phrase de la trame d accueil chez Lunettes Pour Tous ?',
  '{"options":["Bonjour et bienvenue chez Lunettes Pour Tous","Bonjour, vous avez votre ordonnance ?","Bonjour, comment puis-je vous aider ?","Bonjour, avez-vous deja visite notre boutique ?"],"correct":0}'::jsonb,
  null
from new_exercice
union all
select id, 2, 'qcm',
  'En fin de trame d accueil, que propose-t-on systematiquement au client ?',
  '{"options":["Une remise sur les montures","L examen de vue gratuit et sans rendez-vous","Un rendez-vous payant avec un opticien","Un essai de montures en boutique"],"correct":1}'::jsonb,
  null
from new_exercice;

-- Offres
insert into public.cours (theme_id, titre, ordre, contenu) values (
  'offres',
  'Les offres Lunettes Pour Tous',
  1,
  '[
    {"type":"texte","valeur":"Offre Classique : la premiere paire commence a 10 euros, avec -20% sur la seconde paire."},
    {"type":"texte","valeur":"Parcours 1=1 : la seconde paire est offerte, de meme qualite que la premiere (pas une offre au rabais)."},
    {"type":"texte","valeur":"Pack Plan : 2 paires sans correction, monture et traitement au choix, pour 95 euros."},
    {"type":"texte","valeur":"Parcours Supreme : possible uniquement en tiers payant complet."}
  ]'::jsonb
);
with new_exercice as (
  insert into public.exercices (theme_id, titre, ordre)
  values ('offres', 'QCM Les offres', 1)
  returning id
)
insert into public.exercice_questions (exercice_id, ordre, type, enonce, data, explication)
select id, 1, 'qcm',
  'Le parcours 1=1, c est :',
  '{"options":["Une paire a -50% du tarif normal","Deuxieme paire identique offerte sans conditions","Deuxieme paire offerte, de meme qualite que la premiere","Deux paires au prix d une, verres uniquement"],"correct":2}'::jsonb,
  null
from new_exercice
union all
select id, 2, 'qcm',
  'Le Pack Plan, c est :',
  '{"options":["2 paires sans correction, monture et traitement au choix pour 95 euros","2 paires avec correction pour 95 euros","1 paire avec correction premium pour 95 euros","4 paires au prix de 2 pour 95 euros"],"correct":0}'::jsonb,
  null
from new_exercice;

-- Types de verres
insert into public.cours (theme_id, titre, ordre, contenu) values (
  'types-verres',
  'Types de verres et delais',
  1,
  '[
    {"type":"texte","valeur":"Verres unifocaux : fabriques en 10 minutes en boutique, avec ou sans ordonnance."},
    {"type":"texte","valeur":"Verres progressifs : fabriques en 9 jours (ou 24 a 48h pour certaines corrections fortes necessitant un verre hors stock)."},
    {"type":"texte","valeur":"Garantie adaptation de 100 jours sur les verres progressifs (satisfait ou echange)."}
  ]'::jsonb
);
with new_exercice as (
  insert into public.exercices (theme_id, titre, ordre)
  values ('types-verres', 'QCM Types de verres', 1)
  returning id
)
insert into public.exercice_questions (exercice_id, ordre, type, enonce, data, explication)
select id, 1, 'qcm',
  'Quel est le delai de fabrication des lunettes unifocales chez Lunettes Pour Tous ?',
  '{"options":["10 minutes","24 heures","3 jours","9 jours"],"correct":0}'::jsonb,
  null
from new_exercice
union all
select id, 2, 'qcm-multi',
  'Quel est le delai de fabrication d un verre progressif chez Lunettes Pour Tous ?',
  '{"options":["10 minutes","9 jours","24 a 48 heures","6 mois"],"correct":[1,2]}'::jsonb,
  'Les verres progressifs sont fabriques en 9 jours, ou 24 a 48h pour certaines corrections necessitant un verre hors stock.'
from new_exercice;

-- Montures
insert into public.cours (theme_id, titre, ordre, contenu) values (
  'montures',
  'Les montures',
  1,
  '[
    {"type":"texte","valeur":"Trois categories de montures selon la matiere de fabrication : Injecte, Acetate, Metal."},
    {"type":"texte","valeur":"L Injecte est la matiere entree de gamme, la plus abordable."}
  ]'::jsonb
);
with new_exercice as (
  insert into public.exercices (theme_id, titre, ordre)
  values ('montures', 'QCM Montures', 1)
  returning id
)
insert into public.exercice_questions (exercice_id, ordre, type, enonce, data, explication)
select id, 1, 'qcm',
  'Parmi ces materiaux de montures, lequel est l entree de gamme la plus abordable ?',
  '{"options":["Acetate","Metal","Injecte"],"correct":2}'::jsonb,
  null
from new_exercice
union all
select id, 2, 'qcm-multi',
  'Quelles sont les 3 categories de montures proposees selon la matiere de fabrication ?',
  '{"options":["Acetate","Metal","Injecte","Carbone"],"correct":[0,1,2]}'::jsonb,
  null
from new_exercice;

-- Verres progressifs
insert into public.cours (theme_id, titre, ordre, contenu) values (
  'verres-progressifs',
  'Le verre progressif',
  1,
  '[
    {"type":"texte","valeur":"Le verre progressif comporte 3 zones de vision : loin, intermediaire et pres."},
    {"type":"texte","valeur":"Il est recommande pour la presbytie."},
    {"type":"texte","valeur":"Delai de fabrication : 9 jours (ou 24 a 48h selon la correction)."},
    {"type":"texte","valeur":"Garantie adaptation de 100 jours, satisfait ou echange."}
  ]'::jsonb
);
with new_exercice as (
  insert into public.exercices (theme_id, titre, ordre)
  values ('verres-progressifs', 'QCM Verres progressifs', 1)
  returning id
)
insert into public.exercice_questions (exercice_id, ordre, type, enonce, data, explication)
select id, 1, 'qcm',
  'Le verre progressif est recommande pour quel trouble visuel ?',
  '{"options":["La myopie simple","La presbytie","L astigmatisme fort uniquement","L hypermetropie legere"],"correct":1}'::jsonb,
  null
from new_exercice
union all
select id, 2, 'qcm',
  'Combien de zones de vision possede un verre progressif ?',
  '{"options":["2","3","4","5"],"correct":1}'::jsonb,
  'Loin, intermediaire et pres.'
from new_exercice;

-- Tiers payants (CVO France uniquement, absent de cvo-belgique)
insert into public.cours (theme_id, titre, ordre, contenu) values (
  'tiers-payants',
  'Tiers payant et remboursement',
  1,
  '[
    {"type":"texte","valeur":"Pour beneficier d un remboursement optique, il faut une ordonnance valable ET une mutuelle ou la CSS (Complementaire Sante Solidaire)."},
    {"type":"texte","valeur":"La CSS remplace la mutuelle complementaire pour les beneficiaires eligibles."},
    {"type":"texte","valeur":"Chez Lunettes Pour Tous, le reste a charge apres remboursement complet est de 0 euro."},
    {"type":"texte","valeur":"Delai de renouvellement : 2 ans a partir de 16 ans. Renouvellement adapte possible apres 1 an et 1 jour."}
  ]'::jsonb
);
with new_exercice as (
  insert into public.exercices (theme_id, titre, ordre)
  values ('tiers-payants', 'QCM Tiers payant', 1)
  returning id
)
insert into public.exercice_questions (exercice_id, ordre, type, enonce, data, explication)
select id, 1, 'qcm',
  'Pour beneficier d un remboursement optique, il faut :',
  '{"options":["Avoir une ordonnance valable ET une mutuelle ou la CSS","Seulement avoir une mutuelle a jour","Seulement avoir une ordonnance valable","Avoir plus de 18 ans et une carte Vitale"],"correct":0}'::jsonb,
  null
from new_exercice
union all
select id, 2, 'qcm',
  'Chez Lunettes Pour Tous, le reste a charge apres remboursement complet est de :',
  '{"options":["Variable selon la mutuelle","50 euros maximum","100 euros maximum","0 euro"],"correct":3}'::jsonb,
  null
from new_exercice;

notify pgrst, 'reload schema';
