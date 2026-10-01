-- Deux ajouts indépendants décidés après l'audit RH/Manager/Collaborateur :
--
-- 1. Statut du contrat (Docusign), piloté à la main par la RH, consultable
--    par le collaborateur depuis son espace bridé. Volontairement manuel
--    (pas déduit de l'état du dossier documentaire) : l'envoi du contrat et
--    la complétude des documents sont deux processus indépendants qui
--    peuvent se désynchroniser.
ALTER TABLE entrees_rh ADD COLUMN IF NOT EXISTS statut_contrat text CHECK (statut_contrat IN ('en_attente_pieces', 'envoye_signature', 'signe'));

-- 2. Chat manager <-> collaborateur, extension du fil "mots" déjà utilisé
--    entre formateur et collaborateur (mots_messages, auteur 'formateur' ou
--    'collaborateur') : ajoute la possibilité qu'un message vienne d'un
--    manager, avec sa propre colonne d'auteur (comme formateur_id).
ALTER TABLE mots_messages ADD COLUMN IF NOT EXISTS store_manager_id uuid REFERENCES store_managers(id) ON DELETE SET NULL;
