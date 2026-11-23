-- Atelier Lipto (23/11) : simulations Lipto créées par les formateurs dans
-- l'atelier (menu « Atelier Lipto » du dashboard formateur), partagées entre
-- les formateurs qui y ont accès (Kevin et Thomas pour l'instant, règle
-- d'accès dans l'app : ACCES_ATELIER, src/lib/atelierSimulation.js).
--
-- Une ligne = un projet de simulation. Les cases et leurs liens sont dans
-- `cases` (jsonb). Pas de suppression depuis le navigateur (pas de droit
-- delete) : un projet supprimé est masqué (supprime = true) et reste
-- récupérable ici. verrou_par / verrou_le : qui modifie le projet en ce
-- moment (un seul à la fois).
--
-- Script de création, à lancer une seule fois (aucune instruction qui
-- supprime ou remplace quoi que ce soit).

create table public.atelier_lipto_projets (
  id text primary key check (id ~ '^[a-z0-9-]{4,40}$'),
  titre text not null check (char_length(titre) between 1 and 200),
  auteur text not null check (char_length(auteur) between 1 and 60),
  maj_par text check (char_length(maj_par) <= 60),
  statut text not null default 'brouillon' check (statut in ('brouillon', 'pret')),
  cases jsonb not null default '{}'::jsonb check (jsonb_typeof(cases) = 'object' and pg_column_size(cases) < 1000000),
  supprime boolean not null default false,
  verrou_par text check (char_length(verrou_par) <= 60),
  verrou_le timestamptz,
  cree_le timestamptz not null default now(),
  maj_le timestamptz not null default now()
);

create index idx_atelier_lipto_projets_maj on public.atelier_lipto_projets (supprime, maj_le desc);

alter table public.atelier_lipto_projets enable row level security;

create policy "allow read" on public.atelier_lipto_projets for select to public using (true);
create policy "allow insert" on public.atelier_lipto_projets for insert to public with check (true);
create policy "allow update" on public.atelier_lipto_projets for update to public using (true) with check (true);

grant select, insert, update on public.atelier_lipto_projets to anon, authenticated;

notify pgrst, 'reload schema';
