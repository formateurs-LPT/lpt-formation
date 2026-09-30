-- =============================================================================
-- Table parametres_app — feature flags globaux de l'application
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.parametres_app (
  cle text primary key,
  valeur text not null,
  updated_at timestamptz not null default now()
);

alter table public.parametres_app enable row level security;

-- Lecture publique (l'app lit le flag côté client)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='parametres_app' and policyname='allow read') then
    create policy "allow read" on public.parametres_app for select to public using (true);
  end if;
end $$;

-- Écriture réservée au service role (dashboard Supabase uniquement, pas de clé anon)
-- Aucune policy INSERT/UPDATE/DELETE pour anon → seul l'accès direct en base modifie le flag.

grant select on public.parametres_app to anon, authenticated;

-- Valeur initiale : sync désactivée pour le déploiement
insert into public.parametres_app (cle, valeur)
values ('sync_entrees_rh_active', 'false')
on conflict (cle) do nothing;

-- Pour activer la sync plus tard, exécuter simplement :
-- update public.parametres_app set valeur = 'true', updated_at = now() where cle = 'sync_entrees_rh_active';

notify pgrst, 'reload schema';
