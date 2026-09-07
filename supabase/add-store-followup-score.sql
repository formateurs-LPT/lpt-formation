-- =============================================================================
-- Ajoute la note (1-5) par audit, qui pilote désormais le statut.
-- À exécuter UNE FOIS, après migrate-store-followup-history.sql.
-- Supabase → SQL Editor → Run
-- =============================================================================

alter table public.store_followup_progress
  add column if not exists score smallint;
