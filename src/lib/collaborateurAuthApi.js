// Authentification collaborateur — script 6 (accès lecture aux reportings de
// son magasin + mots/notifications). Aucune colonne d'auth dédiée : le login
// est le slug du collaborateur, le code est son PIN déterministe (même
// fonction que le PIN déjà affiché aux formateurs dans "Entrées de la
// semaine", src/lib/pin.js) — pas de mot de passe à stocker ni distribuer,
// un formateur peut donner ce code de tête à partir de son écran existant.
import { sbSelect } from '@/lib/supabase'
import { generatePin } from '@/lib/pin'

/** slug non unique globalement (unique par magasin) — on récupère toutes les
 * lignes candidates puis on vérifie le PIN en mémoire, jamais côté requête. */
export async function getCollaborateurFromDB(login, code) {
  const candidates = await sbSelect('collaborateurs', `slug=eq.${encodeURIComponent(login)}`)
  if (!candidates?.length) return null
  const match = candidates.find(c => generatePin(`${c.prenom} ${c.nom}`) === code)
  if (!match) return null
  const magasins = await sbSelect('magasins', `id=eq.${match.magasin_id}&select=id,nom,slug`)
  return { ...match, magasin: magasins?.[0] || null }
}
