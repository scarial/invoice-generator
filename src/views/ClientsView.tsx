import { useRef, useState } from 'react'
import { Pencil, Trash2, ArrowRight, Download, Upload, X, Check } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { useClients } from '../hooks/useClients'
import { exportClientsCSV, importClientsCSV } from '../utils/csv'
import { findMatchingClient, mergeClient } from '../utils/clients'
import type { Client } from '../types'

interface Props {
  onLoadClient: (client: Omit<Client, 'id'>) => void
}

interface PendingImport {
  incoming: Omit<Client, 'id'>[]
  duplicates: { incoming: Omit<Client, 'id'>; existing: Client }[]
  fresh: Omit<Client, 'id'>[]
}

export function ClientsView({ onLoadClient }: Props) {
  const { clients, addClient, updateClient, deleteClient } = useClients()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Client>>({})
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [dupResolution, setDupResolution] = useState<Record<string, 'merge' | 'replace' | 'ignore'>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startEdit = (c: Client) => {
    setEditingId(c.id)
    setEditData({ entreprise: c.entreprise, contact: c.contact, adresse: c.adresse, email: c.email })
  }

  const saveEdit = () => {
    if (!editingId) return
    updateClient(editingId, editData)
    setEditingId(null)
  }

  const cancelEdit = () => setEditingId(null)

  const handleDelete = (id: string) => {
    if (window.confirm('Supprimer ce client définitivement ?')) deleteClient(id)
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const rows = await importClientsCSV(file)
    const duplicates: PendingImport['duplicates'] = []
    const fresh: Omit<Client, 'id'>[] = []
    for (const row of rows) {
      const existing = findMatchingClient(clients, row)
      if (existing) duplicates.push({ incoming: row, existing })
      else fresh.push(row)
    }
    if (duplicates.length === 0) {
      fresh.forEach(r => addClient(r))
    } else {
      const res: Record<string, 'merge' | 'replace' | 'ignore'> = {}
      duplicates.forEach(d => { res[d.existing.id] = 'merge' })
      setPendingImport({ incoming: rows, duplicates, fresh })
      setDupResolution(res)
    }
  }

  const confirmImport = () => {
    if (!pendingImport) return
    pendingImport.fresh.forEach(r => addClient(r))
    pendingImport.duplicates.forEach(({ incoming, existing }) => {
      const action = dupResolution[existing.id] ?? 'ignore'
      if (action === 'replace') updateClient(existing.id, incoming)
      else if (action === 'merge') updateClient(existing.id, mergeClient(existing, incoming))
    })
    setPendingImport(null)
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800">Clients</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportClientsCSV(clients)} className="gap-2">
            <Download size={14} />
            Exporter CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="gap-2">
            <Upload size={14} />
            Importer CSV
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleImportFile} />
        </div>
      </div>

      {/* Modal doublons */}
      {pendingImport && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-4">
            <h3 className="font-bold text-slate-800">Doublons détectés</h3>
            <p className="text-sm text-slate-500">{pendingImport.fresh.length} nouveaux clients seront ajoutés. Choisissez comment traiter les doublons :</p>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {pendingImport.duplicates.map(({ existing }) => (
                <div key={existing.id} className="border border-slate-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-slate-700 mb-2">{existing.entreprise || existing.contact}</p>
                  <div className="flex gap-2">
                    {(['merge', 'replace', 'ignore'] as const).map(action => (
                      <button
                        key={action}
                        onClick={() => setDupResolution(r => ({ ...r, [existing.id]: action }))}
                        className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${dupResolution[existing.id] === action ? 'bg-slate-700 text-white border-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {action === 'merge' ? 'Fusionner' : action === 'replace' ? 'Remplacer' : 'Ignorer'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setPendingImport(null)}>Annuler</Button>
              <Button size="sm" onClick={confirmImport} className="bg-slate-700 hover:bg-slate-800 text-white">Confirmer l'import</Button>
            </div>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">Aucun client enregistré.</p>
          <p className="text-xs mt-1">Ajoutez des clients depuis l'éditeur de facture ou importez un CSV.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entreprise</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Adresse</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  {editingId === client.id ? (
                    <>
                      <td className="px-4 py-2"><Input value={editData.entreprise ?? ''} onChange={e => setEditData(d => ({ ...d, entreprise: e.target.value }))} className="text-xs h-7" /></td>
                      <td className="px-4 py-2"><Input value={editData.contact ?? ''} onChange={e => setEditData(d => ({ ...d, contact: e.target.value }))} className="text-xs h-7" /></td>
                      <td className="px-4 py-2"><Input value={editData.adresse ?? ''} onChange={e => setEditData(d => ({ ...d, adresse: e.target.value }))} className="text-xs h-7" /></td>
                      <td className="px-4 py-2"><Input value={editData.email ?? ''} onChange={e => setEditData(d => ({ ...d, email: e.target.value }))} className="text-xs h-7" /></td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={saveEdit} className="text-green-500 hover:text-green-600"><Check size={14} /></button>
                          <button onClick={cancelEdit} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-slate-800 font-medium">{client.entreprise}</td>
                      <td className="px-4 py-3 text-slate-600">{client.contact}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{client.adresse}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{client.email}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => startEdit(client)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100" title="Modifier">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(client.id)} className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-red-50" title="Supprimer">
                            <Trash2 size={13} />
                          </button>
                          <button onClick={() => onLoadClient(client)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100" title="Charger dans l'éditeur">
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

