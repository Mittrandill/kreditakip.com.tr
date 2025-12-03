"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { AreaChart, Area, LineChart, Line, ResponsiveContainer } from "@/lib/chart-loader"

interface MetricsCardsProps {
  totalCredits: number
  monthlyPayment: number
  averageInterestRate: number
  upcomingPaymentCount: number
}

export default function MetricsCards({
  totalCredits,
  monthlyPayment,
  averageInterestRate,
  upcomingPaymentCount
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Card 1: Aktif Kredi - Line Chart */}
      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">{totalCredits}</h3>
              <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">Aktif Kredi</p>
            </div>
            <select className="text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-1.5 sm:px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0">
              <option>Bu Hafta ▼</option>
              <option>Bu Ay</option>
              <option>Bu Yıl</option>
            </select>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { val: 3 }, { val: 4 }, { val: 3 }, { val: 5 }, { val: 4 }, { val: 6 }, { val: 5 }, { val: totalCredits }
              ]}>
                <defs>
                  <linearGradient id="cardGradient1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="#14B8A6" strokeWidth={2} fill="url(#cardGradient1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Aylık Ödeme - Bar Chart */}
      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">{formatCurrency(monthlyPayment)}</h3>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">Aylık Ödeme</p>
            </div>
            <select className="text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-1.5 sm:px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 flex-shrink-0">
              <option>Aylık ▼</option>
              <option>Yıllık</option>
            </select>
          </div>
          <div className="h-24 flex items-end gap-1">
            {[50, 60, 55, 70, 65, 80, 75, 90].map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Ortalama Faiz - Percentage Circle */}
      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                {averageInterestRate.toFixed(2)}%
              </h3>
              <p className="text-xs sm:text-sm text-orange-600 dark:text-orange-400">Ort. Faiz</p>
            </div>
            <select className="text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-1.5 sm:px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 flex-shrink-0">
              <option>Tümü ▼</option>
              <option>Aktif</option>
            </select>
          </div>
          <div className="h-24 flex items-center justify-center">
            <div className="relative w-20 h-20">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#F97316"
                  strokeWidth="8"
                  strokeDasharray={`${(averageInterestRate / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900 dark:text-white">{averageInterestRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Yaklaşan Ödeme - Line Chart */}
      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">{upcomingPaymentCount}</h3>
              <p className="text-xs sm:text-sm text-purple-600 dark:text-purple-400">Yaklaşan Ödeme</p>
            </div>
            <select className="text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-1.5 sm:px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500 flex-shrink-0">
              <option>7 Gün ▼</option>
              <option>30 Gün</option>
            </select>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[
                { val: 2 }, { val: 3 }, { val: 2 }, { val: 4 }, { val: 3 }, { val: 5 }, { val: 4 }, { val: upcomingPaymentCount }
              ]}>
                <Line type="monotone" dataKey="val" stroke="#A855F7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
