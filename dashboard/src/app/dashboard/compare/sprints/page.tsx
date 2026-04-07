'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { useSprintStats } from '@/hooks/use-sprint-stats'
import type { Sprint, SprintHour } from '@/lib/sprint-types'

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

export default function CompareSprintsPage() {
  const now = new Date()
  const previousMonth = subMonths(now, 1)
  const currentMonthKey = format(now, 'yyyy-MM')
  const previousMonthKey = format(previousMonth, 'yyyy-MM')
  const currentLabel = format(now, 'MMMM yyyy', { locale: es })
  const previousLabel = format(previousMonth, 'MMMM yyyy', { locale: es })

  const [currentHours, setCurrentHours] = useState<SprintHour[]>([])
  const [previousHours, setPreviousHours] = useState<SprintHour[]>([])
  const [currentSprints, setCurrentSprints] = useState<Sprint[]>([])
  const [previousSprints, setPreviousSprints] = useState<Sprint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const [currentHoursRes, previousHoursRes, currentSprintsRes, previousSprintsRes] = await Promise.all([
          fetch(`/api/sprints/hours?month=${currentMonthKey}`),
          fetch(`/api/sprints/hours?month=${previousMonthKey}`),
          fetch(`/api/sprints?month=${currentMonthKey}`),
          fetch(`/api/sprints?month=${previousMonthKey}`),
        ])

        if (!currentHoursRes.ok || !previousHoursRes.ok || !currentSprintsRes.ok || !previousSprintsRes.ok) {
          throw new Error('No se pudieron cargar los comparativos de sprints')
        }

        const [currentHoursData, previousHoursData, currentSprintsData, previousSprintsData] = await Promise.all([
          currentHoursRes.json(),
          previousHoursRes.json(),
          currentSprintsRes.json(),
          previousSprintsRes.json(),
        ])

        if (cancelled) return

        setCurrentHours(Array.isArray(currentHoursData) ? currentHoursData : [])
        setPreviousHours(Array.isArray(previousHoursData) ? previousHoursData : [])
        setCurrentSprints(Array.isArray(currentSprintsData) ? currentSprintsData : [])
        setPreviousSprints(Array.isArray(previousSprintsData) ? previousSprintsData : [])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'No se pudieron cargar los comparativos de sprints')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [currentMonthKey, previousMonthKey])

  const currentStats = useSprintStats(currentHours)
  const previousStats = useSprintStats(previousHours)

  const sprintMetrics = useMemo(() => {
    const previousDevDelivered = previousSprints.reduce((sum, sprint) => sum + sprint.dev_sp_delivered, 0)
    const currentDevDelivered = currentSprints.reduce((sum, sprint) => sum + sprint.dev_sp_delivered, 0)
    const previousMaintDelivered = previousSprints.reduce((sum, sprint) => sum + sprint.maintenance_sp_delivered, 0)
    const currentMaintDelivered = currentSprints.reduce((sum, sprint) => sum + sprint.maintenance_sp_delivered, 0)

    return [
      { label: 'Horas totales', a: previousStats.totalHours, b: currentStats.totalHours, suffix: 'h' },
      { label: 'Horas contractuales', a: previousStats.hoursWithoutDebt, b: currentStats.hoursWithoutDebt, suffix: 'h' },
      { label: 'Soporte', a: previousStats.byTaskType.soporte || 0, b: currentStats.byTaskType.soporte || 0, suffix: 'h' },
      { label: 'Implementacion', a: previousStats.byTaskType.implementacion || 0, b: currentStats.byTaskType.implementacion || 0, suffix: 'h' },
      { label: 'Deuda tecnica', a: previousStats.debtHours, b: currentStats.debtHours, invert: true, suffix: 'h' },
      { label: 'SP desarrollo', a: previousDevDelivered, b: currentDevDelivered },
      { label: 'SP mantenimiento', a: previousMaintDelivered, b: currentMaintDelivered },
      { label: 'Numero de sprints', a: previousSprints.length, b: currentSprints.length },
    ]
  }, [currentSprints, currentStats, previousSprints, previousStats])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-atisa border-t-transparent" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary mb-1">
        Comparar <span className="text-atisa">Sprints</span>
      </h1>
      <p className="text-sm text-text-tertiary mb-8">
        Vista comparativa entre periodos para horas, soporte y avance de sprints
      </p>

      {error && (
        <div className="mb-6 rounded-2xl border border-cancelled/20 bg-cancelled/5 px-4 py-3 text-sm text-text-secondary">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-[180px_1fr_1fr]">
        <div className="hidden md:block" />
        <div className="rounded-xl bg-surface-alt py-3 text-center font-heading text-sm font-semibold capitalize text-text-primary">{previousLabel}</div>
        <div className="rounded-xl bg-atisa/5 py-3 text-center font-heading text-sm font-semibold capitalize text-atisa">{currentLabel}</div>
      </div>

      <div className="space-y-2">
        {sprintMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="grid grid-cols-1 items-center gap-4 md:grid-cols-[180px_1fr_1fr]"
          >
            <div className="text-sm font-medium text-text-secondary">{metric.label}</div>
            <div className="rounded-xl bg-white p-4 text-center shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <span className="font-mono text-2xl font-bold text-text-primary">
                {metric.a}{metric.suffix || ''}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 rounded-xl bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <span className="font-mono text-2xl font-bold text-text-primary">
                {metric.b}{metric.suffix || ''}
              </span>
              <DeltaIndicator current={metric.b} previous={metric.a} invert={metric.invert} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
