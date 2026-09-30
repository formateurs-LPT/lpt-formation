-- Tables du module RH (/rh) — candidats, historique, documents, entrées de la semaine.
-- Ces tables étaient référencées par src/lib/rhApi.js et src/app/rh/page.js mais
-- n'avaient jamais été créées en base, rendant tout le module RH silencieusement
-- non fonctionnel (POST sur table inexistante -> post() retourne null -> rien ne se passe).

create table if not exists entrees_rh (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  magasin text,
  date_entree date,
  poste text,
  heures text,
  telephone text,
  mode_domicile text not null default 'personnel' check (mode_domicile in ('personnel','heberge')),
  rqth_applicable boolean not null default false,
  contact_urgence_nom text,
  contact_urgence_telephone text,
  semaine_lundi date not null,
  statut_documents text not null default 'incomplet' check (statut_documents in ('incomplet','complet')),
  cree_par text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists candidats (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  telephone text,
  email text,
  magasin text,
  poste_vise text,
  heures_envisagees text,
  mode_domicile text not null default 'personnel' check (mode_domicile in ('personnel','heberge')),
  rqth_applicable boolean not null default false,
  contact_urgence_nom text,
  contact_urgence_telephone text,
  statut text not null default 'a_contacter' check (statut in ('a_contacter','contacte','prise_de_reference','entretien_manager','valide','refuse')),
  statut_documents text not null default 'incomplet' check (statut_documents in ('incomplet','complet')),
  entree_id uuid references entrees_rh(id) on delete set null,
  cree_par text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists candidats_historique (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid not null references candidats(id) on delete cascade,
  statut_precedent text,
  statut_nouveau text not null,
  commentaire text,
  auteur text,
  created_at timestamptz not null default now()
);

create table if not exists dossiers_documents_entrant (
  id uuid primary key default gen_random_uuid(),
  entree_id uuid references entrees_rh(id) on delete cascade,
  candidat_id uuid references candidats(id) on delete cascade,
  type_document text not null,
  rempli boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint dossiers_entree_or_candidat check (
    (entree_id is not null and candidat_id is null) or (entree_id is null and candidat_id is not null)
  )
);
create unique index if not exists dossiers_documents_entrant_entree_type_key
  on dossiers_documents_entrant (entree_id, type_document) where entree_id is not null;
create unique index if not exists dossiers_documents_entrant_candidat_type_key
  on dossiers_documents_entrant (candidat_id, type_document) where candidat_id is not null;

create index if not exists entrees_rh_semaine_idx on entrees_rh (semaine_lundi);
create index if not exists candidats_historique_candidat_idx on candidats_historique (candidat_id);

-- RLS "allow all" : même modèle que le reste de l'app (clé anon partagée entre tous
-- les rôles, pas d'auth Supabase par utilisateur — cf. collaborateurs/reportings_hebdo/mots_messages).
alter table entrees_rh enable row level security;
alter table candidats enable row level security;
alter table candidats_historique enable row level security;
alter table dossiers_documents_entrant enable row level security;

drop policy if exists "allow all" on entrees_rh;
create policy "allow all" on entrees_rh for all using (true) with check (true);
drop policy if exists "allow all" on candidats;
create policy "allow all" on candidats for all using (true) with check (true);
drop policy if exists "allow all" on candidats_historique;
create policy "allow all" on candidats_historique for all using (true) with check (true);
drop policy if exists "allow all" on dossiers_documents_entrant;
create policy "allow all" on dossiers_documents_entrant for all using (true) with check (true);
