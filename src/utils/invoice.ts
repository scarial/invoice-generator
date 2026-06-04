export function formatInvoiceNumber(counter: number, year: number): string {
  return `${year}-${String(counter).padStart(3, '0')}`
}

export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

export function parseDate(str: string): Date {
  const [d, m, y] = str.split('/')
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

export function validateSiret(siret: string): boolean {
  if (!/^\d{14}$/.test(siret)) return false
  let sum = 0
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}
