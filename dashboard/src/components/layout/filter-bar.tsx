'use client'

import { useState, useEffect } from 'react'
import { Calendar, Filter, X, Download, FileSpreadsheet } from 'lucide-react'
import { motion } from 'motion/react'
import type { TicketFilters } from '@/lib/types'
import { DATE_PRESETS, STATUS_OPTIONS, PRIORITY_OPTIONS, RESOLVED_BY_OPTIONS } from '@/lib/constants'
import { getDateRange } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

interface FilterBarProps {
  filters: TicketFilters
  onFiltersChange: (filters: TicketFilters) => void
  onExportPDF?: () => void
  onExportExcel?: () => void
}

export function FilterBar({ filters, onFiltersChange, onExportPDF, onExportExcel }: FilterBarProps) {
  const [requesters, setRequesters] = useState<string[]>([])
  const [activePreset, setActivePreset] = useState<string>('all')

  useEffect(() => {
    supabase
      .from('tickets')
      .select('requester')
      .then(({ data, error }) => {
        if (error) { console.error('Failed to fetch requesters:', error); return }
        if (data) {
          const unique = [...new Set(data.map(d => d.requester))].filter(Boolean).sort()
          setRequesters(unique)
        }
      })
  }, [])

  const handlePreset = (preset: string) => {
    setActivePreset(preset)
    if (preset === 'all') {
      onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })
    } else {
      const range = getDateRange(preset)
      onFiltersChange({ ...filters, dateFrom: range.from, dateTo: range.to })
    }
  }

  const clearFilters = () => {
    setActivePreset('all')
    onFiltersChange({})
  }

  const hasFilters = filters.status || filters.priority || filters.requester || filters.resolvedBy || filters.dateFrom

  return (
    <div className="bg-surface-alt rounded-2xl px-5 py-4 mb-6">
      {/* Date presets */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Calendar size={16} className="text-text-tertiary" />
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePreset(preset.value)}
            className={`
              px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
              ${activePreset === preset.value
                ? 'bg-atisa text-white shadow-[0_2px_8px_rgba(210,38,44,0.25)]'
                : 'bg-white text-text-secondary hover:text-text-primary hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
              }
            `}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-text-tertiary" />

        <select
          value={filters.status || ''}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as TicketFilters['status'] || undefined })}
          className="h-12 px-4 rounded-xl bg-white text-sm text-text-primary font-medium appearance-none cursor-pointer min-w-[130px] focus:outline-none focus:ring-2 focus:ring-atisa/20"
        >
          <option value="">Estado</option>
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.priority || ''}
          onChange={(e) => onFiltersChange({ ...filters, priority: e.target.value as TicketFilters['priority'] || undefined })}
          className="h-12 px-4 rounded-xl bg-white text-sm text-text-primary font-medium appearance-none cursor-pointer min-w-[130px] focus:outline-none focus:ring-2 focus:ring-atisa/20"
        >
          <option value="">Prioridad</option>
          {PRIORITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={filters.requester || ''}
          onChange={(e) => onFiltersChange({ ...filters, requester: e.target.value || undefined })}
          className="h-12 px-4 rounded-xl bg-white text-sm text-text-primary font-medium appearance-none cursor-pointer min-w-[150px] focus:outline-none focus:ring-2 focus:ring-atisa/20"
        >
          <option value="">Solicitante</option>
          {requesters.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        <select
          value={filters.resolvedBy || ''}
          onChange={(e) => onFiltersChange({ ...filters, resolvedBy: e.target.value as TicketFilters['resolvedBy'] || undefined })}
          className="h-12 px-4 rounded-xl bg-white text-sm text-text-primary font-medium appearance-none cursor-pointer min-w-[140px] focus:outline-none focus:ring-2 focus:ring-atisa/20"
        >
          <option value="">Resuelto por</option>
          {RESOLVED_BY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {hasFilters && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={clearFilters}
            className="flex items-center gap-1.5 px-3 h-12 rounded-xl text-sm text-text-tertiary hover:text-atisa hover:bg-white transition-all"
          >
            <X size={14} />
            Limpiar
          </motion.button>
        )}

        <div className="hidden lg:flex flex-1" />

        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-4 h-12 rounded-xl bg-white text-sm font-medium text-text-secondary hover:text-atisa hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
          >
            <Download size={15} />
            PDF
          </button>
        )}
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="flex items-center gap-2 px-4 h-12 rounded-xl bg-white text-sm font-medium text-text-secondary hover:text-atisa hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
          >
            <FileSpreadsheet size={15} />
            Excel
          </button>
        )}
      </div>
    </div>
  )
}
