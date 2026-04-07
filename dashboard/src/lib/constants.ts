export const STATUS_OPTIONS = [
  { value: 'pendiente', label: 'Pendiente', color: '#F59E0B' },
  { value: 'resuelto', label: 'Resuelto', color: '#10B981' },
  { value: 'cancelado', label: 'Cancelado', color: '#EF4444' },
  { value: 'escalado', label: 'Escalado', color: '#8B5CF6' },
] as const

export const PRIORITY_OPTIONS = [
  { value: 'urgente', label: 'Urgente', color: '#EF4444' },
  { value: 'alta', label: 'Alta', color: '#F59E0B' },
  { value: 'normal', label: 'Normal', color: '#94A3B8' },
] as const

export const RESOLVED_BY_OPTIONS = [
  { value: 'TI', label: 'TI (Interno)', color: '#2563EB' },
  { value: 'Appropia', label: 'Appropia (Externo)', color: '#7C3AED' },
] as const

export const CATEGORY_OPTIONS = [
  { value: 'validacion_docs', label: 'Validacion de documentos' },
  { value: 'gestion_docs', label: 'Gestion de documentos' },
  { value: 'altas_registros', label: 'Altas y registros' },
  { value: 'accesos', label: 'Accesos y contrasenas' },
  { value: 'matriz_kpi', label: 'Matriz / KPI' },
  { value: 'notificaciones', label: 'Notificaciones' },
  { value: 'otro', label: 'Otro' },
] as const

export const DATE_PRESETS = [
  { label: 'Esta semana', value: 'this_week' },
  { label: 'Este mes', value: 'this_month' },
  { label: 'Mes pasado', value: 'last_month' },
  { label: 'Ultimos 3 meses', value: 'last_3_months' },
  { label: 'Todo', value: 'all' },
] as const

