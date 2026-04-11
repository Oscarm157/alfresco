import { CATEGORY_OPTIONS } from './constants'

type CategoryValue = (typeof CATEGORY_OPTIONS)[number]['value']

type TicketCategorySource = {
  category?: string | null
  description?: string | null
  service_type?: string | null
  serviceType?: string | null
  notes?: string | null
}

const CATEGORY_RULES: { category: CategoryValue; keywords: string[] }[] = [
  {
    category: 'validacion_documental',
    keywords: [
      'siroc', 'sipare', 'cfdi', 'imss', 'infonavit', 'rfc', 'xml', 'timbr', 'acuse',
      'document', 'constancia', 'comprobante', 'recibo', 'rechaz', 'validacion', 'validar',
      'folio fiscal', 'factura', 'sat',
    ],
  },
  {
    category: 'accesos_permisos',
    keywords: [
      'acceso', 'permiso', 'usuario', 'login', 'contrasena', 'password',
      'sesion', 'rol', 'alta de usuario', 'restablecer', 'desbloquear',
    ],
  },
  {
    category: 'configuracion',
    keywords: [
      'configur', 'catalogo', 'parametr', 'periodo', 'regla', 'actividad',
      'limite', 'ajuste', 'modulo', 'seccion', 'plantilla', 'flujo',
    ],
  },
  {
    category: 'mejora',
    keywords: [
      'mejora', 'nuevo', 'nueva funcionalidad', 'optimizar', 'automat', 'agregar',
      'anadir', 'visualizacion', 'experiencia', 'ux', 'ui', 'sugerencia',
    ],
  },
  {
    category: 'incidencia_funcional',
    keywords: [
      'error', 'falla', 'bug', 'incidencia', 'duplic', 'incorrect', 'no muestra',
      'no carga', 'no funciona', 'no permite', 'bloquea', 'problema', 'inconsistencia',
      'calculo',
    ],
  },
  {
    category: 'consulta_operativa',
    keywords: [
      'duda', 'consulta', 'como', 'apoyo', 'acompanamiento', 'esperado',
      'estatus', 'proceso', 'pasos', 'orientacion', 'revision',
    ],
  },
]

function normalizeText(value: string | null | undefined): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isKnownCategory(category: string | null | undefined): category is CategoryValue {
  return Boolean(category && CATEGORY_OPTIONS.some((option) => option.value === category))
}

export function inferTicketCategory(input: {
  category?: string | null
  description?: string | null
  serviceType?: string | null
  notes?: string | null
}): CategoryValue {
  if (isKnownCategory(input.category)) {
    return input.category
  }

  const text = normalizeText([input.description, input.serviceType, input.notes].filter(Boolean).join(' '))

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(normalizeText(keyword)))) {
      return rule.category
    }
  }

  return 'consulta_operativa'
}

export function resolveTicketCategory(ticket: TicketCategorySource): CategoryValue {
  return inferTicketCategory({
    category: ticket.category,
    description: ticket.description,
    serviceType: ticket.service_type ?? ticket.serviceType ?? null,
    notes: ticket.notes,
  })
}

export function ticketMatchesCategory(ticket: TicketCategorySource, category: string | null | undefined): boolean {
  if (!category) return true
  return resolveTicketCategory(ticket) === category
}
