-- Atelier tunnel SAV (27/11) : les flux de l'app SAV dessinés en cartes par
-- Kevin et Quentin (menu « Tunnel SAV » du dashboard formateur, accès réservé
-- à Kevin et Quentin dans l'app : ACCES_TUNNEL_SAV, src/lib/tunnelSavApi.js).
--
-- Une ligne par carte, pour que deux personnes puissent modifier deux cartes
-- différentes en même temps sans s'écraser. La ligne id = '_flux' porte le nom
-- du flux. Pas de suppression depuis le navigateur (pas de droit delete) :
-- une carte ou un flux supprimé est masqué (supprime = true) et reste
-- récupérable ici. Le direct (curseurs, déplacements) passe par Supabase
-- Realtime en broadcast : rien n'est stocké pour ça.
--
-- Script de création, à lancer une seule fois (aucune instruction qui
-- supprime ou remplace quoi que ce soit).

create table if not exists public.atelier_tunnel_sav (
  flux text not null check (flux ~ '^[a-z0-9_-]{2,60}$'),
  id text not null check (id ~ '^[a-z0-9_-]{2,60}$'),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 200000),
  supprime boolean not null default false,
  maj_par text check (char_length(maj_par) <= 60),
  maj_le timestamptz not null default now(),
  primary key (flux, id)
);

create index if not exists idx_atelier_tunnel_sav_flux on public.atelier_tunnel_sav (flux, supprime);

-- maj_le toujours à l'heure du serveur (pas celle de l'ordinateur)
create or replace function public.atelier_tunnel_sav_maj() returns trigger language plpgsql as $$
begin
  new.maj_le := now();
  return new;
end $$;

drop trigger if exists trg_atelier_tunnel_sav_maj on public.atelier_tunnel_sav;
create trigger trg_atelier_tunnel_sav_maj before insert or update on public.atelier_tunnel_sav
  for each row execute function public.atelier_tunnel_sav_maj();

alter table public.atelier_tunnel_sav enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atelier_tunnel_sav' and policyname = 'allow read') then
    create policy "allow read" on public.atelier_tunnel_sav for select to public using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atelier_tunnel_sav' and policyname = 'allow insert') then
    create policy "allow insert" on public.atelier_tunnel_sav for insert to public with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'atelier_tunnel_sav' and policyname = 'allow update') then
    create policy "allow update" on public.atelier_tunnel_sav for update to public using (true) with check (true);
  end if;
end $$;

grant select, insert, update on public.atelier_tunnel_sav to anon, authenticated;

notify pgrst, 'reload schema';
