-- Compte collaborateur créé automatiquement à la validation RH (login + code
-- générique LPTSHOP, changement obligatoire), lien vers l'entrée pour le
-- dossier RH self-service, et drapeau de fin de formation (mode restreint /
-- dashboard complet). Même modèle login/code en clair que store_managers,
-- rh_accounts, trainers, store_directors — pas de nouveau paradigme d'auth.

alter table collaborateurs add column if not exists login text;
create unique index if not exists collaborateurs_login_key on collaborateurs (login) where login is not null;
alter table collaborateurs add column if not exists code text not null default 'LPTSHOP';
alter table collaborateurs add column if not exists doit_changer_code boolean not null default true;
alter table collaborateurs add column if not exists formation_terminee boolean not null default false;
alter table collaborateurs add column if not exists entree_id uuid references entrees_rh(id) on delete set null;

alter table candidats add column if not exists acces_espace_envoye_at timestamptz;
