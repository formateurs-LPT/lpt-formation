-- =============================================================================
-- Aligner la BDD prod sur ce que l'app envoie réellement
-- (sinon INSERT/UPSERT échouent → aucune réponse en base)
--
-- Supabase → SQL Editor → Run
-- =============================================================================

-- Session de référence (FK participants, quiz_*, scenario_*)
insert into public.sessions (code, current_step, active_scenario, status)
values ('LPT2026', -1, 0, 'active')
on conflict (code) do update set status = 'active';

-- quiz_answers (modules)
alter table public.quiz_answers add column if not exists module_id text;
alter table public.quiz_answers add column if not exists answer_idx int;
alter table public.quiz_answers add column if not exists is_correct boolean;
alter table public.quiz_answers add column if not exists collaborateur text;

create unique index if not exists uq_quiz_answers_session_module_q_collab
  on public.quiz_answers (session_code, module_id, question_idx, collaborateur);

-- quiz_results (quiz initial / final — JSON scores)
alter table public.quiz_results add column if not exists answers jsonb;
alter table public.quiz_results add column if not exists completed_at timestamptz;

-- scenario_responses (quiz Q par Q + ordonnances)
alter table public.scenario_responses add column if not exists response text;

-- module_results (scores fin modules)
alter table public.module_results add column if not exists module_id text;
alter table public.module_results add column if not exists week_date date;
alter table public.module_results add column if not exists pin text;
alter table public.module_results add column if not exists score_total int;
alter table public.module_results add column if not exists xp int;
alter table public.module_results add column if not exists completed_at timestamptz;

create unique index if not exists uq_module_results_collab_module_week
  on public.module_results (collaborateur, module_id, week_date);

-- Vérification rapide
select 'quiz_answers' as tbl, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'quiz_answers'
  and column_name in ('module_id', 'answer_idx', 'is_correct', 'collaborateur', 'session_code', 'question_idx')
union all
select 'quiz_results', column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'quiz_results'
  and column_name in ('answers', 'completed_at', 'participant_name', 'session_code')
union all
select 'scenario_responses', column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'scenario_responses'
  and column_name in ('response', 'participant_name', 'scenario_idx', 'session_code')
order by tbl, column_name;
