"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  { month: "Oca", success: 68 },
  { month: "Şub", success: 72 },
  { month: "Mar", success: 75 },
  { month: "Nis", success: 79 },
  { month: "May", success: 83 },
  { month: "Haz", success: 87 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-lg">
        <p className="label text-sm text-white/80">{`${label}`}</p>
        <p className="intro text-base font-bold text-white">{`%${payload[0].value} başarı`}</p>
        <div className="flex items-center gap-1 text-xs text-brand-green">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 7-7 7 7" />
            <path d="M12 19V5" />
          </svg>
          <span>Zamanında ödeme</span>
        </div>
      </div>
    )
  }

  return null
}

export function UserGrowthChart() {
  return (
    <div className="h-64 w-full">
      <h3 className="text-lg font-semibold text-white/90 mb-2">Kullananların Kredi Ödeme Başarısı</h3>
      <ResponsiveContainer width="100%" height={220} minHeight={220}>
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#50f1be" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#50f1be" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" stroke="#ffffff" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            stroke="#ffffff"
            opacity={0.5}
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `%${value}`}
            domain={[0, 100]}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.1} vertical={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#50f1be", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="success"
            stroke="#50f1be"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSuccess)"
            dot={((props: any) => {
              const { cx, cy, payload } = props
              if (payload.month === "Haz") {
                return <circle cx={cx} cy={cy} r={5} fill="#50f1be" stroke="white" strokeWidth={2} />
              }
              return null
            }) as any}
            activeDot={{ r: 6, fill: "#50f1be", stroke: "white" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
