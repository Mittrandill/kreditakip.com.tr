"use client"

import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
} from "recharts"
import { formatCurrency, formatPercent } from "@/lib/format"

// Combo Chart (Bar + Line kombinasyonu)
interface ComboChartData {
  name: string
  barValue: number
  lineValue: number
  areaValue?: number
}

interface ComboChartProps {
  data: ComboChartData[]
  height?: number
  barColor?: string
  lineColor?: string
  areaColor?: string
  barLabel?: string
  lineLabel?: string
  areaLabel?: string
}

export function ComboChart({
  data,
  height = 400,
  barColor = "#10b981",
  lineColor = "#3b82f6",
  areaColor = "#8b5cf6",
  barLabel = "Bar Data",
  lineLabel = "Line Data",
  areaLabel = "Area Data"
}: ComboChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="font-semibold text-gray-900">
                {typeof entry.value === 'number' && entry.value > 1000
                  ? formatCurrency(entry.value)
                  : entry.value
                }
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="name" 
          stroke="#666"
          tick={{ fontSize: 12 }}
          tickLine={false}
        />
        <YAxis 
          stroke="#666"
          tick={{ fontSize: 12 }}
          tickLine={false}
          tickFormatter={(value) => {
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
            return value
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        
        {/* Area Chart (Background) */}
        {data.some(d => d.areaValue !== undefined) && (
          <Area
            type="monotone"
            dataKey="areaValue"
            fill={areaColor}
            fillOpacity={0.1}
            stroke="none"
            name={areaLabel}
          />
        )}
        
        {/* Bar Chart */}
        <Bar 
          dataKey="barValue" 
          fill={barColor}
          name={barLabel}
          radius={[4, 4, 0, 0]}
        />
        
        {/* Line Chart */}
        <Line
          type="monotone"
          dataKey="lineValue"
          stroke={lineColor}
          strokeWidth={3}
          dot={{ fill: lineColor, strokeWidth: 2, r: 6 }}
          activeDot={{ r: 8, stroke: lineColor, strokeWidth: 2, fill: "white" }}
          name={lineLabel}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

// Gauge Chart (Dairesel progress chart)
interface GaugeChartProps {
  value: number
  maxValue?: number
  title?: string
  color?: string
  size?: number
  thickness?: number
  showPercentage?: boolean
  thresholds?: { value: number; color: string; label: string }[]
}

export function GaugeChart({
  value,
  maxValue = 100,
  title,
  color = "#10b981",
  size = 200,
  thickness = 20,
  showPercentage = true,
  thresholds = []
}: GaugeChartProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  const angle = (percentage * 180) / 100 - 90 // -90 to 90 degrees
  
  // Determine color based on thresholds
  let currentColor = color
  if (thresholds.length > 0) {
    for (const threshold of thresholds.reverse()) {
      if (percentage >= threshold.value) {
        currentColor = threshold.color
        break
      }
    }
  }

  const gaugeData = [
    {
      name: 'Value',
      value: percentage,
      fill: currentColor
    },
    {
      name: 'Empty',
      value: 100 - percentage,
      fill: '#e5e7eb'
    }
  ]

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 40 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="90%"
            innerRadius="60%"
            outerRadius="90%"
            startAngle={180}
            endAngle={0}
            data={[{ value: percentage, fill: currentColor }]}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={10}
              fill={currentColor}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        
        {/* Center value display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
          <div className="text-3xl font-bold" style={{ color: currentColor }}>
            {showPercentage ? `${Math.round(percentage)}%` : formatCurrency(value)}
          </div>
          {title && (
            <div className="text-sm text-gray-600 mt-1">{title}</div>
          )}
        </div>
        
        {/* Needle indicator */}
        <div 
          className="absolute bottom-4 left-1/2 w-0.5 bg-gray-800 origin-bottom"
          style={{
            height: size * 0.35,
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transformOrigin: 'bottom center'
          }}
        />
        
        {/* Center dot */}
        <div 
          className="absolute bottom-4 left-1/2 w-3 h-3 bg-gray-800 rounded-full"
          style={{ transform: 'translateX(-50%) translateY(50%)' }}
        />
      </div>
      
      {/* Threshold indicators */}
      {thresholds.length > 0 && (
        <div className="flex gap-4 mt-4">
          {thresholds.map((threshold, index) => (
            <div key={index} className="flex items-center gap-1 text-xs">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: threshold.color }}
              />
              <span>{threshold.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Heatmap Chart
interface HeatmapData {
  day: string
  hour: number
  value: number
}

interface HeatmapProps {
  data: HeatmapData[]
  width?: number
  height?: number
}

export function Heatmap({ data, width = 800, height = 200 }: HeatmapProps) {
  const days = [...new Set(data.map(d => d.day))].sort()
  const hours = [...new Set(data.map(d => d.hour))].sort((a, b) => a - b)
  const maxValue = Math.max(...data.map(d => d.value))
  
  const cellWidth = width / hours.length
  const cellHeight = height / days.length

  const getColorIntensity = (value: number) => {
    const intensity = value / maxValue
    return `hsl(142, 71%, ${90 - intensity * 40}%)` // Green scale
  }

  const getCellData = (day: string, hour: number) => {
    return data.find(d => d.day === day && d.hour === hour)?.value || 0
  }

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height + 60} className="font-sans">
        {/* Y-axis labels (days) */}
        {days.map((day, dayIndex) => (
          <text
            key={day}
            x={0}
            y={dayIndex * cellHeight + cellHeight / 2 + 30}
            textAnchor="end"
            dominantBaseline="middle"
            className="text-xs fill-gray-600"
          >
            {day}
          </text>
        ))}
        
        {/* X-axis labels (hours) */}
        {hours.map((hour, hourIndex) => (
          <text
            key={hour}
            x={hourIndex * cellWidth + cellWidth / 2 + 40}
            y={20}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600"
          >
            {hour}:00
          </text>
        ))}
        
        {/* Heatmap cells */}
        {days.map((day, dayIndex) =>
          hours.map((hour, hourIndex) => {
            const value = getCellData(day, hour)
            return (
              <rect
                key={`${day}-${hour}`}
                x={hourIndex * cellWidth + 40}
                y={dayIndex * cellHeight + 30}
                width={cellWidth - 1}
                height={cellHeight - 1}
                fill={getColorIntensity(value)}
                stroke="#fff"
                strokeWidth={1}
                className="hover:stroke-gray-400 cursor-pointer"
              >
                <title>{`${day} ${hour}:00 - ${formatCurrency(value)}`}</title>
              </rect>
            )
          })
        )}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-center mt-4 gap-4">
        <span className="text-xs text-gray-600">Az</span>
        <div className="flex">
          {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, index) => (
            <div
              key={index}
              className="w-4 h-4"
              style={{ 
                backgroundColor: `hsl(142, 71%, ${90 - intensity * 40}%)`,
                border: '1px solid #fff'
              }}
            />
          ))}
        </div>
        <span className="text-xs text-gray-600">Çok</span>
      </div>
    </div>
  )
}

// Donut Chart with center content
interface DonutChartData {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutChartData[]
  centerContent?: React.ReactNode
  height?: number
  innerRadius?: number
  outerRadius?: number
}

export function DonutChart({
  data,
  centerContent,
  height = 300,
  innerRadius = 60,
  outerRadius = 100
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.color }}>
            {formatCurrency(data.value)}
          </p>
          <p className="text-sm text-gray-600">{percentage}% of total</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center content */}
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {centerContent}
        </div>
      )}
    </div>
  )
}

// Trend Sparkline (Mini chart for cards)
interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}

export function Sparkline({
  data,
  width = 100,
  height = 30,
  color = "#10b981",
  fill = false
}: SparklineProps) {
  if (data.length === 0) return null

  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - ((value - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className="overflow-visible">
      {fill && (
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill={color}
          fillOpacity={0.2}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point highlight */}
      {data.length > 0 && (
        <circle
          cx={(data.length - 1) / (data.length - 1) * width}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r={2}
          fill={color}
        />
      )}
    </svg>
  )
}