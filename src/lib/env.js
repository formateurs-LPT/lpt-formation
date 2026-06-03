/**
 * Configuration via variables d'environnement (Next.js : préfixe NEXT_PUBLIC_ pour le client).
 * Fichier local : .env.local (non versionné). Modèle : .env.example
 */

function requireEnv(name) {
  const value = process.env[name]
  if (!value || !String(value).trim()) {
    throw new Error(
      `[config] Variable manquante : ${name}. ` +
      'Copiez .env.example vers .env.local, renseignez les valeurs, puis redémarrez npm run dev.'
    )
  }
  return String(value).trim().replace(/^['"]|['"]$/g, '')
}

export function getSupabaseConfig() {
  return {
    url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    key: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  }
}

export function getSessionCode() {
  return requireEnv('NEXT_PUBLIC_SESSION_CODE')
}

/**
 * Codes formateur (.env.local).
 * Next n’injecte dans le navigateur que les variables référencées explicitement
 * (pas de boucle sur process.env).
 */
export function getTrainerCredentials() {
  const trainers = {}

  const jsonRaw = process.env.NEXT_PUBLIC_TRAINER_AUTH_JSON
  if (jsonRaw && String(jsonRaw).trim()) {
    const stripped = String(jsonRaw).trim().replace(/^['"]|['"]$/g, '')
    try {
      const parsed = JSON.parse(stripped)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.assign(trainers, parsed)
      }
    } catch {
      throw new Error('[config] NEXT_PUBLIC_TRAINER_AUTH_JSON : JSON invalide.')
    }
  }

  const kevin = process.env.NEXT_PUBLIC_TRAINER_CODE_KEVIN
  const quentin = process.env.NEXT_PUBLIC_TRAINER_CODE_QUENTIN
  const nadege = process.env.NEXT_PUBLIC_TRAINER_CODE_NADEGE

  if (kevin?.trim()) trainers.kevin = kevin.trim()
  if (quentin?.trim()) trainers.quentin = quentin.trim()
  if (nadege?.trim()) {
    trainers.nadege = nadege.trim()
    trainers['nadège'] = nadege.trim()
  }

  if (Object.keys(trainers).length === 0) {
    throw new Error(
      '[config] Aucun code formateur. Vérifiez .env.local, puis arrêtez et relancez npm run dev (Ctrl+C).'
    )
  }

  return trainers
}
