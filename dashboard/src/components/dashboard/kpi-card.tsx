'use client'

import { motion } from 'motion/react'

interface KPICardProps {
  value: string | number
  label: string
  subtitle?: string
  accentColor: string
  icon: React.ReactNode
}

export function KPICard({ value, label, subtitle, accentColor, icon }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
      className="relative bg-white rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow overflow-hidden min-w-0"
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${accentColor}10` }}
        >
          <div style={{ color: accentColor }}>{icon}</div>
        </div>
        {subtitle && (
          <span
            className="text-[10px] sm:text-xs font-mono font-semibold px-2 py-1 rounded-lg truncate max-w-[100px]"
            style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
          >
            {subtitle}
          </span>
        )}
      </div>

      <div className="font-mono text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight leading-none truncate" style={{ color: accentColor }}>
        {value}
      </div>
      <div className="text-[10px] sm:text-[11px] font-medium text-text-tertiary uppercase tracking-[0.08em] mt-1.5 truncate">
        {label}
      </div>
    </motion.div>
  )
}
