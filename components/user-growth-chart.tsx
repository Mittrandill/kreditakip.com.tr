"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts"

const data = [
  { name: "2019", users: 21000 },
  { name: "2020", users: 35000 },
  { name: "2021", users: 72000 },
  { name: "2022", users: 123046 },
  { name: "2023", users: 210000 },
  { name: "2024", users: 255000 },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-lg">
        <p className="label text-sm text-white/80">{`${label}`}</p>
        <p className="intro text-base font-bold text-white">{`${payload[0].value.toLocaleString()} kullanıcı`}</p>
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
          <span>+23.46%</span>
        </div>
      </div>
    )
  }

  return null
}

export function UserGrowthChart() {
  return (
    <div className="h-64 w-full">
      <h3 className="text-lg font-semibold text-white/90 mb-2">Yıllara Göre Kullanıcı Artışı</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#50f1be" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#50f1be" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#ffffff" opacity={0.5} fontSize={12} tickLine={false} axisLine={false} />
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff" opacity={0.1} vertical={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#50f1be", strokeWidth: 1, strokeDasharray: "3 3" }} />
          <Area
            type="monotone"
            dataKey="users"
            stroke="#50f1be"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUv)"
            dot={(props) => {
              const { cx, cy, payload } = props
              if (payload.name === "2022") {
                return <circle cx={cx} cy={cy} r={5} fill="#50f1be" stroke="white" strokeWidth={2} />
              }
              return null
            }}
            activeDot={{ r: 6, fill: "#50f1be", stroke: "white" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
