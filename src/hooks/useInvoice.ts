import { useEffect } from 'react'
import { useLocalStorage } from './useStorage'
import type { Invoice, InvoiceLine } from '../types'
import { formatInvoiceNumber, formatDate, addDays } from '../utils/invoice'

const PAYMENT_TERMS_DAYS = 30

function makeDefaultInvoice(): Invoice {
  const now = new Date()
  return {
    numero: '',
    dateEmission: formatDate(now),
    dateEcheance: formatDate(addDays(now, PAYMENT_TERMS_DAYS)),
    type: 'facture',
    factureReference: '',
    client: null,
    lignes: [],
  }
}

export function useInvoice() {
  const [invoice, setInvoice] = useLocalStorage<Invoice>('currentInvoice', makeDefaultInvoice())
  const [counter, setCounter] = useLocalStorage<number>('invoiceCounter', 0)

  const generateNextNumber = (): string => {
    const next = counter + 1
    setCounter(next)
    return formatInvoiceNumber(next, new Date().getFullYear())
  }

  // F1 fix: init numero via useEffect, not during render
  useEffect(() => {
    if (!invoice.numero) {
      setInvoice(prev => ({ ...prev, numero: generateNextNumber() }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initInvoice = () => {
    const numero = generateNextNumber()
    const now = new Date()
    setInvoice(prev => ({
      ...makeDefaultInvoice(),
      numero,
      dateEmission: formatDate(now),
      dateEcheance: formatDate(addDays(now, PAYMENT_TERMS_DAYS)),
      client: prev.client,
    }))
  }

  const updateInvoice = (partial: Partial<Invoice>) => {
    setInvoice(prev => ({ ...prev, ...partial }))
  }

  const addLine = () => {
    const line: InvoiceLine = {
      id: crypto.randomUUID(),
      designation: '',
      periode: '',
      frequence: 'mensuel',
      quantite: 1,
      prixUnitaire: 0,
    }
    setInvoice(prev => ({ ...prev, lignes: [...prev.lignes, line] }))
  }

  const addLineFrom = (line: InvoiceLine) => {
    setInvoice(prev => ({ ...prev, lignes: [...prev.lignes, line] }))
  }

  const updateLine = (id: string, data: Partial<InvoiceLine>) => {
    setInvoice(prev => ({
      ...prev,
      lignes: prev.lignes.map(l => (l.id === id ? { ...l, ...data } : l)),
    }))
  }

  const removeLine = (id: string) => {
    setInvoice(prev => ({ ...prev, lignes: prev.lignes.filter(l => l.id !== id) }))
  }

  const totalHT = invoice.lignes.reduce((sum, l) => {
    const q = Number.isFinite(l.quantite) ? l.quantite : 0
    const p = Number.isFinite(l.prixUnitaire) ? l.prixUnitaire : 0
    return sum + q * p
  }, 0)

  return { invoice, updateInvoice, initInvoice, addLine, addLineFrom, updateLine, removeLine, totalHT }
}
