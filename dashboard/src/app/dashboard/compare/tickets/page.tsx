'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { ArrowUpRight, ArrowDownRight, GitCompare, Minus, Ticket, TimerReset } from 'lucide-react'
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

export default function CompareTicketsPage() {
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
    { label: 'Tasa resolucion', a: Math.round(statsA.resolutionRate), b: Math.round(statsB.resolutionRate), suffix: '%' },
    { label: 'Tiempo prom.', a: statsA.avgResolutionMinutes, b: statsB.avgResolutionMinutes, invert: true, formatFn: formatResolutionTime },
  ]

  const monthCards = [
    {
      label: labelA,
      total: statsA.total,
      resolution: `${Math.round(statsA.resolutionRate)}%`,
      avgTime: formatResolutionTime(statsA.avgResolutionMinutes),
      accent: 'bg-surface-alt text-text-primary',
    },
    {
      label: labelB,
      total: statsB.total,
      resolution: `${Math.round(statsB.resolutionRate)}%`,
      avgTime: formatResolutionTime(statsB.avgResolutionMinutes),
      accent: 'bg-atisa/5 text-atisa',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">
              <GitCompare size={14} />
              Comparativo operativo
            </div>
            <h1 className="font-heading text-[30px] font-bold tracking-tight text-text-primary">
              Comparar <span className="text-atisa">Tickets</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-tertiary">
              Lectura rápida de volumen, resolución y tiempos entre el mes anterior y el actual.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {monthCards.map((card) => (
              <div key={card.label} className={`min-w-[220px] rounded-2xl p-4 ${card.accent}`}>
                <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em]">{card.label}</div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-text-tertiary">Tickets</div>
                    <div className="font-mono text-lg font-bold text-text-primary">{card.total}</div>
                  </div>
                  <div>
                    <div className="text-text-tertiary">Resol.</div>
                    <div className="font-mono text-lg font-bold text-text-primary">{card.resolution}</div>
                  </div>
                  <div>
                    <div className="text-text-tertiary">Prom.</div>
                    <div className="font-mono text-lg font-bold text-text-primary">{card.avgTime}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr_1fr]">
        <div className="hidden md:block" />
        <div className="rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <div className="mb-2 flex items-center gap-2 text-text-tertiary">
            <Ticket size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Base</span>
          </div>
          <div className="font-heading text-lg font-bold capitalize text-text-primary">{labelA}</div>
        </div>
        <div className="rounded-2xl border border-atisa/10 bg-white px-5 py-4 shadow-[0_2px_12px_rgba(210,38,44,0.08)]">
          <div className="mb-2 flex items-center gap-2 text-atisa">
            <TimerReset size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Actual</span>
          </div>
          <div className="font-heading text-lg font-bold capitalize text-text-primary">{labelB}</div>
        </div>
      </div>

      <div className="space-y-2">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[180px_1fr_1fr]"
          >
            <div className="flex items-center rounded-2xl bg-surface px-4 py-4 text-sm font-semibold text-text-secondary">
              {m.label}
            </div>
            <div className="rounded-2xl border border-black/5 bg-white p-5 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">{labelA}</div>
              <span className="font-mono text-[28px] font-bold text-text-primary">
                {m.formatFn ? m.formatFn(m.a) : m.a}{m.suffix || ''}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-atisa/10 bg-white p-5 shadow-[0_2px_12px_rgba(210,38,44,0.08)]">
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-tertiary">{labelB}</div>
                <span className="font-mono text-[28px] font-bold text-text-primary">
                  {m.formatFn ? m.formatFn(m.b) : m.b}{m.suffix || ''}
                </span>
              </div>
              <div className="rounded-full bg-surface px-3 py-1.5">
                <DeltaIndicator current={m.b} previous={m.a} invert={m.invert} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
