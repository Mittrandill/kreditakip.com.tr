"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
} from "recharts"
import { formatCurrency } from "@/lib/format"

interface ChartData {
  name: string
  value: number
  date?: string
  isFuture?: boolean
  isPast?: boolean
}

interface FinancialBarChartProps {
  data: ChartData[]
  height?: number
  pastColor?: string
  futureColor?: string
}

export function FinancialBarChart({ 
  data, 
  height = 400,
  pastColor = "#10b981",
  futureColor = "#94a3b8"
}: FinancialBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl">
          <p className="font-semibold">{label}</p>
          <p className="text-xl font-bold mt-1">
            {formatCurrency(payload[0].value)}
          </p>
          {data.isFuture && (
            <p className="text-yellow-400 text-sm mt-1">📊 Tahmini Ödeme</p>
          )}
        </div>
      )
    }
    return null
  }

  const CustomLabel = (props: any) => {
    const { x, y, width, value } = props
    if (value > 0) {
      return (
        <text 
          x={x + width / 2} 
          y={y - 10} 
          fill="#666" 
          textAnchor="middle" 
          fontSize={11}
          fontWeight="600"
        >
          {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
        </text>
      )
    }
    return null
  }

  const pastDataEndIndex = data.findIndex(d => d.isFuture) - 1
  const dividerPosition = pastDataEndIndex >= 0 ? data[pastDataEndIndex].name : null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={data} 
        margin={{ top: 30, right: 30, left: 20, bottom: 5 }}
      >
        <defs>
          <linearGradient id="pastGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={pastColor} stopOpacity={1}/>
            <stop offset="100%" stopColor={pastColor} stopOpacity={0.8}/>
          </linearGradient>
          <linearGradient id="futureGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={futureColor} stopOpacity={0.8}/>
            <stop offset="100%" stopColor={futureColor} stopOpacity={0.6}/>
          </linearGradient>
          <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="10" height="10">
            <path d="M0,10 l10,-10 M-2.5,2.5 l5,-5 M7.5,12.5 l5,-5" stroke="#fff" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="#e5e7eb" 
          vertical={false}
        />
        
        <XAxis 
          dataKey="name" 
          stroke="#666"
          tick={{ fontSize: 12, fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        
        <YAxis 
          stroke="#666"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
            return value
          }}
        />
        
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
        />
        
        {dividerPosition && (
          <ReferenceLine 
            x={dividerPosition} 
            stroke="#666"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{ 
              value: "Güncel", 
              position: "insideTopRight", 
              fill: "#666", 
              fontSize: 12,
              fontWeight: 600,
              offset: 10
            }}
          />
        )}
        
        <Bar 
          dataKey="value" 
          radius={[8, 8, 0, 0]}
          maxBarSize={60}
        >
          <LabelList content={<CustomLabel />} />
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.isFuture ? "url(#futureGradient)" : "url(#pastGradient)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}