-- Dashboard collaborateur complet (Ma progression / Cours / Exercices)
-- Supabase -> SQL Editor -> Run
-- RLS : lecture publique partout, ecriture anon seulement sur
-- cours_lectures et exercice_resultats (ce que l'app ecrit vraiment depuis
-- le navigateur du collaborateur). Le contenu (cours/exercices/questions)
-- s'ajoute via l'editeur SQL, jamais depuis l'app.

create table if not exists public.cours (
  id uuid primary key default gen_random_uuid(),
  theme_id text not null,
  titre text not null,
  ordre int not null default 0,
  contenu jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_cours_theme on public.cours(theme_id, ordre);
alter table public.cours enable row level security;
create policy "allow read" on public.cours for select to public using (true);
grant select on public.cours to anon, authenticated;

create table if not exists public.cours_lectures (
  id uuid primary key default gen_random_uuid(),
  cours_id uuid not null references public.cours(id) on delete cascade,
  collaborateur_id uuid not null references public.collaborateurs(id) on delete cascade,
  lu_at timestamptz not null default now(),
  unique (cours_id, collaborateur_id)
);
alter table public.cours_lectures enable row level security;
create policy "allow read" on public.cours_lectures for select to public using (true);
create policy "allow insert" on public.cours_lectures for insert to public with check (true);
grant select, insert on public.cours_lectures to anon, authenticated;

create table if not exists public.exercices (
  id uuid primary key default gen_random_uuid(),
  theme_id text not null,
  titre text not null,
  ordre int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_exercices_theme on public.exercices(theme_id, ordre);
alter table public.exercices enable row level security;
create policy "allow read" on public.exercices for select to public using (true);
grant select on public.exercices to anon, authenticated;

create table if not exists public.exercice_questions (
  id uuid primary key default gen_random_uuid(),
  exercice_id uuid not null references public.exercices(id) on delete cascade,
  ordre int not null default 0,
  type text not null default 'qcm',
  enonce text not null,
  data jsonb not null default '{}'::jsonb,
  explication text
);
create index if not exists idx_exercice_questions_exercice on public.exercice_questions(exercice_id, ordre);
alter table public.exercice_questions enable row level security;
create policy "allow read" on public.exercice_questions for select to public using (true);
grant select on public.exercice_questions to anon, authenticated;

create table if not exists public.exercice_resultats (
  id uuid primary key default gen_random_uuid(),
  exercice_id uuid not null references public.exercices(id) on delete cascade,
  collaborateur_id uuid not null references public.collaborateurs(id) on delete cascade,
  theme_id text not null,
  mode text not null default 'entrainement',
  score int not null,
  total int not null,
  completed_at timestamptz not null default now()
);
create index if not exists idx_exercice_resultats_collaborateur on public.exercice_resultats(collaborateur_id, theme_id, completed_at desc);
alter table public.exercice_resultats enable row level security;
create policy "allow read" on public.exercice_resultats for select to public using (true);
create policy "allow insert" on public.exercice_resultats for insert to public with check (true);
grant select, insert on public.exercice_resultats to anon, authenticated;

create table if not exists public.parametres_app (
  cle text primary key,
  valeur text not null,
  updated_at timestamptz not null default now()
);
alter table public.parametres_app enable row level security;
create policy "allow read" on public.parametres_app for select to public using (true);
grant select on public.parametres_app to anon, authenticated;

insert into public.parametres_app (cle, valeur)
values ('exercices_comptent_dans_maitrise', 'false')
on conflict (cle) do nothing;

notify pgrst, 'reload schema';
