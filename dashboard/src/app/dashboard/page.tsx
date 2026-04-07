'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  CartesianGrid
} from 'recharts'
import { useTickets } from '@/hooks/use-tickets'
import { useStats } from '@/hooks/use-stats'
import { FilterBar } from '@/components/layout/filter-bar'
import { KPICard } from '@/components/dashboard/kpi-card'
import { ChartCard } from '@/components/dashboard/chart-card'
import { formatResolutionTime, shortenName } from '@/lib/utils'
import type { TicketFilters } from '@/lib/types'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

const DONUT_COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#383838] text-white px-3 py-2 rounded-xl text-xs shadow-lg">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono">
          <span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<TicketFilters>({})
  const { tickets, loading, refreshing } = useTickets(filters)
  const stats = useStats(tickets)

  const donutData = [
    { name: 'Resueltos', value: stats.resueltos },
    { name: 'Pendientes', value: stats.pendientes },
    { name: 'Cancelados', value: stats.cancelados },
    { name: 'Escalados', value: stats.escalados },
  ].filter(d => d.value > 0)

  const requesterData = Object.entries(stats.byRequester)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, count]) => ({ name: shortenName(name), count }))

  const categoryData = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))

  const CATEGORY_COLORS = ['#D2262C', '#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9', '#94A3B8']

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
      <motion.div variants={itemVariants} className="mb-5 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-[0.18em] mb-1">Panel de control · Grupo ATISA</p>
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-6 rounded-full bg-atisa" />
            <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary leading-none">
              Tickets de Soporte <span className="text-atisa">Alfresco</span>
            </h1>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface">
          <div className="w-1.5 h-1.5 rounded-full bg-resolved animate-pulse" />
          <span className="text-xs font-mono font-bold text-text-primary">{stats.total}</span>
          <span className="text-[10px] text-text-tertiary">tickets</span>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div variants={itemVariants}>
        <FilterBar filters={filters} onFiltersChange={setFilters} />
      </motion.div>

      {/* KPI Row — unified strip */}
      <motion.div variants={itemVariants} className="bg-white rounded-xl overflow-hidden mb-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 divide-x divide-gray-100">
          <KPICard
            value={stats.total}
            label="Tickets totales"
            accentColor="#0EA5E9"
            sparkline={stats.sparklines.total}
            delta={stats.deltas.total}
          />
          <KPICard
            value={stats.resueltos}
            label="Resueltos"
            subtitle={`${stats.resolutionRate.toFixed(1)}%`}
            accentColor="#10B981"
            sparkline={stats.sparklines.resueltos}
            delta={stats.deltas.resueltos}
          />
          <KPICard
            value={stats.pendientes}
            label="Pendientes"
            subtitle={stats.total > 0 ? `${((stats.pendientes / stats.total) * 100).toFixed(1)}%` : '0%'}
            accentColor="#F59E0B"
            sparkline={stats.sparklines.pendientes}
            delta={stats.deltas.pendientes}
            invertDelta
          />
          <KPICard
            value={stats.cancelados}
            label="Cancelados"
            subtitle={stats.total > 0 ? `${((stats.cancelados / stats.total) * 100).toFixed(1)}%` : '0%'}
            accentColor="#EF4444"
            sparkline={stats.sparklines.cancelados}
            delta={stats.deltas.cancelados}
            invertDelta
          />
          <KPICard
            value={formatResolutionTime(stats.avgResolutionMinutes)}
            label="Tiempo prom. resolución"
            subtitle={`mediana ${formatResolutionTime(stats.medianResolutionMinutes)}`}
            accentColor="#8B5CF6"
            sparkline={stats.sparklines.avgTime}
            delta={stats.deltas.avgTime}
            invertDelta
          />
        </div>
      </motion.div>

      {/* Charts Row 1 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Timeline */}
        <ChartCard title="Tickets por día" tag="TIMELINE">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Tickets" fill="#D2262C" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Donut */}
        <ChartCard title="Tasa de resolución" tag="ESTADO">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 min-h-[240px]">
            <div className="relative">
              <ResponsiveContainer width={180} height={180} minWidth={180}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-[32px] font-bold text-resolved">{stats.resolutionRate.toFixed(0)}%</span>
                <span className="text-xs text-text-tertiary">Resolución</span>
              </div>
            </div>
            <div className="flex flex-col gap-3.5">
              {donutData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2.5 text-sm">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: DONUT_COLORS[i] }} />
                  <span className="font-mono text-lg font-bold" style={{ color: DONUT_COLORS[i] }}>{d.value}</span>
                  <span className="text-text-secondary">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </motion.div>

      {/* Charts Row 2 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Weekly */}
        <ChartCard title="Tickets por semana" tag="SEMANAL">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.byWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="resueltos" name="Resueltos" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pendientes" name="Pendientes" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cancelados" name="Cancelados" stackId="a" fill="#EF4444" radius={[6, 6, 0, 0]} />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Categories */}
        <ChartCard title="Categorización de tickets" tag="TIPO">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#656565' }} axisLine={false} tickLine={false} width={140} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Tickets" radius={[0, 6, 6, 0]}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* By Requester */}
        <ChartCard title="Tickets por solicitante">
          <div className="space-y-3">
            {requesterData.map((d, i) => {
              const max = requesterData[0]?.count || 1
              const colors = ['#D2262C', '#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9', '#94A3B8']
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <span className="text-xs text-text-tertiary font-medium min-w-[80px] text-right truncate">{d.name}</span>
                  <div className="flex-1 h-7 bg-surface rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / max) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 200, damping: 25, delay: i * 0.05 }}
                      className="h-full rounded-lg flex items-center pl-2.5"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    >
                      <span className="text-xs font-mono font-semibold text-white">{d.count}</span>
                    </motion.div>
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>

        {/* Priority Distribution */}
        <ChartCard title="Distribución por prioridad">
          {(() => {
            const priorities = [
              { label: 'Normal', value: stats.byPriority['normal'] || 0, color: '#94A3B8' },
              { label: 'Alta', value: stats.byPriority['alta'] || 0, color: '#F59E0B' },
              { label: 'Urgente', value: stats.byPriority['urgente'] || 0, color: '#EF4444' },
            ]
            const total = priorities.reduce((s, p) => s + p.value, 0) || 1
            return (
              <div>
                {/* Stacked bar */}
                <div className="flex h-3 rounded-full overflow-hidden mb-4">
                  {priorities.map((p) => (
                    <div
                      key={p.label}
                      className="transition-all duration-500"
                      style={{ width: `${(p.value / total) * 100}%`, backgroundColor: p.color }}
                    />
                  ))}
                </div>
                {/* Labels */}
                <div className="flex justify-between">
                  {priorities.map((p) => (
                    <div key={p.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                      <span className="font-mono text-lg font-bold" style={{ color: p.color }}>{p.value}</span>
                      <span className="text-[11px] text-text-tertiary font-medium">{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}
        </ChartCard>

        {/* Resolution Times */}
        <ChartCard title="Tiempos de resolución">
          {(() => {
            const range = stats.maxResolutionMinutes - stats.minResolutionMinutes || 1
            const avgPos = ((stats.avgResolutionMinutes - stats.minResolutionMinutes) / range) * 100
            const medPos = ((stats.medianResolutionMinutes - stats.minResolutionMinutes) / range) * 100
            return (
              <div>
                {/* Visual range bar */}
                <div className="relative h-2 bg-surface rounded-full mb-2 mt-1">
                  <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-[#10B981] via-[#8B5CF6] to-[#EF4444] opacity-30" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#8B5CF6] border-2 border-white" style={{ left: `${Math.min(avgPos, 95)}%` }} title="Promedio" />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#0EA5E9] border-2 border-white" style={{ left: `${Math.min(medPos, 95)}%` }} title="Mediana" />
                </div>
                <div className="flex justify-between text-[10px] text-text-tertiary mb-4">
                  <span>{formatResolutionTime(stats.minResolutionMinutes)}</span>
                  <span>{formatResolutionTime(stats.maxResolutionMinutes)}</span>
                </div>
                {/* Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Más rápido', value: stats.minResolutionMinutes, color: '#10B981' },
                    { label: 'Más lento', value: stats.maxResolutionMinutes, color: '#EF4444' },
                    { label: 'Promedio', value: stats.avgResolutionMinutes, color: '#8B5CF6' },
                    { label: 'Mediana', value: stats.medianResolutionMinutes, color: '#0EA5E9' },
                  ].map((t) => (
                    <div key={t.label}>
                      <div className="text-[11px] text-text-tertiary mb-0.5">{t.label}</div>
                      <div className="font-mono text-lg font-bold" style={{ color: t.color }}>
                        {formatResolutionTime(t.value)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 text-[12px]">
                  <span className="font-mono font-semibold text-text-primary">
                    {tickets.filter(t => t.resolution_time_minutes && t.resolution_time_minutes > 0).length}
                  </span>
                  <span className="text-text-tertiary ml-1">de {stats.resueltos} resueltos con tiempo</span>
                </div>
              </div>
            )
          })()}
        </ChartCard>
      </motion.div>
    </motion.div>
  )
}
