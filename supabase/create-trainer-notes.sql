-- =============================================================================
-- Table optionnelle : notes partagées entre formateurs (widget dashboard)
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.trainer_notes (
  id bigserial primary key,
  session_code text not null,
  author text,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_trainer_notes_session on public.trainer_notes(session_code);

alter table public.trainer_notes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'trainer_notes' and policyname = 'allow all'
  ) then
    create policy "allow all" on public.trainer_notes
      for all to public using (true) with check (true);
  end if;
end $$;
