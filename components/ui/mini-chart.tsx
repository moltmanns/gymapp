"use client"

import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

interface MiniChartProps {
  data: Array<{ value: number }>
  height?: number
  className?: string
  color?: "green" | "lime" | "orange" | "blue"
  showGradient?: boolean
}

const colorMap = {
  green: {
    stroke: "oklch(0.65 0.2 145)",
    fill: "oklch(0.65 0.2 145 / 0.2)",
  },
  lime: {
    stroke: "oklch(0.85 0.2 125)",
    fill: "oklch(0.85 0.2 125 / 0.2)",
  },
  orange: {
    stroke: "oklch(0.70 0.18 50)",
    fill: "oklch(0.70 0.18 50 / 0.2)",
  },
  blue: {
    stroke: "oklch(0.70 0.15 230)",
    fill: "oklch(0.70 0.15 230 / 0.2)",
  },
}

export function MiniChart({
  data,
  height = 40,
  className,
  color = "green",
  showGradient = true,
}: MiniChartProps) {
  const colors = colorMap[color]

  if (!data || data.length === 0) {
    return (
      <div
        className={cn("flex items-center justify-center text-xs text-muted-foreground", className)}
        style={{ height }}
      >
        No data
      </div>
    )
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <defs>
            <linearGradient id={`mini-gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.4} />
              <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors.stroke}
            strokeWidth={2}
            fill={showGradient ? `url(#mini-gradient-${color})` : colors.fill}
            isAnimationActive={true}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
