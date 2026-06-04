import type { Client } from '../types'

const CSV_HEADERS = ['entreprise', 'contact', 'adresse', 'email'] as const

// F4: neutralize formula injection (Excel/Sheets executes = + - @ as formulas)
function sanitizeCell(val: string): string {
  return /^[=+\-@\t\r]/.test(val) ? `'${val}` : val
}

function quoteCell(val: string): string {
  return `"${sanitizeCell(val).replace(/"/g, '""')}"`
}

export function exportClientsCSV(clients: Client[]): void {
  const rows = [
    CSV_HEADERS.join(','),
    ...clients.map(c =>
      CSV_HEADERS.map(h => quoteCell(c[h] ?? '')).join(',')
    ),
  ]
  const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'clients.csv'
  link.click()
  URL.revokeObjectURL(url)
}

// F3: RFC-4180 aware CSV parser (handles quoted fields with commas and newlines)
function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === '"') {
      i++
      let field = ''
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"'
          i += 2
        } else if (line[i] === '"') {
          i++
          break
        } else {
          field += line[i++]
        }
      }
      fields.push(field)
      if (line[i] === ',') i++
    } else {
      const end = line.indexOf(',', i)
      if (end === -1) {
        fields.push(line.slice(i))
        break
      }
      fields.push(line.slice(i, end))
      i = end + 1
    }
  }
  return fields
}

export function parseClientsCSV(text: string): Omit<Client, 'id'>[] {
  // Strip BOM and normalize line endings
  const normalized = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = normalized.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(h => h.trim())
  const requiredHeaders = CSV_HEADERS as readonly string[]
  if (!requiredHeaders.every(h => headers.includes(h))) return []

  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = parseCsvLine(line)
      const obj: Record<string, string> = {}
      headers.forEach((h, i) => { obj[h] = (values[i] ?? '').trim() })
      return {
        entreprise: obj['entreprise'] ?? '',
        contact: obj['contact'] ?? '',
        adresse: obj['adresse'] ?? '',
        email: obj['email'] ?? '',
      }
    })
}

export function importClientsCSV(file: File): Promise<Omit<Client, 'id'>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(parseClientsCSV((e.target?.result as string) ?? ''))
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })
}
