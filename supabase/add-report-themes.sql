-- Thème manuel facultatif sur une note de terrain : si le formateur le
-- renseigne, il prime sur le thème que l'IA aurait proposé lors de la
-- génération du reporting hebdomadaire (regroupement par thème, pas par
-- ordre de saisie — cf. supabase/functions/reporting-generate/index.ts).
ALTER TABLE notes_terrain ADD COLUMN IF NOT EXISTS theme text;
