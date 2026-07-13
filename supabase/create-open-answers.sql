-- =============================================================================
-- Table open_answers — réponses libres des participants aux questions ouvertes
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.open_answers (
  id        bigserial primary key,
  session_code      text not null,
  page_id           text not null,
  participant_name  text not null default 'Anonyme',
  answer            text not null,
  created_at        timestamptz default now()
);

create index if not exists idx_open_answers_session_page
  on public.open_answers (session_code, page_id);

-- RLS allow all (même pattern que les autres tables)
alter table public.open_answers enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'open_answers'
      and policyname = 'allow all'
  ) then
    execute 'create policy "allow all" on public.open_answers for all to public using (true) with check (true)';
  end if;
end $$;
