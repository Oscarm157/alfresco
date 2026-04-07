'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { parseExcelFile, transformRows } from '@/lib/excel-parser'
import type { ImportRow } from '@/lib/types'
import { toast } from 'sonner'

type ImportStep = 'upload' | 'preview' | 'importing' | 'done'

export default function TicketImportPage() {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState('')
  const [validRows, setValidRows] = useState<ImportRow[]>([])
  const [errors, setErrors] = useState<{ row: number; error: string }[]>([])
  const [importResult, setImportResult] = useState<{ imported: number } | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    setFileName(file.name)
    const buffer = await file.arrayBuffer()
    const { rows, mapping } = parseExcelFile(buffer)

    if (rows.length === 0) {
      toast.error('El archivo esta vacio')
      return
    }

    const { valid, errors } = transformRows(rows, mapping)
    setValidRows(valid)
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
      toast.error('No hay filas validas para importar')
      return
    }

    setStep('importing')
    try {
      const res = await fetch('/api/tickets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'No se pudieron importar los tickets')
      setImportResult(data)
      setStep('done')
      toast.success(`${data.imported} tickets importados`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudieron importar los tickets')
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

  return (
    <div>
      <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary mb-1">
        Importar <span className="text-atisa">Tickets</span>
      </h1>
      <p className="text-sm text-text-tertiary mb-8">
        Sube un archivo Excel o CSV para importar tickets al sistema
      </p>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`
                relative rounded-2xl p-16 text-center transition-all cursor-pointer
                ${dragOver
                  ? 'bg-atisa/5 shadow-[0_0_0_2px_#D2262C]'
                  : 'bg-surface hover:bg-surface-alt shadow-[0_2px_12px_rgba(0,0,0,0.04)]'
                }
              `}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              <Upload size={40} className={`mx-auto mb-4 ${dragOver ? 'text-atisa' : 'text-text-tertiary'}`} />
              <p className="text-lg font-medium text-text-primary mb-1">
                Arrastra tu archivo aqui
              </p>
              <p className="text-sm text-text-tertiary">
                o haz click para seleccionar: .xlsx, .xls, .csv
              </p>
            </div>
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
          >
            <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-6 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <FileSpreadsheet size={20} className="text-atisa" />
                <span className="font-medium text-text-primary">{fileName}</span>
                <span className="font-mono text-sm text-text-tertiary">
                  {validRows.length} filas validas
                </span>
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
                      <th className="py-2 px-3 bg-surface rounded-l-lg">Orden</th>
                      <th className="py-2 px-3 bg-surface">Estado</th>
                      <th className="py-2 px-3 bg-surface">Fecha</th>
                      <th className="py-2 px-3 bg-surface">Prioridad</th>
                      <th className="py-2 px-3 bg-surface">Solicito</th>
                      <th className="py-2 px-3 bg-surface">Tiempo</th>
                      <th className="py-2 px-3 bg-surface rounded-r-lg">Descripcion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 20).map((row, i) => (
                      <tr key={i} className="hover:bg-surface/50">
                        <td className="py-2.5 px-3 font-mono font-semibold text-atisa">#{row.order_number}</td>
                        <td className="py-2.5 px-3 capitalize">{row.status}</td>
                        <td className="py-2.5 px-3 font-mono text-xs">{row.created_at?.slice(0, 10)}</td>
                        <td className="py-2.5 px-3 capitalize">{row.priority}</td>
                        <td className="py-2.5 px-3 text-xs">{row.requester}</td>
                        <td className="py-2.5 px-3 font-mono text-xs">{row.resolution_time_display}</td>
                        <td className="py-2.5 px-3 text-xs text-text-tertiary max-w-[200px] truncate">
                          {row.description?.slice(0, 80)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {validRows.length > 20 && (
                  <p className="text-xs text-text-tertiary text-center py-2">
                    ... y {validRows.length - 20} filas mas
                  </p>
                )}
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-cancelled/5 rounded-2xl p-4 mb-4">
                <p className="text-sm font-medium text-cancelled mb-2">Errores encontrados:</p>
                {errors.slice(0, 5).map((e, i) => (
                  <p key={i} className="text-xs text-text-secondary">
                    Fila {e.row}: {e.error}
                  </p>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={reset} className="px-6 h-12 rounded-xl bg-surface text-sm font-medium text-text-secondary hover:bg-surface-alt transition-all">
                Cancelar
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleImport}
                className="px-8 h-12 rounded-xl bg-atisa text-white text-sm font-semibold shadow-[0_4px_14px_rgba(210,38,44,0.3)] hover:bg-atisa-hover transition-colors"
              >
                Importar {validRows.length} tickets
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 'importing' && (
          <motion.div
            key="importing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Loader2 size={40} className="mx-auto text-atisa animate-spin mb-4" />
            <p className="text-lg font-medium text-text-primary">Importando tickets...</p>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <CheckCircle2 size={48} className="mx-auto text-resolved mb-4" />
            <p className="text-xl font-heading font-bold text-text-primary mb-2">
              Importacion completada!
            </p>
            <p className="text-text-tertiary mb-6">
              {importResult?.imported} tickets importados correctamente
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={reset}
              className="px-8 h-12 rounded-xl bg-atisa text-white text-sm font-semibold shadow-[0_4px_14px_rgba(210,38,44,0.3)]"
            >
              Importar otro archivo
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

