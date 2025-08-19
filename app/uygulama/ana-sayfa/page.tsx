"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import { SimpleLineChart, SimpleBarChart, SimpleDonutChart } from "@/components/simple-charts"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getUpcomingPayments } from "@/lib/api/payments"
import {
  Home,
  Settings,
  Bell,
  Receipt,
  MoreHorizontal,
  ArrowUpRight,
  Banknote,
  Target,
  DollarSign,
  Calendar,
  Percent,
  PieChart,
} from "lucide-react"

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
  const [donutChartData, setDonutChartData] = useState<any[]>([])

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
              const creditTypeDistribution = activeCredits.reduce((acc: any, credit) => {
                const typeName = credit.credit_types?.name || "Diğer Krediler"
                const existing = acc.find((item: any) => item.name === typeName)

                if (existing) {
                  existing.tutar += credit.remaining_debt
                } else {
                  acc.push({
                    name: typeName,
                    tutar: credit.remaining_debt,
                    fill: getColorForCreditType(typeName),
                  })
                }
                return acc
              }, [])

              // En büyük 5 kredi türünü al, geri kalanını "Diğer" olarak grupla
              const sortedData = creditTypeDistribution.sort((a: any, b: any) => b.tutar - a.tutar)
              if (sortedData.length > 5) {
                const top4 = sortedData.slice(0, 4)
                const others = sortedData.slice(4)
                const othersTotal = others.reduce((sum: number, item: any) => sum + item.tutar, 0)

                if (othersTotal > 0) {
                  top4.push({
                    name: "Diğer",
                    tutar: othersTotal,
                    fill: "#94a3b8",
                  })
                }
                setDonutChartData(top4)
              } else {
                setDonutChartData(sortedData)
              }
            } else {
              setDonutChartData([])
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

  const getColorForCreditType = (typeName: string): string => {
    const colorMap: { [key: string]: string } = {
      "İhtiyaç Kredisi": "#3b82f6",
      "Konut Kredisi": "#10b981",
      "Taşıt Kredisi": "#f59e0b",
      "Ticari Kredi": "#8b5cf6",
      "Kredi Kartı": "#ef4444",
      "Diğer Krediler": "#6b7280",
      Diğer: "#94a3b8",
    }
    return colorMap[typeName] || "#6b7280"
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
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Home className="h-8 w-8" />
                Kredi Takip Merkezi
              </h2>
              <p className="text-emerald-100 text-lg">
                Hoş geldiniz, {displayName}! Kredilerinizi tek yerden yönetin ve takip edin.
              </p>
              <div className="mt-4 flex items-center gap-6 text-emerald-100">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  <span>{totalCredits} Aktif Kredi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{upcomingPaymentCount} Yaklaşan Ödeme</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline-white" size="lg" asChild>
                <Link href="/uygulama/ayarlar">
                  <Settings className="h-5 w-5" />
                  Ayarlar
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-emerald-600 hover:bg-emerald-50 border-white"
                asChild
              >
                <Link href="/uygulama/bildirimler">
                  <Bell className="h-5 w-5" />
                  Bildirimler
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ana Metrik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Borç"
          value={formatCurrency(totalDebt)}
          subtitle="kalan kredi borcu"
          color="red"
          icon={<Receipt />}
          change="-₺1,250"
          changeType="positive"
        />
        <MetricCard
          title="Aylık Ödeme"
          value={formatCurrency(monthlyPayment)}
          subtitle="toplam aylık taksit"
          color="orange"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Ortalama Faiz"
          value={formatPercent(averageInterestRate)}
          subtitle="ağırlıklı ortalama"
          color="purple"
          icon={<Percent />}
        />
        <MetricCard
          title="Kredi Performansı"
          value={`%${creditPerformancePercentage}`}
          subtitle="tamamlanma oranı"
          color="emerald"
          icon={<Target />}
          change={creditPerformancePercentage > 70 ? "+%5.2" : "-%2.1"}
          changeType={creditPerformancePercentage > 70 ? "positive" : "negative"}
        />
      </div>

      {/* Grafikler */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Borç Azalış Trendi</CardTitle>
            <CardDescription>Son 6 aylık borç azalış ve ödeme durumu.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleLineChart data={lineChartData} />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Aylık Nakit Akışı</CardTitle>
            <CardDescription>Önümüzdeki 6 aylık ödeme projeksiyonu.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleBarChart data={barChartData} />
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-emerald-600" />
              Kredi Türü Dağılımı
            </CardTitle>
            <CardDescription>Aktif kredilerinizin türlerine göre borç dağılımı ve oranları.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {donutChartData.length > 0 ? (
              <SimpleDonutChart
                data={donutChartData}
                centerText={formatCurrency(totalDebt)}
                centerSubtext="Toplam Borç"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <PieChart className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">Aktif kredi bulunmuyor</p>
                <p className="text-sm text-gray-400 mb-4">İlk kredinizi ekleyerek başlayın</p>
                <Button asChild size="sm">
                  <Link href="/uygulama/krediler/kredi-ekle">Kredi Ekle</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Krediler Tablosu */}
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Aktif Kredilerim
          </CardTitle>
          <CardDescription>Güncel kredi durumunuz ve ödeme bilgileri.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
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
                            Aktif
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
            {credits.filter((c) => c.status === "active").length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aktif kredi bulunmamaktadır.
                <div className="mt-4">
                  <Button asChild>
                    <Link href="/uygulama/krediler/kredi-ekle">İlk Kredinizi Ekleyin</Link>
                  </Button>
                </div>
              </div>
            )}
            {credits.filter((c) => c.status === "active").length > 5 && (
              <div className="mt-4 text-center">
                <Link
                  href="/uygulama/krediler"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
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
