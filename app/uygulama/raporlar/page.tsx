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
  Minus,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { tr } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getAllPayments } from "@/lib/api/payments"
import { getCreditCards } from "@/lib/api/credit-cards"
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

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#F97316", "#84CC16"]

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
}

export default function RaporlarPage() {
  const { user, loading: authLoading } = useAuth()
  const [credits, setCredits] = useState<PopulatedCredit[]>([])
  const [payments, setPayments] = useState<PopulatedPayment[]>([])
  const [creditCards, setCreditCards] = useState<any[]>([])
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
  })

  const [activeTab, setActiveTab] = useState("dashboard")
  const [expandedFilters, setExpandedFilters] = useState(false)

  const fetchData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      const [creditsData, paymentsData, creditCardsData] = await Promise.all([
        getCredits(user.id) as Promise<PopulatedCredit[]>,
        getAllPayments(user.id, 24, 12) as Promise<PopulatedPayment[]>,
        getCreditCards(user.id).catch(() => []),
      ])

      setCredits(creditsData || [])
      setPayments(paymentsData || [])
      setCreditCards(creditCardsData || [])
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
        } else {
          acc.push({
            name: shortName,
            value: credit.remaining_debt || 0,
            count: 1,
            monthlyPayment: credit.monthly_payment || 0,
            averageInterest: credit.interest_rate || 0,
          })
        }
        return acc
      }, [])
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
        monthlyInterest: ((credit.remaining_debt || 0) * (credit.interest_rate || 0)) / 1200,
        creditType: credit.credit_types?.name || "Diğer",
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
    })
  }

  if (authLoading || loading) {
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
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tekrar Dene
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <BarChart3 className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Finansal Raporlar</h1>
                  <p className="text-blue-100 text-lg">Detaylı analiz ve performans değerlendirmesi</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{summaryMetrics.totalCredits}</div>
                  <div className="text-sm text-blue-100">Toplam Kredi</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{formatCurrency(summaryMetrics.totalDebt)}</div>
                  <div className="text-sm text-blue-100">Toplam Borç</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{formatPercent(summaryMetrics.paymentPerformance / 100)}</div>
                  <div className="text-sm text-blue-100">Ödeme Performansı</div>
                </div>
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div className="text-2xl font-bold">{summaryMetrics.upcomingPayments}</div>
                  <div className="text-sm text-blue-100">Yaklaşan Ödemeler</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
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
                    // Alternatif alan isimleri de ekleyelim
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
                  creditCards: creditCards || [],
                  summary: {
                    name: user?.full_name || "Kullanıcı",
                    email: user?.email || "email@example.com",
                  },
                }}
                trigger={
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    PDF Rapor İndir
                  </Button>
                }
              />
              <Button
                variant="secondary"
                size="lg"
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Settings className="h-5 w-5 mr-2" />
                Rapor Ayarları
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              Gelişmiş Filtreler
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sıfırla
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setExpandedFilters(!expandedFilters)}>
                {expandedFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            {/* Date Range */}
            <Select
              value={filters.dateRange.preset}
              onValueChange={(value) => updateFilter("dateRange", { ...filters.dateRange, preset: value })}
            >
              <SelectTrigger>
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
                <Button variant="outline" className="justify-start bg-transparent">
                  <Building2 className="h-4 w-4 mr-2" />
                  Bankalar ({filters.banks.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-banks"
                      checked={filters.banks.length === 0}
                      onCheckedChange={() => updateFilter("banks", [])}
                    />
                    <Label htmlFor="all-banks">Tüm Bankalar</Label>
                  </div>
                  {filterOptions.banks.map((bank) => (
                    <div key={bank} className="flex items-center space-x-2">
                      <Checkbox
                        id={`bank-${bank}`}
                        checked={filters.banks.includes(bank)}
                        onCheckedChange={(checked) => {
                          const newBanks = checked ? [...filters.banks, bank] : filters.banks.filter((b) => b !== bank)
                          updateFilter("banks", newBanks)
                        }}
                      />
                      <Label htmlFor={`bank-${bank}`}>{bank}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Credit Type Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start bg-transparent">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Kredi Türü ({filters.creditTypes.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-types"
                      checked={filters.creditTypes.length === 0}
                      onCheckedChange={() => updateFilter("creditTypes", [])}
                    />
                    <Label htmlFor="all-types">Tüm Türler</Label>
                  </div>
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
                      <Label htmlFor={`type-${type}`}>{type}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start bg-transparent">
                  <Activity className="h-4 w-4 mr-2" />
                  Durum ({filters.status.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-status"
                      checked={filters.status.length === 0}
                      onCheckedChange={() => updateFilter("status", [])}
                    />
                    <Label htmlFor="all-status">Tüm Durumlar</Label>
                  </div>
                  {filterOptions.statuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={filters.status.includes(status)}
                        onCheckedChange={(checked) => {
                          const newStatus = checked
                            ? [...filters.status, status]
                            : filters.status.filter((s) => s !== status)
                          updateFilter("status", newStatus)
                        }}
                      />
                      <Label htmlFor={`status-${status}`}>
                        {status === "active" ? "Aktif" : status === "closed" ? "Kapalı" : "Gecikmiş"}
                      </Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Quick Stats */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{filteredCredits.length} kredi</span>
              <span>•</span>
              <span>{filteredPayments.length} ödeme</span>
            </div>
          </div>

          {expandedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <Label className="text-sm font-medium mb-2 block">Tutar Aralığı</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.amountRange.min}
                    onChange={(e) =>
                      updateFilter("amountRange", {
                        ...filters.amountRange,
                        min: Number(e.target.value),
                      })
                    }
                    className="w-24"
                  />
                  <Minus className="h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.amountRange.max}
                    onChange={(e) =>
                      updateFilter("amountRange", {
                        ...filters.amountRange,
                        max: Number(e.target.value),
                      })
                    }
                    className="w-24"
                  />
                  <span className="text-sm text-gray-500">TL</span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Faiz Oranı Aralığı</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={filters.interestRange.min}
                    onChange={(e) =>
                      updateFilter("interestRange", {
                        ...filters.interestRange,
                        min: Number(e.target.value),
                      })
                    }
                    className="w-20"
                  />
                  <Minus className="h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={filters.interestRange.max}
                    onChange={(e) =>
                      updateFilter("interestRange", {
                        ...filters.interestRange,
                        max: Number(e.target.value),
                      })
                    }
                    className="w-20"
                  />
                  <span className="text-sm text-gray-500">%</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Aktif Krediler"
          value={summaryMetrics.activeCredits.toString()}
          subtitle={`${summaryMetrics.totalCredits} toplam kredi`}
          color="blue"
          icon={<CreditCard />}
          trend={summaryMetrics.activeCredits > 0 ? "up" : "neutral"}
        />
        <MetricCard
          title="Toplam Borç"
          value={formatCurrency(summaryMetrics.totalDebt)}
          subtitle="Kalan borç miktarı"
          color="red"
          icon={<DollarSign />}
          trend="down"
        />
        <MetricCard
          title="Aylık Ödeme"
          value={formatCurrency(summaryMetrics.monthlyPayment)}
          subtitle="Toplam aylık taksit"
          color="purple"
          icon={<Wallet />}
          trend="neutral"
        />
        <MetricCard
          title="Ödeme Performansı"
          value={formatPercent(summaryMetrics.paymentPerformance / 100)}
          subtitle={`${summaryMetrics.overduePayments} geciken ödeme`}
          color={
            summaryMetrics.paymentPerformance > 80
              ? "emerald"
              : summaryMetrics.paymentPerformance > 60
                ? "yellow"
                : "red"
          }
          icon={<Target />}
          trend={summaryMetrics.paymentPerformance > 80 ? "up" : "down"}
        />
      </div>

      {/* Charts Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Trendler</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Dağılım</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Performans</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Analiz</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Karşılaştırma</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  12 Aylık Ödeme Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
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
                      contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                    />
                    <Legend />
                    <Bar dataKey="odenen" fill="#10B981" name="Ödenen" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="bekleyen" fill="#F59E0B" name="Bekleyen" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="geciken" fill="#EF4444" name="Geciken" radius={[2, 2, 0, 0]} />
                    <Line type="monotone" dataKey="toplam" stroke="#3B82F6" strokeWidth={3} name="Toplam" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-600" />
                  Ödeme Durumu Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData.paymentStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={60}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Detaylı Trend Analizi
              </CardTitle>
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
                    contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
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

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
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
                      contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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

        <TabsContent value="performance" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-orange-600" />
                Ödeme Performans Analizi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatPercent(summaryMetrics.paymentPerformance / 100)}
                  </div>
                  <div className="text-sm text-green-700">Genel Performans</div>
                  <div className="text-xs text-green-600 mt-1">
                    {filteredPayments.filter((p) => p.status === "paid").length} / {filteredPayments.length} ödeme
                  </div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600 mb-2">{summaryMetrics.overduePayments}</div>
                  <div className="text-sm text-red-700">Geciken Ödemeler</div>
                  <div className="text-xs text-red-600 mt-1">
                    {formatCurrency(
                      filteredPayments
                        .filter((p) => p.status === "overdue")
                        .reduce((sum, p) => sum + (p.total_payment || 0), 0),
                    )}
                  </div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{summaryMetrics.upcomingPayments}</div>
                  <div className="text-sm text-blue-700">Yaklaşan Ödemeler</div>
                  <div className="text-xs text-blue-600 mt-1">Sonraki 7 gün</div>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" tickFormatter={(value) => `${value}%`} />
                  <Tooltip
                    formatter={(value: any, name: string) => [`${value.toFixed(1)}%`, "Ödeme Oranı"]}
                    contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
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

        <TabsContent value="analysis" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Faiz Oranı Analizi
              </CardTitle>
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
                    contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                  />
                  <Bar dataKey="rate" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  Banka Karşılaştırması
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.bankDistribution.slice(0, 5).map((bank, index) => (
                    <div key={bank.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{bank.name}</div>
                          <div className="text-sm text-gray-500">{bank.count} kredi</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(bank.value)}</div>
                        <div className="text-sm text-gray-500">Ort. %{bank.averageInterest.toFixed(1)} faiz</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-600" />
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
                      contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "8px" }}
                    />
                    <Bar dataKey="monthlyPayment" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Yaklaşan Ödemeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPayments
                .filter((p) => {
                  const dueDate = new Date(p.due_date)
                  const nextWeek = new Date()
                  nextWeek.setDate(nextWeek.getDate() + 7)
                  return p.status === "pending" && dueDate <= nextWeek
                })
                .slice(0, 3)
                .map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <BankLogo
                        bankName={payment.credits?.banks?.name || ""}
                        logoUrl={payment.credits?.banks?.logo_url}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium text-sm">{payment.credits?.banks?.name}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(payment.due_date), "dd MMM", { locale: tr })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm">{formatCurrency(payment.total_payment)}</div>
                    </div>
                  </div>
                ))}
              {summaryMetrics.upcomingPayments === 0 && (
                <div className="text-center py-4 text-gray-500">Yaklaşan ödeme bulunmuyor</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Geciken Ödemeler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredPayments
                .filter((p) => p.status === "overdue")
                .slice(0, 3)
                .map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <div className="flex items-center gap-2">
                      <BankLogo
                        bankName={payment.credits?.banks?.name || ""}
                        logoUrl={payment.credits?.banks?.logo_url}
                        size="sm"
                      />
                      <div>
                        <div className="font-medium text-sm">{payment.credits?.banks?.name}</div>
                        <div className="text-xs text-red-500">
                          {format(new Date(payment.due_date), "dd MMM", { locale: tr })} gecikti
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-red-600">{formatCurrency(payment.total_payment)}</div>
                    </div>
                  </div>
                ))}
              {summaryMetrics.overduePayments === 0 && (
                <div className="text-center py-4 text-gray-500">Geciken ödeme bulunmuyor</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Finansal Özet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Toplam Ödenen</span>
                <span className="font-bold text-green-600">{formatCurrency(summaryMetrics.totalPaidAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ortalama Faiz</span>
                <span className="font-bold">%{summaryMetrics.averageInterest.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Borç/Gelir Oranı</span>
                <span className="font-bold text-blue-600">Hesaplanıyor...</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Finansal Skor</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${summaryMetrics.paymentPerformance}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold">{Math.round(summaryMetrics.paymentPerformance)}/100</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
