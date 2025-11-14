"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Download, BarChart3, Filter, Calendar, TrendingUp, TrendingDown, Building2, GitCompare, FileText, Search, CreditCard, Percent } from "lucide-react"
import BankLogo from "@/components/bank-logo"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { useRouter } from "next/navigation"
import { getCredits } from "@/lib/api/credits"
import { getAllPayments } from "@/lib/api/payments"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent, formatDate } from "@/lib/format"
import dynamic from "next/dynamic"
import PDFReportModal from "@/components/pdf-report-modal"

import { DonutChart, AreaChart as ApexAreaChart, BarChart as ApexBarChart, LineChart as ApexLineChart, RadialBarChart } from "@/components/charts"
// Dynamic import for Recharts components to reduce initial bundle size
const BarChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.BarChart })), { ssr: false })
const Bar = dynamic(() => import("recharts").then((mod) => ({ default: mod.Bar })), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((mod) => ({ default: mod.XAxis })), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((mod) => ({ default: mod.YAxis })), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((mod) => ({ default: mod.CartesianGrid })), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((mod) => ({ default: mod.Tooltip })), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })), { ssr: false })
const Area = dynamic(() => import("recharts").then((mod) => ({ default: mod.Area })), { ssr: false })
const AreaChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.AreaChart })), { ssr: false })
const Line = dynamic(() => import("recharts").then((mod) => ({ default: mod.Line })), { ssr: false })
const LineChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.LineChart })), { ssr: false })

interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url"> | null
  credit_types: Pick<CreditType, "id" | "name"> | null
}

interface PaymentWithCredit extends PaymentPlan {
  credits: Credit & {
    banks: { name: string; logo_url: string | null }
  }
}

const CHART_COLORS = ["#10B981", "#14B8A6", "#06B6D4", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#EF4444"]

export default function RaporlarPage() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription()
  const router = useRouter()
  const [credits, setCredits] = useState<PopulatedCredit[]>([])
  const [payments, setPayments] = useState<PaymentWithCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("6months")
  const [selectedBank, setSelectedBank] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (!subscriptionLoading && !isPremium && !authLoading) {
      router.push("/uygulama/premium")
    }
  }, [isPremium, subscriptionLoading, authLoading, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const [creditsData, paymentsData] = await Promise.all([
          getCredits(user.id),
          getAllPayments(user.id, 12, 12),
        ])
        setCredits((creditsData as PopulatedCredit[]) || [])
        setPayments((paymentsData as PaymentWithCredit[]) || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  // Filtreleme
  const filteredCredits = selectedBank === "all"
    ? credits
    : credits.filter(c => c.banks?.name === selectedBank)

  // Banka bazında toplam borç dağılımı
  const bankDebtData = Object.entries(
    filteredCredits.reduce((acc, credit) => {
      const bankName = credit.banks?.name || "Diğer"
      acc[bankName] = (acc[bankName] || 0) + (credit.remaining_debt || 0)
      return acc
    }, {} as Record<string, number>)
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Kredi türüne göre dağılım
  const typeData = Object.entries(
    filteredCredits.reduce((acc, credit) => {
      const typeName = credit.credit_types?.name || "Diğer"
      acc[typeName] = (acc[typeName] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  // Banka bazında ortalama faiz oranları
  const bankInterestData = Object.entries(
    filteredCredits.reduce((acc, credit) => {
      const bankName = credit.banks?.name || "Diğer"
      if (!acc[bankName]) {
        acc[bankName] = { total: 0, count: 0 }
      }
      acc[bankName].total += credit.interest_rate || 0
      acc[bankName].count++
      return acc
    }, {} as Record<string, { total: number; count: number }>)
  )
    .map(([name, data]) => ({
      name,
      faiz: Number((data.total / data.count).toFixed(2)),
    }))
    .sort((a, b) => b.faiz - a.faiz)

  // Toplam istatistikler
  const totalDebt = filteredCredits.reduce((sum, c) => sum + (c.remaining_debt || 0), 0)
  const totalMonthly = filteredCredits.filter((c) => c.status === "active").reduce((sum, c) => sum + (c.monthly_payment || 0), 0)
  const avgProgress = filteredCredits.length > 0
    ? filteredCredits.reduce((sum, c) => sum + (c.payment_progress || 0), 0) / filteredCredits.length
    : 0

  // Unique banks for filter
  const uniqueBanks = Array.from(new Set(credits.map(c => c.banks?.name).filter(Boolean))) as string[]

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 dark:from-emerald-700 dark:via-teal-700 dark:to-emerald-800 text-white border-0 shadow-2xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                Raporlar
              </h1>
              <p className="text-white/80 text-base md:text-lg mb-4">
                Kredileriniz hakkında detaylı istatistikler ve analizler
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-white/70 text-sm mb-1">Toplam Borç</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalDebt)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Aylık Ödeme</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalMonthly)}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Ort. İlerleme</p>
                  <p className="text-2xl font-bold">{Math.round(avgProgress)}%</p>
                </div>
              </div>
            </div>
            <PDFReportModal
              userData={{
                credits: credits.map(c => ({
                  ...c,
                  bankName: c.banks?.name || "Bilinmeyen Banka",
                  creditType: c.credit_types?.name || "Diğer",
                  remainingDebt: c.remaining_debt || 0,
                  monthlyPayment: c.monthly_payment || 0,
                  interestRate: c.interest_rate || 0,
                  status: c.status || "unknown",
                  amount: c.initial_amount || 0,
                })),
                payments: [],
                creditCards: [],
                summary: {
                  name: user?.email || "Kullanıcı",
                  email: user?.email || "",
                },
              }}
              trigger={
                <Button
                  className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white dark:bg-transparent dark:border-white/20 dark:text-white dark:hover:bg-white/10 dark:hover:border-transparent dark:hover:text-white"
                  size="lg"
                  variant="outline"
                >
                  <Download className="h-5 w-5 mr-2" />
                  PDF İndir
                </Button>
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs - Settings Style */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-emerald-900/10">
          <TabsList className="grid grid-cols-5 bg-transparent h-auto p-2 gap-2">
            <TabsTrigger
              value="overview"
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Genel Bakış</span>
            </TabsTrigger>
            <TabsTrigger
              value="banks"
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
            >
              <Building2 className="h-4 w-4" />
              <span className="font-medium">Banka</span>
            </TabsTrigger>
            <TabsTrigger
              value="payments"
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
            >
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Ödeme Analizi</span>
            </TabsTrigger>
            <TabsTrigger
              value="comparison"
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
            >
              <GitCompare className="h-4 w-4" />
              <span className="font-medium">Karşılaştırma</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
            >
              <FileText className="h-4 w-4" />
              <span className="font-medium">Özet</span>
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Filters Section - Odeme Plani Style */}
      <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/50" />
              <Input
                type="text"
                placeholder="Banka veya kredi ara..."
                className="w-full pl-10 bg-white dark:bg-black/10 border border-gray-200 dark:border-white/10 focus-visible:border-emerald-500 dark:focus-visible:border-emerald-400 transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
              />
            </div>

            {/* Bank Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 min-w-[140px] bg-transparent dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
                >
                  <CreditCard className="h-4 w-4" />
                  {selectedBank === "all" ? "Tüm Bankalar" : selectedBank}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 dark:bg-black/90 dark:border-white/10 dark:backdrop-blur-xl">
                <DropdownMenuItem
                  onClick={() => setSelectedBank("all")}
                  className="dark:hover:bg-white/10 dark:text-white/70 cursor-pointer"
                >
                  Tüm Bankalar
                </DropdownMenuItem>
                {uniqueBanks.map((bank) => (
                  <DropdownMenuItem
                    key={bank}
                    onClick={() => setSelectedBank(bank)}
                    className="dark:hover:bg-white/10 dark:text-white/70 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <BankLogo bankName={bank} size="sm" />
                      {bank}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Period Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="gap-2 min-w-[140px] bg-transparent dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10"
                >
                  <Calendar className="h-4 w-4" />
                  {selectedPeriod === "1month"
                    ? "Son 1 Ay"
                    : selectedPeriod === "3months"
                      ? "Son 3 Ay"
                      : selectedPeriod === "6months"
                        ? "Son 6 Ay"
                        : selectedPeriod === "1year"
                          ? "Son 1 Yıl"
                          : "Tümü"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 dark:bg-black/90 dark:border-white/10 dark:backdrop-blur-xl">
                <DropdownMenuItem
                  onClick={() => setSelectedPeriod("1month")}
                  className="dark:hover:bg-white/10 dark:text-white/70 cursor-pointer"
                >
                  Son 1 Ay
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedPeriod("3months")}
                  className="dark:hover:bg-white/10 dark:text-white/70 cursor-pointer"
                >
                  Son 3 Ay
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedPeriod("6months")}
                  className="dark:hover:bg-white/10 dark:text-white/70 cursor-pointer"
                >
                  Son 6 Ay
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedPeriod("1year")}
                  className="dark:hover:bg-white/10 dark:text-white/70 cursor-pointer"
                >
                  Son 1 Yıl
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedPeriod("all")}
                  className="dark:hover:bg-white/10 dark:text-white/70 cursor-pointer"
                >
                  Tümü
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content - Genel Bakış */}
      {activeTab === "overview" && (
        <>
      {/* Widget Cards Row - Meaningful Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Widget 1: Banka Dağılımı - Bar Chart */}
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{filteredCredits.length}</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">Toplam Kredi</p>
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

        {/* Widget 2: Toplam Borç - Area Trend */}
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

        {/* Widget 3: Ortalama Faiz - Percentage Donut */}
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

      {/* Charts Row - Karciz Style with Donut Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Banka Bazında Borç Dağılımı - Donut Chart */}
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

        {/* Kredi Türü Dağılımı - Donut Chart */}
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

      {/* Additional Charts Row - Karciz Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Banka Bazında Ortalama Faiz - Bar Chart */}
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

        {/* Ödeme İlerlemesi - Area Chart */}
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

      {/* Detailed Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">En Yüksek Faiz</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {bankInterestData.length > 0 ? `${bankInterestData[0].faiz}%` : "N/A"}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {bankInterestData.length > 0 ? bankInterestData[0].name : "Veri yok"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">En Düşük Faiz</CardTitle>
              <TrendingDown className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {bankInterestData.length > 0 ? `${bankInterestData[bankInterestData.length - 1].faiz}%` : "N/A"}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {bankInterestData.length > 0 ? bankInterestData[bankInterestData.length - 1].name : "Veri yok"}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tahmini Bitiş</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {avgProgress > 0 ? `${Math.ceil((100 - avgProgress) / (avgProgress / 6))} Ay` : "N/A"}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Ortalama ilerlemeye göre
            </p>
          </CardContent>
        </Card>
      </div>
        </>
      )}

      {/* Tab Content - Banka */}
      {activeTab === "banks" && (
        <div className="grid grid-cols-1 gap-6">
          {/* Banka Bazında Toplam Borç Tablosu */}
          <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0">
            <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl text-gray-900 dark:text-white">Banka Bazında Detaylı Analiz</CardTitle>
              <CardDescription className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                Bankalara göre toplam borç ve kredi detayları
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Banka</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Kredi Sayısı</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Toplam Borç</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Ort. Faiz</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Aylık Ödeme</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bankDebtData.map((bank, index) => {
                      const bankCredits = filteredCredits.filter(c => c.banks?.name === bank.name)
                      const avgInterest = bankCredits.reduce((sum, c) => sum + (c.interest_rate || 0), 0) / bankCredits.length
                      const monthlyTotal = bankCredits.filter(c => c.status === "active").reduce((sum, c) => sum + (c.monthly_payment || 0), 0)

                      return (
                        <tr key={bank.name} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                              />
                              <span className="font-medium text-gray-900 dark:text-white">{bank.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-4 px-4 text-gray-700 dark:text-gray-300">{bankCredits.length}</td>
                          <td className="text-right py-4 px-4 font-semibold text-gray-900 dark:text-white">{formatCurrency(bank.value)}</td>
                          <td className="text-right py-4 px-4 text-emerald-600 dark:text-emerald-400 font-medium">
                            {avgInterest.toFixed(2)}%
                          </td>
                          <td className="text-right py-4 px-4 text-gray-700 dark:text-gray-300">{formatCurrency(monthlyTotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Banka Bazında Ortalama Faiz - Bar Chart */}
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
        </div>
      )}

      {/* Tab Content - Ödeme Analizi */}
      {activeTab === "payments" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold dark:text-white">Ödeme Analizi</h3>
            <div className="text-sm text-gray-500 dark:text-white/60">
              Son güncelleme: {new Date().toLocaleDateString("tr-TR")}
            </div>
          </div>

          {/* Yaklaşan Ödemeler */}
          {(() => {
            const currentDate = new Date()
            const upcomingPayments = payments.filter((p) => {
              const paymentDate = new Date(p.due_date)
              const daysDiff = Math.ceil((paymentDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
              return daysDiff >= 0 && daysDiff <= 7 && p.status === "pending"
            })
            const totalUpcomingAmount = upcomingPayments.reduce((sum, p) => sum + p.total_payment, 0)

            return upcomingPayments.length > 0 ? (
              <Card className="bg-gradient-to-br from-purple-600 to-purple-700 text-white border-transparent shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Yaklaşan Ödemeler (7 Gün İçinde)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-2xl font-bold text-white">{formatCurrency(totalUpcomingAmount)}</div>
                    <div className="text-sm text-purple-200">{upcomingPayments.length} taksit</div>
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {upcomingPayments.slice(0, 5).map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between text-sm bg-purple-500/20 p-2 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <BankLogo
                            bankName={payment.credits.banks.name}
                            logoUrl={payment.credits.banks.logo_url ?? undefined}
                            size="sm"
                          />
                          <span className="font-medium text-white">{payment.credits.banks.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-white">{formatCurrency(payment.total_payment)}</div>
                          <div className="text-xs text-purple-200">{formatDate(payment.due_date)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : null
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Banka Bazında Dağılım */}
            <Card className="dark:bg-black/20 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  Banka Bazında Ödeme Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const bankDistribution = payments.reduce(
                      (acc, payment) => {
                        const bankName = payment.credits.banks.name
                        if (!acc[bankName]) {
                          acc[bankName] = { total: 0, count: 0, pending: 0, paid: 0 }
                        }
                        acc[bankName].total += payment.total_payment
                        acc[bankName].count += 1
                        if (payment.status === "pending") {
                          acc[bankName].pending += payment.total_payment
                        } else if (payment.status === "paid") {
                          acc[bankName].paid += payment.total_payment
                        }
                        return acc
                      },
                      {} as Record<string, { total: number; count: number; pending: number; paid: number }>,
                    )

                    return Object.entries(bankDistribution)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .slice(0, 5)
                      .map(([bankName, data]) => {
                        const bankPayments = payments.filter((payment) => payment.credits.banks.name === bankName)

                        return (
                          <div key={bankName} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BankLogo bankName={bankName} logoUrl={bankPayments[0]?.credits.banks.logo_url ?? undefined} size="sm" />
                                <span className="font-medium text-sm dark:text-white">{bankName}</span>
                              </div>
                              <span className="text-sm font-semibold dark:text-white">{formatCurrency(data.total)}</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-emerald-900/20 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.max(5, (data.total / Math.max(...Object.values(bankDistribution).map((d) => d.total))) * 100)}%`,
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600 dark:text-white/60">
                              <span>{data.count} taksit</span>
                              <span>Bekleyen: {formatCurrency(data.pending)}</span>
                            </div>
                          </div>
                        )
                      })
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* Aylık Ödeme Trendi */}
            <Card className="dark:bg-black/20 dark:border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  Aylık Ödeme Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const currentMonth = new Date().getMonth()
                    const currentYear = new Date().getFullYear()
                    const monthlyTrend = []
                    for (let i = 5; i >= 0; i--) {
                      const targetDate = new Date(currentYear, currentMonth - i, 1)
                      const monthPayments = payments.filter((p) => {
                        const paymentDate = new Date(p.due_date)
                        return paymentDate.getMonth() === targetDate.getMonth() && paymentDate.getFullYear() === targetDate.getFullYear()
                      })

                      const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]
                      monthlyTrend.push({
                        month: monthNames[targetDate.getMonth()],
                        total: monthPayments.reduce((sum, p) => sum + p.total_payment, 0),
                        paid: monthPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.total_payment, 0),
                        pending: monthPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.total_payment, 0),
                      })
                    }

                    return monthlyTrend.map((month, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm dark:text-white">
                            {month.month} {currentYear}
                          </span>
                          <span className="text-sm font-semibold dark:text-white">{formatCurrency(month.total)}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-emerald-900/20 rounded-full h-2">
                          <div className="flex h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 transition-all duration-300"
                              style={{
                                width: `${month.total > 0 ? Math.max(5, (month.paid / month.total) * 100) : 0}%`,
                              }}
                            ></div>
                            <div
                              className="bg-orange-400 transition-all duration-300"
                              style={{
                                width: `${month.total > 0 ? Math.max(5, (month.pending / month.total) * 100) : 0}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 dark:text-white/60">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            Ödenen: {formatCurrency(month.paid)}
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                            Bekleyen: {formatCurrency(month.pending)}
                          </span>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Yıl Özeti */}
          <Card className="dark:bg-black/20 dark:border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                {new Date().getFullYear()} Yılı Özeti
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const currentYear = new Date().getFullYear()
                const paidThisYear = payments.filter((p) => {
                  const paymentDate = new Date(p.due_date)
                  return paymentDate.getFullYear() === currentYear && p.status === "paid"
                })
                const totalPaidThisYear = paidThisYear.reduce((sum, p) => sum + p.total_payment, 0)

                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{paidThisYear.length}</div>
                      <p className="text-sm text-gray-600 dark:text-white/60">Ödenen Taksit</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalPaidThisYear)}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-white/60">Toplam Ödenen</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {payments.filter((p) => p.status === "pending").length}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-white/60">Kalan Taksit</p>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab Content - Karşılaştırma */}
      {activeTab === "comparison" && (
        <div className="grid grid-cols-1 gap-6">
          {/* Widget Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Widget: En Yüksek Faiz - Area Chart */}
            <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                      {bankInterestData.length > 0 ? `${bankInterestData[0].faiz}%` : "N/A"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">En Yüksek Faiz</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {bankInterestData.length > 0 ? bankInterestData[0].name : "Veri yok"}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-red-500" />
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bankInterestData.slice(0, 5).map((b, i) => ({ val: b.faiz }))}>
                      <defs>
                        <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="val" stroke="#EF4444" strokeWidth={2} fill="url(#redGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Widget: En Düşük Faiz - Bar Chart */}
            <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      {bankInterestData.length > 0 ? `${bankInterestData[bankInterestData.length - 1].faiz}%` : "N/A"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">En Düşük Faiz</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {bankInterestData.length > 0 ? bankInterestData[bankInterestData.length - 1].name : "Veri yok"}
                    </p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-emerald-500" />
                </div>
                <div className="h-20 flex items-end gap-1">
                  {bankInterestData.slice(0, 8).map((item, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-emerald-500 rounded-sm"
                      style={{ height: `${(item.faiz / bankInterestData[0].faiz) * 100}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Widget: Ortalama Faiz - Line Chart */}
            <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {bankInterestData.length > 0
                        ? `${(bankInterestData.reduce((sum, b) => sum + b.faiz, 0) / bankInterestData.length).toFixed(2)}%`
                        : "N/A"
                      }
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ortalama Faiz</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tüm bankalar</p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-blue-500" />
                </div>
                <div className="h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bankInterestData.slice(0, 6).map((b) => ({ val: b.faiz }))}>
                      <Line type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Kredi Türü Dağılımı - Donut Chart */}
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

          {/* Ödeme İlerlemesi - Area Chart */}
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
      )}

      {/* Tab Content - Özet */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 gap-6">
          {/* Widget Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Widget 1: Toplam Kredi - Area Chart */}
            <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{filteredCredits.length}</h3>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Toplam Kredi</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {filteredCredits.filter(c => c.status === "active").length} aktif
                    </p>
                  </div>
                  <BarChart3 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { val: Math.max(1, filteredCredits.length - 2) },
                      { val: Math.max(1, filteredCredits.length - 1) },
                      { val: filteredCredits.length },
                      { val: filteredCredits.length + 1 },
                      { val: filteredCredits.length }
                    ]}>
                      <defs>
                        <linearGradient id="summaryGradient1" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="val" stroke="#10B981" strokeWidth={2} fill="url(#summaryGradient1)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Widget 2: Toplam Borç - Bar Chart */}
            <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(totalDebt)}</h3>
                    <p className="text-sm text-red-600 dark:text-red-400">Toplam Borç</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Kalan tutar</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="h-16 flex items-end gap-1">
                  {[60, 75, 65, 85, 70, 90, 75, 95].map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-red-500 rounded-sm"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Widget 3: Aylık Ödeme - Line Chart */}
            <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(totalMonthly)}</h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Aylık Ödeme</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Toplam taksit</p>
                  </div>
                  <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[
                      { val: totalMonthly * 0.8 },
                      { val: totalMonthly * 0.9 },
                      { val: totalMonthly * 0.85 },
                      { val: totalMonthly * 0.95 },
                      { val: totalMonthly }
                    ]}>
                      <Line type="monotone" dataKey="val" stroke="#3B82F6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Widget 4: Ort. İlerleme - Progress Donut */}
            <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{Math.round(avgProgress)}%</h3>
                    <p className="text-sm text-purple-600 dark:text-purple-400">Ort. İlerleme</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Tamamlanma</p>
                  </div>
                  <TrendingDown className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="h-16 flex items-center justify-center">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-200 dark:text-gray-700" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#9333EA"
                        strokeWidth="12"
                        strokeDasharray={`${(avgProgress / 100) * 251.2} 251.2`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{Math.round(avgProgress)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Banka Özeti Tablosu */}
          <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0">
            <CardHeader className="border-b border-gray-100 dark:border-white/5 pb-4">
              <CardTitle className="text-xl text-gray-900 dark:text-white">Banka Bazında Özet</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {bankDebtData.map((bank, index) => {
                  const bankCredits = filteredCredits.filter(c => c.banks?.name === bank.name)
                  const percentage = (bank.value / totalDebt) * 100

                  return (
                    <div key={bank.name} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BankLogo
                            bankName={bank.name}
                            logoUrl={bankCredits[0]?.banks?.logo_url ?? undefined}
                            size="md"
                          />
                          <span className="font-medium text-gray-900 dark:text-white">{bank.name}</span>
                          <Badge variant="outline" className="text-xs dark:border-white/20 dark:text-white/70">{bankCredits.length} kredi</Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(bank.value)}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tahmini Bitiş */}
          <Card className="bg-white dark:bg-black/20 border border-gray-200 dark:border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Tahmini Bitiş</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {avgProgress > 0 ? `${Math.ceil((100 - avgProgress) / (avgProgress / 6))} Ay` : "N/A"}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Ortalama ilerlemeye göre
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
