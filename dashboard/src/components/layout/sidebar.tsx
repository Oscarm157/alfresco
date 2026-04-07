'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Ticket, GitCompare, TrendingUp, Upload, Menu, X, Timer, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/sprints', label: 'Sprints', icon: Timer },
  { href: '/dashboard/compare', label: 'Comparar', icon: GitCompare },
  { href: '/dashboard/trends', label: 'Tendencias', icon: TrendingUp },
  { href: '/dashboard/import', label: 'Importar Tickets', icon: Upload },
  { href: '/dashboard/sprints/import', label: 'Importar Horas', icon: UploadCloud },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-sidebar text-white p-2.5 rounded-xl shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-[240px] bg-sidebar z-50
        flex flex-col transition-transform duration-300
        lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="px-5 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-atisa rounded-lg flex items-center justify-center text-[11px] font-bold text-white">
              AT
            </div>
            <div>
              <h1 className="font-heading text-white font-bold text-base tracking-tight leading-tight">
                Alfresco
              </h1>
              <p className="text-[10px] font-mono text-atisa font-semibold tracking-widest uppercase">
                ATISA GROUP
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-5 mb-3 h-px bg-white/10" />

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  relative flex items-center gap-3 px-4 py-3 rounded-xl mb-1
                  text-sm font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-atisa rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4">
          <div className="text-[11px] text-white/30 font-mono">
            Grupo ATISA · TI
          </div>
        </div>
      </aside>
    </>
  )
}


