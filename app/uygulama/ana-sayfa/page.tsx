"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import BankLogo from "@/components/bank-logo"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getUpcomingPayments } from "@/lib/api/payments"
import { Home, Settings, Bell, MoreHorizontal, ArrowUpRight, Target, DollarSign, TrendingUp, Clock } from "lucide-react"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"
import { AdBanner } from "@/components/ad-banner"

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
  const [credits, setCredits] = useState<any[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Metrik state'leri
  const [totalCredits, setTotalCredits] = useState(0)
  const [totalDebt, setTotalDebt] = useState(0)
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [averageInterestRate, setAverageInterestRate] = useState(0)
  const [upcomingPaymentCount, setUpcomingPaymentCount] = useState(0)

  // Grafik state'leri
  const [lineChartData, setLineChartData] = useState(defaultLineChartData)
  const [barChartData, setBarChartData] = useState(defaultBarChartData)
  const [bankChartData, setBankChartData] = useState<any>(null)
  const [creditTypeChartData, setCreditTypeChartData] = useState<any>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (user && isMounted) {
        setLoadingData(true)
        setError(null)
        try {
          // Önce bildirim kontrolü yap
          try {
            await fetch("/api/notifications/auto-create", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId: user.id }),
            })
          } catch (notificationError) {
            console.error("Bildirim oluşturma hatası:", notificationError)
            // Bildirim hatası ana veri yüklemeyi engellemez
          }

          const [creditsData, upcomingPaymentsData] = await Promise.all([
            getCredits(user.id) as Promise<any[]>,
            getUpcomingPayments(user.id, 30) as Promise<any[]>,
          ])

          if (isMounted) {
            setCredits(creditsData || [])
            setUpcomingPayments(upcomingPaymentsData || [])

            // Kredi metrikleri
            const activeCredits = creditsData?.filter((c) => c.status === "active") || []
            setTotalCredits(activeCredits.length)
            const currentTotalDebt = activeCredits.reduce((sum, c) => sum + c.remaining_debt, 0)
            setTotalDebt(currentTotalDebt)
            const currentMonthlyPayment = activeCredits.reduce((sum, c) => sum + c.monthly_payment, 0)
            setMonthlyPayment(currentMonthlyPayment)

            if (activeCredits.length > 0 && currentTotalDebt > 0) {
              const weightedInterestSum = activeCredits.reduce((sum, c) => sum + c.interest_rate * c.remaining_debt, 0)
              setAverageInterestRate(weightedInterestSum / currentTotalDebt)
            } else {
              setAverageInterestRate(0)
            }

            setUpcomingPaymentCount(upcomingPaymentsData?.length || 0)

            // Line Chart verisi - Finansal trend
            if (activeCredits.length > 0) {
              const now = new Date()
              const months = []

              for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthName = date.toLocaleDateString("tr-TR", { month: "short" })

                // Basit simülasyon
                const totalDebtAtMonth = activeCredits.reduce((sum, credit) => {
                  const monthlyReduction = credit.monthly_payment * 0.7
                  const remainingAtMonth = credit.remaining_debt + monthlyReduction * i
                  return sum + remainingAtMonth
                }, 0)

                const totalPaidAtMonth = activeCredits.reduce((sum, credit) => {
                  const monthlyPayment = credit.monthly_payment
                  return sum + monthlyPayment * (6 - i)
                }, 0)

                months.push({
                  month: monthName,
                  anaParaBorcu: Math.max(0, totalDebtAtMonth),
                  toplamOdenen: totalPaidAtMonth,
                })
              }

              setLineChartData(months)
            } else {
              setLineChartData(defaultLineChartData)
            }

            // Bar Chart verisi - Nakit akış
            if (activeCredits.length > 0) {
              const now = new Date()
              const cashFlowMonths = []

              for (let i = 0; i < 6; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
                const monthName = date.toLocaleDateString("tr-TR", { month: "short" })

                const monthlyKrediPayment = activeCredits.reduce((sum, credit) => sum + credit.monthly_payment, 0)
                const estimatedIncome = monthlyKrediPayment + 5000

                cashFlowMonths.push({
                  name: monthName,
                  krediOdeme: monthlyKrediPayment,
                  gelir: estimatedIncome,
                })
              }

              setBarChartData(cashFlowMonths)
            } else {
              setBarChartData(defaultBarChartData)
            }

            if (activeCredits.length > 0) {
              // Banka dağılımı
              const bankDistribution = activeCredits.reduce((acc: any, credit) => {
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

              setBankChartData({
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
              })

              // Kredi türü dağılımı
              const creditTypeDistribution = activeCredits.reduce((acc: any, credit) => {
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

              const sortedCreditTypeData = creditTypeDistribution
                .sort((a: any, b: any) => b.value - a.value)
                .slice(0, 5)

              setCreditTypeChartData({
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
              })
            } else {
              setBankChartData(null)
              setCreditTypeChartData(null)
            }
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
  }, [user, authLoading])

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
          color: "#ffffff",
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
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
      },
    },
  }

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
                  <div className="text-3xl font-bold mb-1 text-white drop-shadow-md">{totalCredits}</div>
                  <div className="text-sm text-emerald-100 dark:text-emerald-50">Toplam Kredi</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-emerald-200 dark:text-emerald-100" />
                    <span className="text-xs text-emerald-200 dark:text-emerald-100">
                      {credits.filter((c) => c.status === "active").length} aktif
                    </span>
                  </div>
                </div>
                <div className="bg-white/15 dark:bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 dark:border-white/15 hover:bg-white/20 dark:hover:bg-white/15 transition-all duration-200">
                  <div className="text-3xl font-bold mb-1 text-white drop-shadow-md">{formatCurrency(totalDebt)}</div>
                  <div className="text-sm text-emerald-100 dark:text-emerald-50">Toplam Borç</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-red-300 dark:text-red-200" />
                    <span className="text-xs text-emerald-200 dark:text-emerald-100">Kalan borç</span>
                  </div>
                </div>
                <div className="bg-white/15 dark:bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 dark:border-white/15 hover:bg-white/20 dark:hover:bg-white/15 transition-all duration-200">
                  <div className="text-3xl font-bold mb-1 text-white drop-shadow-md">
                    {formatPercent(creditPerformancePercentage / 100)}
                  </div>
                  <div className="text-sm text-emerald-100 dark:text-emerald-50">Performans</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Target className="h-3 w-3 text-emerald-200 dark:text-emerald-100" />
                    <span className="text-xs text-emerald-200 dark:text-emerald-100">Ödeme başarısı</span>
                  </div>
                </div>
                <div className="bg-white/15 dark:bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 dark:border-white/15 hover:bg-white/20 dark:hover:bg-white/15 transition-all duration-200">
                  <div className="text-3xl font-bold mb-1 text-white drop-shadow-md">{upcomingPaymentCount}</div>
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
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30"
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
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/30"
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
                {creditPerformancePercentage > 70 ? "Pozitif" : "Gelişim"}
              </Badge>
            </div>
            <h3 className="font-bold text-2xl mb-3 drop-shadow-md">Ödeme Performansı</h3>
            <p className="text-4xl font-black mb-4 drop-shadow-lg">
              {formatPercent(creditPerformancePercentage / 100)}
            </p>
            <p className="text-sm text-emerald-100 dark:text-emerald-50 leading-relaxed">
              Aktif kredilerinizde{" "}
              <span className="font-semibold text-white">{credits.filter((c) => c.status === "active").length}</span>{" "}
              kredi takip ediliyor
            </p>
            <div className="mt-6 w-full h-2 bg-white/20 dark:bg-white/15 rounded-full overflow-hidden">
              <div
                className="h-2 bg-white dark:bg-white/90 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${creditPerformancePercentage}%` }}
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
                {averageInterestRate > 15 ? "Yüksek" : "Stabil"}
              </Badge>
            </div>
            <h3 className="font-bold text-2xl mb-3 drop-shadow-md">Ortalama Faiz</h3>
            <p className="text-4xl font-black mb-4 drop-shadow-lg">{formatPercent(averageInterestRate)}</p>
            <p className="text-sm text-blue-100 dark:text-blue-50 leading-relaxed">
              Piyasa ortalamasının{" "}
              <span
                className={`font-semibold ${averageInterestRate > 15 ? "text-red-200 dark:text-red-100" : "text-green-200 dark:text-green-100"}`}
              >
                {averageInterestRate > 15 ? "üzerinde" : "altında"}
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
            <div className="h-80">
              <div className="flex items-center justify-center h-full text-purple-100 dark:text-purple-50">
                Veri bulunmamaktadır
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-500 via-amber-600 to-yellow-700 dark:from-orange-600 dark:via-amber-700 dark:to-yellow-800 text-white shadow-2xl dark:shadow-orange-900/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="pb-4 relative">
            <CardTitle className="text-white flex items-center gap-2 text-lg drop-shadow-md">Banka Dağılımı</CardTitle>
            <CardDescription className="text-orange-100 dark:text-orange-50">
              Borç tutarına göre banka dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="h-80">
              {bankChartData ? (
                <Doughnut data={bankChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-orange-100 dark:text-orange-50">
                  Veri bulunmamaktadır
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-teal-500 via-cyan-600 to-sky-700 dark:from-teal-600 dark:via-cyan-700 dark:to-sky-800 text-white shadow-2xl dark:shadow-teal-900/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardHeader className="pb-4 relative">
            <CardTitle className="text-white flex items-center gap-2 text-lg drop-shadow-md">
              Kredi Türü Dağılımı
            </CardTitle>
            <CardDescription className="text-teal-100 dark:text-teal-50">
              Borç tutarına göre kredi türü dağılımı
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="h-80">
              {creditTypeChartData ? (
                <Doughnut data={creditTypeChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-teal-100 dark:text-teal-50">
                  Veri bulunmamaktadır
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg hover:shadow-xl dark:shadow-gray-900/20 dark:hover:shadow-gray-900/30 transition-shadow duration-300 rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            Yaklaşan Ödemeler
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Önümüzdeki 30 gün içinde yapılması gereken ödemeler.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Banka</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Kredi Kodu</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Ödeme Tarihi</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Taksit No</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Tutar</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingPayments.slice(0, 5).map((payment, index) => {
                  const paymentDate = new Date(payment.due_date)
                  const today = new Date()
                  const daysUntil = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                  const isUrgent = daysUntil <= 7

                  return (
                    <TableRow
                      key={payment.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 ease-in-out ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-700/30"
                      } border-gray-200 dark:border-gray-600`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <BankLogo
                            bankName={payment.credits?.banks?.name || "Bilinmeyen Banka"}
                            logoUrl={payment.credits?.banks?.logo_url || undefined}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                            {payment.credits?.banks?.name || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">
                        {payment.credits?.credit_code || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {paymentDate.toLocaleDateString("tr-TR")}
                          </span>
                          <span
                            className={`text-xs ${isUrgent ? "text-red-600 dark:text-red-400 font-semibold" : "text-gray-500 dark:text-gray-400"}`}
                          >
                            {daysUntil === 0 ? "Bugün" : daysUntil === 1 ? "Yarın" : `${daysUntil} gün sonra`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-300">{payment.installment_number}</TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(payment.total_payment)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            isUrgent
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                          }
                        >
                          {isUrgent ? "Acil" : "Yaklaşan"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {upcomingPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Yaklaşan ödeme bulunmamaktadır.</div>
            )}
            {upcomingPayments.length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/uygulama/odeme-plani"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 dark:from-yellow-400 dark:to-orange-500 dark:hover:from-yellow-500 dark:hover:to-orange-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg dark:shadow-yellow-900/20 transition-all duration-200 text-sm"
                >
                  <Clock className="h-4 w-4" />
                  <span>Tüm Ödemeleri Gör ({upcomingPayments.length})</span>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                {credits
                  .filter((c) => c.status === "active")
                  .slice(0, 5)
                  .map((kredi, index) => {
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
            {credits.filter((c) => c.status === "active").length === 0 && (
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
            {credits.filter((c) => c.status === "active").length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/uygulama/krediler"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 dark:from-emerald-400 dark:to-teal-500 dark:hover:from-emerald-500 dark:hover:to-teal-600 text-white font-medium rounded-lg shadow-md hover:shadow-lg dark:shadow-emerald-900/20 transition-all duration-200 text-sm"
                >
                  <ArrowUpRight className="h-4 w-4" />
                  <span>Tüm Kredileri Gör ({credits.filter((c) => c.status === "active").length})</span>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
