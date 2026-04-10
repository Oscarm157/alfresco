'use client'

import { useState } from 'react'
import { SidebarCollapsible } from '@/components/layout/sidebar-collapsible'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="flex min-h-screen">
      <SidebarCollapsible
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((current) => !current)}
      />
      <main className={`flex-1 min-h-screen pt-14 lg:pt-0 overflow-x-hidden transition-[margin] duration-300 ${collapsed ? 'lg:ml-[88px]' : 'lg:ml-[240px]'}`}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
