-- =============================================================================
-- Table : comptes RH (espace /rh)
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.rh_accounts (
  id uuid primary key default gen_random_uuid(),
  login text unique not null,
  code text not null,
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.rh_accounts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rh_accounts' and policyname = 'allow all'
  ) then
    create policy "allow all" on public.rh_accounts
      for all to public using (true) with check (true);
  end if;
end $$;

-- Comptes de test — à remplacer par les vrais comptes RH quand ils seront connus.
insert into public.rh_accounts (login, code, display_name)
values
  ('kevin',   '3442', 'Kevin Dupuy'),
  ('quentin', '3930', 'Quentin Bahougne')
on conflict (login) do nothing;
