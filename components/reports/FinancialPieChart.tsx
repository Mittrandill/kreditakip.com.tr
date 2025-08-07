"use client"

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  Sector,
} from "recharts"
import { formatCurrency, formatPercent } from "@/lib/format"
import { useState } from "react"

interface ChartData {
  name: string
  value: number
  color?: string
}

interface FinancialPieChartProps {
  data: ChartData[]
  height?: number
  showPercentage?: boolean
}

const defaultColors = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#f59e0b", // amber
  "#ef4444", // red
  "#6b7280", // gray
]

export function FinancialPieChart({ 
  data, 
  height = 400,
  showPercentage = true 
}: FinancialPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const total = data.reduce((sum, item) => sum + item.value, 0)

  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180
    const {
      cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value
    } = props
    const sin = Math.sin(-RADIAN * midAngle)
    const cos = Math.cos(-RADIAN * midAngle)
    const sx = cx + (outerRadius + 15) * cos
    const sy = cy + (outerRadius + 15) * sin
    const mx = cx + (outerRadius + 35) * cos
    const my = cy + (outerRadius + 35) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 25
    const ey = my
    const textAnchor = cos >= 0 ? 'start' : 'end'

    return (
      <g>
        {/* Center percentage display */}
        <circle cx={cx} cy={cy} r={35} fill="white" stroke={fill} strokeWidth={3} opacity={0.9} />
        <text x={cx} y={cy-5} textAnchor="middle" className="text-2xl font-bold" fill={fill}>
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <text x={cx} y={cy+15} textAnchor="middle" className="text-xs font-medium" fill="#666">
          {payload.name}
        </text>
        
        {/* Main sector with glow effect */}
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          filter="url(#glow)"
        />
        
        {/* Outer ring for emphasis */}
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 8}
          outerRadius={outerRadius + 12}
          fill={fill}
          opacity={0.6}
        />
        
        {/* Callout line and label */}
        <path 
          d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} 
          stroke={fill} 
          strokeWidth={2}
          fill="none" 
          opacity={0.8}
        />
        <circle cx={ex} cy={ey} r={3} fill={fill} stroke="white" strokeWidth={2} />
        
        {/* External label box */}
        <rect 
          x={ex + (cos >= 0 ? 8 : -120)} 
          y={ey - 25} 
          width={cos >= 0 ? 110 : 110} 
          height={40} 
          fill="white" 
          stroke={fill} 
          strokeWidth={1}
          rx={8}
          opacity={0.95}
        />
        <text 
          x={ex + (cos >= 0 ? 15 : -113)} 
          y={ey - 8} 
          textAnchor={cos >= 0 ? 'start' : 'start'} 
          className="text-sm font-bold" 
          fill="#333"
        >
          {payload.name}
        </text>
        <text 
          x={ex + (cos >= 0 ? 15 : -113)} 
          y={ey + 8} 
          textAnchor={cos >= 0 ? 'start' : 'start'} 
          className="text-xs font-semibold" 
          fill={fill}
        >
          {formatCurrency(value)}
        </text>
      </g>
    )
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0]
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-2xl font-bold mt-1" style={{ color: data.payload.fill }}>
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {percentage}% of total
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, index }: any) => {
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const percentage = ((value / total) * 100).toFixed(0)

    if (parseFloat(percentage) < 5) return null // Don't show label for small slices

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-bold"
      >
        {`${percentage}%`}
      </text>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          activeIndex={activeIndex ?? undefined}
          activeShape={renderActiveShape}
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={showPercentage ? CustomLabel : false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color || defaultColors[index % defaultColors.length]}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          formatter={(value, entry: any) => (
            <span style={{ color: entry.color }}>
              {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}