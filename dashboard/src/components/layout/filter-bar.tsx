'use client'

import { useState, useEffect } from 'react'
import { X, Download, FileSpreadsheet, ChevronDown } from 'lucide-react'
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
        className="h-10 pl-3.5 pr-8 rounded-lg bg-white text-[13px] text-text-primary font-medium appearance-none cursor-pointer min-w-[130px] focus:outline-none focus:ring-2 focus:ring-atisa/15 transition-shadow"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
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
    <div className="rounded-xl px-4 py-3 mb-5 bg-surface space-y-2.5">
      {/* Date presets + filter dropdowns in one flow */}
      <div className="flex flex-wrap items-center gap-2">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePreset(preset.value)}
            className={`
              px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-150
              ${activePreset === preset.value
                ? 'bg-atisa text-white shadow-[0_2px_8px_rgba(210,38,44,0.25)]'
                : 'bg-white text-text-secondary hover:text-text-primary'
              }
            `}
            style={activePreset !== preset.value ? { boxShadow: 'var(--shadow-sm)' } : undefined}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
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
              className="flex items-center gap-1 px-3 h-10 rounded-lg text-[13px] font-medium text-atisa hover:bg-white transition-colors"
            >
              <X size={14} />
              Limpiar
            </motion.button>
          )}
        </AnimatePresence>

        <div className="hidden lg:flex flex-1" />

        {onExportPDF && (
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-lg bg-white text-[13px] font-medium text-text-secondary hover:text-atisa transition-colors"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <Download size={14} />
            PDF
          </button>
        )}
        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="flex items-center gap-1.5 px-3.5 h-10 rounded-lg bg-white text-[13px] font-medium text-text-secondary hover:text-atisa transition-colors"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <FileSpreadsheet size={14} />
            Excel
          </button>
        )}
      </div>
    </div>
  )
}
