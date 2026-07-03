-- =============================================================================
-- Nettoyage one-shot prod — RoomSys legacy
-- Supabase → SQL Editor → Run (lire avant d'exécuter)
-- =============================================================================

insert into public.trainer_state (trainer, state, updated_at)
values ('__weekly__', '{}'::jsonb, now())
on conflict (trainer) do nothing;

-- Fusion ob_* / entrees_data manquants : LPT2026 → __weekly__
do $$
declare
  w jsonb;
  l jsonb;
  merged jsonb;
begin
  select state into w from public.trainer_state where trainer = '__weekly__';
  select state into l from public.trainer_state where trainer = 'LPT2026';
  if l is null then
    return;
  end if;

  merged := coalesce(w, '{}'::jsonb);

  if (not (merged ? 'entrees_data')
      or jsonb_typeof(merged -> 'entrees_data') <> 'array'
      or jsonb_array_length(merged -> 'entrees_data') = 0)
     and (l ? 'entrees_data') then
    merged := merged || jsonb_build_object('entrees_data', l -> 'entrees_data');
  end if;

  if not (merged ? 'ob_data') and (l ? 'ob_data') then
    merged := merged || jsonb_build_object('ob_data', l -> 'ob_data');
  end if;

  if not (merged ? 'ob_date') and (l ? 'ob_date') then
    merged := merged || jsonb_build_object('ob_date', l -> 'ob_date');
  end if;

  if not (merged ? 'ob_day') and (l ? 'ob_day') then
    merged := merged || jsonb_build_object('ob_day', l -> 'ob_day');
  end if;

  update public.trainer_state
  set state = merged, updated_at = now()
  where trainer = '__weekly__';
end $$;

-- Retirer les clés RH de LPT2026 (elles vivent sur __weekly__)
update public.trainer_state
set
  state = state - 'entrees_data' - 'ob_data' - 'ob_date' - 'ob_day',
  updated_at = now()
where trainer = 'LPT2026';

-- Supprimer trainer_state des salles dynamiques déjà terminées
delete from public.trainer_state ts
where ts.trainer in (
  select s.code
  from public.sessions s
  where s.status = 'ended'
    and s.code not in ('LPT2025', 'LPT2026')
);

-- Vérification
select trainer, updated_at, jsonb_object_keys(state) as key
from public.trainer_state
where trainer in ('__weekly__', 'LPT2026')
order by trainer, key;
