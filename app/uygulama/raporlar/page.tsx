"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Filter,
  CreditCard,
  Building2,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Activity,
  Target,
  Clock,
  ChevronDown,
  Calendar,
  Search,
  X,
  TrendingDown,
  Percent,
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { tr } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription"
import { useRouter } from "next/navigation"
import { getCredits } from "@/lib/api/credits"
import { getAllPayments } from "@/lib/api/payments"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import PDFReportModal from "@/components/pdf-report-modal"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"

// Dynamic import for Recharts components to reduce initial bundle size
const BarChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.BarChart })), { ssr: false })
const Bar = dynamic(() => import("recharts").then((mod) => ({ default: mod.Bar })), { ssr: false })
const XAxis = dynamic(() => import("recharts").then((mod) => ({ default: mod.XAxis })), { ssr: false })
const YAxis = dynamic(() => import("recharts").then((mod) => ({ default: mod.YAxis })), { ssr: false })
const CartesianGrid = dynamic(() => import("recharts").then((mod) => ({ default: mod.CartesianGrid })), { ssr: false })
const Tooltip = dynamic(() => import("recharts").then((mod) => ({ default: mod.Tooltip })), { ssr: false })
const ResponsiveContainer = dynamic(() => import("recharts").then((mod) => ({ default: mod.ResponsiveContainer })), { ssr: false })
const RechartsPieChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.PieChart })), { ssr: false })
const Cell = dynamic(() => import("recharts").then((mod) => ({ default: mod.Cell })), { ssr: false })
const Pie = dynamic(() => import("recharts").then((mod) => ({ default: mod.Pie })), { ssr: false })
const LineChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.LineChart })), { ssr: false })
const Line = dynamic(() => import("recharts").then((mod) => ({ default: mod.Line })), { ssr: false })
const Legend = dynamic(() => import("recharts").then((mod) => ({ default: mod.Legend as any })), { ssr: false })
const Area = dynamic(() => import("recharts").then((mod) => ({ default: mod.Area })), { ssr: false })
const AreaChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.AreaChart })), { ssr: false })
const ComposedChart = dynamic(() => import("recharts").then((mod) => ({ default: mod.ComposedChart })), { ssr: false })

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"]

interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url" | "contact_phone" | "contact_email" | "website"> | null
  credit_types: Pick<CreditType, "id" | "name"> | null
}

interface BankDistribution {
  name: string
  value: number
  count: number
  monthlyPayment: number
  totalInterest: number
  averageInterest: number
  logoUrl?: string
  fullName?: string
}

interface CreditTypeDistribution {
  name: string
  value: number
  count: number
}

interface PopulatedPayment extends PaymentPlan {
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

interface FilterState {
  dateRange: { from?: Date; to?: Date; preset: string }
  banks: string[]
  creditTypes: string[]
  searchTerm: string
}

export default function RaporlarPage() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription()
  const router = useRouter()
  const [credits, setCredits] = useState<PopulatedCredit[]>([])
  const [payments, setPayments] = useState<PopulatedPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Simplified Filters
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { preset: "last6Months" },
    banks: [],
    creditTypes: [],
    searchTerm: "",
  })

  const [activeTab, setActiveTab] = useState("overview")
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (!subscriptionLoading && !isPremium && !authLoading) {
      router.push("/uygulama/premium")
    }
  }, [isPremium, subscriptionLoading, authLoading, router])

  const fetchData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const [creditsData, paymentsData] = await Promise.all([
        getCredits(user.id) as Promise<PopulatedCredit[]>,
        getAllPayments(user.id, 24, 12) as Promise<PopulatedPayment[]>,
      ])

      setCredits(creditsData || [])
      setPayments(paymentsData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Veriler yüklenirken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  // Apply date range filter
  useEffect(() => {
    const now = new Date()
    let from: Date | undefined
    let to: Date | undefined

    switch (filters.dateRange.preset) {
      case "thisMonth":
        from = startOfMonth(now)
        to = endOfMonth(now)
        break
      case "lastMonth":
        from = startOfMonth(subMonths(now, 1))
        to = endOfMonth(subMonths(now, 1))
        break
      case "last3Months":
        from = startOfMonth(subMonths(now, 3))
        to = now
        break
      case "last6Months":
        from = startOfMonth(subMonths(now, 6))
        to = now
        break
      case "thisYear":
        from = new Date(now.getFullYear(), 0, 1)
        to = now
        break
      default:
        from = undefined
        to = undefined
    }

    setFilters((prev) => ({
      ...prev,
      dateRange: { ...prev.dateRange, from, to },
    }))
  }, [filters.dateRange.preset])

  // Filtered data
  const filteredCredits = useMemo(() => {
    return credits.filter((credit) => {
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const bankName = credit.banks?.name?.toLowerCase() || ""
        const creditType = credit.credit_types?.name?.toLowerCase() || ""
        if (!bankName.includes(searchLower) && !creditType.includes(searchLower)) {
          return false
        }
      }

      if (filters.banks.length > 0 && !filters.banks.includes(credit.banks?.name || "")) {
        return false
      }

      if (filters.creditTypes.length > 0 && !filters.creditTypes.includes(credit.credit_types?.name || "")) {
        return false
      }

      return true
    })
  }, [credits, filters])

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      if (filters.dateRange.from || filters.dateRange.to) {
        const paymentDate = new Date(payment.due_date)
        if (filters.dateRange.from && filters.dateRange.to) {
          if (!isWithinInterval(paymentDate, { start: filters.dateRange.from, end: filters.dateRange.to })) {
            return false
          }
        }
      }

      if (filters.banks.length > 0 && !filters.banks.includes(payment.credits?.banks?.name || "")) {
        return false
      }

      return true
    })
  }, [payments, filters])

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    const activeCredits = filteredCredits.filter((c) => c.status === "active")
    const totalDebt = filteredCredits.reduce((sum, c) => sum + (c.remaining_debt || 0), 0)
    const monthlyPayment = activeCredits.reduce((sum, c) => sum + (c.monthly_payment || 0), 0)
    const averageInterest =
      filteredCredits.length > 0
        ? filteredCredits.reduce((sum, c) => sum + (c.interest_rate || 0), 0) / filteredCredits.length
        : 0

    const paidPayments = filteredPayments.filter((p) => p.status === "paid").length
    const totalPayments = filteredPayments.length
    const paymentPerformance = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0

    const overduePayments = filteredPayments.filter((p) => p.status === "overdue").length
    const upcomingPayments = filteredPayments.filter((p) => {
      const dueDate = new Date(p.due_date)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      return p.status === "pending" && dueDate <= nextWeek
    }).length

    return {
      totalCredits: filteredCredits.length,
      activeCredits: activeCredits.length,
      totalDebt,
      monthlyPayment,
      averageInterest,
      paymentPerformance,
      overduePayments,
      upcomingPayments,
      totalPaidAmount: filteredPayments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (p.total_payment || 0), 0),
    }
  }, [filteredCredits, filteredPayments])

  // Chart data
  const chartData = useMemo(() => {
    // Monthly trend data
    const monthlyTrend = []
    for (let i = 11; i >= 0; i--) {
      const date = subMonths(new Date(), i)
      const monthKey = format(date, "yyyy-MM")
      const monthName = format(date, "MMM yy", { locale: tr })

      const monthPayments = filteredPayments.filter((p) => {
        const paymentDate = new Date(p.due_date)
        return format(paymentDate, "yyyy-MM") === monthKey
      })

      const totalAmount = monthPayments.reduce((sum, p) => sum + (p.total_payment || 0), 0)
      const paidAmount = monthPayments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + (p.total_payment || 0), 0)

      monthlyTrend.push({
        month: monthName,
        toplam: totalAmount,
        odenen: paidAmount,
        bekleyen: totalAmount - paidAmount,
      })
    }

    // Bank distribution
    const bankDistribution = filteredCredits
      .reduce((acc: BankDistribution[], credit) => {
        const bankName = credit.banks?.name || "Bilinmeyen Banka"
        const shortName = bankName.replace("Bankası", "").replace("Bank", "").trim()
        const existing = acc.find((item) => item.name === shortName)
        if (existing) {
          existing.value += credit.remaining_debt || 0
          existing.count += 1
          existing.monthlyPayment += credit.monthly_payment || 0
          existing.totalInterest += credit.interest_rate || 0
          existing.logoUrl = existing.logoUrl || (credit.banks?.logo_url ?? undefined)
        } else {
          acc.push({
            name: shortName,
            value: credit.remaining_debt || 0,
            count: 1,
            monthlyPayment: credit.monthly_payment || 0,
            totalInterest: credit.interest_rate || 0,
            averageInterest: credit.interest_rate || 0,
            logoUrl: credit.banks?.logo_url ?? undefined,
            fullName: credit.banks?.name,
          })
        }
        return acc
      }, [])
      .map((item) => ({
        ...item,
        averageInterest: item.count > 0 ? item.totalInterest / item.count : 0,
      }))
      .sort((a, b) => b.value - a.value)

    // Credit type distribution
    const creditTypeDistribution = filteredCredits
      .reduce((acc: CreditTypeDistribution[], credit) => {
        const typeName = credit.credit_types?.name || "Diğer"
        const existing = acc.find((item) => item.name === typeName)
        if (existing) {
          existing.value += credit.remaining_debt || 0
          existing.count += 1
        } else {
          acc.push({
            name: typeName,
            value: credit.remaining_debt || 0,
            count: 1,
          })
        }
        return acc
      }, [])
      .sort((a, b) => b.value - a.value)

    // Payment status distribution
    const paymentStatusDistribution = [
      { name: "Ödenen", value: filteredPayments.filter((p) => p.status === "paid").length, color: "#10B981" },
      { name: "Bekleyen", value: filteredPayments.filter((p) => p.status === "pending").length, color: "#F59E0B" },
      { name: "Geciken", value: filteredPayments.filter((p) => p.status === "overdue").length, color: "#EF4444" },
    ]

    return {
      monthlyTrend,
      bankDistribution,
      creditTypeDistribution,
      paymentStatusDistribution,
    }
  }, [filteredCredits, filteredPayments])

  // Available filter options
  const filterOptions = useMemo(() => {
    const banks = [...new Set(credits.map((c) => c.banks?.name).filter(Boolean))].sort()
    const creditTypes = [...new Set(credits.map((c) => c.credit_types?.name).filter(Boolean))].sort()

    return { banks, creditTypes }
  }, [credits])

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      dateRange: { preset: "last6Months" },
      banks: [],
      creditTypes: [],
      searchTerm: "",
    })
  }

  const hasActiveFilters =
    filters.searchTerm || filters.banks.length > 0 || filters.creditTypes.length > 0

  if (authLoading || subscriptionLoading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Raporlar hazırlanıyor...</p>
      </div>
    )
  }

  if (!isPremium) {
    return null
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Raporlar hazırlanıyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600 dark:text-red-400 mb-4">{error}</p>
        <Button onClick={fetchData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tekrar Dene
        </Button>
      </div>
    )
  }

  // Empty state
  if (!loading && credits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)] p-8">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-gray-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Henüz Veri Yok</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Raporlarınızı görebilmek için önce kredi ekleyin ve ödemelerinizi kaydedin.
          </p>
          <Button onClick={() => router.push("/uygulama/krediler/kredi-ekle")} className="bg-emerald-600 hover:bg-emerald-700">
            <CreditCard className="h-4 w-4 mr-2" />
            İlk Krediyi Ekle
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
            Raporlar ve Analiz
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Kredilerinizin detaylı analizi ve performans raporları
          </p>
        </div>
        <PDFReportModal
          userData={{
            credits: filteredCredits.map((credit) => ({
              id: credit.id,
              bankName: credit.banks?.name,
              creditType: credit.credit_types?.name,
              remainingDebt: credit.remaining_debt,
              monthlyPayment: credit.monthly_payment,
              interestRate: credit.interest_rate,
              status: credit.status,
              amount: credit.initial_amount,
              payment_progress: credit.payment_progress,
              total_installments: credit.total_installments,
              remaining_installments: credit.remaining_installments,
              banks: credit.banks,
              credit_types: credit.credit_types,
              remaining_debt: credit.remaining_debt,
              monthly_payment: credit.monthly_payment,
              interest_rate: credit.interest_rate,
              initial_amount: credit.initial_amount,
            })),
            payments: filteredPayments.map((payment) => ({
              id: payment.id,
              date: payment.payment_date || payment.due_date,
              bankName: payment.credits?.banks?.name,
              amount: payment.total_payment,
              status: payment.status,
            })),
            creditCards: [],
            summary: {
              name: (user as any)?.full_name || "Kullanıcı",
              email: user?.email || "email@example.com",
            },
          }}
          trigger={
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="h-4 w-4 mr-2" />
              PDF İndir
            </Button>
          }
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Toplam Borç"
          value={formatCurrency(summaryMetrics.totalDebt)}
          subtitle="Tüm kredilerdeki kalan toplam borç"
          color="purple"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Aylık Ödeme"
          value={formatCurrency(summaryMetrics.monthlyPayment)}
          subtitle="Aktif kredilerdeki toplam aylık taksit"
          color="blue"
          icon={<Calendar />}
        />
        <MetricCard
          title="Ödeme Başarısı"
          value={formatPercent(summaryMetrics.paymentPerformance / 100)}
          subtitle="Zamanında yapılan ödemeler"
          color="emerald"
          icon={<Target />}
          badge={`${filteredPayments.filter((p) => p.status === "paid").length} ödeme`}
        />
        <MetricCard
          title="Ortalama Faiz"
          value={`%${summaryMetrics.averageInterest.toFixed(1)}`}
          subtitle="Tüm kredilerin ortalama faiz oranı"
          color="orange"
          icon={<Percent />}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-emerald-600" />
              <CardTitle>Filtreler</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  {filters.banks.length + filters.creditTypes.length + (filters.searchTerm ? 1 : 0)} filtre
                </Badge>
              )}
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Temizle
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Ara..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter("searchTerm", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.dateRange.preset}
              onValueChange={(value) => updateFilter("dateRange", { ...filters.dateRange, preset: value })}
            >
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Zaman dilimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Bu Ay</SelectItem>
                <SelectItem value="lastMonth">Geçen Ay</SelectItem>
                <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                <SelectItem value="last6Months">Son 6 Ay</SelectItem>
                <SelectItem value="thisYear">Bu Yıl</SelectItem>
              </SelectContent>
            </Select>

            <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  {filters.banks.length > 0 ? `${filters.banks.length} banka seçili` : "Tüm Bankalar"}
                  <ChevronDown className="h-4 w-4 ml-auto" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Bankalar</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filterOptions.banks.filter((bank): bank is string => !!bank).map((bank) => (
                        <div key={bank} className="flex items-center space-x-2">
                          <Checkbox
                            id={`bank-${bank}`}
                            checked={filters.banks.includes(bank)}
                            onCheckedChange={(checked) => {
                              const newBanks = checked
                                ? [...filters.banks, bank]
                                : filters.banks.filter((b) => b !== bank)
                              updateFilter("banks", newBanks)
                            }}
                          />
                          <Label htmlFor={`bank-${bank}`} className="text-sm cursor-pointer flex-1">
                            {bank}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Kredi Türleri</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {filterOptions.creditTypes.filter((type): type is string => !!type).map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={filters.creditTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              const newTypes = checked
                                ? [...filters.creditTypes, type]
                                : filters.creditTypes.filter((t) => t !== type)
                              updateFilter("creditTypes", newTypes)
                            }}
                          />
                          <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer flex-1">
                            {type}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Genel Bakış</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Trendler</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Dağılım</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Performans</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  Ödeme Trendi
                </CardTitle>
                <CardDescription>Son 12 ayın ödeme analizi</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis
                      dataKey="month"
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                    />
                    <YAxis
                      className="text-gray-600 dark:text-gray-400"
                      fontSize={12}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      formatter={((value: number | string, name: string) => [
                        formatCurrency(Number(value)),
                        name === "toplam" ? "Toplam" : name === "odenen" ? "Ödenen" : "Bekleyen",
                      ]) as any}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="odenen" fill="#10B981" name="Ödenen" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="bekleyen" fill="#F59E0B" name="Bekleyen" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="toplam" stroke="#3B82F6" strokeWidth={2} name="Toplam" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-600" />
                  Ödeme Durumu
                </CardTitle>
                <CardDescription>Ödemelerin duruma göre dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.paymentStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={(({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`) as any}
                    >
                      {chartData.paymentStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={((value: number) => [value, "Ödeme Sayısı"]) as any} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam Kredi</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryMetrics.totalCredits}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{summaryMetrics.activeCredits} aktif</p>
                  </div>
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                    <CreditCard className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Yaklaşan Ödemeler</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryMetrics.upcomingPayments}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Sonraki 7 gün</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Geciken Ödemeler</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryMetrics.overduePayments}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Dikkat gerektirir</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                Ödeme Trendi Detayı
              </CardTitle>
              <CardDescription>12 aylık ödeme performansı</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData.monthlyTrend}>
                  <defs>
                    <linearGradient id="colorOdenen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBekleyen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    formatter={((value: number | string, name: string) => [
                      formatCurrency(Number(value)),
                      name === "odenen" ? "Ödenen" : "Bekleyen",
                    ]) as any}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="odenen"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorOdenen)"
                    strokeWidth={2}
                    name="Ödenen"
                  />
                  <Area
                    type="monotone"
                    dataKey="bekleyen"
                    stroke="#F59E0B"
                    fillOpacity={1}
                    fill="url(#colorBekleyen)"
                    strokeWidth={2}
                    name="Bekleyen"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Banka Dağılımı
                </CardTitle>
                <CardDescription>Bankalara göre borç dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData.bankDistribution.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis dataKey="name" className="text-gray-600 dark:text-gray-400" fontSize={12} />
                    <YAxis className="text-gray-600 dark:text-gray-400" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={((value: number | string) => [formatCurrency(Number(value)), "Borç Tutarı"]) as any}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  Kredi Türü Dağılımı
                </CardTitle>
                <CardDescription>Kredi türlerine göre dağılım</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.creditTypeDistribution as any}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={(({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`) as any}
                    >
                      {chartData.creditTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={((value: number) => [formatCurrency(value), "Borç Tutarı"]) as any} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Banks List */}
          <Card>
            <CardHeader>
              <CardTitle>En Yüksek Borçlu Bankalar</CardTitle>
              <CardDescription>Borç tutarına göre sıralı</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chartData.bankDistribution.slice(0, 5).map((bank, index) => (
                  <div
                    key={bank.name}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="flex items-center gap-3">
                        <BankLogo bankName={bank.fullName || bank.name} logoUrl={bank.logoUrl} size="sm" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{bank.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{bank.count} kredi</div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-gray-900 dark:text-white">{formatCurrency(bank.value)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Ort. %{bank.averageInterest.toFixed(1)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-2">
                  <div className="text-4xl font-bold text-emerald-600">{formatPercent(summaryMetrics.paymentPerformance / 100)}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Genel Performans</div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {filteredPayments.filter((p) => p.status === "paid").length} / {filteredPayments.length} ödeme
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-2">
                  <div className="text-4xl font-bold text-red-600">{summaryMetrics.overduePayments}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Geciken Ödemeler</div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  {formatCurrency(
                    filteredPayments
                      .filter((p) => p.status === "overdue")
                      .reduce((sum, p) => sum + (p.total_payment || 0), 0)
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-2">
                  <div className="text-4xl font-bold text-blue-600">{summaryMetrics.upcomingPayments}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Yaklaşan Ödemeler</div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">Sonraki 7 gün</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                Ödeme Başarı Oranı
              </CardTitle>
              <CardDescription>Aylık ödeme başarı yüzdesi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={((value: number | string) => [`${Number(value).toFixed(1)}%`, "Başarı Oranı"]) as any}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={(data: { toplam: number; odenen: number }) => (data.toplam > 0 ? (data.odenen / data.toplam) * 100 : 0)}
                    stroke="#10B981"
                    strokeWidth={3}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                    name="Başarı Oranı"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
