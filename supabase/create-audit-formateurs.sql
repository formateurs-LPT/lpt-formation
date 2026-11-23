-- Audit compétences formateurs : résultats des formateurs sur les modules
-- d'audit (contenu repris des modules d'onboarding, pour vérifier qu'un
-- formateur ne dit pas de coquilles en le présentant).
-- Même modèle que module_resultats (modules après-formation collaborateurs),
-- mais côté formateur : trainer_id au lieu de collaborateur_id.
--
-- Une ligne par événement :
--   type 'format' : un format d'entraînement (a/b/c/d) terminé pour la 1re fois
--   type 'test'   : une tentative de test (score sur 12, réussi si >= 10)
-- L'état se déduit de ces lignes côté app : pas de update ni delete depuis
-- le navigateur.

create table if not exists public.audit_formateurs_resultats (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.trainers(id) on delete cascade,
  module_id text not null,
  type text not null,
  format_id text,
  score int,
  total int,
  reussi boolean,
  details jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_formateurs_resultats drop constraint if exists audit_formateurs_resultats_module_valide;
alter table public.audit_formateurs_resultats add constraint audit_formateurs_resultats_module_valide check (module_id in ('entreprise'));

alter table public.audit_formateurs_resultats drop constraint if exists audit_formateurs_resultats_type_valide;
alter table public.audit_formateurs_resultats add constraint audit_formateurs_resultats_type_valide check ((type = 'format' and format_id in ('a', 'b', 'c', 'd') and score is null) or (type = 'test' and format_id is null and total = 12 and score between 0 and 12 and reussi = (score >= 10)));

create index if not exists idx_audit_formateurs_resultats_trainer on public.audit_formateurs_resultats (trainer_id, module_id, created_at desc);

alter table public.audit_formateurs_resultats enable row level security;

drop policy if exists "allow read" on public.audit_formateurs_resultats;
create policy "allow read" on public.audit_formateurs_resultats for select to public using (true);

drop policy if exists "allow insert" on public.audit_formateurs_resultats;
create policy "allow insert" on public.audit_formateurs_resultats for insert to public with check (true);

grant select, insert on public.audit_formateurs_resultats to anon, authenticated;

notify pgrst, 'reload schema';
