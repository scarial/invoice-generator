import { useState } from 'react'
import { ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { Input } from '../../ui/input'
import { Label } from '../../ui/label'
import type { Invoice, InvoiceType } from '../../../types'

interface Props {
  invoice: Pick<Invoice, 'numero' | 'dateEmission' | 'dateEcheance' | 'type' | 'factureReference'>
  onChange: (partial: Partial<Invoice>) => void
}

export function InvoiceMetaSection({ invoice, onChange }: Props) {
  const [open, setOpen] = useState(true)

  // Convert dd/mm/yyyy ↔ yyyy-mm-dd for input[type=date]
  const toInputDate = (fr: string) => {
    if (!fr) return ''
    const [d, m, y] = fr.split('/')
    return `${y}-${m}-${d}`
  }
  const fromInputDate = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    return `${d}/${m}/${y}`
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <FileText size={15} />
          Facture
        </div>
        {open ? <ChevronUp size={15} className="text-slate-400" /> : <ChevronDown size={15} className="text-slate-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Numéro de facture">
              <Input
                value={invoice.numero}
                onChange={e => onChange({ numero: e.target.value })}
                placeholder="2025-001"
              />
            </Field>
            <Field label="Type de document">
              <select
                value={invoice.type}
                onChange={e => onChange({ type: e.target.value as InvoiceType })}
                className="w-full text-sm border border-slate-200 rounded-md px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="facture">Facture</option>
                <option value="avoir">Avoir</option>
              </select>
            </Field>
          </div>

          {invoice.type === 'avoir' && (
            <Field label="Facture de référence n°">
              <Input
                value={invoice.factureReference ?? ''}
                onChange={e => onChange({ factureReference: e.target.value })}
                placeholder="2025-001"
              />
            </Field>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date d'émission">
              <Input
                type="date"
                value={toInputDate(invoice.dateEmission)}
                onChange={e => onChange({ dateEmission: fromInputDate(e.target.value) })}
              />
            </Field>
            <Field label="Date d'échéance">
              <Input
                type="date"
                value={toInputDate(invoice.dateEcheance)}
                onChange={e => onChange({ dateEcheance: fromInputDate(e.target.value) })}
              />
            </Field>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-slate-600">{label}</Label>
      {children}
    </div>
  )
}
