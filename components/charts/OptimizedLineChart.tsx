import { memo } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface OptimizedLineChartProps {
  data: Array<{
    month: string
    anaParaBorcu: number
    toplamOdenen: number 
    hesapBakiye: number
  }>
}

const OptimizedLineChart = memo(function OptimizedLineChart({ data }: OptimizedLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, '']}
          labelFormatter={(label) => `Ay: ${label}`}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="anaParaBorcu" 
          stroke="#ef4444" 
          name="Ana Para Borcu"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="toplamOdenen" 
          stroke="#10b981" 
          name="Toplam Ödenen"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
        <Line 
          type="monotone" 
          dataKey="hesapBakiye" 
          stroke="#3b82f6" 
          name="Hesap Bakiye"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
})

export default OptimizedLineChart