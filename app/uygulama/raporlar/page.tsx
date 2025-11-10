"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
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
const ReferenceLine = dynamic(() => import("recharts").then((mod) => ({ default: mod.ReferenceLine as any })), { ssr: false })

// Professional emerald-teal gradient color palette
const COLORS = [
  "#10B981", // emerald-500
  "#14B8A6", // teal-500
  "#06B6D4", // cyan-500
  "#059669", // emerald-600
  "#0D9488", // teal-600
  "#0891B2", // cyan-600
  "#34D399", // emerald-400
  "#2DD4BF", // teal-400
]

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

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
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
            <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-black/10 rounded-full flex items-center justify-center">
              <BarChart3 className="h-10 w-10 text-gray-400 dark:text-white/60" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Henüz Veri Yok</h2>
          <p className="text-gray-600 dark:text-white/60 mb-6">
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
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 dark:from-emerald-600 dark:to-teal-700 text-white border-0 shadow-2xl rounded-3xl">
        {/* Background Decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
        </div>

        <CardContent className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full px-4 py-2 mb-4">
                <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
                <span className="text-white/90 text-xs font-medium">Premium Finansal Raporlama</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4 flex items-center gap-4 tracking-tight">
                <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl">
                  <BarChart3 className="h-10 w-10" />
                </div>
                Finansal Analiz Merkezi
              </h2>
              <p className="text-white/90 text-lg leading-relaxed max-w-2xl">
                Yapay zeka destekli detaylı kredi analizi, gelişmiş grafikler ve akıllı öngörülerle finansal durumunuzu 360° takip edin
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-1">{summaryMetrics.totalCredits}</div>
                  <div className="text-white/80 text-xs">Toplam Kredi</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-1">{formatPercent(summaryMetrics.paymentPerformance / 100)}</div>
                  <div className="text-white/80 text-xs">Başarı Oranı</div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
                  <div className="text-3xl font-bold mb-1">{summaryMetrics.activeCredits}</div>
                  <div className="text-white/80 text-xs">Aktif Kredi</div>
                </div>
              </div>
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
                  <Button
                    variant="outline"
                    size="lg"
                    className="bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 px-8 py-6 text-base font-semibold shadow-lg hover:shadow-xl"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    PDF Rapor İndir
                  </Button>
                }
              />
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Stats Cards - Emerald-Teal Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                {summaryMetrics.activeCredits} aktif
              </Badge>
            </div>
            <div className="text-white">
              <div className="text-4xl font-black mb-2">{summaryMetrics.totalCredits}</div>
              <div className="text-white/90 font-medium mb-1">Toplam Kredi</div>
              <div className="text-white/70 text-xs">Sistemdeki toplam kredi sayınız</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-teal-600 dark:from-teal-600 dark:to-teal-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-white/90">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="text-white">
              <div className="text-3xl font-black mb-2">{formatCurrency(summaryMetrics.totalDebt)}</div>
              <div className="text-white/90 font-medium mb-1">Toplam Borç</div>
              <div className="text-white/70 text-xs">Kalan toplam borç tutarı</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                <Target className="h-6 w-6 text-white" />
              </div>
              <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                {summaryMetrics.paymentPerformance >= 80 ? "Mükemmel" : summaryMetrics.paymentPerformance >= 60 ? "İyi" : "Geliştirilmeli"}
              </Badge>
            </div>
            <div className="text-white">
              <div className="text-4xl font-black mb-2">{formatPercent(summaryMetrics.paymentPerformance / 100)}</div>
              <div className="text-white/90 font-medium mb-1">Ödeme Performansı</div>
              <div className="text-white/70 text-xs">Zamanında ödeme başarı oranı</div>
            </div>
            <div className="mt-4 w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${summaryMetrics.paymentPerformance}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8 blur-2xl" />
          <CardContent className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-xl rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-white/90">
                {summaryMetrics.upcomingPayments > 0 && <AlertTriangle className="h-4 w-4" />}
              </div>
            </div>
            <div className="text-white">
              <div className="text-4xl font-black mb-2">{summaryMetrics.upcomingPayments}</div>
              <div className="text-white/90 font-medium mb-1">Yaklaşan Ödemeler</div>
              <div className="text-white/70 text-xs">Sonraki 7 gün içinde</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Filters */}
      <Card className="shadow-xl border-0 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-emerald-950 dark:to-emerald-900/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl dark:text-white">Akıllı Filtreler</CardTitle>
                <p className="text-sm text-gray-500 dark:text-white/60 mt-1">Verilerinizi detaylı analiz edin</p>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-white/60" />
              <Input
                placeholder="Banka veya kredi türü ara..."
                value={filters.searchTerm}
                onChange={(e) => updateFilter("searchTerm", e.target.value)}
                className="pl-10 h-11 bg-white dark:bg-black/10 border border-gray-200 dark:border-white/10 focus-visible:border-emerald-500 dark:focus-visible:border-emerald-400 focus-visible:shadow-[0_0_0_0.5px_rgb(16,185,129)] dark:focus-visible:shadow-[0_0_0_0.5px_rgb(52,211,153)] transition-all duration-200 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-white/50"
                autoComplete="off"
                spellCheck="false"
              />
            </div>

            {/* Date Range */}
            <Select
              value={filters.dateRange.preset}
              onValueChange={(value) => updateFilter("dateRange", { ...filters.dateRange, preset: value })}
            >
              <SelectTrigger className="h-11 bg-white dark:bg-black/10 border-gray-200 dark:border-white/10 dark:text-white">
                <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-white/60" />
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
                  className="justify-start h-11 bg-white dark:bg-black/10 border-gray-200 dark:border-white/10 dark:text-white"
                >
                  <Building2 className="h-4 w-4 mr-2 text-gray-500 dark:text-white/60" />
                  Bankalar {filters.banks.length > 0 && `(${filters.banks.length})`}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 dark:bg-black/10 dark:border-white/10">
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
                        <Label htmlFor={`bank-${bank}`} className="text-sm cursor-pointer flex-1 dark:text-white/70">
                          {bank}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Stats */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600 dark:text-white/70 bg-gradient-to-r from-gray-50 to-slate-100 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-lg px-4 py-2">
              <div className="flex items-center gap-1">
                <CreditCard className="h-4 w-4" />
                <span>{filteredCredits.length} kredi</span>
              </div>
              <div className="w-px h-4 bg-gray-300 dark:bg-white/30"></div>
              <div className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span>{filteredPayments.length} ödeme</span>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {expandedFilters && (
            <div className="border-t dark:border-white/10 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Credit Type Filter */}
                <div className="space-y-3">
                  <Label className="font-medium dark:text-white">Kredi Türleri</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
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
                        <Label htmlFor={`type-${type}`} className="text-sm cursor-pointer dark:text-white/70">
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
                      className="flex-1 dark:bg-black/10 dark:border-white/10 dark:text-white"
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
                      className="flex-1 dark:bg-black/10 dark:border-white/10 dark:text-white"
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
                      className="flex-1 dark:bg-black/10 dark:border-white/10 dark:text-white"
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
                      className="flex-1 dark:bg-black/10 dark:border-white/10 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    
      {/* Premium Tabs */}
      <div className="bg-white dark:bg-black/20 rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-emerald-900/10">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Eye className="h-4 w-4" />
                <span className="font-medium">Genel Bakış</span>
              </TabsTrigger>
              <TabsTrigger
                value="trends"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Trendler</span>
              </TabsTrigger>
              <TabsTrigger
                value="distribution"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <PieChart className="h-4 w-4" />
                <span className="font-medium">Dağılım</span>
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Activity className="h-4 w-4" />
                <span className="font-medium">Performans</span>
              </TabsTrigger>
              <TabsTrigger
                value="analysis"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Target className="h-4 w-4" />
                <span className="font-medium">Analiz</span>
              </TabsTrigger>
              <TabsTrigger
                value="comparison"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 dark:data-[state=active]:text-emerald-400 data-[state=active]:bg-white dark:data-[state=active]:bg-emerald-900/20 data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60"
              >
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Karşılaştırma</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="overview" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="relative overflow-hidden shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold">12 Aylık Ödeme Trendi</div>
                        <div className="text-xs text-gray-500 dark:text-white/60 font-normal mt-1">
                          Aylık ödeme dağılım analizi
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <ResponsiveContainer width="100%" height={320}>
                      <ComposedChart data={chartData.monthlyTrend}>
                        <defs>
                          <linearGradient id="colorOdenen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="colorBekleyen" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="colorGeciken" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                        <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                        <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(value) => formatCurrency(value)} width={80} />
                        <Tooltip
                          formatter={((value: number | string, name: string) => [
                            formatCurrency(Number(value)),
                            name === "toplam"
                              ? "Toplam"
                              : name === "odenen"
                                ? "Ödenen"
                                : name === "bekleyen"
                                  ? "Bekleyen"
                                  : "Geciken",
                          ]) as any}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "16px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            padding: "12px",
                          }}
                        />
                        <Legend
                          {...({ wrapperStyle: { paddingTop: "20px" }, iconType: "circle" } as any)}
                        />
                        <Bar dataKey="odenen" fill="url(#colorOdenen)" name="Ödenen" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="bekleyen" fill="url(#colorBekleyen)" name="Bekleyen" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="geciken" fill="url(#colorGeciken)" name="Geciken" radius={[8, 8, 0, 0]} />
                        <Line
                          type="monotone"
                          dataKey="toplam"
                          stroke="#3B82F6"
                          strokeWidth={3}
                          name="Toplam"
                          dot={{ fill: "#3B82F6", strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                        <PieChart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold">Ödeme Durumu Dağılımı</div>
                        <div className="text-xs text-gray-500 dark:text-white/60 font-normal mt-1">
                          Tüm ödemelerin durum analizi
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsPieChart>
                        <defs>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                          </filter>
                        </defs>
                        <Pie
                          data={chartData.paymentStatusDistribution}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          innerRadius={60}
                          paddingAngle={3}
                          dataKey="value"
                          label={(({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`) as any}
                          labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                          filter="url(#shadow)"
                        >
                          {chartData.paymentStatusDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              className="hover:opacity-80 transition-opacity duration-300"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={((value: number) => [value, "Ödeme Sayısı"]) as any}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "16px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            padding: "12px",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {chartData.paymentStatusDistribution.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 dark:text-white/60">{entry.name}</div>
                            <div className="font-bold text-sm dark:text-white">{entry.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
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

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-2xl">
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
                    <p className="text-sm text-white/80 leading-relaxed">
                      Piyasa ortalamasının{" "}
                      <span
                        className={`font-semibold ${summaryMetrics.averageInterest > 15 ? "text-white" : "text-white"}`}
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
                      <span className="text-xs text-white/70">30%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-teal-500 via-cyan-600 to-emerald-700 text-white shadow-2xl">
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
              <Card className="shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl dark:text-white">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="font-bold">Detaylı Trend Analizi</div>
                      <div className="text-sm text-gray-500 dark:text-white/60 font-normal mt-1">
                        12 aylık ödeme performansı ve trend grafiği
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ResponsiveContainer width="100%" height={450}>
                    <AreaChart data={chartData.monthlyTrend}>
                      <defs>
                        <linearGradient id="colorOdenenTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="colorBekleyenTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={11} />
                      <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(value) => formatCurrency(value)} width={90} />
                      <Tooltip
                        formatter={((value: number | string, name: string) => [
                          formatCurrency(Number(value)),
                          name === "odenen" ? "Ödenen" : "Bekleyen",
                        ]) as any}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid #E5E7EB",
                          borderRadius: "16px",
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                          padding: "12px",
                        }}
                      />
                      <Legend {...({ wrapperStyle: { paddingTop: "20px" }, iconType: "circle" } as any)} />
                      <Area
                        type="monotone"
                        dataKey="odenen"
                        stroke="#10B981"
                        fillOpacity={1}
                        fill="url(#colorOdenenTrend)"
                        strokeWidth={3}
                        name="Ödenen"
                      />
                      <Area
                        type="monotone"
                        dataKey="bekleyen"
                        stroke="#F59E0B"
                        fillOpacity={1}
                        fill="url(#colorBekleyenTrend)"
                        strokeWidth={3}
                        name="Bekleyen"
                      />
                      <ReferenceLine
                        {...({ y: summaryMetrics.monthlyPayment, stroke: "#EF4444", strokeDasharray: "5 5", strokeWidth: 2, label: { value: "Hedef Aylık Ödeme", fill: "#EF4444", fontSize: 12 } } as any)}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* Trend Insights */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-100 dark:border-white/10">
                      <div className="text-sm text-gray-600 dark:text-white/70 mb-1">Toplam Ödenen</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(chartData.monthlyTrend.reduce((sum, m) => sum + m.odenen, 0))}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl border border-amber-100 dark:border-white/10">
                      <div className="text-sm text-gray-600 dark:text-white/70 mb-1">Toplam Bekleyen</div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(chartData.monthlyTrend.reduce((sum, m) => sum + m.bekleyen, 0))}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 rounded-xl border border-cyan-100 dark:border-white/10">
                      <div className="text-sm text-gray-600 dark:text-white/70 mb-1">Ortalama Aylık</div>
                      <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(chartData.monthlyTrend.reduce((sum, m) => sum + m.toplam, 0) / 12)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribution" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold">Banka Bazında Dağılım</div>
                        <div className="text-xs text-gray-500 dark:text-white/60 font-normal mt-1">
                          Top {Math.min(8, chartData.bankDistribution.length)} banka
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <ResponsiveContainer width="100%" height={380}>
                      <BarChart data={chartData.bankDistribution.slice(0, 8)}>
                        <defs>
                          <linearGradient id="bankGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#059669" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={11} angle={-45} textAnchor="end" height={80} />
                        <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(value) => formatCurrency(value)} width={90} />
                        <Tooltip
                          formatter={((value: number | string, name: string) => [
                            name === "value" ? formatCurrency(Number(value)) : value,
                            name === "value" ? "Borç Tutarı" : name === "count" ? "Kredi Sayısı" : "Aylık Ödeme",
                          ]) as any}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "16px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            padding: "12px",
                          }}
                        />
                        <Bar dataKey="value" fill="url(#bankGradient)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Top Banks Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {chartData.bankDistribution.slice(0, 2).map((bank, idx) => (
                        <div key={idx} className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-100 dark:border-white/10">
                          <div className="flex items-center gap-2 mb-2">
                            <BankLogo bankName={bank.fullName || bank.name} logoUrl={bank.logoUrl ?? undefined} size="sm" />
                            <div className="text-xs font-semibold text-gray-700 dark:text-white truncate">{bank.name}</div>
                          </div>
                          <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(bank.value)}</div>
                          <div className="text-xs text-gray-500 dark:text-white/60">{bank.count} kredi</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold">Kredi Türü Dağılımı</div>
                        <div className="text-xs text-gray-500 dark:text-white/60 font-normal mt-1">
                          Tür bazında borç analizi
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <ResponsiveContainer width="100%" height={320}>
                      <RechartsPieChart>
                        <defs>
                          <filter id="shadow2" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                          </filter>
                        </defs>
                        <Pie
                          data={chartData.creditTypeDistribution as any}
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          innerRadius={60}
                          paddingAngle={4}
                          dataKey="value"
                          label={(({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`) as any}
                          labelLine={{ stroke: "#94A3B8", strokeWidth: 1 }}
                          filter="url(#shadow2)"
                        >
                          {chartData.creditTypeDistribution.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              className="hover:opacity-80 transition-opacity duration-300"
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={((value: number) => [formatCurrency(value), "Borç Tutarı"]) as any}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "16px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            padding: "12px",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>

                    {/* Credit Type Stats */}
                    <div className="mt-4 space-y-2">
                      {chartData.creditTypeDistribution.slice(0, 3).map((type, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-white/5 dark:to-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                          <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <div>
                              <div className="text-sm font-semibold text-gray-700 dark:text-white">{type.name}</div>
                              <div className="text-xs text-gray-500 dark:text-white/60">{type.count} kredi</div>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(type.value)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6 mt-0">
              <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-orange-50 dark:from-emerald-950 dark:to-orange-950">
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
                    <div className="text-center p-6 bg-gradient-to-br from-cyan-500 to-teal-600 text-white rounded-xl shadow-lg">
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
                        formatter={((value: number | string, name: string) => [`${Number(value).toFixed(1)}%`, "Ödeme Oranı"]) as any}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "12px",
                          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={(data: { toplam: number; odenen: number }) => (data.toplam > 0 ? (data.odenen / data.toplam) * 100 : 0)}
                        stroke="#10B981"
                        strokeWidth={3}
                        dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                        name="Ödeme Oranı"
                      />
                      <ReferenceLine {...({ y: 80, stroke: "#F59E0B", strokeDasharray: "5 5", label: "Hedef %80" } as any)} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6 mt-0">
              <Card className="shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-2xl dark:text-white">
                    <div className="p-3 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-xl shadow-lg">
                      <Target className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <div className="font-bold">Faiz Oranı Analizi</div>
                      <div className="text-sm text-gray-500 dark:text-white/60 font-normal mt-1">
                        Kredilerinizin faiz oranları ve piyasa karşılaştırması
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ResponsiveContainer width="100%" height={450}>
                    <BarChart data={chartData.interestAnalysis.slice(0, 10)}>
                      <defs>
                        <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.9} />
                          <stop offset="95%" stopColor="#0891B2" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                      <XAxis dataKey="bank" stroke="#6B7280" fontSize={11} angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(value) => `%${value}`} />
                      <Tooltip
                        formatter={((value: number | string, name: string) => [
                          name === "rate" ? `%${value}` : formatCurrency(Number(value)),
                          name === "rate" ? "Faiz Oranı" : name === "amount" ? "Borç Tutarı" : "Aylık Faiz",
                        ]) as any}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid #E5E7EB",
                          borderRadius: "16px",
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                          padding: "12px",
                        }}
                      />
                      <Bar dataKey="rate" fill="url(#interestGradient)" radius={[8, 8, 0, 0]} />
                      <ReferenceLine
                        {...({ y: summaryMetrics.averageInterest, stroke: "#EF4444", strokeDasharray: "5 5", strokeWidth: 2, label: { value: `Ortalama %${summaryMetrics.averageInterest.toFixed(1)}`, fill: "#EF4444", fontSize: 12 } } as any)}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Interest Analysis Stats */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-100 dark:border-white/10">
                      <div className="text-sm text-gray-600 dark:text-white/70 mb-1">En Düşük Faiz</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        %{Math.min(...chartData.interestAnalysis.map(i => i.rate)).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/60 mt-1">
                        {chartData.interestAnalysis.find(i => i.rate === Math.min(...chartData.interestAnalysis.map(x => x.rate)))?.bank || '-'}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 rounded-xl border border-teal-100 dark:border-white/10">
                      <div className="text-sm text-gray-600 dark:text-white/70 mb-1">En Yüksek Faiz</div>
                      <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                        %{Math.max(...chartData.interestAnalysis.map(i => i.rate)).toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/60 mt-1">
                        {chartData.interestAnalysis.find(i => i.rate === Math.max(...chartData.interestAnalysis.map(x => x.rate)))?.bank || '-'}
                      </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-cyan-50 to-emerald-50 dark:from-cyan-950/30 dark:to-emerald-950/30 rounded-xl border border-cyan-100 dark:border-white/10">
                      <div className="text-sm text-gray-600 dark:text-white/70 mb-1">Toplam Aylık Faiz</div>
                      <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                        {formatCurrency(chartData.interestAnalysis.reduce((sum, i) => sum + i.monthlyInterest, 0))}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-white/60 mt-1">Tüm krediler</div>
                    </div>
                  </div>

                  {/* Top Interest Rates List */}
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">En Yüksek Faizli Krediler</h4>
                    <div className="space-y-2">
                      {chartData.interestAnalysis.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-white/5 dark:to-white/5 rounded-xl border border-gray-100 dark:border-white/10 hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                              {idx + 1}
                            </div>
                            <BankLogo bankName={item.fullBankName || item.bank} logoUrl={item.logoUrl ?? undefined} size="sm" />
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 dark:text-white">{item.bank}</div>
                              <div className="text-sm text-gray-500 dark:text-white/60">{item.creditType}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">%{item.rate.toFixed(1)}</div>
                            <div className="text-xs text-gray-500 dark:text-white/60">{formatCurrency(item.amount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold">Banka Karşılaştırması</div>
                        <div className="text-xs text-gray-500 dark:text-white/60 font-normal mt-1">
                          Top 5 banka detaylı analiz
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-3">
                      {chartData.bankDistribution.slice(0, 5).map((bank, index) => (
                        <div
                          key={bank.name}
                          className="group relative overflow-hidden p-5 bg-gradient-to-r from-gray-50 via-slate-50 to-gray-50 dark:from-white/5 dark:via-white/10 dark:to-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white shadow-lg">
                                {index + 1}
                              </div>
                              <div className="flex items-center gap-3">
                                <BankLogo bankName={bank.fullName || bank.name} logoUrl={bank.logoUrl ?? undefined} size="md" />
                                <div>
                                  <div className="font-bold text-gray-900 dark:text-white text-lg">{bank.name}</div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm text-gray-500 dark:text-white/60">{bank.count} kredi</span>
                                    <span className="text-xs px-2 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 rounded-full font-medium">
                                      Ort. %{bank.averageInterest.toFixed(1)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-black text-2xl text-gray-900 dark:text-white">{formatCurrency(bank.value)}</div>
                              <div className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                                Aylık {formatCurrency(bank.monthlyPayment)}
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-4 w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-1000"
                              style={{ width: `${(bank.value / chartData.bankDistribution[0].value) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/40 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl dark:text-white">
                      <div className="p-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl shadow-lg">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <div className="font-bold">Aylık Ödeme Dağılımı</div>
                        <div className="text-xs text-gray-500 dark:text-white/60 font-normal mt-1">
                          Bankalar arası aylık yük karşılaştırması
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <ResponsiveContainer width="100%" height={360}>
                      <BarChart data={chartData.bankDistribution.slice(0, 6)}>
                        <defs>
                          <linearGradient id="monthlyPaymentGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.9} />
                            <stop offset="95%" stopColor="#0D9488" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" strokeOpacity={0.5} />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={11} angle={-30} textAnchor="end" height={70} />
                        <YAxis stroke="#6B7280" fontSize={11} tickFormatter={(value) => formatCurrency(value)} width={80} />
                        <Tooltip
                          formatter={((value: number) => [formatCurrency(value), "Aylık Ödeme"]) as any}
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid #E5E7EB",
                            borderRadius: "16px",
                            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                            padding: "12px",
                          }}
                        />
                        <Bar dataKey="monthlyPayment" fill="url(#monthlyPaymentGradient)" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>

                    {/* Monthly Payment Summary */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl border border-emerald-100 dark:border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-600 dark:text-white/70">Toplam Aylık Ödeme</div>
                          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                            {formatCurrency(chartData.bankDistribution.reduce((sum, b) => sum + b.monthlyPayment, 0))}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 dark:text-white/70">Yıllık Toplam</div>
                          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-1">
                            {formatCurrency(chartData.bankDistribution.reduce((sum, b) => sum + b.monthlyPayment, 0) * 12)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Premium Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-xl border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">Yaklaşan Ödemeler</p>
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
                <p className="text-white/70 text-xs mt-1">
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
              <div className="bg-white/20 p-3 rounded-full">
                <Clock className="h-6 w-6 text-white/80" />
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
