-- Modules après-formation : le formateur ouvre les modules un par un pour
-- chaque collaborateur (fiche du suivi magasin). Le collaborateur ne voit sur
-- /mes-modules que les modules ouverts pour lui.
-- Supabase -> SQL Editor -> Run
--
-- Ajout d'une seule colonne, vide par défaut : aucun module n'est ouvert tant
-- que le formateur ne l'a pas décidé. Rien d'autre n'est modifié dans la table.

alter table public.collaborateurs
  add column if not exists modules_ouverts text[] not null default '{}'::text[];

alter table public.collaborateurs drop constraint if exists collaborateurs_modules_ouverts_valides;
alter table public.collaborateurs add constraint collaborateurs_modules_ouverts_valides check (
  modules_ouverts <@ array['proximite', 'clariteens', 'zenprotect', 'traitements', 'progressif', 'troisieme-paire', 'transposition', 'granit']::text[]
);

notify pgrst, 'reload schema';
