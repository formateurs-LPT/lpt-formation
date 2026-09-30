-- =============================================================================
-- Tables pipeline recrutement + migration dossiers_documents_entrant
-- Supabase → SQL Editor → Run
-- =============================================================================

-- 1. Table candidats
create table if not exists public.candidats (
  id uuid primary key default gen_random_uuid(),
  nom text not null default '',
  prenom text not null default '',
  telephone text not null default '',
  email text,
  magasin text,
  poste_vise text,
  statut text not null default 'a_contacter',
  notes text,
  mode_domicile text not null default 'personnel',
  rqth_applicable boolean not null default false,
  contact_urgence_nom text not null default '',
  contact_urgence_telephone text not null default '',
  statut_documents text not null default 'incomplet',
  entree_id uuid references public.entrees_rh(id),
  cree_par text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_candidats_statut on public.candidats(statut);

-- 2. Historique des changements de statut
create table if not exists public.candidats_historique (
  id uuid primary key default gen_random_uuid(),
  candidat_id uuid not null references public.candidats(id) on delete cascade,
  statut_precedent text,
  statut_nouveau text not null,
  commentaire text,
  auteur text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_historique_candidat on public.candidats_historique(candidat_id);

-- 3. Migration dossiers_documents_entrant : ajouter candidat_id + rendre entree_id nullable
alter table public.dossiers_documents_entrant
  add column if not exists candidat_id uuid references public.candidats(id) on delete cascade;

-- Rendre entree_id nullable (était NOT NULL)
alter table public.dossiers_documents_entrant
  alter column entree_id drop not null;

-- Supprimer l'ancienne contrainte unique (entree_id, type_document)
-- (nom auto-généré par Postgres)
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'dossiers_documents_entrant_entree_id_type_document_key'
  ) then
    alter table public.dossiers_documents_entrant
      drop constraint dossiers_documents_entrant_entree_id_type_document_key;
  end if;
end $$;

-- Indexes uniques partiels : un doc par (entree, type) et un par (candidat, type)
create unique index if not exists idx_docs_entree_type
  on public.dossiers_documents_entrant(entree_id, type_document)
  where entree_id is not null;

create unique index if not exists idx_docs_candidat_type
  on public.dossiers_documents_entrant(candidat_id, type_document)
  where candidat_id is not null;

-- RLS
alter table public.candidats enable row level security;
alter table public.candidats_historique enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='candidats' and policyname='allow all') then
    create policy "allow all" on public.candidats for all to public using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='candidats_historique' and policyname='allow all') then
    create policy "allow all" on public.candidats_historique for all to public using (true) with check (true);
  end if;
end $$;

grant select, insert, update, delete on public.candidats to anon, authenticated;
grant select, insert, update, delete on public.candidats_historique to anon, authenticated;

-- Forcer le rechargement du schema PostgREST
notify pgrst, 'reload schema';
