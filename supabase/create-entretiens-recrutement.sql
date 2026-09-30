-- Planification d'entretien manager depuis la fiche candidat RH : calendrier,
-- CV, notification, rappel jour J, décision manager, archivage des refusés.
--
-- Adaptations par rapport à la demande d'origine :
--   * "demandeur_id" -> demandeur_login (text) : la session RH (rh/page.js,
--     RhLogin) n'est pas adossée à des comptes avec un id réel (la table
--     rh_accounts existe mais n'est pas utilisée par ce login, qui compare
--     juste à des identifiants/codes codés en dur) — même convention que
--     demandes_intervention.demandeur_login.
--   * "manager_id" référence store_managers(id) (seule table "manager" avec
--     un vrai id), et non une table managers dédiée.
--   * "archive_par_id" -> archive_par_login, même raison que demandeur_login.

alter table candidats add column if not exists cv_url text;

create table if not exists entretiens_recrutement (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid not null references candidats(id) on delete cascade,
  magasin_id uuid not null references magasins(id) on delete restrict,
  manager_id uuid references store_managers(id) on delete set null,
  demandeur_login text not null,
  date_heure_proposee timestamptz not null,
  statut text not null default 'en_attente'
    check (statut in ('en_attente','acceptee','contre_proposition_en_attente')),
  date_heure_contre_proposee timestamptz,
  commentaire_manager text,
  rappel_envoye boolean not null default false,
  note_entretien text,
  decision_candidat text not null default 'en_attente'
    check (decision_candidat in ('en_attente','accepte','refuse')),
  decision_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists entretiens_recrutement_candidat_idx on entretiens_recrutement (candidat_id);
create index if not exists entretiens_recrutement_magasin_idx on entretiens_recrutement (magasin_id, statut);

create table if not exists candidats_archives (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  slug text not null, -- nom+prénom normalisé (accents/casse) pour la détection de doublon
  motif text,
  date_refus timestamptz not null default now(),
  archive_par_login text
);
create index if not exists candidats_archives_slug_idx on candidats_archives (slug);

alter table entretiens_recrutement enable row level security;
alter table candidats_archives enable row level security;
drop policy if exists "allow all" on entretiens_recrutement;
create policy "allow all" on entretiens_recrutement for all using (true) with check (true);
drop policy if exists "allow all" on candidats_archives;
create policy "allow all" on candidats_archives for all using (true) with check (true);

-- Bucket privé pour les CV, même modèle que le bucket notes-terrain déjà en
-- place (accès uniquement via URL signée générée à la demande côté app).
insert into storage.buckets (id, name, public)
values ('rh-documents', 'rh-documents', false)
on conflict (id) do nothing;
drop policy if exists "rh-documents allow all" on storage.objects;
create policy "rh-documents allow all" on storage.objects for all
  using (bucket_id = 'rh-documents') with check (bucket_id = 'rh-documents');

-- Rappel jour J : pg_cron exécute une fonction SQL (pas de couche edge
-- function/HTTP nécessaire) toutes les 15 min, qui notifie une seule fois
-- (rappel_envoye) chaque entretien accepté dont la date tombe aujourd'hui
-- (fuseau Europe/Paris).
create extension if not exists pg_cron;

create or replace function public.envoyer_rappels_entretien()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into notifications (destinataire_login, type, reference_id)
  select sm.login, 'rappel_entretien', er.id
  from entretiens_recrutement er
  join store_managers sm on sm.id = er.manager_id
  where er.statut = 'acceptee'
    and er.rappel_envoye = false
    and sm.login is not null
    and (er.date_heure_proposee at time zone 'Europe/Paris')::date
        = (now() at time zone 'Europe/Paris')::date;

  update entretiens_recrutement
  set rappel_envoye = true, updated_at = now()
  where statut = 'acceptee'
    and rappel_envoye = false
    and (date_heure_proposee at time zone 'Europe/Paris')::date
        = (now() at time zone 'Europe/Paris')::date;
end;
$$;

select cron.unschedule(jobid) from cron.job where jobname = 'rappel-entretiens-recrutement';
select cron.schedule('rappel-entretiens-recrutement', '*/15 * * * *', 'select public.envoyer_rappels_entretien();');
