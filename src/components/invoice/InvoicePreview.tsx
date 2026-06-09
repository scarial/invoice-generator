import { forwardRef } from 'react'
import type { Invoice, UserInfo } from '../../types'
import { formatCurrency } from '../../utils/invoice'

interface Props {
  invoice: Invoice
  userInfo: UserInfo
  totalHT: number
}

export const InvoicePreview = forwardRef<HTMLDivElement, Props>(({ invoice, userInfo, totalHT }, ref) => {
  const isAvoir = invoice.type === 'avoir'

  return (
    <div
      ref={ref}
      className="invoice-print-area bg-white text-slate-900"
      style={{ width: '210mm', minHeight: '297mm', padding: '16mm 14mm', fontFamily: 'Inter, sans-serif', fontSize: '10pt', lineHeight: '1.5' }}
    >
      {/* En-tête */}
      <div className="flex justify-between items-start mb-8">
        {/* Émetteur */}
        <div>
          {userInfo.entreprise && (
            <div className="text-2xl font-bold text-slate-800 mb-1">{userInfo.entreprise}</div>
          )}
          {userInfo.nom && <div className="text-sm text-slate-600">{userInfo.nom}</div>}
          {userInfo.adresse && <div className="text-sm text-slate-600">{userInfo.adresse}</div>}
          {(userInfo.codePostal || userInfo.ville) && (
            <div className="text-sm text-slate-600">{userInfo.codePostal} {userInfo.ville}</div>
          )}
          {userInfo.email && <div className="text-sm text-slate-600">{userInfo.email}</div>}
          {userInfo.telephone && <div className="text-sm text-slate-600">{userInfo.telephone}</div>}
          {userInfo.siret && (
            <div className="text-xs text-slate-500 mt-1">SIRET : {userInfo.siret}</div>
          )}
          {userInfo.numeroME && (
            <div className="text-xs text-slate-500">N° ME : {userInfo.numeroME}</div>
          )}
        </div>

        {/* Titre + numéro */}
        <div className="text-right">
          <div className="text-xl font-bold text-slate-700 uppercase tracking-wide">
            {isAvoir ? 'Avoir' : 'Facture'}
          </div>
          <div className="text-lg font-semibold text-slate-600 mt-0.5">N° {invoice.numero}</div>
          {isAvoir && invoice.factureReference && (
            <div className="text-xs text-slate-500 mt-1">Réf. facture : {invoice.factureReference}</div>
          )}
          <div className="text-xs text-slate-500 mt-2">
            <div>Émission : {invoice.dateEmission}</div>
            <div>Échéance : {invoice.dateEcheance}</div>
          </div>
        </div>
      </div>

      {/* Ligne séparatrice */}
      <div className="border-t-2 border-slate-200 mb-6" />

      {/* Destinataire */}
      {invoice.client && (
        <div className="mb-8 flex justify-end">
          <div className="bg-slate-50 rounded-lg px-5 py-3 min-w-48">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Facturé à</div>
            {invoice.client.entreprise && <div className="font-semibold text-slate-800">{invoice.client.entreprise}</div>}
            {invoice.client.contact && <div className="text-sm text-slate-600">{invoice.client.contact}</div>}
            {invoice.client.adresse && <div className="text-sm text-slate-600">{invoice.client.adresse}</div>}
            {invoice.client.email && <div className="text-sm text-slate-500">{invoice.client.email}</div>}
          </div>
        </div>
      )}

      {/* Tableau des lignes */}
      <table className="w-full text-sm mb-6" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Désignation</th>
            <th className="text-left py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Période</th>
            <th className="text-center py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Qté</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">P.U. HT</th>
            <th className="text-right py-2 px-3 text-xs font-semibold text-slate-600 uppercase tracking-wide">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lignes.map((ligne, idx) => (
            <tr key={ligne.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td className="py-2 px-3 text-slate-800">{ligne.designation}</td>
              <td className="py-2 px-3 text-slate-600 text-xs">
                <div>{ligne.periode}</div>
                <div className="text-slate-400 capitalize">{ligne.frequence}</div>
              </td>
              <td className="py-2 px-3 text-center text-slate-700">{ligne.quantite}</td>
              <td className="py-2 px-3 text-right text-slate-700">{ligne.prixUnitaire !== null ? formatCurrency(ligne.prixUnitaire) : '—'}</td>
              <td className="py-2 px-3 text-right font-medium text-slate-800">{ligne.prixUnitaire !== null ? formatCurrency(ligne.quantite * ligne.prixUnitaire) : '—'}</td>
            </tr>
          ))}
          {invoice.lignes.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-300 italic">Aucune ligne de service</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Récapitulatif */}
      <div className="flex justify-end mb-8">
        <div className="w-64 space-y-1">
          <div className="flex justify-between text-sm text-slate-600 pb-1">
            <span>Total HT</span>
            <span className="font-medium">{formatCurrency(totalHT)}</span>
          </div>
          <div className="text-xs text-slate-400 italic text-center py-1 border-y border-slate-100">
            TVA non applicable – art. 293 B du CGI
          </div>
          <div className="flex justify-between font-bold text-slate-900 text-base pt-1">
            <span>Total TTC</span>
            <span>{formatCurrency(totalHT)}</span>
          </div>
        </div>
      </div>

      {/* Pied de page légal */}
      <div className="mt-auto border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-400">
          En cas de retard de paiement, des pénalités de retard calculées au taux légal en vigueur seront appliquées, ainsi qu'une indemnité forfaitaire pour frais de recouvrement de <strong>40 €</strong> (art. L.441-10 du Code de commerce).
        </p>
      </div>
    </div>
  )
})

InvoicePreview.displayName = 'InvoicePreview'
