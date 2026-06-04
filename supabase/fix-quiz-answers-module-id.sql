-- =============================================================================
-- Fix quiz modules : réponses en temps réel + scores finaux
-- Supabase → SQL Editor → Run (lecture seule sur le reste)
-- =============================================================================

-- 1) Colonne manquante pour filtrer PDM / types-verres / optique
alter table public.quiz_answers
  add column if not exists module_id text;

-- 2) Index pour les lectures formateur (temps réel)
create index if not exists idx_quiz_answers_session_module
  on public.quiz_answers (session_code, module_id);

-- 3) Upsert module_results (scores finaux) — contrainte pour on_conflict
create unique index if not exists uq_module_results_collab_module_week
  on public.module_results (collaborateur, module_id, week_date);

-- =============================================================================
-- Vérification (doit retourner module_id | text)
-- =============================================================================
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'quiz_answers'
  and column_name = 'module_id';
