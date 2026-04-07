'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { parseSprintExcel } from '@/lib/sprint-parser'
import type { SprintImportRow } from '@/lib/sprint-parser'
import { TASK_TYPE_OPTIONS } from '@/lib/sprint-types'
import { toast } from 'sonner'

type ImportStep = 'upload' | 'preview' | 'importing' | 'done'

export default function HoursImportPage() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState('')
  const [validRows, setValidRows] = useState<SprintImportRow[]>([])
  const [errors, setErrors] = useState<{ row: number; error: string }[]>([])
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    const buffer = await file.arrayBuffer()
    const { rows, errors } = parseSprintExcel(buffer)
    setValidRows(rows)
    setErrors(errors)
    setStep('preview')
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = async () => {
    if (validRows.length === 0) {
      toast.error('No hay registros validos para importar')
      return
    }

    setStep('importing')
    try {
      const res = await fetch('/api/sprints/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudieron importar los registros')
      setImportResult(data)
      setStep('done')
      toast.success(`${data.imported} registros importados`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron importar los registros')
      setStep('preview')
    }
  }

  const reset = () => {
    setStep('upload')
    setFileName('')
    setValidRows([])
    setErrors([])
    setImportResult(null)
  }

  const TYPE_COLORS: Record<string, string> = {
    implementacion: '#D2262C',
    soporte: '#0EA5E9',
    deuda_tecnica: '#F59E0B',
    mantenimiento: '#8B5CF6',
  }

  return (
    <div>
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary mb-1">
        Importar <span className="text-atisa">Horas</span>
      </h1>
      <p className="text-sm text-text-tertiary mb-8">
        Sube el Excel mensual de horas de Appropia
      </p>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`relative rounded-2xl p-16 text-center transition-all cursor-pointer
                ${dragOver ? 'bg-atisa/5 shadow-[0_0_0_2px_#D2262C]' : 'bg-surface hover:bg-surface-alt shadow-[0_2px_12px_rgba(0,0,0,0.04)]'}`}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Upload size={40} className={`mx-auto mb-4 ${dragOver ? 'text-atisa' : 'text-text-tertiary'}`} />
              <p className="text-lg font-medium text-text-primary mb-1">Arrastra el archivo de Appropia</p>
              <p className="text-sm text-text-tertiary">Formato esperado: Fecha, Sprint, Tiempo, Detalle, Tipo de tarea, Quien</p>
            </div>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}>
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet size={20} className="text-atisa" />
                <span className="font-medium text-text-primary">{fileName}</span>
                <span className="font-mono text-sm text-text-tertiary">{validRows.length} registros</span>
                {errors.length > 0 && (
                  <span className="flex items-center gap-1 text-sm text-cancelled">
                    <AlertCircle size={14} /> {errors.length} errores
                  </span>
                )}
              </div>

              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-text-tertiary">
                      <th className="py-2 px-3 bg-surface rounded-l-lg">Fecha</th>
                      <th className="py-2 px-3 bg-surface">Sprint</th>
                      <th className="py-2 px-3 bg-surface">Horas</th>
                      <th className="py-2 px-3 bg-surface">Tipo</th>
                      <th className="py-2 px-3 bg-surface">Quien</th>
                      <th className="py-2 px-3 bg-surface rounded-r-lg">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.map((row, i) => (
                      <tr key={i} className="hover:bg-surface/50">
                        <td className="py-2.5 px-3 font-mono text-xs">{row.date}</td>
                        <td className="py-2.5 px-3 font-mono text-xs font-semibold">{row.sprint}</td>
                        <td className="py-2.5 px-3 font-mono font-bold" style={{ color: TYPE_COLORS[row.task_type] }}>{row.hours}h</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                            style={{ backgroundColor: `${TYPE_COLORS[row.task_type]}15`, color: TYPE_COLORS[row.task_type] }}>
                            {TASK_TYPE_OPTIONS.find(t => t.value === row.task_type)?.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs">{row.assignee}</td>
                        <td className="py-2.5 px-3 text-xs text-text-tertiary max-w-[250px] truncate">{row.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={reset} className="px-6 h-12 rounded-xl bg-surface text-sm font-medium text-text-secondary hover:bg-surface-alt transition-all">Cancelar</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleImport}
                className="px-8 h-12 rounded-xl bg-atisa text-white text-sm font-semibold shadow-[0_4px_14px_rgba(210,38,44,0.3)] hover:bg-atisa-hover transition-colors">
                Importar {validRows.length} registros
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'importing' && (
          <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <Loader2 size={40} className="mx-auto text-atisa animate-spin mb-4" />
            <p className="text-lg font-medium text-text-primary">Importando registros...</p>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <CheckCircle2 size={48} className="mx-auto text-resolved mb-4" />
            <p className="text-xl font-heading font-bold text-text-primary mb-2">Importacion completada!</p>
            <p className="text-text-tertiary mb-6">{importResult?.imported} registros importados</p>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={reset}
              className="px-8 h-12 rounded-xl bg-atisa text-white text-sm font-semibold shadow-[0_4px_14px_rgba(210,38,44,0.3)]">
              Importar otro archivo
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
