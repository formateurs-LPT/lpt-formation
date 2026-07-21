-- =============================================================================
-- Migration : Belgique (room_type) + quiz libres (notation) + fiches collab
-- Supabase → SQL Editor → Run (idempotent)
--
-- 1) Salles Belgique : pas de nouvelle table — sessions.room_type = 'belgique'
--    (slug déjà géré côté app dans formationCategories.js)
-- 2) open_answers enrichi : notation juste/faux par le formateur
-- 3) free_quiz_questions : sujets / prompts de quiz à réponse libre (optionnel)
-- 4) collaborator_stats : perf agrégées par collab / semaine
-- 5) formation_reports : fiche de fin de formation + CR formateur
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Formateur Thomas (Belgique) — seed si absent
-- -----------------------------------------------------------------------------
insert into public.trainers (login, display_name, pin_hash, avatar_key)
values
  ('thomas', 'Thomas', crypt('0000', gen_salt('bf')), 'thomas')
on conflict (login) do nothing;
-- ⚠️ PIN placeholder : à aligner avec .env / Vercel (NEXT_PUBLIC_TRAINER_THOMAS)

-- -----------------------------------------------------------------------------
-- 1. open_answers — colonnes pour correction formateur
-- -----------------------------------------------------------------------------
create table if not exists public.open_answers (
  id               bigserial primary key,
  session_code     text not null,
  page_id          text not null,
  participant_name text not null default 'Anonyme',
  answer           text not null,
  created_at       timestamptz default now()
);

alter table public.open_answers add column if not exists module_id text;
alter table public.open_answers add column if not exists question_idx int;
alter table public.open_answers add column if not exists question_prompt text;
alter table public.open_answers add column if not exists is_correct boolean; -- null = pas encore noté
alter table public.open_answers add column if not exists graded_by text;
alter table public.open_answers add column if not exists graded_at timestamptz;
alter table public.open_answers add column if not exists trainer_comment text;

create index if not exists idx_open_answers_session_page
  on public.open_answers (session_code, page_id);

create index if not exists idx_open_answers_session_module
  on public.open_answers (session_code, module_id);

create index if not exists idx_open_answers_participant
  on public.open_answers (participant_name);

comment on column public.open_answers.is_correct is
  'null = en attente de correction formateur ; true/false = noté';

-- -----------------------------------------------------------------------------
-- 2. free_quiz_questions — banque / définition de questions ouvertes (optionnel)
--    Permet au formateur de créer des quiz à réponse libre réutilisables
-- -----------------------------------------------------------------------------
create table if not exists public.free_quiz_questions (
  id           uuid primary key default gen_random_uuid(),
  module_id    text,
  page_id      text not null,
  prompt       text not null,
  expected_hint text,          -- aide formateur (pas montré au collab)
  sort_order   int not null default 0,
  active       boolean not null default true,
  created_by   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz
);

create index if not exists idx_free_quiz_questions_module
  on public.free_quiz_questions (module_id, sort_order);

comment on table public.free_quiz_questions is
  'Questions à réponse libre créées / gérées par les formateurs';

-- -----------------------------------------------------------------------------
-- 3. collaborator_stats — perf d’un collab sur une semaine / salle
-- -----------------------------------------------------------------------------
create table if not exists public.collaborator_stats (
  id               uuid primary key default gen_random_uuid(),
  collaborateur    text not null,
  week_date        date not null,                 -- lundi de la semaine formation
  session_code     text,                          -- salle principale (optionnel)
  room_type        text,                          -- presentiel | visio | belgique
  trainer_name     text,
  -- Agrégats QCM
  quiz_correct     int not null default 0,
  quiz_total       int not null default 0,
  -- Agrégats réponses libres notées
  open_correct     int not null default 0,
  open_total       int not null default 0,
  -- Modules
  modules_done     int not null default 0,
  modules_detail   jsonb not null default '[]'::jsonb,
  -- Présence / onboarding
  presence_days    int not null default 0,
  presence_detail  jsonb not null default '{}'::jsonb,
  -- Snapshot brut (scores détaillés)
  quiz_breakdown   jsonb not null default '[]'::jsonb,
  open_breakdown   jsonb not null default '[]'::jsonb,
  updated_at       timestamptz not null default now(),
  unique (collaborateur, week_date)
);

create index if not exists idx_collaborator_stats_week
  on public.collaborator_stats (week_date desc);

create index if not exists idx_collaborator_stats_name
  on public.collaborator_stats (collaborateur);

comment on table public.collaborator_stats is
  'Stats agrégées par collaborateur et semaine de formation (alimente la fiche de fin)';

-- -----------------------------------------------------------------------------
-- 4. formation_reports — fiche fin de formation + compte-rendu formateur
-- -----------------------------------------------------------------------------
create table if not exists public.formation_reports (
  id               uuid primary key default gen_random_uuid(),
  collaborateur    text not null,
  week_date        date not null,
  session_code     text,
  room_type        text,
  trainer_name     text not null,
  -- Snapshot perf (copie au moment de la clôture)
  stats_snapshot   jsonb not null default '{}'::jsonb,
  -- Compte-rendu formateur
  summary          text,                 -- CR libre
  strengths        text,
  improvements     text,
  overall_rating   smallint check (overall_rating is null or overall_rating between 1 and 5),
  recommend_followup boolean default false,
  -- Cycle de vie
  status           text not null default 'draft'
                     check (status in ('draft', 'published', 'archived')),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (collaborateur, week_date, trainer_name)
);

create index if not exists idx_formation_reports_week
  on public.formation_reports (week_date desc);

create index if not exists idx_formation_reports_collab
  on public.formation_reports (collaborateur);

create index if not exists idx_formation_reports_trainer
  on public.formation_reports (trainer_name);

comment on table public.formation_reports is
  'Fiche de fin de formation : perf de la semaine + compte-rendu formateur';

-- -----------------------------------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
  tables text[] := array[
    'open_answers',
    'free_quiz_questions',
    'collaborator_stats',
    'formation_reports'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = t
    ) then
      raise notice 'Table public.% ignorée (n''existe pas)', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'allow all'
    ) then
      execute format(
        'create policy "allow all" on public.%I for all to public using (true) with check (true)',
        t
      );
      raise notice 'Policy "allow all" créée sur public.%', t;
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 6. Vérification rapide
-- -----------------------------------------------------------------------------
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'open_answers',
    'free_quiz_questions',
    'collaborator_stats',
    'formation_reports'
  )
order by table_name;
