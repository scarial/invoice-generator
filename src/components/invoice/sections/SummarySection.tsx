import { formatCurrency } from '../../../utils/invoice'

interface Props {
  totalHT: number
}

export function SummarySection({ totalHT }: Props) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-slate-50">
        <span className="text-sm font-semibold text-slate-700">Récapitulatif</span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex justify-between text-sm text-slate-600">
          <span>Total HT</span>
          <span className="font-medium">{formatCurrency(totalHT)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400 italic">
          <span>TVA non applicable – art. 293 B du CGI</span>
        </div>
        <div className="flex justify-between text-base font-bold text-slate-800 border-t border-slate-200 pt-2 mt-2">
          <span>Total TTC</span>
          <span>{formatCurrency(totalHT)}</span>
        </div>
      </div>
    </div>
  )
}
