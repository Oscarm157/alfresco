'use client'

import { motion } from 'motion/react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  value: string | number
  label: string
  subtitle?: string
  accentColor: string
  icon: React.ReactNode
  sparkline?: number[]
  delta?: number | null
  invertDelta?: boolean
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length || data.every(d => d === 0)) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 64
  const h = 20
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  })

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-5 flex-shrink-0">
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function KPICard({ value, label, subtitle, accentColor, icon, sparkline, delta, invertDelta }: KPICardProps) {
  const hasDelta = delta !== null && delta !== undefined && delta !== 0
  const isPositive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0
  const deltaColor = !hasDelta ? '#999' : isPositive ? '#10B981' : '#EF4444'

  return (
    <motion.div
      whileHover={{ y: -2, transition: { type: 'spring', stiffness: 400, damping: 20 } }}
      className="bg-white rounded-xl p-4 min-w-0 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      {/* Label row with icon */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${accentColor}10`, color: accentColor }}
        >
          <div className="scale-[0.7]">{icon}</div>
        </div>
        <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-[0.06em] truncate">
          {label}
        </span>
      </div>

      {/* Value row */}
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span
              className="font-mono text-[22px] font-bold tracking-tight leading-none"
              style={{ color: accentColor }}
            >
              {value}
            </span>
            {subtitle && (
              <span className="text-[11px] font-mono text-text-tertiary truncate">
                {subtitle}
              </span>
            )}
          </div>
          {hasDelta && delta != null && (
            <div className="flex items-center gap-0.5 mt-1.5" style={{ color: deltaColor }}>
              {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
              <span className="text-[10px] font-mono font-semibold">{Math.abs(delta)}% vs anterior</span>
            </div>
          )}
        </div>
        {sparkline && <Sparkline data={sparkline} color={accentColor} />}
      </div>
    </motion.div>
  )
}
