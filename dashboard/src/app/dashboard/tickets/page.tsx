'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, Search, Hourglass, CheckCircle2, XCircle, AlertTriangle, ChevronDown } from 'lucide-react'
import { useTickets } from '@/hooks/use-tickets'
import { FilterBar } from '@/components/layout/filter-bar'
import { formatDate, shortenName } from '@/lib/utils'
import type { ResolvedBy, Ticket, TicketFilters, TicketStatus } from '@/lib/types'

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

const RESOLVED_BY_FILTERS: { value: ResolvedBy; label: string; color: string }[] = [
  { value: 'TI', label: 'TI', color: '#2563EB' },
  { value: 'Appropia', label: 'Appropia', color: '#7C3AED' },
]

function formatDescription(text: string | null): React.ReactNode {
  if (!text) return <span className="text-text-tertiary">Sin descripcion</span>

  // Split into paragraphs by double newlines or single newlines
  const paragraphs = text.split(/\n\s*\n|\n/).filter(p => p.trim())

  return (
    <div className="space-y-2.5">
      {paragraphs.map((para, i) => {
        const trimmed = para.trim()

        // Email-style headers (Documento:, Periodo:, Fecha:, Motivo:, etc.)
        const kvMatch = trimmed.match(/^(Documento|Periodo|Fecha|Motivo del rechazo|Motivo|Estado|Valor fuente|Valor objetivo|Subcontratista|Obra|Documentos|Proximos pasos):\s*(.+)/i)
        if (kvMatch) {
          const [, key, val] = kvMatch
          const isStatus = /estado/i.test(key)
          const statusColor = /passed|aprobado/i.test(val) ? '#10B981' : /missing|rechaz|fallaron/i.test(val) ? '#EF4444' : /pendiente|alerta/i.test(val) ? '#F59E0B' : undefined
          return (
            <div key={i} className="flex gap-2 text-[12px]">
              <span className="text-text-tertiary font-semibold min-w-[120px] shrink-0">{key}:</span>
              <span className={isStatus && statusColor ? 'font-mono font-semibold' : 'text-text-primary'} style={statusColor ? { color: statusColor } : undefined}>
                {val}
              </span>
            </div>
          )
        }

        // Section-like headers (all caps or ending with colon, short)
        if ((trimmed.endsWith(':') && trimmed.length < 60) || /^(Resumen|Detalles|Metricas|Proximos pasos)/i.test(trimmed)) {
          return (
            <div key={i} className="text-[11px] font-bold text-text-secondary uppercase tracking-wider mt-1">
              {trimmed.replace(/:$/, '')}
            </div>
          )
        }

        // Bullet lines (•, -, *)
        if (/^[•\-\*]\s/.test(trimmed)) {
          return (
            <div key={i} className="text-[12px] text-text-secondary pl-3 flex gap-1.5">
              <span className="text-text-tertiary">•</span>
              <span>{trimmed.replace(/^[•\-\*]\s*/, '')}</span>
            </div>
          )
        }

        // Validation rules (- Regla:)
        if (/^-?\s*Regla:/i.test(trimmed)) {
          return (
            <div key={i} className="text-[12px] text-text-primary font-medium pl-3 border-l-2 border-atisa/20 py-1">
              {trimmed.replace(/^-?\s*Regla:\s*/i, '')}
            </div>
          )
        }

        // Email signature blocks (Saludos, Grupo ATISA, etc.)
        if (/^(Saludos|Atentamente|Grupo ATISA)/i.test(trimmed)) {
          return <div key={i} className="text-[11px] text-text-tertiary italic">{trimmed}</div>
        }

        // URLs - make them clickable
        if (/https?:\/\/\S+/.test(trimmed)) {
          const parts = trimmed.split(/(https?:\/\/\S+)/)
          return (
            <p key={i} className="text-[13px] text-text-secondary leading-relaxed">
              {parts.map((part, j) =>
                /^https?:\/\//.test(part)
                  ? <a key={j} href={part} target="_blank" rel="noopener noreferrer" className="text-atisa underline underline-offset-2 font-medium">{part}</a>
                  : part
              )}
            </p>
          )
        }

        // Default paragraph
        return (
          <p key={i} className="text-[13px] text-text-secondary leading-relaxed">
            {trimmed}
          </p>
        )
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
  const [filters, setFilters] = useState<TicketFilters>({})
  const [activeTab, setActiveTab] = useState<TicketStatus>('pendiente')
  const [search, setSearch] = useState('')
  const [resolvedByFilter, setResolvedByFilter] = useState<ResolvedBy[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { tickets, loading, refreshing } = useTickets(filters)

  const filtered = useMemo(() => {
    let result = tickets.filter(t => t.status === activeTab)

    if (resolvedByFilter.length > 0) {
      result = result.filter((ticket) => ticket.resolved_by && resolvedByFilter.includes(ticket.resolved_by))
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.order_number.toString().includes(q) ||
        t.requester?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      )
    }
    return result
  }, [tickets, activeTab, resolvedByFilter, search])

  const grouped = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const groups = new Map<string, Ticket[]>()
    for (const t of sorted) {
      const d = new Date(t.created_at)
      const key = Number.isNaN(d.getTime()) ? 'sin-fecha' : format(d, 'yyyy-MM')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(t)
    }
    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: key === 'sin-fecha'
        ? 'Sin fecha'
        : format(new Date(`${key}-01T00:00:00`), "LLLL yyyy", { locale: es }),
      items,
    }))
  }, [filtered])

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    tickets.forEach(t => { c[t.status] = (c[t.status] || 0) + 1 })
    return c
  }, [tickets])

  const toggleResolvedByFilter = (value: ResolvedBy) => {
    setExpandedId(null)
    setResolvedByFilter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    )
  }

  const isLongDescription = (desc: string | null) => (desc?.length || 0) > 120

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className={`transition-opacity duration-300 ${refreshing ? 'opacity-60' : 'opacity-100'}`}>
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
        <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary">
          Detalle de <span className="text-atisa">tickets</span>
        </h1>
        <motion.button
          disabled
          className="flex items-center gap-2 px-5 h-10 rounded-lg bg-surface text-text-tertiary text-[13px] font-semibold cursor-not-allowed"
          title="La creacion de tickets aun no esta disponible"
        >
          <Plus size={16} />
          Nuevo ticket (proximamente)
        </motion.button>
      </motion.div>

      {/* Filters (fechas/mes, prioridad, solicitante, categoria) */}
      <motion.div variants={itemVariants}>
        <FilterBar filters={filters} onFiltersChange={setFilters} hideStatus hideResolvedBy />
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
          placeholder="Buscar por orden, solicitante o descripcion..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface text-[13px] text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-atisa/15"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
          Resuelto por
        </span>
        {RESOLVED_BY_FILTERS.map((option) => {
          const isActive = resolvedByFilter.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggleResolvedByFilter(option.value)}
              className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-all ${
                isActive ? 'text-white' : 'bg-white text-text-secondary hover:text-text-primary'
              }`}
              style={isActive ? { backgroundColor: option.color, boxShadow: 'var(--shadow-sm)' } : { boxShadow: 'var(--shadow-sm)' }}
            >
              {option.label}
            </button>
          )
        })}
        {resolvedByFilter.length > 0 && (
          <button
            type="button"
            onClick={() => setResolvedByFilter([])}
            className="rounded-lg px-3 py-2 text-[13px] font-medium text-atisa transition-colors hover:bg-white"
          >
            Limpiar
          </button>
        )}
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
          <p className="text-[13px] text-text-tertiary">Ajusta los filtros o busca otro termino</p>
        </div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-6">
          {grouped.map((group) => (
            <section key={group.key}>
              <div className="sticky top-0 z-10 -mx-1 mb-2 flex items-center gap-3 bg-gradient-to-b from-[var(--background,#f7f7f8)] to-transparent px-1 py-2">
                <div className="w-1 h-4 rounded-full bg-atisa" />
                <h2 className="font-heading text-[14px] font-bold text-text-primary capitalize">
                  {group.label}
                </h2>
                <span className="font-mono text-[11px] font-semibold text-text-tertiary">
                  {group.items.length} {group.items.length === 1 ? 'ticket' : 'tickets'}
                </span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <div className="space-y-2">
                {group.items.map((ticket) => {
                  const isExpanded = expandedId === ticket.id
                  const isLong = isLongDescription(ticket.description)

                  return (
                    <div
                      key={ticket.id}
                      className="bg-white rounded-xl overflow-hidden transition-shadow"
                      style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div
                        className={`flex items-start gap-4 px-4 py-3.5 ${isLong ? 'cursor-pointer hover:bg-surface/30' : ''}`}
                        onClick={() => isLong && setExpandedId(isExpanded ? null : ticket.id)}
                      >
                        <span className="font-mono font-semibold text-atisa text-[13px] min-w-[70px] pt-0.5">
                          #{ticket.order_number}
                        </span>

                        <span className="font-mono text-[12px] text-text-tertiary min-w-[50px] pt-0.5">
                          {formatDate(ticket.created_at, 'dd MMM')}
                        </span>

                        <span className={`inline-block w-[70px] text-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority}
                        </span>

                        <span className="text-[13px] font-medium text-text-primary min-w-[90px] whitespace-nowrap pt-0.5">
                          {shortenName(ticket.requester)}
                        </span>

                        <span className="text-[13px] text-text-secondary flex-1 leading-relaxed pt-0.5">
                          {isLong && !isExpanded
                            ? `${ticket.description?.slice(0, 120)}...`
                            : !isLong
                              ? ticket.description || 'Sin descripcion'
                              : null
                          }
                        </span>

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

                        {isLong && (
                          <ChevronDown
                            size={14}
                            className={`text-text-tertiary flex-shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        )}
                      </div>

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
              </div>
            </section>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}

