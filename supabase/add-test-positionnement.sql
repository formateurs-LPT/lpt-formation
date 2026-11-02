-- Test de positionnement (/mes-modules) : état des lieux des connaissances
-- d'un collaborateur sur tous les thèmes (formation initiale + modules
-- complémentaires). Le formateur l'ouvre depuis la fiche, le collaborateur le
-- passe sur son téléphone, le résultat (score + détail par question et par
-- thème) est enregistré dans module_resultats.
-- Supabase -> SQL Editor -> Run. Relançable.

-- 1. Le formateur peut « ouvrir » le test comme un module.
alter table public.collaborateurs drop constraint if exists collaborateurs_modules_ouverts_valides;
alter table public.collaborateurs add constraint collaborateurs_modules_ouverts_valides check (
  modules_ouverts <@ array['proximite', 'clariteens', 'zenprotect', 'traitements', 'progressif', 'troisieme-paire', 'transposition', 'granit', 'positionnement']::text[]
);

-- 2. Le résultat du test est une ligne de module_resultats (type 'positionnement').
alter table public.module_resultats drop constraint if exists module_resultats_module_valide;
alter table public.module_resultats add constraint module_resultats_module_valide check (module_id in ('proximite', 'clariteens', 'zenprotect', 'traitements', 'progressif', 'troisieme-paire', 'transposition', 'granit', 'positionnement'));

alter table public.module_resultats drop constraint if exists module_resultats_type_valide;
alter table public.module_resultats add constraint module_resultats_type_valide check (
  (type = 'format' and module_id <> 'positionnement' and format_id in ('a', 'b', 'c', 'd') and score is null)
  or (type = 'test' and module_id <> 'positionnement' and format_id is null and total = 12 and score between 0 and 12 and reussi = (score >= 10))
  or (type = 'positionnement' and module_id = 'positionnement' and format_id is null and total between 1 and 60 and score between 0 and total and reussi is null)
);

notify pgrst, 'reload schema';
