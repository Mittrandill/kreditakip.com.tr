"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts"
import { formatCurrency } from "@/lib/format"

interface ChartData {
  name: string
  value: number
  date?: string
  isFuture?: boolean
  isPast?: boolean
}

interface FinancialAreaChartProps {
  data: ChartData[]
  height?: number
  color?: string
  showFutureDivider?: boolean
}

export function FinancialAreaChart({ 
  data, 
  height = 400, 
  color = "#10b981",
  showFutureDivider = true 
}: FinancialAreaChartProps) {
  const pastData = data.filter(d => !d.isFuture)
  const futureData = data.filter(d => d.isFuture)
  const todayIndex = pastData.length > 0 ? pastData.length - 1 : 0

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      const isCurrentPoint = payload[0].stroke === color
      return (
        <div className="bg-white p-5 rounded-2xl shadow-2xl border border-gray-100 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div 
              className="w-4 h-4 rounded-full shadow-md"
              style={{ 
                backgroundColor: payload[0].stroke,
                boxShadow: `0 0 10px ${payload[0].stroke}40`
              }}
            />
            <p className="font-bold text-gray-900 text-lg">{label}</p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold" style={{ color: payload[0].stroke }}>
              {formatCurrency(payload[0].value)}
            </p>
            <div className="flex items-center gap-2">
              {data.isFuture ? (
                <div className="flex items-center gap-1 text-amber-600 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="font-medium">Tahmini Ödeme</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-emerald-600 text-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">Gerçekleşen</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart 
        data={data} 
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorPast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.9}/>
            <stop offset="50%" stopColor={color} stopOpacity={0.6}/>
            <stop offset="100%" stopColor={color} stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="colorFuture" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.7}/>
            <stop offset="50%" stopColor="#94a3b8" stopOpacity={0.4}/>
            <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.1}/>
          </linearGradient>
          <filter id="areaShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.1)"/>
          </filter>
          <filter id="glowEffect">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="2 4" 
          stroke="#f3f4f6" 
          vertical={false}
          opacity={0.6}
        />
        
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
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
            return value
          }}
        />
        
        <Tooltip content={<CustomTooltip />} />
        
        {showFutureDivider && pastData.length > 0 && futureData.length > 0 && (
          <ReferenceLine 
            x={pastData[pastData.length - 1].name} 
            stroke="#f59e0b"
            strokeDasharray="4 6"
            strokeWidth={2}
            opacity={0.8}
            label={{ 
              value: "Bugün", 
              position: "insideTopRight", 
              fill: "#f59e0b", 
              fontSize: 12,
              fontWeight: 700,
              offset: 10
            }}
          />
        )}
        
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorPast)"
          dot={{ fill: color, strokeWidth: 3, r: 5, stroke: 'white' }}
          activeDot={{ 
            r: 8, 
            fill: 'white',
            stroke: color,
            strokeWidth: 3,
            filter: "url(#glowEffect)"
          }}
          filter="url(#areaShadow)"
        />
        
        {futureData.length > 0 && (
          <Area
            type="monotone"
            dataKey="value"
            stroke="#94a3b8"
            strokeWidth={3}
            strokeDasharray="8 4"
            fillOpacity={1}
            fill="url(#colorFuture)"
            dot={{ fill: '#94a3b8', strokeWidth: 2, r: 4, stroke: 'white' }}
            activeDot={{ 
              r: 7, 
              fill: 'white',
              stroke: '#94a3b8',
              strokeWidth: 3
            }}
            opacity={0.8}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}