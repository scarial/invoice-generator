import { useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { FilePlus, Download } from 'lucide-react'
import { Button } from '../components/ui/button'
import { InvoicePreview } from '../components/invoice/InvoicePreview'
import { UserInfoSection } from '../components/invoice/sections/UserInfoSection'
import { ClientSection } from '../components/invoice/sections/ClientSection'
import { InvoiceMetaSection } from '../components/invoice/sections/InvoiceMetaSection'
import { ServiceLinesSection } from '../components/invoice/sections/ServiceLinesSection'
import { SummarySection } from '../components/invoice/sections/SummarySection'
import { AIAssistantBar } from '../components/ai/AIAssistantBar'
import { useUserInfo } from '../hooks/useUserInfo'
import { useClients } from '../hooks/useClients'
import { useInvoice } from '../hooks/useInvoice'
import { findMatchingClient } from '../utils/clients'
import type { Client, Invoice, InvoiceLine } from '../types'
import type { ExtractionResult } from '../lib/invoiceExtractor'

interface Props {
  preloadedClient?: Omit<Client, 'id'> | null
}

export function InvoiceEditor({ preloadedClient }: Props) {
  const { userInfo, updateUserInfo } = useUserInfo()
  const { clients, addClient, updateClient } = useClients()
  const { invoice, updateInvoice, initInvoice, addLine, addLineFrom, updateLine, removeLine, totalHT } = useInvoice()
  const previewRef = useRef<HTMLDivElement>(null)
  const fillTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // F2 fix: sync preloadedClient into invoice state immediately so there is one source of truth
  useEffect(() => {
    if (preloadedClient != null) {
      updateInvoice({ client: preloadedClient })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadedClient])

  useEffect(() => {
    return () => {
      fillTimersRef.current.forEach(clearTimeout)
    }
  }, [])

  const handlePrint = useReactToPrint({ contentRef: previewRef, documentTitle: `Facture-${invoice.numero}` })

  const handleSaveClient = (data: Omit<Client, 'id'>) => {
    const existing = findMatchingClient(clients, data)
    if (existing) {
      updateClient(existing.id, data)
    } else {
      addClient(data)
    }
  }

  const handleClientChange = (client: Invoice['client']) => {
    updateInvoice({ client })
  }

  const handleAIExtracted = (result: ExtractionResult) => {
    // Cancel any in-progress fill from a previous extraction
    fillTimersRef.current.forEach(clearTimeout)
    fillTimersRef.current = []

    let delay = 0
    const STEP = 80

    // Merge only non-null AI client fields into current client (captured at call time)
    const { contact, entreprise, adresse, email } = result.client
    if (contact !== null || entreprise !== null || adresse !== null || email !== null) {
      const existingClient = invoice.client
      const t = setTimeout(() => {
        updateInvoice({
          client: {
            contact: contact ?? existingClient?.contact ?? '',
            entreprise: entreprise ?? existingClient?.entreprise ?? '',
            adresse: adresse ?? existingClient?.adresse ?? '',
            email: email ?? existingClient?.email ?? '',
          },
        })
      }, delay)
      fillTimersRef.current.push(t)
      delay += STEP
    }

    // Append extracted lines progressively
    result.lignes.forEach((ligne) => {
      const t = setTimeout(() => {
        const line: InvoiceLine = {
          id: crypto.randomUUID(),
          designation: ligne.designation,
          periode: '',
          frequence: ligne.frequence,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
        }
        addLineFrom(line)
      }, delay)
      fillTimersRef.current.push(t)
      delay += STEP
    })
  }

  return (
    <div className="flex h-full gap-0">
      {/* Panneau de contrôle (40%) */}
      <div className="w-[40%] min-w-[380px] border-r border-slate-200 bg-slate-50 flex flex-col">
        {/* Boutons d'action */}
        <div className="flex gap-2 px-4 py-3 border-b border-slate-200 bg-white">
          <Button variant="outline" size="sm" onClick={initInvoice} className="gap-2 flex-1">
            <FilePlus size={14} />
            Nouvelle facture
          </Button>
          <Button size="sm" onClick={() => handlePrint()} className="gap-2 flex-1 bg-slate-700 hover:bg-slate-800 text-white">
            <Download size={14} />
            Télécharger PDF
          </Button>
        </div>

        {/* Barre d'assistance IA */}
        <AIAssistantBar onExtracted={handleAIExtracted} />

        {/* Sections scrollables */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <UserInfoSection userInfo={userInfo} onChange={updateUserInfo} />
          <ClientSection
            clients={clients}
            currentClient={invoice.client}
            onClientChange={handleClientChange}
            onSaveClient={handleSaveClient}
          />
          <InvoiceMetaSection invoice={invoice} onChange={updateInvoice} />
          <ServiceLinesSection
            lignes={invoice.lignes}
            onAdd={addLine}
            onUpdate={updateLine}
            onRemove={removeLine}
          />
          <SummarySection totalHT={totalHT} />
        </div>
      </div>

      {/* Aperçu A4 (60%) */}
      <div className="flex-1 bg-slate-100 overflow-y-auto flex justify-center py-8 px-6">
        <div className="shadow-xl rounded-sm">
          <InvoicePreview
            ref={previewRef}
            invoice={invoice}
            userInfo={userInfo}
            totalHT={totalHT}
          />
        </div>
      </div>
    </div>
  )
}
