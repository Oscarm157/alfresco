'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts'
import { Clock, Target, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSprintStats } from '@/hooks/use-sprint-stats'
import { KPICard } from '@/components/dashboard/kpi-card'
import { ChartCard } from '@/components/dashboard/chart-card'
import { SprintForm } from '@/components/sprints/sprint-form'
import { TaskList } from '@/components/sprints/task-list'
import { TASK_TYPE_OPTIONS } from '@/lib/sprint-types'
import type { SprintHour, Sprint, SprintTask } from '@/lib/sprint-types'
import { format, subMonths, addMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

const TYPE_COLORS: Record<string, string> = {
  implementacion: '#D2262C',
  soporte: '#0EA5E9',
  deuda_tecnica: '#F59E0B',
  mantenimiento: '#8B5CF6',
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#383838] text-white px-3 py-2 rounded-xl text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono">
          <span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: {p.value}h
        </p>
      ))}
    </div>
  )
}

export default function SprintsPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedSprint, setSelectedSprint] = useState<string>('all')
  const [hours, setHours] = useState<SprintHour[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [tasks, setTasks] = useState<Record<string, SprintTask[]>>({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetched = useRef(false)

  const monthKey = format(currentMonth, 'yyyy-MM')
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: es })
  const orderedSprints = [...sprints].sort((a, b) => {
    const left = a.start_date || a.name
    const right = b.start_date || b.name
    return left.localeCompare(right)
  })
  const sprintFilterOptions = [
    { value: 'all', label: 'Todos' },
    ...orderedSprints.map((sprint, index) => ({
      value: sprint.name,
      label: `Sprint ${index + 1}`,
      subtitle: sprint.name,
    })),
  ]
  const activeHours = selectedSprint === 'all'
    ? hours
    : hours.filter((hour) => hour.sprint === selectedSprint)
  const activeSprints = selectedSprint === 'all'
    ? orderedSprints
    : orderedSprints.filter((sprint) => sprint.name === selectedSprint)
  const visibleTasks = selectedSprint === 'all'
    ? tasks
    : Object.fromEntries(Object.entries(tasks).filter(([name]) => name === selectedSprint))

  const fetchData = useCallback(async () => {
    if (hasFetched.current) {
      setRefreshing(true)
    }
    setError(null)
    try {
      const [hoursRes, sprintsRes, tasksRes] = await Promise.all([
        fetch(`/api/sprints/hours?month=${monthKey}`),
        fetch(`/api/sprints?month=${monthKey}`),
        fetch(`/api/sprints/tasks?month=${monthKey}`),
      ])

      if (!hoursRes.ok || !sprintsRes.ok || !tasksRes.ok) {
        throw new Error('No se pudieron cargar los datos de sprints')
      }

      const [hoursData, sprintsData, tasksData] = await Promise.all([hoursRes.json(), sprintsRes.json(), tasksRes.json()])
      setHours(Array.isArray(hoursData) ? hoursData : [])
      setSprints(Array.isArray(sprintsData) ? sprintsData : [])

      const grouped: Record<string, SprintTask[]> = {}
      if (Array.isArray(tasksData)) {
        tasksData.forEach((t: SprintTask) => {
          if (!grouped[t.sprint_name]) grouped[t.sprint_name] = []
          grouped[t.sprint_name].push(t)
        })
      }
      setTasks(grouped)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron cargar los datos de sprints'
      setError(message)
      setHours([])
      setSprints([])
      setTasks({})
      toast.error(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
      hasFetched.current = true
    }
  }, [monthKey])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    if (selectedSprint !== 'all' && !orderedSprints.some((sprint) => sprint.name === selectedSprint)) {
      setSelectedSprint('all')
    }
  }, [orderedSprints, selectedSprint])

  const stats = useSprintStats(activeHours)

  const quotaPercent = stats.quotaHours > 0 ? Math.round((stats.hoursWithoutDebt / stats.quotaHours) * 100) : 0

  const typeData = TASK_TYPE_OPTIONS
    .map(t => ({ name: t.label, value: stats.byTaskType[t.value] || 0, color: t.color }))
    .filter(d => d.value > 0)

  const sprintBarData = Object.entries(stats.bySprint).map(([name, data]) => ({
    name,
    implementacion: data.byType['implementacion'] || 0,
    soporte: data.byType['soporte'] || 0,
    deuda_tecnica: data.byType['deuda_tecnica'] || 0,
    mantenimiento: data.byType['mantenimiento'] || 0,
  }))

  const totalDevSP = activeSprints.reduce((a, s) => a + s.dev_sp_delivered, 0)
  const totalDevSPCommitted = activeSprints.reduce((a, s) => a + s.dev_sp_committed, 0)
  const totalMaintSP = activeSprints.reduce((a, s) => a + s.maintenance_sp_delivered, 0)
  const totalMaintSPCommitted = activeSprints.reduce((a, s) => a + s.maintenance_sp_committed, 0)
  const sprintSlots = [0, 1].map((index) => orderedSprints[index] || null)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-atisa border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={`transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary">
            Sprints <span className="text-atisa">Appropia</span>
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            Seguimiento de horas y story points · Acuerdo: 160h/mes
          </p>
        </div>

        {/* Month navigator */}
        <div className="flex items-center gap-2 bg-surface-alt rounded-xl px-2 py-1.5">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <ChevronLeft size={18} className="text-text-secondary" />
          </button>
          <span className="font-heading font-semibold text-sm text-text-primary min-w-[140px] text-center capitalize">
            {monthLabel}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <ChevronRight size={18} className="text-text-secondary" />
          </button>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="mb-6 rounded-2xl border border-cancelled/20 bg-cancelled/5 px-4 py-3 text-sm text-text-secondary">
          {error}
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sprintSlots.map((sprint, index) => (
          <div key={index} className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
                  Slot {index + 1}
                </div>
                <div className="font-heading text-lg font-bold text-text-primary">
                  {sprint?.name || `Sprint ${index + 1}`}
                </div>
              </div>
              {!sprint && (
                <SprintForm
                  monthKey={monthKey}
                  onCreated={fetchData}
                  buttonLabel={`Crear Sprint ${index + 1}`}
                  defaultName={`Sprint ${index + 1}`}
                  disabled={orderedSprints.length >= 2}
                />
              )}
            </div>
            {sprint ? (
              <div className="space-y-2 text-sm text-text-secondary">
                <div>
                  {sprint.start_date && sprint.end_date
                    ? `${sprint.start_date} - ${sprint.end_date}`
                    : 'Fechas por definir'}
                </div>
                <div className="font-mono text-xs text-text-tertiary">
                  {sprint.dev_sp_committed} SP desarrollo · {sprint.maintenance_sp_committed} SP mantenimiento
                </div>
              </div>
            ) : (
              <div className="text-sm text-text-tertiary">
                Slot disponible para capturar el sprint de esta quincena.
              </div>
            )}
          </div>
        ))}
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          Vista
        </span>
        {sprintFilterOptions.map((option) => {
          const isActive = selectedSprint === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedSprint(option.value)}
              className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                isActive ? 'bg-atisa text-white shadow-[0_2px_8px_rgba(210,38,44,0.25)]' : 'bg-white text-text-secondary'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </motion.div>

      {/* Quota Progress Bar */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.04)] mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-text-primary">Consumo de horas contractuales</div>
          <div className="font-mono text-sm text-text-secondary">
            <span className="font-bold text-text-primary">{stats.hoursWithoutDebt}h</span>
            {' '}/ {stats.quotaHours}h
            <span className="text-text-tertiary ml-2">({quotaPercent}%)</span>
          </div>
        </div>
        <div className="h-4 bg-surface rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(quotaPercent, 100)}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="h-full rounded-full"
            style={{
              backgroundColor: quotaPercent > 100 ? '#EF4444' : quotaPercent > 85 ? '#F59E0B' : '#10B981',
            }}
          />
        </div>
        {stats.debtHours > 0 && (
          <div className="flex items-center gap-2 mt-3 text-xs text-text-tertiary">
            <AlertTriangle size={13} className="text-pending" />
            <span>
              <span className="font-mono font-semibold text-pending">{stats.debtHours}h</span> de deuda tecnica
              <span className="ml-1">(no afecta la cuota de 160h)</span>
            </span>
          </div>
        )}
      </motion.div>

      {/* KPI Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 overflow-hidden">
        <KPICard
          value={`${stats.totalHours}h`}
          label="Horas totales"
          subtitle={`${hours.length} registros`}
          accentColor="#383838"
        />
        <KPICard
          value={`${stats.hoursWithoutDebt}h`}
          label="Horas contractuales"
          subtitle={`de ${stats.quotaHours}h`}
          accentColor={quotaPercent > 100 ? '#EF4444' : '#10B981'}
        />
        <KPICard
          value={`${totalDevSP}/${totalDevSPCommitted}`}
          label="SP Desarrollo"
          subtitle={activeSprints.length > 0 ? `${activeSprints.length} sprints` : 'Sin sprints'}
          accentColor="#D2262C"
        />
        <KPICard
          value={`${totalMaintSP}/${totalMaintSPCommitted}`}
          label="SP Mantenimiento"
          accentColor="#8B5CF6"
        />
      </motion.div>

      {/* Charts Row - only show when there's data */}
      {activeHours.length > 0 && (
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Hours by day */}
        <ChartCard title="Horas por dia" tag="DETALLE">
          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="hours" name="Horas" fill="#D2262C" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Type distribution donut */}
        <ChartCard title="Distribucion por tipo" tag="TIPO">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 min-h-[240px]">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {typeData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-3">
              {typeData.map(d => (
                <div key={d.name} className="flex items-center gap-2.5 text-sm">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: d.color }} />
                  <span className="font-mono text-base font-bold" style={{ color: d.color }}>{d.value}h</span>
                  <span className="text-text-secondary">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </motion.div>
      )}

      {/* Sprint breakdown - only show when there's data */}
      {activeHours.length > 0 && (
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Horas por sprint" tag="SPRINT">
          <div className="w-full h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={sprintBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="implementacion" name="Implementacion" stackId="a" fill="#D2262C" />
                <Bar dataKey="soporte" name="Soporte" stackId="a" fill="#0EA5E9" />
                <Bar dataKey="mantenimiento" name="Mantenimiento" stackId="a" fill="#8B5CF6" />
                <Bar dataKey="deuda_tecnica" name="Deuda Tecnica" stackId="a" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Sprint SP cards */}
        <ChartCard title="Story Points por sprint">
          {activeSprints.length === 0 ? (
            <div className="text-center py-12">
              <Target size={36} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary mb-1">Sin sprints registrados</p>
              <p className="text-xs text-text-tertiary">Importa datos o agrega sprints manualmente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSprints.map(s => (
                <div key={s.id} className="bg-surface rounded-xl p-4">
                  <div className="font-heading font-semibold text-sm text-text-primary mb-3">{s.name}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-1">Desarrollo</div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-xl font-bold text-atisa">{s.dev_sp_delivered}</span>
                        <span className="text-xs text-text-tertiary">/ {s.dev_sp_committed} SP</span>
                      </div>
                      <div className="h-1.5 bg-white rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-atisa"
                          style={{ width: `${Math.min((s.dev_sp_delivered / s.dev_sp_committed) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-1">Mantenimiento</div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-mono text-xl font-bold text-escalated">{s.maintenance_sp_delivered}</span>
                        <span className="text-xs text-text-tertiary">/ {s.maintenance_sp_committed} SP</span>
                      </div>
                      <div className="h-1.5 bg-white rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-escalated"
                          style={{ width: `${Math.min((s.maintenance_sp_delivered / s.maintenance_sp_committed) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </motion.div>
      )}

      {/* Detailed hours table */}
      <motion.div variants={itemVariants}>
        <ChartCard title="Detalle de horas" tag={`${activeHours.length} REGISTROS`}>
          {activeHours.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={36} className="mx-auto text-text-tertiary mb-3" />
              <p className="text-sm text-text-secondary">Sin registros para este mes</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-text-tertiary sticky top-0 bg-white z-10">
                    <th className="py-2.5 px-3 font-semibold">Fecha</th>
                    <th className="py-2.5 px-3 font-semibold">Sprint</th>
                    <th className="py-2.5 px-3 font-semibold">Horas</th>
                    <th className="py-2.5 px-3 font-semibold">Tipo</th>
                    <th className="py-2.5 px-3 font-semibold">Quien</th>
                    <th className="py-2.5 px-3 font-semibold">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {activeHours.map((h) => {
                    const typeColor = TYPE_COLORS[h.task_type] || '#999'
                    return (
                      <tr key={h.id} className="hover:bg-surface/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-sm text-text-secondary">{h.date}</td>
                        <td className="py-2.5 px-3 font-mono text-sm font-semibold">{h.sprint}</td>
                        <td className="py-2.5 px-3 font-mono text-sm font-bold" style={{ color: typeColor }}>{h.hours}h</td>
                        <td className="py-2.5 px-3">
                          <span
                            className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                            style={{ backgroundColor: `${typeColor}15`, color: typeColor }}
                          >
                            {TASK_TYPE_OPTIONS.find(t => t.value === h.task_type)?.label || h.task_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-sm text-text-secondary">{h.assignee}</td>
                        <td className="py-2.5 px-3 text-sm text-text-tertiary max-w-[350px] truncate">{h.detail}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>
      </motion.div>

      {/* Sprint Management & Tasks */}
      <motion.div variants={itemVariants} className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-text-primary">
            Tablero de <span className="text-atisa">Sprints</span>
          </h2>
          <SprintForm monthKey={monthKey} onCreated={fetchData} disabled={orderedSprints.length >= 2} />
        </div>

        {activeSprints.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] text-center py-16">
            <Target size={40} className="mx-auto text-text-tertiary mb-3" />
            <p className="text-lg font-medium text-text-primary mb-1">Sin sprints para este mes</p>
            <p className="text-sm text-text-tertiary">Crea un sprint para empezar a agregar tareas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeSprints.map(s => (
              <TaskList
                key={s.id}
                sprint={s}
                tasks={visibleTasks[s.name] || []}
                onRefresh={fetchData}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}


