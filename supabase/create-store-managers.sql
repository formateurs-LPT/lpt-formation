-- =============================================================================
-- Table : identifiants des managers magasin (dashboard /manager)
-- ID = première lettre du prénom + nom de famille, code = code postal du magasin.
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.store_managers (
  id uuid primary key default gen_random_uuid(),
  login text unique not null,
  code text not null,
  magasin text not null,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_store_managers_magasin on public.store_managers(magasin);

alter table public.store_managers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'store_managers' and policyname = 'allow all'
  ) then
    create policy "allow all" on public.store_managers
      for all to public using (true) with check (true);
  end if;
end $$;

-- Pilote Bayonne — ajouter d'autres managers plus tard directement dans
-- cette table (Table Editor Supabase), pas besoin de redéployer le code.
-- Format de code retenu : préfixe "LPT" (majuscules obligatoires, la
-- comparaison est sensible à la casse) + code postal du magasin.
insert into public.store_managers (login, code, magasin, display_name)
values
  ('cdeny', 'LPT64600', 'bayonne', 'Charlotte Deny'),
  ('mbabin', 'LPT64600', 'bayonne', 'Maryline Babin')
on conflict (login) do nothing;
