-- =============================================================================
-- Table open_answers — réponses libres + correction formateur
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.open_answers (
  id               bigserial primary key,
  session_code     text not null,
  page_id          text not null,
  participant_name text not null default 'Anonyme',
  answer           text not null,
  module_id        text,
  question_idx     int,
  question_prompt  text,
  is_correct       boolean,          -- null = pas encore noté
  graded_by        text,
  graded_at        timestamptz,
  trainer_comment  text,
  created_at       timestamptz default now()
);

alter table public.open_answers add column if not exists module_id text;
alter table public.open_answers add column if not exists question_idx int;
alter table public.open_answers add column if not exists question_prompt text;
alter table public.open_answers add column if not exists is_correct boolean;
alter table public.open_answers add column if not exists graded_by text;
alter table public.open_answers add column if not exists graded_at timestamptz;
alter table public.open_answers add column if not exists trainer_comment text;

create index if not exists idx_open_answers_session_page
  on public.open_answers (session_code, page_id);

create index if not exists idx_open_answers_session_module
  on public.open_answers (session_code, module_id);

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
