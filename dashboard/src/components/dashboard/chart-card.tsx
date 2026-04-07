'use client'

import { motion } from 'motion/react'

interface ChartCardProps {
  title: string
  tag?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, tag, children, className = '' }: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={`bg-white rounded-xl p-5 ${className}`}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
        {tag && (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-gray-200 text-text-secondary uppercase tracking-wider">
            {tag}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  )
}
