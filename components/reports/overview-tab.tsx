"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, TrendingDown, Percent } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "@/lib/chart-loader"

const CHART_COLORS = ["#10B981", "#14B8A6", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"]

interface OverviewTabProps {
  filteredCredits: any[]
  bankDebtData: any[]
  uniqueBanks: string[]
  totalDebt: number
  typeData: any[]
  bankInterestData: any[]
  avgProgress: number
}

export default function OverviewTab({
  filteredCredits,
  bankDebtData,
  uniqueBanks,
  totalDebt,
  typeData,
  bankInterestData,
  avgProgress
}: OverviewTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Widget Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Widget 1: Bank Distribution */}
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {filteredCredits.filter(c => c.status === "active").length}
                </h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Aktif Kredi</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{uniqueBanks.length} bankadan</p>
              </div>
              <Building2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="h-20 flex items-end gap-1">
              {bankDebtData.slice(0, 8).map((bank, i) => {
                const maxDebt = Math.max(...bankDebtData.map(b => b.value))
                const height = (bank.value / maxDebt) * 100
                return (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-sm"
                    style={{ height: `${height}%` }}
                    title={`${bank.name}: ${formatCurrency(bank.value)}`}
                  />
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Widget 2: Total Debt */}
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(totalDebt)}</h3>
                <p className="text-sm text-red-600 dark:text-red-400">Toplam Borç</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kalan tutar</p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bankDebtData.slice(0, 6).map(b => ({ debt: b.value }))}>
                  <defs>
                    <linearGradient id="debtGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="debt" stroke="#EF4444" strokeWidth={2} fill="url(#debtGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Widget 3: Average Interest */}
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {bankInterestData.length > 0
                    ? `${(bankInterestData.reduce((sum, b) => sum + b.faiz, 0) / bankInterestData.length).toFixed(1)}%`
                    : "0%"
                  }
                </h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">Ort. Faiz</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tüm krediler</p>
              </div>
              <Percent className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="h-20 flex items-center justify-center">
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-700" />
                  {bankInterestData.length > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#F97316"
                      strokeWidth="12"
                      strokeDasharray={`${((bankInterestData.reduce((sum, b) => sum + b.faiz, 0) / bankInterestData.length) / 100) * 251.2} 251.2`}
                      strokeLinecap="round"
                    />
                  )}
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bank Debt Distribution - Donut Chart */}
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Banka Bazında Borç</CardTitle>
                <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">Toplam kalan borç dağılımı</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {/* Donut Chart */}
              <div className="w-40 h-40 relative">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-800" />
                  {(() => {
                    let offset = 0
                    const total = bankDebtData.reduce((sum, item) => sum + item.value, 0)
                    return bankDebtData.slice(0, 4).map((item, index) => {
                      const percentage = (item.value / total) * 100
                      const dashLength = (percentage / 100) * 251.2
                      const segment = (
                        <circle
                          key={item.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={CHART_COLORS[index]}
                          strokeWidth="12"
                          strokeDasharray={`${dashLength} 251.2`}
                          strokeDashoffset={-offset}
                          strokeLinecap="round"
                        />
                      )
                      offset += dashLength
                      return segment
                    })
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{bankDebtData.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Banka</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                {bankDebtData.slice(0, 4).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index] }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Credit Type Distribution - Donut Chart */}
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Kredi Türü Dağılımı</CardTitle>
                <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">Kredi sayısına göre</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {/* Donut Chart */}
              <div className="w-40 h-40 relative">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-800" />
                  {(() => {
                    let offset = 0
                    const total = typeData.reduce((sum, item) => sum + item.value, 0)
                    return typeData.map((item, index) => {
                      const percentage = (item.value / total) * 100
                      const dashLength = (percentage / 100) * 251.2
                      const segment = (
                        <circle
                          key={item.name}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={CHART_COLORS[index % CHART_COLORS.length]}
                          strokeWidth="12"
                          strokeDasharray={`${dashLength} 251.2`}
                          strokeDashoffset={-offset}
                          strokeLinecap="round"
                        />
                      )
                      offset += dashLength
                      return segment
                    })
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredCredits.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Kredi</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3">
                {typeData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Interest Rates - Bar Chart */}
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Ortalama Faiz Oranları</CardTitle>
                <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">Banka bazında karşılaştırma</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bankInterestData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" opacity={0.2} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: any) => [`${value}%`, 'Faiz']}
                />
                <Bar dataKey="faiz" fill="#14B8A6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Progress Trend - Area Chart */}
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900 dark:text-white">Ödeme İlerleme Trendi</CardTitle>
                <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">Ortalama ilerleme yüzdesi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart
                data={[
                  { month: "Haz", ilerleme: Math.max(0, avgProgress - 25) },
                  { month: "Tem", ilerleme: Math.max(0, avgProgress - 20) },
                  { month: "Ağu", ilerleme: Math.max(0, avgProgress - 15) },
                  { month: "Eyl", ilerleme: Math.max(0, avgProgress - 10) },
                  { month: "Eki", ilerleme: Math.max(0, avgProgress - 5) },
                  { month: "Kas", ilerleme: avgProgress },
                ]}
              >
                <defs>
                  <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" opacity={0.2} />
                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  formatter={(value: any) => [`${Math.round(value as number)}%`, 'İlerleme']}
                />
                <Area type="monotone" dataKey="ilerleme" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill="url(#colorProgress)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
