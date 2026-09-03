-- =============================================================================
-- Table : suivi magasin — progression par collaborateur / item de compétence
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.store_followup_progress (
  id bigserial primary key,
  store text not null,
  collaborateur text not null,
  item_id text not null,
  status text not null default 'non_acquis',
  note text,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique (store, collaborateur, item_id)
);

create index if not exists idx_store_followup_store on public.store_followup_progress(store);
create index if not exists idx_store_followup_collab on public.store_followup_progress(store, collaborateur);

alter table public.store_followup_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'store_followup_progress' and policyname = 'allow all'
  ) then
    create policy "allow all" on public.store_followup_progress
      for all to public using (true) with check (true);
  end if;
end $$;
