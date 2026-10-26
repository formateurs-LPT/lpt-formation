-- Modules après-formation (/mes-modules) : résultats des collaborateurs.
-- Supabase -> SQL Editor -> Run (lancé en prod le 2026-10-26)
--
-- Une ligne par événement :
--   type 'format' : un format d'entraînement (a/b/c/d) terminé pour la 1re fois
--   type 'test'   : une tentative de test (score sur 12, réussi si >= 10)
-- L'état d'un module (formats faits, acquis, meilleur score) se déduit de ces
-- lignes côté app : pas de mise à jour ni de suppression depuis le navigateur.
--
-- RLS : même modèle que exercice_resultats (lecture + insertion anon), mais
-- pas d'update ni de delete, et des contraintes qui bornent ce qu'on peut
-- insérer (module connu, format connu, score cohérent). Relançable.

create table if not exists public.module_resultats (
  id uuid primary key default gen_random_uuid(),
  collaborateur_id uuid not null references public.collaborateurs(id) on delete cascade,
  module_id text not null,
  type text not null,
  format_id text,
  score int,
  total int,
  reussi boolean,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.module_resultats drop constraint if exists module_resultats_module_valide;
alter table public.module_resultats add constraint module_resultats_module_valide check (module_id in ('proximite', 'clariteens', 'zenprotect', 'traitements', 'progressif', 'troisieme-paire', 'transposition', 'granit'));

alter table public.module_resultats drop constraint if exists module_resultats_type_valide;
alter table public.module_resultats add constraint module_resultats_type_valide check ((type = 'format' and format_id in ('a', 'b', 'c', 'd') and score is null) or (type = 'test' and format_id is null and total = 12 and score between 0 and 12 and reussi = (score >= 10)));

create index if not exists idx_module_resultats_collaborateur on public.module_resultats (collaborateur_id, module_id, created_at desc);

alter table public.module_resultats enable row level security;

drop policy if exists "allow read" on public.module_resultats;
create policy "allow read" on public.module_resultats for select to public using (true);

drop policy if exists "allow insert" on public.module_resultats;
create policy "allow insert" on public.module_resultats for insert to public with check (true);

grant select, insert on public.module_resultats to anon, authenticated;

notify pgrst, 'reload schema';
