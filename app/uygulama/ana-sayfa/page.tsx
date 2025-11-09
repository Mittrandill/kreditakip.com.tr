"use client"

import { useEffect, useState } from "react"
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
  FileText,
  Lock,
  Percent,
  CreditCard,
  Wallet,
  Plus,
  ArrowRight,
} from "lucide-react"
import { AdBanner } from "@/components/ad-banner"

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
            const activeCredits = creditsData?.filter((c) => c.status === "active" || c.status === "overdue") || []
            setTotalCredits(activeCredits.length)

            // Aylık ödeme sadece aktif kredilerden
            const currentMonthlyPayment = activeCredits.reduce((sum, c) => sum + c.monthly_payment, 0)
            setMonthlyPayment(currentMonthlyPayment)

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

      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-700 dark:to-teal-800 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <Home className="h-8 w-8" />
                Kredi Takip Merkezi
              </h2>
              <p className="text-white-100 text-lg">
                Hoş geldiniz, {displayName}! Tüm kredilerinizi tek yerden takip edin ve yönetin
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                asChild
              >
                <Link href="/uygulama/krediler/pdf-odeme-plani">
                  <FileText className="h-5 w-5 mr-2" />
                  PDF OCR Analizi
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                asChild
              >
                <Link href="/uygulama/sifrelerim">
                  <Lock className="h-5 w-5 mr-2" />
                  Güvenli Şifre Sakla
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-xl shadow-sm">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary">
                {credits.filter((c) => c.status === "active").length} aktif
              </Badge>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Aktif Krediler</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{totalCredits}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Toplam{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{credits.length}</span>{" "}
              krediden {totalCredits} tanesi aktif • Ortalama{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{formatPercent(averageInterestRate)}</span>{" "}
              faiz
            </p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-2 bg-green-600 dark:bg-green-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${credits.length > 0 ? (totalCredits / credits.length) * 100 : 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 rounded-xl shadow-sm">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary">
                Borç Durumu
              </Badge>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Toplam Borç ve Ödenen</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{formatCurrency(totalDebt)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ödenen:{" "}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPaidDebt)}</span>
            </p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-2 bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${totalAmount > 0 ? (totalPaidDebt / totalAmount) * 100 : 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 rounded-xl shadow-sm">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <Badge variant="secondary">
                {new Date().toLocaleDateString("tr-TR", { month: "long" })}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">Aylık Ödeme</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{formatCurrency(monthlyPayment)}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Kalan ödeme:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(thisMonthPayment)}</span>
            </p>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-2 bg-teal-600 dark:bg-teal-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${monthlyPayment > 0 ? ((monthlyPayment - thisMonthPayment) / monthlyPayment) * 100 : 0}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200 dark:border-gray-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Yaklaşan Ödemeler</CardTitle>
              <CardDescription>Önümüzdeki 30 gün içinde yapılması gereken ödemeler</CardDescription>
            </div>
            <Badge variant="outline" className="border-gray-300 dark:border-gray-700">
              {upcomingPayments.length} ödeme
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white dark:bg-black/20 border-b dark:border-white/10 hover:bg-white dark:hover:bg-black/20">
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Banka</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Kredi Kodu</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Ödeme Tarihi</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Taksit No</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Tutar</TableHead>
                  <TableHead className="font-semibold text-gray-700 dark:text-white/70">Durum</TableHead>
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
                      className={`hover:bg-emerald-50 dark:hover:bg-white/10 transition-colors duration-150 ease-in-out ${
                        index % 2 === 0 ? "bg-white dark:bg-black/20" : "bg-gray-50/50 dark:bg-black/10"
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <BankLogo
                            bankName={payment.credits?.banks?.name || "Bilinmeyen Banka"}
                            logoUrl={payment.credits?.banks?.logo_url || undefined}
                            size="sm"
                            className="ring-1 ring-emerald-200 dark:ring-emerald-900/30 bg-white dark:bg-black/10"
                          />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {payment.credits?.banks?.name || "N/A"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-white/70">
                        {payment.credits?.credit_code || "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {paymentDate.toLocaleDateString("tr-TR")}
                          </span>
                          <span
                            className={`text-xs font-medium ${isUrgent ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                          >
                            {daysUntil === 0 ? "Bugün" : daysUntil === 1 ? "Yarın" : `${daysUntil} gün sonra`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-white/70">{payment.installment_number}</TableCell>
                      <TableCell className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(payment.total_payment)}
                      </TableCell>
                      <TableCell>
                        {isUrgent ? (
                          <Badge className="bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Acil
                          </Badge>
                        ) : (
                          <Badge className="bg-gradient-to-r from-orange-600 to-red-700 text-white border-transparent hover:from-orange-700 hover:to-red-800">
                            <Calendar className="h-3 w-3 mr-1" />
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
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                <p className="text-gray-500 dark:text-gray-400">Yaklaşan ödeme bulunmamaktadır.</p>
              </div>
            )}
            {upcomingPayments.length > 5 && (
              <div className="mt-6 text-center">
                <Button variant="outline" asChild>
                  <Link href="/uygulama/odeme-plani">
                    Tüm Ödemeleri Gör ({upcomingPayments.length})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
                              size="md"
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
