-- =============================================================================
-- LPT Formation — schéma COMPLET (nouveau projet vide uniquement)
--
-- ⚠️  BDD DÉJÀ EN PROD (sessions, participants, etc.) ?
--     Utilisez plutôt : supabase/migration-rooms-final.sql
--     (ne pas exécuter ce fichier sur la prod actuelle)
--
-- Ce fichier = schéma CIBLE (nouveau projet vide).
-- migration-rooms-final.sql = ALTER TABLE incrémentaux sur la prod existante.
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
-- 2. SESSIONS — 1 ligne = 1 salle (code généré à la création)
-- -----------------------------------------------------------------------------
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  trainer_id uuid references public.trainers(id) on delete set null,
  status text not null default 'waiting'
    check (status in ('waiting', 'active', 'ended')),
  room_type text check (room_type is null or room_type ~ '^[a-z][a-z0-9_]{0,31}$'),
  label text,
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
create index if not exists idx_sessions_room_type on public.sessions(room_type);
create index if not exists idx_sessions_active_rooms
  on public.sessions(status, room_type)
  where status in ('waiting', 'active');

comment on column public.sessions.code is
  'Code court unique = identifiant de salle (ex. K7M2) ; aussi dans l''URL du QR';
comment on column public.sessions.room_type is
  'Slug catégorie de formation (ex. presentiel, visio) — voir registre app formationCategories';
comment on column public.sessions.label is
  'Libellé affiché (ex. Visio — Nadège)';
comment on column public.sessions.status is
  'waiting | active | ended — ended bloque les nouvelles entrées';

-- -----------------------------------------------------------------------------
-- 3. PARTICIPANTS (liés à une session par code)
-- -----------------------------------------------------------------------------
create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  session_code text not null references public.sessions(code) on delete cascade,
  name text not null,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_seen_at timestamptz,
  unique (session_code, name)
);

create index if not exists idx_participants_session on public.participants(session_code);

create index if not exists idx_participants_session_online
  on public.participants (session_code)
  where left_at is null;

comment on column public.participants.left_at is 'Fermeture onglet / déconnexion';
comment on column public.participants.last_seen_at is 'Heartbeat — compteur connectés';

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

comment on table public.trainer_state is
  'État partagé : __weekly__ = liste RH (entrees_data) ; session_code = TV/QR/module par salle';

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
insert into public.sessions (code, status, room_type, current_step, active_scenario)
values ('LPT2026', 'active', 'presentiel', -1, 0)
on conflict (code) do nothing;

-- RH globale (liste collaborateurs importée)
insert into public.trainer_state (trainer, state)
values ('__weekly__', '{}'::jsonb)
on conflict (trainer) do nothing;
