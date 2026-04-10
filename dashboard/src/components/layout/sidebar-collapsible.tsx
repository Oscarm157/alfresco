'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Ticket, GitCompare, TrendingUp, Upload, Menu, X, Timer, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/tickets', label: 'Tickets', icon: Ticket },
  { href: '/dashboard/sprints', label: 'Sprints', icon: Timer },
  { href: '/dashboard/compare', label: 'Comparar', icon: GitCompare },
  { href: '/dashboard/trends', label: 'Tendencias', icon: TrendingUp },
  { href: '/dashboard/import', label: 'Importar', icon: Upload },
]

interface SidebarCollapsibleProps {
  collapsed: boolean
  onToggleCollapsed: () => void
}

export function SidebarCollapsible({ collapsed, onToggleCollapsed }: SidebarCollapsibleProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-sidebar text-white p-2.5 rounded-xl shadow-lg"
      >
        <Menu size={20} />
      </button>

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

      <aside
        className={`
          fixed top-0 left-0 h-full bg-sidebar z-50 flex flex-col transition-all duration-300
          lg:translate-x-0
          ${collapsed ? 'lg:w-[88px]' : 'lg:w-[240px]'}
          ${mobileOpen ? 'translate-x-0 w-[240px]' : '-translate-x-full w-[240px]'}
        `}
      >
        <div className={`py-5 flex ${collapsed ? 'flex-col items-center gap-3 px-3' : 'items-center justify-between px-5'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 bg-atisa rounded-lg flex items-center justify-center text-[11px] font-bold text-white">
              AT
            </div>
            <div className={collapsed ? 'hidden' : 'block'}>
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
            className={`text-white/60 hover:text-white lg:hidden ${collapsed ? 'absolute right-3 top-5' : ''}`}
          >
            <X size={18} />
          </button>

          <button
            onClick={onToggleCollapsed}
            className="hidden lg:flex items-center justify-center h-9 w-9 rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <div className={`mb-3 h-px bg-white/10 ${collapsed ? 'mx-3' : 'mx-5'}`} />

        <nav className={`flex-1 mt-2 ${collapsed ? 'px-2' : 'px-3'}`}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  relative flex items-center rounded-xl mb-1 text-sm font-medium transition-all duration-200
                  ${collapsed ? 'justify-center px-0 py-3.5' : 'gap-3 px-4 py-3'}
                  ${isActive ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}
                `}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator-collapsible"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-atisa rounded-r-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className={collapsed ? 'hidden' : 'block'}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className={`py-4 ${collapsed ? 'px-3' : 'px-6'}`}>
          <div className={`text-[11px] text-white/30 font-mono ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? 'TI' : 'Grupo ATISA · TI'}
          </div>
        </div>
      </aside>
    </>
  )
}
