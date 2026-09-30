-- Mail de bienvenue (candidat accepté, magasins Île-de-France) : distinction
-- magasin/entrepôt (reprend STORE_ANNEXES.storeIds côté client, jamais posée
-- en base jusqu'ici) et traçage du clic "Envoyer" (même logique que
-- reportings_hebdo.envoye_at : posé à l'ouverture du mailto, pas à l'envoi réel).

alter table magasins add column if not exists type_magasin text not null default 'magasin'
  check (type_magasin in ('magasin', 'entrepot'));
update magasins set type_magasin = 'entrepot'
  where slug in ('beauchamps-labo-entrepot', 'laboratoire-progressif');

alter table candidats add column if not exists mail_bienvenue_envoye_at timestamptz;
