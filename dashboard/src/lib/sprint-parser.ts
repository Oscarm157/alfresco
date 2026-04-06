import * as XLSX from 'xlsx'
import { normalizeTaskType } from './sprint-types'
import type { TaskType } from './sprint-types'
import { format } from 'date-fns'

export interface SprintImportRow {
  date: string
  sprint: string
  hours: number
  detail: string
  task_type: TaskType
  assignee: string
  month_key: string
}

interface RawRow {
  [key: string]: string | number | Date | undefined
}

export function parseSprintExcel(buffer: ArrayBuffer): { rows: SprintImportRow[]; errors: { row: number; error: string }[] } {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const jsonData = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' })

  const rows: SprintImportRow[] = []
  const errors: { row: number; error: string }[] = []

  for (let i = 0; i < jsonData.length; i++) {
    const raw = jsonData[i]

    const dateVal = raw['Fecha']
    if (!dateVal) continue

    try {
      let dateStr: string
      if (dateVal instanceof Date) {
        dateStr = format(dateVal, 'yyyy-MM-dd')
      } else {
        dateStr = String(dateVal).slice(0, 10)
      }

      const sprint = String(raw['Sprint'] || '').trim()
      if (!sprint) {
        errors.push({ row: i + 2, error: 'Sprint vacío' })
        continue
      }

      const timeVal = raw['Tiempo']
      let hours = 0
      if (timeVal instanceof Date) {
        // XLSX converts time cells to Date objects anchored at 1899-12-30
        hours = timeVal.getHours() + timeVal.getMinutes() / 60
        // Fallback: if hours is 0 but we have a date, extract from UTC
        if (hours === 0 && timeVal.getUTCHours() > 0) {
          hours = timeVal.getUTCHours() + timeVal.getUTCMinutes() / 60
        }
      } else if (typeof timeVal === 'number') {
        // Serial number: 0.25 = 6 hours, 0.5 = 12 hours
        hours = Math.round(timeVal * 24 * 10) / 10
      } else if (typeof timeVal === 'string') {
        const match = timeVal.match(/(\d+):(\d+)/)
        if (match) hours = parseInt(match[1]) + parseInt(match[2]) / 60
      }

      if (hours <= 0) {
        errors.push({ row: i + 2, error: 'Tiempo inválido' })
        continue
      }

      const detail = String(raw['Detalle'] || '').trim()
      const taskType = normalizeTaskType(String(raw['Tipo de tarea'] || 'implementacion'))
      const assignee = String(raw['Quien?'] || raw['Quien'] || '').trim() || 'Sin asignar'
      const monthKey = dateStr.slice(0, 7)

      rows.push({ date: dateStr, sprint, hours, detail, task_type: taskType, assignee, month_key: monthKey })
    } catch (err) {
      errors.push({ row: i + 2, error: String(err) })
    }
  }

  return { rows, errors }
}
