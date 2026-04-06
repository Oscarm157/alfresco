'use client'

import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { Plus, Search } from 'lucide-react'
import { useTickets } from '@/hooks/use-tickets'
import { FilterBar } from '@/components/layout/filter-bar'
import { formatDate, formatResolutionTime, shortenName } from '@/lib/utils'
import type { TicketFilters, TicketStatus } from '@/lib/types'
import { STATUS_OPTIONS } from '@/lib/constants'

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
}

const STATUS_TABS: { value: TicketStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'Todos', color: '#383838' },
  { value: 'pendiente', label: 'Pendientes', color: '#F59E0B' },
  { value: 'resuelto', label: 'Resueltos', color: '#10B981' },
  { value: 'cancelado', label: 'Cancelados', color: '#EF4444' },
  { value: 'escalado', label: 'Escalados', color: '#8B5CF6' },
]

export default function TicketsPage() {
  const [filters, setFilters] = useState<TicketFilters>({})
  const [activeTab, setActiveTab] = useState<TicketStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const { tickets, loading } = useTickets(filters)

  const filtered = useMemo(() => {
    let result = tickets
    if (activeTab !== 'all') result = result.filter(t => t.status === activeTab)
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
    const c: Record<string, number> = { all: tickets.length }
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary">
            <span className="text-atisa">Tickets</span> de Soporte
          </h1>
          <p className="text-sm text-text-tertiary mt-1">
            {tickets.length} tickets en total
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-5 h-12 rounded-xl bg-atisa text-white text-sm font-semibold shadow-[0_4px_14px_rgba(210,38,44,0.3)] hover:bg-atisa-hover transition-colors"
        >
          <Plus size={18} />
          Nuevo ticket
        </motion.button>
      </motion.div>

      <FilterBar filters={filters} onFiltersChange={setFilters} />

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-alt rounded-xl p-1 mb-5 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`
              relative px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.value
                ? 'bg-white text-text-primary shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                : 'text-text-tertiary hover:text-text-secondary'
              }
            `}
          >
            {tab.label}
            <span className={`ml-1.5 font-mono text-xs ${activeTab === tab.value ? 'text-atisa' : ''}`}>
              {counts[tab.value] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          placeholder="Buscar por orden, solicitante o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-atisa/20"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-atisa border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
          <Search size={40} className="mx-auto text-text-tertiary mb-3" />
          <p className="text-lg font-medium text-text-primary mb-1">Sin resultados</p>
          <p className="text-sm text-text-tertiary">Ajusta los filtros o busca otro término</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-text-tertiary bg-surface/50">
                  <th className="py-3 px-4 font-semibold">Orden</th>
                  <th className="py-3 px-4 font-semibold">Fecha</th>
                  <th className="py-3 px-4 font-semibold">Prioridad</th>
                  <th className="py-3 px-4 font-semibold">Solicitó</th>
                  <th className="py-3 px-4 font-semibold">Descripción</th>
                  <th className="py-3 px-4 font-semibold">Tiempo</th>
                  <th className="py-3 px-4 font-semibold">Resuelto por</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ticket, i) => (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-surface/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-atisa text-sm">
                      #{ticket.order_number}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sm text-text-secondary">
                      {formatDate(ticket.created_at, 'dd MMM')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold uppercase ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-sm text-text-primary">
                      {shortenName(ticket.requester)}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-text-tertiary max-w-[350px] truncate">
                      {ticket.description?.slice(0, 100)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-sm font-semibold text-escalated">
                      {ticket.resolution_time_display || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-sm text-text-secondary">
                      {ticket.resolved_by || '-'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )
}
