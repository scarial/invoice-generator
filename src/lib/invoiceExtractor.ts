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
      prixUnitaire: z.number().finite().nonnegative().max(1_000_000).nullable(),
      frequence: z.enum(['mensuel', 'annuel', 'unique']),
    })
  ).max(50),
  tva: z.number().finite().nonnegative().max(100).nullable(),
  confidence: z.enum(['high', 'medium', 'low']),
  warnings: z.array(z.string()).max(20),
})

export type ExtractionResult = z.infer<typeof ExtractionSchema>

const SYSTEM_PROMPT = `Tu es un assistant de facturation. À partir d'une dictée vocale ou d'un message texte en français, tu retournes l'état COMPLET et FINAL de la facture en JSON strict.

Règles absolues :
- Retourne UNIQUEMENT le JSON, aucun texte autour.
- Tu retournes TOUJOURS l'intégralité de la facture (toutes les lignes, tous les champs), pas seulement ce qui change.
- Applique uniquement les modifications explicitement demandées dans le dernier message. Ne réinterprète pas les messages précédents.
- L'historique de conversation sert uniquement à connaître l'état actuel de la facture — ne rejoue jamais les actions passées.
- Si une information est absente ou non modifiée, conserve la valeur existante (ou null si jamais renseignée).
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
      "prixUnitaire": number | null,
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

export type ChatMessage = { role: 'user' | 'model'; text: string }

export class ApiKeyInvalidError extends Error {
  constructor() { super('Clé API invalide ou révoquée. Vérifiez votre clé dans les paramètres.') }
}

export class ApiKeyMissingError extends Error {
  constructor() { super('Aucune clé API configurée.') }
}

function mapGoogleError(err: unknown): never {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid') || msg.includes('401') || msg.includes('403')) {
    throw new ApiKeyInvalidError()
  }
  if (msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error('Quota API dépassé. Attendez quelques minutes avant de réessayer.')
  }
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
    throw new Error('Impossible de contacter l\'API Google. Vérifiez votre connexion internet.')
  }
  throw new Error(`Erreur de l'API Google AI : ${msg}`)
}

export async function extractInvoiceFromText(
  text: string,
  history: ChatMessage[] = [],
  apiKey?: string,
): Promise<{ result: ExtractionResult; updatedHistory: ChatMessage[] }> {
  const key = apiKey || import.meta.env.VITE_GOOGLE_AI_KEY
  if (!key) throw new ApiKeyMissingError()

  const capped = text.slice(0, MAX_INPUT_LENGTH)
  // Garde uniquement les 4 derniers échanges pour réduire la latence
  const trimmedHistory = history.slice(-4)
  const model = import.meta.env.VITE_AI_MODEL || 'gemini-2.0-flash-lite'
  const genAI = new GoogleGenerativeAI(key)
  const generativeModel = genAI.getGenerativeModel({
    model,
    systemInstruction: SYSTEM_PROMPT,
  })

  const chat = generativeModel.startChat({
    history: trimmedHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
  })

  let raw: string
  try {
    const chatResult = await chat.sendMessage(capped)
    raw = chatResult.response.text().trim()
  } catch (err) {
    mapGoogleError(err)
  }

  const json = extractJsonObject(raw!)

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error("L'IA n'a pas retourné un JSON valide. Réessayez en reformulant.")
  }

  const extraction = ExtractionSchema.parse(parsed)

  // Ajoute un warning pour chaque ligne sans prix
  const missingPrices = extraction.lignes
    .filter(l => l.prixUnitaire === null)
    .map(l => `Prix unitaire manquant pour "${l.designation}" — à compléter manuellement.`)
  if (missingPrices.length > 0) {
    extraction.warnings = [...extraction.warnings, ...missingPrices]
    extraction.confidence = 'low'
  }

  const updatedHistory: ChatMessage[] = [
    ...history,
    { role: 'user', text: capped },
    { role: 'model', text: raw },
  ]
  return { result: extraction, updatedHistory }
}
