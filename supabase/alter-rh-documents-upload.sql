-- Ajout de la lettre de motivation (candidats) et du fichier réel associé à
-- chaque document du dossier RH (dossiers_documents_entrant), pour permettre
-- le glisser-déposer côté RH au lieu du simple cochage "reçu/en attente".

alter table candidats add column if not exists lettre_motivation_url text;
alter table dossiers_documents_entrant add column if not exists fichier_url text;
