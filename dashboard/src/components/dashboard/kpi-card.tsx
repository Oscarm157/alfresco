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

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length || data.every(d => d === 0)) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 120
  const h = 40
  const pad = 2
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const areaPoints = [
    `${pad},${h}`,
    ...points,
    `${pad + ((data.length - 1) / (data.length - 1)) * (w - pad * 2)},${h}`,
  ]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints.join(' ')}
        fill={`url(#spark-${color.replace('#', '')})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on last point */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].split(',')[0]}
          cy={points[points.length - 1].split(',')[1]}
          r="3"
          fill={color}
        />
      )}
    </svg>
  )
}

export function KPICard({ value, label, subtitle, accentColor, icon, sparkline, delta, invertDelta }: KPICardProps) {
  const hasDelta = delta !== null && delta !== undefined && delta !== 0
  const isPositive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0
  const deltaColor = !hasDelta ? '#999' : isPositive ? '#10B981' : '#EF4444'
  const DeltaIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <motion.div
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
      className="relative rounded-2xl overflow-hidden min-w-0 flex flex-col"
      style={{
        background: `linear-gradient(135deg, white 0%, white 85%, ${accentColor}06 100%)`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 6px 20px rgba(0,0,0,0.03)',
      }}
    >
      {/* Left accent bar — thicker */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{ backgroundColor: accentColor }}
      />

      <div className="px-5 pt-5 pb-2 flex-1">
        {/* Top row: icon + delta */}
        <div className="flex items-center justify-between mb-5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${accentColor}14` }}
          >
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
          {hasDelta && delta != null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold"
              style={{ backgroundColor: `${deltaColor}10`, color: deltaColor }}
            >
              <DeltaIcon size={12} strokeWidth={2.5} />
              {Math.abs(delta)}%
            </motion.div>
          )}
        </div>

        {/* Value — BIG */}
        <div
          className="font-mono text-[36px] sm:text-[40px] font-bold tracking-tighter leading-none"
          style={{ color: accentColor }}
        >
          {value}
        </div>

        {/* Label row */}
        <div className="mt-2.5 mb-1">
          <span className="text-xs font-bold text-text-tertiary uppercase tracking-[0.12em]">
            {label}
          </span>
          {subtitle && (
            <span
              className="ml-2 text-xs font-mono font-semibold"
              style={{ color: `${accentColor}88` }}
            >
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {/* Sparkline — full width, flush bottom */}
      {sparkline && sparkline.length > 0 && (
        <div className="px-3 pb-2 mt-auto">
          <MiniSparkline data={sparkline} color={accentColor} />
        </div>
      )}
    </motion.div>
  )
}
