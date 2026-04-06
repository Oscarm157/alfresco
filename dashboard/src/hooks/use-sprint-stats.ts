'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { SprintHour, SprintStats } from '@/lib/sprint-types'

const MONTHLY_QUOTA = 160

export function useSprintStats(hours: SprintHour[]): SprintStats {
  return useMemo(() => {
    const totalHours = hours.reduce((acc, h) => acc + Number(h.hours), 0)
    const debtHours = hours
      .filter(h => h.task_type === 'deuda_tecnica')
      .reduce((acc, h) => acc + Number(h.hours), 0)
    const hoursWithoutDebt = totalHours - debtHours

    const byTaskType: Record<string, number> = {}
    hours.forEach(h => {
      byTaskType[h.task_type] = (byTaskType[h.task_type] || 0) + Number(h.hours)
    })

    const bySprint: Record<string, { total: number; byType: Record<string, number> }> = {}
    hours.forEach(h => {
      if (!bySprint[h.sprint]) bySprint[h.sprint] = { total: 0, byType: {} }
      bySprint[h.sprint].total += Number(h.hours)
      bySprint[h.sprint].byType[h.task_type] = (bySprint[h.sprint].byType[h.task_type] || 0) + Number(h.hours)
    })

    const byAssignee: Record<string, number> = {}
    hours.forEach(h => {
      byAssignee[h.assignee] = (byAssignee[h.assignee] || 0) + Number(h.hours)
    })

    const dayMap: Record<string, number> = {}
    hours.forEach(h => {
      const key = format(new Date(h.date + 'T12:00:00'), 'dd MMM', { locale: es })
      dayMap[key] = (dayMap[key] || 0) + Number(h.hours)
    })
    const byDay = Object.entries(dayMap).map(([date, hours]) => ({ date, hours }))

    return {
      totalHours: Math.round(totalHours * 10) / 10,
      quotaHours: MONTHLY_QUOTA,
      hoursWithoutDebt: Math.round(hoursWithoutDebt * 10) / 10,
      byTaskType,
      bySprint,
      byAssignee,
      byDay,
      debtHours: Math.round(debtHours * 10) / 10,
    }
  }, [hours])
}
