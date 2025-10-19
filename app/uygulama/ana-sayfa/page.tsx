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
} from "lucide-react"
import { AdBanner } from "@/components/ad-banner"

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
  const [thisMonthPayment, setThisMonthPayment] = useState(0)

  // Grafik state'leri

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

            // Bu ayki toplam ödeme hesaplama
            const now = new Date()
            const currentMonth = now.getMonth()
            const currentYear = now.getFullYear()
            const thisMonthPayments = upcomingPaymentsData?.filter((p) => {
              const paymentDate = new Date(p.due_date)
              return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
            }) || []
            const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.total_payment, 0)
            setThisMonthPayment(thisMonthTotal)

            // Line Chart verisi - Finansal trend

            // Bar Chart verisi - Nakit akış
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
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
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
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
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

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 dark:from-violet-600 dark:via-purple-700 dark:to-indigo-800 text-white shadow-2xl dark:shadow-violet-900/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 dark:bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <CardContent className="relative p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="p-4 bg-white/20 dark:bg-white/15 rounded-2xl backdrop-blur-sm">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <Badge className="bg-white/20 dark:bg-white/15 text-white border-white/30 dark:border-white/20 backdrop-blur-sm px-3 py-1">
                {new Date().toLocaleDateString("tr-TR", { month: "long" })}
              </Badge>
            </div>
            <h3 className="font-bold text-2xl mb-3 drop-shadow-md">Bu Ayki Ödemeler</h3>
            <p className="text-4xl font-black mb-4 drop-shadow-lg">{formatCurrency(thisMonthPayment)}</p>
            <p className="text-sm text-violet-100 dark:text-violet-50 leading-relaxed">
              Bu ay içinde ödenecek{" "}
              <span className="font-semibold text-white">
                {upcomingPayments.filter((p) => {
                  const paymentDate = new Date(p.due_date)
                  const now = new Date()
                  return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
                }).length}
              </span>{" "}
              taksit bulunuyor
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-xs text-violet-200 dark:text-violet-100 mb-1">Ortalama Taksit</div>
                <div className="text-lg font-bold text-white drop-shadow">
                  {thisMonthPayment > 0 && upcomingPayments.filter((p) => {
                    const paymentDate = new Date(p.due_date)
                    const now = new Date()
                    return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
                  }).length > 0
                    ? formatCurrency(thisMonthPayment / upcomingPayments.filter((p) => {
                        const paymentDate = new Date(p.due_date)
                        const now = new Date()
                        return paymentDate.getMonth() === now.getMonth() && paymentDate.getFullYear() === now.getFullYear()
                      }).length)
                    : formatCurrency(0)}
                </div>
              </div>
              <div className="bg-white/10 dark:bg-white/5 rounded-lg p-3 backdrop-blur-sm">
                <div className="text-xs text-violet-200 dark:text-violet-100 mb-1">Toplam Aylık</div>
                <div className="text-lg font-bold text-white drop-shadow">{formatCurrency(monthlyPayment)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 dark:from-amber-600 dark:via-orange-700 dark:to-red-700 shadow-2xl dark:shadow-orange-900/20 rounded-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 dark:bg-white/5 rounded-full -translate-y-24 translate-x-24"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 dark:bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-white/20 dark:bg-white/15 rounded-xl backdrop-blur-sm">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-white/20 dark:bg-white/15 text-white border-white/30 dark:border-white/20 backdrop-blur-sm px-3 py-1">
              {upcomingPayments.length} ödeme
            </Badge>
          </div>
          <CardTitle className="text-white text-2xl font-bold drop-shadow-md">Yaklaşan Ödemeler</CardTitle>
          <CardDescription className="text-amber-100 dark:text-amber-50 drop-shadow-sm">
            Önümüzdeki 30 gün içinde yapılması gereken ödemeler
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/30 dark:border-white/20 hover:bg-black/20 dark:hover:bg-black/30">
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Banka</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Kredi Kodu</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Ödeme Tarihi</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Taksit No</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Tutar</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Durum</TableHead>
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
                      className={`border-white/20 dark:border-white/15 hover:bg-black/30 dark:hover:bg-black/40 transition-colors duration-150 ${
                        index % 2 === 0 ? "bg-black/10 dark:bg-black/20" : "bg-black/5 dark:bg-black/15"
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <BankLogo
                            bankName={payment.credits?.banks?.name || "Bilinmeyen Banka"}
                            logoUrl={payment.credits?.banks?.logo_url || undefined}
                            size="sm"
                            className="flex-shrink-0"
                          />
                          <span className="font-medium text-white text-sm drop-shadow">
                            {payment.credits?.banks?.name || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/90">
                        {payment.credits?.credit_code || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-white drop-shadow">
                            {paymentDate.toLocaleDateString("tr-TR")}
                          </span>
                          <span
                            className={`text-xs font-medium ${isUrgent ? "text-red-200 dark:text-red-100" : "text-amber-200 dark:text-amber-100"}`}
                          >
                            {daysUntil === 0 ? "Bugün" : daysUntil === 1 ? "Yarın" : `${daysUntil} gün sonra`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-white/90">{payment.installment_number}</TableCell>
                      <TableCell className="font-semibold text-white drop-shadow">
                        {formatCurrency(payment.total_payment)}
                      </TableCell>
                      <TableCell>
                        {isUrgent ? (
                          <Badge className="bg-red-600/80 dark:bg-red-700/80 text-white border-red-500/50 dark:border-red-600/50 backdrop-blur-sm shadow-md px-3 py-1.5 font-medium">
                            <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
                            Acil
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-600/80 dark:bg-amber-700/80 text-white border-amber-500/50 dark:border-amber-600/50 backdrop-blur-sm shadow-md px-3 py-1.5 font-medium">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            Yaklaşan
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            {upcomingPayments.length === 0 && (
              <div className="text-center py-12 bg-black/10 dark:bg-black/20 rounded-lg">
                <Clock className="h-12 w-12 mx-auto mb-3 text-white/60" />
                <p className="text-white drop-shadow">Yaklaşan ödeme bulunmamaktadır.</p>
              </div>
            )}
            {upcomingPayments.length > 5 && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                  asChild
                >
                  <Link href="/uygulama/odeme-plani">
                    <Clock className="h-5 w-5 mr-2" />
                    Tüm Ödemeleri Gör ({upcomingPayments.length})
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-teal-500 via-emerald-600 to-green-700 dark:from-teal-600 dark:via-emerald-700 dark:to-green-800 shadow-2xl dark:shadow-teal-900/20 rounded-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 dark:bg-white/5 rounded-full -translate-y-24 translate-x-24"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 dark:bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-white/20 dark:bg-white/15 rounded-xl backdrop-blur-sm">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-white/20 dark:bg-white/15 text-white border-white/30 dark:border-white/20 backdrop-blur-sm px-3 py-1">
              {credits.filter((c) => c.status === "active").length} aktif
            </Badge>
          </div>
          <CardTitle className="text-white text-2xl font-bold drop-shadow-md">Aktif Kredilerim</CardTitle>
          <CardDescription className="text-teal-100 dark:text-teal-50 drop-shadow-sm">
            Güncel kredi durumunuz ve ödeme bilgileri
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/30 dark:border-white/20 hover:bg-black/20 dark:hover:bg-black/30">
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Banka</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Tür</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Kalan Borç</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Aylık Ödeme</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Faiz Oranı</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">İlerleme</TableHead>
                  <TableHead className="font-semibold text-white bg-black/20 dark:bg-black/30">Durum</TableHead>
                  <TableHead className="w-[50px] text-right font-semibold text-white bg-black/20 dark:bg-black/30">
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
                        className={`border-white/20 dark:border-white/15 hover:bg-black/30 dark:hover:bg-black/40 transition-colors duration-150 ${
                          index % 2 === 0 ? "bg-black/10 dark:bg-black/20" : "bg-black/5 dark:bg-black/15"
                        }`}
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
                              <span className="font-medium text-white text-sm drop-shadow">
                                {kredi.banks?.name || "N/A"}
                              </span>
                              <span className="text-xs text-white/70">{kredi.credit_code}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-white/90">
                          {kredi.credit_types?.name || "N/A"}
                        </TableCell>
                        <TableCell className="font-semibold text-white drop-shadow">
                          {formatCurrency(kredi.remaining_debt)}
                        </TableCell>
                        <TableCell className="text-white/90">
                          {formatCurrency(kredi.monthly_payment)}
                        </TableCell>
                        <TableCell className="font-medium text-orange-300 dark:text-orange-200">
                          {formatPercent(kredi.interest_rate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-black/30 dark:bg-black/40 rounded-full h-2 w-16">
                              <div
                                className="bg-white dark:bg-white/90 h-2 rounded-full transition-all duration-300 shadow-sm"
                                style={{
                                  width: `${Math.max(5, Math.min(95, progressPercentage))}%`,
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-white drop-shadow min-w-[35px]">
                              {Math.round(progressPercentage)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-600/80 dark:bg-emerald-700/80 text-white border-emerald-500/50 dark:border-emerald-600/50 backdrop-blur-sm">
                            Aktif
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-black/30 dark:hover:bg-black/40 text-white"
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
              <div className="text-center py-12 bg-black/10 dark:bg-black/20 rounded-lg">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-white/60" />
                <p className="text-white drop-shadow mb-4">Aktif kredi bulunmamaktadır.</p>
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                  asChild
                >
                  <Link href="/uygulama/krediler/kredi-ekle">İlk Kredinizi Ekleyin</Link>
                </Button>
              </div>
            )}
            {credits.filter((c) => c.status === "active").length > 5 && (
              <div className="mt-6 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                  asChild
                >
                  <Link href="/uygulama/krediler">
                    <ArrowUpRight className="h-5 w-5 mr-2" />
                    Tüm Kredileri Gör ({credits.filter((c) => c.status === "active").length})
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-700 via-gray-800 to-zinc-900 dark:from-slate-800 dark:via-gray-900 dark:to-zinc-950 shadow-2xl dark:shadow-slate-900/20 rounded-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
        <CardHeader className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="p-3 bg-white/10 dark:bg-white/10 rounded-xl backdrop-blur-sm">
              <ArrowUpRight className="h-6 w-6 text-white" />
            </div>
            <Badge className="bg-white/10 dark:bg-white/10 text-white border-white/20 dark:border-white/20 backdrop-blur-sm px-3 py-1">
              Hızlı Erişim
            </Badge>
          </div>
          <CardTitle className="text-white text-2xl font-bold drop-shadow-md">Hızlı İşlemler</CardTitle>
          <CardDescription className="text-slate-300 dark:text-slate-200 drop-shadow-sm">
            Sık kullanılan işlemlere hızlı erişim
          </CardDescription>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white h-auto py-6"
              asChild
            >
              <Link href="/uygulama/krediler/kredi-ekle">
                <div className="flex flex-col items-center gap-2">
                  <DollarSign className="h-6 w-6" />
                  <span className="text-sm">Yeni Kredi Ekle</span>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white h-auto py-6"
              asChild
            >
              <Link href="/uygulama/odeme-plani">
                <div className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <span className="text-sm">Ödeme Planı</span>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white h-auto py-6"
              asChild
            >
              <Link href="/uygulama/raporlar">
                <div className="flex flex-col items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">Raporlar</span>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white h-auto py-6"
              asChild
            >
              <Link href="/uygulama/risk-analizi">
                <div className="flex flex-col items-center gap-2">
                  <Target className="h-6 w-6" />
                  <span className="text-sm">Risk Analizi</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
