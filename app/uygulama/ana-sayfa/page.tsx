"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import BankLogo from "@/components/bank-logo"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getUpcomingPayments, getAllPayments } from "@/lib/api/payments"
import {
  Home,
  Settings,
  Bell,
  MoreHorizontal,
  ArrowUpRight,
  Target,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
  Lock,
  Percent,
  CreditCard,
  Wallet,
  Plus,
  ArrowRight,
  PieChart,
} from "lucide-react"
import { AdBanner } from "@/components/ad-banner"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "@/lib/chart-loader"

// Lazy load dashboard components for better performance
const MetricsCards = dynamic(() => import('@/components/dashboard/metrics-cards'), {
  loading: () => <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div><div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div><div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div><div className="h-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg"></div></div>
})

// Kredi verisi için genişletilmiş tip (ilişkili tablolarla)
interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url" | "contact_phone" | "contact_email" | "website"> | null
  credit_types: Pick<CreditType, "id" | "name"> | null
}

interface UpcomingPayment extends PaymentPlan {
  credits: {
    id: string
    credit_code: string
    user_id: string
    banks: {
      name: string
      logo_url: string | null
    } | null
  } | null
}

// Grafik verileri için varsayılanlar
const defaultLineChartData = [
  { month: "Oca", anaParaBorcu: 0, toplamOdenen: 0 },
  { month: "Şub", anaParaBorcu: 0, toplamOdenen: 0 },
  { month: "Mar", anaParaBorcu: 0, toplamOdenen: 0 },
  { month: "Nis", anaParaBorcu: 0, toplamOdenen: 0 },
  { month: "May", anaParaBorcu: 0, toplamOdenen: 0 },
  { month: "Haz", anaParaBorcu: 0, toplamOdenen: 0 },
]

const defaultBarChartData = [
  { name: "Oca", krediOdeme: 0, gelir: 0 },
  { name: "Şub", krediOdeme: 0, gelir: 0 },
  { name: "Mar", krediOdeme: 0, gelir: 0 },
  { name: "Nis", krediOdeme: 0, gelir: 0 },
  { name: "May", krediOdeme: 0, gelir: 0 },
  { name: "Haz", krediOdeme: 0, gelir: 0 },
]

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()

  const [credits, setCredits] = useState<any[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Metrik state'leri
  const [totalCredits, setTotalCredits] = useState(0)
  const [totalDebt, setTotalDebt] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0) // Ana para + faiz toplamı
  const [totalPaidDebt, setTotalPaidDebt] = useState(0)
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [averageInterestRate, setAverageInterestRate] = useState(0)
  const [upcomingPaymentCount, setUpcomingPaymentCount] = useState(0)
  const [thisMonthPayment, setThisMonthPayment] = useState(0)

  // Filter states
  const [paymentFilter, setPaymentFilter] = useState<'week' | 'month'>('week')
  const [monthlyPaymentPeriod, setMonthlyPaymentPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [trendPeriod, setTrendPeriod] = useState<'6months' | '12months'>('6months')
  const [upcomingPaymentsFilter, setUpcomingPaymentsFilter] = useState<'week' | 'month' | 'all'>('week')

  // Grafik state'leri
  const [monthlyTrendData, setMonthlyTrendData] = useState<Array<{month: string, odeme: number, hedef: number}>>([])

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (user && isMounted) {
        setLoadingData(true)
        setError(null)
        try {
          // Bildirimler artık GitHub Actions workflow ile otomatik oluşturuluyor
          // /api/notifications/auto-create endpoint'i kaldırıldı

          const [creditsData, upcomingPaymentsData, allPaymentsData] = await Promise.all([
            getCredits(user.id) as Promise<any[]>,
            getUpcomingPayments(user.id, 30) as Promise<any[]>,
            getAllPayments(user.id, 12, 3) as Promise<any[]>, // 12 ay geriye, 3 ay ileriye - trend için yeterli
          ])

          if (isMounted) {
            setCredits(creditsData || [])
            setUpcomingPayments(upcomingPaymentsData || [])

            // Kredi metrikleri
            const activeCredits = creditsData?.filter((c) => c.status === "active" || c.status === "overdue") || []
            setTotalCredits(activeCredits.length)

            // Aylık ödeme hesaplama: Son 6 ayın gerçek ödemelerinin ortalaması
            const now = new Date()
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

            // Son 6 aydaki ödenmiş ve yapılacak ödemeleri al
            const last6MonthsPayments = (allPaymentsData || []).filter((p: any) => {
              const paymentDate = new Date(p.due_date)
              return paymentDate >= sixMonthsAgo && paymentDate <= now
            })

            // Aylık bazda grupla
            const monthlyTotals: { [key: string]: number } = {}
            last6MonthsPayments.forEach((p: any) => {
              const paymentDate = new Date(p.due_date)
              const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`
              monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (p.total_payment || 0)
            })

            // Ortalama hesapla (en az 1 ay verisi varsa)
            const monthlyValues = Object.values(monthlyTotals)
            const averageMonthlyPayment = monthlyValues.length > 0
              ? monthlyValues.reduce((sum, val) => sum + val, 0) / monthlyValues.length
              : activeCredits.reduce((sum, c) => sum + c.monthly_payment, 0) // Fallback: mevcut monthly_payment toplamı

            setMonthlyPayment(averageMonthlyPayment)

            // Toplam geri ödeme tutarı ve kalan borç hesaplama (TÜM krediler dahil)
            const allCredits = creditsData || []
            const currentTotalAmount = allCredits.reduce((sum, c) => {
              const totalPayback = (c.monthly_payment || 0) * (c.total_installments || 0)
              return sum + totalPayback
            }, 0)
            setTotalAmount(currentTotalAmount)

            const currentTotalDebt = allCredits.reduce((sum, c) => sum + (c.remaining_debt || 0), 0)
            setTotalDebt(currentTotalDebt)

            // Ödenen borç hesaplama (toplam geri ödeme - kalan borç)
            const paidDebt = currentTotalAmount - currentTotalDebt
            setTotalPaidDebt(paidDebt)

            if (activeCredits.length > 0 && currentTotalDebt > 0) {
              const weightedInterestSum = activeCredits.reduce((sum, c) => sum + c.interest_rate * c.remaining_debt, 0)
              setAverageInterestRate(weightedInterestSum / currentTotalDebt)
            } else {
              setAverageInterestRate(0)
            }

            setUpcomingPaymentCount(upcomingPaymentsData?.length || 0)

            // Bu ayki toplam ödeme hesaplama
            const currentMonth = now.getMonth()
            const currentYear = now.getFullYear()
            const thisMonthPayments = upcomingPaymentsData?.filter((p) => {
              const paymentDate = new Date(p.due_date)
              return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
            }) || []
            const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.total_payment, 0)
            setThisMonthPayment(thisMonthTotal)

            // Aylık Ödeme Trendi Hesaplama - Gerçek verilerden
            const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
            const currentDate = new Date()
            const monthsToShow = trendPeriod === '6months' ? 6 : 12

            const monthlyData = Array.from({ length: monthsToShow }, (_, i) => {
              const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - (monthsToShow - 1 - i), 1)
              const monthIndex = targetDate.getMonth()
              const year = targetDate.getFullYear()

              // O ay içindeki ödemeler
              const monthPayments = (allPaymentsData || []).filter((p: any) => {
                const paymentDate = new Date(p.due_date)
                return paymentDate.getMonth() === monthIndex && paymentDate.getFullYear() === year
              })

              // O ay için toplam ödeme
              const monthTotal = monthPayments.reduce((sum: number, p: any) => sum + (p.total_payment || 0), 0)

              // Hedef hesaplama: O ay içinde aktif olan kredilerin aylık ödemelerinin toplamı
              // Bir kredi o ay içinde ödeme tarihi varsa, o kredi o ay aktifti
              const activeCreditsInMonth = monthPayments
                .filter((p: any) => p.status === "pending" || p.status === "paid" || p.status === "overdue")
                .map((p: any) => p.credits?.id)
                .filter((id: string, index: number, self: string[]) => self.indexOf(id) === index) // Unique credit IDs

              // Bu kredilerin aylık ödemelerini topla
              const monthTarget = activeCreditsInMonth.reduce((sum: number, creditId: string) => {
                const credit = allCredits.find((c) => c.id === creditId)
                return sum + (credit?.monthly_payment || 0)
              }, 0)

              return {
                month: monthNames[monthIndex],
                odeme: monthTotal,
                hedef: monthTarget // O ay için aktif kredilerin toplam aylık ödemesi
              }
            })

            setMonthlyTrendData(monthlyData)
          }
        } catch (err) {
          console.error("Dashboard data fetch error:", err)
          if (isMounted) {
            setError("Veriler yüklenirken bir hata oluştu.")
          }
        } finally {
          if (isMounted) {
            setLoadingData(false)
          }
        }
      } else if (!authLoading && !user && isMounted) {
        setLoadingData(false)
        setError("Lütfen giriş yapınız.")
      }
    }
    fetchData()

    return () => {
      isMounted = false
    }
  }, [user, authLoading, trendPeriod])

  // Removed chart-related helper functions (getBankColor, getColorForCreditType)

  // Removed chartOptions

  const displayName = profile?.first_name || user?.email?.split("@")[0] || "Kullanıcı"

  // Kredi performansı hesaplama
  const creditPerformancePercentage =
    credits.filter((c) => c.status === "active").length > 0
      ? Math.round(
          credits.filter((c) => c.status === "active").reduce((sum, c) => sum + (c.payment_progress || 0), 0) /
            credits.filter((c) => c.status === "active").length,
        )
      : 0

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <AdBanner position="top" />

      {/* Hero Card -  */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-800 text-white border-0 shadow-2xl overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div className="flex-1">
                <p className="text-white/80 text-sm sm:text-base mb-2">Bugünkü Toplam Borç</p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 truncate">
                  {formatCurrency(totalDebt)}
                </h2>
              </div>
              <div className="flex items-end gap-3">
                <svg width="87" height="58" viewBox="0 0 87 58" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-80">
                  <path d="M18.4571 37.6458C11.9375 44.6715 4.81049 52.3964 2 55.7162H68.8125C77.6491 55.7162 84.8125 48.5528 84.8125 39.7162V2L61.531 31.9333C56.8486 37.9536 48.5677 39.832 41.746 36.4211L37.3481 34.2222C30.9901 31.0432 23.2924 32.4352 18.4571 37.6458Z" fill="url(#paint0_linear)"/>
                  <path d="M2 55.7162C4.81049 52.3964 11.9375 44.6715 18.4571 37.6458C23.2924 32.4352 30.9901 31.0432 37.3481 34.2222L41.746 36.4211C48.5677 39.832 56.8486 37.9536 61.531 31.9333L84.8125 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="paint0_linear" x1="43.4062" y1="8.71453" x2="46.7635" y2="55.7162" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" offset="0"/>
                      <stop offset="1" stopColor="white" stopOpacity="0"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div>
                  <p className="text-yellow-300 text-xl font-semibold">
                    {totalAmount > 0 ? `${Math.round((totalPaidDebt / totalAmount) * 100)}%` : "0%"}
                  </p>
                  <span className="text-white/70 text-xs">ödendi</span>
                </div>
              </div>
            </div>
            <div className="mb-4">
              <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-yellow-300 to-yellow-400 h-4 rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
                  style={{ width: `${totalAmount > 0 ? (totalPaidDebt / totalAmount) * 100 : 0}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4 leading-relaxed">
              Kredilerinizi takip edin, ödemelerinizi planlayın ve finansal geleceğinizi kontrol altında tutun.
              {totalCredits > 0 && ` ${totalCredits} aktif krediniz bulunuyor.`}
            </p>
            <Link href="/uygulama/krediler" className="text-white text-sm font-medium inline-flex items-center hover:gap-3 gap-2 transition-all">
              Detayları Görüntüle
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>

        {/* 4 Metric Cards - Now Lazy Loaded */}
        <MetricsCards
          totalCredits={totalCredits}
          monthlyPayment={monthlyPayment}
          averageInterestRate={averageInterestRate}
          upcomingPaymentCount={upcomingPaymentCount}
        />
        {/* OLD CODE KEPT FOR REFERENCE - Can be removed after testing
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Card 2: Bu Ayki Ödeme - Bar Chart */}
          <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">+{Math.round((totalPaidDebt / totalAmount) * 100) || 0}%</h3>
                  <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">İlerleme</p>
                </div>
                <select className="text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-1.5 sm:px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0">
                  <option>Günlük ▼</option>
                  <option>Haftalık</option>
                  <option>Aylık</option>
                </select>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[40, 65, 45, 80, 55, 70, 50, 85, 60, 75, 65, 90].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-500 rounded-sm"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Kalan Ödemeler - Donut Chart */}
          <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                    {formatCurrency((() => {
                      const now = new Date()
                      const filtered = upcomingPayments.filter(p => {
                        const paymentDate = new Date(p.due_date)
                        if (paymentFilter === 'week') {
                          const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                          return paymentDate >= now && paymentDate <= weekLater
                        } else {
                          const monthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
                          return paymentDate >= now && paymentDate <= monthLater
                        }
                      })
                      return filtered.reduce((sum, p) => sum + p.total_payment, 0)
                    })())}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">Kalan Ödeme</p>
                </div>
                <select
                  className="text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-1.5 sm:px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0"
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as 'week' | 'month')}
                >
                  <option value="week">Bu Hafta ▼</option>
                  <option value="month">Bu Ay</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24 h-24">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    {(() => {
                      const now = new Date()
                      const filtered = upcomingPayments.filter(p => {
                        const paymentDate = new Date(p.due_date)
                        if (paymentFilter === 'week') {
                          const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                          return paymentDate >= now && paymentDate <= weekLater
                        } else {
                          const monthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
                          return paymentDate >= now && paymentDate <= monthLater
                        }
                      })

                      // Banka bazında grupla
                      const bankPayments = filtered.reduce((acc, p) => {
                        const bankName = p.credits?.banks?.name || 'Diğer'
                        acc[bankName] = (acc[bankName] || 0) + p.total_payment
                        return acc
                      }, {} as Record<string, number>)

                      const entries = Object.entries(bankPayments).slice(0, 4)
                      const total = entries.reduce((sum, [, amount]) => sum + (amount as number), 0) || 1
                      const colors = ['#10B981', '#14B8A6', '#06B6D4', '#3B82F6']
                      let currentOffset = 0

                      return (
                        <>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-800" />
                          {entries.map(([bank, amount], index) => {
                            const percentage = (amount as number) / total
                            const dashLength = percentage * 251
                            const circle = (
                              <circle
                                key={bank}
                                cx="50"
                                cy="50"
                                r="40"
                                fill="none"
                                stroke={colors[index]}
                                strokeWidth="12"
                                strokeDasharray={`${dashLength} 251`}
                                strokeDashoffset={currentOffset}
                                strokeLinecap="round"
                              />
                            )
                            currentOffset -= dashLength
                            return circle
                          })}
                        </>
                      )
                    })()}
                  </svg>
                </div>
                <div className="flex-1 space-y-2">
                  {(() => {
                    const now = new Date()
                    const filtered = upcomingPayments.filter(p => {
                      const paymentDate = new Date(p.due_date)
                      if (paymentFilter === 'week') {
                        const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                        return paymentDate >= now && paymentDate <= weekLater
                      } else {
                        const monthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
                        return paymentDate >= now && paymentDate <= monthLater
                      }
                    })

                    const bankPayments = filtered.reduce((acc, p) => {
                      const bankName = p.credits?.banks?.name || 'Diğer'
                      acc[bankName] = (acc[bankName] || 0) + p.total_payment
                      return acc
                    }, {} as Record<string, number>)

                    const colors = ['#10B981', '#14B8A6', '#06B6D4', '#3B82F6']

                    return Object.entries(bankPayments).slice(0, 4).map(([bank, amount], index) => (
                      <div key={bank} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colors[index] }} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{bank}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(amount as number)}
                        </span>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Toplam Ödenen - Multi Line Chart */}
          <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                    {formatCurrency(monthlyPaymentPeriod === 'monthly' ? monthlyPayment : monthlyPayment * 12)}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                    {monthlyPaymentPeriod === 'monthly' ? 'Aylık Ort. Ödeme' : 'Yıllık Ort. Ödeme'}
                  </p>
                </div>
                <select
                  className="text-[10px] sm:text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded px-1.5 sm:px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0"
                  value={monthlyPaymentPeriod}
                  onChange={(e) => setMonthlyPaymentPeriod(e.target.value as 'monthly' | 'yearly')}
                >
                  <option value="monthly">Aylık ▼</option>
                  <option value="yearly">Yıllık</option>
                </select>
              </div>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={
                    monthlyPaymentPeriod === 'monthly'
                      ? [
                          { a: monthlyPayment * 0.95, b: monthlyPayment * 0.85, c: monthlyPayment * 0.90 },
                          { a: monthlyPayment * 0.98, b: monthlyPayment * 0.88, c: monthlyPayment * 0.93 },
                          { a: monthlyPayment * 0.92, b: monthlyPayment * 0.95, c: monthlyPayment * 0.88 },
                          { a: monthlyPayment, b: monthlyPayment * 0.90, c: monthlyPayment * 0.97 },
                          { a: monthlyPayment * 0.97, b: monthlyPayment * 0.93, c: monthlyPayment * 0.95 },
                          { a: monthlyPayment * 1.02, b: monthlyPayment * 0.96, c: monthlyPayment }
                        ]
                      : [
                          { a: monthlyPayment * 12 * 0.95, b: monthlyPayment * 12 * 0.85, c: monthlyPayment * 12 * 0.90 },
                          { a: monthlyPayment * 12 * 0.98, b: monthlyPayment * 12 * 0.88, c: monthlyPayment * 12 * 0.93 },
                          { a: monthlyPayment * 12 * 0.92, b: monthlyPayment * 12 * 0.95, c: monthlyPayment * 12 * 0.88 },
                          { a: monthlyPayment * 12, b: monthlyPayment * 12 * 0.90, c: monthlyPayment * 12 * 0.97 },
                          { a: monthlyPayment * 12 * 0.97, b: monthlyPayment * 12 * 0.93, c: monthlyPayment * 12 * 0.95 },
                          { a: monthlyPayment * 12 * 1.02, b: monthlyPayment * 12 * 0.96, c: monthlyPayment * 12 }
                        ]
                  }>
                    <Line type="monotone" dataKey="a" stroke="#14B8A6" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="b" stroke="#F59E0B" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="c" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        */}
      </div>

      {/* Monthly Payment Trend Chart - Karciz Style */}
      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
        <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white truncate">Aylık Ödeme Trendi</CardTitle>
              <CardDescription className="text-xs sm:text-sm mt-1 text-gray-600 dark:text-gray-400 truncate">
                Son {trendPeriod === '6months' ? '6' : '12'} ayın ödeme durumu
              </CardDescription>
            </div>
            <select
              className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-2 sm:px-3 py-1.5 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0"
              value={trendPeriod}
              onChange={(e) => setTrendPeriod(e.target.value as '6months' | '12months')}
            >
              <option value="6months">6 Ay</option>
              <option value="12months">12 Ay</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrendData.length > 0 ? monthlyTrendData : [{ month: "Veri Yok", odeme: 0, hedef: 0 }]}>
              <defs>
                <linearGradient id="colorOdeme" x1="0" y1="0" x2="0" y2="1">
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
                formatter={(value: any) => formatCurrency(value)}
              />
              <Area type="monotone" dataKey="odeme" stroke="#14B8A6" strokeWidth={2} fillOpacity={1} fill="url(#colorOdeme)" />
              <Line type="monotone" dataKey="hedef" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Latest Payments & Quick Stats -  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden lg:col-span-2">
          <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white truncate">Yaklaşan Ödemeler</CardTitle>
              <select
                className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-2 sm:px-3 py-1.5 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0"
                value={upcomingPaymentsFilter}
                onChange={(e) => setUpcomingPaymentsFilter(e.target.value as 'week' | 'month' | 'all')}
              >
                <option value="week">Bu Hafta</option>
                <option value="month">Bu Ay</option>
                <option value="all">Tümü</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {(() => {
                const now = new Date()
                const filtered = upcomingPayments.filter(payment => {
                  const paymentDate = new Date(payment.due_date)

                  if (upcomingPaymentsFilter === 'week') {
                    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
                    return paymentDate >= now && paymentDate <= weekLater
                  } else if (upcomingPaymentsFilter === 'month') {
                    const monthLater = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
                    return paymentDate >= now && paymentDate <= monthLater
                  }
                  return true // 'all'
                })

                return filtered.slice(0, 5).map((payment, index) => {
                const paymentDate = new Date(payment.due_date)
                const today = new Date()
                const daysUntil = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                return (
                  <div key={payment.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <BankLogo
                      bankName={payment.credits?.banks?.name || "Banka"}
                      logoUrl={payment.credits?.banks?.logo_url || undefined}
                      size="sm"
                      className="ring-2 ring-emerald-500/30 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h6 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {payment.credits?.banks?.name || "Banka"}
                      </h6>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        <span className="truncate">{payment.credits?.credit_code || "N/A"}</span>
                        <span>•</span>
                        <span className="whitespace-nowrap">{daysUntil === 0 ? "Bugün" : daysUntil === 1 ? "Yarın" : `${daysUntil} gün`}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(payment.total_payment)}
                      </p>
                    </div>
                  </div>
                )
              })
            })()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-white truncate">Kredi Türü Dağılımı</CardTitle>
              <select className="text-xs sm:text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 px-2 sm:px-3 py-1.5 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 flex-shrink-0">
                <option>Tümü</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  {(() => {
                    // Kredi türlerine göre dağılım hesapla
                    const typeCount = credits.reduce((acc, c) => {
                      const type = c.credit_types?.name || "Diğer"
                      acc[type] = (acc[type] || 0) + 1
                      return acc
                    }, {} as Record<string, number>)

                    const types = Object.entries(typeCount)
                    const total = credits.length || 1
                    let currentAngle = 0

                    return (
                      <>
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="12"
                          className="text-gray-200 dark:text-gray-800"
                        />
                        {types.map(([type, count], index) => {
                          const percentage = (count as number) / total
                          const dashLength = percentage * 251.2
                          const color = ["text-emerald-500", "text-teal-500", "text-cyan-500", "text-blue-500"][index % 4]
                          const segment = (
                            <circle
                              key={type}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="12"
                              strokeDasharray={`${dashLength} 251.2`}
                              strokeDashoffset={-currentAngle * 251.2 / 100}
                              strokeLinecap="round"
                              className={`${color} transition-all duration-1000`}
                              transform="rotate(-90 50 50)"
                            />
                          )
                          currentAngle += percentage * 100
                          return segment
                        })}
                      </>
                    )
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{credits.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Kredi</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {Object.entries(
                credits.reduce((acc, c) => {
                  const type = c.credit_types?.name || "Diğer"
                  acc[type] = (acc[type] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              ).map(([type, count], index) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        index === 0 ? "bg-emerald-500" :
                        index === 1 ? "bg-teal-500" :
                        index === 2 ? "bg-cyan-500" : "bg-blue-500"
                      }`}
                    ></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{type}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{count as number}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Aktif Kredilerim</CardTitle>
              <CardDescription>Güncel kredi durumunuz ve ödeme bilgileri</CardDescription>
            </div>
            <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
              {credits.filter((c) => c.status === "active").length} aktif
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white dark:bg-black/20 border-b dark:border-white/10 hover:bg-white dark:hover:bg-black/20">
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Banka</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Tür</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Kalan Borç</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Aylık Ödeme</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Faiz Oranı</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">İlerleme</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
                  <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-white/70">
                    İşlemler
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits
                  .filter((c) => c.status === "active")
                  .slice(0, 5)
                  .map((kredi, index) => {
                    const progressPercentage = kredi.payment_progress || 0
                    return (
                      <TableRow
                        key={kredi.id}
                        className={`hover:bg-emerald-50 dark:hover:bg-white/10 transition-colors duration-150 ease-in-out ${
                          index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                        }`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <BankLogo
                              bankName={kredi.banks?.name || "Bilinmeyen Banka"}
                              logoUrl={kredi.banks?.logo_url || undefined}
                              size="sm"
                              className="ring-1 ring-emerald-200 dark:ring-emerald-900/30 bg-white dark:bg-black/10"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {kredi.banks?.name || "N/A"}
                              </span>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{kredi.credit_code}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-white/70">
                          {kredi.credit_types?.name || "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(kredi.remaining_debt)}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-white/70">
                          {formatCurrency(kredi.monthly_payment)}
                        </TableCell>
                        <TableCell className="font-medium text-orange-600 dark:text-orange-400">
                          {formatPercent(kredi.interest_rate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={kredi.payment_progress || 0} className="h-2 w-16" />
                            <span className="text-sm font-medium text-gray-600 dark:text-white/70">
                              {formatPercent(kredi.payment_progress || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800">
                            Aktif
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-teal-900/20 dark:text-white/70"
                            asChild
                          >
                            <Link href={`/uygulama/kredi-detay/${kredi.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
            {credits.filter((c) => c.status === "active").length === 0 && (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Aktif kredi bulunmamaktadır.</p>
                <Button variant="outline" asChild>
                  <Link href="/uygulama/krediler/kredi-ekle">
                    <Plus className="h-4 w-4 mr-2" />
                    İlk Kredinizi Ekleyin
                  </Link>
                </Button>
              </div>
            )}
            {credits.filter((c) => c.status === "active").length > 5 && (
              <div className="mt-6 text-center">
                <Button variant="outline" asChild>
                  <Link href="/uygulama/krediler">
                    Tüm Kredileri Gör ({credits.filter((c) => c.status === "active").length})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


  
    </div>
  )
}
