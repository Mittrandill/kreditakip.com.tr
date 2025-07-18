"use client"

import { useMemo } from "react"

interface PieChartData {
  name: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieChartData[]
  className?: string
}

export function PieChart({ data, className = "" }: PieChartProps) {
  const { chartData, total } = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0)
    let cumulativePercentage = 0

    const chartData = data.map((item) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0
      const startAngle = cumulativePercentage * 3.6 // Convert to degrees
      const endAngle = (cumulativePercentage + percentage) * 3.6
      cumulativePercentage += percentage

      return {
        ...item,
        percentage,
        startAngle,
        endAngle,
      }
    })

    return { chartData, total }
  }, [data])

  const generatePath = (startAngle: number, endAngle: number, radius: number = 90, centerX: number = 100, centerY: number = 100) => {
    const start = (startAngle - 90) * (Math.PI / 180)
    const end = (endAngle - 90) * (Math.PI / 180)

    const x1 = centerX + radius * Math.cos(start)
    const y1 = centerY + radius * Math.sin(start)
    const x2 = centerX + radius * Math.cos(end)
    const y2 = centerY + radius * Math.sin(end)

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"

    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
  }

  if (data.length === 0 || total === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Veri Bulunamadı</div>
          <div className="text-gray-500 text-sm mt-1">Görüntülenecek veri bulunmuyor</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          {chartData.map((item, index) => (
            <path
              key={index}
              d={generatePath(item.startAngle, item.endAngle)}
              fill={item.color}
              className="transition-all duration-300 hover:opacity-80"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center bg-white rounded-full w-20 h-20 flex items-center justify-center border border-gray-200">
            <div>
              <div className="text-lg font-bold text-gray-900">{data.length}</div>
              <div className="text-xs text-gray-500">Toplam</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border border-gray-200"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-medium text-gray-900 group-hover:text-emerald-600 transition-colors">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">
                {item.percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                ₺{item.value.toLocaleString('tr-TR')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}