import { useLocalStorage } from './useStorage'
import type { Client } from '../types'

export function useClients() {
  const [clients, setClients] = useLocalStorage<Client[]>('clients', [])

  const addClient = (data: Omit<Client, 'id'>): Client => {
    const client: Client = { ...data, id: crypto.randomUUID() }
    setClients(prev => [...prev, client])
    return client
  }

  const updateClient = (id: string, data: Partial<Omit<Client, 'id'>>) => {
    setClients(prev => prev.map(c => (c.id === id ? { ...c, ...data } : c)))
  }

  const deleteClient = (id: string) => {
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const getClient = (id: string) => clients.find(c => c.id === id)

  return { clients, addClient, updateClient, deleteClient, getClient }
}
