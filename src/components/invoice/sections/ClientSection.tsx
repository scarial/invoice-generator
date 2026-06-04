import { useState } from 'react'
import { ChevronDown, ChevronUp, Users, Save } from 'lucide-react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import { Button } from '../../ui/button'
import { isSameClient } from '../../../utils/clients'
import type { Client, Invoice } from '../../../types'

interface Props {
  clients: Client[]
  currentClient: Invoice['client']
  onClientChange: (client: Invoice['client']) => void
  onSaveClient: (data: Omit<Client, 'id'>) => void
}

export function ClientSection({ clients, currentClient, onClientChange, onSaveClient }: Props) {
  const [open, setOpen] = useState(true)

  // F10: derive selected id from currentClient so the select stays in sync
  const selectedId = currentClient
    ? (clients.find(c => isSameClient(c, currentClient))?.id ?? '')
    : ''

  const handleSelect = (id: string) => {
    if (!id) {
      onClientChange(null)
      return
    }
    const c = clients.find(c => c.id === id)
    if (c) {
      onClientChange({ entreprise: c.entreprise, contact: c.contact, adresse: c.adresse, email: c.email })
    }
  }

  const handleSave = () => {
    if (!currentClient) return
    onSaveClient(currentClient)
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Users size={15} />
          Client
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-600">Client existant</Label>
            <select
              value={selectedId}
              onChange={e => handleSelect(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              <option value="">— Nouveau client —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.entreprise || c.contact}</option>
              ))}
            </select>
          </div>

          <Field label="Nom de l'entreprise cliente">
            <Input
              value={currentClient?.entreprise ?? ''}
              onChange={e => onClientChange({ ...(currentClient ?? emptyClient()), entreprise: e.target.value })}
              placeholder="Entreprise SAS"
            />
          </Field>
          <Field label="Nom du contact">
            <Input
              value={currentClient?.contact ?? ''}
              onChange={e => onClientChange({ ...(currentClient ?? emptyClient()), contact: e.target.value })}
              placeholder="Marie Martin"
            />
          </Field>
          <Field label="Adresse">
            <Input
              value={currentClient?.adresse ?? ''}
              onChange={e => onClientChange({ ...(currentClient ?? emptyClient()), adresse: e.target.value })}
              placeholder="5 avenue des Fleurs, 69001 Lyon"
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={currentClient?.email ?? ''}
              onChange={e => onClientChange({ ...(currentClient ?? emptyClient()), email: e.target.value })}
              placeholder="contact@entreprise.fr"
            />
          </Field>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!currentClient?.entreprise && !currentClient?.contact}
            className="w-full gap-2"
          >
            <Save size={13} />
            Sauvegarder ce client
          </Button>
        </div>
      )}
    </div>
  )
}

function emptyClient() {
  return { entreprise: '', contact: '', adresse: '', email: '' }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-600">{label}</Label>
      {children}
    </div>
  )
}
