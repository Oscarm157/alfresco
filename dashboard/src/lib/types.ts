export type TicketStatus = 'pendiente' | 'resuelto' | 'cancelado' | 'escalado'
export type TicketPriority = 'urgente' | 'alta' | 'normal'
export type ResolvedBy = 'TI' | 'Appropia'

export interface Ticket {
  id: string
  order_number: number
  status: TicketStatus
  created_at: string
  priority: TicketPriority
  technician: string | null
  requester: string
  description: string | null
  category: string | null
  service_type: string | null
  resolution_time_minutes: number | null
  resolution_time_display: string | null
  resolved_by: ResolvedBy | null
  notes: string | null
  updated_at: string
  inserted_at: string
}

export interface TicketFilters {
  dateFrom?: string
  dateTo?: string
  status?: TicketStatus
  priority?: TicketPriority
  requester?: string
  category?: string
  resolvedBy?: ResolvedBy
}

export interface TicketStats {
  total: number
  resueltos: number
  pendientes: number
  cancelados: number
  escalados: number
  resolutionRate: number
  avgResolutionMinutes: number
  medianResolutionMinutes: number
  minResolutionMinutes: number
  maxResolutionMinutes: number
  byRequester: Record<string, number>
  byPriority: Record<string, number>
  byCategory: Record<string, number>
  byResolvedBy: Record<string, number>
  byWeek: { week: string; total: number; resueltos: number; pendientes: number; cancelados: number }[]
  byDay: { date: string; count: number }[]
}

export interface ImportRow {
  order_number: number
  status: TicketStatus
  created_at: string
  priority: TicketPriority
  technician: string | null
  requester: string
  description: string | null
  service_type: string | null
  resolution_time_minutes: number | null
  resolution_time_display: string
  resolved_by: ResolvedBy | null
  category: string | null
}
