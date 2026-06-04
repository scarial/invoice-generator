import { Plus, Trash2, Package } from 'lucide-react'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import type { InvoiceLine, Frequence } from '../../../types'
import { formatCurrency } from '../../../utils/invoice'

interface Props {
  lignes: InvoiceLine[]
  onAdd: () => void
  onUpdate: (id: string, data: Partial<InvoiceLine>) => void
  onRemove: (id: string) => void
}

export function ServiceLinesSection({ lignes, onAdd, onUpdate, onRemove }: Props) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Package size={15} />
          Lignes de service
        </div>
        <Button variant="outline" size="xs" onClick={onAdd} className="gap-1">
          <Plus size={12} />
          Ajouter
        </Button>
      </div>

      <div className="p-4 space-y-3">
        {lignes.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            Aucune ligne — cliquez sur "Ajouter"
          </p>
        )}
        {lignes.map((ligne, idx) => (
          <div key={ligne.id} className="border border-slate-100 rounded-md p-3 space-y-2 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Ligne {idx + 1}</span>
              <button
                onClick={() => onRemove(ligne.id)}
                className="text-slate-300 hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </div>

            <Input
              value={ligne.designation}
              onChange={e => onUpdate(ligne.id, { designation: e.target.value })}
              placeholder="Désignation (ex: Développement web)"
              className="text-sm"
            />
            <Input
              value={ligne.periode}
              onChange={e => onUpdate(ligne.id, { periode: e.target.value })}
              placeholder="Période (ex: Abonnement mensuel — Juin 2025)"
              className="text-sm"
            />

            <div className="grid grid-cols-4 gap-2">
              <div className="col-span-1">
                <select
                  value={ligne.frequence}
                  onChange={e => onUpdate(ligne.id, { frequence: e.target.value as Frequence })}
                  className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="mensuel">Mensuel</option>
                  <option value="annuel">Annuel</option>
                </select>
              </div>
              <div className="col-span-1">
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={ligne.quantite}
                  onChange={e => { const n = Number(e.target.value); onUpdate(ligne.id, { quantite: Number.isFinite(n) ? n : 0 }) }}
                  className="text-xs"
                  placeholder="Qté"
                />
              </div>
              <div className="col-span-2">
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={ligne.prixUnitaire || ''}
                  onChange={e => { const n = Number(e.target.value); onUpdate(ligne.id, { prixUnitaire: Number.isFinite(n) ? n : 0 }) }}
                  className="text-xs"
                  placeholder="Prix unitaire HT (€)"
                />
              </div>
            </div>

            <div className="text-right text-xs font-medium text-slate-600">
              Total : {formatCurrency(ligne.quantite * ligne.prixUnitaire)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
