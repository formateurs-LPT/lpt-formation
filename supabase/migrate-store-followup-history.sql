-- =============================================================================
-- Migration : historise les audits de suivi magasin au lieu de les écraser.
-- À exécuter UNE FOIS, après create-store-followup-progress.sql.
-- Supabase → SQL Editor → Run
-- =============================================================================

-- Une ligne par audit (par jour), au lieu d'une seule ligne écrasée à chaque
-- mise à jour — on peut ainsi comparer les évaluations d'une visite à l'autre.
alter table public.store_followup_progress
  add column if not exists audit_date date;

update public.store_followup_progress
  set audit_date = updated_at::date
  where audit_date is null;

alter table public.store_followup_progress
  alter column audit_date set default current_date,
  alter column audit_date set not null;

-- Remplace l'ancienne contrainte d'unicité (store, collaborateur, item_id)
-- par une contrainte qui inclut la date : plusieurs audits dans le temps sont
-- désormais possibles pour un même item, un seul par jour.
do $$
declare
  cname text;
begin
  select tc.constraint_name into cname
  from information_schema.table_constraints tc
  where tc.table_schema = 'public'
    and tc.table_name = 'store_followup_progress'
    and tc.constraint_type = 'UNIQUE'
  limit 1;
  if cname is not null then
    execute format('alter table public.store_followup_progress drop constraint %I', cname);
  end if;
end $$;

alter table public.store_followup_progress
  add constraint store_followup_progress_unique_per_day
  unique (store, collaborateur, item_id, audit_date);
