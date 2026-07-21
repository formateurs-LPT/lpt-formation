-- =============================================================================
-- RLS : policies "allow all" sur les tables qui EXISTENT en prod
-- (ignore trainer_notes, trainer_weather, etc. si absentes)
--
-- Supabase → SQL Editor → Run
-- =============================================================================

do $$
declare
  t text;
  tables text[] := array[
    'sessions',
    'participants',
    'quiz_results',
    'scenario_responses',
    'session_history',
    'onboarding_sessions',
    'trainer_state',
    'quiz_answers',
    'module_results',
    'trainer_notes',
    'trainer_weather',
    'trainers',
    'open_answers',
    'free_quiz_questions',
    'collaborator_stats',
    'formation_reports'
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = t
    ) then
      raise notice 'Table public.% ignorée (n''existe pas)', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = t
        and policyname = 'allow all'
    ) then
      execute format(
        'create policy "allow all" on public.%I for all to public using (true) with check (true)',
        t
      );
      raise notice 'Policy "allow all" créée sur public.%', t;
    else
      raise notice 'Policy "allow all" déjà présente sur public.%', t;
    end if;
  end loop;
end $$;

-- Vérification : policies sur toutes les tables public de l'app
select c.relname as table_name,
       case c.relrowsecurity when true then 'RLS ON' else 'RLS OFF' end as rls,
       coalesce(p.policyname, '— aucune policy —') as policyname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = 'public'
  and p.tablename = c.relname
  and p.policyname = 'allow all'
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in (
    'sessions', 'participants', 'quiz_results', 'scenario_responses',
    'session_history', 'onboarding_sessions',
    'trainer_state', 'quiz_answers', 'module_results',
    'trainer_notes', 'trainer_weather', 'trainers',
    'open_answers', 'free_quiz_questions', 'collaborator_stats', 'formation_reports'
  )
order by c.relname;
