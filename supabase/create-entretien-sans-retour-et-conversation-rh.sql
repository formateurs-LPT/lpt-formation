-- 1. Conversation RH <-> manager à propos d'un candidat précis (entretien
-- sans retour) — même table que les chats déjà existants (individuel,
-- groupe), distinguée par type='recrutement' + candidat_id.
ALTER TABLE mots_messages ADD COLUMN IF NOT EXISTS candidat_id uuid REFERENCES candidats(id) ON DELETE CASCADE;
ALTER TABLE mots_messages DROP CONSTRAINT IF EXISTS mots_messages_type_check;
ALTER TABLE mots_messages ADD CONSTRAINT mots_messages_type_check CHECK (type IN ('individuel', 'groupe', 'recrutement'));
CREATE INDEX IF NOT EXISTS idx_mots_messages_recrutement ON mots_messages(candidat_id, created_at) WHERE type = 'recrutement';

-- 2. Relance RH à 17h (heure de Paris, DST-safe) pour tout entretien confirmé
-- ('acceptee') dont l'heure est passée sans que le manager ait rendu sa
-- décision (decision_candidat reste à 'en_attente') — même mécanique que
-- envoyer_rappels_entretien (pg_cron + fonction SQL), dédoublonnée par jour
-- via une recherche dans `notifications` plutôt qu'un flag permanent : un
-- entretien toujours sans décision est re-signalé chaque jour tant qu'il
-- n'est pas tranché, pas juste une fois.
create or replace function public.notifier_entretiens_sans_retour()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if extract(hour from (now() at time zone 'Europe/Paris')) <> 17 then
    return;
  end if;

  insert into notifications (destinataire_login, type, reference_id)
  select rh.login, 'entretien_sans_retour', er.candidat_id
  from entretiens_recrutement er
  join rh_accounts rh on rh.active = true
  where er.statut = 'acceptee'
    and er.decision_candidat = 'en_attente'
    and er.date_heure_proposee < now()
    and not exists (
      select 1 from notifications n
      where n.destinataire_login = rh.login
        and n.type = 'entretien_sans_retour'
        and n.reference_id = er.candidat_id
        and (n.created_at at time zone 'Europe/Paris')::date = (now() at time zone 'Europe/Paris')::date
    );
end;
$$;

select cron.unschedule(jobid) from cron.job where jobname = 'relance-rh-entretiens-sans-retour';
select cron.schedule('relance-rh-entretiens-sans-retour', '*/15 * * * *', 'select public.notifier_entretiens_sans_retour();');
