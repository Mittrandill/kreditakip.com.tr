"use client"

import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Users, PieChart as PieChartIcon } from "lucide-react"

interface AnalyticsChartsProps {
  revenueData: { month: string; revenue: number }[]
  userGrowthData: { month: string; users: number }[]
  planDistribution: { name: string; value: number; color: string }[]
}

// Theme palette — emerald/teal led, matching the admin dashboard accents.
const COLORS = {
  emerald: "#10b981",
  teal: "#2dd4bf",
  grid: "rgba(255,255,255,0.06)",
  axis: "rgba(255,255,255,0.35)",
}

function ChartCard({
  title,
  icon: Icon,
  iconClass,
  children,
}: {
  title: string
  icon: typeof TrendingUp
  iconClass: string
  children: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent p-5 lg:p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-white/90">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1210]/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      {label && <p className="mb-1 text-[11px] font-medium text-white/50">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm font-semibold tabular-nums" style={{ color: entry.color || entry.payload?.color || "#fff" }}>
          {formatter ? formatter(entry.value, entry.payload) : entry.value}
        </p>
      ))}
    </div>
  )
}

export function AnalyticsCharts({
  revenueData,
  userGrowthData,
  planDistribution,
}: AnalyticsChartsProps) {
  const totalPlanUsers = planDistribution.reduce((sum, p) => sum + p.value, 0)

  return (
    <div className="space-y-5">
      {/* Revenue Chart */}
      <ChartCard
        title="Gelir Trendi (Son 12 Ay)"
        icon={TrendingUp}
        iconClass="bg-emerald-500/15 text-emerald-400"
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLORS.emerald} stopOpacity={0.35} />
                <stop offset="100%" stopColor={COLORS.emerald} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke={COLORS.grid} vertical={false} />
            <XAxis
              dataKey="month"
              stroke={COLORS.axis}
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "11px" }}
              dy={8}
            />
            <YAxis
              stroke={COLORS.axis}
              tickLine={false}
              axisLine={false}
              style={{ fontSize: "11px" }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}b ₺` : `${v} ₺`)}
              width={56}
            />
            <Tooltip
              cursor={{ stroke: COLORS.emerald, strokeOpacity: 0.2, strokeWidth: 1 }}
              content={
                <ChartTooltip
                  formatter={(v: number) => `${v.toLocaleString("tr-TR")} ₺`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={COLORS.emerald}
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 5, fill: COLORS.emerald, stroke: "#0a0c0b", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User Growth Chart */}
        <ChartCard
          title="Kullanıcı Büyümesi"
          icon={Users}
          iconClass="bg-teal-500/15 text-teal-300"
        >
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={userGrowthData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.teal} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.teal} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke={COLORS.grid} vertical={false} />
              <XAxis
                dataKey="month"
                stroke={COLORS.axis}
                tickLine={false}
                axisLine={false}
                style={{ fontSize: "11px" }}
                dy={8}
              />
              <YAxis
                stroke={COLORS.axis}
                tickLine={false}
                axisLine={false}
                style={{ fontSize: "11px" }}
                width={40}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: COLORS.teal, strokeOpacity: 0.2, strokeWidth: 1 }}
                content={
                  <ChartTooltip formatter={(v: number) => `${v.toLocaleString("tr-TR")} kullanıcı`} />
                }
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke={COLORS.teal}
                strokeWidth={2.5}
                fill="url(#userGradient)"
                dot={false}
                activeDot={{ r: 5, fill: COLORS.teal, stroke: "#0a0c0b", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Plan Distribution Donut */}
        <ChartCard
          title="Plan Dağılımı"
          icon={PieChartIcon}
          iconClass="bg-purple-500/15 text-purple-300"
        >
          {totalPlanUsers === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-sm text-white/40">
              Henüz veri yok
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={82}
                      paddingAngle={3}
                      cornerRadius={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={
                        <ChartTooltip
                          formatter={(v: number, p: any) => `${p.name}: ${v} kullanıcı`}
                        />
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white tabular-nums">{totalPlanUsers}</span>
                  <span className="text-[11px] text-white/40">aktif üye</span>
                </div>
              </div>
              <div className="flex-1 space-y-2.5 w-full">
                {planDistribution.map((entry) => {
                  const pct = totalPlanUsers ? Math.round((entry.value / totalPlanUsers) * 100) : 0
                  return (
                    <div key={entry.name} className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                      <span className="text-sm text-white/70 flex-1">{entry.name}</span>
                      <span className="text-sm font-semibold text-white tabular-nums">{entry.value}</span>
                      <span className="text-xs text-white/40 tabular-nums w-9 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  )
}
