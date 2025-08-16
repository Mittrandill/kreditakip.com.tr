"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart3, PieChart, TrendingUp, Download, Search, Filter, CalendarIcon, CreditCard, Building2, Wallet, AlertTriangle, FileText, Eye, ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw, DollarSign, Activity, Target } from 'lucide-react'
import { format } from "date-fns"
import { tr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
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
  AreaChart
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

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

export default function RaporlarPage() {
  const { user, loading: authLoading } = useAuth()
  const [credits, setCredits] = useState<PopulatedCredit[]>([])
  const [payments, setPayments] = useState<PopulatedPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBank, setSelectedBank] = useState<string>("all")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [activeTab, setActiveTab] = useState("genel-bakis")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const fetchData = async () => {
    if (!user?.id) return
    
    try {
      setLoading(true)
      setError(null)
      
      const [creditsData, paymentsData] = await Promise.all([
        getCredits(user.id) as Promise<PopulatedCredit[]>,
        getAllPayments(user.id, 12, 6) as Promise<PopulatedPayment[]>
      ])
      
      setCredits(creditsData || [])
      setPayments(paymentsData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
      setError("Veriler yüklenirken bir hata oluştu.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [user?.id])

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const activeCredits = credits.filter(c => c.status === 'active')
    const totalDebt = credits.reduce((sum, c) => sum + (c.remaining_debt || 0), 0)
    const monthlyPayment = activeCredits.reduce((sum, c) => sum + (c.monthly_payment || 0), 0)
    const averageInterest = credits.length > 0 
      ? credits.reduce((sum, c) => sum + (c.interest_rate || 0), 0) / credits.length 
      : 0

    // Calculate payment performance
    const paidPayments = payments.filter(p => p.status === 'paid').length
    const totalPayments = payments.length
    const paymentPerformance = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0

    return {
      totalCredits: credits.length,
      activeCredits: activeCredits.length,
      totalDebt,
      monthlyPayment,
      averageInterest,
      paymentPerformance
    }
  }, [credits, payments])

  // Chart data
  const monthlyTrendData = useMemo(() => {
    const last6Months = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const monthKey = format(date, 'yyyy-MM')
      const monthName = format(date, 'MMM', { locale: tr })
      
      const monthPayments = payments.filter(p => {
        const paymentDate = new Date(p.due_date)
        return format(paymentDate, 'yyyy-MM') === monthKey
      })
      
      const totalAmount = monthPayments.reduce((sum, p) => sum + (p.total_payment || 0), 0)
      const paidAmount = monthPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.total_payment || 0), 0)
      
      last6Months.push({
        month: monthName,
        toplam: totalAmount,
        odenen: paidAmount,
        bekleyen: totalAmount - paidAmount
      })
    }
    return last6Months
  }, [payments])

  const bankDistributionData = useMemo(() => {
    const bankData = credits.reduce((acc: any[], credit) => {
      const bankName = credit.banks?.name || 'Bilinmeyen Banka'
      const shortName = bankName.replace('Bankası', '').replace('Bank', '').trim()
      const existing = acc.find(item => item.name === shortName)
      if (existing) {
        existing.value += credit.remaining_debt || 0
        existing.count += 1
      } else {
        acc.push({
          name: shortName,
          value: credit.remaining_debt || 0,
          count: 1
        })
      }
      return acc
    }, [])
    
    return bankData.sort((a, b) => b.value - a.value).slice(0, 6)
  }, [credits])

  const creditTypeData = useMemo(() => {
    const typeData = credits.reduce((acc: any[], credit) => {
      const typeName = credit.credit_types?.name || 'Diğer'
      const existing = acc.find(item => item.name === typeName)
      if (existing) {
        existing.value += credit.remaining_debt || 0
        existing.count += 1
      } else {
        acc.push({
          name: typeName,
          value: credit.remaining_debt || 0,
          count: 1
        })
      }
      return acc
    }, [])
    
    return typeData.sort((a, b) => b.value - a.value)
  }, [credits])

  // Filter payments
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      const matchesSearch = searchTerm === "" || 
        payment.credits?.banks?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.credits?.credit_code?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesBank = selectedBank === "all" || payment.credits?.banks?.name === selectedBank
      const matchesStatus = selectedStatus === "all" || payment.status === selectedStatus
      
      let matchesDate = true
      if (dateFrom || dateTo) {
        const paymentDate = new Date(payment.due_date)
        if (dateFrom && paymentDate < dateFrom) matchesDate = false
        if (dateTo && paymentDate > dateTo) matchesDate = false
      }
      
      return matchesSearch && matchesBank && matchesStatus && matchesDate
    })
  }, [payments, searchTerm, selectedBank, selectedStatus, dateFrom, dateTo])

  // Paginated payments
  const paginatedPayments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredPayments.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredPayments, currentPage])

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)

  // Get unique banks
  const uniqueBanks = useMemo(() => {
    const banks = new Set<string>()
    payments.forEach(payment => {
      if (payment.credits?.banks?.name) banks.add(payment.credits.banks.name)
    })
    return Array.from(banks).sort()
  }, [payments])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-transparent hover:from-emerald-700 hover:to-teal-800">Ödendi</Badge>
      case 'pending':
        return <Badge className="bg-gradient-to-r from-amber-600 to-orange-700 text-white border-transparent hover:from-amber-700 hover:to-orange-800">Beklemede</Badge>
      case 'overdue':
        return <Badge className="bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent hover:from-red-700 hover:to-rose-800">Gecikmiş</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const resetFilters = () => {
    setSearchTerm("")
    setSelectedBank("all")
    setSelectedStatus("all")
    setDateFrom(undefined)
    setDateTo(undefined)
    setCurrentPage(1)
  }

  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 items-center justify-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
        <p className="text-lg text-gray-600">Raporlar yükleniyor...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-150px)]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <Button onClick={fetchData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tekrar Dene
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <BarChart3 className="h-8 w-8" />
                Kredi Raporları ve Analiz
              </h2>
              <p className="text-purple-100 text-lg">
                Kredilerinizin detaylı analizi, trend raporları ve finansal performans değerlendirmesi
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <PDFReportModal 
                userData={{
                  credits: credits.map(credit => ({
                    id: credit.id,
                    bankName: credit.banks?.name,
                    creditType: credit.credit_types?.name,
                    remainingDebt: credit.remaining_debt,
                    monthlyPayment: credit.monthly_payment,
                    interestRate: credit.interest_rate,
                    status: credit.status
                  })),
                  payments: payments.map(payment => ({
                    id: payment.id,
                    date: payment.payment_date || payment.due_date,
                    bankName: payment.credits?.banks?.name,
                    amount: payment.total_payment,
                    status: payment.status
                  })),
                  creditCards: [],
                  summary: { 
                    name: user?.full_name || 'Kullanıcı', 
                    email: user?.email || 'email@example.com'
                  }
                }}
                trigger={
                  <Button variant="outline-white" size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    PDF Rapor İndir
                  </Button>
                }
              />
              <Button variant="outline-white" size="lg">
                <Activity className="h-5 w-5 mr-2" />
                Detaylı Analiz
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Kredi Sayısı"
          value={summaryMetrics.totalCredits.toString()}
          subtitle={`${summaryMetrics.activeCredits} aktif kredi`}
          color="blue"
          icon={<CreditCard />}
        />
        <MetricCard
          title="Toplam Borç Tutarı"
          value={formatCurrency(summaryMetrics.totalDebt)}
          subtitle="Kalan borç miktarı"
          color="red"
          icon={<DollarSign />}
        />
        <MetricCard
          title="Aylık Ödeme Toplamı"
          value={formatCurrency(summaryMetrics.monthlyPayment)}
          subtitle="Toplam aylık taksit"
          color="purple"
          icon={<Wallet />}
        />
        <MetricCard
          title="Ödeme Performansı"
          value={formatPercent(summaryMetrics.paymentPerformance / 100)}
          subtitle="Zamanında ödeme oranı"
          color="emerald"
          icon={<Target />}
        />
      </div>

      {/* Modern Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 bg-transparent h-auto p-2 gap-2">
              <TabsTrigger
                value="genel-bakis"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Genel Bakış</span>
                <span className="sm:hidden font-medium">Genel</span>
              </TabsTrigger>
              <TabsTrigger
                value="trend-analizi"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Trend Analizi</span>
                <span className="sm:hidden font-medium">Trend</span>
              </TabsTrigger>
              <TabsTrigger
                value="banka-dagilim"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <Building2 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Banka Dağılımı</span>
                <span className="sm:hidden font-medium">Bankalar</span>
              </TabsTrigger>
              <TabsTrigger
                value="odeme-gecmisi"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:text-emerald-600 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Ödeme Geçmişi</span>
                <span className="sm:hidden font-medium">Geçmiş</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="genel-bakis">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        Son 6 Ay Ödeme Trendi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <AreaChart data={monthlyTrendData}>
                          <defs>
                            <linearGradient id="colorToplam" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOdenen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                          <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip 
                            formatter={(value: any, name: string) => [formatCurrency(value), name === 'toplam' ? 'Toplam' : name === 'odenen' ? 'Ödenen' : 'Bekleyen']}
                            contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="toplam" stroke="#3B82F6" fillOpacity={1} fill="url(#colorToplam)" strokeWidth={2} />
                          <Area type="monotone" dataKey="odenen" stroke="#10B981" fillOpacity={1} fill="url(#colorOdenen)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          <PieChart className="h-6 w-6 text-emerald-600" />
                        </div>
                        Kredi Türü Dağılımı
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={350}>
                        <RechartsPieChart>
                          <Pie
                            data={creditTypeData}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            innerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {creditTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => [formatCurrency(value), 'Borç Tutarı']} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="trend-analizi">
              <div className="space-y-6">
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <TrendingUp className="h-6 w-6 text-purple-600" />
                      </div>
                      6 Aylık Ödeme Trend Analizi
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={monthlyTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="month" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value: any, name: string) => [formatCurrency(value), name === 'toplam' ? 'Toplam Ödeme' : name === 'odenen' ? 'Ödenen' : 'Bekleyen']}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="toplam" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }} />
                        <Line type="monotone" dataKey="odenen" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }} />
                        <Line type="monotone" dataKey="bekleyen" stroke="#F59E0B" strokeWidth={3} dot={{ fill: '#F59E0B', strokeWidth: 2, r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="banka-dagilim">
              <div className="space-y-6">
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-emerald-100 rounded-lg">
                        <Building2 className="h-6 w-6 text-emerald-600" />
                      </div>
                      Bankalar Bazında Borç Dağılımı
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={bankDistributionData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" tickFormatter={(value) => formatCurrency(value)} />
                        <Tooltip 
                          formatter={(value: any) => [formatCurrency(value), 'Borç Tutarı']}
                          contentStyle={{ backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                        />
                        <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="odeme-gecmisi">
              <div className="space-y-6">
                {/* Filters */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Filter className="h-5 w-5 text-orange-600" />
                        </div>
                        Filtreler
                      </div>
                      <Button variant="outline" size="sm" onClick={resetFilters} className="text-gray-600 hover:text-gray-900 bg-transparent">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Temizle
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Banka veya kredi kodu ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      
                      <Select value={selectedBank} onValueChange={setSelectedBank}>
                        <SelectTrigger>
                          <SelectValue placeholder="Banka seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Bankalar</SelectItem>
                          {uniqueBanks.map(bank => (
                            <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Durum seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tüm Durumlar</SelectItem>
                          <SelectItem value="paid">Ödendi</SelectItem>
                          <SelectItem value="pending">Beklemede</SelectItem>
                          <SelectItem value="overdue">Gecikmiş</SelectItem>
                        </SelectContent>
                      </Select>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn(!dateFrom && "text-muted-foreground", "bg-transparent")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: tr }) : "Başlangıç"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateFrom}
                            onSelect={setDateFrom}
                            initialFocus
                            locale={tr}
                          />
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn(!dateTo && "text-muted-foreground", "bg-transparent")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: tr }) : "Bitiş"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={dateTo}
                            onSelect={setDateTo}
                            initialFocus
                            locale={tr}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CardContent>
                </Card>

                {/* Payments Table */}
                <Card className="shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-gray-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        Ödeme Geçmişi
                      </div>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 px-3 py-1">
                        {filteredPayments.length} kayıt
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {paginatedPayments.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Ödeme Kaydı Bulunamadı</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          {searchTerm || selectedBank !== "all" || selectedStatus !== "all" || dateFrom || dateTo
                            ? "Bu filtrelere uygun ödeme kaydı bulunamadı. Filtreleri değiştirerek tekrar deneyin."
                            : "Henüz ödeme kaydı bulunmuyor. İlk ödemenizi yaptıktan sonra burada görünecek."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-white dark:bg-gray-900">
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tarih</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Banka</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Kredi Kodu</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Taksit No</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Tutar</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">Durum</TableHead>
                                <TableHead className="font-semibold text-gray-700 dark:text-gray-300">İşlemler</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedPayments.map((payment, index) => (
                                <TableRow 
                                  key={payment.id}
                                  className={`hover:bg-emerald-50 dark:hover:bg-gray-800 transition-colors duration-150 ease-in-out ${
                                    index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"
                                  }`}
                                >
                                  <TableCell className="font-medium">
                                    {format(new Date(payment.due_date), 'dd MMM yyyy', { locale: tr })}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-3">
                                      <BankLogo
                                        bankName={payment.credits?.banks?.name || "Bilinmeyen Banka"}
                                        logoUrl={payment.credits?.banks?.logo_url}
                                        size="sm"
                                        className="ring-1 ring-emerald-200 bg-white"
                                      />
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {payment.credits?.banks?.name || 'Bilinmeyen Banka'}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm bg-gray-50 rounded px-2 py-1">
                                    {payment.credits?.credit_code || 'N/A'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="font-mono">
                                      #{payment.installment_number}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono font-semibold text-lg text-gray-900 dark:text-white">
                                    {formatCurrency(payment.total_payment)}
                                  </TableCell>
                                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-emerald-50 hover:text-emerald-600">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{filteredPayments.length}</span> kayıttan{' '}
                              <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span>-
                              <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredPayments.length)}</span>{' '}
                              arası gösteriliyor
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="bg-transparent"
                              >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Önceki
                              </Button>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                  const page = i + 1
                                  return (
                                    <Button
                                      key={page}
                                      variant={currentPage === page ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => setCurrentPage(page)}
                                      className={cn(
                                        "w-10 h-10 p-0",
                                        currentPage === page 
                                          ? "bg-emerald-600 text-white shadow-lg hover:bg-emerald-700" 
                                          : "bg-transparent hover:bg-gray-50"
                                      )}
                                    >
                                      {page}
                                    </Button>
                                  )
                                })}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="bg-transparent"
                              >
                                Sonraki
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
