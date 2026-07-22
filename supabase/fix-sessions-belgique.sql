-- =============================================================================
-- Fix complet : colonnes sessions + contrainte room_type + formateur Thomas
-- Supabase → SQL Editor → Run (idempotent, peut être rejoué sans risque)
-- =============================================================================

-- 1. Colonnes optionnelles manquantes (migration-from-current.sql doit avoir été jouée avant)
alter table public.sessions
  add column if not exists trainer_id uuid references public.trainers(id) on delete set null;

alter table public.sessions
  add column if not exists started_at timestamptz;

alter table public.sessions
  add column if not exists updated_at timestamptz;

alter table public.sessions
  add column if not exists label text;

-- 2. Colonne room_type : drop toutes les contraintes CHECK existantes qui portent sur elle,
--    puis recréer avec le bon regex (permet presentiel, visio, belgique et tout slug valide)
do $$
declare
  r record;
begin
  for r in
    select conname
    from pg_constraint
    where conrelid = 'public.sessions'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%room_type%'
  loop
    execute 'alter table public.sessions drop constraint if exists ' || quote_ident(r.conname);
  end loop;
end $$;

alter table public.sessions
  add column if not exists room_type text;

alter table public.sessions
  add constraint sessions_room_type_check
  check (room_type is null or room_type ~ '^[a-z][a-z0-9_]{0,31}$');

-- 3. Index (idempotent)
create index if not exists idx_sessions_room_type on public.sessions(room_type);

create index if not exists idx_sessions_active_rooms
  on public.sessions(status, room_type)
  where status in ('waiting', 'active');

-- 4. Formateur Thomas (Belgique) — PIN 0000, à changer si besoin
insert into public.trainers (login, display_name, pin_hash, avatar_key)
values ('thomas', 'Thomas', crypt('0000', gen_salt('bf')), 'thomas')
on conflict (login) do nothing;

-- 5. Vérification
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'sessions'
  and column_name in ('room_type', 'label', 'trainer_id', 'started_at', 'updated_at')
order by column_name;

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid = 'public.sessions'::regclass
  and contype = 'c';
