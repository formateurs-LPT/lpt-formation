-- Chat de groupe par magasin (manager + collaborateurs, + direction en
-- lecture/écriture ponctuelle), construit en étendant la table du chat
-- individuel déjà existant (mots_messages) plutôt qu'en créant un système
-- parallèle : un message a un `type` ('individuel' ou 'groupe'), et pour le
-- type 'groupe', magasin_id remplace collaborateur_id comme identifiant de
-- la conversation (une seule conversation de groupe par magasin, créée
-- implicitement au premier message).
ALTER TABLE mots_messages ALTER COLUMN collaborateur_id DROP NOT NULL;
ALTER TABLE mots_messages ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'individuel' CHECK (type IN ('individuel', 'groupe'));
ALTER TABLE mots_messages ADD COLUMN IF NOT EXISTS magasin_id uuid REFERENCES magasins(id) ON DELETE CASCADE;
-- Nom (+ rôle pour la direction) affiché avec le message, capturé à l'envoi :
-- un fil de groupe mélange plusieurs collaborateurs, un manager et parfois un
-- DR/directeur retail, impossible à distinguer avec les seules valeurs
-- génériques 'formateur'/'manager'/'collaborateur' déjà utilisées par le chat
-- individuel (qui n'affiche qu'un seul interlocuteur à la fois).
ALTER TABLE mots_messages ADD COLUMN IF NOT EXISTS auteur_nom text;

CREATE INDEX IF NOT EXISTS idx_mots_messages_groupe ON mots_messages(magasin_id, created_at) WHERE type = 'groupe';
