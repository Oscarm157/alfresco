'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import type { Sprint, SprintTask } from '@/lib/sprint-types'

const LABELS = [
  'INTERFAZ DE ADMIN',
  'CIERRE DE OBRAS',
  'AFINACION DE CARACTERISTICAS',
  'VALIDACION DE DOCUMENTOS',
  'GESTION DE PROVEEDORES',
  'REPORTES Y KPI',
  'INTEGRACIONES',
  'OTRO',
]

const STATUS_OPTIONS = [
  { value: 'tareas_por_hacer', label: 'Tareas por hacer', color: '#94A3B8' },
  { value: 'en_curso', label: 'En curso', color: '#0EA5E9' },
  { value: 'completada', label: 'Completada', color: '#10B981' },
]

const PRIORITY_OPTIONS = [
  { value: 'baja', label: 'Baja', color: '#94A3B8' },
  { value: 'media', label: 'Media', color: '#F59E0B' },
  { value: 'alta', label: 'Alta', color: '#EF4444' },
]

interface TaskListProps {
  sprint: Sprint
  tasks: SprintTask[]
  onRefresh: () => void
}

export function TaskList({ sprint, tasks, onRefresh }: TaskListProps) {
  const [expanded, setExpanded] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    jira_key: '',
    title: '',
    label: '',
    story_points: 0,
    assignee: '',
    status: 'tareas_por_hacer',
    priority: 'media',
  })

  const totalSP = tasks.reduce((a, t) => a + t.story_points, 0)
  const completedSP = tasks.filter(t => t.status === 'completada').reduce((a, t) => a + t.story_points, 0)
  const inProgressSP = tasks.filter(t => t.status === 'en_curso').reduce((a, t) => a + t.story_points, 0)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.jira_key || !form.title) { toast.error('ID y titulo requeridos'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/sprints/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sprint_id: sprint.id,
          sprint_name: sprint.name,
          month_key: sprint.month_key,
        }),
      })
      if (!res.ok) throw new Error('Error al crear tarea')
      toast.success(`Tarea ${form.jira_key} agregada`)
      setForm({ jira_key: '', title: '', label: '', story_points: 0, assignee: '', status: 'tareas_por_hacer', priority: 'media' })
      setShowForm(false)
      onRefresh()
    } catch (err) {
      toast.error(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sprints/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('No se pudo eliminar la tarea')
      toast.success('Tarea eliminada')
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar la tarea')
    }
  }

  const handleStatusChange = async (id: string, status?: string, priority?: string) => {
    const body: Record<string, string> = {}
    if (status) body.status = status
    if (priority) body.priority = priority
    try {
      const res = await fetch(`/api/sprints/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error('No se pudo actualizar la tarea')
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar la tarea')
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Sprint header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? <ChevronUp size={16} className="text-text-tertiary" /> : <ChevronDown size={16} className="text-text-tertiary" />}
          <span className="font-heading font-semibold text-sm text-text-primary">{sprint.name}</span>
          {sprint.start_date && sprint.end_date && (
            <span className="text-sm text-text-tertiary">
              {sprint.start_date} - {sprint.end_date}
            </span>
          )}
          <span className="text-sm text-text-tertiary">({tasks.length} tareas)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-text-primary">{totalSP}</span>
          {completedSP > 0 && (
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#10B981]/10 text-[#10B981]">{completedSP}</span>
          )}
          {inProgressSP > 0 && (
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9]">{inProgressSP}</span>
          )}
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-lg bg-surface text-text-tertiary">
            {totalSP - completedSP - inProgressSP}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            {/* Tasks */}
            <div className="px-5 pb-2">
              {tasks.map((task) => {
                const statusOpt = STATUS_OPTIONS.find(s => s.value === task.status)
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 py-3 group"
                  >
                    {/* Status dot */}
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: statusOpt?.color }} />

                    {/* Jira key */}
                    <span className="font-mono text-sm font-semibold text-atisa min-w-[60px]">{task.jira_key}</span>

                    {/* Title */}
                    <span className="text-sm text-text-primary flex-1 truncate" title={task.title}>{task.title}</span>

                    {/* Label */}
                    {task.label && (
                      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-atisa/10 text-atisa uppercase tracking-wider whitespace-nowrap hidden sm:block">
                        {task.label}
                      </span>
                    )}

                    {/* Priority */}
                    <select
                      value={task.priority || 'media'}
                      onChange={(e) => handleStatusChange(task.id, undefined, e.target.value)}
                      className="h-8 px-2 rounded-lg text-[11px] font-semibold appearance-none cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: `${(PRIORITY_OPTIONS.find(p => p.value === (task.priority || 'media'))?.color || '#F59E0B')}15`,
                        color: PRIORITY_OPTIONS.find(p => p.value === (task.priority || 'media'))?.color || '#F59E0B',
                      }}
                    >
                      {PRIORITY_OPTIONS.map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>

                    {/* Status select */}
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value, undefined)}
                      className="h-8 px-2 rounded-lg text-[11px] font-semibold appearance-none cursor-pointer focus:outline-none"
                      style={{
                        backgroundColor: `${statusOpt?.color}15`,
                        color: statusOpt?.color,
                      }}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>

                    {/* SP */}
                    <span className="font-mono text-sm font-bold text-text-primary min-w-[24px] text-center">{task.story_points}</span>

                    {/* Assignee */}
                    {task.assignee && (
                      <div className="w-7 h-7 rounded-full bg-escalated/20 flex items-center justify-center text-[10px] font-bold text-escalated">
                        {task.assignee.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-tertiary hover:text-cancelled transition-all p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Add task form */}
            {showForm ? (
              <motion.form
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleAdd}
                className="px-5 pb-4"
              >
                <div className="bg-surface-alt rounded-xl p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2 mb-3">
                    <input
                      placeholder="AT-000"
                      value={form.jira_key}
                      onChange={e => setForm({ ...form, jira_key: e.target.value })}
                      className="h-12 px-4 rounded-xl bg-white text-sm font-mono text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-atisa/20"
                    />
                    <input
                      placeholder="Titulo de la tarea"
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      className="h-12 px-4 rounded-xl bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-atisa/20 col-span-2"
                    />
                    <select
                      value={form.label}
                      onChange={e => setForm({ ...form, label: e.target.value })}
                      className="h-12 px-3 rounded-xl bg-white text-sm text-text-primary appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-atisa/20"
                    >
                      <option value="">Etiqueta</option>
                      {LABELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <input
                      type="number"
                      placeholder="SP"
                      value={form.story_points || ''}
                      onChange={e => setForm({ ...form, story_points: parseInt(e.target.value) || 0 })}
                      className="h-12 px-4 rounded-xl bg-white text-sm font-mono text-center text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-atisa/20"
                    />
                    <input
                      placeholder="Asignado"
                      value={form.assignee}
                      onChange={e => setForm({ ...form, assignee: e.target.value })}
                      className="h-12 px-4 rounded-xl bg-white text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-atisa/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} type="submit" disabled={loading}
                      className="px-5 h-10 rounded-xl bg-atisa text-white text-sm font-semibold hover:bg-atisa-hover transition-colors disabled:opacity-50">
                      {loading ? 'Agregando...' : 'Agregar'}
                    </motion.button>
                    <button type="button" onClick={() => setShowForm(false)}
                      className="px-4 h-10 rounded-xl text-sm text-text-tertiary hover:text-text-primary transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              </motion.form>
            ) : (
              <div className="px-5 pb-4 flex gap-2">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 text-sm text-text-tertiary hover:text-atisa transition-colors"
                >
                  <Plus size={15} /> Agregar tarea
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}


