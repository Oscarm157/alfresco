import { CATEGORY_OPTIONS } from './constants'

type CategoryValue = (typeof CATEGORY_OPTIONS)[number]['value']

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
      'acceso', 'permiso', 'usuario', 'login', 'contrasena', 'contraseña', 'password',
      'sesion', 'sesión', 'rol', 'alta de usuario', 'restablecer', 'desbloquear',
    ],
  },
  {
    category: 'configuracion',
    keywords: [
      'configur', 'catalogo', 'catálogo', 'parametr', 'periodo', 'período', 'regla',
      'actividad', 'limite', 'límite', 'ajuste', 'modulo', 'módulo', 'seccion',
      'sección', 'plantilla', 'flujo',
    ],
  },
  {
    category: 'mejora',
    keywords: [
      'mejora', 'nuevo', 'nueva funcionalidad', 'optimizar', 'automat', 'agregar',
      'añadir', 'visualizacion', 'visualización', 'experiencia', 'ux', 'ui', 'sugerencia',
    ],
  },
  {
    category: 'incidencia_funcional',
    keywords: [
      'error', 'falla', 'bug', 'incidencia', 'duplic', 'incorrect', 'no muestra',
      'no carga', 'no funciona', 'no permite', 'bloquea', 'problema', 'inconsistencia',
      'calculo', 'cálculo',
    ],
  },
  {
    category: 'consulta_operativa',
    keywords: [
      'duda', 'consulta', 'como', 'cómo', 'apoyo', 'acompanamiento', 'acompañamiento',
      'esperado', 'estatus', 'proceso', 'pasos', 'orientacion', 'orientación', 'revision',
      'revisión',
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

export function inferTicketCategory(input: {
  description?: string | null
  serviceType?: string | null
  notes?: string | null
  category?: string | null
}): CategoryValue {
  if (input.category && CATEGORY_OPTIONS.some((option) => option.value === input.category)) {
    return input.category as CategoryValue
  }

  const text = normalizeText([input.description, input.serviceType, input.notes].filter(Boolean).join(' '))

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(normalizeText(keyword)))) {
      return rule.category
    }
  }

  return 'consulta_operativa'
}
