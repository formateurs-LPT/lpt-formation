-- EXEMPLE -- a lancer UNIQUEMENT en environnement de test, jamais en
-- production. Insere un theme de demonstration ('offres') avec un cours et
-- un exercice QCM (une question a bonne reponse unique + une a reponses
-- multiples). Nettoyage : voir tout en bas (commente).

insert into public.cours (theme_id, titre, ordre, contenu) values (
  'offres',
  'EXEMPLE - Les 4 offres Lunettes Pour Tous',
  1,
  '[
    {"type":"texte","valeur":"Ceci est un cours EXEMPLE pour tester le dashboard. Lunettes Pour Tous propose 4 offres principales, a connaitre parfaitement pour bien conseiller un client."},
    {"type":"texte","valeur":"1. Offre Essentielle - le premier prix, verres unifocaux basiques. 2. Offre Confort - verres avec traitements anti-reflet et anti-rayure. 3. Offre Premium - verres haut de gamme, montures de marque. 4. Offre Progressive - dediee aux verres progressifs."},
    {"type":"texte","valeur":"Le bon reflexe : toujours partir du besoin du client avant de proposer une offre, jamais l inverse."}
  ]'::jsonb
);

with new_exercice as (
  insert into public.exercices (theme_id, titre, ordre)
  values ('offres', 'EXEMPLE - QCM Les offres', 1)
  returning id
)
insert into public.exercice_questions (exercice_id, ordre, type, enonce, data, explication)
select id, 1, 'qcm',
  'Quelle offre propose des traitements anti-reflet et anti-rayure ?',
  '{"options":["Essentielle","Confort","Premium","Progressive"],"correct":1}'::jsonb,
  'Offre Confort inclut les traitements anti-reflet et anti-rayure.'
from new_exercice
union all
select id, 2, 'qcm-multi',
  'Parmi ces offres, lesquelles concernent des verres unifocaux (pas progressifs) ?',
  '{"options":["Essentielle","Confort","Premium","Progressive"],"correct":[0,1,2]}'::jsonb,
  'Seule l offre Progressive concerne les verres progressifs - les trois autres sont en unifocal.'
from new_exercice;

-- Nettoyage (a lancer quand tu as fini de tester) :
-- delete from public.exercices where titre like 'EXEMPLE%';
-- delete from public.cours where titre like 'EXEMPLE%';
