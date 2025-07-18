"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MetricCard } from "@/components/metric-card"
import BankLogo from "@/components/bank-logo"
import { PaginationModern } from "@/components/ui/pagination-modern"
import {
  BarChart3,
  Search,
  Download,
  FileText,
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  TrendingUp,
  Building2,
  Filter,
  Eye,
  Loader2,
  AlertCircle,
  PieChart,
  Activity,
  Wallet,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Percent,
  Banknote,
} from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getAllPayments } from "@/lib/api/payments"
import { getCreditCards, getCreditCardSummary } from "@/lib/api/credit-cards"
import type { Credit, Bank, CreditType, PaymentPlan, CreditCard } from "@/lib/types"
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import { PieChart as CustomPieChart } from "@/components/reports/PieChart"
import { BarChart as CustomBarChart } from "@/components/reports/BarChart"
import { LineChart as CustomLineChart } from "@/components/reports/LineChart"

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

// Chart data preparation functions
const prepareMonthlyBarData = (monthlyData: any[]) => {
  return monthlyData.map(item => ({
    name: new Date(item.month + "-01").toLocaleDateString('tr-TR', { month: 'short' }),
    value: item.amount,
    color: "#10b981"
  }))
}

const prepareDebtPieData = (creditDebt: number, cardDebt: number) => {
  const data = []
  if (creditDebt > 0) {
    data.push({ name: "Krediler", value: creditDebt, color: "#3b82f6" })
  }
  if (cardDebt > 0) {
    data.push({ name: "Kredi Kartları", value: cardDebt, color: "#8b5cf6" })
  }
  return data
}

const prepareBankDistributionData = (bankDistribution: any[]) => {
  const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#6b7280"]
  return bankDistribution.slice(0, 6).map((bank, index) => ({
    name: bank.bank,
    value: bank.debt,
    color: colors[index % colors.length]
  }))
}

const prepareCardUtilizationData = (creditCards: CreditCard[]) => {
  return creditCards.filter(card => card.is_active).map(card => ({
    name: card.card_name,
    value: card.utilization_rate,
    color: card.utilization_rate > 80 ? "#ef4444" : card.utilization_rate > 50 ? "#f59e0b" : "#10b981"
  }))
}

const preparePaymentTrendData = (allPayments: any[]) => {
  const last12Months = []
  const now = new Date()
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const monthName = date.toLocaleDateString('tr-TR', { month: 'short' })
    
    const monthPayments = allPayments.filter(payment => {
      if (payment.status === "paid" && payment.payment_date) {
        const paymentDate = new Date(payment.payment_date)
        return paymentDate.getFullYear() === date.getFullYear() && 
               paymentDate.getMonth() === date.getMonth()
      }
      return false
    })
    
    const totalAmount = monthPayments.reduce((sum, p) => sum + p.total_payment, 0)
    last12Months.push({
      name: monthName,
      value: totalAmount,
      date: monthKey
    })
  }
  
  return last12Months
}

const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case "paid":
      return "bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent"
    case "pending":
      return "bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-transparent"
    case "overdue":
      return "bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent"
    default:
      return "bg-gradient-to-r from-gray-600 to-slate-700 text-white border-transparent"
  }
}

const getStatusText = (status: string): string => {
  switch (status) {
    case "paid":
      return "Ödendi"
    case "pending":
      return "Beklemede"
    case "overdue":
      return "Gecikmiş"
    default:
      return status
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "paid":
      return <CheckCircle className="h-3 w-3 text-white" />
    case "pending":
      return <Clock className="h-3 w-3 text-white" />
    case "overdue":
      return <AlertTriangle className="h-3 w-3 text-white" />
    default:
      return <Clock className="h-3 w-3 text-white" />
  }
}

export default function RaporlarPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [allCredits, setAllCredits] = useState<PopulatedCredit[]>([])
  const [allPayments, setAllPayments] = useState<PopulatedPayment[]>([])
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [creditCardSummary, setCreditCardSummary] = useState<any>({})
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState("genel-bakis")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBank, setFilterBank] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [dateRange, setDateRange] = useState("thisMonth")
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 10

  useEffect(() => {
    let isMounted = true

    async function fetchData() {
      if (user?.id && isMounted) {
        setLoadingData(true)
        setError(null)
        try {
          // Fetch all data in parallel
          const [creditsData, paymentsData, creditCardsData, creditCardSummaryData] = await Promise.all([
            getCredits(user.id) as Promise<PopulatedCredit[]>,
            getAllPayments(user.id, 12, 6) as Promise<PopulatedPayment[]>,
            getCreditCards(user.id),
            getCreditCardSummary(user.id)
          ])

          if (isMounted) {
            setAllCredits(creditsData || [])
            setAllPayments(paymentsData || [])
            setCreditCards(creditCardsData || [])
            setCreditCardSummary(creditCardSummaryData || {})
            console.log("📊 Raporlar verisi yüklendi:", {
              credits: creditsData?.length || 0,
              payments: paymentsData?.length || 0,
              creditCards: creditCardsData?.length || 0
            })
          }
        } catch (err) {
          console.error("Raporlar data fetch error:", err)
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

  // Filter payments based on search and filters
  const filteredPayments = useMemo(() => {
    let filtered = allPayments.filter((payment) => {
      const matchesSearch = 
        payment.credits?.banks?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.credits?.credit_code?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesBank = filterBank === "all" || payment.credits?.banks?.name === filterBank
      const matchesStatus = filterStatus === "all" || payment.status === filterStatus
      
      // Date range filter
      const paymentDate = new Date(payment.due_date)
      const now = new Date()
      let matchesDate = true
      
      if (dateRange === "thisMonth") {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        matchesDate = paymentDate >= startOfMonth && paymentDate <= endOfMonth
      } else if (dateRange === "lastMonth") {
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        matchesDate = paymentDate >= startOfLastMonth && paymentDate <= endOfLastMonth
      } else if (dateRange === "last3Months") {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        matchesDate = paymentDate >= threeMonthsAgo
      }

      return matchesSearch && matchesBank && matchesStatus && matchesDate
    })

    return filtered.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
  }, [allPayments, searchTerm, filterBank, filterStatus, dateRange])

  // Pagination
  const totalItems = filteredPayments.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredPayments.slice(startIndex, endIndex)

  // Calculate metrics from real data
  const activeCredits = allCredits.filter(c => c.status === "active")
  const totalActiveDebt = activeCredits.reduce((sum, c) => sum + c.remaining_debt, 0)
  
  const currentMonth = new Date()
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
  
  const thisMonthPayments = allPayments.filter(p => {
    const paymentDate = new Date(p.due_date)
    return paymentDate >= startOfMonth && paymentDate <= endOfMonth && p.status === "pending"
  })
  const totalUpcomingPayments = thisMonthPayments.reduce((sum, p) => sum + p.total_payment, 0)
  
  const overduePayments = allPayments.filter(p => {
    const paymentDate = new Date(p.due_date)
    return paymentDate < new Date() && p.status === "pending"
  })
  const totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.total_payment, 0)

  // Get unique banks for filter
  const uniqueBanks = Array.from(new Set(
    allPayments
      .map(p => p.credits?.banks?.name)
      .filter(Boolean)
  ))

  // Bank distribution data
  const bankDistribution = useMemo(() => {
    const bankDebts: { [key: string]: number } = {}
    activeCredits.forEach(credit => {
      const bankName = credit.banks?.name || "Diğer"
      bankDebts[bankName] = (bankDebts[bankName] || 0) + credit.remaining_debt
    })
    
    creditCards.forEach(card => {
      const bankName = card.bank_name || "Diğer"
      bankDebts[bankName] = (bankDebts[bankName] || 0) + card.current_debt
    })

    return Object.entries(bankDebts)
      .map(([bank, debt]) => ({ bank, debt }))
      .sort((a, b) => b.debt - a.debt)
  }, [activeCredits, creditCards])

  // Monthly summary data
  const monthlyData = useMemo(() => {
    const months: { [key: string]: { payments: number, amount: number } } = {}
    
    allPayments.forEach(payment => {
      if (payment.status === "paid" && payment.payment_date) {
        const date = new Date(payment.payment_date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        
        if (!months[monthKey]) {
          months[monthKey] = { payments: 0, amount: 0 }
        }
        
        months[monthKey].payments += 1
        months[monthKey].amount += payment.total_payment
      }
    })

    return Object.entries(months)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
  }, [allPayments])

  const handleExportPDF = () => {
    toast({
      title: "PDF Export",
      description: "Rapor PDF olarak dışa aktarılıyor...",
    })
    // Here you would implement actual PDF export functionality
  }

  const resetPagination = () => setCurrentPage(1)

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
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                Raporlar
              </h2>
              <p className="text-emerald-100 text-lg">
                Kredi ve finansal verilerinizin detaylı analizi ve raporları
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline-white"
                size="lg"
                onClick={handleExportPDF}
              >
                <Download className="h-5 w-5 mr-2" />
                Raporu PDF Olarak İndir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <TabsList className="grid grid-cols-5 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="genel-bakis"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Genel Bakış</span>
                <span className="sm:hidden font-medium">Genel</span>
              </TabsTrigger>
              <TabsTrigger
                value="kredi-kartlari"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Kredi Kartları</span>
                <span className="sm:hidden font-medium">Kartlar</span>
              </TabsTrigger>
              <TabsTrigger
                value="kredi-odemeleri"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Kredi Ödemeleri</span>
                <span className="sm:hidden font-medium">Ödemeler</span>
              </TabsTrigger>
              <TabsTrigger
                value="aylik-ozet"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Aylık Özet</span>
                <span className="sm:hidden font-medium">Aylık</span>
              </TabsTrigger>
              <TabsTrigger
                value="banka-dagilim"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Bankaya Göre</span>
                <span className="sm:hidden font-medium">Banka</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Genel Bakış Tab */}
          <TabsContent value="genel-bakis" className="p-6 space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Toplam Aktif Borç"
                value={formatCurrency(totalActiveDebt + (creditCardSummary.totalCurrentDebt || 0))}
                subtitle={`${activeCredits.length + (creditCards.filter(c => c.is_active).length)} aktif hesap`}
                color="red"
                icon={<Banknote />}
              />
              <MetricCard
                title="Bu Ay Ödemeler"
                value={formatCurrency(totalUpcomingPayments)}
                subtitle={`${thisMonthPayments.length} ödeme`}
                color="blue"
                icon={<Calendar />}
              />
              <MetricCard
                title="Geciken Ödemeler"
                value={formatCurrency(totalOverdueAmount)}
                subtitle={`${overduePayments.length} geciken ödeme`}
                color="red"
                icon={<AlertTriangle />}
              />
              <MetricCard
                title="Kart Kullanım Oranı"
                value={formatPercent(creditCardSummary.averageUtilizationRate || 0)}
                subtitle="ortalama kullanım"
                color="orange"
                icon={<Percent />}
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                    Aylık Ödeme Trendi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart data={prepareMonthlyBarData(monthlyData)} height={300} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    Borç Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomPieChart data={prepareDebtPieData(
                    totalActiveDebt,
                    creditCardSummary.totalCurrentDebt || 0
                  )} />
                </CardContent>
              </Card>
            </div>

            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="text-emerald-700 flex items-center gap-2">
                    <ArrowUpRight className="h-5 w-5" />
                    Güçlü Yanlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-emerald-600">
                    <li>• Zamanında ödeme oranınız yüksek</li>
                    <li>• Aktif {activeCredits.length} kredi hesabı</li>
                    <li>• Kredi kartı kullanım oranı kontrol altında</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardHeader>
                  <CardTitle className="text-yellow-700 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Dikkat Edilmesi Gerekenler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-yellow-600">
                    <li>• {overduePayments.length > 0 ? `${overduePayments.length} geciken ödeme var` : "Tüm ödemeler güncel"}</li>
                    <li>• Bu ay {formatCurrency(totalUpcomingPayments)} ödeme</li>
                    <li>• Toplam borç takibi önemli</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-blue-700 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Öneriler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-blue-600">
                    <li>• Düzenli ödeme planı oluşturun</li>
                    <li>• Kredi kartı borcunuzu minimize edin</li>
                    <li>• Faiz oranlarını karşılaştırın</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Kredi Kartları Tab */}
          <TabsContent value="kredi-kartlari" className="p-6 space-y-6">
            {/* Credit Card Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Toplam Limit"
                value={formatCurrency(creditCardSummary.totalCreditLimit || 0)}
                subtitle="kredi limiti"
                color="blue"
                icon={<DollarSign />}
              />
              <MetricCard
                title="Mevcut Borç"
                value={formatCurrency(creditCardSummary.totalCurrentDebt || 0)}
                subtitle="toplam borç"
                color="red"
                icon={<CreditCard />}
              />
              <MetricCard
                title="Kullanılabilir"
                value={formatCurrency(creditCardSummary.totalAvailableLimit || 0)}
                subtitle="kalan limit"
                color="emerald"
                icon={<CheckCircle />}
              />
              <MetricCard
                title="Aktif Kart"
                value={formatNumber(creditCardSummary.activeCards || 0)}
                subtitle={`${creditCards.length} toplam kart`}
                color="purple"
                icon={<CreditCard />}
              />
            </div>

            {/* Credit Card Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    Kart Kullanım Oranları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomPieChart data={prepareCardUtilizationData(creditCards)} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Aylık Kart Harcamaları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart 
                    data={creditCards.slice(0, 6).map(card => ({
                      name: card.card_name.length > 10 ? card.card_name.substring(0, 10) + '...' : card.card_name,
                      value: card.current_debt,
                      color: card.utilization_rate > 80 ? "#ef4444" : "#8b5cf6"
                    }))}
                    height={300}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Credit Cards Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-purple-600" />
                  Kredi Kartı Detayları
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white">
                        <TableHead className="font-semibold text-gray-700">Kart Adı</TableHead>
                        <TableHead className="font-semibold text-gray-700">Banka</TableHead>
                        <TableHead className="font-semibold text-gray-700">Limit</TableHead>
                        <TableHead className="font-semibold text-gray-700">Borç</TableHead>
                        <TableHead className="font-semibold text-gray-700">Kullanım %</TableHead>
                        <TableHead className="font-semibold text-gray-700">Durum</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {creditCards.slice(0, 5).map((card, index) => (
                        <TableRow
                          key={card.id}
                          className={`hover:bg-emerald-50 transition-colors duration-150 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                          }`}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <BankLogo
                                bankName={card.bank_name || "Bilinmeyen Banka"}
                                logoUrl={card.banks?.logo_url}
                                size="sm"
                                className="ring-1 ring-purple-200 bg-white"
                              />
                              <span className="font-medium text-gray-900">{card.card_name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">{card.bank_name}</TableCell>
                          <TableCell className="font-semibold text-gray-900">
                            {formatCurrency(card.credit_limit)}
                          </TableCell>
                          <TableCell className="font-semibold text-gray-900">
                            {formatCurrency(card.current_debt)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                card.utilization_rate > 80 ? "text-red-600" :
                                card.utilization_rate > 50 ? "text-yellow-600" : "text-emerald-600"
                              }`}>
                                {formatPercent(card.utilization_rate)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${card.is_active ? "bg-gradient-to-r from-emerald-600 to-teal-700" : "bg-gradient-to-r from-gray-600 to-slate-700"} text-white border-transparent`}>
                              {card.is_active ? "Aktif" : "Pasif"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kredi Ödemeleri Tab */}
          <TabsContent value="kredi-odemeleri" className="p-6 space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-emerald-600" />
                  Filtreler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Banka adı veya kredi kodu ile ara..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          resetPagination()
                        }}
                        className="pl-8 w-[250px]"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filterBank} onValueChange={(value) => {
                      setFilterBank(value)
                      resetPagination()
                    }}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Banka" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Bankalar</SelectItem>
                        {uniqueBanks.map((bank) => (
                          <SelectItem key={bank} value={bank!}>
                            {bank}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterStatus} onValueChange={(value) => {
                      setFilterStatus(value)
                      resetPagination()
                    }}>
                      <SelectTrigger className="w-[130px]">
                        <SelectValue placeholder="Durum" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Durumlar</SelectItem>
                        <SelectItem value="paid">Ödendi</SelectItem>
                        <SelectItem value="pending">Beklemede</SelectItem>
                        <SelectItem value="overdue">Gecikmiş</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={dateRange} onValueChange={(value) => {
                      setDateRange(value)
                      resetPagination()
                    }}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Tarih" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tüm Zamanlar</SelectItem>
                        <SelectItem value="thisMonth">Bu Ay</SelectItem>
                        <SelectItem value="lastMonth">Geçen Ay</SelectItem>
                        <SelectItem value="last3Months">Son 3 Ay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payments Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-emerald-600" />
                    Ödeme Geçmişi
                  </CardTitle>
                  <Badge variant="outline" className="border-emerald-600/30 text-emerald-600">
                    {filteredPayments.length} kayıt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {currentItems.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Ödeme Kaydı Bulunamadı</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm || filterBank !== "all" || filterStatus !== "all" || dateRange !== "all"
                        ? "Bu filtrelere uygun ödeme kaydı bulunamadı."
                        : "Henüz ödeme kaydı bulunmuyor."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-white">
                            <TableHead className="font-semibold text-gray-700">Banka</TableHead>
                            <TableHead className="font-semibold text-gray-700">Kredi Kodu</TableHead>
                            <TableHead className="font-semibold text-gray-700">Vade Tarihi</TableHead>
                            <TableHead className="font-semibold text-gray-700">Taksit No</TableHead>
                            <TableHead className="font-semibold text-gray-700">Tutar</TableHead>
                            <TableHead className="font-semibold text-gray-700">Durum</TableHead>
                            <TableHead className="font-semibold text-gray-700">Ödeme Tarihi</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-right">İşlemler</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentItems.map((payment, index) => (
                            <TableRow
                              key={payment.id}
                              className={`hover:bg-emerald-50 transition-colors duration-150 ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                              }`}
                            >
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <BankLogo
                                    bankName={payment.credits?.banks?.name || "Bilinmeyen Banka"}
                                    logoUrl={payment.credits?.banks?.logo_url}
                                    size="sm"
                                    className="ring-1 ring-emerald-200 bg-white"
                                  />
                                  <span className="font-medium text-gray-900">
                                    {payment.credits?.banks?.name || "N/A"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                <span className="font-mono text-sm">
                                  {payment.credits?.credit_code || "N/A"}
                                </span>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {new Date(payment.due_date).toLocaleDateString('tr-TR')}
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {payment.installment_number}
                              </TableCell>
                              <TableCell className="font-semibold text-gray-900">
                                {formatCurrency(payment.total_payment)}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${getStatusBadgeClass(payment.status)} flex items-center gap-1 w-fit`}>
                                  {getStatusIcon(payment.status)}
                                  {getStatusText(payment.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('tr-TR') : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {totalPages > 1 && (
                      <PaginationModern
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        itemName="ödeme"
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aylık Özet Tab */}
          <TabsContent value="aylik-ozet" className="p-6 space-y-6">
            {/* Monthly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Bu Ay Ödemeler"
                value={formatNumber(thisMonthPayments.length)}
                subtitle="toplam ödeme"
                color="blue"
                icon={<Calendar />}
              />
              <MetricCard
                title="Bu Ay Tutar"
                value={formatCurrency(totalUpcomingPayments)}
                subtitle="ödeme tutarı"
                color="emerald"
                icon={<DollarSign />}
              />
              <MetricCard
                title="Tamamlanan"
                value={formatNumber(allPayments.filter(p => p.status === "paid" && new Date(p.payment_date || p.due_date) >= startOfMonth && new Date(p.payment_date || p.due_date) <= endOfMonth).length)}
                subtitle="ödeme"
                color="emerald"
                icon={<CheckCircle />}
              />
              <MetricCard
                title="Bekleyen"
                value={formatNumber(thisMonthPayments.length)}
                subtitle="ödeme"
                color="orange"
                icon={<Clock />}
              />
            </div>

            {/* Monthly Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-600" />
                    Aylık Ödeme Trend Analizi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomBarChart data={preparePaymentTrendData(allPayments)} height={300} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Ödeme Performansı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomLineChart 
                    data={preparePaymentTrendData(allPayments).map(item => ({
                      ...item,
                      value: Math.random() * 100 // Mock payment success rate data
                    }))}
                    height={300}
                    color="#3b82f6"
                  />
                </CardContent>
              </Card>
            </div>

            {/* Monthly Payment Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Aylık Ödeme Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white">
                        <TableHead className="font-semibold text-gray-700">Ay</TableHead>
                        <TableHead className="font-semibold text-gray-700">Toplam Ödeme</TableHead>
                        <TableHead className="font-semibold text-gray-700">Tutar</TableHead>
                        <TableHead className="font-semibold text-gray-700">Ortalama</TableHead>
                        <TableHead className="font-semibold text-gray-700">Trend</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {monthlyData.map((month, index) => (
                        <TableRow key={month.month} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                          <TableCell className="font-medium text-gray-900">
                            {new Date(month.month + "-01").toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                          </TableCell>
                          <TableCell className="text-gray-600">{month.payments}</TableCell>
                          <TableCell className="font-semibold text-gray-900">{formatCurrency(month.amount)}</TableCell>
                          <TableCell className="text-gray-600">
                            {month.payments > 0 ? formatCurrency(month.amount / month.payments) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {index > 0 && monthlyData[index - 1] ? (
                                month.amount > monthlyData[index - 1].amount ? (
                                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                                ) : (
                                  <ArrowDownRight className="h-4 w-4 text-emerald-500" />
                                )
                              ) : (
                                <div className="h-4 w-4" />
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bankaya Göre Dağılım Tab */}
          <TabsContent value="banka-dagilim" className="p-6 space-y-6">
            {/* Bank Distribution Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Toplam Banka"
                value={formatNumber(uniqueBanks.length)}
                subtitle="farklı banka"
                color="blue"
                icon={<Building2 />}
              />
              <MetricCard
                title="En Yüksek Borç"
                value={bankDistribution.length > 0 ? formatCurrency(bankDistribution[0].debt) : formatCurrency(0)}
                subtitle={bankDistribution.length > 0 ? bankDistribution[0].bank : "N/A"}
                color="red"
                icon={<TrendingUp />}
              />
              <MetricCard
                title="Ortalama Borç"
                value={formatCurrency(
                  bankDistribution.length > 0 
                    ? bankDistribution.reduce((sum, b) => sum + b.debt, 0) / bankDistribution.length
                    : 0
                )}
                subtitle="banka başına"
                color="orange"
                icon={<BarChart3 />}
              />
              <MetricCard
                title="Aktif İlişki"
                value={formatNumber(
                  bankDistribution.filter(b => b.debt > 0).length
                )}
                subtitle="borcu olan banka"
                color="emerald"
                icon={<CheckCircle />}
              />
            </div>

            {/* Bank Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Banka Bazında Borç Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CustomPieChart data={prepareBankDistributionData(bankDistribution)} />
              </CardContent>
            </Card>

            {/* Bank Distribution Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  Banka Detaylı Analiz
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white">
                        <TableHead className="font-semibold text-gray-700">Banka</TableHead>
                        <TableHead className="font-semibold text-gray-700">Toplam Borç</TableHead>
                        <TableHead className="font-semibold text-gray-700">Kredi Sayısı</TableHead>
                        <TableHead className="font-semibold text-gray-700">Kart Sayısı</TableHead>
                        <TableHead className="font-semibold text-gray-700">Oran</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bankDistribution.map((bank, index) => {
                        const bankCredits = activeCredits.filter(c => c.banks?.name === bank.bank)
                        const bankCards = creditCards.filter(c => c.bank_name === bank.bank)
                        const totalDebt = bankDistribution.reduce((sum, b) => sum + b.debt, 0)
                        const percentage = totalDebt > 0 ? (bank.debt / totalDebt) * 100 : 0
                        
                        return (
                          <TableRow key={bank.bank} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <BankLogo
                                  bankName={bank.bank}
                                  logoUrl={bankCredits[0]?.banks?.logo_url || bankCards[0]?.banks?.logo_url}
                                  size="sm"
                                  className="ring-1 ring-emerald-200 bg-white"
                                />
                                <span className="font-medium text-gray-900">{bank.bank}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-gray-900">
                              {formatCurrency(bank.debt)}
                            </TableCell>
                            <TableCell className="text-gray-600">{bankCredits.length}</TableCell>
                            <TableCell className="text-gray-600">{bankCards.length}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, percentage)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-600">
                                  {formatPercent(percentage)}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}