'use client'

import { useMemo } from 'react'
import { format, startOfWeek, getWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Ticket, TicketStats } from '@/lib/types'

export function useStats(tickets: Ticket[]): TicketStats {
  return useMemo(() => {
    const total = tickets.length
    const resueltos = tickets.filter(t => t.status === 'resuelto').length
    const pendientes = tickets.filter(t => t.status === 'pendiente').length
    const cancelados = tickets.filter(t => t.status === 'cancelado').length
    const escalados = tickets.filter(t => t.status === 'escalado').length

    const resolutionRate = total > 0 ? (resueltos / total) * 100 : 0

    // Resolution times
    const times = tickets
      .filter(t => t.resolution_time_minutes !== null && t.resolution_time_minutes > 0)
      .map(t => t.resolution_time_minutes!)
      .sort((a, b) => a - b)

    const avgResolutionMinutes = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0
    const medianResolutionMinutes = times.length > 0
      ? times[Math.floor(times.length / 2)]
      : 0
    const minResolutionMinutes = times.length > 0 ? times[0] : 0
    const maxResolutionMinutes = times.length > 0 ? times[times.length - 1] : 0

    // By requester
    const byRequester: Record<string, number> = {}
    tickets.forEach(t => {
      const name = t.requester || 'Sin asignar'
      byRequester[name] = (byRequester[name] || 0) + 1
    })

    // By priority
    const byPriority: Record<string, number> = {}
    tickets.forEach(t => {
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1
    })

    // By category
    const byCategory: Record<string, number> = {}
    tickets.forEach(t => {
      const cat = t.category || 'Sin categoría'
      byCategory[cat] = (byCategory[cat] || 0) + 1
    })

    // By resolved_by
    const byResolvedBy: Record<string, number> = {}
    tickets.forEach(t => {
      const rb = t.resolved_by || 'Sin asignar'
      byResolvedBy[rb] = (byResolvedBy[rb] || 0) + 1
    })

    // By week
    const weekMap: Record<string, { total: number; resueltos: number; pendientes: number; cancelados: number }> = {}
    tickets.forEach(t => {
      const date = new Date(t.created_at)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 })
      const key = format(weekStart, 'dd MMM', { locale: es })
      if (!weekMap[key]) weekMap[key] = { total: 0, resueltos: 0, pendientes: 0, cancelados: 0 }
      weekMap[key].total++
      if (t.status === 'resuelto') weekMap[key].resueltos++
      else if (t.status === 'pendiente') weekMap[key].pendientes++
      else if (t.status === 'cancelado') weekMap[key].cancelados++
    })
    const byWeek = Object.entries(weekMap).map(([week, data]) => ({ week, ...data }))

    // By day
    const dayMap: Record<string, number> = {}
    tickets.forEach(t => {
      const key = format(new Date(t.created_at), 'dd', { locale: es })
      dayMap[key] = (dayMap[key] || 0) + 1
    })
    const byDay = Object.entries(dayMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => parseInt(a.date) - parseInt(b.date))

    return {
      total, resueltos, pendientes, cancelados, escalados,
      resolutionRate, avgResolutionMinutes, medianResolutionMinutes,
      minResolutionMinutes, maxResolutionMinutes,
      byRequester, byPriority, byCategory, byResolvedBy,
      byWeek, byDay,
    }
  }, [tickets])
}
