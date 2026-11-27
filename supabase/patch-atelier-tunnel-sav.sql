-- Correctif (27/11) : version simplifiée de create-atelier-tunnel-sav.sql,
-- sans fonction, déclencheur ni bloc DO (qui provoquaient une erreur dans
-- l'éditeur SQL). À lancer une seule fois dans Supabase > SQL Editor.
-- Ne supprime ni ne remplace rien : crée seulement la table de l'Atelier tunnel SAV.

create table if not exists public.atelier_tunnel_sav (
  flux text not null,
  id text not null,
  data jsonb not null default '{}'::jsonb,
  supprime boolean not null default false,
  maj_par text,
  maj_le timestamptz not null default now(),
  primary key (flux, id)
);

alter table public.atelier_tunnel_sav enable row level security;

create policy "tunnel sav lecture" on public.atelier_tunnel_sav for select using (true);
create policy "tunnel sav ajout" on public.atelier_tunnel_sav for insert with check (true);
create policy "tunnel sav modif" on public.atelier_tunnel_sav for update using (true) with check (true);

grant select, insert, update on public.atelier_tunnel_sav to anon, authenticated;

notify pgrst, 'reload schema';
