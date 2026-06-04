-- =============================================================================
-- Colonnes attendues par l'app sur quiz_answers + upsert une réponse / question
-- Supabase → SQL Editor → Run
-- =============================================================================

alter table public.quiz_answers
  add column if not exists module_id text;

alter table public.quiz_answers
  add column if not exists answer_idx int;

alter table public.quiz_answers
  add column if not exists is_correct boolean;

-- Upsert participant (évite doublons si double clic)
create unique index if not exists uq_quiz_answers_session_module_q_collab
  on public.quiz_answers (session_code, module_id, question_idx, collaborateur);

-- Vérification
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'quiz_answers'
  and column_name in ('module_id', 'answer_idx', 'is_correct')
order by column_name;
