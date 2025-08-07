"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Dot,
  ReferenceLine,
} from "recharts"
import { formatCurrency, formatPercent } from "@/lib/format"

interface ChartData {
  name: string
  value: number
  date?: string
  secondaryValue?: number
}

interface FinancialLineChartProps {
  data: ChartData[]
  height?: number
  color?: string
  secondaryColor?: string
  showGrid?: boolean
  isPercentage?: boolean
}

export function FinancialLineChart({ 
  data, 
  height = 400,
  color = "#10b981",
  secondaryColor = "#3b82f6",
  showGrid = true,
  isPercentage = false
}: FinancialLineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 backdrop-blur-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
            <p className="font-bold text-gray-900 text-lg">{label}</p>
          </div>
          <div className="space-y-3">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full shadow-md"
                    style={{ 
                      backgroundColor: entry.color,
                      boxShadow: `0 0 8px ${entry.color}40`
                    }}
                  />
                  <span className="text-gray-600 text-sm font-medium">
                    {entry.name}
                  </span>
                </div>
                <span className="font-bold text-lg" style={{ color: entry.color }}>
                  {isPercentage 
                    ? formatPercent(entry.value)
                    : formatCurrency(entry.value)
                  }
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  const CustomDot = (props: any) => {
    const { cx, cy, fill, payload } = props
    return (
      <g>
        <circle 
          cx={cx} 
          cy={cy} 
          r="8" 
          fill="white"
          stroke={fill}
          strokeWidth="3"
          className="drop-shadow-lg"
        />
        <circle 
          cx={cx} 
          cy={cy} 
          r="4" 
          fill={fill}
          className="animate-pulse"
        />
      </g>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart 
        data={data} 
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        {showGrid && (
          <CartesianGrid 
            strokeDasharray="2 4" 
            stroke="#f3f4f6"
            vertical={false}
            opacity={0.6}
          />
        )}
        
        <XAxis 
          dataKey="name" 
          stroke="#6b7280"
          tick={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb', strokeWidth: 2 }}
          height={50}
        />
        
        <YAxis 
          stroke="#6b7280"
          tick={{ fontSize: 12, fontWeight: 500, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={80}
          tickFormatter={(value) => {
            if (isPercentage) return `${value}%`
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
            return value
          }}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="secondaryLineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.6}/>
            <stop offset="95%" stopColor={secondaryColor} stopOpacity={0.1}/>
          </linearGradient>
          <filter id="lineShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.1)"/>
          </filter>
          <filter id="glowEffect">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={4}
          fill="url(#lineGradient)"
          dot={<CustomDot />}
          activeDot={{ 
            r: 10, 
            stroke: color, 
            strokeWidth: 3, 
            fill: "white",
            filter: "url(#glowEffect)"
          }}
          name="Ana Değer"
          filter="url(#lineShadow)"
        />
        
        {data.some(d => d.secondaryValue !== undefined) && (
          <Line
            type="monotone"
            dataKey="secondaryValue"
            stroke={secondaryColor}
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={{ fill: secondaryColor, r: 5, stroke: "white", strokeWidth: 2 }}
            activeDot={{ 
              r: 8, 
              stroke: secondaryColor, 
              strokeWidth: 3, 
              fill: "white",
              filter: "url(#glowEffect)"
            }}
            name="İkincil Değer"
            opacity={0.8}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}