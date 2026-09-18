-- =============================================================================
-- Ajoute le suivi de clôture des formations visio complémentaires.
-- Permet au formateur de marquer une inscription comme "Terminée" une fois
-- la compétence notée, avec le score obtenu au moment de la clôture.
-- Supabase → SQL Editor → Run
-- =============================================================================

alter table public.training_registrations
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by text,
  add column if not exists score int;

create index if not exists idx_training_reg_completed on public.training_registrations(completed_at);
