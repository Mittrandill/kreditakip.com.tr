import { memo } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface OptimizedBarChartProps {
  data: Array<{
    name: string
    krediOdeme: number
    kartOdeme: number
    gelir: number
  }>
}

const OptimizedBarChart = memo(function OptimizedBarChart({ data }: OptimizedBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip 
          formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, '']}
          labelFormatter={(label) => `Ay: ${label}`}
        />
        <Legend />
        <Bar dataKey="gelir" fill="#10b981" name="Gelir" />
        <Bar dataKey="krediOdeme" fill="#ef4444" name="Kredi Ödeme" />
        <Bar dataKey="kartOdeme" fill="#f97316" name="Kart Ödeme" />
      </BarChart>
    </ResponsiveContainer>
  )
})

export default OptimizedBarChart