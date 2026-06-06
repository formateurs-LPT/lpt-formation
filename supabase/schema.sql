-- =============================================================================
-- LPT Formation — schéma COMPLET (nouveau projet vide uniquement)
--
-- ⚠️  BDD DÉJÀ EN PROD (sessions, participants, employees, etc.) ?
--     Utilisez plutôt : supabase/migration-from-current.sql
--     (ne pas exécuter ce fichier sur la prod actuelle)
-- =============================================================================

-- Extensions utiles
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. FORMATEURS (remplace les codes dans .env / Vercel)
-- -----------------------------------------------------------------------------
create table if not exists public.trainers (
  id uuid primary key default gen_random_uuid(),
  login text not null unique,
  display_name text not null,
  pin_hash text not null,
  avatar_key text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

comment on table public.trainers is 'Comptes formateurs (login + PIN hashé). Ne jamais stocker le PIN en clair.';

-- -----------------------------------------------------------------------------
-- 2. SESSIONS (code généré à chaque lancement)
-- -----------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  trainer_id uuid references public.trainers(id) on delete set null,
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'ended')),
  current_step int not null default -1,
  active_scenario int not null default 0,
  active_module text,
  module_page int not null default 0,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists idx_sessions_code on public.sessions(code);
create index if not exists idx_sessions_trainer on public.sessions(trainer_id);
create index if not exists idx_sessions_status on public.sessions(status);

comment on column public.sessions.code is 'Code court affiché au formateur (ex. K7M2), saisi par les participants';

-- -----------------------------------------------------------------------------
-- 3. PARTICIPANTS (liés à une session par code)
-- -----------------------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  session_code text not null references public.sessions(code) on delete cascade,
  name text not null,
  joined_at timestamptz not null default now(),
  unique (session_code, name)
);

create index if not exists idx_participants_session on public.participants(session_code);

-- -----------------------------------------------------------------------------
-- 4. DONNÉES FORMATION (existantes dans l’app — alignées sur session_code)
-- -----------------------------------------------------------------------------

create table if not exists public.quiz_answers (
  id bigserial primary key,
  session_code text not null references public.sessions(code) on delete cascade,
  collaborateur text,
  participant_name text,
  question_idx int,
  answer text,
  created_at timestamptz default now()
);

create table if not exists public.quiz_results (
  id bigserial primary key,
  session_code text not null references public.sessions(code) on delete cascade,
  participant_name text not null,
  score int default 0,
  total int default 0,
  mode text,
  updated_at timestamptz default now(),
  unique (session_code, participant_name)
);

create table if not exists public.scenario_responses (
  id bigserial primary key,
  session_code text not null references public.sessions(code) on delete cascade,
  scenario_idx int not null,
  participant_name text not null,
  response text,
  created_at timestamptz default now(),
  unique (session_code, scenario_idx, participant_name)
);

create table if not exists public.module_results (
  id bigserial primary key,
  session_code text,
  collaborateur text,
  module text,
  score int,
  total int,
  created_at timestamptz default now()
);

create table if not exists public.session_history (
  id uuid primary key default gen_random_uuid(),
  session_code text not null,
  session_date timestamp without time zone,
  trainer_name text,
  participants jsonb,
  quiz_results jsonb,
  scenario_responses jsonb
);

create table if not exists public.trainer_notes (
  id bigserial primary key,
  session_code text not null,
  author text,
  content text not null,
  created_at timestamptz default now()
);

create table if not exists public.trainer_weather (
  trainer text primary key,
  weather text,
  label text,
  updated_at timestamptz default now()
);

create table if not exists public.trainer_state (
  trainer text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.onboarding_sessions (
  id bigserial primary key,
  week_label text,
  trainer_name text,
  payload jsonb,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 5. SEED formateurs (PIN = 3442 pour kevin — à changer en prod)
--    Hash : crypt(pin, gen_salt('bf'))
-- -----------------------------------------------------------------------------
insert into public.trainers (login, display_name, pin_hash, avatar_key)
values
  ('kevin', 'Kevin', crypt('3442', gen_salt('bf')), 'kevin'),
  ('quentin', 'Quentin', crypt('3930', gen_salt('bf')), 'quentin'),
  ('nadege', 'Nadège', crypt('8281', gen_salt('bf')), 'nadege')
on conflict (login) do nothing;

-- Session de transition (optionnel) : garde LPT2026 tant que l’app n’est pas migrée
insert into public.sessions (code, status, current_step, active_scenario)
values ('LPT2026', 'active', -1, 0)
on conflict (code) do nothing;
