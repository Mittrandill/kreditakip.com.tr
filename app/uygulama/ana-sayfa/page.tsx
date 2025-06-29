"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"
import {
  CreditCard,
  DollarSign,
  Calendar,
  TrendingUp,
  MoreHorizontal,
  Home,
  Settings,
  Bell,
  AlertCircle,
  Loader2,
  Clock,
  Percent,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getUpcomingPayments } from "@/lib/api/payments"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import { SimpleLineChart, SimpleBarChart, PaymentTimeline, InterestRateChart } from "@/components/simple-charts"
import Link from "next/link"

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
  { name: "Oca", odeme: 0, faiz: 0, anaPara: 0 },
  { name: "Şub", odeme: 0, faiz: 0, anaPara: 0 },
  { name: "Mar", odeme: 0, faiz: 0, anaPara: 0 },
  { name: "Nis", odeme: 0, faiz: 0, anaPara: 0 },
  { name: "May", odeme: 0, faiz: 0, anaPara: 0 },
  { name: "Haz", odeme: 0, faiz: 0, anaPara: 0 },
]

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [credits, setCredits] = useState<PopulatedCredit[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([])
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
  const [paymentTimelineData, setPaymentTimelineData] = useState<any[]>([])
  const [interestRateData, setInterestRateData] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true // Bileşenin bağlı olup olmadığını takip et

    async function fetchData() {
      if (user && isMounted) {
        // user ve isMounted kontrolü
        setLoadingData(true)
        setError(null)
        try {
          const [creditsData, upcomingPaymentsData] = await Promise.all([
            getCredits(user.id) as Promise<PopulatedCredit[]>,
            getUpcomingPayments(user.id, 30) as Promise<UpcomingPayment[]>,
          ])

          if (isMounted) {
            // State güncellemeden önce kontrol et
            setCredits(creditsData || [])
            setUpcomingPayments(upcomingPaymentsData || [])

            // Metrikleri hesapla
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

            // Payment Timeline Data - Gerçek veriler
            if (upcomingPaymentsData && upcomingPaymentsData.length > 0) {
              const timelineData = upcomingPaymentsData
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .slice(0, 5)
                .map((payment) => ({
                  date: new Date(payment.due_date).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "short",
                  }),
                  amount: payment.total_payment,
                  bank: payment.credits?.banks?.name || "Bilinmeyen Banka",
                }))
              setPaymentTimelineData(timelineData)
            } else {
              setPaymentTimelineData([])
            }

            // Interest Rate Data - Gerçek veriler
            if (activeCredits.length > 0) {
              const rateData = activeCredits
                .sort((a, b) => b.interest_rate - a.interest_rate)
                .slice(0, 5)
                .map((credit) => ({
                  bank: credit.banks?.name || "Bilinmeyen Banka",
                  rate: credit.interest_rate,
                  amount: credit.remaining_debt,
                }))
              setInterestRateData(rateData)
            } else {
              setInterestRateData([])
            }

            // Line Chart verisi - Son 6 aylık borç takibi
            if (activeCredits.length > 0) {
              const now = new Date()
              const months = []

              for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                const monthName = date.toLocaleDateString("tr-TR", { month: "short" })

                // Basit simülasyon - gerçek uygulamada geçmiş veriler kullanılır
                const totalDebtAtMonth = activeCredits.reduce((sum, credit) => {
                  const monthlyReduction = credit.monthly_payment * 0.7 // Ana para kısmı
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

            // Bar Chart verisi - Önümüzdeki 6 aylık ödeme dağılımı - FIX
            if (activeCredits.length > 0) {
              const now = new Date()
              const paymentMonths = []

              for (let i = 0; i < 6; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
                const monthName = date.toLocaleDateString("tr-TR", { month: "short" })

                const monthlyTotalPayment = activeCredits.reduce((sum, credit) => sum + credit.monthly_payment, 0)

                // Faiz hesaplaması - aylık faiz
                const monthlyInterest = activeCredits.reduce((sum, credit) => {
                  const monthlyInterestAmount = (credit.remaining_debt * credit.interest_rate) / 100 / 12
                  return sum + monthlyInterestAmount
                }, 0)

                // Ana para = Toplam ödeme - Faiz
                const monthlyPrincipal = Math.max(0, monthlyTotalPayment - monthlyInterest)

                console.log(`Month ${monthName}:`, {
                  total: monthlyTotalPayment,
                  interest: monthlyInterest,
                  principal: monthlyPrincipal,
                })

                paymentMonths.push({
                  name: monthName,
                  odeme: monthlyTotalPayment,
                  faiz: monthlyInterest,
                  anaPara: monthlyPrincipal,
                })
              }

              console.log("Final paymentMonths:", paymentMonths)
              setBarChartData(paymentMonths)
            } else {
              setBarChartData(defaultBarChartData)
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
      isMounted = false // Bileşen ayrıldığında flag'i false yap
    }
  }, [user, authLoading]) // user olarak değiştirildi

  if (authLoading || loadingData) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Veriler yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600">{error}</p>
        {!user && (
          <Button asChild className="mt-4">
            <Link href="/giris">Giriş Yap</Link>
          </Button>
        )}
      </div>
    )
  }

  const displayName = profile?.first_name || user?.email?.split("@")[0] || "Kullanıcı"

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Home className="h-8 w-8" />
                Kredi Yönetim Merkezi
              </h2>
              <p className="text-emerald-100 text-lg">
                Hoş geldiniz, {displayName}! Kredi durumunuz ve yaklaşan ödemelerinizi buradan takip edebilirsiniz.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline-white" size="lg">
                <Settings className="h-5 w-5" />
                Ayarlar
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-emerald-600 hover:bg-emerald-50 border-white"
              >
                <Bell className="h-5 w-5" />
                Bildirimler
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Kredi"
          value={totalCredits}
          subtitle="aktif kredi"
          color="blue"
          icon={<CreditCard />}
        />
        <MetricCard
          title="Toplam Borç"
          value={formatCurrency(totalDebt)}
          subtitle="kalan ana para"
          color="emerald"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Aylık Ödeme"
          value={formatCurrency(monthlyPayment)}
          subtitle="bu ay ödenecek"
          color="purple"
          icon={<Calendar />}
        />
        <MetricCard
          title="Ortalama Faiz"
          value={formatPercent(averageInterestRate)}
          subtitle="ağırlıklı ortalama"
          color="orange"
          icon={<TrendingUp />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card
          className="lg:col-span-4 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200 animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          <CardHeader className="">
            <CardTitle className="text-gray-900">Kredi Borç Takibi</CardTitle>
            <CardDescription>Son 6 aylık borç azalış trendi ve toplam ödenen tutarlar.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleLineChart data={lineChartData} />
          </CardContent>
        </Card>

        <Card
          className="lg:col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200 animate-fade-in-up"
          style={{ animationDelay: "500ms" }}
        >
          <CardHeader className="">
            <CardTitle className="text-gray-900">Aylık Ödeme Dağılımı</CardTitle>
            <CardDescription>Önümüzdeki 6 aylık ödeme planınızın ana para ve faiz dağılımı.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleBarChart data={barChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Row - Optimize edilmiş */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Yaklaşan Ödemeler</CardTitle>
            </div>
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{upcomingPaymentCount}</div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Önümüzdeki 30 gün</p>
            <PaymentTimeline data={paymentTimelineData} />
            <div className="mt-16 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <Link
                href="/uygulama/odeme-plani"
                className="inline-flex items-center justify-center gap-3 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-xs"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Tümünü Gör</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Faiz Oranları</CardTitle>
            </div>
            <Percent className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {formatPercent(averageInterestRate)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">Ağırlıklı ortalama</p>
            <InterestRateChart data={interestRateData} />
            <div className="mt-16 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <Link
                href="/uygulama/raporlar"
                className="inline-flex items-center justify-center gap-3 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-medium rounded-md shadow-sm hover:shadow-md transition-all duration-200 text-xs"
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Detaylı Analiz</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-gray-900 dark:text-white">Kredi İlerlemesi</CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              Toplam kredi tamamlanma durumu.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            {/* Progress Circle */}
            <div className="relative w-28 h-28">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - credits.filter((c) => c.status === "active").reduce((sum, c) => sum + (c.payment_progress || 0), 0) / Math.max(1, credits.filter((c) => c.status === "active").length) / 100)}`}
                  className="text-emerald-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-600">
                  {Math.round(
                    credits
                      .filter((c) => c.status === "active")
                      .reduce((sum, c) => sum + (c.payment_progress || 0), 0) /
                      Math.max(1, credits.filter((c) => c.status === "active").length),
                  )}
                  %
                </span>
              </div>
            </div>

            {/* Progress Info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Ortalama Tamamlanma</p>
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {credits.filter((c) => c.status === "completed").length} / {totalCredits} Kredi
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                href="/uygulama/krediler"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
              >
                <CreditCard className="h-4 w-4" />
                <span>Detayları Gör</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table Row - Tabs olmadan direkt içerik */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Aktif Krediler</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mevcut kredi hesaplarınızın detaylı listesi</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/uygulama/krediler"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-0 text-sm"
              >
                <CreditCard className="h-4 w-4" />
                <span>Tümünü Gör</span>
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="table-sticky-header">
              <TableHeader>
                <TableRow className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Banka</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tür</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Kalan Borç</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Aylık Ödeme</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Faiz Oranı</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">İlerleme</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Durum</TableHead>
                  <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-gray-300">
                    İşlemler
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credits
                  .filter((c) => c.status === "active")
                  .slice(0, 5)
                  .map((kredi, index) => {
                    // İlerleme hesaplaması - kredilerim sayfasındaki mantık
                    const progressPercentage = kredi.payment_progress || 0

                    return (
                      <TableRow
                        key={kredi.id}
                        className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out ${
                          index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-700/50"
                        } border-gray-200 dark:border-gray-700`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {/* BANKA LOGOSU EKLENDİ! */}
                            <BankLogo
                              bankName={kredi.banks?.name || "Bilinmeyen Banka"}
                              logoUrl={kredi.banks?.logo_url || undefined}
                              size="sm"
                              className="flex-shrink-0"
                            />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {kredi.banks?.name || "N/A"}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{kredi.credit_code}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {kredi.credit_types?.name || "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(kredi.remaining_debt)}
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">
                          {formatCurrency(kredi.monthly_payment)}
                        </TableCell>
                        <TableCell className="font-medium text-orange-600">
                          {formatPercent(kredi.interest_rate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-16">
                              <div
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-300"
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
                          <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800">
                            {kredi.status === "active"
                              ? "Aktif"
                              : kredi.status === "completed"
                                ? "Tamamlandı"
                                : kredi.status === "closed"
                                  ? "Kapalı"
                                  : kredi.status === "overdue"
                                    ? "Gecikmiş"
                                    : kredi.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-teal-900/20"
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
            {credits.filter((c) => c.status === "active").slice(0, 5).length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">Aktif kredi bulunmamaktadır.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
