"use client"

import { useMemo } from "react"

interface BarChartData {
  name: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  className?: string
  height?: number
}

export function BarChart({ data, className = "", height = 300 }: BarChartProps) {
  const { chartData, maxValue } = useMemo(() => {
    const maxValue = Math.max(...data.map(item => item.value), 0)
    const chartData = data.map((item, index) => ({
      ...item,
      color: item.color || `hsl(${160 + index * 30}, 70%, 50%)`,
      height: maxValue > 0 ? (item.value / maxValue) * 100 : 0
    }))

    return { chartData, maxValue }
  }, [data])

  if (data.length === 0 || maxValue === 0) {
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
      <div className="flex items-end justify-between gap-2" style={{ height: height - 80 }}>
        {chartData.map((item, index) => (
          <div key={index} className="flex flex-col items-center flex-1 group">
            <div className="relative w-full flex flex-col justify-end" style={{ height: '100%' }}>
              <div
                className="w-full rounded-t-md transition-all duration-500 hover:opacity-80 relative group-hover:scale-105"
                style={{
                  height: `${item.height}%`,
                  backgroundColor: item.color,
                  minHeight: item.value > 0 ? '4px' : '0'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  ₺{item.value.toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs font-medium text-gray-700 truncate max-w-full">
                {item.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                ₺{item.value > 1000 ? `${(item.value / 1000).toFixed(0)}K` : item.value.toLocaleString('tr-TR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}