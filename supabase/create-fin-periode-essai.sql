-- Notification manager 1 semaine avant la fin de la période d'essai (2 mois)
-- d'un collaborateur, tant qu'il est toujours dans l'effectif de son magasin
-- (= sa ligne existe toujours dans `collaborateurs`, il n'y a pas de statut
-- "parti"/"sorti" dans ce schéma).

alter table collaborateurs add column if not exists notif_fin_periode_essai_envoyee boolean not null default false;

-- Job séparé du rappel d'entretien (jobid 1, envoyer_rappels_entretien) —
-- même mécanisme (pg_cron), pas de modification du job existant.
create or replace function public.verifier_fin_periode_essai()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (destinataire_login, type, reference_id)
  select sm.login, 'fin_periode_essai', c.id
  from collaborateurs c
  join store_managers sm on sm.magasin_id = c.magasin_id and sm.active = true
  where c.date_entree is not null
    and c.notif_fin_periode_essai_envoyee = false
    and (now() at time zone 'Europe/Paris')::date >= (c.date_entree + interval '1 month 21 days')::date;

  update collaborateurs c
  set notif_fin_periode_essai_envoyee = true
  where c.date_entree is not null
    and c.notif_fin_periode_essai_envoyee = false
    and (now() at time zone 'Europe/Paris')::date >= (c.date_entree + interval '1 month 21 days')::date;
end;
$$;

select cron.unschedule(jobid) from cron.job where jobname = 'verifier-fin-periode-essai';
select cron.schedule('verifier-fin-periode-essai', '17 6 * * *', 'select public.verifier_fin_periode_essai();');
