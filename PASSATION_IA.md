# Document de passation — lpt-formation

Document rédigé pour transmettre le contexte accumulé à un autre assistant IA (ou une autre personne) qui reprendrait le développement de cette application. Rien ici n'est indispensable au fonctionnement de l'app elle-même (qui tourne de façon totalement autonome sur GitHub + Supabase + Vercel) — c'est uniquement du contexte de travail pour repartir sans perdre de temps ni refaire les mêmes erreurs.

## 1. Vue d'ensemble

**lpt-formation** est l'application interne de formation et de suivi RH de **Lunettes Pour Tous** (opticien). Elle sert à :
- Former les nouveaux collaborateurs (modules, quiz, scénarios interactifs, diffusion live en salle via QR code/code de session).
- Gérer le recrutement et l'onboarding administratif côté RH.
- Donner aux managers de magasin un dashboard de suivi de leur équipe.
- Donner à chaque nouveau collaborateur un espace self-service pour son intégration.
- Donner à la direction (DR régionaux + directeur retail) une vue sur les magasins de leur périmètre.

## 2. Stack technique

- **Next.js 15** en **export statique** (`output: 'export'` dans `next.config.js`, `trailingSlash: true`). Pas de serveur Node custom, pas d'API routes Next — tout passe par des appels directs à l'API REST de Supabase (PostgREST) depuis le client.
- **Supabase** : base Postgres + stockage de fichiers (bucket `rh-documents` notamment). Pas de vraie authentification Supabase Auth : chaque rôle (formateur, manager, RH, direction, collaborateur) a ses propres tables avec des colonnes `login`/`code` en clair, comparées côté client ou via filtre PostgREST — volontairement simple, pattern déjà en place partout, ne pas essayer d'y substituer un système d'auth "propre" sans que ce soit demandé.
- **Vercel** pour l'hébergement (déploiement automatique sur push vers GitHub).
- Pas de framework de test automatisé. Vérification = compiler + tester manuellement en local (voir piège ci-dessous sur `next build`).

### Project Supabase lié
Le CLI Supabase (`supabase`) est authentifié et lié au projet distant (`dofyyckseiilxhlijacy`, compte `kdupuy@lunettespourtous.com`). **Convention du repo : les migrations SQL sont des fichiers `supabase/create-*.sql` / `fix-*.sql` autonomes, PAS un dossier `supabase/migrations/` suivi par le CLI.** Elles sont appliquées à la main par Quentin via l'éditeur SQL du dashboard Supabase (copier-coller le contenu du fichier, Run) — ne pas introduire de système de migrations CLI sans qu'on te le demande, ça casserait la convention existante.

## 3. Conventions importantes du code

- **Pattern de synchronisation** : pas de WebSocket/Realtime Supabase. Tout est fait par **polling** (toutes les 2,5 à 10 secondes selon les écrans) sur des tables partagées (`sessions`, `trainer_state`, `mots_messages`, `notifications`...). C'est volontaire et déjà éprouvé — ne pas essayer de migrer vers Supabase Realtime sans qu'on te le demande.
- **`trainer_state`** : table clé-valeur générique (`trainer` = clé texte, `state` = JSON) utilisée comme mini key-value store pour plein de mécanismes temps réel légers (session de formation en cours, sonnette d'accueil...).
- **Auth "login + code en clair"** : `store_managers`, `rh_accounts`, `trainers`, `store_directors`, `collaborateurs` suivent tous le même modèle (colonnes `login`/`code`, comparaison directe, pas de hash sauf `trainers.pin_hash` qui n'est en fait pas vérifiable côté client et n'est pas utilisé — le vrai code formateur passe par des variables d'env `NEXT_PUBLIC_TRAINER_CODE_*` ou `NEXT_PUBLIC_TRAINER_AUTH_JSON`, voir `src/lib/env.js`).
- **Comptes collaborateur** (`collaborateurs.login`/`code`) : créés automatiquement à la validation RH du recrutement, mot de passe générique `LPTSHOP`, changement obligatoire à la 1ère connexion (`doit_changer_code`).
- **Déduplication de code partagé** : quand un composant/une table sert à la fois à un usage individuel et à un usage de groupe (ex: le chat), le réflexe du projet est d'**étendre l'existant** (ajouter une colonne `type`, rendre une FK nullable) plutôt que de dupliquer un système parallèle. Voir le chat de groupe (§5) comme exemple concret de ce pattern.
- **Style de code** : pas de TypeScript, JS simple avec styles inline (objets `style={{...}}`), pas de Tailwind ni de CSS-in-JS lib. Composants fonctionnels + hooks. Commentaires en français, rares, seulement quand la raison d'un choix n'est pas évidente (pas de commentaires qui décrivent juste ce que fait le code).
- **Langue** : toute l'app, le code, les commentaires et les échanges avec Quentin sont en français.

## 4. Modèle de données (tables clés)

| Table | Rôle |
|---|---|
| `candidats` | Pipeline de recrutement RH (statut, CV, lettre, `statut_contrat`) |
| `entrees_rh` | "Entrée" créée à la validation RH (date d'entrée, infos administratives, `statut_contrat`) — référencée à la fois par `candidats.entree_id` et `collaborateurs.entree_id` |
| `entretiens_recrutement` | Entretiens candidat ↔ manager (statut, décision du manager) |
| `collaborateurs` | Fiche relationnelle d'un collaborateur (schéma "moderne", remplace progressivement l'ancien système basé sur `entrees_data`/STORES en dur dans `storeFollowupData.js`) |
| `magasins` | Référentiel magasins (`slug`, `nom`, `region_id`, `type_magasin`: 'magasin'/'entrepot') |
| `regions`, `magasin_regions` | Découpage régional — **attention**, `magasin_regions` contient des données corrompues/dupliquées par endroits (voir piège ci-dessous), préférer `magasins.region_id → regions.nom` pour toute logique fiable. |
| `store_managers`, `store_directors`, `trainers`, `rh_accounts` | Comptes des différents rôles |
| `sessions` | Une salle de formation live (code, `trainer_id`, `status`, `room_type`) |
| `participants` | Qui a rejoint quelle session (`session_code`, `name`, `collaborateur_id` si compte reconnu) |
| `trainer_state` | Key-value JSON générique (sync live, sonnette...) |
| `mots_messages` | Chat — individuel (formateur/manager ↔ 1 collaborateur) ET de groupe par magasin (`type='groupe'`, `magasin_id`) |
| `notifications` | Notifications génériques (`destinataire_login`, `type`, `reference_id`, `lu`) |
| `demandes_intervention` | Manager/direction → formateur/RH |
| `demande_acces_session` | 🔴 Table du chantier QR code en stand-by, voir §6 — **pas encore créée en base**, le fichier SQL existe mais n'a pas été exécuté. |

## 5. Les surfaces de l'application

| Route | Pour qui | Contenu |
|---|---|---|
| `/` | Formé + formateur | Login, rejoindre une session (QR/code), modules, quiz, scénarios, diffusion TV |
| `/rh` | RH | Pipeline recrutement, fiches candidats, entretiens, dossiers documentaires, mails de bienvenue/accès, statut contrat |
| `/manager` | Manager de magasin | Accueil, équipe, demandes, recrutement, reporting, **chat du magasin**, "J'entraîne mon équipe" |
| `/espace-collaborateur` | Nouveau collaborateur | Mode restreint (dossier RH, créer ses accès, préparer son arrivée, contacter son manager) puis dashboard complet une fois `formation_terminee=true` |
| `/collaborateur` | Collaborateur | Consultation des reportings de son magasin (⚠️ compte/session **séparée** de `/espace-collaborateur`, même si c'est la même personne — jamais unifié, identifié comme point d'amélioration) |
| `/direction` | DR / directeur retail | Vue région (DR) ou réseau entier (directeur retail), page par magasin, chat du magasin en lecture/écriture, demandes d'intervention |
| `/fiche-acces` | Collaborateur | Page statique expliquant comment créer ses accès (mail pro, Slack...) |
| `/preparer-mon-arrivee` | Collaborateur | Page d'intro à l'entreprise (vidéo, histoire, fondateurs) — **structure posée, contenus à ajouter** |
| `/sonnette` | Formé (IDF uniquement) | Sonnette virtuelle pour prévenir le formateur de son arrivée (pas d'interphone au 42 bd Sébastopol) |

### Fonctionnalités récemment ajoutées (sessions de fin septembre/début octobre 2026)
- **Chat de groupe par magasin** (manager + tous les collaborateurs + direction en lecture/écriture) — extension de `mots_messages`, badge de non-lus côté manager/collaborateur uniquement (jamais la direction).
- **Chat individuel manager ↔ collaborateur** — extension du chat individuel historique (qui n'était que formateur ↔ collaborateur).
- **Statut du contrat** (Docusign) — piloté à la main par la RH (`entrees_rh.statut_contrat` : `en_attente_pieces`/`envoye_signature`/`signe`), visible par le collaborateur.
- **Badge statut d'entretien** directement sur la liste recrutement RH (avant : il fallait ouvrir chaque fiche).
- **Page "Préparer mon arrivée"** côté espace collaborateur.

## 6. 🔴 CHANTIER EN STAND-BY — NE PAS DÉPLOYER SANS CONFIRMATION 🔴

Un chantier complet existe **en local uniquement**, jamais poussé sur GitHub/Vercel :

**"Reconnaissance automatique du collaborateur au scan du QR code de session"** — remplace le formulaire nom/prénom par la session `espace-collaborateur` active ; sinon, demande d'accès ponctuelle à valider par le formateur en direct.

Fichiers concernés (non commités, visibles dans `git status` comme non suivis/modifiés) :
`src/components/AccountJoinFlow.js`, `DemandesAccesButton.js`, `DemandesAccesPanel.js`, `src/lib/accesSessionApi.js`, `supabase/create-demande-acces-session.sql`, plus des modifications dans `src/app/page.js` et `src/components/Login.js`.

**Règle stricte imposée par Quentin** : ne jamais déployer ce chantier précis sans confirmation explicite et sans ambiguïté de **Quentin (fondateur), Kevin, ou Maxime** — même si l'un d'eux le demande, redemander confirmation avant d'agir ("Tu confirmes vouloir déployer maintenant le changement QR code / identification des formés en salle ?"). Une simple mention en passant ne vaut pas autorisation. Si Quentin ne s'est pas manifesté d'ici le **14 octobre 2026** (~2 semaines après la mise en stand-by), le relancer pour savoir s'il veut déployer.

**Tout nouvel assistant doit traiter ce chantier avec cette même prudence renforcée**, au-delà de la règle générale de prudence sur les push.

## 7. Règles de travail avec Quentin

- **Travail 100% local jusqu'à ordre explicite** (règle instaurée le 24/09/2026) : ne jamais `git commit`/`git push`/déployer sans qu'il le demande clairement. S'il dit juste "push" en passant, lui redemander confirmation explicite plutôt que d'enchaîner.
- **Rendre très visible le statut "pas encore en ligne"** après une fonctionnalité terminée — Quentin teste souvent directement en prod avant de confirmer le push, et revient en disant "ça ne marche pas" alors que c'est juste pas déployé. Réflexe : vérifier `git status`/`git log origin/...` avant de chercher un bug.
- **Branches** : `Quentin-Branch` et `Kevin-Branch` doivent rester synchronisées (fast-forward l'une vers l'autre après chaque push). Kevin committe parfois directement sur le repo en parallèle, sans passer par un assistant IA — toujours `git fetch` avant de pousser pour détecter une divergence.
- **En cas de conflit de merge réel** (branches qui divergent) : ne pas le résoudre seul sans accord — prévenir clairement, demander confirmation explicite avant de fusionner, et ne jamais committer/pousser le résultat sans que Quentin (ou la personne désignée) valide.
- **Après chaque push** : nettoyer les anciens déploiements Vercel (`vercel ls`, `vercel rm <url> --yes`) pour ne garder que le dernier de chaque environnement (Production/Preview).
- **Quand Kevin a codé une zone en parallèle sans assistant IA**, vérifier que les tables Supabase existent réellement avant de diagnostiquer un bug "silencieux" (le code peut référencer des tables jamais créées — `post()`/`sbInsert()` échoue alors silencieusement sans erreur visible).

## 8. Pièges connus (gotchas)

1. **`npx next build` pendant qu'un `next dev` tourne déjà casse ce dernier** (`Cannot find module './NNN.js'`). Toujours vérifier la compilation via les logs d'un `next dev` déjà actif plutôt que relancer un build de prod à côté. Si un build de prod est vraiment nécessaire, prévenir et relancer le serveur dev ensuite (`lsof -ti:3000 -sTCP:LISTEN | xargs kill`, `rm -rf .next`, `npm run dev`).
2. **Accents dans les prénoms/logins formateurs** : `TRAINER_CANONICAL` (`src/lib/constants.js`) doit mapper chaque prénom accentué vers son login sans accent (ex: `'nadège': 'nadege'`, `'mattéo': 'matteo'`). Sans ça, `getFormateurId()`/`getTrainerAvatarKey()` échoue silencieusement et des features comme l'ajout de notes terrain ne fonctionnent plus, sans aucun message d'erreur. **Si un nouveau formateur avec un prénom accentué est ajouté, penser à l'ajouter ici.**
3. **`magasin_regions`** contient des données dupliquées/incohérentes par endroits (ex: un magasin rattaché à deux régions en même temps). Préférer `magasins.region_id → regions.nom` pour toute logique fiable de région (ex: détection Île-de-France).
4. **Beauchamps et Laboratoire Progressif** sont des entrepôts (`type_magasin='entrepot'`) sans région assignée (`region_id=null`, annexes hors grille régionale) — toujours les traiter comme "toujours éligible IDF" dans la logique qui en dépend.
5. **Deux systèmes "nouveaux entrants" coexistent** : l'ancien (`entrees_data` en JSON dans `trainer_state`, roster `STORES` codé en dur dans `storeFollowupData.js`) et le nouveau schéma relationnel (`collaborateurs`). Réconciliés par un matching de nom slugifié (`findCollaborateurByName`), qui peut rater un homonyme ou un nom mal saisi.

## 9. Idées de fonctionnalités déjà identifiées (pas encore construites)

Issues d'un audit complet des trois rôles (RH/manager/collaborateur), par ordre de priorité approximatif :

**RH** : vue calendrier des entretiens de la semaine, alerte proactive "date d'entrée proche + dossier incomplet", lien direct vers l'enveloppe Docusign dans la fiche, vue réseau des périodes d'essai à venir, volet offboarding (inexistant aujourd'hui), bibliothèque de modèles de mail.

**Manager** : checklist jour 1 terrain (badge, tenue, tour du magasin), annuaire simple de l'équipe, comparatif discret "mon équipe vs réseau", rappel structuré avant fin de période d'essai (J-15/J-3), visibilité sur qui forme qui/où/quand.

**Collaborateur** : planning personnel visible dans l'app (pas seulement dans un mail), checklist "à apporter le jour J", annuaire de contacts utiles, FAQ pratique "vie de magasin", espace "mes résultats" de quiz une fois la formation commencée.

Un fil conducteur relevé plusieurs fois : beaucoup de l'information utile existe déjà quelque part (mail, tête de la RH, etc.) mais n'est jamais rendue visible au bon endroit dans l'app — peu de nouvelles données à créer, surtout de la mise en avant.

## 10. Pour bien démarrer avec un nouvel outil

1. Cloner/ouvrir le dépôt existant (déjà sur GitHub), pas besoin de repartir de zéro.
2. Récupérer `.env.local` (non versionné) auprès de Quentin — contient les clés Supabase et les codes formateurs.
3. `npm install` puis `npm run dev`.
4. Lire ce document, et jeter un œil à `CLAUDE.md` à la racine du repo (règles de travail déjà écrites, utile même pour un autre outil).
5. Ne rien pousser/déployer sans confirmation explicite de Quentin — c'est la règle n°1 de ce projet, tous outils confondus.

## 11. Prompt pour l'assistant qui reprend le projet

**Note pratique avant de l'utiliser** : ce prompt seul ne donne pas accès au code — l'assistant doit pouvoir réellement lire les fichiers du dépôt (connecter le dépôt GitHub si l'outil le permet, uploader une archive du dossier, ou coller le contenu des fichiers au fur et à mesure qu'il les demande). Le reste de ce document (sections 1 à 10) sert de "document de passation" référencé dans le script ci-dessous — donne les deux ensemble, dans le même fichier ou en pièce jointe séparée selon ce que l'outil accepte.

Copier-coller le bloc ci-dessous tel quel :

```
Tu reprends la suite du développement d'une application déjà existante et
fonctionnelle, précédemment développée avec un autre assistant IA. Avant de
faire quoi que ce soit, tu dois d'abord comprendre l'état réel du projet.

Étape 1 — Prise de connaissance
1. Lis l'intégralité du dépôt : structure des dossiers, stack technique,
   conventions de code déjà en place.
2. Lis le document de passation ci-joint (handoff.md ou équivalent) qui
   décrit les rôles, la base de données, les fonctionnalités par espace, les
   paramètres en attente et les décisions de conception importantes.
3. Croise les deux : si le document de passation dit une chose et que le
   code en fait une autre, signale l'écart plutôt que de trancher tout seul.

Étape 2 — Restitution avant toute modification
Avant de coder quoi que ce soit, fais-moi un résumé de ce que tu as compris :
- La stack technique et comment le projet est organisé
- Les rôles existants et comment l'authentification fonctionne
- Les tables principales de la base de données et leurs relations
- Les fonctionnalités déjà en place, espace par espace
- Les paramètres ou fonctionnalités volontairement désactivés/en attente
  (feature flags, interrupteurs), et qui a le droit de les activer
- Tout ce qui te semble incohérent, incomplet, ou pas clair dans le code ou
  dans le document de passation

Étape 3 — Liberté technique, résultat identique
Tu peux avoir tes propres méthodes de développement, tes propres conventions
de code, ta propre façon de structurer ou refactoriser le projet, si tu
juges que c'est plus efficace, plus propre ou plus robuste que l'existant.
Tu es libre de l'appliquer. En revanche :
- Le résultat observable pour l'utilisateur doit rester strictement
  identique à ce qui existe aujourd'hui, sauf si je te demande explicitement
  un changement : mêmes écrans, mêmes données, mêmes comportements, mêmes
  règles métier, pour tous les rôles (formateur, manager, DR, directeur
  retail, RH, collaborateur).
- Toute modification interne (structure du code, conventions, choix
  techniques) ne doit jamais changer ce que voit ou peut faire une personne
  qui utilise l'application, sans que je l'aie demandé.
- Si une refonte technique que tu proposes risque de changer un
  comportement visible, même légèrement, préviens-moi et demande
  confirmation avant de l'appliquer — ne pars jamais du principe que "mieux
  coder" autorise à changer le résultat final sans mon accord.
- Si tu modifies la structure de la base de données pour l'améliorer,
  assure-toi qu'aucune donnée existante n'est perdue et que tout reste
  cohérent avec ce qui est décrit dans le document de passation.

Étape 4 — Règles de travail à respecter pour la suite
- Ne jamais créer une nouvelle table ou un nouveau composant sans avoir
  vérifié qu'un équivalent n'existe pas déjà dans le projet
- Réutiliser systématiquement les composants visuels, couleurs et styles
  déjà en place plutôt que d'en créer de nouveaux pour une fonctionnalité
  similaire, sauf si tu proposes explicitement une refonte visuelle et que
  je la valide
- Ne jamais activer un paramètre ou une fonctionnalité explicitement
  marquée "en attente" sans confirmation explicite et sans ambiguïté de ma
  part
- Pour toute demande de ma part qui pourrait entrer en conflit avec une
  fonctionnalité déjà existante, me le signaler avant d'agir plutôt que de
  l'écraser silencieusement
- Travailler par petites étapes vérifiables, avec une étape de vérification
  claire à chaque fin de tâche, plutôt que des changements massifs d'un coup

Ne commence aucun développement tant que je n'ai pas validé ton résumé de
l'étape 2.
```
