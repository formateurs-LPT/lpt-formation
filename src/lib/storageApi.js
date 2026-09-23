// Upload de pièces jointes (photos/vidéos) vers Supabase Storage — bucket
// PRIVÉ (jamais public) : les fichiers ne sont accessibles qu'via une URL
// signée générée à la demande, jamais par une URL publique indexable
// (photos/vidéos de terrain, potentiellement sensibles).
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SB_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export const NOTES_TERRAIN_BUCKET = 'notes-terrain'

function sbHeaders(extra = {}) {
  return { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, ...extra }
}

/** Upload un fichier, renvoie le chemin stocké (pas une URL) à garder en base. */
export async function uploadPieceJointe(file, { magasinId, prefix = 'note' } = {}) {
  const ext = (file.name?.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '')
  const path = `${magasinId}/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const res = await fetch(`${SB_URL}/storage/v1/object/${NOTES_TERRAIN_BUCKET}/${path}`, {
    method: 'POST',
    headers: sbHeaders({ 'Content-Type': file.type || 'application/octet-stream' }),
    body: file,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[uploadPieceJointe]', res.status, err)
    return null
  }
  return path
}

/** URL signée temporaire (1h) pour afficher/lire une pièce jointe. */
export async function getSignedUrl(path, expiresIn = 3600) {
  if (!path) return null
  try {
    const res = await fetch(`${SB_URL}/storage/v1/object/sign/${NOTES_TERRAIN_BUCKET}/${path}`, {
      method: 'POST',
      headers: sbHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.signedURL ? `${SB_URL}/storage/v1${data.signedURL}` : null
  } catch {
    return null
  }
}
