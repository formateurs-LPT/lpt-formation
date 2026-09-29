-- Refonte 2 du reporting hebdomadaire : taxonomie pole (CVO/MO-SAV/Magasin)
-- x rubrique (Constaté/Fait/À faire) au lieu d'un pôle unique avec
-- "Conclusion" mêlé aux autres. Colonnes nullable/défaut sûr : notes
-- existantes restent valides.

ALTER TABLE notes_terrain ADD COLUMN IF NOT EXISTS rubrique text;
-- 'constate' | 'fait' | 'a_faire' (liste définie dans src/lib/poles.js).
-- Si renseigné à la saisie, prime toujours sur le classement automatique.

ALTER TABLE notes_terrain ADD COLUMN IF NOT EXISTS mot_de_la_fin boolean NOT NULL DEFAULT false;
-- Remplace l'ancien pôle 'conclusion' (retiré de la taxonomie de pole) :
-- la note est affichée telle quelle (corrigée) dans le bloc final du reporting.

-- Migration des anciennes valeurs de pole (refonte précédente : vente, sav,
-- montage, general, conclusion) vers la nouvelle taxonomie (cvo, mo_sav,
-- magasin) — exécutée le 2026-09-28.
UPDATE notes_terrain SET pole = 'cvo' WHERE pole = 'vente';
UPDATE notes_terrain SET pole = 'mo_sav' WHERE pole IN ('sav', 'montage');
UPDATE notes_terrain SET pole = 'magasin' WHERE pole = 'general';
UPDATE notes_terrain SET mot_de_la_fin = true, pole = NULL WHERE pole = 'conclusion';
