export type TaskType = 'implementacion' | 'soporte' | 'deuda_tecnica' | 'mantenimiento'

export interface SprintHour {
  id: string
  date: string
  sprint: string
  hours: number
  detail: string | null
  task_type: TaskType
  assignee: string
  month_key: string
  inserted_at: string
}

export interface Sprint {
  id: string
  name: string
  month_key: string
  start_date: string | null
  end_date: string | null
  dev_sp_committed: number
  dev_sp_delivered: number
  maintenance_sp_committed: number
  maintenance_sp_delivered: number
  notes: string | null
  inserted_at: string
}

export interface SprintStats {
  totalHours: number
  quotaHours: number
  hoursWithoutDebt: number
  byTaskType: Record<string, number>
  bySprint: Record<string, { total: number; byType: Record<string, number> }>
  byAssignee: Record<string, number>
  byDay: { date: string; hours: number }[]
  debtHours: number
}

export const TASK_TYPE_OPTIONS = [
  { value: 'implementacion', label: 'Implementación', color: '#D2262C' },
  { value: 'soporte', label: 'Soporte', color: '#0EA5E9' },
  { value: 'deuda_tecnica', label: 'Deuda Técnica', color: '#F59E0B' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: '#8B5CF6' },
] as const

export function normalizeTaskType(raw: string): TaskType {
  const map: Record<string, TaskType> = {
    'implementación': 'implementacion',
    'implementacion': 'implementacion',
    'soporte': 'soporte',
    'deuda técnica': 'deuda_tecnica',
    'deuda tecnica': 'deuda_tecnica',
    'mantenimiento': 'mantenimiento',
  }
  return map[raw.toLowerCase().trim()] || 'implementacion'
}
