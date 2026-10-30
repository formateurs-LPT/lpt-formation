-- Détail des réponses au test des modules complémentaires lancés en session
-- (une entrée par question : { libelle, correct }), affiché dans le récap du
-- formateur. Colonne optionnelle : sans elle, seul le score est enregistré.
alter table module_results add column if not exists details jsonb;
