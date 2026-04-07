'use client'

import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { Plus, Search, Hourglass, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useTickets } from '@/hooks/use-tickets'
import { formatDate, formatResolutionTime, shortenName } from '@/lib/utils'
import type { TicketFilters, TicketStatus } from '@/lib/types'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

const STATUS_TABS: { value: TicketStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'pendiente', label: 'Pendientes', color: '#F59E0B', icon: <Hourglass size={14} /> },
  { value: 'resuelto', label: 'Resueltos', color: '#10B981', icon: <CheckCircle2 size={14} /> },
  { value: 'cancelado', label: 'Cancelados', color: '#EF4444', icon: <XCircle size={14} /> },
  { value: 'escalado', label: 'Escalados', color: '#8B5CF6', icon: <AlertTriangle size={14} /> },
]

export default function TicketsPage() {
  const [filters] = useState<TicketFilters>({})
  const [activeTab, setActiveTab] = useState<TicketStatus>('pendiente')
  const [search, setSearch] = useState('')
  const { tickets, loading, refreshing } = useTickets(filters)

  const filtered = useMemo(() => {
    let result = tickets.filter(t => t.status === activeTab)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.order_number.toString().includes(q) ||
        t.requester?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    return result
  }, [tickets, activeTab, search])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    tickets.forEach(t => { c[t.status] = (c[t.status] || 0) + 1 })
    return c
  }, [tickets])

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      urgente: 'bg-[#EF4444]/10 text-[#EF4444]',
      alta: 'bg-[#F59E0B]/10 text-[#F59E0B]',
      normal: 'bg-surface text-text-tertiary',
    }
    return styles[priority] || styles.normal
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={`transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary">
            Detalle de <span className="text-atisa">tickets</span>
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => toast.info('Formulario de creación de tickets próximamente')}
          className="flex items-center gap-2 px-5 h-10 rounded-lg bg-atisa text-white text-[13px] font-semibold shadow-[0_2px_8px_rgba(210,38,44,0.25)] hover:bg-atisa-hover transition-colors"
        >
          <Plus size={16} />
          Nuevo ticket
        </motion.button>
      </motion.div>

      {/* Tabs with icons */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-1 mb-4">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value
          const count = counts[tab.value] || 0
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all
                ${isActive
                  ? 'bg-white text-text-primary'
                  : 'text-text-tertiary hover:text-text-secondary'
                }
              `}
              style={isActive ? { boxShadow: 'var(--shadow-md)' } : undefined}
            >
              <span style={{ color: isActive ? tab.color : undefined }}>{tab.icon}</span>
              {tab.label}
              <span
                className="font-mono text-xs px-1.5 py-0.5 rounded-md"
                style={isActive ? { backgroundColor: `${tab.color}15`, color: tab.color } : undefined}
              >
                {count}
              </span>
            </button>
          )
        })}
      </motion.div>

      {/* Search */}
      <motion.div variants={itemVariants} className="relative mb-4">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar por orden, solicitante o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-atisa/15"
        />
      </motion.div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-atisa border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <Search size={32} className="mx-auto text-text-tertiary mb-2" />
          <p className="text-base font-medium text-text-primary mb-0.5">Sin resultados</p>
          <p className="text-[13px] text-text-tertiary">Ajusta los filtros o busca otro término</p>
        </div>
      ) : (
        <motion.div variants={itemVariants} className="bg-white rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-sm)' }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-tertiary border-b border-gray-100">
                  <th className="py-3 px-4 font-semibold">Orden</th>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Prioridad</th>
                  <th className="py-3 px-4 font-semibold">Solicitó</th>
                  <th className="py-3 px-4 font-semibold">Descripción</th>
                  {activeTab === 'resuelto' && <th className="py-3 px-4 font-semibold">Tiempo</th>}
                  {activeTab === 'resuelto' && <th className="py-3 px-4 font-semibold">Resuelto por</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-gray-50 hover:bg-surface/40 transition-colors"
                  >
                    <td className="py-4 px-4 font-mono font-semibold text-atisa text-[13px]">
                      #{ticket.order_number}
                    </td>
                    <td className="py-4 px-4 font-mono text-[13px] text-text-secondary">
                      {formatDate(ticket.created_at, 'dd MMM')}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-[13px] font-medium text-text-primary whitespace-nowrap">
                      {shortenName(ticket.requester)}
                    </td>
                    <td className="py-4 px-4 text-[13px] text-text-secondary leading-relaxed max-w-[500px]">
                      {ticket.description}
                    </td>
                    {activeTab === 'resuelto' && (
                      <td className="py-4 px-4 font-mono text-[13px] font-semibold text-escalated whitespace-nowrap">
                        {ticket.resolution_time_display || '-'}
                      </td>
                    )}
                    {activeTab === 'resuelto' && (
                      <td className="py-4 px-4 text-[13px] text-text-secondary">
                        {ticket.resolved_by || '-'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
