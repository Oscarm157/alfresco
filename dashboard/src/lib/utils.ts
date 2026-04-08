import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatResolutionTime(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return '-'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function parseResolutionTime(display: string): number | null {
  if (!display || display === '-') return null
  let total = 0
  const hourMatch = display.match(/(\d+)\s*h/)
  const minMatch = display.match(/(\d+)\s*m/)
  if (hourMatch) total += parseInt(hourMatch[1]) * 60
  if (minMatch) total += parseInt(minMatch[1])
  return total || null
}

const MONTH_MAP: Record<string, string> = {
  ene: '01', feb: '02', mar: '03', abr: '04',
  may: '05', jun: '06', jul: '07', ago: '08',
  sep: '09', oct: '10', nov: '11', dic: '12',
}

export function parseSpanishDate(dateStr: string): string | null {
  if (!dateStr) return null
  // Format: "02 mar, 2026, 16:32"
  const match = dateStr.match(/(\d{1,2})\s+(\w{3}),?\s*(\d{4}),?\s*(\d{1,2}):(\d{2})/)
  if (!match) return null
  const [, day, monthStr, year, hour, minute] = match
  const month = MONTH_MAP[monthStr.toLowerCase()]
  if (!month) return null
  return `${year}-${month}-${day.padStart(2, '0')}T${hour.padStart(2, '0')}:${minute}:00`
}

export function normalizeStatus(status: string): string {
  const s = status.toLowerCase().trim()
  if (s === 'resuelto' || s === 'resuelta') return 'resuelto'
  if (s === 'pendiente') return 'pendiente'
  if (s === 'cancelado' || s === 'cancelada') return 'cancelado'
  if (s === 'escalado' || s === 'escalada') return 'escalado'
  return 'pendiente'
}

export function normalizePriority(priority: string): string {
  const p = priority.toLowerCase().trim()
  if (p === 'urgente') return 'urgente'
  if (p === 'alta' || p === 'alto') return 'alta'
  return 'normal'
}

export function getDateRange(preset: string): { from: string; to: string } {
  const now = new Date()
  switch (preset) {
    case 'this_week':
      return {
        from: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      }
    case 'this_month':
      return {
        from: format(startOfMonth(now), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    case 'last_month': {
      const last = subMonths(now, 1)
      return {
        from: format(startOfMonth(last), 'yyyy-MM-dd'),
        to: format(endOfMonth(last), 'yyyy-MM-dd'),
      }
    }
    case 'last_3_months': {
      const threeAgo = subMonths(now, 3)
      return {
        from: format(startOfMonth(threeAgo), 'yyyy-MM-dd'),
        to: format(endOfMonth(now), 'yyyy-MM-dd'),
      }
    }
    default:
      return { from: '', to: '' }
  }
}

export function getMonthRange(monthValue: string): { from: string; to: string } {
  const [year, month] = monthValue.split('-').map(Number)
  if (!year || !month) return { from: '', to: '' }

  const date = new Date(year, month - 1, 1)
  return {
    from: format(startOfMonth(date), 'yyyy-MM-dd'),
    to: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

export function shortenName(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  if (parts.length <= 2) return name
  return `${parts[0]} ${parts[1][0]}.`
}

export function formatDate(dateStr: string, fmt: string = 'dd MMM yyyy'): string {
  try {
    return format(new Date(dateStr), fmt, { locale: es })
  } catch {
    return dateStr
  }
}

