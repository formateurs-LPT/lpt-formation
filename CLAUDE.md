# Règles de travail

- La branche de travail dépend de qui travaille : `Kevin-Branch` ou `Quentin-Branch`. Avant toute action git (commit, push, etc.), vérifier que le dépôt est sur la bonne branche pour la personne concernée. Si le dépôt est déjà sur `Kevin-Branch` ou `Quentin-Branch`, considérer que c'est la bonne. Si ce n'est ni l'une ni l'autre (ex: `main`), demander qui travaille avant de continuer.
- Toujours vérifier que `Quentin-Branch` et `Kevin-Branch` sont au même niveau (mêmes commits/à jour l'une par rapport à l'autre). Si ce n'est pas le cas, merger les branches.
- **En cas de conflit de merge : ne pas tenter de le résoudre seul.** Écrire un avertissement en gros et appeler Maxime.
- Toutes les 2-3h, demander à l'utilisateur s'il veut merger `Kevin-Branch` et `Quentin-Branch`.
- Maintenant que tu as accès a Supabase, si tu crées des tables assure toi que la sécurité de l'app soit toujours bonnes.
-Tous les 50 déploiement Vercel, supprimes en 45 laisse uniquement les 5 derniers.
-Enfin, plus de déploiement abusif, privilégie le développement en local puis un déploiement Vercel après avoir tester la feature complète et qu'elle soit fonctionnel. Rappelle le moi si besoin d'ailleurs et si je te confirme de taffer directement en dehors du local alors fait le, mais demande moi une confirmation avant.