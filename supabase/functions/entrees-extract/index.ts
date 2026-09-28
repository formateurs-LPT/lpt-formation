// Edge Function : extraction de la liste "Entrées de la semaine" (tableau RH)
// à partir d'une photo/capture d'écran OU d'un texte collé — via l'API Groq
// (modèle vision qwen/qwen3.8-27b), clé gardée côté serveur (secret Supabase
// `GROQ_API_KEY`), jamais exposée au client.
//
// Remplace l'ancien flux OCR local (Tesseract.js) + parseur regex maison
// (parseRHTable dans EntreesView.js) — un seul chemin, plus fiable, gère
// aussi bien l'image que le texte collé.
//
// Déploiement : `supabase functions deploy entrees-extract`
// Secret requis : `supabase secrets set GROQ_API_KEY=gsk_...` (déjà défini,
// réutilisé de reporting-generate)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GROQ_MODEL = 'qwen/qwen3.8-27b' // seul modèle Groq avec entrée image à ce jour
const POSTES = [
  'Conseiller Vente Optique', 'Monteur Optique SAV', 'Opticien Lunetier',
  'Store Manager', 'Assistant RH', 'Employé Logistique Polyvalent', 'Téléconseiller',
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

const PROMPT = `Tu extrais la liste des collaborateurs d'un tableau RH (photo ou texte collé). Colonnes habituelles : NOM Prénom, Contrat (heures/semaine), Date de début, Poste, Magasin, Téléphone — toutes ne sont pas toujours présentes, et l'ordre peut varier.

Pour chaque ligne (ignore l'en-tête et toute ligne vide/illisible), extrait :
- nom : en MAJUSCULES tel qu'écrit
- prenom : tel qu'écrit
- magasin : nom du magasin tel qu'écrit (ex: "LPT Chatelet"), vide si absent
- poste : le plus proche parmi cette liste exacte si identifiable, sinon vide : ${POSTES.join(', ')}
- heures : uniquement les chiffres du contrat (ex: "35"), vide si absent

Ignore complètement les numéros de téléphone et les dates. Ne déduis ni n'invente aucune valeur absente du document.

Réponds uniquement avec ce JSON, rien d'autre : {"entrees":[{"nom":"","prenom":"","magasin":"","poste":"","heures":""}]}`

function validateOutput(data: any) {
  if (!data || !Array.isArray(data.entrees)) return false
  for (const e of data.entrees) {
    if (typeof e.nom !== 'string' || typeof e.prenom !== 'string') return false
    if (typeof (e.magasin ?? '') !== 'string') return false
    if (typeof (e.poste ?? '') !== 'string') return false
    if (typeof (e.heures ?? '') !== 'string') return false
  }
  return true
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })

  try {
    const { image, text } = await req.json()
    if (!image && !text?.trim()) return json({ error: 'Aucune image ni texte fourni.' }, 400)

    const apiKey = Deno.env.get('GROQ_API_KEY')
    if (!apiKey) return json({ error: "Clé API Groq non configurée côté serveur." }, 500)

    const content: any[] = [{ type: 'text', text: image ? PROMPT : `${PROMPT}\n\nTexte du tableau :\n${text}` }]
    if (image) content.push({ type: 'image_url', image_url: { url: image } })

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content }],
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error('[entrees-extract] Groq API error', res.status, errText)
      return json({ error: "Extraction impossible (API Groq indisponible)." }, 502)
    }

    const data = await res.json()
    const rawContent = data.choices?.[0]?.message?.content
    if (!rawContent) return json({ error: 'Réponse inattendue du modèle.' }, 502)

    let parsed: any
    try { parsed = JSON.parse(rawContent) } catch {
      return json({ error: "Structure générée invalide." }, 502)
    }
    if (!validateOutput(parsed)) return json({ error: "Structure générée invalide." }, 502)
    if (!parsed.entrees.length) return json({ error: 'Aucun collaborateur détecté. Vérifiez le contenu.' }, 200)

    return json({ entrees: parsed.entrees })
  } catch (e) {
    console.error('[entrees-extract]', e)
    return json({ error: 'Erreur serveur pendant l\'extraction.' }, 500)
  }
})
