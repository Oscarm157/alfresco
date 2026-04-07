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
  {
    value: 'incidencia_funcional',
    label: 'Incidencia funcional',
    description: 'Errores, duplicados, calculos incorrectos, periodos mal abiertos o comportamiento inesperado del sistema.',
  },
  {
    value: 'validacion_documental',
    label: 'Validacion documental',
    description: 'Casos ligados a SIROC, SIPARE, CFDI, IMSS, INFONAVIT, RFC y rechazos o validaciones de documentos.',
  },
  {
    value: 'accesos_permisos',
    label: 'Accesos y permisos',
    description: 'Altas de usuarios, contrasenas provisionales, permisos especiales y accesos a modulos o secciones.',
  },
  {
    value: 'configuracion',
    label: 'Configuracion',
    description: 'Cambios de reglas, catalogos, actividades, limites, periodos y ajustes operativos de la plataforma.',
  },
  {
    value: 'mejora',
    label: 'Mejora',
    description: 'Solicitudes para agregar candados, mejorar visualizacion, contexto o experiencia de uso.',
  },
  {
    value: 'consulta_operativa',
    label: 'Consulta operativa',
    description: 'Dudas sobre logica de estatus, comportamiento esperado o acompanamiento funcional.',
  },
] as const

export const DATE_PRESETS = [
  { label: 'Esta semana', value: 'this_week' },
  { label: 'Este mes', value: 'this_month' },
  { label: 'Mes pasado', value: 'last_month' },
  { label: 'Ultimos 3 meses', value: 'last_3_months' },
  { label: 'Todo', value: 'all' },
] as const

