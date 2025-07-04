"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"
import type { Credit, Bank, CreditType, PaymentPlan, Account } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import { SimpleLineChart, SimpleBarChart, SimpleDonutChart } from "@/components/simple-charts"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getCreditCards } from "@/lib/api/credit-cards"
import { getAccounts } from "@/lib/api/accounts"
import { getUpcomingPayments } from "@/lib/api/payments"
import {
  Loader2,
  AlertCircle,
  Home,
  Wallet,
  Building2,
  Settings,
  Bell,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Receipt,
  MoreHorizontal,
  ArrowUpRight,
  CreditCard,
  Banknote,
  Target,
  DollarSign,
} from "lucide-react"

// Kredi verisi için genişletilmiş tip (ilişkili tablolarla)
interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url"> | null
  credit_types: Pick<CreditType, "id" | "name"> | null
}

interface PopulatedAccount extends Account {
  banks: Pick<Bank, "id" | "name" | "logo_url"> | null
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
  { month: "Oca", anaParaBorcu: 0, toplamOdenen: 0, hesapBakiye: 0 },
  { month: "Şub", anaParaBorcu: 0, toplamOdenen: 0, hesapBakiye: 0 },
  { month: "Mar", anaParaBorcu: 0, toplamOdenen: 0, hesapBakiye: 0 },
  { month: "Nis", anaParaBorcu: 0, toplamOdenen: 0, hesapBakiye: 0 },
  { month: "May", anaParaBorcu: 0, toplamOdenen: 0, hesapBakiye: 0 },
  { month: "Haz", anaParaBorcu: 0, toplamOdenen: 0, hesapBakiye: 0 },
]

const defaultBarChartData = [
  { name: "Oca", krediOdeme: 0, kartOdeme: 0, gelir: 0 },
  { name: "Şub", krediOdeme: 0, kartOdeme: 0, gelir: 0 },
  { name: "Mar", krediOdeme: 0, kartOdeme: 0, gelir: 0 },
  { name: "Nis", krediOdeme: 0, kartOdeme: 0, gelir: 0 },
  { name: "May", krediOdeme: 0, kartOdeme: 0, gelir: 0 },
  { name: "Haz", krediOdeme: 0, kartOdeme: 0, gelir: 0 },
]

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const [credits, setCredits] = useState<any[]>([])
  const [creditCards, setCreditCards] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [upcomingPayments, setUpcomingPayments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Metrik state'leri
  const [totalCredits, setTotalCredits] = useState(0)
  const [totalDebt, setTotalDebt] = useState(0)
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [averageInterestRate, setAverageInterestRate] = useState(0)

  // Kredi kartı metrikleri
  const [totalCreditCards, setTotalCreditCards] = useState(0)
  const [totalCreditLimit, setTotalCreditLimit] = useState(0)
  const [totalCreditCardDebt, setTotalCreditCardDebt] = useState(0)
  const [creditUtilization, setCreditUtilization] = useState(0)

  // Hesap metrikleri
  const [totalAccounts, setTotalAccounts] = useState(0)
  const [totalBalance, setTotalBalance] = useState(0)
  const [totalSavings, setTotalSavings] = useState(0)
  const [monthlyIncome, setMonthlyIncome] = useState(0)

  // Genel metrikler
  const [netWorth, setNetWorth] = useState(0)
  const [upcomingPaymentCount, setUpcomingPaymentCount] = useState(0)

  // Grafik state'leri
  const [lineChartData, setLineChartData] = useState(defaultLineChartData)
  const [barChartData, setBarChartData] = useState(defaultBarChartData)
  const [paymentTimelineData, setPaymentTimelineData] = useState<any[]>([])
  const [interestRateData, setInterestRateData] = useState<any[]>([])
  const [assetDistributionData, setAssetDistributionData] = useState<any[]>([])
  const [debtDistributionData, setDebtDistributionData] = useState<any[]>([])

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (user && isMounted) {
        setLoadingData(true)
        setError(null)
        try {
          const [creditsData, creditCardsData, accountsData, upcomingPaymentsData] = await Promise.all([
            getCredits(user.id) as Promise<any[]>,
            getCreditCards(user.id) as Promise<any[]>,
            getAccounts(user.id) as Promise<any[]>,
            getUpcomingPayments(user.id, 30) as Promise<any[]>,
          ])

          if (isMounted) {
            setCredits(creditsData || [])
            setCreditCards(creditCardsData || [])
            setAccounts(accountsData || [])
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

            // Kredi kartı metrikleri
            const activeCards = creditCardsData?.filter((c) => c.is_active) || []
            setTotalCreditCards(activeCards.length)
            const totalLimit = activeCards.reduce((sum, c) => sum + c.credit_limit, 0)
            const totalCardDebt = activeCards.reduce((sum, c) => sum + c.current_debt, 0)
            setTotalCreditLimit(totalLimit)
            setTotalCreditCardDebt(totalCardDebt)
            setCreditUtilization(totalLimit > 0 ? (totalCardDebt / totalLimit) * 100 : 0)

            // Hesap metrikleri
            const activeAccounts = accountsData?.filter((a) => a.is_active) || []
            setTotalAccounts(activeAccounts.length)
            const balance = activeAccounts.reduce((sum, a) => sum + a.current_balance, 0)
            setTotalBalance(balance)

            // Tasarruf hesapları
            const savingsAccounts = activeAccounts.filter(
              (a) => a.account_type === "tasarruf" || a.account_type === "vadeli",
            )
            setTotalSavings(savingsAccounts.reduce((sum, a) => sum + a.current_balance, 0))

            // Tahmini aylık gelir (hesap bakiyelerindeki artış)
            setMonthlyIncome(0) // Bu gerçek uygulamada transaction history'den hesaplanır

            // Net değer hesaplama
            const totalAssets = balance
            const totalLiabilities = currentTotalDebt + totalCardDebt
            setNetWorth(totalAssets - totalLiabilities)

            setUpcomingPaymentCount(upcomingPaymentsData?.length || 0)

            // Varlık dağılımı grafiği
            if (activeAccounts.length > 0) {
              const assetData = [
                {
                  name: "Vadesiz Hesap",
                  tutar: activeAccounts
                    .filter((a) => a.account_type === "vadesiz")
                    .reduce((sum, a) => sum + a.current_balance, 0),
                  fill: "#10b981",
                },
                {
                  name: "Vadeli Hesap",
                  tutar: activeAccounts
                    .filter((a) => a.account_type === "vadeli")
                    .reduce((sum, a) => sum + a.current_balance, 0),
                  fill: "#3b82f6",
                },
                {
                  name: "Tasarruf",
                  tutar: activeAccounts
                    .filter((a) => a.account_type === "tasarruf")
                    .reduce((sum, a) => sum + a.current_balance, 0),
                  fill: "#8b5cf6",
                },
                {
                  name: "Yatırım",
                  tutar: activeAccounts
                    .filter((a) => a.account_type === "yatirim")
                    .reduce((sum, a) => sum + a.current_balance, 0),
                  fill: "#f59e0b",
                },
              ].filter((item) => item.tutar > 0)
              setAssetDistributionData(assetData)
            }

            // Borç dağılımı grafiği
            const debtData = []
            if (currentTotalDebt > 0) {
              debtData.push({ name: "Krediler", tutar: currentTotalDebt, fill: "#ef4444" })
            }
            if (totalCardDebt > 0) {
              debtData.push({ name: "Kredi Kartları", tutar: totalCardDebt, fill: "#f97316" })
            }
            setDebtDistributionData(debtData)

            // Payment Timeline Data
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

            // Interest Rate Data
            const allInterestRates = []
            if (activeCredits.length > 0) {
              activeCredits.forEach((credit) => {
                allInterestRates.push({
                  bank: credit.banks?.name || "Bilinmeyen Banka",
                  rate: credit.interest_rate,
                  amount: credit.remaining_debt,
                  type: "Kredi",
                })
              })
            }
            if (activeCards.length > 0) {
              activeCards.forEach((card) => {
                allInterestRates.push({
                  bank: card.banks?.name || "Bilinmeyen Banka",
                  rate: card.interest_rate,
                  amount: card.current_debt,
                  type: "Kredi Kartı",
                })
              })
            }

            const sortedRates = allInterestRates.sort((a, b) => b.rate - a.rate).slice(0, 5)
            setInterestRateData(sortedRates)

            // Line Chart verisi - Finansal trend
            if (activeCredits.length > 0 || activeAccounts.length > 0) {
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

                const accountBalanceAtMonth = activeAccounts.reduce((sum, account) => {
                  // Basit simülasyon - hesap bakiyesi trend
                  return sum + account.current_balance * (1 + (6 - i) * 0.02)
                }, 0)

                months.push({
                  month: monthName,
                  anaParaBorcu: Math.max(0, totalDebtAtMonth),
                  toplamOdenen: totalPaidAtMonth,
                  hesapBakiye: accountBalanceAtMonth,
                })
              }

              setLineChartData(months)
            } else {
              setLineChartData(defaultLineChartData)
            }

            // Bar Chart verisi - Nakit akış
            if (activeCredits.length > 0 || activeCards.length > 0) {
              const now = new Date()
              const cashFlowMonths = []

              for (let i = 0; i < 6; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
                const monthName = date.toLocaleDateString("tr-TR", { month: "short" })

                const monthlyKrediPayment = activeCredits.reduce((sum, credit) => sum + credit.monthly_payment, 0)
                const monthlyKartPayment = activeCards.reduce((sum, card) => {
                  const minPayment = (card.current_debt * card.minimum_payment_rate) / 100
                  return sum + Math.max(minPayment, 50)
                }, 0)

                // Tahmini gelir (gerçek uygulamada kullanıcıdan alınır)
                const estimatedIncome = monthlyKrediPayment + monthlyKartPayment + 5000

                cashFlowMonths.push({
                  name: monthName,
                  krediOdeme: monthlyKrediPayment,
                  kartOdeme: monthlyKartPayment,
                  gelir: estimatedIncome,
                })
              }

              setBarChartData(cashFlowMonths)
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
      isMounted = false
    }
  }, [user, authLoading])

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
                Finansal Kontrol Merkezi
              </h2>
              <p className="text-emerald-100 text-lg">
                Hoş geldiniz, {displayName}! Tüm finansal durumunuzu tek yerden yönetin.
              </p>
              <div className="mt-4 flex items-center gap-6 text-emerald-100">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  <span>{totalCredits} Kredi</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  <span>{totalCreditCards} Kart</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <span>{totalAccounts} Hesap</span>
                </div>
              </div>
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

      {/* Ana Metrik Kartları - Sadece 4 Adet */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Net Değer"
          value={formatCurrency(netWorth)}
          subtitle="toplam varlık - borç"
          color={netWorth >= 0 ? "emerald" : "red"}
          icon={netWorth >= 0 ? <TrendingUp /> : <TrendingDown />}
          change={netWorth >= 0 ? "+%5.2" : "-%3.1"}
          changeType={netWorth >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="Toplam Varlık"
          value={formatCurrency(totalBalance)}
          subtitle="hesap bakiyeleri"
          color="blue"
          icon={<PiggyBank />}
          change="+%2.1"
          changeType="positive"
        />
        <MetricCard
          title="Toplam Borç"
          value={formatCurrency(totalDebt + totalCreditCardDebt)}
          subtitle="kredi + kart borcu"
          color="orange"
          icon={<Receipt />}
          change="-₺1,250"
          changeType="positive"
        />
        <MetricCard
          title="Aylık Ödeme"
          value={formatCurrency(monthlyPayment + totalCreditCardDebt * 0.025)}
          subtitle="toplam ödeme yükü"
          color="purple"
          icon={<DollarSign />}
        />
      </div>

      {/* Grafikler */}
      <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Finansal Trend Analizi</CardTitle>
            <CardDescription>Son 6 aylık borç azalış trendi, ödenen tutarlar ve hesap bakiye değişimi.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleLineChart data={lineChartData} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900">Nakit Akış Projeksiyonu</CardTitle>
            <CardDescription>Önümüzdeki 6 aylık gelir ve gider dağılımı.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <SimpleBarChart data={barChartData} />
          </CardContent>
        </Card>
      </div>

      {/* Varlık ve Borç Dağılımı */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-600" />
              Varlık Dağılımı
            </CardTitle>
            <CardDescription>Hesap türlerine göre varlık dağılımınız.</CardDescription>
          </CardHeader>
          <CardContent>
            {assetDistributionData.length > 0 ? (
              <SimpleDonutChart data={assetDistributionData} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">Varlık verisi bulunamadı</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-red-600" />
              Borç Dağılımı
            </CardTitle>
            <CardDescription>Kredi türlerine göre borç dağılımınız.</CardDescription>
          </CardHeader>
          <CardContent>
            {debtDistributionData.length > 0 ? (
              <SimpleDonutChart data={debtDistributionData} />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">Borç verisi bulunamadı</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Finansal Sağlık Kartları - 3 Adet */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-gray-900 dark:text-white">Kredi Performansı</CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              Ortalama kredi tamamlanma oranınız.
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
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - creditPerformancePercentage / 100)}`}
                  className="text-emerald-600 transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-emerald-600">{creditPerformancePercentage}%</span>
              </div>
            </div>

            {/* Progress Info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Tamamlanma Oranı</p>
              <p className="text-base font-semibold text-emerald-600">
                {creditPerformancePercentage > 70
                  ? "Mükemmel"
                  : creditPerformancePercentage > 40
                    ? "İyi"
                    : "Geliştirilmeli"}
              </p>
            </div>

            {/* Stats */}
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Aktif Krediler</span>
                <span className="font-medium">{credits.filter((c) => c.status === "active").length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tamamlanan</span>
                <span className="font-medium">{credits.filter((c) => c.status === "completed").length}</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                href="/uygulama/krediler"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
              >
                <Target className="h-4 w-4" />
                <span>Detayları Gör</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-gray-900 dark:text-white">Kart Kullanım Durumu</CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              Kredi kartı limit kullanım oranınız.
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
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - creditUtilization / 100)}`}
                  className={`${
                    creditUtilization > 80
                      ? "text-red-600"
                      : creditUtilization > 50
                        ? "text-orange-500"
                        : "text-emerald-600"
                  } transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className={`text-xl font-bold ${
                    creditUtilization > 80
                      ? "text-red-600"
                      : creditUtilization > 50
                        ? "text-orange-500"
                        : "text-emerald-600"
                  }`}
                >
                  {Math.round(creditUtilization)}%
                </span>
              </div>
            </div>

            {/* Progress Info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Limit Kullanımı</p>
              <p
                className={`text-base font-semibold ${
                  creditUtilization > 80
                    ? "text-red-600"
                    : creditUtilization > 50
                      ? "text-orange-500"
                      : "text-emerald-600"
                }`}
              >
                {creditUtilization > 80 ? "Yüksek Risk" : creditUtilization > 50 ? "Orta Risk" : "Düşük Risk"}
              </p>
            </div>

            {/* Stats */}
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Toplam Limit</span>
                <span className="font-medium">{formatCurrency(totalCreditLimit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Kullanılan</span>
                <span className="font-medium">{formatCurrency(totalCreditCardDebt)}</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                href="/uygulama/kredi-kartlari"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
              >
                <CreditCard className="h-4 w-4" />
                <span>Kartları Gör</span>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base text-gray-900 dark:text-white">Finansal Sağlık</CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              Genel finansal durumunuzun özeti.
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
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.min(85, Math.max(15, netWorth > 0 ? 75 : 25)) / 100)}`}
                  className={`${netWorth > 0 ? "text-emerald-600" : "text-orange-500"} transition-all duration-1000 ease-out`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-bold ${netWorth > 0 ? "text-emerald-600" : "text-orange-500"}`}>
                  {netWorth > 0 ? "75%" : "25%"}
                </span>
              </div>
            </div>

            {/* Progress Info */}
            <div className="text-center space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">Finansal Sağlık Skoru</p>
              <p className={`text-base font-semibold ${netWorth > 0 ? "text-emerald-600" : "text-orange-500"}`}>
                {netWorth > 0 ? "İyi" : "Geliştirilmeli"}
              </p>
            </div>

            {/* Stats */}
            <div className="w-full space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Net Değer</span>
                <span className={`font-medium ${netWorth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(netWorth)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Borç/Varlık</span>
                <span className="font-medium">
                  {totalBalance > 0 ? Math.round(((totalDebt + totalCreditCardDebt) / totalBalance) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <Link
                href="/uygulama/risk-analizi"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 text-sm"
              >
                <Target className="h-4 w-4" />
                <span>Detaylı Analiz</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Veri Tabloları */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-row items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Finansal Hesaplar</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tüm finansal hesaplarınızın detaylı listesi</p>
            </div>
          </div>

          <Tabs defaultValue="credits" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Krediler ({totalCredits})
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Kredi Kartları ({totalCreditCards})
              </TabsTrigger>
              <TabsTrigger value="accounts" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Hesaplar ({totalAccounts})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="credits" className="mt-6">
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
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">Aktif kredi bulunmamaktadır.</div>
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
            </TabsContent>

            <TabsContent value="cards" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Banka</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Kart Adı</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Limit</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Borç</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Kullanım</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Faiz Oranı</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Durum</TableHead>
                      <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-gray-300">
                        İşlemler
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditCards
                      .filter((c) => c.is_active)
                      .slice(0, 5)
                      .map((card, index) => {
                        const utilizationRate =
                          card.credit_limit > 0 ? (card.current_debt / card.credit_limit) * 100 : 0
                        return (
                          <TableRow
                            key={card.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out ${
                              index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-700/50"
                            } border-gray-200 dark:border-gray-700`}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <BankLogo
                                  bankName={card.banks?.name || "Bilinmeyen Banka"}
                                  logoUrl={card.banks?.logo_url || undefined}
                                  size="sm"
                                  className="flex-shrink-0"
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                                    {card.banks?.name || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300">{card.card_name}</TableCell>
                            <TableCell className="font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(card.credit_limit)}
                            </TableCell>
                            <TableCell className="text-gray-600 dark:text-gray-300">
                              {formatCurrency(card.current_debt)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 w-16">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      utilizationRate > 80
                                        ? "bg-gradient-to-r from-red-500 to-red-600"
                                        : utilizationRate > 50
                                          ? "bg-gradient-to-r from-orange-500 to-orange-600"
                                          : "bg-gradient-to-r from-emerald-500 to-teal-600"
                                    }`}
                                    style={{
                                      width: `${Math.max(5, Math.min(95, utilizationRate))}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[35px]">
                                  {Math.round(utilizationRate)}%
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-orange-600">
                              {formatPercent(card.interest_rate)}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white border-transparent hover:from-blue-700 hover:to-blue-800">
                                Aktif
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                asChild
                              >
                                <Link href={`/uygulama/kredi-kartlari/${card.id}`}>
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
                {creditCards.filter((c) => c.is_active).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aktif kredi kartı bulunmamaktadır.
                  </div>
                )}
                {creditCards.filter((c) => c.is_active).length > 5 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/uygulama/kredi-kartlari"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      <span>Tüm Kredi Kartlarını Gör ({creditCards.filter((c) => c.is_active).length})</span>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="accounts" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Banka</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Hesap Adı</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tür</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Bakiye</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Para Birimi</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Faiz Oranı</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Durum</TableHead>
                      <TableHead className="w-[50px] text-right font-semibold text-gray-700 dark:text-gray-300">
                        İşlemler
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts
                      .filter((a) => a.is_active)
                      .slice(0, 5)
                      .map((account, index) => (
                        <TableRow
                          key={account.id}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 ease-in-out ${
                            index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-700/50"
                          } border-gray-200 dark:border-gray-700`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <BankLogo
                                bankName={account.banks?.name || "Bilinmeyen Banka"}
                                logoUrl={account.banks?.logo_url || undefined}
                                size="sm"
                                className="flex-shrink-0"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                  {account.banks?.name || "N/A"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-300">{account.account_name}</TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-300">
                            {account.account_type === "vadesiz"
                              ? "Vadesiz"
                              : account.account_type === "vadeli"
                                ? "Vadeli"
                                : account.account_type === "tasarruf"
                                  ? "Tasarruf"
                                  : account.account_type === "yatirim"
                                    ? "Yatırım"
                                    : "Diğer"}
                          </TableCell>
                          <TableCell
                            className={`font-semibold ${account.current_balance >= 0 ? "text-emerald-600" : "text-red-600"}`}
                          >
                            {formatCurrency(account.current_balance)}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-300">{account.currency}</TableCell>
                          <TableCell className="font-medium text-emerald-600">
                            {formatPercent(account.interest_rate)}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white border-transparent hover:from-green-700 hover:to-green-800">
                              Aktif
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20"
                              asChild
                            >
                              <Link href={`/uygulama/hesaplar/${account.id}`}>
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                {accounts.filter((a) => a.is_active).length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">Aktif hesap bulunmamaktadır.</div>
                )}
                {accounts.filter((a) => a.is_active).length > 5 && (
                  <div className="mt-4 text-center">
                    <Link
                      href="/uygulama/hesaplar"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      <span>Tüm Hesapları Gör ({accounts.filter((a) => a.is_active).length})</span>
                    </Link>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
