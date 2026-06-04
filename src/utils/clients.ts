import type { Client } from '../types'

export function isSameClient(a: Omit<Client, 'id'>, b: Omit<Client, 'id'>): boolean {
  const normalize = (s: string) => s.trim().toLowerCase()
  return normalize(a.entreprise) === normalize(b.entreprise) && normalize(a.contact) === normalize(b.contact)
}

export function findMatchingClient(clients: Client[], data: Omit<Client, 'id'>): Client | undefined {
  return clients.find(c => isSameClient(c, data))
}

export function mergeClient(existing: Omit<Client, 'id'>, incoming: Omit<Client, 'id'>): Omit<Client, 'id'> {
  return {
    entreprise: incoming.entreprise || existing.entreprise,
    contact: incoming.contact || existing.contact,
    adresse: incoming.adresse || existing.adresse,
    email: incoming.email || existing.email,
  }
}
