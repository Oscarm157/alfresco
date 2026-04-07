'use client'

import { motion } from 'motion/react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts'
import { useTickets } from '@/hooks/use-tickets'
import { ChartCard } from '@/components/dashboard/chart-card'
import { format, startOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Ticket } from '@/lib/types'

function groupByMonth(tickets: Ticket[]) {
  const map: Record<string, { total: number; resueltos: number; totalTime: number; timeCount: number }> = {}
  tickets.forEach(t => {
    const key = format(startOfMonth(new Date(t.created_at)), 'MMM yyyy', { locale: es })
    if (!map[key]) map[key] = { total: 0, resueltos: 0, totalTime: 0, timeCount: 0 }
    map[key].total++
    if (t.status === 'resuelto') map[key].resueltos++
    if (t.resolution_time_minutes && t.resolution_time_minutes > 0) {
      map[key].totalTime += t.resolution_time_minutes
      map[key].timeCount++
    }
  })
  return Object.entries(map).map(([month, data]) => ({
    month,
    total: data.total,
    resueltos: data.resueltos,
    resolutionRate: data.total > 0 ? Math.round((data.resueltos / data.total) * 100) : 0,
    avgTime: data.timeCount > 0 ? Math.round(data.totalTime / data.timeCount / 60 * 10) / 10 : 0,
  }))
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#383838] text-white px-3 py-2 rounded-xl text-xs shadow-lg">
      <p className="font-medium mb-1 capitalize">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-mono">
          <span className="inline-block w-2 h-2 rounded-sm mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export default function TrendsPage() {
  const { tickets, loading } = useTickets({})
  const monthlyData = groupByMonth(tickets)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-3 border-atisa border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary mb-1">
        <span className="text-atisa">Tendencias</span>
      </h1>
      <p className="text-sm text-text-tertiary mb-8">
        Evolucion de metricas mes a mes
      </p>

      <div className="grid grid-cols-1 gap-4">
        <ChartCard title="Volumen de tickets" tag="MENSUAL">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D2262C" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D2262C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="total" name="Total" stroke="#D2262C" strokeWidth={2.5} fill="url(#colorTotal)" />
                <Area type="monotone" dataKey="resueltos" name="Resueltos" stroke="#10B981" strokeWidth={2} fill="none" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Tasa de resolucion" tag="% MENSUAL">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="resolutionRate" name="Resolucion %" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Tiempo promedio de resolucion" tag="HORAS">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#999' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="avgTime" name="Promedio (h)" stroke="#8B5CF6" strokeWidth={2.5} fill="url(#colorTime)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </motion.div>
  )
}


