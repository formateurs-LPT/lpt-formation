-- Refonte du reporting hebdomadaire (design + structure).
-- notes_terrain et reportings_hebdo n'avaient jusqu'ici aucun fichier SQL
-- versionné (créées directement en dashboard Supabase) — ce fichier trace
-- ce changement pour que le schéma reste lisible en dehors du dashboard.
--
-- Toutes les colonnes sont nullable, sans défaut : les notes et reportings
-- existants restent valides tels quels (rétrocompatibilité stricte).

ALTER TABLE notes_terrain ADD COLUMN IF NOT EXISTS pole text;
-- Pôle sélectionné en un tap à la saisie : 'vente' | 'sav' | 'montage' |
-- 'general' | 'conclusion' (liste définie dans src/lib/poles.js).
-- Volontairement non lié à la normalisation MO/SAV des postes collaborateurs.

ALTER TABLE notes_terrain ADD COLUMN IF NOT EXISTS collaborateurs_cites jsonb;
-- Tableau d'objets [{id, nom}] plutôt que de simples ids, pour ne pas
-- dépendre d'une résolution ultérieure si le roster du magasin change.

ALTER TABLE reportings_hebdo ADD COLUMN IF NOT EXISTS contenu_structure jsonb;
-- Sortie JSON structurée de genererReportingStructure (src/lib/notesTerrainApi.js,
-- génération purement algorithmique côté client, aucune IA/API externe) :
-- { sections: [{ pole, items: [{ resume, detail, collaborateurs,
--   piecesJointes, audioUrl }] }], conclusion, collaborateursCites }
-- `contenu_genere` (texte) est conservé pour le mail et la rétrocompatibilité
-- des anciens reportings (affichage tel quel quand contenu_structure est vide).
