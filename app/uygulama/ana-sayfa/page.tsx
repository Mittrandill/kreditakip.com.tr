"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BankLogo from "@/components/bank-logo"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getDashboardDataOptimized } from "@/lib/api/optimized-credits"
import { cacheManager } from "@/lib/utils/performance"
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
  Wallet,
} from "lucide-react"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

ChartJS.register(ArcElement, Tooltip, Legend)

// Kredi verisi için genişletilmiş tip (ilişkili tablolarla)
interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url"> | null
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
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const metrics = useMemo(() => {
    if (!dashboardData?.credits) {
      return {
        totalCredits: 0,
        totalDebt: 0,
        monthlyPayment: 0,
        averageInterestRate: 0,
        upcomingPaymentCount: 0,
        creditPerformancePercentage: 0,
      }
    }

    const activeCredits = dashboardData.credits.filter((c: any) => c.status === "active")
    const totalCredits = activeCredits.length
    const totalDebt = activeCredits.reduce((sum: number, c: any) => sum + c.remaining_debt, 0)
    const monthlyPayment = activeCredits.reduce((sum: number, c: any) => sum + c.monthly_payment, 0)

    let averageInterestRate = 0
    if (activeCredits.length > 0 && totalDebt > 0) {
      const weightedInterestSum = activeCredits.reduce(
        (sum: number, c: any) => sum + c.interest_rate * c.remaining_debt,
        0,
      )
      averageInterestRate = weightedInterestSum / totalDebt
    }

    const creditPerformancePercentage =
      activeCredits.length > 0
        ? Math.round(
            activeCredits.reduce((sum: number, c: any) => sum + (c.payment_progress || 0), 0) / activeCredits.length,
          )
        : 0

    return {
      totalCredits,
      totalDebt,
      monthlyPayment,
      averageInterestRate,
      upcomingPaymentCount: dashboardData.upcomingPayments?.length || 0,
      creditPerformancePercentage,
    }
  }, [dashboardData])

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) return

    setLoadingData(true)
    setError(null)

    try {
      // Try notification creation but don't block on failure
      fetch("/api/notifications/auto-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      }).catch((err) => console.error("Notification creation failed:", err))

      const data = await getDashboardDataOptimized(user.id)
      setDashboardData(data)
    } catch (err) {
      console.error("Dashboard data fetch error:", err)
      setError("Veriler yüklenirken bir hata oluştu.")
    } finally {
      setLoadingData(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (user && !authLoading) {
      fetchDashboardData()
    } else if (!authLoading && !user) {
      setLoadingData(false)
      setError("Lütfen giriş yapınız.")
    }
  }, [user, authLoading, fetchDashboardData])

  const chartData = useMemo(() => {
    if (!dashboardData?.credits) return { bankChartData: null, creditTypeChartData: null }

    const activeCredits = dashboardData.credits.filter((c: any) => c.status === "active")

    if (activeCredits.length === 0) {
      return { bankChartData: null, creditTypeChartData: null }
    }

    // Bank distribution
    const bankDistribution = activeCredits.reduce((acc: any, credit: any) => {
      const bankName = credit.banks?.name || "Diğer Bankalar"
      const existing = acc.find((item: any) => item.name === bankName)

      if (existing) {
        existing.value += credit.remaining_debt
      } else {
        acc.push({
          name: bankName,
          value: credit.remaining_debt,
          color: getBankColor(bankName),
          logoUrl: credit.banks?.logo_url,
        })
      }
      return acc
    }, [])

    const sortedBankData = bankDistribution.sort((a: any, b: any) => b.value - a.value).slice(0, 5)

    const bankChartData = {
      labels: sortedBankData.map((item: any) => item.name),
      datasets: [
        {
          data: sortedBankData.map((item: any) => item.value),
          backgroundColor: sortedBankData.map((item: any) => item.color),
          borderWidth: 2,
          borderColor: "#ffffff",
          cutout: "70%",
        },
      ],
    }

    // Credit type distribution
    const creditTypeDistribution = activeCredits.reduce((acc: any, credit: any) => {
      const typeName = credit.credit_types?.name || "Diğer Krediler"
      const existing = acc.find((item: any) => item.name === typeName)

      if (existing) {
        existing.value += credit.remaining_debt
      } else {
        acc.push({
          name: typeName,
          value: credit.remaining_debt,
          color: getColorForCreditType(typeName),
        })
      }
      return acc
    }, [])

    const sortedCreditTypeData = creditTypeDistribution.sort((a: any, b: any) => b.value - a.value).slice(0, 5)

    const creditTypeChartData = {
      labels: sortedCreditTypeData.map((item: any) => item.name),
      datasets: [
        {
          data: sortedCreditTypeData.map((item: any) => item.value),
          backgroundColor: sortedCreditTypeData.map((item: any) => item.color),
          borderWidth: 2,
          borderColor: "#ffffff",
          cutout: "70%",
        },
      ],
    }

    return { bankChartData, creditTypeChartData }
  }, [dashboardData])

  useEffect(() => {
    return () => {
      if (user?.id) {
        cacheManager.delete(`dashboard-${user.id}`)
      }
    }
  }, [user?.id])

  const getBankColor = (bankName: string): string => {
    const colorMap: { [key: string]: string } = {
      "Türkiye İş Bankası A.Ş.": "#1e40af",
      "Türkiye Garanti Bankası A.Ş.": "#059669",
      "Türkiye Vakıflar Bankası T.A.O.": "#dc2626",
      "Türkiye Halk Bankası A.Ş.": "#7c3aed",
      "Akbank T.A.Ş.": "#ea580c",
      "Yapı ve Kredi Bankası A.Ş.": "#0891b2",
      "Türk Ekonomi Bankası A.Ş.": "#f59e0b",
      "Enpara Bank A.S.": "#10b981",
      "Fibabanka A.S.": "#8b5cf6",
      "Diğer Bankalar": "#6b7280",
    }
    return colorMap[bankName] || "#6b7280"
  }

  const getColorForCreditType = (typeName: string): string => {
    const colorMap: { [key: string]: string } = {
      "İhtiyaç Kredisi": "#3b82f6",
      "Konut Kredisi": "#10b981",
      "Taşıt Kredisi": "#f59e0b",
      "Ticari Kredi": "#8b5cf6",
      "Ticari Finansman": "#06b6d4",
      "İşletme Kredisi": "#ef4444",
      "Taksitli Nakit Avans": "#84cc16",
      "Kredi Kartı": "#ef4444",
      "Diğer Krediler": "#6b7280",
      Diğer: "#94a3b8",
    }
    return colorMap[typeName] || "#6b7280"
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            family: "Inter, sans-serif",
          },
          color: (context: any) => (document.documentElement.classList.contains("dark") ? "#e5e7eb" : "#374151"),
          generateLabels: (chart: any) => {
            const data = chart.data
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const value = data.datasets[0].data[i]
                const total = data.datasets[0].data.reduce((sum: number, val: number) => sum + val, 0)
                const percentage = ((value / total) * 100).toFixed(1)
                return {
                  text: `${label} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].backgroundColor[i],
                  lineWidth: 0,
                  pointStyle: "circle",
                  hidden: false,
                  index: i,
                }
              })
            }
            return []
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.parsed
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`
          },
        },
        backgroundColor: (context: any) =>
          document.documentElement.classList.contains("dark") ? "rgba(17, 24, 39, 0.95)" : "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: (context: any) =>
          document.documentElement.classList.contains("dark") ? "rgba(75, 85, 99, 0.3)" : "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
  }

  const displayName = profile?.first_name || user?.email?.split("@")[0] || "Kullanıcı"

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 dark:from-black/50 to-transparent"></div>
        <div className="absolute inset-0 opacity-20 dark:opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.15'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 dark:bg-white/15 rounded-2xl backdrop-blur-sm border border-white/30 dark:border-white/20">
                  <Home className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 text-white drop-shadow-lg">Kredi Takip Merkezi</h1>
                  <p className="text-emerald-100 dark:text-emerald-50 text-xl drop-shadow-md">
                    Hoş geldiniz, {displayName}! Finansal durumunuzu takip edin
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/15 dark:bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 dark:border-white/15 hover:bg-white/20 dark:hover:bg-white/15 transition-all duration-200">
                  <div className="text-3xl font-bold mb-1 text-white drop-shadow-md">{metrics.totalCredits}</div>
                  <div className="text-sm text-emerald-100 dark:text-emerald-50">Toplam Kredi</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-emerald-200 dark:text-emerald-100" />
                    <span className="text-xs text-emerald-200 dark:text-emerald-100">{metrics.totalCredits} aktif</span>
                  </div>
                </div>
                <div className="bg-white/15 dark:bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 dark:border-white/15 hover:bg-white/20 dark:hover:bg-white/15 transition-all duration-200">
                  <div className="text-3xl font-bold mb-1 text-white drop-shadow-md">
                    {formatCurrency(metrics.totalDebt)}
                  </div>
                  <div className="text-sm text-emerald-100 dark:text-emerald-50">Toplam Borç</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-red-300 dark:text-red-200" />
                    <span className="text-xs text-emerald-200 dark:text-emerald-100">Kalan borç</span>
                  </div>
                </div>
                <div className="bg-white/15 dark:bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 dark:border-white/15 hover:bg-white/20 dark:hover:bg-white/15 transition-all duration-200">
                  <div className="text-3xl font-bold mb-1 text-white drop-shadow-md">
                    {formatPercent(metrics.creditPerformancePercentage / 100)}
                  </div>
                  <div className="text-sm text-emerald-100 dark:text-emerald-50">Performans</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Target className="h-3 w-3 text-emerald-200 dark:text-emerald-100" />
                    <span className="text-xs text-emerald-200 dark:text-emerald-100">Ödeme başarısı</span>
                  </div>
                </div>
                <div className="bg-white/15 dark:bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 dark:border-white/15 hover:bg-white/20 dark:hover:bg-white/15 transition-all duration-200">
                  <div className="text-3xl font-bold mb-1 text-white drop-shadow-md">
                    {metrics.upcomingPaymentCount}
                  </div>
                  <div className="text-sm text-emerald-100 dark:text-emerald-50">Yaklaşan</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-yellow-300 dark:text-yellow-200" />
                    <span className="text-xs text-emerald-200 dark:text-emerald-100">7 gün içinde</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/20 dark:bg-white/15 text-white border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/25 backdrop-blur-sm transition-all duration-200"
                asChild
              >
                <Link href="/uygulama/ayarlar">
                  <Settings className="h-5 w-5 mr-2" />
                  Ayarlar
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white/20 dark:bg-white/15 text-white border-white/30 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/25 backdrop-blur-sm transition-all duration-200"
                asChild
              >
                <Link href="/uygulama/bildirimler">
                  <Bell className="h-5 w-5 mr-2" />
                  Bildirimler
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 dark:from-emerald-600 dark:via-teal-700 dark:to-cyan-800 text-white shadow-2xl dark:shadow-emerald-900/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-white/20 dark:bg-white/15 rounded-2xl backdrop-blur-sm">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <Badge className="bg-white/20 dark:bg-white/15 text-white border-white/30 dark:border-white/20 backdrop-blur-sm px-3 py-1">
                {metrics.creditPerformancePercentage > 70 ? "Pozitif" : "Gelişim"}
              </Badge>
            </div>
            <h3 className="font-bold text-2xl mb-3 drop-shadow-md">Ödeme Performansı</h3>
            <p className="text-4xl font-black mb-4 drop-shadow-lg">
              {formatPercent(metrics.creditPerformancePercentage / 100)}
            </p>
            <p className="text-sm text-emerald-100 dark:text-emerald-50 leading-relaxed">
              Aktif kredilerinizde <span className="font-semibold text-white">{metrics.totalCredits}</span> kredi takip
              ediliyor
            </p>
            <div className="mt-6 w-full h-2 bg-white/20 dark:bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-2 bg-white dark:bg-white/90 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${metrics.creditPerformancePercentage}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 dark:from-blue-600 dark:via-indigo-700 dark:to-purple-800 text-white shadow-2xl dark:shadow-blue-900/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-white/20 dark:bg-white/15 rounded-2xl backdrop-blur-sm">
                <DollarSign className="h-8 w-8 text-white" />
              </div>
              <Badge className="bg-white/20 dark:bg-white/15 text-white border-white/30 dark:border-white/20 backdrop-blur-sm px-3 py-1">
                {metrics.averageInterestRate > 15 ? "Yüksek" : "Stabil"}
              </Badge>
            </div>
            <h3 className="font-bold text-2xl mb-3 drop-shadow-md">Ortalama Faiz</h3>
            <p className="text-4xl font-black mb-4 drop-shadow-lg">{formatPercent(metrics.averageInterestRate)}</p>
            <p className="text-sm text-blue-100 dark:text-blue-50 leading-relaxed">
              Piyasa ortalamasının{" "}
              <span
                className={`font-semibold ${metrics.averageInterestRate > 15 ? "text-red-200 dark:text-red-100" : "text-green-200 dark:text-green-100"}`}
              >
                {metrics.averageInterestRate > 15 ? "üzerinde" : "altında"}
              </span>
            </p>
            <div className="mt-6 flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/30 dark:bg-white/20 rounded"></div>
              <span className="text-xs text-blue-200 dark:text-blue-100">30%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-700 dark:from-purple-600 dark:via-pink-700 dark:to-rose-800 text-white shadow-2xl dark:shadow-purple-900/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-white/20 dark:bg-white/15 rounded-2xl backdrop-blur-sm">
                <Wallet className="h-8 w-8 text-white" />
              </div>
              <Badge className="bg-white/20 dark:bg-white/15 text-white border-white/30 dark:border-white/20 backdrop-blur-sm px-3 py-1">
                Aktif
              </Badge>
            </div>
            <h3 className="font-bold text-2xl mb-3 drop-shadow-md">Aylık Yük</h3>
            <p className="text-4xl font-black mb-4 drop-shadow-lg">{formatCurrency(metrics.monthlyPayment)}</p>
            <p className="text-sm text-purple-100 dark:text-purple-50 leading-relaxed">
              <span className="font-semibold text-white">{metrics.totalCredits}</span> aktif krediden toplam aylık ödeme
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-xs text-purple-200 dark:text-purple-100 mb-1">Min</div>
                <div className="h-1 bg-white/30 dark:bg-white/20 rounded"></div>
              </div>
              <div className="text-center">
                <div className="text-xs text-purple-200 dark:text-purple-100 mb-1">Ort</div>
                <div className="h-1 bg-white/60 dark:bg-white/50 rounded"></div>
              </div>
              <div className="text-center">
                <div className="text-xs text-purple-200 dark:text-purple-100 mb-1">Max</div>
                <div className="h-1 bg-white dark:bg-white/90 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 transition-shadow duration-300 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
              Banka Dağılımı
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Borç tutarına göre banka dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chartData.bankChartData ? (
                <Doughnut data={chartData.bankChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  Veri bulunmamaktadır
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 transition-shadow duration-300 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2 text-lg">
              Kredi Türü Dağılımı
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Borç tutarına göre kredi türü dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {chartData.creditTypeChartData ? (
                <Doughnut data={chartData.creditTypeChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  Veri bulunmamaktadır
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 transition-shadow duration-300 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">Aktif Kredilerim</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Güncel kredi durumunuz ve ödeme bilgileri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Banka</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Tür</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Kalan Borç</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Aylık Ödeme</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Faiz Oranı</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">İlerleme</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Durum</TableHead>
                  <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-gray-200">
                    İşlemler
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData?.credits
                  .filter((c: any) => c.status === "active")
                  .slice(0, 5)
                  .map((kredi: any, index: number) => {
                    const progressPercentage = kredi.payment_progress || 0
                    return (
                      <TableRow
                        key={kredi.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ease-in-out ${
                          index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-700/30"
                        } border-gray-200 dark:border-gray-600`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <BankLogo
                              bankName={kredi.banks?.name || "Bilinmeyen Banka"}
                              logoUrl={kredi.banks?.logo_url || undefined}
                              size="sm"
                              className="flex-shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {kredi.banks?.name || "N/A"}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{kredi.credit_code}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {kredi.credit_types?.name || "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(kredi.remaining_debt)}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {formatCurrency(kredi.monthly_payment)}
                        </TableCell>
                        <TableCell className="font-medium text-orange-600 dark:text-orange-400">
                          {formatPercent(kredi.interest_rate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 w-16">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-400 dark:to-teal-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.max(5, Math.min(95, progressPercentage))}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[35px]">
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-500 dark:to-teal-600 text-white border-transparent hover:from-emerald-700 hover:to-teal-800 dark:hover:from-emerald-600 dark:hover:to-teal-700">
                            Aktif
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
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
            {dashboardData?.credits.filter((c: any) => c.status === "active").length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aktif kredi bulunmamaktadır.
                <div className="mt-4">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                  >
                    <Link href="/uygulama/krediler/kredi-ekle">İlk Kredinizi Ekleyin</Link>
                  </Button>
                </div>
              </div>
            )}
            {dashboardData?.credits.filter((c: any) => c.status === "active").length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/uygulama/krediler"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-400 dark:to-teal-500 dark:hover:from-emerald-500 dark:hover:to-teal-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg dark:shadow-emerald-900/20 transition-all duration-200 text-sm"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>
                    Tüm Kredileri Gör ({dashboardData?.credits.filter((c: any) => c.status === "active").length})
                  </span>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
