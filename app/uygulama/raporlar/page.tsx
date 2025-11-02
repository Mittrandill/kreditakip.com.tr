"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  Wallet,
  AlertTriangle,
  RefreshCw,
  DollarSign,
  Activity,
  Target,
  Clock,
  Settings,
  ChevronDown,
  ChevronUp,
  Calendar,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  X,
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { tr } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"
import { useSubscription } from "@/hooks/use-subscription" // Import subscription hook
import { useRouter } from "next/navigation" // Import router
import { getCredits } from "@/lib/api/credits"
import { getAllPayments } from "@/lib/api/payments"
import type { Credit, Bank, CreditType, PaymentPlan } from "@/lib/types"
import { formatCurrency, formatPercent } from "@/lib/format"
import PDFReportModal from "@/components/pdf-report-modal"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine,
} from "recharts"

const COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"]

interface PopulatedCredit extends Credit {
  banks: Pick<Bank, "id" | "name" | "logo_url"> | null
  credit_types: Pick<CreditType, "id" | "name"> | null
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
  status: string[]
  amountRange: { min: number; max: number }
  interestRange: { min: number; max: number }
  searchTerm: string
}

export default function RaporlarPage() {
  const { user, loading: authLoading } = useAuth()
  const { isPremium, loading: subscriptionLoading } = useSubscription() // Check premium status
  const router = useRouter() // Router for redirect
  const [credits, setCredits] = useState<PopulatedCredit[]>([])
  const [payments, setPayments] = useState<PopulatedPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    dateRange: { preset: "last6Months" },
    banks: [],
    creditTypes: [],
    status: [],
    amountRange: { min: 0, max: 10000000 },
    interestRange: { min: 0, max: 50 },
    searchTerm: "",
  })

  const [activeTab, setActiveTab] = useState("overview")
  const [expandedFilters, setExpandedFilters] = useState(false)

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
      case "custom":
        from = filters.dateRange.from
        to = filters.dateRange.to
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
      // Search filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase()
        const bankName = credit.banks?.name?.toLowerCase() || ""
        const creditType = credit.credit_types?.name?.toLowerCase() || ""
        if (!bankName.includes(searchLower) && !creditType.includes(searchLower)) {
          return false
        }
      }

      // Bank filter
      if (filters.banks.length > 0 && !filters.banks.includes(credit.banks?.name || "")) {
        return false
      }

      // Credit type filter
      if (filters.creditTypes.length > 0 && !filters.creditTypes.includes(credit.credit_types?.name || "")) {
        return false
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(credit.status)) {
        return false
      }

      // Amount range filter
      const amount = credit.remaining_debt || 0
      if (amount < filters.amountRange.min || amount > filters.amountRange.max) {
        return false
      }

      // Interest range filter
      const interest = credit.interest_rate || 0
      if (interest < filters.interestRange.min || interest > filters.interestRange.max) {
        return false
      }

      return true
    })
  }, [credits, filters])

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      // Date range filter
      if (filters.dateRange.from || filters.dateRange.to) {
        const paymentDate = new Date(payment.due_date)
        if (filters.dateRange.from && filters.dateRange.to) {
          if (!isWithinInterval(paymentDate, { start: filters.dateRange.from, end: filters.dateRange.to })) {
            return false
          }
        }
      }

      // Bank filter
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
        geciken: monthPayments
          .filter((p) => p.status === "overdue")
          .reduce((sum, p) => sum + (p.total_payment || 0), 0),
      })
    }

    // Bank distribution
    const bankDistribution = filteredCredits
      .reduce((acc: any[], credit) => {
        const bankName = credit.banks?.name || "Bilinmeyen Banka"
        const shortName = bankName.replace("Bankası", "").replace("Bank", "").trim()
        const existing = acc.find((item) => item.name === shortName)
        if (existing) {
          existing.value += credit.remaining_debt || 0
          existing.count += 1
          existing.monthlyPayment += credit.monthly_payment || 0
          existing.totalInterest += credit.interest_rate || 0
          existing.logoUrl = existing.logoUrl || credit.banks?.logo_url
        } else {
          acc.push({
            name: shortName,
            value: credit.remaining_debt || 0,
            count: 1,
            monthlyPayment: credit.monthly_payment || 0,
            totalInterest: credit.interest_rate || 0,
            averageInterest: credit.interest_rate || 0,
            logoUrl: credit.banks?.logo_url,
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
      .reduce((acc: any[], credit) => {
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

    // Interest rate analysis
    const interestAnalysis = filteredCredits
      .map((credit) => ({
        bank: credit.banks?.name?.replace("Bankası", "").replace("Bank", "").trim() || "Bilinmeyen",
        rate: credit.interest_rate || 0,
        amount: credit.remaining_debt || 0,
        monthlyInterest: ((credit.interest_rate || 0) / 12 / 100) * (credit.remaining_debt || 0),
        creditType: credit.credit_types?.name || "Diğer",
        logoUrl: credit.banks?.logo_url,
        fullBankName: credit.banks?.name,
      }))
      .sort((a, b) => b.rate - a.rate)

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
      interestAnalysis,
      paymentStatusDistribution,
    }
  }, [filteredCredits, filteredPayments])

  // Available filter options
  const filterOptions = useMemo(() => {
    const banks = [...new Set(credits.map((c) => c.banks?.name).filter(Boolean))].sort()
    const creditTypes = [...new Set(credits.map((c) => c.credit_types?.name).filter(Boolean))].sort()
    const statuses = [...new Set(credits.map((c) => c.status))].sort()

    return { banks, creditTypes, statuses }
  }, [credits])

  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      dateRange: { preset: "last6Months" },
      banks: [],
      creditTypes: [],
      status: [],
      amountRange: { min: 0, max: 10000000 },
      interestRange: { min: 0, max: 50 },
      searchTerm: "",
    })
  }

  const hasActiveFilters =
    filters.searchTerm ||
    filters.banks.length > 0 ||
    filters.creditTypes.length > 0 ||
    filters.status.length > 0 ||
    filters.amountRange.min > 0 ||
    filters.amountRange.max < 10000000 ||
    filters.interestRange.min > 0 ||
    filters.interestRange.max < 50

  if (authLoading || subscriptionLoading) {
    return (
      <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-150px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        <p className="text-lg text-gray-600">Raporlar hazırlanıyor...</p>
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
        <p className="text-lg text-gray-600">Raporlar hazırlanıyor...</p>
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
              <BarChart3 className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Henüz Veri Yok</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Raporlarınızı görebilmek için önce kredi ekleyin ve ödemelerinizi kaydedin.
          </p>
          <Button onClick={() => router.push("/uygulama/krediler/kredi-ekle")} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
            <CreditCard className="h-4 w-4 mr-2" />
            İlk Krediyi Ekle
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-800"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 dark:from-black/30 to-transparent"></div>
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23ffffff' fillOpacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30">
                  <BarChart3 className="h-10 w-10 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold mb-2 text-white">Finansal Raporlar</h1>
                  <p className="text-emerald-100 text-xl">Detaylı analiz ve akıllı öngörüler</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="text-3xl font-bold mb-1 text-white">{summaryMetrics.totalCredits}</div>
                  <div className="text-sm text-emerald-100">Toplam Kredi</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-3 w-3 text-emerald-200" />
                    <span className="text-xs text-emerald-200">{summaryMetrics.activeCredits} aktif</span>
                  </div>
                </div>
                <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="text-3xl font-bold mb-1 text-white">{formatCurrency(summaryMetrics.totalDebt)}</div>
                  <div className="text-sm text-emerald-100">Toplam Borç</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowDownRight className="h-3 w-3 text-red-300" />
                    <span className="text-xs text-emerald-200">Kalan borç</span>
                  </div>
                </div>
                <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="text-3xl font-bold mb-1 text-white">
                    {formatPercent(summaryMetrics.paymentPerformance / 100)}
                  </div>
                  <div className="text-sm text-emerald-100">Performans</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Target className="h-3 w-3 text-emerald-200" />
                    <span className="text-xs text-emerald-200">Ödeme başarısı</span>
                  </div>
                </div>
                <div className="bg-white/15 rounded-xl p-4 backdrop-blur-sm border border-white/20">
                  <div className="text-3xl font-bold mb-1 text-white">{summaryMetrics.upcomingPayments}</div>
                  <div className="text-sm text-emerald-100">Yaklaşan</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Clock className="h-3 w-3 text-yellow-300" />
                    <span className="text-xs text-emerald-200">7 gün içinde</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
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
                    amount: credit.amount || credit.initial_amount,
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
                  summary: {
                    name: user?.full_name || "Kullanıcı",
                    email: user?.email || "email@example.com",
                  },
                }}
                trigger={
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-transparent hover:text-white h-12 px-6"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    PDF Rapor İndir
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Premium Filters */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl dark:text-white">Akıllı Filtreler</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Verilerinizi detaylı analiz edin</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                >
                  {[
                    filters.searchTerm && "Arama",
                    filters.banks.length > 0 && `${filters.banks.length} Banka`,
                    filters.creditTypes.length > 0 && `${filters.creditTypes.length} Tür`,
                    filters.status.length > 0 && `${filters.status.length} Durum`,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={resetFilters} disabled={!hasActiveFilters}>
                <X className="h-4 w-4 mr-2" />
                Temizle
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExpandedFilters(!expandedFilters)}>
                {expandedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {expandedFilters ? "Daralt" : "Genişlet"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Banka veya kredi türü ara..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter("searchTerm", e.target.value)}
                className="pl-10 h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-emerald-500 focus:ring-emerald-500 dark:text-white"
              />
            </div>

            {/* Date Range */}
            <Select
              value={filters.dateRange.preset}
              onValueChange={(value) => updateFilter("dateRange", { ...filters.dateRange, preset: value })}
            >
              <SelectTrigger className="h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-white">
                <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                <SelectValue placeholder="Zaman dilimi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">Bu Ay</SelectItem>
                <SelectItem value="lastMonth">Geçen Ay</SelectItem>
                <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                <SelectItem value="last6Months">Son 6 Ay</SelectItem>
                <SelectItem value="thisYear">Bu Yıl</SelectItem>
                <SelectItem value="custom">Özel Tarih</SelectItem>
              </SelectContent>
            </Select>

            {/* Bank Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start h-11 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-white"
                >
                  <Building2 className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                  Bankalar {filters.banks.length > 0 && `(${filters.banks.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 dark:bg-gray-800 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium dark:text-white">Banka Seçimi</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => updateFilter("banks", [])}
                      className="h-6 px-2 text-xs"
                    >
                      Temizle
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filterOptions.banks.map((bank) => (
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
                        <Label htmlFor={`bank-${bank}`} className="text-sm cursor-pointer flex-1 dark:text-gray-300">
                          {bank}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-gray-300 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-800 dark:to-gray-700 rounded-lg px-4 py-2">
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                <span>{filteredCredits.length} kredi</span>
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>{filteredPayments.length} ödeme</span>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {expandedFilters && (
            <div className="border-t dark:border-gray-700 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Credit Type Filter */}
                <div className="space-y-3">
                  <Label className="font-medium dark:text-white">Kredi Türleri</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filterOptions.creditTypes.map((type) => (
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
                        <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer dark:text-gray-300">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-3">
                  <Label className="font-medium dark:text-white">Tutar Aralığı (TL)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.amountRange.min || ""}
                      onChange={(e) =>
                        updateFilter("amountRange", {
                          ...filters.amountRange,
                          min: Number(e.target.value) || 0,
                        })
                      }
                      className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <Minus className="h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.amountRange.max === 10000000 ? "" : filters.amountRange.max}
                      onChange={(e) =>
                        updateFilter("amountRange", {
                          ...filters.amountRange,
                          max: Number(e.target.value) || 10000000,
                        })
                      }
                      className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                {/* Interest Range */}
                <div className="space-y-3">
                  <Label className="font-medium dark:text-white">Faiz Oranı (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.interestRange.min || ""}
                      onChange={(e) =>
                        updateFilter("interestRange", {
                          ...filters.interestRange,
                          min: Number(e.target.value) || 0,
                        })
                      }
                      className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                    <Minus className="h-4 w-4 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.interestRange.max === 50 ? "" : filters.interestRange.max}
                      onChange={(e) =>
                        updateFilter("interestRange", {
                          ...filters.interestRange,
                          max: Number(e.target.value) || 50,
                        })
                      }
                      className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Aktif Krediler"
          value={summaryMetrics.activeCredits.toString()}
          subtitle={`${summaryMetrics.totalCredits} toplam kredi`}
          color="blue"
          icon={<CreditCard />}
        />
        <MetricCard
          title="Toplam Borç"
          value={formatCurrency(summaryMetrics.totalDebt)}
          subtitle="Kalan borç miktarı"
          color="emerald"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Aylık Ödeme"
          value={formatCurrency(summaryMetrics.monthlyPayment)}
          subtitle="Toplam aylık taksit"
          color="purple"
          icon={<Wallet />}
        />
        <MetricCard
          title="Ödeme Performansı"
          value={formatPercent(summaryMetrics.paymentPerformance / 100)}
          subtitle={`${summaryMetrics.overduePayments} geciken ödeme`}
          color="orange"
          icon={<Target />}
        />
      </div>

      {/* Premium Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Eye className="h-4 w-4" />
                <span className="font-medium">Genel Bakış</span>
              </TabsTrigger>
              <TabsTrigger
                value="trends"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Trendler</span>
              </TabsTrigger>
              <TabsTrigger
                value="distribution"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <PieChart className="h-4 w-4" />
                <span className="font-medium">Dağılım</span>
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Activity className="h-4 w-4" />
                <span className="font-medium">Performans</span>
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Target className="h-4 w-4" />
                <span className="font-medium">Analiz</span>
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Karşılaştırma</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      12 Aylık Ödeme Trendi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={chartData.monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          formatter={(value: any, name: string) => [
                            formatCurrency(value),
                            name === "toplam"
                              ? "Toplam"
                              : name === "odenen"
                                ? "Ödenen"
                                : name === "bekleyen"
                                  ? "Bekleyen"
                                  : "Geciken",
                          ]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #E5E7EB",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="odenen" fill="#10B981" name="Ödenen" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="bekleyen" fill="#F59E0B" name="Bekleyen" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="geciken" fill="#EF4444" name="Geciken" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="toplam" stroke="#3B82F6" strokeWidth={3} name="Toplam" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-900 dark:to-emerald-950">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                      Ödeme Durumu Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={chartData.paymentStatusDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={50}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.paymentStatusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [value, "Ödeme Sayısı"]} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Premium Insight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <CardContent className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <TrendingUp className="h-8 w-8 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">
                        Pozitif
                      </Badge>
                    </div>
                    <h3 className="font-bold text-2xl mb-3">Ödeme Performansı</h3>
                    <p className="text-4xl font-black mb-4">{formatPercent(summaryMetrics.paymentPerformance / 100)}</p>
                    <p className="text-sm text-emerald-100 leading-relaxed">
                      Son 6 ayda{" "}
                      <span className="font-semibold text-white">
                        {filteredPayments.filter((p) => p.status === "paid").length}
                      </span>{" "}
                      başarılı ödeme gerçekleştirildi
                    </p>
                    <div className="mt-6 w-full h-2 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-2 bg-white rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${summaryMetrics.paymentPerformance}%` }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 text-white shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <CardContent className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <DollarSign className="h-8 w-8 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">
                        Stabil
                      </Badge>
                    </div>
                    <h3 className="font-bold text-2xl mb-3">Ortalama Faiz</h3>
                    <p className="text-4xl font-black mb-4">%{summaryMetrics.averageInterest.toFixed(1)}</p>
                    <p className="text-sm text-blue-100 leading-relaxed">
                      Piyasa ortalamasının{" "}
                      <span
                        className={`font-semibold ${summaryMetrics.averageInterest > 15 ? "text-red-200" : "text-green-200"}`}
                      >
                        {summaryMetrics.averageInterest > 15 ? "üzerinde" : "altında"}
                      </span>
                    </p>
                    <div className="mt-6 flex items-center gap-2">
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-white rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${Math.min((summaryMetrics.averageInterest / 30) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-blue-200">30%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 via-pink-600 to-rose-700 text-white shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                  <CardContent className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Wallet className="h-8 w-8 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-3 py-1">Aktif</Badge>
                    </div>
                    <h3 className="font-bold text-2xl mb-3">Aylık Yük</h3>
                    <p className="text-4xl font-black mb-4">{formatCurrency(summaryMetrics.monthlyPayment)}</p>
                    <p className="text-sm text-purple-100 leading-relaxed">
                      <span className="font-semibold text-white">{summaryMetrics.activeCredits}</span> aktif krediden
                      toplam aylık ödeme
                    </p>
                    <div className="mt-6 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <div className="text-xs text-purple-200 mb-1">Min</div>
                        <div className="h-1 bg-white/30 rounded"></div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-purple-200 mb-1">Mevcut</div>
                        <div className="h-1 bg-white rounded"></div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-purple-200 mb-1">Max</div>
                        <div className="h-1 bg-white/30 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="trends" className="space-y-6 mt-0">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    Detaylı Trend Analizi
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">12 aylık ödeme performansı ve trend analizi</p>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          formatCurrency(value),
                          name === "odenen" ? "Ödenen" : "Bekleyen",
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
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
                      />
                      <Area
                        type="monotone"
                        dataKey="bekleyen"
                        stroke="#F59E0B"
                        fillOpacity={1}
                        fill="url(#colorBekleyen)"
                        strokeWidth={2}
                      />
                      <ReferenceLine
                        y={summaryMetrics.monthlyPayment}
                        stroke="#EF4444"
                        strokeDasharray="5 5"
                        label="Hedef Aylık Ödeme"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-blue-50 dark:from-gray-900 dark:to-blue-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      Banka Bazında Dağılım
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={chartData.bankDistribution.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          formatter={(value: any, name: string) => [
                            name === "value" ? formatCurrency(value) : value,
                            name === "value" ? "Borç Tutarı" : name === "count" ? "Kredi Sayısı" : "Aylık Ödeme",
                          ]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #E5E7EB",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-900 dark:to-emerald-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                      <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      Kredi Türü Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <RechartsPieChart>
                        <Pie
                          data={chartData.creditTypeDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          innerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.creditTypeDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [formatCurrency(value), "Borç Tutarı"]} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-0">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-orange-50 dark:from-gray-900 dark:to-orange-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    Ödeme Performans Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-6 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg">
                      <div className="text-4xl font-bold mb-2">
                        {formatPercent(summaryMetrics.paymentPerformance / 100)}
                      </div>
                      <div className="text-sm font-medium">Genel Performans</div>
                      <div className="text-xs mt-2 opacity-90">
                        {filteredPayments.filter((p) => p.status === "paid").length} / {filteredPayments.length} ödeme
                      </div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl shadow-lg">
                      <div className="text-4xl font-bold mb-2">{summaryMetrics.overduePayments}</div>
                      <div className="text-sm font-medium">Geciken Ödemeler</div>
                      <div className="text-xs mt-2 opacity-90">
                        {formatCurrency(
                          filteredPayments
                            .filter((p) => p.status === "overdue")
                            .reduce((sum, p) => sum + (p.total_payment || 0), 0),
                        )}
                      </div>
                    </div>
                    <div className="text-center p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg">
                      <div className="text-4xl font-bold mb-2">{summaryMetrics.upcomingPayments}</div>
                      <div className="text-sm font-medium">Yaklaşan Ödemeler</div>
                      <div className="text-xs mt-2 opacity-90">Sonraki 7 gün</div>
                    </div>
                  </div>

                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData.monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" tickFormatter={(value) => `${value}%`} />
                      <Tooltip
                        formatter={(value: any, name: string) => [`${value.toFixed(1)}%`, "Ödeme Oranı"]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={(data: any) => (data.toplam > 0 ? (data.odenen / data.toplam) * 100 : 0)}
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                        name="Ödeme Oranı"
                      />
                      <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="5 5" label="Hedef %80" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6 mt-0">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-purple-50 dark:from-gray-900 dark:to-purple-950">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl dark:text-white">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    Faiz Oranı Analizi
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">
                    Kredilerinizin faiz oranları ve piyasa karşılaştırması
                  </p>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData.interestAnalysis.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="bank" stroke="#6B7280" fontSize={12} />
                      <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => `%${value}`} />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          name === "rate" ? `%${value}` : formatCurrency(value),
                          name === "rate" ? "Faiz Oranı" : name === "amount" ? "Borç Tutarı" : "Aylık Faiz",
                        ]}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Bar dataKey="rate" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
                        <Building2 className="h-5 w-5 text-white" />
                      </div>
                      Banka Karşılaştırması
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chartData.bankDistribution.slice(0, 5).map((bank, index) => (
                        <div
                          key={bank.name}
                          className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border dark:border-gray-700 shadow-sm"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
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
                            <div className="font-bold text-lg dark:text-white">{formatCurrency(bank.value)}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              Ort. %{bank.averageInterest.toFixed(1)} faiz
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-green-50 dark:from-gray-900 dark:to-green-950">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg dark:text-white">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                        <Wallet className="h-5 w-5 text-white" />
                      </div>
                      Aylık Ödeme Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.bankDistribution.slice(0, 6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(value), "Aylık Ödeme"]}
                          contentStyle={{
                            backgroundColor: "white",
                            border: "1px solid #E5E7EB",
                            borderRadius: "12px",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Bar dataKey="monthlyPayment" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Premium Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Yaklaşan Ödemeler</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(
                    filteredPayments
                      .filter((p) => {
                        const dueDate = new Date(p.due_date)
                        const nextWeek = new Date()
                        nextWeek.setDate(nextWeek.getDate() + 7)
                        return p.status === "pending" && dueDate <= nextWeek
                      })
                      .reduce((sum, p) => sum + (p.total_payment || 0), 0),
                  )}
                </p>
                <p className="text-blue-200 text-xs mt-1">
                  {
                    filteredPayments.filter((p) => {
                      const dueDate = new Date(p.due_date)
                      const nextWeek = new Date()
                      nextWeek.setDate(nextWeek.getDate() + 7)
                      return p.status === "pending" && dueDate <= nextWeek
                    }).length
                  }{" "}
                  taksit
                </p>
              </div>
              <div className="bg-blue-500/30 p-3 rounded-full">
                <Clock className="h-6 w-6 text-blue-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-red-500 to-rose-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Geciken Ödemeler</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(
                    filteredPayments
                      .filter((p) => p.status === "overdue")
                      .reduce((sum, p) => sum + (p.total_payment || 0), 0),
                  )}
                </p>
                <p className="text-red-200 text-xs mt-1">
                  {filteredPayments.filter((p) => p.status === "overdue").length} gecikmiş taksit
                </p>
              </div>
              <div className="bg-red-500/30 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-100" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Finansal Özet</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(summaryMetrics.totalPaidAmount)}</p>
                <p className="text-emerald-200 text-xs mt-1">Toplam Ödenen</p>
              </div>
              <div className="bg-emerald-500/30 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-emerald-100" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
