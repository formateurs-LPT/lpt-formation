-- Fil de discussion 1:1 formateur <-> collaborateur ("mots"). Évolution de
-- l'ancienne fonctionnalité "Retour individuel" (retours_individuels_notes/
-- _envoyes, conservées telles quelles pour l'écriture de brouillons et la
-- trace d'envoi) : au lieu d'un envoi par mailto:, chaque mot devient un
-- message dans ce fil, déclenché automatiquement à la publication du
-- reporting hebdomadaire (voir MesRetoursView.js, publierReporting).

CREATE TABLE mots_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collaborateur_id uuid NOT NULL REFERENCES collaborateurs(id) ON DELETE CASCADE,
  formateur_id uuid REFERENCES trainers(id) ON DELETE SET NULL,
  auteur text NOT NULL, -- 'formateur' | 'collaborateur'
  contenu text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mots_messages_collab ON mots_messages(collaborateur_id, created_at);

ALTER TABLE mots_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow all" ON mots_messages FOR ALL USING (true) WITH CHECK (true);
