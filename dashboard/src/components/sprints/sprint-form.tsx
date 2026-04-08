'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface SprintFormProps {
  monthKey: string
  onCreated: () => void
  buttonLabel?: string
  defaultName?: string
  disabled?: boolean
}

export function SprintForm({ monthKey, onCreated, buttonLabel = 'Nuevo Sprint', defaultName = '', disabled = false }: SprintFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: defaultName,
    start_date: '',
    end_date: '',
    dev_sp_committed: 20,
    maintenance_sp_committed: 4,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast.error('Nombre del sprint requerido'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/sprints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          ...form,
          month_key: monthKey,
          dev_sp_delivered: 0,
          maintenance_sp_delivered: 0,
        }]),
      })
      if (!res.ok) throw new Error('Error al crear sprint')
      toast.success(`Sprint "${form.name}" creado`)
      setForm({ name: defaultName, start_date: '', end_date: '', dev_sp_committed: 20, maintenance_sp_committed: 4 })
      setOpen(false)
      onCreated()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className="flex items-center gap-2 px-5 h-12 rounded-xl bg-atisa text-white text-sm font-semibold shadow-[0_4px_14px_rgba(210,38,44,0.3)] hover:bg-atisa-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus size={18} />
        {buttonLabel}
      </motion.button>
    )
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-sm text-text-primary">Crear Sprint</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-text-tertiary hover:text-text-primary">
          <X size={18} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <input
          placeholder="Nombre (ej: Sprint 3 2.0)"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="h-12 px-4 rounded-xl bg-surface text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-atisa/20 col-span-2 lg:col-span-1"
        />
        <input
          type="date"
          value={form.start_date}
          onChange={e => setForm({ ...form, start_date: e.target.value })}
          className="h-12 px-4 rounded-xl bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-atisa/20"
        />
        <input
          type="date"
          value={form.end_date}
          onChange={e => setForm({ ...form, end_date: e.target.value })}
          className="h-12 px-4 rounded-xl bg-surface text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-atisa/20"
        />
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={form.dev_sp_committed}
            onChange={e => setForm({ ...form, dev_sp_committed: parseInt(e.target.value) || 0 })}
            className="h-12 w-20 px-3 rounded-xl bg-surface text-sm text-center font-mono font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-atisa/20"
          />
          <span className="text-xs text-text-tertiary">SP Dev</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={form.maintenance_sp_committed}
            onChange={e => setForm({ ...form, maintenance_sp_committed: parseInt(e.target.value) || 0 })}
            className="h-12 w-20 px-3 rounded-xl bg-surface text-sm text-center font-mono font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-atisa/20"
          />
          <span className="text-xs text-text-tertiary">SP Mant</span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        type="submit"
        disabled={loading}
        className="px-6 h-12 rounded-xl bg-atisa text-white text-sm font-semibold shadow-[0_4px_14px_rgba(210,38,44,0.3)] hover:bg-atisa-hover transition-colors disabled:opacity-50"
      >
        {loading ? 'Creando...' : 'Crear Sprint'}
      </motion.button>
    </motion.form>
  )
}
