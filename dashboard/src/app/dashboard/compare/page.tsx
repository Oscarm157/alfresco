'use client'

import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { useTickets } from '@/hooks/use-tickets'
import { useStats } from '@/hooks/use-stats'
import { formatResolutionTime } from '@/lib/utils'
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns'
import { es } from 'date-fns/locale'

function getMonthRange(date: Date) {
  return {
    dateFrom: format(startOfMonth(date), 'yyyy-MM-dd'),
    dateTo: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

function DeltaIndicator({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  if (previous === 0) return <Minus size={14} className="text-text-tertiary" />
  const diff = ((current - previous) / previous) * 100
  const isPositive = invert ? diff < 0 : diff > 0
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`flex items-center gap-0.5 text-xs font-mono font-semibold ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
      <Icon size={14} />
      {Math.abs(diff).toFixed(1)}%
    </span>
  )
}

export default function ComparePage() {
  const now = new Date()
  const [monthA] = useState(getMonthRange(subMonths(now, 1)))
  const [monthB] = useState(getMonthRange(now))

  const { tickets: ticketsA } = useTickets(monthA)
  const { tickets: ticketsB } = useTickets(monthB)
  const statsA = useStats(ticketsA)
  const statsB = useStats(ticketsB)

  const labelA = format(subMonths(now, 1), 'MMMM yyyy', { locale: es })
  const labelB = format(now, 'MMMM yyyy', { locale: es })

  const metrics = [
    { label: 'Total tickets', a: statsA.total, b: statsB.total },
    { label: 'Resueltos', a: statsA.resueltos, b: statsB.resueltos },
    { label: 'Pendientes', a: statsA.pendientes, b: statsB.pendientes, invert: true },
    { label: 'Cancelados', a: statsA.cancelados, b: statsB.cancelados, invert: true },
    { label: 'Tasa resolución', a: Math.round(statsA.resolutionRate), b: Math.round(statsB.resolutionRate), suffix: '%' },
    { label: 'Tiempo prom.', a: statsA.avgResolutionMinutes, b: statsB.avgResolutionMinutes, invert: true, formatFn: formatResolutionTime },
  ]

  return (
    <div>
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary mb-1">
        Comparar <span className="text-atisa">Meses</span>
      </h1>
      <p className="text-sm text-text-tertiary mb-8">
        Vista comparativa entre periodos
      </p>

      {/* Header labels */}
      <div className="grid grid-cols-[200px_1fr_1fr] gap-4 mb-4">
        <div />
        <div className="text-center bg-surface-alt rounded-xl py-3 font-heading font-semibold text-sm text-text-primary capitalize">{labelA}</div>
        <div className="text-center bg-atisa/5 rounded-xl py-3 font-heading font-semibold text-sm text-atisa capitalize">{labelB}</div>
      </div>

      {/* Metrics grid */}
      <div className="space-y-2">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-[200px_1fr_1fr] gap-4 items-center"
          >
            <div className="text-sm font-medium text-text-secondary">{m.label}</div>
            <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center">
              <span className="font-mono text-2xl font-bold text-text-primary">
                {m.formatFn ? m.formatFn(m.a) : m.a}{m.suffix || ''}
              </span>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] flex items-center justify-center gap-3">
              <span className="font-mono text-2xl font-bold text-text-primary">
                {m.formatFn ? m.formatFn(m.b) : m.b}{m.suffix || ''}
              </span>
              <DeltaIndicator current={m.b} previous={m.a} invert={m.invert} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
