"use client"

import { useMemo } from "react"

interface LineChartData {
  name: string
  value: number
  date?: string
}

interface LineChartProps {
  data: LineChartData[]
  className?: string
  height?: number
  color?: string
}

export function LineChart({ data, className = "", height = 300, color = "#10b981" }: LineChartProps) {
  const { chartData, maxValue, minValue } = useMemo(() => {
    if (data.length === 0) return { chartData: [], maxValue: 0, minValue: 0 }
    
    const values = data.map(item => item.value)
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue || 1
    
    const chartData = data.map((item, index) => ({
      ...item,
      x: (index / Math.max(data.length - 1, 1)) * 100,
      y: 100 - ((item.value - minValue) / range) * 100
    }))

    return { chartData, maxValue, minValue }
  }, [data])

  const generatePath = () => {
    if (chartData.length === 0) return ""
    
    let path = `M ${chartData[0].x} ${chartData[0].y}`
    
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1]
      const curr = chartData[i]
      
      // Smooth curve using cubic bezier
      const cpx1 = prev.x + (curr.x - prev.x) / 3
      const cpy1 = prev.y
      const cpx2 = curr.x - (curr.x - prev.x) / 3
      const cpy2 = curr.y
      
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`
    }
    
    return path
  }

  const generateGradientPath = () => {
    if (chartData.length === 0) return ""
    
    let path = generatePath()
    path += ` L ${chartData[chartData.length - 1].x} 100 L ${chartData[0].x} 100 Z`
    
    return path
  }

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Veri Bulunamadı</div>
          <div className="text-gray-500 text-sm mt-1">Görüntülenecek veri bulunmuyor</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 ${className}`}>
      <div className="relative" style={{ height: height - 80 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0">
          <defs>
            <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
              <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Area under curve */}
          <path
            d={generateGradientPath()}
            fill={`url(#gradient-${color.replace('#', '')})`}
            className="transition-all duration-500"
          />
          
          {/* Main line */}
          <path
            d={generatePath()}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-500"
          />
          
          {/* Data points */}
          {chartData.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="3"
              fill={color}
              className="transition-all duration-300 hover:r-4 cursor-pointer"
            />
          ))}
        </svg>
        
        {/* Hover tooltips */}
        <div className="absolute inset-0 pointer-events-none">
          {chartData.map((point, index) => (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-auto"
              style={{
                left: `${point.x}%`,
                top: `${point.y}%`,
                marginTop: '-8px'
              }}
            >
              <div className="font-medium">{point.name}</div>
              <div>₺{point.value.toLocaleString('tr-TR')}</div>
              {point.date && <div className="text-gray-300">{point.date}</div>}
            </div>
          ))}
        </div>
      </div>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-4 px-1">
        {chartData.map((point, index) => (
          <div key={index} className="text-xs text-gray-500 text-center flex-1">
            {index % Math.ceil(chartData.length / 6) === 0 && (
              <div className="truncate">{point.name}</div>
            )}
          </div>
        ))}
      </div>
      
      {/* Y-axis info */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>Min: ₺{minValue.toLocaleString('tr-TR')}</span>
        <span>Max: ₺{maxValue.toLocaleString('tr-TR')}</span>
      </div>
    </div>
  )
}