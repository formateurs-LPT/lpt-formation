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

-- NB : ce schéma a divergé de la vraie table en prod (colonnes ajoutées
-- directement via le dashboard Supabase, jamais capturées dans une migration
-- versionnée). Description mise à jour le 13/08 pour refléter les colonnes
-- réellement utilisées par EntreesView.js / OnboardingView.js / OnboardingViewBelgique.js.
create table if not exists public.onboarding_sessions (
  id bigserial primary key,
  week_date text not null,
  collaborateur text not null,
  pin text,
  magasin text,
  poste text,
  present boolean default false,
  contrat boolean default false,
  created_at timestamptz default now(),
  unique (collaborateur, week_date)
);

-- -----------------------------------------------------------------------------
-- 4b. RÉPONSES LIBRES + FICHES FIN DE FORMATION
-- -----------------------------------------------------------------------------

create table if not exists public.open_answers (
  id               bigserial primary key,
  session_code     text not null,
  page_id          text not null,
  participant_name text not null default 'Anonyme',
  answer           text not null,
  module_id        text,
  question_idx     int,
  question_prompt  text,
  is_correct       boolean,
  graded_by        text,
  graded_at        timestamptz,
  trainer_comment  text,
  created_at       timestamptz default now()
);

create index if not exists idx_open_answers_session_page
  on public.open_answers (session_code, page_id);

create table if not exists public.free_quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  module_id     text,
  page_id       text not null,
  prompt        text not null,
  expected_hint text,
  sort_order    int not null default 0,
  active        boolean not null default true,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

create table if not exists public.collaborator_stats (
  id               uuid primary key default gen_random_uuid(),
  collaborateur    text not null,
  week_date        date not null,
  session_code     text,
  room_type        text,
  trainer_name     text,
  quiz_correct     int not null default 0,
  quiz_total       int not null default 0,
  open_correct     int not null default 0,
  open_total       int not null default 0,
  modules_done     int not null default 0,
  modules_detail   jsonb not null default '[]'::jsonb,
  presence_days    int not null default 0,
  presence_detail  jsonb not null default '{}'::jsonb,
  quiz_breakdown   jsonb not null default '[]'::jsonb,
  open_breakdown   jsonb not null default '[]'::jsonb,
  updated_at       timestamptz not null default now(),
  unique (collaborateur, week_date)
);

create table if not exists public.formation_reports (
  id                 uuid primary key default gen_random_uuid(),
  collaborateur      text not null,
  week_date          date not null,
  session_code       text,
  room_type          text,
  trainer_name       text not null,
  stats_snapshot     jsonb not null default '{}'::jsonb,
  summary            text,
  strengths          text,
  improvements       text,
  overall_rating     smallint check (overall_rating is null or overall_rating between 1 and 5),
  recommend_followup boolean default false,
  status             text not null default 'draft'
                       check (status in ('draft', 'published', 'archived')),
  published_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (collaborateur, week_date, trainer_name)
);

comment on column public.sessions.room_type is
  'Slug catégorie : presentiel | visio | belgique (voir formationCategories.js)';

-- -----------------------------------------------------------------------------
-- 5. SEED formateurs (PIN = 3442 pour kevin — à changer en prod)
--    Hash : crypt(pin, gen_salt('bf'))
-- -----------------------------------------------------------------------------
insert into public.trainers (login, display_name, pin_hash, avatar_key)
values
  ('kevin', 'Kevin', crypt('3442', gen_salt('bf')), 'kevin'),
  ('quentin', 'Quentin', crypt('3930', gen_salt('bf')), 'quentin'),
  ('nadege', 'Nadège', crypt('8281', gen_salt('bf')), 'nadege'),
  ('thomas', 'Thomas', crypt('0000', gen_salt('bf')), 'thomas')
on conflict (login) do nothing;

-- Session de transition (optionnel) : garde LPT2026 tant que l’app n’est pas migrée
insert into public.sessions (code, status, room_type, current_step, active_scenario)
values ('LPT2026', 'active', 'presentiel', -1, 0)
on conflict (code) do nothing;

-- RH globale (liste collaborateurs importée)
insert into public.trainer_state (trainer, state)
values ('__weekly__', '{}'::jsonb)
on conflict (trainer) do nothing;
