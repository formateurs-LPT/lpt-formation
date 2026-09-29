-- =============================================================================
-- Tables espace RH — entrées hebdomadaires + suivi dossiers documentaires
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.entrees_rh (
  id uuid primary key default gen_random_uuid(),
  nom text not null default '',
  prenom text not null default '',
  magasin text not null default '',
  date_entree date not null,
  poste text not null default '',
  heures text not null default '',
  telephone text not null default '',
  semaine_lundi date not null,
  cree_par text not null default '',
  mode_domicile text not null default 'personnel',
  rqth_applicable boolean not null default false,
  contact_urgence_nom text not null default '',
  contact_urgence_telephone text not null default '',
  statut_documents text not null default 'incomplet',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_entrees_rh_semaine on public.entrees_rh(semaine_lundi);

create table if not exists public.dossiers_documents_entrant (
  id uuid primary key default gen_random_uuid(),
  entree_id uuid not null references public.entrees_rh(id) on delete cascade,
  type_document text not null,
  fichier_url text,
  rempli boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(entree_id, type_document)
);

create index if not exists idx_dossiers_entree on public.dossiers_documents_entrant(entree_id);

alter table public.entrees_rh enable row level security;
alter table public.dossiers_documents_entrant enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='entrees_rh' and policyname='allow all') then
    create policy "allow all" on public.entrees_rh for all to public using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='dossiers_documents_entrant' and policyname='allow all') then
    create policy "allow all" on public.dossiers_documents_entrant for all to public using (true) with check (true);
  end if;
end $$;

grant select, insert, update, delete on public.entrees_rh to anon, authenticated;
grant select, insert, update, delete on public.dossiers_documents_entrant to anon, authenticated;
