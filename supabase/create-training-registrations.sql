-- =============================================================================
-- Table : inscriptions aux formations visio complémentaires (tiers payant,
-- verres progressifs, prises de mesures...) — un manager inscrit un ou
-- plusieurs collaborateurs sur un créneau (lundi + heure), les formateurs
-- sont notifiés côté dashboard.
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.training_registrations (
  id uuid primary key default gen_random_uuid(),
  magasin text not null,
  collaborateur_id text not null,
  collaborateur_nom text not null,
  theme text not null,
  session_date date not null,
  session_heure text not null,
  registered_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_training_reg_session on public.training_registrations(session_date, session_heure);
create index if not exists idx_training_reg_magasin on public.training_registrations(magasin);

alter table public.training_registrations enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'training_registrations' and policyname = 'allow all'
  ) then
    create policy "allow all" on public.training_registrations
      for all to public using (true) with check (true);
  end if;
end $$;
