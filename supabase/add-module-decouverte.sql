-- Module « La découverte du besoin » (/mes-modules) : ajouté aux modules
-- autorisés. Supabase -> SQL Editor -> Run. Relançable.

alter table public.collaborateurs drop constraint if exists collaborateurs_modules_ouverts_valides;
alter table public.collaborateurs add constraint collaborateurs_modules_ouverts_valides check (
  modules_ouverts <@ array['proximite', 'clariteens', 'zenprotect', 'traitements', 'progressif', 'troisieme-paire', 'transposition', 'granit', 'decouverte', 'positionnement', 'legende']::text[]
);

alter table public.module_resultats drop constraint if exists module_resultats_module_valide;
alter table public.module_resultats add constraint module_resultats_module_valide check (module_id in ('proximite', 'clariteens', 'zenprotect', 'traitements', 'progressif', 'troisieme-paire', 'transposition', 'granit', 'decouverte', 'positionnement', 'legende'));

notify pgrst, 'reload schema';
