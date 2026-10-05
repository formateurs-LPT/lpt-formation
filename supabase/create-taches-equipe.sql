-- =============================================================================
-- Table : tâches assignées par le responsable formation (Kevin) à un ou
-- plusieurs formateurs — ticket partagé (une tâche "en commun" a un seul
-- statut, modifiable par n'importe quel assigné ou par le créateur), visible
-- par toute l'équipe. Notifie le créateur quand le statut passe à "termine"
-- (via la table `notifications` déjà utilisée ailleurs dans l'app).
-- Supabase → SQL Editor → Run
-- =============================================================================

create table if not exists public.taches_equipe (
  id uuid primary key default gen_random_uuid(),
  titre text not null,
  description text,
  assignes text[] not null default '{}',
  cree_par text not null,
  statut text not null default 'a_faire' check (statut in ('a_faire', 'en_cours', 'termine')),
  -- Qui a effectivement cliqué "Terminé" (une tâche peut avoir plusieurs
  -- assignés — sert à personnaliser la notification envoyée au créateur).
  termine_par text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_taches_equipe_statut on public.taches_equipe(statut);

alter table public.taches_equipe enable row level security;
drop policy if exists "allow all" on public.taches_equipe;
create policy "allow all" on public.taches_equipe for all using (true) with check (true);
