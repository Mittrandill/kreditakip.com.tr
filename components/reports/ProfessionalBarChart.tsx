"use client"

import { useMemo } from "react"
import { formatCurrency } from "@/lib/format"

interface BarChartData {
  name: string
  value: number
  color?: string
  isFuture?: boolean
  isPast?: boolean
}

interface ProfessionalBarChartProps {
  data: BarChartData[]
  className?: string
  height?: number
}

export function ProfessionalBarChart({ data, className = "", height = 350 }: ProfessionalBarChartProps) {
  const { chartData, maxValue, scale } = useMemo(() => {
    if (data.length === 0) return { chartData: [], maxValue: 0, scale: [] }
    
    const values = data.map(item => item.value)
    const maxValue = Math.max(...values, 0)
    
    // Create scale with nice round numbers
    const roundedMax = Math.ceil(maxValue / 10000) * 10000
    const step = roundedMax / 5
    const scale = []
    for (let i = 0; i <= 5; i++) {
      scale.push(step * i)
    }
    
    const chartData = data.map((item, index) => ({
      ...item,
      height: maxValue > 0 ? (item.value / roundedMax) * 100 : 0,
      color: item.isFuture 
        ? "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" // Gray gradient for future
        : "linear-gradient(135deg, #10b981 0%, #059669 100%)" // Green gradient for past
    }))

    return { chartData, maxValue: roundedMax, scale: scale.reverse() }
  }, [data])

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
    <div className={`${className}`} style={{ height }}>
      <div className="h-full flex">
        {/* Y-axis */}
        <div className="flex flex-col justify-between pr-3 text-right">
          {scale.map((value, index) => (
            <div key={index} className="text-xs text-gray-500 font-medium">
              {value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
            </div>
          ))}
        </div>
        
        {/* Chart area */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {scale.map((_, index) => (
              <div
                key={index}
                className="absolute w-full border-t border-gray-200"
                style={{ top: `${(index / (scale.length - 1)) * 100}%` }}
              />
            ))}
          </div>
          
          {/* Bars */}
          <div className="relative h-full flex items-end justify-between gap-3 px-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative w-full flex flex-col justify-end h-full pb-8">
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 ease-out hover:brightness-110 cursor-pointer shadow-lg"
                    style={{
                      height: `${item.height}%`,
                      background: item.color,
                      minHeight: item.value > 0 ? '2px' : '0',
                      position: 'relative',
                      transform: 'translateY(0)',
                      animation: `slideUp ${0.5 + index * 0.1}s ease-out`
                    }}
                  >
                    {/* Value label on hover */}
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl whitespace-nowrap">
                        <div className="font-semibold">{formatCurrency(item.value)}</div>
                        {item.isFuture && (
                          <div className="text-yellow-300 text-xs mt-0.5">Tahmini</div>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-gray-900 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2"></div>
                    </div>
                    
                    {/* Pattern overlay for future bars */}
                    {item.isFuture && (
                      <div 
                        className="absolute inset-0 opacity-30 rounded-t-lg"
                        style={{
                          backgroundImage: `repeating-linear-gradient(
                            45deg,
                            transparent,
                            transparent 10px,
                            rgba(255, 255, 255, 0.1) 10px,
                            rgba(255, 255, 255, 0.1) 20px
                          )`
                        }}
                      />
                    )}
                  </div>
                </div>
                
                {/* X-axis labels */}
                <div className="absolute bottom-0 text-center w-full">
                  <div className="text-xs font-medium text-gray-700">
                    {item.name}
                  </div>
                  {item.isFuture && (
                    <div className="text-xs text-gray-500 mt-0.5">Tahmini</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Divider between past and future */}
          {chartData.findIndex(item => item.isFuture) > 0 && (
            <div 
              className="absolute top-0 bottom-8 w-0.5 bg-gray-400 opacity-50"
              style={{
                left: `${(chartData.findIndex(item => item.isFuture) / chartData.length) * 100}%`,
                marginLeft: '-1px'
              }}
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                Bugün
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}