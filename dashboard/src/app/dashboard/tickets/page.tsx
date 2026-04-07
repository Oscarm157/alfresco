'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Search, Hourglass, CheckCircle2, XCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import { useTickets } from '@/hooks/use-tickets'
import { formatDate, shortenName } from '@/lib/utils'
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

function formatDescription(text: string | null): React.ReactNode {
  if (!text) return <span className="text-text-tertiary">Sin descripción</span>

  // Split by common patterns that indicate structure
  const lines = text
    .replace(/- Regla:/g, '\n- Regla:')
    .replace(/- Estado:/g, '\n  Estado:')
    .replace(/Estado:/g, '\nEstado:')
    .replace(/Motivo:/g, '\nMotivo:')
    .replace(/Valor fuente:/g, '\nValor fuente:')
    .replace(/Valor objetivo:/g, '\nValor objetivo:')
    .replace(/Resumen de validaciones:/g, '\nResumen de validaciones:')
    .replace(/Detalles de validaciones:/g, '\n\nDetalles de validaciones:')
    .replace(/Métricas \(estructura completa\):/g, '\n\nMétricas:')
    .replace(/• /g, '\n  • ')
    .replace(/ - Total/g, '\n  - Total')
    .replace(/ - Pasaron/g, '\n  - Pasaron')
    .replace(/ - Fallaron/g, '\n  - Fallaron')
    .replace(/ - Alertas/g, '\n  - Alertas')
    .split('\n')
    .filter(l => l.trim())

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim()

        // Section headers
        if (trimmed.startsWith('Resumen de validaciones') || trimmed.startsWith('Detalles de validaciones') || trimmed.startsWith('Métricas')) {
          return <div key={i} className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mt-2 mb-1">{trimmed}</div>
        }

        // Rules
        if (trimmed.startsWith('- Regla:')) {
          return <div key={i} className="text-[12px] text-text-primary font-medium mt-2 pl-2 border-l-2 border-atisa/20">{trimmed.replace('- Regla: ', '')}</div>
        }

        // Key-value fields (Estado, Motivo, Valor)
        const kvMatch = trimmed.match(/^(Estado|Motivo|Valor fuente|Valor objetivo):\s*(.*)/)
        if (kvMatch) {
          const [, key, val] = kvMatch
          const isStatus = key === 'Estado'
          const statusColor = val === 'passed' ? '#10B981' : val === 'missing_info' ? '#F59E0B' : '#999'
          return (
            <div key={i} className="flex gap-2 text-[12px] pl-4">
              <span className="text-text-tertiary font-medium min-w-[90px]">{key}:</span>
              {isStatus ? (
                <span className="font-mono font-semibold" style={{ color: statusColor }}>{val}</span>
              ) : (
                <span className="text-text-secondary">{val}</span>
              )}
            </div>
          )
        }

        // Bullets
        if (trimmed.startsWith('•') || trimmed.startsWith('- ')) {
          return <div key={i} className="text-[12px] text-text-secondary pl-4">{trimmed}</div>
        }

        // Default
        return <div key={i} className="text-[12px] text-text-secondary leading-relaxed">{trimmed}</div>
      })}
    </div>
  )
}

function getPriorityBadge(priority: string) {
  const styles: Record<string, string> = {
    urgente: 'bg-[#EF4444]/10 text-[#EF4444]',
    alta: 'bg-[#F59E0B]/10 text-[#F59E0B]',
    normal: 'bg-surface text-text-tertiary',
  }
  return styles[priority] || styles.normal
}

export default function TicketsPage() {
  const [filters] = useState<TicketFilters>({})
  const [activeTab, setActiveTab] = useState<TicketStatus>('pendiente')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
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

  const isLongDescription = (desc: string | null) => (desc?.length || 0) > 120

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={`transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary">
          Detalle de <span className="text-atisa">tickets</span>
        </h1>
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

      {/* Tabs */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-1 mb-4">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.value
          const count = counts[tab.value] || 0
          return (
            <button
              key={tab.value}
              onClick={() => { setActiveTab(tab.value); setExpandedId(null) }}
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

      {/* Ticket List */}
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
        <motion.div variants={itemVariants} className="space-y-2">
          {filtered.map((ticket) => {
            const isExpanded = expandedId === ticket.id
            const isLong = isLongDescription(ticket.description)

            return (
              <div
                key={ticket.id}
                className="bg-white rounded-xl overflow-hidden transition-shadow"
                style={{ boxShadow: 'var(--shadow-sm)' }}
              >
                {/* Row header — always visible */}
                <div
                  className={`flex items-start gap-4 px-4 py-3.5 ${isLong ? 'cursor-pointer hover:bg-surface/30' : ''}`}
                  onClick={() => isLong && setExpandedId(isExpanded ? null : ticket.id)}
                >
                  {/* Order */}
                  <span className="font-mono font-semibold text-atisa text-[13px] min-w-[70px] pt-0.5">
                    #{ticket.order_number}
                  </span>

                  {/* Date */}
                  <span className="font-mono text-[12px] text-text-tertiary min-w-[50px] pt-0.5">
                    {formatDate(ticket.created_at, 'dd MMM')}
                  </span>

                  {/* Priority */}
                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${getPriorityBadge(ticket.priority)}`}>
                    {ticket.priority}
                  </span>

                  {/* Requester */}
                  <span className="text-[13px] font-medium text-text-primary min-w-[90px] whitespace-nowrap pt-0.5">
                    {shortenName(ticket.requester)}
                  </span>

                  {/* Description preview */}
                  <span className="text-[13px] text-text-secondary flex-1 leading-relaxed pt-0.5">
                    {isLong && !isExpanded
                      ? `${ticket.description?.slice(0, 120)}...`
                      : !isLong
                        ? ticket.description || 'Sin descripción'
                        : null
                    }
                  </span>

                  {/* Resolution info (only for resueltos) */}
                  {activeTab === 'resuelto' && ticket.resolution_time_display && (
                    <span className="font-mono text-[12px] font-semibold text-escalated whitespace-nowrap pt-0.5">
                      {ticket.resolution_time_display}
                    </span>
                  )}
                  {activeTab === 'resuelto' && ticket.resolved_by && (
                    <span className="text-[12px] text-text-tertiary whitespace-nowrap pt-0.5">
                      {ticket.resolved_by}
                    </span>
                  )}

                  {/* Expand indicator */}
                  {isLong && (
                    <ChevronDown
                      size={14}
                      className={`text-text-tertiary flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </div>

                {/* Expanded description */}
                <AnimatePresence>
                  {isExpanded && isLong && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 ml-[120px] border-t border-gray-50">
                        {formatDescription(ticket.description)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </motion.div>
      )}
    </motion.div>
  )
}
