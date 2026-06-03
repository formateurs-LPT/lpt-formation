-- =============================================================================
-- Migration INCRÉMENTALE — BDD LPT Formation (prod actuelle)
-- À coller ENTIÈREMENT dans Supabase → SQL Editor → Run
-- Ne pas utiliser les "..." du chat : ce fichier est complet.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1. Nouvelle table TRAINERS (n’existait pas)
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

-- -----------------------------------------------------------------------------
-- 2. Enrichir SESSIONS (table déjà présente : LPT2025, LPT2026)
-- -----------------------------------------------------------------------------
alter table public.sessions
  add column if not exists trainer_id uuid references public.trainers(id) on delete set null;

alter table public.sessions
  add column if not exists status text;

alter table public.sessions
  add column if not exists started_at timestamptz;

alter table public.sessions
  add column if not exists ended_at timestamptz;

alter table public.sessions
  add column if not exists updated_at timestamptz;

-- Valeur par défaut pour les lignes existantes
update public.sessions
set status = 'active'
where status is null;

-- Contrainte status (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'sessions_status_check'
      and conrelid = 'public.sessions'::regclass
  ) then
    alter table public.sessions
      add constraint sessions_status_check
      check (status in ('waiting', 'active', 'ended'));
  end if;
exception
  when others then null;
end $$;

alter table public.sessions
  alter column status set default 'waiting';

create index if not exists idx_sessions_trainer on public.sessions(trainer_id);
create index if not exists idx_sessions_status on public.sessions(status);

-- -----------------------------------------------------------------------------
-- 3. Seed formateurs (PIN = mêmes codes qu’avant en .env)
-- -----------------------------------------------------------------------------
insert into public.trainers (login, display_name, pin_hash, avatar_key)
values
  ('kevin', 'Kevin', crypt('3442', gen_salt('bf')), 'kevin'),
  ('quentin', 'Quentin', crypt('3930', gen_salt('bf')), 'quentin'),
  ('nadege', 'Nadège', crypt('8281', gen_salt('bf')), 'nadege')
on conflict (login) do nothing;

-- Marquer les sessions existantes comme actives (déjà le cas en pratique)
update public.sessions
set status = coalesce(status, 'active')
where code in ('LPT2025', 'LPT2026');

-- =============================================================================
-- FIN — Vérifier dans Table Editor : table "trainers" + colonnes sessions.*
-- =============================================================================
