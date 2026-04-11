import * as XLSX from 'xlsx'
import { parseSpanishDate, normalizeStatus, normalizePriority, parseResolutionTime } from './utils'
import type { ImportRow } from './types'
import { resolveTicketCategory } from './ticket-category-utils'

interface RawRow {
  [key: string]: string | number | undefined
}

const COLUMN_MAP: Record<string, string> = {
  'orden': 'order_number',
  'estado': 'status',
  'fecha': 'created_at',
  'prioridad': 'priority',
  'tecnico': 'technician',
  'técnico': 'technician',
  'solicito': 'requester',
  'solicitó': 'requester',
  'reporte': 'description',
  'tipo de servicio': 'service_type',
  'tiempo': 'resolution_time_display',
}

function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const header of headers) {
    const normalized = header.toLowerCase().trim()
    for (const [pattern, field] of Object.entries(COLUMN_MAP)) {
      if (normalized.includes(pattern)) {
        mapping[header] = field
        break
      }
    }
  }
  return mapping
}

export function parseExcelFile(buffer: ArrayBuffer): { headers: string[]; rows: RawRow[]; mapping: Record<string, string> } {
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' })

  if (jsonData.length === 0) return { headers: [], rows: [], mapping: {} }

  const headers = Object.keys(jsonData[0])
  const mapping = autoMapColumns(headers)

  return { headers, rows: jsonData, mapping }
}

export function transformRows(rows: RawRow[], mapping: Record<string, string>): { valid: ImportRow[]; errors: { row: number; error: string }[] } {
  const valid: ImportRow[] = []
  const errors: { row: number; error: string }[] = []

  const reverseMap: Record<string, string> = {}
  for (const [header, field] of Object.entries(mapping)) {
    reverseMap[field] = header
  }

  for (let i = 0; i < rows.length; i++) {
    try {
      const raw = rows[i]
      const get = (field: string): string => {
        const header = reverseMap[field]
        if (!header) return ''
        const val = raw[header]
        return val !== undefined && val !== null ? String(val).trim() : ''
      }

      const orderNum = parseInt(get('order_number'))
      if (isNaN(orderNum)) {
        errors.push({ row: i + 1, error: 'Numero de orden invalido' })
        continue
      }

      const dateStr = get('created_at')
      const parsedDate = parseSpanishDate(dateStr)
      if (!parsedDate) {
        errors.push({ row: i + 1, error: `Fecha invalida: ${dateStr}` })
        continue
      }

      const requester = get('requester')
      if (!requester) {
        errors.push({ row: i + 1, error: 'Solicitante vacio' })
        continue
      }

      const description = get('description') || null
      const serviceType = get('service_type') || null
      const resTimeDisplay = get('resolution_time_display')

      valid.push({
        order_number: orderNum,
        status: normalizeStatus(get('status')) as ImportRow['status'],
        created_at: parsedDate,
        priority: normalizePriority(get('priority')) as ImportRow['priority'],
        technician: get('technician') || null,
        requester,
        description,
        service_type: serviceType,
        resolution_time_minutes: parseResolutionTime(resTimeDisplay),
        resolution_time_display: resTimeDisplay || '-',
        resolved_by: null,
        category: resolveTicketCategory({ description, service_type: serviceType }),
      })
    } catch (err) {
      errors.push({ row: i + 1, error: String(err) })
    }
  }

  return { valid, errors }
}

