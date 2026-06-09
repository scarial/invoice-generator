export interface UserInfo {
  nom: string
  entreprise: string
  adresse: string
  codePostal: string
  ville: string
  email: string
  telephone: string
  siret: string
  numeroME?: string
}

export interface Client {
  id: string
  entreprise: string
  contact: string
  adresse: string
  email: string
}

export type Frequence = 'mensuel' | 'annuel' | 'unique'
export type InvoiceType = 'facture' | 'avoir'

export interface InvoiceLine {
  id: string
  designation: string
  periode: string
  frequence: Frequence
  quantite: number
  prixUnitaire: number | null
}

export interface Invoice {
  numero: string
  dateEmission: string
  dateEcheance: string
  type: InvoiceType
  factureReference?: string
  client: Omit<Client, 'id'> | null
  lignes: InvoiceLine[]
}
