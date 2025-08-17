"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MetricCard } from "@/components/metric-card"
import { BarChart } from "@/components/reports/BarChart"
import { LineChart } from "@/components/reports/LineChart"
import { PieChart } from "@/components/reports/PieChart"
import { PdfReportModal } from "@/components/pdf-report-modal"
import {
  FileText,
  Download,
  TrendingUp,
  CreditCard,
  Banknote,
  PieChartIcon,
  BarChart3,
  LineChartIcon,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  FileBarChart,
  Target,
  DollarSign,
  Percent,
} from "lucide-react"

import { useAuth } from "@/hooks/use-auth"
import { getCredits } from "@/lib/api/credits"
import { getPaymentHistory } from "@/lib/api/payments"
import { formatCurrency, formatNumber } from "@/lib/format"
import { useToast } from "@/hooks/use-toast"
import type { Credit, PaymentHistory } from "@/lib/types"
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns"
import { tr } from "date-fns/locale"

export default function RaporlarPage() {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const userId = user?.id

  const [credits, setCredits] = useState<Credit[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const [activeTab, setActiveTab] = useState("genel")
  const [searchTerm, setSearchTerm] = useState("")
  const [dateRange, setDateRange] = useState("6months")
  const [creditFilter, setCreditFilter] = useState("all")
  const [showPdfModal, setShowPdfModal] = useState(false)

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!userId) return

      try {
        setLoading(true)
        setError(null)

        const [creditsData, paymentsData] = await Promise.all([getCredits(userId), getPaymentHistory(userId)])

        setCredits(creditsData as Credit[])
        setPaymentHistory(paymentsData || [])
      } catch (err) {
        console.error("Rapor verileri yüklenirken hata:", err)
        setError("Veriler yüklenirken bir sorun oluştu.")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // Refresh data
  const handleRefresh = async () => {
    if (!userId) return

    try {
      setRefreshing(true)
      const [creditsData, paymentsData] = await Promise.all([getCredits(userId), getPaymentHistory(userId)])

      setCredits(creditsData as Credit[])
      setPaymentHistory(paymentsData || [])
      toast({ title: "Başarılı", description: "Veriler güncellendi." })
    } catch (err) {
      console.error("Veri yenileme hatası:", err)
      toast({ title: "Hata", description: "Veriler güncellenirken bir sorun oluştu.", variant: "destructive" })
    } finally {
      setRefreshing(false)
    }
  }

  // Filter data based on date range
  const getDateRangeFilter = () => {
    const now = new Date()
    switch (dateRange) {
      case "1month":
        return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(now) }
      case "3months":
        return { start: startOfMonth(subMonths(now, 3)), end: endOfMonth(now) }
      case "6months":
        return { start: startOfMonth(subMonths(now, 6)), end: endOfMonth(now) }
      case "1year":
        return { start: startOfMonth(subMonths(now, 12)), end: endOfMonth(now) }
      default:
        return { start: startOfMonth(subMonths(now, 6)), end: endOfMonth(now) }
    }
  }

  // Filtered data
  const filteredData = useMemo(() => {
    const dateFilter = getDateRangeFilter()

    let filteredCredits = credits
    const filteredPayments = paymentHistory.filter((payment) =>
      isWithinInterval(new Date(payment.payment_date), dateFilter),
    )

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filteredCredits = filteredCredits.filter(
        (credit) =>
          credit.bank_name?.toLowerCase().includes(searchLower) ||
          credit.credit_type?.toLowerCase().includes(searchLower),
      )
    }

    // Apply credit filter
    if (creditFilter !== "all") {
      filteredCredits = filteredCredits.filter((credit) => {
        switch (creditFilter) {
          case "active":
            return credit.status === "active"
          case "completed":
            return credit.status === "completed"
          case "overdue":
            return credit.status === "overdue"
          default:
            return true
        }
      })
    }

    return { credits: filteredCredits, payments: filteredPayments }
  }, [credits, paymentHistory, searchTerm, dateRange, creditFilter])

  // Calculate metrics
  const metrics = useMemo(() => {
    const { credits: filteredCredits, payments: filteredPayments } = filteredData

    const totalDebt = filteredCredits.reduce((sum, credit) => sum + (credit.remaining_amount || 0), 0)
    const totalOriginalAmount = filteredCredits.reduce((sum, credit) => sum + (credit.original_amount || 0), 0)
    const totalPaid = filteredPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    const averageInterestRate =
      filteredCredits.length > 0
        ? filteredCredits.reduce((sum, credit) => sum + (credit.interest_rate || 0), 0) / filteredCredits.length
        : 0

    const activeCredits = filteredCredits.filter((c) => c.status === "active").length
    const completedCredits = filteredCredits.filter((c) => c.status === "completed").length
    const overdueCredits = filteredCredits.filter((c) => c.status === "overdue").length

    return {
      totalDebt,
      totalOriginalAmount,
      totalPaid,
      averageInterestRate,
      activeCredits,
      completedCredits,
      overdueCredits,
      totalCredits: filteredCredits.length,
      totalPayments: filteredPayments.length,
    }
  }, [filteredData])

  // Chart data
  const chartData = useMemo(() => {
    const { credits: filteredCredits, payments: filteredPayments } = filteredData

    // Monthly payment data for line chart
    const monthlyPayments = filteredPayments.reduce(
      (acc, payment) => {
        const month = format(new Date(payment.payment_date), "yyyy-MM")
        acc[month] = (acc[month] || 0) + payment.amount
        return acc
      },
      {} as Record<string, number>,
    )

    const lineChartData = Object.entries(monthlyPayments)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: format(new Date(month + "-01"), "MMM yyyy", { locale: tr }),
        amount,
      }))

    // Bank distribution for pie chart
    const bankDistribution = filteredCredits.reduce(
      (acc, credit) => {
        const bank = credit.bank_name || "Bilinmeyen"
        acc[bank] = (acc[bank] || 0) + (credit.remaining_amount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const pieChartData = Object.entries(bankDistribution).map(([bank, amount]) => ({
      name: bank,
      value: amount,
    }))

    // Credit type distribution for bar chart
    const typeDistribution = filteredCredits.reduce(
      (acc, credit) => {
        const type = credit.credit_type || "Bilinmeyen"
        acc[type] = (acc[type] || 0) + (credit.remaining_amount || 0)
        return acc
      },
      {} as Record<string, number>,
    )

    const barChartData = Object.entries(typeDistribution).map(([type, amount]) => ({
      type,
      amount,
    }))

    return {
      lineChartData,
      pieChartData,
      barChartData,
    }
  }, [filteredData])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600 mb-4">{error}</p>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Tekrar Dene
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-red-600 to-rose-700 text-white border-transparent shadow-xl rounded-xl">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <FileBarChart className="h-8 w-8" />
                Finansal Raporlar ve Analizler
              </h2>
              <p className="opacity-90 text-lg">
                Kredileriniz ve ödemelerinizle ilgili detaylı raporlar ve görsel analizler.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm opacity-80">
                <span className="flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  {metrics.totalCredits} Kredi
                </span>
                <span className="flex items-center gap-1">
                  <Banknote className="h-4 w-4" />
                  {metrics.totalPayments} Ödeme
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                className="bg-white/20 hover:bg-white/30 border-white/50 text-white"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5 mr-2" />
                )}
                Yenile
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="bg-white text-red-700 hover:bg-gray-100 border-white"
                onClick={() => setShowPdfModal(true)}
              >
                <Download className="h-5 w-5 mr-2" />
                PDF İndir
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Toplam Borç"
          value={formatCurrency(metrics.totalDebt)}
          subtitle="kalan tutar"
          color="red"
          icon={<Target />}
        />
        <MetricCard
          title="Toplam Ödenen"
          value={formatCurrency(metrics.totalPaid)}
          subtitle="son dönem"
          color="emerald"
          icon={<CheckCircle />}
        />
        <MetricCard
          title="Ortalama Faiz"
          value={`%${metrics.averageInterestRate.toFixed(2)}`}
          subtitle="yıllık"
          color="blue"
          icon={<Percent />}
        />
        <MetricCard
          title="Aktif Krediler"
          value={formatNumber(metrics.activeCredits)}
          subtitle="adet"
          color="purple"
          icon={<Clock />}
        />
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Banka veya kredi türü ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[250px]"
                />
              </div>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Son 1 Ay</SelectItem>
                  <SelectItem value="3months">Son 3 Ay</SelectItem>
                  <SelectItem value="6months">Son 6 Ay</SelectItem>
                  <SelectItem value="1year">Son 1 Yıl</SelectItem>
                </SelectContent>
              </Select>
              <Select value={creditFilter} onValueChange={setCreditFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Krediler</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="completed">Tamamlanan</SelectItem>
                  <SelectItem value="overdue">Geciken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-gray-100 bg-gray-50/50">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 bg-white/50 backdrop-blur-sm h-auto p-2 gap-2 border border-gray-200 rounded-xl m-4">
              <TabsTrigger
                value="genel"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 rounded-xl transition-all duration-300 hover:bg-gray-100"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Genel</span>
              </TabsTrigger>
              <TabsTrigger
                value="odeme-analizi"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 rounded-xl transition-all duration-300 hover:bg-gray-100"
              >
                <LineChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Ödeme</span>
              </TabsTrigger>
              <TabsTrigger
                value="banka-dagilimi"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 rounded-xl transition-all duration-300 hover:bg-gray-100"
              >
                <PieChartIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Banka</span>
              </TabsTrigger>
              <TabsTrigger
                value="kredi-turleri"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 rounded-xl transition-all duration-300 hover:bg-gray-100"
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Türler</span>
              </TabsTrigger>
              <TabsTrigger
                value="performans"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 rounded-xl transition-all duration-300 hover:bg-gray-100"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Performans</span>
              </TabsTrigger>
              <TabsTrigger
                value="ozet"
                className="flex items-center gap-2 py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 rounded-xl transition-all duration-300 hover:bg-gray-100"
              >
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Özet</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="genel" className="space-y-6 mt-0">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-800">
                      <DollarSign className="h-5 w-5" />
                      Finansal Durum
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Toplam Orijinal Tutar:</span>
                      <span className="font-semibold text-blue-900">{formatCurrency(metrics.totalOriginalAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Kalan Borç:</span>
                      <span className="font-semibold text-blue-900">{formatCurrency(metrics.totalDebt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Ödenen Tutar:</span>
                      <span className="font-semibold text-green-700">{formatCurrency(metrics.totalPaid)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-emerald-800">
                      <CreditCard className="h-5 w-5" />
                      Kredi Durumu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Aktif Krediler:</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {metrics.activeCredits}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Tamamlanan:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {metrics.completedCredits}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Geciken:</span>
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        {metrics.overdueCredits}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="odeme-analizi" className="space-y-6 mt-0">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5" />
                    Aylık Ödeme Trendi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.lineChartData.length > 0 ? (
                    <LineChart data={chartData.lineChartData} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">Seçilen dönemde ödeme verisi bulunamadı.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="banka-dagilimi" className="space-y-6 mt-0">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Bankalara Göre Borç Dağılımı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.pieChartData.length > 0 ? (
                    <PieChart data={chartData.pieChartData} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">Görüntülenecek kredi verisi bulunamadı.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kredi-turleri" className="space-y-6 mt-0">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Kredi Türlerine Göre Dağılım
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {chartData.barChartData.length > 0 ? (
                    <BarChart data={chartData.barChartData} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">Görüntülenecek kredi türü verisi bulunamadı.</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performans" className="space-y-6 mt-0">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-purple-800">
                      <TrendingUp className="h-5 w-5" />
                      Ödeme Performansı
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-purple-700">Toplam Ödeme:</span>
                      <span className="font-semibold text-purple-900">{metrics.totalPayments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-700">Ortalama Faiz:</span>
                      <span className="font-semibold text-purple-900">%{metrics.averageInterestRate.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <AlertCircle className="h-5 w-5" />
                      Risk Analizi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-orange-700">Geciken Krediler:</span>
                      <Badge variant={metrics.overdueCredits > 0 ? "destructive" : "secondary"}>
                        {metrics.overdueCredits}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-orange-700">Risk Durumu:</span>
                      <Badge variant={metrics.overdueCredits > 0 ? "destructive" : "secondary"}>
                        {metrics.overdueCredits > 0 ? "Yüksek" : "Düşük"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ozet" className="space-y-6 mt-0">
              <div className="grid gap-6">
                <Card className="bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <Target className="h-5 w-5" />
                      Finansal Özet Raporu
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-blue-600">{metrics.totalCredits}</div>
                        <div className="text-sm text-gray-600">Toplam Kredi</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.totalPaid)}</div>
                        <div className="text-sm text-gray-600">Toplam Ödenen</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.totalDebt)}</div>
                        <div className="text-sm text-gray-600">Kalan Borç</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Önemli Notlar:</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {metrics.completedCredits} kredi başarıyla tamamlandı
                        </li>
                        <li className="flex items-start gap-2">
                          <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          {metrics.activeCredits} kredi aktif olarak devam ediyor
                        </li>
                        {metrics.overdueCredits > 0 && (
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            {metrics.overdueCredits} kredi gecikme durumunda
                          </li>
                        )}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* PDF Report Modal */}
      <PdfReportModal
        open={showPdfModal}
        onOpenChange={setShowPdfModal}
        credits={filteredData.credits}
        paymentHistory={filteredData.payments}
        metrics={metrics}
      />
    </div>
  )
}
