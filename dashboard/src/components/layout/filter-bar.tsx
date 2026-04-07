'use client'

import { useState, useEffect } from 'react'
import { Calendar, SlidersHorizontal, X, Download, FileSpreadsheet, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
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

function FilterSelect({ value, onChange, placeholder, children }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 pl-4 pr-9 rounded-xl bg-white/80 text-sm text-text-primary font-medium appearance-none cursor-pointer min-w-[130px] focus:outline-none focus:ring-2 focus:ring-atisa/15 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
    </div>
  )
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
    <div className="rounded-2xl px-5 py-4 mb-6 bg-gradient-to-b from-surface-alt/80 to-surface-alt/40">
      {/* Date presets */}
      <div className="flex flex-wrap items-center gap-2 mb-3.5">
        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center mr-0.5">
          <Calendar size={15} className="text-text-tertiary" />
        </div>
        {DATE_PRESETS.map((preset) => (
          <motion.button
            key={preset.value}
            onClick={() => handlePreset(preset.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${activePreset === preset.value
                ? 'bg-atisa text-white shadow-[0_2px_12px_rgba(210,38,44,0.3)]'
                : 'bg-white/70 text-text-secondary hover:text-text-primary hover:bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
              }
            `}
          >
            {preset.label}
          </motion.button>
        ))}
      </div>

      {/* Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center mr-0.5">
          <SlidersHorizontal size={15} className="text-text-tertiary" />
        </div>

        <FilterSelect
          value={filters.status || ''}
          onChange={(v) => onFiltersChange({ ...filters, status: v as TicketFilters['status'] || undefined })}
          placeholder="Estado"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.priority || ''}
          onChange={(v) => onFiltersChange({ ...filters, priority: v as TicketFilters['priority'] || undefined })}
          placeholder="Prioridad"
        >
          {PRIORITY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.requester || ''}
          onChange={(v) => onFiltersChange({ ...filters, requester: v || undefined })}
          placeholder="Solicitante"
        >
          {requesters.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={filters.resolvedBy || ''}
          onChange={(v) => onFiltersChange({ ...filters, resolvedBy: v as TicketFilters['resolvedBy'] || undefined })}
          placeholder="Resuelto por"
        >
          {RESOLVED_BY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </FilterSelect>

        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3.5 h-11 rounded-xl text-sm text-text-tertiary hover:text-atisa hover:bg-white/80 transition-all"
            >
              <X size={14} />
              Limpiar
            </motion.button>
          )}
        </AnimatePresence>

        <div className="hidden lg:flex flex-1" />

        {onExportPDF && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onExportPDF}
            className="flex items-center gap-2 px-4 h-11 rounded-xl bg-white/70 text-sm font-medium text-text-secondary hover:text-atisa shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
          >
            <Download size={15} />
            PDF
          </motion.button>
        )}
        {onExportExcel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onExportExcel}
            className="flex items-center gap-2 px-4 h-11 rounded-xl bg-white/70 text-sm font-medium text-text-secondary hover:text-atisa shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all"
          >
            <FileSpreadsheet size={15} />
            Excel
          </motion.button>
        )}
      </div>
    </div>
  )
}
