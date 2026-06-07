import { GoogleGenerativeAI } from '@google/generative-ai'
import { z } from 'zod'

const MAX_INPUT_LENGTH = 4000

const ExtractionSchema = z.object({
  client: z.object({
    contact: z.string().max(200).nullable(),
    entreprise: z.string().max(200).nullable(),
    adresse: z.string().max(500).nullable(),
    email: z.string().max(200).nullable(),
  }),
  lignes: z.array(
    z.object({
      designation: z.string().max(500),
      quantite: z.number().finite().nonnegative().max(10000),
      prixUnitaire: z.number().finite().nonnegative().max(1_000_000),
      frequence: z.enum(['mensuel', 'annuel', 'unique']),
    })
  ).max(50),
  tva: z.number().finite().nonnegative().max(100).nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  warnings: z.array(z.string()).max(20),
})

export type ExtractionResult = z.infer<typeof ExtractionSchema>

const SYSTEM_PROMPT = `Tu es un assistant de facturation. À partir d'une dictée vocale ou d'un message texte en français, tu extrais les informations d'une facture et tu retournes un objet JSON strict.

Règles absolues :
- Retourne UNIQUEMENT le JSON, aucun texte autour.
- Si une information est absente, utilise null (jamais une chaîne vide ou une valeur inventée).
- Pour les montants : convertis toujours les mots en chiffres ("dix mille" → 10000, "cinq cents" → 500).
- Pour la TVA : si non précisée, utilise null (ne suppose pas 20%).
- Pour les lignes : chaque prestation distincte = une ligne séparée.
- Pour les quantités : "3 mois" → quantite: 3, frequence: "mensuel". "6 mois" → quantite: 6, frequence: "mensuel".
- Le nom du client va dans le champ "contact". Le nom de l'entreprise si précisé va dans "entreprise", sinon null.
- Orthographe des noms propres : retranscris exactement ce que tu entends, sans corriger.

Schema de sortie :
{
  "client": {
    "contact": string | null,
    "entreprise": string | null,
    "adresse": string | null,
    "email": string | null
  },
  "lignes": [
    {
      "designation": string,
      "quantite": number,
      "prixUnitaire": number,
      "frequence": "mensuel" | "annuel" | "unique"
    }
  ],
  "tva": number | null,
  "confidence": "high" | "medium" | "low",
  "warnings": string[]
}

Utilise "warnings" pour signaler toute ambiguïté (ex: "TVA non précisée", "Nom du client potentiellement mal orthographié").
Utilise "confidence: low" si tu as dû faire des suppositions importantes.`

function extractJsonObject(raw: string): string {
  const start = raw.indexOf('{')
  const end = raw.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return raw
  return raw.slice(start, end + 1)
}

export async function extractInvoiceFromText(text: string): Promise<ExtractionResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY
  if (!apiKey || apiKey === 'your_google_ai_api_key_here') {
    throw new Error('Clé API Google AI manquante. Ajoutez VITE_GOOGLE_AI_KEY dans .env.local')
  }

  const capped = text.slice(0, MAX_INPUT_LENGTH)
  const model = import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash-exp'
  const genAI = new GoogleGenerativeAI(apiKey)
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
  })

  const result = await generativeModel.generateContent(capped)
  const raw = result.response.text().trim()
  const json = extractJsonObject(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error("L'IA n'a pas retourné un JSON valide. Réessayez en reformulant.")
  }

  return ExtractionSchema.parse(parsed)
}
