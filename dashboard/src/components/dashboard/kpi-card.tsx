'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

interface KPICardProps {
  value: string | number
  label: string
  subtitle?: string
  accentColor: string
  sparkline?: number[]
  delta?: number | null
  invertDelta?: boolean
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length || data.every(d => d === 0)) return null
  const max = Math.max(...data, 1)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 100
  const h = 24
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - 1 - ((v - min) / range) * (h - 2)
    return `${x},${y}`
  })
  const areaPoints = [`0,${h}`, ...points, `${w},${h}`]

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-6 mt-1" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sf-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(' ')} fill={`url(#sf-${color.replace('#', '')})`} />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function KPICard({ value, label, subtitle, accentColor, sparkline, delta, invertDelta }: KPICardProps) {
  const hasDelta = delta !== null && delta !== undefined && delta !== 0
  const isPositive = invertDelta ? (delta ?? 0) < 0 : (delta ?? 0) > 0
  const deltaColor = !hasDelta ? '#999' : isPositive ? '#10B981' : '#EF4444'

  return (
    <div className="px-4 py-3.5 min-w-0">
      {/* Label */}
      <div className="text-[11px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-1.5 truncate">
        {label}
      </div>

      {/* Value row */}
      <div className="flex items-baseline gap-1.5">
        <span
          className="font-mono text-[22px] font-bold tracking-tight leading-none"
          style={{ color: accentColor }}
        >
          {value}
        </span>
        {subtitle && (
          <span className="text-[11px] font-mono text-text-tertiary">
            {subtitle}
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparkline && sparkline.length > 0 && (
        <Sparkline data={sparkline} color={accentColor} />
      )}

      {/* Delta */}
      {hasDelta && delta != null && (
        <div className="flex items-center gap-0.5 mt-1" style={{ color: deltaColor }}>
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span className="text-[10px] font-mono font-medium">{Math.abs(delta)}% vs anterior</span>
        </div>
      )}
    </div>
  )
}
