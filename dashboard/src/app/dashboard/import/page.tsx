'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ChevronRight, Clock3, Upload, Ticket } from 'lucide-react'

const OPTIONS = [
  {
    href: '/dashboard/import/tickets',
    title: 'Importar tickets',
    description: 'Carga archivos Excel o CSV con tickets de soporte para alimentar el tablero de resolucion.',
    icon: Ticket,
    accent: 'bg-atisa/10 text-atisa',
  },
  {
    href: '/dashboard/import/hours',
    title: 'Importar horas y sprints',
    description: 'Sube el reporte mensual de Appropia para registrar horas, soporte, implementacion y story points.',
    icon: Clock3,
    accent: 'bg-escalated/10 text-escalated',
  },
]

export default function ImportPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
            Carga de datos
          </p>
          <h1 className="font-heading text-[28px] font-bold tracking-tight text-text-primary">
            Modulo de <span className="text-atisa">Importar</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-text-tertiary">
            Selecciona si quieres importar tickets de soporte o registros de horas y sprints.
          </p>
        </div>
        <div className="hidden rounded-2xl bg-surface px-4 py-3 md:flex md:items-center md:gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-atisa" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <Upload size={18} />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary">Entradas</div>
            <div className="font-mono text-sm font-bold text-text-primary">2 importadores disponibles</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {OPTIONS.map((option, index) => {
          const Icon = option.icon

          return (
            <motion.div
              key={option.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Link
                href={option.href}
                className="group block rounded-2xl bg-white p-6 transition-all hover:-translate-y-0.5"
                style={{ boxShadow: 'var(--shadow-md)' }}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${option.accent}`}>
                    <Icon size={22} />
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-text-tertiary transition-colors group-hover:text-text-secondary">
                    Abrir importador
                  </div>
                </div>

                <h2 className="mb-2 font-heading text-xl font-bold text-text-primary">
                  {option.title}
                </h2>
                <p className="mb-6 text-sm leading-relaxed text-text-secondary">
                  {option.description}
                </p>

                <div className="flex items-center gap-2 text-sm font-semibold text-atisa">
                  Continuar
                  <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
