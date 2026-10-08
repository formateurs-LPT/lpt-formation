-- Reporting hebdo : commentaires confidentiels (manager uniquement)
-- Supabase -> SQL Editor -> Run

alter table public.notes_terrain
  add column if not exists confidentiel boolean not null default false;

create table if not exists public.reportings_hebdo_confidentiel (
  id uuid primary key default gen_random_uuid(),
  reporting_id uuid not null references public.reportings_hebdo(id) on delete cascade,
  contenu_structure jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create unique index if not exists idx_reportings_hebdo_confidentiel_reporting
  on public.reportings_hebdo_confidentiel(reporting_id);
alter table public.reportings_hebdo_confidentiel enable row level security;
create policy "allow all" on public.reportings_hebdo_confidentiel for all to public using (true) with check (true);
grant select, insert, update, delete on public.reportings_hebdo_confidentiel to anon, authenticated;

notify pgrst, 'reload schema';
