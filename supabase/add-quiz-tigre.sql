-- Quiz « T'es un tigre ? » (/mes-modules) : 40 questions, ouvert depuis la
-- fiche comme le Quiz Légende, résultat dans module_resultats (type 'tigre').
-- Supabase -> SQL Editor -> Run. Relançable.

alter table public.collaborateurs drop constraint if exists collaborateurs_modules_ouverts_valides;
alter table public.collaborateurs add constraint collaborateurs_modules_ouverts_valides check (
  modules_ouverts <@ array['proximite', 'clariteens', 'zenprotect', 'traitements', 'progressif', 'troisieme-paire', 'transposition', 'granit', 'decouverte', 'positionnement', 'legende', 'tigre']::text[]
);

alter table public.module_resultats drop constraint if exists module_resultats_module_valide;
alter table public.module_resultats add constraint module_resultats_module_valide check (module_id in ('proximite', 'clariteens', 'zenprotect', 'traitements', 'progressif', 'troisieme-paire', 'transposition', 'granit', 'decouverte', 'positionnement', 'legende', 'tigre'));

alter table public.module_resultats drop constraint if exists module_resultats_type_valide;
alter table public.module_resultats add constraint module_resultats_type_valide check (
  (type = 'format' and module_id not in ('positionnement', 'legende', 'tigre') and format_id in ('a', 'b', 'c', 'd') and score is null)
  or (type = 'test' and module_id not in ('positionnement', 'legende', 'tigre') and format_id is null and total = 12 and score between 0 and 12 and reussi = (score >= 10))
  or (type in ('positionnement', 'legende', 'tigre') and module_id = type and format_id is null and total between 1 and 60 and score between 0 and total and reussi is null)
);

notify pgrst, 'reload schema';
