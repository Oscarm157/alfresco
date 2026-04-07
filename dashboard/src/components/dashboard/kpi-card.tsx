'use client'

import { motion } from 'motion/react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

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

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length || data.every(d => d === 0)) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100
  const h = 28
  const pad = 2
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const areaPoints = [...points, `${pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)},${h}`, `${pad},${h}`]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints.join(' ')}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function DeltaBadge({ delta, accentColor, invert }: { delta: number | null; accentColor: string; invert?: boolean }) {
  if (delta === null) return null
  const isPositive = invert ? delta < 0 : delta > 0
  const isNeutral = delta === 0
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
  const displayColor = isNeutral ? '#999' : isPositive ? '#10B981' : '#EF4444'

  return (
    <div
      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold"
      style={{ backgroundColor: `${displayColor}12`, color: displayColor }}
    >
      <Icon size={11} strokeWidth={2.5} />
      {Math.abs(delta)}%
    </div>
  )
}

export function KPICard({ value, label, subtitle, accentColor, icon, sparkline, delta, invertDelta }: KPICardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
      className="relative bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-shadow overflow-hidden min-w-0 flex flex-col"
    >
      {/* Left accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ backgroundColor: accentColor }}
      />

      <div className="p-4 sm:p-5 flex-1">
        {/* Top row: icon + delta */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}12` }}
          >
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
          <DeltaBadge delta={delta ?? null} accentColor={accentColor} invert={invertDelta} />
        </div>

        {/* Value */}
        <div className="font-mono text-[28px] sm:text-[32px] font-bold tracking-tight leading-none truncate" style={{ color: accentColor }}>
          {value}
        </div>

        {/* Label + subtitle */}
        <div className="flex items-baseline gap-2 mt-2">
          <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.1em]">
            {label}
          </span>
          {subtitle && (
            <span
              className="text-[11px] font-mono font-semibold truncate"
              style={{ color: `${accentColor}99` }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Sparkline at bottom */}
      {sparkline && sparkline.length > 0 && (
        <div className="px-4 sm:px-5 pb-3">
          <MiniSparkline data={sparkline} color={accentColor} />
        </div>
      )}
    </motion.div>
  )
}
